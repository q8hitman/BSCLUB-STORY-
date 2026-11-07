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
- `src/art/` procedural SVG creature + scene art (cartoony — **to be replaced by painted scene images**).
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

## 6. Session log
- 2026-11-08 — v1 built and tested (not pushed). Designer feedback received (section 2). Logos + references added. Work lives in a temporary session folder — move to a permanent folder before continuing.
