# `T1` — the walk tick's probes and its acceptance artifacts

Plan 22 `T1`, [WALK_TICK.md](../../doc/claude/WALK_TICK.md). Every number below was
produced by `sh probe/t1/run.sh <script> <world>`, which builds a native server, drives
it and md5s the world it saved.

## The acceptance: two worlds, byte-identical across the extraction

    sh probe/t1/run.sh probe/t1/deck_full.keys   t1deckfull   -> cea971a07899e420b344c0054567f4e1
    sh probe/t1/run.sh probe/t1/cellar_full.keys t1cellar     -> c96b2ce7a569fa2dd88577a71a507f48

Both are `tools/scripts/*.keys` with one `save` appended, at `rate 0`, so the tick count
is the script's and not the box's (`T0`). They are two scripts rather than one because
they exercise different halves:

| script | what only IT can see |
|---|---|
| `deck_full` | a 90-tick walk with levelling ON — a long walk is where the clock gets into the world |
| `cellar_full` | **four teleports with levelling ON**, and five `feet` stations. `T1` moved the level stamp out of the streaming pass, which changes exactly what a teleport does |

⚠ **The instrument is not blind, and that was checked before it was trusted**: `step 45`
against `step 90` gives `5775ad1d…` against `cea971a0…`, so the save can see the walk.

## Probe 4 — is the collision proxy a cache? **Yes, and `deck.keys` cannot say so**

`coll_pad.keys` is the fixture that can. A walk into a fence ring, over ground that
differs from the frozen level, so the stamped pad carries where the walker STOPPED:

| the proxy's policy | feet | world |
|---|---|---|
| the cache, keyed `(hex, τ, surface)` | 6.05 | `b8d2ef6fcc4a78785c6c655d344ee675` |
| rebuilt on **every** tick | 6.05 | `b8d2ef6fcc4a78785c6c655d344ee675` |
| built once, **never** refreshed | **9.60** | `6a66ef597bdba276eb81645d422c8a82` |

⛔ **Two fixtures were blind before this one, and each was blind for its own reason.**

1. **`deck.keys` answers `cea971a0…` to all three policies.** Nothing in it blocks — no
   wall, no fence, and its cliffs are never met — so the proxy cannot reach the world.
   Read as an answer, its green would have put an unmeasured claim into the design.
2. **A fence on flat ground stops the walk and the world still cannot see it.** The walk
   ends at `6.05` instead of `9.60` and the run saves **0 chunks**: `brush_level` is
   guarded by `cur_h != level_h`, and on ground already at the frozen height that is
   never true. It needs a fence AND a hill, which is what `coll_pad.keys` has.

## The files

| file | what it is |
|---|---|
| `run.sh` | one script, one fresh native server, one md5 |
| `deck_full.keys` | `tools/scripts/deck.keys` + `save` — the first acceptance artifact |
| `cellar_full.keys` | `tools/scripts/cellar.keys` + `save` — the teleport-while-levelling half |
| `coll_pad.keys` | probe 4's instrument: a fence to stop the walk, a hill for the stamp to write |
| `deck_walk.keys` | the walk half of `deck.keys` alone (`13591723909e7ec6a749a01108d166e6`) — kept because it is what showed the acceptance artifact is the WHOLE script, not the walk |
| `coll_walk.keys`, `coll_nofence.keys` | the blind pair from the second bullet above, kept as the record of it: `39c891d9…` with the fence, `2a394fad…` without, and identical under a sabotaged proxy |
