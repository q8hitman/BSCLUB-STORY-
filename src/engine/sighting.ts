// Rare legend sightings: at most one fleeting glimpse in ~30% of runs, matched to the place.
// Deterministic per run seed; legends seen recently on this device are less likely to repeat.
import { LEGENDS, type Legend } from '../content/legends';
import { Rng } from './rng';
import type { GameState } from './types';

export const SIGHTING_CHANCE = 0.3;

export function sightingFor(s: GameState, recentlySeen: string[] = []): { index: number; legend: Legend } | null {
  const r = Rng.from(s.seed, 'legend-sighting');
  if (!r.chance(SIGHTING_CHANCE)) return null;
  const n = s.plan.beats.length;
  const candidates: { index: number; legend: Legend }[] = [];
  for (let i = 2; i < n - 1; i++) {
    for (const lg of LEGENDS) if (lg.biomes.includes(s.plan.beats[i].biome)) candidates.push({ index: i, legend: lg });
  }
  if (!candidates.length) return null;
  return r.weighted(candidates, (c) => (recentlySeen.includes(c.legend.id) ? 0.3 : 1));
}
