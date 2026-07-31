<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# HEX_STACK — the general design for the universal hex-world stack

**This document is the single authority for the stack's design.** Where any other document
disagrees, this one wins and names what it supersedes in [§2](#2-what-this-supersedes).

**Why it lives in moros, for now.** The stack is not a Moros feature — it is a universal
hex-world editor and its data libraries, of which Moros is the first consumer. It will
eventually move to its own project. It has **not** been split yet on purpose: the design was
spread across five documents that disagreed with each other, four representations of the same
data, and two implementations of most primitives. **Splitting a design that is not yet coherent
only makes deviation cheaper.** Consolidate, then split. This file is written to be moved — it
depends on no Moros-specific context and carries its own definitions.

**Status.** Written 2026-07-30. Every factual claim below was verified against the tree on that
date, not recalled. Claims that are *decisions* are marked as such; claims that are
*measurements* name what was measured; claims that are *open* are in
[§14](#14-open-decisions-and-asks).

---

## 1. The three invariants

Everything else in this document follows from these. They are stated first because every
placement, transport and validation decision below is derived from them rather than argued
separately.

> **I1 — THE STORE IS THE ONLY AUTHORITY.** One representation holds the world. It is the only
> thing written to disk and the only thing that crosses a network. It is addressed by chunk and
> carries a version.
>
> **I2 — EVERYTHING ELSE IS DERIVED.** Windows, stencil applications, meshes, collision sets,
> visibility sets. In memory only, computed from the store, deterministic, keyed to a store
> version, discarded on invalidation. **Never stored. Never transmitted.**
>
> **I3 — WRITES GO TO THE STORE IN PLACE.** Never through a derived form. A derived form is
> read-only by construction, so there is no commit path and nothing to keep in step.

### Why I2 is a rule and not an optimisation

A derived form that is *stored* or *transmitted* becomes a second authority, and two
authorities drift. That drift is not hypothetical — it is what this stack currently suffers
from, and [§2](#2-what-this-supersedes) is the list.

I2 has one hard obligation attached: **derivation must be deterministic and version-keyed, and
that must be test-enforced.** If two endpoints derive independently and either uses the result
for something shared — collision, a fit refusal, a validation verdict — then equal store
versions must produce byte-equal derived output, or the endpoints disagree silently. That is a
desync class, invisible until it bites, and it is the reason derivation lives in a library: a
library is the only place a test can pin *same version in, same bytes out* without a socket.

Invalidation needs no new mechanism. `world_is_stale(w, q, r, built_at)` already exists and the
editor already uses it to decide chunk mesh rebuilds. A derived window is valid for a store
version in exactly the same way — **one invalidation rule for every derived form.**

---

## 2. What this supersedes

Five documents disagreed. The disagreements are resolved here, per claim, so that none of them
can be read as still standing.

| source | claim | disposition |
|---|---|---|
| `lib_plans/73-universal-editor` | L2 `hex_map` is the map data shape | **superseded.** Realised as `hex_field`, which is a *derived window* (§4), not the world |
| `lib_plans/73-universal-editor` | L4 `hex_stencil` is a package | **shipped under another name** — `hex_field`'s `Stencil` |
| `lib_plans/73-universal-editor` | L3 `hex_render` is a package | **shipped under another name** — `hex_draw` |
| `LAVITION.md` W.3 | split `hex_walls` out of `wall.loft` | **shipped under other names** — `hex_edge` + `hex_shape`. The roadmap has not caught up |
| `LAVITION.md` W.7 | implement `hex_items` | **shipped under another name** — `hex_place` |
| `LAVITION.md` W.5 | implement `hex_terrain`, *"uses `hex_world` addressing"* | **partly open.** `hex_terrain` shipped as *procedural generation* (noise, fbm, hydrology, rivers). The *store-side authoring* half — a relief brush, scatter — is still missing and is the real W.5 remainder |
| `EDITOR_SUBSTRATE.md` § document format | `hex_field`'s `HXF1` is the interchange, round-trip identity is *the interface* (issue #4) | ⚠ **superseded by I2.** A window is derived, so it is the wrong thing to store. The *discipline* is kept and moves to the store format — see §6 |
| `EDITOR_SUBSTRATE.md` § document format | heights are `f64` so fractional heights survive | ⚠ **superseded.** See §6; the store already stores integers and the only 3D consumer truncates the fraction |
| `loft-libs-world` de-facto | the `HexSet`+`Heights`+`Labels`+`Layers`+`EdgeSet` bundle is the stack's basis | **superseded by I1/I2.** It is the basis for *crawler*, whose levels are bounded and 2D. For a streamed world it is scratch |
| earlier drafts of this design | "every tool becomes window → primitive → commit"; a six-phase order of its own | ⚠ **withdrawn.** Both were parallel inventions. §7 gives the correct rule, §13 uses the numbering that exists |

**What is NOT superseded and remains binding:**

- `CONVERGENCE.md`'s coordinate decision (§5) and its rule *"lattice math is implemented once,
  in `hex_grid`"*.
- `EDITOR_SUBSTRATE.md`'s **build beside, do not migrate**, its **asks, not tasks** boundary,
  its five target groups, and its per-package Definition of Done.
- `LAVITION.md`'s **anti-rename**: no brand prefixes on data libraries.
- `L15`: game state is not world state and is excluded from the world file.

---

## 3. Two data classes, and only one of them needs a server

The stack carries two kinds of data with almost nothing in common, and conflating their
transport is what makes people build servers they do not need.

| class | contents | volume | transport | server |
|---|---|---|---|---|
| **static world** | terrain, buildings, ways, edges, props, palettes, authored stencils | **huge** — this is the whole dataset | static blocks on object storage, pulled by key over HTTP Range, version in the URL | **none** |
| **dynamic state** | player and NPC positions, triggers fired, live co-authoring edits | small — events, not geometry | socket, small messages | yes |
| **derived** (I2) | windows, meshes, collision sets | regenerable | **neither** — computed on the side that needs it | — |

`L15` already drew this line for *storage* (game state is excluded from the world file). This
document extends it to **transport**, which is where its value is:

- The static world is **pulled, never pushed.** A client reads the blocks its viewport needs.
  There is no server in the read path at all.
- A socket is required only for dynamic state and for **live co-authoring** — two authors
  editing one world at once. Single-author editing needs no socket either; it writes locally.
- Therefore **the editor server is an authoring tool, not a distribution mechanism.** Its
  current role — holding the world and streaming meshes to a client — is an artifact of the
  meshes being derived *server-side*. Under I2 the client derives them, and the server's read
  role disappears.

---

## 4. The representation register

Four representations of the map exist in the tree. Under I1/I2 exactly one is the world.

| representation | where | shape | verdict |
|---|---|---|---|
| `Column` / `Layer` / `StoredHex` — chunked, `u16` heights above a floor, palette, edit clock `w_tau`, chunk versions, dressing, snapshots | moros `lib/hex_world` | sparse, chunked, versioned, streamable | ✅ **THE STORE.** The only shape with the three properties I1 requires: chunk addressing, a version, and sparsity |
| `HexSet` + `Heights` + `Labels` + `Layers` + `EdgeSet` | `hex_field` (shipped, tested) | **dense bounded window** | ✅ **DERIVED** (I2). Scratch and stencils only |
| `Cell { c_color, c_height, c_age }`, single-layer | published `hex_world` 0.1.1 / 0.1.2 / 0.2.0 | dense 32×32 chunks, 4-byte cell | ❌ **dead end.** A deliberately slim grid for TTT v5 and an audience-art demo — its own header says *"no separate Hex struct, no per-cell layer, no editor metadata"*. No material palette, no dressing, no edit clock. Zero dependents |
| `HexCell { material, height, item, walls, rotation }` + `cy` | plan 73 L2 sketch | multi-layer chunks | ❌ **never built.** Superseded by the store, which has everything it sketched plus versioning |

**Measured, so that the verdicts are not opinions:**

- `hexset_chunk(q0, r0, w, h)` allocates `vector<boolean>` of `w*h` — **every cell present**.
  The name says chunk; the thing is a dense window. Grepping `hex_field` for
  `stream|version|palette|dirty` returns **3 incidental matches in the whole package**. It has
  no chunk table, no paging, no version clock. It **cannot** be a streamed world.
- **No sibling package's primitive takes a `World`.** Not `hex_terrain`, `hex_way`,
  `hex_field`, `hex_draw`, `hex_edge`, `hex_form`, `hex_shape`, `hex_place`, `hex_roof`,
  `hex_fit`, `hex_recover`. A grep for `World` across the whole sibling tree returns only
  `hex_world`'s own accessors.
- **The published `hex_world` has no dependents.** No sibling library imports it; no published
  package declares it. Its only importers are its own tests and one loft multilib fixture.
- **moros `lib/hex_world` matches no published version** of `hex_world` — not 0.1.1, 0.1.2 or
  0.2.0. It is not a fork that drifted; it is a different library wearing the same name, and it
  is **not declared as a dependency anywhere** — the editor picks it up through `--lib lib/`
  path shadowing. Its consumers, everywhere: `src/editor_server.loft`.

### ⚠ The name

`hex_world` is defined by `LAVITION.md` as **the addressing primitive** — the grid, chunked
storage, save/load, iteration. Neither the demo grid nor the column store is *that*; both are
data models that took the name. The column store is the one that must move
([§12](#12-the-translation-table)) and it needs a brand-free descriptive name that is not
`hex_world`. **This is an open decision** (§14) because the name is held by a published package
in a tree we do not edit.

---

## 5. Coordinates — settled, and binding

From `CONVERGENCE.md`, unchanged and restated here so this document is self-contained:

- **Axial `(q, r)` is the interchange and storage convention.** Parity-free, so neighbour
  math, chunking and algorithms need no `row & 1` branch. Every cross-library API uses it.
- **Odd-r offset is the authoring and presentation convention.** Map files, rectangular level
  data, and crawler's internals. Converted at the library boundary.
- **The bridge lives in `hex_grid`**: `axial_to_offset`, `offset_to_axial`, plus axial twins of
  the lattice functions. The world-position formula exists **once**; the axial forms convert and
  delegate, so pixel output is bit-identical from either convention.

**The single rule: lattice math is implemented once, in `hex_grid`.** Every other package
consumes it; none re-implements a neighbour table or a pixel formula. Three copies of the
chunk arithmetic exist today (public in the sibling `hex_world`, private in `moros_map`, local
in the editor) — that is a known violation with an agreed destination, recorded as an ask.

---

## 6. Persistence and distribution

### The world must be PERSISTED AS A COLLECTION, not written out field by field

⚠ **The single highest-value finding of this design** — and stated precisely, because the
first version of this section got the diagnosis wrong.

**Nothing in this tree hand-rolls binary.** `world_save_as` uses loft's own **Binary File I/O**
— `file(path)`, `f#format`, and typed `f += (x as i32)`, which is `read_data`/`write_data` in
loft's storage layer using the store's own field encoders. Moros never touches a byte, and
calling it "hand-rolled" was a mischaracterisation.

The gap is a different one: **loft has two persistence facilities and the world uses the wrong
one.**

| facility | what it is | what it gives you |
|---|---|---|
| **Binary File I/O** — `file()` + typed `+=` | a chosen sequence of fields, read back by mirroring the sequence | whole-file read, nothing else |
| **a persisted collection** — a keyed `hash<T[key]>` in a Store, plus a `.dschema` layout sidecar | loft owns the layout | `store_load_key`, `store_load_keys`, `store_load_range`, `store_load_url`, `store_load_url_trusted` — key-addressed page reads and URL loading, working in wasm through the asyncify fetch bridge |

Measured, and it is the whole trick:

```
routing:  netherlands.roads.store   337,420,216 bytes
          netherlands.roads.store.dschema     632 bytes     ← makes the 337 MB keyed-readable
moros:    gate.hxw                         16,502 bytes
          (no sidecar)                                       ← so no keyed read exists
```

loft's docs are explicit that the working-set loader **checks the `.dschema` before any
schema-derived read**. `.hxw` has no sidecar because it was never written as a collection — so
it can only ever be loaded whole, cannot be usefully Range-served, and cannot be loaded from a
URL.

So **the world's on-disk form is a persisted keyed collection whose key is the chunk key** —
the same shape routing uses (`hash<PTile[tkey]>`). Partial reads, Range service and URL loading
are then inherited rather than built.

### One artifact, two access modes — mmap is the local case of Range

loft's Store is **mmap-backed** (*"a durable store is a normal mmap-backed `Store`"*). So the
same file, with the same `.dschema` and the same chunk keys, is reached two ways:

| | server, authoring | client, reading |
|---|---|---|
| access | **mmap** — the OS pages it in | **HTTP Range** — `store_load_keys` pages it in |
| unit | a page | a page |
| layout | the same `.dschema` | the same `.dschema` |
| resident set | the OS page cache | a byte-bounded LRU working set |

**There is no export step and no second format.** The artifact the editor authors *is* the
artifact clients read; publishing is uploading a file. That is the last piece that makes the
static distribution path (below) free rather than a pipeline to build.

Four consequences, and one hazard.

1. **The server's RAM stops being the world-size limit.** Today the world is
   `World { w_chunks: vector<Chunk>, … }`, resident in loft's heap, and the editable world is
   bounded by what `world_load` can read whole. Mapped, residency is the OS's decision — so a
   continental world is authorable on one box, which is the thing routing had to reach and the
   reason its blocks are ≤ 2 GB rather than "whatever fits".
2. **`world_save_incremental` stops being needed.** It exists *because* a sequential format
   cannot be partially rewritten — and it degrades to a full save whenever `!same_shape`. Page
   writes need no special path, so the special path and its fallback both go away.
3. **The derivation code is one code path, not two.** I2 requires that both endpoints derive
   byte-identically from equal versions. If the server reads pages by mmap and the client reads
   the *same* pages by Range, the window derivation above them is literally the same function —
   so I2's determinism obligation is satisfied by construction rather than by two
   implementations agreeing. **This is the strongest argument for the whole design.**
4. **`world_snapshot` is already the right primitive** for the publish step, and
   `world_chunk_version` / `world_is_stale` are already the right invalidation keys.

⚠ **The hazard: never serve a live mmap.** A client range-reading a file that is being written
gets torn pages — a half-old, half-new store with no error to report it. So: **author into a
live store, publish immutable versioned snapshots.** Routing's D5 (*version in the URL, a client
must never mix versions mid-session*) is exactly this rule seen from the client side, and it is
the one discipline the symmetry introduces.

### Serverless distribution — the proven precedent

`../routing` distributes a base map and road network at national scale to browsers **with no
server**, and its design is the model to copy rather than re-derive:

| | mechanism |
|---|---|
| format | *"exactly one on-disk format (the loft store) and one reader/writer (loft)"*. The client holds no bespoke format — no codec, no hand-rolled range machinery |
| hosting | static object storage with **Range + CORS**; the app shell on static pages. No server process |
| read | `store_load_keys(working_set, url, [key…])` — *"loft reads only the pages those keys touch."* **Never iterates a block** |
| index | the only authored artifact: bbox → block URL + version, **12–40 rows** |
| version | in the URL. A client must never mix versions mid-session |
| working set | bounded in **bytes**, LRU-evicted, so a long session cannot grow |
| blocks | per-region, ≤ 2 GB, regenerable individually so a hotfix is cheap |

Its measurements, for calibration: 283 km² = 205k features / 1.59M coords in **20.8 MB**;
extrapolated to Western Europe, **7–15 GB** of network and **44–88 GB** of base map.

**Four of its lessons that this stack currently fails:**

1. **"Tile counts explode before bytes do."** WE is ~600k network tiles and ~12M map tiles.
   *Anything that is per-tile rather than per-viewport is dead at that count, whatever it costs
   today.* The editor iterates a dirty set and streams by hex radius — the same trap, and
   unmeasured.
2. **Bound the working set in bytes, LRU-evicted.** The editor bounds by `DRAW_HEXES`, a
   radius. A radius is not a byte bound.
3. **Gate the seams at block scale.** Routing splits ways at tile borders and grid-snaps border
   nodes so neighbours merge exactly, with a gate proving it across tiles and extended to
   blocks. `WORLD_MODEL.md` has the same border-alignment concern and no gate at block scale.
4. **A gap in loft's read path is an upstream issue, not a workaround.** `loft#678` was filed
   when browser Range failed and fixed the same night.

And one principle worth adopting verbatim: **"ordering is a layout, not a format, so it stays
free to change."** Routing assumed Hilbert packing, *measured it worse*, and amended the
decision with no data migration.

### Heights are integers, and the unit is declared once

⚠ **Supersedes `EDITOR_SUBSTRATE.md`'s `f64` height decision.**

- The store already holds `h_height: u16` (absolute, above the world floor) and
  `sv_height: u16` (relative to chunk base), with **one** `w_unit: float` in the header saying
  what a step is worth. Every read is `as integer`.
- The store's own save already refuses to write even *that* float as a float:
  `f += ((w.w_unit * 1000000.0) as i32); // 'u' as micro-units, exactly`. The
  integer-plus-declared-scale pattern is already the shipped choice, in the same file.
- The interchange contract is **bit-for-bit round-trip identity**. Floats are the wrong carrier
  for an identity contract: `-0.0` versus `0.0`, NaN payloads, and any consumer that scales
  then unscales can emit a different bit pattern for the same height. An integer in declared
  units round-trips by construction.
- *"The consumer keeps its own unit"* is better served by declaring the unit **once** in the
  header than by implying it per cell.
- Rendered smoothness does not need stored precision: `corner_heights` averages three cells, so
  fractional rendered heights already come from integer stored ones.

**Decision: signed `i32` heights in declared units, the unit in the header.** Signed because
the interchange is *absolute* while the store's `u16` is relative to a floor, and the canonical
fixture deliberately carries a negative height. Range at the editor's 0.25-wu step: ±536,000 km.

### The interchange contract keeps its discipline and changes its anchor

`EDITOR_SUBSTRATE.md` is right that round-trip identity is *the interface* and not a private
test, and right that a single committed fixture read by both consumers is what stops two sides
drifting together. That mechanism is kept in full — magic marker, schema version, tagged
sections skippable by length, one canonical fixture, a gate on both sides.

It moves from `HXF1` to the store, because a window is derived (I2) and **the editor never used
`HXF1` anyway**: there is no `.hxf` file anywhere in the tree, everything on disk is `.hxw`, and
the only caller of `doc_write`/`doc_read` is `lib/moros_map` — the package already labelled a
predecessor of its target design.

⚠ **One open ask.** crawler is 2D, odd-r, with bounded levels — for which a window may
genuinely *be* authoritative rather than derived. If so `HXF1` is correct there, and the
moros↔crawler interchange becomes a **conversion at the boundary** rather than a shared format.
This is the one place I1/I2 may not generalise, and it is not ours to settle (§14).

---

## 7. Where each operation goes

The rule that replaces the withdrawn "every tool is window → primitive → commit":

| operation shape | example | goes through |
|---|---|---|
| **unbounded, incremental, in place** | raise terrain, paint a material, place a prop, lay a way along the live world | **store primitives** (I3) |
| **bounded, shape-defined** | stamp a stencil, fill an enclosure, validate a boundary, trace a ring | **derived `hex_field` window** — the operation is already bounded by its own definition |
| **crosses a consumer boundary** | publish a region, hand a world to another game | **the store file** (§6) |

This is also *why* the editor grew a private copy of most primitives rather than being
careless: **the primitives it needs most are in the first row, and the stack only ever offered
the second.** The genuinely missing work is store-side authoring primitives — which is exactly
what `LAVITION.md` scheduled as the remainder of W.5.

---

## 8. The layering

```
                        hex_grid            geometry: both conventions + the bridge. NO deps
                       /        \
              THE STORE          gridmesh   chunked meshing (graphics chunk)
             (chunk+version,        |
              sparse, versioned)    |
                  |                 |
      derived windows (hex_field) ──┘        scratch + stencils. NEVER stored, NEVER sent
                  |
   hex_way  hex_form  hex_shape  hex_edge  hex_draw  hex_place  hex_roof  hex_fit  hex_recover
                  |                                            pure primitives over a window
                  |
        edit      view      ui      actor                       the editor groups
                  |
     consumers: moros (3D) · crawler (2D odd-r) · dryopea/lavition (3D axial)
```

**Dependency rules.** `hex_grid` depends on nothing. The store depends only on `hex_grid`.
Window primitives depend on `hex_grid` and the window types, **never on the store** — that is
what keeps them pure and testable without a clock. The editor groups depend on the store and
the primitives. No package depends on a consumer.

---

## 9. The package register

### Shipped, and what each owns

| package | owns | must not own |
|---|---|---|
| `hex_grid` | the lattice: both conventions, the bridge, neighbours, distance, corners, canonical edges | anything with data in it |
| `hex_field` | the derived window types (`HexSet`, `Heights`, `Labels`, `Layers`, `EdgeSet`), the `Stencil`, and bounded algorithms over them — `trace`, `validate`, `shoelace`, stamping, discs | **persistence, versioning, chunking, the wire.** All four are the store's |
| `hex_way` | a way as a centreline: `Track`, straights, arcs, offsets, parameterisation, arc-length, stamping a band | what a road *means*; the store |
| `hex_form` | the shape algebra: `Form`, `Plan`, headings, closure, admissibility, fills, canonical forms | geometry (that is `hex_grid`) |
| `hex_shape` | boxes, arcs, walls as runs, snapping to the 24 headings, flood-outside, connectivity, leak counting | edges as data (that is `hex_edge`) |
| `hex_edge` | edges as data and the queries over them: surfaces, materials, junctions, features, `sweep_path`, `collide`, `passable`, `sight_clear` | what blocks a *camera* versus a *walker* — that is configuration |
| `hex_draw` | surfaces and the emitters: floors, walls, openings, roofs, band corners, miters, spans | the mesh container; culling |
| `hex_place` | placement and seating: unions, cuts, seat heights with residuals, poses, disc hits | what an item *is* |
| `hex_roof` | roof forms and their fits: cone, ridge, hip, dome, vaults, clear height, eave spread | when a roof is *wanted* |
| `hex_fit` | refusal with a reason: fit codes, reasons, offers, residuals | the operations being refused |
| `hex_recover` | rebuilding a form from a field, digests, exactness, normalisation, indices | the field itself |
| `hex_terrain` | procedural terrain: noise, fbm, ridges, detail, hydrology, rivers, lakes, sampling | the store; authored edits |
| `hex_body` | rigs, joints, bones, OBBs, wheel roll | what a body *does* |
| `hex_world` (published) | *nominally* the addressing primitive; *actually* a slim demo grid | — see §4; it is a dead end with no dependents |

⚠ **Ten of these fourteen appear in no roadmap.** `loft-libs-world`'s own README lists four
packages (`hex_world` shipped; `hex_walls`, `hex_terrain`, `hex_items` planned) while the tree
holds fourteen. The register above is the tree, which is the authority, because it is code with
tests.

### Missing, and therefore to be built

| what | why it does not exist | home |
|---|---|---|
| **the store, as a general package** | it exists as moros `lib/hex_world`, inside one consumer | the **world** group (#8), built beside |
| **store⇄window derivation** | nothing owns the seam, because two `hex_world`s diverged and neither claimed it | with the store |
| **the store as a persisted collection** (§6) | the sequential file facility was used instead of the collection one | with the store |
| **authored relief brush** (`raise_at`) | `hex_terrain` generates; nothing authors | `hex_terrain` (W.5 remainder) |
| **density scatter** | — | `hex_terrain` or `hex_place` |
| **the camera solve** | already recorded as a group with no home | the **view** group |
| **undo / redo / batches** | already recorded as a group with no home | the **edit** group |

### The editor groups

Unchanged from `EDITOR_SUBSTRATE.md`, restated for self-containment: **world** (the store),
**edit** (undo, tools, the loop), **view** (camera, picking, culling), **ui** (widgets, layout,
hit-testing), **actor** (the player, movement, collision resolution, the rig). `ui` depends on
nothing and is the best first test of the extraction bar; **world** depends only on the lattice,
which is why it leads.

---

## 10. The primitive catalogue

What already exists, by role. **Nothing here needs writing, and this is the list any new code
must be checked against first.**

| role | primitives |
|---|---|
| occupancy, heights, labels, layers, edges | `hexset_*`, `height_set/get`, `label_set/get`, `layers_*`, `layer_add/set/get/set_at/get_at`, `edgeset_*`, `edge_set_mat/surf/both`, `edge_mat/surf`, `edge_key` |
| stencils | `stencil_from`, `stencil_stamp`, `stencil_stamp_layers`, `stencil_stamp_all`, `stencil_stamp_edges`, `stencil_rotate`, `stencil_mirror`, `stencil_rotate_deg` |
| discs, circles, rings, lines | `form_hexdisk`, `hexdisk_into`, `form_circle`, `form_octagon`, `box_fill`, `box_ring_in/out`, `arc_fill`, `line_hexes` |
| ways | `track_new/straight/arc`, `track_offset`, `offset_legal`, `way_stamp`, `way_mark`, `way_steps`, `track_distance`, `seg_param`, `way_param`, `cut_arb` |
| terrain generation | `terrain_new`, `terrain_fbm`, `terrain_vnoise`, `terrain_ridge_at`, `terrain_detail_at`, `terrain_hydrology`, `terrain_relief_pass`, `terrain_surface_at`, `terrain_lake_field`, `terrain_water_at`, `terrain_rivers`, `terrain_sample`, `terrain_blend_h` |
| buildings and roofs | `draw_floor`, `draw_walls`, `place_opening`, `grow_ring`, `draw_roof`, `surface_*`, `roof_cone/ridge/hip/dome`, `vault_*`, `clear_height`, `eave_spread`, `roof_plane_fit`, `roof_eval` |
| shape algebra | `form_new/write/canon/read/eq`, `form_closes`, `form_admissible`, `form_fill`, `plan_holds`, `plan_to_world/local`, `side_edges`, `tri_cells`, `hexagon_cells`, `rhombus_cells` |
| walls and snapping | `wall_new`, `wall_snap_p`, `snap_run_d24`, `snap_run_p`, `wall_run_ok`, `wall_separates`, `wall_offset_signed`, `wall_chain_ends`, `flood_outside`, `leak_count`, `set_connected` |
| collision and sight | `sweep_path`, `collide`, `passable`, `edge_block`, `edge_blocked`, `edges_cut/solid/halfplane`, `sight_clear`, `surfaces_*`, `materials_*`, `junctions_*`, `features_*` |
| placement and seating | `field_union`, `combine_cut`, `combine_cut_level`, `kappa_at_level`, `seat_height/residual/write`, `pose_*`, `disk_hit`, `arb_solid/owner` |
| refusal with a reason | `fit_reason`, `mat_fits`, `level_fits`, `seat_fits`, `height_units`, `feature_fits`, `arc_fits`, `draft_*` |
| lattice | `hex_to_px`, `px_to_hex`, `hex_round`, `hex_neighbor`, `hex_distance`, `hex_corner_px`, `hex_edge_corners`, `hex_canon_edge`, `cell_*` |
| validation and recovery | `trace`, `validate`, `shoelace2`, `wall_count`, `edgeset_digest`, `rebuild*`, `field_digest`, `field_exact`, `field_norm` |
| rigs | `rig_*`, `joint_*`, `bone_obb`, `pose_of`, `wheel_value/angle/skid` |
| the store | `world_new`, `world_column`, `world_set_column`, `world_set_dressing`, `world_cell`, `world_snapshot`, `world_save/load`, `world_chunk_version`, `world_is_stale` |
| loft's durable store | `store_load`, `store_load_key`, `store_load_keys`, `store_load_range`, `store_load_url`, `store_load_url_trusted` |

---

## 11. The seams

| seam | contract |
|---|---|
| **store ⇄ window** | a **pure derivation**, read-only, version-keyed. No commit half (I3). Deterministic: equal version in, byte-equal window out, test-enforced |
| **the palette** | the *mechanism* is the library's; the *meanings* are the consumer's. A library never interprets a material id |
| **configuration, not subclassing** | which tools exist, what a material means, what counts as a view-blocker: all supplied by the consumer |
| **game state** | excluded from the world entirely (`L15`), and therefore from the static class (§3) |
| **the file** | one format, the store's, with round-trip identity gated on both sides (§6) |
| **the wire** | the store by chunk and version, plus dynamic state. Never a derived form |

---

## 12. The translation table

What is misplaced, where it goes, and — critically — **whether it is ours to move.**
`loft-libs-world` is another agent's working tree; a staged file lands in someone else's
uncommitted work. Those rows are **asks, not tasks.**

| misplaced | proper place | operation | ours or an ask |
|---|---|---|---|
| moros `lib/hex_world` — the column store | the **world** group (#8) | **build beside** under a brand-free name that is not `hex_world` | **ours** — one consumer, one `use` line |
| the store's `.hxw` sequential writer | a persisted keyed collection (`hash<Chunk[key]>`) with its `.dschema` | rewrite (§6) — the encoding is already loft's; the *facility* is wrong | **ours** |
| `editor_server.loft` — `stencil_place` | `stencil_stamp_all` | **delete** once reachable; superseded, not moved | ours |
| — `road_lay`, `road_stamp` | `track_straight` + `track_offset` + `way_stamp` | delete | ours |
| — `snap_heading` | `snap_run_d24` / `snap_run_p` | delete | ours |
| — `fence_disc`, `fence_count` | `hexdisk_into` + `edge_set_mat` + `wall_count` | delete | ours |
| — `field_fill` | `flood_outside` + `trace` + `validate` | delete | ours |
| — `walk_to`, `stand_clear` | `sweep_path`, `sight_clear`, `edge_blocked` | delete | ours |
| — `edges_around`, `edge_owner`, `wall_of`, `wall_set` | `edge_key`, `edge_set_mat`, `edge_mat` | delete | ours |
| — `corner_heights`, `cell_normal`, `emit_hex_sloped`, `emit_tri`, `chunk_mesh_mat`, `chunk_mesh_props`, `emit_wall_panel`, `emit_run_wall` | `hex_draw` | delete | ours |
| — `roof_height` | `roof_cone` / `roof_hip` / `clear_height` | delete | ours |
| — `fit_ok`, `fit_ordinal`, `fit_nominal`, `fit_text`, `probe_fit` | `hex_fit` | delete | ours |
| — `storey_add` | `combine_cut_level` + `seat_write` | delete | ours |
| — `terrain_h`, `terrain_y`, `terrain_set`, `col_top`, `col_low` | the store's accessors + derived `Heights` | delete | ours |
| — `brush`, `scatter` | `hex_terrain` (W.5 remainder) | **build beside**, then ask to adopt | ours to build |
| — `cam_free_dist`, `cam_free_arc`, `cam_clear_at`, `cam_pitch_target` | `sight_clear` + the **view** group | build beside | ours |
| `lib/moros_*` general names | the five groups, per the ownership audit | build beside | ours |
| three copies of the chunk arithmetic | `hex_grid` | delete two | **ask** |
| `wall.loft` inside published `hex_world` | `hex_edge` / `hex_shape` | move | **ask** |
| published `hex_world`'s `Cell` | superseded, or narrowed to what it is | decide | **ask** |
| `HXF1` as interchange | the store format; `HXF1` stays crawler-internal if its window is authoritative | decide | **ask** |

**Survives in the editor, because it genuinely is the adapter:** message parse and dispatch,
the wire encoders (`mesh_wire`, `mat_wire`, `frame_wire`, `fog_wire`, `ramp_wire`),
`read_index` / `read_client` / `hostname` / `build_id`, the dirty set, and `world_path`.

For scale: `src/editor_server.loft` is **4,238 lines, 89 functions, and a `main()` of 1,228
lines carrying 30 message handlers inline.** Most of the table above is inside that one file.

---

## 13. Order of work

**No new phase numbers.** The sequence the existing documents already imply, with the one
genuinely new prerequisite first.

| # | step | authority | done when |
|---|---|---|---|
| 1 | **Name the store package** and move it out of `lib/`, built beside, depended on by path as `moros_sim` already does for `hex_body` | §4, §14 | `lib/` holds only moros configuration; 23 gates green |
| 2 | **`hex_grid` 0.2.0 — the axial↔offset bridge** | `CONVERGENCE.md` step 1 | round-trip identity; the third copy of the chunk arithmetic retired |
| 3 | **Persist the world as a keyed collection**, chunk key as the key | §6 | a `.dschema` exists beside it; the server *maps* it instead of loading it whole; `store_load_keys` reads one chunk without touching the rest; a URL load works in wasm; `world_save_incremental` deleted |
| 4 | **Store⇄window derivation**, pure and version-keyed | §11 | equal version ⇒ byte-equal window, test-enforced |
| 5 | **Store-side authoring primitives** — `raise_at`, scatter | W.5 remainder | the editor's `brush`/`scatter` deleted |
| 6 | **Supersede the editor's duplicates**, one tool at a time; stencil first | §12 | each deletion proved by an unchanged gate and a new library test |
| 7 | **The static distribution path** — blocks, a tiny index, version in the URL, a byte-bounded LRU working set | §6, routing's D1–D11 | a client renders a region with **no server running** |
| 8 | **Raise the asks** | §12, §14 | each ask filed with its evidence |

---

## 14. Open decisions and asks

**Decisions that are not mine to take:**

1. **The store package's name.** Brand-free and descriptive; `hex_world` is held by a published
   package with a different model and zero dependents. Either the store takes a new name, or it
   supersedes `hex_world` and the demo grid narrows to what it is. The second is cleaner and
   costs coordination in another tree.
2. **Whether `HXF1` remains crawler's authoritative format.** If crawler's bounded 2D level is
   genuinely authoritative as a window, I1/I2 do not generalise there and the interchange
   becomes a conversion. This is the only identified place the invariants may not hold.

**Asks, with their evidence ready:** the chunk-arithmetic convergence; `wall.loft`'s home; the
published `hex_world`'s disposition; the `HXF1` anchor.

**Unmeasured, and the instrument named:** this stack has **no sizing measurement at all** for a
large world — no equivalent of routing's coverage-probe walk. Before step 7, walk a shipped
`.hxw` and report bytes per chunk, chunks per km² of authored world, and the byte cost of a
viewport. Routing's own note applies: *the density factor is a guess and it is the single
biggest unknown* — replace it with a measurement, and every derived number moves with it.

**Blocked upstream:** loft's `World`-through-boundary defects
([#670](https://github.com/loft-lang/loft/issues/670),
[#677](https://github.com/loft-lang/loft/issues/677),
[#682](https://github.com/loft-lang/loft/issues/682)) bite exactly the pattern steps 3–5 need —
passing a store across a library boundary, and lambdas capturing it. No lambda may capture the
store until #682 lands.

---

## 15. Two rules this design exists to enforce

1. **No new routine, package, format, or phase number without checking what exists.**
   `lib/*/src`, `../loft-libs-world/*/src`, `LAVITION.md`, `CONVERGENCE.md`, plan 73, and
   `../routing` for anything about distribution. This document's own author broke it four times
   in one session: a hand-written arc-length interpolation in a gate while `hex_way` had
   `track_distance` / `seg_param` / `way_param`; four gates re-deriving `√3` cell centres that
   `hex_grid::hex_to_px` provides; a six-phase order invented beside `W.3`–`W.8` and `L1`–`L6`;
   a "store⇄bundle adapter with a commit half" that I2 makes wrong; and calling loft's own
   Binary File I/O "hand-rolled", when the real fault was using the sequential facility instead
   of the collection one.
2. **A claim is validated where it lives.** A gate over a socket proves the *wire* still exposes
   a feature; it must never be the only place the feature is checked. Structural claims are pure
   library tests — which is also the only way to test them without a clock. A full day was spent
   this week paying for the alternative: eight gates pacing by fixed sleeps, one of them failing
   three runs in four, and three live defects that only a clock-free probe could see.

---

## See also

- [`EDITOR_SUBSTRATE.md`](EDITOR_SUBSTRATE.md) — seam rules, the five groups, per-package
  Definition of Done, the ownership audits. **Design decisions here override it.**
- [`WORLD_MODEL.md`](WORLD_MODEL.md) — the store's normative contract: the voxel, columns,
  layers, windowed heights, fold-freedom, border alignment.
- `loft/doc/claude/LAVITION.md` — brand, naming, the W-series, the anti-renames.
- `loft/doc/claude/lib_plans/73-universal-editor/` — the original architecture; L-numbering.
- `loft-libs-world/CONVERGENCE.md` — coordinates, layering, the asks.
- `../routing/PLAN-STORE.md`, `PLAN-SCALE.md`, `PLAN-TILES.md` — the serverless distribution
  precedent, measured.
