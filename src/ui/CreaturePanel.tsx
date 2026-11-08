import { useMemo, useState } from 'react';
import { creatureSvg } from '../art/creatureSvg';
import { condition, FEELING_LABEL, MARK_LABEL } from '../engine/condition';
import { MAX_ENERGY } from '../engine/story';
import type { GameState, Lang } from '../engine/types';

/** The player's hybrid beside the scene: portrait with visible marks, feeling, condition, traits, reaction. */
export function CreaturePanel({ game, lang }: { game: GameState; lang: Lang }) {
  const c = useMemo(() => condition(game), [game]);
  const svg = useMemo(() => creatureSvg(game.creature), [game.creature]);
  // the creature's own silhouette masks the mark overlays, so mud/frost/glow sit ON the creature
  const mask = useMemo(() => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`, [svg]);
  const [open, setOpen] = useState(false);
  return (
    <aside className={`creature-panel feel-${c.feeling} ${open ? 'open' : ''}`} aria-label={game.creature.name} onClick={() => setOpen((v) => !v)}>
      <div className="cp-portrait">
        <div className="cp-art specimen" dangerouslySetInnerHTML={{ __html: svg }} />
        {c.marks.map((m) => <div key={m} className={`cp-mark mark-${m}`} style={{ WebkitMaskImage: mask, maskImage: mask }} aria-hidden="true" />)}
      </div>
      <div className="cp-info">
        <b className="cp-name">{game.creature.name}</b>
        <span className="cp-feel">{FEELING_LABEL[c.feeling][lang]}</span>
        <span className="cp-energy" aria-label={`${c.energy}/${MAX_ENERGY}`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <i key={i} className={i < c.energy ? 'on' : ''} />)}</span>
        {c.marks.length > 0 && <span className="cp-marks">{c.marks.map((m) => <em key={m}>{MARK_LABEL[m][lang]}</em>)}</span>}
        <span className="cp-traits">{c.traits.map((t) => <em key={t.slot} className={c.highlight === t.slot ? 'hl' : ''}>{t.name[lang]}</em>)}</span>
        <p className="cp-react">{c.reaction[lang]}</p>
      </div>
    </aside>
  );
}
