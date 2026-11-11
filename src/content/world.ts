import type { BiomeId, L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

/** A living thing the story names via {predator}/{critter}: the phrase is narration, `animal` is its bestiary id (so the UI can show it). */
export interface StoryAnimal extends L10n { animal: string }
const A = (en: string, ar: string, animal: string): StoryAnimal => ({ en, ar, animal });

export interface Biome {
  id: BiomeId;
  name: L10n;
  /** Arabic: indefinite noun phrases of either gender — beat text never makes a verb or adjective agree with them. */
  obstacles: L10n[];
  predators: StoryAnimal[];
  critters: StoryAnimal[];
  /** True when the action happens underwater (no flying, climbing or digging). */
  wet: boolean;
}

export const BIOMES: Record<BiomeId, Biome> = {
  lab: { id: 'lab', name: L('the BSC Lab', 'مختبر النادي'), wet: false,
    obstacles: [L('a toppled shelf of glassware', 'رفّ من الزجاجيات المقلوبة'), L('a jammed autoclave door', 'باب جهاز تعقيم عالق')],
    predators: [A('an escaped glow frog with a temper', 'ضفدع مضيء هارب سريع الغضب', 'glow-frog')],
    critters: [A('a lab hamster wedged behind the fridge', 'هامستر مختبر محشور خلف الثلاجة', 'hamster'), A('an axolotl in a cracked tank', 'أكسولوتل في حوض مشقوق', 'axolotl')] },
  forest: { id: 'forest', name: L('the Whispering Forest', 'الغابة الهامسة'), wet: false,
    obstacles: [L('a ravine choked with thorny vines', 'واد تسدّه أغصان شائكة'), L('a fallen giant tree', 'شجرة عملاقة ساقطة'), L('a river of fast brown water', 'نهر بنيّ سريع الجريان')],
    predators: [A('a hungry lynx', 'وشق جائع', 'lynx'), A('a curious brown bear', 'دبّ بنيّ فضولي', 'brown-bear'), A('a wild boar with a short temper', 'خنزير بريّ سريع الغضب', 'wild-boar'), A('an eagle-owl watching from a branch', 'بوم نسريّ يراقب من غصن', 'eagle-owl')],
    critters: [A('a baby owl tangled in fishing line', 'فرخ بوم عالق في خيط صيد', 'owl'), A('a roe deer caught in a fence', 'ظبي أوروبيّ عالق في سياج', 'roe-deer'), A('a hedgehog stuck in a tin can', 'قنفذ عالق في علبة معدنية', 'hedgehog'), A('a pangolin curled up in a poacher’s snare', 'آكل نمل حرشفيّ ملتفّ في فخّ صيّاد', 'pangolin')] },
  desert: { id: 'desert', name: L('the Shifting Desert', 'الصحراء المتحركة'), wet: false,
    obstacles: [L('a field of soft, sliding dunes', 'حقل من الكثبان الناعمة الزاحفة'), L('a sun-baked salt flat', 'سبخة مالحة تلفحها الشمس'), L('a deep dry wadi', 'واد جافّ عميق')],
    predators: [A('a desert monitor lizard', 'ورل صحراوي', 'desert-monitor'), A('a circling saker falcon', 'صقر حرّ يحوم', 'saker-falcon'), A('a deathstalker scorpion', 'عقرب صفراء قاتلة', 'scorpion'), A('a horned viper half-buried in sand', 'أفعى قرناء نصف مدفونة في الرمل', 'horned-viper')],
    critters: [A('a jerboa stuck in a plastic bag', 'جربوع عالق في كيس بلاستيكي', 'jerboa'), A('a thirsty spiny-tailed lizard', 'ضبّ عطشان', 'dhub'), A('a lost fennec fox kit', 'جرو فنك تائه', 'fennec'), A('a darkling beetle trapped in a bottle', 'خنفساء صحراء محبوسة في زجاجة', 'scarab')] },
  mountain: { id: 'mountain', name: L('the Jagged Mountains', 'الجبال المسنّنة'), wet: false,
    obstacles: [L('a sheer cliff face', 'جرف عمودي'), L('a rope bridge with missing planks', 'جسر من الحبال ينقصه بعض الألواح'), L('a loose scree slope', 'منحدر من الحصى المنزلق')],
    predators: [A('a golden eagle', 'عقاب ذهبي', 'eagle'), A('a mountain wolf', 'ذئب جبلي', 'mountain-wolf'), A('an Arabian leopard on a ledge', 'نمر عربيّ على حافة صخرية', 'arabian-leopard')],
    critters: [A('an ibex kid stranded on a ledge', 'صغير وعل عالق على حافة', 'ibex'), A('a pika with a hurt paw', 'بيكا مجروحة القدم', 'pika'), A('a rock hyrax wedged between boulders', 'وبر صخريّ محشور بين الصخور', 'rock-hyrax')] },
  cave: { id: 'cave', name: L('the Echo Caves', 'كهوف الصدى'), wet: false,
    obstacles: [L('a flooded tunnel', 'نفق غمرته المياه'), L('a pit with no visible bottom', 'حفرة لا يرى لها قاع'), L('a squeeze between crystals', 'ممرّ ضيّق بين البلّورات')],
    predators: [A('a giant cave centipede', 'حريش كهوف عملاق', 'cave-centipede'), A('a swarm of startled bats', 'سرب من الخفافيش المذعورة', 'bat'), A('a huntsman spider the size of a hand', 'عنكبوت صيّاد بحجم الكف', 'huntsman-spider')],
    critters: [A('a blind cave fish in a drying puddle', 'سمكة كهف عمياء في بركة تجفّ', 'cavefish'), A('a lost bat pup', 'صغير خفّاش تائه', 'bat'), A('a pale olm stranded on wet rock', 'سمندل كهفيّ شاحب عالق على صخرة رطبة', 'olm')] },
  snow: { id: 'snow', name: L('the Frozen Plains', 'السهول الجليدية'), wet: false,
    obstacles: [L('a cracking frozen lake', 'بحيرة متجمدة تتشقق'), L('a wall of drifted snow', 'جدار من الثلج المتراكم'), L('an ice crevasse', 'شقّ جليدي')],
    predators: [A('a polar bear', 'دبّ قطبي', 'polar-bear'), A('a snowy owl', 'بوم ثلجي', 'snowy-owl'), A('an arctic fox on the hunt', 'ثعلب قطبيّ يصطاد', 'arctic-fox'), A('a lone wolf on the ridge', 'ذئب وحيد على التل', 'mountain-wolf')],
    critters: [A('an arctic hare caught in ice', 'أرنب قطبيّ عالق في الجليد', 'arctic-hare'), A('a lemming family under a drift', 'عائلة من قوارض الليمينغ تحت كومة ثلج', 'lemming'), A('a wood frog frozen in the moss', 'ضفدع غابة متجمّد بين الطحالب', 'wood-frog')] },
  swamp: { id: 'swamp', name: L('the Bubbling Swamp', 'المستنقع الفوّار'), wet: false,
    obstacles: [L('sucking black mud', 'طين أسود يبتلع الأقدام'), L('a channel full of tangled roots', 'قناة مليئة بالجذور المتشابكة'), L('a bog that burps methane', 'مستنقع يطلق فقاعات الميثان')],
    predators: [A('a lurking crocodile', 'تمساح كامن', 'crocodile'), A('a hungry grey heron', 'بلشون رماديّ جائع', 'grey-heron'), A('a snapping turtle hidden in the weeds', 'سلحفاة قاضمة مختبئة بين الأعشاب', 'snapping-turtle')],
    critters: [A('a turtle flipped on its back', 'سلحفاة مقلوبة على ظهرها', 'pond-turtle'), A('a marsh frog on a sinking log', 'ضفدع مستنقع على جذع يغرق', 'marsh-frog'), A('a water vole cut off by the flood', 'فأر ماء حاصرته المياه', 'water-vole')] },
  ruins: { id: 'ruins', name: L('the Abandoned Field Lab', 'المختبر الميداني المهجور'), wet: false,
    obstacles: [L('a sealed blast door', 'باب حماية مغلق بإحكام'), L('a corridor of flickering lasers', 'ممرّ من أشعة الليزر المتقطعة'), L('a collapsed staircase', 'درج منهار')],
    predators: [A('a rat snake coiled in the cables', 'ثعبان فئران ملتفّ بين الأسلاك', 'rat-snake'), A('a barn owl guarding its rafters', 'بومة حظائر تحرس عوارض السقف', 'barn-owl')],
    critters: [A('a hamster stuck in a vent', 'هامستر عالق في فتحة تهوية', 'hamster'), A('an axolotl left in a forgotten tank', 'أكسولوتل منسيّ في حوض قديم', 'axolotl')] },

  reef: { id: 'reef', name: L('the Coral Reef of Kubbar Island', 'الشعاب المرجانية قرب جزيرة كبّر'), wet: true,
    obstacles: [L('a maze of fire coral', 'متاهة من المرجان الناري'), L('a strong current through the reef gap', 'تيار قويّ في فجوة الشعاب')],
    predators: [A('a reef shark on patrol', 'قرش شعاب في جولة حراسة', 'reef-shark'), A('a moray eel', 'ثعبان موراي', 'moray-eel'), A('a lionfish fanning its spines', 'سمكة أسد تنشر أشواكها', 'lionfish')],
    critters: [A('a sea turtle tangled in a ghost net', 'سلحفاة بحرية عالقة في شبكة مهجورة', 'sea-turtle'), A('a clownfish chased from its anemone', 'سمكة مهرّج طردت من شقائق النعمان', 'clownfish'), A('a parrotfish caught on a fishing hook', 'سمكة ببغاء عالقة في صنّارة', 'parrotfish')] },
  mudflat: { id: 'mudflat', name: L('the Muddy Shore', 'الشاطئ الطيني'), wet: false,
    obstacles: [L('knee-deep tidal mud', 'طين مدّ وجزر يبلغ الركبة'), L('a fast-rising tide', 'مدّ يرتفع بسرعة')],
    predators: [A('a crab-plover flock', 'سرب من طيور الحنكور', 'crab-plover'), A('a grey heron', 'بلشون رمادي', 'grey-heron')],
    critters: [A('a mudskipper stranded on a rock', 'نطّاط طين عالق على صخرة', 'mudskipper'), A('a fiddler crab under a plastic bottle', 'سرطان عازف تحت قارورة بلاستيكية', 'fiddler-crab'), A('a flamingo chick tangled in a line', 'فرخ فلامنغو عالق في خيط', 'flamingo')] },
  seagrass: { id: 'seagrass', name: L('the Seagrass Meadows', 'مروج الأعشاب البحرية'), wet: true,
    obstacles: [L('a cloud of stirred-up silt', 'سحابة من الطين الناعم المثار'), L('a fishing net wall', 'جدار من شباك الصيد')],
    predators: [A('a barracuda', 'سمكة باراكودا', 'barracuda'), A('a stingray buried in sand', 'سمكة لخمة مدفونة في الرمل', 'stingray')],
    critters: [A('a dugong calf separated from its mother', 'صغير أطوم ضلّ عن أمه', 'dugong'), A('a seahorse clinging to litter', 'حصان بحر متشبّث بقطعة نفايات', 'seahorse'), A('a green turtle snagged on a rope', 'سلحفاة خضراء عالقة بحبل', 'sea-turtle')] },
  openSea: { id: 'openSea', name: L('the Open Sea', 'البحر المفتوح'), wet: false,
    obstacles: [L('rolling swells', 'أمواج عالية متلاحقة'), L('a sudden squall', 'عاصفة مفاجئة')],
    predators: [A('a tiger shark', 'قرش نمر', 'tiger-shark')],
    critters: [A('a whale shark gliding by', 'قرش حوتيّ يمرّ بهدوء', 'whale-shark'), A('a pod of humpback dolphins', 'قطيع من الدلافين الحدباء', 'dolphin')] },
  twilight: { id: 'twilight', name: L('the Dim Waters', 'المياه المعتمة'), wet: true,
    obstacles: [L('a dense wall of migrating lanternfish', 'جدار كثيف من أسماك الفانوس المهاجرة'), L('a cold thermocline current', 'تيار بارد مفاجئ')],
    predators: [A('a swordfish', 'سمكة أبي سيف', 'swordfish'), A('a Humboldt squid', 'حبّار هومبولت', 'humboldt-squid'), A('a dragonfish with a red searchlight', 'سمكة تنين بكشّاف أحمر', 'dragonfish')],
    critters: [A('a siphonophore chain', 'سلسلة طويلة من كائنات صغيرة متّصلة ببعضها', 'siphonophore'), A('a lost hatchetfish', 'سمكة فأس تائهة', 'hatchetfish'), A('a stray lanternfish', 'سمكة فانوس شاردة', 'lanternfish')] },
  midnight: { id: 'midnight', name: L('the Dark Depths', 'الأعماق المظلمة'), wet: true,
    obstacles: [L('total darkness', 'ظلام تام'), L('a field of drifting jellies', 'حقل من قناديل البحر الهائمة')],
    predators: [A('an anglerfish', 'سمكة أبي الشص', 'anglerfish'), A('a viperfish', 'سمكة أفعى', 'viperfish'), A('a gulper eel', 'ثعبان البلّاع', 'gulper-eel'), A('a dragonfish', 'سمكة تنين', 'dragonfish')],
    critters: [A('a vampire squid', 'حبّار مصّاص الدماء', 'vampire-squid'), A('a dumbo octopus', 'أخطبوط دامبو', 'dumbo-octopus'), A('a deep-sea jelly tangled in debris', 'قنديل أعماق عالق في حطام', 'deep-jellies')] },
  vents: { id: 'vents', name: L('the Hot Springs of the Seabed', 'ينابيع القاع الحارّة'), wet: true,
    obstacles: [L('black smoker chimneys at over 350°C', 'مداخن سوداء تتجاوز حرارتها ٣٥٠ درجة'), L('a shimmering cloud of hot minerals', 'سحابة متلألئة من المعادن الحارة')],
    predators: [A('a swarm of yeti crabs', 'سرب من سرطانات اليتي', 'yeti-crab'), A('a pale vent eelpout', 'سمكة إيلبوت شاحبة', 'eelpout')],
    critters: [A('a field of giant tube worms', 'حقل من الديدان الأنبوبية العملاقة', 'tube-worms'), A('a scaly-foot snail', 'حلزون ذو قدم حرشفية', 'scaly-foot-snail'), A('a Pompeii worm in a cracked tube', 'دودة بومبي في أنبوب مشقوق', 'pompeii-worm')] },
  trench: { id: 'trench', name: L('the Deepest Trench', 'أعمق نقطة في البحر'), wet: true,
    obstacles: [L('crushing pressure', 'ضغط ساحق'), L('a cliff into deeper black', 'جرف يهبط إلى سواد أعمق')],
    predators: [A('something huge moving in the dark', 'شيء ضخم يتحرك في الظلام', 'deep-giant'), A('a ghostly cusk-eel', 'ثعبان أعماق شبحي', 'cusk-eel')],
    critters: [A('a ghostly snailfish', 'سمكة حلزون شفافة', 'snailfish'), A('a giant amphipod', 'قشريّ عملاق', 'amphipod'), A('a sea pig stuck in the silt', 'خنزير بحر عالق في الطين الناعم', 'sea-pig')] },
};

export interface Fact { id: string; text: L10n }

/** Real biology only. Shown in a "Real Science" box, visually separate from the story. */
export const FACTS: Fact[] = [
  { id: 'lab-bsl', text: L('Real labs sort microbes into biosafety levels (BSL-1 to BSL-4) based on risk.', 'تصنّف المختبرات الحقيقية الميكروبات في مستويات للسلامة الحيوية من ١ إلى ٤ بحسب خطورتها.') },
  { id: 'forest-myco', text: L('Fungal networks link tree roots and move water and nutrients between plants.', 'تربط شبكاتُ الفطريات جذورَ الأشجار، وتنقل الماء والمغذيات بين النباتات.') },
  { id: 'desert-heat', text: L('Mitribah in Kuwait recorded 53.9°C in 2016 — one of the hottest reliable temperatures on Earth.', 'سجّلت منطقة المطربة في الكويت ٥٣٫٩ درجة مئوية عام ٢٠١٦، وهي من أعلى درجات الحرارة الموثّقة على الأرض.') },
  { id: 'desert-dew', text: L('Some desert beetles collect drinking water from fog on their bumpy backs.', 'تجمع بعض خنافس الصحراء ماءَ الشرب من الضباب على ظهورها المليئة بالنتوءات.') },
  { id: 'mountain-o2', text: L('Bar-headed geese fly over the Himalayas, where the air has about a third of sea-level oxygen.', 'يطير الإوز مخطّط الرأس فوق جبال الهيمالايا، حيث لا يتجاوز الأكسجين نحو ثلث ما هو عند سطح البحر.') },
  { id: 'cave-troglo', text: L('Many cave animals lose their eyes and colour over generations — they don’t need them in total darkness.', 'تفقد كثير من حيوانات الكهوف عيونها وألوانها عبر الأجيال، لأنها لا تحتاج إليها في الظلام التام.') },
  { id: 'snow-frog', text: L('Wood frogs can survive being partly frozen in winter, then thaw and hop away.', 'يستطيع ضفدع الغابة أن يبقى حيّاً وهو متجمّد جزئياً في الشتاء، ثم يذوب جليده ويقفز مبتعداً.') },
  { id: 'swamp-carbon', text: L('Peat swamps store huge amounts of carbon — protecting them helps the climate.', 'تخزّن مستنقعات الخُثّ كميات هائلة من الكربون، وحمايتها تخدم المناخ.') },
  { id: 'ruins-dna', text: L('DNA can survive for a long time in cold, dry places, which helps scientists study old samples.', 'يمكن أن يصمد الحمض النووي مدة طويلة في الأماكن الباردة الجافة، وهذا يساعد العلماء على دراسة العينات القديمة.') },
  { id: 'reef-heat', text: L('Corals in the Arabian Gulf survive some of the hottest seawater any reef corals live in.', 'يعيش مرجان الخليج العربي في مياهٍ من أشد المياه حرارةً بين كل مواطن الشعاب المرجانية.') },
  { id: 'mud-skipper', text: L('Mudskippers breathe through their skin and the lining of their mouths when out of water.', 'يتنفّس نطّاط الطين عبر جلده وبطانة فمه عندما يكون خارج الماء.') },
  { id: 'seagrass-dugong', text: L('The Arabian Gulf hosts one of the world’s largest dugong populations, which graze on seagrass.', 'يضم الخليج العربي واحداً من أكبر تجمّعات الأطوم في العالم، وهي ترعى الأعشاب البحرية.') },
  { id: 'sea-whaleshark', text: L('Whale sharks are the largest fish alive and feed by filtering plankton.', 'القرش الحوتي أكبر سمكة حيّة، ويتغذّى بترشيح العوالق من الماء.') },
  { id: 'twilight-dvm', text: L('Every night, countless animals swim up from the deep to feed — the largest migration on Earth.', 'في كل ليلة تصعد أعدادٌ لا تُحصى من الكائنات من الأعماق لتتغذّى، وهي أكبر هجرة على وجه الأرض.') },
  { id: 'midnight-light', text: L('Most animals living in the deep ocean can make their own light (bioluminescence).', 'تستطيع معظم الحيوانات التي تعيش في أعماق المحيط أن تصنع ضوءها بنفسها، وهو ما يُسمّى الضيائية الحيوية.') },
  { id: 'vents-chemo', text: L('Hydrothermal vents, discovered in 1977, host life powered by chemicals instead of sunlight.', 'اكتُشفت ينابيع القاع الحارّة (الفتحات الحرارية) عام ١٩٧٧، والحياة فيها تستمد طاقتها من المواد الكيميائية بدلاً من ضوء الشمس.') },
  { id: 'trench-pressure', text: L('Water pressure rises by about one atmosphere every 10 metres you go down.', 'يزداد ضغط الماء نحو ضغطٍ جويٍّ واحد مع كل عشرة أمتار من النزول.') },
  { id: 'squid-eye', text: L('Giant and colossal squids have the largest eyes in the animal kingdom.', 'يمتلك الحبّار العملاق والحبّار الهائل أكبر العيون في المملكة الحيوانية.') },
  { id: 'whalefall', text: L('When a whale dies and sinks, its body can feed deep-sea communities for decades.', 'حين يموت الحوت ويغرق، يمكن أن يغذّي جسده مجتمعات الأعماق عشرات السنين.') },
  { id: 'dragonfish-red', text: L('Some deep-sea dragonfish make red light, which most deep-sea animals cannot see — a secret searchlight for hunting.', 'تُطلق بعض أسماك التنين في الأعماق ضوءاً أحمر لا تراه معظم حيوانات الأعماق، فتصطاد به ككشّافٍ سرّي.') },
  { id: 'viperfish-teeth', text: L('Sloane’s viperfish has fangs so long that they do not fit inside its closed mouth.', 'لسمكة الأفعى «سلون» أنيابٌ طويلة جداً لا يتّسع لها فمها المغلق.') },
  { id: 'angler-lure', text: L('The glowing lure of many deep-sea anglerfish gets its light from bacteria living inside it.', 'يستمد الطُّعم المضيء لكثير من أسماك أبي الشص في الأعماق ضوءه من بكتيريا تعيش داخله.') },
  { id: 'gulper-mouth', text: L('The gulper eel’s enormous mouth can open wide like a net, letting it scoop up prey in a single gulp.', 'ينفتح فم ثعبان البلّاع الضخم على اتساعه كالشبكة، فيلتقط فرائسه بلقمة واحدة.') },
  { id: 'bathysphere-1934', text: L('In 1934, William Beebe and Otis Barton dived to 923 metres off Bermuda inside a steel ball called the Bathysphere, watching deep-sea animals alive in their own world.', 'في عام ١٩٣٤ غاص ويليام بيبي وأوتيس بارتون إلى عمق ٩٢٣ متراً قرب برمودا داخل كرة فولاذية اسمها «الباثيسفير»، وشاهدا حيوانات الأعماق حيّة في عالمها.') },
  { id: 'pearl-history', text: L('Before oil, pearl diving was central to Kuwait’s economy and seafaring life.', 'قبل النفط كان الغوص على اللؤلؤ عماد اقتصاد الكويت وحياتها البحرية.') },
];

export const FACT_BY_ID = Object.fromEntries(FACTS.map((f) => [f.id, f]));

export interface Npc { id: string; name: L10n; role: L10n }
export const NPCS: Npc[] = [
  { id: 'ranger', name: L('Ranger Mariam', 'الحارسة مريم'), role: L('wildlife ranger', 'حارسة للحياة الفطرية') },
  { id: 'rival', name: L('Dr. Vex', 'د. فيكس'), role: L('rival scientist', 'عالِم منافس') },
  { id: 'hermit', name: L('the Beekeeper Hermit', 'النحّال المنعزل'), role: L('mysterious hermit', 'ناسكٌ غامض') },
  { id: 'kid', name: L('Little Salem', 'سالم الصغير'), role: L('a curious kid with a notebook', 'فتى فضولي يحمل دفتراً') },
  { id: 'diver', name: L('Captain Noura', 'الكابتن نورة'), role: L('research diver', 'غوّاصة باحثة') },
  { id: 'sailor', name: L('Bu Fahad the old sailor', 'بو فهد البحّار القديم'), role: L('retired sailor', 'بحّار متقاعد') },
  { id: 'fisher', name: L('Fisherman Yousef', 'الصياد يوسف'), role: L('fisherman', 'صيّاد') },
];
export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n]));
