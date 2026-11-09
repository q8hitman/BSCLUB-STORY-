// BSC Explorer Journal: what THIS device's explorer has actually met, finished and noticed.
// Built only from completed (or in-progress) runs through pure engine functions, so a run restored from a
// Passport QR feeds the journal of the new device exactly as it would have on the booth.
import { ANIMAL_BY_ID } from '../content/bestiary';
import { NOTE_BY_ID } from '../content/duckRadio';
import { LEGENDS } from '../content/legends';
import { BIOMES } from '../content/world';
import { encodeCreature } from './creature';
import { fieldNotes } from './radio';
import { rareFor } from './sighting';
import { RARE_BY_ID } from '../content/rare';
import { BEAT_BY_ID, beatContext, featuredAnimal } from './story';
import type { BiomeId, CreatureConfig, Ending, GameState, L10n, Mode } from './types';

const L = (en: string, ar: string): L10n => ({ en, ar });

/** Short adventure names for each mission (the hook of the run). */
export const ADVENTURE_TITLE: Record<string, L10n> = {
  'h-signal': L('The Midnight Signal', 'إشارة منتصف الليل'),
  'h-prof': L('The Missing Scientist', 'العالِمة المفقودة'),
  'h-escape': L('The Great Lab Escape', 'هروب عيّنات المختبر'),
  'h-contest': L('The Bio Fair Race', 'سباق المعرض الحيوي'),
  'hm-reef': L('The Bleaching Reef', 'الشعاب التي تبيضّ'),
  'hm-sound': L('The Sound from the Deep', 'الصوت القادم من الأعماق'),
  'hm-nets': L('The Cold Scales', 'الحراشف الباردة'),
};
export const adventureTitle = (s: Pick<GameState, 'plan'>): L10n => ADVENTURE_TITLE[s.plan.beats[0]?.template] ?? L('An Expedition', 'رحلة استكشافية');

export interface AnimalEntry { id: string; first: number; adventure: L10n; biome: BiomeId; times: number }
export interface EndingEntry {
  at: number; mode: Mode; adventure: L10n; creature: CreatureConfig; duck: string; player: string;
  endingId: string; tone: Ending['tone']; title: L10n; summary: L10n; plate: string | null; discoveries: string[]; animals: string[]; key: string;
}
export interface Journal {
  animals: Record<string, AnimalEntry>;
  legends: Record<string, { first: number; adventure: L10n }>;
  rare: Record<string, { first: number; adventure: L10n }>;
  notes: Record<string, { first: number; adventure: L10n }>;
  endings: EndingEntry[];
  biomes: BiomeId[];
  achievements: Record<string, number>;
}
export const MAX_ENDINGS = 60;
export const emptyJournal = (): Journal => ({ animals: {}, legends: {}, rare: {}, notes: {}, endings: [], biomes: [], achievements: {} });

/** Animals the run's text actually named, by beat index (in-scene specimen cards). */
export function animalsMet(s: GameState): { index: number; id: string; biome: BiomeId }[] {
  const out: { index: number; id: string; biome: BiomeId }[] = []; const seen = new Set<string>();
  s.log.forEach((l, i) => {
    const t = BEAT_BY_ID[l.beat]; if (!t) return;
    const id = featuredAnimal(t, beatContext(s, i));
    if (id && ANIMAL_BY_ID[id] && !seen.has(id)) { seen.add(id); out.push({ index: i, id, biome: l.biome }); }
  });
  return out;
}

/** Stable id of a run (so the same restored run is never recorded twice). */
export const runKey = (s: GameState) => `${s.seed}:${encodeCreature(s.creature)}:${s.log.map((l) => l.choice).join(',')}`;

export interface Achievement { id: string; title: L10n; desc: L10n; test: (j: Journal) => boolean }
const distinctCreatures = (j: Journal) => new Set(j.endings.map((e) => encodeCreature({ ...e.creature, name: '' }))).size;
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-run', title: L('First Expedition', 'الرحلة الأولى'), desc: L('Finish your first adventure.', 'أكمل مغامرتك الأولى.'), test: (j) => j.endings.length >= 1 },
  { id: 'both-modes', title: L('Land and Sea', 'البرّ والبحر'), desc: L('Finish an adventure in both Classic and Marine Science Club modes.', 'أكمل مغامرة في الوضع الكلاسيكي ومغامرة في وضع نادي علوم البحار.'), test: (j) => new Set(j.endings.map((e) => e.mode)).size === 2 },
  { id: 'places-6', title: L('Wanderer', 'الرحّالة'), desc: L('Explore 6 different environments.', 'استكشف ٦ بيئات مختلفة.'), test: (j) => j.biomes.filter((b) => b !== 'lab').length >= 6 },
  { id: 'places-12', title: L('Cartographer', 'راسم الخرائط'), desc: L('Explore 12 different environments.', 'استكشف ١٢ بيئة مختلفة.'), test: (j) => j.biomes.filter((b) => b !== 'lab').length >= 12 },
  { id: 'hadal', title: L('Into the Hadal Zone', 'إلى المنطقة السحيقة'), desc: L('Reach the deep-sea trench.', 'اِبلغ الخندق البحري العميق.'), test: (j) => j.biomes.includes('trench') },
  { id: 'animals-10', title: L('Naturalist', 'عالِم الطبيعة'), desc: L('Meet 10 different animals.', 'التقِ ١٠ حيوانات مختلفة.'), test: (j) => Object.keys(j.animals).length >= 10 },
  { id: 'animals-25', title: L('Living Encyclopedia', 'موسوعة حيّة'), desc: L('Meet 25 different animals.', 'التقِ ٢٥ حيواناً مختلفاً.'), test: (j) => Object.keys(j.animals).length >= 25 },
  { id: 'rare', title: L('Hidden Encounter', 'لقاء نادر'), desc: L('Meet a rare creature that only shows itself to the right senses.', 'التقِ كائناً نادراً لا يظهر إلا لمن يملك الحواسّ المناسبة.'), test: (j) => Object.keys(j.rare).length >= 1 },
  { id: 'rare-5', title: L('Cryptozoologist', 'باحث الكائنات الخفية'), desc: L('Meet 5 different rare creatures.', 'التقِ ٥ كائنات نادرة مختلفة.'), test: (j) => Object.keys(j.rare).length >= 5 },
  { id: 'legend', title: L('Was That Real?', 'هل كان ذلك حقيقياً؟'), desc: L('Glimpse a creature from a legend.', 'المح كائناً من الأساطير.'), test: (j) => Object.keys(j.legends).length >= 1 },
  { id: 'hybrids-3', title: L('Creature Designer', 'مصمّم الكائنات'), desc: L('Finish adventures with 3 different hybrid designs.', 'أكمل مغامرات بثلاثة تصاميم هجينة مختلفة.'), test: (j) => distinctCreatures(j) >= 3 },
  { id: 'missions-4', title: L('Case Files', 'ملفات القضايا'), desc: L('Play 4 different missions.', 'العب ٤ مهمات مختلفة.'), test: (j) => new Set(j.endings.map((e) => e.adventure.en)).size >= 4 },
  { id: 'notes-3', title: L('Listening to the Team', 'الإصغاء إلى الفريق'), desc: L('Collect field notes from 3 different companions.', 'اجمع ملاحظات ميدانية من ثلاثة رفقاء مختلفين.'), test: (j) => new Set(Object.keys(j.notes).map((id) => NOTE_BY_ID[id]?.duck)).size >= 3 },
  { id: 'secret', title: L('Hidden Truth', 'الحقيقة المخفية'), desc: L('Uncover a story secret: a twist that changes everything.', 'اكتشف سرّاً في القصة: منعطفاً يغيّر كل شيء.'), test: (j) => j.endings.some((e) => e.key.includes('#twist')) },
];

/** Adds a run's discoveries to the journal. Endings are recorded once per run (restoring the same QR twice is harmless). */
export function recordToJournal(j: Journal, s: GameState, ending: Ending | null, plate: string | null, now = Date.now()): { journal: Journal; unlocked: string[] } {
  const adventure = adventureTitle(s);
  const n: Journal = { animals: { ...j.animals }, legends: { ...j.legends }, rare: { ...j.rare }, notes: { ...j.notes }, endings: [...j.endings], biomes: [...j.biomes], achievements: { ...j.achievements } };
  const met = animalsMet(s);
  for (const a of met) { const prev = n.animals[a.id]; n.animals[a.id] = prev ? { ...prev, times: prev.times + (ending ? 1 : 0) } : { id: a.id, first: now, adventure, biome: a.biome, times: 1 }; }
  for (const note of Object.values(fieldNotes(s))) if (!n.notes[note.id]) n.notes[note.id] = { first: now, adventure };
  const pin = s.pins?.sighting;
  if (pin && s.log.length > pin[0] && LEGENDS.some((l) => l.id === pin[1]) && !n.legends[pin[1]]) n.legends[pin[1]] = { first: now, adventure };
  if (s.flags.includes('saw-leviathan') && !n.legends['bu-sahn']) n.legends['bu-sahn'] = { first: now, adventure };
  const rare = rareFor(s);
  if (rare && !n.rare[rare.rare.id]) n.rare[rare.rare.id] = { first: now, adventure };
  for (const l of s.log) if (!n.biomes.includes(l.biome)) n.biomes.push(l.biome);
  if (ending) {
    const twist = s.log.some((l) => BEAT_BY_ID[l.beat]?.kind === 'twist') ? '#twist' : '';
    const key = runKey(s) + twist;
    if (!n.endings.some((e) => e.key === key)) {
      n.endings.push({ at: now, mode: s.mode, adventure, creature: s.creature, duck: s.duck, player: s.player, endingId: ending.id, tone: ending.tone,
        title: ending.title, summary: ending.summary, plate, discoveries: s.discoveries.slice(), animals: met.map((a) => a.id), key });
      n.endings = n.endings.slice(-MAX_ENDINGS);
    }
  }
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) if (!n.achievements[a.id] && a.test(n)) { n.achievements[a.id] = now; unlocked.push(a.id); }
  return { journal: n, unlocked };
}

/** Defensive load of a stored journal (anything malformed is dropped). */
export function sanitizeJournal(x: unknown): Journal {
  const j = emptyJournal(); const o = x as Partial<Journal> | null;
  if (!o || typeof o !== 'object') return j;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, never> : {});
  j.animals = Object.fromEntries(Object.entries(obj(o.animals)).filter(([id]) => ANIMAL_BY_ID[id]));
  j.legends = obj(o.legends); j.rare = Object.fromEntries(Object.entries(obj(o.rare)).filter(([id]) => RARE_BY_ID[id])); j.notes = Object.fromEntries(Object.entries(obj(o.notes)).filter(([id]) => NOTE_BY_ID[id]));
  j.endings = Array.isArray(o.endings) ? o.endings.filter((e) => e && typeof e.key === 'string' && e.title && e.summary && e.creature).slice(-MAX_ENDINGS) : [];
  j.biomes = Array.isArray(o.biomes) ? o.biomes.filter((b): b is BiomeId => typeof b === 'string' && b in BIOMES) : [];
  j.achievements = obj(o.achievements);
  return j;
}
