// Story Archive: published, versioned, branching adventures produced offline by the Story Factory.
//
// A package is a graph of scene nodes. Each node is played by the SAME engine as the procedural stories
// (4 choices, anatomy-gated options, checks, Duck Radio, creature panel): registerStory() turns every node
// into an ordinary BeatTemplate whose outcomes carry `next`. State variables (flags, evidence, world flags
// "w:*", relationships) persist across branches, so reconverging paths keep earlier consequences.
//
// Immutability: a published (id, version) never changes. tests/archive.test.ts checks every package against
// src/stories/archive.lock.json, so editing a published file fails the build — publish a new version instead.
// Older versions stay in src/stories/ so QR saves made with them keep restoring exactly.
import { BEAT_BY_ID, startFromPlan, type StartOptions } from './story';
import { BEAT_BY_ID_REF } from '../art/plates';
BEAT_BY_ID_REF.get = (id) => BEAT_BY_ID[id]?.plate;
import type { BeatTemplate, BiomeId, Cond, Ending, GameState, L10n, Mode } from './types';

export type StoryTone = 'adventure' | 'mystery' | 'suspense' | 'comedy' | 'investigation' | 'strange';
export interface StoryNode extends Omit<BeatTemplate, 'id' | 'mode' | 'biomes'> { biome: BiomeId }
export interface StoryEnding { tone: Ending['tone']; title: L10n; summary: L10n; epilogue: L10n; plate?: string }
export interface StoryPackage {
  id: string;
  v: number;
  status: 'published' | 'review' | 'retired';
  mode: Mode;
  title: L10n;
  premise: L10n;
  tone: StoryTone;
  /** Narrative fingerprint inputs: what the story is ABOUT, independent of its wording. */
  tags: { themes: string[]; locations: BiomeId[]; twist: string; creatures: string[] };
  start: string;
  nodes: Record<string, StoryNode>;
  endings: Record<string, StoryEnding>;
  /** Living World flags this story can set, with a short label for the journal ("w:power" → "Station power restored"). */
  world?: Record<string, L10n>;
  /** Real-science reference ids (FACTS) the story relies on. */
  science?: string[];
  /** Who/what produced it: 'hand' or 'factory:<model>'. */
  source?: string;
}

const REG = new Map<string, StoryPackage>();
export const storyKey = (id: string, v: number) => `${id}@${v}`;
export const nodeTemplateId = (p: Pick<StoryPackage, 'id' | 'v'>, node: string) => `${p.id}@${p.v}:${node}`;

export function registerStory(p: StoryPackage): StoryPackage {
  const key = storyKey(p.id, p.v);
  if (REG.has(key)) return REG.get(key)!;
  REG.set(key, p);
  for (const [nid, n] of Object.entries(p.nodes)) {
    const t: BeatTemplate = {
      ...n, id: nodeTemplateId(p, nid), mode: p.mode, biomes: [n.biome],
      choices: n.choices.map((c) => ({
        ...c,
        success: { ...c.success, next: resolveNext(p, c.success.next) },
        ...(c.fail ? { fail: { ...c.fail, next: resolveNext(p, c.fail.next) } } : {}),
      })),
    };
    (BEAT_BY_ID as Record<string, BeatTemplate>)[t.id] = t;
  }
  return p;
}
function resolveNext(p: StoryPackage, next?: string): string | undefined {
  if (!next) return undefined;
  return next.startsWith('end:') ? `end:${p.id}@${p.v}:${next.slice(4)}` : nodeTemplateId(p, next);
}
export function getStory(id: string, v: number): StoryPackage | undefined { return REG.get(storyKey(id, v)); }
export function storyOf(s: Pick<GameState, 'plan'>): StoryPackage | undefined { return s.plan.story ? getStory(s.plan.story.id, s.plan.story.v) : undefined; }

export function startStory(o: Omit<StartOptions, 'history' | 'opts'>, p: StoryPackage, pins?: GameState['pins']): GameState {
  if (p.mode !== o.mode) throw new Error(`story ${p.id} is ${p.mode}`);
  registerStory(p);
  const startT = nodeTemplateId(p, p.start);
  return startFromPlan({
    ...o, pins, avoid: [],
    plan: { mode: p.mode, seed: o.seed, hook: startT, biomes: [...new Set(Object.values(p.nodes).map((n) => n.biome))], beats: [{ template: startT, biome: p.nodes[p.start].biome }], legend: false, story: { id: p.id, v: p.v } },
  });
}

/** The ending a finished archive run reached ("end:<id>@<v>:<ending>" flag set by advance). */
export function reachedEnding(s: Pick<GameState, 'flags' | 'plan'>): { story: StoryPackage; id: string; ending: StoryEnding } | null {
  const p = storyOf(s); if (!p) return null;
  const f = s.flags.find((x) => x.startsWith(`end:${p.id}@${p.v}:`)); if (!f) return null;
  const id = f.slice(f.lastIndexOf(':') + 1);
  return p.endings[id] ? { story: p, id, ending: p.endings[id] } : null;
}

/** Living World: the plate shown for a node depends on the world state the player has caused. */
export function nodePlate(t: BeatTemplate, holds: (c: Cond) => boolean): string | undefined {
  for (const w of t.plateWhen ?? []) if (holds(w.when)) return w.plate;
  return t.plate;
}

// ---------- fingerprints ----------
/** FNV-1a over a canonical JSON string (stable key order): the published content hash. */
export function contentHash(p: StoryPackage): string {
  const canon = (x: unknown): unknown => Array.isArray(x) ? x.map(canon) : x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, canon((x as Record<string, unknown>)[k])])) : x;
  // status is excluded: retiring a story (hiding it from new adventures) must not invalidate its saves
  const s = JSON.stringify(canon({ ...p, status: undefined }));
  let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36).padStart(7, '0');
}

/**
 * Structural fingerprint: a token set describing the SHAPE of the adventure (premise themes, places, twist,
 * creatures met, the sequence of scene kinds on its main path, how its endings feel) — not its words.
 * Two stories with different text but the same structure score high on jaccard and are treated as repeats.
 */
export function narrativeFingerprint(p: StoryPackage): string[] {
  const kinds: string[] = []; const seen = new Set<string>(); let cur: string | undefined = p.start;
  while (cur && !seen.has(cur) && p.nodes[cur]) { seen.add(cur); const n: StoryNode = p.nodes[cur]; kinds.push(n.kind); cur = n.choices[0]?.success.next; if (cur?.startsWith('end:')) break; }
  return [
    `mode:${p.mode}`, `tone:${p.tone}`, `twist:${p.tags.twist}`,
    ...p.tags.themes.map((t) => `theme:${t}`), ...p.tags.locations.map((b) => `loc:${b}`), ...p.tags.creatures.map((c) => `cr:${c}`),
    `arc:${kinds.join('>')}`, ...[...new Set(Object.values(p.endings).map((e) => e.tone))].map((t) => `end:${t}`),
  ];
}
