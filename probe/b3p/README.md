# `B3p` — result: ✅ **the library can, ⛔ `walk_tick` cannot be asked**

**Run 2026-08-24.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §3.1 — the unrestricted walk.

```sh
make probe-b3p          # or: loft --interpret --lib lib/ probe/b3p/b3p.loft
```

## The question, and why it is about an API rather than about geometry

§3.1 says the blueprint editor's free movement is

> ⚠ **"THE ABSENCE OF A CALL, NOT A FLAG.** The blueprint editor builds **no** collision
> `EdgeSet` … ⚠ **And it must stay the absence of a call**: a `no_collide` boolean threaded
> through the tick would be the fourth site that decides what a gesture means."

`walk_tick` calls `walk_proxy` **unconditionally** — there is no branch — and `walk_proxy` assigns
`wk.wk_coll` on every rebuild. So the question is not *can a walker cross a wall*. It is **can a
caller of `walk_tick` reach the free state at all**, and the only knob is `reach`.

## What was measured

400 ticks due `+x` into a fence at `x = 4.0`, in the store **and** in the run list.

| | x reached | |
|---|---|---|
| **control — no fence at all** | **42.67773189849706** | ✅ free movement crosses the line, so a stop below is the wall |
| `reach = 8` (the drivers' `COLL_R`) | 3.99 | BLOCKED |
| `reach = 4` | 3.99 | BLOCKED |
| `reach = 2` | 3.99 | BLOCKED |
| `reach = 1` | 3.99 | BLOCKED |
| **`reach = 0`** | **3.99** | **BLOCKED** |
| **`walk_to` with an empty `EdgeSet`** | **42.67773189849706** | ✅ **straight through** |

## The two halves say different things, and running only one would have merged them

✅ **The library expresses it exactly.** `walk_to` handed an empty set covers the no-fence
control's distance **to the last digit** — `42.67773189849706` both times — with the fence still
in the store. Collision is genuinely the **set**, not a rule inside the walk. §3.1's model of the
mechanism is right.

⛔ **`walk_tick` has no way to say it.** `reach = 0` still blocks: `edges_around` scans
`(cr−reach−1)..(cr+reach+2)` — 3×3 cells even at zero — into a 1×1 `EdgeSet` centred on the
walker's own cell, which is the cell whose edge the fence crosses. **Shrinking the proxy never
empties it**, because the walker's own cell is always in it.

⚠ **So §3.1's "it must stay the absence of a call" is not a property the API has today**, and the
sentence should be read as a requirement on work not yet done rather than as a description. The
smallest honest change is **not** the `no_collide` boolean it warns against: `walk_proxy` already
takes `reach`, so a **negative** `reach` — or a `walk_tick` that takes the `EdgeSet` the way
`walk_to` does — keeps the decision in one place. ⚠ **A probe that ran only the tick would have
reported the tick's shape as though it were the library's.**

## ⚠ And `COLL_R` is declared four times now, this probe included

`editor_run.loft`, `editor_server.loft`, `editor_client.loft` (as `LOCAL_COLL_R`) and here — all
**8**, none of them a library constant. The reach a walker collides at is a property of the walk;
it lives in every driver instead. Not this probe's subject, and worth the line on the way past.

## What this does NOT cover

- **One fence, one heading, flat ground.** A cliff is blocked by the same set with `SURF_NONE`,
  so the empty-set result should carry to falls — untested here.
- **The blueprint's own scale.** The walk is at world scale; §3.1 says *"at plan scale"*, and
  nothing here exercises a different `w_unit`.
