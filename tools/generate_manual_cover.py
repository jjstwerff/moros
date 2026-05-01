#!/usr/bin/env python3
"""Generate the Moros Player Manual cover art via fal.ai Flux 1.1 [pro] ultra.

The prompt is deliberately verbose: Flux skips secondary detail with loose
prompts, so every figure, every object, and every spatial relationship is
named explicitly.

Reads FAL_KEY from ~/.config/moros/secrets.env. Writes:
    images/manual_cover.png

Usage:
    .venv-cards/bin/python3 tools/generate_manual_cover.py            # generate if missing
    .venv-cards/bin/python3 tools/generate_manual_cover.py --force    # archive existing, regenerate
"""

import pathlib
import sys

# Reuse the helpers from the card-art tool
from generate_card_art import call_flux, load_key, archive_existing

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "images"
OUT_PATH = OUT_DIR / "manual_cover.png"

STYLE_COVER = (
    "wide cinematic painterly digital illustration in the style of dark "
    "low-fantasy tabletop RPG manual cover art, hand-drawn ink line work under "
    "soft gouache and watercolour wash, muted earthy palette of ochre, moss, "
    "slate and rust with warm orange firelight as the only bright accent, "
    "atmospheric low-key twilight lighting, no text anywhere on the image, "
    "no border, no logo, no title, no watermark, no captions, no numbers, "
    "no letters of any kind"
)

PROMPT = (
    # ── Lead with diversity, very explicit ─────────────────────
    "THREE characters of THREE COMPLETELY DIFFERENT species seated around "
    "a round wooden inn table: ONE HUMAN MAN, ONE OWL-FOLK ELDER (a "
    "humanoid with an OWL'S head — flat round face, two huge round eyes, "
    "feathers, hooked beak), and ONE BADGER-FOLK WOMAN with a striped "
    "black-and-white face. All three species are distinct and unmistakable "
    "from their faces; only ONE of them is a badger; the other two are NOT "
    "badgers. The cards are clearly visible on the table. "

    # ── Human (placed first now to anchor 'normal' face) ───────
    "(1) on the LEFT side of the table, a HUMAN MAN seated facing right: "
    "ordinary human face, dark hair tied back, short trimmed beard, weathered "
    "skin, plain undyed wool tunic under a brown leather jerkin, ordinary "
    "human hands gesturing open over the cards on the table; clearly a "
    "human, not an animal-person, not furry. "

    # ── Owl (Flux handles owl-folk reliably) ───────────────────
    "(2) on the RIGHT side of the table, an OWL-FOLK ELDER seated facing "
    "left, leaning forward over the cards: an upright bipedal humanoid "
    "with the unmistakable head and face of a barn owl — a flat heart-"
    "shaped pale facial disc, two enormous round forward-facing dark eyes, "
    "a small downcurved hooked beak, soft buff-and-cream feathers around "
    "the head, no muzzle, no mammal fur — on the body of a wiry older "
    "scholar in a plain dark wool robe with the wing-feathers tucked at "
    "his back; one humanoid hand resting on a card on the table. The "
    "owl-folk's head is unambiguously an OWL'S head: round, flat-faced, "
    "huge-eyed, NOT a badger, NOT a mouse, NOT a mammal. "

    # ── Badger (the only one) ──────────────────────────────────
    "(3) on the FAR SIDE of the table seated facing the viewer, a "
    "BADGER-FOLK WOMAN — broad badger head with the dark stripe of fur "
    "across the eyes, small black eyes, silver-white muzzle, small rounded "
    "ears — on the body of a stout middle-aged innkeeper in a leather "
    "apron over a russet wool dress; she is the ONLY badger in the image. "

    # ── Cards ──────────────────────────────────────────────────
    "On the table between the three: a fan of FIVE flat tarot-style fantasy "
    "cards laid face up — each card a thick rectangle of pale cream "
    "parchment with rounded corners, each showing a single ink-woodcut "
    "symbol filling the card — one a flame, one a curling wave, one an "
    "iron anvil, one a fern sprig, one a sun-burst. The cards are clearly "
    "on the wooden table surface, with NO numbers, NO letters, NO playing-"
    "card suits. "

    # ── Inn interior ───────────────────────────────────────────
    "Setting: the dim warm common room of a medieval low-fantasy inn. A "
    "stone hearth on the LEFT edge of the frame holds a crackling "
    "pale-orange fire that casts warm firelight across all three faces. "
    "Heavy dark roof beams overhead; a clay jug, a wooden bowl, two pewter "
    "tankards on the table; in the dim background behind them, wooden wall "
    "planks and a worn shelf with bottles. No other patrons. "

    # ── Anti-error ─────────────────────────────────────────────
    "All three characters fully visible, equally rendered, equally lit by "
    "the hearth-fire; the species are unambiguously different from each "
    "other; only ONE has a badger face; the human has a normal human face "
    "with no fur and no muzzle; the finch has a beak and no muzzle and no "
    "fur; the table is flat and the cards lie ON the table; the setting is "
    "indoors, NOT a campfire, NOT outdoors, NOT a campsite"
)


def main():
    force = "--force" in sys.argv
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if OUT_PATH.exists() and not force:
        print(f"Cover already exists at {OUT_PATH.relative_to(ROOT)}. "
              "Pass --force to regenerate.")
        return

    if force:
        archive_existing(OUT_PATH)

    key = load_key()
    print(f"Loaded FAL_KEY ({len(key)} chars). Endpoint: flux-pro v1.1-ultra")
    print(f"Generating manual cover ...")

    img = call_flux(
        key=key,
        prompt_body=PROMPT,
        name="manual_cover",
        ratio="landscape_4_3",
        style=STYLE_COVER,
        ultra=True,
    )

    OUT_PATH.write_bytes(img)
    print(f"  -> {OUT_PATH.relative_to(ROOT)} ({len(img)//1024} KB)")


if __name__ == "__main__":
    main()
