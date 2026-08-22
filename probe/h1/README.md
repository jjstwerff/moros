# `H1` — `D` is a library table, `L1` is a call, and there is no migration

**Run 2026-08-22.** Plan [24](../../plans/24-one-authority/README.md) `H1`.

```sh
make probe-h1
```

## Three results, and the third is the one that moves the plan

| § | question | answer |
|---|---|---|
| **1** | what *is* `D`? | ✅ **12 exact + 12 at a uniform `1.1021137519860…°`** — `X29`, reproduced here to 13 significant figures |
| **2** | does our `WALL_SNAP` agree with it? | ⚠ **12 of 24** — and they are **different questions**, not two implementations of one |
| **3** | can a run be recovered from the field? | ✅ **24 of 24 round-trip.** `L1` is a **call**, not a library change |

## §1 — `D`, printed from `hex_shape`, not derived

`hex_shape::hexwall` is the domain-B linework library and it holds the table: `D24 = 24`,
`wall_step_k(d)` / `wall_step_m(d)` in doubled coordinates, `wall_is_exact(d)`,
`wall_angle_nominal(d)` against `wall_angle_actual(d)`.

| d24 | step | exact | nominal | actual |
|---|---|---|---|---|
| 0 | `(2,0)` | ✅ | 0° | 0° |
| 1 | `(7,3)` | — | 15° | **13.8979°** |
| 2 | `(3,3)` | ✅ | 30° | 30° |
| 3 | `(5,9)` | — | 45° | **46.1021°** |
| 4 | `(1,3)` | ✅ | 60° | 60° |
| 5 | `(2,12)` | — | 75° | **73.8979°** |
| 6 | `(0,6)` | ✅ | 90° | 90° |

**12 of 24 exact; the in-between twelve carry a bias between `1.1021137519859963` and
`1.102113751986053`** — a spread of `6e-14`, i.e. uniform to floating point. That is `X29`
(*"all twelve share it, spread `0.0000°`"*) measured in this tree.

⚠ **AND `probe/headings` IS DEFINITIVELY NOT THIS.** That enumeration found 24 directions
reachable by a 3-edge run, evenly-ish spaced at 10.893°/19.107°. `D`'s odd members are the
`N = 39` family — `(7,3)`, `(5,9)`, `(2,12)` — a **different set**, chosen upstream by an
exhaustive search for `δ = 0` linking. Guessing the table produced a plausible wrong answer, which
is why the ground rule says adopt it.

## §2 — ours and the library's are not the same function

12 of 24 agree, and the disagreements are not noise:

- **ours** — `snap_heading` — quantises an *angle* onto a `2π/24` grid that has no lattice behind
  it. It cannot be right about where a wall goes, because half its answers name directions that
  do not exist (`X31`).
- **the library's** — `snap_run_d24(a0, b0, tx, ty)` — takes a **triangle-lattice vertex** and a
  **world target point**, and returns *the direction whose best **legal** endpoint lands nearest
  that target*. It accounts for run admissibility (`wall_run_ok`, `wall_min_p`, the `δ` class
  business) that ours knows nothing about.

⚠ **SO `H1` IS A SEMANTIC CHANGE, NOT A SWAP.** Replacing one call with the other changes what the
gesture *means*: from *"round my angle"* to *"give me the nearest run I am allowed to build"*. The
plan's parallel-run step is right to compare what each **stores**, and must expect them to differ
on purpose.

⚠ **AND `hex_editor::wall_stamp` IS A SECOND IMPLEMENTATION OF `hex_shape::wall_write`.** Both
mark the edges a wall crosses; ours works in floats from a `WallRun`'s endpoints via a halfplane,
the library's from a `Wall` (`d24` + origin + half-width) via `wall_separates`. One of them is
ours and should not be.

## §3 — the round trip, and `L1` collapses to a call

```
write:  wall_from_run(d24, a0, b0, p) → wall_write(w, edges, …)
read:   wall_read_run(edges, …) → (d24, a0, b0, p, ok)
result: 24 of 24
```

⚠ **PLAN 24 SAID THIS WAS AN UPSTREAM GAP.** `L1`'s row read: *"§2.2's own note says `rebuild`
returns the turtle form alone, so embedded linework would be silently dropped — so recovery of
world linework from the field is an OPEN UPSTREAM ITEM."* That is true **of `rebuild`**, which is
domain A. It is not true of `hex_shape`, which has had `wall_read_run` all along.

⚠ **AND THE LIBRARY STATES `A0p`'s `P3` ITSELF**, in the function's own comment: *"A-to-B and
B-to-A mark the identical edges. The answer is canonicalised to `p > 0`, so the direction comes
back as `d24` **or** as `d24 + 12` … `read.d == d` is therefore the wrong round-trip assertion;
compare the ENDPOINTS."* Measured here: `d24 0` reads back as `d=12`, and `d24 2` as `d=14`. The
axis-not-direction limit I "predicted" was documented.

## ✅ Open question 4 — there is no migration, and the reason is a defect

The plan assumed walls already stored at a non-representable heading would need migrating.
**Nothing stored carries a heading at all.** Every section, checked:

| format | sections | what they hold |
|---|---|---|
| world | `WTTH`, `GRND` | magic, ground default, and cells |
| part | `WALL`, `OPEN`, `PART` | a wall's *height and surface name*, openings, part meta |

`wr_step` lives only in the live `WallRun`, and **the session record is never saved** — which is
[EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) entry 5, the defect this plan exists to fix.
What *is* stored is edge material bytes, and an edge is lattice-aligned by construction.

⚠ **So the migration does not exist BECAUSE of the bug.** Fix entry 5 first and there is nothing
to migrate; fix `H1` first and there is nothing to migrate either. The order is free, and that is
worth knowing before someone sequences around a constraint that isn't there.

## ⚠ Three fixture errors in one probe, all caught by the library

Worth recording, because the pattern is the ground rule's whole point:

1. passed `(0,0)` as the run anchor — a hex **centre**, not a vertex. `wall_min_p` answered `-1`
   on all 24.
2. passed a **unit direction vector** where `snap_run_d24` wants a **world target point**. Answers
   came back ~300° off.
3. (in `A0q`) expected `surface_heading` to detect a notch, which it cannot by construction.

**Not once did a library silently do the wrong thing.** Each time it refused, or answered a
different question correctly, and the wrong input was mine. That is the argument for calling
libraries rather than reimplementing them, stated in measurements rather than in principle.
