import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { creatureSvg, EXPRESSIONS } from '../../src/art/creatureSvg';
import { partsFor } from '../../src/content/parts';
import { SLOTS } from '../../src/engine/types';
const mode = process.argv[2] ?? 'parts';
const items: { svg: string; label: string }[] = [];
const bases = partsFor('base').map((p) => p.id);
if (mode === 'parts') {
  // every part appears at least once: 8 columns, rows cycle through options
  for (let r = 0; r < 8; r++) for (let b = 0; b < 8; b++) {
    const c: any = { name: 'x', hue: (b + r) % 8, base: bases[b] };
    for (const s of SLOTS) if (s !== 'base') { const ps = partsFor(s); c[s] = ps[(r + b * (s.length % 3 + 1)) % ps.length].id; }
    items.push({ svg: creatureSvg(c, { width: 300, expression: EXPRESSIONS[r] }), label: `${c.base} ${c.head} ${c.eyes} | ${c.limbs} ${c.tail} | ${c.adaptation} ${c.ability}` });
  }
} else {
  const c: any = { name: 'x', hue: 4, base: 'fennec', head: 'bigEars', eyes: 'owlEyes', limbs: 'climbClaws', tail: 'fluffy', adaptation: 'biolum', ability: 'echo' };
  for (const e of EXPRESSIONS) items.push({ svg: creatureSvg(c, { width: 300, expression: e }), label: e });
  for (const e of EXPRESSIONS) items.push({ svg: creatureSvg(c, { width: 300, expression: e, crop: 'face' }), label: e + ' face' });
  const marks = ['mud','frost','dust','wet','glow','soot','scratches','fatigue'] as const;
  for (const m of marks) items.push({ svg: creatureSvg({ ...c, base: 'camel', hue: 0 }, { width: 300, marks: [m] }), label: m });
}
async function main() {
const cols = 8, cw = 300, ch = 262, rows = Math.ceil(items.length / cols);
const cv = createCanvas(cols * cw, rows * ch); const g = cv.getContext('2d');
g.fillStyle = '#14181c'; g.fillRect(0, 0, cv.width, cv.height);
for (let i = 0; i < items.length; i++) {
  const im = await loadImage(Buffer.from(items[i].svg));
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  g.drawImage(im, x, y, 300, 240);
  g.fillStyle = '#cfc6b2'; g.font = '11px sans-serif'; g.fillText(items[i].label, x + 6, y + 254);
}
writeFileSync(process.argv[3] ?? `creatures-${mode}.png`, cv.toBuffer('image/png'));
console.log('ok', items.length);
}
main();
