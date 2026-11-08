"""Slice the approved BSC duck character sheets (art-source/ducks-final/*.png, untouched originals)
into individual expression and pose cards in public/ducks/<id>/. Cuts follow the empty gaps between
drawings; nothing is redrawn, masked or resized non-uniformly."""
import json, os
import numpy as np
from PIL import Image, ImageFilter

SRC = "art-source/ducks-final"
EXPR = ["happy", "curious", "shocked", "worried", "laughing", "sly"]  # same order on every sheet
POSES = {  # bottom-row poses, left to right (from inspecting each sheet)
    "abdullah": ["front", "front-alt", "back", "inspect"],
    "ahmed": ["front", "reading", "back", "cheer"],
    "camel": ["front", "reading", "back", "cheer"],
    "bassam": ["front", "tablet", "back", "sitting"],
    "kiraz": ["front", "reading", "back", "sitting"],
    "roaa": ["front", "clipboard", "examine", "back", "sitting"],
    "zahra": ["front", "writing", "present", "back", "sitting"],
}

# Where poses stand too close for automatic gap detection, cuts were set by eye on the sheet.
MANUAL_POSE_CUTS = {"roaa": [298, 552, 815, 1070]}

def ink(im):
    rgb = np.array(im.convert("RGB")).astype(int)
    bg = np.array(im.convert("RGB").filter(ImageFilter.GaussianBlur(40))).astype(int)
    return (np.abs(rgb - bg).sum(2) > 60).astype(float)

def splits(profile, k, lo, hi, minsep):
    """k-1 cut positions at the emptiest columns/rows, at least minsep apart."""
    idx = np.argsort(profile[lo:hi]) + lo
    cuts = []
    for i in idx:
        if all(abs(i - c) >= minsep for c in cuts):
            cuts.append(int(i))
        if len(cuts) == k - 1:
            break
    return sorted(cuts)

def main():
    registry = {}
    for cid, poses in POSES.items():
        im = Image.open(f"{SRC}/{cid}.png").convert("RGB")
        W, H = im.size
        m = ink(im)
        row = np.convolve(m.mean(1), np.ones(9) / 9, "same")
        top_h = splits(row, 2, 280, 430, 10)[0]
        out = f"public/ducks/{cid}"; os.makedirs(out, exist_ok=True)
        # expressions: 6 cells across the top row, cut at the emptiest columns
        colt = np.convolve(m[:top_h].mean(0), np.ones(9) / 9, "same")
        xs = [0] + splits(colt, 6, 60, W - 60, W // 9) + [W]
        expr = {}
        for i, name in enumerate(EXPR):
            cell = im.crop((xs[i], 0, xs[i + 1], top_h))
            cell.save(f"{out}/expr-{name}.webp", quality=88, method=6); expr[name] = f"ducks/{cid}/expr-{name}.webp"
        colb = np.convolve(m[top_h:].mean(0), np.ones(15) / 15, "same")
        xb = [0] + (MANUAL_POSE_CUTS.get(cid) or splits(colb, len(poses), 80, W - 80, W // (len(poses) + 3))) + [W]
        pose = {}
        for i, name in enumerate(poses):
            cell = im.crop((xb[i], top_h, xb[i + 1], H))
            cell.save(f"{out}/pose-{name}.webp", quality=88, method=6); pose[name] = f"ducks/{cid}/pose-{name}.webp"
        registry[cid] = {"sheet": f"art-source/ducks-final/{cid}.png", "size": [W, H], "expressions": expr, "poses": pose}
        print(cid, "top", top_h, "expr cuts", xs[1:-1], "pose cuts", xb[1:-1])
    json.dump(registry, open("src/content/duck-assets.json", "w", encoding="utf-8"), indent=1)

if __name__ == "__main__":
    main()
