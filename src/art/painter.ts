// Painterly scene renderer: gouache-on-dark-paper look, drawn procedurally on a canvas.
// Inspired by 1930s deep-sea expedition paintings (style only — nothing is copied).
// Every scene is deterministic for (biome, props, seed) and cached as an image URL.
import { Rng } from '../engine/rng';
import type { BiomeId } from '../engine/types';

export const PW = 1280, PH = 720;
type G = CanvasRenderingContext2D;

// ───────────────────────── brush primitives ─────────────────────────
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function wash(g: G, x: number, y: number, rad: number, col: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}
function vgrad(g: G, stops: [number, string][], y0 = 0, y1 = PH) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, y0, PW, y1 - y0);
}
/** Many short, slightly curved, semi-transparent strokes — the "gouache" texture. */
function strokes(g: G, r: Rng, n: number, area: (r: Rng) => [number, number], cols: string[], o: { w?: [number, number]; len?: [number, number]; ang?: number; jit?: number; a?: [number, number] } = {}) {
  const [w0, w1] = o.w ?? [2, 7], [l0, l1] = o.len ?? [10, 40], [a0, a1] = o.a ?? [0.05, 0.22];
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const [x, y] = area(r); const ang = (o.ang ?? 0) + (r.float() - 0.5) * (o.jit ?? 0.8);
    const len = l0 + r.float() * (l1 - l0); const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
    g.strokeStyle = rgba(r.pick(cols), a0 + r.float() * (a1 - a0)); g.lineWidth = w0 + r.float() * (w1 - w0);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx / 2 + (r.float() - 0.5) * len * 0.4, y + dy / 2 + (r.float() - 0.5) * len * 0.4, x + dx, y + dy); g.stroke();
  }
}
function glow(g: G, x: number, y: number, rad: number, col: string, blur = 18) {
  g.save(); g.shadowColor = col; g.shadowBlur = blur; g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); g.restore();
}
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function ridge(g: G, r: Rng, base: number, amp: number, col: string, rough = 0.5, step = 24, sharp = false) {
  const gr = g.createLinearGradient(0, base - amp, 0, PH); gr.addColorStop(0, shade(col, 1.12)); gr.addColorStop(0.35, col); gr.addColorStop(1, shade(col, 0.55));
  g.fillStyle = gr; g.beginPath(); g.moveTo(-20, PH + 20); let y = base;
  const pts: [number, number][] = [];
  for (let x = -20; x <= PW + 20; x += step) {
    y += (r.float() - 0.5) * amp * rough; y = Math.max(base - amp, Math.min(base + amp * 0.3, y));
    if (sharp && r.chance(0.18)) y = base - amp * (0.6 + r.float() * 0.5);
    pts.push([x, y]); g.lineTo(x, y);
  }
  g.lineTo(PW + 20, PH + 20); g.closePath(); g.fill();
  return pts;
}
/** Natural mountain range: overlapping peaks with jagged noise, lit top-left, snow on the crests. */
function range(g: G, r: Rng, base: number, height: number, col: string, snow?: string) {
  const peaks = Array.from({ length: 5 + r.int(3) }, () => ({ x: r.float() * PW, h: height * (0.45 + r.float() * 0.55), w: 160 + r.float() * 260 }));
  const pts: [number, number][] = [];
  for (let x = -20; x <= PW + 20; x += 6) {
    let h = 0; for (const p of peaks) h = Math.max(h, p.h * Math.pow(Math.max(0, 1 - Math.abs(x - p.x) / p.w), 1.15));
    pts.push([x, base - h + (r.float() - 0.5) * 7]);
  }
  const gr = g.createLinearGradient(0, base - height, 0, PH); gr.addColorStop(0, shade(col, 1.15)); gr.addColorStop(0.5, col); gr.addColorStop(1, shade(col, 0.5));
  g.fillStyle = gr; g.beginPath(); g.moveTo(-20, PH); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(PW + 20, PH); g.closePath(); g.fill();
  g.save(); g.clip();
  for (const p of peaks) { // shadowed east faces
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(p.x, base - p.h); g.lineTo(p.x + p.w, base + 10); g.lineTo(p.x + p.w * 0.25, base + 10); g.closePath(); g.fill();
    if (snow) { g.fillStyle = snow; g.beginPath(); g.moveTo(p.x - p.w * 0.16, base - p.h * 0.8); g.lineTo(p.x, base - p.h - 2); g.lineTo(p.x + p.w * 0.16, base - p.h * 0.8); g.lineTo(p.x + p.w * 0.06, base - p.h * 0.84); g.lineTo(p.x - 2, base - p.h * 0.76); g.lineTo(p.x - p.w * 0.07, base - p.h * 0.85); g.closePath(); g.fill(); }
  }
  strokes(g, r, 160, (q) => [q.float() * PW, base - q.float() * height], [shade(col, 1.3), shade(col, 0.7)], { ang: 1.1, jit: 0.3, len: [10, 30], w: [1, 3], a: [0.05, 0.14] });
  g.restore();
  return pts;
}
function edgeStrokes(g: G, r: Rng, pts: [number, number][], cols: string[], n = 260) {
  strokes(g, r, n, (rr) => { const p = rr.pick(pts); return [p[0] + rr.float() * 20, p[1] + rr.float() * 26]; }, cols, { w: [3, 9], len: [14, 40], a: [0.04, 0.16], jit: 0.5 });
}
function particles(g: G, r: Rng, n: number, col: string, area: [number, number, number, number] = [0, 0, PW, PH], size: [number, number] = [0.6, 2.2], a: [number, number] = [0.2, 0.8]) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = rgba(col, a[0] + r.float() * (a[1] - a[0]));
    g.beginPath(); g.arc(area[0] + r.float() * area[2], area[1] + r.float() * area[3], size[0] + r.float() * (size[1] - size[0]), 0, Math.PI * 2); g.fill();
  }
}
/** Soft-edged light cone: several nested cones so the edge feathers like real light in water. */
function beam(g: G, x: number, y: number, ang: number, spread: number, len: number, col: string, a = 0.35) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const layers = 6;
  for (let i = 0; i < layers; i++) {
    const sp = spread * (0.35 + (i / (layers - 1)) * 0.9), al = (a / layers) * 1.6;
    const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, rgba(col, al)); gr.addColorStop(0.6, rgba(col, al * 0.35)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -5); g.lineTo(len, -len * sp); g.lineTo(len, len * sp); g.lineTo(0, 5); g.closePath(); g.fill();
  }
  g.restore();
}
function vignette(g: G, a = 0.75) {
  const gr = g.createRadialGradient(PW / 2, PH / 2, PH * 0.3, PW / 2, PH / 2, PW * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
}
function grain(g: G, r: Rng, a = 0.06) {
  for (let i = 0; i < 9000; i++) { g.fillStyle = r.chance(0.5) ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`; g.fillRect(r.float() * PW, r.float() * PH, 1.4, 1.4); }
}

// ───────────────────────── creatures & objects ─────────────────────────
function fangs(g: G, x0: number, y0: number, x1: number, y1: number, n: number, len: number, up: boolean, r: Rng) {
  g.fillStyle = 'rgba(245,240,225,0.95)';
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; const l = len * (0.5 + r.float() * 0.8) * (up ? -1 : 1);
    g.beginPath(); g.moveTo(x - 2.2, y); g.quadraticCurveTo(x + 2, y + l * 0.6, x + 1, y + l); g.lineTo(x + 2.4, y); g.closePath(); g.fill();
  }
}
function eye(g: G, x: number, y: number, rad: number, iris = '#d9a441', slit = false) {
  g.fillStyle = '#0b0b0b'; g.beginPath(); g.arc(x, y, rad * 1.25, 0, Math.PI * 2); g.fill();
  const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 1, x, y, rad); gr.addColorStop(0, '#fff3c9'); gr.addColorStop(0.4, iris); gr.addColorStop(1, '#2a1a08');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#050505'; g.beginPath();
  if (slit) g.ellipse(x, y, rad * 0.62, rad * 0.14, 0, 0, Math.PI * 2); else g.arc(x + rad * 0.1, y, rad * 0.45, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - rad * 0.38, y - rad * 0.42, rad * 0.16, rad * 0.08, -0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = Math.max(1, rad * 0.06); g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.stroke();
}
function lure(g: G, x0: number, y0: number, x1: number, y1: number, col = '#ff6b5a') {
  g.strokeStyle = 'rgba(220,210,190,0.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 + (x1 - x0) * 0.2, y0 - 80, x1, y1 - 60, x1, y1); g.stroke();
  glow(g, x1, y1, 4, col, 22); glow(g, x1 + 5, y1 + 2, 3, '#9fd8ff', 16);
}
/** Long, fanged, light-studded predator (dragonfish-like). */
export function dragonfish(g: G, r: Rng, x: number, y: number, s: number, flip = false, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip ? -s : s, s);
  const body = new Path2D('M0 0 C60 -26 220 -30 330 -8 C360 -2 380 6 392 16 C360 22 320 26 300 24 C200 24 70 22 0 8 Z');
  g.fillStyle = '#2c1d14'; g.fill(body);
  g.save(); g.clip(body); const rr = Rng.from(Math.floor(x + y), 'df');
  strokes(g, rr, 260, (q) => [q.float() * 390, -30 + q.float() * 56], ['#8a4b22', '#c27a3c', '#3b2416', '#e0a060'], { w: [1, 3], len: [4, 14], a: [0.2, 0.55] });
  g.restore();
  g.fillStyle = '#1a110c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-38, -26); g.lineTo(-20, 4); g.lineTo(-40, 30); g.closePath(); g.fill();
  for (let i = 0; i < 16; i++) glow(g, 40 + i * 17, 14 - Math.sin(i / 4) * 2, 2.4, '#9fd8ff', 10);
  g.fillStyle = '#120b07'; g.beginPath(); g.moveTo(330, 4); g.lineTo(392, 16); g.lineTo(330, 22); g.closePath(); g.fill();
  fangs(g, 336, 6, 386, 14, 7, 12, false, r); fangs(g, 336, 22, 384, 17, 6, 10, true, r);
  eye(g, 352, -4, 8, '#e3b24a');
  lure(g, 360, 22, 300 + r.int(80), 140 + r.int(40));
  g.restore();
}
/** Round, black, needle-toothed angler with a glowing lure. */
export function angler(g: G, r: Rng, x: number, y: number, s: number, flip = false) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  g.fillStyle = '#17110e'; g.beginPath(); g.ellipse(0, 0, 120, 92, 0, 0, Math.PI * 2); g.fill();
  strokes(g, r, 180, (q) => { const a = q.float() * Math.PI * 2, d = q.float() * 100; return [Math.cos(a) * d, Math.sin(a) * d * 0.75]; }, ['#3a2a20', '#5a3d2a', '#241812'], { w: [1, 3], len: [5, 16], a: [0.2, 0.5] });
  g.fillStyle = '#060404'; g.beginPath(); g.moveTo(10, 10); g.quadraticCurveTo(70, 90, 130, 18); g.quadraticCurveTo(80, 40, 10, 10); g.fill();
  fangs(g, 20, 16, 126, 20, 11, 22, false, r); fangs(g, 26, 48, 110, 52, 9, 18, true, r);
  eye(g, 64, -30, 9, '#c9b26a');
  const lx = 120 + r.int(40), ly = -150 - r.int(30);
  wash(g, lx, ly + 60, 170, '#c6ffea', 0.16);
  g.strokeStyle = 'rgba(198,255,234,0.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 120, 92, 0, -Math.PI * 0.55, Math.PI * 0.1); g.stroke();
  lure(g, 30, -82, lx, ly, '#c6ffea');
  g.fillStyle = 'rgba(30,22,18,0.9)'; g.beginPath(); g.moveTo(-110, -10); g.lineTo(-190, -60); g.lineTo(-170, 0); g.lineTo(-190, 60); g.closePath(); g.fill();
  g.restore();
}
/** Gulper eel: an impossibly large mouth on a whip of a body. */
export function gulper(g: G, r: Rng, x: number, y: number, s: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#120d0b'; g.lineWidth = 10; g.beginPath(); g.moveTo(40, 0); g.bezierCurveTo(140, -80, 220, 90, 360, -20); g.stroke();
  glow(g, 362, -20, 3, '#ff5f9e', 18);
  g.fillStyle = '#100b0a'; g.beginPath(); g.moveTo(40, -10); g.quadraticCurveTo(-120, -150, -150, 0); g.quadraticCurveTo(-120, 150, 40, 10); g.closePath(); g.fill();
  g.fillStyle = '#030202'; g.beginPath(); g.ellipse(-80, 0, 58, 90, 0, 0, Math.PI * 2); g.fill();
  fangs(g, -132, -40, -40, -70, 10, 10, false, r);
  g.strokeStyle = 'rgba(200,170,140,0.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(-80, 0, 58, 90, 0, 0, Math.PI * 2); g.stroke();
  eye(g, 20, -16, 4, '#9cc6d9');
  g.restore();
}
export function jelly(g: G, r: Rng, x: number, y: number, s: number, col = '#f2b8d0') {
  g.save(); g.translate(x, y); g.scale(s, s);
  const gr = g.createRadialGradient(0, -10, 2, 0, 0, 50); gr.addColorStop(0, rgba(col, 0.55)); gr.addColorStop(1, rgba(col, 0.04));
  g.fillStyle = gr; g.beginPath(); g.moveTo(-48, 0); g.bezierCurveTo(-46, -64, 46, -64, 48, 0); g.quadraticCurveTo(0, 12, -48, 0); g.fill();
  g.strokeStyle = rgba(col, 0.35); g.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) { const tx = -40 + i * 10; g.beginPath(); g.moveTo(tx, 2); g.bezierCurveTo(tx + 10 * Math.sin(i), 60, tx - 12, 110, tx + r.int(16) - 8, 150 + r.int(60)); g.stroke(); }
  glow(g, 0, -18, 3, rgba(col, 0.9), 20);
  g.restore();
}
/** The bathysphere: steel sphere, portholes, a searchlight. */
export function bathysphere(g: G, x: number, y: number, s: number, lightAng = Math.PI) {
  beam(g, x - 70 * s, y + 4 * s, lightAng, 0.32, 760, '#f3f1b0', 0.42);
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = 'rgba(200,200,200,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -110); g.lineTo(0, -900); g.moveTo(20, -100); g.lineTo(60, -900); g.stroke();
  const gr = g.createRadialGradient(-30, -30, 10, 0, 0, 110); gr.addColorStop(0, '#3c5f9a'); gr.addColorStop(0.7, '#1c2f5a'); gr.addColorStop(1, '#0b1428');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 100, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#152140'; g.fillRect(-14, -126, 28, 30);
  for (const [px, py] of [[-62, 2], [-12, 6], [38, 6]]) {
    g.fillStyle = '#26324a'; g.beginPath(); g.arc(px, py, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0a0f18'; g.beginPath(); g.arc(px, py, 13, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.fillStyle = '#7a8aa0'; g.fillRect(px + Math.cos(a) * 18 - 1, py + Math.sin(a) * 18 - 1, 2.4, 2.4); }
  }
  glow(g, -62, 2, 12, 'rgba(250,245,200,0.9)', 30);
  g.fillStyle = '#16213a'; g.fillRect(-70, 92, 140, 14); g.fillRect(-60, 106, 10, 22); g.fillRect(50, 106, 10, 22);
  g.restore();
}
/** Recursive, tapering, slightly crooked branches — dead swamp trees and forest snags. */
function branch(g: G, r: Rng, x: number, y: number, ang: number, len: number, w: number, col: string, depth: number) {
  if (depth > 5 || w < 0.8) return;
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r.float() - 0.5) * len * 0.3, (y + y2) / 2, x2, y2); g.stroke();
  const n = depth === 0 ? 3 : 2;
  for (let i = 0; i < n; i++) branch(g, r, x2, y2, ang + (r.float() - 0.5) * 1.3, len * (0.62 + r.float() * 0.2), w * 0.62, col, depth + 1);
}
function tubeField(g: G, r: Rng, x0: number, w: number, n: number) {
  for (let i = 0; i < n; i++) {
    const x = x0 + r.float() * w, h = 40 + r.float() * 140, bend = (r.float() - 0.5) * 50, tw = 4 + r.float() * 5;
    g.strokeStyle = `rgba(${200 + r.int(40)},${190 + r.int(30)},${170 + r.int(30)},0.85)`; g.lineWidth = tw; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, PH + 4); g.quadraticCurveTo(x + bend / 2, PH - h / 2, x + bend, PH - h); g.stroke();
    const px = x + bend, py = PH - h;
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.28; g.strokeStyle = `rgba(${190 + r.int(50)},30,40,0.85)`; g.lineWidth = 2.4; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * (8 + tw * 2), py + Math.sin(a) * (8 + tw * 2)); g.stroke(); }
    glow(g, px, py - 6, tw * 0.8, 'rgba(220,40,50,0.55)', 14);
  }
}
function silhouettePerson(g: G, x: number, y: number, s: number, coat: string, rim = '#f0c27a', hat = false) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const body = new Path2D('M-30 0 L-24 -70 C-30 -100 -36 -118 -20 -128 C-10 -134 10 -134 20 -128 C36 -118 30 -100 24 -70 L30 0 L8 0 L4 -50 L-4 -50 L-8 0 Z');
  g.fillStyle = coat; g.fill(body);
  g.beginPath(); g.ellipse(0, -150, 17, 20, 0, 0, Math.PI * 2); g.fill();
  if (hat) { g.beginPath(); g.ellipse(0, -164, 40, 8, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(0, -172, 20, 12, 0, Math.PI, 0); g.fill(); }
  g.save(); g.clip(body); wash(g, 34, -90, 50, rim, 0.35); g.restore();
  wash(g, 20, -154, 20, rim, 0.25);
  g.restore();
}
function eyesInDark(g: G, x: number, y: number, s = 1, col = '#ffd36b') { glow(g, x, y, 5 * s, col, 20); glow(g, x + 26 * s, y, 5 * s, col, 20); g.fillStyle = '#000'; g.fillRect(x - 1, y - 4 * s, 2, 8 * s); g.fillRect(x + 26 * s - 1, y - 4 * s, 2, 8 * s); }
function glass(g: G, x: number, y: number, h: number, col: string) {
  g.fillStyle = rgba(col, 0.28); g.beginPath(); g.moveTo(x - 10, y - h); g.lineTo(x - 10, y - h * 0.45); g.lineTo(x - 30, y); g.lineTo(x + 30, y); g.lineTo(x + 10, y - h * 0.45); g.lineTo(x + 10, y - h); g.closePath(); g.fill();
  g.fillStyle = rgba(col, 0.7); g.beginPath(); g.moveTo(x - 22, y - 14); g.lineTo(x + 22, y - 14); g.lineTo(x + 30, y); g.lineTo(x - 30, y); g.fill();
  glow(g, x, y - 10, 6, rgba(col, 0.5), 30);
}

// ───────────────────────── biomes ─────────────────────────
const UNDERWATER = new Set<BiomeId>(['reef', 'seagrass', 'twilight', 'midnight', 'vents', 'trench']);
const DEEP = new Set<BiomeId>(['twilight', 'midnight', 'vents', 'trench']);

const BIOME: Record<BiomeId, (g: G, r: Rng) => void> = {
  lab: (g, r) => {
    vgrad(g, [[0, '#0d1716'], [1, '#05090a']]);
    g.fillStyle = '#0e1f2a'; g.fillRect(820, 60, 330, 230); wash(g, 990, 170, 220, '#5f84a8', 0.25); glow(g, 1060, 120, 26, 'rgba(235,240,220,0.9)', 50);
    particles(g, r, 40, '#cfe0ff', [830, 70, 310, 210], [0.4, 1.4]);
    wash(g, 420, 430, 420, '#e8a854', 0.35);
    g.fillStyle = '#1b130d'; g.fillRect(0, 470, PW, 260); strokes(g, r, 500, (q) => [q.float() * PW, 470 + q.float() * 250], ['#3a2618', '#24170f', '#4a321f'], { ang: 0, jit: 0.2, len: [30, 90] });
    [[180, '#7fd6c2'], [300, '#e37aa0'], [470, '#d9c86b'], [640, '#8fb7f0']].forEach(([x, c]) => glass(g, x as number, 470, 120 + r.int(60), c as string));
    strokes(g, r, 300, (q) => [q.float() * PW, q.float() * 460], ['#1f3433', '#152625'], { a: [0.05, 0.15], len: [20, 60] });
  },
  forest: (g, r) => {
    vgrad(g, [[0, '#1d3b35'], [0.55, '#2f5a45'], [1, '#0b1a12']]);
    wash(g, 900, 120, 420, '#d6e6b0', 0.35);
    for (let i = 0; i < 7; i++) beam(g, 860 + i * 30, -20, Math.PI * 0.62 + i * 0.03, 0.04, 900, '#f1f3c8', 0.07);
    for (let layer = 0; layer < 3; layer++) {
      const col = ['#2b4d3f', '#1b3328', '#0b1610'][layer];
      for (let i = 0; i < 9 - layer * 2; i++) {
        const x = r.float() * PW, w = 18 + layer * 18 + r.int(16);
        g.fillStyle = col; g.fillRect(x, 0, w, PH);
        strokes(g, r, 40, (q) => [x + q.float() * w, q.float() * PH], [col, '#3d6a50', '#0c1a12'], { ang: Math.PI / 2, jit: 0.15, len: [20, 60], a: [0.1, 0.35] });
      }
      if (layer === 1) wash(g, PW / 2, PH * 0.75, 700, '#9fb98a', 0.12);
    }
    const p = ridge(g, r, 640, 40, '#08120c', 0.6, 30); edgeStrokes(g, r, p, ['#2e5a36', '#1a3a22', '#4a7a3e']);
    for (let i = 0; i < 40; i++) glow(g, r.float() * PW, 300 + r.float() * 380, 1.6, 'rgba(230,255,160,0.9)', 14);
  },
  desert: (g, r) => {
    vgrad(g, [[0, '#251a3a'], [0.45, '#8a4a52'], [0.7, '#e09a5f'], [1, '#5a2f22']]);
    particles(g, r, 120, '#ffffff', [0, 0, PW, 260], [0.4, 1.2], [0.2, 0.7]);
    glow(g, 300, 150, 34, 'rgba(255,240,215,0.95)', 60);
    const cols = ['#b8724a', '#9a5a3c', '#6e3d2c', '#40231a'];
    cols.forEach((c, i) => { const p = ridge(g, r, 420 + i * 70, 70 - i * 10, c, 0.25, 40); edgeStrokes(g, r, p, ['#e8b07a', '#c0855a', c], 120); });
    strokes(g, r, 300, (q) => [q.float() * PW, 520 + q.float() * 200], ['#2a160f', '#5a3324', '#7a4a32'], { ang: -0.05, jit: 0.15, len: [60, 160], w: [4, 10], a: [0.05, 0.12] });
  },
  mountain: (g, r) => {
    vgrad(g, [[0, '#13243d'], [0.6, '#5a7090'], [1, '#c9d2dc']]);
    wash(g, 980, 260, 380, '#f6d7b0', 0.35);
    const cols = ['#7d8ea3', '#56677d', '#344255', '#1b2433'];
    cols.forEach((c, i) => { range(g, r, 380 + i * 95, 260 - i * 50, c, i < 2 ? 'rgba(240,244,248,0.85)' : undefined); if (i < 3) wash(g, PW / 2, 420 + i * 95, 700, '#c9d3de', 0.12); });
    for (let i = 0; i < 3; i++) wash(g, r.float() * PW, 420 + i * 70, 500, '#d6dde6', 0.14);
  },
  cave: (g, r) => {
    vgrad(g, [[0, '#07060d'], [1, '#120d1e']]);
    wash(g, 640, 520, 420, '#3a7f9a', 0.25);
    for (let i = 0; i < 14; i++) { const x = r.float() * PW, h = 80 + r.float() * 220, w = 30 + r.float() * 50; g.fillStyle = '#0b0912'; g.beginPath(); g.moveTo(x - w, -10); g.lineTo(x + w, -10); g.lineTo(x + r.float() * 6, h); g.closePath(); g.fill(); }
    const cols = ['#7fe6ff', '#c79bff', '#7affd2'];
    for (let i = 0; i < 9; i++) { const x = 120 + r.float() * 1040, y = 520 + r.float() * 120, h = 40 + r.float() * 110, c = r.pick(cols); g.save(); g.shadowColor = c; g.shadowBlur = 30; g.fillStyle = rgba(c, 0.55); g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + 16, y); g.lineTo(x - 16, y); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = 'rgba(70,170,210,0.28)'; g.beginPath(); g.ellipse(640, 640, 380, 34, 0, 0, Math.PI * 2); g.fill();
    particles(g, r, 80, '#b9f0ff', [0, 0, PW, PH], [0.4, 1.4], [0.1, 0.5]);
  },
  snow: (g, r) => {
    vgrad(g, [[0, '#050b1e'], [0.6, '#16305a'], [1, '#7d93b8']]);
    particles(g, r, 260, '#ffffff', [0, 0, PW, 380], [0.3, 1.2], [0.2, 0.9]);
    for (let k = 0; k < 3; k++) { const c = ['#53f5b0', '#7d6bff', '#4fe0e6'][k]; strokes(g, r, 380, (q) => { const x = q.float() * PW; return [x, 60 + k * 40 + Math.sin(x / 140 + k) * 50 + q.float() * 30]; }, [c], { ang: Math.PI / 2, jit: 0.1, len: [40, 140], w: [3, 9], a: [0.03, 0.12] }); }
    range(g, r, 470, 230, '#7186a8', 'rgba(235,242,255,0.9)');
    const p2 = ridge(g, r, 560, 50, '#d9e3f2', 0.4, 50); edgeStrokes(g, r, p2, ['#ffffff', '#b3c4dd']);
    particles(g, r, 300, '#ffffff', [0, 0, PW, PH], [0.8, 2.6], [0.4, 0.9]);
  },
  swamp: (g, r) => {
    vgrad(g, [[0, '#1d2418'], [0.55, '#4a5636'], [1, '#121509']]);
    wash(g, 640, 360, 620, '#a9b67a', 0.18);
    for (let i = 0; i < 7; i++) { const x = r.float() * PW, near = i > 4; branch(g, r, x, 600, -Math.PI / 2 + (r.float() - 0.5) * 0.2, near ? 120 : 80 + r.int(40), near ? 16 : 9, near ? '#0b0e07' : '#1c2214', 0); }
    for (let i = 0; i < 3; i++) wash(g, r.float() * PW, 480, 600, '#c9d6a6', 0.12);
    g.fillStyle = '#0e1308'; g.fillRect(0, 560, PW, 160);
    strokes(g, r, 400, (q) => [q.float() * PW, 560 + q.float() * 160], ['#3e4a2a', '#5d6e3a', '#1c2412'], { ang: 0, jit: 0.15, len: [30, 100], a: [0.1, 0.3] });
    strokes(g, r, 220, (q) => [q.float() * PW, 560 + q.float() * 20], ['#4d6033', '#2c3a1d'], { ang: -Math.PI / 2, jit: 0.3, len: [40, 110], w: [2, 4], a: [0.4, 0.8] });
    for (let i = 0; i < 6; i++) glow(g, 100 + r.float() * 1080, 300 + r.float() * 200, 5, 'rgba(220,255,160,0.85)', 30);
  },
  ruins: (g, r) => {
    vgrad(g, [[0, '#1b2a2c'], [0.6, '#3c5150'], [1, '#101716']]);
    wash(g, 420, 200, 380, '#c8d8cc', 0.18);
    g.fillStyle = '#121a1a'; g.fillRect(330, 190, 620, 360); g.beginPath(); g.moveTo(330, 190); g.lineTo(520, 140); g.lineTo(700, 200); g.lineTo(950, 170); g.lineTo(950, 190); g.closePath(); g.fill();
    for (let i = 0; i < 8; i++) { const x = 370 + i * 72; g.fillStyle = i === 5 ? 'rgba(170,240,210,0.7)' : '#070b0b'; g.fillRect(x, 260, 44, 60); if (i === 5) glow(g, x + 22, 290, 18, 'rgba(160,255,210,0.5)', 60); }
    strokes(g, r, 500, (q) => [330 + q.float() * 620, 140 + q.float() * 420], ['#2e4d2a', '#45703a', '#1d3319'], { ang: Math.PI / 2, jit: 0.6, len: [20, 70], w: [2, 5], a: [0.25, 0.6] });
    const p = ridge(g, r, 600, 30, '#0a0f0d', 0.6); edgeStrokes(g, r, p, ['#2a3d2a', '#3b5636']);
  },
  reef: (g, r) => {
    vgrad(g, [[0, '#3ab1c4'], [0.5, '#137a8c'], [1, '#063440']]);
    for (let i = 0; i < 8; i++) beam(g, 300 + i * 110, -30, Math.PI * 0.5 + (i - 4) * 0.06, 0.05, 820, '#e8ffff', 0.08);
    const cols = ['#ff8a70', '#f4c25a', '#d46aa8', '#6fd0a0', '#ff6b6b'];
    for (let i = 0; i < 18; i++) { const x = r.float() * PW, y = 560 + r.float() * 140, s = 30 + r.float() * 70, c = r.pick(cols); strokes(g, r, 50, (q) => [x + (q.float() - 0.5) * s, y - q.float() * s], [c, '#ffffff'], { ang: -Math.PI / 2, jit: 1, len: [10, 30], w: [3, 8], a: [0.3, 0.7] }); }
    for (let k = 0; k < 3; k++) { const cx = 200 + r.float() * 880, cy = 180 + r.float() * 260; for (let i = 0; i < 26; i++) { const x = cx + (r.float() - 0.5) * 180, y = cy + (r.float() - 0.5) * 70; g.fillStyle = rgba(r.pick(['#ffe27a', '#bfe9ff', '#ff9d7a']), 0.85); g.beginPath(); g.ellipse(x, y, 9, 4, 0, 0, Math.PI * 2); g.fill(); } }
    particles(g, r, 120, '#e8ffff', [0, 0, PW, PH], [0.5, 1.6], [0.1, 0.4]);
  },
  mudflat: (g, r) => {
    vgrad(g, [[0, '#2a2440'], [0.4, '#b0707a'], [0.55, '#f0b88a'], [0.56, '#7a6a64'], [1, '#2b221e']]);
    glow(g, 900, 330, 30, 'rgba(255,220,180,0.9)', 50);
    strokes(g, r, 700, (q) => [q.float() * PW, 400 + q.float() * 320], ['#5a4a42', '#8a7466', '#c7a08a', '#3a2e28'], { ang: 0, jit: 0.1, len: [40, 140], w: [2, 6], a: [0.1, 0.35] });
    for (let i = 0; i < 9; i++) { const x = r.float() * PW, y = 430 + r.float() * 250; g.fillStyle = 'rgba(240,190,150,0.35)'; g.beginPath(); g.ellipse(x, y, 60 + r.int(80), 6, 0, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 6; i++) { const x = 200 + r.float() * 900, y = 120 + r.float() * 140; g.strokeStyle = '#1a1420'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 14, y); g.quadraticCurveTo(x - 6, y - 8, x, y); g.quadraticCurveTo(x + 6, y - 8, x + 14, y); g.stroke(); }
  },
  seagrass: (g, r) => {
    vgrad(g, [[0, '#5fc4b4'], [0.5, '#1f8a78'], [1, '#08362f']]);
    for (let i = 0; i < 6; i++) beam(g, 380 + i * 110, -20, Math.PI * 0.5 + (i - 3) * 0.07, 0.05, 760, '#f2fff0', 0.09);
    for (let i = 0; i < 260; i++) { const x = r.float() * PW, h = 120 + r.float() * 260, lean = (r.float() - 0.3) * 60; g.strokeStyle = rgba(r.pick(['#2e7d4a', '#4caf6a', '#1b5e3a', '#7cc68a']), 0.35 + r.float() * 0.5); g.lineWidth = 2 + r.float() * 4; g.beginPath(); g.moveTo(x, PH); g.quadraticCurveTo(x + lean, PH - h / 2, x + lean * 1.6, PH - h); g.stroke(); }
    particles(g, r, 90, '#efffef', [0, 0, PW, PH], [0.5, 1.5], [0.1, 0.4]);
  },
  openSea: (g, r) => {
    vgrad(g, [[0, '#070d1c'], [0.5, '#1d2c4a'], [0.52, '#0c1830'], [1, '#04070f']]);
    particles(g, r, 200, '#ffffff', [0, 0, PW, 340], [0.3, 1.1], [0.2, 0.9]);
    glow(g, 260, 120, 26, 'rgba(245,240,220,0.95)', 50);
    strokes(g, r, 900, (q) => [q.float() * PW, 375 + q.float() * 345], ['#1c3358', '#2a4a78', '#0e1d38', '#3d5f8a'], { ang: 0, jit: 0.1, len: [30, 120], w: [1, 4], a: [0.15, 0.5] });
    strokes(g, r, 160, (q) => [230 + (q.float() - 0.5) * 120, 380 + q.float() * 320], ['#e8e6d0'], { ang: 0, jit: 0.1, len: [10, 50], w: [1, 3], a: [0.15, 0.45] });
  },
  twilight: (g, r) => {
    vgrad(g, [[0, '#123a6b'], [0.5, '#0a1f42'], [1, '#02060f']]);
    for (let i = 0; i < 5; i++) beam(g, 520 + i * 60, -40, Math.PI * 0.5 + (i - 2) * 0.05, 0.04, 600, '#a9d4ff', 0.05);
    particles(g, r, 260, '#cfe6ff', [0, 0, PW, PH], [0.4, 1.4], [0.1, 0.5]);
    for (let i = 0; i < 70; i++) { const x = r.float() * PW, y = 120 + r.float() * 520; g.fillStyle = 'rgba(60,80,120,0.6)'; g.beginPath(); g.ellipse(x, y, 10, 3.5, 0, 0, Math.PI * 2); g.fill(); glow(g, x - 4, y + 2, 1.2, '#9fe0ff', 8); }
  },
  midnight: (g, r) => {
    vgrad(g, [[0, '#04060c'], [1, '#000000']]);
    particles(g, r, 420, '#d9d4c8', [0, 0, PW, PH], [0.3, 1.3], [0.08, 0.45]);
    for (let i = 0; i < 26; i++) glow(g, r.float() * PW, r.float() * PH, 1.6 + r.float() * 1.6, r.pick(['#5ff2ff', '#b6ff6b', '#ff7ad9', '#7aa8ff']), 16);
  },
  vents: (g, r) => {
    vgrad(g, [[0, '#050608'], [0.7, '#140b08'], [1, '#2a120a']]);
    for (const [x, h] of [[300, 330], [640, 420], [960, 300]]) {
      wash(g, x, PH - h, 260, '#ff7a2e', 0.18);
      g.fillStyle = '#1a120e'; g.beginPath(); g.moveTo(x - 70, PH); g.lineTo(x - 26, PH - h); g.lineTo(x + 26, PH - h); g.lineTo(x + 70, PH); g.closePath(); g.fill();
      strokes(g, r, 120, (q) => [x + (q.float() - 0.5) * 100, PH - q.float() * h], ['#3e2a1e', '#5a3a26', '#0e0a08'], { ang: Math.PI / 2, jit: 0.4, len: [10, 30], a: [0.3, 0.6] });
      for (let k = 0; k < 22; k++) { const sx = x + Math.sin(k * 0.7) * k * 4 + (r.float() - 0.5) * k * 6, sy = PH - h - k * 24; wash(g, sx, sy, 30 + k * 6, '#0d0a09', 0.55); wash(g, sx, sy + 10, 20 + k * 3, '#ff7a2e', 0.04); }
      glow(g, x, PH - h + 4, 6, 'rgba(255,140,60,0.9)', 30);
    }
    tubeField(g, r, 120, 1080, 34);
    particles(g, r, 120, '#ffb07a', [0, 0, PW, PH], [0.4, 1.2], [0.1, 0.4]);
  },
  trench: (g, r) => {
    vgrad(g, [[0, '#020306'], [1, '#000000']]);
    g.fillStyle = '#0a0d14'; g.beginPath(); g.moveTo(0, 0); g.lineTo(260, 0); g.lineTo(200, PH); g.lineTo(0, PH); g.fill(); g.beginPath(); g.moveTo(PW, 0); g.lineTo(1000, 0); g.lineTo(1080, PH); g.lineTo(PW, PH); g.fill();
    strokes(g, r, 300, (q) => (q.chance(0.5) ? [q.float() * 250, q.float() * PH] : [1010 + q.float() * 270, q.float() * PH]), ['#1a2232', '#0e1420', '#283246'], { ang: Math.PI / 2, jit: 0.5, len: [20, 70], a: [0.2, 0.5] });
    particles(g, r, 260, '#bfc6d0', [0, 0, PW, PH], [0.3, 1.1], [0.05, 0.35]);
  },
};

// ───────────────────────── props (event art) ─────────────────────────
type PropFn = (g: G, r: Rng, biome: BiomeId) => void;
const none: PropFn = () => {};
/** Props drawn as part of their biome (kept for the content tests' integrity check). */
export const INTEGRATED = new Set(['trees', 'dunes', 'peaks', 'stalactites', 'reeds', 'ice', 'coral', 'seagrass', 'fish', 'mud', 'snow', 'lab-ruins', 'lab', 'aurora', 'vines', 'lanternfish', 'smokers', 'crystals', 'mushrooms', 'clone']);

export const PAINT_PROPS: Record<string, PropFn> = {
  ...Object.fromEntries([...INTEGRATED].map((k) => [k, none])),
  obstacle: (g, r, b) => { if (UNDERWATER.has(b)) { wash(g, 900, 380, 300, '#000000', 0.6); return; } const p = ridge(g, r, 560, 160, '#0b0907', 1.2, 26, true); edgeStrokes(g, r, p, ['#4a3a2a', '#2a2018']); },
  predator: (g, r, b) => {
    if (DEEP.has(b)) { r.chance(0.5) ? dragonfish(g, r, 1240, 300, 1.2, true, -0.15) : angler(g, r, 950, 380, 1.1, true); return; }
    if (UNDERWATER.has(b)) { g.fillStyle = 'rgba(20,30,40,0.85)'; g.beginPath(); g.moveTo(700, 300); g.quadraticCurveTo(900, 240, 1150, 300); g.quadraticCurveTo(900, 340, 700, 300); g.fill(); g.beginPath(); g.moveTo(920, 270); g.lineTo(950, 200); g.lineTo(990, 275); g.fill(); return; }
    wash(g, 960, 420, 260, '#000000', 0.7); eyesInDark(g, 930, 420, 1.3);
  },
  critter: (g, r) => { wash(g, 900, 560, 140, '#f2e3b0', 0.35); g.fillStyle = 'rgba(30,22,16,0.9)'; g.beginPath(); g.ellipse(900, 580, 30, 20, 0, 0, Math.PI * 2); g.fill(); glow(g, 916, 572, 2.6, 'rgba(255,240,200,0.95)', 10); },
  clue: (g, r) => { wash(g, 860, 600, 200, '#e8c27a', 0.3); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(15,10,8,0.7)'; g.beginPath(); g.ellipse(700 + i * 60, 620 - i * 12, 10, 16, 0.4, 0, Math.PI * 2); g.fill(); } g.save(); g.translate(960, 560); g.rotate(-0.2); g.fillStyle = 'rgba(240,230,200,0.9)'; g.fillRect(0, 0, 70, 44); g.restore(); },
  heatwave: (g, r) => { wash(g, PW / 2, 200, 700, '#ffcf8a', 0.3); strokes(g, r, 160, (q) => [q.float() * PW, 200 + q.float() * 300], ['#fff1d0'], { ang: -Math.PI / 2, jit: 0.8, len: [20, 60], a: [0.04, 0.12] }); },
  blizzard: (g, r) => strokes(g, r, 700, (q) => [q.float() * PW, q.float() * PH], ['#ffffff', '#dfe8f5'], { ang: 0.35, jit: 0.15, len: [20, 70], w: [1, 3], a: [0.15, 0.5] }),
  darkness: (g) => { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, PW, PH); },
  mud: none,
  pressure: (g, r) => { for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(150,200,255,${0.06 + i * 0.03})`; g.lineWidth = 2; g.beginPath(); g.arc(PW / 2, PH / 2, 300 + i * 90, 0, Math.PI * 2); g.stroke(); } wash(g, PW / 2, PH / 2, 600, '#000000', 0.25); },
  radio: (g, r) => { g.fillStyle = '#2a1a10'; g.fillRect(860, 380, 170, 96); wash(g, 945, 420, 140, '#f0b060', 0.3); g.fillStyle = '#e8c070'; g.fillRect(950, 400, 60, 14); glow(g, 900, 430, 18, 'rgba(120,90,60,0.9)', 4); g.strokeStyle = '#c8b090'; g.lineWidth = 2; g.beginPath(); g.moveTo(1010, 380); g.lineTo(1060, 280); g.stroke(); },
  postcard: (g) => { g.save(); g.translate(900, 410); g.rotate(0.12); g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 160, 104); g.strokeStyle = '#a8432f'; g.setLineDash([6, 5]); g.lineWidth = 3; g.beginPath(); g.moveTo(20, 30); g.bezierCurveTo(60, 80, 100, 10, 140, 70); g.stroke(); g.restore(); },
  vents: (g) => { g.fillStyle = '#0a1214'; g.fillRect(900, 80, 220, 110); for (let i = 0; i < 5; i++) { g.fillStyle = '#020405'; g.fillRect(914 + i * 42, 94, 26, 82); } wash(g, 1010, 140, 160, '#7affd2', 0.12); },
  trophy: (g) => { wash(g, 960, 400, 160, '#ffd36b', 0.35); g.fillStyle = '#c9962e'; g.beginPath(); g.moveTo(910, 330); g.lineTo(1010, 330); g.quadraticCurveTo(1010, 420, 960, 430); g.quadraticCurveTo(910, 420, 910, 330); g.fill(); g.fillRect(940, 430, 40, 24); g.fillRect(920, 454, 80, 18); },
  trees: none,
  oasis: (g, r) => { g.fillStyle = 'rgba(120,190,210,0.6)'; g.beginPath(); g.ellipse(900, 560, 220, 30, 0, 0, Math.PI * 2); g.fill(); for (const x of [820, 960]) { g.strokeStyle = '#1a1208'; g.lineWidth = 10; g.beginPath(); g.moveTo(x, 560); g.quadraticCurveTo(x - 20, 440, x + 10, 360); g.stroke(); strokes(g, r, 60, () => [x + 10, 360], ['#1c2a12', '#2e4018'], { ang: 0, jit: 6, len: [40, 90], w: [3, 7], a: [0.6, 0.9] }); } },
  ibex: (g) => {
    for (const [x, y, s] of [[860, 330, 1], [990, 300, 0.85]] as const) {
      g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#0d0f14'; g.strokeStyle = '#0d0f14';
      g.fill(new Path2D('M-46 0 C-44 -22 20 -26 34 -14 L48 -38 C52 -44 62 -44 64 -36 L58 -20 C56 -10 46 -6 40 2 C30 10 -30 12 -46 0 Z'));
      g.lineWidth = 4; g.lineCap = 'round';
      for (const lx of [-38, -26, 22, 32]) { g.beginPath(); g.moveTo(lx, 4); g.lineTo(lx + (lx < 0 ? -2 : 2), 44); g.stroke(); }
      g.lineWidth = 5; g.beginPath(); g.moveTo(54, -42); g.bezierCurveTo(50, -80, 10, -84, 4, -58); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(-46, -4); g.lineTo(-54, -12); g.stroke();
      g.restore();
    }
  },
  wisps: (g, r) => { for (let i = 0; i < 7; i++) glow(g, 150 + r.float() * 980, 220 + r.float() * 240, 6, 'rgba(210,255,150,0.9)', 40); },
  ranger: (g) => silhouettePerson(g, 1000, 640, 1.4, '#14180f', '#f0c27a', true),
  rival: (g) => { silhouettePerson(g, 1000, 640, 1.45, '#0c0c0f', '#cfe3ff'); glow(g, 1140, 200, 4, 'rgba(255,60,60,0.9)', 16); },
  hermit: (g, r) => { silhouettePerson(g, 990, 640, 1.35, '#1a120c', '#ffb36b'); for (let i = 0; i < 14; i++) glow(g, 900 + r.float() * 260, 220 + r.float() * 200, 2.2, 'rgba(255,210,90,0.95)', 10); },
  bees: (g, r) => { for (let i = 0; i < 18; i++) glow(g, 820 + r.float() * 380, 200 + r.float() * 260, 2.2, 'rgba(255,210,90,0.95)', 10); },
  kid: (g) => silhouettePerson(g, 1000, 640, 1.0, '#101418', '#ffd9a0'),
  basma: (g) => { wash(g, 1000, 420, 260, '#f2e6d0', 0.25); silhouettePerson(g, 1000, 640, 1.45, '#d8d0c0', '#ffe9b0'); },
  chip: (g) => { glow(g, 640, 360, 10, 'rgba(120,255,160,0.95)', 60); for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(120,255,160,${0.4 - i * 0.12})`; g.lineWidth = 2; g.beginPath(); g.arc(640, 360, 40 + i * 40, 0, Math.PI * 2); g.stroke(); } },
  escapees: (g, r) => { for (let i = 0; i < 30; i++) glow(g, 600 + r.float() * 600, 520 + r.float() * 160, 2 + r.float() * 3, 'rgba(180,255,120,0.85)', 20); },
  villagers: (g) => { [880, 980, 1080].forEach((x, i) => silhouettePerson(g, x, 640, 0.9 + i * 0.08, '#120d0a', '#ffb070')); },
  disaster: (g, r) => { for (let i = 0; i < 14; i++) { const x = r.float() * PW, y = r.float() * 400; g.fillStyle = 'rgba(20,14,10,0.9)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y + 10); g.lineTo(x + 20, y + 40); g.lineTo(x - 10, y + 30); g.fill(); } strokes(g, r, 400, (q) => [q.float() * PW, q.float() * PH], ['#5a4a3a', '#2a2018'], { ang: Math.PI / 2, jit: 0.3, len: [20, 80], a: [0.05, 0.18] }); },
  cage: (g) => { g.strokeStyle = 'rgba(190,200,210,0.75)'; g.lineWidth = 5; g.strokeRect(860, 340, 240, 220); for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(860 + i * 30, 340); g.lineTo(860 + i * 30, 560); g.stroke(); } },
  machine: (g, r) => {
    wash(g, 970, 340, 320, '#5ff2ff', 0.22);
    g.strokeStyle = '#0a1012'; g.lineWidth = 34; g.beginPath(); g.arc(970, 340, 150, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(150,255,255,0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(970, 340, 134, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; glow(g, 970 + Math.cos(a) * 150, 340 + Math.sin(a) * 150, 3, 'rgba(140,255,240,0.9)', 14); }
    const gr = g.createRadialGradient(970, 340, 10, 970, 340, 130); gr.addColorStop(0, 'rgba(200,255,255,0.75)'); gr.addColorStop(0.5, 'rgba(60,200,220,0.25)'); gr.addColorStop(1, 'rgba(0,40,50,0.05)');
    g.fillStyle = gr; g.beginPath(); g.arc(970, 340, 130, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 7; i++) { g.strokeStyle = '#070b0c'; g.lineWidth = 5 + r.int(5); g.beginPath(); g.moveTo(860 + i * 40, 470); g.bezierCurveTo(840 + i * 50, 600, 700 + i * 80, 640, 640 + i * 110, PH + 10); g.stroke(); }
  },
  boat: (g) => { g.fillStyle = '#e8e2d4'; g.beginPath(); g.moveTo(820, 420); g.lineTo(1150, 420); g.lineTo(1100, 470); g.lineTo(860, 470); g.closePath(); g.fill(); glow(g, 1120, 410, 5, 'rgba(255,230,160,0.95)', 30); },
  hydrophone: (g) => { g.strokeStyle = 'rgba(200,200,200,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(980, 0); g.lineTo(980, 360); g.stroke(); glow(g, 980, 370, 12, 'rgba(255,220,120,0.95)', 30); for (let i = 1; i < 5; i++) { g.strokeStyle = `rgba(255,220,120,${0.35 - i * 0.06})`; g.beginPath(); g.arc(980, 370, i * 46, 0, Math.PI * 2); g.stroke(); } },
  net: (g, r) => { g.strokeStyle = 'rgba(220,220,210,0.35)'; g.lineWidth = 1.5; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(700 + i * 36, 60); g.bezierCurveTo(720 + i * 34, 300, 680 + i * 38, 400, 700 + i * 40, 700); g.stroke(); g.beginPath(); g.moveTo(700, 80 + i * 40); g.bezierCurveTo(900, 60 + i * 42, 1100, 100 + i * 40, 1280, 90 + i * 42); g.stroke(); } glow(g, 980, 380, 6, 'rgba(200,255,240,0.8)', 30); },
  mudskipper: (g) => { for (const x of [860, 1000]) { g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(x, 560, 36, 12, 0, 0, Math.PI * 2); g.fill(); glow(g, x + 24, 552, 3, 'rgba(255,240,200,0.9)', 8); } },
  dugong: (g) => { wash(g, 900, 330, 300, '#d8ffef', 0.15); g.fillStyle = 'rgba(70,90,95,0.85)'; g.beginPath(); g.moveTo(640, 340); g.quadraticCurveTo(880, 240, 1100, 330); g.quadraticCurveTo(880, 400, 640, 340); g.fill(); g.beginPath(); g.moveTo(1090, 330); g.lineTo(1170, 290); g.lineTo(1150, 330); g.lineTo(1170, 370); g.fill(); },
  diver: (g) => { g.fillStyle = 'rgba(10,20,25,0.9)'; g.beginPath(); g.ellipse(980, 260, 120, 26, -0.15, 0, Math.PI * 2); g.fill(); glow(g, 870, 280, 10, 'rgba(255,250,220,0.95)', 40); beam(g, 870, 280, Math.PI * 0.85, 0.18, 500, '#fffbe0', 0.25); },
  dhow: (g) => { g.fillStyle = '#1a120c'; g.beginPath(); g.moveTo(760, 400); g.lineTo(1180, 400); g.lineTo(1120, 450); g.lineTo(800, 450); g.closePath(); g.fill(); g.beginPath(); g.moveTo(960, 400); g.lineTo(960, 160); g.lineTo(1120, 380); g.closePath(); g.fill(); glow(g, 1100, 420, 4, 'rgba(255,200,120,0.95)', 30); },
  sailor: (g) => { wash(g, 1000, 440, 260, '#ffb070', 0.25); silhouettePerson(g, 1000, 640, 1.4, '#16100c', '#ffcc88'); },
  ship: (g) => { g.fillStyle = '#0a0d14'; g.beginPath(); g.moveTo(700, 380); g.lineTo(1220, 380); g.lineTo(1180, 430); g.lineTo(740, 430); g.closePath(); g.fill(); g.fillRect(850, 320, 200, 60); g.fillRect(1080, 220, 8, 160); for (let i = 0; i < 8; i++) glow(g, 860 + i * 24, 345, 2.4, 'rgba(255,220,150,0.95)', 10); g.strokeStyle = 'rgba(200,200,200,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(1084, 230); g.lineTo(1160, 380); g.lineTo(1160, 720); g.stroke(); },
  sub: (g) => bathysphere(g, 980, 330, 1.05, Math.PI * 1.08),
  jelly: (g, r) => { for (let i = 0; i < 4; i++) jelly(g, r, 150 + r.float() * 980, 120 + r.float() * 300, 0.6 + r.float() * 0.7, r.pick(['#f2b8d0', '#b8d8f2', '#d8c4ff'])); },
  angler: (g, r) => angler(g, r, 880, 380, 1.25, true),
  dragonfish: (g, r) => dragonfish(g, r, 1180, 320, 1.15, true, -0.12),
  gulper: (g, r) => gulper(g, r, 900, 380, 0.9),
  tubeworms: (g, r) => tubeField(g, r, 700, 520, 40),
  squid: (g, r) => { wash(g, 760, 330, 520, '#000000', 0.7); g.fillStyle = 'rgba(70,40,40,0.55)'; g.beginPath(); g.ellipse(760, 330, 420, 300, 0, 0, Math.PI * 2); g.fill(); strokes(g, r, 400, (q) => [400 + q.float() * 720, 80 + q.float() * 500], ['#6a3a36', '#3a201e', '#8a5048'], { w: [2, 6], len: [10, 30], a: [0.08, 0.25] }); eye(g, 760, 330, 120, '#b8b0a0'); },
  probe: (g) => { g.save(); g.translate(960, 600); g.rotate(-0.25); g.fillStyle = '#5a2a14'; g.fillRect(-90, -30, 180, 60); g.restore(); glow(g, 930, 590, 4, 'rgba(120,255,120,0.95)', 20); wash(g, 960, 600, 200, '#ffffff', 0.08); },
  whalefall: (g, r) => { g.strokeStyle = 'rgba(225,220,205,0.85)'; g.lineWidth = 12; g.beginPath(); g.moveTo(240, 620); g.lineTo(1040, 600); g.stroke(); for (let i = 0; i < 18; i++) { g.lineWidth = 7; g.beginPath(); g.moveTo(280 + i * 40, 615); g.quadraticCurveTo(270 + i * 40, 540, 300 + i * 40, 500 - Math.sin(i / 3) * 30); g.stroke(); } g.fillStyle = 'rgba(225,220,205,0.85)'; g.beginPath(); g.ellipse(1080, 590, 70, 36, 0, 0, Math.PI * 2); g.fill(); particles(g, r, 160, '#ffd9c0', [240, 480, 860, 160], [0.6, 2], [0.2, 0.6]); },
  leviathan: (g, r) => {
    // A colossal head drifting out of the black, caught at the edge of the searchlight.
    beam(g, -40, 300, -0.05, 0.22, 1100, '#e9f0c8', 0.18);
    const body = new Path2D('M1400 120 C1150 60 860 110 700 230 C600 305 560 380 610 450 C660 520 820 560 1000 580 C1150 596 1300 600 1400 640 Z');
    g.fillStyle = '#0a0e16'; g.fill(body);
    g.save(); g.clip(body);
    strokes(g, r, 900, (q) => [600 + q.float() * 800, 100 + q.float() * 520], ['#1b2638', '#101824', '#2b3a52', '#3a4a5e'], { ang: 0.15, jit: 0.5, len: [8, 26], w: [2, 5], a: [0.12, 0.4] });
    for (let i = 0; i < 26; i++) { const x = 640 + i * 30 + r.float() * 10, y = 300 + Math.sin(i / 3) * 40 + r.float() * 30; g.strokeStyle = `rgba(160,180,200,${0.03 + r.float() * 0.06})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 30, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
    wash(g, 650, 380, 260, '#e9f0c8', 0.16);
    g.restore();
    g.strokeStyle = 'rgba(230,236,200,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(700, 230); g.bezierCurveTo(600, 305, 560, 380, 610, 450); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(612, 452); g.quadraticCurveTo(760, 500, 960, 470); g.stroke();
    fangs(g, 640, 458, 940, 474, 14, 16, false, r);
    eye(g, 760, 330, 34, '#a89f78', true);
    wash(g, 760, 330, 60, '#000000', 0.35);
    g.strokeStyle = 'rgba(30,10,10,0.6)'; g.lineWidth = 6; g.beginPath(); g.ellipse(760, 330, 52, 40, 0, Math.PI * 0.9, Math.PI * 2.1); g.stroke();
    glow(g, 748, 318, 2.5, 'rgba(255,255,230,0.9)', 14);
    for (let i = 0; i < 9; i++) glow(g, 860 + i * 52, 520 + Math.sin(i) * 10, 2, 'rgba(160,230,255,0.8)', 12);
  },
  eruption: (g, r) => { for (let k = 0; k < 20; k++) wash(g, 640 + (r.float() - 0.5) * 200, 640 - k * 30, 60 + k * 8, '#ff6a2a', 0.18); strokes(g, r, 300, (q) => [640 + (q.float() - 0.5) * 300, 300 + q.float() * 420], ['#ffb070', '#ff5a20'], { ang: -Math.PI / 2, jit: 0.6, len: [10, 40], a: [0.1, 0.4] }); },
  tether: (g) => { g.strokeStyle = 'rgba(230,230,200,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(980, 0); g.bezierCurveTo(940, 120, 1060, 200, 990, 300); g.stroke(); glow(g, 990, 300, 5, 'rgba(255,240,160,0.9)', 24); },
};

/** Ambient life added to deep scenes so every dive feels inhabited by the unknown. */
function deepLife(g: G, r: Rng, biome: BiomeId, props: string[]) {
  if (!DEEP.has(biome) || props.some((p) => ['angler', 'squid', 'leviathan', 'predator', 'tubeworms', 'whalefall', 'eruption'].includes(p))) return;
  const pick = r.int(4);
  if (pick === 0) dragonfish(g, r, 80, 520, 0.7, false, -0.1);
  else if (pick === 1) jelly(g, r, 220, 200, 0.8, '#d8c4ff');
  else if (pick === 2 && biome !== 'twilight') gulper(g, r, 260, 520, 0.6);
  else for (let i = 0; i < 6; i++) eyesInDark(g, 100 + r.float() * 300, 200 + r.float() * 300, 0.5, '#9fe8ff');
}

export function paintScene(g: G, biome: BiomeId, props: string[], seed: number) {
  const r = Rng.from(seed, `paint:${biome}`);
  g.save(); g.clearRect(0, 0, PW, PH);
  BIOME[biome](g, r);
  deepLife(g, Rng.from(seed, 'life'), biome, props);
  // Props are composed around x≈900; shift them toward centre so portrait crops keep the subject.
  g.save(); g.translate(-150, 0);
  for (const p of props) PAINT_PROPS[p]?.(g, Rng.from(seed, `prop:${p}`), biome);
  g.restore();
  // finishing: paper texture, mood
  strokes(g, Rng.from(seed, 'paper'), 260, (q) => [q.float() * PW, q.float() * PH], ['#000000', '#ffffff'], { w: [20, 60], len: [60, 160], a: [0.004, 0.012], jit: 0.3 });
  vignette(g, DEEP.has(biome) || biome === 'cave' ? 0.9 : 0.6);
  grain(g, Rng.from(seed, 'grain'));
  g.restore();
}

const cache = new Map<string, string>();
/** Renders a scene to an image URL (cached). Returns null where canvas is unavailable (tests/SSR). */
export function sceneImage(biome: BiomeId, props: string[], seed: number): string | null {
  const key = `${biome}|${props.join(',')}|${seed}`;
  const hit = cache.get(key); if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
  const g = cv.getContext('2d'); if (!g) return null;
  try { paintScene(g, biome, props, seed); } catch { return null; }
  const url = cv.toDataURL('image/jpeg', 0.86);
  if (cache.size > 40) cache.delete(cache.keys().next().value!);
  cache.set(key, url);
  return url;
}
