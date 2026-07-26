# The world model

How a Moros landscape is represented, stored and addressed. This is the **durable
description**; the change that builds it is [plan 8](../../plans/8-voxel-world/README.md),
whose [DESIGN.md](../../plans/8-voxel-world/DESIGN.md) carries the full detail, edge tables
and probes.

> **Status:** designed, not yet built. Sections marked ⏳ describe the target; everything
> else is live today. As each phase of plan 8 ships, its content moves *here* and the plan
> keeps only the closure record.

## The one rule

> Delete every file but the world file and the landscape comes back bit-exact. Delete the
> world file and no amount of derivation brings it back.

Everything else — meshes, normals, colliders, LOD textures, dirty sets — is **derived and
disposable**. Nothing but the world file is authoritative. The second half is the one that
decays quietly: the moment some fact has a second home, two things are true and they
disagree the first time one is rebuilt.

## The voxel — eight bytes

A cell is seven integers: a `u16` height and six `u8`s. **The `u8`s are indexes, never
values** — every name, category and float lives once in a palette table rather than once
per cell. That is the whole reason a cell fits in eight bytes; `wd_thickness: float` alone
would add eight more to every walled hex.

**Index 0 is absence in every table.** A defaulted cell is all zeroes, and that is what an
unwritten cell *is* — so slot 0 cannot be a real definition. Getting this wrong does not
crash; it makes empty space render as whatever material was defined first.

`L13` makes the voxel the **ceiling on permanent world state**. Anything that changes every
tick — age, wear, occupancy — is not a cell field; it belongs in a side table (`L14`).

## ⏳ Columns, layers and chunks

- A **layer** is a heightfield: one surface per hex, 32 × 32 hexes, 8 KB.
- **Layer indexes are absolute from the bottom.** Layer 0 is the deepest anything gets —
  seabed, lowest dungeon floor. No negative coordinate exists in the format.
- Layers **must not fold**: consecutive occupied layers of a column keep
  `height(lo) + headroom ≤ height(hi)`. Two surfaces in one space has no answer to which
  you stand on, so it is refused at the write.
- A **chunk** is a `(cx, cz)` tile holding a base height and up to 64 layers, of which only
  used ones are stored.
- Heights are **windowed**: `u16` measured from the chunk's base, so the cell's height width
  is decoupled from how tall the world is.

## ⏳ Layer kinds

A layer is **terrain** or **dressing**. Terrain is a dense heightfield that collides and
takes part in non-folding. Dressing places things that **never collide** — seen, not stood
on — and is skipped by both the fold check and the collider.

**Terrain layers are dense and stay dense.** A layer exists only in the tiles whose mask
names it, so a tower's twentieth storey costs 8 KB in the one tile it stands on and one bit
everywhere else. Sparsity lives on the **chunk** axis, which is why structures with many
layers — towers, shafts, dungeon levels — cost what they occupy rather than what they span.

**Layer kind is world-global**, held in the header. A per-chunk kind would let one index be
terrain in one tile and dressing in the next, making the fold check incoherent at the seam.

The world model knows only that the kinds differ and that terrain is dense while dressing
is sparse. *What a dressing layer contains* — records, offsets, `glb` assets, kit-bashing —
belongs to [#14](https://github.com/jjstwerff/moros/issues/14).

**The unit of access is a column, not a cell**, because every rule above is a property of a
column and a routine handing out cells cannot check any of them.

**Heights are absolute in memory and relative on disk.** The window is a storage encoding
that never leaves the storage layer — one addition on read, one subtraction on write. This
is what makes chunk seams stitch by construction rather than by every caller remembering.

## Addressing

Axial `(q, r)` throughout, per the family's `CONVERGENCE.md`: **axial is the storage and
interchange convention, odd-r is authoring and presentation**, and `hex_grid` owns the
bridge between them.

## Where it lives

| concern | package |
|---|---|
| cells, columns, chunks, the window, the routine, the file | `hex_world` |
| lattice geometry, conventions, the odd-r ↔ axial bridge | `hex_grid` |
| bounded portable documents and stencils | `hex_field` |
| collision as an edge set | `hex_edge` |
| grid → mesh, dirty rebuilds, LOD | `gridmesh` |
| overland generation | `hex_terrain` |
| what a material *means* | the consumer — moros |

**`hex_world` owns nothing that draws, collides or generates.** The line that decides every
case: the library owns *how a thing attaches to geometry*, never the payload. The day it
knows what a stair is, it has stopped being a substrate.

The pair most easily confused is `hex_world` and `hex_field`. **A field is a document; a
world is a residence** — bounded, portable, one layer, wider types so each consumer keeps
its own units, versus unbounded, mutable, multi-layer, random access. They convert into
each other, and moros already does that.

## Related

- [Scene map](SCENE_MAP.md) — the scene model built on these cells
- [Editor substrate](EDITOR_SUBSTRATE.md) — the editor family and its seams
- [Data](DATA.md) — every data structure and where it lives
