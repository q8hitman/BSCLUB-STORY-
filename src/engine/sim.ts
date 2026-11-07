// Headless playthrough used by tests and the diversity report.
import { DUCKS } from '../content/ducks';
import { randomCreature } from './creature';
import { composeEnding } from './ending';
import { Rng } from './rng';
import { advance, choose, currentBeat, pathTokens, planTokens, startGame, validateState, type RunMemory } from './story';
import type { CreatureConfig, Ending, GameState, Mode } from './types';

export interface SimResult { state: GameState; ending: Ending; memory: RunMemory; errors: string[] }

export function simulateRun(seed: number, mode: Mode, opts: { creature?: CreatureConfig; history?: RunMemory[]; recentEndings?: string[]; pick?: (n: number, r: Rng) => number; duck?: string } = {}): SimResult {
  const r = Rng.from(seed, 'sim');
  const creature = opts.creature ?? randomCreature(r, r.chance(0.5) ? 'ar' : 'en');
  const duck = opts.duck ?? r.pick(DUCKS).id;
  let s = startGame({ mode, seed, duck, player: 'Tester', creature, history: opts.history });
  const errors: string[] = [];
  let guard = 0;
  while (s.stage !== 'ending' && guard++ < 50) {
    const v = currentBeat(s);
    if (!v.choices.length) { errors.push(`no choices at ${v.template.id}`); break; }
    const i = opts.pick ? opts.pick(v.choices.length, r) : r.int(v.choices.length);
    s = choose(s, v.choices[i].choice.id);
    errors.push(...validateState(s));
    s = advance(s);
    errors.push(...validateState(s));
  }
  const ending = composeEnding(s, opts.recentEndings);
  const memory: RunMemory = { mode, planTokens: planTokens(s.plan), pathTokens: pathTokens(s), ending: ending.id, templates: s.plan.beats.map((b) => b.template) };
  return { state: s, ending, memory, errors };
}
