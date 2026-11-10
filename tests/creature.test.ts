import { describe, expect, it } from 'vitest';
import { creatureSvg } from '../src/art/creatureSvg';
import { PARTS, partsFor } from '../src/content/parts';
import { decodeCreature, derive, encodeCreature, isValidConfig, randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { SLOTS, STAT_KEYS, type CreatureConfig } from '../src/engine/types';

describe('creature parts', () => {
  it('every part has a trade-off: at least one benefit and one cost', () => {
    for (const p of PARTS) {
      const vals = Object.values(p.stats);
      expect(p.tradeoff.en.length, p.id).toBeGreaterThan(5);
      expect(p.tradeoff.ar.length, p.id).toBeGreaterThan(5);
      expect(vals.some((v) => v! > 0) || (p.caps?.length ?? 0) > 0, `${p.id} benefit`).toBe(true);
      expect(vals.some((v) => v! < 0), `${p.id} cost`).toBe(true);
    }
  });
  it('no part is strictly dominant: net stat sum stays within a tight band', () => {
    for (const p of PARTS) {
      const net = Object.values(p.stats).reduce((a, b) => a! + b!, 0)!;
      expect(net, p.id).toBeGreaterThanOrEqual(-1);
      expect(net, p.id).toBeLessThanOrEqual(4);
    }
  });
  it('ids are unique and every slot has options', () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    for (const s of SLOTS) expect(partsFor(s).length).toBeGreaterThanOrEqual(6);
  });
});

describe('all creature combinations', () => {
  it('derive() succeeds for every single combination', () => {
    const lists = SLOTS.map((s) => partsFor(s).map((p) => p.id));
    let count = 0;
    const rec = (i: number, c: Record<string, string>) => {
      if (i === lists.length) {
        const d = derive({ ...(c as unknown as CreatureConfig), name: 'X', hue: 0 });
        for (const k of STAT_KEYS) if (!Number.isFinite(d.stats[k])) throw new Error('bad stat');
        count++; return;
      }
      for (const id of lists[i]) { c[SLOTS[i]] = id; rec(i + 1, c); }
    };
    rec(0, {});
    expect(count).toBe(lists.reduce((a, l) => a * l.length, 1));
    console.log(`combinations checked: ${count}`);
  });
  it('heavy bodies cannot fly (wings + plates/club glide instead)', () => {
    const d = derive({ name: 'A', base: 'owl', head: 'crest', eyes: 'owlEyes', limbs: 'wings', tail: 'club', adaptation: 'thickFur', ability: 'echo', hue: 0 });
    expect(d.caps.has('fly')).toBe(false);
    expect(d.caps.has('glide')).toBe(true);
  });
  it('renders valid SVG for 2,000 random creatures with every part drawn', () => {
    const r = new Rng(99);
    for (let i = 0; i < 2000; i++) {
      const c = randomCreature(r);
      const svg = creatureSvg(c);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      expect(doc.getElementsByTagName('parsererror').length).toBe(0);
    }
  });
  it('escapes creature names in SVG', () => {
    const svg = creatureSvg({ ...randomCreature(new Rng(1)), name: '<script>"x"' });
    expect(svg).not.toContain('<script>');
  });
});

describe('sharing creatures', () => {
  it('round-trips through the URL encoding, including Arabic names', () => {
    const r = new Rng(5);
    for (let i = 0; i < 200; i++) {
      const c = randomCreature(r, i % 2 ? 'ar' : 'en');
      expect(decodeCreature(encodeCreature(c))).toEqual(c);
    }
  });
  it('rejects tampered or invalid codes', () => {
    expect(decodeCreature('not-base64!!')).toBeNull();
    expect(decodeCreature(btoa(JSON.stringify(['x', 'dragon', 'horns', 'owlEyes', 'wings', 'club', 'shell', 'echo', 0])))).toBeNull();
    expect(isValidConfig({ name: '', base: 'owl' } as never)).toBe(false);
  });
});

describe('default name follows the base animal', () => {
  it('renames an untouched lab designation, keeps its code, and never touches a typed name', async () => {
    const { renameForBase } = await import('../src/engine/creature');
    expect(renameForBase('هجين فنك D-42', 'fennec', 'octopus')).toBe('هجين أخطبوط D-42');
    expect(renameForBase('Fennec Hybrid D-42', 'fennec', 'owl')).toBe('Owl Hybrid D-42');
    expect(renameForBase('زعفران', 'fennec', 'owl')).toBe('زعفران');
    expect(renameForBase('هجين جمل D-42', 'fennec', 'owl')).toBe('هجين جمل D-42');
  });
});
