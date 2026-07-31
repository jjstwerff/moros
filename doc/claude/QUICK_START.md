# Moros — Quick Start for Claude

## Try the editor in one command

```sh
make play        # native build, then open a browser (or print the ssh tunnel)
make play-fast   # interpreted — up in a second, for a quick look
```

Both free the port first, wait until the editor is actually listening, and print the
real reason if it exits instead of hanging.

⚠ **`make play` is slow the first time** — a native build compiles the whole graphics
dependency tree, which is minutes. It is cached afterwards. Use `play-fast` while
iterating; use `play` when you care how it performs.

⚠ **No browser is opened over ssh, on purpose.** The check is *is there a display*,
not *is this Linux*: on a desktop session you get a browser, and on an ssh session you
get the `ssh -L` line you actually need, because a browser opened on the far machine
helps nobody.

**Two renderers answer the same server, and that is deliberate.** `/` serves the
JavaScript one (`html/editor.html`); **`/client`** serves the wasm/loft one
(`src/editor_client.loft`, built by `make client`). They speak the same wire and draw the
same picture, so either can be measured against the other — `make editor-check` and
`make client-check` are the same headless check pointed at each. The JavaScript one is
the CONTROL and is not deleted while it is still the thing the other is compared to.
⚠ On `/client`, **click the canvas before pressing a key**: loft's browser shell binds
keys to the canvas element, not to the window.

Read this file at the start of every session before doing any work. The full topic index lives in the project-root **[CLAUDE.md](../../CLAUDE.md)**.

## What is this project?

**Two products share this tree, and the split matters more than it looks.**
[CLAUDE.md](../../CLAUDE.md) states it: **Moros** is the tabletop RPG, and **lavition** is
the universal hex-world editor its scene tools are being built for. lavition is its own
product with its own consumers (crawler, bumper airplanes, loft's Workbench) — Moros is
one of them. Its packages take descriptive `hex_*` names with **no brand prefix**; keep
Moros vocabulary out of them.

Moros, then, has three sides:

- A **browser-based toolkit** — Character Creator (`html/character-creator.html`), a DM
  tool (`html/dm.html`) and a world-map editor (`html/hex-map-editor.html`); all data in
  `localStorage`, no backend.
- A **printed campaign** — lore, NPCs, places, scenarios, and a card deck. Source documents
  in `doc/`; generated PDFs in `data/`.
- The **scene editor** — lavition, above. A loft server (`src/editor_server.loft`) with two
  renderers, gated by the suite in `tools/gates/`. Start at
  [STATE.md](STATE.md) after any break.

⚠ **Two different hex worlds live here, and they are not the same code.** The *world map*
(`html/map.js`, `html/hex-lattice.js`) is the campaign's overland map in the browser —
tiles, terrain, roads, rivers. The *scene* (`src/`, `lib/`) is lavition's voxel landscape.
They share a lattice convention and nothing else; fixing one does not touch the other.

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
| `html/index.html` | The suite's front door — links to every page below |
| `html/data.js` | All static game data (`DATA` object) — source of truth for rules content |
| `html/logic.js` | Character state, progression logic, XP calculation |
| `html/character.js` | Character sheet rendering |
| `html/character-creator.html` | Character editor UI |
| `html/dm-logic.js` | **Pure** DM logic — no DOM, no `localStorage`, importable in Node. This is the pattern to follow when something needs a test |
| `html/dm.js` | DM tool logic (the DOM half) |
| `html/dm.html` | DM tool UI |
| `html/hex-map-editor.html` | World-map editor UI |
| `html/map.js` | World-map editor — terrain, roads, rivers, landmarks, the 2D and 3D views |
| `html/hex-lattice.js` | **Pure** hex geometry for the world map: offsets, `MIRROR_DIR`, `dirName`, `hexCenter`. ⚠ **One home for the lattice** — it was in two places and they disagreed, which is what broke roads (see [OPEN_ISSUES](OPEN_ISSUES.md#world-map-editor)) |
| `html/map.css` | World-map editor styles |
| `html/scenario-print.html` · `.js` · `.css` | Printable scenario sheets |
| `html/editor.html` | The **scene** editor's JavaScript renderer — served at `/` by the loft server, and kept as the control for the wasm one |
| `html/style.css` | Shared styles |
| `html/categories.js` | Shared category list |

## Source files (the scene editor — lavition)

Design first: [STATE.md](STATE.md), then [HEX_STACK.md](HEX_STACK.md) and
[WORLD_MODEL.md](WORLD_MODEL.md).

| File | Role |
|---|---|
| `src/editor_server.loft` | The server: the world, the wire's 30 messages, the tick, meshing. One file, and [WIRE_PROTOCOL.md](WIRE_PROTOCOL.md) is the map of it |
| `src/editor_client.loft` | The wasm/loft renderer, served at `/client` |
| `lib/hex_world/` | **lavition** — the voxel landscape: columns, layers, windowed heights, the file format |
| `lib/moros_sim/` | Simulation: cliffs and stairs, the fall, ground contact, rigs, assemblies |
| `lib/moros_render/` | Mesh emission — hex fans, wall quads, slope faces |
| `lib/moros_map/`, `lib/moros_editor/`, `lib/moros_ui/` | The scene model, editor state, UI helpers |
| `lib/glb_read/` | `.glb` import, ours because upstream cannot verify it |

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

## Driving and watching the editor without a keyboard

Everything below is verified and is how the editor is now tested. The design is
[SCRIPTED_EDITOR.md](SCRIPTED_EDITOR.md).

```sh
node tools/script.mjs tools/scripts/hut.keys            # replay a scene, no browser
node tools/script.mjs tools/scripts/fall.keys --shots   # …and photograph named ticks
node tools/views.mjs shots/v.png                        # plan + elevation, no GPU, passive
```

A script speaks in the keys a person presses, plus `rate` / `step` / `snap` / `save`.
⚠ **`rate 0` is STEPPED** — the only mode in which a PNG is a golden image, because at any
other rate the wall clock advances idle ticks between commands and the camera's ease and the
pose depend on how many.

**Every run is recorded** to `recordings/run-<t>.rec`, on by default. The format is the wire
stamped with its tick, so a recording, a hand-written script and a bug report are one file.

⚠ **The simulation is reproducible and this was measured, not assumed**: the same script at
rate 1, rate 0 and rate 8 saves byte-identical world files.

## Tooling (the scene editor)

Instruments, not gates — they exit 0 whatever they find, and say what happened.

| Script | Role |
|---|---|
| `tools/gates/` | The gate suite: `world/` drives by **placing** the character, `character/` by **walking** it. `make gate` runs all 28, each on a fresh server, and stops the server after |
| `tools/seam.mjs` | Is the ground watertight, and is it smooth? Two questions that look identical on screen. Passive — add `--watch N` to ask while the world is moving |
| `tools/plan.mjs` | Draws the world in plan view. ⚠ **NOT passive** — it sends placements and lays a road |
| `tools/page_console.mjs` | What a page **said**, when it drew nothing. `--press` holds a key; `--hook-shaders` logs the GLSL the driver actually got |
| `tools/map_road_shot.mjs` | Drives the **world-map** editor: pick the road tool, click tiles, screenshot. A pure test cannot say whether the page still wires the geometry |
| `tools/lookprobe.mjs` | Drag-to-look: the view matrix *and* the figure both have to move |

`make shot` photographs what a person is looking at, and is passive.
⚠ **Stop the server when done** — `make stop-editor`. A forgotten one is not idle.

## Tests and commands

```
make tests      # the browser toolkit — mocha + c8 coverage, in test/
make lib-test   # every loft package's own suite
make gate       # the scene editor's 28 gates, each on a fresh server
make serve      # serve html/ on localhost:8000
make creator    # open character creator in firefox
```

| Test file | Covers |
|---|---|
| `test/progression.test.js` | Character progression, XP, validation |
| `test/dm.test.js` | `dm-logic.js` — search, snapshots, scenario filtering |
| `test/lattice.test.js` | The world map's hex lattice. ⚠ It **re-derives** the mirror direction from the offsets rather than comparing one table with another, and keeps the wrong table that shipped as a control that must fail |

**49 browser tests, 741 loft library tests, 28 gates.**

## Conventions

- All game statistics, XP, and levels are **recalculated from the progression list** on load. Never store derived values.
- Static game data in `data.js` is frozen and never written at runtime.
- See `RULES.md` style guide comment for documentation formatting rules.
- Documentation goal: see [SCENE_FIRST.md](SCENE_FIRST.md) — every page should describe scenes a DM can run, not just rules.
