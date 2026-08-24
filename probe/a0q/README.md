# `A0q` — the library holds here, and `surface_heading` is not what I thought it was

**Run 2026-08-22.** Plan [24](../../plans/24-one-authority/README.md) `A0q` — the control
[`A0p`](../a0p/README.md) never ran: **call `hex_draw`, on input it accepts.**

```sh
make probe-a0q
```

## Result

| § | claim | verdict |
|---|---|---|
| **1** | every side of every orientation is an exact lattice direction | ✅ **48 of 48** — 12 orientations × 4 sides, `surface_heading >= 0` throughout |
| **2a** | one notch must NOT move the heading | ✅ **4 of 4** notched fixtures — the run grew, the direction did not |
| **2b** | a deviation that moves the chord MUST give `-1` | ✅ **5 of 5** — the check can fail |
| **2c** | straightness is `surface_lsq_residual`, not the heading | ✅ clean `0.9166666666666679`, notched `8.769` |
| **3** | the ends come out of `surface_span` | ✅ all four sides |

## ⚠ The corroboration that makes §1 mean something

`@HB-X47`'s own control, upstream, reads: *"the scatter a least-squares fit would threshold is `0`
east and **`0.9167`** north."*

This tree measures the north family at **`0.9166666666666679`** — to the digit, from a different
checkout, a different toolchain and a different program. **That is what says §1 is calling the
function hexbody gated, on the same geometry**, rather than something that merely returns
plausible integers. A green with no such tie-back would have been a fact about my probe.

## ⛔ The finding: `surface_heading` is blind to a notch, and cannot be otherwise

The first version of this probe bumped a cell out of a side and expected `-1`. It got `3`,
unchanged, with the run **9 → 13 edges**. That is not a defect and not a miss:

> **A boundary run's summed edge vector TELESCOPES to the chord.** The edges of one side form a
> path, so their sum is `(end corner − start corner)` and nothing in between survives. A notch is
> a **closed detour** whose vectors cancel exactly.

So §6.1's exactness is a statement about **where a run's ends are**, and it is blind *by
construction* to what the run does between them. Measured both ways: a notch that cancels leaves
the direction untouched (§2a), and two removals that move the chord give `-1` (§2b).

⚠ **THE PLAN'S OWN INVARIANT-GATE ROW FOR `A0q` WAS WRONG**, and said *"a deliberately bent side
must return `-1`"*. A bent side returns its chord. The row is corrected.

⚠ **AND THIS IS THE LOAD-BEARING FACT FOR `L1`.** Recovering a wall from the store means reading
a chain of marked edges and asking *is this one straight wall*. `surface_heading` **cannot answer
that** — it will hand back an exact heading for a chain that zigzags, doglegs or doubles back, as
long as the ends line up. The straightness question belongs to `surface_lsq_residual` (or
`surface_fitted_spread`), and `L1` needs **both**: the chord for the direction, the residual for
whether there is one wall there at all.

## What `surface_of` ignores, which is also useful

A cell added **outside** the plan changes nothing — 27 → 28 cells, and all four sides report
identical edge counts and headings. `side_edges` classifies by the plan's own local frame, so
`surface_of` is robust to junk beyond the massing. ⚠ **That is a property of domain A only**: it
works because there *is* a plan to classify against. A free wall run in the world has none, which
is exactly the gap `L1` names.

## §3 — the ends, and why they do not answer open question 1

```
side 0: span (4.71502719838, -3.5) → (4.71502719838,  3.5)   9 edges
side 1: span (4.33012701892,  3.75) → (-4.33012701892, 3.75) 10 edges
```

The ends come out, exactly, and the two families differ as §6.2 says they must
(`0.8660 = √3/2` against `0.5`). ⚠ **But this does not close plan 24's open question 1**, which
is about a **free run** whose ends were quantised away by the stamp. Here the ends come from the
plan's own corners, and `@HB-X62` is explicit that what a miter recovers is the **cell-region**
corner, not the continuous model corner — *"the drift is `0.47946432048171` at every corner,
spread `1.33e-15`, a uniform bias, not scatter"*. Domain A's ends are exact because a plan is
there to be exact about. Question 1 stays open, and stays upstream.
