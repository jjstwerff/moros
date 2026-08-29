# `B4y` — which end owes the corner, and the half of the answer that was wrong

**Plan 26. `make probe-b4y`.** `B4x` ended with one sentence for the next session — *close
the corner, and decide at which end* — and left two candidates: the reader joins chain ends
across a one-edge break, or `wall_stamp` leaves the corner closed. Nothing said which.

⚠ **THE DECISION NEEDED NO NEW RULE, ONLY A CROSS-TABULATION NOBODY HAD MADE.** Two numbers
about the same 25 rectangles were measured in two different runs and never joined:

| | measured by |
|---|---|
| 8 of 25 described as four walls; 17 as 5 or 6 | [`probe/b4x`](../b4x/README.md) |
| 7 of 25 leak — `promote_close` answers `PM_OPEN` | [`probe/pc`](../pc/README.md) |

*Are the seven that leak the same rectangles as the seventeen described wrong?* One table
answers it, and the two ends are right for opposite answers.

## ✅ The cross-tabulation is exact, and it is a clean diagonal

| | |
|---|---|
| **LEAK ⟺ a GAP corner** | **7 of 7** leaking rectangles carry a gap; **0 of 18** leak without one |
| **OVER-4 ⟺ a FORK corner** | **17 of 17** over-described carry a fork; **0 of 8** are over without one |
| the reader | `drawn` equals `marks` on **all 25** — every mark is accounted for, before and after |

**40 of 100 corners break** — `B4x`'s 80 break *vertices* are two per corner. **30 are forks,
10 are gaps, and there is no third kind.** ⚠ **Not one corner is a fork ALONE**: every
junction has a free end beside it, which is what makes the next section a mechanism rather
than a classification.

## ⛔ And the mechanism is `@HB-X36`'s own sentence, broken in both directions

`@HB-X36`: *the side runs partition the boundary — **a corner edge is claimed exactly
once***. Our four linework runs claim it **twice** at 30 corners and **never** at 10:

| the row prints | |
|---|---|
| `twice-claimed` = `alone - union` | how many edges two of the four runs both generate |
| `spurs` | junctions with a free end exactly one hex edge away |

✅ **They are equal in every one of the 25 rows.** The doubly-claimed edge **is** the spur:
both runs' fields contain it, its far vertex is the free end and its near vertex the
junction — so a fork is not a topology accident, it is one edge two runs both wanted.

⚠ **A gap is the same fact with the sign flipped**: an edge neither run's segment reaches.
Both are the corner, one hex edge wide, and `B4x` measured that width as an integer.

## ⛔ So the answer is THE STAMP — and it was never really a choice

A gap is **an enclosure with a hole in it**. Joining chain ends in the reader would draw a
closed room over a world you can walk out of, which makes the description a lie rather than
a description. The reader is already faithful: it draws every mark it is given.

⚠ **[FORMAL_CORE](../../doc/claude/FORMAL_CORE.md) §7 says the same in advance** — *"the
wall verb has no such doorstep, which is the asymmetry to fix — not the reader that has to
make sense of the result"* — and this is the measurement under it.

## ⛔ THE PREDICTION THAT FAILED, AND IT IS THE USEFUL HALF

*Claimed exactly once* reads as two symmetric repairs: **drop** the edge two runs claim,
**add** the one neither does. Both were prototyped at the corner (which a gesture knows)
rather than over the marking (which would prune a `T`'s stem whole). Predicted: 0 leaks and
0 over-four.

| over the same 25 | leak | described over four | four walls round a closed room |
|---|---|---|---|
| today | ⛔ **7** | ⛔ 17 | 7 |
| **drop + add** | ✅ **0** | ⛔ **17** — and now **6, 7 or 8** where it was 5 or 6 | 8 |
| ✅ **add only** | ✅ **0** | ⛔ 17, unmoved | 8 |

⛔ **The drop closes the topology and destroys the description.** A run's marking is what
`run_edges` generates from its line; take one edge out and **no run generates that field any
more**, so the acceptance test that admits a wall — every edge the candidate generates is a
mark — refuses the wall it was cut from. The corner is repaired and the walls stop being
recoverable. ⚠ **A repair that satisfies the rule and breaks the thing the rule exists for**
is why the two halves were measured apart instead of shipped together.

## ✅ What the ADD buys, and it is the whole enclosure column

- **7 of 25 leak → 0 of 25.** `8 × 3` — the four walls that never meet, `GGGG` — closes with
  four added edges and stays at four descriptions.
- **23 of 25 markings become ONE CLOSED CHAIN**, where **7** were before. That is the number
  that matters next: `B4x` measured the rotation-invariant cycle minimum returning a room's
  four walls *uniquely*, and recorded that it **beat the shipped peel on no fixture** —
  because the only loops it had were the 7 that greedy already got right. **After the add
  there are 23**, and greedy gives 6 or 7 on most of them.
- **`drawn` still equals `marks` on all 25**, so the added edge is described, not left over.

⚠ **Two corners do not close, and they are `B4x`'s own four**: `6 × 3` and `6 × 6` have their
partner **two** hex edges away, so neither branch fires. Reported rather than reached for
with a second edge of radius — the rule is *one edge* because that is what was measured.

## ⚠ What this does NOT say

- **Nothing about the description column.** 17 of 25 over four before and after; that is the
  peel's seed, not the corner, and `B4x` already priced it.
- **Nothing about the mesh.** Still four triangles per stored edge.
- **Nothing about domain.** A closed loop of linework is still domain B — `@HB-X36`,
  `@HB-X45` and `@HB-X62` are about a form, and this makes a room that closes, not a room
  that is a stencil.

## The fixtures

`rect(a, b)` for `a` in 4…8 by `b` in 3…7, each of the four walls aimed at its own nominal
corner — `B4x`'s fixture unchanged, because a different one would answer a different
question than the one that produced *8 of 25*. The leak column reuses `probe/pc`'s seed rule
verbatim for the same reason.
