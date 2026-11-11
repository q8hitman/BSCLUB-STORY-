# Builds a second land (Classic) archive story by hand: "Lights in the Desert" — desert-lights@1.json.
# Same proven graph shape as the other archive stories: hook → 2 paths → middle → 2 paths → climax → 3 endings,
# 4 open choices + 2 anatomy choices per scene. Also fixes the goal/variant text of trench-whispers@1.
import io, json, re
PH = re.compile(r'\{(\w+)[^}]*\}')
def L(en, ar):
    assert set(PH.findall(en)) == set(PH.findall(ar)), (en, ar)
    assert "أبي" not in ar and "أكو" not in ar, ar
    return {'en': en, 'ar': ar}
def C(cid, style, mood, effects, fx, nxt, label, text, requires=None):
    c = {'id': cid, 'label': label, 'style': style, 'success': {'text': text, 'mood': mood, 'effects': effects, 'fx': fx, 'next': nxt}}
    if requires: c['requires'] = {'capAny': requires}
    return c
ev = lambda i: [{'t': 'evidence', 'id': i}]
trust = [{'t': 'trust', 'd': 1}]
en = lambda d: [{'t': 'energy', 'd': d}]

nodes = {}
nodes['camp-hook'] = {'kind': 'hook', 'biome': 'desert', 'props': [], 'plate': 'desert-night-glow',
 'goal': L('Find out what the moving lights around the desert camp are.', 'اعرفوا ما هي الأضواء التي تتحرّك حول المخيّم في الصحراء.'),
 'text': L('A family camping in the desert called the club for help. Every night, small lights move over the sand around their tent, always two by two, and something scratches near the food boxes. The family thinks it is a ghost. Tonight the team is at the camp with {name}. Far away, two small lights appear… then two more.',
           'اتصلت عائلة تخيّم في الصحراء بالنادي وطلبت المساعدة. كل ليلة تتحرّك أضواء صغيرة فوق الرمل حول خيمتهم، ودائماً اثنين اثنين، وشيء يخدش قرب صناديق الطعام. العائلة تظن أنه شبح. الليلة وصل الفريق إلى المخيّم ومعه {name}. ومن بعيد يظهر ضوءان صغيران… ثم ضوءان آخران.'),
 'choices': [
  C('walk-toward', 'bold', 'proud', en(-1), 'chase', 'dunes-tracks', L('Walk toward the lights', 'امشوا نحو الأضواء'), L('The lights move away as fast as the team comes closer. But they leave small footprints in the sand.', 'كلما اقترب الفريق ابتعدت الأضواء بسرعة. لكنها تركت آثار أقدام صغيرة على الرمل.')),
  C('read-tracks', 'careful', 'thinking', ev('small-tracks'), 'scan', 'dunes-tracks', L('Look for footprints in the sand', 'ابحثوا عن آثار أقدام على الرمل'), L('There are many tiny footprints with a long line between them: an animal that hops and drags its tail.', 'على الرمل آثار أقدام صغيرة كثيرة وبينها خط طويل: حيوان يقفز ويجرّ ذيله خلفه.')),
  C('ask-family', 'clever', 'thinking', ev('family-story'), 'scan', 'old-well', L('Ask the family when the lights appear', 'اسألوا العائلة متى تظهر الأضواء'), L('The father says: “They come only after we switch on the big lamp. And they always stay near the old well.”', 'يقول الوالد: «تظهر فقط بعد أن نشعل المصباح الكبير. وتبقى دائماً قرب البئر القديمة.»')),
  C('comfort-kids', 'kind', 'happy', trust, 'heart', 'old-well', L('Calm the children with {duck}', 'هدّئوا الأطفال مع {duck}'), L('The team tells the children that scientists look for causes, not ghosts. The children point: the lights always come from the old well.', 'يقول الفريق للأطفال إن العلماء يبحثون عن السبب، ولا يخافون من الأشباح. يشير الأطفال بأيديهم: الأضواء تأتي دائماً من جهة البئر القديمة.')),
  C('night-look', 'bold', 'shocked', ev('watchers'), 'scan', 'dunes-tracks', L('Let {name} look into the dark', 'دعوا {name} ينظر في الظلام'), L('{name} sees what the team cannot: small animals with big ears sitting on the dune, watching the camp.', 'يرى {name} ما لا يراه الفريق: حيوانات صغيرة آذانها كبيرة تجلس فوق الكثيب وتراقب المخيّم.'), ['nightVision', 'echolocation']),
  C('sniff-air', 'clever', 'thinking', ev('food-smell'), 'sniff', 'old-well', L('Let {name} sniff the air', 'دعوا {name} يشمّ الهواء'), L('{name} turns toward the food boxes, then toward the old well: the smell of food leads there.', 'يلتفت {name} نحو صناديق الطعام، ثم نحو البئر القديمة: رائحة الطعام تصل إلى هناك.'), ['scent', 'heatSense']),
 ]}
nodes['dunes-tracks'] = {'kind': 'explore', 'biome': 'desert', 'props': [], 'plate': 'desert-dune-crossing',
 'text': L('The footprints lead over the dunes. The sand is still warm from the day. Between the dunes there are many small holes, and the footprints go in and out of them.',
           'تقود الآثار الفريق فوق الكثبان (تلال الرمل). الرمل ما زال دافئاً من حرارة النهار. وبين الكثبان حفر صغيرة كثيرة، والآثار تدخل إليها وتخرج منها.'),
 'choices': [
  C('measure-tracks', 'careful', 'thinking', ev('long-feet'), 'sample', 'camp-site', L('Measure the footprints', 'قيسوا آثار الأقدام'), L('The back feet are much longer than the front ones. This animal jumps like a tiny kangaroo.', 'القدمان الخلفيتان أطول كثيراً من الأماميتين. هذا الحيوان يقفز مثل كنغر صغير جداً.')),
  C('climb-dune', 'bold', 'proud', en(1), 'climb', 'camp-site', L('Climb the dune to see farther', 'اصعدوا الكثيب لتروا من بعيد'), L('From the top the team sees the whole camp, and many pairs of lights around it, not just one.', 'من فوق يرى الفريق المخيّم كله، وحوله أضواء كثيرة اثنين اثنين، وليس ضوءين فقط.')),
  C('study-holes', 'clever', 'thinking', ev('burrows'), 'scan', 'camp-site', L('Look at the holes in the sand', 'افحصوا الحفر في الرمل'), L('The holes are burrows: small homes under the sand, where it stays cool during the day.', 'هذه الحفر جحور: بيوت صغيرة تحت الرمل، يبقى داخلها بارداً في النهار.')),
  C('rest-duck', 'kind', 'happy', trust, 'heart', 'camp-site', L('Share the water with {duck}', 'تقاسموا الماء مع {duck}'), L('Everyone drinks, {duck} too. In the desert, water comes first.', 'يشرب الجميع، ومنهم {duck}. في الصحراء الماء أهم شيء.')),
  C('dig-burrow', 'bold', 'proud', ev('stored-seeds'), 'dig', 'camp-site', L('Let {name} dig beside a burrow', 'دعوا {name} يحفر بجانب جحر'), L('{name} digs carefully and finds seeds stored under the sand: the animal keeps its food here.', 'يحفر {name} بحذر فيجد بذوراً مخزّنة تحت الرمل: الحيوان يحفظ طعامه هنا.'), ['dig']),
  C('fast-follow', 'clever', 'thinking', en(1), 'jump', 'camp-site', L('Let {name} follow the footprints quickly', 'دعوا {name} يتتبّع الآثار بسرعة'), L('{name} follows the footprints across the sand and stops at a burrow: they end there.', 'يتتبّع {name} الآثار فوق الرمل ويقف عند جحر: الآثار تنتهي هناك.'), ['jump', 'climb', 'grip']),
 ]}
nodes['old-well'] = {'kind': 'explore', 'biome': 'desert', 'props': [], 'plate': 'desert-mirage-oasis',
 'text': L('Near the old well the ground is a little wet, and small plants grow. In the light of the torch, pairs of small lights shine for a second among the plants, then disappear.',
           'قرب البئر القديمة الأرض رطبة قليلاً، وتنمو نباتات صغيرة. في ضوء المصباح اليدوي تلمع أضواء صغيرة بين النباتات لحظة، اثنين اثنين، ثم تختفي.'),
 'choices': [
  C('torch-test', 'careful', 'thinking', ev('eye-shine'), 'flash', 'camp-site', L('Switch the torch off, then on', 'أطفئوا المصباح ثم أشعلوه'), L('When the torch is off, the lights disappear. When it is on, they come back. So they do not make light: they send your light back.', 'حين ينطفئ المصباح تختفي الأضواء. وحين يشتعل ترجع. إذن هي لا تصنع ضوءاً: هي تعكس ضوء مصباحكم.')),
  C('go-around', 'bold', 'proud', en(1), 'still', 'camp-site', L('Go around the well quietly', 'دوروا حول البئر بهدوء'), L('The team reaches the other side without a sound. Something small runs into the plants.', 'يصل الفريق إلى الجهة الأخرى دون أي صوت. وشيء صغير يهرب بين النباتات.')),
  C('look-plants', 'clever', 'thinking', ev('bitten-plants'), 'scan', 'camp-site', L('Look at the plants', 'افحصوا النباتات'), L('Some plants are bitten, and there are insects everywhere. For small animals, this place is full of food and water.', 'بعض النباتات مقضومة، والحشرات في كل مكان. هذا المكان مليء بالطعام والماء للحيوانات الصغيرة.')),
  C('wait-duck', 'kind', 'happy', trust, 'heart', 'camp-site', L('Wait for {duck}', 'انتظروا {duck}'), L('The team waits until everyone is together, {duck} included. Nobody walks alone in the desert at night.', 'ينتظر الفريق حتى يجتمع الكل، ومنهم {duck}. لا أحد يمشي وحده في الصحراء ليلاً.')),
  C('feel-heat', 'clever', 'thinking', ev('five-hiding'), 'scan', 'camp-site', L('Let {name} feel for warm bodies', 'دعوا {name} يبحث عن أجسام دافئة'), L('{name} points with its head at five places in the plants: five small warm animals are hiding there.', 'يشير {name} برأسه إلى خمسة أماكن بين النباتات: خمسة حيوانات صغيرة دافئة تختبئ هناك.'), ['heatSense']),
  C('soft-glow', 'bold', 'shocked', ev('big-ears-seen'), 'flash', 'camp-site', L('Let {name} glow softly', 'دعوا {name} يضيء بضوء خفيف'), L('In the soft light of {name}, a small fox with huge ears looks back for a moment, then runs.', 'في ضوء {name} الخفيف يظهر ثعلب صغير بأذنين كبيرتين جداً، ينظر لحظة ثم يهرب.'), ['glow']),
 ]}
nodes['camp-site'] = {'kind': 'challenge', 'biome': 'desert', 'props': [], 'plate': 'camp-desert-stars',
 'text': L('Back at the camp. Beside the tent there are open food boxes and a bag of rubbish. The big lamp is on. Around the camp, in the dark, pairs of lights are waiting.',
           'رجع الفريق إلى المخيّم. بجانب الخيمة صناديق طعام مفتوحة وكيس قمامة. المصباح الكبير مشتعل. وحول المخيّم، في الظلام، أضواء تنتظر اثنين اثنين.'),
 'choices': [
  C('sit-lamp', 'careful', 'thinking', en(-1), 'still', 'lamp-watch', L('Sit quietly beside the lamp and wait', 'اجلسوا بهدوء قرب المصباح وانتظروا'), L('After a few minutes the lights come closer, slowly, toward the lamp.', 'بعد دقائق تقترب الأضواء ببطء نحو المصباح.')),
  C('move-food', 'bold', 'proud', ev('bite-marks'), 'impact', 'lamp-watch', L('Move the food boxes into the car', 'انقلوا صناديق الطعام إلى السيارة'), L('Under the boxes there are small bite marks and seeds. Someone small has been eating here every night.', 'تحت الصناديق آثار قضم صغيرة وبذور. حيوان صغير يأكل هنا كل ليلة.')),
  C('watch-holes', 'clever', 'thinking', ev('burrow-near-tent'), 'scan', 'burrow-watch', L('Watch the burrows near the tent', 'راقبوا الجحور القريبة من الخيمة'), L('A small animal comes out of a burrow, sits up on two long legs, and looks at the lamp.', 'يخرج حيوان صغير من جحر، ويقف على رجلين طويلتين، وينظر إلى المصباح.')),
  C('tell-family', 'kind', 'happy', trust, 'heart', 'burrow-watch', L('Tell the family what you found, with {duck}', 'أخبروا العائلة بما وجدتم، ومعكم {duck}'), L('The family listens carefully. The children want to see the burrows near the tent, so the team takes them there.', 'تستمع العائلة باهتمام. الأطفال يريدون أن يروا الجحور القريبة من الخيمة، فيأخذهم الفريق إليها.')),
  C('under-bag', 'bold', 'proud', ev('prints-under-bag'), 'dig', 'lamp-watch', L('Let {name} check under the rubbish bag', 'دعوا {name} يفحص تحت كيس القمامة'), L('{name} pushes the bag aside: under it, the sand is full of tiny footprints.', 'يدفع {name} الكيس جانباً: الرمل تحته مليء بآثار أقدام صغيرة.'), ['dig']),
  C('smell-trail', 'clever', 'thinking', ev('food-to-burrows'), 'sniff', 'burrow-watch', L('Let {name} follow the smell of food', 'دعوا {name} يتتبّع رائحة الطعام'), L('{name} follows the smell from the boxes to the burrows: the food is being carried there.', 'يتتبّع {name} الرائحة من الصناديق إلى الجحور: الطعام يُنقل إلى هناك.'), ['scent', 'venom']),
 ]}
nodes['lamp-watch'] = {'kind': 'challenge', 'biome': 'desert', 'props': [], 'plate': 'desert-jerboa-hat', 'featured': 'jerboa',
 'text': L('Beside the lamp, the lights finally come close enough to see. They are eyes! A small animal with a long tail and very long back legs hops into the light: a jerboa. Its eyes shine because they send the light of the lamp back.',
           'قرب المصباح اقتربت الأضواء أخيراً حتى صارت واضحة. إنها عيون! يقفز إلى الضوء حيوان صغير له ذيل طويل ورجلان خلفيتان طويلتان جداً: إنه الجربوع. وعيناه تلمعان لأنهما تعكسان ضوء المصباح.'),
 'choices': [
  C('photo', 'careful', 'thinking', ev('jerboa-photo'), 'camera', 'dawn-answer', L('Take a photo without a flash', 'التقطوا صورة بدون فلاش'), L('The photo shows the jerboa clearly, with two bright dots where its eyes are.', 'تظهر في الصورة صورة الجربوع بوضوح، ومكان عينيه نقطتان لامعتان.')),
  C('stay-still', 'kind', 'happy', trust, 'still', 'dawn-answer', L('Stay still so it is not afraid', 'ابقوا بلا حركة حتى لا يخاف'), L('The jerboa hops closer, takes a seed near a shoe, and hops away.', 'يقترب الجربوع قفزاً، يأخذ بذرة قرب أحد الأحذية، ثم يبتعد قفزاً.')),
  C('lamp-test', 'bold', 'proud', ev('lamp-test'), 'flash', 'dawn-answer', L('Switch the big lamp off for a moment', 'أطفئوا المصباح الكبير لحظة'), L('The shining eyes disappear at once. Lamp on: they shine again. The “ghost lights” are eyes sending back the light of the lamp.', 'تختفي العيون اللامعة فوراً. يشتعل المصباح فتلمع من جديد. إذن «أضواء الشبح» عيون تعكس ضوء المصباح.')),
  C('count-eyes', 'clever', 'thinking', ev('nine-pairs'), 'scan', 'dawn-answer', L('Count the pairs of eyes', 'عُدّوا العيون'), L('Nine pairs. Most are low, near the sand. Two are higher: a bigger animal is watching too.', 'تسعة أزواج من العيون. أغلبها منخفض قرب الرمل. وزوجان منها أعلى: حيوان أكبر يراقب أيضاً.')),
  C('own-light', 'bold', 'shocked', ev('any-light'), 'flash', 'dawn-answer', L('Let {name} make a small light of its own', 'دعوا {name} يصنع ضوءاً صغيراً من جسمه'), L('The eyes shine in the light of {name} too. Any light at night makes them shine.', 'تلمع العيون في ضوء {name} أيضاً. أي ضوء في الليل يجعلها تلمع.'), ['shock', 'glow']),
  C('lift-lamp', 'clever', 'thinking', ev('fox-on-dune'), 'climb', 'dawn-answer', L('Let {name} lift the lamp higher', 'دعوا {name} يرفع المصباح إلى الأعلى'), L('With the lamp higher, the light reaches the dune: a small fox with big ears sits there, its eyes shining.', 'حين يرتفع المصباح يصل ضوءه إلى الكثيب: هناك يجلس ثعلب صغير بأذنين كبيرتين، وعيناه تلمعان.'), ['grip', 'climb']),
 ]}
nodes['burrow-watch'] = {'kind': 'challenge', 'biome': 'desert', 'props': [], 'plate': 'desert-dhub-standoff', 'featured': 'fennec',
 'text': L('Near the burrows, a small fox with huge ears comes out of the dark: a fennec fox. It is hunting the insects that fly around the lamp. Its eyes shine in the light. A sleepy lizard with a spiky tail watches from its hole.',
           'قرب الجحور يخرج من الظلام ثعلب صغير بأذنين كبيرتين جداً: إنه ثعلب الفنك. جاء يصطاد الحشرات التي تطير حول المصباح. عيناه تلمعان في الضوء. ومن حفرة قريبة يراقب ضبّ نعسان (سحلية ذيلها مليء بالأشواك).'),
 'choices': [
  C('watch-fox', 'careful', 'thinking', en(1), 'binoculars', 'dawn-answer', L('Watch the fox from far away', 'راقبوا الثعلب من بعيد'), L('The fox catches a beetle near the lamp and eats it. The lamp brings insects, and insects bring the fox.', 'يصطاد الثعلب خنفساء قرب المصباح ويأكلها. المصباح يجذب الحشرات، والحشرات تجذب الثعلب.')),
  C('stand-between', 'bold', 'proud', ev('fox-not-afraid'), 'still', 'dawn-answer', L('Stand between the fox and the food boxes', 'قفوا بين الثعلب وصناديق الطعام'), L('The fox stops, looks, and walks around the team. It is not afraid of the camp: it comes here every night.', 'يتوقف الثعلب وينظر، ثم يمشي حول الفريق. هو لا يخاف من المخيّم: يأتي إلى هنا كل ليلة.')),
  C('study-eyes', 'clever', 'thinking', ev('green-shine'), 'scan', 'dawn-answer', L('Look closely at how the eyes shine', 'افحصوا كيف تلمع العيون'), L('The shine is green. Many night animals have a layer at the back of the eye that sends light back, so they see better in the dark.', 'لون اللمعان أخضر. عند كثير من حيوانات الليل طبقة في آخر العين تعكس الضوء، فترى أفضل في الظلام.')),
  C('notes-duck', 'kind', 'happy', trust, 'heart', 'dawn-answer', L('Write everything down with {duck}', 'اكتبوا كل شيء في الدفتر مع {duck}'), L('Every detail is now in the notebook that {duck} carries: the time, the place and the animals.', 'كل التفاصيل الآن في الدفتر الذي مع {duck}: الوقت والمكان والحيوانات.')),
  C('empty-burrow', 'bold', 'proud', ev('bread-in-burrow'), 'dig', 'dawn-answer', L('Let {name} look into an empty burrow', 'دعوا {name} يفحص جحراً فارغاً'), L('{name} finds an old burrow full of seeds and bits of bread: food taken from the camp.', 'يجد {name} جحراً قديماً فيه بذور وقطع خبز: طعام مأخوذ من المخيّم.'), ['dig']),
  C('hide-watch', 'clever', 'thinking', ev('no-ghost'), 'camo', 'dawn-answer', L('Let {name} hide and watch', 'دعوا {name} يختبئ ويراقب'), L('Hidden, {name} sees everything: jerboas near the boxes, the fox near the lamp, and no ghost anywhere.', 'من مكانه المخفي يرى {name} كل شيء: جرابيع قرب الصناديق، والثعلب قرب المصباح، ولا يوجد أي شبح.'), ['camouflage', 'nightVision']),
 ]}
nodes['dawn-answer'] = {'kind': 'climax', 'biome': 'desert', 'props': [], 'plate': 'desert-heat-haze', 'cinematic': 'reveal',
 'text': L('The sky turns light. Now the team knows the answer. The “ghost lights” are the eyes of night animals: jerboas that come for the food left outside, and a fennec fox that hunts the insects around the lamp. Their eyes shine because they send the light of the lamp back. The family asks: “So what should we do?”',
           'بدأ ضوء الصباح يظهر. الآن عرف الفريق الجواب. «أضواء الشبح» هي عيون حيوانات الليل: جرابيع تأتي من أجل الطعام المتروك في الخارج، وثعلب فنك يصطاد الحشرات حول المصباح. وعيونها تلمع لأنها تعكس ضوء المصباح. تسأل العائلة: «وماذا نفعل الآن؟»'),
 'choices': [
  C('show-photos', 'bold', 'proud', [], 'screen', 'end:eyes-explained', L('Show the family the photos and explain everything', 'أروا العائلة الصور واشرحوا كل شيء'), L('The family looks at the photos and laughs with relief. The children ask to give the fox a name.', 'تنظر العائلة إلى الصور وتضحك بارتياح. ويطلب الأطفال أن يختاروا اسماً للثعلب.')),
  C('tidy-camp', 'kind', 'happy', [], 'heart', 'end:quiet-camp', L('Help the family close the food away and turn the lamp down', 'ساعدوا العائلة على إغلاق الطعام وتخفيف ضوء المصباح'), L('The food goes into closed boxes and the lamp is turned down. That night only two pairs of eyes come, then they go back to the desert.', 'يوضع الطعام في صناديق مغلقة ويُخفَّف ضوء المصباح. في تلك الليلة يأتي زوجان فقط من العيون، ثم يرجعان إلى الصحراء.')),
  C('count-game', 'clever', 'laughing', [], 'stars', 'end:ghost-counting', L('Wait one more night with the children', 'انتظروا ليلة أخرى مع الأطفال'), L('The children sit with torches and count the shining eyes like stars. They give every pair a funny name.', 'يجلس الأطفال ومعهم مصابيح يدوية، ويعدّون العيون اللامعة مثل النجوم. ويختارون لكل زوج اسماً مضحكاً.')),
  C('night-camera', 'bold', 'proud', [], 'camera', 'end:eyes-explained', L('Set up a camera for the night', 'ضعوا كاميرا تصوّر طوال الليل'), L('The camera films jerboas, the fox, and a hedgehog nobody expected. The club now has a full list of the night visitors of the camp.', 'تصوّر الكاميرا الجرابيع والثعلب، وقنفذاً لم يتوقّعه أحد. صار عند النادي قائمة كاملة بزوّار المخيّم في الليل.')),
 ]}
endings = {
 'eyes-explained': {'tone': 'scientific', 'title': L('The Lights Were Eyes', 'الأضواء كانت عيوناً'),
   'summary': L('The team proved that the moving lights were the eyes of night animals sending back the light of the camp lamp.', 'أثبت الفريق أن الأضواء المتحرّكة هي عيون حيوانات الليل وهي تعكس ضوء مصباح المخيّم.'),
   'epilogue': L('The family kept the photos. The club used them in a small guide called “Night animals of the desert camp”, and {name} is on the cover.', 'احتفظت العائلة بالصور. واستعملها النادي في كتيّب صغير اسمه «حيوانات الليل في مخيّم الصحراء»، وصورة {name} على غلافه.')},
 'quiet-camp': {'tone': 'wholesome', 'title': L('A Quiet Camp', 'مخيّم هادئ'),
   'summary': L('The team solved the mystery and helped the family camp without disturbing the animals.', 'حلّ الفريق اللغز، وساعد العائلة على التخييم دون إزعاج الحيوانات.'),
   'epilogue': L('With the food closed away and the lamp turned down, the animals went back to finding their own food. The family still sees a pair of eyes sometimes, and now the children wave at it.', 'بعد إغلاق الطعام وتخفيف ضوء المصباح، رجعت الحيوانات تبحث عن طعامها بنفسها. ما زالت العائلة ترى زوجاً من العيون أحياناً، والأطفال الآن يلوّحون له.')},
 'ghost-counting': {'tone': 'comedic', 'title': L('The Ghost Counters', 'عدّادو الأشباح'),
   'summary': L('The “ghosts” turned out to be jerboas and a fox, and counting their shining eyes became the favourite game of the camp.', 'تبيّن أن «الأشباح» جرابيع وثعلب، وصار عدّ عيونها اللامعة لعبة المخيّم المفضّلة.'),
   'epilogue': L('The children made a list of “ghosts” with names like Jumper and Big Ears. A copy of it now hangs on the wall of the club, brought by {duck}.', 'كتب الأطفال قائمة «الأشباح» بأسماء مثل «القفّاز» و«ذو الأذنين». ونسخة منها معلّقة الآن على جدار النادي، ومعها توقيع {duck}.')},
}
pkg = {'id': 'desert-lights', 'v': 1, 'status': 'published', 'mode': 'classic', 'source': 'hand-written 2026-11-11',
 'title': L('Lights in the Desert', 'أضواء في الصحراء'),
 'premise': L('A family camping in the desert sees small lights moving around their tent every night, always in pairs. They think it is a ghost.', 'عائلة تخيّم في الصحراء ترى كل ليلة أضواء صغيرة تتحرّك حول خيمتها، دائماً اثنين اثنين. وتظن أنه شبح.'),
 'tone': 'comedy', 'tags': {'themes': ['night-camp', 'eye-shine', 'food-waste'], 'locations': ['desert'], 'twist': 'misidentified-animals', 'creatures': ['jerboa', 'fennec', 'dhub']},
 'world': {}, 'science': ['desert-heat', 'desert-dew'], 'start': 'camp-hook', 'nodes': nodes, 'endings': endings}
io.open('src/stories/desert-lights@1.json', 'w', encoding='utf-8', newline='').write(json.dumps(pkg, ensure_ascii=False, indent=1) + '\n')

# trench-whispers: the goal and the scanner variant still had the draft's wording
P = 'src/stories/trench-whispers@1.json'; p = json.load(io.open(P, encoding='utf-8'))
p['nodes']['trench-hook']['goal'] = L('Find out what is making the drum sound at the bottom of the deep trench.', 'اعرفوا ما الذي يصدر صوت الطبل في قاع الخندق العميق.')
for v in p['nodes']['trench-middle'].get('variants', []): v['text'] = L('The depth scanner points straight at the skeleton.', 'وجهاز كشف الأعماق يشير مباشرة إلى الهيكل.')
io.open(P, 'w', encoding='utf-8', newline='').write(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
print('ok')
