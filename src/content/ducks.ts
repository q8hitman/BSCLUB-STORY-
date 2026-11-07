import type { DuckMood, L10n, StatKey, Style } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export interface Duck {
  id: string;
  img: string; // file in public/ducks — the club's original artwork, shown unmodified
  bg: string;
  name: L10n;
  role: L10n;
  perk: L10n;
  /** +1 to checks on this stat. */
  bonusStat: StatKey;
  /** Ending tone this duck nudges towards. */
  favStyle: Style;
}

// The club's real characters (image 1–7). Names and identities are fixed by the designer — do not rename.
export const DUCKS: Duck[] = [
  { id: 'petri', img: '1.webp', bg: '#c9d3df', name: L('Abdullah', 'عبدالله'), role: L('Microbiology hype-duck', 'بطّ الميكروبات الحماسي'),
    perk: L('+1 Charm checks', '+١ لاختبارات الجاذبية'), bonusStat: 'charm', favStyle: 'bold', },
  { id: 'quill', img: '2.webp', bg: '#e1d6c3', name: L('Al-Jamal', 'الجمل'), role: L('Old-school field biologist', 'عالم أحياء ميداني قديم'),
    perk: L('+1 Intellect checks', '+١ لاختبارات الذكاء'), bonusStat: 'intellect', favStyle: 'careful', },
  { id: 'pipette', img: '3.webp', bg: '#cfd8c4', name: L('Ali', 'علي'), role: L('Precision lab tech', 'فنّي مختبر دقيق'),
    perk: L('+1 Agility checks', '+١ لاختبارات الرشاقة'), bonusStat: 'agility', favStyle: 'clever', },
  { id: 'goggles', img: '4.webp', bg: '#ccd2da', name: L('Bassam', 'بسام'), role: L('Chill safety officer', 'مسؤول السلامة الرايق'),
    perk: L('+1 Cold & Heat checks', '+١ لاختبارات الحر والبرد'), bonusStat: 'cold', favStyle: 'careful', },
  { id: 'cherry', img: '5.webp', bg: '#e8cfd3', name: L('Kiraz', 'كيراز'), role: L('Gothic biochemist', 'كيميائية حيوية قوطية'),
    perk: L('+1 Strength checks', '+١ لاختبارات القوة'), bonusStat: 'strength', favStyle: 'bold', },
  { id: 'lens', img: '6.webp', bg: '#e3d3dc', name: L('Roaa', 'رؤى'), role: L('Microscopy queen', 'ملكة المجهر'),
    perk: L('+1 Stealth checks (she notices everything)', '+١ للتخفّي (تلاحظ كل شي)'), bonusStat: 'stealth', favStyle: 'kind', },
  { id: 'data', img: '7.webp', bg: '#ddd3c0', name: L('Dr. Zahra', 'دكتورة زهراء'), role: L('Bioinformatics strategist', 'استراتيجية المعلوماتية الحيوية'),
    perk: L('Shows the odds on every choice', 'تبيّن نسبة النجاح لكل خيار'), bonusStat: 'swim', favStyle: 'clever', },
];

export const DUCK_BY_ID = Object.fromEntries(DUCKS.map((d) => [d.id, d]));

/** Short, natural reactions (Kuwaiti dialect in Arabic). Kept understated on purpose — no forced jokes. */
export const MOOD_LINES: Record<DuckMood, L10n[]> = {
  happy: [L('Good. That worked.', 'زين، مشت معانا.'), L('Keep going — we’re on track.', 'كمّلوا، إحنا ماشين صح.'), L('Noted.', 'سجّلتها.'), L('Nice and clean.', 'حلوة… ونظيفة.')],
  worried: [L('I don’t like this.', 'مو مرتاح لهالشي.'), L('Careful.', 'انتبهوا.'), L('Let’s step back a little.', 'خلّونا نتراجع شوي.'), L('That cost us.', 'هذي كلّفتنا.')],
  shocked: [L('Did you see that?', 'شفتوا هذا؟'), L('Wait… what was that?', 'لحظة… شنو كان هذا؟'), L('Don’t move.', 'لا تتحركون.'), L('That wasn’t on any chart.', 'هذا مو موجود بأي مرجع.')],
  thinking: [L('Something here isn’t right.', 'فيه شي مو طبيعي هني.'), L('Watch the details.', 'ركّزوا على التفاصيل.'), L('Think before we move.', 'خلّونا نفكر قبل لا نتحرك.'), L('Look closer.', 'طالعوا زين.')],
  laughing: [L('Didn’t see that coming.', 'ما توقعت هالشي.'), L('Well, that was something.', 'طيب… هذي كانت تجربة.'), L('We’ll call it an experiment.', 'نعتبرها تجربة علمية.')],
  proud: [L('Clean work.', 'شغل نظيف.'), L('The club would be proud.', 'النادي بيفتخر فيكم.'), L('That’s what we call science.', 'هذا اللي نسميه علم.')],
};
