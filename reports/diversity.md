# Diversity report (simulated playthroughs)

Each mode: 1000 complete runs with random creatures, ducks and choices, carrying run history (as a real player's localStorage would). A second 1000-run campaign without history is the baseline for the anti-repetition metrics.

| Metric | Classic BioLab | Marine Science Club |
|---|---|---|
| Invariant errors | 0 | 0 |
| Unique story plans | 999 (99.9%) | 999 (99.9%) |
| Unique full paths (plan + choices + results) | 1000 (100%) | 1000 (100%) |
| Distinct ending archetypes | 12 | 13 |
| Distinct ending titles | 31 | 26 |
| Ending entropy (0–1) | 0.87 | 0.9 |
| Story templates reached | 31/31 | 28/28 |
| Avg beats per run | 9.2 | 11.2 |
| Consecutive-run similarity (with history) | 0.105 | 0.145 |
| Consecutive-run similarity (no history) | 0.117 | 0.159 |
| Max plan similarity to last 10 runs (with history) | 0.26 | 0.344 |
| Max plan similarity to last 10 runs (no history) | 0.341 | 0.421 |
| Check success rate | 54.3% | 58.9% |
| Success by base animal | owl 61.2%, axolotl 51%, camel 48.7%, gecko 56%, fennec 54%, octopus 58.1%, pangolin 55.8%, frog 48.8% | octopus 67.2%, pangolin 58.6%, camel 58.9%, frog 57.6%, gecko 56.9%, fennec 53.2%, owl 61.4%, axolotl 57.2% |
| Anatomy-gated choices taken | 8.1% | 7.1% |
| Sailor legend runs | — | 47.8% |

## Endings

```json
{
 "classic": {
  "chaos": 252,
  "machine": 83,
  "cryptid": 65,
  "reunion": 165,
  "vex-defeated": 54,
  "frenemies": 30,
  "guardian": 183,
  "nap": 18,
  "wild": 58,
  "unsolved": 24,
  "field-team": 38,
  "publish": 30
 },
 "marine": {
  "glimpse": 169,
  "vent-day": 96,
  "chaos": 198,
  "peace": 84,
  "eye-to-eye": 101,
  "voice-deep": 57,
  "proof": 65,
  "reef-heroes": 87,
  "field-team": 18,
  "blurry": 47,
  "publish": 46,
  "beacon": 31,
  "nap": 1
 }
}
```

## Twists / climaxes / hooks

```json
{
 "classic": {
  "twists": {
   "t-signal-self": 215,
   "t-escapees": 204,
   "t-legend": 176,
   "t-prof-alive": 185,
   "t-clone": 220
  },
  "climaxes": {
   "k-collapse": 517,
   "k-machine": 239,
   "k-vex": 244
  },
  "hooks": {
   "h-signal": 257,
   "h-escape": 253,
   "h-contest": 246,
   "h-prof": 244
  }
 },
 "marine": {
  "twists": {
   "tm-probe": 458,
   "tm-whalefall": 292,
   "tm-squid": 250
  },
  "climaxes": {
   "km-leviathan": 478,
   "km-eruption": 254,
   "km-tether": 268
  },
  "hooks": {
   "hm-reef": 343,
   "hm-nets": 331,
   "hm-sound": 326
  }
 }
}
```
