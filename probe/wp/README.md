# `WP` — the four probes of [WALL_PUSH](../../doc/claude/WALL_PUSH.md)

**Run 2026-08-28.** `make probe-wp`. Predictions in [PREDICTION.md](PREDICTION.md), written
first; the run in [run.txt](run.txt).

Probes 1–3 test the document's **first draft**, which modelled a push as translating a wall's
LINE. Probe 4 tests the model that replaced it: a structure is a set of hexes and a wall is
where inside meets outside.

## The verdict

⛔ **Two of the first draft's rules are refuted, one is confirmed, and the object was wrong.**
✅ **The replacement model's arithmetic is exact and measured.**

## Probe 1 — the quantum

The shortest translation across a wall that leaves its anchor on a triangle-lattice vertex
with `wall_run_ok` true, searched over integer `(da, db)` perpendicular to the heading:

| class | `d24` | N | line spacing | **admissible quantum** | ratio |
|---|---|---|---|---|---|
| vertex | 0 · 4 · 8 · 12 · 16 · 20 | 3 | 0.5 | **1** | 2× |
| edge | 2 · 6 · 10 · 14 · 18 · 22 | 1 | 0.866025… | **1.7320508… = √3** | 2× |
| in-between | every odd `d24` | 39 | 0.138675… | **3.6055513… = √13** | **26×** |

**All 24 headings have one; none is stuck.**

✅ **`@WP-0c` was right** — the line spacing is only a lower bound, and by 2× / 26×.
⛔ **`@WP-0b` was wrong and INVERTED.** It predicted a diagonal wall moves 6.25× *more slowly*
from the spacing table. It moves **3.6× further** per step than an axis wall: the in-between
heading is the coarsest, not the finest.
⚠ The three quanta are still mutually incommensurable — 1, √3, √13 — so the *incommensurability*
half of the draft's §0 survives even though the magnitudes inverted.

## Probe 2 — can an obstacle take the pusher's displacement?

**576 of 576 (pusher, obstacle) heading pairs: yes.** The search returns an integer lattice
vector, and a lattice vector maps the lattice to itself — so the obstacle's anchor stays a
vertex and its run stays admissible.

⛔ **So `@WP-7`'s worry, and the refusal `R6` it justified, were unfounded.**

⚠ **THAT `R6` IS THE FIRST DRAFT'S AND IS NOT THE ONE IN `WALL_PUSH` §4 TODAY.** The draft's
was *an obstacle cannot take the displacement*, refuted here and deleted with the rest of the
line model. The live `R6` — added 2026-08-28 with law `L1` — is **a push through a doorway is
refused**, which this probe never touched. Same letter, different refusal, and the older one
is the one that is gone.

⚠ **The first version of this probe stopped one step short and would have said the same thing
for the wrong reason.** It checked only that the displacement is a lattice vector. That is not
enough: a run's admissibility depends on its **anchor's class**, so the question is whether
wall B is still legal after moving by wall A's quantum — a pair test, not a property of one
heading. Both versions answer yes; only the second one asks.

## Probe 3 — the round trip

Push, recover the pushed wall through `wall_read_run`, re-stamp, unpush from the recovered
description, compare edge for edge. `d24` 0, 2 and 1: **re-stamp == pushed**, **unpush ==
home**, and the control — one step *along* the wall rather than across it — **differs**.

⚠ **THE FIRST VERSION WAS VACUOUS.** It stamped `a0 + da - da`, which is the same call as the
original: a table checked against itself cannot be surprised. It reported a clean round trip
before it tested anything.

⛔ **AND IT STILL DOES NOT EXERCISE THE RISK IT WAS WRITTEN FOR.** `@WP-16` cites `B4q` — the
same wall walked the other way is a different field with an identical mark count. This probe
stamps with `hex_shape::wall_write`; `B4q` measured `hex_editor::wall_stamp`. A round trip
through the editor's own stamper is **untested**, and a green here is not a claim about it.

## Probe 4 — the hex-set model

A wall is an edge whose two cells disagree about membership. Transferring one cell into a
37-cell house, against the prediction `Δ|∂I| = 6 − 2k` for `k` inside neighbours:

| `k` | predicted | measured |
|---|---|---|
| 0 | +6 | **+6** |
| 1 | +4 | **+4** |
| 2 | +2 | **+2** |
| 3 | 0 | **0** |
| 4 / 5 / 6 | −2 / −4 / −6 | no such cell in a convex house — the concave cases need a fixture that has one |

✅ **Exact, and it makes the request's own clause a theorem.** *"Normally this will not reduce
the number of walls"* holds because a push against a convex face has `k ≤ 2`, so `Δ ≥ +2`.

**And the sweep**: pushing one whole face of that house — five cells, direction 0 — takes
`|∂I|` from **46 to 50**, and the house is still a rectangle. Pushing *one* of those five
gives `+2` and a shape that is not, which is why the gesture has to be a walk.

## The instrument, checked before anything was believed

The exact integer perpendicularity test — `2ac + ad + bc + 2bd`, derived by hand from
`tri_x`/`tri_y` — is checked against the float dot product on **all 6561** pairs in
`(-4..4)²×(-4..4)²` before it is used, for both zero-ness and sign. **0 disagreements.** A
wrong integer test would have selected the wrong displacements silently, and every number in
probes 1–3 would have been a fact about the mistake.

## What it deliberately does not do

- **It builds no push.** No verb, no tick clause, no store write.
- **It does not reach the editor's stamper**, which is where `B4q`'s mirroring lives.
- **It does not test the concave cases of L3** (`k ≥ 4`) — a convex house has no such cell,
  and a fixture with a notch is what those rows need.
