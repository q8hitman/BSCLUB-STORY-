// Painted event plates (generated offline on the designer's PC with SDXL, curated, shipped as WebP).
// The resolver picks the best plate for a beat by biome + event type, never repeating within a run.
// Beats with no suitable plate fall back to the procedural painter.
import PLATES from '../content/plates.json';
import { Rng } from '../engine/rng';
import type { BeatTemplate, BiomeId, GameState } from '../engine/types';

/** Set by the story engine at load (avoids an import cycle): template id → its fixed plate, if any. */
export const BEAT_BY_ID_REF: { get?: (template: string) => string | undefined } = {};

export interface Plate { id: string; biome: string; event: string; tone: string; mystery: number; style: string }
export const PLATE_LIST = PLATES as Plate[];

/** Event types that suit each beat kind, best first. Bestiary specimen plates are reserved for close-ups. */
const KIND_EVENTS: Record<BeatTemplate['kind'], string[]> = {
  hook: ['hook', 'signal', 'discovery'],
  explore: ['discovery', 'signal', 'encounter', 'evidence'],
  challenge: ['challenge', 'suspense', 'encounter'],
  encounter: ['encounter', 'comic', 'discovery'],
  twist: ['evidence', 'discovery', 'suspense', 'signal'],
  climax: ['finale', 'suspense', 'challenge'],
  legend: ['legend', 'signal'],
  phase: ['phase'],
};

/** Some templates need a more specific event than their kind (e.g. a crossing is not a comedy). */
const TEMPLATE_EVENTS: Record<string, string[]> = {
  cross: ['challenge'], hide: ['suspense', 'encounter'], rescue: ['challenge', 'encounter'], clue: ['evidence', 'discovery'],
  heat: ['suspense', 'challenge'], cold: ['challenge', 'suspense'], dark: ['suspense'], bog: ['challenge', 'suspense'], pressure: ['suspense'],
  'camp-land': ['camp', 'discovery'], 'camp-boat': ['camp', 'discovery'], 'camp-sub': ['camp', 'discovery'],
};

/**
 * Scenes whose text is about one specific thing show a plate of that thing (per place where it matters), instead of
 * any plate of the same place: the giant's scene shows the giant, the dugong scene shows the dugong.
 */
const TEMPLATE_PLATES: Record<string, Partial<Record<BiomeId | 'any', string>>> = {
  'km-leviathan': { any: 'legend-bu-sahn' }, 'tm-squid': { any: 'twilight-squid-eye' }, 'tm-whalefall': { any: 'trench-whalefall' }, 'tm-probe': { any: 'trench-deep-ping' },
  'km-eruption': { any: 'vents-eruption' }, 'lm-tale': { any: 'mudflat-old-sailor' }, 'pm-descend': { any: 'opensea-research-ship' },
  'em-seagrass': { any: 'seagrass-dugong' }, 'em-mudflat': { any: 'mudflat-mudskipper-duel' }, 'em-reef': { any: 'reef-bleach-shadow' },
  'em-twilight': { any: 'twilight-lanternfish' }, 'em-midnight': { any: 'midnight-angler' }, 'em-vents': { any: 'vents-chimneys' },
  'e-forest': { any: 'forest-fungus-ring' }, 'e-desert': { any: 'desert-mirage-oasis' }, 'e-mountain': { any: 'mountain-ibex-comic' }, 'e-cave': { any: 'cave-blind-fish' },
  'e-snow': { any: 'snow-frozen-frog' }, 'e-swamp': { any: 'swamp-wisps' }, 'e-ruins': { any: 'ruins-specimen-drawers' }, 'n-hermit': { any: 'forest-hermit-hives' },
  'k-machine': { any: 'ruins-machine-ring' }, 'k-vex': { forest: 'forest-rival-cage', desert: 'desert-rival-jeep' },
  'k-collapse': { forest: 'forest-collapse', desert: 'desert-collapse', mountain: 'mountain-collapse', cave: 'cave-collapse', snow: 'snow-avalanche', swamp: 'swamp-flood' },
};

export function plateUrl(id: string) { return `${import.meta.env?.BASE_URL ?? '/'}scenes/${id}.webp`; }

/** Deterministic plate choice for beat `idx`; avoids plates already shown earlier in the run. */
/** The plate a template asks for in this place, if any. */
export const ownPlateOf = (template: string | undefined, biome: BiomeId): string | undefined => (template ? (TEMPLATE_PLATES[template]?.[biome] ?? TEMPLATE_PLATES[template]?.any) : undefined);

export function plateFor(s: GameState, idx: number, kind: BeatTemplate['kind'], biome: BiomeId, used: Set<string>, template?: string, shown: Set<string> = used): Plate | null {
  const own = ownPlateOf(template, biome);
  const ownPlate = own && !shown.has(own) ? PLATE_LIST.find((p) => p.id === own) : undefined;
  if (ownPlate) return ownPlate;
  const wanted = (template && TEMPLATE_EVENTS[template]) || KIND_EVENTS[kind] || [];
  // Only plates whose event actually fits; otherwise the procedural painter draws the scene (no unrelated pictures).
  const pool = PLATE_LIST.filter((p) => p.biome === biome && wanted.includes(p.event) && !used.has(p.id));
  if (!pool.length) return null;
  const r = Rng.from(s.seed, `plate${idx}`);
  return r.weighted(pool, (p) => {
    const rank = wanted.indexOf(p.event);
    return 4 - rank + (p.mystery >= 2 ? 0.4 : 0);
  });
}

/** Plates for every beat up to and including `upto`, so repeats are avoided across the whole run. */
export function platesForRun(s: GameState, kinds: (i: number) => BeatTemplate['kind'] | null, upto: number, fixedPlates: ((i: number) => string | undefined) | null = (i) => BEAT_BY_ID_REF.get?.(s.plan.beats[i].template)): (Plate | null)[] {
  // template ids let specific beats ask for specific events
  // `shown` = plates already on screen in this run; `used` also holds plates reserved by later scenes that ask for one by name
  const shown = new Set<string>(); const used = new Set<string>(); const out: (Plate | null)[] = [];
  for (const b of s.plan.beats) { const o = ownPlateOf(b.template, b.biome); if (o) used.add(o); }
  for (let i = 0; i <= upto && i < s.plan.beats.length; i++) {
    const k = kinds(i);
    // Story Archive nodes name their own plate (Play swaps in the Living World variant for the current scene)
    const own = ownPlateOf(s.plan.beats[i].template, s.plan.beats[i].biome) ?? fixedPlates?.(i);
    const ownPlate = own ? PLATE_LIST.find((x) => x.id === own) ?? null : null;
    if (ownPlate) { used.add(ownPlate.id); shown.add(ownPlate.id); out.push(ownPlate); continue; }
    const p = k ? plateFor(s, i, k, s.plan.beats[i].biome, used, s.plan.beats[i].template, shown) : null;
    if (p) { used.add(p.id); shown.add(p.id); }
    out.push(p);
  }
  return out;
}
