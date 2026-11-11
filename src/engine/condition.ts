// The player's creature condition for the status panel, derived from the journey so far
// (places visited, setbacks, energy, last outcome). Pure and deterministic; no extra save data.
import { PART_BY_ID } from '../content/parts';
import { derive } from './creature';
import type { BiomeId, GameState, L10n, Slot } from './types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export type Mark = 'mud' | 'frost' | 'dust' | 'wet' | 'glow' | 'soot' | 'scratches' | 'fatigue';
export type Feeling = 'curious' | 'calm' | 'confident' | 'afraid' | 'excited' | 'exhausted' | 'hurt' | 'proud';

export const MARK_LABEL: Record<Mark, L10n> = {
  mud: L('Mud-caked', 'مغطّى بالطين'), frost: L('Frosted', 'يكسوه الصقيع'), dust: L('Dusty', 'يعلوه الغبار'), wet: L('Soaked', 'مبتلّ'),
  glow: L('Glowing algae', 'طحالب مضيئة'), soot: L('Vent soot', 'سخام الينابيع الحارّة'), scratches: L('Scratched', 'مخدوش'), fatigue: L('Exhausted', 'مُنهَك'),
};
export const FEELING_LABEL: Record<Feeling, L10n> = {
  curious: L('Curious', 'فضولي'), calm: L('Calm', 'هادئ'), confident: L('Confident', 'واثق'), afraid: L('Afraid', 'خائف'),
  excited: L('Excited', 'متحمّس'), exhausted: L('Exhausted', 'متعب'), hurt: L('Hurt', 'مصاب'), proud: L('Proud', 'فخور'),
};
const REACTION: Record<Feeling, L10n[]> = {
  curious: [L('Ears up, nose working. Something here is worth knowing.', 'أذناه مرفوعتان وأنفه يتشمّم… هنا شيءٌ يستحق المعرفة.'), L('It keeps glancing at the same spot.', 'يلتفت مرةً بعد مرة إلى المكان نفسه.')],
  calm: [L('Steady breathing. Ready.', 'أنفاسٌ هادئة… إنه مستعد.')],
  confident: [L('Chest out. It knows it can do this.', 'صدره إلى الأمام… يعرف أنه قادر.'), L('Its trade-offs paid off this time.', 'هذه المرة أفادته صفاته.')],
  afraid: [L('Pressed low, every muscle ready to bolt.', 'يلتصق بالأرض، وكل عضلةٍ فيه مستعدةٌ للفرار.'), L('It won’t take its eyes off the dark.', 'لا يرفع عينيه عن الظلام.')],
  excited: [L('Can’t stay still. Discovery in the air.', 'لا يستطيع البقاء ساكناً… في الجو رائحة اكتشاف.')],
  exhausted: [L('Moving slower now. Needs rest soon.', 'صار أبطأ… يحتاج إلى الراحة قريباً.')],
  hurt: [L('Favouring one side, but still going.', 'يميل على جانبٍ واحد… لكنه ما زال يواصل.')],
  proud: [L('Head high. That one was all its own body.', 'رأسه مرفوع… هذا النجاح صنعه جسده هو.')],
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
