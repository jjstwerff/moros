# `26` — The blueprint editor: the plan view first

**Issue:** [`jjstwerff/moros#26`](https://github.com/jjstwerff/moros/issues/26) ·
**Value:** `F` · **Effort:** `H` (`B0` is the step in hand)

## Status

[BLUEPRINT.md](../../doc/claude/BLUEPRINT.md) is designed and **nothing of it is built**.
Four falsification probes have run — `B0p` withdrew its own premise, `B1p` measured the
palette round-tripping, `B2p` confirmed a 45° face claims its own edges, `B3p` split in
two — so the design's load-bearing claims are settled and the geometry is upstream's.
What is open is the editor, and its §0 decides the order: **the view before the
authoring**, because a plan view is the format the libraries get reviewed in.

`B0` is the field half: what the STORE holds, drawn. Nothing in this tree can show that
today — the only picture is a 3D render whose own defects are what a plan view is for.

## Goal

A plan view of a hex world: cells and their stored edges, drawn from a saved world into a
format a person can open, exact enough that what it draws can be compared against the
store digit for digit — and then the authored description beside it, so field and
description are in one picture.

## Anchors

- [`doc/claude/BLUEPRINT.md`](../../doc/claude/BLUEPRINT.md) — the design; §0 is the order
  of work, §1 the invariant, §2 the three wall types
- [`doc/claude/FORMAL_CORE.md`](../../doc/claude/FORMAL_CORE.md) §2.4.3 — *the canonical
  text must not become a second editor representation*; a blueprint is a **stencil's
  description**, authored then extruded
- [`doc/claude/EDITOR_DEFECTS.md`](../../doc/claude/EDITOR_DEFECTS.md) 4 and 5 — the wall
  drawn twice, and the copy a reload deletes. Plan [#24](https://github.com/jjstwerff/moros/issues/24)
  fixes it; this plan is how it gets **seen**
- [`probe/b0p`](../../probe/b0p/README.md) · [`probe/b1p`](../../probe/b1p/README.md) ·
  [`probe/b2p`](../../probe/b2p/README.md) · [`probe/b3p`](../../probe/b3p/README.md)
- Source: `lib/hex_mesh/src/planview.loft` (the view), `src/plan_view.loft` (the driver),
  `lib/hex_mesh/tests/planview.loft` (the gate)

## Invariant gate

The plan view's surface is exact — a mark is at a lattice corner pair or it is not — so
each phase states all three parts.

**`B0`**

- **Expected result.** For a world holding one edge, `wall_set(w, 3, 0, 0, WALL_MAT, …)`,
  the emitted view holds **exactly one** edge mark, and its two endpoints are
  `hex_corner_world(3, 0, 0, (6 - c) % 6)` for the corner pair
  `hex_grid::hex_edge_corners(0)` — the same two calls `hex_mesh` already makes for a
  doorway, to the digit.
- **Invariant.** *The view draws what the store holds and nothing else* — one mark per
  non-zero wall byte in the window, none for a zero byte, none for a cell outside it.
- **Negative control.** Four seeded faults must go **red**, not merely look wrong: the
  corner mirror `(6 - c) % 6` dropped, the slot→direction table permuted, a zero byte
  drawn, and the window's upper bound made inclusive.

⛔ **`B1`'s gate is RESTATED, and the correction is the library's own.** It read *a wall
authored at 15° emits a recovered line at 30°*, which compares HEADINGS — and
`wall_read_run` says at its own signature that the field stores no orientation, so the
answer comes back as `d24` **or** `d24 + 12` with the ends swapped: *"`read.d == d` is
therefore the wrong round-trip assertion; compare the ENDPOINTS."* Written as measured:

- **Expected result.** A run laid by the editor's own `run_between` from `(0,0)` towards
  `(6,0)` recovers to **its own two endpoints**, in either order, and the description
  drawn from it stays within **0.6 wu** of every mark it was recovered from.
- **Invariant.** *The description is `wall_read_run`'s answer, drawn in the field's own
  frame* — never a line fitted to the marks.
- **Negative control.** A gesture-style chain — anchor where the author stood, 15° off
  the lattice — must draw a description that **misses its own wall** by more than 0.6 wu.
  If that stray is small too, the picture cannot show a difference it does not have.

**`B2`** — **expected result**: the world key is byte-identical before and after emitting
a two-level view. **Invariant**: *the page offset never reaches the field*. **Negative
control**: an offset applied to the store must be refused by the same check.

**`B3`** has no exact-invariant surface beyond the pose it prints, which is `Walker`'s own
two floats.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`B0`** — the field, drawn: cells and stored edges from a saved world | M | `lib/hex_mesh/tests/planview.loft` — the emitted text parsed back and compared against a second, independent walk of the store; four seeded faults seen red | ✅ **SHIPPED** `6bc8144` |
| **`B1`** — the description beside it: the recovered run over the same window | M | `lib/hex_editor/tests/edges_mat.loft` + `lib/hex_mesh/tests/planview.loft` — the authored run's ENDPOINTS come back, the description stays within 0.6 wu of its own marks, a wandering chain's does not; four seeded faults seen red | ✅ **SHIPPED** `ba3af3c` |
| **`B2`** — levels side by side, offset in the page frame only (§3.4) | S | world key byte-identical across an emit; level 1's cells exactly `offset` from level 0's | Blocked on `B0` |
| **`B3`** — the author on the plan: pose and facing, from the walker | S | the drawn pose equals `wk_x`/`wk_z` at three stations of a committed script | Blocked on `B0` |
| **`B4`** — authoring at plan scale | — | not cut yet — a design may be rough until it becomes work | Deferred |

### Why `B0` is one phase and not two

- **Upper (safety).** Nothing is replaced: the view is additive, and its own test runs the
  emitted picture and the store side by side and compares them exactly. There is no
  moment where the only way to see whether it worked is to swap and look.
- **Lower (validity).** It goes red on its own for four real reasons, listed above, and it
  is **called** the moment it lands — `make plan-view` over a world the corpus already
  builds. Splitting *write the emitter* from *call it* would manufacture this tree's
  commonest defect on purpose.

⚠ **And `B0` deliberately stops at the FIELD.** The description half needs the run record,
which the save does not carry ([EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) 5) —
so `B1` is a different question with a different source, not the second half of one step.

## What `B0` turned up

**Shipped `6bc8144`.** `hex_mesh::plan_svg` + `src/plan_view.loft` + six tests;
`make plan-view WORLD=<name>`. The four seeded faults were each seen red on their own
row — the mirror dropped (2 failed), the slot table permuted (2), a zero byte drawn (3),
the window bound made inclusive (1) — with the control green either side of the sweep.

### ⚠ The first picture it drew found two things, and neither is what it was aimed at

`house.keys` is the oldest script in the corpus and the one every acceptance shot is
taken from. Drawn flat, its house is **27 floor cells with a closed wall around them —
and four wall edges that bound none of them.**

![the house of `house.keys`, drawn flat](../../doc/claude/img-house-plan-b0.png)

*Three black stubs hang off the corners and a fourth stray edge is the orange one below the
south wall — the window. `make plan-view WORLD=headless Q0=-7 R0=-8 Q1=5 R1=5`.*

| | |
|---|---|
| stray edges | `(-2,-6)` slot E · `(2,-4)` slot NE · `(-5,-1)` slot NE · `(-1,2)` slot E |
| what they touch | each shares **exactly one vertex** with the footprint, and no cell of it |
| how many | **four** — and the house has four sides |

⚠ **AND ONE OF THEM IS AN OPENING.** `house.keys` cuts two, and its own comment
records the day they finally landed — *"`opened profile 1 at (-2,1)` and `opened
profile 2 at (-1,2)` come back on the wire"*. Measured in the field: profile 1 bounds
floor cell `(-2,1)`; **profile 2 bounds nothing at all.** It hangs off a corner by one
vertex, which is why nobody saw it — a window at the corner of a house is exactly where
a window looks right.

⚠ **THIS IS NOT YET A DEFECT CLAIM, AND THE DIFFERENCE IS THE WHOLE PLAN.** A wall is a
straight RUN and a footprint is that run rasterised, so a stamp that over-runs the fill
at each corner may be drawing a wall that genuinely exists in the description and
genuinely bounds nothing in the field. **Which of the two is right is `B1`'s question**,
and it is the argument for `B1` rather than a bug report: the field half alone can say
*this edge bounds no room* and cannot say *and no wall was authored there*.

### ⚠ The gesture says 84 and the world holds 42

`place` acknowledges *"house placed 27 cells, **84** wall edges"*. The saved world holds
**42** non-zero wall bytes, counted over **every layer** rather than the drawn one — so
this is not the plan view looking at the wrong height.

They are different questions: `marked` counts what `wall_stamp` marked, and an edge is
stored once and read from both its cells. ⚠ **But this exact pair is the one that hid a
real defect** — `hex_editor.loft`'s own comment records `place_house` printing *84 wall
edges* while the store held **23**, two of the four walls destroyed, every suite green.
A number that cannot equal the store is a number no one can use as a health check, and
the plan view is the first thing here that draws the other side of it.

✅ **ANSWERED BY `B1`, AND IT WAS ALREADY WRITTEN DOWN.** `probe/l1` measured it a plan
earlier — *"`wall_stamp` writes every edge twice — 16 writes for 8 distinct edges …
every `marked` count this tree prints is double"* — so the two are one doubling and not
two questions. It is an assertion in the suite now rather than a sentence in a probe
write-up: `planview.loft` checks the drawn mark count against `m / 2`.

### What the instrument cannot see, said before it is trusted

- **One reference height per picture.** `plan_svg` takes a `ref` and draws the layer
  `edge_layer` selects for it — so a deck's fence and the yard below it are two
  pictures, not one. The driver defaults to the world's own ground default, and to `0`
  when it has none, which on a world with a cellar is **the cellar**.
- **The field only.** No run, no `rebuild`, no palette — `B1`.
- **It is not a gate.** The picture is for a person; the claims are the loft tests.

## What `B1` turned up

**Shipped `ba3af3c`.** `hex_editor::edges_mat` (the bridge `probe/l1` named and could not
put anywhere), `hex_editor::wall_recover` + `RunRead`, the dashed description in
`plan_svg`, and a caption that says which of three states the description is in. Four
seeded faults each seen red: the bridge writing nothing, the far end collapsed onto the
anchor, the triangle frame's axes swapped, and the caption's verdict hard-wired.

### ⚠ A house eight hexes away makes an unrelated wall unreadable

`tools/scripts/wall.keys` lays one wall west-to-east and then places a house at `(-8,-8)`.
The same window over the same wall, with and without that house:

| | marks | description |
|---|---|---|
| the wall alone | **10** | ✅ `run d0 p5` — the authored `(-4.3301, 0.5)`-`(4.3301, 0.5)` |
| the wall, with the house in the world | **11** | ⛔ `refused (11 marks)` |

![the wall, and the description recovered from it](../../doc/claude/img-wall-plan-b1.png)

![the same wall with a house eight hexes away](../../doc/claude/img-wall-plan-b1-refused.png)

**The eleventh mark is the short stub at the top left**, and it is one of the house's — the
same corner over-run `B0` found. It meets the wall's chain at a vertex, which makes three
marked edges at one point, and `wall_read_run` will not answer for a marking that is not a
path. ⚠ **So `B0`'s four stray edges are not cosmetic.** A structure eight hexes away
silently costs a wall its description, and nothing in this tree could see that before the
two were drawn together.

### Two things `probe/l1` wrote down, now pinned by tests rather than by prose

- **Every `marked` count this tree prints is double.** `lib/hex_mesh/tests/planview.loft`
  asserts the drawn mark count is exactly `m / 2` for the stamp's own return. That closes
  `B0`'s open pair — *the gesture says 84 and the world holds 42* was never two questions,
  it is one doubling, and the assertion is now in the suite.
- **A wandering chain is answered confidently, not refused.** `probe/l1`'s `P4` predicted
  `ok = false`; measured again at the new entry point, `wall_recover` returns `ok` with
  ends that are not the authored ones. The test says so, and says in its own message what
  it would mean if the library ever gained a path check.

### What the instrument still cannot see

- **One run per window.** `wall_read_run` asks *what run do these marks describe*, so a
  window holding a closed loop or two walls is refused whole. A house therefore draws no
  description at all — the caption says `refused (n marks)` rather than falling silent,
  because *no marks* and *marks the reader refused* are different facts.
- **No `rebuild`, no palette.** A wall type, a thickness, a bay — none of that is asked
  for yet; `wall_read_run` answers about a straight run and nothing else.

## Open questions

1. **Where does the view live once lavition splits?** It is in `hex_mesh` because that
   package already has the exact cone — `hex_voxel` for the store, `hex_proj` for the
   corners, `hex_editor` for the slot readers — and a package invented for one module is
   the speculative split plan 19 is already paying for. Decided by `B2`, which is the
   first phase that would need anything `hex_mesh` does not already have.
2. **Does the plan view belong in the running editor as a mode?** Not for `B0`: a file a
   person opens needs no server, no port and no tunnel, and the user is off-LAN. Revisit
   at `B3`, where the walker is on the plan and the two views want the same pose.
3. **What draws a wall's THICKNESS?** `@HB-X69` puts it in the palette, so the view must
   read `wd_thickness` through the palette rather than measure the cells. Untouched by
   `B0` — which draws edges, not bands — and it is the first thing `B1` will want.
