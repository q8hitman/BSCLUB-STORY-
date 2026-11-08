// Duck Radio director: decides IF a duck speaks, WHO speaks, WHICH expression, and WHAT they say,
// from the current story context. Deterministic per (seed, beat, stage); no AI required.
import { DUCKS, DUCK_BY_ID, MOOD_EXPRESSION, resolveDuckId, type Expression } from '../content/ducks';
import { RADIO, type RadioCue } from '../content/duckRadio';
import { Rng } from './rng';
import type { BeatTemplate, BiomeId, DuckMood, GameState, L10n } from './types';

export interface RadioLine { duck: string; expression: Expression; text: L10n }

const DEEP: BiomeId[] = ['twilight', 'midnight', 'vents', 'trench'];

/** The run's crew: the chosen duck plus two others, fixed for the whole run. */
export function crew(s: GameState): string[] {
  const lead = resolveDuckId(s.duck);
  const others = Rng.from(s.seed, 'crew').shuffle(DUCKS.map((d) => d.id).filter((id) => id !== lead));
  return [lead, others[0], others[1]];
}

function line(r: Rng, duck: string, cue: RadioCue): L10n | null {
  const pool = RADIO[duck]?.[cue];
  return pool?.length ? r.pick(pool) : null;
}

/**
 * Lines for the current moment (0–2). Before a choice: speaks ~40% of the time (more in danger),
 * never revealing which choice is right. After an outcome: reacts ~70% of the time; occasionally a
 * second duck disagrees or adds a comment.
 */
export function radio(s: GameState, kind: BeatTemplate['kind'], biome: BiomeId): RadioLine[] {
  const r = Rng.from(s.seed, `radio${s.index}${s.stage}`);
  const [lead, ...rest] = crew(s);
  const speaker = r.chance(0.65) ? lead : r.pick(rest);
  const deep = DEEP.includes(biome);
  const out: RadioLine[] = [];

  if (s.stage === 'beat') {
    const tense = kind === 'challenge' || kind === 'climax' || kind === 'twist';
    if (!r.chance(tense ? 0.55 : 0.4)) return [];
    const cue: RadioCue = deep && r.chance(0.6) ? 'deep' : tense ? 'danger' : r.chance(0.18) ? 'theory' : 'arrive';
    const t = line(r, speaker, cue); if (!t) return [];
    out.push({ duck: speaker, expression: cue === 'danger' || cue === 'deep' ? 'worried' : cue === 'theory' ? 'sly' : 'curious', text: t });
    return out;
  }

  const o = s.lastOutcome; if (!o) return [];
  if (!r.chance(0.7)) return [];
  const last = s.log[s.log.length - 1];
  const found = s.evidence.length + s.discoveries.length > 0 && r.chance(0.3);
  const cue: RadioCue = last?.style === 'silly' && r.chance(0.6) ? 'comic' : !o.success ? 'fail' : found ? 'discovery' : 'success';
  const t = line(r, speaker, cue) ?? null;
  if (t) out.push({ duck: speaker, expression: MOOD_EXPRESSION[o.mood as DuckMood] ?? 'happy', text: t });
  if (out.length && r.chance(0.22)) {
    const other = rest.find((d) => d !== speaker) ?? rest[0];
    const t2 = line(r, other, r.chance(0.5) ? 'disagree' : cue);
    if (t2) out.push({ duck: other, expression: 'sly', text: t2 });
  }
  return out;
}

export const duckName = (id: string) => DUCK_BY_ID[id]?.name;
