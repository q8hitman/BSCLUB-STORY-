import { useMemo, useState } from 'react';
import { HUES, partsFor } from '../content/parts';
import { derive, randomCreature, randomName } from '../engine/creature';
import { Rng, newSeed } from '../engine/rng';
import { SLOTS, STAT_KEYS, type CreatureConfig, type Lang, type Slot } from '../engine/types';
import { SLOT_LABEL, STAT_LABEL, t } from '../i18n';
import { Btn, CaptureCreature, CreatureArt } from './common';
import type { Expression } from '../art/creatureSvg';

const PREVIEW_MOODS: Expression[] = ['neutral', 'curious', 'happy', 'frightened', 'suspicious', 'tired'];
import PART_ART_LIST from '../content/part-art.json';
import { CAP_LABEL, PART_SOURCE } from '../content/partSources';

/** Painted picture of the real animal behind each option (public/parts/<id>.webp), so players see what they pick. */
const PART_ART = new Set<string>(PART_ART_LIST as string[]);
import { u } from './uiText';

/** A lit stage for the creature: spotlight from above, a soft pedestal shadow below. The creature is the hero. */
function Stage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`stage ${className}`}>
      <div className="stage-light" aria-hidden="true" />
      <div className="stage-creature">{children}</div>
      <div className="stage-pedestal" aria-hidden="true" />
    </div>
  );
}

export function Builder({ lang, value, onChange, onNext, onBack }: { lang: Lang; value: CreatureConfig; onChange: (c: CreatureConfig) => void; onNext: () => void; onBack: () => void }) {
  const [slot, setSlot] = useState<Slot>('base');
  const d = useMemo(() => derive(value), [value]);
  const set = (k: Slot, id: string) => onChange({ ...value, [k]: id });
  const current = d.parts[slot];
  const [mood, setMood] = useState<Expression>('neutral');
  return (
    <section className="screen builder">
      <header className="screen-head">
        <p className="step">03</p>
        <h2>{t('build', lang)}</h2>
        <p className="hint">{t('buildHint', lang)}</p>
      </header>
      <div className="builder-grid">
        <div className="builder-preview">
          <Stage>
            <CreatureArt creature={value} className="specimen bob" expression={mood} />
          </Stage>
          <div className="mood-strip" role="radiogroup" aria-label={u('reactions', lang)}>
            {PREVIEW_MOODS.map((m) => (
              <button key={m} role="radio" aria-checked={mood === m} className={`mood ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)} title={u(`mood_${m}`, lang)}>
                <CreatureArt creature={value} expression={m} crop="face" />
                <small>{u(`mood_${m}`, lang)}</small>
              </button>
            ))}
          </div>
          <div className="builder-tools">
            <div className="hue-row" role="radiogroup" aria-label={t('color', lang)}>
              {HUES.map((h, i) => (
                <button key={i} role="radio" aria-checked={value.hue === i} aria-label={`${t('color', lang)} ${i + 1}`} className={`hue ${value.hue === i ? 'on' : ''}`} style={{ background: h.body }} onClick={() => onChange({ ...value, hue: i })} />
              ))}
            </div>
            <Btn variant="ghost" className="btn-sm" onClick={() => onChange(randomCreature(new Rng(newSeed()), lang))}>⟳ {t('randomize', lang)}</Btn>
          </div>
          <div className="profile card">
            <p className="kicker">{u('profile', lang)}</p>
            <dl className="stats">
              {STAT_KEYS.map((k) => (
                <div key={k} className="stat">
                  <dt>{STAT_LABEL[k][lang]}</dt>
                  <dd><span className={`bar ${d.stats[k] < 0 ? 'neg' : ''}`} style={{ ['--v' as string]: Math.min(1, Math.abs(d.stats[k]) / 8) }} /><b className={d.stats[k] < 0 ? 'neg' : d.stats[k] > 0 ? 'pos' : ''}>{d.stats[k] > 0 ? '+' : ''}{d.stats[k]}</b></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="builder-parts">
          <div className="slot-tabs" role="tablist">
            {SLOTS.map((s) => (
              <button key={s} role="tab" aria-selected={slot === s} className={`tab ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>
                <span>{SLOT_LABEL[s][lang]}</span>
                <small>{d.parts[s].name[lang]}</small>
              </button>
            ))}
          </div>
          <div className="part-detail card">
            <p className="kicker">{SLOT_LABEL[slot][lang]}</p>
            <h3>{current.name[lang]}</h3>
            <div className="detail-cols">
              <p className="cost"><b>{u('tradeoff', lang)}</b>{current.tradeoff[lang]}</p>
              <p className="real"><b>{t('realScience', lang)}</b>{current.realSource[lang]}</p>
            </div>
          </div>
          <p className="kicker list-label">{u('chooseSlot', lang)} · {partsFor(slot).length}</p>
          <div className="part-list" role="radiogroup" aria-label={SLOT_LABEL[slot][lang]}>
            {partsFor(slot).map((p) => (
              <button key={p.id} role="radio" aria-checked={value[slot] === p.id} className={`part ${value[slot] === p.id ? 'on' : ''} ${PART_ART.has(p.id) ? 'has-art' : ''}`} onClick={() => set(slot, p.id)}>
                {value[slot] === p.id && <span className="part-check" aria-hidden="true">✓</span>}
                {PART_ART.has(p.id) && <img className="part-art" src={`${import.meta.env.BASE_URL}parts/${p.id}.webp`} alt="" loading="lazy" width={320} height={240} />}
                {PART_SOURCE[p.id] && <span className="part-src">{lang === 'ar' ? 'مستوحى من' : 'From the'} <b>{PART_SOURCE[p.id][lang]}</b></span>}
                <strong>{p.name[lang]}</strong>
                <span className="part-desc">{p.desc[lang]}</span>
                {p.caps && p.caps.length > 0 && <span className="part-caps">{p.caps.map((c) => <i key={c}>✦ {CAP_LABEL[c][lang]}</i>)}</span>}
                <span className="part-stats">{Object.entries(p.stats).map(([k, v]) => <i key={k} className={v! < 0 ? 'neg' : 'pos'}>{v! > 0 ? '+' : ''}{v} {STAT_LABEL[k][lang]}</i>)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <footer className="screen-foot">
        <Btn variant="ghost" onClick={onBack}>{t('back', lang)}</Btn>
        <Btn onClick={onNext}>{t('next', lang)}</Btn>
      </footer>
    </section>
  );
}

export function NameCreature({ lang, value, onChange, onNext, onBack }: { lang: Lang; value: CreatureConfig; onChange: (c: CreatureConfig) => void; onNext: () => void; onBack: () => void }) {
  const valid = value.name.trim().length >= 1;
  const d = useMemo(() => derive(value), [value]);
  const submit = () => { if (!valid) return; onChange({ ...value, name: value.name.trim() }); onNext(); };
  return (
    <section className="screen name-creature">
      <header className="screen-head"><p className="step">04</p><h2>{t('nameCreature', lang)}</h2><p className="hint">{t('nameCreatureHint', lang)}</p></header>
      <div className="naming">
        <Stage className="big">
          <CreatureArt creature={value} className="specimen bob" expression="happy" />
        </Stage>
        <form className="naming-card card" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label className="id-field">
            <span className="kicker">{u('designation', lang)}</span>
            <input className="text-in" maxLength={24} value={value.name} aria-label={t('nameCreature', lang)} onChange={(e) => onChange({ ...value, name: e.target.value })} enterKeyHint="next" />
          </label>
          <Btn type="button" variant="ghost" className="btn-sm" onClick={() => onChange({ ...value, name: randomName(new Rng(newSeed()), lang, value.base) })}>⟳ {t('randomName', lang)}</Btn>
          <ul className="chips">{SLOTS.map((s) => <li key={s}>{d.parts[s].name[lang]}</li>)}</ul>
          <div className="capture-row">
            <p>{u('optionalPicture', lang)}</p>
            <CaptureCreature creature={{ ...value, name: value.name.trim() || '—' }} lang={lang} />
          </div>
        </form>
      </div>
      <footer className="screen-foot">
        <Btn variant="ghost" onClick={onBack}>{t('back', lang)}</Btn>
        <Btn disabled={!valid} onClick={submit}>{t('next', lang)}</Btn>
      </footer>
    </section>
  );
}
