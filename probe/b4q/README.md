# `B4q` — a wall's field records which way you WALKED, and its description does not

**Run 2026-08-27.** Plan [26](../../plans/26-blueprint/README.md) `B4q`. Measured while
looking for something else: `B4p` left *"what does a run own"* open, and the peel it
blocks needs an exact answer.

## The verdict

⛔ **`hex_shape::wall_read_run` STATES IT AS A FACT ABOUT THE FIELD** — *"what it cannot
recover is the ORIENTATION, because the field does not store one: A-to-B and B-to-A mark
the identical edges"*. **It is false for this tree's stamper.** One run record, stamped
forward and reversed, `run_between` out of the picture:

| heading | both | only forward | only reversed |
|---|---|---|---|
| east | 10 | 0 | 0 |
| **north** | **2** | **9** | **9** |
| NE | 8 | 0 | 0 |
| steep NE | 10 | 0 | 0 |
| **shallow NW** | **10** | **3** | **3** |

⚠ **THE CONTROL IS THE THREE ZERO ROWS**, so the comparison can see *identical* — and
due east, which is how every wall in the corpus is walked, is one of them. That is why
this has survived.

## Why

`wall_stamp` takes its halfplane normal from the run's **tangent** — `nx = -ty, nz = tx`
— so reversing the record flips the normal, and with it the side a cell whose centre lies
exactly **on** the line falls on. A due-north wall in odd-r passes through alternate rows'
cell centres, so exactly those flip. The two fields are mirror images about the line.

![a wall walked north](../../doc/claude/img-wall-north-b4q.png)
![the same wall walked south](../../doc/claude/img-wall-south-b4q.png)

*`make plan-view WORLD=b4q Q0=-4 Q1=5 R0=-3 R1=11 REF=2.0` and `Q0=5 Q1=14`. Both recover
a `d6` description (blue, dashed); the marks zigzag to opposite sides of it, and only one
of the two is the field that description makes — `desc d6 p8` against `desc d6 p9 · 9
stray · 9 missing`.*

## And the library's own generator is a THIRD rule

`hex_shape::wall_write` marks where the centreline separates two cell **centres**;
`wall_stamp` marks where the edge midpoint's distance to the **segment** equals its
distance to the **line**. Over ten headings, `wall_write` against the store:

```
east  north  diag  shallow+  steep+   — identical
back-shallow  west  south  shallow-  back-diag  — differ
```

⚠ **AT IDENTICAL EDGE COUNTS.** `south` is 12 and 12 with **3** in common, one hex column
apart. A check on the count alone reads as a match — `B4l`'s *a rim COUNT cannot see a
shape*, one shape over. So `B4q`'s generator is `hex_editor::run_edges`, which is
`wall_stamp`'s own inner loop extracted, and not the library call that looks like it.

## What it does NOT say

⚠ **IT IS NOT A CLAIM THAT `wall_write` IS WRONG.** The two rules are both defensible for
a zero-width line through cell centres; what is not defensible is a field that depends on
the direction of travel, because that is the one thing the reader is documented not to
recover.

⚠ **AND THE FIX IS NOT HERE.** Making `wall_stamp` orientation-independent moves the field
under every non-east wall in the corpus — `deck.keys`'s `cea971a0…`, `house.keys`, every
acceptance shot — so it is a step with its own gate work.
[EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) 6 is where it is filed. `B4q` makes it
**visible**: the caption says `· N stray · N missing` on every picture that holds one.

## Reproducing it

The measurements are assertions now rather than a script:
`lib/hex_editor/tests/run_fit.loft` —
`test_the_same_run_walked_backwards_leaves_a_field_it_cannot_reproduce` is the table's
`north` row, and `test_due_east_is_unmoved_by_the_direction_of_travel` is its control.
