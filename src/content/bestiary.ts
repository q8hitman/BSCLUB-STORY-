// Animal & creature registry. Stories (authored or AI) may only summon ids from here, so every
// summoned animal has real artwork: painted plates, specimen plates, and/or a procedural painter drawing.
import type { BiomeId, L10n } from '../engine/types';

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
  { id: 'lynx', name: L('Lynx', 'وشق'), kind: 'real', category: 'mammal', biomes: ['forest', 'snow'], roles: ['predator', 'mystery'], tags: ['stalks', 'watches'], art: { plates: ['forest-lynx-watch'] } },
  { id: 'owl', name: L('Owl', 'بومة'), kind: 'real', category: 'bird', biomes: ['forest'], roles: ['comic', 'rescue'], tags: ['night', 'tangled'], art: { plates: ['forest-comic-owl'] } },
  { id: 'honeybee', name: L('Honeybee', 'نحل العسل'), kind: 'real', category: 'invertebrate', biomes: ['forest', 'mountain'], roles: ['guide'], tags: ['swarm', 'dance'], art: { plates: ['forest-hermit-hives'], painter: 'bees' } },
  { id: 'dhub', name: L('Spiny-tailed lizard (dhub)', 'الضب'), kind: 'real', category: 'reptile', biomes: ['desert'], roles: ['comic', 'prey'], tags: ['Kuwait', 'basking'], art: { plates: ['desert-dhub-standoff'] } },
  { id: 'jerboa', name: L('Jerboa', 'جربوع'), kind: 'real', category: 'mammal', biomes: ['desert'], roles: ['comic', 'prey', 'rescue'], tags: ['Kuwait', 'jumps'], art: { plates: ['desert-dhub-standoff'], specimen: 'specimen-jerboa' } },
  { id: 'fennec', name: L('Fennec fox', 'ثعلب الفنك'), kind: 'real', category: 'mammal', biomes: ['desert'], roles: ['ally', 'mystery'], tags: ['night', 'big-ears'], art: { plates: [], specimen: 'specimen-fennec' } },
  { id: 'scarab', name: L('Desert beetle', 'خنفساء الصحراء'), kind: 'real', category: 'invertebrate', biomes: ['desert'], roles: ['guide'], tags: ['fog-drinking'], art: { plates: ['desert-buried-box'] }, fact: 'desert-dew' },
  { id: 'ibex', name: L('Nubian ibex', 'الوعل النوبي'), kind: 'real', category: 'mammal', biomes: ['mountain'], roles: ['comic', 'guide'], tags: ['Arabia', 'cliffs'], art: { plates: ['mountain-ibex-comic', 'mountain-cave-light'], painter: 'ibex' } },
  { id: 'eagle', name: L('Golden eagle', 'العقاب الذهبي'), kind: 'real', category: 'bird', biomes: ['mountain'], roles: ['predator'], tags: ['circling'], art: { plates: ['mountain-rope-bridge'] } },
  { id: 'cavefish', name: L('Blind cave fish', 'سمك الكهوف الأعمى'), kind: 'real', category: 'fish', biomes: ['cave'], roles: ['mystery'], tags: ['eyeless', 'pale'], art: { plates: [], specimen: 'cave-blind-fish' }, fact: 'cave-troglo' },
  { id: 'wood-frog', name: L('Wood frog', 'ضفدع الغابة'), kind: 'real', category: 'amphibian', biomes: ['snow'], roles: ['mystery'], tags: ['frozen', 'revives'], art: { plates: ['snow-frozen-frog'] }, fact: 'snow-frog' },
  { id: 'polar-bear', name: L('Polar bear', 'دب قطبي'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['predator'], tags: ['ice', 'huge'], art: { plates: ['snow-polar-bear'] } },
  { id: 'arctic-hare', name: L('Arctic hare', 'أرنب قطبي'), kind: 'real', category: 'mammal', biomes: ['snow'], roles: ['comic', 'rescue'], tags: ['white'], art: { plates: ['snow-comic-slide'] } },
  { id: 'crocodile', name: L('Crocodile', 'تمساح'), kind: 'real', category: 'reptile', biomes: ['swamp'], roles: ['predator'], tags: ['ambush', 'still'], art: { plates: ['swamp-croc-log'] } },
  { id: 'pond-turtle', name: L('Pond turtle', 'سلحفاة المستنقع'), kind: 'real', category: 'reptile', biomes: ['swamp'], roles: ['comic', 'rescue'], tags: ['flipped'], art: { plates: ['swamp-comic-turtle'] } },
  { id: 'glow-frog', name: L('Escaped glow frog', 'الضفدع المضيء الهارب'), kind: 'fictional', category: 'amphibian', biomes: ['lab', 'swamp'], roles: ['comic', 'mystery'], tags: ['lab-escapee', 'glows'], art: { plates: ['lab-escaped-samples'] } },
  { id: 'sea-turtle', name: L('Sea turtle', 'سلحفاة بحرية'), kind: 'real', category: 'reptile', biomes: ['reef'], roles: ['guide', 'rescue'], tags: ['ghost-net'], art: { plates: ['reef-bleach-shadow', 'reef-ghost-net'] } },
  { id: 'clownfish', name: L('Clownfish', 'سمكة المهرج'), kind: 'real', category: 'fish', biomes: ['reef'], roles: ['comic'], tags: ['anemone', 'brave'], art: { plates: ['reef-comic-clownfish'] } },
  { id: 'mudskipper', name: L('Mudskipper', 'نطّاط الطين'), kind: 'real', category: 'fish', biomes: ['mudflat'], roles: ['comic'], tags: ['Kuwait', 'walks-on-mud'], art: { plates: ['mudflat-mudskipper-duel'], painter: 'mudskipper' }, fact: 'mud-skipper' },
  { id: 'dugong', name: L('Dugong', 'أطوم'), kind: 'real', category: 'mammal', biomes: ['seagrass'], roles: ['ally', 'rescue'], tags: ['Gulf', 'gentle'], art: { plates: ['seagrass-dugong'], painter: 'dugong' }, fact: 'seagrass-dugong' },
  { id: 'lanternfish', name: L('Lanternfish', 'سمك الفانوس'), kind: 'real', category: 'fish', biomes: ['twilight'], roles: ['guide'], tags: ['migration', 'glow'], art: { plates: ['twilight-lanternfish'] }, fact: 'twilight-dvm' },
  { id: 'siphonophore', name: L('Siphonophore', 'سيفونوفور'), kind: 'real', category: 'invertebrate', biomes: ['twilight'], roles: ['mystery'], tags: ['colony', 'glow'], art: { plates: ['twilight-siphonophore'] } },
  { id: 'giant-squid', name: L('Giant squid', 'الحبّار العملاق'), kind: 'real', category: 'invertebrate', biomes: ['twilight', 'midnight'], roles: ['mystery'], tags: ['huge-eye'], art: { plates: ['twilight-squid-eye'], painter: 'squid' }, fact: 'squid-eye' },
  { id: 'anglerfish', name: L('Anglerfish', 'أبو الشص'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator', 'mystery'], tags: ['lure', 'teeth'], art: { plates: ['midnight-angler'], painter: 'angler' }, fact: 'angler-lure' },
  { id: 'gulper-eel', name: L('Gulper eel', 'ثعبان البلّاع'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator'], tags: ['giant-mouth'], art: { plates: ['midnight-gulper'], painter: 'gulper' }, fact: 'gulper-mouth' },
  { id: 'deep-jellies', name: L('Deep-sea jellies', 'قناديل الأعماق'), kind: 'real', category: 'invertebrate', biomes: ['twilight', 'midnight'], roles: ['comic', 'mystery'], tags: ['glow', 'drift'], art: { plates: ['midnight-party'], painter: 'jelly' }, fact: 'midnight-light' },
  { id: 'dragonfish', name: L('Dragonfish', 'سمكة التنين'), kind: 'real', category: 'fish', biomes: ['midnight', 'twilight'], roles: ['predator'], tags: ['red-light', 'fangs'], art: { plates: [], specimen: 'specimen-dragonfish', painter: 'dragonfish' }, fact: 'dragonfish-red' },
  { id: 'viperfish', name: L('Viperfish', 'سمكة الأفعى'), kind: 'real', category: 'fish', biomes: ['midnight'], roles: ['predator'], tags: ['fangs'], art: { plates: [], specimen: 'specimen-viperfish' }, fact: 'viperfish-teeth' },
  { id: 'tube-worms', name: L('Giant tube worms', 'الديدان الأنبوبية العملاقة'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['mystery'], tags: ['chemosynthesis'], art: { plates: ['vents-chimneys', 'vents-eruption'], painter: 'tubeworms' }, fact: 'vents-chemo' },
  { id: 'scaly-foot-snail', name: L('Scaly-foot snail', 'حلزون القدم الحرشفية'), kind: 'real', category: 'invertebrate', biomes: ['vents'], roles: ['mystery'], tags: ['iron-armour'], art: { plates: ['vents-iron-snail'] } },
  { id: 'snailfish', name: L('Hadal snailfish', 'سمكة الحلزون السحيقة'), kind: 'real', category: 'fish', biomes: ['trench'], roles: ['guide'], tags: ['deepest-fish'], art: { plates: ['trench-snailfish'] }, fact: 'trench-pressure' },
  { id: 'whale-fall', name: L('Whale fall', 'الحوت الساقط'), kind: 'real', category: 'mammal', biomes: ['trench', 'midnight'], roles: ['mystery'], tags: ['ecosystem'], art: { plates: ['trench-whalefall'], painter: 'whalefall' }, fact: 'whalefall' },
  { id: 'axolotl', name: L('Axolotl', 'أكسولوتل'), kind: 'real', category: 'amphibian', biomes: ['lab', 'swamp'], roles: ['comic'], tags: ['regenerates'], art: { plates: [], specimen: 'specimen-axolotl' } },
  { id: 'pangolin', name: L('Pangolin', 'بنغول'), kind: 'real', category: 'mammal', biomes: ['forest'], roles: ['ally'], tags: ['scales'], art: { plates: [], specimen: 'specimen-pangolin' } },
  { id: 'deep-giant', name: L('The unknown giant', 'العملاق المجهول'), kind: 'fictional', category: 'cryptid', biomes: ['openSea', 'trench', 'midnight'], roles: ['mystery'], tags: ['legend', 'plate-sized-eye'], art: { plates: ['opensea-sailor-tale'], painter: 'leviathan' } },
];

export const ANIMAL_BY_ID = Object.fromEntries(BESTIARY.map((a) => [a.id, a]));
