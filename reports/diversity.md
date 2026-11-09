# Diversity report (simulated playthroughs)

Each mode: 1000 complete runs with random creatures, ducks and choices, carrying run history (as a real player's localStorage would). A second 1000-run campaign without history is the baseline for the anti-repetition metrics.

| Metric | Classic BioLab | Marine Science Club |
|---|---|---|
| Invariant errors | 0 | 0 |
| Unique story plans | 1000 (100%) | 999 (99.9%) |
| Unique full paths (plan + choices + results) | 1000 (100%) | 1000 (100%) |
| Distinct ending archetypes | 12 | 13 |
| Distinct ending titles | 31 | 27 |
| Ending entropy (0–1) | 0.85 | 0.9 |
| Story templates reached | 32/32 | 30/30 |
| Avg beats per run | 9.2 | 11.2 |
| Consecutive-run similarity (with history) | 0.094 | 0.132 |
| Consecutive-run similarity (no history) | 0.11 | 0.141 |
| Max plan similarity to last 10 runs (with history) | 0.236 | 0.303 |
| Max plan similarity to last 10 runs (no history) | 0.317 | 0.373 |
| Check success rate | 51.4% | 58.7% |
| Success by base animal | owl 56%, axolotl 49.7%, camel 46%, gecko 50.1%, fennec 53.6%, octopus 55.5%, pangolin 51.1%, frog 48.4% | octopus 66.2%, pangolin 61%, camel 59.9%, frog 56.9%, gecko 57.5%, fennec 54.5%, owl 55.6%, axolotl 57.6% |
| Anatomy-gated choices taken | 7.9% | 6.9% |
| Sailor legend runs | — | 46.2% |

## Endings

```json
{
 "classic": {
  "chaos": 262,
  "machine": 69,
  "cryptid": 73,
  "reunion": 168,
  "vex-defeated": 56,
  "guardian": 186,
  "wild": 64,
  "field-team": 52,
  "unsolved": 28,
  "nap": 10,
  "frenemies": 17,
  "publish": 15
 },
 "marine": {
  "glimpse": 162,
  "vent-day": 99,
  "chaos": 214,
  "eye-to-eye": 104,
  "reef-heroes": 73,
  "voice-deep": 53,
  "proof": 65,
  "publish": 26,
  "peace": 86,
  "beacon": 50,
  "blurry": 44,
  "field-team": 22,
  "nap": 2
 }
}
```

## Twists / climaxes / hooks

```json
{
 "classic": {
  "twists": {
   "t-signal-self": 205,
   "t-escapees": 182,
   "t-legend": 181,
   "t-prof-alive": 191,
   "t-clone": 241
  },
  "climaxes": {
   "k-collapse": 566,
   "k-machine": 193,
   "k-vex": 241
  },
  "hooks": {
   "h-signal": 246,
   "h-escape": 241,
   "h-contest": 262,
   "h-prof": 251
  }
 },
 "marine": {
  "twists": {
   "tm-probe": 462,
   "tm-whalefall": 288,
   "tm-squid": 250
  },
  "climaxes": {
   "km-leviathan": 462,
   "km-eruption": 275,
   "km-tether": 263
  },
  "hooks": {
   "hm-reef": 343,
   "hm-nets": 319,
   "hm-sound": 338
  }
 }
}
```
