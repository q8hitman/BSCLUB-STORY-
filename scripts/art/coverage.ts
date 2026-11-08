// Reports which story beats have a fitting painted plate in which biome (gaps fall back to the procedural painter).
import { PLATE_LIST, plateFor } from '../../src/art/plates';
import { ALL_BEATS } from '../../src/engine/story';
import type { GameState } from '../../src/engine/types';
const fake = { seed: 1, plan: { beats: [] } } as unknown as GameState;
let covered = 0, total = 0; const gaps: Record<string, string[]> = {};
for (const b of ALL_BEATS) for (const biome of b.biomes) {
  total++;
  if (plateFor(fake, 0, b.kind, biome, new Set(), b.id)) covered++; else (gaps[biome] ??= []).push(b.id);
}
const byBiome = PLATE_LIST.reduce<Record<string, number>>((m, p) => ((m[p.biome] = (m[p.biome] ?? 0) + 1), m), {});
const byEvent = PLATE_LIST.reduce<Record<string, number>>((m, p) => ((m[p.event] = (m[p.event] ?? 0) + 1), m), {});
console.log(`Plates: ${PLATE_LIST.length}\nBy biome: ${JSON.stringify(byBiome)}\nBy event: ${JSON.stringify(byEvent)}`);
console.log(`Beat×biome slots with a fitting plate: ${covered}/${total} (${Math.round((100 * covered) / total)}%)`);
for (const [b, ids] of Object.entries(gaps)) console.log(`  gap ${b}: ${ids.join(', ')}`);
