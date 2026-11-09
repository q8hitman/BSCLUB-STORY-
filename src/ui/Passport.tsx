import { useEffect, useRef, useState } from 'react';
import type { GameState, Lang } from '../engine/types';
import { renderPassport, type PassportContent } from '../share/passport';
import { saveBlob } from '../share/shareCard';
import { Btn } from './common';

const T = {
  title: { en: 'BSC Explorer Passport', ar: 'جواز مستكشف BSC' },
  making: { en: 'Printing your passport…', ar: 'جارٍ إصدار الجواز…' },
  showName: { en: 'Show my display name on the card', ar: 'إظهار اسمي على البطاقة' },
  full: { en: 'Fullscreen', ar: 'ملء الشاشة' },
  save: { en: 'Save as PNG', ar: 'حفظ كصورة PNG' },
  close: { en: 'Close', ar: 'إغلاق' },
  how: { en: 'Photograph the card or scan its QR code with your phone camera. The adventure opens in the browser exactly where you are now — no account, no app.', ar: 'صوّر البطاقة أو امسح رمزها بكاميرا جوالك، فتُفتح المغامرة في المتصفح من النقطة نفسها التي وصلت إليها، دون حساب أو تطبيق.' },
  later: { en: 'Made more progress? Open the passport again for an updated card.', ar: 'تقدّمت أكثر؟ افتح الجواز مرة أخرى لتحصل على بطاقة محدَّثة.' },
  privacy: { en: 'The QR code is the key to this adventure: anyone who scans it can open it. It holds no account details, only the game progress and the display name you chose.', ar: 'رمز QR هو مفتاح هذه المغامرة، وكل من يمسحه يستطيع فتحها. لا يحتوي على أي بيانات حساب، بل على تقدّم اللعبة والاسم الظاهر الذي اخترته فقط.' },
  aiDropped: { en: 'The AI wording of the paragraph on screen was too long to fit in the QR. Your decisions and progress are all included; that one paragraph will appear in its original wording.', ar: 'كانت صياغة الذكاء الاصطناعي للفقرة الحالية أطول من أن يتّسع لها الرمز. قراراتك وتقدّمك محفوظة كلها، وستظهر تلك الفقرة وحدها بصياغتها الأصلية.' },
  err: { en: 'Could not draw the card on this browser.', ar: 'تعذّر رسم البطاقة في هذا المتصفح.' },
};

export function PassportView({ game, lang, plate, onClose }: { game: GameState; lang: Lang; plate: string | null; onClose: () => void }) {
  const [showName, setShowName] = useState(!!game.player.trim());
  const [card, setCard] = useState<{ url: string; blob: Blob; c: PassportContent } | null>(null);
  const [err, setErr] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true; let made: string | null = null;
    setCard(null); setErr(false);
    renderPassport(game, lang, showName, plate).then(({ blob, content }) => {
      if (!alive) return; made = URL.createObjectURL(blob); setCard({ url: made, blob, c: content });
    }).catch(() => alive && setErr(true));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [game, lang, showName, plate]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const full = () => { const el = box.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => {}); };
  const file = `bsc-passport-${game.creature.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;

  return (
    <div className="passport-modal" role="dialog" aria-modal="true" aria-label={T.title[lang]}>
      <div className="passport-stage" ref={box} onClick={() => document.fullscreenElement && void document.exitFullscreen()}>
        {card ? <img className="passport-card" src={card.url} alt={`${T.title[lang]} — ${game.creature.name}`} data-qr-url={card.c.url} />
          : <div className="passport-loading">{err ? T.err[lang] : T.making[lang]}</div>}
      </div>
      <aside className="passport-side">
        <p className="kicker">{T.title[lang]}</p>
        <p className="lead">{T.how[lang]}</p>
        <label className="check"><input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} disabled={!game.player.trim()} /> {T.showName[lang]}</label>
        <div className="passport-actions">
          <Btn onClick={full} disabled={!card}>{T.full[lang]} ⛶</Btn>
          <Btn variant="ghost" onClick={() => card && void saveBlob(card.blob, file, T.title[lang])} disabled={!card}>{T.save[lang]}</Btn>
          <Btn variant="ghost" onClick={onClose}>{T.close[lang]}</Btn>
        </div>
        {card?.c.aiDropped && <p className="notice warn">{T.aiDropped[lang]}</p>}
        <p className="privacy">🔑 {T.privacy[lang]}</p>
        <p className="hint">{T.later[lang]}</p>
      </aside>
    </div>
  );
}
