# `B5` — written before the probe ran

**The proposal, in the project owner's words:** *"we know what hexes count as indoors, a wall,
a road etc. So when we encounter that we just go a random direction to find an edge, then we
walk hexes that are still inside the same space. This till all hexes in an area are
encountered for (remainder is outside)."*

⚠ **THAT IS RECOVERY FROM THE CELLS, AND EVERY STEP OF IT ALREADY EXISTS.** Found by looking
rather than designing:

| the step | what already does it |
|---|---|
| flood a space, bounded by wall edges | `hex_editor::enclosure_fill` (what `promote_close` calls) |
| walk hexes still inside the same space | `hex_editor::touched_cells` + `cells_label` — the peel's own floor channel |
| the remainder is outside | `hex_shape::flood_outside` + `leak_count` |
| **region → its corners, without a search** | **`hex_recover::rebuild_construct`** — hull → side headings → lengths → turns → form, then **verify by re-drawing**. `@HB-X45`, 119/119, `ρ = 0` |
| the boundary edges grouped into sides | `hex_form::side_edges` — `@HB-X36`, *a corner edge is claimed exactly once* |

⛔ **AND NOTHING IN THIS TREE CALLS ANY OF THE LAST TWO.** `hex_recover` is not a dependency of
any package here — it is named once, in a comment. `hex_form::side_edges` has no production
caller, only `probe/a0q`. So the question is not *what algorithm* but *what do the ones that
exist say when they are asked*.

## What I expect

| | expected |
|---|---|
| rooms that floor at all, of 25 | **25** — `B4y` took the leaks to 0, where `probe/pc` measured 18 |
| ⛔ the hull of a flooded room has 4 vertices | **no** — a wall laid as linework zigzags, so the enclosed region's extreme cells stick out and the hull picks up the sawtooth |
| ⛔ `rebuild_construct` answers R1 | **no, R2 with a residual** — for the same reason `house_recover` refuses all of them: a flood's region is not a `Box` rasterisation, and `@HB-X24` says a lattice polygon cannot be a rectangle |
| ∂(region) against the authored marks | **equal, or nearly** — the wall edge IS where inside meets outside |
| the control: `place_house`'s own floor | the interesting row — `house_recover` accepts it, and whether `rebuild_construct` does is unmeasured |

## What each outcome would mean

| if | then |
|---|---|
| `rebuild_construct` is R1 on a flooded room | ⛔ the cut is **dead** — the description comes from the cells, linear, exact, and `probe/b4x`'s whole partition question was the wrong problem |
| R2 with a small `ρ` | the region is nearly a form; the gap is a named upstream question, not a local algorithm |
| R2 with a large `ρ` | recovery from cells needs the room to be **authored** as a form — which is FOCUS's *rooms are stencils* row, and the linework cut stays the only reader for linework |
| ∂(region) ≠ the marks | the flood and the wall disagree about where the boundary is, and that is a defect before any of this |

⚠ **The instrument is checked against something it should find**: `place_house`'s floor is a
real rasterised `Box` that `house_recover` already accepts, so a run reporting R2 for
*everything* would be measuring its own blindness.
