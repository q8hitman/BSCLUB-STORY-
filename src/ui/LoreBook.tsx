import { useState } from 'react';
import { LEGENDS, type Legend } from '../content/legends';
import { BIOMES } from '../content/world';
import type { Lang } from '../engine/types';
import { Btn } from './common';

const T = {
  title: { en: 'Book of Legends', ar: 'كتاب الأساطير' },
  intro: { en: 'Stories whispered by divers, herders, rangers and club members. Every creature here is FICTION, invented for BSC BioLab — but you might glimpse one on an expedition.', ar: 'حكاياتٌ يتهامس بها الغوّاصون والرعاة والحرّاس وأعضاء النادي. كل كائن هنا خياليّ ابتُكر للعبة BSC BioLab… لكنك قد تلمح واحداً منها في رحلتك.' },
  land: { en: 'Land legends', ar: 'أساطير البر' },
  sea: { en: 'Sea legends', ar: 'أساطير البحر' },
  signs: { en: 'Signs', ar: 'العلامات' },
  rule: { en: 'The old advice', ar: 'وصية الأولين' },
  seen: { en: 'Sighted', ar: 'شوهد' },
  unseen: { en: 'Not yet sighted', ar: 'لم يُشاهَد بعد' },
  where: { en: 'Haunts', ar: 'أماكنه' },
  fiction: { en: 'Fiction', ar: 'خيال' },
  back: { en: 'Back', ar: 'رجوع' },
};

function LegendCard({ lg, lang, seen }: { lg: Legend; lang: Lang; seen: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`legend-card ${seen ? 'seen' : ''} ${open ? 'open' : ''}`}>
      <button className="legend-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <img src={`${import.meta.env.BASE_URL}scenes/${lg.art}.webp`} alt={lg.name[lang]} loading="lazy" width={672} height={384} />
        <div className="legend-titles">
          <span className="tag fiction-tag">{T.fiction[lang]}</span>
          <h3>{lg.name[lang]}</h3>
          <p className="epithet">{lg.epithet[lang]}</p>
          <p className={`sighted ${seen ? 'yes' : ''}`}>{seen ? T.seen[lang] : T.unseen[lang]}</p>
        </div>
      </button>
      {open && (
        <div className="legend-body">
          <p className="lore">{lg.lore[lang]}</p>
          <p><b>{T.signs[lang]}:</b> {lg.signs[lang]}</p>
          <p className="rule"><b>{T.rule[lang]}:</b> «{lg.rule[lang]}»</p>
          <p className="where"><b>{T.where[lang]}:</b> {lg.biomes.map((b) => BIOMES[b].name[lang]).join(lang === 'ar' ? '، ' : ', ')}</p>
        </div>
      )}
    </article>
  );
}

export function LoreBook({ lang, seen, onBack }: { lang: Lang; seen: string[]; onBack: () => void }) {
  return (
    <section className="screen lore-book">
      <header className="screen-head">
        <h2>{T.title[lang]}</h2>
        <p className="hint" dangerouslySetInnerHTML={{ __html: T.intro[lang].replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }} />
        <p className="hint">{seen.length}/{LEGENDS.length} {T.seen[lang]}</p>
      </header>
      {(['land', 'sea'] as const).map((realm) => (
        <div key={realm} className="legend-group">
          <h3 className="realm">{T[realm][lang]}</h3>
          <div className="legend-grid">{LEGENDS.filter((l) => l.realm === realm).map((lg) => <LegendCard key={lg.id} lg={lg} lang={lang} seen={seen.includes(lg.id)} />)}</div>
        </div>
      ))}
      <footer className="screen-foot"><Btn variant="ghost" onClick={onBack}>{T.back[lang]}</Btn></footer>
    </section>
  );
}
