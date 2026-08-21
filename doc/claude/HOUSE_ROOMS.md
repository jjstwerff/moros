---
render_with_liquid: false
---
# Rooms, passages and doors — a house is a floor plan of boxes

⛔ **REQUIREMENT, stated by the user 2026-08-22**, in their words:

> *"The houses have to be far more flexible than they currently are. They have multiple internal
> rooms that you can extend away from you in several directions. And when a stair is placed in
> the house a next floor is added to it."*
>
> *"The roofs can be many different shapes, but for now I want to focus on rooms / passages /
> doors inside a house."*
>
> *"Rooms should just follow from the current house with doors. **Just multiple houses of
> different sizes added together as a floor plan.**"*

That last sentence is the design. A room is not a new primitive — it is **the house we already
have, placed again, adjacent**, and the floor plan is their union.

## ⛔ The current gesture REFUSES exactly this, on purpose

`lib/hex_editor/src/hex_editor.loft:339` — plan 22 `D2b`:

> ⛔ **A HOUSE DOES NOT GO INSIDE A HOUSE.** *"`place` from inside a finished room stamped a
> second whole house — 84 writes, roofs 1 → 2 — with nothing in the tree refusing it."*

It was a correct fix for a real defect: two houses stacked on one another, each with its own
roof. **But the predicate it chose is `roof_plan_covers`** — *does the new footprint overlap a
plan already filed* — and that refuses **adjacency-with-overlap** as well as containment. It is
the guard standing between here and a floor plan, and it must become a narrower question:
*would this leave two ROOFS over one cell*, not *does this touch an existing plan*.

⚠ **AND ITS OWN COMMENT ALREADY NAMES THE RIGHT SHAPE:** *"the exact question is whether the NEW
footprint overlaps a plan that is already filed"* — for **roofs**. Rooms share a floor plan and
want **one** roof over the union, so the guard's subject was never the footprint.

## The libraries already do this, and **nothing in this tree calls them**

Measured: `combine_cut`, `field_union`, `flood_outside`, `leak_count` and `set_connected` have
**zero callers** in `lib/` or `src/`.

| what a floor plan needs | the library that has it |
|---|---|
| add a box to the plan | `hex_place::field_union(a, b)` |
| **the walls of the whole plan, cut once** | `hex_place::combine_cut(a, ma, b, mb, e)` — union the footprints, cut the boundary of the union **once**, tag each edge with its source box's material |
| a next floor | `hex_place::combine_cut_level(a, la, ma, b, lb, mb, at, e)` — *different levels never contend*; the level is *"a filter applied BEFORE the cut"* |
| is a room sealed / is there a way in | `hex_shape::flood_outside(wall, out)` + `leak_count(inner, out)` |
| is every room reachable | `hex_shape::set_connected(cells)` |
| a door, a window, a real gap | the `OPEN_*` palette — [FORMAL_CORE](FORMAL_CORE.md) `X70` |
| the box itself | `hex_shape::box_new` / `box_fill`, `hex_form::Plan` |

⚠ **`combine_cut` IS EXACT AND FLOAT-FREE, AND ORDER-FREE BY CONSTRUCTION.** Its own words: *"the
'nearest source' of a boundary edge is simply its own bordering cell's stencil, so no distance
and no float enter"*, and an overlap breaks its tie on the **lower material id** — intrinsic, not
positional — so `combine(a,b) == combine(b,a)` byte for byte.

## ⚠ The one question the model does not answer: does a shared edge FUSE or PARTITION?

`X52` is explicit, and it is the opposite of what "rooms" sounds like:

> **THE SHARED EDGE FUSES.** *"Between two adjacent stencils the shared edge is INTERIOR to the
> union, so cutting the union's boundary never marks it — nobody owns it, and there is no seam
> wall. Two adjacent stencils become one fabric."*

So two boxes placed side by side make **one open space**, not two rooms. That is right for *"a
bigger hall made of two boxes"* and wrong for *"a kitchen next to a parlour"*.

**The model does have the other case**, in the same clause: *"a composite that **behaves**
differently (an authored sealed wall) **is** field-distinct."* So a partition is **authored on
the interior edge**, and a door is an `OPEN_DOOR` material on that wall — never a hole.

⚠ **WHAT IS UNDECIDED IS THE DEFAULT**, and it is a product question, not a geometry one:

| if adding a box defaults to… | then |
|---|---|
| **fuse** (the library's behaviour) | boxes make one hall; a partition is a second, deliberate gesture |
| **partition** | boxes make rooms; opening them up is the second gesture, and every touching pair needs a door or the plan is a maze of sealed cells |

⚠ **`leak_count` IS THE INSTRUMENT EITHER WAY**, and it is why this is checkable rather than a
matter of taste: a plan whose rooms are all reachable and a plan with a sealed cell in it are
**different numbers**, not different opinions.

**Do not guess this one.** It is [the ground rule](../../CLAUDE.md) in its product form — the
library states the fused behaviour and gates it; a default that contradicts it is a decision to
take with hexbody, not a flag to add here.

## A stair adds a floor — and a level is not a height

`combine_cut_level` already carries it, and [FORMAL_CORE](FORMAL_CORE.md) §2.4.3's neighbouring
clause is the one to hold on to:

> **A LEVEL IS NOT A HEIGHT.** *"The actual `z` comes from the surface/feature interval; the
> level is a discrete sheet index and nothing else. Two things can share a `z` on different
> levels, or sit at different `z` on the same one."*

So *"a stair adds a next floor"* is: the stair gesture creates **level `n+1`** over the rooms it
serves, and the plan at that level is cut independently — *different levels never contend*. The
editor already has `stair_up` / `stair_down` / `storey` / `cellar` verbs; what it does not have
is a **level** as the formal model means one.

## What this needs before it is a plan

1. **`A0q`-shaped probe first**: call `combine_cut` on two adjacent boxes here, and count what it
   marks. ⚠ The fusing claim is gated upstream (`X52`), but *this tree has never called it* —
   and the ground rule's lesson is that a library's behaviour on input **you** hold is the thing
   to measure, not the claim.
2. **The fuse-or-partition default** — decided with hexbody, not here.
3. **`D2b`'s guard narrowed** from *footprint overlaps a plan* to *would leave two roofs over one
   cell*, with the `probe/d2` § 7 row C fixture kept: two stacked houses must still be refused.
4. ⚠ **`X70` first, as plan 24 `A8` already says**: `builtin_house_door` leaves the doorway edge
   at material `0`, which is measured to **break the wall run** — 36 edges / 2 dangling ends
   against 38 / 0. Every door in a floor plan would inherit that.

⚠ **Roofs are explicitly out of scope for now** — *"for now I want to focus on rooms / passages /
doors"* — but note that one roof over a union of boxes is the thing `D2b`'s guard is really
protecting, so the two meet at exactly that guard.
