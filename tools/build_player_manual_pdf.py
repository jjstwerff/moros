#!/usr/bin/env python3
"""Build the Moros Player Manual PDF.

Reads:
  data/player_manual.json    — curated section structure and player-safe prose
  html/data.js               — DATA tables (via node subprocess)
  html/icons/cards/...       — element / background / power / item icons
  html/icons/places/...      — place art for the 17 canonical origins
  html/icons/npcs/...        — two player-safe NPC images (Bridget, mouse_traveller)

Writes:
  data/moros_player_manual.pdf — A4 player manual

Usage:
  .venv-cards/bin/python3 tools/build_player_manual_pdf.py
"""

import io
import json
import pathlib
import re
import subprocess
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = ROOT / "data" / "player_manual.json"
DATA_JS = ROOT / "html" / "data.js"
OUT_PDF = ROOT / "data" / "moros_player_manual.pdf"

# ── Fonts ────────────────────────────────────────────────────────────────
FONT_DIR = ROOT / "assets" / "fonts"
TITLE_FONT = "Helvetica-Bold"
BODY_FONT = "Helvetica"
ITALIC_FONT = "Helvetica-Oblique"
try:
    pdfmetrics.registerFont(TTFont("Cinzel", str(FONT_DIR / "Cinzel-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("CinzelBold", str(FONT_DIR / "Cinzel-Bold.ttf")))
    TITLE_FONT = "CinzelBold"
except Exception:
    pass

# ── Colours ──────────────────────────────────────────────────────────────
INK = HexColor("#1a1a1a")
ACCENT = HexColor("#7a3a1a")  # warm brown
MUTED = HexColor("#5a5a5a")
PAGE_RULE = HexColor("#a87a4a")

# ── Page dims ────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
COL_W = PAGE_W - 2 * MARGIN

# ── Styles ───────────────────────────────────────────────────────────────
SS = getSampleStyleSheet()


def style(name, **kw):
    base = kw.pop("parent", SS["BodyText"])
    return ParagraphStyle(name, parent=base, **kw)


COVER_TITLE = style(
    "CoverTitle",
    fontName=TITLE_FONT, fontSize=84, leading=92,
    alignment=TA_CENTER, textColor=INK, spaceAfter=10,
)
COVER_SUB = style(
    "CoverSub",
    fontName=TITLE_FONT, fontSize=24, leading=30,
    alignment=TA_CENTER, textColor=ACCENT, spaceAfter=30,
)
COVER_TAG = style(
    "CoverTag",
    fontName=ITALIC_FONT, fontSize=14, leading=20,
    alignment=TA_CENTER, textColor=INK, spaceAfter=24,
)
COVER_BLOCK = style(
    "CoverBlock",
    fontName=BODY_FONT, fontSize=11, leading=17,
    alignment=TA_CENTER, textColor=INK, spaceAfter=12,
)
H1 = style(
    "H1",
    fontName=TITLE_FONT, fontSize=22, leading=28,
    alignment=TA_LEFT, textColor=INK, spaceBefore=0, spaceAfter=10,
)
H2 = style(
    "H2",
    fontName=TITLE_FONT, fontSize=15, leading=20,
    textColor=ACCENT, spaceBefore=14, spaceAfter=4,
)
H3 = style(
    "H3",
    fontName=TITLE_FONT, fontSize=11, leading=14,
    textColor=INK, spaceBefore=8, spaceAfter=2,
)
INTRO = style(
    "Intro",
    fontName=ITALIC_FONT, fontSize=10.5, leading=15,
    textColor=INK, spaceAfter=10, alignment=TA_JUSTIFY,
)
BODY = style(
    "Body",
    fontName=BODY_FONT, fontSize=10, leading=14,
    textColor=INK, spaceAfter=6, alignment=TA_JUSTIFY,
)
INLINE = style(
    "Inline",
    fontName=BODY_FONT, fontSize=10, leading=14,
    textColor=INK, spaceAfter=2, alignment=TA_LEFT,
)
SMALL = style(
    "Small",
    fontName=BODY_FONT, fontSize=8.5, leading=11,
    textColor=MUTED, spaceAfter=4, alignment=TA_LEFT,
)
CAPTION = style(
    "Caption",
    fontName=ITALIC_FONT, fontSize=8.5, leading=11,
    textColor=MUTED, alignment=TA_CENTER,
)


# ── Helpers ──────────────────────────────────────────────────────────────
def get_data():
    """Dump DATA from html/data.js by invoking node."""
    script = (
        "import('./html/data.js').then(m => "
        "process.stdout.write(JSON.stringify(m.DATA)))"
    )
    out = subprocess.check_output(
        ["node", "--input-type=module", "-e", script], cwd=str(ROOT)
    )
    return json.loads(out)


def md_to_html(s):
    """Tiny markdown converter for **bold** and *italic*. ReportLab Paragraph
    accepts XML-ish markup like <b>, <i>, <br/>."""
    if not isinstance(s, str):
        return s
    # **bold** first so * inside doesn't conflict
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<i>\1</i>", s)
    return s


def slug(s):
    return s.lower().replace(" ", "_").replace("'", "")


# Place names occasionally need bespoke slugging (Clear water → clear_water_mine)
PLACE_SLUG_OVERRIDES = {
    "Clear water": "clear_water_mine",
}


def slug_for_place(name):
    if name in PLACE_SLUG_OVERRIDES:
        return PLACE_SLUG_OVERRIDES[name]
    return slug(name)


_THUMB_CACHE = {}


def safe_image(path_or_str, width, target_dpi=180):
    """Try to load an image, return Image flowable scaled to width with
    proportional height. Resamples large source images down to roughly
    `target_dpi` at the rendered width — keeps the PDF file size down.
    Returns None on failure."""
    try:
        p = pathlib.Path(path_or_str)
        if not p.is_absolute():
            p = ROOT / path_or_str
        if not p.exists():
            return None
        # Compute target pixel width at rendered size + DPI
        target_px = int(width / mm * (target_dpi / 25.4))  # mm → inch → px
        cache_key = (str(p), target_px)
        if cache_key in _THUMB_CACHE:
            buf_path = _THUMB_CACHE[cache_key]
        else:
            from PIL import Image as PILImage

            with PILImage.open(p) as im:
                if im.width > target_px:
                    ratio = target_px / im.width
                    new_size = (target_px, max(1, int(im.height * ratio)))
                    thumb = im.convert("RGB").resize(new_size, PILImage.LANCZOS)
                    out = io.BytesIO()
                    thumb.save(out, format="JPEG", quality=82, optimize=True)
                    out.seek(0)
                    buf_path = out
                else:
                    buf_path = str(p)
            _THUMB_CACHE[cache_key] = buf_path
        # Determine display size
        if isinstance(buf_path, str):
            from reportlab.lib.utils import ImageReader

            ir = ImageReader(buf_path)
            iw, ih = ir.getSize()
            h = width * ih / iw
            return Image(buf_path, width=width, height=h)
        else:
            buf_path.seek(0)
            from reportlab.lib.utils import ImageReader

            ir = ImageReader(buf_path)
            iw, ih = ir.getSize()
            h = width * ih / iw
            buf_path.seek(0)
            return Image(buf_path, width=width, height=h)
    except Exception:
        return None


# ── Page decoration ──────────────────────────────────────────────────────
def draw_chrome(canvas, doc):
    canvas.saveState()
    # Top rule
    canvas.setStrokeColor(PAGE_RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 12 * mm, PAGE_W - MARGIN, PAGE_H - 12 * mm)
    # Title in header
    canvas.setFont(TITLE_FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, PAGE_H - 9 * mm, "Moros — Player Manual")
    # Page number footer
    canvas.drawCentredString(PAGE_W / 2, 10 * mm, str(doc.page))
    # Bottom rule
    canvas.line(MARGIN, 13 * mm, PAGE_W - MARGIN, 13 * mm)
    canvas.restoreState()


def draw_cover(canvas, doc):
    """Cover page is bare — no chrome."""
    canvas.saveState()
    canvas.setStrokeColor(PAGE_RULE)
    canvas.setLineWidth(1.5)
    # Frame
    canvas.rect(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN)
    canvas.restoreState()


# ── Renderers ────────────────────────────────────────────────────────────
def render_cover(spec):
    flow = []
    flow.append(Spacer(1, 50 * mm))
    flow.append(Paragraph(spec["title"].upper(), COVER_TITLE))
    flow.append(Paragraph(spec["subtitle"], COVER_SUB))
    flow.append(Spacer(1, 6 * mm))
    flow.append(Paragraph(md_to_html(spec["tagline"]), COVER_TAG))
    flow.append(Spacer(1, 10 * mm))
    flow.append(Paragraph(md_to_html(spec["cover"]["tagline_block"]), COVER_BLOCK))
    flow.append(PageBreak())
    return flow


def render_paragraphs(items, style_=BODY):
    return [Paragraph(md_to_html(p), style_) for p in items]


# ── Items: categorise, render with damage/protects/reach/hands/consumable
ITEM_SPECIAL_GLOSS = {
    # Weapons — damage specials
    "parry":     "pre-empt one incoming strike per round (trades cards)",
    "stun":      "the target loses their next round's commit",
    "stop":      "knocks the target back; reach prevents close-in this round",
    "intercept": "counter an enemy's reach attack on the same turn",
    "wound":     "damage persists each scene until tended",
    "cripple":   "reduces target Speed for the rest of the scene",
    "poison":    "the target loses Will or stat per round until tended",
    "sneaking":  "retains Stealth even after the strike lands",
    "breaching": "clears rubble or cave-ins in one action",
    "cut":       "small-cut work — rope, leather, light wood",
    "restrict":  "entangles the target; they lose movement options",
    "steer":     "redirect a grabbed target's movement at distance",
    # Armor specials
    "imposing":  "absorbs one source of damage per scene before stats are counted",
    "defend":    "adds to the carrier's defensive total without committing",
    "armor":     "reduces typed incoming damage by the listed amount",
    "block":     "counter one incoming strike; reduces grab",
    # Mounts and load specials
    "travel":    "sustained-pace travel without an Endurance check",
    "stubborn":  "refuses panic; ignores Tension penalties on the round",
    "tracking":  "retain a target's trail through one scene change",
    "carry":     "adds to the carrier's bulk capacity",
    "search":    "scout a full scene ahead",
    "steady":    "fragile cargo or footing survives rough terrain",
    # Tool specials
    "craft":     "enables crafting actions otherwise impossible",
}


def categorise_item(i):
    """Return one of: weapon / armor / mount-and-load / tool / basic."""
    if i.get("restricted") is False and i.get("damage") is None and i.get("protects") is None:
        return "basic"
    if i.get("damage"):
        return "weapon"
    if i.get("protects"):
        return "armor"
    if i.get("bulk", 0) < 0:
        return "mount-and-load"
    return "tool"


def render_items(data):
    flow = []
    groups = {
        "weapon":         ("Weapons", []),
        "armor":          ("Armor and Defense", []),
        "mount-and-load": ("Mounts, Mounts' Kit, and Load-Carriers", []),
        "tool":           ("Tools", []),
        "basic":          ("Basic Supplies (anyone may take, once each)", []),
    }
    for i in data["items"]:
        groups[categorise_item(i)][1].append(i)

    # Render each category
    for key in ("weapon", "armor", "mount-and-load", "tool", "basic"):
        title, items = groups[key]
        if not items:
            continue
        flow.append(Paragraph(title, H3))
        rows = [[
            Paragraph("<b>Item</b>", INLINE),
            Paragraph("<b>Bulk</b>", INLINE),
            Paragraph("<b>Mechanics</b>", INLINE),
        ]]
        for i in items:
            bulk = str(i.get("bulk", 0))
            notes = []
            if i.get("statistics"):
                notes.append(" · ".join(i["statistics"]))
            if i.get("special"):
                notes.append(f"<i>{i['special']}</i>")
            if i.get("damage"):
                d = i["damage"]
                notes.append(f"<font color='#7a3a1a'>damage: {d['type']} → {d['statReduced']}</font>")
            if i.get("protects"):
                notes.append(f"<font color='#7a3a1a'>protects: {i['protects']}</font>")
            tags = []
            if i.get("reach"):
                tags.append(f"<i>{i['reach']}</i>")
            if i.get("hands"):
                tags.append(f"<i>{i['hands']}-handed</i>")
            if i.get("consumable"):
                tags.append("<i>consumable</i>")
            if tags:
                notes.append(" · ".join(tags))
            if i.get("description"):
                notes.append(i["description"])
            rows.append([
                Paragraph(f"<b>{i['name']}</b>", INLINE),
                Paragraph(bulk, INLINE),
                Paragraph(" · ".join(notes), INLINE),
            ])
        t = Table(rows, colWidths=[28 * mm, 14 * mm, COL_W - 42 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("LINEBELOW", (0, 0), (-1, 0), 0.5, ACCENT),
            ("LINEBELOW", (0, 1), (-1, -2), 0.25, MUTED),
        ]))
        flow.append(t)
        flow.append(Spacer(1, 6))

    # Specials glossary
    used_specials = sorted({i["special"] for i in data["items"] if i.get("special")})
    flow.append(Paragraph("Item Specials — what each keyword does", H3))
    flow.append(Paragraph(
        "Every card-producing item has a one-word <i>special</i> that fires "
        "when the card is committed. The full meaning of each:",
        BODY))
    rows = [[Paragraph("<b>Special</b>", INLINE),
             Paragraph("<b>Effect when the card is committed</b>", INLINE)]]
    for s in used_specials:
        gloss = ITEM_SPECIAL_GLOSS.get(s, "—")
        rows.append([
            Paragraph(f"<b><i>{s}</i></b>", INLINE),
            Paragraph(gloss, INLINE),
        ])
    t = Table(rows, colWidths=[30 * mm, COL_W - 30 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, ACCENT),
        ("LINEBELOW", (0, 1), (-1, -2), 0.25, MUTED),
    ]))
    flow.append(t)
    return flow


def render_table_source(source, data):
    flow = []
    if source == "DATA.places":
        # Render places as a 2-column image grid: image + name + short
        # description. Reads as a "places of the world" gallery.
        cells = []
        row = []
        col_count = 2
        thumb_w = (COL_W - 6 * mm) / col_count
        img_w = thumb_w
        for p in data["places"]:
            slug_p = slug_for_place(p["name"])
            img_path = ROOT / "html" / "icons" / "places" / f"{slug_p}.png"
            block = []
            img = safe_image(str(img_path), img_w)
            if img:
                block.append(img)
            block.append(Paragraph(f"<b>{p['name']}</b>", INLINE))
            block.append(Paragraph(f"<i>{md_to_html(p['description'])}</i>", SMALL))
            row.append(block)
            if len(row) == col_count:
                cells.append(row)
                row = []
        if row:
            while len(row) < col_count:
                row.append("")
            cells.append(row)
        t = Table(cells, colWidths=[thumb_w] * col_count)
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        flow.append(t)
    elif source == "DATA.statistics":
        for s in data["statistics"]:
            flow.append(Paragraph(
                f"{s['name']} <font color='#7a3a1a'>({s['abbreviation']})</font> — "
                f"<i>{s['action']}</i>", H3))
            flow.append(Paragraph(md_to_html(s["description"]), BODY))
            sc_lines = []
            for sc in s["scenarios"]:
                sc_lines.append(
                    f"<b>{sc['name']}:</b> {sc['description']}"
                )
            flow.append(Paragraph("<br/>".join(sc_lines), SMALL))
            flow.append(Spacer(1, 4))
    elif source == "DATA.races":
        for r in data["races"]:
            flow.append(Paragraph(f"<b>{r['name']}</b>", H3))
            flow.append(Paragraph(md_to_html(r["description"]), BODY))
            powers = ", ".join(p.title() for p in r["powers"])
            flow.append(Paragraph(f"<i>Powers:</i> {powers}", SMALL))
    elif source == "DATA.powers":
        # Sort alphabetically for reference use
        for p in sorted(data["powers"], key=lambda x: x["name"]):
            stats = " · ".join(p["statistics"])
            flow.append(Paragraph(
                f"<b>{p['name']}</b> &nbsp;<font color='#7a3a1a'>({stats})</font> &nbsp;"
                f"<i>{p.get('special','')}</i>", H3))
            flow.append(Paragraph(md_to_html(p.get("description", "")), BODY))
    elif source == "DATA.backgrounds":
        for b in data["backgrounds"]:
            stats = " · ".join(b["statistics"])
            slug_b = slug(b["name"])
            icon_path = ROOT / "html" / "icons" / "cards" / "backgrounds" / f"{slug_b}.png"
            icon = safe_image(str(icon_path), 22 * mm)
            text_block = [
                Paragraph(
                    f"<b>{b['name']}</b> &nbsp;<font color='#7a3a1a'>({stats})</font>",
                    H3),
            ]
            if b.get("items"):
                text_block.append(Paragraph(
                    f"<b>Items:</b> {', '.join(b['items'])}", SMALL))
            if b.get("specializations"):
                text_block.append(Paragraph(
                    f"<b>Specializations:</b> {', '.join(b['specializations'])}", SMALL))
            if icon:
                t = Table([[icon, text_block]], colWidths=[26 * mm, COL_W - 26 * mm])
                t.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (1, 0), (1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]))
                flow.append(t)
            else:
                flow.extend(text_block)
    elif source == "DATA.specializations":
        for stat, specs in data["specializations"].items():
            flow.append(Paragraph(f"<b>{stat}</b>", H3))
            flow.append(Paragraph(", ".join(specs), BODY))
    elif source == "DATA.items":
        flow.extend(render_items(data))
    elif source == "DATA.cards":
        # Element icons in a 4-up grid
        cells = []
        row = []
        col_count = 4
        cell_w = (COL_W - 4 * mm) / col_count
        for c in data["cards"]:
            slug_c = slug(c["name"])
            icon_path = ROOT / "html" / "icons" / "cards" / "elements" / f"{slug_c}.png"
            icon = safe_image(str(icon_path), 30 * mm)
            stats = " · ".join(c["statistics"])
            block = []
            if icon:
                block.append(icon)
            block.append(Paragraph(f"<b>{c['name']}</b>", H3))
            block.append(Paragraph(f"<font color='#7a3a1a'>{stats}</font>", SMALL))
            block.append(Paragraph(f"<i>{c.get('special','')}</i>", CAPTION))
            row.append(block)
            if len(row) == col_count:
                cells.append(row)
                row = []
        if row:
            while len(row) < col_count:
                row.append("")
            cells.append(row)
        t = Table(cells, colWidths=[cell_w] * col_count)
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        flow.append(t)
    elif source == "DATA.actions":
        # Group by power (the stat-action register)
        by_power = {}
        for a in data["actions"]:
            by_power.setdefault(a["power"], []).append(a)
        for power_name in sorted(by_power.keys()):
            flow.append(Paragraph(f"<b>{power_name}</b>", H3))
            for a in by_power[power_name]:
                needs = f" <font color='#7a3a1a'><i>{a['needs']}</i></font>" if a.get("needs") else ""
                flow.append(Paragraph(
                    f"<b>{a['name']}</b>{needs} — {md_to_html(a.get('description',''))}",
                    BODY))
    return flow


def render_list(items):
    """Render an inline list of objects with named/summary or term/def shape."""
    flow = []
    for item in items:
        if "name" in item and "summary" in item:
            flow.append(Paragraph(
                f"<b>{item['name']}.</b> {md_to_html(item['summary'])}", BODY))
        elif "term" in item:
            flow.append(Paragraph(
                f"<b>{item['term']}.</b> {md_to_html(item['def'])}", BODY))
        elif "level" in item:
            flow.append(Paragraph(
                f"<b>Level {item['level']}:</b> {item['xp']} XP", BODY))
    return flow


def render_named_npcs(npcs):
    flow = []
    for npc in npcs:
        img = safe_image(npc.get("image"), 45 * mm)
        cells = [[]]
        if img:
            cells = [[
                img,
                [
                    Paragraph(f"<b>{npc['name']}</b>", H3),
                    Paragraph(md_to_html(npc["role"]), BODY),
                ],
            ]]
            t = Table(cells, colWidths=[50 * mm, COL_W - 50 * mm])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (1, 0), (1, -1), 8),
            ]))
            flow.append(t)
        else:
            flow.append(Paragraph(f"<b>{npc['name']}</b>", H3))
            flow.append(Paragraph(md_to_html(npc["role"]), BODY))
        flow.append(Spacer(1, 6))
    return flow


def render_race_illustrations(illust):
    flow = []
    for race, info in illust.items():
        img = safe_image(info.get("image"), 45 * mm)
        if not img:
            continue
        cells = [[
            img,
            [
                Paragraph(f"<b>{race}</b>", H3),
                Paragraph(f"<i>{md_to_html(info.get('caption',''))}</i>", CAPTION),
            ],
        ]]
        t = Table(cells, colWidths=[50 * mm, COL_W - 50 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (1, 0), (1, -1), 8),
        ]))
        flow.append(t)
        flow.append(Spacer(1, 6))
    return flow


def load_roster_entry(name):
    p = ROOT / "data" / "roster.json"
    if not p.exists():
        return None
    for c in json.loads(p.read_text()):
        if c.get("name") == name:
            return c
    return None


def render_example_character(section, data):
    """Render a worked-example character sheet (Nadine). Pulls from roster."""
    name = section["example_character"]
    entry = load_roster_entry(name)
    if not entry:
        return [Paragraph(f"<i>Roster entry for {name} not found.</i>", BODY)]

    flow = []
    # Header band: image | identity + bio
    img = safe_image(section.get("image"), 50 * mm)
    identity_parts = [entry.get("gender"), entry.get("race"), entry.get("place")]
    identity_line = " · ".join(p for p in identity_parts if p)
    header_right = [
        Paragraph(f"<b>{entry['name']}</b>", H2),
        Paragraph(f"<i>{md_to_html(identity_line)}</i>", SMALL),
        Spacer(1, 4),
        Paragraph(md_to_html(section.get("biography", entry.get("desc", ""))), BODY),
    ]
    if img:
        header_t = Table([[img, header_right]], colWidths=[55 * mm, COL_W - 55 * mm])
        header_t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (1, 0), (1, -1), 8),
        ]))
        flow.append(header_t)
    else:
        flow.extend(header_right)
    flow.append(Spacer(1, 8))

    # Recompute the sheet by replaying progression on a fresh state
    # (cheaper than node IPC: derive directly from the stat values stored
    #  in the dump if available, otherwise by computing from progression)
    stats = entry.get("stats") or {}
    # The roster stores derived stats under the private field — but the
    # toJSON only exposes raw progression. Recompute via node:
    sheet = compute_character_sheet(name)

    # Stats grid (8 columns)
    stat_defs = data["statistics"]
    stat_row_labels = [s["abbreviation"] for s in stat_defs]
    stat_row_values = [str(sheet["stats"].get(s["abbreviation"], 1)) for s in stat_defs]
    stat_row_actions = [s["action"] for s in stat_defs]

    stats_table = Table(
        [
            stat_row_labels,
            stat_row_values,
            stat_row_actions,
        ],
        colWidths=[(COL_W) / len(stat_row_labels)] * len(stat_row_labels),
    )
    stats_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), TITLE_FONT, 11),
        ("FONT", (0, 1), (-1, 1), TITLE_FONT, 18),
        ("FONT", (0, 2), (-1, 2), BODY_FONT, 8),
        ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 1), (-1, 1), INK),
        ("TEXTCOLOR", (0, 2), (-1, 2), MUTED),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ("LINEBELOW", (0, 1), (-1, 1), 0.4, ACCENT),
    ]))
    flow.append(stats_table)
    flow.append(Spacer(1, 4))
    flow.append(Paragraph(f"<i>XP spent: {sheet['xp']}</i>", SMALL))
    flow.append(Spacer(1, 8))

    # Backgrounds / Specializations / Powers
    if sheet["backgrounds"]:
        flow.append(Paragraph("Backgrounds", H3))
        flow.append(Paragraph(
            " · ".join(f"{b['name']} {b['level']}" for b in sheet["backgrounds"]),
            BODY))
    if sheet["specializations"]:
        flow.append(Paragraph("Specializations", H3))
        flow.append(Paragraph(
            " · ".join(f"{s['name']} {s['level']}" for s in sheet["specializations"]),
            BODY))
    if sheet["powers"]:
        flow.append(Paragraph("Powers", H3))
        flow.append(Paragraph(
            " · ".join(f"{p['name']} {p['level']} <i>({p['special']})</i>"
                       for p in sheet["powers"]),
            BODY))

    # Progression
    flow.append(Paragraph("Progression", H3))
    rows = [["#", "Type", "Name", "Level", "Stat", "XP"]]
    for i, p in enumerate(sheet["progression"], start=1):
        rows.append([str(i), p["type"], p["name"], str(p["level"]),
                     p["stat"], str(p["xp"])])
    prog_t = Table(rows, colWidths=[10 * mm, 30 * mm, 50 * mm, 18 * mm, 25 * mm, 15 * mm])
    prog_t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), TITLE_FONT, 9),
        ("FONT", (0, 1), (-1, -1), BODY_FONT, 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (3, -1), "CENTER"),
        ("ALIGN", (5, 0), (5, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, 0), 0.4, ACCENT),
        ("LINEBELOW", (0, 1), (-1, -2), 0.2, MUTED),
    ]))
    flow.append(prog_t)

    # Equipment + bulk
    if sheet["items"]:
        flow.append(Spacer(1, 6))
        flow.append(Paragraph("Equipment", H3))
        flow.append(Paragraph(", ".join(sheet["items"]), BODY))
        bulk_color = ACCENT.hexval() if sheet["encumbered"] else "#5a5a5a"
        bulk_status = " — encumbered" if sheet["encumbered"] else ""
        flow.append(Paragraph(
            f"<font color='{bulk_color}'><i>bulk {sheet['bulk']} / "
            f"{sheet['capacity']}{bulk_status}</i></font>",
            SMALL))

    # Mentor lines (from spec's mentors map on the roster entry)
    mentors = entry.get("mentors") or {}
    if mentors:
        flow.append(Spacer(1, 6))
        flow.append(Paragraph("Mentors", H3))
        for spec_name, mentor_text in mentors.items():
            flow.append(Paragraph(
                f"<i><b>{spec_name}</b> — {md_to_html(mentor_text)}</i>", BODY))

    return flow


def compute_character_sheet(name):
    """Use node + logic.js to compute the full derived sheet for a roster
    entry by name. Returns a dict with stats, xp, backgrounds, specs, powers,
    progression, items, bulk, capacity, encumbered."""
    script = r"""
import { readFileSync } from 'node:fs';
const L = await import('./html/logic.js');
const { DATA } = await import('./html/data.js');
const roster = JSON.parse(readFileSync('data/roster.json', 'utf8'));
const targetName = process.argv[process.argv.length - 1];
const c = roster.find(c => c.name === targetName);
if (!c) { process.stderr.write('not found'); process.exit(1); }
L.initState();
L.loadDump(c);
{
    const out = {
      stats: {},
      xp: L.state.xp,
      backgrounds: [],
      specializations: [],
      powers: [],
      progression: [],
      items: Array.from(L.state.items),
      bulk: L.state.weight,
      capacity: L.carryCapacity(),
      encumbered: L.state.weight > L.carryCapacity(),
    };
    DATA.statistics.forEach(s => { out.stats[s.abbreviation] = L.stat(s.abbreviation) || 1; });
    DATA.backgrounds.forEach(b => { if (L.stat(b.name) > 0) out.backgrounds.push({name: b.name, level: L.stat(b.name)}); });
    Object.keys(DATA.specToStat).forEach(sp => { if (L.stat(sp) > 0) out.specializations.push({name: sp, level: L.stat(sp)}); });
    DATA.powers.forEach(p => { if (L.stat(p.name) > 0) out.powers.push({name: p.name, level: L.stat(p.name), special: p.special}); });
    for (let i = 0; i < L.state.progressions; i++) {
      const p = L.state.progres(i);
      out.progression.push({type: p.type, name: p.name, level: p.level, stat: p.stat, xp: p.xp});
    }
    process.stdout.write(JSON.stringify(out));
}
"""
    out = subprocess.check_output(
        ["node", "--input-type=module", "-e", script, "--", name],
        cwd=str(ROOT),
    )
    return json.loads(out)


def render_section(section, data, level=1):
    flow = []
    H = H1 if level == 1 else H2
    flow.append(Paragraph(section["title"], H))
    if section.get("intro"):
        intro = section["intro"]
        if intro == "DATA.game.description":
            for p in data["game"]["description"]:
                flow.append(Paragraph(md_to_html(p), INTRO))
        else:
            flow.append(Paragraph(md_to_html(intro), INTRO))
    for p in section.get("body", []):
        flow.append(Paragraph(md_to_html(p), BODY))
    if "table_source" in section:
        flow.extend(render_table_source(section["table_source"], data))
    if "example_character" in section:
        flow.extend(render_example_character(section, data))
    if "race_illustrations" in section:
        flow.append(Spacer(1, 6))
        flow.extend(render_race_illustrations(section["race_illustrations"]))
    if "named_npcs" in section:
        flow.extend(render_named_npcs(section["named_npcs"]))
    if section.get("note"):
        flow.append(Paragraph(f"<i>{md_to_html(section['note'])}</i>", SMALL))
    if "list" in section:
        flow.extend(render_list(section["list"]))
    for sub in section.get("subsections", []):
        flow.append(Spacer(1, 6))
        flow.extend(render_section(sub, data, level=level + 1))
    return flow


# ── Doc build ────────────────────────────────────────────────────────────
class ManualDoc(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            **kw,
        )
        frame = Frame(MARGIN, 18 * mm, COL_W, PAGE_H - 38 * mm,
                      leftPadding=0, rightPadding=0,
                      topPadding=0, bottomPadding=0,
                      id="body")
        cover_frame = Frame(MARGIN + 10 * mm, MARGIN + 10 * mm,
                            COL_W - 20 * mm, PAGE_H - 2 * MARGIN - 20 * mm,
                            id="cover")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="body", frames=[frame], onPage=draw_chrome),
        ])


def build():
    spec = json.loads(SPEC.read_text())
    data = get_data()

    flow = []
    # Cover
    flow.extend(render_cover(spec))
    # Switch to body template after cover
    from reportlab.platypus.doctemplate import NextPageTemplate

    flow.insert(0, NextPageTemplate("cover"))
    # After cover page break, switch to body template
    # (the PageBreak at end of cover triggers next template)
    # Insert template-switch right after the cover's PageBreak
    # — but we already do PageBreak at end of cover; so inject NextPageTemplate
    #   before the PageBreak so subsequent pages use body template.
    # Simplest: rebuild flow.
    flow = [NextPageTemplate("cover")] + render_cover_only(spec) + [
        NextPageTemplate("body"),
        PageBreak(),
    ]
    # Sections
    for i, section in enumerate(spec["sections"]):
        flow.extend(render_section(section, data, level=1))
        if i < len(spec["sections"]) - 1:
            flow.append(PageBreak())

    doc = ManualDoc(str(OUT_PDF))
    doc.build(flow)
    print(f"Wrote {OUT_PDF.relative_to(ROOT)}  ({OUT_PDF.stat().st_size // 1024} KB)")


def render_cover_only(spec):
    flow = []
    cover_image = spec.get("cover", {}).get("image")
    img = safe_image(cover_image, 150 * mm) if cover_image else None
    if img:
        # Centre the image at the top of the cover frame
        flow.append(Spacer(1, 4 * mm))
        wrap = Table([[img]], colWidths=[COL_W - 20 * mm])
        wrap.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        flow.append(wrap)
        flow.append(Spacer(1, 8 * mm))
    else:
        flow.append(Spacer(1, 50 * mm))
    flow.append(Paragraph(spec["title"].upper(), COVER_TITLE))
    flow.append(Paragraph(spec["subtitle"], COVER_SUB))
    flow.append(Paragraph(md_to_html(spec["tagline"]), COVER_TAG))
    flow.append(Spacer(1, 6 * mm))
    flow.append(Paragraph(md_to_html(spec["cover"]["tagline_block"]), COVER_BLOCK))
    return flow


if __name__ == "__main__":
    build()
