// Story Archive catalog. catalog.json is small and loaded with the app (it drives Adventure Memory and the
// archive list); each story package is its own lazily-loaded chunk, fetched only when that adventure starts
// or a QR save that needs it is opened. catalog.json is written by scripts/factory/publish.ts — never by hand.
import CATALOG from './catalog.json';
import { registerStory, type StoryPackage, type StoryTone } from '../engine/archive';
import type { BiomeId, L10n, Mode } from '../engine/types';

export interface CatalogEntry {
  id: string; v: number; status: 'published' | 'review' | 'retired'; mode: Mode; tone: StoryTone;
  title: L10n; premise: L10n; locations: BiomeId[]; themes: string[]; twist: string;
  endings: Record<string, L10n>; world: Record<string, L10n>; nodes: number; hash: string; fingerprint: string[]; publishedAt: string;
}
export const STORY_CATALOG = CATALOG as unknown as CatalogEntry[];
/** Newest published version of each story id (older versions stay loadable for saves). */
export function currentStories(mode?: Mode): CatalogEntry[] {
  const best = new Map<string, CatalogEntry>();
  for (const e of STORY_CATALOG) if (e.status === 'published' && (!mode || e.mode === mode) && (best.get(e.id)?.v ?? 0) < e.v) best.set(e.id, e);
  return [...best.values()];
}

const LOADERS = import.meta.glob<StoryPackage>(['./*@*.ts', './*@*.json'], { import: 'default' });
export async function loadStory(id: string, v: number): Promise<StoryPackage | null> {
  const key = Object.keys(LOADERS).find((k) => k === `./${id}@${v}.ts` || k === `./${id}@${v}.json`);
  if (!key) return null;
  return registerStory(await LOADERS[key]());
}
export async function loadAllStories(): Promise<StoryPackage[]> {
  return Promise.all(Object.values(LOADERS).map(async (l) => registerStory(await l())));
}
