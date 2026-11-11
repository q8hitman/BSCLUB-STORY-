// Creature renderer v3 — "clear mascot" style (2026-11-11).
// Designer feedback on v2 (painted, textured): "you literally cannot make out the features". v3 draws the hybrid as a
// simple character: a few big flat shapes, one thick dark outline, large readable eyes, and every chosen part drawn
// as its own obvious shape (ears are ears, a stinger is a stinger). Same public API as v2.
// The painted v2 renderer is kept, unused, in creatureSvg.painted-backup.ts.
import { HUES } from '../content/parts';
import type { CreatureConfig } from '../engine/types';

export type Expression = 'neutral' | 'curious' | 'happy' | 'frightened' | 'suspicious' | 'confident' | 'tired' | 'surprised';
export type CreatureMark = 'mud' | 'frost' | 'dust' | 'wet' | 'glow' | 'soot' | 'scratches' | 'fatigue';
export const EXPRESSIONS: Expression[] = ['neutral', 'curious', 'happy', 'frightened', 'suspicious', 'confident', 'tired', 'surprised'];
export const FEELING_EXPRESSION: Record<string, Expression> = {
  curious: 'curious', calm: 'neutral', confident: 'confident', afraid: 'frightened', excited: 'surprised', exhausted: 'tired', hurt: 'tired', proud: 'happy',
};
export interface CreatureSvgOpts { width?: number; idPrefix?: string; expression?: Expression; marks?: CreatureMark[]; ground?: boolean; /** 'face' frames the head for small reaction thumbnails */ crop?: 'full' | 'face' }

export function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// ───────────── drawing helpers ─────────────
const W = 400, H = 320, GROUND = 272;
const INK = '#241a16', IVORY = '#f6ecd4', PINK = '#f39ab2', GLOW = '#ffe36b', CYAN = '#74f0e4';
const n = (v: number) => (Math.round(v * 10) / 10).toString();
const SK = (w = 4.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = SK()) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(Math.max(0.1, rx))}" ry="${n(Math.max(0.1, ry))}" fill="${fill}" ${extra}/>`;
const pth = (d: string, fill: string, extra = SK()) => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d: string, w = 3, color = INK) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** A thick rounded "tube" (tail, tentacle, stalk): dark outline underneath, colour on top. */
const tube = (d: string, w: number, fill: string) => line(d, w + 8, INK) + line(d, w, fill);
const P = (x: number, y: number) => `${n(x)} ${n(y)}`;
function hex(h: string): [number, number, number] { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function mix(a: string, b: string, t: number) { const x = hex(a), y = hex(b); return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; }
function seeded(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ───────────── body plans: one simple silhouette per base animal ─────────────
type Snout = 'point' | 'round' | 'beak' | 'droop' | 'cone' | 'wide' | 'none';
interface Plan { bx: number; by: number; brx: number; bry: number; hx: number; hy: number; hrx: number; hry: number; snout: Snout; ears: 'point' | 'round' | 'tuft' | 'none'; upright?: boolean; lw: number; eyeDy: number; eyeR: number }
const PLANS: Record<string, Plan> = {
  fennec: { bx: 180, by: 198, brx: 72, bry: 42, hx: 266, hy: 148, hrx: 44, hry: 40, snout: 'point', ears: 'point', lw: 22, eyeDy: -0.12, eyeR: 0.3 },
  axolotl: { bx: 180, by: 214, brx: 80, bry: 36, hx: 270, hy: 186, hrx: 54, hry: 40, snout: 'wide', ears: 'none', lw: 20, eyeDy: -0.2, eyeR: 0.26 },
  gecko: { bx: 176, by: 222, brx: 84, bry: 30, hx: 270, hy: 200, hrx: 46, hry: 34, snout: 'round', ears: 'none', lw: 18, eyeDy: -0.25, eyeR: 0.32 },
  owl: { bx: 194, by: 190, brx: 54, bry: 62, hx: 212, hy: 114, hrx: 52, hry: 46, snout: 'beak', ears: 'tuft', upright: true, lw: 16, eyeDy: -0.05, eyeR: 0.36 },
  camel: { bx: 174, by: 180, brx: 72, bry: 42, hx: 284, hy: 100, hrx: 36, hry: 31, snout: 'droop', ears: 'round', lw: 20, eyeDy: -0.2, eyeR: 0.3 },
  frog: { bx: 184, by: 218, brx: 68, bry: 42, hx: 258, hy: 184, hrx: 52, hry: 38, snout: 'wide', ears: 'none', lw: 22, eyeDy: -0.45, eyeR: 0.34 },
  pangolin: { bx: 176, by: 208, brx: 82, bry: 44, hx: 272, hy: 204, hrx: 36, hry: 29, snout: 'cone', ears: 'round', lw: 22, eyeDy: -0.2, eyeR: 0.26 },
  octopus: { bx: 198, by: 224, brx: 54, bry: 30, hx: 212, hy: 152, hrx: 60, hry: 64, snout: 'none', ears: 'none', lw: 20, eyeDy: 0.22, eyeR: 0.24 },
};

// ───────────── expressions: only the face changes ─────────────
type Mouth = 'smile' | 'flat' | 'frown' | 'open' | 'o' | 'smirk' | 'grin';
interface Ex { lid: number; brow: number; browUp: number; mouth: Mouth; pupil: number; gx: number; gy: number; sweat: boolean; closed: boolean }
const EX: Record<Expression, Ex> = {
  neutral: { lid: 0.12, brow: 0, browUp: 0, mouth: 'smile', pupil: 1, gx: 0.15, gy: 0, sweat: false, closed: false },
  curious: { lid: 0, brow: -10, browUp: 5, mouth: 'o', pupil: 1.1, gx: 0.3, gy: -0.25, sweat: false, closed: false },
  happy: { lid: 1, brow: -6, browUp: 3, mouth: 'grin', pupil: 1, gx: 0, gy: 0, sweat: false, closed: true },
  frightened: { lid: 0, brow: -22, browUp: 7, mouth: 'open', pupil: 0.5, gx: 0, gy: 0, sweat: true, closed: false },
  suspicious: { lid: 0.5, brow: 16, browUp: -3, mouth: 'flat', pupil: 0.9, gx: 0.45, gy: 0, sweat: false, closed: false },
  confident: { lid: 0.28, brow: 12, browUp: 0, mouth: 'smirk', pupil: 1, gx: 0.2, gy: 0, sweat: false, closed: false },
  tired: { lid: 0.62, brow: -14, browUp: -2, mouth: 'frown', pupil: 0.9, gx: 0, gy: 0.3, sweat: false, closed: false },
  surprised: { lid: 0, brow: -4, browUp: 9, mouth: 'o', pupil: 0.6, gx: 0, gy: 0, sweat: false, closed: false },
};

export function creatureSvg(c: CreatureConfig, opts: CreatureSvgOpts = {}): string {
  const key = `${c.base}${c.head}${c.eyes}${c.limbs}${c.tail}${c.adaptation}${c.ability}${c.hue}`;
  const hash = Math.abs([...key].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7));
  const rnd = seeded(hash);
  const exName = opts.expression && EX[opts.expression] ? opts.expression : 'neutral';
  const ex = EX[exName];
  const id = `${opts.idPrefix ?? `cr${hash}`}${exName !== 'neutral' ? exName.slice(0, 3) : ''}`;
  const base = PLANS[c.base] ? c.base : 'fennec';
  const hue = HUES[c.hue] ?? HUES[0];
  const body = hue.body, dark = hue.dark, belly = hue.belly;
  const far = mix(dark, '#000000', 0.12);
  const p0 = PLANS[base];
  const fat = c.adaptation === 'blubber' ? 1.14 : 1;
  const pl: Plan = { ...p0, brx: p0.brx * fat, bry: p0.bry * fat };
  const { bx, by, brx, bry, hx, hy, hrx, hry } = pl;
  const hr = Math.min(hrx, hry);
  const back: string[] = [], mid: string[] = [], front: string[] = [], fx: string[] = [];

  // ── tail (behind everything) ──
  const tx = pl.upright ? bx - brx * 0.72 : bx - brx * 0.9, ty = pl.upright ? by + bry * 0.45 : by - bry * 0.05;
  back.push(tail(c.tail, tx, ty, body, dark, belly));

  // ── ink cloud sits behind the creature ──
  if (c.ability === 'ink') back.unshift([0, 1, 2, 3].map((i) => ell(tx - 34 - i * 13, ty + 20 - (i % 2) * 22, 26 - i * 3, 22 - i * 3, '#33303a', SK(3))).join(''));

  // ── far limbs + far wing ──
  const hipY = by + bry * 0.45;
  const hips = pl.upright ? [bx - 14, bx + 18] : [bx - brx * 0.5, bx + brx * 0.45];
  if (c.limbs === 'wings') back.push(wing(bx + brx * 0.25 + 26, by - bry * 0.72 - 8, far, mix(far, '#000000', 0.15)));
  back.push(limbs(c.limbs, hips.map((x) => x + 15), hipY, pl, far, far, true));

  // ── hump sits behind the body's top edge ──
  if (c.adaptation === 'hump') back.push(pl.upright ? ell(bx - brx * 0.78, by - bry * 0.25, brx * 0.42, bry * 0.4, body) : ell(bx - brx * 0.12, by - bry * 0.92, brx * 0.42, bry * 0.6, body));
  // ── spikes / fur along the back, also behind the body edge ──
  const arc = pl.upright ? [165, 255] : [205, 320];
  const onBack = (t: number, out = 0): [number, number] => { const a = ((arc[0] + (arc[1] - arc[0]) * t) * Math.PI) / 180; return [bx + Math.cos(a) * (brx + out), by + Math.sin(a) * (bry + out)]; };
  if (c.adaptation === 'spikes') for (let i = 0; i < 7; i++) { const t = i / 6; const [x0, y0] = onBack(t - 0.05, -6), [x1, y1] = onBack(t + 0.05, -6), [xt, yt] = onBack(t - 0.04, 30); back.push(pth(`M${P(x0, y0)} L${P(xt, yt)} L${P(x1, y1)} Z`, IVORY, SK(3.5))); }
  if (c.adaptation === 'thickFur') for (let i = 0; i < 8; i++) { const t = i / 7; const [x, y] = onBack(t, 2); back.push(ell(x, y, 15, 13, mix(body, '#ffffff', 0.25), SK(3.5))); }

  // ── neck + body ──
  mid.push(pth(`M${P(bx + brx * 0.35, by - bry * 0.75)} L${P(hx - hrx * 0.55, hy + hry * 0.45)} L${P(hx + hrx * 0.25, hy + hry * 0.8)} L${P(bx + brx * 0.9, by + bry * 0.15)} Z`, body));
  mid.push(ell(bx, by, brx, bry, body));
  mid.push(ell(bx + brx * 0.12, by + bry * 0.42, brx * 0.6, bry * 0.44, belly, 'stroke="none"'));
  mid.push(basePattern(base, pl, body, dark, belly, rnd));
  mid.push(adaptation(c.adaptation, pl, body, dark, belly, rnd, fx));

  // ── near limbs + near wing ──
  mid.push(limbs(c.limbs, hips, hipY, pl, body, belly, false));
  if (c.limbs === 'wings') mid.push(wing(bx + brx * 0.25, by - bry * 0.72, dark, mix(dark, '#000000', 0.2)));

  // ── head: back pieces, skull, face, front pieces ──
  const hb = headPart(c.head, pl, body, dark, belly, base);
  front.push(hb.back);
  front.push(ell(hx, hy, hrx, hry, body));
  front.push(snout(pl, body, dark, belly, c.ability));
  front.push(headPattern(base, pl, body, dark, belly));
  // eyes: near and far, both visible (three-quarter face) so feelings read at any size
  const eyR = hr * pl.eyeR * (c.eyes === 'owlEyes' ? 1.3 : c.eyes === 'tinyEyes' ? 0.4 : c.eyes === 'compound' ? 1.2 : 1);
  const ey = hy + hry * pl.eyeDy;
  const eyes: [number, number, number][] = [[hx + hrx * 0.56, ey - hry * 0.03, eyR * 0.88], [hx + hrx * 0.02, ey, eyR]];
  if (c.eyes === 'stalkEyes') eyes.forEach((e, i) => { const sx = e[0], sy0 = hy - hry * 0.75; e[1] = hy - hry * 1.55 + i * 4; front.push(tube(`M${P(sx, sy0)} Q${P(sx - 6, (sy0 + e[1]) / 2)} ${P(sx, e[1] + e[2])}`, 9, body)); });
  eyes.forEach(([x, y, r], i) => front.push(eye(c.eyes, x, y, r, ex, body, dark, i === 0)));
  front.push(mouth(pl, ex, base));
  front.push(hb.front);
  if (ex.sweat) front.push(pth(`M${P(hx - hrx * 0.8, hy - hry * 0.75)} q-9 16 0 22 q9 -6 0 -22 Z`, '#9fdcff', SK(3)));
  else front.push(pth(`M${P(hx - hrx * 0.8, hy - hry * 0.75)} q-1 1 0 1 Z`, 'none', 'stroke="none"'));

  // ── ability: a clear, readable effect ──
  fx.push(ability(c.ability, pl));
  // ── journey marks ──
  fx.push(marks(opts.marks ?? [], pl, rnd));

  const shadow = opts.ground === false ? '' : `<ellipse cx="${n(bx + 20)}" cy="${GROUND + 6}" rx="${n(brx * 1.25 + 30)}" ry="11" fill="#000" opacity=".28"/>`;
  let viewBox = `0 0 ${W} ${H}`;
  if (opts.crop === 'face') { const top = c.eyes === 'stalkEyes' ? hy - hry * 2.1 : hy - hry * 1.7; const fh = Math.max(hry * 3.1, hy + hry * 1.25 - top), fw = fh * 1.25; viewBox = `${n(hx + hrx * 0.2 - fw / 2)} ${n(top)} ${n(fw)} ${n(fh)}`; }
  const size = opts.width ? ` width="${opts.width}" height="${Math.round(opts.width * 0.8)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${size} role="img" aria-label="${escapeXml(c.name)}" data-id="${id}">${shadow}<g>${back.join('')}${mid.join('')}${front.join('')}${fx.join('')}</g></svg>`;
}

// ───────────── parts ─────────────
function tail(kind: string, x: number, y: number, body: string, dark: string, belly: string): string {
  switch (kind) {
    case 'fluffy': return pth(`M${P(x + 8, y)} C${P(x - 30, y + 30)} ${P(x - 95, y + 20)} ${P(x - 100, y - 30)} C${P(x - 102, y - 62)} ${P(x - 60, y - 70)} ${P(x - 44, y - 48)} C${P(x - 20, y - 40)} ${P(x - 4, y - 20)} ${P(x + 8, y)} Z`, body)
      + pth(`M${P(x - 100, y - 30)} C${P(x - 102, y - 62)} ${P(x - 60, y - 70)} ${P(x - 44, y - 48)} C${P(x - 62, y - 44)} ${P(x - 86, y - 36)} ${P(x - 100, y - 30)} Z`, belly, SK(3.5));
    case 'stinger': { const d = `M${P(x + 6, y)} C${P(x - 46, y + 8)} ${P(x - 92, y - 34)} ${P(x - 58, y - 84)}`;
      return tube(d, 17, body) + line(`M${P(x - 30, y - 4)} l-6 14 M${P(x - 58, y - 18)} l-13 9 M${P(x - 70, y - 48)} l-16 2 M${P(x - 64, y - 72)} l-14 -6`, 3)
        + pth(`M${P(x - 66, y - 84)} Q${P(x - 60, y - 112)} ${P(x - 26, y - 96)} Q${P(x - 44, y - 92)} ${P(x - 48, y - 76)} Z`, '#3a2a2a'); }
    case 'finTail': return tube(`M${P(x + 6, y)} Q${P(x - 22, y + 4)} ${P(x - 40, y - 4)}`, 16, body)
      + pth(`M${P(x - 36, y - 4)} L${P(x - 92, y - 46)} Q${P(x - 72, y - 4)} ${P(x - 92, y + 40)} Z`, belly) + line(`M${P(x - 44, y - 6)} L${P(x - 78, y - 28)} M${P(x - 44, y - 2)} L${P(x - 78, y + 22)}`, 2.5, dark);
    case 'prehensile': return tube(`M${P(x + 6, y)} C${P(x - 50, y + 10)} ${P(x - 92, y - 10)} ${P(x - 84, y - 48)} C${P(x - 78, y - 76)} ${P(x - 40, y - 70)} ${P(x - 46, y - 44)} C${P(x - 50, y - 30)} ${P(x - 66, y - 34)} ${P(x - 62, y - 46)}`, 12, body);
    case 'club': return tube(`M${P(x + 6, y)} Q${P(x - 34, y + 14)} ${P(x - 64, y - 6)}`, 18, body) + ell(x - 78, y - 14, 24, 21, dark)
      + [[-96, -26], [-84, -36], [-66, -30], [-98, -6]].map(([dx, dy]) => ell(x + dx, y + dy, 5, 5, IVORY, SK(2.5))).join('');
    case 'lure': return line(`M${P(x + 4, y - 6)} C${P(x - 60, y - 30)} ${P(x - 70, y - 120)} ${P(x - 6, y - 128)}`, 9, INK) + line(`M${P(x + 4, y - 6)} C${P(x - 60, y - 30)} ${P(x - 70, y - 120)} ${P(x - 6, y - 128)}`, 4, body)
      + `<circle cx="${n(x + 2)}" cy="${n(y - 128)}" r="22" fill="${GLOW}" opacity=".3"/>` + ell(x + 2, y - 128, 11, 11, GLOW, SK(3.5));
    default: return tube(`M${P(x + 6, y)} Q${P(x - 30, y + 8)} ${P(x - 56, y - 10)}`, 12, body);
  }
}

function wing(ax: number, ay: number, fill: string, bone: string): string {
  const t1: [number, number] = [ax - 46, ay - 92], t2: [number, number] = [ax - 118, ay - 58], t3: [number, number] = [ax - 128, ay + 8], b: [number, number] = [ax - 42, ay + 26];
  const mid = (p: [number, number], q: [number, number]) => `${n((p[0] + q[0]) / 2 * 0.82 + ax * 0.18)} ${n((p[1] + q[1]) / 2 * 0.82 + ay * 0.18)}`;
  return pth(`M${P(ax, ay)} L${P(...t1)} Q${mid(t1, t2)} ${P(...t2)} Q${mid(t2, t3)} ${P(...t3)} Q${mid(t3, b)} ${P(...b)} Z`, fill)
    + line(`M${P(ax, ay)} L${P(...t1)} M${P(ax, ay)} L${P(...t2)} M${P(ax, ay)} L${P(...t3)}`, 3, bone);
}

function limbs(kind: string, hips: number[], hipY: number, pl: Plan, fill: string, pad: string, isFar: boolean): string {
  const g = GROUND, w = pl.lw;
  const leg = (x: number, top: number, bottom = g - 5, lw = w) => pth(`M${P(x - lw / 2, top)} L${P(x - lw / 2, bottom)} Q${P(x, bottom + 7)} ${P(x + lw / 2, bottom)} L${P(x + lw / 2, top)} Z`, fill);
  const paw = (x: number) => ell(x + 5, g - 3, w * 0.72, 8, fill);
  const out: string[] = [];
  if (kind === 'tentacles') {
    hips.forEach((x, i) => { const dir = i === 0 ? -1 : 1; const d = `M${P(x, hipY)} C${P(x + dir * 4, hipY + 34)} ${P(x + dir * 30, g - 14)} ${P(x + dir * 46, g - 6)} C${P(x + dir * 60, g)} ${P(x + dir * 66, g - 20)} ${P(x + dir * 54, g - 22)}`;
      out.push(tube(d, w * 0.72, fill)); if (!isFar) for (let k = 0; k < 3; k++) out.push(ell(x + dir * (12 + k * 12), hipY + 36 + k * 9, 3.2, 3.2, pad, SK(2))); });
    return out.join('');
  }
  if (kind === 'springLegs') {
    const [hb, hf] = hips;
    out.push(ell(hb - 4, hipY + 8, 30, 21, fill), pth(`M${P(hb - 26, hipY + 20)} L${P(hb - 30, g - 14)} L${P(hb + 44, g - 4)} Q${P(hb + 52, g + 2)} ${P(hb + 40, g + 4)} L${P(hb - 36, g + 4)} Q${P(hb - 44, g)} ${P(hb - 40, hipY + 16)} Z`, fill));
    out.push(leg(hf, hipY, hipY + 30, w * 0.7), ell(hf + 3, hipY + 34, w * 0.5, 6, fill));
    return out.join('');
  }
  hips.forEach((x, i) => {
    const frontLeg = i === 1;
    if (kind === 'digClaws' && frontLeg) {
      out.push(leg(x, hipY, g - 8, w * 1.25));
      for (let k = 0; k < 3; k++) out.push(pth(`M${P(x - 8 + k * 10, g - 10)} q4 16 22 14 q-8 -6 -10 -16 Z`, IVORY, SK(3)));
    } else if (kind === 'webbed') {
      out.push(leg(x, hipY, g - 8));
      out.push(pth(`M${P(x - 9, g - 9)} L${P(x + 30, g - 12)} L${P(x + 36, g + 2)} L${P(x - 12, g + 3)} Z`, '#f4a938') + line(`M${P(x + 2, g - 8)} L${P(x + 10, g + 1)} M${P(x + 14, g - 10)} L${P(x + 24, g + 1)}`, 2.2));
    } else if (kind === 'climbClaws') {
      out.push(leg(x, hipY), paw(x));
      for (let k = 0; k < 3; k++) out.push(pth(`M${P(x + 2 + k * 8, g - 6)} q12 0 13 12 q-9 -3 -15 -4 Z`, IVORY, SK(2.6)));
    } else out.push(leg(x, hipY), paw(x));
  });
  return out.join('');
}

function basePattern(base: string, pl: Plan, body: string, dark: string, belly: string, rnd: () => number): string {
  const { bx, by, brx, bry } = pl; const out: string[] = [];
  const at = (u: number, v: number): [number, number] => [bx + u * brx, by + v * bry];
  if (base === 'gecko') for (let i = 0; i < 6; i++) { const [x, y] = at(-0.65 + i * 0.24, -0.5 + (i % 2) * 0.28); out.push(ell(x, y, 7, 5.5, dark, 'stroke="none"')); }
  if (base === 'frog') [[-0.5, -0.45, 15, 11], [0, -0.6, 17, 10], [0.45, -0.35, 12, 10], [-0.2, -0.05, 10, 8]].forEach(([u, v, rx, ry]) => { const [x, y] = at(u, v); out.push(ell(x, y, rx, ry, INK, 'stroke="none"')); });
  if (base === 'pangolin') for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) { const [x, y] = at(-0.72 + i * 0.28 + r * 0.14, -0.62 + r * 0.34); out.push(pth(`M${P(x - 11, y)} Q${P(x, y + 15)} ${P(x + 11, y)}`, mix(body, '#ffffff', 0.18), SK(3))); }
  if (base === 'owl') for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { const [x, y] = at(-0.12 + i * 0.26 + (r % 2) * 0.12, 0.12 + r * 0.22); out.push(line(`M${P(x - 7, y)} Q${P(x, y + 9)} ${P(x + 7, y)}`, 2.6, dark)); }
  if (base === 'axolotl') for (let i = 0; i < 5; i++) { const [x, y] = at(-0.6 + rnd() * 1.1, -0.6 + rnd() * 0.5); out.push(ell(x, y, 3.2, 3.2, dark, 'stroke="none"')); }
  if (base === 'camel') { const [x, y] = at(0.2, -0.95); out.push(ell(x, y, 12, 9, mix(body, '#ffffff', 0.2), SK(3))); }
  if (base === 'octopus') [[-0.4, -0.2], [0.35, -0.3]].forEach(([u, v]) => { const [x, y] = at(u, v); out.push(ell(x, y, 5, 5, dark, 'stroke="none"')); });
  void belly;
  return out.join('');
}

function headPattern(base: string, pl: Plan, body: string, dark: string, belly: string): string {
  const { hx, hy, hrx, hry } = pl; const out: string[] = [];
  if (base === 'owl') out.push(ell(hx + hrx * 0.3, hy + hry * 0.02, hrx * 0.78, hry * 0.7, belly, SK(3)));
  if (base === 'fennec') out.push(pth(`M${P(hx - hrx * 0.7, hy + hry * 0.2)} l-14 12 l14 4 l-8 12 l20 -4 Z`, belly, SK(3)));
  if (base === 'axolotl' || base === 'frog') out.push(ell(hx + hrx * 0.1, hy + hry * 0.38, 9, 6, PINK, 'stroke="none" opacity=".75"'));
  if (base === 'octopus') [[-0.45, -0.5], [0.1, -0.7], [0.5, -0.4]].forEach(([u, v]) => out.push(ell(hx + u * hrx, hy + v * hry, 7, 7, dark, 'stroke="none"')));
  if (base === 'pangolin') for (let i = 0; i < 3; i++) out.push(pth(`M${P(hx - hrx * 0.6 + i * 16, hy - hry * 0.6)} q9 12 18 0`, mix(body, '#ffffff', 0.18), SK(2.6)));
  return out.join('');
}

function snout(pl: Plan, body: string, dark: string, belly: string, abilityId: string): string {
  const { hx, hy, hrx, hry } = pl; const big = abilityId === 'smell' ? 1.7 : 1; const out: string[] = [];
  switch (pl.snout) {
    case 'point': out.push(pth(`M${P(hx + hrx * 0.5, hy)} Q${P(hx + hrx * 1.1, hy + hry * 0.1)} ${P(hx + hrx * 1.3, hy + hry * 0.42)} Q${P(hx + hrx * 0.9, hy + hry * 0.9)} ${P(hx + hrx * 0.3, hy + hry * 0.78)} Z`, belly), ell(hx + hrx * 1.26, hy + hry * 0.38, 7 * big, 6 * big, INK, 'stroke="none"')); break;
    case 'droop': out.push(ell(hx + hrx * 0.85, hy + hry * 0.42, hrx * 0.62, hry * 0.52, belly), ell(hx + hrx * 1.2, hy + hry * 0.22, 4 * big, 3 * big, INK, 'stroke="none"')); break;
    case 'cone': out.push(pth(`M${P(hx + hrx * 0.55, hy - hry * 0.45)} L${P(hx + hrx * 2.0, hy + hry * 0.25)} Q${P(hx + hrx * 2.06, hy + hry * 0.55)} ${P(hx + hrx * 1.9, hy + hry * 0.6)} L${P(hx + hrx * 0.4, hy + hry * 0.8)} Z`, body), ell(hx + hrx * 1.98, hy + hry * 0.36, 5.5 * big, 5 * big, INK, 'stroke="none"')); break;
    case 'beak': out.push(pth(`M${P(hx + hrx * 0.16, hy + hry * 0.12)} L${P(hx + hrx * 0.5, hy + hry * 0.12)} L${P(hx + hrx * 0.34, hy + hry * 0.52)} Z`, '#f4a938', SK(3.5))); break;
    case 'round': out.push(ell(hx + hrx * 0.82, hy - hry * 0.1, 3 * big, 3 * big, INK, 'stroke="none"')); break;
    case 'wide': out.push(ell(hx + hrx * 0.7, hy - hry * 0.05, 2.6 * big, 2.6 * big, INK, 'stroke="none"'), ell(hx + hrx * 0.86, hy - hry * 0.02, 2.6 * big, 2.6 * big, INK, 'stroke="none"')); break;
    default: out.push(pth(`M${P(hx - hrx * 0.95, hy + hry * 0.35)} q-18 4 -16 18 q10 2 20 -6 Z`, dark, SK(3.5)));
  }
  if (abilityId === 'heatPits') for (let i = 0; i < 3; i++) out.push(ell(hx + hrx * (0.38 + i * 0.16), hy + hry * 0.18 + i * 3, 3.4, 3.4, '#e5483b', SK(1.6)));
  return out.join('');
}

function mouth(pl: Plan, ex: Ex, base: string): string {
  const { hx, hy, hrx, hry } = pl;
  // where the mouth sits and how wide it is, per face shape
  const M: Record<Snout, [number, number, number]> = { point: [0.82, 0.62, 0.34], droop: [0.9, 0.66, 0.4], cone: [1.3, 0.6, 0.5], beak: [0.34, 0.62, 0.18], round: [0.42, 0.42, 0.62], wide: [0.3, 0.42, 0.78], none: [0.28, 0.62, 0.3] };
  const [u, v, wf] = M[pl.snout]; const x = hx + hrx * u, y = hy + hry * v, w = hrx * wf, a = x - w / 2, b = x + w / 2;
  void base;
  switch (ex.mouth) {
    case 'grin': return pth(`M${P(a, y - 2)} Q${P(x, y + w * 0.75)} ${P(b, y - 2)} Q${P(x, y + 3)} ${P(a, y - 2)} Z`, '#7a2330', SK(3.5));
    case 'open': return pth(`M${P(a + w * 0.15, y)} Q${P(x, y - w * 0.3)} ${P(b - w * 0.15, y)} Q${P(x, y + w * 0.8)} ${P(a + w * 0.15, y)} Z`, '#7a2330', SK(3.5));
    case 'o': return pth(`M${P(x - w * 0.16, y + 3)} Q${P(x, y - w * 0.22 + 3)} ${P(x + w * 0.16, y + 3)} Q${P(x, y + w * 0.3 + 3)} ${P(x - w * 0.16, y + 3)} Z`, '#7a2330', SK(3.2));
    case 'flat': return pth(`M${P(a, y + 2)} Q${P(x, y + 2.1)} ${P(b, y + 1)}`, 'none', SK(3.8));
    case 'frown': return pth(`M${P(a, y + 7)} Q${P(x, y - 4)} ${P(b, y + 7)}`, 'none', SK(3.8));
    case 'smirk': return pth(`M${P(a, y + 2)} Q${P(x + w * 0.1, y + 9)} ${P(b, y - 5)}`, 'none', SK(3.8));
    default: return pth(`M${P(a, y)} Q${P(x, y + w * 0.36)} ${P(b, y)}`, 'none', SK(3.8));
  }
}

function eye(kind: string, x: number, y: number, r: number, ex: Ex, body: string, dark: string, isFar: boolean): string {
  const out: string[] = []; const ry = r * 1.05;
  const gx = ex.gx * r * 0.42, gy = ex.gy * r * 0.42;
  if (kind === 'glowEyes') out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 1.9)}" fill="${GLOW}" opacity=".28"/>`); else out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="0.1" fill="none"/>`);
  if (kind === 'chameleon') {
    // a turret: a cone of skin with a small eye at its tip, each eye pointing its own way
    const dx = isFar ? r * 0.35 : -r * 0.1, dy = isFar ? -r * 0.4 : r * 0.15;
    out.push(ell(x, y, r * 1.15, r * 1.15, mix(body, '#ffffff', 0.12)), ell(x + dx * 0.5, y + dy * 0.5, r * 0.78, r * 0.78, body, SK(2.6)), ell(x + dx, y + dy, r * 0.42, r * 0.42, '#ffffff', SK(2.6)), ell(x + dx + gx * 0.3, y + dy, r * 0.2 * ex.pupil, r * 0.2 * ex.pupil, INK, 'stroke="none"'));
  } else if (kind === 'compound') {
    out.push(ell(x, y, r, ry, '#b3262b'));
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; out.push(ell(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * ry * 0.5, r * 0.17, r * 0.17, '#e86a5c', 'stroke="none"')); }
    out.push(ell(x - r * 0.3, y - ry * 0.35, r * 0.2, r * 0.14, '#ffffff', 'stroke="none"'));
  } else if (kind === 'tinyEyes') {
    out.push(ell(x, y, r, r, INK, 'stroke="none"'), ell(x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3, '#ffffff', 'stroke="none"'));
  } else {
    const white = kind === 'glowEyes' ? GLOW : '#ffffff';
    const iris = kind === 'owlEyes' ? '#f2b631' : kind === 'glowEyes' ? '#fff6c2' : mix(dark, '#2b5d7a', 0.35);
    out.push(ell(x, y, r, ry, white));
    out.push(ell(x + gx, y + gy, r * 0.62, r * 0.62, iris, 'stroke="none"'));
    out.push(kind === 'glowEyes' ? ell(x + gx, y + gy, r * 0.14 * ex.pupil, r * 0.5 * ex.pupil, INK, 'stroke="none"') : ell(x + gx, y + gy, r * 0.36 * ex.pupil, r * 0.36 * ex.pupil, INK, 'stroke="none"'));
    out.push(ell(x + gx - r * 0.2, y + gy - r * 0.22, r * 0.15, r * 0.15, '#ffffff', 'stroke="none"'));
  }
  // eyelid: a cap of skin from the top; fully closed for a happy squint
  if (kind !== 'tinyEyes' && kind !== 'chameleon') {
    const lid = Math.min(0.999, Math.max(0.001, ex.lid));
    const yl = y - ry + lid * 2 * ry; const k = Math.sqrt(Math.max(0, 1 - ((yl - y) / ry) ** 2)) * r;
    out.push(pth(`M${P(x - k, yl)} A${n(r)} ${n(ry)} 0 ${lid > 0.5 ? 1 : 0} 1 ${P(x + k, yl)} Z`, body, lid < 0.06 ? 'stroke="none" opacity="0"' : SK(3)));
    out.push(pth(`M${P(x - r * 0.75, y + ry * 0.15)} Q${P(x, y - ry * 0.75)} ${P(x + r * 0.75, y + ry * 0.15)}`, 'none', ex.closed ? SK(4) : 'stroke="none"'));
    // brow
    const by2 = y - ry - 5 - ex.browUp, t = (ex.brow * (isFar ? -1 : 1) * Math.PI) / 180, bw = r * 0.95;
    out.push(pth(`M${P(x - Math.cos(t) * bw, by2 - Math.sin(t) * bw)} L${P(x + Math.cos(t) * bw, by2 + Math.sin(t) * bw)}`, 'none', SK(4)));
  }
  return out.join('');
}

function headPart(kind: string, pl: Plan, body: string, dark: string, belly: string, base: string): { back: string; front: string } {
  const { hx, hy, hrx, hry } = pl; const back: string[] = [], front: string[] = [];
  const ear = (dx: number, tall: number, wide: number, fill: string, inner: string) => {
    const x = hx + dx; const d = `M${P(x - wide, hy - hry * 0.45)} Q${P(x - wide * 1.3, hy - hry * (0.8 + tall * 0.6))} ${P(x - wide * 0.5, hy - hry * (1 + tall))} Q${P(x + wide * 0.9, hy - hry * (0.8 + tall * 0.5))} ${P(x + wide, hy - hry * 0.55)} Z`;
    const di = `M${P(x - wide * 0.5, hy - hry * 0.62)} Q${P(x - wide * 0.7, hy - hry * (0.8 + tall * 0.5))} ${P(x - wide * 0.4, hy - hry * (0.86 + tall * 0.8))} Q${P(x + wide * 0.4, hy - hry * (0.8 + tall * 0.4))} ${P(x + wide * 0.5, hy - hry * 0.7)} Z`;
    return pth(d, fill) + pth(di, inner, 'stroke="none"');
  };
  // the base animal's own small ears (replaced by big ears, hidden by a helmet)
  if (kind !== 'bigEars' && kind !== 'helmet') {
    if (pl.ears === 'point') back.push(ear(hrx * 0.5, 0.75, hrx * 0.3, dark, PINK), ear(-hrx * 0.2, 0.8, hrx * 0.32, body, PINK));
    if (pl.ears === 'round') back.push(ell(hx - hrx * 0.5, hy - hry * 0.85, hrx * 0.24, hry * 0.26, body));
    if (pl.ears === 'tuft') back.push(pth(`M${P(hx - hrx * 0.7, hy - hry * 0.55)} L${P(hx - hrx * 0.75, hy - hry * 1.3)} L${P(hx - hrx * 0.25, hy - hry * 0.85)} Z`, body), pth(`M${P(hx + hrx * 0.45, hy - hry * 0.8)} L${P(hx + hrx * 0.85, hy - hry * 1.3)} L${P(hx + hrx * 0.85, hy - hry * 0.5)} Z`, body));
  }
  switch (kind) {
    case 'bigEars': back.push(ear(hrx * 0.62, 1.7, hrx * 0.5, dark, PINK), ear(-hrx * 0.25, 1.8, hrx * 0.55, body, PINK)); break;
    case 'horns': {
      const horn = (dx: number, fill: string) => { const x = hx + dx, y = hy - hry * 0.8; return pth(`M${P(x - 10, y)} C${P(x - 6, y - 60)} ${P(x - 70, y - 78)} ${P(x - 96, y - 28)} C${P(x - 70, y - 52)} ${P(x - 22, y - 46)} ${P(x + 12, y + 2)} Z`, fill) + line(`M${P(x - 14, y - 34)} l12 6 M${P(x - 34, y - 50)} l8 10 M${P(x - 58, y - 52)} l4 11`, 2.4); };
      back.push(horn(hrx * 0.5, mix(IVORY, '#8a7a5a', 0.35))); front.push(horn(-hrx * 0.05, IVORY)); break;
    }
    case 'crest': { const cols = ['#e5483b', '#f4a938', '#ffe36b', '#f4a938', '#e5483b']; cols.forEach((col, i) => { const a = ((-150 + i * 26) * Math.PI) / 180, x0 = hx - hrx * 0.1 + i * 5, y0 = hy - hry * 0.85, L = 62 - Math.abs(i - 2) * 8; const xt = x0 + Math.cos(a) * L, yt = y0 + Math.sin(a) * L; back.push(pth(`M${P(x0 - 7, y0)} Q${P(xt - 14, yt + 8)} ${P(xt, yt)} Q${P(xt + 12, yt + 14)} ${P(x0 + 7, y0)} Z`, col, SK(3.5))); }); break; }
    case 'gillFrills': for (let i = 0; i < 3; i++) { const a = ((200 + i * 28) * Math.PI) / 180, x0 = hx + Math.cos(a) * hrx * 0.85, y0 = hy + Math.sin(a) * hry * 0.85, xt = x0 + Math.cos(a) * 46, yt = y0 + Math.sin(a) * 46; back.push(line(`M${P(x0, y0)} L${P(xt, yt)}`, 13, INK) + line(`M${P(x0, y0)} L${P(xt, yt)}`, 6.5, PINK)); for (let k = 1; k <= 3; k++) { const px = x0 + (xt - x0) * (k / 3.4), py = y0 + (yt - y0) * (k / 3.4); back.push(line(`M${P(px, py)} l${n(-Math.sin(a) * 10)} ${n(Math.cos(a) * 10)} M${P(px, py)} l${n(Math.sin(a) * 10)} ${n(-Math.cos(a) * 10)}`, 3.2, '#d8607e')); } } break;
    case 'antennae': [[-0.15, -1], [0.45, 1]].forEach(([u, dir], i) => { const x0 = hx + hrx * u, y0 = hy - hry * 0.85, xt = x0 + dir * 26 - 20, yt = y0 - 66; const d = `M${P(x0, y0)} Q${P(x0 - 16, y0 - 40)} ${P(xt, yt)}`; (i ? back : front).push(line(d, 4)); for (let k = 1; k <= 5; k++) { const t = k / 5.4, px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * (x0 - 16) + t * t * xt, py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (y0 - 40) + t * t * yt; (i ? back : front).push(line(`M${P(px, py)} l-11 -5 M${P(px, py)} l11 -5`, 2.6, mix(IVORY, '#8a5a2a', 0.4))); } }); break;
    case 'helmet': front.push(pth(`M${P(hx - hrx * 1.02, hy - hry * 0.2)} A${n(hrx * 1.04)} ${n(hry * 1.06)} 0 0 1 ${P(hx + hrx * 0.98, hy - hry * 0.42)} Q${P(hx, hy - hry * 0.78)} ${P(hx - hrx * 1.02, hy - hry * 0.2)} Z`, IVORY) + line(`M${P(hx - hrx * 0.1, hy - hry * 1.04)} Q${P(hx - hrx * 0.2, hy - hry * 0.8)} ${P(hx - hrx * 0.15, hy - hry * 0.62)}`, 3, '#b9a57a') + ell(hx - hrx * 0.62, hy - hry * 0.55, 3.6, 3.6, '#b9a57a', 'stroke="none"') + ell(hx + hrx * 0.5, hy - hry * 0.66, 3.6, 3.6, '#b9a57a', 'stroke="none"')); break;
  }
  void belly; void base;
  return { back: back.join(''), front: front.join('') };
}

function adaptation(kind: string, pl: Plan, body: string, dark: string, belly: string, rnd: () => number, fx: string[]): string {
  const { bx, by, brx, bry } = pl; const out: string[] = [];
  const inside = (): [number, number] => { const a = rnd() * Math.PI * 2, r = 0.2 + rnd() * 0.5; return [bx + Math.cos(a) * brx * r, by - bry * 0.1 + Math.sin(a) * bry * r * 0.8]; };
  switch (kind) {
    case 'camo': for (let i = 0; i < 6; i++) { const [x, y] = inside(); out.push(ell(x, y, 12 + rnd() * 10, 8 + rnd() * 6, i % 2 ? '#4f6b3a' : '#8a6a3c', 'stroke="none" opacity=".7"')); } break;
    case 'shell': out.push(pth(`M${P(bx - brx * 0.98, by - bry * 0.05)} A${n(brx)} ${n(bry)} 0 0 1 ${P(bx + brx * 0.9, by - bry * 0.3)} Q${P(bx, by - bry * 0.05)} ${P(bx - brx * 0.98, by - bry * 0.05)} Z`, '#c9b38a')
      + line(`M${P(bx - brx * 0.45, by - bry * 0.86)} Q${P(bx - brx * 0.38, by - bry * 0.45)} ${P(bx - brx * 0.5, by - bry * 0.1)} M${P(bx + brx * 0.05, by - bry * 0.98)} Q${P(bx + brx * 0.1, by - bry * 0.55)} ${P(bx, by - bry * 0.15)} M${P(bx + brx * 0.5, by - bry * 0.84)} Q${P(bx + brx * 0.5, by - bry * 0.5)} ${P(bx + brx * 0.42, by - bry * 0.24)}`, 3, '#8f7a52')); break;
    case 'biolum': for (let i = 0; i < 6; i++) { const [x, y] = inside(); out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="11" fill="${CYAN}" opacity=".3"/>` + ell(x, y, 5, 5, CYAN, SK(2))); } break;
    case 'gills': for (let i = 0; i < 3; i++) { const x = bx + brx * (0.42 + i * 0.13), y = by - bry * 0.28; out.push(pth(`M${P(x, y - 13)} Q${P(x + 9, y)} ${P(x, y + 13)}`, 'none', `stroke="#c43d55" stroke-width="5" stroke-linecap="round"`)); } break;
    case 'blubber': out.push(line(`M${P(bx - brx * 0.5, by + bry * 0.55)} Q${P(bx, by + bry * 0.8)} ${P(bx + brx * 0.55, by + bry * 0.5)} M${P(bx - brx * 0.3, by + bry * 0.2)} Q${P(bx + brx * 0.1, by + bry * 0.42)} ${P(bx + brx * 0.5, by + bry * 0.16)}`, 3, mix(belly, INK, 0.45))); break;
    case 'thickFur': for (let i = 0; i < 3; i++) out.push(ell(bx + brx * (0.52 + i * 0.12), by - bry * 0.1 + i * 12, 13, 12, mix(belly, '#ffffff', 0.3), SK(3))); break;
  }
  void body; void dark; void fx;
  return out.join('');
}

function ability(kind: string, pl: Plan): string {
  const { bx, by, brx, bry, hx, hy, hrx, hry } = pl; const out: string[] = [];
  const mx = hx + hrx * (pl.snout === 'cone' ? 2.1 : pl.snout === 'none' ? 1.05 : 1.35), my = hy + hry * 0.4;
  switch (kind) {
    case 'echo': for (let i = 0; i < 3; i++) out.push(line(`M${P(mx + 8 + i * 12, my - 10 - i * 7)} Q${P(mx + 20 + i * 14, my)} ${P(mx + 8 + i * 12, my + 10 + i * 7)}`, 4, '#bfe9ff')); break;
    case 'shock': (pl.upright ? [[bx - brx * 1.5, by - bry * 0.9], [bx - brx * 1.2, by + bry * 0.1]] : [[bx - brx * 0.55, by - bry - 44], [bx + brx * 0.05, by - bry - 52]]).forEach(([x, y]) => out.push(pth(`M${P(x, y)} l14 0 l-7 16 l13 0 l-24 30 l6 -20 l-12 0 Z`, GLOW, SK(3)))); break;
    case 'regen': [[bx - brx * 0.55, by - bry - 22], [bx + brx * 0.1, by - bry - 40], [bx + brx * 0.8, by + bry * 0.75]].forEach(([x, y], i) => { const s = 8 - i; out.push(pth(`M${P(x - s, y - 2.5)} h${n(s - 2.5)} v${n(-(s - 2.5))} h5 v${n(s - 2.5)} h${n(s - 2.5)} v5 h${n(-(s - 2.5))} v${n(s - 2.5)} h-5 v${n(-(s - 2.5))} h${n(-(s - 2.5))} Z`, '#5fdc7a', SK(2.6))); }); break;
    case 'mimicry': [[mx + 8, my - 30], [mx + 30, my - 12]].forEach(([x, y]) => out.push(ell(x, y + 16, 6.5, 5, INK, 'stroke="none"') + line(`M${P(x + 5.5, y + 16)} L${P(x + 5.5, y - 6)} q10 2 10 12`, 3.2))); break;
    case 'heatPits': for (let i = 0; i < 3; i++) out.push(line(`M${P(mx + 8 + i * 11, my - 22)} q7 8 0 15 q-7 8 0 15`, 3.2, '#ff7a55')); break;
    case 'smell': for (let i = 0; i < 2; i++) out.push(line(`M${P(mx + 6, my - 4 + i * 12)} q12 -12 22 0 q8 10 20 -2`, 3.2, '#a6e08a')); break;
    case 'pressure': out.push(line(`M${P(bx - brx * 0.35, by - bry * 0.92)} Q${P(bx - brx * 0.5, by)} ${P(bx - brx * 0.35, by + bry * 0.9)} M${P(bx + brx * 0.3, by - bry * 0.94)} Q${P(bx + brx * 0.16, by)} ${P(bx + brx * 0.3, by + bry * 0.92)}`, 3.4, mix('#ffffff', INK, 0.55)));
      [[hx + hrx * 0.9, hy - hry * 1.3, 7], [hx + hrx * 1.25, hy - hry * 1.7, 4.5], [hx + hrx * 0.6, hy - hry * 1.85, 3.5]].forEach(([x, y, r]) => out.push(`<circle cx="${n(x)}" cy="${n(Math.max(8, y))}" r="${r}" fill="none" stroke="#bfe9ff" stroke-width="2.6"/>`)); break;
  }
  return out.join('');
}

function marks(list: CreatureMark[], pl: Plan, rnd: () => number): string {
  const { bx, by, brx, bry, hx, hy, hrx, hry } = pl; const out: string[] = [];
  const on = (): [number, number] => { const a = rnd() * Math.PI * 2, r = 0.25 + rnd() * 0.45; return [bx + Math.cos(a) * brx * r, by + Math.sin(a) * bry * r]; };
  for (const m of list) {
    if (m === 'mud') [[-0.5, 0.75, 16, 9], [0.4, 0.8, 14, 8], [0, 0.6, 10, 6]].forEach(([u, v, rx, ry]) => out.push(ell(bx + u * brx, by + v * bry, rx, ry, '#6b4a2b', 'stroke="none" opacity=".9"')));
    if (m === 'dust') for (let i = 0; i < 7; i++) { const [x, y] = on(); out.push(ell(x, y + bry * 0.3, 4, 3, '#cdb68c', 'stroke="none" opacity=".75"')); }
    if (m === 'soot') for (let i = 0; i < 3; i++) { const [x, y] = on(); out.push(ell(x, y, 13, 8, '#2b2b2f', 'stroke="none" opacity=".5"')); }
    if (m === 'wet') [[bx - brx * 0.3, by + bry + 4], [bx + brx * 0.35, by + bry + 10], [hx - hrx * 0.5, hy + hry + 6]].forEach(([x, y]) => out.push(pth(`M${P(x, y)} q-6 11 0 15 q6 -4 0 -15 Z`, '#8fd6ff', SK(2.2))));
    if (m === 'glow') for (let i = 0; i < 5; i++) { const [x, y] = on(); out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="7" fill="${CYAN}" opacity=".3"/>` + ell(x, y, 2.8, 2.8, CYAN, 'stroke="none"')); }
    if (m === 'frost') [[bx - brx * 0.4, by - bry * 0.7], [bx + brx * 0.3, by - bry * 0.85], [hx - hrx * 0.3, hy - hry * 0.95]].forEach(([x, y]) => out.push(line(`M${P(x - 7, y)} h14 M${P(x, y - 7)} v14 M${P(x - 5, y - 5)} l10 10 M${P(x + 5, y - 5)} l-10 10`, 2.4, '#e9f8ff')));
    if (m === 'scratches') [[bx - brx * 0.3, by - bry * 0.2], [bx + brx * 0.35, by + bry * 0.1]].forEach(([x, y]) => out.push(line(`M${P(x - 9, y - 7)} l12 14 M${P(x - 2, y - 9)} l12 14 M${P(x + 5, y - 11)} l12 14`, 2.6, '#a3323a')));
    if (m === 'fatigue') out.push(pth(`M${P(hx + hrx * 0.9, hy - hry * 0.9)} q-7 13 0 18 q7 -5 0 -18 Z`, '#9fdcff', SK(2.4)));
  }
  return out.join('');
}
