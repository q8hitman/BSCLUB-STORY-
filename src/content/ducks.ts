import type { DuckMood, L10n } from '../engine/types';
import ASSETS from './duck-assets.json';

const L = (en: string, ar: string): L10n => ({ en, ar });

/** Expression names available on every approved character sheet (top row, left → right). */
export type Expression = 'happy' | 'curious' | 'shocked' | 'worried' | 'laughing' | 'sly';

export interface Duck {
  id: string;
  /** Default portrait (front pose), relative to /ducks/. Original approved artwork, never redrawn. */
  img: string;
  bg: string;
  /** Grammatical gender, used for Arabic verb/adjective agreement in story text. */
  gender: 'm' | 'f';
  name: L10n;
  role: L10n;
  /** Personality brief — also given to the AI Story Director for Duck Radio lines. Ducks are companions only: no gameplay perks. */
  voice: string;
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
  mk('abdullah', { gender: 'm', bg: '#3a2e2a', name: L('Abdullah', 'عبدالله'), role: L('Microbiology enthusiast', 'شغوف بالميكروبات'),
    voice: 'Energetic microbiology fan in a backwards cap. Sees microbes everywhere, hypes the team, impatient, warm. Speaks simple Modern Standard Arabic with a light playful touch.' }),
  mk('ahmed', { gender: 'm', bg: '#3b3226', name: L('Ahmed', 'أحمد'), role: L('Field naturalist', 'عالم طبيعة ميداني'),
    voice: 'Enthusiastic field naturalist with a test tube and a notebook. Loves tracks, habitats and collecting samples. Optimistic, sometimes rushes in.' }),
  mk('camel', { gender: 'm', bg: '#33302a', name: L('Camel', 'الجمل'), role: L('Molecular biologist & theorist', 'عالم أحياء جزيئية وصاحب نظريات'),
    voice: 'Analytical male duck with glasses, a green vest, a book and a molecular model. Curious about biological processes and molecules, proposes theories that are sometimes wrong, dry humour. Never reveals the right choice.' }),
  mk('bassam', { gender: 'm', bg: '#2e2f33', name: L('Bassam', 'بسام'), role: L('Lab safety officer', 'مسؤول السلامة'),
    voice: 'Calm safety officer with goggles and a coffee mug. Unbothered, practical, quietly funny, always thinking about risk.' }),
  mk('kiraz', { gender: 'f', bg: '#3a2629', name: L('Kiraz', 'كيراز'), role: L('Gothic biochemist', 'كيميائية حيوية قوطية'),
    voice: 'Gothic biochemist with a cherry bow. Delighted by toxins and strange chemistry, dark deadpan humour, fearless.' }),
  mk('roaa', { gender: 'f', bg: '#382a30', name: L('Roaa', 'رؤى'), role: L('Microscopy specialist', 'متخصصة المجهر'),
    voice: 'Microscopy specialist with a black bow. Notices tiny details others miss, gentle, cares about animals, gets excited quietly.' }),
  mk('zahra', { gender: 'f', bg: '#30292a', name: L('Dr. Zahra', 'دكتورة زهراء'), role: L('Bioinformatics lead', 'قائدة المعلوماتية الحيوية'),
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
  happy: [L('Good. That worked.', 'جيد، نجح الأمر.'), L('Keep going — we’re on track.', 'واصلوا، نحن على الطريق الصحيح.'), L('Noted.', 'سجّلتُ ذلك.'), L('Nice and clean.', 'جميل… ونظيف.')],
  worried: [L('I don’t like this.', 'لست مرتاحاً لهذا.'), L('Careful.', 'انتبهوا.'), L('Let’s step back a little.', 'لنتراجع قليلاً.'), L('That cost us.', 'هذه كلّفتنا الكثير.')],
  shocked: [L('Did you see that?', 'هل رأيتم ذلك؟'), L('Wait… what was that?', 'لحظة… ما كان ذلك؟'), L('Don’t move.', 'لا تتحرّكوا.'), L('That wasn’t on any chart.', 'هذا غير موجود في أي مرجع.')],
  thinking: [L('Something here isn’t right.', 'هناك شيء غير طبيعي هنا.'), L('Watch the details.', 'ركّزوا على التفاصيل.'), L('Think before we move.', 'لنفكّر قبل أن نتحرّك.'), L('Look closer.', 'انظروا جيداً.')],
  laughing: [L('Didn’t see that coming.', 'لم أتوقّع هذا.'), L('Well, that was something.', 'حسناً… كانت تلك تجربة.'), L('We’ll call it an experiment.', 'نعتبرها تجربة علمية.')],
  proud: [L('Clean work.', 'عمل متقن.'), L('The club would be proud.', 'سيفخر بكم النادي.'), L('That’s what we call science.', 'هذا ما نسمّيه علماً.')],
};
