# `B4x` — the ordered chain walk, and the acceptance the record got backwards

**Run 2026-08-28.** Plan [26](../../plans/26-blueprint/README.md) `B4x`, second
measurement. The first one ended with a named next step:

> Rebuild prototype 3 with **`run_span`'s** within-ness as the cut test rather than set
> equality, and re-measure the four piece counts (1 / 2 / 3 / 4). **The design stands or
> falls on that one number.**

`make probe-b4x`. Predictions in [PREDICTION.md](PREDICTION.md), written first; the run in
[run.txt](run.txt).

## The verdict

✅ **The counts are 1 / 2 / 3 / 5 → 4, with nothing left over** — the design holds.
⛔ **And the route named to reach them does not.** Within-ness is the *weaker* half of the
acceptance, and on its own it loses **36 of the room's 50 marks**.

| the cut | wall | L | zigzag | room | marks over |
|---|---|---|---|---|---|
| set equality — prototype 3's own, the control | 1 | 2 | 3 | **7** | 0 |
| **within-ness — what the record asked for** | 1 | 2 | 3 | **3** | ⛔ **36 of 50** |
| within-ness, longest span on a tie | 1 | 2 | 3 | **2** | ⛔ **39 of 50** |
| within-ness **and** it covers the span — R1 both ways | 1 | 2 | 3 | **6** | 0 |
| …and taking the **fewest** runs rather than the first ones | **1** | **2** | **3** | **5 → 4** | **0** |

Today the shipped peel draws `run;run;` for the zigzag and **loses 12 of its 18 marks**,
and draws **nothing at all** for the room, losing all 50.

## What the record got backwards

The first measurement blamed prototype 3's acceptance for being *stricter* than the
shipped reader's, and prescribed the looser one. Two things are wrong with that, and both
are measured here:

⛔ **The strict acceptance is not what broke prototype 3.** Rebuilt, exact set equality
closes every fixture with **`over 0`** — a straight wall in ONE piece, not fourteen. So
the sentence *"a wall's extreme vertices are not the gesture's endpoints, so
`run_between(v₀, vₙ)` generates a slightly different set"* is **false for these
fixtures**: `run_between(v₀, v₁₄)` generates exactly the wall's fourteen marks. Prototype
3's own code is gone, so what actually failed in it cannot be recovered — but it was not
this.

⛔ **Within-ness alone cannot cut a chain**, because the number it maximises is *the
run's own size*, not *how much of the chain it accounts for*. The seam advances by vertex
index while the coverage advances by generated field, and nothing ties the two together:
the room's three pieces span vertices `0-37`, `37-39`, `39-50` while covering 10, 2 and 12
marks. Twenty-four marks of coverage for fifty vertices of seam.

✅ **The acceptance is `FORMAL_CORE` §6's R1, both ways** — which is `B4v`'s own sentence
one level down: *"each candidate's boundary must lie WITHIN the component's marks, and the
set is taken only when it claims every one of them and nothing outside."* Within-ness is
the *nothing outside* half alone. Adding *every one of them* — every mark the seam steps
over is generated — takes the room from 36 marks lost to none.

## And a greedy seam steps across a corner

⛔ **Even with the two-way test, taking the longest piece first gives the room SIX runs
where four walls were built.** The spans say where it goes wrong: `0-4 4-6 6-14 14-26
26-39 39-50`. The first piece crosses a corner — a 4-mark run spanning it lies within the
field exactly as the 2-mark run stopping at it does, and longest-first prefers the longer
— and every seam after that is off phase.

⚠ **The corner control is what makes that a diagnosis rather than a guess.** Each of the
room's four walls measured ALONE in the same window is **one** run, of 12 / 13 / 12 / 13
marks — **exactly 50**, the room's own total. So the corners add nothing and lose nothing,
and a four-run partition was available the whole time.

✅ **So ask for the FEWEST runs instead of the first ones.** Same feasibility test, over
the chain at once: a shortest path whose edges are the feasible spans. The room comes back
`0-1 / 1-14 / 14-26 / 26-39 / 39-50`, and the loop merge folds the 11-mark tail into the
1-mark head — **12 / 13 / 12 / 13, the corner control's four walls to the mark.**

## The clauses that had to be written on purpose

⚠ **A field is several chains, not one.** The `B4x` survey's own degrees said so and it
was read past: an L has `deg1 = 4`, so its two walls do **not** fuse and each keeps its own
two ends. The first version of this probe walked one chain, stopped, and reported half an
L with the other half as a residual.

⚠ **A loop has no canonical start**, so the walk cuts one of the room's walls in two and
returns five pieces. Merging the first and last when they are one run — the same
feasibility test, one span further — is the clause the first measurement predicted would
be needed. It fires exactly once, on the room.

⚠ **The fixture is aimed at nominal corners, and chaining it through the stamper's own
snapped ends is worse.** Four walls round a square, each started where the previous one
actually finished, give `deg 1/2/3+ = 1/57/1` — a free end and a junction, so not a room.
Four walls each aimed at their own corner give `0/50/0`. The snap is what makes the corners
meet.

## The instrument, checked before it was believed

The fixtures are recognised by their **degree table**, which is the only thing the first
survey recorded about them: a straight wall `2/13/0` at 14 marks, an L `4/11/0` at 13, a
closed room `0/50/0` at 50 — an empty `corner_pool`, which is the whole defect. All three
reproduce it exactly. ⛔ **The zigzag does not**: the survey's is 18 marks at `4/16/0`, and
a sweep of sixteen bend geometries found none — this one is 16 marks at `4/14/0`, the same
signature (three walls, one corner fused and one not, so two chains) at a different size.

The set-equality cut is kept in the table as the **negative control**. Without it a green
row says nothing about which half of the prototype was wrong — and here it is the row that
refutes the first measurement's diagnosis.

⛔ **And the first version of this probe was wrong in a way only a count could see.** It
took the first accepted `k` descending from the far end, and the closed room came back as
ONE piece of ONE edge: a far-away vertex snaps to a *short* run whose few edges are
trivially within the marks. **The accepted run's length is not monotone in the vertex
index.**

## Cost

Counted in `run_edges` calls, which is the same integer on any box:

| | wall | L | zigzag | room |
|---|---|---|---|---|
| greedy, two-way | 15 | 15 | 31 | 217 |
| fewest runs | 19 | 19 | 55 | **1022** |

⚠ **The minimum is quadratic in the chain and the greedy one is linear.** 1022 calls for a
50-mark room is seconds; a chain four times as long is sixteen times the work, and that is
the number to watch before this goes anywhere near `loft test`'s 300-second deadline. For
comparison, the thing this replaces — admitting every corner to `corner_pool` — blew that
deadline **on this room**.

## What it deliberately does not do

- **It ships nothing.** The walk lives in the probe. `run_within` and `corner_pool` are
  untouched, and the peel still loses the zigzag's 12 marks and all 50 of the room's.
- **It does not ask where the walk belongs.** `CLAUDE.md` names the ordered chain walk as a
  **library** gap — `hex_shape` owns `wall_chain_ends` and `wall_chain_branches`, which
  count degrees and throw the components away. That is the next decision, and it is a
  decision about a published package rather than about this measurement.
- **It does not handle a junction.** The walk picks the first unused mark at a vertex; none
  of these four fixtures has a `deg ≥ 3` vertex, and a `T` or a `+` would need a rule.
