// Adventure Memory: choose the next adventure so a returning explorer meets new places, new mysteries and new kinds
// of story — using narrative fingerprints (premise, places, twist, creatures, arc shape), not text similarity.
// It only reads THIS device's Explorer Journal. (A Passport QR moves one adventure, not the journal, so memory is
// not synchronised across devices.)
import { currentStories } from '../stories/index';
import { narrativeFingerprint, storyOf } from './archive';
import type { Journal } from './journal';
import { Rng } from './rng';
import { jaccard } from './story';
import type { BiomeId, GameState, Mode } from './types';

const MODE_BIOMES: Record<Mode, BiomeId[]> = {
  classic: ['lab', 'forest', 'desert', 'mountain', 'cave', 'snow', 'swamp', 'ruins'],
  marine: ['reef', 'mudflat', 'seagrass', 'openSea', 'twilight', 'midnight', 'vents', 'trench'],
};

/** Structural fingerprint of a finished or running adventure (archive or generated). */
export function runFingerprint(s: GameState): string[] {
  const p = storyOf(s);
  if (p) return narrativeFingerprint(p);
  return [`mode:${s.mode}`, `hook:${s.plan.hook}`, `twist:${s.plan.twist ?? 'none'}`, ...s.plan.biomes.map((b) => `loc:${b}`), `tone:${s.plan.tone ?? 'balanced'}`];
}

export type AdventurePick = { kind: 'story'; id: string; v: number } | { kind: 'generated' };

export function pickAdventure(mode: Mode, j: Journal, rng: Rng, o: { replay?: string; generated?: boolean } = {}): AdventurePick {
  const stories = currentStories(mode);
  if (o.replay) { const e = stories.find((x) => x.id === o.replay); if (e) return { kind: 'story', id: e.id, v: e.v }; }
  const recent = (j.memory ?? []).slice(-8).map((m) => m.fp);
  const novelty = (fp: string[]) => 1 - Math.max(0, ...recent.map((r) => jaccard(fp, r)));
  const unexplored = (bs: BiomeId[]) => bs.filter((b) => !j.biomes.includes(b)).length;
  const cands: { pick: AdventurePick; w: number }[] = stories.map((e) => {
    const played = !!j.stories?.[e.id];
    return { pick: { kind: 'story', id: e.id, v: e.v }, w: ((played ? 0.2 : 3) + 0.3 * unexplored(e.locations) * (played ? 0.2 : 1)) * Math.max(0.15, novelty(e.fingerprint)) };
  });
  if (o.generated !== false) cands.push({ pick: { kind: 'generated' }, w: 1 + 0.25 * Math.min(4, unexplored(MODE_BIOMES[mode])) });
  if (!cands.length) return { kind: 'generated' };
  return rng.weighted(cands, (c) => c.w).pick;
}
