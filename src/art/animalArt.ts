// Resolves the picture of a story creature (bestiary id) so the player can SEE the animal the text talks about.
// Priority: specimen plate (clean close-up) → event plate → procedural painter drawing. null = no art (reported by tests).
import { ANIMAL_BY_ID } from '../content/bestiary';
import { plateUrl } from './plates';

export interface AnimalArt { src: string; kind: 'specimen' | 'plate' | 'painter' }

export function animalArt(id: string | null | undefined): AnimalArt | null {
  const a = id ? ANIMAL_BY_ID[id] : null;
  if (!a) return null;
  if (a.art.specimen) return { src: plateUrl(a.art.specimen), kind: 'specimen' };
  if (a.art.plates.length) return { src: plateUrl(a.art.plates[0]), kind: 'plate' };
  if (a.art.painter) return { src: `painter:${a.art.painter}`, kind: 'painter' }; // UI renders via the canvas painter
  return null;
}
