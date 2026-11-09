// Mystery Board + Adventure Memories: the run's clues and key moments, rebuilt from the log (pure, any device).
import { BIOMES } from '../content/world';
import { BEAT_BY_ID, beatContext, fill } from './story';
import type { BiomeId, GameState, L10n } from './types';

const L = (en: string, ar: string): L10n => ({ en, ar });
export type ClueKind = 'footage' | 'sample' | 'notes' | 'map' | 'data' | 'sound' | 'tracks' | 'object' | 'witness';
export const CLUE_KIND: Record<ClueKind, { icon: string; label: L10n }> = {
  footage: { icon: '📷', label: L('Footage', 'تسجيل مصوّر') },
  sample: { icon: '🧪', label: L('Sample', 'عيّنة') },
  notes: { icon: '📓', label: L('Notes', 'ملاحظات') },
  map: { icon: '🗺️', label: L('Map', 'خريطة') },
  data: { icon: '📊', label: L('Data', 'بيانات') },
  sound: { icon: '🔊', label: L('Sound', 'تسجيل صوتي') },
  tracks: { icon: '🐾', label: L('Tracks', 'آثار') },
  object: { icon: '🗝️', label: L('Object', 'قطعة غامضة') },
  witness: { icon: '💬', label: L('Witness', 'شهادة') },
};
const RULES: [RegExp, ClueKind][] = [
  [/footage|photo|still|video|cam|mural|sketch|drawing/, 'footage'],
  [/sample|vial|core|scale|bone|reading|temp|tolerance|dna|fungus|worm|water|snow|mud|soil|peat/, 'sample'],
  [/sound|song|echo|sonar|signal|soundscape|call|channel|recording/, 'sound'],
  [/track|trail|marks|three-toe|tagged/, 'tracks'],
  [/map|coordinates|survey|passage/, 'map'],
  [/data|log|census|count|report|files|inventory|patterns|chip|label|light/, 'data'],
  [/notes|note|method|plan|dialogue/, 'notes'],
  [/account|intel|confession|story|reply|eyewitness|fisher|kid|hermit/, 'witness'],
];
export const clueKind = (id: string): ClueKind => RULES.find(([re]) => re.test(id))?.[1] ?? 'object';

export interface Moment { index: number; biome: BiomeId; place: L10n; kind: string; choice: L10n; success: boolean; clues: string[]; template: string }

/** Every decided scene: where, what the team chose, whether it worked, and which clues it produced. */
export function moments(s: GameState): Moment[] {
  return s.log.map((l, i) => {
    const t = BEAT_BY_ID[l.beat]; const c = t?.choices.find((x) => x.id === l.choice);
    const out = c ? (l.success || !c.fail ? c.success : c.fail) : null;
    return {
      index: i, biome: l.biome, place: BIOMES[l.biome].name, kind: t?.kind ?? 'explore', template: l.beat,
      choice: c ? fill(c.label, beatContext(s, i)) : L('—', '—'), success: l.success,
      clues: out ? out.effects.filter((e) => e.t === 'evidence').map((e) => (e as { id: string }).id).filter((id) => s.evidence.includes(id)) : [],
    };
  });
}

/** The most memorable moments for the recap: hook, twist, climax, first clue, a setback overcome, the rest by order. */
export function highlights(s: GameState, max = 6): Moment[] {
  const all = moments(s); if (all.length <= max) return all;
  const pick = new Set<number>([0, all.length - 1]);
  for (const m of all) if (m.kind === 'twist' || m.kind === 'legend' || m.kind === 'climax') pick.add(m.index);
  const firstClue = all.find((m) => m.clues.length); if (firstClue) pick.add(firstClue.index);
  const setback = all.find((m) => !m.success); if (setback) pick.add(setback.index);
  for (const m of all) { if (pick.size >= max) break; pick.add(m.index); }
  return [...pick].sort((a, b) => a - b).slice(0, max).map((i) => all[i]);
}
