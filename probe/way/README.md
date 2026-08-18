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

✅ **LANDED IN THE SIBLING — `b553c84`, on the `worked-examples` branch.** `ang_wrap` is a
shared helper both `seg_distance` and `seg_param` call, so the file no longer carries two
normalisations; `seg_param`'s behaviour is unchanged because it was already doing exactly
this inline. The worked example is **`@HXY-007`**, seen red first with the old slide put
back — *"the SAME arc authored at [-2pi, -2pi+pi/2] reports its own points 3.061 away"* —
and it asserts both halves, the distance and the footprint, with a fixture guard so a run
that marked nothing cannot read as agreement.

✅ **Parity gate: one program, three targets, byte-identical output** (`96a32ff0…`) —
interpreter, `--native`, and `--native-wasm` under wasmtime. `loft test` and
`loft test --native` are 13 passed / 2 files. (`--native-wasm` is not a `loft test` mode —
the runner says so; it compiles a program, so the gate runs `sweep.loft` as the program.)

⛔ **AND IT CANNOT BE PUBLISHED ON ITS OWN — measured, not assumed.** Publishing builds
from `main`, and:

- `hex_way/tests/02-worked-examples.loft` — the file `@HXY-007` lives in — **does not
  exist on `main`**. It was created by the sibling's `799f99d`, *@PLN141 Phase E row 4*.
- `loft.toml`'s `version = "0.1.1"` and the `track_offset` fix are that same commit's.
  The registry has **only 0.1.0**.
- `worked-examples` is **6 commits unpushed** and mid-series (rows 1–5 of a phase).

So the ang_wrap fix rides on their unpublished 0.1.1, and shipping it means merging
another session's unfinished plan phase to `main` first. That is a decision about someone
else's work, not a mechanical step, so it is where this stops. The registry checkout and
the signing key are both on this box; the signing step is human-gated by design.

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

⚠ **The `hex_way` row is 16 lines now, not 1 — I widened it myself.** The `ang_wrap` fix is
landed in the checkout (`b553c84` on `worked-examples`) and the registry still has 0.1.0, so
the baseline moved and `drift.sh` said so out loud before I re-blessed it. That is the guard
working: the drift changed, and the run that changed it is the one that had to explain why.

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
