// Hidden encounters: rare, mysterious creatures that appear only under special conditions — the right place AND a
// creature whose senses or body could notice them. Some are pure fantasy, some are inspired by world folklore
// (griffin, basilisk, kraken…), and a few are REAL animals so strange they feel legendary. They never change the
// outcome of a scene: they are a glimpse, an entry in the journal and a story to tell.
// A creature only appears in the game once its painted specimen plate has passed art review (see availableRare).
import type { BiomeId, Capability, L10n } from '../engine/types';
import PLATES from './plates.json';

const L = (en: string, ar: string): L10n => ({ en, ar });
export type RareKind = 'real' | 'fantasy' | 'myth';
export interface RareCreature {
  id: string; kind: RareKind; name: L10n; biomes: BiomeId[];
  /** The player's creature needs at least one of these to notice it. */
  notice: Capability[];
  glimpse: L10n;
  /** The real biology the idea echoes (shown in the journal, clearly marked). */
  echo: L10n;
}
const R = (id: string, kind: RareKind, biomes: BiomeId[], notice: Capability[], name: L10n, glimpse: L10n, echo: L10n): RareCreature => ({ id, kind, name, biomes, notice, glimpse, echo });

export const RARE: RareCreature[] = [
  R('mist-stag', 'fantasy', ['forest', 'mountain'], ['scent', 'nightVision', 'motionSense'], L('Mist Stag', 'أيّل الضباب'),
    L('Between the trees, a pale stag stands wrapped in mist. When the team blinks, only the mist is left.', 'بين الأشجار يقف أيّلٌ شاحب ملفوف بالضباب، وحين يرمش الفريق لا يبقى إلا الضباب.'),
    L('Real deer can stand perfectly still for minutes, trusting camouflage before running.', 'تستطيع الأيائل الحقيقية أن تتجمّد في مكانها دقائق، معتمدةً على التمويه قبل أن تهرب.')),
  R('stoneback-fox', 'fantasy', ['mountain'], ['scent', 'heatSense', 'motionSense'], L('Stoneback Fox', 'ثعلب الظهر الحجري'),
    L('A rock on the ledge stands up, shakes off its lichen and trots away. It was a fox with a back of stone plates.', 'تنهض صخرةٌ على الحافّة، وتنفض عنها الأشنات وتمضي مبتعدة؛ لقد كانت ثعلباً ظهره صفائح حجرية.'),
    L('Pangolins and armadillos really do wear armour made of scales or bony plates.', 'آكل النمل الحرشفي والمدرّع يرتديان فعلاً درعاً من الحراشف أو الصفائح العظمية.')),
  R('moss-wolf', 'fantasy', ['forest', 'swamp'], ['scent', 'nightVision'], L('Moss Wolf', 'ذئب الطحالب'),
    L('Green eyes watch from a bank of moss. Then the moss moves: a lean wolf, ferns growing along its back.', 'تراقبكم عينان خضراوان من كومة طحالب، ثم تتحرّك الكومة نفسها: ذئب نحيل تنمو السراخس على ظهره.'),
    L('Sloths grow algae in their fur, which helps them hide in the canopy.', 'تنمو الطحالب في فرو حيوان الكسلان، فتساعده على الاختباء بين أغصان الغابة.')),
  R('crystal-beetle', 'fantasy', ['cave'], ['nightVision', 'echolocation', 'glow'], L('Crystal Beetle', 'الخنفساء البلّورية'),
    L('A faint blue light crawls across the cave wall — a beetle whose shell looks cut from crystal.', 'يزحف ضوءٌ أزرق خافت على جدار الكهف؛ خنفساءُ تبدو قشرتها كأنها نُحتت من البلّور.'),
    L('Some real beetles have shells that shine like metal because of microscopic layers that reflect light.', 'لبعض الخنافس الحقيقية قشور تلمع كالمعدن بفضل طبقات مجهرية تعكس الضوء.')),
  R('ember-moth', 'fantasy', ['desert'], ['nightVision', 'heatSense'], L('Ember Moth', 'عثّة الجمر'),
    L('Sparks drift over the dunes — no, wings. A moth glowing like embers circles the lantern once and is gone.', 'تتطاير شرارات فوق الكثبان… بل أجنحة! عثّةٌ تتوهّج كالجمر تدور حول الفانوس مرةً ثم تختفي.'),
    L('Many moths navigate at night, and bright lamps confuse them.', 'تهتدي كثير من العث في الليل، والمصابيح الساطعة تُربكها.')),
  R('moon-moth', 'real', ['forest'], ['nightVision', 'scent'], L('Giant Moon Moth', 'عثّة القمر العملاقة'),
    L('A huge pale-green moth with long trailing tails glides past the team’s faces like a paper lantern.', 'تمرّ عثّة خضراء شاحبة ضخمة بذيول طويلة أمام وجوه الفريق كأنها فانوس من ورق.'),
    L('Luna moths are real; their long tail streamers can confuse the sonar of hunting bats.', 'عثّة القمر حقيقية، وذيولها الطويلة تربك موجات السونار عند الخفافيش الصيّادة.')),
  R('cave-salamander', 'fantasy', ['cave'], ['echolocation', 'nightVision', 'motionSense'], L('Glowing Cave Salamander', 'سمندل الكهف المضيء'),
    L('In a still pool, a long pale salamander glows with rows of blue dots, then slides under a rock.', 'في بركة ساكنة يتوهّج سمندلٌ طويل شاحب بصفوف من النقاط الزرقاء، ثم ينزلق تحت صخرة.'),
    L('The real olm salamander lives in dark caves, is nearly blind and can live for about a century.', 'يعيش سمندل «الأولم» الحقيقي في الكهوف المظلمة، وهو شبه أعمى، وقد يعيش نحو قرن من الزمن.')),
  R('cavern-hound', 'fantasy', ['cave'], ['scent', 'echolocation'], L('Blind Cavern Hound', 'كلب الكهوف الأعمى'),
    L('Something sniffs in the dark — a pale, eyeless hound with enormous ears. It listens, decides you are harmless, and leaves.', 'شيءٌ يتشمّم في الظلام: كلبٌ شاحب بلا عينين وبأذنين هائلتين، يُصغي قليلاً ثم يقرّر أنكم غير مؤذين فيرحل.'),
    L('Cave animals often lose their eyes over generations and rely on touch, smell and hearing.', 'كثيراً ما تفقد حيوانات الكهوف عيونها عبر الأجيال، وتعتمد على اللمس والشمّ والسمع.')),
  R('horned-hare', 'myth', ['desert', 'forest'], ['scent', 'motionSense', 'jump'], L('Horned Hare', 'الأرنب ذو القرنين'),
    L('A hare with a small pair of antlers pops out of a burrow, stares, and bounds away. Did everyone see that?', 'يقفز من الجحر أرنبٌ له قرنان متفرّعان صغيران كقرون الأيائل، يحدّق لحظة ثم يثب مبتعداً. هل رأى الجميع ذلك؟'),
    L('Folk tales of the horned “jackalope” may come from real rabbits with a virus that causes horn-like growths.', 'ربما نشأت حكايات الأرنب ذي القرنين من أرانب حقيقية أصابها فيروس يسبّب نتوءات تشبه القرون.')),
  R('snowhorn-hare', 'fantasy', ['snow'], ['scent', 'insulated', 'motionSense'], L('Snowhorn Hare', 'أرنب الثلج ذو القرون'),
    L('A white hare with frosted spiral horns watches from a drift, its breath steaming, then vanishes into the white.', 'يراقبكم من كومة ثلج أرنبٌ أبيض بقرنين لولبيين مغطّيين بالصقيع، ثم يذوب في البياض.'),
    L('Arctic hares turn white in winter for camouflage and brown again in summer.', 'تكتسي الأرانب القطبية باللون الأبيض شتاءً للتمويه، ثم تعود بنّية في الصيف.')),
  R('frost-owl', 'fantasy', ['snow', 'mountain'], ['nightVision', 'motionSense'], L('Frost Owl', 'بومة الصقيع'),
    L('A silent white shape lands above you. Frost glitters on its feathers; its eyes are pale blue.', 'يحطّ فوقكم شكلٌ أبيض بلا صوت، يلمع الصقيع على ريشه، وعيناه زرقاوان شاحبتان.'),
    L('Owls fly almost silently thanks to soft, comb-edged feathers.', 'تطير البوم بصمتٍ شبه تام بفضل ريش ناعم حوافّه كالمشط.')),
  R('swamp-lurker', 'fantasy', ['swamp'], ['heatSense', 'motionSense', 'swim'], L('Swamp Lurker', 'متربّص المستنقع'),
    L('Two eyes rise above the duckweed, each as big as a fist. They watch {name} for a long moment, then sink.', 'ترتفع فوق عدس الماء عينان بحجم القبضة، تراقبان {name} طويلاً ثم تغوصان.'),
    L('The Chinese giant salamander, a real amphibian, can grow longer than a person.', 'قد يزيد طول السمندل الصيني العملاق، وهو برمائي حقيقي، على طول إنسان.')),
  R('reed-mimic', 'fantasy', ['swamp'], ['motionSense', 'scent'], L('Reed Mimic', 'محاكي القصب'),
    L('One of the reeds blinks. A creature thin as a stalk, perfectly disguised, steps slowly out of the water.', 'إحدى أعواد القصب ترمش! كائنٌ نحيل كالعود، متخفٍّ ببراعة، يخطو ببطء خارج الماء.'),
    L('Stick insects and some herons hide by looking exactly like plants.', 'تختبئ الحشرات العصوية وبعض مالك الحزين بأن تشبه النباتات تماماً.')),
  R('dune-basilisk', 'myth', ['desert', 'ruins'], ['heatSense', 'motionSense'], L('Crowned Dune Lizard', 'سحلية الكثبان المتوّجة'),
    L('On a sun-baked stone, a lizard with a crown of spines raises its frill and stares. Nobody looks away first.', 'على حجرٍ ساخن تنصب سحليةٌ ذات تاجٍ من الأشواك عُرفَها وتحدّق، ولا أحد يجرؤ على إبعاد نظره أولاً.'),
    L('The basilisk legend is a fantasy; real frilled and horned lizards use bluff displays to scare enemies.', 'أسطورة «الباسيليسك» خيال، لكن السحالي ذات العُرف والقرون تستعمل فعلاً عروض التهديد لإخافة أعدائها.')),
  R('sand-manticore', 'myth', ['desert'], ['heatSense', 'scent', 'nightVision'], L('Sand Manticore', 'المانتيكور الرملي'),
    L('Far off on a ridge, a maned shape with a curled tail is outlined against the moon. Then the wind lifts the sand and it is gone.', 'في البعيد، على حافّة كثيب، يرتسم أمام القمر شكلٌ ذو لبدة وذيلٍ ملتفّ، ثم يرفع الريح الرمل فيختفي.'),
    L('The manticore is a myth; real deserts do hold big cats like the caracal and stinging scorpions.', 'المانتيكور أسطورة، لكن الصحارى الحقيقية تضمّ قططاً كبيرة كالوشق الصحراوي، وعقارب لاسعة.')),
  R('griffin-eagle', 'myth', ['mountain'], ['fly', 'glide', 'motionSense'], L('Griffin Eagle', 'نسر الغريفين'),
    L('A shadow crosses the cliff: an eagle so large its body looks almost like a lion’s. It circles once and climbs out of sight.', 'يعبر ظلٌّ على الجرف: نسرٌ بالغ الضخامة حتى يكاد جسده يشبه جسد أسد، يحوم مرةً ثم يرتفع حتى يغيب.'),
    L('Griffin stories may have grown from fossils of beaked dinosaurs found by ancient travellers.', 'ربما نشأت حكايات الغريفين من أحافير ديناصورات ذات مناقير عثر عليها مسافرون قدماء.')),
  R('dawn-firebird', 'myth', ['desert', 'mountain'], ['nightVision', 'heatSense', 'fly'], L('Dawn Firebird', 'طائر الفجر الناري'),
    L('At first light a long-tailed bird bursts from the rocks, its feathers flashing red and gold like flame.', 'مع أول ضوء ينطلق من بين الصخور طائرٌ طويل الذيل، يلمع ريشه أحمرَ وذهبياً كاللهب.'),
    L('The phoenix is a legend; many real birds get their shimmer from feather structures, not pigment.', 'العنقاء أسطورة، لكن كثيراً من الطيور الحقيقية تستمدّ بريقها من بنية الريش لا من الأصباغ.')),
  R('root-serpent', 'fantasy', ['forest', 'ruins'], ['heatSense', 'scent'], L('Root Serpent', 'أفعى الجذور'),
    L('A tangle of roots slowly uncoils and slides away. It was never roots at all.', 'تنفكّ كتلةٌ من الجذور ببطء وتنساب مبتعدة؛ لم تكن جذوراً قطّ.'),
    L('Many real snakes hide by matching bark, leaves and roots.', 'تختبئ كثير من الأفاعي الحقيقية بمشابهة لحاء الشجر والأوراق والجذور.')),
  R('lantern-whale', 'fantasy', ['openSea', 'twilight'], ['swim', 'nightVision', 'echolocation'], L('Lantern Whale', 'حوت الفوانيس'),
    L('Below the boat, a whale-shaped line of lights passes slowly, like a city drifting through the water.', 'تحت القارب يمرّ ببطء صفٌّ من الأضواء على هيئة حوت، كأنه مدينة تنجرف في الماء.'),
    L('No whale glows, but lanternfish and many deep-sea animals make their own light.', 'لا يوجد حوت يضيء، لكن أسماك الفانوس وكثيراً من حيوانات الأعماق تصنع ضوءها بنفسها.')),
  R('abyssal-ray', 'fantasy', ['midnight', 'trench'], ['echolocation', 'pressure', 'motionSense'], L('Abyssal Ray', 'شفنين الهاوية'),
    L('A shape wider than the submersible glides overhead, its wings dotted with tiny lights like stars.', 'يمرّ فوق الغوّاصة شكلٌ أعرض منها، جناحاه منقّطان بأضواء صغيرة كالنجوم.'),
    L('Real manta rays can be about seven metres across, and some dive deeper than a kilometre.', 'قد يبلغ عرض الشفنين العملاق الحقيقي نحو سبعة أمتار، وبعضه يغوص أعمق من كيلومتر.')),
  R('ghost-jelly', 'fantasy', ['twilight', 'midnight'], ['nightVision', 'motionSense', 'glow'], L('Ghost Jellyfish', 'قنديل البحر الشبح'),
    L('A curtain of faint violet light drifts past — a jellyfish so large its veils trail out of sight.', 'تنجرف ستارةٌ من ضوء بنفسجي خافت؛ قنديل بحرٍ هائل تمتدّ أذياله حتى تغيب عن النظر.'),
    L('The real giant phantom jelly has arms that can reach about ten metres long.', 'لقنديل البحر الشبحي العملاق الحقيقي أذرع قد يصل طولها إلى نحو عشرة أمتار.')),
  R('coral-stag', 'fantasy', ['reef'], ['swim', 'scent', 'camouflage'], L('Coral Stag', 'أيّل المرجان'),
    L('A deer-shaped creature with antlers of living coral swims slowly between the reef heads.', 'يسبح ببطء بين رؤوس الشعاب كائنٌ على هيئة أيّل، قرونه من مرجانٍ حيّ.'),
    L('Corals are animals: each coral head is a colony of tiny polyps.', 'المرجان حيوانات؛ فكل كتلة مرجانية مستعمرة من سلائل صغيرة.')),
  R('kelp-serpent', 'fantasy', ['seagrass', 'reef'], ['swim', 'motionSense', 'camouflage'], L('Kelp Serpent', 'ثعبان الأعشاب البحرية'),
    L('The seaweed ripples against the current. A long serpent with leaf-like fins is swimming through it.', 'تتموّج الأعشاب البحرية عكس التيار؛ ثعبانٌ طويل بزعانف تشبه الأوراق يسبح بينها.'),
    L('The leafy sea dragon, a real relative of seahorses, looks just like drifting seaweed.', 'يبدو تنّين البحر الورقي، وهو قريب حقيقي لحصان البحر، تماماً كعشب بحري منجرف.')),
  R('trench-watcher', 'fantasy', ['trench'], ['pressure', 'nightVision', 'glow'], L('Trench Watcher', 'رقيب الخندق'),
    L('One huge glowing eye opens in the dark beyond the lights. It blinks slowly, as if taking notes on you.', 'تنفتح في الظلام وراء الأضواء عينٌ واحدة هائلة متوهّجة، وترمش ببطء كأنها تدوّن ملاحظاتها عنكم.'),
    L('The colossal squid has the largest eyes known in the animal kingdom — about the size of a football.', 'للحبّار الهائل أكبر عيون معروفة في المملكة الحيوانية، بحجم كرة القدم تقريباً.')),
  R('mirror-eel', 'fantasy', ['midnight', 'twilight'], ['nightVision', 'motionSense'], L('Mirror Eel', 'ثعبان البحر المرآة'),
    L('A silver eel slides past, its mirror scales reflecting the submersible’s lights back at you.', 'ينساب ثعبان بحر فضّي، وتعكس حراشفه المرآتية أضواء الغوّاصة نحوكم.'),
    L('Many open-ocean fish use mirror-like silver scales to vanish in the water.', 'تستعمل كثير من أسماك المحيط المفتوح حراشف فضّية كالمرآة لتختفي في الماء.')),
  R('phantom-nautilus', 'fantasy', ['twilight'], ['swim', 'nightVision', 'glow'], L('Phantom Nautilus', 'النوتي الشبح'),
    L('A spiral shell glowing from within drifts upwards, trailing dozens of thin tentacles.', 'تصعد قوقعةٌ لولبية تتوهّج من داخلها، تجرّ خلفها عشرات المجسّات الرفيعة.'),
    L('The real nautilus controls its depth by changing the gas and liquid inside its shell.', 'يتحكّم النوتي الحقيقي في عمقه بتغيير الغاز والسائل داخل قوقعته.')),
  R('vent-guardian', 'fantasy', ['vents'], ['heatSense', 'pressure', 'armor'], L('Vent Guardian', 'حارس الفوهة'),
    L('Beside a smoking vent, a crab the size of a table raises one heat-red claw — then goes back to grazing.', 'بجوار فوهةٍ يتصاعد دخانها يرفع سلطعونٌ بحجم طاولة مِخلباً أحمر من الحرارة، ثم يعود إلى رعيه.'),
    L('The real “Yeti crab” farms bacteria on the hairs of its claws near hydrothermal vents.', 'يزرع سلطعون «اليتي» الحقيقي البكتيريا على شعيرات مخالبه قرب الفوهات الحرارية.')),
  R('glow-seahare', 'fantasy', ['reef', 'seagrass'], ['nightVision', 'scent', 'glow'], L('Glowing Sea Hare', 'أرنب البحر المضيء'),
    L('A soft sea slug with frilly turquoise edges glows gently on a rock, unbothered by everything.', 'تتوهّج بهدوء على صخرة رخويةٌ بحرية ذات حوافٍّ فيروزية متموّجة، غير مكترثة بأي شيء.'),
    L('Real sea hares release purple ink to confuse predators.', 'تطلق أرانب البحر الحقيقية حبراً بنفسجياً لإرباك المفترسين.')),
  R('kraken-squid', 'myth', ['midnight', 'trench'], ['echolocation', 'pressure', 'nightVision'], L('Kraken-like Giant Squid', 'الحبّار العملاق الشبيه بالكراكن'),
    L('At the edge of the lights an arm wider than a door curls past, then a second. The rest stays in the dark.', 'على حافّة الضوء يلتفّ ذراعٌ أعرض من باب، ثم ذراعٌ ثانية، ويبقى الباقي في الظلام.'),
    L('The kraken is a sailors’ legend, but giant squid are real and were first filmed alive in 2004.', 'الكراكن أسطورة بحّارة، لكن الحبّار العملاق حقيقي، وصُوِّر حيّاً لأول مرة عام ٢٠٠٤.')),
  R('sea-serpent', 'myth', ['openSea', 'twilight'], ['swim', 'motionSense'], L('Silver Sea Serpent', 'ثعبان البحر الفضّي'),
    L('A ribbon of silver as long as the boat arches through the waves, a red crest flashing, and dives.', 'يقوّس شريطٌ فضّي بطول القارب ظهره بين الأمواج، ويلمع عُرفه الأحمر، ثم يغوص.'),
    L('The real oarfish can grow longer than eight metres and may be behind many sea-serpent tales.', 'قد يزيد طول سمكة المجداف الحقيقية على ثمانية أمتار، وربما تقف وراء كثير من حكايات ثعابين البحر.')),
  R('kelpie-seahorse', 'myth', ['seagrass'], ['swim', 'camouflage', 'scent'], L('Kelpie Seahorse', 'حصان البحر الكلبي'),
    L('A seahorse as big as a dog rises from the meadow, its mane of seaweed waving, and studies {name}.', 'ينهض من مرج الأعشاب حصانُ بحرٍ بحجم كلب، تتماوج لبدته العشبية، ويتأمّل {name}.'),
    L('Kelpies are folklore water horses; in real seahorses, the father carries the eggs in a pouch.', 'الكلبي حصان ماء من الحكايات الشعبية؛ أما في أحصنة البحر الحقيقية فالأب هو من يحمل البيض في جيبه.')),
  R('coelacanth', 'real', ['twilight', 'midnight'], ['swim', 'nightVision', 'pressure'], L('Coelacanth', 'السمكة الأثرية (السيلاكانث)'),
    L('A heavy blue fish with white spots hangs in the water on fleshy, leg-like fins. It looks older than the dinosaurs.', 'تتوقّف في الماء سمكةٌ زرقاء ثقيلة بنقاط بيضاء على زعانف لحمية تشبه الأرجل، تبدو أقدم من الديناصورات.'),
    L('Coelacanths were thought extinct for 66 million years until one was caught alive in 1938.', 'كان يُظنّ أن السيلاكانث انقرض منذ ٦٦ مليون سنة، حتى اصطيدت واحدة حيّة عام ١٩٣٨.')),
];
export const RARE_BY_ID: Record<string, RareCreature> = Object.fromEntries(RARE.map((r) => [r.id, r]));
export const rareArt = (id: string) => `specimen-rare-${id}`;
const PLATE_IDS = new Set((PLATES as { id: string }[]).map((p) => p.id));
/** Only creatures whose art passed review can be met. */
export const availableRare = (): RareCreature[] => RARE.filter((r) => PLATE_IDS.has(rareArt(r.id)));
