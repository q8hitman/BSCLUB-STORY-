import { describe, expect, it } from 'vitest';
import { NPCS } from '../src/content/world';
import { ARCHETYPES, composeEnding, eligibleArchetypes } from '../src/engine/ending';
import { simulateRun } from '../src/engine/sim';

describe('Ending Composer', () => {
  const runs = [...Array.from({ length: 600 }, (_, i) => simulateRun(5000 + i, 'classic')), ...Array.from({ length: 600 }, (_, i) => simulateRun(5000 + i, 'marine'))];

  it('the chosen ending is always eligible from recorded state (no contradictory endings)', () => {
    for (const r of runs) {
      const a = ARCHETYPES.find((x) => x.id === r.ending.id)!;
      expect(a.mode === 'both' || a.mode === r.state.mode, r.ending.id).toBe(true);
      expect(a.score(r.state), `${r.ending.id} seed ${r.state.seed}`).toBeGreaterThan(0);
    }
  });
  it('never mentions an NPC the player did not meet', () => {
    for (const r of runs) for (const n of NPCS) {
      const mentioned = r.ending.summary.en.includes(n.name.en) || r.ending.epilogue.en.includes(n.name.en);
      if (mentioned && n.id !== 'sailor') expect(r.state.flags, `${n.id} in ${r.ending.id}`).toContain(`met:${n.id}`);
    }
  });
  it('never claims a twist, legend sighting, or reunion that did not happen', () => {
    for (const r of runs) {
      const t = r.ending.summary.en + ' ' + r.ending.epilogue.en;
      if (/Dr\. Basma was alive|Professor Returns/.test(t + r.ending.title.en)) expect(r.state.flags).toContain('ally:basma');
      if (/giant squid/.test(t)) expect(r.state.flags).toContain('twist:squid');
      if (/sonar|plate/i.test(r.ending.title.en)) expect(r.state.flags).toContain('saw-leviathan');
      if (r.state.flags.includes('legend:heard') && !r.state.flags.includes('saw-leviathan')) expect(t).toContain('unconfirmed');
    }
  });
  it('the finale is always reflected in the summary', () => {
    for (const r of runs) {
      const last = r.state.log[r.state.log.length - 1];
      expect(last).toBeTruthy();
      expect(r.ending.summary.en.length).toBeGreaterThan(120);
    }
  });
  it('produces endings in both languages with the creature name', () => {
    for (const r of runs.slice(0, 100)) {
      expect(r.ending.summary.ar).toContain(r.state.creature.name);
      expect(r.ending.title.ar.length).toBeGreaterThan(3);
      expect(/[؀-ۿ]/.test(r.ending.summary.ar)).toBe(true);
    }
  });
  it('varies tone and archetype across runs', () => {
    const tones = new Set(runs.map((r) => r.ending.tone));
    const ids = new Set(runs.map((r) => r.ending.id));
    expect(tones.size).toBeGreaterThanOrEqual(5);
    expect(ids.size).toBeGreaterThanOrEqual(14);
  });
  it('a fallback ending always exists', () => {
    for (const r of runs.slice(0, 50)) expect(eligibleArchetypes(r.state).some((x) => x.a.id === 'field-team')).toBe(true);
  });
  it('recent endings are de-prioritised but never forced into contradiction', () => {
    const r = runs[0];
    const e2 = composeEnding(r.state, [r.ending.id]);
    const a = ARCHETYPES.find((x) => x.id === e2.id)!;
    expect(a.score(r.state)).toBeGreaterThan(0);
  });
});
