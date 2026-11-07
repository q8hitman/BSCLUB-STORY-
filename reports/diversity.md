# Diversity report (simulated playthroughs)

Each mode: 1000 complete runs with random creatures, ducks and choices, carrying run history (as a real player's localStorage would). A second 1000-run campaign without history is the baseline for the anti-repetition metrics.

| Metric | Classic BioLab | Marine Science Club |
|---|---|---|
| Invariant errors | 0 | 0 |
| Unique story plans | 999 (99.9%) | 999 (99.9%) |
| Unique full paths (plan + choices + results) | 1000 (100%) | 1000 (100%) |
| Distinct ending archetypes | 12 | 13 |
| Distinct ending titles | 31 | 27 |
| Ending entropy (0–1) | 0.92 | 0.95 |
| Story templates reached | 31/31 | 28/28 |
| Avg beats per run | 9.2 | 11.2 |
| Consecutive-run similarity (with history) | 0.109 | 0.158 |
| Consecutive-run similarity (no history) | 0.123 | 0.174 |
| Max plan similarity to last 10 runs (with history) | 0.26 | 0.344 |
| Max plan similarity to last 10 runs (no history) | 0.341 | 0.421 |
| Check success rate | 55% | 58.3% |
| Success by base animal | owl 60.3%, axolotl 50%, camel 51.1%, gecko 54.6%, fennec 53.7%, octopus 60%, pangolin 56.7%, frog 52.7% | octopus 66.1%, pangolin 58.9%, camel 61.3%, frog 57.4%, gecko 57.4%, fennec 51.3%, owl 57.6%, axolotl 56.2% |
| Anatomy-gated choices taken | 9% | 8.2% |
| Sailor legend runs | — | 47.8% |

## Endings

```json
{
 "classic": {
  "chaos": 170,
  "machine": 89,
  "cryptid": 73,
  "reunion": 152,
  "field-team": 53,
  "guardian": 167,
  "frenemies": 30,
  "vex-defeated": 81,
  "wild": 93,
  "publish": 48,
  "unsolved": 25,
  "nap": 19
 },
 "marine": {
  "publish": 60,
  "chaos": 119,
  "proof": 74,
  "beacon": 71,
  "glimpse": 120,
  "peace": 110,
  "voice-deep": 75,
  "vent-day": 89,
  "reef-heroes": 103,
  "eye-to-eye": 103,
  "field-team": 22,
  "blurry": 52,
  "nap": 2
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
