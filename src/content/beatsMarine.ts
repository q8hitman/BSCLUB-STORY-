import type { BeatTemplate } from '../engine/types';
import { C, L, O, chk, di, en, ev, fl, rel, tr } from './dsl';

// Marine Science Club collaboration mode. Phase 1: Surface Waters. Phase 2: The Deep.
// Real biology appears in "Real Science" fact boxes; the sailor's legend is always framed as a story.
export const MARINE_BEATS: BeatTemplate[] = [
  // ───────────── HOOKS ─────────────
  {
    id: 'hm-reef', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'boat'],
    text: L('The Marine Science Club bursts into the BSC lab: patches of reef near Kubbar Island are turning pale, fast. They need a field partner that can go where divers can’t. Everyone turns to look at {name}.',
      'نادي علوم البحار دخل مختبر النادي مستعجل: أجزاء من شعاب جزيرة كبّر قاعدة تبيض بسرعة. يحتاجون شريك ميداني يوصل للأماكن اللي الغواصين ما يوصلونها. الكل التفت على {name}.'),
    choices: [
      C('go', L('Pack the boat and go', 'تجهيز الطراد والانطلاق'), 'bold',
        O('By sunrise you’re speeding south across the Gulf, {name} leaning into the spray.', 'مع الفجر كنتوا مسرعين جنوب الخليج و{name} مستمتع بالرذاذ.', 'happy', [fl('hook:reef'), ev('water-temp-log')], 'boat')),
      C('data', L('Review their temperature data first', 'مراجعة بيانات الحرارة أول'), 'clever',
        O('The data shows a hot-water patch that doesn’t match the weather. Something else is going on.', 'البيانات تبيّن بقعة ماي حار ما تطابق الطقس. فيه شي ثاني يصير.', 'thinking', [fl('hook:reef'), ev('anomaly-data')], 'screen'),
        { check: chk('intellect', 4), fail: O('The spreadsheet has 40 tabs. You’ll figure it out on the boat.', 'الشيت فيه ٤٠ تاب. بتفهمونه بالطراد.', 'laughing', [fl('hook:reef')], 'screen') }),
    ],
  },
  {
    id: 'hm-sound', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'hydrophone'],
    text: L('The Marine Science Club’s underwater microphone picked up a sound no one can identify — long, low, and enormous. They play it in the BSC lab. {name} answers it.',
      'ميكروفون نادي علوم البحار تحت الماي لقط صوت محد قدر يعرفه — طويل وعميق وضخم. شغّلوه بمختبر النادي… و{name} رد عليه!'),
    choices: [
      C('record', L('Record {name}’s reply', 'تسجيل رد {name}'), 'clever',
        O('The waveforms match in a strange way. Whatever it is, {name} recognises it.', 'الموجات تتطابق بشكل غريب. أياً كان، {name} يعرفه.', 'shocked', [fl('hook:sound'), ev('sound-match')], 'radio')),
      C('sail', L('Head to where it was recorded', 'التوجّه لمكان التسجيل'), 'bold',
        O('Coordinates loaded. Snacks loaded. {name} loaded. Let’s go.', 'الإحداثيات جاهزة. السناكات جاهزة. {name} جاهز. يلا.', 'happy', [fl('hook:sound')], 'boat')),
    ],
  },
  {
    id: 'hm-nets', mode: 'marine', kind: 'hook', biomes: ['lab'], phase: 'surface', props: ['lab', 'net'],
    text: L('A fisherman brought the Marine Science Club a ghost net — an abandoned fishing net — with strange scales caught in it. Big scales. The clubs team up, and {name} is very interested.',
      'صياد جاب لنادي علوم البحار شبكة مهجورة فيها حراشف غريبة عالقة… حراشف كبيرة. الناديين تعاونوا، و{name} مهتم وايد.'),
    choices: [
      C('scale', L('Analyse the scales', 'تحليل الحراشف'), 'clever',
        O('The scales match no species in the database. They also smell like… adventure.', 'الحراشف ما تطابق أي نوع بقاعدة البيانات. وريحتها… مغامرة.', 'thinking', [fl('hook:nets'), ev('mystery-scale')], 'sample')),
      C('nets', L('Plan a ghost-net clean-up on the way', 'التخطيط لتنظيف الشباك بالطريق'), 'kind',
        O('Two clubs, one boat, a lot of bin bags. The sea will thank you.', 'ناديين وطراد واحد وأكياس زبالة وايد. البحر بيشكركم.', 'happy', [fl('hook:nets'), fl('cleanup'), tr(1)], 'heart')),
    ],
  },

  // ───────────── SURFACE EXPLORE ─────────────
  {
    id: 'em-reef', mode: 'marine', kind: 'explore', biomes: ['reef'], phase: 'surface', props: ['coral', 'fish'], fact: 'reef-heat',
    text: L('{place} explodes with colour — parrotfish, sweetlips, a turtle cruising by. But some corals are bone-white.', '{place} مليانة ألوان — سمك ببغاء، فرش، وسلحفاة تمر. بس بعض المرجان أبيض مثل العظم.'),
    variants: [{ when: { capAny: ['breatheWater'] }, text: L('{name} can stay down as long as it likes. Show-off.', '{name} يقدر يقعد تحت قد ما يبي. شايف نفسه.') }],
    choices: [
      C('survey', L('Do a careful coral survey', 'مسح المرجان بعناية'), 'careful',
        O('You map healthy vs bleached coral. These Gulf corals are tough — they survive water that would kill most reefs.', 'رسمتوا خريطة المرجان السليم والمبيض. مرجان الخليج قوي — يعيش بماي يقتل أغلب الشعاب.', 'thinking', [di('reef-heat'), ev('coral-map')], 'map'),
        { check: chk('swim', 4, ['swim', 'breatheWater']), fail: O('The current keeps pushing you off the transect line. Half a map.', 'التيار كل شوي يبعدكم عن خط المسح. نص خريطة.', 'worried', [di('reef-heat')], 'splash') }),
      C('turtle', L('Follow the turtle', 'اللحاق بالسلحفاة'), 'bold',
        O('The turtle leads you to a warm-water vent in the reef — the source of the hot patch.', 'السلحفاة وصلتكم لفتحة ماي دافي بالشعاب… مصدر البقعة الحارة.', 'shocked', [ev('warm-vent')], 'swim'),
        { check: chk('swim', 5, ['swim']), fail: O('Turtles are faster than they look. Much faster.', 'السلاحف أسرع من شكلها. وايد أسرع.', 'laughing', [en(-1)], 'swim') }),
      C('photo', L('Take photos for the club', 'تصوير للنادي'), 'kind',
        O('The photos are stunning. The Marine Science Club’s account will explode.', 'الصور خرافية. حساب نادي علوم البحار بينفجر.', 'proud', [ev('reef-photos'), tr(1)], 'camera')),
    ],
  },
  {
    id: 'em-mudflat', mode: 'marine', kind: 'explore', biomes: ['mudflat'], phase: 'surface', props: ['mud', 'mudskipper'], fact: 'mud-skipper',
    text: L('At low tide, {place} shine silver. Mudskippers skip and flex their fins at each other like tiny wrestlers.', 'وقت الجزر {place} تلمع فضّي. نطّاطات الطين تنط وتستعرض زعانفها على بعض مثل مصارعين صغار.'),
    choices: [
      C('watch', L('Watch a mudskipper duel', 'مشاهدة نزال نطّاطات الطين'), 'careful',
        O('They puff up and raise their dorsal fins to defend their mud puddles. Adorable territorial drama.', 'تنتفخ وترفع زعانفها تدافع عن بركها. دراما إقليمية لطيفة.', 'laughing', [di('mud-skipper'), ev('skipper-behaviour')], 'binoculars')),
      C('birds', L('Count the wading birds', 'عدّ الطيور الخواضة'), 'clever',
        O('Crab-plovers, herons, flamingos: the mudflats are a crucial bird stop on the migration route.', 'حنكور وبلشون وفلامنقو: السبخات محطة مهمة للطيور المهاجرة.', 'thinking', [ev('bird-count')], 'binoculars'),
        { check: chk('intellect', 4), fail: O('You counted the same flamingo nine times.', 'عدّيتوا نفس الفلامنقو تسع مرات.', 'laughing', [], 'binoculars') }),
      C('mudbath', L('Let {name} enjoy the mud', 'خلّوا {name} يستمتع بالطين'), 'silly',
        O('{name} rolls in the mud with total joy. The boat will never be clean again.', '{name} يتمرغ بالطين بسعادة تامة. الطراد ما راح ينظف أبد.', 'laughing', [en(1), tr(1)], 'splash')),
    ],
  },
  {
    id: 'em-seagrass', mode: 'marine', kind: 'explore', biomes: ['seagrass'], phase: 'surface', props: ['seagrass', 'dugong'], fact: 'seagrass-dugong',
    text: L('Long green meadows sway in {place}. Something large and gentle is grazing: a dugong.', 'مروج خضرا طويلة تتمايل في {place}. شي كبير وهادي قاعد يرعى… أطوم.'),
    choices: [
      C('distance', L('Watch from a respectful distance', 'المراقبة من مسافة محترمة'), 'careful',
        O('The dugong keeps grazing, unbothered. You record feeding trails in the seagrass.', 'الأطوم كمّل رعي بدون إزعاج. سجّلتوا مسارات الأكل بالعشب.', 'happy', [di('seagrass-dugong'), ev('dugong-trails')], 'binoculars')),
      C('closer', L('Let {name} swim closer', 'خلّوا {name} يقرب'), 'bold',
        O('The dugong lets {name} swim alongside. A once-in-a-lifetime moment.', 'الأطوم خلّى {name} يسبح جنبه. لحظة ما تتكرر.', 'proud', [fl('dugong-friend'), tr(1)], 'heart'),
        { check: chk('charm', 5, ['swim']), fail: O('Too close — the dugong drifts away. Lesson: wild animals need space.', 'قرّبتوا وايد — الأطوم ابتعد. الدرس: الحيوانات البرية تحتاج مساحة.', 'worried', [tr(-1)], 'swim') }),
      C('carbon', L('Measure the seagrass', 'قياس الأعشاب البحرية'), 'clever',
        O('Seagrass stores carbon and shelters baby fish. These meadows are worth protecting.', 'الأعشاب البحرية تخزّن الكربون وتحمي صغار السمك. هالمروج تستاهل الحماية.', 'thinking', [ev('seagrass-data')], 'sample')),
    ],
  },

  // ───────────── SURFACE ENCOUNTERS ─────────────
  {
    id: 'nm-diver', mode: 'marine', kind: 'encounter', biomes: ['reef', 'seagrass'], phase: 'surface', props: ['diver'], npc: 'diver',
    text: L('A Marine Science Club diver surfaces beside you: {npc}. “Is that thing on our permit?” she asks, eyeing {name}.', 'غوّاصة من نادي علوم البحار طلعت جنبكم: {npc}. «هذا الشي مسجّل بتصريحنا؟» تسأل وهي تطالع {name}.'),
    choices: [
      C('team', L('Invite her to dive together', 'دعوتها تغوص معاكم'), 'kind',
        O('She teaches {name} proper dive signals. It learns “OK” and “shark” immediately.', 'علّمت {name} إشارات الغوص. تعلّم «تمام» و«قرش» على طول.', 'happy', [fl('met:diver'), rel('diver', 2)], 'heart')),
      C('data', L('Swap data with her', 'تبادل البيانات'), 'clever',
        O('Her sonar logs show something big passing below the reef at night.', 'سجلات السونار عندها تبيّن شي كبير يمر تحت الشعاب بالليل.', 'thinking', [fl('met:diver'), rel('diver', 1), ev('sonar-log')], 'screen')),
    ],
  },
  {
    id: 'nm-fisher', mode: 'marine', kind: 'encounter', biomes: ['mudflat', 'seagrass', 'reef'], phase: 'surface', props: ['dhow'], npc: 'fisher',
    text: L('A wooden dhow drifts nearby. {npc} waves. “Careful out there. The sea’s been strange lately.”', 'لنج خشبي قريب منكم. {npc} يأشّر: «انتبهوا. البحر صاير غريب هالأيام.»'),
    choices: [
      C('listen', L('Ask what he has seen', 'سؤاله شنو شاف'), 'kind',
        O('Fish acting oddly, warm patches, and once, a shadow longer than his boat.', 'سمك يتصرف بغرابة، بقع دافية، ومرة ظل أطول من لنجه.', 'thinking', [fl('met:fisher'), rel('fisher', 2), ev('fisher-report')], 'heart')),
      C('help', L('Help him haul a ghost net', 'مساعدته بسحب شبكة مهجورة'), 'bold',
        O('Together you pull an abandoned net out of the water. Two turtles swim free.', 'سحبتوا مع بعض شبكة مهجورة. سلحفاتين تحرروا.', 'proud', [fl('met:fisher'), rel('fisher', 2), fl('rescued')], 'impact'),
        { check: chk('strength', 5, ['grip']), fail: O('The net is heavy. You get half of it out and mark the rest for the coast guard.', 'الشبكة ثقيلة. طلّعتوا نصها وعلّمتوا الباقي لخفر السواحل.', 'worried', [fl('met:fisher'), rel('fisher', 1)], 'impact') }),
    ],
  },

  // ───────────── THE SAILOR'S LEGEND (optional per run) ─────────────
  {
    id: 'lm-tale', mode: 'marine', kind: 'legend', biomes: ['mudflat', 'reef', 'seagrass'], phase: 'surface', props: ['sailor', 'dhow'], npc: 'sailor', fact: 'pearl-history',
    text: L('On the harbour wall sits {npc}. “When I was a young pearl diver,” he says, “I saw something in the deep water. An eye as big as a plate. A body longer than our boom. Nobody believed me.” (This is his story — the game never claims it’s fact.)',
      'على جدار الفرضة قاعد {npc}. «لما كنت غواص صغير على اللؤلؤ،» يقول، «شفت شي بالماي العميق. عين كبر الصحن، وجسم أطول من البوم. محد صدّقني.» (هذي قصته — اللعبة ما تقول إنها حقيقة.)'),
    choices: [
      C('believe', L('Tell him you believe him', 'تقولون له إنكم مصدّقينه'), 'kind',
        O('His eyes shine. He gives you an old pearl-diving nose clip “for luck — and for the deep.”', 'عيونه لمعت. عطاكم فطام غوص قديم «للحظ… وللأعماق.»', 'happy', [fl('legend:heard'), fl('sailor-gift'), rel('sailor', 3), di('pearl-history')], 'heart')),
      C('details', L('Ask for exact details', 'سؤاله عن التفاصيل بالضبط'), 'clever',
        O('He remembers the place, the season, the moon. You write it all down as an eyewitness account.', 'يتذكر المكان والموسم والقمر. كتبتوا كل شي كشهادة شاهد عيان.', 'thinking', [fl('legend:heard'), ev('eyewitness-account'), rel('sailor', 1), di('pearl-history')], 'map')),
      C('skeptic', L('Politely point out it could be a whale shark', 'تقولون بأدب إنه يمكن قرش حوتي'), 'careful',
        O('“Maybe,” he smiles. “But whale sharks don’t look back at you.”', 'ابتسم: «يمكن… بس القرش الحوتي ما يطالعك.»', 'thinking', [fl('legend:heard'), di('sea-whaleshark')], 'still')),
    ],
  },

  // ───────────── PHASE TRANSITION ─────────────
  {
    id: 'pm-descend', mode: 'marine', kind: 'phase', biomes: ['openSea'], phase: 'deep', props: ['ship', 'sub'],
    text: L('Phase two: The Deep. The research ship reaches open water in the Arabian Sea, where the seafloor drops away. The submersible BSC Abyss-1 is lowered over the side. The Gulf is shallow; to reach the deep, you had to come here.',
      'المرحلة الثانية: الأعماق. سفينة الأبحاث وصلت بحر العرب المفتوح حيث القاع ينزل. الغوّاصة «أبيس-١» نزلت من جنب السفينة. الخليج ضحل، وعشان توصلون للأعماق لازم تجون هني.'),
    variants: [{ when: { flag: ['legend:heard'] }, text: L('{name} clutches the old sailor’s story like a map.', '{name} ماسك قصة البحّار مثل الخريطة.') }],
    choices: [
      C('check', L('Run full safety checks', 'فحص سلامة كامل'), 'careful',
        O('Every seal, every battery, every snack: checked. Abyss-1 is ready.', 'كل فتحة، كل بطارية، كل سناك: انفحص. أبيس-١ جاهزة.', 'thinking', [en(1), fl('sub-checked')], 'sub')),
      C('ride', L('Let {name} ride outside, on the hull', 'خلّوا {name} يركب برا على الجسم'), 'bold',
        O('{name} clings to the hull, delighted, as the blue turns to black.', '{name} متمسّك بالغوّاصة فرحان، والأزرق يتحول أسود.', 'shocked', [fl('rode-outside')], 'sub'),
        { requires: { capAny: ['swim', 'breatheWater', 'grip'] }, check: chk('swim', 4, ['breatheWater', 'pressure']), fail: O('Two hundred metres down, {name} knocks on the window to be let in.', 'على عمق ميتين متر، {name} يطق الدريشة يبي يدخل.', 'laughing', [en(-1)], 'sub') }),
      C('playlist', L('Choose the dive playlist', 'اختيار قائمة الأغاني للغوص'), 'silly',
        O('The duck picks old Kuwaiti sea songs. Everyone hums. Morale: maximum.', 'البطة اختارت أغاني بحرية كويتية قديمة. الكل يدندن. المعنويات: فوق.', 'laughing', [tr(2)], 'sub')),
    ],
  },

  // ───────────── DEEP EXPLORE ─────────────
  {
    id: 'em-twilight', mode: 'marine', kind: 'explore', biomes: ['twilight'], phase: 'deep', props: ['lanternfish', 'jelly'], fact: 'twilight-dvm',
    text: L('Two hundred metres down, {place} glows a dim blue. Clouds of lanternfish drift past, waiting for night to rise and feed.', 'على عمق ميتين متر، {place} تضوي أزرق خافت. غيوم أسماك فانوس تمر، تنتظر الليل عشان تطلع تاكل.'),
    choices: [
      C('migrate', L('Track the migration', 'تتبّع الهجرة'), 'clever',
        O('Your sonar shows a living layer rising — the biggest daily migration on Earth.', 'السونار يبيّن طبقة حية قاعدة تطلع — أكبر هجرة يومية على الأرض.', 'proud', [di('twilight-dvm'), ev('migration-sonar')], 'scan')),
      C('lights', L('Turn off the lights and watch', 'إطفاء الأضواء والمشاهدة'), 'careful',
        O('In the dark, tiny lights blink everywhere — a whole hidden city.', 'بالظلام، أضواء صغيرة ترمش بكل مكان — مدينة مخفية كاملة.', 'shocked', [ev('light-patterns')], 'stars')),
      C('chat', L('Have {name} flash back at them', 'خلّوا {name} يرد عليهم بالضوء'), 'silly',
        O('{name} flashes. The fish flash back. Is this… a conversation?', '{name} ومض… والسمك ومض عليه. هذي… سوالف؟', 'laughing', [ev('flash-dialogue'), fl('light-talk')], 'flash'),
        { requires: { capAny: ['glow'] }, check: chk('charm', 4, ['glow']), fail: O('The fish scatter. Rude.', 'السمك تشتت. قليلين أدب.', 'laughing', [], 'flash') }),
    ],
  },
  {
    id: 'em-midnight', mode: 'marine', kind: 'explore', biomes: ['midnight'], phase: 'deep', props: ['angler', 'snow'], fact: 'midnight-light',
    text: L('Below a thousand metres, {place} is black except for living lights. Marine snow — tiny bits of falling life — drifts past like a slow blizzard.', 'تحت ألف متر، الظلام في {place} تام إلا من أضواء حية. «ثلج البحر» — فتات حي صغير يطيح — ينزل مثل عاصفة بطيئة.'),
    variants: [{ when: { capAny: ['nightVision', 'echolocation'] }, text: L('{name} can sense shapes no camera can see.', '{name} يحس بأشكال ما تشوفها أي كاميرا.') }],
    choices: [
      C('angler', L('Film the anglerfish', 'تصوير سمكة أبو الشص'), 'careful',
        O('A perfect shot of its glowing lure. Most animals down here make their own light.', 'لقطة مثالية لطُعمها المضيء. أغلب الحيوانات هني تصنع ضوءها.', 'proud', [di('midnight-light'), ev('angler-footage')], 'camera'),
        { check: chk('stealth', 4), fail: O('It snaps at the camera. The footage is mostly teeth.', 'عضّت الكاميرا. التصوير كله أسنان.', 'shocked', [], 'camera') }),
      C('snow', L('Sample the marine snow', 'أخذ عيّنة من ثلج البحر'), 'clever',
        O('Your sample is full of life and carbon heading for the seafloor. Fascinating.', 'العيّنة مليانة حياة وكربون رايح للقاع. شي رهيب.', 'thinking', [ev('snow-sample')], 'sample')),
      C('lure', L('Let {name} use its own glow', 'خلّوا {name} يستخدم ضوءه'), 'bold',
        O('Dozens of curious creatures gather around {name}. It’s like a deep-sea party.', 'عشرات الكائنات الفضولية تجمّعت حول {name}. مثل حفلة بالأعماق.', 'happy', [ev('creature-census'), fl('deep-party')], 'flash'),
        { requires: { capAny: ['glow'] }, check: chk('charm', 4, ['glow']), fail: O('Something large comes to the party too. You leave early.', 'شي كبير جا الحفلة بعد. طلعتوا بدري.', 'shocked', [en(-1)], 'flash') }),
    ],
  },
  {
    id: 'em-vents', mode: 'marine', kind: 'explore', biomes: ['vents'], phase: 'deep', props: ['smokers', 'tubeworms'], fact: 'vents-chemo',
    text: L('Black chimneys pour superheated water into {place}. Around them: red-plumed tube worms, white crabs, and life that has never seen the sun.', 'مداخن سودا تطلع ماي حار جداً في {place}. حولها: ديدان أنبوبية حمرا، سرطانات بيضا، وحياة عمرها ما شافت الشمس.'),
    choices: [
      C('worms', L('Study the tube worms', 'دراسة الديدان الأنبوبية'), 'careful',
        O('No mouth, no gut — bacteria inside them turn chemicals into food. Life without sunlight!', 'لا فم ولا معدة — بكتيريا داخلها تحوّل الكيماويات لأكل. حياة بدون شمس!', 'shocked', [di('vents-chemo'), ev('worm-sample')], 'sample')),
      C('temp', L('Measure the chimney temperature', 'قياس حرارة المدخنة'), 'clever',
        O('Over 350°C — but the pressure stops it from boiling. Physics is wild.', 'فوق ٣٥٠ درجة — بس الضغط يمنعه يغلي. الفيزياء جنون.', 'thinking', [ev('vent-temp')], 'scan'),
        { check: chk('heat', 4, ['armor', 'pressure']), fail: O('The probe melts a little. Science has costs.', 'المجس ذاب شوي. العلم له ثمن.', 'worried', [], 'heat') }),
      C('snail', L('Search for the scaly-foot snail', 'البحث عن حلزون القدم الحرشفية'), 'bold',
        O('Found one! Its foot is armoured with iron sulphide scales. Real-life metal snail.', 'لقيتوا واحد! رجله مدرّعة بحراشف كبريتيد الحديد. حلزون معدني حقيقي.', 'proud', [ev('iron-snail')], 'scan'),
        { check: chk('intellect', 5, ['heatSense', 'scent']), fail: O('Lots of crabs. No snail. The crabs seem smug.', 'سرطانات وايد ولا حلزون. السرطانات شكلها شايفة نفسها.', 'laughing', [], 'scan') }),
    ],
  },

  // ───────────── DEEP TWISTS ─────────────
  {
    id: 'tm-squid', mode: 'marine', kind: 'twist', biomes: ['twilight', 'midnight'], phase: 'deep', props: ['squid'], fact: 'squid-eye',
    text: L('Something taps the window. An eye — enormous, silver, curious — fills the glass. A giant squid, very real, is inspecting {name}.', 'شي طق الدريشة. عين — ضخمة وفضية وفضولية — مالية الزجاج. حبّار عملاق، حقيقي، قاعد يفحص {name}.'),
    choices: [
      C('still', L('Stay still and film', 'الثبات والتصوير'), 'careful',
        O('Thirty seconds of footage of a living giant squid. Scientists dream of this.', 'ثلاثين ثانية تصوير لحبّار عملاق حي. العلماء يحلمون بهذا.', 'shocked', [fl('twist:squid'), di('squid-eye'), ev('squid-footage')], 'camera')),
      C('wave', L('Have {name} wave a limb', 'خلّوا {name} يلوّح'), 'kind',
        O('The squid touches the glass where {name} waves, then glides into the dark.', 'الحبّار لمس الزجاج مكان ما {name} يلوّح، وبعدين اختفى بالظلام.', 'happy', [fl('twist:squid'), di('squid-eye'), fl('squid-wave')], 'heart')),
    ],
  },
  {
    id: 'tm-probe', mode: 'marine', kind: 'twist', biomes: ['midnight', 'vents', 'twilight'], phase: 'deep', props: ['probe'],
    text: L('Half-buried in sediment: an old research probe with a faded label — “Marine Science Club, 1998”. It’s still recording.', 'نص مدفون بالرواسب: مجس بحث قديم عليه ليبل باهت — «نادي علوم البحار، ١٩٩٨». وللحين يسجّل!'),
    choices: [
      C('recover', L('Recover the probe', 'استرجاع المجس'), 'bold',
        O('{name} pulls it free. Twenty-five years of deep-sea data, rescued.', '{name} سحبه. خمسة وعشرين سنة بيانات أعماق… انقذت.', 'proud', [fl('twist:probe'), ev('probe-data')], 'impact'),
        { check: chk('strength', 4, ['grip']), fail: O('It’s stuck. You download what you can over a cable.', 'عالق. حمّلتوا اللي تقدرون عن طريق كيبل.', 'worried', [fl('twist:probe'), ev('partial-probe')], 'screen') }),
      C('play', L('Play its last recording', 'تشغيل آخر تسجيل'), 'clever',
        O('The last recording is a long, low sound… the same as the one in the lab.', 'آخر تسجيل صوت طويل وعميق… نفس اللي بالمختبر.', 'shocked', [fl('twist:probe'), ev('old-sound')], 'radio')),
    ],
  },
  {
    id: 'tm-whalefall', mode: 'marine', kind: 'twist', biomes: ['midnight', 'trench'], phase: 'deep', props: ['whalefall'], fact: 'whalefall',
    text: L('The lights reveal a huge skeleton on the seafloor: a whale fall. Hagfish, crabs and bone-eating worms swarm over it. The “mystery sound” fades — maybe it was the whale’s final song years ago?', 'الأضواء كشفت هيكل ضخم بالقاع: حوت ساقط. أسماك الجريث وسرطانات وديدان تاكل العظم مالية المكان. «الصوت الغامض» يخف… يمكن كان آخر أغنية للحوت من سنين؟'),
    choices: [
      C('study', L('Document the ecosystem', 'توثيق النظام البيئي'), 'careful',
        O('One whale can feed this community for decades. You document every species.', 'حوت واحد ممكن يغذّي هالمجتمع لعشرات السنين. وثّقتوا كل الأنواع.', 'thinking', [fl('twist:whalefall'), di('whalefall'), ev('whalefall-survey')], 'camera')),
      C('respect', L('Pause for a moment of respect', 'وقفة احترام'), 'kind',
        O('Everyone goes quiet. {name} gently touches a bone. Even the hagfish seem to pause.', 'الكل سكت. {name} لمس عظمة بهدوء. حتى الجريث كأنه وقف.', 'thinking', [fl('twist:whalefall'), di('whalefall'), tr(1)], 'still')),
    ],
  },

  // ───────────── DEEP CLIMAXES ─────────────
  {
    id: 'km-leviathan', mode: 'marine', kind: 'climax', biomes: ['trench', 'midnight'], phase: 'deep', requires: { flag: ['legend:heard'] }, props: ['leviathan'],
    text: L('The sonar fills with a shape longer than the ship above. An eye opens in the dark — as big as a plate. Just like the old sailor said. It is watching {name}. (Legend or undiscovered animal? The game leaves it a mystery.)',
      'السونار امتلى بشكل أطول من السفينة اللي فوق. عين تنفتح بالظلام — كبر الصحن. مثل ما قال البحّار القديم بالضبط. وقاعدة تطالع {name}. (أسطورة ولا حيوان ما انكشف؟ اللعبة تخلّيها لغز.)'),
    choices: [
      C('contact', L('Let {name} make contact', 'خلّوا {name} يتواصل'), 'kind',
        O('{name} calls out. A deep, slow sound answers — the sound from the lab. Then the giant sinks away, unhurried.', '{name} نادى. صوت عميق وبطيء رد — نفس صوت المختبر. وبعدين العملاق نزل بهدوء.', 'shocked', [fl('saw-leviathan'), fl('leviathan-contact')], 'heart'),
        { check: chk('charm', 5, ['mimic', 'glow', 'echolocation']), fail: O('The giant turns away and vanishes. But you saw it. You definitely saw it.', 'العملاق لف واختفى. بس شفتوه… أكيد شفتوه.', 'shocked', [fl('saw-leviathan')], 'still') }),
      C('document', L('Capture scientific evidence', 'جمع دليل علمي'), 'clever',
        O('Sonar, footage, a shed scale on the hull. Not proof — but the best evidence anyone has ever had.', 'سونار وتصوير وحرشفة على جسم الغوّاصة. مو إثبات قاطع — بس أقوى دليل حصّله أحد.', 'proud', [fl('saw-leviathan'), ev('leviathan-sonar'), ev('giant-scale')], 'camera'),
        { check: chk('intellect', 5, ['echolocation', 'nightVision']), fail: O('The footage is blurry. Bigfoot-level blurry. The old sailor will still believe you.', 'التصوير مغبّش… مغبّش مثل صور البيغ فوت. بس البحّار القديم بيصدّقكم.', 'laughing', [fl('saw-leviathan'), fl('blurry-proof')], 'camera') }),
      C('leave', L('Back away and leave it in peace', 'الابتعاد وتركه بسلام'), 'careful',
        O('Some mysteries deserve to stay in the deep. You surface without a word.', 'بعض الألغاز تستاهل تبقى بالأعماق. طلعتوا بدون ولا كلمة.', 'thinking', [fl('saw-leviathan'), fl('left-in-peace'), tr(1)], 'still')),
    ],
  },
  {
    id: 'km-eruption', mode: 'marine', kind: 'climax', biomes: ['vents', 'trench', 'midnight'], phase: 'deep', props: ['eruption'],
    text: L('The seafloor shudders. A new vent cracks open beside the tube-worm field, and the submersible’s alarm screams. Power is dropping.', 'القاع يرجف. فتحة جديدة انفتحت جنب حقل الديدان، وإنذار الغوّاصة يصرخ. الطاقة قاعدة تنزل.'),
    choices: [
      C('shield', L('Shield the tube-worm colony', 'حماية مستعمرة الديدان'), 'kind',
        O('{name} redirects the hot plume with a wall of rubble. The colony survives.', '{name} حوّل العمود الحار بجدار ركام. المستعمرة نجت.', 'proud', [fl('saved-animals')], 'impact'),
        { check: chk('strength', 6, ['armor', 'pressure', 'grip']), fail: O('Part of the colony is lost. {name} saves what it can.', 'جزء من المستعمرة راح. {name} أنقذ اللي يقدر.', 'worried', [fl('saved-animals'), fl('creature-hurt')], 'impact') }),
      C('samples', L('Grab samples of the new vent', 'أخذ عينات الفتحة الجديدة'), 'clever',
        O('A brand-new vent, sampled on its first day. That’s a paper.', 'فتحة جديدة تماماً، عيّنتها من أول يوم. هذي ورقة علمية.', 'proud', [fl('saved-evidence'), ev('new-vent-sample')], 'sample'),
        { check: chk('heat', 5, ['armor', 'pressure']), fail: O('Too hot to get close. You get readings from a distance.', 'حار وايد. أخذتوا قراءات من بعيد.', 'worried', [ev('vent-readings')], 'heat') }),
      C('surface', L('Emergency ascent', 'صعود طارئ'), 'careful',
        O('Ballast dropped. Abyss-1 rises fast and safe. Everyone is fine.', 'الأثقال انرمت. أبيس-١ طلعت بسرعة وبأمان. الكل بخير.', 'happy', [fl('safe-ascent')], 'sub')),
    ],
  },
  {
    id: 'km-tether', mode: 'marine', kind: 'climax', biomes: ['twilight', 'midnight', 'trench'], phase: 'deep', props: ['tether'],
    text: L('The tether to the ship snaps. Abyss-1 drifts, lights fading. Only {name} can reach the emergency beacon outside.', 'الحبل اللي يربط بالسفينة انقطع. أبيس-١ تنجرف والأضواء تخف. بس {name} يقدر يوصل لمنارة الطوارئ برا.'),
    choices: [
      C('swim', L('Send {name} out to the beacon', 'إرسال {name} للمنارة'), 'bold',
        O('{name} swims out into the dark, flips the switch, and the ship’s crane finds you within minutes.', '{name} سبح بالظلام، شغّل المنارة، ورافعة السفينة لقتكم بدقايق.', 'proud', [fl('heroic-stand'), fl('safe-ascent')], 'swim'),
        { check: chk('swim', 6, ['swim', 'pressure', 'breatheWater']), fail: O('It takes three tries and a lot of panic, but the beacon lights up.', 'أخذت ثلاث محاولات وخرعة وايد، بس المنارة اشتغلت.', 'worried', [fl('safe-ascent'), fl('creature-hurt')], 'swim') }),
      C('fix', L('Repair the comms from inside', 'تصليح الاتصال من داخل'), 'clever',
        O('Wires, tape, one prayer. The radio crackles: “Abyss-1, we hear you.”', 'وايرات وشريط لاصق ودعاء. الراديو طقطق: «أبيس-١، نسمعكم.»', 'thinking', [fl('safe-ascent')], 'radio'),
        { check: chk('intellect', 6), fail: O('It half-works. The ship finds you an hour later. Long hour.', 'اشتغل نص نص. السفينة لقتكم بعد ساعة. ساعة طويلة.', 'worried', [fl('safe-ascent'), en(-1)], 'radio') }),
    ],
  },
];
