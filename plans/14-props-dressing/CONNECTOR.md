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

⚠ **And `DRIVEN` hides two cases that behave differently, which `P5` measured.** A
*commanded* angle cannot run away; an *integrated* one can, because its equilibrium may
be **unstable**. A trailer's yaw is the example: forward it converges, and the same state
under the same law diverges the moment the speed changes sign. No amount of exactness
helps there — an unstable equilibrium amplifies whatever it is given, including the last
bit of a perfect integrator. **Only a declared limit does**, which is why the jackknife
belongs in the ledger as a `K-FIT` doorstep rather than in the solver as a clamp.

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
| **`A-DOF`** | `dof(links) + dof(support) + dof(driven) + dof(solved) = 6`, per body | the invariant above. Every other rule here is a way of making one term of it honest. A state's kind — `DRIVEN` or `SOLVED` — is **declared**, never inferred from the link. ⚠ It counts **nominal** states; `P3` below measures a mechanism that satisfies the count and still loses a direction |
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
| **A0** ✅ | probe `P1`, `P3`, `P5`, `P6`, `P7` (`P4` is answered above) — **all run; none falsified** | the design before the code | — | M |
| **A1** ✅ | `Body`, `Link`, `Support` + admissibility + `write`/`read` | `A-TOPO`, `A-EXACT` | a forward parent; a relabelled tree; a truncated text — each **refused** | S |
| **A2** ✅ | **the DOF ledger** — `dof_account(assembly) -> (links, support, driven, solved)` | `A-DOF` | an assembly with pitch unaccounted (**today's cart**) must report `5`, not pass | S |
| **A3** ✅ | `MOUNT` composition — `body_frame(tree, i)` | `A-RIGID` | a `scale` term defaulting to 1; set it to 1.01 and the isometry test goes red | M |
| **A4** ✅ | embed a `hex_body` rig at a body | `A-PLANE` | the same scale knob applied to `ι` | S |
| **A5** ✅ | **the cart as data**, no behaviour change | that the structure expresses what exists | *the previous implementation*: transforms equal to the bit on flat ground | M |
| **A6** ✅ | `GROUND` support + the fixed point | `A-GROUND`, `A-FIT` | pin the frame to a constant → gap clause red (**already demonstrated**, 0.204 wu) | M |
| **A7** ✅ | `HITCH` + `SHAFT`, and a second body behind the first | `A-DOF` closing at 6 for both | unhitch the cart: the ledger must drop to 5 and the pitch become unsupported | L |
| **A8** ✅ | `TETHER` + `CARRIED`, and a crate under a balloon | `A-TAUT` | drive the crate past `L`; a rigid-rod implementation pushes the anchor **up**, which the sign test catches | L |
| **A9** ✅ | per-body shape and proxy | `A-PROXY` (`I4`) | a shape one size too small; containment must catch it | M |
| **A9b** ✅ | **joint overlap** — `A-SKIN` as a constructor rule, applied first to the character's hip | `A-SKIN` | sweep the joint's full range; a rendered gap at any value is red. The hip's current wedge is the standing negative control | M |
| **A9c** ✅ | a `SOLVED` state — the wing's bend from a load, on the `A6` solver shape | `A-DOF` with a `SOLVED` term | drive the load past the joint limits: it must refuse with a residual, not fold through itself | L |
| **A10** ✅ | the editor switches over; `cart.mjs` loses its axle clause and its `1.1` | the whole thing, in a running world | the stretch mutation (**already demonstrated**) | M |

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
| ~~P1~~ | ~~`rig_world_seg` is enough to place a part for rendering~~ | — | **run below: the rig alone is not, and rig + node frame is — no third source** |
| ~~P3~~ | ~~a 3-DOF joint is three `MOUNT`s in series~~ | — | **run below: confirmed for REACH, refuted for RANK** |
| ~~P5~~ | ~~a towed chain stays stable~~ | — | **run below: not falsified — every divergence is one the geometry predicts** |
| ~~P6~~ | ~~N bones approximate a continuous bend to a stated bound~~ | — | **run below: not falsified — the error is a closed form, and one half-step decides its order** |
| **P7** | **a joint can be skinned by overlap alone** | for the character's hip, extend the pelvis by the maximum wedge and sweep the full swing range looking for background through the joint; then repeat for a 10-station wing | overlap cannot close a wing's joints without visible bulging — then the wing needs real skinning and `hex_body`'s *"no skinning"* is true only of the rig |
| ~~P4~~ | ~~`bone_obb` proxies a wheel~~ | — | **falsified analytically above** |

**`P3` was required, not deferrable, and is now answered below.** It was parked because
nothing here had an articulated limb; a robot arm is one. **`P7` was the one that decided
how big this design is** — if overlap suffices, the rig stays rigid everywhere and `A-SKIN` is a
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

### `P3` — RUN. Confirmed for REACH, refuted for RANK

`probe/three_mounts.loft`, pure and serverless. Targets are built by **Rodrigues over a
lattice of axes and angles**, not as `Rz·Ry·Rx` — a target built from Euler angles and
decomposed back tests `atan2` against itself and proves nothing.

The falsifier — *"composing planar rigs through single-axis mounts diverges from the 3D
rotation"* — hides two separable claims, and **they have different answers**:

| | claim | measured |
|---|---|---|
| **REACH** | three single-axis mounts produce an arbitrary orientation | **holds.** Worst `\|R_target − R_chain\|` over 756 targets is `6.2 × 10⁻¹⁵` — **28 machine epsilons**, the drift bound the design asked for rather than an algebraic zero |
| **`A-RIGID`** | the child's planar rig is not stretched through the chain | **holds.** Worst separation error `4.4 × 10⁻¹⁶` = 2 ε |
| **RANK** | it can *move* in three directions from wherever it is | **fails on a set.** `\|det[a₁ a₂ a₃]\| = \|cos β\|` exactly, so at `β = ±90°` the ledger counts **three** states and the joint delivers **two** |

**The consequence is not "use quaternions", it is a scoping line that the design already
has an axis for.** States are `DRIVEN` or `SOLVED`. Forward, angles → pose, the rank never
enters: a commanded shoulder is fine everywhere, and `A-DOF`'s own row for the arm says
*joint angle 1, commanded*. It is `SOLVED` — an IK reach, a bend solved from a load — that
inverts the axis matrix, and that is exactly what `cos β → 0` makes singular. So:

> **Three zero-offset `MOUNT`s are sufficient for a `DRIVEN` 3-DOF joint, and are
> singular on a set for a `SOLVED` one.** `A-DOF` counts nominal states; passing it is not
> the same as having three usable directions.

Three more results, each from a control that had to fail first:

- ⚠ **The singular branch is load-bearing for AUTHORED poses and does nothing for composed
  ones**, and the first version of this probe could not tell — its control passed, which is
  how the distinction surfaced. Composing `Rz·Ry(π/2)·Rx` leaves ~`1.6 × 10⁻¹⁵` in `cos β`,
  and `atan2(cβ·sin γ, cβ·cos γ)` divides that residue straight out, returning `γ` to the
  last bit. A pose that arrives as a **matrix** — read from text, which is exactly what
  `A-EXACT` says an assembly does — carries literal zeros, `atan2(0, 0)` is `0`, and the
  naive decomposition misses by **2.0**. The normal case for this design is the one that
  breaks.
- **`zero-offset` is doing real work in the claim.** With 0.25 wu offsets the joint centre
  wanders **0.5 wu** as the three angles move; at zero it is fixed exactly. An offset chain
  is a *linkage*, not a joint.
- **The reach measure can fail**, checked by sweeping deficient chains over their *whole*
  reachable set rather than feeding them the three-axis answer: one axis used three times
  misses by 0.96, and two mounts miss by the same 0.96 — both because they force `a₃₂ = 0`,
  so the target's own `a₃₂` is the floor. Same number, one cause, and stated so it does not
  read later as a copy-paste.

---

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

### `P5` — RUN. Not falsified, and it adds a doorstep

`probe/towed_chain.loft`, pure and serverless: a horse, a cart, and a cart behind that,
on standard on-axle N-trailer kinematics. The yaw rate is not a chosen law — it is the
non-holonomic condition (*the wheels do not slide sideways*) solved for `θ̇`.

**The falsifier is not "does it diverge".** Reversing a two-trailer rig really is
unstable; that is a fact about trailers, not a defect in a model of them. The words that
matter are *"without the geometry saying it should"*, so **every divergence here is
measured against a closed form** and the claim is that the two agree.

**Forward, a steady turn settles exactly where the geometry says** — worst departure
`5.9 × 10⁻⁹` over five radii, against

```
    sin φ₁ = L₁/R        sin φ₂ = L₂/(R·cos φ₁)
    R₁ = √(R² − L₁²)     R₂ = √(R² − L₁² − L₂²)      the trailers cut the corner
```

Three results follow, and two of them are new to the design:

- **A new doorstep: `R ≥ √(Σ Lᵢ²)`.** `sin φ₂ = L₂/(R·cos φ₁)` has **no solution** below
  it, so there is no steady state and the chain jackknifes on a turn it cannot hold.
  Measured with `L₁ = 1.6`, `L₂ = 1.2` — a minimum of exactly `2.0` — and the sweep
  settles at 2.40, 2.10, 2.02 and does not at 1.98, 1.90, 1.70. ⚠ **The SECOND cart sets
  it**: cart 1 alone would manage down to `R = L₁ = 1.6`. A chain's minimum radius is the
  Euclidean norm of the drawbar lengths, not the longest one.
- **The solve goes marginal exactly where the doorstep bites**, which is the same shape
  the cart's bank solve already has (*"converges while `tan β < 1/L`, and that degrades
  exactly where the `|d| ≤ 2w` doorstep bites"*). Settling rate `9.4 × 10⁻¹²` at `R = 2.40`,
  `1.5 × 10⁻⁷` at `2.10`, `7.2 × 10⁻⁵` at `2.02` — because `φ₂ → 90°` and the fixed point's
  own rate carries a `cos φ₂`. **Two independent solves in this design share that
  structure**, so solver and refusal fail together rather than one failing quietly first.
- **The reversal diverges at exactly the predicted rate.** Linearised, `φ̇ = −v·φ/L`:
  forward that decays, reversing it grows, and the sign is the whole physics. Measured
  `0.6249999999983603` against `0.625`, and **halving the step moves it by 1.1 × 10⁻¹⁴** —
  which is what says the jackknife is the geometry and not the integrator. That is the
  falsifier answered in its own terms.

⚠ **The chain AMPLIFIES, and my prediction of that was wrong.** The downstream hitch was
predicted to grow at its own eigenvalue `|v|/L₂ = 0.833`. It grows at **1.286** — faster
than *both* modes — because `φ₂` starts at zero and is **driven** by the hitch ahead, so
the linearised pair solves to a difference of two exponentials:

```
    φ₂(t) = a·φ₁(0)·(e^{−at} − e^{−bt}) / (b − a)        a = v/L₁,  b = v/L₂
```

Against that, the measurement agrees to `1.4 × 10⁻¹¹`. **The transient cannot be waited
out**: the modes separate as `e^{(b−a)t}` while `φ₂` leaves the linear regime far sooner,
so the honest move is to predict the transient rather than measure past it. The
consequence for the design is concrete — *"the shortest link folds first"* understates it,
and **the last cart folds sooner than its own link length predicts**.

**And the con-rod, for a towed chain.** Deriving cart 1's axle from the yaw state makes
`A-RIGID` true by construction; integrating its pose separately — *storing a transform* —
walks it off the drawbar by `8.4 × 10⁻¹²` over a 60 s turn, and that grows. Small, and
the point is that it is not zero: *"nothing stores a transform"* is buying exactness, not
tidiness.

---

### `P6` — RUN. Not falsified, and the root hinge is worth an order

`probe/bend_bones.loft`: a cantilever under uniform load cut into `N` rigid bones with a
torsional hinge at each node, each hinge turning by `φⱼ = M(xⱼ)·ℓⱼ/EI`. The reference is
the continuum `δ = wL⁴/(8EI)`, independent of everything in the model.

**The whole probe turns on `ℓⱼ`, and the answer is sharper than expected.** An interior
hinge stands for a half-bone on each side, so `ℓ = h`. **The root hinge has no bone
inboard of it**, so it stands for a half-bone and `ℓ = h/2` — and giving it a full `h` is
the obvious thing to do. Measured against closed forms derived by hand and agreeing to
`2 × 10⁻¹²`:

```
    root hinge ℓ = h      tip/δ = (1 + 1/N)²     relative error  2/N + 1/N²    FIRST order
    root hinge ℓ = h/2    tip/δ = 1 + 1/N²       relative error      1/N²      SECOND order
```

Observed orders 1.011 and 2.000. **One half-step at the clamped end is the whole
difference**, and nothing else about the scheme changes.

**What that costs at the ten stations `P7`'s wing probe used:**

| | tip error at `N = 10` | `N` needed for 1 % |
|---|---|---|
| root hinge `ℓ = h` | **21.0 %** | 201 |
| root hinge `ℓ = h/2` | **1.0 %** | 10 |

So the falsifier's second clause is answered in the right direction, **but only for one of
the two schemes**: ten bones is a 1 % wing with the corrected root and a 21 % wing without.
*"More bones on more joints"* is the right representation; the naive discretisation of it
is not, and the difference is invisible without a reference to measure against.

Two more results:

- **The order survives the geometric nonlinearity.** With deformed moment arms at a load
  whose linear tip deflection would be a full span — a **35.9 % shortening**, far outside
  the linear regime — the observed order stays 1.98 → 2.07. ⚠ That is **self-convergence**,
  stated as such: there is no closed form for a uniformly loaded elastica, so it can show
  the order survives and cannot show the answer is right. Case A is where accuracy was
  established, and it is why case A runs at a tip deflection of `10⁻⁶` of the span.
- ⚠ **The `SOLVED` fixed point is only LINEARLY convergent here**, and the ground contact's
  is quadratic (`Φ′(0) = 0`). It took **78–104 passes** to reach `10⁻¹²`, near enough
  independent of `N` — a contraction of rate ≈ 0.71 set by how strongly the shortening
  feeds back, not by the mesh. The design's claim that a `SOLVED` state *"reuses the
  machinery rather than adding any"* holds for the SHAPE of the solve and not for its cost:
  ~80 rounds a tick is not free, and `A9c` should budget for it or damp it.

⚠ **The first run of this probe was measured wrong, in a way worth keeping.** `wL⁴/8EI` is
the *small-deflection* solution while the chain walks its nodes with real `sin`, so running
case A at a tip deflection equal to the span measured the geometric nonlinearity and
called it discretisation error — it reported a scheme converging to 0.789 and the
derivation wrong. **A closed form is only a reference inside the regime it was derived
for.** (The same run also reported 200 passes for a solve that settled in two: assigning
the loop bound to a `for` variable does not break the loop.)

---

### `P1` — RUN. The rig alone is not enough, the pair is, and there is no third source

Two halves, because this is the one probe that needs a running world:
`probe/rig_place.loft` (pure — what a segment carries) and `probe/rig_place.mjs`
(the wire — whether the composition reproduces the cart's broadcast matrices).

**What the segment carries.** `rig_world_seg` returns four floats of which the length is
fixed by `rg_len`, so **three**: a base point and one in-plane direction.

- **The spin IS in it, which is the opposite of the intuitive answer.** Rotating a disc
  about its own axle leaves the disc where it was — but `hex_body` does not model a wheel
  as a disc, it models it as a **spoke**, and a spoke's direction *is* the spin. Recovered
  from the segment to `2.9 × 10⁻¹⁵` across a travel sweep, with the segment moving 2.97 rad
  between samples so the recovery is not reading a constant.
- **Joint values are in TURNS and `wheel_value` returns turns**, so the rig's joint value
  *is* the wheel's state with no conversion between them.
- **The WINDING is not in it, and rendering does not want it.** A joint value and the same
  value plus `k` whole turns give segments identical to `1.2 × 10⁻¹⁵` while `wheel_angle`
  differs by `k·τ`. So the picture loses nothing — and **anything counting total
  revolutions (odometry, wear, a gear ratio) must read the state, not the pose.**
- **One bone is exactly 1 DOF** and its base never moves over a full sweep, so the other
  five of a render transform are the node frame's. `A-PLANE` already says that, so the
  literal claim — *`rig_world_seg` is enough* — is **false and was never what the design
  asserted**. The real question is whether there is a THIRD source.

**There is not.** Against the wire, on a slope, with a spun wheel:

| | measured |
|---|---|
| `T_wheel = T_body · translate(0,0,±w) · rotZ(spin)` vs the broadcast matrix | **`5.6 × 10⁻¹⁷`** — one machine epsilon |
| drop the mount offset | off by **exactly `w` = 0.55** |
| drop the spin | off by **1.99** |
| drop the node frame's out-of-plane rotation | off by **0.083**, the bank itself |

`w` is measured once on flat ground and then used to predict the **sloped** case — reading
it from the sloped frames would be the same circularity as the axle clause that computed
`2·half·√(cos²+sin²)` and could not fail. The run is guarded on having reached a bank
(0.083) *and* a spin away from a whole turn (3.03 rad), because on flat ground with a still
wheel all four rows pass for free.

⚠ **AMENDED BY `A3`: this did NOT pin the composition ORDER.** The cart's axle offset is
`(0, 0, ±half)` and its spin axis is `(0, 0, 1)` — the offset lies **along** the axis, and a
rotation about z cannot move a point on z. So `T · R` and `R · T` give *bit-identical*
frames for a wheel, and the `5.6 × 10⁻¹⁷` agreement above is silent about which the server
used. Measured: **0.0000 for the cart, 1.095 for a wing station**, whose offset is
perpendicular to its axis. The order is unobservable exactly when the offset is parallel to
the axis — which is true of every hub, kingpin and wheel, i.e. of **every case this design
started from**. Both cases are now clauses in `A3`.

⚠ **And the instrument was wrong in a way the design's own checklist predicts.** The
convention check `T_body = translate · rotY(yaw) · rotX(bank)` read **exactly 0 on the
first run while `rotX` was transposed** — because that run was on FLAT ground, where the
bank rotation is the identity and its sign cannot matter. *"The run that proves it actually
reached a slope — on flat ground the rest passes trivially and proves nothing"* is already
in *What would say this is right*; this is its second instance, and this time it caught a
live defect rather than a void clause. Two smaller ones from the same probe: the
mount-offset control compared an elementwise matrix max against a length (0.5481 against
0.55 — the offset lies along the node frame's z, so its largest single component is
`w·|z|`), and the spin guard took a `min` where every measurement it guards is a `max`.

---

### `A1` — BUILT. `lib/moros_sim/src/assembly.loft`, 20 tests, seen red twice

`Assembly` is a tree over **bodies** with the link as the edge: body `i` carries the link
from `parent(i)` to itself, so there is exactly one link per non-root body and `A-TOPO`'s
`p(0) = −1, 0 ≤ p(i) < i` is the whole of the topology. It mirrors `hex_body::Rig`
deliberately — canonical labelling by index order, a strict parser, a byte-exact round
trip, and the same refusal contract: **a malformed text reads back as an EMPTY assembly**,
which `asm_admissible` then rejects. A lenient reader would void the byte diff.

**What the type system now catches, which prose could not.** Each of these is a clause with
a test that must fail:

| refused | because |
|---|---|
| a forward parent, and a relabelling that breaks the order | `A-TOPO` — index order *is* the canonical labelling |
| a header count that disagrees with the lines | a truncated text fails before a field is read |
| a body index out of line order, a misspelt keyword, an unknown kind | the parser accepts exactly what the writer emits |
| a `Mount` with a zero axis | `P3` showed the axis decides whether a chain spans SO(3); a zero axis names none |
| a `Tether` of length 0 | `A-TAUT` — the length is the *bound*, so there must be one |
| a link on the root, or `Carried` on the root | *the link IS the support*, and the root has none |
| a name with a space in it | it would produce a text this reader could not take back |

⚠ **`Carried` on the root is the type error the design predicted.** *"Run it on the balloon
case and `GROUND` support does not apply, which is a **type error** rather than a debugging
session six steps later."* It is one now, and it cost one line.

**Two fixtures rather than one, and the second is the one that matters.** `asm_cart` is the
assembly the editor draws. `asm_towed` is a horse with a cart behind it — and the cart's
support is **`Ground`, not `Carried`**, because it has its own wheels, so the hitch couples
two frames instead of parenting one to the other. That is the case the design's first draft
got wrong, and it is now a fixture rather than a paragraph. It is also the first two-level
tree, so it is the first case where topological order has anything to order.

**Seen red, twice, on the clauses that should catch it:**

- stop refusing a forward parent → `test_forward_parent_is_refused` and
  `test_relabelled_tree_is_refused` both fail
- make the reader ignore the header count → `test_truncated_text_is_refused` and
  `test_reader_refuses_a_relabelled_text` both fail

**523 tests green** across the five packages, all 52 functions in the package entered.

Two decisions worth recording:

- **`FREE_LO`/`FREE_HI` are ±1000 turns, and `link_mount`'s limits default to them.** A
  mount with no authored range must be *free*, not a joint pinned at zero — and a finite
  bound is still something a `K-FIT` doorstep can report a residual against, which an
  unbounded sentinel could not.
- ⚠ **No wheel radius in `asm_cart`.** It is real data about a wheel, but it is a *shape*,
  and shapes arrive at `A9`. Carrying it now would be a home for a number with no reader —
  the exact defect *What this costs, in re-assertion sites* exists to remove.

---

### `A2` — BUILT. The ledger reproduces every row of its own table

`lib/moros_sim/src/assembly.loft`, 15 tests, **seen red under three mutations**. It is
three lines of arithmetic plus a bound:

```
    dof_link:     none 0 · mount/shaft/spring 5 · hitch 3 · tether 1 (taut)
    dof_support:  unsupported/carried 0 · buoyant 1 · ground min(contacts, 3)
    total = links + support + driven + solved        residual = 6 − total
```

**`GROUND_MAX = 3` is the whole of the interesting part.** Contacts constrain height and
two rotations and no more, so on a rigid body a fourth contact is redundant with the first
three — and that single bound is what turns the design's hand-written prose into
arithmetic:

| the table's row | counted | the design said |
|---|---|---|
| wheel on a chassis | 5 + 0 + 1 = 6 | closes |
| two-wheel cart, hitched | 3 + 2 + 1 = 6 | closes |
| **towed 4-wheel trailer** | 3 + 3 + 1 = 7 | *"the 4th wheel is over-constrained"* — **over by exactly 1** |
| crate under a balloon | 1 + 0 + 5 = 6 | closes |
| balloon | 0 + 1 + 5 = 6 | closes |
| robot arm segment | 5 + 0 + 1 = 6 | closes |
| wing station | 5 + 0 + 0 + 1 = 6 | closes |
| **today's cart, unhitched** | 0 + 2 + 3 = **5** | *"the sixth is pitch, supplied by nothing"* |

Every row, from one rule. **The control the design asked for holds**: today's cart reports
5 with a residual of 1, and the failure is *specific* — its two wheels close, so what is
under-determined is the chassis's pitch and nothing else.

Results worth carrying:

- **The hitch is measurably what completes the cart.** The same chassis reports 5 loose and
  6 hitched; the hitch supplied exactly 3, and 2 of the chassis's own states became the
  horse's business. That is the design's sentence — *"either something supplies the pitch,
  or the cart falls over"* — as a subtraction.
- **A slack tether's ledger closes exactly when the taut one does.** Taut it removes 1;
  slack it removes nothing and the released degree becomes a state, so the total is
  unchanged. **One declaration covers both**, which is why `A-TAUT`'s transition can be a
  reported doorstep rather than a second description. Tested both ways, and on a body with
  no tether the two ledgers are the same object.
- **Rigid shafts on the ground are over-constrained by two**, which is true rather than a
  bug: a real cart in rigid shafts on uneven ground has compliance somewhere. The ledger
  says where to put a `SPRING`.
- ⚠ **`bd_contacts` was added by `A2`, not foreseen by `A1`.** `A-DOF` makes GROUND's term
  a function of the contact count, so without it the ledger could not be a pure function of
  the description. Nothing had been written to disk yet, so the format grew for free —
  **after `A5` it would have been a version bump**, which is an argument for keeping A2
  ahead of the geometry beyond the one the design already gives.
- ⚠ **It counts NOMINAL degrees.** `P3` measured a mechanism that satisfies this count and
  still loses a direction at a gimbal pose, so a closed ledger is **necessary and not
  sufficient**. Rank is geometry; geometry starts at `A3`.

**Seen red on the clauses that should catch it:** `GROUND_MAX = 4` breaks the trailer's
"over by exactly one" and the saturation test; a support giving one degree too many breaks
the cart's 5; a hitch that removes 5 breaks the towed cart and the hitch subtraction.
**538 tests green** across the five packages, all 65 functions in the package entered.

---

### `A3` — BUILT. `lib/moros_sim/src/frames.loft`, 14 tests, seen red three ways

`asm_frames(a, values, root, scale = 1.0)` walks the tree once and composes

```
    Wᵢ = W_{p(i)} · translate(offsetᵢ) · rot(axisᵢ, τ · valueᵢ)
```

which is exactly the composition `P1` measured against the wire. **`A-TOPO`'s order is what
makes one pass enough** — a parent's index is always lower, so it is always already done.

**`A-RIGID` holds by construction, and the test records the drift rather than claiming a
zero.** Over 12 value sets × 8 off-axis point pairs × 11 frames, ten levels of composition
deep, the worst departure is at the float bound — and the test asserts it is **non-zero**
too, because an algebraic zero would mean the measurement was not running. Orthonormality
and `det = +1` are measured at every frame rather than inferred from the induction.

**The deliberate defect works as specified.** `scale` is a *parameter*, not a stored field,
so no defect knob rides in the document format. At 1 the frame is an isometry; at 1.01 the
separation grows by about one per cent per level, the linear part stops being orthonormal,
and a ten-level chain reaches measurably further. `hex_body`'s `slip` is the model.

⚠ **The finding that amends `P1`: a parallel offset hides the composition order.** A
wheel's offset lies along its spin axis, so `T · R` and `R · T` are bit-identical there —
`P1`'s agreement with the wire never distinguished them. A wing station's offset is
perpendicular, and there the wrong order lands the joint 1.1 wu away. **Both are clauses
now**: one asserting the cart *cannot* see it, one asserting the wing can. An honest
negative beside the positive, because the blindness is the more useful half.

Three more decisions:

- **The axis is normalised at the one place it is used.** `A1` requires it non-degenerate,
  not unit, so a caller may write `(0, 0, 2)` and mean *about z*. Removing the normalisation
  breaks the axis-magnitude clause **and** the root-move clause — a non-unit axis is not a
  rotation at all.
- **Joint values are in TURNS**, and `TURN` is a second home for a number `hex_body` owns —
  so a test asserts `TURN == hb::wheel_angle(1.0)`. **A checked alias is not a copy.** That
  also gave `A3` its cleanest clause: a value of 1 must put every frame back exactly where 0
  did, which is `P1`'s winding result from the other side.
- **`asm_frames` refuses rather than guesses.** A `HITCH` does not determine its child's
  frame — the child keeps its own support, which is what the design's first draft got wrong
  and `P5` measured — so a non-`MOUNT` chain returns an empty vector, the same contract
  `asm_read` uses. It also refuses anything `A1` calls inadmissible.

**Seen red:** dropping the axis normalisation (2 clauses), treating values as radians
(1 clause), and reversing the composition order (1 clause — the perpendicular one).
**552 tests green**, all 83 functions in the package entered.

---

### `A4` — BUILT. `A-PLANE`, and it needed a second knob

Added to `lib/moros_sim/src/frames.loft`, 10 tests in `tests/embed.loft`.
`embed(f, x, y) = frame_apply(f, (x, y, 0))` is `ι`, and `rig_seg_at` poses one bone of a
`hex_body` rig and places it at a body's frame.

⚠ **`A-PLANE` is TWO claims, and the design's knob can only fail one of them.**

| claim | control | what it does |
|---|---|---|
| `ι` is an **isometry** | `iota` — scales the plane | breaks distance, **leaves the image planar** |
| the image is the node frame's **`z = 0` plane** | `warp` — tilts z with x | breaks planarity |

So there are two knobs. The design named the scale; the warp is here because *a claim with
no control is not a checked claim*, and the scale provably cannot fail the plane clause —
the test asserts that it doesn't, which is what makes the second knob's existence a measured
need rather than a preference.

What holds, over an awkward frame (translated and rotated, so nothing passes because the
rotation was trivial — `P1`'s flat-ground lesson applied up front):

- **`ι` preserves distance** to the float bound, over 81 point pairs.
- **A bone's length is `rg_len[i]` at every joint value** — `hex_body`'s `I6` carried into
  3D with no way to deform added. Checked on a spoke and on a two-bone arm, so the rig's own
  forward kinematics is in play and not only the embedding.
- **Planarity survives `A3`'s composition** without the embedding re-establishing it,
  because a plane maps to a plane under `SE(3)`. Measured at station ten of a wing.
- **A spoke gives back its spin.** `seg_plane_angle` recovers the joint value from the
  embedded segment's in-plane direction, agreeing with `wheel_angle` to the float bound —
  `P1`'s counter-intuitive result (*a wheel is a spoke, not a disc*) as a **function** rather
  than a wire measurement. And whole turns move the segment by nothing while the state
  counts them, which is the other half of it.
- **The cart's wheel, rebuilt with no server.** `asm_frames` + `rig_seg_at`: the hub is the
  wheel body's own origin, the rim is `RADIUS` away at every joint value from any root, and
  the spoke never leaves the wheel's plane. That is `P1`'s wire measurement re-derived from
  the library, which is what `A5` will need.

**Seen red three ways**, and the pattern of *which* clauses fail is itself the evidence the
two claims are separate: embedding into the `y = 0` plane instead of `z = 0` breaks
planarity, the spin recovery and the cart wheel (5 clauses); reading the plane normal from
the wrong column breaks only the plane clauses (4); leaving `iota` defaulted to 1.01 breaks
only the direct-`embed` isometry clause — because `rig_seg_at` threads its own default
rather than re-defaulting, which is worth knowing.

⚠ **A4 does NOT store rigs in the document, deliberately.** A rig is multi-line text
(`rig_write`), so putting one on a body's line is impossible and the format needs a
**section** — the same decision the world file already took (*tagged sections, not a flags
word*). That is `A5`'s, where the cart becomes data and a rig has to survive the round trip.

**562 tests green**, all 89 functions in the package entered.

---

### `A5` — BUILT. The cart is data, and three things came out of it

`tests/cart_as_data.loft` (8 clauses) plus the rig section in the format.
**217 tests green**, all 93 functions in the package entered.

**The diff.** `cart_send`'s composition is transcribed here and the data-driven path
reproduces it **to the bit** — flat ground and banked, all twelve numbers of every frame,
with no tolerance. ⚠ **Bit-identity against mesh3d's `Mat4` arithmetic is not claimed** and
could not honestly be: a generic 4×4 multiply sums in a different order from
`a.t + (p₁ + p₂ + p₃)` and float addition is not associative. `P1`'s wire measurement
(`5.6 × 10⁻¹⁷`) is the cross-*implementation* evidence; this is the cross-*structure* half —
that the **data** produces that composition. Four clauses vary one number in the assembly
(`half`, the axis, the radius) and require the frames to follow, so a composition carrying
its own literals could not pass.

**The radius arrived, and as a rig.** `A1` left it out because it had no reader; `A4` gave
it one. A wheel is a **spoke of length `radius`** — that is how `hex_body` models one and why
`P1` found the spin in the segment — so the radius is `rg_len[0]`, has exactly one home, and
`A9`'s shape will be *derived* from it rather than told. Both wheels share one rig: the
library is indexed, so a description used twice is stored once.

⚠ **mesh3d's `rotate_x`/`_y` turn the opposite way from the editor's own `rotate_z`.** From
`graphics/src/math.loft`: `rotate_x` is `[[1,0,0],[0,c,s],[0,−s,c]]`, which is Rodrigues
about **−x**; `rotate_y` likewise about **−y**. The editor wrote its own `rotate_z` — mesh3d
ships none — in the *standard* sense. So one `Ry·Rx·Rz` chain turns two ways.
**The wheel path is unaffected** (a spin is about `+z` in both), and the bank and yaw are
`A6`'s — this is written down so `A6` does not rediscover it. A test pins it, and that test
is the *only* thing guarding it: the bank enters through the root, so it cancels in the diff.

⚠ **`hex_body`'s `rig_read` is lenient where its own comment claims to be strict** — a bone
line missing its trailing `hi` parses, with the absent field read as 0, so a **repaired** rig
comes back looking valid. Rather than change a library two consumers read, `A-EXACT` is
enforced **at the seam**: each rig block must `rig_write` back to itself byte-for-byte.
Whatever leniency the sub-parser has cannot smuggle a repaired rig through.

**Two things the work turned up that are worth more than the step:**

- **A mutation did not go red, and that found an unchecked clause.** Relaxing the reader's
  *"the whole text is consumed"* to *"enough of it is there"* left all 216 tests green —
  nothing tested a **trailing** line. Added, and it now catches that mutation.
  *Green said the tests passed; it did not say they would notice.*
- **The interpreter SIGSEGV'd**, filed as
  [loft#677](https://github.com/loft-lang/loft/issues/677). Appending to a struct's vectors
  through **two** by-value levels with the return **discarded** crashes the dispatcher — and
  the reported line is a plain comparison *after* the loop, so the location misleads. Four
  progressively closer minimal cases did **not** reproduce it, which is in the issue because
  it narrows where to look. `wa:clean`, and the workaround is better code: **the parsers are
  pure now**, returning parsed pieces that one place appends. It is the second time this
  idiom has bitten Moros — #670 was the silent-write half of the same family.

---

### `A6` — BUILT, and starting it found a live defect

`lib/moros_sim/src/ground.loft`, 11 tests. **583 green** across the five packages, all 98
functions in the package entered. **The terrain arrives as a function argument**, not a
world — so every clause is a pure function whose answer is known in closed form, and the
file never mentions `moros_map`.

**The closed form checks out exactly.** On a linear slope `s` the fixed point satisfies
`sin β = −s·cos β`, so `β = −atan(s)` and `y = g(centre) + R` — both to the float bound, at
`s = 0.15` and `s = 0.60`. Curved ground (a ridge, a sinusoid) lands both wheels too.

⚠ **THE DEFECT THIS STEP FOUND, before a line of it was written.** The design's control is
*"pin the frame to a constant → gap clause red (already demonstrated, 0.204 wu)"*. Checking
what the editor's gap clause actually measured turned up this, off the wire:

| | |
|---|---|
| `wheelL_is_at_sampleL` | **0** — the pairing is exact, so this is not a labelling mix-up |
| terrain under the two wheels | 0.15865 / 0.25 |
| **TRUE gap, left wheel** | **+0.09135** — floating |
| **TRUE gap, right wheel** | **−0.09135** — buried |
| reported `gapl` / `gapr` | −1.5 × 10⁻⁸ / 0 |

On every slope since rung 10a, one wheel hovered 9 cm and the other sank 9 cm, and the gate
was green. The cause is the convention `A5` uncovered: mesh3d's `mat4_rotate_x` turns about
**−x**, so the bank the solve produced was applied inverted. **Neither existing clause could
see it** — the gaps were the solve's own arithmetic (zero by construction whatever the
transform then does), and the axle is a *length*, which tilting an axle the wrong way does
not change. Fixed in `5ffdf2c`: the sign converted at the one site where the conventions
meet, and the lift now **read from `base.m[9]`** instead of re-derived. Controls on fresh
servers: reverting the sign alone now turns the **gap** clause red as well
(`grounded: false`, `worstGap 0.0914`), where the original code reported `grounded: true`.

**So `A-GROUND` is measured from the FRAME here, and that is the structural fix.**
`ground_gap` puts the hub through `frame_apply` and samples the terrain at the hub's own
`x, z` — no re-derived lift, no recomputed span. A wrong pose cannot report a right gap.
Mutation 2 below is the evidence: swapping it back to a re-derived lift breaks **five**
clauses, including *"a millimetre of hover reads as a millimetre in both gaps"*.

**`A-FIT` refuses rather than clamps.** `sin β = d/2w` has no solution when the ground drops
more across the axle than the axle is long, and the design notes this fires in normal use —
the raise brush documents 74–83° flanks against a 1.1 wu axle. A cliff comes back with a
**named reason**, an **offer** (the nearest admissible drop, ±2w) and a **residual** (1.9 wu
of overshoot on a 3 wu step), and it **keeps the last admissible bank rather than emitting a
NaN**, because the ground is what has to give.

⚠ **And the convergence clause guessed, and was wrong.** The design predicts `Φ′(0) = 0` and
a rate of `≈ s²` at the fixed point. The first version of the test asserted a *magnitude* —
"residual under 1e-6 after three rounds" — which was a guess, not the prediction, and it
failed. Rewritten to assert the **ratio**: each round shrinks the step by about `s²`,
checked over four round counts. *A prediction can be tested; a threshold can only be
tuned.*

**Seen red three ways:** inverting the solved bank breaks 6 clauses; re-deriving the gap
breaks 5; clamping the steep case instead of refusing breaks 2.

---

### `A7` — BUILT. The first second frame, and the ledger told it how

`ground.loft` gains the hitched solve; 12 tests in `tests/hitch.loft`. **595 green** across
the five packages, all 104 functions in the package entered.

**The ledger dictated the geometry, which is the strongest thing that happened here.**
`A-DOF`'s row reads `hitch removes 3 (position) · contacts give 2 · yaw 1`. Read literally
that says the child's *position* is entirely the pin's business and its **two remaining
rotations are what its contacts supply** — so the solve is a two-unknown fixed point about a
fixed pin, not a parented frame and not a copy of `A6`:

```
    sin θ = (P_y − h) / L        h = (g_L + g_R)/2 + R      pitch, about the pin
    sin φ = d / (2w·cos θ)      d = g_L − g_R               roll, across the axle
```

That is the design's *"if the structure holds for both without a special case, `A-DOF` was
the right invariant"* coming out in favour: the counting rule was written before any of this
geometry existed, and it named the unknowns.

**`A-HITCH` holds by construction, not by check.** The hitched frame's ORIGIN is the pin, so
the pin computed from the parent and from the child is the same point — measured at the float
bound over eight yaws anyway, because a coupling that merely *looks* right still moves
convincingly.

**Both bodies touch the ground at once**, which is what "two frames" means: the horse's
contacts and the cart's own two wheels are all down, on terrain sloping in **both** axes, and
the cart pitches to a height its own pin does not share. A chain works too — a cart behind a
cart, three frames, no special case.

⚠ **A `cos(pitch)` factor nearly shipped, and single-axis terrain was why.** A wheel centre
sits at `y = P_y − L·sin θ − side·w·sin φ·cos θ`, so the height difference across the axle
carries a `cos θ` and the two closed forms are **coupled** through it. Without it the solve
converged on terrain sloping along one axis and failed on terrain sloping along two — and the
single-axis clauses passed, so only the doubly-sloped fixtures caught it. *An axis-aligned
fixture cannot see a cross-axis error*, which is the same shape as the flat-wheel bug and the
flat-ground convention check.

**A second doorstep the mounted case does not have.** The pin can sit further above the
ground than the drawbar is long, and then no pitch reaches down to it — a named refusal with
an offer and a residual, beside the axle's own. `A-FIT` twice over, from one body.

**And the `SHAFT` case is over-constrained in the geometry exactly as `A2` counted it.**
Inheriting the horse's pitch and roll leaves the cart's own wheels off the ground on a
cross-slope; solving it its own way puts them down. So the ledger's *"over by two — refuse,
or absorb it in a `SPRING`"* is not bookkeeping, it is a measurement of where the compliance
has to go.

The design's own control holds: unhitching drops the ledger from 6 to 5 with a residual of 1,
and the hitch is what supplied the missing three.

**Seen red three ways:** dropping the `cos(pitch)` coupling breaks 4 clauses, deriving the
axle from a literal instead of the mounted children breaks 1, and putting the hitched frame's
origin at the axle instead of the pin breaks 6.

---

### `A8` — BUILT. A rope never pushes, and the sign is what says so

`lib/moros_sim/src/tether.loft`, 12 tests. **607 green** across the five packages, all 109
functions in the package entered.

**The design's control is the whole point, so the sign is a returned value.** `rp_pull` is
the correction's radial component against the outward radial: **≤ 0 for a rope, always**, and
`> 0` the moment a rod holds the crate from the inside. That is *"only the SIGN of the
constraint tells you"* made into a number rather than left as a remark.

- **A rope acts only outward-inward.** Over a sweep from well inside the ball to well outside
  it, `rp_pull ≤ 0` throughout and `‖p − a‖ ≤ L` never breaks.
- **A rod pushes, and by exactly how far inside the crate was.** With the crate 1 wu inside a
  3 wu rope: the rope goes slack and does nothing; the rod stays taut, reports `rp_pull = 2`,
  and drives the crate 2 wu further from the anchor — which on the anchor is a shove upward.
- ⚠ **Outside the ball a rope and a rod are indistinguishable**, measured to the float bound.
  So a test that only ever *pulls* cannot tell them apart, and the control has to put the
  crate **inside**. That is why the design specified it that way.

**Slack removes nothing — not "removes one, weakly".** The crate's position is returned
untouched, with no overshoot and no constraint acting. Which is why `A2`'s slack ledger
carries one state more than the taut one and still closes at six, and both are checked here
against the geometry: taut fixes the radial at `L`, slack leaves it at whatever it was.

**`CARRIED` is visible in the signature.** Nothing in this file takes a terrain sampler,
because there is nowhere a dangling crate could consult one. The design's first draft said
*"one frame solved from the ground contacts"*; this is the body that has none, and it needed
no special case — only its own link.

⚠ **A crate CONSTRUCTED on the sphere read as slack, and the fix was to separate two
concerns.** `crate_swing` puts it at exactly `L`, so `dist − L` comes out at ±1e-16 and an
exclusive test on the boundary is a coin flip. **Third time a float boundary has bitten in
this plan** — the hip's coincident faces and the wing's coincident end plane were the others.
So the **state** is a doorstep with a named tolerance (`TAUT_EPS`: a rope within it of `L` is
straight, taut, tension zero) while the **projection** stays strict, happening only for a
real outward violation. That is what keeps `rp_pull ≤ 0` a property of the *mechanism* rather
than of a clamp — and the difference matters, because a clamped sign would have made the
control pass for the wrong reason.

**Seen red three ways:** a rope that is really a rod breaks 4 clauses, reporting the pull
unclamped so a slack rope "pushes" breaks 3, and projecting along the vertical instead of
along the rope breaks 1.

---

### `A9` — BUILT. `P4`'s falsification is now a clause, not a memory

`lib/moros_sim/src/shape.loft`, 13 tests. **620 green** across the five packages, all 124
functions in the package entered.

Three shape kinds, each with a derived proxy and a **stated** overshoot:

| shape | proxy | overshoot | measured |
|---|---|---|---|
| **Disc** `R`, half-thickness `g` | `(R, R, g)` | `4/π` | **exactly `1.27324`, for every `R` and every `g`** |
| **Capsule** half-length `e`, radius `g` | `(e+g, g, g)` | `4(e+g)/(π(e+2g/3))` | `6/π` for a sphere, → `4/π` as `g → 0`, and the middle brackets between them |
| **Box** | itself | `1` | exactly |

**`I4` is stated two ways, deliberately.** Over a volume grid, every point `shape_has`
accepts must be inside the proxy — the invariant as written, and what keeps the shape's own
definition from going unchecked. And on each shape's *surface*, where the extremes a grid
misses actually live: a disc's whole rim, a capsule's wall and both caps.

⚠ **`P4` is a clause now.** `bone_obb`'s half-extents for a spoke are `(R/2 + ω, ω)`, and a
test asserts that box does **not** contain the rim point at `(0, R, 0)` while the derived
`(R, R, g)` does — in both in-plane directions. The falsification was on paper before A1;
it is executable now, so the inherited proxy cannot come back. Mutation 1 restores it and
**6 clauses go red**.

**The extents are derived and only the girth is declared.** A wheel's radius is its rig's
`rg_len` — the one home `A5` gave it for exactly this — so a bigger wheel gets a bigger proxy
with nothing written twice. A girth of **0 means no shape declared**, which is a real case (a
marker, a trigger) rather than a defaulted one; a *negative* girth is refused.

⚠ **A single number cannot describe a box, and the test that caught it was the right one.**
The first version derived a chassis's reach as one distance and put it on `x` — so the cart's
wheel mount at `(0, 0, ±half)` fell **outside its own body's proxy**. The clause that failed
was *"a body's proxy contains what is bolted to it"*, which is the question worth asking of a
derived extent. Fixed by deriving **per axis**, with the girth as a floor so a body with
nothing mounted is still a body. Mutation 3 collapses it back and that clause alone goes red.

**Seen red three ways:** the inherited `(R/2+ω, ω, ω)` proxy breaks 6 clauses, leaving the
`shrink` knob at 0.99 breaks 6, and collapsing the box's three axes breaks 1.

⚠ **And the `??` precedence trap cost a second failure this session** — `thin < 4.0 / PI ?? 0.0
+ 0.01` parses as `thin < (4.0/PI ?? (0.0 + 0.01))`, so the tolerance silently vanished.
`??` binds loosest; discharge into a local and compare that.

---

### `A9b` — BUILT. And the first version refused a joint that works

`lib/moros_sim/src/skin.loft`, 11 tests. **630 green** across the five packages, all 130
functions in the package entered. The editor's hip already applies this (`5ffdf2c`'s
predecessor); this is the rule, so a caller cannot forget it.

`skin_fit` takes a parent box, a child's half-extents, a pivot and **the joint's range**, and
returns the parent amended so `A-SKIN` holds. Measured against the shipped figure: the
overlap it produces is `0.03405751452835025` — the editor's `hip_overlap()` to the last bit.

**The design's control holds over the whole range, not at one angle.** The unamended hip
opens a pocket at every nonzero angle, and the measured depth tracks `(w/2)·sin θ`; the
amended one opens none at any of nine sampled angles. And ⚠ the fit is **tangent**: sweep past
`θ_max` and the seam reopens, fit for the wider range and it closes again. The range is the
input, which is why there is no way to hand it a constant.

⚠ **The finding that outlives the number is still the first question, not the amount.** A
pivot plane INSIDE its parent opens no wedge — `P7` measured the editor's own shoulder that
way — so `skin_fit` asks "is any needed" before "how much", and answers *no* for an interior
pivot. Two clauses make that the pivot's placement and not something about arms: the same arm
on the chest's bottom **face** does need it, and leaks without it.

⚠ **AND THE FIRST VERSION OF THIS RULE REFUSED THE REAL SHOULDER.** It treated a child
reaching past its parent out of plane as a refusal — *"no overlap can cover a face with
nothing above it"* — which sounds right and is wrong: **a face with nothing above it is not a
pocket**, so there is nothing there to close. The editor's arm genuinely reaches past the
chest in z, and `P7` measured it as clean. What the margins actually decide is whether the
added material **hides**: the hip's overlap is invisible because the pelvis is already wider
than the leg (13 mm in x, 19 mm in z), so a 3 cm skirt disappears into a silhouette that was
wider anyway. Where a margin is negative the overlap *shows* — reported as an approximation
with its residual, `K-FIT`'s third state, and the seam still closes. **Visibility is not
correctness**, and conflating them cost a refusal of working geometry.

⚠ **A second self-inflicted one: the march reached the parent's whole height**, so the
measured depth was quantised to 2 cm and could not be compared with the closed form at all. A
pocket can only be as deep as the face's own half-extent, so that is how far the march goes.
*An instrument whose resolution is set by the wrong quantity cannot check an equality.*

**Seen red three ways:** zeroing the overlap breaks 5 clauses, dropping the overhang clause —
`P7`'s discarded first measure — breaks 1 (the shoulder, exactly as it did then), and treating
every pivot as interior breaks 4.

---

### `A9c` — BUILT. The unification is literal, and one claim is left open

`lib/moros_sim/src/bend.loft`, 11 tests. **639 green** across the five packages, all 134
functions in the package entered.

**The unification is literal, not a resemblance.** *"A `SOLVED` state is a fixed point in
exactly the shape the ground contact already is … so it reuses the machinery rather than
adding any."* `wing_bend`'s loop calls **`asm_frames`** for the shape and reads the moments off
the frames it gets back — nothing about bending is added to the poser, and the values it
returns are in `asm_frames`' own unit, so the bent wing poses through `A3` with nothing in
between. `A-RIGID` still holds on it: bending is joints, not deformation.

**The design's control holds.** A load past a joint's limit is **refused** with a named
reason, the limit as its offer and the overshoot as its residual — and every value the caller
is handed is inside its own limit, so it does not fold through itself. The same wing with free
joints takes the same load and is applied exactly.

⚠ **The convergence warning from `P6` is now a named constant.** `BEND_ROUNDS = 100`, because
this fixed point is only **linearly** convergent where the ground contact's is quadratic —
three rounds, which is right for `A6`, leaves a residual a thousand times the settled one. A
caller budgeting `A6`'s three would be a hundred times short, so the default says so.

⚠ **`P6`'s end rule needed its condition restated, and measuring is what found it.** A hinge
stands for half the span each side, so ends get `h/2` and the interior `h` — but the condition
is *"has no bone inboard of it"*, **not "is the first joint"**. Applied to `asm_wing`, whose
first mount is a whole span out from the fuselage, the end rule made the answer **worse**:
12.4 % under against 5.6 % over for a full `h`. Joint 1 there is an interior hinge with a
rigid span inboard of it. So `asm_cantilever` exists — a fixture whose first hinge really is at
the clamped end — and a clause asserts the knob does **nothing** on `asm_wing`, which is the
honest negative.

⚠ **And one claim is deliberately NOT made.** No absolute accuracy against `wL⁴/8EI` is
asserted here. Four attempts at one kept measuring this fixture's *indexing* rather than the
rule — the tip and the loaded span differ by half a segment from `P6`'s own numbering. `P6`
established the accuracy with its own instrument; what this step measures is
**self-convergence**, stated as such, which is what `P6` itself fell back to for its nonlinear
half. Reconciling the two indexings is in *Open* below rather than papered over.

**Seen red three ways**, each on exactly one clause: clamping silently instead of refusing,
letting the joint fold through its limit, and dropping the budget to `A6`'s three rounds.

---

### `A10` — SWITCHED. Bit-identical, and the `1.1` is gone

`cart_send` composes through the library now, and the switch is **behaviour-preserving to
the bit**: over four rolls on a slope, from fresh servers before and after, every transform
element and every pose field differ by **exactly 0**. That is `A5`'s discipline applied to
the real switch — *"that turns 'did I break the cart' into a diff"*, and the diff is empty.

**What moved:**

| | before | after |
|---|---|---|
| the wheel offset | render transform · contact solve · `cart.mjs`'s `1.1` — **three homes** | `asm_cart`, read by `asm_frames` and `body_axle` — **one** |
| the wheel radius | `CART_RADIUS`, twice | the rig's `rg_len`, via `body_axle` |
| the base frame | `T · Ry_mesh(yaw) · Rx_mesh(−bank)`, with the negation compensating for a transposed rotation | `ground_frame`, Rodrigues, **no negation** |
| the gap | `y ± half·sin(bank)`, re-derived | the hub through the frame, terrain sampled under it |
| **`cart.mjs`'s axle clause** | `\|axle − 1.1\| < 1e-9` | **deleted** — `A-RIGID` is a property test with a `scale` knob |

**`cart.mjs` shrank to what genuinely needs a running world**: the wheel's arithmetic, the
GAP (which needs terrain), and `bankSigned` (which needs the emitted transforms). Asserting
the axle in a browser would have been re-checking the library's own arithmetic. **All 23
gates green.**

⚠ **The yaw's sense is now the standard one, and it was reversed before.** mesh3d's
`rotate_y` turns about `−y`, so the old composition and the solve's sampling direction both
carried that; the library is Rodrigues throughout. **Unobservable today** — `cart_yaw` is
never anything but 0, which is exactly why `P1` could not pin it — and the thing to know when
something first turns the cart.

⚠ **The full switch is NOT done, and a loft defect is why.** `ground_axle` takes the terrain
as a **function**, which is what lets it be a pure function of its arguments; supplying that
from the editor means a lambda capturing the `World`, and **that panics the interpreter** —
filed as [loft#682](https://github.com/loft-lang/loft/issues/682). Isolated in three runs: the
import alone is fine, the capture crashes, removing the capture fixes it. ⚠ And the panic
surfaces in `edges_around`'s `edgeset_new`, ~900 lines from the closure, so the reported site
is useless for bisecting. **Third store-lifetime defect this plan has hit** (#670, #677, #682)
— all three "a value that outlives the expression that made it, reached indirectly".

So the editor keeps its own copy of the fixed point for now, with the library's numbers and
the library's frame. The composition, the offsets and the gap are switched; the *solve* is the
one piece still duplicated, and it is duplicated for a reason that is written down.

---

### The clock is out of the gates — and taking it out found a third live defect

The five gates that read a mesh after a fixed sleep are now waiting on what the
server *says*. The tally, and what each one actually needed:

| gate | was | now |
|---|---|---|
| `field.mjs` | `wait(1200)` | `ack('rebuilt')` — **it read 0 verts on every run**, not one in five |
| `straight.mjs` | `wait(2500)` | `ack('rebuilt')` |
| `import.mjs` | `wait(1200)` | *nothing* — the `dressing` read-back already orders it |
| `vegetation.mjs` | floor-plus-settle heuristic | `ack('rebuilt')`, and `settleVerts` collapsed to two lines |
| `persist.mjs` | `settle()` | `ack('saved')`, `ack('rebuilt')`; the height is read once |
| `road.mjs` | 6 sleeps, and no status collector **at all** | `placed`, `rebuilt`, `road false` |
| `stencil.mjs` | 20 sleeps | `placed`, `storey`, `stencil`, one `rebuilt` |

Two things are worth keeping from the rework.

**The order of the two waits is the whole guarantee.** In `road.mjs` the rebuild
wait goes *before* the `10:0` toggle, not after. A placement marks its chunks dirty
and acks `S:placed` in the same handler, so at the moment that ack arrives the flush
is necessarily still pending and the next `S:rebuilt` is necessarily the one carrying
it. Put the wait after the toggle instead and the flush may already have run, leaving
nothing to wait for — a 40-second stall dressed as a barrier. `S:rebuilt` is only
broadcast when `nrebuilt != 0`, which is what makes it a signal rather than a
heartbeat, and also what makes waiting for a rebuild that will not happen fatal.

**⚠ A raise took its origin from a cell that updates once per TICK — and the fix
had to go in the server.** `MSG_RAISE` anchored its `hex_distance` ruler at
`last_hq`/`last_hr`, which only the streaming block writes, and only when the hex
changes. The ray it measures already walked out from the current `px`/`pz`: two
positions in one measurement. Between a `7:` teleport and the next tick the ruler
still named the cell that was left behind.

Measured, not argued — `probe/raise_origin.mjs`, teleport to hex (10,0) and raise in
the same breath:

| | hill at (10,0) | hill at (20,0) |
|---|---|---|
| no pause | **+7** | 0 |
| after a tick | 0 | +7 |

The hill landed **underfoot** — which is exactly the failure the handler's own ⚠
about the search bound was written to prevent, arriving by a different door. This is
the third instance of this defect family in this file: the road once stamped at
`last_hq` too, so every placement laid at one stale hex and a walked path made a
blob. Same fix both times — derive the cell from the position.

It was invisible while the gate slept, and invisible even to an ack, because `ack`
polls at 100 ms and a tick is ~16: the acknowledgement's own granularity covered the
gap by accident. That accident is what makes "green" worth so little here. The probe
sends both commands with nothing between them, which a probe may do and a gate may
not.

Verified: 23 gates green on **three** consecutive full runs with every number
identical, and 639 library tests pass.

### `A9c` reconciled — and the indexing was an ERROR, not a numbering

`A9c` recorded that `asm_cantilever` and `bend_bones.loft` *"are not the same numbering"* and
that **neither is wrong**. Measuring settled it: the library was **29.6 % out at N = 10** where
`P6` predicts **1.0 %**. Two faults, and they partly cancelled — which is why self-convergence
passed while the absolute answer did not.

| fault | what it did |
|---|---|
| the moment loop ran `for k in j..n` | swept station `j`'s own bone — the bone **inboard** of hinge `j` — into that hinge's moment, with a negative lever arm. The comment above it already said *"every load outboard of it"*; the code did not |
| the load centroid was taken **outboard** (`-h/2`) | station `k` sits at the outboard END of the bone it stands for, so that bone's centroid is half a span back toward the parent. Taking it outboard shifted every load a whole bone past its geometry |

Both fixed: `for k in j + 1..n`, and `mid = frame_apply(fk, vec3(0.0, hk * 0.5, 0.0))`.

**The library now reproduces `P6`'s hand-derived prediction to better than 1e-10.**
`tests/cantilever_absolute.loft` asserts the *constant*, not merely the order:

| scheme | prediction | asserted |
|---|---|---|
| root hinge `ℓ = h/2` | `tip/δ = 1 + 1/N²` | to **1e-9** at N = 5, 10, 20, 40 |
| root hinge `ℓ = h` (the deliberate defect) | `tip/δ = (1 + 1/N)²` | to 1e-2 at N = 5, 10, 20 |

The tolerance is the physics, not a fitted slack: at a tip deflection of 1e-6 of the span the
geometric nonlinearity contributes ~1e-12 and 400 rounds of float noise ~1e-13, so 1e-9 is
generous by three orders and still pins the constant.

⚠ **Two existing tests were encoding the bug, and each is now a sharper claim.**

- *"all ten joints turn the same way"* — it is **nine**. The outermost station has nothing
  outboard of it, so its hinge carries no moment; the test now pins that hinge's exact zero,
  which is the single sharpest consequence of getting the indexing right.
- *"twenty-four stations is within a few per cent"* — it was calling
  `asm_cantilever(n, span/n)`, but **`n` is STATIONS and the beam is `(n-1)·seg`**, so every
  sample was a different beam (0.875·span at n=8 against 0.9875·span at n=80). Since the tip
  goes as `L⁴` that alone is 11 % at n=24. The old outboard shift compensated, and the two
  wrongs let it pass. The fixture now holds the length fixed, and `asm_cantilever` says in its
  own doc that `N` bones of a length `L` beam is `asm_cantilever(N + 1, L / N)`.

✅ **Gate-verified too, once [loft#693](https://github.com/loft-lang/loft/issues/693) landed.**
That regression briefly stopped the editor starting at all — filed with a 12-line reproducer,
fixed upstream the same hour as *"name the binary↔rlib mismatch, and gate it at install time"*,
which is the diagnosis exactly: the installed binary emitted a call its linked rlib did not
carry. **23 gates green on two consecutive full runs, 642 library tests pass**, and the cart is
bit-identical through the very capture that tripped it —
`worstGap 1.540269400912564e-8`, `maxBank 0.08314124584252244`.

### `P-TEAM` — RUN. A team IS a tree, and the yoke was a cost with no benefit

The open item asserted two things and offered the second as the repair. Probed
(`probe/team.loft`), **neither survived**.

**C1 — "a team is two links into one body" is FALSE.** It is an artifact of choosing the
HORSES as the roots. The root is a *labelling* choice, not a physical fact: re-root at the
cart and every body has exactly one parent again.

```
cart (root, on the ground, two wheels)
  ├── horse A   hitch, on its own four feet
  └── horse B   hitch, on its own four feet
```

`A-TOPO` admissible **true**, every body closes **true**, mobility **4**. `asm_towed` roots
at the horse because there is exactly one puller — with two, that convention simply does not
generalise, and **nothing but the convention was ever in the way.**

**C2 — the yoke does not help.** A pole on two ball hitches is **DOF-neutral**: it adds a
body worth six and two hitches worth three each, so mobility stays 4. It does not hold the
horses abreast, and it is *the only thing here that would make the graph non-tree*. The
proposed repair bought nothing and broke the invariant it was meant to restore.

⚠ What *would* break the tree is a pole with joints **stiffer than hitches** — a real
coupling, hence a closed chain, genuinely outside this representation. That is not what two
hitched horses are, and it is now precisely characterised rather than vaguely feared.

**C3 — and the ledger is not an approximation of the system count, it IS the system count.**

    system freedom  −  ledger mobility  =  Σ residual

exactly, on every fixture:

| | system | ledger | Σ residual | closes |
|---|---|---|---|---|
| team | 4 | 4 | 0 | ✅ |
| cart | 6 | 5 | +1 | — *(the known "reports five not six")* |
| towed | 6 | 6 | 0 | ✅ |
| trailer4 | 3 | 4 | −1 | — *(over by one: the fourth wheel)* |
| shafted | 3 | 5 | −2 | — *(over by two)* |

A tree carries no link that no body owns, so summing `6 − links − support` over the bodies
*is* Grübler. **The only way the two could part is a link outside the tree** — which is
exactly what the structure cannot express, so `A-DOF` is sufficient for every topology
question this representation can pose.

⚠ **The probe's own first version fell into `A9c`'s trap** and is worth recording as such:
it hand-wrote a joint list per fixture and reported "disagreements" that were its own
arithmetic. Deriving the system count *from the assembly* turned a hand-check into an
identity. Twice now in this plan, measuring a second numbering has masqueraded as measuring
the rule.

`asm_team` is now a library fixture with two tests, **seen red both ways**: making the
horses `Carried` breaks the tree clause, and perturbing the residual breaks the identity
across three test files.

### Cliffs — BUILT. Steep ground blocks the walker, as an edge

The goal: steep ground automatically becomes a cliff that blocks movement. Measured first,
designed, then built — `lib/moros_sim/src/cliff.loft`, 7 tests, wired into the editor's walk
collision set only.

**The result, same probe before and after:**

| | before | after |
|---|---|---|
| steepest gradient walked | **66.6°** | **25.7°** |
| peak reached (summit 9.25 wu) | 9.085 | **0.664** |
| `reachedTheSummit` | true | **false** |

⚠ **And `climb.mjs` is bit-identical at `climbed 0.619`** — the threshold discriminates rather
than merely blocks. That pair is the whole claim: the 60° face is refused and the gentle rise
is still walked, by one rule.

**Seen red twice, on the two halves that could each be hollow.** Disabling the threshold
(`cliff_step() -> 9999`) returns the probe to *exactly* its old numbers — 66.6°, peak 9.085,
summit true — so the wiring is live rather than the probe flattering it. And the new gate goes
red on the same defect, `refused false · noCliffWalked false`.

⚠ **The gate asserts that the walker STILL COVERS GROUND** (`stillWalks`, 7.79 wu). "Did not
summit" alone passes for a character that cannot move at all — the same hole `collide.mjs`'s
control leg exists to close, and the second time this plan has had to close it.

**The threshold is the consumer's, not the library's.** `cliff_edges` takes it as a parameter
because how tall a step a creature can take is a property of the *creature*; the editor passes
its own hip height (`hip_wu() / HEIGHT_SCALE`). That is the substrate's configuration seam,
and it is why the library needs no constant it could not justify.

**What happens today, measured** (`probe/cliff.mjs`). Raise a hill and walk into it:

| | |
|---|---|
| ground profile, height units | `0 0 0 0 0 6 13 19 31 31 37 31 31 19 13` |
| the ground's steepest step | **60°** |
| the gradient the character actually walked up | **66.6°** |
| summit | reached — 9.085 wu of 9.25 |

The editor says why in its own words: *"the feet follow the surface every tick, so walking
into a slope walks UP it. No jump, no fall, no step limit yet."* And `walk_to` consults
exactly one thing — `hex_edge::sweep_path` over an `EdgeSet`. **Steepness is never consulted,
so nothing can stop a climb.** The raise brush's 74–83° flanks are documented as *wanted*, so
this is not a brush to soften; it is ground a walker should not be able to ascend.

#### The invariant

> **Impassability is an edge, always.** A cliff is not a new kind of obstacle — it is a
> **derived** edge, computed from the height difference across it, carried in the same
> `EdgeSet` a wall uses and consulted by the same `sweep_path`.

**Re-assertion sites: one.** The alternative — a slope test inside `walk_to` — is a *second*
blocking mechanism, and every future mover would need its own copy: an NPC pathfinder, a
placed vehicle, a thrown object. Two mechanisms that can disagree about whether you may pass
is precisely the shape this plan keeps finding (two representations of a height, two
numberings of a beam, two implementations of a solve).

And it **falls out of [`HEX_STACK.md`](../../doc/claude/HEX_STACK.md)'s `I2` rather than
being invented beside it**: the cliff set is derived from the store's heights, deterministic,
version-keyed, never stored and never transmitted — exactly like a mesh, invalidated by the
`world_is_stale` mechanism that already exists.

#### The claims, and the one that bites

**C1 — ⚠ a cliff is asymmetric and `hex_edge` is not.** `edge_blocked` reads the *canonical*
edge, so `(a,b)` and `(b,a)` are one edge: a block stops you both ways. A cliff physically
stops you climbing *up* and not stepping *down*.

**This is survivable, and the reason is worth stating rather than assuming.** Under a
symmetric block you can never *reach* the high side on foot, so being up there requires being
**placed** there — and the asymmetry only becomes observable once a walker can *descend*
faster than it can climb, which needs a **fall**. This rung has none ("no jump, no fall").
So symmetric blocking is self-consistent today, and the asymmetry is a deferral **with a
named trigger**: the day a fall exists, a cliff needs a direction.

⚠ **The cost to name now:** a character *placed* on a plateau is trapped by its own cliffs.
That is a real consequence of the symmetric choice, not an oversight, and the editor teleports
freely — so it will be met.

**C2 — cliffs and walls coexist without a conflict.** `edge_block_surf` is first-writer-wins
on the *surface* while the *material* may be retargeted, so a wall already on an edge keeps
its geometry and a cliff simply finds it blocked. No ordering rule is needed.

**C3 — the threshold is a named constant in HEIGHT UNITS, not a gradient.** A height unit is
0.25 wu; hex centres are √3 apart east–west and 1.5 north–south, so the *same* step is a
different gradient depending on which way you face it. Choosing height units makes a ledge
equally unclimbable from every direction, which is the behaviour a player expects — a
gradient threshold would make the hex lattice visible as a direction-dependent climbability,
which is exactly the kind of leak `hex_grid` exists to prevent.

**C4 — ⚠ AND IT DOES NOT SUBSUME THE CART.** The tempting unification is *"cliffs make steep
ground unreachable, so `ground_axle`'s refusal becomes unreachable too."* **False.** A cart is
**placed** (`17:`), not walked, so it can still be put on ground the axle cannot span. The
`A-FIT` refusal stays live and stays necessary; the open item **narrows to placed vehicles**
rather than closing. Recorded because the elegant version was the first thing that came to
mind, and it is wrong.

#### What building it would take

Derive an `EdgeSet` from the store's heights at chunk-rebuild time — the same trigger that
already rebuilds meshes, keyed by `world_chunk_version` — and union it into the collision set
`walk_to` already consults. No change to `walk_to`, no change to `sweep_path`, one new
derivation and one constant.

## Open

### `A10` — FINISHED 2026-07-30. The solve is the library's, and the diff is empty

The last item: the editor ran its own copy of `A6`'s fixed point because a lambda capturing a
`World` panicked the interpreter. **[loft#682](https://github.com/loft-lang/loft/issues/682)
landed** (`d26c3bef`, *"a closure record was freeing captures it never owned"*), so the terrain
now goes in as a function and the copy is gone:

| was inlined in the editor | now |
|---|---|
| a 20-line `for cs_it in 0..3` fixed point | `msim::ground_axle(cs_sample, cx, cz, cyaw, half, radius)` |
| `base = ground_frame(cx, cs_y, cz, cyaw, cs_bank)` — rebuilt from the solve's numbers | `base = cs_rest.rt_frame` — the solve's own output, *"the pose, not a description of it"* |
| two hand-written `hub.y − radius − terrain_y(…)` | `msim::ground_gap(frame, half, radius, 0.0, cs_sample)` ×2 |
| a bare `break` when the ground out-drops the axle | `A-FIT`'s named refusal, now **broadcast** with its offer and residual |

**Bit-identical, and verified as such** — every figure the cart gate reports is unchanged to the
last digit: `worstGap 1.540269400912564e-8`, `maxBank 0.08314124584252244`,
`worstHubRel 8.326672684688674e-17`, `v1 3.9788735772973833`, `v2 7.957747154594767`.

⚠ **Seen red the only way that proves anything here.** Identical output is also what a switch
that *did not take* would produce, so the control was to perturb **the library** —
`nb = atan2(…) * 1.05` inside `ground_axle` — and watch the editor move: `worstGap` 1.54e-8 →
**0.00228**, `maxBank` 0.0831 → **0.0873**, `grounded` false, gate red. The editor is calling the
library, not shadowing it.

**One loft rule learned:** `|sx, sz| { … }` cannot infer its parameters at an *assignment* —
there is no expected type at that site, only at a call. The typed form
`fn(sx: float, sz: float) -> float { … }` is required for a lambda held in a variable; the short
form is fine passed straight into a call. The compiler says so and names the fix.

23 gates green, 639 library tests pass.
- ~~Reconcile `A9c`'s indexing with `P6`'s.~~ **DONE 2026-07-30 — and "neither is wrong" was
  wrong.** See the section below.
- ~~A team is not a tree.~~ **PROBED 2026-07-30 — and both halves of the claim were
  wrong.** See below.
- **Steep ground, the CART half.** `A-FIT` says refuse with a residual; tipping is the
  physical answer and is dynamics this rung does not have. ⚠ **The cliff design below does
  NOT close this** — see the non-unification note there. A cart is *placed*, not walked, so
  it can still be put on ground the axle cannot span.
- ~~Cliffs — designed, not yet built.~~ **BUILT 2026-07-30.** See below.
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
