import { PART_BY_ID, partsFor, HUES } from '../content/parts';
import { Rng } from './rng';
import { SLOTS, STAT_KEYS, type Capability, type CreatureConfig, type DerivedCreature, type Part, type Slot, type Stats, type StatKey } from './types';

export function emptyStats(): Stats {
  return Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
}

export function derive(config: CreatureConfig): DerivedCreature {
  const stats = emptyStats();
  const caps = new Set<Capability>();
  const parts = {} as Record<Slot, Part>;
  for (const slot of SLOTS) {
    const part = PART_BY_ID[config[slot]];
    if (!part || part.slot !== slot) throw new Error(`Invalid ${slot}: ${config[slot]}`);
    parts[slot] = part;
    for (const [k, v] of Object.entries(part.stats)) stats[k as StatKey] += v ?? 0;
    part.caps?.forEach((c) => caps.add(c));
  }
  // Emergent synergies: some combinations unlock capabilities no single part gives.
  if (caps.has('fly') && (config.adaptation === 'shell' || config.tail === 'club')) {
    caps.delete('fly'); caps.add('glide'); // too heavy for powered flight
  }
  if (caps.has('swim') && caps.has('breatheWater')) stats.swim += 1;
  if (caps.has('glow') && caps.has('nightVision')) stats.intellect += 1;
  return { config, stats, caps, parts };
}

export function isValidConfig(c: Partial<CreatureConfig> | null | undefined): c is CreatureConfig {
  if (!c) return false;
  if (typeof c.name !== 'string' || c.name.trim().length < 1 || c.name.length > 24) return false;
  if (typeof c.hue !== 'number' || c.hue < 0 || c.hue >= HUES.length) return false;
  return SLOTS.every((s) => { const p = PART_BY_ID[(c as Record<string, string>)[s]]; return !!p && p.slot === s; });
}

// Default creature names are plain lab designations ("Octopus Hybrid X-7" / "هجين أخطبوط X-7") so nobody
// mistakes them for a story character. Players can always type their own name.
const SHORT: Record<string, { en: string; ar: string }> = {
  fennec: { en: 'Fennec', ar: 'فنك' }, axolotl: { en: 'Axolotl', ar: 'أكسولوتل' }, gecko: { en: 'Gecko', ar: 'أبو بريص' }, owl: { en: 'Owl', ar: 'بومة' },
  camel: { en: 'Camel', ar: 'جمل' }, frog: { en: 'Frog', ar: 'ضفدع' }, pangolin: { en: 'Pangolin', ar: 'بنغول' }, octopus: { en: 'Octopus', ar: 'أخطبوط' },
};
const CODES = ['A', 'B', 'C', 'D', 'K', 'Q', 'R', 'V', 'X', 'Z'];

export function randomName(rng: Rng, lang: 'ar' | 'en', base = 'fennec'): string {
  const code = `${rng.pick(CODES)}-${1 + rng.int(99)}`;
  const s = SHORT[base] ?? SHORT.fennec;
  return lang === 'ar' ? `هجين ${s.ar} ${code}` : `${s.en} Hybrid ${code}`;
}

/** Keep an untouched lab designation in step with the base animal (a name the player typed is never changed). */
export function renameForBase(name: string, from: string, to: string): string {
  const a = SHORT[from], b = SHORT[to];
  if (!a || !b) return name;
  const ar = /^هجين (.+) ([A-Z]-\d+)$/.exec(name);
  if (ar && ar[1] === a.ar) return `هجين ${b.ar} ${ar[2]}`;
  const en = /^(.+) Hybrid ([A-Z]-\d+)$/.exec(name);
  if (en && en[1] === a.en) return `${b.en} Hybrid ${en[2]}`;
  return name;
}

export function randomCreature(rng: Rng, lang: 'ar' | 'en' = 'en'): CreatureConfig {
  const c: Record<string, unknown> = {};
  for (const slot of SLOTS) c[slot] = rng.pick(partsFor(slot)).id;
  c.hue = rng.int(HUES.length);
  c.name = randomName(rng, lang, c.base as string);
  return c as unknown as CreatureConfig;
}

/** Part that contributes most to a stat — used to narrate *how* the anatomy mattered. */
export function partForStat(d: DerivedCreature, stat: StatKey, caps?: Capability[]): Part | undefined {
  if (caps?.length) {
    for (const slot of SLOTS) if (d.parts[slot].caps?.some((c) => caps.includes(c))) return d.parts[slot];
  }
  let best: Part | undefined; let bestV = 0;
  for (const slot of SLOTS) { const v = d.parts[slot].stats[stat] ?? 0; if (v > bestV) { bestV = v; best = d.parts[slot]; } }
  return best;
}

/** Part that hurt a stat most — used to narrate failures honestly. */
export function weakestPartForStat(d: DerivedCreature, stat: StatKey): Part | undefined {
  let worst: Part | undefined; let worstV = 0;
  for (const slot of SLOTS) { const v = d.parts[slot].stats[stat] ?? 0; if (v < worstV) { worstV = v; worst = d.parts[slot]; } }
  return worst;
}

export function encodeCreature(c: CreatureConfig): string {
  const json = JSON.stringify([c.name, c.base, c.head, c.eyes, c.limbs, c.tail, c.adaptation, c.ability, c.hue]);
  const bytes = new TextEncoder().encode(json);
  let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCreature(s: string): CreatureConfig | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const arr = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    if (!Array.isArray(arr) || arr.length !== 9) return null;
    const [name, base, head, eyes, limbs, tail, adaptation, ability, hue] = arr;
    const c = { name, base, head, eyes, limbs, tail, adaptation, ability, hue } as CreatureConfig;
    return isValidConfig(c) ? c : null;
  } catch { return null; }
}
