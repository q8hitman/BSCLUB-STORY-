import { useMemo, useState } from 'react';
import { EXPERIMENTS, runExperiment, type Experiment } from '../content/testLab';
import { CAP_LABEL } from '../content/partSources';
import { derive } from '../engine/creature';
import type { CreatureConfig, Lang } from '../engine/types';
import { plateUrl } from '../art/plates';
import { Btn, CreatureArt } from './common';

const RESULT_LABEL = { strong: { ar: 'نجاحٌ باهر', en: 'Strong result' }, partial: { ar: 'نجاحٌ جزئي', en: 'Partial result' }, none: { ar: 'لم ينجح', en: 'Did not work' } };

/** Optional, replayable mini-lab between naming the creature and choosing a mode. */
export function TestLab({ lang, creature, reduced, onBack, onNext }: { lang: Lang; creature: CreatureConfig; reduced: boolean; onBack: () => void; onNext: () => void }) {
  const d = useMemo(() => derive(creature), [creature]);
  const [cur, setCur] = useState<Experiment | null>(null);
  const [done, setDone] = useState<Record<string, ReturnType<typeof runExperiment>>>({});
  const ar = lang === 'ar';
  const res = cur ? done[cur.id] : undefined;
  return (
    <section className="screen test-lab">
      <header className="screen-head"><p className="step">04½</p><h2>{ar ? 'مختبر تجربة المخلوق' : 'Creature Test Lab'}</h2>
        <p className="hint">{ar ? 'اختياري: جرّب جسم مخلوقك في تجارب قصيرة، وشاهد ما يستطيعه في المغامرة وما لا يستطيعه.' : 'Optional: try your creature in quick experiments and see what it can and cannot do in the adventure.'}</p></header>
      <div className="lab-layout">
        <div className={`lab-stage ${res ? `res-${res.result}` : ''} ${reduced ? '' : 'anim'}`}>
          {cur && <img className="lab-bg" src={plateUrl(cur.plate)} alt="" />}
          <CreatureArt creature={creature} className="lab-creature" expression={res?.result === 'strong' ? 'happy' : res?.result === 'none' ? 'tired' : 'curious'} />
          {cur && <div className="lab-card" aria-live="polite">
            <h3>{cur.icon} {cur.title[lang]}</h3>
            <p>{cur.challenge[lang]}</p>
            {!res ? <Btn onClick={() => setDone((x) => ({ ...x, [cur.id]: runExperiment(cur, d) }))} autoFocus>{ar ? 'ابدأ التجربة' : 'Run the test'}</Btn> : <>
              <p className={`lab-result r-${res.result}`}><b>{RESULT_LABEL[res.result][lang]}</b> — {cur.results[res.result][lang]}</p>
              {res.via && <p className="lab-via">{ar ? 'بفضل: ' : 'Thanks to: '}{d.parts[Object.keys(d.parts).find((k) => d.parts[k as keyof typeof d.parts].id === res.via) as keyof typeof d.parts].name[lang]} · {cur.caps.filter((c) => d.caps.has(c)).map((c) => CAP_LABEL[c][lang]).join('، ')}</p>}
              <div className="lab-science">
                <p><span className="tag real">{ar ? 'علمٌ حقيقي' : 'Real science'}</span> {cur.science[lang]} <i>({cur.realIn[lang]})</i></p>
                <p><span className="tag fiction">{ar ? 'خيال' : 'Fiction'}</span> {ar ? 'جمع هذه القدرة في مخلوقٍ هجين مثل مخلوقك خيالٌ للّعب فقط.' : 'Putting this ability into a hybrid like yours is fiction, for play only.'}</p>
                <p className="lab-story">{ar ? 'في المغامرة: ' : 'In the adventure: '}{cur.inStory[lang]}</p>
              </div>
              <Btn variant="ghost" onClick={() => setDone((x) => { const n = { ...x }; delete n[cur.id]; return n; })}>{ar ? 'أعد التجربة' : 'Try again'}</Btn>
            </>}
          </div>}
          {!cur && <p className="lab-pick-hint">{ar ? 'اختر تجربة ←' : '← Pick an experiment'}</p>}
        </div>
        <ul className="lab-list">
          {EXPERIMENTS.map((x) => (
            <li key={x.id}><button className={`lab-item ${cur?.id === x.id ? 'on' : ''} ${done[x.id] ? `done r-${done[x.id].result}` : ''}`} onClick={() => setCur(x)}>
              <span className="lab-icon" aria-hidden="true">{x.icon}</span><span>{x.title[lang]}</span>
              {done[x.id] && <small>{RESULT_LABEL[done[x.id].result][lang]}</small>}
            </button></li>
          ))}
        </ul>
      </div>
      <footer className="screen-foot"><Btn variant="ghost" onClick={onBack}>{ar ? 'رجوع' : 'Back'}</Btn><Btn onClick={onNext}>{Object.keys(done).length ? (ar ? 'إلى المغامرة' : 'To the adventure') : (ar ? 'تخطَّ المختبر' : 'Skip the lab')}</Btn></footer>
    </section>
  );
}
