# STATE.md — where the editor work stands (2026-07-28)

A handoff. What exists, what was decided, what is open. The durable *architecture* lives in
[EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md); the *changes* live in the tracker
(`gh issue list -R jjstwerff/moros --label plan --state all`). This file is the bridge
between them: read it first after a break.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).

## Since earlier on 2026-07-28 — row 6 is built, and it found four things

**Row 6 (fences and walls, #10) is done** — 6a the exact perimeter, 6b collision, 6c the
camera's occlusion class. **Every numbered rung of the ladder is now built.** 21 gates green
(17 world + 4 character), both `hex_world` probes, 58 `hex_world` tests.

| rung | what | gate |
|---|---|---|
| 6a | the exact perimeter, and the half of it stored outside | `fence.mjs` — 3 mutations red |
| 6b | collision: `hex_edge::sweep_path`, and a doorway is not a wall | `collide.mjs` — 3 mutations red |
| 6c | the camera's class: the predicate the consumer supplies | `occlude.mjs` — the fence clause red |

### The four findings, in the order they cost time

1. **`E1e` — an edge is content.** A hex stores three of its six edges, so half of any
   region's boundary lives in the cells OUTSIDE it — cells that need hold no ground. Elision
   keyed on material dropped those: a layer whose only content was walls was deleted whole,
   silently. Asked before building on it (`hex_world/probe/edgehold.loft`) and fixed at the
   chokepoint — `hex_present`/`stored_present` govern elision and the window; occupancy
   (material) stays what `E1r` asks and `F1` stacks.
2. **⚠ EVERY DISC IN THE EDITOR WAS A SHEARED BLOB.** `moros_map::hex_distance` is the AXIAL
   cube distance and this editor is odd-r OFFSET, so the unqualified name called `(0,0)` and
   its SW neighbour two steps apart. The road's width, the scatter's reach, the storey's
   footprint and the house's outline had all been sheared. No gate could see it because each
   measured the shape the editor drew — `opening.mjs` walked the house ring with the same
   axial formula, so gate and editor agreed *by making the same mistake*. Every
   `hex_distance` in `editor_server.loft` is now `hex_grid::`-qualified; **removing the
   parity-blind copy from `moros_map` is #3's, and it is still exported.**
3. **loft #654 ✅ and #655 ✅ — both filed and both already fixed upstream.** #654: past
   ~32 KB of body the interpreter stopped taking a `while true`'s backward jump, so the pump
   ran ONE pass and the process exited 0 — two `println` lines in the dispatch were enough,
   and *removing two unrelated lines elsewhere* fixed it. #655: a mutated `&boolean`
   parameter panicked codegen while `&integer`/`&float`/`&text` worked. Both **verified
   against the installed binary on both backends**, not taken from the commit messages.
   ⚠ **Both fixes were wider than the reports** — "every loop and branch", and "four sites,
   not the one filed". A reproducer that pins a symptom does not measure the class. The two
   workarounds (handlers out of `main`, a struct for the draft) are kept because they read
   better, no longer because anything forces them.
4. **Collision worked for exactly one tick**, which is indistinguishable from never working.
   Stopping exactly ON the bisector leaves the position ambiguous — `hex_at` rounds to the
   far cell and the next tick starts beyond the wall. The fix is a `SKIN` (stop 1 cm short),
   not a better test: a cell test cannot be made exact at its own boundary. Raised in
   `hex_edge`'s README — **that note is UNCOMMITTED in the shared tree**, like the
   `hex_field` fix below.

### New this rung

`23:<mat>,<rad>` rings the disc you stand in · `24:<dir>,<mat>` sets one edge (which is what
puts a gateway in a fence) · walls draw as a **sixth** chunk surface, and the stride is now a
named `SURFACES` constant on both sides of the wire · a field fill stops at any edge, so
`X70`'s "a doorway is still a boundary" is the difference between a fill of 19 and a refusal
· `F`/`G` in the browser fence and wall the ground you stand on.

## Since 2026-07-27 — rows 8-11 built, and the gates got honest

**Branch `plan/7-hex-editor`.** Working tree clean, everything pushed. ⚠ The remote's
`main` is still at `4ffa03e`; all of this lives on the plan branch. Pushing `main` from
here is a no-op that exits 0 — it looked like a successful push five times before
`git ls-remote` showed the truth. Always verify against the remote, never against `&& echo`.

### What runs

`make play-fast` (interpreted, ~1s) or `make play` (native). One loft process serves the
page and the model channel on port 18090. Multi-client, measured with three concurrent
clients and sequential reconnects.

**Gates: 15 world + 3 character + 56 `hex_world` tests + the sparsity proof.** All green,
each on a freshly started server (`make gate-world`, `make gate-character`,
`make gate-hexworld`, `cd lib/hex_world && loft test`).

| rung | what | gate |
|---|---|---|
| 8a | storeys and cellars — the layer stack end to end | `storey.mjs` |
| 8b | stencils as a BAND, `P1`/`P2` | `stencil.mjs`, `hex_world/tests/stencil.loft` |
| 8c | roofs — derived pitch, own material, own mesh | `stencil.mjs` (eave 61 → mid 65 → ridge 69) |
| 8d | openings — a door is a material, never a cleared edge (`X70`) | `opening.mjs` |
| 8e | the `K-FIT` doorstep — reason, offer, residual; nominal ≠ ordinal | `doorstep.mjs` |
| 9a | trees at density — the forest as a field | `vegetation.mjs` |
| 10a | the cart — three rigs, one frame, a derived roll | `cart.mjs` |
| 10b | props as dressing — `D1` in the editor | `prop.mjs` |
| 10c | glb import/export as a prop | `import.mjs` |
| 11a | anchors — follow, break, or foreign (invariant II) | `trigger.mjs` |

### Rules added to the contract (WORLD_MODEL.md Part II)

- **`E1r`** — absence binds READERS: a column's roof and floor are its topmost and lowest
  **occupied** cells. `cells[0]`/`cells[n-1]` are positions, not the floor and the roof.
- **`P1`** — a stencil writes a BAND, not a column: `[lo, hi]` is replaced, everything
  outside is kept, and a fold against a kept neighbour refuses rather than clips. Under a
  bridge, over a cave, and *the ground layer reforms to the stencil* are one rule.
- **`P2`** — terrain and dressing never mix. The guard is in `check_column`, the only place
  a cell reaches a layer. A terrain write does not touch a dressing layer, **not even to
  blank it**.
- **`D1`** gained a way in — `world_set_dressing` / `world_dressing`. Nothing could create a
  `KIND_DRESSING` layer before, so `P2` guarded a case that could not arise.
- **`K-FIT` invariant I** — every author action ends applied exactly, refused with a reason
  **plus an offer and a residual** (ordinal) or a reason alone (nominal, `X68`), or applied
  as an explicit approximation with its residual on the wire. Every tool is through it.

### New protocol messages

`12` storey · `13` scatter · `14` stencil · `15` column read-back · `16` wall read-back ·
`17` cart · `18` trigger · `19` prop · `20` dressing read-back · `21` glb import ·
`22` glb export. The read-backs exist because **floors, walls and dressing draw nothing** —
without them a gate can see a refusal but not whether anything changed first.

### New library: `lib/glb_read/`

A JSON reader and a glTF 2.0 binary reader (`glb` 0.1.2 is write-only, and nothing in the
registry parses JSON). **Libraries are ours to build and verify — never an upstream ask,
because upstream cannot verify one against the use that needs it.** `LOFT_HANDOFF.md` is
for loft the language and its tooling only.

### Operational lessons that cost real time

1. **Gates measured the machine.** Fixed sleeps encode an assumption about box speed; under
   load a fill's refusal arrived after the gate read "no refusal", and a road ring laid at
   150ms/point LEAKED so the fill correctly refused an open enclosure. Everything now waits
   on what the server SAYS — placements, roads, fills, storeys and **rebuilds** are all
   acknowledged (`S:rebuilt N chunks` is the missing half: the world changes when the load
   is acknowledged, the MESHES follow several ticks later).
2. **`ack` vs volunteered reports.** `ack` only sees messages arriving after it is called —
   right for a reply, wrong for something the world volunteers (the trigger's BROKEN
   notice). Search everything seen so far for those.
3. **A stale compile cache spins at 100%** while printing the banner AND `listening on
   port`. `rm -rf src/.loft/cache`. A `git checkout` round-trip caused it.
4. **`ps %cpu` is a lifetime average** and hid a real measurement behind startup cost. Use a
   `/proc` utime delta.
5. **Four green clauses turned out to measure nothing**, and each time the fix was the
   SCENE, not the assertion: `> 0` on a cave that a whole-column replace still half-filled;
   a pre-flight whose conflict landed on the first column; a dressing clause whose terrain
   write never reached a dressing slot; and the glb reader, where a seeker passes every
   round-trip test against files it wrote.

### Open

- ✅ **THE TICK IS 0% FOR A WATCHING CLIENT WHO IS NOT MOVING** — it was ~100%, all camera.
  Attributed, not guessed — `27:1` turns on a per-second phase trace:

  ```
  TRACE 15 ticks/s: proxy 0ms (0 rebuilds)  camera 1008ms  rest 0ms
        | camera does 11 solves/tick x 14 steps x 5 terrain reads = 770 samples/tick
  ```

  **Both suspects are exonerated**: the collision proxy costs 0 ms and rebuilds 0 times
  (its cell-change/edit-clock test is exact), and the rest of the tick — walk, streaming
  check, publish — is 0 ms. Shrinking the proxy from radius 8 to 2 changed nothing, so it
  is not the EdgeSet copy either.
  The camera's own arithmetic is the answer: `cam_pitch_target` (`CAM_TRIES + 1`) plus
  `cam_free_arc` (`CAM_ARC_N + 1`) is **11 solves a tick**, each walking `CAM_STEPS = 14`
  samples, each sample costing a `terrain_y` **plus the four more inside `cam_clear_at`** —
  770 terrain reads a tick, and every one of them reads a cell and its six neighbours.
  The tick rate is collapsing under it (31 → 15/s), which is why the walk feels heavy.
  **The fix was none of the optimisations that suggested themselves.** A static camera does
  not need solving at all: it is a function of the character's pose, the viewer's pitch and
  the ground, so when none of those has moved and the boom has finished easing, last tick's
  answer is this tick's. Gated on those INPUTS — pose, pitch, and the world's edit clock, so
  raising ground under a standing camera still re-solves, which a "no input for N ms" rule
  would miss — plus a `cam_rested` flag that keeps it solving through the ease afterwards.
  Measured after: **0%**, camera 0 ms, and the tick holds a full 31/s where it had collapsed
  to 15. `occlude`, `terrain`, `climb` and `collide` all still green, which is what says the
  camera still works when something does move.
  ⚠ It is NOT this rung's regression to blame: the 9-point wall-sweep skip was aimed at
  the obvious candidate and was mostly wrong, and the 12.9% on record predates the
  predictive-arc camera.
- ✅ **The idle gate is fixed, and it was a real 76%.** `poll_event` absorbs disconnects
  internally, so `clients` only ever grew and `len(clients) > 0` stayed true for ever once
  one tab had connected; the 30Hz tick then ran for nobody. It gates on what `broadcast`
  reports from the library's own active set now, probed once a second whether or not
  anything moved — the first attempt read the count off the tick's own broadcast, which
  lives inside `if moved`, so an idle client's departure was still never seen. Measured
  0% / 76% / 0%. ⚠ The original "idle 0%" was verified on a server that had never had a
  client — the one state in which the bug cannot appear.
- ⚠ **A gate run against a server that still has another client attached is a FLAKE.** A
  `collide` failure this session was exactly that: a CPU-measurement client was still
  connected, so two clients drove one character. Free the port, or wait, before believing
  a red gate.

- ⚠ **THE TICK COSTS 81% OF A CORE FOR ONE WATCHING CLIENT**, where it was 12.9% at the
  end of rung 11a. Measured with a `/proc` utime delta on an empty world with no walls in
  sight. Skipping the camera's wall sweep when the proxy is empty buys 9 points of it
  (90 → 81) and is kept; the remaining 68 are unexplained. Suspects, in order: the
  collision proxy rebuild (`edges_around` runs twice over a 19×19 window and may be firing
  more often than the cell-change/clock test suggests), and the sixth surface in the chunk
  traversal. **Do not optimise before measuring which** — the 9-point fix above was aimed
  at the obvious candidate and was mostly wrong.
- ✅ **The idle gate is fixed and was a real 76%.** `poll_event` absorbs disconnects
  internally, so `clients` only ever grew and `len(clients) > 0` was true for ever once one
  tab had connected. The tick then ran at 30Hz for nobody. It now gates on what `broadcast`
  reports from the library's own active set, probed once a second whether or not anything
  moved — the first attempt read the count off the tick's own broadcast, which lives inside
  `if moved`, so an idle client's departure was still never seen. Measured 0% / 76% / 0%.
  ⚠ The original "idle 0%" was verified on a server that had never had a client — the one
  state in which the bug cannot appear.

- **#3** ✅ **the axial `hex_distance` is deleted, not fixed.** `hex_grid` already exported
  the right one, so removing moros_map's copy put the correct function in scope under the
  same name and every call site became right without moving. Two implementations of one
  lattice rule was the defect; a corrected second copy would still be one. It took two test
  assertions with it — they had been stating the bug's answers ((1,-1) adjacent, (5,5) ten
  steps) — and the control that separates the conventions is now named as such.
- **The slope tools were drawing a dotted line.** `slope_path` walked its own axial distance
  by lerping q and r INDEPENDENTLY, which on an offset lattice is a line only along the
  axes: measured, a (0,0)→(5,5) run had THREE consecutive pairs that are not neighbours, so
  the ridge it drew had holes in it. All four of its tests were axis-aligned. Now
  `hex_line_at` — an axial lerp rounded by `hex_grid::hex_round` — and
  `moros_map/probe/slopeline.loft` prints the old shape beside the new one on every run.
- **`moros_ui` is GREEN — 46 tests, and `make lib-test` is 499 across five packages.** The
  record of why it was red was stale: not a missing `loft.lock` but two narrowing errors left
  by the 8-byte voxel, in the toolbar's palette selection. Range-checked, then cast.
- **#13** LOD banding and instanced draw.
- **#14** the general multi-rig connector (the cart's is one frame with fixed offsets).
- **#15** the sandbox seam — what a routine may touch. Only *attachment* is built.
- **#8** the crystal port and the convergences.
- **`server`'s blocking wait** — designed in EDITOR_LADDER.md, not built. The idle path is a
  50ms poll because there is nothing to block on; `loft-libs-net` is a shared checkout and
  it wants a session with room for a native rebuild.
- **✋ Checkpoints never walked:** the layer stack (build a tower with a dungeon under it),
  and everything after it. All are gated, none have had your eyes.

## Since 2026-07-25 — the world model, specified AND BUILT to row 4

> ⚠ **Whose work is this?** **Moros is the tabletop RPG.** The universal editor is
> **lavition** — a separate product with its own org, documented in
> `loft/doc/claude/LAVITION.md`. Everything in plans 7–15 builds lavition; Moros is one
> consumer, and its `doc/` is the RPG. Packages therefore take **descriptive `hex_*` names,
> never a brand prefix** — LAVITION.md makes that an explicit anti-rename.

Two things happened that reshape the rest of this file.

**The compact voxel landed.** `Hex` is now `u16` height + six `u8` palette indexes — **8
bytes against 56**. Narrowing it produced 31 compile errors, which was the defect `STATE`
already recorded ("the documented byte widths are not enforced anywhere") finally surfacing.
Public parameters narrowed at the boundary, checked casts inside, and three sites had to
decide what out-of-range *means*: the brushes clamp, `map_read_field` refuses with
`ML_LABEL_TOO_WIDE`, the stencil record mirrors the voxel. The palette became real at the
same time — `map_empty` seeds slot 0 as absence, and `moros_render`'s `palette[i-1]`
off-by-one (a second, hidden encoding of the same rule) is gone.

**The world model is fully specified and not yet built.** It has its own plan
([#8](https://github.com/jjstwerff/moros/issues/8)) and its own normative contract in
**[WORLD_MODEL.md Part II](WORLD_MODEL.md)** — twelve invariants with proofs, a gate and a
named control apiece. What it settles: chunk-local layer stacks, per-chunk windowed heights,
continuity matched by height rather than name, an edit clock for caching, many authors
merging onto one writer, and online compaction that leaves caches valid.

**The editor split into a plan per rung**, because it was far too big for one:
[#9](https://github.com/jjstwerff/moros/issues/9) roads · [#10](https://github.com/jjstwerff/moros/issues/10) fences ·
[#11](https://github.com/jjstwerff/moros/issues/11) fields · [#12](https://github.com/jjstwerff/moros/issues/12) houses ·
[#13](https://github.com/jjstwerff/moros/issues/13) trees · [#14](https://github.com/jjstwerff/moros/issues/14) props and vehicles ·
[#15](https://github.com/jjstwerff/moros/issues/15) routines. The map is
**[EDITOR_LADDER.md](EDITOR_LADDER.md)**.

**The ownership audit ran** over every public name in `lib/moros_*`
([EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md)). The great majority is general editor logic, and
the target shape is **five groups** — `world`, `edit`, `view`, `ui`, `actor` — none of which
is extracted, because extraction waits for battle-testing. The current packages cut *across*
those groups (`moros_sim` alone holds four), which is what makes regrouping the first step
rather than a later tidy-up.

⚠ **The audit found game state inside the voxel.** `hex_spawn_flag` / `hex_waypoint_flag`
read bits 5 and 6 of `h_item_rotation` — a spawn point is `L15` game state and is explicitly
excluded from the world file, yet two bits of the storage of record hold it. Belongs to #8's
V1, and is cheaper to fix before worlds exist.

**`lib/hex_world` exists and the editor runs on it.** Rows 1–4 of
[the order of work](EDITOR_LADDER.md#the-order-of-work) are done:

| | | |
|---|---|---|
| row 1 | the file — header, opaque palette, directory, per-chunk CRC, `ε > 2θ` on open | ✅ |
| row 2 | sparsity — elision on both axes, exact sizes | ✅ |
| row 3 | the edit clock, per-layer versions, a payload-free version scan | ✅ |
| row 4 | **the editor moved onto it** — `Peak` and the local world format deleted | ✅ |

`hex_world` is 29 tests plus `make gate-hexworld`; the editor's seven browser gates all pass
on a fresh server. **Row 5 (roads, #9) is next**, and row 4's checkpoint — build hills, save,
reload, walk — is the user's to judge.

⚠ **Two things row 4 turned up that are worth carrying.** A read path that allocated a whole
`Column` per cell, and a `find_chunk` that scanned every chunk *per cell sample* — together
they made a mesh rebuild O(cells × chunks) and slow enough to reorder the gates. Both fixed
(direct cell read; chunks indexed by a packed key). And the persist gate was **testing a
bug**: it wiped the world by loading a name that did not exist, so a mistyped filename
silently destroyed your work. That is now a named refusal that changes nothing.

## What exists

**Five loft packages, recovered and green.** `lib/moros_{map,editor,render,sim,ui}` —
recovered from loft's history at `ade530c2^`, where they had sat unmoved since June.

| package | tests |
|---|---|
| `moros_map` | 76 |
| `moros_editor` | 56 |
| `moros_render` | 163 |
| `moros_sim` | 148 |
| `moros_ui` | 46 — green since 2026-07-28 |

**499 green, and zero warnings from Moros sources.** `make lib-test` runs them all and was
proven to go red (a gate nobody has seen fail is not a gate) — most recently for real, twice
in one session, catching a wall-drop in the stamp bridge and a double halo in `hex_field`.

**Contributions to the shared library** (`loft-libs-world` `dev`, package `hex_field`, 47
tests): the interchange document format, the stencil mechanism, the authoring `EdgeSet`,
named integer layers, and two committed fixtures both consumers read.

> **One `hex_field` fix is UNCOMMITTED in that tree** (2026-07-22). `stencil_rotate` and
> `stencil_mirror` passed an already-haloed extent into `edgeset_new`, which halos it again —
> so a rotated stencil could never compare `edgeset_equal` to an unrotated one, and carried
> roughly twice the edge storage (a 3×3 room: 375 → 735 bytes over a full turn). Content was
> never lost, only the bookkeeping. `stencil_from` in the same file did it correctly, which is
> what identified it as an oversight rather than a design. 47 library tests and all 485 of
> ours are green on it. **It is crawler's tree too — commit needs a human call.**

## Decisions taken — do not re-litigate

1. **One model.** Moros's dense 8-byte cell and `hex_field`'s parallel arrays do not
   conflict; the cell is *storage and serialisation* over the field model. Probed, not
   argued (#1) — material and height round-trip with zero differences.
2. **The hex convention is pointy-top, odd-r, `L = √3`**, and `hex_grid` owns all lattice
   math. Four implementations already agreed; `SCENE_MAP.md` was the outlier and is
   reconciled.
3. **The format uses tagged sections, not a flags word** — an unknown section is skipped by
   its length, so a newer writer does not break an older reader. Chosen because it can
   *demonstrate* the property; a flags word cannot be tested for it at all.
4. **Heights are `f64`, labels are `i32`** in the format. Our documented `u8`/`u16` widths
   are enforced nowhere — `70000`, `-3` and `300` all round-trip in the live model — so a
   byte-packer built to the spec would silently truncate.
5. **There is ONE edge layer, and the split is over the write POLICY** — not over the
   storage, and not over "who owns `Surfaces`", which was the wrong axis. `hex_field::EdgeSet`
   owns the storage *and* the surface slot; a consumer owns the rule deciding what goes in it.
   `edge_set_surf` writes what it is told, and first-writer-wins is
   `if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site, where a reader can see which
   rule is in force. Crawler's `EdgeCollider` was a temporary rename to break a name collision
   and **no longer exists** — they deleted their edge storage entirely (crawler `2a72763`,
   2026-07-22) and their `collide`/`sweep_path`/`sight_clear` now take an `EdgeSet`.
   *Consequence for us:* the layout is a two-consumer contract now, so it cannot be changed
   unilaterally — and their `edgetest`/`sweeptest` are a second gate on our EdgeSet work.
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.
8. **The twelve are twelve *placements*, and the reflected six land between the rotated six**
   — so the editor offers a twelve-position dial named as hours on a clock, turns and flips
   alternating (`SCENE_EDITOR.md` § stencils). **Never re-derive this from a radial feature.**
   A door in the middle of a wall sits on a mirror axis, collapsing the twelve to six, which
   reads exactly like proof that only six exist. Measured off-axis: twelve distinct cells on
   one ring, zero collisions. Both the claim and the collapse are pinned in
   `moros_map/tests/clock.loft`, the collapse as the negative control.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.

## loft defects — verified 2026-07-27

Every entry re-run against the installed binary rather than taken from a commit message.

**Everything Moros filed is now fixed** — `H5`–`H13`, each re-run against the installed
binary rather than taken from a commit message. `H11` and `H12` closed by loft `58b66993`,
and the workarounds they forced in `hex_world` are removed with the suite green without
them. Only `H4` is unverified, and it was plausibly `H12`'s family, so it may have gone with
it.

**`H13` is fixed and changes how to debug this.** The editor server IS debuggable now, over
`loft debug src/editor_server.loft --rpc --lib lib/` — a breakpoint in the terrain brush,
hit by a browser client pressing a key, with `eval` and `setValue` live at the frame. That
replaces `println` tracing; the recipe is in [LOFT_DEBUGGER.md](LOFT_DEBUGGER.md).

## What to do next

The sequential work list, with the points that need the user rather than a report, is
**[EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work)**. It is the
answer to "what now" — this section is the answer to "what is stuck".

**Row 0 is answered (2026-07-26): one file per world**, with stencils and placeable assets
in separate files. Row 1 is unblocked. ⚠ The consequence to carry: a world is self-contained
for its *landscape* but not for its *dressing*, since a placement is a reference into an
asset library.

## Open work

**#8 — the world model** (`status:active`). Rows 1–4 done; rows 5–9 remain (many authors,
long-running stores, the crystal port, the convergences). **P13 is answered:** `map_get_hex`
returns a **copy**, so the chokepoint is real but *remembered* at seven sites — which is why
`hex_world` was written fresh beside `moros_map` rather than retrofitted onto it.

**The constants are now chosen for the editor's world** and live in `editor_server.loft`:
`u = 0.25`, `ε = 8`, `θ = 3` (so `ε > 2θ` holds with margin), and `ρ = 0` — the floor
reserve earns its keep when buildings arrive at row 8, and reserving space this rung cannot
use would only shift the world up.

**Camera occlusion is a GAME requirement, not an editor nicety.** A camera that
enters geometry fills the whole screen, and for players sensitive to that it makes a
game unplayable rather than untidy — an accessibility requirement, not polish. The
editor's camera now guards it three ways (predictive arc sampling along the turn, a
bounded smoothed pitch lift, a boom that gives way in one tick) with a hard backstop
that the eye is never below the surface. Measured over a full orbit beside a 36 wu
cone: no violation, worst margin +0.385 wu. Free mouse-dragging beside steep hills no longer reaches
the inside-the-world state at all, which is the case the automated check cannot reach (it
teleports, so it tests the backstop and not the prediction). ⚠ The measured margin is
comparable to the measurement's own resolution, so it is *no violation detected*, not
*proven safe* —
and it is terrain only, deliberately (a tree costs a fraction of the frame; a
hillside costs all of it).

**One case the contract cannot express:** a collapse dropping a floor onto the one below
violates `F1`, and refusing a physical event is wrong. The proposed answer — a collapse
*removes* a layer rather than moving it — has not been shown to cover a partial collapse.

**#2 — recovery.** `loft.lock` in `moros_render` / `moros_sim` still pins June resolutions.
`SCENE_EDITOR_PLAN.md` still needs rebasing against what demonstrably exists.

**#3 — one hex convention** (`status:active`). Three things left:
- **Edge field naming.** `wall_n` / `wall_ne` / `wall_se` actually hold **NW / NE / E**; only
  `wall_ne` is right. The ownership table in `SCENE_MAP.md` is correct — trust it over the
  identifiers.
- **`map_set_wall_dir`'s directions 3/4/5** use parity-blind neighbour arithmetic
  (`(q, r+1)`, `(q-1, r+1)`) — the same class as the three parity bugs already fixed. Live
  code, not on the stencil path.
- The **wall midpoint rule** and the **90°-corner argument** in `SCENE_MAP.md` are still the
  flat-top derivation, marked in place. Re-derive on the lattice; do not relabel.
- The **cross-language parity fixture** (`hex_grid`'s tests and our Python tooling asserting
  one file) is not built.

**#5 — stencils** (`status:active`). The mechanism is done, and **facing landed** — a
stencil's placement is an hour on the clock, **twelve of them**: six turns and six flips,
the flips landing between the turns and never coinciding. Derived from the lattice rather
than declared (`moros_map/tests/clock.loft`, `SCENE_EDITOR.md` § stencils).

> **Do not re-derive this from a door.** A radial feature sits on a mirror axis and collapses
> the twelve to six, which is a fact about that content and not about the dial. Measured with
> an off-axis marker: twelve distinct cells on one ring, zero collisions. The collapse is kept
> as the negative control beside the claim.

**Two real defects fell out of building it**, both invisible while every stencil was
symmetric:
- `stencil_rotate`/`stencil_mirror` in `hex_field` haloed an already-haloed extent, so a
  rotated stencil could never compare equal to an unrotated one and carried ~2× the edge
  storage. Fixed; content was never lost, only the bookkeeping. **Uncommitted in the shared
  tree.**
- **Our stamp bridge dropped walls.** `map_to_stencil` and both `stencil_into_map` paths
  read and wrote edges only for *occupied* cells — but three of the six directions store an
  edge against the neighbour, so a room's wall is owned by the empty cell outside it. The
  door house held 17 walls and stamped 8. Now 17. No count ever caught it because the loss
  was symmetric.

The **caller switch is half done**. `tool_apply` moved to the library path — it was the one
call site that had to, because a facing needs `stencil_rotate` — so `moros_sim` no longer
touches `StencilDef`. Still on the old path: `moros_editor`'s `moros_stencil_stamp`,
`StencilDef` itself, the JSON pair, `stencil_save`, the three `StencilDef` built-ins, and the
undo path `stencil_stamp_with_undo`. That last one is the real work: the library stamp has no
undo bracket yet.

Two more outstanding:
- **An asymmetric stencil.** Every palette entry is rotation-invariant today, so the facing
  is exact and completely invisible. A **house with a door gap** is the obvious first one —
  and it is the same shape as crawler's P5 tail, where *doors are gaps*.
- **A second consumer stamps at least one stencil.** Crawler will not be it soon: they have
  no stencil call sites at all (their world is procedural — `hexplace`, vaults, roofs).

**#6, #7** — not started. #7 (`hex_editor`, the universal editor library) is the one that
carries the framing; #6 is Moros's configuration of it.

**Upstream** — `doc/claude/LOFT_HANDOFF.md` holds H4 (a null reaching exported glTF with a
clean analysis, not minimised after ten hypotheses), H5 (nested `for _ in` runs its outer
body once — four-line reproducer), and H6 (chaining a struct-returning transform empties it).
H1–H3 are fixed upstream.

## How to run things

```sh
make lib-test          # all five packages; goes red properly
cd lib/<pkg> && loft test

# a scratch program against both trees
loft --interpret --path ../loft/ --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.

## Working with the siblings

- **Never edit `../crawler`.** Another agent works there; an edit it did not make breaks its
  picture of its own tree. Read freely, raise findings in the shared package's README or in
  `LOFT_HANDOFF.md`, and let them make the change. It works — they acted on both findings
  raised this way.
- **`loft-libs-world` `dev` is shared and consumed from the WORKING TREE.** A new public name
  can turn the sibling red with no local edit on their side: adding `EdgeSet` cost crawler a
  rename across ~38 files. **Grep the sibling before adding a public name**, and when a build
  breaks with nothing changed locally, read the sibling's `git log` before debugging.
- Both agents have edited the same file at once. **Check `git diff` for someone else's work
  before committing**, and stage-and-commit in one command.

## Three things worth carrying forward from the design work

**A. A mechanism that looks like overhead may be load-bearing for a case you did not
measure.** Twice a "simplification" was recommended and withdrawn — the per-chunk window, and
`base_height` before it. Both times the tell was identical: the mechanism had been measured
against **one** use case. The window survives because it decouples resolution from extent,
which is the only reason one model can serve a dungeon at centimetres and a planet at metres.

**B. Two claims about seams were about nothing of the sort.** Layer kind, then layer identity,
were each argued to need world-global scope "or the fold check is incoherent across a seam".
The fold check reads one column, a column lies inside one chunk, and so it never crosses a
seam at all. A sentence that mentions a seam is not a seam argument — ask instead whether the
operation ever reads two chunks.

**C. A sibling had already solved it, better.** `crawler/PROPS.md` refuted the dressing-layer
design on three axes at once: a level is a *sheet, not a slot*; terrain is dense while
dressing is sparse; and placement is mostly *derived* rather than authored. The uniform-cell
version felt like one mechanism serving two cases — and that feeling was the tell that it was
serving one and disfiguring the other.

## Three things worth carrying forward

**1. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**2. Parity is where this codebase breaks.** Four separate bugs, all the same shape: right for
non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, and negative indices that wrap rather than fail. When touching the
lattice, test **both parities and both signs**.

**3. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.
