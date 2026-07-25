# SALVAGE — which moros routines cross into the library, and what each must pass first

Companion to [`README.md`](README.md). Moros holds ~4 000 lines of editor-shaped loft with ~489
tests, and it is **rich but largely unvalidated**. hexbody's own `PLAN.md` already rules on it:

> *"moros already has a walkable in-world editor, direct-against-Map collision, player physics,
> picking, tools and a renderer — much of what M2 and M4 describe. **It is mostly untested**, so it
> is a **cherry-pick source, not a foundation**: lift a layer where applicable, then gate it here
> with a control that must fire."*

This file is that cherry-pick, made exact: **every module, the evidence it actually has, a verdict,
and the gate it must pass to get one.**

> **The rule.** Nothing crosses into a library because it exists and is green. It crosses because a
> gate defends it **and that gate has been seen to fail.** A gate nobody has watched go red is not
> a gate.

---

## 1. The admission test — what "hexbody rigor" means, concretely

Five questions, all five earned by a specific defect in this family. A routine is admitted when it
answers all five, and **question 3 is the one that fails most of moros's current suite.**

| # | question | the defect that earned it |
|---|---|---|
| **1** | Does the gate **name the item it defends**? | `SPEC`'s own rule: a gate defending no item, or an item no gate defends, is the thing to fix |
| **2** | Has its **control been seen to fire**? | four controls failed to fail in one day — a vacuous rotation identity (`n % 6` made "rotate by 6" a no-op), a missing `EDGE` length gate, an unverified halo (74 of 75 slots), a perturbation that parsed as a no-op |
| **3** | **Can the fixture express the failure at all?** | `map_to_stencil` dropped 9 of 17 walls under a green suite because every palette stencil was **rotationally symmetric** — *a symmetric subject cannot detect a symmetric bug*. Its live twin: `player_physics.loft` tests collision on a map with **no walls** |
| **4** | Is the comparison **exact** where the domain is exact — bytes, counts, integers, no ε? | `P4`: an ε in an R1 comparison means the admitted space is wider than the map is injective on |
| **5** | Is it measured over the **whole** thing — both parities, both signs, halo included, no unchecked window? | `L10`, plus four separate parity bugs: `(r % 2)` for `(r & 1)`, a direction table that could not be parity-aware, an axial neighbour list on offset coordinates, negative indices that wrap |

**The exemplar already exists on our side.** `moros_map/tests/clock.loft` measures twelve distinct
placements with an **off-axis** marker and keeps the six-way collapse as an explicit negative
control — *"so the test is measuring handedness rather than counting to twelve by construction."*
That is the shape every row below is being held to.

**The anti-exemplar is `player_physics.loft`:** 11 green tests, `make_flat_map()`, no walls. It
cannot detect tunnelling, parity or storey bugs *by construction*, so its green says the gate was
aimed elsewhere — not that the controller works.

---

## 2. The verdicts

**KEEP** — stays consumer-side content, never a library. · **PROMOTE** — moves library-side once
its gate is written and its control fires. · **RE-DERIVE** — the *shape* is worth keeping, the code
is not; rebuild on validated primitives. · **DELETE** — superseded by something already gated.

### `moros_map` — 870 lines, 76 tests

| routine | evidence today | verdict | the gate it must pass |
|---|---|---|---|
| `Hex` · `Chunk` · `HexAddress` | schema-checked by **hexbody's `palette.loft` on every run** (`X69`) | **KEEP, frozen** | none new — `L13` makes it the storage of record. It may not gain an eighth slot |
| chunk `get`/`set`/`ensure` | `negative_coords.loft` — 3 tests, signs only | **PROMOTE** | get/set across **both parities × both signs × a chunk boundary**; control: a parity-blind index must fail it (Q5) |
| `map_set_wall_dir` dirs 3/4/5 | none | **RE-DERIVE** | parity-blind by inspection (`STATE.md` #3). Rebuild on `hex_grid::hex_neighbor` **with** `hex_edge_corners` — `L11`/`X26`'s exact mode, never mixed with `hex_field`'s `nb_q`/`nb_r` |
| `map_write_field` / `map_read_field` | `field_io.loft`; tripwire **green for the wrong reason** | **RE-DERIVE** | never builds an `EdgeSet`, so walls are gone before the format sees them. Gate: a walled fixture survives write→read; control: the current writer must fail it (Q3) |
| `map_to_stencil` / `stencil_into_map` | `stencil_bridge.loft`, post-17-wall fix | **PROMOTE** *(in flight, #5)* | counts stated over the **whole layer, halo included** — a rim edge is owned by a cell outside the extent (`L10`) |
| `dir_hour` · `facing_*` · `hour_*` · `stencil_placed` | **`clock.loft`** — off-axis marker, twelve placements, mirror-axis collapse as negative control | **PROMOTE AS-IS** ✅ | **already passes all five.** The reference for everything else here |
| `slope_path` / `slope_band` | `slope.loft` | **PROMOTE** | integer lerp endpoints exact; control: a band width that must change the affected count and does |
| `spawn_*` · `routine_*` · `waypoint_*` | `spawn.loft` — 176 lines | **SPLIT** | the cell+facing **anchor** → `hex_anchor`; the creature/routine table → `moros_kit` (README §1) |

### `moros_editor` — 567 lines, 56 tests

| routine | evidence today | verdict | the gate it must pass |
|---|---|---|---|
| `UndoStack` · `batch_*` · `EditKind` | `undo.loft` (228 lines), `editkind.loft` | **RE-DERIVE into the journal** | it snapshots a `Hex` per edit, so it cannot express a model edit or an anchor edit — W0's round-trip obligation makes undo/save/replay **one** journal. Gate: undo of depth N is byte-identical across **both** halves |
| `StencilDef` + `stencil_to/from_json` | `stencil.loft` | **DELETE** | superseded by `hex_field::Stencil` + the HXF format |
| `stencil_stamp_with_undo` | — | **RE-DERIVE** | the library stamp has no undo bracket; that bracket is the real remaining work of #5 |
| `builtin_flat` · `house_small` · `spiral_stair` · `house_door` | `builtins.loft` (162 lines) | **KEEP** → `moros_kit` | content, not mechanism. ⚠ `house_door` must stop storing a door as material `0` (README §10.3) before it is trusted as a fixture |
| `stencil_save` | — | **RE-DERIVE** on the library path |  |

### `moros_render` — 1 372 lines, 163 tests

| routine | evidence today | verdict | the gate it must pass |
|---|---|---|---|
| `hex_to_world` · `hex_corner_world` · `world_to_hex` · `pick_hex` | `geometry.loft`, `picking.loft` | **PROMOTE after a cross-check** | a **second** implementation of `hex_grid` / `hex_field::hex_at`. `L11` says consult, never copy. Gate: 0 disagreements over both parities and both signs; control: perturb one side and it must fire |
| `emit_wall_quad` · `emit_thick_flat_wall` · `emit_thick_curved_wall` | `geometry.loft` vertex counts | **DELETE** | a second derivation of the wall, and `hex_draw::surface_quad` is gated to **1 quad, `eave_spread` 0, miter gap 0** (`X61`/`X62`). This is exactly `X26`'s class |
| stairs — linear · spiral · grand-arc | count assertions | **PROMOTE → `hex_entity`** | ⚠ **a vertex count is not a gate** (Q2). Needs an oracle: step rise × count = the height delta, exactly; control: an off-by-one step count must fail |
| `emit_item_placeholder` · `emit_cylinder_post` · avatar | counts | **PROMOTE → `hex_entity`** | same — an independent property, not `len(vertices)` |
| camera — orbit · pan · zoom · `camera_ray_dir` | `camera_modes.loft` | **PROMOTE** | pure math, low risk. Gate: ray → plane → hex round-trips to the picked cell |
| `ViewCone` · `Aabb` · `flag_occluders` | `occlusion.loft` | **PROMOTE after an oracle** | currently count-based; needs a brute-force reference over a sampled set |
| `dev_art_color` · `material_swatch` | `geometry.loft` | **KEEP** → `moros_kit` | a palette is content (seam rule 1) |
| `map_export_glb` | example only | **KEEP** | the only export path; gate: the header magic + a `gltf-validator` pass |
| `adversarial.loft` | 161 lines | **KEEP, and rename** | it probes **loft language features** (unary minus, closures, iterators, variant dispatch), not geometry. Valuable as a **toolchain canary**; misleading under a name that implies adversarial geometry |

### `moros_sim` — 788 lines, 148 tests

| routine | evidence today | verdict | the gate it must pass |
|---|---|---|---|
| `collide.loft` — `resolve_move` · `move_blocked` · `blocked_by_wall` | `collide.loft` tests + `edge_detect.loft` | **DELETE** | tunnels, parity-blind, `cy = 0` hard-coded (README §10.7–9). Replaced by `hex_edge::sweep_path` / `collide` / `passable`, gated by crawler's `sweeptest` / `edgetest` |
| `player.loft` — `player_step` | `player_physics.loft` — 11 tests, **no walls** | **DELETE and RE-DERIVE** | the *shape* is worth keeping: walk · strafe · normalised diagonal · hold-to-rise jump · gravity · terminal velocity · landing. Rebuild as `hex_walk` on `hex_edge` + a `hex_body` proxy. Gate: **no speed and no `dt` crosses a wall**, on a fixture that **has** walls, at both parities, on two storeys; control: the old instantaneous test at 5× speed **must tunnel** |
| `tools.loft` — `tool_apply` | `tool_apply.loft` (22 tests, incl. the door-house facings) | **SPLIT** | dispatch → `hex_editor` as a `ToolDef` table; the palette and the four tool names → `moros_kit` |
| `editor.loft` — `editor_tick` · `camera_apply_input` · `pick_hex_under_cursor` · `edit_at_hex` | `editor.loft`, `picking.loft`, `mouse_look.loft`, `camera_input.loft` | **SPLIT** | input→edit is `hex_editor`; the key bindings are the kit's (a consumer with six phones has no keyboard) |
| `input_from_keys` · `keys_pressed_since` · `input_from_snapshot` | `input_mapping.loft` (172 lines) | **PROMOTE** | the best-tested module here; gate: an edge-triggered key must not repeat while held (already asserted — add the control) |
| `editor_save_to_file` / `load_from_file` | `persistence.loft` | **RE-DERIVE** | must ride W0's journal, and must obey `L12` (`doc_write` **appends** — a fresh path per write, measured by content not size) |

### `moros_ui` — 879 lines, 46 tests

| routine | evidence today | verdict | the gate it must pass |
|---|---|---|---|
| `Rect` · `rect_contains` · `panel_rect` · `toolbar_button_rect` · `list_rect` · `status_rect` | `layout.loft`, `hit_test.loft` — boundary cases covered | **PROMOTE** ✅ | deterministic integer arithmetic, boundaries already asserted. **The lowest-risk promotion in the file**, and #7 says the Workbench needs exactly this layer |
| `panel_build` · `panel_hit_test` · `route_click` | `hit_test.loft`, `editor_click.loft` | **PROMOTE minus the palette** | the tool *names* and palette strings are the kit's; the routing is the library's |
| `editor_panel` · `editor_click` | `editor_panel.loft` | **PROMOTE** | ⚠ **precondition: the missing `loft.lock`** — this package cannot even parse today (README §10.1) |
| `font.loft` — 18 lines | — | **KEEP** | inspect; likely content |

---

## 3. The promotion protocol — the exact steps for one routine

Run per routine, never per module. Steps 2 and 3 are the ones that are skipped under pressure, and
they are the whole point.

1. **Name the item.** Write the one-line claim the routine must satisfy, in `SPEC`'s shape: the
   invariant, its violation condition. If it cannot be stated, it is not ready to move.
2. **Write the fixture that *could* fail** (Q3). A wall test needs walls; a rotation test needs an
   off-axis feature; a lattice test needs both parities and both signs. **Choose the fixture before
   the gate** — the fixture is what decides whether the gate can see anything.
3. **Write the control and watch it go red.** Perturb the routine in the exact way the defect class
   predicts, run it, and *see the failure*. Record what turned it red in the test's own comment.
   A control that cannot be made to fire is not a control.
4. **Fix what the control exposed**, if anything. Several rows above expect this — that is the
   point of doing it before the move rather than after.
5. **Move it**, tests travelling with it, into the package README's contract.
6. **Grep the sibling first** (`../crawler`) for any public name being added, and check both
   consumers green before calling the API change done.

---

## 4. Order of work — bound to the ladder's rungs

| rung | salvage | why then |
|---|---|---|
| **W0** flat plane + hills | `moros_ui` **lock** → the package parses · `moros_ui` layout/hit-test **PROMOTE** · `map_write_field` **RE-DERIVE** · `UndoStack` → the journal · `persistence` **RE-DERIVE** | the gate is red until the lock lands; the panel is needed for the first frame; and the round-trip obligation is armed at W0, so the document routines must be honest immediately |
| **W1** roads | `slope_path`/`slope_band` **PROMOTE** · chunk get/set **PROMOTE** (parity × sign) | the first content that sits on non-flat ground, and the first doorstep refusals |
| **W2** fences | `collide.loft` + `player.loft` **DELETE and RE-DERIVE** as `hex_walk` · `map_set_wall_dir` **RE-DERIVE** · wall emitters **DELETE** · `tools.loft` **SPLIT** · `input_mapping` **PROMOTE** | the first `EdgeSet` content, so the parity class and the walk queries land together — and the second wall derivation is paid off here |
| **W3** fields | `hex_to_world`/`pick_hex` **cross-check** · `ViewCone`/`Aabb` **PROMOTE after an oracle** | regions make picking and culling load-bearing |
| **W4** houses | `StencilDef` **DELETE** · `stencil_stamp_with_undo` **RE-DERIVE** · builtins → `moros_kit` (with the door fix) · **stairs** → `hex_entity` | the rung the library family was built for; stairs belong with the houses they sit in |
| **W6** decorative elements | `emit_item_placeholder` · `emit_cylinder_post` → `hex_entity` · `dev_art_color`/`material_swatch` → `moros_kit` | props are where sub-cell placement and the palette both land |
| **W7** vehicles | `avatar` emitters → `hex_entity` | the first posed bodies; the avatar is the simplest one |
| **W8** routines | spawn/waypoint **SPLIT** completes — anchor → `hex_anchor`, table → `moros_kit` | the payload-bearing anchors are authored here |
| any rung | `adversarial.loft` **rename** to a toolchain canary | independent and cheap |

---

## 5. What this ledger says, counted

**39 routines adjudicated: 12 PROMOTE, 8 RE-DERIVE, 6 DELETE, 7 KEEP, 6 SPLIT.**

Two readings worth carrying:

- **Only one routine family passes all five questions today** — the facing/clock work, because it
  was built with its negative control from the start. Everything else needs a fixture before it
  needs a decision, which is the honest cost of *"rich but largely unvalidated"*.
- **The deletions are concentrated where a gated equivalent already ships** — walls, collision,
  stencil storage. That is not waste: those routines taught us the shape, and the shape is what
  `hex_draw`, `hex_edge` and `hex_field` were built to. Deleting them is the family working as
  intended, not a loss.
