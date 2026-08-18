# `probe/way` — `hex_way`, and what we actually build against

Measured 2026-08-18, after the user asked for an inspection of `hex_way`'s branches.
Two separate findings, and the second is about this tree rather than about the library.

## ⛔ A. `seg_distance` normalises an angle in ONE direction — in both copies, unreported

```loft
  aa = a;
  while aa < lo { aa = aa + 6.283185307179586; }   // …and never `while aa > hi { aa -= 2pi }`
  if aa <= hi { … on the arc … }
```

An angle is a **direction, not a quantity**, so the same curve authored one turn lower is
the same curve. It is not, to this function:

| the arc | a point taken FROM it reads |
|---|---|
| `a0=0 a1=+pi/2` | ✅ 0 away |
| `a0=+3pi/4 a1=+5pi/4` (across the atan2 cut) | ✅ 0 away |
| `a0=+7.0 a1=+8.0` | ✅ 0 away — the `while` slides UP |
| **`a0=-2pi a1=-2pi+pi/2`** | ⛔ **1.531 away** |
| **`a0=-7.0 a1=-6.0`** | ⛔ **0.990 away** |

⚠ **The same file has the correct two-sided normalisation twelve lines further down.**
`seg_param` wraps up *and* down; `seg_distance` only up. One file, two normalisations,
one of them one-sided — which is [CLAUDE.md](../../CLAUDE.md)'s *a guard that works in
ONE DIRECTION reads exactly like a guard*, and the reason the fix is a shared `ang_wrap`
rather than a second copy of the idiom.

**What it costs a consumer**, which is the number that matters: `seg_distance` is not a
leaf — `track_distance`, `nearest_seg`, `way_mark`, `way_stamp`, `cut_arb` and
`way_param`'s own segment choice all route through it.

> The **same** quarter arc marks **5 cells** authored at `[0, pi/2]` and **1** at
> `[-2pi, -2pi+pi/2]`. One curve, two footprints.

✅ **The fix is measured, not proposed** — `probe/way/hex_way-fix.patch`. Applied to the
sibling checkout, every row above holds, the footprints agree at 5 and 5, and `hex_way`'s
own 12 tests stay green. **The checkout was then restored byte-for-byte**: another agent
is working that tree (`hex_shape/tests/zz-probe.loft` appeared during this session), and
landing it there — or republishing — is the owner's call, not this tree's.

⚠ **Not reachable from moros.** Nothing in `lib/`, `src/`, the sibling tree or the
registry calls `track_arc` at all; every track this tree builds is `track_straight`. The
arc path has no caller outside `hex_way`'s own tests, which is why six worked examples and
two suites never saw it.

## ⛔ B. What we build against is not what the sibling tests

Three manifests here said the registry was *byte-identical to the checkout (diffed, not
assumed)*. **Measured: all fourteen `hex_*` differ.** Eleven differ only in comments.
Three differ in code:

| | | |
|---|---|---|
| `hex_field` | +73 lines | purely **additive** (`stencil_unstamp*`) — we simply do not have them |
| `hex_form` | +13 lines | added **refusals**; the registry copy accepts malformed stencil headers the checkout rejects |
| `hex_way` | **1 line** | `track_offset` is `+ d * dir` published and `- d * dir` in the checkout |

That last one is the sibling's own fix — their commit calls it *"an offset that is exactly
the right distance from the wrong side"* — and **the published 0.1.0 does not carry it**.
Measured against what we build:

```
way: ⛔ offset d=0.5 — the straight ends at (0,0.5) and the arc starts at (0,-0.5):
       a gap of 1, so the way is in two pieces
```

⚠ **It cannot reach moros either**, for the same reason as A: `track_offset` is called
here only on straights (`hex_editor.loft`, a wall's two faces), and the straight branch
never reads `dir`.

## ⛔ And my own equidistance row passed against the broken copy

Row D asks *is the offset exactly |d| from the centreline* — and it is **green on the
published `+ d * dir`**. Equidistance does not pick a side: put every arc on the far side
of the way from its straights and each one is still exactly |d| away. `track_offset`'s own
comment says so — *"the number that sees it is the gap at a joint, not the distance to the
line"* — and I had rebuilt that blind gate by hand before reading the sentence warning
about it. Row F is the joint, and it is what sees it.

## Running it

```
sh probe/way/drift.sh                       # registry vs checkout, code only, baselined
loft --lib lib/ probe/way/sweep.loft        # the invariants, against what we build
loft --lib ../loft-libs-world --lib lib/ probe/way/sweep.loft   # …against the checkout
```

`drift.sh` is in `make fast`. ⚠ **It is a BASELINE, not a threshold**, because the drift is
real today and closing it is a republish this tree does not own: it fires when the
sibling's code moves further *or* when a republish lands. Both are things we want to be
told, and a guard that is red on purpose is one people learn to ignore — `probe/k1` and
`probe/k2` rotted for exactly that reason. `DRIFT_BLESS=1` re-records, after reading the
diff.
