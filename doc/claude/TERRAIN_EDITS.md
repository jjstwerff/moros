# How the ground moves, and what moves with it

**The rules a terrain gesture obeys, and the measurements that settled each one.** The
*model* — the voxel, layers, columns, the windowed height — is
[WORLD_MODEL.md](WORLD_MODEL.md); this is what happens when a gesture writes to it.

Extracted from [plan 20](../../plans/20-verticality-last/README.md) as its phases shipped. The
plan keeps only what is still open.

> **Why this exists at all.** *"Verticality is always important in 3d games, and most editors
> force you to get that in early in the level creation. But now you can start with a flat
> plane, add the locations & misc houses and at the end of it add or tweak the verticality to
> get a cool landscape with the correct viewing angles in it too."*
>
> That is an **ordering** claim, not a feature: terrain becomes the last authoring step instead
> of the first. It only works if raising the ground carries what is already standing on it —
> everything below is what that costs.

## T1 — A raise moves ground; it does not repaint it

`brush` ended in `ground_set(w, q, r, h, SURFACE_MAT)` unconditionally, so raising a hill under
**anything** turned it to grass. Measured over every material a cell may hold
(`probe/house/mats.loft`): road, field, floor and roof all came back `surface`, and a house's
27 floor cells went to 0.

⚠ **It was never a house bug.** `LEVEL` walks the same function, so levelling along a road
erased the road as you walked it.

⚠ **And the default must stay.** A cell nobody has written holds material 0, and 0 is
*absence* rather than a colour — so *keep what is there* must not keep nothing, or the gesture
that builds a hill out of open ground stops producing ground. Absent becomes surface; anything
already chosen is kept.

## T2 — A building rides the terrain rigidly and ends on its own pad

A smooth falloff is exactly what a hill wants and exactly what a building cannot take:
measured, a raise of 6 moved a 27-cell floor by **3..6**, leaving it three units out of level.

> **"Like a hill" cannot mean a hill's arithmetic.** The end result is *a house on its own
> hill*: the fabric takes ONE delta and ends level, and the ground around it keeps the falloff
> and flares away beneath. A flat pad with slopes falling off it is a terrace, and it is the
> only shape under which a building both moves and stays a building.

**The delta is the largest the disc offers any member**, so a house whose porch clips the rim
rises by what its middle was asked for and sits on the crest — the difference between *a house
on its own hill* and *a house on the side of one*.

**Each connected structure is its own body**, so a second building further down the same
stroke gets its own level pad rather than the crest's.

⚠ **`lift_column` moves EVERY layer**, which is what carries a roof with its floor: a roof is a
band in the same column, not a mesh. Moving only the ground cell left 27 roof cells hanging at
their old height with the floor risen through them — and a **count** of roof cells could not
see it, because none was lost. The gate asserts the **gap**, not the count.

### What counts as fabric — read liberally

A floor cell, or a cell carrying a wall or fence edge. A fence running off the porch is part of
what must not be torn, and the flood follows a structure **wherever it goes**, disc or no disc:
a fence crossing the rim is one fence, and lifting half of it tears it on exactly the seam the
falloff would have.

⚠ **A ROAD IS DELIBERATELY NOT FABRIC** — a road takes the incline, because a road may slope
and a floor may not.

⚠ **THE PREDICATE ASKS ALL SIX DIRECTIONS.** An edge is stored ONCE, on a canonical owner —
measured, `wall_set(w, 3, 0, SLOT_NE, …)` lands on cell `(3,−1)`'s NORTH slot — so a
three-slot test calls a cell with a fence along its west side *open ground*, takes every second
post out of the structure, and tears the run. ⚠ A consequence: **a fence makes the cells on
both sides fabric**, so the rigid band is the line plus one cell either way. That is right (a
post sits in ground on both sides) and it is a cell wider than it looks.

### Ground a structure encloses is part of it

*Terrain surrounded (mostly) by fences counts as the floor of a house.* Measured before the
rule existed: a raise of 6 over a fenced yard moved the ring by 4 and the middle by 6, leaving
the yard **two units above its own fence**.

⚠ **THE FLOOD NEEDS NO KNOWLEDGE OF EDGES.** A fence's owner cell is already fabric, so a flood
walking only NON-fabric cells stops at the ring by construction — and a **gate** stops it too,
because an opening is a `DOOR_MAT` edge on an owner that is still fabric. `X70` arriving for
free: *an opening is not an absence*. That is also what *"mostly"* buys — a doorway does not
break an enclosure, only a missing stretch of fence does.

⚠ **The outside of a fence is unbounded, and that is the only honest way to tell it from an
enclosure**: it escapes the search bound. An enclosure that does not close within `2 × rad` is
not a yard, it is terrain with a fence somewhere in it.

## T3 — A linear run bends along itself; a building stays rigid

*A wall (city or castle) can slope too like a road (see the great wall of china).*

**The discriminator is not length — it is whether the thing has an INSIDE.**

| | how it moves |
|---|---|
| fabric that **encloses** — a floor, its walls, a fenced yard | rigid, one delta |
| fabric that **runs** — a road, a corridor, a city wall | bends along its axis within a limit |

Measured: a 51-cell wall went from **one slab, every cell +12 and floating at its ends** to
`6 5 4 3 2 1 0` — a road's profile.

⚠ **THE ACROSS HALF IS NOT BUILT**, and it was implemented and removed **twice**. *Flat in the
other direction* founders on the lattice: **in a hex grid the two lanes of a road are offset by
half a station**, so there is no cell "directly across" — every sideways test also couples
cells at different points ALONG the run, the equalities chain down the line, and the whole run
collapses to its original height with every count agreeing. It needs a projection onto the
run's own axis so that *same station* is a fact rather than a guess about which of six
directions is sideways. **An across-rule that flattens roads is worse than none.**

⚠ **A two-wide road comes out level anyway — emergent, not enforced.** The lanes are
neighbours, so the along-limit already ties them to within one unit.

## T4 — A surface may only be given the slope it can take

*Roads and fields can slope with a limit, grass has a higher limit, forest even more* — and
*the current routine is the start for an unlimited grass type terrain*. So the falloff is not
replaced by a table: it becomes the **grass row** of one.

Measured, from the centre out, as deltas, for `amp 12 rad 7`:

| | profile | steepest | clamped | residual |
|---|---|---|---|---|
| grass | `12 11 10 7 5 2 0` | 3 | 0 | 0 |
| road | `6 5 4 3 2 1 0` | **1** | 19 | 6 |
| field | `12 10 8 6 4 2 0` | **2** | 9 | 2 |
| road with something planted | `12 11 10 7 5 2 0` | 3 | 0 | 0 |

⚠ **THE LIMITS ARE A TABLE, NOT A SWITCH.** The first build asked
`if m == ROAD_MAT { … }` inside the gesture, which is a second copy of a set nobody owned — the
five materials were five loose `pub const`s scattered across 1,400 lines with no way to
enumerate them, which is *why* the limit came out as a switch. `ground_kinds()` is that home
and `edge_kinds()` is its twin for walls; adding a terrain is a **row**.

⚠ **A CELL IS HELD TO ITS *OWN* LIMIT, NOT THE STRICTER OF A PAIR.** Where a limited road meets
unlimited grass the edge must break somebody's rule. Taking the stricter would let a road
flatten the hill *around* it — terrain bending to the road. Taking the cell's own pulls the
ROAD back and leaves the grass alone: a cutting. The step at the road edge is deliberate, and
is what rock faces are eventually for.

⚠ **A LIMIT THAT SILENTLY DELIVERS LESS IS THE `K-FIT` FAILURE.** A refused slope reports
through the same two counters the height clamps use, so it reaches the author by the path a
refused height always has. **A stroke that already fits must be unchanged** — a limit that
alters a legal edit is a bug, not a limit.

⚠ **ANYTHING PLANTED LOOSENS THE LIMIT.** *Forest* is in no material list — it is an ITEM
(`h_item`) on ordinary ground — so "forest slopes more" is a claim about a cell's **contents**.
The species palette stays in the server, so the library asks only *is anything planted here*.

## T5 — The limit belongs to the WORLD, not to one gesture

`brush` enforced the limits and nothing else did, so a road written any other way simply did
not have them. Measured through the real gesture (`probe/house/roadwalk.loft`): a road **walked
up** a hill of 24 comes out `24 24 23 22 21 18 16 13 10 7 4 2 0` — **steepest step 3, where a
road's limit is 1**.

`slope_settle` settles the **run** a stroke lands in, so any gesture that paints a limited
surface can hand the world back inside its own rules. After it:
`12 11 10 9 8 7 6 5 4 3 2 1 0` — a 1-per-hex ramp cut into the hill.

⚠ **AND IT IS WIRED NOW — `road_lay` SETTLES ITS OWN RUN.** It shipped with no
consumer: five tests and three probes called it and no gesture did, so a road written
by the editor did not have the limits this rule exists to give it.

**Guarded, and the guard is what makes it affordable.** `slope_settle` walks the whole
connected run, so calling it per stroke is linear work on a run that grows with the
strokes — measured (`probe/house/roadcost.loft`), `w_tau` over 10/20/40/80 cells goes
`190 / 380 / 760 / 1520` unwired against `415 / 1330 / 4660 / 17320` per stroke, which
is quadratic. `stroke_over_limit` asks a constant-cost question first.

⚠ **AND ON THE EDITOR'S OWN ROAD THE ANSWER IS ALWAYS NO.** `road_h` is frozen ONCE
when road mode is switched on and every stroke uses it, so the strip is FLAT however
far it runs and can never break its own limit. Measured, an 80-cell flat road costs
`w_tau` **414 either way — not one write.** The guard also ignores the seam to the
ground alongside, which is `T4`'s deliberate step: counting it would fire on every
footfall of every road.

⚠ **THE GUARD WAS ONE-SIDED FIRST, AND IT IS THE SAME BUG `faced_between` HAD.** It
asked *is this cell too high above its neighbour* — true climbing, false descending,
because descending the high cell is the previous stroke's and sits OUTSIDE the disc
just stamped. Only the INCREMENTAL walk can see it: asking the guard directly lays the
whole road first, so the disc holds both ends and a one-sided test trips either way.

⚠ **IT ONLY EVER CUTS — TODAY, AND THAT IS KNOWN TO BE HALF THE ANSWER.** A road that cannot
climb a hill within its limit is cut into it, which is what a road mostly is. But a real one
balances:

> *"A road can raise the ground on the lower side — the builders had a lot of materials over
> after cutting into the hill, using it to heighten the lower side a bit, and often using
> stones to create a wall below the road too."* … *"So most of it will still be cutting into
> the hill."*

So **cut-dominant with a secondary fill from the spoil, and often a retaining wall below** is
the model; cut-only is what is built. The gap is [plan 20](../../plans/20-verticality-last/README.md)
`A8`, and its invariant is **spoil conservation** — the volume removed above the grade equals
the volume placed below it, within a stated tolerance, with the negative control that a road on
flat ground cuts and fills nothing.

⚠ **AND THE POINT OF IT IS RECOGNITION, NOT ARITHMETIC**: *"this will make the roads look more
natural to human eyes."* So spoil conservation is what makes `A8` correct and a **picture** is
what says it works — the same split, and the same trap, as the door that passed every count and
read as a hole.

⚠ **The arithmetic already exists**: `footprint_seat`/`seat_residual` balance a cut against a
fill for a house footprint. What is missing is the policy, not the sum. And the retaining wall
needs no new concept — a wall below a road is an EDGE material on the downhill cells.

⚠ **AND IT SCOPES ITSELF TO THE RUN, NOT TO A RADIUS.** A stroke is a disc and a road is a
line: settling a disc leaves the step at its rim, which is exactly where the violation lives.

⚠ **AND A CUT IS NOT ALWAYS A LOWERING.** A road along a cliff face is cut *into* the face and
the rock above it stays — an overhang, a gallery where the stone is brittler, and a tunnel at
the far end. `slope_settle` lowers the whole column today because nothing ever asked it not to,
and the layer stack already carries the alternative: a road on a lower layer with terrain above
is structurally a cellar. Plan 20 `A9`, and its far end is `A2b`'s corridor arriving from the
other direction.

## T6 — Where no slope will do, the column carries a FACE

*Where the limit cannot be met the column carries a face rather than a slope*, and a
face is a **surface, not an absence**.

**It needs a second number, and measuring is what settled that** (`probe/house/faces.loft`).
Plan 20 was written as though the face hung off `tr_slope`. It cannot, and both ends
break:

| | measured |
|---|---|
| a road walked up a hill | **41** edges break somebody's slope limit, worst over by 11 — so the subject is real and reachable today |
| a road on flat ground | **0** — clean |
| one stroke of the raise brush | **0** — clean; its steepest step is 3, which is 23° |
| **a twenty-press grass hill** | **0**, and its steps stand at **71°** — because grass has no slope limit at all |

So the steepest object the editor can make would carry no face, and a 16° grassy verge
beside a road would be cut as rock. One number cannot fix either without breaking the
other.

**`tr_slope` is what a gesture may GIVE a surface; `tr_face` is what it can STAND at.**
A road may only be *given* a 1-in-1 grade because a cart has to climb it, and a road
embankment nevertheless *stands* at far more. One is a rule about authoring, the other
is an angle of repose.

| | may be given | stands to | which is |
|---|---|---|---|
| grass | free | 6 | 40.9° |
| road | 1 | 6 | 40.9° |
| field | 2 | 5 | 35.8° |
| floor, roof | free (fabric) | **never** | a built edge is a WALL, and the storey draws it |

⚠ **The plan's negative control became a property of the TABLE.** *A slope that fits
its limit must never become a face* is `tr_face >= tr_slope` on every row that has
both — checked without a world existing, where a scenario could only ever sample it.

⚠ **THE FACE BELONGS TO THE HIGHER SIDE.** It is the exposed side of a column, so it is
made of what the *standing* ground is made of: a cutting through a hillside is the
hillside's rock, and the embankment below a road is the road's own fill. Asking the
lower cell would paint a cliff the colour of the valley floor it happens to end on.

⚠ **AND IT IS DERIVED, NEVER STORED.** The heights already say where a face is, so a
stored one would be a second answer that can disagree. It also means no gesture has to
remember: move the ground and the rock follows.

⚠ **The planted rule has the OTHER shape here, on purpose.** `slope_limit` lets a
planted cell off its limit entirely, because a forest may sit on any gradeable slope.
A face is where there is no soil left to root in, so planting adds `FACE_ROOTED` and
never removes the threshold.

⚠ **AND `CLIFF_STEP_DEFAULT` IS THE SAME NUMBER, ARRIVED AT INDEPENDENTLY.**
`moros_sim`'s walker refuses a step over **6** — *"about 40° across a hex east–west and
45° north–south, so ordinary rolling ground stays walkable while an authored ledge does
not"* — and grass's `tr_face` is 6 for the same reason in the same units. They are not
one number (a step is a property of the CREATURE, an angle of repose a property of the
SURFACE), but they answer the same question from two sides, and a face is very nearly
*exactly what a walker cannot climb*. Worth knowing before either is tuned.

### And the picture had to change with it

⚠ **THE DRAWN GROUND WAS CONTINUOUS EVERYWHERE, so a cliff could not be drawn at all.**
Every corner is the mean of the three cells touching it, so both sides of an edge
compute the same number. Measured: a stored step of 11 — 57.8° if it were a face —
arrived as a **5.56** drop between smoothed centres, roughly halved and smeared over
two hexes. The store had a cliff and the picture had a hillside.

One rule fixes it, in the two places that smooth: **a corner does not average across a
faced edge, and neither does a normal.** The divisor goes from the constant 3 to a
count, the surface parts at exactly the edges `face_at` names, and `chunk_mesh_faces`
fills the gap with rock. It **tapers by itself** where the face peters out, which is the
shape a cutting has.

- **Cost**: 87.8 → 93.4 ms over 9 chunks of four material meshes — about 6%, 0.6 ms a
  chunk. The limits ride in a grid beside the heights because they must: one
  `face_limit` call per halo cell is **1.080 ms** against **0.265 ms** for the whole
  height read; memoised on (region, material), **0.278 ms**. `world_ground_cell` was
  already being made for the height alone.
- **`rock` is the tenth surface and the first whose cells do not exist.** It shares the
  `masonry` bucket, declared rather than faked apart: every hue this palette leaves free
  is a saturated one, so a rock that separates in chroma from dressed stone is a rock
  that is visibly green. A gate counts its triangles instead.
- ⚠ **AND IT IS LIGHT, WHICH WAS THE SECOND ANSWER.** The first colour sat *below* the
  wall's value and photographed as a **black hole**: a face is vertical, so its normal
  is horizontal, so `max(dot(N, L), 0)` is zero on every face turned from the light and
  all of it is the 0.45 ambient. `0.34 × 0.45 = 0.153` is not a dark rock, it is a hole
  — `A5`'s own invariant failing in the one instrument that can see it.

## T7 — A relaxation that runs out of passes says so

`SLOPE_PASSES` is 12, and both loops ended `if !moved { break; }` — so a stroke that ran
out of passes handed back a world still breaking its own limits and said nothing. The
constant's own comment claimed *"reaching it is reported rather than swallowed"*.

Measured (`probe/house/passes.loft`). The propagation is **local**: one pass buys one
unit, so the boundary is exactly the cap.

| road cells | worst step (limit 1) | clamped | residual | owed |
|---|---|---|---|---|
| 12 | 1 | 178 | 4 | 0 |
| 14 | **3** | 248 | 4 | **2** |
| 40 | **3** | 1184 | 4 | **2** |

The 40-cell run comes back correct at one end and untouched at the other.

⚠ **THE DIRECTION IS WHY IT HID FOR SO LONG.** A run *climbing away* from the settle's
seed converges in **one pass at any length**, because the fix propagates the way the walk
does. Only a run *falling away* is slow — and the first fixture measured the fast case
and reported `worst step 1` at 40 cells, a green answer to a question never asked.

⚠ **IT IS A QUESTION ASKED OF THE WORLD, NOT A NUMBER CARRIED OUT OF THE GESTURE.** The
first build bumped `clamped`/`residual` from inside the loop, on `T4`'s rule that a
refused slope reports the way a refused height does. Measured, that does not carry the
claim: `clamped` went 1184 → 1317 and `residual` stayed 4, and no consumer can tell a
relaxation that *ran out* from one that merely *worked hard*. `slope_owed(w, q, r)` reads
the heights that are already there — so it cannot disagree with them, it is testable with
no gesture in the picture, and it cost the 54 `brush` call sites nothing.

⚠ **AND A SURFACE WITH NO LIMIT OWES NOTHING.** Grass at 20 a hex is not a debt, it is a
cliff — `face_at` is what has an opinion about that, and the two must never both claim it.

## T8 — A pad is seated on its own footprint, not on the author's feet

`place_house` took the caller's `grade`, which is the ground under the **author's
feet** — and a house is not where the author stands: `pose_footprint` puts it *ahead*
of them. So a pad was seated at the height of a point several cells away, and its own
uphill edge stood over it by that many cells of gradient.

Measured (`probe/house/pads.loft`), earth standing OVER the floor at the wall:

| ramp | buried before | buried after | proud before | proud after |
|---|---|---|---|---|
| 1/hex | 7 | **5** | 5 | 7 |
| 2/hex | 12 | **7** | 5 | 10 |
| 3/hex | 17 | **10** | 5 | 12 |
| 4/hex | 22 | **13** | 5 | 14 |

Halved, and **symmetric** — which is what `SEAT_MEAN` means, and what makes the
residual a cut-and-fill rather than all of one. `SEAT_LOW` is the buried case this
removes; `SEAT_HIGH` is a house on a plinth with its whole footprint filled.

⚠ **WHAT REMAINS IS GEOMETRY, NOT A DEFECT.** A level pad seven cells across on a
4-per-hex slope spans 28 units of ground, so it must cut 14 or fill 14. The content of
the fix is that the number is **reported** — *"seated at 10 (10 from your feet, cut and
fill 10)"* — instead of silently absorbed.

⚠ **AND `ak_residual` NOW MEANS WHAT ITS DOC SAYS.** It carried the WALL COUNT: a
success tally in the field documented as *what the author asked for and did not get*,
with a test asserting it `> 0` under the name "and it marked wall edges".

⚠ **THE ROOF PLAN HAD TO FOLLOW THE SEAT.** The server built the drawn gable from the
author's feet while the roof's stored cells sit at the seat — on any slope the picture
and the store would have disagreed by the whole cut-and-fill. It reads the seated floor
back out of the world rather than carrying a second copy through the ack.

## ⚠ Order does not commute, and here is exactly where

*Placing hills then buildings* is **not** the same as *placing the same hill afterwards*.
Measured (`probe/house/commute.loft`), a stroke of 12 over radius 7:

| | divergence | is it a fault? |
|---|---|---|
| **a house** | floor at **52** hill-first, **51** build-first; 27 floor cells and 41 of surrounding ground | **no.** Hill-first takes the grade *under the author*; build-first takes the largest delta over the *footprint*, and `pose_footprint` puts the house ahead of the author. Hill-first the house **flattens** a disc of the hill; build-first the hill **flows around** a rigid pad. Two different things to have asked for |
| **a road** | steepest step **3** hill-first against **1** build-first | **it was** — closed by `T5`. The orders now agree about the limit |
| **a fenced yard** | 79 cells, worst 10 | **no** — the same shape as the house |

⚠ **NO MATERIAL EVER DIVERGES** — `0` in all three. Identity and the palettes are
order-independent; it is the **geometry** that is not.

⚠ **The two orders still produce different HEIGHTS and should.** A road cut into a hill and a
road that shaped the hill are different places. What was a fault was that only one order
respected the road's own limit.

## What it costs, measured

⚠ **`LEVEL` calls `brush` on every footfall**, so these are not academic.

| | per stroke |
|---|---|
| open ground | **4 ms** |
| with a fenced yard in the disc | **46 ms** |

⚠ **AND BOTH WERE AN ORDER OF MAGNITUDE WORSE BEFORE THE MEMOS.** `is_fabric` is a cell read
plus six `wall_of` calls and a flood asks each cell once per neighbour that touches it — the
same answer computed up to seven times, and **891 ms** a stroke with a yard. A per-stroke memo
took it to 42 ms and open ground to 2 ms, *faster than before the yard rule existed*. The limit
memo did the same for `A2c`: 262 ms → 69 ms. ⚠ **A memo here is two sets, not one** — the
question has three states (fabric, not fabric, not asked) and collapsing *not asked* into *not
fabric* makes a yard tear again at random.

## ⚠ Traps that cost real time

- **A `Mesh` copies through a local AND through a vector read** — only a parameter aliases
  (`probe/a83/leaf_visible/meshalias.loft`). Selecting a destination mesh drops every triangle
  with no diagnostic. Not what [loft#774](https://github.com/loft-lang/loft/issues/774) records
  for a plain struct.
- **A test can measure the wrong thing and pass.** The rounding fix's first test used
  `profile_opening`, which adds `OPENING_CLEAR` — `0.6/0.25` is 2.4, where truncation and
  rounding agree. It passed with the fix reverted.
- **A probe that samples as it writes measures its own output.** Walking a road uphill while
  reading `ground_h` reads the road just laid: the starting grade was dragged to the crest, the
  hill came out flat, and it reported *within its limit* — a green answer to a question never
  asked.
- **A falloff rounds to zero near the rim.** Sampling at distance 6 of a radius-7 stroke
  "proves" the outside untouched by measuring a stroke that never reached it.

## Where the code is

| | |
|---|---|
| the gesture and its rules | `lib/hex_editor/src/gesture.loft` — `brush`, `brush_delta`, `is_fabric`, `lift_column`, `absorb_enclosed`, `slope_limit`, `slope_relax`, `slope_settle`, `ground_kinds`, `edge_kinds`, `face_limit`, `face_at`, `faces_here` |
| where a face is DRAWN | `lib/hex_mesh/src/hex_mesh.loft` — `face_grid_in`, `faced_between`, `corner_heights_from`, `chunk_mesh_faces`, `emit_face_wall` |
| the tests | `lib/hex_editor/tests/` — `raise_keeps.loft`, `raise_structure.loft`, `slope_limit.loft`, `run_slope.loft`, `face.loft`; `lib/hex_mesh/tests/face_mesh.loft` |
| the pictures | `tools/scripts/face.keys` (rock faces) and `tools/scripts/seat.keys` (a house on a flank) — the control first in both |
| the measurements | `probe/house/` — `mats`, `shear`, `lift`, `fence`, `yard`, `slope`, `wall`, `wide`, `cost`, `commute`, `roadwalk`, `faces`, `facecost` |
| what a byte MEANS | [plan 21](../../plans/21-region-mappings/README.md) — identity belongs to a region; these rules hang off the **name**, never the byte |
