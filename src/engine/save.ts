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
import { decodeCreature, encodeCreature, isValidConfig } from './creature';
import { BEAT_BY_ID, DYNAMIC_KINDS, advance, choose, planVariant, startFromPlan, validateState, type PlanOpts } from './story';
import type { BiomeId, GameState, Lang, Mode, PlannedBeat, StoryPlan } from './types';

export const SAVE_VERSION = 1;
/** Longest link we put in a QR. ~1,200 characters keeps the code scannable from a booth monitor and a phone photo. */
export const MAX_LINK_CHARS = 1200;

type PlanField = number | [string, string, string?, string?][]; // variant index, or explicit beats (fallback)
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

export function encodeSave(s: GameState, opts: { includeAi?: boolean } = {}): string {
  // Legacy runs without a variant index carry the plan explicitly. Runtime-resolved beats (encounter/twist/climax are
  // only ever placed by resolution) go back to their '@kind' slot so the replay resolves them exactly as before.
  const plan: PlanField = typeof s.plan.variant === 'number' ? s.plan.variant
    : s.plan.beats.map((b) => { const k = BEAT_BY_ID[b.template]?.kind; return [k && DYNAMIC_KINDS.has(k) ? `@${k}` : b.template, b.biome, b.npc && !(k && DYNAMIC_KINDS.has(k)) ? b.npc : '', b.obstacle ?? '']; });
  const avoid = (s.avoid ?? []).filter((id) => DYNAMIC_KINDS.has(BEAT_BY_ID[id]?.kind ?? ''));
  const ai: Payload[12] = opts.includeAi !== false && s.ai && s.stage === 'outcome' && s.ai.i === s.index ? [s.ai.i, s.ai.lang, s.ai.text] : 0;
  const p: Payload = [SAVE_VERSION, s.mode === 'marine' ? 'm' : 'c', s.seed, plan, s.duck, s.player, encodeCreature(s.creature), [...new Set(avoid)],
    s.log.map((l) => l.choice), STAGE[s.stage], s.pins?.sighting ?? 0, s.pins?.recentEndings ?? [], ai];
  p.push(`${s.plan.length === 'quick' ? 'q' : 'f'}${s.plan.tone === 'light' ? 'l' : s.plan.tone === 'mystery' ? 'm' : 'b'}`);
  if (Array.isArray(plan)) p.push(s.plan.hook, s.plan.biomes, s.plan.twist ?? '', s.plan.legend ? 1 : 0);
  const body = b64url(new TextEncoder().encode(JSON.stringify(p)));
  return `${body}.${check(body)}`;
}

export type DecodeResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'format' | 'checksum' | 'newer' | 'version' | 'content' | 'replay'; creature?: GameState['creature'] };

export function decodeSave(code: string): DecodeResult {
  const m = /^([\w-]{8,6000})\.([0-9a-z]{7})$/.exec((code ?? '').trim());
  if (!m) return { ok: false, reason: 'format' };
  if (check(m[1]) !== m[2]) return { ok: false, reason: 'checksum' };
  let p: Payload;
  try { p = JSON.parse(new TextDecoder().decode(unb64url(m[1]))) as Payload; } catch { return { ok: false, reason: 'format' }; }
  if (!Array.isArray(p) || typeof p[0] !== 'number') return { ok: false, reason: 'format' };
  if (p[0] > SAVE_VERSION) return { ok: false, reason: 'newer' };
  if (p[0] !== 1) return { ok: false, reason: 'version' };
  const [, md, seed, planF, duck, player, cCode, avoid, choices, stage, sight, recentEndings, ai] = p;
  const creature = typeof cCode === 'string' ? decodeCreature(cCode) : null;
  if (!creature || !isValidConfig(creature) || (md !== 'c' && md !== 'm') || !Number.isFinite(seed) || typeof duck !== 'string' || typeof player !== 'string'
    || !Array.isArray(avoid) || !Array.isArray(choices) || ![0, 1, 2].includes(stage)) return { ok: false, reason: 'format', ...(creature ? { creature } : {}) };
  const mode: Mode = md === 'm' ? 'marine' : 'classic';
  const of = typeof p[13] === 'string' ? p[13] : 'fb';
  const opts: PlanOpts = { length: of[0] === 'q' ? 'quick' : 'full', tone: of[1] === 'l' ? 'light' : of[1] === 'm' ? 'mystery' : 'balanced' };
  try {
    let plan: StoryPlan;
    if (typeof planF === 'number') {
      if (!Number.isInteger(planF) || planF < 0 || planF > 31) return { ok: false, reason: 'format', creature };
      plan = planVariant(seed, mode, creature, planF, undefined, opts);
    } else {
      const [hook, biomes, twist, legend] = p.slice(14) as [string, BiomeId[], string, number];
      const beats: PlannedBeat[] = planF.map(([template, biome, npc, obstacle]) => ({ template, biome: biome as BiomeId, ...(npc ? { npc } : {}), ...(obstacle ? { obstacle } : {}) }));
      plan = { mode, seed, hook, biomes, beats, ...(twist ? { twist } : {}), legend: !!legend, ...(opts.length === 'quick' ? { length: 'quick' as const } : {}), ...(opts.tone !== 'balanced' ? { tone: opts.tone as 'light' | 'mystery' } : {}) };
    }
    if (plan.beats.some((b) => !b.template.startsWith('@') && !BEAT_BY_ID[b.template])) return { ok: false, reason: 'content', creature };
    const pins = { sighting: Array.isArray(sight) ? [Number(sight[0]), String(sight[1])] as [number, string] : null, recentEndings: Array.isArray(recentEndings) ? recentEndings.map(String) : [] };
    let s = startFromPlan({ mode, seed, duck, player, creature, plan, avoid: avoid.map(String), pins });
    choices.forEach((id, i) => {
      s = choose(s, String(id));
      const last = i === choices.length - 1;
      if (!(last && stage === 1)) s = advance(s);
    });
    const want = (['beat', 'outcome', 'ending'] as const)[stage];
    if (s.stage !== want || validateState(s).length) return { ok: false, reason: 'replay', creature };
    if (Array.isArray(ai) && ai[0] === s.index && s.stage === 'outcome' && typeof ai[2] === 'string' && ai[2].length <= 600 && (ai[1] === 'ar' || ai[1] === 'en')) s = { ...s, ai: { i: ai[0], lang: ai[1], text: ai[2] } };
    return { ok: true, state: s };
  } catch {
    // A choice id or beat no longer exists in this version of the game: never invent a different story.
    return { ok: false, reason: 'content', creature };
  }
}

/** The link a QR carries. The save rides in the #fragment, which browsers never send to the web server. */
export function saveLink(s: GameState, site: string): { url: string; aiDropped: boolean } {
  const withAi = `${site}#s=${encodeSave(s)}`;
  if (withAi.length <= MAX_LINK_CHARS) return { url: withAi, aiDropped: false };
  return { url: `${site}#s=${encodeSave(s, { includeAi: false })}`, aiDropped: !!s.ai };
}

export const saveFromHash = (hash: string): string | null => /#s=([\w.-]+)/.exec(hash)?.[1] ?? null;
