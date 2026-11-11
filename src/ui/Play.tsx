import { nodePlate, storyOf } from '../engine/archive';
import { derive } from '../engine/creature';
import { condHolds } from '../engine/story';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sceneImage } from '../art/painter';
import { ownPlateOf, platesForRun, plateUrl } from '../art/plates';
import { BEAT_BY_ID } from '../engine/story';
import { ambient } from '../audio';
import { DUCK_BY_ID, resolveDuckId } from '../content/ducks';
import { radio } from '../engine/radio';
import { CreaturePanel } from './CreaturePanel';
import { rareFor, sightingFor } from '../engine/sighting';
import { LEGENDS } from '../content/legends';
import { rareArt } from '../content/rare';
import { CLUE_KIND, clueKind, moments } from '../engine/clues';
import { BIOMES, FACT_BY_ID } from '../content/world';
import { aiAvailable, narrate } from '../engine/ai';
import { Rng } from '../engine/rng';
import { MAX_ENERGY, advance, beatContext, choose, currentBeat, fill } from '../engine/story';
import type { BiomeId, DuckMood, GameState, Lang, Style } from '../engine/types';
import type { Settings } from '../engine/storage';
import { t } from '../i18n';
import { Btn, CreatureArt, Logos, Particles, Typewriter, ZoomCard, type ZoomInfo } from './common';
import { animalArt } from '../art/animalArt';
import { ANIMAL_BY_ID, type Animal } from '../content/bestiary';
import { ROLE_LABEL, u } from './uiText';

const CATEGORY: Record<Animal['category'], [string, string]> = {
  mammal: ['A mammal', 'من الثدييات'], bird: ['A bird', 'من الطيور'], reptile: ['A reptile', 'من الزواحف'], amphibian: ['An amphibian (lives in water and on land)', 'من البرمائيات (تعيش في الماء وعلى اليابسة)'],
  fish: ['A fish', 'من الأسماك'], invertebrate: ['An animal without a backbone', 'حيوان بلا عمود فقري'], cryptid: ['A creature from stories', 'كائن من الحكايات'],
};
/** Plain-language card for a story animal: what it is, where it lives, a real fact when we have one, and whether it is real. */
function animalZoom(animal: Animal, src: string, lang: Lang): ZoomInfo {
  const ar = lang === 'ar'; const role = animal.roles?.[0];
  const lines: ZoomInfo['lines'] = [
    { label: ar ? 'ما هو؟ ' : 'What is it? ', text: CATEGORY[animal.category][ar ? 1 : 0] },
    { label: ar ? 'أين يعيش؟ ' : 'Where it lives: ', text: animal.biomes.map((b) => BIOMES[b].name[lang]).join(ar ? '، ' : ', ') },
  ];
  if (animal.fact && FACT_BY_ID[animal.fact]) lines.push({ label: `${t('realScience', lang)}: `, text: FACT_BY_ID[animal.fact].text[lang] });
  lines.push({ text: animal.kind === 'fictional' ? (ar ? 'هذا كائن خيالي من قصة اللعبة، وليس حيواناً حقيقياً.' : 'This is a fictional creature from the game’s story, not a real animal.') : (ar ? 'هذا حيوان حقيقي موجود في الطبيعة.' : 'This is a real animal that exists in nature.') });
  return { img: src, kicker: u('inScene', lang), title: animal.name[lang], tags: [...(role && ROLE_LABEL[role] ? [ROLE_LABEL[role][lang]] : []), animal.kind === 'fictional' ? u('fictional', lang) : u('realAnimal', lang)], lines };
}

/** The animal the story is talking about, shown as an inset specimen card over the scene. Tap it for a large picture and a description. Null/unknown id → nothing. */
function FeaturedAnimal({ id, biome, seed, lang, scene, onOpen, hidden = false }: { id: string | null | undefined; biome: BiomeId; seed: number; lang: Lang; scene?: string | null; onOpen?: (z: ZoomInfo) => void; hidden?: boolean }) {
  const animal = id ? ANIMAL_BY_ID[id] : undefined;
  const art = useMemo(() => { try { return animalArt(id); } catch { return null; } }, [id]);
  const src = useMemo(() => {
    if (!art) return null;
    if (art.kind !== 'painter') return art.src;
    try { return sceneImage(biome, [art.src.replace(/^painter:/, '')], seed); } catch { return null; }
  }, [art, biome, seed]);
  const [broken, setBroken] = useState<string | null>(null);
  if (!animal || !art || !src || broken === src) return null;
  const role = animal.roles?.[0];
  // a creature the story has not revealed yet keeps its mystery: no picture and no name until the team finds out
  if (hidden) return (
    <figure className="featured featured-unknown" aria-label={lang === 'ar' ? 'كائن مجهول' : 'Unknown creature'}>
      <div className="featured-img"><span className="unknown-mark" aria-hidden="true">؟</span></div>
      <figcaption>
        <span className="kicker">{u('inScene', lang)}</span>
        <b>{lang === 'ar' ? 'كائن مجهول' : 'Unknown creature'}</b>
        <span className="featured-tags"><em className="role-mystery">{lang === 'ar' ? 'يظهر بعد قراركم' : 'Revealed after your choice'}</em></span>
      </figcaption>
    </figure>
  );
  return (
    <figure className={`featured tappable kind-${art.kind} ${src === scene ? 'same-as-scene' : ''}`} aria-label={`${u('inScene', lang)}: ${animal.name[lang]}`} role="button" tabIndex={0}
      onClick={() => onOpen?.(animalZoom(animal, src, lang))} onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(animalZoom(animal, src, lang)); }}>
      <div className="featured-img"><img src={src} alt={animal.name[lang]} onError={() => setBroken(src)} /><span className="zoom-hint" aria-hidden="true">🔍</span></div>
      <figcaption>
        <span className="kicker">{u('inScene', lang)}</span>
        <b>{animal.name[lang]}</b>
        <span className="featured-tags">
          {role && ROLE_LABEL[role] && <em className={`role-${role}`}>{ROLE_LABEL[role][lang]}</em>}
          <em>{animal.kind === 'fictional' ? u('fictional', lang) : u('realAnimal', lang)}</em>
        </span>
      </figcaption>
    </figure>
  );
}

const STYLE_LABEL: Record<Style, { en: string; ar: string }> = {
  bold: { en: 'Bold', ar: 'جريء' }, careful: { en: 'Careful', ar: 'حذر' }, clever: { en: 'Clever', ar: 'ذكي' },
  kind: { en: 'Kind', ar: 'طيّب' }, silly: { en: 'Chaotic', ar: 'فوضوي' },
};

/** Full-bleed painted scene with slow camera drift and a cross-fade between scenes. */
export function PaintedScene({ biome, props, seed, reduced, className = '', plate }: { biome: BiomeId; props: string[]; seed: number; reduced: boolean; className?: string; plate?: string | null }) {
  // A painted plate (SDXL, offline) when one exists; otherwise the procedural painter. Broken plate → painter.
  const [failed, setFailed] = useState<string | null>(null);
  const usePlate = !!plate && failed !== plate;
  const src = useMemo(() => (usePlate ? plate! : sceneImage(biome, props, seed)), [usePlate, plate, biome, props, seed]);
  const [prev, setPrev] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  useEffect(() => { setPrev(last.current); last.current = src; const id = setTimeout(() => setPrev(null), 1200); return () => clearTimeout(id); }, [src]);
  return (
    <div className={`painted ${reduced ? 'still' : ''} ${className}`} role="img" aria-label={BIOMES[biome].name.en}>
      {prev && prev !== src && <img className="painted-img old" src={prev} alt="" />}
      {src && <img key={src} className="painted-img" src={src} alt="" onError={() => { if (usePlate) setFailed(plate!); }} />}
      <div className="painted-grain" aria-hidden="true" />
    </div>
  );
}

export function Play({ game, setGame, settings, lang, onQuit, legendsSeen = [], onSighting, onPassport }: { game: GameState; setGame: (g: GameState) => void; settings: Settings; lang: Lang; onQuit: () => void; legendsSeen?: string[]; onSighting?: (id: string) => void; onPassport?: () => void }) {
  const view = useMemo(() => (game.stage === 'beat' || game.stage === 'outcome' ? currentBeat(game) : null), [game]);
  const [typed, setTyped] = useState(false);
  // AI wording lives in the game state, so a Passport save carries exactly the words on screen
  const aiText = game.ai && game.ai.i === game.index && game.stage === 'outcome' && game.ai.lang === lang ? game.ai.text : null;
  const latest = useRef(game); latest.current = game;
  const [board, setBoard] = useState(false);
  const [newFacts, setNewFacts] = useState<string[]>([]);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [zoom, setZoom] = useState<ZoomInfo | null>(null);
  // Story log (backlog): every scene so far — where, what happened, what the team chose and how it went — rebuilt
  // from the run itself, so it is complete after a refresh or a Passport scan too.
  const [logOpen, setLogOpen] = useState(false);
  // "look at the painting": hides the text and cards until the next tap, so the scene can be seen whole
  const [peek, setPeek] = useState(false);
  const history = useMemo(() => game.log.map((l, i) => {
    try {
      const t = BEAT_BY_ID[l.beat]; const c = t?.choices.find((x) => x.id === l.choice);
      const out = c && (l.success || !c.fail ? c.success : c.fail);
      if (!t || !c || !out) return null;
      const ctx = beatContext(game, i);
      return { i, place: ctx.place, text: fill(t.text, ctx), choice: fill(c.label, ctx), out: fill(out.text, ctx), ok: l.success };
    } catch { return null; }
  }).filter((x): x is NonNullable<typeof x> => !!x), [game]);
  // Mission briefing before the first scene: premise, the run's goal and how to play (the marine collaboration is introduced here too).
  const [brief, setBrief] = useState(game.index === 0 && game.stage === 'beat' && game.log.length === 0);
  const recent = useRef<string[]>([]);
  const reduced = settings.reducedMotion;
  const speed = reduced ? Math.max(settings.textSpeed, 90) : settings.textSpeed;

  useEffect(() => { setTyped(false); if (typeof window !== 'undefined' && window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }, [game.index, game.stage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!settings.muted && view) ambient.play(view.biome); else ambient.stop(); }, [view?.biome, settings.muted]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChoose = useCallback((id: string) => {
    const before = new Set(game.discoveries);
    const next = choose(game, id);
    const found = next.discoveries.filter((d) => !before.has(d));
    setNewFacts(found);
    if (!settings.muted) { ambient.blip(!!next.lastOutcome?.success); if (found.length || next.evidence.length > game.evidence.length) setTimeout(() => ambient.reveal(), 520); }
    setGame(next);
    if (settings.ai && aiAvailable() && next.lastOutcome) {
      const base = next.lastOutcome.text[lang];
      narrate({ lang, creature: next.creature, place: BIOMES[currentBeat(next).biome].name[lang], base, success: next.lastOutcome.success, recent: recent.current }, base)
        .then((r) => { if (r.source === 'ai' && latest.current.index === next.index && latest.current.stage === 'outcome') setGame({ ...latest.current, ai: { i: next.index, lang, text: r.text } }); recent.current.push(r.text); });
    }
  }, [game, setGame, settings.ai, settings.muted, lang]);

  const onContinue = useCallback(() => { setNewFacts([]); setGame(advance(game)); }, [game, setGame]);

  // Keyboard: 1–4 pick a choice, Enter/Space continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!view || confirmQuit || brief || board || zoom || logOpen || peek || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (game.stage === 'beat' && typed) { const n = Number(e.key); if (n >= 1 && n <= view.choices.length) onChoose(view.choices[n - 1].choice.id); }
      else if (game.stage === 'outcome' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onContinue(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [view, game.stage, typed, confirmQuit, brief, board, zoom, logOpen, peek, onChoose, onContinue]);

  const autoPlate = useMemo(() => platesForRun(game, (i) => BEAT_BY_ID[game.plan.beats[i].template]?.kind ?? null, game.index)[game.index] ?? null, [game.seed, game.index, game.plan]); // eslint-disable-line react-hooks/exhaustive-deps
  // Story Archive scenes name their own plate, and Living World state swaps it (power restored, net removed…)
  const tpl = BEAT_BY_ID[game.plan.beats[game.index]?.template];
  const d0 = useMemo(() => derive(game.creature), [game.creature]);
  const fixedPlate = (tpl && ownPlateOf(tpl.id, tpl.biomes[0])) ?? (tpl?.plate ? nodePlate(tpl, (c) => condHolds(c, d0, game, tpl.biomes[0])) : undefined);
  const plate = fixedPlate ? { id: fixedPlate } : autoPlate;
  const story = storyOf(game);
  // the world change this result just caused (shown as a banner; also kept in the journal)
  const worldNow = useMemo(() => {
    if (game.stage !== 'outcome' || !story || !tpl) return [];
    const l = game.log[game.log.length - 1]; const c = tpl.choices.find((x) => x.id === l?.choice);
    const out = c && (l.success || !c.fail ? c.success : c.fail);
    return (out?.effects ?? []).filter((e) => e.t === 'flag' && e.id.startsWith('w:') && story.world?.[e.id]).map((e) => story.world![(e as { id: string }).id]);
  }, [game.stage, game.index, story, tpl, game.log]);

  const lines = useMemo(() => (view ? radio(game, view.template.kind, view.biome) : []), [game, view]);
  // seen-list is read once per run so the chosen sighting stays stable
  // pinned at the start of the run (same on every device); older saves fall back to this device's history
  const sighting = useMemo(() => {
    const pin = game.pins?.sighting;
    if (game.pins) { const lg = pin && LEGENDS.find((l) => l.id === pin[1]); return lg ? { index: pin![0], legend: lg } : null; }
    return sightingFor(game, legendsSeen);
  }, [game.seed, game.plan, game.pins]); // eslint-disable-line react-hooks/exhaustive-deps
  const rare = useMemo(() => rareFor(game), [game]);
  const rareNow = rare && game.stage === 'outcome' && game.index === rare.index ? rare.rare : null;
  const clues = useMemo(() => moments(game).filter((m) => m.clues.length), [game]);
  const glimpse = sighting && game.stage === 'outcome' && game.index === sighting.index ? sighting.legend : null;
  useEffect(() => { if (glimpse) onSighting?.(glimpse.id); }, [glimpse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!view) return null;
  // engine-resolved creature first; the beat template's own `featured` as a fallback while the engine wiring lands
  const featuredId = view.featured !== undefined ? view.featured : (view.template as { featured?: string }).featured ?? null;
  const isOutcome = game.stage === 'outcome' && game.lastOutcome;
  const o = game.lastOutcome;
  const descendIdx = game.plan.beats.findIndex((b) => b.template === 'pm-descend');
  const isDeep = descendIdx >= 0 && game.index >= descendIdx;
  const phaseLabel = game.mode === 'marine' ? t(isDeep ? 'deep' : 'surface', lang) : null;
  const total = game.plan.beats.length;
  const cine = game.stage === 'beat' ? view.template.cinematic : undefined;
  // is the result on screen the story's last one? (the button then says so, instead of a plain "continue")
  let lastScene = false; if (game.stage === 'outcome') { try { lastScene = advance(game).stage === 'ending'; } catch { lastScene = false; } }
  // the result screen repeats the decision it answers, so nobody has to remember what they tapped
  const lastLog = game.log[game.log.length - 1];
  const chosenTpl = isOutcome ? view.template.choices.find((c) => c.id === lastLog?.choice) : undefined;
  const chosen = chosenTpl ? fill(chosenTpl.label, view.ctx)[lang] : null;
  const CINE: Record<string, [string, string]> = { reveal: ['A reveal', 'لحظة كشف'], discovery: ['A discovery', 'اكتشاف'], passage: ['Into the unknown', 'نحو المجهول'], phenomenon: ['A rare phenomenon', 'ظاهرة نادرة'], climax: ['The decisive moment', 'اللحظة الحاسمة'] };

  return (
    <section className={`screen play vn ${isDeep ? 'is-deep' : ''} ${cine ? `cine cine-${cine}` : ''} ${peek ? 'peek' : ''}`}>
      {peek && <button className="peek-back" onClick={() => setPeek(false)} autoFocus>{lang === 'ar' ? 'اضغط في أي مكان للرجوع إلى القصة' : 'Tap anywhere to return to the story'}</button>}
      <PaintedScene biome={view.biome} props={view.template.props} seed={game.seed + game.index} reduced={reduced} plate={plate ? plateUrl(plate.id) : null} />
      <Particles kind={['reef', 'seagrass', 'mudflat', 'openSea'].includes(view.biome) ? 'bubbles' : ['twilight', 'midnight', 'vents', 'trench', 'cave'].includes(view.biome) ? 'specks' : ['desert', 'ruins', 'mountain'].includes(view.biome) ? 'dust' : 'spores'} count={18} />
      <div className="letterbox top" aria-hidden="true" /><div className="letterbox bottom" aria-hidden="true" />
      {cine && <div key={`cine${game.index}`} className="cine-caption" role="note"><span>{CINE[cine][lang === 'ar' ? 1 : 0]}</span></div>}
      {worldNow.length > 0 && <div key={`w${game.index}`} className="world-banner" role="status">🌍 {lang === 'ar' ? 'تغيّر العالم: ' : 'The world changed: '}{worldNow.map((w) => w[lang]).join(' · ')}</div>}

      <header className="vn-hud" role="status">
        <div className="vn-loc">
          <span className="place">{view.ctx.place[lang]}</span>
          {phaseLabel && <span className={`phase ${isDeep ? 'deep' : ''}`}>{phaseLabel}</span>}
        </div>
        <div className="vn-meter">
          {story ? <span className="vn-progress" title={story.title[lang]}>{lang === 'ar' ? `المشهد ${game.index + 1}` : `Scene ${game.index + 1}`}</span> : <>
          <span className="vn-progress">{game.index + 1}/{total}</span>
          <span className="chapter" aria-label={`${game.index + 1}/${total}`}>{Array.from({ length: total }, (_, i) => <i key={i} className={i < game.index ? 'done' : i === game.index ? 'now' : ''} />)}</span></>}
          <span className="pips" title={t('energy', lang)} aria-label={`${t('energy', lang)} ${game.energy}/${MAX_ENERGY}`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <i key={i} className={i < game.energy ? 'on' : ''} />)}</span>
          <button key={`ev${game.evidence.length}`} className="stat stat-btn bump" title={lang === 'ar' ? 'لوحة الغموض' : 'Mystery Board'} onClick={() => setBoard(true)}>◆ {game.evidence.length}</button>
          <span key={`di${game.discoveries.length}`} className="stat bump" title={t('discoveries', lang)}>✦ {game.discoveries.length}</span>
          <button className="stat stat-btn log-btn" aria-label={lang === 'ar' ? 'شاهد اللوحة كاملة' : 'See the whole painting'} title={lang === 'ar' ? 'شاهد اللوحة كاملة' : 'See the whole painting'} onClick={() => setPeek(true)}>👁</button>
          <button className="stat stat-btn log-btn" aria-label={lang === 'ar' ? 'سجل القصة' : 'Story log'} title={lang === 'ar' ? 'سجل القصة: اقرأ ما حدث حتى الآن' : 'Story log: read what happened so far'} onClick={() => setLogOpen(true)} disabled={!history.length}>📜</button>
          {onPassport && <button className="ghost-icon passport-btn" aria-label={lang === 'ar' ? 'جواز المستكشف' : 'Explorer Passport'} title={lang === 'ar' ? 'جواز المستكشف · امسح وأكمل من جوالك' : 'Explorer Passport · scan to continue on your phone'} onClick={onPassport}>▦</button>}
          <button className="ghost-icon" aria-label={t('quit', lang)} onClick={() => setConfirmQuit(true)}>✕</button>
        </div>
      </header>

      <CreaturePanel game={game} lang={lang} onOpen={setZoom} />
      <FeaturedAnimal key={featuredId ?? "none"} id={featuredId} biome={view.biome} seed={game.seed + game.index} lang={lang} scene={plate ? plateUrl(plate.id) : null} onOpen={setZoom}
        hidden={(() => { const a = featuredId ? ANIMAL_BY_ID[featuredId] : undefined; const secret = !!a && (a.roles?.[0] === 'mystery' || a.kind === 'fictional'); return secret && !(isOutcome && view.template.kind !== 'legend'); })()} />
      {zoom && <ZoomCard info={zoom} lang={lang} onClose={() => setZoom(null)} />}

      {brief && (() => {
        const nm = (x: string) => x.replace(/\{name\}/g, game.creature.name);
        const goal = BEAT_BY_ID[game.plan.beats[0].template]?.goal;
        return (
          <div className="briefing" role="dialog" aria-modal="true" aria-label={u('briefKicker', lang)}>
            <div className="inner">
              {game.mode === 'marine'
                ? <><p className="kicker sea">{u('collabWith', lang)}</p><Logos marine className="collab-logos" /></>
                : <Logos className="collab-logos" />}
              <p className="kicker">{u('briefKicker', lang)} · {t(game.mode === 'marine' ? 'marine' : 'classic', lang)}</p>
              <div className="brief-creature"><CreatureArt creature={game.creature} expression="curious" /></div>
              <p className="brief-who">{nm(u('briefWho', lang))}</p>
              <p className="brief-animal">{nm(u('briefAnimal', lang))}</p>
              {game.mode === 'marine' && <p className="brief-sea"><b>{u('briefSeaQ', lang)}</b>{nm(u('briefSea', lang))}</p>}
              {goal && <div className="brief-goal"><b>{u('briefGoal', lang)}</b><span>{nm(goal[lang])}</span></div>}
              <div className="brief-how"><b>{u('briefHow', lang)}</b><ol><li>{nm(u('briefHow1', lang))}</li><li>{u('briefHow2', lang)}</li><li>{u('briefHow3', lang)}</li></ol></div>
              <Btn onClick={() => setBrief(false)} autoFocus>{u('briefStart', lang)}</Btn>
            </div>
          </div>
        );
      })()}

      {board && (() => {
        const goal = BEAT_BY_ID[game.plan.beats[0].template]?.goal;
        return (
          <div className="mystery-board" role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'لوحة الغموض' : 'Mystery Board'} onClick={() => setBoard(false)}>
            <div className="mb-inner" onClick={(e) => e.stopPropagation()}>
              <header><p className="kicker">{lang === 'ar' ? 'لوحة الغموض' : 'Mystery Board'}</p>{goal && <h3>{goal[lang].replace(/\{name\}/g, game.creature.name)}</h3>}</header>
              {clues.length ? (
                <ol className="mb-pins">{clues.map((m) => m.clues.map((id) => { const k = CLUE_KIND[clueKind(id)]; return (
                  <li key={id} className={`pin kind-${clueKind(id)}`}>
                    <span className="pin-ico" aria-hidden="true">{k.icon}</span>
                    <div><b>{k.label[lang]} · {m.place[lang]}</b><small>{lang === 'ar' ? 'وُجد حين: ' : 'Found when: '}{m.choice[lang]}</small></div>
                  </li>
                ); }))}</ol>
              ) : <p className="hint">{lang === 'ar' ? 'لا أدلة بعد. كل دليل تجدونه سيُثبَّت هنا.' : 'No clues yet. Every clue you find will be pinned here.'}</p>}
              <p className="mb-q">{lang === 'ar' ? `الأسئلة المفتوحة: ما الذي يربط هذه الأدلة؟ النهاية ستعتمد على ما جمعتموه (${game.evidence.length} أدلة).` : `Open question: what links these clues? The ending depends on what you collect (${game.evidence.length} so far).`}</p>
              <Btn variant="ghost" onClick={() => setBoard(false)}>{t('close', lang)}</Btn>
            </div>
          </div>
        );
      })()}

      {logOpen && (
        <div className="mystery-board story-log" role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'سجل القصة' : 'Story log'} onClick={() => setLogOpen(false)}>
          <div className="mb-inner" onClick={(e) => e.stopPropagation()}>
            <header><p className="kicker">{lang === 'ar' ? 'سجل القصة' : 'Story log'}</p><h3>{lang === 'ar' ? 'ما حدث حتى الآن' : 'What has happened so far'}</h3></header>
            <ol className="log-list">{history.map((h) => (
              <li key={h.i} className={h.ok ? 'ok' : 'no'}>
                <b className="log-place">{h.i + 1}. {h.place[lang]}</b>
                <p className="log-text">{h.text[lang]}</p>
                <p className="log-choice"><span>{lang === 'ar' ? 'اخترتم:' : 'You chose:'}</span> {h.choice[lang]}</p>
                <p className="log-out"><em>{h.ok ? t('success', lang) : t('setback', lang)}</em> {h.out[lang]}</p>
              </li>
            ))}</ol>
            <Btn variant="ghost" onClick={() => setLogOpen(false)}>{t('close', lang)}</Btn>
          </div>
        </div>
      )}

      {confirmQuit && (
        <div className="vn-confirm" role="alertdialog">
          <p>{t('confirmQuit', lang)}</p>
          <div><Btn variant="ghost" onClick={() => setConfirmQuit(false)}>{t('no', lang)}</Btn><Btn onClick={onQuit}>{t('yes', lang)}</Btn></div>
        </div>
      )}

      <div className="vn-panel">
        <div className={`vn-box ${isOutcome ? (o!.success ? 'outcome good' : 'outcome bad') : 'narration'}`}>
          {isOutcome && <span className={`tag ${o!.success ? 'ok' : 'no'}`}>{o!.success ? t('success', lang) : t('setback', lang)}</span>}
          {aiText && <span className="tag ai">{t('aiBadge', lang)}</span>}
          {chosen && <p className="chose"><span>{lang === 'ar' ? 'اخترتم:' : 'You chose:'}</span> {chosen}</p>}
          <Typewriter key={`${game.index}${game.stage}`} text={isOutcome ? (aiText ?? o!.text[lang]) : view.text[lang]} speed={speed} onDone={() => setTyped(true)} />
          {isOutcome && o!.partLine && <p className="part-line">{o!.partLine[lang]}</p>}
        </div>

        {lines.length > 0 && (
          <div className="duck-radio" aria-label="BSC Duck Radio">
            {lines.map((l, i) => { const d = DUCK_BY_ID[l.duck]; return d && (
              <div key={`${game.index}${game.stage}${i}`} className={`radio-line kind-${l.kind} ${i ? 'reply' : ''}`}>
                <img src={`${import.meta.env.BASE_URL}ducks/${d.expressions[l.expression]}`} alt="" width={56} height={64} />
                <div><b>{d.name[lang]}{l.kind === 'note' && <em className="radio-tag">{lang === 'ar' ? 'ملاحظة ميدانية · أُضيفت إلى الدفتر' : 'Field note · added to journal'}</em>}{l.kind === 'hunch' && <em className="radio-tag hunch">{lang === 'ar' ? 'مجرّد تخمين' : 'Just a hunch'}</em>}</b><span>{l.text[lang]}</span></div>
              </div>
            ); })}
          </div>
        )}

        {!isOutcome ? (
          <div className={`choices ${typed ? 'ready' : ''}`}>
            {view.choices.map(({ choice, label }, i) => (
              <button key={choice.id} className={`btn-choice style-${choice.style}`} onClick={() => onChoose(choice.id)} disabled={!typed}>
                <span className="num">{i + 1}</span>
                <span className="lbl">{label[lang]}</span>
                <span className="meta">
                  {choice.requires?.capAny && <em className="anat">{lang === 'ar' ? 'قدرة مخلوقك' : 'Your anatomy'}</em>}
                  <em className="sty">{STYLE_LABEL[choice.style][lang]}</em>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {rareNow && (
              <aside className="glimpse rare-glimpse tappable" aria-label={rareNow.name[lang]} role="button" tabIndex={0}
                onClick={() => setZoom({ img: `${import.meta.env.BASE_URL}scenes/${rareArt(rareNow.id)}.webp`, kicker: lang === 'ar' ? 'لقاء نادر' : 'Rare encounter', title: rareNow.name[lang],
                  tags: [lang === 'ar' ? (rareNow.kind === 'real' ? 'حيوان حقيقي' : rareNow.kind === 'myth' ? 'مستوحى من الأساطير' : 'كائن خيالي') : (rareNow.kind === 'real' ? 'Real animal' : rareNow.kind === 'myth' ? 'Myth-inspired' : 'Fantasy')],
                  lines: [{ text: rareNow.glimpse[lang].replace(/\{name\}/g, game.creature.name) }, { label: `${t('realScience', lang)}: `, text: rareNow.echo[lang] },
                    { text: lang === 'ar' ? 'لقاء نادر لا يظهر في كل رحلة. سُجّل في دفتر المستكشف.' : 'A rare encounter that does not appear in every run. It is now in your Explorer Journal.' }] })}>
                <img src={`${import.meta.env.BASE_URL}scenes/${rareArt(rareNow.id)}.webp`} alt="" width={512} height={512} />
                <div>
                  <span className={`tag fiction-tag kind-${rareNow.kind}`}>{lang === 'ar' ? (rareNow.kind === 'real' ? 'لقاء نادر · حيوان حقيقي' : rareNow.kind === 'myth' ? 'لقاء نادر · مستوحى من الأساطير' : 'لقاء نادر · كائن خيالي') : (rareNow.kind === 'real' ? 'Rare encounter · real animal' : rareNow.kind === 'myth' ? 'Rare encounter · myth-inspired' : 'Rare encounter · fantasy')}</span>
                  <p>{rareNow.glimpse[lang].replace(/\{name\}/g, game.creature.name)}</p>
                  <b className="glimpse-name">{rareNow.name[lang]}</b>
                  <small>{lang === 'ar' ? `لاحظه ${game.creature.name} بحواسّه. اضغط للتكبير والوصف 🔍` : `${game.creature.name}’s senses noticed it. Tap to enlarge and read more 🔍`}</small>
                </div>
              </aside>
            )}
            {glimpse && (
              <aside className="glimpse tappable" aria-label={glimpse.name[lang]} role="button" tabIndex={0}
                onClick={() => setZoom({ img: `${import.meta.env.BASE_URL}scenes/${glimpse.art}.webp`, kicker: lang === 'ar' ? 'أسطورة (حكاية خيالية)' : 'Legend (a fictional tale)', title: glimpse.name[lang], tags: [glimpse.epithet[lang]],
                  lines: [{ text: glimpse.glimpse[lang] }, { label: lang === 'ar' ? 'الحكاية: ' : 'The tale: ', text: glimpse.lore[lang] }, { label: lang === 'ar' ? 'علاماته: ' : 'Signs: ', text: glimpse.signs[lang] }] })}>
                <img src={`${import.meta.env.BASE_URL}scenes/${glimpse.art}.webp`} alt="" width={672} height={384} />
                <div>
                  <span className="tag fiction-tag">{lang === 'ar' ? 'أسطورة' : 'Legend'}</span>
                  <p>{glimpse.glimpse[lang]}</p>
                  <small>{lang === 'ar' ? `${glimpse.name.ar}؟ أُضيفت هذه الأسطورة إلى كتاب الأساطير. اضغط للتكبير 🔍` : `${glimpse.name.en}? Added to the Book of Legends.`}</small>
                </div>
              </aside>
            )}
            {newFacts.map((id) => FACT_BY_ID[id] && (
              <aside key={id} className="fact" aria-label={t('realScience', lang)}>
                <span className="tag real">{t('realScience', lang)}</span>
                <p>{FACT_BY_ID[id].text[lang]}</p>
              </aside>
            ))}
            <button className="continue btn btn-primary" onClick={onContinue}>{lastScene ? (lang === 'ar' ? 'شاهد نهاية القصة' : 'See how the story ends') : t('continue', lang)}</button>
          </>
        )}
      </div>
    </section>
  );
}
