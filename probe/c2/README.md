# `C2` — a room is the house again, adjacent

**Plan 26. `make probe-c2` · `sh probe/c2/sweep.sh`.** The requirement, in the project owner's
words: *"Rooms should just follow from the current house with doors. **Just multiple houses of
different sizes added together as a floor plan.**"*

⚠ **THE DEFAULT IS `@HB-X52`'s, NOT A CHOICE MADE HERE.** Between two adjacent stencils the
shared edge is INTERIOR to the union, so cutting the union's boundary never marks it — two
boxes make **one space**. [HOUSE_ROOMS](../../doc/claude/HOUSE_ROOMS.md) says the hall-or-room
default is hexbody's and *"do not guess this one"*, so this builds the library's behaviour and
changes nothing. A partition becomes a second, deliberate gesture on the interior edge.

## ⛔ The hard part is the RE-CUT, not the union

The structure already **has** walls, and adding a box makes one of them interior. So the seam
must be **cleared** as well as the new boundary written — which is why this was prototyped
before it was a gesture:

| a house, and a box placed against it | walls | seam | leaks | one space |
|---|---|---|---|---|
| adjacent, same size | 42 → 52 (wrote 19, cleared 9) | **0** | 0 | ✅ |
| adjacent, smaller | 42 → 51 (wrote 15, cleared 6) | **0** | 0 | ✅ |
| further along | 42 → 60 (wrote 27, cleared 9) | **0** | 0 | ✅ |
| off to one side | 42 → 51 (wrote 15, cleared 6) | **0** | 0 | ✅ |
| ⛔ not touching at all | 42 → 80, cleared **0** | 0 | 0 | ⛔ **false** |

✅ `shared_marked` — the library's own instrument for its own claim — is **0** on every
adjacency, and `set_connected` correctly says **false** for the box that touches nothing, which
is what the gesture refuses.

## What shipped

**`hex_editor::room_add`**, on the verb **`room`** (key `3`):

- `field_union` + **`combine_cut`** — the union cut once, never a boundary of ours
- the seam **cleared**, limited to edges the union makes interior
- the new cells floored at the **existing** floor's height, not their own seat
- ⛔ **no roof and no filed `WallRun`** — roofs are out of scope by the requirement, and a run
  is a straight line the mesher draws from, which would put back the wall this gesture removes
  ([EDITOR_DEFECTS 4](../../doc/claude/EDITOR_DEFECTS.md))
- a doorstep when the structure runs past the window the gesture can see, rather than cutting a
  boundary at the clip and stamping it as a wall across somebody's house

⚠ **`3`, AND NOT ONE OF THE FREED LETTERS.** `K` and `V` look free and are **guarded** — a test
holds them as the ANNEX family's aliases, because a second key there is what a lost selection
looks like from the keymap, and `P I U N M` are the OPENING family's for the same reason. The
digits are the editor's real spare capacity.

## ⛔ The sweep found a hole in its own tests

| row | | |
|---|---|---|
| 0 | control | green |
| 1 | the seam is never cleared | ⛔ **RED** |
| 2 | the union boundary is never written | ⚠ **green at first** — see below |
| 3 | a box with nothing to join is accepted | ⛔ **RED** |
| 4 | the clear is not limited to the union's interior | ⚠ green — defensive, and no fixture reaches it |
| 5 | ✅ the edge scan in a different order | ✅ green |

⛔ **ROW 2 PASSED WITH THE GESTURE WRITING NO WALLS AT ALL.** `leak_count` floods the **cell**
set, so it says nothing about whether an edge carries a wall — a plan of the right shape with
no walls on it satisfied every row. The test now asserts that `∂` of the union is **walled all
the way round**, using `hex_draw::draw_walls` as the definition, and row 2 is red.

⚠ **That is the third time this session an instrument was blind to the thing it was aimed at**,
and the only reason it surfaced is that the sabotage asked.

## What this does NOT do

- **No door.** Two fused boxes are one space; a partition and a door in it are the next
  gesture, and `@HB-X70` — *an opening is a material on a wall that continues* — must be paid
  first, because `builtin_house_door` still leaves the doorway at material `0`.
- **No roof over the union.** Out of scope by the requirement, and the reason a room never
  reaches `D2b`: it files no roof plan.
- **No level.** *"When a stair is placed a next floor is added"* is `combine_cut_level`, and a
  level is not a height.
