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

const NAME_A = { en: ['Mega', 'Dr.', 'Captain', 'Lil', 'Professor', 'Sir', 'Turbo', 'Mystic', 'Sergeant', 'Baby'],
  ar: ['ميقا', 'دكتور', 'كابتن', 'الصغير', 'بروفيسور', 'السيد', 'توربو', 'الغامض', 'الشاويش', 'بيبي'] };
const NAME_B = { en: ['Fluff', 'Zap', 'Gloop', 'Snoot', 'Scales', 'Wobble', 'Sprocket', 'Noodle', 'Biscuit', 'Quark', 'Mudbug', 'Dune'],
  ar: ['نفوش', 'زاب', 'قلوب', 'خشوم', 'حراشف', 'دحروج', 'برغي', 'نودلز', 'بسكوت', 'كوارك', 'طينو', 'كثيب'] };

export function randomName(rng: Rng, lang: 'ar' | 'en'): string {
  const i = rng.int(NAME_A.en.length), j = rng.int(NAME_B.en.length);
  return `${NAME_A[lang][i]} ${NAME_B[lang][j]}`;
}

export function randomCreature(rng: Rng, lang: 'ar' | 'en' = 'en'): CreatureConfig {
  const c: Record<string, unknown> = {};
  for (const slot of SLOTS) c[slot] = rng.pick(partsFor(slot)).id;
  c.hue = rng.int(HUES.length);
  c.name = randomName(rng, lang);
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
