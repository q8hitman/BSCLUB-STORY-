// Narrative engine: deterministic planner + state machine. Pure functions over serialisable state.
import { COMMON_BEATS } from '../content/beatsCommon';
import { CAMP_BEATS } from '../content/beatsCamp';
import { CLASSIC_BEATS } from '../content/beatsClassic';
import { MARINE_BEATS } from '../content/beatsMarine';
import { DUCK_BY_ID } from '../content/ducks';
import { BIOMES, NPC_BY_ID } from '../content/world';
import { derive, partForStat, weakestPartForStat } from './creature';
import { Rng, hashString } from './rng';
import type {
  BeatTemplate, BiomeId, Choice, Cond, CreatureConfig, DerivedCreature, Effect, GameState, L10n, Lang, Mode,
  Outcome, PlannedBeat, StoryPlan,
} from './types';

export const ALL_BEATS: BeatTemplate[] = [...COMMON_BEATS, ...CLASSIC_BEATS, ...MARINE_BEATS, ...CAMP_BEATS];
export const BEAT_BY_ID: Record<string, BeatTemplate> = Object.fromEntries(ALL_BEATS.map((b) => [b.id, b]));

const LAND: BiomeId[] = ['forest', 'desert', 'mountain', 'cave', 'snow', 'swamp'];
const SURFACE: BiomeId[] = ['reef', 'mudflat', 'seagrass'];
const DEEP: BiomeId[] = ['twilight', 'midnight', 'vents'];
export const START_ENERGY = 5;
export const MAX_ENERGY = 7;
export const DYNAMIC_KINDS = new Set(['encounter', 'twist', 'climax']);

// ───────────────────────── conditions ─────────────────────────

export function condHolds(cond: Cond | undefined, d: DerivedCreature, s: Pick<GameState, 'flags' | 'evidence' | 'mode'>, biome?: BiomeId): boolean {
  if (!cond) return true;
  if (cond.mode && cond.mode !== s.mode) return false;
  if (cond.capAny && !cond.capAny.some((c) => d.caps.has(c))) return false;
  if (cond.capNone && cond.capNone.some((c) => d.caps.has(c))) return false;
  if (cond.statMin) for (const [k, v] of Object.entries(cond.statMin)) if (d.stats[k as keyof typeof d.stats] < (v ?? 0)) return false;
  if (cond.statMax) for (const [k, v] of Object.entries(cond.statMax)) if (d.stats[k as keyof typeof d.stats] > (v ?? 0)) return false;
  if (cond.flag && !cond.flag.every((f) => s.flags.includes(f))) return false;
  if (cond.notFlag && cond.notFlag.some((f) => s.flags.includes(f))) return false;
  if (cond.evidenceMin !== undefined && s.evidence.length < cond.evidenceMin) return false;
  if (cond.flagAny && !cond.flagAny.some((f) => s.flags.includes(f))) return false;
  if (cond.evidenceAny && !cond.evidenceAny.some((e) => s.evidence.includes(e))) return false;
  if (cond.wet !== undefined && biome && BIOMES[biome].wet !== cond.wet) return false;
  if (cond.biome && biome && !cond.biome.includes(biome)) return false;
  return true;
}

// ───────────────────────── planning ─────────────────────────

interface Skeleton { kind: BeatTemplate['kind']; biome: BiomeId | 'auto'; template?: string; opt?: boolean }

/** Story length and mood chosen on the mode screen. Defaults reproduce the original full, balanced adventure. */
export interface PlanOpts { length?: 'quick' | 'full'; tone?: 'balanced' | 'light' | 'mystery' }

function pickStatic(rng: Rng, mode: Mode, kind: BeatTemplate['kind'], biome: BiomeId, used: Set<string>, d: DerivedCreature, tone?: PlanOpts['tone']): string | undefined {
  let pool = ALL_BEATS.filter((b) => b.kind === kind && (b.mode === mode || b.mode === 'both') && b.biomes.includes(biome) && !used.has(b.id)
    && condHolds(b.requires, d, { flags: [], evidence: [], mode }, biome));
  if (!pool.length) return undefined;
  // light-hearted runs get more quiet camp moments
  if (tone === 'light' && kind === 'explore') { const camp = pool.filter((b) => b.id.startsWith('camp-')); if (camp.length && rng.chance(0.6)) pool = camp; }
  if (tone === 'mystery' && kind === 'explore') pool = pool.filter((b) => !b.id.startsWith('camp-')).length ? pool.filter((b) => !b.id.startsWith('camp-')) : pool;
  const id = rng.pick(pool).id; used.add(id); return id;
}

function buildPlan(seed: number, mode: Mode, d: DerivedCreature, o: PlanOpts = {}): StoryPlan {
  const rng = Rng.from(seed, 'plan');
  const used = new Set<string>();
  const sk: Skeleton[] = [];
  let legend = false; let biomes: BiomeId[];
  const hookPool = ALL_BEATS.filter((b) => b.kind === 'hook' && b.mode === mode);
  const hook = rng.pick(hookPool).id;
  sk.push({ kind: 'hook', biome: 'lab', template: hook });

  if (mode === 'classic') {
    const order = rng.shuffle(LAND);
    const b3: BiomeId = rng.chance(o.tone === 'mystery' ? 0.7 : 0.45) ? 'ruins' : order[2];
    biomes = [order[0], order[1], b3];
    sk.push({ kind: 'explore', biome: biomes[0] }, { kind: 'challenge', biome: biomes[0], opt: true });
    sk.push({ kind: 'encounter', biome: rng.chance(0.5) ? biomes[0] : biomes[1] });
    if (rng.chance(0.6)) sk.push({ kind: 'explore', biome: biomes[1], opt: true });
    sk.push({ kind: 'challenge', biome: biomes[1] });
    sk.push({ kind: 'twist', biome: biomes[1] });
    sk.push({ kind: 'explore', biome: biomes[2], opt: true });
    if (rng.chance(0.5)) sk.push({ kind: 'challenge', biome: biomes[2], opt: true });
    sk.push({ kind: 'climax', biome: biomes[2] });
  } else {
    const s = rng.shuffle(SURFACE); const dp = rng.shuffle(DEEP);
    legend = rng.chance(o.tone === 'mystery' ? 0.65 : 0.4); // the sailor's legend appears in some runs only
    let finalDeep: BiomeId = rng.chance(o.tone === 'light' ? 0.15 : 0.35) ? 'trench' : dp[1];
    if (legend && finalDeep === 'vents') finalDeep = 'midnight'; // the legend's payoff lives in the dark
    if (finalDeep === dp[0]) dp[0] = dp.find((x) => x !== finalDeep)!;
    biomes = [s[0], s[1], dp[0], finalDeep];
    sk.push({ kind: 'explore', biome: s[0] }, { kind: 'challenge', biome: s[0], opt: true });
    sk.push({ kind: 'encounter', biome: rng.chance(0.5) ? s[0] : s[1] });
    if (legend) sk.push({ kind: 'legend', biome: s[1] });
    if (!legend || rng.chance(0.5)) sk.push({ kind: 'explore', biome: s[1], opt: true });
    sk.push({ kind: 'phase', biome: 'openSea', template: 'pm-descend' });
    sk.push({ kind: 'explore', biome: dp[0], opt: true }, { kind: 'challenge', biome: dp[0] });
    sk.push({ kind: 'twist', biome: rng.chance(0.5) ? dp[0] : finalDeep });
    if (finalDeep !== 'trench' && rng.chance(0.5)) sk.push({ kind: 'explore', biome: finalDeep, opt: true });
    else sk.push({ kind: 'challenge', biome: finalDeep, opt: true });
    sk.push({ kind: 'climax', biome: finalDeep });
  }

  const skel = o.length === 'quick' ? sk.filter((x) => !x.opt) : sk;
  const beats: PlannedBeat[] = skel.map((x, i) => {
    const biome = x.biome as BiomeId;
    let template = x.template;
    if (!template && !DYNAMIC_KINDS.has(x.kind)) {
      const r = Rng.from(seed, `slot${i}`);
      template = pickStatic(r, mode, x.kind, biome, used, d, o.tone)
        // Fallback: any challenge for this biome (should not be needed; tested).
        ?? pickStatic(r, mode, 'challenge', biome, used, d);
    }
    return { template: template ?? `@${x.kind}`, biome };
  });
  return { mode, seed, hook, biomes, beats, legend, ...(o.length === 'quick' ? { length: 'quick' as const } : {}), ...(o.tone && o.tone !== 'balanced' ? { tone: o.tone } : {}) };
}

export function planTokens(p: StoryPlan): string[] {
  return [`m:${p.mode}`, `h:${p.hook}`, ...p.biomes.map((b, i) => `b${i}:${b}`), ...p.beats.map((b) => `t:${b.template}@${b.biome}`), `L:${p.legend}`];
}

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b);
  let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; });
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}

export interface RunMemory { planTokens: string[]; pathTokens: string[]; ending: string; templates: string[]; mode: Mode }

/** Candidate plan k for a seed. Pure: the same inputs give the same plan on any device (saves store only k). */
export function planVariant(seed: number, mode: Mode, creature: CreatureConfig, k: number, d: DerivedCreature = derive(creature), o: PlanOpts = {}): StoryPlan {
  const p = buildPlan(hashString(`${seed}#${k}`), mode, d, o);
  p.seed = seed; p.variant = k;
  return p;
}

/** Generates several candidate plans and keeps the one least similar to recent runs. */
export function planStory(seed: number, mode: Mode, creature: CreatureConfig, history: RunMemory[] = [], candidates = 8, o: PlanOpts = {}): StoryPlan {
  const d = derive(creature);
  const recent = history.filter((h) => h.mode === mode).slice(-12);
  let best: StoryPlan | null = null; let bestScore = Infinity;
  for (let k = 0; k < candidates; k++) {
    const p = planVariant(seed, mode, creature, k, d, o);
    const toks = planTokens(p);
    const score = recent.length ? Math.max(...recent.map((h) => jaccard(toks, h.planTokens))) : 0;
    if (score < bestScore - 1e-9) { best = p; bestScore = score; }
    if (!recent.length) break;
  }
  return best!;
}

// ───────────────────────── runtime ─────────────────────────

export interface StartOptions { mode: Mode; seed: number; duck: string; player: string; creature: CreatureConfig; history?: RunMemory[]; opts?: PlanOpts }

export function startGame(o: StartOptions): GameState {
  const plan = planStory(o.seed, o.mode, o.creature, o.history ?? [], 8, o.opts);
  // only runtime-resolved kinds read this list, so keep just those (keeps saves small)
  const avoid = [...new Set((o.history ?? []).filter((h) => h.mode === o.mode).slice(-4).flatMap((h) => h.templates))].filter((id) => DYNAMIC_KINDS.has(BEAT_BY_ID[id]?.kind ?? ''));
  return startFromPlan({ ...o, plan, avoid });
}

/** Starts a run from an explicit plan and anti-repetition list (used to rebuild a saved run on another device). */
export function startFromPlan(o: Omit<StartOptions, 'history'> & { plan: StoryPlan; avoid: string[]; pins?: GameState['pins'] }): GameState {
  const s: GameState = {
    version: 1, mode: o.mode, seed: o.seed, duck: o.duck, player: o.player.slice(0, 24), creature: o.creature, plan: o.plan,
    index: 0, stage: 'beat', energy: START_ENERGY, trust: 0, flags: [], evidence: [], discoveries: [], rel: {}, log: [], avoid: o.avoid,
    ...(o.pins ? { pins: o.pins } : {}),
  };
  return resolveCurrent(s);
}

/** Resolves runtime-chosen beats (encounter/twist/climax) once, when reached, based on current flags. */
function resolveCurrent(s: GameState): GameState {
  const pb = s.plan.beats[s.index];
  if (!pb || !pb.template.startsWith('@')) return s;
  const kind = pb.template.slice(1) as BeatTemplate['kind'];
  const d = derive(s.creature);
  const avoid = new Set(s.avoid ?? []);
  const usedNow = new Set(s.plan.beats.map((b) => b.template));
  const rng = Rng.from(s.seed, `dyn${s.index}`);
  const metOrPlanned = new Set(s.plan.beats.map((b) => b.npc ?? BEAT_BY_ID[b.template]?.npc).filter(Boolean));
  let pool = ALL_BEATS.filter((b) => b.kind === kind && (b.mode === s.mode || b.mode === 'both') && !usedNow.has(b.id)
    && condHolds(b.requires, d, s) && !(b.npc && metOrPlanned.has(b.npc)) && !(b.npc && s.flags.includes(`met:${b.npc}`)));
  let biome = pb.biome;
  // Set-ups (hook flags, the sailor's legend) must pay off even if the planned biome differs.
  // Classic hook payoffs fire most of the time (an unresolved mystery is a valid ending); the legend always pays off.
  const payoffRoll = rng.float();
  const payoff = pool.filter((b) => b.requires?.flag?.some((f) => f.startsWith('legend') || (f.startsWith('hook:') && payoffRoll < 0.7)));
  const inBiome = pool.filter((b) => b.biomes.includes(biome));
  if (payoff.length) pool = payoff.some((b) => b.biomes.includes(biome)) ? payoff.filter((b) => b.biomes.includes(biome)) : payoff;
  else if (inBiome.length) pool = inBiome;
  if (!pool.length) {
    // Should never happen (tested) — degrade to a generic challenge rather than crash.
    pool = COMMON_BEATS.filter((b) => b.biomes.includes(biome) && (b.mode === 'both' || b.mode === s.mode));
  }
  const tpl = rng.weighted(pool, (b) => {
    let w = b.weight ?? 1;
    if (avoid.has(b.id)) w *= 0.25;
    return w;
  });
  if (!tpl.biomes.includes(biome)) biome = rng.pick(tpl.biomes);
  const beats = s.plan.beats.slice();
  beats[s.index] = { ...pb, template: tpl.id, biome, npc: tpl.npc };
  return { ...s, plan: { ...s.plan, beats } };
}

export interface BeatView {
  template: BeatTemplate;
  biome: BiomeId;
  phase?: 'surface' | 'deep';
  text: L10n;
  choices: { choice: Choice; label: L10n; odds: number | null }[];
  ctx: Ctx;
  /** Bestiary id of the important creature this beat talks about (must be shown visually), or null. */
  featured?: string | null;
}

export interface Ctx {
  name: string; player: string; duck: L10n; duckG: 'm' | 'f'; place: L10n; obstacle: L10n; predator: L10n; critter: L10n; npc: L10n;
  /** Bestiary ids behind {predator} / {critter}, so the UI can show the animal the text names. */
  predatorAnimal: string; critterAnimal: string;
}

/**
 * Place labels for Story Archive scenes. Their place used to be the generic name of the scene's biome, so a mountain
 * station's control room was labelled "the BSC Lab". Display only: not part of a story's locked content.
 */
const PL = (en: string, ar: string): L10n => ({ en, ar });
const SCENE_PLACE: Record<string, L10n> = {
  'silent-ridge@1:ridge': PL('The mountain ridge', 'حافّة الجبل'), 'silent-ridge@1:tracks': PL('The snowy path', 'الطريق الثلجي'),
  'silent-ridge@1:station': PL('The research station', 'محطة الأبحاث'), 'silent-ridge@1:control': PL('The control room', 'غرفة التحكّم'),
  'silent-ridge@1:cave-mouth': PL('The cave mouth', 'فم الكهف'), 'silent-ridge@1:pool': PL('The cave pool', 'بركة الكهف'),
  'silent-ridge@1:pumphouse': PL('The pump room', 'غرفة المضخّات'),
  'lantern-wreck@1:bay': PL('The bay at night', 'الخليج ليلاً'), 'lantern-wreck@1:reef': PL('The reef by the wreck', 'الشعاب قرب الحطام'),
  'lantern-wreck@1:twilight': PL('The dim waters', 'المياه المعتمة'), 'lantern-wreck@1:hull': PL('Inside the sunken ship', 'داخل السفينة الغارقة'),
  'lantern-wreck@1:wreck': PL('The wreck', 'الحطام'),
};

export function beatContext(s: GameState, idx = s.index): Ctx {
  const pb = s.plan.beats[idx];
  const b = BIOMES[pb.biome];
  const r = Rng.from(s.seed, `ctx${idx}`);
  const duck = DUCK_BY_ID[s.duck];
  const obstacle = r.pick(b.obstacles), predator = r.pick(b.predators), critter = r.pick(b.critters);
  return {
    name: s.creature.name.replace(/-/g, '\u2060-\u2060'), player: s.player || '—', duck: duck?.name ?? { en: 'your companion', ar: 'رفيقكم' }, duckG: duck?.gender ?? 'm', place: SCENE_PLACE[pb.template] ?? b.name,
    obstacle, predator: { en: predator.en, ar: predator.ar }, critter: { en: critter.en, ar: critter.ar },
    predatorAnimal: predator.animal, critterAnimal: critter.animal,
    npc: (pb.npc && NPC_BY_ID[pb.npc]?.name) || { en: 'a stranger', ar: 'شخصٌ غريب' },
  };
}

/** The bestiary id of the creature a beat's text names, or null (UI shows it via animalArt). */
export function featuredAnimal(t: BeatTemplate, ctx: Ctx): string | null {
  if (t.featured) return t.featured;
  if (t.text.en.includes('{predator}')) return ctx.predatorAnimal;
  if (t.text.en.includes('{critter}')) return ctx.critterAnimal;
  return null;
}

const DEEP_ZONE = new Set<BiomeId>(['twilight', 'midnight', 'vents', 'trench']);
const B = (en: string, ar: string): L10n => ({ en, ar });
const AFTER_WIN: L10n[] = [
  B('Still riding that success, the team presses on.', 'ما زال أثر ذلك النجاح حاضراً، فيمضي الفريق قُدُماً.'),
  B('With that behind them, {name} moves on, more sure-footed now.', 'بعد ما جرى، يتقدّم {name} بخطى أثبت من ذي قبل.'),
  B('The team allows itself a quick smile, then walks on.', 'يسمح الفريق لنفسه بابتسامةٍ سريعة، ثم يواصل السير.'),
  B('{name} looks back once, then leads the way.', 'يلتفت {name} إلى الخلف مرةً واحدة، ثم يتقدّم الجميع.'),
  B('Spirits are high, and the path ahead looks a little less strange.', 'المعنويات مرتفعة، والطريق أمامكم يبدو أقلّ غرابةً بقليل.'),
];
const AFTER_LOSS: L10n[] = [
  B('Still shaking off that setback, {name} keeps going.', 'ما زال {name} ينفض عنه أثر تلك العثرة، لكنه يواصل الطريق.'),
  B('Bruised but not beaten, the team regroups and carries on.', 'يجمع الفريق شتاته بعد تلك الانتكاسة ويمضي، متعَباً لكن غير مهزوم.'),
  B('Nobody mentions what just happened. {name} sets off again, more carefully.', 'لا أحد يذكر ما حدث قبل قليل. يتحرّك {name} من جديد، بحذرٍ أكبر هذه المرة.'),
  B('A deep breath, a quick check of the gear, and the team moves on.', 'نَفَسٌ عميق، وفحصٌ سريع للمعدّات، ثم يمضي الفريق.'),
];
const CLUE_SAVED: L10n[] = [
  B('The new clue is safely in the field notebook.', 'والدليل الجديد محفوظٌ الآن في الدفتر الميداني.'),
  B('One more clue has been added to the notebook.', 'وقد أُضيف دليلٌ آخر إلى الدفتر.'),
  B('The notebook is a page heavier now.', 'وازداد الدفتر الميداني صفحةً جديدة.'),
];

/**
 * A short bridge that ties this scene to the previous one (place change, how the last move went, a fresh clue),
 * and frames the twist and climax as the payoff of what came before. Deterministic; never on the hook or phase change.
 */
export function bridgeLine(s: GameState, idx = s.index): L10n | null {
  const pb = s.plan.beats[idx];
  const t = BEAT_BY_ID[pb.template];
  const prev = s.log[idx - 1];
  if (!t || idx < 1 || !prev || t.kind === 'hook' || t.kind === 'phase') return null;
  const r = Rng.from(s.seed, `bridge${idx}`);
  const parts: L10n[] = [];
  const prevBiome = s.plan.beats[idx - 1].biome;
  if (prevBiome !== pb.biome && prevBiome !== 'openSea') {
    const from = BIOMES[prevBiome].name, to = BIOMES[pb.biome].name;
    parts.push(DEEP_ZONE.has(prevBiome) && DEEP_ZONE.has(pb.biome)
      ? B(`The sub sinks on, from ${from.en} down into ${to.en}.`, `تواصل الغوّاصة هبوطها من ${from.ar} إلى ${to.ar}.`)
      : B(`Leaving ${from.en} behind, the team reaches ${to.en}.`, `يترك الفريق ${from.ar} خلفه ويصل إلى ${to.ar}.`));
  } else if (prevBiome === pb.biome) {
    parts.push(r.pick(prev.success ? AFTER_WIN : AFTER_LOSS));
  }
  const prevTpl = BEAT_BY_ID[prev.beat];
  const prevChoice = prevTpl?.choices.find((c) => c.id === prev.choice);
  const prevOut = prevChoice && (prev.success || !prevChoice.fail ? prevChoice.success : prevChoice.fail);
  if (prevOut?.effects.some((e) => e.t === 'evidence') && t.kind !== 'climax') {
    parts.push(r.pick(CLUE_SAVED));
  }
  if (t.kind === 'twist' && s.evidence.length >= 2) {
    parts.push(B('And then the clues gathered so far begin to fit together.', 'ثم تبدأ الأدلة التي جمعتموها حتى الآن بالتكامل.'));
  }
  if (t.kind === 'climax') {
    parts.push(B('Everything has led to this moment.', 'كل ما مرّ بكم قادكم إلى هذه اللحظة.'));
    if (s.evidence.length) parts.push(B(`Clues in the notebook so far: ${s.evidence.length}.`, `عدد الأدلة في الدفتر حتى الآن: ${s.evidence.length}.`));
  }
  if (!parts.length) return null;
  return { en: parts.map((p) => p.en).join(' '), ar: parts.map((p) => p.ar).join(' ') };
}

/** Wraps user-typed names in Unicode bidi isolates so Arabic names read correctly inside English text and vice versa. */
export const iso = (s: string) => `\u2068${s}\u2069`;

export function fill(t: L10n, c: Ctx): L10n {
  // {g:masculine|feminine} picks the form that agrees with the companion duck's gender.
  const one = (str: string, lang: Lang) => str
    .replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_m, m: string, f: string) => (c.duckG === 'm' ? m : f))
    .replace(/\{name\}/g, iso(c.name)).replace(/\{player\}/g, iso(c.player)).replace(/\{duck\}/g, c.duck[lang])
    .replace(/\{place\}/g, c.place[lang]).replace(/\{obstacle\}/g, c.obstacle[lang]).replace(/\{predator\}/g, c.predator[lang])
    .replace(/\{critter\}/g, c.critter[lang]).replace(/\{npc\}/g, c.npc[lang]);
  return { en: one(t.en, 'en'), ar: one(t.ar, 'ar') };
}

const capStr = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DIE = 6;
function checkScore(s: GameState, d: DerivedCreature, c: Choice): number {
  const k = c.check!;
  let base = d.stats[k.stat];
  if (k.caps?.some((cap) => d.caps.has(cap))) base += 2;
  if (s.energy <= 1) base -= 1;
  return base;
}

export function successOdds(s: GameState, c: Choice): number | null {
  if (!c.check) return null;
  const base = checkScore(s, derive(s.creature), c);
  let wins = 0; for (let r = 0; r < DIE; r++) if (base + r >= c.check.dc) wins++;
  return wins / DIE;
}

export const CHOICES_PER_SCENE = 4;
const MAX_SPECIAL = 2;

/**
 * Exactly 4 choices per scene (designer rule). Choices unlocked by the creature's anatomy or by
 * story state come first (max 2) so the body you built matters; open choices fill the rest.
 * Deterministic per (seed, beat), displayed in the template's order.
 */
/** True when a choice's condition is only about the place (on land / in water), not about the creature or the story so far. */
export const placeOnly = (c: Choice): boolean => !!c.requires && Object.keys(c.requires).every((k) => k === 'wet' || k === 'biome');
/** The choices anyone can take in this place: ungated ones plus the land-only / water-only ones that fit it. */
export function openChoices(t: BeatTemplate, biome: BiomeId): Choice[] {
  return t.choices.filter((c) => !c.requires || (placeOnly(c) && (c.requires!.wet === undefined || BIOMES[biome].wet === c.requires!.wet) && (!c.requires!.biome || c.requires!.biome.includes(biome))));
}

export function pickChoices(t: BeatTemplate, s: GameState, d: DerivedCreature, biome: BiomeId): Choice[] {
  const rng = Rng.from(s.seed, `choices${s.index}`);
  const special = rng.shuffle(t.choices.filter((c) => c.requires && !placeOnly(c) && condHolds(c.requires, d, s, biome))).slice(0, MAX_SPECIAL);
  const open = rng.shuffle(openChoices(t, biome)).slice(0, CHOICES_PER_SCENE - special.length);
  const keep = new Set([...special, ...open]);
  return t.choices.filter((c) => keep.has(c));
}

export function currentBeat(s: GameState): BeatView {
  const pb = s.plan.beats[s.index];
  const t = BEAT_BY_ID[pb.template];
  if (!t) throw new Error(`Unknown beat ${pb.template}`);
  const d = derive(s.creature);
  const ctx = beatContext(s);
  let text = fill(t.text, ctx);
  const bridge = bridgeLine(s);
  if (bridge) { const bt = fill(bridge, ctx); text = { en: `${bt.en} ${text.en}`, ar: `${bt.ar} ${text.ar}` }; }
  for (const v of t.variants ?? []) {
    if (condHolds(v.when, d, s, pb.biome)) { const vt = fill(v.text, ctx); text = { en: `${text.en} ${vt.en}`, ar: `${text.ar} ${vt.ar}` }; }
  }
  const choices = pickChoices(t, s, d, pb.biome)
    .map((c) => ({ choice: c, label: fill(c.label, ctx), odds: successOdds(s, c) }));
  return { template: t, biome: pb.biome, phase: t.phase, text, choices, ctx, featured: featuredAnimal(t, ctx) };
}

function applyEffects(s: GameState, effects: Effect[]): GameState {
  const n = { ...s, flags: s.flags.slice(), evidence: s.evidence.slice(), discoveries: s.discoveries.slice(), rel: { ...s.rel } };
  for (const e of effects) {
    switch (e.t) {
      case 'flag': if (!n.flags.includes(e.id)) n.flags.push(e.id); break;
      case 'evidence': if (!n.evidence.includes(e.id)) n.evidence.push(e.id); break;
      case 'discovery': if (!n.discoveries.includes(e.id)) n.discoveries.push(e.id); break;
      case 'rel': n.rel[e.npc] = Math.max(-5, Math.min(5, (n.rel[e.npc] ?? 0) + e.d)); break;
      case 'energy': n.energy = Math.max(0, Math.min(MAX_ENERGY, n.energy + e.d)); break;
      case 'trust': n.trust = Math.max(-5, Math.min(10, n.trust + e.d)); break;
    }
  }
  return n;
}

export function choose(s: GameState, choiceId: string): GameState {
  if (s.stage !== 'beat') throw new Error(`Cannot choose in stage ${s.stage}`);
  const view = currentBeat(s);
  const entry = view.choices.find((c) => c.choice.id === choiceId);
  if (!entry) throw new Error(`Choice ${choiceId} not available`);
  const c = entry.choice;
  const d = derive(s.creature);
  let success = true; let partLine: L10n | undefined; let usedPart: string | undefined;
  if (c.check) {
    const roll = Rng.from(s.seed, `roll${s.index}:${c.id}`).int(DIE);
    success = checkScore(s, d, c) + roll >= c.check.dc;
    if (success) {
      const p = partForStat(d, c.check.stat, c.check.caps?.filter((x) => d.caps.has(x)));
      if (p) { usedPart = p.slot; partLine = { en: `${iso(capStr(s.creature.name))} ${p.action.en}.`, ar: `${iso(s.creature.name)} ${p.action.ar}.` }; }
    } else {
      const p = weakestPartForStat(d, c.check.stat);
      if (p) { usedPart = p.slot; partLine = { en: `What held it back here: ${p.name.en}.`, ar: `الذي لم يساعده هنا: ${p.name.ar}.` }; }
    }
  }
  const out: Outcome = success || !c.fail ? c.success : c.fail;
  const effects: Effect[] = [...out.effects];
  const t = view.template;
  if (success && t.fact && !effects.some((e) => e.t === 'discovery')) effects.push({ t: 'discovery', id: t.fact });
  if (t.npc) effects.push({ t: 'flag', id: `met:${t.npc}` });
  let n = applyEffects(s, effects);
  n = {
    ...n, stage: 'outcome',
    log: [...s.log, { beat: t.id, biome: view.biome, choice: c.id, style: c.style, success, usedPart: usedPart as never, npc: t.npc }],
    lastOutcome: { text: fill(out.text, view.ctx), mood: out.mood, fx: out.fx, success, partLine },
  };
  return n;
}

export function advance(s: GameState): GameState {
  if (s.stage !== 'outcome') throw new Error(`Cannot advance in stage ${s.stage}`);
  const next = s.index + 1;
  if (s.plan.story) {
    // Story Archive graph: the result just played names the next node (or the ending). State carries over unchanged.
    const t = BEAT_BY_ID[s.plan.beats[s.index].template];
    const l = s.log[s.log.length - 1];
    const c = t?.choices.find((x) => x.id === l?.choice);
    const nx = c ? (l.success || !c.fail ? c.success : c.fail).next : undefined;
    if (!nx || nx.startsWith('end:') || !BEAT_BY_ID[nx]) return { ...s, stage: 'ending', lastOutcome: undefined, flags: nx?.startsWith('end:') ? [...s.flags, nx] : s.flags };
    return { ...s, index: next, stage: 'beat', lastOutcome: undefined, plan: { ...s.plan, beats: [...s.plan.beats, { template: nx, biome: BEAT_BY_ID[nx].biomes[0] }] } };
  }
  if (next >= s.plan.beats.length) return { ...s, stage: 'ending', lastOutcome: undefined };
  return resolveCurrent({ ...s, index: next, stage: 'beat', lastOutcome: undefined });
}

export function pathTokens(s: GameState): string[] {
  return s.log.map((l) => `p:${l.beat}.${l.choice}.${l.success ? 1 : 0}`);
}

/** Invariants checked by tests and on load. Returns a list of problems (empty = healthy). */
export function validateState(s: GameState): string[] {
  const errs: string[] = [];
  if (s.version !== 1) errs.push('version');
  if (s.index < 0 || s.index > s.plan.beats.length) errs.push('index out of range');
  if (s.energy < 0 || s.energy > MAX_ENERGY) errs.push('energy out of range');
  if (new Set(s.flags).size !== s.flags.length) errs.push('duplicate flags');
  if (new Set(s.evidence).size !== s.evidence.length) errs.push('duplicate evidence');
  if (s.log.length !== (s.stage === 'beat' ? s.index : s.stage === 'outcome' ? s.index + 1 : s.plan.beats.length)) errs.push('log length mismatch');
  for (const [i, b] of s.plan.beats.entries()) {
    if (i <= s.index && !BEAT_BY_ID[b.template]) errs.push(`unresolved beat ${i}`);
    const t = BEAT_BY_ID[b.template];
    if (t && !t.biomes.includes(b.biome)) errs.push(`biome mismatch ${t.id}@${b.biome}`);
  }
  for (const l of s.log) { const t = BEAT_BY_ID[l.beat]; if (t?.npc && !s.flags.includes(`met:${t.npc}`)) errs.push(`npc ${t.npc} not flagged`); }
  return errs;
}
