# Live AI story evaluation — results (2026-11-08)

Harness: `scripts/ai-eval/` (outline → 7-10 beats → ending per adventure; every reply validated; one retry with the errors fed back).
Key: Google AI Studio, free tier, no billing. Stored outside the repo (`~/.bsc/gemini.key`); never committed.

## Facts learned
- `gemini-2.5-flash-lite` is **no longer available to new users** (404). Current free models: `gemini-3.5-flash-lite`, `gemini-3.5-flash` (and others).
- Free quota observed: **500 requests/day per model per project** for `gemini-3.5-flash-lite` (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). Quotas are per model, so flash-lite + flash add up.
- A full AI adventure ≈ 11 requests → ~45 full adventures/day on flash-lite alone, before the story bank.
- Overload (503) happens occasionally; retried with back-off.

## Rounds (gemini-3.5-flash-lite unless noted)
| Round | Change | Runs complete | Outline / beat / ending valid 1st try |
|---|---|---|---|
| 1 (20) | first prompt fixes (text = {en,ar}, ducks never NPCs, clue ids, allowed ids sent with each beat) | 12/20 | 60% / 83% / 80% |
| 2 (20) | 8-10 acts enforced, cosmetic enums (duck mood, creature state, ending tone) normalised + warned | 18/20 fully (2 stopped mid-way) | 75% / 93% / 100% |
| 3 (6+6) | Arabic rules; flash vs flash-lite | hit the daily quota (429) | — |

Diversity (round 2): 16/20 distinct premises, mean outline similarity 0.025. No HTTP 429 during rounds 1-2.

## Arabic quality (designer decision pending)
Understandable and on-tone, but not yet polished: occasional misspellings (الأعمار/الأعماق), creature gender drift, a few Iraqi words in duck lines (كلش، يابه — caught by the validator), and body parts translated freely («آذان الرادياتير»).
Fixes applied after round 3, not yet measured: creature always masculine, third-person narration, forbidden-word list, official Arabic names of parts and places sent in the brief.
Production rule: any AI duck line flagged by the dialect check is replaced by an authored line; hints are never AI-written.

## Next
1. Re-run 20 adventures after the quota resets to measure the Arabic fixes.
2. Build the Worker (key as a Cloudflare secret), with flash-lite primary, flash fallback, procedural fallback, and the story bank (KV).
