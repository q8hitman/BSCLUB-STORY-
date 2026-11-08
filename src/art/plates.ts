// Painted event plates (generated offline on the designer's PC with SDXL, curated, shipped as WebP).
// The resolver picks the best plate for a beat by biome + event type, never repeating within a run.
// Beats with no suitable plate fall back to the procedural painter.
import PLATES from '../content/plates.json';
import { Rng } from '../engine/rng';
import type { BeatTemplate, BiomeId, GameState } from '../engine/types';

export interface Plate { id: string; biome: string; event: string; tone: string; mystery: number; style: string }
export const PLATE_LIST = PLATES as Plate[];

/** Event types that suit each beat kind, best first. Bestiary specimen plates are reserved for close-ups. */
const KIND_EVENTS: Record<BeatTemplate['kind'], string[]> = {
  hook: ['hook', 'signal', 'discovery'],
  explore: ['discovery', 'signal', 'encounter', 'evidence'],
  challenge: ['challenge', 'suspense', 'encounter'],
  encounter: ['encounter', 'comic', 'discovery'],
  twist: ['evidence', 'discovery', 'suspense', 'signal'],
  climax: ['finale', 'suspense', 'challenge'],
  legend: ['legend', 'signal'],
  phase: ['phase'],
};

/** Some templates need a more specific event than their kind (e.g. a crossing is not a comedy). */
const TEMPLATE_EVENTS: Record<string, string[]> = {
  cross: ['challenge'], hide: ['suspense', 'encounter'], rescue: ['challenge', 'encounter'], clue: ['evidence', 'discovery'],
  heat: ['suspense', 'challenge'], cold: ['challenge', 'suspense'], dark: ['suspense'], bog: ['challenge', 'suspense'], pressure: ['suspense'],
};

export function plateUrl(id: string) { return `${import.meta.env?.BASE_URL ?? '/'}scenes/${id}.webp`; }

/** Deterministic plate choice for beat `idx`; avoids plates already shown earlier in the run. */
export function plateFor(s: GameState, idx: number, kind: BeatTemplate['kind'], biome: BiomeId, used: Set<string>, template?: string): Plate | null {
  const wanted = (template && TEMPLATE_EVENTS[template]) || KIND_EVENTS[kind] || [];
  // Only plates whose event actually fits; otherwise the procedural painter draws the scene (no unrelated pictures).
  const pool = PLATE_LIST.filter((p) => p.biome === biome && wanted.includes(p.event) && !used.has(p.id));
  if (!pool.length) return null;
  const r = Rng.from(s.seed, `plate${idx}`);
  return r.weighted(pool, (p) => {
    const rank = wanted.indexOf(p.event);
    return 4 - rank + (p.mystery >= 2 ? 0.4 : 0);
  });
}

/** Plates for every beat up to and including `upto`, so repeats are avoided across the whole run. */
export function platesForRun(s: GameState, kinds: (i: number) => BeatTemplate['kind'] | null, upto: number): (Plate | null)[] {
  // template ids let specific beats ask for specific events
  const used = new Set<string>(); const out: (Plate | null)[] = [];
  for (let i = 0; i <= upto && i < s.plan.beats.length; i++) {
    const k = kinds(i);
    const p = k ? plateFor(s, i, k, s.plan.beats[i].biome, used, s.plan.beats[i].template) : null;
    if (p) used.add(p.id);
    out.push(p);
  }
  return out;
}
