import { useEffect, useMemo, useState } from 'react';
import { DUCKS } from './content/ducks';
import { aiAvailable } from './engine/ai';
import { decodeCreature, randomCreature } from './engine/creature';
import { composeEnding } from './engine/ending';
import { Rng, newSeed } from './engine/rng';
import { load, newVisitor, recordRun, save, type SaveData } from './engine/storage';
import { BEAT_BY_ID, startGame, type PlanOpts } from './engine/story';
import { decodeSave, saveFromHash, type DecodeResult } from './engine/save';
import { recordToJournal } from './engine/journal';
import { sightingFor } from './engine/sighting';
import { platesForRun } from './art/plates';
import { JournalScreen } from './ui/Journal';
import { PassportView } from './ui/Passport';
import { Particles } from './ui/common';
import type { CreatureConfig, Ending, GameState, Lang, Mode } from './engine/types';
import { t } from './i18n';
import { Builder, NameCreature } from './ui/Builder';
import { Btn, CreatureArt, Logos } from './ui/common';
import { EndingScreen } from './ui/EndingScreen';
import { PaintedScene, Play } from './ui/Play';
import { plateUrl } from './art/plates';
import { ambient } from './audio';
import { LoreBook } from './ui/LoreBook';
import { u } from './ui/uiText';

type Screen = 'title' | 'lore' | 'journal' | 'restore' | 'duck' | 'player' | 'build' | 'cname' | 'mode' | 'play' | 'ending';
const BASE = import.meta.env.BASE_URL;

function sharedFromHash(): CreatureConfig | null {
  if (typeof location === 'undefined') return null;
  const m = location.hash.match(/#c=([\w-]+)/);
  return m ? decodeCreature(m[1]) : null;
}

/** A Passport QR link (#s=…). Read once, then removed from the address bar so a shared booth device does not keep it. */
function restoreFromHash(): DecodeResult | null {
  if (typeof location === 'undefined') return null;
  const code = saveFromHash(location.hash);
  if (!code) return null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
  return decodeSave(code);
}

/** The painted plate behind a run's current (or last) scene, for the passport and the ending gallery. */
export function runPlate(g: GameState): string | null {
  const upto = Math.min(g.index, g.plan.beats.length - 1);
  const ps = platesForRun(g, (i) => BEAT_BY_ID[g.plan.beats[i].template]?.kind ?? null, upto);
  return ps[upto]?.id ?? ps.filter(Boolean).pop()?.id ?? null;
}

const R = {
  restoreTitle: { en: 'Explorer Passport scanned', ar: 'تمّ مسح جواز المستكشف' },
  restoreLead: { en: 'This adventure will open exactly where it was left: the same creature, the same story, the same decisions.', ar: 'ستُفتح هذه المغامرة من النقطة نفسها التي توقّفت عندها: المخلوق نفسه، والقصة نفسها، والقرارات نفسها.' },
  restoreGo: { en: 'Continue the adventure', ar: 'تابع المغامرة' },
  restoreKeep: { en: 'Keep it in my journal', ar: 'احفظها في دفتري' },
  restoreReplace: { en: 'This device already has an adventure in progress. Continuing will replace it here (the other adventure’s own QR still works).', ar: 'على هذا الجهاز مغامرة جارية. المتابعة ستستبدلها هنا (ويبقى رمز تلك المغامرة صالحاً).' },
  restoreBad: { en: 'This QR code could not be read', ar: 'تعذّرت قراءة هذا الرمز' },
  bad_format: { en: 'The link is incomplete or was not made by this game. Try scanning the card again, closer and with steady hands.', ar: 'الرابط ناقص أو لم تُنشئه هذه اللعبة. حاول مسح البطاقة مرة أخرى من مسافة أقرب وبثبات.' },
  bad_checksum: { en: 'The code was damaged while scanning. Try scanning again.', ar: 'تضرّر الرمز أثناء المسح. حاول المسح مرة أخرى.' },
  bad_newer: { en: 'This passport was made by a newer version of the game. Refresh the page and scan again.', ar: 'صُنع هذا الجواز بإصدار أحدث من اللعبة. حدّث الصفحة ثم امسح الرمز مرة أخرى.' },
  bad_version: { en: 'This passport comes from an old version of the game that can no longer be restored.', ar: 'هذا الجواز من إصدار قديم من اللعبة لم يعد من الممكن استعادته.' },
  bad_content: { en: 'The game’s stories were updated since this passport was made, so this exact adventure cannot be rebuilt. Your creature is safe — you can start a new adventure with it.', ar: 'حُدّثت قصص اللعبة بعد إصدار هذا الجواز، لذلك لا يمكن إعادة بناء المغامرة نفسها بدقة. مخلوقك محفوظ، ويمكنك أن تبدأ به مغامرة جديدة.' },
  bad_replay: { en: 'The adventure could not be rebuilt safely, so it was not opened (no different story was invented).', ar: 'تعذّرت إعادة بناء المغامرة بأمان، فلم تُفتح (ولم تُخترع قصة مختلفة).' },
  useCreature: { en: 'Build with this creature', ar: 'ابدأ بهذا المخلوق' },
  home: { en: 'Main menu', ar: 'القائمة الرئيسية' },
  newVisitor: { en: 'New visitor', ar: 'زائر جديد' },
  nvTitle: { en: 'Start fresh for a new visitor?', ar: 'البدء من جديد لزائر جديد؟' },
  nvBody: { en: 'This clears the adventure in progress, names, creatures and the journal on THIS device, so the next visitor cannot open them. Passport QR codes already handed out keep working.', ar: 'سيمسح هذا المغامرة الجارية والأسماء والمخلوقات والدفتر من هذا الجهاز فقط، كي لا يفتحها الزائر التالي. رموز الجوازات التي حصل عليها الزوّار تبقى صالحة.' },
  nvYes: { en: 'Yes, new visitor', ar: 'نعم، زائر جديد' },
  nvDone: { en: 'Ready for the next explorer.', ar: 'الجهاز جاهز للمستكشف التالي.' },
  journal: { en: 'Explorer Journal', ar: 'دفتر المستكشف' },
  length: { en: 'Story length', ar: 'طول القصة' }, quick: { en: 'Quick story · 6–8 scenes', ar: 'قصة قصيرة · ٦–٨ مشاهد' }, full: { en: 'Full adventure · 8–12 scenes', ar: 'مغامرة كاملة · ٨–١٢ مشهداً' },
  tone: { en: 'Mood', ar: 'الأجواء' }, balanced: { en: 'Balanced', ar: 'متوازنة' }, light: { en: 'Light & funny', ar: 'خفيفة ومرحة' }, mystery: { en: 'Mysterious', ar: 'غامضة' }, surprise: { en: 'Surprise me', ar: 'فاجئني' },
};
const r = (k: keyof typeof R, lang: Lang) => R[k][lang];

export default function App() {
  const [data, setData] = useState<SaveData>(() => load());
  const lang: Lang = data.settings.lang;
  const shared = useMemo(sharedFromHash, []);
  const [screen, setScreen] = useState<Screen>('title');
  const [duck, setDuck] = useState<string>(DUCKS[0].id);
  // never pre-fill the previous visitor's name (shared booth devices)
  const [player, setPlayer] = useState<string>('');
  const [creature, setCreature] = useState<CreatureConfig>(() => shared ?? randomCreature(new Rng(newSeed()), lang));
  const [game, setGame] = useState<GameState | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restored, setRestored] = useState<DecodeResult | null>(restoreFromHash);
  // a second scan while the game is already open only changes the #fragment
  useEffect(() => { const on = () => { const res = restoreFromHash(); if (res) { setRestored(res); setScreen('restore'); } }; window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  const [passport, setPassport] = useState(false);
  const [askNew, setAskNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [len, setLen] = useState<'quick' | 'full'>('full');
  const [tone, setTone] = useState<'balanced' | 'light' | 'mystery' | 'surprise'>('balanced');
  const [unlocked, setUnlocked] = useState<string[]>([]);
  useEffect(() => { if (restored) setScreen('restore'); }, [restored]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 3200); return () => clearTimeout(id); }, [toast]);
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
      const e = composeEnding(g, g.pins?.recentEndings ?? data.runs.slice(-5).map((r) => r.ending));
      setEnding(e); setGame(g);
      const jr = recordToJournal(data.journal, g, e, runPlate(g));
      setUnlocked(jr.unlocked);
      // the marine legend's giant counts as a sighting of Bu Sahn
      setData((d) => { const r = { ...recordRun(d, g, e), journal: recordToJournal(d.journal, g, e, runPlate(g)).journal }; return g.flags.includes('saw-leviathan') && !r.legendsSeen.includes('bu-sahn') ? { ...r, legendsSeen: [...r.legendsSeen, 'bu-sahn'] } : r; });
      setScreen('ending');
      return;
    }
    setGame(g); setData((d) => ({ ...d, current: g }));
  };

  const begin = (mode: Mode, c: CreatureConfig = creature) => {
    const seed = newSeed();
    const mood = tone === 'surprise' ? (['balanced', 'light', 'mystery'] as const)[seed % 3] : tone;
    const opts: PlanOpts = { length: len, tone: mood };
    let g = startGame({ mode, seed, duck, player, creature: c, history: data.runs, opts });
    // decisions that depend on THIS device's history are made once and pinned, so the run is identical on any device
    const sight = sightingFor(g, data.legendsSeen);
    g = { ...g, pins: { sighting: sight ? [sight.index, sight.legend.id] : null, recentEndings: data.runs.slice(-5).map((x) => x.ending) } };
    setEnding(null); updateGame(g); setScreen('play');
  };
  const acceptRestore = () => {
    if (!restored?.ok) return;
    const g = restored.state;
    setDuck(g.duck); setCreature(g.creature); setPlayer(g.player);
    if (g.stage === 'ending') { setGame(g); updateGame(g); return; }
    setEnding(null); setGame(g); setData((d) => ({ ...d, current: g })); setScreen('play');
  };
  const doNewVisitor = () => {
    setData((d) => newVisitor(d)); setGame(null); setEnding(null); setPlayer(''); setDuck(DUCKS[0].id);
    setCreature(randomCreature(new Rng(newSeed()), lang)); setAskNew(false); setPassport(false); setScreen('title'); setToast(r('nvDone', lang));
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
  };
  const resume = () => { if (data.current) { setGame(data.current); setDuck(data.current.duck); setCreature(data.current.creature); setScreen('play'); } };
  const quit = () => { setData((d) => ({ ...d, current: null })); setGame(null); setScreen('title'); ambient.stop(); };
  const selectedDuck = DUCKS.find((d) => d.id === duck)!;

  return (
    <div className={`app lang-${lang} screen-${screen}`}>
      <div className="topbar">
        <button className="brand" onClick={() => setScreen('title')} aria-label={t('subtitle', lang)}>
          <img src={`${BASE}brand/bsc-logo-white.png`} alt="" /> <span>BioLab</span>
        </button>
        <div className="top-actions">
          <button className="ghost-icon" onClick={() => setSettings({ lang: lang === 'ar' ? 'en' : 'ar' })} aria-label={t('language', lang)}>{lang === 'ar' ? 'EN' : 'ع'}</button>
          <button className="ghost-icon" onClick={() => setSettings({ muted: !data.settings.muted })} aria-label={data.settings.muted ? t('unmute', lang) : t('mute', lang)}>{data.settings.muted ? '♪̸' : '♪'}</button>
          <button className="ghost-icon" onClick={() => setSettingsOpen(true)} aria-label={t('settings', lang)}>⚙</button>
        </div>
      </div>

      {screen !== 'play' && screen !== 'title' && <div className="menu-particles"><Particles kind={screen === 'journal' ? 'specks' : 'spores'} count={14} /></div>}
      <main>
        {screen === 'title' && (
          <section className="screen title">
            <PaintedScene biome="twilight" props={['sub', 'jelly']} seed={1930} reduced={reduced} className="backdrop" plate={plateUrl('twilight-siphonophore')} />
            <Particles kind="spores" />
            <div className="title-inner">
              <Logos />
              <p className="eyebrow">{t('club', lang)}</p>
              <h1 className="game-title"><span className="en" lang="en" dir="ltr">What The Beast?!</span><span className="ar" lang="ar" dir="rtl">شنو هالوحش؟!</span></h1>
              <p className="tagline">{t('pressStart', lang)} — {t('tagline', lang)}</p>
              {shared && <p className="notice">{t('sharedCreature', lang)} — <b>{shared.name}</b></p>}
              <div className="title-actions">
                <Btn onClick={() => setScreen('duck')}>{t('enterLab', lang)}</Btn>
                {data.current && <Btn variant="ghost" onClick={resume}>{t('continueRun', lang)}</Btn>}
                <Btn variant="ghost" onClick={() => setScreen('journal')}>{r('journal', lang)}</Btn>
                <Btn variant="ghost" onClick={() => setScreen('lore')}>{lang === 'ar' ? 'كتاب الأساطير' : 'Book of Legends'}</Btn>
              </div>
              <button className="new-visitor" onClick={() => setAskNew(true)}>↺ {r('newVisitor', lang)}</button>
            </div>
          </section>
        )}

        {screen === 'lore' && <LoreBook lang={lang} seen={data.legendsSeen} onBack={() => setScreen('title')} />}
        {screen === 'journal' && <JournalScreen lang={lang} journal={data.journal} onBack={() => setScreen('title')} />}

        {screen === 'restore' && restored && (
          <section className="screen restore">
            <PaintedScene biome="lab" props={[]} seed={7} reduced={reduced} className="backdrop" plate={restored.ok ? (runPlate(restored.state) ? plateUrl(runPlate(restored.state)!) : null) : null} />
            <div className="restore-card">
              <Logos marine={restored.ok && restored.state.mode === 'marine'} />
              {restored.ok ? <>
                <p className="kicker">{r('restoreTitle', lang)}</p>
                <div className="restore-creature"><CreatureArt creature={restored.state.creature} expression="happy" /></div>
                <h2>{restored.state.creature.name}</h2>
                <p className="restore-meta">{restored.state.player ? `${restored.state.player} · ` : ''}{DUCKS.find((d) => d.id === restored.state.duck)?.name[lang]} · {t(restored.state.mode === 'marine' ? 'marine' : 'classic', lang)}</p>
                <p className="restore-meta">{restored.state.stage === 'ending' ? (lang === 'ar' ? 'مغامرة مكتملة' : 'Completed adventure') : (lang === 'ar' ? `المشهد ${restored.state.index + 1} من ${restored.state.plan.beats.length}` : `Scene ${restored.state.index + 1} of ${restored.state.plan.beats.length}`)} · ◆ {restored.state.evidence.length} · ✦ {restored.state.discoveries.length}</p>
                <p className="lead">{r('restoreLead', lang)}</p>
                {data.current && restored.state.stage !== 'ending' && <p className="notice warn">{r('restoreReplace', lang)}</p>}
                <div className="title-actions"><Btn onClick={acceptRestore} autoFocus>{restored.state.stage === 'ending' ? r('restoreKeep', lang) : r('restoreGo', lang)}</Btn><Btn variant="ghost" onClick={() => setScreen('title')}>{r('home', lang)}</Btn></div>
              </> : <>
                <p className="kicker">{r('restoreBad', lang)}</p>
                <p className="lead">{r(`bad_${restored.reason}` as keyof typeof R, lang)}</p>
                <div className="title-actions">
                  {restored.creature && <Btn onClick={() => { setCreature(restored.creature!); setScreen('duck'); }}>{r('useCreature', lang)}</Btn>}
                  <Btn variant="ghost" onClick={() => setScreen('title')}>{r('home', lang)}</Btn>
                </div>
              </>}
            </div>
          </section>
        )}

        {screen === 'duck' && (
          <section className="screen duck-select">
            <header className="screen-head"><p className="step">01</p><h2>{u('chooseCompanion', lang)}</h2><p className="hint">{u('companionHint', lang)}</p></header>
            <div className="duck-stage">
              <article key={selectedDuck.id} className="duck-hero" style={{ ['--duck-bg' as string]: selectedDuck.bg, ['--duck-edge' as string]: selectedDuck.edge }}>
                <div className="duck-hero-art"><img src={`${BASE}ducks/${selectedDuck.img}`} alt={selectedDuck.name[lang]} /></div>
                <div className="duck-hero-text">
                  <span className="kicker">{u('companion', lang)}</span>
                  <h3>{selectedDuck.name[lang]}</h3>
                  <p className="role">{selectedDuck.role[lang]}</p>
                  <div className="duck-moods" aria-hidden="true">
                    {(['happy', 'curious', 'shocked', 'sly'] as const).map((e) => <img key={e} src={`${BASE}ducks/${selectedDuck.expressions[e]}`} alt="" loading="lazy" />)}
                  </div>
                </div>
              </article>
              <div className="duck-roster" role="radiogroup" aria-label={u('chooseCompanion', lang)}>
                <p className="roster-label">{u('crew', lang)} · {DUCKS.length}</p>
                {DUCKS.map((d) => (
                  <button key={d.id} role="radio" aria-checked={duck === d.id} aria-label={`${d.name[lang]} — ${d.role[lang]}`} className={`duck-card ${duck === d.id ? 'on' : ''}`} onClick={() => setDuck(d.id)} style={{ ['--duck-bg' as string]: d.bg }}>
                    <span className="duck-thumb"><img src={`${BASE}ducks/${d.expressions.happy}`} alt="" loading="lazy" /></span>
                    <span className="duck-meta"><strong>{d.name[lang]}</strong><small>{d.role[lang]}</small></span>
                    {duck === d.id && <span className="duck-check" aria-hidden="true">✓</span>}
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
            <form className="id-card" onSubmit={(e) => { e.preventDefault(); setPlayer(player.trim()); setScreen('build'); }}>
              <div className="id-head"><img src={`${BASE}brand/bsc-logo-white.png`} alt="" /><span>{u('researcherCard', lang)}</span><span className="id-no" dir="ltr">BSC-{String(data.runs.length + 1).padStart(3, '0')}</span></div>
              <label className="id-field">
                <input className="text-in" maxLength={24} value={player} placeholder={t('namePlaceholder', lang)} aria-label={t('namePlaceholder', lang)} onChange={(e) => setPlayer(e.target.value)} autoFocus enterKeyHint="next" />
              </label>
              <div className="id-preview">
                <img src={`${BASE}ducks/${selectedDuck.expressions.happy}`} alt="" />
                <p><b>{player.trim() || u('unnamed', lang)}</b> {u('joining', lang)} <b className="gold">{selectedDuck.name[lang]}</b></p>
              </div>
              <p className="id-hint">{u('enterHint', lang)}</p>
            </form>
            <footer className="screen-foot"><Btn variant="ghost" onClick={() => setScreen('duck')}>{t('back', lang)}</Btn><Btn onClick={() => { setPlayer(player.trim()); setScreen('build'); }}>{t('next', lang)}</Btn></footer>
          </section>
        )}

        {screen === 'build' && <Builder lang={lang} value={creature} onChange={setCreature} onBack={() => setScreen('player')} onNext={() => setScreen('cname')} />}
        {screen === 'cname' && <NameCreature lang={lang} value={creature} onChange={setCreature} onBack={() => setScreen('build')} onNext={() => setScreen('mode')} />}

        {screen === 'mode' && (
          <section className="screen mode-select">
            <header className="screen-head"><p className="step">05</p><h2>{t('chooseMode', lang)}</h2><p className="hint">{u('modeHint', lang)}</p></header>
            <div className="mode-options">
              <div className="seg" role="radiogroup" aria-label={r('length', lang)}>
                <span className="seg-label">{r('length', lang)}</span>
                {(['quick', 'full'] as const).map((k) => <button key={k} role="radio" aria-checked={len === k} className={len === k ? 'on' : ''} onClick={() => setLen(k)}>{r(k, lang)}</button>)}
              </div>
              <div className="seg" role="radiogroup" aria-label={r('tone', lang)}>
                <span className="seg-label">{r('tone', lang)}</span>
                {(['balanced', 'light', 'mystery', 'surprise'] as const).map((k) => <button key={k} role="radio" aria-checked={tone === k} className={tone === k ? 'on' : ''} onClick={() => setTone(k)}>{k === 'surprise' ? '✨ ' : ''}{r(k, lang)}</button>)}
              </div>
            </div>
            <div className="mode-grid">
              <button className="mode-card classic" onClick={() => begin('classic')}>
                <PaintedScene biome="forest" props={[]} seed={11} reduced plate={plateUrl('forest-signal-tree')} />
                <div className="mode-brand"><Logos /><span>{u('bscOriginal', lang)}</span></div>
                <div className="mode-text">
                  <span className="kicker">{u('land', lang)}</span>
                  <strong>{t('classic', lang)}</strong>
                  <span className="mode-desc">{t('classicDesc', lang)}</span>
                  <span className="mode-facts"><i>{u(len === 'quick' ? 'classicScenesQ' : 'classicScenes', lang)}</i><i>{u('classicPlaces', lang)}</i><i>{u('fourChoices', lang)}</i></span>
                  <span className="mode-cta">{u('begin', lang)} <b aria-hidden="true">{lang === 'ar' ? '←' : '→'}</b></span>
                </div>
              </button>
              <button className="mode-card marine" onClick={() => begin('marine')}>
                <PaintedScene biome="midnight" props={['angler']} seed={12} reduced plate={plateUrl('midnight-angler')} />
                <div className="mode-brand"><Logos marine /><span>{u('collabWith', lang)}</span></div>
                <div className="mode-text">
                  <span className="kicker sea">{u('sea', lang)}</span>
                  <strong>{t('marine', lang)}</strong>
                  <span className="mode-desc">{t('marineDesc', lang)}</span>
                  <span className="mode-facts"><i>{u(len === 'quick' ? 'marineScenesQ' : 'marineScenes', lang)}</i><i className="journey">{u('marineJourney', lang)}</i><i>{u('fourChoices', lang)}</i></span>
                  <span className="mode-cta">{u('begin', lang)} <b aria-hidden="true">{lang === 'ar' ? '←' : '→'}</b></span>
                </div>
              </button>
            </div>
            <footer className="screen-foot"><Btn variant="ghost" onClick={() => setScreen('cname')}>{t('back', lang)}</Btn></footer>
          </section>
        )}

        {screen === 'play' && game && <Play game={game} setGame={updateGame} settings={data.settings} lang={lang} onQuit={quit} legendsSeen={data.legendsSeen} onPassport={() => setPassport(true)}
            onSighting={(id) => setData((d) => (d.legendsSeen.includes(id) ? d : { ...d, legendsSeen: [...d.legendsSeen, id] }))} />}
        {screen === 'ending' && game && ending && (
          <EndingScreen game={game} ending={ending} lang={lang} reduced={reduced} unlocked={unlocked} onPassport={() => setPassport(true)} onJournal={() => setScreen('journal')}
            onReplay={() => begin(game.mode, game.creature)}
            onNew={() => { setCreature(randomCreature(new Rng(newSeed()), lang)); setScreen('build'); }} />
        )}
      </main>

      {screen !== 'play' && <footer className="credit">{t('credit', lang)}</footer>}

      {passport && game && <PassportView game={game} lang={lang} plate={(() => { const p = runPlate(game); return p ? plateUrl(p) : null; })()} onClose={() => setPassport(false)} />}
      {askNew && (
        <div className="modal" role="alertdialog" aria-modal="true" aria-label={r('nvTitle', lang)} onClick={() => setAskNew(false)}>
          <div className="settings" onClick={(e) => e.stopPropagation()}>
            <h2>{r('nvTitle', lang)}</h2>
            <p className="lead">{r('nvBody', lang)}</p>
            <div className="title-actions"><Btn onClick={doNewVisitor}>{r('nvYes', lang)}</Btn><Btn variant="ghost" onClick={() => setAskNew(false)}>{t('no', lang)}</Btn></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}

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
            <Btn variant="ghost" onClick={() => { setSettingsOpen(false); setAskNew(true); }}>↺ {r('newVisitor', lang)}</Btn>
            <Btn onClick={() => setSettingsOpen(false)}>{t('close', lang)}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
