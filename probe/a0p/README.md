# `A0p` — result: recoverable, but **not by fitting points**

**Run 2026-08-21.** Plan [24](../../plans/24-one-authority/README.md) `A0p`.
Predictions were pre-registered in [PREDICTION.md](PREDICTION.md) and are **not edited here** —
this file is what happened.

```sh
make probe-a0p          # or: loft --interpret --lib lib/ probe/a0p/a0p.loft
```

## ⛔ CORRECTION, 2026-08-22 — BOTH RUNS BELOW MEASURE MY OWN CODE, NOT A LIBRARY

**The ground rule is: the algorithms are never ours.** Everything below violated it, twice, and
the numbers are void as evidence about `hex_draw` — which was never called.

| attempt | what it did | result |
|---|---|---|
| **1** — the run below | fitted a principal axis through edge **midpoints**, in floats | 19 of 24, five wrong by 10.458° |
| **2** — [`exact.loft`](exact.loft) | copied `hex_draw::surface_of`'s **integer body** into the probe *"with the `Plan` taken out"*, and invented a fold to replace the ordering the `Plan` had been providing | **8 of 24 — worse**, `surface_heading` = `-1` on 22 of 24 |

⚠ **A DUE-EAST WALL SUMMED TO `(-14, 0)`.** The edge vectors **cancelled**, and that is the
whole diagnosis: `surface_of` walks a plan's side **in reading order**, so every edge vector
points consistently around the outside. A scan of the store has no order at all. Attempt 2 saw
the cancellation and invented a fold into a half-plane to patch it — which destroys direction
and is why it scored below the float fit it was written to correct.

✅ **AND THAT MISDIAGNOSIS IS THE USEFUL PART.** The gap looked like *we need a line-fitting
algorithm*. It is not: the arithmetic exists and is exact. What is missing is **an entry point
that accepts what the store has** — an unordered set of marked edges — and **the ordered
chain-walk** that turns it into the `SideRun` `surface_of` already consumes. Both belong in
`loft-libs-world`, not here. Plan 24 `A1` is rewritten accordingly.

⚠ **The measurements are kept, not deleted**, because they are the record of how the rule was
broken, and because attempt 2 scoring *below* attempt 1 is the cleanest evidence there is that
a better algorithm applied to the wrong input beats nothing.

---

## The verdict in one line, ON MY OWN FIT — read as a record, not as a finding

⚠ **`P1` IS REFUTED. 19 of 24 headings, not 24** — and the five that fail are wrong by
**10.46°** against a **15°** quantiser, so they snap to the neighbouring heading.

**This does not kill plan 24.** It kills the *obvious* implementation of `A1`, which is worth
much more than a green would have been: the fit here is a principal axis through edge
**midpoints**, and the failure is in the method, not in the information. See
[what `A1` must do instead](#what-a1-must-do-instead) — the fix makes the recovery **exact**
rather than better.

## What was measured

| prediction | verdict | the number |
|---|---|---|
| **P1** all 24 headings recover | ⛔ **refuted** | 19 of 24. `k = 4, 8, 12, 16, 20` miss |
| **P2** heading recovers mod 12 | ⛔ **refuted for those five** | the other 19 are exact |
| **P3** an axis, not a direction | ✅ **confirmed** | `k=7 → 19`, `k=9 → 21`, `k=11 → 23` — every recovery differs from the stamp by 12 as often as not |
| **P4** ends inward, ~half a cell | ◐ **worse than predicted** | **worst 1.220**, and **0.653 even where the heading is perfect**. Never zero |
| **P5** the worst headings are lattice-aligned | ✅ **confirmed**, and the reason is not the one predicted | the five misses are exactly the 60° family |

The shape of the error is completely regular, which is what says it is systematic and not noise:

| headings | edges | angular error | end error |
|---|---|---|---|
| `k=0` | 14 | **0°** | 0.837 |
| odd `k` | 15 | 1.507° | 0.653 |
| `k ≡ 2 (mod 4)` | 17 | 6.360° | 0.772 |
| `k ≡ 0 (mod 4)`, `k ≠ 0` | 15 | **10.458°** ⛔ | 1.220 |

## ⚠ `k=0` is LUCKY, and reading it as "the lattice is asymmetric" would be wrong

`k=0` recovers perfectly, with `spread 0` — every edge midpoint exactly collinear. Its five 60°
rotations do not. A 60° rotation about a cell centre **is** a lattice symmetry, so the first
reading is that something in the stamp or in `hex_to_px` is not rotationally symmetric — which
would be a serious defect somewhere else entirely.

**It is not that.** The run is 12 units long from the origin, so `k=0` ends at `(±6, 0)` while
`k=4` ends at `(±3, ±5.196)`. Those are *not* equivalent positions in the lattice: the ends fall
at different places within their cells, so the two edge chains are not congruent and the
**end effects differ**. `k=0` is the case where the ends happen to land symmetrically.

⚠ **That is the whole finding, stated in the negative: a point-fit is biased by its ENDS.** The
middle of the chain carries the line perfectly; the last edge at each end is a partial,
asymmetric sample, and with 15 points a lopsided pair of ends tilts the axis by 10°.

## ⚠ Control 1 FAILED, and it is the most useful line in the run

```
── control 1: the same 24, fitted axis turned by ONE of the 24 ──
  ⛔ 4 of 24 STILL MATCHED under a one-step rotation
```

The check was supposed to go red for **all** 24 when the fitted axis is deliberately turned by
one step. Four stayed green.

**That is not a bug in the control — it is the control doing its job.** Four of the headings are
already wrong by ~0.7 of a step, so rotating them by a full step lands them *on* the right
answer. It says something the pass/fail count above cannot:

⚠ **the fit's error is comparable to the quantiser's step, so "correct" and "wrong by one step"
are not cleanly separable at all.** A `19 of 24` read on its own would have been taken as *five
edge cases to polish*. It is not — it is a method whose resolution is the same size as the thing
it is resolving. Without this control, `A1` would have been built on a fit and tuned until the
count reached 24, which is curve-fitting to a fixture.

## ✅ Control 2 passed, and it settles a design question

```
  L-bend:   16 edges over two runs · fitted step 3 · spread 0.452
  straight: 14 edges                                · spread 0
```

A corner and a wall are **cleanly separable** by the straightness ratio — 0.452 against 0, not a
near thing. So `A1` does not need a separate corner detector: a straightness test on the fitted
region is enough to refuse a bend, which is the negative control the
[invariant gate](../../plans/24-one-authority/README.md#invariant-gate) asks for at `A1`.

## ⛔ What `A1` must do instead — SUPERSEDED, see the correction at the top

⚠ **The section below proposed that `A1` compute a convex region in `(angle, offset)` space.
That is an invented algorithm and it is not `A1`.** It is kept because the *observation* under
it is still true and is what points at the real gap — a marked edge means the line **crosses**
it, which is a hard geometric fact the midpoint fit softened. But the conclusion drawn from it
was to write geometry here, and the answer is to call `hex_draw`.

## What `A1` must do instead

⚠ **The information is there; the method threw it away.** A marked edge does not mean *the line
passed near this midpoint*. It means **the line CROSSES this edge** — that is what
`wall_stamp`'s halfplane test decided, exactly. A midpoint fit weakens a hard geometric
constraint into a soft one, and then the ends bias it.

**So `A1` is not a fit. It is an intersection:**

- each marked edge is a segment the line must cross → a **constraint on the line's two
  parameters**;
- the set of lines satisfying all of them is a **convex region** in `(angle, offset)` space;
- the recovery is that region's centre, and **its extent is the recovery's own error bar** —
  which the midpoint fit cannot produce at all;
- an **empty** region means the chain is not one straight line. ⚠ That is the bend test for
  free, and it is exact where control 2's ratio is a threshold.

⚠ **AND IT MAKES THE ENDS A SEPARATE QUESTION, WHICH IS THE RIGHT SHAPE.** The line comes from
the crossings; the ends come from the extreme crossings *along* it, and the residual `P4` error
(0.65 even when the angle is perfect) is a **quantisation floor** — the store simply does not
record where between two cells the author stopped. That number is
[open question 1](../../plans/24-one-authority/README.md#open-questions)'s answer, and it does
not go to zero however good the recovery is.

## What this probe does NOT cover

- **Every fixture is a single chunk.** A run crossing a chunk boundary presents a truncated
  chain, and plan 24's open question 3 is untouched by this. `A1`'s fixtures must straddle one.
- **One length, one origin.** All runs are 12 units through `(0,0)`. Since the finding is that
  **end effects dominate**, length is exactly the variable most likely to change the numbers —
  a short run is mostly ends. `A1` must sweep length, and a two-edge stub is the limiting case.
- **No openings, no annex walls, no rings.** `A2` is where those arrive.
