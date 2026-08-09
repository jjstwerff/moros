# `20` — Verticality last: terrain that carries what is built on it

**Issue:** [`jjstwerff/moros#20`](https://github.com/jjstwerff/moros/issues/20) ·
**Value:** `G` · **Effort:** `H`

## Status

`A1` is **shipped** (`cab574d`): a raise no longer repaints or shears what it lifts, and a
connected structure — floor, walls, fences — rides the terrain rigidly and ends up on its
own level pad. `A2`–`A5` are **designed, not built**. Today's unlimited falloff is not
wrong and is not going away: `A2` makes it **one row of a table** — the grass row.

⚠ **This is an ORDERING claim, not a feature list.** The plan is finished when terrain is
the *last* authoring step rather than the first, and that is only true when every earlier
step survives it.

## Goal

Raising, lowering and levelling terrain carry everything already built on it, obey a slope
limit that belongs to the surface rather than to the gesture, and turn into rock where that
limit cannot be met.

## Why this, and why now

> *"Verticality is always important in 3d games, and most editors I know force you to get
> that in early in the level creation. But now you can start with a flat plane, add the
> locations & misc houses and at the end of it add or tweak the verticality to get a cool
> landscape with the correct viewing angles in it too."*

Every other order costs you a decision before you have the information for it: the shape of
the ground is chosen first, and the buildings are then fitted to it. Reversing that is only
possible if the terrain gesture is **non-destructive to what stands on it** — which is what
`A1` bought and what `A2`–`A5` keep true as the terrain gets more opinionated.

## Anchors

| | |
|---|---|
| the gesture | `lib/hex_editor/src/gesture.loft` — `brush`, `brush_delta`, `is_fabric`, `lift_column` |
| the model it writes into | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — the voxel, columns, layers, windowed heights |
| the surfaces a limit will key on | `lib/hex_mesh/src/surfaces.loft` (the drawn list) and `hex_editor`'s `SURFACE_MAT` / `ROAD_MAT` / `FIELD_MAT` / `FLOOR_MAT` / `ROOF_MAT` (the stored one) — ⚠ **these are two different lists** and `A2` has to say which one a limit belongs to |
| what a house is made of | [PARTS.md](../../doc/claude/PARTS.md) §P9.13–§P9.14 — a placed part is cells plus registry entries, and has **no identity** to move by |
| the measurements | `probe/house/{mats,shear,lift,fence}.loft` |
| the gates | `lib/hex_editor/tests/raise_structure.loft`, `raise_keeps.loft` |

## Invariant gate

Terrain height is an **exact integer** field (`L13`: the cell is the storage of record, one
height unit is 0.25 wu), so every phase here has an exact-invariant surface and none may be
argued from a picture alone.

| Phase | Concrete expected result | Invariant it pins | Negative control |
|---|---|---|---|
| `A1` ✅ | a raise of 6 over a 27-cell floor leaves all 27 at `40+6`, spread **0** | *a body moves rigidly or not at all* | a road under the same stroke must come out **not** level — it takes the incline |
| `A2` | on a `limit=2` surface, a stroke asking for 6 over one hex step leaves **2** per step and reports the residual | *no edge exceeds its surface's limit* | a stroke that already fits must be **unchanged** — a limit that alters a legal edit is a bug, not a limit |
| `A3` | the plain raise over open grass is **byte-identical** to today's | *the grass row IS the current behaviour* | any other surface must differ, or the table is decorative |
| `A4` | two buildings on one slope each end level, and the ground between them is monotonic | *relaxation terminates and never re-steepens a settled edge* | a cycle must terminate — a fixed iteration cap, and the cap being hit is a **refusal**, not a silent stop |
| `A5` | where the limit cannot be met the column carries a face rather than a slope, and the face's own height is exact | *a face is a surface, not an absence* | a slope that fits its limit must **never** become a face |

⚠ **`A2`'s residual is the half that is easy to skip.** A limit that silently delivers less
than was asked is the `K-FIT` failure this tree already has a rule for: say what could not
be done and by how much, or the author is told a lie in the shape of a picture.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A1`** — a building rides the terrain rigidly | M | `tests/raise_structure.loft` (7 claims), `raise_keeps.loft` (4) | ✅ shipped `cab574d` |
| **`A2`** — a slope limit per surface | M | a loft test per surface row + the residual report | Open |
| **`A3`** — the same limits on plain hill creation | S | today's hill gated **byte-identical** on grass; the other rows differ | Blocked on `A2` |
| **`A4`** — recursion: a pad constrains the ground below it | MH | two-building fixture already in `raise_structure.loft`, extended to assert monotonic ground between them | Blocked on `A2` |
| **`A5`** — rock faces where the limit breaks | MH | a face appears exactly where the limit cannot be met, and nowhere else | Blocked on `A4` |

## Open questions

1. **Which list does a slope limit key on?** The stored cell materials (`SURFACE_MAT`,
   `ROAD_MAT`, …, five values) or the drawn surfaces (`hex_mesh::surfaces()`, nine)? They
   are deliberately different lists and this tree has been bitten by treating one as the
   other. ⚠ *Forest* is in neither — it is an ITEM (`h_item`, `SPECIES_*`) scattered on
   ordinary ground, so "forest slopes more" is a claim about a cell's **contents**, not its
   material. Decided by `A2`, and the answer probably makes the limit a function rather
   than a table lookup.
2. **What does a limit do when it cannot be met — bend, refuse, or face?** `A5` says
   *face*, but until `A5` exists `A2` needs an answer. Provisional: clamp and report the
   residual, which is what `brush` already does at the height floor.
3. **Does `A4` need a real relaxation, or is one pass enough?** Two buildings each take
   their own delta today with no interaction. A pad's edge constraining its neighbours is
   iterative by nature; the cap and its refusal are named in the invariant gate above.
   Decided by building the one-pass version and measuring where it disagrees with itself.
4. **Should the pad extend past the building?** A real terrace has an apron. Today the pad
   is exactly the fabric, so the ground steps at the wall. `A2`'s limits may make this
   answer itself — a step is an edge, and an edge has a limit.

## What `A1` turned up

⚠ **The reported bug was the smaller half.** *A house cannot be elevated like a hill* was
about shearing; the same line was also **repainting** — road, field, floor and roof all
came back grass, and `LEVEL` walks the same function, so levelling along a road erased the
road as you walked it. Neither was a house bug.

⚠ **"Like a hill" cannot mean a hill's arithmetic.** A smooth falloff is exactly what a
hill wants and exactly what a building cannot take: measured, a raise of 6 left a 27-cell
floor 3 units out of level. A flat pad with the slope falling away beneath it — a terrace —
is the only shape under which a building both moves and stays a building.

⚠ **AN EDGE IS STORED ONCE, ON A CANONICAL OWNER.** `wall_set(w, 3, 0, SLOT_NE, …)` lands
on cell `(3,−1)`'s NORTH slot, so a predicate reading only the three slots a cell owns calls
a cell with a fence along its west side *open ground* — taking every second post out of the
structure and tearing the run on exactly the seam the fix exists to remove. `is_fabric` asks
all six directions through `wall_of`.

⚠ **A COUNT COULD NOT SEE THE ROOF.** The roof cells were never lost, only left behind at
their old height while the floor rose through them — so a count of `ROOF_MAT` cells reported
27 before and 27 after. `lift_column` moves every layer of a column, which is what carries a
roof with its floor; the gate asserts the **gap**, not the count.
