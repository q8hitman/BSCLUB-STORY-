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
  catch: L10n[];
}

// The club's real characters (image 1–7). Names and identities are fixed by the designer — do not rename.
export const DUCKS: Duck[] = [
  { id: 'petri', img: '1.webp', bg: '#c9d3df', name: L('Abdullah', 'عبدالله'), role: L('Microbiology hype-duck', 'بطّ الميكروبات الحماسي'),
    perk: L('+1 Charm checks', '+١ لاختبارات الجاذبية'), bonusStat: 'charm', favStyle: 'bold',
    catch: [L('Bro, this petri dish has more life than my weekend.', 'يا ريال، هالطبق فيه حياة أكثر من ويكندي.'), L('Let’s gooo, science time!', 'يلا يلا، وقت العلوم!'), L('Trust the culture. Bacterial culture.', 'ثق بالمزرعة… المزرعة البكتيرية.')] },
  { id: 'quill', img: '2.webp', bg: '#e1d6c3', name: L('Al-Jamal', 'الجمل'), role: L('Old-school field biologist', 'عالم أحياء ميداني قديم'),
    perk: L('+1 Intellect checks', '+١ لاختبارات الذكاء'), bonusStat: 'intellect', favStyle: 'careful',
    catch: [L('Note it down. Everything goes in the notebook.', 'سجّل. كل شي ينكتب بالدفتر.'), L('In my day we used real microscopes. Brass ones.', 'بأيامنا كانت المجاهر نحاس، مو مثل الحين.'), L('Hypothesis first, panic second.', 'الفرضية أول، والخرعة بعدين.')] },
  { id: 'pipette', img: '3.webp', bg: '#cfd8c4', name: L('Ali', 'علي'), role: L('Precision lab tech', 'فنّي مختبر دقيق'),
    perk: L('+1 Agility checks', '+١ لاختبارات الرشاقة'), bonusStat: 'agility', favStyle: 'clever',
    catch: [L('Exactly 2.5 microlitres of courage. Go.', 'بالضبط ٢.٥ ميكرولتر شجاعة… يلا.'), L('Label everything. Even the monster.', 'حط ليبل على كل شي… حتى الوحش.'), L('Colour-coded panic: blue means fine.', 'خرعة ملوّنة: الأزرق يعني تمام.')] },
  { id: 'goggles', img: '4.webp', bg: '#ccd2da', name: L('Bassam', 'بسام'), role: L('Chill safety officer', 'مسؤول السلامة الرايق'),
    perk: L('+1 Cold & Heat checks', '+١ لاختبارات الحر والبرد'), bonusStat: 'cold', favStyle: 'careful',
    catch: [L('Safety goggles on. Coffee in hand. Let’s see.', 'النظارة على الراس والقهوة بيدي… خلنا نشوف.'), L('Relax. Breathe. Do not lick the sample.', 'روّق… تنفّس… ولا تلحس العيّنة.'), L('I’ve seen worse. Not much worse, but worse.', 'شفت أخس… مو وايد أخس، بس أخس.')] },
  { id: 'cherry', img: '5.webp', bg: '#e8cfd3', name: L('Kiraz', 'كيراز'), role: L('Gothic biochemist', 'كيميائية حيوية قوطية'),
    perk: L('+1 Strength checks', '+١ لاختبارات القوة'), bonusStat: 'strength', favStyle: 'bold',
    catch: [L('Ooh, it’s toxic? I love it already.', 'أوه سام؟ حبيته من الحين.'), L('Pink flask, dark heart, perfect data.', 'دورق وردي، قلب أسود، بيانات مثالية.'), L('Darling, chaos is just chemistry with style.', 'حبيبي، الفوضى كيميا بس بستايل.')] },
  { id: 'lens', img: '6.webp', bg: '#e3d3dc', name: L('Roaa', 'رؤى'), role: L('Microscopy queen', 'ملكة المجهر'),
    perk: L('+1 Stealth checks (she notices everything)', '+١ للتخفّي (تلاحظ كل شي)'), bonusStat: 'stealth', favStyle: 'kind',
    catch: [L('Zoom in… zoom in more… oh my.', 'قرّب… قرّب بعد… يا ويلي.'), L('Small details solve big mysteries.', 'التفاصيل الصغيرة تحل الألغاز الكبيرة.'), L('Look! Cells! Everywhere! I’m fine.', 'شوفوا! خلايا! بكل مكان! أنا عادي.')] },
  { id: 'data', img: '7.webp', bg: '#ddd3c0', name: L('Dr. Zahra', 'دكتورة زهراء'), role: L('Bioinformatics strategist', 'استراتيجية المعلوماتية الحيوية'),
    perk: L('Shows the odds on every choice', 'تبيّن نسبة النجاح لكل خيار'), bonusStat: 'swim', favStyle: 'clever',
    catch: [L('I ran the numbers. You won’t like them.', 'حسبتها… ما راح تعجبك.'), L('Sample size of one. Statistically, we’re doomed.', 'العيّنة وحدة… إحصائياً، طايحين.'), L('Logging this. For science. And for the group chat.', 'أسجّلها… للعلم وللقروب.')] },
];

export const DUCK_BY_ID = Object.fromEntries(DUCKS.map((d) => [d.id, d]));

/** Shared reactions in Kuwaiti dialect (ar) — used on top of each duck's catchphrases. */
export const MOOD_LINES: Record<DuckMood, L10n[]> = {
  happy: [L('Yesss! That worked!', 'إيييه! زبطت!'), L('Look at it go!', 'شوفوه شلون ماشي!'), L('That’s our beast!', 'هذا وحشنا!'), L('Clean result. Chef’s kiss.', 'نتيجة نظيفة… فلّة.')],
  worried: [L('Uh… is it supposed to do that?', 'أمم… طبيعي يسوي جذي؟'), L('I don’t like this. Not one bit.', 'ما عجبني الوضع أبد.'), L('Okay okay okay, we can fix this.', 'خلاص خلاص، نقدر نصلّحها.'), L('My feathers are standing up.', 'ريشي واقف من الخوف.')],
  shocked: [L('WHAT was THAT?!', 'شنو هذاااا؟!'), L('No way. No WAY.', 'مستحيل… مستحيييل!'), L('Did everyone see that?!', 'شفتوا اللي صار؟!'), L('I need to sit down.', 'أبي أقعد شوي.')],
  thinking: [L('Hmm… there’s a pattern here.', 'هممم… فيه نمط هني.'), L('Give me a second, I’m calculating.', 'لحظة، قاعد أحسبها.'), L('Interesting. Very interesting.', 'مثير للاهتمام… وايد.'), L('What would a real biologist do?', 'شنو بيسوي عالم أحياء حقيقي؟')],
  laughing: [L('HAHA, it fell over!', 'ههههه طاح!'), L('That’s going in the club group chat.', 'هذي بتنحط بقروب النادي.'), L('I can’t breathe, that was so dumb.', 'ما أقدر أتنفس من الضحك.'), L('Ten out of ten, no notes.', 'عشرة من عشرة.')],
  proud: [L('That’s my creature!', 'هذا مخلوقي!'), L('Science wins again.', 'العلم فاز مرة ثانية.'), L('Put that on the club poster.', 'حطّوها على بوستر النادي.'), L('Honestly? Legendary.', 'بصراحة؟ أسطوري.')],
};
