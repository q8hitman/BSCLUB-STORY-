// Painterly hybrid-creature renderer (v2).
// One SVG string is used everywhere: builder, naming, status panel, reactions, ending and the PNG share card.
//
// How it stays coherent instead of "shapes glued together":
//  • Every base animal has a body PLAN (torso, head profile, neck, hips, eye/nose anchors) built from smooth splines.
//  • All skin-covered parts (torso, neck, head, legs, tail, hump, fur tufts) are drawn as ONE union: a thick outline
//    pass under a fill pass, so only the outer silhouette gets an outline and the joints melt together.
//  • Shading uses one shared light (userSpaceOnUse gradients) + rim light / core shadow masks clipped to the silhouette.
//  • Covering textures (fur strokes, scales, feathers, glossy skin, keratin plates) are generated procedurally and
//    clipped to the silhouette; a light displacement + grain filter gives a hand-painted edge.
//  • Expressions change lids, pupils, brows, mouth, ears and posture — never anatomy. Marks (mud, frost…) paint on top.
import { HUES } from '../content/parts';
import type { CreatureConfig } from '../engine/types';

export type Expression = 'neutral' | 'curious' | 'happy' | 'frightened' | 'suspicious' | 'confident' | 'tired' | 'surprised';
export type CreatureMark = 'mud' | 'frost' | 'dust' | 'wet' | 'glow' | 'soot' | 'scratches' | 'fatigue';
export const EXPRESSIONS: Expression[] = ['neutral', 'curious', 'happy', 'frightened', 'suspicious', 'confident', 'tired', 'surprised'];

type P = [number, number];
const GROUND = 272;
const f = (n: number) => (Math.round(n * 10) / 10).toString();

// ───────────────────────── geometry helpers ─────────────────────────
/** Catmull-Rom spline through points → cubic Bézier path. */
// Extents of everything drawn (reset per creature) → the viewBox frames the whole animal, nothing is cut off.
let BB = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
function track(pts: P[]) { for (const [x, y] of pts) { if (x < BB.x0) BB.x0 = x; if (x > BB.x1) BB.x1 = x; if (y < BB.y0) BB.y0 = y; if (y > BB.y1) BB.y1 = y; } }
function spline(pts: P[], closed = true, tension = 1): string {
  const n = pts.length; if (n < 2) return '';
  track(pts);
  const get = (i: number): P => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const k = tension / 6;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) * k)} ${f(p1[1] + (p2[1] - p0[1]) * k)} ${f(p2[0] - (p3[0] - p1[0]) * k)} ${f(p2[1] - (p3[1] - p1[1]) * k)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? `${d} Z` : d;
}

/** A tapered organic limb/tail/tentacle outline from a joint chain of [x, y, width]. */
function tube(chain: [number, number, number][], capTip = 0.55, capBase = 0.35): P[] {
  const L: P[] = [], R: P[] = [];
  chain.forEach(([x, y, w], i) => {
    const a = chain[Math.max(0, i - 1)], b = chain[Math.min(chain.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    L.push([x - dy * w / 2, y + dx * w / 2]); R.push([x + dy * w / 2, y - dx * w / 2]);
  });
  const t = chain[chain.length - 1], t0 = chain[chain.length - 2];
  let tx = t[0] - t0[0], ty = t[1] - t0[1]; const tm = Math.hypot(tx, ty) || 1; tx /= tm; ty /= tm;
  const tip: P = [t[0] + tx * t[2] * capTip, t[1] + ty * t[2] * capTip];
  const s = chain[0], s1 = chain[1];
  let sx = s[0] - s1[0], sy = s[1] - s1[1]; const sm = Math.hypot(sx, sy) || 1; sx /= sm; sy /= sm;
  const base: P = [s[0] + sx * s[2] * capBase, s[1] + sy * s[2] * capBase];
  return [...L, tip, ...R.reverse(), base];
}

const rot = (p: P, c: P, deg: number): P => { const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a); const x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ───────────────────────── colour helpers ─────────────────────────
function hex(h: string): [number, number, number] { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb(c: [number, number, number]) { return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`; }
function mix(a: string, b: string, t: number) { const x = hex(a), y = hex(b); return rgb([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]); }
const shade = (c: string, t: number) => mix(c, '#140d08', t);
const light = (c: string, t: number) => mix(c, '#fff4dc', t);

/** Muted, natural palette derived from the chosen hue (less candy, more illustration). */
function palette(hue: number) {
  const h = HUES[hue] ?? HUES[0];
  const body = mix(h.body, '#8a7258', 0.22);
  return {
    body, dark: mix(h.dark, '#3b2a1e', 0.25), belly: mix(h.belly, '#efe2c8', 0.25),
    hi: light(body, 0.38), lo: shade(body, 0.42), ink: shade(mix(h.dark, '#2a1c12', 0.35), 0.5),
    accent: h.dark,
  };
}
type Pal = ReturnType<typeof palette>;

function seeded(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ───────────────────────── body plans ─────────────────────────
type Cover = 'fur' | 'skin' | 'scales' | 'feathers' | 'plates' | 'smooth';
type HeadShape = 'fox' | 'camel' | 'owl' | 'frog' | 'gecko' | 'axolotl' | 'pangolin' | 'octo';
interface Plan {
  cover: Cover; head: HeadShape;
  tx: number; ty: number; len: number; h: number; arch: number; sag: number; tilt: number;
  hx: number; hy: number; hr: number;
  neck: number; legW: number;
  ears: 'fox' | 'camel' | 'tuft' | 'small' | 'none';
  eye: P; // relative to head (units of hr)
  far: P | null; // far eye (front-facing heads show both)
  eyeR: number;
  nose: P; mouth: [P, P];
}

const PLANS: Record<string, Plan> = {
  fennec: { cover: 'fur', head: 'fox', tx: 168, ty: 182, len: 150, h: 72, arch: 8, sag: 6, tilt: 0, hx: 262, hy: 132, hr: 34, neck: 1, legW: 15, ears: 'fox', eye: [0.48, -0.22], far: null, eyeR: 0.24, nose: [1.52, 0.32], mouth: [[1.38, 0.5], [0.85, 0.52]] },
  axolotl: { cover: 'skin', head: 'axolotl', tx: 166, ty: 204, len: 176, h: 62, arch: 3, sag: 8, tilt: 0, hx: 272, hy: 192, hr: 40, neck: 0.4, legW: 14, ears: 'none', eye: [0.6, -0.3], far: null, eyeR: 0.17, nose: [1.3, 0.12], mouth: [[1.22, 0.36], [0.45, 0.46]] },
  gecko: { cover: 'scales', head: 'gecko', tx: 168, ty: 214, len: 172, h: 50, arch: 4, sag: 4, tilt: 0, hx: 274, hy: 200, hr: 31, neck: 0.5, legW: 12, ears: 'none', eye: [0.5, -0.26], far: null, eyeR: 0.27, nose: [1.45, 0.08], mouth: [[1.4, 0.26], [0.5, 0.38]] },
  owl: { cover: 'feathers', head: 'owl', tx: 186, ty: 184, len: 104, h: 112, arch: 4, sag: 4, tilt: -64, hx: 214, hy: 104, hr: 50, neck: 0.2, legW: 13, ears: 'tuft', eye: [0.42, -0.12], far: [-0.18, -0.14], eyeR: 0.25, nose: [0.16, 0.18], mouth: [[0.16, 0.38], [0.16, 0.38]] },
  camel: { cover: 'fur', head: 'camel', tx: 160, ty: 168, len: 166, h: 76, arch: 6, sag: 6, tilt: 0, hx: 300, hy: 86, hr: 26, neck: 3, legW: 15, ears: 'camel', eye: [0.3, -0.32], far: null, eyeR: 0.22, nose: [1.66, 0.28], mouth: [[1.62, 0.62], [1.0, 0.62]] },
  frog: { cover: 'skin', head: 'frog', tx: 172, ty: 210, len: 120, h: 70, arch: 14, sag: 2, tilt: -12, hx: 244, hy: 202, hr: 42, neck: 0, legW: 16, ears: 'none', eye: [0.3, -0.62], far: [-0.2, -0.66], eyeR: 0.24, nose: [1.32, 0.1], mouth: [[1.3, 0.3], [0.1, 0.36]] },
  pangolin: { cover: 'plates', head: 'pangolin', tx: 164, ty: 194, len: 184, h: 84, arch: 16, sag: 4, tilt: 0, hx: 272, hy: 210, hr: 27, neck: 0.6, legW: 15, ears: 'small', eye: [0.35, -0.22], far: null, eyeR: 0.17, nose: [1.72, 0.28], mouth: [[1.66, 0.38], [1.0, 0.44]] },
  octopus: { cover: 'smooth', head: 'octo', tx: 182, ty: 140, len: 130, h: 104, arch: 0, sag: 0, tilt: -38, hx: 240, hy: 196, hr: 40, neck: 0.3, legW: 13, ears: 'none', eye: [0.38, -0.22], far: null, eyeR: 0.24, nose: [1.0, 0.25], mouth: [[0.9, 0.48], [0.6, 0.55]] },
};

const HEAD_PTS: Record<HeadShape, P[]> = {
  fox: [[-0.9, -0.05], [-0.62, -0.72], [0, -0.92], [0.55, -0.62], [1.02, -0.12], [1.5, 0.22], [1.56, 0.4], [1.2, 0.56], [0.55, 0.72], [-0.2, 0.8], [-0.8, 0.45]],
  camel: [[-0.8, -0.2], [-0.45, -0.72], [0.25, -0.76], [0.92, -0.42], [1.5, -0.08], [1.78, 0.32], [1.7, 0.72], [1.2, 0.84], [0.5, 0.66], [-0.2, 0.72], [-0.74, 0.4]],
  owl: [[-1.02, 0.02], [-0.8, -0.72], [-0.1, -1.0], [0.6, -0.86], [1.0, -0.2], [0.92, 0.52], [0.4, 0.92], [-0.35, 0.94], [-0.88, 0.56]],
  frog: [[-0.95, 0.08], [-0.72, -0.46], [-0.1, -0.62], [0.62, -0.56], [1.18, -0.24], [1.4, 0.12], [1.26, 0.42], [0.5, 0.58], [-0.3, 0.6], [-0.86, 0.42]],
  gecko: [[-0.92, 0.02], [-0.6, -0.54], [0.1, -0.64], [0.92, -0.42], [1.46, -0.06], [1.52, 0.18], [1.2, 0.44], [0.4, 0.54], [-0.42, 0.56], [-0.86, 0.34]],
  axolotl: [[-0.9, 0.02], [-0.66, -0.58], [0.02, -0.74], [0.78, -0.62], [1.26, -0.24], [1.36, 0.16], [1.14, 0.5], [0.5, 0.64], [-0.3, 0.64], [-0.86, 0.4]],
  pangolin: [[-0.86, 0.02], [-0.5, -0.6], [0.24, -0.58], [0.86, -0.32], [1.62, 0.06], [1.78, 0.26], [1.62, 0.42], [0.92, 0.46], [0.2, 0.62], [-0.5, 0.56], [-0.86, 0.3]],
  octo: [[-0.95, -0.1], [-0.6, -0.72], [0.1, -0.86], [0.75, -0.6], [1.04, -0.05], [0.96, 0.5], [0.5, 0.82], [-0.2, 0.86], [-0.8, 0.5]],
};

// ───────────────────────── expressions ─────────────────────────
interface Ex { lidT: number; lidB: number; pupil: number; gaze: P; brow: number; browTilt: number; mouth: number; open: number; ear: number; crouch: number; headDy: number; headRot: number; bristle: number; tail: number }
const EX: Record<Expression, Ex> = {
  neutral: { lidT: 0.18, lidB: 0.05, pupil: 1, gaze: [0.35, 0], brow: 0, browTilt: 0, mouth: 0.15, open: 0, ear: 0, crouch: 0, headDy: 0, headRot: 0, bristle: 0, tail: 0 },
  curious: { lidT: 0.04, lidB: 0, pupil: 1.25, gaze: [0.55, -0.25], brow: 0.5, browTilt: 0.2, mouth: 0.2, open: 0.1, ear: 0.35, crouch: -2, headDy: -4, headRot: -9, bristle: 0, tail: 0.3 },
  happy: { lidT: 0.12, lidB: 0.42, pupil: 1.1, gaze: [0.2, 0], brow: 0.35, browTilt: 0, mouth: 1, open: 0.25, ear: 0.25, crouch: -3, headDy: -3, headRot: -4, bristle: 0, tail: 0.6 },
  frightened: { lidT: 0, lidB: 0, pupil: 0.45, gaze: [-0.1, 0.1], brow: 0.6, browTilt: -0.8, mouth: -0.7, open: 0.35, ear: -1, crouch: 9, headDy: 7, headRot: 6, bristle: 1, tail: -0.8 },
  suspicious: { lidT: 0.5, lidB: 0.28, pupil: 0.75, gaze: [-0.5, 0.05], brow: -0.4, browTilt: 0.5, mouth: -0.25, open: 0, ear: -0.3, crouch: 3, headDy: 2, headRot: 3, bristle: 0.2, tail: -0.2 },
  confident: { lidT: 0.3, lidB: 0.08, pupil: 0.95, gaze: [0.5, 0], brow: -0.15, browTilt: 0.15, mouth: 0.55, open: 0, ear: 0.2, crouch: -5, headDy: -7, headRot: -6, bristle: 0, tail: 0.5 },
  tired: { lidT: 0.62, lidB: 0.12, pupil: 0.9, gaze: [0.2, 0.35], brow: -0.1, browTilt: -0.6, mouth: -0.3, open: 0, ear: -0.7, crouch: 6, headDy: 10, headRot: 10, bristle: 0, tail: -0.6 },
  surprised: { lidT: 0, lidB: 0, pupil: 0.55, gaze: [0.3, -0.1], brow: 1, browTilt: 0, mouth: 0, open: 0.8, ear: 0.6, crouch: -4, headDy: -6, headRot: -10, bristle: 0.6, tail: 0.4 },
};
/** Story feelings (engine/condition.ts) → drawn expression. */
export const FEELING_EXPRESSION: Record<string, Expression> = {
  curious: 'curious', calm: 'neutral', confident: 'confident', afraid: 'frightened', excited: 'surprised', exhausted: 'tired', hurt: 'tired', proud: 'happy',
};

// ───────────────────────── renderer ─────────────────────────
export interface CreatureSvgOpts { width?: number; idPrefix?: string; expression?: Expression; marks?: CreatureMark[]; ground?: boolean; /** 'face' frames the head for small reaction thumbnails */ crop?: 'full' | 'face' }

export function creatureSvg(c: CreatureConfig, opts: CreatureSvgOpts = {}): string {
  BB = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const key = `${c.base}${c.head}${c.eyes}${c.limbs}${c.tail}${c.adaptation}${c.ability}${c.hue}`;
  const hash = Math.abs([...key].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7));
  const ex = EX[opts.expression ?? 'neutral'] ?? EX.neutral;
  const id = `${opts.idPrefix ?? `cr${hash}`}${opts.expression && opts.expression !== 'neutral' ? opts.expression.slice(0, 3) : ''}`;
  const rnd = seeded(hash); // identity-stable randomness: same creature → same fur, spots and scales
  const base = PLANS[c.base] ? c.base : 'fennec';
  const pl0 = PLANS[base];
  const pal = palette(c.hue);
  const blub = c.adaptation === 'blubber' ? 1.12 : 1;
  const hairy = c.adaptation === 'thickFur';
  const spring = c.limbs === 'springLegs';
  const tent = c.limbs === 'tentacles';

  // posture (expression): crouch lowers the body, head drops/rises and tilts
  // character proportions: slightly larger head and eyes than the real animal so emotions read at small sizes
  const pl: Plan = { ...pl0, ty: pl0.ty + ex.crouch * 0.9, h: pl0.h * blub, len: pl0.len * (blub > 1 ? 1.04 : 1), hy: pl0.hy + ex.headDy + ex.crouch * 0.8, hr: pl0.hr * 1.16, eyeR: pl0.eyeR * 1.18 };
  if (spring) { pl.tilt = (pl.tilt || 0) - (base === 'owl' ? 0 : 8); pl.ty -= 8; pl.hy -= 12; }
  if (tent && base !== 'octopus') { pl.ty += 8; pl.hy += 8; }

  const skin: string[] = []; // union parts (single silhouette)
  const far: string[] = []; // far-side parts drawn behind, darker
  const over: string[] = []; // details on top of the body
  const hard: string[] = []; // keratin / bone / non-skin parts with their own outline
  const fx: string[] = []; // glows and effects
  const OW = 2.2;
  const ink = pal.ink;
  const pathEl = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

  // ── torso ──
  const { tx, ty, len, h } = pl;
  const tc: P = [tx, ty];
  const torsoPts: P[] = [
    [tx - len / 2, ty - h * 0.12], [tx - len * 0.22, ty - h / 2 - pl.arch], [tx + len * 0.2, ty - h * 0.5 - pl.arch * 0.4], [tx + len * 0.44, ty - h * 0.3],
    [tx + len / 2, ty + h * 0.06], [tx + len * 0.34, ty + h * 0.44], [tx, ty + h / 2 + pl.sag], [tx - len * 0.32, ty + h * 0.42], [tx - len / 2 + 2, ty + h * 0.22],
  ].map((p) => rot(p as P, tc, pl.tilt));
  const torso = spline(torsoPts);
  const T = (u: number, v: number): P => rot([tx + u * len / 2, ty + v * h / 2], tc, pl.tilt); // torso-local coords (-1..1)

  // anchors
  const hipBack = T(-0.58, 0.32), hipFront = T(0.55, 0.3), tailRoot = T(-0.94, -0.1), withers = T(0.42, -0.62);
  const H = (u: number, v: number): P => rot([pl.hx + u * pl.hr, pl.hy + v * pl.hr], [pl.hx, pl.hy], ex.headRot);
  const headPts = HEAD_PTS[pl.head].map(([u, v]) => H(u, v));
  const head = spline(headPts);

  // ── tail (behind / union) ──
  const tailParts = tailShape(c.tail, tailRoot, pl, pal, ex, rnd, id);
  skin.push(...tailParts.skin); far.push(...tailParts.far); hard.push(...tailParts.hard); fx.push(...tailParts.fx); over.push(...tailParts.over);

  // ── legs ──
  const legs = limbShapes(c.limbs, base, pl, hipBack, hipFront, pal, ex, rnd, T);
  far.push(...legs.far); skin.push(...legs.skin); hard.push(...legs.hard); over.push(...legs.over);

  // ── body ──
  skin.push(torso);
  // neck: a soft bridge from withers to the back of the head
  const neckBase = T(0.5, -0.2), neckBack = T(0.18, -0.7), hb = H(-0.7, 0.35), ht = H(-0.55, -0.45);
  if (base === 'camel') {
    skin.push(spline(tube([[neckBase[0] - 6, neckBase[1] + 6, 46], [lerp(neckBase[0], hb[0], 0.4), lerp(neckBase[1], hb[1], 0.55) + 6, 30], [hb[0] + 4, hb[1] - 4, 24]], 0.3, 0.3)));
  } else if (base !== 'owl' && base !== 'frog') {
    skin.push(spline([neckBack, ht, H(0.1, 0.1), hb, T(0.62, 0.18), neckBase]));
  }
  // natural hump (camel) + adaptation hump
  if (base === 'camel') skin.push(spline([T(-0.42, -0.86), T(-0.2, -1.6), T(0.12, -1.55), T(0.3, -0.9)]));
  if (c.adaptation === 'hump') { const k = base === 'camel' ? 0.42 : 0; skin.push(spline([T(-0.1 + k * 0.4, -0.86), T(0.08 + k * 0.5, -1.62 + k * 0.1), T(0.38 + k * 0.4, -1.5 + k * 0.1), T(0.52 + k * 0.3, -0.84)])); }
  // ears go behind the head in the union
  const ears = earShapes(base, c.head, pl, H, ex, pal);
  far.push(...ears.far); skin.push(...ears.skin); over.push(...ears.over);
  // frog eye domes
  if (base === 'frog') far.push(pathEl(spline(circlePts(H(-0.2, -0.64), pl.hr * 0.3)), pal.lo));
  skin.push(head);
  // fur tufts on the silhouette (fur covers and thick fur)
  if (pl.cover === 'fur' || hairy) {
    const tufts = furTufts(torsoPts, rnd, hairy ? 1.5 : base === 'camel' ? 0.45 : 0.85, ex.bristle);
    skin.push(...tufts);
    if (hairy) skin.push(...furTufts(headPts, rnd, 1.1, ex.bristle, true, HEAD_PTS[pl.head].map(([u, v]) => [u, v] as P)));
    if (hairy && base !== 'owl') skin.push(spline([T(0.3, -0.8), H(-0.9, -0.5), H(-1.25, 0.2), H(-0.8, 0.9), T(0.75, 0.5), T(0.4, 0.2)])); // mane/ruff
  }

  // ── silhouette clip + shading ──
  const sil = skin.map((d) => `<path d="${d}"/>`).join('');
  const lightAt = [tx - 60, ty - 120];

  // covering textures (clipped)
  const tex = coverTexture(c, base, pl, pal, rnd, torsoPts, headPts, T, H);

  // species markings (clipped)
  const marks = speciesMarkings(base, c, pl, pal, rnd, T, H);

  // ── head details ──
  const face = faceDetails(c, base, pl, pal, ex, H, rnd, id);

  // ── adaptations on top ──
  const adapt = adaptation(c.adaptation, pl, pal, ex, rnd, T, torsoPts, H, id);
  // ── head part (horns, crest, frills, antennae, helmet) ──
  const hp = headPart(c.head, pl, pal, ex, H, rnd, id);
  // ── ability: integrated anatomy + subtle effect ──
  const ab = ability(c.ability, pl, pal, ex, H, T, rnd, id);
  // ── wings in front ──
  const wingNear = legs.wingNear;

  // ── condition marks ──
  const cond = conditionMarks(opts.marks ?? [], pl, pal, rnd, T, torsoPts, id);

  const bodyGrad = `<radialGradient id="${id}-b" gradientUnits="userSpaceOnUse" cx="${f(lightAt[0])}" cy="${f(lightAt[1])}" r="300"><stop offset="0" stop-color="${pal.hi}"/><stop offset=".45" stop-color="${pal.body}"/><stop offset="1" stop-color="${pal.lo}"/></radialGradient>`;
  const farGrad = `<linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(pal.body, 0.35)}"/><stop offset="1" stop-color="${shade(pal.body, 0.55)}"/></linearGradient>`;
  const bellyGrad = `<linearGradient id="${id}-bl" gradientUnits="userSpaceOnUse" x1="0" y1="${f(ty - h * 0.1)}" x2="0" y2="${f(ty + h * 0.6)}"><stop offset="0" stop-color="${pal.belly}" stop-opacity="0"/><stop offset=".55" stop-color="${pal.belly}" stop-opacity=".75"/><stop offset="1" stop-color="${pal.belly}" stop-opacity=".9"/></linearGradient>`;
  const coreGrad = `<linearGradient id="${id}-cs" gradientUnits="userSpaceOnUse" x1="0" y1="${f(ty - h)}" x2="0" y2="${f(GROUND)}"><stop offset=".45" stop-color="#1b120b" stop-opacity="0"/><stop offset="1" stop-color="#1b120b" stop-opacity=".55"/></linearGradient>`;
  const headGrad = `<radialGradient id="${id}-h" gradientUnits="userSpaceOnUse" cx="${f(pl.hx - pl.hr * 0.5)}" cy="${f(pl.hy - pl.hr * 0.7)}" r="${f(pl.hr * 2.4)}"><stop offset="0" stop-color="${light(pal.body, 0.45)}"/><stop offset=".5" stop-color="${pal.body}"/><stop offset="1" stop-color="${shade(pal.body, 0.3)}"/></radialGradient>`;
  const defs = `<defs>${bodyGrad}${farGrad}${bellyGrad}${coreGrad}
    <clipPath id="${id}-s">${sil}</clipPath><clipPath id="${id}-hc"><path d="${head}"/></clipPath>${headGrad}
    <mask id="${id}-rim" maskUnits="userSpaceOnUse" x="-40" y="-40" width="480" height="400"><g fill="#fff">${sil}</g><g fill="#000" transform="translate(5 6)">${sil}</g></mask>
    <mask id="${id}-sh" maskUnits="userSpaceOnUse" x="-40" y="-40" width="480" height="400"><g fill="#fff">${sil}</g><g fill="#000" transform="translate(-7 -9)">${sil}</g></mask>
    <filter id="${id}-paint" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="${hash % 97}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" result="d"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComponentTransfer in="g" result="g2"><feFuncA type="linear" slope="0.16"/></feComponentTransfer><feComposite in="g2" in2="d" operator="in" result="gm"/><feBlend in="d" in2="gm" mode="multiply"/></filter>
    <filter id="${id}-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="${id}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
    ${tex.defs}${face.defs}${cond.defs}
  </defs>`;

  const silhouette = `<g>${skin.map((d) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${OW * 2}" stroke-linejoin="round"/>`).join('')}</g>`
    + `<g fill="url(#${id}-b)">${skin.map((d) => `<path d="${d}"/>`).join('')}</g>`;
  const shading = `<g clip-path="url(#${id}-s)">`
    + `<rect x="-40" y="${f(ty - h * 0.1)}" width="480" height="300" fill="url(#${id}-bl)"/>`
    + `<g filter="url(#${id}-blur)" opacity=".5">${paintBlobs(pl, pal, rnd)}</g>`
    + marks + tex.body
    + `<rect x="-40" y="-40" width="480" height="400" fill="url(#${id}-cs)"/>`
    + `</g>`
    + `<rect x="-40" y="-40" width="480" height="400" fill="${pal.hi}" opacity=".38" mask="url(#${id}-rim)"/>`
    + `<rect x="-40" y="-40" width="480" height="400" fill="#140c06" opacity=".32" mask="url(#${id}-sh)"/>`;

  // The head is painted again on top of the body with its own outline and light, so it always reads as a HEAD
  // (skull/jaw line where it meets the neck) instead of melting into the torso.
  const domes = base === 'frog' ? [spline(circlePts(H(0.3, -0.6), pl.hr * 0.36))] : [];
  const headLayer = `<path d="${head}" fill="url(#${id}-h)" stroke="${ink}" stroke-width="${OW}" stroke-linejoin="round"/>`
    + `<g clip-path="url(#${id}-hc)">${tex.body}${marks}<path d="${head}" fill="none" stroke="${pal.lo}" stroke-width="${f(pl.hr * 0.35)}" opacity=".35" transform="translate(${f(pl.hr * 0.12)} ${f(pl.hr * 0.16)})"/></g>`
    + `<path d="${spline(headPts.slice(0, 4), false)}" fill="none" stroke="${pal.hi}" stroke-width="2.5" opacity=".45" stroke-linecap="round" transform="translate(3 4)"/>`
    + domes.map((d) => `<path d="${d}" fill="url(#${id}-h)" stroke="${ink}" stroke-width="${OW}"/>`).join('');
  const shadow = opts.ground === false ? '' : `<ellipse cx="${f(tx + 18)}" cy="${GROUND + 4}" rx="${f(len * 0.72)}" ry="11" fill="#000" opacity=".32" filter="url(#${id}-soft)"/>`;
  const farG = far.length ? `<g fill="url(#${id}-f)" stroke="${ink}" stroke-width="${OW}" stroke-linejoin="round">${far.join('')}</g>` : '';
  const w = opts.width ? ` width="${opts.width}" height="${Math.round(opts.width * 0.8)}"` : '';
  // frame: whole creature + shadow, 5:4, ground near the bottom, centred horizontally
  const pad = 16;
  let vx0 = Math.min(BB.x0, tx - len * 0.75) - pad, vx1 = Math.max(BB.x1, tx + len * 0.75) + pad;
  let vy0 = Math.min(BB.y0, ty - h) - pad; const vy1 = GROUND + 22;
  let vw = vx1 - vx0, vh = vy1 - vy0;
  if (vw / vh > 1.25) { const nh = vw / 1.25; vy0 = vy1 - nh; vh = nh; } else { const nw = vh * 1.25; const cx = (vx0 + vx1) / 2; vx0 = cx - nw / 2; vx1 = cx + nw / 2; vw = nw; }
  let viewBox = `${f(vx0)} ${f(vy0)} ${f(vw)} ${f(vh)}`;
  if (opts.crop === 'face') { const fw = pl.hr * 4.8, fh = fw / 1.25; viewBox = `${f(pl.hx - fw * 0.36)} ${f(pl.hy - fh * 0.55)} ${f(fw)} ${f(fh)}`; }
  const art = `<g filter="url(#${id}-paint)">${farG}${hard.filter((s) => s.startsWith('<!--back-->')).join('')}${silhouette}${shading}${adapt.under}${legs.contour}${headLayer}${over.join('')}${adapt.over}${face.body}${hp}${wingNear}${hard.filter((s) => !s.startsWith('<!--back-->')).join('')}${ab.body}${cond.body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${w} role="img" aria-label="${escapeXml(c.name)}">${defs}${shadow}${art}${fx.join('')}${ab.fx}${adapt.fx}${cond.fx}</svg>`;
}

// ───────────────────────── parts ─────────────────────────
/** Large soft patches of warmer / cooler paint so surfaces are not flat vector fills. */
function paintBlobs(pl: Plan, pal: Pal, rnd: () => number) {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const x = pl.tx - pl.len * 0.7 + rnd() * pl.len * 1.6, y = pl.ty - pl.h * 1.2 + rnd() * pl.h * 1.6;
    const col = [pal.hi, pal.lo, mix(pal.body, '#c0703c', 0.35), mix(pal.body, '#5a6a80', 0.3)][i % 4];
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(18 + rnd() * 30)}" ry="${f(12 + rnd() * 20)}" fill="${col}"/>`;
  }
  return s;
}

function circlePts(c: P, r: number, n = 8, sq = 1): P[] { return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * sq] as P; }); }

function furTufts(outline: P[], rnd: () => number, size: number, bristle: number, topOnly = true, ref: P[] = outline): string[] {
  // flame-shaped tufts rooted INSIDE the shape and pointing outward → a soft, furry silhouette, never detached bits
  const out: string[] = [];
  const n = outline.length;
  const cx = outline.reduce((t, p) => t + p[0], 0) / n, cy = outline.reduce((t, p) => t + p[1], 0) / n;
  for (let i = 0; i < n; i++) {
    const a = outline[i], b = outline[(i + 1) % n];
    for (let k = 0; k < 2; k++) {
      const t = (k + 0.3 + rnd() * 0.4) / 2;
      const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
      // which edges count as "top" is decided on the unposed shape, so expressions never add or remove tufts
      const ra = ref[i], rb = ref[(i + 1) % n], rcy = ref.reduce((q, p) => q + p[1], 0) / n;
      if (topOnly && lerp(ra[1], rb[1], t) > rcy + 4) continue;
      let ox = x - cx, oy = y - cy; const om = Math.hypot(ox, oy) || 1; ox /= om; oy /= om;
      const L = (6 + rnd() * 6) * size * (1 + bristle * 0.7);
      const tip: P = [x + ox * L - L * 0.45, y + oy * L - L * 0.1]; // swept back (towards the tail)
      const tx = -oy, ty = ox; // tangent
      out.push(spline([[x - tx * 6 - ox * 5, y - ty * 6 - oy * 5], tip, [x + tx * 6 - ox * 5, y + ty * 6 - oy * 5], [x - ox * 10, y - oy * 10]], true, 0.7));
    }
  }
  return out;
}

function earShapes(base: string, headPart: string, pl: Plan, H: (u: number, v: number) => P, ex: Ex, pal: Pal) {
  const skin: string[] = [], far: string[] = [], over: string[] = [];
  const big = headPart === 'bigEars';
  const kind = big ? 'big' : pl.ears;
  if (kind === 'none') return { skin, far, over };
  const er = ex.ear * 34; // positive = perked forward/up, negative = flattened back
  const ear = (root: P, len: number, wid: number, back: number, isFar: boolean) => {
    const tipBase: P = [root[0] - back * len, root[1] - len];
    const tip = rot(tipBase, root, -er * (isFar ? 0.7 : 1));
    const l = rot([root[0] - wid * 0.7, root[1] - len * 0.35], root, -er);
    const r = rot([root[0] + wid * 0.75, root[1] - len * 0.3], root, -er);
    return { d: spline([[root[0] - wid * 0.5, root[1] + 4], l, tip, r, [root[0] + wid * 0.55, root[1] + 4]], true, 0.9), tip, root, l, r };
  };
  let sz = { len: 0, wid: 0, back: 0.25 };
  if (kind === 'big') sz = { len: pl.hr * 2.1, wid: pl.hr * 0.72, back: 0.28 };
  else if (kind === 'fox') sz = { len: pl.hr * 1.75, wid: pl.hr * 0.62, back: 0.25 };
  else if (kind === 'camel') sz = { len: pl.hr * 0.75, wid: pl.hr * 0.42, back: 0.6 };
  else if (kind === 'tuft') sz = { len: pl.hr * 0.75, wid: pl.hr * 0.36, back: -0.1 };
  else if (kind === 'small') sz = { len: pl.hr * 0.45, wid: pl.hr * 0.4, back: 0.5 };
  const nearRoot = kind === 'tuft' ? H(0.55, -0.82) : H(-0.05, -0.72);
  const farRoot = kind === 'tuft' ? H(-0.55, -0.85) : H(-0.48, -0.66);
  const fe = ear(farRoot, sz.len * 0.95, sz.wid, sz.back + 0.12, true);
  const ne = ear(nearRoot, sz.len, sz.wid, sz.back, false);
  far.push(`<path d="${fe.d}"/>`);
  skin.push(ne.d);
  if (kind === 'big' || kind === 'fox' || kind === 'camel') {
    // inner ear: warm skin with veins (radiator ears)
    const inner = spline([[lerp(ne.root[0], ne.l[0], 0.5) + 3, ne.root[1] - 2], [lerp(ne.l[0], ne.tip[0], 0.3) + 4, lerp(ne.l[1], ne.tip[1], 0.3) + 2], [lerp(ne.tip[0], ne.root[0], 0.12), lerp(ne.tip[1], ne.root[1], 0.12)], [lerp(ne.r[0], ne.tip[0], 0.3) - 3, lerp(ne.r[1], ne.tip[1], 0.3)], [lerp(ne.root[0], ne.r[0], 0.4), ne.root[1] - 2]], true, 0.9);
    over.push(`<path d="${inner}" fill="${mix('#d98c8c', pal.belly, 0.35)}" opacity=".9"/>`);
    over.push(`<path d="${inner}" fill="none" stroke="${shade(pal.body, 0.3)}" stroke-width="1.4" opacity=".5"/>`);
    if (kind === 'big') {
      const m: P = [lerp(ne.root[0], ne.tip[0], 0.5), lerp(ne.root[1], ne.tip[1], 0.5)];
      over.push(`<path d="M${f(ne.root[0])} ${f(ne.root[1] - 4)} Q${f(m[0] - 4)} ${f(m[1])} ${f(lerp(ne.root[0], ne.tip[0], 0.85))} ${f(lerp(ne.root[1], ne.tip[1], 0.85))} M${f(m[0] - 2)} ${f(m[1] + 4)} l-6 -8 M${f(m[0])} ${f(m[1] + 10)} l7 -8" fill="none" stroke="#a5484f" stroke-width="1.3" opacity=".55" stroke-linecap="round"/>`);
    }
    if (kind === 'fox' || kind === 'big') over.push(`<path d="${spline([[lerp(ne.l[0], ne.tip[0], 0.65), lerp(ne.l[1], ne.tip[1], 0.65)], ne.tip, [lerp(ne.r[0], ne.tip[0], 0.7), lerp(ne.r[1], ne.tip[1], 0.7)], [lerp(ne.root[0], ne.tip[0], 0.8), lerp(ne.root[1], ne.tip[1], 0.8)]], true, 0.8)}" fill="${shade(pal.body, 0.45)}" opacity=".7"/>`);
  }
  return { skin, far, over };
}

function tailShape(id: string, root: P, pl: Plan, pal: Pal, ex: Ex, rnd: () => number, uid: string) {
  const skin: string[] = [], far: string[] = [], hard: string[] = [], fx: string[] = [], over: string[] = [];
  const s = Math.max(0.85, Math.min(1.15, pl.len / 160));
  const lift = ex.tail * 18; // happy tails rise, frightened tails tuck
  const [x, y] = root;
  switch (id) {
    case 'fluffy': {
      const pts = tube([[x + 8, y + 4, 22], [x - 30 * s, y - 6 - lift * 0.4, 40], [x - 62 * s, y - 34 - lift, 42], [x - 74 * s, y - 70 - lift * 1.4, 30], [x - 64 * s, y - 96 - lift * 1.6, 14]], 0.8, 0.3);
      skin.push(spline(pts, true, 1));
      skin.push(...furTufts(pts, rnd, 1.0, ex.bristle, false));
      over.push(`<path d="${spline([[x - 74 * s, y - 64 - lift * 1.4], [x - 62 * s, y - 100 - lift * 1.6], [x - 56 * s, y - 84 - lift * 1.5], [x - 64 * s, y - 70 - lift * 1.4]], true, 0.9)}" fill="${light(pal.belly, 0.4)}" opacity=".9"/>`);
      break;
    }
    case 'stinger': {
      // segmented scorpion metasoma: overlapping segments arching up and over the back, then the venom bulb
      const R = Math.max(38, pl.h * 0.62) * s;
      const c0: P = [x - R * 0.35, y - R * 0.55 - lift * 0.4];
      let segs = ''; const n = 8; let last: P = [x, y];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1); const a = Math.PI * (0.62 - t * 1.0);
        const cx = c0[0] + Math.cos(a + Math.PI / 2) * R * 0.8, cy = c0[1] - Math.sin(a + Math.PI / 2) * R * 0.75;
        const rr = 12 - i * 0.8;
        segs += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rr)}" ry="${f(rr * 0.88)}" fill="${i % 2 ? shade(pal.dark, 0.28) : shade(pal.dark, 0.14)}" stroke="${pal.ink}" stroke-width="2"/>`;
        segs += `<path d="M${f(cx - rr * 0.55)} ${f(cy - rr * 0.35)} q${f(rr * 0.55)} ${f(-rr * 0.45)} ${f(rr * 1.05)} 0" fill="none" stroke="${light(pal.dark, 0.4)}" stroke-width="1.3" opacity=".6"/>`;
        last = [cx, cy]; track([[cx - rr, cy - rr], [cx + rr, cy + rr]]);
      }
      const [tX, tY] = last;
      segs += `<path d="M${f(tX - 2)} ${f(tY - 8)} C${f(tX + 16)} ${f(tY - 10)} ${f(tX + 24)} ${f(tY + 2)} ${f(tX + 22)} ${f(tY + 18)} C${f(tX + 14)} ${f(tY + 8)} ${f(tX + 6)} ${f(tY + 8)} ${f(tX - 4)} ${f(tY + 6)} Z" fill="#e6d8b8" stroke="${pal.ink}" stroke-width="2"/>`;
      hard.push(`<!--back-->${segs}`);
      skin.push(spline(tube([[x + 8, y + 4, 22], [x - 6, y - 6, 18], [lerp(x, c0[0], 0.6), y - R * 0.25, 14]], 0.5, 0.2)));
      break;
    }
    case 'finTail': {
      skin.push(spline(tube([[x + 10, y + 6, 30], [x - 30 * s, y + 6 - lift * 0.2, 22], [x - 58 * s, y + 4 - lift * 0.3, 12]], 0.4, 0.3)));
      const fx0 = x - 58 * s, fy0 = y + 4 - lift * 0.3;
      const fin = `M${f(fx0 + 4)} ${f(fy0 - 4)} C${f(fx0 - 16)} ${f(fy0 - 22)} ${f(fx0 - 30)} ${f(fy0 - 40)} ${f(fx0 - 44)} ${f(fy0 - 46)} C${f(fx0 - 38)} ${f(fy0 - 18)} ${f(fx0 - 36)} ${f(fy0 + 14)} ${f(fx0 - 44)} ${f(fy0 + 44)} C${f(fx0 - 28)} ${f(fy0 + 36)} ${f(fx0 - 14)} ${f(fy0 + 20)} ${f(fx0 + 4)} ${f(fy0 + 6)} Z`;
      hard.push(`<!--back--><path d="${fin}" fill="${mix(pal.dark, '#7fa7b5', 0.25)}" fill-opacity=".92" stroke="${pal.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
        [-38, -24, -10, 6, 22, 36].map((dy) => `<path d="M${f(fx0)} ${f(fy0 + dy * 0.12)} L${f(fx0 - 38)} ${f(fy0 + dy)}" stroke="${light(pal.dark, 0.3)}" stroke-width="1.2" opacity=".55"/>`).join(''));
      break;
    }
    case 'prehensile': {
      const ch: [number, number, number][] = [[x + 8, y + 4, 18], [x - 26 * s, y + 4, 14], [x - 56 * s, y - 14 - lift * 0.3, 11], [x - 70 * s, y - 46 - lift * 0.6, 9], [x - 58 * s, y - 70 - lift * 0.7, 7.5], [x - 36 * s, y - 70 - lift * 0.7, 6], [x - 32 * s, y - 52 - lift * 0.6, 5], [x - 44 * s, y - 46 - lift * 0.6, 4]];
      skin.push(spline(tube(ch, 0.6, 0.3), true, 0.9));
      break;
    }
    case 'club': {
      skin.push(spline(tube([[x + 10, y + 4, 30], [x - 30 * s, y + 10, 20], [x - 60 * s, y + 16 - lift * 0.2, 14]], 0.3, 0.3)));
      const cx = x - 74 * s, cy = y + 16 - lift * 0.2;
      hard.push(`<path d="${spline(circlePts([cx, cy], 18, 9, 0.8), true, 1)}" fill="#cdb88f" stroke="${pal.ink}" stroke-width="2.6"/>` +
        `<path d="M${f(cx - 14)} ${f(cy - 8)} l-12 -8 l8 14 Z M${f(cx - 14)} ${f(cy + 8)} l-12 8 l8 -14 Z M${f(cx + 2)} ${f(cy - 14)} l0 -12 l8 10 Z" fill="#e8dbbd" stroke="${pal.ink}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M${f(cx - 6)} ${f(cy - 6)} q8 -4 14 2" fill="none" stroke="#fff3d6" stroke-width="2" opacity=".6"/>`);
      break;
    }
    case 'lure': {
      skin.push(spline(tube([[x + 8, y + 4, 18], [x - 20 * s, y + 2, 11]], 0.5, 0.3)));
      const stalk = spline([[x - 18 * s, y + 2], [x - 50 * s, y - 20], [x - 60 * s, y - 70 - lift], [x - 30 * s, y - 104 - lift]], false);
      hard.push(`<!--back--><path d="${stalk}" fill="none" stroke="${pal.ink}" stroke-width="7" stroke-linecap="round"/><path d="${stalk}" fill="none" stroke="${shade(pal.body, 0.2)}" stroke-width="3.5" stroke-linecap="round"/>`);
      const lx = x - 26 * s, ly = y - 110 - lift;
      fx.push(`<circle cx="${f(lx)}" cy="${f(ly)}" r="22" fill="#fff2a0" opacity=".4" filter="url(#${uid}-glow)"/>`);
      hard.push(`<path d="${spline(circlePts([lx, ly], 9, 8, 1.15), true)}" fill="#ffe88a" stroke="${pal.ink}" stroke-width="2.2"/><circle cx="${f(lx - 2)}" cy="${f(ly - 3)}" r="3" fill="#fffbe6"/>`);
      break;
    }
    default: skin.push(spline(tube([[x + 8, y + 4, 20], [x - 30, y + 2, 10]], 0.5, 0.3)));
  }
  return { skin, far, hard, fx, over };
}

function limbShapes(id: string, base: string, pl: Plan, hipB: P, hipF: P, pal: Pal, ex: Ex, rnd: () => number, T: (u: number, v: number) => P) {
  const skin: string[] = [], far: string[] = [], hard: string[] = [], over: string[] = [];
  let contour = ''; let wingNear = '';
  const W = pl.legW;
  const ground = GROUND;
  const claw = (x: number, y: number, len: number, curve: number, col = '#e8dcc2') => `<path d="M${f(x - 3)} ${f(y - 2)} Q${f(x + len * 0.7)} ${f(y - curve)} ${f(x + len)} ${f(y + len * 0.35)} Q${f(x + len * 0.4)} ${f(y + 2)} ${f(x + 3)} ${f(y + 3)} Z" fill="${col}" stroke="${pal.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const foot = (x: number, kind: string, near: boolean) => {
    const g = ground;
    if (kind === 'webbed') return `<path d="M${f(x - 10)} ${f(g - 6)} L${f(x + 22)} ${f(g - 2)} L${f(x + 26)} ${f(g + 3)} Q${f(x + 8)} ${f(g + 7)} ${f(x - 12)} ${f(g + 3)} Z" fill="${mix(pal.dark, '#d07a3a', 0.45)}" stroke="${pal.ink}" stroke-width="2.2" stroke-linejoin="round" opacity="${near ? 1 : 0.8}"/><path d="M${f(x)} ${f(g - 4)} l16 4 M${f(x + 2)} ${f(g - 2)} l10 6" stroke="${pal.ink}" stroke-width="1.2" opacity=".5"/>`;
    if (kind === 'climb') return [0, 6, 12].map((dx) => claw(x + dx - 4, g - 4, 13, 9)).join('');
    if (kind === 'dig') return [0, 7, 14].map((dx) => claw(x + dx - 6, g - 5, 16, 3, '#efe5cc')).join('');
    if (kind === 'toe') return [0, 6, 12].map((dx) => `<ellipse cx="${f(x + dx)}" cy="${f(g - 1)}" rx="4.5" ry="3.2" fill="${shade(pal.body, near ? 0.05 : 0.3)}" stroke="${pal.ink}" stroke-width="1.6"/>`).join('');
    if (kind === 'pad') return `<path d="M${f(x - 6)} ${f(g - 2)} q12 -6 22 0" fill="none" stroke="${pal.ink}" stroke-width="1.4" opacity=".5"/>`;
    if (kind === 'talon') return [0, 7, 14].map((dx) => claw(x + dx - 6, g - 3, 10, 6, '#3a2f28')).join('');
    return '';
  };
  const footKind = id === 'webbed' ? 'webbed' : id === 'climbClaws' ? 'climb' : id === 'digClaws' ? 'dig' : base === 'owl' ? 'talon' : base === 'frog' || base === 'gecko' || base === 'axolotl' ? 'toe' : 'pad';

  // leg: hip → knee → ankle → foot on the ground
  const leg = (hip: P, front: boolean, near: boolean, scale = 1) => {
    const dx = near ? 0 : (front ? -12 : 14);
    const hx = hip[0] + dx, hy = hip[1] - (near ? 0 : 4);
    const lenY = ground - hy;
    const wv = W * scale * (near ? 1 : 0.9);
    let chain: [number, number, number][];
    if (spring && !front) {
      chain = [[hx, hy - 6, wv * 2.6], [hx - 12, hy + lenY * 0.35, wv * 1.6], [hx + 4, hy + lenY * 0.72, wv * 0.8], [hx - 6, ground - 6, wv * 0.6], [hx + 26, ground - 4, wv * 0.5]];
    } else if (spring && front) {
      const fy = hy + 18; chain = [[hx, hy, wv * 0.9], [hx + 10, fy, wv * 0.6], [hx + 18, fy - 6, wv * 0.5]];
    } else if (front) {
      const thick = id === 'digClaws' ? 1.35 : 1;
      chain = [[hx, hy - 4, wv * 1.6 * thick], [hx + 4, hy + lenY * 0.45, wv * 1.05 * thick], [hx + 2, ground - 10, wv * 0.85 * thick], [hx + 8, ground - 4, wv * 0.8 * thick]];
    } else {
      chain = [[hx, hy - 8, wv * 2.1], [hx - 8, hy + lenY * 0.4, wv * 1.3], [hx + 2, hy + lenY * 0.78, wv * 0.8], [hx + 2, ground - 6, wv * 0.75], [hx + 10, ground - 4, wv * 0.7]];
    }
    const pts = tube(chain, 0.6, 0.2);
    const d = spline(pts, true, 0.95);
    const end = chain[chain.length - 1];
    // inner contour: the thigh/elbow edge that overlaps the body (first joints only)
    const k = chain.length;
    const edge = front ? pts.slice(0, 2) : pts.slice(k + 1, k + 1 + k).reverse().slice(0, 2);
    const top: P = [chain[0][0] + (front ? -chain[0][2] * 0.3 : chain[0][2] * 0.35), chain[0][1] - chain[0][2] * 0.35];
    return { d, footX: end[0] - 4, onGround: !(spring && front), edge: [top, ...edge] as P[] };
  };
  void rnd; void ex;

  if (id === 'tentacles') {
    // four suckered arms curling under the body, two behind (far)
    const roots: P[] = base === 'octopus' ? [[pl.hx - pl.hr * 0.7, pl.hy + pl.hr * 0.5], [pl.hx - pl.hr * 0.25, pl.hy + pl.hr * 0.7], [pl.hx + pl.hr * 0.15, pl.hy + pl.hr * 0.72], [pl.hx + pl.hr * 0.55, pl.hy + pl.hr * 0.55]] : [T(-0.5, 0.55), T(-0.1, 0.7), T(0.25, 0.68), T(0.6, 0.5)];
    roots.forEach((r, i) => {
      const dir = i % 2 ? 1 : -1; const nearArm = i % 2 === 0;
      const L = ground - r[1];
      const ch: [number, number, number][] = [[r[0], r[1] - 6, 20], [r[0] + dir * 8, r[1] + L * 0.45, 15], [r[0] + dir * 26, ground - 6, 10], [r[0] + dir * 46, ground - 14, 7], [r[0] + dir * 44, ground - 30, 5], [r[0] + dir * 34, ground - 26, 4]];
      const d = spline(tube(ch, 0.6, 0.2), true, 0.9);
      if (nearArm) {
        skin.push(d);
        over.push(ch.slice(1, 5).map(([x, y], k) => `<ellipse cx="${f(x + dir * 2)}" cy="${f(y + 5)}" rx="${f(4 - k * 0.6)}" ry="${f(3 - k * 0.4)}" fill="${light(pal.belly, 0.2)}" stroke="${shade(pal.body, 0.35)}" stroke-width="1.1"/>`).join(''));
      } else far.push(`<path d="${d}"/>`);
    });
    return { skin, far, hard, over, contour, wingNear };
  }

  if (base === 'octopus') {
    // an octopus keeps a skirt of short curled arms under its head, whatever legs were grafted on
    [[-0.6, -1], [0.0, 1], [0.5, 1]].forEach(([u, dir], i) => {
      const r: P = [pl.hx + u * pl.hr, pl.hy + pl.hr * 0.6];
      const ch: [number, number, number][] = [[r[0], r[1] - 6, 16], [r[0] + dir * 10, r[1] + 22, 11], [r[0] + dir * 24, r[1] + 30, 7], [r[0] + dir * 30, r[1] + 20, 4]];
      (i === 1 ? far : skin).push(i === 1 ? `<path d="${spline(tube(ch, 0.6, 0.2), true, 0.9)}"/>` : spline(tube(ch, 0.6, 0.2), true, 0.9));
    });
  }
  const spring = id === 'springLegs';
  const bb = leg(hipB, false, false), fb = leg(hipF, true, false, spring ? 0.7 : 1);
  far.push(`<path d="${bb.d}"/>`, `<path d="${fb.d}"/>`);
  hard.push(`<!--back-->${bb.onGround ? foot(bb.footX, footKind, false) : ''}${fb.onGround ? foot(fb.footX, footKind, false) : ''}`);
  const bn = leg(hipB, false, true), fn = leg(hipF, true, true, spring ? 0.7 : 1);
  skin.push(bn.d, fn.d);
  hard.push(`${bn.onGround ? foot(bn.footX, footKind, true) : ''}${fn.onGround ? foot(fn.footX, footKind, true) : ''}`);
  if (spring) hard.push([0, 5].map((dx) => claw(fn.footX + 14 + dx, hipF[1] + 10, 7, 4)).join(''));
  // interior contours so near limbs read in front of the body
  for (const lg of [bn, fn]) contour += `<path d="${spline(lg.edge, false, 0.8)}" fill="none" stroke="${pal.ink}" stroke-width="1.5" opacity=".38" stroke-linecap="round"/>`;

  if (id === 'wings') {
    // leathery bat wings: far wing raised behind, near wing half-open in front with finger bones
    const sh = T(0.3, -0.55);
    const wing = (o: P, span: number, raise: number, isFar: boolean) => {
      const fingers: P[] = [[o[0] - span * 0.35, o[1] - span * 0.95 - raise], [o[0] - span * 0.85, o[1] - span * 0.7 - raise], [o[0] - span * 1.08, o[1] - span * 0.25 - raise * 0.6], [o[0] - span * 0.95, o[1] + span * 0.12]];
      const wrist: P = [o[0] - span * 0.22, o[1] - span * 0.55 - raise * 0.6];
      let d = `M${f(o[0])} ${f(o[1])} L${f(wrist[0])} ${f(wrist[1])} L${f(fingers[0][0])} ${f(fingers[0][1])}`;
      for (let i = 1; i < fingers.length; i++) { const a = fingers[i - 1], b = fingers[i]; const mx = (a[0] + b[0]) / 2 + span * 0.08, my = (a[1] + b[1]) / 2 + span * 0.1; d += ` Q${f(mx)} ${f(my)} ${f(b[0])} ${f(b[1])}`; }
      d += ` Q${f(o[0] - span * 0.4)} ${f(o[1] + span * 0.05)} ${f(o[0] + 6)} ${f(o[1] + 10)} Z`;
      const bones = fingers.map((p) => `M${f(wrist[0])} ${f(wrist[1])} L${f(p[0])} ${f(p[1])}`).join(' ') + ` M${f(o[0])} ${f(o[1])} L${f(wrist[0])} ${f(wrist[1])}`;
      const mem = isFar ? shade(pal.dark, 0.35) : mix(pal.dark, '#5b3a3a', 0.25);
      return `<path d="${d}" fill="${mem}" fill-opacity="${isFar ? 0.95 : 0.9}" stroke="${pal.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="${bones}" fill="none" stroke="${isFar ? shade(pal.body, 0.5) : shade(pal.body, 0.2)}" stroke-width="${isFar ? 2.4 : 3}" stroke-linecap="round"/>` +
        `<path d="${bones}" fill="none" stroke="${pal.ink}" stroke-width="0.8" opacity=".5"/>` +
        `<path d="M${f(wrist[0] - 2)} ${f(wrist[1] - 3)} l-5 -7" stroke="${pal.ink}" stroke-width="2" stroke-linecap="round"/>`;
    };
    const span = Math.max(80, pl.len * 0.62);
    hard.push(`<!--back-->${wing([sh[0] - 10, sh[1] - 4], span * 0.95, 26 + ex.tail * 8, true)}`);
    wingNear = wing([sh[0] + 4, sh[1] + 6], span * 0.8, 4 + ex.tail * 6, false);
  }
  return { skin, far, hard, over, contour, wingNear };
}

function coverTexture(c: CreatureConfig, base: string, pl: Plan, pal: Pal, rnd: () => number, torsoPts: P[], headPts: P[], T: (u: number, v: number) => P, H: (u: number, v: number) => P) {
  let body = ''; const defs = '';
  const cover: Cover = c.adaptation === 'thickFur' ? 'fur' : c.adaptation === 'shell' && pl.cover !== 'plates' ? pl.cover : pl.cover;
  const xs = torsoPts.map((p) => p[0]), ys = torsoPts.map((p) => p[1]);
  const minX = Math.min(...xs) - 90, maxX = Math.max(...xs) + 120, minY = Math.min(...ys, ...headPts.map((p) => p[1])) - 30, maxY = GROUND;
  if (cover === 'fur') {
    // directional fur strokes, light on top / dark below
    const n = c.adaptation === 'thickFur' ? 420 : 260;
    let dk = '', lt = '';
    for (let i = 0; i < n; i++) {
      const x = lerp(minX, maxX, rnd()), y = lerp(minY, maxY, rnd());
      const L = 5 + rnd() * (c.adaptation === 'thickFur' ? 10 : 6); const a = Math.PI * (0.95 + rnd() * 0.2);
      const seg = `M${f(x)} ${f(y)} q${f(Math.cos(a) * L * 0.5)} ${f(-2 - rnd() * 2)} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L + 2)}`;
      if (y < pl.ty - pl.h * 0.15 && rnd() < 0.6) lt += seg + ' '; else dk += seg + ' ';
    }
    body += `<path d="${dk}" fill="none" stroke="${shade(pal.body, 0.4)}" stroke-width="1.3" opacity=".35" stroke-linecap="round"/>`;
    body += `<path d="${lt}" fill="none" stroke="${light(pal.body, 0.5)}" stroke-width="1.2" opacity=".4" stroke-linecap="round"/>`;
  } else if (cover === 'scales') {
    let s = '';
    for (let yy = minY; yy < maxY; yy += 7) for (let xx = minX + ((yy / 7) % 2) * 4.5; xx < maxX; xx += 9) s += `M${f(xx - 4.5)} ${f(yy)} q4.5 5 9 0 `;
    body += `<path d="${s}" fill="none" stroke="${shade(pal.body, 0.38)}" stroke-width="1" opacity=".38"/>`;
    let hl = ''; for (let i = 0; i < 70; i++) { const x = lerp(minX, maxX, rnd()), y = lerp(minY, pl.ty, rnd()); hl += `M${f(x)} ${f(y)} q3 3 6 0 `; }
    body += `<path d="${hl}" fill="none" stroke="${light(pal.body, 0.55)}" stroke-width="1.2" opacity=".35"/>`;
  } else if (cover === 'feathers') {
    let s = ''; let hl = '';
    for (let yy = minY; yy < maxY; yy += 11) for (let xx = minX + ((yy / 11) % 2) * 7; xx < maxX; xx += 14) {
      const j = (rnd() - 0.5) * 3; s += `M${f(xx - 7 + j)} ${f(yy)} q7 9 14 0 `; if (yy < pl.ty && rnd() < 0.3) hl += `M${f(xx - 4)} ${f(yy + 2)} q4 5 8 0 `;
    }
    body += `<path d="${s}" fill="none" stroke="${shade(pal.body, 0.4)}" stroke-width="1.3" opacity=".42"/>`;
    body += `<path d="${hl}" fill="none" stroke="${light(pal.body, 0.55)}" stroke-width="1.1" opacity=".45"/>`;
  } else if (cover === 'plates') {
    // pangolin keratin scales: rows of overlapping shields following the back
    let s = '';
    for (let row = 0; row < 7; row++) {
      for (let k = 0; k < 9; k++) {
        const u = -0.95 + k * 0.22 + (row % 2) * 0.11, v = -1.05 + row * 0.26;
        const [x, y] = T(u, v); if (y > pl.ty + pl.h * 0.35) continue;
        const r = 13 - row * 0.6;
        s += `<path d="M${f(x - r)} ${f(y - r * 0.3)} Q${f(x)} ${f(y - r * 0.9)} ${f(x + r)} ${f(y - r * 0.3)} Q${f(x + r * 0.7)} ${f(y + r * 0.9)} ${f(x)} ${f(y + r * 1.05)} Q${f(x - r * 0.7)} ${f(y + r * 0.9)} ${f(x - r)} ${f(y - r * 0.3)} Z" fill="${row % 2 ? shade(pal.body, 0.08) : pal.body}" stroke="${pal.ink}" stroke-width="1.5" opacity=".95"/>`;
        s += `<path d="M${f(x - r * 0.5)} ${f(y - r * 0.25)} Q${f(x)} ${f(y - r * 0.6)} ${f(x + r * 0.5)} ${f(y - r * 0.25)}" fill="none" stroke="${light(pal.body, 0.5)}" stroke-width="1.3" opacity=".6"/>`;
      }
    }
    body += s;
  } else if (cover === 'skin' || cover === 'smooth') {
    // moist skin: soft mottling + specular highlights
    let spots = '';
    for (let i = 0; i < 26; i++) { const x = lerp(minX + 60, maxX - 60, rnd()), y = lerp(minY + 20, maxY - 30, rnd()); const r = 2 + rnd() * 4; spots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.8)}"/>`; }
    body += `<g fill="${shade(pal.body, 0.3)}" opacity=".28">${spots}</g>`;
    const [sx, sy] = T(-0.1, -0.55);
    body += `<path d="M${f(sx - 40)} ${f(sy + 4)} q40 -16 82 -4" fill="none" stroke="#fffbea" stroke-width="5" opacity=".35" stroke-linecap="round"/>`;
    const hh = H(-0.1, -0.5);
    body += `<path d="M${f(hh[0] - 16)} ${f(hh[1])} q16 -9 32 -2" fill="none" stroke="#fffbea" stroke-width="3.5" opacity=".38" stroke-linecap="round"/>`;
  }
  return { body, defs };
}

function speciesMarkings(base: string, c: CreatureConfig, pl: Plan, pal: Pal, rnd: () => number, T: (u: number, v: number) => P, H: (u: number, v: number) => P) {
  let s = '';
  const pale = light(pal.belly, 0.15);
  if (base === 'fennec' || base === 'camel') {
    // pale muzzle and chest
    s += `<path d="${spline([H(0.6, 0.15), H(1.45, 0.28), H(1.3, 0.62), H(0.4, 0.78), H(-0.2, 0.6)])}" fill="${pale}" opacity=".8"/>`;
    s += `<path d="${spline([T(0.5, -0.1), T(1.0, 0.1), T(0.8, 0.8), T(0.3, 0.9)])}" fill="${pale}" opacity=".55"/>`;
  }
  if (base === 'owl') {
    // facial disc + chest barring
    const fc = H(0.12, -0.05);
    s += `<path d="${spline(circlePts(fc, pl.hr * 0.78, 10, 0.9))}" fill="${light(pal.belly, 0.25)}" opacity=".85"/>`;
    s += `<path d="${spline(circlePts(fc, pl.hr * 0.78, 10, 0.9))}" fill="none" stroke="${shade(pal.body, 0.35)}" stroke-width="3" opacity=".55"/>`;
    let bars = ''; for (let i = 0; i < 26; i++) { const [x, y] = T(-0.2 + rnd() * 0.9, -0.2 + rnd() * 1.0); bars += `M${f(x - 5)} ${f(y)} q5 3 10 0 `; }
    s += `<path d="${bars}" fill="none" stroke="${shade(pal.body, 0.45)}" stroke-width="2" opacity=".5"/>`;
  }
  if (base === 'frog') {
    // dart-frog warning blotches
    let b = ''; for (let i = 0; i < 9; i++) { const [x, y] = T(-0.9 + rnd() * 1.8, -0.9 + rnd() * 1.2); b += `<path d="${spline(circlePts([x, y], 6 + rnd() * 9, 7, 0.7 + rnd() * 0.4), true, 1.1)}"/>`; }
    s += `<g fill="#1c1611" opacity=".78">${b}</g>`;
  }
  if (base === 'gecko') {
    let b = ''; for (let i = 0; i < 6; i++) { const [x, y] = T(-0.85 + i * 0.32, -0.6); b += `<path d="${spline([[x - 8, y - 4], [x + 8, y - 6], [x + 10, y + 14], [x - 6, y + 16]], true)}"/>`; }
    s += `<g fill="${shade(pal.body, 0.35)}" opacity=".5">${b}</g>`;
  }
  if (base === 'axolotl') {
    let b = ''; for (let i = 0; i < 30; i++) { const [x, y] = T(-1 + rnd() * 2, -1 + rnd() * 1.6); b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + rnd() * 2)}"/>`; }
    s += `<g fill="${shade(pal.body, 0.4)}" opacity=".5">${b}</g>`;
  }
  if (base === 'octopus') {
    let b = ''; for (let i = 0; i < 40; i++) { const [x, y] = T(-1 + rnd() * 2, -1 + rnd() * 1.6); b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + rnd() * 2.4)}"/>`; }
    s += `<g fill="${light(pal.body, 0.4)}" opacity=".45">${b}</g>`;
  }
  void c;
  return s;
}

function faceDetails(c: CreatureConfig, base: string, pl: Plan, pal: Pal, ex: Ex, H: (u: number, v: number) => P, rnd: () => number, id: string) {
  let body = ''; let defs = '';
  const ink = pal.ink;
  const r = pl.hr;
  // nose / beak
  const [nx, ny] = H(pl.nose[0], pl.nose[1]);
  if (base === 'owl') {
    const bopen = ex.open * 6;
    body += `<path d="M${f(nx - 7)} ${f(ny - 8)} Q${f(nx + 2)} ${f(ny - 14)} ${f(nx + 7)} ${f(ny - 6)} Q${f(nx + 6)} ${f(ny + 6)} ${f(nx)} ${f(ny + 14)} Q${f(nx - 5)} ${f(ny + 4)} ${f(nx - 7)} ${f(ny - 8)} Z" fill="#d9a441" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (bopen > 1) body += `<path d="M${f(nx - 4)} ${f(ny + 10)} q4 ${f(bopen)} 8 0" fill="#3a1d14" stroke="${ink}" stroke-width="1.6"/>`;
  } else if (base === 'fennec' || base === 'pangolin' || base === 'camel') {
    body += `<path d="${spline(circlePts([nx - 2, ny - 1], base === 'camel' ? 5 : 6, 7, 0.75), true)}" fill="#2a1d18" stroke="${ink}" stroke-width="1.5"/><circle cx="${f(nx - 4)}" cy="${f(ny - 3)}" r="1.6" fill="#fff" opacity=".7"/>`;
  } else {
    body += `<circle cx="${f(nx - 4)}" cy="${f(ny - 2)}" r="1.6" fill="${ink}" opacity=".7"/>`;
  }
  // mouth line: curve controlled by expression (smile / frown / open)
  if (base !== 'owl') {
    const [m1x, m1y] = H(pl.mouth[0][0], pl.mouth[0][1]);
    const [m2x, m2y] = H(pl.mouth[1][0], pl.mouth[1][1]);
    const curve = -ex.mouth * r * 0.22;
    const open = ex.open * r * 0.32;
    if (open > 2) {
      const mx = lerp(m1x, m2x, 0.45), my = lerp(m1y, m2y, 0.45);
      body += `<path d="M${f(m1x)} ${f(m1y)} Q${f(mx)} ${f(my + curve)} ${f(m2x)} ${f(m2y)} Q${f(mx)} ${f(my + open + curve)} ${f(m1x)} ${f(m1y)} Z" fill="#4a1f1c" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
      if (base === 'fennec' || base === 'pangolin') body += `<path d="M${f(m1x - 6)} ${f(m1y + 1)} l2 4 l2 -4" fill="#fff4e0" stroke="${ink}" stroke-width=".8"/>`;
    } else {
      body += `<path d="M${f(m1x)} ${f(m1y)} Q${f(lerp(m1x, m2x, 0.5))} ${f(lerp(m1y, m2y, 0.5) + curve)} ${f(m2x)} ${f(m2y)}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
      if (ex.mouth > 0.4) body += `<path d="M${f(m2x)} ${f(m2y)} q-3 -3 -4 -7" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
  }
  // whiskers for mammals
  if (base === 'fennec' || c.ability === 'smell') {
    const [wx, wy] = H(pl.nose[0] - 0.35, pl.nose[1] + 0.12);
    body += `<path d="M${f(wx)} ${f(wy)} l26 -6 M${f(wx)} ${f(wy + 3)} l28 3 M${f(wx - 2)} ${f(wy + 6)} l22 10" stroke="${light(pal.belly, 0.3)}" stroke-width=".9" opacity=".7" stroke-linecap="round"/>`;
  }
  // cheek warmth
  const ck = H(pl.eye[0] + 0.15, pl.eye[1] + 0.55);
  body += `<ellipse cx="${f(ck[0])}" cy="${f(ck[1])}" rx="${f(r * 0.2)}" ry="${f(r * 0.12)}" fill="#e07a6a" opacity="${f(0.12 + Math.max(0, ex.mouth) * 0.18)}"/>`;

  // eyes
  const eyeR = r * pl.eyeR * (c.eyes === 'owlEyes' ? 1.45 : c.eyes === 'tinyEyes' ? 0.45 : c.eyes === 'compound' ? 1.35 : c.eyes === 'chameleon' ? 1.2 : 1);
  const centres: { p: P; s: number; near: boolean }[] = [{ p: H(pl.eye[0], pl.eye[1]), s: 1, near: true }];
  if (pl.far) centres.unshift({ p: H(pl.far[0], pl.far[1]), s: base === 'owl' ? 0.96 : 0.78, near: false });

  for (const { p, s, near } of centres) {
    const R = eyeR * s; const [x, y] = p;
    const gz: P = [ex.gaze[0] * R * 0.35, ex.gaze[1] * R * 0.35];
    const browY = y - R * (1.35 + ex.brow * 0.35);
    if (c.eyes === 'stalkEyes') {
      const top: P = [x - 4 + (near ? 0 : -8), y - R * 3.2 - ex.brow * 4];
      body += `<path d="M${f(x)} ${f(y)} Q${f(x - 6)} ${f(y - R * 1.6)} ${f(top[0])} ${f(top[1] + R)}" fill="none" stroke="${ink}" stroke-width="7.5" stroke-linecap="round"/><path d="M${f(x)} ${f(y)} Q${f(x - 6)} ${f(y - R * 1.6)} ${f(top[0])} ${f(top[1] + R)}" fill="none" stroke="${shade(pal.body, near ? 0 : 0.3)}" stroke-width="4" stroke-linecap="round"/>`;
      body += eyeBall(top[0], top[1], R, near, '#f3ead2', '#2b1d14', ex, gz, pal, id);
      continue;
    }
    if (c.eyes === 'compound') {
      body += `<path d="${spline(circlePts([x, y], R, 10, 1.1), true)}" fill="${mix('#3d2b5c', pal.dark, 0.2)}" stroke="${ink}" stroke-width="2.2"/>`;
      let hexes = ''; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const hx = x + i * R * 0.38 + (j % 2) * R * 0.19, hy = y + j * R * 0.34; if (Math.hypot(hx - x, (hy - y) / 1.1) < R * 0.86) hexes += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(R * 0.16)}"/>`; }
      body += `<g fill="none" stroke="#9c86d8" stroke-width=".9" opacity=".7">${hexes}</g>`;
      body += `<ellipse cx="${f(x - R * 0.35)}" cy="${f(y - R * 0.45)}" rx="${f(R * 0.3)}" ry="${f(R * 0.18)}" fill="#fff" opacity=".55"/>`;
      body += `<path d="M${f(x - R * 1.1)} ${f(browY + ex.browTilt * 4)} Q${f(x)} ${f(browY - 4)} ${f(x + R * 1.1)} ${f(browY - ex.browTilt * 4)}" fill="none" stroke="${shade(pal.body, 0.45)}" stroke-width="3" stroke-linecap="round"/>`;
      continue;
    }
    if (c.eyes === 'chameleon') {
      // turret eye: scaly cone with a small pupil peering out
      body += `<path d="${spline(circlePts([x, y], R * 1.1, 10, 1), true)}" fill="${shade(pal.body, 0.05)}" stroke="${ink}" stroke-width="2.2"/>`;
      body += `<path d="${spline(circlePts([x, y], R * 1.1, 10, 1), true)}" fill="none" stroke="${shade(pal.body, 0.3)}" stroke-width="1" stroke-dasharray="3 3" opacity=".7" transform="scale(.8) translate(${f(x * 0.25)} ${f(y * 0.25)})"/>`;
      body += eyeBall(x + gz[0] * 1.6, y + gz[1] * 1.6, R * 0.5, near, '#f6efd8', '#1d1510', { ...ex, lidT: ex.lidT * 0.6, lidB: ex.lidB * 0.6 }, [gz[0] * 0.4, gz[1] * 0.4], pal, id);
      continue;
    }
    const iris = c.eyes === 'glowEyes' ? '#ffd65a' : c.eyes === 'owlEyes' ? '#e7a43a' : base === 'frog' || base === 'gecko' ? '#c9a33a' : base === 'axolotl' || base === 'octopus' ? '#2a1d18' : '#8a5a2b';
    if (c.eyes === 'glowEyes') defs += '';
    body += eyeBall(x, y, R, near, iris, '#120c08', ex, gz, pal, id, c.eyes === 'glowEyes', c.eyes === 'tinyEyes', base === 'gecko' || base === 'octopus' || c.eyes === 'glowEyes' ? 'slit' : 'round');
    // brow ridge (fur/feather tuft) carries the emotion
    if (c.eyes !== 'tinyEyes') {
      const bt = ex.browTilt * R * 0.35;
      body += `<path d="M${f(x - R * 1.15)} ${f(browY + bt)} Q${f(x)} ${f(browY - R * 0.28)} ${f(x + R * 1.1)} ${f(browY - bt)}" fill="none" stroke="${shade(pal.body, 0.5)}" stroke-width="${f(Math.max(2, R * 0.26))}" stroke-linecap="round" opacity="${near ? 0.85 : 0.6}"/>`;
    }
  }
  void rnd;
  return { body, defs };
}

function eyeBall(x: number, y: number, R: number, near: boolean, iris: string, pupilCol: string, ex: Ex, gz: P, pal: Pal, id: string, glow = false, tiny = false, pupilShape: 'round' | 'slit' = 'round') {
  const ink = pal.ink;
  if (tiny) {
    const lid = ex.lidT > 0.45 ? 0.4 : 1;
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R * 1.1)}" ry="${f(R * lid)}" fill="#120c08"/><circle cx="${f(x - R * 0.3)}" cy="${f(y - R * 0.3)}" r="${f(R * 0.35)}" fill="#fff" opacity=".8"/>`;
  }
  let s = '';
  if (glow) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 2.2)}" fill="#ffe27a" opacity=".28" filter="url(#${id}-glow)"/>`;
  const clip = `${id}-e${Math.round(x)}${Math.round(y)}`;
  s += `<clipPath id="${clip}"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R)}" ry="${f(R * 1.02)}"/></clipPath>`;
  s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R)}" ry="${f(R * 1.02)}" fill="${glow ? '#fff6c8' : '#f4ecd8'}"/>`;
  s += `<g clip-path="url(#${clip})">`;
  const ir = R * 0.78;
  s += `<circle cx="${f(x + gz[0])}" cy="${f(y + gz[1])}" r="${f(ir)}" fill="${iris}"/>`;
  s += `<circle cx="${f(x + gz[0])}" cy="${f(y + gz[1])}" r="${f(ir)}" fill="none" stroke="${shade(iris, 0.5)}" stroke-width="${f(R * 0.12)}" opacity=".7"/>`;
  const pr = ir * 0.55 * ex.pupil;
  s += pupilShape === 'slit' && ex.pupil < 1.2
    ? `<ellipse cx="${f(x + gz[0] * 1.2)}" cy="${f(y + gz[1] * 1.2)}" rx="${f(pr * 0.35)}" ry="${f(Math.min(ir * 0.95, pr * 1.6))}" fill="${pupilCol}"/>`
    : `<circle cx="${f(x + gz[0] * 1.2)}" cy="${f(y + gz[1] * 1.2)}" r="${f(Math.min(ir * 0.9, pr))}" fill="${pupilCol}"/>`;
  // lids (skin colour) close from top/bottom per expression
  const top = -R + ex.lidT * 2 * R, bot = R - ex.lidB * 2 * R;
  s += `<path d="M${f(x - R * 1.3)} ${f(y - R * 1.4)} H${f(x + R * 1.3)} V${f(y + top)} Q${f(x)} ${f(y + top + R * 0.25)} ${f(x - R * 1.3)} ${f(y + top)} Z" fill="${near ? pal.body : shade(pal.body, 0.2)}"/>`;
  s += `<path d="M${f(x - R * 1.3)} ${f(y + R * 1.4)} H${f(x + R * 1.3)} V${f(y + bot)} Q${f(x)} ${f(y + bot - R * 0.3)} ${f(x - R * 1.3)} ${f(y + bot)} Z" fill="${near ? light(pal.body, 0.08) : shade(pal.body, 0.2)}"/>`;
  s += `</g>`;
  // lid lines + outline
  s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(R)}" ry="${f(R * 1.02)}" fill="none" stroke="${ink}" stroke-width="2"/>`;
  if (ex.lidT > 0.05) s += `<path d="M${f(x - R * 0.98)} ${f(y + top + (top > -R * 0.9 ? 1 : 0))} Q${f(x)} ${f(y + top + R * 0.25)} ${f(x + R * 0.98)} ${f(y + top)}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
  if (ex.lidB > 0.15) s += `<path d="M${f(x - R * 0.9)} ${f(y + bot)} Q${f(x)} ${f(y + bot - R * 0.3)} ${f(x + R * 0.9)} ${f(y + bot)}" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  // catch-lights (always, they make it alive)
  if (ex.lidT < 0.7) s += `<circle cx="${f(x - R * 0.3 + gz[0] * 0.5)}" cy="${f(y - R * 0.35 + Math.max(0, top + R) * 0.4)}" r="${f(R * 0.2)}" fill="#fff" opacity=".9"/><circle cx="${f(x + R * 0.25)}" cy="${f(y + R * 0.25)}" r="${f(R * 0.08)}" fill="#fff" opacity=".6"/>`;
  return s;
}

function headPart(id: string, pl: Plan, pal: Pal, ex: Ex, H: (u: number, v: number) => P, rnd: () => number, uid: string) {
  const ink = pal.ink; const r = pl.hr;
  switch (id) {
    case 'horns': {
      // ridged ibex horns sweeping back
      const horn = (root: P, scale: number, col: string) => {
        const ch: [number, number, number][] = [[root[0], root[1] + 2, 19 * scale], [root[0] - 10 * scale, root[1] - 26 * scale, 15 * scale], [root[0] - 34 * scale, root[1] - 46 * scale, 11 * scale], [root[0] - 62 * scale, root[1] - 44 * scale, 7 * scale], [root[0] - 78 * scale, root[1] - 24 * scale, 3 * scale]];
        const d = spline(tube(ch, 0.8, 0.2), true, 0.9);
        let ridges = ''; for (let i = 1; i < 9; i++) { const t = i / 9; const k = Math.min(3, Math.floor(t * 4)); const a = ch[k], b = ch[k + 1]; const tt = t * 4 - k; const x = lerp(a[0], b[0], tt), y = lerp(a[1], b[1], tt); const w = lerp(a[2], b[2], tt) / 2; ridges += `M${f(x - w * 0.6)} ${f(y - w * 0.6)} l${f(w * 1.2)} ${f(w * 1.2)} `; }
        return `<path d="${d}" fill="${col}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="${ridges}" stroke="${shade(col, 0.35)}" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>`;
      };
      return horn(H(-0.45, -0.68), 0.9 * (r / 34), shade('#c8b08a', 0.25)) + horn(H(-0.05, -0.78), 1 * (r / 34), '#d6c29a');
    }
    case 'crest': {
      const raise = Math.max(0, ex.brow) * 10 + Math.max(0, ex.bristle) * 8;
      const root = H(-0.2, -0.85);
      let s = '';
      [-55, -38, -20, -4, 12].forEach((a, i) => {
        const ang = ((a - 70 - raise) * Math.PI) / 180; const L = (46 + i * 4) * (r / 34);
        const tip: P = [root[0] + Math.cos(ang) * L, root[1] + Math.sin(ang) * L];
        const d = spline(tube([[root[0] + i * 3, root[1] + 2, 9], [lerp(root[0], tip[0], 0.55), lerp(root[1], tip[1], 0.55) - 2, 8], [tip[0], tip[1], 3]], 0.9, 0.2), true, 0.9);
        const col = i % 2 ? '#e6b44a' : '#d9733f';
        s += `<path d="${d}" fill="${mix(col, pal.body, 0.15)}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M${f(root[0] + i * 3)} ${f(root[1])} L${f(tip[0])} ${f(tip[1])}" stroke="${shade(col, 0.35)}" stroke-width="1" opacity=".6"/>`;
      });
      return s;
    }
    case 'gillFrills': {
      let s = '';
      const flare = 1 + Math.max(0, ex.bristle) * 0.3 + Math.max(0, ex.mouth) * 0.1;
      [[-0.6, -0.6, -125], [-0.8, -0.2, -155], [-0.75, 0.25, 175]].forEach(([u, v, a]) => {
        const root = H(u, v); const ang = (a * Math.PI) / 180; const L = r * 1.25 * flare;
        const tip: P = [root[0] + Math.cos(ang) * L, root[1] + Math.sin(ang) * L * 0.8];
        const stem = spline(tube([[root[0], root[1], 7], [lerp(root[0], tip[0], 0.5), lerp(root[1], tip[1], 0.5) - 3, 6], [tip[0], tip[1], 3]], 0.8, 0.2), true, 0.9);
        let fil = ''; for (let k = 1; k < 7; k++) { const t = k / 7; const x = lerp(root[0], tip[0], t), y = lerp(root[1], tip[1], t) - 2; fil += `M${f(x)} ${f(y)} l${f(-Math.sin(ang) * 12)} ${f(Math.cos(ang) * 12 - 7)} M${f(x)} ${f(y)} l${f(Math.sin(ang) * 12)} ${f(-Math.cos(ang) * 12 - 7)} `; }
        s += `<path d="${fil}" stroke="#e86d8c" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="${fil}" stroke="#ffb7c8" stroke-width="1.2" stroke-linecap="round"/>`;
        s += `<path d="${stem}" fill="#d9577a" stroke="${ink}" stroke-width="2"/>`;
      });
      return s;
    }
    case 'antennae': {
      let s = '';
      [[0.1, -0.85, -18], [0.45, -0.75, 8]].forEach(([u, v, lean], i) => {
        const root = H(u, v); const L = r * 1.6 * (1 + ex.brow * 0.15);
        const tip: P = [root[0] + lean - 10, root[1] - L];
        const mid: P = [root[0] + lean * 0.3 + 10, root[1] - L * 0.55];
        const shaft = `M${f(root[0])} ${f(root[1])} Q${f(mid[0])} ${f(mid[1])} ${f(tip[0])} ${f(tip[1])}`;
        // bipectinate (feathery) moth antennae
        let barbs = ''; for (let k = 1; k < 12; k++) { const t = k / 12; const x = (1 - t) * (1 - t) * root[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0]; const y = (1 - t) * (1 - t) * root[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1]; const w = 9 * Math.sin(t * Math.PI) + 2; barbs += `M${f(x)} ${f(y)} l${f(-w)} ${f(-w * 0.5)} M${f(x)} ${f(y)} l${f(w)} ${f(-w * 0.5)} `; }
        s += `<path d="${barbs}" stroke="${mix('#c7a565', pal.body, 0.2)}" stroke-width="1.6" stroke-linecap="round" opacity="${i ? 1 : 0.7}"/><path d="${shaft}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      });
      void rnd;
      return s;
    }
    case 'helmet': {
      // cassowary casque: tall keratin crest fused to the skull
      const a = H(-0.5, -0.55), b = H(0.65, -0.62), top = H(-0.15, -1.75), front = H(0.45, -1.2);
      const d = spline([a, [lerp(a[0], top[0], 0.5) - 6, lerp(a[1], top[1], 0.5)], top, front, b, H(0.1, -0.78)], true, 0.9);
      return `<path d="${d}" fill="#9a8a6e" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="${d}" fill="url(#${uid}-b)" opacity=".35"/><path d="M${f(top[0] - 4)} ${f(top[1] + 10)} Q${f(lerp(top[0], b[0], 0.5))} ${f(lerp(top[1], b[1], 0.5))} ${f(b[0] - 6)} ${f(b[1] - 4)}" fill="none" stroke="#e6dcc4" stroke-width="2.4" opacity=".6"/>`;
    }
    default: return ''; // bigEars are drawn as ears
  }
}

function adaptation(id: string, pl: Plan, pal: Pal, ex: Ex, rnd: () => number, T: (u: number, v: number) => P, torsoPts: P[], H: (u: number, v: number) => P, uid: string) {
  let under = '', over = '', fx = '';
  const ink = pal.ink;
  switch (id) {
    case 'camo': {
      let b = ''; const greens = ['#4f5d33', '#6b5a3a', '#2f3b25'];
      for (let i = 0; i < 16; i++) { const [x, y] = T(-1 + rnd() * 2, -1 + rnd() * 1.5); b += `<path d="${spline(circlePts([x, y], 6 + rnd() * 12, 7, 0.6 + rnd() * 0.4), true, 1.2)}" fill="${greens[i % 3]}"/>`; }
      under += `<g clip-path="url(#${uid}-s)" opacity=".45" style="mix-blend-mode:multiply">${b}</g>`;
      break;
    }
    case 'shell': {
      // armadillo bands across the back
      const top = (u: number) => -1.02 - Math.cos((u + 0.05) * 1.6) * 0.22; // dome over the back
      const pts: P[] = []; for (let i = 0; i <= 8; i++) { const u = -1.0 + i * 0.235; pts.push(T(u, top(u))); }
      const lower: P[] = []; for (let i = 8; i >= 0; i--) { const u = -1.0 + i * 0.235; lower.push(T(u, 0.12 + Math.abs(u + 0.06) * 0.25)); }
      const d = spline([...pts, ...lower], true, 0.8);
      over += `<path d="${d}" fill="#b49a6e" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
      over += `<path d="${d}" fill="url(#${uid}-b)" opacity=".35"/>`;
      for (let i = 1; i < 8; i++) { const u = -1.0 + i * 0.235; const a = T(u, top(u) - 0.02), b = T(u - 0.03, 0.12 + Math.abs(u + 0.06) * 0.25); over += `<path d="M${f(a[0])} ${f(a[1])} Q${f(a[0] + 4)} ${f((a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${ink}" stroke-width="1.8" opacity=".7"/>`; }
      let dots = ''; for (let i = 0; i < 26; i++) { const [x, y] = T(-0.85 + rnd() * 1.7, -0.95 + rnd() * 0.9); dots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.2" ry="1.4"/>`; }
      over += `<g fill="#7e6847" opacity=".6">${dots}</g>`;
      over += `<path d="${spline(pts, false)}" fill="none" stroke="#efe2c3" stroke-width="3" opacity=".45" transform="translate(2 5)"/>`;
      break;
    }
    case 'spikes': {
      // banded porcupine quills along the back, bristling with fear
      const n = 15; const lift = 1 + ex.bristle * 0.45;
      for (let i = 0; i < n; i++) {
        const u = -0.85 + (i / (n - 1)) * 1.45; const base = T(u, -0.82 - Math.sin(((u + 0.85) / 1.45) * Math.PI) * 0.12);
        const ang = (-100 - (u + 0.2) * 45 + (rnd() - 0.5) * 12) * Math.PI / 180; const L = (26 + rnd() * 18) * lift;
        const tip: P = [base[0] + Math.cos(ang) * L, base[1] + Math.sin(ang) * L];
        under += `<path d="M${f(base[0] - 3.5)} ${f(base[1] + 4)} L${f(tip[0])} ${f(tip[1])} L${f(base[0] + 3.5)} ${f(base[1] + 4)} Z" fill="#efe3c8" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
        under += `<path d="M${f(lerp(base[0], tip[0], 0.45))} ${f(lerp(base[1], tip[1], 0.45))} L${f(lerp(base[0], tip[0], 0.7))} ${f(lerp(base[1], tip[1], 0.7))}" stroke="#2c211a" stroke-width="3"/>`;
      }
      break;
    }
    case 'biolum': {
      for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
        const [x, y] = T(-0.8 + i * 0.26 + row * 0.13, 0.05 + row * 0.32);
        fx += `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#7ff3ff" opacity=".35" filter="url(#${uid}-glow)"/>`;
        over += `<circle cx="${f(x)}" cy="${f(y)}" r="3.6" fill="#e9ffff" stroke="#2a8d9a" stroke-width="1.4"/>`;
      }
      break;
    }
    case 'gills': {
      for (let i = 0; i < 3; i++) {
        const a = H(-0.95 - i * 0.18, -0.35), b = H(-1.05 - i * 0.18, 0.45);
        over += `<path d="M${f(a[0])} ${f(a[1])} Q${f(a[0] - 7)} ${f((a[1] + b[1]) / 2)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="#7a2236" stroke-width="3.2" stroke-linecap="round"/><path d="M${f(a[0] - 2)} ${f(a[1] + 3)} Q${f(a[0] - 8)} ${f((a[1] + b[1]) / 2)} ${f(b[0] - 2)} ${f(b[1] - 3)}" fill="none" stroke="#e8798f" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
      }
      break;
    }
    case 'blubber': {
      const [x, y] = T(-0.1, -0.55);
      over += `<path d="M${f(x - 50)} ${f(y + 6)} Q${f(x)} ${f(y - 14)} ${f(x + 52)} ${f(y + 2)}" fill="none" stroke="#fffbe8" stroke-width="7" opacity=".3" stroke-linecap="round"/>`;
      over += `<path d="M${f(x - 30)} ${f(y + 60)} q20 8 40 0 M${f(x - 10)} ${f(y + 74)} q18 6 34 0" fill="none" stroke="${shade(pal.body, 0.4)}" stroke-width="1.6" opacity=".5"/>`;
      break;
    }
    default: break; // thickFur → covering; hump → silhouette
  }
  void torsoPts;
  return { under, over, fx };
}

function ability(id: string, pl: Plan, pal: Pal, ex: Ex, H: (u: number, v: number) => P, T: (u: number, v: number) => P, rnd: () => number, uid: string) {
  let body = '', fx = '';
  const [nx, ny] = H(pl.nose[0], pl.nose[1]);
  switch (id) {
    case 'echo': fx += [16, 28, 40].map((r, i) => `<path d="M${f(nx + 10 + r * 0.25)} ${f(ny - r)} A${r} ${r} 0 0 1 ${f(nx + 10 + r * 0.25)} ${f(ny + r)}" fill="none" stroke="#9fd8ef" stroke-width="${3 - i * 0.6}" opacity="${f(0.55 - i * 0.14)}" stroke-linecap="round"/>`).join(''); break;
    case 'shock': {
      // electric organ: glowing stripes along the flank + a faint arc
      for (let i = 0; i < 4; i++) { const [x, y] = T(-0.6 + i * 0.32, -0.15); body += `<path d="M${f(x)} ${f(y - 14)} q4 14 0 28" fill="none" stroke="#bfe9ff" stroke-width="3" opacity=".75" stroke-linecap="round"/>`; }
      const [ax, ay] = T(-0.2, -1.2); fx += `<path d="M${f(ax)} ${f(ay)} l10 -12 l-4 10 l12 -10" fill="none" stroke="#e7f7ff" stroke-width="2.2" opacity=".8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f(ax + 8)}" cy="${f(ay - 6)}" r="16" fill="#9fdcff" opacity=".25" filter="url(#${uid}-glow)"/>`;
      break;
    }
    case 'ink': { const [x, y] = T(-0.85, 0.6); fx += [[0, 0, 10], [-16, 6, 7], [-28, -2, 5]].map(([dx, dy, r]) => `<circle cx="${f(x + dx)}" cy="${f(y + dy)}" r="${r}" fill="#2a2236" opacity=".55" filter="url(#${uid}-soft)"/>`).join(''); body += `<ellipse cx="${f(x + 14)}" cy="${f(y - 8)}" rx="9" ry="6" fill="#3d2f4f" opacity=".55"/>`; break; }
    case 'regen': { let v = ''; for (let i = 0; i < 5; i++) { const [x, y] = T(-0.7 + rnd() * 1.4, -0.4 + rnd() * 0.8); v += `M${f(x)} ${f(y)} q6 -8 12 0 q6 8 12 0 `; } body += `<path d="${v}" fill="none" stroke="#9bf0a8" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>`; break; }
    case 'mimicry': { const [x, y] = H(pl.head === 'owl' ? 0.25 : 0.55, pl.head === 'owl' ? 1.05 : 0.88); body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(pl.hr * 0.3)}" ry="${f(pl.hr * 0.2 * (1 + ex.open * 0.4))}" fill="${mix(pal.belly, '#d98c8c', 0.3)}" stroke="${pal.ink}" stroke-width="1.6" opacity=".9"/><path d="M${f(x - 8)} ${f(y - 2)} q8 6 16 0" fill="none" stroke="${shade(pal.body, 0.3)}" stroke-width="1.2" opacity=".6"/>`; break; }
    case 'heatPits': body += [0, 1, 2].map((i) => { const [x, y] = H(pl.nose[0] - 0.3 - i * 0.18, pl.nose[1] + 0.05); return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.8" fill="#2a120c"/>`; }).join('') + `<circle cx="${f(nx - 8)}" cy="${f(ny)}" r="14" fill="#ff8a5c" opacity=".2" filter="url(#${uid}-glow)"/>`; break;
    case 'smell': fx += `<path d="M${f(nx + 8)} ${f(ny - 2)} q10 -8 20 0 q10 8 20 0 M${f(nx + 10)} ${f(ny - 12)} q8 -6 16 0 q8 6 16 0" fill="none" stroke="#cdb48a" stroke-width="1.8" opacity=".55" stroke-linecap="round"/>`; break;
    case 'pressure': { const [x, y] = T(0.9, -1.1); fx += [[0, 0, 5], [10, -14, 3.5], [-6, -24, 2.5]].map(([dx, dy, r]) => `<circle cx="${f(x + dx)}" cy="${f(y + dy)}" r="${r}" fill="none" stroke="#bfe6f5" stroke-width="1.4" opacity=".7"/>`).join(''); body += `<g clip-path="url(#${uid}-s)"><rect x="0" y="0" width="400" height="320" fill="#9fd8ef" opacity=".08"/></g>`; break; }
    default: break;
  }
  return { body, fx };
}

function conditionMarks(marks: CreatureMark[], pl: Plan, pal: Pal, rnd: () => number, T: (u: number, v: number) => P, torsoPts: P[], uid: string) {
  let body = '', fx = '', defs = '';
  const clip = `clip-path="url(#${uid}-s)"`;
  for (const m of marks) {
    if (m === 'mud') {
      let s = ''; for (let i = 0; i < 18; i++) { const x = pl.tx - pl.len * 0.75 + rnd() * pl.len * 1.6, y = pl.ty + pl.h * 0.15 + rnd() * (GROUND - pl.ty); s += `<path d="${spline(circlePts([x, y], 5 + rnd() * 11, 7, 0.6 + rnd() * 0.5), true, 1.2)}"/>`; }
      body += `<g ${clip}><rect x="0" y="${f(GROUND - 34)}" width="400" height="60" fill="#4a3424" opacity=".55"/><g fill="#5b412c" opacity=".7">${s}</g></g>`;
      fx += `<path d="M${f(pl.tx - 20)} ${f(pl.ty + pl.h * 0.48)} q2 10 0 14" stroke="#4a3424" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    }
    if (m === 'frost') {
      let s = ''; for (let i = 0; i < 40; i++) { const x = pl.tx - pl.len * 0.7 + rnd() * pl.len * 1.7, y = pl.ty - pl.h * 1.4 + rnd() * pl.h * 1.1; s += `<path d="M${f(x - 3)} ${f(y)} h6 M${f(x)} ${f(y - 3)} v6 M${f(x - 2)} ${f(y - 2)} l4 4 M${f(x + 2)} ${f(y - 2)} l-4 4"/>`; }
      body += `<g ${clip}><rect x="0" y="0" width="400" height="320" fill="#cfe8ff" opacity=".18"/><g stroke="#f4fbff" stroke-width="1.2" opacity=".85">${s}</g></g>`;
      const back = torsoPts.slice(1, 4); fx += `<path d="${spline(back, false)}" fill="none" stroke="#f8fcff" stroke-width="7" stroke-linecap="round" opacity=".9" transform="translate(0 -3)"/>`;
    }
    if (m === 'dust') {
      let s = ''; for (let i = 0; i < 60; i++) { const x = pl.tx - pl.len * 0.75 + rnd() * pl.len * 1.7, y = pl.ty - pl.h * 0.2 + rnd() * (GROUND - pl.ty + pl.h * 0.2); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + rnd() * 1.4)}"/>`; }
      body += `<g ${clip}><rect x="0" y="${f(pl.ty)}" width="400" height="200" fill="#c9a874" opacity=".28"/><g fill="#e2c894" opacity=".7">${s}</g></g>`;
    }
    if (m === 'wet') {
      body += `<g ${clip}><rect x="0" y="0" width="400" height="320" fill="#1d2f3a" opacity=".16"/></g>`;
      let s = ''; for (let i = 0; i < 9; i++) { const [x, y] = T(-0.9 + rnd() * 1.8, -0.8 + rnd() * 0.9); s += `M${f(x)} ${f(y)} q6 -3 12 -1 `; }
      body += `<path d="${s}" fill="none" stroke="#f2fbff" stroke-width="2" opacity=".65" stroke-linecap="round"/>`;
      for (let i = 0; i < 4; i++) { const [x, y] = T(-0.6 + i * 0.4, 0.95); fx += `<path d="M${f(x)} ${f(y)} q-3 6 0 9 q3 -3 0 -9 Z" fill="#cfefff" opacity=".8"/>`; }
    }
    if (m === 'glow') {
      for (let i = 0; i < 10; i++) { const [x, y] = T(-0.95 + rnd() * 1.9, -0.9 + rnd() * 1.5); fx += `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="#6ff7e2" opacity=".35" filter="url(#${uid}-glow)"/>`; body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + rnd() * 1.6)}" fill="#c8fff4" opacity=".9"/>`; }
    }
    if (m === 'soot') {
      let s = ''; for (let i = 0; i < 10; i++) { const [x, y] = T(-1 + rnd() * 2, -0.6 + rnd() * 1.4); s += `<path d="${spline(circlePts([x, y], 6 + rnd() * 10, 7, 0.5), true, 1.2)}"/>`; }
      body += `<g ${clip}><g fill="#1e1a18" opacity=".45">${s}</g></g>`;
    }
    if (m === 'scratches') {
      let s = ''; for (let i = 0; i < 3; i++) { const [x, y] = T(-0.2 + i * 0.12, -0.3 + i * 0.05); s += `M${f(x)} ${f(y)} l14 18 `; }
      body += `<path d="${s}" stroke="#8c2f2a" stroke-width="2" opacity=".75" stroke-linecap="round"/><path d="${s}" stroke="#f3c7b6" stroke-width=".8" opacity=".7" stroke-linecap="round" transform="translate(1 -1)"/>`;
    }
    if (m === 'fatigue') body += `<g ${clip}><rect x="0" y="0" width="400" height="320" fill="#3a3a40" opacity=".18"/></g>`;
  }
  return { body, fx, defs };
}

export function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]!));
}
