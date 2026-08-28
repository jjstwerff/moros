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
