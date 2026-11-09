import { useMemo, useState } from 'react';
import { BESTIARY, type Animal } from '../content/bestiary';
import { DUCK_BY_ID } from '../content/ducks';
import { FIELD_NOTES } from '../content/duckRadio';
import { LEGENDS } from '../content/legends';
import { RARE, availableRare, rareArt } from '../content/rare';
import { BIOMES, FACT_BY_ID } from '../content/world';
import { animalArt } from '../art/animalArt';
import { plateUrl } from '../art/plates';
import { ACHIEVEMENTS, type Journal } from '../engine/journal';
import type { Lang } from '../engine/types';
import { Btn, CreatureArt } from './common';

const BASE = import.meta.env.BASE_URL;
type Tab = 'animals' | 'rare' | 'endings' | 'achievements' | 'notes' | 'facts';
const T = {
  title: { en: 'BSC Explorer Journal', ar: 'دفتر مستكشف BSC' },
  sub: { en: 'Everything you have met, finished and noticed on this device.', ar: 'كل ما قابلته وأنهيته ولاحظته على هذا الجهاز.' },
  animals: { en: 'Bestiary', ar: 'سجلّ الكائنات' }, rare: { en: 'Rare & legendary', ar: 'النادر والأسطوري' }, endings: { en: 'Endings', ar: 'معرض النهايات' },
  achievements: { en: 'Achievements', ar: 'الإنجازات' }, notes: { en: 'Field notes', ar: 'الملاحظات الميدانية' }, facts: { en: 'Discoveries', ar: 'الاكتشافات' },
  real: { en: 'Real animal', ar: 'حيوان حقيقي' }, fictional: { en: 'Fictional', ar: 'خيالي' }, fantasy: { en: 'Fantasy creature', ar: 'كائن خيالي' }, myth: { en: 'Myth-inspired', ar: 'مستوحى من الأساطير' }, legend: { en: 'Legend', ar: 'أسطورة' },
  unknown: { en: 'Not yet met', ar: 'لم تقابله بعد' }, firstSeen: { en: 'First met in', ar: 'أول لقاء في' },
  lives: { en: 'Lives in', ar: 'يعيش في' }, echo: { en: 'Real science behind it', ar: 'العلم الحقيقي وراءه' },
  noEndings: { en: 'Finish an adventure and its personal ending will be kept here.', ar: 'أنهِ مغامرة، وستُحفظ نهايتها الخاصة هنا.' },
  noNotes: { en: 'Companions share notes from their own science field during adventures.', ar: 'يشارك الرفقاء ملاحظاتٍ من تخصّصاتهم العلمية أثناء المغامرات.' },
  back: { en: 'Back', ar: 'رجوع' }, of: { en: 'of', ar: 'من' },
  device: { en: 'This journal lives on this device only. A Passport QR moves an adventure, not the whole journal.', ar: 'هذا الدفتر محفوظ على هذا الجهاز فقط. رمز الجواز ينقل مغامرة واحدة، لا الدفتر كله.' },
  found: { en: 'Discoveries', ar: 'الاكتشافات' }, met: { en: 'Animals met', ar: 'كائنات قابلتها' },
};
const date = (t: number, lang: Lang) => new Date(t).toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function AnimalCard({ a, lang, entry }: { a: Animal; lang: Lang; entry?: Journal['animals'][string] }) {
  const art = animalArt(a.id);
  const src = art && art.kind !== 'painter' ? art.src : null;
  const fact = a.fact ? FACT_BY_ID[a.fact]?.text[lang] : null;
  return (
    <article className={`j-card ${entry ? 'found' : 'locked'}`}>
      <div className="j-art">{entry && src ? <img src={src} alt={a.name[lang]} loading="lazy" /> : <span className="j-q" aria-hidden="true">?</span>}</div>
      <div className="j-body">
        <span className={`j-tag ${a.kind === 'real' ? 'real' : 'fiction'}`}>{a.kind === 'real' ? T.real[lang] : T.fictional[lang]}</span>
        <h3>{entry ? a.name[lang] : T.unknown[lang]}</h3>
        {entry && <>
          <p className="j-meta">{T.lives[lang]}: {a.biomes.map((b) => BIOMES[b].name[lang]).join('، ')}</p>
          {fact && <p className="j-fact">{fact}</p>}
          <p className="j-when">{T.firstSeen[lang]} «{entry.adventure[lang]}» · {date(entry.first, lang)}</p>
        </>}
      </div>
    </article>
  );
}

export function JournalScreen({ lang, journal, onBack }: { lang: Lang; journal: Journal; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('animals');
  const animals = useMemo(() => [...BESTIARY].sort((a, b) => Number(!!journal.animals[b.id]) - Number(!!journal.animals[a.id])), [journal]);
  const rare = useMemo(() => availableRare(), []);
  const facts = useMemo(() => [...new Set(journal.endings.flatMap((e) => e.discoveries))].filter((id) => FACT_BY_ID[id]), [journal]);
  const nAnimals = Object.keys(journal.animals).length;
  const nAch = Object.keys(journal.achievements).length;
  const tabs: [Tab, string][] = [
    ['animals', `${T.animals[lang]} ${nAnimals}/${BESTIARY.length}`],
    ['rare', `${T.rare[lang]} ${Object.keys(journal.rare).length + Object.keys(journal.legends).length}`],
    ['endings', `${T.endings[lang]} ${journal.endings.length}`],
    ['achievements', `${T.achievements[lang]} ${nAch}/${ACHIEVEMENTS.length}`],
    ['notes', `${T.notes[lang]} ${Object.keys(journal.notes).length}`],
    ['facts', `${T.facts[lang]} ${facts.length}`],
  ];
  return (
    <section className="screen journal">
      <header className="journal-head">
        <p className="kicker">BSC · {lang === 'ar' ? 'نادي العلوم البيولوجية' : 'Biological Sciences Club'}</p>
        <h2>{T.title[lang]}</h2>
        <p className="hint">{T.sub[lang]}</p>
        <div className="journal-tabs" role="tablist">
          {tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
        </div>
      </header>

      {tab === 'animals' && <div className="j-grid">{animals.map((a) => <AnimalCard key={a.id} a={a} lang={lang} entry={journal.animals[a.id]} />)}</div>}

      {tab === 'rare' && (
        <div className="j-grid">
          {rare.map((r) => { const e = journal.rare[r.id]; return (
            <article key={r.id} className={`j-card rare ${e ? 'found' : 'locked'}`}>
              <div className="j-art">{e ? <img src={plateUrl(rareArt(r.id))} alt={r.name[lang]} loading="lazy" /> : <span className="j-q" aria-hidden="true">✧</span>}</div>
              <div className="j-body">
                <span className={`j-tag ${r.kind}`}>{r.kind === 'real' ? T.real[lang] : r.kind === 'myth' ? T.myth[lang] : T.fantasy[lang]}</span>
                <h3>{e ? r.name[lang] : T.unknown[lang]}</h3>
                {e ? <><p className="j-meta">{T.lives[lang]}: {r.biomes.map((b) => BIOMES[b].name[lang]).join('، ')}</p><p className="j-fact"><b>{T.echo[lang]}:</b> {r.echo[lang]}</p><p className="j-when">{T.firstSeen[lang]} «{e.adventure[lang]}» · {date(e.first, lang)}</p></>
                  : <p className="j-meta">{lang === 'ar' ? 'يظهر نادراً، ولمن يملك الحواسّ المناسبة فقط.' : 'Shows itself rarely, and only to the right senses.'}</p>}
              </div>
            </article>
          ); })}
          {LEGENDS.map((lg) => { const e = journal.legends[lg.id]; return (
            <article key={lg.id} className={`j-card legend ${e ? 'found' : 'locked'}`}>
              <div className="j-art">{e ? <img src={`${BASE}scenes/${lg.art}.webp`} alt={lg.name[lang]} loading="lazy" /> : <span className="j-q" aria-hidden="true">☾</span>}</div>
              <div className="j-body"><span className="j-tag myth">{T.legend[lang]}</span><h3>{e ? lg.name[lang] : T.unknown[lang]}</h3>{e && <><p className="j-meta">{lg.epithet[lang]}</p><p className="j-when">{T.firstSeen[lang]} «{e.adventure[lang]}» · {date(e.first, lang)}</p></>}</div>
            </article>
          ); })}
          {rare.length < RARE.length && <p className="j-foot">{lang === 'ar' ? `${RARE.length - rare.length} كائنات أخرى بانتظار مراجعة رسوماتها.` : `${RARE.length - rare.length} more creatures are waiting for their art to be reviewed.`}</p>}
        </div>
      )}

      {tab === 'endings' && (journal.endings.length ? (
        <div className="j-endings">{[...journal.endings].reverse().map((e) => (
          <article key={e.key} className={`j-ending mode-${e.mode}`}>
            {e.plate && <img className="j-ending-bg" src={plateUrl(e.plate)} alt="" loading="lazy" />}
            <div className="j-ending-art"><CreatureArt creature={e.creature} expression="happy" /></div>
            <div className="j-body">
              <p className="kicker">{e.adventure[lang]} · {date(e.at, lang)}</p>
              <h3>{e.title[lang]}</h3>
              <p className="j-meta">{e.creature.name}{e.player ? ` · ${e.player}` : ''} · {DUCK_BY_ID[e.duck]?.name[lang]}</p>
              <p className="j-sum">{e.summary[lang]}</p>
              {(e.animals.length > 0 || e.discoveries.length > 0) && <p className="j-meta">🐾 {e.animals.length} · ✦ {e.discoveries.length}</p>}
            </div>
          </article>
        ))}</div>
      ) : <p className="j-empty">{T.noEndings[lang]}</p>)}

      {tab === 'achievements' && (
        <div className="j-ach">{ACHIEVEMENTS.map((a) => { const at = journal.achievements[a.id]; return (
          <article key={a.id} className={`ach ${at ? 'on' : ''}`}>
            <span className="ach-medal" aria-hidden="true">{at ? '★' : '☆'}</span>
            <div><h3>{a.title[lang]}</h3><p>{a.desc[lang]}</p>{at && <small>{date(at, lang)}</small>}</div>
          </article>
        ); })}</div>
      )}

      {tab === 'notes' && (Object.keys(journal.notes).length ? (
        <div className="j-notes">{Object.values(DUCK_BY_ID).map((d) => {
          const mine = FIELD_NOTES.filter((n) => n.duck === d.id);
          const got = mine.filter((n) => journal.notes[n.id]);
          return (
            <section key={d.id} className="j-duck">
              <header><img src={`${BASE}ducks/${d.expressions.curious}`} alt="" /><div><b>{d.name[lang]}</b><small>{d.role[lang]} · {got.length}/{mine.length}</small></div></header>
              <ul>{mine.map((n) => <li key={n.id} className={journal.notes[n.id] ? 'on' : ''}>{journal.notes[n.id] ? n.text[lang] : '· · ·'}</li>)}</ul>
            </section>
          );
        })}</div>
      ) : <p className="j-empty">{T.noNotes[lang]}</p>)}

      {tab === 'facts' && (facts.length ? <ul className="j-facts">{facts.map((id) => <li key={id}><span className="tag real">{lang === 'ar' ? 'علم حقيقي' : 'Real science'}</span> {FACT_BY_ID[id].text[lang]}</li>)}</ul>
        : <p className="j-empty">{T.noEndings[lang]}</p>)}

      <p className="j-device">{T.device[lang]}</p>
      <footer className="screen-foot"><Btn variant="ghost" onClick={onBack}>{T.back[lang]}</Btn></footer>
    </section>
  );
}
