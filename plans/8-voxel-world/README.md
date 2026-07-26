# 8 — hex_world: the voxel landscape model

**Issue:** [jjstwerff/moros#8](https://github.com/jjstwerff/moros/issues/8) · `status:active` · `val:F`

The **normative contract** — the formal model, its invariants and their proofs — is
**[doc/claude/WORLD_MODEL.md Part II](../../doc/claude/WORLD_MODEL.md)**, outside this plan
because it endures. The concrete design is **[DESIGN.md](DESIGN.md)**; what fought back is
**[STRUGGLES.md](STRUGGLES.md)**; the durable description of the model lives outside this
plan in **[doc/claude/WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md)**.

This file is the *change*: the phases, their order, and how each is verified.

## What changes when this is done

- `hex_world` stops being single-layer cell storage with decay and becomes the multi-layer
  voxel model — columns, layers, per-chunk windowed heights, palette indexes.
- The editor stops storing peaks and summing them at query time; the brush writes voxels.
- `chunk_idx_32` / `hex_idx_32` converge into `hex_grid` from their two current homes.
- The crystal's `c_age` moves to a side table.
- `gridmesh` owns the dirty set; moros's local copy is retired.

## How this is built — beside, not by migration

*(user, 2026-07-26: "It is fine to build concurrent routines first beside the moros ones
(especially when we expect to spin them off in libs) the reason to be inside the same
project is to reuse designs we already did a month ago, not full code reuse")*

**A new package, written fresh against the contract, beside the existing ones.** `moros_map`
is not migrated, re-cut, or refactored into shape — it stays green and in service until the
new one supersedes it.

This settles a question the plan had been circling. Both alternatives were worse:
*building into `moros_map`* meant writing the window, the layer stack, labels and the clock
into a package that also holds spawn records, NPC routines and Moros's definition payloads,
then moving all of it later once it had grown; *re-cutting first* meant mechanical churn on
code that has not yet been through a rung.

**And it removes a compromise rather than deferring one.** `moros_map` is at a *predecessor*
of the contract — chunks keyed `(cx, cy, cz)` with one layer each, no window, no labels, no
clock, and spawn flags packed into two bits of the voxel in violation of `L15`. Building the
contract into it means either carrying those forward or fixing them as a side-quest. Building
beside it means the new package simply does not have them.

**What being in-tree is for.** Not code reuse — *design* reuse. `SCENE_MAP.md`, the stencil
mechanism, the palette and slot-0 rule, the facing clock and the shared document format are a
month of settled decisions, and they are the reason to write this here rather than in a fresh
repository. hexbody's lesson was that leaving too early costs you the back-references, not
that the code had to travel.

## Phases

Each ends green. `moros_map` is untouched until V9.

| # | phase | what lands | verified by |
|---|---|---|---|
| **V1** | the package | `Hex` / `StoredHex` / `Column` / `Chunk`, the routine, the guards — the chokepoint designed in rather than retrofitted | contract §8, one gate per rule, each seen red |
| **V2** | the file | header with every world constant, opaque palette, directory, chunk I/O, per-chunk CRC, `ε > 2θ` checked on open | P1, P7, P8 |
| **V3** | sparsity | elision on both axes, maintained on write | P4, P5, P6, P12 |
| **V4** | change and cache | the edit clock, per-layer versions in the directory, snapshot reads | `T1`, `T2`, `M2`, and `X4` — compaction voids nothing |
| **V5** | many authors | stream merge onto one writer, copy-on-write slots, owner marker | `M1`, `M2`, `X2` |
| **V6** | long-running stores | free lists, size classes, online compaction | `X3`, `X4`, `X5` |
| **V7** | the editor moves | brush writes voxels; `Peak`, `world_save`, `world_load` **deleted** | P2, P3 |
| **V8** | the second consumer | the crystal ports; decay becomes a side table | **P14** — the ceiling's real test |
| **V9** | supersede and converge | `moros_map`'s world half retires; chunk helpers → `hex_grid`; dirty set → `gridmesh` | family has no duplicate function |

**V0 is gone.** It existed to resolve P13 and then retrofit a chokepoint onto `moros_map`'s
seven scattered writes. P13 is answered — the getter returns a **copy**, so the trailing
`map_set_hex` is load-bearing and the chokepoint is real but remembered at seven sites — and
a package written fresh has the column-taking write as its only door from the first line.

## Verification standard

Every guard ships with three things, not one: a **gate**, a **control** (the same assertion
against a case that must fail), and a **mutation** (the guard broken deliberately, which
must turn the gate red). The third is the one usually skipped and the only one that
validates the gate rather than the code.

Probes P1–P14 are tabulated in [DESIGN.md §8](DESIGN.md#8-probes). **P2 and P10** are the
two most easily skipped and the two that catch what nothing else can.

## Extraction

`hex_world` is a sibling library, so the bar applies from day one rather than at the end:
**its gates must pass with the moros tree absent.** Dependency ceiling is loft's stdlib
plus `hex_grid` / `hex_field`.

## Open — needed before V1

DESIGN §9 lists five assumptions. Two want an answer before the format is fixed:

- **A1** — 64 layers per chunk (a `u64` mask). Inferred from "a whole lot of layers".
- **A2** — the headroom value. Named as a header constant, never given a number.
