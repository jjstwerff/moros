#!/usr/bin/env python3
"""Build a printable PDF of Moros's character-pool cards at MtG size (63×88 mm).

Card data sources (canonical):
  doc/claude/POWERS.md   — 37 power cards
  doc/claude/RULES.md    — 14 background cards (Backgrounds table)
  doc/claude/ITEMS.md    — 34 item cards (entries with *(Stat + Stat — special)*)
  doc/claude/CARDS.md    — visual layout

These are the *templates* for cards a character takes into their personal
pool. A character gains one card per power, background, or item they take
during progression. They are not the shared scenario deck — that lives in
moros_playcards.pdf.

Print one copy. Cut. When a player takes a power/background/item, hand them
the matching card from this template stock.

NOTE on background specials: RULES.md lists each background with a stat
pair but no special. The specials below are *proposed* one-word textures
chosen to fit each background's life-history feel. Edit BACKGROUND_CARDS
to change them.

Output:
  data/moros_character_cards.pdf — A4 sheets, 9 cards per page (3×3),
  MtG size, ready to cut and sleeve.

Usage:
  .venv-cards/bin/python3 tools/build_character_cards_pdf.py
"""

import io
import pathlib
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_PDF = ROOT / "data" / "moros_character_cards.pdf"
ICON_ROOT = ROOT / "html" / "icons" / "cards"

# Cinzel (OFL, Google Fonts) — Roman-inspired display serif for stats and band.
FONT_DIR = ROOT / "assets" / "fonts"
TITLE_FONT = "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("Cinzel", str(FONT_DIR / "Cinzel-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Cinzel-Bold", str(FONT_DIR / "Cinzel-Bold.ttf")))
    TITLE_FONT = "Cinzel-Bold"
except Exception:
    pass

# MtG card and page setup (matches the other card PDFs)
CARD_W = 63 * mm
CARD_H = 88 * mm
GUTTER = 4 * mm
PAGE_W, PAGE_H = A4

PARCHMENT = HexColor("#F4ECD8")
INK = HexColor("#2A2018")

# All character cards share a warm tone (CARDS.md §"Differentiating card types").
# The three sub-types differ only in the footer tag.
BORDER_CHARACTER = HexColor("#B88A4A")  # warm umber
BAND_POWER = HexColor("#8A5A2A")         # deepest — racial power
BAND_BACKGROUND = HexColor("#A66E3A")    # mid — life history
BAND_ITEM = HexColor("#C8964A")          # lightest — gear

# --- Card data -----------------------------------------------------------

# 37 powers. Order matches POWERS.md.
POWER_CARDS = [
    ("Adaptation",  "Will + Char",  "shadow step"),
    ("Balance",     "Dex + Will",   "tumble"),
    ("Blood",       "Will + Might", "regenerate"),
    ("Camp",        "Char + Endu",  "shielding"),
    ("Charge",      "Speed + Might", "prone"),
    ("Clan",        "Char + Will",  "shelter"),
    ("Claw",        "Might + Dex",  "sneak"),
    ("Climber",     "Dex + Might",  "reach"),
    ("Control",     "Endu + Perc",  "shape"),
    ("Digging",     "Endu + Might", "breaching"),
    ("Druid",       "Will + Might", "nature"),
    ("Flight",      "Speed + Dex",  "flying"),
    ("Fur",         "Endu + Dex",   "defense"),
    ("Hearing",     "Perc + Char",  "information"),
    ("Hide",        "Endu + Will",  "armor"),
    ("Hunter",      "Perc + Hand",  "catching"),
    ("Ingenuity",   "Hand + Will",  "improvise"),
    ("Jaws",        "Might + Endu", "grab"),
    ("Labyrinth",   "Perc + Will",  "navigate"),
    ("Lookout",     "Perc + Endu",  "guarding"),
    ("Magic",       "Will + Hand",  "elemental"),
    ("Musical",     "Char + Dex",   "atmosphere"),
    ("Night",       "Perc + Dex",   "stalk"),
    ("Nimble",      "Speed + Dex",  "dash"),
    ("Politics",    "Char + Perc",  "common cause"),
    ("Portage",     "Endu + Hand",  "travel"),
    ("Relaxed",     "Endu + Char",  "unwind"),
    ("Religion",    "Char + Will",  "bless"),
    ("Scolding",    "Might + Will", "taunt"),
    ("Scrounger",   "Hand + Perc",  "provisions"),
    ("Scurry",      "Dex + Perc",   "sneaking"),
    ("Shamanic",    "Will + Endu",  "binding"),
    ("Sleeper",     "Will + Endu",  "recover"),
    ("Sly",         "Char + Hand",  "trick"),
    ("Smell",       "Perc + Endu",  "tracking"),
    ("Swimmer",     "Dex + Endu",   "survival"),
    ("Travels",     "Speed + Perc", "scouting"),
]

# 14 backgrounds. Stats from RULES.md §Backgrounds; specials are proposed
# thematic words (see file docstring NOTE).
BACKGROUND_CARDS = [
    ("Noble",         "Char + Might", "command"),
    ("Farmer",        "Endu + Hand",  "harvest"),
    ("Scholar",       "Will + Perc",  "insight"),
    ("Watch",         "Perc + Might", "alert"),
    ("Crafter",       "Hand + Will",  "shape"),
    ("Monastery",     "Endu + Will",  "discipline"),
    ("Ascetic",       "Will + Char",  "stillness"),
    ("Trader",        "Char + Hand",  "deal"),
    ("Fisher",        "Endu + Perc",  "patience"),
    ("Circus troupe", "Speed + Dex",  "spectacle"),
    ("Back alley",    "Hand + Dex",   "concealment"),
    ("Hunter",        "Might + Dex",  "pursuit"),
    ("Miner",         "Endu + Might", "delve"),
    ("Army",          "Might + Endu", "rank"),
]

# 34 stat-bearing items. Order matches ITEMS.md (weapons → armor → mounts
# → gear → potions → jewelry).
ITEM_CARDS = [
    ("Sword",              "Might + Dex",  "parry"),
    ("Glave",              "Might + Endu", "stop"),
    ("Flail",              "Might + Endu", "stun"),
    ("Spear",              "Might + Speed", "intercept"),
    ("Staff",              "Dex + Speed",  "block"),
    ("Bow",                "Perc + Endu",  "cripple"),
    ("Crossbow",           "Perc + Hand",  "wound"),
    ("Sling",              "Perc + Dex",   "stun"),
    ("Dagger",             "Perc + Hand",  "sneaking"),
    ("Darts",              "Will + Perc",  "poison"),
    ("Whip",               "Dex + Will",   "steer"),
    ("Pickaxe",            "Endu + Will",  "breaching"),
    ("Armor",              "Might + Char", "imposing"),
    ("Breastplate",        "Might + Will", "defend"),
    ("Leather",            "Speed + Dex",  "armor"),
    ("Shield",             "Dex + Endu",   "block"),
    ("Horse",              "Speed + Endu", "travel"),
    ("Donkey",             "Endu + Will",  "stubborn"),
    ("Dog",                "Perc + Char",  "tracking"),
    ("Falcon",             "Char + Perc",  "search"),
    ("Cart",               "Endu + Hand",  "steady"),
    ("Backpack",           "Endu + Speed", "carry"),
    ("Tools",              "Hand + Will",  "craft"),
    ("Fishing net",        "Perc + Will",  "restrict"),
    ("Knife",              "Dex + Hand",   "cut"),
    ("Potion",             "Will + Endu",  "restore"),
    ("Refreshment potion", "Will + Char",  "refresh"),
    ("Rage potion",        "Might + Will", "surge"),
    ("Effect potion",      "Will + Char",  "channel"),
    ("Bandages",           "Hand + Endu",  "bind"),
    ("Ring",               "Will + Char",  "ward"),
    ("Bracelet",           "Dex + Speed",  "quicken"),
    ("Earring",            "Perc + Char",  "attune"),
    ("Medallion",          "Will + Might", "authority"),
]


# --- Drawing -------------------------------------------------------------

_ICON_CACHE: dict[pathlib.Path, ImageReader] = {}
WATERMARK_ALPHA = 0.22


def slugify(name: str) -> str:
    return name.lower().replace(" ", "_")


def load_watermark(icon_path: pathlib.Path, target_w_pt: float, target_h_pt: float) -> ImageReader | None:
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


def draw_watermark(c, x, y, name: str, subset: str):
    """subset must be 'elements' | 'powers' | 'items'. Backgrounds get no icon."""
    if subset is None:
        return
    icon_path = ICON_ROOT / subset / f"{slugify(name)}.png"
    border_inset = 1.5 * mm
    safe_pad_x = 4 * mm
    safe_pad_y = 2 * mm
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


def draw_top_band(c, x, y, color, label):
    """Wide top band with the card's name centred in white-on-color."""
    inset = 1.5 * mm
    band_h = 9 * mm
    band_y = y + CARD_H - inset - band_h
    c.setFillColor(color)
    c.rect(x + inset, band_y, CARD_W - 2 * inset, band_h, fill=1, stroke=0)
    c.setFillColor(white)
    font_size = 11
    while c.stringWidth(label, TITLE_FONT, font_size) > CARD_W - 6 * mm and font_size > 6.5:
        font_size -= 0.5
    c.setFont(TITLE_FONT, font_size)
    c.drawCentredString(x + CARD_W / 2, band_y + band_h / 2 - font_size * 0.35,
                        label.upper())


def draw_stats(c, x, y, stats: str):
    """Two-stat line — large, centred, the most important read on the card."""
    cx = x + CARD_W / 2
    cy = y + CARD_H / 2 + 4 * mm
    c.setFillColor(INK)
    font_size = 22
    while c.stringWidth(stats.upper(), TITLE_FONT, font_size) > CARD_W - 8 * mm and font_size > 12:
        font_size -= 1
    c.setFont(TITLE_FONT, font_size)
    c.drawCentredString(cx, cy, stats.upper())


def draw_special(c, x, y, special: str):
    """Below stats: italic special."""
    c.setFillColor(INK)
    font_size = 11
    while c.stringWidth(special.lower(), "Helvetica-Oblique", font_size) > CARD_W - 8 * mm and font_size > 8:
        font_size -= 0.5
    c.setFont("Helvetica-Oblique", font_size)
    c.drawCentredString(x + CARD_W / 2, y + CARD_H / 2 - 4 * mm,
                        special.lower())


def draw_footer(c, x, y, type_label: str, type_color):
    """Centred type tag at the card foot."""
    fy = y + 3 * mm
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(type_color)
    c.drawCentredString(x + CARD_W / 2, fy, type_label.upper())


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

CARDS_PER_PAGE = 9


def card_xy(slot_index: int):
    """Return (x, y) for the slot-th card on a page. Slot 0 is top-left."""
    cols = 3
    rows = 3
    grid_w = cols * CARD_W + (cols - 1) * GUTTER
    grid_h = rows * CARD_H + (rows - 1) * GUTTER
    margin_x = (PAGE_W - grid_w) / 2
    margin_y = (PAGE_H - grid_h) / 2
    row = slot_index // cols
    col = slot_index % cols
    x = margin_x + col * (CARD_W + GUTTER)
    y = PAGE_H - margin_y - (row + 1) * CARD_H - row * GUTTER
    return x, y


# --- Renderers -----------------------------------------------------------

def render_card(c, x, y, name: str, stats: str, special: str,
                band_color, type_label: str, icon_subset: str | None):
    draw_card_frame(c, x, y, BORDER_CHARACTER)
    if icon_subset is not None:
        draw_watermark(c, x, y, name, subset=icon_subset)
    draw_top_band(c, x, y, band_color, name)
    draw_stats(c, x, y, stats)
    draw_special(c, x, y, special)
    draw_footer(c, x, y, type_label, band_color)


# --- Main ----------------------------------------------------------------

def main() -> None:
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    c = rl_canvas.Canvas(str(OUT_PDF), pagesize=A4)
    c.setTitle("Moros — Character-Pool Cards")
    c.setAuthor("Moros campaign")

    sections = [
        ("Power",      POWER_CARDS,      BAND_POWER,      "powers"),
        ("Background", BACKGROUND_CARDS, BAND_BACKGROUND, "backgrounds"),
        ("Item",       ITEM_CARDS,       BAND_ITEM,       "items"),
    ]

    total = 0
    pages = 0

    for type_label, cards, band_color, icon_subset in sections:
        slot = 0
        for name, stats, special in cards:
            if slot == 0:
                pages += 1
            x, y = card_xy(slot)
            draw_crop_marks(c, x, y)
            render_card(c, x, y, name, stats, special, band_color,
                        type_label, icon_subset)
            total += 1
            slot += 1
            if slot == CARDS_PER_PAGE:
                c.showPage()
                slot = 0
        if slot != 0:
            c.showPage()

    c.save()
    print(f"Wrote {OUT_PDF.relative_to(ROOT)} — "
          f"{total} cards across {pages} A4 pages "
          f"({len(POWER_CARDS)} power, "
          f"{len(BACKGROUND_CARDS)} background, "
          f"{len(ITEM_CARDS)} item).")


if __name__ == "__main__":
    main()
