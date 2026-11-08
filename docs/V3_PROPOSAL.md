# v3 Proposal — Visual Upgrade + Live AI Storytelling

*Claude, 2026-11-08. This is a proposal only: no game code has been changed for v3 yet. It responds to the designer's two latest briefs: (1) a major visual upgrade with the creature in a side panel; (2) live AI text story generation through a free Cloudflare Worker, with pre-existing visual assets only.*

> **Status:** an AI evaluation harness is ready (`scripts/ai-eval/`). It cannot run against real models until a Gemini API key and/or a Cloudflare API token exist (section C3). The 20-adventure test required before integration is therefore **pending**. No numbers below are presented as test results; projections are labelled as such.

---

## A. Visual review — what is weak today

| Area | Current state | Problem |
|---|---|---|
| Player creature | Procedural SVG: flat fills, thick outlines, an "ink" filter | Reads as clip-art. No expression, no state, no lighting. **The weakest asset in the game.** |
| Scenes | Procedural canvas paintings (gouache-on-black style), 16 biomes + event props | The deep-sea set is the strongest. Land scenes are pleasant but simple: few silhouettes, flat ridges, simple people. Variety is limited to biome × a few props. |
| Event specificity | One painting per biome + props | The same lab or forest image appears across very different events. |
| Mystery on land | Mostly marine | Land biomes lack strange signs, uncanny lighting and hidden creatures. |
| NPC animals | Mostly text (`predators`/`critters` strings) | Rarely drawn, so encounters aren't visual. |
| Ducks | Original art, unchanged (correct) | Only one pose each, so expressions are simulated by animation only. |
| UI | Cinematic VN layout, glass panels, 4 choices | A good base. The creature panel is missing. |

**Benchmark adopted:** the moody painterly samples (bathysphere beam, angler in the dark, vents) define the target style for *all* environments: storybook-like, eerie, rich in texture, with selective light in darkness.

---

## B. Recommended visual system

### B1. Layout: "Scene + Specimen Panel"
- **Main stage:** a large cinematic event illustration with no creature forced in, slow camera drift, particles, light flicker and outcome effects.
- **Specimen panel** (right side on desktop/tablet; on phones, a collapsible strip above the dialogue):
  - **Portrait:** a bust or full body of the player's hybrid in the same painterly style.
  - **Expression:** a facial state driven by the engine (calm, curious, afraid, confident, exhausted, excited, hurt, proud).
  - **Marks:** persistent overlays caused by events (mud, snow, frost, sand, soot, glowing algae, ink, pollen, scratches, bandage, sailor's charm). They stack, fade over time, and carry through to the ending and the share card.
  - **Status:** energy, a mood line (one short line, in the duck's voice or the creature's "inner reaction"), and key traits used this beat (highlighted when a body part matters).
  - **Reaction animation:** a flinch, perk-up or shiver keyed to the outcome.
- The duck stays in the dialogue box (original art, unchanged).

### B2. Creature art system (the biggest upgrade)
1. **Painted parts on a standard rig.** There are 4 rigs (quadruped, round, long/serpentine, amphibian). Each part is painted in greyscale value with a "collar" overlap, then recoloured at runtime through the creature's palette (a gradient map), so mixed animals share one skin and lighting.
2. **Expression layer:** eye and brow variants per head type for each emotional state, plus a few mouth shapes.
3. **Mark layer:** texture overlays masked to the silhouette (mud splatter, frost rim, algae glow with bloom).
4. **Production:** generate concept sheets and part candidates locally (ComfyUI, section D) with a fixed style reference, clean them up, and cut them to the rig. **Honest limitation:** AI is unreliable at producing separable, anchor-aligned parts. The best quality comes from a club illustrator painting about 50 parts to these specs, with AI used for exploration.
5. **Fallback while the art is produced:** upgrade the procedural creature (soft shading, rim light, texture, expressions, marks) so the panel works from day one.

### B3. Event illustration library (pre-generated, reused, never generated during play)
- **Unit = one event plate**, tagged with: `biome`, `event_type` (discovery, encounter, signal, ruin, evidence, chase, puzzle, rescue, comic, suspense, finale, ending), `subjects` (which bestiary animals or NPCs appear), `tone` (eerie, comic, heroic, calm…), `time` (day, dusk, night), `mystery_level` (0–3), and `crop` (the safe area for phones).
- **Targets for v3** (my estimate for "rarely repeats" over ~10 runs):

| Set | Count |
|---|---|
| Land events (7 biomes × ~14 event types/variants) | ~100 |
| Marine surface + deep events (9 biomes × ~10) | ~90 |
| Bestiary close-ups (unusual creatures, both real and fictional) | ~40 |
| Endings tableaux (by tone) | ~30 |
| Comic or absurd moments | ~20 |
| Evidence and discovery close-ups (objects, tracks, notes, specimens) | ~30 |
| **Total** | **~310 plates** |

- **Size:** WebP at 1600×900 and ~150 KB ≈ **45–50 MB** total, which is fine on GitHub Pages. They're lazy-loaded and prefetched for the next beat.
- **Selection:** the engine (or the AI's outline) asks for an event by tags; a resolver picks the best matching unused plate on this device, using the narrative fingerprint history to avoid repeats.
- **The procedural painter stays** as the instant placeholder and as a fallback for any missing tag combination.

### B4. Bestiary system ("when a story needs a specific animal, it can use it")
- A catalog of animals and creatures, each with: id, real or fictional status, habitats, behaviour tags, a real-science fact id (if real), danger and comedy potential, and art (a plate close-up and/or cut-out).
- Stories (AI or authored) may only summon bestiary ids, so every summoned animal has art and verified facts.
- **Target for v3:** 60 real species (Kuwait and Gulf wildlife first: dhub lizard, jerboa, Arabian red fox, crab-plover, mudskipper, dugong, hawksbill turtle, Arabian Gulf corals, whale shark…) plus about 25 fictional "anomalies".

### B5. Mystery everywhere and tone variety
- Every biome gets an **anomaly kit**: an uncanny light source, strange tracks, a wrong sound, an out-of-place object, and a hidden watcher. Land biomes reach the same "mystery level" as the deep sea.
- **A tone director:** each run picks a primary and secondary tone (e.g. *comedic + eerie*, *heroic + scientific*) using the history to rotate them. The tone drives the plate tags, colour grade, ambience and AI prompt.

---

## C. Live AI storytelling — recommended architecture

### C1. Flow
```
Browser (GitHub Pages)                      Cloudflare Worker (Free plan)                 Free LLMs
─────────────────────                      ─────────────────────────────                 ─────────
start run ── creature brief + catalog ids ─▶ checks: origin, Turnstile, per-IP + daily budget
           + local fingerprints (no names)   ├─▶ Gemini Flash-Lite (primary)  ─┐
                                             └─▶ Workers AI model (secondary) ─┴─▶ JSON
          ◀── validated OUTLINE (8–10 acts) ──┘
each act ── state summary ───────────────────▶ beat generator ─▶ JSON (text, 4 choices,
          ◀── validated BEAT ─────────────────┘                    both outcomes)
choice  ── resolved locally, instantly (outcomes are pre-written in the beat)
end     ── journey summary ──────────────────▶ ending generator ─▶ validated ENDING
any failure / quota / offline ─▶ seamless switch to the procedural engine for the rest of the run
```
- **The engine stays authoritative:** state, dice, effects (whitelisted types, clamped values), capability checks, evidence and continuity. The AI proposes; the engine validates and applies.
- **The AI can only use catalog ids:** biomes, plate tags, bestiary animals, NPCs, ducks, facts, moods, marks and styles. Any unknown id is an error and triggers a retry, then the fallback.
- **Science:** the AI may cite fact ids only; it can never author a "Real Science" claim.
- **Privacy:** the player's name and creature name never leave the device (a `{CREATURE}` token is substituted locally). This matters because Gemini's free tier states that content is used to improve products.
- **Latency hiding:** the outline is generated during the builder → mode-select transition. Act N+1 is requested while the player reads act N. Outcomes are pre-written, so choosing is instant.

### C2. Validation (already implemented in the harness)
- Structure and the exact 4 choices.
- Asset ids exist and the biome sequence is legal (Marine: surface, then The Deep, never back).
- Clues are planted before they are paid off.
- No capability the creature lacks.
- Check difficulty is in range, every checked choice has a fail outcome, and success differs from fail.
- Choices are meaningful: at least 3 distinct strategies, and each has consequences.
- Facts come from the catalog only.
- Both languages are present.
- Wrong-dialect markers (Egyptian, Levantine, Iraqi) are flagged.
- No URLs.

### C3. Candidate models and **projected** free capacity (to be confirmed by the test)

| Model | Free? | Arabic (expectation, untested) | Projected capacity* |
|---|---|---|---|
| **Gemini 2.5 Flash-Lite** (Google AI Studio free tier) | Yes. Limits per project, shown in AI Studio; third parties report ~1,000 requests/day | Good | **~100 AI runs/day** |
| Gemini 2.5 Flash / 3 Flash Preview (free tier) | Yes; reported ~250 requests/day for 2.5 Flash | Very good | ~25 runs/day |
| Workers AI `@cf/qwen/qwen3-30b-a3b-fp8` | Yes (10k Neurons/day) | Fair to good | ~30 runs/day |
| Workers AI `@cf/openai/gpt-oss-20b` | Yes | Fair | ~20 runs/day |
| Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Yes | Good | ~5 runs/day (expensive in Neurons) |

\*Projection assumes ~10 calls, ~15k input and ~8k output tokens per run (to be measured). Cloudflare Neuron prices are from the official pricing page; Gemini daily limits are unofficial until read in AI Studio.

**Honest bottom line:** free live AI can realistically serve on the order of **100–150 full AI adventures per day in total**. On a busy event day, many players will get the procedural engine, so it must stay excellent.

**Free multiplier — a "living story bank":** every AI adventure that passes validation (and contains no personal data) is saved in Cloudflare KV (free tier). When the quota runs out, players receive a stored AI adventure they haven't seen, chosen by fingerprint distance from the device history. Variety grows every day at zero cost.

### C4. Zero-charge safeguards
- Cloudflare Workers **Free plan**, no payment method: overage is blocked, not billed.
- Gemini: **never link billing**; the key is stored only as a Worker secret.
- Per-IP limits, Turnstile (free bot check), origin allow-list, a global daily budget set **below** the quotas (counted in the Worker), request-size caps, and `max_tokens` caps.
- The client never depends on AI; failure means instant procedural fallback.

### C5. The required pre-integration test (ready to run)
```bash
# keys only in your terminal/session — never committed
GEMINI_API_KEY=... npx tsx scripts/ai-eval/run.ts --provider=gemini --model=gemini-2.5-flash-lite --n=20 --rpm=10
CF_ACCOUNT_ID=... CF_API_TOKEN=... npx tsx scripts/ai-eval/run.ts --provider=cloudflare --model=@cf/qwen/qwen3-30b-a3b-fp8 --n=20
```
**Measured:**
- Validity on the first try and after a retry, for outlines, beats and endings.
- Latency per call.
- Tokens per run, giving real capacity per day.
- 429/quota hits.
- Diversity: distinct premise tags, twist tags and place sequences, plus outline similarity.
- Wrong-dialect flags.
- Asset-compatibility errors.

`samples.md` gives Arabic passages for **human review by club members** (the deciding factor for Arabic quality).

**Pass criteria (proposal):**
- ≥ 85% valid on the first try and ≥ 97% after one retry.
- Median beat latency < 6 s.
- ≥ 18/20 distinct premise tags.
- Mean outline similarity < 0.15.
- 0 asset errors after validation.
- Arabic rated "natural" by at least 2 of 3 reviewers.

---

## D. Tools — what really helps

| Tool | Type | Verdict |
|---|---|---|
| Skills `frontend-design`, `game-ui-ux`, `motion-design`, `game-feel`, `graphic-design`, `animation` | **UI/design guidance only.** No raster art | Use them for the panel, menus, motion and typography passes |
| `image` skill | Prompting guidance only | Useful for writing plate prompts |
| **ComfyUI (Desktop, Windows)** | **Real image generation, local, free** | **Recommended for the plate library and creature-part exploration.** RTX 4060 Ti 8 GB: SDXL fine-tunes ~8–15 s per image; Flux.2 Klein 4B (Apache-2.0) GGUF fits 8 GB. Disk needed: ~15–25 GB with 2–3 models (155 GB free) |
| **comfyui-mcp** (artokun, MIT, ~900★) | MCP bridge so Claude Code can drive ComfyUI | Promising: it can build workflows, queue batches and manage models. **Security note:** it can download models and install custom nodes, which runs third-party code. Install only with your approval and review what it installs |
| Upscaler + background remover (ComfyUI nodes) | Asset finishing | For bestiary cut-outs and creature parts |
| A club illustrator | Human | The only reliable route to top-tier creature parts and extra duck poses |

**Nothing has been installed yet.** These are multi-gigabyte downloads and third-party code on your PC, so they need your go-ahead.

---

## E. Proposed order of work (after your decisions)
1. **Run the AI test** (needs keys), then choose the model.
2. **Install ComfyUI + comfyui-mcp**, then lock the art direction with ~12 approved test plates across land and sea.
3. **Specimen panel + creature v2** (procedural upgrade first, painted parts as they arrive).
4. **Plate library production** in batches by biome, with the tag schema and resolver.
5. **Bestiary catalog** + anomaly kits + tone director.
6. **Worker + live AI integration** with the story bank and safeguards, keeping the procedural fallback.
7. **Content and Arabic review**, then 1,000-run simulations, device testing and an event dry-run.

## F. Decisions needed now
1. Provide a **Gemini API key** (AI Studio, no billing) and/or a **Cloudflare account ID + Workers AI API token** for the test.
2. Approve installing **ComfyUI Desktop + comfyui-mcp** and downloading 2–3 models (~15–25 GB).
3. Will a **club illustrator** paint the creature parts, or do we go AI-assisted with cleanup?
4. ~~Living story bank~~ — **APPROVED by the designer (2026-11-08)**; build it with the Worker once a Gemini key exists.

### Sources
- Cloudflare Workers AI pricing and free allocation: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers AI limits: https://developers.cloudflare.com/workers-ai/platform/limits/
- Cloudflare Workers AI JSON mode: https://developers.cloudflare.com/workers-ai/features/json-mode/
- Gemini API pricing (free tier availability; data use): https://aistudio.google.com/docs/pricing
- Gemini rate limits (per project, shown in AI Studio): https://aistudio.google.com/docs/rate-limits
- Unofficial Gemini free-tier figures (conflicting): https://yingtu.ai/en/blog/google-gemini-api-free-tier
- comfyui-mcp: https://github.com/artokun/comfyui-mcp
- 8 GB VRAM model guidance (third-party): https://localaimaster.com/vram/best-stable-diffusion-model-8gb-vram, https://eastondev.com/blog/en/posts/ai/20260721-comfyui-low-vram-acceleration/
