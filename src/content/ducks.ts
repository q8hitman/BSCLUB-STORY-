import type { DuckMood, L10n, StatKey, Style } from '../engine/types';
import ASSETS from './duck-assets.json';

const L = (en: string, ar: string): L10n => ({ en, ar });

/** Expression names available on every approved character sheet (top row, left → right). */
export type Expression = 'happy' | 'curious' | 'shocked' | 'worried' | 'laughing' | 'sly';

export interface Duck {
  id: string;
  /** Default portrait (front pose), relative to /ducks/. Original approved artwork, never redrawn. */
  img: string;
  bg: string;
  name: L10n;
  role: L10n;
  perk: L10n;
  /** Personality brief — also given to the AI Story Director for Duck Radio lines. */
  voice: string;
  bonusStat: StatKey;
  favStyle: Style;
  expressions: Record<Expression, string>;
  poses: Record<string, string>;
}

type Asset = { expressions: Record<Expression, string>; poses: Record<string, string> };
const A = ASSETS as unknown as Record<string, Asset>;
const strip = (p: string) => p.replace(/^ducks\//, '');
const mk = (id: string, d: Omit<Duck, 'id' | 'img' | 'expressions' | 'poses'>): Duck => ({
  id, ...d, img: strip(A[id].poses.front),
  expressions: Object.fromEntries(Object.entries(A[id].expressions).map(([k, v]) => [k, strip(v)])) as Record<Expression, string>,
  poses: Object.fromEntries(Object.entries(A[id].poses).map(([k, v]) => [k, strip(v)])),
});

// Final approved BSC characters (art-source/ducks-final). Ali has been replaced by Camel (الجمل).
export const DUCKS: Duck[] = [
  mk('abdullah', { bg: '#3a2e2a', name: L('Abdullah', 'عبدالله'), role: L('Microbiology enthusiast', 'مهووس الميكروبات'),
    perk: L('+1 Charm checks', '+١ لاختبارات الجاذبية'), bonusStat: 'charm', favStyle: 'bold',
    voice: 'Energetic microbiology fan in a backwards cap. Sees microbes everywhere, hypes the team, impatient, warm, Kuwaiti slang.' }),
  mk('ahmed', { bg: '#3b3226', name: L('Ahmed', 'أحمد'), role: L('Field naturalist', 'عالم طبيعة ميداني'),
    perk: L('+1 Agility checks', '+١ لاختبارات الرشاقة'), bonusStat: 'agility', favStyle: 'bold',
    voice: 'Enthusiastic field naturalist with a test tube and a notebook. Loves tracks, habitats and collecting samples. Optimistic, sometimes rushes in.' }),
  mk('camel', { bg: '#33302a', name: L('Camel', 'الجمل'), role: L('Molecular biologist & theorist', 'عالم أحياء جزيئية وصاحب نظريات'),
    perk: L('+1 Intellect checks', '+١ لاختبارات الذكاء'), bonusStat: 'intellect', favStyle: 'clever',
    voice: 'Analytical male duck with glasses, a green vest, a book and a molecular model. Curious about biological processes and molecules, proposes theories that are sometimes wrong, dry humour. Never reveals the right choice.' }),
  mk('bassam', { bg: '#2e2f33', name: L('Bassam', 'بسام'), role: L('Lab safety officer', 'مسؤول السلامة'),
    perk: L('+1 Cold & Heat checks', '+١ لاختبارات الحر والبرد'), bonusStat: 'cold', favStyle: 'careful',
    voice: 'Calm safety officer with goggles and a coffee mug. Unbothered, practical, quietly funny, always thinking about risk.' }),
  mk('kiraz', { bg: '#3a2629', name: L('Kiraz', 'كيراز'), role: L('Gothic biochemist', 'كيميائية حيوية قوطية'),
    perk: L('+1 Strength checks', '+١ لاختبارات القوة'), bonusStat: 'strength', favStyle: 'bold',
    voice: 'Gothic biochemist with a cherry bow. Delighted by toxins and strange chemistry, dark deadpan humour, fearless.' }),
  mk('roaa', { bg: '#382a30', name: L('Roaa', 'رؤى'), role: L('Microscopy specialist', 'متخصصة المجهر'),
    perk: L('+1 Stealth checks (she notices everything)', '+١ للتخفّي (تلاحظ كل شي)'), bonusStat: 'stealth', favStyle: 'kind',
    voice: 'Microscopy specialist with a black bow. Notices tiny details others miss, gentle, cares about animals, gets excited quietly.' }),
  mk('zahra', { bg: '#30292a', name: L('Dr. Zahra', 'دكتورة زهراء'), role: L('Bioinformatics lead', 'قائدة المعلوماتية الحيوية'),
    perk: L('Shows the odds on every choice', 'تبيّن نسبة النجاح لكل خيار'), bonusStat: 'swim', favStyle: 'clever',
    voice: 'Calm, confident bioinformatics lead in a grey hijab with a tablet. Thinks in data and probabilities, dry wit, the voice of reason.' }),
];

/** Old save ids (before the final character sheets) → current ids. Ali's slot ("pipette") now belongs to Camel. */
export const DUCK_ALIASES: Record<string, string> = { petri: 'abdullah', quill: 'ahmed', pipette: 'camel', goggles: 'bassam', cherry: 'kiraz', lens: 'roaa', data: 'zahra' };
export const resolveDuckId = (id: string) => DUCK_ALIASES[id] ?? id;

const BY_ID = Object.fromEntries(DUCKS.map((d) => [d.id, d]));
/** Lookup that also accepts legacy ids from older saved games. */
export const DUCK_BY_ID: Record<string, Duck> = new Proxy(BY_ID, { get: (t, k: string) => t[resolveDuckId(k)] });

export const MOOD_EXPRESSION: Record<DuckMood, Expression> = { happy: 'happy', worried: 'worried', shocked: 'shocked', thinking: 'curious', laughing: 'laughing', proud: 'sly' };

/** Short, natural reactions used when no character-specific line fits. */
export const MOOD_LINES: Record<DuckMood, L10n[]> = {
  happy: [L('Good. That worked.', 'زين، مشت معانا.'), L('Keep going — we’re on track.', 'كمّلوا، إحنا ماشين صح.'), L('Noted.', 'سجّلتها.'), L('Nice and clean.', 'حلوة… ونظيفة.')],
  worried: [L('I don’t like this.', 'مو مرتاح لهالشي.'), L('Careful.', 'انتبهوا.'), L('Let’s step back a little.', 'خلّونا نتراجع شوي.'), L('That cost us.', 'هذي كلّفتنا.')],
  shocked: [L('Did you see that?', 'شفتوا هذا؟'), L('Wait… what was that?', 'لحظة… شنو كان هذا؟'), L('Don’t move.', 'لا تتحركون.'), L('That wasn’t on any chart.', 'هذا مو موجود بأي مرجع.')],
  thinking: [L('Something here isn’t right.', 'فيه شي مو طبيعي هني.'), L('Watch the details.', 'ركّزوا على التفاصيل.'), L('Think before we move.', 'خلّونا نفكر قبل لا نتحرك.'), L('Look closer.', 'طالعوا زين.')],
  laughing: [L('Didn’t see that coming.', 'ما توقعت هالشي.'), L('Well, that was something.', 'طيب… هذي كانت تجربة.'), L('We’ll call it an experiment.', 'نعتبرها تجربة علمية.')],
  proud: [L('Clean work.', 'شغل نظيف.'), L('The club would be proud.', 'النادي بيفتخر فيكم.'), L('That’s what we call science.', 'هذا اللي نسميه علم.')],
};
