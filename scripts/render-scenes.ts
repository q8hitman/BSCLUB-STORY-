// Renders painted scenes to PNG files for review: npx tsx scripts/render-scenes.ts <outDir> [biome:prop,prop ...]
import { createCanvas, Path2D } from '@napi-rs/canvas';
(globalThis as Record<string, unknown>).Path2D = Path2D;
import { mkdirSync, writeFileSync } from 'node:fs';
import { paintScene, PW, PH } from '../src/art/painter';
import type { BiomeId } from '../src/engine/types';

const out = process.argv[2] ?? 'scene-previews';
const specs = process.argv.slice(3).length ? process.argv.slice(3) : ['midnight:angler', 'twilight:sub,jelly', 'vents:tubeworms', 'trench:leviathan'];
mkdirSync(out, { recursive: true });
for (const spec of specs) {
  const [biome, props = ''] = spec.split(':');
  const cv = createCanvas(PW, PH);
  paintScene(cv.getContext('2d') as unknown as CanvasRenderingContext2D, biome as BiomeId, props ? props.split(',') : [], 42);
  const file = `${out}/${biome}-${props.replace(/,/g, '+') || 'base'}.jpg`;
  writeFileSync(file, cv.toBuffer('image/jpeg', 85));
  console.log(file);
}
