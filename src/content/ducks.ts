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
  /** Backdrop colour at the edges of the portrait art, so the card behind it blends with no visible rectangle. */
  edge: string;
  /** Grammatical gender, used for Arabic verb/adjective agreement in story text. */
  gender: 'm' | 'f';
  name: L10n;
  role: L10n;
  /** Personality brief — also given to the AI Story Director for Duck Radio lines. Ducks are companions only: no gameplay perks. */
  voice: string;
  /** Optional short description shown under the role on the companion screen. */
  about?: L10n;
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
  mk('abdullah', { edge: '#756255', gender: 'm', bg: '#3a2e2a', name: L('Abdullah', 'عبدالله'), role: L('Microbiology researcher', 'باحث في الأحياء الدقيقة'),
    about: L('Full of energy and always the first to get excited. He studies microbiology and sees tiny life everywhere: in the soil, in the water, even on your phone screen. When the team gets stuck, he is the one who says: let’s try again.', 'مليء بالحماس، وأول من يتحمّس دائماً. يدرس الأحياء الدقيقة، ويرى الكائنات الصغيرة في كل مكان: في التراب، وفي الماء، وحتى على شاشة الجوال. وحين يتوقّف الفريق، هو الذي يقول: لنجرّب مرة أخرى.'),
    voice: 'Energetic microbiology fan in a backwards cap. Sees microbes everywhere, hypes the team, impatient, warm. Speaks simple Modern Standard Arabic with a light playful touch.' }),
  mk('ahmed', { edge: '#614b3e', gender: 'm', bg: '#3b3226', name: L('Ahmed', 'أحمد'), role: L('Field explorer & sample collector', 'مستكشف ميداني وجامع عيّنات'),
    about: L('The team’s explorer. He follows tracks, reads the land and never comes back without a sample and a page of notes. He is the first one out of the door and the last one back to the lab.', 'مستكشف الفريق. يتبع الآثار، ويقرأ الأرض، ولا يرجع أبداً بدون عيّنة وصفحة من الملاحظات. هو أول من يخرج من الباب، وآخر من يرجع إلى المختبر.'),
    voice: 'Enthusiastic field naturalist with a test tube and a notebook. Loves tracks, habitats and collecting samples. Optimistic, sometimes rushes in.' }),
  mk('camel', { edge: '#543e31', gender: 'm', bg: '#33302a', name: L('Camel', 'الجمل'), role: L('Molecular biologist', 'باحث في الأحياء الجزيئية'),
    about: L('The thinker of the team. He studies the molecules inside living things and always has a theory ready. Sometimes the theory is wrong, and he is the first to laugh about it.', 'مفكّر الفريق. يدرس الجزيئات داخل الكائنات الحيّة، وعنده نظرية جاهزة دائماً. أحياناً تكون النظرية خاطئة، وهو أول من يضحك منها.'),
    voice: 'Analytical male duck with glasses, a green vest, a book and a molecular model. Curious about biological processes and molecules, proposes theories that are sometimes wrong, dry humour. Never reveals the right choice.' }),
  mk('bassam', { edge: '#58423c', gender: 'm', bg: '#2e2f33', name: L('Bassam', 'بسام'), role: L('Lab safety officer', 'مسؤول السلامة في المختبر'),
    about: L('Calm in every situation. He makes sure everyone goes home safe, and he does it without fuss. He has a quiet sense of humour and a plan for everything that could go wrong.', 'هادئ في كل موقف. يتأكّد أن الجميع يرجعون سالمين، ويفعل ذلك بدون ضجّة. عنده حسّ فكاهة هادئ، وخطة لكل شيء قد يسوء.'),
    voice: 'Calm safety officer with goggles and a coffee mug. Unbothered, practical, quietly funny, always thinking about risk.' }),
  mk('kiraz', { edge: '#574039', gender: 'f', bg: '#3a2629', name: L('Kiraz', 'كيراز'), role: L('Biochemist & toxins researcher', 'باحثة في الكيمياء الحيوية والسموم'),
    about: L('Fearless and full of surprises. She studies the chemistry of living things, especially toxins and venoms, and finds the strangest facts the most exciting.', 'شجاعة ومليئة بالمفاجآت. تدرس كيمياء الكائنات الحيّة، وخاصة السموم، وأغرب المعلومات هي أكثرها متعة عندها.'),
    voice: 'Biochemist with a cherry bow and a dark outfit. Delighted by toxins and strange chemistry, deadpan humour, fearless.' }),
  mk('roaa', { edge: '#523c34', gender: 'f', bg: '#382a30', name: L('Roaa', 'رؤى'), role: L('Microscopy specialist', 'أخصائية الفحص المجهري'),
    about: L('She notices what everyone else misses. Under her microscope a drop of water becomes a whole world. She is gentle with animals and gets quietly excited by tiny details.', 'تلاحظ ما لا يلاحظه غيرها. تحت مجهرها تصير قطرة الماء عالماً كاملاً. لطيفة مع الحيوانات، وتفرح بهدوء بالتفاصيل الصغيرة.'),
    voice: 'Microscopy specialist with a black bow. Notices tiny details others miss, gentle, cares about animals, gets excited quietly.' }),
  mk('zahra', { edge: '#4a3430', gender: 'f', bg: '#30292a', name: L('Dr. Zahra', 'دكتورة زهراء'), role: L('Bioinformatics lead', 'قائدة فريق المعلوماتية الحيوية'),
    about: L('The team leader and the voice of reason. She turns clues into data and data into answers. When everyone is guessing, she asks: what do the numbers say?', 'قائدة الفريق وصوت العقل. تحوّل الأدلة إلى بيانات، والبيانات إلى أجوبة. وحين يخمّن الجميع، تسأل: ماذا تقول الأرقام؟'),
    voice: 'Calm, confident bioinformatics lead in a grey hijab with a tablet. Thinks in data and probabilities, dry wit, the voice of reason.' }),
  mk('najdi', { edge: '#38272f', gender: 'm', bg: '#2f2229', name: L('Al-Najdi', 'النجدي'), role: L('Microbiology student · the club’s artist and comedian', 'طالب أحياء دقيقة · فنّان النادي وكوميديّه'),
    about: L('The club’s artist, and the reason everyone is laughing. He studies microbiology and draws bacteria as cartoon characters. He says his chakra (the hero energy from anime) never runs out. If you hear laughter in the lab, Al-Najdi is there.',
      'فنّان النادي، وسبب ضحك الجميع. يدرس الأحياء الدقيقة، ويرسم البكتيريا كأنها شخصيات كرتونية. ويقول إن «التشاكرا» عنده (طاقة الأبطال في الأنمي) لا تنتهي. إذا سمعتم ضحكاً في المختبر، فالنجدي هناك.'),
    voice: 'Microbiology student in a green dinosaur onesie with a backpack. The club artist and comedian: jokes first, then a real observation. Loves anime chakra talk ("my chakra is full"), sketches everything he sees, turns microbes into cartoon characters. Warm, loud, never mean.' }),
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
