# AI story evaluation — gemini / gemini-3.5-flash-lite

Runs: 6 (3 classic, 3 marine). Generated 2026-11-08T20:08:13.124Z.

| Metric | Value |
|---|---|
| Outlines valid (first try) | 50% |
| Beats valid (first try) | 64% |
| Endings valid (first try) | 67% |
| Runs completed end-to-end | 2/6 |
| Avg latency: outline / beat / ending | 2127 / 3856 / 1142 ms |
| Avg per full run | 8 calls, 15321 in-tokens, 9580 out-tokens |
| HTTP 429 (quota) responses | 6 |
| Distinct premise tags | 3/3 |
| Distinct twist tags | 3/3 |
| Distinct place sequences | 2/3 |
| Outline text similarity (bigram Jaccard) mean / max | 0.054 / 0.095 |
| Possible wrong-dialect flags (Arabic) | 0 |
| Validation errors (all attempts) | 8 |
| Replies needing a JSON syntax repair | 0 |

Most common errors: unparseable (#): ×6, unparseable (#): {
  "act_id": "act_#",
  "text": {
    "en": "Inside ×1, unparseable (#): {
  "act_id": "act_#",
  "text": {
    "en": "Deep wi×1

Premise tags: abyssal_pulse, phantom_trench, abyssal_echo

Twist tags: deep_signal, magnetic_core, submerged_signal
