// Story Factory quality gate: every package must pass this before it can be published (scripts/factory/publish.ts)
// and every published package is re-checked by the test suite. Used by the factory on Gemini drafts too.
import { BIOMES, FACT_BY_ID } from '../content/world';
import { BESTIARY } from '../content/bestiary';
import { randomCreature } from './creature';
import { Rng } from './rng';
import { advance, choose, currentBeat, validateState } from './story';
import { narrativeFingerprint, reachedEnding, registerStory, startStory, type StoryPackage } from './archive';
import { jaccard } from './story';
import type { Cond, Effect, Outcome } from './types';

export interface ValidationReport { id: string; errors: string[]; warnings: string[]; stats: { nodes: number; endings: number; paths: number; endingsReached: Record<string, number>; avgScenes: number; buildsCompleted: number; buildsTried: number } }

const KNOWN_CAPS = new Set(['fly', 'glide', 'swim', 'breatheWater', 'climb', 'dig', 'jump', 'grip', 'nightVision', 'echolocation', 'heatSense', 'scent', 'motionSense', 'venom', 'glow', 'camouflage', 'armor', 'spines', 'shock', 'ink', 'regenerate', 'mimic', 'pressure', 'insulated', 'fatStore', 'heatShed']);
/** Gulf/Levantine/Iraqi colloquial markers that must not appear: story text is Modern Standard Arabic. */
const DIALECT = /(^|[\s«(])(شلون|شنو|ليش|وايد|هسه|هسّه|ماكو|اكو|أكو|خوش|چ|گ|زلمة|يبه|ابي|أبي|بعدين|كذا يعني|إزاي|ازاي|عشان|مو\s)/;
const FX_OK = new Set(['bees', 'binoculars', 'boat', 'camera', 'camo', 'chase', 'climb', 'cold', 'defend', 'dig', 'echo', 'flash', 'fly', 'heart', 'heat', 'impact', 'jump', 'map', 'oasis', 'overlay', 'phone', 'pop', 'radio', 'sample', 'scan', 'screen', 'sniff', 'splash', 'stars', 'still', 'sub', 'swim', 'trophy', 'tumble']);

function condFlags(c?: Cond): string[] { return c ? [...(c.flag ?? []), ...(c.flagAny ?? []), ...(c.notFlag ?? [])] : []; }
function outs(p: StoryPackage) { return Object.entries(p.nodes).flatMap(([nid, n]) => n.choices.flatMap((c) => [c.success, ...(c.fail ? [c.fail] : [])].map((o) => ({ nid, c, o })))); }

export function validateStory(p: StoryPackage, opts: { plates?: Set<string>; others?: StoryPackage[]; sims?: number } = {}): ValidationReport {
  const errors: string[] = []; const warnings: string[] = [];
  const E = (m: string) => errors.push(m); const W = (m: string) => warnings.push(m);
  if (!/^[a-z0-9-]{3,40}$/.test(p.id)) E('id must be kebab-case');
  if (!Number.isInteger(p.v) || p.v < 1) E('version must be a positive integer');
  if (!p.nodes[p.start]) E(`start node ${p.start} missing`);
  const ids = Object.keys(p.nodes);
  // ---- graph shape ----
  const edges: Record<string, string[]> = {};
  for (const { nid, c, o } of outs(p)) {
    if (!o.next) { E(`${nid}.${c.id}: outcome has no next`); continue; }
    if (o.next.startsWith('end:')) { if (!p.endings[o.next.slice(4)]) E(`${nid}.${c.id}: unknown ending ${o.next}`); }
    else if (!p.nodes[o.next]) E(`${nid}.${c.id}: unknown node ${o.next}`);
    (edges[nid] ??= []).push(o.next);
  }
  const reach = new Set<string>(); const stack = [p.start];
  while (stack.length) { const n = stack.pop()!; if (reach.has(n)) continue; reach.add(n); for (const x of edges[n] ?? []) if (!reach.has(x)) stack.push(x); }
  for (const id of ids) if (!reach.has(id)) E(`node ${id} unreachable`);
  for (const e of Object.keys(p.endings)) if (!reach.has(`end:${e}`)) E(`ending ${e} unreachable`);
  // cycles (adventures must always finish)
  const state: Record<string, number> = {};
  const dfs = (n: string): boolean => { if (n.startsWith('end:')) return false; if (state[n] === 1) return true; if (state[n] === 2) return false; state[n] = 1; for (const x of edges[n] ?? []) if (dfs(x)) return true; state[n] = 2; return false; };
  if (p.nodes[p.start] && dfs(p.start)) E('graph has a cycle');
  // reconvergence: at least one node is entered from two different nodes (branches meet again)
  const indeg: Record<string, Set<string>> = {};
  for (const [from, xs] of Object.entries(edges)) for (const x of xs) (indeg[x] ??= new Set()).add(from);
  if (!Object.values(indeg).some((s) => s.size >= 2)) W('no reconvergence: branches never meet again');
  // ---- nodes ----
  const setFlags = new Set<string>(); const setEvidence = new Set<string>();
  for (const { o } of outs(p)) for (const ef of (Array.isArray(o.effects) ? o.effects : []) as Effect[]) { if (ef.t === 'flag') setFlags.add(ef.id); if (ef.t === 'evidence') setEvidence.add(ef.id); }
  for (const [nid, n] of Object.entries(p.nodes)) {
    if (!BIOMES[n.biome]) E(`${nid}: unknown biome ${n.biome}`);
    if (n.biome && p.mode === 'classic' && ['reef', 'mudflat', 'seagrass', 'openSea', 'twilight', 'midnight', 'vents', 'trench'].includes(n.biome)) E(`${nid}: marine biome in a classic story`);
    const open = n.choices.filter((c) => !c.requires).length;
    if (open < 4) E(`${nid}: needs at least 4 open choices (has ${open})`);
    if (n.choices.length > 6) W(`${nid}: more than 6 choices authored`);
    if (new Set(n.choices.map((c) => c.id)).size !== n.choices.length) E(`${nid}: duplicate choice ids`);
    if (!n.choices.some((c) => c.requires?.capAny)) W(`${nid}: no anatomy-gated choice`);
    if (n.fact && !FACT_BY_ID[n.fact]) E(`${nid}: unknown fact ${n.fact}`);
    if (n.featured && !BESTIARY.some((b) => b.id === n.featured)) E(`${nid}: featured ${n.featured} not in bestiary`);
    for (const pl of [n.plate, ...(n.plateWhen ?? []).map((w) => w.plate)]) if (pl && opts.plates && !opts.plates.has(pl)) E(`${nid}: missing plate ${pl}`);
    if (!n.plate) W(`${nid}: no plate (falls back to the painter)`);
    const conds = [...n.choices.map((c) => c.requires), ...(n.variants ?? []).map((v) => v.when), ...(n.plateWhen ?? []).map((w) => w.when)];
    for (const c of conds) {
      for (const cap of c?.capAny ?? []) if (!KNOWN_CAPS.has(cap)) E(`${nid}: unknown capability ${cap}`);
      for (const f of condFlags(c)) if (!setFlags.has(f)) E(`${nid}: condition flag ${f} is never set`);
      for (const ev of c?.evidenceAny ?? []) if (!setEvidence.has(ev)) E(`${nid}: condition evidence ${ev} is never collected`);
    }
    for (const c of n.choices) for (const o of [c.success, c.fail].filter(Boolean) as Outcome[]) if (o.fx && !FX_OK.has(o.fx)) E(`${nid}.${c.id}: unknown fx ${o.fx}`);
  }
  for (const f of setFlags) if (f.startsWith('w:') && !p.world?.[f]) W(`world flag ${f} has no journal label`);
  for (const s of p.science ?? []) if (!FACT_BY_ID[s]) E(`unknown science ref ${s}`);
  // ---- language: MSA, both languages present, creature never speaks ----
  const texts: { where: string; en: string; ar: string }[] = [];
  for (const [nid, n] of Object.entries(p.nodes)) {
    texts.push({ where: nid, ...n.text }); for (const v of n.variants ?? []) texts.push({ where: `${nid}.variant`, ...v.text });
    for (const c of n.choices) { texts.push({ where: `${nid}.${c.id}.label`, ...c.label }); for (const o of [c.success, c.fail].filter(Boolean) as Outcome[]) texts.push({ where: `${nid}.${c.id}`, ...o.text }); }
  }
  for (const [eid, e] of Object.entries(p.endings)) texts.push({ where: `end:${eid}`, ...e.title }, { where: `end:${eid}`, ...e.summary }, { where: `end:${eid}`, ...e.epilogue });
  texts.push({ where: 'title', ...p.title }, { where: 'premise', ...p.premise });
  for (const t of texts) {
    if (!t.en?.trim() || !t.ar?.trim()) E(`${t.where}: missing text`);
    if (t.ar && !/[؀-ۿ]/.test(t.ar)) E(`${t.where}: Arabic text is not Arabic`);
    if (t.ar && /[A-Za-z]{3,}/.test(t.ar.replace(/\{[^}]*\}/g, ''))) E(`${t.where}: Latin letters in Arabic text`);
    if (t.ar && DIALECT.test(t.ar)) E(`${t.where}: colloquial word in Arabic (use Modern Standard Arabic)`);
    if (/\{name\}\s*(said|says|replied|asked)|قال\s*\{name\}|\{name\}\s*:\s*«/.test(`${t.en} ${t.ar}`)) E(`${t.where}: the creature never speaks`);
    if (/البطة/.test(t.ar)) E(`${t.where}: use {duck}, not «البطة»`);
  }
  // ---- simulation: random builds × random choices ----
  registerStory(p);
  const sims = opts.sims ?? 300; const reached: Record<string, number> = {}; let scenes = 0; let done = 0;
  const pathSet = new Set<string>();
  for (let i = 0; i < sims; i++) {
    const r = new Rng(9000 + i);
    try {
      let s = startStory({ mode: p.mode, seed: 9000 + i, duck: 'roaa', player: 'Sim', creature: randomCreature(r, 'en') }, p);
      let guard = 0;
      while (s.stage !== 'ending' && guard++ < 60) {
        if (s.stage === 'beat') { const v = currentBeat(s); if (v.choices.length !== 4) throw new Error(`${v.template.id}: ${v.choices.length} choices shown`); s = choose(s, r.pick(v.choices).choice.id); }
        else s = advance(s);
      }
      const errs = validateState(s); if (errs.length) throw new Error(errs.join(','));
      const e = reachedEnding(s); if (!e) throw new Error('finished without an ending');
      reached[e.id] = (reached[e.id] ?? 0) + 1; scenes += s.log.length; done++;
      pathSet.add(s.plan.beats.map((b) => b.template.split(':').pop()).join('>'));
    } catch (err) { E(`simulation ${i}: ${(err as Error).message}`); break; }
  }
  for (const e of Object.keys(p.endings)) if (!reached[e]) W(`ending ${e} never reached in ${sims} random runs`);
  if (pathSet.size < 3) E(`only ${pathSet.size} distinct scene path(s): choices must lead to different places (need ≥3)`);
  const forks = Object.entries(edges).filter(([, xs]) => new Set(xs.filter((x) => !x.startsWith('end:'))).size >= 2).length;
  if (forks < 2) E(`only ${forks} node(s) branch to different scenes (need ≥2)`);
  // ---- structural repetition against the rest of the library ----
  const fp = narrativeFingerprint(p);
  for (const o of opts.others ?? []) {
    if (o.id === p.id) continue;
    const sim = jaccard(fp, narrativeFingerprint(o));
    if (sim >= 0.6) E(`structurally too similar to ${o.id}@${o.v} (${sim.toFixed(2)})`); else if (sim >= 0.45) W(`similar to ${o.id}@${o.v} (${sim.toFixed(2)})`);
  }
  return { id: `${p.id}@${p.v}`, errors, warnings, stats: { nodes: ids.length, endings: Object.keys(p.endings).length, paths: pathSet.size, endingsReached: reached, avgScenes: done ? +(scenes / done).toFixed(1) : 0, buildsCompleted: done, buildsTried: sims } };
}
