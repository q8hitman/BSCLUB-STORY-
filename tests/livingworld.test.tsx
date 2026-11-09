import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Play } from '../src/ui/Play';
import { loadStory } from '../src/stories/index';
import { startStory } from '../src/engine/archive';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';
import { advance, choose, currentBeat } from '../src/engine/story';
import type { GameState } from '../src/engine/types';

afterEach(cleanup);
const settings = { lang: 'en' as const, textSpeed: 0, muted: true, reducedMotion: true, ai: false };

describe('Living World + cinematic presentation', () => {
  it('restoring station power shows a world-change banner and swaps the station painting', async () => {
    const p = (await loadStory('silent-ridge', 1))!;
    let found: { before: GameState; after: GameState } | null = null;
    for (let seed = 1; seed < 400 && !found; seed++) {
      let s = startStory({ mode: 'classic', seed, duck: 'zahra', player: '', creature: randomCreature(new Rng(seed), 'en') }, p);
      const go = currentBeat(s).choices.find((c) => ['wait', 'station', 'call'].includes(c.choice.id));
      if (!go) continue;
      s = advance(choose(s, go.choice.id)); // ridge → station
      const v = currentBeat(s);
      if (!v.choices.some((c) => c.choice.id === 'power')) continue;
      const after = choose(s, 'power');
      if (after.flags.includes('w:power')) found = { before: s, after };
    }
    expect(found).toBeTruthy();
    const r = render(<Play game={found!.after} setGame={() => {}} settings={settings} lang="en" onQuit={() => {}} />);
    expect(r.container.querySelector('.world-banner')?.textContent).toContain('Station power restored');
    // the station itself is repainted the moment the lights come back on
    expect([...r.container.querySelectorAll('.painted-img')].map((i) => i.getAttribute('src')).join()).toContain('lab-alarm-light');
    const next = advance(found!.after); // control room: its plate reflects the restored power
    r.rerender(<Play game={next} setGame={() => {}} settings={settings} lang="en" onQuit={() => {}} />);
    expect([...r.container.querySelectorAll('.painted-img')].map((i) => i.getAttribute('src')).join()).toContain('lab-glow-tank');
  });
  it('reveal scenes are presented as cinematic moments with a readable caption', async () => {
    const p = (await loadStory('lantern-wreck', 1))!;
    let s = startStory({ mode: 'marine', seed: 5, duck: 'zahra', player: '', creature: randomCreature(new Rng(5), 'en') }, p);
    s = advance(choose(s, 'dive')); // bay → twilight (phenomenon)
    const r = render(<Play game={s} setGame={() => {}} settings={settings} lang="en" onQuit={() => {}} />);
    expect(r.container.querySelector('.vn.cine-phenomenon')).toBeTruthy();
    expect(r.container.querySelector('.cine-caption')?.textContent).toBe('A rare phenomenon');
  });
});
