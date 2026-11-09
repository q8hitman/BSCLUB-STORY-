// Story Factory: the branching STRUCTURE is built by code, so it is always valid; Gemini only writes the content.
//   hook ─┬─ a ─┐            ┌─ c ─┐
//         └─ b ─┴─ middle ───┤     ├─ climax ─┬─ end:e1
//                            └─ d ─┘          ├─ end:e2
//                                             └─ end:e3
// Every node gets 4 open choices + 1 anatomy-gated choice; each choice's `next` is fixed here.
// Places and paintings are picked by code from real plates of that place.
import type { StoryPackage } from '../../src/engine/archive';
import type { Rng } from '../../src/engine/rng';

type P = { id: string; biome: string; event: string; style: string };
const NEXT: Record<string, string[]> = {
  hook: ['a', 'a', 'b', 'b', 'a'], a: ['middle', 'middle', 'middle', 'middle', 'middle'], b: ['middle', 'middle', 'middle', 'middle', 'middle'],
  middle: ['c', 'c', 'd', 'd', 'c'], c: ['climax', 'climax', 'climax', 'climax', 'climax'], d: ['climax', 'climax', 'climax', 'climax', 'climax'],
  climax: ['end:e1', 'end:e2', 'end:e3', 'end:e3', 'end:e1'],
};
const KIND: Record<string, string> = { hook: 'hook', a: 'explore', b: 'explore', middle: 'twist', c: 'challenge', d: 'encounter', climax: 'climax' };
const CINE: Record<string, string> = { middle: 'reveal', climax: 'climax' };

export function buildSkeleton(mode: 'classic' | 'marine', envs: string[], plates: P[], rng: Rng) {
  const usable = (b: string) => plates.filter((p) => p.biome === b && p.style !== 'specimen' && !['lore', 'rare', 'ending', 'camp'].includes(p.event));
  const places = rng.shuffle(envs.filter((b) => usable(b).length >= 3)).slice(0, 3);
  const at: Record<string, string> = { hook: places[0], a: places[0], b: places[1], middle: places[1], c: places[2], d: places[2], climax: places[2] };
  const used = new Set<string>();
  const plateFor = (b: string) => { const p = rng.shuffle(usable(b)).find((x) => !used.has(x.id)) ?? usable(b)[0]; used.add(p.id); return p.id; };
  const nodes: Record<string, unknown> = {};
  for (const id of Object.keys(NEXT)) {
    nodes[id] = {
      kind: KIND[id], biome: at[id], plate: plateFor(at[id]), ...(CINE[id] ? { cinematic: CINE[id] } : {}), props: [],
      ...(id === 'hook' ? { goal: 'TODO {en,ar}: the mission in one sentence' } : {}),
      text: 'TODO {en,ar}', variants: 'OPTIONAL: [{when: Cond, text}] reacting to earlier flags/evidence',
      choices: NEXT[id].map((next, k) => ({
        id: `TODO-${k + 1}`, label: 'TODO {en,ar}', style: 'TODO', ...(k === 4 ? { requires: { capAny: ['TODO one or two capabilities'] } } : {}),
        check: 'OPTIONAL {stat, dc 4-7} — if present, fail is required', success: { text: 'TODO', effects: [], mood: 'TODO', fx: 'TODO', next }, fail: `OPTIONAL (next must also be "${next}")`,
      })),
    };
  }
  return { places, skeleton: { nodes, endings: { e1: 'TODO', e2: 'TODO', e3: 'TODO' }, start: 'hook' } };
}

/** Put Gemini's words into the fixed structure. Anything structural Gemini changed is overwritten. */
export function mergeSkeleton(skel: ReturnType<typeof buildSkeleton>['skeleton'], out: StoryPackage): StoryPackage {
  const nodes: StoryPackage['nodes'] = {};
  for (const [id, sn] of Object.entries(skel.nodes) as [string, { kind: string; biome: string; plate: string; cinematic?: string; choices: { success: { next: string } }[] }][]) {
    const on = out.nodes?.[id]; if (!on) throw new Error(`writer left out node ${id}`);
    const choices = (on.choices ?? []).slice(0, 5);
    if (choices.length < 5) throw new Error(`node ${id}: writer gave ${choices.length} of 5 choices`);
    nodes[id] = {
      ...on, kind: sn.kind as never, biome: sn.biome as never, plate: sn.plate, ...(sn.cinematic ? { cinematic: sn.cinematic as never } : {}),
      choices: choices.map((c, k) => {
        const next = sn.choices[k].success.next;
        const req = k === 4 ? (c.requires?.capAny?.length ? { capAny: c.requires.capAny } : { capAny: ['scent'] as never }) : undefined;
        const { requires: _r, ...rest } = c;
        return { ...rest, ...(req ? { requires: req } : {}), id: /^[a-z0-9-]{2,30}$/.test(c.id ?? '') ? c.id : `c${k + 1}`, success: { ...c.success, next }, ...(c.fail ? { fail: { ...c.fail, next } } : {}) };
      }),
    };
    // choice ids must be unique within the node
    const seen = new Set<string>(); for (const c of nodes[id].choices) { while (seen.has(c.id)) c.id = `${c.id}-x`; seen.add(c.id); }
  }
  const endings = Object.fromEntries(['e1', 'e2', 'e3'].map((e) => { const x = out.endings?.[e]; if (!x) throw new Error(`writer left out ending ${e}`); return [e, x]; }));
  return { ...out, start: 'hook', nodes, endings };
}
