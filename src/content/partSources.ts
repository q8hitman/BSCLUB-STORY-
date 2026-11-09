// The real animal behind every builder option (matches the painted reference picture), and plain labels for the
// abilities a part unlocks in the story (anatomy-gated choices).
import type { Capability, L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });
export const PART_SOURCE: Record<string, L10n> = {
  fennec: L('Fennec fox', 'ثعلب الفنك'), axolotl: L('Axolotl', 'الأكسولوتل'), gecko: L('Gecko', 'الوزغ (أبو بريص)'), owl: L('Barn owl', 'بومة الحظائر'),
  camel: L('Arabian camel', 'الجمل العربي'), frog: L('Poison dart frog', 'ضفدع السهام السام'), pangolin: L('Pangolin', 'آكل النمل الحرشفي'), octopus: L('Octopus', 'الأخطبوط'),
  bigEars: L('Fennec fox', 'ثعلب الفنك'), horns: L('Nubian ibex', 'الوعل النوبي'), crest: L('Cockatoo', 'الكوكاتو'), gillFrills: L('Axolotl', 'الأكسولوتل'),
  antennae: L('Moth', 'العثّة'), helmet: L('Cassowary', 'الشبنم (الكاسوار)'), owlEyes: L('Owl', 'البومة'), compound: L('Fly', 'الذبابة'),
  chameleon: L('Chameleon', 'الحرباء'), glowEyes: L('Flashlight fish', 'سمكة المصباح'), tinyEyes: L('Star-nosed mole', 'الخلد ذو الأنف النجمي'), stalkEyes: L('Stalk-eyed fly', 'ذبابة العيون المعنّقة'),
  wings: L('Bat', 'الخفّاش'), webbed: L('Frog', 'الضفدع'), climbClaws: L('Sloth', 'الكسلان'), digClaws: L('Mole', 'الخلد'),
  tentacles: L('Octopus', 'الأخطبوط'), springLegs: L('Jerboa', 'الجربوع'), fluffy: L('Red fox', 'الثعلب الأحمر'), stinger: L('Scorpion', 'العقرب'),
  finTail: L('Fish', 'السمك'), prehensile: L('Spider monkey', 'القرد العنكبوتي'), club: L('Ankylosaurus (fossil)', 'الأنكيلوصور (أحفوري)'), lure: L('Anglerfish', 'سمكة أبو الشصّ'),
  thickFur: L('Musk ox', 'ثور المسك'), camo: L('Cuttlefish', 'الحبّار السبيدج'), shell: L('Armadillo', 'المدرّع'), spikes: L('Porcupine', 'النيص'),
  biolum: L('Firefly squid', 'حبّار اليراع'), hump: L('Camel', 'الجمل'), gills: L('Shark', 'القرش'), blubber: L('Seal', 'الفقمة'),
  echo: L('Bat', 'الخفّاش'), shock: L('Electric eel', 'ثعبان الماء الكهربائي'), ink: L('Squid', 'الحبّار'), regen: L('Starfish', 'نجم البحر'),
  mimicry: L('Lyrebird', 'طائر القيثارة'), heatPits: L('Pit viper', 'الأفعى ذات الحفر'), smell: L('Bloodhound', 'كلب الدم'), pressure: L('Hadal snailfish', 'سمكة الحلزون السحيقة'),
};
export const CAP_LABEL: Record<Capability, L10n> = {
  fly: L('Fly', 'الطيران'), glide: L('Glide', 'الانزلاق الجوي'), swim: L('Swim', 'السباحة'), breatheWater: L('Breathe water', 'التنفّس تحت الماء'),
  climb: L('Climb', 'التسلّق'), dig: L('Dig', 'الحفر'), jump: L('Jump', 'القفز'), grip: L('Grip', 'الإمساك'),
  nightVision: L('Night vision', 'الرؤية الليلية'), echolocation: L('Echolocation', 'تحديد المواقع بالصدى'), heatSense: L('Heat sense', 'استشعار الحرارة'), scent: L('Keen smell', 'حاسة شمّ قوية'),
  motionSense: L('Motion sense', 'استشعار الحركة'), venom: L('Venom', 'السمّ'), glow: L('Glow', 'التوهّج'), camouflage: L('Camouflage', 'التمويه'),
  armor: L('Armour', 'الدرع'), spines: L('Spines', 'الأشواك'), shock: L('Electric shock', 'الصعق الكهربائي'), ink: L('Ink cloud', 'سحابة الحبر'),
  regenerate: L('Regrow', 'تجديد الأعضاء'), mimic: L('Mimicry', 'المحاكاة'), pressure: L('Deep pressure', 'تحمّل الضغط العميق'), insulated: L('Cold-proof', 'العزل من البرد'),
  fatStore: L('Food store', 'تخزين الغذاء'), heatShed: L('Heat-proof', 'التخلّص من الحرارة'),
};
