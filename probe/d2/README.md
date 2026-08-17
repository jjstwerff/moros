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

## ✅ 7. `D2`'s own premise: is the MODE the right authority for whether a verb exists?

    loft --lib lib/ probe/d2/gate.loft

`D1a` answered *can a person reach `inside`*. It does not answer the question `D2`
turns on, and the design's table is a claim that can be measured against the tree it
would govern:

> **outside** … removes doors, windows, interior stairs · **inside** … adds doors,
> windows, stairs up and down

Four rows, and the fourth exists because two different things fit the first three.

### ⛔ A · B — the mode and the opening verb disagree in BOTH directions

One house, sampled every quarter unit along the line a person walks in on. The store's
own wall column and `place_house`'s own filed runs are printed beside the mode, so the
flip is read against a measured line rather than a remembered one.

| | |
|---|---|
| the near wall's run, as filed | **z = −2.25** |
| the cells whose edges carry wall | z = **−4.00 … −1.25** |
| the mode flips `outside` → `inside` | **z = −2.00** |

**So an author standing on their own wall reads `outside`** — the flip is a quarter unit
*inside* the wall's line, and 8 of the 12 walled stations are on the wrong side of it.
The far wall repeats it: the run is at z = 5.25 and the mode is `outside` from 5.25 on.

### ⛔ AND THE CAUSE IS NOT THE MODE'S — THE ROOF DOES NOT REACH ITS OWN WALLS

Two hypotheses produce that flip and they want opposite fixes, so the two inputs `mode_at`
actually reads were printed beside its answer. **`feet` is `40` at every station**, so *the
author is standing on top of the wall, above the eave* is refuted — the walk resolves them
to the floor throughout. What is left is `plan_over`, and it is **`false` at the wall's own
line**. `place_house` files both the runs and the plan, and they disagree:

| | x | z |
|---|---|---|
| the four **wall runs**, as filed | −3.85 … **5.58** | −2.25 … **5.25** |
| the **gable's four eave corners** | −3.46 … 5.20 | −1.96 … 4.96 |
| short by, **each side** | **0.385** | **0.286** |

> **The drawn roof stops short of its own walls on all four sides.** `roof_point_x`/`_z`
> put the eave corners at exactly ±`plan_hw`, ±`plan_hd` — the same rectangle
> `roof_plan_over` tests — so this is one defect wearing two faces: the picture's eave and
> the mode's line are the same rectangle, and it is the wrong one.

The mechanism is `D1a.3`'s class one gesture over. `roof_plan_of` copies the footprint's
**cell counts** into the plan (`rp_wid: f.fp_wid`, `rp_dep: f.fp_dep`) and `plan_hw` reads
them back as `n · HEX_LEN / 2` — while the walls come from `footprint_walls`, which mitres
on the footprint's own boundary. **Two conversions of one footprint into one rectangle, and
they differ by a fraction of a hex.** ⚠ And `D1a.3` measured the masonry at ±0.433 about its
run, so the eave lands *within the wall's own thickness* rather than at or past its outer face.

⚠ **WHAT THE FIX COSTS, MEASURED RATHER THAN DISCOVERED LATER**: the same rectangle sets the
ridge — `roof_ridge_y` is `eave + pitch · plan_hd` — so a plan that reaches its walls is a
roof that is both wider and **taller**, and every gate that photographs a house moves.

Row B then asks both authorities at each of 25 stations, on a **fresh world per station**
because a cut changes the world a later station would read:

    the design's table would REFUSE  8 station(s) where the gesture works
    the design's table would GRANT   4 station(s) where the gesture has no wall

⚠ **And every working station cuts at exactly the same place — `(0, −2.25)`.** The verb
projects onto the run, so it is *position-independent within reach of the wall*; the mode
is not. Two authorities, and only one of them is stable where the verb is used.

### ⛔ And no drawing of the line reaches the corpus, because a wall does not need a roof

Row D gives the alternative hypothesis its own chance: **the table may be right and its
LINE wrong.** Inflating `place_house`'s roof plan by one cell each way moves the flip
from **z = −2.00 to z = −3.50** — the wall's line at −2.25 is inside it now, and
`house.keys`'s *two openings from two different modes at two stations its own comment
describes identically* would stop happening. So the line **is** misplaced and it is
cheaply fixable.

⛔ **It rescues nothing for `opening`.** A roof plan is filed by `verb place` alone, and
of the 18 openings in the live corpus:

| script | openings | a roof plan can exist? |
|---|---|---|
| `house.keys` | 2 | ✅ has `verb place` |
| `annex` `door` `embrasure` `furnish` `niche` `opening` `profiles` | **16** | ⛔ **no `verb place` anywhere in the script** |

**Sixteen of eighteen are cut into free-standing `verb run` walls in the open air**, where
`inside` is not a mode the world can produce however the boundary is drawn. A wall does not
need a roof, and gating the verb that opens one on being under a roof is not a line that can
be moved into the right place.

### ✅ C — the control fires, and it says the mode is the only test the tree has

Without this the probe could only ever argue against the design, which is not a
measurement. Both of these are verbs with **no precondition of their own**:

| | what happens today | what could have refused it |
|---|---|---|
| `storey` over a **bare meadow** | ✅ `storey +1 on 19 cells` | nothing — `storey_add` asks each column for a top and never for a building |
| `place` from **inside a room** | ✅ a second whole house, **84 writes**, roofs **1 → 2** | nothing |
| ✅ control: `opening` out of reach of every wall | refused, **`w_tau` +0** | — the clock can report *nothing happened* |

⚠ **AND THE CONTROL WAS WRONG ON ITS FIRST RUN, WHICH IS WHY IT IS PLACED WHERE IT IS.**
Written after the second house it measured **2 writes on a refusal that should have had
none** — by then the second house's walls were standing in the room and the opening
succeeded. ⚠ **And its station had to move**: at `(0, 1.0)` the far wall is 3.25 away and
still within `opening`'s reach, so *the middle of the room* cut a door. Row B's own sweep
is what picked `(0, 2.0)`. **A control taken downstream of the subject measures the subject.**

### ⛔ …but the question those two verbs need is not the question the mode answers

`storey` over a meadow and `place` inside a room both want **is there a building here**.
The mode answers **am I under a roof**, and as filed those are the same word — `outside` —
for a bare meadow *and* for an author standing on a house's own wall, which is exactly
where the corpus performs both of its storeys. Inflated by a cell it separates them.

### ⛔ And `raise` from inside does not move the ground under the building

The design's `inside` row removes *"terrain gestures that would move the ground under the
building"*. Asked at both facings, from `(0, 2.0)` in the editor's own house:

    facing +z   raise ok at (0,11)   13 of 127 ground cells moved, 0 INSIDE the footprint
    facing -z   raise ok at (0,-9)   13 of 127 ground cells moved, 0 INSIDE the footprint

`PEAK_AHEAD` is **10 hexes** and the house is 7.5 world units deep, so the disc always lands
clear of it. The binding's stated reason is not reproducible with the building the editor
makes. ⚠ **The first version of this row read one cell ahead and printed `40 → 40`** — which
reads as *nothing moved* and was the probe aiming at the wrong hex.

### ⛔ A defect found on the way past: a refusal that wrote 57 times

At `(0, 1.0)` a second `place` answers **`ak_ok: false`** — *"the walls stand but the roof was
refused"* — and the world's own clock says what that cost:

    w_tau 8378 -> 8435: a REFUSAL that wrote 57 time(s), and filed 8 runs (was 4)

`storey_here`'s own comment names this exact shape as the thing a refusal must never mean:
*"reporting `sy_ok: false` here would tell a driver nothing happened while the world had
already changed under it."* **The library holds two conventions for one situation and only
one of them is written down.** It is independent of `D2` and is recorded here because this
is where it was measured.

### ⏭ What this leaves `D2`

1. **`opening` is not the mode's to grant.** Its own precondition is exact, stable and
   already spoken (*no wall here to open — stand against one*); the mode is coarse,
   unstable at the wall, and structurally absent for 16 of 18 real uses.
2. **The mode's line excludes the wall, and one cell of inflation includes it.** That is
   worth fixing on its own, for `house.keys`'s two-mode inconsistency and for anything the
   mode is later asked.
3. **The verbs that genuinely have no gate are `place` and `storey`**, and what they want is
   *is there a building here* — a question the roof-plan registry can answer exactly and the
   shelter reading only approximates.

## ⛔ 8. `D2a`'s cost, and the two tests of one rectangle

> ⚠ **EVERY NUMBER IN THIS SECTION IS THE STATE BEFORE `D2a.2`**, kept because it is what
> the fix was chosen against. The two-cell floating-point coin flip and the uncovered band
> are both gone — § 9 has the after.

    loft --lib lib/ probe/d2/roofgap.loft

§ 7 measured that the roof plan's rectangle is 0.385 (x) and 0.286 (z) short of the wall
runs on every side. That is a fact about two registries; **what a person sees is a
different question**, and two answers fit it and want opposite fixes — a *hole* open to
the sky, or a *collar* of per-cell hex staircase, because `place_house` writes ROOF cells
too and `hex_mesh` draws one only where no plan covers it. A collar reads as a roof, which
is why this counts rather than renders.

### The house, meshed twice over the four chunks it occupies

| | verts | tris |
|---|---|---|
| with the plan — what the editor draws today | **5340** | 3892 |
| with no plan — every roof cell drawing itself | 5493 | 4042 |
| the plan saves | **153** | 150 |

### ⛔ And the tree already holds TWO tests of this one rectangle, half a hex apart

    roof_plan_covers(rp, q, r)    au <= hw + HEX_LEN*0.5    the MESHER's, asked per CELL
    roof_plan_over(rp, x, z)      au <= hw                  `shelter_at`'s, asked per POINT

**Each is right about what it asks** — a cell reaches half a hex past its centre and a point
does not — and the pair still leaves a band with nothing in it, because the mesher
suppresses out to `hw + 0.866` while the **gable is only drawn out to `hw`**:

    27 roof cell(s): 2 beyond the drawn gable, 0 still drawn as cells
    so 2 cell(s) are removed with nothing drawn over them   — (3,0) and (3,2), both at x 5.2

> **So it is not a collar. All 27 roof cells are suppressed, and the drawn gable stops
> 0.29–0.39 short of the wall line on every side** — a band all round the house that the
> plan removed cells from and does not itself cover. ⚠ Whether a viewer sees sky through it
> depends on the wall's own top, which this probe does not measure and does not claim.

⚠ **AND TWO OF TWENTY-SEVEN IS A FLOATING-POINT KNIFE EDGE**, not a shape: those cells' centres
are at x 5.196 against a rectangle edge of 5.196. An equality decides whether a hex staircase
appears beside a gable.

### ⛔ The probe's own first run reported a full set of plausible numbers and was aimed nowhere

`chunk_meshes_all` takes **chunk indices**; the first version passed `hex + n · CHUNK_W`. All
25 chunks came back **448 verts / 384 tris** — `ringmesh`'s *bare ground* row — because since
`GROUND_DEFAULT` a chunk with nothing in it still meshes a defaulted ground. So the scan
printed `with plan == without plan` and **the plan saves 0**, which is a conclusion, not a
miss. ⚠ **A wrong number is worse than a guess, because a number gets believed.**

### ⏭ So `D2a` is: the plan's rectangle is the footprint's own, not a second derivation of it

`roof_plan_of` copies `fp_wid`/`fp_dep` and `plan_hw` reads them back as `n · HEX_LEN / 2`;
the walls come from `footprint_walls` mitring on the footprint's boundary. **The correction
is not one constant** — 0.385 in x against 0.286 in z — which is what says it must come from
the footprint rather than from a fudge. ⚠ **And the cost is real**: `roof_ridge_y` is
`eave + pitch · plan_hd`, so a roof that reaches its walls is wider **and taller**, and every
gate that photographs a house moves.

## ✅ 9. `D2a` — built, in two phases, and the rectangle is the walls'

    loft --lib lib/ probe/d2/roofrect.loft     # the rectangle, over 20 (wid, dep) pairs
    loft --lib lib/ probe/d2/roofcells.loft    # the stored cells against the drawn gable
    loft --lib lib/ probe/d2/roofedge.loft     # how far outside, and where

### ⛔ The rule could not be read off one house, and the sign is why

§ 7 measured ONE footprint and reported *the plan is 0.385 and 0.286 short*. Over twenty
(wid, dep) pairs that is not the rule:

| dep | the plan against the walls |
|---|---|
| 3 | **−0.348** — the roof OVERHANGS |
| 4 | +0.286 — it falls short |
| 5 | **−0.580** — it overhangs |
| 6 | +0.054 — it falls short |

**The error changes sign with parity**, and along u it alternates by the parity of `wid`
too. So no constant outset could ever have fixed it, and *the plan is a bit small* was a
conclusion drawn from a single instance. ⚠ This is `D1a.1`'s lesson again: a rule read off
one case is a guess with a number attached.

### The fix, in two phases, because one of them can be byte-identical

**`D2a.1` — the cells come from the plan.** `S6b`'s own comment said the drawn roof and the
stored roof agree *"because both take the ridge height from the same `eave + pitch * hd`"* —
the same FORMULA from two bodies (`hex_draw::draw_roof` for the cells, `roof_plan_y` for the
gable), which is agreement by coincidence and holds only while both read the same rectangle.
`roof_over` takes the filed `RoofPlan` and writes each cell from `roof_plan_y`; `place_house`
builds the plan one line earlier and files the object it wrote the cells from.

`roofcells.loft` is what said this could be **byte-identical**: the stored heights were
already `floor(roof_plan_y / unit)` at all 27 cells, differing by −0.299/−0.499/−0.699 —
pure truncation, no shape. Confirmed: `make parts` byte-identical, `make headless-same` rc 0,
`probe/k3d` 31 unmoved.

**`D2a.2` — the rectangle is the outline its own walls enclose.** `RoofPlan` gains `rp_hw`
and `rp_hd`, filled by `roof_plan_of` from `footprint_walls`' mitred outline plus half the
wall band, and the six extent readers use them instead of `plan_hw`/`plan_hd`. Re-measured:

    every (wid, dep) pair, both axes:   the roof is exactly -0.433 beyond the wall line

**−0.433 at all twenty, on both axes** — `wall_band() / 2`, so the eave lands precisely on
the wall's outer face at every size. That was −0.58 … +0.50 varying by parity.

### ⛔ And the edge-by-edge version of the claim is FALSE, measured before it was dropped

The first test written for this asked *every stamped wall edge MIDPOINT is under the roof*
and went red at **2 of 34 on a 4×3**. `roofedge.loft` asked how far and where:

    4x3   2 of 34 outside — worst over u 0.087, over v 0
    5x5   4 of 46 outside — worst over u 0.197, over v 0
    4x4 · 5x3 · 6x4        0 outside

> **Only ever over u, never over v, and at most 0.197.** The stamped boundary is a zigzag and
> the roof is a straight rectangle — which is the whole of `S6b`. **A straight roof cannot
> cover a jagged wall edge for edge**, and outsetting until it did would mean chasing an
> amplitude that varies with size: an approximation in an exact-geometry domain.

So the asserted claim is the one that is exact and that the mesher's suppression actually
rests on: **every column the house roofed is under its own plan**, over nine sizes, with the
NOMINAL rectangle as the control that must miss. Without that control the row is satisfied
by any roof big enough and has never been red.

### ✅ What moved, and `house.keys` answering `D1`'s question by itself

`probe/k3d`: **9 records, and they are exactly the 9 scripts that place a house** — every
script with a `verb place` moved and no script without one did. Every changed line is the
ridge, `21 → 23` (and `31 → 33` for `seat.keys`' seated house), which is
`pitch 0.7 × 0.719 / 0.25 = 2.01`. No cell count, no wall-edge count, no τ, no chunk count
and no other sentence moved.

⚠ **And one line that is not a height.** `house.keys` cuts two openings at stations its own
comment describes identically — *"stand ON the wall's own cells"* — and `D1` found them
reading **two different modes**, which is the fact it handed to `D2`. With the roof reaching
its walls they are **both `inside`**. The inconsistency closes as a consequence of the
geometry rather than as a rule about modes, which is what says the rectangle was the defect.

### ✅ And the band § 8 measured is closed — with the vertex count unmoved

    27 roof cell(s): 0 beyond the drawn gable, 0 still drawn as cells
    so 0 cell(s) are removed with nothing drawn over them        (was 2)

⚠ **AND THE MESH TOTALS DID NOT MOVE — 5340/3892 before and after — WHICH IS WHY A COUNT
WAS THE WRONG INSTRUMENT FOR THIS ONE.** The gable is six points however big the rectangle
is, and the two stray cells were already suppressed by `roof_plan_covers`' half-hex; what
changed is which cells the drawn surface *covers*, and a vertex total cannot see coverage.
`fence.mjs` reading counts against a store was the same shape at `D1a.1`, one registry over.

### ⛔ And the gate suite cannot see this change — 44 PASS is not verification

`GATE_JOBS=1 make gate`, all 49 serially (parallel is worthless here — `D0` measured two
suites fighting over port base 18200 and producing six false reds):

    44 PASS   5 FAIL — cache · camera_indoors · cellar_ceiling · client_mesh · deck_soffit

**All five are loft#950**, each with the recorded signature — `parts -1`, `cam false`,
`sky 1` over 33,600 samples, or a bare *"(no cache report)"* / *"(no ground report)"*. Four
are in [STATE](../../doc/claude/STATE.md)'s list; **`deck_soffit` is a fifth that list did
not have**, which is the third time this file has recorded a browser-gate grep coming back
short.

⚠ **`deck_soffit` WAS CONTROLLED RATHER THAN ASSUMED.** A worktree at the pre-`D2a` commit
runs it too: **it fails there as well**, on the same row (`soffit 0 outside 0.9..1`), with
`mesh soffit = 342 vertices PASS` **identical on both sides**. So the geometry this change
touches is unmoved in that gate, and the failure is pre-existing. ⚠ The two runs' *frames*
differ — one rendered `other 0.9957`, the other pure sky — and both are broken pictures;
nothing more than that is claimed.

> ⛔ **AND HERE IS THE PART THAT MATTERS: NOTHING IN `make gate` COULD HAVE SEEN THE TALLER
> ROOF.** Every gate that renders a house is among the five that are down. `part_mode`, the
> one gate that compares the roof-plan registry, does it as a **save-and-restore round
> trip** — both sides move together, so it catches *restored except for its roof* and is
> blind by construction to *the roof is a different size*. And no gate asserts the ridge at
> all: `level.mjs` and `stencil.mjs` are the only files that say the word, and both mean a
> hill.

**So `44 PASS` is 44 gates that could not see it**, not 44 confirmations — STATE's own rule,
*when a green run is used to clear a change, ask what it does not run*, applied to this one.
What DOES measure the geometry is `lib/hex_editor/tests/roof_plan.loft`: the plan covers every
roofed column at nine sizes with the nominal rectangle as the failing control, and the drawn
surface equals the stored heights exactly over all 27 columns.

⛔ **What is genuinely unverified is the PICTURE**, and it cannot be verified today: the
`--html` client traps before it draws, so neither a gate nor `make probe-demo` can photograph
a house. That is loft#950's blast radius reaching this step, and it is recorded rather than
worked around.

### ⚠ And `make lib-test` failed once, transiently, in a way that reads as a broken package

`hex_mesh` came back **10 files, all parse errors** — *"Library `hex_edge` not found"* against
`hex_way`'s own source, plus *"Undefined type Plan"* against `hex_draw`'s. It reads as a
dependency graph that has come apart. It had not: two worktrees, one at the pre-`D2a` commit
and one at HEAD, both answer **73 passed**, and the main tree passes on a retry with nothing
else running. **Two `loft` builds at once is the cause** — this file's own closing note says
*one `loft` at a time on this box*, and what it did not say is that the failure mode is a
resolution error pointing at a registry package rather than a slow build.

## ✅ 10. `D2a`'s own sentence, re-measured — and the house has two walls missing

    loft --lib lib/ probe/d2/gate.loft       # the mode's line, re-run after D2a
    loft --lib lib/ probe/d2/reach.loft      # what the opening verb's reach actually is
    loft --lib lib/ probe/d2/farwall.loft    # where the 84 wall edges are

§ 9 recorded what `D2a` *built*. It did not re-run § 7, so the table this plan has been
quoting — **refuse 8 · grant 4** — was still the pre-`D2a` reading. Re-running it is what
this section is, and it answers `D2a` and then goes past it.

### ✅ The line is the wall's outer face now, and that is the whole claim

| | before `D2a` | after |
|---|---|---|
| the near wall's run, as filed | z = −2.25 | z = −2.25 |
| the gable's eave corner | z = −1.96 | **z = −2.68** |
| the mode flips `outside` → `inside` | **z = −2.00** | **z = −2.68** |
| where that is, relative to the run | **0.25 INSIDE it** | **0.43 outside it** |

**0.43 is `wall_band() / 2`** — the masonry's own outer face, § 9's −0.433 arriving at the
one place it was aimed. *An author standing on their own wall reads `outside`* is false now,
at every station in the walled band. `D2a`'s sentence is met exactly, and by construction
rather than by tuning.

### ⛔ And the disagreement did NOT close — which is the point, not a shortfall

    the design's table would REFUSE 14 station(s) where the gesture works
    the design's table would GRANT  18 station(s) where the gesture has no wall

⚠ **Those are not comparable with § 7's 8 and 4 — the WINDOW changed, and it had to.** Row B
sampled z −4.00 … +2.00, a range drawn from the `store WALL` column because that is the datum
§ 7 had. `store` is **hex-quantised**: it answers *the cell I stand in carries a wall edge*,
a `HEX_LEN`-wide answer to a `wall_band()`-wide question, so a station a whole hex clear of
the masonry still says `WALL`. The verb reaches further than that window, so the old numbers
undercounted at both ends. Row B is row A's window now and neither is chosen.

> **The two authorities have different SHAPES, and no placement of the rectangle can make
> them agree.** The mode is a continuous rectangle test. The verb is `span_mark` over the
> author's cell **and its six neighbours**, then the cell one unit ahead and *its* six, with
> a `open_ahead` fallback — cell-quantised and hex-shaped, reaching from four units outside
> the wall. `D2a` moved the rectangle onto the masonry, which was a real defect and is fixed;
> it was never going to close a gap that is structural. **§ 7's split of `D2` stands, and this
> is the measurement that says so from the other side of the fix.**

### ⛔ AND THE HOUSE THE EDITOR PLACES HAS TWO OF ITS FOUR WALLS MISSING

Row B refuses every station from z = +1.25 to z = +6 — including **standing 0.75 inside the
far wall, facing it**. That is not reach, and `reach.loft` asks the question the sweep's fixed
facing hides: can an author cut a door in each of their own four walls?

    near  (z=-2.25)  author (0,-1.5)   mode inside  -> cut at (0,-2.25)
    far   (z= 5.25)  author (0,4.5)    mode inside  -> REFUSED — no wall here to open
    left  (x=-3.85)  author (-3,1.5)   mode inside  -> cut at (-3.85,1.5)
    right (x= 5.58)  author (4.8,1.5)  mode inside  -> cut at (5.58,1.5)

`farwall.loft` dumps every stamped edge. `place_house` says **`84 wall edges`**; the store
holds **23**, and they are not spread over four walls:

| run | as filed | edges present | |
|---|---|---|---|
| near | z = −2.25 | **12**, x = −3.90 … 5.63 | ✅ complete |
| left | x = −3.85 | **9**, z = −2.25 … 5.25 | ✅ complete — a zigzag over three x columns |
| right | x = 5.58 | **4**, z = −2.25, −0.75, 2.25, 5.25 | ⛔ gaps, and no zigzag partners |
| far | z = 5.25 | **2**, x = −3.90 and 5.63 | ⛔ **the two corner posts and nothing between** |

⚠ **ASKED AT EVERY HEIGHT BEFORE IT WAS CALLED MISSING** — *absent* and *stamped one storey
up* read identically at one `ref` and want opposite fixes. Over twelve heights from the seat
up, the far run is **4 sightings at every one** and the near run **24 at every one**. It is
absent.

⚠ **AND IT IS PRE-EXISTING, CONTROLLED RATHER THAN ASSUMED.** A worktree at `3e3ac22` — the
`D2p` commit, before `D2a.1` — gives the **same 23 edges and the same 4/24 split**, with only
the ridge moving (61 → 63, `D2a.2`'s known change). This is not a regression; it is a shipped
defect that nothing in the tree was looking at.

> **So the editor cannot put a door or a window in the far wall of any house it places**, and
> `S6b`'s roof has been drawn over it the whole time. The `44 PASS` sentence in § 9 covers
> this too: no gate asserts a wall edge count, and the mesher draws walls from the **runs**
> — which are all four, filed correctly — so the picture looks right and the store is wrong.
> ⏭ `D2c`.

### ⚠ Three of this section's own instruments were wrong first

⛔ **The buckets scored the side walls at 4 each and the left wall has 9.** The midpoints
alternate over **three** x columns — −3.46, −3.90, −4.33 — which is `D1a.1`'s zigzag one
gesture over, and a ±0.25 window around the run caught one column of three. The unfiltered
dump is printed first now and the buckets are checked against it. ⚠ The far wall's 2 survives
that fix, which is what makes it a finding rather than a second bucketing error.

⛔ **`reach.loft` printed a projected centre for every REFUSED station and it was believed.**
A refusal returns `opening_none()`, whose `(0,0)` reads exactly like a projection onto a run
through the origin — so *the verb stops projecting past z = 1.25* was a confident and entirely
wrong account of the data, drawn from a field that means nothing when `om_ok` is false.

⛔ **And `gate.loft` row A grew an `opening_would_find` that is not the verb's precondition.**
It reproduced `open_ahead`'s two-cell search; the gesture actually runs `open_span`, whose
`span_mark` sweeps a whole ring. The two disagree at **8 of 49 stations**, which only showed
because row B — the real gesture — was printed beside it. A second body of a rule, in a probe
written to catch second bodies of rules.
