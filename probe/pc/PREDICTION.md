<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# What promote-on-close buys — predictions, written before the run

[FOCUS](../../doc/claude/FOCUS.md) §1 priced the decision and recommended promote-on-close on
the grounds that **accurate blueprints and efficient meshes are one requirement**: a closed
wall loop gets a floor, a floor is `@HB-X45`'s domain-A recovery input, and an exact
description is what a fitted render needs. That argument is now built. This measures it.

## The three numbers, over the same 25 rectangles

| | prediction |
|---|---|
| **rooms that LEAK** (7 of 25) | ⛔ **promotion refuses and buys nothing.** `enclosure_fill` floods to the cap and answers `PM_OPEN`. So the 7 worst rectangles are exactly the 7 it cannot help |
| **rooms that enclose** (18 of 25) | ✅ a floor appears — the flood's own cell count |
| **the DESCRIPTION after promotion** | ⚠ **unchanged, and this is the one I expect to disappoint.** `house_recover` recovers a *rectangle* from a `Box` rasterisation; a wall loop's interior is whatever the flood claimed, and `@HB-X24` says a lattice polygon cannot be a rectangle. If the floor does not match a `Box` the house reader refuses and the peel falls back to the same runs as before |
| **triangles** | ⛔ **UP, not down.** Our mesher emits 4 triangles per stored wall edge and there is no fitted-quad renderer here; a floor is new geometry. The 25× saving `@HB-X61` gates is available only to a renderer we have not built |

## So the honest question this asks

**Does a floor change what the plan view says?** If yes, promote-on-close is the domain fix
FOCUS claimed. If no, it is plumbing that positions the world for a reader and a renderer
that do not exist yet — worth having, but its value is deferred and FOCUS's §1 table
overstates it.

⚠ **I expect NO, and the measurement is worth more if I am right**, because the recommendation
was mine and the table said "✅ recovers exactly" in the promote-on-close row.

## What would refute the pessimistic prediction

A promoted room that comes back as `desc house …` instead of `desc run … + run …`. That
needs the flood's cell set to be exactly a `Box` rasterisation — possible for an
axis-aligned rectangle whose interior happens to rasterise the same way.
