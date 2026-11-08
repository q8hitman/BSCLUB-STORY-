// Validators: structure, asset compatibility, meaningful choices, anatomy consistency,
// science (facts only by id), and Arabic dialect checks. Every problem is reported, never silently fixed.
import { PAINT_PROPS } from '../../src/art/painter';
import { PLATE_LIST } from '../../src/art/plates';
import { ANIMAL_BY_ID } from '../../src/content/bestiary';
import { LEGEND_BY_ID } from '../../src/content/legends';
import { FACT_BY_ID, NPC_BY_ID } from '../../src/content/world';
import type { BiomeId, Capability, Mode } from '../../src/engine/types';
import { CLASSIC_BIOMES, CREATURE_STATES, EFFECT_TYPES, MARINE_DEEP, MARINE_SURFACE, MARKS, MOODS, STATS, STYLES, TONES, type AiBeat, type AiEnding, type L, type Outline } from './contract';

const AR = /[؀-ۿ]/;
// Markers of dialects the designer does NOT want (MSA; ducks may keep a light touch). Heuristic: flags, doesn't prove.
const OTHER_DIALECTS: [string, RegExp][] = [
  ['egyptian', /(^|\s)(عايز|عاوز|ازاي|إزاي|دلوقتي|كده|كدا|بتاع|ليه كده|اوي|أوي)(\s|$|[.،!؟])/],
  ['levantine', /(^|\s)(هلق|هلأ|هيك|كتير منيح|شو بدك|منيح|بدّي|عم ب)(\s|$|[.،!؟])/],
  ['iraqi', /(^|\s)(شكو|ماكو|هواية|اكو|أكو|ديروح|شلون جان|كلش|يابه)(\s|$|[.،!؟])/],
  // Heavy Gulf slang: the designer asked for MSA in everything the player reads.
  ['heavy-gulf', /(^|\s)(وايد|شنو|جذي|يبي|هني|للحين|عشان)(\s|$|[.،!؟])/],
];
const PLATE_IDS = new Set(PLATE_LIST.map((p) => p.id));
/** Marine depth order: the story only ever goes down (surface → open sea → twilight → midnight/vents → trench). */
const DEPTH: Partial<Record<BiomeId, number>> = { lab: 0, reef: 1, mudflat: 1, seagrass: 1, openSea: 2, twilight: 3, midnight: 4, vents: 4, trench: 5 };

function checkAnimal(where: string, id: unknown, biome: BiomeId | undefined, out: Issues) {
  if (id == null) return;
  const a = typeof id === 'string' ? ANIMAL_BY_ID[id] : undefined;
  if (!a) { out.errors.push(`${where}: animal "${String(id)}" is not a bestiary id (only bestiary animals can be shown)`); return; }
  if (biome && !a.biomes.includes(biome)) out.warnings.push(`${where}: ${a.id} does not live in ${biome}`);
}

const okL = (x: unknown): x is L => !!x && typeof (x as L).en === 'string' && typeof (x as L).ar === 'string' && (x as L).en.trim().length > 1 && (x as L).ar.trim().length > 1;

export interface Issues { errors: string[]; warnings: string[] }
const issues = (): Issues => ({ errors: [], warnings: [] });

function checkText(where: string, t: unknown, out: Issues, maxLen = 700) {
  if (!okL(t)) { out.errors.push(`${where}: missing en/ar`); return; }
  if (!AR.test(t.ar)) out.errors.push(`${where}: ar has no Arabic`);
  if (AR.test(t.en)) out.warnings.push(`${where}: en contains Arabic`);
  if (t.en.length > maxLen || t.ar.length > maxLen) out.warnings.push(`${where}: too long`);
  for (const [name, re] of OTHER_DIALECTS) if (re.test(t.ar)) out.warnings.push(`${where}: possible ${name} dialect`);
  if (/https?:\/\//.test(t.en + t.ar)) out.errors.push(`${where}: URL`);
}

export function validateOutline(o: Outline, mode: Mode): Issues {
  const out = issues();
  if (!o || typeof o !== 'object') { out.errors.push('outline: not an object'); return out; }
  checkText('title', o.title, out, 90); checkText('premise', o.premise, out);
  if (!TONES.includes(o.tone)) out.errors.push(`tone ${o.tone}`);
  if (!o.premise_tag || !o.twist_tag) out.errors.push('missing premise_tag/twist_tag');
  if (!Array.isArray(o.acts) || o.acts.length < 7 || o.acts.length > 12) { out.errors.push(`acts: ${o.acts?.length}`); return out; }
  const allowed = mode === 'classic' ? CLASSIC_BIOMES : [...MARINE_SURFACE, ...MARINE_DEEP];
  const planted = new Set<string>(); let seenDeep = false; let legends = 0; let depth = 0;
  o.acts.forEach((a, i) => {
    if (!allowed.includes(a.biome)) out.errors.push(`act ${i}: biome ${a.biome} not in catalog`);
    (a.props ?? []).forEach((p) => { if (!PAINT_PROPS[p]) out.errors.push(`act ${i}: prop ${p} not in catalog`); });
    if (a.animals != null && !Array.isArray(a.animals)) out.errors.push(`act ${i}: animals must be an array of bestiary ids`);
    (Array.isArray(a.animals) ? a.animals : []).forEach((id) => checkAnimal(`act ${i}`, id, a.biome, out));
    if (a.plate != null && !PLATE_IDS.has(a.plate)) out.errors.push(`act ${i}: plate ${a.plate} is not a real asset`);
    if (a.legend != null) {
      const lg = LEGEND_BY_ID[a.legend];
      if (!lg) out.errors.push(`act ${i}: legend ${a.legend} unknown`);
      else if (!lg.biomes.includes(a.biome)) out.errors.push(`act ${i}: legend ${a.legend} does not belong in ${a.biome}`);
      if (++legends > 1) out.errors.push(`act ${i}: more than one legend glimpse`);
    }
    if (a.npc && !NPC_BY_ID[a.npc]) out.errors.push(`act ${i}: npc ${a.npc} unknown`);
    if (a.plants_clue) planted.add(a.plants_clue);
    if (a.pays_off && !planted.has(a.pays_off)) out.errors.push(`act ${i}: pays off "${a.pays_off}" before it was planted`);
    if (mode === 'marine') {
      const deep = MARINE_DEEP.includes(a.biome);
      if (deep) seenDeep = true; else if (seenDeep && a.biome !== 'openSea') out.errors.push(`act ${i}: back to surface after The Deep`);
      const d = DEPTH[a.biome] ?? depth;
      // Consecutive acts never climb back up between deep zones (twilight → midnight is fine; midnight → twilight is not).
      if (i > 0 && d < depth && d >= 3) out.errors.push(`act ${i}: climbs from depth ${depth} back up to ${a.biome}`);
      if (i > 0 && d - depth > 3) out.warnings.push(`act ${i}: jumps straight from ${o.acts[i - 1].biome} to ${a.biome}`);
      depth = Math.max(depth, d);
    }
  });
  if (mode === 'marine' && !seenDeep) out.errors.push('marine: never reaches The Deep');
  if (mode === 'marine' && !MARINE_DEEP.includes(o.acts[o.acts.length - 1].biome)) out.warnings.push('marine: finale not in The Deep');
  if (new Set(o.acts.map((a) => a.biome)).size < 3) out.warnings.push('fewer than 3 distinct places');
  return out;
}

export function validateBeat(b: AiBeat, caps: Set<Capability>, knownEvidence: Set<string>, biome?: BiomeId): Issues {
  const out = issues();
  if (!b || typeof b !== 'object') { out.errors.push('beat: not an object'); return out; }
  checkAnimal('beat.featured_animal', b.featured_animal, biome, out);
  checkText('beat.text', b.text, out); checkText('beat.duck_line', b.duck_line, out, 160);
  if (b.fact_id && !FACT_BY_ID[b.fact_id]) out.errors.push(`fact ${b.fact_id} invented (science must come from the fact catalog)`);
  if (!Array.isArray(b.choices) || b.choices.length !== 4) { out.errors.push(`choices: ${b.choices?.length} (need 4)`); return out; }
  const labels = new Set<string>(); const styles = new Set<string>();
  b.choices.forEach((c, i) => {
    const w = `choice ${i}`;
    checkText(`${w}.label`, c.label, out, 120);
    if (labels.has(c.label?.en?.toLowerCase())) out.errors.push(`${w}: duplicate label`); labels.add(c.label?.en?.toLowerCase());
    if (!STYLES.includes(c.style)) out.errors.push(`${w}: style ${c.style}`); styles.add(c.style);
    if (c.uses_capability && !caps.has(c.uses_capability as Capability)) out.errors.push(`${w}: uses capability "${c.uses_capability}" the creature does not have`);
    if (c.check) {
      if (!STATS.includes(c.check.stat)) out.errors.push(`${w}: stat ${c.check.stat}`);
      if (typeof c.check.dc !== 'number' || c.check.dc < 2 || c.check.dc > 9) out.errors.push(`${w}: dc ${c.check.dc} out of 2..9`);
      if (!c.fail) out.errors.push(`${w}: checked choice without fail outcome`);
    }
    for (const [k, o] of [['success', c.success], ['fail', c.fail]] as const) {
      if (!o) continue;
      checkText(`${w}.${k}`, o.text, out);
      // Cosmetic enums only pick an expression/pose: normalise to a safe default (as the Worker will) and warn.
      if (!MOODS.includes(o.duck_mood)) { out.warnings.push(`${w}.${k}: mood ${o.duck_mood} → thinking`); o.duck_mood = 'thinking'; }
      if (!CREATURE_STATES.includes(o.creature_state)) { out.warnings.push(`${w}.${k}: creature_state ${o.creature_state} → curious`); o.creature_state = 'curious'; }
      for (const e of o.effects ?? []) {
        if (!EFFECT_TYPES.includes(e.t)) out.errors.push(`${w}.${k}: effect ${e.t}`);
        if (e.t === 'discovery' && !FACT_BY_ID[e.id ?? '']) out.errors.push(`${w}.${k}: discovery ${e.id} not a real fact id`);
        if (e.t === 'rel' && !NPC_BY_ID[e.npc ?? '']) out.errors.push(`${w}.${k}: rel npc ${e.npc}`);
        if (e.t === 'mark' && !MARKS.includes(e.id as never)) out.errors.push(`${w}.${k}: mark ${e.id}`);
        if ((e.t === 'energy' || e.t === 'trust' || e.t === 'rel') && (typeof e.d !== 'number' || Math.abs(e.d) > 3)) out.errors.push(`${w}.${k}: delta ${e.d}`);
      }
    }
    if (c.fail && c.success && c.fail.text?.en === c.success.text?.en) out.errors.push(`${w}: success == fail`);
    if (!c.success?.effects?.length && !c.fail?.effects?.length) out.warnings.push(`${w}: no consequences`);
  });
  if (styles.size < 3) out.warnings.push('choices: fewer than 3 distinct styles (not meaningfully different)');
  // continuity: text shouldn't claim evidence that was never collected
  const mentioned = (b.text?.en ?? '').match(/\[evidence:([\w-]+)\]/g) ?? [];
  mentioned.forEach((m) => { const id = m.slice(10, -1); if (!knownEvidence.has(id)) out.errors.push(`references uncollected evidence ${id}`); });
  return out;
}

/** planted: clue ids the outline planted. When any were planted, the ending must pay off at least one of them (and invent none). */
export function validateEnding(e: AiEnding, planted: string[] = []): Issues {
  const out = issues();
  checkText('ending.title', e?.title, out, 90); checkText('ending.summary', e?.summary, out, 1200); checkText('ending.epilogue', e?.epilogue, out);
  if (planted.length) {
    const paid = Array.isArray(e?.pays_off_clues) ? e.pays_off_clues : [];
    if (!paid.some((c) => planted.includes(c))) out.errors.push(`ending: pays off none of the planted clues (${planted.join(', ')})`);
    paid.filter((c) => !planted.includes(c)).forEach((c) => out.errors.push(`ending: clue "${c}" was never planted`));
  }
  if (e?.summary?.en && e.summary.en.length < 200) out.warnings.push('ending: summary is very short');
  if (e && !TONES.includes(e.tone)) { out.warnings.push(`ending tone ${e.tone} → heroic`); e.tone = 'heroic'; }
  return out;
}
