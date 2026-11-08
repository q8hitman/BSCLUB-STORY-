// Duck Radio director: decides IF a duck speaks, WHO speaks, WHICH expression, and WHAT they say.
// Ducks are companions only (no perks). They adapt to how the player is doing:
//  - struggling (low energy or repeated setbacks): a hint computed from the REAL odds, so it is never wrong;
//  - doing well: praise, or a real science fact from the fact catalogue;
//  - otherwise: occasional character lines. Deterministic per (seed, beat, stage); works without AI.
import { DUCKS, DUCK_BY_ID, MOOD_EXPRESSION, resolveDuckId, type Expression } from '../content/ducks';
import { APPROACH, HELP, RADIO, type RadioCue } from '../content/duckRadio';
import { FACTS } from '../content/world';
import { derive, partForStat } from './creature';
import { Rng } from './rng';
import { currentBeat } from './story';
import type { BeatTemplate, BiomeId, DuckMood, GameState, L10n } from './types';

export interface RadioLine { duck: string; expression: Expression; text: L10n; kind: 'chat' | 'hint' | 'praise' | 'fact'; hintChoice?: string }

const DEEP: BiomeId[] = ['twilight', 'midnight', 'vents', 'trench'];
const FACT_PREFIX: Partial<Record<BiomeId, string[]>> = {
  lab: ['lab-'], forest: ['forest-'], desert: ['desert-'], mountain: ['mountain-'], cave: ['cave-'], snow: ['snow-'], swamp: ['swamp-'], ruins: ['ruins-'],
  reef: ['reef-'], mudflat: ['mud-'], seagrass: ['seagrass-'], openSea: ['sea-', 'pearl-', 'bathysphere-'], twilight: ['twilight-', 'squid-', 'dragonfish-'],
  midnight: ['midnight-', 'angler-', 'gulper-', 'viperfish-', 'dragonfish-'], vents: ['vents-'], trench: ['trench-', 'whalefall'],
};

/** The run's crew: the chosen duck plus two others, fixed for the whole run. */
export function crew(s: GameState): string[] {
  const lead = resolveDuckId(s.duck);
  const others = Rng.from(s.seed, 'crew').shuffle(DUCKS.map((d) => d.id).filter((id) => id !== lead));
  return [lead, others[0], others[1]];
}

export function struggling(s: GameState): boolean {
  const last = s.log.slice(-2);
  return s.energy <= 2 || (last.length === 2 && last.every((l) => !l.success));
}
export function thriving(s: GameState): boolean {
  const last = s.log.slice(-2);
  return s.energy >= 4 && last.length === 2 && last.every((l) => l.success);
}

const fillT = (t: L10n, v: Record<string, L10n>): L10n => ({
  en: t.en.replace(/\{(\w+)\}/g, (_, k: string) => v[k]?.en ?? ''),
  ar: t.ar.replace(/\{(\w+)\}/g, (_, k: string) => v[k]?.ar ?? ''),
});

/** A correct hint: points at a choice with the best real odds, via the body part or the approach that makes it work. */
export function hintFor(s: GameState, duck: string): { text: L10n; choice: string } | null {
  if (s.stage !== 'beat') return null;
  const v = currentBeat(s);
  const scored = v.choices.map((c) => ({ c: c.choice, p: c.odds ?? 1 }));
  const best = Math.max(...scored.map((x) => x.p));
  const top = scored.filter((x) => x.p >= best - 1e-9);
  if (top.length === scored.length) return null; // every option is equally good: nothing useful to hint
  const h = HELP[duck]; if (!h) return null;
  const d = derive(s.creature);
  const anat = top.find((x) => x.c.check?.caps?.some((cap) => d.caps.has(cap)));
  if (anat?.c.check) {
    const part = partForStat(d, anat.c.check.stat, anat.c.check.caps?.filter((cap) => d.caps.has(cap)));
    if (part) return { text: fillT(h.hintPart, { part: part.name }), choice: anat.c.id };
  }
  // An approach hint is only given when that approach is unambiguous (no weaker option shares the style).
  const pick = top[0];
  if (scored.some((x) => x.p < best - 1e-9 && x.c.style === pick.c.style)) return null;
  return { text: fillT(h.hintApproach, { approach: APPROACH[pick.c.style] }), choice: pick.c.id };
}

function factFor(s: GameState, biome: BiomeId, r: Rng): L10n | null {
  const prefixes = FACT_PREFIX[biome] ?? [];
  const pool = FACTS.filter((f) => prefixes.some((p) => f.id.startsWith(p)) && !s.discoveries.includes(f.id));
  return pool.length ? r.pick(pool).text : null;
}

function line(r: Rng, duck: string, cue: RadioCue): L10n | null {
  const pool = RADIO[duck]?.[cue];
  return pool?.length ? r.pick(pool) : null;
}

export function radio(s: GameState, kind: BeatTemplate['kind'], biome: BiomeId): RadioLine[] {
  const r = Rng.from(s.seed, `radio${s.index}${s.stage}`);
  const [lead, ...rest] = crew(s);
  const speaker = r.chance(0.65) ? lead : r.pick(rest);
  const deep = DEEP.includes(biome);

  if (s.stage === 'beat') {
    if (struggling(s) && r.chance(0.85)) {
      const h = hintFor(s, speaker);
      if (h) return [{ duck: speaker, expression: 'curious', text: h.text, kind: 'hint', hintChoice: h.choice }];
    }
    const tense = kind === 'challenge' || kind === 'climax' || kind === 'twist';
    if (!r.chance(tense ? 0.5 : 0.35)) return [];
    const cue: RadioCue = deep && r.chance(0.6) ? 'deep' : tense ? 'danger' : r.chance(0.18) ? 'theory' : 'arrive';
    const t = line(r, speaker, cue); if (!t) return [];
    return [{ duck: speaker, expression: cue === 'danger' || cue === 'deep' ? 'worried' : cue === 'theory' ? 'sly' : 'curious', text: t, kind: 'chat' }];
  }

  const o = s.lastOutcome; if (!o) return [];
  if (thriving(s) && r.chance(0.7)) {
    const h = HELP[speaker]; if (!h) return [];
    const fact = r.chance(0.5) ? factFor(s, biome, r) : null;
    if (fact) return [{ duck: speaker, expression: 'happy', text: { en: `${h.fact.en} ${fact.en}`, ar: `${h.fact.ar} ${fact.ar}` }, kind: 'fact' }];
    return [{ duck: speaker, expression: 'laughing', text: r.pick(h.praise), kind: 'praise' }];
  }
  if (!r.chance(0.65)) return [];
  const out: RadioLine[] = [];
  const last = s.log[s.log.length - 1];
  const found = s.evidence.length + s.discoveries.length > 0 && r.chance(0.3);
  const cue: RadioCue = last?.style === 'silly' && r.chance(0.6) ? 'comic' : !o.success ? 'fail' : found ? 'discovery' : 'success';
  const t = line(r, speaker, cue);
  if (t) out.push({ duck: speaker, expression: MOOD_EXPRESSION[o.mood as DuckMood] ?? 'happy', text: t, kind: 'chat' });
  if (out.length && r.chance(0.22)) {
    const other = rest.find((d) => d !== speaker) ?? rest[0];
    const t2 = line(r, other, r.chance(0.5) ? 'disagree' : cue);
    if (t2) out.push({ duck: other, expression: 'sly', text: t2, kind: 'chat' });
  }
  return out;
}

export const duckName = (id: string) => DUCK_BY_ID[id]?.name;
