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
