# STATE.md — where the editor work stands (2026-07-29)

A handoff. What exists, what was decided, what is open. The durable *architecture* lives in
[EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md); the *changes* live in the tracker
(`gh issue list -R jjstwerff/moros --label plan --state all`). This file is the bridge
between them: read it first after a break.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).

## ⏭ PICK UP HERE (2026-07-29, end of session 3)

**The cart's two visible defects are fixed and gated; the design for doing it properly is
written and not built.** In priority order:

1. **`A0` — run the remaining probes in `plans/14-props-dressing/CONNECTOR.md`.**
   **`P7` is RUN, both halves, and it is not falsified** — `probe/skin_joint.loft` (the
   hip, six cases, four required red) and `probe/wing_skin.loft` (ten stations plus a
   fold). **`A-SKIN` stays a constructor rule: no deforming skin, so the design stays the
   size it is.** The bound is the **per-joint angle alone** — the step overlap leaves is
   `cos θ(1 − cos θ)/2` of the local thickness, free of the wing's size, `N`, chord and
   taper. A 60° flex over ten stations leaves 0.27 %; a 60° *fold* in one joint leaves
   12.3 % and is the case overlap does not serve.
   ⚠ The hip's prediction into the wing (*"the stations are the same size, so an overlap
   must protrude"*) was right about the mechanism and **wrong about the magnitude** — the
   overlap's own depth is `a·sin θ`, so the seam is first order and the step is second.
   **`P3` is RUN too** (`probe/three_mounts.loft`) — **confirmed for REACH, refuted for
   RANK**. Three zero-offset mounts reproduce every one of 756 independently-built
   axis-angle targets to 28 machine epsilons, and `A-RIGID` holds through the chain. But
   `|det[a₁ a₂ a₃]| = |cos β|` exactly, so at `β = ±90°` **the ledger counts three states
   and the joint delivers two**. The line that follows is on the design's own axis: three
   mounts are **sufficient for a `DRIVEN` 3-DOF joint** (angles → pose never inverts
   anything) and **singular on a set for a `SOLVED` one**. `A-DOF` counts *nominal* states.
   ⚠ Carry this: **the gimbal branch is load-bearing only for AUTHORED poses.** A composed
   `Rz·Ry(π/2)·Rx` leaves ~1.6e-15 in `cos β` and `atan2` divides it straight out; a matrix
   read from text — which is how `A-EXACT` says an assembly arrives — has literal zeros and
   the naive decomposition misses by 2.0. The first control passed and was worthless.
   **`P5` is RUN too** (`probe/towed_chain.loft`) — **not falsified**. Forward, a steady
   turn settles exactly where the closed form says (worst departure `5.9e-9`), and the
   reversal diverges at exactly `|v|/L₁`, with **halving the step moving the rate by
   1.1e-14** — which is what says the jackknife is the geometry and not the integrator.
   Two things to carry into the build:
   - **A new doorstep, `R ≥ √(Σ Lᵢ²)`** — below it no steady state exists. ⚠ **The LAST
     cart sets it**, not the longest link: `L₁ = 1.6`, `L₂ = 1.2` gives 2.0, where cart 1
     alone would manage 1.6. And the solve goes marginal exactly where the doorstep bites,
     the same shape the cart's bank solve already has.
   - ⚠ **A chain AMPLIFIES, and the obvious prediction is wrong.** The downstream hitch
     grows at **1.286**, faster than *both* eigenvalues (0.625, 0.833), because it starts
     at zero and is *driven* by the hitch ahead — the linearised pair is a difference of
     two exponentials. The transient cannot be waited out. So "the shortest link folds
     first" understates it: the last cart folds sooner than its own length predicts.
   The design gained one ⚠ from this: **`DRIVEN` hides two cases.** A *commanded* angle
   cannot run away; an *integrated* one can, because its equilibrium may be unstable — and
   there no amount of exactness helps, only a declared limit.
   **`P6` is RUN too** (`probe/bend_bones.loft`) — **not falsified**, and the answer is
   sharper than the question. A cantilever cut into `N` bones, each hinge turning by
   `M(xⱼ)·ℓⱼ/EI`, matches closed forms derived by hand to `2e-12`:
   - **root hinge `ℓ = h`** → relative error `2/N + 1/N²`, **first** order
   - **root hinge `ℓ = h/2`** → relative error `1/N²`, **second** order

   **One half-step at the clamped end is the whole difference.** At the ten stations `P7`
   used, that is **21 % against 1 %** — so *"more bones on more joints"* is the right
   representation and the naive discretisation of it is not. The order survives a 35.9 %
   shortening (self-convergence, stated as such).
   ⚠ **The `SOLVED` fixed point is only LINEARLY convergent** — 78–104 passes to `1e-12`,
   near enough independent of `N`, where the ground contact's is quadratic. `A9c` should
   budget ~80 rounds a tick or damp it.
   ⚠ And the first run measured it wrong in a way worth keeping: **a closed form is only a
   reference inside the regime it was derived for.** `wL⁴/8EI` is the small-deflection
   solution, so running the sweep at a tip deflection of a full span measured the geometric
   nonlinearity and called it discretisation error.
   **`P1` is RUN, so `A0` IS COMPLETE — every probe run, none falsified.**
   `probe/rig_place.loft` (pure) + `probe/rig_place.mjs` (the wire). `rig_world_seg` alone
   is **not** enough and never was the claim: it carries a base point and one in-plane
   direction, so 3 of a render transform's 6. The pair **(node frame + rig segment) is the
   whole of it** — `T_body · translate(0,0,±w) · rotZ(spin)` reproduces the broadcast wheel
   matrices to **`5.6e-17`** on a slope with a spun wheel, and dropping the offset, the spin
   or the bank each breaks it (0.55 / 1.99 / 0.083). **No third source.**
   - **The spin IS in the segment**, which is the opposite of the intuitive answer:
     `hex_body` models a wheel as a **spoke**, not a disc, and a spoke's direction is the
     spin. Joint values are in TURNS, so the rig's joint value *is* `wheel_value`.
   - **The winding is not** — `v` and `v + k` turns give identical segments. Rendering
     loses nothing; anything counting revolutions must read the **state**, not the pose.
   ⚠ **A flat world made the convention check vacuous.** `T_body = translate·rotY·rotX`
   read exactly 0 while `rotX` was **transposed**, because on flat ground that rotation is
   the identity. *"On flat ground the rest passes trivially"* is already in the design's own
   checklist; this is its second instance, and this time it hid a live defect.

2. ✅ **`A1` is BUILT** — `lib/moros_sim/src/assembly.loft`, 20 tests, **523 green** across
   the five packages, all 52 functions in the package entered. An `Assembly` is a tree over
   **bodies** with the link as the edge, mirroring `hex_body::Rig`: canonical labelling by
   index order, a strict parser, a byte-exact round trip, and the same refusal contract —
   **a malformed text reads back EMPTY**, which `asm_admissible` rejects.
   **Seen red twice**: stop refusing a forward parent → two clauses fail; make the reader
   ignore the header count → two more fail.
   - ⚠ **`Carried` on the root is now the type error the design predicted** — *"GROUND
     support does not apply, which is a type error rather than a debugging session six
     steps later"*. One line.
   - **`asm_towed` is the fixture that matters**: a horse with a cart behind it whose
     support is **`Ground`, not `Carried`**, because it has its own wheels. That is the case
     the design's first draft got wrong, and it is the first two-level tree.
   - **No wheel radius in `asm_cart`** — it is a *shape*, and shapes arrive at `A9`.
     Carrying it now would be a home for a number with no reader.

3. ✅ **`A2` — the DOF ledger — is BUILT**, 15 tests, **538 green** across the five
   packages, all 65 functions in the package entered. Three lines of arithmetic plus one
   bound reproduce **every row** of `A-DOF`'s own table:
   ```
   dof_link:    none 0 · mount/shaft/spring 5 · hitch 3 · tether 1 (taut)
   dof_support: unsupported/carried 0 · buoyant 1 · ground min(contacts, 3)
   ```
   **`GROUND_MAX = 3` is the interesting part** — a fourth contact on a rigid body is
   redundant with the first three, and that single bound turns the design's prose into
   arithmetic: the towed 4-wheel trailer comes out **over-constrained by exactly 1**
   (*"the 4th wheel"*), and **today's cart reports 5** with a residual of 1. Its two wheels
   close, so what is under-determined is the chassis's pitch and nothing else.
   - **The hitch is measurably what completes the cart**: the same chassis is 5 loose and 6
     hitched, the hitch supplied exactly 3, and 2 of its own states became the horse's.
   - **A slack tether closes exactly when the taut one does** — the released degree becomes
     a state, so one declaration covers both and `A-TAUT` can stay a reported doorstep.
   - **Rigid shafts on the ground are over by 2**, which is true, not a bug — the ledger
     says where a `SPRING` goes.
   - ⚠ **`bd_contacts` was added by `A2`, not foreseen by `A1`.** Nothing was on disk yet so
     the format grew for free; **after `A5` it would have been a version bump** — a second
     argument for keeping the ledger ahead of the geometry.
   - ⚠ **It counts NOMINAL degrees**, and `P3` found a mechanism that passes the count while
     losing a direction. A closed ledger is necessary, not sufficient.
   **Seen red under three mutations**: `GROUND_MAX = 4`, a support giving one degree too
   many, and a hitch that removes 5.

4. ✅ **`A3` is BUILT** — `lib/moros_sim/src/frames.loft`, 14 tests, **552 green**, all 83
   functions in the package entered. `asm_frames` composes
   `Wᵢ = W_p · translate(offset) · rot(axis, τ·value)` in one pass, which `A-TOPO`'s order
   makes sufficient. `A-RIGID` measured over 12 value sets × 8 off-axis pairs × 11 frames,
   ten levels deep: at the float bound, and asserted **non-zero** so an algebraic zero
   cannot mean the measurement stopped running. The `scale` knob is a **parameter, not a
   field**, so no defect rides in the format.
   ⚠ **`A3` AMENDS `P1`: a parallel offset hides the composition order.** A wheel's offset
   lies *along* its spin axis, so `T·R` and `R·T` are bit-identical for a wheel — `P1`'s
   `5.6e-17` never distinguished them. Measured **0.0000 for the cart, 1.095 for a wing
   station**. The order is invisible exactly when the offset is parallel to the axis, which
   is true of every hub, kingpin and wheel — **every case this design started from**. Both
   cases are clauses now, the negative one included.
   - **The axis is normalised where it is used** — `A1` requires non-degenerate, not unit.
   - **`TURN == hb::wheel_angle(1.0)` is asserted**, so the second home is a checked alias.
     A value of 1 turn must return every frame exactly, which is `P1`'s winding result from
     the other side.
   - **`asm_frames` refuses rather than guesses**: a `HITCH` does not determine its child's
     frame, so a non-`MOUNT` chain returns empty — `asm_read`'s contract.
   **Seen red** three ways: no axis normalisation, values as radians, reversed order.

5. ✅ **`A4` is BUILT** — `A-PLANE`, 10 tests in `tests/embed.loft`, **562 green**, all 89
   functions in the package entered.
   ⚠ **`A-PLANE` is TWO claims and the design's knob can only fail one.** `iota` scales the
   plane → breaks the isometry, **leaves the image planar**; `warp` tilts z with x → breaks
   planarity. So there are two knobs, and a test asserts the scale *cannot* fail the plane
   clause — which makes the second knob a measured need, not a preference.
   - **A bone's length is `rg_len[i]` at every joint value** — `I6` into 3D, checked on a
     spoke and a two-bone arm so the rig's own kinematics is in play too.
   - **Planarity survives `A3`'s chain** without being re-established: a plane maps to a
     plane under `SE(3)`. Measured at station ten of a wing.
   - **`seg_plane_angle` recovers a spoke's spin** from the embedded segment, agreeing with
     `wheel_angle` to the float bound — `P1`'s result as a *function*, not a wire read. And
     the cart's wheel is now rebuilt from the library with **no server**.
   **Seen red three ways**, and *which* clauses fail is the evidence the two claims are
   separate: `y = 0` instead of `z = 0` breaks 5; the wrong normal column breaks 4 (plane
   only); `iota` defaulted to 1.01 breaks 1, because `rig_seg_at` threads its own default.
   ⚠ **A4 does NOT store rigs in the document**, deliberately — a rig is multi-line, so the
   format needs a **section**, the same call the world file already made. That is `A5`'s.

6. ✅ **`A5` is BUILT** — the cart is data. `tests/cart_as_data.loft`, **217 green**, all 93
   functions entered. The transcribed `cart_send` composition and the data-driven path agree
   **to the bit**, flat and banked; four clauses vary one number in the assembly and require
   the frames to follow, so a composition carrying its own literals could not pass.
   ⚠ Bit-identity against mesh3d's `Mat4` arithmetic is **not** claimed (different summation
   order); `P1`'s `5.6e-17` is the cross-implementation half.
   - **The radius arrived, and as a rig** — a wheel is a spoke of length `radius`, so it is
     `rg_len[0]` with one home, and `A9`'s shape derives from it. Both wheels share one rig.
   - ⚠ **mesh3d's `rotate_x`/`_y` turn the OPPOSITE way from the editor's own `rotate_z`.**
     `rotate_x` is Rodrigues about **−x**. The wheel path is unaffected (spin is about +z in
     both); **the bank and yaw are `A6`'s** and this is written down so A6 does not
     rediscover it. A test pins it, and it is the only guard — the bank cancels in the diff.
   - ⚠ **`hex_body`'s `rig_read` is lenient** where its comment claims strict (a bone line
     missing its trailing `hi` parses as 0). Rather than change a library two consumers read,
     `A-EXACT` is enforced **at the seam**: each rig block must write back to itself.
   - ⚠ **A mutation did NOT go red and found an unchecked clause** — nothing tested a
     *trailing* line. Added; it catches the mutation now.
   - ⚠ **Interpreter SIGSEGV filed as [loft#677](https://github.com/loft-lang/loft/issues/677)**
     — appending to a struct's vectors through two by-value levels with the return discarded.
     Four closer minimal cases did not reproduce it. `wa:clean`: **the parsers are pure now**.
     Second time this idiom has bitten Moros; #670 was the silent-write half.

7. ✅ **`A6` is BUILT — and starting it found a LIVE DEFECT in the shipped cart.**
   `lib/moros_sim/src/ground.loft`, 11 tests, **583 green**, all 98 functions entered. The
   terrain arrives as a **function argument**, so every clause is pure and the answers are
   closed-form: `β = −atan(s)` and `y = g(centre) + R` to the float bound.

   ⚠ **THE CART BANKED THE WRONG WAY SINCE RUNG 10a, AND BOTH GAP CLAUSES READ ZERO.**
   Measured off the wire: true gaps **+0.0914 / −0.0914** (one wheel floating 9 cm, one
   buried 9 cm) while `gapl`/`gapr` reported ~0 and `cart.mjs` was green. Cause: mesh3d's
   `mat4_rotate_x` turns about **−x**, so the solve's bank was applied inverted. Neither
   clause could see it — the gaps were the solve's *own arithmetic*, and the axle is a
   *length*, which tilting the wrong way does not change. **Fixed in `5ffdf2c`**: the sign
   converted at one named site, and the lift now **read from `base.m[9]`**. Reverting the
   sign alone now turns the gap clause red too. 23 gates green.
   - **`A-GROUND` is measured from the FRAME** in the library — `frame_apply` for the hub,
     terrain at the hub's own x/z. A wrong pose cannot report a right gap. Mutation 2 is the
     proof: re-deriving the gap breaks **five** clauses.
   - **`A-FIT` refuses**: a cliff returns a named reason, an offer (±2w) and a residual, and
     keeps the last admissible bank rather than a NaN.
   - ⚠ **The convergence clause guessed and was wrong.** It asserted a magnitude (1e-6 after
     three rounds) instead of the design's *prediction* (rate `≈ s²`), and failed. Now it
     asserts the **ratio** over four round counts. *A prediction can be tested; a threshold
     can only be tuned.*
   **Seen red** three ways: inverted bank (6 clauses), re-derived gap (5), clamp instead of
   refuse (2).

8. ✅ **`A7` is BUILT** — the first *second frame*. 12 tests in `tests/hitch.loft`,
   **595 green**, all 104 functions entered.
   **The ledger dictated the geometry.** `hitch removes 3 (position) · contacts give 2 ·
   yaw 1` says the child's position is the pin's business and its two remaining rotations are
   what its contacts supply — so the solve is a two-unknown fixed point about a fixed pin:
   `sin θ = (P_y − h)/L` for pitch, `sin φ = d/(2w·cos θ)` for roll. The counting rule was
   written before this geometry existed and it named the unknowns, which is the design's
   *"A-DOF was the right invariant"* coming out in favour.
   - **`A-HITCH` holds by construction** — the hitched frame's ORIGIN is the pin, so the pin
     from either side is one point (measured anyway, over eight yaws).
   - **Both bodies touch at once** on terrain sloping in both axes, and a cart behind a cart
     works — three frames, no special case.
   - **A second doorstep**: the pin can be further above the ground than the drawbar is long,
     and no pitch reaches it. Named refusal, offer, residual — `A-FIT` twice from one body.
   - **`SHAFT` is over-constrained in the geometry exactly as `A2` counted it** — inheriting
     the horse's pitch and roll lifts the cart's own wheels off a cross-slope. The ledger's
     *"over by two"* is a measurement of where the `SPRING` has to go.
   ⚠ **A `cos(pitch)` factor nearly shipped.** The height difference across the axle carries
   a `cos θ`, so the two closed forms are coupled. Without it the solve converged on terrain
   sloping along ONE axis and failed on two — the single-axis clauses passed. **An
   axis-aligned fixture cannot see a cross-axis error**: same shape as the flat wheel and the
   flat-ground convention check.
   **Seen red**: no `cos(pitch)` (4 clauses), axle from a literal (1), frame origin at the
   axle instead of the pin (6).

9. ✅ **`A8` is BUILT** — `lib/moros_sim/src/tether.loft`, 12 tests, **607 green**, all 109
   functions entered. **The sign is a returned value**: `rp_pull` is ≤ 0 for a rope always,
   and > 0 the moment a rod holds the crate from the inside. *"Only the sign of the constraint
   tells you"* as a number rather than a remark.
   - A rod with the crate 1 wu inside a 3 wu rope reports `rp_pull = 2` and drives it 2 wu
     further out — a shove upward on the anchor. The rope goes slack and does nothing.
   - ⚠ **Outside the ball a rope and a rod are indistinguishable** to the float bound, so a
     test that only pulls cannot tell them apart. The control has to put the crate INSIDE,
     which is why the design specified it that way.
   - **Slack removes nothing**, so `A2`'s slack ledger carries one state more and still closes
     at six — checked against the geometry both ways.
   - **`CARRIED` is visible in the signature**: nothing in the file takes a terrain sampler,
     because a dangling crate has nowhere to consult one.
   ⚠ **A crate CONSTRUCTED on the sphere read as slack** (`dist − L` = ±1e-16 — an exclusive
   test on the boundary is a coin flip). **Third float boundary in this plan.** The fix
   separates the **state** (a doorstep with a named `TAUT_EPS`) from the **projection**
   (strict, only for a real outward violation) — which keeps `rp_pull ≤ 0` a property of the
   mechanism and not of a clamp. A clamped sign would have made the control pass for the
   wrong reason.
   **Seen red**: rope-is-really-a-rod (4 clauses), unclamped pull (3), projecting along the
   vertical instead of the rope (1).

   **A7 and A8 were the steps the design said would decide it** — *"if the structure holds for
   both without a special case, `A-DOF` was the right invariant."* It held.
10. ✅ **`A9` is BUILT** — `lib/moros_sim/src/shape.loft`, 13 tests, **620 green**, all 124
    functions entered. Three kinds with derived proxies and **stated** overshoots: a disc's is
    `4/π` = `1.27324` exactly for every `R` and `g`; a capsule's brackets between `6/π` (a
    sphere) and `4/π` (long and thin); a box's is 1.
    - **`I4` is stated two ways**: over a volume grid via `shape_has` (the invariant as
      written, which keeps the shape's own definition checked) *and* on each surface, where
      the extremes a grid misses live.
    - ⚠ **`P4` is a clause now, not a memory.** A test asserts `bone_obb`'s `(R/2+ω, ω)` box
      does **not** contain the rim at `(0, R, 0)` while the derived `(R, R, g)` does.
      Restoring the inherited proxy turns **6 clauses** red.
    - **Extents derived, girth declared.** A wheel's radius is its rig's `rg_len`; girth 0
      means *no shape declared* (a real case), and a negative girth is refused.
    ⚠ **A single number cannot describe a box.** The first version put a chassis's derived
    reach on `x`, so the cart's wheel mount at `(0,0,±half)` fell **outside its own body's
    proxy**. The clause that caught it — *"a body's proxy contains what is bolted to it"* — is
    the question worth asking of any derived extent. Fixed per axis, girth as a floor.
    **Seen red**: inherited proxy (6), `shrink` left at 0.99 (6), box axes collapsed (1).
    ⚠ **The `??` precedence trap bit twice this session**: `x < 4.0 / PI ?? 0.0 + 0.01` is
    `x < (4.0/PI ?? (0.0 + 0.01))`. Discharge into a local and compare that.

11. ✅ **`A9b` is BUILT** — `lib/moros_sim/src/skin.loft`, 11 tests, **630 green**, all 130
    functions entered. `skin_fit` takes the joint's **range** and returns the parent amended so
    `A-SKIN` holds; the overlap it produces is `0.03405751452835025` — the editor's
    `hip_overlap()` to the last bit. The unamended hip opens a pocket at every nonzero angle
    and the amended one at none; ⚠ the fit is **tangent**, so sweeping past `θ_max` reopens it.
    - **The first question is still "is any needed"**, not "how much": an interior pivot opens
      no wedge, and two clauses make that the pivot's placement rather than something about
      arms.
    - ⚠ **THE FIRST VERSION REFUSED THE REAL SHOULDER.** It treated a child reaching past its
      parent out of plane as a refusal — which sounds right and is wrong, because **a face with
      nothing above it is not a pocket**. The margins decide whether the overlap **hides**, not
      whether the seam closes: negative margins mean it *shows*, reported as an approximation
      with its residual (`K-FIT`'s third state). **Visibility is not correctness.**
    - ⚠ **The march reached the parent's whole height**, quantising the depth to 2 cm so it
      could not be compared with the closed form. A pocket is only as deep as the face's own
      half-extent. *An instrument whose resolution is set by the wrong quantity cannot check an
      equality.*
    **Seen red**: overlap zeroed (5 clauses), overhang clause dropped (1 — the shoulder, as it
    did in `P7`), every pivot treated as interior (4).

12. ✅ **`A9c` is BUILT** — `lib/moros_sim/src/bend.loft`, 11 tests, **639 green**, all 134
    functions entered. **The unification is literal**: `wing_bend`'s loop calls `asm_frames` for
    the shape and reads the moments off the frames it gets back, and its values are in
    `asm_frames`' own unit, so the bent wing poses through `A3` with nothing in between.
    `A-RIGID` still holds on it.
    - **The control holds**: a load past a joint limit is REFUSED with a reason, the limit as
      its offer and the overshoot as its residual, and every value handed back is admissible —
      it does not fold through itself.
    - ⚠ **`BEND_ROUNDS = 100`**, because this fixed point is only *linearly* convergent. Three
      rounds — right for `A6` — leaves a residual a thousand times the settled one.
    - ⚠ **`P6`'s end rule needed its condition restated.** It is *"has no bone inboard of it"*,
      **not "is the first joint"**: applied to `asm_wing`, whose first mount is a whole span out,
      the end rule made the answer WORSE (12.4 % under vs 5.6 % over). Hence `asm_cantilever`,
      plus a clause asserting the knob does nothing on `asm_wing` — the honest negative.
    - ⚠ **No absolute accuracy is claimed.** Four attempts kept measuring this fixture's
      *indexing* rather than the rule. Self-convergence is what is asserted, as `P6` did for its
      nonlinear half, and the reconciliation is now in CONNECTOR's **Open**.
    **Seen red**: silent clamp (1 clause), folding through the limit (1), budget dropped to 3 (1).

13. ✅ **`A10` — THE EDITOR IS SWITCHED**, and the diff is empty. Over four rolls on a slope,
    fresh servers before and after, **every transform element and every pose field differ by
    exactly 0** — `A5`'s discipline applied to the real switch. All 23 gates green.
    - **The wheel offset went from THREE homes to one**: render transform, contact solve and
      `cart.mjs`'s `1.1` → `asm_cart`, read by `asm_frames` and `body_axle`. The radius comes
      from the rig's `rg_len`.
    - **`cart.mjs` lost its axle clause and its `1.1`.** `A-RIGID` is a property test with a
      `scale` knob; asserting the axle in a browser would re-check the library's arithmetic.
      What stays is what needs a running world: the wheel arithmetic, the gap, `bankSigned`.
    - **The base frame no longer negates the bank** — `ground_frame` is Rodrigues, in the same
      sense as `sin β = d/2w`, so the compensation for mesh3d's transposed `rotate_x` is gone.
    - ⚠ **The yaw's sense is now the standard one and was reversed before.** Unobservable
      today (`cart_yaw` ≡ 0 — exactly why `P1` could not pin it), and the thing to know when
      something first turns the cart.
    ⚠ **The solve switch is NOT done**, and [loft#682](https://github.com/loft-lang/loft/issues/682)
    is why: `ground_axle` takes the terrain as a **function**, and a lambda capturing the
    `World` **panics the interpreter**. Isolated in three runs (import alone fine, capture
    crashes, capture removed fine), and ⚠ the panic surfaces in `edges_around`'s `edgeset_new`
    ~900 lines away, so the reported site is useless for bisecting. **Third store-lifetime
    defect this plan hit** — #670, #677, #682, all "a value that outlives the expression that
    made it, reached indirectly". The editor keeps its own copy of the fixed point until it
    lands; everything else on the cart's path is the library's.
14. ✅ **The `field.mjs` flake is FIXED, and it was never intermittent** — it read
    **0 vertices on every run** once the guess stopped winning the race. Line 94 was
    `await wait(1200)` before counting the field mesh: the exact defect this file's own
    comment warns against (*"WAIT FOR THE SERVER, NOT THE CLOCK"*), with two sleeps
    surviving the earlier sweep.
    - **The fix is `await ack('rebuilt')`.** The server broadcasts `S:rebuilt N chunks`
      after the whole `Z:1` … `Z:0` transaction, deliberately, so a client can learn the
      **picture** caught up and not merely the world. Six runs: 3150 every time. Control:
      skip the ack and it reads 0 on every run.
    - **The refusal path got a sequencing barrier**, not a sleep — a refusal produces no
      rebuild, so an ack that arrives *after* it proves anything the fill emitted has
      arrived too. The wire is ordered; `wait(400)` proved nothing.
    - **The claim is `> 0`, not a count.** A dirty chunk that is not on screen is dropped
      by design, so the number counts *loaded* chunks; pinning 3150 would assert the
      streamer's timing rather than the fill's boundedness.
    - **`straight.mjs` had the identical defect** — `await wait(2500); // let the rebuild
      land`, naming the very thing the server announces. Same one-line fix, four runs
      stable at 1200 vertices.
15. ⚠️ **THE CLOCK IS OUT OF FIVE MORE GATES** — the title of this item used to read
    *"out of the gate suite"*, and **that was wrong**. See item 19: eight gates still
    pace by the clock, and `terrain.mjs` was failing three runs in four because of it.
    The audit behind this item grepped `await wait(`, which misses a file that wraps
    its own `setTimeout` — `terrain.mjs` does exactly that. — the remaining four are done, and taking
    the sleeps out found a **third live defect in shipped code**. `import.mjs` needed
    *nothing*: the `dressing` read-back already orders it. `vegetation.mjs`'s
    floor-plus-settle heuristic collapsed to two lines. `persist.mjs` lost `settle()`
    entirely for `saved`/`rebuilt` acks. `road.mjs` had six sleeps **and no status
    collector at all**, so it could not have waited for anything; `stencil.mjs` had twenty.
    - ⚠ **A RAISE TOOK ITS ORIGIN FROM A CELL THAT UPDATES ONCE PER TICK.** `MSG_RAISE`
      anchored its `hex_distance` ruler at `last_hq`/`last_hr` — written only by the
      streaming block, only when the hex changes — while the ray it measures already
      walked out from the current `px`/`pz`. Two positions in one measurement. Teleport
      and raise in the same breath and the hill landed **underfoot** (+7 at hex (10,0),
      0 at (20,0)); after one tick, correctly at (20,0). That is the exact failure the
      handler's own ⚠ about the search bound exists to prevent, arriving by another door,
      and the **third** instance of this family in `editor_server.loft` — the road once
      stamped at `last_hq` too. Same fix: derive the cell from the position.
      `probe/raise_origin.mjs`, fixed in `src/editor_server.loft`.
    - **It was invisible even to an ack.** `ack` polls at 100 ms and a tick is ~16, so the
      acknowledgement's own granularity covered the gap *by accident*. The probe sends
      both commands with nothing between them — which a probe may do and a gate may not.
    - **The ORDER of two waits is a guarantee, not a style choice.** In `road.mjs` the
      rebuild wait goes *before* the `10:0` toggle: a placement marks dirty and acks in
      the same handler, so when `placed` arrives the flush is necessarily still pending.
      After the toggle there may be nothing left to wait for, and `S:rebuilt` is broadcast
      only when `nrebuilt != 0` — so a missing rebuild is a 40-second stall, not a no-op.
    - **`road.mjs`'s recorded `span 34` was stale**; correct code measures **33** on every
      run. Updated to what it actually produces.
    - Verified: **23 gates green on three consecutive full runs, every number identical**,
      and 639 library tests pass. Only the `ack` poll's own `wait(100)` remains anywhere.
16. ✅ **`make tests` runs again — `nyc: not found` was TWO faults in one message.**
    The npm script still named `nyc` after the project moved to `c8` (the move
    `"type": "module"` forces, since nyc cannot instrument ES modules — `c8` was
    already sitting in `devDependencies`), **and** a clean checkout has no
    `node_modules`, so the runner was missing whatever it was called. Fixing only the
    script leaves the target broken on a fresh clone.
    - `package.json`: `nyc --reporter=html` → `c8 --reporter=html --reporter=text`.
      The text reporter is new — an html-only run wrote a file and printed nothing,
      so the target said nothing about the coverage it had just measured.
    - `Makefile`: `tests` now has a `node_modules: package.json` prerequisite, so it
      installs what it needs instead of assuming someone did it by hand.
    - ⚠ **`test/package.json` is LOAD-BEARING and looked like litter.** It is not a
      dependency manifest — nested lists are never installed, so its contents
      (including a `nyc` dev-dep) were decoration. It exists for one field: the root
      is `"type": "module"`, these tests are CommonJS, and this file scopes
      `test/*.js` back. **Measured**: remove it and all 39 die at line 1 with
      `require is not defined in ES module scope`. Rewritten to say so, because the
      next person to tidy up would have deleted it.
    - **39 passing, 96.5% statements**, from a genuinely emptied `node_modules`; a
      second run does not reinstall. **Seen red**: a wrong expected value gives
      `make` exit **2**, 1 failing — a test target that stays green when tests fail
      is worse than one that will not start.
    - ✅ **The 6 audit findings are FIXED** — see item 17.
    - ✅ **`moros@0.4.2` is REMOVED from `dependencies`** — an unrelated third party
      (*"Functional DOM processing abstractions"*, deprecated, *"renamed to domina"*),
      almost certainly an `npm install moros` typed inside the moros project. Nothing
      in the tree imported it under any form, including subpath imports, and it had no
      dependencies of its own. Verified by clean install: 172 → 171 packages, its
      deprecation warning gone, `npm ls moros` empty, 39 passing at the same 96.52%.
      The 6 audit findings are unchanged by it, which confirms they were never its.
17. ✅ **`npm audit` reads 0 — and the lesson is that it read 0 on a BROKEN tree first.**
    All six findings were transitive under mocha and **no released mocha fixes them**:
    `latest` *is* the installed 11.7.6, `npm audit fix` proposes **11.3.0 — a downgrade
    below the declared `^11.7.5` floor**, and upstream's real fix (mocha 12: `diff ^9`,
    `glob ^13`, `minimatch ^10.2.2`, `serialize-javascript ^7.0.2`) is still at rc.
    So four `overrides` in `package.json`, and one of them is not what audit asked for:

    | override | why |
    |---|---|
    | `brace-expansion ^5.0.8` | the **only** patched version — the advisory range is `<=5.0.7`, so the entire 2.x line mocha sits on is inside it |
    | `minimatch ^10.2.2` | **forced by the above.** brace-expansion 5 replaced `module.exports = expand` with a named export; minimatch 9 calls the old shape |
    | `serialize-javascript ^7.0.7` | mocha's parallel-mode worker serialisation |
    | `diff ^8.0.4` | mocha's assertion-failure formatter |

    - ⚠ **THE FIRST ATTEMPT AUDITED CLEAN AND WAS BROKEN.** Overriding
      brace-expansion alone gave `found 0 vulnerabilities` **and** 39 passing, while
      any brace in a glob threw `(0 , brace_expansion_1.default) is not a function`.
      Mocha's default spec contains no braces, so neither the audit nor the suite
      noticed. A green audit is not evidence the tree works, and a green test count is
      not evidence either — the coverage of the *dependency's* API is what mattered.
    - ⚠ **AND MY FIRST DISCRIMINATOR WAS INVALID.** `mocha 'test/{a,b}.test.js'` fails
      with *"No test files found"* — but it fails **identically on the un-overridden
      baseline**, because mocha never expanded braces in that argument. It looked like
      a regression and was not one. The valid probes call `minimatch` and `globSync`
      **as mocha resolves them**, with the baseline tree as the control.
    - **Four probes, baseline vs overridden, and they agree exactly** (`minimatch`
      brace match `true`/`false`; `globSync` on a brace, a star, and an extglob
      negation all returning the same two files) — so this is equivalence, not merely
      absence of a crash. Only the versions differ: minimatch 9.0.9 → 10.2.6.
    - Also verified: 39 passing serial **and** `--parallel` (which is the only thing
      that exercises serialize-javascript); the red path renders its diff (`-3` /
      `+999`, `make` exit 2); `eslint` clean on plain and brace patterns, since the
      overrides are tree-wide; 0 vulnerabilities.
    - The reasoning lives in the `Makefile` beside the `tests` target, because a bare
      version pin with no explanation is exactly what a later tidy-up deletes.
18. ✅ **`occlude.mjs`'s sampling is fixed — and it had been measuring a camera still
    in flight.** The last drifting gate. `placeAt` read the eye `await wait(1500)`
    after a placement; the ease past a wall takes about **2.5 s**, so every reading
    of `beside_wall` was mid-move — **0.42 wu short** of where the eye comes to rest
    (4.927 measured against a true 5.346). The wandering last digits that started
    this were the symptom; the wrong number was the disease.
    - **Three wrong explanations were measured out of the way first**, and each looked
      right: *it samples mid-ease* (no — `28:` says rested on the first ask, inside
      50 ms, in the approach the probe used); *`cam_rate` keeps creeping* (no — with
      yaw fixed the filter is 0 and the boom is bit-stable); *the eye is still moving
      when read* (no — it is FROZEN; what varies is where it froze). One of my probes
      also produced an invalid discriminator: `mocha`-style, it "failed" a brace
      pattern the baseline failed identically. **Always get the control.**
    - ⚠ **THE REST TOLERANCE LATCHED — a live defect in shipped code.**
      `cam_rested = dd < 0.001` is a tolerance AND it gates whether the solve runs
      (`if cam_moved || !cam_rested`). So the boom parked up to 0.001 short of target
      **forever**, and which tick the ease crossed on decided where. Measured, same
      build, two runs: `reach 5.324 residual 0.00098131` and `reach 5.299 residual
      0.00097224` — a 0.025 wu spread in a *resting* camera. Fixed by snapping
      `cam_dist = cam_free` / `cam_pitch = cam_pt` in the tick that declares rest:
      rest now means **arrived**, and the step is bounded by the tolerance the author
      already chose as invisible.
    - **New `28:` (`MSG_CAMREST`) makes the camera's convergence askable** — rested,
      boom, free, pitch, residual. A QUERY, not a broadcast: the flag is true on most
      ticks so an event would storm during any walk, and there is no edge to fire on
      when an edit leaves the camera untouched, which is precisely the case this gate
      needs (a fence must cost nothing).
    - ⚠ **`C:` COULD NOT CARRY IT.** `set_camera` in `editor_client.loft` parses
      everything past the first `;` as the projection, so a third field would make
      `len(cproj) != 16` and silently blind the **wasm** client. `editor.html`
      destructures and would have been fine — a one-client break that no gate covers.
    - ⚠ **AND THE MATRIX HAS TO BE ASKED FOR.** `C:` is sent from inside `if moved`,
      so at rest there is no next one and waiting for it times out. `2:<aspect>,` is
      a request answered from current state, so the read is request/response. Without
      this the gate read a matrix from a different tick than the query — back-solving
      the eye proved it, the matrix built from a boom the query no longer reported.
    - **Result: `beside_wall` reads 5.346 / 3.911 on every run** (four fresh servers,
      then the full suite twice). **Seen red two ways**: drop the rest poll → 5.022,
      5.022, 4.993 and `settled false`; restore the original sleep → a stable but
      **wrong** 4.927 that passes silently, which is the whole indictment.
    - **The latch itself is now gateable in one run**: at rest, `boom` must equal
      `free`. ⚠ **But it catches only when the defect manifests** — removing the snap
      was caught in **1 of 2** runs, because an ease that happens to land exactly on
      target is indistinguishable from a snapped one. Real invariant, partial
      detection; recorded rather than overclaimed.

    **PLAN 14 IS COMPLETE: A0–A10, every probe and every step.** 639 library tests, 23 gates.
    Three of the six probes changed the design rather than confirming it, and the build turned
    up **three** live defects in shipped code (the flat wheels' successor — a 9 cm bank error —
    the hip's wedge, and the raise's once-per-tick origin) plus three loft defects.
2. **✋ STILL UNWALKED: look at the wasm client.** `make play-fast`, then
   `http://127.0.0.1:18090/client` through the tunnel, beside `/` for the JavaScript one.
   ⚠ **Click the canvas before pressing a key** — loft's shell binds keys to the canvas, not
   the window. Which renderer continues is your call, not a gate's; `editor.html` is
   deliberately NOT deleted, it is the control.
3. ✅ **The character's hip gap is FIXED** (`A9b`). `hip_overlap()` extends the pelvis by
   `leg_w()·0.5·sin(LEG_SWING)` = **0.0341 wu (2.95 cm)**, derived and never written down,
   with `leg_w()` giving the leg's section one home instead of two. Gated by
   `tools/gates/character/hipskin.mjs`, **seen red on the unfixed server** with exactly the
   predicted shortfall (`margin −0.034049`).
   ⚠ **That gate's margin is 8 microns and that is correct, not slack** — the overlap is
   derived from the gait's own peak, so it sits ON the tangency by construction. It takes
   its angle from the **broadcast leg transforms while walking**, never from `LEG_SWING`,
   which is what makes a widened gait fail it instead of silently reopening the seam.
4. **S2 — voxels on the wire** (`plans/16-client-split/DESIGN.md`), unchanged from before.
5. **The collide gate's oblique clause is wrong.** It places and walks with yaw 0, so it
   re-measures the perpendicular stop rather than the slide. The slide itself IS verified —
   this is a gate defect, not a feature one.
6. **The `hex_edge` README note is uncommitted in the shared tree**, alongside the older
   `hex_field` fix. Both need a human call before committing in `../loft-libs-world/`.

## Since 2026-07-29 (session 3) — the cart, and what a body actually is

Commits `54465a0` · `7698d71` · `7ef9406` · `e70b8bd`, all pushed and verified against the
remote.

### Two defects on screen, both green in the gates for a whole rung

| what | measured |
|---|---|
| **the cart's wheels were drawn FLAT** — `emit_cylinder_post` builds its ring in the XZ plane *whatever axis it is handed*; the two endpoint arguments only move the endpoint centres | the wheel mesh bounded `x 0.80 · y 0.00 · z 0.92`, where a wheel is `0.80 · 0.80 · 0.12` |
| **the cart's body height was a constant** — `translate(cx, CART_RADIUS, cz)`, a lift above `y = 0` and never above the *ground* | on a 4.8° slope the wheels hung **0.204 wu** clear |

The primitive is a **post**, and every other caller (fence posts, trunks) plus all four of
its tests passed a vertical axis — so **the tests agreed with the bug rather than catching
it**. Fixed with a basis chosen so `+Y` reproduces the old `(cos, 0, sin)` ring
vertex-for-vertex (posts measured unchanged), and guarded by the rule that covers every
axis instead of one shape: *every vertex sits `radius` from the axis LINE, every normal
perpendicular to it*, run over vertical / z / x / oblique. Seen red on three before the
fix. **503 tests green** across the five packages (was 499).

The pose is now solved from the ground contacts — mean contact plus a radius for the
height, the axle's own angle for the bank, as a fixed point because where the wheels touch
depends on the bank. **Wheels are placed FROM that frame, never each onto its own
contact**, so the axle cannot stretch.

⚠ **The gate that stayed green measured `travel → value → skid`** — the wheel's
*arithmetic* — and nothing about where any part of the cart was. Its new clauses measure
the wheel-to-ground gap and the axle length, both seen red under separate mutations, with
a **bank clause as the control** because on flat ground the rest passes trivially.

⚠ **And the first axle clause was VACUOUS.** It asked the server, which derived the length
as `2·half·√(cos²β + sin²β)` — the answer `1.1` for every input, a clause that could not
fail. It reads the broadcast transforms now. Same mistake as the bug, one level up.

### The design: `plans/14-props-dressing/CONNECTOR.md`

Plan 14 already named *"the multi-rig connector, which `hex_body` does not have"* as open.
It is designed now, and **not built** — `cart_send` still open-codes the connection.

**The user corrected two things that reshaped it, and both corrections were right:**

1. *"we use the hexbody code to define the connections not a mjs"* — the connection was
   open-coded as `mat4_mul` chains and its invariant put in a JS gate. `rig_world_seg` is
   **pure**, so the connection test needs no server, no wire and no browser.
2. *"this should not be about wheels only"* — towing, dangling loads, robot arms, warping
   wings. The first draft said *one frame solved from the ground contacts, everything
   inboard rigid*: true of a wheel, **false of a towed cart** (it has its own contacts, so
   its own frame — the drawbar couples two frames) and **false of a dangling crate** (no
   contacts at all). One mechanism stretched over families that do not share it.

**What survives is a counting rule:**

```
    dof(links) + dof(support) + dof(driven) + dof(solved) = 6      per body
```

⚠ **It predicts a real fact, which is the best evidence it is right.** Today's cart,
unhitched: `x, z, yaw` as state is 3, two contacts give height and bank is 2 — **five**.
The sixth is *pitch*, supplied by nothing and pinned to zero by fiat. A real two-wheeled
cart with no horse in the shafts **tips forward onto them**; the arithmetic says so before
any physics does.

Other results worth carrying:

- **Attachment ≠ support.** A wheel is attached to the chassis and supported by the ground;
  a towed cart is attached to the horse and supported by *its own* wheels; a crate is
  supported by the attachment itself (`CARRIED`).
- **A `TETHER` is an INEQUALITY**, not an equation — taut and slack have different DOF
  counts. Model a rope as a rigid rod and the crate *pushes* the balloon upward: a rope in
  compression, which is the tether's version of a stretching con-rod.
- **`P4` is falsified on paper.** `bone_obb` bounds a bone's *capsule* — half-extents
  `(R/2 + ω, ω)` for a spoke — and a wheel's disc reaches `R` in every in-plane direction,
  so `disc ⊄ bone_obb` whenever `ω < R`, which is always. The proxy would **miss
  overlaps**, which `I4` forbids. A wheel needs its own shape: the OBB `(R, R, t/2)`,
  containing the disc exactly with overshoot `4/π`. **So the connector's payoff is one home
  for the connection, not free collision** — the smaller argument.
- **`Φ′(0) = 0`**, so the contact fixed point is *quadratically* convergent near level —
  which is what the measured `1.5 × 10⁻⁸` after three rounds was. It converges while
  `tan β < 1/L`, and that degrades exactly where the `|d| ≤ 2w` doorstep bites.
- **States are `DRIVEN` or `SOLVED`, declared.** A wheel's spin comes from travel, an arm's
  angle is commanded, a **wing's bend is solved from a load** — a fixed point in the same
  shape as the ground contact. ⚠ `SOLVED` is quasi-static, so choosing it is choosing to
  have **no dynamics**: a wing that never flutters, a crate that never swings. Usually
  wanted, and the error is picking it by accident.

### ⚠ `hex_body`'s "needs no skinning" is true of the RIG and false of the PICTURE

`hex_body` says *"flex is joints, not deformation … this survives a flexing wing unchanged
and hexbody needs no skinning."* Right about where a part **is**; silent about what it
**looks like** — and this editor already demonstrates the difference.

**`limb_mesh` builds a leg box from `y = −len` to `y = 0` and `limb_at` pivots about
`y = 0`, so the box's top face lies IN the pivot plane**, while the torso's pelvis has its
flat bottom at that same height. Any joint angle dips one corner below the torso by
`(half-width)·sin θ`, opening a wedge nothing fills. In the frame it reads as the light tan
`ab8060` of a **lit top face** — the top of the thigh, seen from above *through the gap*.
One hinge, one seam; a wing in ten stations has ten, along the edge a viewer looks straight
down. `A-SKIN` is now an invariant, and `P7` decides whether overlap closes it or a
deforming skin is a second representation.

### Instruments and operational notes

- **`make shot` is the passive screenshot** — *"a picture of what the human is looking
  at"*. `make shot PAGE=/ CANVAS='#gl'` for the JavaScript renderer. It sends nothing, so
  it does not disturb someone driving.
- ⚠ **`tools/plan.mjs` is NOT passive** — it sends `7:` placements and lays a road. Do not
  run it against a session someone is using.
- ⚠ **Gates modify the shared world.** The cart gate now raises a hill and rolls the cart
  ~15 wu; after a gate run the opening view is not what it was. Reload a world to reset.
- Both renderers were compared this session and **draw the identical picture**, which is
  what said the flat wheel was in the world/wire and not in the client.

**How to run anything:** `make play-fast` (interpreted, ~1s) · `make client` (build the wasm
page) · `make client-check` / `make editor-check` (the two renderers, one claim) ·
`make client-console` (what the page SAID, when it drew nothing) ·
`make gate` (all 23, and it now stops the server after) · `make stop-editor` (three
platforms, by pid file OR port) · `27:1` on the wire turns on the phase trace ·
`node tools/plan.mjs out.png` draws the world in plan view.
⚠ **Stop the server when done.** It is not idle when forgotten — that was 76% of a core.

## Since 2026-07-29 (later) — S1 draws, and `--html` is a second implementation

### First: the `web` publish that was never needed

**`make client` carries no `--lib` flag, and there is nothing to publish.** The `--html`
link failure that blocked S1 was `loft install <dir>` dropping a package's `wasm/`
directory into `~/.loft/lib/web` — which is searched *before* the registry cache, so an
incomplete local copy shadowed a complete published one. `rm -rf ~/.loft/lib/web` fixed it;
`web` 0.3.3 resolves from the registry with its bridge intact. Filed as
[loft#667](https://github.com/loft-lang/loft/issues/667), and it is the second instance of
a class `install_package`'s own comment says it closed once, for `native/`.

⚠ **Two diagnoses died before that one, and both were reached by READING.** "The published
0.3.2 tarball omits `wasm/`" — its sha256 matches the registry byte for byte and `tar tzf`
lists all three files. "0.3.3 was never published, so cut the release" — it was, on
2026-07-28T16:34Z, *before* the diagnosis; our `../loft-registry` checkout was simply
stale. Both were claims about **what someone else had shipped**, and neither needed this
box. One `mv` of the shadowing directory settled it, and that probe was available from the
first minute. ⚠ If `--html` ever fails with `web_wasm` unresolved again, that stale
`~/.loft/lib/web` is the cause and not the package — the note is on `make client` too.

### Then: the client itself

**The wasm client renders the world.** `src/editor_client.loft` is ~500 lines of loft that
dials the server, parses the wire and draws it on WebGL2 through `graphics`' raw `gl_*`
surface. Served at **`/client`**, gated by `make client-check` — the same headless-browser
check `editor-check` runs against `editor.html`, so one claim is measured against two
renderers. Control seen red: skipping every part in the draw loop drops the canvas from 258
distinct colours to 2. **All 22 protocol gates stay green** on the server that now serves
both pages.

**It drives, not just draws** — measured, not assumed. Idle, the counters freeze over 600
frames (296 meshes, 301 placements, 0 drops, 2 cameras); holding `W` for four seconds moves
all of them (320 / 715 / 48 / 80). Key → bitmask → `4:` → the server's tick → new frames.
⚠ **The canvas must be CLICKED first**: loft's shell binds keys to the canvas element, not
the window, and `editor.html` listened at the document. Nothing in the client can fix that
— focus is the host's business and `--html` exposes none of it.

**The plan's own instruction was wrong, and building it showed why.** It said to map the
wire onto `mesh3d::Scene` / `Camera`. But the wire carries a flat run of 6 floats per vertex
and two 4×4 matrices — exactly what `gl_upload_vertices(data, 6)` and `gl_set_uniform_mat4`
take. The scene graph would mean un-flattening a vertex run so `mesh_to_floats` can flatten
it again, and inverting a look-at matrix so the renderer can rebuild the one we were handed.

### ⚠ `--html` IS NOT A BUILD FLAG, IT IS A SECOND IMPLEMENTATION

Four defects cost the session, **and every one of them presented as the same symptom** — a
canvas holding one flat colour. Three are the same shape: a sentinel or a contract that
differs between native and browser, with nothing at the boundary to say so.

| what | filed |
|---|---|
| `gl_window_width` is not in the browser's host-import set. Calling it is a **LinkError at instantiate** — the page never runs, and the error names an import index, not a function | [loft#668](https://github.com/loft-lang/loft/issues/668) |
| browser `gl_create_shader` / `gl_upload_vertices` return an index **starting at 0**, while the doc says 0 means failure. The documented check rejects the first working shader; a `vao == 0` free marker sends all 296 meshes into one slot | [loft#669](https://github.com/loft-lang/loft/issues/669) |
| **writes through a local captured from a `vector<Struct>` field are silently discarded** — and that is the idiom the loft-write reference recommends. This client had all three of its writes on the losing side | [loft#670](https://github.com/loft-lang/loft/issues/670) |
| `web`'s `send` DROPS a message on a still-connecting browser socket. One `send(h, "1:")` after `ws_handler` sends into a closed socket and then waits for ever — the server logs the client as connected and never hears from it. The retry IS the fix, and `send`'s own doc says so | — |

**Carry into S2:** check every handle, sentinel and lifecycle assumption against
`loft/doc/loft-gl-wasm.js` rather than against the API doc. Also noted, not yet filed:
`gl_clear`'s doc says `0xRRGGBBAA` and **both** implementations decode `0xAARRGGBB` — they
agree with each other and not with the sentence (a doc fix in `../loft-libs-graphics`).

### Two instruments, and the reason there had to be two

`html_render_check.mjs` answers *whether* it drew — one bit and a colour count. All four
defects set that bit to 0, and it has nothing further to say. **`tools/page_console.mjs`**
is the attribution half: it prints what the page SAID — the `<pre id="out">` the shell
*hides* the moment a window is created, plus console messages, plus `--hook-shaders` to log
the source WebGL actually received and each compile's status. Building it is what turned a
guessing game into four measurements.
`plans/16-client-split/probe/vector_field_write.loft` is the same idea in the language: it
prints the write MATRIX rather than a verdict, because what is useful is *where the boundary
runs*, not that one line is broken.

## Since 2026-07-29 — row 6 finished, and the design turned toward the client

**Row 6 is complete: 6a-6d.** A wall is now an analytic **run**, not a set of edges. That
correction came from the user's eye, not from a gate — "fences should not follow the side of
the hexes, they should be straight" — and it was right twice over: the geometry wobbled
*and* the normals were wrong.

| rung | what | gate |
|---|---|---|
| 6a | the exact perimeter, and the half stored outside | `fence.mjs` |
| 6b | collision — `hex_edge::sweep_path`, a doorway is not a wall | `collide.mjs` |
| 6c | the camera's occlusion class, consumer-supplied predicate | `occlude.mjs` |
| 6d | **a wall is a RUN** — `hex_way` centreline, offset fences, geometry off the line | `straight.mjs` |

- **The road is a `hex_way` centreline** snapped to one of the **24 compass headings**, with
  the residual angle reported. The fence is its **`track_offset`**, not the band's outline —
  `way_stamp`/`cut_arb` cut the boundary of the marked CELLS, which zigzags however straight
  the road is. Measured: 82 wobbling edges became 65 in two bounded parallel runs.
- **The drawn wall comes from the run**: 1200 vertices, all at perpendicular distance
  **exactly 2.5**, spread 0. Restoring the per-edge panels gives 1980 vertices spread over
  0.93 of a hex — the staircase, measured.
- **The slide works**, after four attempts. The stop had to be a **skin from the LINE**, not
  from the staircase edge, and the guard a **side test, not a distance test** — a skin is
  1 cm and a stride is 13, so a walker steps clean over any band a distance test guards.
- **`tools/plan.mjs`** renders the world in plan view to a PNG it writes itself. It is the
  instrument that made all of this visible; a screenshot of the editor cannot answer "is
  this straight", because perspective bends everything.

### Performance: two separate causes, both measured

- **The idle gate never closed** — `poll_event` absorbs disconnects, so `clients` only grew
  and the tick ran at 30 Hz for nobody: **76% of a core**. Now gated on what `broadcast`
  reports from the library's own active set, probed once a second **whether or not anything
  moved** (the first fix read the count inside `if moved` and changed nothing).
- **The camera was the whole of the rest** — 11 solves a tick × 14 steps × 5 terrain reads =
  770 samples, ~100% of a core, tick collapsing 31 → 15/s. It is now **not re-solved when
  its inputs have not moved**: 0%, tick holding 31/s. `27:1` turns on a per-second phase
  trace that reports where the time went *and the arithmetic that explains it*.
- ⚠ Three causes were proposed before the measured one. **The trace is left in** for that
  reason.

### The design turned: [plan #16](https://github.com/jjstwerff/moros/issues/16)

The camera does not belong in the server — it is there because the client is JavaScript, and
a wasm/loft client dissolves that. **The world model stays; the view goes.** The test for
which side a routine belongs on is **who is allowed to disagree**: two viewers with different
cameras is fine, two with different ground is a corrupted world.

The route is `plans/16-client-split/DESIGN.md` — voxels cached and meshed in the client, then
the camera, in five steps that each ship and each delete something. The order is forced (the
camera needs a local height field, so the cache comes first), the structure is
`../loft/tools/audience-demo/`'s, and the cache check is a **small high-priority heartbeat**:
a digest of `(chunk, τ, crc)` at the head of the tick, never behind a bulk transfer.
**S1 is a port, not a research project** — `--html` gives WebGL2 + WebSocket.

## Since earlier on 2026-07-28 — row 6 is built, and it found four things

**Row 6 (fences and walls, #10) is done** — 6a the exact perimeter, 6b collision, 6c the
camera's occlusion class. **Every numbered rung of the ladder is now built.** 21 gates green
(17 world + 4 character), both `hex_world` probes, 58 `hex_world` tests.

| rung | what | gate |
|---|---|---|
| 6a | the exact perimeter, and the half of it stored outside | `fence.mjs` — 3 mutations red |
| 6b | collision: `hex_edge::sweep_path`, and a doorway is not a wall | `collide.mjs` — 3 mutations red |
| 6c | the camera's class: the predicate the consumer supplies | `occlude.mjs` — the fence clause red |

### The four findings, in the order they cost time

1. **`E1e` — an edge is content.** A hex stores three of its six edges, so half of any
   region's boundary lives in the cells OUTSIDE it — cells that need hold no ground. Elision
   keyed on material dropped those: a layer whose only content was walls was deleted whole,
   silently. Asked before building on it (`hex_world/probe/edgehold.loft`) and fixed at the
   chokepoint — `hex_present`/`stored_present` govern elision and the window; occupancy
   (material) stays what `E1r` asks and `F1` stacks.
2. **⚠ EVERY DISC IN THE EDITOR WAS A SHEARED BLOB.** `moros_map::hex_distance` is the AXIAL
   cube distance and this editor is odd-r OFFSET, so the unqualified name called `(0,0)` and
   its SW neighbour two steps apart. The road's width, the scatter's reach, the storey's
   footprint and the house's outline had all been sheared. No gate could see it because each
   measured the shape the editor drew — `opening.mjs` walked the house ring with the same
   axial formula, so gate and editor agreed *by making the same mistake*. Every
   `hex_distance` in `editor_server.loft` is now `hex_grid::`-qualified; **removing the
   parity-blind copy from `moros_map` is #3's, and it is still exported.**
3. **loft #654 ✅ and #655 ✅ — both filed and both already fixed upstream.** #654: past
   ~32 KB of body the interpreter stopped taking a `while true`'s backward jump, so the pump
   ran ONE pass and the process exited 0 — two `println` lines in the dispatch were enough,
   and *removing two unrelated lines elsewhere* fixed it. #655: a mutated `&boolean`
   parameter panicked codegen while `&integer`/`&float`/`&text` worked. Both **verified
   against the installed binary on both backends**, not taken from the commit messages.
   ⚠ **Both fixes were wider than the reports** — "every loop and branch", and "four sites,
   not the one filed". A reproducer that pins a symptom does not measure the class. The two
   workarounds (handlers out of `main`, a struct for the draft) are kept because they read
   better, no longer because anything forces them.
4. **Collision worked for exactly one tick**, which is indistinguishable from never working.
   Stopping exactly ON the bisector leaves the position ambiguous — `hex_at` rounds to the
   far cell and the next tick starts beyond the wall. The fix is a `SKIN` (stop 1 cm short),
   not a better test: a cell test cannot be made exact at its own boundary. Raised in
   `hex_edge`'s README — **that note is UNCOMMITTED in the shared tree**, like the
   `hex_field` fix below.

### New this rung

`23:<mat>,<rad>` rings the disc you stand in · `24:<dir>,<mat>` sets one edge (which is what
puts a gateway in a fence) · walls draw as a **sixth** chunk surface, and the stride is now a
named `SURFACES` constant on both sides of the wire · a field fill stops at any edge, so
`X70`'s "a doorway is still a boundary" is the difference between a fill of 19 and a refusal
· `F`/`G` in the browser fence and wall the ground you stand on.

## Since 2026-07-27 — rows 8-11 built, and the gates got honest

**Branch `plan/7-hex-editor`.** Working tree clean, everything pushed. ⚠ The remote's
`main` is still at `4ffa03e`; all of this lives on the plan branch. Pushing `main` from
here is a no-op that exits 0 — it looked like a successful push five times before
`git ls-remote` showed the truth. Always verify against the remote, never against `&& echo`.

### What runs

`make play-fast` (interpreted, ~1s) or `make play` (native). One loft process serves the
page and the model channel on port 18090. Multi-client, measured with three concurrent
clients and sequential reconnects.

**Gates: 15 world + 3 character + 56 `hex_world` tests + the sparsity proof.** All green,
each on a freshly started server (`make gate-world`, `make gate-character`,
`make gate-hexworld`, `cd lib/hex_world && loft test`).

| rung | what | gate |
|---|---|---|
| 8a | storeys and cellars — the layer stack end to end | `storey.mjs` |
| 8b | stencils as a BAND, `P1`/`P2` | `stencil.mjs`, `hex_world/tests/stencil.loft` |
| 8c | roofs — derived pitch, own material, own mesh | `stencil.mjs` (eave 61 → mid 65 → ridge 69) |
| 8d | openings — a door is a material, never a cleared edge (`X70`) | `opening.mjs` |
| 8e | the `K-FIT` doorstep — reason, offer, residual; nominal ≠ ordinal | `doorstep.mjs` |
| 9a | trees at density — the forest as a field | `vegetation.mjs` |
| 10a | the cart — three rigs, one frame, a derived roll | `cart.mjs` |
| 10b | props as dressing — `D1` in the editor | `prop.mjs` |
| 10c | glb import/export as a prop | `import.mjs` |
| 11a | anchors — follow, break, or foreign (invariant II) | `trigger.mjs` |

### Rules added to the contract (WORLD_MODEL.md Part II)

- **`E1r`** — absence binds READERS: a column's roof and floor are its topmost and lowest
  **occupied** cells. `cells[0]`/`cells[n-1]` are positions, not the floor and the roof.
- **`P1`** — a stencil writes a BAND, not a column: `[lo, hi]` is replaced, everything
  outside is kept, and a fold against a kept neighbour refuses rather than clips. Under a
  bridge, over a cave, and *the ground layer reforms to the stencil* are one rule.
- **`P2`** — terrain and dressing never mix. The guard is in `check_column`, the only place
  a cell reaches a layer. A terrain write does not touch a dressing layer, **not even to
  blank it**.
- **`D1`** gained a way in — `world_set_dressing` / `world_dressing`. Nothing could create a
  `KIND_DRESSING` layer before, so `P2` guarded a case that could not arise.
- **`K-FIT` invariant I** — every author action ends applied exactly, refused with a reason
  **plus an offer and a residual** (ordinal) or a reason alone (nominal, `X68`), or applied
  as an explicit approximation with its residual on the wire. Every tool is through it.

### New protocol messages

`12` storey · `13` scatter · `14` stencil · `15` column read-back · `16` wall read-back ·
`17` cart · `18` trigger · `19` prop · `20` dressing read-back · `21` glb import ·
`22` glb export. The read-backs exist because **floors, walls and dressing draw nothing** —
without them a gate can see a refusal but not whether anything changed first.

### New library: `lib/glb_read/`

A JSON reader and a glTF 2.0 binary reader (`glb` 0.1.2 is write-only, and nothing in the
registry parses JSON). **Libraries are ours to build and verify — never an upstream ask,
because upstream cannot verify one against the use that needs it.** `LOFT_HANDOFF.md` is
for loft the language and its tooling only.

### Operational lessons that cost real time

1. **Gates measured the machine.** Fixed sleeps encode an assumption about box speed; under
   load a fill's refusal arrived after the gate read "no refusal", and a road ring laid at
   150ms/point LEAKED so the fill correctly refused an open enclosure. Everything now waits
   on what the server SAYS — placements, roads, fills, storeys and **rebuilds** are all
   acknowledged (`S:rebuilt N chunks` is the missing half: the world changes when the load
   is acknowledged, the MESHES follow several ticks later).
2. **`ack` vs volunteered reports.** `ack` only sees messages arriving after it is called —
   right for a reply, wrong for something the world volunteers (the trigger's BROKEN
   notice). Search everything seen so far for those.
3. **A stale compile cache spins at 100%** while printing the banner AND `listening on
   port`. `rm -rf src/.loft/cache`. A `git checkout` round-trip caused it.
4. **`ps %cpu` is a lifetime average** and hid a real measurement behind startup cost. Use a
   `/proc` utime delta.
5. **Four green clauses turned out to measure nothing**, and each time the fix was the
   SCENE, not the assertion: `> 0` on a cave that a whole-column replace still half-filled;
   a pre-flight whose conflict landed on the first column; a dressing clause whose terrain
   write never reached a dressing slot; and the glb reader, where a seeker passes every
   round-trip test against files it wrote.

### Open

- ✅ **THE TICK IS 0% FOR A WATCHING CLIENT WHO IS NOT MOVING** — it was ~100%, all camera.
  Attributed, not guessed — `27:1` turns on a per-second phase trace:

  ```
  TRACE 15 ticks/s: proxy 0ms (0 rebuilds)  camera 1008ms  rest 0ms
        | camera does 11 solves/tick x 14 steps x 5 terrain reads = 770 samples/tick
  ```

  **Both suspects are exonerated**: the collision proxy costs 0 ms and rebuilds 0 times
  (its cell-change/edit-clock test is exact), and the rest of the tick — walk, streaming
  check, publish — is 0 ms. Shrinking the proxy from radius 8 to 2 changed nothing, so it
  is not the EdgeSet copy either.
  The camera's own arithmetic is the answer: `cam_pitch_target` (`CAM_TRIES + 1`) plus
  `cam_free_arc` (`CAM_ARC_N + 1`) is **11 solves a tick**, each walking `CAM_STEPS = 14`
  samples, each sample costing a `terrain_y` **plus the four more inside `cam_clear_at`** —
  770 terrain reads a tick, and every one of them reads a cell and its six neighbours.
  The tick rate is collapsing under it (31 → 15/s), which is why the walk feels heavy.
  **The fix was none of the optimisations that suggested themselves.** A static camera does
  not need solving at all: it is a function of the character's pose, the viewer's pitch and
  the ground, so when none of those has moved and the boom has finished easing, last tick's
  answer is this tick's. Gated on those INPUTS — pose, pitch, and the world's edit clock, so
  raising ground under a standing camera still re-solves, which a "no input for N ms" rule
  would miss — plus a `cam_rested` flag that keeps it solving through the ease afterwards.
  Measured after: **0%**, camera 0 ms, and the tick holds a full 31/s where it had collapsed
  to 15. `occlude`, `terrain`, `climb` and `collide` all still green, which is what says the
  camera still works when something does move.
  ⚠ It is NOT this rung's regression to blame: the 9-point wall-sweep skip was aimed at
  the obvious candidate and was mostly wrong, and the 12.9% on record predates the
  predictive-arc camera.
- ✅ **The idle gate is fixed, and it was a real 76%.** `poll_event` absorbs disconnects
  internally, so `clients` only ever grew and `len(clients) > 0` stayed true for ever once
  one tab had connected; the 30Hz tick then ran for nobody. It gates on what `broadcast`
  reports from the library's own active set now, probed once a second whether or not
  anything moved — the first attempt read the count off the tick's own broadcast, which
  lives inside `if moved`, so an idle client's departure was still never seen. Measured
  0% / 76% / 0%. ⚠ The original "idle 0%" was verified on a server that had never had a
  client — the one state in which the bug cannot appear.
- ⚠ **A gate run against a server that still has another client attached is a FLAKE.** A
  `collide` failure this session was exactly that: a CPU-measurement client was still
  connected, so two clients drove one character. Free the port, or wait, before believing
  a red gate.

- ⚠ **THE TICK COSTS 81% OF A CORE FOR ONE WATCHING CLIENT**, where it was 12.9% at the
  end of rung 11a. Measured with a `/proc` utime delta on an empty world with no walls in
  sight. Skipping the camera's wall sweep when the proxy is empty buys 9 points of it
  (90 → 81) and is kept; the remaining 68 are unexplained. Suspects, in order: the
  collision proxy rebuild (`edges_around` runs twice over a 19×19 window and may be firing
  more often than the cell-change/clock test suggests), and the sixth surface in the chunk
  traversal. **Do not optimise before measuring which** — the 9-point fix above was aimed
  at the obvious candidate and was mostly wrong.
- ✅ **The idle gate is fixed and was a real 76%.** `poll_event` absorbs disconnects
  internally, so `clients` only ever grew and `len(clients) > 0` was true for ever once one
  tab had connected. The tick then ran at 30Hz for nobody. It now gates on what `broadcast`
  reports from the library's own active set, probed once a second whether or not anything
  moved — the first attempt read the count off the tick's own broadcast, which lives inside
  `if moved`, so an idle client's departure was still never seen. Measured 0% / 76% / 0%.
  ⚠ The original "idle 0%" was verified on a server that had never had a client — the one
  state in which the bug cannot appear.

- **#3** ✅ **the axial `hex_distance` is deleted, not fixed.** `hex_grid` already exported
  the right one, so removing moros_map's copy put the correct function in scope under the
  same name and every call site became right without moving. Two implementations of one
  lattice rule was the defect; a corrected second copy would still be one. It took two test
  assertions with it — they had been stating the bug's answers ((1,-1) adjacent, (5,5) ten
  steps) — and the control that separates the conventions is now named as such.
- **The slope tools were drawing a dotted line.** `slope_path` walked its own axial distance
  by lerping q and r INDEPENDENTLY, which on an offset lattice is a line only along the
  axes: measured, a (0,0)→(5,5) run had THREE consecutive pairs that are not neighbours, so
  the ridge it drew had holes in it. All four of its tests were axis-aligned. Now
  `hex_line_at` — an axial lerp rounded by `hex_grid::hex_round` — and
  `moros_map/probe/slopeline.loft` prints the old shape beside the new one on every run.
- **`moros_ui` is GREEN — 46 tests, and `make lib-test` is 499 across five packages.** The
  record of why it was red was stale: not a missing `loft.lock` but two narrowing errors left
  by the 8-byte voxel, in the toolbar's palette selection. Range-checked, then cast.
- **#13** LOD banding and instanced draw.
- **#14** the general multi-rig connector (the cart's is one frame with fixed offsets).
- **#15** the sandbox seam — what a routine may touch. Only *attachment* is built.
- **#8** the crystal port and the convergences.
- **`server`'s blocking wait** — designed in EDITOR_LADDER.md, not built. The idle path is a
  50ms poll because there is nothing to block on; `loft-libs-net` is a shared checkout and
  it wants a session with room for a native rebuild.
- **✋ Checkpoints never walked:** the layer stack (build a tower with a dungeon under it),
  and everything after it. All are gated, none have had your eyes.

## Since 2026-07-25 — the world model, specified AND BUILT to row 4

> ⚠ **Whose work is this?** **Moros is the tabletop RPG.** The universal editor is
> **lavition** — a separate product with its own org, documented in
> `loft/doc/claude/LAVITION.md`. Everything in plans 7–15 builds lavition; Moros is one
> consumer, and its `doc/` is the RPG. Packages therefore take **descriptive `hex_*` names,
> never a brand prefix** — LAVITION.md makes that an explicit anti-rename.

Two things happened that reshape the rest of this file.

**The compact voxel landed.** `Hex` is now `u16` height + six `u8` palette indexes — **8
bytes against 56**. Narrowing it produced 31 compile errors, which was the defect `STATE`
already recorded ("the documented byte widths are not enforced anywhere") finally surfacing.
Public parameters narrowed at the boundary, checked casts inside, and three sites had to
decide what out-of-range *means*: the brushes clamp, `map_read_field` refuses with
`ML_LABEL_TOO_WIDE`, the stencil record mirrors the voxel. The palette became real at the
same time — `map_empty` seeds slot 0 as absence, and `moros_render`'s `palette[i-1]`
off-by-one (a second, hidden encoding of the same rule) is gone.

**The world model is fully specified and not yet built.** It has its own plan
([#8](https://github.com/jjstwerff/moros/issues/8)) and its own normative contract in
**[WORLD_MODEL.md Part II](WORLD_MODEL.md)** — twelve invariants with proofs, a gate and a
named control apiece. What it settles: chunk-local layer stacks, per-chunk windowed heights,
continuity matched by height rather than name, an edit clock for caching, many authors
merging onto one writer, and online compaction that leaves caches valid.

**The editor split into a plan per rung**, because it was far too big for one:
[#9](https://github.com/jjstwerff/moros/issues/9) roads · [#10](https://github.com/jjstwerff/moros/issues/10) fences ·
[#11](https://github.com/jjstwerff/moros/issues/11) fields · [#12](https://github.com/jjstwerff/moros/issues/12) houses ·
[#13](https://github.com/jjstwerff/moros/issues/13) trees · [#14](https://github.com/jjstwerff/moros/issues/14) props and vehicles ·
[#15](https://github.com/jjstwerff/moros/issues/15) routines. The map is
**[EDITOR_LADDER.md](EDITOR_LADDER.md)**.

**The ownership audit ran** over every public name in `lib/moros_*`
([EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md)). The great majority is general editor logic, and
the target shape is **five groups** — `world`, `edit`, `view`, `ui`, `actor` — none of which
is extracted, because extraction waits for battle-testing. The current packages cut *across*
those groups (`moros_sim` alone holds four), which is what makes regrouping the first step
rather than a later tidy-up.

⚠ **The audit found game state inside the voxel.** `hex_spawn_flag` / `hex_waypoint_flag`
read bits 5 and 6 of `h_item_rotation` — a spawn point is `L15` game state and is explicitly
excluded from the world file, yet two bits of the storage of record hold it. Belongs to #8's
V1, and is cheaper to fix before worlds exist.

**`lib/hex_world` exists and the editor runs on it.** Rows 1–4 of
[the order of work](EDITOR_LADDER.md#the-order-of-work) are done:

| | | |
|---|---|---|
| row 1 | the file — header, opaque palette, directory, per-chunk CRC, `ε > 2θ` on open | ✅ |
| row 2 | sparsity — elision on both axes, exact sizes | ✅ |
| row 3 | the edit clock, per-layer versions, a payload-free version scan | ✅ |
| row 4 | **the editor moved onto it** — `Peak` and the local world format deleted | ✅ |

`hex_world` is 29 tests plus `make gate-hexworld`; the editor's seven browser gates all pass
on a fresh server. **Row 5 (roads, #9) is next**, and row 4's checkpoint — build hills, save,
reload, walk — is the user's to judge.

⚠ **Two things row 4 turned up that are worth carrying.** A read path that allocated a whole
`Column` per cell, and a `find_chunk` that scanned every chunk *per cell sample* — together
they made a mesh rebuild O(cells × chunks) and slow enough to reorder the gates. Both fixed
(direct cell read; chunks indexed by a packed key). And the persist gate was **testing a
bug**: it wiped the world by loading a name that did not exist, so a mistyped filename
silently destroyed your work. That is now a named refusal that changes nothing.

## What exists

**Five loft packages, recovered and green.** `lib/moros_{map,editor,render,sim,ui}` —
recovered from loft's history at `ade530c2^`, where they had sat unmoved since June.

| package | tests |
|---|---|
| `moros_map` | 76 |
| `moros_editor` | 56 |
| `moros_render` | 163 |
| `moros_sim` | 148 |
| `moros_ui` | 46 — green since 2026-07-28 |

**499 green, and zero warnings from Moros sources.** `make lib-test` runs them all and was
proven to go red (a gate nobody has seen fail is not a gate) — most recently for real, twice
in one session, catching a wall-drop in the stamp bridge and a double halo in `hex_field`.

**Contributions to the shared library** (`loft-libs-world` `dev`, package `hex_field`, 47
tests): the interchange document format, the stencil mechanism, the authoring `EdgeSet`,
named integer layers, and two committed fixtures both consumers read.

> **One `hex_field` fix is UNCOMMITTED in that tree** (2026-07-22). `stencil_rotate` and
> `stencil_mirror` passed an already-haloed extent into `edgeset_new`, which halos it again —
> so a rotated stencil could never compare `edgeset_equal` to an unrotated one, and carried
> roughly twice the edge storage (a 3×3 room: 375 → 735 bytes over a full turn). Content was
> never lost, only the bookkeeping. `stencil_from` in the same file did it correctly, which is
> what identified it as an oversight rather than a design. 47 library tests and all 485 of
> ours are green on it. **It is crawler's tree too — commit needs a human call.**

## Decisions taken — do not re-litigate

1. **One model.** Moros's dense 8-byte cell and `hex_field`'s parallel arrays do not
   conflict; the cell is *storage and serialisation* over the field model. Probed, not
   argued (#1) — material and height round-trip with zero differences.
2. **The hex convention is pointy-top, odd-r, `L = √3`**, and `hex_grid` owns all lattice
   math. Four implementations already agreed; `SCENE_MAP.md` was the outlier and is
   reconciled.
3. **The format uses tagged sections, not a flags word** — an unknown section is skipped by
   its length, so a newer writer does not break an older reader. Chosen because it can
   *demonstrate* the property; a flags word cannot be tested for it at all.
4. **Heights are `f64`, labels are `i32`** in the format. Our documented `u8`/`u16` widths
   are enforced nowhere — `70000`, `-3` and `300` all round-trip in the live model — so a
   byte-packer built to the spec would silently truncate.
5. **There is ONE edge layer, and the split is over the write POLICY** — not over the
   storage, and not over "who owns `Surfaces`", which was the wrong axis. `hex_field::EdgeSet`
   owns the storage *and* the surface slot; a consumer owns the rule deciding what goes in it.
   `edge_set_surf` writes what it is told, and first-writer-wins is
   `if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site, where a reader can see which
   rule is in force. Crawler's `EdgeCollider` was a temporary rename to break a name collision
   and **no longer exists** — they deleted their edge storage entirely (crawler `2a72763`,
   2026-07-22) and their `collide`/`sweep_path`/`sight_clear` now take an `EdgeSet`.
   *Consequence for us:* the layout is a two-consumer contract now, so it cannot be changed
   unilaterally — and their `edgetest`/`sweeptest` are a second gate on our EdgeSet work.
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.
8. **The twelve are twelve *placements*, and the reflected six land between the rotated six**
   — so the editor offers a twelve-position dial named as hours on a clock, turns and flips
   alternating (`SCENE_EDITOR.md` § stencils). **Never re-derive this from a radial feature.**
   A door in the middle of a wall sits on a mirror axis, collapsing the twelve to six, which
   reads exactly like proof that only six exist. Measured off-axis: twelve distinct cells on
   one ring, zero collisions. Both the claim and the collapse are pinned in
   `moros_map/tests/clock.loft`, the collapse as the negative control.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.

## loft defects — verified 2026-07-27

Every entry re-run against the installed binary rather than taken from a commit message.

**Everything Moros filed is now fixed** — `H5`–`H13`, each re-run against the installed
binary rather than taken from a commit message. `H11` and `H12` closed by loft `58b66993`,
and the workarounds they forced in `hex_world` are removed with the suite green without
them. Only `H4` is unverified, and it was plausibly `H12`'s family, so it may have gone with
it.

**`H13` is fixed and changes how to debug this.** The editor server IS debuggable now, over
`loft debug src/editor_server.loft --rpc --lib lib/` — a breakpoint in the terrain brush,
hit by a browser client pressing a key, with `eval` and `setValue` live at the frame. That
replaces `println` tracing; the recipe is in [LOFT_DEBUGGER.md](LOFT_DEBUGGER.md).

## What to do next

The sequential work list, with the points that need the user rather than a report, is
**[EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work)**. It is the
answer to "what now" — this section is the answer to "what is stuck".

**Row 0 is answered (2026-07-26): one file per world**, with stencils and placeable assets
in separate files. Row 1 is unblocked. ⚠ The consequence to carry: a world is self-contained
for its *landscape* but not for its *dressing*, since a placement is a reference into an
asset library.

## Open work

**#8 — the world model** (`status:active`). Rows 1–4 done; rows 5–9 remain (many authors,
long-running stores, the crystal port, the convergences). **P13 is answered:** `map_get_hex`
returns a **copy**, so the chokepoint is real but *remembered* at seven sites — which is why
`hex_world` was written fresh beside `moros_map` rather than retrofitted onto it.

**The constants are now chosen for the editor's world** and live in `editor_server.loft`:
`u = 0.25`, `ε = 8`, `θ = 3` (so `ε > 2θ` holds with margin), and `ρ = 0` — the floor
reserve earns its keep when buildings arrive at row 8, and reserving space this rung cannot
use would only shift the world up.

**Camera occlusion is a GAME requirement, not an editor nicety.** A camera that
enters geometry fills the whole screen, and for players sensitive to that it makes a
game unplayable rather than untidy — an accessibility requirement, not polish. The
editor's camera now guards it three ways (predictive arc sampling along the turn, a
bounded smoothed pitch lift, a boom that gives way in one tick) with a hard backstop
that the eye is never below the surface. Measured over a full orbit beside a 36 wu
cone: no violation, worst margin +0.385 wu. Free mouse-dragging beside steep hills no longer reaches
the inside-the-world state at all, which is the case the automated check cannot reach (it
teleports, so it tests the backstop and not the prediction). ⚠ The measured margin is
comparable to the measurement's own resolution, so it is *no violation detected*, not
*proven safe* —
and it is terrain only, deliberately (a tree costs a fraction of the frame; a
hillside costs all of it).

**One case the contract cannot express:** a collapse dropping a floor onto the one below
violates `F1`, and refusing a physical event is wrong. The proposed answer — a collapse
*removes* a layer rather than moving it — has not been shown to cover a partial collapse.

**#2 — recovery.** `loft.lock` in `moros_render` / `moros_sim` still pins June resolutions.
`SCENE_EDITOR_PLAN.md` still needs rebasing against what demonstrably exists.

**#3 — one hex convention** (`status:active`). Three things left:
- **Edge field naming.** `wall_n` / `wall_ne` / `wall_se` actually hold **NW / NE / E**; only
  `wall_ne` is right. The ownership table in `SCENE_MAP.md` is correct — trust it over the
  identifiers.
- **`map_set_wall_dir`'s directions 3/4/5** use parity-blind neighbour arithmetic
  (`(q, r+1)`, `(q-1, r+1)`) — the same class as the three parity bugs already fixed. Live
  code, not on the stencil path.
- The **wall midpoint rule** and the **90°-corner argument** in `SCENE_MAP.md` are still the
  flat-top derivation, marked in place. Re-derive on the lattice; do not relabel.
- The **cross-language parity fixture** (`hex_grid`'s tests and our Python tooling asserting
  one file) is not built.

**#5 — stencils** (`status:active`). The mechanism is done, and **facing landed** — a
stencil's placement is an hour on the clock, **twelve of them**: six turns and six flips,
the flips landing between the turns and never coinciding. Derived from the lattice rather
than declared (`moros_map/tests/clock.loft`, `SCENE_EDITOR.md` § stencils).

> **Do not re-derive this from a door.** A radial feature sits on a mirror axis and collapses
> the twelve to six, which is a fact about that content and not about the dial. Measured with
> an off-axis marker: twelve distinct cells on one ring, zero collisions. The collapse is kept
> as the negative control beside the claim.

**Two real defects fell out of building it**, both invisible while every stencil was
symmetric:
- `stencil_rotate`/`stencil_mirror` in `hex_field` haloed an already-haloed extent, so a
  rotated stencil could never compare equal to an unrotated one and carried ~2× the edge
  storage. Fixed; content was never lost, only the bookkeeping. **Uncommitted in the shared
  tree.**
- **Our stamp bridge dropped walls.** `map_to_stencil` and both `stencil_into_map` paths
  read and wrote edges only for *occupied* cells — but three of the six directions store an
  edge against the neighbour, so a room's wall is owned by the empty cell outside it. The
  door house held 17 walls and stamped 8. Now 17. No count ever caught it because the loss
  was symmetric.

The **caller switch is half done**. `tool_apply` moved to the library path — it was the one
call site that had to, because a facing needs `stencil_rotate` — so `moros_sim` no longer
touches `StencilDef`. Still on the old path: `moros_editor`'s `moros_stencil_stamp`,
`StencilDef` itself, the JSON pair, `stencil_save`, the three `StencilDef` built-ins, and the
undo path `stencil_stamp_with_undo`. That last one is the real work: the library stamp has no
undo bracket yet.

Two more outstanding:
- **An asymmetric stencil.** Every palette entry is rotation-invariant today, so the facing
  is exact and completely invisible. A **house with a door gap** is the obvious first one —
  and it is the same shape as crawler's P5 tail, where *doors are gaps*.
- **A second consumer stamps at least one stencil.** Crawler will not be it soon: they have
  no stencil call sites at all (their world is procedural — `hexplace`, vaults, roofs).

**#6, #7** — not started. #7 (`hex_editor`, the universal editor library) is the one that
carries the framing; #6 is Moros's configuration of it.

**Upstream** — `doc/claude/LOFT_HANDOFF.md` holds H4 (a null reaching exported glTF with a
clean analysis, not minimised after ten hypotheses), H5 (nested `for _ in` runs its outer
body once — four-line reproducer), and H6 (chaining a struct-returning transform empties it).
H1–H3 are fixed upstream.

## How to run things

```sh
make lib-test          # all five packages; goes red properly
cd lib/<pkg> && loft test

# a scratch program against both trees
loft --interpret --path ../loft/ --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.

## Working with the siblings

- **Never edit `../crawler`.** Another agent works there; an edit it did not make breaks its
  picture of its own tree. Read freely, raise findings in the shared package's README or in
  `LOFT_HANDOFF.md`, and let them make the change. It works — they acted on both findings
  raised this way.
- **`loft-libs-world` `dev` is shared and consumed from the WORKING TREE.** A new public name
  can turn the sibling red with no local edit on their side: adding `EdgeSet` cost crawler a
  rename across ~38 files. **Grep the sibling before adding a public name**, and when a build
  breaks with nothing changed locally, read the sibling's `git log` before debugging.
- Both agents have edited the same file at once. **Check `git diff` for someone else's work
  before committing**, and stage-and-commit in one command.

## Three things worth carrying forward from the design work

**A. A mechanism that looks like overhead may be load-bearing for a case you did not
measure.** Twice a "simplification" was recommended and withdrawn — the per-chunk window, and
`base_height` before it. Both times the tell was identical: the mechanism had been measured
against **one** use case. The window survives because it decouples resolution from extent,
which is the only reason one model can serve a dungeon at centimetres and a planet at metres.

**B. Two claims about seams were about nothing of the sort.** Layer kind, then layer identity,
were each argued to need world-global scope "or the fold check is incoherent across a seam".
The fold check reads one column, a column lies inside one chunk, and so it never crosses a
seam at all. A sentence that mentions a seam is not a seam argument — ask instead whether the
operation ever reads two chunks.

**C. A sibling had already solved it, better.** `crawler/PROPS.md` refuted the dressing-layer
design on three axes at once: a level is a *sheet, not a slot*; terrain is dense while
dressing is sparse; and placement is mostly *derived* rather than authored. The uniform-cell
version felt like one mechanism serving two cases — and that feeling was the tell that it was
serving one and disfiguring the other.

## Three things worth carrying forward

**1. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**2. Parity is where this codebase breaks.** Four separate bugs, all the same shape: right for
non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, and negative indices that wrap rather than fail. When touching the
lattice, test **both parities and both signs**.

**3. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.
19. ✅ **`climb`, `collide` and `terrain` fixed — and my item-15 claim was too broad.**
    - **`climb`**: reported the height *wherever the walk was cut off*, so `climbed`
      read 0.743 / 0.682 / 0.866 across runs. It now evaluates the recorded path at
      exactly `TARGET = 8.0` wu by interpolating between the bracketing samples, so
      the answer is a property of the **terrain** and not of when anyone looked:
      **0.619 every run**. A `halved` field re-evaluates from every *other* sample —
      if the number is really a property of the curve, decimation barely moves it.
      **Seen red**: read the last sample instead and `climbed 0.682` vs
      `halved 0.619` → `sampleFree false`, caught in ONE run.
    - **`collide`**: its own header said *"NOTHING HERE IS TIMED"* and the **control
      leg** was timed — an unobstructed walk never goes still, so it ran to a 6000 ms
      cap and `free.gone` was distance-in-six-seconds (19.418 / 19.312). A walk now
      ends for a NAMED reason: STOPPED (position repeats while W is held) or REACHED
      (ground covered passes `TARGET = 12`). `gone` is **12 / 6.052** exactly.
    - ⚠ **The reason must be CONCLUDED from the measurement, not asserted by the loop
      that broke.** My first version set `reached` at the break site, so swapping the
      distance test for a tick budget produced `gone: 12` from a walk of 6.5 wu and
      stayed green. `reached = raw >= target` makes that unsayable — the same defect
      then reports `gone 6.295, reached false` and goes red.
    - **`terrain`** was failing **3 runs in 4**, and only one of the two causes was
      the clock. Eight fixed sleeps, yes — but the real defect is that
      **the phases compared maxima over DIFFERENT DOMAINS.** `yStats` ranged over
      whatever chunks were loaded, and a place changes the loaded set, so `walked.hi`
      read 1.583 or 2.917 depending on what had streamed in and `levels` failed
      against a correct server. Waiting longer would have hidden it. Every phase is
      now measured over the chunks present in **all** of them (240 chunks, 46080
      vertices, stable), plus a `domainHeld` clause so a collapsed intersection
      cannot pass vacuously.
    - **Artifacts are quarantined, not hidden**: `tickOvershoot` (both gates) is the
      sampling granularity and is *expected* to vary — kept in a field that is not a
      claim, which is what lets the claims be exact.
    - ⚠ **STILL CLOCK-PACED, identified and NOT fixed**: `storey` (7 sleeps),
      `trigger` (4), `level` (5), `prop` (3), `doorstep` (2), `cart` (2), `stream`
      (1), and the frame-window trio `hipskin` / `keyonly` / `walk`. All currently
      green. `wip/camera.mjs` too, but it is not in the suite.
    - 23 gates green, 639 library tests pass.
20. ✅ **EVERY WORLD GATE NOW WAITS ON THE SERVER.** The remaining seven are fixed —
    `cart`, `doorstep`, `prop`, `trigger`, `storey`, `stream`, `level` — and `tools/gates/world/`
    now contains **no fixed sleep outside an `ack` poll loop**. 23 gates green on two clean
    consecutive full runs; 639 library tests pass.
    - **Four were ack substitutions**, once it was established that none of them read a mesh: a
      raise applies in full before the next message is read, so on an ordered wire the following
      ack is the entire barrier. `storey` gained a generic `placed` ack; `cart` and `doorstep`
      dropped their raise-loop sleeps outright.
    - **`stream`** replaced a `setInterval` march and a 4200 ms window with acked places and a
      `2:` request/response barrier — the streamer emits no status of its own and a 6 wu step
      need not cross a chunk boundary, so there is no per-step signal to wait for. Now exactly
      reproducible: `added 492 · dropped 216 · live 276 · peak 312 · liveChunks 46`.
    - ⚠ **`level` proved `S:placed` is not always sufficient.** Levelling drops its counter-peak
      from the per-tick hex-change block, and `placed` is sent *before* that block runs. The
      `T:` broadcast sits after it in the same tick, so a **fresh transform** is the only correct
      barrier — and releasing with `6:0` sends no status at all, only a recomputed `py` and
      `moved`. Both barriers are now `T:`.
    - **`trigger`**'s *"let the last rebuild settle"* was waiting for a message it could have
      awaited: `triggers_resolve` runs inside the dirty flush, so `trigger N BROKEN` is the signal.
    - ⚠ **I broke `prop` while fixing it, and the lesson is worth more than the fix.** An added
      `await ack('storey')` sat directly above the existing `const storey = await ack('storey')`.
      An `ack` consumes the message and only sees what arrives *after* it is called, so the
      second timed out and `groundMoved` read false on every run. **Adding a barrier can break a
      gate as surely as removing one.** Recorded in WIRE_PROTOCOL's traps.
    - **Still clock-paced, and deliberately:** `hipskin` / `keyonly` / `walk` are the
      *frame-window* class — they count what arrived in a fixed window, so the counts move by ±1
      by construction while the claims keep real headroom. That is not a wait-before-measuring
      defect. `wip/camera.mjs` is not in the suite.
21. ✅ **A NEW LOFT LANDED TODAY (binary 14:35) AND IT UNBLOCKS `A10`.**
    - **[loft#682](https://github.com/loft-lang/loft/issues/682) is FIXED** —
      `d26c3bef "a closure record was freeing captures it never owned"`. This is the defect that
      kept the editor running its own copy of `A6`'s fixed point, because a lambda capturing a
      `World` panicked the interpreter. **Verified by probe, not by changelog:** the exact shape
      now runs — `captured-world lambda ok, fixed point 2.03125`.
    - Also landed: **#670** (capture-into-a-local losing writes), **#677** (a promotion rule
      deleting a returned parameter's borrow fact), and **#678 both halves** — the working-set
      store loaders now page *in the browser*, which is the read path
      [`HEX_STACK.md`](HEX_STACK.md) §6 depends on.
    - Neighbouring capture fixes worth knowing about: **#685** (a mutated scalar capture from a
      parameter corrupted the frame), **#686** (a capture of a forward-declared type mis-typed),
      **#687** (a mutated text capture's storage decided per binding).
    - ⏭ **So `A10`'s solve switch is ready to finish** — the top item in `CONNECTOR.md`'s Open.
22. ✅ **`A10` IS FINISHED — the cart's solve is the library's, and the diff is empty.**
    The last thing the editor was shadowing: `A6`'s fixed point, inlined because a lambda
    capturing a `World` panicked the interpreter. loft#682 landed this afternoon, so the terrain
    goes in as a function and the copy is deleted. `ground_axle` now owns the fixed point,
    `Rest.rt_frame` is used as the pose rather than rebuilt from its own numbers, `ground_gap` is
    called twice instead of copied, and `A-FIT`'s refusal is **broadcast with its offer and
    residual** where the inlined version could only `break`.
    - **Bit-identical**: `worstGap 1.540269400912564e-8`, `maxBank 0.08314124584252244`,
      `worstHubRel 8.326672684688674e-17` — unchanged to the last digit.
    - ⚠ **The control that matters**: identical output is also what a switch that *did not take*
      would give. So the red case perturbs **the library** (`atan2(…) * 1.05` inside
      `ground_axle`) and the editor moves with it — `worstGap` → 0.00228, `grounded` false, gate
      red. That is the proof the editor calls the library rather than shadowing it.
    - **A loft rule worth keeping**: a lambda held in a *variable* cannot infer its parameter
      types — there is no expected type at an assignment, only at a call. Use
      `fn(x: float, z: float) -> float { … }`; the `|x, z| { … }` form is fine passed directly
      into a call. The compiler names the fix.
    - `CONNECTOR.md`'s **Open** list is now four items, none of them `A10`.
23. ✅ **`A9c` RECONCILED, and the loft regression that blocked it is gone.**
    - **The indexing was an ERROR, not a numbering.** `A9c` had recorded that the library and
      `P6` *"are not the same numbering"* and that **neither is wrong**. Measured: the library
      was **29.6 % out at N=10** where `P6` predicts **1.0 %**. Two faults that partly cancelled
      — the moment loop ran `for k in j..n`, sweeping a station's own bone (the one **inboard**
      of its hinge) into that hinge's moment; and the load centroid was taken **outboard** when
      a station sits at the outboard *end* of the bone it stands for. Both fixed. The library
      now reproduces `P6`'s hand-derived `tip/δ = 1 + 1/N²` to **better than 1e-10**.
    - **The new test asserts the CONSTANT, not the order** — a second-order scheme converging to
      the wrong constant would pass a bare closeness test at large N and be wrong everywhere.
      Tolerance 1e-9 is the physics (nonlinearity ~1e-12, float noise ~1e-13), not a fitted slack.
    - ⚠ **Two existing tests were encoding the bug**, and both are now sharper: "all ten joints
      turn" is **nine**, with the outermost hinge's exact zero pinned; and the convergence test
      was calling `asm_cantilever(n, span/n)` when **`n` is stations and the beam is `(n-1)·seg`**,
      so every sample was a different beam — 11 % at n=24, which the old outboard shift
      compensated. Two wrongs let it pass.
    - ⚠ **[loft#693](https://github.com/loft-lang/loft/issues/693), filed and fixed the same
      hour.** A closure capturing a store-backed value emitted `db.dbref_borrow()` into every
      `#native` library's generated cdylib, which could not call it — **the editor would not
      start at all**, so the gates were briefly unverifiable. The trigger was `A10`'s own
      capture, the thing #682 had unblocked an hour earlier. Filed with a 12-line reproducer;
      fixed upstream as *"name the binary↔rlib mismatch, and gate it at install time"*.
    - **Verified on the fixed loft (binary 16:13): 23 gates green on two consecutive full runs,
      642 library tests pass**, cart bit-identical through the capture that tripped it.
    - `CONNECTOR.md`'s **Open** is now three items: a team is not a tree; steep ground — refuse
      or tip; and where the states are advanced (the sandbox seam, #15).
24. ✅ **`P-TEAM` — a team IS a tree, and both halves of the open claim were wrong.**
    - **"Two links into one body" was an artifact of rooting at the HORSES.** The root is a
      *labelling* choice, not a physical fact: re-root at the cart and every body has one
      parent. `A-TOPO` admissible, every body closes, mobility 4. `asm_towed` roots at the
      horse because there is one puller; with two that convention does not generalise, and
      **nothing but the convention was ever in the way.**
    - **The proposed repair was a cost with no benefit.** A pole on two ball hitches is
      **DOF-neutral** — a body worth six, two hitches worth three each — so it does not hold
      the horses abreast, and it is *the only thing that would make the graph non-tree*.
      What would break the tree is a pole with joints **stiffer than hitches**: a real closed
      chain, genuinely outside this representation, and now precisely characterised.
    - **`A-DOF` is sufficient for every topology question this representation can pose.**
      `system freedom − ledger mobility = Σ residual`, exactly, on all five fixtures. A tree
      carries no link that no body owns, so the per-body ledger *is* Grübler. The only way
      they could part is a link outside the tree — which the structure cannot express.
    - ⚠ **The probe's first version fell into `A9c`'s trap**: it hand-wrote a joint list per
      fixture and reported "disagreements" that were its own arithmetic. Deriving the system
      count *from the assembly* turned a hand-check into an identity. **Twice in this plan,
      measuring a second numbering has masqueraded as measuring the rule** — worth carrying
      as a habit, not just a note.
    - `asm_team` is a library fixture with two tests, **seen red both ways**. 289 moros_sim
      tests (644 across the packages), 23 gates green.
    - `CONNECTOR.md`'s **Open** is down to two, and both are deferrals rather than unknowns:
      steep ground (refuse or tip — tipping is dynamics this rung does not have), and where
      the states are advanced (the sandbox seam, [#15](https://github.com/jjstwerff/moros/issues/15)).
25. ✅ **CLIFFS ARE BUILT — steep ground blocks the walker, as an edge.**
    `lib/moros_sim/src/cliff.loft` + 7 tests; `tools/gates/character/cliff.mjs` is the 24th
    gate. Measured before designing, so the design had a number to answer to.
    - **Before:** the character walked a **66.6°** face and summited a 9.25 wu hill. The
      editor said why in its own words — *"no jump, no fall, no step limit yet"* — and
      `walk_to` consults only `sweep_path` over an `EdgeSet`, so steepness was never asked.
    - **After:** steepest walked **25.7°**, peak **0.664** wu, summit refused. And
      `climb.mjs` is **bit-identical at 0.619** — the rule discriminates rather than blocks.
    - **The invariant: impassability is an edge, always.** A cliff is a *derived* edge from
      the height difference, in the same `EdgeSet` a wall uses, consulted by the same sweep.
      One blocking mechanism, one re-assertion site — a slope test in the walk would have been
      a second, needing its own copy in every future mover.
    - **Seen red twice.** `cliff_step() -> 9999` returns the probe to *exactly* its old
      numbers (66.6°, 9.085, summit true) and turns the new gate red — so the wiring is live,
      not the probe flattering itself.
    - ⚠ **The gate asserts the walker still covers ground** (7.79 wu). "Did not summit" alone
      passes for a character that cannot move — the second time this plan has had to close
      that hole, after `collide`'s control leg.
    - **The threshold is configuration, not a library constant**: `cliff_edges` takes it as a
      parameter and the editor passes its own hip height. How tall a step a creature can take
      is a property of the creature.
    - ⚠ **Symmetric, deliberately, with a named trigger.** `hex_edge` blocks the canonical
      edge, so a cliff stops you both ways. That is consistent only while no walker can
      *descend* faster than it climbs — the day a **fall** exists, a cliff needs a direction.
      A test asserts the symmetry so that day fails loudly. Cost named now: a character
      *placed* on a plateau is fenced in by its own cliffs.
    - **24 gates green, 651 library tests pass.**
26. ⚠ **THE FALL — the primitive is BUILT and the editor is deliberately NOT wired to it.**
    `lib/moros_sim/src/fall.loft`, 8 tests, 304 in the package. One invariant — *the feet are
    never below the ground, and above it only while falling* — which covers climbing too, so
    there is no separate climb branch. Free fall checked against `½gt²`, landing reported once,
    terminal velocity asserted to be the **shared** constant.
    - ⚠ **It nearly shipped as the package's second gravity.** `player_step` already falls, with
      `GRAVITY = 12.0` and `TERMINAL_VELOCITY = 60.0`; it cannot be called because it moves
      against a `Map` while the editor holds a `World` — `HEX_STACK` §4's split. The first draft
      invented `GRAVITY_DEFAULT = 11.0` beside it. Fixed to import them.
    - ⚠ **Wiring it dropped the character three storeys into a cellar it had just dug.**
      Measured: `cell 0,10` reads `1,49` before three `12:-1` and `4,13` after, column
      `13,25,37,49`. `terrain_h` reads `SURFACE = 0`, and `WORLD_MODEL.md` says layer order is
      **local** — layer 0 is the *lowest*, so a cellar promotes itself to "the surface".
      A pre-existing defect the fall exposed, like the raise's origin and the camera's latch.
    - ⚠ **Three ground queries were tried and all three were wrong** — at-or-below-the-feet
      (oscillated and hung the gates), multi-layer-only (a fresh column is already multi-layer),
      top-versus-terrain-layer (fired everywhere; `climb` fell 0.619 → 0.369). **The next
      attempt starts from `world_layer_kind` and the cave rule, not from an index**, and it is
      world-model work rather than fall work.
    - **The editor is reverted to its committed state**, so the tree is green: 24 gates, 651
      library tests. `probe/fall.mjs` holds the target measurement — 8.976 wu over 10
      accelerating ticks, against 2 for the old behaviour — as a probe, not a gate, because the
      editor cannot pass it yet.
27. ✅ **WHICH LAYER IS THE SURFACE — SETTLED, and normative in `WORLD_MODEL.md`.**
    > The surface at a hex is the **highest occupied `KIND_TERRAIN` layer at or below the
    > feet.** Not the lowest (the cellar), not the highest (a deck above you), not an index —
    > and it takes the feet, because a storeyed column *has no single surface*.
    - **Measured**, the same cell three ways: virgin → `cell 0,0` material **0/absent** with an
      **empty** column; two storeys up → `1,25` with `25,37,49` (layer 0 untouched); three
      cellars → `4,13` with `13,25,37,49` (**layer 0 displaced**). So storeys append above and
      only a cellar displaces layer 0 — and virgin ground has *no* occupied layer yet still
      carries a height in an absent cell, so "occupied" and "has a height" are different.
    - **The tolerance is the model's own** — layers are ≥ `ε` apart, so `ε/2` cannot pick the
      wrong one and absorbs the gap between a smoothed surface and its cell's integer height.
      **Smooth for terrain, flat for what is built on it.**
    - **Confirmed by the case that exposed it**: with the rule applied, `stencil.mjs`'s cellar
      scene returns to *"kept 56 below"*.
    - ⚠ **Deliberately NOT enforced yet.** The feet were derived from the ground only on a
      move, so they are **stale everywhere**: with them tracking it, `climb.mjs` starts at
      **0.25** rather than 0, because four raises lift the ground under a standing character and
      the editor never noticed until they walked. **The old zero was not a measurement; it was a
      value nobody had refreshed.** Re-establishing baselines taken against stale feet is its
      own deliberate work, and doing it as a side effect of the fall is how a suite quietly
      stops meaning anything.
    - Editor reverted to committed state; **24 gates green, 651 library tests pass**.
28. ✅ **THE RULE IS ENFORCED AND THE FALL IS WIRED. 25 gates green on two full passes.**
    - **`surface_units` / `ground_under`** implement `WORLD_MODEL.md`'s rule — the highest
      occupied `KIND_TERRAIN` layer at or below the feet, with `ε/2` as the tolerance, smooth
      for terrain and flat for what is built on it. The fall is its only consumer.
    - **Re-establishing the baselines was the work, and it was smaller than feared**: of 24
      gates, **every `world/` gate is byte-identical**; only the character half moved.
      - ⚠ `climb`: `startY 0 → 0.25`, `climbed 0.619 → 0.369`, `yAtTarget` **unchanged**. The
        old baseline was **stale** — four raises lift the ground under a standing character and
        nothing noticed until it walked, so 0.619 was 0.369 of climb plus 0.25 of staleness.
        Threshold recalibrated 0.4 → 0.25, keeping the same 1.5× margin, with the reason in the
        gate rather than in a commit message.
      - `hipskin` / `keyonly`: the frame-window class — counts move by ±1 by construction and
        every geometric figure is identical.
    - **Gated both ways.** Reverting to layer 0 makes `stencil.mjs`'s cellar scene refuse
      (`keptCave false`); removing the fall drops `fall.mjs` from **10** accelerating ticks to
      **2**. Neither the rule nor the fall can be silently lost.
    - ⚠ **`terrain_h` still reads layer 0**, so meshing and the camera keep the old assumption.
      Deliberately out of scope: the feet are where the rule is observable today, and a mesh
      drawing the wrong layer is a separate claim needing its own baseline work.
    - **25 gates, 651 library tests.**
29. ⚠ **`terrain_h` CANNOT take the surface rule — the model is missing a fact, and this is
    where that became provable.** Recorded in `WORLD_MODEL.md`.
    - **The defect is real and measured**: dig three cellars under a hill and the *drawn* ground
      sinks with them — peak **10.917 → 5.583**, `cell 0,10` from `1,49` to `4,13`.
    - **But no rule over the current data is right.** `terrain_h` has no feet, and: layer 0
      (today) is correct for a tower and wrong for a cellar; the highest terrain layer is
      correct for a cellar and renders a tower's top deck as terrain; the feet rule needs feet
      meshing does not have. A cellar floor and the ground are **both** `KIND_TERRAIN`
      heightfields and nothing marks which is which.
    - ⚠ **Three mechanisms were considered and all three fail identically** — a third
      `ly_kind` (then `world_cell` stops returning built floors at all), a reserved `ly_id`
      label (the model's own idea and a good fit), a per-chunk ground index. **All break on
      `world_set_column` being POSITIONAL**: `co_cells[i] → ck_layers[i]`, so a cellar insert
      shifts the *cells* down while a marker on the *layer* stays put — the label lands on the
      cellar.
    - **So the fix is to the column-write contract, not to a query**: either the write becomes
      insertion-aware and carries markers with their cells, or the ground is identified by
      something travelling *with* the cells. That is a store change — `lib/hex_world`, its
      persistence, and the contract — and it deserves its own pass with its own baselines.
    - `terrain_h` is left **honest-but-wrong and documented**, rather than given a rule that
      trades a tower for a cellar. 25 gates green, 651 library tests.
30. ⚠ **The column write's marker fix — DESIGNED, ATTEMPTED, REVERTED. Three obstacles named.**
    The design is settled and grounded entirely in the contract: `F1″` makes order height order
    (so an insert *must* shift indices — that is the invariant working), Part II already says
    **"index is not identity"**, `I1` uses labels by **equality only** so a label is the one
    marker an insert cannot move, and **`ν` (`w_next_id`, "next free label") exists, is
    persisted, and is never incremented** — every layer's label is `0`, the mechanism stubbed
    out and waiting.
    - **The change**: `Column` gains a defaulted `co_ids` (no existing literal breaks), a read
      fills it, and the write **inserts** a layer where the incoming label is `0` instead of
      appending at the end, so every existing layer keeps its label with its own cells. New
      layers take a fresh label from `ν`.
    - ⚠ **Stopped at three things, all now named rather than rediscovered:**
      1. **loft #690** — a loop variable may not silently change type; `k` is a `Chunk`
         elsewhere in the file. Small, and the compiler says so.
      2. ⚠ **A store-lifetime refusal on the operation the change cannot avoid**: rebuilding
         `ck_layers` and assigning it through `&World` raised *"Claim on read-only store,
         locked by CONST_STORE init"* — the #670/#677/#682 family, at the heart of an
         insert-into-a-nested-vector-of-a-borrowed-store.
      3. **Dressing regressed** — *"a TERRAIN write deleted the dressing"*. The write has a
         careful rule that a terrain write must never write back the absent placeholder a read
         produces for a dressing slot; an insertion pass must preserve it by design.
    - **Reverted; `hex_world` is 58 tests green again**, 25 gates, 651 library tests.
    - **Next attempt starts at obstacle 2**, because it decides whether the insert is writable
      in loft today at all — and builds obstacle 3 into the design rather than finding it in a
      test.
31. ✅ **THE BLOCKER IS FILED, AND MY DIAGNOSIS OF IT WAS WRONG.**
    [loft#697](https://github.com/loft-lang/loft/issues/697) — *a `vector` field with a default,
    omitted from a literal, panics the interpreter*.
    - ⚠ **It was never a store-lifetime issue.** A 20-line standalone rebuild of a nested vector
      through a `&` reference **works**, and keeps every marker with its cells — so the insert,
      the part that looked hardest, is already proven. Bisecting the change in halves put the
      breakage on **the `Column` field alone**: declared, never written, never read.
    - **Minimised to seven lines**, with an exact boundary: a defaulted **vector** field omitted
      from a literal panics (`index out of bounds … 28402`, `src/keys.rs:901`); supplying it
      works; a defaulted **scalar** works; field order is irrelevant. In a larger program it
      silently reads back **wrong** instead of panicking — which is what produced the
      `Claim on read-only store … CONST_STORE init` message that sent me looking at lifetimes.
    - **It blocks the column-write fix directly**, because the default is *the whole reason the
      change is additive* — it is what lets the twelve existing `Column { … }` literals keep
      compiling. Supplying it at every site is the workaround and defeats the point.
    - Reproducer kept at `plans/14-props-dressing/probe/default_vector_field.loft`.
    - Tree restored and green: **25 gates, 651 library tests**, `hex_world` 58.
