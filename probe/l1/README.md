# `L1` — the reader works; **our stamp is what it cannot read**

**Run 2026-08-22.** Plan [24](../../plans/24-one-authority/README.md) `L1`.
Predictions in [PREDICTION.md](PREDICTION.md), written first.

```sh
make probe-l1
```

## The result that decides the phase

| § | what | result |
|---|---|---|
| **1** | **control** — `wall_write` → our bridge → `wall_read_run` | ✅ **24 of 24** |
| **2** | our `wall_stamp` → world → bridge → `wall_read_run` | ⛔ **0 of 24**, all refused |
| **3** | …with **admissible** endpoints (a real vertex, a legal `p`) | ⛔ **still 0 of 24** |

⚠ **§1 AND §2 TOGETHER ARE THE FINDING.** The same reader, the same `EdgeSet` shape, the same
bounds — 24 of 24 on the library's marking, 0 of 24 on ours. **`L1` is not blocked on the
library; it is blocked on `hex_editor::wall_stamp`.**

## Predictions, scored

| # | prediction | verdict |
|---|---|---|
| **P1** | the control passes | ✅ 24 of 24 |
| **P2** | our stamp mostly does not recover | ✅ **stronger than predicted — none of it does** |
| **P3** | the ones that recover are the even `d24` | ⛔ **refuted.** Nominal 0° and 60° fail too, and those *are* exact headings |
| **P4** | failures are `ok = false`, not a wrong direction | ✅ every one refused. The library never guessed |

**`P3`'s refutation is what redirected the phase.** If only the in-between directions had failed,
`L1` would have been waiting on `H1` and nothing more. Exact headings failing says the direction
set is not the cause, and `§3` then removed endpoint admissibility as the cause too.

## ◐ What the shape is — MEASURED, NOT YET EXPLAINED

Asked with the library's own graph instruments (`wall_chain_ends`, `wall_chain_branches`, whose
contract is *"2 for a single chain, 0 for empty, 4 after a break, 2k for a comb"*):

| the same run | edges | ends | branches |
|---|---|---|---|
| `wall_write` | 2 | **2** | 0 |
| `wall_stamp` → bridge | 4 written / 14 for a long run | **0** | 0 |

So our marking has **no degree-1 vertex**. On 14 edges with no branch that is a closed cycle —
**but it is equally what an EMPTY set reads as**, and a follow-up dump of a short run found **zero
edges in range** while the stamp reported 4 writes. ⚠ **Those two do not agree, so the shape is
not established and no claim is made here.** The obvious reading — *our stamp marks both sides of
the band, the library marks one line* — fits the 2× edge count and would explain everything, and
it is **exactly the kind of tidy explanation this plan has already been punished for three times.**
It is written down as a hypothesis, not a result.

**The next measurement, precisely:** dump both markings edge-by-edge for one run where our stamp
is known to mark (the 12-unit due-east run that yielded 14 edges), and compare the sets. If ours
is a superset of the library's at 2×, the both-sides reading is confirmed; if it is disjoint, it
is something else.

## Two facts that are solid regardless

**`wall_stamp` writes every edge twice** — 28 writes for 14 distinct edges. It walks all six
directions of every cell, so each edge is set once from each side. Harmless to the world (the
second write is idempotent) and it makes every `marked` count this tree prints exactly double.
`A0p` found the same thing from the other end.

**The bridge is sound.** `edges_around` returned `eg_count = 14` against 14 wall bytes read
straight out of the world, at three different `ref_units`. Whatever §2 is failing on, it is not
the world→`EdgeSet` transcription.

## What this does to the plan

`L1` was *"add an entry point"*, then `H1` made it *"a call"*. It is now:

> **replace `hex_editor::wall_stamp` with `hex_shape::wall_write`** — and `L1` follows, because
> the library reads its own markings 24 of 24.

⚠ **That is a bigger change than `H1` and it should be sequenced before it.** `H1` adopts `D` for
the *direction*; this replaces the *stamp*. Adopting `D` while still marking edges our own way
would leave `wall_read_run` refusing exactly as it does today — `H1` alone buys nothing readable.

⚠ **AND IT IS THE THIRD SECOND-IMPLEMENTATION FOUND IN THIS PLAN**, after `hex_editor::HEADINGS`
against `D`, and our `VoxelWorld` edge bytes against `hex_field::EdgeSet`. The pattern is not that
the editor calls the wrong library function — it is that it has its own of everything.

## ⚠ Fixture errors: four now, and this one would have PUBLISHED a false finding

The running count in this plan: `(0,0)` as a run anchor (a hex centre), a direction vector where a
world target point was wanted, `surface_heading` expected to see a notch. All three were **caught
by the library refusing**.

This one was different: `ends = 0` reads as *a closed loop* and as *an empty set*, and I nearly
wrote up the first. Nothing refused it — the number was simply ambiguous. ⚠ **A library that
declines bad input cannot protect you from a measurement you interpret wrongly**, and the guard
for that is the one this tree already writes down: check the instrument against something it
should find before believing what it reports.
