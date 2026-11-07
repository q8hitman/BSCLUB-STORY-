// The contract between the deterministic engine and a live text AI.
// The AI invents structure, plot, dialogue and choices — but only out of the asset catalog,
// and only proposes effects; the engine validates and applies them.
import { PAINT_PROPS, INTEGRATED } from '../../src/art/painter';
import { DUCKS } from '../../src/content/ducks';
import { PARTS } from '../../src/content/parts';
import { BIOMES, FACTS, NPCS } from '../../src/content/world';
import { derive } from '../../src/engine/creature';
import type { BiomeId, CreatureConfig, Mode } from '../../src/engine/types';

export const CLASSIC_BIOMES: BiomeId[] = ['lab', 'forest', 'desert', 'mountain', 'cave', 'snow', 'swamp', 'ruins'];
export const MARINE_SURFACE: BiomeId[] = ['lab', 'reef', 'mudflat', 'seagrass', 'openSea'];
export const MARINE_DEEP: BiomeId[] = ['twilight', 'midnight', 'vents', 'trench'];
export const TONES = ['mysterious', 'suspenseful', 'eerie', 'adventurous', 'scientific', 'emotional', 'comedic', 'absurd', 'heroic', 'surprising'] as const;
export const STYLES = ['bold', 'careful', 'clever', 'kind', 'silly'] as const;
export const MOODS = ['happy', 'worried', 'shocked', 'thinking', 'laughing', 'proud'] as const;
export const CREATURE_STATES = ['calm', 'curious', 'afraid', 'confident', 'exhausted', 'excited', 'hurt', 'proud'] as const;
export const MARKS = ['mud', 'snow', 'glowing-algae', 'scratches', 'soot', 'sand', 'wet', 'pollen', 'ink', 'frost', 'bandage', 'charm'] as const;
export const EFFECT_TYPES = ['flag', 'evidence', 'discovery', 'rel', 'energy', 'trust', 'mark'] as const;
export const STATS = ['strength', 'agility', 'stealth', 'intellect', 'swim', 'cold', 'heat', 'charm'] as const;

/** Compact catalog sent to the model (ids + short English descriptions keep tokens low). */
export function catalog(mode: Mode) {
  const biomes = mode === 'classic' ? CLASSIC_BIOMES : [...MARINE_SURFACE, ...MARINE_DEEP];
  const props = Object.keys(PAINT_PROPS).filter((p) => !INTEGRATED.has(p));
  return {
    biomes: biomes.map((b) => ({ id: b, name: BIOMES[b].name.en, animals: [...BIOMES[b].predators, ...BIOMES[b].critters].map((x) => x.en) })),
    sceneProps: props,
    npcs: NPCS.map((n) => ({ id: n.id, name: n.name.en, role: n.role.en })),
    facts: FACTS.map((f) => ({ id: f.id, text: f.text.en })),
    ducks: DUCKS.map((d) => ({ id: d.id, name: d.name.en, role: d.role.en })),
    tones: TONES, styles: STYLES, moods: MOODS, creatureStates: CREATURE_STATES, marks: MARKS, stats: STATS,
    ...(mode === 'marine' ? { phases: { surface: MARINE_SURFACE, deep: MARINE_DEEP } } : {}),
  };
}

export function creatureBrief(c: CreatureConfig) {
  const d = derive(c);
  return {
    name: '{CREATURE}', // real names never leave the device
    parts: Object.fromEntries(Object.entries(d.parts).map(([slot, p]) => [slot, `${p.name.en} (${p.desc.en}; cost: ${p.tradeoff.en})`])),
    stats: d.stats, capabilities: [...d.caps],
  };
}

export interface L { en: string; ar: string }
export interface Outline {
  title: L; premise: L; premise_tag: string; tone: (typeof TONES)[number]; twist_tag: string;
  acts: { id: string; biome: BiomeId; props: string[]; purpose: string; npc?: string | null; plants_clue?: string | null; pays_off?: string | null }[];
  mysteries: string[]; ending_options: string[];
}
export interface AiEffect { t: (typeof EFFECT_TYPES)[number]; id?: string; npc?: string; d?: number }
export interface AiOutcome { text: L; effects: AiEffect[]; duck_mood: (typeof MOODS)[number]; creature_state: (typeof CREATURE_STATES)[number] }
export interface AiChoice { id: string; label: L; style: (typeof STYLES)[number]; uses_capability: string | null; check: { stat: (typeof STATS)[number]; dc: number } | null; success: AiOutcome; fail: AiOutcome | null }
export interface AiBeat { act_id: string; text: L; duck_line: L; choices: AiChoice[]; fact_id: string | null }
export interface AiEnding { title: L; summary: L; epilogue: L; tone: (typeof TONES)[number] }
