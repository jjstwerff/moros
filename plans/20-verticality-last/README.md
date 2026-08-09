# `20` — Verticality last: terrain that carries what is built on it

**Issue:** [`jjstwerff/moros#20`](https://github.com/jjstwerff/moros/issues/20) ·
**Value:** `G` · **Effort:** `H`

## Status

`A1`, `A1b`, `A2` and `A2c`'s along half are **shipped**: a raise no longer repaints or shears what it lifts, and a
connected structure — floor, walls, fences — rides the terrain rigidly and ends up on its
own level pad. `A2`–`A5` are **designed, not built**. Today's unlimited falloff is not
wrong and is not going away: `A2` makes it **one row of a table** — the grass row.

⚠ **This is an ORDERING claim, not a feature list.** The plan is finished when terrain is
the *last* authoring step rather than the first, and that is only true when every earlier
step survives it.

## Goal

Raising, lowering and levelling terrain carry everything already built on it, obey a slope
limit that belongs to the surface rather than to the gesture, and turn into rock where that
limit cannot be met.

## Why this, and why now

> *"Verticality is always important in 3d games, and most editors I know force you to get
> that in early in the level creation. But now you can start with a flat plane, add the
> locations & misc houses and at the end of it add or tweak the verticality to get a cool
> landscape with the correct viewing angles in it too."*

Every other order costs you a decision before you have the information for it: the shape of
the ground is chosen first, and the buildings are then fitted to it. Reversing that is only
possible if the terrain gesture is **non-destructive to what stands on it** — which is what
`A1` bought and what `A2`–`A5` keep true as the terrain gets more opinionated.

⚠ **AND PLAN 21 WILL MOVE THE TABLES THIS PLAN BUILT.**
[#21](https://github.com/jjstwerff/moros/issues/21) says a byte's identity belongs to a
REGION, with `0 = nothing` the only fixed one — so `ground_kinds()` and `edge_kinds()`, which
map byte 2 to *road* and byte 1 to *wall*, are one level short. The attributes are right; what
is wrong is that the identity is decided in code. Nothing here needs undoing before then: the
slope limit stays an attribute, it just stops hanging off a constant.

## Anchors

| | |
|---|---|
| the gesture | `lib/hex_editor/src/gesture.loft` — `brush`, `brush_delta`, `is_fabric`, `lift_column` |
| the model it writes into | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — the voxel, columns, layers, windowed heights |
| the surfaces a limit will key on | `lib/hex_mesh/src/surfaces.loft` (the drawn list) and `hex_editor`'s `SURFACE_MAT` / `ROAD_MAT` / `FIELD_MAT` / `FLOOR_MAT` / `ROOF_MAT` (the stored one) — ⚠ **these are two different lists** and `A2` has to say which one a limit belongs to |
| what a house is made of | [PARTS.md](../../doc/claude/PARTS.md) §P9.13–§P9.14 — a placed part is cells plus registry entries, and has **no identity** to move by |
| the measurements | `probe/house/{mats,shear,lift,fence}.loft` |
| the gates | `lib/hex_editor/tests/raise_structure.loft`, `raise_keeps.loft` |

## Invariant gate

Terrain height is an **exact integer** field (`L13`: the cell is the storage of record, one
height unit is 0.25 wu), so every phase here has an exact-invariant surface and none may be
argued from a picture alone.

| Phase | Concrete expected result | Invariant it pins | Negative control |
|---|---|---|---|
| `A1` ✅ | a raise of 6 over a 27-cell floor leaves all 27 at `40+6`, spread **0** | *a body moves rigidly or not at all* | a road under the same stroke must come out **not** level — it takes the incline |
| `A1b` ✅ | a raise of 6 over a yard fenced at radius 4 leaves ring, middle and halfway all at `40+6` | *what a structure encloses moves with it* | the pocket OUTSIDE the fence is unbounded and must **not** be absorbed — it escapes the reach, and an open fence LINE encloses nothing |
| `A2` | on a `limit=2` surface, a stroke asking for 6 over one hex step leaves **2** per step and reports the residual | *no edge exceeds its surface's limit* | a stroke that already fits must be **unchanged** — a limit that alters a legal edit is a bug, not a limit |
| `A2c` | a two-cell-wide road crossed by a stroke comes out with **zero** cross-fall and its along-limit unchanged; a 51-cell wall climbs at its limit instead of moving as one slab | *a linear feature has an AXIS; its limit is not a scalar, and it is not rigid* | a wall that ENCLOSES a floor must still move rigidly — it is a building's fabric, not a run. And a road cell with no road neighbour has no axis: it falls back to the scalar limit, not to flat |
| `A2b` | a raise of 6 over a corridor leaves its cover between a floor and a ceiling, and no segment steeper than its limit | *a corridor's cover is bounded and its gradient is limited* | a corridor under a BUILDING must still move **rigidly** with it — it is that house's cellar, not a run of its own |
| `A3` | the plain raise over open grass is **byte-identical** to today's | *the grass row IS the current behaviour* | any other surface must differ, or the table is decorative |
| `A4` | two buildings on one slope each end level, and the ground between them is monotonic | *relaxation terminates and never re-steepens a settled edge* | a cycle must terminate — a fixed iteration cap, and the cap being hit is a **refusal**, not a silent stop |
| `A5` | where the limit cannot be met the column carries a face rather than a slope, and the face's own height is exact | *a face is a surface, not an absence* | a slope that fits its limit must **never** become a face |

⚠ **`A2`'s residual is the half that is easy to skip.** A limit that silently delivers less
than was asked is the `K-FIT` failure this tree already has a rule for: say what could not
be done and by how much, or the author is told a lie in the shape of a picture.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A1`** — a building rides the terrain rigidly | M | `tests/raise_structure.loft` (7 claims), `raise_keeps.loft` (4) | ✅ shipped `cab574d` |
| **`A1b`** — ground a structure encloses is part of it | S | `tests/raise_structure.loft` — a fenced yard comes up level with its fence, and the outside still slopes | ✅ shipped |
| **`A2`** — a slope limit per surface | M | `tests/slope_limit.loft` (7 claims) + `hex_mesh/tests/terrain_link.loft` (6) | ✅ shipped |
| **`A2c`** — a linear run bends ALONG itself; a building stays rigid | MH | `tests/run_slope.loft` (5 claims) | ◐ the along half is shipped; **across is not built** — see below |
| **`A2b`** — sub-surface runs take a slope, not a lift | M | a corridor under a raise keeps its cover within a band, and its gradient within its limit | Blocked on `A2` |
| **`A3`** — the same limits on plain hill creation | S | today's hill gated **byte-identical** on grass; the other rows differ | Blocked on `A2` |
| **`A4`** — recursion: a pad constrains the ground below it | MH | two-building fixture already in `raise_structure.loft`, extended to assert monotonic ground between them | Blocked on `A2` |
| **`A5`** — rock faces where the limit breaks | MH | a face appears exactly where the limit cannot be met, and nowhere else | Blocked on `A4` |

## Open questions

1. **Which list does a slope limit key on?** The stored cell materials (`SURFACE_MAT`,
   `ROAD_MAT`, …, five values) or the drawn surfaces (`hex_mesh::surfaces()`, nine)? They
   are deliberately different lists and this tree has been bitten by treating one as the
   other. ⚠ *Forest* is in neither — it is an ITEM (`h_item`, `SPECIES_*`) scattered on
   ordinary ground, so "forest slopes more" is a claim about a cell's **contents**, not its
   material. Decided by `A2`, and the answer probably makes the limit a function rather
   than a table lookup.
2. **What does a limit do when it cannot be met — bend, refuse, or face?** `A5` says
   *face*, but until `A5` exists `A2` needs an answer. Provisional: clamp and report the
   residual, which is what `brush` already does at the height floor.
3. **Does `A4` need a real relaxation, or is one pass enough?** Two buildings each take
   their own delta today with no interaction. A pad's edge constraining its neighbours is
   iterative by nature; the cap and its refusal are named in the invariant gate above.
   Decided by building the one-pass version and measuring where it disagrees with itself.
4. **How is a road's AXIS derived, given it is not stored?** *Roads do not flow: along the
   road they can bend, across it they are flat* — and the same for corridors. A cell knows it
   is `ROAD_MAT` and nothing more, so the axis has to come from which neighbours are also
   road. ⚠ That makes the limit a property of an EDGE rather than of a cell, which is a
   different shape from what `A2` shipped: `slope_limit` answers per cell today. Decided by
   `A2c`, and the fallback for a road cell with no road neighbour — no axis — has to be the
   scalar limit rather than flat, or a single stray road cell pins the terrain around it.
5. **What does a corridor hold constant — its cover, or its gradient?** They are two
   constraints and they fight: keeping a fixed cover under a new hill means climbing at the
   hill's own slope, which may exceed the corridor's limit; keeping the gradient means the
   cover thickens. Provisional reading of *"the same treatment as a road"*: the **gradient
   limit wins** and the cover is free between a floor and a ceiling, because that is what a
   road does — it holds its grade and lets the cutting get deeper. Decided by `A2b`.
6. **And what happens when the cover runs out?** A corridor that would surface is the
   underground case of `A5`: a face, a refusal, or an entrance. ⚠ It is also the only place
   in this plan where the limit breaking has a *gameplay* meaning rather than a visual one —
   a corridor that opens to the sky is a way in.
7. **Should the pad extend past the building?** A real terrace has an apron. Today the pad
   is exactly the fabric, so the ground steps at the wall. `A2`'s limits may make this
   answer itself — a step is an edge, and an edge has a limit.

## What `A1b` turned up

⚠ **`A1` SHIPPED WITH A TEAR AND THIS CLOSED IT.** A fence is fabric and moved rigidly; the
grass it enclosed carried no edge of its own and took the falloff — measured
(`probe/house/yard.loft`): a raise of 6 moved the ring by 4 and the middle by 6, leaving the
yard **two units above its own fence**. *Terrain surrounded (mostly) by fences counts as the
floor of a house.*

⚠ **THE FLOOD NEEDS NO KNOWLEDGE OF EDGES.** A fence's owner cell is already fabric, so a
flood walking only NON-fabric cells stops at the ring by construction — and a **gate** stops
it too, because an opening is a `DOOR_MAT` edge on an owner that is still fabric. `X70`
arriving for free: *an opening is not an absence*. That is also what "mostly" buys: a
doorway does not break an enclosure, only a missing stretch of fence does.

⚠ **AND IT COST 891 ms A STROKE BEFORE IT WAS MEASURED.** `is_fabric` is a cell read plus
six `wall_of` calls, and a flood asks each cell once per neighbour that touches it — the same
answer computed up to seven times. Timed over 200 strokes with a fenced yard in the disc:
**891 ms**, against 9 ms on open ground. `LEVEL` calls `brush` on every footfall, so that is
not a slow gesture, it is an unusable editor. A per-stroke memo took it to **42 ms**, and
open ground to **2 ms** — faster than before the yard rule existed, because the memo also
serves the disc scan. ⚠ The memo is **two sets, not one**: the question has three states
(fabric, not fabric, not asked), and collapsing *not asked* into *not fabric* is exactly the
bug that would make a yard tear again at random.

⚠ **THE REMAINING KNOB IS `reach`, AND IT CUTS BOTH WAYS.** The enclosure test is bounded at
`2 * rad`: a yard that does not close within that is not absorbed and tears again, and a
larger bound costs the outside flood proportionally. 42 ms is that trade at today's numbers;
`A2`'s limits may make it moot by giving the ground its own rule at the fence line.

⚠ **A FENCE MAKES THE CELLS ON BOTH SIDES FABRIC**, because `is_fabric` asks all six
directions — so the rigid band is the fence line plus one cell either way. That is right (a
post sits in ground on both sides) and it is a cell wider than it looks; the outside-slope
test samples clear of it and says why.

## What `A2` turned up

**Built:** `ground_kinds()` — one row per stored material carrying `tr_slope` and `tr_fabric`
— and `slope_relax`, which pulls every moved cell back toward where it started until no edge
breaks its own surface's limit, reporting through the two counters the height clamps already
use. Measured profiles from the centre out, as deltas, for `amp 12 rad 7`:

| | profile | steepest | clamped | residual |
|---|---|---|---|---|
| grass | `12 11 10 7 5 2 0` | 3 | 0 | 0 |
| road | `6 5 4 3 2 1 0` | **1** | 19 | 6 |
| field | `12 10 8 6 4 2 0` | **2** | 9 | 2 |
| road with something planted | `12 11 10 7 5 2 0` | 3 | 0 | 0 |

⚠ **THE FIRST BUILD HARD-CODED THE TERRAINS** — `if m == ROAD_MAT { … }` inside the gesture —
and that is a second copy of a set nobody owned. The five materials were five loose `pub
const`s scattered across 1,400 lines with no way to enumerate them, which is *why* the limit
came out as a switch: there was nothing to hang an attribute on. `is_fabric`'s `== FLOOR_MAT`
was the same hard-coded terrain one predicate over, and now reads `tr_fabric`.

⚠ **AND A SURFACE IS NOT A TERRAIN, WHICH IS WORTH WRITING DOWN ONCE.** A surface is what the
mesher can DRAW (9); a terrain is what a cell can BE (5). `tree` is an item, `wall` is an edge
material in its own numbering — where `1` means wall while `1` on the cell axis means grass —
and `frame`/`soffit` are derived and stored nowhere. ⚠ **The overlap is SCRAMBLED**: materials
1,2,3,4,5 land on surfaces 0,1,2,**6**,**4**, which is not an offset and not order-preserving.
It was re-derived at every site that needed it and written down at none. `Surface.sf_mat` is
now the one join, `hex_mesh/tests/terrain_link.loft` keeps it total in both directions, and
the scramble itself is pinned so a future re-order announces itself.

⚠ **`names.sh` CAUGHT THE STRUCT NAME, WHICH IS WHAT IT IS FOR.** `Terrain` is already
published by the registry's `hex_terrain`; a public name is global across a consumer's whole
graph, so it became `GroundKind`. The check found it before the suite did.

## What `A2c` turned up — ⚠ **the across half was built twice and removed twice**

**Shipped:** the discriminator, and it is not about length. A component that ENCLOSES
something — a floor cell, or any pocket the flood can bound — is a building and stays rigid.
A component that merely RUNS is a linear feature and is handed back to the ground: it takes
the falloff and is then held to its own limit. `edge_kinds()` gives a wall 1 and a fence 2,
the same table treatment the ground kinds got. Measured, a 51-cell wall went from **one slab,
every cell +12** to `6 5 4 3 2 1 0` — a road's profile, which is what *a wall can slope like
a road* asks for.

⚠ **AND THE ACROSS HALF IS NOT BUILT, WHICH IS THE REAL FINDING.** *Flat in the other
direction* was implemented, measured, and removed — twice. **In a hex grid the two lanes of a
road are offset by half a station**: there is no cell "directly across", so every sideways
test also couples cells at different points ALONG the run. The equalities chain down the line
and the whole run collapses to its original height with every count agreeing — a 51-cell wall
did it first, and after the rule was narrowed to material runs a genuinely two-wide road did
it again.

⚠ **A TWO-WIDE ROAD COMES OUT LEVEL ANYWAY, and that is emergent rather than enforced.** The
lanes are neighbours, so the along-limit already ties them to within one unit; under a stroke
offset across the road they come out equal. The gate asserts *within the limit*, not *zero*,
and says why — asserting zero would be claiming a rule that is not there.

**What across still needs**: a PROJECTION onto the run's own axis, so that *same station* is a
fact rather than a guess about which of six directions is sideways. Written down rather than
approximated, because an across-rule that flattens roads is worse than none.

⚠ **AND IT COST 262 ms A STROKE BEFORE THE LIMIT WAS MEMOISED.** A cell's limit is constant
for a stroke and costs a material read plus six `wall_of` calls for a marked run; the
relaxation was asking up to twelve times. Memoised: **69 ms** with a yard in the disc, 4 ms on
open ground. ⚠ Still above the 42/2 that `A1b` measured, and that is the price of `A2c` —
recorded rather than rounded away, because `LEVEL` calls `brush` on every footfall.

## What is already measured for `A2c`

⚠ **A FREE-STANDING WALL IS ONE RIGID SLAB TODAY** — `probe/house/wall.loft`. A 51-cell wall
across open ground, under a raise of 12 at radius 7: **every cell +12**, including the cells
far outside the stroke, because `A1`'s flood follows a run wherever it goes. The ground three
rows away falls away normally (`7 7 5 2 0 …`). A Great Wall built this way floats at its ends.

⚠ **AND `A1` MEANT TO DO THAT, WHICH IS WHY `A2c` IS A MODEL CHANGE AND NOT A BUG FIX.** The
rule *follow the structure wherever it goes, because a fence running past the rim is one
fence* is right for a garden fence bounding a yard and wrong for a wall crossing a county.
The distinction the three notes share — *roads do not flow*, *the same for corridors*, *a
city or castle wall can slope too* — is **enclosing versus running**:

| | what it is | how it moves |
|---|---|---|
| fabric that **encloses** — a floor, its walls, a fenced yard | a building | rigid, one delta (`A1`, shipped) |
| fabric that **runs** — a road, a corridor, a city wall | a linear feature | bends **along** its axis within a limit, flat **across** it |

⚠ **THE AXIS IS NOT STORED ANYWHERE**, for any of the three. A cell knows it is `ROAD_MAT`,
or that it carries a wall edge; it does not know which way the run goes. So the axis has to be
derived from which neighbours are also part of the same run — which makes the limit a property
of an **edge** rather than of a cell, and that is a different shape from what `A2` shipped
(`slope_limit` answers per cell). That reshaping is the bulk of `A2c`.

## What is already measured for `A2b`

⚠ **A CORRIDOR UNDER OPEN GROUND IS IGNORED TODAY** — `probe/house/cellar.loft`. A raise of
6 over a dug cellar moves the outdoors `40 → 46` and leaves the corridor at `28`: **the
cover over it goes from 12 to 18.** Lower the ground instead and the same arithmetic runs
the other way until the ground passes through the corridor's ceiling and opens it to the
sky, with nothing in the gesture to notice.

✅ **AND A CELLAR UNDER A HOUSE IS ALREADY RIGHT**, which is the half that could have been a
defect in shipped code and is not: the house cell is fabric, `lift_column` moves every layer
of the column, and floor and cellar both move `+6` — the storey height is kept. So `A2b` is
about a run that leaves its building, not about cellars in general.

⚠ **`is_fabric` CORRECTLY SAYS `false` OVER A CORRIDOR**, and that is not an oversight to
fix: `ground_h` reads the outdoors **by label, never layer 0** — layer 0 is the outdoors
right up until a cellar is dug beneath it — so the predicate sees grass, which is what is
actually up there. A corridor is not part of the building above it unless a building is
above it.

## What `A1` turned up

⚠ **The reported bug was the smaller half.** *A house cannot be elevated like a hill* was
about shearing; the same line was also **repainting** — road, field, floor and roof all
came back grass, and `LEVEL` walks the same function, so levelling along a road erased the
road as you walked it. Neither was a house bug.

⚠ **"Like a hill" cannot mean a hill's arithmetic.** A smooth falloff is exactly what a
hill wants and exactly what a building cannot take: measured, a raise of 6 left a 27-cell
floor 3 units out of level. A flat pad with the slope falling away beneath it — a terrace —
is the only shape under which a building both moves and stays a building.

⚠ **AN EDGE IS STORED ONCE, ON A CANONICAL OWNER.** `wall_set(w, 3, 0, SLOT_NE, …)` lands
on cell `(3,−1)`'s NORTH slot, so a predicate reading only the three slots a cell owns calls
a cell with a fence along its west side *open ground* — taking every second post out of the
structure and tearing the run on exactly the seam the fix exists to remove. `is_fabric` asks
all six directions through `wall_of`.

⚠ **A COUNT COULD NOT SEE THE ROOF.** The roof cells were never lost, only left behind at
their old height while the floor rose through them — so a count of `ROOF_MAT` cells reported
27 before and 27 after. `lift_column` moves every layer of a column, which is what carries a
roof with its floor; the gate asserts the **gap**, not the count.
