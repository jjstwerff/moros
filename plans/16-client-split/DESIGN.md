# 16 — The client split: voxels cached and meshed in the client

| | |
|---|---|
| **Status** | **✅ S2 SHIPPED (2026-08-02)** — next is S3 · S1 shipped 2026-07-29 · **`editor.html` DELETED 2026-08-02** · `status:active` |
| **This phase** | voxels on the wire; the client caches them and still draws the SERVER's meshes |
| **Closes when** | for every loaded chunk the client's cached bytes and the server's agree, **by the format's own per-chunk CRC** — and the control (mutate one cell on one side) has been seen red |
| **Deletes** | nothing. S2 is the measurement step, and that is the point of doing it before S3 |

## ✅ `V:` IS PORTED AND THE TWO RENDERERS AGREE (2026-08-02)

The client had **no `V:` handler and no `uAmb`/`uLamp` in its shader**: S1 shipped
2026-07-29 and the five camera modes landed after it, so this was a renderer from
before the camera work rather than a weaker one. Now in: the hide mask (bit 0 the
figure, bit *k* surface *k*, derived from the mesh id — no wire change), the ambient,
the lamp with its inverse-square falloff, and `uEye` taken out of the view matrix.

**One script, both pages** (`tools/script.mjs --client`):

| mode | `editor.html` | wasm | Δ lum |
|---|---|---|---|
| FOLLOW | grass 0.5369, lum 0.4221, sd 0.1031 | grass 0.5231, lum 0.4161, sd 0.1109 | −1.4 % |
| SNUG | masonry 0.4784, lum 0.1827, sd 0.1430 | masonry 0.4386, lum 0.1763, sd 0.1442 | −3.5 % |
| CUTAWAY | masonry 0.4311, lum 0.4241, sd 0.0500 | masonry 0.4348, lum 0.4245, sd 0.0520 | **+0.1 %** |
| EYES | masonry 0.5285, lum 0.2986, sd 0.1138 | masonry 0.5198, lum 0.2944, sd 0.1145 | −1.4 % |

### ⚠ The "25 % darker" was never lighting — it was dead canvas

The first measurement had the wasm client dark at every station, and it looked exactly
like a lighting bug. Two stations settled it, and the point is that they were chosen to
*separate* the paths rather than to confirm a suspicion:

- **sky** passes through no lighting term at all — it is the clear colour;
- **a soffit seen from directly beneath** is one surface, one normal, one colour.

Both were low **by the same factor**, which no lighting fault produces. The tell was in
the shares: `largestShare` read **0.7734 at two completely different stations**, to four
decimals. That is not a render result, it is a fixed fraction of the image —
`0.7734 × 64000 = 49 498`, and `editor.html` samples **49 500**.

The wasm canvas is a fixed `WIN_W × WIN_H` = 1280×800, while the region actually drawn
is the browser VIEWPORT: the window less the ~140 px `<pre>` HUD beneath it. At the
harness's 1200×800 that is 1200×660 inside a 1280×800 canvas — a black L of dead area
on the right and bottom, 22.66 % of every frame, averaged into the mean. Predicted from
the dead fraction alone: 0.4147 and 0.1087. Measured: 0.4181 and 0.1112.

⚠ **The client cannot fix this itself.** `gl_window_width` / `gl_window_height` are not
in the browser's host-import set — calling one is a LinkError at instantiate
(loft-lang/loft#668) — which is *why* the canvas is a constant. The harness sizes the
window so the assumption becomes true (`1280×940`), and says so where the constant is.

### And the wasm side has a real settle now, not a degrade

`settle` interrogates `editor.html`'s own globals; a wasm page has none, so `--client`
first fell back to "the canvas is not blank". **That is what made FOLLOW read `sky
0.995`**: the client draws *nothing* before its first `C:` — deliberately, because every
vertex would otherwise land in one place — so an early shot is the clear colour and
nothing else, at a station pointed at the ground. The page reports itself in its HUD
(`meshes … cameras … parts`), so the same two questions are asked of it, and `waited`
shows it doing real work — 4900 ms on the first frame of the run above.

⚠ **`WS_URL` IS HARDCODED TO PORT 18090**, which is worth knowing before the next
diagnosis: served on any other port the client comes back `meshes 0, cameras 0` with an
empty `[error] Vertex:`, which reads as a shader regression and is a dead socket. It is
also why the wasm client can never join `make gate`, which hands every gate its own port.

✅ **THE CHECKPOINT IS ANSWERED** (2026-08-02, the user): the wasm client is the one, and
`html/editor.html` is deleted. `/` and `/client` both serve the loft client; all 31 gates
drive it with their thresholds untouched.

⚠ **THREE THINGS HAD TO GO FIRST, and each was a real defect the delete surfaced:**

1. **`WS_URL` was a compile-time constant** (`ws://127.0.0.1:18090/ws`), so the client
   could only ever be driven on the default port — `run-gates.sh` hands every gate its
   own from `GATE_PORT_BASE`. It is `/ws` now: the `WebSocket` constructor resolves a
   relative URL against the document, so the browser answers the question the client
   cannot ask. (Patching it server-side was tried and does not work — the string lives
   inside the WASM binary, zero occurrences in the served HTML.)
2. **`WIN_W`x`WIN_H` was 1280x800 against a drawn region of 1200x660** — the browser
   gives the page the window less its ~140px HUD — so 22.66 % of every frame was dead
   canvas. Sized to the region, the sample count is 49,500, which is what the JavaScript
   produced, and the gates keep their thresholds.
3. **The screenshot clip was not clamped to the viewport.** The canvas sits at (-8,-2)
   from the body margin in a 1200x657 viewport, and `captureScreenshot` fills the part of
   a clip lying outside with BLACK — 0.61 % of the frame, which `camera_indoors`' own
   `black 0 0.002` row caught. That row doing its job on the wrong subject.

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

## ✅ S1 DRAWS (2026-07-29)

`src/editor_client.loft` is a 500-line loft program that connects, parses the wire and
renders it. `make client` builds it, the server serves it at **`/client`** beside the
JavaScript at `/`, and `make client-check` is the same headless-browser gate
`editor-check` runs — same claim, two renderers, so a divergence is one green and one
red rather than a picture somebody has to remember. Both are green; the picture matches
(figure, limbs, cart, wheel, height ramp, horizontal fog fading into the sky).
**Control seen red:** skipping every part in the draw loop collapses the canvas from 258
distinct colours to 2.

**It drives, not just draws.** Measured rather than assumed: with no input the counters
freeze (296 meshes, 301 placements, 0 drops, 2 cameras, over 600 frames), and holding `W`
for four seconds moves every one of them — 320 meshes, 715 placements, 48 drops, 80
cameras. The character walked, chunks streamed in and out, the camera re-solved. That is
the whole loop — key → bitmask → `4:` → the server's tick → new frames → the picture.

⚠ **The canvas has to be CLICKED before a key reaches the page.** loft's shell binds
keydown/keyup to the canvas element, not to the window; `editor.html` listened at the
document and needed no click. Nothing in the client can fix it — focus is the host's, and
`--html` exposes none of it. It is the one behaviour difference a person will notice, and
it is why `page_console.mjs --press` focuses the canvas before dispatching.

**`editor.html` is NOT deleted yet.** It is the reference the comparison is made against,
and it is the only one of the two that has had the user's eyes. It goes when S2 has a
second thing to compare, or when the user says so — deleting the control the moment the
new path goes green is how you lose the ability to tell which one changed.

### The scene graph was the wrong altitude, and that is a design correction

This plan said *"map `M:` → a `mesh3d::Mesh`, `T:` → its model matrix, `C:` → the camera"*.
Built that way it would have been slower and wronger. The wire carries a **flat run of 6
floats per vertex** and **two 4×4 matrices** — precisely what `gl_upload_vertices(data, 6)`
and `gl_set_uniform_mat4` take. Going through `mesh3d::Scene` means un-flattening a vertex
run into `Vertex`/`Triangle` records so `mesh_to_floats` can flatten it again, and
inverting a look-at matrix into the position/target pair a `scene::Camera` holds so the
renderer can rebuild the matrix we were handed. The wire speaks GL because the renderer it
was written for was WebGL. The client keeps that, and the shader is ported verbatim.

### What it actually cost: four defects, none of them in the loft code

Every one was invisible at the point of failure, and all four presented as *the same
symptom* — a canvas holding one flat colour.

| # | what | filed |
|---|---|---|
| 1 | `gl_window_width` is not in the browser host-import set; calling it is a **LinkError at instantiate**, not a compile error — the page never runs | [loft#668](https://github.com/loft-lang/loft/issues/668) |
| 2 | browser `gl_create_shader` / `gl_upload_vertices` return an index **starting at 0**, while the doc says 0 means failure. The documented check rejects the first working shader; a `vao == 0` free-slot marker sends all 296 meshes into one slot | [loft#669](https://github.com/loft-lang/loft/issues/669) |
| 3 | **writes through a local captured from a `vector<Struct>` field are silently discarded** — the client had all three of its writes on the losing side, so nothing was ever placed and no slot ever freed | [loft#670](https://github.com/loft-lang/loft/issues/670) |
| 4 | `web`'s `send` DROPS a message on a still-connecting browser socket. A single `send(h, "1:")` after `ws_handler` connects, sends into a closed socket, and waits for ever — the server logs the client as connected and never hears from it | — the retry is the fix, and `send`'s own doc says so |

⚠ **Three of the four are the same shape: a sentinel or a contract that differs between
native and browser, with nothing at the boundary to say so.** `--html` is not a build
flag; it is a second implementation, and a consumer meets its differences one at a time,
each as a blank page. That is the finding S1 was worth, and it is worth carrying into S2:
*every* handle, sentinel and lifecycle assumption should be checked against the shim
rather than against the API doc.

### The instrument that ended it

`tools/page_console.mjs` — loads the page in headless Chrome and prints what it SAID: the
`<pre id="out">` the shell writes `println` into (which the shell HIDES the moment a window
is created), plus every console message, plus `--hook-shaders` to log the source WebGL
actually received and the compile status of each.

`html_render_check.mjs` answers *whether* it drew — one bit and a colour count. When that
bit is 0 it has nothing more to say, and defects 1–4 all set it to 0. Attribution needed a
second instrument, and building it was the step that turned a guessing game into four
measurements. `plans/16-client-split/probe/vector_field_write.loft` is the other half: it
prints the write matrix rather than a verdict, because the useful thing is *where the
boundary runs*.

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

### ✅ S2 — SHIPPED 2026-08-02

`tools/gates/world/cache.mjs` — **`cache agree 24 bad 0 layers 24`**: every terrain
layer the client is streamed, checksummed against the server's by the FILE FORMAT'S
own CRC. ⚠ **Control seen red:** perturbing one cell of one layer in `layer_wire`
gives `agree 23 bad 1` — one layer disagreeing, and exactly one.

`L:<cx>,<cz>,<li>,<id>,<kind>,<ver>,<base>;<cells>` rides the same `Z:` bracket as the
meshes (a rebuild is one transaction; the cache is part of that instant, not something
that catches up after). ~14 KB a layer as CSV against ~1 MB of mesh text it will one
day replace. `hex_world` gained `world_layer_bytes` / `world_put_layer` /
`world_layer_crc` / `world_chunk_base`, with the round trip and the one-cell control
in `layer_wire.loft`.

⚠ **THE DIGEST IS A HEARTBEAT, NOT AN AUDIT, and the first version was subtly
useless.** It went out only when a chunk was dirty — so a client that joined *after*
the last edit was never told anything at all, which is precisely the case a cache
check exists for. It rides the once-a-second liveness probe over the VISIBLE set now,
ahead of any bulk frame, because one WebSocket is FIFO and priority is an ordering
discipline rather than a flag.

⚠ **AND THE CLIENT ANSWERS BACK** (`41:` → `S:cache …`). The client is the only thing
that can compare its own cache, and it is a wasm page — a page that knew and could not
say would leave the claim to a screenshot.

⚠ **`hex_world` LINKS INTO WASM**, which was the open risk and is now measured: the
client is built `--html --lib lib/` and the page went 715 → 774 KB. The client shares
the server's *model*, not its authority.

### S2 — the original design</

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

### S3 — the client derives one surface — **IN PROGRESS**

**Measured after the units were fixed: `ground 41 bad 7`** (was 29/18). S2 re-checked
and still `cache agree 24 bad 0` — which now MEANS something, because both sides agree
what a coordinate is.

### ✅ THE COPY IS CORRECT — `agree 81 bad 0` (2026-08-02)

`probe/s3_copy_mesh.loft`: build a world, copy every layer into a second one exactly as
the client does, mesh 81 tiles from both. **All 81 match.** So
`world_layer_bytes` / `world_put_layer` / `world_chunk_base` reproduce a world exactly,
negative chunks included, and the terrain mesher is a pure function of the cells.

⚠ **THE `agree 3 bad 78` THAT PRECEDED IT WAS THE PROBE, NOT THE CODE.** It copied into
a LOCAL `b` inline in `main`; `world_put_layer(b, …)` left it empty. An empty world
meshes happily at `base + 0`, which is why every vertex came back with the right x and
z and the wrong y — and why `b`'s heights moved when the authored extent changed while
`a`'s did not. Passing `b` through a `&World` parameter is the whole difference:
`probe/s3_copy_narrow.loft` did that from the start and always said `match true`.

⚠ **A DIFFERENCE THAT SURVIVES FOUR HYPOTHESES IS SUSPECT IN ITSELF.** The coordinate
system, the base, the halo and partial chunks were each excluded by a measurement, and
each exclusion was read as "so it must be the next thing" rather than as "so my
instrument may be lying". The tell was there twice: the narrow probe agreed on the very
tile the wide one called its first failure, and `b`'s heights depended on the world's
extent in a way no per-cell copy bug produces.

### ✅ THE CLIENT'S `st.cache` SHAPE IS CORRECT — and the real defect is upstream

`probe/s3_field_mutation.loft` copies one source world three ways:

| destination | chunks | base | cells |
|---|---|---|---|
| through a `&World` parameter | 9 | 9 ✓ | ✓ |
| the caller's local, inline | 9 | 9 ✓ | **✗** |
| a struct field (`h.cache`) — **the client's** | 9 | 9 ✓ | ✓ |

So the client writes its cache correctly, and the wide probe's old failure was
**loft-lang/loft#735**: nested index assignment through a `&` parameter does not reach
a caller's LOCAL — *partially*. The container comes out structurally right (chunks
created, scalar fields set) and only the innermost payload is missing, so nothing
errors and every structural check passes.

⚠ **That partiality is what made it expensive.** A mutation that failed outright would
have shown as an empty world in one line. This one produced terrain with correct x and
z and wrong y — a plausible picture — and cost four rounds of diagnosis, each
excluding a real hypothesis because the instrument reporting them was the thing at
fault. Filed `sev:high` for exactly that reason.

### ✅ IT IS STREAMING ORDER — `probe/s3_stream_order.loft`

Copy a bounded set of chunks, mesh a wider set of tiles, and report per tile BOTH the
verdict and whether its two-cell halo lies inside the cached set:

```
halo inside the cache : agree 81  bad 0      <- no exceptions
halo reaching outside : agree  8  bad 32
```

**A tile whose halo is fully cached always matches.** So the mesher is a pure function
of the cells it reads, and the only way the client differs is by reading cells it does
not have yet — where an absent cell answers `base + 0` instead of a height.

⚠ **AND IT IS ORDER, NOT MEMBERSHIP.** The live failures included tiles whose chunks the
server had certainly sent — `2,-1` needs only (0,−1) and (0,0), and both ride that
tile's own `send_layers`. What it does not have is the chunks belonging to *other*
tiles in the same batch, which arrive later in the stream. So the client is meshing
against a cache that is correct, will be complete, and is not complete YET.

**The fix has a natural home: the `Z:1`/`Z:0` bracket.** A rebuild is already one
transaction to the client — the brackets exist so a chunk cannot appear beside a stale
neighbour — so the ground comparison belongs at `Z:0`, when the batch has landed,
rather than on each `Q:` as it arrives. That is the same discipline as the mesh
staging, applied to the check.

⚠ **AND THE HALO PRECONDITION IS STILL OWED** for the case a batch genuinely does not
cover: mesh a tile only once every store chunk its halo touches is cached, and defer
the rest. `halo_inside` in the probe is that predicate, written and measured.

**S3's remaining question was on the wire side** — `ground 41 bad 7`, seven
tiles all carrying a negative coordinate — and it is now known NOT to be the copy, the
mesher, the coordinates or the halo. What differs there and not here: the client
mutates `st.cache`, a struct FIELD, through the same call. That is the next thing to
put a probe on, and this file is the shape of it.

⚠ **The seven wire-side failures all carry a negative coordinate** — `0,-1` `-1,0` `-1,-1`
`1,-1` `-1,-4` `2,-1` `3,-1`. Two readings are still open and the per-tile report
cannot separate them yet: either these are the genuine HALO cases (a tile whose
one-cell normal halo or two-cell height grid reaches a store chunk the client was
never streamed), or `chunk_of`'s floor division is off by one somewhere on the
negative side — the fourth-and-fifth instance of the class STATE.md already names.
**The next instrument is the one that tells those apart:** report, per failing tile,
whether every store chunk its halo touches is present in the client's cache. If all
are, the halo is innocent and the arithmetic is not.

**Built and measured before that (`ground 29 bad 18`):** The client runs
`moros_terrain::chunk_mesh_mat` — the server's own function — over its voxel cache and
checksums the result against the server's (`Q:` out, `42:` back). 29 tiles of 47
agree; **18 do not**, and it still DRAWS the server's mesh, which is exactly why the
disagreement is a number instead of a hole in the ground.

### ⚠ THE PER-TILE REPORT FOUND IT, AND IT IS NOT THE HALO

Naming the failing tiles instead of counting them answered it in one run. They are
almost all at **negative** chunk coordinates — `0,-1` `0,-2` `0,-3` `0,-4` `-1,0`
`-1,-1` … — with two exceptions at `0,3` and `1,3`, and every one carries a FULL mesh
(`cells 448` = 64 cells × 7 vertices). Not a partial tile, not a rim.

**The two sides disagree about what `cx,cz` means.** The server keys `L:`, `D:` and
`Q:` by **MESH tile** (`CHUNK` = 8): `q0 = cx * CHUNK`. The client consumes them as
**STORE chunks** — `world_put_layer(cache, cx, cz, …)` takes chunk coordinates, and
the digest does `dq = cx * hex_world::CHUNK_W` with `CHUNK_W` = 32. One wire, two
coordinate systems, four times apart.

⚠ **AND IT MEANS S2's GREEN RESULT IS WEAKER THAN IT LOOKED.** `cache agree 24 bad 0`
compared like with like *under the same wrong mapping*, so it proved the transport
round-trips — which is real — but not that the cache lands where it belongs. The tiles
that agree are the ones where the two mappings happen to collide, which for small
non-negative coordinates they do. This is the parity/negative-coordinate class STATE.md
already lists as *"where this codebase breaks"*, arriving a fifth time.

*The fix is to name the unit on the wire and use it on both sides* — and to re-check
S2's claim afterwards, because it has not really been tested yet.

⚠ **THE HALO WAS THE FIRST SUSPECT, and the server's own comment names it — it is
still a real constraint for whoever fixes the coordinates:** *"A chunk's
ground mesh is NOT a function of its own cells alone: `corner_heights` averages every
corner over the THREE cells touching it, and `cell_normal` takes a gradient over SIX
neighbours whose own normals then feed the corner means."* The mesher reads a
one-cell halo for normals and a **two-cell** grid for heights. A client meshing a tile
at the edge of what it has cached reads absent neighbours where the server reads real
ones — same function, different inputs, different vertices.

*So S3 is not done, and the draw-switch and the delete must not happen until it is.*
What the measurement now makes answerable: whether every disagreement is a border
tile. The next step is to say which tiles fail, not how many — a per-tile report
rather than a count, because a count cannot tell a border effect from an arithmetic
one. `moros_terrain::mesh_crc` is fixed-point (`MESH_CRC_SCALE` = 1e6) so it is
already tolerant of backend rounding; this is not that.

✅ **PREREQUISITE DONE (2026-08-02): the mesher is `lib/moros_terrain`.** 300 lines,
its own package, 4 tests. `make gate` 32 green and `make lib-test` 1974 — the meshes
are byte-identical, which those gates would not have been quiet about.

⚠ **IT IS A LEAF, AND THAT IS THE WHOLE DESIGN.** Meshing terrain sits on a seam: it
needs GEOMETRY (`moros_render`) and POLICY (`hex_editor` — `terrain_h`, which layer is
the ground, whether a cell was opened), and nothing else in the tree wants both cones.
Putting it in `moros_render` was tried and reverted: `moros_sim` depends on that, so
it inherited `hex_editor`'s cone and went red on `Cannot redefine 'fabs'` — the name
arriving from `hex_form`, five packages away — then on `seg_len`. A package nobody
else imports cannot do that to anybody, and the numbers say so: `moros_sim` is
untouched at 208.

*(the original prerequisite note follows, kept for its measurements)*

⚠ **PREREQUISITE: `chunk_mesh_mat` MUST MOVE INTO A LIBRARY FIRST.** It lives in
`editor_server.loft`, and S3's claim is that the client runs *the server's own
function, unmodified* — which is only checkable if there is ONE function. Two copies
that agree today are two copies, and not drifting is the whole of the S3 gate.

Measured while attempting it (2026-08-02), so the next attempt does not rediscover it:

- **The cone is contiguous** — `emit_tri`, `grid_h`, `cell_normal_from`, `gh_at`,
  `corner_heights_from`, `emit_hex_sloped`, `chunk_mesh_mat`, `emit_ground_reveal` are
  one 281-line slab. The cut is clean.
- **`moros_render` is the home.** It already owns every primitive needed —
  `hex_to_world`, `hex_corner_world`, `HEIGHT_SCALE`, the mesh types — and adding
  `hex_editor` / `hex_world` to it runs **moros → lavition**, the allowed direction.
  Checked: `hex_editor` does not depend on `moros_render`, so there is no cycle.
- ⚠ **`CHUNK` = 8 IS NOT `CHUNK_W` = 32.** The renderer tiles at 8 because that is
  what a rebuild costs; the store tiles at 32 for windowing and elision. The mesh tile
  belongs to `moros_render` and conflating the two would be silent and severe.
- ⚠ **THE BLOCKER IS THE DEPENDENCY'S BLAST RADIUS, NOT THE MOVE.** Attempted
  2026-08-02 and reverted. The extraction itself works — 32 gates green, meshes
  byte-identical — but `moros_render` needs `hex_editor` (for `terrain_h`,
  `ground_open`, `SURFACE_MAT`), and that drags its whole cone (`hex_form`, `hex_way`,
  `hex_draw`, `hex_shape`, `hex_place`, …) into every consumer of `moros_render`.
  `moros_sim`'s tests went red on `Cannot redefine 'fabs'` (11 files, from
  `hex_form`), and renaming those surfaced `seg_len` next. It cascades.
  **The design question to settle first:** the mesher is GEOMETRY, while `terrain_h`
  / `ground_open` / `SURFACE_MAT` are editor policy. Either the mesher takes them as
  parameters — awkward, since `ground_open` is called per cell inside the loop — or it
  belongs in `hex_editor` with the handful of `moros_render` primitives it needs
  (`hex_to_world`, `hex_corner_world`, `HEIGHT_SCALE`), or in a package of its own.
  Renaming a sibling's test helpers to accommodate the import is the wrong direction
  and was the tell.
- ⚠ **A SECOND SOURCE FILE NEEDS `use <filename>;` IN THE ENTRY FILE**, and its
  `pub fn`s then export under the **package** name, not the module's. `hex_editor.loft`
  line 23 is `use gesture;`, and every caller says `hex_editor::col_has_below` — never
  `gesture::`. Missing that one line is what made the first attempt fail with *Unknown
  function emit_tri* while `moros_render`'s own 167 tests passed: the file compiled and
  nothing imported it. Verified with a probe — a sibling file returning 4242, reached
  as `moros_render::terrain_mesh_probe()`. ⚠ And the visibility is ONE-WAY: the entry
  sees the sibling, never the reverse — so a sibling cannot use the entry's own
  functions, which is why the mesher cannot simply become `terrain_mesh.loft` beside
  `hex_to_world`. `hex_editor` has the same shape: `gesture.loft` is the lower layer.

The move must leave every mesh byte-identical, so the gate for it is the existing 32:
they read the emitted geometry and would not be quiet about a changed triangle.



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
