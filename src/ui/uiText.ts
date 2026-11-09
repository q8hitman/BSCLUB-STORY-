// UI-only strings added during the UI polish pass (kept apart from i18n.ts, which belongs to the content worker).
// Arabic here is clear Modern Standard Arabic.
import type { Lang } from '../engine/types';

const U = {
  // mission briefing (shown before the first scene of every run)
  briefKicker: { en: 'Mission file', ar: 'ملف المهمة' },
  briefWho: { en: 'You are a researcher at the Biological Sciences Club. In the club lab’s hybrid simulator you designed a creature that never existed before: {name}. Tonight it stepped out of the simulator, alive.', ar: 'أنت باحث في نادي العلوم البيولوجية. صمّمتَ في محاكي الهجائن بمختبر النادي مخلوقاً لم يوجد من قبل: {name}. والليلة خرج من المحاكي حيّاً.' },
  briefAnimal: { en: '{name} is an animal: it does not talk. It sniffs, listens, explores and reacts — and investigates alongside the team with its body and senses.', ar: '{name} حيوان لا يتكلم. يشمّ ويُصغي ويستكشف ويتفاعل، ويبحث مع الفريق بأعضائه وحواسّه.' },
  briefGoal: { en: 'Mission', ar: 'المهمة' },
  briefHow: { en: 'How to play', ar: 'طريقة اللعب' },
  briefHow1: { en: 'Each scene gives you four choices. {name}’s body parts make some choices easier and others harder.', ar: 'في كل مشهد أربعة خيارات. أعضاء {name} تجعل بعض الخيارات أسهل وبعضها أصعب.' },
  briefHow2: { en: 'Collect evidence ◆ and discoveries ✦. The ending is built from your decisions and what you found.', ar: 'اجمعوا الأدلة ◆ والاكتشافات ✦. النهاية تُبنى على قراراتكم وعلى ما وجدتموه.' },
  briefHow3: { en: 'Watch the energy bar. Club members (the ducks) follow you over the radio: they react, guess (sometimes wrongly) and note real science — but the decisions are yours. Tap ▦ any time for your Explorer Passport QR.', ar: 'انتبهوا لشريط الطاقة. أعضاء النادي (البط) يرافقونكم عبر اللاسلكي: يتفاعلون ويخمّنون (وقد يخطئون) ويدوّنون حقائق علمية، لكن القرار قراركم. اضغطوا ▦ في أي وقت للحصول على رمز جواز المستكشف.' },
  briefStart: { en: 'Start the mission', ar: 'ابدأ المهمة' },
  // companion select
  companion: { en: 'Companion', ar: 'الرفيق' },
  companionHint: { en: 'Your companion travels with you and speaks over the Duck Radio. Companions do not change the odds — choose the one you like.', ar: 'يرافقك في الرحلة ويتحدث عبر راديو البط. الرفيق لا يغيّر فرص النجاح، فاختر من يعجبك.' },
  chooseCompanion: { en: 'Choose your companion', ar: 'اختر رفيقك' },
  selected: { en: 'Selected', ar: 'تم الاختيار' },
  crew: { en: 'BSC crew', ar: 'فريق النادي' },
  // player name
  researcherCard: { en: 'Researcher ID', ar: 'بطاقة الباحث' },
  joining: { en: 'joins the expedition with', ar: 'ينضم إلى الرحلة برفقة' },
  unnamed: { en: 'Unnamed researcher', ar: 'باحث بلا اسم' },
  enterHint: { en: 'Press Enter to continue · optional', ar: 'اضغط Enter للمتابعة · الاسم اختياري' },
  // builder
  specimen: { en: 'Specimen', ar: 'العيّنة' },
  profile: { en: 'Profile', ar: 'السمات' },
  chooseSlot: { en: 'Choose a part', ar: 'اختر جزءًا' },
  tradeoff: { en: 'Trade-off', ar: 'المقابل' },
  // naming
  designation: { en: 'Designation', ar: 'الاسم' },
  optionalPicture: { en: 'Optional: keep a picture of your creature before you leave.', ar: 'اختياري: احتفظ بصورة لمخلوقك قبل الانطلاق.' },
  savePicture: { en: 'Save a picture', ar: 'احفظ صورة' },
  drawing: { en: 'Drawing…', ar: 'جارٍ الرسم…' },
  savedAgain: { en: 'Saved ✓ — save again', ar: 'تم الحفظ ✓ — احفظ مرة أخرى' },
  // mode
  modeHint: { en: 'Two expeditions, one creature. Each run is a short, different story with four choices per scene.', ar: 'رحلتان ومخلوق واحد. كل رحلة قصة قصيرة مختلفة، وفي كل مشهد أربعة خيارات.' },
  land: { en: 'Land expedition', ar: 'رحلة برية' },
  sea: { en: 'Sea expedition', ar: 'رحلة بحرية' },
  classicScenes: { en: '8–10 scenes', ar: '٨–١٠ مشاهد' },
  marineScenes: { en: '11–12 scenes', ar: '١١–١٢ مشهدًا' },
  classicScenesQ: { en: '6 scenes', ar: '٦ مشاهد' },
  marineScenesQ: { en: '7–8 scenes', ar: '٧–٨ مشاهد' },
  classicPlaces: { en: '3 habitats', ar: '٣ بيئات' },
  marineJourney: { en: 'Surface → The Deep', ar: 'السطح ← الأعماق' },
  fourChoices: { en: '4 choices each', ar: '٤ خيارات لكل مشهد' },
  bscOriginal: { en: 'A BSC original', ar: 'من إنتاج نادي العلوم البيولوجية' },
  collabWith: { en: 'BSC × Marine Science Club', ar: 'نادي العلوم البيولوجية × نادي علوم البحار' },
  begin: { en: 'Begin', ar: 'ابدأ' },
  // play
  inScene: { en: 'In this scene', ar: 'في هذا المشهد' },
  realAnimal: { en: 'Real animal', ar: 'كائن حقيقي' },
  fictional: { en: 'Fictional', ar: 'كائن خيالي' },
  yourCreature: { en: 'Your creature', ar: 'مخلوقك' },
  reactions: { en: 'Reactions', ar: 'ردود الفعل' },
  mood_neutral: { en: 'Calm', ar: 'هادئ' }, mood_curious: { en: 'Curious', ar: 'فضولي' }, mood_happy: { en: 'Happy', ar: 'سعيد' },
  mood_frightened: { en: 'Frightened', ar: 'خائف' }, mood_suspicious: { en: 'Suspicious', ar: 'مرتاب' }, mood_tired: { en: 'Tired', ar: 'متعب' },
  mood_confident: { en: 'Confident', ar: 'واثق' }, mood_surprised: { en: 'Surprised', ar: 'مندهش' },
  // ending
  expedition: { en: 'Expedition report', ar: 'تقرير الرحلة' },
  keep: { en: 'Keep & share', ar: 'احفظ وشارك' },
  again: { en: 'Play again', ar: 'العب مجددًا' },
} as const;

export type UKey = keyof typeof U;
export const u = (k: UKey, lang: Lang) => U[k][lang];

export const ROLE_LABEL: Record<string, { en: string; ar: string }> = {
  predator: { en: 'Predator', ar: 'مفترس' }, prey: { en: 'Prey', ar: 'فريسة' }, guide: { en: 'Guide', ar: 'دليل' },
  comic: { en: 'Trickster', ar: 'مشاكس' }, mystery: { en: 'Mystery', ar: 'غامض' }, ally: { en: 'Ally', ar: 'حليف' }, rescue: { en: 'Needs help', ar: 'يحتاج إلى عون' },
};
