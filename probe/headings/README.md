# `H1` — how heading resolution depends on run length

⛔ **CORRECTION, 2026-08-22 — THIS DOES NOT MEASURE `D`, AND AN EARLIER VERSION OF THIS FILE
CLAIMED IT DID.** ✅ **`D` HAS SINCE BEEN PRINTED FROM THE LIBRARY — see
[probe/h1](../h1/README.md).** Its odd members are `(7,3)`, `(5,9)`, `(2,12)` — the `N = 39`
family — at 13.898°, 46.102°, 73.898°. **Not one of them appears in the enumeration below**, which
is the clearest possible statement that a plausible derivation is not an adoption. The 24 linework directions are **defined and gated upstream**, in
`hexbody/ROUNDTRIP.md` — see [FORMAL_CORE.md](../../doc/claude/FORMAL_CORE.md). They are:

| | |
|---|---|
| **12 exact** | the even ones, `0.0000°` off nominal |
| **12 in-between** | a **uniform** `1.1021°` bias, spread `0.0000°` — vector `N = 39` `(7,−2)`, period `√39 u`, chosen so `δ = 0` and linework links to house angles unconditionally (`X56`) |

So `D` is **not** 24 exact directions, and it is **not** the set enumerated below. `X31` settles
the part this probe got right — *no odd multiple of 15° is reachable at all* — and `X29` gates
what the in-between twelve actually cost.

⚠ **WHAT IS BELOW IS STILL A REAL MEASUREMENT, OF A DIFFERENT QUESTION**: *which directions can a
run of `n` edges point in at all.* That is the run-length law, and it is what derives the
house/world split from the lattice instead of assuming it. Read it as that, never as `D`.

---

## The original write-up, kept as the record

**Measured 2026-08-22**, plan [24](../../plans/24-one-authority/README.md) `H1`.

```sh
make probe-headings
```

⚠ **This measures the LATTICE.** It is not an algorithm the editor uses, and the ground rule is
why that is said first: the resulting **table belongs in a library**, beside
`hex_form::head_step`, never in `src/` or `lib/hex_editor/`.

## The result

A wall **is** a chain of hex edges, so the directions it can point are the sums of edge vectors —
and *how many edges you spend* is what buys resolution. In doubled lattice coordinates the six
edge vectors are `(±1,±1)` and `(0,±2)`, read off `hex_field::corner_k/corner_m`.

| a run of at most | can point | spacing |
|---|---|---|
| 1 edge | 6 ways | 60° |
| **2 edges** | **12 ways** | **30°, even** |
| **3 edges** | **24 ways** | **10.893° / 19.107°, alternating** |
| 4 edges | 36 ways | uneven |
| 8 edges | 132 ways | uneven |

**The 12 and the 24 both fall out exactly.** They are not conventions — they are what the lattice
offers at two and three edges.

## The 24, in full, first quadrant

| direction `(dk, dm)` | edges | angle | gap from previous |
|---|---|---|---|
| `(1, 0)` | 2 | 0.000° | — |
| `(3, 1)` | 3 | 10.893° | 10.893 |
| `(1, 1)` | 1 | 30.000° | 19.107 |
| `(1, 2)` | 3 | 49.107° | 19.107 |
| `(1, 3)` | 2 | 60.000° | 10.893 |
| `(1, 5)` | 3 | 70.893° | 10.893 |
| `(0, 1)` | 1 | 90.000° | 19.107 |

⚠ **THE SPACING ALTERNATES 10.893° AND 19.107°, AND THEIR MEAN IS EXACTLY 15°.** That is what
`hex_editor::WALL_SNAP = 2π/24` has been approximating: the right **count**, at the wrong
**positions**, by up to 4.1°. A float snap is exactly the instrument that could not notice.

⚠ **AND 15° ITSELF IS NOT REPRESENTABLE.** `tan 15° = 2 − √3`, and a lattice direction has
`tan θ = m/(k√3)`, so `m/k = 2√3 − 3` — irrational. No integer `(dk, dm)` gives it, at any run
length. The nearest exact direction to 15° is `(11, 5)` at 14.705°, and it costs an **11-edge**
run.

## ✅ Why houses get 12 and world features get 24 — derived, not assumed

The reporter's rule was *"24 headings for walls, fences, rock-faces and roads in the world — just
not for houses, which should allow shorter walls."* **That is the run-length law, stated from the
other side.**

A house side one or two edges long **cannot point in 24 directions** — the extra twelve each need
a third edge. So a short-walled house is a 12-heading object *by construction*, and a world run
is a 24-heading one as soon as it is three edges long. Nothing has to enforce this; asking for a
shorter wall asks for a coarser heading, and the lattice answers.

⚠ **This is also why `hex_form::HEAD_N = 12` is right for `Plan`** — `hex_form` is the house
library, and a plan's sides are short. It is not a limitation to be lifted; it is the correct
answer to a different question.

## What this changes — as corrected

- `hex_editor::HEADINGS = 24` / `WALL_SNAP = 2π/24` / `snap_heading`'s `atan2` — **our own float
  algorithm, asking for directions that do not exist** (`X31`). It goes.
- What replaces it is **`D` as hexbody defines it**, from a library: 12 exact + 12 at `(7,−2)`
  with a uniform `1.1021°` bias. ⚠ **Not a table we choose** — `X56` searched `N ≤ 400`
  exhaustively and reports that no vector improves the angle while keeping both the grid and
  `δ = 0`.
- ⚠ **Walls already stored were snapped to the uniform 15° grid**, so their headings are off a
  representable direction — plan 24 open question 4, a store migration.
- ⚠ **And the 12/24 split is not a resolution setting**: `H₁₂` (stencil sides) and `D` (world
  linework) are **different sets for different domains** (`FORMAL_CORE` §2.2), not a coarse and
  a fine version of one set.
