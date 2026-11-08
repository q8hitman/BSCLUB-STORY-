"""Export curated plates (all batches) to public/scenes/*.webp and write src/content/plates.json.
Every plate listed here was reviewed by eye; rejected ones are excluded and fall back to the procedural painter."""
import json, os
from PIL import Image
SRC = "C:/Users/User/AI/bsc-plates"
BATCHES = [
    ("scripts/comfy/plates-batch1.json", "batch1",
     {"cave-pool-eyes": "batch1-redo/cave-pool-eyes-v2", "swamp-croc-log": "batch1-redo/swamp-croc-log-v1",
      "opensea-research-ship": "batch1-redo/opensea-research-ship-v1", "opensea-sailor-tale": "batch1-redo/opensea-sailor-tale-v2",
      "vents-iron-snail": "batch1-redo/vents-iron-snail-v1", "specimen-pangolin": "batch1-redo/specimen-pangolin-v1",
      "mountain-giant-footprint": "batch1-redo/mountain-giant-footprint-v1"},
     {"midnight-bathysphere", "trench-giant", "desert-sandstorm-wall"}),
    ("scripts/comfy/plates-batch2.json", "batch2", {}, {"vents-smoker-pass", "trench-eye"}),
    ("scripts/comfy/plates-legends.json", "legends",
     {"legend-abu-sabaa": "legends/legend-abu-sabaa-v3", "legend-alhajin-sifr": "legends-redo/legend-alhajin-sifr-v1",
      "legend-bu-sahn": "legends/legend-bu-sahn-v1", "legend-jawqat-alqa": "legends/legend-jawqat-alqa-v2",
      "legend-katib-almad": "legends/legend-katib-almad-v3", "legend-mashi-alkuthban": "legends/legend-mashi-alkuthban-v3",
      "legend-musghi-alsaqee": "legends-redo/legend-musghi-alsaqee-v2", "legend-ouyoun-alhawd": "legends-redo/legend-ouyoun-alhawd-v2",
      "legend-raai-aladwa": "legends/legend-raai-aladwa-v2", "legend-sahibat-alquroun": "legends-redo/legend-sahibat-alquroun-v1",
      "legend-saraqat-allulu": "legends/legend-saraqat-allulu-v2", "legend-umm-alfanar": "legends/legend-umm-alfanar-v2"}, set()),
]
os.makedirs("public/scenes", exist_ok=True)
manifest = []
for path, folder, pick, reject in BATCHES:
    for p in json.load(open(path, encoding="utf-8")):
        if p["id"] in reject: continue
        src = f"{SRC}/{pick.get(p['id'], folder + '/' + p['id'])}.png"
        Image.open(src).convert("RGB").resize((1344, 768), Image.LANCZOS).save(f"public/scenes/{p['id']}.webp", quality=80, method=6)
        manifest.append({k: p[k] for k in ("id", "biome", "event", "tone", "mystery", "style")})
json.dump(manifest, open("src/content/plates.json", "w", encoding="utf-8"), indent=1)
total = sum(os.path.getsize(f"public/scenes/{m['id']}.webp") for m in manifest)
print(len(manifest), "plates,", round(total / 1e6, 1), "MB")
