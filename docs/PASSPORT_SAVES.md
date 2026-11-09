# BSC Explorer Passport — cross-device saves

## Decision: self-contained QR (option A). No cloud storage is used.

The story engine is **deterministic**. Every scene, outcome, Duck Radio line, field note, hidden encounter and
ending is a pure function of a few inputs. So the QR does not store the story text. It stores the inputs, and the
phone that scans it **replays the same decisions through the same engine**, then validates the rebuilt state.

Code: `src/engine/save.ts`. Card: `src/share/passport.ts`. Restore screen: `App.tsx` (`#s=` link).

### What the QR link contains (and nothing else)

| Field | Example |
|---|---|
| Save format version | `1` |
| Mode | classic / marine |
| Run seed and chosen plan variant (0–7) | `3760482534`, `0` |
| Story length and mood | quick / full · balanced / light / mystery |
| Companion duck id | `roaa` |
| Display name (optional, anonymous allowed, max 24 characters) | `زائر ٤٢` |
| Creature design | name, 7 parts, colour |
| Anti-repetition list | recent story template ids (runtime-picked kinds only) |
| Decisions so far | choice ids in order, plus current stage |
| Pinned history-based picks | legend sighting, recent endings |
| AI wording of the paragraph on screen | optional; dropped (with a visible notice) if it would push the link over 1,200 characters |

A checksum catches damaged scans. The data rides in the URL **#fragment**, which browsers never send to any server.

**Size:** the browser test produced links of 342 and 365 characters. Every link produced in the test suite stays under
1,200 characters. The card draws it at 400 px, at least 4 px per module, black on white with a 4-module quiet zone.

### Why it restores the *exact* story

- The plan is rebuilt from `(seed, variant, mode, creature, length, tone)`. It is **not** re-chosen from the scanning
  device's history.
- Things that depend on the booth's history (the anti-repetition list, a legend sighting, recent endings) are
  computed once at the start and **pinned** into the save.
- After replay, `validateState` must pass and the stage must match. Otherwise the restore is refused.
- If the game content changed since the card was made, so that a choice or scene no longer exists, the restore fails
  with reason `content`. **No different story is invented.** The player can still start a new adventure with the
  same creature.
- Tested: more than 900 exact round-trips (deep equality of the entire game state) at every point of runs in both
  modes, with booth history, all lengths and moods, and legacy runs.

### AI-generated text

Production currently runs **without** live AI. `VITE_AI_ENDPOINT` is not configured and the Worker is not deployed.
Stories are authored and deterministic, so the QR alone restores them completely.

Optional AI only re-words the outcome paragraph on screen. That paragraph is stored in the game state (`ai`) and
travels in the QR. If live AI story *generation* is enabled later (whole scenes written by Gemini), those texts will
not fit a QR. That will need option B below.

### Option B (not implemented): cloud-backed saves

Verified free-tier limits for Cloudflare Workers KV (developers.cloudflare.com, read 2026-11-09):

| Limit | Value |
|---|---|
| Worker requests | 100,000 per day |
| KV reads | 100,000 per day |
| KV writes | 1,000 per day to different keys |
| Storage | 1 GB |
| Value size | 25 MiB |
| CPU time | 10 ms per request |

Over the limit, requests fail with error 1027. The docs mention no charges on the Free plan.

A booth would need about one write per Passport. That is fine for a day's event, but 1,000 writes a day is a hard
ceiling. A design would need a random 16-character id, a 30-day expiry, a size cap of about 16 KB, per-IP rate
limits, and an origin check. It was **not built**, because nothing in the current game needs it. Building it would
add a server dependency, an expiry and a daily cap to a feature that currently has none.

### Journal history across devices

The QR moves **one adventure**. When that adventure is finished on the new device, its ending, animals, field notes,
rare encounters and achievements are recorded in that device's journal. A completed adventure's QR can also be
scanned to "keep it in my journal".

Earlier journal history from the booth does **not** transfer. That is deliberate on a shared device.

### Shared booth devices

- **New Visitor** (title screen and settings) clears the current adventure, names, creatures, journal and legend
  sightings on this device. Only an anonymous list of used story templates is kept, so stories keep varying.
- QR links are bearer keys. Anyone with the code can open that adventure. The Passport screen says this.
- Already-issued QR codes keep working after New Visitor, because they carry the adventure themselves.
- The `#s=` code is removed from the address bar as soon as it is read, so refreshing a booth tab cannot reopen it.
- The name field is never pre-filled with the previous visitor's name.
