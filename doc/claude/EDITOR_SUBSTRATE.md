# Editor Substrate — the shared hex libraries the scene editor stands on

The scene editor is not a Moros-only tool. It draws the same hex world that
[crawler](https://github.com/jjstwerff/crawler) draws, and the geometry underneath it is
game-agnostic. This document is the **architecture reference** for that shared layer: which
packages exist, who owns each one, what may cross the seam, and what may not.

It replaces, on our side, loft's `doc/claude/lib_plans/73-universal-editor/` (the
"universal hex-world editor" plan, drafted 2026-05-27 with Moros as first partner). Moros
now owns this work; loft keeps its own state.

The **change** plans live in the tracker — see [plans/](../../plans/README.md). This file
is the durable truth, updated in place.

---

## Ground truth (verified 2026-07-22)

Four facts shape every decision below. All four are checkable, and two of them contradict
what our own docs say.

**1. The editor code exists — in loft's git history, not in this repo.** loft commit
`ade530c2` ("extract moros (#379)", 2026-06-14) deleted 66 files: `lib/moros_map`
(364-line source + 8 test files), `lib/moros_editor` (456 + 5), `lib/moros_render`
(1340 + 5 + 3 examples), `lib/moros_sim` (5 sources + 11 tests), `lib/moros_ui` (6 + 4).
Its commit message states the rule it applied — *shared → registry, game-specific → the
game's repo* — and routed "the moros-specific remainder" to **this repo**. That move never
happened; `moros/lib/` does not exist. The code is recoverable at `ade530c2^`.

**2. Four implementations agree on the hex convention; one of our documents does not.**
The deleted `moros_render.loft` computes `x = q·√3 + (r&1)·√3/2`, `z = 1.5·r` — **pointy-top,
odd-r offset, L = √3**. So does the shipped `hex_grid`, whose header calls it "the moros
convention". So does `hex_field`, which states the same centre map in exact integers and
notes it was "verified against the library before porting". So does crawler's `worldmesh`.
But [SCENE_MAP.md](SCENE_MAP.md) documents **flat-top** hexes, and the whole N/NE/SE
edge-ownership scheme is written against that reading. This is no longer a choice — it is a
reconciliation, and it reaches further than a label: the pointy-top direction set is
**E, W, NE, NW, SE, SW**, so our "each hex owns its N, NE and SE edges" rule names edges
that do not exist in the implemented grid.

**3. `hex_grid` already shipped, from crawler.** It is homed in
`loft-lang/loft-libs-world` beside `hex_world` (chunked storage) and `hex_terrain`. Its
whole point is that lattice math is implemented **once**. `gridmesh`'s convergence table
already lists `moros_render` as an expected consumer.

**4. crawler wrote our half of the contract first.** Its `EXTRACTION.md` § *The editor as
the second consumer* (2026-07-22) treats this editor as the second consumer that makes its
own extraction honest, and fixes the terms: new routines land library-side **now**, settled
crawler modules migrate **after** its plan #11 P2, the document format is a shared exact
invariant gated on both sides, and **no two copies, ever**.

---

## The package map

Names are underscored to match the shipped `hex_*` family. Boundaries follow crawler's
split (designed against gated code) rather than the earlier guesses.

| Package | Holds | Owner | Status |
|---|---|---|---|
| `hex_grid` | lattice ↔ world, neighbours, metric, corners, canonical edges, the 12-orientation cell basis, odd-r ↔ axial bridge | loft-libs-world | **shipped** 0.1.0 |
| `hex_world` | chunked cell storage: get/set, save/load, decay | loft-libs-world | shipped 0.1.0 |
| `hex_terrain` | terrain cells: material / height / water | loft-libs-world | shipped |
| `gridmesh` | chunk-local grid → mesh, spatial index, dirty rebuilds | loft-libs-graphics | shipped |
| `graphics` | GL bindings, Canvas rasterizer, `Mesh`/`Scene`/`Material`, GLB writer | loft-libs-graphics | shipped |
| `hex_field` | the field model: cell sets, labels, heights, the tracer, the validator — **and next**, stencils and the document format | crawler | **0.1.0**, branch `feat/hex-field-skeleton` |
| `hex_ways` | tracks, offsets, junctions — roads, rails, paths | crawler | designed, not started |
| `hex_forms` | the matcher, roofs, vaults, the profile × distance table | crawler | designed, not started |
| `hex_grow` | canopy partition, crown profiles, skeleton, pipe model | crawler | designed, not started |
| `hex_props` | primitives with axes, part-lists, seats, state | crawler | designed, not started |
| `hex_scene` | field → triangles → GLB, **and** the realtime view | crawler + us | designed, not started |
| `hex_editor` | tools, undo, selection, per-game hooks | **us** | not started |

Dependencies flow strictly downward: `hex_grid` is leaf; `hex_editor` sits on
`hex_field` + `hex_scene` + `shapes`; only `hex_scene` knows a renderer.

**A consumer takes what it needs.** The editor wants `hex_field + hex_scene + hex_editor`.
A farming game wants `hex_field + hex_grow`. Nothing forces the whole stack.

The Moros-specific remainder — palettes, item and creature registries, spawn points, NPC
routines, the campaign's meaning of material 5 — **stays in this repo**. It is content,
not mechanism.

---

## The five seam rules

These are the rules that keep the layer shared rather than merely copied. Each has already
cost someone a mistake.

**1. Mechanism library-side, content consumer-side.** *A library's enumerations are of
mechanisms and are closed; a consumer's enumerations are of things and are open.* In:
`mesh_door(w, h, seed)`, the canopy partition, the stencil format and its rotation. Out:
the *list* of item kinds, species tables, which building gets which prop, and which
stencils exist. crawler settled this once across prop kinds, species parameters and
stencils; we inherit the answer rather than re-deriving it.

**2. The metre never travels.** Every threshold the shared stack derives is dimensionless —
hex steps or pure ratios. crawler reads one hex step as 1.5 m; Moros reads it as ≈ 1 m
N–S ([SCENE_MAP.md](SCENE_MAP.md) § Hex Geometry). Both readings are *consumer* decisions
and both stay out of the packages. A library that ships a metre has shipped somebody else's
decision.

**3. Opaque integer IDs.** Materials, items, walls and creature kinds cross the seam as
`integer`. The substrate serialises `5`; the game decodes `5` through its own palette. A
save written by Moros and loaded by crawler yields nonsense, and that is intentional —
**the substrate owns the shape, the game owns the meaning.**

**4. Multi-layer is first-class, not opt-in.** `cy` is in every cell coordinate from the
field model upward. Retrofitting a vertical axis costs more than passing `cy = 0`.

**5. No two copies, ever.** If the editor needs something crawler has, it **moves** to the
package — it is never duplicated. Changes flow through the library repo's own gate and PR
loop, and an API change is done when **both** consumers are green.

---

## Lattice math is implemented once

`hex_grid` owns it. No package, and no part of this repo that runs loft, re-implements a
neighbour table, a corner offset or a world-position formula.

The family speaks two conventions on purpose, with `hex_grid` owning the bridge: **axial**
is the interchange and storage convention (parity-free, no `row & 1` branches in
algorithms); **odd-r offset** is the authoring and presentation convention (matches
row-major files and our documented overworld tooling). Conversion is a pure function at the
boundary.

Two invariants lock this and are test-enforced, not promised:

- **One position formula** — axial and offset forms produce bit-identical world positions.
- **Cross-language parity** — a shared fixture (sampled `(col,row) → (x,y)` pairs) is
  asserted by both `hex_grid`'s loft tests and our Python tooling, so the two
  implementations cannot drift silently.

### The lattice, concretely

`hex_field` states it in exact integers, and this is the form the editor should build
against:

```
   centre(q, r) = (k, m) = (2q + (r & 1),  3r)
   world        = (x, y) = (k · √3/2,  m / 2)
   corners      = (0, ±2), (±1, ±1)         as (Δk, Δm) from the centre
```

Cell centres satisfy `k ≡ m (mod 2)`. There is **no float in the geometry and no epsilon
compare**, which is what makes exact diff, exact undo and exact rotation possible.

Two consequences the editor inherits:

- Corners at `(0, ±2)` put a **vertex at top and bottom** and flat edges east and west —
  pointy-top, confirming fact 2 above.
- **The corner order is canonical and load-bearing.** `hex_field` orders corners so that
  consecutive indices bound one edge, matching `hex_grid::hex_corner_offset` and crawler's
  instanced floor, which is watertight only because of it. Downstream code reads corner `i`
  by index. Do not invent another ordering.

Hit-testing is already solved: `hex_at(px, py)` is the exact inverse of the centre map,
gated both to round-trip every cell of a chunk and to agree cell-for-cell with
`hex_grid::px_to_hex`.

Reconciling [SCENE_MAP.md](SCENE_MAP.md) with all of this is
[issue #3](https://github.com/jjstwerff/moros/issues/3).

---

## What the editor may rely on

The exact-integer lattice is what makes exact undo, exact diff and exact rotation possible
at all. The first four are **live in `hex_field` 0.1.0** and gated there; the fifth is
designed and lands with [issue #5](https://github.com/jjstwerff/moros/issues/5):

- cell centres **and** corners are integer lattice coordinates;
- the integer shoelace sum is a fixed multiple of the cell count — an outline and its cell
  set can never disagree;
- a 60° rotation is an **integer map**; six rotations are exactly the identity; reflection
  is exact, giving **12 orientations** with no resampling and no drift;
- the field validator's full list: loops closed · every segment a real hex edge · no
  zero-length segment · no repeated vertex · integral vertices · one outer loop, holes
  wound opposite;
- **stamping is merging two fields** — same level, nearest-wins arbitration; different
  levels, no contest at all. A stencil needs no new conflict rule.

A house stamped at 300° is the same house as at 0°, cell for cell — not a filtered
approximation of it.

**What `hex_field` 0.1.0 holds today:** `HexSet` (bounded-chunk occupancy), `Heights`,
`Labels`, the lattice and adjacency functions, `hex_at`, corner offsets, the tracer
(cells → exact integer loops), the shoelace, and `validate`. Deliberately *not* yet here:
`EdgeSet`, `Surfaces`, `Materials`, `Features`, the region cache and levels — those stay in
crawler while its kernel migration exercises them, and move once settled.

**The order the package lands in** — and therefore the order our plans run in — is stated
in its own README: **stencils first** (the first new work built *in* the package), **the
document format second** (it does not exist anywhere yet), the migrated modules last.

One structural note for the data-model question in
[issue #1](https://github.com/jjstwerff/moros/issues/1): `hex_field` keeps heights and
labels as **parallel arrays over the same chunk window**, not as fields on a cell struct —
"most of the world is flat and should not pay for a height it never reads". Our `Hex` packs
height, material, item and three walls into one 8-byte cell. Those are opposite choices,
and reconciling them is exactly what that issue's probe is for. `Heights` also stores a
**float** z where ours stores `u16` height units.

---

## The document format is the sharpest clause

A world or stencil written by the editor must load in crawler **bit-for-bit identically**.
So *round-trip = identity* is not the editor's private test — **it is the interface**. It
lives in the package with a gate that each consumer runs, and neither side may relax it
alone.

The format carries a magic marker, a schema version and explicit dimensions.
`src/realworld/region_io.loft` in crawler is the house pattern to follow. Versioning
policy: include the version; refuse an unreadably old file with an error; accept unknown
forward-compatible fields by ignoring them.

This is [issue #4](https://github.com/jjstwerff/moros/issues/4), and it is gated on both
sides before either side calls it done.

---

## Per-game hooks, not per-game subclasses

The substrate exposes callbacks the game supplies; it never exposes a base type the game
extends. loft has no classical inheritance, and function-typed parameters are the natural
extensibility surface — the game's hooks stay colocated with the game's state, with no
override-discovery problem.

The hook surface starts minimum-viable and grows only when a second consumer pushes on it.
A too-rich hook struct is a maintenance burden, and every hook added speculatively is one
nobody has yet needed.

The right test for a boundary violation: **a third game built tomorrow must not inherit
Moros's choices.** If the field model grows an `is_water(material)` helper, that is wrong —
water is a game-specific concept.

---

## Definition of Done, per package

Merges crawler's per-package DoD with loft's library checklist. A package is done when:

1. it imports no consumer — no Moros, no crawler, no content constants;
2. its gates ship with it and pass standalone in the package;
3. every derived threshold is dimensionless, with the metre interpretation documented as
   the consumer's job;
4. **a second consumer exists**, even a trivial one. A package extracted against exactly
   one caller has not been shown to be general. A ten-line example scene is enough, and it
   doubles as the docs;
5. the API stub (`.loft/api/<name>.api`) is committed, so the surface is readable in-tree;
6. the package README states its convention and its contract;
7. both consumers' gates are green — an API change is not done at merge, it is done when
   the last consumer is green.

Tests travel with the package. When a second consumer finds a bug, the fix and its
regression test land **in the shared package**, and the first consumer gets them for free.
That accumulation across consumers is the main return on the whole exercise.

---

## What stays out of the shared layer

- **The metre**, per seam rule 2.
- **Content enumerations** — which materials, item kinds, stencils, creatures and NPCs
  exist, per seam rule 1.
- **Moros's palettes, spawn records and NPC routines** — they encode campaign meaning.
- **Editor chrome** — the HTML shell, the three-column layout, the keyboard map. The
  *tools* generalise; the page does not.

---

## See also

| Topic | Document |
|---|---|
| Map data format | [SCENE_MAP.md](SCENE_MAP.md) |
| Rendering pseudocode | [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md) |
| Editor UI design | [SCENE_EDITOR.md](SCENE_EDITOR.md) |
| Editor build plan | [SCENE_EDITOR_PLAN.md](SCENE_EDITOR_PLAN.md) |
| Our loft package designs | [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) |
| Plan conventions and the tracker | [plans/README.md](../../plans/README.md) |
| crawler's extraction contract | `../crawler/EXTRACTION.md` § *The editor as the second consumer* |
| The hex family convergence plan | `../loft-libs-world/CONVERGENCE.md` |
| loft library authoring + checklist | `../loft/doc/claude/LIBRARY_AUTHORING.md`, `LIBRARY_CHECKLIST.md` |
