# `B8` — the roof this editor draws, read back

**Plan 26. `make probe-b8`.** This tree has twelve `roof_*` functions that DRAW a roof and not
one that reads one, so a saved world could say *house 4x5* and nothing about the thing on top
of it. `hex_roof::roof_match` recovers a plane, a cone, a dome or a **ridge** — and a ridge is
what `roof_plan_of` builds.

## ✅ It recovers exactly, and no tolerance is needed

| | |
|---|---|
| the roof in the store | **27 cells**, one `ROOF_MAT` column each, integer `h_height` |
| the field | an exact gable — 5.75 / 6.75 / **7.75** / 6.75 / 5.75 across rows at y = 3 … 9, constant along the ridge |
| `roof_match` | ✅ **`ROOF_RIDGE` at every tolerance including 0.001** |
| residual | ✅ **0** |
| peak · slope | **7.75** · **0.6666666666666666** |
| the segment | `(-4.330127, 6)` to `(4.330127, 6)` — the true ridge line, spanning the footprint |
| ⛔ the control — one column raised four units | residual **0.649**, `ROOF_UNKNOWN` at half a quantum |

⛔ **AND THE PREDICTION WAS WRONG IN THE INTERESTING DIRECTION.** `PREDICTION.md` expected the
store's integer heights to force a tolerance of half the quantum, because a staircase cannot
sit on a ridge. It can: `roof_over` writes heights that land exactly on the gable it claims, so
the residual is 0 and the tolerance buys nothing. The caption uses half the quantum anyway —
nothing finer is representable, so it is the honest bound rather than a fitted one.

## ⛔ What this probe found in the library, three times

The adoption was the instrument. Every one of these was invisible from inside `hex_roof`:

| | |
|---|---|
| 0.1.1 | a gable came back **`ROOF_CONE`** at residual 1.209 — there was no ridge kind |
| 0.1.2 | `roof_ridge_fit` seeded from the cone fit, which **runs away** on ridge-like data: a degenerate segment eight world units clear of the roof, slope 0, residual **1.185** |
| 0.1.3 | the locus used float **equality**, true for a field read out of an integer store and false for one `roof_ridge` drew — so the package **could not recover what it draws**, residual **1.132** |
| ✅ 0.1.4 | the band is the field's own span and the seed spans the footprint — residual **0** |

⚠ **EVERY HAND-BUILT FIXTURE ATTAINS ITS MAXIMUM EXACTLY AND SPANS ITS OWN FOOTPRINT**, which
are precisely the two conditions that hid all three. **A fitter's first test should be its own
generator's output** — `test_the_package_recovers_what_it_draws`, upstream now.

## What was adopted

- `hex_editor::roof_read_box` — builds the height field from the store's `ROOF_MAT` columns, in
  this world's own `w_unit`, and asks `roof_match`. Refuses below three cells: fewer than three
  points name no surface.
- `hex_mesh`'s house caption says **`· gable roof pitch 0.67`**, and prints `unknown roof` when
  the field is none of the four rather than suppressing it — the fallback-as-recovery this
  session fixed upstream.
