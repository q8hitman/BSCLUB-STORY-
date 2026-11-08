// Layered SVG creature built from anchored parts. Returns a plain SVG string so the same art
// is used in the UI, in scenes, and on the PNG share card.
import { HUES } from '../content/parts';
import type { CreatureConfig } from '../engine/types';

const INK = '#2b1d14';
const SW = 3;

interface BaseShape { rx: number; ry: number; cx: number; cy: number; hx: number; hy: number; hr: number; snout: 'point' | 'round' | 'beak' | 'wide' | 'long' | 'none'; neck?: boolean }

export const BASE_SHAPES: Record<string, BaseShape> = {
  fennec: { cx: 140, cy: 150, rx: 62, ry: 38, hx: 208, hy: 100, hr: 34, snout: 'point' },
  axolotl: { cx: 140, cy: 152, rx: 64, ry: 34, hx: 212, hy: 112, hr: 38, snout: 'wide' },
  gecko: { cx: 138, cy: 158, rx: 72, ry: 28, hx: 218, hy: 128, hr: 28, snout: 'round' },
  owl: { cx: 145, cy: 148, rx: 50, ry: 52, hx: 182, hy: 86, hr: 40, snout: 'beak' },
  camel: { cx: 135, cy: 150, rx: 66, ry: 40, hx: 228, hy: 74, hr: 26, snout: 'round', neck: true },
  frog: { cx: 140, cy: 155, rx: 58, ry: 36, hx: 198, hy: 116, hr: 36, snout: 'wide' },
  pangolin: { cx: 138, cy: 152, rx: 66, ry: 40, hx: 214, hy: 124, hr: 26, snout: 'long' },
  octopus: { cx: 145, cy: 140, rx: 52, ry: 48, hx: 192, hy: 98, hr: 40, snout: 'none' },
};

const el = (tag: string, attrs: Record<string, string | number>, inner = '') =>
  `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}${inner ? `>${inner}</${tag}>` : '/>'}`;
const path = (d: string, fill: string, extra: Record<string, string | number> = {}) => el('path', { d, fill, stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const circle = (cx: number, cy: number, r: number, fill: string, extra: Record<string, string | number> = {}) => el('circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': SW, ...extra });
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: Record<string, string | number> = {}) => el('ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': SW, ...extra });

function tail(id: string, b: BaseShape, c: typeof HUES[number]): string {
  const x = b.cx - b.rx + 6, y = b.cy - 4;
  switch (id) {
    case 'fluffy': return path(`M${x} ${y} C${x - 40} ${y - 10} ${x - 70} ${y - 60} ${x - 40} ${y - 90} C${x - 20} ${y - 70} ${x - 10} ${y - 50} ${x + 8} ${y - 18} Z`, c.body) + path(`M${x - 40} ${y - 90} C${x - 30} ${y - 75} ${x - 34} ${y - 70} ${x - 28} ${y - 60}`, 'none', { 'stroke-width': 2.5 }) + path(`M${x - 46} ${y - 84} C${x - 52} ${y - 76} ${x - 50} ${y - 70} ${x - 44} ${y - 66} C${x - 36} ${y - 78} ${x - 38} ${y - 88} ${x - 40} ${y - 90} Z`, c.belly);
    case 'stinger': {
      let s = ''; const seg = [[0, 0], [-18, -14], [-30, -34], [-32, -58], [-22, -78]];
      seg.forEach(([dx, dy], i) => { s += ellipse(x + dx, y + dy, 13 - i, 11 - i, c.dark); });
      return s + path(`M${x - 22} ${y - 84} L${x - 6} ${y - 98} L${x - 14} ${y - 80} Z`, '#f5e6c8');
    }
    case 'finTail': return path(`M${x + 6} ${y} C${x - 20} ${y - 4} ${x - 30} ${y} ${x - 38} ${y + 2} L${x - 70} ${y - 34} C${x - 62} ${y - 6} ${x - 62} ${y + 10} ${x - 70} ${y + 38} L${x - 38} ${y + 8} C${x - 26} ${y + 14} ${x - 10} ${y + 14} ${x + 6} ${y + 10} Z`, c.dark) + path(`M${x - 60} ${y - 20} L${x - 44} ${y}  M${x - 60} ${y + 24} L${x - 44} ${y + 6}`, 'none', { 'stroke-width': 2 });
    case 'prehensile': return path(`M${x + 6} ${y} C${x - 40} ${y + 8} ${x - 66} ${y - 20} ${x - 60} ${y - 52} C${x - 56} ${y - 74} ${x - 26} ${y - 74} ${x - 26} ${y - 52} C${x - 26} ${y - 38} ${x - 44} ${y - 36} ${x - 44} ${y - 50}`, 'none', { 'stroke-width': 14, stroke: INK }) + path(`M${x + 6} ${y} C${x - 40} ${y + 8} ${x - 66} ${y - 20} ${x - 60} ${y - 52} C${x - 56} ${y - 74} ${x - 26} ${y - 74} ${x - 26} ${y - 52} C${x - 26} ${y - 38} ${x - 44} ${y - 36} ${x - 44} ${y - 50}`, 'none', { 'stroke-width': 7, stroke: c.body });
    case 'club': return path(`M${x + 6} ${y - 6} L${x - 46} ${y - 10} L${x - 46} ${y + 6} L${x + 6} ${y + 10} Z`, c.dark) + circle(x - 58, y - 2, 20, '#d9c9a3') + path(`M${x - 74} ${y - 12} l-8 -4 M${x - 74} ${y + 8} l-8 4 M${x - 58} ${y - 22} l0 -8`, 'none');
    case 'lure': return path(`M${x + 6} ${y - 4} C${x - 30} ${y - 10} ${x - 40} ${y - 50} ${x - 20} ${y - 80}`, 'none', { 'stroke-width': 5 }) +
      el('circle', { cx: x - 20, cy: y - 88, r: 18, fill: '#fff6a8', opacity: 0.45 }) + circle(x - 20, y - 88, 10, '#ffe45e');
    default: return '';
  }
}

function legs(id: string, b: BaseShape, c: typeof HUES[number], front: boolean): string {
  const lx = front ? b.cx + b.rx * 0.45 : b.cx - b.rx * 0.45; const ly = b.cy + b.ry * 0.55;
  const shade = front ? c.body : c.dark;
  switch (id) {
    case 'webbed': return path(`M${lx - 8} ${ly} L${lx - 8} ${ly + 34} L${lx + 8} ${ly + 34} L${lx + 8} ${ly} Z`, shade) + path(`M${lx - 18} ${ly + 44} L${lx} ${ly + 30} L${lx + 22} ${ly + 44} Q${lx + 2} ${ly + 50} ${lx - 18} ${ly + 44} Z`, '#f2a03d');
    case 'climbClaws': return path(`M${lx - 9} ${ly} L${lx - 9} ${ly + 36} L${lx + 9} ${ly + 36} L${lx + 9} ${ly} Z`, shade) + path(`M${lx - 9} ${ly + 36} q-6 10 -2 14 M${lx} ${ly + 36} q-4 10 0 14 M${lx + 9} ${ly + 36} q-2 10 2 14`, 'none', { 'stroke-width': 3.5 });
    case 'digClaws': return path(`M${lx - 13} ${ly - 4} L${lx - 12} ${ly + 30} L${lx + 14} ${ly + 30} L${lx + 13} ${ly - 4} Z`, shade) + path(`M${lx - 12} ${ly + 30} l-6 16 l8 -6 l2 10 l6 -12 l6 12 l2 -10 l8 6 l-6 -16 Z`, '#efe5cf');
    case 'tentacles': {
      const o = front ? 0 : -1; let s = '';
      [0, 1].forEach((k) => { const tx = lx + (k ? 14 : -10) + o * 6; s += path(`M${tx} ${ly - 6} C${tx - 6} ${ly + 20} ${tx + 22} ${ly + 30} ${tx + 6} ${ly + 50} C${tx - 2} ${ly + 58} ${tx - 14} ${ly + 50} ${tx - 6} ${ly + 44}`, 'none', { 'stroke-width': 13 }) + path(`M${tx} ${ly - 6} C${tx - 6} ${ly + 20} ${tx + 22} ${ly + 30} ${tx + 6} ${ly + 50} C${tx - 2} ${ly + 58} ${tx - 14} ${ly + 50} ${tx - 6} ${ly + 44}`, 'none', { 'stroke-width': 6, stroke: shade }); });
      return s;
    }
    case 'springLegs': return front
      ? path(`M${lx - 7} ${ly} L${lx - 7} ${ly + 32} L${lx + 7} ${ly + 32} L${lx + 7} ${ly} Z`, shade)
      : path(`M${lx - 26} ${ly - 20} C${lx - 40} ${ly + 10} ${lx - 6} ${ly + 22} ${lx - 10} ${ly + 38} L${lx + 26} ${ly + 40} L${lx + 26} ${ly + 30} L${lx + 4} ${ly + 28} C${lx + 14} ${ly + 6} ${lx + 10} ${ly - 18} ${lx - 26} ${ly - 20} Z`, shade);
    case 'wings': default: return path(`M${lx - 7} ${ly} L${lx - 7} ${ly + 30} L${lx + 7} ${ly + 30} L${lx + 7} ${ly} Z`, shade) + path(`M${lx - 12} ${ly + 30} h24`, 'none');
  }
}

function wings(b: BaseShape, c: typeof HUES[number]): string {
  const x = b.cx + 4, y = b.cy - b.ry + 6;
  return path(`M${x} ${y} C${x - 30} ${y - 70} ${x - 90} ${y - 90} ${x - 120} ${y - 60} C${x - 100} ${y - 52} ${x - 96} ${y - 40} ${x - 98} ${y - 28} C${x - 80} ${y - 36} ${x - 70} ${y - 28} ${x - 66} ${y - 16} C${x - 50} ${y - 26} ${x - 36} ${y - 18} ${x - 30} ${y - 6} Z`, c.dark, { opacity: 0.95 })
    + path(`M${x - 4} ${y - 6} L${x - 112} ${y - 58} M${x - 10} ${y - 4} L${x - 92} ${y - 30} M${x - 16} ${y - 2} L${x - 64} ${y - 18}`, 'none', { 'stroke-width': 2.5 });
}

function adaptationBack(id: string, b: BaseShape, c: typeof HUES[number]): string {
  const top = b.cy - b.ry;
  switch (id) {
    case 'spikes': { let s = ''; for (let i = -3; i <= 3; i++) { const x = b.cx + i * (b.rx / 4.2); const y = b.cy - Math.sqrt(Math.max(0, 1 - (i / 4.2) ** 2)) * b.ry + 6; s += path(`M${x - 9} ${y} L${x + 2} ${y - 30} L${x + 9} ${y} Z`, '#f3ead6'); } return s; }
    case 'hump': return path(`M${b.cx - 40} ${top + 14} C${b.cx - 34} ${top - 44} ${b.cx + 28} ${top - 44} ${b.cx + 34} ${top + 14} Z`, c.body);
    case 'shell': return path(`M${b.cx - b.rx + 4} ${b.cy - 4} C${b.cx - b.rx + 10} ${top - 26} ${b.cx + b.rx - 10} ${top - 26} ${b.cx + b.rx - 4} ${b.cy - 4} Z`, '#a7895f');
    default: return '';
  }
}

function adaptationFront(id: string, b: BaseShape, c: typeof HUES[number]): string {
  switch (id) {
    case 'thickFur': { let s = ''; for (let a = 200; a <= 340; a += 18) { const r = (a * Math.PI) / 180; const x = b.cx + Math.cos(r) * b.rx; const y = b.cy + Math.sin(r) * b.ry; s += path(`M${x - 8} ${y + 4} l6 -12 l6 12`, c.belly, { 'stroke-width': 3 }); } return s + path(`M${b.cx - 30} ${b.cy + 4} q6 -8 12 0 M${b.cx + 6} ${b.cy - 6} q6 -8 12 0`, 'none', { 'stroke-width': 2.5 }); }
    case 'camo': return [[-28, -8, 16, 10], [10, 6, 14, 9], [32, -14, 10, 7], [-6, -20, 9, 6]].map(([dx, dy, rx, ry]) => el('ellipse', { cx: b.cx + dx, cy: b.cy + dy, rx, ry, fill: c.dark, opacity: 0.55 })).join('') + [[-16, 14, 9, 6], [22, -2, 7, 5]].map(([dx, dy, rx, ry]) => el('ellipse', { cx: b.cx + dx, cy: b.cy + dy, rx, ry, fill: '#6b7f4a', opacity: 0.5 })).join('');
    case 'shell': { let s = ''; for (let i = -2; i <= 2; i++) s += path(`M${b.cx + i * 24 - 12} ${b.cy - b.ry * 0.7} Q${b.cx + i * 24} ${b.cy - b.ry - 4} ${b.cx + i * 24 + 12} ${b.cy - b.ry * 0.7}`, 'none', { 'stroke-width': 3 }); return s; }
    case 'biolum': return [[-30, -6], [-8, -18], [14, -4], [34, -16], [-18, 12], [24, 14]].map(([dx, dy]) => el('circle', { cx: b.cx + dx, cy: b.cy + dy, r: 9, fill: '#9ff7ff', opacity: 0.35 }) + el('circle', { cx: b.cx + dx, cy: b.cy + dy, r: 4.5, fill: '#e8ffff', stroke: '#2a9fb0', 'stroke-width': 2 })).join('');
    case 'gills': return [0, 1, 2].map((i) => path(`M${b.cx + b.rx * 0.5 + i * 9} ${b.cy - 14} q-6 14 0 28`, 'none', { 'stroke-width': 3, stroke: '#a33b52' })).join('');
    case 'blubber': return el('ellipse', { cx: b.cx + 10, cy: b.cy - b.ry * 0.45, rx: b.rx * 0.4, ry: 6, fill: '#ffffff', opacity: 0.45 });
    case 'spikes': return '';
    default: return '';
  }
}

function snout(b: BaseShape, c: typeof HUES[number]): string {
  const { hx, hy, hr } = b;
  switch (b.snout) {
    case 'point': return path(`M${hx + hr * 0.6} ${hy - 6} L${hx + hr + 22} ${hy + 8} L${hx + hr * 0.6} ${hy + 20} Z`, c.body) + circle(hx + hr + 20, hy + 8, 4.5, INK);
    case 'beak': return path(`M${hx + hr * 0.55} ${hy + 2} L${hx + hr + 10} ${hy + 12} L${hx + hr * 0.55} ${hy + 22} Z`, '#f2a03d');
    case 'wide': return path(`M${hx + 4} ${hy + hr * 0.45} Q${hx + hr * 0.6} ${hy + hr * 0.75} ${hx + hr * 0.95} ${hy + hr * 0.3}`, 'none', { 'stroke-width': 3.5 });
    case 'long': return path(`M${hx + hr * 0.6} ${hy - 4} L${hx + hr + 30} ${hy + 10} L${hx + hr * 0.6} ${hy + 16} Z`, c.body) + circle(hx + hr + 28, hy + 10, 3.5, INK);
    case 'round': return ellipse(hx + hr * 0.85, hy + 8, 14, 11, c.body) + circle(hx + hr + 6, hy + 6, 3, INK);
    default: return path(`M${hx + 6} ${hy + hr * 0.5} q10 6 18 0`, 'none', { 'stroke-width': 3 });
  }
}

function eyes(id: string, b: BaseShape): string {
  const ex = b.hx + b.hr * 0.2, ey = b.hy - b.hr * 0.18; const g = b.hr * 0.42;
  switch (id) {
    case 'owlEyes': return circle(ex - g * 0.5, ey, 13, '#fff7d6') + circle(ex + g * 0.9, ey, 13, '#fff7d6') + el('circle', { cx: ex - g * 0.5 + 3, cy: ey, r: 7, fill: INK }) + el('circle', { cx: ex + g * 0.9 + 3, cy: ey, r: 7, fill: INK }) + el('circle', { cx: ex - g * 0.5 + 5, cy: ey - 3, r: 2.5, fill: '#fff' }) + el('circle', { cx: ex + g * 0.9 + 5, cy: ey - 3, r: 2.5, fill: '#fff' });
    case 'compound': return [ex - g * 0.4, ex + g * 0.9].map((x) => ellipse(x, ey, 13, 15, '#5b3f8c') + el('path', { d: `M${x - 8} ${ey - 5} h16 M${x - 9} ${ey + 2} h18 M${x - 7} ${ey + 9} h14 M${x - 3} ${ey - 12} v24 M${x + 4} ${ey - 12} v24`, stroke: '#a98ee0', 'stroke-width': 1.5, fill: 'none' })).join('');
    case 'chameleon': return [[ex - g * 0.4, -4, -3], [ex + g * 0.9, 4, 3]].map(([x, px, py]) => circle(x, ey, 14, '#9ccc65') + circle(x, ey, 7, '#fff') + el('circle', { cx: x + px, cy: ey + py, r: 4, fill: INK })).join('');
    case 'glowEyes': return [ex - g * 0.4, ex + g * 0.9].map((x) => el('circle', { cx: x, cy: ey, r: 18, fill: '#fff59d', opacity: 0.35 }) + circle(x, ey, 10, '#fff176') + el('circle', { cx: x + 2, cy: ey, r: 4, fill: '#ff8f00' })).join('');
    case 'tinyEyes': return [ex - g * 0.3, ex + g * 0.8].map((x) => path(`M${x - 6} ${ey + 1} q6 -6 12 0`, 'none', { 'stroke-width': 3.5 })).join('');
    case 'stalkEyes': return [[ex - 6, -30], [ex + 16, -38]].map(([x, h]) => path(`M${x} ${ey + 4} L${x - 4} ${ey + h}`, 'none', { 'stroke-width': 5 }) + circle(x - 4, ey + h - 8, 10, '#fff') + el('circle', { cx: x - 1, cy: ey + h - 8, r: 4.5, fill: INK })).join('');
    default: return '';
  }
}

function headPart(id: string, b: BaseShape, c: typeof HUES[number]): string {
  const { hx, hy, hr } = b; const ty = hy - hr + 6;
  switch (id) {
    case 'bigEars': return path(`M${hx - hr * 0.7} ${ty + 10} L${hx - hr * 0.9} ${ty - 58} L${hx - 2} ${ty + 2} Z`, c.body) + path(`M${hx - hr * 0.62} ${ty + 4} L${hx - hr * 0.8} ${ty - 42} L${hx - 10} ${ty + 2} Z`, '#f7b9c4', { 'stroke-width': 2 }) + path(`M${hx + 4} ${ty + 2} L${hx + hr * 0.5} ${ty - 56} L${hx + hr * 0.8} ${ty + 12} Z`, c.body) + path(`M${hx + 10} ${ty + 4} L${hx + hr * 0.5} ${ty - 40} L${hx + hr * 0.68} ${ty + 8} Z`, '#f7b9c4', { 'stroke-width': 2 });
    case 'horns': return path(`M${hx - 10} ${ty + 6} C${hx - 30} ${ty - 30} ${hx - 70} ${ty - 34} ${hx - 76} ${ty} C${hx - 64} ${ty - 16} ${hx - 36} ${ty - 12} ${hx - 22} ${ty + 12} Z`, '#c9b48a') + path(`M${hx + 6} ${ty + 4} C${hx - 4} ${ty - 34} ${hx - 40} ${ty - 44} ${hx - 52} ${ty - 16} C${hx - 38} ${ty - 28} ${hx - 16} ${ty - 18} ${hx - 6} ${ty + 10} Z`, '#d8c69c');
    case 'crest': return [-40, -20, 0, 20].map((a, i) => { const r = ((a - 90) * Math.PI) / 180; const x2 = hx - 6 + Math.cos(r) * 52, y2 = ty + Math.sin(r) * 52; return path(`M${hx - 6} ${ty + 8} Q${(hx - 6 + x2) / 2 - 10} ${(ty + y2) / 2} ${x2} ${y2} Q${(hx - 6 + x2) / 2 + 8} ${(ty + y2) / 2 + 4} ${hx + 2} ${ty + 10} Z`, i % 2 ? '#ffd54f' : '#ff8a65'); }).join('');
    case 'gillFrills': return [-1, 1].map((side) => [0, 1, 2].map((k) => { const sx = hx + side * (hr * 0.75); const sy = hy - 14 + k * 14; const tx = sx + side * 30; const tyy = sy - 18 + k * 6; return path(`M${sx} ${sy} Q${(sx + tx) / 2} ${sy - 14} ${tx} ${tyy}`, 'none', { 'stroke-width': 7, stroke: '#e5557a' }) + path(`M${sx} ${sy} Q${(sx + tx) / 2} ${sy - 14} ${tx} ${tyy}`, 'none', { 'stroke-width': 3, stroke: '#ffb3c6' }); }).join('')).join('');
    case 'antennae': return [[-8, -58, -30], [10, -62, 6]].map(([dx, h, lean]) => path(`M${hx + dx} ${ty + 6} Q${hx + dx + lean / 2} ${ty + h / 2} ${hx + dx + lean} ${ty + h}`, 'none', { 'stroke-width': 3.5 }) + path(`M${hx + dx + lean} ${ty + h} q-12 10 -2 22 q8 -10 2 -22 q12 10 2 22`, '#c8a96e', { 'stroke-width': 2.5 })).join('');
    case 'helmet': return path(`M${hx - hr * 0.8} ${hy - 8} C${hx - hr * 0.8} ${ty - 40} ${hx + hr * 0.5} ${ty - 40} ${hx + hr * 0.55} ${hy - 12} C${hx + 10} ${hy - 22} ${hx - 20} ${hy - 20} ${hx - hr * 0.8} ${hy - 8} Z`, '#e8dcc0');
    default: return '';
  }
}

function abilityFx(id: string, b: BaseShape): string {
  const { hx, hy, hr } = b; const fx = hx + hr + 26;
  const thin = { 'stroke-width': 3, fill: 'none' };
  switch (id) {
    case 'echo': return [12, 22, 32].map((r) => path(`M${fx + r * 0.2} ${hy - r} A${r} ${r} 0 0 1 ${fx + r * 0.2} ${hy + r}`, 'none', { ...thin, stroke: '#4fc3f7' })).join('');
    case 'shock': return path(`M${b.cx - 20} ${b.cy - b.ry - 26} l10 14 l-8 4 l12 16`, 'none', { 'stroke-width': 4, stroke: '#ffd600' }) + path(`M${b.cx + 30} ${b.cy - b.ry - 20} l8 12 l-8 4 l10 14`, 'none', { 'stroke-width': 4, stroke: '#ffd600' });
    case 'ink': return [[-80, 40, 12], [-96, 24, 8], [-70, 58, 7]].map(([dx, dy, r]) => el('circle', { cx: b.cx + dx, cy: b.cy + dy, r, fill: '#3b2e4a', opacity: 0.8 })).join('');
    case 'regen': return [[-40, -70], [50, -60], [10, -86]].map(([dx, dy]) => path(`M${b.cx + dx - 7} ${b.cy + dy} h14 M${b.cx + dx} ${b.cy + dy - 7} v14`, 'none', { 'stroke-width': 4, stroke: '#43a047' })).join('');
    case 'mimicry': return path(`M${fx} ${hy - 30} v-20 l14 -4 v20`, 'none', { 'stroke-width': 3 }) + el('circle', { cx: fx - 4, cy: hy - 30, r: 5, fill: INK }) + el('circle', { cx: fx + 10, cy: hy - 34, r: 5, fill: INK });
    case 'heatPits': return [0, 1, 2].map((i) => path(`M${fx - 6 + i * 10} ${hy + 20} q-6 -10 0 -20 q6 -10 0 -20`, 'none', { ...thin, stroke: '#ef5350' })).join('');
    case 'smell': return path(`M${fx - 4} ${hy + 6} q10 -10 20 0 q10 10 20 0`, 'none', { ...thin, stroke: '#8d6e63' }) + path(`M${fx} ${hy - 6} q10 -10 20 0 q10 10 20 0`, 'none', { ...thin, stroke: '#8d6e63' });
    case 'pressure': return [[-70, -40, 6], [-84, -60, 4], [70, -50, 5], [80, -30, 3]].map(([dx, dy, r]) => el('circle', { cx: b.cx + dx, cy: b.cy + dy, r, fill: '#e1f5fe', stroke: '#4fc3f7', 'stroke-width': 2 })).join('');
    default: return '';
  }
}

function tint(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}

export function creatureSvg(c: CreatureConfig, opts: { width?: number; idPrefix?: string } = {}): string {
  // unique gradient/filter ids per creature so several can share one page
  const id = opts.idPrefix ?? `cr${Math.abs([...(c.base + c.head + c.eyes + c.limbs + c.tail + c.adaptation + c.ability + c.hue)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7))}`;
  const raw = BASE_SHAPES[c.base] ?? BASE_SHAPES.fennec;
  const col = HUES[c.hue] ?? HUES[0];
  const b: BaseShape = c.adaptation === 'blubber' ? { ...raw, rx: raw.rx * 1.1, ry: raw.ry * 1.12 } : raw;
  let s = '';
  // back layer
  s += tail(c.tail, b, col);
  if (c.limbs === 'wings') s += wings(b, col);
  s += legs(c.limbs, b, col, false);
  s += adaptationBack(c.adaptation, b, col);
  // body
  // volume: light from upper-left, belly glow, rim light on the shadow side
  s += ellipse(b.cx, b.cy, b.rx, b.ry, `url(#${id}-body)`);
  s += el('ellipse', { cx: b.cx + 8, cy: b.cy + b.ry * 0.35, rx: b.rx * 0.62, ry: b.ry * 0.45, fill: `url(#${id}-belly)` });
  s += el('ellipse', { cx: b.cx, cy: b.cy, rx: b.rx - 3, ry: b.ry - 3, fill: 'none', stroke: 'rgba(255,236,200,.35)', 'stroke-width': 2.5, 'stroke-dasharray': `${b.rx * 0.9} ${b.rx * 9}`, 'stroke-dashoffset': `${-b.rx * 0.2}` });
  if (c.base === 'pangolin') for (let i = -2; i <= 2; i++) s += path(`M${b.cx + i * 22 - 10} ${b.cy - 12} q10 12 20 0`, 'none', { 'stroke-width': 2.5 });
  s += adaptationFront(c.adaptation, b, col);
  s += legs(c.limbs, b, col, true);
  // head
  if (b.neck) s += path(`M${b.cx + b.rx * 0.55} ${b.cy - b.ry * 0.5} L${b.hx - 18} ${b.hy + 10} L${b.hx + 6} ${b.hy + 18} L${b.cx + b.rx * 0.9} ${b.cy - b.ry * 0.2} Z`, col.body);
  s += headPart(c.head === 'gillFrills' ? 'gillFrills' : '', b, col); // gills sit behind the head
  s += circle(b.hx, b.hy, b.hr, `url(#${id}-head)`);
  s += el('ellipse', { cx: b.hx + b.hr * 0.6, cy: b.hy + b.hr * 0.35, rx: 6, ry: 4, fill: '#f48fb1', opacity: 0.6 });
  s += snout(b, col);
  s += eyes(c.eyes, b);
  if (c.head !== 'gillFrills') s += headPart(c.head, b, col);
  s += abilityFx(c.ability, b);
  const w = opts.width ? ` width="${opts.width}" height="${Math.round(opts.width * 0.8)}"` : '';
  const defs = `<defs>
    <radialGradient id="${id}-body" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="${tint(col.body, 1.18)}"/><stop offset="55%" stop-color="${col.body}"/><stop offset="100%" stop-color="${col.dark}"/></radialGradient>
    <radialGradient id="${id}-head" cx="35%" cy="28%" r="80%"><stop offset="0%" stop-color="${tint(col.body, 1.22)}"/><stop offset="60%" stop-color="${col.body}"/><stop offset="100%" stop-color="${col.dark}"/></radialGradient>
    <radialGradient id="${id}-belly" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="${col.belly}"/><stop offset="100%" stop-color="${col.belly}" stop-opacity=".55"/></radialGradient>
    <filter id="${id}-grain" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComponentTransfer in="g" result="g2"><feFuncA type="linear" slope="0.18"/></feComponentTransfer><feComposite in="g2" in2="SourceGraphic" operator="in" result="gm"/><feBlend in="SourceGraphic" in2="gm" mode="multiply"/></filter>
  </defs>`;
  const shadow = el('ellipse', { cx: b.cx + 10, cy: b.cy + b.ry + 52, rx: b.rx * 1.05, ry: 10, fill: 'rgba(0,0,0,.28)' });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -10 340 272"${w} role="img" aria-label="${escapeXml(c.name)}">${defs}${shadow}<g filter="url(#${id}-grain)">${s}</g></svg>`;
}

export function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]!));
}
