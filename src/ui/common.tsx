import { useEffect, useMemo, useRef, useState } from 'react';
import { renderCreaturePortrait, saveBlob } from '../share/shareCard';
import type { Lang } from '../engine/types';
import { creatureSvg, type CreatureMark, type Expression } from '../art/creatureSvg';
import type { CreatureConfig } from '../engine/types';
import { u } from './uiText';

export function CreatureArt({ creature, className = '', title, expression = 'neutral', marks, crop }: { creature: CreatureConfig; className?: string; title?: string; expression?: Expression; marks?: CreatureMark[]; crop?: 'full' | 'face' }) {
  const mk = marks?.join(',') ?? '';
  const svg = useMemo(() => creatureSvg(creature, { expression, marks: mk ? (mk.split(',') as CreatureMark[]) : [], crop }), [creature, expression, mk, crop]);
  return <div className={`creature-art ${className}`} title={title} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Typewriter that respects text speed (0 = instant) and reduced motion. Click/tap completes. */
export function Typewriter({ text, speed, onDone, className = '' }: { text: string; speed: number; onDone?: () => void; className?: string }) {
  const [n, setN] = useState(speed <= 0 ? text.length : 0);
  const done = useRef(false);
  useEffect(() => { done.current = false; setN(speed <= 0 ? text.length : 0); }, [text, speed]);
  useEffect(() => {
    if (n >= text.length) { if (!done.current) { done.current = true; onDone?.(); } return; }
    // Reveal word by word: keeps Arabic letters joined and reads naturally in both languages.
    const delay = Math.max(12, 200 - speed * 1.9);
    const id = setTimeout(() => setN((x) => { const sp = text.indexOf(' ', x + 1); return sp === -1 ? text.length : sp; }), delay);
    return () => clearTimeout(id);
  }, [n, text, speed, onDone]);
  return (
    <p className={`typewriter ${className}`} onClick={() => setN(text.length)} aria-live="polite">
      <span>{text.slice(0, n)}</span>
      <span className="tw-rest" aria-hidden="true">{text.slice(n)}</span>
    </p>
  );
}

export function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'choice' }) {
  const { variant = 'primary', className = '', ...rest } = props;
  return <button {...rest} className={`btn btn-${variant} ${className}`} />;
}

/** Club logos on dark UI: the BSC logo uses its white-text version (designer-supplied direction) so it reads on dark backgrounds; no box, no glow. The Marine Science Club logo only appears in Marine mode. */
export function Logos({ marine = false, className = '' }: { marine?: boolean; className?: string }) {
  return (
    <div className={`logos ${className}`}>
      <img src={`${import.meta.env.BASE_URL}brand/bsc-logo-white.png`} alt="Biological Sciences Club — Kuwait University" />
      {marine && <><span className="logo-x" aria-hidden="true">×</span><img src={`${import.meta.env.BASE_URL}brand/marine-logo-transparent.png`} alt="Marine Science Club" /></>}
    </div>
  );
}


/** Optional: save a picture of the player's creature. */
export function CaptureCreature({ creature, lang }: { creature: CreatureConfig; lang: Lang }) {
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await saveBlob(await renderCreaturePortrait(creature, lang), `bsc-biolab-${creature.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`, creature.name); setDone(true); }
    finally { setBusy(false); }
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm capture" onClick={go} disabled={busy}>
      {busy ? u('drawing', lang) : done ? u('savedAgain', lang) : u('savePicture', lang)}
    </button>
  );
}

/** Soft ambient particles (spores, dust, bubbles or glowing specks). Pure CSS; hidden when motion is reduced. */
export function Particles({ kind = 'spores', count = 26 }: { kind?: 'spores' | 'dust' | 'bubbles' | 'specks'; count?: number }) {
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin((i + 1) * 9301 + n * 49297) + 1) / 2);
    return { left: `${(r(1) * 100).toFixed(1)}%`, delay: `${(-r(2) * 18).toFixed(1)}s`, dur: `${(12 + r(3) * 14).toFixed(1)}s`, size: `${(2 + r(4) * 4).toFixed(1)}px`, drift: `${((r(5) - 0.5) * 80).toFixed(0)}px`, o: (0.25 + r(6) * 0.6).toFixed(2) };
  }), [count]);
  return (
    <div className={`particles p-${kind}`} aria-hidden="true">
      {dots.map((d, i) => <i key={i} style={{ left: d.left, animationDelay: d.delay, animationDuration: d.dur, width: d.size, height: d.size, ['--drift' as string]: d.drift, ['--o' as string]: d.o }} />)}
    </div>
  );
}
