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
    "THE DESERT (SHIFTING LANDS)": "southern_desert",
    "THE COASTAL MOUNTAIN RANGE": "coastal_mountains",
    "THE VOLCANOES OF WORLD'S END": "worlds_end_volcanoes",
    "THE PORTAL (INSIDE THE BLASTED LANDS)": "portal",
    "THE WHITE CITY (RUINED)": "white_city",
    "THORGAL'S MIRROR (IN A FOREST; LOCATION DM-": "thorgals_mirror",
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

    # --- Body text (labels) ---
    body_y = sub_y - 2 * mm
    body_x = x + 3 * mm
    body_w = CARD_W - 6 * mm

    # Label order priority: Type/Known for/Who's there/Earned by for locations,
    # Teaches/Earned by for NPCs.
    label_order = ["Known for", "Who's there", "Teaches", "Earned by"]
    fields = []
    for lbl in label_order:
        if lbl in card["labels"]:
            fields.append((lbl, card["labels"][lbl]))

    for lbl, text in fields:
        # Label
        c.setFont("Helvetica-Bold", 5.5)
        c.setFillColor(border_color)
        lbl_text = lbl + ":"
        c.drawString(body_x, body_y, lbl_text)
        lbl_w = c.stringWidth(lbl_text, "Helvetica-Bold", 5.5)
        c.setFillColor(INK)
        # First-line value
        c.setFont("Helvetica", 5.5)
        wrapped = wrap_text(text, "Helvetica", 5.5,
                            body_w - lbl_w - 1 * mm, c)
        if not wrapped:
            wrapped = [""]
        c.drawString(body_x + lbl_w + 1 * mm, body_y, wrapped[0])
        body_y -= 2.4 * mm
        for cont in wrapped[1:]:
            if body_y < y + 6 * mm:
                break
            c.drawString(body_x, body_y, cont)
            body_y -= 2.4 * mm
        body_y -= 0.6 * mm  # paragraph spacing

    # --- Footer: XP value + kind tag ---
    footer_y = y + 2.5 * mm
    xp = XP_OVERRIDE.get(card["name"], XP_NPC if kind == "npc" else XP_LOC)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(border_color)
    c.drawString(x + 3 * mm, footer_y, f"XP {xp}")
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
