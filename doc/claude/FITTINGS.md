<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# FITTINGS — doors, windows, shutters, and the walls that hold them

> ## ⚠ READ THIS FIRST — most of what follows is already built, in `hex_draw`
>
> This design was written before an inventory of the shared `hex_*` family, and the
> inventory changed the answer. **`hex_draw` already maps a `Plan` to floor cells, wall
> edges, OPENINGS and a roof height field** — and recovers a wall as *one flat quad* with
> mitred corners, which is the "walls follow the hex edges" complaint solved at the source:
>
> | want | already exists, tested |
> |---|---|
> | a wall that is one straight quad | `hex_draw::surface_of` · `surface_quad` · `surface_miter` |
> | a door / a window in a wall | `hex_draw::place_opening(plan, cells, edges, side, t, nedges, kind)` |
> | a roof | `hex_draw::draw_roof(…, eave, pitch, hip_steps)`, and `hex_roof`'s ridge / hip / cone / dome / vaults |
> | a rectangular footprint | `hex_shape::box_new` · `box_fill` |
> | a **circle** — the round tower, the ring | `hex_shape::arc_fill`, `arc_door_wedge` |
> | the footprint's outline and its 12 orientations | `hex_form::Plan`, `form_canon` |
> | seating a building on terrain | `hex_place::seat_height` · `seat_write` |
>
> All of them are **published at 0.1.0** and byte-identical to the working tree, so they are
> ordinary registry dependencies — no copy, and no path into a tree another agent edits.
>
> **What stays ours** is what this editor genuinely invented and gated: the fall, the walk and
> its cliff threshold, terrain shaping, the surface rule, the camera, the stair. What was
> WRONG is the structural half — a wall hand-rolled as a road with fences, openings as edge
> materials, a roof as a stencil special case.
>
> So the sections below stand only where they describe *fittings as assemblies* (`F-FIT`,
> `F-SWING`, `F-STATE`, `F-CREATURE`) — the openable leaf on a hinge, which no library
> supplies. `F-HOLE` is superseded: an opening is `place_opening`'s `(side, t, nedges, kind)`,
> not a range this editor invents.

**The target is RECOGNITION, and it is not a measurement.** *(user, 2026-07-31: "I want
correct drawings, a real house with doors/windows a real roof, a tower that would be
recognized by everyone as such. Not the math, but the math is needed to calculate/validate
the shapes but not to validate if we produce the correct end result.")*

So this design has two kinds of claim and keeps them apart on purpose:

- **the invariants below** — falsifiable by arithmetic, gated the way everything else here is;
- **`F-READ`** — *does a person call it a door* — falsifiable only by rendering it and reading
  the picture cold. Every other claim can be green while the picture is wrong. That has
  already happened once: `25:` WALL passed its gate, and what it draws is a road with a fence
  down each side.

---

## 0. The dependency that comes first, and why it is not a detail

⚠ **A WALL IS CURRENTLY ZERO-THICKNESS.** `emit_run_wall` emits one quad plus its back
faces. A quad has no reveal, and **without a reveal there is nowhere for a pane to be inset
and nothing for a frame to sit in** — the user's "smaller inset glass" is geometrically
inexpressible against it. A window drawn on a zero-thickness wall is a decal.

So the first step is not a fitting at all: **a wall becomes a slab with a thickness**, and
everything below hangs off that thickness. This is the same shape as the floor's slab edge
(item 36) — a fan alone was a hairline, and a wall alone is a sheet.

---

## 1. The objects

| | what it is | where it lives |
|---|---|---|
| **run** | the wall's exact centreline — straights and arcs (`hex_way::Track`) | world |
| **opening** | a RANGE on that line: `(seg, s0, s1, y0, y1)` | world |
| **frame** | jambs, head, sill — the lining of the hole | derived, drawn |
| **leaf** | the moving part: a door leaf, a shutter | asset + world state |
| **pane** | glass: smaller than the hole, inset into the rebate | derived, drawn |

**A fitting is not a new kind of thing.** A leaf is a `moros_sim::Body` on a `Mount` link
whose axis is the hinge and whose `lk_lo`/`lk_hi` are the swing limits in TURNS —
`assembly.loft` already has every field, `asm_frames` already poses it, `A9c` already
refuses a value past a limit with a named residual, and `A2`'s ledger already counts it.

**Measured on paper against `A2`:** a door is `1 body · Mount removes 5 · Unsupported
gives 0 · driven 1` = **6, and it closes.** A door is the simplest assembly that closes,
which is a good sign the representation is not being stretched to fit.

---

## 2. Invariants

### `F-HOLE` — an opening is a range on the line, never a cleared cell

The hole is `(seg, s0, s1, y0, y1)` in the run's own parameter. The cells and edge bytes it
crosses are an **index**, derived from it — the same relation `hex_way` already has between
a way and its band.

⚠ **This does not contradict `@HB-X70`.** *"A door is a material, never a cleared edge"* is about
the FILL: an enclosure with a doorway is still enclosed, so the edge keeps `DOOR_MAT` and a
field cannot leak out of it. The edge byte remains the index; the range is the truth. Both,
and neither alone.

**Falsifiable:** move the run by a third of a hex and every opening moves with it exactly —
nothing snaps to a lattice boundary. A cell-based opening cannot pass this.

### `F-CREATURE` — a fitting is sized by who uses it

A door's head is head-clearance for the creature that walks through it; a window's sill is at
its hip and its head at its eye. **This is the same seam the walk already has** — `cliff_step()`
is the creature's hip, and the library takes the threshold as a parameter *"precisely because
it is a property of the creature and not of the world"*. A door is that rule for a second
consumer.

    door head   ≈ figure_wu() * 1.05      head clearance
    door width  ≈ shoulder_wu() * 1.35    shoulders plus a hand
    sill        ≈ hip_wu()                you lean on it
    window head ≈ figure_wu() * 0.92      eye level plus a little

**Falsifiable:** double the figure and every opening scales; a literal would not move. And the
negative — a door sized for a horse must NOT be admissible for the child that cannot reach the
latch, which is the same discriminator `stair_height`'s test already uses.

### `F-DERIVED` — no dimension of a fitting is authored twice

Jamb width, leaf thickness, rebate depth, glass inset, shutter width: each a function of the
opening and the **wall's thickness**. `A5`'s discipline — *the cart is data* — applied to a
window.

    frame face   = wall_t * 0.30      the visible lining
    rebate       = wall_t * 0.25      how far the pane sits back
    leaf_t       = wall_t * 0.35      a door leaf is thinner than its wall
    pane w × h   = (hole − 2*frame face)   ⇒ SMALLER than the hole, by construction
    shutter w    = hole_w * 0.5 + overlap  a pair meets in the middle

⚠ **The pane being smaller is not a style choice, it is the frame's own arithmetic** — which
is why it can be gated rather than eyeballed.

### `F-STATE` — how open it is, is WORLD state; what it is, is an ASSET

Straight from the rate-of-change rule in `WORLD_MODEL.md` § "What is NOT in the world file":
*anything near-static and shared belongs outside; anything the game mutates belongs inside.*

- The door's **design** — profile, hinge axis, swing limits, part list — is near-static and
  shared between every door in every world → an **asset file**.
- The **placement** (this run, this range, this asset) → the **world file**.
- The **angle** (this door is 40 % open) is mutated by game mechanics and a player expects it
  to persist → the **world file**, beside the placement.

**Falsifiable:** save with a door open, reload, it is still open. And the stated cost, the same
one dressing already pays: delete the asset library and the door is an unresolved reference
while the *hole in the wall* is still there.

### `F-SWING` — a leaf cannot pass through its own frame

The limits are the geometry's, not a guess: a leaf of width `w` on a jamb hinge sweeps a
quarter-disc of radius `w`, and the reveal must clear it or the leaf clips the jamb at small
angles. `A9c`'s control already exists for this exact shape — a value past a joint limit is
**refused with the limit as its offer and the overshoot as its residual**, never clamped
silently.

### `F-REACH` — you open what you are facing, and the geometry decides which

Nearest openable leaf within arm's reach, in front. **Falsifiable:** stand between two doors
and the one you face opens; turn 180° and the other one does.

### `F-READ` — *a person calls it a door*

Not a measurement, and deliberately outside the gate suite. Judged by rendering and reading
the picture **cold** — "what does this read as", asked as if the intent were unknown. The
diagnostic cues, cheapest first:

- a **reveal** — the hole has depth, so light and shadow differ inside it;
- a **frame** that is a different value from the wall;
- a pane that is **smaller and set back**, so its edge casts a line;
- a leaf **ajar**, not flush — a door at 0° is a rectangle on a wall; at 15° it is a door;
- shutters **off the wall plane**, because a shutter flat against a wall is a panel.

---

## 3. Probes — the cheapest things that could prove this wrong

| | question | why it could bite |
|---|---|---|
| `P-SWING` | does a leaf clip its jamb at small angles? | closed form against `asm_frames`; the hip's wedge (`A9b`) was exactly this and the first fix REFUSED the real case |
| `P-GLASS` | at what grazing angle does the frame occlude an inset pane? | if "realistic" depth hides the glass at every normal viewing angle, the inset must be shallower than real — a `F-READ` finding the arithmetic cannot give |
| `P-SHUT` | a shutter pair open flat — does it reach the next window's? | yields the minimum window spacing, an authoring constraint nobody would guess |
| `P-COUNT` | does `A2`'s ledger close on a door, a shutter pair, a casement? | a ledger that does not close means the representation is being stretched |
| `P-THICK` | how thick must a wall be for a reveal to read at 10 m? | decides whether wall thickness is derived from the storey or authored |

---

## 4. The gestures — the character IS the tool

*(user: "using the character as a way to place these doors and windows")*

| key | gesture |
|---|---|
| `R` | a wall run — press to start, press to close (a WALL, once step W1 lands) |
| `D` | put a **door** in the wall you are facing, at the point you face |
| `W`/`I` | put a **window** there *(letter to settle — `W` is walk)* |
| `O` | **open / close** the leaf you are facing |
| `H` | **shutters** on the window you are facing |

Every one of them resolves *"the wall you are facing"* the same way: the nearest run segment
in front, and the parameter at the point you look at — `hex_way::way_param` and `nearest_seg`
already answer both.

---

## 5. Build order

Each step ends with a **render and a cold read**, not a green gate.

| | step | done when |
|---|---|---|
| `W1` | **a wall is a slab on a line** — `25:` stops laying a road with fences; thickness arrives | it reads as a wall from the side, and has a visible reveal at a cut end |
| `W2` | **an opening is a range** — the panel is drawn around the hole | you can see through it, and the hole does not snap to hex boundaries |
| `W3` | **the frame** — jambs, head, sill, all derived | the hole has depth and a lining of a different value |
| `W4` | **the leaf** — an assembly with a hinge, and `O` to swing it | it swings, refuses past its limit, and reads as a door **ajar** |
| `W5` | **the pane** — smaller, inset | it reads as glass, and `P-GLASS` says from which angles |
| `W6` | **shutters** — a pair, hinged outward | open they stand off the wall; closed they meet |
| `W7` | **the roof** over a closed footprint | it reads as a house |

---

## 6. Open

- **Which letters.** `W` is walk; the door/window/shutter keys need a set that does not
  collide, and there are now nine gestures competing for one keyboard.
- **Does a wall run close into a footprint?** A house is four walls that meet. Either a
  closing gesture, or corners derived where two runs' lines cross.
- **Arcs.** `hex_way::track_arc` exists and nothing uses it. A round tower is a run of arcs,
  and a fence ring is six straights or one circle — the user has asked for both, and this
  design deliberately does not special-case a ring: it is a closed run like any other.
- **The stencil's houses** write `DOOR_MAT` on edges directly. When `F-HOLE` lands they need
  to produce a run and a range instead, or the two representations diverge.
