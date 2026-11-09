// Story Factory — step 5: validate every package in src/stories/ and write the catalog (the archive lock).
//   npx tsx scripts/factory/publish.ts            → validate + write src/stories/catalog.json + reports/stories.md
//   npx tsx scripts/factory/publish.ts --check    → validate only (CI)
// Rules: a published (id, version) is immutable. If its content hash changed, publishing is refused: copy the file
// to <id>@<v+1>.ts, edit that, and keep the old file so QR saves made with it still restore exactly.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { contentHash, narrativeFingerprint, type StoryPackage } from '../../src/engine/archive';
import { validateStory } from '../../src/engine/archiveValidate';
import type { CatalogEntry } from '../../src/stories/index';

const DIR = 'src/stories';
const check = process.argv.includes('--check');
const plates = new Set((JSON.parse(fs.readFileSync('src/content/plates.json', 'utf8')) as { id: string }[]).map((p) => p.id));
const old: CatalogEntry[] = JSON.parse(fs.readFileSync(`${DIR}/catalog.json`, 'utf8'));

const files = fs.readdirSync(DIR).filter((f) => /^[a-z0-9-]+@\d+\.(ts|json)$/.test(f));
const pkgs: StoryPackage[] = [];
for (const f of files) {
  const full = path.resolve(DIR, f);
  pkgs.push(f.endsWith('.json') ? JSON.parse(fs.readFileSync(full, 'utf8')) : (await import(pathToFileURL(full).href)).default);
}
let bad = 0; const out: CatalogEntry[] = []; const md: string[] = ['# Story Archive report', '', '| Story | Status | Nodes | Endings | Distinct paths | Avg scenes | Endings reached (300 random builds) | Errors | Warnings |', '|---|---|---|---|---|---|---|---|---|'];
for (const p of pkgs) {
  const others = pkgs.filter((o) => o.id !== p.id && o.status === 'published');
  const r = validateStory(p, { plates, others });
  const hash = contentHash(p);
  const prev = old.find((e) => e.id === p.id && e.v === p.v);
  if (prev && prev.status === 'published' && prev.hash !== hash) r.errors.push(`published ${p.id}@${p.v} was modified (hash ${prev.hash} → ${hash}); publish a new version instead`);
  if (r.errors.length && p.status === 'published') bad++;
  console.log(`${r.id} [${p.status}] ${r.errors.length} errors, ${r.warnings.length} warnings`, r.stats);
  for (const e of r.errors) console.log('  ✗', e);
  for (const w of r.warnings) console.log('  ·', w);
  md.push(`| ${r.id} — ${p.title.en} | ${p.status} | ${r.stats.nodes} | ${r.stats.endings} | ${r.stats.paths} | ${r.stats.avgScenes} | ${Object.entries(r.stats.endingsReached).map(([k, v]) => `${k} ${v}`).join(', ')} | ${r.errors.length} | ${r.warnings.join('; ') || '—'} |`);
  out.push({
    id: p.id, v: p.v, status: r.errors.length ? (p.status === 'published' ? 'published' : 'review') : p.status, mode: p.mode, tone: p.tone,
    title: p.title, premise: p.premise, locations: p.tags.locations, themes: p.tags.themes, twist: p.tags.twist,
    endings: Object.fromEntries(Object.entries(p.endings).map(([k, e]) => [k, e.title])), world: p.world ?? {},
    nodes: r.stats.nodes, hash, fingerprint: narrativeFingerprint(p), publishedAt: prev?.publishedAt ?? new Date().toISOString().slice(0, 10),
  });
}
// a published version may never disappear: saves may point at it
for (const e of old) if (e.status === 'published' && !out.some((o) => o.id === e.id && o.v === e.v)) { console.log(`  ✗ published ${e.id}@${e.v} was deleted`); bad++; }
out.sort((a, b) => a.id.localeCompare(b.id) || a.v - b.v);
if (bad) { console.error(`\n${bad} published package(s) failed — catalog NOT written.`); process.exit(1); }
if (!check) {
  fs.writeFileSync(`${DIR}/catalog.json`, JSON.stringify(out, null, 1) + '\n');
  fs.mkdirSync('reports', { recursive: true }); fs.writeFileSync('reports/stories.md', md.join('\n') + '\n');
  console.log(`\ncatalog.json: ${out.length} entries`);
}
