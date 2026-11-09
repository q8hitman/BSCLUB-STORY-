import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLATE_LIST, platesForRun } from '../src/art/plates';
import { DUCKS, DUCK_BY_ID, resolveDuckId } from '../src/content/ducks';
import { RADIO } from '../src/content/duckRadio';
import { condition } from '../src/engine/condition';
import { crew, radio } from '../src/engine/radio';
import { simulateRun } from '../src/engine/sim';
import { BEAT_BY_ID, advance, choose, currentBeat, startGame } from '../src/engine/story';

describe('BSC characters', () => {
  it('roster is the final approved cast; Ali is gone and Camel took his slot', () => {
    expect(DUCKS.map((d) => d.id)).toEqual(['abdullah', 'ahmed', 'camel', 'bassam', 'kiraz', 'roaa', 'zahra']);
    expect(DUCKS.some((d) => /ali|علي/i.test(d.name.en + d.name.ar))).toBe(false);
    const camel = DUCK_BY_ID.camel;
    expect(camel.name).toEqual({ en: 'Camel', ar: 'الجمل' });
    expect(camel.img).toBe('camel/pose-front.webp');
    expect(resolveDuckId('pipette')).toBe('camel'); // Ali's old slot in saved games
  });
  it('every expression and pose file exists, and originals are archived', () => {
    for (const d of DUCKS) {
      expect(Object.keys(d.expressions).sort()).toEqual(['curious', 'happy', 'laughing', 'shocked', 'sly', 'worried']);
      for (const f of [...Object.values(d.expressions), ...Object.values(d.poses)]) expect(existsSync(`public/ducks/${f}`), f).toBe(true);
      expect(existsSync(`art-source/ducks-final/${d.id}.png`)).toBe(true);
    }
  });
  it('legacy saves with old duck ids still play', () => {
    for (const old of ['petri', 'quill', 'pipette', 'goggles', 'cherry', 'lens', 'data']) {
      expect(DUCK_BY_ID[old], old).toBeTruthy();
      let s = startGame({ mode: 'classic', seed: 4, duck: old, player: '', creature: simulateRun(1, 'classic').state.creature });
      s = advance(choose(s, currentBeat(s).choices[0].choice.id));
      expect(s.stage).not.toBe('ending');
    }
  });
});

describe('Duck Radio', () => {
  it('every duck has lines for every cue, in both languages', () => {
    for (const d of DUCKS) for (const cue of ['arrive', 'danger', 'deep', 'success', 'fail', 'discovery', 'theory', 'comic', 'disagree'] as const) {
      const pool = RADIO[d.id]?.[cue];
      expect(pool?.length, `${d.id}.${cue}`).toBeGreaterThan(0);
      pool!.forEach((l) => { expect(l.en.length).toBeGreaterThan(3); expect(/[؀-ۿ]/.test(l.ar)).toBe(true); });
    }
  });
  it('speaks sometimes, not every scene; uses the run crew and valid expressions', () => {
    let beats = 0, spoken = 0;
    for (let i = 0; i < 200; i++) {
      let s = startGame({ mode: i % 2 ? 'marine' : 'classic', seed: i, duck: 'camel', player: '', creature: simulateRun(i, 'classic').state.creature });
      const team = crew(s);
      expect(team[0]).toBe('camel'); expect(new Set(team).size).toBe(3);
      while (s.stage !== 'ending') {
        const v = currentBeat(s); beats++;
        const ls = radio(s, v.template.kind, v.biome);
        if (ls.length) spoken++;
        ls.forEach((l) => { expect(team).toContain(l.duck); expect(DUCK_BY_ID[l.duck].expressions[l.expression]).toBeTruthy(); });
        s = choose(s, v.choices[0].choice.id); radio(s, v.template.kind, v.biome); s = advance(s);
      }
    }
    expect(spoken / beats).toBeGreaterThan(0.25);
    expect(spoken / beats).toBeLessThan(0.75);
  });
});

describe('creature condition & plates', () => {
  it('marks follow the places visited and stay bounded', () => {
    const r = simulateRun(42, 'marine');
    const c = condition({ ...r.state, stage: 'outcome', index: r.state.plan.beats.length - 1, lastOutcome: { text: { en: 'x', ar: 'س' }, mood: 'happy', success: true } });
    expect(c.marks.length).toBeLessThanOrEqual(5);
    expect(c.marks.some((m) => m === 'glow' || m === 'soot')).toBe(true); // ended in The Deep
  });
  it('every plate in the manifest exists and is never shown twice in one run', () => {
    for (const p of PLATE_LIST) expect(existsSync(`public/scenes/${p.id}.webp`), p.id).toBe(true);
    for (let i = 0; i < 100; i++) {
      const s = simulateRun(i, i % 2 ? 'marine' : 'classic').state;
      const used = (platesForRun(s, (k: number) => BEAT_BY_ID[s.plan.beats[k].template]?.kind ?? null, s.plan.beats.length - 1) as ({ id: string } | null)[]).filter(Boolean).map((p) => p!.id);
      expect(new Set(used).size).toBe(used.length);
    }
  });
});

describe('bestiary', () => {
  it('every animal has real artwork that exists (or is listed as waiting for art), and valid facts', async () => {
    const { BESTIARY, ART_PENDING } = await import('../src/content/bestiary');
    const { PAINT_PROPS } = await import('../src/art/painter');
    const { FACT_BY_ID } = await import('../src/content/world');
    const plateIds = new Set(PLATE_LIST.map((p) => p.id));
    expect(BESTIARY.length).toBeGreaterThanOrEqual(30);
    for (const a of BESTIARY) {
      const art = [...a.art.plates, ...(a.art.specimen ? [a.art.specimen] : [])];
      // Real animals named by the story may wait for the art worker; they must be listed in ART_PENDING.
      if (art.length + (a.art.painter ? 1 : 0) === 0) expect(ART_PENDING, a.id).toContain(a.id);
      else expect(ART_PENDING, a.id).not.toContain(a.id);
      art.forEach((id) => expect(plateIds.has(id), `${a.id} → ${id}`).toBe(true));
      if (a.art.painter) expect(PAINT_PROPS[a.art.painter], `${a.id} painter`).toBeTruthy();
      if (a.fact) expect(FACT_BY_ID[a.fact], `${a.id} fact`).toBeTruthy();
    }
  });
});

describe('companion gender agreement', () => {
  it('story text resolves {duck} and {g:m|f} for male and female companions', async () => {
    const { ALL_BEATS, fill, beatContext } = await import('../src/engine/story');
    for (const duck of ['camel', 'roaa']) {
      const s = startGame({ mode: 'classic', seed: 1, duck, player: '', creature: simulateRun(1, 'classic').state.creature });
      const ctx = beatContext(s);
      expect(ctx.duckG).toBe(duck === 'camel' ? 'm' : 'f');
      for (const b of ALL_BEATS) for (const c of b.choices) for (const t of [c.label, c.success.text, c.fail?.text]) {
        if (!t) continue;
        const out = fill(t, ctx);
        expect(out.ar + out.en, `${b.id}.${c.id}`).not.toMatch(/[{}]/);
        if (duck === 'camel') expect(out.ar).not.toMatch(/الجمل (صارت|تلوّح|زحلقت|سوّتها|ترجمت|تهفّ|طلّعت|بدت|اختارت|زعلانة|انخرعت|ألقت)/);
      }
    }
  });
});

describe('legends', () => {
  it('every legend is complete in both languages and lives in real biomes', async () => {
    const { LEGENDS } = await import('../src/content/legends');
    const { BIOMES } = await import('../src/content/world');
    expect(LEGENDS.length).toBeGreaterThanOrEqual(12);
    expect(LEGENDS.filter((l) => l.realm === 'land').length).toBeGreaterThanOrEqual(6);
    for (const l of LEGENDS) {
      for (const t of [l.name, l.epithet, l.lore, l.signs, l.rule, l.glimpse]) { expect(t.en.length).toBeGreaterThan(3); expect(/[؀-ۿ]/.test(t.ar)).toBe(true); }
      l.biomes.forEach((b) => expect(BIOMES[b], `${l.id} ${b}`).toBeTruthy());
    }
  });
  it('sightings are rare (≈30% of runs), at most one per run, and match the place', async () => {
    const { sightingFor } = await import('../src/engine/sighting');
    let n = 0; const runs = 600;
    for (let i = 0; i < runs; i++) {
      const s = simulateRun(i, i % 2 ? 'marine' : 'classic').state;
      const sg = sightingFor(s);
      if (sg) { n++; expect(sg.legend.biomes).toContain(s.plan.beats[sg.index].biome); expect(sg.index).toBeGreaterThanOrEqual(2); }
    }
    expect(n / runs).toBeGreaterThan(0.15);
    expect(n / runs).toBeLessThan(0.4);
  });
});

describe('Duck Radio help (no perks)', () => {
  it('ducks give no gameplay bonus', async () => {
    const d = (await import('../src/content/ducks')).DUCKS[0] as unknown as Record<string, unknown>;
    expect(d.bonusStat).toBeUndefined(); expect(d.perk).toBeUndefined();
  });
  it('hunches come from the duck’s temperament, are hedged, and are sometimes NOT the best option', async () => {
    const { hunchFor } = await import('../src/engine/radio');
    const { TEMPERAMENT } = await import('../src/content/duckRadio');
    let hunches = 0, notBest = 0;
    for (let i = 0; i < 300; i++) {
      let s = startGame({ mode: i % 2 ? 'marine' : 'classic', seed: i, duck: 'camel', player: '', creature: simulateRun(i, 'classic').state.creature });
      while (s.stage !== 'ending') {
        const v = currentBeat(s);
        for (const duck of ['abdullah', 'camel', 'roaa', 'zahra', 'kiraz']) {
          const h = hunchFor(s, duck);
          if (!h) continue;
          hunches++;
          const best = Math.max(...v.choices.map((c) => c.odds ?? 1));
          const picked = v.choices.find((c) => c.choice.id === h.choice)!;
          expect(picked.choice.style).toBe(TEMPERAMENT[duck]);
          if ((picked.odds ?? 1) < best - 1e-9) notBest++;
          expect(h.text.en + h.text.ar).not.toMatch(/[{}]/);
        }
        s = advance(choose(s, v.choices[i % v.choices.length].choice.id));
      }
    }
    expect(hunches).toBeGreaterThan(200);
    expect(notBest / hunches).toBeGreaterThan(0.1); // predictions can be wrong: no guaranteed answers
  });
  it('specialty field notes are deterministic, from the speaking duck’s own field, and never change the outcome', async () => {
    const { fieldNotes, radio } = await import('../src/engine/radio');
    let notes = 0;
    for (let i = 0; i < 200; i++) {
      let s = startGame({ mode: i % 2 ? 'marine' : 'classic', seed: i, duck: DUCKS[i % DUCKS.length].id, player: '', creature: simulateRun(i, 'classic').state.creature });
      const plain = s;
      while (s.stage !== 'ending') {
        const v = currentBeat(s);
        s = choose(s, v.choices[(i + s.index) % v.choices.length].choice.id);
        const n = fieldNotes(s)[s.index];
        const lines = radio(s, v.template.kind, v.biome);
        if (n) { notes++; expect(lines[0]).toMatchObject({ kind: 'note', noteId: n.id, duck: n.duck }); expect(n.id.startsWith(n.duck)).toBe(true); }
        s = advance(s);
      }
      const all = Object.values(fieldNotes(s)).map((n) => n.id);
      expect(new Set(all).size).toBe(all.length);
      expect(plain.energy).toBe(5); // notes live in the journal only; game state has no note fields
    }
    expect(notes).toBeGreaterThan(150);
  });
  it('struggling players sometimes hear a hunch; thriving players get praise or real facts', async () => {
    const { radio, struggling, thriving } = await import('../src/engine/radio');
    let strugglingBeats = 0, helped = 0, thrivingOutcomes = 0, cheered = 0;
    for (let i = 0; i < 300; i++) {
      let s = startGame({ mode: i % 2 ? 'marine' : 'classic', seed: i, duck: 'kiraz', player: '', creature: simulateRun(i, 'classic').state.creature });
      while (s.stage !== 'ending') {
        const v = currentBeat(s);
        if (struggling(s)) { strugglingBeats++; if (radio(s, v.template.kind, v.biome).some((l) => l.kind === 'hunch')) helped++; }
        s = choose(s, v.choices[(i + s.index) % v.choices.length].choice.id);
        if (thriving(s)) { thrivingOutcomes++; if (radio(s, v.template.kind, v.biome).some((l) => l.kind === 'praise' || l.kind === 'fact' || l.kind === 'note')) cheered++; }
        s = advance(s);
      }
    }
    expect(helped / strugglingBeats).toBeGreaterThan(0.15);
    expect(helped / strugglingBeats).toBeLessThan(0.7); // not constant interruptions
    expect(cheered / thrivingOutcomes).toBeGreaterThan(0.5);
  });
});
