# `B4x` — the ordered chain walk, and what one seed cannot tell you

**Run 2026-08-28.** Plan [26](../../plans/26-blueprint/README.md) `B4x`, second measurement.
`make probe-b4x`; predictions in [PREDICTION.md](PREDICTION.md), written first; the run in
[run.txt](run.txt).

The first `B4x` measurement ended with one instruction:

> Rebuild prototype 3 with **`run_span`'s** within-ness as the cut test rather than set
> equality, and re-measure the four piece counts (1 / 2 / 3 / 4). **The design stands or
> falls on that one number.**

⚠ **THIS IS ALSO THE CONSUMER CHECK FOR `hex_shape::wall_chain_walk`.** The walk was measured
here and then built where `wall_chain_ends` and `wall_chain_branches` already live — the two
functions that count degrees and throw the walk away. The probe holds no copy of it.

✅ **Published as `hex_shape` 0.1.2** — tag `hex_shape-v0.1.2`,
[registry#26](https://github.com/loft-lang/registry/pull/26) merged and signed, so `make
probe-b4x` resolves the walk from the registry like any other consumer.

## The verdict, in two halves

✅ **The ACCEPTANCE is settled**, and not the way the record prescribed.
⛔ **The PARTITION is not**, and no rule measured here returns the four walls reliably.

## ⛔ Half one: the acceptance, over every seed

A closed loop has no canonical start, so the walk seeds wherever the scan lands. **The first
version of this probe had its own walk and therefore its own seed**, and moving to the
library's changed nothing but that vertex — yet the room went from six pieces with
within-ness losing 36 marks, to four with nothing lost, **in every cut**. Neither run was a
fact about the cut rule.

A cycle can be walked from any of its vertices — the same chain rotated — so all fifty are
askable:

| the cut | pieces | seeds that lost nothing | worst loss |
|---|---|---|---|
| ⛔ **within-ness alone** — what the record asked for | 1 … 7 | ⛔ **12 of 50** | ⛔ **45 of 50 marks** |
| within **and** covers the span — R1 both ways | 4 … 9 | ✅ **50 of 50** | ✅ 0 |
| exact set equality — prototype 3's own | 4 … 9 | ✅ **50 of 50** | ✅ 0 |

✅ **Within-ness alone is not *unlucky here*, it is unsound.** The number it maximises is the
run's own **size**, never how much of the chain it accounts for, so the seam advances by
vertex index while the coverage advances by generated field and nothing ties the two
together. Both **two-way** tests are clean at every seed, and they are indistinguishable
from each other on this fixture.

✅ **That is `FORMAL_CORE` §6's R1, both ways** — `B4v`'s own sentence one level down: *"each
candidate's boundary must lie WITHIN the component's marks, and the set is taken only when
it claims every one of them and nothing outside."* Within-ness is the *nothing outside* half
**alone**.

## ⛔ Half two: nothing here returns four walls reliably

| how the chain is partitioned | pieces for a four-wall room | cost, `run_edges` |
|---|---|---|
| greedy longest-first, two-way | **4 … 9** over 50 seeds | 128 |
| the **fewest** runs — shortest path over the chain | **4 … 7** over 8 sampled seeds | **1012** |

⛔ **THE MINIMUM'S OWN SWEEP REFUTES ITS JUSTIFICATION.** It was worth eight times the greedy
cut only if the answer stopped moving; it does not. A shortest path over a **linear** chain
cut at an arbitrary point is not the minimum for a **cycle** — the seed's own wall is split
in two and the merge clause only sometimes puts it back. Four … seven, for a room whose four
walls are a valid partition at every seed.

⚠ **THE CORNER CONTROL IS WHAT MAKES THAT A DIAGNOSIS.** Each of the room's four walls
measured **alone** in the same window is **one** run, of 12 / 13 / 12 / 13 marks — **exactly
50, the room's own total**. The corners add nothing and lose nothing. So the answer existed
at every seed and every rule tried here missed it at most of them.

⛔ **And the tie-break is refuted too.** Taking the longest vertex span on a tie — rather than
`run_within`'s strict `>` — leaves marks over on both the zigzag (1) and the room (5). It is
the only variant here that breaks a fixture the plain rule closes.

## ⛔ Two sentences of the first measurement are refuted

⛔ **The strict acceptance is not what broke prototype 3.** Rebuilt, exact set equality closes
every fixture with nothing over — a straight wall in **one** piece, not fourteen. So *"a
wall's extreme vertices are not the gesture's endpoints, so `run_between(v₀, vₙ)` generates a
slightly different set"* is **false for these fixtures**: it generates exactly the wall's
fourteen marks. Prototype 3's code is gone and what failed in it cannot be recovered — but it
was not this, and the prescription that followed is wrong.

⛔ **Within-ness is not the fix** — it is the half that makes the cut unsound.

## The clauses that had to be written on purpose

⚠ **A field is several chains, not one — and the first survey's own degrees said so.** An L
has `deg1 = 4`, so its two walls do **not** fuse and each keeps its own two ends. The first
version of this probe walked one chain, stopped, and reported half an L with the other half
as a residual. `wall_chain_walk` carries that in its contract: `wc_n` chains, `nth` picks one.

⚠ **A loop has no canonical start.** The merge of the first and last piece is the clause the
first measurement predicted would be needed — and the sweep shows it is not sufficient.

⚠ **And the fixture is aimed at nominal corners.** Chaining each wall onto the previous one's
*snapped* end looks more careful and is worse: four walls round a square that way give
`deg 1/2/3+ = 1/57/1` — a free end and a junction, so not a room — where four walls each aimed
at their own corner give `0/50/0`. The stamper's snap is what makes the corners meet.

## The instrument, checked before it was believed

The fixtures are recognised by their **degree table**, the only thing the first survey
recorded about them: a straight wall `2/13/0` at 14 marks, an L `4/11/0` at 13, a closed room
`0/50/0` at 50 — the empty `corner_pool` that is the whole defect. All three reproduce it
exactly. ⛔ **The zigzag does not** — the survey's is 18 marks at `4/16/0` and a sweep of
sixteen bend geometries found none; this one is 16 at `4/14/0`, the same signature (three
walls, one corner fused and one not, so two chains) at a different size.

⛔ **And the first version of this probe was wrong in a way only a count could see.** It took
the first accepted `k` descending from the far end, and the closed room came back as **one
piece of one edge**: a far-away vertex snaps to a *short* run whose few edges are trivially
within the marks. The accepted run's length is not monotone in the vertex index.

⚠ **The single-seed table is kept in [run.txt](run.txt) with its warning attached.** Five cut
rules agree on `1 / 2 / 3 / 4` there. That is not five confirmations; it is one seed reported
five times, and the sweep is the row that means anything.

## What this leaves open, precisely

**A loop must be cut circularly.** Every rule here cuts a cycle as if it were a path, from a
vertex the scan chose, and every one of them pays for it. The question is no longer *which
acceptance* — that is answered — but *how a cycle is partitioned without a start*, and the
corner control says a right answer exists at every seed.

## What it deliberately does not do

- **It ships nothing into the editor.** `run_within` and `corner_pool` are untouched, and the
  peel still loses the zigzag's 12 marks and all 50 of the room's. What landed is the library
  entry point plus this measurement of what to build on it.
- **It does not handle a junction.** `wall_chain_walk` reports `wc_branch` and the cut here
  ignores it; no fixture has a `deg ≥ 3` vertex, and `B4w` already measured that a `T` is
  recoverable only sometimes.
- **It does not sweep the minimum over all fifty seeds** — eight, at stride 7. One seed of the
  room is ~1000 `run_edges`; fifty is not a probe, it is an afternoon.
