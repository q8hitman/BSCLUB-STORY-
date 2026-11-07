// localStorage persistence: settings, the in-progress run, and history of past runs (narrative fingerprints).
import { isValidConfig } from './creature';
import { BEAT_BY_ID, pathTokens, planTokens, validateState, type RunMemory } from './story';
import type { CreatureConfig, Ending, GameState, Lang } from './types';

const KEY = 'bsc-biolab:v1';
const MAX_RUNS = 40;

export interface Settings { lang: Lang; textSpeed: number; muted: boolean; reducedMotion: boolean; ai: boolean }
export interface RunRecord extends RunMemory { at: number; title: Ending['title']; creature: CreatureConfig; player: string; duck: string }
export interface SaveData { settings: Settings; current: GameState | null; runs: RunRecord[]; endingsSeen: string[] }

export function defaultSettings(): Settings {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { lang: 'ar', textSpeed: 60, muted: true, reducedMotion: reduced, ai: false };
}

function empty(): SaveData { return { settings: defaultSettings(), current: null, runs: [], endingsSeen: [] }; }

/** Defensive load: anything malformed is dropped instead of crashing the game. */
export function load(storage: Storage | undefined = globalThis.localStorage): SaveData {
  const base = empty();
  if (!storage) return base;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return base;
    const d = JSON.parse(raw) as Partial<SaveData>;
    const s = d.settings ?? base.settings;
    const settings: Settings = {
      lang: s.lang === 'en' ? 'en' : 'ar',
      textSpeed: typeof s.textSpeed === 'number' ? Math.max(0, Math.min(100, s.textSpeed)) : 60,
      muted: !!s.muted, reducedMotion: !!s.reducedMotion, ai: !!s.ai,
    };
    let current: GameState | null = null;
    if (d.current && isValidConfig(d.current.creature) && d.current.plan?.beats?.every((b) => b.template.startsWith('@') || BEAT_BY_ID[b.template])) {
      try { if (validateState(d.current).length === 0) current = d.current; } catch { current = null; }
    }
    const runs = Array.isArray(d.runs) ? d.runs.filter((r) => r && Array.isArray(r.planTokens) && Array.isArray(r.pathTokens) && typeof r.ending === 'string').slice(-MAX_RUNS) : [];
    const endingsSeen = Array.isArray(d.endingsSeen) ? d.endingsSeen.filter((x) => typeof x === 'string') : [];
    return { settings, current, runs, endingsSeen };
  } catch {
    return base;
  }
}

export function save(data: SaveData, storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) return;
  try { storage.setItem(KEY, JSON.stringify(data)); } catch { /* quota or private mode: game still works in memory */ }
}

export function recordRun(data: SaveData, s: GameState, ending: Ending): SaveData {
  const rec: RunRecord = {
    mode: s.mode, planTokens: planTokens(s.plan), pathTokens: pathTokens(s), ending: ending.id,
    templates: s.plan.beats.map((b) => b.template), at: Date.now(), title: ending.title, creature: s.creature, player: s.player, duck: s.duck,
  };
  return {
    ...data, current: null,
    runs: [...data.runs, rec].slice(-MAX_RUNS),
    endingsSeen: data.endingsSeen.includes(ending.id) ? data.endingsSeen : [...data.endingsSeen, ending.id],
  };
}
