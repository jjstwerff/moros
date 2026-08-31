# `probe/r5b` — what `R5b` costs the walk, and can the tests see it go wrong

Plan 21 [`R5b`](../../plans/21-region-mappings/README.md). Two scripts, and they answer two
different questions that are easy to confuse:

| | |
|---|---|
| `sh probe/r5b/sweep.sh` | **can `role_mat.loft` see the step go wrong?** Ten rows, restored from copies |
| `sh probe/r5b/run.sh` | **does the resolution show up in `edges_around`'s own clock?** |
| `sh probe/r5b/cost.sh` | **and in `peel.loft`'s and `planview_region.loft`'s?** — `R5b.2` |
| `loft door_corner.loft --lib ../../lib` | **does the corner rule delete a door?** It did |

## Why there is a cost probe at all

Plan 26 `B4e` refused to resolve an edge byte through the palette, in its own words:

> *"Every caller holds a byte and no world — the walk asks this per edge per step … The cost,
> said out loud rather than discovered: a world cannot declare slot 7 to be a FENCE."*

`R5b` pays that cost, so it is measured rather than argued. `edges_around` reads three edge
slots of every cell in a `(2·reach+3)²` window — about **1 000 asks per rebuild** — and the
overwhelming majority of those bytes are **absence**.

## ⚠ The load-robust number is NOT in this directory

It is [`probe/roles/cost.loft`](../roles/cost.loft), which is A-B-B-A **inside one process**,
40 000 calls an arm:

| | byte predicate | resolved |
|---|---|---|
| an ABSENT edge, first version | 5 ms | ⛔ **57 ms** |
| an ABSENT edge, with `if mat == 0 { return false; }` | 2 ms | ✅ **1–3 ms** |
| a real wall or door | 2 ms | 156 ms |

The guard cannot change an answer — `world_palette_name` returns `PAL_ABSENT` for slot 0
before it looks at anything, so **no world can name slot 0** — and `role_mat.loft` pins the
resolved pair equal to the byte pair on all 256 bytes. Sweep **row 9** cuts the guard and
stays green, which is what makes it a speed cut rather than a rule.

## ⛔ And the wall clock on the scan is not an instrument on this box

`run.sh` times `edges_around` itself — not a copy of its loop, because a body copied into a
probe is evidence about the copy (`probe/a0q`). The A/B is across two **builds**, since which
predicate the walk calls is a source-level fact.

**Its first version read AFTER / BEFORE / AFTER and the two AFTER rows came back 186 ms and
474 ms — the same binary, the same program, 2.5× apart.** This box runs other agents' work. So
it is a build-level **A-B-B-A** now, with `/proc/loadavg` printed beside every row:

| | open window | walled window |
|---|---|---|
| A1 AFTER (load 27.7) | 146 / 141 ms | 142 / 142 |
| B1 BEFORE (load 24.1) | 155 / 158 ms | 144 / 138 |
| B2 BEFORE (load 19.4) | 222 / 207 ms | 213 / 209 |
| A2 AFTER (load 14.6) | 150 / 175 ms | 150 / 145 |

**The ranges overlap and AFTER is never the slower of a pair.** That is all it can honestly
say, and it is enough: the per-call table above is the measurement, and this says the cost
does not show up in the scan.

⚠ **Every run asserts the blocked-edge counts first** — 0 for the open world, 30 for the
walled one, identical in all four rows. A clock over two arms that block different things is
timing two different questions.

## ⛔ `door_corner.loft` — a defect the wiring walked into

`corner_write`'s header says *"The **unmarked** edge …"* and its test was `edge_is_wall`,
**which is false for a DOOR**. So a doorway on the join edge two runs leave open was a
candidate rather than a miss. On `probe/b4y`'s own `8 × 3` gap corner, with the join edge
**found rather than named** (`(4,−2)` dir 0, the one edge neither run lays):

| | before the second wall | after |
|---|---|---|
| the edge holds | `2` | ⛔ **`1`** |
| doors in the window | 1 | ⛔ **0** |

⛔ **AND THE BYTE PREDICATE HAD BEEN PROTECTING A DECLARED DOOR BY ACCIDENT** — `edge_is_wall`
answers *wall* to every byte past the vocabulary, so resolving that site would have spread the
defect to a world's own door. **A consistency fix that spreads a defect is not a fix**; the
site is removed rather than resolved, and the probe answers `✅ the door survived.` now.
[EDITOR_DEFECTS 12](../../doc/claude/EDITOR_DEFECTS.md).

## The sweep

⚠ Restored from **copies**, never `git checkout` — the subject of a sweep is uncommitted by
definition. The subject is asserted **present before row 0**, and every row asserts the
package still **built** before its result is read: a row that will not compile goes red
everywhere and reads as the strongest catch in the table.

| row | what was cut | |
|---|---|---|
| 0 | control | green |
| 1 | `edge_role_at` never reads the palette | ⛔ RED (6) |
| 2 | absence falls through to the wall default | ⛔ RED (2) |
| 3 | a fence blocks the VIEW too — the two sets collapse | ⛔ RED (2) |
| 4 | `edges_around` still asks the BYTE pair | ⛔ RED (4) |
| 5 | `open_ahead` asks `is_opening`, not `is_opening_at` | ⛔ RED (1) |
| 6 | `run_slope` asks `edge_kind_of`, not `edge_kind_at` | ⛔ RED (1) |
| 7 | `edge_kind_of(0)` is masonry again | ⛔ RED (2) |
| 8 | ✅ the wall/door rows in a different ORDER (valid) | ✅ green |
| 9 | ✅ the walk's absence GUARD dropped (a speed cut) | ✅ green |
| **10** | `mark_left` asks the byte | ⛔ RED |
| **11** | `oct_fits_at`'s extent scan asks the byte | ✅ green — **unobservable, see below** |
| **12** | the HOUSE acceptance reader asks the byte | ⛔ RED |
| **13** | the REGION acceptance reader asks the byte | ⛔ RED |
| **14** | `corner_write` skips MASONRY again, not what is marked | ⛔ RED `corner_close` |
| **15** | `wall_corner_close` asks the byte | ⛔ RED |
| **16** | `room_add`'s union asks the byte | ⛔ RED |
| **17** | `session_run`'s own material asks the byte | ⛔ RED |
| **18** | `edge_is_wall_at` never resolves — the whole step at once | ⛔ RED |
| 19 | ✅ `edge_is_wall_at`'s absence GUARD dropped | ✅ green |
| **20** | a declared wall TYPE is a role of its own | ⛔ RED — the bug `R5b` shipped |

⛔ **AND AN UNAPPLIED CUT USED TO READ AS A GREEN ROW.** `edge_role_at`'s body changed under
row 1 when the two-namespace bug was fixed, the cut stopped matching, and the row came back
**green** with a warning line above it a skimming reader would miss — *the tests cannot see
this* wearing the costume of *nothing was cut*. Every cut asserts a match count of 1 and the
row now prints **⛔ THE CUT DID NOT APPLY** instead of a result.

⚠ **Rows 8, 9 and 19 are why the table means anything.** A sweep of only-red rows cannot tell
*the tests see this* from *the tests fail on anything touched here*.

⛔ **AND THE TABLE'S FIRST RUN WAS A COVERAGE REPORT: 2 OF 8.** `R5b.2` rewired eight readers
and **six rows came back green** — which does not mean they are right, it means nothing in the
tree could tell, and that is guaranteed rather than accidental: **no world in this corpus
carries an edge palette.** Five tests later it is seven of eight.

⛔ **AND ROW 11 IS GREEN FOR A THIRD REASON, WHICH IS THE ONE WORTH READING.** `oct_fits_at`
scans its window for masonry to size a box, then hands that box to `disc_marks`, **which scans
it again for the same thing** — so its answer cannot show through the return, and no fixture
can make that row red. It is wired anyway, because the failure mode of the two disagreeing is
a window **narrower** than the field, which is [`probe/tw`](../tw/README.md)'s cliff rather
than a smaller picture.

⛔ **And row 7 is a defect the step FOUND rather than one it introduced.** `edge_kind_of(0)`
answered `wall`, slope 1 — *no edge here*, reported as masonry — and it was computed by
nobody, because every reader skips byte 0 before asking. It surfaced only when a second
derivation of the same quantity was pinned equal to it.
