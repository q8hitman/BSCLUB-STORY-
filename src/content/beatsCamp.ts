// Camp Moments: quiet scenes between the danger and the discoveries — warm, funny, curious or reflective.
// No checks (nothing can go wrong); the choice only shapes the mood, a little rest, or how the team feels.
// {name} is the creature (masculine in Arabic). It never speaks: it eats, sleeps, sniffs and watches.
import type { BeatTemplate } from '../engine/types';
import { C, L, O, en, tr } from './dsl';

const LAND = ['forest', 'desert', 'mountain', 'cave', 'snow', 'swamp'] as const;
const SHALLOW = ['reef', 'mudflat', 'seagrass'] as const;
const DEEP = ['twilight', 'midnight', 'vents'] as const;

const rest = (en_: string, ar: string) => O(en_, ar, 'happy', [en(1)], 'stars');

export const CAMP_BEATS: BeatTemplate[] = [
  {
    id: 'camp-land', mode: 'both', kind: 'explore', biomes: [...LAND], props: [], weight: 0.7,
    text: L('The light fades over {place}. The team makes camp: a small lantern, a kettle that will not stop hissing, notebooks drying on a rock. {name} circles the gear twice, sniffs the kettle, and settles down where it can watch everyone.',
      'بدأ الليل في {place}، فتوقّف الفريق ليرتاح. أشعلوا مصباحاً صغيراً، ووضعوا إبريق الشاي على النار، وتركوا الدفاتر على صخرة لتجفّ. دار {name} حول الأغراض مرتين وشمّ الإبريق، ثم جلس في مكان يرى منه الجميع.'),
    variants: [
      { when: { biome: ['desert'] }, text: L('Above the dunes, more stars appear than anyone has seen in the city.', 'وفوق الكثبان تظهر نجوم أكثر مما رآه أحد في المدينة.') },
      { when: { biome: ['snow', 'mountain'] }, text: L('Everyone’s breath hangs in the cold air like tiny clouds.', 'وتتعلّق أنفاس الجميع في الهواء البارد كغيوم صغيرة.') },
      { when: { biome: ['forest', 'swamp'] }, text: L('Fireflies blink on and off between the trees, as if signalling to each other.', 'وتومض اليراعات بين الأشجار كأنها تتبادل الإشارات.') },
      { when: { biome: ['cave'] }, text: L('Somewhere deeper in the cave, water drips with the patience of a clock.', 'وفي مكان أعمق من الكهف يقطر الماء بصبر الساعة.') },
    ],
    choices: [
      C('rest', L('Rest and recover', 'الراحة واستعادة النشاط'), 'careful',
        rest('{name} falls asleep almost instantly, twitching now and then as if dreaming of the trail. When the team wakes, everyone feels stronger.',
          'يغفو {name} في الحال تقريباً، ويرتعش بين حين وآخر كأنه يحلم بالطريق. وحين يستيقظ الفريق يشعر الجميع بنشاط أكبر.')),
      C('review', L('Lay out every clue and talk it through', 'عرض الأدلة كلها ومناقشتها'), 'clever',
        O('The team spreads the notes and samples on a cloth and argues happily until late. Nothing is solved yet — but now everyone sees the same questions.',
          'يفرش الفريق الملاحظات والعيّنات على قطعة قماش، ويتجادل بحماسة حتى وقت متأخر. لم يُحلّ شيء بعد، لكن الجميع صار يرى الأسئلة نفسها.', 'thinking', [tr(1)], 'map')),
      C('share', L('Share the snacks with {name}', 'مشاركة الوجبات الخفيفة مع {name}'), 'kind',
        O('{name} inspects each snack with great seriousness, rejects two, and steals a third from the bag when no one is looking. Somehow, the team feels closer.',
          'يتفحّص {name} كل وجبة بجدّية كبيرة، فيرفض اثنتين، ثم يسرق ثالثة من الكيس حين لا ينظر أحد. ولسبب ما يشعر الفريق بأنه صار أقرب إليه.', 'laughing', [tr(1)], 'heart')),
      C('story', L('Tell the funniest story from the club lab', 'رواية أطرف قصة من مختبر النادي'), 'silly',
        O('The story involves a centrifuge, a lost sandwich and a very confused professor. The laughter carries across {place}, and {name} watches the team with its head tilted.',
          'تدور القصة حول جهاز طرد مركزي، وشطيرة ضائعة، وأستاذ في غاية الحيرة. يتردّد الضحك في {place}، و{name} يراقب الفريق مائلاً برأسه.', 'laughing', [en(1)], 'pop')),
    ],
  },
  {
    id: 'camp-boat', mode: 'marine', kind: 'explore', biomes: [...SHALLOW], props: ['boat'], weight: 1,
    text: L('Back on the research boat, the sun sinks into the Gulf. Wet ropes, sample buckets, a hydrophone humming softly. {name} drips on the deck and stares at the water as if it can hear something the team cannot.',
      'رجع الفريق إلى قارب الأبحاث ليرتاح، والشمس تغرب فوق البحر. على القارب حبال مبلّلة وأوعية فيها عيّنات، وميكروفون يسجّل الأصوات تحت الماء. يقف {name} مبلّلاً وينظر إلى البحر، كأنه يسمع شيئاً لا يسمعه الفريق.'),
    choices: [
      C('rest', L('Rest on deck', 'الاستراحة على سطح القارب'), 'careful',
        rest('The boat rocks gently. {name} sleeps curled around a coil of rope, and the team wakes up stronger.', 'يتمايل القارب برفق، وينام {name} ملتفاً حول لفّة حبل، ويستيقظ الفريق أكثر نشاطاً.')),
      C('listen', L('Listen to the hydrophone together', 'الإصغاء إلى الميكروفون المائي معاً'), 'clever',
        O('Clicks, whistles, the crackle of snapping shrimp. The sea is far noisier than anyone expected, and everyone falls quiet to listen.', 'نقرات وصفير وطقطقة روبيان المسدّس… البحر أكثر ضجيجاً مما توقّع أي أحد، فيصمت الجميع ليُصغوا.', 'thinking', [tr(1)], 'radio')),
      C('share', L('Share dinner with {name}', 'مشاركة العشاء مع {name}'), 'kind',
        O('{name} accepts a piece of fish with dignity and then begs for the rest with no dignity at all.', 'يأخذ {name} قطعة السمك بهدوء وأدب… ثم يطلب باقي السمك كله بلا أي أدب!', 'laughing', [tr(1)], 'heart')),
      C('stars', L('Count the first stars', 'عدّ النجوم الأولى'), 'silly',
        O('Everyone counts a different number. {name} watches a seagull instead and is probably the only one who is right about anything.', 'كلّ يعدّ رقماً مختلفاً، أما {name} فيراقب نورساً بدلاً من ذلك، وربما كان الوحيد المصيب في شيء.', 'happy', [en(1)], 'pop')),
    ],
  },
  {
    id: 'camp-sub', mode: 'marine', kind: 'explore', biomes: [...DEEP], props: ['sub'], weight: 1.2,
    text: L('A pause inside the submersible. The cabin light is warm, the porthole is black, and small curious fish press against the glass to look in. {name} presses its face to the other side to look back.',
      'استراحة قصيرة داخل الغوّاصة. الضوء في الداخل دافئ، والماء خلف النافذة أسود تماماً. تقترب أسماك صغيرة من الزجاج لتنظر إلى الداخل، فيضع {name} وجهه على الزجاج لينظر إليها.'),
    choices: [
      C('rest', L('Rest while the batteries recharge', 'الراحة حتى تُشحن البطاريات'), 'careful',
        rest('The hum of the machines is strangely soothing. Everyone dozes for a while and wakes up clear-headed.', 'طنين الأجهزة مريح بشكل غريب؛ يغفو الجميع قليلاً ثم يستيقظون بذهن صاف.')),
      C('log', L('Update the dive log together', 'تحديث سجلّ الغوص معاً'), 'clever',
        O('Depth, temperature, every creature seen so far. Written down in one place, the dive suddenly looks like a real expedition.', 'العمق ودرجة الحرارة وكل كائن شوهد حتى الآن… حين تُدوَّن في مكان واحد تبدو الرحلة فجأة بعثةً علمية حقيقية.', 'thinking', [tr(1)], 'map')),
      C('fish', L('Watch the fish at the porthole', 'مراقبة الأسماك عند النافذة'), 'kind',
        O('A tiny fish and {name} stare at each other for a full minute. Neither blinks first.', 'ينظر {name} وسمكة صغيرة أحدهما في الآخر دقيقةً كاملة، ولا يرمش أيّ منهما أولاً.', 'happy', [tr(1)], 'still')),
      C('song', L('Hum a song for the deep', 'دندنة لحن للأعماق'), 'silly',
        O('The song is terrible. The fish leave. {name} seems to like it, which says something about {name}.', 'اللحن سيّئ جداً، فترحل الأسماك. لكن {name} يبدو معجباً به، وهذا يقول شيئاً عن {name}.', 'laughing', [en(1)], 'pop')),
    ],
  },
];
