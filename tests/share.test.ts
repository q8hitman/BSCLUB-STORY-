import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { decodeCreature } from '../src/engine/creature';
import { simulateRun } from '../src/engine/sim';
import { FOOTER, cardContent, shareUrl, wrap } from '../src/share/shareCard';

function decodeQr(text: string): string | null {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size, scale = 6, margin = 4, size = (n + margin * 2) * scale;
  const px = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) {
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const i = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4;
      px[i] = px[i + 1] = px[i + 2] = 0;
    }
  }
  return jsQR(px, size, size)?.data ?? null;
}

describe('share card', () => {
  const classic = simulateRun(11, 'classic');
  const marine = simulateRun(12, 'marine');
  const SITE = 'https://q8hitman.github.io/BSCLUB-STORY-/';

  it('QR code decodes back to a working game link that rebuilds the creature', () => {
    for (const r of [classic, marine, simulateRun(13, 'classic'), simulateRun(14, 'marine')]) {
      const url = shareUrl(r.state, SITE);
      const decoded = decodeQr(url);
      expect(decoded).toBe(url);
      const code = decoded!.split('#c=')[1];
      expect(decodeCreature(code)).toEqual(r.state.creature);
    }
  });
  it('footer text is exactly the required credit', () => {
    expect(FOOTER).toBe('تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية');
    expect(cardContent(classic.state, classic.ending, 'en', true, SITE).footer).toBe(FOOTER);
  });
  it('contains name, mode, ending, summary, traits, discoveries; Marine credit only in Marine mode', () => {
    const c = cardContent(classic.state, classic.ending, 'ar', true, SITE);
    expect(c.creatureName).toBe(classic.state.creature.name);
    expect(c.player).toBe('Tester');
    expect(c.endingTitle).toBe(classic.ending.title.ar);
    expect(c.traits).toHaveLength(7);
    expect(c.marineCredit).toBeNull();
    expect(c.rtl).toBe(true);
    const m = cardContent(marine.state, marine.ending, 'en', false, SITE);
    expect(m.marineCredit).toMatch(/Marine Science Club/);
    expect(m.player).toBeNull(); // display name is optional
    expect(m.rtl).toBe(false);
  });
  it('word wrap never exceeds the width and respects max lines', () => {
    const measure = (s: string) => s.length * 10;
    const lines = wrap('a bb ccc dddd eeeee ffffff ggggggg hhhhhhhh', 100, measure);
    lines.forEach((l) => expect(measure(l)).toBeLessThanOrEqual(100));
    const capped = wrap('word '.repeat(80), 100, measure, 3);
    expect(capped).toHaveLength(3);
    expect(capped[2].endsWith('…')).toBe(true);
  });
});
