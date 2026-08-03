<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# WIRE_PROTOCOL — the editor's socket, as it stands, with each message's fate

**Why this exists.** None of this was written down. Every acknowledgement string and every
ordering guarantee below was reverse-engineered out of `src/editor_server.loft` (4,238 lines) in
order to de-flake eight gates on 2026-07-30 — and the next person would have paid that cost
again. 28 gates depend on this protocol today.

**Why it carries dispositions.** [`HEX_STACK.md`](HEX_STACK.md) settles that the client derives
meshes from the store (I2) and that the static world is pulled from static blocks (§3). Most of
this protocol therefore disappears. So each row says what becomes of it, and this file doubles
as the migration checklist rather than becoming a second thing to keep in step.

**Frame format.** One text frame per message, `"<id>:<payload>"` client→server and
`"<tag>:<payload>"` server→client. `id` is an integer; `tag` is one uppercase letter. Payload
fields are comma-separated; sub-records are semicolon-separated.

## Disposition key

| | meaning |
|---|---|
| **A** | **authoring command** — survives as a store write. Over a socket only for live co-authoring; a single author writes locally |
| **R** | **read-back** — survives as a *local store query*, not a message. The client holds the store, so there is nothing to ask |
| **D** | **derived delivery** — **disappears** (I2). The receiver derives it from the store instead |
| **V** | **view or input** — moves client-side with the `view` group; never crosses a socket again |
| **X** | **dynamic state** — stays on a socket. This is the residue §3 says a server is actually for |
| **S** | **session plumbing** — survives as transport, whatever the transport becomes |

---

## Client → server

| id | name | payload | acknowledgement | fate |
|---|---|---|---|---|
| `1` | READY | — | the opening burst, then `E:` | **S** |
| `43` | DERIVES | `<0\|1>` — **"I draw the ground myself"** | `S:… derive N of M ground sent S held H` | **K** — the deletion S4 was measuring for |
| `2` | CAM | `<aspect>,` | `C:` immediately, from current state | **V** — and see the ⚠ below: today it doubles as *"resend `T:`/`C:`"* |
| `3` | LOOK | `<dx>,<dy>` | none | **V** |
| `4` | KEYS | `<bitmask>` — `1` forward, `2` back, `4` turn left, `8` turn right | none | **V** — the shipped `input` library owns this |
| `5` | RAISE | `<±1>` | ⚠ **none of its own.** `S:rebuilt` is the only signal | **A** → `raise_at(store, q, r, amp, rad)` |
| `6` | LEVEL | `<0\|1>` | `level true at height N (quantised from V, residual R)` · `level false…` · `level approximated — N cells hit the floor` | **A** |
| `7` | PLACE | `<x>,<z>,<yaw>` | `placed <x>,<z>` | **X** — a character pose is dynamic state, not world |
| `8` | SAVE | `<name>` | `saved N chunks to NAME (code C)` | **A** → publish an immutable versioned snapshot (§6) |
| `9` | LOAD | `<name>` | `loaded N chunks from NAME` · `load refused (C) detail` | **R** → map the store; no whole-world read |
| `10` | ROAD | `<0\|1>` | `road true at grade N (quantised from V, residual R)` · `road false at grade N` | **A** |
| `11` | FIELD | — | `field filled N cells` · `field refused — grew past the cap C without closing` · `field refused — nothing to fill here` | **A** → `flood_outside` + `trace` + `validate` |
| `12` | STOREY | `<±1>` | `storey ±N on N cells` · `storey refused (C) why` | **A** → `combine_cut_level` + `seat_write` |
| `13` | SCATTER | `<species>,<density>` | `scattered N of species S at density D` · `scatter refused — …` | **A** |
| `14` | STENCIL | `<roof_up>` — or `<roof_up>,<part>` for a SAVED part (plan 17 `A2.2`) | `stencil placed N cells, kept B below and A above` · `stencil placed N cells from part 'NAME'` · `stencil refused — …` · `stencil refused — part 'NAME' (C) detail` · `stencil refused — part name 'NAME' leaves data/parts/` · `stencil refused (C) why` | **A** → `stencil_stamp_all` |
| `15` | COLUMN | `<q>,<r>` | `column q,r = <heights>` | **R** |
| `16` | WALLS | `<q>,<r>` | `walls q,r = <three owned edges>` | **R** |
| `17` | CART | `<…>` | `cart travel T value V angle A skid S`, plus a broadcast `cart pose y Y bank B gapl L gapr R` | **X** |
| `18` | TRIGGER | `<name>` | `trigger N at q,r height H bound to NAME` · `trigger N binding NAME is foreign — left alone` | **A** for the anchor; the binding is game state (`L15`) |
| `19` | PROP | `<item>` | `prop I placed at q,r height H (n in this cell)` · `prop refused — …` | **A** |
| `20` | DRESSING | `<q>,<r>` | `dressing q,r = <layer/item pairs>` | **R** |
| `21` | IMPORT | `<path>` | `imported N vertices as mesh M at x,z` · `import refused (C) detail` · `import refused — N imported props is the limit` | **A** — a server-side filesystem read, never a payload |
| `22` | EXPORT | `<path>` | `exported N vertices to PATH` | **A** |
| `23` | FENCE | `<material>,<radius>` | `fenced N edges, M stored outside, radius R material X` · `fence refused — …` | **A** → `hexdisk_into` + `edge_set_mat` |
| `24` | EDGE | `<dir>,<material>` | `edge D of (q,r) = M, stored at (q,r)` · `edge refused — …` · `edge refused — the world declined it (C)` | **A** → `edge_set_mat` |
| `25` | WALL | `<material>` | ⚠ **emits `road …` strings** — `road started at x,z`, then `road laid N cells and M fence edges, cut C, heading H of 24 (snapped, residual R°), length L` | **A** → `snap_run_d24` + `way_stamp` |
| `26` | CELL | `<q>,<r>` | `cell q,r = <material>,<height>` | **R** |
| `27` | TRACE | `<0\|1>` | `trace true/false` | **S** — diagnostics |
| `28` | CAMREST | — | `camera rested B boom D free F pitch P residual A,B` | **V** — added 2026-07-30; see [`HEX_STACK.md`](HEX_STACK.md) and the note below |
| `29` | LABELS | `<q>,<r>` | `labels q,r = <one layer label per layer, bottom-up>` | **R** — added 2026-07-30. The companion to `15` COLUMN: same column, identities instead of heights |
| `30` | STAIR | `<+1\|-1>` | `stair ±1 at q,r height H from S` · `stair refused (C) why` · `stair refused — no cell along the facing` | **A** — added 2026-07-31 → `stair_height` + `surface_set` |
| `H:` | **SUBJECT** — server→client only, no request id. The whole subject line, composed by the server and shown verbatim: `H:world <name> · <MODE> · level ON/off · road ON/off · trace ON/off`. Sent to a client **where it joins the list** on connect, and broadcast **on every accepted change**. ⚠ **Never on a refusal** — that is the one behaviour separating a HUD from an echo of the keystroke, and `tools/gates/world/subject.mjs` is the control. ⚠ FPS is deliberately absent: it is a client fact, and one mixed field would make "the server authored this line" untrue of the whole. Plan 18 `B2` |
| `N:` | **CATALOGUE** — server→client only, sent once where the client joins the list. `N:<kind>\|<name>\|<0\|1>\|<reason>;…` — ⚠ `;` between entries and `\|` within, because a reason is a SENTENCE and a sentence has commas in it. **ONE list, two families** (§C3): materials **derived from `moros_terrain::surfaces()`** so it cannot name a material the renderer cannot draw, and parts from `hex_part::part_list(data/parts/)` so it cannot name one that is not on disk. Neither is a list the server keeps. Plan 18 `B3.2` + `B5.1` |
| `40` | MODE | `<0\|1\|2\|3\|4>` — AUTO, FOLLOW, SNUG, CUTAWAY, EYES | `mode N` · `mode refused — N is not a mode (offer 0, AUTO..4, EYES)` | **V** — added 2026-08-01. AUTO is the default and degrades into SNUG on `sh_room`; ⚠ naming any other mode turns the degradation OFF for good, because a chosen mode never auto-switches. ⚠ It also RE-FENCES the pitch: EYES allows ±1.5 and FOLLOW −0.20, and a mode change is not a look |

⚠ **`14` STENCIL GREW A SECOND FORM RATHER THAN A SECOND MESSAGE**, and the old payload
is untouched: `14:12` still builds a house of that roof height, so
`tools/gates/world/stencil.mjs` did not change — which is itself the claim that the procedural
path was not disturbed. ⚠ **Since `A2.3` it no longer PLACES one, though**: `14:<roof_up>`
generates a part in a scratch world and stamps it, so both forms land through `part_place` and
there is one way for a house to reach the world. The acknowledgement is identical, including
the refusal number — `-10 - CW_*`, which names *which* rule refused rather than merely that
something did. A part is
**named, never pathed**: `21:` IMPORT takes a filesystem path because a kit-bashed `.glb`
genuinely lives anywhere, while a part lives in `data/parts/` by definition and a name is what
`A7.1`'s catalogue will offer. `house/cottage` is a name with a family in it, and a name
containing `..` is refused rather than normalised. ⚠ `roof_up` is still parsed and **fenced**
for the part form and then **ignored** by it — a part's roof is whatever was authored into it,
and an author who asks for an inadmissible roof is owed the refusal even on a message that
would not have used the number.

⚠ **`30` STAIR is the gesture that made an upper storey REACHABLE**, and until it
existed three of this editor's rules could not be tested at all. A storey is 12 height
units and a stride is 4, so every route onto a deck was a cliff — which meant the deck
half of the camera's surface rule, of the road's surface write, and of the walk's own
step test were all "correct by construction". It cuts the cell you are FACING to exactly
one stride above the surface under your feet: it **sets rather than adds**, so it is
idempotent and a held key builds one step, and going up is walking onto what you cut and
cutting again. The step's height comes from the same function the cliff threshold does
(`moros_sim::stair_height`), so *a stair you build is a stair you can climb* needs no
agreement between two constants.

⚠ **`29` LABELS exists because heights cannot show identity.** `15` COLUMN answers
`column 0,10 = 13,25,37,49` both when three cellars were *inserted under* a ground layer that
kept its label and when they were appended and everything was renumbered — the heights are
identical and only the labels differ. Adding the read-back is what turned "the ground keeps its
identity" from an argument into a measurement, and it caught a real defect the same minute: a
first attempt answered **`59,58,…,2` — 34 labels for 4 layers**, because a layer is chunk-wide
while `storey_add` writes a *disc of 19 columns*, so every column inserted its own. **A claim
about the store needs a read-back on the thing claimed, not on its consequences.**

⚠ **`25` WALL answers in `road` vocabulary.** `do_wall` emits `road started` / `road laid` /
`road refused`, which belong to `10` by name. This cost real time: `road.mjs` was written to wait
for `road started` after `10:1`, which never arrives — `10` answers `road true at grade N`. Two
features share one vocabulary and neither owns it. **Do not "fix" the strings without changing
the gates that match them**; record it and let the migration retire both.

## Server → client

| tag | payload | meaning | fate |
|---|---|---|---|
| `M` | `<id>;<flags>;<colour+vertices>` | a mesh. Chunk ids live above the reserved low block; within it, parity selects the surface — `0` ground, `1` road, `2` field, `3` vegetation, `4` roof, `5` wall | **D** |
| `T` | `<id>;<16 floats>` | a transform, column-major | **D** for world meshes; **X** for the figure |
| `C` | `<view 16>;<proj 16>` | camera. ⚠ Everything past the first `;` is parsed as the projection by `editor_client.loft` — **a third field silently blinds the wasm client** | **V** |
| `S` | `<text>` | status: every acknowledgement above | **A**/**R** — becomes a return value, not a message |
| `X` | `<id>` | drop a mesh (streamed out of range) | **D** |
| `V` | `<hideMask>,<ambient>,<lamp>` | ⚠ **per-client** — bit 0 hides the FIGURE, bit *k* hides surface *k*; the ambient the fragment shader mixes against its one light, and the head-lamp's intensity. ⚠ The lamp's POSITION is not on the wire — the client derives it from the view matrix it already holds (`-transpose(R)·t`), so it cannot drift from the camera by a frame or a rounding, and the wire carries only the number that is a decision. Sent on CHANGE, and re-sent to an ARRIVING client (`1` READY resets the sent-key), because a send-on-change that forgets the new tab is a bug | **V** |
| `Z` | `1` / `0` | brackets a batch of mesh traffic. Used by **both** the dirty flush and the streamer | **D** |
| `E` | — | the opening burst is complete; *"tell me your aspect"*. Clients answer `2:<aspect>,` | **S** |
| `G` | `<grass rgb>,<rock rgb>,<from>,<to>` | terrain ramp colours | **V** |
| `F` | `<x>,<y>,<z>,<from>,<to>,<sky rgb>` | fog, centred on the **character**, not the camera | **V** |
| `P` | — | liveness probe, broadcast once a second; its return value is the live client count, which is how a closed tab is detected | **S** |
| `L` | `<cx>,<cz>,<li>,<id>,<kind>,<ver>,<base>;<cells>` | **one terrain layer, whole** — the voxels themselves, the store's own flat encoding. This is the message every `M` is meant to become unnecessary by | **K** — the point of the design |
| `K` | `<cx>,<cz>` | **that chunk is empty, and I am telling you so.** ⚠ Silence is not an answer: inside a cache, "there is nothing there" and "it has not arrived" are the same observation, and only the authority can separate them. Sent for the margin chunks a tile needs but that hold nothing | **K** |
| `Q` | `<cx>,<cz>,<crc>` | the checksum of the ground mesh the server just built for that tile, so the client can derive its own from its cache and prove it is the same one. Answered by `42:` | **A** — it disappears when the client's mesh is trusted rather than compared |
| `D` | `<cx>,<cz>,<li>,<crc>;…` | the digest of the **visible** set — twelve-ish bytes a layer against 8 KB of cells, so it can go every tick where a resend cannot. Answered by `41:` | **K** |

---

## ⚠ A RECEIVER'S PRECONDITION IS THE SENDER'S JOB

The S3 finding, and it generalises past this protocol. The client's mesher reads
**two cells past** every tile it builds (`moros_terrain::MESH_MARGIN`), so a tile is
derivable only once the store chunks its *margin* touches have arrived. Three separate
things had to change before that held, and each looked like someone else's problem:

- **`send_layers` sent the chunk under the tile's ORIGIN only.** A tile near a chunk
  edge needs the chunk before it too. Measured: tiles at `cz = -4` wanted store chunk
  `r = -2`, and no tile in range had its origin there, so it went to nobody.
- **An empty chunk was sent as silence**, which a cache cannot distinguish from a
  chunk in flight — hence `K:`. 36 of 48 verdicts were held forever on chunks the
  *server* did not have either.
- **The comparison ran on arrival**, before the batch that could complete it had
  landed. It belongs at `Z:0`, which is the server's own statement that a batch is
  whole.

`ground 41 bad 7` → `ground 12 bad 0 wait 36` → **`ground 48 bad 0 wait 0`**. The first
step was a guard, the second was the sender honouring it. A guard alone converts a
wrong answer into no answer, which is better and is not the claim.

### And then the ground stops being sent (S4)

`43:1` is the client saying it draws the ground itself, and the server sends it none.
Measured in the gate: **`ground sent 174 held 20`** — twenty ground meshes built and never
put on the wire, while a plain socket in the same session still received all of them.

⚠ **EARNED, NOT DECLARED.** The client sends `43:1` only after four `Q:` agreements with no
disagreement, and `43:0` the moment one fails — so a client that starts meshing wrongly gets
the server's ground back. The worst case is a byte cost, never a hole in the world.

⚠ **PER CLIENT, AND "EVERY CLIENT DERIVES" WAS THE WRONG TEST.** Suppressing only when no
client still needs the ground reads as the safe choice and makes the deletion *unreachable*:
the gate runner is a client and cannot derive anything, so the condition never fires under
the only circumstances anyone measures — `ground sent 154 held 0` is what that looked like.

⚠ **AND A CLIENT MUST BE TRACKED WHERE IT ARRIVES.** `clients` was populated by `2:<aspect>`,
which arrives some time after the connect — 400 ms for the gate runner. Harmless while the
ground was broadcast; the instant it became a per-client send, the whole opening stream went
to nobody and the `terrain` gate read **`n: 0`**. A default aspect is a guess that `2:`
corrects immediately; being absent from the list is not correctable, because the frames
missed are already gone. This is the third time this session that *a guard belongs where the
thing arrives* has been the answer.

⚠ **The oracle asks whether the chunk is KNOWN, not whether it holds ground.** A chunk
known to be empty is an answer: the mesher reads absent cells there and so does the
server, and the two agree.

---

## The ordering guarantees

These are the whole reason a gate can be written without a sleep. Each was established by
measurement, and the cost of not knowing it is named.

1. **The wire is ordered.** Any acknowledgement is a sequencing barrier for everything sent
   before it. This is what lets a read-back stand in for a missing ack — `import.mjs` needs no
   wait at all, because a `dressing` read-back cannot arrive before what the import emitted.
2. **`S:rebuilt N chunks` means the *picture* caught up**, not just the world. It is broadcast
   after the whole `Z:1` … `Z:0` transaction, and **only when `nrebuilt != 0`** — so it is a
   signal, not a heartbeat, and waiting for a rebuild that will not happen is a stall rather
   than a no-op.
3. **A command's ack arrives *before* the flush it triggered.** A placement marks its chunks
   dirty and acks in the same handler, so at the moment `placed` reaches the client the flush is
   necessarily still pending, and the next `rebuilt` is necessarily the one carrying it. **Order
   matters:** `road.mjs` waits for the rebuild *before* toggling road mode off, because after
   the toggle there may be nothing left to wait for.
4. **`T:` is sent only from inside `if moved`; `C:` is sent when the CAMERA changed.** A
   standing character produces no `T:`, so *waiting* for the next one times out. `2:<aspect>,`
   sets `moved`, which is how a fresh transform is **requested**. `occlude.mjs` and `climb.mjs`
   both depend on this.
   ⚠ **`C:` used to be in that block too, and it was a defect.** The boom EASES over the ticks
   *after* the character stops, deliberately — and none of those ticks published anything, so
   the client drew the matrix from the last tick the character happened to move on. Measured
   standing in a 5×4 house: the trace read `dist 1.87`, the room less its skin, while the eye
   the renderer used was **5.317 wu behind the character, outside the walls** — the full boom,
   exactly where the teleport had left it. `C:` now goes out when `cam_dist`, `cam_pitch` or
   `cam_slide` differ from what the last solve left, which is precisely *the drawn camera would
   differ*. It is still silent at rest, so it is a signal and not a heartbeat.
   ⚠ **Second instance of this exact fault in one loop:** `live_clients` was once counted off a
   broadcast inside `if moved`, and a client that sat still was never counted again. `if moved`
   reads like *"if anything changed"* and means *"if the CHARACTER changed"*; anything else that
   evolves per tick has to say so itself.
5. **The streamer's `Z:0` can precede the first `C:`.** So a client must ask *whether* the
   opening batch has closed, not wait for it to close — `terrain.mjs` reported `loaded: false`
   for exactly this reason.
6. **`5:` RAISE has no acknowledgement.** Serialise raises by awaiting `rebuilt` between them;
   two raises in one flush produce one `rebuilt`, and the second wait then hangs.
7. **A raise applies in full before the next message is read.** So when no mesh is being
   measured, the ordered wire is the entire barrier and no wait is needed at all — `stencil.mjs`
   sends eight raises back to back.

## The traps, each one paid for

- **A fixed sleep before a mesh read is a statement about the machine.** `field.mjs` read **0
  vertices on every run** once its guess stopped winning — not intermittently.
- **A tolerance that gates its own solve latches.** `cam_rested = dd < 0.001` also decided
  whether the solve ran, so the boom parked up to 0.001 short *forever*, wherever the ease
  happened to cross. Two runs of one build: `reach 5.324` and `reach 5.299`.
- **Sampling over a fixed window measures the window.** `collide`'s control leg ran to a 6000 ms
  cap, so `free.gone` was distance-in-six-seconds. End a walk for a **named reason** instead.
- **Concluding a reason from where a loop broke lets it lie.** Swapping a distance test for a
  tick budget reported `gone: 12` from a walk of 6.5 wu and stayed green. Derive the reason from
  the measurement.
- **Comparing two derived domains is a bug, not a flake.** `terrain.mjs` compared mesh maxima
  over *different loaded chunk sets* and failed **three runs in four**. Sleeping longer hides it;
  measuring over one domain fixes it.
- **`ack` polling granularity can hide a defect.** A 100 ms poll covers a ~16 ms tick, so a
  raise reading a once-per-tick cell looked correct. Only a probe sending two commands with
  nothing between them exposed it.
- ⚠ **An `ack` CONSUMES the message, and only sees what arrives after it is called.** Two acks
  for one acknowledgement means the second waits out its limit and returns `(no "…")`. This was
  introduced and caught the same hour in `prop.mjs`: an added `await ack('storey')` sat directly
  above the existing `const storey = await ack('storey')`, so `groundMoved` read false on every
  run. **Adding a barrier can break a gate as surely as removing one.**

## Still clock-paced

**Every world gate now waits on the server.** The `world/` suite contains no fixed sleep outside
an `ack` poll loop. What remains is one different class and one file outside the suite:

| gate | why it still counts time | class |
|---|---|---|
| `character/hipskin.mjs`, `keyonly.mjs`, `walk.mjs` | they measure **how many frames arrived in a fixed window** — the counts move by ±1 by construction | **frame-window.** Claims have real headroom (`legRots >= 3` sitting at 38; `>= 3` sitting at 22). Not a wait-before-measuring defect |
| `wip/camera.mjs` | work in progress | not in the suite |

Fixed 2026-07-30, in the order done — the patterns to copy: `field`, `straight`, `import`,
`vegetation`, `persist`, `road`, `stencil`, `occlude`, `climb`, `collide`, `terrain`, then
`cart`, `doorstep`, `prop`, `trigger`, `storey`, `stream`, `level`.

Three of those needed more than an ack substitution, and they are the interesting ones:

- **`stream.mjs`** — a `setInterval` march plus a 4200 ms measurement window. The streamer
  announces *nothing* (it brackets in `Z:1`…`Z:0` but emits no status) and a 6 wu step need not
  cross a chunk boundary, so there is no per-step signal. The barrier is a `2:` request: the
  `C:` it is answered with proves every mesh the streamer emitted beforehand has arrived. Now
  exactly reproducible — `added 492 · dropped 216 · live 276 · peak 312 · liveChunks 46`.
- **`level.mjs`** — `S:placed` is *not* sufficient. Levelling drops its counter-peak from the
  per-tick hex-change block, which `placed` precedes; the `T:` broadcast sits after that block
  in the same tick, so a **fresh transform** is the only correct barrier. Releasing with `6:0`
  sends no status either — it recomputes `py` and sets `moved`, so again the barrier is `T:`.
- **`trigger.mjs`** — *"let the last rebuild settle"* was waiting for a message it could have
  awaited: `triggers_resolve` runs inside the dirty flush, so the `trigger N BROKEN` broadcast
  is the signal.

---

## See also

- [`HEX_STACK.md`](HEX_STACK.md) — the design that decides every fate in the tables above.
- [`../../tools/gates/README.md`](../../tools/gates/README.md) — what the two gate suites are
  allowed to break, and how to run them.
- `src/editor_server.loft` — the implementation. The `MSG_*` constants are at the top; the
  handlers are inline in `main()`.
