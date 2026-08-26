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

**`B4a`** — **expected result**: for every cell of a two-level window, the page point at
that cell's own centre picks **that cell**, on the panel it was drawn in. **Invariant**:
*page → cell is the exact inverse of the placement `B2` declared* — one pitch, one origin,
no second derivation of either. **Negative control**: three points must be **refused with a
reason**, never snapped to the nearest cell — one in the gutter between panels, one in a
panel's margin outside the window, and one left of the page entirely (where truncating
division would otherwise answer *panel 0*).

**`B4b`** — **expected result**: the world key after authoring at a picked spot equals the
key after the same verb authored by standing there. **Invariant**: *a pick is a TARGET, not
a teleport* — the `Author` is built at the picked spot and the walker does not move.
**Negative control**: a pick that lands on no panel must author **nothing**, and the world
key must be unchanged.

**`B4e`** — **expected result**: a script that declares two edge types and chooses each in
turn leaves a world holding **two distinct edge bytes**, drawn at the two thicknesses those
declarations state. **Invariant**: *an edge byte is a palette slot, so what a wall IS is
one question — `edge_is_wall` — and a chosen type is a wall everywhere, not only where it
is painted.* **Negative controls**: a session that never chose stamps `WALL_MAT`, so every
script in the corpus keys the same world; a door cut into a chosen type must consume
exactly one of its edges; and a slot a world stamped but **declared nowhere** must still
draw magenta, or the picture has simply stopped reading the palette.

**`B4f`** — **expected result**: a run laid at a type its world declares **0.4 across is
built 0.4 across**, measured off the emitted mesh rather than off the function that
decides it, and the plan paints that same number. **Invariant**: *the palette decides
which half-width a wall id resolves to* — BLUEPRINT §3.3's own sentence — so there is
**one** resolver, `hex_editor::wall_half`, read by the mesher and by the picture, and no
width chosen at a drawing site. **Negative controls**: a wall no world declared must
still be built at the family band, which is what keeps every world the corpus keys
unmoved; a type stating **no** thickness and one whose declaration is **damaged** must
both take that same default rather than a wall of no width at all; and `run_wall` asked
for a different half must give a different strip, or nothing here is reading the number.

**`B4h`** — **expected result**: the rim `B4g` stamps recovers to its own centre and its
own shell, and the plan draws that as a circle where the run reader gave up.
**Invariant**: *a disc is `(centre, shell)`, so it is GENERATED and compared to the field
edge for edge* — `FORMAL_CORE` §6's R1 regime, never a circle fitted to marks (§6.1).
**Negative controls**: a straight run and a rim with one edge missing must both be
refused — and deliberately **not** a hexagon, because at `12R²` a hexagon genuinely IS a
disc and demanding its refusal would be demanding the wrong answer; a disc with a wall
across it must be refused too, which is the half a one-directional check cannot see; and
the drawn radius must lie inside the band its own rim's edge midpoints span, or the
description misses the wall it came from.

**`B4g`** — **expected result**: a gesture rings the author with a rim whose cells are
exactly `hex_shape::arc_fill`'s disk — every edge between a member and a non-member
stamped, no interior edge stamped — and the disk recovers to the author's own cell and
its own shell. **Invariant**: *the round shape is the library's, never ours* — `arc_*`
in exact integers, and `@HB-X49`'s round tower rim is what `THICK_CURVED` names.
**Negative controls**: at shell 36 the rim must **differ** from the hexagon `fence_disc`
builds, because a disk IS that hexagon at exactly the shells `12R²` and a fixture that
picked one of those would be green on a gesture that never called `arc_fill`; a number
naming no shell must be **refused with the nearest one**, since the library draws the
shell below without a word; and the rim must carry the material it was handed, read back
as a byte.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`B0`** — the field, drawn: cells and stored edges from a saved world | M | `lib/hex_mesh/tests/planview.loft` — the emitted text parsed back and compared against a second, independent walk of the store; four seeded faults seen red | ✅ **SHIPPED** `6bc8144` |
| **`B1`** — the description beside it: the recovered run over the same window | M | `lib/hex_editor/tests/edges_mat.loft` + `lib/hex_mesh/tests/planview.loft` — the authored run's ENDPOINTS come back, the description stays within 0.6 wu of its own marks, a wandering chain's does not; four seeded faults seen red | ✅ **SHIPPED** `ba3af3c` |
| **`B2`** — levels side by side, offset in the page frame only (§3.4) | S | `lib/hex_mesh/tests/planview.loft` — the world key is unmoved by an emit (checked against a mutation), the same cell has identical `points` in every panel, the panels do not overlap, and the two levels are not the same picture; four seeded faults seen red | ✅ **SHIPPED** `0c35614` |
| **`B3`** — the author on the plan: pose and facing, from the walker | S | `probe/plan` — three stations of a committed script, `feet` against the marker READ BACK out of the picture, with a control that the three differ; four suite faults and the probe's own seen red | ✅ **SHIPPED** `9d81b93` |
| **`B4a`** — page → cell: the inverse of the panel transform, refusing what is on no panel | S | `planview.loft` — round trip over all 338 cells of a two-level window; the gutter, the margin, past-the-end and a point left of the page each **refused** with a reason; four seeded faults seen red | ✅ **SHIPPED** `e70efbf` |
| **`B4b`** — a gesture from a picked spot, with the walker left where it is | M | `probe/plan` rows D–F — picked and stood-on key one world, the walker does not move, a pick off the page authors nothing; the teleport seen red | ✅ **SHIPPED** `e70efbf` |
| **`B4c`** — the picked spot drawn back, so you can see what you are about to author | S | `planview.loft` — the highlight's outline is the cell's own **byte for byte**, the cross is the point asked for and not the snap, both marks survive an author on the same panel; `probe/plan` row G; four faults seen red | ✅ **SHIPPED** `e24a9b0` |
| **`B4d`** — wall TYPE and thickness, from the palette (§3.3) | M | `wall_type.loft` — a type round-trips through the encoder name/body/thickness identical; a damaged one is refused and an unknown BODY is carried; `planview.loft` — the wall is painted at the thickness its type declares; four faults seen red | ✅ **SHIPPED** `6e756c0` |
| **`B4e`** — a gesture that stamps a CHOSEN wall type, so two can stand in one world | M | `wall_type.loft` — the chosen slot is the byte the verb writes, two declared types stand in one world, a chosen type stops a walker and takes a door, the vocabulary's own bytes refused by name; `planview.loft` — a declared type drawn as a wall at its own width and an undeclared one still loud; `probe/plan` row H and `probe/s2c/walltype`; five faults seen red | ✅ **SHIPPED** `10337dc` |
| **`B4f`** — the declared thickness reaches the GEOMETRY, so the plan and the build are one number | S | `wall_type.loft` — the resolver's four answers (declared, undeclared, damaged, states-none); `hex_mesh/tests/wall_thick.loft` — the band measured off the EMITTED mesh, and the plan's stroke against it; `run.loft` — a different half gives a different strip; five faults seen red | ✅ **SHIPPED** `34cec07` |
| **`B4g`** — a ROUND enclosure: the tower rim, from `hex_shape::arc_fill` | M | `tower.loft` — the boundary is the disk's and only the disk's, the centre and shell recover, a non-shell is refused with an offer, the rim carries its material, and the `12R²` coincidence is asserted before it is relied on; `probe/s2c/tower`; five faults seen red, **one of them only after the sweep demanded a sixth instrument** | ✅ **SHIPPED** `8e39a8a` |
| **`B4h`** — a round wall's DESCRIPTION: centre and shell, drawn on the plan | M | `disc.loft` — the rim recovers to its own centre and shell at two sizes and off-origin, the circle lies inside its rim's own band, a run / a gapped rim / a disc with a wall through it are refused, membership pinned against `arc_fill`, and the shell walk's monotonicity measured; five faults seen red, **one green because the fault was not one** | ✅ **SHIPPED** `b01fbd0` |

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

⚠ **THIS FILE IS OVER `plans/README.md`'s 100–300 LINE BUDGET, AND IT IS THE FOUR STEP
RECORDS BELOW THAT PUT IT THERE.** The convention says length means reference content is
leaking in — and the fix is the one the closing checklist already names: each finding
moves to the doc that owns it (`BLUEPRINT.md` §0 and §3.4 and `EDITOR_DEFECTS.md` entry 6
already carry the load-bearing halves), and this keeps the closure record. ⚠ Thinning
them **before** that move is how a finding that cost a day becomes a line nobody can
check — `STATE.md`'s own lesson, in its own banner.

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

## What `B2` turned up

**Shipped `0c35614`.** `plan_levels` takes a list of reference heights and draws one panel
per level, each in its own `<g>` carrying `data-level`, `data-ref` and `data-dx`;
`plan_svg` is the one-level wrapper. `make plan-view WORLD=b2deck REFS=0,3`.

![the deck world at two levels](../../doc/claude/img-levels-plan-b2.png)

*`deck.keys`'s world, ground and the storey above it. Same window, same coordinates,
placed by one transform each.*

### The offset is declared, and the geometry never learns it

`plan_panel` draws in the world's own frame and does not take a `dx` at all; the group
places it. So the same cell has **byte-identical `points` in every panel**, and `data-dx`
and the `transform` are two statements of one number, checked against each other — a
picture whose two statements of its own offset disagreed would be unmappable and would
look perfectly right.

⚠ **THE REFACTOR WAS PROVEN BEFORE THE FEATURE WAS ADDED.** `plan_svg`'s body became
`plan_panel` + `plan_levels`, and the **282** emitted elements of one window were compared
byte-for-byte against the pre-refactor output: identical. `data-h` went on the cell only
after that, as a deliberate content change rather than a silent one.

### ⛔ And the sabotage sweep caught ME first

The first row-1 sabotage — *bake the offset into the geometry* — was spelled as a shift of
`hex_corner_world(q + 1, …)`, and the suite stayed **green**. That is correct: the test
asks whether the panels differ **from each other**, and a shift applied to all of them
equally is not that defect. The faithful sabotage is the obvious wrong implementation —
pass `dx` into `plan_panel` and add it to the coordinates — and it is caught, with the
assertion's own words. ⚠ **A sabotage has to BE the defect, not a change in its
neighbourhood**, and a green row is a claim about the sabotage before it is one about the
test.

### The upper panel draws the lawn, and that is the store's answer

A panel at `ref 3` shows the deck **and** the ground around it, because `world_surface`
answers *what would someone at this height be standing on* and outside the deck that is
still the ground. The answer is right and it looks like grass on the first floor.
`data-h` — the cell's own stored height — is what tells them apart, and it is the store's
number rather than a rule invented here. ⚠ Whether an upper panel should BLANK what is
not on its level is a decision for the authoring half, not a defect: on `b2deck` the
heights emitted are `0 1 2 3 5 6` for the raised ground and `12` for the deck, so the
plan already carries the contour a reader needs.

### What it still cannot see

- **A level here is a reference HEIGHT, not a sheet index.** `FORMAL_CORE` §2.4.3 says
  *"the level is a discrete sheet index and nothing else"*, and this store has layers and
  heights — `combine_cut_level`'s `at` is `hex_place`'s, and nothing in the editor writes
  one. So `data-level` is the panel's index and `data-ref` the height it was read at, and
  **neither is the formal level**. Naming them apart is the most this step can honestly do.
- **One run per window still**, per `B1`.

## What `B3` turned up

**Shipped `9d81b93`.** `plan_author` takes a `hex_editor::Author` — the same four
numbers every gesture takes — and the plan draws a marker at the author's own two floats
with a facing tick along `(cos yaw, sin yaw)`. `editor_run` gains `plan <tag>`: the view
at the current tick, windowed on the author. `make probe-plan`, and it is in `make fast`.

![the author standing at the wall of a house](../../doc/claude/img-author-plan-b3.png)

*A house, and the person who built it standing against its south wall, facing north. The
caption ends `you`; the same four stray edges `B0` found are on the corners of this
placement too.*

### The pose is read back OUT of the picture

`editor_run`'s `plan` line prints the marker it parsed from the SVG it just wrote — not
`wk_x`. ⚠ **A line that re-printed the walker would compare the walker against the walker
and pass for any drawing at all**, including one that put the marker at the origin. That
is exactly the row `probe/plan` catches: with the marker nailed to `(0,0)`, **station 1
still passes** — the author really is at the origin there — and stations 2 and 3 fail.
Three stations and the *are they even different points* control are what make the row an
answer.

### Which panel the author stands on is the store's answer

They are drawn on the level whose reference selects the same LAYER under their own cell as
their own feet do — `edge_layer` asked twice and compared. A rule of the shape *within half
a storey of the reference* would be a number invented here, and `FORMAL_CORE` is explicit
that a level is not a height. Tested both ways round on the two-storey fixture: standing on
the ground they are on `L0` and **not** `L1`; standing on the deck, `L1` and not `L0`.

### ⚠ A saved world has no author, and the picture says so

`src/plan_view.loft` reads a `.hxw` and reports `who none`, because the walker lives in
whichever driver is running the tick — the store carries the world and not the person.
**That is the same boundary `B1` found from the other side** (the run record is not saved
either), and it is why the author appears in `editor_run`'s `plan` rather than in the file
reader: a program that invented a pose from an argument would be drawing a claim rather
than a fact.

⚠ **AND THE THREE STATES DO NOT READ ALIKE** — `who none`, `who (x,z)`, `who (x,z)
OFF-PLAN`. An absent marker means *nobody was given* and *somebody is elsewhere* at once,
which is the collapse `probe/l1` lost a run to and the third time this plan has had to
separate one.

## What `B4a`/`B4b` turned up

**Shipped `e70efbf`.** `plan_pick` turns a page position back into a cell on a level;
`editor_run` gains `pick <x>,<y> <verb>`. [`probe/plan`](../../probe/plan/README.md) grew
rows D–F.

### One frame, and the extraction proven before it was used

`plan_bounds` and `plan_pitch` now answer for the drawing **and** the pick. A second
derivation of that arithmetic would be wrong by a margin — right in the middle of every
panel and wrong at its edges, which is where nothing is ever tested by hand. The
extraction was proven first: **282 emitted elements byte-for-byte identical** to before it.

### ⚠ `mesh_tile_of`'s bug, in a new place, caught before it shipped

loft's `/` truncates toward zero, so a page point **left** of the picture divides to
**panel 0** — a click a metre outside would author inside the first panel. The bound is
tested before the division, and the sweep row that removes that test goes red. ⚠ This tree
has already paid for this once, in `mesh_tile_of`, and its test file says why in its own
banner: *every fixture in this tree stands at the origin, which is the one place the wrong
spelling is right*. The refusals are checked as **four named reasons** — gutter, margin,
past-the-end, off-page — because *the nearest cell* is not an answer to *no cell*.

The accept side is a **round trip over all 338 cells** of a two-level window, for the same
reason: a transform wrong by a margin still picks the right cell in the middle of a panel.

### A pick is a TARGET, not a teleport

Clicking a plan to hang a door does not walk the person across the room. The `Author` is
built at the picked spot and handed to the same `press_verb` every other spelling uses —
so the verb is the verb, and this is not the fifth place that decides what a key means
([EDITING_MODES](../../doc/claude/EDITING_MODES.md) already counts four). ⚠ **That is what
`Author` being a type of its own is FOR**, and until this step nothing in the tree had used
the distinction.

Measured, and it is the whole argument for the step: **picked and stood-on key the same
world**, `32952:2278076870` — with the control that the fence moved the world off the bare
key `32952:3318286153` at all, because two worlds nobody authored in agree perfectly.

### ⚠ And a failure that was not this tree's

Three runs died on `unable to find library -lloft_graphics_native`. It is a **sibling's
loft CI** rebuilding the native cdylibs: `~/.loft/build-cache/graphics-0.8.0/release` is
emptied and refilled, and every `--lib lib/` link here fails while it is empty. Nothing to
fix and nothing to kill. `LOFT_NO_NATIVE_LIBS=1` is the way through, and it changes what is
exercised. [`probe/plan/README.md`](../../probe/plan/README.md) carries the incantation.

✅ **RE-RUN PLAINLY ONCE THE CACHE REFILLED AND THE CAVEAT IS DISCHARGED**: `make fast`
exits 0 with `probe/plan` green on the native path inside it, and `hex_mesh` is **94 on
both backends**. ⚠ The window it took was between two of the sibling's rebuilds, so the
green is a fact about this run and not a promise about the next one.

## What `B4c` turned up

**Shipped `e24a9b0`.** `pick <x>,<y>` with no verb **aims**: it resolves the point,
writes the plan with the spot marked, and authors nothing. With a verb it authors — one
word, two arities, and the difference is *look* against *do*.

![the author, and the cell they are aiming at](../../doc/claude/img-aim-plan-b4c.png)

*The house, the person at its south wall, and the violet cell they are pointing at with
the cross showing where they actually pointed. The caption ends `aim you`.*

### A pick is two facts and the picture draws both

The cell it resolved to, as an outline; the point that was asked for, as a cross. ⚠
**Drawing only the first hides the SNAP**, and hiding the snap is how an author blames the
store for a gesture that landed exactly where they pointed. In the picture above the cross
sits visibly off its cell's centre, which is the whole of it.

### ⛔ Row G found a real defect on its first run

The author's overlay **assigned** where it should have appended, so the highlight was
wiped whenever the author stood on the panel they were aiming at — **which is every aim a
person takes at their own plan** — while the caption cheerfully named the cell.

⚠ **The suite could not see it.** Every test written before it passed one overlay or the
other and never both; the case only exists where they meet. And ⚠ **the row caught it
because of how it asks**: *does the PICTURE carry the mark*, not *does the caption say so*.
A row phrased the second way would have been green on a file with nothing drawn in it —
which is the same sentence this plan has now written three times, about three different
instruments.

It is fixed, pinned by a test that passes both overlays, and that test was seen red with
the assignment put back.

### Two extractions, both proven before use

`cell_points` — one derivation of a cell's outline, so a highlight cannot sit a hair off
the cell it claims to be highlighting — and `PlanOver`, which makes the author and the aim
one parameter rather than pushing `plan_levels` past loft's own parameter nudge. **282
emitted elements byte-for-byte identical across both.**

⚠ **And a smaller one worth keeping**: the test helper that finds the highlight first used
a hand-counted prefix length and silently matched nothing — the failure read as *the pick
was not drawn*. It counts with `.size()` now. A reader that measures its own needle by hand
is a reader whose default answer is *absent*.

## What `B4d` turned up

**Shipped `6e756c0`.** `hex_editor::wall_type` reads a wall TYPE off the edge palette and
the plan paints the wall at the thickness it declares.

![a house whose walls carry a declared type](../../doc/claude/img-walltype-plan-b4d.png)

*The same house as `B3`, after `declare edge 1 brick body=SOLID thick=0.35` and
`declare edge 2 doorway body=OPEN_DOOR thick=0.1`: 41 marks painted at 0.35 and the
doorway at 0.1, visibly narrower than the wall it perforates.*

### ⚠ The block was a claim, and re-measuring it dissolved it

The row said **Blocked on `@HB-X63`**, which gates the FOXEL's round trip upstream and
leaves the palette at **T4** in hexbody's own model. That is upstream's gap. What this row
needs is that a wall type survives **this tree's** encoder — and it does: a type written
into `PALW` comes back through `world_to_bytes`/`world_from_bytes` with its name, body and
thickness identical, with a control that a world holding no palette declares none.
[NOTATION](../../doc/claude/NOTATION.md)'s doctrine, applied to our own table: **`Blocked`
is a claim to re-measure, not a fact.**

### The declaration half already existed, and nobody had noticed

`declare <axis> <slot> <name> <fields…>` was built for house types (plan 22 `T1a.1`) and
`pal_kind_of` has always accepted **`edge`**. So a person could already declare a wall type
and nothing could read it. `B4d` is the reading and the painting; the writing was there.

⚠ **And `WALL_MAT` is 1**, so `declare edge 1 …` types every wall already standing — which
is how the picture above was made from a script with no new gesture at all. What is
missing is a gesture that stamps a **chosen** slot, so two types can stand in one world;
that is `B4e`.

### ⛔ The body vocabulary is not closed here, deliberately

`@HB-X12` names the bodies and `@HB-X69` says why the list lives in a comment rather than
in a type: *"an open vocabulary … which is exactly why the palette is the designed
extension point."* So `body=OCTAGON` is carried through and a test pins it. **A reader that
checked the body against a list would refuse the design's own next value, politely** — and
§2.3 of the design is that an octagon body is *"exactly the extension shape"*.

What IS refused is what is structurally wrong: `thick=fat` and `thick=-0.5`, each naming
what it saw. ⚠ **And a type with no `thick=` at all is a type that STATES NONE**, which is
a third answer — the same distinction `house_type` refuses a malformed type on, and the
reason `palfield.loft` deliberately has **no `pal_float`**: a float reader with a fallback
would have to answer the same for *absent* and *unparseable*.

### What it costs, said rather than discovered later

The picture resolves the palette **per edge** — a text parse for each mark. At 42 marks
that is nothing; at ten thousand it would be the slowest thing in the emitter. It is a
file writer and not a frame loop, so this is a note rather than a defect.

## What `B4e` turned up

**Shipped `10337dc`.** `hex_editor::session_select_wall` + `session_wall_mat` (read by
`wall`, `run` and `aim` from one place), `edge_is_wall`, `select wall <slot>` in the
runner, `58:` on the wire, and `tools/scripts/walltype.keys` through both drivers.

![two declared wall types, side by side](../../doc/claude/img-walltype-plan-b4e.png)

*`declare edge 5 brick thick=0.2` and `declare edge 6 curtain thick=0.7`, each traced
with `select wall <slot>` before it. One verb, two choices, two widths.*

### The gap was never where `B4d`'s note put it

`B4d` closed saying *"what is missing is a gesture that stamps a **chosen** slot"* — one
selection, in the shape the other five already have. That half took an afternoon. What
it did not say is that **an edge byte's meaning is asserted at six other places**, each
holding a byte and no world:

| the site | what it would have done with a chosen type |
|---|---|
| `wall_stops_walk` | a person walks through stone |
| `wall_stops_view` | a camera sees through it |
| `open_ahead` · `open_span` | a door cuts nothing, and reports the count |
| `session_run` | a wall run takes the **FENCE's** shape |
| `hex_mesh::emit_run_wall` | the run loses its half-width |
| `planview::edge_colour` | the wall is painted as *I cannot explain this* |

⚠ **Not one of those is in the plan view**, which is where the row's own acceptance
looks. A step that had built the selection and the picture would have been green on its
stated verify and shipped a wall you can walk through.

### ⛔ And the wire already carried a material, which outranked the choice

`probe/s2c/walltype` went red on its first run and the shape of the failure is the
finding. The server **received `58:` and selected correctly** — its own log says
`editor: wall 5 selected` — and then stamped byte 1 anyway, because `tools/script.mjs`
sends `run` as `25:1` and `wall` as `23:1,3`. The material was on the wire, and a
payload beats a session.

| | runner | served |
|---|---|---|
| `WALL_MAT` bytes in the saved world | **0** | **12** |
| what the driver printed | `wall laid 12 edges, heading 0 …` | `wall laid 12 edges, heading 0 …` |

⚠ **THE TWO SENTENCES ARE IDENTICAL**, so no acknowledgement, no count, no log line and
no gate that reads one could have found this. Only the saved world could — which is
`probe/s2c`'s whole argument, made again on the first script added to it since `htverb`.

✅ **And the fix was written down two years of notes ago.** `editor_client.loft`'s own
comment: *"`fence`/`wall` are one `ring` verb waiting for a material selection, exactly
as the opening family waited for `es_open_kind` — so until that selection exists they
are two verbs, each implying its own material."* An **empty material field** on `23:`,
`25:` and `56:` now means *the wall type I chose*, which is the contract `36:`, `37:`
and `38:` have shared since plan 22. An explicit material stays a one-shot that does not
move the selection; `25:3` is still the road and `tools/plan.mjs` still sends it.

⚠ **AND THE RESOLUTION IS THE FAR END's, NOT THE CLIENT'S.** A client that put its own
answer on the wire would need a copy of the session it is attached to, which is
[EDITING_MODES](../../doc/claude/EDITING_MODES.md)'s four-site divergence in one line.

### ⛔ `session_digest` reported one selection of six

That is *why* the defect above had to be found in the bytes. The digest exists to say
**what the editor remembers** beyond the store — it is the other half of `world_key`,
and `probe/k3d`, `probe/s2c` and the page-versus-runner comparison all read it — and it
printed `chosen: opening <k>` and nothing else. The seat, the annex, the aim's reach,
the part and now the wall type were invisible to every one of them.

It prints all six now, which moved 34 `probe/k3d` baselines on that one line and nothing
else. ⚠ **The blindness was measured on the step that added the sixth**, which is the
only reason it was found at all: four of the five were already there.

### What a wall TYPE is, and the limit that comes with it

`edge_is_wall(mat)` is `mat == WALL_MAT || mat > EDGE_MAT_LAST` — the four bytes this
editor's vocabulary owns (`WALL_MAT` 1, `DOOR_MAT` 2, `FENCE_MAT` 3, `WINDOW_MAT` 4) are
structural kinds, and everything past them is a wall a world declared. ⚠ **The kind stays
NUMERIC deliberately**: every caller holds a byte and no world — the walk asks per edge
per step — and `@HB-X12`'s body vocabulary is upstream's and open, so deriving
fence-ness from `body=FENCE` would be a signature change at six sites for a capability
nothing has asked for. **The cost, said out loud rather than discovered: a world cannot
declare slot 7 to be a fence.** It declares slot 7 to be a wall type.

⚠ **AND THE PICTURE'S LOUDNESS CHANGED SUBJECT RATHER THAN LOOSENING.** `B0` wrote *an
unknown edge material is magenta, because the whole point of an instrument is that what
it cannot explain looks different from what it can*. A declared slot 5 **is** explained,
in full, by the palette — so shouting at it is shouting at the feature. What keeps the
magenta is a byte **nothing declares**, and the pair is pinned by two tests one
declaration apart.

### The sabotage sweep, and the row that told the instruments apart

Five faults, each restored from a copy taken before the sweep — never `git checkout`, and
the subject was asserted **present** before row 0, because a sweep over an absent feature
answers *nothing went red* to every question.

| # | the fault | what went red |
|---|---|---|
| 0 | *(control — nothing sabotaged)* | **nothing**, as it must |
| 1 | `session_wall_mat` pinned to `WALL_MAT` — the choice never reaches the gesture | `wall_type` · `probe/plan` |
| 2 | `edge_is_wall` back to `mat == WALL_MAT` | `wall_type` · `planview` · `probe/plan` |
| 3 | a declared type stays magenta — the plan stops reading the palette | `planview` · `probe/plan` |
| 4 | the wire's default back to `?? FENCE_MAT` | **`probe/s2c` alone** |
| 5 | the selection accepts the vocabulary's own bytes | `wall_type` |

⚠ **ROW 1 IS THE ONE WORTH READING, AND IT IS THE ROW `probe/s2c` DID *NOT* CATCH.** With
the library's selection broken, both drivers are broken the same way, so the two saved
worlds agree perfectly. **`probe/s2c` measures DIVERGENCE, never correctness** — which is
exactly why row 4 is its alone: a default that lives only on the wire cannot make the two
drivers agree, and nothing else in the tree looks at both.

### What it deliberately does not reach, and who owns each

`place_house` and `annexes_runs` still stamp `WALL_MAT`, so a house built after
`select wall 5` has byte-1 walls. ⚠ **That is not the selection failing to reach a site —
it is a different question with a different owner.** A house's walls belong to its TYPE
(`declare house 1 castle wid=… dep=…`, plan 22 `T1a.1`), which is where *a castle is made
of curtain wall* belongs; wiring the author's standing choice into it would make one
gesture read two authorities. ⚠ **And it is what keeps `house.keys` byte-identical**,
which is the whole upper bound of this step. `VB_FENCE` keeps `FENCE_MAT` for the same
reason one level down: a fence is a KIND the vocabulary owns, not a type a world declares.

### Four tests were asserting the opposite of the truth

`9` was the tree's canonical *impossible material*, in `fence.loft`, `press.loft`,
`session.loft` and `tools/gates/world/fence.mjs`. It is a wall type now. ⚠ **What is
still impossible is what a BYTE cannot hold, and stating it found something the old
ceiling hid**: `wall_set` widens with `mat as u8? ?? 0`, so a material of 256 does not
fail — it stores **0**, the byte that means *no edge at all*. `fit_nominal(mat,
FENCE_MAT, …)` never let one through; `edge_stamp_ok` has to say it.

## What `B4f` turned up

**Shipped `34cec07`.** `hex_editor::wall_half` — one resolver from a wall **id** to the
half-width it is built at — `run_wall` taking that half instead of choosing it,
`hex_mesh::emit_run_wall` and `planview::plan_svg` reading the one function, and
`lib/hex_mesh/tests/wall_thick.loft`, which measures a wall's band as the spread of the
wall mesh's own vertices.

![the thin wall alone](../../doc/claude/img-walltype-3d-thin-b4f.png)
![and the thick one beside it](../../doc/claude/img-walltype-3d-both-b4f.png)

*`declare edge 5 brick thick=0.2` and `declare edge 6 curtain thick=0.7`, in the WORLD
this time rather than in the plan. ⚠ **Two pictures because one cannot say which wall is
which**: the thin one is laid alone first, so screen-left is measured to be slot 5 rather
than argued from a handedness convention — and the wall that arrives in the second is the
one carrying a top face you can see. Before this step both were √3/2 and the pair would
have been one picture twice.*

### `wt_thick` had exactly one consumer and it was a PICTURE

`B4d` read a wall's thickness off the palette and `B4e` let a person choose the type
that carries it, and between them they wired it to the plan view and to nothing else.
`run_wall` resolved **every** wall id to `wall_band() * 0.5` — √3/2 — so:

| | |
|---|---|
| the palette says | `declare edge 5 curtain body=SOLID thick=0.4` |
| the plan paints | `stroke-width='0.4'` |
| the mesher builds | **0.8660254037844386** |

⚠ **AND EVERY SUITE WAS GREEN**, because the store, the palette and the picture all
agreed — the disagreement was between the picture and the *world the picture is of*,
and nothing in the tree compared those two. This is [CLAUDE.md](../../CLAUDE.md)'s named
commonest defect landing on the step immediately after the one that built the thing:
*check that what you built is called*, asked one rung too late.

⚠ **AND IT IS WORSE THAN AN UNCALLED FUNCTION, BECAUSE THE PLAN VIEW IS THE REVIEW
SURFACE.** BLUEPRINT §0's whole argument is that a plan is the cheapest place to see what
the libraries do; a plan that paints 0.4 over a wall built at 0.866 is an instrument
reporting its own input.

### The instrument was the step; the change itself is a dozen lines

The band is measured as the **z-spread of the wall mesh's vertices** — the run lies along
+x, so its two faces are the extreme z. Two things make that trustworthy rather than
plausible:

- ⚠ **The plain-wall row must be green BEFORE and AFTER.** An instrument that cannot find
  the √3/2 that was already there cannot be believed about the 0.4 that was missing —
  and it is also the step's **upper bound**, since every world the corpus keys is laid at
  the band.
- ⚠ **The run is registered WITHOUT stamping its edges.** `wall_stamp` does both, and the
  per-edge panels the mesher then draws from the store ([EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) 4 —
  every wall drawn twice) sit on the hex edges and would widen the spread. The defect
  that step 4 records is, concretely, a second wall in the way of measuring the first.

⚠ **AND NO RESOLVER TEST COULD HAVE FOUND THIS.** `wall_type.loft` gains four rows here
and not one of them could have gone red before the step: the resolver was never the
broken half — the mesher's **call** was — so the only instrument that could fail is one
that reads the emitted geometry.

### Moving a constant into a parameter turned its own test into a tautology

`run.loft`'s `test_the_strip_is_the_family_band_thick` pinned the wall's width since `S3`:
*the thickness is `hex_draw`'s, not a number chosen here*. The moment `run_wall` took
`half` from its caller, that test passed `BAND_SIDES * 0.5` in and asserted `BAND_SIDES`
came out — **a table checked against the table**, and it went on passing without a word.

⚠ **It is a shape worth watching for, because the refactor was right and the test's decay
was invisible.** What restores it is a second row at a *different* half: without it every
assertion in that file would pass on a `run_wall` that had gone back to choosing the band
itself. The claim the old row really made — *an undeclared id is presented at the family
band* — moved to `wall_half`, where it is now a fact about the resolver and, off the mesh,
about the geometry.

### The region is the run's own start cell, not the chunk

`emit_run_wall` is handed `q0`/`r0` of the **mesh chunk** it is filling, and a wall is
meshed once per chunk it crosses — so resolving the palette against those would give one
wall two thicknesses at a regional boundary. It resolves against the cell the run
**starts** in, which is the same choice `wr_mat` already makes about its material.

### What it deliberately does not reach, and who owns each

`roof_plan_of`'s eave reach and the camera's `CAM_SKIN` are still the plain band. Both are
about the **procedural** house, whose walls `place_house` stamps as `WALL_MAT` — `B4e`'s
decision, unchanged — and `CAM_SKIN` is a `const`, so it has no world to ask at all.
⚠ **The consequence, said out loud rather than discovered: a declared wall thicker than
the band can reach closer to the eye than the camera's skin expects.**

### The sabotage sweep

Five faults, each restored from a copy taken before the sweep — never `git checkout` —
and the subject asserted **present** before row 0 (`wall_half` in the tree *and* called
by both emitters), because a sweep over an absent feature answers *nothing went red* to
every question.

| # | the fault | what went red |
|---|---|---|
| 0 | *(control — nothing sabotaged)* | **nothing**, as it must |

### Both backends, and three failures that were not this tree's

`hex_editor` **669 passed** and `hex_mesh` **106 passed** on the interpreter; `make fast`
green, with `probe/s2c` keying `walltype` IDENTICAL with and without a server. On
`--native` `hex_editor` is 669 and `hex_mesh` came back **103 passed, 3 failed** — all
three in `arch.loft`, a file this step does not touch, all three
`native compile: error: linking with cc failed`. ⚠ **`pgrep -f cargo-nextest` was
answering**, which is [CLAUDE.md](../../CLAUDE.md)'s documented condition: the sibling's
`make rebuild-native-cdylibs` empties and refills the build cache, and any `--lib lib/`
link here fails while it is empty. Re-run alone, `arch` is **3 passed** on native, and
`wall_thick` is **3 passed** on native — so the two backends agree, which is the claim,
and the interruption is a fact about the box.

### A note on cost, and the instrument it is NOT measured with

`emit_run_wall` now asks the palette once per run per mesh chunk — two section
lookups, and for a world that declares nothing they return on the first line. A world
that *does* declare wall types pays one text split per run per chunk, on a path that
rebuilds the whole neighbourhood on every write ([EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) 1).
⚠ **It is written down rather than timed, because [CLAUDE.md](../../CLAUDE.md) measures
cost in `w_tau` and a mesh build does no writes** — so the honest statement is *where*
the work is, not how many milliseconds it took on this box.

### The sabotage sweep, and the row only ONE instrument could catch

Five faults, each restored from a copy taken before the sweep — never `git checkout` —
and the subject asserted **present** before row 0: `wall_half` in the tree *and* both
emitters calling it, because a sweep over an absent feature answers *nothing went red*
to every question.

| # | the fault | what went red |
|---|---|---|
| 0 | *(control — nothing sabotaged)* | **nothing**, as it must |
| 1 | `wall_half` pinned to the band — the declaration never reaches the geometry | `wall_type` · `wall_thick` · `planview` · `probe/plan` |
| 2 | `run_wall` ignores its `half` and chooses the band again | **`run` · `wall_thick` alone** |
| 3 | the plan forgets to double the half — the picture halves what is built | `wall_thick` · `planview` · `probe/plan` |
| 4 | `wall_half` returns the full width instead of the half | `wall_type` · `wall_thick` · `planview` · `probe/plan` |
| 5 | `thick=0` read as *zero wide* rather than *states none* | **`wall_type` alone** |

⚠ **ROW 2 IS THE ONE TO READ, AND IT IS THE ROW THAT ALMOST HAD NO INSTRUMENT.** A
`run_wall` that quietly re-chooses the band is invisible to the plan view — the picture
resolves the palette itself and would go on painting 0.4 over a wall built at √3/2,
which is the original defect wearing the fix's clothes. `wall_thick` sees it because it
reads the MESH. ⚠ **And `run` sees it only because of the row this step added**:
measured with the fault in place, the failure is

```
FAIL tests/run.loft::test_the_strip_is_as_thick_as_it_was_asked_for
     a strip asked for 0.2 either side is 0.8660254037844386 across at half 0.4330127018922193
     (1 failed, 5 passed)
```

**Five passed.** Every assertion that pre-dates this step hands `BAND_SIDES * 0.5` in and
asserts `BAND_SIDES` comes out, so the fault is exactly what they cannot see.


## What `B4g` turned up

**Shipped `8e39a8a`.** `hex_editor::tower_ring` — a ROUND enclosure, from
`hex_shape::arc_fill` — with `fit_shell`, `tower_pad` and `tower_clipped` beside it,
`tower <shell>` in the runner, `59:` on the wire, `tools/scripts/tower.keys` through
both drivers, and `lib/hex_editor/tests/tower.loft`.

### The editor's only enclosure was a hexagon wearing the name `disc`

`fence_disc` asks `hex_grid::hex_distance(q, r, cq, cr) <= rad`. That is the lattice's
own metric — six straight sides — which is exactly *why* `ring_runs` can describe the
result as six runs. Nothing in this editor had ever built a round thing, and the
`hex_shape::arc_*` family — an exact integer disk, an exactly recoverable centre — had
**zero production callers in this tree**: `probe/b0p` called it once, for a different
question, and nothing else ever did.

⚠ **AND THE BODY VOCABULARY IS WHAT NAMED THE STEP.** `wd_body` was carried through
`B4d` and read by nobody. Upstream's own producer table is what says which value means
what — `SOLID` a thin edge wall, `ROAD_GUIDE` a linework band, `THICK_FLAT` a thick
ring of cells, **`THICK_CURVED` a round tower rim (`@HB-X49`)** — so *round* was never
ours to define. ⚠ It is also why `HALF_HEIGHT` and `BATTLEMENT` are still untouched:
upstream has never produced them either, so a meaning invented here would be exactly
the guess `AUTHORING_MAP` calls *"guessing the replacement is the same error as
guessing the algorithm"*.

### ⛔ A disk IS the hexagon at exactly the shells `12R²`

Measured over every shell to 300, before a line was written:

| shell | 12 | **36** | 48 | **84** | 108 | **144** | **156** | 192 | **228** | **252** | 300 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| cells | 7 | **13** | 19 | **31** | 37 | **43** | **55** | 61 | **73** | **85** | 91 |
| a hexagon? | rad 1 | **no** | rad 2 | **no** | rad 3 | **no** | **no** | rad 4 | **no** | **no** | rad 5 |

**So one shell in three builds exactly the ring this editor already had.** A test that
picked its shell for convenience — 48 is the obvious *radius 2* — would have been green
on a gesture that never called `arc_fill` at all. Every fixture states its shell and
why; `ROUND_SHELL = 36` is the smallest that is not a hexagon, and `HEX_SHELL = 48` is
kept as the instrument's own control.

### ⚠ AND ROUNDNESS IS A PROPERTY OF THE SHELL, NOT OF THE GESTURE

![four shells, drawn flat](../../doc/claude/img-tower-shells-b4g.png)

*Shells 36, 84, 156 and 300 — 13, 31, 55 and 91 cells — through `make plan-view`.*

**The smallest admissible round tower is a six-pointed star.** At 13 cells the disk's
outer ring sticks out in the six lattice directions and there is nothing round about
it; it takes **shell 156, 55 cells**, before a rim reads as a circle. ⚠ That is the
same answer `probe/b0p` got one shape over — *"nineteen cells in, there is nothing to
deduce because there is nothing distinct"* — and it is the honest reply to *"rounded
structures like balconies/towers"*: the gesture is exact at every shell, and whether
the result LOOKS round is a size question the author has to be told about.

⚠ **It is recorded rather than legislated.** A gesture that refused a shell below 156
would be enforcing a judgement, and the store is exact either way.

### The plan view earned its keep again, and against this step

`B0` argued a plan view is the cheapest place to see what the libraries do. The table
above is arithmetic; the picture is what says *the first two of those are not round*,
and no test in this file would ever have said so.

### Three things the fixtures had to get right

⚠ **`wall_of` RESOLVES THROUGH `edge_owner`, SO ONE EDGE IS VISIBLE FROM BOTH CELLS.**
The first draft of the boundary test read *this cell is outside and the edge is marked*
as a fault and reported **30 spurious errors** — every boundary edge, counted a second
time from the other side. An edge is classified by BOTH its cells: interior (must not
be marked), boundary (must be), outside (must not). The three-way test is stronger than
the two-way one it replaced.

⚠ **A WINDOW TOO SMALL CLIPS THE DISK AND BOTH INSTRUMENTS AGREE WITH IT.** `arc_fill`
fills only inside the `HexSet`'s own window and `arc_is_disk` reads back over that same
window — so a clipped disk is a disk to the checker. `tower_pad` sizes the window and
`tower_clipped` checks the SET rather than the arithmetic that sized it, because a pad
formula checked against the pad formula could not be surprised.

⚠ **AND `arc_fill` DRAWS THE SHELL BELOW A NUMBER THAT NAMES NONE, SILENTLY** — its own
comment says so. `fit_shell` is that guard, and it is `K-FIT`'s doorstep rather than a
courtesy: without it `tower 40` builds the 13-cell star and reports success.

### What it deliberately does not do

⚠ **IT REGISTERS NO `WallRun`, AND THAT IS A FACT ABOUT `WallRun`.** A run is two
endpoints and a `d24` heading; a circle has neither. The consequence is worth stating
loudly: **this wall is drawn by the PER-EDGE emitter, which
[EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) 4 slates for deletion** — so
"stop drawing the edges" is not the free simplification it reads as. It would take the
only way a curved wall can be drawn with it, unless the run record first gains an arc.

⚠ **AND THE MATERIAL RULE IS `fence_ring`'s, UNCHANGED.** `fit_edge_mat`'s own comment
forbids narrowing here, so `0` is admitted and means *erase this rim* — the one place
the gesture parameter and `session_select_wall` disagree, since the SELECTION refuses 0
by name. Recorded, not fixed: choosing a type and writing a byte are different
questions.

### An unrelated thing the pictures found

`verb raise` lands **ten cells ahead of the author's facing** — measured, q +10 at yaw 0
and q −10 at yaw 180 — while `fence_ring` and `tower_ring` centre on the cell you stand
in. Both are documented behaviours and neither is wrong, but a plan view of a script
that raises and then rings shows the ground offset from the rim, which reads as a bug
and is not one. Written down because it cost twenty minutes here.

### ⛔ The sweep found a row NOTHING could catch, which is why it is run

Five faults, restored from a copy taken before the sweep — never `git checkout` — with
`tower_ring` asserted present **and both drivers asserted to reach it** before row 0.

| # | the fault | what went red |
|---|---|---|
| 0 | *(control — nothing sabotaged)* | **nothing**, as it must |
| 1 | the fill goes back to `hex_distance` — the algorithm becomes ours again | `tower.loft` |
| 2 | the shell grid is not checked, so `arc_fill` draws the shell below in silence | `tower.loft` |
| 3 | only the cell's own three edges — the approximation `fence_disc` warns of | `tower.loft` |
| 4 | the window too small, so the disk is clipped and reads back as a disk | `tower.loft` · `probe/s2c` |
| 5 | **the chosen wall type never reaches the rim** | ⛔ **NOTHING** |

⚠ **ROW 5 IS THE REASON A SWEEP IS RUN RATHER THAN REASONED ABOUT.** With `tower_ring`
stamping `WALL_MAT` instead of the material it was handed, **every row in the file was
green**: the boundary rows build with `WALL_MAT` themselves so the fault is invisible
to them, the refusal rows read an `Ack` and never the store, and `probe/s2c` compares
two drivers that are broken identically and agree perfectly. ⚠ **It is `B4e` row 1 one
gesture along** — *"`probe/s2c` measures DIVERGENCE, never correctness"* — and the
answer is the same one: read the BYTE back out of the world.
`test_the_rim_carries_the_material_it_was_handed` is that row, and it was written
**because the sweep asked for it**, not before. Re-run against the same fault it now
says *the rim holds no byte 7 at all*.

⚠ **AND ROW 1 IS THE OTHER HALF OF THE SAME LESSON**: the algorithm reverting to a
hexagon is caught by `tower.loft` **alone**, for exactly the reason row 5 was caught by
nothing — both drivers would be wrong together.

## What `B4h` turned up

**Shipped `b01fbd0`.** `hex_editor::disc_recover` — a round wall's description —
with `disc_span`, `disc_has` and `disc_marks` beside it, the circle drawn in
`plan_svg`, and `lib/hex_editor/tests/disc.loft`.

### A circle is not a run, so a tower described as nothing

`B1` put a straight run's description beside the field it was recovered from, and a
rim has no run to put there: a `WallRun` is two endpoints and a `d24` heading, and a
circle has neither. So a tower `B4g` drew perfectly read back as **`refused (30
marks)`** — the field half of the pairing with the description half missing, which is
the gap `B1` exists to close for the other shape.

### It generates and compares; it does not fit

A disc is `(centre, shell)` and nothing else, so a candidate can be **drawn** — by
`arc_fill`'s own membership test and the same boundary rule `tower_disc` stamps with —
and compared to the store edge for edge. That is [FORMAL_CORE](../../doc/claude/FORMAL_CORE.md)
§6's **R1** regime: *the shape is in the admitted set and the field determines it
uniquely, `ρ = 0`*. ⚠ **Nothing here fits a circle to anything**, which is §6.1's named
trap and the error `A0p` made twice in one hour.

⚠ **AND IT NEEDS NO FLOOD, WHICH IS WHY IT DOES NOT USE ONE.** The obvious route — fill
the enclosure and ask `arc_recover_centre` — wants the cells inside the rim, and the
only bounded flood here is `field_fill`, which is measured below to be unable to tell an
open enclosure from a large one. Generating the candidate sidesteps that entirely.

### ⛔ `field_fill` cannot say *there is a gap in your fence*

Found while looking for the entry point, measured rather than read:

```
open ground, no boundary at all -> -2      ← documented as "it grew past the cap"
a closed ring of radius 3        -> 37     ← control: the instrument discriminates
the same ring with a gap in it   -> -2     ← the case an author actually hits
```

Its own comment insists the two refusals must not wear one message — *"telling an
author the wrong one sends them looking for a gap that is not there"* — and then sets
`escaped` and `capped` **at the same site**, so `return 0` is unreachable and every
unbounded fill reports *the area is too large*. ⚠ **The distinction cannot be made as
written**: on open ground the flood only ever stops at the cap, so telling *open* from
*too big* needs a BOUND — the shape `tower_pad`/`tower_clipped` already have one step
back. Recorded rather than fixed: it is `field_fill`'s own step, and two changes wearing
one diff is what `B4e` warns about.

### `√N / 2` is the field's own radius, and a rim is jagged

Verified against `hex_to_px`'s furthest cell centre at six shells **before** it was
written down — identical to the last digit. And the drawn circle has to meet the wall it
describes, which is `B1`'s *"within 0.6 wu of every mark"* one shape over:

| shell | `√N/2` drawn | rim's nearest edge | furthest |
|---|---|---|---|
| 36 | 3.000 | 2.598 | 3.775 |
| 84 | 4.583 | 4.330 | 5.408 |
| 156 | 6.245 | 6.062 | 7.089 |
| 300 | 8.660 | 8.261 | 9.526 |

⚠ **There is no single radius ON a rim** — the edge midpoints span a band — and `√N/2`
is inside it at every shell. That is what makes the shell's own exact number honest to
draw, and any better-looking radius would be an offset invented here. The containment is
a test, with the band's own width asserted so it cannot pass vacuously.

### The order of the two readers is what keeps them apart

`wall_read_run` refuses a closed loop by construction, so a rim can never be a run and a
run can never be a disc. Asking the disc reader **only in the `refused` branch** means
the two cannot disagree about one window — and every window that already had an answer
pays nothing, which is the measured result below.

### ⛔ THE PROFILER REFUTED THE FIX, AND NAMED A FUNCTION I HAD NOT CONSIDERED

`disc.loft` pushed the `hex_editor` suite past **loft's own five-minute timeout** —
`EXIT=124`, and the first sign of it was a grep that printed **nothing**, which reads
exactly like a pass. *A grep over a log has `absent` for its default answer*, and
believing that silence would have shipped a suite that cannot finish.

The confident hypothesis was the shell walk allocating `87×87` sets. **Measured alone
that whole workload is 4.5 s, and there are 28 shells to 1728 rather than the ~100
assumed.** Acting on it would have trimmed the two rows that make the `break` and the
second membership site sound — weakening real checks to chase a cost that was not there.

`perf` on the actual workload:

```
14.10%  Stores::enum_parent_size          ← loft's store internals
 6.25%  getenv
 4.77%  String::clone      4.54% __strncmp_evex
 3.09%  Vec<Field>::clone  2.94% _int_free   2.09% malloc
 2.85%  Stores::copy_claims
```

**Store reads and the allocation they drag behind them — with the lattice arithmetic
nowhere in the profile.** That is `wall_of`, called six times per cell **per candidate**,
each pulling a `Hex` out of the store and cloning its fields. ⚠ **The store cannot change
while one window is being described, so the whole read is loop-invariant**: `candidates ×
window × 6` collapses to `window × 6`, read once into a flat table by `disc_marks`.

| | before | after |
|---|---|---|
| four shells over a 33×33 window | **> 120 s** | **12.0 s** |
| `disc.loft` | did not finish | **45 s** |
| the `hex_editor` suite | **`EXIT=124` at 5m00** | **2m52, 690 passed** |

⚠ **AND A WALL CLOCK HAD ALREADY LIED ABOUT THIS ONCE.** `probe/plan` A/B'd at **1m41
WITH** the disc reader and **2m29 WITHOUT** it — less work, more seconds — because this
box runs other agents' builds. [CLAUDE.md](../../CLAUDE.md) says cost is measured in
`w_tau` and *"a wall clock measures the machine"*; min-of-3 on a single emit is what gave
usable numbers, and the profiler is what named the function. ⚠ loft has **no profiler of
its own** — no flag, and the log config is severity and rotation only — so this was
`perf` on the interpreter, which the box permits (`perf_event_paranoid = 1`).

**And the refusal path costs nothing**, measured: a house window is 2468 ms against 2862
without the reader, because `disc_fits` bails on the first disagreement. That is the
step's upper bound — every plan view already in the tree is unaffected.

### Three more the writing turned up, all about narrowing

⚠ **`disc_span` IS NOT `tower_pad`.** The pad is deliberately generous — `isqrt(shell)+2`,
room for the boundary walk — so `tower_pad(36)` is **8** for a disc that reaches **2**
cells. Re-used as a candidate bound it skipped the very shell the editor had just
stamped, and `disc_recover` refused a rim it had drawn, saying *no disc of any shell
reproduces them*. ⚠ **A filter that narrows a search is a correctness surface**, not an
optimisation with a slow fallback — and the comparison it wrapped was right on the first
try, which is what made it look like the algorithm was wrong.

⚠ **`break`, NOT `continue`**, on the shell walk — worth 14 seconds a panel, and sound
only because a disc's extent never shrinks as its shell grows. That monotonicity is
**measured over the whole grid**, because a sequence that dipped would step over real
answers, which is the paragraph above happening again.

⚠ **A REFUSAL MUST CARRY ITS MARK COUNT.** `disc_no` zeroed it, so *no marks at all* and
*marks I could not explain* both answered `0` — the ambiguity `B0` and `probe/l1` both
paid for, rebuilt **inside the one function whose comment forbids it**. Its own test
caught it.

### Two captions that stopped being true

Both the same shape: a label that was accurate until the thing it labels gained a second
form.

| where | said | now |
|---|---|---|
| the panel caption | `run disc 0,0 shell 156` | `desc disc 0,0 shell 156` |
| the driver's summary | `description refused` | counts the `<circle>` too |

⚠ The second is the one to read: it counted only `<line class='run'>`, so on the first
picture it printed **`description refused`** for a tower whose description was three
lines above it **in the same file** — `disc 0,0 shell 156` in the panel and `refused` on
the summary, in one run. ⚠ And the slice length was caught before it ran:
`<circle class='disc'` is **20** characters, not 21, and the comparison would have
matched nothing while looking exactly like the bug being fixed.

### The sabotage sweep, and a row that was green because the FAULT was wrong

Five faults, restored from copies taken before the sweep — never `git checkout` — with
`disc_recover` asserted present **and the plan view asserted to draw its circle** before
row 0.

| # | the fault | what went red |
|---|---|---|
| 0 | *(control — nothing sabotaged)* | **nothing**, as it must |
| 1 | membership drifts from the library's by one shell (`<=` → `<`) | `disc.loft` |
| 2 | the shell filter's slack removed (`span + 3` → `span`) | ⛔ **nothing** |
| 2b | the shell filter genuinely too tight (`span - 2`) | `disc.loft`, four rows |
| 3 | only half the comparison — every boundary marked, not every mark a boundary | `disc.loft` |
| 4 | a refusal stops carrying its mark count | `disc.loft` |
| 5 | the drawn radius doubled — `√N` instead of `√N / 2` | `disc.loft` |

⚠ **ROW 2 IS THE ONE TO READ, AND THE ANSWER IS THAT MY FAULT WAS NOT A FAULT.** The
first instinct on a green sabotage row is *the tests are blind*; measuring it says
otherwise. The marks box of a disc is **exactly `2·disc_span + 1`** — measured at six
shells, margin **1**, every time — so `2·disc_span > span + 3` can never reject the
correct shell and neither can `> span`. **The `+ 3` is slack beyond necessity rather
than a tuned constant**, and removing it changes no answer.

✅ **The filter IS guarded, which row 2b measures**: at `span - 2` — the first value that
genuinely excludes the answer — four rows go red with the same *"no disc of any shell
reproduces them"* the `tower_pad` mistake produced. ⚠ **So a green sweep row is a claim
to check, not a verdict**: it means *this fault*, not *this class*, and telling the two
apart took one measurement of the geometry the filter is about.

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
