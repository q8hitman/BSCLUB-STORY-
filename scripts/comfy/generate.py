"""Batch-generate event plates with a local ComfyUI (http://127.0.0.1:8188) using SDXL.

Usage:
  python scripts/comfy/generate.py scripts/comfy/plates-artdirection.json out_dir [--variants 2]

Each plate: {"id", "prompt", "seed"?, "negative"?}. The shared STYLE keeps every image in one art direction.
Only uses ComfyUI's built-in nodes and its local HTTP API (no third-party nodes, nothing leaves the PC).
"""
import json, sys, time, urllib.request, urllib.parse, os, random

HOST = os.environ.get("COMFY_HOST", "http://127.0.0.1:8188")
CKPT = os.environ.get("COMFY_CKPT", "sd_xl_base_1.0.safetensors")
VAE = os.environ.get("COMFY_VAE", "sdxl_vae_fp16_fix.safetensors")

# Style presets (the designer welcomes variety; all share dark, selective lighting and rich texture).
STYLES = {
    # Benchmark: 1930s deep-sea expedition gouache on black paper (designer's references).
    "abyss": ("gouache painting on black paper, 1930s deep-sea expedition natural history illustration, creatures emerging from a pure black void, "
              "tiny bioluminescent dots, fine white highlights, muted earthy colours with luminous accents, eerie, mysterious, highly detailed",
              "sky, horizon, sea surface, waves, moon, sun, land, clouds, trees, bright background, daylight"),
    # Same gouache-on-dark language for land mysteries.
    "nocturne": ("gouache and ink painting on dark paper, 1930s natural-history expedition art, moody cinematic lighting, selective glowing light in darkness, "
                 "rich texture, visible brush strokes, muted palette with luminous accents, mysterious atmosphere, wide establishing shot, highly detailed", ""),
    "ink": ("graphic novel illustration, bold ink linework, limited muted palette, dramatic chiaroscuro, cinematic wide shot, mysterious atmosphere, highly detailed", ""),
    "storybook": ("whimsical storybook illustration, gouache and ink, warm lamplight, playful and expressive, rich detail, cinematic composition, gentle humour", ""),
    "specimen": ("natural history specimen plate, single creature centred on a black background, gouache on black paper, meticulous detail, "
                 "soft rim light, scientific illustration, eerie and beautiful", "background scenery, sky, horizon, land"),
}
NEGATIVE = ("photo, photorealistic, 3d render, cgi, anime, chibi, text, letters, words, watermark, signature, logo, "
            "frame, border, gore, blood, lowres, blurry, jpeg artifacts, deformed, extra limbs, human face close-up")

def workflow(prompt, negative, seed, style="nocturne", w=1344, h=768, steps=28, cfg=6.0):
    st, st_neg = STYLES[style]
    neg = ", ".join(x for x in [negative, st_neg, NEGATIVE] if x)
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": f"{prompt}, {st}"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": neg}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0],
                                                    "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["2", 0]}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0], "filename_prefix": "bsc_plate"}},
    }

def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def get(path):
    return urllib.request.urlopen(HOST + path, timeout=60).read()

def run(plate, seed, out_dir, tag):
    pid = post("/prompt", {"prompt": workflow(plate["prompt"], plate.get("negative", ""), seed, plate.get("style", "nocturne"), plate.get("w", 1344), plate.get("h", 768))})["prompt_id"]
    t0 = time.time()
    while True:
        hist = json.loads(get(f"/history/{pid}"))
        if pid in hist:
            break
        time.sleep(1.5)
    for node in hist[pid]["outputs"].values():
        for img in node.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img["subfolder"], "type": img["type"]})
            path = os.path.join(out_dir, f"{plate['id']}{tag}.png")
            open(path, "wb").write(get(f"/view?{q}"))
            print(f"{path}  ({time.time() - t0:.1f}s, seed {seed})", flush=True)

def main():
    plates = json.load(open(sys.argv[1], encoding="utf-8"))
    out_dir = sys.argv[2]
    variants = int(sys.argv[sys.argv.index("--variants") + 1]) if "--variants" in sys.argv else 1
    os.makedirs(out_dir, exist_ok=True)
    for p in plates:
        base = p.get("seed", random.randint(1, 2**31))
        for v in range(variants):
            if os.path.exists(os.path.join(out_dir, f"{p['id']}{f'-v{v + 1}' if variants > 1 else ''}.png")):
                continue  # resumable
            run(p, base + v * 7919, out_dir, f"-v{v + 1}" if variants > 1 else "")

if __name__ == "__main__":
    main()
