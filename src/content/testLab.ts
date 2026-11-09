// Creature Test Lab: short, optional experiments after building a creature. Each shows how one adaptation the
// creature has (or lacks) changes what it can do in the stories. The ability is REAL in the named animals; putting
// it in this hybrid is fiction — the screen labels that clearly.
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
    title: L('The flooded tank', 'حوض الغمر'), challenge: L('Cross the tank to the far platform before the timer ends.', 'اعبر الحوض إلى المنصّة البعيدة قبل انتهاء الوقت.'),
    results: { strong: L('Straight across, barely a ripple.', 'عبر مباشرةً دون أن يحرّك الماء تقريباً.'), partial: L('It made it — splashing and slow.', 'وصل… لكن ببطء ومع كثيرٍ من الرذاذ.'), none: L('It turned back at the edge. Water is not its world.', 'تراجع عند الحافّة. الماء ليس عالمه.') },
    science: L('Fins and webbed feet push against more water with each stroke, so the body moves forward with less effort.', 'الزعانف والأقدام المكفّفة تدفع كمّيةً أكبر من الماء في كل ضربة، فيتقدّم الجسم بجهدٍ أقل.'),
    realIn: L('Ducks, frogs, otters, fish', 'البط، والضفادع، وثعالب الماء، والأسماك'), inStory: L('Opens underwater routes and flooded tunnels.', 'تفتح طرقاً تحت الماء وأنفاقاً مغمورة.') },
  { id: 'climb', icon: '🧗', plate: 'mountain-scree', caps: ['climb', 'grip', 'fly', 'glide'], stat: 'agility',
    title: L('The smooth wall', 'الجدار الأملس'), challenge: L('Reach the sample jar on the high shelf.', 'اصعد إلى قارورة العيّنة على الرفّ العالي.'),
    results: { strong: L('Up the wall and back with the jar.', 'صعد الجدار وعاد بالقارورة.'), partial: L('It reached the shelf on the third try.', 'وصل إلى الرفّ في المحاولة الثالثة.'), none: L('It slid back down every time.', 'انزلق إلى الأسفل في كل مرّة.') },
    science: L('Geckos have millions of tiny hairs on their toes. Each one sticks weakly to the wall, but together they hold the whole body.', 'في أصابع الوزغ ملايين الشعيرات الدقيقة؛ كلٌّ منها يلتصق بالجدار التصاقاً ضعيفاً، لكنها معاً تحمل الجسم كلّه.'),
    realIn: L('Geckos, squirrels, ibex, tree frogs', 'الوزغ، والسناجب، والوعول، وضفادع الأشجار'), inStory: L('Unlocks high entrances, ledges and lookout points.', 'تفتح المداخل العالية والحوافّ ونقاط المراقبة.') },
  { id: 'dig', icon: '⛏️', plate: 'desert-buried-box', caps: ['dig'], stat: 'strength',
    title: L('The buried box', 'الصندوق المدفون'), challenge: L('Uncover the box buried in the sand pit.', 'اكشف الصندوق المدفون في حوض الرمل.'),
    results: { strong: L('Sand flew everywhere — box found in seconds.', 'تطاير الرمل في كل مكان، ووُجد الصندوق في ثوانٍ.'), partial: L('Slow work, but the lid is showing.', 'عملٌ بطيء، لكن الغطاء بدأ يظهر.'), none: L('It scratched the surface and gave up.', 'خدش السطح ثم توقّف.') },
    science: L('Moles have wide front paws turned outwards like shovels, and strong shoulder muscles to push soil aside.', 'للخلد كفّان أماميّتان عريضتان متّجهتان إلى الخارج كالمجارف، وعضلات كتفٍ قوية تزيح التراب جانباً.'),
    realIn: L('Moles, armadillos, pangolins', 'الخلد، والمدرّع، والبنغول'), inStory: L('Finds buried clues and digs around obstacles.', 'تكشف الأدلة المدفونة وتحفر حول العوائق.') },
  { id: 'echo', icon: '🦇', plate: 'cave-echo-pulse', caps: ['echolocation'], stat: 'intellect',
    title: L('The dark maze', 'المتاهة المظلمة'), challenge: L('Find the exit of a maze with the lights off.', 'جد مخرج المتاهة والأضواء مطفأة.'),
    results: { strong: L('Click… click… out in one try, without touching a wall.', 'طق… طق… خرج من المحاولة الأولى دون أن يلمس جداراً.'), partial: L('It felt its way out along the walls.', 'تحسّس طريقه إلى الخارج على طول الجدران.'), none: L('Lost in the dark until the lights came on.', 'تاه في الظلام حتى أُضيئت الأنوار.') },
    science: L('Bats make high-pitched calls and listen for the echo. The longer the echo takes, the farther away the object is.', 'تُصدر الخفافيش نداءاتٍ حادّة وتنصت إلى صداها؛ وكلما تأخّر الصدى، كان الجسم أبعد.'),
    realIn: L('Bats, dolphins, some cave birds', 'الخفافيش، والدلافين، وبعض طيور الكهوف'), inStory: L('Maps caves and dark water before you enter.', 'ترسم خريطة الكهوف والمياه المظلمة قبل دخولها.') },
  { id: 'night', icon: '🌙', plate: 'lab-dark-corridor', caps: ['nightVision', 'heatSense'], stat: 'stealth',
    title: L('The night corridor', 'ممرّ الليل'), challenge: L('Spot the hidden toy animal in a nearly dark corridor.', 'اكتشف الدمية المخبّأة في ممرٍّ شبه مظلم.'),
    results: { strong: L('Found it at once — it practically glowed.', 'وجدها فوراً… كأنها كانت تتوهّج.'), partial: L('It found it on the way back.', 'وجدها في طريق العودة.'), none: L('It walked right past it.', 'مرّ بجانبها دون أن يراها.') },
    science: L('Cats have a mirror-like layer behind the eye that bounces light back through it a second time. Pit vipers sense body heat instead of light.', 'للقطط طبقةٌ عاكسة خلف العين تُعيد الضوء عبرها مرّةً ثانية. أمّا الأفاعي ذات الحفر فتستشعر حرارة الأجسام بدلاً من الضوء.'),
    realIn: L('Cats, owls, pit vipers', 'القطط، والبوم، والأفاعي ذات الحفر'), inStory: L('Reveals details in dark rooms, caves and the deep sea.', 'تكشف التفاصيل في الغرف المظلمة والكهوف وأعماق البحر.') },
  { id: 'camo', icon: '🫥', plate: 'reef-octopus-den', caps: ['camouflage', 'ink', 'mimic'], stat: 'stealth',
    title: L('Hide-and-seek', 'لعبة الاختباء'), challenge: L('Stay hidden while the lab drone searches the room.', 'ابقَ مختبئاً بينما تفتّش طائرة المختبر الصغيرة الغرفة.'),
    results: { strong: L('The drone flew past three times and saw nothing.', 'مرّت الطائرة ثلاث مرّات ولم ترَ شيئاً.'), partial: L('Spotted on the last pass — almost!', 'اكتُشف في المرور الأخير… كاد ينجح!'), none: L('Found in five seconds.', 'اكتُشف في خمس ثوانٍ.') },
    science: L('Octopuses have colour cells in their skin that open and close in a fraction of a second, so they can match the rocks around them.', 'في جلد الأخطبوط خلايا لونية تنفتح وتنغلق في جزءٍ من الثانية، فيطابق لون الصخور من حوله.'),
    realIn: L('Octopuses, cuttlefish, chameleons', 'الأخطبوط، والحبّار، والحرباء'), inStory: L('Lets you slip past danger and watch animals unseen.', 'تتيح المرور بجوار الخطر ومراقبة الحيوانات دون أن تراك.') },
  { id: 'signal', icon: '📡', plate: 'forest-silent-birds', caps: ['scent', 'motionSense'], stat: 'intellect',
    title: L('The hidden signal', 'الإشارة الخفيّة'), challenge: L('Which of four closed boxes holds the moving, smelly sample?', 'أيّ الصناديق الأربعة المغلقة يحوي العيّنة المتحرّكة ذات الرائحة؟'),
    results: { strong: L('Right box, first try.', 'الصندوق الصحيح من المحاولة الأولى.'), partial: L('Right box on the second guess.', 'الصندوق الصحيح في التخمين الثاني.'), none: L('A guess — and a wrong one.', 'تخمين… وكان خاطئاً.') },
    science: L('Fish feel tiny movements in the water with a line of sensors along their sides. Dogs have hundreds of millions of smell receptors.', 'تشعر الأسماك بأدقّ حركات الماء بخطٍّ من المستشعرات على جانبيها، وفي أنف الكلب مئات الملايين من مستقبلات الشمّ.'),
    realIn: L('Fish, sharks, dogs, moths', 'الأسماك، وأسماك القرش، والكلاب، والعثّ'), inStory: L('Picks up trails, hidden animals and coming danger.', 'تلتقط الآثار والحيوانات المختبئة والخطر القادم.') },
];

export function runExperiment(x: Experiment, d: DerivedCreature): { result: LabResult; via: string | null } {
  const part = Object.values(d.parts).find((p) => p.caps?.some((c) => x.caps.includes(c)));
  if (part) return { result: 'strong', via: part.id };
  return { result: d.stats[x.stat] >= 3 ? 'partial' : 'none', via: null };
}
