# BSC BioLab: What The Beast?! — Technical & Creative Review

*Prepared by Claude (Claude Code) on 2026-11-08 for discussion with the designer (عبدالله شويع) and ChatGPT. No new code is proposed here; this is a review with recommended decisions.*

> **Context you should know first:** a working build already exists in this repo (React + Vite + TS, GitHub Pages, PWA/offline, 68 automated tests). It has a deterministic story engine, both modes, 51 story beats with 4 choices each, a procedural painterly scene renderer, an Ending Composer, the share card with QR, and 1,000-run diversity simulations (`reports/diversity.md`). This review says what to keep, what to change, and what the free-tier reality allows.

---

## 1. Honest assessment

The project is feasible and can look excellent **if one assumption is dropped**: *"AI generates each player's story and illustrations live, for free, for everyone."* That part does not survive contact with current free-tier limits (section 4), and it would also make quality, Arabic fluency, safety and creature consistency worse, not better.

The winning pattern for a zero-budget, high-quality, replayable game is:

> **Use AI heavily at *build time* (to write, paint and test a large content library), and keep *runtime* deterministic, offline and free.** Live AI becomes an optional garnish, never a dependency.

This keeps the parts that matter to players: real variety, beautiful consistent art, fast loading, and no surprise bills or "quota exceeded" screens during a club event.

**What I'd challenge in the current proposal:**

| Idea | Verdict | Why |
|---|---|---|
| Live AI Story Director writing the plot per player | **Reject as the core** (keep it as an optional layer) | ~500 AI calls/day total on Cloudflare's free tier for *all* visitors combined (section 4). One crowded booth day exhausts it. Small free models write weak Kuwaiti Arabic and drift on continuity. 2–6 s of latency per beat. |
| Real-time AI image per scene | **Reject for everyone; possible for one image per run at most** | Gemini's free tier has **no image generation at all** (verified). Cloudflare's free tier covers roughly 170 small images/day in total, shared with text. |
| AI drawing *the player's hybrid* consistently across scenes | **Reject** | Even paid models can't keep an arbitrary new creature consistent without per-creature fine-tuning. Results would contradict the anatomy the engine is reasoning about. |
| Deterministic state engine + validator | **Keep, and make it the centre** | It already guarantees continuity, gives anatomy-gated choices, and is measurable with tests. |
| Pre-generated art + live compositing | **Adopt as the core art strategy** | Fast, free and consistent. Every beat gets its own painted plate, and the player's creature is composited in by our renderer. |

---

## 2. Recommended story architecture: "storylets + narrative grammar + memory"

Story variety comes from **content breadth × combinatorics × state-driven selection**, not from a live LLM.

1. **Storylets (quality-based narrative).** Each beat is a self-contained story unit with preconditions on state (flags, clues, relationships, creature capabilities, biome, phase) and salience scores. This is the model used by *Sunless Sea*, *80 Days* and *Fallen London*. Our engine already works this way (`BeatTemplate.requires`, runtime selection in `resolveCurrent`).
2. **Narrative grammar for the spine.** Each run is generated as **premise → mystery → location chain → complication → twist → climax → resolution**, with a **clue-dependency graph**: a twist can only fire if its supporting clues were planted. This is what makes stories feel authored rather than shuffled.
3. **Memory and callbacks.** Flags, evidence, NPC relationships and unresolved threads are recorded. Later beats and the ending *quote* earlier events; the current Ending Composer already narrates the finale and the body part that helped or failed.
4. **Anatomy as a story verb.** Choices are unlocked or changed by capabilities (fly, glow, venom, pressure…), and every check narrates which body part helped or hurt. This is the single strongest "this was MY adventure" signal, and it's free.
5. **Optional live AI layer (when quota allows):** it only *rephrases* engine-approved text in the player's context. Output is JSON-validated, checked for anatomy contradictions, rate-limited, and falls back to static text. It never changes state. (Already built: `src/engine/ai.ts`, `worker/`.)

**Where AI really helps: authoring.** Use Claude/ChatGPT now to draft hundreds of storylets in both languages. Human club members review the Arabic, and the test suite enforces placeholders, both languages, 4 choices, reachability, scene art and continuity. That's how you get to the content volume below without any runtime cost.

### Content scale needed (my estimate)
| Layer | Now | Target for "rarely repeats" |
|---|---|---|
| Hooks/premises per mode | 4 classic / 3 marine | 12–15 classic / 10 marine |
| Explore storylets per biome | 1 | 4–6 |
| Challenge storylets (shared) | 9 | 20+ |
| Encounters / NPCs | 4 / 3 | 10 / 8 (each with 2–3 relationship states) |
| Twists | 5 / 3 | 15 / 10, all clue-gated |
| Climaxes | 3 / 3 | 8 / 8 |
| Ending archetypes | 13 / 13 | 25+ each, with tone variants |

### Measurable diversity targets (per device, real player history)
Current measurements are from 1,000 simulated runs per mode (`reports/diversity.md`):
- **No hook repeated within the last 3 runs** (target 100%).
- **Plan similarity to the last 10 runs:** mean max Jaccard **< 0.30** (now 0.26 classic / 0.34 marine).
- **No ending archetype repeated within 3 runs** unless it is the only one the state allows.
- **The sailor legend appears in 30–45% of Marine runs** (now about 40%).
- **Unique full paths: ≥ 99%** (now 100%), with **0 invariant errors** (now 0).
- **Human quality checks:** a blind panel reads 10 random runs and rates coherence and surprise; any run with a contradiction is a test failure.

We should not promise "infinite unique stories"; we should publish these numbers instead.

---

## 3. Recommended illustration architecture: "painted plates + live creature compositing"

This is the strongest practical, zero-cost solution, and it also solves consistency.

1. **A plate library painted offline**, in one art direction (the deep-sea gouache references define it), generated on the developer's PC (section 7) and curated by hand.
   - One or more plates **per storylet**, not per biome. A forest "abandoned lab" beat and a forest "bee hermit" beat get different images, so the images illustrate the actual event.
   - Each plate ships with **metadata**: a creature slot (x, y, scale, depth), occluder mask (foreground leaves or rocks that go in front of the creature), light colour and direction, and mood.
2. **The player's creature is rendered by our own engine**, from a modular parts library in the same painted style, then **lit to match the plate** (tint, rim light, cast shadow, depth blur) and placed in the slot. The creature is consistent everywhere because it is literally the same asset.
3. **Live layers:** particles (marine snow, dust, fireflies), parallax, light flicker and outcome effects, so each scene feels alive and reacts to the choice.
4. **Fallback:** the existing procedural painter renders instantly while plates load, and is used for any beat without a plate yet. No empty screens, ever.
5. **Optional "hero" image (one per run, quota permitting):** a Cloudflare Workers AI background for the ending tableau, generated while the player reads the last beats. If quota is gone, a pre-painted ending plate is used. It's never on the critical path.

### Creature assembly without "cut-and-paste" ugliness (the hardest art problem)
- A **standard rig per body type** (quadruped, round, long, amphibian…) with fixed anchors for head, eyes, limbs, tail and back. Parts are painted to those anchors.
- **Overlap seams:** each part has a "collar" (fur tuft, scale ring, skin fold) that overlaps the body, hiding joins.
- **Palette unification:** all parts are painted in greyscale value and recoloured at runtime through the creature's palette (a gradient map), so mixed parts share one skin.
- **One shared line weight, texture and lighting pass** over the composed creature.
- **Honest note:** AI image models are poor at producing *separable, anchor-aligned* parts in a consistent style. Best quality comes from a **human illustrator** (the artist of the duck mascots would be ideal) drawing about 50 parts, with AI used for concepts. The current procedural SVG creature is a stand-in.

### Ducks
The original duck artwork is used as-is. AI must not redraw them, because faces and outfits drift. If expressions or poses are wanted, the original artist should draw 3–4 variants per duck. Until then, the single images are animated subtly (bob, tilt, shake).

---

## 4. Free AI services — verified limits (checked 2026-11-08)

| Service | Free text? | Free images? | Key limits | Charges risk |
|---|---|---|---|---|
| **Cloudflare Workers AI** (Free plan) | Yes | Yes | **10,000 Neurons/day**, resets 00:00 UTC. On the Free plan, overage is **blocked, not billed**. | None on the Free plan without upgrading |
| ↳ text cost (e.g. `qwen3-30b-a3b`: 4,625 / 30,475 Neurons per M in/out tokens) | ~19 Neurons per beat rewrite (1.5k in / 400 out) | | **≈ 500 calls/day total**, about 50 fully AI-narrated runs/day across *all* visitors | |
| ↳ image cost (`flux-1-schnell`: 4.80 Neurons per 512² tile + 9.60 per step) | | ~58 Neurons for a 1024×576 image at 4 steps (my calculation) | **≈ 170 images/day total**, shared with text | |
| **Google Gemini API** free tier | Yes (2.5 Flash, Flash-Lite, 3 Flash Preview) | **No.** All Gemini image models are "Not available" on the Free Tier (official pricing page) | Limits are **per project** and shown in AI Studio. **Free-tier content "is used to improve our products".** | None if billing is never enabled |
| **pollinations.ai** (no key) | — | Technically yes | Tested 2026-11-08: free tier = weak `sana` model only, **watermark**, 1 image / 45 s per IP. | None, but quality is unacceptable |
| **WebLLM / Transformers.js** (in-browser) | Yes | Not practical | Multi-GB model downloads, too slow and memory-hungry on phones. Fine for a desktop demo only. | None |
| **GitHub Pages** | — | — | Static hosting, ~1 GB site guideline. 300 WebP plates at ~150 KB ≈ 45 MB. | None |

Conclusions:
- Live text AI at event scale is **not** sustainable for free; it can be an occasional enhancement.
- Live image AI for every scene is **not** possible for free. One ending image per run is possible on light days only.
- Don't send player-entered names to Gemini's free tier (data may be used to improve products). Send creature and part data only.

---

## 5. Zero-charge guarantees

1. **GitHub Pages** for hosting, which is free.
2. **Cloudflare Workers Free plan with no payment method on file.** Overage is blocked, not billed (documented). Never upgrade to Workers Paid.
3. **Gemini:** never link a billing account to the project. Image models are unavailable on free anyway.
4. **Worker hardening:** an origin allow-list, Cloudflare Turnstile (free bot check) before AI calls, per-IP rate limiting, a daily self-imposed budget below the quota, and caching identical requests.
5. **The client never needs AI.** If the Worker is down or the quota is gone, the game is unchanged (already the case).

What **cannot** be guaranteed: that a free tier's limits or terms stay the same next year. The architecture above survives that, because nothing essential depends on them.

---

## 6. Loading and performance plan

- **Plates:** WebP or AVIF at 1600×900 and ~120–200 KB each, plus a portrait crop for phones; preloaded by `<link rel=preload>` for the next beat.
- **Prefetch:** at every beat, the engine already knows the candidate templates for the next beat, so it prefetches their plates while the player reads (typically 1–4 images).
- **Instant fallback:** the procedural painter (already built) shows something beautiful immediately, then crossfades to the plate.
- **PWA cache:** the service worker caches everything seen. With a small "download all scenes" option, the game is fully offline at events with bad Wi-Fi.
- **Optional AI hero image:** requested at beat N−2 and shown at the ending only if ready.

---

## 7. Local image generation on the developer's PC (RTX 4060 Ti 8 GB, 16 GB RAM)

This is the **main art engine for the plate library**, at zero cost.
- **Tools:** ComfyUI (free, open source).
- **Models:**
  - **SDXL** fits comfortably in 8 GB at 1024-class resolutions.
  - **FLUX.1-schnell** (Apache-2.0 licence, safest for public use) runs as a quantized (GGUF) build. It's slower, and 16 GB of system RAM is tight.
  - Avoid licences that forbid the use, and check each model's licence before shipping its outputs.
- **Throughput (rough):** SDXL ~10–20 s per image; quantized FLUX ~30–90 s. **300 curated plates ≈ one or two evenings of generation**, plus selection time.
- **Consistency:** a fixed style prompt, fixed seeds per series, and image-to-image from our procedural compositions (layout control). Optionally, a **style LoRA** trained on ~20 approved plates (possible on 8 GB with SDXL; slow but feasible).
- **Ducks and the player's creature are never generated by AI.**

---

## 8. Tools that materially help (and which don't)

| Tool | What it really does |
|---|---|
| Claude Code skills: `frontend-design`, `game-ui-ux`, `motion-design`, `game-feel`, `graphic-design` | Improve **UI/UX code, layout, motion and typography**. They do **not** produce raster artwork. |
| `image` skill | Prompting guidance only. No generator is attached. |
| **ComfyUI on the developer PC** | **Actually generates the artwork.** Community MCP servers for ComfyUI exist, which could let Claude Code queue generations locally; their availability and quality need checking before relying on them. |
| Cloudflare Workers AI | Real (small) live AI for optional narration and one hero image. |
| Human illustrator (club artist) | The only reliable path to a top-quality modular creature parts library and new duck poses. |

---

## 9. Realistic build plan (from the current repo)

1. **Decisions (1–2 days).** Settle section 11.
2. **Art direction lock (2–3 days).** About 12 approved test plates (forest, desert, lab ruins, reef, midnight, trench…). Define the style prompt, palette and plate metadata format.
3. **Plate pipeline (1 week, part-time).** ComfyUI workflow, batch generation, curation, export script into `public/scenes/`, and compositing of the creature slot and occluders in the game.
4. **Creature parts v2 (parallel; depends on artist availability).** Rig, anchors, palette recolouring, lighting match.
5. **Content expansion (ongoing).** AI-drafted, human-reviewed storylets toward the targets in section 2. Clue-dependency graph for twists.
6. **Optional AI layer.** Deploy the Worker with Turnstile and a daily budget; ending hero image.
7. **Event hardening.** Offline "download all", QR booth flow, 1,000-run simulations, and device testing on low-end phones.

A polished, complete v3 is realistic in **3–5 weeks of part-time work**. Art curation and Arabic review are the real bottlenecks, not code.

---

## 10. What zero cost can and cannot achieve

**Can:**
- A fully free, offline-capable, beautiful game.
- Hundreds of event-specific painted plates.
- A consistent player creature in every scene and on the card.
- Measurable story diversity with no runtime AI.
- Optional light AI narration.

**Cannot be guaranteed:**
- Live AI story or images for every player at event scale.
- AI-drawn consistency of the player's creature.
- Permanence of any provider's free terms.
- That every generated plate is good. Curation time is required.

---

## 11. Decisions to settle before the final build

1. **Runtime AI role:** an optional garnish (recommended) or a required core?
2. **Plate source:** local ComfyUI generation (recommended), a human artist, or a mix?
3. **Creature parts:** keep procedural vector for now, or commission painted parts from the club artist?
4. **Duck poses:** the single originals (now) vs. new artist-drawn expressions?
5. **Content scale for launch:** which targets in section 2 are mandatory for v3?
6. **Event mode:** offline "download all scenes", a booth QR flow, and a shared "daily expedition" seed?
7. **Privacy:** never send player names to any AI service (recommended).

---

## 12. Ideas that would make it significantly better

- **Field Journal meta-progression:** every real-science fact discovered is saved to a bestiary/journal across runs, which gives players a reason to replay.
- **Visible consequences on the creature:** frost, mud, glowing algae, a bandaged limb or sailor's charm overlay the creature for the rest of the run and on the card. This is cheap, personal and memorable.
- **Comic-panel beats (like *Wildermyth*):** some beats are shown as 2–3 composited panels (wide establishing shot, close-up of the creature, reaction of the duck), so the same plate library yields far more visual variety.
- **Clue board:** a small evidence board shows collected clues and how they connect, which pays off mysteries and twists.
- **Kuwaiti and Gulf grounding:** pearl-diving history, Kubbar and Qaruh reefs, Sulaibikhat mudflats, desert camps, Failaka. This is distinctive and educational, with facts kept in "Real Science" boxes.
- **Booth "daily seed":** everyone at the event can play the same premise and compare endings and cards (no accounts, no leaderboard).
- **Accessibility:** text size control, high-contrast mode, and audio captions for ambience cues.

---

### Sources (checked 2026-11-08)
- Cloudflare Workers AI pricing (free 10,000 Neurons/day; Free plan blocks overage; model Neuron costs): https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers AI limits (text-to-image 720 rpm; text 300 rpm): https://developers.cloudflare.com/workers-ai/platform/limits/
- Gemini API pricing (image models "Not available" on Free Tier; free-tier content used to improve products): https://aistudio.google.com/docs/pricing
- Gemini API rate limits (per project; live values in AI Studio): https://aistudio.google.com/docs/rate-limits
- Third-party reports on Gemini image free quotas are conflicting and unofficial (e.g. https://blog.laozhang.ai/en/posts/gemini-image-generation-free-limit-2026); the official pricing page above takes precedence.
- pollinations.ai free tier: tested directly on 2026-11-08 (HTTP 402 "1 image every 45 seconds per IP"; watermark; `sana` model only).
