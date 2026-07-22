# Moros Documentation

A tabletop RPG toolkit and campaign. New here? Read **[Quick Start](doc/claude/QUICK_START.md)** first.

## Where to look

| Looking for... | Go to |
|---|---|
| What this project is, where the code lives, how to run it | [Quick Start](doc/claude/QUICK_START.md) |
| The world, its history, its strangeness | [Lore](doc/claude/LORE.md) → [Campaign](doc/claude/CAMPAIGN.md) |
| The named cast and their motivations | [doc/npcs/](doc/npcs/README.md) |
| The settings and their geography | [doc/places/](doc/places/README.md) → [Geography](doc/places/geography.md) |
| Game mechanics — stats, powers, items, scenarios | [Rules](doc/claude/RULES.md) |
| The card deck system | [Cards](doc/claude/CARDS.md) |
| Printable card art and PDFs | [Card Art Prompts](doc/claude/CARD_ART_PROMPTS.md) |
| Open work | [Open Issues](doc/claude/OPEN_ISSUES.md) → [doc/Todo.txt](doc/Todo.txt) |

## Foundation

- [Quick Start](doc/claude/QUICK_START.md) — entry point; file/folder map; tests
- [Scene-first writing](doc/claude/SCENE_FIRST.md) — documentation goal: every page should describe a scene a DM can run
- [Lore](doc/claude/LORE.md) — world history: portal, first mage, animal-people, the rift, the current day
- [Campaign](doc/claude/CAMPAIGN.md) — the active campaign arc and its through-lines

## Rules and mechanics

- [Rules](doc/claude/RULES.md) — full rules: core mechanics, progression, races, backgrounds, contacts, crafting, weather
- [Statistics](doc/claude/STATISTICS.md) — all 8 stats, scenario uses, specializations
- [Powers](doc/claude/POWERS.md) — all 36 racial powers, scenario uses, overwhelmed states
- [Items](doc/claude/ITEMS.md) — items, materials, crafting effects
- [Scenarios](doc/claude/SCENARIOS.md) — the 8 scenario types and their tension rules
- [Situations](doc/claude/SITUATIONS.md) — situational modifiers and resolution
- [Survival](doc/claude/SURVIVAL.md) — camp and forage across biomes

## Cards

- [Cards](doc/claude/CARDS.md) — card system: types, layout, what goes on a card
- [Card Art Prompts](doc/claude/CARD_ART_PROMPTS.md) — Flux prompts for NPC and place card art
- [NPC reference cards](doc/npcs/cards.md) — player-facing NPC cards (rumour + standing)
- [Place reference cards](doc/places/cards.md) — player-facing location cards
- Generated PDFs: [data/moros_cards.pdf](data/moros_cards.pdf) (NPC + place deck), [data/moros_playcards.pdf](data/moros_playcards.pdf) (base + scenario + discovery deck), [data/moros_character_cards.pdf](data/moros_character_cards.pdf) (power + background + item template stock)
- Tools: [tools/generate_card_art.py](tools/generate_card_art.py) (Flux art), [tools/build_card_pdf.py](tools/build_card_pdf.py) (NPC/place PDF), [tools/build_play_card_pdf.py](tools/build_play_card_pdf.py) (play-deck PDF), [tools/build_character_cards_pdf.py](tools/build_character_cards_pdf.py) (character-pool PDF)
- [Developer Art](doc/claude/DEVELOPER_ART.md) — placeholder-art workflow and how to swap in final art

## NPCs

- Index: [doc/npcs/README.md](doc/npcs/README.md)
- [NPC goals](doc/npcs/goals.md) — what every NPC should contribute to a session, including the per-NPC character-sheet workflow
- [DM staging](doc/claude/DM_STAGING.md) — session-by-session NPC introduction order and reveal layers
- [Pre-rift pair](doc/claude/PRE_RIFT_PAIR.md) — the two ancient powers that pre-date the rift
- [Face audit TODO](doc/claude/FACE_AUDIT_TODO.md) — open per-NPC art / scene notes
- Roster CLI: [tools/character.js](tools/character.js) — apply specs, render markdown sheets into NPC pages, validate; data in [data/roster.json](data/roster.json)

## Creatures

- [Creatures](doc/claude/CREATURES.md) — stats, attacks, motivation, default behaviour
- [Creature companions](doc/claude/CREATURE_COMPANIONS.md) — bonded creatures and their rules
- [Domestic animals](doc/claude/DOMESTIC_ANIMALS.md) — beasts of burden, mounts, livestock

## Places

- Index: [doc/places/README.md](doc/places/README.md)
- [Relative geography](doc/places/geography.md) — constraint list of relative positions; foundation for the future map

## DM reference

- [DM guide](doc/claude/DM.md) — overall DM responsibilities
- [DM staging](doc/claude/DM_STAGING.md) — pacing the cast across sessions
- [Coordination roadmap](doc/claude/COORDINATION_ROADMAP.md) — cooperative setpieces across the campaign
- [Brumal resolutions](doc/claude/BRUMAL_RESOLUTIONS.md) — four endings and per-world influencers

## Stories

- [doc/stories/](doc/stories/) — long-form fiction and reference vignettes (Irna, John, the Rift, world-edge expulsion)

## Scene tools

- [Editor substrate](doc/claude/EDITOR_SUBSTRATE.md) — **the universal hex-world editor** and its libraries: package map, consumers and their configurations, seam rules, the document-format contract
- [Scene map](doc/claude/SCENE_MAP.md) — scene model
- [Scene map renderer](doc/claude/SCENE_MAP_RENDER.md) — renderer rules
- [Scene editor](doc/claude/SCENE_EDITOR.md) — editor docs
- [Scene editor plan](doc/claude/SCENE_EDITOR_PLAN.md) — editor roadmap
- [Generator](doc/claude/GENERATOR.md) — random scenario/NPC generator

## Data

- [Data](doc/claude/DATA.md) — all data structures and where they live
- [Loft libraries](doc/claude/LOFT_LIBRARIES.md) — third-party libs in use

## Process

- [Plans](plans/README.md) — plan conventions; a plan's identity is its `jjstwerff/moros` issue number
  (`gh issue list -R jjstwerff/moros --label plan --state all`)
- [Loft handoff](doc/claude/LOFT_HANDOFF.md) — upstream loft defects Moros surfaced, written ready to file
- [Open issues](doc/claude/OPEN_ISSUES.md) — known issues and decisions
- [doc/Todo.txt](doc/Todo.txt) — current open task list from the user
