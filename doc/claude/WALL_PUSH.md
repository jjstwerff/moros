<!--
Copyright (c) 2026 Jurjen Stellingwerff
SPDX-License-Identifier: LGPL-3.0-or-later
-->

# Wall push — a wall you lean on, and everything that moves with it

**Designed, not built.** A toggle the author holds while walking: the wall in front of them
gives way and travels ahead of them. A house grows or shrinks, a tunnel lengthens, an
internal partition slides across a room. The gesture is `run`'s shape — arm, walk, release —
and the difference is that it **displaces** marks instead of laying them.

⚠ **THIS IS A DEFORMATION, NOT A REDRAW.** The point of the gesture is that the house you
already have survives it: the same walls, the same openings, the same materials, in new
places. Every rule below exists to keep that true, and the ones that can fail say so out
loud rather than approximating.

Read [FORMAL_CORE](FORMAL_CORE.md) first — the lattice, the three direction sets and §6's two
recovery regimes are the ground this stands on. [TERRAIN_EDITS](TERRAIN_EDITS.md) is the
same question one layer down (*how the ground moves, and what moves with it*), and its
order-divergence table applies here unchanged.

---

## 0. ⛔ The number that shapes the whole gesture

**One push step is not one distance.** A wall's line lives on the triangle lattice, and the
parallel lattice lines in a direction `d24` are spaced

    spacing = S·√3 / (2·√N),   N = a² + ab + b²  for the primitive vector (a, b)

`N` is an exact integer and — measured over all 24 directions, `hex_shape::tri_n2` — it takes
**exactly three values**:

| class | `d24` | N | spacing, world units | which walls |
|---|---|---|---|---|
| edge | 2 · 6 · 10 · 14 · 18 · 22 | **1** | **0.8660254037844386** | six of the twelve exact headings |
| vertex | 0 · 4 · 8 · 12 · 16 · 20 | **3** | **0.5** | the other six exact headings |
| in-between | every odd `d24` | **39** | **0.13867504905630726** | the twelve that sit 1.1021° off nominal |

⚠ **AND NO TWO ARE COMMENSURABLE** — `hex_shape::commensurable` is the predicate, and it is
false for all three pairs: the ratios are √3, √13 and √39, none rational. So **no whole
number of one class's steps ever equals a whole number of another's.**

Three consequences, and they are facts about the lattice rather than choices:

⛔ **@WP-0a A HOUSE CANNOT BE GROWN EVENLY.** A rectangle's four walls occupy two direction
classes, so *one push on each side* widens it by `2 × 0.866` one way and `2 × 0.5` the other.
An author who pushes each wall the same number of times does not get a scaled house; they get
a differently-proportioned one. The editor must show the distance, not the step count.

⛔ **@WP-0b A DIAGONAL WALL MOVES SIX TIMES MORE SLOWLY.** An in-between heading steps
`0.1387` where an edge-class wall steps `0.866` — a factor of `6.25`. Pushing a diagonal wall
across a room is 6× the walking. That is not a tuning knob; it is `N = 39`.

⚠ **@WP-0c AND THE STEP IS AT LEAST THE SPACING, NOT NECESSARILY THE SPACING.** A run is
anchored at a triangle-lattice **vertex**, and `hex_shape::tri_is_vertex` separates vertices
from centres — so the next parallel *lattice line* may carry no admissible anchor and the true
quantum may be 2 or 3 spacings for some classes. **This is unmeasured.** The rule below is
stated as *the smallest admissible translation*, with the spacing as its lower bound; §7 names
the probe that would settle it.

---

## 1. What moves

**@WP-1 A push translates a wall's LINE and never its direction.** The pushed wall keeps its
`d24`. A gesture that rotated a wall would be a different verb, and the recovery readers
(`wall_read_run`, and the chain cut of plan 26 `B4x`) would have to re-derive a heading the
author never chose.

**@WP-2 The translation is along the wall's own normal, in the direction the author faces.**
`hex_editor::run_normal` is that normal; the sign is the author's facing projected onto it.
A push with no component along the normal is a **refusal**, not a zero-length move.

**@WP-3 The displacement is the smallest translation that leaves the wall admissible** — its
anchor on a triangle-lattice vertex and `wall_run_ok(d24, a, b, p)` true. Exact integers
throughout; no float step, no snap-after-the-fact.

**@WP-4 The pushed wall is the one the author is in contact with and facing.** Contact is the
author's own position against the wall's band, which is `hex_editor::wall_of` at the author's
cell plus the facing test — the same pair `shelter_at` already asks. Two walls in contact at
once is a **refusal**: the gesture must never guess which one was meant.

---

## 2. What comes with it

This is the half the request names: *normally this will not reduce the number of walls,
because when hitting obstacles these also move indirectly with the push.*

**@WP-5 A wall sharing a vertex with the pushed wall does not translate — its PERIOD
changes.** A rectangle's side pushed outward drags the two walls at its ends; they keep their
direction and their far anchors and grow by whatever `p` the new corner requires
(`hex_shape::wall_snap_p`). This is why the count survives: the neighbours are *stretched*,
not moved and not re-created.

**@WP-6 THE COUNT IS PRESERVED EXACTLY WHILE EVERY INCIDENT WALL KEEPS AN ADMISSIBLE
PERIOD.** The one way a push reduces the count is a neighbour whose period would fall below
`wall_min_p(d24, a, b)` — a wall pushed until the wall beside it has no length left. That
wall is **removed**, and the removal is reported to the author rather than silent. Symmetric
on the way back: a push that would re-create it does not, because the store no longer records
it. ⚠ **So push is NOT invertible across a collapse**, and §6's round-trip rule is stated for
the non-collapsing case only.

**@WP-7 A structure the pushed wall would overlap is itself pushed, transitively.** The
obstacle's own walls enter the pushed set and take the same *displacement vector* — not the
same step count, because @WP-0a: a pushed structure whose walls run in another direction class
cannot move by an integer number of its own steps. ⛔ **This is the hardest rule in the
document and the one most likely to be wrong.** Either the obstacle moves by a distance that
is inadmissible for its own headings — and the push must refuse — or the propagation must
quantise per structure and the two drift apart. **Undecided; §7's probe is aimed at exactly
this.**

**@WP-8 The transitive closure must be finite and must not contain the pushed wall.** A ring
of structures each pushing the next back onto the first is a cycle; a cycle is a **refusal**
naming the loop, never a partial application.

**@WP-9 An enclosed floor moves with its boundary.** `TERRAIN_EDITS`' rule for a building
riding its pad, one layer in: the cells a pushed boundary encloses are refilled from the new
shape, never edited cell by cell. `hex_place::combine_cut` is the exact, float-free, order-free
primitive for it — and it has **zero callers in this tree** (see [HOUSE_ROOMS](HOUSE_ROOMS.md)),
so this rule is also the first consumer it would get.

---

## 3. Features ride, and one end is the anchor

**@WP-10 An opening is a span on its wall's surface, so a translation preserves it exactly.**
`@HB-X12`'s feature list is parameters on the surface, not marks in the field — a wall that
moves carries its doors and windows with no recomputation and no rounding.

**@WP-11 A LENGTHENED WALL ANCHORS ITS FEATURES TO THE END THAT DID NOT MOVE.** A stretched
neighbour grows at the corner the push displaced; a door two metres from the *other* end must
stay two metres from it. Anchoring to the moved end would slide every opening in the house
every time any wall is pushed, which is the failure this rule exists to name.

**@WP-12 The palette is untouched.** Thickness, body and material are the wall type's
(`@HB-X69`), and a push changes no id. A pushed wall is the same wall.

---

## 4. Where the verb lives

**@WP-13 Push is a VERB, not a key.** [EDITING_MODES](EDITING_MODES.md) is binding: a key
names a verb, the wire carries the verb, and *verb + mode + selection* binds to the gesture.
Push joins `the_vocabulary()` as an 18th entry — `keymap.loft` and `verb.loft` both refuse a
verb that is not in that list, which is the check that keeps the four sites from diverging.

**@WP-14 It is a HELD toggle, and the tick is shared.** The body belongs in
`hex_editor::tick.loft` beside the walk, so the server, the page and `editor_run` get it from
one place — [WALK_TICK](WALK_TICK.md)'s whole finding is that writing the tick twice loses a
clause. One push step per tick while contact and facing hold.

**@WP-15 The blueprint and the world are the same gesture.** [BLUEPRINT](BLUEPRINT.md) §0's
plan view already authors with `pick <x>,<y> <verb>`; push needs no second implementation
there, because the plan view acts on the same store. What differs is only that the author's
position is a pick rather than a pose.

---

## 5. Refusals, named

A refusal is data — `FORMAL_CORE`'s law **P4**, and the reason `run_between` returns a `why`.
Push refuses, never approximates, when:

| | |
|---|---|
| **R1** | the author faces no wall, or two at once |
| **R2** | the facing has no component along the wall's normal (@WP-2) |
| **R3** | no admissible translation exists in that direction (@WP-3) |
| **R4** | an incident wall's period would fall below `wall_min_p` — reported as a **collapse offer**, not a silent removal (@WP-6) |
| **R5** | the transitive push set is cyclic (@WP-8) |
| **R6** | a pushed obstacle's own headings admit no equal displacement (@WP-7) |

⚠ **R4 IS AN OFFER AND THE OTHERS ARE REFUSALS**, because losing a wall is a thing an author
may well mean. The distinction is the one `hex_shape`'s doorstep already draws: *there is no
legal move* against *this move costs you something*.

---

## 6. The invariants worth gating

**@WP-16 PUSH-THEN-UNPUSH IS THE IDENTITY ON THE STORE**, byte for byte, in the absence of a
collapse (@WP-6). This is the cheapest falsification the design has and it should be the first
test written: a world key before and after a push and its inverse. ⚠ **It can fail in a way no
picture shows** — `B4q`'s finding is that the same wall walked the other way is a different
field, so a push that re-derives the run rather than translating it would come back mirrored
with an identical mark count.

**@WP-17 A PUSHED HOUSE IS STILL DESCRIBED AS A HOUSE.** After the gesture, the plan view's
reader must still answer `house`, not a pile of runs. This is a live risk rather than a
formality: `house_recover` reads a **rectangle** off the floor cells, and pushing an *internal*
partition leaves a room that is not one. ⛔ **So moving an internal wall changes what the
window can be described as**, and the honest options are that the house becomes two rooms
(`X52` — two adjacent boxes FUSE, so whether that is a hall or a room is hexbody's call) or
that the description degrades to runs. **Undecided, and it is the most consequential open
question here.**

**@WP-18 The cost is `w_tau`, not seconds.** A push is a write per displaced edge plus a
refill of the enclosed floor; the edit clock makes that an exact integer on any box
(`lib/hex_editor/tests/cost.loft`). A gesture whose cost grows with the *world* rather than
with the pushed set has propagated further than @WP-7 allows.

---

## 7. ⛔ What would falsify this, and it is one afternoon

Three probes, in the order that kills the design fastest if it is wrong:

1. **The quantum (@WP-0c).** For each of the 24 headings, find the smallest translation along
   the normal whose anchor is again a `tri_is_vertex`. If it is not the lattice spacing, §0's
   table is a lower bound and the gameplay numbers change. **Pure arithmetic, no world.**
2. **The obstacle (@WP-7).** Two walls of different direction classes, one pushed into the
   other. Does an equal displacement exist for both? If it does not — and §0 says it usually
   cannot — then transitive push either refuses far more often than the request expects, or it
   is not a rigid translation at all.
3. **The round trip (@WP-16).** A house, a push, an unpush, `deck.keys`-style world key
   against the original. This is the one that catches a re-derived rather than translated
   wall.

⚠ **AND THE INSTRUMENT NEEDS CHECKING BEFORE THE ABSENCE IS BELIEVED** — a push that writes
nothing and reports success would pass a mark count, a picture and a cost check alike. Probe 3
must be shown to go red on a wall displaced by one step in the wrong direction before its
green means anything.

---

## 8. What this document does not decide

- **Whether an internal wall may be pushed at all** (@WP-17) — it changes the window's
  describability, and that is hexbody's boundary rather than the editor's.
- **Whether a tunnel is the same object as a house** — the request says lengthening a tunnel
  is the same gesture; a tunnel's walls are a run pair rather than a `Box`, so @WP-5's
  stretch rule may be all it needs and @WP-9 may not apply.
- **Whether push composes with terrain.** [TERRAIN_EDITS](TERRAIN_EDITS.md)'s order-divergence
  table says hill-then-build is not build-then-hill; push-then-hill is a third order nobody
  has measured.
