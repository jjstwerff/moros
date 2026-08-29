# `B5` — the room's description comes from its CELLS, and every piece already existed

**Plan 26. `make probe-b5`.** From the project owner: *"we know what hexes count as indoors, a
wall, a road etc. So when we encounter that we just go a random direction to find an edge, then
we walk hexes that are still inside the same space. This till all hexes in an area are
encountered for (remainder is outside)."*

⛔ **THAT IS `@HB-X45`, AND IT IS BUILT.** Not a design to evaluate — a call to make. Found by
looking, after a whole costing exercise had been spent on the wrong question:

| the step | what already does it |
|---|---|
| flood a space, bounded by wall edges | `hex_editor::enclosure_fill` — what `promote_close` calls |
| walk hexes still inside the same space | `hex_editor::touched_cells` + `cells_label` |
| the remainder is outside | `hex_shape::flood_outside` + `leak_count` |
| **region → its form, without a search** | **`hex_recover::rebuild_construct`** — hull → side headings → lengths → turns → form, then **verify by re-drawing** |
| the boundary edges grouped into sides | `hex_form::side_edges` — `@HB-X36` |

⛔ **AND NOTHING IN THIS TREE CALLS THE LAST TWO.** `hex_recover` is not a dependency of any
package here — it is named once, in a comment in `octagon.loft`. `hex_form::side_edges` has no
production caller, only `probe/a0q`.

## ✅ The result, and every prediction in `PREDICTION.md` was wrong

| over the 25 rooms, each walked as four wall runs | |
|---|---|
| floored at all | ✅ **25 of 25** (`probe/pc` measured **18** before `B4y` closed the leaks) |
| ✅ **`rebuild_construct` answers R1, `ρ = 0`** | ✅ **25 of 25** — the recovered form **re-draws the region exactly** |
| ∂(region) edges carrying no wall | ✅ **0 in all 25** — *a wall is where inside meets outside* holds exactly |
| marks bounding nothing | 0 … 4 — the fork corners' spurs, `B4y`'s known residue |
| `house_recover` | ⛔ **refuses all 25**, as `probe/pc` found |
| cost | ✅ **zero `run_edges`** · the whole sweep, worlds and all, in **8.4 s** |

⚠ **THE HULL IS 5 OR 6 VERTICES, NOT 4, AND THAT IS THE RIGHT ANSWER.** `@HB-X24`: there is no
square sublattice of a hexagonal lattice, so a room is not a lattice rectangle. The form the
hull constructs is a 5- or 6-sided polygon **that reproduces the cells exactly** — where
asking for four walls is asking for a shape the lattice does not have.

⚠ **THE INSTRUMENT SEES BOTH ANSWERS.** The control is `place_house`'s own floor: hull **8**,
R1, `ρ = 0`, ∂ 38 edges with 0 unwalled, 4 marks bounding nothing — and `house_recover`
**accepts** it as `house 4x5`. So a run reporting R1 for everything is not a reader that says
yes to anything: the Box reader says no to all 25 rooms and yes to the house, on the same
fields.

## ⛔ What this settles

**The cut was the wrong question.** `probe/b4x` spent three cut rules, a cyclic minimum and a
costing on *partition the marks into runs*; recovery from the cells is **exact on all 25**,
where the best mark-side rule is exact on **14 of 25** for **363 … 4834 `run_edges`** each.

| | exact rooms | cost |
|---|---|---|
| the shipped peel, over the marks | 8 of 25 | ~128 `run_edges` per room |
| `B4x`'s cyclic minimum, over the marks | 14 of 25 | 363 … 4834 |
| ✅ **`rebuild_construct`, over the cells** | ✅ **25 of 25**, `ρ = 0` | ✅ **0** |

## ⚠ What it does NOT settle

- **A room must be floored first.** `promote_close` does it and is already wired to the wall
  gesture — but a wall that encloses nothing has no region, so **linework still needs a run
  reader**. The two readers split the problem exactly where the cost does: the expensive case
  is the one that has a region.
- **`@HB-X45` is convex-only.** An L-shaped room needs decomposition; not measured here.
- **`hex_recover` is not a dependency.** Adding it is a manifest and lock change, not a probe.
- **The mesh is not measured.** A 5-sided form is 5 fitted quads rather than 4, which is still
  against 200 triangles today — but `@HB-X61`'s fitted renderer does not exist in this tree.
