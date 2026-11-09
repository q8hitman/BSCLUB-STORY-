"""Square painted pictures of the real animal behind every builder option (base animals and body parts), so the
player sees what each choice looks like next to its name. Writes scripts/comfy/plates-parts.json (1024x1024)."""
import json
P = {
 # base animals (whole animal)
 "fennec": "a fennec fox sitting, huge ears, sandy fur",
 "axolotl": "a pink axolotl with feathery external gills and a smiling face",
 "gecko": "a gecko clinging to a wall, wide sticky toe pads, big eyes",
 "owl": "a barn owl perched, pale heart-shaped face",
 "camel": "an Arabian camel standing, single hump, long legs",
 "frog": "a bright blue and yellow poison dart frog",
 "pangolin": "a pangolin covered in overlapping brown scales, curled tail",
 "octopus": "an octopus with eight curling arms and suckers",
 # head
 "bigEars": "close-up of a fennec fox head with enormous ears",
 "horns": "close-up of a Nubian ibex head with long curved ridged horns",
 "crest": "close-up of a sulphur-crested cockatoo head with its yellow feather crest raised",
 "gillFrills": "close-up of an axolotl head with pink feathery external gill frills",
 "antennae": "close-up of a moth head with large feathery antennae",
 "helmet": "close-up of a cassowary head with its tall bony casque helmet",
 # eyes
 "owlEyes": "close-up of an owl face with two huge round glowing eyes",
 "compound": "extreme close-up of a fly head with large red compound eyes",
 "chameleon": "close-up of a chameleon head with a turret eye rotating",
 "glowEyes": "close-up of a flashlight fish with glowing light organs under its eyes",
 "tinyEyes": "close-up of a mole face with tiny hidden eyes and a pink star nose",
 "stalkEyes": "close-up of a stalk-eyed fly with eyes on long stalks",
 # limbs
 "wings": "a bat with leathery wings spread wide showing the finger bones",
 "webbed": "close-up of a webbed frog foot spread on water",
 "climbClaws": "close-up of a sloth hanging by long curved climbing claws",
 "digClaws": "close-up of a mole's large shovel-like digging front claws",
 "tentacles": "close-up of an octopus arm covered with round suckers",
 "springLegs": "a jerboa jumping on long spring-like hind legs",
 # tail
 "fluffy": "a red fox seen from behind with a big fluffy bushy tail",
 "stinger": "close-up of a scorpion tail curled with its venomous stinger",
 "finTail": "close-up of a fish's broad swimming tail fin",
 "prehensile": "a spider monkey hanging from a branch by its curled prehensile tail",
 "club": "the bony club at the end of an ankylosaurus tail, fossil reconstruction",
 "lure": "an anglerfish with a glowing lure on a stalk above its mouth",
 # adaptation
 "thickFur": "a musk ox with very thick long shaggy fur",
 "camo": "close-up of a cuttlefish skin changing colour patterns",
 "shell": "an armadillo with overlapping armoured shell plates",
 "spikes": "a porcupine with its long sharp quills raised",
 "biolum": "a firefly squid covered in glowing blue light spots",
 "hump": "close-up of a camel hump",
 "gills": "close-up of a shark side with five gill slits",
 "blubber": "a plump seal with a thick layer of blubber lying on ice",
 # ability
 "echo": "a bat face with big ears sending out sound waves",
 "shock": "an electric eel with crackling electricity around it",
 "ink": "a squid releasing a dark cloud of ink",
 "regen": "a starfish regrowing a new arm",
 "mimicry": "a lyrebird with its tail feathers spread, singing",
 "heatPits": "close-up of a pit viper head showing heat-sensing pits between eye and nostril",
 "smell": "close-up of a bloodhound nose sniffing",
 "pressure": "a pale translucent hadal snailfish in the deep sea",
}
NEG = "white background, cream background, beige paper, parchment, light background, pale background, text, letters"
out = [{"id": f"part-{k}", "biome": "lab", "event": "part", "tone": "scientific", "mystery": 0, "style": "specimen", "seed": 9950 + i,
        "w": 1024, "h": 1024, "negative": NEG,
        "prompt": f"dark painting of {v}, centred, isolated on a pure black background, dramatic rim light"} for i, (k, v) in enumerate(P.items())]
json.dump(out, open("scripts/comfy/plates-parts.json", "w", encoding="utf-8"), indent=0)
print(len(out))
