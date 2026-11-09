"""Batch 4: rare hidden-encounter creatures (myth-inspired, creature-first, biology-flavoured), quiet camp-moment
scenes, and extra ending illustrations. Writes scripts/comfy/plates-batch4.json. Ducks are never generated
(only the approved duck art is used)."""
import json
DARK = "dark painting of {}, isolated on a pure black background, dramatic rim light, full body visible, anatomically coherent"
NEG_SPEC = "white background, cream background, beige paper, parchment, light background, pale background, text, letters, human, person, cartoon, cute chibi"
RARE = {
 # land
 "rare-mist-stag": "a pale ghostly stag with antlers wrapped in drifting mist and tiny hanging moss, glowing faint silver eyes",
 "rare-stoneback-fox": "a mountain fox whose back is covered in grey stone-like armoured plates and lichen",
 "rare-moss-wolf": "a lean wolf with a thick coat of green moss and ferns growing along its spine",
 "rare-crystal-beetle": "a large beetle with a translucent faceted crystal shell glowing pale blue",
 "rare-ember-moth": "a large night moth with wings glowing like orange embers, sparks of light on the wing scales",
 "rare-moon-moth": "a giant pale green luna moth with long trailing tail streamers and moon-like eyespots",
 "rare-cave-salamander": "a long pale blind cave salamander with bioluminescent blue spots along its body",
 "rare-cavern-hound": "an eyeless pale cave hound with huge ears and long whiskers, sniffing the dark",
 "rare-horned-hare": "a desert hare with small curved antelope horns and enormous ears, jackalope-like",
 "rare-snowhorn-hare": "a white snow hare with frosted spiral horns, breath steaming",
 "rare-frost-owl": "a large white owl with frost crystals on its feathers and pale blue glowing eyes",
 "rare-swamp-lurker": "a huge swamp creature like a giant salamander covered in duckweed, only its eyes above the water",
 "rare-reed-mimic": "a thin stick-like creature that perfectly mimics a cluster of reeds, with hidden amber eyes",
 "rare-dune-basilisk": "a crested desert lizard with a royal frilled crown of spines and piercing golden eyes, basilisk-inspired",
 "rare-sand-manticore": "a lion-sized desert predator with a maned feline body and a curled scorpion-like tail, manticore-inspired, majestic not monstrous",
 "rare-griffin-eagle": "a huge mountain bird of prey with eagle head and wings and a powerful feline hind body, griffin-inspired",
 "rare-dawn-firebird": "a long-tailed desert bird whose feathers shimmer red and gold like flames at dawn, phoenix-inspired",
 "rare-root-serpent": "a slender brown serpent whose scales look like twisted tree roots, coiled among roots",
 # sea
 "rare-lantern-whale": "a whale with rows of glowing bioluminescent lights along its sides, deep blue water",
 "rare-abyssal-ray": "an enormous black manta ray with constellations of tiny glowing dots on its wings",
 "rare-ghost-jelly": "a huge translucent ghostly jellyfish with long trailing veil-like tentacles, faint violet glow",
 "rare-coral-stag": "a deer-like sea creature whose antlers are branching living coral, swimming",
 "rare-kelp-serpent": "a long sea serpent with leaf-like fins resembling kelp fronds, olive and gold",
 "rare-trench-watcher": "a pale deep-sea fish with one enormous glowing eye and translucent body",
 "rare-mirror-eel": "a long eel with mirror-like silver scales reflecting faint light",
 "rare-phantom-nautilus": "a translucent nautilus with a glowing spiral shell and many trailing tentacles",
 "rare-vent-guardian": "an armoured deep-sea crustacean guardian with heat-red shell standing by a smoking hydrothermal vent",
 "rare-glow-seahare": "a sea hare sea slug with frilly glowing turquoise edges",
 "rare-giant-squid-glow": "a colossal bioluminescent squid with huge eyes and glowing spots, kraken-inspired",
 "rare-sea-serpent": "a long silver sea serpent with a crest of red fins, arching through dark water, oarfish-inspired",
 "rare-kelpie-seahorse": "a giant horse-headed seahorse with a mane of seaweed, kelpie-inspired, creature not human",
 "rare-coelacanth": "a coelacanth, the living fossil fish with lobed fins and blue scales with white spots",
}
CAMP = {
 "camp-desert-stars": "a small field camp in the desert at night, a tent, a lantern, notebooks and specimen jars around a tiny campfire under a sky full of stars",
 "camp-forest-fireflies": "a forest clearing at dusk with hammocks, a field microscope on a stump and fireflies glowing everywhere",
 "camp-cave-mushrooms": "a dry cave ledge used as a camp, sleeping bags, a kettle, glowing mushrooms lighting the rock",
 "camp-snow-cocoa": "a snow shelter at night with steaming cups, a lantern and a field radio, aurora in the sky",
 "camp-boat-sunset": "the deck of a small research boat at sunset, wet ropes, a hydrophone, sample buckets, calm sea",
 "camp-sub-porthole": "the cosy interior of a small research submarine, a round porthole with curious fish outside, warm cabin light",
 "camp-lab-night-tea": "a university biology lab late at night, tea cups beside microscopes, a sleeping laptop, warm desk lamp",
 "camp-mountain-ledge": "a mountain ledge at night with a telescope, a thermos and a map, the valley lights far below",
 "camp-swamp-raft": "a small raft on a misty swamp at dawn with a lantern, a sample net and herons in the distance",
 "camp-mudflat-sunrise": "a Kuwait bay mudflat at sunrise with field flasks drying on a cloth and footprints in the mud",
}
ENDINGS = {
 "ending-lab-return": "the BSC biology lab at dawn, specimen notes pinned on a board with string, a tired but happy mood, warm light",
 "ending-fair-trophy": "a university science fair hall with a glowing hybrid creature model on a stage, a trophy, confetti, warm light",
 "ending-reef-healing": "a coral reef slowly regaining colour, fish returning, sunbeams through clear water",
 "ending-deep-glow": "a deep-sea scene of many bioluminescent creatures lighting the dark like a constellation, peaceful",
 "ending-mystery-door": "an ancient stone doorway in the ruins at night half covered in vines with a faint light behind it, unanswered mystery",
 "ending-starry-desert": "a vast desert under the milky way with a single lantern and a trail of animal tracks leading to the horizon",
}
out = []
for i, (k, v) in enumerate(RARE.items()):
    out.append({"id": f"specimen-{k}", "biome": "lab", "event": "rare", "tone": "mysterious", "mystery": 2, "style": "specimen",
                "seed": 11000 + i * 13, "w": 1024, "h": 1024, "negative": NEG_SPEC, "prompt": DARK.format(v)})
for i, (k, v) in enumerate(CAMP.items()):
    out.append({"id": k, "biome": "lab", "event": "camp", "tone": "wholesome", "mystery": 0, "style": "storybook" if i % 2 else "nocturne",
                "seed": 12000 + i * 13, "negative": "people, person, human, face, text", "prompt": f"{v}, no people"})
for i, (k, v) in enumerate(ENDINGS.items()):
    out.append({"id": k, "biome": "lab", "event": "ending", "tone": "wholesome", "mystery": 1, "style": "nocturne",
                "seed": 12500 + i * 13, "negative": "people, person, human, face, text", "prompt": f"{v}, no people"})
json.dump(out, open("scripts/comfy/plates-batch4.json", "w", encoding="utf-8"), indent=0)
print(len(out))
