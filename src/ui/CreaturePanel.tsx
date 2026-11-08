import { useMemo, useState } from 'react';
import { creatureSvg, FEELING_EXPRESSION } from '../art/creatureSvg';
import { condition, FEELING_LABEL, MARK_LABEL } from '../engine/condition';
import { MAX_ENERGY } from '../engine/story';
import type { GameState, Lang } from '../engine/types';
import { t } from '../i18n';
import { u } from './uiText';

/** The player's hybrid beside the scene: portrait with visible marks, feeling, condition, traits, reaction. */
export function CreaturePanel({ game, lang }: { game: GameState; lang: Lang }) {
  const c = useMemo(() => condition(game), [game]);
  // same creature, drawn with the face/posture of its current feeling and the marks of the journey painted on it
  const svg = useMemo(() => creatureSvg(game.creature, { expression: FEELING_EXPRESSION[c.feeling] ?? 'neutral', marks: c.marks, idPrefix: 'cpanel' }), [game.creature, c.feeling, c.marks.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false);
  return (
    <aside className={`creature-panel feel-${c.feeling} ${open ? 'open' : ''}`} aria-label={game.creature.name} onClick={() => setOpen((v) => !v)}>
      <div className="cp-portrait">
        <div className="cp-art specimen" dangerouslySetInnerHTML={{ __html: svg }} />
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
