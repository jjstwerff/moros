# 14 — Assemblies: bodies, links, and what holds each one up

**Issue:** [jjstwerff/moros#14](https://github.com/jjstwerff/moros/issues/14) ·
sibling of [DESIGN.md](DESIGN.md), which names this as the open half:
*"the multi-rig connector (rungs W6/W7's other half), which `hex_body` does not have."*

A wheel on a chassis. A cart towed behind a horse, and a second cart behind that. A
crate swinging under a balloon. A robot's arm, which touches nothing. A wing that warps
upward under air pressure. `hex_body` owns a **single rig** — bones, revolute joints, a
pure pose, a derived proxy. It does not own **how two bodies link**, and it does not own
**what holds a body up**. This design is those two, and the second one is the harder
half.

> **⚠ THIS REPLACED AN EARLIER VERSION THAT WAS WRONG, AND THE WAY IT WAS WRONG IS THE
> DESIGN.** The first draft said: *one frame, solved from the ground contacts, and
> everything inboard of it rigid*. That is true of a wheel and false of both cases the
> user named next. **A towed cart has its own ground contacts** — so it has its own
> frame, and the drawbar couples two frames rather than parenting one to the other.
> **A dangling crate has no ground contacts at all** — nothing about "solved from the
> contacts" applies to it. One mechanism had been stretched over three families that do
> not share it, and it read as elegant right up until the second family arrived.

---

## What is wrong today, measured

The cart shipped at rung 10a and its gate has been green throughout. Both of the
following were true the whole time.

| defect | measurement |
|---|---|
| **The wheels are drawn flat on the ground.** `emit_cylinder_post` builds its ring in the XZ plane whatever axis it is handed — the two endpoint arguments only move the endpoint centres | the cart's wheel mesh bounded `x 0.80 · y 0.00 · z 0.92`; a wheel is `0.80 · 0.80 · 0.12` |
| **The body's height is a constant.** `translate(cx, CART_RADIUS, cz)` — a fixed lift above `y = 0`, never above the *ground* | on a 4.8° slope the wheels hang **0.204 wu** clear of the terrain |

Both are fixed and gated on this branch. **This design is not that fix**; it is the
structure the fix should have been written into, because of a third defect it did not
remove:

> **⚠ The connection is written down more than once.** "The wheel is `CART_HALF_W` from
> the chassis" is currently restated in the render transform, again in the
> ground-contact arithmetic, and again as the literal `1.1` in the gate. Three
> independent sites, and a disagreement between them is **silent**.

And a fourth, in the instrument, worth recording because it is the same mistake:

> **⚠ A gate clause that restates the connection cannot test it.** The first axle check
> asked the server for the length; the server computed `2·half·√(cos²β + sin²β)` — the
> answer `1.1` for every input. A clause that could not fail. Replaced by one reading
> the two wheel transforms **actually put on the wire**, which could then be seen red.

---

## The invariant

> **Every body's six degrees of freedom are accounted for exactly once: removed by a
> link, removed by a support, or carried as a named state. None is left implicit.**

```
    dof(links) + dof(support) + dof(state) = 6        for every body
```

Under-count and something is being pinned by accident — a value nobody chose and no
test names. Over-count and the body is over-constrained, which is a real physical
situation (four wheels on uneven ground) that must be **refused or sprung**, never
silently averaged away.

This is the rule that survives all three families, and it is a *counting* argument, so
it can be checked rather than argued.

| body | links | support | state | Σ |
|---|---|---|---|---|
| wheel on a chassis | rigid mount removes **5** | — | spin **1** (derived from travel) | 6 |
| **two-wheel cart, hitched** | drawbar removes **3** | two contacts give **2** (height, bank) | yaw **1** | 6 |
| **towed 4-wheel trailer** | ball hitch removes **3** | contacts give **2**, the 4th wheel is over-constrained → sprung, residual stated | yaw **1** | 6 |
| **crate under a balloon** | tether removes **1** (radial, and only when taut) | — | 2 swing + 3 own rotation = **5** | 6 |
| balloon | — | buoyancy gives **1** (equilibrium altitude) | x, z, yaw **3**; pitch, roll **2** | 6 |
| **robot arm segment** | mount removes **5** | `CARRIED` — the mount *is* the support | joint angle **1**, *commanded* | 6 |
| **wing station** | mount removes **5** | `CARRIED` | bend angle **1**, *solved from load* | 6 |

### ⚠ The count predicts a real fact, which is the best evidence it is the right rule

Run it on the cart **as it stands today, unhitched**: state carries `x`, `z`, `yaw` = 3;
the two wheel contacts give height and bank = 2. That is **five**. The sixth — *pitch* —
is supplied by nothing, and the current code pins it to zero by fiat, silently.

A real two-wheeled cart with no horse in the shafts **tips forward onto them**. It
cannot stand up by itself, and the arithmetic says so before any physics does: a
two-wheel cart is *under-determined alone* and the hitch is what completes it. The
earlier draft recorded this as "one axle fixes no pitch" — a gap to apologise for. It is
not a gap. It is a missing degree of freedom, and the rule turns it into a question with
an answer: **either something supplies the pitch, or the cart falls over.**

---

## Links: what a connection actually removes

A link constrains the relative pose of two bodies. **The families differ in which
degrees of freedom they remove**, and flattening them into "a rigid mount with one
revolute axis" is what the first draft got wrong.

| link | removes | leaves | note |
|---|---|---|---|
| **`MOUNT`** rigid, one revolute axis — a hub, a kingpin, a hinge | 5 | the joint angle | the only one the first draft had |
| **`HITCH`** a ball or pin — the drawbar's eye on the tractor's pin | 3 (position) | 3 rotations, of which yaw is the live one | **the child keeps its own support** |
| **`SHAFT`** a pair of rigid shafts — a horse in the traces | 5 | yaw only | this is what supplies a two-wheel cart's pitch |
| **`SPRING`** a suspension leg | 5, one of them **compliantly** | travel along the leg, bounded | how an over-constrained axle count is absorbed |
| **`TETHER`** a rope, a cable, a balloon line | **1, and one-sidedly** | everything else | `‖p_child − p_anchor‖ ≤ L` |

### ⚠ `TETHER` is an inequality, and that is not a detail

Every other link is an equation. A rope is `≤`: **taut or slack**, and the two states
have different DOF counts. Slack, the tether removes nothing and the crate is in
free-fall; taut, it removes one. A design that models a rope as a rigid rod of length
`L` gets a crate that *pushes* the balloon upward when it swings — a rope in
compression, which is the tether's version of a stretching con-rod: everything still
moves convincingly and only the sign of the constraint force tells you.

So the taut/slack transition is a **doorstep** (`K-FIT`), not a branch to be hidden: the
state is named, the transition is reported, and the residual on the taut side is the
overshoot `‖p − a‖ − L` that had to be projected out.

---

## Support: what holds a body up

Separate from attachment, and the first draft conflated them. **A wheel is attached to
the chassis and supported by the ground. A towed cart is attached to the horse and
supported by its own wheels. A crate is attached to the balloon and supported by the
attachment itself.**

```
  GROUND    contact samples against terrain      removes height, and bank/pitch per contact count
  CARRIED   the link IS the support              removes nothing further; the link already did it
  BUOYANT   an equilibrium altitude              removes height only
```

A body declares its support kind. `CARRIED` is the one that makes the balloon work at
all, and it is also the honest description of a wheel: a wheel is not solved against the
ground, **the chassis is** — the wheel is carried by its mount and it is the *chassis's*
support that reads the contacts at the wheel positions. That distinction is what lets a
trailer have wheels of its own without inheriting the tractor's frame.

### The `GROUND` solve, in closed form

For one axle — the cart — with `w` the half-axle, `R` the wheel radius, `u` the axle's
unit direction in the ground plane, `c` the body's ground position, `g(·)` the terrain:

```
  x_L(β) = c − u·w·cos β          g_L = g(x_L)
  x_R(β) = c + u·w·cos β          g_R = g(x_R)          d = g_L − g_R

  sin β = d / 2w                  y = (g_L + g_R)/2 + R
```

The contacts depend on `β` and `β` on the contacts, so it is a fixed point
`β_{n+1} = Φ(β_n)` seeded at `β₀ = 0`. With `s_L`, `s_R` the terrain slopes along `u`:

```
  d′(β) = w·sin β·(s_L + s_R)
  Φ′(β) = sin β·(s_L + s_R) / (2·cos Φ(β))
```

- **`Φ′(0) = 0`** — quadratically convergent near level, which is why three rounds
  measured a residual of `1.5 × 10⁻⁸` rather than something linear in the slope. A
  prediction the probe can check, not a happy number.
- **Converges while `tan β < 1/L`**, `L` bounding `|s|`. That degrades exactly where the
  `|d| ≤ 2w` doorstep bites, so solver and refusal fail together rather than the solver
  diverging quietly inside the region it claims to handle.

**⚠ The steep case is live.** `sin β = d/2w` has no solution when the ground drops more
across the axle than the axle is long. The raise brush's own documentation records
flanks of **74–83°**, deliberately, against an axle of `1.1` wu — so this fires in
normal use, not at the margins.

---

## Bodies that touch nothing: the arm, and the wing

**The arm needs no new mechanism, and that is a result rather than a relief.** A robot's
arm is a chain of `MOUNT`s off the torso, supported `CARRIED` — the mount *is* what holds
it up — and the ledger closes at 6 per segment with the joint angle as the state. It is
the same shape as a wheel on a hub. The one thing it changes is a scheduling decision:

> **⚠ `P3` is no longer deferrable.** It was parked on the grounds that *"nothing in
> Moros has an articulated limb yet"*. An arm is an articulated limb, so the claim that
> a 3-DOF shoulder is three zero-offset `MOUNT`s in series is now load-bearing and must
> be probed before it is built on.

**The wing is different, and it splits one term of the ledger in two.**

`hex_body` already answers where a bending part *is*: ***"flex is joints, not
deformation … a part that bends is more bones on more joints, so this survives a
flexing wing unchanged and hexbody needs no skinning."*** That is the right answer to
the kinematics, and the wing is exactly the case it names. But the wing asks two
questions the wheel never did.

### What drives the state — and this is a new axis

A wheel's spin comes from `travel`; an arm's joint angle is *commanded*. A wing's bend
comes from neither: **the air pushes, the spar resists, and the angle settles where the
moments balance.** So a state is one of two kinds, and a body must say which:

```
  DRIVEN   advanced by something outside — travel, a command, an integrator
  SOLVED   determined by equilibrium — moment balance, spring compression, hanging rest
```

A `SOLVED` state is a fixed point in exactly the shape the ground contact already is —
the pose depends on the load and the load depends on the pose — so it reuses the
machinery rather than adding any. That is the unification worth having, and it is a
narrow one: **the same solver shape, a different residual.**

⚠ **`SOLVED` is quasi-static, and choosing it is choosing to have no dynamics.** A wing
solved to equilibrium bends but never *flutters*; a crate solved to equilibrium hangs
straight down and never *swings*. Both are often what you want and both are far cheaper.
The error to prevent is picking one by accident, which is why the kind is declared per
state and appears in the ledger rather than being implied by the link type.

### ⚠ "hexbody needs no skinning" is true of the RIG and false of the PICTURE — measured

Joints answer where a part is. They do not answer what it *looks like*, and the gap
between those is not hypothetical here:

> **The editor's own character already shows this defect, and it was measured today.**
> `limb_mesh` builds a leg as a box from `y = −len` to `y = 0`, and `limb_at` pivots it
> about `y = 0` — so **the box's top face lies in the pivot plane**. The torso's pelvis
> box has its flat bottom at exactly that same height. Rotate the joint by `θ` and one
> corner of the leg's top face dips below the torso by `(half-width)·sin θ`, opening a
> wedge that nothing fills. In the rendered frame the band reads as the light tan
> `ab8060` of a *lit top face* — the top of the thigh, seen from above, through the gap.

One hinge, one visible seam. A wing discretised into ten stations has **ten of them**,
along the one edge a viewer looks straight down. So:

- **the rig** may be rigid segments — kinematics and collision are satisfied by joints;
- **the skin** must be continuous across a joint, and that needs either geometry that
  *overlaps* the joint by at least the maximum wedge `(half-width)·sin θ_max`, or a mesh
  that genuinely deforms.

For the character, the overlap is the right answer and it is one number: the pelvis box
extends below the hip plane by the maximum wedge, and since the torso is already wider
than the leg (`0.36·h` against `0.31·h` in x) it covers from every angle. For a wing,
overlap is unlikely to survive ten joints and a smooth aerofoil, so **the wing is the
case that decides whether skinning is needed** — which makes it a probe, not an
assumption inherited from a comment.

---

## History lives in the state, so the pose stays pure

`hex_body`'s `L15` boundary says it answers *where a part is NOW, never what it will
do*, and `I6` makes the pose a pure function. A swinging crate has a position that
depends on its history, which looks like a violation and is not — because `hex_body`
already solved this exact problem for the wheel:

```
  travel          is state, accumulated by the world
  wheel_value     is a PURE function of it
```

Every state in the table above takes the same shape. A trailer's yaw lags its tractor;
a crate swings. Both are **named scalars advanced by the simulation**, and every pose is
a pure function of them. Nothing stores a transform.

```
  pose(body) = f(support samples, link states, joint values)        — pure, always
```

That keeps `I-POSE` intact across all three families and draws the dynamics line in the
one place it can be drawn: **integration advances the states; nothing else may.**

---

## The frames, formally

Body `i` has a frame `Wᵢ ∈ SE(3)`. A link `ℓ` from parent `a` to child `b` contributes a
constraint `Cℓ(W_a, W_b, θℓ) = 0` (or `≤ 0` for `TETHER`). A support contributes
`Sᵢ(Wᵢ, world) = 0`.

| id | statement | why it is the one |
|---|---|---|
| **`A-DOF`** | `dof(links) + dof(support) + dof(driven) + dof(solved) = 6`, per body | the invariant above. Every other rule here is a way of making one term of it honest. A state's kind — `DRIVEN` or `SOLVED` — is **declared**, never inferred from the link |
| **`A-SKIN`** | across any joint, the drawn geometry leaves **no gap at any admissible joint value** | joints answer where a part *is*; they do not answer what it looks like. Violated today by the character's hip — a wedge of `(half-width)·sin θ` that nothing fills |
| **`A-TOPO`** | the link graph is a **tree**: `p(0) = −1`, `0 ≤ p(i) < i` | canonical labelling, as `rig_admissible` does for a rig. ⚠ A **team** — two horses abreast on one cart — is two links to one body and is *not* a tree; see *open* below |
| **`A-EXACT`** | `write(read(A)) = A` byte-for-byte; malformed is **refused, never repaired** | an assembly is a description; loft's float↔text round trip is byte-exact, so no tolerance is needed |
| **`A-RIGID`** | for a `MOUNT` chain, `‖Wᵢu − Wᵢv‖ = ‖u − v‖` for all `u, v` | **the con-rod, once, for everything rigid.** Holds *by construction*: `SE(3)` is closed under composition, so `Wᵢ ∈ SE(3)` by induction over `A-TOPO`'s order. There is no site left that could stretch anything |
| **`A-PLANE`** | a `hex_body` rig embeds as `ι(x, y) = (x, y, 0)` in its node frame, and `ι` is an isometry | a spoke's length is `rg_len[i]` for every joint value — `I6` carried into 3D with no way to deform added |
| **`A-GROUND`** | for every contact: `lowest(part) − g(contact) = 0` | what "supported" means, and it is measurable |
| **`A-TAUT`** | `‖p_child − p_anchor‖ ≤ L`, with taut/slack a **named, reported** state | a rope never pushes |
| **`A-FIT`** | over-constrained → refuse with a residual, or absorb in a `SPRING` | `K-FIT` invariant I for a pose |
| **`A-PROXY`** | proxy `⊇` shape, overshoot **bounded and stated** | `hex_body`'s `I4`, verbatim |

### ⚠ `P4` is falsified on paper — a spoke's capsule does not bound its disc

The design hoped the proxy would fall out of `hex_body::bone_obb`. The algebra says it
does not. `bone_obb` bounds a bone's **capsule**: for a spoke of length `R` and
half-width `ω` it returns half-extents `(R/2 + ω, ω)`. A wheel's shape is the **disc**,
reaching `R` in *every* in-plane direction. So

```
  disc ⊄ bone_obb(spoke)      whenever ω < R          — which is always
```

**`I4` is violated: the proxy would miss overlaps**, the one thing a proxy may never do.
The wheel needs its own shape — the OBB with half-extents `(R, R, t/2)`, `t` the width:

```
  disc ⊆ OBB                  exactly
  vol(OBB)/vol(disc) = 4R²t / πR²t = 4/π ≈ 1.2732      — bounded and stated
```

So a body carries a **shape kind** (capsule for a bone, disc for a wheel, box for a
chassis) and derives its proxy from that. Still derived, never hand-authored; just not
inherited. This shrinks the payoff to *one home for the connection*, not free collision
— the smaller argument, which is the one to build on.

---

## What this costs, in re-assertion sites

| fact | homes today | homes under this design |
|---|---|---|
| wheel lateral offset | 3 (render, contact solve, gate literal) | **1** (the mount) |
| wheel radius | 3 (mesh, frame lift, contact) | **1** (the rig's bone length) |
| wheel spin | 1 (`hex_body::wheel_value`) ✅ | 1 |
| body height | 1, and it was wrong | **0** — derived, never written |
| what pins the cart's pitch | **0 — nobody, silently** | **1** (`A-DOF` forces it to be declared) |

Omitting a read is **silent** in every one of today's cases. Under the design the count
is 1, and the way to violate it is to write a literal where a read belongs — which is
**greppable**, and worth running as a sentinel rather than trusting.

---

## The steps

Each ships alone, is testable in loft with no server, and carries a **control** — a knob
that must make its own test fail. `slip` is the model: `hex_body` keeps a
deliberate-defect term precisely so `wheel_skid` cannot pass vacuously.

| | step | proves | control | size |
|---|---|---|---|---|
| **A0** | probe `P1`, `P3`, `P5`, `P6`, `P7` (`P4` is answered above) | the design before the code | — | M |
| **A1** | `Body`, `Link`, `Support` + admissibility + `write`/`read` | `A-TOPO`, `A-EXACT` | a forward parent; a relabelled tree; a truncated text — each **refused** | S |
| **A2** | **the DOF ledger** — `dof_account(assembly) -> (links, support, driven, solved)` | `A-DOF` | an assembly with pitch unaccounted (**today's cart**) must report `5`, not pass | S |
| **A3** | `MOUNT` composition — `body_frame(tree, i)` | `A-RIGID` | a `scale` term defaulting to 1; set it to 1.01 and the isometry test goes red | M |
| **A4** | embed a `hex_body` rig at a body | `A-PLANE` | the same scale knob applied to `ι` | S |
| **A5** | **the cart as data**, no behaviour change | that the structure expresses what exists | *the previous implementation*: transforms equal to the bit on flat ground | M |
| **A6** | `GROUND` support + the fixed point | `A-GROUND`, `A-FIT` | pin the frame to a constant → gap clause red (**already demonstrated**, 0.204 wu) | M |
| **A7** | `HITCH` + `SHAFT`, and a second body behind the first | `A-DOF` closing at 6 for both | unhitch the cart: the ledger must drop to 5 and the pitch become unsupported | L |
| **A8** | `TETHER` + `CARRIED`, and a crate under a balloon | `A-TAUT` | drive the crate past `L`; a rigid-rod implementation pushes the anchor **up**, which the sign test catches | L |
| **A9** | per-body shape and proxy | `A-PROXY` (`I4`) | a shape one size too small; containment must catch it | M |
| **A9b** | **joint overlap** — `A-SKIN` as a constructor rule, applied first to the character's hip | `A-SKIN` | sweep the joint's full range; a rendered gap at any value is red. The hip's current wedge is the standing negative control | M |
| **A9c** | a `SOLVED` state — the wing's bend from a load, on the `A6` solver shape | `A-DOF` with a `SOLVED` term | drive the load past the joint limits: it must refuse with a residual, not fold through itself | L |
| **A10** | the editor switches over; `cart.mjs` loses its axle clause and its `1.1` | the whole thing, in a running world | the stretch mutation (**already demonstrated**) | M |

**A2 before any geometry.** The ledger is a few lines, it needs no frames, and it is
the step that would have caught the original design: run it on the balloon case and
`GROUND` support does not apply, which is a *type error* rather than a debugging session
six steps later.

**A5 is the safety step and the reason the order is safe.** Before behaviour changes,
the assembly must reproduce the transforms the current code produces — byte-identical,
on flat ground, where the two agree by construction. That turns "did I break the cart"
into a diff, and the previous implementation is its own control.

**A7 and A8 are where the design earns or loses.** Everything up to A6 is a tidier
cart. A7 is the first *second frame* and A8 the first body with no ground under it — if
the structure holds for both without a special case, `A-DOF` was the right invariant.

**Where the tests live.** A1–A5 and A9 are pure functions of their arguments — no
terrain, no wire, no browser — so they are loft tests in `lib/moros_sim/tests/`. Only
A6's *sampling* touches terrain, only A10 needs a server, and that is what shrinks
`cart.mjs` to the one clause needing a running world.

**Property, not example.** `A-RIGID` is checked by generating point pairs and mount
angles and asserting `‖Wu − Wv‖ = ‖u − v‖` across them — not by placing one cart and
eyeballing one distance. Float composition drifts; the test asserts the drift **bound**
and records it, as `wheel_skid` records machine-ε rather than claiming algebraic zero.

---

## The probes

| | claim | probe | falsified if |
|---|---|---|---|
| **P1** | `rig_world_seg` is enough to place a part for rendering | build the cart's transforms from the rig and diff against the current matrices | the rig cannot express something render needs without a second source |
| **P3** | a 3-DOF joint is three `MOUNT`s in series | pose a known shoulder both ways, compare exactly | composing planar rigs through single-axis mounts diverges from the 3D rotation |
| **P5** | **a towed chain stays stable** | two carts behind a horse through a tight turn and a reversal | the yaw states oscillate or the chain jack-knifes without the geometry saying it should |
| **P6** | **N bones approximate a continuous bend to a stated bound** | discretise a cantilever under uniform load into `N` segments; measure tip error against the analytic elastica for `N = 2, 4, 8, 16` | the error does not fall predictably with `N`, or the `N` needed for a visually acceptable wing is large enough that the rig is the wrong representation |
| **P7** | **a joint can be skinned by overlap alone** | for the character's hip, extend the pelvis by the maximum wedge and sweep the full swing range looking for background through the joint; then repeat for a 10-station wing | overlap cannot close a wing's joints without visible bulging — then the wing needs real skinning and `hex_body`'s *"no skinning"* is true only of the rig |
| ~~P4~~ | ~~`bone_obb` proxies a wheel~~ | — | **falsified analytically above** |

**`P3` is now required, not deferrable.** It was parked because nothing here had an
articulated limb; a robot arm is one. **`P7` is the one that decides how big this
design is** — if overlap suffices, the rig stays rigid everywhere and `A-SKIN` is a
constructor rule. If it does not, a deforming skin is a second representation, and that
is a much larger claim than this plan currently makes.

### `P7`, the character half — RUN, and overlap holds

`probe/skin_joint.loft` (pure geometry, no server) with `probe/emitted_boxes.mjs` (the
wire, so the sweep is about the figure the server actually draws). Six cases, four of
them required to go red. **All six hold.**

| | case | result |
|---|---|---|
| A | the hip as built | **leaks at every θ ≠ 0** — depth `(w/2)·sin θ`, up to **0.0341 wu (2.95 cm)** at `LEG_SWING` |
| B | pelvis extended by the wedge | clean across the whole range |
| C | the same, swept to 1.5 × the range | **leaks past `θ_max`** — the fix is exactly tangent, not safe |
| D | the overlap 10 % short | leaks, and the depth matches the closed form |
| E | the **shoulder as built** | clean — and it needed no overlap |
| F | the same arm hung from the chest's bottom face | leaks |

So: **`ext = (w/2)·sin θ_max` closes the hip**, measured depth tracking
`max(0, (w/2)·sin|θ| − ext)` to within one grid step everywhere. Four results are worth
more than that number:

- **The wedge is not what makes a joint leak — a pivot plane ON the parent's boundary
  face is.** `E` and `F` are the same arm, the same rotation, the same code, and differ
  only in whether the pivot lands inside the chest box or on its underside. `shoulder_wu()`
  happens to land at `0.842·h` while the chest box runs `0.72 → 0.855·h`, so **the editor
  has been drawing one correct joint and one broken one all along**, for a reason nobody
  chose. Overlap is one way to put the pivot plane in the interior; picking the pivot there
  in the first place is another, and it costs nothing.
- **`ext` must be DERIVED from `θ_max`, never written as a literal.** `C` is not a curiosity:
  the fix is tangent at the range's edge, so a run cycle, a kick or a seated pose reopens
  the seam the moment `LEG_SWING` grows — silently, since the rig is still exact. That is a
  re-assertion site in the sense of the table above, and it is the reason the number belongs
  next to the swing constant.
- **The exposed AREA is constant at half the face**, for every `θ ≠ 0`; only the depth
  varies. The defect is therefore present in every walking frame, and what changes over a
  stride is how deep the pocket is, not whether there is one.
- ⚠ **The first measure was wrong and called `B` red.** It counted "air with the child
  below and the parent above", which is every CONCAVITY — the outer hip is one, so is an
  armpit, and nothing is wrong with either. The clause that fixed it is *"and there is
  parent material directly above"*: it separates a pocket from a shoulder, and without it
  the measure condemns `E`, the joint that works.

### `P7`, the wing half — RUN, and the prediction from the hip was WRONG

`probe/wing_skin.loft`: ten frustum stations, sections matching exactly at each joint so
the discretisation contributes no staircase of its own, chord tapering 1.2 m → 0.6 m over
a 5 m semi-span at 12 % thickness. Every clause holds.

The hip predicted failure: a wing's stations are the same size as each other, so an
overlap has nowhere to hide and must protrude. **The mechanism is right and the magnitude
is not.** The overlap protrudes — but its depth is itself `a·sin θ`, so what it leaves is

```
    seam without overlap    a·sin θ           first order in θ
    step with overlap       a·cos θ(1 − cos θ)    SECOND order in θ
```

and as a fraction of the local thickness that is `cos θ(1 − cos θ)/2` — **free of the
wing**: no chord, no span, no station count, no taper. Measured against the closed form at
every angle in the sweep:

| per joint | total over 10 stations | seam, no overlap | seam, overlap | step / thickness |
|---|---|---|---|---|
| 2° | 20° | 3.3 mm | **0** | 0.03 % |
| 6° | 60° | 8.9 mm | **0** | 0.27 % |
| 15° | 150° | 21 mm | **0** | 1.6 % |
| 30° | 300° | 40 mm | **0** | 5.8 % |
| 45° | 450° | 57 mm | **0** | 10.3 % |

A second step, an order smaller and from a different cause, is reported separately because
one combined number hid it: at 2° the total read seven times the thickness term. It comes
from the **taper**, not the bend — a stub carrying the joint's section is wider in chord
than the wing has become by the depth it reaches. It is ≤ 0.4 % of chord, and it is
*movable but not removable*: taper the stub instead and the same quantity reappears as a
hairline sliver at the leading and trailing edges.

**So `P7` is not falsified, and the answer is a bound rather than a yes.** A wing that
*flexes* spreads its bend over its stations, so the per-joint angle is small and the step
is invisible — a 60° total flex over ten stations leaves 0.27 % of thickness. A wing that
*folds* puts the whole angle through one joint, and a two-station fold measures **12.3 %
of thickness at 60°**: visible, and the case overlap does not serve.

- **`A-SKIN` stays a constructor rule.** No deforming skin, no second representation, so
  this plan stays the size it is and `hex_body`'s *"no skinning"* survives — as a statement
  about the rig, with the picture fixed by a derived overlap.
- **The governing variable is the per-joint angle alone.** Not the size, not `N`. That is
  what makes it a rule rather than a measurement of one wing.
- ⚠ **The wedge is governed by the THICKNESS, not the chord** — a wing bends across its
  thin dimension. The hip could not show this: a leg's section is square, so which
  half-extent drives the wedge never came up.

**Three instrument defects, all found by controls, all worth carrying to the next probe:**

1. **The overhang ray must follow the PARENT's axis** — not the child's, and not world up.
   At the hip all three coincide and the choice was invisible. At a 90° fold the child's
   axis is perpendicular to the parent, so the march left along the fold instead of into
   it and **reported a folded joint as sealed** — a zero in the worst row of the table.
2. **The overlap is a prismatic stub at the joint's own section, not a continuation of the
   taper.** Extrapolated, it is a hair narrower in chord than the face it must cover, so
   the child's face pokes through along the edges. The first run read that as *the overlap
   failing at every angle* when it had merely been built 0.2 mm too small.
3. **The interface face and the parent's end plane are exactly coincident at zero bend**,
   so an inclusive test on a rotated point is a coin flip — the first run reported a 1 mm
   seam on a straight wing. Sampling one micron inboard fixes it, and the θ = 0 row is the
   control that says so.

---

## Open

- **A team is not a tree.** Two horses abreast on one cart is two links into one body,
  which `A-TOPO` forbids. The likely answer is that the yoke is a body and each horse
  links to *it* — restoring the tree — but that is a claim, not a result.
- **Steep ground: refuse or tip?** `A-FIT` says refuse with a residual. Tipping is the
  physical answer and is dynamics this rung does not have.
- **Where the states are advanced.** `A-DOF` names them; something must integrate them,
  and that is the sandbox seam ([#15](https://github.com/jjstwerff/moros/issues/15)),
  not this plan.

---

## Where it lives

`hex_body` is the shared tree (`../loft-libs-world`), read from the working tree by
crawler too — **a new public name there can turn the sibling red with no local edit on
their side**, so none of this is added there on speculation. Build it in
`lib/moros_sim` against `hex_body`'s existing rig surface; move it up only when a second
consumer wants it. Crawler's `hexlink` is the obvious candidate and already solves the
harder linkage case.

---

## What would say this is right

- every body's DOF ledger closes at **exactly 6**, and today's unhitched cart reports
  **5** rather than passing;
- the wheel offset appears **once**, and the sentinel finds no second home;
- the axle length is measured from the **broadcast transforms**, invariant under bank,
  seen red under a deliberate stretch;
- every contact's gap is **zero within a skin** on a slope, seen red when the frame is
  pinned to a constant;
- the run that proves it **actually reached a slope** — on flat ground the rest passes
  trivially and proves nothing;
- a **rope never pushes**, and the taut/slack transition is reported rather than hidden;
- the steep case **refuses with a residual** rather than reporting success;
- **no joint shows a gap at any admissible value** — starting with the character's hip,
  which shows one today;
- and every state says whether it is **`DRIVEN` or `SOLVED`**, so a wing that cannot
  flutter and a crate that cannot swing are decisions on the page rather than
  discoveries in the frame.
