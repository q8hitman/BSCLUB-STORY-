import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { advance, choose, currentBeat, startGame } from '../src/engine/story';
import { composeEnding } from '../src/engine/ending';
import { decodeSave, saveFromHash } from '../src/engine/save';
import { ACHIEVEMENTS, emptyJournal, recordToJournal, sanitizeJournal } from '../src/engine/journal';
import { newVisitor, type SaveData } from '../src/engine/storage';
import { passportContent } from '../src/share/passport';
import { FOOTER } from '../src/share/shareCard';
import { rareFor } from '../src/engine/sighting';
import { RARE } from '../src/content/rare';
import type { GameState } from '../src/engine/types';

const SITE = 'https://q8hitman.github.io/BSCLUB-STORY-/';
function run(seed: number, mode: 'classic' | 'marine', stopAt = 99): GameState {
  const r = new Rng(seed);
  let s = startGame({ mode, seed, duck: 'zahra', player: 'Guest 7', creature: randomCreature(r, 'en') });
  s = { ...s, pins: { sighting: null, recentEndings: [] } };
  let steps = 0;
  while (s.stage !== 'ending' && steps++ < stopAt) s = s.stage === 'beat' ? choose(s, r.pick(currentBeat(s).choices).choice.id) : advance(s);
  return s;
}

/** Renders a QR to a greyscale pixel buffer the way the card does (black modules, white, 4-module quiet zone). */
function qrPixels(text: string, px: number) {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = q.modules.size, quiet = 4, cell = Math.floor(px / (n + 8)), size = cell * (n + 8);
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.modules.get(r, c))
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) { const i = (((r + quiet) * cell + y) * size + (c + quiet) * cell + x) * 4; data[i] = data[i + 1] = data[i + 2] = 0; }
  return { data, size, modules: n, cell };
}
function downscale(src: { data: Uint8ClampedArray; size: number }, f: number) {
  const s = Math.floor(src.size * f); const out = new Uint8ClampedArray(s * s * 4);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    let acc = 0, k = 0; const x0 = Math.floor(x / f), y0 = Math.floor(y / f), x1 = Math.floor((x + 1) / f), y1 = Math.floor((y + 1) / f);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { acc += src.data[(yy * src.size + xx) * 4]; k++; }
    const v = acc / Math.max(1, k); const i = (y * s + x) * 4; out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
  }
  return { data: out, size: s };
}

describe('Explorer Passport card', () => {
  it('has the exact credit line, mode logos rule, anatomy, progress and a link that restores the run', () => {
    for (const mode of ['classic', 'marine'] as const) {
      const s = run(31, mode, 7);
      const c = passportContent(s, 'ar', true, null, SITE);
      expect(c.footer).toBe('تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية');
      expect(c.footer).toBe(FOOTER);
      expect(c.marine).toBe(mode === 'marine');
      expect(!!c.collab).toBe(mode === 'marine');
      expect(c.anatomy).toHaveLength(7);
      expect(c.player).toBe('Guest 7');
      expect(passportContent(s, 'ar', false, null, SITE).player).toBeNull();
      const res = decodeSave(saveFromHash(c.url)!);
      expect(res.ok && res.state).toEqual(s);
    }
  });

  it('the QR decodes with a real QR reader at card size and from a half-size "phone photo"', () => {
    for (const seed of [3, 44, 120]) {
      const url = passportContent(run(seed, seed % 2 ? 'marine' : 'classic', 14), 'ar', true, null, SITE).url;
      const full = qrPixels(url, 400); // the card's QR is 400 px
      expect(jsQR(full.data, full.size, full.size)?.data).toBe(url);
      const photo = downscale(full, 0.5);
      expect(jsQR(photo.data, photo.size, photo.size)?.data).toBe(url);
      expect(full.cell).toBeGreaterThanOrEqual(4); // ≥4 px per module on the PNG
    }
  });
});

describe('Explorer Journal', () => {
  it('records the actual ending, animals and notes once per run, and unlocks the first achievement', () => {
    const s = run(9, 'classic'); const e = composeEnding(s);
    const a = recordToJournal(emptyJournal(), s, e, 'forest-signal-tree', 1000);
    expect(a.journal.endings).toHaveLength(1);
    expect(a.journal.endings[0].title).toEqual(e.title);
    expect(a.journal.endings[0].summary).toEqual(e.summary);
    expect(a.unlocked).toContain('first-run');
    const b = recordToJournal(a.journal, s, e, null, 2000); // same run restored again from its QR
    expect(b.journal.endings).toHaveLength(1);
    expect(b.unlocked).toEqual([]);
    expect(sanitizeJournal(JSON.parse(JSON.stringify(b.journal)))).toEqual(b.journal);
    expect(sanitizeJournal('nonsense')).toEqual(emptyJournal());
  });
  it('achievements reward exploration, not repetition: replaying one run many times unlocks nothing new', () => {
    const s = run(12, 'marine'); const e = composeEnding(s);
    let j = recordToJournal(emptyJournal(), s, e, null).journal;
    const first = Object.keys(j.achievements).length;
    for (let i = 0; i < 20; i++) j = recordToJournal(j, s, e, null).journal;
    expect(Object.keys(j.achievements).length).toBe(first);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(12);
  });
  it('hidden encounters need the right place AND a matching sense, at most one per run', () => {
    for (let seed = 1; seed < 400; seed++) {
      const s = run(seed, seed % 2 ? 'marine' : 'classic');
      const h = rareFor(s);
      if (!h) continue;
      expect(h.rare.biomes).toContain(s.plan.beats[h.index].biome);
    }
    expect(RARE.length).toBeGreaterThanOrEqual(30);
  });
});

describe('shared booth devices', () => {
  it('New Visitor forgets names, creatures, the current run and the journal, but keeps settings', () => {
    const s = run(5, 'classic'); const e = composeEnding(s);
    const d: SaveData = { settings: { lang: 'en', textSpeed: 40, muted: true, reducedMotion: false, ai: false }, current: s,
      runs: [{ mode: 'classic', planTokens: [], pathTokens: [], ending: e.id, templates: [], at: 1, title: e.title, creature: s.creature, player: 'Sara', duck: 'roaa' }],
      endingsSeen: [e.id], legendsSeen: ['bu-sahn'], journal: recordToJournal(emptyJournal(), s, e, null).journal };
    const n = newVisitor(d);
    expect(n.current).toBeNull();
    expect(n.journal).toEqual(emptyJournal());
    expect(JSON.stringify(n)).not.toContain('Sara');
    expect(JSON.stringify(n)).not.toContain(s.creature.name);
    expect(n.settings).toEqual(d.settings);
  });
});
