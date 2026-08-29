# `B4y` — written before the probe ran

**The question.** `B4x` left one sentence for the next session: *close the corner, and
decide at which end.* Two ends are on the table — the reader joins chain ends across a
one-edge break, or `wall_stamp` leaves the corner closed — and the measurement that would
separate them has never been taken, because the two halves were measured in two different
runs over the same 25 rectangles and never put in one table.

| what is known | where |
|---|---|
| 8 of 25 described as four walls, 17 as 5 or 6 — the ones carrying a junction | `probe/b4x` |
| 7 of 25 leak — `promote_close` answers `PM_OPEN` | `probe/pc` |
| every break is at a corner, one hex edge wide, in two shapes | `probe/b4x` |

**Nothing joins those two columns.** *Are the 7 that leak the same rectangles as the 17
described wrong* is unanswered, and the two ends are right for opposite answers.

## What I expect, per column

1. **~40 of 100 corners break, ~60 fuse.** `B4x` counted 80 break *vertices*; a gap corner
   contributes two free ends and a fork corner a junction plus the spur's free end, so
   either shape is two vertices and 80 vertices is about 40 corners.

2. **Every FORK carries a SPUR** — a free end exactly one hex edge from the junction. This
   is the load-bearing prediction: if it holds, a fork is a wall byte sticking out of the
   corner into nothing, and no reader can be blamed for describing a wall that is there.

3. **LEAK ⟺ a GAP, exactly.** 7 leak, all 7 carry a gap, none leaks without one. A fork
   adds a mark, so it cannot open an enclosure.

4. **OVER-4 DESCRIPTIONS ⟺ a FORK, exactly.** 17 over four, all with a fork. A gap splits
   the marking into separate chains and `8 × 3` already shows that reads as four walls.

5. **`twice-claimed` is 0 nearly everywhere.** `@HB-X36`'s *a corner edge is claimed exactly
   once* is a rule about a form's side runs; for linework I expect the two runs to abut at a
   vertex rather than to share an edge, so `alone - union` should be 0 and a fused corner is
   not two runs both claiming one mark.

## What each outcome would mean

| if | then the fix is |
|---|---|
| 2 and 3 and 4 all hold | ⛔ **the stamp, both halves** — a gap is a wall MISSING and a fork is a wall INVENTED, and the reader is faithful to a world that is wrong in two directions |
| 2 fails — a fork has no spur | the fork is a topology artefact, not a stray byte, and the reader may legitimately be asked to join |
| 3 fails — something leaks with no gap | the leak is not the corner at all and `B1`'s premise is wrong |
| 4 fails — something is over-described with no fork | the cut is still in play and the corner is not the whole story |

⚠ **A prediction that everything lines up is the one to distrust**, which is why the row
for each failure is written above rather than after.

---

# Prediction 2 — the corner rule, written before it ran

The first table says the corner edge is claimed **twice** or **never**, so the rule is
`@HB-X36`'s own sentence applied to linework: *claimed exactly once*. Prototyped at the
corner (which is what a gesture knows) rather than over the marking (which would prune a
`T`'s stem whole).

| | expected |
|---|---|
| edges dropped | **30** — one per fork corner, and `twice-claimed` already equals `spurs` in every row |
| edges added | **10** — one per gap corner |
| rectangles that leak afterwards | **0** |
| rectangles described over four afterwards | **0** |
| rectangles that are four walls round a closed room | **23 of 25** |

⚠ **The two that should NOT close are `6 × 3` and `6 × 6`** — `B4x` measured their broken
partner two hex edges away rather than one, so neither branch of the rule fires there. That
is a result to report, not a failure to paper over with a second edge of reach.

⚠ **The risk this prototype carries**: dropping the doubly-claimed edge is justified by the
degree table, not by a picture. If a dropped edge turns out to be load-bearing the flood
will say so — a rectangle that was `closed` before and leaks after is the sabotage this
experiment runs on itself.
