// BSC Duck Radio — the ducks are story companions with distinct voices, not gameplay powers.
// They speak occasionally, react to context, sometimes disagree, and never reveal the right choice.
import type { L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export type RadioCue = 'arrive' | 'danger' | 'deep' | 'success' | 'fail' | 'discovery' | 'theory' | 'comic' | 'disagree';

export const RADIO: Record<string, Partial<Record<RadioCue, L10n[]>>> = {
  abdullah: {
    arrive: [L('New place, new microbes. I can feel it.', 'مكان جديد، ميكروبات جديدة. أحسّها.'), L('Okay, everyone — eyes open, gloves on.', 'يلا يا جماعة، عيونكم مفتوحة والقفازات بإيدكم.')],
    danger: [L('That is NOT a friendly sound.', 'هذا الصوت مو ودّي أبد.'), L('Stay close. Like, really close.', 'خلّكم قريبين… قريبين صج.')],
    deep: [L('Imagine the bacteria living down here. In the dark. Forever.', 'تخيّلوا البكتيريا اللي عايشة هني… بالظلام… للأبد.')],
    success: [L('Yes! Write that down before I forget.', 'إيه! اكتبوها قبل لا أنساها.'), L('That’s how we do it in the BSC.', 'هذي طريقتنا بالنادي.')],
    fail: [L('Okay… that was a learning experience.', 'أوكي… اعتبروها تجربة تعليمية.'), L('We’re fine. Mostly fine.', 'إحنا بخير… تقريباً.')],
    discovery: [L('Sample bag. Now. Please.', 'كيس العينات… الحين… لو سمحتوا.'), L('If this grows in a petri dish I’m naming it after us.', 'إذا هذا نما بطبق بتري بسمّيه على اسمنا.')],
    theory: [L('My guess? Something’s feeding on whatever lives here. Could be wrong.', 'توقعي؟ فيه شي ياكل اللي عايش هني. يمكن غلطان.')],
    comic: [L('I’m not laughing. I’m documenting.', 'أنا مو قاعد أضحك… قاعد أوثّق.')],
    disagree: [L('Nah, I don’t buy it.', 'لا، مو مقتنع.')],
  },
  ahmed: {
    arrive: [L('Look at these tracks — fresh ones.', 'شوفوا هالآثار… جديدة.'), L('Perfect habitat for something shy.', 'بيئة مثالية لشي خجول.')],
    danger: [L('Something’s watching us from up there.', 'فيه شي يراقبنا من فوق.'), L('Okay, maybe we don’t run straight in this time.', 'أوكي، يمكن هالمرة ما ندخل ركض.')],
    deep: [L('No sunlight, and still so much life. Incredible.', 'لا شمس، وللحين فيه حياة وايد. شي مو طبيعي.')],
    success: [L('Ha! Into the notebook it goes.', 'ها! على الدفتر على طول.'), L('That’s field work!', 'هذا هو الشغل الميداني!')],
    fail: [L('My boots are full of… something.', 'جوتي مليان… شي ما أعرفه.'), L('We’ll try another route.', 'بنجرّب طريق ثاني.')],
    discovery: [L('I’ve never seen this in any field guide.', 'ما شفت هالشي بأي دليل ميداني.'), L('Get the scale bar — this needs a photo.', 'جيبوا المسطرة، هذا يبي صورة.')],
    theory: [L('Animals avoid this spot. There’s usually a reason.', 'الحيوانات تتجنّب هالمكان… وعادةً فيه سبب.')],
    comic: [L('Best field trip ever. Don’t tell the dean.', 'أحلى رحلة ميدانية… لا تقولون للعميد.')],
    disagree: [L('Or we just go and look.', 'أو نروح ونشوف وبس.')],
  },
  camel: {
    arrive: [L('Interesting. The chemistry here must be unusual.', 'مثير للاهتمام. الكيمياء هني أكيد غير عادية.'), L('Let me think about what could survive in this.', 'خلّوني أفكر شنو ممكن يعيش بهالظروف.')],
    danger: [L('Statistically, this is where things go wrong.', 'إحصائياً، هني بالضبط تخرب الأمور.'), L('I’d like to observe that from further away.', 'أفضّل أراقبه من مسافة أبعد.')],
    deep: [L('At this pressure, proteins have to be built differently. Fascinating.', 'بهالضغط، البروتينات لازم تكون مبنية بشكل ثاني. شي رهيب.')],
    success: [L('Elegant. Like a well-folded protein.', 'أنيقة… مثل بروتين مطوي صح.'), L('See? Process matters.', 'شفتوا؟ الطريقة تفرق.')],
    fail: [L('Hm. My model did not predict that.', 'هممم… نموذجي ما توقّع هالشي.'), L('Back to the hypothesis.', 'نرجع للفرضية.')],
    discovery: [L('This could change a whole chapter of my book.', 'هذا ممكن يغيّر فصل كامل بكتابي.'), L('Look at that structure. Nature is showing off.', 'شوفوا هالتركيب… الطبيعة قاعدة تستعرض.')],
    theory: [L('Theory: the glow is chemical, not electrical. I might be wrong.', 'نظرية: هالضوء كيميائي مو كهربائي… ممكن أكون غلطان.'), L('If I had to guess, it’s a symbiosis. But I’m guessing.', 'لو بخمّن، فهي علاقة تكافلية… بس قاعد أخمّن.')],
    comic: [L('For the record, that was not in the protocol.', 'للتوثيق: هذا مو موجود بالبروتوكول.')],
    disagree: [L('I respectfully disagree. With evidence. Eventually.', 'أختلف معاك بكل احترام… وبالدليل… بعدين.')],
  },
  bassam: {
    arrive: [L('Goggles on. Just in case.', 'النظارة على العين… احتياط.'), L('Nice view. Where’s the emergency exit?', 'منظر حلو… وين مخرج الطوارئ؟')],
    danger: [L('Nobody touch anything. I mean it.', 'محد يلمس شي. أقولها صج.'), L('Slow movements. Breathe.', 'حركات بطيئة… وتنفّسوا.')],
    deep: [L('One window between us and all that water. I’m fine. Totally fine.', 'دريشة وحدة بيننا وبين كل هالماي… أنا عادي… عادي جداً.')],
    success: [L('No injuries. I’ll take it.', 'ما فيه إصابات… ممتاز.'), L('Smooth. Coffee break earned.', 'سلسة… نستاهل قهوة.')],
    fail: [L('Everyone okay? Count your fingers.', 'الكل بخير؟ عدّوا أصابعكم.'), L('That’s going in the incident report.', 'هذي بتنكتب بتقرير الحوادث.')],
    discovery: [L('Cool. Don’t lick it.', 'حلو… بس لا تلحسونه.')],
    theory: [L('When everything goes quiet, something bigger is nearby. Usually.', 'لما كل شي يسكت، عادةً فيه شي أكبر قريب.')],
    comic: [L('I saw nothing. My coffee saw nothing.', 'ما شفت شي… حتى قهوتي ما شافت شي.')],
    disagree: [L('Or — hear me out — we don’t.', 'أو… اسمعوني… ما نسويها.')],
  },
  kiraz: {
    arrive: [L('Ooh. This place has a mood. I love it.', 'أوه… هالمكان له جو. عاجبني.'), L('Smells like something toxic. Promising.', 'ريحته شي سام… مبشّرة.')],
    danger: [L('If it bites, I want a venom sample.', 'إذا عضّ، أبي عيّنة من سمّه.'), L('Darling, that’s a lot of teeth.', 'حبيبي… هذي أسنان وايد.')],
    deep: [L('Pitch black, crushing pressure, glowing teeth. Finally, my kind of place.', 'ظلام دامس، ضغط ساحق، أسنان تضوي… أخيراً مكان على ذوقي.')],
    success: [L('Beautiful chaos.', 'فوضى جميلة.'), L('See? Bold works.', 'شفتوا؟ الجرأة تزبط.')],
    fail: [L('Well, that was dramatic.', 'طيب… كانت درامية.'), L('It’s fine. Nothing exploded. Yet.', 'عادي… ما شي انفجر… للحين.')],
    discovery: [L('Bottle it. Label it. Keep it away from Bassam.', 'عبّوه، حطوا عليه ليبل، وبعّدوه عن بسام.')],
    theory: [L('Bright colours usually mean poison. Usually.', 'الألوان الصارخة عادةً معناها سم… عادةً.')],
    comic: [L('I’m adding this to my favourite disasters.', 'بضيفها لقائمة كوارثي المفضلة.')],
    disagree: [L('Boring. Next idea.', 'مملة… الفكرة اللي بعدها.')],
  },
  roaa: {
    arrive: [L('Wait — look at the edges. Something was here.', 'لحظة… طالعوا الأطراف. كان فيه شي هني.'), L('So many tiny details here.', 'تفاصيل صغيرة وايد هني.')],
    danger: [L('It’s scared too, I think.', 'أحس إنه خايف بعد.'), L('Don’t make sudden moves near it.', 'لا تتحركون فجأة قريب منه.')],
    deep: [L('Every little light down here is someone.', 'كل ضوء صغير هني… هو كائن عايش.')],
    success: [L('Gently done. Thank you.', 'برقّة… شكراً.'), L('Did you see how careful that was? Lovely.', 'شفتوا شكثر كانت دقيقة؟ حلوة.')],
    fail: [L('Oh no… is everyone alright?', 'لا… الكل بخير؟'), L('We’ll be more careful next time.', 'بنكون أحذر المرة الجاية.')],
    discovery: [L('Under a microscope this would be stunning.', 'تحت المجهر هذا بيكون شي خيالي.'), L('Look closer — there are patterns on it.', 'قرّبوا… عليه نقشات.')],
    theory: [L('These marks are too regular to be random.', 'هالعلامات منتظمة زيادة عشان تكون صدفة.')],
    comic: [L('I’m trying not to laugh. I’m failing.', 'قاعدة أحاول ما أضحك… وفاشلة.')],
    disagree: [L('Hmm, I noticed something different.', 'هممم… أنا لاحظت شي ثاني.')],
  },
  zahra: {
    arrive: [L('Logging location. Let’s see what the data says.', 'سجّلت الموقع… خلّونا نشوف شنو تقول البيانات.'), L('New variables. I like new variables.', 'متغيرات جديدة… أحب المتغيرات الجديدة.')],
    danger: [L('Risk just went up. Noticeably.', 'نسبة الخطر ارتفعت… وبشكل واضح.'), L('Sample size of one. Let’s not become a statistic.', 'العيّنة وحدة… خلّونا ما نصير إحصائية.')],
    deep: [L('Sensors are reading movement. A lot of it. All around us.', 'الحساسات تقرا حركة… وايد… حوالينا كلنا.')],
    success: [L('Result logged. Clean data.', 'النتيجة انسجلت… بيانات نظيفة.'), L('That matches my model. For once.', 'تطابق نموذجي… ولو مرة.')],
    fail: [L('Unexpected outcome. Recalculating.', 'نتيجة غير متوقعة… قاعدة أعيد الحساب.'), L('Noted. Adjusting the odds.', 'انسجلت… قاعدة أعدّل الاحتمالات.')],
    discovery: [L('This data point changes the whole curve.', 'هالنقطة تغيّر المنحنى كله.')],
    theory: [L('The pattern repeats every few hours. Could be tidal. Could be something else.', 'النمط يتكرر كل كم ساعة… يمكن مد وجزر… ويمكن شي ثاني.')],
    comic: [L('Adding this to the group chat. For science.', 'بحطها بالقروب… للعلم.')],
    disagree: [L('The numbers say otherwise.', 'الأرقام تقول غير جذي.')],
  },
};
