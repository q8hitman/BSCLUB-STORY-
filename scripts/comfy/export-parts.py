"""Export reviewed builder-option pictures to public/parts/<partId>.webp (480x360, centre crop) and list them in
src/content/part-art.json. picks-parts.json maps part id -> "v1"/"v2" (main batch) or "r1".."r3" (redo batch)."""
import json, os
from PIL import Image
SRC = "C:/Users/User/AI/bsc-plates"
picks = json.load(open("scripts/comfy/picks-parts.json", encoding="utf-8"))
os.makedirs("public/parts", exist_ok=True)
done = []
for pid, v in sorted(picks.items()):
    folder, tag = ("parts-redo", "v" + v[1:]) if v.startswith("r") else ("parts", v)
    im = Image.open(f"{SRC}/{folder}/part-{pid}-{tag}.png").convert("RGB")
    w, h = im.size  # square → 4:3 centre crop
    ch = int(w * 3 / 4); top = (h - ch) // 2
    im.crop((0, top, w, top + ch)).resize((480, 360), Image.LANCZOS).save(f"public/parts/{pid}.webp", quality=78, method=6)
    done.append(pid)
json.dump(done, open("src/content/part-art.json", "w", encoding="utf-8"), indent=0)
print(len(done), "part pictures,", round(sum(os.path.getsize(f"public/parts/{p}.webp") for p in done) / 1e6, 2), "MB")
