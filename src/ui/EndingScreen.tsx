import { useEffect, useState } from 'react';
import { PART_BY_ID } from '../content/parts';
import { SLOTS, type Ending, type GameState, type Lang } from '../engine/types';
import { renderShareCard } from '../share/shareCard';
import { t } from '../i18n';
import { Btn, CaptureCreature, CreatureArt, Logos } from './common';
import { TONE_EXPRESSION } from '../share/shareCard';
import { PaintedScene } from './Play';
import { platesForRun, plateUrl } from '../art/plates';
import { BEAT_BY_ID } from '../engine/story';
import { u } from './uiText';

const TONE: Record<Ending['tone'], { en: string; ar: string }> = {
  heroic: { en: 'Heroic', ar: 'بطولية' }, comedic: { en: 'Comedic', ar: 'كوميدية' }, bittersweet: { en: 'Bittersweet', ar: 'حلوة ومُرّة' },
  mysterious: { en: 'Mysterious', ar: 'غامضة' }, scientific: { en: 'Scientific', ar: 'علمية' }, wholesome: { en: 'Wholesome', ar: 'دافية' },
};

export function EndingScreen({ game, ending, lang, reduced, onNew, onReplay }: { game: GameState; ending: Ending; lang: Lang; reduced: boolean; onNew: () => void; onReplay: () => void }) {
  const last = game.plan.beats[game.plan.beats.length - 1];
  const tonePlate = game.mode === 'marine' && (ending.tone === 'mysterious' || ending.tone === 'bittersweet') ? 'ending-deep-farewell'
    : ending.tone === 'comedic' || ending.tone === 'scientific' ? 'ending-lab-celebration'
    : game.mode === 'classic' && (ending.tone === 'heroic' || ending.tone === 'wholesome' || ending.tone === 'mysterious') ? 'ending-sunrise-wild' : null;
  const runPlate = platesForRun(game, (i) => BEAT_BY_ID[game.plan.beats[i].template]?.kind ?? null, game.plan.beats.length - 1).filter(Boolean).pop() ?? null;
  const [showName, setShowName] = useState(!!game.player);
  const [busy, setBusy] = useState(false);
  const [png, setPng] = useState<{ url: string; blob: Blob } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => () => { if (png) URL.revokeObjectURL(png.url); }, [png]);

  const make = async () => {
    setBusy(true); setErr(null);
    try {
      const blob = await renderShareCard(game, ending, lang, showName);
      if (png) URL.revokeObjectURL(png.url);
      setPng({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  };
  const fileName = `bsc-biolab-${game.creature.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare && png && navigator.canShare({ files: [new File([png.blob], fileName, { type: 'image/png' })] });

  return (
    <section className={`screen ending mode-${game.mode}`}>
      <PaintedScene biome={last.biome} props={[]} seed={game.seed} reduced={reduced} className="backdrop" plate={tonePlate ? plateUrl(tonePlate) : runPlate ? plateUrl(runPlate.id) : null} />
      <article className="ending-card">
        <header className="ending-head">
          <span className="kicker">{u('expedition', lang)} · {game.mode === 'marine' ? t('marine', lang) : t('classic', lang)}</span>
          <span className="tag">{t('endingTitle', lang)} · {TONE[ending.tone][lang]}</span>
          <h2 className="ending-title">{ending.title[lang]}</h2>
        </header>
        <div className="ending-body">
          <aside className="ending-specimen">
            <div className="stage">
              <div className="stage-light" aria-hidden="true" />
              <div className="stage-creature"><CreatureArt creature={game.creature} className="specimen" expression={TONE_EXPRESSION[ending.tone] ?? 'happy'} /></div>
              <div className="stage-pedestal" aria-hidden="true" />
            </div>
            <p className="ending-name"><b>{game.creature.name}</b>{game.player ? <span>{game.player}</span> : null}</p>
            <ul className="chips">{SLOTS.map((s) => { const p = PART_BY_ID[(game.creature as unknown as Record<string, string>)[s]]; return p ? <li key={s}>{p.name[lang]}</li> : null; })}</ul>
          </aside>
          <div className="ending-story">
            <p className="summary">{ending.summary[lang]}</p>
            <p className="epilogue">{ending.epilogue[lang]}</p>
            <ul className="highlights">{ending.highlights.map((h, i) => <li key={i} className={i < 2 ? 'stat' : 'sci'}>{h[lang]}</li>)}</ul>
          </div>
        </div>
        <footer className="ending-credits">
          <Logos marine={game.mode === 'marine'} />
          {game.mode === 'marine' && <p className="credit-marine">{t('collab', lang)}</p>}
          <p className="designer">تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية</p>
        </footer>
      </article>

      <div className="ending-actions">
        <div className="share card">
          <p className="kicker">{u('keep', lang)}</p>
          <div className="share-row">
            <CaptureCreature creature={game.creature} lang={lang} />
            {!png && <Btn className="btn-sm" onClick={make} disabled={busy}>{busy ? t('generating', lang) : t('shareCard', lang)}</Btn>}
          </div>
          <label className="check"><input type="checkbox" checked={showName} onChange={(e) => { setShowName(e.target.checked); setPng(null); }} /> {t('showName', lang)}</label>
          {err && <p className="err">{err}</p>}
          {png && (
            <div className="share-result">
              <img className="card-preview" src={png.url} alt={ending.title[lang]} />
              <div className="share-row">
                <a className="btn btn-primary btn-sm" href={png.url} download={fileName}>{t('shareCard', lang)}</a>
                {canShare && <Btn variant="ghost" className="btn-sm" onClick={() => navigator.share({ files: [new File([png.blob], fileName, { type: 'image/png' })], title: ending.title[lang] }).catch(() => {})}>{t('shareNative', lang)}</Btn>}
              </div>
            </div>
          )}
        </div>
        <div className="replay">
          <Btn variant="ghost" onClick={onReplay}>{t('sameCreature', lang)}</Btn>
          <Btn onClick={onNew}>{t('playAgain', lang)}</Btn>
        </div>
      </div>
    </section>
  );
}
