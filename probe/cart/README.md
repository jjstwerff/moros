# The cart's rest solve — the probe that named the defect, and refuted the obvious fix

Run: `loft --interpret --lib lib/ probe/cart/converge.loft`

`converge.loft` sweeps the terrain slope against the round count, on PLANES, because a
plane's answer is closed form — `β = −atan(s)` — so every row has a known right answer to
be wrong against. That is the whole of why it settled the question in one run.

## What it found, and what it killed

The symptom was *"the cart's wheels leave the ground on a real slope"* — worst gap `1.3e−3`
at bank 0.396 and `9.8e−2` at 0.833. The obvious reading is **not enough rounds**: the
editor asked for the default 3, and `ground.loft`'s own header states the rate is `≈ s²`.

The probe refutes it. Three regimes, not one:

| terrain slope `s` | old solve, whatever the round count |
|---|---|
| `≤ 0.2` | fine — 3 rounds reach `3.6e−6` |
| `0.6` – `0.9` | converges as `s²`, far too slowly: 40 rounds still leave `7.3e−5` at `s = 0.9` |
| `≥ 1.0` | **`ok false` on round one** — refused, bank 0, wheels 0.6–1.9 wu off the ground |

**More rounds cannot fix the third row**, and the third row is the one that matters: the
raise brush's documented flanks are 74–83°. A plane of slope 2.0 has a perfectly good rest
at `β = −1.107`, and it was refused.

⚠ **The refusal was asked in the wrong place.** `A-FIT` — *the ground drops further across
the axle than the axle is long* — is a real rule. But it was evaluated at the CURRENT
iterate, and the iteration is seeded at `β = 0`, which is the widest span the axle ever has.
The span shrinks as the axle tilts; the doorstep was asked before any tilting happened.

## What replaced it

Solve for the horizontal half-span `t` instead of the bank, and the bracket comes free:

    H(t) = (2t)² + d(t)² − (2w)²        the chord between the contacts IS the axle
    H(0) = −(2w)² < 0                    contacts coincide, chord zero
    H(w) = d(w)²   ≥ 0                   at full span the chord already exceeds the axle

so a root exists on `[0, w]` for any continuous terrain at any slope. Iterating on `u = t²`
makes a plane **exact in one step**, because `H = 4(1+s²)·u − 4w²` is linear in `u` — and a
heightfield is a plane between its samples.

Measured after, on the same sweep: every slope from 0.2 to 3.5, `ok true`, bank equal to
`−atan(s)` to the last digit, worst gap at machine epsilon, **in one round**.

## The lesson worth keeping

The header of `ground.loft` had stated the failure for as long as the file existed —
*"the rate is `≈ s²`"* is a divergence warning above `s = 1`, written down and never read as
one. What made it invisible was the FIXTURE: `cart.mjs`'s hill never reached its cart, so
`grounded` had only ever been asked about a step between two flat plateaus, where the solve
is exact. **A clause that has only been asked easy questions reports the same green as one
that has been asked hard ones.**

⚠ **`hitched_rest` — the towed trailer — still has all of this**, and no consumer. Measured
with the same probe shape: refuses a plane from slope 0.9 upward (`ground drops 0.946 across
an axle of 0.903`), and leaves `3e−4` at 0.6. It is a coupled two-unknown solve rather than
this one-dimensional root find, so it is recorded in OPEN_ISSUES rather than patched by
analogy.
