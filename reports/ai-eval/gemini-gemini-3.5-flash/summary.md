# AI story evaluation — gemini / gemini-3.5-flash

Runs: 6 (3 classic, 3 marine). Generated 2026-11-08T20:06:05.338Z.

| Metric | Value |
|---|---|
| Outlines valid (first try) | 67% |
| Beats valid (first try) | 71% |
| Endings valid (first try) | 75% |
| Runs completed end-to-end | 3/6 |
| Avg latency: outline / beat / ending | 5319 / 7818 / 2201 ms |
| Avg per full run | 8 calls, 16138 in-tokens, 11068 out-tokens |
| HTTP 429 (quota) responses | 6 |
| Distinct premise tags | 4/4 |
| Distinct twist tags | 4/4 |
| Distinct place sequences | 4/4 |
| Outline text similarity (bigram Jaccard) mean / max | 0.004 / 0.026 |
| Possible wrong-dialect flags (Arabic) | 1 |
| Validation errors (all attempts) | 11 |
| Replies needing a JSON syntax repair | 0 |

Most common errors: unparseable (#): ×6, beat.duck_line: missing en/ar×2, beat.text: missing en/ar×1, choices: undefined (need #)×1, choice #.fail: effect creature_state×1

Premise tags: heat_wave_vibrations, trench_acoustic_anomaly, drainage_subharmonic_echoes, mycelial_signal_decay

Twist tags: ancient_microbial_colony, submerged_ancient_hydrophone_array, bioluminescent_fungal_bioreactor, synthetic_dna_spore_dispersal
