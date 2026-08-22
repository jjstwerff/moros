# `L1` — can the library read back a wall OUR stamp laid?

**Written before the probe ran.** Plan [24](../../plans/24-one-authority/README.md) `L1`.

`H1` proved `hex_shape::wall_write` → `wall_read_run` round-trips **24 of 24**. That is the
library talking to itself. `L1`'s real question is different and is the one the editor depends on:

> A wall in the world was laid by **`hex_editor::wall_stamp`** — a float halfplane sweep from a
> `WallRun`'s endpoints, snapped by `WALL_SNAP = 2π/24`. Can **`wall_read_run`** recover it?

## Predictions

| # | prediction | confidence | if wrong |
|---|---|---|---|
| **P1** | the control passes — `wall_write` → `edges_around`'s bridge → `wall_read_run` recovers | high | the bridge is wrong and P2 says nothing |
| **P2** | **our stamp mostly does NOT recover** — well under 24 | **high** | `D` and our grid coincide far more than `X31` suggests |
| **P3** | the ones that DO recover are the **even** `d24` — the 12 exact headings, where our nominal 15° grid and `D` agree | medium | the failure is not about the direction set |
| **P4** | the failures are **`ok = false`** (no direction found), not a wrong direction | medium | `wall_read_run` guesses where it should refuse, which would be a defect worth filing |

⚠ **P2 IS THE POINT, AND A FAILURE HERE IS THE RESULT, NOT A PROBLEM.** If our stamp's walls
cannot be read back, that is the measurement that says **`H1` must be wired before `L1` means
anything** — the plan already orders them that way, and this is what turns that ordering from a
guess into a fact.

⚠ **AND THE CONTROL IS LOAD-BEARING.** `edges_around` filters by `wall_stops_walk`, so it carries
a physics predicate the recovery does not care about. If P1 fails, the bridge is the suspect
before the stamp is.
