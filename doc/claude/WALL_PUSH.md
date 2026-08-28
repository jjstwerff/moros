<!--
Copyright (c) 2026 Jurjen Stellingwerff
SPDX-License-Identifier: LGPL-3.0-or-later
-->

# Wall push — the formal rules

**Designed, not built.** A toggle the author holds while walking: the wall in front of them
gives way and travels ahead. A house grows or shrinks, a tunnel lengthens, an internal
partition slides. The gesture is `run`'s shape — arm, walk, release.

⚠ **§1 IS A SPECIFICATION, NOT A REPRESENTATION.** The cell-set model below is how to *think*
about the world; it is not how the code is written and no implementation is required to
materialise a `HexSet`. Every law in §2 is therefore stated over **observables** — what the
store holds and what the readers recover — so it constrains the *result* and never the route.
[HEX_STACK](HEX_STACK.md)'s first invariant still governs: the store is the only authority,
and everything else is derived.

Read [FORMAL_CORE](FORMAL_CORE.md) first. [TERRAIN_EDITS](TERRAIN_EDITS.md) is the same
question one layer down.

---

## 1. The reference semantics

Let `H` be the hex lattice. A **structure** `S` is a finite set of cells `I(S) ⊆ H` — its
inside. House, room, tunnel void, courtyard: one object.

**Its walls are derived**, not stored as movable things:

    ∂I  =  { edges (c, c') : exactly one of c, c' lies in I }

This is not a new rule. It is `housedraw::draw_walls`' own, quoted inside
`hex_shape/src/hexwall.loft` — *"an edge between an inside cell and an outside one"* — and it
is what makes a marking closed by construction and one wide for free.

A **push** is the transfer of exactly one cell across that boundary, in the direction the
author faces:

    grow    c ∉ I,  c adjacent to I,  author inside      I' = I ∪ {c}
    shrink  c ∈ I,  c on ∂I,          author outside     I' = I \ {c}

⚠ **THE MODEL IS INDICATIVE AND THE STORE IS AUTHORITATIVE, SO THE ARROW POINTS THIS WAY**:
`I` is *recovered from* the store, never kept beside it. "Transfer a hex" is shorthand for
*write the store so that the recovered set differs by exactly that cell*. An implementation
that edits edge marks, a `Box`, a run record and a floor fill — which is what the store
actually holds — satisfies the laws below if and only if its observable result matches.

---

## 2. The laws

Each is a statement about observables, with the measurement that would falsify it.

### L1 — derivation
**After any push, the wall edges the store holds are exactly `∂I'`.**
No edge is a wall for any other reason, and none is missing. *Falsified by* comparing the
store's marks against `∂` of the recovered cell set, edge for edge.

### L2 — unit
**One push transfers one cell, and the direction is one of the six neighbours.**
There is no other quantum: no direction classes, no snap, no sub-hex step. *Falsified by* a
push whose recovered set differs from the previous by other than one cell.

### L3 — cost of a transfer  ✅ measured
**Transferring a cell with `k` inside neighbours changes the wall-edge count by `6 − 2k`.**
Exact integer, no cases. Measured against the prediction over a 37-cell house
([probe/wp](../../probe/wp/README.md) probe 4):

| `k` | `Δ|∂I|` predicted | measured |
|---|---|---|
| 0 — an island | +6 | **+6** |
| 1 — a spur off a face | +4 | **+4** |
| 2 — a normal face push | +2 | **+2** |
| 3 — a notch filled | **0** | **0** |
| 4 / 5 / 6 — a concavity or a hole | −2 / −4 / −6 | no such cell in a convex house |

✅ **THE REQUEST'S CLAUSE IS A THEOREM OF THIS LAW, NOT A RULE TO ENFORCE.** *"Normally this
will not reduce the number of walls"* holds because a push against a **convex** face has
`k ≤ 2`, so `Δ ≥ +2`. The count falls only at `k ≥ 4` — filling something in, which is what
the author meant when they stood there. ⚠ **And nothing has to defend it**: the count is an
output of `∂`, so no code path can create or destroy a wall as an act.

### L4 — locality
**A push changes the store only within the closed neighbourhood of the transferred cell**,
plus whatever L7 propagates. This is what bounds the cost, and it is the law an
over-eager implementation breaks first. *Falsified by* a diff of the store outside that
neighbourhood.

### L5 — invertibility
**Push then unpush is the identity on the store, byte for byte.** In the reference semantics
this is nearly trivial — `(I ∪ {c}) \ {c} = I` — which is itself an argument for the model.
It is not trivial in the store, where cells, edges, the palette and the enclosed floor must
all come back. *Falsified by* a world key before and after.

### L6 — partition
**For a structure partitioned into rooms `A` and `B`, a transfer between them leaves
`∂(A ∪ B)` unchanged.** Moving an internal wall cannot move the outside of the house, because
`A ∪ B` did not change. The request's third case is a consequence, not a special case.

### L7 — yield
**If the transferred cell belongs to another structure `J`, the push succeeds only if `J`
yields it** — `J' = J \ {c}` — and `J`'s own boundary moves accordingly, transitively. There
is no displacement to reconcile between structures: they meet on cells, and a cell belongs to
one of them.

### L8 — connectivity
**A push must not disconnect a structure, nor breach an enclosure that was closed.**
`set_connected` is the predicate for the first; `flood_outside` + `leak_count` for the second
— and `@HXS-007` is the worked example of why the first does not imply the second: *connected
is not closed*, a ring with one cell out is still one chain you can walk through.

### L9 — features ride, anchored to the fixed end
**An opening is a span on its wall's surface (`@HB-X12`), so a moved face carries its doors
with no recomputation.** ⚠ **But a swept face is a LONGER wall than it was** (L3: `+2` edges
per swept cell), so a span must be anchored to the end that did **not** move. Anchoring to
the moved end slides every opening in the house whenever any wall is pushed.

### L10 — the palette is untouched
**A push changes no wall id.** Thickness, body and material are the wall type's (`@HB-X69`);
a pushed wall is the same wall.

### L11 — a sweep preserves the description  ⛔ the load-bearing one
**Sweeping a whole face leaves the structure describable as what it was.** Measured: sweeping
one face of a 37-cell house — five cells — takes `|∂I|` from 46 to 50 and the house is still
a rectangle. Pushing **one** of those five gives `+2` and a shape that is not.

⛔ **THIS IS WHY THE GESTURE IS A WALK AND NOT A POKE.** `house_recover` reads a *rectangle*
off the floor cells. A bump is not one, so the window falls through to the run readers — and
plan 26 `B4x`'s chain cut now covers such a shape *exactly*, which means the degradation is
**silent and complete** rather than a refusal. An editor that lets you poke will quietly turn
houses into linework. *Falsified by* a swept face that no longer reads as `house`.

---

## 3. The gesture

**G1 Push is a VERB, not a key.** [EDITING_MODES](EDITING_MODES.md) is binding: a key names a
verb, the wire carries the verb, and *verb + mode + selection* binds to the gesture. Push
joins `the_vocabulary()` as an 18th entry — `keymap.loft` and `verb.loft` both refuse a verb
that is not in that list, which is the check that keeps the four sites from diverging.

**G2 It is a HELD toggle over a WALK, and the tick is shared.** One transfer per tick while
contact and facing hold; the body belongs in `hex_editor::tick.loft` beside the walk, so the
server, the page and `editor_run` get it from one place — [WALK_TICK](WALK_TICK.md)'s whole
finding is that writing the tick twice loses a clause. This is the sense in which it works
*like drawing a road*: the unit is a tick and the author's path is what makes it a wall
rather than a dent (L11).

**G3 The blueprint and the world are the same gesture.** [BLUEPRINT](BLUEPRINT.md) §0's plan
view authors with `pick <x>,<y> <verb>` against the same store; only the author's position
differs — a pick rather than a pose.

**G4 `hex_place::combine_cut` is the primitive.** Exact, float-free, order-free union and
difference of cell sets, and it has **zero callers in this tree** ([HOUSE_ROOMS](HOUSE_ROOMS.md)).
This would be its first.

---

## 4. Refusals, named

A refusal is data — `FORMAL_CORE`'s law **P4**.

| | |
|---|---|
| **R1** | the author faces no wall of the structure they are in |
| **R2** | the transfer would disconnect the structure, or breach a closed enclosure (L8) |
| **R3** | the cell belongs to a structure that will not yield it (L7), transitively |
| **R4** | the transitive yield set is cyclic |
| **R5** | the cell lies outside the region the author may edit |

---

## 5. ⛔ What the probes refuted — including this document's first draft

[probe/wp](../../probe/wp/README.md), predictions written first.

⛔ **THE FIRST DRAFT HAD THE WRONG OBJECT.** It modelled a push as *translating a wall's line*
— a `WallRun` moved along its normal — and built five rules on the lattice arithmetic that
follows. The rules were internally correct and answered a question the gesture does not ask.

- ⛔ **`@WP-0b` was wrong and inverted.** It said a diagonal wall moves **6.25× more slowly**
  per push, from the parallel-line spacing `√3/(2√N)`. The shortest admissible translation is
  **1** for `N = 3`, **√3 = 1.732** for `N = 1`, **√13 = 3.606** for `N = 39` — the diagonal
  is the **coarsest** heading, not the finest.
- ✅ **`@WP-0c` was right, and by more than it guessed.** It called the line spacing a lower
  bound. The true quantum is **2×** it for both exact classes and **26×** for the in-between.
- ⛔ **`@WP-7`'s worry and its refusal were unfounded** — **576 of 576** (pusher, obstacle)
  heading pairs admit the displacement, because the search returns an integer lattice vector
  and a lattice vector maps the lattice to itself.
- ⚠ **And probe 3 was vacuous until it was fixed.** It stamped `a0 + da - da`, the same call
  as the original, and compared a function against itself. Rewritten to push, recover through
  `wall_read_run` and unpush from the recovered description: identical on all three headings.
  ⛔ **It still does not exercise `B4q`'s risk**, because it stamps with
  `hex_shape::wall_write` while `B4q`'s mirroring was measured in `hex_editor::wall_stamp`.

⚠ **The draft is an instance of this tree's own rule** — *the gap is never where the first
guess puts it*. Five rules of exact arithmetic, correct in themselves, about the wrong object.

---

## 6. What this does not decide

- **Whether two adjacent rooms fuse.** `X52` says two adjacent boxes FUSE into one space, so
  whether pushing a partition to nothing leaves a hall or a room is hexbody's call.
  [HOUSE_ROOMS](HOUSE_ROOMS.md).
- **What a pushed cell does to the ground.** A house rides its pad rigidly
  ([TERRAIN_EDITS](TERRAIN_EDITS.md)); growing the footprint must extend the pad, and
  push-then-hill is a third order in that document's divergence table nobody has measured.
- **How a structure is identified in the store.** L1 and L7 both need *which* structure a cell
  belongs to, and the store records regions, floors and runs rather than labelled sets. The
  recovery half of that is what plan 26 `B4x` has been building; the authoring half is open.
