<!--
Copyright (c) 2026 Jurjen Stellingwerff
SPDX-License-Identifier: LGPL-3.0-or-later
-->

# Wall push — the formal rules

**Built — the mechanic, the verb and the boundary; see §7 for what is not.** A toggle the
author holds while walking: the wall in front of them
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

## 1a. ✅ Why the hex grid is an asset here, having been the cost everywhere else

**Every hard thing in this tree has been the RECOVERY direction** — field to description.
`corner_pool` cannot serve a corner where two runs meet; `FORMAL_CORE` §6 has two regimes
because some shapes are recoverable exactly and some only fitted; plan 26 `B4x` spent a whole
phase learning that within-ness alone is unsound. And `AUTHORING_MAP` §5.2 measured the price
on the *aiming* side: the direction quantiser's cells are **13.898 / 15 / 16.102°**, so
*"the authoring resolution is 6.949° and no input precision improves it"*.

⛔ **A PUSH HAS NO AIMING, NO SNAP AND NO FIT.** Its unit is a **step of the character**, and
the six neighbours of a hex are exact integers. There is no angle to quantise, no `d24` to
choose, no `wall_min_p` to satisfy, no run to snap between admissible vertices — the author's
own step selects one of six, and the store takes that cell.

✅ **So the lattice that made deriving a form hard is what makes authoring one easy.** The
editor stops trying to assemble a shape from separate blocks and hope it reads correctly; it
knows exactly what to draw, because the author walked there. ⚠ **That is also why the first
draft of this document was wrong**: it reached for the lattice's *line* arithmetic — the half
that is hard — for a gesture whose whole advantage is that it never touches it.

### What the free-placement builders pay instead

A free-placement builder — Conan Exiles, Palworld, Valheim — makes a house out of **pieces
that must meet**, and the work to make that look right is mostly not modelling the pieces.

**The compatibility surface is quadratic in the piece count.** Every piece carries snap
sockets, and placement searches nearby pieces for a compatible one. A new piece is not done
when it looks good; it is done when it has been tried against every plausible neighbour —
wall to wall, wall to floor, floor to roof, roof to roof at each pitch, stair to landing,
every tier and every material variant. That is why build sets grow slowly and why new ones
are usually re-skins of existing footprints rather than new footprints.

**And seams appear for reasons no artist caused:**

| | |
|---|---|
| float drift | placement error accumulates along a chain of snaps, so the twentieth piece is not where the first said it would be |
| dimension mismatch | a "2 m" wall modelled at 1.998 against a floor at 2.000 |
| coplanar faces | two surfaces at the same depth, z-fighting |
| shading | normals and lightmaps discontinuous across a join whose geometry is exact |
| LOD | two adjacent pieces swapping level at different distances |
| pitch | roof angles that do not tile with each other |

**Every standard mitigation is a way to HIDE it, not to prevent it**: model pieces oversized
so the join is buried inside solid material; author trim and corner caps whose only job is to
cover a junction; put a snap grid underneath the free placement; paint a decal over it. Each
costs geometry, and the oversizing trades a seam for a z-fight.

⛔ **THAT COST IS PER-ASSET AND IT NEVER ENDS.** It is paid again by every piece added for the
life of the game.

✅ **A LATTICE CANNOT REPRESENT THE PROBLEM.** Two cells share an edge or they do not — there
is no float, no socket, no search. A wall exists exactly where two cells disagree about
membership, and there is exactly **one** wall there, because `∂` is a function. There is no
second piece to misalign with the first, so the whole geometric class of seam is not a thing
that can occur. Adding a wall type is one palette entry (`@HB-X69`), not a snap set against
every existing piece.

⚠ **HONESTLY: THE GEOMETRIC SEAM GOES, THE SHADING ONE DOES NOT.** Normals, lightmaps, LOD
and t-junctions in the emitted mesh are the renderer's problem either way — `hex_mesh` still
has to emit a watertight mesh from an exact field. What the lattice removes is the *authoring*
class, which is the expensive one.

⛔ **AND THE PRICE IS EXPRESSIVENESS, PAID ONCE AND VISIBLY.** `45°` is not a lattice
direction at all — `tan 45° = 1` needs `m/k = √3`, irrational — which is why
[BLUEPRINT](BLUEPRINT.md) makes an octagonal face its own **material** rather than another
heading. A free-placement game can put a wall anywhere; this cannot, and says so.

**So the two are a cost curve rather than a preference**: they pay quadratic content cost
forever to buy arbitrary placement; this pays a one-time algorithmic cost — the recovery
direction, which is what plan 26 `B4x` has been buying — to make misalignment unrepresentable.

## 2. The laws

Each is a statement about observables, with the measurement that would falsify it.

### L1 — derivation  ✅ built
**After any push, the wall edges the store holds are exactly `∂I'`.**
No edge is a wall for any other reason, and none is missing. *Falsified by* comparing the
store's marks against `∂` of the recovered cell set, edge for edge.

✅ **AND `∂` IS A FUNCTION, WHICH IS WHY THIS IS SIX WRITES AND NOT A REDRAW.** A push does
not *move* a wall: it changes one cell's membership, and only the six edges of that cell can
have changed status, because every other edge's two cells are exactly as they were. So L1
and **L4** come out as the same six writes rather than as a bound one has to defend against
the other. `hex_editor::boundary_follow`, called from `push_cell`.

⚠ **THE DEFINITION IS `hex_draw::draw_walls`' AND IS NOT COPIED.** `tests/push.loft`
rebuilds the cell set out of the store, hands it to the library's own boundary rule and
compares its answer against the store's edge bytes — with the unmaintained write as the
negative control, so the comparison is known to be able to fail. Sweeping a face of a
19-cell room leaves **0 stray and 0 missing**; the same fixture with the cell written and
the marks left alone reports the difference.

⛔ **AND THE PRECONDITION FAILS ON THE ONE STRUCTURE THE EDITOR ACTUALLY BUILDS.**
`place_house` stamps its walls from four run LINES, not from the floor's membership, so it
leaves edges that bound no house cell — measured here at **8 stray sightings, 0 missing**,
which is the four edges [BLUEPRINT](BLUEPRINT.md) §0's first picture found, each seen from
both of its cells. A row asserting `(0, 0)` there would be asserting somebody else's defect
away. ✅ **So the claim a push can actually owe is componentwise `≤`: it never makes the
store less like its own boundary.** Measured: **8/0 before, 6/0 after** — the push took one
of the four out, because it happened to lie on the transferred cell's rim.

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

### L10 — the palette is untouched  ✅ built
**A push changes no wall id.** Thickness, body and material are the wall type's (`@HB-X69`);
a pushed wall is the same wall.

✅ **THE ID IS CARRIED, NEVER INVENTED**, and the byte carried is the one the author was
standing behind — *the wall in front of you gives way and travels ahead*, spelled as
arithmetic. Measured with a wall type this editor's vocabulary does not name (slot 9), which
an invented id would not reproduce: `WALL_MAT` is 1, and a guess would most likely be 1 too.

⛔ **AND *NO WALL ID* INCLUDES ONE THIS PUSH DID NOT PUT THERE.** The transferred cell was
outside the set, so a byte already standing on one of its outward edges belongs to something
else — a fence round the yard, a neighbour's house, a wall of another type. `∂I'` wants an
edge there and the store already holds one: **the set of walled edges is exact whichever id
survives**, and the only thing an overwrite would change is whose wall it is. So a boundary
already standing is left alone, and a room grown past a fence keeps the fence.

⚠ **CLEARING IS NOT SYMMETRICAL WITH THAT, AND IT IS NOT AN OVERSIGHT.** An edge that has
become interior cannot be a wall under `∂` whatever its id, so it goes whether it was ours
or not.

✅ **AND `0` IS AN ID.** When there is no wall in front of the author the structure has none
and the maintenance writes **nothing at all** — which is what keeps a road and a tunnel
floor byte-identical, and is a stronger statement than *a road has no walls to maintain*: it
also means a road pushed along the outside of somebody's house cannot rub that house's wall
out on the way past.

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

## 3. The gesture  ✅ built — `G1` and `G2`

**G1 Push is a VERB, not a key.** ✅ `VB_PUSH`, the eighteenth entry of `the_vocabulary()`,
bound to `2`. ⛔ **It may not spend one of the freed letters, and the suite said so.** `P` was
the obvious mnemonic and `P I U N M` are pinned to NOTHING by `tests/verb.loft` — they are the
evidence that `opening`'s six keys collapsed to one, and *"a second key naming anything there
is what a lost selection looks like from here"*. A digit follows `tower`'s `1` and its note:
the editor has run out of letters, the binding is data, and a person remaps it from inside. [EDITING_MODES](EDITING_MODES.md) is binding: a key names a
verb, the wire carries the verb, and *verb + mode + selection* binds to the gesture. Push
joins `the_vocabulary()` as an 18th entry — `keymap.loft` and `verb.loft` both refuse a verb
that is not in that list, which is the check that keeps the four sites from diverging.

**G2 It is a HELD toggle over a WALK, and the tick is shared.** ✅ **Built.** One transfer per
tick while the toggle holds; the body is in `hex_editor::tick.loft` beside the walk, so the
server, the page and `editor_run` get it from one place — [WALK_TICK](WALK_TICK.md)'s whole
finding is that writing the tick twice loses a clause.

⛔ **THE TRIGGER IS EVERY TICK AND NOT ONCE PER HEX — AND THE FIRST ARGUMENT FOR THAT WAS
WRONG, WHICH IS THE MOST USEFUL THING IN THIS SECTION.** It ran: *the thing a push moves is
the thing stopping the walk, so the author pressed against the wall never enters a new hex,
the trigger never fires, and the gesture hangs on itself.* It is coherent and it is false.
[`probe/wp/sweep-g2.sh`](../../probe/wp/sweep-g2.sh) row 2 **is** the level stamp's trigger
applied to the push, and it went **green**: a walker meeting a wall is standing in a hex
they have JUST ENTERED, so a per-hex trigger fires there too.

✅ **WHAT ACTUALLY SEPARATES THE TWO IS TURNING.** *The wall in front of you gives way* is a
statement about the **facing**, and a facing changes with no hex entered at all — so a
per-hex trigger leaves an author turning on the spot with the gesture held and nothing
happening. Measured: turning in place with the toggle held takes exactly the cell turned
into, having taken nothing while facing the room. That row is what makes sweep row 2 red,
and before it existed the trigger this code depends on was defended by an argument no test
could see.

✅ **AND WHAT MAKES PER-TICK SAFE IS `push_cell`'s `already`, NOT A GUARD.** Taking a cell
that is in the set writes nothing, so a thousand ticks standing still take the one cell one
tick takes — measured, with `w_tau` unmoved. `tick_dt()` is a constant by law, so there is
no faster tick to outrun the gesture with. **Idempotence is what makes the trigger safe; the
facing is what makes it right.**

⚠ **AND IT IS A VERB'S MODE, NOT A WIRE MESSAGE.** `levelling` and `roading` are the two
modes this editor already had and **both are driver-local booleans behind message ids of
their own**, so each driver decides for itself what the key means — the four-site divergence
[EDITING_MODES](EDITING_MODES.md) names. `press_verb` flips `es_pushing`, so `2` means the
same thing in the server, on the page and in the runner because one body decides.

⚠ **THE ARMING PRESS STILL TRANSFERS, AND THAT IS NOT A CONVENIENCE.** The author is
standing against the wall — that is how they came to press the key — and the wall is what
stops their walk. A toggle that only armed would leave them pressed to a wall that has not
moved, waiting for a step the wall forbids.

⛔ **IT DOES NOT PAY L11, AND THE REASON IS THE CONTROLS RATHER THAN THE GESTURE.** `W`
walks along the facing and `cell_ahead` takes the cell along the facing, so **you can only
push in the direction you walk**. Walking into a wall drives a **one-cell corridor** through
it; sweeping a face would mean walking ALONG the face while facing it, and this editor has
no input for that — there is no strafe, and A/D turn. Measured both ways: every cell a
pushed walk takes lies on the walk's own line, and `house_recover` reads a house before the
walk and refuses it after. **That is L11's own falsification sentence, run as a measurement
rather than as a warning.**

⚠ **AND THE CORRIDOR IS NOT STRAIGHT WHEN THE WALL IS NOT SQUARE TO IT.** `tools/scripts/push.keys`
walks into a house placed at facing 30 and the eight cells taken wander by three rows,
because `walk_to` slides along a surface it cannot cross and the corridor follows the slide.
Stable, deterministic, and what a person actually gets.

⛔ **AND THE ROAD — THE GESTURE THIS PARAGRAPH USED TO CITE AS ITS MODEL — IS NOT DRIVEN BY
A WALK AT ALL.** `road_lay` has exactly **one** call site in the tree and it is inside
`editor_server.loft`'s `MSG_PLACE` handler, so holding the road toggle and *walking* lays
nothing; only a teleport does. The page has no `road_lay` at all. So *"it works like drawing
a road"* was a comparison to something that does not work that way, and the sentence is
removed rather than repaired. [EDITOR_DEFECTS](EDITOR_DEFECTS.md).

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
| ✅ **R6** | the author faces an **opening** rather than a wall — built, and it is what law **L9** costs. An edge is one byte holding the wall and the feature at once (`@HB-X70`), so carrying a `DOOR_MAT` onto the new face turns five edges of masonry into **five edges of hole** — measured before it was refused. The wall type the door perforates is recorded nowhere the gesture can read, and `WALL_MAT` would be an invented id in a room that may be walled in another type, which is exactly what L10 forbids. ⛔ **What it costs is a NOTCH**: the rest of the face sweeps and the doorway's cell does not, which is L11 — the refusal keeps the world coherent and hands the shape problem to the law that owns it. ⚠ A **fence** is not refused: it is a boundary in its own right rather than a hole in one, so carrying it forward extends a paddock and stays exact |

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

- **Whether two adjacent rooms fuse.** `@HB-X52` says two adjacent boxes FUSE into one space, so
  whether pushing a partition to nothing leaves a hall or a room is hexbody's call.
  [HOUSE_ROOMS](HOUSE_ROOMS.md).
- **What a pushed cell does to the ground.** A house rides its pad rigidly
  ([TERRAIN_EDITS](TERRAIN_EDITS.md)); growing the footprint must extend the pad, and
  push-then-hill is a third order in that document's divergence table nobody has measured.
- **How a structure is identified in the store.** L1 and L7 both need *which* structure a cell
  belongs to, and the store records regions, floors and runs rather than labelled sets. The
  recovery half of that is what plan 26 `B4x` has been building; the authoring half is open.

---

## 7. ✅ What is built, and ⛔ what is not

⚠ **THE PREVIOUS COMMIT'S MESSAGE PROMISED THIS SECTION AND DID NOT WRITE IT** — *"two of
three subjects finished, and the boundary is in §7"* — while this document's own header and
[STATE](STATE.md)'s verb table both sent the reader here. A pointer to a section that does
not exist reads exactly like a section that says nothing, which is why the reader has no way
to tell the difference. It is here now, and the discipline it is written under is the one
that makes it worth having: **every line below is a measurement in
`lib/hex_editor/tests/push.loft`, not a plan.**

### ✅ Built

| | |
|---|---|
| the mechanic | `push_cell` — one cell across the boundary, at the source's height |
| the subject | `session_push` — the material under the author's feet, so a road, a room floor and a tunnel are one gesture with no branch |
| the verb | `VB_PUSH`, the eighteenth of `the_vocabulary()`, bound to `2` |
| **`G2`** the held toggle | `press_verb` flips `es_pushing`; `walk_tick` performs one transfer per tick; all three drivers carry one boolean across. ⛔ Every tick and **not** once per hex — because a push is aimed by the **facing**, and a facing changes with no hex entered: turning in place with the toggle held takes the cell turned into. ⚠ The deadlock argument this trigger was first defended with is **refuted** — sweep row 2 is the per-hex trigger and went green until the turning row existed. ✅ Safe because `push_cell`'s `already` writes nothing: a thousand ticks standing still take the one cell one tick takes, `w_tau` unmoved |
| the driver join | `tools/scripts/push.keys` — the library tests call `walk_tick` directly and cannot see whether a driver carries the mode. Baselined by `probe/k3d`, and blessing it wrote **one** baseline: no other script's world moved |
| **L1** derivation | `boundary_follow` — the six edges of the transferred cell, compared against `hex_draw::draw_walls` edge for edge |
| **L2** unit | one cell, one of the author's own six neighbours |
| **L3** cost | `pu_dn = 6 − 2k`, against an independently counted boundary, over four pushes so `k` varies |
| **L4** locality | restoring the one cell restores the window's digest — **and the digest counts the edge bytes now**, which it did not before L1 and could not have seen a scribble through |
| **L5** invertibility | out and back is byte-identical, and *back* is the same call rather than an undo: standing outside, the set being grown is the GROUND |
| **L10** palette | the id is carried, measured with a wall type this vocabulary does not name — and a boundary already standing is never repainted |
| **R6** | a push through a doorway is refused |

### ⛔ Not built, and what each one turns on

| | |
|---|---|
| ⛔ **L11 — a sweep preserves the description** | **`G2` was supposed to pay this and does not, and the reason is the CONTROLS.** `W` walks along the facing and `cell_ahead` takes the cell along the facing, so **you can only push in the direction you walk**: a walk drives a one-cell **corridor**, which is the dent L11 refuses. Sweeping a face means walking ALONG it while facing it, and this editor has no strafe — A/D turn. Measured both ways: every cell a pushed walk takes lies on the walk's own line, and `house_recover` reads a house before and refuses it after. ⚠ **So the next step is an INPUT question, not a gesture one**, and that is the finding `G2` bought |
| **L6 — partition**, **L7 — yield** | ⛔ **not reachable at all, and measured saying so.** Membership is the MATERIAL, so two rooms of one floor are ONE set: standing in room A facing room B, the cell ahead is already in the set and the gesture answers `already`. The request's third case — *an internal partition slides* — needs §6's open question answered first, and the test row that pins this goes red the day it is |
| **L8 — connectivity** | no refusal exists. `push_cell` refuses `nothing ahead` and R6, and nothing else — R1–R5 are all unbuilt, so a push can breach a closed enclosure and nothing says so |
| **L9 — features ride** | R6 is the placeholder, not the answer. An opening is a span on the wall's surface (`@HB-X12`) and the store's edge is one byte holding both |
| **the filed `WallRun` records** | ⛔ **not maintained, and this is the one to read before looking at a pushed house.** `place_house` files four runs and [EDITOR_DEFECTS](EDITOR_DEFECTS.md) 4 measured that **every wall is drawn twice** — once round the hex edges from the store, once straight from the run. A push moves the store's marks and leaves the run where it was, so the two drawings come apart. The defect is not this document's; the consequence is |
| **the ground** | §6's second bullet, untouched: a grown footprint does not extend the pad, and *push-then-hill* is still an unmeasured order in [TERRAIN_EDITS](TERRAIN_EDITS.md)'s divergence table |
| ⛔ **the road, which is not this document's and is worth knowing anyway** | `G2` used to cite the road as its model — *"it works like drawing a road"*. `road_lay` has **one** call site in the tree and it is inside `editor_server.loft`'s `MSG_PLACE` handler, so holding the road toggle and *walking* lays nothing; only a teleport does, and the page has no `road_lay` at all. The corpus never noticed because its scripts drive the character with `at`. [EDITOR_DEFECTS](EDITOR_DEFECTS.md) |

### ✅ The sabotage sweep, and the row that refuted its own prediction

`sh probe/wp/sweep-l1.sh` — ten rows, restoring from copies, each sabotage asserting that it
applied. ✅ **Rows 2 and 3 are what make it worth reading**: cutting the never-repaint guard
takes down the fence row *and only it*, and cutting `R6` takes down the doorway row *and only
it*. Rows 1, 4 and 5 take down seven rows each and are therefore the **weakest** evidence in
the table — *L1 is absent* answers every question the same way.

⛔ **AND ROW 9 REFUTED THE PREDICTION.** The window digest gained the edge bytes with L1,
under a comment saying a blind digest could not see a gesture scribbling edges. Row 8 removed
them and went green; row 9 put a wrong-id sabotage back beside the blind digest and went red
**anyway**, through `pu_id` and the per-edge loop. **No row is currently carried by those
terms** — they stay because the case they cover is silent, and the comment now says so.
[probe/wp](../../probe/wp/README.md).

### ✅ `G2`'s sweep, and the row that refuted the code's own justification

[`probe/wp/sweep-g2.sh`](../../probe/wp/sweep-g2.sh), eight rows.

| row | what was cut | what went red |
|---|---|---|
| **0** | nothing — the control | green, and the push block asserted present first |
| 1 | the push block (the feature absent) | **6** rows |
| ⛔ **2** | the LEVEL STAMP'S TRIGGER — once per hex entered | **1** — the turning row, **and it went green before that row existed** |
| 3 | the second press does not disarm | **1** — the toggle row, and only it |
| 4 | the arming press no longer transfers | **2** — both verb rows |
| **5** | CONTROL — the push moved above the level stamp instead of below | green |
| 6 | the RUNNER stops carrying the mode | library green, **k3d red — and the WORLD moved** |
| **7** | CONTROL — the runner's report line deleted, the mode still carried | library green, **k3d red — the TRANSCRIPT moved, the world did not** |

⛔ **ROW 2 IS THE ENTRY, AND IT WENT GREEN.** The trigger this gesture depends on was
defended by an argument nothing could see, and the sweep is what found that. The turning
row was written to answer it, and the argument in the code is now the one that is measured.

⚠ **AND ROWS 6 AND 7 ARE A PAIR BECAUSE `k3d` RED ALONE CANNOT TELL A LOST CAPABILITY FROM A
CHANGED SENTENCE** — its record is the transcript *and* the world. Deleting the runner's own
`println` turns it red exactly as dropping the mode does; the **md5** is what separates them,
so the sweep reports that line rather than the verdict.

### ⚠ And the precondition that fails on the editor's own house

`place_house` stamps its walls from four run **lines**, so the store it leaves is not `∂I` —
**8 stray sightings, 0 missing**, which is the four edges [BLUEPRINT](BLUEPRINT.md) §0's
first picture found, each seen from both of its cells. So L1 as written cannot be asserted
there, and what a push can actually owe is componentwise **`≤`**: *it never makes the store
less like its own boundary*. Measured, **8/0 before and 6/0 after** — the push took one of
the four out, because it happened to lie on the transferred cell's rim.

⚠ **That number is the honest reading of what L1 bought.** The room fixtures are exact
because their walls come from `draw_walls`; the editor's own houses are not, and they will
stay that way until `place_house` stamps from membership rather than from a line.
