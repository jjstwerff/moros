# `25` — Dependency versions are coherent, and GATED

**Issue:** [`jjstwerff/moros#25`](https://github.com/jjstwerff/moros/issues/25) ·
**Value:** `S` · **Effort:** `S` (`A1`–`A3` shipped; `B1` is what remains)

## Status

Opened because the `hex_body` upgrade was asked for as a plan. Measured, that upgrade is
**one commit and buys no capability** — what earned a plan is what pulling it exposed:
**three distinct shapes of silent version drift**, each invisible to every gate this tree
has. All three are now fixed and tree-wide skew is **zero**; `A1`–`A3` are shipped. What
is open is `B1`, the guard that would have caught any of them — because today **there is
no version check of any kind**, and all three landed green.

## Goal

A structural guard in `make fast` that fails when the tree's dependency versions are
incoherent: one registry dependency resolves to one version tree-wide, and no lock sits
below its own manifest's declared floor.

## Anchors

- [`doc/claude/HEX_STACK.md`](../../doc/claude/HEX_STACK.md) — the package register
- [`probe/way/README.md`](../../probe/way/README.md) — the `hex_way` arc fixes, and the
  post-publish validator that reported `OK` about the previous release
- `tools/layering.sh` (dependency arrows) and `tools/basenames.sh` (module filenames) —
  the two structural guards this one joins, each written after a defect got through once
- Locks: `loft.lock`, `lib/*/loft.lock`; manifests: `lib/*/loft.toml`

## The three shapes, all measured

| # | shape | what it was | why no gate saw it |
|---|---|---|---|
| 1 | **split lock** | `hex_rig` locked `hex_body` 0.3.0 while `moros_sim` and root locked 0.1.0 — and `moros_sim` **depends on** `hex_rig`. Its 89-test suite ran against a `hex_body` it never shipped against. | a package suite only ever sees its own graph |
| 2 | **lock below its own floor** | `lib/hex_editor/loft.toml` demanded `hex_way >= 0.1.1` — *"the arc fixes"*, in its own comment — while its lock pinned **0.1.0**. `hex_mesh`'s lock was missing four declared deps outright. | nothing compares a lock against its manifest |
| 3 | **fresh lock on a new package** | `hex_rig` was split out of `moros_sim` by plan 19; a **new** package's lock resolves newest-at-the-time (`graphics` 0.5.5) while every existing lock stays pinned (0.5.0). Nobody chose 0.5.5. | the mechanism is invisible, and repeats on every split |

⚠ **Shape 1 was latent, not live** — `hex_rig` calls no post-0.1.0 symbol, so the first
`rig_bone3` in it would have gone green in its own suite and red in the root build.
⚠ **Shape 2 was one arc away from wrong output**: `cut_arb` has 10 call sites here,
`seg_distance` 9, `track_distance` 6. The tree only ever authors arcs with `a0 < a1` in
`[0, 2pi)`, which is the range the one-sided normalisation happens to get right.

## Invariant gate

This plan's surface is exact — a lock file either agrees with its manifest or it does
not — so `B1` states all three parts:

- **Expected result.** On the tree at `a0e9362` and later, `tools/versions.sh` exits 0
  and reports every registry dependency at exactly one version.
- **Invariant.** *One registry dependency, one version, tree-wide* — and *no lock below
  its own manifest's declared floor*.
- **Negative control.** Two seeded worlds must be **refused**, not merely reported: a
  lock edited to a different version of a dep another lock holds (shape 1/3), and a lock
  edited below a `>=` floor its own `loft.toml` declares (shape 2). Both are the exact
  states this tree was in on 2026-08-25, so the fixtures are history, not invention.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A1`** — `hex_body` 0.1.0 → 0.3.1, all three locks | XS | hex_rig 89 · moros_sim 206 · k3d 34 baselines byte-identical | **SHIPPED** `04d5e05` |
| **`A2`** — `hex_way` 0.1.1 where three locks said 0.1.0 | XS | hex_editor 642 · hex_voxel 216 · hex_mesh 72 · `probe/way` ALL ROWS HOLD | **SHIPPED** `820b476` |
| **`A3`** — `graphics` 0.8.0 across all seven locks | XS | six suites unchanged · `make page-check` identical | **SHIPPED** `a0e9362` |
| **`B1`** — `tools/versions.sh`, wired into `make fast` | S | passes clean tree; **red on each seeded skew** | Open |

### Why `B1` is one phase and not two

Both bounds are met by the single step, so splitting it would manufacture the
built-and-never-called state:

- **Upper (safety).** The old path and the new run at once and compare exactly: the
  script's report on today's tree is checked against the skew audit already run by hand
  on 2026-08-25, which found `hex_way` and `graphics` and nothing else.
- **Lower (validity).** It can go red on its own, for a real reason — the two seeded
  fixtures above. ⚠ *Writing the script* and *wiring it into `make fast`* are **not** two
  phases: a guard nobody runs cannot fail, which is this tree's commonest defect.

## Open questions

1. **Should the root declare a `loft.toml`?** It has none — only a transitively resolved
   `loft.lock`. So `hex_body` could not be pinned at the root at all and stayed held back
   there, and `loft update` at the root moved **eleven** packages. Decided by `B1` only
   insofar as the guard must not demand a manifest that does not exist.
2. **`loft update` cannot move one package.** Asked for `hex_body` it also took
   `graphics` 0.5.0 → 0.8.0; every lock edit in `A1`–`A3` needed a block-wise revert of
   the collateral. Worth a loft ticket — but check first whether a targeted flag is
   already planned upstream, per `LOFT_HANDOFF.md`'s scope.
3. **Does the guard belong in `make fast` or beside it?** `make fast` is the cheap loop;
   this check is pure file reading and costs nothing, so `fast` is the presumption. ⚠ But
   note what `fast` already cannot see — it never builds the page — so a green from it is
   not a claim about the browser.
