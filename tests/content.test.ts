import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { INTEGRATED, PAINT_PROPS, PH, PW, paintScene } from '../src/art/painter';
(globalThis as Record<string, unknown>).Path2D ??= Path2D;
import { DUCKS, MOOD_LINES } from '../src/content/ducks';
import { PARTS } from '../src/content/parts';
import { BIOMES, FACTS, FACT_BY_ID, NPC_BY_ID } from '../src/content/world';
import { ALL_BEATS } from '../src/engine/story';
import { Rng } from '../src/engine/rng';
import type { BiomeId, L10n } from '../src/engine/types';

const ARABIC = /[؀-ۿ]/;
const PLACEHOLDERS = new Set(['name', 'player', 'duck', 'place', 'obstacle', 'predator', 'critter', 'npc']);

function allStrings(): { where: string; t: L10n }[] {
  const out: { where: string; t: L10n }[] = [];
  for (const b of ALL_BEATS) {
    out.push({ where: `${b.id}.text`, t: b.text });
    b.variants?.forEach((v, i) => out.push({ where: `${b.id}.variant${i}`, t: v.text }));
    for (const c of b.choices) {
      out.push({ where: `${b.id}.${c.id}.label`, t: c.label }, { where: `${b.id}.${c.id}.success`, t: c.success.text });
      if (c.fail) out.push({ where: `${b.id}.${c.id}.fail`, t: c.fail.text });
    }
  }
  PARTS.forEach((p) => [p.name, p.desc, p.action, p.tradeoff, p.realSource].forEach((t, i) => out.push({ where: `${p.id}#${i}`, t })));
  FACTS.forEach((f) => out.push({ where: f.id, t: f.text }));
  DUCKS.forEach((d) => [d.name, d.role].forEach((t, i) => out.push({ where: `${d.id}#${i}`, t })));
  Object.values(MOOD_LINES).flat().forEach((t, i) => out.push({ where: `mood${i}`, t }));
  return out;
}

describe('bilingual content', () => {
  it('every string exists in English and Arabic, and the Arabic is actually Arabic', () => {
    for (const { where, t } of allStrings()) {
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      expect(t.ar.trim().length, where).toBeGreaterThan(0);
      expect(ARABIC.test(t.ar), `${where} ar`).toBe(true);
      expect(ARABIC.test(t.en), `${where} en has Arabic`).toBe(false);
    }
  });
  it('only known placeholders are used, and the same ones in both languages', () => {
    for (const { where, t } of allStrings()) {
      const en = [...t.en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      const ar = [...t.ar.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      en.forEach((p) => expect(PLACEHOLDERS.has(p), `${where}: {${p}}`).toBe(true));
      expect(new Set(ar), where).toEqual(new Set(en));
    }
  });
});

describe('story content integrity', () => {
  it('beat ids are unique; facts/NPCs/biomes referenced exist', () => {
    expect(new Set(ALL_BEATS.map((b) => b.id)).size).toBe(ALL_BEATS.length);
    for (const b of ALL_BEATS) {
      if (b.fact) expect(FACT_BY_ID[b.fact], b.id).toBeTruthy();
      if (b.npc) expect(NPC_BY_ID[b.npc], b.id).toBeTruthy();
      b.biomes.forEach((x) => expect(BIOMES[x], `${b.id} ${x}`).toBeTruthy());
      for (const c of b.choices) for (const o of [c.success, c.fail]) for (const e of o?.effects ?? []) {
        if (e.t === 'discovery') expect(FACT_BY_ID[e.id], `${b.id}.${c.id}`).toBeTruthy();
        if (e.t === 'rel') expect(NPC_BY_ID[e.npc], `${b.id}.${c.id}`).toBeTruthy();
      }
    }
  });
  it('every beat has at least 4 open choices, so the player always gets exactly 4', () => {
    for (const b of ALL_BEATS) expect(b.choices.filter((c) => !c.requires).length, b.id).toBeGreaterThanOrEqual(4);
  });
  it('every checked choice has a failure outcome (no silent auto-success)', () => {
    for (const b of ALL_BEATS) for (const c of b.choices) if (c.check) expect(c.fail, `${b.id}.${c.id}`).toBeTruthy();
  });
  it('every biome paints a real scene and every prop has painted art (biome-integrated props excepted)', () => {
    for (const id of Object.keys(BIOMES) as BiomeId[]) {
      const cv = createCanvas(PW, PH); const g = cv.getContext('2d') as unknown as CanvasRenderingContext2D;
      paintScene(g, id, [], 1);
      const px = cv.getContext('2d').getImageData(0, 0, PW, PH).data;
      let sum = 0, sum2 = 0; const n = px.length / 4;
      for (let i = 0; i < px.length; i += 16) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; sum2 += l * l; }
      const m = sum / (n / 4), sd = Math.sqrt(sum2 / (n / 4) - m * m);
      expect(sd, `${id} has visible detail`).toBeGreaterThan(3);
    }
    for (const b of ALL_BEATS) for (const p of b.props) {
      expect(PAINT_PROPS[p], `${b.id} prop ${p}`).toBeTruthy();
      if (INTEGRATED.has(p)) continue;
      const blank = createCanvas(PW, PH), drawn = createCanvas(PW, PH);
      paintScene(blank.getContext('2d') as unknown as CanvasRenderingContext2D, b.biomes[0], [], 3);
      paintScene(drawn.getContext('2d') as unknown as CanvasRenderingContext2D, b.biomes[0], [p], 3);
      expect(blank.toBuffer('image/png').equals(drawn.toBuffer('image/png')), `${b.id}: prop ${p} draws nothing`).toBe(false);
    }
  }, 120000);
  it('every outcome fx has a CSS animation or overlay', () => {
    const css = readFileSync('src/styles.css', 'utf8');
    for (const b of ALL_BEATS) for (const c of b.choices) for (const o of [c.success, c.fail]) {
      if (o?.fx) expect(css.includes(`fx-${o.fx}`), `${b.id}.${c.id} fx ${o.fx}`).toBe(true);
    }
  });
  it('real-science facts are kept separate from fiction (no story placeholders inside facts)', () => {
    for (const f of FACTS) expect(/\{\w+\}/.test(f.text.en + f.text.ar), f.id).toBe(false);
  });
});
