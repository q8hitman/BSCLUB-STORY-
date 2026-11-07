import { describe, expect, it } from 'vitest';
import { composeEnding } from '../src/engine/ending';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { simulateRun } from '../src/engine/sim';
import { ALL_BEATS, advance, choose, currentBeat, startGame, validateState } from '../src/engine/story';
import type { CreatureConfig, GameState } from '../src/engine/types';

const flyer: CreatureConfig = { name: 'Zap', base: 'owl', head: 'antennae', eyes: 'owlEyes', limbs: 'wings', tail: 'lure', adaptation: 'biolum', ability: 'echo', hue: 2 };
const digger: CreatureConfig = { name: 'Zap', base: 'pangolin', head: 'helmet', eyes: 'tinyEyes', limbs: 'digClaws', tail: 'club', adaptation: 'thickFur', ability: 'smell', hue: 3 };
const swimmer: CreatureConfig = { name: 'Zap', base: 'axolotl', head: 'gillFrills', eyes: 'glowEyes', limbs: 'tentacles', tail: 'finTail', adaptation: 'gills', ability: 'pressure', hue: 7 };

function playFixed(seed: number, mode: 'classic' | 'marine', creature: CreatureConfig, pick = 0): GameState {
  let s = startGame({ mode, seed, duck: 'petri', player: 'T', creature });
  while (s.stage !== 'ending') { const v = currentBeat(s); s = advance(choose(s, v.choices[pick % v.choices.length].choice.id)); }
  return s;
}

describe('state machine integrity', () => {
  it('500 random runs per mode keep every invariant at every step', () => {
    for (const mode of ['classic', 'marine'] as const) for (let i = 0; i < 500; i++) {
      const r = simulateRun(1000 + i, mode);
      expect(r.errors, `${mode} seed ${1000 + i}`).toEqual([]);
      expect(r.state.stage).toBe('ending');
    }
  });
  it('every scene shows exactly 4 choices, anatomy-unlocked ones included when available', () => {
    let gatedShown = 0;
    for (const mode of ['classic', 'marine'] as const) for (let i = 0; i < 300; i++) {
      let s = startGame({ mode, seed: i, duck: 'petri', player: '', creature: i % 2 ? flyer : swimmer });
      while (s.stage === 'beat') {
        const v = currentBeat(s);
        expect(v.choices.length, `${v.template.id}`).toBe(4);
        gatedShown += v.choices.filter((c) => c.choice.requires?.capAny).length;
        s = advance(choose(s, v.choices[i % 4].choice.id));
      }
    }
    expect(gatedShown).toBeGreaterThan(300);
  });
  it('rejects illegal transitions and unknown choices', () => {
    const s = startGame({ mode: 'classic', seed: 3, duck: 'petri', player: '', creature: flyer });
    expect(() => advance(s)).toThrow();
    expect(() => choose(s, 'nope')).toThrow();
    const o = choose(s, currentBeat(s).choices[0].choice.id);
    expect(() => choose(o, 'x')).toThrow();
  });
  it('is deterministic: same seed, creature and choices replay identically', () => {
    const a = playFixed(77, 'classic', flyer, 1), b = playFixed(77, 'classic', flyer, 1);
    expect(a).toEqual(b);
    expect(composeEnding(a)).toEqual(composeEnding(b));
  });
  it('state is serialisable and survives a JSON round-trip mid-run', () => {
    let s = startGame({ mode: 'marine', seed: 9, duck: 'lens', player: 'نورة', creature: swimmer });
    s = advance(choose(s, currentBeat(s).choices[0].choice.id));
    const copy = JSON.parse(JSON.stringify(s)) as GameState;
    expect(validateState(copy)).toEqual([]);
    expect(currentBeat(copy).text).toEqual(currentBeat(s).text);
  });
});

describe('structure of each mode', () => {
  it('classic: starts in the lab, visits 3 biomes, ends in a climax', () => {
    for (let i = 0; i < 200; i++) {
      const s = simulateRun(i, 'classic').state;
      const kinds = s.plan.beats.map((b) => ALL_BEATS.find((x) => x.id === b.template)!.kind);
      expect(kinds[0]).toBe('hook');
      expect(kinds[kinds.length - 1]).toBe('climax');
      expect(kinds).toContain('twist');
      expect(kinds).toContain('encounter');
    }
  });
  it('marine: Surface Waters then The Deep, with the phase change in between', () => {
    for (let i = 0; i < 200; i++) {
      const s = simulateRun(i, 'marine').state;
      const tpls = s.plan.beats.map((b) => ALL_BEATS.find((x) => x.id === b.template)!);
      const p = tpls.findIndex((t) => t.id === 'pm-descend');
      expect(p).toBeGreaterThan(2);
      tpls.slice(1, p).forEach((t) => expect(['reef', 'mudflat', 'seagrass']).toContain(s.plan.beats[tpls.indexOf(t)].biome));
      tpls.slice(p + 1).forEach((t, k) => expect(['twilight', 'midnight', 'vents', 'trench']).toContain(s.plan.beats[p + 1 + k].biome));
    }
  });
  it('marine: the sailor legend appears in some runs but not all, and always pays off', () => {
    let legend = 0;
    for (let i = 0; i < 400; i++) {
      const s = simulateRun(i, 'marine').state;
      const hasTale = s.plan.beats.some((b) => b.template === 'lm-tale');
      const hasLev = s.plan.beats.some((b) => b.template === 'km-leviathan');
      if (hasTale) legend++;
      expect(hasLev).toBe(hasTale); // never a leviathan without the legend; legend always pays off
    }
    expect(legend / 400).toBeGreaterThan(0.25);
    expect(legend / 400).toBeLessThan(0.6);
  });
  it('every story beat template is reachable across simulated runs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1500; i++) for (const mode of ['classic', 'marine'] as const) simulateRun(i, mode).state.plan.beats.forEach((b) => seen.add(b.template));
    const missing = ALL_BEATS.map((b) => b.id).filter((id) => !seen.has(id));
    expect(missing).toEqual([]);
  });
});

describe('anatomy changes the story', () => {
  it('different creatures get different options at the same beat', () => {
    let differ = 0, total = 0;
    for (let seed = 0; seed < 100; seed++) {
      const a = startGame({ mode: 'classic', seed, duck: 'petri', player: '', creature: flyer });
      const b = startGame({ mode: 'classic', seed, duck: 'petri', player: '', creature: digger });
      // walk both with the first ungated choice and compare available options at each step
      let sa = a, sb = b;
      for (let k = 0; k < 6 && sa.stage === 'beat' && sb.stage === 'beat'; k++) {
        const va = currentBeat(sa), vb = currentBeat(sb);
        if (va.template.id === vb.template.id) { total++; if (va.choices.map((c) => c.choice.id).join() !== vb.choices.map((c) => c.choice.id).join()) differ++; }
        sa = advance(choose(sa, va.choices[0].choice.id)); sb = advance(choose(sb, vb.choices[0].choice.id));
      }
    }
    expect(total).toBeGreaterThan(50);
    expect(differ / total).toBeGreaterThan(0.25);
  });
  it('flying creatures can fly over obstacles; non-flyers never see that option', () => {
    const cross = ALL_BEATS.find((b) => b.id === 'cross')!;
    for (let seed = 0; seed < 400; seed++) {
      for (const c of [flyer, digger]) {
        let s = startGame({ mode: 'classic', seed, duck: 'petri', player: '', creature: c });
        while (s.stage === 'beat') {
          const v = currentBeat(s);
          if (v.template === cross) {
            const ids = v.choices.map((x) => x.choice.id);
            expect(ids.includes('fly')).toBe(c === flyer);
            expect(ids.includes('dig')).toBe(c === digger);
          }
          s = advance(choose(s, v.choices[v.choices.length - 1].choice.id));
          if (s.stage === 'ending') break;
        }
      }
    }
  });
  it('outcomes name the body part that helped or hurt', () => {
    let named = 0, checks = 0;
    for (let i = 0; i < 200; i++) {
      let s = startGame({ mode: 'classic', seed: i, duck: 'petri', player: '', creature: randomCreature(new Rng(i)) });
      while (s.stage === 'beat') {
        const v = currentBeat(s); const c = v.choices.find((x) => x.choice.check) ?? v.choices[0];
        s = choose(s, c.choice.id);
        if (c.choice.check) { checks++; if (s.lastOutcome?.partLine) named++; }
        s = advance(s);
      }
    }
    expect(named / checks).toBeGreaterThan(0.95);
  });
});
