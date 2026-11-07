import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sceneImage } from '../art/painter';
import { ambient } from '../audio';
import { DUCK_BY_ID, MOOD_LINES } from '../content/ducks';
import { BIOMES, FACT_BY_ID } from '../content/world';
import { aiAvailable, narrate } from '../engine/ai';
import { Rng } from '../engine/rng';
import { MAX_ENERGY, advance, choose, currentBeat } from '../engine/story';
import type { BiomeId, DuckMood, GameState, Lang, Style } from '../engine/types';
import type { Settings } from '../engine/storage';
import { t } from '../i18n';
import { Btn, CreatureArt, Logos, Typewriter } from './common';

const STYLE_LABEL: Record<Style, { en: string; ar: string }> = {
  bold: { en: 'Bold', ar: 'جريء' }, careful: { en: 'Careful', ar: 'حذر' }, clever: { en: 'Clever', ar: 'ذكي' },
  kind: { en: 'Kind', ar: 'طيّب' }, silly: { en: 'Chaotic', ar: 'فوضوي' },
};

/** Full-bleed painted scene with slow camera drift and a cross-fade between scenes. */
export function PaintedScene({ biome, props, seed, reduced, className = '' }: { biome: BiomeId; props: string[]; seed: number; reduced: boolean; className?: string }) {
  const src = useMemo(() => sceneImage(biome, props, seed), [biome, props, seed]);
  const [prev, setPrev] = useState<string | null>(null);
  const last = useRef<string | null>(null);
  useEffect(() => { setPrev(last.current); last.current = src; const id = setTimeout(() => setPrev(null), 1200); return () => clearTimeout(id); }, [src]);
  return (
    <div className={`painted ${reduced ? 'still' : ''} ${className}`} role="img" aria-label={BIOMES[biome].name.en}>
      {prev && prev !== src && <img className="painted-img old" src={prev} alt="" />}
      {src && <img key={src} className="painted-img" src={src} alt="" />}
      <div className="painted-grain" aria-hidden="true" />
    </div>
  );
}

export function Play({ game, setGame, settings, lang, onQuit }: { game: GameState; setGame: (g: GameState) => void; settings: Settings; lang: Lang; onQuit: () => void }) {
  const view = useMemo(() => (game.stage === 'beat' || game.stage === 'outcome' ? currentBeat(game) : null), [game]);
  const [typed, setTyped] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [newFacts, setNewFacts] = useState<string[]>([]);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showCreature, setShowCreature] = useState(false);
  const [collab, setCollab] = useState(game.mode === 'marine' && game.index === 0 && game.stage === 'beat');
  useEffect(() => { if (!collab) return; const id = setTimeout(() => setCollab(false), 4200); return () => clearTimeout(id); }, [collab]);
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
      return { mood: game.lastOutcome.mood, line: r.pick(MOOD_LINES[game.lastOutcome.mood])[lang] as string | null };
    }
    // Before a choice the duck stays quiet most of the time; silence builds tension.
    return { mood: 'thinking' as DuckMood, line: r.chance(0.35) ? r.pick(MOOD_LINES.thinking)[lang] : null };
  }, [game.seed, game.index, game.stage, game.lastOutcome, lang]);

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

  const onContinue = useCallback(() => { setNewFacts([]); setAiText(null); setGame(advance(game)); }, [game, setGame]);

  // Keyboard: 1–4 pick a choice, Enter/Space continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!view || confirmQuit || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (game.stage === 'beat' && typed) { const n = Number(e.key); if (n >= 1 && n <= view.choices.length) onChoose(view.choices[n - 1].choice.id); }
      else if (game.stage === 'outcome' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onContinue(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [view, game.stage, typed, confirmQuit, onChoose, onContinue]);

  if (!view) return null;
  const isOutcome = game.stage === 'outcome' && game.lastOutcome;
  const o = game.lastOutcome;
  const descendIdx = game.plan.beats.findIndex((b) => b.template === 'pm-descend');
  const isDeep = descendIdx >= 0 && game.index >= descendIdx;
  const phaseLabel = game.mode === 'marine' ? t(isDeep ? 'deep' : 'surface', lang) : null;
  const showOdds = game.duck === 'data';
  const total = game.plan.beats.length;

  return (
    <section className={`screen play vn ${isDeep ? 'is-deep' : ''}`}>
      <PaintedScene biome={view.biome} props={view.template.props} seed={game.seed + game.index} reduced={reduced} />
      <div className="letterbox top" aria-hidden="true" /><div className="letterbox bottom" aria-hidden="true" />

      <header className="vn-hud" role="status">
        <div className="vn-loc">
          <span className="place">{view.ctx.place[lang]}</span>
          {phaseLabel && <span className={`phase ${isDeep ? 'deep' : ''}`}>{phaseLabel}</span>}
        </div>
        <div className="vn-meter">
          <span className="vn-progress">{game.index + 1}/{total}</span>
          <span className="chapter" aria-label={`${game.index + 1}/${total}`}>{Array.from({ length: total }, (_, i) => <i key={i} className={i < game.index ? 'done' : i === game.index ? 'now' : ''} />)}</span>
          <span className="pips" title={t('energy', lang)} aria-label={`${t('energy', lang)} ${game.energy}/${MAX_ENERGY}`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <i key={i} className={i < game.energy ? 'on' : ''} />)}</span>
          <span className="stat" title={t('evidence', lang)}>◆ {game.evidence.length}</span>
          <span className="stat" title={t('discoveries', lang)}>✦ {game.discoveries.length}</span>
          <button className="ghost-icon specimen-btn" onClick={() => setShowCreature((v) => !v)} aria-label={game.creature.name}><CreatureArt creature={game.creature} className="specimen" /></button>
          <button className="ghost-icon" aria-label={t('quit', lang)} onClick={() => setConfirmQuit(true)}>✕</button>
        </div>
      </header>

      {showCreature && (
        <div className="specimen-card" onClick={() => setShowCreature(false)}>
          <CreatureArt creature={game.creature} className="specimen" />
          <b>{game.creature.name}</b>
          <small>{lang === 'ar' ? 'تخيّل مخلوقك داخل المشهد' : 'Picture your creature in the scene'}</small>
        </div>
      )}

      {collab && (
        <div className="collab-intro" onClick={() => setCollab(false)} role="dialog" aria-label={t('collab', lang)}>
          <div className="inner">
            <Logos marine />
            <h2>{t('marine', lang)}</h2>
            <p>{t('collab', lang)}</p>
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
          {duck && (
            <div className={`vn-speaker mood-${duckLine.mood}`}>
              <img src={`${import.meta.env.BASE_URL}ducks/${duck.img}`} alt={duck.name[lang]} className="duck-img" width={72} height={78} />
              <div className="vn-aside"><b>{duck.name[lang]}</b>{duckLine.line ? <span>«{duckLine.line}»</span> : <span className="role">{duck.role[lang]}</span>}</div>
            </div>
          )}
          {isOutcome && <span className={`tag ${o!.success ? 'ok' : 'no'}`}>{o!.success ? t('success', lang) : t('setback', lang)}</span>}
          {aiText && <span className="tag ai">{t('aiBadge', lang)}</span>}
          <Typewriter key={`${game.index}${game.stage}`} text={isOutcome ? (aiText ?? o!.text[lang]) : view.text[lang]} speed={speed} onDone={() => setTyped(true)} />
          {isOutcome && o!.partLine && <p className="part-line">{o!.partLine[lang]}</p>}
        </div>

        {!isOutcome ? (
          <div className={`choices ${typed ? 'ready' : ''}`}>
            {view.choices.map(({ choice, label, odds }, i) => (
              <button key={choice.id} className={`btn-choice style-${choice.style}`} onClick={() => onChoose(choice.id)} disabled={!typed}>
                <span className="num">{i + 1}</span>
                <span className="lbl">{label[lang]}</span>
                <span className="meta">
                  {choice.requires?.capAny && <em className="anat">{lang === 'ar' ? 'قدرة مخلوقك' : 'Your anatomy'}</em>}
                  <em className="sty">{STYLE_LABEL[choice.style][lang]}</em>
                  {showOdds && odds !== null && <em className="odds">{Math.round(odds * 100)}%</em>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {newFacts.map((id) => FACT_BY_ID[id] && (
              <aside key={id} className="fact" aria-label={t('realScience', lang)}>
                <span className="tag real">{t('realScience', lang)}</span>
                <p>{FACT_BY_ID[id].text[lang]}</p>
              </aside>
            ))}
            <button className="continue btn btn-primary" onClick={onContinue}>{t('continue', lang)}</button>
          </>
        )}
      </div>
    </section>
  );
}
