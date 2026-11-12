"""Slice Najdi's character sheet (art-source/ducks-final/najdi.png, untouched original) into expression and pose
cards in public/ducks/najdi/. His sheet has a different layout from the other members' sheets, so the boxes were
set by eye. Nothing is redrawn; cards are only cropped and enlarged uniformly."""
import json, os
from PIL import Image

SRC = "art-source/ducks-final/najdi.png"
OUT = "public/ducks/najdi"
EXPR = {  # (left, top, right, bottom) on the sheet
    "happy": (396, 22, 597, 292),
    "laughing": (597, 22, 795, 292),
    "sly": (390, 300, 588, 545),       # the sunglasses face
    "shocked": (988, 22, 1190, 292),
    "curious": (588, 300, 790, 545),   # hand on chin
    "worried": (790, 282, 985, 545),   # sweat drop and question mark
}
POSES = {
    "front": (10, 12, 432, 925),
    "disc": (20, 928, 252, 1300),
    "binoculars": (252, 928, 470, 1300),
    "dig": (470, 928, 716, 1300),
    "reading": (716, 928, 908, 1300),
    "skull": (920, 928, 1185, 1300),
}

def main():
    im = Image.open(SRC).convert("RGB")
    os.makedirs(OUT, exist_ok=True)
    reg = {"sheet": SRC, "size": list(im.size), "expressions": {}, "poses": {}}
    for name, box in EXPR.items():
        c = im.crop(box); c = c.resize((round(c.width * 1.4), round(c.height * 1.4)), Image.LANCZOS)
        c.save(f"{OUT}/expr-{name}.webp", quality=90, method=6); reg["expressions"][name] = f"ducks/najdi/expr-{name}.webp"
    for name, box in POSES.items():
        c = im.crop(box)
        if name != "front": c = c.resize((round(c.width * 1.3), round(c.height * 1.3)), Image.LANCZOS)
        c.save(f"{OUT}/pose-{name}.webp", quality=90, method=6); reg["poses"][name] = f"ducks/najdi/pose-{name}.webp"
    p = "src/content/duck-assets.json"
    a = json.load(open(p, encoding="utf-8")); a["najdi"] = reg
    json.dump(a, open(p, "w", encoding="utf-8"), indent=1)
    print("ok", im.getpixel((6, 6)), im.getpixel((6, 600)), im.getpixel((425, 900)))

if __name__ == "__main__":
    main()
