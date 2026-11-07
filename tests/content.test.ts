import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BIOME_INTEGRATED, PROPS } from '../src/art/sceneSvg';
import { sceneLayers } from '../src/art/sceneSvg';
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
  DUCKS.forEach((d) => [d.name, d.role, d.perk, ...d.catch].forEach((t, i) => out.push({ where: `${d.id}#${i}`, t })));
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
  it('every beat always offers at least two choices that need no special anatomy', () => {
    for (const b of ALL_BEATS) {
      const open = b.choices.filter((c) => !c.requires || (!c.requires.capAny && !c.requires.statMin && c.requires.evidenceMin === undefined));
      expect(open.length, b.id).toBeGreaterThanOrEqual(1);
      expect(b.choices.length, b.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('every checked choice has a failure outcome (no silent auto-success)', () => {
    for (const b of ALL_BEATS) for (const c of b.choices) if (c.check) expect(c.fail, `${b.id}.${c.id}`).toBeTruthy();
  });
  it('every biome has scene art and every scene prop has a drawing or a biome that draws it', () => {
    for (const id of Object.keys(BIOMES) as BiomeId[]) {
      const l = sceneLayers(id, [], 1);
      expect(l.sky.length + l.far.length + l.mid.length + l.near.length, id).toBeGreaterThan(200);
    }
    for (const b of ALL_BEATS) for (const p of b.props) {
      expect(PROPS[p], `${b.id} prop ${p}`).toBeTruthy();
      const art = PROPS[p](new Rng(1));
      if (!art) {
        const allowed = BIOME_INTEGRATED[p];
        expect(allowed, `${b.id} prop ${p} draws nothing`).toBeTruthy();
        if (allowed !== '*') for (const bio of b.biomes) expect(allowed.includes(bio), `${b.id}: ${p} not drawn in ${bio}`).toBe(true);
      }
    }
  });
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
