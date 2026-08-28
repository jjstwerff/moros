# `B4x` — the ordered chain walk, and what one seed cannot tell you

**Run 2026-08-28, and again 2026-08-29.** Plan [26](../../plans/26-blueprint/README.md)
`B4x`, second and third measurements.
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

## The verdict, in three parts

✅ **The ACCEPTANCE is settled**, and not the way the record prescribed.
✅ **The PARTITION is settled too, on a CYCLE** — third measurement, below: one feasibility
table, the minimum over every start, four walls uniquely and nothing over.
⛔ **And a closed rectangle is a cycle in 7 of 25**, so that answers the case that draws
nothing today and not the general one.

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

## ✅ THE THIRD MEASUREMENT — the cycle, cut without a start

**Run 2026-08-29.** Predictions in [PREDICTION.md](PREDICTION.md), written first.

### The observation the whole thing turns on

⚠ **FEASIBILITY IS A PROPERTY OF A PAIR OF VERTICES, NOT OF WHERE THE WALK STARTED.**
`run_between` takes two coordinates; rotating the chain relabels `i` and `j` and changes
nothing else. So the expensive half — `run_edges`, `within`, `covers_span` — is
**rotation-invariant**, and the fifty-seed sweeps above paid for one table fifty times.

✅ **So build the table once and ask every start against it.** Every cyclic partition has at
least one cut vertex, and from that vertex it is a linear partition — so the minimum over
all starts **is** the cycle's minimum, exactly, with no seed left in the answer.

| the closed room, cut circularly | |
|---|---|
| pieces | ✅ **4** |
| marks left over | ✅ **0** |
| distinct optimal partitions | ✅ **1** — the minimum names one description, no tie-break needed |
| its spans | `0-13 · 13-25 · 25-38 · 38-0` = **13 / 12 / 13 / 12** marks, the corner control's own multiset |
| cost | **2454** `run_edges`, once — against **1012** for ONE seed of the linear minimum and ~8000 for the eight that were sampled |
| a straight wall / an L / a zigzag | **1 / 2 / 3**, unchanged: a path has a canonical start and the cycle DP reduces to the linear one |

### ✅ The instrument was checked against a number already measured live

**The table records WHICH HALF of the two-way test passed**, so `dp_once`'s within-only
merge clause replays off it with no further `run_edges`. At stride 7 the table says
**`4 5 5 4 6 7 4 6`** — which is `dp_sweep`'s own live line, value for value. The table is
the same question, and the full fifty-start histogram is now free where eight sampled seeds
cost ~8000 `run_edges`.

### ⛔ AND THE CLOSED CHAIN IS THE LUCKY CASE — 7 OF 25

The 5×5 room fuses at all four corners (`deg 1/2/3+ = 0/50/0`, one chain, a loop) and that
is **not** what a closed rectangle normally does. Twenty-five of them, `a` in 4…8 by `b` in
3…7 world units, stamped and degree-counted — no `run_edges` at all, three seconds:

| | |
|---|---|
| one closed chain | ✅ **7 of 25** |
| carries a JUNCTION — a vertex where three marks meet | ⛔ **17 of 25** |
| `8 × 3` | ⛔ **four separate chains**, `8/46/0` — the corners do not meet at all |

⚠ **SO THE DEFECT [FOCUS](../../doc/claude/FOCUS.md) NAMES IS THE 28% CASE.** *A closed room
draws nothing because `corner_pool` is empty* needs `deg1 = 0` **and** `deg3+ = 0`; the other
seventeen are **not** that case. ⚠ **What the shipped peel then makes of them is not
measured here** — only that the pool is non-empty. The cyclic cut closes exactly the case
that draws nothing, and it does not on its own make a room round-trip.

### ✅ AND THE BREAK IS ONE HEX EDGE WIDE — measured, not thresholded

Every vertex of degree ≠ 2 is a break, and every break has a position, so *is the break at a
corner* is answerable exactly. Over the same 25 rectangles, **80 breaks**:

| | |
|---|---|
| breaks within 1.5 units of a nominal corner | ✅ **78 of 80** — and the other two are at 1.83, still that corner's |
| breaks with **no** break anywhere near a corner | ✅ **0 of 25 rectangles** — nothing breaks mid-wall |
| breaks with another break **exactly one hex edge** away | ✅ **76 of 80** |
| the other four | two hex edges — `6 × 3` and `6 × 6`, both `deg 3/36/3` |

⚠ **AND *ONE HEX EDGE* IS AN INTEGER FACT HERE, NOT A RADIUS.** The measured steps between a
break and its partner are `(0,3) (3,0) (3,-3) (0,-3) (-3,0) (-3,3)` in triangle-lattice
coordinates and **nothing else** — which is exactly what `hex_edge_corners` returns for
`d = 0…5`, checked against it directly, all of world length 1. So a join rule built on this
needs no threshold, and would not be the float fit `CLAUDE.md` forbids.

⚠ **The break has two shapes and they are the same width.** Where a corner overshoots there
is a **fork one edge from a free end** (`4 × 4`: `deg3` and `deg1`, one step apart); where it
falls short there are **two free ends one edge apart** (`8 × 3`, four separate walls). Both
are the corner missing or gaining a single mark.

### ⛔ And on a broken chain the minimum is NOT unique — this measurement's own prediction, refuted

| the fixture | chains | pieces | distinct optimal partitions |
|---|---|---|---|
| a closed room, 5×5 | 1, a loop | 4 | ✅ **1** |
| a triangle | 2 | 4 | ✅ **1** |
| ⛔ a wider room, 14×6 | 2 | 5 | ⛔ **5** |
| ⛔ an L-shaped room | 3 | 8 | ⛔ **16** (1 × 4 × 4) |

⛔ **AND THEY ARE NOT A ONE-VERTEX WIGGLE.** The wider room's long chain cuts at
`0·1·17·25`, `0·3·17·25`, `0·11·17·25`, `0·16·17·25` or `0·18·20·25` — the first piece is
**1, 3, 11 or 16** marks long, or the whole partition moves. Four pieces either way, nothing
over either way, and four different pictures.

⚠ **The mechanism is the same broken corner.** A chain that starts mid-wall begins with a
fragment, and a fragment can be spent anywhere — so the ambiguity is not a property of
*fewest runs*, it is what a free end left in the middle of a wall does to it. On the true
cycle, where no fragment exists, the minimum is unique.

## What this leaves open, precisely

~~**A loop must be cut circularly.**~~ ✅ **ANSWERED** — build the feasibility table once and
take the minimum over every start; the room comes back as its four walls, uniquely, for one
table's worth of `run_edges`.

⛔ **WHAT IS OPEN IS ONE LEVEL EARLIER: THE CORNER** — and it is measured now. A closed
rectangle is a closed chain in **7 of 25**; the other eighteen break, **always at a corner**,
and the break is **one hex edge wide in 76 of 80 cases** (two edges in the other four). That
is where the fragments come from, and the fragments are what make the minimum ambiguous.

**So the next step is a decision with a number behind it**: join chain ends across a
one-edge break in the reader, or make `wall_stamp` leave the corner closed. ⚠ Neither is
measured yet — this probe says the gap is exactly one edge, not which end should close it.
⛔ **And a join rule is not free**: joining two ends one edge apart would also fuse two walls
that merely pass close, so whatever closes the corner owes the control this probe has not
built — **two unrelated walls one edge apart must NOT become one chain**.

## What it deliberately does not do

- **It ships nothing into the editor.** `run_within` and `corner_pool` are untouched, and the
  peel still loses the zigzag's 12 marks and all 50 of the room's. What landed is the library
  entry point plus this measurement of what to build on it.
- **It does not handle a junction.** `wall_chain_walk` reports `wc_branch` and the cut here
  ignores it; no fixture has a `deg ≥ 3` vertex, and `B4w` already measured that a `T` is
  recoverable only sometimes.
- ~~**It does not sweep the minimum over all fifty seeds**~~ — ✅ it does now, and for less
  than three seeds' worth of `run_edges`, because the table the sweep was re-deriving is the
  same one at every seed.
- **It does not ask why a corner breaks.** The rate (7 of 25), the place (always a corner)
  and the width (one hex edge, 76 of 80) are measured; *why* the stamper lands one edge out,
  and which end should close it, are not.
- **It does not build the join.** The control that would have to come with it — two
  unrelated walls one edge apart staying two chains — does not exist here.
