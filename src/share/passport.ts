// BSC Explorer Passport: a 1080×1920 collectible card (Instagram/Snapchat story size) with a REAL QR code that
// reopens this exact adventure on another device. The QR is drawn programmatically from the save link — never painted.
import QRCode from 'qrcode';
import { creatureSvg } from '../art/creatureSvg';
import { DUCK_BY_ID } from '../content/ducks';
import { PART_BY_ID } from '../content/parts';
import { BIOMES } from '../content/world';
import { adventureTitle } from '../engine/journal';
import { saveLink } from '../engine/save';
import { MAX_ENERGY } from '../engine/story';
import { SLOTS, type GameState, type Lang } from '../engine/types';
import { FOOTER, wrap } from './shareCard';

export const PASS_W = 1080, PASS_H = 1920;
const BASE = () => import.meta.env?.BASE_URL ?? '/';

export function siteUrl(): string {
  return (import.meta.env?.VITE_SITE_URL as string | undefined)
    ?? (typeof location !== 'undefined' ? `${location.origin}${BASE()}` : 'https://q8hitman.github.io/BSCLUB-STORY-/');
}

const SLOT_LABEL: Record<string, { en: string; ar: string }> = {
  base: { en: 'Body', ar: 'الجسم' }, head: { en: 'Head', ar: 'الرأس' }, eyes: { en: 'Eyes', ar: 'العينان' }, limbs: { en: 'Limbs', ar: 'الأطراف' },
  tail: { en: 'Tail', ar: 'الذيل' }, adaptation: { en: 'Adaptation', ar: 'التكيّف' }, ability: { en: 'Ability', ar: 'القدرة' },
};

export interface PassportContent {
  url: string; aiDropped: boolean; rtl: boolean; marine: boolean;
  kicker: string; mode: string; collab: string | null; id: string;
  name: string; player: string | null; duck: { name: string; role: string; img: string } | null;
  anatomy: { label: string; value: string }[];
  adventure: string; progress: string; done: boolean; step: number; total: number; energy: number;
  counts: string; scan: string; privacy: string; footer: string; plate: string | null;
}

export function passportContent(s: GameState, lang: Lang, showName: boolean, plate: string | null, site = siteUrl()): PassportContent {
  const { url, aiDropped } = saveLink(s, site);
  const ar = lang === 'ar'; const marine = s.mode === 'marine';
  const done = s.stage === 'ending';
  const total = s.plan.beats.length; const step = done ? total : s.index + (s.stage === 'outcome' ? 1 : 0);
  const place = BIOMES[s.plan.beats[Math.min(s.index, total - 1)].biome].name[lang];
  const d = DUCK_BY_ID[s.duck];
  return {
    url, aiDropped, rtl: ar, marine,
    kicker: ar ? 'جواز مستكشف BSC' : 'BSC EXPLORER PASSPORT',
    mode: marine ? (ar ? 'وضع نادي علوم البحار' : 'Marine Science Club Mode') : (ar ? 'المختبر الكلاسيكي' : 'Classic BioLab'),
    collab: marine ? (ar ? 'بالتعاون مع نادي علوم البحار' : 'In collaboration with the Marine Science Club') : null,
    id: `BSC-${(s.seed >>> 0).toString(36).toUpperCase().slice(-6).padStart(6, '0')}`,
    name: s.creature.name, player: showName && s.player.trim() ? s.player.trim() : null,
    duck: d ? { name: d.name[lang], role: d.role[lang], img: d.expressions.happy } : null,
    anatomy: SLOTS.map((k) => ({ label: SLOT_LABEL[k][lang], value: PART_BY_ID[(s.creature as unknown as Record<string, string>)[k]]?.name[lang] ?? '—' })),
    adventure: adventureTitle(s)[lang],
    progress: done ? (ar ? 'اكتملت المغامرة' : 'Adventure complete') : (ar ? `المشهد ${step + (s.stage === 'beat' ? 1 : 0)} من ${total} · ${place}` : `Scene ${step + (s.stage === 'beat' ? 1 : 0)} of ${total} · ${place}`),
    done, step, total, energy: s.energy,
    counts: ar ? `◆ ${s.evidence.length} أدلة   ✦ ${s.discoveries.length} اكتشافات` : `◆ ${s.evidence.length} clues   ✦ ${s.discoveries.length} discoveries`,
    scan: done ? (ar ? 'امسح الرمز لحفظ هذه المغامرة في جوالك' : 'Scan to keep this adventure on your phone') : (ar ? 'امسح الرمز لتكمل مغامرتك من جوالك' : 'Scan to continue this adventure on your phone'),
    privacy: ar ? 'كل من يمسح هذا الرمز يستطيع فتح هذه المغامرة.' : 'Anyone who scans this code can open this adventure.',
    footer: FOOTER, plate,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** QR as crisp black modules on white with the standard 4-module quiet zone (best for phone cameras and screen photos). */
export function drawQr(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size; const quiet = 4; const cell = Math.floor(size / (n + quiet * 2)); const real = cell * (n + quiet * 2);
  const ox = x + Math.floor((size - real) / 2), oy = y + Math.floor((size - real) / 2);
  g.fillStyle = '#ffffff'; g.fillRect(x, y, size, size);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) g.fillRect(ox + (c + quiet) * cell, oy + (r + quiet) * cell, cell, cell);
  return { modules: n, cell };
}

export async function renderPassport(s: GameState, lang: Lang, showName: boolean, plate: string | null): Promise<{ blob: Blob; content: PassportContent }> {
  const pc = passportContent(s, lang, showName, plate);
  const font = lang === 'ar' ? 'Tajawal' : '"Cormorant Garamond", Georgia';
  try { await Promise.all([document.fonts.load('700 40px Tajawal'), document.fonts.load('400 30px Tajawal'), document.fonts.load('700 40px "Cormorant Garamond"')]); } catch { /* system fonts */ }
  const cv = document.createElement('canvas'); cv.width = PASS_W; cv.height = PASS_H;
  const g = cv.getContext('2d')!;
  const F = (w: number, px: number, f = font) => `${w} ${px}px ${f}, Tajawal, "Segoe UI", Tahoma, sans-serif`;
  const sea = pc.marine;
  const gold = '#e9c77b', ink = '#0b0f0d';

  // backdrop: the scene the explorer is in, darkened, under a deep gradient
  g.fillStyle = sea ? '#04121d' : '#0b1310'; g.fillRect(0, 0, PASS_W, PASS_H);
  if (pc.plate) {
    try { const im = await loadImage(pc.plate); const sc = PASS_H / im.height; const w = im.width * sc; g.globalAlpha = 0.55; g.drawImage(im, (PASS_W - w) / 2, 0, w, PASS_H); g.globalAlpha = 1; } catch { /* plate optional */ }
  }
  const shade = g.createLinearGradient(0, 0, 0, PASS_H);
  shade.addColorStop(0, 'rgba(4,8,8,.82)'); shade.addColorStop(0.35, 'rgba(4,8,8,.35)'); shade.addColorStop(0.6, 'rgba(4,8,8,.75)'); shade.addColorStop(1, 'rgba(3,5,5,.97)');
  g.fillStyle = shade; g.fillRect(0, 0, PASS_W, PASS_H);

  // gilded frame with corner marks
  g.strokeStyle = 'rgba(233,199,123,.75)'; g.lineWidth = 3; rr(g, 34, 34, PASS_W - 68, PASS_H - 68, 30); g.stroke();
  g.strokeStyle = 'rgba(233,199,123,.3)'; g.lineWidth = 1.5; rr(g, 48, 48, PASS_W - 96, PASS_H - 96, 22); g.stroke();
  g.fillStyle = gold;
  for (const [cx, cy] of [[34, 34], [PASS_W - 34, 34], [34, PASS_H - 34], [PASS_W - 34, PASS_H - 34]]) { g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill(); }

  // official logos, unaltered, on a light plate so their original colours read on the dark card
  const logos = [`${BASE()}brand/bsc-logo-transparent.png`, ...(sea ? [`${BASE()}brand/marine-logo-transparent.png`] : [])];
  const imgs: HTMLImageElement[] = [];
  for (const src of logos) { try { imgs.push(await loadImage(src)); } catch { /* optional */ } }
  const lh = 104; const ws = imgs.map((im) => lh * (im.width / im.height)); const gap = 34;
  const plateW = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, ws.length - 1) + 60;
  const px = (PASS_W - plateW) / 2;
  g.fillStyle = '#f6efe0'; rr(g, px, 70, plateW, lh + 28, 22); g.fill();
  let lx = px + 30; imgs.forEach((im, i) => { g.drawImage(im, lx, 84, ws[i], lh); lx += ws[i] + gap; });

  g.textAlign = 'center'; g.direction = pc.rtl ? 'rtl' : 'ltr';
  g.fillStyle = gold; g.font = F(700, 46); g.fillText(pc.kicker, PASS_W / 2, 262);
  g.fillStyle = sea ? '#7fd3f5' : '#a6d9a8'; g.font = F(700, 28, 'Tajawal'); g.fillText(pc.mode, PASS_W / 2, 304);
  if (pc.collab) { g.fillStyle = '#cfe9f6'; g.font = F(400, 24, 'Tajawal'); g.fillText(pc.collab, PASS_W / 2, 340); }

  // specimen window with the explorer's actual creature
  const wy = 356, wh = 460;
  const glow = g.createRadialGradient(PASS_W / 2, wy + wh * 0.55, 40, PASS_W / 2, wy + wh * 0.55, 470);
  glow.addColorStop(0, sea ? 'rgba(90,190,230,.42)' : 'rgba(233,199,123,.40)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); rr(g, 90, wy, PASS_W - 180, wh, 40); g.clip(); g.fillStyle = 'rgba(6,10,10,.55)'; g.fillRect(90, wy, PASS_W - 180, wh); g.fillStyle = glow; g.fillRect(90, wy, PASS_W - 180, wh); g.restore();
  g.strokeStyle = 'rgba(233,199,123,.55)'; g.lineWidth = 2; rr(g, 90, wy, PASS_W - 180, wh, 40); g.stroke();
  const svgUrl = URL.createObjectURL(new Blob([creatureSvg(s.creature, { width: 760, expression: pc.done ? 'happy' : 'confident' })], { type: 'image/svg+xml' }));
  try { const im = await loadImage(svgUrl); const w = 700, h = w * (im.height / im.width); g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; g.drawImage(im, (PASS_W - w) / 2, wy + wh - h - 6, w, h); g.restore(); } finally { URL.revokeObjectURL(svgUrl); }
  g.fillStyle = 'rgba(233,199,123,.9)'; g.font = F(700, 22, '"Segoe UI", sans-serif'); g.direction = 'ltr'; g.textAlign = 'left'; g.fillText(pc.id, 120, wy + 44);
  g.direction = pc.rtl ? 'rtl' : 'ltr'; g.textAlign = 'center';

  // name, explorer, companion
  let y = wy + wh + 84;
  g.fillStyle = '#f7e6b8'; g.font = F(700, 88); g.fillText(pc.name, PASS_W / 2, y, PASS_W - 160);
  if (pc.player) { y += 50; g.fillStyle = '#d9d0bc'; g.font = F(400, 30, 'Tajawal'); g.fillText((lang === 'ar' ? 'المستكشف: ' : 'Explorer: ') + pc.player, PASS_W / 2, y, PASS_W - 200); }
  y += 34;
  if (pc.duck) {
    try {
      const di = await loadImage(`${BASE()}ducks/${pc.duck.img}`); const ds = 76;
      const label = (lang === 'ar' ? 'الرفيق: ' : 'Companion: ') + `${pc.duck.name} · ${pc.duck.role}`;
      g.font = F(400, 26, 'Tajawal'); const tw = Math.min(g.measureText(label).width, PASS_W - 300);
      const rowW = ds + 18 + tw; const rx = (PASS_W - rowW) / 2;
      g.save(); g.beginPath(); g.arc(pc.rtl ? rx + rowW - ds / 2 : rx + ds / 2, y + ds / 2, ds / 2, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#2a201b'; g.fillRect(pc.rtl ? rx + rowW - ds : rx, y, ds, ds); g.drawImage(di, pc.rtl ? rx + rowW - ds : rx, y - 4, ds, ds * (di.height / di.width)); g.restore();
      g.fillStyle = '#e8dcc4'; g.textAlign = pc.rtl ? 'right' : 'left'; g.fillText(label, pc.rtl ? rx + rowW - ds - 18 : rx + ds + 18, y + ds / 2 + 9, tw); g.textAlign = 'center';
    } catch { /* duck art optional */ }
    y += 96;
  }

  // anatomy: two columns
  g.strokeStyle = 'rgba(233,199,123,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(130, y); g.lineTo(PASS_W - 130, y); g.stroke();
  y += 42; const colX = pc.rtl ? [PASS_W - 120, PASS_W / 2 - 10] : [120, PASS_W / 2 + 10];
  g.textAlign = pc.rtl ? 'right' : 'left';
  pc.anatomy.forEach((a, i) => {
    const cx = colX[i % 2]; const ry = y + Math.floor(i / 2) * 42;
    g.fillStyle = gold; g.font = F(700, 22, 'Tajawal'); g.fillText(a.label, cx, ry, 150);
    g.fillStyle = '#efe6d2'; g.font = F(400, 26, 'Tajawal'); g.fillText(a.value, pc.rtl ? cx - 150 : cx + 150, ry, 280);
  });
  y += 4 * 42 + 2;

  // adventure progress
  g.textAlign = 'center'; g.fillStyle = '#f2e3bd'; g.font = F(700, 32, 'Tajawal'); g.fillText(pc.adventure, PASS_W / 2, y);
  y += 40; g.fillStyle = '#cfc6b2'; g.font = F(400, 24, 'Tajawal'); g.fillText(`${pc.progress}   ·   ${pc.counts}`, PASS_W / 2, y, PASS_W - 180);
  y += 22; const bw = PASS_W - 300, bx = 150;
  g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, bx, y, bw, 12, 6); g.fill();
  const frac = pc.done ? 1 : (pc.step / pc.total);
  g.fillStyle = sea ? '#5fc4ec' : gold; g.save(); if (pc.rtl) { g.translate(bx + bw, 0); g.scale(-1, 1); g.translate(-bx, 0); } rr(g, bx, y, Math.max(12, bw * frac), 12, 6); g.fill(); g.restore();
  for (let i = 0; i < MAX_ENERGY; i++) { g.fillStyle = i < pc.energy ? '#f3b24a' : 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(PASS_W / 2 + (i - (MAX_ENERGY - 1) / 2) * 30, y + 40, 9, 0, Math.PI * 2); g.fill(); }

  // the QR: large, black on white, quiet zone included
  const qs = 400, qx = pc.rtl ? 96 : PASS_W - 96 - qs, qy = PASS_H - 96 - qs - 18;
  g.fillStyle = '#ffffff'; rr(g, qx - 14, qy - 14, qs + 28, qs + 28, 22); g.fill();
  drawQr(g, pc.url, qx, qy, qs);
  const tx = pc.rtl ? qx + qs + 44 : 96, tw = PASS_W - qs - 96 * 2 - 44;
  g.textAlign = pc.rtl ? 'left' : 'left'; g.direction = pc.rtl ? 'rtl' : 'ltr'; g.textAlign = pc.rtl ? 'right' : 'left';
  const ax = pc.rtl ? tx + tw : tx;
  let ty = qy + 70;
  g.fillStyle = '#f7e6b8'; g.font = F(700, 36, 'Tajawal');
  for (const line of wrap(pc.scan, tw, (t) => g.measureText(t).width, 4)) { g.fillText(line, ax, ty); ty += 48; }
  ty += 14; g.fillStyle = '#b9b09c'; g.font = F(400, 24, 'Tajawal');
  for (const line of wrap(pc.privacy, tw, (t) => g.measureText(t).width, 3)) { g.fillText(line, ax, ty); ty += 34; }
  ty += 8; g.fillStyle = '#8f8775'; g.font = F(400, 22, 'Tajawal');
  for (const line of wrap(lang === 'ar' ? 'لا حاجة إلى حساب أو تطبيق.' : 'No account or app needed.', tw, (t) => g.measureText(t).width, 2)) { g.fillText(line, ax, ty); ty += 30; }

  // footer — exact credit line
  g.textAlign = 'center'; g.direction = 'rtl'; g.fillStyle = '#d7cdb6'; g.font = '700 26px Tajawal, "Segoe UI", Tahoma, sans-serif';
  g.fillText(FOOTER, PASS_W / 2, PASS_H - 58);
  g.fillStyle = ink;

  const blob = await new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
  return { blob, content: pc };
}
