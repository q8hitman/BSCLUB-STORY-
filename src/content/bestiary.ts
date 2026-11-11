// Animal & creature registry. Stories (authored or AI) may only summon ids from here, so the UI can
// show every summoned animal (plates, specimen plates or a painter drawing). Animals still waiting for art are in ART_PENDING.
import type { BiomeId, L10n } from '../engine/types';
import PLATES from './plates.json';

const L = (en: string, ar: string): L10n => ({ en, ar });

export interface Animal {
  id: string;
  name: L10n;
  kind: 'real' | 'fictional';
  category: 'mammal' | 'bird' | 'reptile' | 'amphibian' | 'fish' | 'invertebrate' | 'cryptid';
  biomes: BiomeId[];
  roles: ('predator' | 'prey' | 'guide' | 'comic' | 'mystery' | 'ally' | 'rescue')[];
  tags: string[];
  art: { plates: string[]; specimen?: string; painter?: string };
  fact?: string;
}

export const BESTIARY: Animal[] = [
  { id: 'lynx', name: L('Lynx', 'وشق'), kind: 'real', category: 'mammal', biomes: ['forest', 'snow'], roles: ['predator', 'mystery'], tags: ['stalks', 'watches'], art: { plates: ['forest-lynx-watch'], specimen: 'specimen-lynx' } },
  { id: 'owl', name: L('Owl', 'بومة'), kind: 'real', category: 'bird', biomes: ['forest'], roles: ['comic', 'rescue'], tags: ['night', 'tangled'], art: { plates: ['forest-comic-owl'] } },
  { id: 'honeybee', name: L('Honeybee', 'نحل العسل'), kind: 'real', category: 'invertebrate', biomes: ['forest', 'mountain'], roles: ['guide'], tags: ['swarm', 'dance'], art: { plates: ['forest-hermit-hives'], painter: 'bees' } },
  { id: 'dhub', name: L('Spiny-tailed lizard (dhub)', 'الضب'), kind: 'real', category: 'reptile', biomes: ['desert'], roles: ['comic', 'prey'], tags: ['Kuwait', 'basking'], art: { plates: ['desert-dhub-standoff'], specimen: 'specimen-dhub' } },
  { id: 'jerboa', name: L('Jerboa', 'جربوع'), kind: 'real', category: 'mammal', biomes: ['desert'], roles: ['comic', 'prey', 'rescue'], tags: ['Kuwait', 'jumps'], art: { plates: ['desert-dhub-standoff'], specimen: 'specimen-jerboa' } },
  { id: 'fennec', name: L('Fennec fox', 'ثعلب الفنك'), kind: 'real', category: 'mammal', biomes: ['desert'], roles: ['ally', 'mystery'], tags: ['night', 'big-ears'], art: { plates: [], specimen: 'specimen-fennec' } },
  { id: 'scarab', name: L('Desert beetle', 'خنفساء الصحراء'), kind: 'real', category: 'invertebrate', biomes: ['desert'], roles: ['guide'], tags: ['fog-drinking'], art: { plates: ['desert-buried-box'] }, fact: 'desert-dew' },
  { id: 'ibex', name: L('Nubian ibex', 'الوعل النوبي'), kind: 'real', category: 'mammal', biomes: ['mountain'], roles: ['comic', 'guide'], tags: ['Arabia', 'cliffs'], art: { plates: ['mountain-ibex-comic', 'mountain-cave-light'], specimen: 'specimen-ibex', painter: 'ibex' } },
  { id: 'eagle', name: L('Golden eagle', 'العقاب الذهبي'), kind: 'real', category: 'bird', biomes: ['mountain'], roles: ['predator'], tags: ['circling'], art: { plates: ['mountain-rope-bridge'] } },
  { id: 'cavefish', name: L('Blind cave fish', 'سمك الكهوف الأعمى'), kind: 'real', category: 'fish', biomes: ['cave'], roles: ['mystery'], tags: ['eyeless', 'pale'], art: { plates: [], specimen: 'cave-blind-fish' }, fact: 'cave-troglo' },
  { id: 'wood-frog', name: L('Wood frog', 'ضفدع الغابة'), kind: 'real', category: 'amphibian', biomes: ['snow'], roles: ['mystery'], tags: ['frozen', 'revives'], art: { plates: ['snow-frozen-frog'] }, fact: 'snow-frog' },
  { id: 'polar-bear', name: L('Polar bear', 'دب قطبي'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['predator'], tags: ['ice', 'huge'], art: { plates: ['snow-polar-bear'] } },
  { id: 'arctic-hare', name: L('Arctic hare', 'أرنب قطبي'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['comic', 'rescue'], tags: ['white'], art: { plates: ['snow-comic-slide'] } },
  { id: 'crocodile', name: L('Crocodile', 'تمساح'), kind: 'real', category: 'reptile', biomes: ['swamp'], roles: ['predator'], tags: ['ambush', 'still'], art: { plates: ['swamp-croc-log'] } },
  { id: 'pond-turtle', name: L('Pond turtle', 'سلحفاة المستنقع'), kind: 'real', category: 'reptile', biomes: ['swamp'], roles: ['comic', 'rescue'], tags: ['flipped'], art: { plates: ['swamp-comic-turtle'] } },
  { id: 'glow-frog', name: L('Escaped glow frog', 'الضفدع المضيء الهارب'), kind: 'fictional', category: 'amphibian', biomes: ['lab', 'swamp'], roles: ['comic', 'mystery'], tags: ['lab-escapee', 'glows'], art: { plates: ['lab-escaped-samples'] } },
  { id: 'sea-turtle', name: L('Sea turtle', 'سلحفاة بحرية'), kind: 'real', category: 'reptile', biomes: ['reef', 'seagrass'], roles: ['guide', 'rescue'], tags: ['ghost-net'], art: { plates: ['reef-bleach-shadow', 'reef-ghost-net'] } },
  { id: 'clownfish', name: L('Clownfish', 'سمكة المهرج'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['comic'], tags: ['anemone', 'brave'], art: { plates: ['reef-comic-clownfish'] } },
  { id: 'mudskipper', name: L('Mudskipper', 'نطّاط الطين'), kind: 'real', category: 'fish', biomes: ['mudflat'], roles: ['comic'], tags: ['Kuwait', 'walks-on-mud'], art: { plates: ['mudflat-mudskipper-duel'], specimen: 'specimen-mudskipper', painter: 'mudskipper' }, fact: 'mud-skipper' },
  { id: 'dugong', name: L('Dugong', 'أطوم'), kind: 'real', category: 'mammal', biomes: ['seagrass'], roles: ['ally', 'rescue'], tags: ['Gulf', 'gentle'], art: { plates: ['seagrass-dugong'], specimen: 'specimen-dugong', painter: 'dugong' }, fact: 'seagrass-dugong' },
  { id: 'lanternfish', name: L('Lanternfish', 'سمك الفانوس'), kind: 'real', category: 'fish', biomes: ['twilight'], roles: ['guide'], tags: ['migration', 'glow'], art: { plates: ['twilight-lanternfish'] }, fact: 'twilight-dvm' },
  { id: 'siphonophore', name: L('Siphonophore', 'سيفونوفور'), kind: 'real', category: 'invertebrate', biomes: ['twilight'], roles: ['mystery'], tags: ['colony', 'glow'], art: { plates: ['twilight-siphonophore'] } },
  { id: 'giant-squid', name: L('Giant squid', 'الحبّار العملاق'), kind: 'real', category: 'invertebrate', biomes: ['twilight', 'midnight'], roles: ['mystery'], tags: ['huge-eye'], art: { plates: ['twilight-squid-eye'], painter: 'squid' }, fact: 'squid-eye' },
  { id: 'anglerfish', name: L('Anglerfish', 'أبو الشص'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator', 'mystery'], tags: ['lure', 'teeth'], art: { plates: ['midnight-angler'], specimen: 'specimen-anglerfish', painter: 'angler' }, fact: 'angler-lure' },
  { id: 'gulper-eel', name: L('Gulper eel', 'ثعبان البلّاع'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator'], tags: ['giant-mouth'], art: { plates: ['midnight-gulper'], painter: 'gulper' }, fact: 'gulper-mouth' },
  { id: 'deep-jellies', name: L('Deep-sea jellies', 'قناديل الأعماق'), kind: 'real', category: 'invertebrate', biomes: ['twilight', 'midnight'], roles: ['comic', 'mystery'], tags: ['glow', 'drift'], art: { plates: ['midnight-party'], painter: 'jelly' }, fact: 'midnight-light' },
  { id: 'dragonfish', name: L('Dragonfish', 'سمكة التنين'), kind: 'real', category: 'fish', biomes: ['midnight', 'twilight'], roles: ['predator'], tags: ['red-light', 'fangs'], art: { plates: [], specimen: 'specimen-dragonfish', painter: 'dragonfish' }, fact: 'dragonfish-red' },
  { id: 'viperfish', name: L('Viperfish', 'سمكة الأفعى'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator'], tags: ['fangs'], art: { plates: [], specimen: 'specimen-viperfish' }, fact: 'viperfish-teeth' },
  { id: 'tube-worms', name: L('Giant tube worms', 'الديدان الأنبوبية العملاقة'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['mystery'], tags: ['chemosynthesis'], art: { plates: ['vents-chimneys', 'vents-eruption'], painter: 'tubeworms' }, fact: 'vents-chemo' },
  { id: 'scaly-foot-snail', name: L('Scaly-foot snail', 'حلزون القدم الحرشفية'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['mystery'], tags: ['iron-armour'], art: { plates: ['vents-iron-snail'] } },
  { id: 'snailfish', name: L('Hadal snailfish', 'سمكة الحلزون السحيقة'), kind: 'real', category: 'fish', biomes: ['trench'], roles: ['guide'], tags: ['deepest-fish'], art: { plates: ['trench-snailfish'] }, fact: 'trench-pressure' },
  { id: 'grey-heron', name: L('Grey heron', 'البلشون الرمادي'), kind: 'real', category: 'bird', biomes: ['mudflat', 'swamp'], roles: ['predator'], tags: ['patient', 'still'], art: { plates: ['mudflat-heron'] } },
  { id: 'mountain-wolf', name: L('Mountain wolf', 'الذئب الجبلي'), kind: 'real', category: 'mammal', biomes: ['mountain', 'snow'], roles: ['predator', 'mystery'], tags: ['ridge', 'howl'], art: { plates: ['mountain-scree'] } },
  { id: 'reef-shark', name: L('Reef shark', 'قرش الشعاب'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['predator'], tags: ['patrol'], art: { plates: ['reef-shark-patrol'] } },
  { id: 'seahorse', name: L('Seahorse', 'حصان البحر'), kind: 'real', category: 'fish', biomes: ['seagrass'], roles: ['rescue'], tags: ['clings'], art: { plates: ['seagrass-net-wall'] } },
  { id: 'bat', name: L('Bat', 'خفاش'), kind: 'real', category: 'mammal', biomes: ['cave'], roles: ['rescue', 'mystery'], tags: ['echolocation'], art: { plates: ['cave-trapped-bat'] } },
  { id: 'hamster', name: L('Lab hamster', 'هامستر المختبر'), kind: 'real', category: 'mammal', biomes: ['ruins', 'lab'], roles: ['comic', 'rescue'], tags: ['stuck'], art: { plates: ['ruins-hamster-vent'] } },
  { id: 'swordfish', name: L('Swordfish', 'أبو سيف'), kind: 'real', category: 'fish', biomes: ['twilight'], roles: ['predator'], tags: ['fast'], art: { plates: ['twilight-swordfish'] } },
  { id: 'vampire-squid', name: L('Vampire squid', 'حبّار مصّاص الدماء'), kind: 'real', category: 'invertebrate', biomes: ['midnight'], roles: ['mystery'], tags: ['cloak', 'glow'], art: { plates: ['midnight-vampire-squid'] } },
  { id: 'yeti-crab', name: L('Yeti crab', 'سرطان اليتي'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['mystery'], tags: ['hairy-claws'], art: { plates: ['vents-crab-swarm'] } },
  { id: 'amphipod', name: L('Giant amphipod', 'القشري العملاق'), kind: 'real', category: 'invertebrate', biomes: ['trench'], roles: ['mystery'], tags: ['swarm'], art: { plates: ['trench-amphipods'] } },
  { id: 'whale-fall', name: L('Whale fall', 'الحوت الساقط'), kind: 'real', category: 'mammal', biomes: ['trench', 'midnight'], roles: ['mystery'], tags: ['ecosystem'], art: { plates: ['trench-whalefall'], painter: 'whalefall' }, fact: 'whalefall' },
  { id: 'axolotl', name: L('Axolotl', 'أكسولوتل'), kind: 'real', category: 'amphibian', biomes: ['lab', 'swamp', 'ruins'], roles: ['comic'], tags: ['regenerates'], art: { plates: [], specimen: 'specimen-axolotl' } },
  { id: 'pangolin', name: L('Pangolin', 'بنغول'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['ally'], tags: ['scales'], art: { plates: [], specimen: 'specimen-pangolin' } },
  // ── Added in the narrative pass: real animals named by story beats ({predator}/{critter}). No art yet → plates: [];
  //    Their specimen close-ups (specimen-<id>) are attached automatically below from plates.json.
  { id: 'brown-bear', name: L('Brown bear', 'الدب البني'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['predator'], tags: ['huge', 'curious'], art: { plates: [] } },
  { id: 'wild-boar', name: L('Wild boar', 'الخنزير البري'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['predator'], tags: ['tusks', 'charges'], art: { plates: [] } },
  { id: 'eagle-owl', name: L('Eurasian eagle-owl', 'البوم النسري'), kind: 'real', category: 'bird', biomes: ['forest'], roles: ['predator', 'mystery'], tags: ['orange-eyes', 'night'], art: { plates: [] } },
  { id: 'roe-deer', name: L('Roe deer', 'الظبي الأوروبي'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['rescue'], tags: ['shy'], art: { plates: [] } },
  { id: 'hedgehog', name: L('Hedgehog', 'القنفذ'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['rescue', 'comic'], tags: ['spines'], art: { plates: [] } },
  { id: 'desert-monitor', name: L('Desert monitor', 'الورل الصحراوي'), kind: 'real', category: 'reptile', biomes: ['desert'], roles: ['predator'], tags: ['Kuwait', 'forked-tongue'], art: { plates: [] } },
  { id: 'saker-falcon', name: L('Saker falcon', 'الصقر الحر'), kind: 'real', category: 'bird', biomes: ['desert'], roles: ['predator'], tags: ['Arabia', 'dives'], art: { plates: [] } },
  { id: 'scorpion', name: L('Deathstalker scorpion', 'العقرب الصفراء'), kind: 'real', category: 'invertebrate', biomes: ['desert'], roles: ['predator'], tags: ['venom', 'glows-under-UV'], art: { plates: [] } },
  { id: 'horned-viper', name: L('Arabian horned viper', 'الأفعى القرناء'), kind: 'real', category: 'reptile', biomes: ['desert'], roles: ['predator'], tags: ['Kuwait', 'buried', 'sidewinds'], art: { plates: [] } },
  { id: 'arabian-leopard', name: L('Arabian leopard', 'النمر العربي'), kind: 'real', category: 'mammal', biomes: ['mountain'], roles: ['predator', 'mystery'], tags: ['Arabia', 'endangered'], art: { plates: [] } },
  { id: 'pika', name: L('Pika', 'البيكا'), kind: 'real', category: 'mammal', biomes: ['mountain'], roles: ['rescue', 'comic'], tags: ['tiny', 'squeaks'], art: { plates: [] } },
  { id: 'rock-hyrax', name: L('Rock hyrax', 'الوبر الصخري'), kind: 'real', category: 'mammal', biomes: ['mountain'], roles: ['rescue', 'comic'], tags: ['Arabia', 'sunbathes'], art: { plates: [] } },
  { id: 'cave-centipede', name: L('Giant cave centipede', 'حريش الكهوف العملاق'), kind: 'real', category: 'invertebrate', biomes: ['cave'], roles: ['predator'], tags: ['hunts-bats'], art: { plates: [] } },
  { id: 'huntsman-spider', name: L('Huntsman spider', 'العنكبوت الصيّاد'), kind: 'real', category: 'invertebrate', biomes: ['cave'], roles: ['predator'], tags: ['fast', 'leg-span'], art: { plates: [] } },
  { id: 'olm', name: L('Olm', 'السمندل الكهفي'), kind: 'real', category: 'amphibian', biomes: ['cave'], roles: ['mystery', 'rescue'], tags: ['eyeless', 'pale', 'lives-100-years'], art: { plates: [] }, fact: 'cave-troglo' },
  { id: 'snowy-owl', name: L('Snowy owl', 'البوم الثلجي'), kind: 'real', category: 'bird', biomes: ['snow'], roles: ['predator'], tags: ['white', 'silent'], art: { plates: [] } },
  { id: 'arctic-fox', name: L('Arctic fox', 'الثعلب القطبي'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['predator'], tags: ['white', 'pounces'], art: { plates: [] } },
  { id: 'lemming', name: L('Lemming', 'الليمينغ'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['rescue', 'comic'], tags: ['under-snow'], art: { plates: [] } },
  { id: 'snapping-turtle', name: L('Snapping turtle', 'السلحفاة القاضمة'), kind: 'real', category: 'reptile', biomes: ['swamp'], roles: ['predator'], tags: ['ambush', 'beak'], art: { plates: [] } },
  { id: 'marsh-frog', name: L('Marsh frog', 'ضفدع المستنقعات'), kind: 'real', category: 'amphibian', biomes: ['swamp'], roles: ['rescue', 'comic'], tags: ['loud'], art: { plates: [] } },
  { id: 'water-vole', name: L('Water vole', 'فأر الماء'), kind: 'real', category: 'mammal', biomes: ['swamp'], roles: ['rescue'], tags: ['swims'], art: { plates: [] } },
  { id: 'rat-snake', name: L('Rat snake', 'ثعبان الفئران'), kind: 'real', category: 'reptile', biomes: ['ruins'], roles: ['predator'], tags: ['climbs'], art: { plates: [] } },
  { id: 'barn-owl', name: L('Barn owl', 'بومة الحظائر'), kind: 'real', category: 'bird', biomes: ['ruins'], roles: ['predator', 'mystery'], tags: ['heart-face', 'screech'], art: { plates: [] } },
  { id: 'moray-eel', name: L('Moray eel', 'ثعبان موراي'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['predator'], tags: ['second-jaw'], art: { plates: [] } },
  { id: 'lionfish', name: L('Lionfish', 'سمكة الأسد'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['predator'], tags: ['venom-spines'], art: { plates: [] } },
  { id: 'parrotfish', name: L('Parrotfish', 'سمكة الببغاء'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['rescue', 'comic'], tags: ['makes-sand'], art: { plates: [] } },
  { id: 'crab-plover', name: L('Crab-plover', 'الحنكور'), kind: 'real', category: 'bird', biomes: ['mudflat'], roles: ['predator'], tags: ['Kuwait', 'crab-hunter'], art: { plates: [] } },
  { id: 'fiddler-crab', name: L('Fiddler crab', 'السرطان العازف'), kind: 'real', category: 'invertebrate', biomes: ['mudflat'], roles: ['rescue', 'comic'], tags: ['one-big-claw'], art: { plates: [] } },
  { id: 'flamingo', name: L('Greater flamingo', 'الفلامنغو الكبير'), kind: 'real', category: 'bird', biomes: ['mudflat'], roles: ['rescue'], tags: ['Kuwait', 'Sulaibikhat'], art: { plates: [] } },
  { id: 'barracuda', name: L('Barracuda', 'الباراكودا'), kind: 'real', category: 'fish', biomes: ['seagrass', 'reef'], roles: ['predator'], tags: ['fast', 'silver'], art: { plates: [] } },
  { id: 'stingray', name: L('Stingray', 'اللخمة (سمكة الراي)'), kind: 'real', category: 'fish', biomes: ['seagrass'], roles: ['predator'], tags: ['buried', 'barb'], art: { plates: [] } },
  { id: 'tiger-shark', name: L('Tiger shark', 'قرش النمر'), kind: 'real', category: 'fish', biomes: ['openSea'], roles: ['predator'], tags: ['stripes'], art: { plates: [] } },
  { id: 'whale-shark', name: L('Whale shark', 'القرش الحوتي'), kind: 'real', category: 'fish', biomes: ['openSea'], roles: ['guide'], tags: ['Gulf', 'filter-feeder'], art: { plates: [] }, fact: 'sea-whaleshark' },
  { id: 'dolphin', name: L('Humpback dolphin', 'الدلفين الأحدب'), kind: 'real', category: 'mammal', biomes: ['openSea'], roles: ['guide', 'ally'], tags: ['Gulf', 'pod'], art: { plates: [] } },
  { id: 'humboldt-squid', name: L('Humboldt squid', 'حبّار هومبولت'), kind: 'real', category: 'invertebrate', biomes: ['twilight'], roles: ['predator'], tags: ['flashes-red', 'pack'], art: { plates: [] } },
  { id: 'hatchetfish', name: L('Hatchetfish', 'سمكة الفأس'), kind: 'real', category: 'fish', biomes: ['twilight'], roles: ['rescue', 'mystery'], tags: ['mirror-sides', 'belly-lights'], art: { plates: [] } },
  { id: 'dumbo-octopus', name: L('Dumbo octopus', 'أخطبوط دامبو'), kind: 'real', category: 'invertebrate', biomes: ['midnight'], roles: ['comic', 'mystery'], tags: ['ear-fins'], art: { plates: [] } },
  { id: 'eelpout', name: L('Vent eelpout', 'سمكة الإيلبوت'), kind: 'real', category: 'fish', biomes: ['vents'], roles: ['predator'], tags: ['pale', 'lurks'], art: { plates: [] } },
  { id: 'pompeii-worm', name: L('Pompeii worm', 'دودة بومبي'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['rescue', 'mystery'], tags: ['heat-proof', 'bacteria-fleece'], art: { plates: [] } },
  { id: 'cusk-eel', name: L('Hadal cusk-eel', 'ثعبان الأعماق الشبحي'), kind: 'real', category: 'fish', biomes: ['trench'], roles: ['predator', 'mystery'], tags: ['deep', 'ghostly'], art: { plates: [] } },
  { id: 'sea-pig', name: L('Sea pig', 'خنزير البحر'), kind: 'real', category: 'invertebrate', biomes: ['trench'], roles: ['comic', 'rescue'], tags: ['sea-cucumber', 'walks'], art: { plates: [] } },
  { id: 'deep-giant', name: L('The unknown giant', 'العملاق المجهول'), kind: 'fictional', category: 'cryptid', biomes: ['openSea', 'trench', 'midnight'], roles: ['mystery'], tags: ['legend', 'plate-sized-eye'], art: { plates: ['legend-bu-sahn'], painter: 'leviathan' } },
];

// Specimen close-ups painted for an animal are named `specimen-<id>`: attach any that shipped in plates.json.
const PLATE_IDS = new Set((PLATES as { id: string }[]).map((p) => p.id));
for (const a of BESTIARY) if (!a.art.specimen && PLATE_IDS.has(`specimen-${a.id}`)) a.art.specimen = `specimen-${a.id}`;

export const ANIMAL_BY_ID = Object.fromEntries(BESTIARY.map((a) => [a.id, a]));

/** Animals referenced by stories that still wait for painted art (no plate, specimen or painter). */
export const ART_PENDING: string[] = BESTIARY.filter((a) => !a.art.plates.length && !a.art.specimen && !a.art.painter).map((a) => a.id);
