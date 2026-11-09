import { describe, expect, it } from 'vitest';
import { BEAT_BY_ID } from '../src/engine/story';
import { validateAiResponse } from '../src/engine/ai';
import { randomCreature } from '../src/engine/creature';
import { Rng } from '../src/engine/rng';

describe('mission briefing', () => {
  it('every opening scene states the run’s mission in both languages', () => {
    const hooks = Object.values(BEAT_BY_ID).filter((b) => b.kind === 'hook');
    expect(hooks.length).toBeGreaterThanOrEqual(7);
    for (const h of hooks) {
      expect(h.goal?.en, h.id).toBeTruthy();
      expect(h.goal?.ar, h.id).toMatch(/[؀-ۿ]/);
    }
  });
});

describe('the creature is an animal, not a talking character', () => {
  const c = { ...randomCreature(new Rng(1)), name: 'Ziko' };
  const req = { lang: 'en' as const, creature: c, place: 'Forest', base: 'x', success: true, recent: [] };
  it('rejects AI narration where the creature speaks', () => {
    expect(validateAiResponse({ narration: 'Ziko says the path is safe, and the team follows the ridge.' }, req)).toMatchObject({ ok: false, reason: 'creature-speaks' });
    expect(validateAiResponse({ narration: 'Ziko sniffs the ridge and growls, and the team follows the safer path.' }, req).ok).toBe(true);
  });
  it('no authored line makes the creature speak', () => {
    const SPEECH = /\{name\}\s+(says|said|asks|replies|answers|tells|whispers)\b|(قال|يقول|سأل|يسأل|أجاب|يجيب|همس|يهمس)\s+\{name\}/;
    for (const b of Object.values(BEAT_BY_ID)) {
      const texts = [b.text, ...(b.variants ?? []).map((v) => v.text), ...b.choices.flatMap((ch) => [ch.success.text, ...(ch.fail ? [ch.fail.text] : [])])];
      for (const t of texts) { expect(t.en, b.id).not.toMatch(SPEECH); expect(t.ar, b.id).not.toMatch(SPEECH); }
    }
  });
});
