<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# What promote-on-close buys — and today the answer is *nothing measurable*

**Run 2026-08-29.** `loft --interpret --lib lib/ probe/pc/pc.loft`; predictions in
[PREDICTION.md](PREDICTION.md), written first; the run in [run.txt](run.txt).

[FOCUS](../../doc/claude/FOCUS.md) §1 priced the four options for closing a wall loop and
recommended **promote on close** with three ticks: encloses ✅, recovers exactly ✅, four
quads ✅. That was built ([`0290ddb`](../../lib/hex_editor/src/gesture.loft)). This measures
it over the same 25 rectangles, before and after.

## The result, in four numbers

| | |
|---|---|
| rooms that LEAK | ⛔ **7 of 25** — `PM_OPEN`, promotion refuses. **The seven worst rectangles are exactly the seven it cannot help** |
| rooms that gain a floor | ✅ 18 of 25 |
| **descriptions changed** | ⛔ **0 of 25** — the plan view says exactly what it said before, every time |
| **wall triangles saved** | ⛔ **0** — unchanged in all 25; the floor ADDS **5 082** triangles across the 18, up to 486 for one room |

⚠ **SO TWO OF FOCUS'S THREE TICKS ARE NOT THERE**, and the recommendation was mine.

## And the reason is exact, which is what makes it actionable

*Buys nothing* has two possible mechanisms that want opposite fixes: the house reader
**refuses** the floor, or it is never **asked** because the run readers claim the marks
first. Asked directly, off the peel:

> **`house_recover` REFUSES all 18 promoted floors.**

So it is the first. A promoted floor is the flood's own cell set — the interior of a
hexagonally-stamped wall loop — and `house_recover` recovers a **`Box` rasterisation**.
⛔ **`@HB-X24`: there is no square sublattice of a hexagonal lattice, so a lattice polygon
cannot be a rectangle.** The floor is a region; the reader wants a rectangle; they do not
meet. Nothing about the peel's ordering is involved.

## What it does buy, stated honestly

- **The enclosure is now decided rather than assumed.** `PM_OPEN` versus `PM_FLOORED` is a
  real answer about whether a room closes, computed from the flood that already existed.
- ✅ **…and the refusal reaches the author now.** `promote_say` is the one place a gesture's
  sentence is decided: `PM_NONE` (the stroke bounded nothing at all) is silent, and every
  stroke that put a wall somewhere says what that wall bounds — `closes nothing`,
  `closed — N cells floored`, or `closes onto a floor already there`.

### ⚠ What that cost, priced rather than guessed

**A discriminator was looked for first and MEASURED not to exist.** The idea was to speak
only when the author was plausibly closing something — but the walled-side count of a run's
end cell is **2 for a lone wall in open ground and 1 or 2 at a rectangle's corner**, so
*how enclosed the end cell is* does not separate them. There is no local signal for intent.

So the sentence goes on every stroke that lays a wall, and the corpus pays for it:

| | |
|---|---|
| script records that moved | **18 of 46** |
| lines changed | **28**, and **28 of 28 carry a promotion sentence** — nothing else moved |
| world keys that moved | ✅ **0** — `PM_OPEN` writes nothing, so this is a message change and not a world change |
| ⛔ strokes in the whole corpus that CLOSE something | **0** — every one of the 28 is `closes nothing` |

⚠ **THE LAST ROW IS THE INTERESTING ONE.** Forty-six scripts, and not one of them builds an
enclosure with `run` or `aim` — which is why promotion never fired before this and why the
corpus could not have caught a defect in it.

⚠ **AND THE GESTURE'S WORDING IS SHORT WHILE `pm_why` STAYS LONG.** `pm_why` is
`field_fill`'s — *"the boundary is open, or the enclosure is larger than this tool will
claim"* — which is right for somebody who ASKED to fill an enclosure and is 90 characters on
the end of every wall a person lays. ⛔ **`B4j`'s two-part hedge is kept, not dropped**: a
capped flood cannot tell *open* from *bigger than the cap*, so the short form says only what
happened — nothing closed — and claims no gap that may not exist.
- The floor is real geometry a renderer draws, so a promoted room has a floor to stand on
  where it had grass. That is a picture change, not a description change.

## What has to happen for the ticks to be real

| the tick | what it actually needs |
|---|---|
| *recovers exactly* | a reader for a **region**, not a rectangle — or a promotion that records what it built. `@HB-X33` gives the exact lattice families (triangle, rhombus, hexagon side `n` → `3n²+3n+1`); `@HB-X45` gives constructive recovery for any **convex** form from the convex hull of its cells. A flood's region is neither a `Box` nor guaranteed convex |
| *four quads* | the fitted-quad renderer `@HB-X61` gates upstream. We emit 4 triangles per stored edge and have no fitted path at all, so the 25× is unavailable regardless of the description |
| *encloses* | ✅ real, for the 18 that already did. Promotion **detects** enclosure; it does not create it. The 7 that leak still leak |

## ⚠ The instrument, and what it does not cover

- The fixtures are stamped directly (`wall_at`), not gestured, so `promote_close` is called
  the way `press_verb` calls it — at a cell the wall touches — rather than through a script.
  The wiring itself is covered by `lib/hex_editor/tests/promote.loft`'s
  `test_the_aim_gesture_promotes_what_it_closes`.
- Triangle counts are the `wall` and `floor` surface slots of `chunk_meshes_all` over the
  nine chunks around the origin. ⚠ `chunk_mesh_mat(…, WALL_MAT)` cannot be used for this —
  walls live on EDGES, and it answers the identical mesh with or without them.
