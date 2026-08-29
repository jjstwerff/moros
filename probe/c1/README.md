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

## ⛔ AND `D2b` IS CORRECT — this section previously said the opposite, and was wrong

**Retracted.** The first version of this probe reported `D2b` over-refusing: *"two houses at
dx 8 overlap in ZERO cells and the second is still refused."* That compared **footprint**
overlap against a guard that is about **roofs**, and a roof overhangs its footprint. The claim
was repeated from [HOUSE_ROOMS](../../doc/claude/HOUSE_ROOMS.md) rather than measured, and it
does not survive measurement.

Asked properly — each house placed **alone** so the gesture computes its own filed roof plan,
then both placed in order for the verdict:

| separation | cells under **both** roofs | the gesture |
|---|---|---|
| dx 6 | 18 | refused ✅ |
| dx 7 | 17 | refused ✅ |
| dx 8 | 12 | refused ✅ |
| dx 9 | 6 | refused ✅ |
| dx 10 | 6 | refused ✅ |
| dx 11 … 14 | **0** | allowed ✅ |

✅ **It refuses exactly when two roofs would meet and allows exactly when they would not**, at
every separation tested. There is nothing to fix. The guard's own comment — *"this refuses
exactly the cells that would end up under two roofs"* — is accurate, and it reaches that answer
by testing the new footprint against the filed roof because the two questions coincide for
houses of equal size in a line.

## ⛔ THREE VERSIONS OF THIS PROBE DISAGREED WITH THE GESTURE, AND ALL THREE WERE MINE

Each rebuilt what `place_house` computes, and each was wrong in a different way:

| version | what it reconstructed | how it lied |
|---|---|---|
| 1 | `roof_plan_of(f, 3.0, ROOF_PITCH_DEFAULT)` | the eave is not the one `place_house` files, so the roof was too small — **dx 8 read as ALLOWED** where the gesture refuses it |
| 2 | the same, plus `box_fill(footprint_box(f))` for the footprint | that is not `footprint_fill`, so **the guard "tested 0" at dx 10** while the guard was the thing refusing |
| ✅ 3 | nothing | each house placed **alone**, its plan read out of `es_roofs` — agrees with the gesture at all nine separations |

⚠ **A house placed alone is never refused for a neighbour**, so both plans are the real ones.
**Ask the gesture; do not rebuild it** — the same lesson `probe/adopt` records one layer up,
and the reason the first two tables read as defect reports.

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

1. ~~`D2b` asking what it means~~ — ✅ **it already does**, measured above.
2. **A gesture that adds a box TO a structure** rather than placing a new one. This is the
   whole of the gap: two adjacent houses are correctly refused *as two buildings*, and nothing
   expresses *one building of two boxes*.
3. The hall-vs-room default, from hexbody.

⚠ **AND `D2b` WOULD THEN NEED A SECOND ANSWER, NOT A DIFFERENT ONE.** It is right to refuse a
second *house* under an existing roof; a second *box of the same house* is a different gesture
and would not pass through it at all.

Only then does `combine_cut` have a consumer, and it is then exactly the right one.
