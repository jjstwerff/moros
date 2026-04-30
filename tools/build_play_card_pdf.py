#!/usr/bin/env python3
"""Build a printable PDF of Moros's playing-card deck at MtG size (63×88 mm).

Card data sources (canonical):
  doc/claude/RULES.md  §"The Card Deck", §"Scenario Cards", §"Discovery Cards"
  doc/claude/CARDS.md  for visual layout (stats large + centred; element name;
                       texture line; type-coloured border; source footer).

Output:
  data/moros_playcards.pdf — A4 sheets, 9 cards per page (3×3), MtG size,
  ready to cut and sleeve.

This deck is the in-game shared deck (base + scenario + sample discovery).
Character cards are generated from a character's powers/backgrounds/items
and live in their own per-character print at character-creation time;
they are NOT in this deck PDF.

Usage:
  .venv-cards/bin/python3 tools/build_play_card_pdf.py
"""

import io
import pathlib
from PIL import Image, ImageEnhance, ImageFilter
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_PDF = ROOT / "data" / "moros_playcards.pdf"
ICON_DIR_ELEMENTS = ROOT / "html" / "icons" / "cards" / "elements"

# Cinzel (OFL, Google Fonts) — Roman-inspired display serif, used for stat
# titles and card name bands. Falls back to Helvetica-Bold if files missing.
FONT_DIR = ROOT / "assets" / "fonts"
TITLE_FONT = "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("Cinzel", str(FONT_DIR / "Cinzel-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Cinzel-Bold", str(FONT_DIR / "Cinzel-Bold.ttf")))
    TITLE_FONT = "Cinzel-Bold"
except Exception:
    pass

# MtG card and page setup (matches the NPC/location PDF)
CARD_W = 63 * mm
CARD_H = 88 * mm
GUTTER = 4 * mm
PAGE_W, PAGE_H = A4

PARCHMENT = HexColor("#F4ECD8")
INK = HexColor("#2A2018")

# Border colours per card type
BORDER_BASE = HexColor("#B0A480")        # neutral cream — base cards
BORDER_DISCOVERY = HexColor("#C8A03A")   # gold — discovery cards

# Per-scenario border colours (each scenario distinct)
SCENARIO_BORDER = {
    "Combat":      HexColor("#A03030"),  # deep red
    "Stealth":     HexColor("#3A3A6A"),  # dark indigo
    "Negotiation": HexColor("#A8893A"),  # warm gold
    "Exploration": HexColor("#3A7A4A"),  # forest green
    "Travel":      HexColor("#8A6A4A"),  # tan
    "Camp":        HexColor("#C66B30"),  # warm orange
    "Market":      HexColor("#7A4A8A"),  # purple
    "Forage":      HexColor("#7A8A3A"),  # olive
}

# Per-element accent colour for the top band of a base card
ELEMENT_BAND = {
    "Flame":   HexColor("#C04030"),
    "Water":   HexColor("#3070A0"),
    "Wind":    HexColor("#90A0B0"),
    "Plants":  HexColor("#4A8040"),
    "Iron":    HexColor("#605860"),
    "Earth":   HexColor("#7A6040"),
    "Light":   HexColor("#C8A050"),
    "Dark":    HexColor("#3A2A4A"),
    "Blood":   HexColor("#8A2030"),
    "Storm":   HexColor("#4A5080"),
    "Shadow":  HexColor("#5A4A6A"),
    "Ruin":    HexColor("#6A5A30"),
}

# Texture words (one-word feel-reminders) for each base element.
# Drawn from the challenge-texture register described in RULES.md.
ELEMENT_TEXTURE = {
    "Flame":  "urgency",
    "Water":  "flow",
    "Wind":   "freedom",
    "Plants": "growth",
    "Iron":   "resolve",
    "Earth":  "endurance",
    "Light":  "clarity",
    "Dark":   "hidden",
    "Blood":  "desperation",
    "Storm":  "overwhelm",
    "Shadow": "misdirection",
    "Ruin":   "erosion",
}

# --- Card data (from RULES.md) -------------------------------------------

BASE_CARDS = [
    # (name, stats, special)
    ("Flame",  "Might + Dex",   "fire"),
    ("Water",  "Dex + Speed",   "water"),
    ("Wind",   "Char + Speed",  "air"),
    ("Plants", "Hand + Char",   "wood"),
    ("Iron",   "Might + Will",  "iron"),
    ("Earth",  "Endu + Hand",   "stone"),
    ("Light",  "Perc + Will",   "light"),
    ("Dark",   "Perc + Endu",   "dark"),
    ("Blood",  "Might + Will",  "life"),
    ("Storm",  "Speed + Endu",  "surge"),
    ("Shadow", "Dex + Char",    "veil"),
    ("Ruin",   "Perc + Hand",   "decay"),
]

# Three scenario cards per scenario. Each card: stats, special.
SCENARIO_CARDS = {
    "Combat":      [("Might + Speed", "surge"), ("Might + Endu", "iron"),  ("Dex + Will", "veil")],
    "Stealth":     [("Dex + Speed",   "veil"),  ("Perc + Will", "dark"),   ("Char + Dex", "air")],
    "Negotiation": [("Char + Will",   "life"),  ("Perc + Char", "light"),  ("Will + Hand", "veil")],
    "Exploration": [("Perc + Hand",   "stone"), ("Endu + Will", "decay"),  ("Dex + Perc", "dark")],
    "Travel":      [("Speed + Endu",  "surge"), ("Perc + Speed", "air"),   ("Char + Endu", "life")],
    "Camp":        [("Endu + Will",   "stone"), ("Char + Endu", "life"),   ("Will + Perc", "dark")],
    "Market":      [("Char + Hand",   "wood"),  ("Perc + Char", "veil"),   ("Will + Char", "light")],
    "Forage":      [("Perc + Endu",   "wood"),  ("Hand + Will", "decay"),  ("Dex + Perc", "dark")],
}

DISCOVERY_CARDS = [
    # (name, stats, special, what-it-represents)
    ("The Scar",  "Might + Will", "wound",   "Surviving something that leaves a permanent mark"),
    ("The Name",  "Char + Perc",  "truth",   "Learning who someone truly is"),
    ("The Pact",  "Will + Hand",  "binding", "Witnessing or entering a secret agreement"),
    ("The Depth", "Endu + Perc",  "void",    "Enduring something that should have destroyed the character"),
]


# --- Drawing -------------------------------------------------------------

# Cache so the same watermark isn't re-encoded for every card
_ICON_CACHE: dict[pathlib.Path, ImageReader] = {}

# Watermark blend ratio: how much of the icon shows through the parchment.
# 0.0 = pure parchment (icon invisible), 1.0 = full icon. 0.22 reads as a
# faint motif behind the stats without competing for attention.
WATERMARK_ALPHA = 0.22


def load_watermark(icon_path: pathlib.Path, target_w_pt: float, target_h_pt: float) -> ImageReader | None:
    """Open an icon, blend it with parchment so it reads as a faint watermark,
    and return as a reportlab ImageReader. Returns None if the file is missing."""
    if not icon_path.exists():
        return None
    if icon_path in _ICON_CACHE:
        return _ICON_CACHE[icon_path]
    target_w_px = max(1, int(target_w_pt / 72 * 300))
    target_h_px = max(1, int(target_h_pt / 72 * 300))
    img = Image.open(icon_path).convert("RGB")
    # Center-crop 15% from each edge — removes Flux's ornamental frames
    # and any hallucinated text/marks along the borders.
    w, h = img.size
    pad_w, pad_h = int(w * 0.15), int(h * 0.15)
    img = img.crop((pad_w, pad_h, w - pad_w, h - pad_h))
    # Auto-trim to the bounding box of the actual subject (dark pixels),
    # so off-centre compositions are recentred when drawn on the card.
    gray = img.convert("L")
    mask = gray.point(lambda v: 255 if v < 200 else 0)
    bbox = mask.getbbox()
    if bbox is not None:
        # Pad the bbox 18% so tall subjects don't hit the watermark edge.
        bx0, by0, bx1, by1 = bbox
        bw, bh = img.size
        margin_x = int((bx1 - bx0) * 0.18)
        margin_y = int((by1 - by0) * 0.18)
        bx0 = max(0, bx0 - margin_x)
        by0 = max(0, by0 - margin_y)
        bx1 = min(bw, bx1 + margin_x)
        by1 = min(bh, by1 + margin_y)
        img = img.crop((bx0, by0, bx1, by1))
    while img.size[0] > target_w_px * 2 and img.size[1] > target_h_px * 2:
        img = img.resize((img.size[0] // 2, img.size[1] // 2), Image.LANCZOS)
    img.thumbnail((target_w_px, target_h_px), Image.LANCZOS)
    parchment = Image.new("RGB", img.size, (244, 236, 216))
    img = Image.blend(parchment, img, alpha=WATERMARK_ALPHA)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88, optimize=True)
    buf.seek(0)
    reader = ImageReader(buf)
    _ICON_CACHE[icon_path] = reader
    return reader


def draw_watermark(c, x, y, slug: str, subset: str = "elements"):
    """Draw a faded motif behind the stats, kept well inside the parchment so
    Flux's decorative frames don't merge with the card's coloured border."""
    icon_path = ROOT / "html" / "icons" / "cards" / subset / f"{slug}.png"
    border_inset = 1.5 * mm   # the coloured card border thickness
    safe_pad_x = 4 * mm       # extra horizontal margin inside the parchment
    safe_pad_y = 2 * mm       # extra vertical margin inside the parchment
    band_h = 9 * mm
    footer_h = 6 * mm
    wm_x = x + border_inset + safe_pad_x
    wm_y = y + border_inset + footer_h + safe_pad_y
    wm_w = CARD_W - 2 * (border_inset + safe_pad_x)
    wm_h = CARD_H - 2 * border_inset - band_h - footer_h - 2 * safe_pad_y
    reader = load_watermark(icon_path, wm_w, wm_h)
    if reader is not None:
        c.drawImage(reader, wm_x, wm_y, wm_w, wm_h,
                    preserveAspectRatio=True, anchor='c', mask='auto')


def draw_card_frame(c, x, y, border_color):
    """Coloured border + parchment inner."""
    c.setFillColor(border_color)
    c.rect(x, y, CARD_W, CARD_H, fill=1, stroke=0)
    inset = 1.5 * mm
    c.setFillColor(PARCHMENT)
    c.rect(x + inset, y + inset, CARD_W - 2 * inset, CARD_H - 2 * inset,
           fill=1, stroke=0)


def draw_top_band(c, x, y, color, label, label_color=white):
    """Wide top band with the card's headline label centred in white-on-color."""
    inset = 1.5 * mm
    band_h = 9 * mm
    band_y = y + CARD_H - inset - band_h
    c.setFillColor(color)
    c.rect(x + inset, band_y, CARD_W - 2 * inset, band_h, fill=1, stroke=0)
    c.setFillColor(label_color)
    font_size = 11
    while c.stringWidth(label, TITLE_FONT, font_size) > CARD_W - 6 * mm and font_size > 7:
        font_size -= 0.5
    c.setFont(TITLE_FONT, font_size)
    c.drawCentredString(x + CARD_W / 2, band_y + band_h / 2 - font_size * 0.35,
                        label.upper())


def draw_stats(c, x, y, stats: str):
    """The two-stat line — large, centred, the most important read on the card."""
    cx = x + CARD_W / 2
    cy = y + CARD_H / 2 + 4 * mm
    c.setFillColor(INK)
    font_size = 22
    while c.stringWidth(stats.upper(), TITLE_FONT, font_size) > CARD_W - 8 * mm and font_size > 12:
        font_size -= 1
    c.setFont(TITLE_FONT, font_size)
    c.drawCentredString(cx, cy, stats.upper())


def draw_special(c, x, y, special: str, color=INK):
    """Below stats: small italic special / texture line."""
    c.setFillColor(color)
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H / 2 - 4 * mm,
                        special.lower())


def draw_texture(c, x, y, texture: str, color=HexColor("#777777")):
    """Smaller mnemonic texture (only on base cards; below the special)."""
    c.setFillColor(color)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H / 2 - 9 * mm,
                        f"— {texture} —")


def draw_footer(c, x, y, source: str | None, type_label: str, type_color):
    """Source on left, type tag on right at the card foot."""
    fy = y + 3 * mm
    if source:
        c.setFont("Helvetica-Oblique", 7)
        c.setFillColor(INK)
        c.drawString(x + 3 * mm, fy, source)
    c.setFont("Helvetica-Bold", 6)
    c.setFillColor(type_color)
    c.drawRightString(x + CARD_W - 3 * mm, fy, type_label.upper())


def draw_crop_marks(c, x, y):
    tick = 1.5 * mm
    gap = 0.6 * mm
    c.setStrokeColor(HexColor("#888888"))
    c.setLineWidth(0.25)
    c.line(x - tick - gap, y + CARD_H, x - gap, y + CARD_H)
    c.line(x, y + CARD_H + gap, x, y + CARD_H + gap + tick)
    c.line(x + CARD_W + gap, y + CARD_H, x + CARD_W + gap + tick, y + CARD_H)
    c.line(x + CARD_W, y + CARD_H + gap, x + CARD_W, y + CARD_H + gap + tick)
    c.line(x - tick - gap, y, x - gap, y)
    c.line(x, y - gap - tick, x, y - gap)
    c.line(x + CARD_W + gap, y, x + CARD_W + gap + tick, y)
    c.line(x + CARD_W, y - gap - tick, x + CARD_W, y - gap)


# --- Layout --------------------------------------------------------------

def card_positions():
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


# --- Main ----------------------------------------------------------------

def render_base(c, x, y, name: str, stats: str, special: str):
    draw_card_frame(c, x, y, BORDER_BASE)
    draw_watermark(c, x, y, name.lower(), subset="elements")
    draw_top_band(c, x, y, ELEMENT_BAND[name], name)
    draw_stats(c, x, y, stats)
    draw_special(c, x, y, special)
    draw_texture(c, x, y, ELEMENT_TEXTURE[name])
    draw_footer(c, x, y, source=None, type_label="Base", type_color=BORDER_BASE)


def render_scenario(c, x, y, scenario: str, stats: str, special: str):
    color = SCENARIO_BORDER[scenario]
    draw_card_frame(c, x, y, color)
    draw_top_band(c, x, y, color, special)
    draw_stats(c, x, y, stats)
    # No mid-card texture line for scenario cards — the special IS the texture
    draw_footer(c, x, y, source=f"{scenario} scenario", type_label="Scenario",
                type_color=color)


def render_discovery(c, x, y, name: str, stats: str, special: str, blurb: str):
    draw_card_frame(c, x, y, BORDER_DISCOVERY)
    draw_top_band(c, x, y, BORDER_DISCOVERY, name, label_color=HexColor("#3A2A18"))
    draw_stats(c, x, y, stats)
    draw_special(c, x, y, special)
    # Tiny italic blurb below
    c.setFillColor(HexColor("#5A4A30"))
    c.setFont("Helvetica-Oblique", 6.5)
    # Wrap blurb across up to 2 lines
    wrapped = _wrap(c, blurb, "Helvetica-Oblique", 6.5, CARD_W - 8 * mm)
    by = y + CARD_H / 2 - 14 * mm
    for line in wrapped[:2]:
        c.drawCentredString(x + CARD_W / 2, by, line)
        by -= 2.6 * mm
    draw_footer(c, x, y, source=None, type_label="Discovery",
                type_color=HexColor("#9A7A20"))


def _wrap(c, text, font, size, max_w):
    words = text.split()
    out, cur = [], ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if c.stringWidth(candidate, font, size) <= max_w:
            cur = candidate
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def main() -> None:
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    c = rl_canvas.Canvas(str(OUT_PDF), pagesize=A4)
    c.setTitle("Moros — Playing Card Deck")
    c.setAuthor("Moros campaign")

    pos = card_positions()
    n_per_page = 9
    n_drawn = 0

    def slot():
        nonlocal n_drawn
        x, y = next(pos)
        draw_crop_marks(c, x, y)
        n_drawn += 1
        if n_drawn % n_per_page == 0:
            # We page-break AFTER drawing the 9th card, below.
            pass
        return x, y

    # Base cards (12)
    for name, stats, special in BASE_CARDS:
        x, y = slot()
        render_base(c, x, y, name, stats, special)
        if n_drawn % n_per_page == 0:
            c.showPage()

    # Scenario cards (24, grouped by scenario)
    for scenario, cards in SCENARIO_CARDS.items():
        for stats, special in cards:
            x, y = slot()
            render_scenario(c, x, y, scenario, stats, special)
            if n_drawn % n_per_page == 0:
                c.showPage()

    # Discovery cards (4 sample)
    for name, stats, special, blurb in DISCOVERY_CARDS:
        x, y = slot()
        render_discovery(c, x, y, name, stats, special, blurb)
        if n_drawn % n_per_page == 0:
            c.showPage()

    if n_drawn % n_per_page != 0:
        c.showPage()

    c.save()
    pages = (n_drawn + n_per_page - 1) // n_per_page
    print(f"Wrote {OUT_PDF.relative_to(ROOT)} — "
          f"{n_drawn} cards across {pages} A4 pages "
          f"({len(BASE_CARDS)} base, "
          f"{sum(len(v) for v in SCENARIO_CARDS.values())} scenario, "
          f"{len(DISCOVERY_CARDS)} discovery sample).")


if __name__ == "__main__":
    main()
