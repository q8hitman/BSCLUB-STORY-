import { reachedEnding } from './archive';
// Ending Composer: builds a personalised ending only from facts recorded in the game state.
// Every ending names the creature, a body part that mattered, a real decision the player made, the clues and
// discoveries, the route, the twist and (when it happened) the legend glimpse — so it reads as earned, never abrupt.
import { DUCK_BY_ID } from '../content/ducks';
import { PART_BY_ID } from '../content/parts';
import { BIOMES, FACT_BY_ID, NPC_BY_ID } from '../content/world';
import { Rng } from './rng';
import { sightingFor } from './sighting';
import { BEAT_BY_ID, beatContext, fill, iso } from './story';
import type { Ending, GameState, L10n, Style } from './types';

const L = (en: string, ar: string): L10n => ({ en, ar });
type Tone = Ending['tone'];

interface Archetype {
  id: string;
  mode: 'classic' | 'marine' | 'both';
  /** Score > 0 means eligible. Uses only recorded state. */
  score: (s: GameState) => number;
  tone: Tone;
  titles: L10n[];
  epilogue: L10n;
}

const has = (s: GameState, f: string) => s.flags.includes(f);

export const ARCHETYPES: Archetype[] = [
  // Classic
  { id: 'reunion', mode: 'classic', tone: 'wholesome', score: (s) => (has(s, 'ally:basma') ? 9 : 0),
    titles: [L('The Professor Returns', 'عودة الدكتورة بسمة'), L('Found: One Scientist, Slightly Sunburnt', 'وجدنا العالمة… وعليها حروق شمس خفيفة')],
    epilogue: L('Dr. Basma is back in the BSC lab, and {name} has a permanent bench next to hers. The club’s newest project: protecting the habitats they explored together.', 'رجعت الدكتورة بسمة إلى مختبر النادي، وصار لـ{name} مكان دائم بجانب مكتبها. وبدأ النادي مشروعا جديدا لحماية الأماكن التي زاروها معا.') },
  { id: 'publish', mode: 'both', tone: 'scientific', score: (s) => (s.evidence.length >= 6 && (has(s, 'saved-evidence') || has(s, 'vex-exposed') || s.evidence.includes('hybridizer-data') || s.evidence.includes('new-vent-sample') || s.evidence.includes('probe-data')) ? 6 + s.evidence.length / 4 : 0),
    titles: [L('The Paper That Shook the Campus', 'البحث الذي أدهش الجامعة'), L('Peer-Reviewed and Fabulous', 'بحث راجعه العلماء… وأعجبهم'), L('Data Doesn’t Lie', 'الأرقام لا تكذب')],
    epilogue: L('The field notes become a real research poster — first author: {player}. {name} attends the presentation and only eats one poster board.', 'صارت ملاحظات الرحلة لوحة بحث علمي حقيقية تُعرض في الجامعة، وأول اسم مكتوب عليها: {player}. وحضر {name} العرض، ولم يأكل إلا لوحة واحدة فقط!') },
  { id: 'guardian', mode: 'classic', tone: 'heroic', score: (s) => (has(s, 'saved-animals') ? 5 : 0) + (has(s, 'village-allies') ? 3 : 0) + (has(s, 'knows-purpose') ? 2 : 0) + (has(s, 'freed-samples') ? 2 : 0) + (has(s, 'habitat-threat') ? 2 : 0),
    titles: [L('Guardian of {last}', 'حارس {last}'), L('The Beast Who Protects', 'الحيوان الذي يحمي غيره')],
    epilogue: L('{name} stays near {last}, keeping watch. Rangers report fewer problems — and a mysterious helper who leaves footprints nobody can identify.', 'بقي {name} في {last} ليحرس المكان وحيواناته. ويقول الحرّاس إن المشكلات صارت أقل، وإنهم يرون آثار أقدام غريبة لمساعد لا يعرفون من هو.') },
  { id: 'frenemies', mode: 'classic', tone: 'comedic', score: (s) => (has(s, 'vex-ally') ? 7 : 0) + ((s.rel.rival ?? 0) >= 3 ? 2 : 0),
    titles: [L('Frenemies in Lab Coats', 'أعداء الأمس صاروا زملاء'), L('Co-Authors, Unfortunately', 'نكتب البحث معا… للأسف')],
    epilogue: L('Dr. Vex and the BSC now share a bench, a grant and a lot of arguments. {name} sits between them like a fluffy peace treaty.', 'صار د. فيكس وأعضاء النادي يعملون معا في مختبر واحد، ويصرفون من مال البحث نفسه، ويتجادلون كثيرا. ويجلس {name} بينهم دائما ليهدأ الجميع، كأنه حارس سلام صغير.') },
  { id: 'cryptid', mode: 'classic', tone: 'comedic', score: (s) => (has(s, 'legend-grows') ? 6 : 0) + (has(s, 'went-viral') ? 5 : 0),
    titles: [L('Cryptid Celebrity', 'نجم الحيوانات الغامضة'), L('Blurry, Famous, Unbothered', 'صوره غير واضحة… لكنه مشهور')],
    epilogue: L('Blurry photos of {name} trend for a week. Nobody can prove anything. {name} has never been happier.', 'انتشرت صور غير واضحة لـ{name} على الإنترنت أسبوعا كاملا. لم يستطع أحد أن يثبت أنه حقيقي، و{name} سعيد جدا بذلك.') },
  { id: 'vex-defeated', mode: 'classic', tone: 'heroic', score: (s) => (has(s, 'vex-exposed') ? 6 : 0) + (has(s, 'escaped-vex') ? 4 : 0),
    titles: [L('Not Today, Dr. Vex', 'لن تنجح يا د. فيكس'), L('The Great Escape', 'الهروب الكبير')],
    epilogue: L('Dr. Vex’s plans fall apart and the club gets its equipment back. {name} keeps the drone as a chew toy.', 'فشلت خطط د. فيكس، واسترجع النادي أجهزته. أما {name} فأخذ الطائرة المسيّرة (طائرة صغيرة بلا طيار) ليلعب بها ويعضّها.') },
  { id: 'wild', mode: 'classic', tone: 'mysterious', score: (s) => (has(s, 'beacon-off') ? 4 : 0) + (has(s, 'clone-loose') ? 4 : 0) + (has(s, 'others-exist') ? 3 : 0),
    titles: [L('Into the Wild', 'العودة إلى البرّية'), L('There Are Others', 'هناك حيوانات أخرى مثله')],
    epilogue: L('Some nights, the radio in the BSC lab crackles again. Out there, something like {name} is answering.', 'بعد الرحلة صار جهاز اللاسلكي في مختبر النادي يلتقط إشارات في بعض الليالي. يبدو أن في البرية حيوانا آخر يشبه {name}، وهو يرد على النداء.') },
  { id: 'machine', mode: 'classic', tone: 'bittersweet', score: (s) => (has(s, 'machine-smashed') ? 6 : 0) + (has(s, 'stays-real') ? 2 : 0),
    titles: [L('The Last Hybrid', 'آخر حيوان هجين'), L('One of a Kind', 'لا يوجد مثله')],
    epilogue: L('The Hybridizer is gone forever. There will never be another {name} — which makes this one even more precious.', 'تحطّم جهاز التهجين (الآلة التي تصنع الحيوانات الهجينة) ولن يعمل مرة أخرى. لذلك لن يوجد حيوان آخر مثل {name}، وهذا يجعله أغلى عند الفريق.') },
  { id: 'unsolved', mode: 'classic', tone: 'mysterious', score: (s) => (has(s, 'hook:prof') && !has(s, 'ally:basma') ? 4 : 0),
    titles: [L('The Search Continues', 'البحث مستمر'), L('Postcards From Nowhere', 'رسائل من مكان مجهول')],
    epilogue: L('Dr. Basma wasn’t found this time — but the new clues point somewhere specific. The club is already planning the next expedition.', 'لم يجد الفريق الدكتورة بسمة هذه المرة، لكن الأدلة الجديدة تدل على مكان محدد. وبدأ النادي يخطط للرحلة القادمة للبحث عنها.') },
  // Marine
  { id: 'voice-deep', mode: 'marine', tone: 'mysterious', score: (s) => (has(s, 'leviathan-contact') ? 10 : 0),
    titles: [L('The Voice in the Deep', 'الصوت في الأعماق'), L('It Answered', 'لقد ردّ علينا')],
    epilogue: L('You never tell the full story online. But you tell Bu Fahad, and he cries, and laughs, and says: “I told you so.”', 'لم ينشر الفريق القصة كاملة على الإنترنت. لكنهم حكوها لبو فهد، البحّار العجوز، فبكى من الفرح وضحك وقال: «ألم أقل لكم إنه موجود؟»') },
  { id: 'proof', mode: 'marine', tone: 'scientific', score: (s) => (s.evidence.includes('leviathan-sonar') ? 9 : 0),
    titles: [L('Plate-Sized Proof', 'دليل بحجم الصحن'), L('The Scale on the Hull', 'قشرة عملاقة على الغوّاصة')],
    epilogue: L('The Marine Science Club sends the scale for DNA testing. Results pending. The old sailor already framed the sonar printout.', 'أرسل نادي علوم البحار الحرشفة (القشرة) إلى المختبر لفحص الحمض النووي، والنتيجة لم تظهر بعد. أما البحّار العجوز فوضع صورة جهاز السونار في إطار وعلّقها.') },
  { id: 'blurry', mode: 'marine', tone: 'comedic', score: (s) => (has(s, 'blurry-proof') ? 8 : 0),
    titles: [L('The Blurriest Photo in Marine History', 'أسوأ صورة في تاريخ البحار'), L('Trust Us, It Was Huge', 'صدّقونا، كان ضخما جدا')],
    epilogue: L('The photo looks like a potato in a storm. The Marine Science Club hangs it in their office anyway.', 'الصورة التي التقطها الفريق غير واضحة أبدا، وتبدو مثل حبة بطاطا وسط عاصفة. ومع ذلك علّقها نادي علوم البحار في مكتبه.') },
  { id: 'glimpse', mode: 'marine', tone: 'mysterious', score: (s) => (has(s, 'saw-leviathan') ? 7 : 0),
    titles: [L('We Saw It. We Swear.', 'رأيناه… نقسم إننا رأيناه'), L('The Eye in the Dark', 'العين في الظلام')],
    epilogue: L('No photo, no sample — just a memory of an eye as big as a plate. Bu Fahad nods slowly. He knows exactly how you feel.', 'لم يرجع الفريق بصورة ولا بعيّنة، بل بذكرى عين ضخمة بحجم الصحن. وحين حكوا القصة لبو فهد هزّ رأسه ببطء، فهو يعرف هذا الشعور جيدا.') },
  { id: 'peace', mode: 'marine', tone: 'bittersweet', score: (s) => (has(s, 'left-in-peace') ? 8 : 0),
    titles: [L('Some Things Stay Deep', 'بعض الأسرار تبقى في الأعماق'), L('The Secret of the Sea', 'سرّ البحر')],
    epilogue: L('You chose not to chase it. Some nights, {name} sits by the water, listening.', 'قرّر الفريق ألا يلاحق الكائن الضخم، وتركه يعيش بسلام. وفي بعض الليالي يجلس {name} قرب البحر ويستمع إلى صوت الماء.') },
  { id: 'reef-heroes', mode: 'marine', tone: 'heroic', score: (s) => (has(s, 'hook:reef') ? 2 : 0) + (s.evidence.includes('warm-vent') ? 4 : 0) + (s.evidence.includes('coral-map') ? 2 : 0) + (has(s, 'rescued') ? 1 : 0),
    titles: [L('Reef Defenders', 'حماة الشعاب المرجانية'), L('Kubbar Never Looked Better', 'جزيرة كبّر أجمل من أي وقت مضى')],
    epilogue: L('Your reef data helps the Marine Science Club push for a protected zone. {name} becomes the unofficial mascot of the campaign.', 'استخدم نادي علوم البحار معلومات الفريق عن الشعاب ليطلب جعل المكان محمية طبيعية. وصار {name} رمز الحملة المحبوب، مع أن أحدا لم يختره رسميا.') },
  { id: 'beacon', mode: 'marine', tone: 'heroic', score: (s) => (has(s, 'heroic-stand') ? 7 : 0),
    titles: [L('Beacon in the Dark', 'نور في الظلام'), L('Hero of Abyss-1', 'بطل الغوّاصة «أبيس-١»')],
    epilogue: L('The crew gives {name} a medal made from a bottle cap. It wears it every day.', 'صنع طاقم الغوّاصة لـ{name} ميدالية من غطاء قارورة، شكرا له على شجاعته. وهو يلبسها كل يوم.') },
  { id: 'eye-to-eye', mode: 'marine', tone: 'wholesome', score: (s) => (has(s, 'twist:squid') ? 5 : 0) + (has(s, 'squid-wave') ? 2 : 0),
    titles: [L('Eye to Eye', 'وجها لوجه مع الحبّار'), L('The Squid Said Hi', 'الحبّار ألقى التحية')],
    epilogue: L('Your squid footage becomes the most-watched video in Marine Science Club history. {name} stars in the sequel.', 'صار فيديو الحبّار الذي صوّره الفريق أكثر فيديو شاهده الناس في تاريخ نادي علوم البحار. والنادي يصوّر الآن فيديو جديدا، و{name} هو بطله.') },
  { id: 'vent-day', mode: 'marine', tone: 'scientific', score: (s) => (s.evidence.includes('new-vent-sample') ? 6 : 0) + (has(s, 'twist:probe') ? 3 : 0),
    titles: [L('Born Today: One Hydrothermal Vent', 'ولادة فتحة ساخنة جديدة في قاع البحر'), L('Deep Data Drop', 'كنز من معلومات الأعماق')],
    epilogue: L('Scientists around the world ask for your samples. The BSC and Marine Science Club start a joint deep-sea project.', 'طلب علماء من دول كثيرة عيّنات الفريق. وبدأ النادي مع نادي علوم البحار مشروعا مشتركا لدراسة أعماق البحر.') },
  // Shared fallbacks
  { id: 'nap', mode: 'both', tone: 'comedic', score: (s) => (s.energy <= 0 ? 5 : 0),
    titles: [L('Nap of Champions', 'نومة الأبطال'), L('Too Tired to Be Famous', 'متعب جدا… والشهرة بعد النوم')],
    epilogue: L('{name} sleeps for two full days. {duck} guards the door with a coffee and a “Do Not Disturb” sign.', 'بعد الرحلة نام {name} يومين كاملين من التعب. و{duck} {g:يحرس الباب وفي يده|تحرس الباب وفي يدها} قهوة ولافتة مكتوب عليها: «ممنوع الإزعاج».') },
  { id: 'chaos', mode: 'both', tone: 'comedic', score: (s) => { const silly = s.log.filter((l) => l.style === 'silly').length; const fails = s.log.filter((l) => !l.success).length; return silly >= 2 || fails >= 4 ? 2 + silly + fails / 2 : 0; },
    titles: [L('A Glorious Disaster', 'فوضى رائعة'), L('Science, Technically', 'علم… تقريبا')],
    epilogue: L('Nothing went to plan, and it was the best trip the club ever had. The group chat is still sending memes about it.', 'لم يحدث شيء كما خطّط الفريق، ومع ذلك كانت أجمل رحلة في تاريخ النادي. وما زال الأعضاء يتبادلون الصور المضحكة عنها في مجموعة المحادثة.') },
  { id: 'field-team', mode: 'both', tone: 'wholesome', score: () => 1,
    titles: [L('A Very Good Field Trip', 'رحلة ميدانية رائعة'), L('Home, With Stories', 'رجعنا ومعنا قصص كثيرة')],
    epilogue: L('Back at the BSC lab, {name} curls up under the bench. Tomorrow, there will be more to explore.', 'رجع الفريق إلى مختبر النادي، ونام {name} تحت الطاولة. وغدا يبدأ الفريق استكشافا جديدا.') },
];

const HOOK_GOAL: Record<string, L10n> = {
  'hook:signal': L('trace a mysterious signal', 'معرفة مصدر إشارة غامضة'),
  'hook:prof': L('find the missing Dr. Basma', 'البحث عن الدكتورة بسمة المفقودة'),
  'hook:escape': L('recover the escaped lab samples', 'إرجاع كائنات التجارب التي هربت من المختبر'),
  'hook:contest': L('win the KU Bio Fair', 'الفوز في معرض الأحياء في جامعة الكويت'),
  'hook:reef': L('solve the mystery of the bleaching reef', 'معرفة سبب تحوّل لون المرجان إلى الأبيض'),
  'hook:sound': L('find the source of a giant unknown sound', 'معرفة مصدر صوت ضخم لا يعرفه أحد'),
  'hook:nets': L('trace giant scales caught in a ghost net', 'معرفة صاحب قشور ضخمة وُجدت في شبكة صيد متروكة في البحر'),
};

const TWIST_LINE: Record<string, L10n> = {
  'twist:basma': L('The biggest surprise: Dr. Basma was alive all along.', 'واكتشف الفريق مفاجأة كبيرة: الدكتورة بسمة كانت حية طوال الوقت.'),
  'twist:chip': L('The signal turned out to be coming from {name} itself.', 'واكتشف الفريق أن الإشارة الغامضة كانت تخرج من {name} نفسه.'),
  'twist:escapees': L('The escaped samples had built a tiny ecosystem of their own.', 'واكتشف الفريق أن الحيوانات الهاربة صنعت لنفسها بيئة صغيرة تعيش فيها معا.'),
  'twist:clone': L('Somewhere along the way, {name} met its own copy.', 'والتقى {name} في الطريق بحيوان هجين آخر يشبهه تماما، كأنه نسخة منه.'),
  'twist:legend': L('Along the way, {name} became a local legend.', 'وصار {name} خلال الرحلة مشهورا عند أهل المنطقة، ويحكون عنه القصص.'),
  'twist:squid': L('A real giant squid stopped to inspect {name}.', 'واقترب حبّار عملاق حقيقي من {name} ليفحصه عن قرب.'),
  'twist:probe': L('An old Marine Science Club probe was found still recording.', 'ووجد الفريق في البحر جهاز القياس القديم التابع لنادي علوم البحار، وكان ما زال يسجّل.'),
  'twist:whalefall': L('The team found a whale fall teeming with life.', 'ووجد الفريق في القاع جسم حوت ميت، تعيش حوله وعليه حيوانات كثيرة.'),
};

/** Short names for the clues the stories plant, so the ending can say which one mattered. */
const CLUE_LABEL: Record<string, L10n> = {
  'sample-vial': L('a sample vial stamped with a lab code', 'أنبوب عيّنة عليه رمز مختبر'),
  'project-label': L('a label from a project everyone thought was cancelled', 'ملصق لمشروع كان الجميع يظنون أنه أُلغي'),
  'bsc-pen': L('a BSC-issue pen left on the trail', 'قلم من أقلام النادي وُجد على الطريق'),
  'torn-label': L('a torn label {name} refused to give up', 'ملصق ممزّق رفض {name} أن يتركه'),
  'signal-recording': L('a recording of the mysterious signal', 'تسجيل للإشارة الغامضة'),
  'coordinates': L('a set of coordinates hidden in the signal', 'موقع على الخريطة كان مخبّأ داخل الإشارة'),
  'chip-data': L('data read from a hidden chip', 'معلومات من شريحة إلكترونية مخبّأة'),
  'hybridizer-data': L('the Hybridizer’s own data files', 'ملفات جهاز التهجين نفسه'),
  'lab-files': L('files rescued from the abandoned lab', 'ملفات أنقذها الفريق من المختبر المهجور'),
  'dna-drawers': L('drawers of old DNA samples', 'أدراج فيها عيّنات قديمة من الحمض النووي'),
  'whiteboard-plan': L('a plan scrawled on a dusty whiteboard', 'خطة مكتوبة على سبّورة مغطاة بالغبار'),
  'postcard-map': L('Dr. Basma’s postcard map', 'الخريطة المرسومة على بطاقة بريدية من الدكتورة بسمة'),
  'basma-notes': L('Dr. Basma’s field notes', 'ملاحظات الدكتورة بسمة من رحلاتها'),
  'folded-note': L('a folded note in Dr. Basma’s handwriting', 'ورقة مطوية مكتوبة بخط الدكتورة بسمة'),
  'wall-carving': L('a carving on a cave wall', 'رسم محفور على جدار كهف'),
  'hermit-story': L('the hermit’s story', 'قصة الرجل الذي يعيش وحده بعيدا عن الناس'),
  'vex-map': L('Dr. Vex’s map', 'خريطة د. فيكس'),
  'vex-confession': L('Dr. Vex’s confession', 'اعتراف د. فيكس بما فعله'),
  'clone-tag': L('a tag from the other hybrid', 'بطاقة تعريف من الحيوان الهجين الآخر'),
  'three-toe-tracks': L('three-toed tracks nobody could explain', 'آثار أقدام بثلاث أصابع لم يعرف أحد صاحبها'),
  'hybrid-tracks': L('tracks that matched no known animal', 'آثار أقدام لا تشبه آثار أي حيوان معروف'),
  'inventory': L('the lab’s list of missing samples', 'قائمة المختبر بالعيّنات المفقودة'),
  'vent-tracks': L('strange tracks leading from an air vent', 'آثار غريبة تخرج من فتحة التهوية'),
  'mini-ecosystem': L('photos of a tiny ecosystem nobody planned', 'صور لبيئة صغيرة نشأت وحدها دون أن يخطّط لها أحد'),
  'kid-sketch': L('Little Salem’s sketch', 'الرسمة التي رسمها الطفل سالم'),
  'ranger-map': L('the ranger’s map', 'خريطة حارسة المحمية'),
  'giant-scale': L('a scale as big as a plate', 'حرشفة (قشرة) بحجم الصحن'),
  'mystery-scale': L('a scale from no known fish', 'حرشفة لا تشبه قشور أي سمكة معروفة'),
  'scale-rings': L('growth rings counted on the giant scale', 'حلقات على الحرشفة العملاقة تكشف عمر صاحبها'),
  'old-sound': L('an old recording of the same sound', 'تسجيل قديم للصوت نفسه'),
  'sound-match': L('a sound match nobody expected', 'تشابه بين صوتين لم يتوقعه أحد'),
  'sound-range': L('the measured range of the deep sound', 'قياس المسافة التي يصل إليها صوت الأعماق'),
  'leviathan-sonar': L('a sonar trace of something enormous', 'صورة على جهاز السونار لشيء ضخم جدا'),
  'sonar-log': L('the sonar log', 'سجلّ جهاز السونار الذي يكشف الأشياء بالصوت'),
  'eyewitness-account': L('an eyewitness account', 'كلام شخص رأى الكائن بعينه'),
  'warm-vent': L('a warm-water vent under the reef', 'فتحة تخرج منها مياه دافئة تحت الشعاب'),
  'water-temp-log': L('a log of rising water temperatures', 'سجلّ يبيّن أن حرارة الماء ترتفع'),
  'coral-map': L('a map of the bleaching coral', 'خريطة للمرجان الذي صار لونه أبيض'),
  'probe-data': L('data from the old probe', 'معلومات من جهاز القياس القديم'),
  'probe-marks': L('scratches on the old probe', 'خدوش على جهاز القياس القديم'),
  'new-vent-sample': L('a sample from a newborn vent', 'عيّنة من فتحة ساخنة جديدة في قاع البحر'),
  'squid-footage': L('footage of the squid', 'فيديو للحبّار'),
  'squid-eye-size': L('a measurement of the squid’s eye', 'قياس حجم عين الحبّار'),
  'deep-soundscape': L('a recording of the deep’s soundscape', 'تسجيل للأصوات في أعماق البحر'),
  'deep-footage': L('footage from outside the sub', 'فيديو صوّره الفريق خارج الغوّاصة'),
  'whalefall-survey': L('a survey of the whale fall', 'دراسة لجسم الحوت الميت في القاع'),
  'strange-float': L('a strange float caught in a net', 'عوّامة غريبة عالقة في شبكة'),
  'light-patterns': L('a log of the lights’ patterns', 'سجلّ لطريقة ومض الأضواء في الأعماق'),
};

function joinList(items: string[], lang: 'en' | 'ar'): string {
  if (items.length <= 1) return items.join('');
  if (lang === 'ar') return items.slice(0, -1).join('، ') + ' و' + items[items.length - 1];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function sub(t: L10n, s: GameState, last: L10n): L10n {
  const duck = DUCK_BY_ID[s.duck];
  const r = (x: string, l: 'en' | 'ar') => x.replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_m, m: string, f: string) => ((duck?.gender ?? 'm') === 'm' ? m : f)).replace(/\{duck\}/g, duck?.name[l] ?? (l === 'ar' ? 'رفيقكم' : 'your companion')).replace(/\{name\}/g, iso(s.creature.name)).replace(/\{player\}/g, s.player ? iso(s.player) : (l === 'ar' ? 'الفريق' : 'the team')).replace(/\{last\}/g, last[l]);
  return { en: r(t.en, 'en'), ar: r(t.ar, 'ar') };
}

export function eligibleArchetypes(s: GameState): { a: Archetype; score: number }[] {
  return ARCHETYPES.filter((a) => a.mode === 'both' || a.mode === s.mode).map((a) => ({ a, score: a.score(s) })).filter((x) => x.score > 0);
}

export function dominantStyle(s: GameState): Style {
  const c: Record<Style, number> = { bold: 0, careful: 0, clever: 0, kind: 0, silly: 0 };
  s.log.forEach((l) => c[l.style]++);
  return (Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]) as Style;
}

const STYLE_WORD: Record<Style, L10n> = {
  bold: L('bold', 'جريئة'), careful: L('careful', 'حذرة'), clever: L('clever', 'ذكية'), kind: L('kind', 'لطيفة'), silly: L('funny', 'مضحكة'),
};

/** The choice the player made at a logged step, with its label filled in. */
function decisionAt(s: GameState, i: number): L10n | null {
  const l = s.log[i]; const t = l && BEAT_BY_ID[l.beat];
  const c = t?.choices.find((x) => x.id === l.choice);
  return c ? fill(c.label, beatContext(s, i)) : null;
}

/** recentEndings lowers (never removes) the chance of repeating an ending the player just saw. */
export function composeEnding(s: GameState, recentEndings: string[] = []): Ending {
  const rng = Rng.from(s.seed, 'ending');
  // the run's chosen mood nudges (never forces) which kind of ending fits best
  const moodBoost = (tone: string) => (s.plan.tone === 'light' && (tone === 'comedic' || tone === 'wholesome')) || (s.plan.tone === 'mystery' && (tone === 'mysterious' || tone === 'bittersweet')) ? 1.35 : 1;
  const elig = eligibleArchetypes(s).map((x) => ({ ...x, score: x.score * (recentEndings.includes(x.a.id) ? 0.6 : 1) * moodBoost(x.a.tone) }));
  elig.sort((a, b) => b.score - a.score);
  const top = elig[0].a;
  const pb = s.plan.beats;
  const last = BIOMES[pb[pb.length - 1].biome].name;
  const title = sub(rng.pick(top.titles), s, last);

  const lines: L10n[] = [];
  const parts = s.creature;
  const partOf = (slot: string) => PART_BY_ID[(parts as unknown as Record<string, string>)[slot]];
  const base = PART_BY_ID[parts.base].name, limbs = PART_BY_ID[parts.limbs].name, adapt = PART_BY_ID[parts.adaptation].name;
  const hookFlag = s.flags.find((f) => f.startsWith('hook:'));
  const goal0 = hookFlag ? HOOK_GOAL[hookFlag] : (BEAT_BY_ID[pb[0].template]?.goal ?? L('explore the unknown', 'استكشاف المجهول'));
  const noDot = (t: string) => t.replace(/[.!؟?\s]+$/u, '');
  const goal = L(noDot(goal0.en), noDot(goal0.ar));
  const style = STYLE_WORD[dominantStyle(s)];
  const nm = iso(s.creature.name); const art = /^[aeiou]/i.test(base.en) ? 'an' : 'a';
  const who = s.player ? iso(s.player) : null;

  // Setup
  lines.push(L(`${nm}, ${art} ${base.en} hybrid with ${limbs.en} and ${adapt.en}, set out with ${who ?? 'the team'} to ${goal.en}.`,
    `خرج ${nm} مع ${who ?? 'الفريق'} في رحلة. ${nm} مخلوق هجين: جسمه من ${base.ar}، وله ${limbs.ar} و${adapt.ar}. كانت المهمة: ${goal.ar}.`));
  // Route
  const isStory = !!s.plan.story;
  const places = isStory
    ? pb.map((_b, i) => beatContext(s, i).place).filter((pl, i, a) => a.findIndex((x) => x.ar === pl.ar) === i)
    : [...new Set(pb.slice(1).map((b) => b.biome).filter((b) => b !== 'openSea'))].map((b) => BIOMES[b].name);
  lines.push(s.mode === 'marine' && !isStory
    ? L(`From the surface down into the dark, the trail led through ${joinList(places.map((p) => p.en), 'en')}, and the team’s choices were mostly ${style.en}.`,
      `بدأت الرحلة من سطح البحر ثم نزلت إلى الأعماق. الأماكن التي زارها الفريق: ${joinList(places.map((p) => p.ar), 'ar')}. أغلب قرارات الفريق كانت ${style.ar}.`)
    : L(`The trail led through ${joinList(places.map((p) => p.en), 'en')}, and the team’s choices were mostly ${style.en}.`,
      `الأماكن التي زارها الفريق: ${joinList(places.map((p) => p.ar), 'ar')}. أغلب قرارات الفريق كانت ${style.ar}.`));
  // The body that mattered (always at least one part)
  const win = s.log.find((l) => l.success && l.usedPart && l.beat !== pb[0].template);
  const loss = s.log.find((l) => !l.success && l.usedPart);
  if (win?.usedPart) {
    const p = partOf(win.usedPart);
    lines.push(L(`Its ${p.name.en} saved the day in ${BIOMES[win.biome].name.en}.`, `في ${BIOMES[win.biome].name.ar} نجح ${nm} بفضل جزء من جسمه: ${p.name.ar}.`));
  }
  if (loss?.usedPart) {
    const p = partOf(loss.usedPart);
    lines.push(L(`Not everything went smoothly: its ${p.name.en} became a problem in ${BIOMES[loss.biome].name.en}.`, `لكن في ${BIOMES[loss.biome].name.ar} لم يساعده جزء آخر من جسمه: ${p.name.ar}.`));
  }
  if (!win?.usedPart && !loss?.usedPart) {
    lines.push(L(`Its ${limbs.en} carried it through every place on the trail.`, `وساعده في كل الأماكن جزء من جسمه: ${limbs.ar}.`));
  }
  // A real decision the player made (an earlier key moment, if it differs from the finale)
  const keyIdx = s.log.findIndex((l, i) => i > 0 && i < s.log.length - 1 && (l.style === 'kind' || BEAT_BY_ID[l.beat]?.kind === 'twist' || BEAT_BY_ID[l.beat]?.kind === 'encounter'));
  const key = keyIdx >= 0 ? decisionAt(s, keyIdx) : null;
  if (key) {
    const where = BIOMES[s.log[keyIdx].biome].name;
    lines.push(L(`In ${where.en}, the team decided: “${key.en}” — and that choice stayed with them.`, `ومن القرارات المهمة: في ${where.ar} اختار الفريق «${key.ar}».`));
  }
  // Discovery: the clues and the real science
  const clue = [...s.evidence].reverse().find((id) => CLUE_LABEL[id]);
  if (s.evidence.length || s.discoveries.length) {
    lines.push(L(`The field notebook came home with ${s.evidence.length} clue${s.evidence.length === 1 ? '' : 's'} and ${s.discoveries.length} real-science discover${s.discoveries.length === 1 ? 'y' : 'ies'}.`,
      `عدد الأدلة التي جمعها الفريق: ${s.evidence.length}. وعدد المعلومات العلمية الحقيقية التي تعلّمها: ${s.discoveries.length}.`));
  } else {
    lines.push(L('The field notebook came home almost empty — some mysteries keep their secrets.', 'لم يجمع الفريق أدلة في هذه الرحلة، فبقي جزء من اللغز بلا جواب.'));
  }
  if (clue) { const c = sub(CLUE_LABEL[clue], s, last); lines.push(L(`The clue that mattered most: ${c.en}.`, `أهم دليل: ${c.ar}.`)); }
  // Twist
  const twist = s.flags.find((f) => TWIST_LINE[f]);
  if (twist) lines.push(sub(TWIST_LINE[twist], s, last));
  // People met
  const met = Object.keys(s.rel).filter((id) => s.flags.includes(`met:${id}`));
  if (met.length) {
    const best = met.sort((a, b) => (s.rel[b] ?? 0) - (s.rel[a] ?? 0))[0];
    const v = s.rel[best] ?? 0; const n = NPC_BY_ID[best].name;
    lines.push(v >= 2 ? L(`${n.en} became a true friend.`, `وصارت بين الفريق و${n.ar} صداقة حقيقية.`)
      : v <= -1 ? L(`${n.en} won’t forget this trip — and not in a good way.`, `وصارت العلاقة مع ${n.ar} سيئة بعد هذه الرحلة.`)
        : L(`${n.en} is still making up their mind about you.`, `أما العلاقة بين الفريق و${n.ar} فبقيت عادية.`));
  }
  // The legend glimpse (the same seeded roll the play screen uses)
  if (sightingFor(s)) lines.push(L('And once, for a single heartbeat, something out of the old legends showed itself — then it was gone.', 'وفي لحظة قصيرة رأى الفريق شيئاً يشبه كائنات الحكايات القديمة… ثم اختفى.'));
  // The finale (last, in story order) always appears, so the ending can never ignore the climax.
  const fin = s.log.length ? s.log[s.log.length - 1] : undefined;
  const finTpl = fin && BEAT_BY_ID[fin.beat];
  let finale: L10n | undefined; const finaleLines = new Set<L10n>();
  if (fin && finTpl) {
    const ch = finTpl.choices.find((c) => c.id === fin.choice);
    const out = ch && (fin.success || !ch.fail ? ch.success : ch.fail);
    const label = decisionAt(s, s.log.length - 1);
    const outText = out ? fill(out.text, beatContext(s, s.log.length - 1)) : null;
    const where = beatContext(s, s.log.length - 1).place;
    if (label && outText) finale = L(`The last scene was in ${where.en}. The team chose: “${label.en}”. ${outText.en}`, `آخر مشهد كان في ${where.ar}. اختار الفريق: «${label.ar}». ${outText.ar}`);
    if (finTpl.kind === 'climax') {
      // kept in the one-paragraph summary (share card), but not repeated in the points list: the ending screen shows it first, on its own
      if (label) { const l1 = L(`At the decisive moment, the team chose: “${label.en}”.`, `وفي آخر الرحلة اختار الفريق: «${label.ar}».`); lines.push(l1); finaleLines.add(l1); }
      if (outText) { lines.push(outText); finaleLines.add(outText); }
    }
  }
  if (s.flags.includes('legend:heard') && !s.flags.includes('saw-leviathan')) {
    lines.push(L('The old sailor’s legend stays unconfirmed — for now.', 'أما حكاية البحّار العجوز فلم يتأكّد منها أحد حتى الآن.'));
  }
  const summary: L10n = { en: lines.map((l) => l.en).join(' '), ar: lines.map((l) => l.ar).join(' ') };
  const points = lines.filter((l) => !finaleLines.has(l));
  // the opening promised a mission: say plainly whether it worked, so the story does not just stop
  const ev = s.evidence.length;
  const mission = ev >= 3
    ? L(`The mission was: ${goal.en}. The team came back with ${ev} clues, so the picture is clear.`, `المهمة كانت: ${goal.ar}. رجع الفريق ومعه ${ev} أدلة، فصارت الصورة واضحة.`)
    : ev >= 1
      ? L(`The mission was: ${goal.en}. The team came back with ${ev === 1 ? 'one clue' : 'two clues'}, so part of the answer is still missing.`, `المهمة كانت: ${goal.ar}. رجع الفريق ومعه ${ev === 1 ? 'دليل واحد' : 'دليلان'}، فبقي جزء من الجواب ناقصاً.`)
      : L(`The mission was: ${goal.en}. The team came back without clues this time. Try again with different choices.`, `المهمة كانت: ${goal.ar}. رجع الفريق بلا أدلة هذه المرة. جرّبوا مرة أخرى بقرارات مختلفة.`);

  let tone = top.tone;
  if (tone === 'wholesome' && dominantStyle(s) === 'bold') tone = 'heroic';
  const highlights: L10n[] = [
    L(`Evidence collected: ${s.evidence.length}`, `الأدلة المجموعة: ${s.evidence.length}`),
    L(`Real-science discoveries: ${s.discoveries.length}`, `الاكتشافات العلمية الحقيقية: ${s.discoveries.length}`),
    ...s.discoveries.slice(0, 3).map((id) => FACT_BY_ID[id]?.text).filter(Boolean) as L10n[],
  ];
  // Story Archive adventure: its authored, earned ending leads; the composer's personal lines (decisions, creature) follow.
  const arc = reachedEnding(s);
  if (arc) {
    const c = beatContext(s, 0); const e = arc.ending;
    const sum = fill(e.summary, c);
    return { id: `${arc.story.id}:${arc.id}`, tone: e.tone, title: fill(e.title, c), summary: { en: `${sum.en} ${summary.en}`, ar: `${sum.ar} ${summary.ar}` }, epilogue: fill(e.epilogue, c), highlights, ...(finale ? { finale } : {}), points: [sum, ...points] };
  }
  return { id: top.id, tone, title, summary, epilogue: sub(top.epilogue, s, last), highlights, ...(finale ? { finale } : {}), points, mission };
}
