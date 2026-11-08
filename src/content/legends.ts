// BSC BioLab legends — ORIGINAL creatures invented for this game (pure fiction, clearly labelled as such).
// They are rare: at most one fleeting sighting in some runs. Players can read every legend in the Lore book.
import type { BiomeId, L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });

export interface Legend {
  id: string;
  name: L10n;
  epithet: L10n;
  realm: 'land' | 'sea';
  biomes: BiomeId[];
  /** The legend as people tell it. */
  lore: L10n;
  /** How you know it is near. */
  signs: L10n;
  /** What the old stories advise. */
  rule: L10n;
  /** One-line glimpse used when it appears in a story. */
  glimpse: L10n;
  art: string; // plate id (specimen-style painting)
}

export const LEGENDS: Legend[] = [
  // ───────── SEA ─────────
  { id: 'umm-alfanar', realm: 'sea', biomes: ['openSea', 'twilight', 'midnight'], art: 'legend-umm-alfanar',
    name: L('Umm Al-Fanar', 'أم الفنار'), epithet: L('The Lantern Mother', 'سيدة الفانوس'),
    lore: L('Night fishermen speak of a lantern bobbing on the open sea where no boat should be. Those who row toward it say the light sinks slowly as they follow — and that the water around it is far too dark, as if something enormous is waiting beneath with the lantern hanging from its head.',
      'يحكي صيّادو الليل عن فانوس يتمايل فوق البحر المفتوح، في مكان لا ينبغي أن يكون فيه قارب. ويقول من جدّفوا نحوه إن الضوء يغوص ببطء كلما تبعوه… وإن الماء حوله أشدّ سواداً مما ينبغي، كأن شيئاً هائلاً ينتظر في الأسفل والفانوس معلّق في رأسه.'),
    signs: L('A warm, steady light on calm water; fish swimming away from it; a smell of hot oil.', 'ضوء دافئ ثابت فوق ماء ساكن، وأسماك تبتعد عنه، ورائحة زيت ساخن.'),
    rule: L('Never row toward a lantern that has no boat.', 'لا تجدّف أبداً نحو فانوس بلا قارب.'),
    glimpse: L('Far off, a lantern bobs on the black water — with no boat beneath it. Then it sinks.', 'في البعيد، فانوس يتمايل فوق الماء الأسود… ولا قارب تحته. ثم يغوص.') },
  { id: 'bu-sahn', realm: 'sea', biomes: ['trench', 'midnight', 'openSea'], art: 'legend-bu-sahn',
    name: L('Bu Sahn', 'بو صحن'), epithet: L('The Plate-Eyed Giant', 'صاحب العين الصحن'),
    lore: L('The pearl divers’ oldest story: a creature longer than any boom, with a single eye as wide as a serving plate, rising from the deep to look at divers — never to harm them, only to watch. Old Bu Fahad swears he saw it. The Marine Science Club keeps his account on file, unproven.',
      'أقدم حكايات غوّاصي اللؤلؤ: كائن أطول من أي سفينة «بوم»، له عين واحدة في عرض صحن الولائم، يصعد من الأعماق لينظر إلى الغوّاصين… لا ليؤذيهم، بل ليراقبهم فقط. يُقسم بو فهد إنه رآه، ويحتفظ نادي علوم البحار بشهادته… دون إثبات.'),
    signs: L('The sea goes silent; fish stop moving; a slow pressure in the ears.', 'يصمت البحر، وتتوقف الأسماك عن الحركة، ويشتدّ ضغط بطيء في الأذنين.'),
    rule: L('If the eye looks at you, do not look away first.', 'إذا نظرت إليك العين، فلا تُشِح بنظرك قبلها.'),
    glimpse: L('Something vast slides past beyond the light. For a heartbeat, an eye the size of a plate reflects the beam.', 'شيء هائل ينساب خلف حدود الضوء… ولخفقة قلب، تعكس عينٌ بحجم الصحن شعاعَ الكشّاف.') },
  { id: 'katib-almad', realm: 'sea', biomes: ['mudflat', 'reef'], art: 'legend-katib-almad',
    name: L('Katib Al-Mad', 'كاتب المد'), epithet: L('The Tide Clerk', 'كاتب الجَزْر'),
    lore: L('At the lowest tides, a thin pale figure walks the mudflats on long fingers, picking up shells and counting them with soft clicks, always in sevens. It is said to be keeping a ledger of everything the sea has taken back.',
      'في أدنى الجَزْر، يمشي على السبخات كائن نحيل شاحب على أصابع طويلة، يلتقط الأصداف ويعدّها بنقرات خفيفة… سبعاً سبعاً دائماً. ويُقال إنه يدوّن سجلّاً لكل ما استردّه البحر لنفسه.'),
    signs: L('Clicks in groups of seven; neat rows of shells left on the mud.', 'نقرات في مجموعات من سبع، وصفوف مرتّبة من الأصداف على الطين.'),
    rule: L('Leave before the seventh click, or the tide will count you too.', 'غادِر قبل النقرة السابعة… وإلا عدّك المدّ معها.'),
    glimpse: L('On the mud, someone has laid shells in perfect rows of seven. Something clicks, out of sight.', 'على الطين، رصّ أحدهم الأصداف في صفوف متقنة من سبع. وشيء ما ينقر… في مكان لا تراه العين.') },
  { id: 'saraqat-allulu', realm: 'sea', biomes: ['reef', 'seagrass'], art: 'legend-saraqat-allulu',
    name: L('Saraqat Al-Lulu', 'سارقة اللؤلؤ'), epithet: L('The Pearl Thief', 'لصّة المحار'),
    lore: L('Divers once blamed missing pearls on a pale, eight-armed thing whose suckers shine like little moons. It never takes a whole basket — just the best pearl — and leaves an empty shell in its place, polished, as if to say thank you.',
      'كان الغوّاصون قديماً ينسبون اللؤلؤ المفقود إلى كائن شاحب بثماني أذرع، تلمع ممصّاته كأقمار صغيرة. لا يأخذ السلّة كلها أبداً… بل أجمل لؤلؤة فقط، ويترك مكانها صدفة فارغة مصقولة… كأنه يقول: شكراً.'),
    signs: L('Polished empty shells; tiny moon-like lights in a crevice.', 'أصداف فارغة مصقولة، وأضواء صغيرة كالأقمار بين الشقوق.'),
    rule: L('Always leave one pearl for the reef.', 'اترك دائماً لؤلؤة واحدة للشعاب.'),
    glimpse: L('In a crack in the coral, a row of small moonlike lights blinks — and an empty, polished shell rolls out.', 'في شقّ بين المرجان، يومض صفّ من الأضواء الصغيرة كالأقمار… ثم تتدحرج منه صدفة فارغة مصقولة.') },
  { id: 'jawqat-alqa', realm: 'sea', biomes: ['trench', 'vents', 'midnight'], art: 'legend-jawqat-alqa',
    name: L('Jawqat Al-Qa’', 'جوقة القاع'), epithet: L('The Choir Below', 'المنشدون في الأسفل'),
    lore: L('Hydrophones sometimes catch a low, layered humming from the deepest trenches, like many throats singing one note. The legend says pale things gather on fallen whales to sing them to sleep — and that the song changes when visitors arrive.',
      'تلتقط الميكروفونات المائية أحياناً همهمة عميقة متداخلة من أعمق الخنادق، كأن حناجر كثيرة تنشد نغمة واحدة. وتقول الأسطورة إن كائنات شاحبة تجتمع حول الحيتان الساقطة لتُغنّيها حتى تنام… وإن اللحن يتبدّل حين يصل الزوّار.'),
    signs: L('A hum you feel in your teeth; instruments drifting out of tune.', 'همهمة تشعر بها في أسنانك، وأجهزة تفقد ضبطها شيئاً فشيئاً.'),
    rule: L('Do not hum back.', 'لا تُهمهم معهم.'),
    glimpse: L('The hull starts to hum — one low note, sung by many voices, coming from below.', 'يبدأ هيكل الغوّاصة بالهمهمة… نغمة واحدة عميقة تنشدها أصوات كثيرة، آتية من الأسفل.') },
  { id: 'abu-sabaa', realm: 'sea', biomes: ['twilight', 'midnight'], art: 'legend-abu-sabaa',
    name: L('Abu Sab’ Oyoun', 'أبو سبع عيون'), epithet: L('The Seven-Eyed Watcher', 'الرقيب ذو العيون السبع'),
    lore: L('A fish no net has ever kept, with seven eyes along its head that light one after another like a counting game. Sailors said the seventh eye only opens for those who are lost.',
      'سمكة لم تبقَ في شبكة قط، لها سبع عيون على امتداد رأسها، تضيء واحدة تلو الأخرى كأنها لعبة عدّ. وقال البحّارة إن العين السابعة لا تنفتح إلا للتائهين.'),
    signs: L('Lights blinking in sequence in the dark: one, two, three…', 'أضواء تومض بالترتيب في الظلام: واحد، اثنان، ثلاثة…'),
    rule: L('Count with it — but stop at six.', 'عُدَّ معها… لكن توقّف عند السادسة.'),
    glimpse: L('In the dark, small lights blink on in order. One… two… three… You stop counting at six.', 'في الظلام، تضيء أضواء صغيرة بالترتيب: واحد… اثنان… ثلاثة… وتتوقفون عن العدّ عند السادسة.') },
  // ───────── LAND ─────────
  { id: 'mashi-alkuthban', realm: 'land', biomes: ['desert'], art: 'legend-mashi-alkuthban',
    name: L('Mashi Al-Kuthban', 'ماشي الكثبان'), epithet: L('The Dune Walker', 'الطويل الذي يمشي ليلاً'),
    lore: L('Herders tell of three-toed tracks that appear around camps on moonless nights, each step a little too far from the last. Whatever leaves them is tall, thin, and walks only when the wind covers its sound. Nobody has seen its face — only its shadow against the stars.',
      'يحكي الرعاة عن آثار بثلاث أصابع تظهر حول المخيّمات في الليالي غير المقمرة، وكل خطوة أبعد قليلاً مما ينبغي عن سابقتها. وما يتركها طويل نحيل، لا يمشي إلا حين تغطّي الريح صوته. لم يرَ أحد وجهه… بل ظلّه على صفحة النجوم فقط.'),
    signs: L('Three-toed tracks; dunes that seem to shift between glances.', 'آثار بثلاث أصابع، وكثبان تبدو كأنها تتحرك بين نظرة وأخرى.'),
    rule: L('Keep the fire bright and never follow tracks that start nowhere.', 'أبقِ النار متّقدة، ولا تتبع آثاراً تبدأ من العدم.'),
    glimpse: L('At the edge of the firelight, a line of three-toed tracks begins in the middle of the sand — from nowhere.', 'عند أطراف ضوء النار، صفّ من آثار بثلاث أصابع يبدأ في وسط الرمل… من العدم.') },
  { id: 'sahibat-alquroun', realm: 'land', biomes: ['forest', 'mountain'], art: 'legend-sahibat-alquroun',
    name: L('Sahibat Al-Quroun', 'صاحبة القرون'), epithet: L('The Antler Keeper', 'حارسة العظام'),
    lore: L('Deep in old forests, travellers find perfect circles of antlers and bones laid on the moss. The keeper who arranges them is said to be tall and moss-covered, crowned with antlers, gathering what the forest has finished with and returning it to the ground with care.',
      'في أعماق الغابات القديمة، يجد المسافرون دوائر متقنة من القرون والعظام مصفوفة على الطحالب. ويُقال إن من ترتّبها طويلة يكسوها الطحلب، يتوّج رأسها قرنان متشعّبان، تجمع ما فرغت منه الغابة وتعيده إلى الأرض برفق.'),
    signs: L('Circles of bones; birds falling silent; the smell of wet bark.', 'دوائر من العظام، وطيور تصمت فجأة، ورائحة لحاء مبلول.'),
    rule: L('Never take a bone from the circle.', 'لا تأخذ عظمة من الدائرة أبداً.'),
    glimpse: L('Between the trunks, something tall and still stands crowned with antlers. When you look again, there is only moss.', 'بين الجذوع، يقف شيء طويل ساكن يتوّج رأسه قرنان. وحين تنظرون مرة أخرى… لا ترون إلا الطحلب.') },
  { id: 'ouyoun-alhawd', realm: 'land', biomes: ['cave'], art: 'legend-ouyoun-alhawd',
    name: L('Ouyoun Al-Hawd', 'عيون الحوض'), epithet: L('The Pool Eyes', 'سكّان الماء الأسود'),
    lore: L('Cavers who sit too long by underground pools report rows of small pale eyes rising just above the black water, never blinking. They do not follow you. They only remember you — and the next time you come, there are more of them.',
      'يروي مستكشفو الكهوف الذين يطيلون الجلوس عند البرك الجوفية أن صفوفاً من العيون الصغيرة الشاحبة ترتفع فوق الماء الأسود… ولا ترمش أبداً. إنها لا تلاحقك… بل تتذكّرك فقط. وفي المرة التالية التي تأتي فيها… تجدها أكثر عدداً.'),
    signs: L('Ripples with no wind; reflections where there should be none.', 'تموّجات بلا ريح، وانعكاسات حيث لا ينبغي أن يكون شيء.'),
    rule: L('Do not shine your light directly on the water.', 'لا توجّه ضوءك إلى الماء مباشرة.'),
    glimpse: L('Your light brushes the pool. A row of small pale eyes is already looking up at you.', 'يمرّ ضوؤكم على البركة… فإذا صفّ من العيون الصغيرة الشاحبة يحدّق إليكم منذ البداية.') },
  { id: 'musghi-alsaqee', realm: 'land', biomes: ['snow', 'mountain'], art: 'legend-musghi-alsaqee',
    name: L('Musghi Al-Saqee’', 'مُصغي الصقيع'), epithet: L('The Frost Listener', 'الذي يسمع الثلج'),
    lore: L('In the frozen north there is something that hunts by listening. It leaves tracks of both paws and fins, and stations report that their radios go quiet just before it passes — as if it were listening through them.',
      'في الشمال المتجمّد شيء يصطاد بالسمع. يترك آثار كفوف وزعانف معاً، وتقول محطات الرصد إن أجهزة الراديو تصمت قبيل مروره… كأنه يُصغي من خلالها.'),
    signs: L('Radios hissing then silent; tracks of paw and fin together.', 'راديو يخشخش ثم يصمت، وآثار كفّ وزعنفة معاً.'),
    rule: L('When the radio goes silent, so do you.', 'حين يصمت الراديو… اصمت أنت أيضاً.'),
    glimpse: L('The radio hisses, then goes completely silent. Outside, the snow crunches once — very close.', 'يخشخش الراديو ثم يصمت تماماً. وفي الخارج… ينسحق الثلج مرة واحدة… قريباً جداً.') },
  { id: 'raai-aladwa', realm: 'land', biomes: ['swamp'], art: 'legend-raai-aladwa',
    name: L('Ra’i Al-Adwa’', 'راعي الأضواء'), epithet: L('The Wisp Shepherd', 'راعي الأنوار'),
    lore: L('Science says swamp lights are burning gas. The legend says something tall in the reeds herds them like sheep, leading them in slow lines across the water toward whoever is lost — whether to guide them home or deeper in, nobody agrees.',
      'يقول العلم إن أضواء المستنقع غاز يحترق. أما الأسطورة فتقول إن شيئاً طويلاً بين القصب يرعاها كما يُرعى الغنم، ويسوقها في صفوف بطيئة فوق الماء نحو كل تائه… أيُعيده إلى بيته أم يأخذه إلى الأعمق؟ لا يتّفق على ذلك أحد.'),
    signs: L('Lights moving in a line, against the wind.', 'أضواء تسير في صفّ… عكس اتجاه الريح.'),
    rule: L('Follow the lights only if they are moving away from you.', 'لا تتبع الأضواء إلا إذا كانت تبتعد عنك.'),
    glimpse: L('The swamp lights drift into a neat line — against the wind — and turn, slowly, toward you.', 'تصطفّ أضواء المستنقع في خط منتظم… عكس الريح… ثم تستدير ببطء نحوكم.') },
  { id: 'alhajin-sifr', realm: 'land', biomes: ['ruins', 'lab'], art: 'legend-alhajin-sifr',
    name: L('Al-Hajin Sifr', 'الهجين صفر'), epithet: L('Hybrid Zero', 'التجربة الأولى'),
    lore: L('Club rumour, never confirmed: the abandoned field lab made one hybrid before all the others, and it was never logged. Students say that at night something knocks on the vents in patterns, and that the old lab computer sometimes prints a single word: “HOME?”',
      'شائعة في النادي لم تتأكد قط: صنع المختبر الميداني المهجور هجيناً واحداً قبل كل الهجائن الأخرى، ولم يُسجَّل أبداً. ويقول الطلاب إن شيئاً يطرق فتحات التهوية ليلاً بإيقاعات منتظمة، وإن حاسوب المختبر القديم يطبع أحياناً كلمة واحدة: «البيت؟»'),
    signs: L('Knocking in vents in patterns of three; screens waking by themselves.', 'طرق في فتحات التهوية بإيقاع ثلاثي، وشاشات تعمل من تلقاء نفسها.'),
    rule: L('If something knocks three times, do not knock back.', 'إذا طرق شيء ثلاث مرات… فلا تردّ الطرق.'),
    glimpse: L('Inside the wall, something knocks three times. A dead monitor flickers: HOME?', 'داخل الجدار، يطرق شيء ثلاث مرات. وتومض شاشة مطفأة: «البيت؟»') },
];

export const LEGEND_BY_ID = Object.fromEntries(LEGENDS.map((l) => [l.id, l]));
