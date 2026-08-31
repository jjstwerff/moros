<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# The `seen`-first reorder in the slope walk — measured where the function is hot

**Run 2026-08-31.** `loft --interpret --lib lib/ probe/rw/rw.loft`; the sweep in
[run.txt](run.txt).

⚠ **NO `PREDICTION.md`, AND THAT IS A REAL DIFFERENCE FROM THE OTHER PROBES HERE.** This
did not test a hypothesis — the change was already decided, as `enclosure_fill`'s reorder
one function over, and this exists to say whether it BUYS anything. Written after the
edit, not before it.

## Why a probe at all — the suite cannot see this

`run_walk` and `slope_owed` were named in [`ee86201`](../../lib/hex_editor/src/gesture.loft)
as the same shape as `enclosure_fill`'s: a `world_ground_cell` (through `run_h`) paid
before a cheap hash test. That commit deliberately did **not** change them, because
nothing measured there exercised them and *an unmeasured swap cannot go red for a real
reason*. Profiled first, and the suite's answer is honest and negative:

| asked of | `run_walk` / `slope_owed` / `run_h` |
|---|---|
| `push.loft`, 22.4 s — the biggest tick-driver | ⛔ **never sampled at all** |
| `cave_settle.loft`, 10.3 s | `run_h` 4.6% (333 ms), `slope_settle` 2.4% |
| `settle_owed.loft`, 6.2 s | `run_h` 3.0% (47 ms), `slope_settle` 2.6% |
| `cave.loft`, 10.0 s | `run_h` 1.7% (125 ms) |

Every slope/cave/road file is **6–10 s**, and the reorder saves only a fraction of the
`run_h` inside the walk. ⛔ **So in the suite this change buys nothing measurable, and
that is the finding rather than a disappointment.**

## Where it does pay, and why the suite is blind to it

`slope_owed` is called by `walk_tick` **every tick** and floods the whole run each time,
so its cost is **O(run length) per tick**. A test walks six cells; a person walks a road.
The fixture is `settle_owed.loft`'s own falling road, 300 cells × 3 wide, ticked 2000
times — and `slope_settle` is deliberately NOT called, so the walk is the whole cost.

| | CPU | wall |
|---|---|---|
| BEFORE | 238.7 s · 189.6 s | 289.3 s · 209.3 s |
| ✅ **AFTER** | 128.8 s · 166.1 s | 129.1 s · 119.4 s |

**Faster in every pairing on both metrics, and the ranges do not overlap** — min BEFORE
189.6 against max AFTER 166.1. Conservatively **≥1.14× on CPU and ≥1.6× on wall**; ~1.45×
and ~2.0× on the means.

⚠ **AND IT IS NOT PINNED TIGHTER THAN THAT, ON PURPOSE.** Load swung **2.5 → 29** across
the four rows, and the CPU/wall relation was itself unstable: row 3 reports CPU **above**
wall (1.39 threads' worth) where row 2 is exactly 1.0. Same binary, same program, same
input. Until that is understood, a point ratio off this box would be a number invented to
look precise — the range is what was measured.

⛔ **THE FIRST VERSION OF THIS PROBE WAS DISCARDED, NOT REPORTED.** At 40 ticks over three
road lengths the whole run was 8–20 s, of which ~4 s is compiling the library: BEFORE
18.8/7.9 and AFTER 12.4/**115.1**. A 9.3× spread within one variant is not a measurement
of anything. Scaling the work to ~2 minutes puts compile under 3% and stops one outlier
carrying the result.

## The equivalence, which comes first

The probe **prints the owed value**, so it is a control before it is a clock: `owed-sum
4000` in all four runs, and all four outputs byte-identical (`md5sum | sort -u | wc -l`
= 1). At the earlier three lengths — 50, 150, 300 — it was `owed-sum 80` for each, also
identical across BEFORE and AFTER. Plus nine test files that reach the walk, 109 tests:
`settle_owed` `cave` `cave_settle` `road_debt` `face` `tick` `push` `slope_limit`
`run_fit`.

## ✅ The merge — `merge.loft`, `merge.txt`

The duplication below **is fixed now**, in the commit after the reorder. `slope_owed`
takes `run_walk`'s two-line call shape, the one `slope_settle` already used, and the
third copy is gone. `seen` is `run_walk`'s return value and the `worst` loop asks it
whether a neighbour is in the run, so nothing else moved.

⚠ **`slope_owed` RETURNS ONE INTEGER, so the corpus has to vary what the walk DECIDES** —
which cells are the run. 27 fixtures × 3 seeds: straight at three widths, an L, a spur,
a road with a hole in it, and `stepped`. **Identical on all 82 rows.**

⛔ **AND THE CORPUS WAS CHECKED AGAINST WRONG WALKS BEFORE ITS SILENCE WAS BELIEVED.**

| sabotage, applied to `slope_owed` alone | rows moved, of 82 |
|---|---|
| three of the six directions | ✅ 8 |
| walk stops after 4 frontier cells | ✅ 24 |
| membership test never refuses | ✅ 72 |
| **control** — `seen` test swapped back after `run_h` (valid) | ✅ **0** — no false positive |

⚠ **THE FIRST VERSION OF IT WAS TOO BLUNT AND WAS SHARPENED RATHER THAN ACCEPTED.**
Without `stepped` — a gentle run with one steep edge at its **far end**, so `worst`
reports the walk's REACH instead of the seed's neighbourhood — the three-of-six sabotage
moved 8 rows and only through `gapped`. A corpus whose rows are mostly `0 0 0` and
`2 2 2` cannot tell two walks apart, and it would have said the merge was safe just as
loudly.

## ⚠ What this found



`slope_owed`'s walk is a **third copy** of `run_walk`'s, identical line for line — which
is why the reorder had to be written twice. `run_walk`'s own header says it was extracted
because there are two readers and *"two walks disagreeing by one condition would put the
balance on a different set of cells from the settle it is balancing, and every count would
still add up"*. It has exactly the two callers it names; `slope_owed` was never switched
over. ✅ The merge is clean — `slope_owed` uses `seen` after the walk and `run_walk`
returns exactly that, which is how `slope_settle` already calls it — but it is a
behaviour-preserving refactor with its own proof to write, so the condition is kept
identical in both places rather than merged in passing.
