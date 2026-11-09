"""Second try for batch3 scenes and specimens that were rejected on review (wrong subject or setting).
Writes scripts/comfy/plates-batch3-redo.json and records the reviewed picks so far in picks-batch3.json."""
import json
f = "scripts/comfy/picks-batch3.json"
d = json.load(open(f, encoding="utf-8"))
d["batch3"].update({"seagrass-meadow-dawn": "v2", "seagrass-seahorse-garden": "v2", "snow-cracking-ice": "v1", "snow-giant-pawprint": "v2",
    "snow-ice-cave": "v2", "snow-whiteout": "v1", "swamp-eyes-water": "v2", "swamp-frog-chorus": "v2", "swamp-glow-swamp": "v2",
    "swamp-heron-hunt": "v2", "trench-deep-ping": "x", "trench-edge-drop": "v2", "trench-huge-trail": "v2", "trench-pressure-crack": "v1",
    "trench-sea-pig-parade": "x", "trench-snailfish-lander": "v1", "twilight-flash-code": "v2", "twilight-hatchet-school": "v2",
    "twilight-jelly-bump": "v2", "twilight-light-show": "v1", "twilight-migration-rush": "v1", "twilight-sucker-marks": "x",
    "vents-boiling-vent": "x", "vents-chimney-maze": "v1", "vents-crab-swarm": "v2", "vents-mineral-bones": "v1", "vents-pale-shapes": "v2",
    "vents-shimmer": "v2", "vents-worm-tickle": "v1"})
d["specimens-redo"] = {"specimen-fiddler-crab": "v1", "specimen-giant-squid": "v3", "specimen-swordfish": "v2", "specimen-tiger-shark": "v1"}
d.setdefault("batch3-redo", {})
json.dump(d, open(f, "w", encoding="utf-8"), indent=1)

b3 = {p["id"]: p for p in json.load(open("scripts/comfy/plates-batch3.json", encoding="utf-8"))}
UW = "underwater view beneath the sea surface, "
NEW = {
 "seagrass-dugong-call": UW + "a dugong silhouette far away in green water above a seagrass meadow, faint ripples of sound rings spreading through the water",
 "seagrass-feeding-trail": UW + "a long bare sandy trail eaten through a dense green seagrass meadow on the seabed, sun rays from above",
 "seagrass-hidden-ray": UW + "a stingray hidden under sand on the seabed between seagrass, only its two eyes and long barbed tail visible",
 "seagrass-murky-water": UW + "cloudy murky brown-green water over a seagrass meadow, a diver torch beam barely cutting through the haze",
 "reef-current-sweep": UW + "a strong current sweeping sand and small fish sideways across a coral reef, bent sea fans, a diver gripping a rock",
 "reef-dark-crevice": UW + "a deep black crevice in a coral reef with a pair of glinting eyes and sharp teeth inside, small fish fleeing",
 "opensea-floating-island": UW + "looking up at a floating mat of golden sargassum seaweed at the surface, small fish and baby sea turtles hiding below it, sun rays",
 "opensea-sonar-ping": "the glowing green circular sonar screen inside a dark research boat cabin at night, a huge unknown shape blip on the screen",
 "desert-burrow-eyes": "close view of sand burrows in Arabian desert at night, small glowing reflective eyes peeking out from many holes, moonlight",
 "desert-quick-sand": "a collapsing sand sinkhole in the desert, sand pouring down into a dark funnel, a rope tied to a stake at the edge, sunset",
 "forest-claw-bark": "close-up of a tree trunk in a dark forest with five deep fresh claw marks gouged into the bark, torchlight, tufts of brown fur",
 "lab-flooded-lab": "a university laboratory flooded knee-deep with water, floating papers and sample boxes, sparking ceiling lamp, reflections",
 "lab-vent-eyes": "close-up of a metal air vent grille in a dark laboratory wall with two small glowing eyes peering out between the slats",
 "trench-deep-ping": "the black deep seafloor of a trench, a small yellow research lander on three legs with a blinking light, total darkness around",
 "trench-sea-pig-parade": "deep-sea seafloor, a line of small translucent pink sea cucumbers called sea pigs with tiny tube legs walking across grey silt, a submersible light",
 "twilight-sucker-marks": "close-up of the scratched metal hull of a deep submersible with large round squid sucker marks, dim blue water",
 "vents-boiling-vent": "a black smoker hydrothermal vent chimney on the deep seafloor erupting a column of black smoke, shimmering hot water, a small submersible light nearby",
 "midnight-giant-glow": "the black deep ocean far below the surface lit by a swirling cloud of thousands of glowing bioluminescent jellyfish and fish around a tiny submersible",
 "desert-jerboa-hat": "a small real jerboa with long hind legs and a long tufted tail hopping over moonlit sand dunes beside a dropped bucket hat, playful mood",
}
out = []
for i, (k, p) in enumerate(NEW.items()):
    e = dict(b3[k]); e["prompt"] = p; e["seed"] = 9800 + i * 3; out.append(e)
NEG = "white background, cream background, beige paper, parchment, light background, pale background"
out += [
 {"id": "specimen-dumbo-octopus", "biome": "midnight", "event": "bestiary", "tone": "scientific", "mystery": 1, "style": "specimen", "seed": 9900,
  "negative": NEG + ", jellyfish, squid",
  "prompt": "dark painting of a Grimpoteuthis dumbo octopus, a small soft round pale pink octopus with two big rounded fins sticking out from the top of its head like elephant ears, a skirt of short webbed arms like an umbrella, isolated on a pure black background"},
 {"id": "specimen-hatchetfish", "biome": "twilight", "event": "bestiary", "tone": "scientific", "mystery": 1, "style": "specimen", "seed": 9910,
  "negative": NEG,
  "prompt": "dark painting of an Argyropelecus deep-sea hatchetfish, tiny fish with a very tall thin silver mirror body shaped like the blade of a hatchet, deep keel-shaped belly with a row of glowing blue light dots, big eyes pointing upward, isolated on a pure black background"},
]
json.dump(out, open("scripts/comfy/plates-batch3-redo.json", "w", encoding="utf-8"), indent=0)
print(len(out))
