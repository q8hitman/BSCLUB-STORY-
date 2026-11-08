// Evaluates live AI story generation BEFORE it is integrated into the game.
// Usage:
//   npx tsx scripts/ai-eval/run.ts --provider=gemini --model=gemini-2.5-flash-lite --n=20 --rpm=12
//   npx tsx scripts/ai-eval/run.ts --provider=cloudflare --model=@cf/qwen/qwen3-30b-a3b-fp8 --n=20
//   npx tsx scripts/ai-eval/run.ts --provider=mock --n=4          (tests the harness only)
// Writes reports/ai-eval/<provider>-<model>/{runs.json,summary.md,samples.md}.
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomCreature, derive } from '../../src/engine/creature';
import { Rng } from '../../src/engine/rng';
import type { Mode } from '../../src/engine/types';
import { TONES, catalog, creatureBrief, type AiBeat, type AiEnding, type Outline } from './contract';
import { cloudflare, gemini, mock, type Provider, type Usage } from './providers';
import { validateBeat, validateEnding, validateOutline, type Issues } from './validate';

const arg = (k: string, d?: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? d;
const N = Number(arg('n', '20')), RPM = Number(arg('rpm', '12')), FULL = Number(arg('full', String(N)));
const prov: Provider = arg('provider') === 'cloudflare' ? cloudflare(arg('model')) : arg('provider') === 'gemini' ? gemini(arg('model')) : mock();

const SYSTEM = `You are the Story Director for "BSC BioLab: What The Beast?!", a bilingual (English + Arabic) cinematic visual novel by the Biological Sciences Club, Kuwait University.
Write for teens and adults: mysterious, varied, witty when the tone allows, never gory. Every place may hide a mystery — land and sea.
Arabic: clear, simple Modern Standard Arabic everywhere; duck lines may keep a light personal touch but no heavy Kuwaiti slang. Never Egyptian, Levantine or Iraqi dialect. Arabic must be natural, not a literal translation.
HARD RULES:
- Use ONLY ids from the provided catalog (biomes, sceneProps, npcs, facts, tones, styles, moods, creatureStates, marks, stats). Never invent ids.
- Real science appears ONLY by citing a fact id from the catalog. Never state other scientific claims as fact.
- The player's creature is called {CREATURE}; keep that token verbatim. Never use the player's name.
- The creature may only use capabilities listed in its brief. Its trade-offs should matter.
- Arabic grammar: {CREATURE} is always grammatically masculine (يتقدم {CREATURE}، يكتشف). Narration is third person about {CREATURE} — never "you"/"عيناك"/"عيونك". Check spelling carefully (الأعماق not الأعمار, أعمى not عمي).
- Duck lines in Arabic: MSA with a light personal touch. Forbidden words: كلش، ماكو، أكو، شكو، يابه، هواية، هيك، كده، عايز، وايد، شنو، جذي، يبي. Use كثيراً for "a lot".
- Animals: name only animals from catalog.bestiary, by id (act.animals, beat.featured_animal). Never invent an animal id.
- Marine order: surface, open sea, twilight, midnight/vents, trench; never climb back up.
- Legends: at most one act may set "legend" to an id from catalog.legends_rare, in one of that legend's biomes.
- Ducks are companions only: they comment, react, theorise and give light hints; they never decide.
- In Arabic, name the creature's body parts and the places EXACTLY by the Arabic names given in the brief/catalog — never translate them yourself.
- Ducks speak to the team in plural (شوفوا، انتبهوا).
- EVERY player-facing text field (title, premise, text, label, duck_line, summary, epilogue, outcome text) is an object {"en": "...", "ar": "..."} — never a plain string.
- The ducks (catalog.ducks) are the player's companions. They are NEVER an act's "npc"; "npc" is an id from catalog.npcs or null.
- Clues: "plants_clue" is a short clue id you invent (e.g. "clue_scratched_shell"); "pays_off" must repeat a clue id planted in an EARLIER act, or be null. Never use act ids there.
- Respond with a single JSON object, no markdown.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function call(user: object, maxTokens: number) {
  const gap = 60000 / RPM - (Date.now() - lastCall); if (gap > 0) await sleep(gap);
  lastCall = Date.now();
  return prov.call(SYSTEM, JSON.stringify(user), maxTokens);
}
/** Syntax-only repair for a known lite-model slip: a property name missing its quotes (`_creature_state:` / `label":`).
 *  Content is never changed; repaired replies are counted in the report. */
export function repairKeys(text: string): string {
  return text.replace(/^(\s*)"?_?([A-Za-z][A-Za-z0-9_]*)"?\s*:(?=\s)/gm, '$1"$2":');
}
let repaired = 0;
function parse<T>(text: string): T | null {
  const tryParse = (t: string) => { try { return JSON.parse(t) as T; } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? (JSON.parse(m[0]) as T) : null; } catch { return null; } } };
  const x = tryParse(text); if (x) return x;
  const y = tryParse(repairKeys(text)); if (y) repaired++;
  return y;
}

interface CallLog { raw?: string; kind: string; ms: number; usage: Usage; status: number; valid: boolean; retried: boolean; issues: Issues }
interface RunLog { i: number; mode: Mode; creature: string; tone: string; outline: Outline | null; beats: AiBeat[]; ending: AiEnding | null; calls: CallLog[] }

async function generate<T>(kind: string, req: object, max: number, check: (x: T) => Issues, calls: CallLog[]): Promise<T | null> {
  let feedback = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    let r = await call(feedback ? { ...req, previous_errors: feedback } : req, max);
    for (let k = 0; k < 3 && r.status >= 500; k++) { await sleep(4000 * (k + 1)); r = await call(feedback ? { ...req, previous_errors: feedback } : req, max); } // transient overload, not a content failure
    const x = parse<T>(r.text);
    let iss: Issues;
    try { iss = x ? check(x) : { errors: [`unparseable (${r.status}): ${r.text.slice(0, 120)}`], warnings: [] }; } catch (e) { iss = { errors: [`wrong shape: ${(e as Error).message}`], warnings: [] }; }
    calls.push({ kind, ms: r.ms, usage: r.usage, status: r.status, valid: iss.errors.length === 0, retried: attempt > 0, issues: iss, ...(x ? {} : { raw: r.text.slice(0, 6000) }) });
    if (iss.errors.length === 0) return x;
    if (r.status === 429) { console.log('  quota/rate limit hit (429)'); return null; }
    feedback = iss.errors.slice(0, 6).join('; ');
  }
  return null;
}

async function main() {
  const out = `reports/ai-eval/${prov.name}-${prov.model.replace(/[^\w.-]+/g, '_')}`;
  mkdirSync(out, { recursive: true });
  const runs: RunLog[] = []; const history: { premise_tag: string; twist_tag: string; biomes: string }[] = [];
  for (let i = 0; i < N; i++) {
    const mode: Mode = i % 2 ? 'marine' : 'classic';
    const r = Rng.from(9000 + i, 'ai-eval');
    const creature = randomCreature(r, 'en');
    const d = derive(creature);
    const tone = TONES[i % TONES.length];
    const log: RunLog = { i, mode, creature: `${creature.base}/${creature.limbs}/${creature.adaptation}/${creature.ability}`, tone, outline: null, beats: [], ending: null, calls: [] };
    console.log(`#${i} ${mode} ${log.creature} tone=${tone}`);
    const outline = await generate<Outline>('outline', {
      task: 'outline', mode, tone_target: tone, creature: creatureBrief(creature), catalog: catalog(mode),
      avoid_recent: history.slice(-8),
      instructions: `Invent a NEW adventure structure. "acts" MUST contain 8, 9 or 10 acts — never fewer. premise_tag and twist_tag are short plain English snake_case strings (not objects). Scene props only from catalog.sceneProps. Marine: start at the surface (Surface Waters), then descend to The Deep; the sailor legend is optional. Plant clues before paying them off. animals: bestiary ids only (or []). plate: an id from catalog.scenePlates or null. Return {title,premise,premise_tag,tone,twist_tag,acts:[{id,biome,props,purpose,npc,plants_clue,pays_off,animals,legend,plate}],mysteries,ending_options}.`,
    }, 2200, (o) => validateOutline(o, mode), log.calls);
    log.outline = outline;
    if (outline) {
      history.push({ premise_tag: outline.premise_tag, twist_tag: outline.twist_tag, biomes: outline.acts.map((a) => a.biome).join('>') });
      if (i < FULL) {
        const cat = catalog(mode);
        const beatCatalog = { facts: cat.facts, styles: cat.styles, duck_moods: cat.moods, creature_states: cat.creatureStates, marks: cat.marks, stats: cat.stats, check_dc_range: [2, 9], npcs: cat.npcs.map((n) => n.id) };
        const state = { evidence: [] as string[], flags: [] as string[], energy: 5, marks: [] as string[], recent: [] as string[] };
        for (const act of outline.acts) {
          const beat = await generate<AiBeat>('beat', {
            task: 'beat', mode, creature: creatureBrief(creature), outline: { title: outline.title.en, premise: outline.premise.en, twist: outline.twist_tag }, act, state, allowed: beatCatalog,
            instructions: 'Use ONLY the ids in "allowed" (fact_id from allowed.facts or null; style, duck_mood, creature_state, stat from their lists; dc an integer in check_dc_range). Write this act: {act_id,text,duck_line,fact_id,featured_animal (a bestiary id from act.animals, or null),choices:[exactly 4 {id,label,style,uses_capability,check:{stat,dc}|null,success:{text,effects,duck_mood,creature_state},fail}]}. "effects" is ALWAYS an array (possibly empty) of {t,id?,npc?,d?} with t from: flag, evidence, discovery, rel, energy, trust, mark. Rules: discovery.id MUST be an id from allowed.facts; story clues go in evidence.id (any short id); mark.id from allowed.marks; energy and trust need an integer d (-2..2); rel needs npc (from allowed.npcs) and d. duck_line is an {en,ar} object. "fail" has the same shape as success, or null when there is no check. Choices must be genuinely different strategies with different consequences; at least one should use a creature capability or exploit a trade-off.',
          }, 4000, (b) => validateBeat(b, d.caps, new Set(state.evidence), act.biome), log.calls);
          if (!beat) break;
          log.beats.push(beat);
          const ch = beat.choices[r.int(beat.choices.length)];
          const ok = !ch.check || r.chance(0.6);
          const o = ok || !ch.fail ? ch.success : ch.fail;
          for (const e of Array.isArray(o.effects) ? o.effects : []) { if (e.t === 'evidence' && e.id) state.evidence.push(e.id); if (e.t === 'flag' && e.id) state.flags.push(e.id); if (e.t === 'mark' && e.id) state.marks.push(e.id); if (e.t === 'energy') state.energy += e.d ?? 0; }
          state.recent = [...state.recent, `${act.id}: chose "${ch.label.en}" → ${o.text.en}`].slice(-3);
        }
        const planted = outline.acts.map((a) => a.plants_clue).filter((c): c is string => typeof c === 'string' && c.length > 0);
        log.ending = await generate<AiEnding>('ending', { task: 'ending', mode, creature: creatureBrief(creature), outline: { title: outline.title.en, premise: outline.premise.en }, state: {}, journey: log.beats.map((b) => b.text.en.slice(0, 160)), allowed_tones: TONES, planted_clues: planted, instructions: 'Write a personalised ending {title,summary,epilogue,tone,pays_off_clues} (tone is one of allowed_tones). pays_off_clues lists at least one id from planted_clues that the summary explicitly resolves. Name {CREATURE}, at least one body part that mattered, a real decision, the places and the twist. No very short endings.' }, 1400, (e) => validateEnding(e, planted), log.calls);
      }
    }
    runs.push(log);
    writeFileSync(`${out}/runs.json`, JSON.stringify(runs, null, 1));
  }
  writeFileSync(`${out}/summary.md`, summary(runs));
  writeFileSync(`${out}/samples.md`, samples(runs));
  console.log(`\nWrote ${out}/summary.md`);
}

function shingles(s: string) { const w = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((x) => x.length > 3); const set = new Set<string>(); for (let i = 0; i + 1 < w.length; i++) set.add(w[i] + ' ' + w[i + 1]); return set; }
function jac(a: Set<string>, b: Set<string>) { let n = 0; a.forEach((x) => { if (b.has(x)) n++; }); const u = a.size + b.size - n; return u ? n / u : 0; }

function summary(runs: RunLog[]) {
  const calls = runs.flatMap((r) => r.calls);
  const by = (k: string) => calls.filter((c) => c.kind === k);
  const firstTry = (k: string) => { const c = by(k).filter((x) => !x.retried); return c.length ? Math.round((100 * c.filter((x) => x.valid).length) / c.length) : 0; };
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const outlines = runs.map((r) => r.outline).filter(Boolean) as Outline[];
  const sh = outlines.map((o) => shingles(o.premise.en + ' ' + o.acts.map((a) => a.purpose).join(' ')));
  let pairs = 0, sum = 0, max = 0; for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) { const v = jac(sh[i], sh[j]); sum += v; pairs++; max = Math.max(max, v); }
  const warnings = calls.flatMap((c) => c.issues.warnings); const errors = calls.flatMap((c) => c.issues.errors);
  const dialect = warnings.filter((w) => w.includes('dialect')).length;
  const perRun = runs.filter((r) => r.ending).map((r) => r.calls.reduce((a, c) => ({ inTok: a.inTok + c.usage.inTok, outTok: a.outTok + c.usage.outTok, n: a.n + 1 }), { inTok: 0, outTok: 0, n: 0 }));
  const avgRun = { calls: avg(perRun.map((p) => p.n)), inTok: avg(perRun.map((p) => p.inTok)), outTok: avg(perRun.map((p) => p.outTok)) };
  const top = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(', ');
  return [`# AI story evaluation — ${prov.name} / ${prov.model}`, '', `Runs: ${runs.length} (${runs.filter((r) => r.mode === 'classic').length} classic, ${runs.filter((r) => r.mode === 'marine').length} marine). Generated ${new Date().toISOString()}.`, '',
    '| Metric | Value |', '|---|---|',
    `| Outlines valid (first try) | ${firstTry('outline')}% |`, `| Beats valid (first try) | ${firstTry('beat')}% |`, `| Endings valid (first try) | ${firstTry('ending')}% |`,
    `| Runs completed end-to-end | ${runs.filter((r) => r.ending).length}/${runs.filter((r) => r.i < FULL).length} |`,
    `| Avg latency: outline / beat / ending | ${avg(by('outline').map((c) => c.ms))} / ${avg(by('beat').map((c) => c.ms))} / ${avg(by('ending').map((c) => c.ms))} ms |`,
    `| Avg per full run | ${avgRun.calls} calls, ${avgRun.inTok} in-tokens, ${avgRun.outTok} out-tokens |`,
    `| HTTP 429 (quota) responses | ${calls.filter((c) => c.status === 429).length} |`,
    `| Distinct premise tags | ${new Set(outlines.map((o) => o.premise_tag)).size}/${outlines.length} |`,
    `| Distinct twist tags | ${new Set(outlines.map((o) => o.twist_tag)).size}/${outlines.length} |`,
    `| Distinct place sequences | ${new Set(outlines.map((o) => o.acts.map((a) => a.biome).join('>'))).size}/${outlines.length} |`,
    `| Outline text similarity (bigram Jaccard) mean / max | ${pairs ? (sum / pairs).toFixed(3) : '-'} / ${max.toFixed(3)} |`,
    `| Possible wrong-dialect flags (Arabic) | ${dialect} |`,
    `| Validation errors (all attempts) | ${errors.length} |`, `| Replies needing a JSON syntax repair | ${repaired} |`, '',
    `Most common errors: ${top(errors.map((e) => e.replace(/\d+/g, '#').slice(0, 70)))}`, '',
    `Premise tags: ${outlines.map((o) => o.premise_tag).join(', ')}`, '', `Twist tags: ${outlines.map((o) => o.twist_tag).join(', ')}`, ''].join('\n');
}

function samples(runs: RunLog[]) {
  return runs.map((r) => [`## #${r.i} ${r.mode} — ${r.outline?.title.en ?? '(no outline)'} / ${r.outline?.title.ar ?? ''}`, `Creature: ${r.creature}; tone target: ${r.tone}`, '',
    r.outline ? `**Premise:** ${r.outline.premise.en}\n\n**الفكرة:** ${r.outline.premise.ar}\n\n**Acts:** ${r.outline.acts.map((a) => `${a.biome}(${a.purpose})`).join(' → ')}` : '',
    ...r.beats.slice(0, 2).map((b) => `\n> ${b.text.en}\n>\n> ${b.text.ar}\n>\n> ${b.choices.map((c) => `[${c.style}] ${c.label.ar}`).join(' | ')}`),
    r.ending ? `\n**Ending:** ${r.ending.title.en} — ${r.ending.summary.ar}` : '', ''].join('\n')).join('\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
