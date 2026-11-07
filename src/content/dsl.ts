// Tiny helpers so story content stays readable.
import type { Capability, Choice, ChoiceCheck, Cond, DuckMood, Effect, L10n, Outcome, StatKey, Style } from '../engine/types';

export const L = (en: string, ar: string): L10n => ({ en, ar });
export const O = (en: string, ar: string, mood: DuckMood, effects: Effect[] = [], fx?: string): Outcome => ({ text: L(en, ar), mood, effects, fx });

export const ev = (id: string): Effect => ({ t: 'evidence', id });
export const fl = (id: string): Effect => ({ t: 'flag', id });
export const di = (id: string): Effect => ({ t: 'discovery', id });
export const rel = (npc: string, d: number): Effect => ({ t: 'rel', npc, d });
export const en = (d: number): Effect => ({ t: 'energy', d });
export const tr = (d: number): Effect => ({ t: 'trust', d });

export const chk = (stat: StatKey, dc: number, caps?: Capability[]): ChoiceCheck => ({ stat, dc, caps });

export function C(id: string, label: L10n, style: Style, success: Outcome, opts: { fail?: Outcome; check?: ChoiceCheck; requires?: Cond } = {}): Choice {
  return { id, label, style, success, ...opts };
}
