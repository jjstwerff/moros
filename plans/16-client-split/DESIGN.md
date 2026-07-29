# 16 — The client split: voxels cached and meshed in the client

**The world model stays in the server; the view moves to a wasm/loft client.** The client
caches voxels as they mutate and derives its own meshes; the camera follows. The seam and
its justification are in [EDITOR_SUBSTRATE.md](../../doc/claude/EDITOR_SUBSTRATE.md) — this
is the route, not the argument.

## The order is forced, and that is the useful part

The camera cannot move first. It queries `terrain_y` at 770 samples a tick, so a
client-side camera needs a local height field — which is the voxel cache. And the voxel
cache cannot be trusted until it is *proven* equal to the server's. So:

```
voxels on the wire  →  proven equal  →  meshes derived locally  →  camera follows
```

Each arrow is a step that ships on its own, with the old path still running beside it until
the new one is measured equal. Nothing is switched on faith.

⚠ **And no step leaves scaffolding behind.** Dual-writing was offered once before in this
project and declined (2026-07-26) on the grounds that a temporary path has a habit of
becoming permanent. The difference here: each step's dual path exists *to be compared*, has
a gate that fails when the two disagree, and is deleted in the same commit that proves the
new one. If a step cannot state what it deletes, it is not ready.

## What already exists, and is the reason this is tractable

Not a rewrite — most of the machinery is built and gated:

| need | what serves it | built |
|---|---|---|
| tell the client what changed | the edit clock `τ`, per-layer versions | rung 3, `T1`/`T2` |
| ask "is my copy stale" | `world_is_stale(q, r, built_at)` | rung 3 |
| a consistent instant for a joining client | `world_snapshot` / `snap_world` | `M2` |
| send only what moved | `world_save_incremental` (`X3`) | rung 3 |
| verify a chunk arrived intact | the per-chunk CRC in the file format | rung 1 |
| the same code on both sides | `hex_world` is a library, and the client is loft | — |

**The client can `use hex_world`.** Sharing the code is not sharing the authority: the client
reads, the server owns the clock.

## The steps

### S1 — a wasm client that is loft at all

A wasm/loft client that connects, receives today's mesh frames and draws them. **It replaces
the JavaScript renderer and nothing else** — same wire, same frames, same picture.

*Done when:* the browser gates pass against the wasm client exactly as against `editor.html`.
*Deletes:* nothing yet. `editor.html` stays until S1 is green, then goes.
*Risk:* the whole four-target story (`loft-ship`) meets a real consumer. Expect this step to
cost more than it looks.

### S2 — voxels on the wire, meshes still from the server

Add `world → client` chunk-layer frames: `(cx, cz, layer, τ, bytes)`, the same encoding the
file format already writes (`SZ_LAYER` = 1024 cells × 8 bytes + CRC). The client caches them
into its own `World`. **It still draws the server's meshes.**

*Done when:* for every loaded chunk, the client's cached bytes and the server's agree —
compared by the format's own per-chunk CRC, not by a hash we invent.
*Control that must be seen red:* mutate one cell on one side and watch the comparison fail.
*Deletes:* nothing. This is the measurement step.

### S3 — the client derives one surface

The client runs `chunk_mesh_mat(…, SURFACE_MAT)` — the server's own function, unmodified —
over its cache, and draws that instead of the server's ground mesh. The other five surfaces
still arrive from the server.

*Done when:* the client's ground mesh matches the server's vertex for vertex.
*Why one surface:* if the two disagree, the difference is one traversal, not six.
*Deletes:* the server's ground-mesh broadcast, in the commit that proves the match.

### S4 — the rest of the surfaces, then the mesh path itself

Road, field, vegetation, roof, wall — one commit each, same equality gate. Then delete
`chunk_mesh_*` from the server, the `M:`/`T:`/`X:` frames, the `SURFACES` stride, and the
mesh-id scheme.

*Done when:* the wire carries no geometry. The stream gate's bound becomes chunks-of-voxels.
*What this is worth:* a chunk layer is 8 KB of voxels against six float meshes of the same
region, and the client stops re-receiving geometry it could have derived.

### S5 — the camera

Move `cam_free_dist` / `cam_free_arc` / `cam_pitch_target` / `cam_clear_at` and the boom
into the client, against its own cache. The client applies a drag **immediately** and reports
the resulting FACING; the server keeps the walk.

*Done when:* `occlude.mjs`'s claims hold measured client-side, and a drag produces no server
round trip at all.
*Deletes:* the `C:` camera frame, the per-client aspect tracking, and the last per-viewer
work in the tick.

## What must not move, and the test for it

**Who is allowed to disagree.** Two viewers holding different cameras is fine; two holding
different ground is a corrupted world. So: every write, every `K-FIT` refusal, the edit
clock, persistence and the walk (`L7` — reproducible from an input log) stay in the server.
The client reads a snapshot.

## The two things most likely to go wrong

1. **A stale cache that looks right.** The client draws from its own copy, so a missed
   invalidation is invisible — the picture is simply old. `world_is_stale` is exact and the
   CRC is cheap; a gate should force a divergence and see it caught, at every step, because
   this is the failure that no screenshot reveals.
2. **A second implementation creeping in.** The moment the client "just needs a small local
   version" of a world routine, the split has failed. The client imports `hex_world` and
   `moros_render`; if a routine will not cross, that is a finding about the routine.
