// BSC Duck Radio — the ducks are story companions with distinct voices, not gameplay powers.
// They speak occasionally, react to context and sometimes disagree. Chat lines never assume which approach the player chose.
import type { L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export type RadioCue = 'arrive' | 'danger' | 'deep' | 'success' | 'fail' | 'discovery' | 'theory' | 'comic' | 'disagree';

/** Help & encouragement. {part} = a body part of the player's creature, {approach} = a way of acting.
 *  These are filled from the engine's real odds, so a hint always points at a genuinely good option. */
export interface DuckHelp { hintPart: L10n; hintApproach: L10n; praise: L10n[]; fact: L10n }

/** {approach} is a complete instruction (imperative, addressed to the whole team), so every template stays grammatical
 *  in Arabic whatever approach is inserted. Templates never use a pronoun that would have to agree with {part}. */
export const APPROACH: Record<string, L10n> = {
  bold: L('go in boldly', 'تقدّموا بجرأة'),
  careful: L('take it slow and careful', 'تمهّلوا وتحرّكوا بحذر'),
  clever: L('think it through before you move', 'فكّروا جيداً قبل أن تتحرّكوا'),
  kind: L('be gentle', 'كونوا لطفاء'),
  silly: L('try something nobody expects', 'جرّبوا شيئاً لا يتوقّعه أحد'),
};

export const HELP: Record<string, DuckHelp> = {
  abdullah: { hintPart: L('Guys — this is the moment for your {part}!', 'يا رفاق، هذه لحظة {part}!'), hintApproach: L('Honestly? My gut says: {approach}.', 'بصراحة؟ حدسي يقول: {approach}.'),
    praise: [L('You’re on fire today!', 'أنتم في أفضل حالاتكم اليوم!'), L('That’s the energy I’m talking about!', 'هذه هي الحماسة التي أريدها!')], fact: L('Okay, science moment:', 'حسناً، لحظة علمية:') },
  ahmed: { hintPart: L('If I were out here alone, I’d rely on your {part}.', 'لو كنت وحدي في الميدان، لاعتمدت على {part}.'), hintApproach: L('From field experience: {approach}.', 'من خبرتي في الميدان: {approach}.'),
    praise: [L('Textbook field work!', 'عمل ميداني نموذجي!'), L('Keep that pace!', 'حافظوا على هذا الإيقاع!')], fact: L('Field note:', 'ملاحظة ميدانية:') },
  camel: { hintPart: L('Hypothesis: the key variable here is your {part}.', 'فرضية: المتغيّر الحاسم هنا هو {part}.'), hintApproach: L('I ran the model. Best move: {approach}.', 'أجريت الحساب على النموذج… أفضل خطوة: {approach}.'),
    praise: [L('Elegant work. Truly.', 'عمل أنيق… حقاً.'), L('The data agrees with you.', 'البيانات في صفّكم.')], fact: L('Did you know?', 'هل تعلمون؟') },
  bassam: { hintPart: L('Use your {part}. Safest bet.', 'استخدموا {part}… هذا أضمن خيار.'), hintApproach: L('Listen to me: {approach}. Trust me.', 'اسمعوني: {approach}… ثقوا بي.'),
    praise: [L('Smooth. Nobody got hurt.', 'بسلاسة… ولم يُصَب أحد.'), L('I’d sign off on that.', 'هذه أوقّع عليها.')], fact: L('Safety briefing, but make it science:', 'إحاطة سلامة… بنكهة علمية:') },
  kiraz: { hintPart: L('It would be a crime not to use your {part} here.', 'من الظلم ألّا تستخدموا {part} هنا.'), hintApproach: L('Just this once: {approach}. The chaos can wait.', 'لمرة واحدة فقط: {approach}… والفوضى يمكنها الانتظار.'),
    praise: [L('Look at you. Terrifyingly competent.', 'انظروا إلى أنفسكم… كفاءة مخيفة.'), L('Delicious success.', 'نجاح لذيذ.')], fact: L('A weird fact, just for you:', 'حقيقة غريبة… لكم وحدكم:') },
  roaa: { hintPart: L('I noticed something — this place calls for your {part}.', 'لاحظت أمراً… هذا المكان يحتاج إلى {part}.'), hintApproach: L('Gently… {approach}. That feels right to me.', 'بهدوء… {approach}. أشعر أن هذا هو الصواب.'),
    praise: [L('That was lovely work. Thank you.', 'عمل جميل جداً… شكراً لكم.'), L('You’re doing beautifully.', 'أنتم تُبدعون.')], fact: L('Look closer — something real:', 'اقتربوا… هذه حقيقة علمية:') },
  zahra: { hintPart: L('With your {part}, the odds here are clearly better.', 'مع {part}، الاحتمالات هنا أعلى بوضوح.'), hintApproach: L('The numbers are clear: {approach}.', 'الأرقام واضحة: {approach}.'),
    praise: [L('Consistent results. I like it.', 'نتائج ثابتة… تعجبني.'), L('That’s above the expected curve.', 'هذا أعلى من المنحنى المتوقَّع.')], fact: L('A data point worth keeping:', 'معلومة تستحق الحفظ:') },
};


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
    danger: [L('Nobody touch anything. I mean it.', 'لا يلمس أحدٌ شيئاً. أنا جادّ.'), L('Slow movements. Breathe.', 'حركات بطيئة… وتنفّسوا.')],
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
};
