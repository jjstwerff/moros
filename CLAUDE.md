# Moros Documentation

A tabletop RPG toolkit and campaign. New here? Read **[Quick Start](doc/claude/QUICK_START.md)** first.

> **Two projects share this tree.** **Moros** is the tabletop RPG — the rules, cards, NPCs,
> places and campaign under `doc/`. **lavition** is the universal hex-world editor those
> scene tools are being built for; it is its own product (`loft/doc/claude/LAVITION.md`) and
> Moros is one of its consumers. Everything under *Scene tools* below, and plans 7–15,
> belong to lavition. Its packages take descriptive `hex_*` names with **no brand prefix**.

## Working rules — read these every session

How this tree is worked. None of it is derivable from the code, and each line below was
learned by getting it wrong once.

**Ask in prose; never open a multiple-choice dialog.** The options are always the
least-informed part of the exchange, and a menu cannot be discussed — so it gets ignored.
When a call is needed, make it, state it in one line with the trade-off, and keep going;
the user redirects in words if they disagree. This holds even for a genuine design fork:
the merit of the question was never the issue, the medium is.

**Build to learn.** Nothing here is set in stone, and a design argued on paper cannot
settle what a prototype that runs will. Don't stop for approval on a reversible change —
prefer the version that makes the difference *testable*.

**Commit and push without being asked.** The remote is a **backup**, not a publication
step: these trees are worked by more than one agent, so local-only work is fragile. Stage
your own paths explicitly — `git add -A` is wrong here, because someone else's in-flight
work is routinely sitting in the tree. Put the *finding* in the commit message, not just
the change. What still warrants a word first: **a PR, a published package, a registry
entry.** Don't offer a PR unprompted — a pushed branch is already the deliverable.

**Other people's trees.** `../crawler` is **read-only** — another agent works there, and an
edit it did not make destroys its ability to tell its own work from yours; raise findings
instead. `loft-libs-*` is shared and consumed from the **working tree**, so a new public
name can turn a sibling's build red with no local edit — grep the sibling before adding
one. Kill only processes you can identify as yours; this box runs other agents' work.

**A missing library capability is ours to build**, never an upstream ask — verification is
only possible where the consumer lives. Build it under `lib/<name>/`, gate it with tests
that have been seen red. Fixing and republishing a shared library is allowed too; the gate
is loft's unified `library-ci-reusable.yml`, which is where the requirements are defined.
[LOFT_HANDOFF.md](doc/claude/LOFT_HANDOFF.md) is for **loft language and tooling defects
only** — never for library gaps.

**Structural invariants belong in the library**, as pure loft functions with tests in
`lib/*/tests/` — not in a `.mjs` browser gate. A gate that restates a connection cannot
test it. Leave in the gate only what needs a running world, and measure what was actually
*emitted*, never a number the producer re-derives.

**Filing a loft defect** ([loft-lang/loft](https://github.com/loft-lang/loft/issues)): file
it as an issue straight away — a closed ticket costs nothing here, so never hold a finding
back to hunt for duplicates. `gh issue create` bypasses the issue form, so **put every
label in the create call**; a label guard adds `needs:labels` otherwise. Choose the type
label first, and let it decide whether a severity applies:

| what the ticket says | labels, all in the `create` call |
|---|---|
| it misbehaves | `bug` + `sev:high\|medium\|low` + `wa:*` + `area:*` + `hit-by:moros` |
| it works as designed, and the **design** is wrong | `enhancement` + `needs-design` + `wa:*` + `area:*` + `hit-by:moros` — **no `sev:`**, that scale is for bugs |

⚠ Query the tracker as **`loft-lang/loft`**. The old `jjstwerff/loft` name still resolves,
but `gh issue list -R jjstwerff/loft --label <x>` returns **0 through the redirect,
silently** — it reads as "nothing has this label" when ten things do.

**Stop any server you start** — `make stop-editor`. A forgotten one is not idle; one sat at
76% of a core indefinitely. And when handing over the editor URL, remember the user is
**not on this box's LAN**: they reach it over an ssh tunnel of their own, so a direct
address (or the hostname `make browser` prints) cannot connect.

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
| The browser toolkit — character creator, DM tool, **world map** | [Quick Start § Source files](doc/claude/QUICK_START.md) |
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

- [State](doc/claude/STATE.md) — **read first after a break**: where the editor work stands, decisions taken, what is open
- [Scripted editor](doc/claude/SCRIPTED_EDITOR.md) — **how the editor is driven and verified**: a script of key presses with ticks, every run recorded, a clock that can be stepped or sped up, and a PNG at every step. ⚠ Its §0 is the finding that reframes the structural work — `hex_draw` and friends already do what the editor hand-rolls
- [Fittings](doc/claude/FITTINGS.md) — doors, windows, shutters as hinged assemblies. ⚠ Read its banner first: most of it is superseded by `hex_draw`
- [Hex stack](doc/claude/HEX_STACK.md) — **the general design, and the single authority**: the three
  invariants (the store is the only authority, everything else is derived, writes go in place), the
  static/dynamic split, serverless distribution, the package register, and the translation table
- [Wire protocol](doc/claude/WIRE_PROTOCOL.md) — the editor's socket **as it stands**: all 30 message
  ids, every acknowledgement string, the seven ordering guarantees, and each message's fate under the
  design. Read this before writing a gate or a client
- [Editor substrate](doc/claude/EDITOR_SUBSTRATE.md) — **the universal hex-world editor** and its libraries: package map, consumers and their configurations, seam rules, the document-format contract, **the ownership audit and the five target groups**
- [World model](doc/claude/WORLD_MODEL.md) — **the landscape, and its normative contract**: the voxel, columns, layers, windowed heights, fold-freedom and border alignment
- [Scene map](doc/claude/SCENE_MAP.md) — scene model
- [Scene map renderer](doc/claude/SCENE_MAP_RENDER.md) — renderer rules
- [Scene editor](doc/claude/SCENE_EDITOR.md) — editor docs
- [Editor ladder](doc/claude/EDITOR_LADDER.md) — **the rungs, their plans, and [the order of work](doc/claude/EDITOR_LADDER.md#the-order-of-work)** with the checkpoints that need the user's eyes
- [Scene editor plan](doc/claude/SCENE_EDITOR_PLAN.md) — editor roadmap
- [Generator](doc/claude/GENERATOR.md) — random scenario/NPC generator

## The browser toolkit

Three pages over `localStorage`, no backend — the character creator, the DM tool, and the
**world map editor** (`html/hex-map-editor.html`): terrain, roads, rivers, landmarks, in
2D and 3D. Its hex geometry lives in ONE place, `html/hex-lattice.js`, because it did not
and the two copies disagreed — see [Open Issues § World map
editor](doc/claude/OPEN_ISSUES.md). File map and test list: [Quick
Start](doc/claude/QUICK_START.md).

⚠ **The world map is not the scene.** The map is the campaign's overland hex map in the
browser; the scene is lavition's voxel landscape under `src/` and `lib/`. They share a
lattice convention and nothing else.

## Data

- [Data](doc/claude/DATA.md) — all data structures and where they live
- [Loft libraries](doc/claude/LOFT_LIBRARIES.md) — third-party libs in use

## Process

- [Plans](plans/README.md) — plan conventions; a plan's identity is its `jjstwerff/moros` issue number
  (`gh issue list -R jjstwerff/moros --label plan --state all`)
- [Loft handoff](doc/claude/LOFT_HANDOFF.md) — upstream loft defects Moros surfaced, written ready to file
- [Loft debugger](doc/claude/LOFT_DEBUGGER.md) — what `loft debug` does, and why it cannot reach a running server yet
- [Open issues](doc/claude/OPEN_ISSUES.md) — known issues and decisions
- [doc/Todo.txt](doc/Todo.txt) — current open task list from the user
