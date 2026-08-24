# `M1p` — result: ✅ **the cells are not 15° wide, and the old quantiser really was wrong**

**Run 2026-08-24.** [AUTHORING_MAP](../../doc/claude/AUTHORING_MAP.md) §5.2 — the facing→direction map.

```sh
make probe-m1p          # or: loft --interpret --lib lib/ probe/m1p/m1p.loft
```

## Why measure something this obvious

`|D| = 24`, so the natural reading is *24 directions, 15° apart, cells 15° wide*. That reading is
what the deleted `hex_editor::WALL_SNAP` implemented — `atan2` divided by `2π/24`.

⚠ **It is false, and it is false for a reason already written down.** `D` is 12 exact headings
plus 12 in-betweens carrying a **uniform 1.1021° bias** at vector `(7,−2)` (`@HB-X29`, `@HB-X56`).
So the directions are not equally spaced, and the preimage cells of a nearest-neighbour quantiser
cannot be equal either.

## Q1 — the cells, period 4

| `d24` | actual − nominal | **cell width** |
|---|---|---|
| even, one class (`0, 4, 8, 12, 16, 20`) | 0 | **13.897886248013975°** |
| odd — every in-between | ±1.1021° | **15.000000000000000°** |
| even, the other class (`2, 6, 10, 14, 18, 22`) | 0 | **16.102113751986025°** |

The two extremes are `15 ∓ 1.1021` — **exactly twice the bias**, which is what says the pattern is
the bias and not noise. ✅ The actual angles increase monotonically with `d24`, so the bisector
model the widths are computed from applies (asserted in the probe, not assumed).

> **`X109`: the authoring resolution is 6.949°** — half the narrowest cell. An author aiming at an
> arbitrary heading gets a direction within 6.949° of it, worst case, **and no input precision
> improves that.** It is the lattice's granularity, not the controller's.

## Q2 — ⛔ the deleted uniform grid picked a **different** direction on 3.70%

**1332 of 36001** sampled headings resolve to a different `d24` under nearest-in-`D` than under
the old 15° grid, first disagreeing at **6.95°**.

✅ **So `H1e` was a correctness fix, not a tidy-up.** The uniform grid selects the wrong `d24` on
a band around every in-between — an author aiming at one direction was handed its neighbour.

⚠ **AND THIS IS THE CONTROL THAT MATTERED.** A probe asking only *"does it snap to one of 24
things"* would have called **both** quantisers correct, because both do. The question that
separates them is *which* of the 24, and only a direct comparison can ask it.

## Q3 — ✅ monotone and complete

**24 boundaries in one full turn, each `+1`, none backward, none skipped.** So:

- every `d24` is reachable by aiming (`X105` holds — no cell is empty);
- turning further never hands back an earlier direction, which is `X104`'s precondition: a live
  "current direction" readout is a truthful preview because the map has no folds.

## What this does NOT cover

- **`H₁₂` and `O` are not measured.** `FORMAL_CORE` §2 is explicit that the three sets are not
  interchangeable, and a house wall is `H₁₂` — its cells are a separate question with a separate
  answer, and §5.2's numbers must not be quoted for it.
- **No stick is involved.** `X106` compares the 6.949° budget against an input resolution that
  does not exist yet — `input` has no continuous axis ([BLUEPRINT](../../doc/claude/BLUEPRINT.md) §3.2).
- **Angles only.** The position quantiser (§5.1) is asserted trivial on the geometry and is not
  measured here.
