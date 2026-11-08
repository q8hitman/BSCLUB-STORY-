"""Export curated plates to public/scenes/*.webp and write src/content/plates.json (tags for the game)."""
import json, os, sys
from PIL import Image
SRC = "C:/Users/User/AI/bsc-plates"
plates = json.load(open("scripts/comfy/plates-batch1.json", encoding="utf-8"))
# curated picks from the redo pass; rejected plates fall back to the procedural painter in-game
PICK = {"cave-pool-eyes": "batch1-redo/cave-pool-eyes-v2", "swamp-croc-log": "batch1-redo/swamp-croc-log-v1",
        "opensea-research-ship": "batch1-redo/opensea-research-ship-v1", "opensea-sailor-tale": "batch1-redo/opensea-sailor-tale-v2",
        "vents-iron-snail": "batch1-redo/vents-iron-snail-v1", "specimen-pangolin": "batch1-redo/specimen-pangolin-v1",
        "mountain-giant-footprint": "batch1-redo/mountain-giant-footprint-v1"}
REJECT = {"midnight-bathysphere", "trench-giant", "desert-sandstorm-wall"}
os.makedirs("public/scenes", exist_ok=True)
manifest = []
for p in plates:
    if p["id"] in REJECT: continue
    src = f"{SRC}/{PICK.get(p['id'], 'batch1/' + p['id'])}.png"
    Image.open(src).convert("RGB").resize((1344, 768), Image.LANCZOS).save(f"public/scenes/{p['id']}.webp", quality=80, method=6)
    manifest.append({k: p[k] for k in ("id", "biome", "event", "tone", "mystery", "style")})
json.dump(manifest, open("src/content/plates.json", "w", encoding="utf-8"), indent=1)
total = sum(os.path.getsize(f"public/scenes/{m['id']}.webp") for m in manifest)
print(len(manifest), "plates,", round(total / 1e6, 1), "MB")
