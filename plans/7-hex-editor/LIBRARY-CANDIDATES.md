# Library candidates — written locally, documented to move later

*(user, 2026-07-25: "write it locally for now, we will hit more of them but document
them to move to libraries later (we probably will develop routines based on them)")*

Everything here lives in `src/editor_server.loft` today and **should not**. Each row is a
routine that is general — another hex-world consumer would need it — but that was written
locally because stopping to extract it would have stalled the rung.

**This file is the record that stops that being a leak.** A local routine nobody wrote down
is a private copy waiting to diverge from the library that eventually does the same job
(`L11`'s whole point: two tables that agree today diverge silently later). A local routine
*with a row here* is a prototype with a known destination.

**How to read the last column.** `hex_*` names are the shipped family
(`../loft-libs-world`); `mesh3d` / `gridmesh` are `../loft-libs-graphics`. A name in
**bold** already exists and the row is a *convergence*, not a new package — those are the
dangerous ones, because a second implementation of something that ships is exactly the
duplication seam rule 5 forbids.

| # | routine | what it does | why it is general | destination |
|---|---|---|---|---|
| 1 | `mat4_rotate_z` | rotation about Z as a `Mat4` | **mesh3d ships `rotate_x` and `rotate_y` and no Z.** Any limb swinging in its plane of travel needs it | **`mesh3d`** — a gap, not a new thing |
| 2 | `corner_heights` | a cell's six corner heights as the mean of the three cells sharing each | the general recipe for a **continuous** hex surface: shared corners mean no gaps and no skirts. Any height-field renderer wants it | **`hex_draw`** |
| 3 | `emit_hex_sloped` | a cell as a six-triangle fan, centre at cell height, rim at corner means, per-vertex normals | the sloped counterpart to `moros_render::emit_hex_surface`, which emits a flat top and no sides — see #9 | **`hex_draw`** |
| 4 | `cell_normal` | surface normal from the height field's **gradient** (least squares over the six neighbours) | normals as a property of the FIELD, not the tessellation — so they are seam-free and independent of how the surface is cut | **`hex_draw`** |
| 5 | `terrain_y` | barycentric sample of *the same triangles that are drawn* | the one-surface rule: mesh and feet must read one derivation or they disagree by a rounding | **`hex_draw`** (beside #3, deliberately) |
| 6 | `terrain_h` + the `(1−(d/R)²)²` falloff | height as a sum of authored peaks | terrain as a sparse authored set with layer-2 derivation — the `L3` shape, and it makes hills blend with nothing to merge | a terrain library (`hex_terrain` is the overland one; this is the *authored* sibling) |
| 7 | `mark_dirty` / `DirtyChunk` / `chunk_within` | mark by (cell, reach); flush once | **`gridmesh` already has `ChunkField` + `field_mark_dirty` / `chunk_is_dirty` / `collect_dirty_inputs`.** Ours is a simpler shape for the same job and should converge, not persist | **`gridmesh`** |
| 8 | the gait — phase from **distance walked** | leg/arm swing derived from travel, never accumulated per frame | the same discipline `hex_body::wheel_value` uses for a rolling wheel; it is what stops feet skating, and it survived the walk speed doubling untouched | a character library (`hex_body` is rigs; this is authored motion, which `SPEC` **L5** puts on the consumer's side — so its own home) |
| 9 | the wall/EdgeSet bridge *(not yet written)* | moros's three wall bytes per cell → an `EdgeSet`, **halo included** | three of six directions store the edge against the *neighbour*, so a loop over occupied cells drops every rim wall — the measured 17-stamped-as-8 bug | **`moros_map`**, then converge with `hex_field`'s `doc_write_edges` |
| 10 | the mesh wire (`mesh_wire`, `mat_wire`) | mesh + matrices as text frames | any server/client renderer split needs it, and text is already the suspected bottleneck — a binary form belongs in a shared place, written once | a scene/protocol library |
| 11 | `world_save` / `world_load` | the authored set to and from a file | **`hex_field` already has `doc_write_all` / `doc_read`** with tagged sections. Ours is local only because peaks are not a field; the moment they are expressible as a section this must converge | **`hex_field`** |

## The rule that keeps this honest

**A row here is a debt, not a licence.** Two things make it stop being one:

1. **Nothing in this list may be copied from a library that already has it.** Rows 1, 7 and 11
   name things that ship. Ours exist because the shipped form did not fit *yet* — not because
   we preferred our own — and each row says which.
2. **When a routine gets a second consumer, it moves.** That is the family's own bar
   (`EDITOR_SUBSTRATE` DoD clause 4: a package extracted against exactly one caller has not
   been shown to be general). Until then, local is the honest place for it.

⚠ **The one that is already a real divergence is #7.** `gridmesh` ships dirty-region tracking
and we wrote a second one. It was the right call under time — ours is ~30 lines against a
`ChunkField` that wants cells registered up front — but it is the row most likely to bite,
because both will grow.
