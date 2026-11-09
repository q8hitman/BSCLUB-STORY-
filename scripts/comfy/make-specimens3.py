"""Specimen close-ups for bestiary animals that so far only appear inside a wide scene plate.
Writes scripts/comfy/plates-specimens3.json (same dark specimen look as plates-specimens2.json)."""
import json
A = [
 ("owl", "forest", "a tawny owl perched, round face, big dark eyes, mottled brown feathers, full body"),
 ("honeybee", "forest", "a honeybee in flight, golden striped fuzzy body, translucent wings, close-up"),
 ("scarab", "desert", "a desert darkling beetle standing head-down to catch fog, glossy black shell with dew droplets"),
 ("eagle", "mountain", "a golden eagle with wings spread, dark brown feathers with golden nape, hooked yellow beak, full body"),
 ("wood-frog", "snow", "a wood frog, tan brown skin with a dark eye mask, sitting, full body"),
 ("polar-bear", "snow", "a polar bear walking, thick creamy white fur, black nose, full body side view"),
 ("arctic-hare", "snow", "an arctic hare sitting upright, pure white fur, black ear tips, full body"),
 ("crocodile", "swamp", "a Nile crocodile, armoured green-grey scales, long toothy jaws slightly open, full body side view"),
 ("pond-turtle", "swamp", "a European pond turtle, dark domed shell with yellow specks, head stretched out, full body"),
 ("glow-frog", "swamp", "a small fantasy frog with softly glowing turquoise spots and translucent green skin, big curious eyes, full body"),
 ("sea-turtle", "reef", "a green sea turtle swimming, patterned shell, flippers spread, full body"),
 ("clownfish", "reef", "a clownfish, bright orange with three white bands edged in black, full body side view"),
 ("lanternfish", "twilight", "a lanternfish, small silver fish with rows of glowing blue light organs along its body, big eyes"),
 ("siphonophore", "twilight", "a siphonophore, a long translucent glowing colonial jelly chain with delicate tentacles"),
 ("giant-squid", "midnight", "a giant squid, long red mantle, enormous eye, long tentacles with suckers trailing"),
 ("gulper-eel", "midnight", "a gulper eel, enormous hinged pouch-like mouth open, thin whip tail with a glowing pink tip"),
 ("deep-jellies", "midnight", "a glowing deep-sea jellyfish, red and violet bell, long fine tentacles, bioluminescent rings"),
 ("tube-worms", "vents", "a cluster of giant tube worms, tall white tubes with bright red feathery plumes"),
 ("scaly-foot-snail", "vents", "a scaly-foot snail, dark shell and a foot covered in overlapping black iron scales, metallic sheen"),
 ("snailfish", "trench", "a hadal snailfish, pale pink translucent soft tadpole-like body, small eyes, full body side view"),
 ("grey-heron", "mudflat", "a grey heron standing, long neck folded, dagger yellow bill, grey and white feathers, full body"),
 ("mountain-wolf", "mountain", "a grey wolf standing, thick grey and tawny fur, amber eyes, full body side view"),
 ("reef-shark", "reef", "a blacktip reef shark, sleek grey body, black-tipped fins, full body side view"),
 ("seahorse", "seagrass", "a seahorse, curled tail, ridged yellow-brown body, small snout, side view"),
 ("bat", "cave", "a bat with wings spread wide, furry brown body, big ears, thin wing membranes with visible bones"),
 ("hamster", "lab", "a golden hamster sitting up holding a seed, round cheeks, small pink paws, full body"),
 ("swordfish", "twilight", "a swordfish, long flat sword bill, sleek dark blue and silver body, tall dorsal fin, full body side view"),
 ("vampire-squid", "midnight", "a vampire squid, deep red body with webbed cloak arms, large blue eyes, glowing tips"),
 ("yeti-crab", "vents", "a yeti crab, pale white body with long claws covered in fine silky blond hair"),
 ("amphipod", "trench", "a giant deep-sea amphipod, pale curved shrimp-like segmented body, many small legs"),
]
out = [{"id": f"specimen-{a}", "biome": b, "event": "bestiary", "tone": "scientific", "mystery": 1, "style": "specimen", "seed": 9500 + i,
        "prompt": f"dark painting of {p}, isolated on a pure black background, dramatic rim light",
        "negative": "white background, cream background, beige paper, parchment, light background, pale background"} for i, (a, b, p) in enumerate(A)]
json.dump(out, open("scripts/comfy/plates-specimens3.json", "w", encoding="utf-8"), indent=0)
print(len(out))
