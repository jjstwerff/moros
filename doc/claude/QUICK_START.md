# Moros — Quick Start for Claude

Read this file at the start of every session before doing any work. The full topic index lives in the project-root **[CLAUDE.md](../../CLAUDE.md)**.

## What is this project?

Moros is a tabletop RPG system, with two sides:

- A **browser-based toolkit** — Character Creator (`html/character-creator.html`) and a DM tool (`html/dm.html`); all data in `localStorage`, no backend.
- A **printed campaign** — lore, NPCs, places, scenarios, and a card deck. Source documents in `doc/`; generated PDFs in `data/`.

## Where things live

| What | Where |
|---|---|
| Topic index for everything | [CLAUDE.md](../../CLAUDE.md) |
| Game rules, stats, powers, items | [RULES.md](RULES.md), [STATISTICS.md](STATISTICS.md), [POWERS.md](POWERS.md), [ITEMS.md](ITEMS.md) |
| World history, current campaign | [LORE.md](LORE.md), [CAMPAIGN.md](CAMPAIGN.md) |
| Named NPCs (one file per character) | [doc/npcs/](../npcs/README.md) |
| Locations (one file per place) | [doc/places/](../places/README.md) |
| Long-form fiction | [doc/stories/](../stories/) |
| Card system + printable decks | [CARDS.md](CARDS.md), [CARD_ART_PROMPTS.md](CARD_ART_PROMPTS.md), `data/moros_cards.pdf`, `data/moros_playcards.pdf` |
| DM pacing across sessions | [DM.md](DM.md), [DM_STAGING.md](DM_STAGING.md) |
| Open work | [OPEN_ISSUES.md](OPEN_ISSUES.md), [doc/Todo.txt](../Todo.txt) |

## Source files (browser toolkit)

| File | Role |
|---|---|
| `html/data.js` | All static game data (`DATA` object) — source of truth for rules content |
| `html/logic.js` | Character state, progression logic, XP calculation |
| `html/character.js` | Character sheet rendering |
| `html/character-creator.html` | Character editor UI |
| `html/dm.js` | DM tool logic |
| `html/dm.html` | DM tool UI |
| `html/style.css` | Shared styles |
| `html/categories.js` | Shared category list |

## Tooling (Python)

| Script | Role |
|---|---|
| `tools/generate_card_art.py` | Generate NPC/place card art via Flux (fal.ai). Uses `FAL_KEY` from `~/.config/moros/secrets.env`. |
| `tools/build_card_pdf.py` | Build the NPC + place reference deck PDF (`data/moros_cards.pdf`). |
| `tools/build_play_card_pdf.py` | Build the base + scenario + discovery play-deck PDF (`data/moros_playcards.pdf`). |

Python venv lives at `.venv-cards/`.

## Tooling (Node)

| Script | Role |
|---|---|
| `tools/character.js` | Roster CLI for NPC/PC character sheets. Reuses `html/logic.js` for all rules. Subcommands: `list`, `show <name>`, `sheet <name> [--inject path.md]`, `apply <spec.json>`, `validate <name>`, `delete <name>`, `template`, `data <kind>`, `export [name]`. Default roster file: `data/roster.json` (override with `--file` or `MOROS_ROSTER`). The spec format matches the browser's "Save roster" output, plus an optional `mentors` map (`{"<Specialization>": "who taught it and where"}`). `sheet --inject` writes/replaces a `## Character sheet` block in an NPC's markdown file. |

See `doc/npcs/goals.md` §"Character sheet" for the per-NPC sheet workflow.

## Tests and commands

```
make tests    # run test suite (mocha, in test/)
make serve    # serve html/ on localhost:8000
make creator  # open character creator in firefox
```

Test file: `test/progression.test.js` — covers character progression logic.

## Conventions

- All game statistics, XP, and levels are **recalculated from the progression list** on load. Never store derived values.
- Static game data in `data.js` is frozen and never written at runtime.
- See `RULES.md` style guide comment for documentation formatting rules.
- Documentation goal: see [SCENE_FIRST.md](SCENE_FIRST.md) — every page should describe scenes a DM can run, not just rules.
