// Core data model for BSC BioLab. The engine owns all game state; text sources (static or AI) only decorate it.

export type Lang = 'ar' | 'en';
export interface L10n { en: string; ar: string }
export type Mode = 'classic' | 'marine';

export const STAT_KEYS = ['strength', 'agility', 'stealth', 'intellect', 'swim', 'cold', 'heat', 'charm'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Capability =
  | 'fly' | 'glide' | 'swim' | 'breatheWater' | 'climb' | 'dig' | 'jump' | 'grip'
  | 'nightVision' | 'echolocation' | 'heatSense' | 'scent' | 'motionSense'
  | 'venom' | 'glow' | 'camouflage' | 'armor' | 'spines' | 'shock' | 'ink'
  | 'regenerate' | 'mimic' | 'pressure' | 'insulated' | 'fatStore' | 'heatShed';

export const SLOTS = ['base', 'head', 'eyes', 'limbs', 'tail', 'adaptation', 'ability'] as const;
export type Slot = (typeof SLOTS)[number];

export interface Part {
  id: string;
  slot: Slot;
  name: L10n;
  desc: L10n;
  /** Short verb phrase used by the narrative, e.g. "flaps its leathery wings". Uses {name}. */
  action: L10n;
  stats: Partial<Stats>;
  caps?: Capability[];
  /** Human-readable cost of the trait. Every part must have one. */
  tradeoff: L10n;
  /** Real-biology inspiration shown in the builder (clearly labelled as real science). */
  realSource: L10n;
}

export interface CreatureConfig {
  name: string;
  base: string;
  head: string;
  eyes: string;
  limbs: string;
  tail: string;
  adaptation: string;
  ability: string;
  hue: number; // 0..7 palette index
}

export interface DerivedCreature {
  config: CreatureConfig;
  stats: Stats;
  caps: Set<Capability>;
  parts: Record<Slot, Part>;
}

export type BiomeId =
  | 'lab' | 'forest' | 'desert' | 'mountain' | 'cave' | 'snow' | 'swamp' | 'ruins'
  | 'reef' | 'mudflat' | 'seagrass' | 'openSea' | 'twilight' | 'midnight' | 'vents' | 'trench';

export type DuckMood = 'happy' | 'worried' | 'shocked' | 'thinking' | 'laughing' | 'proud';
export type Style = 'bold' | 'careful' | 'clever' | 'kind' | 'silly';

/** Condition evaluated against creature + state. All listed keys must hold. */
export interface Cond {
  capAny?: Capability[];
  capNone?: Capability[];
  statMin?: Partial<Stats>;
  statMax?: Partial<Stats>;
  flag?: string[];
  notFlag?: string[];
  evidenceMin?: number;
  mode?: Mode;
  /** Current biome is (not) underwater/wet. */
  wet?: boolean;
  biome?: BiomeId[];
}

export type Effect =
  | { t: 'flag'; id: string }
  | { t: 'evidence'; id: string }
  | { t: 'discovery'; id: string }
  | { t: 'rel'; npc: string; d: number }
  | { t: 'energy'; d: number }
  | { t: 'trust'; d: number };

export interface Outcome {
  text: L10n;
  effects: Effect[];
  mood: DuckMood;
  /** Visual event shown in the scene for this result. */
  fx?: string;
}

export interface ChoiceCheck { stat: StatKey; caps?: Capability[]; dc: number }

export interface Choice {
  id: string;
  label: L10n;
  style: Style;
  /** Choice only offered when the condition holds (anatomy-gated options). */
  requires?: Cond;
  check?: ChoiceCheck;
  success: Outcome;
  fail?: Outcome;
}

export interface BeatTemplate {
  id: string;
  mode: Mode | 'both';
  kind: 'hook' | 'explore' | 'challenge' | 'encounter' | 'twist' | 'climax' | 'legend' | 'phase';
  biomes: BiomeId[]; // biomes this template may run in ("*" handled by generator)
  phase?: 'surface' | 'deep';
  requires?: Cond;
  /** Visual props for scene art. */
  props: string[];
  text: L10n;
  /** Extra paragraph added when the condition holds — anatomy/state-aware narration. */
  variants?: { when: Cond; text: L10n }[];
  fact?: string; // real-science fact id shown after the beat
  choices: Choice[];
  npc?: string;
  weight?: number;
}

export interface PlannedBeat {
  template: string;
  biome: BiomeId;
  npc?: string;
  obstacle?: string;
}

export interface StoryPlan {
  mode: Mode;
  seed: number;
  hook: string;
  biomes: BiomeId[];
  beats: PlannedBeat[];
  twist?: string;
  legend: boolean;
}

export interface LogEntry {
  beat: string;
  biome: BiomeId;
  choice: string;
  style: Style;
  success: boolean;
  usedPart?: Slot;
  npc?: string;
}

export interface GameState {
  version: 1;
  mode: Mode;
  seed: number;
  duck: string;
  player: string;
  creature: CreatureConfig;
  plan: StoryPlan;
  index: number; // current beat index
  stage: 'beat' | 'outcome' | 'ending';
  energy: number;
  trust: number;
  flags: string[];
  evidence: string[];
  discoveries: string[];
  rel: Record<string, number>;
  log: LogEntry[];
  /** Template ids used in recent runs; runtime picks avoid them (anti-repetition). */
  avoid?: string[];
  lastOutcome?: { text: L10n; mood: DuckMood; fx?: string; success: boolean; partLine?: L10n };
}

export interface Ending {
  id: string; // archetype id
  tone: 'heroic' | 'comedic' | 'bittersweet' | 'mysterious' | 'scientific' | 'wholesome';
  title: L10n;
  summary: L10n;
  epilogue: L10n;
  highlights: L10n[];
}
