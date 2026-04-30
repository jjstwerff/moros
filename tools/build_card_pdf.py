#!/usr/bin/env python3
"""Build a printable PDF of NPC and location cards at MtG size (63×88 mm).

Reads:
  doc/npcs/cards.md    — NPC card text blocks (Name / role / Teaches / Earned by)
  doc/places/cards.md  — Location card text blocks (Name / type / Known for / Who's there / Earned by)
  html/icons/npcs/<slug>.png   — generated NPC art
  html/icons/places/<slug>.png — generated location art

Writes:
  data/moros_cards.pdf — A4 sheets, 9 cards per page (3×3), MtG size, ready to cut.

Players earn cards as XP rewards and reminders of NPCs/places they encountered.
NPC cards = 100 XP, Location cards = 50 XP (override per-card via XP_OVERRIDE).

Usage:
  .venv-cards/bin/python3 tools/build_card_pdf.py
"""

import io
import re
import pathlib
import unicodedata
from PIL import Image, ImageEnhance, ImageFilter
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import mm
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

ROOT = pathlib.Path(__file__).resolve().parent.parent
NPC_CARDS_MD = ROOT / "doc" / "npcs" / "cards.md"
LOC_CARDS_MD = ROOT / "doc" / "places" / "cards.md"
NPC_IMG_DIR = ROOT / "html" / "icons" / "npcs"
LOC_IMG_DIR = ROOT / "html" / "icons" / "places"
OUT_PDF = ROOT / "data" / "moros_cards.pdf"

# MtG card dimensions
CARD_W = 63 * mm
CARD_H = 88 * mm
GUTTER = 4 * mm  # space between cards on the sheet

# A4
PAGE_W, PAGE_H = A4

# Card frame colours
NPC_BORDER = HexColor("#8B5E3C")  # warm tone — character cards
LOC_BORDER = HexColor("#4A6680")  # cool slate — location cards
PARCHMENT = HexColor("#F4ECD8")
INK = HexColor("#2A2018")

# --- Card name → image-slug mapping --------------------------------------
# Card-text uses display names; images are saved by slug. Build the bridge.

NPC_NAME_TO_SLUG = {
    "LAURENT": "laurent",
    "FELICIA": "felicia",
    "NARISSA": "narissa",
    "THORGAL": "thorgal",
    "RAUL": "raul",
    "KING HANNES": "king_hannes",
    "QUEEN FIENNA": "queen_fienna",
    "PRINCE CORVEN": "prince_corven",
    "DIDRICH": "didrich",
    "PRINCESS PENELOPE": "princess_penelope",
    "JOHN BEAN": "john_bean",
    "IRNA BEAN": "irna_bean",
    "RON BEAN": "ron_bean",
    "LADY RHIANNA LINTHROPE": "rhianna_linthrope",
    "FELIX": "felix",
    "FATHER ELLIOT": "father_elliot",
    "WILLOW": "willow",
    "ELDER DIEDERIK": "diederik",
    "INNKEEPER BRIDGET": "bridget",
    "WILFRED": "wilfred",
    "FARMER JOSEPH": "farmer_joseph",
    "HANK (HANNY)": "hank",
    "EGBERT": "egbert",
    "CORNÉ DUNHAM": "corne_dunham",
    "RALPH OVERHILL": "ralph_overhill",
    "THE POT-BOY": "pot_boy",
    "THE FURNACE (POT-PERSON)": "furnace_pot_person",
    "THE HERMIT SHAMAN": "hermit_shaman",
    "THE STORM MAGE": "storm_mage",
    "TOD": "tod",
    "BROTHER DARREL": "brother_darrel",
    "ERIC RANDELL": "eric_randell",
    "NADINE": "nadine",
    "MASTER DARIUS": "master_darius",
    "REMI": "remi",
}

LOC_NAME_TO_SLUG = {
    "SCARLET VALE": "scarlet_vale",
    "BLACKWOOD FREEHOLD": "blackwood_freehold",
    "CLEAR WATER": "clear_water_mine",
    "CHATTER CREEK": "chatter_creek",
    "RAKEVILLE": "rakeville",
    "CLIFFSIDE HOLD": "cliffside_hold",
    "BOCKTHICKET": "bockthicket",
    "STEADINGTON": "steadington",
    "ELMSFIELD": "elmsfield",
    "THE GREAT SWAMP AND THE LAKE OF TEARS": "great_swamp",
    "LAURENT'S CRASHED FLYING CITY": "laurents_city",
    "LUCHEBERT MONASTERY": "luchebert_monastery",
    "LINAR HARBOUR": "linar_harbour",
    "PIRATE COVE": "pirate_cove",
    "SALMONSWELL": "salmonswell",
    "FATA MORGANA": "fata_morgana",
    "GAP CITY": "gap_city",
    "RAFT CITY": "raft_city",
    "WORLD EDGE": "world_edge",
    "ROSEPOND": "rosepond",
    "HAVEN": "haven",
    "LASTWATER": "lastwater",
    "THE FORBIDDEN WOODS": "forbidden_woods",
    "THE BLASTED LANDS": "blasted_lands",
    "THE DESERT": "southern_desert",
    "THE COASTAL MOUNTAIN RANGE": "coastal_mountains",
    "THE VOLCANOES OF WORLD'S END": "worlds_end_volcanoes",
    "THE PORTAL (INSIDE THE BLASTED LANDS)": "portal",
    "THE WHITE CITY (RUINED)": "white_city",
    "THORGAL'S MIRROR": "thorgals_mirror",
    # ---- Dungeons ----
    "THE GENERATOR": "generator",
    "THE ANCHOR": "anchor",
    "THE LETHRAN DWELLING": "lethran_dwelling",
    "THE PRE-RIFT GRAIN-MILL": "grain_mill",
    "THE PRESS-HOUSE RIDGE": "press_house",
    "THE IRONWOOD MILL": "ironwood_mill",
    "THE MIRROR CAMP": "mirror_camp",
    "THE TIDEHOLD": "tidehold",
    "MOTH HOLLOW": "moth_hollow",
    "THE FAMILY CRYPT": "family_crypt",
    "THE NECROPOLIS": "necropolis",
}

# Towers don't have card-text in places/cards.md but we generated images for
# them; emit them as location cards with synthesised text.
EXTRA_TOWERS = [
    {
        "name": "THE BURIED TOWER",
        "type": "Lake of Tears tower (1 of 6 shackles)",
        "known_for": "Furnace-tower half-buried in sand; chimney vents fight back the spreading fungus",
        "whos_there": "The Pot-Boy and the Furnace",
        "earned_by": "Descending the chimney respectfully and meeting the pot-people as people",
        "slug": "buried_tower",
    },
    {
        "name": "THE VOLCANO TOWER",
        "type": "Lake of Tears tower (1 of 6 shackles)",
        "known_for": "Stone tower in the shape of a small volcano; bound fire elemental within",
        "whos_there": "The bound fire elemental",
        "earned_by": "Befriending the elemental, or facing the violent path",
        "slug": "volcano_tower",
    },
    {
        "name": "THE DARKNESS TOWER",
        "type": "Lake of Tears tower (1 of 6 shackles)",
        "known_for": "Pitch-black entrance; light suppressed; a light elemental trapped within",
        "whos_there": "Bound light elemental",
        "earned_by": "Freeing the light elemental and decoding the mosaic",
        "slug": "darkness_tower",
    },
    {
        "name": "THE SINKING TOWER",
        "type": "Lake of Tears tower (1 of 6 shackles)",
        "known_for": "Floats on the lake; sinks if climbed onto; hidden lower half below",
        "whos_there": "The bound owner-spirit",
        "earned_by": "Riding the tower down and bringing the spirit what he wants",
        "slug": "sinking_tower",
    },
    {
        "name": "THE LIGHTNING TOWER",
        "type": "Lake of Tears tower (1 of 6 shackles)",
        "known_for": "Hovers six metres above the marsh; metal spikes arc with lightning",
        "whos_there": "The Storm Mage (when brought)",
        "earned_by": "Bringing the Storm Mage back into his tower for a bout of clarity",
        "slug": "lightning_tower",
    },
    {
        "name": "GERHALD'S HILL TOWER",
        "type": "Lake of Tears tower (the anchor; 1 of 6 shackles)",
        "known_for": "The original blood tower; anchor of the ring; can only be opened by consent",
        "whos_there": "The Hermit Shaman / Gerhald",
        "earned_by": "Earning Gerhald's consent — this tower was never moved into the ring",
        "slug": "gerhald_tower",
    },
]

XP_NPC = 100
XP_LOC = 50

# --- Flavour text --------------------------------------------------------
# General lore/description text shown on each card. Mechanics (what the
# NPC teaches, what earns the card) are intentionally NOT here — those are
# DM discretion at the table.

FLAVOR = {
    # NPCs
    "laurent": "A demi-lich older than the kingdoms, who once piloted his flying castle as a refuge during the Rift. Now only a floating skull remains, suspended above an empty throne in his crashed wreck. He still remembers everything; he chooses what to share.",
    "felicia": "Saint Luchebert's order calls Felicia a great spirit; the people of the hill country know her as the patient kindness that keeps small things alive. Her shrine is a cave below the maze garden, tended by Willow's hands at dawn and at dusk.",
    "narissa": "The first mage. A young colonist pulled under by a whirlpool and never wholly returned — bound to a water-spirit that extended her life and broke her sleep. Her diary became the foundation of every magecraft that followed.",
    "thorgal": "Overseas mage, leader of an invasion driven by famine. Killed in his own chambers when he reached through a scrying mirror into the head of a boar-folk farmer. His residue lingers in that mirror still, somewhere in a forest.",
    "raul": "Ox-tauren commander who once captured King Hannes and held him in a forward camp. When Thorgal's mirror went dark, he withdrew rather than entrench. He knows the war's true reasons better than the kingdoms he fought.",
    "king_hannes": "King of Allondo, returned from captivity by a raccoon's quiet timing and a brother's quieter sacrifice. He preserves a small ledger of debts the crown will not say aloud.",
    "queen_fienna": "Born to the Leatherman forge-houses of World's End, married into court for trade reasons. She brought iron-grade competence with her and a tendency to look people in the eye.",
    "prince_corven": "Heir to Allondo's throne, the swordsman the court expects. In private he is unmaking himself over a Brumal princess he cannot publicly love.",
    "didrich": "Allondo's second son, more comfortable in a herb garden than a war camp. His enlistment errands fool no one who watches him long enough.",
    "princess_penelope": "Brumal royal lady, trained in jewelry at Fata morgana when both kingdoms still believed the desert could be argued with. She writes letters she does not send.",
    "john_bean": "The boar-folk farmer whose phantom arm reached through a mirror and ended a war. Retired now, an ironwood prosthetic where the arm used to be, a quiet refusal to fight again.",
    "irna_bean": "John's daughter, mine-shackle still on her wrist by choice. Walked out of Clear Water alive, walked into Elmsfield half-dead. The prophecy belongs to her; the proclamation went to her brother.",
    "ron_bean": "John's son, conscripted on the strength of a prophecy meant for his sister. He has not opened the door to his family since.",
    "rhianna_linthrope": "White-mouse priestess of Allondo's court, the medic who fitted John Bean's ironwood arm in the field. Iron-lady on the surface, the kingdom's quiet conscience underneath.",
    "felix": "Raccoon scout, John's wartime companion. Slips into places the locks did not anticipate. Better at finding ways in than explaining how.",
    "father_elliot": "Abbot of Luchebert, formerly Allondo's crown prince before he renounced the throne. He carries the prophecy's true reading; he has not yet said it aloud.",
    "willow": "Old rabbit-folk granny, keeper of Felicia's true shrine. Climbs to the cave at dawn and at dusk with flowers and a candle. She is not the one to ask twice.",
    "diederik": "Owl-folk druid exiled from his order, elder of Elmsfield. Reads ironwood, weather, and the slow shape of a dying land. The town's stability is largely his quiet work.",
    "bridget": "Badger-folk innkeeper at the great ironwood. Trained navigator before she settled. Her slate at the bar runs two ledgers — drinking tabs and a wartime hoard, indexed in Badger trader-shorthand.",
    "wilfred": "Bridget's husband, the town's almost-blacksmith and mostly-farmer. Honest hands, fair prices, a workbench rather than a forge.",
    "farmer_joseph": "Raccoon-folk refugee who saw cholera take his neighbours after the war. Recently bought a plot from Hank. His fear is not malice; it is memory.",
    "hank": "Rabbit-folk farmer presenting masculine, runs an open-door orphanage at Elmsfield's edge. Druid and healer, both quietly. Both books on the shelf, neither announced.",
    "egbert": "Wolf-folk hunter who spends her days as someone smaller. Hank's partner. The concealment costs strength she cannot show; the truth costs a town she is not ready to lose.",
    "corne_dunham": "Badger-folk hill-guide of Elmsfield. Knows the route to Luchebert from the high ground, and will not lead anyone into Laurent's wreck for any price.",
    "ralph_overhill": "Young badger-folk animal-hand, more comfortable with horses than people. Will run with the mounts if a fight breaks out, and bring them back when it stops.",
    "pot_boy": "Knee-height pot-person, caretaker of the buried tower's mage-quarters for centuries beyond his maker. He cannot speak; he draws on dust and ash.",
    "furnace_pot_person": "The great pot at the buried tower's heart. The party walks through him to enter. A sentence from him takes a season to arrive.",
    "hermit_shaman": "Otter shaman who came to a stolen tower long after its first owner. Broke the blood-rite with a spirit that mimics an animal. Guards what the towers know.",
    "storm_mage": "The Lightning Tower's original mage, broken by centuries and by something that looked at him from a chaos-spirit's direction. Lucid for moments; wrong-headed in between.",
    "tod": "A chaos spirit wearing the body of a fox-folk boy who ignored the forbidden woods. Named himself \"fox\" after the body. He warps the world simply by not knowing how worlds work.",
    "brother_darrel": "Beaver-folk monk, formerly an Allondan sergeant. Renounced money and fighting, kept the staff. A stick is not a weapon if you call the practice discipline.",
    "eric_randell": "Fox-folk farmer with a flock of birds in his yard. Free-thinker on the surface; secretly a druid sent to watch Diederik.",
    "nadine": "Finch-folk trader from Raft city, face of a merchant group passing through. Carries the news the road has just heard, and fewer of her group's secrets than asked.",
    "master_darius": "Badger forge-master of World Edge. Stood up for Remi when the mayor would not. Fair-minded on his own ground; cannot be bought off it.",
    "remi": "Rat-folk factory worker expelled from World Edge after the order was rescinded. Carries Darius's letter of recommendation and not much else.",

    # Locations
    "scarlet_vale": "Capital of Allondo. Slate-roofed merchant streets spiral down to a riverside market under banners of forest green and iron grey. The training yards run in rotation behind the inner keep.",
    "blackwood_freehold": "A quiet agricultural valley where the Bean farm has stood through three wars. Barley and turnips, dry-stone walls, working oxen at the field edge.",
    "clear_water_mine": "Allondo's crown mining town on a treeless ridge. The mine itself is the prison; the shackle on a convict's wrist is a standing warning, not a restraint. Iron demand has run the shaft hard.",
    "chatter_creek": "Northern Allondan border town. A watch-outpost, a packed-earth road into the pines, the kind of crossing one knows about only if one has crossed before.",
    "rakeville": "A southern village on the trade road. Plaster-and-timber houses, an inn with a faded sign, the dust of summer caravans hanging in the air.",
    "cliffside_hold": "Capital of Brumal. White walls and slate roofs step up the cliff face to a high keep. From the upper terraces, one already sees the dust haze of an advancing desert.",
    "bockthicket": "A Brumal mining town set in dense hawthorn-and-blackthorn country. Dark timber buildings, a long ore-tip, the manner of a town hanging on rather than thriving.",
    "steadington": "A Brumal village swallowed by the southern desert. Roof-peaks and a chimney still rise from the dunes. Diederik's birthplace; a warning to the rest of Brumal.",
    "elmsfield": "An independent wilderness town built in a ring around a vast ancient ironwood. The trunk's hollow is the inn. Allondo's writ does not reach here; Diederik's quiet work keeps the chaos-spirit pressure away.",
    "great_swamp": "Misty wetlands surrounding a still lake. Six wizard towers ring the water; five were seized and moved here by old-order mages; one was already there. A bound air elemental shimmers above the surface; a crystalline fungus spreads from the shore.",
    "buried_tower": "One of the six wizard towers ringing the Lake of Tears, three-quarters under sand. The chimney vents fight the spreading fungus and lose ground each year. Two pot-people live within.",
    "volcano_tower": "A wizard's tower built in the shape of a small volcano. A bound fire elemental rages within its rim. Its shackle opens through befriending or through fury.",
    "darkness_tower": "A squat dark-stone tower whose entrance swallows light. A captive light elemental drains the life around it from beneath a great black basket. The walls are mosaic, only visible once it is freed.",
    "sinking_tower": "A pale tower floating on the lake. Climb it and it sinks; ride it down and you find the lower half — a sealed living space at the lakebed where a bound spirit waits.",
    "lightning_tower": "A metal-spiked tower hovering above the marsh, lightning arcing between its spurs. Its lever is the broken-minded mage who once owned it; bringing him aboard buys a single bout of clarity.",
    "gerhald_tower": "The original blood-tower the ring was built around. Gerhald, an otter shaman, broke its sacrificial curse. The last shackle opens only by his consent.",
    "laurents_city": "The wreckage of a flying castle that fell during the Rift, lying tilted in the hills east of the Lake of Tears. Laurent persists inside as a demi-lich. The walls are lined with wooden puppets that still answer to his hand.",
    "luchebert_monastery": "A small isolated monastery on a clifftop above a river bend, reached by a hidden vale and a switchback path. The maze garden is the entry route. The cave chapel below is Felicia's true shrine.",
    "linar_harbour": "Small independent east-coast harbour, the start of the inland trade road. The first town the overseas force took in the war; its fishers and dock workers are now largely descended from the soldiers who stayed.",
    "pirate_cove": "A hidden cove on the rocky south coast, beyond where any merchant will sail. Stranded overseas soldiers built it when going home meant going hungry. Past Linar harbour the stories all stop — the colleagues who went on did not come back. Nadine's friend Linnet is held inside.",
    "salmonswell": "An independent river city built on terraces above the Upwelling. Smoked-salmon trade, seasonal salmon runs, neutral ground between the kingdoms.",
    "fata_morgana": "A walled city deep in the southern desert. Famous for jewelry-craft and for limited but real protection against chaos-spirits. The desert's heart, where neither kingdom holds sway.",
    "gap_city": "Built into a steep mountain pass at the edge of the known world. South of the pass lie the shifting lands; the city is the last settlement before them. Knows things about that frontier neither kingdom admits.",
    "raft_city": "A river port deep in the great forest, every house built on a barge lashed to the next. Reached past the forbidden woods. Nadine's home when she is not on the road.",
    "world_edge": "A mining city at the foot of the northern volcanoes. Forges and ore-cart rails terraced into the slope. The Leatherman house's industrial base.",
    "rosepond": "A mining village near World Edge, named for its rose-thorn hedgerows. A still pond reflects the volcanoes' red glow each evening.",
    "haven": "The hidden settlement of the iron puppets, beside the western shifting lands. A slow community of humanoid wooden-and-metal constructs. Found only by their consent.",
    "lastwater": "The last reliable spring on the southern road, where caravans rest before the blasted lands or the desert. A stone well-head and a few mudbrick shelters.",
    "forbidden_woods": "A chaos-spirit forest north of the Lake of Tears. Trees bent into impossible curves, leaves the wrong colours for any season at once. Tod walks here; travellers do not.",
    "blasted_lands": "A vast hazardous region of cracked salt-flats and broken mage-era ruins. The portal at its centre still glows. The chaotic spirits originated here and migrate outward.",
    "southern_desert": "A continental band of dunes south of the blasted lands. Made hostile beyond natural by chaos-spirits migrated out from the lands' centre. Distinct from the shifting lands further south; Fata morgana endures inside it.",
    "coastal_mountains": "The eastern spine of the continent, hard to traverse in most stretches. The trade road uses one specific southern pass near Linar; the rest is for the patient and the foolhardy.",
    "worlds_end_volcanoes": "The most active northern volcanoes, glowing red against the cold sky. The source of World Edge's metals and its existence.",
    "portal": "A standing stone gateway at the centre of the blasted lands, built by the first humans. Glyphs still glow within the frame. The shamans' long plan would reopen it.",
    "white_city": "The ruin of the old mage civilisation's capital, broken stones half-buried in the salt-flats of the blasted lands. Enormous in scale even in collapse.",
    "thorgals_mirror": "A heavy ornate scrying mirror somewhere in a forest, the glass crazed with cracks. Thorgal's residue lingers within. An aspiring mage may bond with it.",

    # Dungeons — kept general; specifics are DM-discretion
    "generator": "A pre-rift mage laboratory at the centre of the white city, three levels cut into the ruin. The chaos has been building toward this place for centuries with whatever it could lay hands on.",
    "anchor": "One end of the Lethran Pair's paired chaos-management system. Buried intact under desert sand, sphinx-protected, untouched since the Rift.",
    "lethran_dwelling": "The home of one of the Lethran Pair, preserved by a small thousand-year-old working that has not stopped. A door slightly ajar, a lamp still burning. The human centre of the Pair arc.",
    "grain_mill": "A pre-rift mill on the broken-lands edge. It ground grain and cut stone-blanks for mage workings — the same blanks that ended up at the Anchor and the Generator. The wheel is silent now.",
    "press_house": "A ruined pre-rift vineyard hall on a high broken-lands ridge. Stone wine-vats above, a sealed regional supply-cache below. The cache has not been opened in centuries.",
    "ironwood_mill": "An ancient cutting-mill at the edge of the blasted lands, one of the very few ever capable of working ironwood. The cutter is still inside. The men who came here did not all leave whole.",
    "mirror_camp": "An abandoned overseas-forces forward camp in a hidden valley north of the Lake of Tears. The scrying mirror Thorgal used to command his commander still stands at the centre, cracked but not destroyed.",
    "tidehold": "A pre-rift sea-mage's cliff-tower built into the rock where the coastal mountains meet the ocean, half-claimed by the sea. Levels reached only at the right tide.",
    "moth_hollow": "The burial ground from Laurent's crash, set in a hollow among the hills. One of Felicia's own places; she stays here with the dead.",
    "family_crypt": "A badger family's mausoleum in a small Brumal hill town. Generations old at the surface, deeper than expected underneath. Something pre-rift was brought here that should not have been; the seal is broken.",
    "necropolis": "The Skull Gatherers' city of the dead, west of the blasted lands at the desert's edge. The order keeps mage-skulls here, bound and at rest. The destination of Laurent's last flight, if the party brokers the offer.",
}
XP_OVERRIDE = {
    # Lift specific cards above the default if their reveal is bigger.
    "LAURENT": 250,
    "FELICIA": 250,
    "THORGAL": 200,
    "NARISSA": 200,
    "TOD": 150,
    "THE POT-BOY": 150,
    "THE FURNACE (POT-PERSON)": 150,
    "THE GREAT SWAMP AND THE LAKE OF TEARS": 150,
    "LAURENT'S CRASHED FLYING CITY": 150,
    "THE PORTAL (INSIDE THE BLASTED LANDS)": 150,
}


# --- Parsing -------------------------------------------------------------

CARD_BLOCK_RE = re.compile(r"━+\n(.*?)\n━+", re.DOTALL)


def parse_cards(md_path: pathlib.Path):
    """Extract structured cards from a cards.md file."""
    text = md_path.read_text()
    cards = []
    for match in CARD_BLOCK_RE.finditer(text):
        body = match.group(1)
        lines = [ln.rstrip() for ln in body.split("\n")]
        # Strip leading two-space indent
        lines = [ln[2:] if ln.startswith("  ") else ln for ln in lines]
        # Drop empty leading/trailing
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()
        if not lines:
            continue
        name = lines[0].strip()

        # Collect "Label: text" sections + a free-form subtitle before any label
        subtitle_lines = []
        labels = {}
        cur_label = None
        for ln in lines[1:]:
            stripped = ln.strip()
            m = re.match(r"^([A-Z][A-Za-z' ]+?):\s*(.*)$", stripped)
            if m and m.group(1) in {
                "Role", "Type", "Position", "Teaches", "Earned by",
                "Known for", "Who's there",
            }:
                cur_label = m.group(1)
                labels[cur_label] = m.group(2).strip()
            elif cur_label is not None:
                # continuation of current label
                labels[cur_label] += " " + stripped
            else:
                subtitle_lines.append(stripped)
        subtitle = " ".join(subtitle_lines).strip()

        cards.append({
            "name": name,
            "subtitle": subtitle,
            "labels": labels,
        })
    return cards


# --- Drawing -------------------------------------------------------------

_IMAGE_CACHE: dict[pathlib.Path, ImageReader] = {}


def _load_image_for_print(path: pathlib.Path, target_w_pt: float,
                          target_h_pt: float, dpi: int = 400) -> ImageReader:
    """Resize image to print resolution and return as a reportlab ImageReader.

    Pipeline tuned for HP color laser printing of painterly card art:
      1. Multi-pass Lanczos (max 2x per step) preserves micro-detail.
      2. Light unsharp mask to recover edge crispness lost in the resample,
         compensating for the slight toner-spread on laser prints.
      3. Tiny saturation bump because laser toner sits on top of the paper
         and reads ~5-10% less saturated than the screen original.
      4. JPEG q=92 with subsampling=0 (full chroma) so the parchment hues
         and atmospheric backgrounds don't get muddied by 4:2:0 chroma.

    Cached so the same image isn't re-encoded for each draw call."""
    if path in _IMAGE_CACHE:
        return _IMAGE_CACHE[path]
    # 1 pt = 1/72 inch -> target px at given DPI
    target_w_px = int(target_w_pt * dpi / 72)
    target_h_px = int(target_h_pt * dpi / 72)
    img = Image.open(path).convert("RGB")

    # 1. Multi-pass downscale: halve repeatedly until we are within 2x of target
    while img.size[0] > target_w_px * 2 and img.size[1] > target_h_px * 2:
        img = img.resize(
            (img.size[0] // 2, img.size[1] // 2), Image.LANCZOS
        )
    # Final precise resample to target (preserving aspect via thumbnail)
    img.thumbnail((target_w_px, target_h_px), Image.LANCZOS)

    # 2. Recover crispness lost in the resample (laser-friendly)
    img = img.filter(
        ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=3)
    )

    # 3. Compensate for laser toner desaturation
    img = ImageEnhance.Color(img).enhance(1.08)

    # 4. Encode at high JPEG quality with full chroma
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92, optimize=True, subsampling=0)
    buf.seek(0)
    reader = ImageReader(buf)
    _IMAGE_CACHE[path] = reader
    return reader


def draw_card(c: rl_canvas.Canvas, x: float, y: float,
              card: dict, image_path: pathlib.Path | None,
              border_color, kind: str):
    """Draw one card with bottom-left at (x, y)."""
    # Outer card area + colored frame
    c.setStrokeColor(black)
    c.setFillColor(border_color)
    c.rect(x, y, CARD_W, CARD_H, fill=1, stroke=0)

    # Inner parchment
    inset = 1.5 * mm
    c.setFillColor(PARCHMENT)
    c.rect(x + inset, y + inset, CARD_W - 2 * inset, CARD_H - 2 * inset,
           fill=1, stroke=0)

    # Image area: top of card, full width minus inner padding
    img_x = x + 3 * mm
    img_y_top = y + CARD_H - 3 * mm
    img_h = 45 * mm  # generous image area
    img_w = CARD_W - 6 * mm
    img_y = img_y_top - img_h

    if image_path and image_path.exists():
        try:
            reader = _load_image_for_print(image_path, img_w, img_h)
            c.drawImage(reader, img_x, img_y, img_w, img_h,
                        preserveAspectRatio=True, anchor="c", mask="auto")
        except Exception as e:  # noqa: BLE001
            c.setFillColor(HexColor("#888888"))
            c.rect(img_x, img_y, img_w, img_h, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica", 6)
            c.drawString(img_x + 1 * mm, img_y + 1 * mm, f"image error: {e}")
    else:
        c.setFillColor(HexColor("#CCCCCC"))
        c.rect(img_x, img_y, img_w, img_h, fill=1, stroke=0)
        c.setFillColor(HexColor("#666666"))
        c.setFont("Helvetica", 6)
        c.drawCentredString(img_x + img_w / 2, img_y + img_h / 2,
                            "(art missing)")

    # --- Name strip ---
    name_y = img_y - 5 * mm
    c.setFillColor(border_color)
    c.rect(x + inset, name_y - 0.5 * mm, CARD_W - 2 * inset, 5 * mm,
           fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8.5)
    name = card["name"]
    if c.stringWidth(name, "Helvetica-Bold", 8.5) > CARD_W - 6 * mm:
        c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + CARD_W / 2, name_y + 1 * mm, name)

    # --- Subtitle (role/type) ---
    sub_y = name_y - 4 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Oblique", 6)
    subtitle = card.get("subtitle") or ""
    if subtitle:
        # wrap manually
        wrapped = wrap_text(subtitle, "Helvetica-Oblique", 6, CARD_W - 8 * mm, c)
        for i, line in enumerate(wrapped[:2]):
            c.drawCentredString(x + CARD_W / 2, sub_y - i * 2.6 * mm, line)
        sub_y -= len(wrapped[:2]) * 2.6 * mm

    # --- Body: flavour text -----------------------------------------------
    body_y = sub_y - 2 * mm
    body_x = x + 3 * mm
    body_w = CARD_W - 6 * mm

    slug = card.get("_slug")
    flavour = FLAVOR.get(slug) if slug else None
    if not flavour:
        # Fallback to whatever label fields existed; lets us see missing flavour
        flavour = card.get("labels", {}).get("Known for") \
            or card.get("labels", {}).get("Teaches") \
            or "—"

    # Auto-fit: try larger font first, fall back if it overflows
    body_bottom_min = y + 6 * mm  # leave room for footer
    fitted = None
    for font_size, line_h in [(7.0, 3.1 * mm), (6.5, 2.9 * mm),
                              (6.0, 2.7 * mm), (5.5, 2.5 * mm)]:
        wrapped = wrap_text(flavour, "Helvetica", font_size, body_w, c)
        if body_y - len(wrapped) * line_h >= body_bottom_min:
            fitted = (font_size, line_h, wrapped)
            break
    if fitted is None:
        # Worst case: use smallest size and truncate
        font_size, line_h = 5.5, 2.5 * mm
        wrapped = wrap_text(flavour, "Helvetica", font_size, body_w, c)
        max_lines = int((body_y - body_bottom_min) / line_h)
        wrapped = wrapped[:max_lines]
        fitted = (font_size, line_h, wrapped)

    font_size, line_h, wrapped = fitted
    c.setFillColor(INK)
    c.setFont("Helvetica", font_size)
    for line in wrapped:
        c.drawString(body_x, body_y, line)
        body_y -= line_h

    # --- Footer: kind tag only (XP is DM discretion at the table) ---
    footer_y = y + 2.5 * mm
    c.setFont("Helvetica-Oblique", 5.5)
    c.setFillColor(HexColor("#777777"))
    kind_label = "NPC" if kind == "npc" else "PLACE"
    c.drawRightString(x + CARD_W - 3 * mm, footer_y, kind_label)


def wrap_text(text: str, font_name: str, font_size: float,
              max_width: float, c: rl_canvas.Canvas):
    """Greedy word-wrap to fit max_width."""
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if c.stringWidth(candidate, font_name, font_size) <= max_width:
            cur = candidate
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# --- Layout --------------------------------------------------------------

def card_positions():
    """Yield (x, y) bottom-left coordinates for the next card slot, paginating."""
    cols = 3
    rows = 3
    grid_w = cols * CARD_W + (cols - 1) * GUTTER
    grid_h = rows * CARD_H + (rows - 1) * GUTTER
    margin_x = (PAGE_W - grid_w) / 2
    margin_y = (PAGE_H - grid_h) / 2
    while True:
        for row in range(rows):
            for col in range(cols):
                x = margin_x + col * (CARD_W + GUTTER)
                y = PAGE_H - margin_y - (row + 1) * CARD_H - row * GUTTER
                yield (x, y)


def draw_crop_marks(c: rl_canvas.Canvas, x: float, y: float):
    """Draw four small corner crop ticks just outside a card at (x,y)."""
    tick = 1.5 * mm
    gap = 0.6 * mm
    c.setStrokeColor(HexColor("#888888"))
    c.setLineWidth(0.25)
    # top-left
    c.line(x - tick - gap, y + CARD_H, x - gap, y + CARD_H)
    c.line(x, y + CARD_H + gap, x, y + CARD_H + gap + tick)
    # top-right
    c.line(x + CARD_W + gap, y + CARD_H, x + CARD_W + gap + tick, y + CARD_H)
    c.line(x + CARD_W, y + CARD_H + gap, x + CARD_W, y + CARD_H + gap + tick)
    # bottom-left
    c.line(x - tick - gap, y, x - gap, y)
    c.line(x, y - gap - tick, x, y - gap)
    # bottom-right
    c.line(x + CARD_W + gap, y, x + CARD_W + gap + tick, y)
    c.line(x + CARD_W, y - gap - tick, x + CARD_W, y - gap)


# --- Main ----------------------------------------------------------------

def main() -> None:
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)

    npc_cards = parse_cards(NPC_CARDS_MD)
    loc_cards = parse_cards(LOC_CARDS_MD)

    # Add the towers as synthesised location cards
    for t in EXTRA_TOWERS:
        loc_cards.append({
            "name": t["name"],
            "subtitle": t["type"],
            "labels": {
                "Known for": t["known_for"],
                "Who's there": t["whos_there"],
                "Earned by": t["earned_by"],
            },
            "_extra_slug": t["slug"],
        })

    print(f"Parsed {len(npc_cards)} NPC cards, {len(loc_cards)} location cards.")

    c = rl_canvas.Canvas(str(OUT_PDF), pagesize=A4)
    c.setTitle("Moros — NPC and Location Cards")
    c.setAuthor("Moros campaign")

    pos = card_positions()
    n_per_page = 9
    n_drawn = 0
    n_missing_img = 0

    def emit(card, image_dir: pathlib.Path, kind: str, border_color):
        nonlocal n_drawn, n_missing_img
        mapping = NPC_NAME_TO_SLUG if kind == "npc" else LOC_NAME_TO_SLUG
        # Case-insensitive lookup so file casing doesn't matter
        ci_mapping = {k.upper(): v for k, v in mapping.items()}
        slug = (card.get("_extra_slug")
                or ci_mapping.get(card["name"].upper()))
        image_path = (image_dir / f"{slug}.png") if slug else None
        if image_path is None or not image_path.exists():
            n_missing_img += 1
            print(f"  ! no image for {kind} {card['name']!r} (slug={slug})")
        card["_slug"] = slug  # for flavour-text lookup
        x, y = next(pos)
        draw_crop_marks(c, x, y)
        draw_card(c, x, y, card, image_path, border_color, kind)
        n_drawn += 1
        if n_drawn % n_per_page == 0:
            c.showPage()

    # NPCs first, then locations
    for card in npc_cards:
        emit(card, NPC_IMG_DIR, "npc", NPC_BORDER)
    for card in loc_cards:
        emit(card, LOC_IMG_DIR, "loc", LOC_BORDER)

    # Final page if last page wasn't full
    if n_drawn % n_per_page != 0:
        c.showPage()

    c.save()
    pages = (n_drawn + n_per_page - 1) // n_per_page
    print(f"\nWrote {OUT_PDF.relative_to(ROOT)} — "
          f"{n_drawn} cards across {pages} A4 pages "
          f"(MtG size {int(CARD_W/mm)}×{int(CARD_H/mm)} mm, 9 per page).")
    if n_missing_img:
        print(f"  warning: {n_missing_img} card(s) had no matching image.")


if __name__ == "__main__":
    main()
