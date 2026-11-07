import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sceneLayers, svgWrap } from '../art/sceneSvg';
import { ambient } from '../audio';
import { DUCK_BY_ID, MOOD_LINES } from '../content/ducks';
import { BIOMES, FACT_BY_ID } from '../content/world';
import { aiAvailable, narrate } from '../engine/ai';
import { Rng } from '../engine/rng';
import { MAX_ENERGY, advance, choose, currentBeat } from '../engine/story';
import type { BiomeId, CreatureConfig, DuckMood, GameState, Lang } from '../engine/types';
import type { Settings } from '../engine/storage';
import { t } from '../i18n';
import { Btn, CreatureArt, Typewriter } from './common';

export function Scene({ biome, props, seed, creature, fx, reduced, clone }: { biome: BiomeId; props: string[]; seed: number; creature: CreatureConfig; fx?: string; reduced: boolean; clone?: boolean }) {
  const layers = useMemo(() => sceneLayers(biome, props, seed), [biome, props, seed]);
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5));
    ref.current.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5));
  };
  return (
    <div ref={ref} className={`scene ${layers.underwater ? 'underwater' : ''} ${layers.dark ? 'dark' : ''} ${reduced ? 'still' : ''}`} onPointerMove={onMove} aria-label={BIOMES[biome].name.en} role="img">
      <div className="layer l-sky" dangerouslySetInnerHTML={{ __html: svgWrap(layers.sky) }} />
      <div className="layer l-far" dangerouslySetInnerHTML={{ __html: svgWrap(layers.far) }} />
      <div className="layer l-mid" dangerouslySetInnerHTML={{ __html: svgWrap(layers.mid) }} />
      <div className="layer l-props" dangerouslySetInnerHTML={{ __html: svgWrap(layers.props) }} />
      {clone && <div className="scene-creature clone"><CreatureArt creature={creature} /></div>}
      <div className={`scene-creature fx-${fx ?? 'idle'}`}><CreatureArt creature={creature} /></div>
      <div className="layer l-near" dangerouslySetInnerHTML={{ __html: svgWrap(layers.near) }} />
      {fx && <div key={fx + seed} className={`fx-overlay fx-${fx}`} aria-hidden="true" />}
    </div>
  );
}

function DuckPanel({ duckId, mood, line, lang }: { duckId: string; mood: DuckMood; line: string; lang: Lang }) {
  const duck = DUCK_BY_ID[duckId];
  if (!duck) return null;
  return (
    <div className={`duck-panel mood-${mood}`}>
      <img src={`${import.meta.env.BASE_URL}ducks/${duck.img}`} alt={duck.name[lang]} className="duck-img" style={{ background: duck.bg }} width={84} height={91} />
      <div className="bubble" lang={lang}><b>{duck.name[lang]}:</b> {line}</div>
    </div>
  );
}

export function Play({ game, setGame, settings, lang, onQuit }: { game: GameState; setGame: (g: GameState) => void; settings: Settings; lang: Lang; onQuit: () => void }) {
  const view = useMemo(() => (game.stage === 'beat' || game.stage === 'outcome' ? currentBeat(game) : null), [game]);
  const [typed, setTyped] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [newFacts, setNewFacts] = useState<string[]>([]);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const recent = useRef<string[]>([]);
  const reduced = settings.reducedMotion;
  const speed = reduced ? Math.max(settings.textSpeed, 90) : settings.textSpeed;

  useEffect(() => { setTyped(false); }, [game.index, game.stage]);
  useEffect(() => { if (!settings.muted && view) ambient.play(view.biome); else ambient.stop(); }, [view?.biome, settings.muted]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => ambient.stop(), []);

  const duck = DUCK_BY_ID[game.duck];
  const duckLine = useMemo(() => {
    const r = Rng.from(game.seed, `duck${game.index}${game.stage}`);
    if (game.stage === 'outcome' && game.lastOutcome) {
      const pool = r.chance(0.25) && duck ? duck.catch : MOOD_LINES[game.lastOutcome.mood];
      return { mood: game.lastOutcome.mood, line: r.pick(pool)[lang] };
    }
    return { mood: 'thinking' as DuckMood, line: (r.chance(0.5) && duck ? r.pick(duck.catch) : r.pick(MOOD_LINES.thinking))[lang] };
  }, [game.seed, game.index, game.stage, game.lastOutcome, duck, lang]);

  const onChoose = useCallback((id: string) => {
    const before = new Set(game.discoveries);
    const next = choose(game, id);
    setNewFacts(next.discoveries.filter((d) => !before.has(d)));
    setAiText(null);
    if (!settings.muted) ambient.blip(!!next.lastOutcome?.success);
    setGame(next);
    if (settings.ai && aiAvailable() && next.lastOutcome) {
      const base = next.lastOutcome.text[lang];
      narrate({ lang, creature: next.creature, place: BIOMES[currentBeat(next).biome].name[lang], base, success: next.lastOutcome.success, recent: recent.current }, base)
        .then((r) => { if (r.source === 'ai') setAiText(r.text); recent.current.push(r.text); });
    }
  }, [game, setGame, settings.ai, settings.muted, lang]);

  const onContinue = () => { setNewFacts([]); setAiText(null); setGame(advance(game)); };

  if (!view) return null;
  const isOutcome = game.stage === 'outcome' && game.lastOutcome;
  const o = game.lastOutcome;
  const sceneProps = view.template.props;
  const descendIdx = game.plan.beats.findIndex((b) => b.template === 'pm-descend');
  const isDeep = descendIdx >= 0 && game.index >= descendIdx;
  const phaseLabel = game.mode === 'marine' ? t(isDeep ? 'deep' : 'surface', lang) : null;
  const showOdds = game.duck === 'data';

  return (
    <section className="screen play" key={`${game.index}`}>
      <Scene biome={view.biome} props={sceneProps} seed={game.seed + game.index} creature={game.creature} fx={isOutcome ? o!.fx : undefined} reduced={reduced} clone={sceneProps.includes('clone')} />
      <div className="hud" role="status">
        <span className="place">📍 {view.ctx.place[lang]}</span>
        {phaseLabel && <span className={`phase ${isDeep ? 'deep' : ''}`}>{phaseLabel}</span>}
        <span className="pips" aria-label={`${t('energy', lang)} ${game.energy}/${MAX_ENERGY}`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <i key={i} className={i < game.energy ? 'on' : ''} />)}</span>
        <span>🧪 {game.evidence.length}</span>
        <span>🔬 {game.discoveries.length}</span>
        <span className="progress">{game.index + 1}/{game.plan.beats.length}</span>
        <button className="icon-btn" aria-label={t('quit', lang)} onClick={() => setConfirmQuit(true)}>✕</button>
      </div>
      {confirmQuit && (
        <div className="confirm card" role="alertdialog">
          <p>{t('confirmQuit', lang)}</p>
          <Btn variant="ghost" onClick={() => setConfirmQuit(false)}>{t('no', lang)}</Btn> <Btn onClick={onQuit}>{t('yes', lang)}</Btn>
        </div>
      )}
      <div className="story-panel">
        {!isOutcome ? (
          <>
            <div className="card narration">
              <span className="tag fiction">{t('storyFiction', lang)}</span>
              <Typewriter text={view.text[lang]} speed={speed} onDone={() => setTyped(true)} />
            </div>
            <div className={`choices ${typed ? 'ready' : ''}`}>
              {view.choices.map(({ choice, label, odds }) => (
                <Btn key={choice.id} variant="choice" className={`style-${choice.style}`} onClick={() => onChoose(choice.id)} disabled={!typed}>
                  <span>{label[lang]}</span>
                  {choice.requires?.capAny && <em className="anat">🧬</em>}
                  {showOdds && odds !== null && <em className="odds">{Math.round(odds * 100)}% {t('odds', lang)}</em>}
                </Btn>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={`card narration outcome ${o!.success ? 'good' : 'bad'}`}>
              <span className={`tag ${o!.success ? 'ok' : 'no'}`}>{o!.success ? t('success', lang) : t('setback', lang)}</span>
              {aiText && <span className="tag ai">{t('aiBadge', lang)}</span>}
              <Typewriter text={aiText ?? o!.text[lang]} speed={speed} onDone={() => setTyped(true)} />
              {o!.partLine && <p className="part-line">🧬 {o!.partLine[lang]}</p>}
            </div>
            {newFacts.map((id) => FACT_BY_ID[id] && (
              <aside key={id} className="card fact" aria-label={t('realScience', lang)}>
                <span className="tag real">🔬 {t('realScience', lang)}</span>
                <p>{FACT_BY_ID[id].text[lang]}</p>
              </aside>
            ))}
            <Btn className="continue" onClick={onContinue}>{t('continue', lang)} →</Btn>
          </>
        )}
        <DuckPanel duckId={game.duck} mood={duckLine.mood} line={duckLine.line} lang={lang} />
      </div>
    </section>
  );
}
