// Duck Radio director: decides IF a duck speaks, WHO speaks, WHICH expression, and WHAT they say.
// Ducks are companions only (no perks). They adapt to how the player is doing:
//  - struggling (low energy or repeated setbacks): a HUNCH from the duck's own temperament. It is NOT computed from the
//    odds, so it can be wrong — ducks never hand out guaranteed answers or spoilers;
//  - after some scenes: a Specialty Field Note from that duck's science field (collected in the Explorer Journal);
//  - doing well: praise, or a real science fact from the fact catalogue;
//  - otherwise: occasional character lines. Deterministic per (seed, beat, stage); works without AI and on any device.
import { DUCKS, DUCK_BY_ID, MOOD_EXPRESSION, resolveDuckId, type Expression } from '../content/ducks';
import { APPROACH, FIELD_NOTES, HELP, RADIO, TEMPERAMENT, type FieldNote, type RadioCue } from '../content/duckRadio';
import { FACTS } from '../content/world';
import { Rng } from './rng';
import { BEAT_BY_ID, currentBeat } from './story';
import type { BeatTemplate, BiomeId, DuckMood, GameState, L10n } from './types';

export interface RadioLine { duck: string; expression: Expression; text: L10n; kind: 'chat' | 'hunch' | 'praise' | 'fact' | 'note'; hunchChoice?: string; noteId?: string }

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

/** A hunch: the duck suggests the way of acting THEY favour, if one of the options matches. Independent of the odds. */
export function hunchFor(s: GameState, duck: string): { text: L10n; choice: string } | null {
  if (s.stage !== 'beat') return null;
  const h = HELP[duck]; const style = TEMPERAMENT[duck];
  if (!h || !style) return null;
  const match = currentBeat(s).choices.find((c) => c.choice.style === style);
  return match ? { text: fillT(h.hunch, { approach: APPROACH[style] }), choice: match.choice.id } : null;
}

const SEA_BIOMES = new Set<BiomeId>(['reef', 'mudflat', 'seagrass', 'openSea', 'twilight', 'midnight', 'vents', 'trench']);
export const NOTE_CHANCE = 0.3;

/** Field notes a run produced, by beat index (pure: same run → same notes on every device). One per run per note id. */
export function fieldNotes(s: GameState): Record<number, FieldNote> {
  const upto = s.stage === 'ending' ? s.log.length : s.stage === 'outcome' ? s.index + 1 : s.index;
  const out: Record<number, FieldNote> = {}; const used = new Set<string>();
  const team = crew(s);
  for (let i = 1; i < upto; i++) {
    const r = Rng.from(s.seed, `note${i}`);
    if (!r.chance(NOTE_CHANCE)) continue;
    // a field note about gloves or soil would break the moment at a twist or the climax
    const bk = BEAT_BY_ID[s.plan.beats[i].template]?.kind; if (bk === 'twist' || bk === 'climax') continue;
    const duck = r.chance(0.6) ? team[0] : r.pick(team.slice(1));
    const realm = SEA_BIOMES.has(s.plan.beats[i].biome) ? 'sea' : 'land';
    const pool = FIELD_NOTES.filter((n) => n.duck === duck && (n.realm === 'any' || n.realm === realm) && !used.has(n.id));
    if (!pool.length) continue;
    const n = r.pick(pool); used.add(n.id); out[i] = n;
  }
  return out;
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
    if (struggling(s) && r.chance(0.6)) {
      const h = hunchFor(s, speaker);
      if (h) return [{ duck: speaker, expression: 'sly', text: h.text, kind: 'hunch', hunchChoice: h.choice }];
    }
    const tense = kind === 'challenge' || kind === 'climax' || kind === 'twist';
    if (!r.chance(tense ? 0.5 : 0.35)) return [];
    const cue: RadioCue = deep && r.chance(0.6) ? 'deep' : tense ? 'danger' : r.chance(0.18) ? 'theory' : 'arrive';
    const t = line(r, speaker, cue); if (!t) return [];
    return [{ duck: speaker, expression: cue === 'danger' || cue === 'deep' ? 'worried' : cue === 'theory' ? 'sly' : 'curious', text: t, kind: 'chat' }];
  }

  const o = s.lastOutcome; if (!o) return [];
  const note = fieldNotes(s)[s.index];
  if (note) { const h = HELP[note.duck]; return [{ duck: note.duck, expression: 'curious', text: { en: `${h.note.en} ${note.text.en}`, ar: `${h.note.ar} ${note.text.ar}` }, kind: 'note', noteId: note.id }]; }
  if (thriving(s) && r.chance(0.7)) {
    const h = HELP[speaker]; if (!h) return [];
    const fact = kind !== 'twist' && kind !== 'climax' && r.chance(0.5) ? factFor(s, biome, r) : null;
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
