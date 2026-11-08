// The live-AI validators (scripts/ai-eval): only real ids, depth order, planted clues paid off.
import { describe, expect, it } from 'vitest';
import type { AiBeat, AiEnding, Outline } from '../scripts/ai-eval/contract';
import { validateBeat, validateEnding, validateOutline } from '../scripts/ai-eval/validate';
import type { BiomeId } from '../src/engine/types';

const L = (s: string) => ({ en: s, ar: `نص ${s}` });
const outline = (biomes: BiomeId[], extra: Partial<Outline['acts'][number]> = {}): Outline => ({
  title: L('Title'), premise: L('A premise long enough'), premise_tag: 'p', tone: 'mysterious', twist_tag: 't', mysteries: [], ending_options: [],
  acts: biomes.map((biome, i) => ({ id: `a${i}`, biome, props: [], purpose: 'x', npc: null, plants_clue: i === 1 ? 'c1' : null, pays_off: i === 5 ? 'c1' : null, ...(i === 2 ? extra : {}) })),
});
const MARINE: BiomeId[] = ['lab', 'reef', 'seagrass', 'openSea', 'twilight', 'midnight', 'vents', 'trench'];

describe('AI outline validation', () => {
  it('accepts a clean surface-to-deep marine outline', () => {
    expect(validateOutline(outline(MARINE), 'marine').errors).toEqual([]);
  });
  it('rejects climbing back up between deep zones', () => {
    const e = validateOutline(outline(['lab', 'reef', 'seagrass', 'openSea', 'midnight', 'twilight', 'vents', 'trench']), 'marine').errors;
    expect(e.some((x) => x.includes('climbs'))).toBe(true);
  });
  it('rejects animals that are not bestiary ids, unknown plates and misplaced legends', () => {
    expect(validateOutline(outline(MARINE, { animals: ['kraken-9000'] }), 'marine').errors.join()).toContain('not a bestiary id');
    expect(validateOutline(outline(MARINE, { animals: ['sea-turtle'] }), 'marine').errors).toEqual([]);
    expect(validateOutline(outline(MARINE, { plate: 'no-such-plate' }), 'marine').errors.join()).toContain('not a real asset');
    expect(validateOutline(outline(MARINE, { legend: 'nope' }), 'marine').errors.join()).toContain('legend nope unknown');
  });
});

describe('AI beat and ending validation', () => {
  const beat = (featured: string | null): AiBeat => ({
    act_id: 'a1', text: L('Text here'), duck_line: L('Duck line'), fact_id: null, featured_animal: featured,
    choices: (['bold', 'careful', 'clever', 'kind'] as const).map((style, i) => ({ id: `c${i}`, label: L(`Option ${i}`), style, uses_capability: null, check: null, success: { text: L(`ok ${i}`), effects: [{ t: 'energy', d: 1 }], duck_mood: 'happy', creature_state: 'calm' }, fail: null })),
  });
  it('featured animals must be bestiary ids; invented facts are rejected', () => {
    expect(validateBeat(beat('anglerfish'), new Set(), new Set(), 'midnight').errors).toEqual([]);
    expect(validateBeat(beat('mega-shark'), new Set(), new Set(), 'midnight').errors.join()).toContain('not a bestiary id');
    expect(validateBeat({ ...beat(null), fact_id: 'made-up' }, new Set(), new Set()).errors.join()).toContain('invented');
  });
  it('cosmetic enums are normalised with a warning, not an error', () => {
    const b = beat(null); (b.choices[0].success as { duck_mood: string }).duck_mood = 'ecstatic';
    const r = validateBeat(b, new Set(), new Set());
    expect(r.errors).toEqual([]); expect(r.warnings.join()).toContain('mood ecstatic');
  });
  it('the ending must pay off at least one planted clue and invent none', () => {
    const e = (paid?: string[]): AiEnding => ({ title: L('End'), summary: L('Summary'), epilogue: L('Epilogue'), tone: 'heroic', pays_off_clues: paid });
    expect(validateEnding(e(['c1']), ['c1']).errors).toEqual([]);
    expect(validateEnding(e([]), ['c1']).errors.join()).toContain('pays off none');
    expect(validateEnding(e(['c1', 'c9']), ['c1']).errors.join()).toContain('never planted');
  });
});
