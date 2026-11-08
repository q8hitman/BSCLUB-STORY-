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
      'صيادين الليل يحكون عن فانوس يتمايل على البحر المفتوح في مكان ما فيه أي لنج. اللي جدّفوا صوبه يقولون الضوء ينزل شوي شوي وهم يلحقونه… والماي حوله أسود زيادة عن اللزوم، كأن فيه شي ضخم ينتظر تحت والفانوس معلّق من راسه.'),
    signs: L('A warm, steady light on calm water; fish swimming away from it; a smell of hot oil.', 'ضوء دافي وثابت على ماي هادي، السمك يبتعد عنه، وريحة زيت حار.'),
    rule: L('Never row toward a lantern that has no boat.', 'لا تجدّف أبد صوب فانوس ما له لنج.'),
    glimpse: L('Far off, a lantern bobs on the black water — with no boat beneath it. Then it sinks.', 'بعيد، فانوس يتمايل على الماي الأسود… ولا تحته أي لنج. وبعدين… غاص.') },
  { id: 'bu-sahn', realm: 'sea', biomes: ['trench', 'midnight', 'openSea'], art: 'legend-bu-sahn',
    name: L('Bu Sahn', 'بو صحن'), epithet: L('The Plate-Eyed Giant', 'صاحب العين الصحن'),
    lore: L('The pearl divers’ oldest story: a creature longer than any boom, with a single eye as wide as a serving plate, rising from the deep to look at divers — never to harm them, only to watch. Old Bu Fahad swears he saw it. The Marine Science Club keeps his account on file, unproven.',
      'أقدم قصة عند الغواصين: كائن أطول من أي بوم، عنده عين وحدة عرضها مثل صحن العزايم، يطلع من الأعماق يطالع الغواصين… ما يأذيهم، بس يراقب. بو فهد يحلف إنه شافه، ونادي علوم البحار محتفظ بشهادته… بدون إثبات.'),
    signs: L('The sea goes silent; fish stop moving; a slow pressure in the ears.', 'البحر يسكت، السمك يوقف حركته، وضغط بطيء بالأذن.'),
    rule: L('If the eye looks at you, do not look away first.', 'إذا العين طالعتك، لا تشيل عينك قبله.'),
    glimpse: L('Something vast slides past beyond the light. For a heartbeat, an eye the size of a plate reflects the beam.', 'شي ضخم يمر ورا الضوء… ولثانية، عين كبر الصحن تعكس الكشاف.') },
  { id: 'katib-almad', realm: 'sea', biomes: ['mudflat', 'reef'], art: 'legend-katib-almad',
    name: L('Katib Al-Mad', 'كاتب المد'), epithet: L('The Tide Clerk', 'محاسب الجزر'),
    lore: L('At the lowest tides, a thin pale figure walks the mudflats on long fingers, picking up shells and counting them with soft clicks, always in sevens. It is said to be keeping a ledger of everything the sea has taken back.',
      'وقت أقوى جزر، يمشي على السبخات شي نحيف وشاحب على أصابع طويلة، يلقط الصدف ويعدّه بطقطقات خفيفة… دايماً سبعة سبعة. يقولون إنه يسجّل دفتر بكل شي البحر رجّعه لنفسه.'),
    signs: L('Clicks in groups of seven; neat rows of shells left on the mud.', 'طقطقة بمجموعات من سبعة، وصفوف صدف مرتبة على الطين.'),
    rule: L('Leave before the seventh click, or the tide will count you too.', 'امشِ قبل الطقة السابعة… لا يعدّك المد بعد.'),
    glimpse: L('On the mud, someone has laid shells in perfect rows of seven. Something clicks, out of sight.', 'على الطين، أحد رصّ الصدف بصفوف مرتبة من سبعة. وشي يطقطق… بمكان ما تشوفه.') },
  { id: 'saraqat-allulu', realm: 'sea', biomes: ['reef', 'seagrass'], art: 'legend-saraqat-allulu',
    name: L('Saraqat Al-Lulu', 'سارقة اللؤلؤ'), epithet: L('The Pearl Thief', 'لصّة المحار'),
    lore: L('Divers once blamed missing pearls on a pale, eight-armed thing whose suckers shine like little moons. It never takes a whole basket — just the best pearl — and leaves an empty shell in its place, polished, as if to say thank you.',
      'زمان، الغواصين كانوا يلومون على اللؤلؤ الضايع شي شاحب بثمان أذرع ممصّاته تلمع مثل أقمار صغيرة. عمره ما ياخذ الديين كله… بس أحلى لؤلؤة، ويخلّي مكانها صدفة فاضية مصقولة… كأنه يقول شكراً.'),
    signs: L('Polished empty shells; tiny moon-like lights in a crevice.', 'صدف فاضي مصقول، وأضواء صغيرة مثل القمر بين الشقوق.'),
    rule: L('Always leave one pearl for the reef.', 'خلّ دايماً لؤلؤة وحدة للشعاب.'),
    glimpse: L('In a crack in the coral, a row of small moonlike lights blinks — and an empty, polished shell rolls out.', 'بشق بالمرجان، صف أضواء صغيرة مثل القمر يرمش… وتطلع صدفة فاضية مصقولة.') },
  { id: 'jawqat-alqa', realm: 'sea', biomes: ['trench', 'vents', 'midnight'], art: 'legend-jawqat-alqa',
    name: L('Jawqat Al-Qa’', 'جوقة القاع'), epithet: L('The Choir Below', 'المغنّين تحت'),
    lore: L('Hydrophones sometimes catch a low, layered humming from the deepest trenches, like many throats singing one note. The legend says pale things gather on fallen whales to sing them to sleep — and that the song changes when visitors arrive.',
      'الميكروفونات تحت الماي أحياناً تلقط همهمة عميقة متداخلة من أعمق الخنادق، كأن حناجر وايد تغني نغمة وحدة. الأسطورة تقول إن أشياء شاحبة تتجمّع على الحيتان الساقطة وتغنّيها لين تنام… وإن الأغنية تتغيّر لما يجي زوار.'),
    signs: L('A hum you feel in your teeth; instruments drifting out of tune.', 'همهمة تحسها بسنونك، والأجهزة تطلع عن ضبطها.'),
    rule: L('Do not hum back.', 'لا تهمهم وياهم.'),
    glimpse: L('The hull starts to hum — one low note, sung by many voices, coming from below.', 'جسم الغوّاصة يبدا يهمهم… نغمة وحدة عميقة، بأصوات وايد، جاية من تحت.') },
  { id: 'abu-sabaa', realm: 'sea', biomes: ['twilight', 'midnight'], art: 'legend-abu-sabaa',
    name: L('Abu Sab’ Oyoun', 'أبو سبع عيون'), epithet: L('The Seven-Eyed Watcher', 'الرقيب بسبع عيون'),
    lore: L('A fish no net has ever kept, with seven eyes along its head that light one after another like a counting game. Sailors said the seventh eye only opens for those who are lost.',
      'سمكة عمرها ما بقت بشبكة، عندها سبع عيون على طول راسها تضوي وحدة ورا الثانية مثل لعبة عد. البحارة قالوا إن العين السابعة ما تنفتح إلا للضايعين.'),
    signs: L('Lights blinking in sequence in the dark: one, two, three…', 'أضواء ترمش بالترتيب بالظلام: وحدة، ثنتين، ثلاث…'),
    rule: L('Count with it — but stop at six.', 'عدّ وياها… بس وقّف عند ست.'),
    glimpse: L('In the dark, small lights blink on in order. One… two… three… You stop counting at six.', 'بالظلام، أضواء صغيرة تشتغل بالترتيب: وحدة… ثنتين… ثلاث… ووقفتوا العد عند ست.') },
  // ───────── LAND ─────────
  { id: 'mashi-alkuthban', realm: 'land', biomes: ['desert'], art: 'legend-mashi-alkuthban',
    name: L('Mashi Al-Kuthban', 'ماشي الكثبان'), epithet: L('The Dune Walker', 'الطويل اللي يمشي بالليل'),
    lore: L('Herders tell of three-toed tracks that appear around camps on moonless nights, each step a little too far from the last. Whatever leaves them is tall, thin, and walks only when the wind covers its sound. Nobody has seen its face — only its shadow against the stars.',
      'الرعاة يحكون عن آثار بثلاث أصابع تطلع حول المخيمات بليالي بدون قمر، كل خطوة أبعد شوي من اللي قبلها. اللي يخلّيها طويل ونحيف، وما يمشي إلا لما الهوا يغطي صوته. محد شاف وجهه… بس ظله على النجوم.'),
    signs: L('Three-toed tracks; dunes that seem to shift between glances.', 'آثار بثلاث أصابع، وكثبان كأنها تتحرك بين نظرة ونظرة.'),
    rule: L('Keep the fire bright and never follow tracks that start nowhere.', 'خلّ النار شابّة، ولا تتبع آثار ما لها بداية.'),
    glimpse: L('At the edge of the firelight, a line of three-toed tracks begins in the middle of the sand — from nowhere.', 'على طرف ضوء النار، صف آثار بثلاث أصابع يبدا بنص الرمل… من لا مكان.') },
  { id: 'sahibat-alquroun', realm: 'land', biomes: ['forest', 'mountain'], art: 'legend-sahibat-alquroun',
    name: L('Sahibat Al-Quroun', 'صاحبة القرون'), epithet: L('The Antler Keeper', 'حارسة العظام'),
    lore: L('Deep in old forests, travellers find perfect circles of antlers and bones laid on the moss. The keeper who arranges them is said to be tall and moss-covered, crowned with antlers, gathering what the forest has finished with and returning it to the ground with care.',
      'بأعماق الغابات القديمة، المسافرين يلقون دواير مثالية من القرون والعظام مرصوصة على الطحلب. يقولون اللي يرصّها طويلة ومغطاة بالطحلب، على راسها قرون، تجمع اللي خلّصت منه الغابة وترجعه للأرض بعناية.'),
    signs: L('Circles of bones; birds falling silent; the smell of wet bark.', 'دواير عظام، الطيور تسكت فجأة، وريحة لحاء مبلول.'),
    rule: L('Never take a bone from the circle.', 'لا تاخذ عظمة من الدايرة أبد.'),
    glimpse: L('Between the trunks, something tall and still stands crowned with antlers. When you look again, there is only moss.', 'بين الجذوع، شي طويل وساكن على راسه قرون. ولما طالعتوا مرة ثانية… ما فيه إلا طحلب.') },
  { id: 'ouyoun-alhawd', realm: 'land', biomes: ['cave'], art: 'legend-ouyoun-alhawd',
    name: L('Ouyoun Al-Hawd', 'عيون الحوض'), epithet: L('The Pool Eyes', 'سكّان الماي الأسود'),
    lore: L('Cavers who sit too long by underground pools report rows of small pale eyes rising just above the black water, never blinking. They do not follow you. They only remember you — and the next time you come, there are more of them.',
      'المستكشفين اللي يقعدون وايد عند برك الكهوف يقولون إن صفوف عيون صغيرة شاحبة تطلع فوق الماي الأسود… وما ترمش أبد. ما تلحقك… بس تتذكرك. والمرة الجاية تجي… تلقاها أكثر.'),
    signs: L('Ripples with no wind; reflections where there should be none.', 'تموّجات بدون هوا، وانعكاسات بمكان ما المفروض يكون فيه شي.'),
    rule: L('Do not shine your light directly on the water.', 'لا توجّه ضوك على الماي مباشرة.'),
    glimpse: L('Your light brushes the pool. A row of small pale eyes is already looking up at you.', 'ضوكم مرّ على البركة… وصف عيون صغيرة شاحبة كانت أصلاً تطالعكم.') },
  { id: 'musghi-alsaqee', realm: 'land', biomes: ['snow', 'mountain'], art: 'legend-musghi-alsaqee',
    name: L('Musghi Al-Saqee’', 'مُصغي الصقيع'), epithet: L('The Frost Listener', 'اللي يسمع الثلج'),
    lore: L('In the frozen north there is something that hunts by listening. It leaves tracks of both paws and fins, and stations report that their radios go quiet just before it passes — as if it were listening through them.',
      'بالشمال المتجمد فيه شي يصيد بالسمع. يخلّي آثار كفوف وزعانف مع بعض، والمحطات تقول إن أجهزة الراديو تسكت قبل لا يمر… كأنه يسمع من خلالها.'),
    signs: L('Radios hissing then silent; tracks of paw and fin together.', 'الراديو يوشوش وبعدين يسكت، وآثار كف وزعنفة مع بعض.'),
    rule: L('When the radio goes silent, so do you.', 'لما الراديو يسكت… اسكت إنت بعد.'),
    glimpse: L('The radio hisses, then goes completely silent. Outside, the snow crunches once — very close.', 'الراديو وشوش وبعدين سكت تماماً. وبرا… الثلج طقطق مرة وحدة… قريب وايد.') },
  { id: 'raai-aladwa', realm: 'land', biomes: ['swamp'], art: 'legend-raai-aladwa',
    name: L('Ra’i Al-Adwa’', 'راعي الأضواء'), epithet: L('The Wisp Shepherd', 'اللي يرعى الأنوار'),
    lore: L('Science says swamp lights are burning gas. The legend says something tall in the reeds herds them like sheep, leading them in slow lines across the water toward whoever is lost — whether to guide them home or deeper in, nobody agrees.',
      'العلم يقول أضواء المستنقع غاز يحترق. والأسطورة تقول إن شي طويل بين القصب يرعاها مثل الغنم، ويمشّيها بصفوف بطيئة فوق الماي صوب أي أحد ضايع… يرجّعه لبيته ولا يدخّله أعمق؟ محد متفق.'),
    signs: L('Lights moving in a line, against the wind.', 'أضواء تمشي بصف… عكس الهوا.'),
    rule: L('Follow the lights only if they are moving away from you.', 'اتبع الأضواء بس إذا كانت تبتعد عنك.'),
    glimpse: L('The swamp lights drift into a neat line — against the wind — and turn, slowly, toward you.', 'أضواء المستنقع تتصف بخط مرتب… عكس الهوا… وتلف شوي شوي صوبكم.') },
  { id: 'alhajin-sifr', realm: 'land', biomes: ['ruins', 'lab'], art: 'legend-alhajin-sifr',
    name: L('Al-Hajin Sifr', 'الهجين صفر'), epithet: L('Hybrid Zero', 'التجربة الأولى'),
    lore: L('Club rumour, never confirmed: the abandoned field lab made one hybrid before all the others, and it was never logged. Students say that at night something knocks on the vents in patterns, and that the old lab computer sometimes prints a single word: “HOME?”',
      'إشاعة بالنادي، عمرها ما تأكدت: المختبر الميداني المهجور سوّى هجين واحد قبل الكل، وما انسجل أبد. الطلاب يقولون إن بالليل شي يطق على فتحات التهوية بأنماط، وإن كمبيوتر المختبر القديم أحياناً يطبع كلمة وحدة: «البيت؟»'),
    signs: L('Knocking in vents in patterns of three; screens waking by themselves.', 'طق بالفتحات بنمط ثلاثي، وشاشات تشتغل بروحها.'),
    rule: L('If something knocks three times, do not knock back.', 'إذا شي طق ثلاث مرات… لا ترد الطق.'),
    glimpse: L('Inside the wall, something knocks three times. A dead monitor flickers: HOME?', 'داخل الجدار، شي طق ثلاث مرات. وشاشة طافية رمشت: «البيت؟»') },
];

export const LEGEND_BY_ID = Object.fromEntries(LEGENDS.map((l) => [l.id, l]));
