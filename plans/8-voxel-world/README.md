# 8 — hex_world: the voxel landscape model

**Issue:** [jjstwerff/moros#8](https://github.com/jjstwerff/moros/issues/8) · `status:active` · `val:F`

The concrete design is **[DESIGN.md](DESIGN.md)**; what fought back is
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

## Phases

Each ends green. The order is not arbitrary — V0 leads because nothing below it can be
enforced until the chokepoint exists.

| # | phase | what lands | verified by |
|---|---|---|---|
| **V0** | **the chokepoint** | resolve whether `map_get_hex` aliases; one column-taking write path; the seven direct `h_height` writes stop | **P13** first — it decides the shape |
| **V1** | the model | `Hex` / `StoredHex` / `Column` / `Chunk`, the routine (DESIGN §3), Guards 1 and 2 | P9, P10, P11 |
| **V2** | the file | header, opaque palette section, chunk directory, chunk I/O, per-chunk CRC | P1, P7, P8 |
| **V3** | sparsity | elision on both axes, maintained on write | P4, P5, P6, P12 |
| **V4** | the editor moves | brush writes voxels; `Peak`, `world_save`, `world_load` **deleted**, not promoted | P2, P3 |
| **V5** | the second consumer | crystal ports; decay becomes a side table | **P14** — the ceiling's real test |
| **V6** | convergence | chunk helpers → `hex_grid`; dirty set → `gridmesh`; `LIBRARY-CANDIDATES` rows 7 and 12 closed | family has no duplicate function |

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
