#!/usr/bin/env python3
"""Generate Moros card art via fal.ai's Flux 1.1 [pro] endpoint.

Usage:
    python3 tools/generate_card_art.py pilot         # 5-card pilot only
    python3 tools/generate_card_art.py npcs          # all NPCs (skip existing)
    python3 tools/generate_card_art.py places        # all locations (skip existing)
    python3 tools/generate_card_art.py icons         # all card-deck motifs
    python3 tools/generate_card_art.py single <slug> # one card, force re-render
    python3 tools/generate_card_art.py list          # show known slugs

Reads FAL_KEY from ~/.config/moros/secrets.env. Never echoes the key.
Writes PNGs to html/icons/npcs/, html/icons/places/, and
html/icons/cards/{elements,powers,items}/. Existing files are archived
as {slug}_v{NN}.png on retry; the canonical slug.png always holds the latest.
"""

import hashlib
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
KEY_FILE = pathlib.Path.home() / ".config/moros/secrets.env"
ENDPOINT_PRO = "https://fal.run/fal-ai/flux-pro/v1.1"
ENDPOINT_ULTRA = "https://fal.run/fal-ai/flux-pro/v1.1-ultra"

STYLE_NPC = (
    "painterly digital illustration, hand-drawn ink line work under soft "
    "gouache and watercolour wash, muted earthy palette of ochre, moss, "
    "slate and rust, warm low-key lighting, low-fantasy medieval setting "
    "in the style of a tabletop RPG character card, head-and-shoulders "
    "portrait, three-quarter angle, neutral parchment-toned background, "
    "no text, no border, no logo"
)

STYLE_LOC = (
    "painterly digital illustration, hand-drawn ink line work under soft "
    "gouache and watercolour wash, muted earthy palette of ochre, moss, "
    "slate and rust, atmospheric low-fantasy medieval setting in the style "
    "of a tabletop RPG location card, wide establishing three-quarter view, "
    "soft natural light, no figures, no text, no border, no logo"
)

STYLE_ICON = (
    "single bold centred motif filling the frame on a warm cream parchment "
    "background, ink woodcut style with hatching and crosshatching in dark "
    "sepia ink, two-tone high contrast silhouette in the style of a medieval "
    "bestiary plate or heraldic emblem, simple iconographic shape, hand-drawn "
    "imperfect line, subtle parchment grain, no text, no letters, no border, "
    "no frame, no logo, square composition"
)

NEGATIVE = (
    "photorealistic, photograph, 3d render, anime, modern clothing, neon, "
    "watermark, text, border, deformed hands, blurry"
)

# --- Anchor helper -------------------------------------------------------
# Anthropomorphic-folk prompts get a consistent "head of X on humanoid body"
# anchor to keep Flux from rendering a literal animal on four legs.

def anthro(species: str, head_features: str, body: str) -> str:
    return (
        f"an upright bipedal humanoid {species}-folk character, "
        f"the unmistakable head and face of a {species} — {head_features} — "
        f"set on the body of {body}, fully clothed, standing upright on two "
        f"legs with ordinary humanoid hands; furry humanoid character art "
        f"in the style of dark-fantasy book illustration, NOT a real animal "
        f"on four legs"
    )


def load_key() -> str:
    for line in KEY_FILE.read_text().splitlines():
        if line.startswith("FAL_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"FAL_KEY not found in {KEY_FILE}")


def seeded(name: str) -> int:
    return int(hashlib.md5(name.encode()).hexdigest()[:8], 16) % 2**31


def archive_existing(out_path: pathlib.Path) -> None:
    """If out_path exists, rename it to {stem}_v{NN}{suffix} so retries don't clobber prior attempts."""
    if not out_path.exists():
        return
    parent, stem, suffix = out_path.parent, out_path.stem, out_path.suffix
    n = 1
    while (parent / f"{stem}_v{n:02d}{suffix}").exists():
        n += 1
    archive = parent / f"{stem}_v{n:02d}{suffix}"
    out_path.rename(archive)
    print(f"    archived previous -> {archive.relative_to(ROOT)}")


_RATIO_TO_ASPECT = {
    "portrait_4_3": "3:4",
    "landscape_4_3": "4:3",
    "square_hd": "1:1",
    "portrait_16_9": "9:16",
    "landscape_16_9": "16:9",
}


def call_flux(key: str, prompt_body: str, name: str,
              ratio: str = "portrait_4_3", style: str = STYLE_NPC,
              ultra: bool = False) -> bytes:
    endpoint = ENDPOINT_ULTRA if ultra else ENDPOINT_PRO
    if ultra:
        payload_dict = {
            "prompt": f"{style}, {prompt_body}",
            "aspect_ratio": _RATIO_TO_ASPECT.get(ratio, "4:3"),
            "seed": seeded(name),
            "num_images": 1,
            "output_format": "png",
            "safety_tolerance": "6",
            "raw": False,
        }
    else:
        payload_dict = {
            "prompt": f"{style}, {prompt_body}",
            "image_size": ratio,
            "num_inference_steps": 28,
            "seed": seeded(name),
            "guidance_scale": 3.5,
            "num_images": 1,
            "output_format": "png",
            "safety_tolerance": "6",
        }
    payload = json.dumps(payload_dict).encode()

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Key {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {e.code} from fal.ai: {body[:500]}")
    elapsed = time.time() - t0

    if "images" not in data or not data["images"]:
        raise SystemExit(f"No image in response: {json.dumps(data)[:500]}")
    url = data["images"][0]["url"]
    img = urllib.request.urlopen(url, timeout=120).read()
    print(f"  {name}: {len(img):,} bytes in {elapsed:.1f}s")
    return img


# --- NPC roster ----------------------------------------------------------
# Slugs match the cards in doc/npcs/cards.md. The first five are the pilot.

NPCS = [
    # ---- Pilot ----
    ("diederik", "an anthropomorphic owl-folk elder, tawny-and-cream feather plumage around a sharp face, a circle of dark druid-green feathers at his throat, dressed in a simple bark-brown robe with a worn travelling staff, perched at the edge of a high tree-house balcony with carved ironwood railings, dawn light behind him"),
    ("bridget", "a stout anthropomorphic badger-folk woman in her late forties, distinctive black-and-white facial striping, a leather apron over a russet wool dress, her sleeves rolled up, holding a small piece of chalk near a slate ledger covered in tallies and unusual marks, lantern light on her face, the curved inside of a hollow ironwood tree visible behind her"),
    ("irna_bean", "a young female anthro warrior of the Tusk Clan boar folk — the unmistakable head and face of a wild boar with a long broad snout, two prominent ivory upturned tusks rising from the lower jaw past her upper lip, dark coarse bristly fur covering the cheeks and forehead, small rounded ears tufted with darker hair, intelligent dark eyes under a pronounced brow ridge — set on the upright bipedal body of an athletic young woman in her early twenties, broad shoulders, two human-shaped hands holding a small folded letter, fully clothed in dust-stained miner's leathers under a heavy charcoal traveller's coat, fingerless leather gloves on calloused hands; on her left wrist a plain iron shackle-band engraved with the Allondan crown's crest, kept on deliberately as a sign of defiance; her gaze level and unflinching, soft dawn light, parchment-toned background; furry humanoid character art in the style of dark-fantasy book illustration, NOT a real pig on four legs"),
    ("laurent", "a single bare human skull floating unsupported in mid-air at chest-height, twin small flames burning inside its eye sockets, suspended above a tall ornate empty stone throne; the throne itself is unoccupied — NO person, NO body, NO figure sitting on it — but thick curling tendrils of dark grey smoke and pale dust rise from the seat of the throne and pool around its base, drifting upward toward the floating skull, the smoke amorphous and shapeless, just smoke — vapor, wisps, mist, NOT a body or hooded shape; the throne stands in a ruined stone audience hall, dust motes in shafts of grey light from above, motionless wooden puppets in shadowed alcoves along the back wall, dim ember-orange light from the skull's eye-sockets catching the smoke below"),
    ("tod", "a small anthropomorphic fox-folk boy of perhaps ten, russet fur and white muzzle, wearing a plain forest tunic that fits oddly, his posture and expression off in a way that is hard to name — a slight wrongness in how he holds his hands, an almost-correct smile, his eyes catching too much light, twisted bark-warped trees of the forbidden woods behind him"),

    # ---- Ancient powers ----
    ("felicia", "the spectral image of a kindly middle-aged human woman in plain woollen robes, translucent and made of soft golden hill-light, her form blurring at the edges into mist and barley-stalks, a faint corona around her head, hands open at her sides as if listening, her body half-fading into the air"),

    # ---- Historical / accessed via records ----
    ("narissa", "a stylised hand-painted manuscript illumination of the First Mage Narissa — a young human woman in her mid-twenties, plain early-medieval scholar's robes whose hem and sleeves dissolve into rippling translucent water flowing along the page, a faint blue-green water-spirit overlapping her body like a second translucent silhouette merged with her own, her eyes glowing with cold underwater light, hair drifting as if she were submerged even though the rest of the scene is dry, an open diary in her humanoid hands; the figure ringed by hand-painted gold-leaf geometric arcs and small ink illustrations of whirlpools and water-trails in the margins, page edges yellowed and worn, gold leaf accents — clearly a spirit-bound mage and not a mortal scholar, shown as a leaf from an ancient illuminated diary"),
    ("thorgal", "the partial reflected face of a stern bearded human mage trapped within an ornate dark-wood scrying mirror, his expression frozen mid-shock, broken glass cracks radiating from one eye, dim sea-green light bleeding from within the mirror, the mirror frame carved with foreign-coast motifs, the mirror leaning against an unseen surface"),

    # ---- Overseas ----
    ("raul", "an upright bipedal humanoid ox-tauren warrior — the unmistakable broad-skulled head of an ox with two heavy curved horns spreading wide, dark hide, a coarse braided beard of hair under his jaw, a single brass nose-ring — set on the powerful humanoid body of a battle-veteran, broad shoulders draped in weather-darkened leather harness and a single overseas military pauldron, two ordinary humanoid hands resting on a campaign-belt, his expression weary rather than angry, a long old scar across one cheek, NOT a real bull on four legs"),

    # ---- Royal house of Allondo ----
    ("king_hannes", "a tired middle-aged human king of low-fantasy Allondo, short greying beard, modest gold circlet rather than a heavy crown, plain dark green doublet trimmed with iron rather than gold, his hands resting on the edge of a polished council table, the bearing of a man who survived captivity and never quite recovered the performance of kingship"),
    ("queen_fienna", "a strong-handed human woman in her thirties, queen consort of Allondo, her hair pinned back simply, wearing a deep-red gown of practical cut with visible faint forge-burn scars on her forearms, a small iron ring on a chain at her throat, her gaze steady and assessing, hands folded in front of her"),
    ("prince_corven", "a tall human crown prince of Allondo in his late twenties, dark hair, deliberately set jaw, training-yard leathers under a half-buckled royal tabard of forest green and iron-grey, one hand resting on a sword hilt, his expression carrying a private grief he is hiding from the room"),
    ("didrich", "a slim bookish human prince in his early twenties, second son of Allondo, dressed in plain travel clothes rather than court dress, dirt under his fingernails, a small leather satchel of dried herbs at his hip, looking off to one side, the air of a young scholar uncomfortable in a uniform"),

    # ---- Royal house of Brumal ----
    ("princess_penelope", "a young Brumal princess in her early twenties, warm-toned skin, dark hair braided with fine wire, dressed in pale Brumal court silks softened by a desert-dyed wrap, fine intricate filigree jewelry at her ears and throat, holding a half-finished filigree pendant in careful fingers, soft focused light on her hands"),

    # ---- Bean family and circle ----
    ("john_bean", "an older male anthro of the Tusk Clan boar folk — the unmistakable head and face of a wild boar with a long broad snout, two greying ivory upturned tusks rising past his upper lip, coarse bristly fur on cheeks and forehead, small tufted rounded ears, kind dark eyes under a heavy brow ridge — set on the upright bipedal body of a broad-shouldered farmer in his late fifties, wearing a worn brown leather apron over homespun, his right arm replaced from the shoulder with a dark grained ironwood prosthetic carved with old mage-sigils, the wooden hand articulate and posed mid-gesture, his left hand human and weathered; the air of a war hero who chose the field over the front line, NOT a real pig on four legs"),
    ("ron_bean", "a young male anthro of the boar folk in his late teens — the head and face of a wild boar with a short broad snout, small still-growing ivory tusks, coarse bristly fur, tufted ears, anxious dark eyes — set on the upright bipedal body of a homesick young soldier, wearing plain Allondan green-and-iron conscript livery that fits him poorly, helmet under his arm, the calluses on his humanoid hands more farmer than fighter; his expression sad rather than martial, NOT a real pig on four legs"),
    ("rhianna_linthrope", "a small-statured female anthro white-mouse-folk priestess in her forties — the unmistakable head and face of a white mouse with a delicate pointed snout, fine white whiskers, large round dark eyes, prominent rounded ears — set on the upright bipedal body of a composed court priestess, fine pale fur, dressed in muted blue priestess robes with surgical leather practical-bracers under the sleeves, an iron-and-wood medical kit at her belt, her posture upright and a little forbidding, one humanoid hand resting on the kit, NOT a real mouse on four legs"),
    ("felix", "an adult male anthro raccoon-folk scout in his thirties — the unmistakable head and face of a raccoon with a black bandit-mask of fur around bright clever eyes, white muzzle, rounded dark-tipped ears — set on the upright bipedal body of a wiry scout, his ringed bushy tail visible behind him, dressed in dark scout's leathers and a soft cap, mid-motion as if half-turning to slip out of frame, a rolled set of lockpicks tucked at his hip, unkempt and grinning, NOT a real raccoon on four legs"),
    ("father_elliot", "an older human monk in his sixties, abbot of a small hill-country monastery, short cropped grey hair, plain undyed wool habit with a knotted leather belt, the faintest old royal carriage in the way he holds his shoulders, his hands those of a man who has walked far for many years, soft monastery courtyard light"),
    ("willow", "a very old female anthro rabbit-folk granny — the head and face of a rabbit with a small pink twitching nose, white whiskers, long ears slightly drooping with age — set on the upright bipedal body of a small elderly woman, soft greying fur, in a faded green woollen shawl over a workworn smock, her humanoid hands cupping a small lit tallow candle, the warm light catching her whiskers, her expression patient and entirely unimpressed by strangers, NOT a real rabbit on four legs"),

    # ---- Elmsfield locals ----
    ("wilfred", "a male anthro badger-folk blacksmith in his fifties — the unmistakable striped black-and-white face of a badger, kind dark eyes, the silver muzzle of an aging badger — set on the upright bipedal body of a stocky village smith, dressed in a heavy soot-stained leather smithing apron, hammer in one humanoid hand, a horseshoe cooling on the anvil beside him, the modest smithy of a rural town behind him, his shoulders thicker than a farmer's, NOT a real badger on four legs"),
    ("farmer_joseph", "a tense male anthro raccoon-folk farmer in his forties — the head and face of a raccoon with a dark bandit-mask of fur around wary eyes, white muzzle — set on the upright bipedal body of a worn-down refugee, dressed in patched homespun and a faded cloak, holding a sling and a stone in white-knuckled humanoid hands, his eyes wide with old memory rather than malice, autumn dusk light, the pickets of a frontier farm fence behind him, NOT a real raccoon on four legs"),
    ("hank", "a wiry adult anthro rabbit-folk farmer in their forties presenting masculine — the head and face of a rabbit with soft brown fur, twitching pink nose, long upright ears — set on the upright bipedal body of a kindly small-holder, dressed in a worn green druid-cloak over patched farmwear, a string of dried herbs and a small rough notebook tucked at the belt, two small mixed-folk orphan children peeking from behind their leg, the open gate of a refugee farm in the background, NOT a real rabbit on four legs"),
    ("egbert", "an upright bipedal humanoid wolf-folk hunter — clearly the unmistakable head and face of a grey timber wolf with a long pointed muzzle, sharp upright triangular wolf ears, dark nose, intelligent reflective amber eyes, dense grey-and-white fur on cheeks and brow — set on the upright bipedal body of a tall lean-muscular woman in her thirties, broad shoulders, long strong humanoid fingers; dressed in practical earth-toned farmer's clothing — patched homespun shirt, leather jerkin, a yellow-ochre wool scarf knotted at the throat, fingerless leather gloves; one humanoid hand resting on a tall hardwood walking-staff, her posture quiet and composed, the still alertness of a hunter standing at rest; a wooden split-rail fence behind her, golden-hour dusk light, the dim outline of a farm at the horizon, NOT a real wolf on four legs, NOT a mouse"),
    ("corne_dunham", "a weather-worn male anthro badger-folk hill-guide in his fifties — the unmistakable striped black-and-white face of a badger, sharp eyes — set on the upright bipedal body of a fit walker, dressed in oiled-canvas hill-walker gear with a coiled length of rope over one shoulder, a tall walker's staff topped with an iron ferrule held in his humanoid hand, leaning into a steep grass slope, hill country behind him, NOT a real badger on four legs"),
    ("ralph_overhill", "a young male anthro badger-folk stable-hand of perhaps eighteen — the striped black-and-white face of a young badger — set on the upright bipedal body of a lean youth, stable apron over homespun, a halter rope in one humanoid hand and a curry comb in the other, a calm working horse's nose visible at his shoulder, his expression more comfortable with mounts than with people, NOT a real badger on four legs"),

    # ---- Lake of Tears ----
    ("pot_boy", "a small construct that is LITERALLY A POT — a single rounded dark-fired clay cooking pot the size of a melon, knee-height, sitting upright on a stone workshop floor — the pot IS the entire body and the entire being; NO separate head on top, NO neck, NO torso, NO humanoid figure; just the pot, with two short stubby cylindrical clay legs poking out of the bottom of the pot acting as feet, and two short stubby cylindrical clay arms poking out of the sides of the pot acting as arms, ending in tiny three-fingered clay hands; two round riveted iron disc eyes set directly into the front surface of the pot itself, no mouth; thin iron bands wrap around the pot's belly; one stubby clay arm holds a worn straw broom and the other holds a small iron chisel; dust motes in low workshop light, the construct standing motionless as if it just paused, an inhabited stillness, the pot-with-limbs is unmistakably a pot first and a being second; NOT a child, NOT a doll, NOT a humanoid stick figure with a pot for a head — the pot is the whole creature"),
    ("furnace_pot_person", "a vast iron-banded ceramic furnace-being squatting in the centre of an underground stone chamber, its body an enormous closed pot a person could fit inside, four short stubby clay legs splayed beneath it, the central opening glowing with banked orange coals, thin smoke leaking from a vent at the top, the form unmistakably a being and not a machine, the suggestion of intelligence in how it sits"),
    ("hermit_shaman", "an older male anthro otter-folk shaman in his sixties — the unmistakable head and face of a river otter with sleek dark fur, a flat nose-pad, whiskers, grey muzzle, small rounded ears — set on the upright bipedal body of a wiry hermit, draped in layered hide and beaded shaman's regalia, a small bound spirit visible as a translucent animal-shape coiled around his shoulders, seated cross-legged on the stone floor of a tall wizard's tower with one narrow blood-red painted slit-window behind him, NOT a real otter on four legs"),
    ("storm_mage", "a hollow-eyed elderly human mage in his eighties, wild white hair standing in tufts, soot-stained sky-blue robes hanging on a thin frame, half-burnt copper-wire amulets tangled at his throat, his fingers twitching through old casting gestures with no working behind them, distant low storm-clouds and a hovering metal-spiked tower visible far behind him on the horizon"),

    # ---- Wanderers and drifters ----
    ("brother_darrel", "a broad-shouldered male anthro beaver-folk monk in his forties — the unmistakable head and face of a beaver with prominent orange front teeth, a flat broad muzzle, small rounded ears — set on the upright bipedal body of a strong man in plain undyed monk's robes belted with rope, the broad flat tail visible behind him, holding a long hardwood walking-staff at rest, his humanoid hands marked by old soldier's calluses the robes do not hide, his face calm with the deliberate calm of someone who has unmade himself once already, NOT a real beaver on four legs"),
    ("eric_randell", "an adult male anthro fox-folk farmer in his thirties — the unmistakable head and face of a red fox with russet fur, a white chest, sharp pointed ears, bright clever eyes — set on the upright bipedal body of an unassuming small-holder, dressed in patched homespun and a wide-brimmed straw hat, a tall flightless dromo-bird at his side and two smaller fowl pecking near his boots, a faint druid-green ribbon almost hidden at his wrist, his humanoid hands resting easily, NOT a real fox on four legs"),
    ("nadine", "a slight female anthro finch-folk trader — the unmistakable head and face of a small songbird with vivid yellow-and-black plumage, a sharp black beak, bright dark eyes — set on the upright bipedal body of a bright-eyed merchant, neat dark traveller's vest hung with small message-tubes and trader's tags, a folded map in one humanoid hand, the half-folded wings of an aerial messenger visible at her back, the warm glow of a town-square lantern catching her feathers, NOT a real finch sitting on a branch"),
    ("mouse_traveller", "a generic unnamed female anthro mouse-folk wanderer — the unmistakable head and face of a small mouse with pale-cream fur, large pink rounded ears tinged darker at the tips, a delicate pointed snout with a small pink nose, large dark intelligent eyes — set on the upright bipedal body of a slight road-traveller in plain earth-toned farm-clothes, a yellow-ochre wool scarf knotted at the throat, patched homespun and leather jerkin, fingerless gloves, both humanoid hands holding a tall hardwood walking-staff, a wooden split-rail fence and the dim outline of a small-holder farm in dawn or dusk light behind her, NOT a real mouse on four legs; reusable as any small road-traveller mouse-folk in the campaign"),

    # ---- World Edge ----
    ("master_darius", "an older male anthro badger-folk forge-master in his sixties — the iconic striped black-and-white face of a badger, soot-darkened, kind sharp eyes — set on the upright bipedal body of a powerful smith, a heavy leather forge-apron scarred by years of sparks, a hammer in one calloused humanoid hand, the other resting on a half-finished iron piece on the anvil, behind him the orange-lit interior of a serious volcanic-region forge with multiple apprentices' bellows, NOT a real badger on four legs"),
    ("remi", "a thin male anthro rat-folk worker in his late twenties — the unmistakable head and face of a rat with dark fur, a long pink-tipped snout, prominent rounded ears, weary intelligent eyes — set on the upright bipedal body of a tired road-walker, dressed in road-worn factory-issue work clothes patched at the shoulders, a folded letter clutched carefully in one humanoid hand, a small roadside pack at his feet, NOT a real rat on four legs"),
]


# --- Location roster -----------------------------------------------------
# Slugs match the cards in doc/places/cards.md. Towers use portrait
# framing (they are vertical); everywhere else uses landscape.

LOCATIONS = [
    # ---- Allondo ----
    ("scarlet_vale", "the capital city of Allondo seen from a green hill above, low-fantasy medieval, walled inner keep with a slate-roofed great hall and a tall training-yard tower, terracotta-roofed merchant streets spiralling down to a riverside market, banners of forest green and iron grey, autumn light, the hills of central Allondo behind it", "landscape_4_3"),
    ("blackwood_freehold", "a quiet agricultural valley in Allondo, a modest stone-and-thatch farmhouse beside a thicket of dark-wooded trees giving the freehold its name, neat fields of barley and turnips bordered by dry-stone walls, a pair of working oxen at the field edge in silhouette, late-afternoon golden light", "landscape_4_3"),
    ("clear_water_mine", "an Allondan crown mining town set into a treeless ridge under a grey sky, raw slate-roofed barracks beside a fenced mine-mouth, ore-cart tracks running out from the shaft, a watch-tower flying the Allondan green-and-iron, the ground around the town hammered bare by boots and carts, a hard institutional feeling", "landscape_4_3"),
    ("chatter_creek", "a small wooden-palisade border town beside a fast shallow creek under northern pines, a single watch-outpost on a low rise, log buildings with mossy roofs, a few horses tied at a hitching rail, dawn fog rising off the water, a packed-earth road leading out into the tree-line", "landscape_4_3"),
    ("rakeville", "a quiet southern-Allondan village along a packed-earth trade road, a handful of plaster-and-timber houses with red-clay roofs, a small roadside chapel, a single inn with a faded painted sign, late-summer dust hanging in the air, low rolling fields beyond", "landscape_4_3"),

    # ---- Brumal ----
    ("cliffside_hold", "the capital of Brumal built up against a tall sheer pale-stone cliff, white-washed walls and slate roofs stepping up the cliff face to a high keep, narrow stone stairs zig-zagging between layers of the city, banners in Brumal blue and bone-white, the dust haze of an advancing southern desert visible far on the horizon, late afternoon", "landscape_4_3"),
    ("bockthicket", "a Brumal mining town wedged in a thicketed valley, dense hawthorn-and-blackthorn hedgerows around the outskirts, smoke-blackened mine buildings of dark timber, a long ore-tip glittering with low-grade slag at the edge, a low overcast sky, the air of a working town hanging on", "landscape_4_3"),
    ("steadington", "the half-buried ruins of a Brumal village being eaten by the southern desert, roof-peaks and a lone stone chimney sticking up out of pale dunes, the broken stone arch of a village gate half-submerged in sand, dry wind blowing dust across the scene, a single ragged banner-pole still upright, the sky a hot dust-colour", "landscape_4_3"),

    # ---- Shared border ----
    ("elmsfield", "a small wilderness town built in a rough ring around an enormous ancient ironwood tree whose dark trunk dwarfs every building, the trunk itself hollowed out at the base and fitted with a heavy plank door (the inn), low log-and-thatch houses clustered around it, a ring of split-rail fence at the town edge, the great swamp visible in the distance to the south, dawn mist", "landscape_4_3"),

    # ---- Lake of Tears region ----
    ("great_swamp", "a vast misty wetland ringed at its centre by a still grey lake, six narrow stone wizard's towers of foreign architecture standing at uneven intervals around the water, one tower half-buried in pale dune-sand, the air shimmering faintly above the lake's centre, crystalline pale-blue fungal growths spreading outward from the shore through the reeds, low overcast light", "landscape_4_3"),
    ("buried_tower", "a narrow stone wizard's tower three-quarters buried in pale drifting sand, only its upper third and chimney visible above the dune-line, the chimney venting a lazy plume of dark smoke and hot air that has scoured a clear ring around the tower in the spreading crystalline pale-blue fungus, the rest of the tower's exposed walls crusted with that fungus, marsh-light, no figures", "portrait_4_3"),
    ("volcano_tower", "a stone wizard's tower built in the rough conical shape of a small volcano, heat-shimmer rising from its open rim, embers and bright-orange firelight visible inside the cone, scorch-marks fanning down the outer walls, a thin crescent of marsh-water at its base reflecting the orange glow, ash drifting on the wind", "portrait_4_3"),
    ("darkness_tower", "a squat dark-stone wizard's tower with a pitch-black archway entrance that seems to swallow the surrounding light, the grass and reeds within several paces of the door yellowed and dying, the stone walls inlaid with a faint mosaic of light-and-dark tiles only suggested in the dim, a deepening twilight overhead, no figures", "portrait_4_3"),
    ("sinking_tower", "a slender wizard's tower of pale stone floating upright on the still surface of a wide grey lake, its base just touching the water, a faint ripple where it meets the surface, mist rising off the lake, the tower's single high window dark, an eerie quiet", "portrait_4_3"),
    ("lightning_tower", "a tall narrow stone wizard's tower clearly levitating in mid-air about six metres above a reedy marsh — there is a wide visible empty gap of open air and sky between the flat stone underside of the tower and the wet marshy ground below, a dark circular shadow cast directly under the floating base onto the reeds and pools, the tower is unsupported and obviously hovering, NOT standing on a hill, NOT built on the ground, NOT mounted on a pillar; jagged metal spikes jut from the tower's sides at every level with arcs of pale blue-white lightning crackling between them, low storm-clouds above, the air smelling of ozone, no figures", "portrait_4_3"),
    ("gerhald_tower", "an old wizard's tower of weathered red-brown stone standing on a grassy hill above the marsh, deeper red staining around the base of the walls where an old blood-rite was performed, narrow slit windows, a single low door, the tower untouched by the fungus that creeps up to its hill, late evening light", "portrait_4_3"),
    ("laurents_city", "a colossal once-flying castle that fell out of the sky and CRASHED into a forested hillside centuries ago, lying like a foundered ship gone aground — the entire massive stone castle is tilted hard onto its side at roughly thirty degrees, leaning sharply to one side as though it impacted the slope and tipped over, the rocky underside of the structure (showing the bottom of what was once airborne) clearly exposed and visible to the viewer, several of its spires snapped off and lying broken across the rubble below, towers leaning at wildly different angles from the lurch of the crash, outer walls cracked wide open with gaping breaches that reveal dark interior decks and holds, parapets crushed inward, half the structure half-buried in a deep impact crater of churned earth and shattered rock; a long landslide scar trails down the hillside behind it, scattered tumbled pale-stone blocks and uprooted dark conifer trees lying along the gouge; thick centuries-old vines, dark moss, and saplings have grown across the broken stonework; NO banners, NO lights, NO life — clearly a long-abandoned wreck; the castle is unmistakably TILTED and PARTLY COLLAPSED, NOT an upright intact castle, NOT a normal hilltop fortress; low overcast light, no figures", "landscape_4_3"),
    ("luchebert_monastery", "an aerial three-quarter view: a tall sheer cliff PROMONTORY juts out from a range of green rolling hills into a deep river valley, with the river curving around the cliff's base hundreds of feet below; the cliff promontory is connected back to the main hills by one NARROW ROCKY LAND-BRIDGE / saddle — a thin neck of land just wide enough for a single switchback path; on the promontory itself, at its cliff-facing front, stands one tall imposing plain-stone monastery building, three storeys high, austere rectangular, rough-cut stone walls, small wood-shuttered windows, one prominent tall pointed-arch stained-glass chapel window on the upper level (saint chapel is an interior hall within this building), small simple belfry on the roof; the rest of the promontory's flat top behind the building is a clearly visible HEDGE LABYRINTH garden — low clipped green hedges arranged in tight winding curving paths forming a readable maze pattern, neat herb plots planted along the paths, several stone benches at corners of the maze; at the back of the promontory a small stone arched gate where the path leaves the maze and crosses the narrow saddle to the rolling hills behind; soft morning light catching the cliff face, the saddle, and the maze pattern; no figures", "landscape_4_3"),

    # ---- Independents ----
    ("linar_harbour", "a small independent harbour town on a rocky east coast, a stone breakwater and a wooden pier, fishing boats with overseas-style triangular sails moored along the dock, salt-bleached timber warehouses, gulls overhead, the start of a long inland trade road climbing away from the docks toward distant hills", "landscape_4_3"),
    ("pirate_cove", "a hidden lawless raider's stronghold tucked into a deep narrow rocky cove on a wild south-coast cliff line, the cove invisible from the open sea behind a curtain of jagged sea-stacks; several overseas-style ships with patched triangular sails moored on dark water inside the cove, some half-careened on a stony beach being repaired; ramshackle pirate dwellings of salvaged ship-timbers and weathered planks built directly into clefts and caves in the cliff face, rope ladders and scaffold walkways lashed between them; cooking-fires burning on the beach, smoke threading up the cliffs, makeshift lookout platforms perched on the headland with watch-bells; weather-bleached debris and broken figureheads piled along the strand; overcast cold-grey light, a dangerous quiet, no figures clearly visible at this distance", "landscape_4_3"),
    ("salmonswell", "an independent river city built on terraces above a wide clear river, a strong freshwater spring boiling up at the river's edge inside a stone basin, fish-smoking-houses with thin grey smoke rising along the bank, arched stone bridges crossing side-channels, late summer light", "landscape_4_3"),
    ("fata_morgana", "a large fortified desert city walled in pale carved sandstone, narrow shaded jewel-bright streets visible inside the gates, hammered-bronze domes and slender towers, a faint protective shimmer in the air around the outer walls, golden dunes pressing in on every side, late afternoon heat haze", "landscape_4_3"),
    ("gap_city", "a town built into a steep narrow mountain pass, stone houses stacked against the cliffs on both sides of a single road, a heavy iron-bound gate at the far end facing out toward strange shifting hazy lands beyond, hardy alpine grass on the rocks", "landscape_4_3"),
    ("raft_city", "a city built entirely on water, floating in the heart of a vast old-growth forest of ENORMOUS towering trees with massive trunks four metres thick rising straight up out of the dark river around and through the city, branches forming a high green canopy far overhead; the city itself is a sprawling collection of dozens of broad flat wooden BARGES floating side by side on the slow wide river — each barge is its own square floating platform with one or two small timber-and-thatch houses built directly on top, the barges lashed together with thick ropes and connected by a network of plank gangplanks crossing between them; some barges are large and carry multiple cottages, others are tiny with a single hut; smoke from cookfires curls up between the great tree-trunks; small rowboats and skiffs moored to the corners of the outer barges; dappled green light filtering down through the canopy onto the still dark water; NO solid ground, NO riverbank houses, NO buildings on land — every structure floats on a barge; no figures", "landscape_4_3"),
    ("world_edge", "a hard-built mining city at the base of a chain of dark active volcanoes, multiple forge-chimneys venting orange-edged smoke, terraced industrial districts with massive bellows-houses and ore-cart rails, the mountains behind glowing faintly red at dusk, soot in the air", "landscape_4_3"),
    ("rosepond", "a small mining village built around a still dark pond reflecting the red light of distant volcanoes, modest stone houses with thick slate roofs, a single mine-shaft head-frame at the village edge, rose-thorn hedges along the lanes giving the village its name, evening light", "landscape_4_3"),
    ("haven", "a quiet hidden settlement at the edge of strange hazy shifting lands, mossy paths winding between modest huts, slow-moving humanoid wooden-and-metal puppet figures going about quiet daily tasks (kept indistinct in the middle distance), no other living folk, soft diffused fog limiting the view, an off-world calm", "landscape_4_3"),
    ("lastwater", "a small caravan stop beside the last reliable spring on a southern road, a stone well-head and a few low mudbrick travellers' shelters, a hitching post for camels and mules, the dry expanse of the blasted lands and beyond it the desert just visible past the road's end, harsh midday light", "landscape_4_3"),

    # ---- Hazards and features ----
    ("forbidden_woods", "a forest of strangely warped trees just north of marshlands, trunks bent into impossible curves, leaves the wrong colours for any season at once, a faint sourceless light between the trunks, the ground patchy with unnatural moss, an unsettling hush", "landscape_4_3"),
    ("blasted_lands", "a vast hazardous southern region of cracked salt-flats and broken mage-era ruins, half-collapsed pale stone arches and toppled towers strewn across the landscape, a faint shimmering glow on the horizon at the centre where the portal stands, dust devils in the middle distance, harsh white sky", "landscape_4_3"),
    ("southern_desert", "a continental band of pale shifting dunes under a hot bleached sky, distant fata-morgana mirages of cities along the horizon line, occasional ribbons of strange darker sand winding through the lighter sand, the suggestion of unseen chaos-spirit movement in the dust devils", "landscape_4_3"),
    ("coastal_mountains", "a long jagged eastern mountain range running from green hills in the south to dark volcanic peaks in the north, a single thin trade-road pass visible at the southern end where lower foothills allow passage, low clouds caught against the western flank, the eastern coast just glimpsed beyond the highest ridges", "landscape_4_3"),
    ("worlds_end_volcanoes", "the most active northern volcanoes of the coastal range, multiple cones glowing red at their crests against a dark sky, lava-glow visible on upper flanks, ash plumes catching cold high-altitude wind, the rocky horizon line of a far country", "landscape_4_3"),
    ("portal", "a tall standing rectangular stone gateway built by the first humans of this world, glyphs carved on its inner surfaces, the air within the frame shimmering with a soft prismatic glow that suggests dimensions beyond the landscape, the cracked salt-flats of the blasted lands stretching away around it", "portrait_4_3"),
    ("white_city", "the broken pale-stone ruins of a great old mage civilisation's capital, toppled fluted columns and the shells of vast halls half-buried in salt-flat, the suggestion of immense scale even in collapse, the bones of the city catching the colourless light of the blasted lands", "landscape_4_3"),
    ("thorgals_mirror", "a tall heavy ornate dark-wood-framed standing scrying mirror leaned against the mossy trunk of an old forest tree, the glass crazed with fine cracks, a faint sickly green light deep within the reflection that does not match the sunlit forest around it, fallen leaves scattered at its base, an unattended wrongness", "portrait_4_3"),

    # ---- Dungeons — Pre-Rift Pair (broken lands) ----
    ("generator", "the underground entry to a pre-rift mage laboratory cut three levels deep into pale-stone ruins at the centre of a vast dead city in cracked salt-flats; the partially-collapsed stone tower above is half-buried, its ground-floor doors gone leaving only a dark stairwell descending; carved over the threshold a faint circular Lethran seal bisected by two parallel lines; humanoid wooden-and-iron puppet-parts loosely fitted into wrong shapes patrol the ground floor in the gloom; pale dust hangs in slanted shafts of light, the suggestion of slow continuous fitting-sounds coming from below; cold haunted atmosphere, no living figures", "portrait_4_3"),
    ("anchor", "a sphinx-guarded entrance buried in the side of a sand-swept low hill in pre-desert agricultural country; only the upper rim of a stone doorway and a carved Lethran seal (a circle bisected by two parallel lines) protrudes from drifting golden dunes; a colossal couchant stone sphinx with a weathered human face sits motionless on top of the mound, watching the approach; the buried laboratory beneath is intact and undisturbed; harsh midday desert light, the air still and waiting, no figures other than the stone guardian", "portrait_4_3"),
    ("lethran_dwelling", "a modest pre-rift stone-and-timber family home preserved in unnatural good condition through a small thousand-year-old protective working, standing alone in faded wild fields with the broken lands on the horizon; the cottage roof is whole, the door slightly ajar, lamp-light still glowing in one window though no one has lived here in centuries; an ordinary domestic scene rendered uncanny by its very preservation, soft golden hour light, a cared-for quiet, no figures", "landscape_4_3"),
    ("grain_mill", "a half-ruined pre-rift stone mill standing beside a slow choked river in cracked broken-lands country, its great wooden waterwheel collapsed and tilted, two large millstones inside still upright in the gloom — these millstones did not only grind grain but also cut flat stone-blanks for mage workings; pale dust on every surface, mill machinery ancient and partly intact, dim light through cracked shutters, no figures", "landscape_4_3"),
    ("press_house", "a long ruined pre-rift vineyard hall on a high ridge overlooking the broken lands' middle stretches, large open stone wine-vats half-collapsed inside the roofless hall, twisted dead vine stocks growing across the stone floor, a partly-hidden iron-banded trapdoor in the corner leading down to a preserved supply-cache; sere golden grass on the ridge, a wide bleak vista beyond, late afternoon long shadows, no figures", "landscape_4_3"),

    # ---- Dungeons — NPC-tied ----
    ("ironwood_mill", "front-facing view of a long-abandoned ironwood-cutting mill at the edge of the blasted lands. The mill is a windowless heavy stone bunker — a featureless rectangular block of thick pale-grey stone walls under a flat stone roof. The wall facing the viewer is almost entirely unbroken solid stone. The ONLY opening anywhere on the wall is a single black horizontal LETTERBOX SLIT cut into the very base of the wall at ground level — the slit is a wide flat slot exactly like a giant mail slot or letterbox at the bottom of a wall, perhaps three metres wide but only half a metre tall, with a flat horizontal stone lintel. The slit's width-to-height ratio is roughly 6 to 1. A person could not walk through this slit standing up; only a tree-trunk could slide through it lying on the ground. The slit is at FLOOR level, NOT at chest level. There is NO arched doorway, NO normal door, NO archway, NO standing entrance anywhere in this image — only the low horizontal letterbox slit at ground level. Long weathered ironwood logs lie on the dirt in front of the slit, some partly fed into it lying flat on the ground. The blasted lands' bleached cracked landscape stretches behind the building, no figures.", "landscape_4_3"),
    ("mirror_camp", "an abandoned overseas-forces forward war camp in a hidden valley between green hills, rotted canvas tents collapsed in rows on the trampled ground, a half-burnt watch-fire pit at the centre, weather-bleached weapon racks and broken equipment scattered around, foreign sigil banners faded and torn; in the centre of the largest collapsed tent stands a tall ornate dark-wood-framed scrying mirror still upright on its pedestal, the glass crazed with cracks, a faint sickly green light deep within the reflection; overcast cold light, the camp untouched for years, no figures", "landscape_4_3"),
    ("tidehold", "a tall pre-rift sea-mage's cliff-tower built directly into a sheer dark cliff face where coastal mountains descend to a churning grey ocean, half-claimed by the sea; the lower two levels of the tower are submerged at high tide and visible now only as wave-battered stone arches and a half-flooded doorway awash with surf; the upper levels are reached by a worn cut stair carved up the cliff face; salt spray, kelp-draped stones at the base, gulls in the wind, no figures", "portrait_4_3"),

    # ---- Other ----
    ("moth_hollow", "a quiet shaded burial hollow tucked among low hills near the Lake of Tears, hundreds of weathered stone grave markers and small worn statuettes arranged in patient rows on a mossy slope under tall ancient trees, pale moths drifting in the dim air between the stones, a thin mist hanging close to the ground, a lit candle still burning at one of the graves although nobody is in sight, late dusk, a hush that feels watched-over rather than empty, no figures", "landscape_4_3"),
    ("family_crypt", "a modest stone family mausoleum entrance set into a fitted-stone wall along a narrow cobbled street in a small Brumal hill town, the doorway framed by carved generations-old badger-clan motifs, the heavy stone door slightly ajar with broken old wax seals on the lintel, an unnatural cold blue-white light leaking faintly from inside the dark interior — a glow that should not be there — frost outlining the stone seams around the door; cold overcast twilight, a hill-town street empty of inhabitants, a dread quiet, no figures", "portrait_4_3"),
    ("necropolis", "a vast quiet city of the dead built on a low rise at the desert's edge west of cracked salt-flats, hundreds of weathered pale-stone tombs, mausolea, tall obelisks and stepped burial-terraces arranged on long ordered avenues; a low encircling stone wall around the older inner sections, a single tall stone gate-arch at the entrance, thin threads of incense smoke rising from a few of the mausolea; the city is sparsely tended rather than abandoned, austere and patient, no crowds, no bustle, no figures, late golden-hour desert light", "landscape_4_3"),
]


def lookup(slug: str) -> str:
    body = dict(NPCS).get(slug)
    if body is None:
        body_loc = next((b for s, b, _ in LOCATIONS if s == slug), None)
        if body_loc is not None:
            return body_loc
        raise SystemExit(f"Unknown slug: {slug!r}. Use 'list' to see known slugs.")
    return body


def render_one(key: str, slug: str, body: str, out_dir: pathlib.Path) -> bool:
    """Render one NPC. Returns True if newly generated, False if skipped."""
    out_path = out_dir / f"{slug}.png"
    if out_path.exists():
        print(f"  {slug}: skip (already at {out_path.relative_to(ROOT)})")
        return False
    img = call_flux(key, body, slug)
    archive_existing(out_path)  # no-op since path didn't exist; safe
    out_path.write_bytes(img)
    print(f"    -> {out_path.relative_to(ROOT)}")
    return True


def run_pilot() -> None:
    key = load_key()
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {ENDPOINT_PRO}")
    out_dir = ROOT / "html" / "icons" / "npcs"
    out_dir.mkdir(parents=True, exist_ok=True)
    pilot_slugs = {"diederik", "bridget", "irna_bean", "laurent", "tod"}
    print(f"\nGenerating pilot NPCs to {out_dir.relative_to(ROOT)}/ ...")
    n_done = 0
    for slug, body in NPCS:
        if slug not in pilot_slugs:
            continue
        if render_one(key, slug, body, out_dir):
            n_done += 1
    print(f"\nPilot done. {n_done} new file(s) in {out_dir.relative_to(ROOT)}/.")


def run_npcs() -> None:
    key = load_key()
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {ENDPOINT_PRO}")
    out_dir = ROOT / "html" / "icons" / "npcs"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"\nGenerating {len(NPCS)} NPCs to {out_dir.relative_to(ROOT)}/ "
          f"(skipping any already present) ...")
    n_done = 0
    n_skip = 0
    for slug, body in NPCS:
        if (out_dir / f"{slug}.png").exists():
            print(f"  {slug}: skip")
            n_skip += 1
            continue
        if render_one(key, slug, body, out_dir):
            n_done += 1
    print(f"\nDone. {n_done} new, {n_skip} skipped, "
          f"{len(NPCS)} total in {out_dir.relative_to(ROOT)}/.")


def run_places() -> None:
    key = load_key()
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {ENDPOINT_PRO}")
    out_dir = ROOT / "html" / "icons" / "places"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"\nGenerating {len(LOCATIONS)} locations to {out_dir.relative_to(ROOT)}/ "
          f"(skipping any already present) ...")
    n_done = 0
    n_skip = 0
    for slug, body, ratio in LOCATIONS:
        out_path = out_dir / f"{slug}.png"
        if out_path.exists():
            print(f"  {slug}: skip")
            n_skip += 1
            continue
        img = call_flux(key, body, slug, ratio=ratio, style=STYLE_LOC)
        archive_existing(out_path)
        out_path.write_bytes(img)
        print(f"    -> {out_path.relative_to(ROOT)}")
        n_done += 1
    print(f"\nDone. {n_done} new, {n_skip} skipped, "
          f"{len(LOCATIONS)} total in {out_dir.relative_to(ROOT)}/.")


def run_single(slug: str, ultra: bool = False) -> None:
    if slug in dict(NPCS):
        body = dict(NPCS)[slug]
        out_dir = ROOT / "html" / "icons" / "npcs"
        ratio, style = "portrait_4_3", STYLE_NPC
        kind = "NPC"
    else:
        loc = next(((s, b, r) for s, b, r in LOCATIONS if s == slug), None)
        if loc is None:
            raise SystemExit(f"Unknown slug: {slug!r}. Use 'list' to see known slugs.")
        body, ratio = loc[1], loc[2]
        out_dir = ROOT / "html" / "icons" / "places"
        style = STYLE_LOC
        kind = "location"
    key = load_key()
    out_dir.mkdir(parents=True, exist_ok=True)
    endpoint = ENDPOINT_ULTRA if ultra else ENDPOINT_PRO
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {endpoint}")
    print(f"\nGenerating single {kind} '{slug}' (force re-render{', ULTRA' if ultra else ''}) ...")
    img = call_flux(key, body, slug, ratio=ratio, style=style, ultra=ultra)
    out_path = out_dir / f"{slug}.png"
    archive_existing(out_path)
    out_path.write_bytes(img)
    print(f"    -> {out_path.relative_to(ROOT)}")


def run_list() -> None:
    print(f"{len(NPCS)} known NPC slugs:")
    for slug, _ in NPCS:
        print(f"  {slug}")
    print(f"\n{len(LOCATIONS)} known location slugs:")
    for slug, _, _ in LOCATIONS:
        print(f"  {slug}")


# --- Card-deck motifs ----------------------------------------------------
# Single-subject woodcut icons used as watermarks on the playing-card
# templates (base elements, racial powers, gear). 12 + 37 + 34 = 83 icons.

ICON_ELEMENTS = [
    ("flame",  "a single tall curling flame, tongues of fire rising upward"),
    ("water",  "a single large water droplet with concentric ripples beneath it"),
    ("wind",   "a curling spiral of wind, swirling air streams forming a vortex"),
    ("plants", "a sprig of three broad leaves on a curving stem, simple herbal motif"),
    ("iron",   "two crossed iron nails forming an X, forged metal motif"),
    ("earth",  "a stylised mountain peak silhouette with layered stone strata"),
    ("light",  "a radiant sun with eight long straight rays, simple solar emblem"),
    ("dark",   "a crescent moon with a single small star, simple lunar emblem"),
    ("blood",  "a single droplet of blood encircled by a hand-drawn ring"),
    ("storm",  "a forked lightning bolt striking down through a thunder cloud"),
    ("shadow", "a half-hooded face mask, one half black silhouette one half line"),
    ("ruin",   "a cracked broken stone column toppled into rubble"),
]

ICON_POWERS = [
    ("adaptation", "a hooded figure stepping through cast shadow, body half-merged with darkness"),
    ("balance",    "an acrobat tumbling mid-roll, arching body silhouette in motion"),
    ("blood",      "a single droplet of blood with a small green vine sprouting upward from it"),
    ("camp",       "a triangular canvas tent in the centre of the frame with a small campfire burning prominently to the left of it, both tent and fire equally large and clearly visible, smoke rising upward from the flames, both subjects fill the centre of the frame"),
    ("charge",     "a charging boar lowering its head and tusks forward, motion lines behind"),
    ("clan",       "three concentric rings of clasped hands forming a circle of family"),
    ("claw",       "a large single curved animal claw filling the centre of the frame, the talon is dark, sharp, and prominent — a heavy curved sickle-shape with a thick base tapering to a sharp pointed tip, taking up the full height of the frame, dark silhouette filling the centre, predator's claw icon"),
    ("climber",    "a single hand grasping a jagged rock edge from below"),
    ("control",    "two hands cupping a swirling cloud of dust between them"),
    ("digging",    "an isolated heraldic emblem of two crossed mining pickaxes arranged in an X shape, both pickaxes with dark iron heads bearing sharp curved points and thick wooden hafts, the X fills the entire frame edge-to-edge, no landscape, no background scenery, just the crossed pickaxes as a bold heraldic emblem on plain parchment"),
    ("druid",      "an antlered stag's head crowned with oak leaves and acorns"),
    ("flight",     "a single outstretched feathered wing, mid-beat"),
    ("fur",        "a thick bristled animal pelt with raised defensive fur"),
    ("hearing",    "a large pricked pointed ear with curving sound-wave arcs around it"),
    ("hide",       "an overlapping arrangement of thick scaled hide plates"),
    ("hunter",     "an isolated heraldic emblem of a vertical longbow with a single nocked arrow, the bow stave forms a tall curving D-shape filling the full height of the frame, the bowstring drawn taut, the arrow aimed upward, dark silhouette filling the centre, no landscape, no background scenery, just the bow-and-arrow as a bold heraldic emblem"),
    ("ingenuity",  "a large iron gear in the centre of the frame with a small wooden lever resting on top of it and a coiled rope wrapped around its teeth, the gear dominates the frame, mechanical icon"),
    ("jaws",       "a snarling open mouth with bared canine teeth and fangs"),
    ("labyrinth",  "a square unicursal maze pattern with intricate path lines"),
    ("lookout",    "a tall stone watchtower silhouette against a high horizon"),
    ("magic",      "an open upward-facing human hand in the centre of the frame, palm up, with three large bright sparks of magical energy rising prominently from the fingertips, the hand and the sparks together fill the centre of the frame"),
    ("musical",    "a small wooden lute crossed with a wooden flute"),
    ("night",      "a single watching eye glowing in surrounding darkness"),
    ("nimble",     "an isolated bold silhouette of a sprinting humanoid figure mid-stride filling the centre of the frame, both arms swung dynamically and one leg raised high in mid-step, three curved motion-streak lines trailing behind the body, the running figure dark and prominent, no landscape, no background scenery, just the dynamic sprint silhouette as a bold emblem"),
    ("politics",   "two hands clasping in agreement above a rolled scroll"),
    ("portage",    "a heavy travelling pack and bedroll lashed onto bent shoulders"),
    ("relaxed",    "a figure seated leaning back against a tree trunk, head tipped back"),
    ("religion",   "a hand raised in benediction with rays radiating from the fingertips"),
    ("scolding",   "a finger pointing forward beneath a wide open shouting mouth"),
    ("scrounger",  "a worn rucksack overflowing with a loaf of bread and a flask"),
    ("scurry",     "a small darting rodent silhouette in mid-run"),
    ("shamanic",   "a single large feather standing upright in the centre of the frame with a knotted leather cord tied around its quill, several small bone beads threaded onto the cord — feather and beaded cord both clearly visible and prominent, ritual fetish icon"),
    ("sleeper",    "a figure curled up sleeping under a wrapped travel cloak"),
    ("sly",        "a fox face with one raised brow and a sly half-smile"),
    ("smell",      "a long pointed snout sniffing forward, scent lines curling up from it"),
    ("swimmer",    "a swimmer cleaving through a stylised cresting wave"),
    ("travels",    "a worn travelling staff crossed with a leather walking boot"),
]

ICON_BACKGROUNDS = [
    ("noble",         "an ornate noble's coronet — a small ring-shaped crown with several short rounded points around the rim, simple heraldic emblem filling the frame"),
    ("farmer",        "a curved harvest scythe crossed with a tied bundle of wheat stalks, simple farm-tool icon"),
    ("scholar",       "an open thick leather-bound book lying flat with a feathered quill resting across its pages"),
    ("watch",         "a guard's iron helm with a vertical nose-piece, viewed from the front, three-quarter angle, military helmet icon"),
    ("crafter",       "a heavy blacksmith's hammer with a thick wooden handle resting on top of a large iron anvil, both objects clearly visible, the hammer head sitting on the flat top of the anvil — both subjects equally prominent and filling the frame, craft-tool icon"),
    ("monastery",     "a closed loop of round wooden prayer beads filling the centre of the frame, the beads clearly individual round shapes strung on a cord, a small simple Christian-style cross hangs from the bottom of the loop, the entire string of beads is the central subject and dominates the frame"),
    ("ascetic",       "a tall walking staff leaning against a small empty wooden begging bowl on the ground"),
    ("trader",        "a balance-scale with two round pans suspended from a horizontal beam, a small coin purse beneath it"),
    ("fisher",        "a single curved fishing hook with a length of line, the hook taking up most of the frame"),
    ("circus_troupe", "three juggling balls arranged in a triangular pattern with curving motion-arc lines between them"),
    ("back_alley",    "a hooded figure in profile crouching low, holding a thin lockpick in one hand, simple thief silhouette"),
    ("hunter",        "a large branched stag's antler standing upright in the centre of the frame, with several feathered arrows tucked behind it as if held in a quiver, the antler dominates the frame with its multiple curving tines and points, hunter's woodland emblem"),
    ("miner",         "a round metal miner's helm worn high in the frame, with a small lit oil lamp mounted at the front of the helmet's brow — the lamp visibly burning with a small flame — and a heavy pickaxe leaning prominently behind the helm, both subjects clearly present"),
    ("army",          "a tall pike crossed behind a kite-shaped shield with a heraldic boss, military emblem"),
]

ICON_ITEMS = [
    ("sword",             "a straight long sword pointing upward, simple cruciform hilt"),
    ("glave",             "a glaive — a long-handled curved blade pole-arm, point upward"),
    ("flail",             "a flail — wooden handle with a chain ending in a spiked iron ball"),
    ("spear",             "a simple spear with a leaf-shaped iron head, point upward"),
    ("staff",             "a tall wooden walking staff with a knotted top"),
    ("bow",               "a recurve longbow strung with a single arrow nocked"),
    ("crossbow",          "a medieval heavy crossbow shown in profile side view filling the frame: a long horizontal wooden stock with a curved trigger underneath the rear end, a thick wooden shoulder-stock at the back, a heavy horizontal bow-arc fixed perpendicular at the front of the stock with a taut bowstring, a single short crossbow bolt resting along the top of the stock pointing forward, the entire weapon fills the width of the frame as a bold dark silhouette, isolated medieval-weapon icon"),
    ("sling",             "a leather sling with a stone in the pouch, mid-swing arc"),
    ("dagger",            "a short straight dagger pointing upward, simple grip"),
    ("darts",             "three crossed throwing darts with feathered fletchings"),
    ("whip",              "a coiled leather whip with the tip uncoiled in an S-curve"),
    ("pickaxe",           "a heavy iron pickaxe with a wooden haft, head pointed upward"),
    ("armor",             "a full plate breastplate-and-pauldron silhouette, imposing armoured torso"),
    ("breastplate",       "a single rounded chest breastplate with shoulder strap fittings"),
    ("leather",           "a leather jerkin with cross-stitched seams, light armour"),
    ("shield",            "a heater-shaped shield with a heraldic boss in the centre"),
    ("horse",             "a saddled horse standing in profile, mane and tail flowing"),
    ("donkey",            "a stout pack donkey standing in profile carrying bundles"),
    ("dog",               "a hound dog in profile, alert posture with ears pricked up"),
    ("falcon",            "a hooded hunting falcon perched on a leather glove"),
    ("cart",              "a wooden two-wheeled cart in side view with simple plank boards"),
    ("backpack",          "a stuffed travelling backpack viewed from the side filling most of the frame, leather shoulder straps, a tightly rolled bedroll lashed horizontally across the top, hand-drawn icon"),
    ("tools",             "a hammer crossed with a small saw, basic crafting tools"),
    ("fishing_net",       "a draped fishing net with knotted mesh and small floats"),
    ("knife",             "a small belt knife in a simple sheath, blade exposed"),
    ("potion",            "a small round-bellied glass phial with a cork stopper"),
    ("refreshment_potion", "a tall thin glass phial with bubbles rising inside it"),
    ("rage_potion",       "an angular glass phial with flickering flame sealed inside"),
    ("effect_potion",     "a faceted glass phial with a swirling vapour curling out the top"),
    ("bandages",          "a roll of linen bandages partly unspooled with a tied end"),
    ("ring",              "a single finger ring shown in three-quarter view, a circular metal band with one large round gemstone set on top of the band, the band's circle clearly visible underneath the gem, jewellery icon filling the frame"),
    ("bracelet",          "a circular beaded bracelet lying flat as seen from above, a closed loop of clearly individual round wooden beads strung on a leather cord, simple jewellery icon, NOT an animal"),
    ("earring",           "a profile-view close-up of a human ear filling the centre of the frame, an ornate dangling silver earring hanging from the earlobe — a small hoop through the lobe with a teardrop pendant suspended below — the ear and earring are the entire subject, partial hair visible at the edges, hand-drawn icon"),
    ("medallion",         "a round embossed metal medallion pendant hanging from a short chain, the medallion is a solid disc clearly stamped with a sun-and-star heraldic emblem on its face, the disc fills most of the frame"),
]


def run_icons() -> None:
    key = load_key()
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {ENDPOINT_PRO}")
    sets = [
        ("elements",    ICON_ELEMENTS),
        ("powers",      ICON_POWERS),
        ("backgrounds", ICON_BACKGROUNDS),
        ("items",       ICON_ITEMS),
    ]
    total = sum(len(s) for _, s in sets)
    print(f"\nGenerating {total} card-deck motif icons (woodcut style) ...")
    n_done = n_skip = 0
    for subset_name, cards in sets:
        out_dir = ROOT / "html" / "icons" / "cards" / subset_name
        out_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n-- {subset_name} ({len(cards)}) -> {out_dir.relative_to(ROOT)}/")
        for slug, body in cards:
            out_path = out_dir / f"{slug}.png"
            if out_path.exists():
                print(f"  {subset_name}/{slug}: skip")
                n_skip += 1
                continue
            seed_name = f"icon_{subset_name}_{slug}"
            img = call_flux(key, body, seed_name,
                            ratio="square_hd", style=STYLE_ICON)
            archive_existing(out_path)
            out_path.write_bytes(img)
            print(f"    -> {out_path.relative_to(ROOT)}")
            n_done += 1
    print(f"\nIcons done. {n_done} new, {n_skip} skipped, {total} total.")


def run_icon_single(slug: str, subset: str) -> None:
    """Force re-render one card icon; subset must be elements|powers|items."""
    cards_by_subset = {
        "elements":    ICON_ELEMENTS,
        "powers":      ICON_POWERS,
        "backgrounds": ICON_BACKGROUNDS,
        "items":       ICON_ITEMS,
    }
    if subset not in cards_by_subset:
        raise SystemExit(f"Unknown subset: {subset!r}. Use elements|powers|backgrounds|items.")
    cards = cards_by_subset[subset]
    body = next((b for s, b in cards if s == slug), None)
    if body is None:
        raise SystemExit(f"Unknown {subset} slug: {slug!r}")
    key = load_key()
    out_dir = ROOT / "html" / "icons" / "cards" / subset
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: {ENDPOINT_PRO}")
    print(f"\nGenerating single icon '{subset}/{slug}' (force re-render) ...")
    img = call_flux(key, body, f"icon_{subset}_{slug}",
                    ratio="square_hd", style=STYLE_ICON)
    out_path = out_dir / f"{slug}.png"
    archive_existing(out_path)
    out_path.write_bytes(img)
    print(f"    -> {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "pilot"
    if cmd == "pilot":
        run_pilot()
    elif cmd == "npcs":
        run_npcs()
    elif cmd == "places":
        run_places()
    elif cmd == "icons":
        run_icons()
    elif cmd == "icon":
        if len(sys.argv) < 4:
            raise SystemExit("Usage: generate_card_art.py icon <subset> <slug>")
        run_icon_single(sys.argv[3], sys.argv[2])
    elif cmd == "single":
        if len(sys.argv) < 3:
            raise SystemExit("Usage: generate_card_art.py single <slug> [--ultra]")
        ultra = "--ultra" in sys.argv[3:]
        run_single(sys.argv[2], ultra=ultra)
    elif cmd == "list":
        run_list()
    else:
        raise SystemExit(
            f"Unknown command: {cmd!r}. "
            f"Try 'pilot', 'npcs', 'places', 'icons', "
            f"'icon <subset> <slug>', 'single <slug>', or 'list'."
        )
