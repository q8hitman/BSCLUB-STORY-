// BSC Duck Radio — the ducks are story companions with distinct voices, not gameplay powers.
// They speak occasionally, react to context, make predictions that can be wrong and sometimes disagree.
// Chat lines never assume which approach the player chose, never reveal what comes next, and never control the creature.
import type { L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export type RadioCue = 'arrive' | 'danger' | 'deep' | 'success' | 'fail' | 'discovery' | 'theory' | 'comic' | 'disagree';

/** Help & encouragement. Ducks are companions, not oracles: when the team is struggling a duck may share a HUNCH
 *  shaped by their own temperament ({approach} = the way of acting they personally favour). It is never computed from
 *  the real odds, so it can be wrong — that is the point. {approach} is a complete imperative addressed to the team. */
export interface DuckHelp { hunch: L10n; praise: L10n[]; fact: L10n; note: L10n }

export const APPROACH: Record<string, L10n> = {
  bold: L('go in boldly', 'تقدّموا بجرأة'),
  careful: L('take it slow and careful', 'تمهّلوا وتحرّكوا بحذر'),
  clever: L('think it through before you move', 'فكّروا جيداً قبل أن تتحرّكوا'),
  kind: L('be gentle', 'كونوا لطفاء'),
  silly: L('try something nobody expects', 'جرّبوا شيئاً لا يتوقّعه أحد'),
};

/** The way of acting each companion personally leans towards (flavour only — it says nothing about the real odds). */
export const TEMPERAMENT: Record<string, keyof typeof APPROACH> = {
  abdullah: 'clever', ahmed: 'bold', camel: 'clever', bassam: 'careful', kiraz: 'silly', roaa: 'kind', zahra: 'careful', najdi: 'silly',
};

export const HELP: Record<string, DuckHelp> = {
  abdullah: { hunch: L('Just a guess, but… {approach}. Could be totally wrong.', 'مجرّد تخمين… {approach}. وقد أكون مخطئاً تماماً.'),
    praise: [L('You’re on fire today!', 'أنتم في أفضل حالاتكم اليوم!'), L('That’s the energy I’m talking about!', 'هذه هي الحماسة التي أريدها!')], fact: L('Okay, science moment:', 'حسناً، لحظة علمية:'), note: L('Microbiology note:', 'ملاحظة في الأحياء الدقيقة:') },
  ahmed: { hunch: L('My field instinct says {approach}… though instinct isn’t data.', 'حدسي الميداني يقول: {approach}… لكن الحدس ليس دليلاً.'),
    praise: [L('Textbook field work!', 'عمل ميداني نموذجي!'), L('Keep that pace!', 'حافظوا على هذا الإيقاع!')], fact: L('Field note:', 'ملاحظة ميدانية:'), note: L('From my field notebook:', 'من دفتري الميداني:') },
  camel: { hunch: L('My working hypothesis: {approach}. Untested, of course.', 'فرضيتي المبدئية: {approach}. لم أختبرها بعد طبعاً.'),
    praise: [L('Elegant work. Truly.', 'عمل أنيق… حقاً.'), L('The data agrees with you.', 'البيانات في صفّكم.')], fact: L('Did you know?', 'هل تعلمون؟'), note: L('Molecular biology note:', 'ملاحظة في الأحياء الجزيئية:') },
  bassam: { hunch: L('If it were up to me: {approach}. But it’s your call.', 'لو كان القرار لي: {approach}. لكن القرار قراركم.'),
    praise: [L('Smooth. Nobody got hurt.', 'بسلاسة… ولم يُصَب أحد.'), L('I’d sign off on that.', 'هذه أوقّع عليها.')], fact: L('Safety briefing, but make it science:', 'إحاطة سلامة… بنكهة علمية:'), note: L('Safety note:', 'ملاحظة سلامة:') },
  kiraz: { hunch: L('Wild idea: {approach}. It might be brilliant. It might not.', 'فكرة مجنونة: {approach}. قد تكون عبقرية… وقد لا تكون.'),
    praise: [L('Look at you. Terrifyingly competent.', 'انظروا إلى أنفسكم… كفاءة مخيفة.'), L('Delicious success.', 'نجاح لذيذ.')], fact: L('A weird fact, just for you:', 'حقيقة غريبة… لكم وحدكم:'), note: L('Biochemistry note:', 'ملاحظة في الكيمياء الحيوية:') },
  roaa: { hunch: L('I might be wrong, but… {approach}?', 'قد أكون مخطئة، لكن… {approach}؟'),
    praise: [L('That was lovely work. Thank you.', 'عمل جميل جداً… شكراً لكم.'), L('You’re doing beautifully.', 'أنتم تُبدعون.')], fact: L('Look closer — something real:', 'اقتربوا… هذه حقيقة علمية:'), note: L('Under the microscope:', 'تحت المجهر:') },
  zahra: { hunch: L('Not enough data to be sure, but I lean towards: {approach}.', 'البيانات لا تكفي للجزم، لكنني أميل إلى: {approach}.'),
    praise: [L('Consistent results. I like it.', 'نتائج ثابتة… تعجبني.'), L('That’s above the expected curve.', 'هذا أعلى من المنحنى المتوقَّع.')], fact: L('A data point worth keeping:', 'معلومة تستحق الحفظ:'), note: L('Bioinformatics note:', 'ملاحظة في المعلوماتية الحيوية:') },  najdi: { hunch: L('My chakra says: {approach}. My chakra is often wrong.', 'التشاكرا عندي تقول: {approach}. والتشاكرا عندي تخطئ كثيراً.'),
    praise: [L('A masterpiece! I am drawing this moment.', 'تحفة فنية! سأرسم هذه اللحظة.'), L('Chakra level: full!', 'مستوى التشاكرا: ممتلئ!')], fact: L('Joke aside, this one is real:', 'بعيداً عن المزاح، هذه معلومة حقيقية:'), note: L('From the sketchbook of a microbiology student:', 'من دفتر رسم طالب أحياء دقيقة:') },

};

/** Specialty Field Notes: each companion notices real science from their own field. They go into the Explorer
 *  Journal and give no gameplay advantage — the companion you pick changes what you learn, not whether you win.
 *  realm: where the note fits (land / sea / anywhere). Keep them short, real and uncontroversial. */
export interface FieldNote { id: string; duck: string; realm: 'land' | 'sea' | 'any'; text: L10n }
const N = (duck: string, n: number, realm: FieldNote['realm'], en: string, ar: string): FieldNote => ({ id: `${duck}-${n}`, duck, realm, text: L(en, ar) });
export const FIELD_NOTES: FieldNote[] = [
  N('abdullah', 1, 'land', 'A single gram of soil can hold around a billion bacteria.', 'قد يحتوي غرام واحد من التربة بشكل مليار خلية بكتيرية.'),
  N('abdullah', 2, 'sea', 'Prochlorococcus, an ocean bacterium too small to see, is thought to be the most abundant photosynthetic organism on Earth.', 'يُعتقد أن بكتيريا «بروكلوروكوكس» البحرية، التي لا تُرى بالعين، هي أكثر الكائنات القادرة على البناء الضوئي عدداً على الأرض.'),
  N('abdullah', 3, 'any', 'In ideal conditions some bacteria divide about every 20 minutes — that is why a lab culture can grow overnight.', 'في الظروف المثالية تنقسم بعض البكتيريا كل ٢٠ دقيقة تقريباً، ولهذا تنمو المزرعة البكتيرية في المختبر خلال ليلة واحدة.'),
  N('abdullah', 4, 'sea', 'Around deep-sea vents, bacteria make food from chemicals instead of sunlight. This is called chemosynthesis.', 'حول الينابيع الحارّة في أعماق البحر تصنع البكتيريا غذاءها من مواد كيميائية بدلاً من ضوء الشمس، وتُسمّى هذه العملية «التخليق الكيميائي».'),
  N('abdullah', 5, 'land', 'A lichen is a partnership: a fungus and an alga or cyanobacterium living together as one.', 'الأشنة شراكة بين كائنين: فطر وطحلب أو بكتيريا زرقاء يعيشان معاً ككائن واحد.'),
  N('ahmed', 1, 'land', 'Field biologists often identify animals from tracks, droppings and feathers without ever seeing them.', 'كثيراً ما يتعرّف علماء الأحياء الميدانيون على الحيوانات من آثارها وفضلاتها وريشها دون أن يروها.'),
  N('ahmed', 2, 'any', 'Camera traps let scientists record shy animals day and night without disturbing them.', 'تتيح كاميرات المراقبة الآلية للعلماء تصوير الحيوانات الخجولة ليلاً ونهاراً دون إزعاجها.'),
  N('ahmed', 3, 'sea', 'Scientists can tell which fish live in an area by sampling the DNA they shed into the water, called environmental DNA.', 'يستطيع العلماء معرفة الأسماك التي تعيش في منطقة ما من خلال عيّنات الحمض النووي التي تتركها في الماء، ويُسمّى «الحمض النووي البيئي».'),
  N('ahmed', 4, 'land', 'Many desert animals are nocturnal: they come out at night to avoid the heat of the day.', 'كثير من حيوانات الصحراء ليلية النشاط، فهي تخرج ليلاً لتتجنّب حرارة النهار.'),
  N('ahmed', 5, 'any', 'Good field notes record the date, time, place and weather — details that keep an observation useful for decades.', 'تسجّل الملاحظات الميدانية الجيدة التاريخ والوقت والمكان والطقس، وهي تفاصيل تُبقي الملاحظة مفيدة لعقود.'),
  N('camel', 1, 'any', 'Almost every cell in your body carries the same DNA — about two metres of it, folded tightly.', 'تحمل كل خلية تقريباً في جسمك الحمض النووي نفسه، وطوله نحو مترين مطويّين بإحكام.'),
  N('camel', 2, 'sea', 'The green glow of the jellyfish Aequorea comes from green fluorescent protein (GFP), now a key tool in labs worldwide.', 'يأتي الضوء الأخضر لقنديل البحر «إيكوريا» من البروتين الفلوري الأخضر، الذي صار أداة أساسية في مختبرات العالم.'),
  N('camel', 3, 'any', 'Many of the genes that build bodies are similar in flies, fish and people.', 'كثير من الجينات المسؤولة عن بناء الجسم متشابهة في الذباب والأسماك والبشر.'),
  N('camel', 4, 'any', 'DNA barcoding reads one short standard gene to tell apart species that look almost identical.', 'يعتمد «الترميز الشريطي للحمض النووي» على قراءة جين قصير معياري للتمييز بين أنواع تكاد تتطابق في الشكل.'),
  N('camel', 5, 'land', 'PCR lets a lab copy a tiny piece of DNA millions of times in a few hours.', 'تتيح تقنية «تفاعل البوليميراز المتسلسل» نسخ قطعة صغيرة من الحمض النووي ملايين المرات خلال ساعات قليلة.'),
  N('bassam', 1, 'any', 'Field scientists keep their distance from wild animals: getting close stresses them and can spread disease both ways.', 'يحافظ العلماء في الميدان على مسافة من الحيوانات البرية، فالاقتراب يوترها وقد ينقل الأمراض في الاتجاهين.'),
  N('bassam', 2, 'any', 'A biosafety cabinet pulls air inwards and through HEPA filters so microbes do not escape into the lab.', 'تسحب خزانة السلامة الحيوية الهواء إلى الداخل وتمرّره عبر مرشحات «هيبا» كي لا تتسرّب الميكروبات إلى المختبر.'),
  N('bassam', 3, 'sea', 'Divers rise slowly so the gas dissolved in their blood can leave safely; rising too fast can cause decompression sickness.', 'يصعد الغواصون ببطء كي تخرج الغازات الذائبة في دمائهم بأمان، فالصعود السريع قد يسبّب «داء تخفيف الضغط».'),
  N('bassam', 4, 'any', 'Gloves protect the samples too: skin carries microbes and DNA that can spoil results.', 'القفازات تحمي العيّنات أيضاً، فالجلد يحمل ميكروبات وحمضاً نووياً قد يُفسد النتائج.'),
  N('bassam', 5, 'land', 'Bright colours on frogs or caterpillars often warn that they are toxic. Look, but do not touch.', 'الألوان الزاهية على الضفادع أو اليرقات كثيراً ما تكون تحذيراً من أنها سامّة. انظروا… ولا تلمسوا.'),
  N('kiraz', 1, 'land', 'Poison dart frogs get much of their toxin from what they eat; many raised in captivity are not toxic at all.', 'تحصل ضفادع السهام السامّة على معظم سمّها من غذائها، وكثير منها لا يكون ساماً عندما يُربّى في الأسر.'),
  N('kiraz', 2, 'sea', 'Pufferfish carry tetrodotoxin, a toxin made by bacteria rather than by the fish itself.', 'تحمل السمكة المنتفخة مادة «التيترودوتوكسين»، وهي سمّ تصنعه البكتيريا لا السمكة نفسها.'),
  N('kiraz', 3, 'any', 'Venom is injected by a bite or sting; poison works when touched or eaten. A snake is venomous, a toxic frog is poisonous.', 'السمّ الذي يُحقن بعضّة أو لسعة يختلف عن السمّ الذي يؤثّر عند لمسه أو أكله؛ فالأفعى تحقن سمّها، والضفدع السام يؤذي من يلمسه أو يأكله.'),
  N('kiraz', 4, 'any', 'Enzymes are proteins that speed up the chemical reactions in cells, some by millions of times.', 'الإنزيمات بروتينات تُسرّع التفاعلات الكيميائية داخل الخلايا، وبعضها يسرّعها ملايين المرات.'),
  N('kiraz', 5, 'sea', 'Cone snails fire a harpoon-like tooth loaded with venom, and one of their toxins became a pain medicine.', 'تطلق حلزونات المخروط سنّاً تشبه الحربة محمّلة بالسمّ، وقد تحوّل أحد سمومها إلى دواء لتسكين الألم.'),
  N('roaa', 1, 'any', 'Tardigrades, about half a millimetre long, can survive drying out for years by entering a state called cryptobiosis.', 'تستطيع بطيئات المشية، وطولها نحو نصف ملّيمتر، أن تنجو من الجفاف لسنوات بدخولها حالة تُسمّى «السبات الخفي».'),
  N('roaa', 2, 'sea', 'Diatoms are single-celled algae with glass-like shells of silica, and they make a large share of Earth’s oxygen.', 'الدياتومات طحالب وحيدة الخلية لها أصداف زجاجية من السيليكا، وهي تنتج جزءاً كبيراً من أكسجين الأرض.'),
  N('roaa', 3, 'any', 'A good light microscope magnifies up to about 1,000–1,500 times; electron microscopes reveal far smaller details.', 'يكبّر المجهر الضوئي الجيد حتى ١٠٠٠–١٥٠٠ مرة تقريباً، أما المجهر الإلكتروني فيكشف تفاصيل أصغر بكثير.'),
  N('roaa', 4, 'land', 'Many butterfly colours come from microscopic wing scales that bend light, not only from pigment.', 'كثير من ألوان الفراشات يأتي من حراشف مجهرية على أجنحتها تكسر الضوء، لا من الأصباغ وحدها.'),
  N('roaa', 5, 'sea', 'A single drop of seawater can hold thousands of plankton cells, far too small to see.', 'قد تحتوي قطرة واحدة من ماء البحر على آلاف الخلايا من العوالق، وهي أصغر من أن تُرى.'),
  N('zahra', 1, 'any', 'Reading the first human genome took about 13 years; today a genome can be sequenced in about a day.', 'استغرقت قراءة أول جينوم بشري نحو ١٣ عاماً، أما اليوم فيمكن قراءة جينوم كامل في يوم واحد تقريباً.'),
  N('zahra', 2, 'any', 'By comparing DNA from many species, scientists build family trees that show how all life is related.', 'بمقارنة الحمض النووي لأنواع كثيرة يبني العلماء أشجار قرابة تبيّن صلة الكائنات الحية بعضها ببعض.'),
  N('zahra', 3, 'any', 'Biologists use statistics to tell a real pattern from luck: one observation is a story, many are data.', 'يستخدم علماء الأحياء الإحصاء للتمييز بين النمط الحقيقي والمصادفة؛ فالملاحظة الواحدة حكاية، والملاحظات الكثيرة بيانات.'),
  N('zahra', 4, 'sea', 'Satellite tags on sea turtles and sharks send back locations, letting researchers map migrations across oceans.', 'ترسل أجهزة التتبّع عبر الأقمار الصناعية مواقع السلاحف البحرية وأسماك القرش، فيرسم الباحثون خرائط هجرتها عبر المحيطات.'),
  N('zahra', 5, 'land', 'Public databases such as GenBank hold DNA sequences from hundreds of thousands of species, free for anyone to search.', 'تضمّ قواعد البيانات العامة مثل «جين بانك» تسلسلات الحمض النووي لمئات الآلاف من الأنواع، ويمكن لأي شخص البحث فيها مجاناً.'),
  N('najdi', 1, 'any', 'Alexander Fleming, who discovered penicillin, also painted pictures using living bacteria of different colours.', 'ألكسندر فلمنغ، مكتشف البنسلين، كان يرسم لوحات ببكتيريا حيّة مختلفة الألوان.'),
  N('najdi', 2, 'land', 'The smell of rain on dry soil comes from geosmin, a substance made by soil bacteria.', 'رائحة المطر على التراب الجاف تأتي من مادة اسمها «جيوسمين» تصنعها بكتيريا تعيش في التربة.'),
  N('najdi', 3, 'sea', 'The bobtail squid keeps glowing bacteria in its body and uses their light to hide its shadow at night.', 'يحتفظ الحبّار القصير الذيل ببكتيريا مضيئة داخل جسمه، ويستعمل ضوءها ليخفي ظله في الليل.'),
  N('najdi', 4, 'any', 'Your body carries about as many bacterial cells as human cells, and most of them are helpful.', 'في جسمك عدد من خلايا البكتيريا يقارب عدد خلاياك أنت، وأغلبها مفيد.'),
  N('najdi', 5, 'any', 'Yogurt and bread are made with the help of microbes: bacteria make the yogurt and yeast makes the bread rise.', 'اللبن الرائب والخبز يُصنعان بمساعدة كائنات دقيقة: البكتيريا تصنع اللبن، والخميرة تجعل الخبز ينتفخ.'),
];
export const NOTE_BY_ID: Record<string, FieldNote> = Object.fromEntries(FIELD_NOTES.map((n) => [n.id, n]));

export const RADIO: Record<string, Partial<Record<RadioCue, L10n[]>>> = {
  abdullah: {
    arrive: [L('New place, new microbes. I can feel it.', 'مكان جديد، وميكروبات جديدة. أكاد أشعر بها.'), L('Okay, everyone — eyes open, gloves on.', 'هيا يا رفاق، افتحوا أعينكم والبسوا القفازات.')],
    danger: [L('That is NOT a friendly sound.', 'هذا الصوت ليس ودوداً أبداً.'), L('Stay close. Like, really close.', 'ابقوا قريبين… قريبين جداً.')],
    deep: [L('Imagine the bacteria living down here. In the dark. Forever.', 'تخيّلوا البكتيريا التي تعيش هنا… في الظلام… إلى الأبد.')],
    success: [L('Yes! Write that down before I forget.', 'نعم! دوّنوها قبل أن أنساها.'), L('That’s how we do it in the BSC.', 'هكذا نعمل في النادي.')],
    fail: [L('Okay… that was a learning experience.', 'حسناً… لنعتبرها تجربة تعليمية.'), L('We’re fine. Mostly fine.', 'نحن بخير… تقريباً.')],
    discovery: [L('Sample bag. Now. Please.', 'كيس العيّنات… الآن… من فضلكم.'), L('If this grows in a petri dish I’m naming it after us.', 'إن نما هذا في طبق بتري فسأسمّيه باسمنا.')],
    theory: [L('My guess? Something’s feeding on whatever lives here. Could be wrong.', 'تخميني؟ هناك ما يتغذّى على من يعيش هنا. وقد أكون مخطئاً.')],
    comic: [L('I’m not laughing. I’m documenting.', 'أنا لا أضحك… أنا أوثّق.')],
    disagree: [L('Nah, I don’t buy it.', 'لا، لست مقتنعاً.')],
  },
  ahmed: {
    arrive: [L('Look at these tracks — fresh ones.', 'انظروا إلى هذه الآثار… إنها حديثة.'), L('Perfect habitat for something shy.', 'بيئة مثالية لكائن خجول.')],
    danger: [L('Something’s watching us from up there.', 'هناك ما يراقبنا من الأعلى.'), L('Okay, maybe we don’t run straight in this time.', 'حسناً، ربما لا نندفع هذه المرة.')],
    deep: [L('No sunlight, and still so much life. Incredible.', 'لا شمس هنا، ومع ذلك فالحياة وفيرة. مدهش.')],
    success: [L('Ha! Into the notebook it goes.', 'ها! إلى الدفتر فوراً.'), L('That’s field work!', 'هذا هو العمل الميداني!')],
    fail: [L('My boots are full of… something.', 'حذائي ممتلئ… بشيء لا أعرفه.'), L('We’ll try another route.', 'سنجرّب طريقاً آخر.')],
    discovery: [L('I’ve never seen this in any field guide.', 'لم أرَ هذا في أي دليل ميداني.'), L('Get the scale bar — this needs a photo.', 'أحضروا مسطرة القياس، هذا يستحق صورة.')],
    theory: [L('Animals avoid this spot. There’s usually a reason.', 'الحيوانات تتجنّب هذا المكان… وعادةً يكون لذلك سبب.')],
    comic: [L('Best field trip ever. Don’t tell the dean.', 'أجمل رحلة ميدانية… لا تخبروا العميد.')],
    disagree: [L('Or we just go and look.', 'أو نذهب لنرى بأنفسنا.')],
  },
  camel: {
    arrive: [L('Interesting. The chemistry here must be unusual.', 'مثير للاهتمام. لا بد أن الكيمياء هنا غير عادية.'), L('Let me think about what could survive in this.', 'دعوني أفكّر: ما الذي يمكنه العيش في ظروف كهذه؟')],
    danger: [L('Statistically, this is where things go wrong.', 'إحصائياً، هنا بالضبط تسوء الأمور.'), L('I’d like to observe that from further away.', 'أفضّل مراقبته من مسافة أبعد.')],
    deep: [L('At this pressure, proteins have to be built differently. Fascinating.', 'تحت هذا الضغط لا بد أن تُبنى البروتينات بطريقة مختلفة. أمر مذهل.')],
    success: [L('Elegant. Like a well-folded protein.', 'أنيق… مثل بروتين مطويّ بإتقان.'), L('See? Process matters.', 'أرأيتم؟ المنهج يصنع الفرق.')],
    fail: [L('Hm. My model did not predict that.', 'همم… نموذجي لم يتوقّع هذا.'), L('Back to the hypothesis.', 'نعود إلى الفرضية.')],
    discovery: [L('This could change a whole chapter of my book.', 'قد يغيّر هذا فصلاً كاملاً في كتابي.'), L('Look at that structure. Nature is showing off.', 'انظروا إلى هذا التركيب… الطبيعة تتباهى.')],
    theory: [L('Theory: the glow is chemical, not electrical. I might be wrong.', 'نظرية: هذا الضوء كيميائي لا كهربائي… وقد أكون مخطئاً.'), L('If I had to guess, it’s a symbiosis. But I’m guessing.', 'لو خمّنت لقلت إنها علاقة تكافلية… لكنه مجرد تخمين.')],
    comic: [L('For the record, that was not in the protocol.', 'للتوثيق فقط: هذا ليس في البروتوكول.')],
    disagree: [L('I respectfully disagree. With evidence. Eventually.', 'أختلف معكم بكل احترام… وبالدليل… لاحقاً.')],
  },
  bassam: {
    arrive: [L('Goggles on. Just in case.', 'النظارات الواقية على الأعين… احتياطاً.'), L('Nice view. Where’s the emergency exit?', 'منظر جميل… أين مخرج الطوارئ؟')],
    danger: [L('Nobody touch anything. I mean it.', 'لا يلمس أحد شيئاً. أنا جادّ.'), L('Slow movements. Breathe.', 'حركات بطيئة… وتنفّسوا.')],
    deep: [L('One window between us and all that water. I’m fine. Totally fine.', 'نافذة واحدة بيننا وبين كل هذا الماء… أنا بخير… بخير تماماً.')],
    success: [L('No injuries. I’ll take it.', 'لا إصابات… ممتاز.'), L('Smooth. Coffee break earned.', 'بسلاسة… نستحق استراحة قهوة.')],
    fail: [L('Everyone okay? Count your fingers.', 'هل الجميع بخير؟ عدّوا أصابعكم.'), L('That’s going in the incident report.', 'هذه ستُسجَّل في تقرير الحوادث.')],
    discovery: [L('Cool. Don’t lick it.', 'رائع… لكن لا تلعقوه.')],
    theory: [L('When everything goes quiet, something bigger is nearby. Usually.', 'حين يصمت كل شيء، يكون هناك عادةً ما هو أكبر بالقرب.')],
    comic: [L('I saw nothing. My coffee saw nothing.', 'لم أرَ شيئاً… حتى قهوتي لم ترَ شيئاً.')],
    disagree: [L('Or — hear me out — we don’t.', 'أو… اسمعوني… لا نفعلها أصلاً.')],
  },
  kiraz: {
    arrive: [L('Ooh. This place has a mood. I love it.', 'أوه… لهذا المكان أجواء خاصة. يعجبني.'), L('Smells like something toxic. Promising.', 'رائحته كرائحة شيء سامّ… هذا مبشّر.')],
    danger: [L('If it bites, I want a venom sample.', 'إن عضّ، فأريد عيّنة من سمّه.'), L('That’s a lot of teeth, everyone.', 'يا رفاق… هذه أسنان كثيرة جداً.')],
    deep: [L('Pitch black, crushing pressure, glowing teeth. Finally, my kind of place.', 'ظلام دامس، وضغط ساحق، وأسنان تتوهّج… أخيراً مكان على ذوقي.')],
    success: [L('Beautiful chaos.', 'فوضى جميلة.'), L('See? It works.', 'أرأيتم؟ نجحت.')],
    fail: [L('Well, that was dramatic.', 'حسناً… كان ذلك دراميّاً.'), L('It’s fine. Nothing exploded. Yet.', 'لا بأس… لم ينفجر شيء… حتى الآن.')],
    discovery: [L('Bottle it. Label it. Keep it away from Bassam.', 'عبّئوه، ضعوا عليه ملصقاً، وأبعدوه عن بسام.')],
    theory: [L('Bright colours usually mean poison. Usually.', 'الألوان الصارخة تعني السمّ عادةً… عادةً.')],
    comic: [L('I’m adding this to my favourite disasters.', 'سأضيفها إلى قائمة كوارثي المفضّلة.')],
    disagree: [L('Boring. Next idea.', 'مملّة… الفكرة التالية.')],
  },
  roaa: {
    arrive: [L('Wait — look at the edges. Something was here.', 'لحظة… انظروا إلى الأطراف. كان هنا شيء ما.'), L('So many tiny details here.', 'ما أكثر التفاصيل الصغيرة هنا.')],
    danger: [L('It’s scared too, I think.', 'أظنه خائفاً هو أيضاً.'), L('Don’t make sudden moves near it.', 'لا تتحرّكوا فجأة بالقرب منه.')],
    deep: [L('Every little light down here is someone.', 'كل ضوء صغير هنا… كائن حيّ.')],
    success: [L('Nicely done. Thank you.', 'أحسنتم… شكراً لكم.'), L('Did you see how well that went? Lovely.', 'أرأيتم كيف نجحت؟ جميل.')],
    fail: [L('Oh no… is everyone alright?', 'أوه لا… هل الجميع بخير؟'), L('We’ll be more careful next time.', 'سنكون أكثر حذراً في المرة القادمة.')],
    discovery: [L('Under a microscope this would be stunning.', 'سيبدو هذا مذهلاً تحت المجهر.'), L('Look closer — there are patterns on it.', 'اقتربوا… عليه نقوش.')],
    theory: [L('These marks are too regular to be random.', 'هذه العلامات أكثر انتظاماً من أن تكون صدفة.')],
    comic: [L('I’m trying not to laugh. I’m failing.', 'أحاول ألّا أضحك… وأفشل.')],
    disagree: [L('Hmm, I noticed something different.', 'همم… لاحظتُ شيئاً مختلفاً.')],
  },
  zahra: {
    arrive: [L('Logging location. Let’s see what the data says.', 'سجّلت الموقع… لنرَ ماذا تقول البيانات.'), L('New variables. I like new variables.', 'متغيّرات جديدة… أحبّ المتغيّرات الجديدة.')],
    danger: [L('Risk just went up. Noticeably.', 'ارتفعت نسبة الخطر… بوضوح.'), L('Sample size of one. Let’s not become a statistic.', 'حجم العيّنة واحد… فلا نصبح رقماً في إحصائية.')],
    deep: [L('Sensors are reading movement. A lot of it. All around us.', 'المستشعرات تلتقط حركة… كثيرة… من حولنا جميعاً.')],
    success: [L('Result logged. Clean data.', 'سُجّلت النتيجة… بيانات نظيفة.'), L('That matches my model. For once.', 'تطابق نموذجي… ولو لمرة.')],
    fail: [L('Unexpected outcome. Recalculating.', 'نتيجة غير متوقّعة… أعيد الحساب.'), L('Noted. Adjusting the odds.', 'سُجّلت… أعدّل الاحتمالات.')],
    discovery: [L('This data point changes the whole curve.', 'هذه النقطة تغيّر المنحنى كله.')],
    theory: [L('The pattern repeats every few hours. Could be tidal. Could be something else.', 'النمط يتكرّر كل بضع ساعات… ربما المدّ والجزر… وربما شيء آخر.')],
    comic: [L('Adding this to the group chat. For science.', 'سأنشرها في مجموعة النادي… من أجل العلم.')],
    disagree: [L('The numbers say otherwise.', 'الأرقام تقول غير ذلك.')],
  },
  najdi: {
    arrive: [L('What a view. Nobody move, I am sketching it.', 'ما أجمل هذا المنظر. لا يتحرّك أحد، سأرسمه.'), L('New place, full chakra. Let’s go!', 'مكان جديد، والتشاكرا ممتلئة. هيا بنا!')],
    danger: [L('I am not scared. This suit just shakes on its own.', 'أنا لست خائفاً. هذا الزيّ يرتجف وحده.'), L('Careful. I only have one dinosaur suit.', 'انتبهوا. عندي زيّ ديناصور واحد فقط.')],
    deep: [L('So dark down here. Luckily my jokes glow.', 'الظلام شديد هنا. من حسن الحظ أن نكاتي تضيء.')],
    success: [L('And the crowd goes wild!', 'والجمهور يصفّق بحرارة!'), L('That deserves a drawing on the club wall.', 'هذه تستحق رسمة على جدار النادي.')],
    fail: [L('We will call that a rehearsal.', 'سنسمّي هذه تجربة أداء.'), L('My chakra dropped a little. Give me a second.', 'نزلت التشاكرا قليلاً. أعطوني لحظة.')],
    discovery: [L('Hold still! This goes straight into my sketchbook.', 'لا تتحرّكوا! هذا يدخل دفتر الرسم فوراً.')],
    theory: [L('I bet tiny microbes are behind this. They are behind everything.', 'أراهن أن كائنات دقيقة صغيرة وراء هذا. هي وراء كل شيء.')],
    comic: [L('I am the comedian here, and even I could not write that.', 'أنا كوميديّ النادي، وحتى أنا لا أستطيع أن أكتب مثل هذا.')],
    disagree: [L('As an artist, I see it differently.', 'بصفتي فنّاناً، أرى الأمر بشكل مختلف.')],
  },
};
