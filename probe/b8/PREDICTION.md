# `B8` — written before the probe ran

**Can `hex_roof::roof_match` read back the roof this editor draws?** The tree has twelve
`roof_*` functions that DRAW a roof and not one that reads one, and `hex_roof 0.1.2` now
recovers a plane, a cone, a dome or a **ridge** — a ridge being exactly what `roof_plan_of`
builds.

⚠ **THE ROOF IS IN THE STORE AS VOXELS, NOT AS A HEIGHT FIELD.** `roof_over` writes a
`ROOF_MAT` cell per column at an integer `h_height`, so the field handed to `roof_match` has to
be built from the store — and that integer is the whole question below.

## What I expect

| | expected |
|---|---|
| a house's roof is recoverable at all | ✅ yes — it is a gable, and 0.1.2 fits a ridge |
| ⛔ at `tol = 0.001` | **no** — `ROOF_UNKNOWN`. `h_height` is an integer, so the stored field is a STAIRCASE of the ridge and the residual cannot be smaller than the quantum |
| **the tolerance that works** | **half the height quantum**, `w.w_unit * 0.5` = 0.125 wu — *derived, not tuned*, which is what `@HB-X21` demands of a tolerance |
| the recovered slope | ≈ `ROOF_PITCH_DEFAULT` = 0.70 |
| the recovered ridge line | along the house's long axis, its length ≈ the ridge `roof_plan_of` built |

## What each outcome would mean

| if | then |
|---|---|
| it recovers at half the quantum | ✅ adopt: the tolerance is a property of the STORE, not a knob, and a roof round-trips |
| it needs a larger tolerance | ⛔ the drawn roof is not the ridge the plan says it is — a defect in `roof_over`, found by reading back what it wrote |
| it recovers as a CONE or a PLANE | the gable is not what the mesher draws, and the picture has been lying |
| it never recovers | the store's roof is not a height field per column — the adoption is off |

⚠ **THE INSTRUMENT NEEDS A CONTROL THAT FAILS.** A tolerance loose enough to admit anything
would pass every row above, so a deliberately WRONG field — the same roof with one column
raised — must come back refused or with a visibly larger residual.
