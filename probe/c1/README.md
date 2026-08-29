# `C1` — `combine_cut` has no caller because the CAPABILITY is missing, not because we copy it

**Plan 26. `make probe-c1`.** [HOUSE_ROOMS](../../doc/claude/HOUSE_ROOMS.md) names
`hex_place::combine_cut` as *"the exact, float-free, order-free primitive that does the whole
job"* with **zero callers here**, and
[LIBRARY_AUDIT](../../doc/claude/LIBRARY_AUDIT.md) listed it beside `hex_draw::draw_walls` as
if the two were the same kind of finding. **They are not, and this probe is what separates
them.**

## What the primitive does, measured against what we stamp

`combine_cut` unions two footprints, cuts the boundary of the union **once**, and never cuts
the shared interior edge — so adjacent stencils **fuse**. The library ships the instrument for
its own claim: `shared_marked` is *"zero after `combine_cut`; non-zero after a per-body
overlay"*.

| two houses, side by side | touching pairs | overlapping cells | ours: edges / seam | `combine_cut`: edges / seam |
|---|---|---|---|---|
| apart, dx 12 | 0 | 0 | 76 / **0** | 76 / 0 |
| close, dx 8 | 3 | **0** | 73 / **3** | 70 / 0 |
| touching, dx 6 | 9 | 8 | 68 / **18** | 50 / 0 |
| overlapping, dx 4 | 9 | 13 | 64 / **18** | 46 / 0 |

✅ **Apart, the two agree exactly** — the primitive is not doing something different in
general, which is what makes the other rows mean something.

## ⛔ But none of it is reachable, and that is the finding

| through the GESTURE | first | second |
|---|---|---|
| dx 12 | ✅ placed | ✅ placed |
| **dx 8** | ✅ placed | ⛔ **refused** — *"there is already a building here"* |
| dx 6 | ✅ placed | ⛔ refused, same words |

⛔ **AT dx 8 THE TWO FOOTPRINTS OVERLAP IN ZERO CELLS**, and the second is still refused. That
is `D2b` over-refusing exactly as HOUSE_ROOMS predicted — *it asks "does the footprint overlap
a filed plan" where it means "would two ROOFS cover one cell"* — and here it is measured: a
footprint entirely clear of the other building is told there is a building there.

## ⛔ So it cannot be wired, and forcing it would be choosing an answer that is not ours

**There is no gesture in this tree that adds a same-level box to a structure.** `storey` is a
different LEVEL — and `combine_cut_level` exists precisely so two levels never fuse — and an
`annex` is a balcony hung off a wall run, not a floor-plan box. The primitive has no caller
because **the capability is absent**, which is a different row from `draw_walls`, where three
copies of the definition existed and were replaced.

⚠ **AND THE DESIGN QUESTION IS NOT THIS TREE'S TO GUESS.** HOUSE_ROOMS says so in one line:
`@HB-X52` makes two adjacent boxes **fuse into one space**, so *whether adding a box defaults
to a hall or to a room* belongs upstream. Wiring `combine_cut` into `place_house` today would
answer it — as **fuse** — for two houses that a person almost certainly means as two
buildings, and the 3-edge seam at dx 8 is then **correct**, not spurious.

## What building it would need, in order

1. `D2b` asking what it means — *would two roofs cover one cell* — instead of *does the
   footprint overlap a filed plan*. Measured above at zero overlapping cells.
2. A gesture that adds a box **to a structure** rather than placing a new one.
3. The hall-vs-room default, from hexbody.

Only then does `combine_cut` have a consumer, and it is then exactly the right one.
