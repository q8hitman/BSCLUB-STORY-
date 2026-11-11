import type { BeatTemplate } from '../engine/types';
import { C, L, O, chk, di, en, ev, fl, rel, tr } from './dsl';

// Marine Science Club collaboration mode. Phase 1: Surface Waters (bright, with hints of what waits below).
// Phase 2: The Deep (mystery and age-appropriate horror: things at the edge of the searchlight).
// Real biology appears only in "Real Science" fact boxes; the sailor's legend is always framed as a story.
// Every beat has at least 4 ungated choices (the engine shows exactly 4).
// Arabic is Modern Standard Arabic; {name} (the creature) is grammatically masculine.
// Payoff variants (evidenceAny/flagAny) let later deep beats call back clues found near the surface.

/** Surface sightings of "something long and dark" that the deep beats pay off. */
const SHADOW_CLUES = ['reef-photos', 'sonar-log', 'fisher-report', 'catch-log', 'night-dive-notes'];
const SOUND_CLUES = ['sound-match', 'sound-range', 'old-sound'];
const SCALE_CLUES = ['mystery-scale', 'scale-rings'];
const HEAT_CLUES = ['warm-vent', 'anomaly-data', 'water-temp-log', 'fisher-call'];

export const MARINE_BEATS: BeatTemplate[] = [
  // ───────────── HOOKS ─────────────
  {
    id: 'hm-reef', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'boat'],
    goal: L('Find out what is bleaching the reef near Kubbar Island.', 'اكتشفوا ما الذي يُبيّض شعاب جزيرة كبّر.'),
    text: L('The Marine Science Club bursts into the BSC lab: patches of reef near Kubbar Island are turning bone-white, fast. They need a field partner that can go where divers can’t — and every head turns toward {name}.',
      'جاء أعضاء نادي علوم البحار إلى مختبر النادي ومعهم خبر سيّئ: المرجان قرب جزيرة كبّر يفقد لونه ويصير أبيض بسرعة، ولا أحد يعرف السبب. هم يحتاجون إلى من يصل إلى أماكن لا يصلها الغوّاصون… فنظر الجميع إلى {name}.'),
    choices: [
      C('go', L('Pack the boat and go', 'جهّزوا القارب وانطلقوا'), 'bold',
        O('By sunrise you’re speeding south across the Gulf, {name} leaning into the spray.', 'مع شروق الشمس كنتم تشقّون الخليج جنوباً، و{name} يميل نحو رذاذ الموج مستمتعاً.', 'happy', [fl('hook:reef'), ev('water-temp-log')], 'boat')),
      C('data', L('Review their temperature data first', 'راجعوا بيانات الحرارة أولاً'), 'clever',
        O('The data shows a hot-water patch that doesn’t match the weather. It pulses at night, as if something below is breathing.', 'تكشف البيانات بقعة ماء دافئة لا تفسّرها حالة الطقس. وهي تنبض ليلاً، كأن شيئاً في الأسفل يتنفّس.', 'thinking', [fl('hook:reef'), ev('anomaly-data')], 'screen'),
        { check: chk('intellect', 4), fail: O('The spreadsheet has forty tabs. You’ll figure it out on the boat.', 'في جدول البيانات أربعون صفحة. ستفهمونه على متن القارب.', 'laughing', [fl('hook:reef')], 'screen') }),
      C('call', L('Call the Kubbar fishermen first', 'اتصلوا بصيادي كبّر أولاً'), 'careful',
        O('An old fisherman confirms it: near the island the water “feels like bathwater” after dark. He won’t say more on the phone.', 'أكّد صياد عجوز الأمر: قرب الجزيرة يصبح الماء بعد الغروب «دافئاً كماء الحمّام». ورفض أن يقول المزيد عبر الهاتف.', 'thinking', [fl('hook:reef'), ev('fisher-call')], 'phone')),
      C('vest', L('Fit {name} with a tiny life jacket', 'ألبسوا {name} سترة نجاة صغيرة'), 'silly',
        O('{name} hates the life jacket for nine whole seconds, then refuses to ever take it off. Safety first.', 'كره {name} السترة تسع ثوان كاملة، ثم رفض أن يخلعها إلى الأبد. السلامة أولاً.', 'laughing', [fl('hook:reef'), tr(1)], 'heart')),
    ],
  },
  {
    id: 'hm-sound', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'hydrophone'],
    goal: L('Find the source of the mysterious deep-sea sound.', 'اعثروا على مصدر الصوت الغامض في أعماق البحر.'),
    text: L('The Marine Science Club’s underwater microphone caught a sound no one can identify: long, low, enormous, like a door slowly opening at the bottom of the sea. They play it in the BSC lab — and {name} lets out a long, low call of its own.',
      'سجّل ميكروفون نادي علوم البحار تحت الماء صوتاً غريباً: صوت طويل وعميق وقوي جداً، ولا أحد يعرف مصدره. شغّل الفريق التسجيل في مختبر النادي… فأصدر {name} صوتاً طويلاً يشبهه تماماً!'),
    choices: [
      C('record', L('Record {name}’s reply', 'سجّلوا ردّ {name}'), 'clever',
        O('The two waveforms line up in a way nobody can explain. Whatever made that sound, {name} recognises it.', 'تطابقت الموجتان بطريقة لا يفسّرها أحد. أيّاً كان مصدر ذلك الصوت، فإن {name} يعرفه.', 'shocked', [fl('hook:sound'), ev('sound-match')], 'radio')),
      C('sail', L('Head to where it was recorded', 'توجّهوا إلى موقع التسجيل'), 'bold',
        O('Coordinates loaded. Snacks loaded. {name} loaded. Let’s go.', 'الإحداثيات جاهزة. الزاد جاهز. و{name} جاهز. هيا بنا.', 'happy', [fl('hook:sound')], 'boat')),
      C('range', L('Work out how far the sound travelled', 'احسبوا المسافة التي قطعها الصوت'), 'careful',
        O('The sound crossed hundreds of kilometres of ocean before the microphone caught it. Whatever made it is big — and it is deep.', 'قطع الصوت مئات الكيلومترات في المحيط قبل أن يلتقطه الميكروفون. أيّاً كان مصدره، فهو ضخم… وفي الأعماق.', 'thinking', [fl('hook:sound'), ev('sound-range')], 'scan')),
      C('comfort', L('Comfort {name}, who won’t stop staring at the speaker', 'هدّئوا {name} المتسمّر أمام السمّاعة'), 'kind',
        O('You sit with {name} until it stops trembling. But all night long, it keeps facing the sea.', 'جلستم مع {name} حتى توقّف عن الارتجاف. لكنه ظلّ طوال الليل يُولّي وجهه نحو البحر.', 'worried', [fl('hook:sound'), tr(1)], 'heart')),
    ],
  },
  {
    id: 'hm-nets', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'net'],
    goal: L('Find out which creature left the strange cold scales in the ghost net.', 'اكتشفوا أيّ كائن ترك الحراشف الباردة الغريبة في الشبكة المهجورة.'),
    text: L('A fisherman brought the Marine Science Club a ghost net — an abandoned fishing net — with strange scales caught in it. Big scales, cold to the touch even in the sun. The clubs team up, and {name} cannot stop sniffing them.',
      'أحضر صيّاد إلى نادي علوم البحار شبكة صيد قديمة وجدها في البحر. في الشبكة قشور سمك غريبة: كبيرة جداً، وباردة حتى تحت الشمس. لا أحد يعرف أيّ حيوان تركها. و{name} لا يتوقّف عن شمّها.'),
    choices: [
      C('scale', L('Analyse the scales', 'حلّلوا الحراشف'), 'clever',
        O('The scales match no species in any database. They also smell like… adventure.', 'لا تطابق الحراشف أيّ نوع في أيّ قاعدة بيانات. ورائحتها… رائحة مغامرة.', 'thinking', [fl('hook:nets'), ev('mystery-scale')], 'sample')),
      C('nets', L('Plan a ghost-net clean-up on the way', 'خطّطوا لتنظيف الشباك المهجورة في الطريق'), 'kind',
        O('Two clubs, one boat, a lot of bin bags. The sea will thank you.', 'ناديان، وقارب واحد، وأكياس قمامة كثيرة. سيشكركم البحر.', 'happy', [fl('hook:nets'), fl('cleanup'), tr(1)], 'heart')),
      C('measure', L('Measure the biggest scale', 'قيسوا أكبر حرشفة'), 'careful',
        O('It’s the size of a dinner plate, and its growth rings are so many you lose count. Whatever wore it is very, very old.', 'إنها بحجم صحن العشاء، وحلقات نموّها كثيرة حتى ضاع منكم العدّ. صاحبها قديم… قديم جداً.', 'shocked', [fl('hook:nets'), ev('scale-rings')], 'sample')),
      C('crown', L('Let {name} wear a scale as a crown', 'توّجوا {name} بحرشفة'), 'silly',
        O('{name} wears the mystery scale like a crown. The fisherman laughs, then stops. “My grandfather had one just like that,” he says quietly.', 'وضع {name} الحرشفة الغامضة على رأسه كالتاج. ضحك الصياد، ثم سكت وقال بهدوء: «كانت لدى جدّي واحدة مثلها تماماً.»', 'laughing', [fl('hook:nets'), tr(1)], 'pop')),
    ],
  },

  // ───────────── SURFACE EXPLORE ─────────────
  {
    id: 'em-reef', mode: 'marine', kind: 'explore', biomes: ['reef'], phase: 'surface', props: ['coral', 'fish'], fact: 'reef-heat', featured: 'sea-turtle',
    text: L('Sunlight dances over {place}: parrotfish, sweetlips, a turtle cruising by like it owns the place. But some corals are bone-white. And past the edge of the reef, where it drops away, the blue turns darker than it should.',
      'الفريق الآن عند {place}. الماء صاف ومليء بالأسماك الملوّنة، وسلحفاة تسبح بهدوء. لكن جزءاً من المرجان صار أبيض مثل العظم. وبعد حافة الشعاب ينزل القاع فجأة، والماء هناك أغمق من الطبيعي.'),
    variants: [
      { when: { capAny: ['breatheWater'] }, text: L('{name} can stay down as long as it likes. Show-off.', 'يستطيع {name} البقاء تحت الماء ما شاء. يا له من متباه!') },
      { when: { evidenceAny: HEAT_CLUES }, text: L('Somewhere here is the warm patch from the club’s data. The water on your skin already feels too warm.',
        'في مكان ما هنا تقع البقعة الدافئة التي ظهرت في بيانات النادي. والماء على الجلد يبدو أدفأ مما ينبغي.') },
    ],
    choices: [
      C('survey', L('Do a careful coral survey', 'أجروا مسحاً دقيقاً للمرجان'), 'careful',
        O('You map healthy versus bleached coral along a measured line. These Gulf corals are tough survivors.', 'رسمتم خريطة للمرجان السليم والمبيضّ على امتداد خط مسح. مرجان الخليج صامد وقوي.', 'thinking', [di('reef-heat'), ev('coral-map')], 'map'),
        { check: chk('swim', 4, ['swim', 'breatheWater']), fail: O('The current keeps pushing you off the survey line. Half a map.', 'ظلّ التيار يدفعكم بعيداً عن خط المسح. نصف خريطة فقط.', 'worried', [di('reef-heat')], 'splash') }),
      C('turtle', L('Follow the turtle', 'اتبعوا السلحفاة'), 'bold',
        O('The turtle leads you to a crack in the reef where warm water seeps up from somewhere far below — the source of the hot patch.', 'قادتكم السلحفاة إلى شقّ في الشعاب يتسرّب منه ماء دافئ من مكان بعيد في الأسفل — إنه مصدر البقعة الدافئة.', 'shocked', [ev('warm-vent')], 'swim'),
        { check: chk('swim', 5, ['swim']), fail: O('Turtles are faster than they look. Much faster.', 'السلاحف أسرع مما تبدو. أسرع بكثير.', 'laughing', [en(-1)], 'swim') }),
      C('photo', L('Take photos for the club', 'التقطوا صوراً للنادي'), 'kind',
        O('The photos are stunning. In one, far in the background, a long dark shape is crossing the drop-off. Nobody noticed it at the time.', 'الصور مذهلة. وفي إحداها، بعيداً في الخلفية، ظلّ طويل داكن يعبر حافة المنحدر. لم ينتبه إليه أحد حينها.', 'proud', [ev('reef-photos'), tr(1)], 'camera')),
      C('race', L('Race a parrotfish', 'سابقوا سمكة ببغاء'), 'silly',
        O('{name} loses gloriously. The parrotfish crunches some coral in celebration, and {name} learns exactly where white sand comes from.', 'خسر {name} خسارة مجيدة. قضمت سمكة الببغاء قليلاً من المرجان احتفالاً، فعرف {name} بالضبط من أين يأتي الرمل الأبيض.', 'laughing', [ev('parrotfish-notes'), tr(1)], 'swim'),
        { check: chk('swim', 4), fail: O('{name} gets distracted by a sea cucumber halfway and forfeits the race.', 'انشغل {name} بخيار بحر في منتصف الطريق فانسحب من السباق.', 'laughing', [], 'swim') }),
    ],
  },
  {
    id: 'em-mudflat', mode: 'marine', kind: 'explore', biomes: ['mudflat'], phase: 'surface', props: ['mud', 'mudskipper'], fact: 'mud-skipper', featured: 'mudskipper',
    text: L('At low tide, the mud of {place} shines like wet silver. Mudskippers skip about and flex their fins at each other like tiny wrestlers.',
      'نزل ماء البحر عن {place} فظهر الطين اللامع. فوق الطين أسماك صغيرة غريبة تقفز خارج الماء، اسمها «نطّاط الطين»، وكل سمكة ترفع زعنفتها لتخيف الأخرى.'),
    choices: [
      C('watch', L('Watch a mudskipper duel', 'شاهدوا نزالاً بين أسماك نطّاط الطين'), 'careful',
        O('They puff up and raise their back fins to defend their puddles. Adorable territorial drama.', 'تنتفخ وترفع زعانفها الظهرية دفاعاً عن بِركها. دراما حدودية لطيفة.', 'laughing', [di('mud-skipper'), ev('skipper-behaviour')], 'binoculars')),
      C('birds', L('Count the wading birds', 'عُدّوا طيور الشاطئ'), 'clever',
        O('Crab-plovers, herons, flamingos: these mudflats are a crucial rest stop on the migration route.', 'بلشون، وفلامنغو، وطيور أخرى كثيرة: هذا الشاطئ محطة استراحة حيوية على طريق الهجرة.', 'thinking', [ev('bird-count')], 'binoculars'),
        { check: chk('intellect', 4), fail: O('You counted the same flamingo nine times.', 'عددتم طائر الفلامنغو نفسه تسع مرات.', 'laughing', [], 'binoculars') }),
      C('mudbath', L('Let {name} enjoy the mud', 'دعوا {name} يستمتع بالطين'), 'silly',
        O('{name} rolls in the mud with total joy. The boat will never be clean again.', 'تمرّغ {name} في الطين بسعادة غامرة. لن يعود القارب نظيفاً أبداً.', 'laughing', [en(1), tr(1)], 'splash')),
      C('litter', L('Pick up litter along the tideline', 'اجمعوا النفايات على خط المدّ'), 'kind',
        O('Bottles, bags, one lonely flip-flop — and a fishing float stamped with the name of a ship nobody in the harbour has ever heard of.', 'قوارير وأكياس وفردة نعل وحيدة… وعوّامة صيد مختومة باسم سفينة لم يسمع بها أحد في الميناء.', 'thinking', [ev('strange-float'), tr(1)], 'sample')),
    ],
  },
  {
    id: 'em-seagrass', mode: 'marine', kind: 'explore', biomes: ['seagrass'], phase: 'surface', props: ['seagrass', 'dugong'], fact: 'seagrass-dugong', featured: 'dugong',
    text: L('Long green meadows sway in {place}. Something large and gentle is grazing through them: a dugong, munching like a sleepy cow.',
      'الفريق الآن في {place}، وهي أعشاب خضراء طويلة تنمو تحت الماء. بين الأعشاب حيوان كبير وهادئ يأكل العشب ببطء: إنه الأطوم، ويسمّى أيضاً «بقرة البحر».'),
    choices: [
      C('distance', L('Watch from a respectful distance', 'راقبوا من مسافة لائقة'), 'careful',
        O('The dugong keeps grazing, unbothered. You record the feeding trails it leaves in the seagrass.', 'واصل الأطوم رعيه دون أن ينزعج. وسجّلتم مسارات الرعي التي يتركها في العشب البحري.', 'happy', [di('seagrass-dugong'), ev('dugong-trails')], 'binoculars')),
      C('closer', L('Let {name} swim closer', 'دعوا {name} يقترب سباحةً'), 'bold',
        O('The dugong lets {name} swim alongside. A once-in-a-lifetime moment.', 'سمح الأطوم لـ{name} بأن يسبح إلى جانبه. لحظة لا تتكرر في العمر.', 'proud', [fl('dugong-friend'), tr(1)], 'heart'),
        { check: chk('charm', 5, ['swim']), fail: O('Too close — the dugong drifts away. Lesson: wild animals need space.', 'اقتربتم أكثر من اللازم، فابتعد الأطوم. الدرس: الحيوانات البرية تحتاج إلى مساحتها.', 'worried', [tr(-1)], 'swim') }),
      C('carbon', L('Measure the seagrass', 'قيسوا الأعشاب البحرية'), 'clever',
        O('Seagrass locks away carbon and shelters baby fish. These meadows are worth protecting.', 'تخزّن الأعشاب البحرية الكربون وتؤوي صغار الأسماك. هذه المروج جديرة بالحماية.', 'thinking', [ev('seagrass-data')], 'sample')),
      C('graze', L('Copy the dugong’s grazing', 'قلّدوا رعي الأطوم'), 'silly',
        O('{name} tries a mouthful of seagrass, chews thoughtfully… and spits it out. The dugong looks deeply offended.', 'جرّب {name} لقمة من العشب البحري، ومضغها متأمّلاً… ثم بصقها. وبدا الأطوم مستاءً جداً.', 'laughing', [tr(1)], 'pop')),
    ],
  },

  // ───────────── SURFACE ENCOUNTERS ─────────────
  {
    id: 'nm-diver', mode: 'marine', kind: 'encounter', biomes: ['reef', 'seagrass'], phase: 'surface', props: ['diver'], npc: 'diver',
    text: L('A Marine Science Club diver surfaces beside you: {npc}. “Is that thing on our permit?” she asks, eyeing {name}.', 'ظهرت بجانبكم في الماء غوّاصة من نادي علوم البحار، اسمها {npc}. نظرت إلى {name} باستغراب وسألت: «هل معكم تصريح لهذا الحيوان؟»'),
    choices: [
      C('team', L('Invite her to dive together', 'ادعوها إلى الغوص معكم'), 'kind',
        O('She teaches {name} proper dive signals. It learns “OK” and “shark” immediately.', 'علّمت {name} إشارات الغوص الصحيحة، فتعلّم إشارتَي «تمام» و«قرش» فوراً.', 'happy', [fl('met:diver'), rel('diver', 2)], 'heart')),
      C('data', L('Swap data with her', 'تبادلوا البيانات معها'), 'clever',
        O('Her sonar logs show something big passing below the reef at night — always at the same hour.', 'تُظهر سجلات السونار لديها شيئاً ضخماً يمرّ تحت الشعاب ليلاً — في الساعة نفسها دائماً.', 'thinking', [fl('met:diver'), rel('diver', 1), ev('sonar-log')], 'screen')),
      C('night', L('Ask about her night dives', 'اسألوها عن غوصاتها الليلية'), 'careful',
        O('She hesitates. “At night, past the drop-off, the lights in the water aren’t always plankton.”', 'تردّدت ثم قالت: «في الليل، بعد حافة المنحدر، ليست كل الأضواء في الماء كائنات صغيرة مضيئة.»', 'worried', [fl('met:diver'), rel('diver', 1), ev('night-dive-notes')], 'still')),
      C('signals', L('Let {name} show off its dive signals', 'دعوا {name} يستعرض إشارات الغوص'), 'silly',
        O('{name} copies her slow hand movements with its own limbs — badly — then swims a happy loop around her. She laughs into her regulator.', 'قلّد {name} حركات يديها البطيئة بأطرافه… بشكل مضحك، ثم دار حولها دورةً مرحة. فضحكت في منظِّم التنفّس.', 'laughing', [fl('met:diver'), rel('diver', 1)], 'heart')),
    ],
  },
  {
    id: 'nm-fisher', mode: 'marine', kind: 'encounter', biomes: ['mudflat', 'seagrass', 'reef'], phase: 'surface', props: ['dhow'], npc: 'fisher',
    text: L('A wooden dhow drifts nearby. {npc} waves you over. “Careful out there. The sea’s been strange lately.”', 'اقترب منكم قارب صيد خشبي. فيه {npc}، يلوّح لكم ويقول: «انتبهوا هناك. البحر غريب هذه الأيام.»'),
    choices: [
      C('listen', L('Ask what he has seen', 'اسألوه عمّا رآه'), 'kind',
        O('Fish acting oddly, warm patches, and once, at dusk, a shadow longer than his boat passing underneath it.', 'أسماك تتصرّف بغرابة، وبقع دافئة، وذات مرة عند الغروب ظلّ أطول من قاربه مرّ من تحته.', 'thinking', [fl('met:fisher'), rel('fisher', 2), ev('fisher-report')], 'heart')),
      C('help', L('Help him haul a ghost net', 'ساعدوه في سحب شبكة مهجورة'), 'bold',
        O('Together you heave an abandoned net out of the water. Two turtles swim free.', 'سحبتم معاً شبكة مهجورة من الماء، فسبحت سلحفاتان حرّتين.', 'proud', [fl('met:fisher'), rel('fisher', 2), fl('rescued')], 'impact'),
        { check: chk('strength', 5, ['grip']), fail: O('The net is heavy. You get half of it out and mark the rest for the coast guard.', 'الشبكة ثقيلة. أخرجتم نصفها وحدّدتم مكان الباقي لخفر السواحل.', 'worried', [fl('met:fisher'), rel('fisher', 1)], 'impact') }),
      C('log', L('Trade a weather forecast for his catch log', 'بادلوه توقعات الطقس بسجلّ صيده'), 'clever',
        O('His log shows deep-water fish turning up in his nets — fish that should never come this close to the surface.', 'يُظهر سجلّه أسماك أعماق علقت في شباكه — أسماكاً لا ينبغي أن تقترب من السطح أبداً.', 'thinking', [fl('met:fisher'), rel('fisher', 1), ev('catch-log')], 'map')),
      C('sort', L('Let {name} help sort the catch', 'دعوا {name} يساعد في فرز الصيد'), 'silly',
        O('{name} sniffs every fish in the crate and growls at just one of them. Yousef checks it: it is the only one caught near the warm water.', 'شمّ {name} كل سمكة في الصندوق، وزمجر عند واحدة فقط. فحصها يوسف: إنها الوحيدة التي اصطيدت قرب الماء الدافئ.', 'laughing', [fl('met:fisher'), rel('fisher', 1)], 'sample')),
    ],
  },

  // ───────────── THE SAILOR'S LEGEND (optional per run) ─────────────
  {
    id: 'lm-tale', mode: 'marine', kind: 'legend', biomes: ['mudflat', 'reef', 'seagrass'], phase: 'surface', props: ['sailor', 'dhow'], npc: 'sailor', fact: 'pearl-history', featured: 'deep-giant',
    text: L('On the harbour wall, mending a net, sits {npc}. “When I was a young pearl diver,” he says, “I saw something in the deep water. An eye as big as a plate. A body longer than our boom. Nobody believed me.” (This is his story — the game never claims it’s fact.)',
      'على جدار الميناء يجلس {npc} ويصلح شبكته. يقول: «حين كنت شاباً كنت أغوص لأبحث عن اللؤلؤ. وفي الماء العميق رأيت شيئاً لا أنساه: عين بحجم الصحن، وجسم أطول من سفينتنا. لم يصدّقني أحد.» (هذه حكايته فقط، واللعبة لا تقول إنها حقيقة.)'),
    variants: [
      { when: { evidenceAny: SCALE_CLUES }, text: L('When you show him the plate-sized scale, his hands stop moving on the net.', 'وحين أريتموه الحرشفة التي بحجم الصحن، توقّفت يداه عن الشبكة.') },
      { when: { evidenceAny: SOUND_CLUES }, text: L('You play him the recording from the lab. He closes his eyes. “That is the sound,” he whispers.', 'أسمعتموه التسجيل من المختبر، فأغمض عينيه وهمس: «هذا هو الصوت.»') },
    ],
    choices: [
      C('believe', L('Tell him you believe him', 'أخبروه أنكم تصدّقونه'), 'kind',
        O('His eyes shine. He presses an old pearl-diving nose clip into your hands, “for luck — and for the deep.”', 'لمعت عيناه، ووضع في أيديكم مِلقط أنف قديماً من أيام الغوص على اللؤلؤ: «للحظّ… وللأعماق.»', 'happy', [fl('legend:heard'), fl('sailor-gift'), rel('sailor', 3), di('pearl-history')], 'heart')),
      C('details', L('Ask for the exact details', 'اسألوه عن التفاصيل الدقيقة'), 'clever',
        O('He remembers the place, the season, the moon. You write it all down as an eyewitness account.', 'يتذكّر المكان والموسم والقمر. ودوّنتم كل شيء بوصفه شهادة شاهد عيان.', 'thinking', [fl('legend:heard'), ev('eyewitness-account'), rel('sailor', 1), di('pearl-history')], 'map')),
      C('skeptic', L('Politely suggest it was a whale shark', 'لمّحوا بأدب إلى أنه ربما كان قرشاً حوتياً'), 'careful',
        O('“Maybe,” he smiles. “But whale sharks don’t look back at you.”', 'ابتسم وقال: «ربما… لكن القرش الحوتي لا يبادلك النظر.»', 'thinking', [fl('legend:heard'), di('sea-whaleshark')], 'still')),
      C('where', L('Ask him to point out the place', 'اطلبوا منه أن يدلّكم على المكان'), 'bold',
        O('He points past the horizon, to where the water turns from green to ink. “There. But only go if the sea lets you.”', 'أشار إلى ما وراء الأفق، حيث يتحوّل الماء من الأخضر إلى لون الحبر: «هناك. لكن لا تذهبوا إلا إذا سمح لكم البحر.»', 'worried', [fl('legend:heard'), rel('sailor', 1), di('pearl-history')], 'map')),
    ],
  },

  // ───────────── PHASE TRANSITION ─────────────
  {
    id: 'pm-descend', mode: 'marine', kind: 'phase', biomes: ['openSea'], phase: 'deep', props: ['ship', 'sub'],
    text: L('Phase two: The Deep. The research ship stops where the Arabian Sea turns from blue to ink, and the seafloor falls away for kilometres. The submersible BSC Abyss-1 swings from the crane, its single searchlight dark — and inside, {name} watches the last of the sunlight slide off the glass.',
      'المرحلة الثانية: الأعماق. توقّفت سفينة الأبحاث في مكان يصير فيه البحر عميقاً جداً ولونه أزرق غامق. الغوّاصة الصغيرة «أبيس-١» معلّقة فوق الماء وجاهزة للنزول، والفريق و{name} داخلها ينظرون من الزجاج إلى آخر ضوء للشمس.'),
    variants: [
      { when: { flag: ['legend:heard'] }, text: L('{name} holds on to the old sailor’s story like a map. Or a warning.', 'يتمسّك {name} بحكاية البحّار العجوز كأنها خريطة… أو تحذير.') },
      { when: { evidenceAny: SHADOW_CLUES }, text: L('Somewhere below is whatever cast the long shadow seen from the surface.', 'في مكان ما في الأسفل يكمن صاحب الظلّ الطويل الذي رأيتموه من السطح.') },
    ],
    choices: [
      C('check', L('Run full safety checks', 'أجروا فحص سلامة شاملاً'), 'careful',
        O('Every seal, every battery, every snack: checked. Abyss-1 is ready. Nobody mentions how small it looks against the sea.', 'كل سدادة، وكل بطارية، وكل وجبة خفيفة: فُحصت. «أبيس-١» جاهزة. ولم يذكر أحد كم تبدو صغيرة أمام البحر.', 'thinking', [en(1), fl('sub-checked')], 'sub')),
      C('ride', L('Let {name} ride outside, on the hull', 'دعوا {name} يركب خارج الغوّاصة على هيكلها'), 'bold',
        O('{name} clings to the hull as the blue drains to black. Things brush past it in the dark. It doesn’t let go.', 'تشبّث {name} بهيكل الغوّاصة بينما ينسحب الأزرق إلى السواد. أشياء تحتكّ به في الظلام… ولم يُفلت قبضته.', 'shocked', [fl('rode-outside')], 'sub'),
        { requires: { capAny: ['swim', 'breatheWater', 'grip'] }, check: chk('swim', 4, ['breatheWater', 'pressure']), fail: O('Two hundred metres down, {name} knocks on the window, very politely, to be let in.', 'على عمق مئتي متر، طرق {name} النافذة بكل أدب طالباً الدخول.', 'laughing', [en(-1)], 'sub') }),
      C('playlist', L('Choose the dive playlist', 'اختاروا أغاني رحلة الغوص'), 'silly',
        O('{duck} picks old Kuwaiti sea songs. Everyone hums along, and for a while the dark outside feels a little smaller.', '{g:اختار|اختارت} {duck} أغاني بحرية كويتية قديمة. أخذ الجميع يدندنون، ولبعض الوقت بدا الظلام في الخارج أصغر قليلاً.', 'laughing', [tr(2)], 'sub')),
      C('light', L('Log the light as it disappears', 'سجّلوا الضوء وهو يختفي'), 'clever',
        O('At fifty metres, red vanishes. Then orange, then yellow. By two hundred the world is a deep, cold blue — and then not even that.', 'عند خمسين متراً يختفي الأحمر، ثم البرتقالي، ثم الأصفر. وعند مئتي متر يصبح العالم أزرق داكناً بارداً… ثم يختفي حتى الأزرق.', 'thinking', [ev('light-log'), di('bathysphere-1934')], 'scan')),
      C('close', L('Hold {name} close as the light goes', 'ضمّوا {name} إليكم مع انطفاء الضوء'), 'kind',
        O('{name} presses against you as the window turns black. Nobody says it, but everyone is glad not to be alone.', 'التصق {name} بكم والنافذة تسودّ. لم يقلها أحد، لكن الجميع كانوا سعداء لأنهم ليسوا وحدهم.', 'happy', [tr(2)], 'heart')),
    ],
  },

  // ───────────── DEEP EXPLORE ─────────────
  {
    id: 'em-twilight', mode: 'marine', kind: 'explore', biomes: ['twilight'], phase: 'deep', props: ['lanternfish', 'jelly'], fact: 'twilight-dvm', featured: 'lanternfish',
    text: L('Two hundred metres down, the water in {place} is the colour of a bruise. Lanternfish hang in silver clouds, waiting for night. Something long and thin drifts across the searchlight — far too slowly to be a fish.',
      'نزلت الغوّاصة إلى عمق مئتي متر، في {place}. الضوء هنا ضعيف جداً. أمام الزجاج آلاف الأسماك الصغيرة اللامعة، اسمها «أسماك الفانوس». وفي ضوء الكشّاف يمرّ شيء طويل ورفيع ببطء… وهو ليس سمكة.'),
    variants: [
      { when: { capAny: ['glow'] }, text: L('{name}’s own lights flicker on by themselves, as if answering something.', 'اشتعلت أضواء {name} من تلقاء نفسها، كأنها تجيب شيئاً ما.') },
      { when: { evidenceAny: SOUND_CLUES }, text: L('The hydrophone hums: the long, low sound from the lab again — closer now.', 'يطنّ الميكروفون المائي: إنه الصوت الطويل العميق الذي سُمع في المختبر — لكنه الآن أقرب.') },
    ],
    choices: [
      C('migrate', L('Track the migration', 'تتبّعوا الهجرة'), 'clever',
        O('Sonar shows a living layer rising out of the dark — countless animals heading up to feed. It looks as if the seafloor itself is coming up to meet you.', 'يُظهر السونار طبقة حيّة تصعد من الظلام — كائنات لا تُحصى تتّجه إلى الأعلى لتتغذى. يبدو كأن القاع نفسه يصعد للقائكم.', 'proud', [di('twilight-dvm'), ev('migration-sonar')], 'scan')),
      C('lights', L('Turn off the lights and watch', 'أطفئوا الأضواء وراقبوا'), 'careful',
        O('One by one, tiny lights blink on outside — dozens, then hundreds, a whole hidden city switching on around you. Some of them blink in pairs, like eyes.', 'واحداً تلو الآخر، تضيء في الخارج أضواء صغيرة — عشرات، ثم مئات، مدينة خفية كاملة تُنار من حولكم. وبعضها يومض أزواجاً… كالعيون.', 'shocked', [ev('light-patterns')], 'stars')),
      C('chat', L('Have {name} flash back at them', 'دعوا {name} يردّ عليها بالوميض'), 'silly',
        O('{name} flashes. The fish flash back. Is this… a conversation?', 'أومض {name}، فأومضت الأسماك ردّاً عليه. أهذه… محادثة؟', 'laughing', [ev('flash-dialogue'), fl('light-talk')], 'flash'),
        { requires: { capAny: ['glow'] }, check: chk('charm', 4, ['glow']), fail: O('The fish scatter. Then, far below, a single much larger light flashes back.', 'تفرّقت الأسماك. ثم، بعيداً في الأسفل، ردّ ضوء واحد أكبر بكثير بومضة.', 'shocked', [], 'flash') }),
      C('follow', L('Follow the long drifting shape', 'اتبعوا الشكل الطويل المنجرف'), 'bold',
        O('It’s a siphonophore: a colony of tiny animals strung together, longer than a bus, trailing stinging threads like a curtain. Beautiful and terrifying at the same time.', 'إنه كائن اسمه «السيفونوفور»: مستعمرة من كائنات صغيرة متّصلة ببعضها، أطول من حافلة، تجرّ خلفها خيوطاً لاسعة كالستارة. جميل ومرعب في آن واحد.', 'shocked', [ev('siphonophore-footage')], 'camera'),
        { check: chk('swim', 4), fail: O('The shape folds in on itself and vanishes upward. Whatever it was, it was longer than the sub.', 'انطوى الشكل على نفسه واختفى صعوداً. أيّاً كان، فقد كان أطول من الغوّاصة.', 'shocked', [], 'still') }),
      C('hatchet', L('Guide a lost hatchetfish out of the beam', 'أرشدوا سمكة فأس تائهة إلى خارج الضوء'), 'kind',
        O('A hatchetfish — all silver mirror and huge upturned eyes — is trapped in your beam. You dim it, and the little fish slips back into the blue.', 'سمكة فأس — مرآة فضية وعينان كبيرتان متّجهتان إلى الأعلى — عالقة في ضوء الكشّاف. خفّفتم الضوء، فانسلّت السمكة الصغيرة عائدة إلى الزرقة.', 'happy', [tr(1), ev('hatchetfish-notes')], 'still')),
    ],
  },
  {
    id: 'em-midnight', mode: 'marine', kind: 'explore', biomes: ['midnight'], phase: 'deep', props: ['angler', 'snow'], fact: 'midnight-light', featured: 'anglerfish',
    text: L('A thousand metres down in {place}, sunlight is only a rumour. Marine snow drifts through the searchlight like ash. At the very edge of the beam, a row of needle teeth hangs in the black, perfectly still — and then it is gone.',
      'الغوّاصة الآن على عمق ألف متر، في {place}. ضوء الشمس لا يصل إلى هنا أبداً. في ضوء الكشّاف يتساقط فتات أبيض صغير مثل الثلج. وعند آخر الضوء ظهر صفّ من الأسنان الرفيعة… ثم اختفى.'),
    variants: [
      { when: { capAny: ['nightVision', 'echolocation'] }, text: L('{name} can sense shapes out there that no camera can see — and it has gone very quiet.', 'يستشعر {name} أشكالاً في الخارج لا تراها أيّ كاميرا — وقد صمت تماماً.') },
      { when: { evidenceAny: ['light-patterns', 'flash-dialogue'] }, text: L('Some of the paired lights from above seem to have followed you down.', 'ويبدو أن بعض الأضواء المزدوجة التي رأيتموها في الأعلى قد تبعتكم إلى هنا.') },
    ],
    choices: [
      C('angler', L('Film the anglerfish', 'صوّروا سمكة أبي الشص'), 'careful',
        O('An anglerfish drifts into frame: a ragged black body, a mouth full of glassy teeth, and a glowing lure bobbing in front of it like a lantern on a fishing line. It doesn’t chase. It waits.', 'تدخل سمكة أبي الشص إلى الإطار: جسد أسود ممزّق الأطراف، وفم مليء بأسنان كالزجاج، وطُعم مضيء يتمايل أمامها كفانوس على خيط صيد. إنها لا تطارد. إنها تنتظر.', 'proud', [di('midnight-light'), di('angler-lure'), ev('angler-footage')], 'camera'),
        { check: chk('stealth', 4), fail: O('The lure goes dark. When the light comes back, it is pressed right against the lens. The footage is mostly teeth.', 'انطفأ الطُّعم. وحين عاد الضوء كان ملتصقاً بالعدسة. التسجيل كله تقريباً أسنان.', 'shocked', [], 'camera') }),
      C('snow', L('Sample the marine snow', 'خذوا عيّنة من الثلج البحري'), 'clever',
        O('Your jar fills with marine snow — dust and tiny lives sinking toward the bottom. Then a gulper eel glides past, opens a mouth far bigger than its whip-thin body, and swallows a whole cloud of shrimp in one gulp.', 'امتلأ الوعاء بالثلج البحري — غبار وكائنات دقيقة تهبط نحو القاع. ثم مرّ ثعبان البلّاع، وفتح فماً أكبر بكثير من جسده النحيل كالسوط، وابتلع سحابة كاملة من الروبيان بلقمة واحدة.', 'shocked', [ev('snow-sample'), di('gulper-mouth')], 'sample')),
      C('lure', L('Let {name} use its own glow', 'دعوا {name} يستخدم ضوءه الخاص'), 'bold',
        O('Dozens of creatures gather around {name}’s glow: shrimp like red sparks, a jelly like a lampshade, a fish made mostly of eyes. They watch. They wait. They don’t blink.', 'تجمّعت عشرات الكائنات حول ضوء {name}: روبيان كالشرر الأحمر، وقنديل كغطاء مصباح، وسمكة معظمها عيون. تراقب. تنتظر. ولا ترمش.', 'happy', [ev('creature-census'), fl('deep-party')], 'flash'),
        { requires: { capAny: ['glow'] }, check: chk('charm', 4, ['glow']), fail: O('Something much larger comes to see the light, too. You only ever see its outline. You leave early.', 'جاء كائن أكبر بكثير ليرى الضوء أيضاً. لم تروا منه إلا حدوده. فغادرتم مبكراً.', 'shocked', [en(-1)], 'flash') }),
      C('red', L('Chase the strange red light', 'لاحقوا الضوء الأحمر الغريب'), 'bold',
        O('A dragonfish: long and black as a whip, a glowing whisker on its chin, and under its eye a red light like a secret torch. It has been hunting right beside you the whole time.', 'سمكة تنين: طويلة سوداء كالسوط، تحت ذقنها شعيرة مضيئة، وتحت عينها ضوء أحمر كمصباح سرّي. كانت تصطاد بجانبكم طوال الوقت.', 'shocked', [di('dragonfish-red'), ev('dragonfish-footage')], 'scan'),
        { check: chk('stealth', 5), fail: O('The red light blinks out. Then it blinks on again — closer. You back away.', 'انطفأ الضوء الأحمر. ثم أضاء من جديد… أقرب. فتراجعتم.', 'shocked', [en(-1)], 'flash') }),
      C('dim', L('Dim the floodlights and let the deep come closer', 'خفّفوا الكشّافات ودعوا الأعماق تقترب'), 'kind',
        O('In the soft glow, the deep comes to look at you: a viperfish, fangs too long to fit inside its own mouth, hanging an arm’s length from the glass.', 'في الضوء الخافت جاءت الأعماق لتنظر إليكم: سمكة أفعى، أنيابها أطول من أن يتّسع لها فمها، معلّقة على بُعد ذراع من الزجاج.', 'shocked', [di('viperfish-teeth'), ev('viperfish-sighting'), tr(1)], 'still')),
    ],
  },
  {
    id: 'em-vents', mode: 'marine', kind: 'explore', biomes: ['vents'], phase: 'deep', props: ['smokers', 'tubeworms'], fact: 'vents-chemo', featured: 'tube-worms',
    text: L('The searchlight finds the chimneys first: black towers coughing out smoke-dark water hot enough to melt lead. Around their roots in {place}, life that has never seen the sun crowds together — blood-red tube worms swaying as if breathing, and white crabs that all turn to look at you at once.',
      'وصلت الغوّاصة إلى {place}. في القاع أعمدة سوداء تشبه المداخن، يخرج منها ماء حارّ جداً وداكن مثل الدخان. وحولها حيوانات لم ترَ الشمس أبداً: ديدان حمراء طويلة تتمايل، وسرطانات بيضاء تنظر كلها إليكم.'),
    variants: [
      { when: { evidenceAny: HEAT_CLUES }, text: L('The warm patch near Kubbar was a faint whisper of heat like this. Down here, it shouts.', 'لم تكن البقعة الدافئة قرب كبّر إلا همساً خافتاً لحرارة كهذه. أما هنا فهي تصرخ.') },
    ],
    choices: [
      C('worms', L('Study the tube worms', 'ادرسوا الديدان الأنبوبية'), 'careful',
        O('No mouth, no stomach — only bacteria inside them, turning chemicals into food. Life without sunlight.', 'لا فم ولا معدة — فقط بكتيريا في داخلها تحوّل المواد الكيميائية إلى غذاء. حياة بلا ضوء شمس.', 'shocked', [di('vents-chemo'), ev('worm-sample')], 'sample')),
      C('temp', L('Measure the chimney temperature', 'قيسوا حرارة المدخنة'), 'clever',
        O('Over 350°C — and yet the crushing pressure stops it from boiling. Physics is wild.', 'أكثر من ٣٥٠ درجة — ومع ذلك يمنعه الضغط الساحق من الغليان. الفيزياء مدهشة.', 'thinking', [ev('vent-temp')], 'scan'),
        { check: chk('heat', 4, ['armor', 'pressure']), fail: O('The probe tip comes back melted and bent. Science has costs.', 'عاد طرف المجسّ ذائباً معوجّاً. للعلم ثمن.', 'worried', [], 'heat') }),
      C('snail', L('Search for the scaly-foot snail', 'ابحثوا عن حلزون القدم الحرشفية'), 'bold',
        O('Found one! Its foot is armoured with scales of iron sulphide. A real-life metal snail.', 'وجدتم واحداً! قدمه مدرّعة بحراشف من كبريتيد الحديد. حلزون معدنيّ حقيقي.', 'proud', [ev('iron-snail')], 'scan'),
        { check: chk('intellect', 5, ['heatSense', 'scent']), fail: O('Lots of crabs. No snail. The crabs seem smug about it.', 'سرطانات كثيرة ولا حلزون. وتبدو السرطانات مغرورة بذلك.', 'laughing', [], 'scan') }),
      C('wave', L('Wave back at the crabs', 'لوّحوا للسرطانات'), 'silly',
        O('You wave. A hundred white crabs raise a hundred claws, in perfect silence. Nobody is sure whether that was hello.', 'لوّحتم، فرفعت مئة سرطانة بيضاء مئة مخلب في صمت تام. لا أحد متأكد إن كانت تلك تحيّة.', 'laughing', [ev('crab-behaviour')], 'still')),
    ],
  },

  // ───────────── DEEP TWISTS ─────────────
  {
    id: 'tm-squid', mode: 'marine', kind: 'twist', biomes: ['twilight', 'midnight'], phase: 'deep', props: ['squid'], fact: 'squid-eye', featured: 'giant-squid',
    text: L('Something taps the window. Once. Twice. Then an eye fills the glass — silver, wet, bigger than a dinner plate — and it is not looking at the camera. It is looking at {name}.',
      'شيء يدقّ على زجاج الغوّاصة. مرة… ثم مرة ثانية. ثم تظهر أمام الزجاج عين كبيرة جداً ولامعة، أكبر من صحن الطعام. والعين لا تنظر إلى الكاميرا… إنها تنظر إلى {name}.'),
    variants: [
      { when: { evidenceAny: SHADOW_CLUES }, text: L('Everyone thinks of the long dark shape seen from the surface. Was it this, all along?', 'تذكّر الجميع الظلّ الطويل الداكن الذي رأوه من السطح. أكان هذا هو منذ البداية؟') },
      { when: { flagAny: ['light-talk', 'deep-party'] }, text: L('{name}’s glow flickers in the same pattern it flashed at the small lights earlier. The eye does not move away.', 'يومض ضوء {name} بالنمط نفسه الذي ردّ به على الأضواء الصغيرة من قبل. والعين لا تبتعد.') },
      { when: { evidenceAny: ['light-patterns'] }, text: L('The blinking pairs of lights from earlier, like eyes — now you know some of them were.', 'تلك الأضواء التي كانت تومض أزواجاً كالعيون… الآن تعرفون أن بعضها كان عيوناً بالفعل.') },
    ],
    choices: [
      C('still', L('Stay still and film', 'اثبتوا وصوّروا'), 'careful',
        O('Thirty seconds of footage: the eye, then a tentacle sliding slowly along the hull, then nothing. A living giant squid, filmed in the deep.', 'ثلاثون ثانية من التصوير: العين، ثم لامسة تنزلق ببطء على الهيكل، ثم لا شيء. حبّار عملاق حيّ، مصوَّر في الأعماق.', 'shocked', [fl('twist:squid'), di('squid-eye'), ev('squid-footage')], 'camera')),
      C('wave', L('Have {name} raise a limb to the glass', 'دعوا {name} يرفع أحد أطرافه إلى الزجاج'), 'kind',
        O('{name} presses a limb to the glass. On the other side, a tentacle tip touches the same spot. Then the eye slides away into the dark, unhurried.', 'وضع {name} أحد أطرافه على الزجاج. ومن الجهة الأخرى لمس طرفُ لامسة الموضعَ نفسه. ثم انسحبت العين إلى الظلام على مهل.', 'happy', [fl('twist:squid'), di('squid-eye'), fl('squid-wave')], 'heart')),
      C('flood', L('Hit it with full floodlights', 'سلّطوا عليه الكشّافات بكامل قوتها'), 'bold',
        O('For one frame you see all of it: arms like ship’s cables, a body longer than the sub. Then a cloud of ink swallows everything, and when it clears, you are alone.', 'في لقطة واحدة رأيتموه كاملاً: أذرع كحبال السفن، وجسد أطول من الغوّاصة. ثم ابتلعت سحابة حبر كل شيء، وحين انقشعت كنتم وحدكم.', 'shocked', [fl('twist:squid'), di('squid-eye'), ev('squid-still')], 'flash')),
      C('measure', L('Measure the eye with the laser scale', 'قيسوا العين بمسطرة الليزر'), 'clever',
        O('Two laser dots land on the eye, and the number comes back: nearly thirty centimetres across. Nobody in the sub speaks for a while.', 'سقطت نقطتا ليزر على العين، وجاء الرقم: قرابة ثلاثين سنتيمتراً عرضاً. لم يتكلّم أحد في الغوّاصة لبعض الوقت.', 'thinking', [fl('twist:squid'), di('squid-eye'), ev('squid-eye-size')], 'scan'),
        { check: chk('intellect', 4), fail: O('The pupil narrows at the laser. Then the eye is gone, and your numbers are useless.', 'ضاق البؤبؤ أمام الليزر. ثم اختفت العين، وصارت أرقامكم بلا فائدة.', 'worried', [fl('twist:squid'), di('squid-eye')], 'scan') }),
    ],
  },
  {
    id: 'tm-probe', mode: 'marine', kind: 'twist', biomes: ['midnight', 'vents', 'twilight'], phase: 'deep', props: ['probe'],
    text: L('Half-buried in the silt, an old probe blinks a tired green light. The label is faded but readable: “Marine Science Club, 1998.” Its casing is scored with long, parallel scratches.',
      'في ضوء الكشّاف يظهر جهاز قياس قديم، نصفه مدفون في طين القاع، وما زال فيه ضوء أخضر ضعيف. مكتوب عليه: «نادي علوم البحار، ١٩٩٨». وعلى غطائه خدوش طويلة… كأن شيئاً كبيراً أمسك به.'),
    variants: [
      { when: { evidenceAny: SOUND_CLUES }, text: L('If this probe heard the sound the lab caught, it has been listening down here for decades.', 'إن كان هذا المجسّ قد سمع الصوت الذي التقطه المختبر، فهو يُصغي هنا منذ عقود.') },
      { when: { evidenceAny: ['catch-log', 'fisher-report', 'night-dive-notes'] }, text: L('Deep fish in the fishermen’s nets, strange lights on the night dives: this probe may have recorded the cause.', 'أسماك أعماق في شباك الصيادين، وأضواء غريبة في الغوصات الليلية: لعلّ هذا المجسّ سجّل السبب.') },
      { when: { evidenceAny: ['strange-float'] }, text: L('Its serial number uses the same faded stamp as the strange float found on the mudflats.', 'ورقمه التسلسلي مطبوع بالختم الباهت نفسه الذي على العوّامة الغريبة التي وُجدت في السبخات.') },
    ],
    choices: [
      C('recover', L('Recover the probe', 'استعيدوا المجسّ'), 'bold',
        O('{name} pulls it free in a cloud of silt. Twenty-five years of deep-sea data, rescued.', 'انتزعه {name} وسط سحابة من الطين الناعم. خمسة وعشرون عاماً من بيانات الأعماق أُنقذت.', 'proud', [fl('twist:probe'), ev('probe-data')], 'impact'),
        { check: chk('strength', 4, ['grip']), fail: O('It’s stuck fast. You download what you can over a cable.', 'إنه عالق بإحكام. فنزّلتم ما استطعتم من بياناته عبر كابل.', 'worried', [fl('twist:probe'), ev('partial-probe')], 'screen') }),
      C('play', L('Play its last recording', 'شغّلوا آخر تسجيلاته'), 'clever',
        O('The last recording is a long, low sound — the same one from the lab. Underneath it, faint, is something like slow, enormous breathing.', 'آخر تسجيل صوت طويل عميق — الصوت نفسه الذي سُمع في المختبر. وتحته، خافتاً، ما يشبه تنفّساً بطيئاً هائلاً.', 'shocked', [fl('twist:probe'), ev('old-sound')], 'radio')),
      C('marks', L('Study the scratch marks', 'ادرسوا الخدوش'), 'careful',
        O('The marks are evenly spaced and far too wide for any crab. Whatever made them had something like hooks, or rings, or teeth.', 'الخدوش متباعدة بانتظام، وأعرض بكثير من أن يحدثها أيّ سرطان. ما أحدثها كان له ما يشبه الخطاطيف… أو الحلقات… أو الأسنان.', 'worried', [fl('twist:probe'), ev('probe-marks')], 'camera'),
        { check: chk('intellect', 4), fail: O('Silt keeps drifting over the marks. You come away with blurry photos and a bad feeling.', 'ظلّ الطين الناعم يغطّي الخدوش. فخرجتم بصور ضبابية وإحساس سيئ.', 'worried', [fl('twist:probe')], 'camera') }),
      C('alumni', L('Message the 1998 team', 'راسلوا فريق ١٩٩٨'), 'kind',
        O('You send a message up the tether: find the 1998 team. An hour later the answer comes down. “You found it? We heard it too. We never went back.”', 'أرسلتم رسالة إلى السفينة عبر الكابل الذي يربطها بالغوّاصة: ابحثوا عن فريق ١٩٩٨. وبعد ساعة نزل الردّ: «وجدتموه؟ نحن أيضاً سمعناه. ولم نعد إلى هناك قط.»', 'worried', [fl('twist:probe'), ev('alumni-reply')], 'radio')),
    ],
  },
  {
    id: 'tm-whalefall', mode: 'marine', kind: 'twist', biomes: ['midnight', 'trench'], phase: 'deep', props: ['whalefall'], fact: 'whalefall', featured: 'whale-fall',
    text: L('The searchlight slides over something pale and curved, then another, then dozens: ribs, each one taller than a person. A whale fall. Hagfish knot themselves through the bones, and the whole skeleton seems to move.',
      'يمرّ ضوء الكشّاف على عظام بيضاء كبيرة جداً في القاع، كل عظمة أطول من إنسان. إنه هيكل حوت مات منذ زمن ونزل إلى القاع. بين العظام أسماك طويلة تشبه الثعابين تتحرّك، فيبدو الهيكل كأنه يتحرّك.'),
    variants: [
      { when: { evidenceAny: SOUND_CLUES }, text: L('For a moment everyone wonders: is this where the sound came from — a whale’s last song?', 'تساءل الجميع للحظة: أمن هنا جاء الصوت… أهو آخر أغنية لحوت؟') },
      { when: { evidenceAny: ['snow-sample', 'creature-census'] }, text: L('The marine snow you sampled ends its journey in places like this: everything that sinks feeds someone.', 'الثلج البحري الذي أخذتم عيّنته ينتهي في أماكن كهذه: كل ما يغرق يصير غذاءً لكائن ما.') },
      { when: { evidenceAny: SHADOW_CLUES }, text: L('Was this the long shadow seen from the surface? No — this whale has been dead for years.', 'أكان هذا هو الظلّ الطويل الذي رأيتموه من السطح؟ لا — فهذا الحوت ميت منذ سنوات.') },
    ],
    choices: [
      C('study', L('Document the ecosystem', 'سجّلوا النظام البيئي'), 'careful',
        O('Crabs, hagfish, bone-eating worms: a whole community living on one whale. You document every species.', 'سرطانات، وأسماك جريث، وديدان تأكل العظام: مجتمع كامل يعيش على حوت واحد. سجّلتم كل الأنواع.', 'thinking', [fl('twist:whalefall'), di('whalefall'), ev('whalefall-survey')], 'camera')),
      C('respect', L('Pause for a moment of respect', 'توقّفوا لحظة احترام'), 'kind',
        O('Everyone goes quiet. {name} gently touches a bone. Even the hagfish seem to pause.', 'صمت الجميع. ولمس {name} عظمة برفق. حتى أسماك القاع بدت كأنها توقّفت.', 'thinking', [fl('twist:whalefall'), di('whalefall'), tr(1)], 'still')),
      C('song', L('Compare it with the mystery sound', 'قارنوه بالصوت الغامض'), 'clever',
        O('This whale has been dead for years — yet the sound was recorded last week. Whatever is still singing down here, it isn’t this one.', 'هذا الحوت ميت منذ سنوات — أما الصوت فقد سُجّل الأسبوع الماضي. أيّاً كان ما يزال يغنّي هنا، فليس هذا الحوت.', 'shocked', [fl('twist:whalefall'), di('whalefall'), ev('song-mismatch')], 'radio'),
        { check: chk('intellect', 4), fail: O('Maybe it was the whale’s last song, years ago. Maybe. The hydrophone stays quiet, as if it is listening too.', 'ربما كانت آخر أغنية للحوت قبل سنوات. ربما. ويبقى الميكروفون المائي صامتاً، كأنه يُصغي هو أيضاً.', 'thinking', [fl('twist:whalefall'), di('whalefall')], 'echo') }),
      C('closer', L('Let {name} approach the bones', 'دعوا {name} يقترب من العظام'), 'bold',
        O('{name} edges toward the ribs. All at once the hagfish untangle and slither away, as if something had told them to leave.', 'اقترب {name} من الأضلاع بحذر. وفجأة انفكّت أسماك القاع كلها وانسلّت بعيداً، كأن شيئاً أمرها بالرحيل.', 'worried', [fl('twist:whalefall'), di('whalefall'), ev('bone-sample')], 'swim')),
    ],
  },

  // ───────────── DEEP CLIMAXES ─────────────
  // Climax outcomes are quoted in the ending summary, so they read as standalone past-tense sentences.
  {
    id: 'km-leviathan', mode: 'marine', kind: 'climax', biomes: ['trench', 'midnight'], phase: 'deep', requires: { flag: ['legend:heard'] }, props: ['leviathan'], featured: 'deep-giant',
    text: L('The sonar fills edge to edge with a single shape, longer than the ship above. Grey, scarred skin slides past the glass for far too long — then an eye opens in the dark, as big as a plate, just as the old sailor said. It settles on {name}. (Legend or undiscovered animal? The game leaves it a mystery.)',
      'فجأة امتلأت شاشة جهاز كشف الأعماق بشكل واحد كبير جداً، أطول من السفينة التي في الأعلى. يمرّ أمام الزجاج جلد رمادي مليء بالجروح القديمة، ويستمرّ في المرور وقتاً طويلاً. ثم تنفتح في الظلام عين بحجم الصحن، كما قال البحّار العجوز تماماً، وتنظر إلى {name}. (هل هو حيوان لم يكتشفه العلماء أم مجرد أسطورة؟ اللعبة لا تجيب.)'),
    variants: [
      { when: { evidenceAny: SCALE_CLUES }, text: L('Along its scars, plate-sized scales catch the light — the same as the one pulled from the ghost net.', 'وعلى امتداد ندوبه تلمع حراشف بحجم الصحن — مثل الحرشفة التي انتُزعت من الشبكة المهجورة تماماً.') },
      { when: { evidenceAny: SOUND_CLUES }, text: L('The hydrophone picks up the long, low sound from the lab — coming from right outside the glass.', 'يلتقط الميكروفون المائي الصوت الطويل العميق الذي سُمع في المختبر — وهو يأتي من خلف الزجاج مباشرة.') },
      { when: { flag: ['sailor-gift'] }, text: L('In your pocket, the old sailor’s nose clip suddenly feels very heavy.', 'وفي جيوبكم يبدو مِلقط الأنف الذي أهداكم إياه البحّار العجوز ثقيلاً فجأة.') },
      { when: { evidenceAny: ['eyewitness-account'] }, text: L('Every detail matches the sailor’s account: the place, the depth, the eye.', 'كل تفصيل يطابق شهادة البحّار: المكان، والعمق، والعين.') },
    ],
    choices: [
      C('contact', L('Let {name} make contact', 'دعوا {name} يتواصل معه'), 'kind',
        O('{name} called out into the dark, and a deep, slow sound answered — the sound from the lab. Then the giant sank away, unhurried, into water no light has ever reached.', 'نادى {name} في الظلام، فأجابه صوت عميق بطيء — صوت المختبر نفسه. ثم غاص العملاق على مهل في مياه لم يبلغها ضوء قط.', 'shocked', [fl('saw-leviathan'), fl('leviathan-contact')], 'heart'),
        { check: chk('charm', 5, ['mimic', 'glow', 'echolocation']), fail: O('The giant turned away and the dark closed behind it. But you saw it. You definitely saw it.', 'استدار العملاق وانغلق الظلام خلفه. لكنكم رأيتموه. رأيتموه بلا أدنى شك.', 'shocked', [fl('saw-leviathan')], 'still') }),
      C('document', L('Capture scientific evidence', 'اجمعوا دليلاً علمياً'), 'clever',
        O('Sonar, footage, and a shed scale stuck to the hull: not proof, but the best evidence anyone has ever brought up from the deep.', 'بيانات سونار، وتسجيل مصوَّر، وحرشفة متساقطة علقت بهيكل الغوّاصة: ليس برهاناً قاطعاً، لكنه أقوى دليل صعد به أحد من الأعماق.', 'proud', [fl('saw-leviathan'), ev('leviathan-sonar'), ev('giant-scale')], 'camera'),
        { check: chk('intellect', 5, ['echolocation', 'nightVision']), fail: O('The footage came out blurry — legendary-monster blurry. The old sailor will still believe you.', 'جاء التسجيل ضبابياً — ضبابياً كصور الوحوش الأسطورية. لكن البحّار العجوز سيصدّقكم رغم ذلك.', 'laughing', [fl('saw-leviathan'), fl('blurry-proof')], 'camera') }),
      C('leave', L('Back away and leave it in peace', 'تراجعوا واتركوه بسلام'), 'careful',
        O('The team backed away and let it pass. Some mysteries deserve to stay in the deep, and Abyss-1 surfaced without a word.', 'تراجع الفريق وتركه يمرّ. بعض الألغاز تستحق أن تبقى في الأعماق، وصعدت «أبيس-١» إلى السطح دون كلمة.', 'thinking', [fl('saw-leviathan'), fl('left-in-peace'), tr(1)], 'still')),
      C('hold', L('Hold the searchlight on the eye', 'ثبّتوا الكشّاف على العين'), 'bold',
        O('The team held the light steady and did not look away — and neither did the eye. After a long, long minute it closed, and the giant was simply gone.', 'ثبّت الفريق الضوء ولم ينظر بعيداً — ولم تنظر بعيداً العين بنظرها أيضاً. وبعد دقيقة طويلة جداً انغلقت، واختفى العملاق ببساطة.', 'shocked', [fl('saw-leviathan'), ev('eye-footage')], 'still'),
        { check: chk('charm', 5), fail: O('The searchlight flickered. When it steadied, the eye was gone, and the sonar showed only empty water — empty, and very deep.', 'ارتعش ضوء الكشّاف. وحين استقرّ كانت العين قد اختفت، ولم يُظهر السونار إلا ماءً فارغاً… فارغاً، وعميقاً جداً.', 'worried', [fl('saw-leviathan')], 'flash') }),
    ],
  },
  {
    id: 'km-eruption', mode: 'marine', kind: 'climax', biomes: ['vents', 'trench', 'midnight'], phase: 'deep', props: ['eruption'], featured: 'tube-worms',
    text: L('The seafloor shudders. A new vent tears open beside the tube-worm field, spewing black water, and the alarm begins to scream. Power is dropping — and outside, in the churning dark, shapes are fleeing past the glass.',
      'يهتزّ قاع البحر بقوة. تنفتح فتحة جديدة في القاع قرب الديدان الحمراء ويخرج منها ماء أسود حارّ. يرنّ جرس الإنذار في الغوّاصة، والطاقة تقلّ. وخارج الزجاج حيوانات كثيرة تهرب في كل اتجاه.'),
    variants: [
      { when: { evidenceAny: HEAT_CLUES }, text: L('On the monitor, the same heat pulse from the Kubbar data appears — a hundred times stronger.', 'تظهر على الشاشة نبضة الحرارة نفسها التي رصدتها بيانات كبّر — لكنها أقوى مئة مرة.') },
      { when: { evidenceAny: ['worm-sample', 'vent-temp', 'iron-snail', 'crab-behaviour'] }, text: L('The colony you studied earlier lies right in the path of the plume.', 'المستعمرة التي درستموها قبل قليل تقع في طريق العمود الحارّ مباشرة.') },
      { when: { flag: ['rescued'] }, text: L('{name} has already saved one life on this trip. It is not ready to stop now.', 'لقد أنقذ {name} حياةً في هذه الرحلة من قبل، وليس مستعداً للتوقّف الآن.') },
    ],
    choices: [
      C('shield', L('Shield the tube-worm colony', 'احموا مستعمرة الديدان'), 'kind',
        O('{name} built a wall of rubble against the scalding plume, and the tube-worm colony survived.', 'بنى {name} جداراً من الركام في وجه العمود اللاهب، فنجت مستعمرة الديدان الأنبوبية.', 'proud', [fl('saved-animals')], 'impact'),
        { check: chk('strength', 6, ['armor', 'pressure', 'grip']), fail: O('Part of the colony was lost, but {name} saved everything it could reach.', 'فُقد جزء من المستعمرة، لكن {name} أنقذ كل ما استطاع الوصول إليه.', 'worried', [fl('saved-animals'), fl('creature-hurt')], 'impact') }),
      C('samples', L('Grab samples of the new vent', 'خذوا عيّنات من الفتحة الجديدة'), 'clever',
        O('A brand-new vent was sampled on its very first day. That is a scientific paper.', 'أُخذت عيّنات من فتحة جديدة تماماً في يومها الأول. هذه ورقة علمية بحدّ ذاتها.', 'proud', [fl('saved-evidence'), ev('new-vent-sample')], 'sample'),
        { check: chk('heat', 5, ['armor', 'pressure']), fail: O('It was too hot to get close, so the team took readings from a safe distance.', 'كانت شديدة الحرارة فلم يمكن الاقتراب منها، فأخذ الفريق قراءات من مسافة آمنة.', 'worried', [ev('vent-readings')], 'heat') }),
      C('surface', L('Emergency ascent', 'صعود طارئ'), 'careful',
        O('Ballast dropped, Abyss-1 rose fast and safe, and everyone came home.', 'أُلقيت الأثقال، فصعدت «أبيس-١» بسرعة وأمان، وعاد الجميع سالمين.', 'happy', [fl('safe-ascent')], 'sub')),
      C('guide', L('Light a path for the fleeing animals', 'أنيروا طريقاً للحيوانات الهاربة'), 'bold',
        O('The team swung the searchlight away from the plume, and the panicked crabs and fish followed the beam to safety.', 'وجّه الفريق الكشّاف بعيداً عن العمود الحارّ، فتبعت السرطانات والأسماك المذعورة الضوء إلى برّ الأمان.', 'proud', [fl('saved-animals')], 'flash'),
        { check: chk('intellect', 5), fail: O('Some animals followed the light; others vanished into the churn. The team did all it could.', 'تبعت بعض الحيوانات الضوء، واختفى بعضها في الاضطراب. فعل الفريق كل ما في وسعه.', 'worried', [fl('saved-animals')], 'flash') }),
    ],
  },
  {
    id: 'km-tether', mode: 'marine', kind: 'climax', biomes: ['twilight', 'midnight', 'trench'], phase: 'deep', props: ['tether'],
    text: L('A bang. The tether to the ship goes slack, and Abyss-1 begins to sink, its lights dying one by one. Something large drifts across the last working camera. Only {name} can reach the emergency beacon outside.',
      'صوت قوي مفاجئ! انقطع الكابل الذي يربط الغوّاصة بالسفينة. بدأت «أبيس-١» تنزل وحدها، وأضواؤها تنطفئ واحداً بعد الآخر. وأمام آخر كاميرا تعمل يمرّ شيء كبير. جهاز طلب النجدة موجود خارج الغوّاصة، ولا يستطيع الوصول إليه إلا {name}.'),
    variants: [
      { when: { flag: ['sub-checked'] }, text: L('The safety checks at the surface pay off: the backup battery is exactly where it should be.', 'آتى فحص السلامة على السطح ثماره: البطارية الاحتياطية في مكانها تماماً.') },
      { when: { flag: ['rode-outside'] }, text: L('{name} has been outside this hull before. It already knows the way to the beacon.', 'سبق لـ{name} أن ركب خارج هذا الهيكل، وهو يعرف الطريق إلى المنارة.') },
      { when: { evidenceAny: ['probe-marks', 'alumni-reply'] }, text: L('On the camera, the cut end of the tether shows long parallel scratches — just like the 1998 probe.', 'تُظهر الكاميرا طرف الحبل المقطوع وعليه خدوش طويلة متوازية — تماماً كخدوش مجسّ ١٩٩٨.') },
      { when: { flag: ['twist:squid'] }, text: L('A silver eye slides past the last camera. The squid has come back to watch.', 'تمرّ عين فضية أمام آخر كاميرا. لقد عاد الحبّار ليراقب.') },
    ],
    choices: [
      C('swim', L('Send {name} out to the beacon', 'أرسلوا {name} إلى المنارة'), 'bold',
        O('{name} swam out into the dark, flipped the beacon on, and the ship’s crane found Abyss-1 within minutes.', 'سبح {name} في الظلام وشغّل المنارة، فعثرت رافعة السفينة على «أبيس-١» في غضون دقائق.', 'proud', [fl('heroic-stand'), fl('safe-ascent')], 'swim'),
        { check: chk('swim', 6, ['swim', 'pressure', 'breatheWater']), fail: O('It took three tries and a lot of panic, but the beacon lit up and the ship found Abyss-1.', 'استغرق الأمر ثلاث محاولات وكثيراً من الذعر، لكن المنارة أضاءت وعثرت السفينة على «أبيس-١».', 'worried', [fl('safe-ascent'), fl('creature-hurt')], 'swim') }),
      C('fix', L('Repair the comms from inside', 'أصلحوا الاتصال من الداخل'), 'clever',
        O('With wires, tape and one long prayer, the radio crackled back to life: “Abyss-1, we hear you.”', 'بأسلاك وشريط لاصق ودعاء طويل، عاد اللاسلكي إلى الحياة بطقطقة: «أبيس-١، نسمعكم.»', 'thinking', [fl('safe-ascent')], 'radio'),
        { check: chk('intellect', 6), fail: O('The radio half-worked, and the ship found Abyss-1 an hour later. It was a very long hour.', 'عمل اللاسلكي جزئياً، فعثرت السفينة على «أبيس-١» بعد ساعة. وكانت ساعة طويلة جداً.', 'worried', [fl('safe-ascent'), en(-1)], 'radio') }),
      C('ballast', L('Drop all ballast and rise blind', 'ألقوا كل الأثقال واصعدوا دون رؤية'), 'careful',
        O('The team dropped every weight on board, and Abyss-1 rose through the black like a bubble until sunlight found the window again.', 'ألقى الفريق كل الأثقال، فصعدت «أبيس-١» عبر السواد كفقاعة حتى عاد ضوء الشمس إلى النافذة.', 'happy', [fl('safe-ascent')], 'sub'),
        { check: chk('intellect', 5), fail: O('The sub rose crooked and slow, spinning in the dark, but it reached the surface at last.', 'صعدت الغوّاصة مائلة بطيئة تدور في الظلام، لكنها بلغت السطح أخيراً.', 'worried', [fl('safe-ascent'), en(-1)], 'sub') }),
      C('sos', L('Keep everyone calm and flash an SOS', 'حافظوا على هدوء الفريق وأرسلوا نداء استغاثة'), 'kind',
        O('Everyone stayed calm and took turns flashing SOS with the last light, until the ship’s robot sub answered with a light of its own.', 'حافظ الجميع على هدوئهم وتناوبوا على إرسال نداء الاستغاثة بآخر ضوء، حتى ردّت الغوّاصة الآلية التابعة للسفينة بضوء من عندها.', 'proud', [fl('safe-ascent'), tr(1)], 'flash'),
        { check: chk('charm', 4), fail: O('For a long time, only strange lights answered the SOS. Then, at last, the ship’s robot sub arrived.', 'لوقت طويل لم تردّ على نداء الاستغاثة إلا أضواء غريبة. ثم وصلت أخيراً الغوّاصة الآلية التابعة للسفينة.', 'worried', [fl('safe-ascent'), en(-1)], 'flash') }),
    ],
  },
];
