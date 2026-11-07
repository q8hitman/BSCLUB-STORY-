import { useMemo, useState } from 'react';
import { HUES, partsFor } from '../content/parts';
import { derive, randomCreature, randomName } from '../engine/creature';
import { Rng, newSeed } from '../engine/rng';
import { SLOTS, STAT_KEYS, type CreatureConfig, type Lang, type Slot } from '../engine/types';
import { SLOT_LABEL, STAT_LABEL, t } from '../i18n';
import { Btn, CreatureArt } from './common';

export function Builder({ lang, value, onChange, onNext, onBack }: { lang: Lang; value: CreatureConfig; onChange: (c: CreatureConfig) => void; onNext: () => void; onBack: () => void }) {
  const [slot, setSlot] = useState<Slot>('base');
  const d = useMemo(() => derive(value), [value]);
  const set = (k: Slot, id: string) => onChange({ ...value, [k]: id });
  const current = d.parts[slot];
  return (
    <section className="screen builder">
      <header className="screen-head">
        <h2>{t('build', lang)}</h2>
        <p className="hint">{t('buildHint', lang)}</p>
      </header>
      <div className="builder-grid">
        <div className="builder-preview card">
          <CreatureArt creature={value} className="bob" />
          <div className="hue-row" role="radiogroup" aria-label={t('color', lang)}>
            {HUES.map((h, i) => (
              <button key={i} role="radio" aria-checked={value.hue === i} aria-label={`${t('color', lang)} ${i + 1}`} className={`hue ${value.hue === i ? 'on' : ''}`} style={{ background: h.body }} onClick={() => onChange({ ...value, hue: i })} />
            ))}
          </div>
          <dl className="stats">
            {STAT_KEYS.map((k) => (
              <div key={k} className="stat">
                <dt>{STAT_LABEL[k][lang]}</dt>
                <dd><span className={`bar ${d.stats[k] < 0 ? 'neg' : ''}`} style={{ ['--v' as string]: Math.min(1, Math.abs(d.stats[k]) / 8) }} /><b>{d.stats[k] > 0 ? '+' : ''}{d.stats[k]}</b></dd>
              </div>
            ))}
          </dl>
          <Btn variant="ghost" onClick={() => onChange(randomCreature(new Rng(newSeed()), lang))}>🎲 {t('randomize', lang)}</Btn>
        </div>
        <div className="builder-parts">
          <div className="slot-tabs" role="tablist">
            {SLOTS.map((s) => (
              <button key={s} role="tab" aria-selected={slot === s} className={`tab ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>{SLOT_LABEL[s][lang]}</button>
            ))}
          </div>
          <div className="part-list" role="radiogroup" aria-label={SLOT_LABEL[slot][lang]}>
            {partsFor(slot).map((p) => (
              <button key={p.id} role="radio" aria-checked={value[slot] === p.id} className={`part ${value[slot] === p.id ? 'on' : ''}`} onClick={() => set(slot, p.id)}>
                <strong>{p.name[lang]}</strong>
                <span className="part-desc">{p.desc[lang]}</span>
                <span className="part-stats">{Object.entries(p.stats).map(([k, v]) => <i key={k} className={v! < 0 ? 'neg' : 'pos'}>{v! > 0 ? '+' : ''}{v} {STAT_LABEL[k][lang]}</i>)}</span>
              </button>
            ))}
          </div>
          <div className="part-detail card">
            <p><b>⚠ {t('cost', lang)}:</b> {current.tradeoff[lang]}</p>
            <p className="real"><b>🔬 {t('realScience', lang)}:</b> {current.realSource[lang]}</p>
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
  return (
    <section className="screen name-creature">
      <header className="screen-head"><h2>{t('nameCreature', lang)}</h2></header>
      <div className="card center">
        <CreatureArt creature={value} className="bob big" />
        <input className="text-in" maxLength={24} value={value.name} aria-label={t('nameCreature', lang)} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        <Btn variant="ghost" onClick={() => onChange({ ...value, name: randomName(new Rng(newSeed()), lang) })}>🎲 {t('randomName', lang)}</Btn>
      </div>
      <footer className="screen-foot">
        <Btn variant="ghost" onClick={onBack}>{t('back', lang)}</Btn>
        <Btn disabled={!valid} onClick={() => { onChange({ ...value, name: value.name.trim() }); onNext(); }}>{t('next', lang)}</Btn>
      </footer>
    </section>
  );
}
