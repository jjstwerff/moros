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
- **7 of 25 markings that are ONE CHAIN → 14**, and **one closed chain 7 → 8**.

⛔ **AND THE SECOND BULLET SAID *23* FOR AN AFTERNOON, WHICH WAS MINE AND WRONG.** I read the
probe's `chains 1` column as *one closed chain* and took the 23 from the **drop + add** table's
corner column — the half that is refuted. The add leaves the fork's spur, so those markings
carry a junction and a free end: **one chain, and open.** Only the drop makes a room a simple
loop, and the drop is what breaks recovery. ⚠ **Closing the leak and closing the topology are
different things, and only the first is safely achievable at the stamp.**
- **`drawn` still equals `marks` on all 25**, so the added edge is described, not left over.

⚠ **Two corners do not close, and they are `B4x`'s own four**: `6 × 3` and `6 × 6` have their
partner **two** hex edges away, so neither branch fires. Reported rather than reached for
with a second edge of radius — the rule is *one edge* because that is what was measured.

## ✅ What shipped — `hex_editor::wall_corner_close`

Called from `wall_stamp` on every run that marked anything. **One rule: a free end of this
run's own field, and a free end one hex edge from it, are one chain**, so the edge between
them is written. `lib/hex_editor/tests/corner_close.loft` is its gate.

⚠ **AND `marked` IS IN HALF-EDGES, WHICH THIS HAD TO BE HONEST ABOUT.** `wall_stamp` visits
every edge from both of its cells and `wall_set` resolves them to one owner slot, so a
16-unit wall of 18 stored edges has always reported **36**. The join is counted the same way
rather than once: two units in one number is worse than a doubling that was already there.

⛔ **AND THE CORPUS EXERCISES NONE OF IT.** All 46 `probe/k3d` scripts key their recorded
world **unchanged** — no script lays two runs that meet, and `place_house`'s four mitred
sides never leave a one-edge break. So the corpus is the control for *it fires on nothing
else* and cannot be the check that it fires at all. That is the same shape as
promote-on-close: a gesture the corpus never performs cannot be caught by it.

⚠ **AND THE FIRST TABLE ABOVE CANNOT BE TAKEN THROUGH `wall_stamp` ANY MORE.** Once the rule
shipped, four `wall_at` calls stopped producing the field that table measures — so `rect_raw`
unions the four runs with no corner rule at all, and a fourth sweep takes the same 25 through
`wall_stamp` itself. ✅ **That last sweep is IDENTICAL to the add-only prototype, row for
row** — same corners, same marks, same chains, same descriptions, same flood — which is the
consumer check that what shipped is what was measured, and not a second answer wearing the
same summary line.

## The sabotage sweep — `sh probe/b4y/sweep.sh`

| row | what was cut | |
|---|---|---|
| 0 | control, nothing cut | green |
| **1** | the corner close is never called | ⛔ **RED**, 3 tests |
| 2 | *one hex edge* becomes any distance | ⚠ green |
| 3 | the join is not scoped to this run's own field | ⚠ green |
| 4 | `corner_write` matches only one vertex ORDER | ⚠ green |
| 5 | a vertex may be spent twice | ⚠ green |
| **6** | `corner_write` writes the first unmarked edge it finds | ⛔ **RED**, 3 tests |
| **7** | a free end becomes a mid-chain vertex (degree 2) | ⛔ **RED**, 4 tests |
| 8 | ✅ the green control — the corner pair spelled the other way round | ✅ green |

⛔ **THE FIRST VERSION OF THIS SWEEP HAD ONE RED ROW AND FOUR BLIND ONES**, which says only
that the tests notice the feature being **absent**. Rows 6 and 7 are the question that was
missing — can they see it **computed wrong** — and both are red, row 7 on a `peel.loft`
fixture the other two do not touch.

⚠ **AND ROWS 2 TO 5 ARE DEFENSIVE BRANCHES, WHICH IS WHY THEY STAY.** `corner_write` only
writes when a hex edge genuinely joins the two vertices, so the integer step test is a
**pre-filter for cost** and not the gate — row 7 shows what that cost is, taking minutes
where every other row takes seconds. The run scope and the spent-vertex guard hold in a
general world that no fixture here builds; `B4x`'s `join_control` went looking for the pair
they would need to reject and found none in fourteen near misses, which is *a green, not a
theorem* — its own words.

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
