import { useMemo, useState } from 'react';
import { EXPERIMENTS, runExperiment, type Experiment } from '../content/testLab';
import { CAP_LABEL } from '../content/partSources';
import { derive } from '../engine/creature';
import type { CreatureConfig, Lang } from '../engine/types';
import { Btn, CreatureArt } from './common';

const RESULT_LABEL = { strong: { ar: 'نجح بسهولة', en: 'Easy success' }, partial: { ar: 'نجح بصعوبة', en: 'Managed, with difficulty' }, none: { ar: 'لم ينجح', en: 'Did not work' } };

/** Optional, replayable mini-lab between naming the creature and choosing a mode. */
export function TestLab({ lang, creature, reduced, onBack, onNext }: { lang: Lang; creature: CreatureConfig; reduced: boolean; onBack: () => void; onNext: () => void }) {
  const d = useMemo(() => derive(creature), [creature]);
  const [cur, setCur] = useState<Experiment | null>(null);
  const [done, setDone] = useState<Record<string, ReturnType<typeof runExperiment>>>({});
  const ar = lang === 'ar';
  const res = cur ? done[cur.id] : undefined;
  return (
    <section className="screen test-lab">
      <header className="screen-head"><p className="step">04½</p><h2>{ar ? 'جرّب مخلوقك' : 'Try out your creature'}</h2>
        <p className="hint">{ar ? 'اختياري. كل تجربة تختبر قدرة واحدة في جسم مخلوقك. اختر تجربة ثم اضغط «ابدأ التجربة» لترى هل ينجح أم لا، ولماذا.' : 'Optional. Each test checks one thing your creature’s body can do. Pick a test, then press “Run the test” to see whether it succeeds, and why.'}</p></header>
      <div className="lab-layout">
        <div className={`lab-stage ${res ? `res-${res.result}` : ''} ${reduced ? '' : 'anim'}`}>
          <CreatureArt creature={creature} className="lab-creature" expression={res?.result === 'strong' ? 'happy' : res?.result === 'none' ? 'tired' : 'curious'} />
          {cur && <div className="lab-card" aria-live="polite">
            <h3>{cur.icon} {cur.title[lang]}</h3>
            <p><b className="lab-q">{ar ? 'التجربة: ' : 'The test: '}</b>{cur.challenge[lang]}</p>
            {!res ? <Btn onClick={() => setDone((x) => ({ ...x, [cur.id]: runExperiment(cur, d) }))} autoFocus>{ar ? 'ابدأ التجربة' : 'Run the test'}</Btn> : <>
              <p className={`lab-result r-${res.result}`}><b>{ar ? 'النتيجة: ' : 'Result: '}{RESULT_LABEL[res.result][lang]}.</b> {cur.results[res.result][lang]}</p>
              {!res.via && <p className="lab-via">{ar ? 'السبب: لا يوجد في جسم مخلوقك جزء يساعده في هذه التجربة.' : 'Why: your creature has no body part that helps with this test.'}</p>}
              {res.via && <p className="lab-via">{ar ? 'السبب: في جسم مخلوقك ' : 'Why: your creature has '}{d.parts[Object.keys(d.parts).find((k) => d.parts[k as keyof typeof d.parts].id === res.via) as keyof typeof d.parts].name[lang]} · {cur.caps.filter((c) => d.caps.has(c)).map((c) => CAP_LABEL[c][lang]).join('، ')}</p>}
              <div className="lab-science">
                <p><span className="tag real">{ar ? 'علم حقيقي' : 'Real science'}</span> {cur.science[lang]} <i>{ar ? 'توجد هذه القدرة عند: ' : 'Animals that have it: '}{cur.realIn[lang]}.</i></p>
                <p><span className="tag fiction">{ar ? 'خيال' : 'Fiction'}</span> {ar ? 'في الطبيعة لا يوجد حيوان واحد يجمع أجزاء من حيوانات مختلفة. مخلوقك من خيال اللعبة فقط.' : 'In nature no single animal combines parts of different animals. Your creature exists only in the game.'}</p>
                <p className="lab-story">{ar ? 'فائدة هذا في القصة: ' : 'What this means in the story: '}{cur.inStory[lang]}</p>
              </div>
              <Btn variant="ghost" onClick={() => setDone((x) => { const n = { ...x }; delete n[cur.id]; return n; })}>{ar ? 'أعد التجربة' : 'Try again'}</Btn>
            </>}
          </div>}
          {!cur && <p className="lab-pick-hint">{ar ? 'اختر تجربة من القائمة' : 'Pick a test from the list'}</p>}
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
