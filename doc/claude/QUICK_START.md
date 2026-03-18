# Moros — Quick Start for Claude

Read this file at the start of every session before doing any work.

## What is this project?

Moros is a browser-based toolkit for a tabletop RPG system. It has two tools:

- **Character Creator** (`html/character-creator.html`) — build and manage player characters
- **Dungeon Master** (`html/dm.html`) — manage contacts, monsters, places, and scenarios

All data is stored in `localStorage`. There is no backend.

## Key documentation

| File | What it contains |
|---|---|
| `doc/claude/RULES.md` | Full game rules — core mechanics, progression, races, backgrounds |
| `doc/claude/SCENARIOS.md` | All 8 scenarios — tension rules and per-scenario challenges |
| `doc/claude/STATISTICS.md` | All 8 statistics — scenario uses, stat actions, specializations |
| `doc/claude/POWERS.md` | All 36 racial powers — scenario uses and overwhelmed states per power |
| `doc/claude/ITEMS.md` | All 30 items — boosts and hinders per item, tied to stats and scenarios |
| `doc/claude/CREATURES.md` | Creatures — stats, attacks, motivation, default behaviour, elementals, animals |
| `doc/claude/DATA.md` | All data structures, where they live, how they are stored |
| `doc/Todo.txt` | Current open tasks from the user |

## Source files

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

## Tests and commands

```
make tests    # run test suite (mocha, in test/)
make serve    # serve html/ on localhost:8000
make creator  # open character creator in firefox
```

Test file: `test/progression.test.js` — covers character progression logic.

## Conventions

- All game statistics, XP, and levels are **recalculated from the progression list** on load.
  Never store derived values.
- Static game data in `data.js` is frozen and never written at runtime.
- See `RULES.md` style guide comment for documentation formatting rules.
