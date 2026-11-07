import { useEffect, useMemo, useRef, useState } from 'react';
import { renderCreaturePortrait, saveBlob } from '../share/shareCard';
import type { Lang } from '../engine/types';
import { creatureSvg } from '../art/creatureSvg';
import type { CreatureConfig } from '../engine/types';

export function CreatureArt({ creature, className = '', title }: { creature: CreatureConfig; className?: string; title?: string }) {
  const svg = useMemo(() => creatureSvg(creature), [creature]);
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

/** Club logos (original colours incl. black, white background removed, no glow — designer choice). The Marine Science Club logo only appears in Marine mode. */
export function Logos({ marine = false, className = '' }: { marine?: boolean; className?: string }) {
  return (
    <div className={`logos ${className}`}>
      <img src={`${import.meta.env.BASE_URL}brand/bsc-logo-transparent.png`} alt="Biological Sciences Club — Kuwait University" />
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
    <button className="btn btn-ghost capture" onClick={go} disabled={busy}>
      {busy ? (lang === 'ar' ? 'قاعدين نرسمه…' : 'Drawing…') : done ? (lang === 'ar' ? 'انحفظت ✓ — احفظ مرة ثانية' : 'Saved ✓ — save again') : (lang === 'ar' ? 'احفظ صورة مخلوقك (اختياري)' : 'Save a picture of your creature (optional)')}
    </button>
  );
}
