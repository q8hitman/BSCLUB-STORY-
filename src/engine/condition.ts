// The player's creature condition for the status panel, derived from the journey so far
// (places visited, setbacks, energy, last outcome). Pure and deterministic; no extra save data.
import { PART_BY_ID } from '../content/parts';
import { derive } from './creature';
import type { BiomeId, GameState, L10n, Slot } from './types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export type Mark = 'mud' | 'frost' | 'dust' | 'wet' | 'glow' | 'soot' | 'scratches' | 'fatigue';
export type Feeling = 'curious' | 'calm' | 'confident' | 'afraid' | 'excited' | 'exhausted' | 'hurt' | 'proud';

export const MARK_LABEL: Record<Mark, L10n> = {
  mud: L('Mud-caked', 'مغطّى بالطين'), frost: L('Frosted', 'عليه صقيع'), dust: L('Dusty', 'مغبّر'), wet: L('Soaked', 'مبلول'),
  glow: L('Glowing algae', 'طحالب مضيئة'), soot: L('Vent soot', 'سخام الفتحات'), scratches: L('Scratched', 'مخدوش'), fatigue: L('Exhausted', 'منهك'),
};
export const FEELING_LABEL: Record<Feeling, L10n> = {
  curious: L('Curious', 'فضولي'), calm: L('Calm', 'هادي'), confident: L('Confident', 'واثق'), afraid: L('Afraid', 'خايف'),
  excited: L('Excited', 'متحمّس'), exhausted: L('Exhausted', 'تعبان'), hurt: L('Hurt', 'متأذّي'), proud: L('Proud', 'فخور'),
};
const REACTION: Record<Feeling, L10n[]> = {
  curious: [L('Ears up, nose working. Something here is worth knowing.', 'الأذن فوق والخشم شغّال… فيه شي يستاهل يعرفه.'), L('It keeps glancing at the same spot.', 'كل شوي يلتفت لنفس المكان.')],
  calm: [L('Steady breathing. Ready.', 'نفَس هادي… جاهز.')],
  confident: [L('Chest out. It knows it can do this.', 'صدره قدّام… يعرف إنه يقدر.'), L('Its trade-offs paid off this time.', 'هالمرة صفاته خدمته.')],
  afraid: [L('Pressed low, every muscle ready to bolt.', 'منخفض بجسمه وكل عضلة جاهزة تهرب.'), L('It won’t take its eyes off the dark.', 'ما يشيل عينه عن الظلام.')],
  excited: [L('Can’t stay still. Discovery in the air.', 'ما يقدر يوقف مكانه… ريحة اكتشاف.')],
  exhausted: [L('Moving slower now. Needs rest soon.', 'صار أبطأ… يحتاج راحة قريب.')],
  hurt: [L('Favouring one side, but still going.', 'يميل على جنب… بس للحين يكمّل.')],
  proud: [L('Head high. That one was all its own body.', 'راسه فوق… هذي كانت بجسمه هو.')],
};
const BIOME_MARK: Partial<Record<BiomeId, Mark>> = {
  swamp: 'mud', mudflat: 'mud', snow: 'frost', mountain: 'frost', desert: 'dust', cave: 'dust', ruins: 'dust',
  reef: 'wet', seagrass: 'wet', openSea: 'wet', twilight: 'glow', midnight: 'glow', trench: 'glow', vents: 'soot',
};

export interface Condition { feeling: Feeling; marks: Mark[]; energy: number; reaction: L10n; highlight: Slot | null; traits: { slot: Slot; name: L10n }[] }

export function condition(s: GameState): Condition {
  const upto = s.stage === 'beat' ? s.index : s.index + 1;
  const visited = s.plan.beats.slice(1, upto + (s.stage === 'beat' ? 1 : 0)).map((b) => b.biome);
  const marks: Mark[] = [];
  // the last three places leave visible traces; older ones wash off
  for (const b of visited.slice(-3)) { const m = BIOME_MARK[b]; if (m && !marks.includes(m)) marks.push(m); }
  const fails = s.log.filter((l) => !l.success).length;
  if (fails >= 2) marks.push('scratches');
  if (s.energy <= 1) marks.push('fatigue');
  const o = s.stage === 'outcome' ? s.lastOutcome : undefined;
  let feeling: Feeling = 'curious';
  if (s.energy <= 1) feeling = 'exhausted';
  else if (o && !o.success) feeling = o.mood === 'shocked' ? 'afraid' : fails >= 3 ? 'hurt' : 'afraid';
  else if (o?.success) feeling = o.mood === 'proud' ? 'proud' : o.mood === 'shocked' ? 'excited' : 'confident';
  else if (s.index === 0) feeling = 'calm';
  const pool = REACTION[feeling];
  const reaction = pool[(s.index + s.seed) % pool.length];
  const d = derive(s.creature);
  const traits = (['limbs', 'adaptation', 'ability', 'tail'] as Slot[]).map((slot) => ({ slot, name: d.parts[slot].name }));
  const last = s.stage === 'outcome' ? s.log[s.log.length - 1] : undefined;
  return { feeling, marks, energy: s.energy, reaction, highlight: (last?.usedPart as Slot | undefined) ?? null, traits };
}

export const partName = (id: string) => PART_BY_ID[id]?.name;
