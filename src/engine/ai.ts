// Optional AI narration. The AI may only *re-word* the outcome text the engine already decided.
// It never changes state. Every response is schema-validated and checked for continuity/plausibility;
// on any failure we retry, then fall back to the static text. No keys live in the client: requests go
// to a Cloudflare Worker (worker/) configured via VITE_AI_ENDPOINT.
import { PART_BY_ID } from '../content/parts';
import type { Capability, CreatureConfig, L10n, Lang } from './types';
import { derive } from './creature';

export interface AiRequest {
  lang: Lang;
  creature: CreatureConfig;
  place: string;
  /** Static, engine-approved narration the AI should rephrase. */
  base: string;
  success: boolean;
  recent: string[];
}
export interface AiResponse { narration: string }

const ENDPOINT: string | undefined = import.meta.env?.VITE_AI_ENDPOINT;
export const aiAvailable = () => !!ENDPOINT;

// Words that would contradict the creature's anatomy if it lacks the capability.
const CONTRADICTIONS: { cap: Capability[]; words: RegExp }[] = [
  { cap: ['fly', 'glide'], words: /\b(flew|flies|flying|fly|wings?)\b|طار|يطير|أجنح|جناح/i },
  { cap: ['swim', 'breatheWater'], words: /\b(swam|swims|swimming)\b|سبح|يسبح/i },
  { cap: ['venom'], words: /\b(venom|venomous|sting)\b|سم |سام|لدغ/i },
  { cap: ['glow'], words: /\b(glow|glowed|glowing)\b|يضوي|توهج/i },
];

// The creature is an animal: narration where it speaks (says/asks/replies…) is rejected.
const reEsc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SPEECH_EN = '(says|said|asks|asked|replies|replied|answers|answered|tells|told|whispers|shouts)';
const SPEECH_AR = '(قال|يقول|سأل|يسأل|أجاب|يجيب|همس|يهمس)';
const SPEAKS = (name: string) => new RegExp(`${reEsc(name)}\\s+${SPEECH_EN}\\b|${SPEECH_AR}\\s+${reEsc(name)}`, 'i');
const BANNED = /(https?:\/\/|<script|\bkill(ed)?\b|\bblood\b|\bdie[ds]?\b|انتحار)/i;
const ARABIC = /[؀-ۿ]/;

/** Validates AI JSON. Returns the narration or a reason for rejection. */
export function validateAiResponse(raw: unknown, req: AiRequest): { ok: true; text: string } | { ok: false; reason: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not-object' };
  const keys = Object.keys(raw as object);
  if (keys.some((k) => k !== 'narration')) return { ok: false, reason: 'extra-keys' };
  const n = (raw as AiResponse).narration;
  if (typeof n !== 'string') return { ok: false, reason: 'narration-type' };
  const text = n.trim();
  if (text.length < 20 || text.length > 420) return { ok: false, reason: 'length' };
  if (BANNED.test(text)) return { ok: false, reason: 'banned-content' };
  if (SPEAKS(req.creature.name).test(text)) return { ok: false, reason: 'creature-speaks' };
  if (req.lang === 'ar' && !ARABIC.test(text)) return { ok: false, reason: 'wrong-language' };
  if (req.lang === 'en' && ARABIC.test(text)) return { ok: false, reason: 'wrong-language' };
  if (!text.includes(req.creature.name)) return { ok: false, reason: 'continuity-name' };
  const d = derive(req.creature);
  for (const c of CONTRADICTIONS) {
    if (!c.cap.some((x) => d.caps.has(x)) && c.words.test(text)) return { ok: false, reason: `anatomy-contradiction:${c.cap[0]}` };
  }
  // Plausibility: outcome polarity must not flip.
  const failWords = /\b(failed|fails|couldn['’]t|unable)\b|فشل|ما قدر/i;
  if (req.success && failWords.test(text)) return { ok: false, reason: 'polarity' };
  return { ok: true, text };
}

/** Simple client-side rate limiter: min gap + max calls per run. */
export class RateLimiter {
  private last = -Infinity; private count = 0;
  constructor(private minGapMs = 1500, private maxCalls = 30, private now = () => Date.now()) {}
  tryTake(): boolean {
    const t = this.now();
    if (this.count >= this.maxCalls || t - this.last < this.minGapMs) return false;
    this.last = t; this.count++; return true;
  }
  reset() { this.count = 0; this.last = -Infinity; }
}

export const limiter = new RateLimiter();

export type Fetcher = (url: string, init: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/**
 * Returns AI narration or the fallback. Never throws. `retries` extra attempts after a rejected response.
 */
export async function narrate(req: AiRequest, fallback: string, opts: { endpoint?: string; fetcher?: Fetcher; retries?: number; rl?: RateLimiter; timeoutMs?: number } = {}): Promise<{ text: string; source: 'ai' | 'static'; reason?: string }> {
  const endpoint = opts.endpoint ?? ENDPOINT;
  const fetcher: Fetcher = opts.fetcher ?? ((u, i) => fetch(u, i));
  const rl = opts.rl ?? limiter;
  if (!endpoint) return { text: fallback, source: 'static', reason: 'no-endpoint' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { text: fallback, source: 'static', reason: 'offline' };
  let reason = 'unknown';
  for (let attempt = 0; attempt <= (opts.retries ?? 2); attempt++) {
    if (!rl.tryTake()) return { text: fallback, source: 'static', reason: 'rate-limited' };
    try {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timer = setTimeout(() => ctrl?.abort(), opts.timeoutMs ?? 6000);
      const parts = Object.fromEntries(['base', 'limbs', 'tail', 'adaptation', 'ability'].map((k) => [k, PART_BY_ID[(req.creature as unknown as Record<string, string>)[k]]?.name.en]));
      const res = await fetcher(endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctrl?.signal,
        body: JSON.stringify({ lang: req.lang, name: req.creature.name, parts, place: req.place, base: req.base, success: req.success, recent: req.recent.slice(-3) }),
      });
      clearTimeout(timer);
      if (!res.ok) { reason = 'http'; continue; }
      const v = validateAiResponse(await res.json(), req);
      if (v.ok) return { text: v.text, source: 'ai' };
      reason = v.reason;
    } catch { reason = 'network'; }
  }
  return { text: fallback, source: 'static', reason };
}

export const pickLang = (t: L10n, lang: Lang) => t[lang];
