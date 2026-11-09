// BSC Story Factory — steps 1–8: concept → branching graph → validation → (one repair) → asset list.
// Development-time only. Runs ONLY when you start it; visitors never need Gemini, ComfyUI or this PC.
//   npx tsx scripts/factory/generate.ts                 → uses scripts/factory/factory.config.json
//   npx tsx scripts/factory/generate.ts --mode classic --tone comedy --concepts 1
// Key: GEMINI_API_KEY or ~/.bsc/gemini.key (never committed, never in the frontend). Free tier only.
// Output: src/stories/<id>@1.json with status "review" (never auto-published), factory/runs/<time>.json (log),
// and scripts/comfy/plates-factory-<id>.json (ComfyUI batch for missing scenes, same format as other batches).
// A human reads the draft, fixes or rejects it, sets status "published", then runs scripts/factory/publish.ts.
import fs from 'node:fs';
import { gemini } from '../ai-eval/providers';
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

const provider = gemini(cfg.model);
let requests = 0, tokens = 0;
const log: unknown[] = [];
async function ask(user: string, retryParse = false): Promise<StoryPackage> {
  if (requests >= cfg.budget.maxRequests || tokens >= cfg.budget.maxTotalTokens) throw new Error('Gemini budget reached for this session');
  requests++;
  const r = await provider.call(SYSTEM, user, cfg.budget.maxOutputTokensPerRequest);
  tokens += r.usage.inTok + r.usage.outTok;
  log.push({ status: r.status, ms: r.ms, usage: r.usage });
  if (r.status !== 200) throw new Error(`Gemini HTTP ${r.status}`);
  try { return JSON.parse(r.text.replace(/^```json\s*|```\s*$/g, '')) as StoryPackage; }
  catch (e) { if (retryParse) throw e; console.log('  (malformed JSON, asking again)'); return ask(user, true); }
}

fs.mkdirSync('factory/runs', { recursive: true });
for (let i = 0; i < concepts; i++) {
  const mode = (arg('mode') ?? weighted(cfg.modes)) as 'classic' | 'marine';
  const tone = arg('tone') ?? weighted(cfg.tones);
  const user = `${lists(mode)}\nTone: ${tone}. Invent ONE original concept, then write the full branching story.\nStyle reference (structure only, do not copy):\n${JSON.stringify(example?.nodes[example.start]).slice(0, 3500)}`;
  let pkg: StoryPackage | null = null; let report = null;
  try {
    pkg = await ask(user);
    pkg = { ...pkg, v: 1, status: 'review', source: `factory:${cfg.model}` };
    // NEW:<id> plates → queue for ComfyUI, validate as if present
    const wanted = new Set<string>();
    for (const n of Object.values(pkg.nodes ?? {})) for (const w of [n, ...(n.plateWhen ?? [])]) if (w.plate?.startsWith('NEW:')) { w.plate = `f-${pkg.id}-${w.plate.slice(4)}`; wanted.add(w.plate); }
    const check = () => validateStory(pkg!, { plates: new Set([...plateIds, ...wanted]), others: existing });
    report = check();
    for (let a = 0; a < cfg.budget.repairAttempts && report.errors.length; a++) {
      pkg = { ...(await ask(`${user}\n\nYour previous JSON had these validation errors. Return the corrected full JSON.\nERRORS:\n${report.errors.slice(0, 40).join('\n')}\n\nPREVIOUS:\n${JSON.stringify(pkg)}`)), v: 1, status: 'review', source: `factory:${cfg.model}` };
      report = check();
    }
    fs.writeFileSync(`src/stories/${pkg.id}@1.json`, JSON.stringify(pkg, null, 1));
    if (wanted.size) {
      const batch = [...wanted].slice(0, cfg.art.maxNewPlatesPerStory).map((id, k) => {
        const n = Object.values(pkg!.nodes).find((x) => x.plate === id || x.plateWhen?.some((w) => w.plate === id))!;
        return { id, biome: n.biome, event: 'story', tone: 'mysterious', mystery: 1, style: 'nocturne', seed: cfg.art.batchSeedStart + k, w: 1344, h: 768,
          negative: 'text, letters, human, person, cartoon, cute chibi, watermark',
          prompt: `dark painterly gouache illustration, cinematic, ${n.biome}: ${n.text.en.slice(0, 300)}, no people, moody light, rich but controlled colours` };
      });
      fs.writeFileSync(`scripts/comfy/plates-factory-${pkg.id}.json`, JSON.stringify(batch, null, 1));
    }
    console.log(`${pkg.id}: ${report.errors.length} errors, ${report.warnings.length} warnings, ${report.stats.paths} paths, endings ${JSON.stringify(report.stats.endingsReached)}; new art ${wanted.size}; hash ${contentHash(pkg)}`);
    for (const e of report.errors.slice(0, 20)) console.log('  ✗', e);
  } catch (e) { console.log(`concept ${i + 1}: failed — ${(e as Error).message}`); }
  log.push({ concept: i + 1, mode, tone, id: pkg?.id, errors: report?.errors, warnings: report?.warnings, stats: report?.stats });
}
fs.writeFileSync(`factory/runs/${new Date().toISOString().replace(/[:.]/g, '-')}.json`, JSON.stringify({ requests, tokens, log }, null, 1));
console.log(`\nGemini requests: ${requests}/${cfg.budget.maxRequests}, tokens ≈ ${tokens}`);
