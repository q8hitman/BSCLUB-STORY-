import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { advance, choose, currentBeat, jaccard } from '../src/engine/story';
import { contentHash, narrativeFingerprint, reachedEnding, startStory, type StoryPackage } from '../src/engine/archive';
import { validateStory } from '../src/engine/archiveValidate';
import { decodeSave, encodeSave, peekStory } from '../src/engine/save';
import { composeEnding } from '../src/engine/ending';
import { STORY_CATALOG, currentStories, loadAllStories, loadStory } from '../src/stories/index';
import { pickAdventure } from '../src/engine/memory';
import { emptyJournal, recordToJournal } from '../src/engine/journal';
import type { GameState } from '../src/engine/types';

const plates = new Set((JSON.parse(fs.readFileSync('src/content/plates.json', 'utf8')) as { id: string }[]).map((p) => p.id));
const all = await loadAllStories();

function play(p: StoryPackage, seed: number, stopAt = 99): GameState[] {
  const r = new Rng(seed);
  let s = startStory({ mode: p.mode, seed, duck: 'camel', player: 'Guest', creature: randomCreature(r, 'ar') }, p, { sighting: null, recentEndings: [] });
  const states = [s]; let n = 0;
  while (s.stage !== 'ending' && n++ < stopAt) { s = s.stage === 'beat' ? choose(s, r.pick(currentBeat(s).choices).choice.id) : advance(s); states.push(s); }
  return states;
}

describe('Story Archive', () => {
  it('every package file is in the catalog, and no published version was modified or deleted', () => {
    for (const p of all) {
      const e = STORY_CATALOG.find((x) => x.id === p.id && x.v === p.v);
      expect(e, `${p.id}@${p.v} missing from catalog — run scripts/factory/publish.ts`).toBeTruthy();
      expect(contentHash(p), `${p.id}@${p.v} changed after publishing: make @${p.v + 1} instead`).toBe(e!.hash);
    }
    for (const e of STORY_CATALOG.filter((x) => x.status === 'published')) expect(all.some((p) => p.id === e.id && p.v === e.v), `${e.id}@${e.v} deleted`).toBe(true);
  });
  it('every published story passes the validator (graph, conditions, MSA, assets, 300 random builds)', () => {
    for (const p of all.filter((x) => x.status === 'published')) {
      const r = validateStory(p, { plates, others: all });
      expect(r.errors, p.id).toEqual([]);
      expect(r.stats.buildsCompleted).toBe(r.stats.buildsTried);
      expect(Object.keys(r.stats.endingsReached).length).toBe(r.stats.endings);
      expect(r.stats.paths).toBeGreaterThanOrEqual(3);
    }
    expect(currentStories('classic').length).toBeGreaterThanOrEqual(currentStories('marine').length); // Classic stays primary
  });
  it('the validator catches broken graphs, dialect, missing art and a creature that speaks', () => {
    const p = all[0];
    const broken: StoryPackage = JSON.parse(JSON.stringify(p));
    const n = Object.values(broken.nodes)[1];
    n.choices[0].success.next = 'nowhere';
    n.text.ar = 'شلون نسوي؟';
    n.plate = 'no-such-plate';
    n.choices[1].success.text.en = '{name} said: “hello”';
    const errs = validateStory({ ...broken, id: 'broken-copy' }, { plates, sims: 5 }).errors.join('\n');
    expect(errs).toMatch(/unknown node nowhere/);
    expect(errs).toMatch(/colloquial/);
    expect(errs).toMatch(/missing plate/);
    expect(errs).toMatch(/never speaks/);
  });
  it('narrative fingerprints catch a reworded copy of the same structure (not text similarity)', () => {
    const p = all[0];
    const reworded: StoryPackage = JSON.parse(JSON.stringify(p));
    reworded.id = 'reworded'; reworded.title = { en: 'Totally new title', ar: 'عنوانٌ جديد تماماً' };
    for (const n of Object.values(reworded.nodes)) n.text = { en: 'Different words entirely.', ar: 'كلماتٌ مختلفة تماماً.' };
    expect(jaccard(narrativeFingerprint(p), narrativeFingerprint(reworded))).toBe(1);
    expect(validateStory(reworded, { others: [p], sims: 3 }).errors.join()).toMatch(/structurally too similar/);
    const [a, b] = all; expect(jaccard(narrativeFingerprint(a), narrativeFingerprint(b))).toBeLessThan(0.45);
  });
  it('branches reconverge but keep earlier consequences (world flags, evidence)', () => {
    const p = all.find((x) => x.id === 'silent-ridge')!;
    let hit = 0;
    for (let seed = 1; seed < 200; seed++) {
      const s = play(p, seed).at(-1)!;
      if (s.flags.includes('w:power') && s.plan.beats.some((b) => b.template.endsWith(':pumphouse'))) hit++;
    }
    expect(hit).toBeGreaterThan(5); // power restored early is still true at the climax
  });
  it('QR saves restore an archive run exactly at every step, and name the exact version they need', () => {
    for (const p of all) for (let seed = 1; seed < 25; seed++) for (const s of play(p, seed)) {
      const code = encodeSave(s);
      expect(peekStory(code)).toEqual({ id: p.id, v: p.v });
      const res = decodeSave(code);
      expect(res.ok, `${p.id} seed ${seed} ${s.stage} ${s.index}`).toBe(true);
      if (res.ok) expect(res.state).toEqual(s);
    }
  });
  it('a save for a story version this device does not have is refused, never replaced by another story', () => {
    const s = play(all[0], 3, 3).at(-1)!;
    const code = encodeSave({ ...s, plan: { ...s.plan, story: { id: s.plan.story!.id, v: 99 } } });
    expect(decodeSave(code)).toMatchObject({ ok: false, reason: 'content' });
  });
  it('archive endings are the authored, earned endings and land in the journal', async () => {
    const p = (await loadStory('lantern-wreck', 1))!;
    const s = play(p, 7).at(-1)!;
    const e = composeEnding(s); const r = reachedEnding(s)!;
    expect(e.id).toBe(`lantern-wreck:${r.id}`);
    expect(e.title.ar).toContain(r.ending.title.ar.slice(0, 6));
    const j = recordToJournal(emptyJournal(), s, e, null).journal;
    expect(j.stories?.['lantern-wreck']?.endings).toContain(r.id);
  });
});

describe('Adventure Memory', () => {
  it('prefers unplayed stories and unexplored places, but never locks old content', () => {
    let j = emptyJournal();
    const first = pickAdventure('classic', j, new Rng(1), { generated: false });
    expect(first.kind).toBe('story');
    // after playing every classic archive story, a generated adventure (new places) wins most of the time
    for (const e of currentStories('classic')) j = { ...j, stories: { ...j.stories, [e.id]: { v: e.v, plays: 1, endings: [], last: 1 } } };
    let gen = 0; for (let i = 0; i < 50; i++) if (pickAdventure('classic', j, new Rng(i)).kind === 'generated') gen++;
    expect(gen).toBeGreaterThan(30);
    // replay is still possible on request
    expect(pickAdventure('classic', j, new Rng(1), { replay: 'silent-ridge' })).toMatchObject({ kind: 'story', id: 'silent-ridge' });
  });
});

describe('QR saves made before later library updates', () => {
  it('codes issued on 2026-11-09 (generated journeys and archive stories) still restore to the same scene', async () => {
    const fx = JSON.parse(fs.readFileSync('tests/fixtures/saves-2026-11-09.json', 'utf8')) as { label: string; code: string; stage: string; index: number; choices: string[] }[];
    for (const f of fx) {
      const need = peekStory(f.code); if (need) await loadStory(need.id, need.v);
      const r = decodeSave(f.code);
      expect(r.ok, f.label).toBe(true);
      if (r.ok) { expect(r.state.stage).toBe(f.stage); expect(r.state.index).toBe(f.index); expect(r.state.log.map((l) => l.choice)).toEqual(f.choices); }
    }
  });
});
