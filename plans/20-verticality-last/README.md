# `20` — Verticality last: terrain that carries what is built on it

**Issue:** [`jjstwerff/moros#20`](https://github.com/jjstwerff/moros/issues/20) ·
**Value:** `G` · **Effort:** `H`

## Status

`A1`, `A1b`, `A2`, `A2c`'s **along** half, `A4`, `A5`, `A7`, `A8`, **`A9`** and
**`A10`** are **shipped**, and so is the road gesture that makes them reachable.
`A2b`, `A2c`'s **across** half and `A3` are designed and not built.

*It spans or it caves* is now built in both directions. `A9` walked the caving half
from an open cut to a gallery; `A10` is the mirror, and the author settled what the
plan could not: **the trigger is water, and it is a refusal rather than a height.**

⚠ **AND THE AUDIT `A4` FORCED IS THE LOUDEST THING IN THIS PLAN.** Three of its shipped
rules had no consumer at all — a rule that reaches no gesture is a rule the editor does
not have, and all three passed CI the whole time:

| the rule | its consumer |
|---|---|
| the relaxation reporting that it ran out of passes | ✅ `e0d1881` — `slope_owed`, wired into LEVEL |
| `footprint_seat` / `seat_residual` | ✅ `fb76d51` — `place_house` seats on its own footprint |
| `slope_settle` — **`A7`'s entire deliverable** | ✅ `dd508ff` — `road_lay` settles its own run |

✅ **AND THE FOURTH THAT WIRING THE THIRD EXPOSED IS CLOSED TOO** (`314bebe`): the road's
grade follows the landscape, so `A7`'s settle and `A8`'s balance finally fire from the
gesture that lays road. Which turned up two more of the same class — a refused write
swallowed, and levelling unable to make a pad — because a rule nothing exercises is a
rule whose neighbours are untested as well.

⚠ **`A5` WAS LISTED AS BLOCKED ON `A4` AND WAS NOT.** `A4` is a SOURCE of break sites,
not a prerequisite for the rule — measured, a road walked up a hill already leaves 41
edges breaking a limit, worst over by 11. `A4` will produce more of them and they will
be faced by the same rule with no further work.

⚠ **THE SHIPPED RULES LIVE IN [TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md), NOT HERE.**
Everything a reader needs about how the ground moves — the rigid-body rule, what counts as
fabric, the enclosure, the slope table, the settle, the measured costs and the order-divergence
table — moved there as each phase landed. This file keeps only what is still *a change we
intend to make*. A plan must not be the last home of a durable fact.

⚠ **This is an ORDERING claim, not a feature list.** It is finished when terrain is the *last*
authoring step rather than the first, and that is only true when every earlier step survives it.

## Goal

Raising, lowering and levelling terrain carry everything already built on it, obey a slope
limit that belongs to the surface rather than to the gesture, and turn into rock where that
limit cannot be met.

⚠ **PLAN 21 OWNS WHAT A BYTE MEANS.** [#21](https://github.com/jjstwerff/moros/issues/21)'s
`R1`/`R2` shipped, so these rules already hang off a NAME resolved through the world's palette
rather than off a constant. What remains is that a world declaring no palette still falls back
to the built-in numbering.

## Anchors

| | |
|---|---|
| **the rules, as built** | [TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md) |
| the model they write into | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) |
| what a byte means | [plan 21](../21-region-mappings/README.md) |
| the gesture | `lib/hex_editor/src/gesture.loft` |
| the measurements | `probe/house/` |
| cut-and-fill that already exists | `hex_editor::footprint_seat` / `seat_residual` — a house footprint already balances one |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A1`** — a building rides the terrain rigidly | M | `tests/raise_structure.loft`, `raise_keeps.loft` | ✅ `cab574d` |
| **`A1b`** — ground a structure encloses is part of it | S | a fenced yard comes up level with its fence | ✅ `bfc4784` |
| **`A2`** — a slope limit per surface | M | `tests/slope_limit.loft` + `hex_mesh/tests/terrain_link.loft` | ✅ `db871b6` |
| **`A2c`** — a linear run bends ALONG itself | MH | `tests/run_slope.loft` | ◐ along shipped `4f43a79`; **across not built** |
| **`A7`** — the limit is the world's, not one gesture's | MH | `tests/slope_limit.loft`'s four settle claims | ✅ `0743c1a` |
| **`A8`** — a road balances its cut against a fill, and may carry a wall below | MH | volume: the spoil cut equals the fill placed, within a stated tolerance. ⚠ **Acceptance is a PICTURE** — *does a road read as natural* | ✅ `dda9055` + `314bebe` — the rule, and the gesture that reaches it |
| **`A2b`** — sub-surface runs take a slope, not a lift | M | a corridor keeps its cover within a band and its gradient within its limit | Open |
| **`A3`** — the same limits on plain hill creation | S | today's hill gated **byte-identical** on grass; other rows differ | Open |
| **`A4`** — recursion: a pad constrains the ground below it | MH | two buildings on one slope, monotonic ground between them | ✅ `e0d1881` + `fb76d51` — and both halves turned out to be something other than the row said; see below |
| **`A5`** — rock faces where the limit breaks | MH | a face appears exactly where the limit cannot be met, and nowhere else | ✅ `12fa9ca` — and it took a SECOND limit; see [TERRAIN_EDITS §T6](../../doc/claude/TERRAIN_EDITS.md) |
| **`A9`** — a road through rock: open cut → overhang → gallery → tunnel | H | one parameter — how much rock stays above the road — walked from 0 to full, with the walk still passable at every value | ✅ — and the parameter turned out to be the TERRAIN, not a dial; see below and [TERRAIN_EDITS §T9](../../doc/claude/TERRAIN_EDITS.md) |
| **`A10`** — water, and the bridge that crosses it | H | a road walked across a waterway paves none of it and comes out carried over it: bed · water · deck, clear by `BRIDGE_CLEAR` | ✅ **complete** — the terrain, the `47:` gesture, the drawing and the picture. 23 tests; [TERRAIN_EDITS §T10](../../doc/claude/TERRAIN_EDITS.md) |

## Invariant gate — for the phases still open

Terrain height is an **exact integer** field (one unit is 0.25 wu), so none of this may be
argued from a picture.

| Phase | Concrete expected result | Invariant it pins | Negative control |
|---|---|---|---|
| `A8` | over one settled road, the volume removed above the grade equals the volume added below it, within a stated tolerance | *spoil is conserved: a cutting makes its own embankment* | a road on **flat** ground must cut nothing and fill nothing — a balance that moves earth where none was needed is not a balance |
| `A2b` | a raise of 6 over a corridor leaves its cover between a floor and a ceiling, and no segment steeper than its limit | *a corridor's cover is bounded and its gradient limited* | a corridor under a BUILDING must still move **rigidly** — it is that house's cellar, not a run |
| `A2c` across | a two-cell-wide road crossed by a stroke comes out with **zero** cross-fall | *a run has an AXIS; its limit is not a scalar* | a road cell with no road neighbour has no axis — it falls back to the scalar limit, not to flat |
| `A3` | the plain raise over open grass is **byte-identical** to today's | *the grass row IS the current behaviour* | any other surface must differ, or the table is decorative |
| `A4` | two buildings on one slope each end level, and the ground between them is monotonic | *relaxation terminates and never re-steepens a settled edge* | the iteration cap being hit is a **refusal**, not a silent stop — ✅ it WAS a silent stop; `slope_owed` is the refusal, and the two halves of the row turned out to be already-true and not-built respectively |
| ~~`A5`~~ | ✅ shipped, and the row is kept because the MEASUREMENT refuted it: hanging the face off `tr_slope` gives **zero** faces on a 71° grass mountain and a rock face on a 16° verge. It needs `tr_face` beside it, and then the negative control becomes a property of the TABLE — `tr_face >= tr_slope` on every row that has both | *a face is a surface, not an absence* | a slope that fits its limit must **never** become a face |
| ~~`A9`~~ | ✅ shipped. The column holds road-then-rock, `world_surface` puts the feet on the road, and a walk along a contour of a mountain comes out with **13** shelves and a road that is one surface through them. ⚠ The negative control became **two** claims, because one column of one occupied cell does not say *byte-identical*: the chunk must also hold **one layer**, or a layer created and left empty is 8196 bytes that read as nothing at every cell | *cutting a shelf is not lowering the ground* | a gentle flank and flat ground cave nothing, and a trench in level ground never roofs itself |

⚠ **`A8`'s ACCEPTANCE IS NOT ITS INVARIANT.** *"This will make the roads look more natural to
human eyes"* — so the volume balance is what makes it **correct**, and whether it **works** is a
cold-recognition test: render a road across a slope and hand over the picture. This tree has the
scar: `A8.3`'s door passed every count and read as a hole for four days, and the verdict was
delivered twice against the wrong object before anyone zoomed in. Shoot the road ALONE, and
zoom to the cutting before saying it reads.

### The road's own rule, and it is ONE rule — 2026-08-09

> *"A road will follow the landscape the way a road builder works, so it flows upwards
> with the hills with its own rules about how much. If for example a waterway is
> encountered a bridge will be built."* … **"It spans or it caves."**

⚠ **THAT SETTLES THE DESIGN FORK AND REMOVES A TOGGLE RATHER THAN ADDING ONE.** Three
options were on the table — a second paving gesture, a grade rule switched by levelling,
or one toggle with two values — and all three were the wrong shape. There is one road
gesture, it always follows the landscape, and what it does where it cannot follow is
not a mode but a *consequence*:

| the ground does this | the road does this |
|---|---|
| rises faster than the road may climb | **caves** — a cutting, then an overhang, a gallery, a tunnel (`A9`) |
| falls away faster than the road may descend | **spans** — an embankment, then a viaduct, a bridge |

⚠ **AND THAT IS ONE AXIS, TWICE — `A9`'s AXIS AND ITS MIRROR.** `A9` already walks *how
much rock stays above the road* from none to all. The other direction walks *how much
ground stays under it* from all to none: `A8`'s spoil fill is the shallow end of
spanning, and a bridge is the deep end. Neither is a new storage question — a road with
rock above it and a road with air below it are both a column whose road sits on a layer
of its own, which the stack has carried since `8a`.

⚠ **IT ALSO ANSWERS `A8`'s MEASURED ABSURDITY.** Cut-only carves a **20-metre canyon**
at the top of a road walked down a 3-per-hex ramp, and the balance only halves it. The
road was never supposed to move that earth: past the point where a fill is a fill, it
**spans**. So the canyon is not a bug in the balance, it is the balance being asked a
question that belongs to the span.

⚠ **AND THERE IS NO WATER YET.** `ground_kinds()` holds grass, road, field, floor and
roof; a waterway is not a terrain this world can store. So the bridge's trigger does not
exist to be detected — which makes *span* the half to design second, after `A9` has
established what a road sitting on its own layer looks like.

### ✅ `A9` — the shape a road takes where it cannot go round, and it is BUILT

> *"Especially in Switzerland a road along a cliff face is cut into it, getting an
> overhang above it. In Austria those overhangs often end up in a half tunnel because of
> their more brittle rocks, but in both the roads often got real tunnels too."*

**The rule lives in [TERRAIN_EDITS §T9](../../doc/claude/TERRAIN_EDITS.md)** — every
condition, every measurement, and the three separate things that had to change before a
gallery could be SEEN. What belongs here is what the phase turned up.

⚠ **THE PARAMETER IS THE TERRAIN, AND MEASURING IS WHAT SAID SO.** The row asked for *one
parameter walked from 0 to full*, and the probe (`probe/house/cave.loft`) found the walk
already there: on a contour the cut has a transverse gradient — `6 3 0 -3 -6` at 3 per
hex, `48 24 0 -24 -48` at 24 — so the number of cells deep enough to stand under goes
0 → 1 → 2 with the steepness of the flank. **Open question 7 is closed by that**: the rock
decides, and it needs no palette entry, because `A5` already derives *is this rock* from
the drop and `cave_stands` uses that one number.

⚠ **AND THE FULL END OF THE AXIS IS NOT REACHABLE FROM THIS GESTURE, WHICH IS RIGHT.** All
of the strip roofed is a tunnel, and a road gesture that drives one is `A2b` arriving from
the other direction. What a walk produces is an open cut, an overhang and a gallery.

⚠ **THREE DEFECTS THE TESTS AND PROBES CAUGHT, EACH OF WHICH LOOKED LIKE WORKING CODE:**

| | |
|---|---|
| **a trench in flat ground roofed itself** | deep enough, grass, nothing dug below — every condition but *is there a hillside to hold the lid up*. `slope_limit.loft`'s open-ground control went red |
| **a shelf blinded the settle to half its own road** | four shelves cut one run into islands and left a **27-unit step** in a road whose limit is 1 — ⚠ while every road-to-road count read **0**, because a count over ground materials cannot see a cell whose ground is rock |
| **`A8`'s fill squeezed a shelf below its own headroom** | 9 to 8, which is `ε` exactly: legal to the store, under what a walker needs. The settle sweeps its run and takes the lid off |

⚠ **AND THE PICTURE COST MORE THAN THE RULE.** The store was right and the gallery was
invisible for three separate reasons at once, and *four* camera angles were read by eye
before any of them settled anything. The instrument that finally did is in
`tools/gates/world/cave.mjs`, and it had to be built twice: counting rock *inside* the
mouth cannot see a sealed one, because a face is one quad and its six vertices sit at its
corners. **A count inside a band cannot see a quad that spans it.**

### ✅ `A10` — the mirror, and the author answered the question the plan could not

> *"Waterways should be the most resistant to hill creation from anything else, it can
> break into a waterfall but will normally just create chasms. So a road needs a bridge
> to cross it because it cannot place the road there. And the water will never flow
> upwards."* … *"even on this scale we have to model the direction of flow probably as
> separate ground materials."* … *"water has a depth so it should define a layer under
> it."*

**The rule lives in [TERRAIN_EDITS §T10](../../doc/claude/TERRAIN_EDITS.md).** What
belongs here is what the phase turned up.

⚠ **THE TRIGGER IS A REFUSAL, NOT A HEIGHT, AND THAT IS THE DESIGN CHANGING.** This file
had the span as *how much ground stays under the road, from all to none* — an
embankment, then a viaduct, then a bridge, keyed on how far the road stands proud. The
author's answer is simpler and stronger: **a road cannot be placed on water**, so the
crossing is not a threshold anybody has to choose. The height-keyed viaduct is still
available and is now a second, smaller question.

⚠ **AND IT UNBLOCKS WHAT THIS FILE SAID WAS BLOCKED.** *"There is no water yet…so the
bridge's trigger does not exist to be detected"* — it does now, and it took seven rows
in `ground_kinds()` rather than a mechanism.

⚠ **THE FALL-LINE CANYON IS NOT ANSWERED BY THE SPAN, AND THIS FILE CLAIMED IT WAS.**
Measured (`probe/house/span.loft`): a road walked down a 6-per-hex ramp comes out **cut
by 120 units and proud by 1**. `slope_settle` takes the LOWER envelope, so a descent
digs rather than stands up — and spanning is about a road standing above the ground
while the canyon is a road cut below it. They are not the same defect. What would
answer it is a settle that holds the grade at the author's own cell and lets both
directions fall away from it, which is a change to `A7` and is now the open question.

⚠ **AND THE CONTOUR HALF *IS* SYMMETRIC, WHICH IS WHY THE MIRROR IS REAL.** The same
strip that gives `A9` its shelves on the uphill side gives fills on the downhill one —
`-12 -6 0 6 12` at 6 per hex, `-48 -24 0 24 48` at 24 — so a height-keyed viaduct has
something to trigger on whenever it is wanted.

### ✅ What `A10` owed, and what it cost to pay

| | |
|---|---|
| water is drawn | an **eleventh** surface. ⚠ `SURFACES` turned out to be carried by **fourteen** files — the fourteenth was `editor_client.loft`, spelled with different spacing, whose own comment warns that a stale copy hides the wrong one. Missing it turned `camera_indoors` into `roof 0.8007` |
| a gesture authors it | `47:`, and the catalogue followed: water was unavailable with the reason `no gesture` for exactly one commit |
| the bridge has a picture | `tools/scripts/bridge.keys` builds it with the gestures an author has, in the order they have them. Nothing in the script names a bridge |

⚠ **AND THE RENDERING HALF COST THREE CHANGES REVERTED ON FALSE EVIDENCE**, because
`.gatebin/server` is built by the gate runner and not by an edit — so `mesh ground`
read the same number every time and it looked like the code was doing nothing. It was
doing nothing: to a binary from before the edit. See STATE.

### ⚠ What `A4` measured, and what it turned out to be

**Half of the row was already true.** Measured (`probe/house/pads.loft`), two houses
on a ramp: each pad ends level (spread **0**) on every gradient tried, and the ground
between them carries **no more reversals than the bare control** — a dome on a ramp is
non-monotonic whether or not there are buildings on it, so "monotonic between them"
had to be read against a control before it meant anything.

**The other half is a defect nobody had a number for.** A house on a slope is BURIED
on its uphill side, and it grows without bound with the gradient:

| ramp | earth standing OVER the floor | floor standing proud |
|---|---|---|
| 1/hex | 7 | 5 |
| 2/hex | 12 | 5 |
| 3/hex | 17 | 5 |
| 4/hex | **22** — 5.5 wu of soil against the wall | 5 |

⚠ **AND THE CAUSE IS A FUNCTION THAT EXISTS AND IS NEVER CALLED.** `place_house` seats
its pad at the grade passed in — the AUTHOR'S FEET — so the pad sits at the height of
wherever the author stood, and the footprint's own uphill edge is that many cells of
grade above it. `footprint_seat` / `seat_residual` were built for exactly this, are
tested in `tests/footprint.loft`, and have **no consumer anywhere**. The
cut-and-fill a placement owes is computed by nobody and shown to no one.

✅ **BUILT (`fb76d51`): the pad is seated on its own footprint at `SEAT_MEAN`, and the
cut-and-fill is reported.** After:

| ramp | buried | proud |
|---|---|---|
| 1/hex | 5 | 7 |
| 2/hex | 7 | 10 |
| 3/hex | 10 | 12 |
| 4/hex | **13** | 14 |

Halved, and **symmetric** — which is the whole difference between a mean and an end.

⚠ **AND NO RING-CUT WAS NEEDED, WHICH THE MEASUREMENT IS WHAT SETTLED.** A level pad
seven cells across on a 4-per-hex slope spans 28 units of ground, so it *must* cut 14
or fill 14: what remains is geometry, not a defect. Cutting an apron on top of it would
be moving earth to hide a number rather than to fix anything — and the number is now
said out loud (*"seated at 10 (10 from your feet, cut and fill 10)"*), which is what
`ak_residual` is for. **Open question 8 is closed by that**: the pad does not want an
apron, it wants an honest residual and `A5`'s faces on the cut.

✅ **`slope_settle` IS WIRED (`dd508ff`)** — `road_lay` settles its own run, guarded by
a constant-cost check so the editor's flat road pays nothing (`w_tau` 414 either way on
80 cells) and a road that varies with the ground settles as `A7` intended. See
[TERRAIN_EDITS §T5](../../doc/claude/TERRAIN_EDITS.md).

⚠ **AND IT PUT A NUMBER ON WHAT `A8` IS FOR.** Cut-only cannot lay a descending road:
walked down a 3-per-hex ramp it satisfies its limit by cutting its top end **80 units —
20 metres — below the natural ground.** That stretch wants an embankment, which is
exactly `A8`'s fill.

### ⚠ `A7` and `A8` are both built and both UNREACHABLE from the editor

`road_h` is frozen ONCE when road mode is switched on and every stroke uses it, so the
strip is **flat** however far it runs. Measured — the editor's road across a hill of 24:

| | |
|---|---|
| profile | flat, end to end |
| cut / fill | **160 / 0** |
| `slope_owed` | **0** — it breaks no limit |
| settles | **none**, so no balance either |

Both rules are correct and tested; neither can fire. `A8`'s acceptance is a PICTURE and
that picture cannot honestly be taken from the editor — a shot of the current road
gesture shows a flat cut plateau, which is not what `A8` does.

**What is missing is one gesture change, not a rule**: the road's grade has to follow
the author as they walk instead of being frozen once for the run.

### ✅ AND IT IS BUILT — merged 2026-08-10

The gesture reads its grade **one cell past the strip**, which is the nearest place the
natural ground still survives. ⚠ Re-freezing from the FEET changes nothing, and the
reason is a feedback loop inside the gesture: the author *rides the road they are
laying*, so `ground_under` hands back the grade just written — `TERRAIN_EDITS`'s own
sampling trap, living in a gesture instead of a probe.

That made `A7`'s settle and `A8`'s balance reachable for the first time. Measured
through the editor: a walk over a hill laid **2448 vertices** of graded road, cut into
the hillside with `A5`'s rock face on its bank.

**Three things had to change with it, and each was a defect the frozen grade had been
hiding:**

| | |
|---|---|
| a road landing within `ε` of a room beneath it was **silently not laid** | `road_lay` threw `surface_set`'s verdict away. It is lifted one `ε` clear and the author is told — reason, offer, residual |
| `world/road`'s `graded` proxy could not measure a gradient | `roadRange < groundRange × 0.6` only ever measured the FLAT road, and the range is polluted by the mesh lip that gate documents. It asks `slope_owed` now |
| **levelling could not make a flat pad** | a falloff is a hill's shape; a pad has an EDGE. `brush_level` SETS its disc, and writes even at zero delta — because *there is ground here* is what a level means |

⚠ **AND THE LEVELLING FIX PAID FOR ITSELF IN A NUMBER I HAD ALREADY EXPLAINED AWAY.**
`cellar_ceiling`'s `meshr soffit` had been re-baselined 306 → 298 with a careful note
about `A5`'s parted corners displacing the datum. With levelling actually levelling it
went back to **306** on its own — `342 + 306 = 648`, the gate's own structural relation.
The 298 was never a fact about ceilings; it was a fact about a plateau that was never
level. Its four `feet` stations are now one stride apart all the way down, which they
never were.

## Open questions

1. ~~**How much of the spoil goes back?**~~ ✅ **ALL OF IT, and the rule needed no number.**
   The run shifts by the MEAN it lost, so cut equals fill exactly up to the integer division —
   no fraction to choose, and the shift is uniform so the limit survives by construction. The
   original question below is kept because it is what the answer had to beat.
   ~~**How much of the spoil goes back?**~~ *"The builders had a lot of materials over after
   cutting into the hill, using it to heighten the lower side a bit"* — and *"most of it will
   still be cutting into the hill"*. So the fill is real but secondary, and `A8` needs a number
   or a rule: all of it until the grade is met, a fixed fraction, or whatever the cut yields
   capped by the road's own limit on the low side. ⚠ `footprint_seat`/`seat_residual` already
   balance a cut against a fill for a house footprint — the arithmetic exists and the policy
   does not.
2. ~~**Is the retaining wall geometry or dressing?**~~ ✅ **ANSWERED BY ITSELF.** With `A8`'s
   fill placed, the road stands proud on its downhill side — and the side of an embankment
   steeper than earth will stand at is a FACE, which `A5` already draws as rock. `A8` stamps
   nothing: the wall is what the geometry does. `tests/face.loft` had to stop asserting that a
   road never carries a face, which was only ever true because the settle could not fill.
3. **What does a corridor hold constant — its cover, or its gradient?** They fight: a fixed
   cover under a new hill means climbing at the hill's slope, which may break the corridor's
   limit. Provisional reading of *"the same treatment as a road"*: the **gradient wins** and
   the cover floats between a floor and a ceiling. Decided by `A2b`.
4. **What happens when the cover runs out?** A corridor that would surface is the underground
   case of `A5`. ⚠ The only place in this plan where a broken limit has a *gameplay* meaning
   rather than a visual one — a corridor open to the sky is a way in.
5. **How is a run's AXIS derived, given it is not stored?** A cell knows it is a road, or that
   it carries a wall edge; it does not know which way the run goes. ⚠ That makes the limit a
   property of an **edge** rather than of a cell — a different shape from what `A2` shipped.
   See TERRAIN_EDITS §T3 for why the naive version collapses runs.
6. **Does `A4` need a real relaxation, or is one pass enough?** Decided by building the
   one-pass version and measuring where it disagrees with itself.
7. ~~**What decides the overhang — the rock, or the author?**~~ ✅ **THE ROCK, AND IT NEEDED
   NO PALETTE ENTRY.** The answer was expected to land in
   [plan 21](../21-region-mappings/README.md) as an attribute of an identity — and there is no
   rock *material* in this world at all, because `A5` derives rock from the DROP. So *is this
   rock* already had exactly one authority, `tr_face`, and `cave_stands` uses it: an overburden
   drawn as rock is an overburden that stands as a roof. ⚠ The plan-21 reading is still
   available and is now a **row**, not a mechanism: give a region's stone its own `tr_face` and
   *how a road crosses a cliff* becomes a fact about where in the world you are, for free.
9. **Does the settle hold the grade, or take the lower envelope?** ✅ **MEASURED, AND
   THE ANCHOR IS NOT WHERE THIS ROW SAID** (`probe/house/envelope.loft`). On a 6-per-hex
   descent of 26 cells, every legal answer moves earth and the question is how much:

   | | cut | fill | earth moved |
   |---|---|---|---|
   | lower envelope — what ships | 1625 (worst 125) | 0 | **1625** |
   | upper envelope — the mirror | 0 | 1625 (worst 125) | **1625** |
   | held at the START of the run | 0 | 1625 | **1625** |
   | **held at the MIDDLE** | 455 (worst 65) | 390 (worst 60) | **845** |

   ⚠ **Holding at the start is exactly as bad as the mirror**, which this row's wording
   — *the author's own cell* — hides: as the author walks, their cell is the END of the
   run, not its middle. The anchor that halves the earth is the run's MIDDLE, and what
   it produces is a cutting at the top and an embankment at the foot — which is what a
   road builder does and what `A8`'s spoil balance is already trying to reach.
   ⚠ And every row satisfies the limit, so the profile is not what separates them.

   ⚠⚠ **AND THEN THE PROBE REFUTED ITS OWN CONCLUSION, TWICE.** Two rows were missing,
   and the first of them is the whole answer: `slope_settle` is not what ships alone —
   it ends by calling `spoil_place`, and the settle **with its own second half** moves
   exactly the same earth as anchoring at the middle.

   | | cut | fill | earth moved |
   |---|---|---|---|
   | held at middle — the candidate | 455 | 390 | **845** |
   | **lower + `A8`'s shift — what already ships** | 429 | 416 | **845** |

   **So the anchor is not the lever, and this question was comparing the settle against
   half of itself.** A uniform shift by the mean is precisely what turns a profile
   pinned at the bottom into one pinned at the middle. No change to `A7`'s rule.

   ⚠ **WHICH LEFT THE CANYON UNEXPLAINED, AND `probe/house/canyon.loft` FOUND IT.** The
   same strip laid three ways on the same ground — stamped, settled per stroke as
   `road_lay` does, and settled once at the end **to convergence**:

   | 6 per hex, 26 cells | cut | fill | moved | profile | `slope_owed` |
   |---|---|---|---|---|---|
   | per stroke — **what ships** | 1500 | 8 | **1508** | −120 … +7 | 0 |
   | to convergence | 855 | 143 | **998** | −90 … **+37** | 0 |

   **The canyon is the repetition.** Every disc overwrites four strokes' worth of
   already-balanced cells with the raw lookahead grade, and each shift is then diluted
   across the whole growing run — so the balance is undone as fast as it is applied.
   Run to the end **once**, the same rule moves a third less earth and produces the
   cutting-at-the-head, embankment-at-the-foot profile this row was asking the anchor
   for.

   ⚠ **AND THE FIRST READING OF THAT PROBE WAS WRONG, WHICH IS WHY IT HAS A LEGALITY
   COLUMN.** A single settle looked best of all — 830 moved, the smallest figure on the
   board — and it had **192 road-to-road edges over the limit, worst step 6**. It moved
   least because it did least: `SLOPE_PASSES` is 12 and a correction travels one cell a
   pass, so no single call can settle a 26-cell run. ⚠ **That is the finding under the
   finding: the per-stroke call is also the only reason the run is legal at all** —
   twenty-six calls of twelve passes is what converges it. Repetition is standing in
   for passes and paying for it with the balance, and the two only look like one rule.

   ✅ **AND THE SETTLE IS NOT THE HALF TO CHANGE — MEASURED.** Left exactly as it ships,
   per stroke, and followed by **one two-sided balance** over the whole run against the
   natural ground the road replaced:

   | 26 cells | per stroke — ships | | **+ one balance** | |
   |---|---|---|---|---|
   | 6 per hex, walked **down** | 1508 | −120 … +7 | **848** | −63 … +64 |
   | 6 per hex, walked **up** | 1439 | +117 … −8 | **845** | +63 … −62 |
   | 3 per hex, down | 777 | −55 … −3 | **341** | |
   | 1 per hex, either way | 127 | −5 … −3 | **25** | |

   **845 and 848 are the optimum the envelope probe computed.** So the run's *shape*
   was right all along — the per-stroke settle produces a correct limit-slope profile
   and leaves it 57 units too low. **Only its DATUM was wrong.** No envelope, no anchor,
   no change to the relaxation.

   ⚠ **AND THE LAST ROW EARNS ITS OWN LINE.** At 1 per hex the road *can* follow the
   ground inside its own limit and the settle never fires — yet the shipped path still
   moves 127 units, because a cell's grade comes from the **last disc that covered it**
   and that disc trails the author by `ROAD_HALF`. So the effective lookahead is
   `2 * ROAD_HALF + 1` = five cells, and the road sinks a uniform five units into ground
   it could have followed exactly. The same balance takes it to 25.

   ⚠ **AND THE BALANCE MUST BE TWO-SIDED, WHICH ONLY THE MIRROR CAUGHT.** The first
   version of the arm read `if owed > 0`: it fired on the descent and did **nothing** on
   the ascent — `shift 0`, every column unchanged, reading exactly like an arm with
   nothing left to fix. **That is this tree's one-sided guard for the third time**, after
   `faced_between` and `stroke_over_limit`, and this time in the instrument rather than
   in the rule. `spoil_place` has the same shape (`if cut <= 0 { return; }`) and is right
   *within its scope* — it measures after the stamp, and the settle it measures can only
   lower. A **run-level** balance is measured against the natural ground, where both
   signs are reachable, so it must answer to both.

   ✅ **AND THE BUILD'S ONE OPEN PIECE IS MEASURED TOO, NOT ASSUMED.** A run-level
   balance needs the natural ground the road replaced, and the stamp has overwritten it.
   `road_lay` already samples `snat` for its disc *before* writing, and those samples
   **telescope** — a later stroke reading the same cell reads the road the earlier one
   left — so one accumulator threaded through the run should give the exact total with
   no registry of original heights anywhere. Checked against the store on all five
   ramps: **636/636, 1908/1908, 3816/3816, and −636/−636, −3816/−3816 rising.** Exact,
   both signs. ⚠ And the negative sums are the two-sidedness arriving from a second
   direction — an accumulator that clamped at zero would have read 0 on both mirrors.

   **What is left is the build.** Its shape, and the one decision in it:

   | | |
   |---|---|
   | `road_lay` | accumulate the disc term (`snat` − written) into a run-level `&integer` |
   | `slope_settle` / `spoil_place` | add their own cut and subtract their lift from it, so the accumulator is exactly *earth taken and not yet returned* |
   | a new `road_balance` | walk the run, shift by `debt / n` **two-sided**, subtract `shift * n` so the remainder carries |
   | **the decision** | fire it **per stroke** (the road reads right continuously, and the carried remainder is what stops truncation losing it) or **at run end** (cheaper, but the road is visibly wrong until the author releases). ⚠ `roadcost.loft` is the gate either way — the per-stroke settle is already quadratic (**17320** `w_tau` at 80 cells), and a uniform lift per stroke adds another O(run) of writes |

   ### ⚠⚠ AND THEN IT WAS BUILT — PER STROKE, AS CHOSEN — AND THE BUILD REFUTED IT

   On branch [`plan/20-run-debt`](https://github.com/jjstwerff/moros/tree/plan/20-run-debt),
   **kept and deliberately not merged.** `slope_settle` returns the earth it took (so no
   call site changes — fourteen already ignore `road_lay`'s return), `road_lay` carries a
   run-level `spoil` the caller owns, a two-sided `road_balance` walks the run every
   stroke and leaves the remainder owing, and `run_walk` / `run_unsqueeze` are extracted
   so the balance and the settle cannot disagree about which cells are the run.

   **374 of 375 pass. It works, the debt drains, and it is not enough:**

   | | before | after |
   |---|---|---|
   | 6 per hex, walked down | 1508 | **1486** |
   | 3 per hex | 777 | **675** |
   | 6 per hex, rising | 1439 | **1439** |

   ⚠ **THE 848 NEEDS THE STROKE'S OWN CUT IN THE DEBT, AND FIVE TESTS REFUSE IT.** With
   the stamp term in, the debt telescopes to (natural − current) exactly and reaches the
   optimum — and it undoes every deliberate cut:

   | the test | what it reported |
   |---|---|
   | `test_a_road_over_open_ground_is_never_lifted` | a road cut **20 into open ground ended at 40** |
   | `test_a_road_step_paves_its_band_at_the_frozen_grade` | the centre is cut to 14, **got 20** |
   | `test_a_trench_in_flat_ground_never_roofs_itself` | the trench ended at **200, not 180** |
   | `test_a_road_is_lifted_clear_of_a_room_rather_than_refused` | lifted to **40** where 36 clears |
   | `test_a_flat_road_is_never_settled_because_it_never_breaks` | **1258** writes |

   The first is `A8`'s own negative control — *a balance that moves earth where none was
   needed is not a balance*. **The author's grade is not spoil.**

   ✅ **SO THE CANYON IS THE STAMP** — not the envelope, not the repetition, not the
   balance. `road_lay` writes its whole disc at ONE grade, so a cell ends at the height
   of whichever stroke covered it **last** — a neighbour's, not its own. Measured alone
   (`probe/house/conserve.loft`, against shipped code): on a road walked down a brushed
   hill, **the stamp displaces 75 units of fill over a 43-cell run with nothing settled
   and nothing balanced at all**, against the shipped road's net of −47.

   ⚠ **AND THAT IS ONE TERM WITH TWO OPPOSITE REQUIREMENTS.** It is the earth the canyon
   is made of *and* the earth the balance must never return. No choice of datum, anchor,
   envelope or timing satisfies both, because they are the same units of ground.

   ⚠ **AND THE ONE FAILING TEST IS THAT SAME FACT.** `test_a_settled_road_conserves_its_spoil`
   reads **cut 8 against fill 56**: with the settle's spoil actually returned, what is
   left over is the stamp's displacement — which used to be masked because the
   *unreturned* cut cancelled it. **Two wrongs were agreeing**, and fixing one exposed the
   other. Left unmerged rather than weakening a shipped claim to land it.

   ⚠ **THE DEBT ITSELF IS CORRECT, WHICH IS WHY THIS IS A REDIRECT AND NOT A BUG.** Traced
   per stroke it accumulates and drains (92 → 9 at stroke 16, **2** still owing over 43
   cells at the end), and the road at the author's own cell tracks the ground within 7
   units the whole way. **What sinks is the tail** — every stroke overwrites thirteen
   already-lifted cells at a flat grade.

   **So the fix belongs in the grade the gesture stamps** — a run has an AXIS and wants a
   per-cell grade along it, which is **open question 5** — and not in the balance at all.

   The original question, kept because the measurement is what answered it: ⚠ **NEW, and it is
   what `A10` measured rather than what it built.** `slope_settle` only ever lowers, so a
   road walked down a 6-per-hex ramp is cut 120 units at its top and stands proud by 1 —
   it digs a canyon instead of standing up and spanning. Both envelopes are legal
   profiles; a road builder holds the grade under their own feet and lets the ground fall
   away from it in both directions. That is a change to `A7`'s rule, and the two-sided
   relaxation is the shape it would take.
8. **Should the pad extend past the building?** A real terrace has an apron; today the pad is
   exactly the fabric, so the ground steps at the wall. ⚠ **MEASURED NOW** — the step is 7 to 22
   units of earth standing OVER the floor as the ramp goes 1 to 4 per hex, and it is one-sided:
   the "proud" direction stays bounded at 5. And the limits do NOT answer it — grass's
   `tr_slope` is `SLOPE_FREE` and its `tr_face` of 6 is looser than the ramps that produce the
   burial, so neither number bites. What answers it is seating the pad on its own footprint
   (`footprint_seat`, which nothing calls) rather than on the author's feet.

## Closure record

**Nothing was dropped.** Every shipped phase's findings, numbers and traps moved to
[TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md) — §T1 the repaint, §T2 the rigid body and
the enclosure, §T3 the run, §T4 the slope table, §T5 the settle, plus the order-divergence
table, the measured costs and the traps that cost real time. This file went **352 lines → ~120**,
and the doc is where a reader who has never heard of a phase number will look.
