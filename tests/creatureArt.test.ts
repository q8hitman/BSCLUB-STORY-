import { describe, expect, it } from 'vitest';
import { creatureSvg, EXPRESSIONS, FEELING_EXPRESSION, type CreatureMark } from '../src/art/creatureSvg';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';

const MARKS: CreatureMark[] = ['mud', 'frost', 'dust', 'wet', 'glow', 'soot', 'scratches', 'fatigue'];
const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml');

describe('creature art v2', () => {
  it('renders every expression and every condition mark as valid SVG', () => {
    const r = new Rng(5);
    for (let i = 0; i < 120; i++) {
      const c = randomCreature(r);
      const ex = EXPRESSIONS[i % EXPRESSIONS.length];
      const svg = creatureSvg(c, { expression: ex, marks: [MARKS[i % MARKS.length], MARKS[(i + 3) % MARKS.length]] });
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(parse(svg).getElementsByTagName('parsererror').length).toBe(0);
    }
  });

  it('keeps the same anatomy across expressions (only face and posture change)', () => {
    const r = new Rng(11);
    for (let i = 0; i < 40; i++) {
      const c = randomCreature(r);
      const counts = EXPRESSIONS.map((ex) => (creatureSvg(c, { expression: ex }).match(/<path /g) ?? []).length);
      // the same parts are drawn every time; expressions may add/remove only small face strokes and a few fur tufts
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(12);
    }
  });

  it('frames the whole creature (viewBox is finite and 5:4)', () => {
    const r = new Rng(3);
    for (let i = 0; i < 200; i++) {
      const vb = creatureSvg(randomCreature(r)).match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
      expect(vb.every(Number.isFinite)).toBe(true);
      expect(vb[2] / vb[3]).toBeCloseTo(1.25, 2);
    }
  });

  it('maps every story feeling to a drawn expression', () => {
    for (const f of ['curious', 'calm', 'confident', 'afraid', 'excited', 'exhausted', 'hurt', 'proud']) expect(EXPRESSIONS).toContain(FEELING_EXPRESSION[f]);
  });
});
