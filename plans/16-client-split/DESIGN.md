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

### S0 — reconnaissance, done 2026-07-29

**S1 is a port, not a research project.** `loft --html` produces a self-contained browser
page with a **WebGL2 canvas, keyboard and mouse**, and — the make-or-break question —
**WebSocket works in the browser target** through the `web` library. That is the editor's
exact transport, so the client can speak the wire it already speaks.

Two constraints that shape the client, both from loft's `WEB_APPS.md`:

- **`--html`, never `--native-wasm`.** The latter is the headless WASI build: ~4× larger,
  needs `wasmtime`, and does not run in a browser at all.
- **No HTTP client in the browser** — `web`'s `http_get`/`http_post` are native-only, and
  WebSocket is the only browser transport. The editor serves its page over HTTP and then
  talks WS, so this costs nothing here; it would matter for anything that wanted to fetch.

## The structure to copy: loft's crystal audience demo

`../loft/tools/audience-demo/` has already solved this shape, and the editor borrowed half
of it without taking the rest — `editor_server.loft` says *"same shape as the audience
demo's `single_port_server.loft`"*. The half not yet taken is the CLIENT.

| audience demo | what it is | the editor's equivalent |
|---|---|---|
| `dev_server.loft` | single port: HTTP `/` + WS `/ws` from one process, **re-reading the page from disk every request** | `editor_server.loft` — already this |
| `server.loft` | the multi-client world server, WS only, holds the world, broadcasts changes, **replays current state to new connections** | the world half after the split |
| `projector.loft` | a **client program that dials the server** — its render loop IS the connector tick, one `on_tick` = one frame, deltas arrive by `on_event` | `src/editor_client.loft`, built `--html` |
| `server_kernel.loft` | the kernel the client pairs with | `hex_world` + the authoring routines |

**Three things to take, not just the layout:**

1. **The client is a separate PROGRAM that dials in**, not a page the server prints. So
   `src/editor_client.loft` compiled with `--html`, served by the single-port server that
   already exists. It also means the client can be run against a server on another machine
   without changing either — which is the remote case that made the camera's latency a
   requirement rather than a preference.
2. **One `on_tick` is one frame.** The demo's render loop is the connector's tick, so the
   client's frame rate is the client's business. That settles S5's shape before S5: the
   camera solves in the frame that draws it, and the server's 30 Hz stops being anything
   the viewer can feel.
3. **A snapshot re-request heals the world.** The projector survives a server restart
   mid-show by asking for the state again. That is the answer to this plan's named risk —
   a stale cache — and to a client joining: `world_snapshot` (`M2`) on connect, deltas
   after, and the digest heartbeat to notice when the two have drifted. Reconnection is not
   a special case; it is the same request the first connection makes.

⚠ Worth checking rather than assuming: the projector uses `engine_host::run_client` for
"auto-hello, keepalives, zero transport code", and the browser target has WebSocket only.
Whether that connector reaches `--html` is the first question S1 asks — if it does not, the
client speaks the editor's existing wire directly, which is a smaller step anyway.

### S1 — a wasm client that is loft at all

`src/editor_client.loft` — built `--html`, served by the server that already serves
`editor.html`. It connects, receives today's mesh frames and draws them. **It replaces the
JavaScript renderer and nothing else** — same wire, same frames, same picture.

*Done when:* the browser gates pass against the wasm client exactly as against `editor.html`.
*Deletes:* nothing yet. `editor.html` stays until S1 is green, then goes.
*Risk:* the whole four-target story (`loft-ship`) meets a real consumer. Expect this step to
cost more than it looks.

**✅ THE `--html` LINK FAILURE IS UNDERSTOOD AND GONE (2026-07-29).** It cost two wrong
diagnoses before the right one, and the wrong ones are kept here because both were reached
by *reading* and both survived until something was measured.

The symptom, from `loft --html src/editor_client.loft`:

```
loft: --html: [wasm.bridge] declared `crate = "web-wasm"` but
      ~/.loft/lib/web/wasm/src/lib.rs is missing — skipping bridge link
error[E0433]: cannot find module or crate `web_wasm` in this scope
```

| # | the diagnosis | what killed it |
|---|---|---|
| 1 | "the published 0.3.2 tarball omits `wasm/`" | `tar tzf web-0.3.2.tar.gz` lists `wasm/host.js`, `wasm/Cargo.toml`, `wasm/src/lib.rs` — and the file's sha256 matches the registry entry byte for byte |
| 2 | "0.3.3 was never published, so cut the release" | the live index has 0.3.3, published 2026-07-28T16:34Z — *before* the diagnosis. Our `../loft-registry` checkout was stale |
| 3 | **`loft install <dir>` drops `wasm/`, and that copy shadows the registry's** | moving `~/.loft/lib/web` aside made `--html` link with no flag, no publish, no edit |

`install_package` copies `loft.toml`, `src/*.loft`, `tests/` and `native/` — a whitelist
that has no `wasm/` in it — and `~/.loft/lib/<name>` is searched *before* the registry
cache. So a local install of a bridged library replaces a complete package with an
incomplete one and the error points at the library. Filed as
[loft#667](https://github.com/loft-lang/loft/issues/667); it is the second instance of a
class that function's own comment says it closed once already, for `native/`.

`make client` therefore carries **no `--lib` flag** and resolves `web` 0.3.3 from the
registry: a 484 KB page, 322 KB WASM. **S1 is unblocked**; what remains of it is the
drawing.

⚠ **The lesson is about the instrument, not the package.** Both wrong diagnoses were about
*what someone else had shipped*, and both were reachable without looking at this box. The
thing that settled it was one `mv` — the cheapest probe that could have proved the claim
wrong, and it was available from the first minute.

### S2 — voxels on the wire, meshes still from the server

Add `world → client` chunk-layer frames: `(cx, cz, layer, τ, bytes)`, the same encoding the
file format already writes (`SZ_LAYER` = 1024 cells × 8 bytes + CRC). The client caches them
into its own `World`. **It still draws the server's meshes.**

*Done when:* for every loaded chunk, the client's cached bytes and the server's agree —
compared by the format's own per-chunk CRC, not by a hash we invent.
*Control that must be seen red:* mutate one cell on one side and watch the comparison fail.

**⚠ THE VALIDATION IS SMALL, FREQUENT AND AHEAD OF THE BULK.** It is not a periodic audit
that walks the world; it is a heartbeat that has to stay cheap enough to run all the time:

- **Small.** One frame carries a DIGEST of the visible set — `(chunk key, τ, crc)` per
  chunk, twelve-ish bytes each, a few hundred bytes for a whole draw distance. Never the
  cells themselves. The client answers only about what it disagrees on.
- **High priority means FIRST AND UNBLOCKED.** One WebSocket is FIFO, so priority is not a
  flag — it is an ordering discipline: the digest goes out at the head of the tick, before
  any bulk voxel frame, and **bulk transfers are chunked small enough that a digest never
  waits behind one**. A 200 KB layer burst that delays the heartbeat by a second has
  converted a fast check into a slow one without changing a line of it.
- **Cheap to compute.** `τ` is already maintained per layer (`T1`/`T2`) and the CRC is
  already computed on save, so the common answer — nothing changed — costs a comparison of
  integers the server already has, not a walk over cells.
- **What it buys:** divergence is caught in the tick it happens rather than at the next
  save, which matters because a stale cache's only symptom is an old picture.
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
