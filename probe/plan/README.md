# `plan` — the plan view, driven

**Rows A–C run 2026-08-26** ([plan 26](../../plans/26-blueprint/README.md) `B3`), **D–F**
the same day (`B4b`).

```sh
make probe-plan
```

## What it asks

| row | question |
|---|---|
| **A** | did the run produce three stations to compare at all |
| **B** | are the three stations *different points* — the control for C |
| **C** | is the marker where the walker is, station by station |
| **D** | does a gesture from a picked spot leave the world standing there would |
| **E** | is a pick a **target** rather than a teleport |
| **F** | does a pick that lands on no panel author **nothing** |

⚠ **C's INSTRUMENT IS THE PICTURE, NOT THE WALKER.** `editor_run`'s `plan` line prints the
marker it parsed back out of the SVG it just wrote. A line that re-printed `wk_x` would
compare the walker against the walker and pass for any drawing at all — measured: with the
marker nailed to `(0,0)`, **station 1 still passes**, because the author really is at the
origin there. That is why there are three stations and why B exists.

⚠ **D CARRIES ITS OWN CONTROL.** Two worlds that were never authored in agree perfectly, so
the row also checks that the fence moved the world off the bare key. Measured: picked and
stood-on both key `32952:2278076870`, against `32952:3318286153` with no fence at all.

⚠ **E IS THE STEP'S INVARIANT.** Clicking a plan to hang a door must not walk the person
across the room, which is why `Author` is a type of its own and not a view of `Walker`.
Seen red with a `walk_place` put back into `run_pick`: *the walker moved across a pick:
`feet 0 at 0,0` then `feet 0 at 0.4,0.2`*.

## ⚠ The box, and a failure that is not this tree's

Three runs of this probe died on `rust-lld: error: unable to find library
-lloft_graphics_native`, with an empty or truncated log. **It is a sibling's loft CI**:
`make rebuild-native-cdylibs` empties and refills `~/.loft/build-cache/graphics-0.8.0/release`,
and every `--lib lib/` link here fails while it does. Nothing to fix and nothing to kill —
the way through is

```sh
LOFT_NO_NATIVE_LIBS=1 LOFT="loft --interpret" sh probe/plan/run.sh
```

which builds every library interpreted. ⚠ **It changes what is exercised**, so a green run
that way is not a claim about the native backend.

✅ Re-run plainly between two of the sibling's rebuilds: green on the native path, inside
`make fast`. The green is a fact about that run, not a promise about the next one.
