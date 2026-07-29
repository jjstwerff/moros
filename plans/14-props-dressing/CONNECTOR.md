# 14 — The multi-rig connector: how parts combine, and how they meet the ground

**Issue:** [jjstwerff/moros#14](https://github.com/jjstwerff/moros/issues/14) ·
sibling of [DESIGN.md](DESIGN.md), which names this as the open half:
*"the multi-rig connector (rungs W6/W7's other half), which `hex_body` does not have."*

A cart, a train, a robot: several rigs that must move as one thing, resting on ground
that is not flat. `hex_body` owns a **single rig** — bones, revolute joints, a pure
pose, a derived proxy. It does not own **how two rigs mount to each other**, and it
does not own **where the assembly sits in the world**. This design is those two.

---

## What is wrong today, measured

The cart shipped at rung 10a and its gate has been green throughout. Both of the
following were true the whole time.

| defect | measurement |
|---|---|
| **The wheels are drawn flat on the ground.** `emit_cylinder_post` builds its ring in the XZ plane whatever axis it is handed — the two endpoint arguments only move the endpoint centres | the cart's wheel mesh bounded `x 0.80 · y 0.00 · z 0.92`; a wheel is `0.80 · 0.80 · 0.12` |
| **The body's height is a constant.** `translate(cx, CART_RADIUS, cz)` — a fixed lift above `y = 0`, never above the *ground* | on a 4.8° slope the wheels hang **0.204 wu** clear of the terrain |

Both are fixed and gated as of this branch (the axis invariant in
`moros_render/tests/geometry.loft`; the contact solve in `editor_server.loft` with a
wheel-to-ground clause in `cart.mjs`). **This design is not that fix.** It is the
structure the fix should have been written into, and the reason is the third defect,
which the fix did not remove:

> **⚠ The connection is written down more than once.** "The wheel is `CART_HALF_W`
> from the chassis" is currently restated in the render transform, again in the
> ground-contact arithmetic, and again as the literal `1.1` in the gate. Three
> independent sites, and a disagreement between them is **silent** — nothing fails to
> compile, nothing looks wrong, and the picture keeps moving.

That third defect is what produced the two visible ones, and it produced a fourth that
is worth recording because it is the same mistake in the instrument:

> **⚠ A gate clause that restates the connection cannot test it.** The first version
> of the axle check asked the server for the axle length; the server computed it as
> `2·half·√(cos²β + sin²β)` — the answer `1.1` for every input. A clause that cannot
> fail. It was replaced by one that measures the two wheel transforms **actually put on
> the wire**, and only then could it be seen to go red.

The existing cart gate has the same shape at a larger scale: it measures
`travel → value → skid`, which is the wheel's *arithmetic*, and nothing about where any
part of the cart is. That is how a cart with flat wheels floating over a hill stayed
green for a rung.

---

## The invariant

> **Every point on a vehicle is `frame(contacts) ∘ rig(joint values)`. The frame comes
> from the world, everything inboard of it comes from the rig, and neither is ever
> stored.**

One sentence, and each of the four defects above violates it:

- a **constant body height** — the frame did not come from the contacts;
- a **hand-composed `mat4` chain** — the part position did not come from the rig;
- a **flat wheel mesh** — the part's geometry did not come from the rig either;
- a **restated axle length** — a consumer wrote down what it should have read.

It is `hex_body`'s **`I-POSE`** (*a body is a rig, never a pose*) and **`I6`** (*the
pose is a pure function of the joint values*) carried up to an assembly, with one term
added that `hex_body` deliberately does not have: the frame, which is where the world
gets a say.

### Why the frame is separate, and not just another joint

It is tempting to make the ground contact a joint like any other and have one uniform
tree. It is not one: **a joint value is authored or derived from the vehicle's own
history; a frame is solved against something the vehicle does not own.** A wheel's spin
is a function of `travel` and can be computed with no world at all — that is exactly why
`wheel_value` is pure and why no-slip holds by construction. A body's height cannot be:
it is a function of terrain, which is another author's data and can change under a
parked cart.

So the split is not tidiness, it is **who is allowed to disagree** — the same test
[#16](../16-client-split/DESIGN.md) uses to decide what belongs on which side of the
wire. Two viewers may hold different joint values for the same cart (one is mid-replay);
two viewers holding different *ground* under it is a corrupted world.

---

## The connector

`hex_body`'s `Rig` is **planar** — `rg_ox`/`rg_oy`, `pose_of`, `rig_world_seg` are all
two-dimensional, and the module says why: a revolute joint's motion *is* planar, so a
2D rig is not a simplification of a 3D one, it is the exact shape of the thing. A
rolling wheel lives entirely in the plane of travel.

A vehicle does not. Its wheels are offset **laterally**, and a steered axle turns about
**vertical**. Neither is in the travel plane.

**So the connector is the 3D mount, and the rigs stay 2D.**

```
Connector
  cn_parent   which assembly node this hangs from (-1 = the vehicle frame)
  cn_ox,oy,oz offset from the parent, in the parent's frame
  cn_axis     the revolute axis this mount turns about: LATERAL | VERTICAL | LONGITUDINAL
  cn_value    the mount's own angle (steering, articulation) — 0 for a rigid mount
  cn_rig      the hex_body Rig carried at this node
```

An assembly is a tree of these. A cart is three nodes: the chassis (rigid, no rig), and
two wheel mounts at `oz = ±half_axle`, each carrying the **same one-bone rig** whose
joint value is `wheel_value(travel, R, slip)` and whose bone length is the wheel radius
— the spoke, exactly as crawler's `mesh_wheel` draws it, so that a phase error is
visible rather than merely stated.

**What this buys, and it is the whole point:** the lateral offset is written **once**,
in the connector. The render transform reads it, the contact solve reads it, the
collision proxy reads it, the gate reads it. Nothing restates it, so nothing can
disagree.

### ⚠ The claim to attack: "a robot joint is several connectors in series"

The elegant story is that this handles articulated everything — a 3-DOF shoulder is
three connectors at zero offset on three axes. That is the standard construction
(it is what a Denavit–Hartenberg chain is), and it is **exactly the kind of "…and it
also handles X" that should be probed rather than celebrated.**

The probe is `P3` below. What it is looking for: whether a zero-offset chain of
single-axis mounts reproduces a known 3-DOF pose **exactly**, or whether composing three
planar rigs through it accumulates an error that a single 3D rotation would not have.
If it does not hold, the honest answer is that **vehicles get connectors and robots get
something else** — two families, not one — and this design shrinks to vehicles rather
than pretending.

---

## The frame: solving a vehicle onto the ground

Given the connector tree, the wheels' contact points are known in the vehicle's own
frame. The frame is then solved so that **every wheel touches**.

For one axle — the cart — this is closed form, and the closed form is the design:

```
  y  = (g_left + g_right) / 2 + R           the body rides at the mean contact
  sinβ = (g_left − g_right) / 2w            the axle's angle with level
```

with `g_*` sampled at the wheel positions, which themselves depend on `β` — so it is a
**fixed point**, seeded at level. Measured on this editor's ground, two rounds close it
to under a nanometre.

**⚠ The wheels are placed FROM the solved frame, never each onto its own contact.** Two
wheels each parked at `contact + R` sit `√(4w² + d²)` apart: the axle grows with the
slope. That is crawler's `hexlink` con-rod failure exactly — *"solve the linkage wrongly
and its length varies with the crank angle, and nothing else about the motion will tell
you. The wheels still turn, the crosshead still slides, the picture still moves."*
Placing them through one rigid frame makes the length true by construction, so there is
no invariant left to violate rather than one more thing to check.

### One axle fixes no pitch, and that is a refusal, not a gap

Two contacts determine a height and a bank and **nothing else**. A cart that should also
nose up a hill needs a second contact along the travel axis — shafts, or a second axle.
Inventing a pitch from one axle would be a number with no measurement under it.

For **two or more axles** the solve is over-constrained: four wheels on uneven ground
have no rigid solution in general. This is not a defect to engineer around — it is the
reason real vehicles have suspension. The design says so explicitly:

- a **rigid** assembly is solved from **exactly three** contacts (or two plus a
  constraint), and the remaining wheels report their gap as a **residual**;
- a **sprung** mount carries a travel limit, and the residual is taken up there.

Either way the residual is **on the wire**, which is `K-FIT` invariant I: applied
exactly, refused with a reason and an offer, or applied as an explicit approximation
with its residual shown. A wheel that does not reach the ground is not hidden.

### ⚠ The steep case is live, not theoretical

`sinβ = d / 2w` has no solution when `|d| > 2w` — ground that drops more across the axle
than the axle is long. This is **not** an edge case here: the raise brush's own
documentation records flanks of **74–83°**, deliberately, and the cart's axle is 1.1 wu.
A hill this editor makes routinely will exceed it.

So the refusal must be designed, not discovered: the cart **cannot rest** there, and the
honest outcomes are to refuse the placement with the residual (how much steeper than
admissible), or to tip — which is physics this rung does not have. Silently clamping to
the steepest admissible bank would put the cart in a pose no ground supports and report
success.

---

## What this costs, in re-assertion sites

The prospective tell, counted before any code:

| fact | homes today | homes under this design |
|---|---|---|
| wheel lateral offset | 3 (render, contact solve, gate literal) | **1** (the connector) |
| wheel radius | 3 (mesh, frame lift, contact) | **1** (the rig's bone length) |
| wheel spin | 1 (`hex_body::wheel_value`) ✅ | 1 |
| body height | 1, and it was wrong | **0** — derived, never written |

Omitting a read is **silent** in every one of today's three cases, which is the
brittleness. Under the design the count is 1 and the way to violate it is to write a
literal where a read belongs — which is **greppable**: no `CART_HALF_W` (or its
successors) outside the connector's definition. That is the usage sentinel, and it is
worth running as a check rather than trusting.

---

## The probes — cheapest tests that could prove this wrong

Run before building, and expect to falsify.

| | claim | probe | falsified if |
|---|---|---|---|
| **P1** | `rig_world_seg` is enough to place a wheel for rendering | build the cart's transforms from the rig and diff against the current hand-composed matrices | the rig cannot express something the render needs (a scale, a width, a mesh orientation) without a second source |
| **P2** | the contact fixed point converges | iterate on the **steepest ground the raise brush makes** (74–83° flanks), counting rounds to 1e-9 and recording where `\|d\| > 2w` first fires | it oscillates, or the refusal fires so often the tool is unusable — in which case the axle/brush relationship is the design problem, not the solver |
| **P3** | a 3-DOF joint is three connectors in series | pose a known shoulder both ways and compare exactly | composing planar rigs through single-axis mounts diverges from the 3D rotation — then vehicles and robots are two families |
| **P4** | `bone_obb` gives a usable collision proxy for a wheel | derive the proxy from the rig and check `I4` (proxy ⊇ shape, overshoot bounded and stated) for a disc | the OBB of a spoke does not bound the disc — a wheel is not a capsule, and the proxy would need its own shape |

**P4 is the one that decides whether this is worth building.** If the proxy falls out of
the rig, a vehicle gets collision for free and the connector has earned its keep beyond
tidiness. If it does not, the connector is only a render and contact structure, which is
a smaller claim and should be written as one.

---

## Where it lives

`hex_body` is the shared tree (`../loft-libs-world`), read from the working tree by
crawler as well as by us — **a new public name there can turn the sibling red with no
local edit on their side**, so the connector is not added to `hex_body` on speculation.

The order:

1. Build the connector **here**, in `lib/moros_sim`, against `hex_body`'s existing rig
   surface. It is testable in loft with no server, no wire and no browser, because
   `rig_world_seg` is pure — which is the whole reason the connection test does not
   belong in a `.mjs` gate.
2. `cart.mjs` keeps only what genuinely needs a running world: the **wheel-to-ground
   gap**, which is a terrain query. The axle clause moves into the loft test and the
   `1.1` literal disappears.
3. `hex_body` gets the connector only once a **second consumer** wants it — crawler's
   `hexlink` is the obvious one, and it already solves the harder linkage case. Until
   then it is ours, and generality is earned by a second real case rather than
   predicted from the first (the ladder's own rule).

---

## Formal definitions

Written down first, because a property test needs a proposition and an example does
not. Notation: `SE(3)` is the group of rigid motions, `T(o)` a translation, `R(a, θ)` a
rotation of `θ` about unit axis `a`.

### The mount

A connector node `i` carries a parent `p(i)`, an offset `oᵢ ∈ ℝ³` in the parent's
frame, a unit axis `aᵢ`, and an angle `θᵢ`. Its **local transform** and its **world
frame** are

```
  Mᵢ = T(oᵢ) · R(aᵢ, θᵢ)                    Wᵢ = W_p(i) · Mᵢ            W_root = F
```

where `F` is the vehicle frame (§ *the frame*). Nothing else exists: a part's position
is `Wᵢ` applied to a point of its rig, and is computed on demand.

### The invariants

| id | statement | why it is the one |
|---|---|---|
| **`C-TOPO`** | `p(0) = −1`, and `0 ≤ p(i) < i` for `i > 0` | canonical labelling. A tree can be relabelled and describe the same assembly; topological order fixes the labels, exactly as `rig_admissible` does for a rig and `form_read` does for a form |
| **`C-EXACT`** | `write(read(C)) = C`, byte-for-byte; a malformed text is **refused, never repaired** | the assembly is a *description*. loft's float↔text round trip is byte-exact, so this needs no tolerance |
| **`C-RIGID`** | for every node `i` and all `u, v ∈ ℝ³`: `‖Wᵢu − Wᵢv‖ = ‖u − v‖` | **the con-rod, stated once for everything.** Equivalent to `RᵢᵀRᵢ = I ∧ det Rᵢ = +1`. It holds *by construction* — `T` and `R` are in `SE(3)`, `SE(3)` is closed under composition, so `Wᵢ ∈ SE(3)` by induction over `C-TOPO`'s order — which is the point: there is no site left that could stretch anything |
| **`C-PLANE`** | the rig plane embeds as `ι(x, y) = (x, y, 0)` in the node frame, and `ι` is an isometry | a spoke's length is `rg_len[i]` for **every** joint value. `hex_body`'s `I6` purity carried into 3D without adding a way to deform |
| **`C-GROUND`** | for every wheel `i`: `lowest(wheelᵢ) − g(contactᵢ) = 0` | the frame is solved against the world, and this is what "solved" means |
| **`C-FIT`** | admissible iff `|d| ≤ 2w`; otherwise refuse with residual `|d| − 2w` | `K-FIT` invariant I for a pose. An ordinal quantity, so a refusal owes an offer and a residual |
| **`C-PROXY`** | proxy `⊇` shape, with the overshoot **bounded and stated** | `hex_body`'s `I4`, verbatim |

### The frame solve, in closed form

Let `w` be the half-axle, `R` the wheel radius, `u` the axle's unit direction in the
ground plane, `c` the vehicle's ground position, and `g(·)` the terrain height.

```
  x_L(β) = c − u·w·cos β          g_L = g(x_L)
  x_R(β) = c + u·w·cos β          g_R = g(x_R)          d = g_L − g_R

  sin β = d / 2w                  y = (g_L + g_R)/2 + R
```

The contacts depend on `β` and `β` depends on the contacts, so this is a fixed point
`β_{n+1} = Φ(β_n)`, seeded at `β₀ = 0`. Differentiating, with `s_L`, `s_R` the terrain
slopes along `u` at the two contacts:

```
  d′(β) = w·sin β·(s_L + s_R)
  Φ′(β) = sin β·(s_L + s_R) / (2·cos Φ(β))
```

Two consequences worth having on the page:

- **`Φ′(0) = 0`.** The iteration is *quadratically* convergent near level — which is
  why three rounds measured a residual of `1.5 × 10⁻⁸` rather than something linear in
  the slope. That is a prediction the probe can check, not a hope.
- **It converges while `tan β < 1/L`**, where `L` bounds `|s|`. The bound degrades
  exactly where `C-FIT` bites, so the doorstep and the solver fail together rather than
  the solver silently diverging inside the admissible region.

### ⚠ `P4` is falsified on paper — a spoke's capsule does not bound its disc

The design above hoped the proxy would fall out of `hex_body::bone_obb`. Working the
algebra says it does not, and it is worth stating before anyone builds it.

`bone_obb` bounds the **capsule** of a bone: for a spoke of length `R` and half-width
`ω` it returns half-extents `(R/2 + ω, ω)`. A wheel's shape is the **disc** — every
point within `R` of the hub in the wheel plane. The disc reaches `R` in *every* in-plane
direction; the spoke's OBB reaches `ω` perpendicular to the spoke. So

```
  disc ⊄ bone_obb(spoke)      whenever ω < R
```

which is always. **`I4` is violated — the proxy would miss overlaps**, the one thing a
proxy may never do.

The wheel therefore needs its own shape, and it is trivial: the OBB with half-extents
`(R, R, t/2)` in the wheel frame, `t` the width. Then

```
  disc ⊆ OBB                  exactly
  vol(OBB)/vol(disc) = 4R²t / πR²t = 4/π ≈ 1.2732
```

— **bounded and stated**, which is what `I4` asks. So the connector carries a **shape
kind per node** (capsule for a bone, disc for a wheel, box for a chassis) and derives
the proxy from *that*. Still derived, never hand-authored; just not inherited.

This shrinks the claim exactly where the design said it might: the connector's payoff
is one home for the connection, not free collision. It is worth building anyway, but on
the smaller argument.

---

## The steps

Each ships alone, is testable in loft with no server, and carries a **control** — a
knob that must make its own test fail, because a gate nobody has seen fail is not a
gate. `slip` is the model: `hex_body` keeps a deliberate-defect term precisely so
`wheel_skid` cannot pass vacuously.

| | step | proves | control | size |
|---|---|---|---|---|
| **C0** | run `P1`–`P3` (`P4` is answered above) | the design before the code | — | S |
| **C1** | `Connector` + `connector_admissible` + `write`/`read` | `C-TOPO`, `C-EXACT` | a forward parent reference; a relabelled tree; a truncated text — each must be **refused**, not repaired | S |
| **C2** | mount composition — `node_frame(tree, i)` | `C-RIGID` | a `scale` term, defaulting to 1, wired into `Mᵢ`. Set it to 1.01 and the isometry test must go red | M |
| **C3** | embed a `hex_body` rig at a node | `C-PLANE` | the same scale knob, applied to `ι` | S |
| **C4** | **the cart as data** — three nodes, no behaviour change | that the structure can express what exists | *the previous implementation itself*: assert the connector's transforms equal the hand-composed ones **to the bit**, on flat ground | M |
| **C5** | the frame solve as a pure function | `C-GROUND`, `C-FIT` | pin the frame to a constant and the gap clause must go red (**already demonstrated** — 0.204 wu) | M |
| **C6** | per-node shape and its proxy | `C-PROXY` (`I4`) | a shape deliberately one size too small; the containment test must catch it | M |
| **C7** | the editor switches over; `cart.mjs` loses its axle clause and its `1.1` | the whole thing, in a running world | the stretch mutation (**already demonstrated**) | M |

**C4 is the safety step and the reason this order is safe.** Before any behaviour
changes, the connector must reproduce the transforms the current code produces —
*byte-identical, on flat ground, where the two agree by construction*. That converts
"did I break the cart" from a judgement into a diff. Only C5 then changes what the cart
does, and it changes it in one place, with the gap clause already known to go red.

**What is testable without a world, and therefore where the tests go.** `C1`–`C4` and
`C6` are pure functions of their arguments — no terrain, no wire, no browser — so they
are loft tests in `lib/moros_sim/tests/`. Only `C5`'s *sampling* touches terrain and
only `C7` needs a server, which is why `cart.mjs` shrinks to the single clause that
genuinely needs a running world.

**Property, not example.** `C-RIGID` is checked by generating point pairs and mount
angles and asserting `‖Wu − Wv‖ = ‖u − v‖` across them — not by placing one cart and
eyeballing one distance. The float composition will drift; the test asserts the drift
**bound** and the suite records it, the way `wheel_skid` records machine-ε rather than
claiming algebraic zero.

---

## What would say this is right

Not "the cart looks better". The design is validated when:

- the wheel offset appears **once** in the tree, and the sentinel finds no second home;
- the axle length is measured from the **broadcast transforms** and is invariant under
  bank, seen red under a deliberate stretch;
- every wheel's gap to the ground is **zero within a skin** on a slope, seen red when
  the frame is pinned to a constant;
- the run that proves it **actually reached a slope** — a bank clause, because on flat
  ground every one of the above passes trivially and proves nothing;
- and the steep case **refuses with a residual** rather than reporting success.
