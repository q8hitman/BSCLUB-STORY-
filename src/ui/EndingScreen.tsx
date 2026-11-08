import { useEffect, useState } from 'react';
import { PART_BY_ID } from '../content/parts';
import { SLOTS, type Ending, type GameState, type Lang } from '../engine/types';
import { renderShareCard } from '../share/shareCard';
import { t } from '../i18n';
import { Btn, CaptureCreature, CreatureArt, Logos } from './common';
import { PaintedScene } from './Play';
import { platesForRun, plateUrl } from '../art/plates';
import { BEAT_BY_ID } from '../engine/story';

const TONE: Record<Ending['tone'], { en: string; ar: string }> = {
  heroic: { en: 'Heroic', ar: 'بطولية' }, comedic: { en: 'Comedic', ar: 'كوميدية' }, bittersweet: { en: 'Bittersweet', ar: 'حلوة ومُرّة' },
  mysterious: { en: 'Mysterious', ar: 'غامضة' }, scientific: { en: 'Scientific', ar: 'علمية' }, wholesome: { en: 'Wholesome', ar: 'دافية' },
};

export function EndingScreen({ game, ending, lang, reduced, onNew, onReplay }: { game: GameState; ending: Ending; lang: Lang; reduced: boolean; onNew: () => void; onReplay: () => void }) {
  const last = game.plan.beats[game.plan.beats.length - 1];
  const endPlate = platesForRun(game, (i) => BEAT_BY_ID[game.plan.beats[i].template]?.kind ?? null, game.plan.beats.length - 1).filter(Boolean).pop() ?? null;
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
    <section className="screen ending">
      <PaintedScene biome={last.biome} props={[]} seed={game.seed} reduced={reduced} className="backdrop" plate={endPlate ? plateUrl(endPlate.id) : null} />
      <div className="ending-card">
        <span className="tag">{t('endingTitle', lang)} · {TONE[ending.tone][lang]}</span>
        <CreatureArt creature={game.creature} className="specimen big" />
        <h2 className="ending-title">{ending.title[lang]}</h2>
        <p className="ending-name">{game.creature.name}{game.player ? ` · ${game.player}` : ''}</p>
        <p className="summary">{ending.summary[lang]}</p>
        <p className="epilogue">{ending.epilogue[lang]}</p>
        <ul className="chips">{SLOTS.map((s) => <li key={s}>{PART_BY_ID[(game.creature as unknown as Record<string, string>)[s]].name[lang]}</li>)}</ul>
        <ul className="highlights">{ending.highlights.map((h, i) => <li key={i} className={i < 2 ? 'stat' : 'sci'}>{h[lang]}</li>)}</ul>
        <div className="ending-credits">
          <Logos marine={game.mode === 'marine'} />
          {game.mode === 'marine' && <p className="credit-marine">{lang === 'ar' ? 'بالتعاون مع نادي علوم البحار' : 'In collaboration with the Marine Science Club'}</p>}
          <p className="designer">تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية</p>
        </div>
      </div>
      <div className="share">
        <CaptureCreature creature={game.creature} lang={lang} />
        <label className="check"><input type="checkbox" checked={showName} onChange={(e) => { setShowName(e.target.checked); setPng(null); }} /> {t('showName', lang)}</label>
        {!png && <Btn onClick={make} disabled={busy}>{busy ? t('generating', lang) : t('shareCard', lang)}</Btn>}
        {err && <p className="err">{err}</p>}
        {png && (
          <>
            <img className="card-preview" src={png.url} alt={ending.title[lang]} />
            <a className="btn btn-primary" href={png.url} download={fileName}>{t('shareCard', lang)}</a>
            {canShare && <Btn variant="ghost" onClick={() => navigator.share({ files: [new File([png.blob], fileName, { type: 'image/png' })], title: ending.title[lang] }).catch(() => {})}>{t('shareNative', lang)}</Btn>}
          </>
        )}
      </div>
      <footer className="screen-foot">
        <Btn variant="ghost" onClick={onReplay}>{t('sameCreature', lang)}</Btn>
        <Btn onClick={onNew}>{t('playAgain', lang)}</Btn>
      </footer>
    </section>
  );
}
