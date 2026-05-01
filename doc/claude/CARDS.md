# Cards

Related: [CARD_ART_PROMPTS.md](CARD_ART_PROMPTS.md) for the Flux art pipeline, [doc/npcs/cards.md](../npcs/cards.md) and [doc/places/cards.md](../places/cards.md) for per-card content, and the generated decks at `data/moros_cards.pdf` (NPC + place reference deck), `data/moros_playcards.pdf` (base + scenario + discovery play deck), and `data/moros_character_cards.pdf` (power + background + item template stock) — built by `tools/build_card_pdf.py`, `tools/build_play_card_pdf.py`, and `tools/build_character_cards_pdf.py`.

## Card types

There are five card types. Four enter the shared deck during play; the fifth (artifact) joins
a holder's pool while they carry the object:

- **Base cards** — 12 permanent cards, one per element
- **Character cards** — added by powers, backgrounds, or items; contributed at stakes
- **Scenario cards** — 3 per scenario, shuffled in and removed after
- **Discovery cards** — unique, personal to one character; earned by uncovering a secret
- **Artifact cards** — unique, tied to a recovered story-significant object; travels with the
  holder; earned only through dungeon-level engagement or long quest chains

## Cards and XP

Three of the card types — **discovery**, **artifact**, and the **reference cards**
(NPC and place; see [doc/npcs/cards.md](../npcs/cards.md) and
[doc/places/cards.md](../places/cards.md)) — also award **1 XP per card to the whole table**
when first earned. Base, character, and scenario cards are derived from progression or from
the scenario itself and award no XP. See [RULES.md](RULES.md) §"Earning XP" for the full
rule and §"XP Costs" for what XP buys (cost = level²).

## What goes on a card

The core in-round decision is "does this card have the stat I need?" — so the two stats are the most important thing. They should be large, centered, and immediately readable from across a table. Abbreviations are sufficient since players learn them fast: Might, Will, Dex, Char, Endu, Hand, Perc, Speed.

Below or alongside the stats: the element name (Flame, Iron, Shadow, etc.). This doubles as both the card's identity and its special trigger. For base cards the special and the element are the same thing, so no extra text is needed — experienced players will know that Iron means determination/inflexibility. For new players, a one-word texture reminder in small text underneath the element name helps without cluttering the card: "Iron — resolve" or "Flame — urgency."

Character and scenario cards also need a small source label so players know where the card came from during deck-building and stakes decisions. A single line at the bottom: the power name, background, or item that generated it. Small text, not prominent, just enough for reference.

## Differentiating card types

All four card types live in the same deck, but scenario cards need to come out after the scenario ends. A color-coded border handles this cleanly — no text needed, just a visual band around the edge.

Suggested palette:
- Neutral/cream — base cards
- Warm tone — character cards
- Distinct color per scenario type — scenario cards
- Gold or foil edge — discovery cards, to signal rarity

## Symbols

An element icon alongside the name helps recognition across the table and when cards are fanned in hand — icons are faster to scan than text. Keep them simple and distinct: a flame shape, a gear or chain for iron, an eye for shadow. The icon is a secondary identifier, not a focal point.

Stats do not need icons. The abbreviations are clear and adding icons would make the card harder to read.

## What to leave off

- Rule text
- Numbers (stats live on character sheets, not cards)
- Long descriptions
- Overwhelm or special reminders

The card is a draw result, not a rulebook page. The DM interprets it; the players react to it.

## Layout summary

| Position | Content |
|---|---|
| Center, large | The two stats |
| Below stats, mid-size | Element name |
| Below element, small | One-word texture (e.g. "urgency") |
| Corner icon | Element symbol |
| Border color | Card type |
| Footer line | Source — character and scenario cards only |
