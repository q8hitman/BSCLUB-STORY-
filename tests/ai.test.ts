import { describe, expect, it } from 'vitest';
import { RateLimiter, narrate, validateAiResponse, type AiRequest, type Fetcher } from '../src/engine/ai';
import type { CreatureConfig } from '../src/engine/types';

const noWings: CreatureConfig = { name: 'Biscuit', base: 'camel', head: 'horns', eyes: 'owlEyes', limbs: 'digClaws', tail: 'club', adaptation: 'hump', ability: 'smell', hue: 0 };
const req = (over: Partial<AiRequest> = {}): AiRequest => ({ lang: 'en', creature: noWings, place: 'the desert', base: 'Biscuit digs under the dune.', success: true, recent: [], ...over });
const okJson = (narration: string): Fetcher => async () => ({ ok: true, json: async () => ({ narration }) });

describe('AI JSON validation', () => {
  it('accepts a valid, continuous narration', () => {
    expect(validateAiResponse({ narration: 'Biscuit digs a tunnel under the hot dune and pops out grinning.' }, req())).toEqual({ ok: true, text: 'Biscuit digs a tunnel under the hot dune and pops out grinning.' });
  });
  it.each([
    [null, 'not-object'],
    ['string', 'not-object'],
    [{ narration: 5 }, 'narration-type'],
    [{ narration: 'short' }, 'length'],
    [{ narration: 'Biscuit is fine.'.repeat(40) }, 'length'],
    [{ narration: 'Biscuit digs and digs.', state: { energy: 99 } }, 'extra-keys'],
    [{ narration: 'The creature digs a tunnel under the dune happily.' }, 'continuity-name'],
    [{ narration: 'Biscuit spreads its wings and flies over the dune.' }, 'anatomy-contradiction:fly'],
    [{ narration: 'Biscuit failed to dig and gave up in the sand.' }, 'polarity'],
    [{ narration: 'Biscuit digs; visit https://evil.example for more.' }, 'banned-content'],
  ])('rejects %j → %s', (raw, reason) => {
    const v = validateAiResponse(raw, req());
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe(reason);
  });
  it('enforces the requested language', () => {
    expect(validateAiResponse({ narration: 'Biscuit digs under the dune, very happy.' }, req({ lang: 'ar' }))).toMatchObject({ ok: false, reason: 'wrong-language' });
    expect(validateAiResponse({ narration: 'Biscuit يحفر تحت الكثيب وهو مستانس وايد.' }, req({ lang: 'ar' }))).toMatchObject({ ok: true });
  });
});

describe('AI narration client', () => {
  const rl = () => new RateLimiter(0, 100);
  it('falls back to static text with no endpoint configured (offline-first)', async () => {
    expect(await narrate(req(), 'STATIC', { endpoint: undefined })).toMatchObject({ text: 'STATIC', source: 'static', reason: 'no-endpoint' });
  });
  it('uses valid AI text', async () => {
    const r = await narrate(req(), 'STATIC', { endpoint: 'x', fetcher: okJson('Biscuit tunnels under the dune like a champion.'), rl: rl() });
    expect(r.source).toBe('ai');
  });
  it('retries invalid responses then falls back', async () => {
    let calls = 0;
    const f: Fetcher = async () => { calls++; return { ok: true, json: async () => ({ narration: 'Biscuit flies away on wings!!' }) }; };
    const r = await narrate(req(), 'STATIC', { endpoint: 'x', fetcher: f, retries: 2, rl: rl() });
    expect(calls).toBe(3);
    expect(r).toMatchObject({ text: 'STATIC', source: 'static' });
  });
  it('recovers when a retry succeeds', async () => {
    let calls = 0;
    const f: Fetcher = async () => ({ ok: true, json: async () => ({ narration: ++calls === 1 ? 'nope' : 'Biscuit digs a neat tunnel under the dune.' }) });
    expect((await narrate(req(), 'S', { endpoint: 'x', fetcher: f, rl: rl() })).source).toBe('ai');
  });
  it('handles network errors, HTTP errors and malformed JSON', async () => {
    const boom: Fetcher = async () => { throw new Error('net'); };
    const http: Fetcher = async () => ({ ok: false, json: async () => ({}) });
    const bad: Fetcher = async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } });
    for (const f of [boom, http, bad]) expect((await narrate(req(), 'S', { endpoint: 'x', fetcher: f, rl: rl() })).text).toBe('S');
  });
  it('rate limits: min gap and max calls per run', async () => {
    let t = 0; const lim = new RateLimiter(1000, 2, () => t);
    expect(lim.tryTake()).toBe(true); expect(lim.tryTake()).toBe(false);
    t = 1500; expect(lim.tryTake()).toBe(true);
    t = 5000; expect(lim.tryTake()).toBe(false); // max 2 reached
    const r = await narrate(req(), 'S', { endpoint: 'x', fetcher: okJson('Biscuit digs under the dune again.'), rl: lim });
    expect(r.reason).toBe('rate-limited');
  });
});
