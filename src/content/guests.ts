// Guest characters from the Marine Science Club (designer's art, used unmodified: art-source/guests/, sliced into
// public/guests/). They appear only in Marine mode: introduced in the mission briefing, and each speaks once when
// the team first reaches a place they know — Misk near the surface, Faisal in the deep. What they say is always
// about the place on screen, so it never reads as random chatter.
import type { BiomeId, GameState, L10n } from '../engine/types';

const L = (en: string, ar: string): L10n => ({ en, ar });
export type GuestId = 'misk' | 'faisal';
export interface Guest { id: GuestId; name: L10n; role: L10n; about: L10n }

export const GUESTS: Record<GuestId, Guest> = {
  misk: {
    id: 'misk', name: L('Misk', 'مسك'), role: L('Coral reef researcher · Marine Science Club', 'باحثة الشعاب المرجانية · نادي علوم البحار'),
    about: L('A curious little shark who never goes anywhere without her magnifying glass. She knows the name of every fish on the reef and writes down everything she sees. She stays with the team near the surface, and follows them from the ship when they go deep.',
      'قرش صغيرة وفضولية، لا تذهب إلى أي مكان بدون عدستها المكبّرة. تعرف اسم كل سمكة في الشعاب، وتكتب كل ما تراه في دفترها. ترافق الفريق قرب سطح البحر، وتتابعه من السفينة حين ينزل إلى الأعماق.'),
  },
  faisal: {
    id: 'faisal', name: L('Faisal', 'فيصل'), role: L('Submarine pilot · Marine Science Club', 'قائد الغوّاصة · نادي علوم البحار'),
    about: L('A calm shark with glasses who pilots the small research submarine and knows the map of the deep by heart. The dark does not scare him; a forgotten seat belt does. He takes the team down into the deep.',
      'قرش هادئ يلبس نظارة، يقود غوّاصة الأبحاث الصغيرة ويحفظ خريطة الأعماق. لا يخاف من الظلام، لكنه يخاف أن ينسى أحد حزام الأمان. هو الذي ينزل بالفريق إلى الأعماق.'),
  },
};

/** One line per place, spoken the first time the team gets there. */
const LINES: Partial<Record<BiomeId, { who: GuestId; face: 'happy' | 'thinking' | 'surprised' | 'worried'; text: L10n }>> = {
  lab: { who: 'misk', face: 'happy', text: L('Hello! I am Misk, and this is Faisal. We are from the Marine Science Club, and we are coming with you on this trip.', 'مرحباً! أنا مسك، وهذا فيصل. نحن من نادي علوم البحار، وسنرافقكم في هذه الرحلة.') },
  reef: { who: 'misk', face: 'thinking', text: L('Look at the coral: it is a living animal, not a rock. When it turns white, it is sick.', 'انظروا إلى المرجان: هو حيوان حيّ وليس صخراً. وإذا صار لونه أبيض فهذا يعني أنه مريض.') },
  mudflat: { who: 'misk', face: 'happy', text: L('This muddy shore is like a restaurant for travelling birds. Move quietly so they do not fly away.', 'هذا الشاطئ الطيني مثل مطعم للطيور المسافرة. تحرّكوا بهدوء حتى لا تطير.') },
  seagrass: { who: 'misk', face: 'happy', text: L('Seagrass is a nursery for baby fish. Keep the boat away from it, please.', 'الأعشاب البحرية حضانة لصغار الأسماك. أبعدوا القارب عنها من فضلكم.') },
  openSea: { who: 'misk', face: 'surprised', text: L('The deep sea starts here. I will stay on the ship and watch you on the screen. Faisal will pilot the submarine.', 'من هنا يبدأ البحر العميق. أنا سأبقى على السفينة وأتابعكم من الشاشة، وفيصل سيقود الغوّاصة.') },
  twilight: { who: 'faisal', face: 'happy', text: L('I am Faisal, your pilot. We are two hundred metres down and the light is going. Seat belts on, please.', 'أنا فيصل، قائد الغوّاصة. نحن الآن على عمق مئتي متر، والضوء يختفي. اربطوا الأحزمة من فضلكم.') },
  midnight: { who: 'faisal', face: 'thinking', text: L('Sunlight never reaches this place. Most animals around us make their own light.', 'ضوء الشمس لا يصل إلى هنا أبداً. أغلب الحيوانات حولنا تصنع ضوءها بنفسها.') },
  vents: { who: 'faisal', face: 'worried', text: L('I will not go too close to the hot springs: their water is far hotter than boiling water.', 'لن أقترب كثيراً من الينابيع الحارّة: ماؤها أحرّ من الماء المغلي بمرات.') },
  trench: { who: 'faisal', face: 'thinking', text: L('This is the deepest place we can reach. The water above presses hard on the submarine, but it is built for that.', 'هذا أعمق مكان نصل إليه. الماء فوقنا يضغط بقوة على الغوّاصة، لكنها مصنوعة لتتحمّل ذلك.') },
};

export interface GuestLine { guest: Guest; face: string; text: L10n }
/** The guest's line for the scene on screen, or null (not Marine mode, not the start of a scene, or a place already visited). */
export function guestLine(s: GameState): GuestLine | null {
  if (s.mode !== 'marine' || s.stage !== 'beat') return null;
  const biome = s.plan.beats[s.index]?.biome; if (!biome) return null;
  if (s.plan.beats.slice(0, s.index).some((b) => b.biome === biome)) return null;
  const l = LINES[biome]; if (!l) return null;
  return { guest: GUESTS[l.who], face: l.face, text: l.text };
}
