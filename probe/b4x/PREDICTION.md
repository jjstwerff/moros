# `B4x` prototype 3, second attempt — predictions, written before the run

Plan [26](../../plans/26-blueprint/README.md). The step the `B4x` measurement named:

> Rebuild prototype 3 with **`run_span`'s** within-ness as the cut test rather than set
> equality, and re-measure the four piece counts (1 / 2 / 3 / 4). The design stands or
> falls on that one number.

## What is being asked

An **ordered chain walk** over the marks, then cut **longest-first**: from the current
seam vertex `s`, take the largest `k` such that `run_between(v_s, v_k)` generates a field
that lies **within** the marks. `run_span`'s test, not set equality.

## The predictions

| the fixture | pieces | why |
|---|---|---|
| a straight wall | **1** | within-ness is what `run_within` already accepts a full wall by — the crossing fixtures close on it today |
| an L | **2** | |
| a zigzag | **3** | |
| a closed room | **5** from the walk, **4** after the first/last merge | a loop has no canonical start, so the seed cuts one wall in two |

**Residual marks: 0 on all four.** A piece that leaves marks over means the cut test
accepted something that is not the authored wall.

**The negative control — set equality reproduces prototype 3.** The same walk, the same
fixtures, cut by exact set equality instead, must come back **14 / 13 / … one piece per
edge** with `stubs = 0`. If it does not, the walk has changed too and the comparison is
not about the cut test at all.

**The degree histogram must match the `B4x` survey** — a straight wall `2 / 13 / 0`, a
closed room `0 / n / 0` with an empty pool. If it does not, these are not the shapes the
survey measured and no number here speaks to it.

## What could refute the design

1. **Over-shoot at a corner.** Longest-first descends from the far end; a run that
   crosses a corner may still lie *within* the marks if the two walls' fields overlap
   near the bend. That reads as **fewer** pieces than authored **with a residual**, and
   it would say within-ness is too weak a cut test on its own.
2. **`RUN_SHORT`.** A final stub of one or two edges cannot be offered at all —
   `run_between` refuses below it — so a chain whose last piece is short leaves marks
   over through no fault of the cut test. Counted separately as `stubs`.
3. **Cost.** Prototype 3 hit its own 900 s timeout before reaching the zigzag and the
   room. The cut is `O(n)` `run_edges` calls per piece where the pool is quadratic in
   its own size; the call count is reported so the claim is a number rather than a wall
   clock.

---

# `B4x` third attempt — the cycle, cut without a start. Written before the run

The second measurement closed the acceptance and left one sentence open:

> **A loop must be cut circularly.** Every rule measured here cuts a cycle as if it were a
> path, from a vertex the scan chose, and every one of them pays for it. The question is no
> longer *which acceptance* — that is answered — but *how a cycle is partitioned without a
> start*, and the corner control says a right answer exists at every seed.

## The design, and the one observation it turns on

⚠ **FEASIBILITY IS A PROPERTY OF A PAIR OF VERTICES, NOT OF WHERE THE WALK STARTED.**
`run_between(v_i, v_j)` takes two coordinates; rotating the chain relabels `i` and `j` and
changes nothing else. So the expensive half — `run_edges`, `within`, `covers_span` — is
**rotation-invariant**, and the fifty seeds of the second measurement paid for the same
table fifty times.

**So: build the table once, over every `(start, span)` on the cycle, then run the linear
minimum from EVERY cut vertex against that one table and take the fewest.** Every cyclic
partition has at least one cut vertex, and from that vertex it is a linear partition — so
the minimum over all starts *is* the cycle's minimum, exactly, with no seed left in the
answer.

## The predictions

| | prediction |
|---|---|
| a closed room, cut circularly | **4** pieces, **0** marks over |
| its spans | the corner control's — `12 / 13 / 12 / 13` marks |
| how many of the 50 starts reach 4 | **4**, the corners and nothing else |
| distinct optimal partitions | **1** — so *fewest runs* names one description and needs no tie-break |
| the per-start histogram, all 50 | `4 … 7`, containing the stride-7 sample `4 5 5 4 6 7 4 6` at its own positions |
| cost | **one table** — under `2450` `run_edges`, against `1012` for ONE seed of the linear minimum and ~8000 for the eight sampled |
| a straight wall / an L / a zigzag | **1 / 2 / 3**, unchanged — a path has a canonical start, and the cycle DP reduces to the linear one on it |

## The instrument check, before the answer is believed

**The table must reproduce a number already measured live.** `dp_sweep` prints the linear
minimum at eight seeds of the room from `run_between` calls made at that seed; the table's
own DP at those same eight starts must agree, value for value. If it does not, the table is
not the same question and nothing below it means anything.

## What could refute the design

1. ⛔ **The minimum is BELOW four with nothing over.** Then *fewest runs* is the wrong
   objective outright — it would be naming a description the author did not build, and the
   corner control could not be reached by minimising at all. This is the one that would
   send the design back.
2. ⛔ **Several distinct four-piece partitions.** Then the minimum does not name a
   description on its own and a tie-break has to be chosen — and the second measurement
   already refuted the obvious one (longest span on a tie leaves marks over on two
   fixtures).
3. **The cost is not one table.** If the table is dense the DP is free, but the table is
   `n²` and the room is `n = 50`; a shape with 200 marks is 16× this. The number to watch
   is `run_edges`, not the wall clock.

## ⚠ Written after the run, before the corner sweep — the second question of the same session

The third measurement's own answer named the next number: **why does a closed rectangle break
at all?** The predictions for the sweep that followed, written before it ran:

| | prediction | measured |
|---|---|---|
| where the breaks are | at the corners | ✅ **all 80**, none mid-wall |
| how wide a break is | ⛔ *unpredicted — this was the point of asking* | ✅ **one hex edge**, 76 of 80 |
| is a break a gap or a fork | both, depending on the coordinate | ✅ both: `8 × 3` is four walls with gaps, `4 × 4` is a fork one edge from a free end |

⚠ **AND THE PREDICTION TABLE IS SHORT ON PURPOSE.** The width was the question; guessing it
first would have made the sweep a confirmation instead of a measurement.

## ⚠ The control, predicted before it was built — two walls that merely pass close

The corner sweep says a break is one hex edge wide, which suggests a join rule: *two chain
ends one hex edge apart are one chain*. **The control has to come first**, because that rule
would also fuse two walls that have nothing to do with each other.

| the fixture | prediction |
|---|---|
| two parallel walls one hex row apart, ends offset | ⛔ their nearest free ends are **also one hex edge apart** — so the naive rule fuses them |
| two collinear walls with a one-edge gap | ✅ one hex edge apart, and here that is the right answer |

⚠ **If both come back at one edge, the width is not enough to decide a join** and the rule
needs the direction as well — which is the whole point of building the control before the
rule it guards.
