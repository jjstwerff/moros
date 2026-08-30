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

## ✅ 2. THE FINDING, AND IT IS FIXED: a clipped window never returned

This was never a test-suite matter. `src/plan_view.loft` takes `Q0 R0 Q1 R1` from the
environment, so **an author choosing a window was one hex from a picture that never came
back** — [EDITOR_DEFECTS 11](../../doc/claude/EDITOR_DEFECTS.md).

The tee fixture, marks at **q −4..4**, window `q0,−6 .. 7,7`, one process:

| `q0` | cells | before | after |
|---|---|---|---|
| −6 | 169 | 36 marks, 0 desc, refused · 3.2 s | unchanged |
| −5 | 156 | 36 marks, 0 desc, refused · 3.0 s | unchanged |
| −4 | 143 | 36 marks, 0 desc, refused · 2.9 s | unchanged |
| −3 | 130 | 34 marks, 8 desc · 2.6 s | unchanged |
| ⛔ **−2** | 117 | ⛔ **> 180 s, no answer** | ✅ **29 marks, 8 desc · 3.1 s** |
| ⛔ **−1** | 104 | ⛔ **> 180 s, no answer** | ✅ **24 marks, 8 desc · 5.5 s** |

**A cliff, not a curve** — and the window is getting *smaller* across it, which is what
rules out *a big window is slow*.

### ⛔ The mechanism: the flood read the WORLD and wrote into the WINDOW

`marks_label` seeds from the window's scan and hands each seed to `mark_piece_grow`, whose
enqueue rule is *the world holds a mark here* **and** *this piece has not recorded it*. For
an edge outside the window's grid **both stay true for ever** — `PHASE=why` asks each
directly:

```
outside: write 7, read back 0          ⛔ the write is dropped
inside:  write 7, read back 7          ✅ the control — not blind everywhere
world at q=-4: 1 wall byte(s)          the window is not consulted
```

✅ **AND IT IS ENDLESS RATHER THAN SLOW, WHICH RSS IS THE INSTRUMENT FOR** — 106 → 238 MB
over 96 s, climbing monotonically. A fixed computation that is merely slow does not grow.

### ⚠ Two wrong answers on the way, and both are the point

⛔ **The first mechanism published for this was the peel's candidate pool** — *`run_within`
is quadratic in the chain's ends and clipping makes more ends*. Coherent, measured to be
**wrong**: the readers are never reached at all. `segments_of` is two floods and **both are
public**, so which one hangs is a question that can be asked rather than reasoned about —
`touched_cells` returns, `cells_label` returns 1, `marks_label` does not return. That check
cost one probe phase.

⛔ **And the first prediction from the RIGHT mechanism failed too.** *A mark two cells
outside on any side* predicts the `q0` cliff exactly — and the `q1` and `r0` sides both
answer in under 3 s with marks two cells out. `eg_index` canonicalises three of the six
directions onto the NEIGHBOUR cell, so which clipped edges are addressable depends on which
side the window cuts. ⚠ **A test clipping one side would have been green on three quarters
of the defect.**

### ✅ And the CLASS has exactly one member, which was checked rather than assumed

`segments_of` runs **two** floods of the same shape, and a fix to one of them says nothing
about the other. `cells_label` enqueues a cell that is IN the set and whose LABEL is unset —
endless in exactly the case where a cell can be in the set and unlabelable, and
`touched_cells` sets *both* cells of every mark, so a boundary mark's outside cell is the
case. `PHASE=halo` asks:

```
0 cell(s) outside: in-set true   label 5
1 cell(s) outside: in-set false  label -1
2 cell(s) outside: in-set false  label -1
```

⚠ **`HexSet` has NO halo where `EdgeSet` has one**, so the outside `hexset_set` is dropped,
`hexset_get` is false, and the flood's own set guard stops it before the label is ever
asked. **One flood was exposed and the other was not, and the difference is a storage
detail neither function mentions.**

### ✅ The fix — a piece grows only within the field it is recorded into

`mark_in_field`, one condition in the flood and no new parameter: `out` already carries its
own window. The bound is the window's **scan** (`d` in `[4, 5, 0]` from a cell inside), not
the storage — `edgeset_*` addresses a one-cell halo as well, and bounding by what can be
written would admit edges no other reader counts. That the other three directions name the
same edge from the neighbour is **measured** over a 7 × 7 patch, not assumed.

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
make probe-tw                                        the cliff, either side of it
FIX=housed Q0=-10 R0=-11 Q1=7 R1=11 \
  loft --interpret --lib lib/ probe/tw/field.loft    one fixture, one window
PHASE=why  Q0=-2 R0=-6 Q1=7 R1=7 \
  loft --interpret --lib lib/ probe/tw/pool.loft     the two ingredients of the loop
PHASE=halves Q0=-2 R0=-6 Q1=7 R1=7 \
  loft --interpret --lib lib/ probe/tw/pool.loft     which of segments_of's two floods
PHASE=svg2 Q0=-16 R0=-16 Q1=20 R1=20 \
  loft --interpret --lib lib/ probe/tw/win.loft      one phase, timed by the shell
```

⚠ **Time these ONE AT A TIME.** Run five in parallel and the row that takes 3.2 s alone
reports 109 s — measured, and it is how the first version of the table above was wrong.
⚠ **And read `/proc/loadavg` before believing a slow row**: this box carries a sibling's CI,
and a 3.6-second window was read as *still going at 120 s* once in this very session, at
load 26.

⚠ **`make probe-tw` KEEPS ITS LAST ROW, which now PASSES.** It was written to show a window
that never answers, and leaving it in is what makes it a regression check: the row prints a
time and a picture where it used to print `NO ANSWER IN 90s`.
