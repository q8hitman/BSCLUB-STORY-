// Explorer Passport saves: a versioned, URL-safe code that rebuilds an adventure exactly on another device.
//
// Why it is small: the story engine is deterministic. Everything a run shows is a pure function of
// (mode, seed, chosen plan variant, creature, companion, player name, the anti-repetition list, pinned
// history-based picks, and the ordered choice ids). So the code stores those inputs and the device that
// scans it REPLAYS the choices through the same engine, then checks the rebuilt state is valid.
// Nothing is regenerated "differently": if the replay cannot reproduce the run (content changed in a
// later game version), decoding fails with reason 'content' instead of silently starting another story.
// Optional AI wording of the paragraph on screen travels inside the code too (it is the only AI text a
// player can still see; past paragraphs are not shown again), within a strict size budget.
import { autoName, autoNameParts, decodeCreature, encodeCreature, isValidConfig } from './creature';
import { ALL_BEATS, BEAT_BY_ID, DYNAMIC_KINDS, advance, choose, currentBeat, planVariant, startFromPlan, validateState, type PlanOpts } from './story';
import { DUCKS } from '../content/ducks';
import { LEGENDS } from '../content/legends';
import { partsFor } from '../content/parts';
import { ARCHETYPES } from './ending';
import { SLOTS } from './types';
import { getStory, startStory } from './archive';
import type { BiomeId, GameState, Lang, Mode, PlannedBeat, StoryPlan } from './types';

export const SAVE_VERSION = 2;
/** Longest link we put in a QR. ~1,200 characters keeps the code scannable from a booth monitor and a phone photo. */
export const MAX_LINK_CHARS = 1200;

type PlanField = number | string | [string, string, string?, string?][]; // variant index, Story Archive 'id@v', or explicit beats // variant index, or explicit beats (fallback)
/** [v, mode, seed, plan, duck, player, creature, avoid, choices, stage, sighting, recentEndings, ai, opts, (explicit plan only:) hook, biomes, twist, legend] */
type Payload = [number, 'c' | 'm', number, PlanField, string, string, string, string[], string[], 0 | 1 | 2, [number, string] | 0, string[], [number, Lang, string] | 0, ...unknown[]];

const STAGE = { beat: 0, outcome: 1, ending: 2 } as const;

function b64url(bytes: Uint8Array): string {
  let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
/** FNV-1a, base36: catches typos and truncated/corrupted scans (not a security feature). */
function check(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(7, '0');
}

// ── v2: the same information, packed small ──────────────────────────────────────────────────────────────────
// A short link makes a QR with big modules that every phone camera reads as a web link. v2 stores list positions
// instead of ids (parts, duck, choices, endings…). A 2-character stamp over the ids those positions stand for
// catches a later content change, so decoding still fails safely instead of opening a different story.
const B36 = (n: number) => n.toString(36);
const DYN_IDS = () => ALL_BEATS.filter((b) => DYNAMIC_KINDS.has(b.kind)).map((b) => b.id).sort();
const stampOf = (ids: string[]) => check(ids.join('|')).slice(-2);

function packCreature(c: GameState['creature']): string | null {
  let out = '';
  for (const slot of SLOTS) { const i = partsFor(slot).findIndex((p) => p.id === (c as unknown as Record<string, string>)[slot]); if (i < 0 || i > 35) return null; out += B36(i); }
  if (c.hue < 0 || c.hue > 35) return null;
  const auto = autoNameParts(c.name, c.base);
  return `${out}${B36(c.hue)}${auto ? `~${auto[0]}${auto[1]}` : `=${c.name}`}`;
}
function unpackCreature(str: string): GameState['creature'] | null {
  if (typeof str !== 'string' || str.length < SLOTS.length + 2) return null;
  const c: Record<string, unknown> = {};
  for (let i = 0; i < SLOTS.length; i++) { const p = partsFor(SLOTS[i])[parseInt(str[i], 36)]; if (!p) return null; c[SLOTS[i]] = p.id; }
  c.hue = parseInt(str[SLOTS.length], 36);
  const rest = str.slice(SLOTS.length + 1);
  if (rest[0] === '=') c.name = rest.slice(1);
  else if (rest[0] === '~' && (rest[1] === 'a' || rest[1] === 'e')) c.name = autoName(rest[1], c.base as string, rest.slice(2));
  else return null;
  return isValidConfig(c as Partial<GameState['creature']>) ? (c as unknown as GameState['creature']) : null;
}

/** null when this run cannot be packed (legacy explicit plans, unknown ids): the caller then uses the v1 format. */
function encodeV2(s: GameState, includeAi: boolean): string | null {
  if (!s.plan.story && typeof s.plan.variant !== 'number') return null;
  const plan = s.plan.story ? `${s.plan.story.id}@${s.plan.story.v}` : s.plan.variant!;
  const duck = DUCKS.findIndex((d) => d.id === s.duck); const cr = packCreature(s.creature);
  if (duck < 0 || !cr) return null;
  const ids: string[] = [];
  let choices = '';
  for (const l of s.log) { const i = BEAT_BY_ID[l.beat]?.choices.findIndex((c) => c.id === l.choice) ?? -1; if (i < 0 || i > 35) return null; choices += B36(i); ids.push(l.choice); }
  const dyn = DYN_IDS(); let avoid = '';
  for (const id of [...new Set((s.avoid ?? []).filter((x) => DYNAMIC_KINDS.has(BEAT_BY_ID[x]?.kind ?? '')))]) { const i = dyn.indexOf(id); if (i < 0) return null; avoid += B36(i).padStart(2, '0'); ids.push(id); }
  let sight = '';
  if (s.pins?.sighting) { const i = LEGENDS.findIndex((l) => l.id === s.pins!.sighting![1]); if (i < 0 || i > 35 || s.pins.sighting[0] > 35) return null; sight = B36(s.pins.sighting[0]) + B36(i); ids.push(s.pins.sighting[1]); }
  let recent = '';
  for (const id of s.pins?.recentEndings ?? []) { const i = ARCHETYPES.findIndex((a) => a.id === id); if (i < 0 || i > 35) return null; recent += B36(i); ids.push(id); }
  const ai = includeAi && s.ai && s.stage === 'outcome' && s.ai.i === s.index ? [s.ai.i, s.ai.lang, s.ai.text] : 0;
  const flags = `${s.mode === 'marine' ? 'm' : 'c'}${s.plan.length === 'quick' ? 'q' : 'f'}${s.plan.tone === 'light' ? 'l' : s.plan.tone === 'mystery' ? 'm' : 'b'}${STAGE[s.stage]}${s.pins ? 'p' : ''}`;
  const p: unknown[] = [2, flags, s.seed, plan, duck, cr, choices, stampOf(ids), s.player, avoid, sight, recent, ai];
  while (p.length > 8 && (p[p.length - 1] === '' || p[p.length - 1] === 0)) p.pop();
  const body = b64url(new TextEncoder().encode(JSON.stringify(p)));
  return `${body}.${check(body)}`;
}

export function encodeSave(s: GameState, opts: { includeAi?: boolean; legacy?: boolean } = {}): string {
  if (!opts.legacy) { const v2 = encodeV2(s, opts.includeAi !== false); if (v2) return v2; }
  // Legacy runs without a variant index carry the plan explicitly. Runtime-resolved beats (encounter/twist/climax are
  // only ever placed by resolution) go back to their '@kind' slot so the replay resolves them exactly as before.
  const plan: PlanField = s.plan.story ? `${s.plan.story.id}@${s.plan.story.v}` : typeof s.plan.variant === 'number' ? s.plan.variant
    : s.plan.beats.map((b) => { const k = BEAT_BY_ID[b.template]?.kind; return [k && DYNAMIC_KINDS.has(k) ? `@${k}` : b.template, b.biome, b.npc && !(k && DYNAMIC_KINDS.has(k)) ? b.npc : '', b.obstacle ?? '']; });
  const avoid = (s.avoid ?? []).filter((id) => DYNAMIC_KINDS.has(BEAT_BY_ID[id]?.kind ?? ''));
  const ai: Payload[12] = opts.includeAi !== false && s.ai && s.stage === 'outcome' && s.ai.i === s.index ? [s.ai.i, s.ai.lang, s.ai.text] : 0;
  const p: Payload = [1, s.mode === 'marine' ? 'm' : 'c', s.seed, plan, s.duck, s.player, encodeCreature(s.creature), [...new Set(avoid)],
    s.log.map((l) => l.choice), STAGE[s.stage], s.pins?.sighting ?? 0, s.pins?.recentEndings ?? [], ai];
  p.push(`${s.plan.length === 'quick' ? 'q' : 'f'}${s.plan.tone === 'light' ? 'l' : s.plan.tone === 'mystery' ? 'm' : 'b'}`);
  if (Array.isArray(plan)) p.push(s.plan.hook, s.plan.biomes, s.plan.twist ?? '', s.plan.legend ? 1 : 0);
  const body = b64url(new TextEncoder().encode(JSON.stringify(p)));
  return `${body}.${check(body)}`;
}

export type DecodeResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'format' | 'checksum' | 'newer' | 'version' | 'content' | 'replay'; creature?: GameState['creature'] };

/** Both formats, reduced to the same inputs. Choices are ids (v1) or positions in the scene's choice list (v2). */
interface Inputs { md: unknown; seed: number; planF: PlanField; duck: string; player: string; creature: GameState['creature'] | null; avoid: string[]; choices: (string | number)[]; stage: number;
  pins: GameState['pins'] | undefined; ai: unknown; of: string; extra: unknown[]; stamp?: string; stampIds: string[] }
type Read = { ok: true; v: Inputs } | { ok: false; creature: GameState['creature'] | null };

function readV1(p: Payload): Read {
  const [, md, seed, planF, duck, player, cCode, avoid, choices, stage, sight, recentEndings, ai] = p;
  const creature = typeof cCode === 'string' ? decodeCreature(cCode) : null;
  if (!Array.isArray(avoid) || !Array.isArray(choices) || typeof duck !== 'string' || typeof player !== 'string') return { ok: false, creature };
  return { ok: true, v: { md, seed, planF, duck, player, creature, avoid: avoid.map(String), choices: choices.map(String), stage,
    pins: { sighting: Array.isArray(sight) ? [Number(sight[0]), String(sight[1])] as [number, string] : null, recentEndings: Array.isArray(recentEndings) ? recentEndings.map(String) : [] },
    ai, of: typeof p[13] === 'string' ? p[13] : 'fb', extra: p.slice(14), stampIds: [] } };
}
function readV2(p: unknown[]): Read {
  const [, flags, seed, planF, duckI, cr, choices, stamp, player = '', avoid = '', sight = '', recent = '', ai = 0] = p as [number, string, number, PlanField, number, string, string, string, string?, string?, string?, string?, unknown?];
  const creature = typeof cr === 'string' ? unpackCreature(cr) : null;
  if (typeof flags !== 'string' || flags.length < 4 || typeof choices !== 'string' || typeof stamp !== 'string' || typeof player !== 'string' || typeof avoid !== 'string' || typeof sight !== 'string' || typeof recent !== 'string' || !DUCKS[duckI])
    return { ok: false, creature };
  const dyn = DYN_IDS();
  const av: string[] = []; for (let i = 0; i + 1 < avoid.length; i += 2) av.push(dyn[parseInt(avoid.slice(i, i + 2), 36)] ?? '?');
  const sg: [number, string] | null = sight.length === 2 ? [parseInt(sight[0], 36), LEGENDS[parseInt(sight[1], 36)]?.id ?? '?'] : null;
  const re = [...recent].map((ch) => ARCHETYPES[parseInt(ch, 36)]?.id ?? '?');
  return { ok: true, v: { md: flags[0], seed, planF, duck: DUCKS[duckI].id, player, creature, avoid: av, choices: [...choices].map((ch) => parseInt(ch, 36)), stage: Number(flags[3]),
    pins: flags[4] === 'p' ? { sighting: sg, recentEndings: re } : undefined, ai, of: `${flags[1]}${flags[2]}`, extra: [], stamp, stampIds: [...av, ...(sg ? [sg[1]] : []), ...re] } };
}

export function decodeSave(code: string): DecodeResult {
  const m = /^([\w-]{8,6000})\.([0-9a-z]{7})$/.exec((code ?? '').trim());
  if (!m) return { ok: false, reason: 'format' };
  if (check(m[1]) !== m[2]) return { ok: false, reason: 'checksum' };
  let p: Payload;
  try { p = JSON.parse(new TextDecoder().decode(unb64url(m[1]))) as Payload; } catch { return { ok: false, reason: 'format' }; }
  if (!Array.isArray(p) || typeof p[0] !== 'number') return { ok: false, reason: 'format' };
  if (p[0] > SAVE_VERSION) return { ok: false, reason: 'newer' };
  if (p[0] !== 1 && p[0] !== 2) return { ok: false, reason: 'version' };
  const rd = p[0] === 2 ? readV2(p as unknown[]) : readV1(p);
  if (!rd.ok) return { ok: false, reason: 'format', ...(rd.creature ? { creature: rd.creature } : {}) };
  const inp = rd.v;
  const { md, seed, planF, duck, player, avoid, choices, stage, ai, of } = inp;
  const creature = inp.creature;
  if (!creature || !isValidConfig(creature) || (md !== 'c' && md !== 'm') || !Number.isFinite(seed) || ![0, 1, 2].includes(stage)) return { ok: false, reason: 'format', ...(creature ? { creature } : {}) };
  const mode: Mode = md === 'm' ? 'marine' : 'classic';
  const opts: PlanOpts = { length: of[0] === 'q' ? 'quick' : 'full', tone: of[1] === 'l' ? 'light' : of[1] === 'm' ? 'mystery' : 'balanced' };
  try {
    let plan: StoryPlan;
    if (typeof planF === 'string') {
      // Story Archive adventure: the exact published version must be loaded (see peekStory); never fall back to another.
      const m2 = /^([a-z0-9-]{1,40})@(\d{1,4})$/.exec(planF);
      const pkg = m2 ? getStory(m2[1], Number(m2[2])) : undefined;
      if (!pkg || pkg.mode !== mode) return { ok: false, reason: 'content', creature };
      plan = startStory({ mode, seed, duck, player, creature }, pkg).plan;
    } else if (typeof planF === 'number') {
      if (!Number.isInteger(planF) || planF < 0 || planF > 31) return { ok: false, reason: 'format', creature };
      plan = planVariant(seed, mode, creature, planF, undefined, opts);
    } else if (Array.isArray(planF)) {
      const [hook, biomes, twist, legend] = inp.extra as [string, BiomeId[], string, number];
      const beats: PlannedBeat[] = planF.map(([template, biome, npc, obstacle]) => ({ template, biome: biome as BiomeId, ...(npc ? { npc } : {}), ...(obstacle ? { obstacle } : {}) }));
      plan = { mode, seed, hook, biomes, beats, ...(twist ? { twist } : {}), legend: !!legend, ...(opts.length === 'quick' ? { length: 'quick' as const } : {}), ...(opts.tone !== 'balanced' ? { tone: opts.tone as 'light' | 'mystery' } : {}) };
    } else return { ok: false, reason: 'format', creature };
    if (plan.beats.some((b) => !b.template.startsWith('@') && !BEAT_BY_ID[b.template])) return { ok: false, reason: 'content', creature };
    let s = startFromPlan({ mode, seed, duck, player, creature, plan, avoid, ...(inp.pins ? { pins: inp.pins } : {}) });
    const used: string[] = [];
    choices.forEach((c, i) => {
      const id = typeof c === 'number' ? currentBeat(s).template.choices[c]?.id : c;
      if (!id) throw new Error('content');
      used.push(id);
      s = choose(s, id);
      const last = i === choices.length - 1;
      if (!(last && stage === 1)) s = advance(s);
    });
    // positions only mean the same thing while the content is the same: the stamp proves it
    if (inp.stamp !== undefined && stampOf([...used, ...inp.stampIds]) !== inp.stamp) return { ok: false, reason: 'content', creature };
    const want = (['beat', 'outcome', 'ending'] as const)[stage];
    if (s.stage !== want || validateState(s).length) return { ok: false, reason: 'replay', creature };
    if (Array.isArray(ai) && ai[0] === s.index && s.stage === 'outcome' && typeof ai[2] === 'string' && ai[2].length <= 600 && (ai[1] === 'ar' || ai[1] === 'en')) s = { ...s, ai: { i: ai[0], lang: ai[1], text: ai[2] } };
    return { ok: true, state: s };
  } catch {
    // A choice id or beat no longer exists in this version of the game: never invent a different story.
    return { ok: false, reason: 'content', creature };
  }
}

/** The link a QR carries: an ordinary web link with one short parameter, so every phone camera offers to open it. */
export function saveLink(s: GameState, site: string): { url: string; aiDropped: boolean } {
  const withAi = `${site}?s=${encodeSave(s)}`;
  if (withAi.length <= MAX_LINK_CHARS) return { url: withAi, aiDropped: false };
  return { url: `${site}?s=${encodeSave(s, { includeAi: false })}`, aiDropped: !!s.ai };
}

/** The save code in a link: `?s=` (current) or `#s=` (cards made before 2026-11-11). */
export const saveFromUrl = (href: string): string | null => /[#?&]s=([\w.-]+)/.exec(href)?.[1] ?? null;
export const saveFromHash = saveFromUrl;

/** Which Story Archive adventure (if any) a code needs, so the app can lazy-load that exact version before decoding. */
export function peekStory(code: string): { id: string; v: number } | null {
  try {
    const body = /^([\w-]{8,6000})\./.exec((code ?? '').trim())?.[1]; if (!body) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64url(body))) as unknown[];
    const m = typeof p?.[3] === 'string' ? /^([a-z0-9-]{1,40})@(\d{1,4})$/.exec(p[3]) : null;
    return m ? { id: m[1], v: Number(m[2]) } : null;
  } catch { return null; }
}
