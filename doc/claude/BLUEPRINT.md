---
render_with_liquid: false
---
# The blueprint editor — a plan you perfect, then extrude

⛔ **PROPOSED, NOT SETTLED. The wall-type definitions in §2 are a proposal to
[hexbody](FORMAL_CORE.md), which owns the formal core.** `../hexbody` is read-only from here, so
what is written below goes there as a ticket before any of it is normative. Everything it rests
on — the lattice, `D`, the two domains, the recovery regimes — is already settled and is quoted
rather than re-derived.

## The requirement, in the reporter's words

> *"A house blueprint editor outside the in-world one. Where we can design details that need to
> be perfected before we extrude that to a real object and possibly push it into multiple
> layers. The rules/libraries used stay the same. This is done via mostly the same way so a
> character location on the map is still the running way (I want eventual controller support
> here). But this editor doesn't restrict the character anywhere. It can indicate positions of
> doors and windows and make multiple rooms / stairs and position furniture in a typical
> blueprint layout. It should paint the exact thickness of walls and it should allow for a
> different wall type that is rounded instead of straight for rounded structures like
> balconies/towers. And it should allow for octagonal walls for bay windows/balcony
> combinations. Multiple floors have a layout beside each other."*
>
> *"The octagon gets the 45 turns — that is why it needs a different material type. It doesn't
> behave like a normal wall. It can create a bay window from a straight wall."*
>
> *"And we allow octagon towers too, they are large enough for a unique deduction of the octagon
> shape."*

## 1. What the blueprint IS — and it already has a name

⚠ **THE FIRST QUESTION IS WHETHER THIS IS A SECOND AUTHORITY, AND THE ANSWER IS NO — BUT ONLY
BECAUSE OF WHERE IT SITS.** [FORMAL_CORE](FORMAL_CORE.md) §2.4.3 is blunt: *"the canonical text
is **not** a second editor representation, and must not become one — that is exactly the second
layer the editor is not allowed to have."* A blueprint that you edit, and that the world also
edits, is precisely that forbidden layer, and plan 24 exists to remove one of those.

**The formal model already distinguishes the safe case from the unsafe one:**

| | |
|---|---|
| `𝕋` | **canonical texts** — the written form of a model |
| `𝔽` | **field** states — the foxel, what the world holds |
| §2.4.3 | *"an authored **stencil** may carry a description, but once placed the world is foxel"* |

So a blueprint is a **stencil's description** — domain A, authored once in a **local frame**, then
placed. That is `𝕋`, and it is legitimate. What is forbidden is a blueprint that stays live
*beside* the placed world and is edited in parallel.

⚠ **THE INVARIANT, AND IT IS THE ONE THING TO GET RIGHT:**

> **A blueprint is authored, then EXTRUDED. After extrusion the field is the authority, and the
> blueprint is recovered from it by `rebuild` — never kept alongside it.**

"Extrude" is `draw`; "recover" is `rebuild`; §2.4.3 says `rebuild` is *"genuinely load-bearing
rather than a validation nicety — it is how a description is recovered from the world, for
editing"*. **Re-opening a blueprint means rebuilding it from the field**, which is what keeps one
authority. ⚠ If that round trip is lossy, the design fails — and §2 below names exactly where it
is lossy today.

## 2. Three wall types, and the octagon is a MATERIAL because 45° is not a direction

### 2.1 Straight — the only one that is a heading

A straight wall's direction is `d ∈ D`, `|D| = 24`. Written by `hex_shape::wall_write`, recovered
by `wall_read_run`, endpoints on triangle-lattice vertices. Measured 24 of 24 round-tripping
([probe/l1](../../probe/l1/README.md)), and the editor now takes its geometry from there
(plan 24 `H1a`–`H1e`).

### 2.2 Round — an arc surface, exact everywhere

`hex_edge::surf_arc(cx, cy, r)`, whose own comment is the argument for it: *"the normal is
**radial**, so it is exact everywhere along the curve — no faceting, no mesh."* A round wall is
therefore **not** a many-sided approximation; it is one surface with a centre and a radius.

Drawn by `hex_way::cut_arb`, which takes a `Surfaces` set and gives every boundary edge to its
**nearest** surface. Recovered by `hex_shape::arc_is_disk` / `arc_shell_max`.

### 2.3 Octagonal — 45°, and therefore NOT a wall at all

⚠ **THE EXACT REASON, AND IT IS ARITHMETIC RATHER THAN TASTE.** A lattice direction has
`tan θ = m/(k√3)` for integers `(k, m)`. For `θ = 45°`, `tan θ = 1`, so `m/k = √3` — **irrational.
No integer `(k, m)` gives 45°, at any run length.** It is not merely absent from `D`'s 24; it is
absent from the lattice.

**So an octagonal face can never be a straight wall, at any tolerance, and that is why it is its
own material rather than another heading.** `hex_editor::WALL_MAT` carries a `d ∈ D`; the
octagonal material carries a **construction** instead.

⚠ **AND IT IS DRAWABLE, WHICH IS THE PART THAT MAKES THIS POSSIBLE AT ALL.**
`hex_edge::surf_straight(s, nx, ny, c)` takes an **arbitrary float normal** — its own header says
*"every one of the 24 headings, **and for anything between them**"* — and `cut_arb` marks edges
against it by nearest-surface. So a 45° face is expressible as a *surface* even though it is not
expressible as a *heading*. **The lattice constrains what a wall's DIRECTION may be; it does not
constrain what a surface may be.** That distinction is the whole of §2.3.

⚠ **THE PRICE IS RECOVERY, AND IT IS NOT SYMMETRIC.** A straight wall is recoverable from its
marked edges alone (`wall_read_run`). A 45° face is not: no `d24` is parallel to it, so the same
reader would refuse it — or worse, return the nearest `D` heading with `ok = true`, which
[probe/l1](../../probe/l1/README.md) measured it doing for walls drawn off `D`. **An octagonal
wall must therefore be recoverable some other way**, and there are two, which is why the
reporter's two cases are genuinely two cases.

### 2.4 The bay — a FEATURE of a wall, not a wall

> *"It can create a bay window from a straight wall."*

A bay grows **out of** a parent straight wall. Formally it is the same category as an opening,
which `X70` already settles: *"an opening is never 'no wall' — a door, a window and a real gap are
all **materials on a wall that continues**"*, carried as spans by `hex_edge::Features`
(`feature_add(surf, s0, s1, …)`, `apply_features`).

**A bay is that, projecting instead of perforating:**

| | opening (`X70`) | bay (proposed) |
|---|---|---|
| carried as | a span on the parent wall's surface | a span on the parent wall's surface |
| what it does to the wall | **perforates** — the wall continues past it | **projects** — the wall detours around it |
| its own geometry | a profile (round, pointed) | three faces at 45°, 90°, 45° to the parent |
| recovered from | the parent's feature list | the parent's feature list |

⚠ **SO A BAY IS NEVER AUTHORED AS THREE WALLS.** Its faces are **derived** from the parent's
direction, its span and its projection depth — three numbers, not three headings. That is what
makes it recoverable: `rebuild` reads the parent wall (a `D` run, exactly), then its features.
**Nothing has to deduce 45° from the field, because 45° was never stored.**

⚠ **AND THAT IS ALSO ITS LIMIT**: a bay cannot be moved independently of its wall, cannot outlive
it, and cannot be authored where there is no wall. Those are consequences of the definition and
should be refusals in the editor, not surprises.

### 2.5 The tower — a FORM, and "large enough" is the whole claim

> *"We allow octagon towers too, they are large enough for a unique deduction of the octagon
> shape."*

A freestanding octagon has no parent wall to hang off, so §2.4's recovery does not apply. It must
be deduced **from the field**, which puts it squarely in §6's two regimes:

| regime | when | residual |
|---|---|---|
| **R1** grammar-guided | the shape is in the admitted set and the field determines it uniquely | `ρ = 0` |
| **R2** trace | it is not, or the field is ambiguous | `ρ > 0`, **reported** |

**"Large enough for a unique deduction" is exactly the R1/R2 boundary, and it is a measurable
threshold rather than a judgement.** A small octagon's rasterisation is ambiguous — at radius 1
or 2 the cell set it produces may be indistinguishable from a hexagon's or a disc's, and
`hex_shape::arc_is_disk` would claim it. A large one is not.

⚠ **THIS IS THE ONE NUMBER THIS DESIGN DOES NOT HAVE, AND IT IS CHEAP TO GET.** See `B0p` below.
Until it is measured, *"large enough"* is a hypothesis, and shipping an octagon tower smaller than
the threshold means shipping a shape that reloads as something else.

⚠ **AND A REGULAR OCTAGON IS NOT A `Form`.** `hex_form`'s law J: a turtle cycle closes when
`sum(turn) = 12` twelfths, one turn per side, each an integer number of 30° steps. Eight sides at
45° need eight turns of **1.5 twelfths** — not an integer, so the octagon **cannot be expressed as
a `Form` at all**. It is not a turtle polygon; it is a set of eight `surf_straight` surfaces cut
by `cut_arb`. ⚠ **That is a second, independent reason it is its own material**, and it means
`hex_recover::rebuild` — which returns turtle forms — **cannot recover it**. `rebuild_construct`
is the candidate, and whether it can is `B0p`'s second question.

## 3. The editor itself

### 3.1 The character still walks, and nothing stops it

> *"a character location on the map is still the running way … But this editor doesn't restrict
> the character anywhere."*

The walk is already one implementation — `lib/hex_editor/src/tick.loft`, called by the server, the
page and `editor_run` alike ([WALK_TICK.md](WALK_TICK.md)). Collision is **not** in the tick: it
is an `EdgeSet` built by `hex_editor::edges_walk`, and `sweep_path` consults it.

⚠ **SO "DOES NOT RESTRICT" IS THE ABSENCE OF A CALL, NOT A FLAG.** The blueprint editor builds
**no** collision `EdgeSet` — the walker moves over the plan freely, at plan scale, and the same
tick body runs. Nothing forks. ⚠ **And it must stay the absence of a call**: a `no_collide`
boolean threaded through the tick would be the fourth site that decides what a gesture means,
which [EDITING_MODES.md](EDITING_MODES.md) already counts as a shipped mistake.

### 3.2 Controller support — ⛔ this is the one real GAP

`loft-libs-game/input` is the right abstraction and already matches the editor's verb design:
named **actions** and **axes** rather than raw keys, with `is_action_pressed`, `get_axis`, and
runtime rebinding. It is what `EDITING_MODES`'s *"a KEY names a verb — declared, small,
remappable"* asks for.

⚠ **BUT IT IS KEYBOARD AND MOUSE ONLY, MEASURED.** `AxisBinding` is a pair of **key codes**
(`ax_neg`, `ax_pos`) returning −1/0/+1; `KEY_MAX = 256` indexes a keyboard scan table; there is no
gamepad anywhere in it, and `graphics` exposes none either.

**So a controller needs two things that do not exist:**

1. `graphics` (or a sibling) must expose gamepad axes and buttons — a host-import gap, the same
   shape as `gl_window_width` was before it was bound;
2. `input` must gain a **continuous** axis. A stick is not a key pair, and `get_axis` returning
   −1/0/+1 discards exactly the information a stick adds.

✅ **AND THE SEAM ALREADY EXISTS**: `input_tick_from_state` takes the state rather than reading
the keyboard — its own comment says *"network rollback would feed it"*. A gamepad feeds the same
door. **This is library work, upstream, and it should be raised before any of it is built here.**

### 3.3 Wall thickness, painted exactly

> *"It should paint the exact thickness of walls."*

The constants are the library's and they are exact in `ℚ(√3)` — `FORMAL_CORE` §6.2:
`BAND_TOPS = 1/2`, `BAND_SIDES = √3/2`, ratio exactly `√3`, with the widening rule
`(√3−1)/2` total and `(√3−1)/4` per face. `hex_shape::wall_new(d24, ox, oy, **half**, mat)`
already takes a half-width, and `WALL_W = 0.28867513459481287` is `1/(2√3)`.

⚠ **SO THICKNESS IS ALREADY A PARAMETER AND MUST NOT BECOME A SECOND CONSTANT HERE.** What the
blueprint adds is that the author can *see* and *set* it per wall — the number is the library's,
the choice is the author's.

### 3.4 Floors side by side

> *"Multiple floors have a layout beside each other."*

A level is `combine_cut_level`'s `at` parameter, and `FORMAL_CORE` §2.4.3's neighbour is the rule
to hold: **a level is not a height** — *"the level is a discrete sheet index and nothing else"*.

So the blueprint shows level `n` at a **view offset**, and that offset is presentation only:
`hex_place::Pose` (`pose_fwd_x/y`, `pose_inv_x/y`) maps between the blueprint's page frame and each
level's own frame. ⚠ **The offset must never reach the field.** If it does, two floors of one
house become two buildings a hex-step apart, and the stair between them stops being a stair.

### 3.5 Rooms, stairs, doors, furniture

All four already have their answer written down and none of them is new work here:

- **rooms** — [HOUSE_ROOMS.md](HOUSE_ROOMS.md): a house is a floor plan of boxes,
  `hex_place::combine_cut`, and the open question is whether adjacent boxes default to fusing or
  to a partition. ⚠ **The blueprint makes that question urgent rather than answering it**: on a
  plan you can *see* the partition, so the default becomes visible the moment this ships.
- **stairs** — a stair creates level `n+1`; `combine_cut_level` carries it.
- **doors and windows** — `X70`'s palette (`OPEN_DOOR`, `OPEN_WINDOW`, `OPEN_GAP`), as spans via
  `hex_edge::Features`. ⚠ And `X70` names a live defect first: `builtin_house_door` leaves the
  edge at material `0`, measured to **break the wall run** (36 edges / 2 dangling ends against
  38 / 0). Every door in a blueprint would inherit it.
- **furniture** — parts and props, which the catalogue and `hex_part` already carry.

## 4. What would falsify this

| probe | question | why it could kill the design |
|---|---|---|
| **`B0p`** | **at what size is an octagon uniquely deducible from its cells?** Rasterise octagons at radii 1…12, and for each ask `rebuild_construct` and `arc_is_disk` what they see. ⚠ The control: a hexagon and a disc of the same radius must be told apart from the octagon, or "unique" means nothing | if the threshold is large, small towers reload as discs — and §2.5's whole claim is that a threshold exists |
| **`B1p`** | **does a bay round-trip?** Author a wall + bay, `draw` it, `rebuild` it, compare. | if the parent's feature list does not survive, §2.4's recovery is fiction and the bay needs its own record — which is the second authority §1 forbids |
| **`B2p`** | **can `cut_arb` place a 45° face at all, exactly?** One wall, one bay, count the edges each surface claims. Control: a fixed "always the parent" rule must strand edges | this is `X55`'s measurement one shape over — it found 112/112 with a stencil against world linework, so the mechanism is proven; the bay is a harder case |
| **`B3p`** | **does the walker move with no collision `EdgeSet`?** | trivial, and it is the one that says §3.1 is an absence rather than a flag |

⚠ **`B0p` FIRST, AND IT CAN BE RUN BEFORE ANYTHING IS BUILT.** It is the only one whose answer
could change the *design* rather than the schedule — if an octagon is not uniquely deducible at
usable sizes, a tower must carry a description and §1's one-authority invariant needs re-arguing.

## 5. What must go to hexbody first

1. **The octagonal material** (§2.3–§2.5) — a new material with a construction rather than a
   heading, and a `Form` that provably cannot express it. That is formal-core territory.
2. **The bay as a projecting feature** (§2.4) — an extension of `X70`'s taxonomy from *perforates*
   to *projects*.
3. **The size threshold** (§2.5) — `B0p` measures it here; the *rule* belongs there.
4. **Gamepad axes** (§3.2) — `graphics` and `input`, upstream, and unrelated to the geometry.

⚠ **NONE OF §2 IS OURS TO SETTLE**, and this file says so at the top because the ground rule is
that the algorithms are never ours. What is ours is the editor, the catalogue, the verbs and the
view — and the measurements that tell hexbody what a consumer actually needs.
