# BSC BioLab: What The Beast?! · شنو هالوحش؟!

A bilingual (Arabic/English) browser game by the **Biological Sciences Club (BSC), Kuwait University**.
Build a hybrid creature, pick a duck assistant, and survive a branching visual-novel expedition — with real biology facts kept clearly separate from the fiction.

تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية

## Play flow
Enter the lab → choose a duck assistant → display name → build a hybrid (7 layered SVG parts, every trait has a trade-off) → name it (or randomize) → **Classic BioLab** or **Marine Science Club Mode** → branching story → personalised ending → PNG share card with a working QR code.

## Tech
- React + Vite + TypeScript, no backend required. Works fully offline after the first load (PWA service worker).
- No accounts. Settings, the current run and story history are stored in `localStorage` only.
- Fonts (Tajawal, Fredoka) are bundled — no external requests.

## Project layout
| Path | What |
|---|---|
| `src/engine/` | Deterministic narrative engine: planner, state machine, checks, Ending Composer, history/anti-repetition, optional AI client, storage |
| `src/content/` | Creature parts, ducks, biomes/facts/NPCs, story beats (`beatsClassic.ts`, `beatsMarine.ts`, `beatsCommon.ts`) |
| `src/art/` | Procedural SVG: creature renderer and parallax scene art for every biome and event prop |
| `src/share/` | 1080×1350 PNG share card (canvas) + QR |
| `public/ducks/` | The club's 7 duck mascot images (used unmodified) |
| `worker/` | Optional Cloudflare Worker for AI narration |
| `tests/` | Vitest suite incl. 1,000-run-per-mode simulation → `reports/diversity.md` |

## Commands
```bash
npm install
npm run dev        # http://localhost:5173/BSCLUB-STORY-/
npm test           # all tests + simulations, writes reports/diversity.{md,json}
npm run build      # production build in dist/
```

## Deploy (GitHub Pages)
`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is served at `https://q8hitman.github.io/BSCLUB-STORY-/` (set `BASE_PATH` if the repo is renamed).

## Optional AI narration
The game never needs AI. If enabled, AI only re-words text the engine already decided; the engine owns all state.
Every response is JSON-validated (schema, length, language, creature-name continuity, anatomy contradictions, outcome polarity), retried up to 2×, rate-limited, and falls back to the built-in text.

1. `cd worker && npx wrangler deploy` (uses the free Workers AI binding — no API key in the client).
2. Set repository variable `VITE_AI_ENDPOINT` to the Worker URL, then redeploy.
3. Players can switch “AI narration” on in Settings.

## Renaming ducks / editing story
Duck characters (Abdullah, Al-Jamal, Ali, Bassam, Kiraz, Roaa, Dr. Zahra) are fixed by the designer in `src/content/ducks.ts`. Story beats are plain data in `src/content/beats*.ts`; tests check both languages, placeholders, scene art and reachability.
