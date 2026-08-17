<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# `probe/d2` — `D2`'s premise, measured before `D2` is designed

Plan [22](../../plans/22-pages-client/README.md) `D2` binds a verb to the derived mode:
*inside a house you get doors, windows and stairs; outside you get terrain and placement.*
Before writing that table, two questions had to be answered with numbers rather than with the
design's own guess.

    loft --lib lib/ probe/d2/door.loft          # can a person walk into a building?

## ⛔ 1. The live corpus performs 143 of its 144 gestures from `outside`

`D1`'s `mode_at` printed beside every `verb` line, over all 31 scripts in `tools/scripts/`
at `GROUND=0`. The full record is [`verbmode.txt`](verbmode.txt); the tally:

| mode | verb | presses |
|---|---|---|
| **inside** | `opening` | **1** |
| outside | `raise` | 78 |
| outside | `run` | 22 |
| outside | `opening` | **17** |
| outside | `place` | 10 |
| outside | `annex` | 4 |
| outside | `seat` | 4 |
| outside | `stair_up` | **2** |
| outside | `storey` | **2** |
| outside | `cellar` | **1** |
| outside | `hole` · `slab` · `wall` | 1 each |

**One script of 31 ever performs a gesture from `inside`, and it is `house.keys`, once.**
The design's table would refuse 17 of the 18 openings, both stairs, both storeys and the cellar.

⚠ That is not by itself evidence the design is wrong — the corpus was written for a runner with
no keyboard, and it teleports to convenient stations rather than walking. **The question it
raises is whether walking in is possible at all**, and that is question 2.

## ⛔ 2. It is not. A door is one hex edge, and the boundary is two

`door.loft` builds `indoors.keys`'s house, cuts an opening where `threshold.keys` measured the
feet stopping, and drives the tick's own collision path — `walk_proxy` then `walk_to`, aimed
straight through:

| the world | the walker reaches |
|---|---|
| house, opening cut as the editor cuts it (**1 edge**) | **z = −2.26** — outside the wall |
| the same house, the cell's **other** edge cut too | **z = 5.24** — inside, stopped by the far wall |
| ✅ control: no house at all | **z = 6** — the full aim |

The store says why in one line. The cell the walk crosses carries **two** wall edges:

    before   (0,-2)   4:WALL  5:WALL
    after    (0,-2)   4:DOOR  5:WALL        ← `session_open_kind` marks exactly one

`session_open_kind` hardcodes `open_ahead(w, a, DOOR_MAT, 1)`, and the walker meets the edge
that is still `WALL`.

### ⛔ And the cause is the split `gesture.loft` names itself

> *"THE EDGES ARE THE INDEX; THE OPENING IS THE TRUTH … the index says WHICH boundary, the
> opening says HOW MUCH of it, and only the second has to fit a door."*

The renderer honours the `Opening` — `op_half 0.65`, so **1.3 world units** of doorway, with a
spring line and a depth. The WALK honours only `wall_stops_walk(<edge material>)`. A hex edge is
about 0.87 wu, so a 1.3 wu doorway does not fit in the one edge that gets marked, and the rest
of the boundary stays shut to a person while being drawn as open.

### ✅ And the fix's shape is geometry, not opinion — the numbers say *mark the span*

*Mark more edges* is only right if the opening's own span really covers where the walker crosses.
If it did not, the wall was stopping them correctly and the coarse index would not be the defect.
So the probe plots the instance and reads the rule off it:

    opening centre (0, -2.25)   half 0.65
    the walk stopped at (0, -2.26)      0.010 from the centre
    edge 4  midpoint (-0.43, -2.25)     0.433 from the centre
    edge 5  midpoint (+0.43, -2.25)     0.433 from the centre

**Both edges lie inside the doorway's own half-width, and the walker crosses 0.01 from its
centre.** So the opening covers the crossing and the index marked one of the two edges it spans.

> **The rule: mark every wall edge whose MIDPOINT lies within `op_half` of the opening's centre.**

⚠ **And it is not *mark everything*, which is the thing that would make it useless.** The next
edge midpoints along this wall are 0.87 further out — **1.30** from the centre, outside 0.65 — so
a wider opening marks more and a narrower one marks fewer. That discrimination is what a test for
this has to assert, because a fix that simply marked every edge of the cell would pass the walk.

### ⛔ …and building it found the second half of the same divergence

`D1a` was written — `open_span`, marking every wall edge whose midpoint is within `op_half`, with
`session_open_kind` deciding the SHAPE first so the width is known before the store is marked —
and **five of `opening.loft`'s eighteen tests refused with *no wall here to open***. It was
reverted rather than patched, because the reason is not the rule:

    author on a ring cell            (3.464, 0)     — `fence_disc`, which registers no RUN
    opening_make centre              (3.464, 0)     — `run_point_near` had nothing to project onto
    every edge midpoint of that cell  0.866 away    — against a half of 0.65

⚠ **AND `opening_cuts` — the renderer's OWN inside-test — uses the same plain distance**
(`if d2 > o.op_half * o.op_half { return false; }`). So by the drawing's own rule **no point of
that boundary is inside this opening**: the store has said `DOOR` on an edge since `open_ahead`
was written, and the picture has no hole there. That is the index/truth split in the direction
this probe's row 5 could not reach, and it is a fact about a wall with **no run** rather than
about the span rule.

> **So `D1a` is not a reorder plus a distance test.** It also has to decide what an opening means
> on a wall that no run describes — `fence_disc` builds one, and five library fixtures stand on it.

⏭ The two candidates, neither chosen here: give `fence_disc` a run so every wall has a
centreline, or let an opening fall back to the EDGE it was found on when there is no run to
project onto. The first makes one rule; the second keeps a gesture working where the first would
change five fixtures' worlds.

## ✅ 4. `fence_disc` has runs now — and what that changed in the picture, measured

The user's call: **give `fence_disc` a run.** `ring.loft` measures the shape first, because
the obvious answer is wrong — *six runs, one per lattice direction* is refuted by the dump,
since at radius 2 direction 1 carries three collinear midpoints **and** two on a different line.

> **A flat side of a hex region is a ZIGZAG of two alternating edge directions whose MIDPOINTS
> are collinear** — the same sentence `hex_form::side_edges` already makes about a rectangle.

Sorted by that line the boundary is six straight sides of `2·rad + 1` midpoints — 18, 30, 42 at
radii 1, 2, 3, which is what `fence_count` answers — with corners at **√3 · (rad + ½)** from the
centre at 0°, 60°, … 300°. Read off three radii and then asserted against all of them: **every
stamped midpoint lies on one of the six segments at worst miss 0**, and the control — the same
midpoints against a hexagon one radius smaller — places **0 of 30**.

### ✅ The drawing changed, the store did not, and the third row is what says which

`ringmesh.loft`. ⚠ **No gate could have answered this**: `fence.mjs` reads *fenced 30 edges, 15
stored outside* — counts against the store, which this step leaves byte-identical on purpose.

| radius | edges only | both | runs only | bare ground |
|---|---|---|---|---|
| 1 | 508 / 404 | **688 / 464** | **688 / 464** | 448 / 384 |
| 2 | 556 / 420 | **760 / 488** | **760 / 488** | 448 / 384 |
| 3 | 580 / 428 | **868 / 524** | **868 / 524** | 448 / 384 |

⚠ **THE MESH GOT BIGGER, AND THE THIRD COLUMN IS THE ONLY THING THAT SAYS WHY.** Two
explanations fit a bigger mesh: the analytic wall costs more than the panels it replaces, or the
panels were never suppressed and a ring is drawn twice — *a staircase inside a wall*, the one
thing `hex_mesh`'s own comment forbids. **`both` equals `runs only` exactly at all three radii**,
so the ring's per-edge panels contribute nothing at all: suppression is total. The ring's own
geometry goes from **60 verts** of flat panel to **240** of a wall with thickness and ends.

⚠ **AND THE CORPUS FOUND WHAT A GREP MISSED.** `grep '^verb '` over the corpus reported no ring
anywhere, and `annex.keys` lays one — its verb is `wall`, and reading the tally too quickly is how
*this corpus is blind to the change* nearly went into a commit message. `probe/k3d` moved exactly
one record, on exactly one field: `runs 1 → 7`, with the world md5, τ, chunks, the annex count and
every printed sentence unmoved.

### ⛔ And `annex_host`'s trunk clause was never comparing like with like

`press.loft`'s balcony went **`round false`** the moment a ring had runs: it hung on a flat side of
the cylinder it was standing against. The clause read `ah_best > ah_dr` — the distance to the
nearest straight WALL against the distance to the ring's **centre** — which is only ever true
because a ring registered nothing, so `ah_best` was some other wall or 1000000.

`R1b`'s sentence — *a ring of wall is a cylinder and a cylinder is a host* — was true by the
accident of an empty registry. It is a condition now: **a live trunk within reach IS the host.**
⚠ What that costs is stated rather than left quiet — an author near both a ring and a house wall
gets the ring, where before they got whichever the broken comparison happened to prefer.

## ✅ 5. `D1a.2` — the opening marks its span, and a person gets through

`session_open_kind` decides the SHAPE first (`opening_make` writes nothing) and then marks every
wall edge whose midpoint is within `op_half` of the opening's centre — the same distance
`opening_cuts` uses, so an edge is never passable where nothing is drawn.

    after the cut  (0,-2)   4:DOOR 5:DOOR        (was 4:DOOR 5:WALL)
    the walk       -8 -> 6  reaches 5.24         (was -2.26; control with no house 6.0)

### ⛔ And the corpus refused seven records, because a `verb run` wall's centreline is not on it

Span-only marking made `door`, `niche`, `embrasure`, `opening`, `profiles`, `house` and `annex`
answer *no wall here to open*. Measured:

    run registered   (-6,0) -> (6,0)        through the author's CELL CENTRES
    stamped edges    midpoints at z = -0.75  the nearest lattice edges to that line
    opening centre   (0,0)                   the run's projection
    nearest edge     0.866 away              against a half of 0.65

**`z = 0` is a row of cell centres and no lattice edge lies on it**, so `wall_stamp` marks the
edges half a row off the line it was given. `place_house` does not have this — `footprint_walls`
gives mitred corners on the wall's own boundary — which is exactly why the house case was fixed
and these five were not.

⚠ **`opening.loft` already records the mirror of this**: *"a cell centre can sit half a hex off
the run — 0.75 m — and a hole 1.1 m wide centred there misses the wall entirely"*, which is why
`run_point_near` exists. The same 0.75 in the other direction had nobody looking at it.

> **So the marking has a FLOOR: every edge the opening covers, and never fewer than one.** That
> makes the change a strict superset of `open_ahead(…, 1)` — `probe/k3d` is **31 scripts unmoved**
> — and it names the remaining gap instead of hiding it.

⏭ **`D1a.3`**: reconcile `session_wall`'s centreline with the wall it stamps. Bigger than it
looks — `emit_run_wall` draws from that same line, so a run that moves moves the picture.

### ⛔ And an embrasure is *already open*, which is not *no wall here*

`20 + kind` is cut into the BACK of a standing niche, so every edge inside its span was already
turned into an opening by its host and there is nothing left to mark. `open_ahead` never met this:
it took the first `WALL`/`FENCE` edge in direction order and a one-edge niche always left a
neighbour standing. `span_mark` counts *already an opening* separately — a boundary that is
passable is not a boundary that is absent.

## ✅ 6. `D1a.3` — the run goes onto the wall when the wall has a line

`runline.loft` asks the half `D1a.2` could not: `emit_run_wall` builds from the run's line and
never reads an edge, so if the two disagree the **picture is off the wall**. On `door.keys`'s own
wall, before:

    the RUN says       z 0
    the STORE says     14 edges, midpoints ALL at z -0.75
    the PICTURE says   wall vertices z -0.433 .. +0.433   — centred on the line

The drawn masonry's near face stops **0.317 short** of the boundary a walker collides with.
✅ **The control coincides exactly**: `place_house`'s runs are at z −2.25 and 5.25 and so are its
edges, because `footprint_walls` gives corners on the wall's own boundary rather than a walked line.

### ⛔ And *just shift the run* is refuted for most headings

| heading | edges | offset range | spread |
|---|---|---|---|
| **0** | 14 | −0.750 … −0.750 | **0** — straight, and off its line |
| 2 · 6 · 10 | 15–17 | — | 0.866 |
| 3 · 7 · 9 | 15 | — | 1.345 … 1.553 |
| **4** | 14 | +0.033 … +0.033 | **0** — straight, and on its line |

For six of eight headings the wall **zigzags about** its run and there is no line its edges lie
on; moving it would be a best fit presented as a fact. So the rule is narrow and exact:

> **When every stamped edge shares one perpendicular offset, the wall HAS a line and the run must
> be it.** The heading is the author's and only the offset was ever wrong.

⚠ **Read back from the edges the loop just wrote**, never re-derived from the lattice — and the run
is registered *after* the marking now, because it may not be filed until the edges it describes
are known. ⚠ **A run already on its wall is left alone, and that is not belt and braces**:
`place_house`'s coincide to the last bit, so `olo` is ~1e-16 and shifting by it perturbed two
mitred corners in the sixteenth digit — `test_the_four_runs_meet_end_to_end` went red on
`0.7916666666666674` against `0.7916666666666676`.

### ✅ What it fixed, and the corpus is the instrument

    the RUN now says   z -0.75          the STORE says  -0.75 .. -0.75
    the PICTURE now    z -1.183 .. -0.317               centred on -0.75

Seven records moved, every one legible: `opening kind 1 at 0,0` became **`at 0,-0.75`** — the
opening lands on the wall instead of on the line the author walked — and `door`'s τ rose 108 → 109
as `D1a.2`'s span found the second edge it now covers. `furnish` moved by 0.25 on two different
headings, which is the same correction at two different offsets.

⚠ **The vertex COUNT is not comparable across this change and the probe says so** — it reads 258
before and 126 after, both pure run geometry from one run of unchanged length, because
`emit_run_wall` takes the chunk and the probe meshes chunk (0,0) alone. **The z range is the
claim.** ✅ And `occlude` reads `ringAt 4.33` — √3·(2+½), `D1a.1`'s corner radius from an
independent gate.

### ⏭ What follows for `D2`

**The `inside` mode is unreachable by walking, in every driver.** So `D2` cannot bind the
opening, stair and storey verbs to `inside` — it would make the editor's own house tools
reachable only by teleporting, which no person in a browser can do. The opening has to mark the
edges its own width covers first.

## ⛔ 3. A row that could not have found what it was aimed at, kept for its absence

Row 5 asks the coarseness the other way round: `open_ahead` writes `DOOR_MAT` for every profile,
so a **window** should be as walkable as a door. It measures nothing, and the row prints why —
`select 2` is an *outline* (pointed rather than round) and the height band comes from `up`:
the opening is `band 0..11 half 0.65`, floor to head, **exactly the door's**.

**There is no raised sill in the selection vocabulary today**, so the walker passing at 5.24 is
correct behaviour. The row is kept, printing its band, because the absence is the finding: the
hypothesis is untestable in this tree until an opening can have a sill.

## Notes on running it

⚠ **Three `use` lines and no more.** A program under `probe/` is not inside a package, so
`use hex_edge;` sends the resolver to the REGISTRY — it then tries to auto-install every internal
module basename in the graph (`gesture`, `catalogue`, `codec`, …) and drowns in HTTP 429s.
Everything here is reachable through `hex_editor`, which is what a consumer sees anyway.

⚠ **One `loft` at a time on this box.** Concurrent invocations serialise on the build cache: a
single `--check` measured **4m19s real against 4s of CPU** while five others were compiling.
