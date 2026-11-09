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

// ── Hidden encounters (content/rare.ts) ──
import { availableRare, type RareCreature } from '../content/rare';
import { derive } from './creature';
export const RARE_CHANCE = 0.035; // ≈ 1 run in 5 has a hidden encounter

/** The run's hidden encounter, if any: at most one per run, only where the place fits AND the player's creature has a
 *  sense or body part that could notice it. Pure (seed + resolved beats), so it is identical on every device. */
export function rareFor(s: GameState): { index: number; rare: RareCreature } | null {
  const pool = availableRare(); if (!pool.length) return null;
  const caps = derive(s.creature).caps;
  const upto = s.stage === 'ending' ? s.log.length : s.stage === 'outcome' ? s.index + 1 : s.index;
  const legendAt = s.pins?.sighting?.[0] ?? -1;
  for (let i = 2; i < upto; i++) {
    if (i === legendAt) continue;
    const r = Rng.from(s.seed, `rare${i}`);
    if (!r.chance(RARE_CHANCE)) continue;
    const biome = s.plan.beats[i].biome;
    const fits = pool.filter((c) => c.biomes.includes(biome) && c.notice.some((n) => caps.has(n)));
    if (fits.length) return { index: i, rare: r.pick(fits) };
  }
  return null;
}
