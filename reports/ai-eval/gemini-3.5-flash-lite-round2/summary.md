# AI story evaluation — gemini / gemini-3.5-flash-lite

Runs: 20 (10 classic, 10 marine). Generated 2026-11-08T20:01:27.329Z.

| Metric | Value |
|---|---|
| Outlines valid (first try) | 75% |
| Beats valid (first try) | 93% |
| Endings valid (first try) | 100% |
| Runs completed end-to-end | 20/20 |
| Avg latency: outline / beat / ending | 3672 / 4569 / 1503 ms |
| Avg per full run | 11 calls, 22119 in-tokens, 15118 out-tokens |
| HTTP 429 (quota) responses | 0 |
| Distinct premise tags | 16/20 |
| Distinct twist tags | 10/20 |
| Distinct place sequences | 10/20 |
| Outline text similarity (bigram Jaccard) mean / max | 0.025 / 0.200 |
| Possible wrong-dialect flags (Arabic) | 2 |
| Validation errors (all attempts) | 19 |
| Replies needing a JSON syntax repair | 2 |

Most common errors: act #: prop sand not in catalog×3, choice #: uses capability "electricShock" the creature does not have×2, choice #: uses capability "true" the creature does not have×2, unparseable (#): {
  "act_id": "act_#",
  "text": {
    "en": "Deep wi×1, act #: back to surface after The Deep×1, unparseable (#): {
  "act_id": "act_#",
  "text": {
    "en": "Inside ×1, choice #: uses capability "intellect" the creature does not have×1, unparseable (#): {
  "act_id": "act_#",
  "text": {
    "en": "The mud×1

Premise tags: abyssal_signal, abyssal_signal, echoes_of_the_deep, kubbar_signal, abyssal_whispers, kubbar_deep_echo, lab_leak_laugh, kubbar_camel_dive, abyssal_pulse_signal, kubbar_pulse_descent, abyssal_acoustic_signal, kubbar_acoustic_descent, cave_echo_mystery, kubbar_pulse_descent, abyssal_acoustic_signal, kubbar_acoustic_descent, gecko_lab_heatwave, kubbar_bubble_upheaval, desert_heatwave_mystery, kubbar_acoustic_signal

Twist tags: bioluminescent_origin, bioluminescent_origin, abyssal_signal, deep_current, deep_current, bioluminescent_origin, glow_frog_surprise, pearl_diving_secret, bioluminescent_origin, pearl_diving_secret, deep_current_anomaly, abyssal_resonance_origin, subterranean_anomaly, abyssal_resonance_origin, abyssal_resonance_origin, abyssal_resonance_origin, radio_anomaly, coral_vent_singing, radio_anomaly, abyssal_resonance_origin
