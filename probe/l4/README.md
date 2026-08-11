# `L4`/`L6.2` — what `hex_voxel` and `hex_world` mean, measured

Plan [19](../../plans/19-lavition-split/README.md). Two packages used to be called `hex_world`:
ours (a voxel column store) and the registry's (a sparse one-cell-per-hex grid, published three
times since 2026-06-14). `L4` settled which keeps the name — **theirs**, because they have
published and loft's own test suite consumes them, so theirs is the rename that cannot be done.
`L6.2` carried ours out: the package is **`hex_voxel`**, and its `World` and `Chunk` went with it
as **`VoxelWorld`** and **`VoxelChunk`**.

```sh
probe/l4/run.sh          # exit 0 = all eight behaved as L6.2 left them
```

⚠ **IT NO LONGER STAGES ANYTHING.** Until `L6.2` this runner copied `lib/hex_world` into a
`mktemp -d` under the name `hex_voxel`, to rehearse the rename for the price of a `cp`. The
rename has landed, so `lib/` carries `hex_voxel` and carries **no `hex_world` at all** — which
makes `--lib lib/` the two-lineage graph the staging was faking. It writes nothing inside the
repo and nothing inside `../loft-libs-world`.

| | what it shows |
|---|---|
| `A`/`B` | `hex_voxel` is **ours and only ours**: it resolves out of `lib/`, and the registry has never heard of it |
| `C`/`D` | `hex_world` is **theirs and only theirs** — with `--lib lib/` *and* without. `D` is the one line here that changed at `L6.2`, and it is the rename's own proof |
| `E` | the two are **co-installable** — both lineages in one graph, exit 0, no diagnostic |
| `F` | the two world types are **distinct, and the compiler now says so in words a reader can act on**: `expected VoxelWorld, got World` |
| `G`/`H` | a **bare** `Chunk { … }` compiles at **both** import orders and means the same thing both times, because only one package declares `Chunk` now |

## The three things that flipped, and why each flip is a fix

⚠ **`D` IS THE DELIVERABLE.** `loft --lib lib/ probe/l4/theirs_api.loft` used to fail with
`Unknown function world_empty`, because `hex_world` resolved to **ours** out of `lib/`. It now
builds their world. One name, one package, whatever the flags say — that is the whole of what
`L6.2` bought, and it is visible in one command.

⚠ **`G`/`H` HAVE NOW FLIPPED TWICE, AND THE SEQUENCE IS THE FINDING.** On 2026-08-06 a bare
literal bound silently to whichever package was `use`d **first** — same file, imports swapped,
opposite meaning, no ambiguity error, filed as
[loft#788](https://github.com/loft-lang/loft/issues/788). On 2026-08-07 loft 2026.8.0 refused it
at both orders and named the two packages. Since `L6.2` there is nothing left to decide: ours is
`VoxelChunk`, so the literal is unambiguous and simply compiles. **If these two ever disagree
again, the order decides again and #788 is back.**

⚠ **`F` HAD TO CHANGE DIRECTION TO KEEP MEASURING ANYTHING.** It used to hand OUR world to THEIR
`cell_count`. That reading is gone: `cell_count` is a *method* on their `World`, ours is
`VoxelWorld`, so it is not a candidate and the compiler answers `Unknown function cell_count` —
true, and silent about whether the types merged. Handing **theirs** to **our** free function keeps
both types in one diagnostic, and that diagnostic is the improvement: `expected VoxelWorld, got
World`, where it read `expected World, got World` before — the `Surface` sentence of `L1`,
verbatim. **A control can keep passing while quietly ceasing to test its subject.**

## ⚠ The claim this probe left open, now measured — and the answer was *not* "safe to leave"

This file used to end: *renaming our `World` and `Chunk` is **not required**, which `F` says —
and* not required *and* safe to leave *are different claims, and only the first was measured.*

**The second is measured now, and it refutes the comfortable reading.** Both packages declare
`world_save`. Ours is a free function `world_save(w, path, palette)`; theirs is a **method**,
`world_save(self: World, path)`. In a graph holding both, a bare call to ours is shadowed by
theirs — selected by the *receiver struct's name* — and the diagnostic is
`Too many parameters for t_5World_world_save`, naming an internal mangled symbol, or at the
matching arity `expected World, got World` again. loft's ambiguity check covers struct-vs-struct
and function-vs-function, and misses exactly this pair; filed as
[loft#850](https://github.com/loft-lang/loft/issues/850) with a two-package repro and its control.

⚠ **So the struct rename was load-bearing, not tidiness** — it is what stops a consumer that
imports both from being told its own function has the wrong arity. It never miscompiled: the two
types never merge, so this class is always a compile error and never a silent wrong result. What
it cost was diagnosis time, which is the currency these probes are written in.

⚠ **THE RUNNER OWNS THE EXPECTATIONS, and its first version was wrong in the way it exists to
catch.** It passed `--lib lib/` where it should not have, so `F` never had both lineages present
— it failed for a different reason and reported PASS. Every control checks the **words** as well
as the exit code, because an expected error is still an instrument reading, and a reading nobody
looks at is how a probe reports on a case it never ran.
