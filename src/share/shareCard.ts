// Share card (1080×1350 PNG) drawn on a canvas. Layout is computed separately so it can be unit-tested.
import QRCode from 'qrcode';
import { creatureSvg } from '../art/creatureSvg';
import { DUCK_BY_ID } from '../content/ducks';
import { PART_BY_ID } from '../content/parts';
import { FACT_BY_ID } from '../content/world';
import { encodeCreature } from '../engine/creature';
import { SLOTS, type Ending, type GameState, type Lang } from '../engine/types';

export const CARD_W = 1080, CARD_H = 1350;
export const FOOTER = 'تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية';

export function shareUrl(s: Pick<GameState, 'creature'>, site?: string): string {
  const base = site ?? (import.meta.env?.VITE_SITE_URL as string | undefined)
    ?? (typeof location !== 'undefined' ? `${location.origin}${import.meta.env?.BASE_URL ?? '/'}` : 'https://q8hitman.github.io/BSCLUB-STORY-/');
  return `${base}#c=${encodeCreature(s.creature)}`;
}

export interface CardContent {
  lang: Lang; rtl: boolean;
  brand: string; modeLabel: string; marineCredit: string | null;
  creatureName: string; player: string | null; endingTitle: string; summary: string;
  traits: string[]; discoveries: string[]; url: string; footer: string; duckImg: string | null;
}

export function cardContent(s: GameState, e: Ending, lang: Lang, showName: boolean, site?: string): CardContent {
  const marine = s.mode === 'marine';
  const sentences = e.summary[lang].split(/(?<=[.!?؟])\s+/);
  return {
    lang, rtl: lang === 'ar',
    brand: lang === 'ar' ? 'BSC BioLab · شنو هالوحش؟!' : 'BSC BioLab · What The Beast?!',
    modeLabel: marine ? (lang === 'ar' ? 'وضع نادي علوم البحار' : 'Marine Science Club Mode') : (lang === 'ar' ? 'المختبر الكلاسيكي' : 'Classic BioLab'),
    marineCredit: marine ? (lang === 'ar' ? 'بالتعاون مع نادي علوم البحار' : 'In collaboration with the Marine Science Club') : null,
    creatureName: s.creature.name,
    player: showName && s.player.trim() ? s.player.trim() : null,
    endingTitle: e.title[lang].replace(/[\u2066-\u2069]/g, ''),
    summary: sentences.slice(0, 3).join(' ').replace(/[\u2066-\u2069]/g, ''),
    traits: SLOTS.map((k) => PART_BY_ID[(s.creature as unknown as Record<string, string>)[k]].name[lang]),
    discoveries: s.discoveries.slice(0, 3).map((id) => FACT_BY_ID[id]?.text[lang]).filter(Boolean) as string[],
    url: shareUrl(s, site),
    footer: FOOTER,
    duckImg: DUCK_BY_ID[s.duck]?.img ?? null,
  };
}

/** Greedy word wrap using a measure function (canvas measureText in the browser). */
export function wrap(text: string, maxW: number, measure: (s: string) => number, maxLines = 99): string[] {
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (measure(test) <= maxW || !cur) cur = test; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const out = lines.slice(0, maxLines); out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, '') + '…'; return out; }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export async function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 300, color: { dark: '#14221d', light: '#ffffff' } });
}

export async function renderShareCard(s: GameState, e: Ending, lang: Lang, showName: boolean): Promise<Blob> {
  const cc = cardContent(s, e, lang, showName);
  const font = lang === 'ar' ? 'Tajawal' : 'Fredoka';
  try { await Promise.all([document.fonts.load(`700 40px ${font}`), document.fonts.load(`400 30px ${font}`)]); } catch { /* fall back to system font */ }
  const cv = document.createElement('canvas'); cv.width = CARD_W; cv.height = CARD_H;
  const g = cv.getContext('2d')!;
  const F = (w: number, px: number) => `${w} ${px}px ${font}, "Segoe UI", Tahoma, sans-serif`;
  g.direction = cc.rtl ? 'rtl' : 'ltr';
  const X0 = 70, X1 = CARD_W - 70; const tx = cc.rtl ? X1 : X0; g.textAlign = cc.rtl ? 'right' : 'left';

  // background
  const bg = g.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, s.mode === 'marine' ? '#0b3a52' : '#14221d'); bg.addColorStop(1, s.mode === 'marine' ? '#061a2b' : '#0c1512');
  g.fillStyle = bg; g.fillRect(0, 0, CARD_W, CARD_H);
  g.fillStyle = '#f7f1e3'; roundRect(g, 40, 40, CARD_W - 80, CARD_H - 80, 36); g.fill();
  g.lineWidth = 6; g.strokeStyle = '#20170f'; g.stroke();

  // header
  g.fillStyle = '#14221d'; g.font = F(700, 34); g.fillText(cc.brand, tx, 104);
  g.fillStyle = s.mode === 'marine' ? '#0277bd' : '#2e7d32'; g.font = F(700, 26); g.fillText(cc.modeLabel + (cc.marineCredit ? ` · ${cc.marineCredit}` : ''), tx, 146);

  // creature panel
  g.fillStyle = '#e9f5ec'; roundRect(g, 70, 176, CARD_W - 140, 420, 28); g.fill(); g.lineWidth = 4; g.stroke();
  const svg = creatureSvg(s.creature, { width: 600 });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try { const img = await loadImage(url); g.drawImage(img, 240, 196, 600, 480 * 0.8); } finally { URL.revokeObjectURL(url); }
  if (cc.duckImg) {
    try { const d = await loadImage(`${import.meta.env?.BASE_URL ?? '/'}ducks/${cc.duckImg}`); const dw = 170, dh = dw * (d.height / d.width); const dx = cc.rtl ? 90 : CARD_W - 90 - dw;
      g.save(); roundRect(g, dx, 596 - dh - 14, dw, dh, 20); g.clip(); g.drawImage(d, dx, 596 - dh - 14, dw, dh); g.restore(); } catch { /* duck art optional on card */ }
  }

  // names + ending
  let y = 660;
  g.fillStyle = '#20170f'; g.font = F(700, 60); g.fillText(cc.creatureName, tx, y);
  if (cc.player) { y += 44; g.fillStyle = '#5d4037'; g.font = F(400, 30); g.fillText((lang === 'ar' ? 'عالِم/ة الميدان: ' : 'Field scientist: ') + cc.player, tx, y); }
  y += 62; g.fillStyle = '#c2185b'; g.font = F(700, 42);
  for (const line of wrap(cc.endingTitle, X1 - X0, (t) => g.measureText(t).width, 2)) { g.fillText(line, tx, y); y += 50; }
  g.fillStyle = '#3e2723'; g.font = F(400, 28);
  for (const line of wrap(cc.summary, X1 - X0, (t) => g.measureText(t).width, 4)) { g.fillText(line, tx, y); y += 38; }

  // traits chips
  y += 18; g.font = F(700, 24); let cx = cc.rtl ? X1 : X0;
  for (const tr of cc.traits) {
    const w = g.measureText(tr).width + 32;
    if (cc.rtl ? cx - w < X0 + 260 : cx + w > X1 - 260) { y += 50; cx = cc.rtl ? X1 : X0; }
    const left = cc.rtl ? cx - w : cx;
    g.fillStyle = '#ffe9b3'; roundRect(g, left, y - 30, w, 42, 21); g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#20170f'; g.stroke();
    g.fillStyle = '#20170f'; g.textAlign = 'center'; g.fillText(tr, left + w / 2, y); g.textAlign = cc.rtl ? 'right' : 'left';
    cx = cc.rtl ? left - 10 : left + w + 10;
  }
  // discoveries
  y += 56; g.font = F(700, 24); g.fillStyle = '#1b5e20';
  const limitY = CARD_H - 120; // keep clear of the footer
  for (const d of cc.discoveries.slice(0, 2)) {
    const lines = wrap('• ' + d, X1 - X0 - 270, (t) => g.measureText(t).width, 3);
    if (y + (lines.length - 1) * 32 > limitY) break;
    for (const line of lines) { g.fillText(line, tx, y); y += 32; }
    y += 6;
  }

  // QR (bottom corner)
  const qr = await loadImage(await qrDataUrl(cc.url));
  const qx = cc.rtl ? 80 : CARD_W - 80 - 220; const qy = CARD_H - 80 - 260;
  g.fillStyle = '#ffffff'; roundRect(g, qx - 10, qy - 10, 240, 240, 16); g.fill(); g.lineWidth = 3; g.strokeStyle = '#20170f'; g.stroke();
  g.drawImage(qr, qx, qy, 220, 220);
  g.fillStyle = '#5d4037'; g.font = F(400, 20); g.textAlign = 'center';
  g.fillText(lang === 'ar' ? 'امسح وجرّب المخلوق' : 'Scan to play this creature', qx + 110, qy + 246);

  // footer — exact text required by the club
  g.textAlign = 'center'; g.direction = 'rtl'; g.fillStyle = '#14221d'; g.font = `700 28px Tajawal, "Segoe UI", Tahoma, sans-serif`;
  g.fillText(FOOTER, CARD_W / 2, CARD_H - 62);

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
