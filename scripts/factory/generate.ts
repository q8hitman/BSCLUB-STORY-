// BSC Story Factory — steps 1–8: concept → branching graph → validation → (one repair) → asset list.
// Development-time only. Runs ONLY when you start it; visitors never need Gemini, ComfyUI or this PC.
//   npx tsx scripts/factory/generate.ts                 → uses scripts/factory/factory.config.json
//   npx tsx scripts/factory/generate.ts --mode classic --tone comedy --concepts 1
// Key: GEMINI_API_KEY or ~/.bsc/gemini.key (never committed, never in the frontend). Free tier only.
// Output: src/stories/<id>@1.json with status "review" (never auto-published), factory/runs/<time>.json (log),
// and scripts/comfy/plates-factory-<id>.json (ComfyUI batch for missing scenes, same format as other batches).
// A human reads the draft, fixes or rejects it, sets status "published", then runs scripts/factory/publish.ts.
import fs from 'node:fs';
import { jsonrepair } from 'jsonrepair';
import { gemini } from '../ai-eval/providers';
import { buildSkeleton, mergeSkeleton } from './skeleton';
import { BESTIARY } from '../../src/content/bestiary';
import { FACTS } from '../../src/content/world';
import { contentHash, type StoryPackage } from '../../src/engine/archive';
import { validateStory } from '../../src/engine/archiveValidate';
import { Rng, newSeed } from '../../src/engine/rng';

const cfg = JSON.parse(fs.readFileSync('scripts/factory/factory.config.json', 'utf8'));
const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const concepts = Number(arg('concepts') ?? cfg.concepts);
const plates = JSON.parse(fs.readFileSync('src/content/plates.json', 'utf8')) as { id: string; biome: string; event: string; style: string }[];
const plateIds = new Set(plates.map((p) => p.id));
const existing: StoryPackage[] = await Promise.all(fs.readdirSync('src/stories').filter((f) => /@\d+\.(ts|json)$/.test(f))
  .map(async (f) => f.endsWith('.json') ? JSON.parse(fs.readFileSync(`src/stories/${f}`, 'utf8')) : (await import(`../../src/stories/${f}`)).default));
const example = existing.find((s) => s.id === 'silent-ridge');
const rng = new Rng(newSeed());
const weighted = (o: Record<string, number>) => rng.weighted(Object.keys(o), (k) => o[k]);

const SYSTEM = `You write branching science adventures for "BSC BioLab: What The Beast?!", a visual-novel game of the Biological Sciences Club (Kuwait University) for children, students and adults.
The player built a hybrid creature (unknown to you; refer to it ONLY as {name}). A duck companion travels along ({duck}; gendered words as {g:masculine|feminine}). The creature NEVER speaks. Never write «البطة».
Write BOTH English and Arabic for every text. Arabic must be clear Modern Standard Arabic (no colloquial words), natural, not a word-by-word translation.
Science must be accurate and simple; never present invented biology as fact. Mild suspense only, nothing gory.
Return ONE JSON object matching this TypeScript type exactly (no markdown):
type L10n = {en:string, ar:string}
type Cond = {capAny?:Capability[], flag?:string[], flagAny?:string[], notFlag?:string[], evidenceAny?:string[], evidenceMin?:number}
type Effect = {t:'flag',id:string}|{t:'evidence',id:string}|{t:'discovery',id:FactId}|{t:'energy',d:number}|{t:'trust',d:number}
type Outcome = {text:L10n, effects:Effect[], mood:'happy'|'worried'|'shocked'|'thinking'|'laughing'|'proud', fx:Fx, next:string /* node id or "end:<endingId>" */}
type Choice = {id:string, label:L10n, style:'bold'|'careful'|'clever'|'kind'|'silly', requires?:Cond, check?:{stat:'strength'|'agility'|'stealth'|'intellect'|'swim'|'cold'|'heat'|'charm', dc:4|5|6|7, caps?:Capability[]}, success:Outcome, fail?:Outcome}
type Node = {kind:'hook'|'explore'|'challenge'|'encounter'|'twist'|'climax', biome:Biome, props:string[], plate:PlateId, plateWhen?:{when:Cond, plate:PlateId}[], cinematic?:'reveal'|'discovery'|'passage'|'phenomenon'|'climax', goal?:L10n /* hook only */, text:L10n, variants?:{when:Cond,text:L10n}[], fact?:FactId, featured?:AnimalId, choices:Choice[]}
type Story = {id:string /*kebab-case*/, v:1, status:'review', mode, source:'factory', title:L10n, premise:L10n, tone, tags:{themes:string[], locations:Biome[], twist:string, creatures:AnimalId[]}, world:Record<string /* "w:..." */, L10n>, science:FactId[], start:string, nodes:Record<string,Node>, endings:Record<string,{tone:'heroic'|'comedic'|'bittersweet'|'mysterious'|'scientific'|'wholesome', title:L10n, summary:L10n, epilogue:L10n}>}
HARD RULES:
- ${cfg.graph.minNodes}–${cfg.graph.maxNodes} nodes, exactly ${cfg.graph.endings} endings, no cycles, every node reachable, every ending reachable.
- When a SKELETON is given: keep every node id, kind, biome, plate, cinematic and every choice's position and "next" EXACTLY; fill every TODO; choice 5 of each node is the anatomy-gated one.
- REQUIRED SHAPE (node ids are yours): hook → (choices split) → pathA OR pathB → both lead to a shared middle node M → M splits → pathC OR pathD → both lead to the climax → 3 endings chosen by climax choices.
  So in the hook, 2+ choices go to pathA and 2+ to pathB; in M, 2+ choices go to pathC and 2+ to pathD. Linear stories are rejected.
- Every node: at least 4 choices WITHOUT "requires" + 1–2 choices that require an anatomy capability (capAny). Choices must lead to DIFFERENT results; not every choice may go to the same next node.
- Branches must reconverge (a node entered from two different nodes) and later nodes must react to earlier flags/evidence through variants or requires.
- Living World: 1–3 world flags "w:*" that visibly change a later scene (plateWhen and/or variants) and are listed in "world".
- Any flag or evidence used in a condition must be set by an earlier effect. Checks need a fail outcome.
- Only use ids from the lists below. Prefer existing plates; if no plate fits, write "NEW:<short-kebab-id>" and the factory will queue ComfyUI art.`;

function lists(mode: 'classic' | 'marine') {
  const biomes = cfg.environments[mode] as string[];
  return `Mode: ${mode}. Biomes: ${biomes.join(', ')}.
Capabilities: fly, glide, swim, breatheWater, climb, dig, jump, grip, nightVision, echolocation, heatSense, scent, motionSense, venom, glow, camouflage, armor, spines, shock, ink, regenerate, mimic, pressure, insulated.
Fx: chase, scan, map, still, climb, sniff, cold, dig, flash, tumble, sample, echo, heart, camera, screen, radio, swim, splash, impact, sub, boat, camo, pop, stars.
FactIds: ${FACTS.map((f) => f.id).join(', ')}.
AnimalIds: ${BESTIARY.map((a) => a.id).join(', ')}.
Plates by biome: ${biomes.map((b) => `${b}: ${plates.filter((p) => p.biome === b && p.style !== 'specimen' && !['lore', 'rare'].includes(p.event)).map((p) => p.id).join(' ')}`).join(' | ')}.
Existing stories (do NOT repeat their premise or structure): ${existing.map((s) => `${s.id}: ${s.premise.en} [twist ${s.tags.twist}]`).join(' / ')}.`;
}

/** Free tier hiccups (503 busy, 429 rate) are retried with a pause, so an unattended run does not give up early. */
/** Free tier: requests are spaced out (per-minute limit), and a run stops cleanly once the daily quota is used up. */
let lastCall = 0; let quotaOut = false;
class QuotaExhausted extends Error {}
function patient(pv: ReturnType<typeof gemini>): ReturnType<typeof gemini> {
  return { ...pv, async call(sys, user, max) {
    for (let a = 0; ; a++) {
      if (quotaOut) throw new QuotaExhausted('daily Gemini quota used up — stopping this run');
      const wait = lastCall + (cfg.budget.minSecondsBetweenRequests ?? 0) * 1000 - Date.now();
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
      lastCall = Date.now();
      const r = await pv.call(sys, user, max);
      if (r.status === 429 && a >= 3) { quotaOut = true; throw new QuotaExhausted('daily Gemini quota used up — stopping this run'); }
      if (![429, 500, 503].includes(r.status) || a >= 3) return r; console.log(`  (Gemini ${r.status}, retrying in ${20 * (a + 1)} s)`); await new Promise((res) => setTimeout(res, 20000 * (a + 1))); }
  } };
}
const provider = patient(gemini(cfg.model));
/** The editor uses a stronger model than the writer when configured (cfg.reviewModel). */
const reviewer = patient(gemini(cfg.reviewModel ?? cfg.model));
let requests = 0, tokens = 0;
const log: unknown[] = [];
async function ask(user: string, retryParse = false): Promise<StoryPackage> {
  if (requests >= cfg.budget.maxRequests || tokens >= cfg.budget.maxTotalTokens) throw new Error('Gemini budget reached for this session');
  requests++;
  const r = await provider.call(SYSTEM, user, cfg.budget.maxOutputTokensPerRequest);
  tokens += r.usage.inTok + r.usage.outTok;
  log.push({ status: r.status, ms: r.ms, usage: r.usage });
  if (r.status !== 200) throw new Error(`Gemini HTTP ${r.status}`);
  const raw = r.text.replace(/^```json\s*|```\s*$/g, '');
  try { return JSON.parse(raw) as StoryPackage; } catch { /* try a mechanical bracket/quote repair first */ }
  try { const fixed = JSON.parse(jsonrepair(raw)) as StoryPackage; if (fixed?.nodes) { console.log('  (JSON repaired mechanically)'); return fixed; } } catch { /* fall through */ }
  try { return JSON.parse(raw) as StoryPackage; }
  catch (e) { fs.mkdirSync('factory/rejected', { recursive: true }); fs.writeFileSync(`factory/rejected/raw-${Date.now()}.txt`, r.text); if (retryParse) throw e; console.log('  (malformed JSON, asking again)'); return ask(user, true); }
}


// ---------- automatic editor (second Gemini pass) ----------
// In --auto mode nobody reads the draft, so a strict reviewer scores it; it is published only if the validator
// finds zero errors AND every reviewer score reaches cfg.auto.minReviewScore. Otherwise it stays "review" (hidden).
const REVIEW_SYSTEM = `You are a strict senior editor for a children's science adventure game (players 8+ and adults, public university event in Kuwait). You reject most drafts.
Score each criterion 1-10 with THIS calibration: 10 = could be printed unchanged in a professional children's science book; 8 = publishable after tiny touch-ups; 6 = needs real editing; 4 = generic or flawed; 2 = unusable.
Typical AI drafts score 5-7. A score of 9-10 requires that you could not find a single weak sentence for that criterion.
- science: specific, correct, well-explained real biology (named animals, real mechanisms). Vague phrases like "a rare mineral reaction" or "special creatures" score at most 5. Invented things must be clearly fiction.
- arabic: natural Modern Standard Arabic with vivid, precise wording; correct grammar and gender agreement; no colloquial words; no literal translation; no repetitive filler. Bland or generic prose scores at most 6.
- age: suitable for children and families: mild suspense only; no gore, cruelty, romance, politics, religion or mockery.
- coherence: concrete clues found earlier explain the twist; each ending clearly follows from the choices that lead to it. Generic endings ("the team protected the ecosystem") score at most 6.
- variety: choices are genuinely different, with distinct consequences and memorable moments; not a template.
For EVERY criterion, first quote the weakest sentence you found (Arabic or English), then give the score.
Return ONLY JSON: {"weakest":{"science":"...","arabic":"...","age":"...","coherence":"...","variety":"..."},"scores":{"science":n,"arabic":n,"age":n,"coherence":n,"variety":n},"issues":["concrete problems with node ids"]}`;
type Review = { scores: Record<string, number>; issues: string[]; pass: boolean };
const reviews: Record<string, Review> = {};
async function review(p: StoryPackage): Promise<Review> {
  if (requests >= cfg.budget.maxRequests) throw new Error('Gemini budget reached for this session');
  requests++;
  const r = await reviewer.call(REVIEW_SYSTEM, JSON.stringify({ ...p, status: undefined }), 6000);
  tokens += r.usage.inTok + r.usage.outTok;
  if (r.status !== 200) throw new Error(`Gemini HTTP ${r.status} (review)`);
  const j = JSON.parse(r.text.replace(/^```json\s*|```\s*$/g, '')) as { scores?: Record<string, number>; issues?: string[] };
  const keys = ['science', 'arabic', 'age', 'coherence', 'variety'];
  const scores = Object.fromEntries(keys.map((k) => [k, Number(j.scores?.[k] ?? 0)]));
  const out = { scores, issues: (j.issues ?? []).map(String).slice(0, 20), pass: keys.every((k) => scores[k] >= cfg.auto.minReviewScore) };
  reviews[p.id] = out; return out;
}
const meetsQuality = (r: ReturnType<typeof validateStory>) => !r.errors.length && r.warnings.length <= cfg.quality.maxWarnings
  && r.stats.paths >= cfg.quality.minDistinctPaths && r.stats.avgScenes >= cfg.quality.minAvgScenes;
/** Mechanical fixes that need no judgement: missing arrays/moods, unknown fx, too few open choices (keep 1 gated). */
const FX = new Set(['chase', 'scan', 'map', 'still', 'climb', 'sniff', 'cold', 'dig', 'flash', 'tumble', 'sample', 'echo', 'heart', 'camera', 'screen', 'radio', 'swim', 'splash', 'impact', 'sub', 'boat', 'camo', 'pop', 'stars']);
function normalize(p: StoryPackage) {
  for (const n of Object.values(p.nodes ?? {})) {
    n.props ??= []; n.choices ??= [];
    for (const c of n.choices) for (const o of [c.success, c.fail]) if (o) { if (!Array.isArray(o.effects)) o.effects = []; o.mood ??= 'thinking'; if (o.fx && !FX.has(o.fx)) o.fx = 'still'; }
    const gated = n.choices.filter((c) => c.requires);
    let open = n.choices.length - gated.length;
    while (open < 4 && gated.length > 1) { delete gated.pop()!.requires; open++; }
  }
}
/** No GPU in CI: a scene asking for new art gets the closest existing painting of the same place instead. */
function useExistingArt(p: StoryPackage) {
  const used = new Set<string>();
  for (const n of Object.values(p.nodes ?? {})) for (const w of [n, ...(n.plateWhen ?? [])]) {
    if (w.plate && plateIds.has(w.plate)) { used.add(w.plate); continue; }
    const alt = plates.find((x) => x.biome === n.biome && x.style !== 'specimen' && !['lore', 'rare', 'ending', 'camp'].includes(x.event) && !used.has(x.id))
      ?? plates.find((x) => x.biome === n.biome && x.style !== 'specimen');
    if (alt) { w.plate = alt.id; used.add(alt.id); }
  }
}
async function autoApprove(pkg: StoryPackage, user: string | null, shape: (x: StoryPackage) => StoryPackage = (x) => x): Promise<StoryPackage> {
  const check = () => validateStory(pkg, { plates: plateIds, others: existing.filter((x) => x.id !== pkg.id) });
  let rep = check();
  if (!meetsQuality(rep)) { console.log(`  stays in review (quality): ${rep.errors[0] ?? `${rep.stats.paths} paths, ${rep.warnings.length} warnings`}`); return pkg; }
  let rv = await review(pkg);
  console.log(`  editor scores ${JSON.stringify(rv.scores)}`);
  if (!rv.pass && user && cfg.auto.reviseOnce) {
    const fixed = shape(await ask(`${user}\n\nAn editor found these problems. Fix ALL of them and return the corrected full JSON (same id).\nPROBLEMS:\n${rv.issues.join('\n')}\n\nCURRENT:\n${JSON.stringify(pkg)}`));
    pkg = { ...fixed, id: pkg.id, v: 1, status: 'review', source: pkg.source }; normalize(pkg); useExistingArt(pkg); rep = check();
    if (meetsQuality(rep)) { rv = await review(pkg); console.log(`  editor scores after revision ${JSON.stringify(rv.scores)}`); }
  }
  if (rv.pass && meetsQuality(rep)) { console.log('  ✓ auto-published'); return { ...pkg, status: 'published' }; }
  console.log(`  stays in review: ${rv.issues.slice(0, 3).join(' | ')}`);
  return pkg;
}

const auto = process.argv.includes('--auto');
fs.mkdirSync('factory/runs', { recursive: true });
if (process.argv.includes('--review-drafts')) {
  // give existing "review" drafts their automatic editor pass (no regeneration)
  for (const f of fs.readdirSync('src/stories').filter((x) => x.endsWith('.json') && x !== 'catalog.json')) {
    const p = JSON.parse(fs.readFileSync(`src/stories/${f}`, 'utf8')) as StoryPackage;
    if (p.status !== 'review') continue;
    console.log(`${p.id}@${p.v}:`);
    try { const out = await autoApprove(p, null); fs.writeFileSync(`src/stories/${f}`, JSON.stringify(out, null, 1)); } catch (e) { console.log(`  failed — ${(e as Error).message}`); }
  }
} else for (let i = 0; i < concepts; i++) {
  const mode = (arg('mode') ?? weighted(cfg.modes)) as 'classic' | 'marine';
  const tone = arg('tone') ?? weighted(cfg.tones);
  const { places, skeleton } = buildSkeleton(mode, cfg.environments[mode], plates, rng);
  const user = `${lists(mode)}\nTone: ${tone}. Places in order: ${places.join(' → ')}. Invent ONE original concept set in these places, then write the full story INTO THIS SKELETON (the branching is fixed; you write everything else, in both languages):\n${JSON.stringify(skeleton)}\nStyle reference for one finished node (do not copy):\n${JSON.stringify(example?.nodes[example.start]).slice(0, 3000)}`;
  const shape = (x: StoryPackage): StoryPackage => { const m = mergeSkeleton(skeleton, x); return { ...m, tags: { ...(m.tags ?? { themes: [], twist: 'unknown', creatures: [] }), locations: places as never } }; };
  let pkg: StoryPackage | null = null; let report = null; let failure = '';
  try {
    pkg = shape(await ask(user));
    pkg = { ...pkg, v: 1, status: 'review', source: `factory:${cfg.model}` };
    // never reuse an existing id (published versions are immutable)
    if (!/^[a-z0-9-]{3,36}$/.test(pkg.id ?? '')) pkg.id = `story-${rng.int(1e6)}`;
    while (existing.some((x) => x.id === pkg!.id) || fs.existsSync(`src/stories/${pkg.id}@1.json`)) pkg.id = `${pkg.id.slice(0, 30)}-${rng.int(1000)}`;
    // NEW:<id> plates → queue for ComfyUI (manual mode) or swap for existing art (automatic mode)
    const wanted = new Set<string>();
    normalize(pkg);
    if (auto) useExistingArt(pkg);
    else for (const n of Object.values(pkg.nodes ?? {})) for (const w of [n, ...(n.plateWhen ?? [])]) if (w.plate?.startsWith('NEW:')) { w.plate = `f-${pkg.id}-${w.plate.slice(4)}`; wanted.add(w.plate); }
    const check = () => validateStory(pkg!, { plates: new Set([...plateIds, ...wanted]), others: existing });
    report = check();
    for (let a = 0; a < cfg.budget.repairAttempts && report.errors.length; a++) {
      pkg = { ...shape(await ask(`${user}\n\nYour previous JSON had these validation errors. Return the corrected full JSON.\nERRORS:\n${report.errors.slice(0, 40).join('\n')}\n\nPREVIOUS:\n${JSON.stringify(pkg)}`)), id: pkg.id, v: 1, status: 'review', source: `factory:${cfg.model}` };
      normalize(pkg); if (auto) useExistingArt(pkg);
      report = check();
    }
    console.log(`${pkg.id}: ${report.errors.length} errors, ${report.warnings.length} warnings, ${report.stats.paths} paths, endings ${JSON.stringify(report.stats.endingsReached)}; new art ${wanted.size}; hash ${contentHash(pkg)}`);
    for (const e of report.errors.slice(0, 20)) console.log('  ✗', e);
    let waitingForEditor = false;
    if (auto && !report.errors.length) {
      try { pkg = await autoApprove(pkg, user, shape); }
      catch (e) { if (!(e instanceof QuotaExhausted)) throw e; waitingForEditor = true; failure = 'valid story kept for the editor (quota) — reviewed next run'; console.log('  editor quota used up — keeping the valid draft for the next run'); }
    }
    // unattended runs only ship approved stories; rejected drafts go to factory/rejected/ (not committed)
    const dir = auto && pkg.status !== 'published' && !waitingForEditor ? 'factory/rejected' : 'src/stories';
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/${pkg.id}@1.json`, JSON.stringify(pkg, null, 1));
    if (wanted.size) {
      const batch = [...wanted].slice(0, cfg.art.maxNewPlatesPerStory).map((id, k) => {
        const n = Object.values(pkg!.nodes).find((x) => x.plate === id || x.plateWhen?.some((w) => w.plate === id))!;
        return { id, biome: n.biome, event: 'story', tone: 'mysterious', mystery: 1, style: 'nocturne', seed: cfg.art.batchSeedStart + k, w: 1344, h: 768,
          negative: 'text, letters, human, person, cartoon, cute chibi, watermark',
          prompt: `dark painterly gouache illustration, cinematic, ${n.biome}: ${n.text.en.slice(0, 300)}, no people, moody light, rich but controlled colours` };
      });
      fs.writeFileSync(`scripts/comfy/plates-factory-${pkg.id}.json`, JSON.stringify(batch, null, 1));
    }
  } catch (e) { console.log(`concept ${i + 1}: failed — ${(e as Error).message}`); failure = (e as Error).message; if (e instanceof QuotaExhausted) { log.push({ concept: i + 1, mode, tone, failure }); break; } }
  log.push({ concept: i + 1, mode, tone, id: pkg?.id, status: pkg?.status, failure, errors: report?.errors, warnings: report?.warnings, stats: report?.stats });
}
fs.writeFileSync(`factory/runs/${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify({ requests, tokens, log }, null, 1));
console.log(`\nGemini requests: ${requests}/${cfg.budget.maxRequests}, tokens ≈ ${tokens}`);

// public, human-readable report (committed by the workflow even when nothing was published)
if (process.argv.includes('--report')) {
  const rows = (log as { concept?: number; mode?: string; tone?: string; id?: string; status?: string; failure?: string; errors?: string[]; stats?: { paths: number } }[]).filter((x) => x.concept);
  const md = rows.map((x) => {
    const rv = x.id ? reviews[x.id] : undefined;
    const why = x.failure ? `failed: ${x.failure}` : x.errors?.length ? `validator: ${x.errors.slice(0, 2).join('; ')}` : rv && !rv.pass ? `editor: ${rv.issues.slice(0, 2).join('; ')}` : x.status === 'published' ? 'published ✅' : 'stayed in review';
    return `| ${x.mode} · ${x.tone} | ${x.id ?? '—'} | ${rv ? Object.entries(rv.scores).map(([k, v]) => `${k} ${v}`).join(', ') : '—'} | ${why.replace(/\|/g, '/').slice(0, 300)} |`;
  });
  fs.mkdirSync('reports', { recursive: true });
  fs.appendFileSync('reports/factory-latest.md', md.join('\n') + (md.length ? '\n' : '') + `\n_Gemini requests this step: ${requests}, tokens ≈ ${tokens}_\n\n`);
}
