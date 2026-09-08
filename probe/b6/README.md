# `probe/b6` — the plan on the page, and a pick on it

Plan 26 `B6`. `make probe-b6`; `make probe-b6-sweep` for the controls.

**The question.** [FOCUS](../../doc/claude/FOCUS.md) §1's order of work had two rows
not started: *`B2` — the plan view inside a renderer* and *`B3` — authoring in the
plan, `pick` from a pointer*. Both existed headless (`editor_run`'s `plan` and `pick`,
`src/plan_view.loft`) and neither renderer could open a plan. This is the shortest path
to a version a person can test: the **page** (`_site/index.html`, `file://`, no server)
draws the same `hex_mesh::plan_levels` over the same `plan_window`, and a click on it is
the same `plan_pick` the runner resolves.

**The mechanism**, and none of it is new geometry:

| | |
|---|---|
| `m` | `plan_open` — the window round the walker (`hex_mesh::plan_window`, radius 8), drawn by `plan_levels`, handed to the page as `host_output("plan:<svg>")` |
| the page | `tools/build-pages.mjs`'s prelude puts the SVG over the canvas; a click is turned into the picture's own units by `getScreenCTM().inverse()` and pushed back as `pick:<x>,<y>` |
| the client | `plan_poll` reads it with `host_input(0)` — a poll on every target, measured — and `plan_pick` resolves it against the window that was DRAWN; the highlight is drawn back |
| a verb | `plan_target` — with a pick on the page the gesture's `Author` is the picked spot at the walker's own facing; the walker does not move |
| `m` again | the overlay comes down and the pick is dropped — a target, not a mode |
| the world moves | `w_tau` differs from the clock the plan was drawn at, and it is redrawn — on the frame loop beside `local_persist`, for its reason |

## The rows

Every row reads the SVG the page holds (`#plan svg`) or the client's own console; the
pictures are kept in `out/<tag>.svg` and `out/<tag>.png`.

| row | claim |
|---|---|
| A | the page booted from `file://` and went local |
| B0 | no overlay before the key |
| B1 | after `m`, the overlay holds an SVG of **289** cells (17 × 17) |
| B2 | the caption's count is the DOM's count |
| C1 | a real click at the centre of cell `(cq+2, cr+2)`'s polygon resolves — in the client's own line — to that cell |
| C2 | the highlight (`polygon.aimcell`) in the picture is that cell |
| C3 | the author marker did not move — *a pick is not a teleport* |
| D1 | `f` writes a fence into the picture (new `line.edge` marks) |
| D2 | the cell under the feet is untouched |
| E1 | `m` hides the overlay |
| E2 | `f` with the plan closed writes a second ring |
| E3a | the control: the first ring moved by the pick offset is a different edge set |
| **E3** | **pick + fence is stand-there + fence**: every edge of the first ring, translated by `−(pick − feet)`, is in the picture after the second fence, and every edge the second fence added is one of those |

## ⚠ Three things the first drivers got wrong, all instruments

- **`raise` has a REACH.** The first driver pressed `ArrowUp` and read the picked
  cell's `data-h`: `0 → 0`, red — while the transcript said `local raise — 1` and the
  picture changed by 66 bytes. The bump was at **(8,1)**, six cells east of the pick:
  `raise_ahead` lands `PEAK_AHEAD` hexes along the FACING. A row that assumes a verb's
  reach is a second copy of that verb. What a pick changes is *where the author is*,
  which is `probe/plan`'s invariant, so the row measures a ring against a ring.
- **A ring moved by an odd number of rows is not a translation.** The second driver
  picked `(+2,+1)` and compared centroids: `(2.60, 1.02)` for a wanted `(2,1)`, and
  **42 against 40 marks**. The lattice is pointy-top odd-r, so the same fence around a
  cell one row down is a different shape in `(q, r)`. The target is `(+2,+2)`.
- **The rings overlap, so the second one's NEW marks are fewer.** 40 = 42 − 2 shared
  edges. A count or a centroid reads that as a different ring; a set comparison under
  translation does not, and it has a control (`E3a`) that says the moved set really
  is a different set.

## The sabotage sweep — predictions first

| `B6_SABOTAGE` | what is removed | predicted red |
|---|---|---|
| `noshow` | the page never shows the overlay (JS) | B1, and the run stops at C: nothing to click |
| `nopush` | the click pushes nothing to loft (JS) | C1 C2, D1 (the fence lands under the feet, so no *moved* ring — E3) |
| `nopoll` | the client never reads the queue (loft) | as `nopush` |
| `notarget` | a verb ignores the pick (loft) | C green, **E3 red** — *seeing is not authoring* |
| `nofollow` | the picture does not follow `w_tau` (loft) | D1 red — the world is right and the picture is stale |

## The sabotage sweep — measured, 2026-09-08

| `B6_SABOTAGE` | predicted red | **measured red** | |
|---|---|---|---|
| control | none | **none**, 13 green | the subject is present before any row is read |
| `noshow` | B1, and the run stops at C | **B1 B2**, then *no polygon for (2,2)* | the page half is seen |
| `nopush` | C1 C2 D1 E3 | **C1 C2 E2 E3** | ⚠ D1 stayed GREEN: it asks *did the fence write marks*, and it did — under the feet. The miss surfaces one row later, when the second fence adds nothing new. A row that names a set is the one that can see WHERE |
| `nopoll` | as `nopush` | **C1 C2 E2 E3** | the client never sees what the page pushed |
| `notarget` | C green, E3 red | **E2 E3** — C1 C2 C3 green | *seeing is not authoring*: resolved, highlighted, ignored |
| `nofollow` | D1 | **D1 E3a E3** | the world was right and the picture stale; the re-open then drew both rings at once, so the moved-set control read *the same set* — a stale instrument fails its own control, which is what the control is for |
