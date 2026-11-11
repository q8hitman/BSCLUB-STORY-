// Creature Test Lab: short, optional experiments after building a creature. Each shows how one adaptation the
// creature has (or lacks) changes what it can do in the stories. The ability is REAL in the named animals; putting
// it in this hybrid is fiction — the screen labels that clearly.
// Wording (2026-11-11): every experiment says in plain words what the room looks like, what the creature must do,
// and what happened — a visitor should understand it without having played before.
import type { Capability, DerivedCreature, L10n, StatKey } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });
export type LabResult = 'strong' | 'partial' | 'none';
export interface Experiment {
  id: string; icon: string; plate: string;
  title: L10n; challenge: L10n;
  caps: Capability[]; stat: StatKey;
  results: Record<LabResult, L10n>;
  /** The real biology, in simple Modern Standard Arabic. */
  science: L10n;
  /** Real animals that have it. */
  realIn: L10n;
  /** What it changes in the adventures. */
  inStory: L10n;
}

export const EXPERIMENTS: Experiment[] = [
  { id: 'swim', icon: '🌊', plate: 'lab-glow-tank', caps: ['swim', 'breatheWater'], stat: 'swim',
    title: L('Swimming test', 'تجربة السباحة'),
    challenge: L('A big tank is full of water. Can your creature swim across to the other side?', 'أمام مخلوقك حوض كبير مليء بالماء. هل يستطيع أن يسبح إلى الجهة الأخرى؟'),
    results: { strong: L('Yes! It swam across easily.', 'نعم! سبح إلى الجهة الأخرى بسهولة.'), partial: L('It made it, but slowly and with a lot of splashing.', 'وصل، لكن ببطء ومع كثير من رشّ الماء.'), none: L('No. It stopped at the edge and would not go in. It is not built for water.', 'لا. وقف عند الحافة ولم يدخل الماء. جسمه غير مناسب للسباحة.') },
    science: L('Fins and webbed feet push more water with each stroke, so the animal moves forward with less effort.', 'الزعانف والأقدام التي بين أصابعها جلد تدفع ماءً أكثر في كل حركة، فيتقدّم الحيوان بتعب أقل.'),
    realIn: L('Ducks, frogs, otters, fish', 'البط، والضفادع، وثعالب الماء، والأسماك'), inStory: L('It can take routes through water and flooded tunnels.', 'يستطيع مخلوقك أن يمرّ من الطرق المائية والأنفاق المليئة بالماء.') },
  { id: 'climb', icon: '🧗', plate: 'mountain-scree', caps: ['climb', 'grip', 'fly', 'glide'], stat: 'agility',
    title: L('Climbing test', 'تجربة التسلّق'),
    challenge: L('A jar sits on a high shelf. The wall is smooth and there is no ladder. Can your creature get up there and bring the jar?', 'على رفّ عالٍ توجد قارورة. الجدار أملس ولا يوجد سلّم. هل يستطيع مخلوقك أن يصعد ويُحضر القارورة؟'),
    results: { strong: L('Yes! It went up the wall and came back with the jar.', 'نعم! صعد الجدار ونزل ومعه القارورة.'), partial: L('It did it with difficulty: it fell twice and reached the shelf on the third try.', 'نجح بصعوبة: سقط مرتين، ثم وصل إلى الرف في المحاولة الثالثة.'), none: L('No. It slid back down every time.', 'لا. كان ينزلق إلى الأسفل في كل مرة.') },
    science: L('A gecko has millions of tiny hairs on its toes. Each hair sticks a little to the wall; together they carry its whole body.', 'في أصابع الوزغ (أبو بريص) ملايين الشعيرات الصغيرة جداً. كل شعرة تلتصق بالجدار قليلاً، وكلها معاً تحمل جسمه كله.'),
    realIn: L('Geckos, squirrels, ibex, tree frogs', 'الوزغ، والسناجب، والوعول، وضفادع الأشجار'), inStory: L('It can reach high places and look out from above.', 'يستطيع مخلوقك أن يصل إلى الأماكن العالية ويراقب من فوق.') },
  { id: 'dig', icon: '⛏️', plate: 'desert-buried-box', caps: ['dig'], stat: 'strength',
    title: L('Digging test', 'تجربة الحفر'),
    challenge: L('A box is buried under the sand. Can your creature dig and find it?', 'يوجد صندوق مدفون تحت الرمل. هل يستطيع مخلوقك أن يحفر ويجده؟'),
    results: { strong: L('Yes! Sand flew everywhere and it found the box in seconds.', 'نعم! تطاير الرمل في كل مكان، ووجد الصندوق في ثوانٍ.'), partial: L('It dug slowly, and only the lid of the box is showing.', 'حفر ببطء، ولم يظهر من الصندوق إلا غطاؤه.'), none: L('No. It scratched the sand a little and stopped.', 'لا. خدش الرمل قليلاً ثم توقّف.') },
    science: L('A mole has wide front paws like shovels and strong shoulders that push the soil aside.', 'للخلد (حيوان يعيش تحت الأرض) كفّان أماميتان عريضتان مثل المجرفة، وكتفان قويتان تدفعان التراب إلى الجانبين.'),
    realIn: L('Moles, armadillos, pangolins', 'الخلد، والمدرّع، وآكل النمل الحرشفي'), inStory: L('It can find buried clues and dig under obstacles.', 'يستطيع مخلوقك أن يجد الأدلة المدفونة وأن يحفر من تحت العوائق.') },
  { id: 'echo', icon: '🦇', plate: 'cave-echo-pulse', caps: ['echolocation'], stat: 'intellect',
    title: L('Dark maze test', 'تجربة المتاهة المظلمة'),
    challenge: L('The lights are off in a small maze. Can your creature find the way out without seeing?', 'الأضواء مطفأة داخل متاهة صغيرة. هل يستطيع مخلوقك أن يجد المخرج دون أن يرى؟'),
    results: { strong: L('Yes! It made clicking sounds, listened to the echo, and walked out without touching a wall.', 'نعم! أصدر أصوات طقطقة، واستمع إلى صداها، وخرج دون أن يلمس أي جدار.'), partial: L('It got out slowly by touching the walls.', 'خرج ببطء وهو يلمس الجدران ليعرف طريقه.'), none: L('No. It stayed lost until the lights came back on.', 'لا. بقي تائهاً حتى أُضيئت الأنوار.') },
    science: L('A bat makes high sounds and listens for the echo. If the echo comes back late, the thing is far away.', 'يُصدر الخفّاش أصواتاً حادّة ثم يستمع إلى صداها. إذا تأخّر الصدى فالشيء بعيد، وإذا رجع بسرعة فالشيء قريب.'),
    realIn: L('Bats, dolphins, some cave birds', 'الخفافيش، والدلافين، وبعض طيور الكهوف'), inStory: L('It can know the shape of a cave or dark water before going in.', 'يستطيع مخلوقك أن يعرف شكل الكهف أو الماء المظلم قبل أن يدخل.') },
  { id: 'night', icon: '🌙', plate: 'lab-dark-corridor', caps: ['nightVision', 'heatSense'], stat: 'stealth',
    title: L('Night vision test', 'تجربة الرؤية في الظلام'),
    challenge: L('A toy is hidden in an almost dark corridor. Can your creature see it?', 'توجد دمية مخبّأة في ممرّ شبه مظلم. هل يستطيع مخلوقك أن يراها؟'),
    results: { strong: L('Yes! It saw the toy at once.', 'نعم! رأى الدمية فوراً.'), partial: L('It walked past it first, then found it on the way back.', 'مرّ بجانبها أولاً، ثم وجدها في طريق العودة.'), none: L('No. It walked right past the toy without seeing it.', 'لا. مرّ بجانب الدمية ولم يرها.') },
    science: L('A cat has a layer behind its eye that works like a mirror and uses the light twice. Some snakes feel the heat of bodies instead of seeing light.', 'خلف عين القطة طبقة تعمل مثل المرآة، فتستفيد العين من الضوء مرتين. وبعض الأفاعي تشعر بحرارة الأجسام بدل أن ترى الضوء.'),
    realIn: L('Cats, owls, some snakes', 'القطط، والبوم، وبعض الأفاعي'), inStory: L('It can notice details in dark rooms, caves and the deep sea.', 'يستطيع مخلوقك أن يلاحظ التفاصيل في الغرف المظلمة والكهوف وأعماق البحر.') },
  { id: 'camo', icon: '🫥', plate: 'reef-octopus-den', caps: ['camouflage', 'ink', 'mimic'], stat: 'stealth',
    title: L('Hiding test', 'تجربة الاختباء'),
    challenge: L('A small lab drone flies around the room looking for your creature. Can it stay hidden?', 'طائرة صغيرة من المختبر تدور في الغرفة وتبحث عن مخلوقك. هل يستطيع أن يبقى مختبئاً؟'),
    results: { strong: L('Yes! The drone passed three times and saw nothing.', 'نعم! مرّت الطائرة ثلاث مرات ولم تره.'), partial: L('Almost: the drone found it on its last pass.', 'كاد ينجح: وجدته الطائرة في آخر دورة.'), none: L('No. The drone found it in five seconds.', 'لا. وجدته الطائرة في خمس ثوانٍ.') },
    science: L('An octopus has colour cells in its skin that open and close very fast, so it takes the colour of the rocks around it.', 'في جلد الأخطبوط خلايا ملوّنة تنفتح وتنغلق بسرعة كبيرة، فيصير لونه مثل لون الصخور حوله.'),
    realIn: L('Octopuses, cuttlefish, chameleons', 'الأخطبوط، والحبّار، والحرباء'), inStory: L('It can pass near danger and watch animals without being seen.', 'يستطيع مخلوقك أن يمرّ قرب الخطر وأن يراقب الحيوانات دون أن تراه.') },
  { id: 'signal', icon: '📡', plate: 'forest-silent-birds', caps: ['scent', 'motionSense'], stat: 'intellect',
    title: L('Smell and sensing test', 'تجربة الشمّ والإحساس'),
    challenge: L('There are four closed boxes. One has something inside that moves and smells. Can your creature tell which box?', 'أمام مخلوقك أربعة صناديق مغلقة. في واحد منها شيء يتحرّك وله رائحة. هل يستطيع أن يعرف أيّ صندوق هو؟'),
    results: { strong: L('Yes! It chose the right box on the first try.', 'نعم! اختار الصندوق الصحيح من أول مرة.'), partial: L('It got it right on the second try.', 'عرف الصندوق الصحيح في المحاولة الثانية.'), none: L('No. It guessed, and the guess was wrong.', 'لا. اختار صندوقاً بالتخمين، وكان خاطئاً.') },
    science: L('A fish feels tiny movements in the water with a line of sensors on its sides. A dog has hundreds of millions of smell cells in its nose.', 'تشعر السمكة بأصغر حركة في الماء بخطّ من الحسّاسات على جانبي جسمها. وفي أنف الكلب مئات الملايين من خلايا الشمّ.'),
    realIn: L('Fish, sharks, dogs, moths', 'الأسماك، وأسماك القرش، والكلاب، والعثّ'), inStory: L('It can follow tracks and notice hidden animals and coming danger.', 'يستطيع مخلوقك أن يتتبّع الآثار وأن ينتبه للحيوانات المختبئة وللخطر قبل وصوله.') },
];

export function runExperiment(x: Experiment, d: DerivedCreature): { result: LabResult; via: string | null } {
  const part = Object.values(d.parts).find((p) => p.caps?.some((c) => x.caps.includes(c)));
  if (part) return { result: 'strong', via: part.id };
  return { result: d.stats[x.stat] >= 3 ? 'partial' : 'none', via: null };
}
