# PROJECT BRIEF — BSC BioLab: What The Beast?! (read this first)

> Handover file for any Claude session (or person) continuing this project. Keep it updated after every work session.
> Language with the designer: **Kuwaiti dialect or Modern Standard Arabic only** (never Iraqi or other dialects).

## 1. Who / what
- **Game designer:** عبدالله شويع — Biological Sciences Club (BSC), Kuwait University. Partner: **Marine Science Club**.
- **Repo:** https://github.com/q8hitman/BSCLUB-STORY- (target: GitHub Pages). **Nothing pushed yet — always ask before pushing.**
- **Required footer, exact text:** `تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية`
- **Logos:** `public/brand/bsc-logo.webp`, `public/brand/marine-science-club-logo.png` — must appear in the game (Marine logo whenever Marine mode is involved, incl. share card).

## 2. The designer's vision (from feedback on 2026-11-08 — this OVERRIDES the v1 build)
1. **Short, cinematic visual novel.** Quality, direction and atmosphere matter more than system complexity.
2. **Art style: NOT cartoony.** Painterly, moody, "trendy / Instagram-story-worthy". Reference: `docs/references/deep-sea-style-01.webp` and `-02.webp` (dark gouache-style deep-sea paintings, bioluminescent dots, a bathysphere lit by a beam, fanged fish emerging from black). Use as **style inspiration only — do not copy or ship these images.**
3. **Scenes are full illustrated images** of places/environments and the creatures met there. They do **not** need to show the player's hybrid; the player should *imagine* their creature inside the scene.
4. **Deep sea = mystery + horror (age-appropriate).** Creatures should be unsettling: the unknown scares.
5. **Exactly 4 choices per scene** (confirmed).
6. **Duck characters keep their real names** (image → name): 1 عبدالله (Abdullah), 2 الجمل (Al-Jamal), 3 علي (Ali), 4 بسام (Bassam), 5 كيراز (Kiraz), 6 رؤى (Roaa), 7 دكتورة زهراء (Dr. Zahra). Done in `src/content/ducks.ts`.
7. **Menus must be redesigned** — current ones were judged poor.
8. Creature naming was confusing (e.g. "الغامض قلوب" is an auto-generated *creature* name from a prefix+suffix list, not a character). Make naming clear and the generator better.
9. Learning from other games is fine (inspiration, not copying).

## 3. What exists (v1, built 2026-11-08)
React + Vite + TS, PWA (works offline), no backend, localStorage only. 67 tests passing (`npm test`), 1,000-run simulations per mode → `reports/diversity.md`.
- `src/engine/` deterministic planner + state machine, checks, Ending Composer, anti-repetition history, optional AI client (validated, rate-limited, static fallback), storage.
- `src/content/` parts, ducks, biomes/facts/NPCs, story beats (classic / marine / common).
- `src/art/painter.ts` painterly canvas renderer (gouache-on-dark-paper look): 16 biomes + every event prop + deep-sea creatures (dragonfish, angler, gulper, jellies, giant squid eye, the legend's giant, bathysphere). Preview offline: `npx tsx scripts/render-scenes.ts <outDir> midnight:angler trench:leviathan`.
- `src/art/creatureSvg.ts` the player's hybrid (shown as an inked 'specimen' via the `#ink` SVG filter in index.html).
- `src/share/` 1080×1350 PNG share card with working QR.
- `worker/` optional Cloudflare Worker (Workers AI) — not deployed.
- `.github/workflows/deploy.yml` — test, build, deploy to Pages.

## 4. Planned v2 (agreed direction, pending designer answers)
- **Scene images:** a library of painted illustrations (one per biome × key event, ~30–45 images, 16:9 + mobile-safe crop). Source options: (a) designer generates with an image model using our prompt pack `docs/art-prompts.md`; (b) we script generation if the designer provides an image-API key (kept local, never in client code); (c) commissioned/hand-painted. Images live in `public/scenes/` and are referenced by beat id.
- **VN presentation:** full-bleed scene, slow Ken-Burns/parallax, letterbox bars, dialogue box with duck portrait, 4 choice cards, film grain + vignette, subtle ambient audio, cinematic transitions; reduced-motion respected.
- **Menus:** new title screen with both club logos, proper character select with real names/identities, clearer creature builder, settings.
- **Content:** rewrite story beats to 4 choices each; deep-sea horror/mystery pass; creature encounters described vividly.

## 5. Open questions for the designer
- Personality line per duck (roles currently inferred from the artwork).
- Scene images: designer chose FREE. Free web generators tested (pollinations free tier = weak model + watermark, 1 img/45 s) → rejected. Current plan: painterly procedural canvas renderer in code; optional upgrade = local Stable Diffusion (Fooocus/ComfyUI on the designer's GPU, free) to pre-render scenes into `public/scenes/`.

## 5b. Decisions made (2026-11-08, session 2)
- Free scene art: pollinations.ai free tier rejected (watermark, weak model, 1 img/45 s). Built the procedural painter instead. Optional upgrade still open: local Stable Diffusion on the designer's GPU → pre-rendered `public/scenes/*.webp`.
- VN presentation: full-bleed painting (desktop) / painted band on top (phones), slow drift, film grain, letterbox, glass dialogue box with the duck, 4 numbered choice cards (keys 1–4, Enter continues).
- Theme: dark, gold + sea-glass accents; fonts Cormorant Garamond (EN display), Reem Kufi (AR display), Tajawal (AR body).
- Creature names are now epithets ("Ghost of the Dunes" / "شبح الكثبان") with an explanatory hint.
- Engine shows exactly 4 choices: up to 2 anatomy/state-unlocked + open ones (`pickChoices` in story.ts).

## 5c. Designer feedback round 3 (2026-11-08) — applied
- Duck catchphrases were "cringe" → removed. Ducks now say short, natural reactions only after outcomes (`MOOD_LINES`), and often stay silent before a choice.
- Logos: keep the ORIGINAL colours incl. black (designer rejected recolouring), no white box → use `public/brand/*-transparent.png` everywhere: original colours, white removed, NO glow/halo (designer said they read fine without it). Originals in `docs/brand-originals/`.
- Logo rules: Marine Science Club appears **only in Marine mode** (mode card, a collaboration intro card at the start of a Marine run, the Marine ending, the Marine share card). Title screen = BSC only. Every ending shows our logo (+ theirs in Marine) + the designer credit.
- Creature default names are lab designations ("Octopus Hybrid X-7" / "هجين أخطبوط X-7"); "شبح الطين" style names were confusing and are gone.
- Optional "save a picture of your creature" after naming it, and again at the ending (`renderCreaturePortrait` in `src/share/shareCard.ts`).

- Technical review for the ChatGPT discussion: `docs/TECHNICAL_REVIEW.md` (verified free-tier limits, recommended architecture, decisions to settle).

- v3 proposal (visual upgrade + live AI storytelling): `docs/V3_PROPOSAL.md`. AI eval harness: `scripts/ai-eval/` (needs GEMINI_API_KEY and/or CF_ACCOUNT_ID + CF_API_TOKEN; never commit keys). 20-adventure test still PENDING.

## 5d. Final characters, Duck Radio, plates (2026-11-08, session 3)
- **Final character sheets** (designer-approved, never redraw): originals in `art-source/ducks-final/` (abdullah, ahmed, camel, bassam, kiraz, roaa, zahra). Sliced (no redraw/masking) by `scripts/art/slice-ducks.py` into `public/ducks/<id>/expr-{happy,curious,shocked,worried,laughing,sly}.webp` + `pose-*.webp`; registry `src/content/duck-assets.json` → `src/content/ducks.ts`.
- **Ali → Camel (الجمل)**: Ali retired (old art archived in `art-source/ducks-v1-archive/`). Legacy save ids map via `DUCK_ALIASES` (pipette→camel, petri→abdullah, quill→ahmed, goggles→bassam, cherry→kiraz, lens→roaa, data→zahra).
- **Duck Radio** (`src/content/duckRadio.ts`, `src/engine/radio.ts`): per-duck voices, context cues (arrive/danger/deep/success/fail/discovery/theory/comic/disagree), a 3-duck crew per run, speaks ~1/3–1/2 of moments, never reveals the right choice.
- **Creature status panel** (`src/ui/CreaturePanel.tsx`, `src/engine/condition.ts`): feeling, energy, marks (mud/frost/dust/wet/glow/soot/scratches/fatigue) masked onto the creature's silhouette, highlighted trait, reaction line.
- **Scene plates**: 57 curated SDXL plates in `public/scenes/` + tags `src/content/plates.json`; strict event matching (`src/art/plates.ts`), else the procedural canvas painter. Coverage report: `npx tsx scripts/art/coverage.ts` (74% of beat×biome slots).
- **Bestiary**: `src/content/bestiary.ts` (35 animals/creatures, each linked to existing art); exposed to the AI catalog.
- **Designer constraint (latest)**: no dependence on the designer's PC for future art → new art should come from the in-browser canvas painter; the existing 57 SDXL plates are static files already in the repo (decision to keep them is pending with the designer).

## 5e. Night session (2026-11-08, session 4)
- **Companion gender**: ducks have `gender` (m: abdullah, ahmed, camel, bassam; f: kiraz, roaa, zahra). Story text uses `{duck}` + `{g:masc|fem}` (resolved in `fill()` and the Ending Composer). Never write «البطة» for the companion.
- **Legends** (`src/content/legends.ts`): 12 ORIGINAL creatures (6 land, 6 sea) with lore/signs/rules/glimpse, fiction-labelled. Rare sightings (~30% of runs, max one, place-matched) via `src/engine/sighting.ts`; recorded in `SaveData.legendsSeen`; **Book of Legends** screen (`src/ui/LoreBook.tsx`) from the title. Bu Sahn = the sailor legend's giant.
- **Art**: designer allowed ComfyUI on their PC except while they play. 115 curated plates now (`scripts/comfy/export-plates.py` lists every pick/reject); legend art tagged `event: "lore"` (never used as ordinary scenes). Coverage 98% (gaps: vents cross/rescue, seagrass lm-tale).
- **Bestiary** 45 animals. **Creature art**: added gradient volume, rim light, grain, ground shadow — still the weakest visual (needs painted parts).

## 6. Session log
- 2026-11-08 — v1 built and tested, pushed to GitHub `main`, Pages enabled (https://q8hitman.github.io/BSCLUB-STORY-/).
- 2026-11-08 — v2 started: real duck names, painterly scenes, cinematic VN UI, new menus, logos, 4 choices, deep-sea horror rewrite. Designer feedback received (section 2). Logos + references added. Work lives in a temporary session folder — move to a permanent folder before continuing.
- 2026-11-08 — Ducks are companions only (no perks). Adaptive Duck Radio: engine-computed hints when struggling, praise/real facts when thriving. Duck lines rewritten for consistency: approach hints are full imperative phrases (no awkward noun slots like «روحوا على الحذر»), team always addressed in plural, chat lines never assume the chosen approach. API keys: never in the client or chat — stored only as Cloudflare Worker secrets set by the designer.
- 2026-11-08 — Live AI evaluation with the designer's Gemini key (stored outside the repo). 2.5-flash-lite retired → 3.5-flash-lite. Round 2: 18/20 adventures complete, 93% beats valid first try, no quota errors; free quota = 500 req/day/model. Arabic needs polish; rules added. Results: docs/AI_EVAL_RESULTS.md.
- 2026-11-08 — Major corrective pass: (1) creature renderer v2 (src/art/creatureSvg.ts): body plans per animal, single-silhouette union outline, shared lighting, fur/scale/feather/plate textures, head redrawn over the body so head/body always read, 8 expressions (FEELING_EXPRESSION) and painted condition marks; used in builder (reaction strip), status panel, ending and share card; before/after in docs/creature-redesign/. (2) Story: MSA Arabic everywhere, bridge lines between scenes, clue payoffs in twist/climax, earned endings (tests). (3) Story creatures are shown: BeatView.featured + animalArt() + scene "specimen card"; 41 new bestiary animals are ART_PENDING (prompts in side-session notes narrative-pass.md). (4) UI pass on all key screens; Classic = BSC logo only, Marine = BSC × Marine. 100 tests green.
- 2026-11-09 — Art batch on the designer's PC (ComfyUI/SDXL, dark specimen + scene styles, reviewed by eye, ~60% keep rate): 81 animal close-ups (every story animal now has a picture; only the hatchetfish still has none), 79 new scene plates (every biome now has signal/discovery/encounter/evidence/challenge/suspense/comic/finale), 47 builder-option pictures (public/parts; only "Lantern eyes" has none). Scene plates are cached on first view instead of precached (install ~4.8 MB).
- 2026-11-09 — Designer feedback round: mission briefing before the first scene (premise, per-story goal from each hook's `goal`, how to play); the creature is an animal that never speaks (texts fixed, AI prompt rule, validator `creature-speaks`, test); white-text BSC logo (public/brand/bsc-logo-white.png) on all dark UI; companion card centred with the art blended into the card, Roaa's portrait cleaned of the neighbouring drawing's ponytail; companion titles rewritten (no "gothic"). Open: an equal-power companion specialty (designer to pick an idea), soundtrack later.
- 2026-11-09 — Explorer Passport + Journal pass. (1) BSC Explorer Passport (src/share/passport.ts, ui/Passport.tsx): 1080×1920 card with the real creature, name, optional display name, companion, 7-part anatomy, mode + logos rule, progress, a programmatic QR (black on white, quiet zone), the exact credit line; fullscreen + PNG save; opened from ▦ in the story HUD and from the ending. (2) Cross-device saves (engine/save.ts, docs/PASSPORT_SAVES.md): self-contained, versioned, checksummed #s= link that REPLAYS the decisions through the deterministic engine; history-dependent picks are pinned; content changes fail safely (never a different story). No cloud storage used (Workers KV option evaluated, not built). (3) Shared booth: New Visitor reset, no pre-filled names, the code is removed from the URL after reading. (4) Duck Radio: Specialty Field Notes (35 real-science notes, 5 per duck) + hunches from each duck's temperament that can be wrong (old always-correct hints removed). (5) Explorer Journal (engine/journal.ts, ui/Journal.tsx): bestiary of animals actually met, rare & legendary, endings gallery (real personalised endings), 14 achievements, field notes, discoveries. (6) Content: Mystery Board (engine/clues.ts), Adventure Memories recap on the ending, camp moments (content/beatsCamp.ts), Quick Story / Full Adventure, mood (balanced / light / mystery / surprise), 32 hidden-encounter creatures (content/rare.ts; real, fantasy, myth-inspired; only appear with matching senses and reviewed art). (7) Builder cards show source animal + unlocked abilities. (8) ComfyUI batch 4: rare creatures, camp scenes, ending illustrations (scripts/comfy/make-batch4.py, picks-batch4.json, export-batch4.py).
- 2026-11-09 (later) — **Story Archive + Story Factory** (`docs/STORY_FACTORY.md`):
  - Branching story graphs run through the same engine (`src/engine/archive.ts`), with immutable versions locked by `src/stories/catalog.json` and a validator (`src/engine/archiveValidate.ts`).
  - Production scripts: `scripts/factory/generate.ts` (Gemini, budgeted, drafts saved as "review") and `publish.ts`.
  - Published, hand-written: `silent-ridge@1` (Classic) and `lantern-wreck@1` (Marine). Gemini drafts awaiting review: `deep-glow-caves@1` and `trench-whispers@1`. Their text is generic and the science vague, so they need editing before publishing.
  - Adventure Memory (`src/engine/memory.ts`, narrative fingerprints) is per device. Living World (`w:*` flags, `plateWhen` image swaps, a "world changed" banner, a journal list). Cinematic moments (`cinematic` on nodes, reduced-motion respected).
  - Creature Test Lab (`src/ui/TestLab.tsx`, `src/content/testLab.ts`). Layered title screen with Passport and Settings buttons; Journal "Adventures" tab.
  - QR saves carry `id@v`; codes from before the update are tested in `tests/fixtures/saves-2026-11-09.json`. 130 tests.
  - NOT done: dedicated before/after ComfyUI art (existing plates reused), the full redesign of all 16 screens, a real phone-camera scan.
- 2026-11-10 — **Booth pass before the Thursday event (2026-11-12)**, found by playing the live site at phone size (375×812) and at 1366×768. NOT pushed yet (ask first).
  - Fixed: the ending screen was 980px wide on phones (the memories strip stretched the card), so the ending, share card and buttons were cut off sideways.
  - Fixed: builder on phones — the six mood previews drew the whole creature outside their cells and sat on top of the pinned creature stage; the stage's shadow also hid the screen heading.
  - Default creature name now follows the base animal when it is changed (`renameForBase`; a typed name is never touched). Test added (131 tests).
  - Mode screen: Quick story is the default length; picking an archive story switches off the other mode's card (before, the pick was silently ignored).
  - Ending screen: a "New visitor" button (same confirm dialog as the title).
  - Bridge lines between scenes: more variants (the same sentence used to repeat 3–4 times in one run). Display text only; saves replay the same.
  - Arabic: «انضافت لكتاب الأساطير» → «أُضيفت هذه الأسطورة إلى كتاب الأساطير». Briefing background made opaque (HUD text showed through).
  - Still open: a real phone-camera scan of the Passport QR; auto-names can wrap at the hyphen ("R-" / "32") in narrow choice cards.
- 2026-11-11 — **Booth pass 2 (designer feedback with screenshots, event on 2026-11-12).** 132 tests green.
  - **QR opened as plain text on a Samsung S21 FE.** The link was ~450 characters with the save in `#s=`. Now: compact save format v2 (`src/engine/save.ts`: list positions instead of ids, default names packed, a 2-character content stamp so a content change still fails safely) and an ordinary link `?s=…` (~130–160 characters, much bigger QR modules). Old `#s=` / v1 codes still open (tested). The code is removed from the address bar after reading. NOT yet confirmed on the designer's phone.
  - Passport card: the creature is scaled to fit its window (tall creatures covered the header). Restore screen has a "save picture" button.
  - Tap-to-enlarge (`ZoomCard` in `ui/common.tsx`): scene animal card, rare encounter, legend glimpse and the player's creature panel open a large picture with plain-language lines (what it is, where it lives, real fact, real/fictional; for the creature: every part with its description).
  - Scenes show what the text talks about: `TEMPLATE_PLATES` in `src/art/plates.ts` names a plate per template (per place where needed); the unknown giant's climax shows `legend-bu-sahn` and its card uses the same art (it used to show a random deep-sea fish and a ship).
  - Result screens repeat the decision ("You chose: …"). Rare/legend cards are bigger.
  - Plain words: place names simplified (Muddy Shore, Dim Waters, Dark Depths, Hot Springs of the Seabed, Deepest Trench, Frozen Plains…), hard terms replaced or explained.
  - Sea logic: the marine briefing explains the diving suit and the submarine; shared challenge scenes offer land-only choices on land and new sea choices under water (`LAND_ONLY` / `SEA_CHOICES` at the end of `beatsCommon.ts`; `placeOnly` / `openChoices` in `story.ts`). The failure line no longer quotes a part's land-specific trade-off.
  - Builder: mood faces labelled; clipping fix from pass 1 confirmed at 1024×768.
  - Still open: archive stories (`src/stories/*`) were not reworded (versions are locked); builder part pictures that are greyscale crops (camel, octopus) need new art.
- 2026-11-11 (later) — Read the `awesome-gamedev-agent-skills` catalogue the designer pointed to (not installed; `game-feel`, `game-ui-ux` and others from it were already on this machine) and applied what fits a visual novel: **Story log** (📜 in the scene bar: every scene so far with its text, the choice and the result, rebuilt from the run so it survives refresh and QR restore), small result feedback (counters pop, a setback nudges the box once; reduced-motion respected), builder part pictures show the whole animal, clear place names for Story Archive scenes (`SCENE_PLACE` in `story.ts`). The control room turning into a glowing tank after power is restored is the Living World swap, kept as designed.
