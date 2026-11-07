import { useEffect, useState } from 'react';
import { PART_BY_ID } from '../content/parts';
import { SLOTS, type Ending, type GameState, type Lang } from '../engine/types';
import { renderShareCard } from '../share/shareCard';
import { t } from '../i18n';
import { Btn, CreatureArt } from './common';

const TONE: Record<Ending['tone'], { en: string; ar: string }> = {
  heroic: { en: 'Heroic', ar: 'بطولية' }, comedic: { en: 'Comedic', ar: 'كوميدية' }, bittersweet: { en: 'Bittersweet', ar: 'حلوة ومُرّة' },
  mysterious: { en: 'Mysterious', ar: 'غامضة' }, scientific: { en: 'Scientific', ar: 'علمية' }, wholesome: { en: 'Wholesome', ar: 'دافية' },
};

export function EndingScreen({ game, ending, lang, onNew, onReplay }: { game: GameState; ending: Ending; lang: Lang; onNew: () => void; onReplay: () => void }) {
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
      <div className="card ending-card">
        <span className="tag">{t('endingTitle', lang)} · {TONE[ending.tone][lang]}</span>
        <CreatureArt creature={game.creature} className="bob big" />
        <h2 className="ending-title">{ending.title[lang]}</h2>
        <p className="ending-name">{game.creature.name}{game.player ? ` · ${game.player}` : ''}</p>
        <p className="summary">{ending.summary[lang]}</p>
        <p className="epilogue">{ending.epilogue[lang]}</p>
        <ul className="chips">{SLOTS.map((s) => <li key={s}>{PART_BY_ID[(game.creature as unknown as Record<string, string>)[s]].name[lang]}</li>)}</ul>
        <ul className="highlights">{ending.highlights.map((h, i) => <li key={i}>{i < 2 ? '⭐ ' : '🔬 '}{h[lang]}</li>)}</ul>
        {game.mode === 'marine' && <p className="credit-marine">{lang === 'ar' ? 'بالتعاون مع نادي علوم البحار' : 'In collaboration with the Marine Science Club'}</p>}
      </div>
      <div className="card share">
        <label className="check"><input type="checkbox" checked={showName} onChange={(e) => { setShowName(e.target.checked); setPng(null); }} /> {t('showName', lang)}</label>
        {!png && <Btn onClick={make} disabled={busy}>{busy ? t('generating', lang) : `🖼️ ${t('shareCard', lang)}`}</Btn>}
        {err && <p className="err">{err}</p>}
        {png && (
          <>
            <img className="card-preview" src={png.url} alt={ending.title[lang]} />
            <a className="btn btn-primary" href={png.url} download={fileName}>⬇️ {t('shareCard', lang)}</a>
            {canShare && <Btn variant="ghost" onClick={() => navigator.share({ files: [new File([png.blob], fileName, { type: 'image/png' })], title: ending.title[lang] }).catch(() => {})}>📤 {t('shareNative', lang)}</Btn>}
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
