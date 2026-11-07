import { useEffect, useMemo, useState } from 'react';
import { DUCKS } from './content/ducks';
import { aiAvailable } from './engine/ai';
import { decodeCreature, randomCreature } from './engine/creature';
import { composeEnding } from './engine/ending';
import { Rng, newSeed } from './engine/rng';
import { load, recordRun, save, type SaveData } from './engine/storage';
import { startGame } from './engine/story';
import type { CreatureConfig, Ending, GameState, Lang, Mode } from './engine/types';
import { t } from './i18n';
import { Builder, NameCreature } from './ui/Builder';
import { Btn, Logos } from './ui/common';
import { EndingScreen } from './ui/EndingScreen';
import { PaintedScene, Play } from './ui/Play';
import { ambient } from './audio';

type Screen = 'title' | 'duck' | 'player' | 'build' | 'cname' | 'mode' | 'play' | 'ending';
const BASE = import.meta.env.BASE_URL;

function sharedFromHash(): CreatureConfig | null {
  if (typeof location === 'undefined') return null;
  const m = location.hash.match(/#c=([\w-]+)/);
  return m ? decodeCreature(m[1]) : null;
}

export default function App() {
  const [data, setData] = useState<SaveData>(() => load());
  const lang: Lang = data.settings.lang;
  const shared = useMemo(sharedFromHash, []);
  const [screen, setScreen] = useState<Screen>('title');
  const [duck, setDuck] = useState<string>(DUCKS[0].id);
  const [player, setPlayer] = useState<string>(() => data.runs[data.runs.length - 1]?.player ?? '');
  const [creature, setCreature] = useState<CreatureConfig>(() => shared ?? randomCreature(new Rng(newSeed()), lang));
  const [game, setGame] = useState<GameState | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduced = data.settings.reducedMotion;

  useEffect(() => { save(data); }, [data]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('reduced-motion', reduced);
  }, [lang, reduced]);
  useEffect(() => { if (data.settings.muted) ambient.stop(); }, [data.settings.muted]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);

  const setSettings = (patch: Partial<SaveData['settings']>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const updateGame = (g: GameState) => {
    if (g.stage === 'ending') {
      const e = composeEnding(g, data.runs.slice(-5).map((r) => r.ending));
      setEnding(e); setGame(g); setData((d) => recordRun(d, g, e)); setScreen('ending');
      return;
    }
    setGame(g); setData((d) => ({ ...d, current: g }));
  };

  const begin = (mode: Mode, c: CreatureConfig = creature) => {
    const g = startGame({ mode, seed: newSeed(), duck, player, creature: c, history: data.runs });
    setEnding(null); updateGame(g); setScreen('play');
  };
  const resume = () => { if (data.current) { setGame(data.current); setDuck(data.current.duck); setCreature(data.current.creature); setScreen('play'); } };
  const quit = () => { setData((d) => ({ ...d, current: null })); setGame(null); setScreen('title'); ambient.stop(); };
  const selectedDuck = DUCKS.find((d) => d.id === duck)!;

  return (
    <div className={`app lang-${lang} screen-${screen}`}>
      <div className="topbar">
        <button className="brand" onClick={() => setScreen('title')} aria-label={t('subtitle', lang)}>
          <img src={`${BASE}brand/bsc-logo-transparent.png`} alt="" /> <span>BioLab</span>
        </button>
        <div className="top-actions">
          <button className="ghost-icon" onClick={() => setSettings({ lang: lang === 'ar' ? 'en' : 'ar' })} aria-label={t('language', lang)}>{lang === 'ar' ? 'EN' : 'ع'}</button>
          <button className="ghost-icon" onClick={() => setSettings({ muted: !data.settings.muted })} aria-label={data.settings.muted ? t('unmute', lang) : t('mute', lang)}>{data.settings.muted ? '♪̸' : '♪'}</button>
          <button className="ghost-icon" onClick={() => setSettingsOpen(true)} aria-label={t('settings', lang)}>⚙</button>
        </div>
      </div>

      <main>
        {screen === 'title' && (
          <section className="screen title">
            <PaintedScene biome="twilight" props={['sub', 'jelly']} seed={1930} reduced={reduced} className="backdrop" />
            <div className="title-inner">
              <Logos />
              <p className="eyebrow">{t('club', lang)}</p>
              <h1 className="game-title"><span className="en" lang="en" dir="ltr">What The Beast?!</span><span className="ar" lang="ar" dir="rtl">شنو هالوحش؟!</span></h1>
              <p className="tagline">{t('pressStart', lang)} — {t('tagline', lang)}</p>
              {shared && <p className="notice">{t('sharedCreature', lang)} — <b>{shared.name}</b></p>}
              <div className="title-actions">
                <Btn onClick={() => setScreen('duck')}>{t('enterLab', lang)}</Btn>
                {data.current && <Btn variant="ghost" onClick={resume}>{t('continueRun', lang)}</Btn>}
              </div>
              {data.runs.length > 0 && (
                <details className="past">
                  <summary>{t('pastRuns', lang)} ({data.runs.length})</summary>
                  <ul>{data.runs.slice(-6).reverse().map((r) => <li key={r.at}><b>{r.title[lang]}</b> — {r.creature.name}</li>)}</ul>
                </details>
              )}
            </div>
          </section>
        )}

        {screen === 'duck' && (
          <section className="screen duck-select">
            <header className="screen-head"><p className="step">01</p><h2>{t('chooseDuck', lang)}</h2><p className="hint">{t('chooseDuckHint', lang)}</p></header>
            <div className="duck-stage">
              <div className="duck-hero" style={{ ['--duck-bg' as string]: selectedDuck.bg }}>
                <img src={`${BASE}ducks/${selectedDuck.img}`} alt={selectedDuck.name[lang]} width={420} height={454} />
                <div className="duck-hero-text">
                  <h3>{selectedDuck.name[lang]}</h3>
                  <p className="role">{selectedDuck.role[lang]}</p>
                  <p className="perk">{selectedDuck.perk[lang]}</p>
                </div>
              </div>
              <div className="duck-grid" role="radiogroup" aria-label={t('chooseDuck', lang)}>
                {DUCKS.map((d) => (
                  <button key={d.id} role="radio" aria-checked={duck === d.id} className={`duck-card ${duck === d.id ? 'on' : ''}`} onClick={() => setDuck(d.id)}>
                    <img src={`${BASE}ducks/${d.img}`} alt={d.name[lang]} width={140} height={151} loading="lazy" />
                    <strong>{d.name[lang]}</strong>
                  </button>
                ))}
              </div>
            </div>
            <footer className="screen-foot"><Btn variant="ghost" onClick={() => setScreen('title')}>{t('back', lang)}</Btn><Btn onClick={() => setScreen('player')}>{t('next', lang)}</Btn></footer>
          </section>
        )}

        {screen === 'player' && (
          <section className="screen player">
            <header className="screen-head"><p className="step">02</p><h2>{t('yourName', lang)}</h2><p className="hint">{t('yourNameHint', lang)}</p></header>
            <div className="name-field">
              <input className="text-in" maxLength={24} value={player} placeholder={t('namePlaceholder', lang)} aria-label={t('namePlaceholder', lang)} onChange={(e) => setPlayer(e.target.value)} autoFocus />
            </div>
            <footer className="screen-foot"><Btn variant="ghost" onClick={() => setScreen('duck')}>{t('back', lang)}</Btn><Btn onClick={() => { setPlayer(player.trim()); setScreen('build'); }}>{t('next', lang)}</Btn></footer>
          </section>
        )}

        {screen === 'build' && <Builder lang={lang} value={creature} onChange={setCreature} onBack={() => setScreen('player')} onNext={() => setScreen('cname')} />}
        {screen === 'cname' && <NameCreature lang={lang} value={creature} onChange={setCreature} onBack={() => setScreen('build')} onNext={() => setScreen('mode')} />}

        {screen === 'mode' && (
          <section className="screen mode-select">
            <header className="screen-head"><p className="step">05</p><h2>{t('chooseMode', lang)}</h2></header>
            <div className="mode-grid">
              <button className="mode-card classic" onClick={() => begin('classic')}>
                <PaintedScene biome="forest" props={[]} seed={11} reduced />
                <div className="mode-text"><strong>{t('classic', lang)}</strong><span>{t('classicDesc', lang)}</span></div>
              </button>
              <button className="mode-card marine" onClick={() => begin('marine')}>
                <PaintedScene biome="midnight" props={['angler']} seed={12} reduced />
                <div className="mode-text">
                  <img className="collab-logo" src={`${BASE}brand/marine-logo-transparent.png`} alt="Marine Science Club" />
                  <strong>{t('marine', lang)}</strong><span>{t('marineDesc', lang)}</span>
                </div>
              </button>
            </div>
            <footer className="screen-foot"><Btn variant="ghost" onClick={() => setScreen('cname')}>{t('back', lang)}</Btn></footer>
          </section>
        )}

        {screen === 'play' && game && <Play game={game} setGame={updateGame} settings={data.settings} lang={lang} onQuit={quit} />}
        {screen === 'ending' && game && ending && (
          <EndingScreen game={game} ending={ending} lang={lang} reduced={reduced}
            onReplay={() => begin(game.mode, game.creature)}
            onNew={() => { setCreature(randomCreature(new Rng(newSeed()), lang)); setScreen('build'); }} />
        )}
      </main>

      {screen !== 'play' && <footer className="credit">{t('credit', lang)}</footer>}

      {settingsOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={t('settings', lang)} onClick={() => setSettingsOpen(false)}>
          <div className="settings" onClick={(e) => e.stopPropagation()}>
            <h2>{t('settings', lang)}</h2>
            <label>{t('language', lang)}
              <select value={lang} onChange={(e) => setSettings({ lang: e.target.value as Lang })}><option value="ar">العربية</option><option value="en">English</option></select>
            </label>
            <label>{t('textSpeed', lang)} <small>{data.settings.textSpeed === 0 ? t('instant', lang) : data.settings.textSpeed}</small>
              <input type="range" min={0} max={100} value={data.settings.textSpeed} onChange={(e) => setSettings({ textSpeed: Number(e.target.value) })} />
            </label>
            <label className="check"><input type="checkbox" checked={!data.settings.muted} onChange={(e) => setSettings({ muted: !e.target.checked })} /> {t('sound', lang)}</label>
            <label className="check"><input type="checkbox" checked={reduced} onChange={(e) => setSettings({ reducedMotion: e.target.checked })} /> {t('reducedMotion', lang)}</label>
            <label className="check"><input type="checkbox" disabled={!aiAvailable()} checked={data.settings.ai && aiAvailable()} onChange={(e) => setSettings({ ai: e.target.checked })} /> {t('aiNarration', lang)}</label>
            {!aiAvailable() && <p className="hint">{t('aiOff', lang)}</p>}
            <Btn onClick={() => setSettingsOpen(false)}>{t('close', lang)}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
