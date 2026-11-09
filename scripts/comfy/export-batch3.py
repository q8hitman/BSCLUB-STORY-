"""Export the reviewed picks of specimens2 / specimens3 / batch3 to public/scenes/*.webp and append them to
src/content/plates.json. picks-batch3.json maps plate id -> "v1" | "v2" (anything else / missing = rejected).
Re-runnable: existing manifest entries with the same id are replaced."""
import json, os
from PIL import Image
SRC = "C:/Users/User/AI/bsc-plates"
picks = json.load(open("scripts/comfy/picks-batch3.json", encoding="utf-8"))
manifest = json.load(open("src/content/plates.json", encoding="utf-8"))
by_id = {m["id"]: i for i, m in enumerate(manifest)}
added = 0
for folder, spec in [("specimens2", "plates-specimens2.json"), ("specimens3", "plates-specimens3.json"), ("batch3", "plates-batch3.json"),
                     ("specimens-redo", "plates-specimens-redo.json"), ("batch3-redo", "plates-batch3-redo.json")]:
    if not os.path.exists(f"scripts/comfy/{spec}"): continue
    for p in json.load(open(f"scripts/comfy/{spec}", encoding="utf-8")):
        v = picks.get(folder, {}).get(p["id"])
        if v not in ("v1", "v2", "v3"):
            continue
        Image.open(f"{SRC}/{folder}/{p['id']}-{v}.png").convert("RGB").resize((1344, 768), Image.LANCZOS) \
            .save(f"public/scenes/{p['id']}.webp", quality=80, method=6)
        entry = {k: p[k] for k in ("id", "biome", "event", "tone", "mystery", "style")}
        if p["id"] in by_id: manifest[by_id[p["id"]]] = entry
        else: by_id[p["id"]] = len(manifest); manifest.append(entry)
        added += 1
json.dump(manifest, open("src/content/plates.json", "w", encoding="utf-8"), indent=1)
total = sum(os.path.getsize(f"public/scenes/{m['id']}.webp") for m in manifest)
print(added, "exported;", len(manifest), "plates total,", round(total / 1e6, 1), "MB")
