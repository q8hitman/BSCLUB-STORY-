# BSC Story Factory and Story Archive

Stories are produced **in advance**, validated, illustrated, approved and shipped with the site. Visitors never need
Gemini, ComfyUI or the developer's PC. The game plays two kinds of adventure through the **same engine**: the same 4
choices, anatomy gates, checks, Duck Radio, creature panel, Passport QR and journal.

| Kind | Where | What it is |
|---|---|---|
| Generated journey | `src/content/beats*.ts` + planner in `src/engine/story.ts` | Assembled from ~150 scene templates. Length and mood apply. |
| Archive story | `src/stories/<id>@<v>.ts` or `.json` | A hand- or factory-written **branching graph** with its own premise, twist, Living World flags and authored endings. |

## Archive story format (`src/engine/archive.ts`)

Each story is a `StoryPackage` with these fields:

- `id` and `v`: a stable id and an immutable version.
- `start`: the first node.
- `nodes`: scene nodes. Each node has:
  - `biome`, `kind` and `text`
  - `variants`: extra text when a condition holds
  - `plate`, plus `plateWhen` for Living World image swaps
  - `cinematic`: one of reveal, discovery, passage, phenomenon or climax
  - `fact`, `featured`
  - `choices`: each outcome has `next: <node>` or `end:<ending>`.
- `endings`: the authored endings.
- `world`: labels for `w:*` world flags.
- `science`: fact ids.
- `tags`: themes, locations, twist and creatures. These feed the narrative fingerprint.
- `status`: `review`, `published` or `retired`.

State carries across branches: flags, evidence, world flags, energy, trust and relationships. When paths reconverge,
earlier consequences are still there and later nodes react to them through `variants`, `requires` and `plateWhen`.
Nodes are reusable and conditional, so variety comes from state rather than from enumerating every combination.

## Production workflow

```bash
npx tsx scripts/factory/generate.ts --mode classic --tone comedy --concepts 1
npx tsx scripts/factory/publish.ts
npx vitest run
```

- `generate.ts` is steps 1–8. It reads `factory.config.json`.
- `publish.ts` is step 11. It validates, writes the catalog and `reports/stories.md`, and refuses changes to published versions.
- `npx vitest run` re-checks every package.

1. **Configure** `scripts/factory/factory.config.json`. It controls:
   - the number of concepts
   - the mode, tone and environment mix
   - node and ending counts, and choices per node
   - the rare-encounter rate
   - art limits
   - the Gemini budget: requests, tokens, repair attempts
   - quality thresholds
2. **Generate.** Gemini (free tier) is called only when you run the script. The key comes from `GEMINI_API_KEY` or
   `~/.bsc/gemini.key` and never goes into the frontend or git. Each concept gets one generation and, if it fails
   validation, one repair request that includes the error list.
3. **Draft.** The draft is written to `src/stories/<id>@1.json` with `status: "review"`. It is **never auto-published.**
4. **Art.** For any scene marked `NEW:<id>`, a ComfyUI batch `scripts/comfy/plates-factory-<id>.json` is written. Run it
   with the existing `scripts/comfy/generate.py`, review the contact sheet, export the picks, and replace the
   `f-<id>-*` plate ids. Only run ComfyUI when nobody is playing on that PC.
5. **Review.** Read the draft in both languages. Check the science and the Arabic. Fix or delete it.
6. **Publish.** Set `"status": "published"`, then run `publish.ts`. A package with any validator error cannot be
   published.

## Automated validation (`src/engine/archiveValidate.ts`)

**Graph**
- start exists; every `next` points to a node or ending
- no cycles; every node and every ending is reachable
- reconvergence exists
- ≥4 open choices per node, so the engine always shows exactly 4
- at most 6 authored choices

**Conditions**
- every capability is a real one
- every flag or evidence used in a condition is set by some earlier effect
- `w:*` flags have journal labels

**Assets**
- every plate exists in `src/content/plates.json`
- `fact`, `featured` and `science` ids exist

**Language**
- English and Arabic both present
- the Arabic contains Arabic script and no Latin words
- a list of colloquial words is rejected, so the text stays Modern Standard Arabic
- the creature never speaks
- no «البطة»

**Simulation**
- 300 random creature builds × random choices
- every run must finish with exactly 4 choices per scene, a valid state and an authored ending
- reports which endings were reached, distinct paths and average length

**Repetition**
- the narrative fingerprint is premise themes, places, twist, creatures, the arc's sequence of scene kinds, and
  ending tones
- jaccard ≥ 0.6 against another published story is an error; ≥ 0.45 is a warning
- a reworded copy with the same structure scores 1.0, so text changes cannot hide a repeat

## Immutable versions and QR compatibility

- `src/stories/catalog.json` is the archive lock. It holds each version's content hash, fingerprint, endings and
  world labels. Tests fail if a published file changes or disappears.
- To change a published story, copy `x@1.ts` to `x@2.ts` and edit the copy. Keep `x@1` so saves made with it still
  restore exactly. Adventure Memory always offers the newest published version.
- A Passport save of an archive run stores `"<id>@<v>"` plus the choices. `peekStory()` tells the app which chunk to
  fetch before decoding.
- If that exact version is not available, the restore fails with reason `content`. It never plays a different story.
- Older generated-journey saves are unchanged. The existing save tests still pass.

## Loading

- `catalog.json` is about 3 KB and loads with the app.
- Each story package is its own lazily loaded chunk (`import.meta.glob`), fetched when that adventure starts or a QR
  save needs it.
- Scene plates were already cached on first view, not precached.

## Adventure Memory (`src/engine/memory.ts`)

- The Journal records:
  - finished archive stories (version, plays, endings found)
  - Living World changes
  - the fingerprints of the last 20 adventures
- **"✨ New to me"** (the default) weights:
  - unplayed stories very high
  - places this explorer has not visited higher
  - stories structurally similar to recent adventures lower
  - generated journeys high once the archive stories have been played
- **"Generated journey"** forces the planner. Choosing a story by name replays it. Nothing is ever locked.
- Memory is **per device**. The Passport QR moves one adventure, not the journal, so memory is not synchronised
  across devices.

## Fully automatic mode (no human review)

The GitHub workflow `.github/workflows/story-factory.yml` runs every day at 12:00 Kuwait time, just after the free quota resets (up to 3 Classic + 3 Marine attempts; writer gemini-3.5-flash-lite, editor gemini-3.5-flash, 20 s between requests, stops cleanly when the free daily quota is used up). It can also be
started by hand: Actions → Story Factory → Run workflow. It needs only the repository secret `GEMINI_API_KEY`.

1. `generate.ts --review-drafts` gives any leftover drafts their editor pass.
2. `generate.ts --auto` writes 1 Classic and 1 Marine story.
   - Mechanical fixes are applied automatically. Existing paintings stand in for new art, since there is no GPU in CI.
   - The validator runs, with up to 2 repair rounds.
3. A **stricter editor** (`reviewModel`) scores the story on science, Arabic, age suitability, coherence and variety,
   quoting the weakest sentence for each. Calibration: typical AI drafts score 5–7.
   - The story is published only if the validator finds 0 errors **and** every score is ≥ `auto.minReviewScore` (8).
   - If not, Gemini revises once with the editor's list of problems.
   - Rejected drafts are not shipped.
4. The catalog is updated, the **full test suite** runs, then the workflow commits and deploys. If anything fails,
   nothing is published.

Gemini's free tier often answers 503 (busy) or 429 (rate limit). The script waits and retries up to 3 times, then
skips that story until next week. Some weeks will publish nothing; that is expected.

To pull a bad story: set its `"status"` to `"retired"` and run `publish.ts`. It disappears from new adventures, but QR
saves that use it keep working, because `status` is not part of the content hash.

**Structure by code, words by Gemini.** `scripts/factory/skeleton.ts` builds every automatic story's branching graph:
hook → 2 paths → a shared twist → 2 paths → climax → 3 endings. It also picks the places and the paintings, with 4 open
choices plus 1 anatomy-gated choice per scene. Gemini fills in the content only, and anything structural it changes is
overwritten. So structure errors such as loops or too few paths can no longer happen.

**Report.** Each run writes `reports/factory-latest.md` (public) with every attempt, the editor's scores and the reason
it was rejected. A valid story that is waiting only because the editor's daily quota ran out is kept as `review` and
re-checked in the next run.
