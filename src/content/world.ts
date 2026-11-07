import type { BiomeId, L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export interface Biome {
  id: BiomeId;
  name: L10n;
  obstacles: L10n[];
  predators: L10n[];
  critters: L10n[];
  /** True when the action happens underwater (no flying, climbing or digging). */
  wet: boolean;
}

export const BIOMES: Record<BiomeId, Biome> = {
  lab: { id: 'lab', name: L('the BSC Lab', 'مختبر النادي'), wet: false,
    obstacles: [L('a toppled shelf of glassware', 'رف زجاجيات طايح'), L('a jammed autoclave door', 'باب جهاز تعقيم عالق')],
    predators: [L('a very angry security guard', 'حارس أمن معصّب')], critters: [L('an escaped lab mouse', 'فأر مختبر هربان')] },
  forest: { id: 'forest', name: L('the Whispering Forest', 'الغابة الهامسة'), wet: false,
    obstacles: [L('a ravine choked with thorny vines', 'وادي مسدود بأغصان شوك'), L('a fallen giant tree', 'شجرة عملاقة طايحة'), L('a river of fast brown water', 'نهر ماي بني سريع')],
    predators: [L('a hungry lynx', 'وشق جوعان'), L('a curious brown bear', 'دب بني فضولي')], critters: [L('a baby owl tangled in fishing line', 'فرخ بومة متشابك بخيط صيد'), L('a deer caught in a fence', 'غزال عالق بسياج')] },
  desert: { id: 'desert', name: L('the Shifting Desert', 'الصحراء المتحركة'), wet: false,
    obstacles: [L('a field of soft, sliding dunes', 'حقل كثبان ناعمة تزحف'), L('a sun-baked salt flat', 'سبخة ملح محروقة بالشمس'), L('a deep dry wadi', 'وادي جاف عميق')],
    predators: [L('a desert monitor lizard', 'ورل صحراوي'), L('a circling falcon', 'صقر يحوم')], critters: [L('a jerboa stuck in a plastic bag', 'جربوع عالق بكيس بلاستيك'), L('a dehydrated spiny-tailed lizard', 'ضب عطشان')] },
  mountain: { id: 'mountain', name: L('the Jagged Mountains', 'الجبال المسنّنة'), wet: false,
    obstacles: [L('a sheer cliff face', 'جرف عمودي'), L('a rope bridge with missing planks', 'جسر حبال ناقصته ألواح'), L('a loose scree slope', 'منحدر حصى ينزلق')],
    predators: [L('a golden eagle', 'عقاب ذهبي'), L('a mountain wolf', 'ذيب جبلي')], critters: [L('an ibex kid on a ledge', 'صغير وعل على حافة'), L('a pika with a hurt paw', 'أرنب صخري رجله مجروحة')] },
  cave: { id: 'cave', name: L('the Echo Caves', 'كهوف الصدى'), wet: false,
    obstacles: [L('a flooded tunnel', 'نفق غرقان'), L('a pit with no visible bottom', 'حفرة ما لها قاع'), L('a squeeze between crystals', 'ممر ضيق بين بلورات')],
    predators: [L('a giant cave centipede', 'حريش كهف عملاق'), L('a swarm of startled bats', 'سرب خفافيش مفزوع')], critters: [L('a blind cave fish in a drying puddle', 'سمكة كهف عمياء بحفرة تنشف'), L('a lost bat pup', 'صغير خفاش ضايع')] },
  snow: { id: 'snow', name: L('the Frozen Tundra', 'التندرا المتجمدة'), wet: false,
    obstacles: [L('a cracking frozen lake', 'بحيرة متجمدة تتشقق'), L('a wall of drifted snow', 'جدار ثلج متراكم'), L('an ice crevasse', 'شق جليدي')],
    predators: [L('a polar bear', 'دب قطبي'), L('a snowy owl', 'بوم ثلجي')], critters: [L('an arctic hare caught in ice', 'أرنب قطبي عالق بالثلج'), L('a lemming family under a drift', 'عائلة ليمينغ تحت الثلج')] },
  swamp: { id: 'swamp', name: L('the Bubbling Swamp', 'المستنقع الفوّار'), wet: false,
    obstacles: [L('sucking black mud', 'طين أسود يسحب'), L('a channel full of tangled roots', 'قناة مليانة جذور متشابكة'), L('a bog that burps methane', 'مستنقع يطلع غاز ميثان')],
    predators: [L('a lurking crocodile', 'تمساح كامن'), L('a hungry heron', 'بلشون جوعان')], critters: [L('a turtle flipped on its back', 'سلحفاة مقلوبة على ظهرها'), L('a frog in a sinking log', 'ضفدع على جذع يغرق')] },
  ruins: { id: 'ruins', name: L('the Abandoned Field Lab', 'المختبر الميداني المهجور'), wet: false,
    obstacles: [L('a sealed blast door', 'باب حماية مقفل'), L('a corridor of flickering lasers', 'ممر ليزر يرمش'), L('a collapsed staircase', 'درج منهار')],
    predators: [L('a malfunctioning security drone', 'درون أمني خربان'), L('a mutated houseplant with an attitude', 'نبات متحوّر شرّاني')], critters: [L('a hamster stuck in a vent', 'هامستر عالق بفتحة تهوية'), L('a test-tube tadpole', 'شرغوف بأنبوب اختبار')] },

  reef: { id: 'reef', name: L('the Coral Reef of Kubbar', 'شعاب كبّر المرجانية'), wet: true,
    obstacles: [L('a maze of fire coral', 'متاهة مرجان ناري'), L('a strong current through the reef gap', 'تيار قوي بين الشعاب')],
    predators: [L('a reef shark on patrol', 'قرش شعاب يدوّر'), L('a moray eel', 'ثعبان موراي')], critters: [L('a sea turtle tangled in a ghost net', 'سلحفاة بحرية متشابكة بشبكة مهجورة'), L('a clownfish chased from its anemone', 'سمكة مهرج مطرودة من بيتها')] },
  mudflat: { id: 'mudflat', name: L('the Sulaibikhat Mudflats', 'سبخات الصليبيخات'), wet: false,
    obstacles: [L('knee-deep tidal mud', 'طين مد وجزر للركبة'), L('a fast-rising tide', 'مد يرتفع بسرعة')],
    predators: [L('a crab-plover flock', 'سرب حنكور'), L('a grey heron', 'بلشون رمادي')], critters: [L('a mudskipper stranded on a rock', 'نطّاط طين عالق على صخرة'), L('a crab under a plastic bottle', 'قبقب تحت قارورة')] },
  seagrass: { id: 'seagrass', name: L('the Seagrass Meadows', 'مروج الأعشاب البحرية'), wet: true,
    obstacles: [L('a cloud of stirred-up silt', 'غيمة طمي'), L('a fishing net wall', 'جدار شباك صيد')],
    predators: [L('a barracuda', 'سمك باراكودا'), L('a stingray buried in sand', 'لخم مدفون بالرمل')], critters: [L('a dugong calf separated from its mother', 'صغير أطوم ضايع عن أمه'), L('a seahorse clinging to litter', 'حصان بحر متعلّق بزبالة')] },
  openSea: { id: 'openSea', name: L('the Open Arabian Sea', 'بحر العرب المفتوح'), wet: false,
    obstacles: [L('rolling swells', 'أمواج عالية'), L('a sudden squall', 'عاصفة مفاجئة')],
    predators: [L('a tiger shark', 'قرش النمر')], critters: [L('a whale shark gliding by', 'قرش حوتي يمر')] },
  twilight: { id: 'twilight', name: L('the Twilight Zone', 'منطقة الشفق'), wet: true,
    obstacles: [L('a dense wall of migrating lanternfish', 'جدار أسماك فانوس مهاجرة'), L('a cold thermocline current', 'تيار بارد عند الطبقة الحرارية')],
    predators: [L('a swordfish', 'أبو سيف'), L('a Humboldt-sized squid', 'حبّار عملاق')], critters: [L('a siphonophore chain', 'مستعمرة سيفونوفور'), L('a lost hatchetfish', 'سمكة فأس ضايعة')] },
  midnight: { id: 'midnight', name: L('the Midnight Zone', 'منطقة منتصف الليل'), wet: true,
    obstacles: [L('total darkness', 'ظلام تام'), L('a field of drifting jellies', 'حقل قناديل بحر')],
    predators: [L('an anglerfish', 'أبو الشص'), L('a viperfish', 'سمك الأفعى')], critters: [L('a vampire squid', 'حبّار مصّاص الدماء'), L('a gulper eel', 'ثعبان البلّاع')] },
  vents: { id: 'vents', name: L('the Hydrothermal Vents', 'الفتحات الحرارية المائية'), wet: true,
    obstacles: [L('black smoker chimneys at over 350°C', 'مداخن سوداء حرارتها فوق ٣٥٠ درجة'), L('a shimmering cloud of hot minerals', 'غيمة معادن حارة')],
    predators: [L('a swarm of vent crabs', 'سرب سرطانات الفتحات')], critters: [L('a field of giant tube worms', 'حقل ديدان أنبوبية عملاقة'), L('a scaly-foot snail', 'حلزون القدم الحرشفية')] },
  trench: { id: 'trench', name: L('the Hadal Trench', 'الخندق السحيق'), wet: true,
    obstacles: [L('crushing pressure', 'ضغط ساحق'), L('a cliff into deeper black', 'جرف ينزل لظلام أعمق')],
    predators: [L('something huge moving in the dark', 'شي ضخم يتحرك بالظلام')], critters: [L('a ghostly snailfish', 'سمكة حلزون شفافة'), L('a giant amphipod', 'قشري عملاق')] },
};

export interface Fact { id: string; text: L10n }

/** Real biology only. Shown in a "Real Science" box, visually separate from the story. */
export const FACTS: Fact[] = [
  { id: 'lab-bsl', text: L('Real labs sort microbes into biosafety levels (BSL-1 to BSL-4) based on risk.', 'المختبرات الحقيقية تصنّف الميكروبات بمستويات أمان حيوي من ١ إلى ٤ حسب الخطورة.') },
  { id: 'forest-myco', text: L('Fungal networks link tree roots and move water and nutrients between plants.', 'شبكات الفطريات تربط جذور الأشجار وتنقل الماي والمغذيات بين النباتات.') },
  { id: 'desert-heat', text: L('Mitribah in Kuwait recorded 53.9°C in 2016 — one of the hottest reliable temperatures on Earth.', 'المطربة في الكويت سجّلت ٥٣٫٩ درجة سنة ٢٠١٦ — من أعلى درجات الحرارة الموثّقة على الأرض.') },
  { id: 'desert-dew', text: L('Some desert beetles collect drinking water from fog on their bumpy backs.', 'بعض خنافس الصحرا تجمع ماي الشرب من الضباب على ظهرها.') },
  { id: 'mountain-o2', text: L('Bar-headed geese fly over the Himalayas, where the air has about a third of sea-level oxygen.', 'الإوز مخطّط الرأس يطير فوق الهيمالايا حيث الأكسجين تقريباً ثلث اللي عند سطح البحر.') },
  { id: 'cave-troglo', text: L('Many cave animals lose their eyes and colour over generations — they don’t need them in total darkness.', 'وايد من حيوانات الكهوف تفقد عيونها ولونها مع الأجيال لأنها ما تحتاجها بالظلام.') },
  { id: 'snow-frog', text: L('Wood frogs can survive being partly frozen in winter, then thaw and hop away.', 'ضفدع الغابة يقدر يعيش وهو متجمّد جزئياً بالشتا، وبعدين يذوب وينط.') },
  { id: 'swamp-carbon', text: L('Peat swamps store huge amounts of carbon — protecting them helps the climate.', 'مستنقعات الخث تخزّن كميات ضخمة من الكربون، وحمايتها تفيد المناخ.') },
  { id: 'ruins-dna', text: L('DNA can survive for a long time in cold, dry places, which helps scientists study old samples.', 'الحمض النووي يقدر يصمد فترة طويلة بالأماكن الباردة والجافة، وهذا يساعد العلماء يدرسون العينات القديمة.') },
  { id: 'reef-heat', text: L('Corals in the Arabian Gulf survive some of the hottest seawater any reef corals live in.', 'مرجان الخليج العربي يعيش في مياه من أحر المياه اللي ممكن يعيش فيها مرجان.') },
  { id: 'mud-skipper', text: L('Mudskippers breathe through their skin and the lining of their mouths when out of water.', 'نطّاط الطين يتنفس من جلده وبطانة فمه وهو برا الماي.') },
  { id: 'seagrass-dugong', text: L('The Arabian Gulf hosts one of the world’s largest dugong populations, which graze on seagrass.', 'الخليج العربي فيه من أكبر تجمعات الأطوم بالعالم، وهو يرعى على الأعشاب البحرية.') },
  { id: 'sea-whaleshark', text: L('Whale sharks are the largest fish alive and feed by filtering plankton.', 'القرش الحوتي أكبر سمكة حيّة، ويتغذى بفلترة العوالق.') },
  { id: 'twilight-dvm', text: L('Every night, countless animals swim up from the deep to feed — the largest migration on Earth.', 'كل ليلة، أعداد لا تُحصى من الكائنات تصعد من الأعماق تتغذى — أكبر هجرة على الأرض.') },
  { id: 'midnight-light', text: L('Most animals living in the deep ocean can make their own light (bioluminescence).', 'أغلب الحيوانات اللي تعيش بأعماق المحيط تقدر تصنع ضوءها بنفسها.') },
  { id: 'vents-chemo', text: L('Hydrothermal vents, discovered in 1977, host life powered by chemicals instead of sunlight.', 'الفتحات الحرارية اكتُشفت سنة ١٩٧٧، والحياة فيها تعتمد على الكيماويات بدل ضوء الشمس.') },
  { id: 'trench-pressure', text: L('Water pressure rises by about one atmosphere every 10 metres you go down.', 'ضغط الماي يزيد تقريباً ضغط جوي واحد كل ١٠ أمتار نزول.') },
  { id: 'squid-eye', text: L('Giant and colossal squids have the largest eyes in the animal kingdom.', 'الحبّار العملاق والحبّار الهائل عندهم أكبر عيون بمملكة الحيوان.') },
  { id: 'whalefall', text: L('When a whale dies and sinks, its body can feed deep-sea communities for decades.', 'لما يموت الحوت ويغرق، جسمه ممكن يغذّي مجتمعات الأعماق لعشرات السنين.') },
  { id: 'pearl-history', text: L('Before oil, pearl diving was central to Kuwait’s economy and seafaring life.', 'قبل النفط، الغوص على اللؤلؤ كان أساس اقتصاد الكويت وحياتها البحرية.') },
];

export const FACT_BY_ID = Object.fromEntries(FACTS.map((f) => [f.id, f]));

export interface Npc { id: string; name: L10n; role: L10n }
export const NPCS: Npc[] = [
  { id: 'ranger', name: L('Ranger Mariam', 'الحارسة مريم'), role: L('wildlife ranger', 'حارسة حياة فطرية') },
  { id: 'rival', name: L('Dr. Vex', 'د. فيكس'), role: L('rival scientist', 'عالم منافس') },
  { id: 'hermit', name: L('the Beekeeper Hermit', 'النحّال المنعزل'), role: L('mysterious hermit', 'ناسك غامض') },
  { id: 'kid', name: L('Little Salem', 'سالم الصغير'), role: L('a curious kid with a notebook', 'ولد فضولي معاه دفتر') },
  { id: 'diver', name: L('Captain Noura', 'الكابتن نورة'), role: L('research diver', 'غوّاصة باحثة') },
  { id: 'sailor', name: L('Bu Fahad the old sailor', 'بو فهد البحّار القديم'), role: L('retired sailor', 'بحّار متقاعد') },
  { id: 'fisher', name: L('Fisherman Yousef', 'الصياد يوسف'), role: L('fisherman', 'صياد') },
];
export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n]));
