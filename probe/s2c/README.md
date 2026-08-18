# `probe/s2c` — the same script, with and without a server

Plan 22 `S2c`. Measured 2026-08-18.

> **The claim under test:** *the same `.keys` file builds the same world whether it runs
> headless or over the socket.* It is `S7`'s claim and `make headless-same`'s reason for
> existing — and for the opening family it was **false**.

## What was found

`src/editor_server.loft`'s `36:` handler was a **second body** of
`hex_editor::session_open_kind`. `S2a` moved the *choosing* into the library — the
tens-and-twenties reading, the projection onto the wall, the four profile branches — and
left the **assembly** at the socket:

```
open_ahead(wld, author, DOOR_MAT, 1)     ← ONE edge, at the author's own cell
opening_make(…, HEIGHT_SCALE)            ← …and only then the shape
```

which is the order `D1a.2` reversed on the other side, with the one-edge width it
replaced. So a door cut over the wire marked whatever edge came first in direction
order, and a door cut headless marked every edge the opening's own width covers.

**Eight live scripts cut an opening. Five of them built different worlds:**

| script | headless | served | |
|---|---|---|---|
| `house` | 2 | 2 | agreed |
| `door` | 3 | **2** | |
| `opening` | 3 | **2** | |
| `niche` | 6 | **3** | half the edges |
| `embrasure` | 2 | **3** | the server opened one **more** |
| `profiles` | 6 | **4** | |
| `annex` | 1 | 1 | agreed |
| `furnish` | 1 | 1 | agreed |

⚠ **The three that agreed are why a sample would have reported the defect as absent.**
Their walls come from `place_house`, whose `footprint_walls` runs sit exactly on the
edges they stamp, so the projection and the direction-order search land on the same
edge. The five that diverged open into a `verb run` wall, whose centreline is **not** on
its own edges — `open_span`'s own note measures that at 0.866 against a half of 0.65.

⚠ **`embrasure` diverges in the OTHER DIRECTION, and that is the informative row.** The
server wrote the store *before* it knew whether the shape was refused, so a refused
embrasure had already turned a wall edge into a door. `session_open_kind` decides the
shape first precisely so that "a refusal at either half leaves nothing behind".

## The instrument, and the two ways it was wrong first

**1. `world_key` cannot be the instrument.** `editor_run` seeds a patch of `SURFACE_MAT`
and the server seeds none (`E1γ` — absence is the floor), so the two worlds differ before
a gesture is performed. That is why `make headless-same` compares one *sentence*, and
that sentence is `verb place`'s — which is how the openings went unlooked-at.
`GROUND=0` starts the runner where the server starts, and then the whole world is
comparable to the byte.

**2. ⛔ The first control was `WALL_MAT` alone, and it looked right.** An opening does not
*add* a boundary byte, it **converts** one — `wall_set` replaces the material on the edge
it opens — so a driver that opens more edges has correspondingly fewer walls, and a
wall-only control reported *the two drivers built different houses* on exactly the rows
it was written to exclude. The invariant both drivers must share is the **boundary
total**: `verb run` and `verb place` stamp it and the opening family only re-labels
within it. It agreed on all eight rows, before the fix and after.

**3. And the hypothesis came from reading, so the first run refuted it.** `house.keys` —
the script the whole tree runs — reports **2 and 2**. Had that been the only fixture,
the finding would have been recorded as *refuted by measurement* and the defect would
have stayed. What made it visible was running **every** script that opens something.

## What the check is now

```
sh probe/s2c/run.sh              # the eight scripts that open anything
sh probe/s2c/run.sh niche        # …or name your own
make probe-s2c                   # the same, from the Makefile
```

**The verdict is the bytes and the diagnosis is the count.** `cmp` on the two `.hxw`
files says *something differs*; only then does `edges.loft` run, to say which boundary
bytes changed hands — a failure that names the gesture instead of starting a bisect.

⚠ It carries a **vacuity guard**: a loop that compared nothing exits 0 without one, and
*no script diverged* is the same sentence a run that never started produces.

## The control

Run at the commit before the fix (`4c4d652`) in a worktree, with the same probe:
**five rows `DIFFER`, three `IDENTICAL`** — the table above. At `HEAD`: **eight
`IDENTICAL`**, and every served count moved to the headless one.
