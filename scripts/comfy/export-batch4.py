"""Export reviewed batch-4 picks (rare creatures, camp moments, endings) to public/scenes/*.webp and the manifest.
picks-batch4.json: {"rare": {name: "v1"|"v2"|"r1".."r3"|"x"}, "camp": {...}, "ending": {...}}; "rN" = batch4-redo folder.
Rare creatures are square 768x768 specimen cards; camp/ending plates are 1344x768 scenes. Re-runnable."""
import json, os
from PIL import Image
SRC = "C:/Users/User/AI/bsc-plates"
picks = json.load(open("scripts/comfy/picks-batch4.json", encoding="utf-8"))
manifest = json.load(open("src/content/plates.json", encoding="utf-8"))
by_id = {m["id"]: i for i, m in enumerate(manifest)}
RENAME = {"giant-squid-glow": "kraken-squid"}  # generated id -> game id
CAMP_BIOME = {"camp-desert-stars": "desert", "camp-forest-fireflies": "forest", "camp-cave-mushrooms": "cave", "camp-snow-cocoa": "snow",
              "camp-boat-sunset": "seagrass", "camp-sub-porthole": "midnight", "camp-lab-night-tea": "lab", "camp-mountain-ledge": "mountain",
              "camp-swamp-raft": "swamp", "camp-mudflat-sunrise": "mudflat"}
def put(entry):
    if entry["id"] in by_id: manifest[by_id[entry["id"]]] = entry
    else: by_id[entry["id"]] = len(manifest); manifest.append(entry)
def src(gen_id, v):
    folder, tag = ("batch4-redo", "v" + v[1:]) if v.startswith("r") else ("batch4", v)
    return f"{SRC}/{folder}/{gen_id}-{tag}.png"
n = 0
for name, v in picks.get("rare", {}).items():
    if v == "x": continue
    gid = f"specimen-rare-{name}"; out = f"specimen-rare-{RENAME.get(name, name)}"
    Image.open(src(gid, v)).convert("RGB").resize((768, 768), Image.LANCZOS).save(f"public/scenes/{out}.webp", quality=80, method=6)
    put({"id": out, "biome": "lab", "event": "rare", "tone": "mysterious", "mystery": 2, "style": "specimen"}); n += 1
for kind in ("camp", "ending"):
    for pid, v in picks.get(kind, {}).items():
        if v == "x": continue
        Image.open(src(pid, v)).convert("RGB").resize((1344, 768), Image.LANCZOS).save(f"public/scenes/{pid}.webp", quality=80, method=6)
        put({"id": pid, "biome": CAMP_BIOME.get(pid, "lab"), "event": kind, "tone": "wholesome", "mystery": 0 if kind == "camp" else 1, "style": "nocturne"}); n += 1
json.dump(manifest, open("src/content/plates.json", "w", encoding="utf-8"), indent=1)
total = sum(os.path.getsize(f"public/scenes/{m['id']}.webp") for m in manifest if os.path.exists(f"public/scenes/{m['id']}.webp"))
print(n, "exported;", len(manifest), "plates total,", round(total / 1e6, 1), "MB")
