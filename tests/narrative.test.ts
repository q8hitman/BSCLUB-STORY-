// Narrative pass: earned endings, showable story creatures, scene-to-scene bridges and MSA-only Arabic.
import { describe, expect, it } from 'vitest';
import * as bestiary from '../src/content/bestiary';
import * as beatsC from '../src/content/beatsClassic';
import * as beatsCo from '../src/content/beatsCommon';
import * as beatsM from '../src/content/beatsMarine';
import * as radio from '../src/content/duckRadio';
import * as ducks from '../src/content/ducks';
import * as legends from '../src/content/legends';
import * as parts from '../src/content/parts';
import * as world from '../src/content/world';
import * as condition from '../src/engine/condition';
import * as ending from '../src/engine/ending';
import { PART_BY_ID } from '../src/content/parts';
import { ANIMAL_BY_ID } from '../src/content/bestiary';
import { BIOMES } from '../src/content/world';
import { Rng } from '../src/engine/rng';
import { randomCreature } from '../src/engine/creature';
import { DUCKS } from '../src/content/ducks';
import { ALL_BEATS, BEAT_BY_ID, advance, bridgeLine, choose, currentBeat, startGame } from '../src/engine/story';
import { composeEnding } from '../src/engine/ending';
import { SLOTS, type GameState, type L10n, type Mode } from '../src/engine/types';
import * as i18n from '../src/i18n';

const LEFTOVER = /\{[\w:|]+\}|\{g:/;

/** Plays a full run and records the featured animal of every scene. */
function play(seed: number, mode: Mode): { s: GameState; featured: (string | null)[]; texts: L10n[] } {
  const r = Rng.from(seed, 'narr');
  let s = startGame({ mode, seed, duck: r.pick(DUCKS).id, player: r.chance(0.5) ? 'Tester' : '', creature: randomCreature(r, r.chance(0.5) ? 'ar' : 'en') });
  const featured: (string | null)[] = []; const texts: L10n[] = [];
  while (s.stage !== 'ending') {
    const v = currentBeat(s);
    featured.push(v.featured ?? null); texts.push(v.text);
    s = advance(choose(s, v.choices[r.int(v.choices.length)].choice.id));
  }
  return { s, featured, texts };
}

const RUNS: { s: GameState; featured: (string | null)[]; texts: L10n[] }[] = [];
for (let i = 0; i < 300; i++) RUNS.push(play(40_000 + i, 'classic'), play(50_000 + i, 'marine'));

describe('earned endings', () => {
  it('every ending names the creature, a body part, a real decision, and is long enough in both languages', () => {
    for (const { s } of RUNS) {
      const e = composeEnding(s);
      const where = `${s.mode} seed ${s.seed} (${e.id})`;
      expect(e.summary.en, where).toContain(s.creature.name);
      expect(e.summary.ar, where).toContain(s.creature.name);
      const partNames = SLOTS.map((slot) => PART_BY_ID[s.creature[slot]].name);
      expect(partNames.some((p) => e.summary.en.includes(p.en)), `${where} part en`).toBe(true);
      expect(partNames.some((p) => e.summary.ar.includes(p.ar)), `${where} part ar`).toBe(true);
      // A quoted decision label the player actually picked.
      const labels = s.log.map((l) => BEAT_BY_ID[l.beat].choices.find((c) => c.id === l.choice)!.label);
      expect(/“[^”]+”/.test(e.summary.en), `${where} decision en`).toBe(true);
      expect(/«[^»]+»/.test(e.summary.ar), `${where} decision ar`).toBe(true);
      expect(labels.length).toBeGreaterThan(0);
      // Route: every visited place is named.
      for (const b of new Set(s.plan.beats.slice(1).map((x) => x.biome).filter((x) => x !== 'openSea'))) {
        expect(e.summary.en, `${where} place ${b}`).toContain(BIOMES[b].name.en);
        expect(e.summary.ar, `${where} place ${b}`).toContain(BIOMES[b].name.ar);
      }
      expect(e.summary.en.length, where).toBeGreaterThan(450);
      expect(e.summary.ar.length, where).toBeGreaterThan(350);
      for (const t of [e.title, e.summary, e.epilogue, ...e.highlights]) {
        expect(t.en + t.ar, `${where} leftover placeholder`).not.toMatch(LEFTOVER);
      }
    }
  });
  it('the twist is paid off in the ending whenever one happened', () => {
    for (const { s } of RUNS) {
      const e = composeEnding(s);
      if (s.flags.includes('twist:squid')) expect(e.summary.en).toContain('giant squid');
      if (s.flags.includes('twist:chip')) expect(e.summary.en).toContain('signal');
    }
  });
});

describe('scene-to-scene coherence', () => {
  it('climaxes open by framing the payoff, and travel between places is narrated', () => {
    let travel = 0;
    for (const { s, texts } of RUNS) {
      const last = texts[texts.length - 1];
      expect(last.en.startsWith('Everything has led') || /Everything has led/.test(last.en), `seed ${s.seed}`).toBe(true);
      expect(last.ar).toContain('كل ما مرّ بكم قادكم إلى هذه اللحظة');
      travel += texts.filter((t) => t.en.includes('Leaving ') || t.en.includes('The sub sinks on')).length;
      for (const t of texts) expect(t.en + t.ar).not.toMatch(LEFTOVER);
    }
    expect(travel).toBeGreaterThan(RUNS.length);
  });
  it('never bridges into the opening hook', () => {
    for (const { s } of RUNS.slice(0, 20)) expect(bridgeLine({ ...s, index: 0, stage: 'beat' }, 0)).toBeNull();
  });
});

describe('showable story creatures', () => {
  it('every biome animal and every beat-level featured id exists in the bestiary', () => {
    for (const b of Object.values(BIOMES)) for (const a of [...b.predators, ...b.critters]) expect(ANIMAL_BY_ID[a.animal], `${b.id} ${a.en}`).toBeTruthy();
    for (const t of ALL_BEATS) if (t.featured) expect(ANIMAL_BY_ID[t.featured], t.id).toBeTruthy();
  });
  it('in many simulated runs, every non-null featured id is in the bestiary, and predator/critter scenes always feature one', () => {
    let shown = 0;
    for (const { s, featured } of RUNS) featured.forEach((f, i) => {
      const t = BEAT_BY_ID[s.plan.beats[i].template];
      if (f !== null) { expect(ANIMAL_BY_ID[f], `${t.id} → ${f}`).toBeTruthy(); shown++; }
      if (/\{predator\}|\{critter\}/.test(t.text.en)) expect(f, t.id).not.toBeNull();
    });
    expect(shown).toBeGreaterThan(RUNS.length);
  });
  it('each wild biome offers variety (≥2 predators and ≥2 critters)', () => {
    for (const id of ['forest', 'desert', 'mountain', 'cave', 'snow', 'swamp', 'reef', 'mudflat', 'seagrass', 'twilight', 'midnight', 'vents', 'trench'] as const) {
      expect(BIOMES[id].predators.length, id).toBeGreaterThanOrEqual(2);
      expect(BIOMES[id].critters.length, id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Arabic is Modern Standard Arabic', () => {
  // Colloquial (Kuwaiti/Gulf) words the designer asked to remove from everything the player reads.
  const COLLOQUIAL = ['وايد', 'شنو', 'جذي', 'يبي', 'تبي', 'هني', 'ماي', 'للحين', 'عشان', 'اللي', 'الحين', 'شوي', 'زين', 'خشم', 'دريشة', 'مستانس', 'ليش', 'شلون'];
  const re = new RegExp(`(^|[^\\u0600-\\u06FF])(${COLLOQUIAL.join('|')})([^\\u0600-\\u06FF]|$)`);
  const seen = new Set<unknown>();
  const collect = (v: unknown, path: string, out: { path: string; ar: string }[]) => {
    if (!v || typeof v !== 'object' || seen.has(v)) return; seen.add(v);
    const o = v as Record<string, unknown>;
    if (typeof o.ar === 'string' && typeof o.en === 'string') out.push({ path, ar: o.ar });
    for (const [k, x] of Object.entries(o)) if (typeof x === 'object') collect(x, `${path}.${k}`, out);
  };
  it('no colloquial words in narration, choices, endings, UI strings, parts, legends, places or duck lines', () => {
    const out: { path: string; ar: string }[] = [];
    const mods: Record<string, unknown> = { beatsC, beatsCo, beatsM, radio, ducks, legends, parts, world, condition, ending, i18n, bestiary };
    for (const [name, m] of Object.entries(mods)) collect(m, name, out);
    expect(out.length).toBeGreaterThan(1000);
    const bad = out.filter((x) => re.test(x.ar)).map((x) => `${x.path}: ${x.ar.slice(0, 80)}`);
    expect(bad).toEqual([]);
  });
});
