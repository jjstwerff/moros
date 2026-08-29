# srcb — does the fast loop see a consumer under `src/` break?

`tools/src-build.sh`, its sweep, and the two measurements that decided its shape.

## The question

`loft test` compiles `lib/` and nothing else. So a change to a **library** can break a
**program** under `src/` with every package suite green — which is what happened on
2026-08-29: a `hex_fit` dependency added to `hex_editor` put a second `HEIGHT_SCALE`
into `src/editor_server.loft`'s graph beside `hex_proj`'s, and the server did not
compile for a session.

## What `make fast` actually compiled, measured

Not what the rule written the same evening said. Of the six programs under `src/`:

| program | compiled by, in `fast` |
|---|---|
| `editor_run.loft` | `probe-k3c`, `probe-t3`, `probe-t4`, `probe-k1`, `probe-k3d`, `probe-headless`, `probe-plan`, `headless-same` |
| `editor_server.loft` | `probe-k1` (wire half), `headless-same` (and `probe-s2c` under it) |
| `part_build.loft` | — |
| `plan_view.loft` | — |
| `prop_build.loft` | — |
| `editor_client.loft` | — (`make page-check`, outside the loop) |

⛔ **So the loop was not blind to the server — it went RED and said the wrong words.**
`probe-k1` printed `FAIL the server never listened`, verbatim the shape CLAUDE.md
documents for the sibling's CI emptying `~/.loft/build-cache` under a `--lib lib/`
link, so it was attributed to the sibling and waited out. ⚠ **The four programs nobody
compiled are the real gap**, and three of them are cheap.

## Compile cost, `loft --dump`, warm, at load 12–28

| program | s |
|---|---|
| `editor_run` | 8 |
| `editor_server` | 10 |
| `part_build` | 4 |
| `plan_view` | 4 |
| `prop_build` | 3 |
| **`editor_client`** | **169** |

⚠ **THE FIRST DUMP OF A SESSION IS NOT THE COST.** Cold, `plan_view` took **118 s** and
`prop_build` **84 s** — `loft` was building a dependency's native cdylib underneath,
with `rustc` at 137 % the whole time. Warm they are 3–4 s. A timing taken once, on a
box shared with a sibling's `cargo`, is a number about the day.

⚠ **AND THAT IS WHY THE CLIENT IS SKIPPED**: 169 s warm is the graphics library, it does
not amortise, and `--dump` would not build it for the target that matters anyway.
`make page-check` builds it as `--html`. The skip list is **explicit and asserted to
exist**, so a program added to `src/` is checked unless somebody names it on purpose —
`tools/layering.sh`'s `moros_*` pattern exempted a package from the one check written to
catch it, for months.

## The sweep — `sh probe/srcb/sweep.sh`

Recorded in [sweep.txt](sweep.txt), every row as predicted:

* **row 0** control, nothing edited → green, 5 programs compile
* **rows 1–5** one program at a time calls a function nobody declares → **red**, and the
  guard **names that file**
* **row N** the same five, each given a valid function instead → **green**
* **row S** the skipped client given the bad function → **green**, the skip is real

⚠ **ROW N IS NOT A FORMALITY.** A guard that goes red on any edit is not seeing the
defect, it is seeing that something changed — plan 26 `B4l` cut a sabotage the package
could not compile and read five red files as the strongest catch in the table.

⚠ **AND THE SWEEP RESTORES FROM COPIES, NEVER `git checkout`** — the subject of a sweep
is uncommitted by definition. It refuses to start on a dirty `src/`, and diffs the tree
against git at the end.

## What the guard cannot do

It is a **compile**, not a run: `--dump` stops after bytecode generation, so it sees
name resolution, types and arity — the whole class above — and nothing that needs the
program to execute. `probe-k1`, `probe-headless` and `headless-same` stay where they
are. One backend, for `run-tests.sh`'s reason: this is the fast loop, not the proof.

## The instrument that reported it, fixed

`probe/k1/run.sh` said `the server never listened` for **two different failures** — the
build died, or the build is slow. ✅ **The PID separates them and the clock cannot**: a
build failure kills the process in seconds. Measured against the real defect put back:

```
  FAIL the server for typo-wire EXITED without listening — it did not build:
       error: `HEIGHT_SCALE` is declared by more than one module here — …
         --> …/src/editor_server.loft:1804:57
```

⚠ **And the four rows after it are guarded on it now.** Before that, the one real
failure was followed by four consequential ones reading captures that were never
written, plus two `grep: No such file` lines — so the diagnostic was **buried under its
own cascade** rather than missing. Same finding, one turn on.
