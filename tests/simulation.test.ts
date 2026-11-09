// Simulates ≥1,000 full playthroughs per mode and writes reports/diversity.{json,md}.
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DUCKS } from '../src/content/ducks';
import { ALL_BEATS, BEAT_BY_ID, jaccard, type RunMemory } from '../src/engine/story';
import { simulateRun, type SimResult } from '../src/engine/sim';
import type { Mode } from '../src/engine/types';

const RUNS = 1000;

function entropy(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0); if (!n || counts.length < 2) return 0;
  const h = -counts.reduce((s, c) => (c ? s + (c / n) * Math.log2(c / n) : s), 0);
  return h / Math.log2(counts.length);
}
const tally = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
const pct = (x: number) => Math.round(x * 1000) / 10;

function campaign(mode: Mode, withHistory: boolean, seed0: number) {
  const history: RunMemory[] = []; const recentEndings: string[] = []; const results: SimResult[] = [];
  for (let i = 0; i < RUNS; i++) {
    const r = simulateRun(seed0 + i, mode, { history: withHistory ? history : [], recentEndings: withHistory ? recentEndings.slice(-5) : [] });
    results.push(r); history.push(r.memory); recentEndings.push(r.ending.id);
  }
  return results;
}

function metrics(mode: Mode, results: SimResult[], baseline: SimResult[]) {
  const errors = results.reduce((n, r) => n + r.errors.length, 0);
  const planKey = (r: SimResult) => r.memory.planTokens.join('|');
  const pathKey = (r: SimResult) => r.memory.planTokens.join('|') + '#' + r.memory.pathTokens.join('|');
  const endKey = (r: SimResult) => `${r.ending.id}:${r.ending.title.en}`;
  const consecutive = (rs: SimResult[]) => { let s = 0; for (let i = 1; i < rs.length; i++) s += jaccard([...rs[i].memory.planTokens, ...rs[i].memory.pathTokens], [...rs[i - 1].memory.planTokens, ...rs[i - 1].memory.pathTokens]); return s / (rs.length - 1); };
  const windowMax = (rs: SimResult[]) => { let s = 0; for (let i = 10; i < rs.length; i++) s += Math.max(...rs.slice(i - 10, i).map((p) => jaccard(rs[i].memory.planTokens, p.memory.planTokens))); return s / (rs.length - 10); };
  const endings = tally(results.map((r) => r.ending.id));
  const tones = tally(results.map((r) => r.ending.tone));
  const templates = new Set(results.flatMap((r) => r.memory.templates));
  const modeTemplates = ALL_BEATS.filter((b) => b.mode === mode || b.mode === 'both').map((b) => b.id);
  const reachable = modeTemplates.filter((id) => (id !== 'pressure' || mode === 'marine') && (id !== 'camp-land' || mode === 'classic')); // the land camp needs land biomes
  const biomes = tally(results.flatMap((r) => [...new Set(r.state.plan.beats.map((b) => b.biome))]));
  const twists = tally(results.map((r) => r.state.plan.beats.find((b) => BEAT_BY_ID[b.template]?.kind === 'twist')?.template ?? 'none'));
  const climaxes = tally(results.map((r) => r.state.plan.beats[r.state.plan.beats.length - 1].template));
  const hooks = tally(results.map((r) => r.state.plan.hook));
  const checks = results.flatMap((r) => r.state.log.filter((l) => l.usedPart !== undefined));
  const successRate = checks.filter((l) => l.success).length / checks.length;
  const byBase = Object.entries(tally(results.map((r) => r.state.creature.base))).map(([base]) => {
    const ls = results.filter((r) => r.state.creature.base === base).flatMap((r) => r.state.log.filter((l) => l.usedPart !== undefined));
    return [base, ls.filter((l) => l.success).length / ls.length] as const;
  });
  const byDuck = DUCKS.map((d) => { const ls = results.filter((r) => r.state.duck === d.id).flatMap((r) => r.state.log.filter((l) => l.usedPart !== undefined)); return [d.id, ls.filter((l) => l.success).length / Math.max(1, ls.length)] as const; });
  const legend = results.filter((r) => r.state.plan.legend).length / results.length;
  return {
    mode, runs: results.length, invariantErrors: errors,
    uniquePlans: new Set(results.map(planKey)).size, uniquePlansPct: pct(new Set(results.map(planKey)).size / results.length),
    uniquePaths: new Set(results.map(pathKey)).size, uniquePathsPct: pct(new Set(results.map(pathKey)).size / results.length),
    distinctEndingArchetypes: Object.keys(endings).length, distinctEndingTitles: new Set(results.map(endKey)).size,
    endingEntropy: Math.round(entropy(Object.values(endings)) * 100) / 100, endings, tones,
    templateCoverage: `${[...templates].filter((t) => reachable.includes(t)).length}/${reachable.length}`,
    avgBeatsPerRun: Math.round((results.reduce((n, r) => n + r.state.log.length, 0) / results.length) * 10) / 10,
    meanConsecutiveSimilarity_withHistory: Math.round(consecutive(results) * 1000) / 1000,
    meanConsecutiveSimilarity_noHistory: Math.round(consecutive(baseline) * 1000) / 1000,
    meanMaxPlanSimilarityToLast10_withHistory: Math.round(windowMax(results) * 1000) / 1000,
    meanMaxPlanSimilarityToLast10_noHistory: Math.round(windowMax(baseline) * 1000) / 1000,
    checkSuccessRate: pct(successRate), successByBase: Object.fromEntries(byBase.map(([b, v]) => [b, pct(v)])),
    successByDuck: Object.fromEntries(byDuck.map(([b, v]) => [b, pct(v)])),
    biomeAppearances: biomes, hooks, twists, climaxes, legendRunsPct: mode === 'marine' ? pct(legend) : undefined,
    anatomyGatedChoicesTakenPct: pct(results.flatMap((r) => r.state.log).filter((l) => BEAT_BY_ID[l.beat].choices.find((c) => c.id === l.choice)?.requires?.capAny).length / results.flatMap((r) => r.state.log).length),
  };
}

describe(`simulation: ${RUNS} runs per mode`, () => {
  const report: Record<string, ReturnType<typeof metrics>> = {};
  for (const mode of ['classic', 'marine'] as const) {
    it(`${mode}: ${RUNS} full playthroughs, healthy and diverse`, () => {
      const withHist = campaign(mode, true, mode === 'classic' ? 10_000 : 20_000);
      const noHist = campaign(mode, false, mode === 'classic' ? 10_000 : 20_000);
      const m = metrics(mode, withHist, noHist);
      report[mode] = m;
      console.log(JSON.stringify(m, null, 1));
      expect(m.invariantErrors).toBe(0);
      expect(m.uniquePathsPct).toBeGreaterThan(97);
      expect(m.distinctEndingArchetypes).toBeGreaterThanOrEqual(8);
      expect(m.endingEntropy).toBeGreaterThan(0.6);
      const [hit, total] = m.templateCoverage.split('/').map(Number);
      expect(hit).toBe(total);
      expect(m.checkSuccessRate).toBeGreaterThan(45);
      expect(m.checkSuccessRate).toBeLessThan(80);
      for (const v of Object.values(m.successByBase)) expect(Math.abs(v - m.checkSuccessRate)).toBeLessThan(15);
      // Anti-repetition must measurably reduce similarity to recent runs.
      expect(m.meanMaxPlanSimilarityToLast10_withHistory).toBeLessThan(m.meanMaxPlanSimilarityToLast10_noHistory);
    });
  }
  it('writes the diversity report', () => {
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/diversity.json', JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));
    const row = (k: string, f: (m: ReturnType<typeof metrics>) => unknown) => `| ${k} | ${f(report.classic)} | ${f(report.marine)} |`;
    const md = [
      '# Diversity report (simulated playthroughs)', '', `Each mode: ${RUNS} complete runs with random creatures, ducks and choices, carrying run history (as a real player's localStorage would). A second ${RUNS}-run campaign without history is the baseline for the anti-repetition metrics.`, '',
      '| Metric | Classic BioLab | Marine Science Club |', '|---|---|---|',
      row('Invariant errors', (m) => m.invariantErrors),
      row('Unique story plans', (m) => `${m.uniquePlans} (${m.uniquePlansPct}%)`),
      row('Unique full paths (plan + choices + results)', (m) => `${m.uniquePaths} (${m.uniquePathsPct}%)`),
      row('Distinct ending archetypes', (m) => m.distinctEndingArchetypes),
      row('Distinct ending titles', (m) => m.distinctEndingTitles),
      row('Ending entropy (0–1)', (m) => m.endingEntropy),
      row('Story templates reached', (m) => m.templateCoverage),
      row('Avg beats per run', (m) => m.avgBeatsPerRun),
      row('Consecutive-run similarity (with history)', (m) => m.meanConsecutiveSimilarity_withHistory),
      row('Consecutive-run similarity (no history)', (m) => m.meanConsecutiveSimilarity_noHistory),
      row('Max plan similarity to last 10 runs (with history)', (m) => m.meanMaxPlanSimilarityToLast10_withHistory),
      row('Max plan similarity to last 10 runs (no history)', (m) => m.meanMaxPlanSimilarityToLast10_noHistory),
      row('Check success rate', (m) => `${m.checkSuccessRate}%`),
      row('Success by base animal', (m) => Object.entries(m.successByBase).map(([k, v]) => `${k} ${v}%`).join(', ')),
      row('Anatomy-gated choices taken', (m) => `${m.anatomyGatedChoicesTakenPct}%`),
      row('Sailor legend runs', (m) => (m.legendRunsPct === undefined ? '—' : `${m.legendRunsPct}%`)),
      '', '## Endings', '', '```json', JSON.stringify({ classic: report.classic.endings, marine: report.marine.endings }, null, 1), '```',
      '', '## Twists / climaxes / hooks', '', '```json', JSON.stringify({ classic: { twists: report.classic.twists, climaxes: report.classic.climaxes, hooks: report.classic.hooks }, marine: { twists: report.marine.twists, climaxes: report.marine.climaxes, hooks: report.marine.hooks } }, null, 1), '```', '',
    ].join('\n');
    writeFileSync('reports/diversity.md', md);
    expect(md.length).toBeGreaterThan(500);
  });
});
