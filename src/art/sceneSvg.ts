// Procedural vector scene art: every biome has 4 parallax layers, and every beat prop has a drawing.
import { Rng } from '../engine/rng';
import type { BiomeId } from '../engine/types';

export const W = 800, H = 450;
const INK = '#20170f';
const a = (tag: string, attrs: Record<string, string | number>, inner = '') => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}${inner ? `>${inner}</${tag}>` : '/>'}`;
const p = (d: string, fill: string, extra: Record<string, string | number> = {}) => a('path', { d, fill, ...extra });
const c = (cx: number, cy: number, r: number, fill: string, extra: Record<string, string | number> = {}) => a('circle', { cx, cy, r, fill, ...extra });
const rect = (x: number, y: number, w: number, h: number, fill: string, extra: Record<string, string | number> = {}) => a('rect', { x, y, width: w, height: h, fill, ...extra });
const ol = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' };

export interface SceneLayers { sky: string; far: string; mid: string; near: string; props: string; underwater: boolean; dark: boolean }

function grad(id: string, stops: string[]): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((s, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="${s}"/>`).join('')}</linearGradient></defs>`;
}
function hills(r: Rng, base: number, amp: number, fill: string, n = 6, extra: Record<string, string | number> = {}) {
  let d = `M-60 ${H} L-60 ${base}`; const step = (W + 120) / n;
  for (let i = 0; i <= n; i++) { const x = -60 + i * step; d += ` Q${x + step / 2} ${base - amp * (0.4 + r.float() * 0.8)} ${x + step} ${base}`; }
  return p(d + ` L${W + 60} ${H} Z`, fill, extra);
}
function peaks(r: Rng, base: number, h: number, fill: string, cap?: string) {
  let s = ''; for (let i = 0; i < 6; i++) { const x = -40 + i * 160 + r.int(40); const ph = h * (0.6 + r.float() * 0.5); s += p(`M${x - 120} ${base} L${x} ${base - ph} L${x + 120} ${base} Z`, fill); if (cap) s += p(`M${x - 34} ${base - ph + 40} L${x} ${base - ph} L${x + 34} ${base - ph + 40} L${x + 14} ${base - ph + 32} L${x} ${base - ph + 44} L${x - 14} ${base - ph + 32} Z`, cap); }
  return s;
}
function tree(x: number, y: number, s: number, fill: string, trunk = '#5d4037') {
  return rect(x - 5 * s, y - 30 * s, 10 * s, 30 * s, trunk, ol) + c(x, y - 50 * s, 30 * s, fill, ol) + c(x - 20 * s, y - 36 * s, 20 * s, fill, ol) + c(x + 20 * s, y - 38 * s, 22 * s, fill, ol);
}
function pine(x: number, y: number, s: number, fill: string) {
  return rect(x - 4 * s, y - 16 * s, 8 * s, 16 * s, '#5d4037', ol) + p(`M${x - 34 * s} ${y - 14 * s} L${x} ${y - 90 * s} L${x + 34 * s} ${y - 14 * s} Z`, fill, ol);
}
function bubbles(r: Rng, n: number, col = '#e0f7fa') { let s = ''; for (let i = 0; i < n; i++) s += c(r.int(W), r.int(H), 2 + r.int(5), 'none', { stroke: col, 'stroke-width': 1.5, opacity: 0.6, class: 'float' }); return s; }
function particles(r: Rng, n: number, col: string, size = 2) { let s = ''; for (let i = 0; i < n; i++) s += c(r.int(W), r.int(H), size * (0.5 + r.float()), col, { opacity: 0.4 + r.float() * 0.5, class: i % 3 ? 'twinkle' : 'drift' }); return s; }
function lightRays(op = 0.18) { let s = ''; for (let i = 0; i < 5; i++) s += p(`M${120 + i * 150} 0 L${60 + i * 150} ${H} L${110 + i * 150} ${H} L${150 + i * 150} 0 Z`, '#ffffff', { opacity: op, class: 'sway' }); return s; }

const BIOME: Record<BiomeId, (r: Rng) => Omit<SceneLayers, 'props'>> = {
  lab: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#2c3e50', '#3d5a6c']) + rect(0, 0, W, H, 'url(#g)') + rect(520, 40, 200, 140, '#13243a', ol) + c(640, 90, 18, '#fdf6c3') + particles(r, 12, '#ffffff', 1.4).replace(/cy="(\d+)"/g, (_, y) => `cy="${40 + (Number(y) % 130)}"`),
    far: rect(0, 230, W, 20, '#26353f') + [60, 200, 340].map((x) => rect(x, 120, 110, 110, '#3f5866', ol) + rect(x + 10, 140, 90, 6, '#5d7a89')).join(''),
    mid: rect(-10, 300, W + 20, 30, '#8d6e63', ol) + rect(-10, 328, W + 20, 140, '#5d4037', ol) + [100, 160, 600, 680].map((x, i) => p(`M${x} 300 L${x - 14} 260 L${x - 14} 240 L${x + 14} 240 L${x + 14} 260 Z`, ['#80deea', '#f48fb1', '#c5e1a5', '#ffe082'][i], { ...ol, opacity: 0.9 })).join(''),
    near: rect(0, 420, W, 30, '#3e2723') }),
  forest: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#bfe3c8', '#7fb99a']) + rect(0, 0, W, H, 'url(#g)'),
    far: hills(r, 260, 80, '#5c9a7a', 5) + [0, 1, 2, 3, 4, 5, 6].map((i) => pine(60 + i * 120 + r.int(30), 270, 0.9, '#3f7d5f')).join(''),
    mid: hills(r, 330, 40, '#3e7b4f', 4, ol) + [0, 1, 2, 3].map((i) => tree(80 + i * 220 + r.int(40), 340, 1.3, i % 2 ? '#4caf50' : '#66bb6a')).join(''),
    near: p(`M0 ${H} L0 400 Q200 380 400 405 T800 395 L800 ${H} Z`, '#2e5d3a', ol) + [70, 380, 720].map((x) => p(`M${x} 410 q-30 -40 -50 -20 M${x} 410 q30 -50 50 -20 M${x} 410 q0 -50 4 -60`, 'none', { stroke: '#1b3d25', 'stroke-width': 6, 'stroke-linecap': 'round' })).join('') + [250, 560].map((x) => rect(x - 4, 395, 8, 16, '#efe0c8', ol) + p(`M${x - 18} 397 Q${x} 370 ${x + 18} 397 Z`, '#e57373', ol)).join('') }),
  desert: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#ffd89b', '#f7a35c']) + rect(0, 0, W, H, 'url(#g)') + c(640, 90, 48, '#fff3c4', { opacity: 0.9 }) + c(640, 90, 80, '#fff3c4', { opacity: 0.25 }),
    far: hills(r, 270, 60, '#e9b872', 4),
    mid: hills(r, 330, 70, '#dfa055', 3, ol),
    near: hills(r, 410, 30, '#c9853a', 3, ol) + [120, 650].map((x) => p(`M${x} 405 l-14 -20 M${x} 405 l0 -26 M${x} 405 l14 -18 M${x} 405 l-22 -8 M${x} 405 l22 -10`, 'none', { stroke: '#7a6a3a', 'stroke-width': 4, 'stroke-linecap': 'round' })).join('') + p('M420 420 q30 -30 60 0 Z', '#a1887f', ol) }),
  mountain: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#9fd3ff', '#e3f2fd']) + rect(0, 0, W, H, 'url(#g)'),
    far: peaks(r, 300, 230, '#8fa6b8', '#ffffff'),
    mid: peaks(r, 360, 160, '#6d7f8c').replace(/<path /g, `<path stroke="${INK}" stroke-width="3" `),
    near: p(`M0 ${H} L0 390 L180 370 L300 400 L520 372 L800 398 L800 ${H} Z`, '#55636e', ol) + [140, 610].map((x) => p(`M${x} 400 l30 -30 l34 10 l10 22 Z`, '#7b8a95', ol)).join('') }),
  cave: (r) => ({ underwater: false, dark: true,
    sky: rect(0, 0, W, H, '#14121f'),
    far: Array.from({ length: 9 }, (_, i) => p(`M${i * 95} 0 L${i * 95 + 40} 0 L${i * 95 + 20} ${60 + r.int(70)} Z`, '#2a2540')).join('') + particles(r, 14, '#7e57c2', 1.5),
    mid: p(`M0 ${H} L0 320 Q400 290 800 320 L800 ${H} Z`, '#2d2840', ol) + [150, 300, 560, 700].map((x, i) => p(`M${x} 320 l-16 -50 l16 -24 l16 24 Z`, ['#80deea', '#b39ddb', '#80cbc4', '#ce93d8'][i], { ...ol, opacity: 0.95, class: 'glow' })).join('') + a('ellipse', { cx: 420, cy: 360, rx: 140, ry: 18, fill: '#4fc3f7', opacity: 0.35, class: 'glow' }),
    near: Array.from({ length: 6 }, (_, i) => p(`M${i * 150 - 20} 0 L${i * 150 + 50} 0 L${i * 150 + 14} ${40 + r.int(50)} Z`, '#1d1a2c', ol)).join('') + p(`M0 ${H} L0 420 L800 425 L800 ${H} Z`, '#1d1a2c') }),
  snow: (r) => ({ underwater: false, dark: true,
    sky: grad('g', ['#0d1b3e', '#2b4b7e']) + rect(0, 0, W, H, 'url(#g)') + particles(r, 30, '#ffffff', 1.3) + [0, 1, 2].map((i) => p(`M-20 ${80 + i * 30} Q200 ${30 + i * 25} 400 ${90 + i * 20} T820 ${70 + i * 30}`, 'none', { stroke: ['#69f0ae', '#64ffda', '#b388ff'][i], 'stroke-width': 18, opacity: 0.35, class: 'sway' })).join(''),
    far: peaks(r, 290, 170, '#cfd8e6', '#ffffff'),
    mid: hills(r, 350, 40, '#eef3fb', 4, ol),
    near: p(`M0 ${H} L0 405 Q400 390 800 410 L800 ${H} Z`, '#ffffff', ol) + [180, 600].map((x) => p(`M${x} 410 l10 -40 l10 40 Z M${x + 16} 410 l8 -26 l8 26 Z`, '#b3e5fc', ol)).join('') + particles(r, 40, '#ffffff', 2).replace(/class="(twinkle|drift)"/g, 'class="snowfall"') }),
  swamp: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#a5b68d', '#5f6f52']) + rect(0, 0, W, H, 'url(#g)'),
    far: [80, 260, 470, 690].map((x) => p(`M${x} 300 L${x + 6} 160 M${x + 4} 220 L${x - 30} 190 M${x + 5} 200 L${x + 34} 170`, 'none', { stroke: '#3e4a36', 'stroke-width': 8, 'stroke-linecap': 'round' })).join('') + hills(r, 300, 20, '#4d5c43', 4),
    mid: rect(0, 320, W, 140, '#556b4a') + Array.from({ length: 14 }, (_, i) => p(`M${20 + i * 58} 340 q-4 -40 4 -70`, 'none', { stroke: '#6b8e4e', 'stroke-width': 5, 'stroke-linecap': 'round', class: 'sway' })).join('') + [200, 520].map((x) => c(x, 230, 9, '#e6ff9e', { opacity: 0.8, class: 'glow' })).join(''),
    near: a('ellipse', { cx: 400, cy: 420, rx: 460, ry: 40, fill: '#3b4d3a', ...ol }) + [150, 470, 640].map((x) => a('ellipse', { cx: x, cy: 418, rx: 26, ry: 8, fill: '#7cb342', ...ol })).join('') }),
  ruins: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#8e9eab', '#c4cdd4']) + rect(0, 0, W, H, 'url(#g)'),
    far: hills(r, 300, 50, '#7f8c7a', 4),
    mid: rect(220, 140, 360, 190, '#9aa3a8', ol) + rect(220, 120, 360, 26, '#7d878c', ol) + [250, 330, 410, 490].map((x, i) => rect(x, 170, 50, 46, i === 2 ? '#2b2f33' : '#536370', ol)).join('') + p('M360 330 L360 250 L440 250 L440 330 Z', '#3b3f42', ol) + Array.from({ length: 8 }, (_, i) => p(`M${230 + i * 45} 120 q${10 - r.int(20)} 60 ${4 - r.int(8)} ${80 + r.int(60)}`, 'none', { stroke: '#4e7d3a', 'stroke-width': 5, 'stroke-linecap': 'round' })).join(''),
    near: p(`M0 ${H} L0 390 Q400 370 800 395 L800 ${H} Z`, '#5f6b55', ol) + p('M110 400 l40 -26 l24 8 l-6 22 Z M620 405 l30 -18 l30 12 l-8 10 Z', '#8a9499', ol) }),
  reef: (r) => ({ underwater: true, dark: false,
    sky: grad('g', ['#4dd0e1', '#00838f']) + rect(0, 0, W, H, 'url(#g)') + lightRays(),
    far: hills(r, 330, 30, '#26a69a', 5) + bubbles(r, 10),
    mid: [90, 230, 380, 540, 690].map((x, i) => i % 2 ? p(`M${x} 360 q-20 -60 0 -90 q10 30 0 50 q30 -40 40 -20 q-10 30 -40 60 Z`, ['#ff8a65', '#f06292', '#ffb74d'][i % 3], ol) : c(x, 345, 32, ['#ba68c8', '#ffd54f', '#81c784'][i % 3], { ...ol, opacity: 0.95 })).join('') + [0, 1, 2, 3].map((i) => { const x = 150 + i * 160 + r.int(40), y = 140 + r.int(100); return p(`M${x} ${y} q20 -14 40 0 q-20 14 -40 0 Z M${x} ${y} l-12 -9 l0 18 Z`, ['#ffeb3b', '#ff7043', '#29b6f6', '#f8bbd0'][i], { ...ol, 'stroke-width': 2, class: 'swimx' }); }).join(''),
    near: p(`M0 ${H} L0 405 Q400 385 800 410 L800 ${H} Z`, '#f3e5ab', ol) }),
  mudflat: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#ffe0b2', '#b0bec5']) + rect(0, 0, W, H, 'url(#g)') + c(150, 110, 34, '#fff8e1', { opacity: 0.9 }),
    far: rect(0, 250, W, 30, '#90a4ae') + p('M520 250 l30 -24 l60 0 l20 24 Z', '#78909c'),
    mid: rect(0, 280, W, 200, '#8d7f6a') + Array.from({ length: 7 }, () => a('ellipse', { cx: r.int(W), cy: 300 + r.int(90), rx: 30 + r.int(40), ry: 6, fill: '#cfd8dc', opacity: 0.7 })).join('') + [0, 1, 2].map((i) => p(`M${300 + i * 140} ${150 + i * 10} q10 -10 20 0 q10 -10 20 0`, 'none', { stroke: INK, 'stroke-width': 3, class: 'drift' })).join(''),
    near: p(`M0 ${H} L0 410 Q400 400 800 415 L800 ${H} Z`, '#6d5f4b', ol) }),
  seagrass: (r) => ({ underwater: true, dark: false,
    sky: grad('g', ['#80deea', '#26a69a']) + rect(0, 0, W, H, 'url(#g)') + lightRays(0.22),
    far: hills(r, 340, 20, '#4db6ac', 5) + bubbles(r, 8),
    mid: Array.from({ length: 30 }, (_, i) => p(`M${10 + i * 27} 380 q${8 - r.int(16)} -60 ${4 - r.int(8)} ${-80 - r.int(60)}`, 'none', { stroke: i % 2 ? '#43a047' : '#66bb6a', 'stroke-width': 7, 'stroke-linecap': 'round', class: 'sway' })).join(''),
    near: p(`M0 ${H} L0 400 Q400 390 800 405 L800 ${H} Z`, '#e6d8a8', ol) }),
  openSea: (r) => ({ underwater: false, dark: false,
    sky: grad('g', ['#64b5f6', '#e3f2fd']) + rect(0, 0, W, H, 'url(#g)') + c(120, 80, 30, '#fffde7'),
    far: rect(0, 230, W, 230, '#1e88e5'),
    mid: Array.from({ length: 5 }, (_, i) => p(`M-40 ${270 + i * 34} q50 -16 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0`, 'none', { stroke: '#bbdefb', 'stroke-width': 4, opacity: 0.7, class: 'swimx' })).join('') + particles(r, 0, '#fff'),
    near: rect(0, 410, W, 40, '#1565c0') }),
  twilight: (r) => ({ underwater: true, dark: true,
    sky: grad('g', ['#0d47a1', '#0a1a3f']) + rect(0, 0, W, H, 'url(#g)') + lightRays(0.06),
    far: particles(r, 40, '#90caf9', 1.6),
    mid: Array.from({ length: 16 }, () => { const x = r.int(W), y = 80 + r.int(280); return p(`M${x} ${y} q10 -6 20 0 q-10 6 -20 0 Z`, '#5c6bc0', { opacity: 0.8, class: 'swimx' }) + c(x + 5, y - 1, 1.8, '#e3f2fd'); }).join(''),
    near: particles(r, 18, '#b3e5fc', 2.4) }),
  midnight: (r) => ({ underwater: true, dark: true,
    sky: rect(0, 0, W, H, '#05070f'),
    far: particles(r, 60, '#ffffff', 1).replace(/class="(twinkle|drift)"/g, 'class="snowfall"'),
    mid: Array.from({ length: 10 }, () => c(r.int(W), 60 + r.int(320), 3 + r.int(4), ['#00e5ff', '#76ff03', '#e040fb'][r.int(3)], { class: 'twinkle' })).join(''),
    near: p(`M0 ${H} L0 420 Q400 405 800 425 L800 ${H} Z`, '#0b0f1c') }),
  vents: (r) => ({ underwater: true, dark: true,
    sky: grad('g', ['#0b1020', '#1a0f0f']) + rect(0, 0, W, H, 'url(#g)'),
    far: particles(r, 20, '#ff8a65', 1.2),
    mid: [180, 420, 640].map((x, i) => p(`M${x - 34} 380 L${x - 16} ${210 + i * 20} L${x + 16} ${210 + i * 20} L${x + 34} 380 Z`, '#3e2f2a', ol) + [0, 1, 2].map((k) => c(x + (k - 1) * 10, 190 + i * 20 - k * 30, 20 + k * 10, '#2b2b2b', { opacity: 0.6 - k * 0.15, class: 'rise' })).join('')).join(''),
    near: p(`M0 ${H} L0 395 Q400 380 800 400 L800 ${H} Z`, '#2a211e', ol) }),
  trench: (r) => ({ underwater: true, dark: true,
    sky: rect(0, 0, W, H, '#020309'),
    far: p(`M0 0 L140 0 L110 ${H} L0 ${H} Z M800 0 L660 0 L700 ${H} L800 ${H} Z`, '#0c1220') + particles(r, 30, '#9e9e9e', 0.9).replace(/class="(twinkle|drift)"/g, 'class="snowfall"'),
    mid: p(`M0 0 L90 0 L70 ${H} L0 ${H} Z M800 0 L720 0 L740 ${H} L800 ${H} Z`, '#141c2e', ol),
    near: p(`M0 ${H} L0 430 L800 430 L800 ${H} Z`, '#070a12') }),
};

// ───── prop drawings: every prop referenced by story content must exist here (tested) ─────
const figure = (x: number, y: number, coat: string, hat?: string, extra = '') =>
  c(x, y - 92, 16, '#f1c9a5', ol) + p(`M${x - 22} ${y} L${x - 18} ${y - 70} Q${x} ${y - 82} ${x + 18} ${y - 70} L${x + 22} ${y} Z`, coat, ol) + (hat ?? '') + extra;
const eyes2 = (x: number, y: number, col = '#ffeb3b') => c(x, y, 7, col, { class: 'blink' }) + c(x + 22, y, 7, col, { class: 'blink' }) + c(x + 2, y, 3, INK) + c(x + 24, y, 3, INK);

export const PROPS: Record<string, (r: Rng) => string> = {
  // biome-integrated (drawn by the biome layer itself; emphasised here)
  trees: () => '', dunes: () => '', peaks: () => '', stalactites: () => '', reeds: () => '', ice: () => '', coral: () => '', seagrass: () => '', fish: () => '', mud: () => '', snow: () => '', 'lab-ruins': () => '', lab: () => '',
  obstacle: () => p('M520 330 l40 -50 l50 20 l20 40 Z', '#795548', ol) + p('M560 300 l20 10', 'none', { stroke: INK, 'stroke-width': 3 }),
  predator: () => eyes2(590, 250) + p('M570 290 q40 -30 90 0', 'none', { stroke: '#000', 'stroke-width': 0 }),
  critter: () => c(600, 360, 16, '#bcaaa4', ol) + c(612, 352, 3, INK) + p('M584 360 q-20 -10 -10 -26 M600 344 q4 -16 18 -12', 'none', { stroke: '#90a4ae', 'stroke-width': 3 }),
  clue: () => p('M560 380 l14 -6 l6 14 l-14 6 Z M600 384 l14 -6 l6 14 l-14 6 Z M640 378 l14 -6 l6 14 l-14 6 Z', '#3e2723', { opacity: 0.6 }) + rect(670, 360, 40, 26, '#fff8e1', { ...ol, transform: 'rotate(-12 690 373)' }),
  heatwave: () => [0, 1, 2, 3].map((i) => p(`M${140 + i * 160} 230 q-10 -20 0 -40 q10 -20 0 -40`, 'none', { stroke: '#fff3e0', 'stroke-width': 4, opacity: 0.6, class: 'rise' })).join(''),
  blizzard: (r) => Array.from({ length: 30 }, () => p(`M${r.int(W)} ${r.int(H)} l40 14`, 'none', { stroke: '#ffffff', 'stroke-width': 2.5, opacity: 0.7, class: 'drift' })).join(''),
  darkness: () => rect(0, 0, W, H, '#000', { opacity: 0.45 }),
  pressure: () => [0, 1, 2].map((i) => p(`M${40 + i * 12} ${60 + i * 40} q30 ${80} 0 ${160}`, 'none', { stroke: '#4fc3f7', 'stroke-width': 3, opacity: 0.5 }) + p(`M${760 - i * 12} ${60 + i * 40} q-30 ${80} 0 ${160}`, 'none', { stroke: '#4fc3f7', 'stroke-width': 3, opacity: 0.5 })).join(''),
  radio: () => rect(600, 300, 90, 56, '#6d4c41', ol) + c(625, 328, 14, '#bcaaa4', ol) + rect(648, 314, 32, 10, '#ffe082', ol) + p('M680 300 l20 -50', 'none', { stroke: INK, 'stroke-width': 3 }) + [16, 28].map((r0) => p(`M${700 + r0 * 0.3} ${250 - r0} a${r0} ${r0} 0 0 1 0 ${r0 * 2}`, 'none', { stroke: '#ffd54f', 'stroke-width': 3, class: 'blink' })).join(''),
  postcard: () => rect(590, 270, 100, 66, '#fff8e1', { ...ol, transform: 'rotate(8 640 303)' }) + p('M605 290 q20 20 40 0 t30 10', 'none', { stroke: '#e53935', 'stroke-width': 3, 'stroke-dasharray': '6 4', transform: 'rotate(8 640 303)' }),
  vents: () => rect(600, 130, 120, 70, '#546e7a', ol) + [0, 1, 2, 3].map((i) => rect(610 + i * 28, 140, 18, 50, '#263238')).join(''),
  trophy: () => p('M620 250 h60 v20 q0 40 -30 46 q-30 -6 -30 -46 Z', '#ffca28', ol) + rect(636, 316, 28, 12, '#ffca28', ol) + rect(626, 328, 48, 12, '#8d6e63', ol),
  mushrooms: () => [120, 680].map((x) => rect(x - 5, 380, 10, 22, '#fff3e0', ol) + p(`M${x - 22} 382 Q${x} 352 ${x + 22} 382 Z`, '#80deea', { ...ol, class: 'glow' })).join(''),
  oasis: () => a('ellipse', { cx: 600, cy: 345, rx: 90, ry: 16, fill: '#4fc3f7', ...ol }) + p('M640 345 q-6 -60 6 -100 M646 245 q-40 -6 -56 16 M646 245 q40 -10 56 12 M646 245 q-10 -30 -40 -36 M646 245 q20 -30 46 -30', 'none', { stroke: '#2e7d32', 'stroke-width': 7, 'stroke-linecap': 'round' }),
  ibex: () => [560, 640].map((x) => p(`M${x} 250 h46 v-18 h-46 Z`, '#a1887f', ol) + p(`M${x + 44} 232 q16 -26 -6 -40`, 'none', { stroke: '#5d4037', 'stroke-width': 5 }) + p(`M${x + 6} 250 v20 M${x + 40} 250 v20`, 'none', { stroke: INK, 'stroke-width': 4 })).join(''),
  crystals: () => [560, 620, 680].map((x, i) => p(`M${x} 380 l-14 -46 l14 -26 l14 26 Z`, ['#b388ff', '#80deea', '#f48fb1'][i], { ...ol, class: 'glow' })).join(''),
  aurora: () => '',
  wisps: (r) => Array.from({ length: 5 }, () => c(100 + r.int(600), 140 + r.int(140), 7, '#e6ff9e', { opacity: 0.85, class: 'float' })).join(''),
  vines: () => '',
  ranger: () => figure(620, 390, '#6d8b4e', p('M596 300 h48 l-8 -14 h-32 Z', '#8d6e63', ol)),
  rival: () => figure(630, 390, '#eceff1', p('M612 292 h36 v-14 h-36 Z', '#212121', ol), rect(611, 312, 38, 6, '#212121')) + p('M690 220 h50 M700 220 v-8 M730 220 v-8', 'none', { stroke: INK, 'stroke-width': 4, class: 'float' }),
  hermit: () => figure(620, 390, '#795548', '', p('M604 316 q16 30 32 0', '#eeeeee', ol)),
  bees: (r) => Array.from({ length: 8 }, () => { const x = 520 + r.int(220), y = 180 + r.int(120); return a('ellipse', { cx: x, cy: y, rx: 6, ry: 4, fill: '#ffca28', ...ol, 'stroke-width': 1.5, class: 'drift' }); }).join('') + rect(700, 300, 50, 70, '#d7a54a', ol),
  kid: () => c(630, 318, 14, '#f1c9a5', ol) + p('M612 390 L614 334 Q630 326 646 334 L648 390 Z', '#42a5f5', ol) + rect(650, 340, 22, 28, '#fff8e1', ol),
  basma: () => figure(630, 390, '#fafafa', p('M610 300 q20 -22 40 0', '#4e342e', ol), p('M612 340 h36', 'none', { stroke: '#8d6e63', 'stroke-width': 3 })),
  chip: () => rect(620, 160, 44, 44, '#263238', ol) + rect(630, 170, 24, 24, '#4caf50', { class: 'blink' }) + [0, 1, 2].map((i) => p(`M${626 + i * 14} 160 v-10 M${626 + i * 14} 204 v10`, 'none', { stroke: INK, 'stroke-width': 3 })).join(''),
  escapees: (r) => Array.from({ length: 6 }, () => c(500 + r.int(260), 370 + r.int(20), 8, '#b2ff59', { opacity: 0.8, class: 'glow' })).join('') + [560, 690].map((x) => a('ellipse', { cx: x, cy: 360, rx: 16, ry: 11, fill: '#4caf50', ...ol })).join(''),
  clone: () => '', // handled by Scene: renders a second, desaturated copy of the creature
  villagers: () => [560, 620, 680].map((x, i) => c(x, 320, 12, '#e0b896', ol) + p(`M${x - 14} 380 L${x - 12} 334 L${x + 12} 334 L${x + 14} 380 Z`, ['#ef5350', '#ffffff', '#5c6bc0'][i], ol)).join(''),
  disaster: (r) => Array.from({ length: 6 }, () => p(`M${r.int(W)} ${r.int(160)} l18 -8 l14 14 l-10 16 l-20 -4 Z`, '#6d4c41', { ...ol, class: 'fall' })).join(''),
  cage: () => rect(560, 280, 120, 100, 'none', { stroke: '#90a4ae', 'stroke-width': 5 }) + [0, 1, 2, 3, 4].map((i) => p(`M${580 + i * 20} 280 v100`, 'none', { stroke: '#90a4ae', 'stroke-width': 4 })).join('') + c(575, 392, 10, '#424242', ol) + c(665, 392, 10, '#424242', ol),
  machine: () => rect(540, 160, 200, 200, '#455a64', ol) + c(640, 240, 46, '#00e5ff', { ...ol, class: 'glow' }) + rect(570, 310, 140, 30, '#263238', ol) + p('M580 325 h40', 'none', { stroke: '#76ff03', 'stroke-width': 4, class: 'blink' }),
  boat: () => p('M560 340 h180 l-30 36 h-120 Z', '#eceff1', ol) + rect(620, 300, 50, 40, '#90caf9', ol),
  hydrophone: () => p('M640 140 v160', 'none', { stroke: INK, 'stroke-width': 3 }) + c(640, 310, 14, '#ffd54f', ol) + [20, 36].map((r0) => c(640, 310, r0, 'none', { stroke: '#ffd54f', 'stroke-width': 2, class: 'blink' })).join(''),
  net: () => Array.from({ length: 6 }, (_, i) => p(`M${520 + i * 40} 200 L${560 + i * 30} 380 M${520} ${200 + i * 30} L760 ${210 + i * 30}`, 'none', { stroke: '#cfd8dc', 'stroke-width': 2, opacity: 0.8 })).join(''),
  mudskipper: () => [600, 680].map((x) => p(`M${x} 370 q20 -18 40 0 q-20 10 -40 0 Z`, '#8d6e63', ol) + c(x + 30, 362, 4, '#fff', ol)).join(''),
  dugong: () => p('M520 250 q90 -40 180 0 q-30 30 -90 34 q-60 -4 -90 -34 Z M700 250 l40 -20 l-6 30 l6 30 Z', '#90a4ae', { ...ol, class: 'swimx' }),
  diver: () => p('M560 200 q60 -20 120 0 l-10 24 q-50 10 -100 0 Z', '#263238', { ...ol, class: 'float' }) + c(690, 206, 14, '#4fc3f7', ol) + rect(590, 184, 60, 14, '#ffca28', ol),
  dhow: () => p('M540 250 h220 l-36 40 h-150 Z', '#8d6e63', ol) + p('M650 250 v-140 l70 120 Z', '#fff8e1', ol),
  sailor: () => figure(640, 390, '#eeeeee', p('M622 300 q18 -16 36 0', '#ffffff', ol), p('M626 316 q14 20 28 0', '#bdbdbd', ol)),
  ship: () => p('M500 240 h260 l-30 40 h-200 Z', '#eceff1', ol) + rect(560, 200, 120, 40, '#ffffff', ol) + p('M720 200 v-60 l-60 60', 'none', { stroke: INK, 'stroke-width': 4 }),
  sub: () => a('ellipse', { cx: 620, cy: 200, rx: 90, ry: 44, fill: '#ffca28', ...ol, class: 'float' }) + c(660, 196, 20, '#4fc3f7', ol) + rect(600, 146, 30, 20, '#ffca28', ol) + p('M540 200 l-30 -18 v36 Z', '#ffa000', ol) + p('M700 210 l80 30', 'none', { stroke: '#fffde7', 'stroke-width': 30, opacity: 0.2 }),
  lanternfish: () => '', jelly: (r) => Array.from({ length: 4 }, () => { const x = 120 + r.int(560), y = 80 + r.int(160); return p(`M${x - 20} ${y} q20 -30 40 0 Z`, '#f8bbd0', { opacity: 0.6, class: 'float' }) + p(`M${x - 10} ${y} q-4 20 2 34 M${x + 10} ${y} q4 20 -2 34`, 'none', { stroke: '#f8bbd0', 'stroke-width': 2, opacity: 0.6 }); }).join(''),
  angler: () => p('M560 300 q60 -50 120 0 q-60 40 -120 0 Z', '#3e2723', ol) + p('M600 270 q20 -40 40 -30', 'none', { stroke: INK, 'stroke-width': 3 }) + c(642, 240, 8, '#ffff8d', { class: 'glow' }) + p('M640 302 l6 8 l6 -8 l6 8 l6 -8', 'none', { stroke: '#fff', 'stroke-width': 2 }),
  smokers: () => '', tubeworms: () => Array.from({ length: 9 }, (_, i) => rect(500 + i * 26, 330, 10, 60, '#eeeeee', ol) + c(505 + i * 26, 326, 9, '#e53935', ol)).join(''),
  squid: () => c(560, 210, 90, '#c0c0c0', { ...ol, opacity: 0.95 }) + c(560, 210, 50, '#1b1b1b') + c(580, 190, 14, '#ffffff', { opacity: 0.8 }),
  probe: () => rect(600, 340, 80, 40, '#ff7043', { ...ol, transform: 'rotate(-14 640 360)' }) + c(626, 350, 6, '#76ff03', { class: 'blink' }),
  whalefall: () => p('M200 380 h420', 'none', { stroke: '#eeeeee', 'stroke-width': 10 }) + Array.from({ length: 12 }, (_, i) => p(`M${240 + i * 30} 380 q-6 -40 10 -60`, 'none', { stroke: '#eeeeee', 'stroke-width': 7, 'stroke-linecap': 'round' })).join('') + p('M600 380 q50 -50 90 -10 q-30 30 -90 10 Z', '#e0e0e0', ol),
  leviathan: () => p(`M-80 260 Q200 120 500 200 Q700 250 900 180 L900 330 Q600 420 300 330 Q100 280 -80 360 Z`, '#0d1726', { opacity: 0.95 }) + c(560, 230, 34, '#cfd8dc', { class: 'glow' }) + c(560, 230, 16, '#000'),
  eruption: () => [0, 1, 2, 3].map((i) => c(400 + (i - 1.5) * 30, 300 - i * 50, 30 + i * 14, '#ff7043', { opacity: 0.45 - i * 0.08, class: 'rise' })).join('') + p('M300 400 l60 -20 l40 24 l60 -30 l50 26', 'none', { stroke: '#ffab40', 'stroke-width': 5, class: 'blink' }),
  tether: () => p('M640 0 q-30 80 10 140 q20 30 -10 40', 'none', { stroke: '#ffeb3b', 'stroke-width': 4, 'stroke-dasharray': '10 6' }),
};

/** Props drawn by a biome's own layers rather than as overlays. Tests check they're only used there. */
export const BIOME_INTEGRATED: Record<string, BiomeId[] | '*'> = {
  trees: ['forest'], dunes: ['desert'], peaks: ['mountain'], stalactites: ['cave'], reeds: ['swamp'], ice: ['snow'], coral: ['reef'],
  seagrass: ['seagrass'], fish: ['reef'], mud: ['mudflat', 'swamp'], snow: ['midnight'], 'lab-ruins': ['ruins'], lab: ['lab'], aurora: ['snow'],
  vines: ['ruins'], lanternfish: ['twilight'], smokers: ['vents'], clone: '*',
};

export function sceneLayers(biome: BiomeId, props: string[], seed: number): SceneLayers {
  const r = Rng.from(seed, `scene:${biome}`);
  const base = BIOME[biome](r);
  const gid = `g-${biome}-${seed >>> 0}`; // unique gradient id: several scenes can be in the DOM during transitions
  base.sky = base.sky.replace('id="g"', `id="${gid}"`).replace(/url\(#g\)/g, `url(#${gid})`);
  const pr = props.map((id) => (PROPS[id] ? PROPS[id](Rng.from(seed, id)) : '')).join('');
  return { ...base, props: pr };
}

export const svgWrap = (inner: string, cls = '') => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
