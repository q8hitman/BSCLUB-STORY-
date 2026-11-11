import { useMemo } from 'react';
import { creatureSvg, FEELING_EXPRESSION } from '../art/creatureSvg';
import { condition, FEELING_LABEL, MARK_LABEL } from '../engine/condition';
import { MAX_ENERGY } from '../engine/story';
import type { GameState, Lang } from '../engine/types';
import { SLOT_LABEL, t } from '../i18n';
import { derive } from '../engine/creature';
import { SLOTS } from '../engine/types';
import type { ZoomInfo } from './common';
import { u } from './uiText';

/** The player's hybrid beside the scene: portrait with visible marks, feeling, condition, traits, reaction. */
export function CreaturePanel({ game, lang, onOpen }: { game: GameState; lang: Lang; onOpen?: (z: ZoomInfo) => void }) {
  const c = useMemo(() => condition(game), [game]);
  // same creature, drawn with the face/posture of its current feeling and the marks of the journey painted on it
  const svg = useMemo(() => creatureSvg(game.creature, { expression: FEELING_EXPRESSION[c.feeling] ?? 'neutral', marks: c.marks, idPrefix: 'cpanel' }), [game.creature, c.feeling, c.marks.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = () => {
    const d = derive(game.creature); const ar = lang === 'ar';
    onOpen?.({
      svg: creatureSvg(game.creature, { expression: FEELING_EXPRESSION[c.feeling] ?? 'neutral', marks: c.marks, idPrefix: 'czoom' }),
      kicker: u('yourCreature', lang), title: game.creature.name,
      tags: [FEELING_LABEL[c.feeling][lang], ...c.marks.map((m) => MARK_LABEL[m][lang])],
      lines: [{ text: c.reaction[lang] }, ...SLOTS.map((s) => ({ label: `${SLOT_LABEL[s][lang]}: `, text: `${d.parts[s].name[lang]} ${ar ? '—' : '—'} ${d.parts[s].desc[lang]}` }))],
    });
  };
  return (
    <aside className={`creature-panel tappable feel-${c.feeling}`} aria-label={game.creature.name} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === 'Enter') open(); }}>
      <div className="cp-portrait">
        <div className="cp-art specimen" dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="zoom-hint" aria-hidden="true">🔍</span>
      </div>
      <div className="cp-info">
        <span className="cp-kicker">{u('yourCreature', lang)}</span>
        <div className="cp-headline">
          <b className="cp-name">{game.creature.name}</b>
          <span className="cp-feel">{FEELING_LABEL[c.feeling][lang]}</span>
        </div>
        <div className="cp-energy-row">
          <small>{t('energy', lang)}</small>
          <span className="cp-energy" aria-label={`${c.energy}/${MAX_ENERGY}`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <i key={i} className={i < c.energy ? 'on' : ''} />)}</span>
        </div>
        {c.marks.length > 0 && <span className="cp-marks">{c.marks.map((m) => <em key={m}>{MARK_LABEL[m][lang]}</em>)}</span>}
        <span className="cp-traits">{c.traits.map((tr) => <em key={tr.slot} className={c.highlight === tr.slot ? 'hl' : ''}>{tr.name[lang]}</em>)}</span>
        <p className="cp-react">{c.reaction[lang]}</p>
      </div>
    </aside>
  );
}
