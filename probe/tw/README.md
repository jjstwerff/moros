# `tw` — what a plan-view test's WINDOW costs, and what a clipped one does

**Plan 26. `make probe-tw`.** Written after `planview.loft` was split into four files
because one of them sat at **192 s of `loft test`'s 300-second per-file deadline**. The
split's own commit named what it had not done: *"planview_region is the hot file because
it holds the tee fixture, whose window is far larger than the field needs… that 6.2× is
the remaining lever, and it wants per-test proof that each assertion is
window-independent."*

Two things came back, and the second one is the one to read.

## ✅ 1. The window is the cost, and the lever is bigger than 6.2×

`test_a_set_that_explains_only_part_is_not_drawn` was **83.7 s of its file's 95.4 s** —
88% of it, where the other four tests are 3.3 … 4.0 s each. Its field is seven hexagonal
cell outlines spanning **q −4..4, r −1..1**; its window was **36 × 36**.

| the same test, same assertions | under `loft test` |
|---|---|
| `-16,-16..20,20` — 1296 cells | **86.9 s** |
| `-6,-6..7,7` — 169 cells | ✅ **14.7 s** |

| the file | before | after |
|---|---|---|
| `planview_region.loft` (5 tests) | 90.4 s | ✅ **23.1 s** |
| `planview_shape.loft` (19 tests) | 57.3 s | ✅ **41.9 s** |

Idle box, load ≈ 1, interleaved A/B against `git show HEAD:` copies of the same files so
the two rows are one machine state. The worst plan-view file is **90.4 s → 41.9 s**, and
the four together **210 s → 127 s**.

## ⚠ And the 13× that made it worth doing is NOT harness overhead

The same test body, run as a program instead of under `loft test`, takes **6.5 s** where
the test takes 85. That looked like a harness defect and it is not:

| the same body, big window | |
|---|---|
| `loft --interpret` (libraries link their native cdylib) | 15.1 s total |
| `LOFT_NO_NATIVE_LIBS=1` (every library interpreted) | ⛔ **288.8 s** |
| `loft test` in `hex_mesh` (the package under test interpreted, its deps native) | 86.9 s |

⛔ **`loft test` INTERPRETS the package under test**, which is the only thing it can
honestly do — the point is to run *this source*, not a cdylib built from some earlier
copy of it. So a cell emitted inside a package's own suite costs ~13× what the same cell
costs in `plan_view`, and a window a driver would not notice is what puts a test file
against the wall. ⚠ **The hypothesis was checked before it was reported**: a claim about
`loft test` being slow would have gone upstream as a defect, and it would have been wrong.

## ⛔ 2. THE FINDING: a window that CLIPS a structure can stop the reader returning

This is not a test-suite matter. `src/plan_view.loft` takes `Q0 R0 Q1 R1` from the
environment, so **an author choosing a window is one hex away from a picture that never
comes back.**

The tee fixture, marks at **q −4..4**, window `q0,−6 .. 7,7`, one process, idle box:

| `q0` | cells | what the picture says | time |
|---|---|---|---|
| −6 | 169 | 36 marks, 0 desc, refused | 3.2 s |
| −5 | 156 | 36 marks, 0 desc, refused | 3.0 s |
| −4 | 143 | 36 marks, 0 desc, refused | 2.9 s |
| −3 | 130 | **34 marks, 8 desc** — the clipped field is explicable | 2.6 s |
| ⛔ **−2** | 117 | — | ⛔ **> 180 s, no answer** |
| ⛔ **−1** | 104 | — | ⛔ **> 180 s, no answer** |

**A cliff, not a curve** — and the window is getting *smaller* across it. The same shape
on the house fixture: `-10,-11..7,11` answers in seconds and `-8,-8..6,6` and
`-6,-6..6,6` were both still running at 200 s.

⚠ **The mechanism is the peel's candidate pool.** `plan_describe_within` ends at
`run_within` / `run_chain_within`, whose candidates are the chain's ENDS and JUNCTIONS
(`B4w`: *a wall can only begin where the chain does*). Clipping a structure cuts its
chains, and every cut makes two more ends — so the pool the trial searches grows with the
damage. Not diagnosed further here; recorded with the measurement that shows it.

## ⚠ What this changes about shrinking a window

⛔ **`pt_marks > 0` cannot see a clip, and that was the assertion every one of these
tests had.** Measured: at `-6,-6..3,7` the tee is **32 marks, 0 descriptions, refused**,
and *every assertion in that test passes* over a field that has lost four of its marks.
A test can therefore be moved onto a smaller window, stay green, and no longer be about
the thing it names.

✅ **So every window that moved took an exact mark count with it** — 36 for the tee, 42
for the house, 52 for the house with a wall — chosen from the field's own extent, asked
of the store rather than of the picture:

| fixture | marks span | window now | cells |
|---|---|---|---|
| `row_world` (tee) | q −4..4, r −1..1 | `-6,-6..7,7` | 1296 → 169 |
| `housed_world` | q −4..3, r 1..7 | `-10,-11..7,11` | 2401 / 961 → 374 |
| `housed_and_walled_world` | q −7..3, r −8..7 | `-10,-11..7,11` | 2401 → 374 |

**Identical, measured rather than assumed**: at every window above and the ones they
replaced, the house is 42 marks and 1 description and the walled house 52 and 2, with one
caption each to the character. The control keeps the same window as the row it controls,
because *only the wall differs* is what makes it a control.

## Running it

```
make probe-tw                                        the decisive rows
FIX=housed Q0=-10 R0=-11 Q1=7 R1=11 \
  loft --interpret --lib lib/ probe/tw/field.loft    one fixture, one window
PHASE=svg2 Q0=-16 R0=-16 Q1=20 R1=20 \
  loft --interpret --lib lib/ probe/tw/win.loft      one phase, timed by the shell
```

⚠ **Time these ONE AT A TIME.** Run five in parallel and the row that takes 3.2 s alone
reports 109 s — measured, and it is how the first version of the table above was wrong.
