import { describe, expect, it } from 'vitest';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { advance, choose, currentBeat, startGame, validateState, type PlanOpts, type RunMemory } from '../src/engine/story';
import { composeEnding } from '../src/engine/ending';
import { MAX_LINK_CHARS, decodeSave, encodeSave, saveFromHash, saveLink } from '../src/engine/save';
import type { GameState, Mode } from '../src/engine/types';
import { DUCKS } from '../src/content/ducks';

const SITE = 'https://q8hitman.github.io/BSCLUB-STORY-/';

/** Plays a random run; returns every intermediate state. History makes the booth device's plan differ from a fresh device. */
function playthrough(seed: number, mode: Mode, history: RunMemory[] = [], opts?: PlanOpts): GameState[] {
  const r = new Rng(seed * 7 + 1);
  let s = startGame({ mode, seed, duck: r.pick(DUCKS).id, player: r.chance(0.5) ? 'مستكشف ٧' : '', creature: randomCreature(r, 'ar'), history, opts });
  s = { ...s, pins: { sighting: r.chance(0.3) ? [3, 'bu-sahn'] : null, recentEndings: r.chance(0.5) ? ['guardian'] : [] } };
  const out = [s];
  while (s.stage !== 'ending') {
    s = s.stage === 'beat' ? choose(s, r.pick(currentBeat(s).choices).choice.id) : advance(s);
    out.push(s);
  }
  return out;
}

/** A booth history: earlier visitors' runs that change which plan and twists the next run gets. */
function boothHistory(mode: Mode, n: number): RunMemory[] {
  const h: RunMemory[] = [];
  for (let i = 0; i < n; i++) {
    const run = playthrough(900 + i, mode);
    const end = run[run.length - 1];
    h.push({ mode, planTokens: end.plan.beats.map((b) => `t:${b.template}`), pathTokens: [], ending: 'x', templates: end.plan.beats.map((b) => b.template) });
  }
  return h;
}

describe('Explorer Passport save codes', () => {
  it('rebuild the exact same run on a fresh device, at every point of the story, in both modes', () => {
    let checked = 0;
    for (const mode of ['classic', 'marine'] as Mode[]) {
      const history = boothHistory(mode, 5);
      for (let seed = 1; seed <= 40; seed++) {
        for (const s of playthrough(seed * 131, mode, history)) {
          const res = decodeSave(encodeSave(s));
          expect(res.ok, `${mode} ${seed} ${s.index}${s.stage}`).toBe(true);
          if (res.ok) { expect(res.state).toEqual(s); checked++; }
        }
      }
    }
    expect(checked).toBeGreaterThan(900);
  });

  it('Quick Story and every tone round-trip exactly and stay healthy', () => {
    const lens: number[] = []; const endings = new Set<string>();
    for (const length of ['quick', 'full'] as const) for (const tone of ['balanced', 'light', 'mystery'] as const) for (const mode of ['classic', 'marine'] as Mode[]) {
      for (let seed = 1; seed <= 25; seed++) {
        const run = playthrough(seed * 53, mode, boothHistory(mode, 2), { length, tone });
        const end = run[run.length - 1];
        expect(validateState(end)).toEqual([]);
        if (length === 'quick') { lens.push(end.plan.beats.length); endings.add(composeEnding(end).id); }
        for (const s of [run[2], run[run.length - 2], end]) { const res = decodeSave(encodeSave(s)); expect(res.ok && res.state).toEqual(s); }
      }
    }
    expect(Math.max(...lens)).toBeLessThanOrEqual(8);
    expect(Math.min(...lens)).toBeGreaterThanOrEqual(6);
    expect(endings.size).toBeGreaterThanOrEqual(5);
  });

  it('a restored run can be continued to the same ending as the original', () => {
    const run = playthrough(4242, 'marine', boothHistory('marine', 4));
    const mid = run[Math.floor(run.length / 2)];
    const res = decodeSave(encodeSave(mid));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    let a = mid, b = res.state;
    const r = new Rng(5);
    while (a.stage !== 'ending') {
      if (a.stage === 'beat') { const id = r.pick(currentBeat(a).choices).choice.id; a = choose(a, id); b = choose(b, id); } else { a = advance(a); b = advance(b); }
      expect(b).toEqual(a);
    }
  });

  it('legacy runs without a plan variant still round-trip (explicit plan fallback)', () => {
    for (let seed = 1; seed <= 20; seed++) for (const s0 of playthrough(seed * 17, seed % 2 ? 'classic' : 'marine', boothHistory('classic', 2))) {
      const s = { ...s0, plan: { ...s0.plan, variant: undefined } };
      const res = decodeSave(encodeSave(s));
      expect(res.ok).toBe(true);
      if (res.ok) expect({ ...res.state, plan: { ...res.state.plan, variant: undefined } }).toEqual(s);
    }
  });

  it('carries the AI wording of the paragraph on screen', () => {
    const s = playthrough(77, 'classic').find((x) => x.stage === 'outcome')!;
    const withAi = { ...s, ai: { i: s.index, lang: 'ar' as const, text: 'نصّ أعاد الذكاء الاصطناعي صياغته للمشهد الحالي.' } };
    const res = decodeSave(encodeSave(withAi));
    expect(res.ok && res.state.ai).toEqual(withAi.ai);
  });

  it('links stay QR-sized; an oversized AI paragraph is dropped visibly, never the progress', () => {
    let longest = 0;
    for (let seed = 1; seed <= 60; seed++) for (const s of playthrough(seed * 3, seed % 2 ? 'classic' : 'marine', boothHistory('marine', 3))) {
      const { url, aiDropped } = saveLink(s, SITE); longest = Math.max(longest, url.length); expect(aiDropped).toBe(false);
    }
    expect(longest).toBeLessThan(MAX_LINK_CHARS);
    const s = playthrough(8, 'classic').find((x) => x.stage === 'outcome')!;
    const big = { ...s, player: 'م'.repeat(24), ai: { i: s.index, lang: 'ar' as const, text: 'ب'.repeat(600) } };
    const link = saveLink(big, SITE);
    expect(link.url.length).toBeLessThanOrEqual(MAX_LINK_CHARS);
    expect(link.aiDropped).toBe(true);
    const res = decodeSave(saveFromHash(link.url)!);
    expect(res.ok && res.state.log).toEqual(big.log);
  });

  it('rejects invalid, corrupted, future-version and out-of-date codes with a reason', () => {
    const s = playthrough(5, 'classic')[6];
    const code = encodeSave(s);
    expect(decodeSave('hello')).toMatchObject({ ok: false, reason: 'format' });
    expect(decodeSave('')).toMatchObject({ ok: false, reason: 'format' });
    expect(decodeSave(code.slice(0, 20) + 'A' + code.slice(21))).toMatchObject({ ok: false, reason: 'checksum' });
    expect(decodeSave(code.slice(0, -3))).toMatchObject({ ok: false });
    const forge = (p: unknown[]) => { const b = btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return decodeSave(`${b}.${fnv(b)}`); };
    const payload = JSON.parse(decodeURIComponent(escape(atob(code.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')))));
    expect(forge([9, ...payload.slice(1)])).toMatchObject({ ok: false, reason: 'newer' });
    expect(forge([0, ...payload.slice(1)])).toMatchObject({ ok: false, reason: 'version' });
    // a choice id that no longer exists in this game version: the creature is kept, the story is NOT replaced
    const old = JSON.parse(decodeURIComponent(escape(atob(encodeSave(s, { legacy: true }).split('.')[0].replace(/-/g, '+').replace(/_/g, '/')))));
    const stale = [...old]; stale[8] = ['no-such-choice'];
    const r = forge(stale);
    expect(r).toMatchObject({ ok: false, reason: 'content' });
    expect(!r.ok && r.creature?.name).toBe(s.creature.name);
    // compact codes store positions: a position that now means another choice is caught by the content stamp
    const moved = [...payload]; moved[6] = (moved[6][0] === '0' ? '1' : '0') + moved[6].slice(1);
    const r2 = forge(moved);
    expect(r2).toMatchObject({ ok: false });
    expect(!r2.ok && ['content', 'replay'].includes(r2.reason)).toBe(true);
    expect(!r2.ok && r2.creature?.name).toBe(s.creature.name);
    expect(saveFromHash('#c=abc')).toBeNull();
  });

  it('compact links: short enough for a QR every phone reads as a web link, and cards made before still open', () => {
    let longest = 0; let n = 0;
    for (const mode of ['classic', 'marine'] as Mode[]) for (let seed = 1; seed <= 30; seed++) {
      const run = playthrough(seed * 17, mode, boothHistory(mode, 4));
      for (const st of [run[1], run[Math.floor(run.length / 2)], run[run.length - 1]]) {
        const { url } = saveLink(st, SITE); longest = Math.max(longest, url.length); n++;
        expect(url.startsWith(`${SITE}?s=`)).toBe(true);
        expect(/^https:\/\/[\w./?=-]+$/.test(url)).toBe(true);
        const viaLink = decodeSave(saveFromHash(url)!);
        expect(viaLink.ok && viaLink.state).toEqual(st);
        // the older, longer format (and the old #s= link) keeps working
        const legacy = decodeSave(saveFromHash(`${SITE}#s=${encodeSave(st, { legacy: true })}`)!);
        expect(legacy.ok && legacy.state).toEqual(st);
      }
    }
    expect(n).toBeGreaterThan(150);
    expect(longest).toBeLessThan(230);
  });
});

function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(7, '0');
}
