// Ending Composer: builds a personalised ending only from facts recorded in the game state.
import { DUCK_BY_ID } from '../content/ducks';
import { PART_BY_ID } from '../content/parts';
import { BIOMES, FACT_BY_ID, NPC_BY_ID } from '../content/world';
import { Rng } from './rng';
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
    titles: [L('The Professor Returns', 'عودة الدكتورة'), L('Found: One Scientist, Slightly Sunburnt', 'تم العثور على عالمة… محروقة شوي')],
    epilogue: L('Dr. Basma is back in the BSC lab, and {name} has a permanent bench next to hers. The club’s newest project: protecting the habitats they explored together.', 'الدكتورة بسمة رجعت لمختبر النادي، و{name} صار له طاولة دايمة جنبها. مشروع النادي الجديد: حماية البيئات اللي استكشفوها سوا.') },
  { id: 'publish', mode: 'both', tone: 'scientific', score: (s) => (s.evidence.length >= 6 && (has(s, 'saved-evidence') || has(s, 'vex-exposed') || s.evidence.includes('hybridizer-data') || s.evidence.includes('new-vent-sample') || s.evidence.includes('probe-data')) ? 6 + s.evidence.length / 4 : 0),
    titles: [L('The Paper That Shook the Campus', 'الورقة اللي هزّت الجامعة'), L('Peer-Reviewed and Fabulous', 'محكّمة علمياً وفخمة'), L('Data Doesn’t Lie', 'البيانات ما تكذب')],
    epilogue: L('The field notes become a real research poster — first author: {player}. {name} attends the presentation and only eats one poster board.', 'الملاحظات الميدانية صارت بوستر بحثي حقيقي — المؤلف الأول: {player}. {name} حضر العرض وأكل لوحة بوستر وحدة بس.') },
  { id: 'guardian', mode: 'classic', tone: 'heroic', score: (s) => (has(s, 'saved-animals') ? 5 : 0) + (has(s, 'village-allies') ? 3 : 0) + (has(s, 'knows-purpose') ? 2 : 0) + (has(s, 'freed-samples') ? 2 : 0) + (has(s, 'habitat-threat') ? 2 : 0),
    titles: [L('Guardian of {last}', 'حارس {last}'), L('The Beast Who Protects', 'الوحش الحامي')],
    epilogue: L('{name} stays near {last}, keeping watch. Rangers report fewer problems — and a mysterious helper who leaves footprints nobody can identify.', '{name} بقى قرب {last} يحرسه. الحرّاس يقولون المشاكل قلّت — وفيه مساعد غامض يخلّي آثار محد يعرفها.') },
  { id: 'frenemies', mode: 'classic', tone: 'comedic', score: (s) => (has(s, 'vex-ally') ? 7 : 0) + ((s.rel.rival ?? 0) >= 3 ? 2 : 0),
    titles: [L('Frenemies in Lab Coats', 'أعداء أصدقاء بلاب كوت'), L('Co-Authors, Unfortunately', 'مؤلفين مشتركين… للأسف')],
    epilogue: L('Dr. Vex and the BSC now share a bench, a grant and a lot of arguments. {name} sits between them like a fluffy peace treaty.', 'د. فيكس والنادي الحين يتشاركون طاولة ومنحة وهواش وايد. {name} قاعد بينهم مثل اتفاقية سلام منفوشة.') },
  { id: 'cryptid', mode: 'classic', tone: 'comedic', score: (s) => (has(s, 'legend-grows') ? 6 : 0) + (has(s, 'went-viral') ? 5 : 0),
    titles: [L('Cryptid Celebrity', 'نجم الكائنات الغامضة'), L('Blurry, Famous, Unbothered', 'مغبّش، مشهور، وما همّه')],
    epilogue: L('Blurry photos of {name} trend for a week. Nobody can prove anything. {name} has never been happier.', 'صور {name} المغبّشة ترند لمدة أسبوع. محد يقدر يثبت شي. و{name} عمره ما كان مستانس جذي.') },
  { id: 'vex-defeated', mode: 'classic', tone: 'heroic', score: (s) => (has(s, 'vex-exposed') ? 6 : 0) + (has(s, 'escaped-vex') ? 4 : 0),
    titles: [L('Not Today, Dr. Vex', 'مو اليوم يا د. فيكس'), L('The Great Escape', 'الهروب الكبير')],
    epilogue: L('Dr. Vex’s plans fall apart and the club gets its equipment back. {name} keeps the drone as a chew toy.', 'خطط د. فيكس طاحت والنادي رجّع أجهزته. {name} خذا الدرون لعبة يعضّها.') },
  { id: 'wild', mode: 'classic', tone: 'mysterious', score: (s) => (has(s, 'beacon-off') ? 4 : 0) + (has(s, 'clone-loose') ? 4 : 0) + (has(s, 'others-exist') ? 3 : 0),
    titles: [L('Into the Wild', 'نحو البرية'), L('There Are Others', 'فيه غيره')],
    epilogue: L('Some nights, the radio in the BSC lab crackles again. Out there, something like {name} is answering.', 'بعض الليالي، راديو مختبر النادي يطقطق من جديد. هناك، شي يشبه {name} قاعد يرد.') },
  { id: 'machine', mode: 'classic', tone: 'bittersweet', score: (s) => (has(s, 'machine-smashed') ? 6 : 0) + (has(s, 'stays-real') ? 2 : 0),
    titles: [L('The Last Hybrid', 'آخر هجين'), L('One of a Kind', 'ما له مثيل')],
    epilogue: L('The Hybridizer is gone forever. There will never be another {name} — which makes this one even more precious.', 'جهاز الهجين راح للأبد. ما راح يكون فيه {name} ثاني — وهذا يخلّيه أغلى.') },
  { id: 'unsolved', mode: 'classic', tone: 'mysterious', score: (s) => (has(s, 'hook:prof') && !has(s, 'ally:basma') ? 4 : 0),
    titles: [L('The Search Continues', 'البحث مستمر'), L('Postcards From Nowhere', 'بطاقات من المجهول')],
    epilogue: L('Dr. Basma wasn’t found this time — but the new clues point somewhere specific. The club is already planning the next expedition.', 'الدكتورة بسمة ما انلقت هالمرة — بس الأدلة الجديدة تأشّر لمكان محدد. النادي من الحين يخطط للرحلة الجاية.') },
  // Marine
  { id: 'voice-deep', mode: 'marine', tone: 'mysterious', score: (s) => (has(s, 'leviathan-contact') ? 10 : 0),
    titles: [L('The Voice in the Deep', 'الصوت في الأعماق'), L('It Answered', 'رد علينا')],
    epilogue: L('You never tell the full story online. But you tell Bu Fahad, and he cries, and laughs, and says: “I told you so.”', 'ما نشرتوا القصة كاملة. بس قلتوها لبو فهد، وصاح وضحك وقال: «مو قلت لكم؟»') },
  { id: 'proof', mode: 'marine', tone: 'scientific', score: (s) => (s.evidence.includes('leviathan-sonar') ? 9 : 0),
    titles: [L('Plate-Sized Proof', 'دليل كبر الصحن'), L('The Scale on the Hull', 'الحرشفة على الغوّاصة')],
    epilogue: L('The Marine Science Club sends the scale for DNA testing. Results pending. The old sailor already framed the sonar printout.', 'نادي علوم البحار أرسل الحرشفة لفحص DNA. النتايج للحين ما طلعت. والبحّار القديم برواز صورة السونار.') },
  { id: 'blurry', mode: 'marine', tone: 'comedic', score: (s) => (has(s, 'blurry-proof') ? 8 : 0),
    titles: [L('The Blurriest Photo in Marine History', 'أكثر صورة مغبّشة بتاريخ البحار'), L('Trust Us, It Was Huge', 'صدقونا، كان ضخم')],
    epilogue: L('The photo looks like a potato in a storm. The Marine Science Club hangs it in their office anyway.', 'الصورة شكلها بطاطا بعاصفة. نادي علوم البحار علّقها بمكتبهم على أي حال.') },
  { id: 'glimpse', mode: 'marine', tone: 'mysterious', score: (s) => (has(s, 'saw-leviathan') ? 7 : 0),
    titles: [L('We Saw It. We Swear.', 'شفناه… والله شفناه'), L('The Eye in the Dark', 'العين اللي بالظلام')],
    epilogue: L('No photo, no sample — just a memory of an eye as big as a plate. Bu Fahad nods slowly. He knows exactly how you feel.', 'لا صورة ولا عيّنة — بس ذكرى عين كبر الصحن. بو فهد هز راسه بهدوء… يعرف شعوركم بالضبط.') },
  { id: 'peace', mode: 'marine', tone: 'bittersweet', score: (s) => (has(s, 'left-in-peace') ? 8 : 0),
    titles: [L('Some Things Stay Deep', 'أشياء تبقى بالأعماق'), L('The Secret of the Sea', 'سر البحر')],
    epilogue: L('You chose not to chase it. Some nights, {name} sits by the water, listening.', 'اخترتوا ما تلحقونه. بعض الليالي، {name} يقعد عند البحر يتسمّع.') },
  { id: 'reef-heroes', mode: 'marine', tone: 'heroic', score: (s) => (has(s, 'hook:reef') ? 2 : 0) + (s.evidence.includes('warm-vent') ? 4 : 0) + (s.evidence.includes('coral-map') ? 2 : 0) + (has(s, 'rescued') ? 1 : 0),
    titles: [L('Reef Defenders', 'حماة الشعاب'), L('Kubbar Never Looked Better', 'كبّر عمرها ما كانت أحلى')],
    epilogue: L('Your reef data helps the Marine Science Club push for a protected zone. {name} becomes the unofficial mascot of the campaign.', 'بيانات الشعاب ساعدت نادي علوم البحار يطالب بمحمية. و{name} صار تميمة الحملة غير الرسمية.') },
  { id: 'beacon', mode: 'marine', tone: 'heroic', score: (s) => (has(s, 'heroic-stand') ? 7 : 0),
    titles: [L('Beacon in the Dark', 'منارة بالظلام'), L('Hero of Abyss-1', 'بطل أبيس-١')],
    epilogue: L('The crew gives {name} a medal made from a bottle cap. It wears it every day.', 'الطاقم عطا {name} ميدالية من غطا قارورة. يلبسها كل يوم.') },
  { id: 'eye-to-eye', mode: 'marine', tone: 'wholesome', score: (s) => (has(s, 'twist:squid') ? 5 : 0) + (has(s, 'squid-wave') ? 2 : 0),
    titles: [L('Eye to Eye', 'عين بعين'), L('The Squid Said Hi', 'الحبّار سلّم علينا')],
    epilogue: L('Your squid footage becomes the most-watched video in Marine Science Club history. {name} narrates the sequel.', 'فيديو الحبّار صار الأكثر مشاهدة بتاريخ نادي علوم البحار. و{name} بيعلّق على الجزء الثاني.') },
  { id: 'vent-day', mode: 'marine', tone: 'scientific', score: (s) => (s.evidence.includes('new-vent-sample') ? 6 : 0) + (has(s, 'twist:probe') ? 3 : 0),
    titles: [L('Born Today: One Hydrothermal Vent', 'مولود اليوم: فتحة حرارية'), L('Deep Data Drop', 'كنز بيانات الأعماق')],
    epilogue: L('Scientists around the world ask for your samples. The BSC and Marine Science Club start a joint deep-sea project.', 'علماء من كل العالم طلبوا عيناتكم. النادي ونادي علوم البحار بدوا مشروع أعماق مشترك.') },
  // Shared fallbacks
  { id: 'nap', mode: 'both', tone: 'comedic', score: (s) => (s.energy <= 0 ? 5 : 0),
    titles: [L('Nap of Champions', 'قيلولة الأبطال'), L('Too Tired to Be Famous', 'تعبان وايد عشان يصير مشهور')],
    epilogue: L('{name} sleeps for two full days. {duck} guards the door with a coffee and a “Do Not Disturb” sign.', '{name} نام يومين كاملة. و{duck} {g:يحرس الباب ومعاه|تحرس الباب ومعاها} قهوة ولوحة «ممنوع الإزعاج».') },
  { id: 'chaos', mode: 'both', tone: 'comedic', score: (s) => { const silly = s.log.filter((l) => l.style === 'silly').length; const fails = s.log.filter((l) => !l.success).length; return silly >= 2 || fails >= 4 ? 2 + silly + fails / 2 : 0; },
    titles: [L('A Glorious Disaster', 'كارثة مجيدة'), L('Science, Technically', 'علم… تقنياً')],
    epilogue: L('Nothing went to plan, and it was the best trip the club ever had. The group chat is still sending memes about it.', 'ولا شي مشى حسب الخطة، وكانت أحلى رحلة للنادي. القروب للحين يرسل ميمز عنها.') },
  { id: 'field-team', mode: 'both', tone: 'wholesome', score: () => 1,
    titles: [L('A Very Good Field Trip', 'رحلة ميدانية ممتازة'), L('Home, With Stories', 'رجعنا ومعانا سوالف')],
    epilogue: L('Back at the BSC lab, {name} curls up under the bench. Tomorrow, there will be more to explore.', 'بمختبر النادي، {name} تكوّر تحت الطاولة. باجر فيه أشياء ثانية تنستكشف.') },
];

const HOOK_GOAL: Record<string, L10n> = {
  'hook:signal': L('trace a mysterious signal', 'تتبّع إشارة غامضة'),
  'hook:prof': L('find the missing Dr. Basma', 'البحث عن الدكتورة بسمة المفقودة'),
  'hook:escape': L('recover the escaped lab samples', 'استرجاع عينات المختبر الهاربة'),
  'hook:contest': L('win the KU Bio Fair', 'الفوز بمعرض الأحياء بالجامعة'),
  'hook:reef': L('solve the mystery of the bleaching reef', 'حل لغز الشعاب اللي تبيض'),
  'hook:sound': L('find the source of a giant unknown sound', 'معرفة مصدر صوت ضخم مجهول'),
  'hook:nets': L('trace giant scales caught in a ghost net', 'تتبّع حراشف عملاقة بشبكة مهجورة'),
};

const TWIST_LINE: Record<string, L10n> = {
  'twist:basma': L('The biggest surprise: Dr. Basma was alive all along.', 'أكبر مفاجأة: الدكتورة بسمة كانت عايشة طول الوقت.'),
  'twist:chip': L('The signal turned out to be coming from {name} itself.', 'طلعت الإشارة جاية من {name} نفسه.'),
  'twist:escapees': L('The escaped samples had built a tiny ecosystem of their own.', 'العينات الهاربة بنت نظام بيئي صغير خاص فيها.'),
  'twist:clone': L('Somewhere along the way, {name} met its own copy.', 'بالطريق، {name} قابل نسخته.'),
  'twist:legend': L('Along the way, {name} became a local legend.', 'بالطريق، {name} صار أسطورة محلية.'),
  'twist:squid': L('A real giant squid stopped to inspect {name}.', 'حبّار عملاق حقيقي وقف يفحص {name}.'),
  'twist:probe': L('An old Marine Science Club probe was found still recording.', 'انلقى مجس قديم لنادي علوم البحار وللحين يسجّل.'),
  'twist:whalefall': L('The team found a whale fall teeming with life.', 'الفريق لقى حوت ساقط مليان حياة.'),
};

function joinList(items: string[], lang: 'en' | 'ar'): string {
  if (items.length <= 1) return items.join('');
  if (lang === 'ar') return items.slice(0, -1).join('، ') + ' و' + items[items.length - 1];
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function sub(t: L10n, s: GameState, last: L10n): L10n {
  const duck = DUCK_BY_ID[s.duck];
  const r = (x: string, l: 'en' | 'ar') => x.replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_m, m: string, f: string) => ((duck?.gender ?? 'f') === 'm' ? m : f)).replace(/\{duck\}/g, duck?.name[l] ?? '').replace(/\{name\}/g, iso(s.creature.name)).replace(/\{player\}/g, s.player ? iso(s.player) : (l === 'ar' ? 'الفريق' : 'the team')).replace(/\{last\}/g, last[l]);
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
  bold: L('bold', 'جريئة'), careful: L('careful', 'حذرة'), clever: L('clever', 'ذكية'), kind: L('kind-hearted', 'طيّبة'), silly: L('gloriously silly', 'هبلة بشكل مجيد'),
};

/** recentEndings lowers (never removes) the chance of repeating an ending the player just saw. */
export function composeEnding(s: GameState, recentEndings: string[] = []): Ending {
  const rng = Rng.from(s.seed, 'ending');
  const elig = eligibleArchetypes(s).map((x) => ({ ...x, score: x.score * (recentEndings.includes(x.a.id) ? 0.6 : 1) }));
  elig.sort((a, b) => b.score - a.score);
  const top = elig[0].a;
  const pb = s.plan.beats;
  const last = BIOMES[pb[pb.length - 1].biome].name;
  const title = sub(rng.pick(top.titles), s, last);

  const lines: L10n[] = [];
  const parts = s.creature;
  const base = PART_BY_ID[parts.base].name, limbs = PART_BY_ID[parts.limbs].name, adapt = PART_BY_ID[parts.adaptation].name;
  const hookFlag = s.flags.find((f) => f.startsWith('hook:'));
  const goal = hookFlag ? HOOK_GOAL[hookFlag] : L('explore the unknown', 'استكشاف المجهول');
  const style = STYLE_WORD[dominantStyle(s)];
  const nm = iso(s.creature.name); const art = /^[aeiou]/i.test(base.en) ? 'an' : 'a';
  lines.push(L(`${nm}, ${art} ${base.en} hybrid with ${limbs.en} and ${adapt.en}, set out with ${s.player ? iso(s.player) : 'the team'} to ${goal.en}.`,
    `${nm}، هجين من ${base.ar} عنده ${limbs.ar} و${adapt.ar}، طلع مع ${s.player ? iso(s.player) : 'الفريق'} عشان ${goal.ar}.`));
  const places = [...new Set(pb.slice(1).map((b) => b.biome).filter((b) => b !== 'openSea'))].map((b) => BIOMES[b].name);
  lines.push(L(`The trail led through ${joinList(places.map((p) => p.en), 'en')}, and the team made ${style.en} choices along the way.`,
    `الطريق مر على ${joinList(places.map((p) => p.ar), 'ar')}، والفريق اتخذ قرارات ${style.ar}.`));
  const win = s.log.find((l) => l.success && l.usedPart && l.beat !== pb[0].template);
  if (win?.usedPart) {
    const p = PART_BY_ID[(parts as unknown as Record<string, string>)[win.usedPart]];
    lines.push(L(`Its ${p.name.en} saved the day in ${BIOMES[win.biome].name.en}.`, `بفضل ${p.name.ar} انحلّ الموقف في ${BIOMES[win.biome].name.ar}.`));
  }
  const loss = s.log.find((l) => !l.success && l.usedPart);
  if (loss?.usedPart) {
    const p = PART_BY_ID[(parts as unknown as Record<string, string>)[loss.usedPart]];
    lines.push(L(`Not everything went smoothly: its ${p.name.en} became a problem in ${BIOMES[loss.biome].name.en}.`, `مو كل شي كان سهل: واجه مشكلة بسبب ${p.name.ar} في ${BIOMES[loss.biome].name.ar}.`));
  }
  const twist = s.flags.find((f) => TWIST_LINE[f]);
  if (twist) lines.push(sub(TWIST_LINE[twist], s, last));
  const met = Object.keys(s.rel).filter((id) => s.flags.includes(`met:${id}`));
  if (met.length) {
    const best = met.sort((a, b) => (s.rel[b] ?? 0) - (s.rel[a] ?? 0))[0];
    const v = s.rel[best] ?? 0; const n = NPC_BY_ID[best].name;
    lines.push(v >= 2 ? L(`${n.en} became a true friend.`, `صارت بينكم وبين ${n.ar} صداقة حقيقية.`)
      : v <= -1 ? L(`${n.en} won’t forget this trip — and not in a good way.`, `العلاقة مع ${n.ar} توترت بعد هالرحلة.`)
        : L(`${n.en} is still making up their mind about you.`, `العلاقة مع ${n.ar} للحين مو واضحة.`));
  }
  // The finale (last, in story order) always appears in the summary, so the ending can never ignore the climax.
  const fin = s.log.length ? s.log[s.log.length - 1] : undefined;
  const finTpl = fin && BEAT_BY_ID[fin.beat];
  if (fin && finTpl && finTpl.kind === 'climax') {
    const ch = finTpl.choices.find((c) => c.id === fin.choice);
    const out = ch && (fin.success || !ch.fail ? ch.success : ch.fail);
    if (out) lines.push(fill(out.text, beatContext(s, s.log.length - 1)));
  }
  if (s.flags.includes('legend:heard') && !s.flags.includes('saw-leviathan')) {
    lines.push(L('The old sailor’s legend stays unconfirmed — for now.', 'أسطورة البحّار القديم للحين ما تأكدت — لين الحين.'));
  }
  const summary: L10n = { en: lines.map((l) => l.en).join(' '), ar: lines.map((l) => l.ar).join(' ') };

  const duck = DUCK_BY_ID[s.duck];
  let tone = top.tone;
  if (tone === 'wholesome' && dominantStyle(s) === 'bold') tone = 'heroic';
  const highlights: L10n[] = [
    L(`${s.evidence.length} pieces of evidence`, `${s.evidence.length} دليل`),
    L(`${s.discoveries.length} real-science discoveries`, `${s.discoveries.length} اكتشاف علمي حقيقي`),
    ...s.discoveries.slice(0, 3).map((id) => FACT_BY_ID[id]?.text).filter(Boolean) as L10n[],
  ];
  return { id: top.id, tone, title, summary, epilogue: sub(top.epilogue, s, last), highlights };
}
