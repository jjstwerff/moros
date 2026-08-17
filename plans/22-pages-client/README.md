# 22 — The pages client: the editor as a page, with the authority local instead of remote

**Issue:** [`jjstwerff/moros#22`](https://github.com/jjstwerff/moros/issues/22) ·
`status:active` · **Value:** `G` · **Effort:** `MH`

## Status

⏭ **THE CLIENT IS THE PRIORITY, AND `hex_cam` IS NOT.** The user's ordering, 2026-08-11:
*"this is not the highest priority, getting our client is that."* The camera library has three
consumers and a finished design and it still waits — **phases `C1`–`C4` do not start until `B3`
can be opened and driven.**

**Built:** `W1` (a world is bytes), half of `W4` (`press`, two of four sites wired), `R1a`/`R1b`
(the ring reconciled — the pose carries the feet, and the trunk is the session's), `R3` (`O`/`P`
say *not yet* instead of doing the wrong thing), `S0`/`S2a`/`S2b` (the scene records
travel with the store, the opening's choosing is in the library, and a SELECTION decides what it
cuts). **`V1`** is built — a key names a verb, and the key stops carrying a profile.
**`V2a`** moved the server's `MSG_HOUSE`, **`K1`** taught the scripts to say `verb` and
`select` — with the runner grown a **session read-back**, because the world cannot see the
profile a conversion loses — and `V2b`/`V3` finished it: **`press(key)` is deleted.**

✅ **AND THE STORAGE HALF OF THE MILESTONE IS DONE — `P6`, 2026-08-13.** A `--html` page has a
filesystem, a world saved in it **survives a reload** (http and `file://` alike), and it reads its
base tree exactly as the interpreter reads a directory. ⛔ **`W5` is cancelled and `W3` retired with
it**; `P2`, which was run to make `W5` buildable, is spent. *Build a house, close the tab, reopen
it* is now short exactly one thing: **a page with the gestures in it.**

✅ **AND THE GOAL SENTENCE IS TRUE NOW — `B4`, 2026-08-15.** Build something, close the tab, come
back and it is there: `world_save` on the edit clock, `world_load` on the frame the authority
moves, `make probe-demo` `O1`–`O4`. ⛔ **The step was three finished parts and no wire between
them** — `W1`'s codec, `P6`'s filesystem and `M5b`'s load-at-boot pattern were all green and
nothing joined them, which is where this tree's commonest defect hides best: **between** steps
that are each honestly tested.

✅ **AND `B1a` IS BUILT — the client's five one-to-one keys name verbs, 2026-08-13.** `W4` is three
of four sites, and `make probe-b1a` is the first check in this tree that has ever pressed a key in
the client at all.

✅ **AND `B1b.1a` IS BUILT — the panel says which authority it has, 2026-08-13.** The status line
was a literal claiming `connected`, set before any socket existed; it is derived now, and it moves
when the socket opens. `make probe-auth` — **three situations over one page build**, because the
sabotage that mattered passed against the first two.

✅ **AND `B1b.1b` IS BUILT — THE AUTHORITY IS TWO, 2026-08-13.** With nothing behind the wire the
page stops dialling, says so on its status line, and **writes what it is pressed into its own
world** — the same world and the same session `editor_run` builds from the same six verbs.
`make probe-auth`, 28 checks. ⛔ **And the digest it is compared through had to be built twice**:
a CRC32 over this format is structurally blind to every per-cell change, because each layer's
cells are followed by their own CRC32.

✅ **AND `B1b.2` IS BUILT — THE PAGE DRAWS WHAT IT WROTE, 2026-08-13.** A camera of its own, its
own ground meshed out of its own cache, and a re-mesh on every write. ⛔ **Nothing had been on
screen at all**, and `draw_world` says why in one line: `if !st.has_cam { return; }` — the camera
is the SERVER's solve, so the page `B1b.1b` shipped had every number right and a blank world half.

✅ **AND `B1b.2c` IS CLOSED — THE PAGE DRAWS ALL ELEVEN SURFACES, 2026-08-13.** A fence rung in
local mode is visible. The recipe is `hex_mesh::chunk_meshes_all`, the server holds no copy of it,
and `make probe-auth` reads the page's own line: **`grass` at boot, `grass,wall` after the rings**.

✅ **AND THE DEMO EXISTS — `B2`/`B3`, 2026-08-13.** `make pages` writes `_site/index.html` (the
client engine build, verbatim, asserted) and `make probe-demo` opens it from `file://` with no
listener at either end. ⛔ **Most of the step was cancelled by its first measurement**: the engine
build already ran from a disk, so `B2` is packaging and a check rather than a port.

✅ **AND A DELETION HAS A FLOOR UNDER IT NOW — `K3a`, 2026-08-15.** A word `editor_run` does not
understand **fails the run**; it used to print a complaint and exit 0, which would have made
`K3b`'s deletion turn every stale `key H` into a silent no-op. Measured first: **25 of 55 scripts**
were already printing `unknown command` and every one exited 0.

✅ **AND `W4`'s FOURTH SITE IS CLOSED — `K3b`, 2026-08-16.** `key <K>` is deleted from both
readers, so **nothing headless resolves a key any more**: `keymap_default()`'s only production
consumers are in the CLIENT, where a keyboard belongs and where a person can rebind it. ⛔ **The
price was THREE probes, not the two this row predicted** — `probe/k2b` is baselined on a commit
whose scripts are in the key spelling, so the deletion made it unrunnable and its own vacuity
guard said so out loud (*"the label map rewrote NOTHING over 31 script(s)"*). ⛔ **And it was not
safe as written**: `tools/script.mjs` had `K3a`'s defect untouched, so `K3b.1` had to land first.

✅ **AND A `send` IS WHATEVER IT CARRIES NOW — `K3c`, 2026-08-16.** An authoring id fails the
run; `ground` is **performed**; the default is deny, so an id nobody has classified fails too.
⛔ **The drop had been visible as a collision the whole time** — six scripts keyed one world
`32952:3318286153`, and `plane.keys`, whose subject is the floor, was byte-identical to a bare
raise. ⛔ **And performing `ground` found a defect two layers down**: `world_file_size` never
counted the `GRND` section, so `world_save` answered **`WS_IO` — the bytes did not reach the
disk** over a file it had written perfectly, and **not one of the three ground tests calls
`world_save`**. `make probe-k3c` is in `make fast`.

✅ **AND A MOVEMENT IS NO LONGER DROPPED SILENTLY EITHER — `K3e`, 2026-08-16.** `hold`,
`keys` and `turn` are remembered instead of skipped, and the fence is at the **gesture**: a `verb`
whose author was moved by a walk this runner cannot follow fails the run, and an `at` clears it.
⛔ **The row's own verify could not have failed as written** — it said *go red on `deck.keys`*,
and `deck.keys` has exited 101 since `K3c` refused its `send 6:`. What is asserted is the
complaint **count, 2 → 3**, and which line the third names. ⛔ **And the fence position is
measured rather than argued**: putting it where the movement arrives costs `cellar.keys`
**2 complaints → 10**. `make probe-k3e` is in `make fast`.

✅ **AND THE DEBT `K3b` CREATED IS PAID — `K3d`, 2026-08-17.** Every live script has a committed
record of what it builds, `make probe-k3d` is in `make fast`, and the ten scripts that lost their
only check have one that is not a second spelling. ⛔ **The debt's own list was stale in both
directions** — what is RUN by nothing is **fourteen of thirty**, not ten. ⛔ **And the baseline it
asked for would have been blind**: `slab.keys` keys the world a bare `verb raise` keys, so the
record is a PAIR plus the gestures' own sentences. ⏭ It leaves one hole measured rather than
promised: **`K3f`**, the five camera scripts no check in this tree names at all.

✅ **AND THE ROOF PLAN IS THE GESTURE'S — `D0`, 2026-08-17.** Found while measuring `D1`'s
premise rather than looked for: `es_roofs` had **one writer and it was at the socket**, so
`editor_run` and the page placed houses that entered no registry — and the registry is what the
mesher draws a gable from. ⛔ **The page had been drawing the per-cell hex staircase**: 189
vertices against the planned 18, on the same house. ⛔ **And the socket re-derived the footprint,
the seat and the scale**, the last off a global that is wrong on a part world by 6.5 world units.
⚠ **A green suite was the wrong instrument** — nine k3d records move on the `roofs` field and on
nothing else, which is what says the step did exactly one thing.

✅ **AND THE MODE IS DERIVED — `D1`, 2026-08-17.** `mode_at` answers outside · inside ·
underground off **one** reading of the world, and nothing consults it yet. ⛔ **The row's own
verify could not have failed** — *never contradicts `shelter_at`* is unreachable once the design's
*do not add a second enclosure test* is honoured — so what is asserted is **which** of the two
sheltered modes, in pairs that differ by one fact. ✅ **Open question 2 is answered by measurement**:
underground is what is OVERHEAD, and `tr_fabric` had held the classification since plan 20 `A1`, so
a cellar under a house is `inside` and the same gesture in a meadow is `underground` with nothing
arbitrating. ⛔ **The corpus caught the first derivation, not a test** (`mode underground` on a
hillside in the open air), and ⛔ **the tick call was observed by nothing** until
`tools/scripts/threshold.keys` walked across a threshold.

⛔ **AND `D2` WAS BLOCKED, WHICH `D1`'s OWN LOG FOUND — [`probe/d2`](../../probe/d2/README.md).**
The mode printed beside every `verb` line says the live corpus performs **143 of its 144 gestures
from `outside`**, which raised the question rather than answering it: the corpus teleports because
it was written for a keyboardless runner. So the second measurement asked whether a person *can*
walk in, and **they could not** — `session_open_kind` marked **one** hex edge where the boundary a
walker crosses is **two**, so the editor's own doorway was drawn open and stayed shut.

✅ **AND `D1a` CLOSES IT, IN THREE STEPS THAT EACH FOUND THE NEXT — 2026-08-17.** `D1a.1` gave
`fence_disc` runs (⚠ **six sides of a ZIGZAG, not six lattice directions** — the obvious shape was
refuted by the dump, and `annex_host`'s trunk clause was never comparing like with like);
`D1a.2` marks **every** wall edge the opening's own width covers, and **a person walks in — 5.24
against −2.26, control 6.0**; `D1a.3` puts a run on the line its edges are actually on, after
finding **a wall drawn 0.75 world units off the boundary it is stored on**. The `inside` mode is
reachable by walking now, in every driver.

**Next:** **`D2`** — and its own premise is the thing to measure first. On the design's own mode
table (`outside` removes doors, windows and interior stairs; `inside` adds the storey pair) the
corpus tally refuses **22 of its 144 gestures**, every one of which builds something correct
today — and `D1` already found `house.keys` cutting two openings from **two different modes** at
two stations its own comment describes identically. **`T1`** is independent of it.

✅ **AND THE TWO INSTRUMENTS THAT WERE RED BEFORE ANY OF IT STARTED ARE GONE.** `probe/k1` checks
`A`/`B` had failed since `S3` collapsed the opening keys — measured on HEAD, not caused by
`K3a` — and `probe/k2` needed 24 server starts and timed out on a loaded box. Neither was in
`make fast` or `make gate`, which is how they rotted unnoticed. `K3b` retired both; what is left
of `probe/k1` is green and starts **one** server instead of three.

The full step decomposition is
[EDITING_MODES § The order of work](../../doc/claude/EDITING_MODES.md#the-order-of-work-in-steps-that-can-each-go-red),
where every step names what runs beside it and what would surprise its test.

⚠ **`W4` STOPPED HALFWAY ON PURPOSE, 2026-08-11.** Wiring `editor_client` and `script.mjs` to
`press` was attempted and **backed out**: measuring the two sides first showed `press` holds the
RUNNER's meanings and the server disagrees on three keys. And the user's mode requirement says
why a flat table could never have been right — see [EDITING_MODES](../../doc/claude/EDITING_MODES.md).
**The chokepoint is right and its contents are provisional.**

Today: `world_to_bytes`/`world_from_bytes` ship and `world_load` is 1.6× faster than the
field-by-field reader it replaced; `hex_editor::press` answers what a key means for
`editor_run` and for the server's `MSG_HOUSE`. `src/editor_client.loft` still holds no
`EditSession` and calls no gesture, so there is no local mode yet.

## Goal

A directory you can open from `file://` — build a house, close the tab, reopen it and the house
is there — produced from **the same client program the server serves**, differing only in where a
key press goes.

## Anchors

- **The design:** [`doc/claude/PAGES_EDITOR.md`](../../doc/claude/PAGES_EDITOR.md) — the one
  invariant, the four-site count, the filesystem correction, the probes.
- [`CAMERA_INDOORS.md`](../../doc/claude/CAMERA_INDOORS.md) — the modes, and § *The camera becomes
  a library* for `C1`–`C4`.
- [`LAVITION_SPLIT.md`](../../doc/claude/LAVITION_SPLIT.md) — this plan supplies the **second
  consumer** its extraction bar records as unmet, and `W4`/`C2` retire `world_to_hex` sites that
  plan [19](../19-lavition-split/README.md) `L6.3a` otherwise has to pay.
- Touches: `lib/hex_voxel/`, `lib/hex_editor/`, `lib/glb_read/`, `lib/hex_cam/` (new),
  `src/editor_client.loft`, `src/editor_server.loft`, `tools/script.mjs`, `tools/build-pages.mjs`
  (new), `tools/layering.sh`.

## Invariant gate

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| ✅ `W1` | `data/parts/` rebuilds **byte-identically**, and `world_to_bytes` equals the file the old writer produced **byte for byte** | **the bytes are the format; a file is a destination** — one encoder, not two | ⚠ **three, all run**: `bw_u16` big-endian must fail at a named byte (it did — byte 8349); a truncated buffer must be refused rather than decoded as zeroes; and a negative chunk coordinate must come back **negative** |
| ◐ `W4` | pressing a key and calling the gesture by hand leave worlds with the **same `w_tau`** | **one key, one meaning, wherever it is pressed** | `grade_under` returning the origin's height — `editor_run`'s actual old behaviour — must fail (it does) |
| `W2`/`W3` | a part loaded from bytes equals the same part loaded from a path | **a path is a wrapper, on every loader** | a `.glb` that fails to load must **say so**, not draw nothing — an absent mesh reads as a geometry bug |
| ✅ `B1a` | the SERVER receives **exactly what it received before** for the same key sequence | a key names a verb **in the client too** — `W4`'s fourth site | ✅ **BOTH RUN.** `act`'s `fence` → the wall's message: **every sentence identical**, world `82d622b3` → `cdabc1dc`. `act`'s `place` → a raise: transcript, presence check and world all red. ⏭ The opening pair is **left out** rather than pinned — see the finding above; pinning would have made `p` stop cutting a pointed head, which is a change wearing a refactor's clothes |
| ✅ `B1b.1a` | the panel's status is **derived from the client's own socket**, and moves when it moves | a fact is asserted only where it can be **known** | ⚠ **THREE, AND ONE OF THEM PASSED FIRST TIME.** `literal` (the line as it was) → red on the panel's first word and red with no server. `assume` (authority off the send, not off its success) → red where the client's claim meets the WIRE's log. `nodirty` (the fact moves, the panel is not told) → **green in both runs**, because the real server's `N:`/`H:` rebuild the panel anyway — which is what added the third situation, a socket that opens and says nothing, where `panel_dirty` has exactly one possible writer |
| ✅ `B1b` | the local page and the runner build the **same world** from the same verbs | the two authority modes are **one editor** | ⚠ **NOT `w_tau` — that row was written before `V1` measured it blind**, and the correction it made (**`world_to_bytes` AND the session**) is what the built version does. ✅ **NINE SABOTAGES.** The two that matter: `elsewhere` (the same gestures at an author one unit over) is invisible to every count and every sentence — a ring writes 42 edges wherever it is laid — and red on the world key alone; `scratchsession` (press into a session nobody keeps) leaves the world **byte-identical** and is red on the session alone |
| ✅ `B4` | the reloaded page keys **the world that was saved**, and its camera is solved on that world's ground | **a page is a place to keep things, not a sketchpad** — the edit clock is the trigger, so *save when tau moved* is exact on any box | ✅ **THREE, AND EACH IS RED SOMEWHERE DIFFERENT.** `noworldsave` (the trigger removed) is red on **O1** — in its own half of the run, which is what separates it from its twin; `noworldload` is red on O2/O3/O4 with **O1 green**; `nopose` is red on **O3 alone**, because a page that restored every cell and solved its view against the old ground keys a **byte-identical** world. ⛔ **A fourth was written and RETIRED**: `nofeet` was green on everything, because the invariant it guarded belongs to `fall_step` and already had a test |
| ✅ `B3` | the demo check opens `_site/index.html` **with no server** and reads an edit out of the picture | the quick start **stays** working | ✅ **BOTH RUN.** `emptypage` — a page with the right ELEMENTS and no editor — is red on **all seven** checks, which is this row's own warning made runnable. `deadkey` — press `z`, one of the twelve keys with no verb — is red on **D5/D6 alone** and green on the other five: the picture check sees a *gesture*, not the passage of time |

⚠ **`B2` (`build-pages.mjs`) has no exact-invariant surface** — it assembles files and decides
nothing. Said in a line so the silence does not read as *gate done*. ✅ **AND THAT IS WHY IT
MERGED WITH `B3`**: a build step that decides nothing cannot go red on its own, which is the
lower bound of a safe step, so *assemble the demo* and *open the demo* are one step. The one
thing it does decide — refusing an engine older than its sources — is measured below.

⚠ **EVERY PHASE ABOVE IS CUT TO ANSWER ONE QUESTION — [*what am I comparing against while this
step is half done?*](../README.md#what-makes-a-step-safe--and-it-is-not-how-few-lines-it-is)**
`W4` was not, and it had to be reverted whole; `W1` was, and it named the failing byte under
sabotage. **Both were `M`.** So the `M1`/`C2` rows below are split until each has a parallel run
with an exact comparison — the effort letter did not change, the *recoverability* did.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| ✅ **`P4`** — can one `--html` program hold the renderer **and** the gestures? | XS | **RUN.** `--check` rc=0 and the real `--html` build rc=0, 2546 KB / 1856 KB WASM in 9.6 s | ✅ Done |
| ✅ **`W1`** — `world_to_bytes` / `world_from_bytes`; save and load become wrappers | M | `make parts` byte-identical · `make lib-test` rc=0 both backends · hex_voxel 141 → 146 | ✅ Done |
| ◐ **`W4`** — `hex_editor::press`, the key→gesture chokepoint | M | `editor_run` ✅ · server `MSG_HOUSE` ✅ · `editor_client` ✅ (`B1a`, five of seven keys) | ◐ **Three of four.** What is left: `tools/script.mjs`'s `KEYMAP`, and the OPENING pair in the client — both blocked on the same thing, a selection reachable from the driver |
| ✅ **`R1a`** — the pose carries the ground under the feet | S | **DONE.** `make lib-test` rc=0 both backends (hex_editor 398→400) · `make parts` byte-identical · the house script still `τ 3909` · two sabotages seen red | ✅ Done |
| ✅ **`R1b`** — reconcile the RING verb with `do_fence` (reference, yaw, the trunk) | S | **DONE.** 5 sabotages seen red · `make lib-test` rc=0 both backends (hex_editor 400→404) · `make parts` byte-identical · `make gate` 47 PASS / 0 FAIL | ✅ Done |
| ✅ **`R3`** — `press` answers **`PR_SELECT`** for `O`/`P` until a selection exists | XS | **DONE.** Both tests seen red first · `house.keys` through the runner is **byte-identical**, τ 3909 · the wire path untouched | ✅ Done |
| ✅ **`S2b`** — the selection, the verb that sets it, and the gesture that reads it | S | **DONE.** Three selections cut three different `Opening`s · 5 sabotages red · `49:` on the wire, `36:` bare cuts what is chosen | ✅ Done |
| ✅ **`S3`** = **`R2`** — `O P I U N M` collapse to ONE `opening` verb | M | **DONE.** Six keys against six selections: equal `w_tau` AND equal `Opening` · 4 sabotages red · `R3`'s regression retired | ✅ Done |
| ✅ **`S0`** — the scene records go with the store they describe | XS | **DONE.** Found while checking `S1`'s premise: `9:` left the previous world's cottage in the session and `37:` hung a balcony on it | ✅ Done |
| ✅ **`S2a`** — the opening's CHOOSING moves into `hex_editor` | S | **DONE.** The server's report is **identical over 8 scripts and 240 lines**; 5 new loft tests, 4 sabotages red | ✅ Done |
| ✅ **`V1`** — the verb vocabulary, `verb_of(key)`, and a `press` that takes a verb | S | **DONE.** Eleven keys through both layers, compared as whole-world BYTES · 6 sabotages red · hex_editor 420 → 428 | ✅ Done |
| ✅ **`V2a`** — the server's `MSG_HOUSE` takes the VERB | XS | **DONE.** `make headless-same` green, sabotage red (`served:` empty against `house placed 27 cells, 84 wall edges, ridge at 21`) · `make gate` 48 PASS | ✅ Done |
| ✅ **`V2b`** — `editor_run` resolves through `verb_of`; the **last production caller of `press(key)`** | S | **DONE.** ⚠ no equality can see this step — `probe/k1` check `G` (choose pointed, press `O`, the selection decides), seen red on the old line · `make headless-same` · `make probe-verbs` · `make probe-convert` | ✅ Done |
| ✅ **`V3`** — delete `press(key)` | S | **DONE.** ⚠ a green suite is the wrong instrument for a deletion — the **test-name diff** is, 40 → 36 with every change accounted for, and three sabotages proving the retired claims are held where they were said to go | ✅ Done |
| ✅ **`D0`** — the roof PLAN is the gesture's, not the socket's | S | ⚠ the count, **not** a green suite — the registry had one writer and every headless world was already green without it | **DONE 2026-08-17.** ⛔ **FOUND WHILE MEASURING `D1`'s PREMISE, and it is the tree's commonest defect one layer over**: `es_roofs` had exactly one writer and it sat at the SOCKET, five lines *after* `press_verb` returned — so `editor_run` and the page placed houses that entered no registry at all, and the registry is what `hex_mesh` draws a gable from. ⛔ **The page had been drawing the sawtooth `S6b` exists to suppress**: one house, meshed both ways, **189 vertices / 162 triangles** against **18 / 6**, with the ridge 0.5 wu low and the eave 0.25 high. ⛔ **And the socket re-derived all three arguments** — the footprint by calling `pose_footprint` a second time, the eave off a read-back of the seat, and the scale off `HEIGHT_SCALE`, a global that is 0.25 here and **0.125 on a part world**, where the same house's plan sits at 13.0 and its cells at 6.5 (measured; latent, because no live script places a house in part mode). `roof_eave_y` is now the one derivation and `roof_over` and the plan are its two readers · `roofs` is a **required** parameter of `place_house` for `author_at`'s reason — a default is how the next driver forgets · `probe/k3d` **9 scripts moved, every one on the `roofs` field alone** and no world, τ, chunk count or sentence with it, with the count tracking the houses (`runs 8` → `roofs 2`) · `make headless-same` rc 0 · `make parts` byte-identical · `sh probe/k2/sabotage-roof.sh` **5 rows red on their own claims, 3 controls green** · ⛔ **and the sweep's first run scored all five as *nothing went red*** — `loft test` takes one target per run and was handed three, so every row ran nothing, which is the sentence an untested feature produces. The vacuity guard counts result lines now. ⚠ **A row was also mislabelled and running it is what said so** — `early` adds an append rather than moving one, so it reds the COUNT and not the ordering it claimed; renamed `twice`, and the ordering claim is a **declared blind spot** that must stay green, because no fixture makes a roof refuse. ⏭ **And grepping for callers found two that had been red since `R1a`**: `probe/house/shear.loft` and `probe/house/pads.loft` do not compile and have not since `author_at` gained a required `y` — measured against the PRE-change library before it was blamed on this step. They take the new argument mechanically; the `y` is **not** guessed, because picking it decides what the probe measures. ⚠ `pads.loft` is cited by `place_house`'s own comment as the measurement behind the seated pad, so this is a dead reference in a live doc |
| ✅ **`D1`** — `mode_at` derived, logged, and consulted by nobody | S | ⛔ **the row's own verify could not have failed** — see below; the assertion is WHICH sheltered mode, in pairs | **DONE 2026-08-17.** `mode_at(sess, w, a)` answers outside · inside · underground off ONE reading — `Shelter` gains `sh_fabric`, *what the nearest cover is made of*, filled by the sweep that already picks the innermost, because [EDITING_MODES](../../doc/claude/EDITING_MODES.md)' rule is **do not add a second enclosure test**. ⛔ **THE VERIFY THIS ROW WAS WRITTEN WITH IS UNREACHABLE**: *never contradicts `shelter_at`* cannot fail once `mode_at` reads `shelter_at`, which the same design demands — so the rows are **pairs differing by one fact**, and a cellar under a house (`inside`) against the same gesture in a bare meadow (`underground`) is the one that answers the design's open question 2. ✅ **And the doc's own *"inside wins"* sentence needs no arbitration now** — the cellar's ceiling is either a `FLOOR_MAT` floor or earth, and `tr_fabric` has said which since plan 20 `A1`. ⛔ **The first derivation counted the author's OWN GROUND as cover, and the corpus said so rather than a test**: `profiles.keys` reported `mode underground` for an author on a hillside in the open air, because interpolated feet truncate below their own cell — `walk.loft` had written that finding down for the stair, so `mode_at` takes `walk_h`. ⛔ **The tick call was built and observed by NOTHING**: `notick` moved 0 of 30 records, because every mode crossing in the corpus is a **teleport** — `tools/scripts/threshold.keys` is the walk that fixes it, and `notick` is now red on that script alone. ⛔ **`mode_name` collided with the server's camera `mode_name` and `make fast` was green through it** — nothing in that tier builds either `src/` program, and the failure presented as `make headless-same` hanging on a `listening on port` that never came; the server's is `cam_mode_name` now. · `make lib-test` **1856 → 1865 green on BOTH backends** (hex_editor 564 → 573) · `make fast` green · `make parts` byte-identical · `make headless-same` rc 0 · `probe/k3d` 31 scripts, **8 records moved and every one on `mode` lines alone** · `sh probe/k2/sabotage-mode.sh` **5 derivation rows + 2 corpus rows red on their own claims, 4 controls green** |
| ✅ **`D1a.1`** — a ring registers its six sides as wall RUNS | S | ⚠ **not a count** — the six must be where the WALL is: every stamped edge midpoint on a run, with a smaller ring's runs as the control | **DONE 2026-08-17**, the user's call between the two candidates. ⚠ **THE OBVIOUS SHAPE IS WRONG AND THE DUMP REFUTED IT**: *six runs, one per lattice direction* — measured, a flat side of a hex region is a **zigzag of two alternating directions whose MIDPOINTS are collinear**, which is the sentence `hex_form::side_edges` already makes about a rectangle. Corners at **√3·(rad+½)**, read off three radii and then asserted against all of them: every stamped midpoint on a segment at **worst miss 0**, control **0 of 30**. ⛔ **AND `annex_host`'s TRUNK CLAUSE WAS NEVER COMPARING LIKE WITH LIKE** — `ah_best > ah_dr` weighed the distance to a straight WALL against the distance to the ring's **centre**, true only because a ring registered nothing; `press.loft`'s balcony went `round false` and hung on a flat side of the cylinder it stood against. *A live trunk within reach IS the host* is a condition now rather than an accident. ✅ **The store is byte-identical and the DRAWING changed, which no gate could have seen** — `fence.mjs` reads counts. `probe/d2/ringmesh.loft`: **`both` == `runs only` exactly** at three radii, so the per-edge panels contribute nothing and the ring is drawn from its runs alone — 60 verts of flat panel become 240 of a wall with thickness. ⚠ **A third row was needed to say that**: a bigger mesh alone cannot tell *the analytic wall costs more* from *a staircase inside a wall*. ⚠ **And a grep said the corpus was blind to this and was wrong** — `annex.keys` lays a ring under the verb `wall`; `probe/k3d` moved one record on one field, `runs 1 → 7`, with world, τ, chunks, annex count and every sentence unmoved · `make lib-test` **1865 → 1868 both backends** (hex_editor 573 → 576) · `make fast` · `make parts` byte-identical · `make headless-same` rc 0 · gates `fence` `field` `trigger` PASS |
| ✅ **`D1a.2`** — an opening marks the edges its own WIDTH covers, not one | S | ⚠ the walker must reach the far wall, and a NARROW opening must still mark fewer edges than a wide one — otherwise the fix is *mark everything* | **DONE 2026-08-17.** `session_open_kind` decides the SHAPE first — `opening_make` writes nothing — and then marks every wall edge whose midpoint is within `op_half` of the opening's centre, **the same distance `opening_cuts` uses**, so an edge is never passable where nothing is drawn. ⛔ **A PERSON CAN WALK INTO A BUILDING NOW, so `D2`'s `inside` is reachable**: the crossed cell goes `4:DOOR 5:DOOR` where it was `4:DOOR 5:WALL`, and the walk reaches **5.24** against **−2.26**, with **6.0** the no-house control. ⛔ **AND SPAN-ONLY MARKING REFUSED SEVEN CORPUS RECORDS, WHICH IS WHAT FOUND `D1a.3`** — a `verb run` files its line through the author's CELL CENTRES while `wall_stamp` marks the lattice edges **0.75 off it**, so the nearest edge sits 0.866 from the opening's centre against a half of 0.65. ⚠ `place_house` does not have this (`footprint_walls` mitres on the wall's own boundary), which is exactly why the house case was fixed and five fixtures were not — and `opening.loft` already recorded the **mirror** of it, which is why `run_point_near` exists; the same 0.75 the other way had nobody looking at it. ✅ **So the marking has a FLOOR — every edge the opening covers, and never fewer than one** — which makes it a strict superset of `open_ahead(…, 1)`: `probe/k3d` **31 scripts unmoved**. ⛔ **And an embrasure is *already open*, which is not *no wall here***: `20 + kind` is cut into the BACK of a standing niche, so its host had already turned every edge in the span into an opening and nothing is left to mark — `span_mark` counts *already an opening* separately, because a boundary that is passable is not a boundary that is absent. ⚠ **And `opening.loft`'s fixture held a run that described no wall in its world** — a straight segment along `z = 0` while `walled()` builds a RING; harmless while the marking ignored geometry, and it says the truth now. ⏭ The reverted first attempt is `D1a.1`'s row and [`probe/d2` § 5](../../probe/d2/README.md). · `make lib-test` **1868 → 1870 both backends** (hex_editor 576 → 578, `opening.loft` 18 → 20) · `make fast` · `make parts` byte-identical · `make headless-same` rc 0 |
| ✅ **`D1a.3`** — a run is registered on the line its edges are on | S | ⚠ **not the offset** — a ZIGZAG heading must be left exactly where the author walked, or the correction is a best fit presented as a fact | **DONE 2026-08-17.** ⛔ **A WALL WAS DRAWN 0.75 WORLD UNITS OFF THE BOUNDARY IT IS STORED ON** — the run said `z 0`, the store's fourteen edge midpoints were all at `z -0.75`, and the emitted masonry ran `-0.433 .. +0.433`, its near face stopping **0.317 short** of what a walker collides with. A row of cell CENTRES has no lattice edge on it, so `wall_stamp` marks the nearest boundary half a row away. ✅ `place_house` is the control and coincides exactly. ⛔ **AND *SHIFT THE RUN* IS REFUTED FOR SIX OF EIGHT HEADINGS** — the offsets spread up to **1.553**, so the wall zigzags about its line and there is no line to move to; the rule is *when every stamped edge shares one offset, the wall has a line and the run must be it*. ⚠ **A run already on its wall is left alone, and that is not belt and braces**: `place_house`'s coincide to the last bit, so shifting by ~1e-16 perturbed two mitred corners in the sixteenth digit and `test_the_four_runs_meet_end_to_end` went red. ✅ **The chain lands**: `opening kind 1 at 0,0` becomes `at 0,-0.75` and `door`'s τ 108 → 109 as `D1a.2`'s span finds the second edge it now covers · `make lib-test` **1870 → 1872 both backends** (hex_editor 578 → 580) · `make fast` · `make parts` byte-identical · `make headless-same` rc 0 · `probe/k3d` 7 records moved, each legible · gates `straight` `opening` `fence` `occlude` PASS, and `occlude` reads `ringAt 4.33` = √3·(2+½), `D1a.1`'s corners from an independent instrument |
| **`D2`** — verbs consult the mode: a verb with no binding here **says why** | S | a verb silently doing nothing. ⚠ *reason, offer, residual, never a blank no* | ⛔ **BLOCKED ON `D1a`, and the premise is measured: the live corpus performs 143 of its 144 gestures from `outside`** — 17 of the 18 openings, both stairs, both storeys and the cellar, every one of which this row's table would refuse. **One script of 31 is ever `inside`, once.** That is not by itself proof the design is wrong (the corpus teleports rather than walks), which is exactly why the second measurement was taken — and a person *cannot* walk in. ⏭ And `D1` handed this row a fact it has to answer either way: `house.keys` cuts its two openings from two DIFFERENT modes, though its own comment describes both as *"stand ON the wall's own cells"* |
| ✅ **`K1`** — scripts accept both spellings: `key H` and `verb place`, plus `select <kind>` | S | **DONE.** Both drivers, twin scripts, compared on the world AND on the session · `make probe-verbs` · ⚠ the row's own control was blind — see below | ✅ Done |
| ✅ **`K2a`** — convert the presses that LOSE information: 18 opening keys in 8 scripts | S | **DONE.** Each script beside a committed baseline of itself, through a server: sentences, saved world **and** kinds · `make probe-convert` · ⚠ the first two are blind to a niche's depth — measured | ✅ Done |
| ✅ **`K3` · `R`** — the wall run becomes the verb `run` | S | **DONE 2026-08-14.** All 22 `key R` lines converted; `probe/k2` drives both spellings on 8 scripts: **identical sentences, byte-identical worlds**. `session_wall` had 4 callers and all 4 were tests — the stamping half was never in the library · `sh probe/k2/run.sh` · `make probe-demo` `R1`–`R3` · 5 sabotages seen red | ✅ Done |
| ✅ **`K3` · `Y`+`T`** — the seat family collapses to one `seat` verb, kind from `52:` | S | **DONE 2026-08-14.** Two keys on one message differing by the thing seated — `O`…`M`'s shape, so `Y` could not be done without `T`. `probe/k2` 8/8 with two new checks; ⚠ **check 2 is structurally blind to a seat** (a prop is session state, not store) — measured by mis-transcribing a statue and watching the world stay identical · six sabotages red | ✅ Done |
| ✅ **`K3` · `J`+`K`+`V`** — the annex family collapses to one `annex` verb, kind from `53:` | S | **DONE 2026-08-14.** Three keys on one message; the third is a different CONSTRUCTION, not a third kind, so `ANX_CUPBOARD` is named apart from the stored `AN_*`. ⛔ **The handler passed a GLOBAL height scale where the world's own unit belongs** — wrong on a part world, fixed in passing · `probe/k2` 8/8 · seven sabotages red |
| ✅ **`K3` · `E`+`Q`** — the stair pair stays TWO verbs, `stair_up` and `stair_down` | S | **DONE 2026-08-14.** ⚠ **The slice that stops the pattern**: three families in a row collapsed and this one has their exact outside shape — two keys, one message, a payload that differs — but the payload is a DIRECTION, which `raise`/`lower`'s rule keeps in the verb. So there is no `SELECT_STAIR` and `30:` keeps its sign. ⛔ **Two globals stood in for the world in one handler** (`py / HEIGHT_SCALE` and `cliff_step()`) — on a part world a tread was half the height a walker can climb · `probe/k2` **9 scripts**, `determinism` joined because it is the only one that presses `E` · seven sabotages red |
| ✅ **`K3` · `Z`** — the void becomes the verb `hole`; `X` stays a key | S | **DONE 2026-08-14.** ⚠ **A THIRD ANSWER TO "two keys, one message"**: not a THING (collapses) and not a DIRECTION (does not), but **two actions** — `39:0` lays a floor, `39:1`…`39:3` cut through it, and the second cannot run until the first has. `place`/`opening`'s relationship. ⛔ **The library refused with *press X first* and a test PINNED that substring** — a keystroke named by a package no keyboard belongs to. ⛔ **A bare `39:` is a slab**, so the *empty means the one I chose* contract is unavailable on this id · `probe/k2` **10 scripts** · seven sabotages red |
| ✅ **`K3` · `X`** — the floor becomes the verb `slab`, and the pair is whole | S | **DONE 2026-08-15.** The name `Z` was waiting on, bound. ⛔ **The instrument I added to cover the moved sentence had to be REMOVED the same hour**: `tools/script.mjs` prints, after each line it sends, whatever arrives NEXT, and returns 250 ms after its last send — so the wire capture LAGS and TRUNCATES, and two scripts of different lengths lose different tails. Measured over all ten pairs; the finding is now in `probe/k2/run.sh`'s header, which is what says why check 1 reads the server's log. ⛔ **`HOLE_PAD` and a hand-written `HOUSE_W + HOUSE_D + 4` were one number under two names** at the socket — `SLAB_PAD` for both, with a test that both gestures reach for it. ⚠ **A `pub const` used above its own declaration is reported as an UPPER_CASE local** ([loft#921](https://github.com/loft-lang/loft/issues/921)) — it resolves correctly (measured `sb_pad = 13`), so the one diagnostic pointing at a constant says it is not one · hex_editor 489 → 492 both backends · `probe/k2` 10 scripts · nine sabotages red, with a control that must stay green |
| ✅ **`K3` · `B`+`C`** — the storey pair, and every key the scripts press is a verb | S | **DONE 2026-08-15.** Two verbs by BOTH rules at once — a direction, and not mirror images (a cellar comes with its stair) — and the naming rule earns a sentence: **a verb takes the word the domain has**, so `cellar` rather than `storey_down`. ⛔ **The client's `b`/`c` were the last raw `wire` sends and were DEAD in local mode** — the demo could not build a storey at all; `make probe-demo`'s new `B` block reads `local storey — 19`. ⛔ **The stride was a global for the third time** (`cliff_step()`, wrong on a part world), with the disc radius and both pads as literals beside it. ⛔ **Two of this session's own instruments could not fail**: a sabotage that does not BUILD scored *nothing went red* in all four sweeps, and the disc assertion was a closed form checked against itself · hex_editor 492 → 494 both backends · `probe/k2` **12 scripts** · nine sabotages red plus three demo checks |
| ✅ **`K2b`** — convert the mechanical remainder: **91 lines over 32 files** | S | **DONE 2026-08-15.** `make probe-k2b` — **31 scripts**, each beside its own pre-conversion self out of git, equal on the world key, the session digest, the saved bytes and the transcript. ⛔ **The 32nd file was a script that is not a file**: `probe/a83/leaf_visible/switch.sh` builds its script in a **heredoc**, so it was invisible to the probe's `*.keys` glob and to the `--include=*.keys` grep that produced the *zero remain* claim in this row's own previous text. ⛔ **The probe was red on all 31 scripts the first time it ran, for two reasons that were both about the instrument**: the runner labels a bare acknowledgement with **the word the script used** (`said_ack` prints `"{what}: {n}"`, so `ArrowUp: 1` against `raise: 1`), and the two runs wrote worlds under **different names** which the runner then prints in its own summary line. ⛔ **AND TWO COPIES OF THE PROBE RAN AT ONCE**, one queued behind the `B4` sweep — they shared `probe/k2b/out` *and* `worlds/k2b-a.hxw`, so a byte comparison could have passed on **a world the other process built**. ✅ Measured: the rewrite reaches **80 of 90** lines and `place`'s ten are compared **word for word**, because a gesture only wears the bare label when it has nothing of its own to say | ✅ Done |
| ✅ **`K3a`** — a word the runner does not understand FAILS the run | XS | **DONE 2026-08-15.** ⛔ **`K3` could not be a deletion until this existed.** `run_line` has answered `false` since it was written and `main` threw the answer away: an unknown word printed and the process exited **0**, so deleting the `key` branch would have made every stale `key H` a silent no-op in a run that still reported success. ⛔ **And the skip list was stale in a way nothing could see** — it named nine words, real scripts use nine more, and a missed word is reported in the same sentence a typo is: measured over the corpus, **25 of 55 scripts** printed `unknown command` and every one exited 0 · subject: a typo now exits **101** with the save and every diagnostic still describing the run · control: **41 of 41 live scripts unmoved**, `make headless-same` rc=0, `probe/k2b` 31 scripts PASS, `tools/layering.sh` rc=0 | ✅ Done |
| ✅ **`K3b.1`** — `tools/script.mjs` fails a run on a line it could not send | XS | ⚠ the exit code, **not** the complaint — the check that existed was written against the wording | **DONE 2026-08-16.** ⛔ **`K3a` on the OTHER reader, and nobody had looked.** `!! no verb 'hoist'` and `!! unknown command 'hoist'` both printed and exited **0**, measured against a real server before the change and **101** after, with a clean script and a `key ArrowUp` still 0. ⛔ **It had to land before `K3b`, not with it** — the deletion turns every missed `key H` into a silent no-op otherwise. ⚠ **`probe/k1` `E` could not have seen it**: it grepped for the complaint, which a driver that exits 0 prints perfectly. Both halves assert rc now. ⚠ **What it deliberately does not count**: a gesture the SERVER refuses — `editor_run` sees that through an ack struct, this driver has only a status line that LAGS and TRUNCATES. Control: every first word and every `verb <name>` in the live corpus already resolves, so **0 of 41 scripts moved** | ✅ Done |
| ✅ **`K3b`** — drop the key spelling from both readers | S | the test-name and script-vocabulary diff, **not** a green suite | **DONE 2026-08-16.** `key <K>` gone from `src/editor_run.loft` and `tools/script.mjs`; `KEYMAP`'s 22 rows gone with it, and this file's last opinion about a keyboard. ⛔ **THE PRICE WAS THREE PROBES, NOT TWO** — this row predicted `probe/k1` and `probe/k2`, and `probe/k2b` died too: it baselines on `git show 0e2d48a:<path>`, so its baseline side is in the deleted spelling and builds **nothing** (`runs 0` against the converted side's real world). Its own vacuity guard reported it — *the label map rewrote NOTHING over 31 script(s)* — which is what an instrument that can see its own emptiness is worth. ⛔ **AND A CLAIM WAS ABOUT TO GO OUT WITH THEM**: *a gesture does not move the standing selection* was held by `probe/k1` `D` and relied on as `probe/k2` check 5's premise, and **every test in `opening.loft` chose once and cut once** — so all 17 were satisfied by a gesture that CONSUMES its choice. Moved first, then seen red on a sabotage that resets the kind after each cut, **with the other 17 green**, which is what proved the gap real. ⚠ **Move before you remove.** ⏭ The genuine loss is named rather than absorbed: `K3d`. Retired the scripted half of four sabotage sweeps and kept every library row (`sabotage-x` 6 rows red on their own claims, control green, tree restored) · `probe/k1` **4 FAILED → green**, and it now asserts the deletion directly (*a stale `key H` is an unknown word and fails: rc=101*) | ✅ Done |
| ✅ **`K3d`** — the un-gated scripts get a regression check that is not a second spelling | S | ⚠ it must go red on a press DELETED from a live script — the failure `probe/k2` caught and nothing does now | **DONE 2026-08-17.** `make probe-k3d`, **in `make fast`** (30 scripts, 17 s at `K3D_JOBS=6`): one record per script at `GROUND=0` — rc, the saved world's md5, the world key, τ, chunks, the session digest, the standing selection, every sentence a gesture printed and every line the runner refused — diffed against a committed baseline, `K3D_BLESS=1` to re-record with the diff shown first. ⛔ **THE DEBT'S OWN LIST WAS STALE IN BOTH DIRECTIONS**: three of its ten had gained checks since, five scripts it never named had not, and what is RUN by nothing is **fourteen of the thirty** — eight of which *are* named in a doc, a plan, the journal or a comment inside a loft test, so a grep for the name finds a paper trail and reads exactly like coverage. ⛔ **AND THE BASELINE THIS ROW ASKED FOR WOULD HAVE BEEN BLIND** — `slab.keys`, whose whole subject is a floor with a thickness, keys the world a bare `verb raise` keys, because a slab is a SESSION record like a prop; deleting `verb hole` from it leaves the saved bytes **identical** and moves only `holes 1 -> 0`. ⚠ **And the session digest is COUNTS, not geometry**, so the gestures' printed sentences are the third instrument and the only one that can see a wrong number in a right-looking sentence — `K3`'s `J`/`E`/`B` findings were three of those. ⛔ **Row D is `K3c`'s collision made permanent**: the groups are computed from the run and asserted, so *thirty scripts have a baseline* can never read as *thirty subjects are covered*. ⏭ The hole it cannot fill is now measured rather than promised — `K3f` · 8 sabotages red, 0 missed, plus a row that must stay **GREEN** and does |
| **`K3f`** — the five camera scripts are checked by nothing, and no headless baseline can be their check | S | ⚠ it must go red on a camera MODE change — the edit `probe/k3d`'s `blindcam` row proves is invisible | ⛔ **FOUND BY `K3d`, and it is a measurement rather than a suspicion.** `ceiling`, `cutaway`, `eyes`, `floorprobe`, `indoors` and `lamp` raise ground, place a house and spend every remaining line on `send 40:` modes, `send 3:` looks, `snap` and `frame` — so all six leave the **same world and the same session, to the byte**. ⚠ **Only `indoors` has a check that can see a camera** (`camera_indoors.mjs`): `cutaway`, `eyes` and `floorprobe` are run by `probe/k3c` row B, which asserts **`rc = 0` and nothing else** because they are that row's control, and `ceiling` and `lamp` were run by nothing at all. `probe/k3d`'s `blindcam` row turns CUTAWAY into FOLLOW in `cutaway.keys` and requires the probe to stay green, which is what makes this row's existence a fact. ⏭ Wants a picture gate per script (a server, a browser, `frame` thresholds) — the shape `camera_indoors.mjs` already has, and `CUTAWAY`/`EYES`/the head-lamp each have their own claims in [CAMERA_INDOORS.md](../../doc/claude/CAMERA_INDOORS.md) |
| ✅ **`K3c`** — `send` of an **authoring** id must not be silently dropped | S | ⚠ the ten scripts must go RED where they run headless — that is the deliverable, not a regression | **DONE 2026-08-16.** Default **deny**: `send_quiet` names the ids known to change nothing and everything else fails the run; `ground` — the one authoring message this runner can honestly perform — is performed on both spellings. ⛔ **The drop was visible as a COLLISION and nobody had looked**: six scripts keyed **`32952:3318286153` at τ 3813**, and `plane.keys`, whose whole subject is the floor it stands on, was byte-identical to a script that does nothing but raise a hill. ⛔ **This row's own claim about `44:` was too strong** — measured over the corpus, **no live script performs an authoring gesture inside part mode**, so the corruption is *latent* and the live loss is that five part scripts become one world. ⛔ **The class letter is a hint, not the rule**: `9` LOAD is filed **R** and replaces the store, `7` PLACE is filed **X** and moves the datum every gesture reads — a letter whitelist waves both through, which is why the list is ids. ⛔ **AND PERFORMING `ground` FOUND A LIBRARY DEFECT TWO LAYERS DOWN**: `world_file_size` never counted the `GRND` section, so `world_save` answered **`WS_IO` — the bytes did not reach the disk** over a file it had written perfectly · `make probe-k3c`, **in `make fast`** · 6 sabotages red on their own claims, control green · corpus diff exact: 8 scripts 0 → 101, `plane` moved, **30 of 38 unmoved** |
| ✅ **`K3e`** — a line that MOVES THE AUTHOR must not be silently dropped either | S | ⚠ **the count, not the failure** — `deck.keys` has exited 101 since `K3c`, so *deck fails* was already true | **DONE 2026-08-16.** `hold`, `keys` and `turn` are remembered rather than skipped, and `verb` — the one word applied AT the author — refuses when a movement has not been cleared by an `at`. ⛔ **THE OBVIOUS ROW COULD NOT HAVE FAILED.** This row's own verify said *it must go red on `deck.keys`*, and `deck.keys` was already red: `K3c` refuses its `send 6:`. The assertion is the **complaint count, 2 → 3**, and which line the third names. ⛔ **AND THE FENCE POSITION IS PRICED RATHER THAN ARGUED.** The sweep's `atarrival` row builds the cheaper design — refuse the movement where it arrives — and it passes A, B and E: what it costs is `cellar.keys` **2 complaints → 10** and `fall`/`determinism` failing outright, because three of the four live walkers teleport afterwards. ⛔ **The line named is the FIRST since the last `at`, not the last** — a walk is a block (`keys 1`, `step 90`, `keys 0`) and naming the last points at what STOPPED a 90-unit walk; `lastnotfirst` keeps the exit code and destroys the diagnostic. ⛔ **My own probe's count was off by two and said so in its own words** — `editor_run: ` is the prefix of a complaint *and* of both summary lines, so the arithmetic form printed `printed 3 complaints, not 3`. ⛔ **And the sweep's `|` delimiter collided with the `||` in the line it was sabotaging** — caught by the row's own did-it-apply guard rather than scored as a miss · corpus diff exact: **35 of 36 scripts unmoved**, `deck` alone moved · `make probe-k3e`, **in `make fast`** (49 s) · 6 sabotages red, 0 missed, control green · `make parts` byte-identical · `make headless-same` rc=0 · `probe/k1` green |
| ✅ **`M1`**+**`M2`** — the binding as DATA (`KeyMap`), and the verb bar that draws it | S | **DONE 2026-08-15.** `verb_of`'s chain kept as an independent body and the whole key universe driven through both. ⛔ **Three of the toolbar's six hotkey glyphs had been wrong on screen for months** — a literal is connected to nothing that can disagree with it. ⛔ **And three of this work's own instruments could not fail**, all three found by looking at the picture | ✅ Done |
| ✅ **`M3`** — rebinding from the editor: arm, pick a slot, press a key | S | **DONE 2026-08-15.** `hex_editor::Rebind`, two fences in the client, `make probe-demo` `M1`–`M6`. ⛔ **The row it turned out to be about was not the collision one**: a POLLING editor fires the verb it has just bound, because the completing key is still down on the next frame — and that raise is correct in every particular. ⛔ **The map is not the whole keyboard** (8 client keys outside it, invisible to `keymap_bind`). ⛔ **The driver had been turning `5` into code 85** since it was written, and digits are the only free keys there are. ⛔ **`probe/b1b/auth.sh` B9 had been RED since `B1c.1`** — measured on the pre-`M3` commit before it was blamed on anything · hex_editor keymap 15 → 28 tests · 4 library + 3 demo sabotages red · `make probe-auth` 36 → **37 PASS** | ✅ Done |
| ✅ **`M4`** — delete `verb_of` | XS | **DONE 2026-08-15.** The suite reads **522 → 522** and that is the wrong instrument: the **test-name diff** is 6 lines, 1 deleted, 1 added, 4 renamed with the claim change written on each. ⛔ **The row that said it caught *built and never called* never could** — measured on the pre-`M4` tree, an arm in `press_verb` reachable from no key left the suite at 522 passed. `the_vocabulary()` replaces it, **with the case it still cannot see written into the test**. ⛔ **The deletion silently disarmed four sibling sweeps** — all four sed'd the deleted chain, and only the two whose subject guard happened to NAME the binding said so; the other two printed *NOTHING went red*. ⛔ **And a sweep piped through `head` left its sabotage in the tree**, because the trap had no `PIPE` · `sh probe/k2/sabotage-m4.sh` 5 red + 2 controls · `make lib-test` **3624 both backends** · `make fast` 156 files · `make gate` 49 · `make parts` byte-identical | ✅ Done |
| ✅ **`M5a`** — a fresh-press requirement for the scan | S | **DONE 2026-08-15.** `rebind_scan` is the rising edge the hardware does not have — `gl_key_pressed` answers *is it down*, so it is built from two looks, and **the first look SEEDS rather than fires**: the machine arrives in the middle of a keyboard it has never seen, so *unknown* has to read as *was already down*. ⛔ **A row I wrote could not fail, and the sweep is what said so** — the mis-click row was green under all five original sabotages, because a reseed makes the held key stale too; the falsifiable direction is the opposite one. ⛔ **And the obvious symmetry was refused on paper**: `rebind_pick` reseeding looks right and swallows a genuine press, so arming is the only place the memory is dropped. ⚠ **The driver could not say the sentence** — `+key`/`-key` in `probe/b1b/press.mjs` is what holds a key across a click · hex_editor keymap 28 → **36 tests**, suite 522 → 530 · `sh probe/k2/sabotage-m5.sh` **8 rows, 6 red on their own claim, 2 clean controls** · `make probe-demo` `M7`+`M8`, `DEMO_SABOTAGE=nofresh` red on `M7` alone | ✅ Done |
| ✅ **`M5b`** — persist a rebind (`LayeredFS`) | S | **DONE 2026-08-15.** `keymap_delta`/`keymap_apply` over `keymap_save`/`keymap_load`; the client loads at boot and writes on every bind. ⛔ **My own claim for it was too strong, and the test I wrote passed for the wrong reason** — *a verb the editor GAINED keeps its key* is true of a whole-table file too, because applying assigns per named verb. What only a delta earns is the **editor's freedom to MOVE a default**: a whole table pins all fifteen verbs to the layout of the day it was written, including the fourteen the author never chose. ⚠ **The absences are recorded, worked on paper first** — a document of only the keyed non-default rows leaves a verb on a key its owner lost two gestures ago. ⛔ **And the sabotage for that went red through the COLLISION guard**, not through its own claim: a document missing an absence puts two verbs on one key, so the rule is enforced twice · keymap **36 → 45 tests** · `sh probe/k2/sabotage-m5b.sh` **8 rows, 6 red on their own claim, 2 clean controls** · `make probe-demo` `N1`–`N3` over a page RELOADED mid-run | ✅ Done |
| ✅ **`B4`** — **the page's WORLD outlives the tab**: `world_save` on the edit clock, `world_load` on the frame the authority moves | S | **DONE 2026-08-15.** The plan's goal sentence, and every piece of it existed with **nothing joining them** — `W1`'s codec, `P6`'s filesystem and `M5b`'s load-at-boot/write-on-change pattern, all green, all uncalled by any page. ⛔ **I wrote a safeguard the library already owned, and only the sabotage could say so**: seeding `st.py` on restore left **every check green**, because `fall_step`'s first branch stands a walker on ground above them — *"the CLIMB case"*, its own words, with `test_the_ground_rising_past_the_feet_is_the_climb` already in `lib/hex_editor/tests/fall.loft`. A consumer re-asserting a library invariant is code no check here can red; deleted. ⛔ **And the real consequence was one layer over**: `local_camera` reads `au_y` for eye AND aim and is re-solved **only on a turn**, so the pose rebuild is load-bearing and the page would otherwise look out from inside its own hill indefinitely — the instrument moved with it. ⛔ **And the seed had to be the boot world's clock on all three routes**, measured: a fresh world is at **tau 1**, so `0 - 1` made an untouched page write a whole world on its first frame — and made a page that could not READ a saved file overwrite it a frame later, destroying what a person came back to recover. ⚠ **`raise_ahead` lands 10 hexes AHEAD with radius 7**, so the fixture walks 40 steps BACK to put the dome over the origin — the only place a reopened page can measure · `make probe-demo` `O1`–`O4`, 3 sabotages | ✅ Done |
| **`T1`** — a type declares defaults and its own verbs, as DATA | M | ⚠ a declared type reproduces today's cottage **byte for byte** in `make parts` | Blocked on `K2` |
| ✅ **`B1a`** — the client's key table names a **VERB** — `W4`'s fourth site | S | **DONE 2026-08-13.** `make probe-b1a`: the real client page driven by a browser against a fresh server, beside a committed baseline of itself. **7 sentences identical, world `82d622b3` identical.** Two sabotages red, each on a different instrument | ✅ Done |
| ✅ **`B1b.0`** — ONE world model: `ε`/`θ` are `hex_editor`'s, not each program's | XS | **DONE 2026-08-13.** `worlds/headless.hxw` moved to **exactly the md5 the pre-change experiment predicted**; `make parts` byte-identical, `make headless-same` rc=0, `make lib-test` 1600 both backends. One sabotage moves the runner AND the server | ✅ Done |
| ✅ **`B1b.1a`** — the client SAYS which authority it has | XS | **DONE 2026-08-13.** `make probe-auth`: 15 checks, **three** situations over one page build — a real server, a static server with no `/ws`, and a socket that opens and says nothing. Three sabotages, each red somewhere different; `make probe-b1a` unmoved | ✅ Done |
| ✅ **`B1b.1b`** — the authority becomes TWO: no socket → local, and a key WRITES | S | **DONE 2026-08-13.** `make probe-auth`: 28 checks. The page and `editor_run` at `GROUND=0` agree on the **world** (`32952:1545220309`) and on the **session** — two instruments, because a ring's trunk is in one and its edges in the other. Nine sabotages | ✅ Done |
| ✅ **`B1b.1`** — local mode holds a session, an author and its own world; a key WRITES into it | M | **DONE as `B1b.1a` + `B1b.1b`.** ⛔ Its boot switch could not be asked for — `host_input()` BLOCKS with no host, measured ([loft#891](https://github.com/loft-lang/loft/issues/891)) — so route 3 replaced it: connect-or-local, with the panel saying which |
| ✅ **`B1b.2`** — local mode DRAWS what it wrote (re-mesh on write) | S | **DONE 2026-08-13.** `make probe-auth` is 33 checks: a horizon where a page with no camera has only the clear colour, the picture holding still with nothing pressed, and the raise redrawing it — and the far ground unchanged, which is what separates a gesture from a camera. Meshing writes nothing: the digest is the same before and after (`hex_voxel` measured, 25 tiles) | ✅ Done |
| ✅ **`B1b.2c`** — the other eight surfaces: walls, roofs, fences drawn in local mode | **L**, measured | ⚠ `chunk_meshes_all` moves out of the server, or the page becomes the third place that knows what a chunk draws. **Sized: 32 functions, 1342 lines, 9 constants, and nothing else of the server's** | ✅ **Done in four** — `c.1`, `c.2`, `c.3`, `c.4a`–`c.4c` below. ⚠ This row read *"◐ `c.1` done"* for two days after the last of them landed: **a parent row is not updated by finishing its children**, and the plan is where that shows |
| ✅ **`B1b.2c.1`** — the five primitives the mesher needs, out of `moros_render` | S | **DONE 2026-08-13.** `make probe-emitters`: five `mesh_crc` pairs identical with a control, and the ambiguity error named all 10 server call sites so none could be missed | ✅ Done |
| ✅ **`B1b.2c.2`** — the five find their real home, and `moros_render`'s go | S | **DONE 2026-08-13.** ⛔ `c.1`'s home was WRONG: all five have internal `moros_render` users, so they could not leave — they are **`hex_proj`'s** now, the leaf both sides already depend on. 14 tests moved with them (moros_render 167 → 153, hex_proj 8 → 22, every row accounted for); 3 fixture-only tests build their own geometry | ✅ Done |
| ✅ **`B1b.2c.3`** — the props mesher itself, and `chunk_meshes_all` | L | **DONE 2026-08-13.** `make probe-mesher`: 49 tiles × 11 surfaces, **99 with geometry in them**, every one the same mesh. Both bodies live — the server's is `chunk_meshes_all_srv` until `c.4` | ✅ Done |
| ✅ **`B1b.2c.4a`** — the server drops its copy | S | **DONE 2026-08-13.** 41 declarations and 1,744 lines out of `src/editor_server.loft`; five call sites take `hex_mesh::chunk_meshes_all`. `make gate` **48 PASS / 0 FAIL**, `make parts` byte-identical, `make probe-b1a` world `82d622b37d1d` unmoved. ⚠ **`make gate` is SILENT when it passes** — rc=0 with an empty log reads exactly like a suite that never ran, so the count comes from `GATE_VERBOSE=1` | ✅ Done |
| ✅ **`B1b.2c.4b`** — the ramp and the slot are the library's; the server's two send paths become one | S | **DONE 2026-08-13.** ⛔ **Found a shipped bug doing it**: the chunk STREAM wrote the ramp as a literal `0` where the dirty FLUSH asked `surface_ramp`, so **water drew flat when a tile came into view and depth-ramped after any edit near it**. `tools/gates/world/water.mjs` is the first water gate and goes red on it — `flush [2]` against `stream [0]` | ✅ Done |
| ✅ **`B1b.2c.4c`** — the page draws all eleven surfaces | S | **DONE 2026-08-13.** `make probe-auth` is **36 checks**: `grass` at boot, **`grass,wall`** after the rings, and the world half changed again over them. `AUTH_SABOTAGE=groundonly` is red on those and **green on every other check in the file** — which is what *written, keyed and invisible* looks like from inside an instrument | ✅ Done |
| ✅ **`B1c.1`** — the TURN: `hex_editor` owns the held-key table, the rate and the step | S | **DONE 2026-08-13.** `make probe-demo`'s F block: `place` **refused at boot** (`rot 9 of 12, offer 8`), then turned, then **`place — 27 · world 41145:1306471549`** — the same key, the same page, refused and accepted in one run. 9 library tests, 3 sabotages red in different places; `DEMO_SABOTAGE=noturn` red on `F2b` alone | ✅ Done |
| ✅ **`B1c.2a`** — pay the arrow: `cliff` leaves `moros_sim` for `hex_editor` | S | **DONE 2026-08-13.** A debt written down in TWO places before it was paid — the file's own *target home* note and `stair_cut`'s *"taking the dependency would point the arrow backwards"*. Test-name diff exact: hex_editor **436/42 → 446/43**, moros_sim **313/26 → 303/25**, and `hex_edge` dropped from its manifest because nothing else in the package used it | ✅ Done |
| ✅ **`B1c.2b`** — the walk itself: `hex_editor::walk`, and the server drops its copy | M | **DONE 2026-08-13.** 8 functions and `SKIN` moved verbatim; the server is **7743 → 7400 lines**. ⛔ **The blocker did not apply** — `walk_to` never calls `ground_under`; only the FALL does. Diffed body by body against the previous commit: **17 changed code lines, all three deltas named**. `make gate-character` 8/8 with every number identical (`climbed 0.492`, `peakReached 0.497`, `fenceAt 6.062`) | ✅ Done |
| ✅ **`B1c.2c`** — the page walks | S | **DONE 2026-08-13.** `make probe-demo`'s G block: **walked 2.454 units to (2.454, 0)**, and the house it then places is **`32920:1885399240`** where the same house standing still is `41145:1306471549`. ⚠ The verdict is the WORLD, not the distance — a pose nothing reads would report a distance too. `DEMO_SABOTAGE=nowalk` lands exactly F4's world | ✅ Done |
| ✅ **`B1c.3`** — the FALL | M | **DONE 2026-08-14.** `ground_under` → `hex_mesh` (the cycle, paid on the side that owns the interpolation), `fall.loft` → `hex_editor` as `FALL_GRAVITY`/`FALL_TERMINAL`. `make probe-demo`'s H block: the feet leave the ground plane and **a fall COMPLETES**, with the flat-ground G run as the control at `feet 0 landed 0` | ✅ Done |
| ✅ **`P6`** — does a `--html` page have a FILESYSTEM, and does a world saved in it survive a reload? | XS | **RUN 2026-08-13 — it holds**, `make probe-p6`. 21 `fs_*` names against the design's 0 of 20; `pass2 ok` over http AND `file://`; the base tree reads as the interpreter's directory; `P6_SABOTAGE=persist` seen red | ✅ Done |
| ⛔ **`W5`** — `lavition_host`, the interim storage shim | S | — | ⛔ **CANCELLED by `P6`** — its own escape clause fired |
| ✅ **`B2`** = **`B3`** — `tools/build-pages.mjs`, `_site/`, and the check that opens it | S | **DONE 2026-08-13.** `make probe-demo`: `_site/index.html` over `file://` with no listener at either end — boots, goes local in 180 dials, draws (world **5 colours** over the horizon against a 303-colour panel control), holds still, and `ArrowUp` **writes** (`local raise — 1 · world 16502:374721773`). Two sabotages, red in different places | ✅ Done |
| ✅ **`B2b`** — connections to potential servers: the socket URL is a LIST, and the extra candidates are DATA | S | **DONE 2026-08-13.** `make probe-demo`'s E block, **3 runs of which 2 are controls**: a demo opened from a DISK attaches to an editor it was told about (`connected to 'ws://127.0.0.1:19555/ws'`, with the listener's own `UPGRADE COMPLETED` as the non-circular half); with nothing listening the same page reaches that candidate and goes local; and a page nobody told never dials the port **with a server sitting on it** | ✅ Done |
| — | | ⏭ **THE CLIENT IS TESTABLE HERE. Nothing below starts before this line.** | |
| **`C1`** — the sampler probe: `surface_h_at` as a `fn(…)` parameter, camera pixel-identical | XS | `camera_indoors` still `subject 0.0188` | Deferred |
| **`C2a`** — `lib/hex_cam/` holds a COPY of the routines, with its OWN tests | S | ⚠ passes the lower bound because those tests are real geometry that can be surprised — unlike a declaration checked against itself | Deferred |
| **`C2b`** — the server calls the library copy; the private originals stay until it is green | S | ⚠ `camera_indoors` at `subject 0.0188`, unmoved — then the originals are deleted | Deferred |
| **`C3`** — the page client takes the camera | S | indoors works in local mode | Deferred |
| **`C4`** — hand `hex_cam` to crawler | S | ⚠ **needs a word first** — see below | Deferred |

## Cross-repo coordination

| repo | owns | what "done" means |
|---|---|---|
| **`loft-lang/loft`** | the `--html` shell | ✅ **DONE.** [#851](https://github.com/loft-lang/loft/issues/851) — bind the `fs_*` contract the wasm host already defines, `LayeredFS` backing it — closed and merged `28e85b42`, and **verified against the installed toolchain** by `make probe-p6` on 2026-08-13. `W5` was never built. ⚠ The rule that produced this: *wait for a toolchain rather than build around it*, and then **measure the toolchain rather than the changelog** |
| **`crawler`** | the third consumer of the camera | **read-only from here.** They declare `hex_field`/`hex_edge` and **no `hex_voxel`** — which is what forces `hex_cam` to take a height sampler rather than a world. ⚠ A shared package means `loft-libs-*` or the registry, and **a published package is one of the three things this tree does not do without asking** |

## Open questions

1. **Where does `hex_cam` live once crawler takes it?** `lib/hex_cam/` is where it is *built and
   verified*; it cannot stay there once a sibling consumes it. `loft-libs-world` is the obvious
   home — and adding a public name there can turn crawler red with no local edit, so grep first.
   *Not decided; `C4` is the step that asks.*
2. **Does the demo ship the whole part library, or a starter set?** `data/parts/` is 23 files and
   inlining it costs page weight the quick start pays on every open. *Wants a number from `B2`,
   not an opinion.* ⚠ **`P6` narrowed it without answering it**: the mechanism is settled — a
   `globalThis.loftBaseFS` object inlined ahead of loft's script, which the page reads exactly as
   the interpreter reads a directory — so this is now a question about **weight only**, and `W2`'s
   *fetched manifest* is off the table entirely.
3. **What does local mode do about the walk?** The server has a tick and a walker; `editor_run`
   teleports and says so. The page reuses the client's existing walk — **unverified**, and the
   design names it as the honest place its invariant may be false.

## ✅ What `D1` turned up (2026-08-17) — the verify was a self-test, and the corpus caught what the tests could not

**Built:** `hex_editor::mode_at(sess, w, a)` → `MODE_OUTSIDE` · `MODE_INSIDE` ·
`MODE_UNDERGROUND`, derived from one reading of the world and **consulted by no gesture**;
`Shelter` gains `sh_fabric`; `src/editor_run.loft` logs the mode **on change**, from two places;
`lib/hex_editor/tests/mode.loft` (9 rows); `probe/k2/sabotage-mode.sh`;
`tools/scripts/threshold.keys`.

### ⛔ The row's own verify could not have failed, and the design is what made it unreachable

The phase table asked for *"the derived mode never contradicts `shelter_at` over a whole scripted
scene"*. [EDITING_MODES](../../doc/claude/EDITING_MODES.md)' own rule, four sections above that
row, is **do not add a second enclosure test** — *"a camera that thinks it is indoors while the
verbs think it is out is the disagreement this rule exists to prevent."* Honour it and `mode_at`
*reads* `shelter_at`; the contradiction is then unreachable by construction, and the parallel run
the row promised is a tautology.

**This is `K3e`'s finding one phase over**, and it arrived the same way: the obvious verify was
written against the shape of the change rather than against what the change could get wrong. What
is actually falsifiable is the half the row never named — **a cave and a room BOTH answer
`sh_inside`**, so the question is which of the two sheltered modes, and nothing in the original
verify touches it.

### ✅ Open question 2 answered, and the classification already existed

*What is "underground"?* was left open in the design — *"a real boundary and it is not decided
here."* The elevation reading (*below the surface*) needs a datum that does not exist for the case
it has to judge: an author at a tunnel mouth is standing **on** the surface. So the rule is what is
**overhead**, and `ground_kinds()` has carried the classification since plan 20 `A1`:

> no cover → `outside` · the nearest cover is `tr_fabric` → `inside` · otherwise → `underground`

⚠ **NOTHING NEW CLASSIFIES ANYTHING**, which is what keeps the mode from becoming a second opinion
about the world — the same reason it reads `shelter_at` rather than sweeping again.

✅ **AND THE DOC'S OWN *"inside wins"* SENTENCE STOPPED NEEDING A RULE.** It says an author in a
cellar is under a roof AND below grade and that `inside` wins — a precedence the elevation reading
would have had to encode. Under this one there is nothing to arbitrate, and the pair is the
strongest row in the suite: **a cellar under a house is `inside`, the same `storey -1` in a bare
meadow is `underground`**, and the only difference between the two worlds is what the ceiling is
made of. A mode that read *below grade* answers `underground` for both; a mode that read *sheltered*
answers `inside` for both.

### ⛔ The first derivation counted the author's own ground as cover — and the CORPUS said so

Not a test. `probe/k3d`'s record over the live scripts, on the first run after the log existed:
**`profiles.keys` reported `mode underground` for an author teleported onto the flank of a raised
dome, in the open air.** Fifteen records moved and seven of them were this.

The feet ride the interpolated heightfield, so on any slope they sit below their own cell's stored
height; truncated to units they are strictly under it, and the cell they are standing on satisfies
*is there a cell above me*. ⚠ **`walk.loft` had already written this down, for the stair** — *"the
reference is the surface the walker stands on, never its feet … the difference cost this rung a
working stair."* `mode_at` takes `walk_h` now, which is also what stops the mode disagreeing with
the walk about which storey a person is on. With it, the 15 moved records became **8, every one a
real crossing**.

### ⛔ The tick call was built, reachable, correct — and observed by nothing

`sabotage-mode`'s two corpus rows disable each call site in turn against all thirty scripts:

| row | records moved |
|---|---|
| `noline` — the mode is not read after a script line | **1** — `house.keys`, the only script that teleports with no `step` after it |
| `notick` — the mode is not read inside a tick | ⛔ **0** |

**Every mode crossing in the corpus is a teleport.** The branch written for a person *walking* into
a building was this tree's commonest defect, manufactured inside the step that built it — and the
sweep is the only thing that could have said so, because both call sites print the identical line
and the record cannot tell which one produced it.

`tools/scripts/threshold.keys` is the walk: a deck, a station outside it, in on `keys 1` and back
out on `keys 2`. `notick` is red on that script alone now. ⚠ **A deck rather than a house, and that
was measured** — walking at a house stops the feet at its own wall (`0,-2.26`), and cutting an
opening in that wall first does not let the walker through either.

### ⛔ `mode_name` collided with the server's, and `make fast` was green for the whole hour

`src/editor_server.loft` has had a private `fn mode_name` for the CAMERA settings since
`CAMERA_INDOORS`; a package's public name shares one namespace with a consumer's private ones, so
adding `hex_editor::mode_name` stopped the server compiling — *"Cannot redefine 'mode_name'"*.

⚠ **What it cost is the schedule, not the name.** `make lib-test` (both backends), `make fast`,
`make parts` and `probe/k3d` were all green with the server unbuildable, because **nothing in those
tiers compiles either program under `src/`**. The one check that noticed was `make headless-same`,
and it **presented as a 30-minute hang**: the target waits for `listening on port` in a log that a
build failure never writes. *A build failure that presents as a hang is not a build failure anyone
reads*, and it is the `make fast` blind-spot finding from 2026-08-16 in a second location — that
one was the browser, this one is the server.

The camera's is `cam_mode_name` now: it is the more specific fact, this file already prefixes
camera state `cam_`, and the rename is one line and one call site.

### ⛔ And the sweep reproduced two of this tree's own instrument defects inside an hour

| what happened | the guard that exists now |
|---|---|
| `sed -i 's\|…\|\|…'` on a line containing `\|\|` — the delimiter collides, sed answers *unknown option to `s'*, the file is **untouched**, and the row prints **NOTHING went red**. `K3e` recorded this exact failure on 2026-08-16 | `applied_in` — every row that edits a file asserts the file **changed** before it is scored |
| the `notick` row deleted the call, which left `last: &integer` unused; **loft refuses that**, so `editor_run` did not build and **all thirty records moved by tens of lines**. Over a corpus instrument a broken build reads as *the strongest possible catch* | `corpus()` compiles the runner against one script first, and the sabotage is `if false { … }` rather than a deletion |

⚠ Both were caught by the sweep's own bookkeeping rather than by reading the output — which is the
argument for a sweep having bookkeeping at all. A row that reads *nothing went red* and a row that
reads *everything went red* are both silent about whether anything was asked.

### What it does NOT claim

⛔ **`sh_fabric` reaches no consumer.** `shelter_room` carries it through for the server's camera and
nothing reads it — the `blindroom` sabotage drops the field and **every row stays green**, which is
recorded as a required-to-pass row rather than left as an absence. `D2` is what gives it a reader.

⛔ **The tunnel-mouth boundary is placed, not proven.** A cave open to the sky reads `outside` until
rock is actually overhead. Whether the tunnel verbs should reach a hex further out than the rock
does is a `D2` question.

⏭ **And `D1` handed `D2` a fact it has to answer.** `house.keys` cuts its two openings from two
different modes — its own comment describes both stations as *"stand ON the wall's own cells"*, and
the log says the first is `inside` and the second `outside`, straddling the roof plan's rectangle.
Under `D2`, where `inside` is what grants the opening verb, **one of those two lines stops working.**

## ✅ What `K3d` turned up (2026-08-17) — the debt's own list was stale, and the baseline it asked for was blind

The deliverable is [`probe/k3d/`](../../probe/k3d/README.md): one record per live script at
`GROUND=0`, diffed against a committed baseline, `K3D_BLESS=1` to re-record with the diff shown
first. 30 scripts, 17 s in a pool of six, **in `make fast`**.

### ⛔ The list of ten was stale in both directions, and eight of the fourteen look covered

`K3b`'s row named `annex` `door` `embrasure` `furnish` `house` `niche` `opening` `profiles`
`determinism` `slab`. Measured by grepping every check in the tree for each of the thirty script
names: `house` (`probe/t3`, `probe/p6`, the Makefile), `determinism` (`walk-exact`, `probe/t3`)
and `slab` had gained something since, and **five scripts nobody had listed** — `ceiling`, `face`,
`fall`, `hut`, `lamp` — were in exactly the position the row described. What is RUN by nothing is
**fourteen of thirty**.

⚠ **And *named* is not *run*, which is the half that makes this hard to see.** Eight of the
fourteen are named somewhere: in a doc, in this plan, in the journal, in another script's prose,
or in a comment inside a loft test — `lib/hex_editor/tests/session.loft` opens its annex section
with *"`annex.keys` — what an annex hangs on, and the two ways it has been wrong"*. Nothing
executes any of them. **A grep for the name finds a paper trail and reads exactly like coverage.**

### ⛔ The row asked for a world-key baseline, and this file had already predicted why it fails

The `K3c` section above says it outright — *"a world-key baseline taken over the ten un-gated
scripts a day earlier would have committed one identical world for four different scripts and read
as coverage"*. Measured again at `K3d`, and one row is worse than a collision:

| deleted from a live script | the saved world | the session digest |
|---|---|---|
| one `verb run` from `wall.keys` | `59abe82b…` → `712bceee…` | `runs 5` → `runs 4` |
| `verb hole` from `slab.keys` | **`a7da870f…` — identical** | `holes 1` → `holes 0` |

**`slab.keys`, whose entire subject is a floor with a thickness, keys the world a bare `verb
raise` keys.** It is not broken — a slab is a **session record** like a prop or a seat, not a
store write. So the record is a PAIR, and row C sabotages each half separately: one row proves the
store half has teeth, and the other proves the session half does *with the world identical either
way*.

⚠ **AND HOW FAR THE BLINDNESS GOES WAS MEASURED RATHER THAN ASSUMED — TWO OF FOUR GUESSES WERE
WRONG.** One gesture deleted from each of four more scripts, all with distinct worlds:

| script | gesture deleted | the saved world | the session digest |
|---|---|---|---|
| `annex` | its last `verb seat` | **identical** | `props 2` → `props 1` |
| `furnish` | its last `verb seat` | **identical** | `props 2` → `props 1` |
| `niche` | its third `verb opening` | `8a5286ca…` → `c4d56adc…` | `openings 3` → `openings 2` |
| `seat` | `verb place` | `ee319fa0…` → `f898e202…` | `runs 8` → `runs 4` |

The world is blind exactly where a **session registry** carries the result — `slabs`, `holes`,
`props` — and sees an opening or a house perfectly well, because those write cells. ⚠ `niche` and
`seat` were expected to be blind and are not, and **`seat.keys` does not press `verb seat` at
all**: its subject is a house being *seated* on a slope. A name is not a claim.

### ⚠ The session digest is counts, so the sentences are a third instrument

`slabs 1 holes 1` says nothing about the height the slab landed at, and `openings 2` nothing about
a window's spring or depth. The gestures' own printed lines are the only place those numbers
appear, and a **wrong number inside a correct-looking sentence** is not hypothetical here: `K3`'s
`J`, `E` and `B` rows each found a handler passing a global height scale where the world's own unit
belongs. `saysentence` is the sabotage for it — the slab's reported thickness becomes a literal,
and it reds `slab` **alone**, with the world and the session unmoved.

⚠ **Two things are deliberately NOT in the record.** The `--- ` echoes, because a script's own
comment played back is the script's input and an instrument that reads its input can be surprised
by nothing. And the script's **line count**, which `editor_run` prints beside τ: these scripts are
documentation as much as fixtures, and a baseline that reds when somebody adds a comment gets
blessed reflexively — a check that is blessed without being read is not a check.

### ⛔ Row D is `K3c`'s collision made permanent, and it fires in both directions

The groups are computed **from the run** and asserted against a committed list, so *thirty scripts
have a baseline* can never be read as *thirty subjects are covered*. ⚠ **And the `noselect`
sabotage reds D in the direction nobody designs for**: `door` and `opening` are a known identical
pair, so changing one makes the pair **stop existing** — a report that only noticed new collisions
would have let the group list rot into a description of a corpus that had moved on.

### ⏭ The hole it cannot fill is measured rather than promised — `K3f`

`ceiling`, `cutaway`, `eyes`, `floorprobe`, `indoors` and `lamp` are one house on flat ground and
then nothing the store or the session can see. `blindcam` turns CUTAWAY into FOLLOW in
`cutaway.keys` — the whole subject of that script — and requires this probe to stay **green**.
That is why the coverage claim is a scored row and not a paragraph.

### ⚠ Row 0 caught itself, and two of the sweep's own labels were wrong

The subject-present guard was written with anchors and `grep -qF`, so six of its seven patterns
read as *absent* — `-F` takes `^verb place$` literally — and the sweep **refused to run** over a
tree where every anchor was present. It failed safe, which is the direction to fail in, and it is
`CLAUDE.md`'s *a grep is an instrument whose default answer is absent* firing inside a guard
written for that rule.

⛔ **And the sweep's output is the record of what was checked, so a wrong label is a wrong
record.** One row was written as *`B`: a baseline file removed* and does two different things: a
**mutilated** baseline is a diff and reds **A**, while only a **missing** file reaches B's set
comparison. They are `basedamaged` and `basegone` now. The probe had the same shape of fault in
row C1's own message — the branch fires either when `wall.keys` loses its `verb run` line or when
the fixture's `awk` stops matching, and it blamed only the script, which would have sent the next
reader to the wrong file.

⚠ **The concurrency hazard was designed out rather than locked out.** This probe is in `make fast`
and its own sweep runs it nine times, on a box that carries other agents' work — so every run's
worlds carry its pid. `probe/k2b` had two copies of itself sharing `worlds/k2b-a.hxw`, where a byte
comparison could pass on a world the other process built; a lock directory would fix that and then
outlive a killed run, which is how it becomes a file that refuses every future run.

## ✅ What `K3a` turned up (2026-08-15) — the driver could not tell a typo from a word it skips on purpose

**`K3` was written as a deletion and it could not be one.** The row said the price was retiring
some baselines. The actual price was one layer down, and measuring it is what found it.

⛔ **A LINE THIS RUNNER DID NOT UNDERSTAND PRINTED A COMPLAINT AND EXITED 0.** `run_line` has
returned `false` since it was written; `main` looked at the answer only to print the offending
line, then carried on and returned normally. So `editor_run` could lose a gesture and still
report success — and deleting the `key` branch would have dropped every stale `key H` into
exactly that hole. The measurement, before anything moved:

| | |
|---|---|
| scripts printing `unknown command` through `editor_run` | **25 of 55** |
| the distinct words | `send mesh frame meshr feet cam last until ground` — **nine** |
| what the run did about it | printed, carried on, **exit 0** |

⚠ **AND THE SKIP LIST'S STALENESS WAS INVISIBLE BY CONSTRUCTION.** It is documented as *"skipped
rather than refused, so one script serves both"* and it named nine words. Real scripts use nine
more — and a word the list forgot is reported in **the same sentence** a typo is. There was no
observation that separated *not my vocabulary* from *not a word*, which is why nobody noticed
`send` appearing in 22 scripts.

### ⛔ Nine words, and they are not one kind — `send` is an A wearing a V's clothes

Six of the nine are picture and timing — `mesh`, `meshr`, `frame`, `cam`, `feet`, `last`, `until`
— and not one writes a cell, so a script really does serve both drivers across them. **`send`
does not belong with them.** [WIRE_PROTOCOL](../../doc/claude/WIRE_PROTOCOL.md) sorts every id
into **A** (*authoring — survives as a store write*), **V** and **S**; `send` is whatever it
carries, and ten scripts carry an **A**:

| id | | what the runner drops |
|---|---|---|
| `6` LEVEL, `10` ROAD | modes | what **every gesture after them** builds |
| `47` WATER | cells | the cells themselves |
| `44` PART | **the store** | ⛔ `doorparts.keys` opens **six parts that never open**, so every edit between them lands in the main world and each close discards nothing |

⚠ **`ground` IS THE SAME MESSAGE UNDER A FRIENDLIER NAME** — `script.mjs` compiles it to `50:`,
and `world_set_ground` decides what every unwritten cell *means* (`E1γ`). Splitting the two words
across two lines would have been arbitrary. Both are on the skip list **named**, as a known drop
rather than an unnoticed one — `W4`'s `KEYMAP` wording, and the same reason. Fixing it is `K3c`,
because it reds ten scripts wherever they run headless and that is a cost to pay deliberately,
not to smuggle into a step about vocabulary.

### ⛔ And the control found a second class of `false` I had not separated

The corpus run after the change failed **9 of 50** source scripts — and none of them for an
unknown command. `said_ack` returns `false` for `PR_NONE` too: *"no gesture for P"*, which is
`S3`'s eight collapsed keys. Two different failures behind one boolean, and the assert caught
both. That it caught them is right — a script asking for something that does not happen should
not exit 0 either — but the nine are **precisely** `probe/k1`'s `keyed.keys` and 8 of
`probe/k2/orig/`'s twelve. **The assert reds exactly the vocabulary `K3b` retires and nothing
else**, which is the retirement arriving early on its own evidence.

### ⛔ `probe/k1` has been RED since the opening keys collapsed, and I measured that before blaming it

Checks `A` and `B` fail: `keyed` builds **openings 1, τ 3994** where `verbed` builds **openings 2,
τ 3995**. `key P` is one of `S3`'s dead keys, so the keyed fixture silently loses an opening.

⚠ **Measured on HEAD with the change absent, under the probe's exact conditions** — no `GROUND`
override, same worlds — *before* it was attributed to anything. Same numbers. **`probe/k1` was
already red**, and `probe-verbs` is in neither `make fast` nor `make gate`, which is how it
rotted unnoticed. This is `probe/b1b/auth.sh` B9 (*"RED since `B1c.1`"*) a second time, and the
lesson holds a second time: **a manual probe is an instrument nobody reads**.

⚠ **AND `git checkout -- <file>` WAS REFUSED WHILE DOING IT**, which is this tree's own sweep rule
enforced by the harness. The baseline was taken by writing `git show HEAD:…` to a file **beside**
the original — `source_dir()` resolves `../data/parts` and `../worlds`, so a copy in a temp
directory would have measured a different program — and removed after.

### What it does NOT claim

- ⏭ **The assert fires after the save, deliberately.** Failing earlier would leave
  `worlds/<name>.hxw` holding the *previous* run's world — an artifact with no relationship to
  this run that reads as fresh. Saving first means the file, the digest and the world key all
  describe the same run; the exit code is what says lines were lost.
- ⏭ **It reports a count, not the first offender.** Every bad line is already printed above it,
  so one run shows a person all of them.
- ⏭ **`tools/script.mjs` is untouched.** Its unknown-command branch has the same shape and is
  `K3b`'s to answer, along with the `KEYMAP` its checks read by regex.

## ✅ What `K3b` turned up (2026-08-16) — a deletion's price is what it makes unrunnable, not what it removes

`key <K>` is gone from both readers. The diff that matters is not the two branches deleted;
it is the **three probes, four sabotage sweeps and one library claim** that were standing on
them, and only one of those was named in the row before the work started.

### ⛔ The deletion was not safe as written, and the reason was on the other reader

`K3a` made `src/editor_run.loft` fail a run on a word it did not understand. **`tools/script.mjs`
still had that defect** — measured against a real server before anything moved: `verb hoist`
rc=**0**, `hoist 1 2` rc=**0**, each with its complaint printed above it. Delete `KEYMAP` with
that in place and every stale `key H` becomes a silent no-op in a run reporting success, which
is exactly the state `K3a` was cut out as its own step to prevent on the first reader.

⚠ **AND THE CHECK THAT SHOULD HAVE CAUGHT IT WAS WRITTEN AGAINST THE WORDING.** `probe/k1` `E`
grepped for `no verb 'hoist'` — which a driver that prints and exits 0 produces perfectly. **A
check on what a program SAYS cannot see what it RETURNS**, and that is not a subtle distinction
here: it is the whole difference between a refusal and a report. Both halves assert rc now.

### ⛔ Three probes, and the third was not predicted

| | what it was | why it could not survive |
|---|---|---|
| `probe/k1` | `keyed.keys` against `verbed.keys` | a comparison needs two spellings |
| `probe/k2` | twelve scripts against `orig/`'s pre-conversion copies | the baselines are in the deleted spelling |
| **`probe/k2b`** | 31 scripts against `git show 0e2d48a:<path>` | ⛔ **the same reason, and this row did not say so** |

`probe/k2b` was found by running it: its baseline side built **nothing** (`session: runs 0`
against the converted side's real world) because every `key` line in a commit from two days
earlier is now an unknown word. ✅ **Its own vacuity guard is what reported it** — *"the label
map rewrote NOTHING over 31 script(s): the transcripts were compared without the presses in
them"* — which is what an instrument that can describe its own emptiness is worth. A probe
without that guard would have printed 31 green rows over two runs that both did nothing.

### ⛔ And a live claim was inside the wreckage

**A gesture does not move the standing selection.** `probe/k1` `D` asserted it directly and
`probe/k2` check 5 relied on it as a premise — it walks a converted script forward carrying the
last `select`, because `niche.keys` chooses once and cuts twice.

⚠ **Every test in `lib/hex_editor/tests/opening.loft` chose ONCE and cut ONCE**, so all
seventeen were satisfied by a gesture that CONSUMES its choice and leaves nothing standing.
Moved before removed: `test_a_gesture_does_not_move_the_standing_selection`, seen red on a
sabotage that resets the kind after each cut — **with the other 17 green**, which is what turns
*probably a gap* into *measured a gap*.

### ⏭ And one loss is real, so it is a row rather than a footnote

`probe/k2`'s stated reason for existing was that ten of its twelve scripts are **driven by
nobody automatically**. `cellar.keys` and `deck.keys` have real gates behind them; the other ten
now have no check that they still build what they built. That is `K3d`, and it wants a
committed world-key baseline rather than a second spelling — the thing that just retired.

⛔ **BUILT, AND BOTH HALVES OF THAT SENTENCE WERE WRONG.** The list of ten was stale in *both*
directions — `house`, `determinism` and `slab` had picked up checks since it was written, and
five scripts nobody had listed were in the same position, so what is RUN by nothing is
**fourteen of the thirty**. And a world-key baseline is exactly what `K3d` must not be: see the
row below, and § *`K3d` turned up* at the end of this file.

⚠ **What did NOT retire, and is stronger than what it replaced**: *a half-done conversion* was
four sabotage rows across four sweeps, each catching one script that still pressed a key. A
`key <K>` line now fails in **every** driver on **every** script, because it is not vocabulary
and an unknown word fails the run. The library halves of all four sweeps are untouched — six
rows red on their own claims in `sabotage-x`, control green, tree restored.

## ✅ What `K3c` turned up (2026-08-16) — a `send` is whatever it carries, and the drop was a collision nobody had looked at

`send` sat on `editor_run`'s skip list beside `snap` and `wait`. Those words are one
thing each; this one is as many things as there are message ids, and the runner
skipped all of them alike.

### ⛔ The loss was already visible in the world keys, for anyone who ran the corpus

Before anything moved, every live script through `editor_run`, keyed:

| world key | τ | scripts |
|---|---|---|
| `32952:3318286153` | 3813 | `doorparts`, `doorway`, `cache`, `slab`, `early_late`, `leaf_field` |
| `32952:115861739` | 3722 | **`plane`**, `probe/b1a/save` |
| `65788:1633256589` | 3909 | `ceiling`, `cutaway`, `eyes`, `floorprobe`, `indoors`, `lamp` |

**The third row is honest and the first two are the defect.** Six camera scripts over
one house really do build one world — that is what a camera script is. But six part
scripts collapse because everything that made them different was inside a `44:` that
never opened, and `plane.keys`, whose entire subject is the floor the world stands on,
was **byte-identical to a script that does nothing but raise a hill**.

⚠ **AND THAT MATTERS FOR `K3d` RATHER THAN JUST FOR THIS ROW.** A world-key baseline
taken over the ten un-gated scripts a day earlier would have committed *one identical
world for four different scripts* and read as coverage.

### ⛔ This plan's own claim about `44:` was too strong, and measuring it is what said so

`K3a` wrote, and the `K3c` row repeated: *"`doorparts.keys` opens six parts that never
open, **every edit between them lands in the main world** and each close discards
nothing."* Measured — a scan of every live script for an authoring line between an
opening `44:<name>` and a closing `44:` — **there is not one.** The only in-part `send`
in the corpus is `40:` (camera mode). The five part scripts are photograph scripts:
they open a part, move the eye, `snap`, and close.

So the live loss is the collision above, and **the corruption is latent**: the first
edit anybody writes inside part mode lands in the wrong store, silently, and no
instrument in the tree would say so. That is still worth refusing — but it is a
different sentence from the one this plan had been carrying, and the difference is
between a measured fact and a plausible one.

### ⛔ The class letter is a hint and not the rule — two ids cross it in opposite directions

The obvious implementation is *whitelist the non-A classes*. It is wrong twice:

| id | filed | what it actually does |
|---|---|---|
| `9` LOAD | **R** | replaces the whole store — the letter is about *map rather than read*, not about harmlessness |
| `7` PLACE | **X** | a character pose, *"not world"* — and it moves the datum every gesture reads |

So the whitelist is **ids**, enumerated with a reason each, and **the default is deny**:
an id nobody has classified — including one this tree has not invented — fails the run.
A classifier whose default answer is *harmless* is `CLAUDE.md`'s grep whose default
answer is *absent*, and it reports a clean result for every case it has never seen.

### ⛔ And performing `ground` found a library defect two layers down

`ground` is the one authoring message this runner can honestly perform —
`world_set_ground` is a call, not a tick — so it is performed rather than refused. The
first run said `code 3` on its save. `WS_IO`: **the bytes did not reach the disk.**

| | predicted | written | code |
|---|---|---|---|
| control, no ground default | 8277 | 8277 | 0 |
| subject, one ground default | **8277** | **8293** | **3** |

`world_to_bytes` writes `GRND` from the **field** `w_ground` (`G4` decided that
deliberately, so a default cannot be both a section and a field and disagree with
itself); `world_file_size` counted only `w_sections`. Sixteen bytes — one section
header and eight of payload — and the file was **perfectly correct**: `world_load`
read the ground back as 60/2.

⛔ **THE GUARD FIRED THE OPPOSITE WAY ROUND FROM THE FAULT IT WAS BUILT FOR.** `WS_IO`
exists because plan 17 `A7.3e` found a save reporting success over a file it never
created. This was a save reporting failure over everything it wrote — and a consumer
that believes the code tells an author their scene is lost while it sits on disk.

⚠ **NOTHING COULD SEE IT, AND THAT IS THE PART TO KEEP.** All three ground tests —
`ground_default`, `ground_read`, `fill` — round-trip through `world_to_bytes` /
`world_from_bytes`, which is the half that was always right. **Not one of them calls
`world_save`.** So `E1γ` shipped, was closed, was made normative in `WORLD_MODEL.md` —
and the only path with a size guard on it was never once asked about a ground. The rule
is `lib/hex_voxel/tests/file.loft` now, as a pair: the save, and the same world without
a ground as the control, because a test asserting only *both save* is green on a sizer
that ignores the ground in both directions. ⚠ **And the `8` is `SZ_GROUND` in all three
places now** — writer, reader and sizer — which is `SLAB_PAD`'s finding again: one
number under two names is how two of them come to disagree.

### ⛔ And `hold` / `keys` / `turn` are the same defect one word over — `K3e`

The skip list defends itself with *"not one of them writes a cell"*. True, and it was
never the question. They compile to `4:<bits>`, the server **walks**, and the character
is the datum every gesture reads — which is the exact argument that refuses `6:` LEVEL
two lines below them.

Measured over the live corpus, asking *is there a gesture after a movement with no `at`
between*: **one script is hit today.** `tools/scripts/deck.keys` walks 90 units under
`send 6:1` and then says `verb storey`, so the deck this runner builds is at the origin
on unlevelled ground — two drops at once, and only one of them is this step's.

⏭ **Left skipped on purpose, and the reason is where the fence goes.** Refusing `hold`
at the line reds every walking script, including the many where an `at` follows and the
drop is provably harmless. `CLAUDE.md`'s rule — *a guard where the thing arrives, a
fence where the value is USED* — puts it at the **gesture**: the runner knows the author
has moved in a way it did not model, and says so when something reads the author. That
is a different mechanism from this step's, so it is a row.

✅ **BUILT THE SAME DAY — see [*What `K3e` turned up*](#-what-k3e-turned-up-2026-08-16--the-rows-own-verify-could-not-have-failed).**
The guess above held and the price of the other design is now a number: a fence at the
movement costs `cellar.keys` **2 complaints → 10**.

### ⏭ The probe is in `make fast`, and pooling is what made that affordable

`probe/k1` was red for days and `probe/b1b` `B9` since `B1c.1`, both because
`make fast` and `make gate` ran neither. So `make probe-k3c` is in `make fast` — and it
had to get cheap first: eighteen runs in series is **38 s of which 29 s is loft starting
up eighteen times** (a one-line script costs 1.8 s, a real one 2.1 s). Launched as a
pool of six it is **7.5 s**, and `make fast` went 32.6 s → 49 s. ⚠ Every run owns its
own world name, which is `probe/k2b`'s finding: two copies of one probe shared
`worlds/k2b-a.hxw` and a byte comparison could have passed on a world the other process
built.

### What it does NOT claim

- ⏭ **No server is started, said rather than left quiet.** The runner's floor is not
  compared against the SERVER's floor. Both call `hex_voxel::world_set_ground` and the
  only thing that could differ is the parse, so the probe compares the **two spellings**
  against each other and the **sentence** against the server's own literal by grepping
  both sources. A `plane.keys` run through both drivers would settle it outright and
  costs a server start; that is not worth one for a four-line parse.
- ⏭ **The un-refused scripts' worlds are checked once here, not standingly.** The corpus
  diff was exact — 8 scripts `0 → 101`, `plane` moved, **30 of 38 lines unmoved** — and
  making that standing is `K3d`'s deliverable, not a second half-done copy of it.
- ⏭ **`probe/a83/leaf_visible/switch.sh` is untouched**, because its script is a heredoc
  driven only through a server. It is the tenth script and it never meets this runner —
  `K2b` found the same file the same way.

## ✅ What `K3e` turned up (2026-08-16) — the row's own verify could not have failed

`hold`, `keys` and `turn` sat on the skip list under *"not one of them writes a cell"*.
True, and never the question: `tools/script.mjs` compiles all three to `4:<bits>`, the
server WALKS, and the character is the datum every gesture reads — the exact argument
`K3c` used to refuse `6:` LEVEL two lines above them.

### ⛔ The verify this row was written with could not have gone red

The row said: *it must go red on `deck.keys`*. Measured before anything moved,
`deck.keys` **already exits 101** — `K3c` refuses its two `send 6:` lines. So a check
spelling *deck fails* would have passed on the previous commit, with the walk still
going quietly on the floor, and it could never have distinguished the two.

What is asserted instead is the **complaint count and the line named**: `deck.keys`
printed 2 complaints before and prints 3 now, and the third names `keys 1`. Row E of
`probe/k3e/run.sh` carries that reasoning in its own header, because the next person to
read it will otherwise simplify it back to the exit code.

⚠ **And `deck.keys` is now correctly declared un-runnable headless, which is a result
rather than a regression.** Its subject is *level the ground while walking*, so it needs
a server; the fix is not an `at` — that would teleport the walk away and destroy what
the script is for. It said the wrong thing silently before and says the right thing
loudly now.

### ⛔ The fence position is priced rather than argued

`CLAUDE.md`'s rule — *a guard where the thing arrives, a fence where the value is USED* —
picks the gesture, and the sweep is what makes that a measurement. `atarrival` builds the
other design (refuse `hold` where it lands) and it **passes rows A, B and E**. What it
costs, run:

| script | walks | complaints, fence at the gesture | fence at the movement |
|---|---|---|---|
| `cellar.keys` | 4, each followed by `at` | **2** (`K3c`'s two `send 6:`) | **10** |
| `determinism.keys` | 1, then `at`, then two `verb run` | rc **0** | rc **101** |
| `fall.keys` | 1, no gesture after | rc **0** | rc **101** |
| `deck.keys` | 1, then `verb storey` | rc 101, **3** complaints | rc 101, 4 |

Three of the four live walkers teleport afterwards, where the drop is provably harmless
because a teleport overwrites the author outright. **Row C exists for this and nothing
else** — a walk with no gesture after it must not be refused — and it is the only row the
cheaper design reds that the design taken does not.

### ⛔ The line NAMED is the first since the last `at`, not the last

A walk is a block: `keys 1`, `step 90`, `keys 0`. Naming the most recent movement points
`deck.keys` at its `keys 0` — the line that **stopped** a 90-unit walk — and says nothing
about the 90 units. `lastnotfirst` is the sabotage for it, and it is the shape worth
noticing: **the run still fails, so every check on an exit code stays green**, and what
is destroyed is the one thing a person fixing the script needs.

### ⛔ Two instruments were wrong before the subject was, and both said so themselves

- **The probe's complaint count was off by two.** `editor_run: ` prefixes a complaint
  *and* both summary lines (`editor_run: world …`, `editor_run: N lines, …`), so the
  arithmetic form printed **`deck.keys printed 3 complaints, not 3`** — which is what an
  off-by-two looks like when the number in the message and the number in the test come
  from different expressions. Counted by excluding the two summaries by name now.
- **The sweep's `sed` delimiter collided with the line it was sabotaging.** The subject
  is `if cmd == "hold" || cmd == "keys" || cmd == "turn" {` and the row was written
  `s|…|…|`, so the `||` ended the expression mid-word. ⚠ **The row's own did-it-apply
  guard is what reported it** — `??? onlykeys — THE SABOTAGE DID NOT APPLY` — instead of
  running the unmodified tree and scoring *the probe cannot see this*. That guard was
  written for `probe/k3c` after an extraction moved a line by two columns; this is the
  second time it has paid.

### The equality that is the argument for skipping a movement at all

Row B runs the same walk three ways at `GROUND=30`: walked-then-`at 5 0 0`, never walked
at `at 5 0 0`, and never walked at the origin.

    at 0 0 0 / keys 1 / step 90 / keys 0 / at 5 0 0 / verb raise   32952:2499485856
    at 5 0 0 / verb raise                                          32952:2499485856
    at 0 0 0 / verb raise                                          32952:3318286153

The first two agree and the third does not, which is both halves at once: the teleport
really does erase the walk, **and** the fixture can tell two poses apart — without the
third row the equality is satisfied by two empty worlds agreeing, which is `probe/k3c`
row D's guard one probe over.

### ⏭ What it does NOT claim

- ⏭ **The runner still cannot walk, and this step does not make it able to.** It makes
  the absence loud. Whether a headless walk is worth building is a separate question and
  nothing here answers it.
- ⏭ **No server is started.** The claim is about one driver's own bookkeeping; the
  server's walk is not compared against anything here.
- ⏭ **`step` is not a movement word.** It advances ticks, and ticks move the character
  only while a `keys` bitmask is held — which the `keys` line already records. A `step`
  with nothing held moves nobody, so fencing it would red `determinism.keys` and
  `cellar.keys` for nothing.
- ⏭ **`part` and `select` are not fenced**, because neither reads the author: they choose
  what the *next* gesture uses. Only `verb` is applied AT a pose.

## ✅ What `B4` turned up (2026-08-15) — the milestone was three finished parts and no wire between them

**Build a house, close the tab, reopen it and the house is there.** That is this plan's goal
sentence, written at the top of this file since it opened, and every piece of it had been built
and gated for two days:

| | |
|---|---|
| `W1` | `world_save`/`world_load` over one codec, `make parts` byte-identical, three sabotages |
| `P6` | a `--html` page has a filesystem, **and a world saved in it survives a reload** — measured over `http` AND `file://` |
| `M5b` | this very client reading a document at boot and writing it on every change — **for the keyboard** |

⛔ **NOTHING CALLED THEM.** `world_save` had eleven callers in this tree and not one was a page;
`P6` proved the mechanism in a probe program of its own. This is `CLAUDE.md`'s *commonest defect
in this tree* sitting on the milestone it was named for, and the way it hid is worth stating: each
of the three steps was honestly green, and **the gap was between them**, where no suite looks.

**The trigger is the edit clock.** `local_persist` compares `w_tau` against the last saved value
once a frame — in the frame loop, not in `local_act`, because a hook on the gesture path persists
what the gesture path writes and silently stops covering anything that later writes another way.
`w_tau` moves iff the store changed, whoever changed it.

### ⛔ I wrote a safeguard the library already owned, and only the sabotage could say so

The pose this page boots with is derived from **flat ground**, so restoring a world whose origin
was raised leaves the author at the old height. I wrote that up as *the author is buried* and
fixed it in the place that story pointed at: `local_fall` writes `au_y` from `st.py` every tick
(`B1c.3` put the authority there deliberately), so `local_restore` seeded **`st.py`** and the
sabotage `nofeet` removed the seed.

> ⛔ **`nofeet` was green on every check in the file.** `fall_step`'s first branch is
> `if y <= gnd { stand on it }`, and its own comment names this case: *"This is also the CLIMB
> case — the ground rose past the feet."* A restored world with a higher origin **is** the ground
> rising past the feet, so the first tick lifts them. `lib/hex_editor/tests/fall.loft` even has
> the row — `test_the_ground_rising_past_the_feet_is_the_climb`.

**I had written a consumer-side re-assertion of a library invariant**, which is code that no check
in this tree can ever make go red — the lower bound of a safe step, failed. It is deleted.

⚠ **AND THE REAL CONSEQUENCE WAS ONE LAYER OVER, WHERE I HAD NOT LOOKED.** `local_camera` puts the
eye at `au_y + LOCAL_LIFT` and aims it at `au_y + LOCAL_AIM`, and it is **re-solved only when the
YAW changes** — so a page that restored a raised world without rebuilding the pose looks out from
1.25 units inside its own hill, and stays there until the author happens to turn. The pose rebuild
is load-bearing; the feet seed never was.

> **The instrument moved with it.** A camera's consequence is not a number the walker reports —
> the fall repairs that one — so `O3` now reads the pose the camera was solved from, and the old
> feet comparison is kept as `O4` **with its blind spot written into the check**: it reds under
> `noworldsave`/`noworldload` because there is then no ground at all, and it stays green under
> `nopose`, because the fall does not read the pose.

⚠ **Both halves of this were found by RUNNING the sweep, not by reading the code** — the story was
coherent, the fix compiled, the check passed, and all three were about the wrong variable.

### ⛔ And `0 - 1` was wrong three ways, which one run said and no reading had

The sentinel for *nothing has been saved yet* looked obvious. Measured on the first run:

- ⚠ **a fresh world is at tau 1, not 0** — ⛔ **and the reason written here first was one I made
  up.** *The ground fill is a write* names a mechanism that does not exist: `world_new` puts
  `w_tau: 1` in its own struct literal and `world_set_ground` never touches the clock. Measured
  after the fact, because a number that is right by accident goes on being quoted — the runner on
  an **empty** script at `GROUND=0` reports **`0 chunks, τ 1`**, so nothing wrote and nothing
  filled. What is true is the consequence: **no legal `w_tau` means *nothing yet*** — so a page
  that opened and was never touched **encoded and wrote a whole world on its first frame**.
- ⛔ **and on the failure route it destroys the thing it failed to read.** A page that could not
  decode `world.hxw` would overwrite it a frame later, before the person could do anything about
  it. My own comment claimed *"the first edit will overwrite it"*, which is what I had written and
  not what the code did.
- ⚠ **the fix is one line in the right place**: seed `saved_tau` from the world this page is about
  to edit, on **all three** routes out of the loader. The first write is then the first edit.

### ⚠ The fixture has to walk backwards, and the gesture is why

`raise_ahead` lands `PEAK_AHEAD` = **10 hexes ahead** with a brush radius of 7, and refuses rather
than falling back to the author's own cell — its own comment records that *"the hill ended up
underfoot"* once. A reopened page puts the author back at the **origin**, which is the only place
`O3` can measure. So a hill raised from a standing start is 10 hexes from the one cell that
matters, and the run walks **40 steps back** first: the author ends ~7.9 hexes behind the origin,
the dome centres ~2.1 hexes past it, and the origin sits under it at **1.25** units.

⚠ **AND `O3`'s ORACLE IS THIS RUN'S OWN FIRST BOOT, NOT THE NUMBER 1.25.** A constant nobody can
re-derive is a check that goes stale silently. What is asserted is that the **same code at the
same position** reports a different height on the two boots — `0` on fresh ground, non-zero on the
restored world — with the fresh reading as the row's vacuity guard.

### The three sabotages, and why the pair had to be split

⚠ **`noworldsave` FIRST PATCHED THE CALL AND WOULD HAVE COLLAPSED TWO EXPERIMENTS INTO ONE.**
Replacing `world_save(…)` with a bare `WS_OK` leaves the page **saying it saved** — which is
`noworldload`'s transcript exactly, so both sabotages would have produced one indistinguishable
run while the header claimed they differed. It removes the **trigger** instead, which is also the
likelier real defect (a wrong `w_tau` guard), and the two halves separate: a page that never wrote
says so in its **own** half of the run.

| | what it takes away | red on |
|---|---|---|
| `noworldsave` | the save is never **triggered** | **O1**, then O2, O3 and O4 |
| `noworldload` | the world is written and never read back | O2, O3, O4 — **O1 green** |
| `nopose` | the restored ground never reaches the **camera** | **O3 alone** — the world is saved, restored and keyed **byte-identically** |
| ⛔ ~~`nofeet`~~ | *(retired)* the restored ground never reaches `st.py` | **nothing** — see above |

### ⏭ What it does NOT carry, said rather than left quiet

- **The scene records.** A world's bytes are cells and sections; the nine registries — runs,
  roofs, leaves, openings, annexes, props, slabs, holes, the trunk — live in the `EditSession`.
  `session.loft` had already worked out the cost (*"EMPTY IS NOT A LOSS OF THE HOUSE — it is a
  loss of the RECORDS"*, with the drawn result degrading to `chunk_mesh_props`'s per-edge
  fallback), so the restore line **says so in the transcript** rather than letting a person
  discover it by looking at a roof.
- **The pose.** A reopened page stands the author at the origin. That is defensible — a known
  starting point — and it is what makes the feet rebuild necessary rather than optional.
- ⏭ **Two tabs on one origin** both write `world.hxw` and the last one wins. `world_save_as`
  carries an owner guard (`X2`) for the same hazard on disk; nothing here does.

## ✅ What `M5b` turned up (2026-08-15) — a claim of mine that was too strong, and a rule enforced twice

**The keyboard survives a reload.** `keymap_delta` writes the rows that DIFFER from the
default, `keymap_apply` puts them back onto a map built from today's default, and
`keymap_save`/`keymap_load` are thin wrappers over loft's `f += text` / `f.lines()`.

⛔ **THE INVARIANT I WROTE FIRST WAS TOO STRONG, AND THE TEST FOR IT PASSED FOR THE WRONG
REASON.** I claimed the delta was what stops a saved file freezing the vocabulary — *a verb the
editor GAINED after the file was written arrives with its own key*. **That is true of a
whole-table file too**, because `keymap_apply` assigns per named verb and leaves an unmentioned
one alone, so the row asserting it could not see the delta at all.

> **What a delta actually earns is the editor's freedom to MOVE a default.** Change `raise` off
> `ArrowUp` in a release, and every person holding a whole-table file stays on the old key
> forever — having asked for nothing. A delta holds only what the author CHANGED, so the other
> fourteen verbs follow the editor.

Both rows are kept, because they are different mistakes with the same symptom: one is *the file
is a table*, the other is *applying replaces instead of assigning*. The second is a real
possible implementation and has its own sabotage.

### ⛔ The absences are recorded, and the sweep found the rule is enforced twice

Worked on paper before the format was written. Default `A=1 B=2 C=3`; bind `B` to `1`, then bind
`B` to `3`. The map is `A="" B=3 C=""`, and the only non-default row **with** a key is `B=3` — so
a document holding just that, replayed onto a default, leaves `A` on `1`, a key its owner lost two
gestures ago. That is why applying is an ASSIGNMENT rather than a replay of binds, and why a row
with no key is written down.

⚠ **And the sabotage that removes those absences goes red through the COLLISION guard rather than
through its own claim** — *that file puts 2 verbs on 'ArrowDown' — nothing was loaded*. The
loader's one-key-per-verb check, written for hand-edited files, turns out to catch a malformed
delta as well. The rule holds at both ends, which the paper argument did not predict.

### ⛔ And `N3` could not fail — the sabotage is what said so, and it is `M6`'s finding again

`DEMO_SABOTAGE=nopersist` scored `N3` **green** while its own `N2` read *the reloaded page found
NO key map*. With one `5` and one `ArrowUp` after the reload, **survived** and **did not survive**
both produce exactly one raise — one from the restored key, one from the old one — and no line in
the transcript names the key that caused it.

> **A total cannot say WHICH.** That sentence is already in this plan, written at `M6` about a
> count with the identical shape, and it turned up here in an instrument built *after* it was
> recorded. Reading the row is not what caught it; running the sabotage is.

The presses are asymmetric now — `5,5,ArrowUp` — so the counts separate: **2 is the restored key,
1 is the old one, 3 is both, 0 is neither.** ⚠ That is the fourth instrument of mine this session
that could not answer its own question, and all four were found by running something rather than
by reading it: `M5a`'s mis-click row, `M5b`'s delta claim, a grep whose `^ *M[0-9]` could not see
`   ✗ M7`, and this.

### ⚠ `!reload` — the driver re-opens the page mid-gesture

*Bind it, close the tab, come back* is **one sentence**, so it is one run: `probe/b1b/press.mjs`
takes `!reload` in the key list beside `@verb`, rather than the claim being split across two
invocations with a browser restart between them. ⚠ **The first half's transcript is dumped before
the navigate**, because the page's `<pre id=out>` is part of the document and navigating destroys
it — without that, the evidence that anything was ever *saved* is gone from the log, and `N2`
would be asserting persistence with nothing to persist. ⚠ And the page is clicked again after the
reload: the shell binds keydown to the CANVAS, so a freshly navigated page is deaf, which reads
exactly like a binding that did not survive.

✅ keymap **36 → 45 tests** · `sh probe/k2/sabotage-m5b.sh` **8 rows, 6 sabotages red on their own
claim, 2 clean controls** · `make probe-demo` `N1`–`N3`, `DEMO_SABOTAGE=nopersist` red on `N2`+`N3`
with `N1` green — which is what says the rebind itself worked and only the writing was removed.

## ✅ What `M5a` turned up (2026-08-15) — a check of mine that could not fail, and a symmetry refused on paper

**A key held from before the pick names nothing.** `hex_editor::rebind_scan` is the rising edge
the hardware does not have: `graphics` offers `gl_key_pressed(code)` and no event queue, so *did
they just press it* is built here out of two looks at the whole keyboard.

> **THE INVARIANT: only a key that has been observed UP since the pick, and is down now, can name
> a verb.**

⚠ **AN EDGE DETECTOR WHOSE FIRST LOOK SEEDS RATHER THAN FIRES**, which is the whole mechanism and
the only part of it that is not obvious. `st.was_arm` in the client does exactly this for one key
with a `false` seed, and it is right to — the client starts before any key can be down. The
rebinder arrives in the MIDDLE of a keyboard whose state it has never seen, so *unknown* has to
read as *was already down*. That is what makes a held key stale rather than fresh.

⚠ **AND IT TAKES THE WHOLE OBSERVATION RATHER THAN ONE CODE AT A TIME.** *Was this key down last
time* cannot be answered by a caller that only reports the keys down NOW: a key released between
two looks is invisible to it, and that release is precisely what makes the next press fresh.

### ⛔ A row I wrote could not fail, and running the sweep is what said so

`test_correcting_a_mis_click…` asked *the key held across a re-pick must not name the second verb*
— and was **green under all five** of the sabotages written for this step. The reason is that a
reseed makes the held key stale **too**, so the claim is true either way and the row could not see
the difference it existed to state.

> **What a reseed actually costs is a key struck in the same frame as the second click**, and that
> is the direction the row asks now. A sixth sabotage — `rebind_pick` reseeding, the obvious
> symmetry — bites it. ⚠ This is `M4`'s finding one week on and one layer in: **a row can be
> unfalsifiable without being wrong**, and only running the sweep says which.

### ⛔ And the obvious symmetry was refused before it was written

*Every pick starts a fresh observation* reads like the rule. It is wrong, and it was worked on
paper: `rb_down` has been watching the keyboard continuously since the FIRST pick, so a key held
across a corrected mis-click is **already** known to be stale — reseeding re-establishes nothing
and additionally swallows a key the person struck in the same frame as the second click.

⚠ **Arming is the one gap nothing observes** — no scan runs between a cancel and the next pick —
so arming is where the memory is dropped, and that is the whole of it. The row that sees it has to
scan with **nothing down** during the first gesture, or the stale memory happens to hold the right
answer.

### ⚠ The driver could not say this sentence, and that is why the step needed one

Every press `probe/b1b/press.mjs` makes is down-then-up inside one step, so *already down when the
slot was clicked* was unreachable. `+key` / `-key` is the hold, and the run is one gesture from the
hold to the release: **`+w,Escape,@raise,-w,5,5`**. ⚠ One `keyDown` is enough — the page's shell
keeps a SET (`keys.add(mapKey(e.code))` on keydown, delete on keyup) — and sending auto-repeats
would model a different physical event than the one the defect needs.

### ⚠ And the step INTRODUCES a silence, so it says something

Before it, a key held at the pick bound itself: wrong, and visible. After it that key does nothing
at all, which is the *blank no* this tree refuses everywhere else — so the seed names what it
found: *press a key for raise — W already down, so press it again or use another*. It has its own
test row and its own sabotage, because a correct binding with an unexplained key is a separate
failure from a wrong one.

✅ hex_editor keymap **28 → 36 tests**, suite 522 → 530 · `sh probe/k2/sabotage-m5.sh` **8 rows, 6
sabotages red on their own claim, 2 clean controls** · `make probe-demo` PASS with `M7`+`M8` ·
`DEMO_SABOTAGE=nofresh` red on `M7` alone.

## ✅ What `M4` turned up (2026-08-15) — a row that claimed to catch the tree's commonest defect, and never could

**`verb_of` is deleted.** What a key means is `keymap_default()` and nothing else — one body,
data, the person's to rebind. The chain stood beside it from `M1` for exactly as long as it took
to prove the table, which is what a transitional instrument is for; `lib/hex_editor/tests/keymap.loft`
drove the whole key universe through both across `M1`, `M2` and `M3`.

⚠ **THE INSTRUMENT IS THE TEST-NAME DIFF, NOT THE COUNT — and this step is why.** The suite reads
**522 → 522**, identical, because one row was deleted and one added. A deletion makes tests pass by
removing their subject, so a green suite of the same size is exactly what a coverage cut looks like.
The diff is six lines, every one accounted for:

| | |
|---|---|
| ⛔ deleted | `test_the_table_and_the_if_chain_agree_on_every_key_but_the_freed_aliases` — the comparison, **spent**. Green across `M1`–`M3`; with one body left it could only be rewritten as `verb_in(m,k) == verb_in(m,k)` |
| ⛔ halved | `…_is_bound_and_every_bound_verb_is_listed` → `test_every_verb_the_definition_lists_is_bound`. **See below — the removed half never did what it said** |
| ◐ renamed | the seat and annex family rows: *two keys name one verb* is not sayable against a one-row-per-verb table, and *the family is one verb and the alias is free* is the stronger spelling |
| ◐ renamed | `test_the_freed_aliases_are_exactly_the_duplicates_the_collapse_left` → `…_the_verbs_they_named_survived`, because the verb each alias reached came from the chain and now has to be written down |
| ✅ added | `test_the_vocabulary_the_definition_and_press_verb_are_one_set` |

### ⛔ The row that said it caught *built and never called* could not see it, and I measured that before believing it

`keymap.loft`'s second loop walked the key universe through `verb_of` under a comment saying it
*"catches a verb added to `press_verb` with no way to reach it"* — this tree's commonest defect,
named in `CLAUDE.md`, claimed covered.

> **It could not.** The loop only ever saw verbs *the chain named*. A verb bound in `press_verb`
> and named nowhere else was invisible to it — which is precisely the case the comment describes.
> **Measured on the pre-`M4` tree**: an arm added to `press_verb` for a verb bound in neither the
> chain nor the table left the suite at **522 passed**. What the loop actually caught was a verb in
> the CHAIN missing from the TABLE, which is the retired equality's job and went with it.

`the_vocabulary()` replaces it — every verb the editor has, listed once, checked against
`keymap_default()` in **both** directions and against `press_verb`. It is in the TEST rather than
the library on purpose: a `verb_all()` beside `keymap_default()` would be a public function with
exactly one caller, which is the shape this plan spends its time removing. ⚠ **And the residual
blind spot is written into the test rather than covered by a comment** — a verb in `press_verb`
and in neither list is still invisible, because loft has no reflection to enumerate what a
dispatch answers to. That sentence is the difference between this row and the one it replaces.

### ⛔ And the deletion silently disarmed four sabotage sweeps — two said so, two did not

Every `K3` sweep sabotages the definition, and all four did it by `sed`ing `verb_of`'s chain. The
moment the chain went, **all four seds became no-ops** — measured by running each one against the
post-`M4` source and comparing files. The two halves are the finding:

| | subject guard names | what it did |
|---|---|---|
| `sabotage-x`, `sabotage-bc` | the BINDING (`if key == "X"`, `if key == "B"`) | ✅ exit 1, *the subject is absent* — loud, correct |
| `sabotage-e`, `sabotage-z` | `stair_ahead`, `session_hole_kind` — still present | ⛔ the row ran, the sed changed nothing, and it printed **NOTHING went red** |

⚠ **A subject guard only sees what it names.** `K3` · `B` established that a sabotage which does
not BUILD reads exactly like a sabotage nothing noticed; this is the same sentence one step
earlier — a sabotage that does not *apply*. All four are retargeted at `keymap_default()`'s
`bind_of` rows and each was re-measured as biting. ⏭ The general repair is a sweep that asserts its
own patch changed the file, which is a change to the shared `row()` harness and is worth making
next time one of these is touched.

### The sweep, and what each row sees

`sh probe/k2/sabotage-m4.sh` — 5 sabotages, 2 controls, both suites (`verb` and `keymap`) because
`M4`'s claims are split across them. ⚠ **The subject guard is INVERTED**, which no sibling needed:
the subject of a deletion is an absence, so the guard refuses to run if `verb_of` is back.

| row | what it does | the row that names it |
|---|---|---|
| `s1` | `bind_of("O", VB_OPENING)` deleted | **the vocabulary row**: *the editor has verb 'opening' and the definition gives it no key at all* — the exact claim the retired loop overclaimed |
| `s2` | `P` bound to `opening` again | the definition row: *the opening family has grown a second key, which is what a lost selection looks like from here* |
| `s3` | a key bound to the verb `tunnel` | the vocabulary row's other direction: *a key to verb 'tunnel', which is not one of the 15 verbs this editor has* |
| `s4` | `Q` bound to `stair_up` | `K3` · `E`'s claim, moved onto the table — **and it goes red twice**, on the pair and on `stair_down` losing its only key |
| `s5` | `T` bound to `seat` again | `K3` · `Y`+`T`'s claim, moved the same way |

⚠ **`s4`'s double red is the argument for the new row existing.** The pair test alone says *the two
names agree*; the vocabulary row says *a gesture no keyboard can press*, which is the consequence
and the thing an author would actually notice.

### ⛔ And the sweep left a sabotage in the working tree, because its trap does not cover `PIPE`

Running `sh probe/k2/sabotage-m4.sh | head -30` to read the first rows closes the pipe mid-run; the
shell dies on SIGPIPE, **the `EXIT` trap never fires**, and the tree keeps the sabotage. The next
`make lib-test` then came back `hex_editor` **11 failed** with `bind_of("5", "tunnel")` still in the
source — a real-looking regression in a step that was green ten minutes earlier. All five sweeps in
`probe/k2/` had it; the trap is `EXIT INT TERM PIPE` now.

### ⛔ And running the siblings found a third stale instrument, one slice old

`sabotage-z` row `s6` reported *a half-done conversion went unnoticed* about a check that noticed
loudly. `K3` · `X` merged two checks into one message — ``still presses `key X`/`key Z` `` — and
updated `sabotage-x.sh` to match while leaving `sabotage-z.sh` greping `still presses .key Z.`,
which stopped matching that day. ⚠ **It fails SAFE** (a false alarm, not a false pass) and it is
still *a grep over a log is an instrument whose default answer is absent*. It had not been run
since `X` landed, which is the only reason a day passed. Fixed to the sibling's pattern.

⚠ **AND MY OWN CHECK REPORTED THAT RUN AS FINE.** The command was
`make lib-test > log 2>&1; echo rc=$?; grep …` — and what the harness printed back was the **last**
command's status, so a failed suite arrived labelled *exited with code 0*. The log said
`FAILED: hex_editor (interpreter)` on line 6450 and I had summarised past it. **A summary is an
instrument, and this one's default answer was *fine*.** The re-run checks `make`'s own rc first and
prints it before anything else.

## ✅ What `M3` turned up (2026-08-15) — a polling editor fires the key it has just bound

**Arm with `Escape`, click a slot, press a key.** `hex_editor::Rebind` is the state machine;
`make probe-demo` grew an `M` block of six checks over two runs. The design is
[EDITING_MODES § Phase 6](../../doc/claude/EDITING_MODES.md), which now carries the invariant this
step measured rather than the one it predicted.

### ⛔ The design named the wrong failure, and the right one is invisible to every other instrument

The step table said *what would surprise the test* is **a collision reported as a refusal**. That
half was already right — `keymap_bind` settled it at `M1` and its tests were green before this step
started. What nobody had written down is that the client does not listen for key events, it
**polls**:

> `poll_input` asks `gl_key_pressed(code_for(map, verb))` once a frame and acts on the rising
> edge. Bind `raise` to `5` and the physical `5` is **still down** on the very next frame:
> `verb_down(raise)` goes false → true, an edge fires, and the ground rises. **The rebind performs
> the verb it was defining.**

⚠ **AND THAT RAISE IS CORRECT IN EVERY PARTICULAR** — right verb, right author, right world, right
`w_tau`. There is no instrument in this tree that could tell it from one a person asked for, which
is why `RB_SETTLE` — hold the keyboard until the finger comes up — is the whole reason the machine
has four states instead of three. `DEMO_SABOTAGE=nosettle` removes the fence and `M4` reads *both
presses of 5 raised*.

### ⛔ The map is not the whole keyboard, and `keymap_bind` cannot see it

**Eight keys are bound in `editor_client.loft` and in no `KeyMap`** — `w a s d` walk, `l` levels,
`Tab` cycles the catalogue, `o`/`p` put an opening profile straight on the wire. Binding `raise`
onto `w` is therefore reported as a **clean rebind with nothing displaced**, because the collision
is with a table `keymap_bind` is not in, and the author gets a key that walks *and* raises.

⚠ **SAID RATHER THAN REFUSED** (`client_reserved`): every letter is taken, so refusing is the
useless-feature failure `keymap_bind` already decided against one layer down. ⏭ The real fix is to
put those keys in the map, which needs `press_verb` to have a shape for a HELD state — `D1`'s
neighbourhood, not this step's.

### ⛔ And the fence would have caused the bug its neighbour fixes

The walk is a held state, so arming has to zero `st.held` or a walking author keeps walking for the
whole rebinding. ⚠ **`wire`'s new fence makes that worse rather than better**: the `4:0` that stops
the server *is* the withdrawal of input, and the fence withholds exactly it. **A withdrawal is not
an input** — it goes straight to `web::send`, and the branch was already `!st.local`, so `wire`'s
local apology was unreachable from there anyway.

### ⛔ The driver had been turning `5` into code 85 since it was written

`press.mjs`'s fallback is a **letter** heuristic: `'Key' + '5'` is `Key5`, which no keyboard sends,
and the page's `mapKey` takes the `Key` branch anyway and computes `'Key5'.charCodeAt(3) + 32` =
**85**, a code that names no key at all. The press was delivered, the client saw nothing, and the
transcript read exactly like rebinding not working.

⚠ **DIGITS ARE THE ONLY GENUINELY FREE KEYS**, which is both why no probe in this tree had ever
pressed one and why they are precisely what a person rebinds ONTO. The `.` and `Tab` rows in that
table are the same finding twice already; this is the third.

### ⛔ Two instruments were wrong, and the sweep found the second one

> **`probe/b1b/auth.sh` B9 had been RED since `B1c.1`, and it is not mine.** It asserted that local
> mode says *"'4:' is a server message and this page has no gesture for it yet"* exactly once.
> `B1c.1` gave local mode a walk **and** guarded the send with `if !st.local` — making the apology
> unreachable and untrue in one commit, with the client's own comment beside it saying so. The gate
> was not moved with the code. ⚠ **Measured before it was blamed on history**: `HEAD~1`'s client
> was built and run, and fails B9 identically. It is inverted now — *local mode has a gesture and
> does not apologise* — and the original *once, not per frame* claim is **moved, not removed**, to
> `B9b`, where it is asked of a message that really has no local gesture. `auth PASS — 37`.

> **And `M6` blamed the wrong half — found by running `nosettle`.** Its run holds one `5` and two
> `ArrowUp`, and it read any non-zero raise count as *the old binding is live*. With the settle
> fence gone the bind press raises once and `ArrowUp` is correctly dead: a true count under a false
> headline, pointing the next reader at `keymap_bind` for a defect in `act`. The counts separate
> cleanly — **1 is the bind firing, 2 is the old key, 3 is both** — and it is branched now. *A
> total cannot say WHICH*, which is this plan's own `B1b.2c.4c` finding arriving in an instrument
> written after it.

### ✅ Three things built-and-never-called now have consumers

`verbbar_hit` and `verbbar_verb` were built at `M2` and invoked by nothing — **no widget in this
tree had ever been hit-tested** — and `spec_verb_on`, the armed flag, is how the picked slot lights
up. ⏭ **`panel_hit_test` is still uncalled**, and it is the last one.

⚠ **AND THE SLOT CENTRES ARE READ OFF THE CLIENT'S OWN LINE.** `client: verb slots — raise@275,610
…` comes out of the LAID-OUT bar, and the driver clicks what it reports; a probe that computed the
position from `VERB_SLOT_W` and `PANEL_WIDTH` would be a second copy of the layout, green while
clicking at the wrong pixel — and a mis-click reads as *rebinding does not work*, which is the
wrong bug to go hunting.

### ⏭ What it opened: the scan cannot tell HELD from PRESSED

`graphics` has no event queue, so *which key did they press* is 43 asks of `gl_key_pressed` — which
answers **is it down**, never **did it just go down**. `RB_SETTLE` solves that at one end only.
**A key held from before the arm binds itself the instant a slot is picked**: walk forward, press
`Escape` with the other hand, click a slot, and `w` is bound before anything was chosen. The same
missing edge means a *refused* press would reprint every frame — unreachable today, and reachable
the moment either premise moves. It is `M5`, with persistence, because both are *the map outliving
the frame it was made in* — and it wants a driver that can hold a key across a click.

## ✅ What `B1c.1` turned up (2026-08-13) — a continuous turn, a quantised gesture

**The demo builds a house.** `make probe-demo`'s F block presses `h` before anything has turned
and gets the refusal that has stood in front of this page since `B1b.1b` — *"a footprint at this
facing has no mitred corners; turn one step" (rot 9 of 12, offer 8)* — then turns, then places 27
cells. **One run holds both halves**, which is the negative control being the first key of the
same sequence rather than a second fixture.

⚠ **THE TURN WAS THE HALF A HOUSE WAS WAITING ON, AND IT IS THE HALF WITH NO BLOCKERS.** `B1c` was
left unsized because *the walk* is a design question; the TURN is not part of that question at all
— it touches no world, no terrain, no collision and no `moros_sim`. Splitting it out is what let
`B1c` start.

### What the page needed that it did not have: a tick

**The pose is the driver's** (`es_author` — *a driver's pose, never the editor's*), and in local
mode nothing was integrating it, so the author stood at the origin facing yaw 0 for ever.

⚠ **A FRAME TIME IS THE OBVIOUS `dt` AND IT IS THE WRONG ONE.** The page runs the server's own
fixed step — `hex_editor::TICK_US`, consumed from a backlog one step at a time — because the
server's comment records paying for the alternative: it read `steps = elapsed / TICK_US` and
integrated `steps * TICK_US` in one pass, so *a loaded box took ONE tick that moved the walker as
far as five*. A page integrating its own frame time would turn at a different rate on every
machine, and the two authorities would stop being one editor **with every test green**.

⛔ **AND THE CLOCK CAN BE BLIND, MEASURED BEFORE IT WAS USED.** The emitted page binds
`loft_host_time_ticks_us()` to `performance.now() * 1000` — but it also carries a shim filling any
name the host did **not** bind with a constant, and that name's fallback is **`0`**, announced by a
`console.warn` and nothing else. A page whose bridge went missing would see `elapsed` of 0 for
ever, consume no steps and stand perfectly still with every number on screen right. So the walker
says so, once, when keys are held and no step is consumed.

### ⛔ And the dead-clock guard was broken in exactly the situation it was written for

The warning was keyed on `st.tick_at == 0` as its *first pass* test. With `ticks()` stuck at zero,
`tick_at` is set to zero, stays zero, and the function **returns early on every frame** — so the
one page the guard exists to catch is the one page it can never reach. It is a `tick_begun` flag
now: *the first pass is a fact about passes, not a value the clock happens to have.*

⚠ **AND IT WAS FOUND BY READING, WHICH IS WHY IT NEEDED AN INSTRUMENT.** Nothing was red. So
`DEMO_SABOTAGE=deadclock` builds a client whose `ticks()` never advances — `probe/b1a`'s
throwaway-client pattern, and the only way in, because the real hazard lives inside the wasm import
table where nothing outside the page can reach it. It prints
*"keys are held and the clock has not advanced (ticks() reads 0); this page cannot walk"*, and
`F2a` goes red at **0 steps** beside it.

⚠ **ITS FIRST RUN WAS COMBINED WITH `noturn` AND REPORTED THE GUARD SILENT** — correctly: the
message fires only when keys are HELD, and `noturn` presses no `d` at all. **A sabotage composed
with another sabotage is a third experiment**, and it measured the wrong one for a minute.

### ⚠ The declaration had to move, not just the uses

`TURN_RATE` and `TICK_US` were `src/editor_server.loft`'s. Leaving the `const`s standing while
publishing the same names would have left the server reading **its own** whatever `hex_editor`
said — *a program declaring a name a library publishes SHADOWS it invisibly*, which is `HOUSE_W`
measured and `CHUNK_SHIFT` breaking the editor with every suite green. Both are deleted here.

⚠ **AND THE WIRE'S BITS GOT A DECLARATION FOR THE FIRST TIME.** `4:<keybits>` had a sender
(the client, ORing literal `1/2/4/8`) and a receiver (the server, testing its own literals) and
nothing between them. `HELD_FWD/BACK/LEFT/RIGHT` and `turn_dir` are the table now.

⚠ **AND ONE APOLOGY BECAME A LIE.** `wire()` says *"'4:' is a server message and this page has no
gesture for it yet"* — true until this step. Held input forks on the authority now, exactly as
`act` does. **A stale apology is worse than none**: it is the `ps_status` literal again, one
message down.

### The instruments, and what each sabotage could see

| sabotage | red where | and nowhere else |
|---|---|---|
| `swapped` — A and D turn the other way | the sign assertion · the returned pose's angle | 7 of 9 tests green — a page turning backwards looks completely normal |
| `fixed-step` — `yaw_turn` ignores `dt` | **the accumulation test ALONE** | ⚠ *"one step turns a known angle"* could not see it: the fixed amount substituted was the same 0.033 |
| `crossed mask` — W turns instead of D | 5 of 9, including *the walking keys do not turn* | — |
| `noturn` (in the demo) — the same attempts, nothing turning | `F2b` the yaw, `F3`–`F5` the house | ⚠ **`F2a` STAYED GREEN AT 213 STEPS** |

⚠ **`noturn` IS WHY `F2` IS TWO CHECKS.** With nothing held the page still consumed **213 fixed
steps** — a step count says the CLOCK advanced, which is exactly the thing a missing time bridge
takes away, and says nothing whatever about the keys. **One number could not answer**, so there
are two: `ticked` and `turned_by`.

### ✅ A continuous turn, a quantised gesture — which is what makes the demo assertable

**The world key is identical across runs** (`41145:1306471549`) although the yaw is not: one key
press is 3 **or** 4 fixed steps depending on when the browser delivers it, so the final yaw came
out 0.7986 in one run and 0.9438 in another. The house does not move, because the footprint takes
a **lattice rotation** (the six even indices of 12 — `offer 8` from rot 9, `offer 10` from rot 11)
rather than the raw yaw.

> **A wall-clock-driven browser demo can be asserted byte for byte, because the gesture quantises
> what the walker leaves continuous.**

⏭ **AND IT NAMES A PRODUCT QUESTION THIS STEP DELIBERATELY DID NOT ANSWER.** An author presses
`h`, is refused, turns a little, is refused again — the gesture knows the admissible facing
(`offer 8`) and does not take it. Whether `place` should snap to its own offer is an
[EDITING_MODES](../../doc/claude/EDITING_MODES.md) question about what a verb means, not a walk
question, and changing it here would have moved `probe-b1a`'s baseline under a step about turning.

## ⛔ What starting `K3` turned up (2026-08-14) — a key meant two things, and the alphabet is FULL

**`K3` is not one step, and the measurement says why.** It is *drop the `key` spelling from
scripts*, blocked on keys with no verb — and the scripts use **eleven** such keys
(`R Y T J E Z X V K C B`; `Q` is used by none). Each is a `do_*` handler of roughly **35 lines of
real logic plus 14 of server plumbing**, and ⚠ **all the underlying gestures are already in
`hex_editor`** (`stair_cut`, `storey_add`, `wall_step`, `annex_at`, `prop_at`, `slab_over`) — so
the work is the ASSEMBLY, eleven times, not the gestures.

⏭ **`R` IS THE SLICE TO TAKE FIRST: 22 of the 40 non-arrow presses in the whole script corpus.**
And it is the stateful one, which is the interesting half — except that `sess.es_draft` **already
exists**, so the state is where it belongs and `MSG_WALL`'s handler is one line.

### ⛔ And starting it found a collision `B2e` had already shipped

**`k` meant two things.** The client's part-cycling was bound to `k` — and `k` is **BALCONY** in
`tools/script.mjs`'s `KEYMAP` (`37:1`). A script saying `key K` and a person pressing `k` would
have done different things: **the four-sites defect `W4` exists to close, rebuilt by hand in the
plan that documents it.**

⚠ **AND THERE WAS NO FREE LETTER TO MOVE TO.** Counted: 21 in the script's table, 5 more in the
client's movement and mode keys — **all 26 are taken**. That is the strongest argument yet for
[EDITING_MODES](../../doc/claude/EDITING_MODES.md)'s rule that a key names a VERB and the binding
is **data**: a table that cannot grow is one where every new gesture takes something else's letter.

⛔ **AND `.` IS UNREPRESENTABLE TO THE PAGE, WHICH COST A SECOND ATTEMPT.** The browser bridge's
`mapKey` handles `Key*`, `Digit*` and eight named keys and **returns 0 for everything else** — so
punctuation is not unbound, it is unreachable, and a press of it cannot be told from no press at
all. ⚠ It showed up as the demo **placing a house**, which is exactly what *nothing was chosen*
looks like. `Tab` is in that table, already means cycle, and the page's `preventDefault` stops it
moving focus.

⚠ **THE DRIVER NEEDED A ROW TOO.** `probe/b1b/press.mjs` builds a key's CDP spelling as
`'Key' + k.toUpperCase()`, a LETTER heuristic — there is no `KeyTAB` and no `Key.`. Both named keys
now have explicit rows beside the arrows, and `Tab` deliberately carries no `text`, which would
otherwise insert a character.

## ✅ What attached-mode placing turned up (2026-08-14) — the wrong message, and both were "about a part"

**`51:<name>` chooses, `32:` places what was chosen.** Driven against a live server: the client
cycled the catalogue **the server sent it**, and the server logged
`part 'door/doorway' chosen` then `placed 'door/doorway' — 9 cells at (0,0)`. The asymmetry
`B2e` recorded is closed.

⛔ **AND THE CLIENT WAS SENDING `44:`, WHICH IS PART *MODE*.** `B2e` wired the choosing key's
attached branch to `44:` on the assumption that it was the placement message — it OPENS A PART FOR
EDITING, so pressing the key against a real server would have swapped the author's whole world for
a door. ⚠ **Nothing could have gone red**: the client had no attached path to exercise before this
step, and both ids are honestly described as *a message about a part*. Found by reading the
server's id table, which is the only instrument that could have.

⚠ **AND `MSG_HOUSE` NEEDED ONE ARGUMENT, NOT A HANDLER.** The server's `place` already went through
`press_verb` (`V2a`), so the whole of attached placing was: pass `parts_root()`. Without it the
gesture refuses a chosen part with *"this driver has no part library"* — which is the defaulted
root doing exactly what it was built to do, in the one place that would otherwise have failed
silently.

### `51:` and `14:<roof>,<part>` are both kept, for different callers

| | |
|---|---|
| `14:<roof>,<part>` | names the part **in the placement** — what a SCRIPT wants: one line saying exactly what to build, replayable with no state behind it. It is why `tools/scripts/*.keys` can be diffed |
| `51:<name>` then `32:` | choose once, then press the same key as always — what a PERSON wants, and `49:`/`36:`'s shape one family over |

**Both end in the same `part_place`**, so they cannot build different things; what differs is who
remembers the name.

### ⚠ And the cycling reads ONE list, whichever authority filled it

`part_names_of(st.mats)` takes the part rows out of the catalogue STRING — which local mode
composes and the server sends as `N:` — so the rows the panel draws and the order the key cycles
are the same list by construction. ⚠ The page's own `part_names` vector is gone: it was a second
copy of the same thing, which is what this plan spends its time removing. **Measured in the served
run**: the page reported `local library — 0 parts` (an http-served page has no baked base tree, so
that is correct) and cycled to `door/doorway` anyway, off the server's catalogue.

## ✅ What placing turned up (2026-08-14) — no selection existed anywhere

**The demo can choose a part and place it.** `k` steps through the catalogue, `h` puts the chosen
part in the world instead of the procedural house: `local part 'door/doorway' chosen`, then
`local place — 9 · world 8277:3726603134`, where the house at that same pose is **27 cells and
`41145:1306471549`**. `make probe-demo` is 25 checks.

⚠ **THE GAP WAS NOT "LOCAL MODE CANNOT PLACE" — IT WAS THAT NOTHING COULD CHOOSE.** There was no
selection in the client, the server or the session: the catalogue was a list you could look at and
not pick from, and the subject line carried the world, the mode and the opening kind but nothing
about a part. So this is `S2a`/`S2b` one family over — the step those took for openings, which
`S2b` states as *"picking a profile must change what the next `opening` cuts"*.

✅ **AND `place` PRODUCES WHAT IS CHOSEN — `S3`'s COLLAPSE, ONE FAMILY OVER.** Nothing chosen builds
the procedural house exactly as before, so every driver, every script and `B1a`'s committed world
are untouched; a chosen part is placed instead. One verb, one key, and the catalogue decides which
thing it makes.

### Two design calls, and why each went the way it did

| | |
|---|---|
| the library root is a **defaulted parameter** on `press_verb`, not session state | A session is a driver's STATE; a library root is its CONFIGURATION, and the two drivers read from different places — a disk and a baked base tree. A session carrying a path would mean nothing on the other side. ⚠ Defaulted to `""` for the reason `cliff_edges` defaults its step and `fall_step` its gravity: **all 28 existing call sites are untouched**, and a driver with no library gets a refusal that NAMES the missing library rather than silently building something else |
| **cycling is the driver's, the name is the session's** | Stepping through the catalogue needs the LIST, which belongs to whoever read the library and in the order it read it; the gesture needs only the chosen name |

⚠ **AND THE NAME IS CHECKED WHILE THE LIBRARY IS NOT.** `session_select_part` refuses an escaping
name through `hex_part::part_name_ok` — the inverse of `part_list`, and the fourth site that would
otherwise have spelled its own `..` check — but says nothing about whether a file exists. That is
the PLACING gesture's answer, because only it is told where to look.

### ⛔ The same instrument mistake, a third time — so the shape is now the default

`Q2` shipped saying *"place built F4's own house world — the selection changed nothing"* about a run
in which **nothing was placed at all**. `G2` and `P2` had each needed exactly that correction
already. Three outcomes, not two: *no world built* is **"this run cannot say"**, and only an actual
house-world is the failure. ⚠ It is written at the check now as the default shape rather than as a
correction applied after the fact.

### ⛔ And `H2` was a flaky check I had already shipped

It asserted *a fall completed* on the strength of **three consecutive passes** — 1, 2 and 3
landings — which is a coin coming up heads three times, not evidence. At 44 presses the walker
reaches the CREST of the raised patch and stops there about half the time: feet up, `landed` 0, and
nothing to fall off. The fourth run caught it.

✅ **Sixty presses clear the crest, and the margin is the point**: **28 and 20** landings over two
runs instead of 0–3. ⚠ **A number that is sometimes 0 and sometimes 3 was never a threshold** — it
was the fixture ending mid-climb, and the check could not tell that from a fall that did not happen.
The refusal says so now: *"a walker still ON the crest has had nothing to fall off yet, which is
what too short a walk looks like."*

⚠ **AND BOTH `Q` RUNS RETRY THE PLACE**, for the reason `F` and `G` both had to: one key press is 3
**or** 4 fixed steps and a footprint fits only the six EVEN rotations, so a single `h` lands
inadmissible about half the time and builds nothing.

⏭ **WHAT THIS DOES NOT CLOSE: ATTACHED MODE STILL CANNOT PLACE A PART.** `44:` has no client binding
— this tree has recorded that for months — and the SERVER holds no selection to send one to. The
asymmetry is **pre-existing rather than introduced here**, and closing it means giving the server
`es_part` and a message to set it. Said in the client at the key, so a reader does not have to infer
it from silence.

## ✅ What the thumbnails turned up (2026-08-14) — an argument that expired, and a constant in THREE places

**The demo's catalogue has pictures.** 11 material swatches and **20 part thumbnails**, composed by
the page from its own baked library: `local thumbnails — 49 meshes for 20 parts`, and
`20 thumbnails rendered … 0 thumbnail meshes arrived, 49 held, 20 cameras`.

⛔ **THE SERVER'S REASON FOR OWNING THIS HAD EXPIRED, AND NOTHING NOTICED.** It argued at length:
*"THE SERVER MESHES AND THE CLIENT DRAWS … four of a chunk's nine surfaces come out of
`chunk_mesh_props`, which lives in THIS file … A client meshing a part would draw its ground and
its floor and no walls at all — a house with no house in it, and a thumbnail that looked like a
lawn."* **That stopped being true at `B1b.2c.3`**, when the props mesher moved into `hex_mesh` —
and the comment sat beside code that still worked, so nothing was red. ⚠ The *other* half is still
load-bearing (*"a SECOND projection path to keep honest for a picture 22 pixels wide"*), which is
why the camera fit moved WITH the meshing instead of being re-derived: there is still exactly one.

⚠ **AND `THUMB_W`/`THUMB_H` WERE DECLARED IN THREE PLACES** — the server, the client, and nothing
making them equal. The server builds the PROJECTION from its pair and the client allocates the
TEXTURE from its own, so a drift is not a wrong number anywhere: **it is a picture stretched by the
ratio of two constants nobody compared**. Both copies are gone. ⚠ `THUMB_AMB` stays in the client
on purpose — the canonical LIGHT is the drawer's, and the server has no opinion about it.

### The page composes the same wire rather than a shortcut

Encoding a mesh to text and parsing it straight back inside one process is waste, and it is the
deliberate choice: `add_thumb_cam`/`add_thumb_mesh` are the client's **one** path into its thumbnail
store, and a local entry beside them is the fork this plan refuses everywhere. Twenty parts once at
boot, not a per-frame cost.

✅ **AND `arrived` IS THE HALF THAT SAYS WHERE THEY CAME FROM.** That counter belongs to the `Y:`
wire handler, so a page composing its own leaves it at **0** while `held` (49) and `cameras` (20)
rise. `P3` asserts both, and a non-zero would mean a server was answering a run that has none.

### ⛔ Two mechanical lessons, both paid for in this move

**Deleting by line offset is unsafe once other deletions have shifted the file.** The first attempt
removed the cone by ranges computed up-front and silently ate **`skin_check`**, a function with
nothing to do with thumbnails. Restored from git and redone **by name**, touching only each
declaration and never the comments around it.

**And the compiler settled where the code lives, better than reasoning would have.** A `thumb.loft`
module could not call `chunk_meshes_all`: *"a `use` imports the used file's names into the file that
used it, never the other way round. Move it into a file that BOTH `use`."* So the thumbnail sits in
`hex_mesh.loft` itself, and the note says splitting it properly means moving the chunk mesher into a
shared module — a restructure this step has no business starting.

⏭ **WHAT IS STILL MISSING: PLACING a part in local mode.** The catalogue can now be seen and
selected; the gesture that puts one in the world is the next step.

## ✅ What inlining `data/parts` turned up (2026-08-14) — a module name is a namespace

**The demo carries its part library.** `build-pages.mjs` bakes `data/parts/` to `/data/parts` as a
`globalThis.loftBaseFS` prelude — 23 files, 326 KB raw, 437 KB encoded on a 5.8 MB page — and the
page **reads 20 parts back out of it**, which is the interpreter's own answer for the real
directory. `make probe-demo` is 22 checks.

⚠ **PLAN 22's OPEN QUESTION 2 IS ANSWERED WITH A NUMBER, WHICH IS WHAT IT ASKED FOR.** *"Does the
demo ship the whole part library, or a starter set?"* — **the whole of it**: 326 KB against a 5.4 MB
engine is 6 %, and a starter set would be a second list to keep in step for nothing.

### The measurement that had to come first: can a page LIST a directory it was given?

`P6` proved a page reads its base tree and `list_dir`s it. **`part_list` also needs `is_dir`**, which
nothing had ever asked — and it returns *nothing at all* without it, so a demo whose library is
present but unreadable is indistinguishable from one shipped without a library.
`probe/b1c/parts.mjs` settled it against the interpreter as oracle: **20 and 20.**

### ⛔ A MODULE FILE NAME IS A NAMESPACE TOO, AND THE DIAGNOSTIC NEVER SAYS SO

The new module was `catalogue.loft` — and **`hex_part` already has one**, with `use catalogue;` in
its entry. The result was `part_list` unresolvable *from inside my own file*, with a diagnostic
naming the FUNCTION and never the collision. It is `choices.loft`.

> CLAUDE.md records this for **struct** names — *a loft struct name is global across a consumer's
> whole dependency graph*. It is true of **modules** as well, and this is the first time the tree
> has hit it.

### Why the catalogue had to be SHARED rather than composed twice

`editor_client.loft` says of the catalogue it receives: *"Kept as the server sent it … a list the
client composed would be a list of what it believes the renderer can draw."* Local mode breaks that
— with no server there is no `N:` — and the resolution is **not** to let the page believe
something. `KIND_MATERIAL`, `KIND_PART`, `surface_block`, `part_availability` and `catalogue_wire`
are `hex_mesh::choices`'s, and both drivers call them: the page's catalogue is the same join, in a
different process. ⚠ The two KIND constants had been declared in **both programs** — one composing
the string, one parsing it, with nothing making them equal.

⚠ **AND IT LANDED IN `hex_mesh` BECAUSE OF AN ARROW, LIKE `ground_under`.** The material half is
`surface_at`'s; `hex_mesh` depends on `hex_editor`, so a catalogue there is a cycle; and
`lavition_ui` declares an **empty dependency list as its claim** (*"a rect is a rect"*), which
knowing what a part is would end.

### ⛔ And the sabotage caught my own check overclaiming

`DEMO_SABOTAGE=noparts` builds the demo without its library. `P1` went red — and **`P2` stayed
green**, because the 11 swatches it counts are the MATERIAL rows, which exist whether or not a part
was ever baked. It said *"11 swatches rendered from it"*; it now says *"the panel took it: 11
material swatches (⚠ blind to the parts)"* and names what would actually see a part row.

⏭ **THE PAGE LISTS PARTS IT CANNOT DRAW A PICTURE OF**, which is the honest state: thumbnails are
the next step. ⚠ And the reason the server meshes them — *"four of a chunk's nine surfaces come out
of `chunk_mesh_props`, which lives in THIS file"* — **expired at `B1b.2c.3`** when the props mesher
moved to `hex_mesh`. The client can mesh a part now; that comment is stale.

### ⚠ And `D0`'s claim was restated rather than loosened

The demo can no longer be `cmp`-equal to the page the server serves, because it carries a base tree.
The check asserts the exact thing instead: **every engine byte present, in order, with one
contiguous prelude in front** — `the engine build is present verbatim, plus 446768 bytes of
prelude`. A recompiled, patched or truncated page fails it exactly as before; what it no longer
does is fail for carrying a library.

## ✅ What fixing the mesher's height scale turned up (2026-08-14) — one part, and a compiler that named every site

**Every height in `hex_mesh` is `w_unit` now.** A world authored at any unit is drawn at its own
size; before, all 72 sites multiplied by `hex_fit::HEIGHT_SCALE`, a global 0.25.

⚠ **THE CLAIM WAS INHERITED FROM A COMMENT AND IT CHECKED OUT — barely.** `gesture.loft` had said
for months that *"`door/slat` is authored at 0.125"*. Reading every part file rather than the
comment: **`door/slat` is 0.125 and all nine others are 0.25.** One part, and it is real.

⚠ **AND THE BUG IS NARROWER THAN THE COMMENT IMPLIES, WHICH MATTERS FOR WHAT THIS BUYS.**
`hex_part` **already refuses** a cross-unit composition — `BK_UNIT` at the bake, `EX_UNIT` at the
expand, under *"a part at a different unit is a LIMB, posed at the ratio, or it is nothing"*. So a
0.125 part can never be flattened into a 0.25 world; the global bit only where a part world is
**meshed directly**, which is the thumbnail and part-mode path. Measured before any edit:
`door/slat` spanned **0.1667** of world height where its own unit says 0.0833.

### The instrument and the prediction came first

`probe/b1c/slat.loft` meshed the part and printed its vertical extent, and the prediction was
written down before the change: **slat halves to 0.0833–0.1667, `door/leaf` at 0.25 does not move.**
Both exactly. ⚠ Without that, "the mesher looks right" is the only available verdict on a change
that touches every vertex.

### It had to be all-or-nothing, and the first attempt proved why

⛔ **`ground_under` alone on `w_unit` was strictly worse than the global**, which is what its own
correction records: its terrain branch defers to `terrain_y`, so converting one and not the other
put a floor and the ground beside it on two scales. **A half-converted mesher is worse than an
unconverted one** — so this is 72 sites in one change, not a staged one.

### What made 72 sites safe

| | |
|---|---|
| every function with a world binds it `wld` | measured first — 15 functions, 50 sites, one spelling |
| the seven helpers without one are **private** | 0 callers outside the file, so a `unit: float` parameter changes no public API and no consumer |
| the compiler named every remaining site | ⚠ including **two parameters my insertion dropped into a function BODY instead of its signature** — `hex_to_world(cq, cr, 0, unit: float)`. A sweep over a 3,000-line file is a substring match, and this is the third time today it bit |

### The test asserts a RATIO, not a height

*The same cells at half the unit are drawn at half the height.* A test naming 0.0833 would have to
be rewritten by anyone who touched the geometry; the ratio is the invariant. ⚠ **Seen red against
the saved pre-change mesher — 3.6667 at BOTH units** — and green after, with the other seven cases
in the file unmoved either way, so the change is as narrow as it claims.

⚠ **AND NOTHING ELSE COULD HAVE SEEN THIS, WHICH IS THE POINT.** Every landscape is 0.25 and so was
the constant: `make parts` is byte-identical, all 48 gates pass, and both suites agree either way.
**A constant that is right for every fixture anyone has built is a constant no fixture can test** —
the same blindness `ground_under`'s own scale bug had, one package wide.

## ✅ What `B1c.3` turned up (2026-08-14) — two gravities became honest by becoming two packages

**The page falls.** `hex_mesh::ground_under` answers what is under the feet for both drivers, and
`hex_editor::fall_step` evolves them.

### The verification, and the accounting

`make lib-test` **22 suites green on both backends**; `make probe-demo` 20 checks; and
`DEMO_SABOTAGE=noraise` red on **`H1`/`H2` alone** — it walks **17.28 units on flat ground** with
`feet 0 landed 0`, so the fall checks are about the GROUND rather than about walking or distance.

Test-name diff, every row accounted for: **moros_sim 303/25 → 295/24** (−8) and **hex_editor
452/43 → 461/44** (+9). ⚠ The extra one is the PIN — `moros_sim`'s file had 8 runnable tests plus
two helpers the runner cannot call, and the ninth here is
`test_the_editors_gravity_is_the_number_the_other_world_falls_at`. ✅ **hex_mesh is 72/10** —
`ground_under` arrived with no tests of its own and now has seven, which is where the scale mistake
below was caught.

### ⛔ And writing them found the move's own mistake, before it reached anything

**`ground_under`'s height scale was rewritten to `wld.w_unit` when it moved, and that is wrong
HERE.** The walk's argument was sound where the walk applied it: a part world is authored at 0.125
and `hex_proj::HEIGHT_SCALE` is 0.25. But this function has **two branches** — a built surface uses
the stored height, and terrain defers to `terrain_y` — and `terrain_y`, like every vertex this
mesher emits, is on the **global**. So `w_unit` put the two branches on two scales: on a part world
a floor would have read **half** what the ground beside it read, **a 2× discontinuity inside one
world**.

⚠ **NOTHING COULD HAVE SEEN IT WHERE IT SHIPPED.** Every world the editor builds is `W_UNIT` 0.25
and so is the global, so the gates, the demo and both suites agree either way. The test that sees
it is the one asking on **two worlds of different units**, which is the only place the two scales
are distinguishable — and it is asserted as *the terrain branch equals `terrain_y`*, the invariant
that survives whichever scale is eventually right.

⏭ **THE REAL FINDING IS ONE LEVEL UP AND IS NOT THIS STEP'S**: `hex_mesh` measures every height
with a global constant, so **a part world authored at 0.125 is meshed as if it were a landscape**.
That is a package-wide question — every vertex, every thumbnail — recorded at the function rather
than started here.

### ⚠ And a storey goes UNDERNEATH, which the first fixture got backwards

`storey_add` reads like *add a floor above*. Measured with `probe/b1c/gu.loft`: after it, the
column's **ground-layer index moves 0 → 1** — the terrain stays the ground and the new layer is a
floor **below** it. So a built surface is reached at a LOW reference and the terrain at a high one.
Two of the seven tests asserted the opposite and went red saying *"a storey's surface is reported
as the GROUND layer"* — which was the fixture being wrong, not the predicate. ⚠ **A test that fails
is not yet a defect; the probe is what tells you which side moved.**

### The cycle, paid on the side that owns the interpolation

⛔ **THIS IS THE BLOCKER THE WALK TURNED OUT NOT TO HAVE.** `walk_to` never asks for the ground; the
fall asks on every tick. And `ground_under` needs `terrain_y` — the INTERPOLATED heightfield, which
is `hex_mesh`'s — while **`hex_mesh` depends on `hex_editor`**, so a `ground_under` in the library
where the walker lives is a dependency cycle.

✅ **SO IT WENT THE OTHER WAY: into `hex_mesh`, beside the `terrain_y` it defers to.** Both drivers
already depend on it, neither re-derives what a foot is standing on, and no arrow moved. ⚠ The
alternative — the page re-implementing eleven lines — is exactly the divergence this plan removes,
and it would have been invisible until somebody stood on a stairwell.

### The gravity, and why the old note was right and still let it move

`fall.loft` imported `player::GRAVITY` under *"a package with two gravities is a package where a
jump and a fall disagree"*, caught the honest way: it was first written with an invented 11.0
beside a shipped 12.0.

⚠ **WHAT CHANGED IS THAT THEY ARE NOW TWO PACKAGES FOR TWO WORLD MODELS.** `player_step` falls in a
`Map` (`moros_map`'s, still live — `editor.loft` drives it); this one falls in a `VoxelWorld`. The
old note named its own end: *"when the two world models converge, one of these goes."* **A second
declaration for a second world model is honest; a second declaration for the same one never was.**

⚠ **AND THE PIN IS A TEST, NOT AN IMPORT — SAID PLAINLY RATHER THAN DRESSED UP.** Nothing makes the
two equal, because the arrow forbids either importing the other. Each side types out its own number
with a test that goes red on drift, and each file names the other. **A drift is loud rather than
prevented**, which is the honest description of what this buys.

⚠ **AND THEY ARE `FALL_*`, NOT `GRAVITY` — the `WALK_SKIN` lesson applied BEFORE it bit.**
`src/editor_server.loft` imports this package and `moros_sim`, so a bare `GRAVITY` published here
is one name declared by two packages in one program.

⛔ **AND THE NAME CHECK MISSED THEM ANYWAY, on its third blind spot in two days.** The grep matched
`^\\s*(pub )?(fn|const|struct) NAME` — and `player.loft` writes **`pub GRAVITY = 12.0`, with no
`const`**. It reported `GRAVITY` FREE. *A declaration-form the pattern does not know is a
declaration the pattern says is absent* — after `lib/*/tests/` at `B1c.2b`, and the excluded file
at `B1b.2c.2`.

### And a test file collided again, from the other direction

`tests/fall.loft` declared its own `fabs`, and moving it into `hex_editor` made that a redefinition
of **`hex_form::fabs`** — a name a *dependency* publishes. `WALK_SKIN` was a library name hitting a
test's; this is a test's hitting a dependency's. **A test file declares into its package's
namespace**, and that is now written down twice.

### What the fixture cost, and what it proved about the walker

⚠ **`landed` IS THE CLAIM, NOT THE HEIGHT.** Feet that track the terrain are the CLIMB —
`fall_step`'s `y <= gnd` branch, which a plain height lookup would also produce. `fl_landed` is
reachable only by being airborne and then touching down.

⛔ **AND THE FIRST TWO FIXTURES MEASURED THE WRONG THING, BOTH INSTRUCTIVELY.** Walking 3.3 units
after a raise found flat ground, because **the brush lands ten hexes ahead** — the editor's own help
line says so, and `B1b.2c.4b`'s water gate had already paid for it. Then *three* raises made a step
of ~11 height units against a cliff threshold of **4**, and the walker climbed on and **stopped
dead at 12.98 units** — fenced on the plateau by its own cliffs, which is `cliff.loft`'s recorded
cost reproduced exactly. **One** raise is a walkable slope, and over it the feet rise 0.10 → 0.54 →
1.13 → 1.40 and land three times.

## ✅ What `B1c.2c` turned up (2026-08-13) — the verdict is a WORLD, not a distance

**The page walks.** `make probe-demo`'s G block presses `w` six times, turns, and places: the
author is at **(2.454, 0)** having walked 2.454 world units, and the house lands at
**`32920:1885399240`** — where the *same house placed standing still* is `41145:1306471549`.

⚠ **THE DISTANCE IS NOT THE CLAIM AND MUST NOT BE.** A page whose walker updated a pose nothing
consulted would report a distance and a position exactly like this one, and every picture would
look right — this tree's commonest defect wearing a walker's clothes. So `G2` reads a **world**,
against a baseline the same run measures at `F4`. `DEMO_SABOTAGE=nowalk` lands on
`41145:1306471549` exactly.

### ⛔ And the G run itself went red once, on the jitter `B1c.1` had already measured

`w x6, d, h` failed: that run's single `d` press was **3 fixed steps** (0.2178 rad) rather than 4,
so the facing stayed at **rot 9** and the place was refused — nothing was built, and there was no
world to compare. It is the *same* 3-or-4 browser jitter `B1c.1` wrote down, and the `F` block
already handles it by retrying. `G` retries now.

✅ **AND `G2`'s THIRD OUTCOME IS WHAT MADE IT LEGIBLE.** It reported *"no house was placed in this
run, so it cannot say whether the walk reached the gesture — the turn may have landed short of an
admissible facing"* rather than *the walk did not reach the gesture*. **The instrument diagnosed
its own harness**, which is exactly the reason the third outcome was added an hour earlier.

⚠ **AND MY OWN READING FILTER NEARLY HID IT.** The grep pulling the verdict out of the transcript
matched `^   [DFGE][0-9]` — and a failed check is printed as `   ✗ G2 …`, so **the one line that
mattered was the one line the filter dropped**. The run's `demo FAIL` and its exit code said so
anyway. *A summary filter shaped around the passing case cannot report the failing one.*

⛔ **AND THE FIRST `nowalk` SABOTAGE WENT RED FOR THE WRONG REASON.** Pressing `d,h` once left the
turn one step short of an admissible facing on that run, so **no house was placed at all** — and
`G2` reported *"the same world F4 builds standing still"* about a run with no world in it. The
sabotage retries now, and `G2` has **three outcomes rather than two**: no house is *"this run
cannot say"*, not a failure of the walk. **An instrument must not describe a failure it did not
measure** — `F2`'s split, one block over.

✅ **AND THE WALK QUANTISES EXACTLY AS THE TURN DOES, measured over three runs.** The distance is
browser-dependent — **2.2406, 2.3473 and 2.4540** world units for the same six presses — and the
world the house lands in is **`32920:1885399240` every time**. A footprint takes the cell, so the
demo's walk is as assertable byte for byte as its turn, for the same reason.

⚠ **A SEEMINGLY IDENTICAL WORLD WAS THE FIRST RESULT, AND IT WAS CORRECT.** Two `w` presses before
placing gave byte-for-byte `41145:1306471549` — because two presses is ~0.75 units and the author
had not left the hex. **A footprint is placed on the LATTICE**, so a walk shorter than a cell moves
nothing, and that is the same quantisation `B1c.1` found in the turn. Six presses clear the cell
and the world moves.

### What the page owns, and what it does not

| | |
|---|---|
| the walk | ⚠ **`hex_editor::walk_to` and `hex_editor::edges_walk` — the server's own.** Nothing about walking is written twice |
| the CACHE | the page's, keyed on the same three terms as the server's: the cell, the world's edit clock, and the walker's LEVEL. ⚠ The third is not belt and braces — stepping off a deck changes the level without changing the cell |
| the reach | `LOCAL_COLL_R` is the server's 8, and for the sharpest reason available: **a walker seeing a smaller window than the server's could cross an edge the server blocks**, and the two authorities would disagree about the shape of the world with nothing written differently to show it |
| the feet | `author_on` — the cell's stored height. ⚠ The server integrates a FALL instead, which is `B1c.3` |

⚠ **AND THE SPEED HAD TO MOVE TOO, ALL THREE OF THEM.** `WALK_MS`, `WU_PER_M` and `FIGURE_M` were
the server's. The third is the one that would have been missed: the collision set needs *how tall a
step this walker can climb*, and a page reaching for `cliff.loft`'s `CLIFF_STEP_DEFAULT` (6) instead
of this walker's own (**4**) would have climbed ledges the server refuses. ⚠ **No world digest could
have seen it** — nothing is written differently until somebody walks. `tests/pose.loft` asserts the
4 *and* asserts it is not the default.

⚠ **AND ONE APOLOGY WAS DELETED, WHICH IS AS LOAD-BEARING AS WRITING IT WAS.** `B1c.1` added *"walking
is not built yet"* for a person holding W. It was true for exactly one step. A page that went on
saying it would be the `ps_status` literal a third time.

## ✅ What `B1c.2b` turned up (2026-08-13) — the blocker did not apply, and the sizing said it would

**`hex_editor::walk` is the walk.** `wall_stops_walk`, `wall_stops_view`, `walk_h`, `edges_walk`,
`edges_around`, `SKIN`, `stand_clear` and `walk_to` left `src/editor_server.loft`, which is
**7,743 → 7,400 lines**.

⛔ **THE BLOCKER THIS STEP WAS SIZED AROUND DOES NOT EXIST.** Both the plan and STATE recorded
*"`ground_under` → `hex_mesh::terrain_y` is a cycle, so the driver supplies a height sampler"*, and
the design work went into how to pass that sampler. **`walk_to` never calls `ground_under`.** Only
the FALL does, and the fall is `B1c.3`. The walk's own surface question is `walk_h`, which asks
`hex_voxel::world_surface` and falls back to **`hex_editor::terrain_h` — already this package's**.

> ⚠ **A cone measured from the wrong seeds sizes the wrong step.** `ground_under` was in the
> sizing because it is in the TICK beside the walk, not because the walk calls it. The fix is
> cheap and worth naming: **seed a cone from the function you are moving, never from the block it
> sits in.**

⚠ **AND THE OTHER THREE NAMES WERE ALREADY HERE**: `edge_layer`, `WALL_MAT` and `FENCE_MAT` are
`gesture.loft`'s. What is left is `hex_edge`, `hex_field`, `hex_way`, `hex_grid` and `hex_voxel` —
every one already a dependency.

### The move is verbatim, and the diff says exactly how verbatim

Body by body against the previous commit, comparing **code lines only** (the comments moved with
their functions): `wall_stops_walk`, `wall_stops_view`, `walk_h`, `SKIN`, `stand_clear` and
**`walk_to` (45 code lines) — IDENTICAL**. Seventeen lines changed, in two functions, for three
reasons and no others:

| what changed | why |
|---|---|
| `edges_walk` gains `step_max` | ⚠ **the library's own seam, not a change of mind.** It called the server's `cliff_step()`, and `cliff_edges` has said at its signature since it was written that *how tall a step a creature can take is a property of the CREATURE, not of the world*. The figure's proportions stay with the driver that knows which figure walks |
| `HEIGHT_SCALE` → `wld.w_unit` | the global is **wrong on a part world** (`door/slat` is authored at 0.125) and taking it would have added a dependency on a number that is only sometimes right. `W_UNIT` is 0.25 and so is `HEIGHT_SCALE`, so it is the same arithmetic in every landscape the editor makes — which is what lets the gates confirm it moved nothing |
| `hex_to_world(q,r,0)` → `hex_to_px` | it *is* `hex_to_px` wrapped in a `Vec3` with `y = 0 * HEIGHT_SCALE`, and only `.x`/`.z` were read. Taking the wrapper would have made **`graphics` a dependency of the walk**. `B1b.2c.1`'s `world_to_hex` retirement, through another door |

⚠ **AND THE GATES ARE THE OTHER HALF, because a diff cannot see a threading mistake.**
`make gate-character` is 8/8 with the numbers unmoved to three decimals — `climbed 0.492`,
`tickOvershoot 0.109`, `peakReached 0.497`, `steepestWalkedDegrees 30`, `fenceAt 6.062`. Those
gates drive `4:` and measure where a body ends up, which is precisely what a mis-passed `ref_units`
or a swapped `step_max` would move.

### ⛔ And a published `SKIN` broke the package — the grep that was right at `B1c.2a` was wrong here

`walk.loft` published `SKIN` (0.01, the skin a walker keeps off a wall) and
**`tests/boom.loft` already declares its own `SKIN`** (0.20, the camera boom's clearance). Two
different quantities, one generic name, and `hex_editor` would not build.

⛔ **THE NAME CHECK RAN AND EXCLUDED THE DIRECTORY THE COLLISION WAS IN.** It searched
`lib/*/src/*.loft`, `src/` and the registry — **not `lib/*/tests/`.** That is `B1b.2c.2`'s finding
*(a grep's exclusion is an assumption)* repeated one directory over, by the same hand, in the same
session that wrote it down at `B1c.2a`. ⚠ **A test file declares names into the same package
namespace**, and this tree had no reason to know that until something published a name generic
enough to hit one.

⚠ **AND THE COUNT LIED IN THE INFORMATIVE DIRECTION.** The suite reported **436**, not 446 — the
ten `boom.loft` tests were *missing rather than failing*, because a parse error takes the whole
file out. **A test count that DROPS is a file that did not run**, and it reads as a smaller suite
rather than a broken one.

✅ **THE FIX IS THE NAME**: `WALK_SKIN`. A bare `SKIN` leaving a library claims a word in every
consumer's namespace, and the camera site that borrows the value now says it is borrowing a
walker's. The re-check covers all **22** published names of `pose`, `cliff` and `walk` against
`lib/` **including tests**, `src/`, `../loft-libs-world/` and the registry: no second declaration
anywhere.

⛔ **AND ONE `sed` TOOK OUT THINGS THAT MERELY CONTAINED THE NAME.** Qualifying every `SKIN` as
`hex_editor::SKIN` also rewrote `CAM_SKIN`, `CAM_SHOULDER` and six comments — `A-hex_editor::SKIN
at the hip`. It failed loudly (the compiler refused `hex_editor::CAM_hex_editor::SKIN`), which is
the lucky half; the comments would have shipped. **A bulk rename over a whole file is a
substring match, and a constant whose name is a prefix of another is where it bites.**

## ✅ What `B1c.2a` turned up (2026-08-13) — a debt written down twice, and the grep that was right this time

**`cliff.loft` is `hex_editor`'s.** 130 lines, 3 public functions, its 10 test fns with it.

⚠ **THE MOVE WAS ALREADY ARGUED FOR, IN TWO FILES, BY WHOEVER HIT THE WALL EACH WAY.**
`cliff.loft`'s header said its target home is `hex_edge`'s shared layer and that it sat in
`moros_sim` only because *"the shared tree is another agent's and moving it is an ask rather than a
task"*. `gesture.loft`'s `stair_cut` said the mirror image — *"it came from
`moros_sim::stair_height` — a MOROS package — and this is a lavition one, so taking the dependency
would point the arrow backwards"* — and worked around it by taking the step height as a parameter.
**Neither note could pay the debt on its own; the walker arriving in `hex_editor` is what did.**

⚠ **AND THE GREP WAS THE RIGHT ONE THIS TIME, WHICH IS `B1b.2c.2`'s LESSON APPLIED RATHER THAN
RE-LEARNED.** That step concluded five primitives had one consumer *from a grep that excluded the
file they lived in*. So this one searched the whole tree, `moros_sim` included, for every one of
the five public names — and the answer was clean: `cliff_edges` and `fall_step` are called by
`moros_sim`'s **own tests** and by `src/editor_server.loft`, and by nothing in `moros_sim/src` at
all. `cliff_step_ok` and `stair_height` are used only inside `cliff.loft` itself.

⚠ **`hex_edge` LEFT THE MANIFEST WITH IT.** `cliff.loft` was the only file in the package using it
— so a dependency that was real became a dependency that was stale in the same commit, and a
manifest nobody re-derives is exactly where that would have sat.

⚠ **THE TEST-NAME DIFF WAS OFF BY ONE AND THE ONE IS THE FINDING.** Predicted `-9`, measured
`-10`: the file has 9 `test_*` functions and a zero-argument helper `flat()`, **which the runner
counts and runs as a test**. hex_editor **436/42 → 446/43**, moros_sim **313/26 → 303/25**, every
row accounted for. *A count of what you meant is not a count of what the tool sees.*

⏭ **AND ONE OF ITS DEFERRALS HAS TRIGGERED, RESOLVED SOMEWHERE ELSE.** The file says its symmetric
block is survivable *"only because under a symmetric block a walker can never REACH the high side
on foot — the asymmetry becomes observable the day a walker can descend faster than it climbs,
which needs a FALL. There is none yet."* **There is now**, and the direction was resolved by the
CALLER: `walk_to` compares both surfaces at the walker's own reference and lets a descent through.
The note is corrected in place rather than left to be discovered.

### ⏭ And the WALK is sized now — two blockers, both real, both payable

`chunk_mesh_props`-style measurement, done before any code: the walk in `src/editor_server.loft` is
**18 functions** reachable from `walk_to`/`walk_h`/`edges_walk`/`ground_under`/`cliff_step`. What it
calls outside itself:

| package | names | can `hex_editor` reach it? |
|---|---|---|
| `hex_edge` · `hex_grid` · `hex_way` · `hex_voxel` | `sweep_path`, `collide`, `edge_block*`, `hex_neighbor`, `nearest_seg`, `seg_*`, `track_distance`, `way_surfaces`, `world_cell`, `world_surface`, `world_ground_layer` | ✅ **already dependencies** |
| `hex_mesh` | `terrain_y`, through `ground_under` | ⛔ **CYCLE** — `hex_mesh` depends on `hex_editor`. Recorded on `Author` itself since `R1a` |
| `moros_sim` | `cliff_edges`, `fall_step` | ⛔ **the arrow** — Moros-side, and a lavition package reaching for it points [LAVITION_SPLIT](../../doc/claude/LAVITION_SPLIT.md)'s arrow backwards |

⏭ **BOTH HAVE THE SAME SHAPE OF ANSWER AND THIS TREE HAS TAKEN IT TWICE.** `R1a` answered the
cycle by making the ground height part of the **pose** — the driver supplies what it alone can
know — and `edges_walk` already takes its terrain as a **`fn(integer, integer) -> integer`**
rather than as a world. `C1` names the same shape for the camera (*`surface_h_at` as a `fn(…)`
parameter*). So the walk takes a height sampler, and `fall.loft`/`cliff.loft` are 3 functions
whose own dependencies are `hex_field`/`hex_edge` and floats — `B1b.2c.1`'s bill, a second time.

## ✅ What `B2`/`B3` turned up (2026-08-13) — the demo needed no code, and the measurement is why

**`make probe-demo`.** `_site/index.html` opens from a disk with no listener at either end,
decides it is on its own, draws its own world and writes what it is pressed.

⛔ **THE FIRST MEASUREMENT CANCELLED MOST OF THE STEP.** Before a line of `build-pages.mjs` was
written, the existing engine build was opened from `file://` — and it already worked: **180 dials,
`edits stay in this page`, `local drew grass`, and `ArrowUp` moving the world half from 5 colours
to 195.** So `B2` is not *make the page work without a server*; that was true and untested. `B2`
is **packaging plus a check**, and the page is a `cp`.

⚠ **WHICH IS WHY `B2` AND `B3` ARE ONE COMMIT.** A copy decides nothing, so it cannot go red on
its own — the lower bound of a safe step. The step that CAN go red is *open the demo and read an
edit out of it*, and splitting them would have manufactured this tree's commonest defect on
purpose: a build step, green, that nothing opens.

⚠ **THE ONE THING THE BUILD DECIDES IS STALENESS, AND IT IS A REFUSAL RATHER THAN A SKIP.** An
engine older than its own sources is refused by name (`the client engine is OLDER than 1 of its
sources`), because a demo assembled from last week's editor passes its own check and ships. ⚠
**That is the opposite of `run-gates.sh`'s rule** — *the build is never skipped on a guess* — and
the difference is what the answer is used for: a timestamp that SKIPS a rebuild runs old code
silently, a timestamp that REFUSES costs one `make client` when it is wrong.

### Two sabotages, red in different places

| | red where | and nowhere else |
|---|---|---|
| `emptypage` — the right elements, no editor | **all seven** — no banner, no authority, no readable shot | — |
| `deadkey` — press `z`, a key with no verb | `D5` the picture did not change · `D6` no gesture reached the world | `D1`–`D4`, `D7` green: it booted, went local, drew, held still and named its surface |

⚠ **`deadkey` IS THE ONE WORTH KEEPING.** *The picture changed after a key* is only evidence if
*the picture does not change without one*, and this page re-meshes 49 tiles per gesture — a check
reading a colour count seconds apart would pass on a page that redrew for any reason at all.

### A `file://` page CAN reach a server, and that is what makes `B2b` possible

**`probe/b1c/origin.mjs`** — a null-origin page dialling two ports on this box: **`live OPEN`,
`dead ERROR`**, with `probe/b1b/static.mjs --ws-silent` printing `UPGRADE COMPLETED` as the other
side's own evidence. So a demo opened off a disk beside a running editor is not barred by browser
policy from attaching to it; what is missing is a way to TELL it where.

⚠ **AND THE CONTROL IS WHY THE FIRST RUN SAID NOTHING.** Both dials errored — because the listener
was never started (its arguments were in the wrong order), and a probe whose *live* case fails the
same way as its *dead* case has measured the harness. The `dead ERROR` row is what separates *the
browser refused* from *nothing was there*.

### ✅ `B2b` — the demo attaches to a server it is TOLD about, and being told is the whole design

**`WS_URL` answers *the server that served me***, which is the entire answer while one process
serves the page and the socket — and it is no answer at all for a page opened off a disk. The
client dials a **list** now: `/ws` first, then whatever `servers.txt` in its base tree names.
`tools/build-pages.mjs --servers <url>` writes that file as a `globalThis.loftBaseFS` prelude —
**`P6`'s mechanism, and this is its first live consumer**: nothing in `editor_client.loft` read a
file until now.

⚠ **THE HOST IS NOT COMPILED IN, AND THAT IS THE SAFETY RATHER THAN THE STYLE.** A client
carrying `ws://127.0.0.1:18090/ws` in its binary would have every page on this box silently adopt
whatever is on that port — somebody's live session, and `probe/b1b/auth.sh`'s **run B, whose whole
subject is a page that finds NO server**. That is `B1b.1b`'s two-authorities hazard with the
decision moved from the author to a constant. `E3` is the check that says it did not happen: a
page nobody told never dials the port **while a server is sitting on it**.

⚠ **THE ORDER IS THE ONE NON-GUESS.** `/ws` is the only candidate the page has evidence for — it
is where the bytes came from — and every written-down host is somebody's earlier assumption about
this box. A list that dialled the file first would let a stale `servers.txt` outrank the server
actually serving the page.

⚠ **`LOCAL_AFTER` IS PER CANDIDATE, NOT CUMULATIVE**, and the counter resets on the hop. The bound
is measured against what ONE working connection costs (dial 4), so a shared budget would hand the
last candidate whatever the earlier ones left of it — and the last candidate is the one a person
wrote down on purpose. The cost is paid only on the no-server path: `E2` walks both and lands
local in the same wall-clock the D run takes.

⚠ **THE ABANDONED HANDLE IS CLOSED, AND THAT IS A HAZARD RATHER THAN TIDINESS.** `ws_handler`
returns a usable handle before the socket opens, so a candidate the page has given up on can open
*after* it moved on — leaving a server holding a connection to a client that will never speak to
it again, with nothing here able to notice.

⛔ **AND THE WRITE PATH MANGLED ITS OWN PRELUDE, CAUGHT BY THE BYTE COUNT.** Splicing a string
into a 4.7 MB binary needs one encoding for both, and `latin1` — the only lossless one for the
engine's bytes — truncates every code point above `0xFF`: an em dash in a comment line came out as
two spaces. The assertion that the page is *the engine build plus exactly this prelude* is what
saw it; `grep loftBaseFS` said 4 and would have shipped. **The splice is `Buffer.concat` now, so
the engine's bytes are never decoded at all.**

⚠ **AND `wait` ON THE PROBE'S OWN LISTENER HUNG THE SCRIPT FOR 800 SECONDS WITH `E1` ALREADY GREEN
IN ITS LOG.** The browser still holds the socket the listener accepted, so the shell sat on a job
that had been signalled and had not finished dying. The next run needs one thing — the **port**
back — so that is what is waited for, bounded. ⚠ A probe that hangs after its subject succeeded
reads as a broken subject.

### ⚠ And a `--html` page HAS a clock — measured, and with a trap beside it

`probe/b1c/clock.loft` emitted a page whose host binds
`loft_host_time_ticks_us() { return performance.now() * 1000; }` — monotonic and page-relative,
which is `ticks()`'s contract. **`B1c`'s integrator can therefore be spelled in the page**, and
the `host_input()` precedent (a name that exists everywhere and blocks in one place) does not
repeat here.

⛔ **BUT THE EMITTED PAGE SHIMS UNBOUND NAMES TO A CONSTANT AND ONLY `console.warn`s.**
`loft_host_time_ticks_us` is in that shim's list with a fallback of **`0`** — so a build where the
clock bridge is absent has every `ticks()` return the same instant, silently, and an integrator
reading `dt = 0` simply never moves. **The name being present in the page is not the measurement;
the clock ADVANCING is.**

## What `B1a` turned up (2026-08-13) — and no gate had ever pressed a key in the client

**`src/editor_client.loft`'s five one-to-one keys resolve through `hex_editor::verb_of` now**,
with a local `act(h, verb)` holding which message implements a verb. `ArrowUp` `ArrowDown` `H`
`F` `G` moved; `O`/`P` did not, for the reason written at the site. `make probe-b1a`: **7
sentences identical and the saved world identical** (`82d622b3`), the converted client against a
committed baseline of the client from before the change.

⚠ **NOTHING IN THIS TREE HAD EVER PRESSED A KEY IN THE CLIENT.** `make gate` drives the **server**
through `tools/script.mjs`; `make client-check` counts colours in a picture. So the client's key
table could have said anything and all 48 gates would have stayed green — which is how it stayed a
fourth site through `V1`, `V2a`, `V2b` and `V3`, every one of which was about exactly this.
`probe/b1a` is the first check of it, and its existence is the finding.

⚠ **THE FIRST FILTER WAS BLIND TO HALF THE STEP, AND IT WAS BLIND BY INHERITANCE.** It was copied
from `probe/k1`, which drops `brush ` — and `brush (10,0) — 2 chunks, 10 dirty` is the **only**
thing a raise says. Both arrows vanished and the capture read `3 sentences` as though they had
never been pressed. **A filter inherited from a probe with a different subject is an instrument
nobody aimed.** ⏭ And the fix is not a bigger number: the check is now a **presence test per
gesture** — three brushes, one house, two rings — because a count of seven cannot say *which* key
lost its trace, and sabotage 2 reports `brush 4 (want 3) · house 0 (want 1)` on sight.

⚠ **`K1`'s FINDING REPRODUCED ONE DRIVER OUT, AND IT IS WHY THERE ARE TWO INSTRUMENTS.** Sabotage
1 points `act`'s `fence` at the wall's message: **all seven sentences stay identical** — `do_fence`
says `fenced 42 edges (21 stored outside) at (0,0) radius 3` for both — and only the world moves,
`82d622b3` → `cdabc1dc`. Sabotage 2 points `place` at a raise: the transcript, the presence check
**and** the world all go red. **Neither instrument alone would have covered the five keys.**

⚠ **AND THE BASELINE WAS CHECKED AGAINST ITSELF BEFORE IT WAS TRUSTED.** The pre-change client was
run twice — capture, then compare — and both the transcript and the md5 held. Without that, an
equal result says only that two runs of anything agree, and this probe has a browser, a socket, a
tick and a mesher between the key and the number.

⚠ **THE PROBE DELIBERATELY DOES NOT WALK.** Holding `w` integrates movement on the server's tick,
so how far the character gets is a wall clock, and two runs stopping in different places build
different worlds for a reason that has nothing to do with what a key means. Every gesture happens
where the fresh server put the character. ⏭ **Which surfaced a live fact worth a line: `h` at the
spawn point is REFUSED** — *"a footprint at this facing has no mitred corners; turn one step"*. A
person opening the editor and pressing the house key is told no. Not this step's to fix; the
refusal is a perfectly good sentence to compare, and `K-FIT` names the offer.

## ✅ What `B1b.2c.4c` turned up (2026-08-13) — a total cannot say WHICH, and that is the phase

**The page draws all eleven surfaces.** `local_ground` is `local_surfaces`: one
`hex_mesh::chunk_meshes_all` per tile, the ground through the installer it always used and the
other ten through `install_surface`, whose colour and ramp are `hex_mesh`'s — the same two calls
`send_surfaces` makes before it puts them on the wire. **`B1b.2c` is closed**, and the picture is
`shots/b1b-2c4c-eleven-surfaces.png`: a flat green plane before, a raised bowl inside a grey
palisade after.

⛔ **EVERY CHECK THAT ALREADY EXISTED WAS GREEN THROUGH ALL OF IT, AND THAT IS THE FINDING.**
`AUTH_SABOTAGE=groundonly` — the page one commit back, meshing the ground and filing nothing else —
leaves **B8** (the sentences), **B10** (the world key), **B11** (the session), **D3** (the raise
redrew) and **D4** (the far ground held) all green. A fence rung in local mode was **written, keyed,
byte-identical to the runner's, and invisible**, and not one instrument in a 33-check file was
about whether a WALL reached the picture.

⚠ **SO THE CLIENT NAMES THE SURFACES, BECAUSE A TOTAL RISES ON A PAGE THAT DRAWS ONE.**
`client: local drew grass` at boot and `grass,wall` after the rings. The float count could not
carry this claim: a raise moves the GROUND, so *floats redrawn* goes up on every gesture whether or
not anything else is drawn — which is `probe-mesher`'s finding one step back (*"63 of them had
geometry" cannot say WHICH*) arriving in the consumer that step existed for. ⚠ And the list is read
off the **>= 6 floats that decide whether a buffer is installed at all**, so a surface that meshed
to nothing cannot appear in it.

⚠ **AND `E1` IS THE NEGATIVE CONTROL ON THE SAME RUN**: an unwritten world must draw `grass` and
nothing else. Without it, a page that filed a wall mesh for every tile unconditionally would pass
`E2` while drawing furniture nobody put there.

⚠ **THE `add_mesh` DEFECT WAS WAITING IN `install_ground` AND IS NOT REPEATED.** Its `len < 6`
guard returns **before** `drop_part` — the exact shape `add_mesh` twenty lines up documents at
length, where an empty vertex list is a CLEAR and skipping it leaves the old buffer bound. It never
mattered for the ground, which is never empty; it matters for these ten, which are empty most of
the time and go empty again when what filled them is removed. `install_surface` drops first. **A
defect that is harmless in its only caller is a defect waiting for its second.**

## ⛔ What `B1b.2c.4b` turned up (2026-08-13) — one world, two pictures, decided by delivery

**Getting the page a ramp to draw with found a shipped bug in the server.** A chunk's surfaces
reach a client two ways — the dirty **FLUSH** after an edit, and the chunk **STREAM** when a tile
comes into view — and they were two copies of one loop. The flush asked `hex_mesh::surface_ramp`;
the stream wrote a literal `0`, **under a comment claiming *"the same loop as the flush, over the
same list, in the same order"***. The ramp slot is a MODE (0 flat, 1 by height, 2 by DEPTH), so
**water drew flat when a tile came into view and depth-ramped the moment anything near it was
edited.** One world, two pictures, decided by which path delivered the tile.

⚠ **`chunk_meshes_all` UNIFIED THE MESHES AND LEFT THE SEND SPELLED TWICE** — which is exactly the
half a reader assumes went with it, and the comment above the copy says so out loud. **The lesson
is not "check the copies": it is that a helper which removes one duplication puts a comment over
the one it did not remove.**

⚠ **AND THERE WAS NO WATER GATE AT ALL, WHICH IS WHY IT SURVIVED.** Water is the eleventh surface
(plan 20 `A10`) and the **only one besides the ground whose ramp is not flat** — so it is the one
surface on which the two paths could disagree, and the only surface nothing drove.
`tools/gates/world/water.mjs` drives it now and goes red on the bug it was written for:
`rampFromTheFlush [2]` against `rampFromTheStream [0]`.

✅ **THE FIX IS STRUCTURAL, NOT A LITERAL CORRECTED.** `send_surfaces` is one function with two
callers, so the second spelling is not expressible — cheaper than the instrument that would have
caught it, which is this tree's chokepoint rule one wire down. The ground's own `1` went the same
way: `ground_ramp()` **asks** `surface_ramp` by the surface's own name at both of its two sites.

⚠ **THE FIXTURE IS THE HALF THAT TOOK THE WORK, AND IT WAS MEASURED TWICE.** Water refuses on the
world the server starts with — *"water at -2 leaves no room for a bed 12 deep above the reserve"* —
because a river digs its bed DOWN from the terrain, so the gate raises a band first. ⚠ And the
first raise probe read a height that never moved: **the brush is ten hexes AHEAD of the character**,
which the editor's own help line says and no gate had ever needed to know.

⚠ **AND THE GATE'S OWN WAIT WAS A 20-SECOND SILENT TIMEOUT.** It waited on `S:rebuilt`, which the
last placement's flush has usually already closed — `road.mjs` warns about that race one toggle
over. Waiting for **the water surface to arrive** is the condition it actually wanted, cannot be
missed by being early, and took the gate from 44.7 s to **26.6 s**.

## ✅ What `B1b.2c.4a` turned up (2026-08-13) — a green suite that printed NOTHING

**The mesher has one body.** 41 declarations — 33 functions and 8 constants — and **1,744 lines**
left `src/editor_server.loft` (9,508 → 7,764), the five callers take `hex_mesh::chunk_meshes_all`,
and `EDITOR_PROBE=meshcmp` went with them: there is nothing left to compare against, and the
dependency arrow makes a second declaration `Cannot redefine` rather than a drift nobody notices.

⛔ **AND THE INSTRUMENT ANSWERED WITH SILENCE, WHICH IS THE ONE ANSWER A DELETION MUST NOT TRUST.**
`make gate` exited 0 with an **empty log** — and `run-gates.sh` says why in its own comment: *a
green gate says nothing, and a red one says everything*, which is loft's Goal F applied on purpose.
So rc=0 and no output is exactly what a suite that never ran looks like, on the one change whose
whole claim is *nothing moved*. `GATE_VERBOSE=1` is what turns it into a number: **48 PASS, 0 FAIL,
against 48 gate files on disk**. ⚠ The rule this tree already has — *match a line you know is there
before believing a count of zero* — has a mirror: **count the lines you know should be there before
believing a silence.**

⚠ **THE FOUR SURVIVORS ARE THE STEP'S REAL DECISION, AND THE FILE HAD ALREADY WRITTEN IT DOWN.**
`WALL_UP`, `SPECIES_BUSH`, `opening_kind_index` and `terrain_y` are the mesher's *and* the
server's — an opening's fit check, a scatter's species, a wire kind, and the camera march that
samples the ground the mesh drew. `hex_mesh`'s own comment said they were **deliberately not
published** *"because `src/editor_server.loft` declares the same names while both copies live, and
a program declaring a name a library publishes SHADOWS it invisibly (`HOUSE_W`, measured)"*. That
condition ended with this step and not before: publishing them at `c.3` would have left the server
reading its own `12` whatever the library said. They are `pub` now and the server's copies are gone.

⚠ **AND `terrain_y` WAS THE ONE WORTH THE TROUBLE — 26 LINES OF TRIANGLE INTERPOLATION IN TWO
FILES.** Its two bodies differed in exactly one thing: the server called `moros_render::world_to_hex`
where the library calls `px_to_hex`, and the first is a wrapper round the second returning a struct.
So the swap retires **three more `world_to_hex` sites** — plan 19 `L6.3a`'s bill, again through a
side door — and the camera, the cart's wheels and the feet now read the height off one function.

⚠ **`probe-verbs` WENT RED ONCE AND THE CAUSE WAS THE OBSERVER.** It was launched while
`GATE_VERBOSE=1 make gate` had 48 servers in flight; the verbed run's transcript arrived with one
line of eight. Re-run alone: green, 17 checks. **A probe that starts its own server is not
parallel-safe with a suite that starts 48**, and a truncated transcript is what contention looks
like from inside.

## ✅ What `B1b.2c.3` turned up (2026-08-13) — the pass was over five surfaces of eleven

**The props mesher is `hex_mesh`'s** — 1342 lines, 32 functions, 9 constants — and both bodies are
live: the server's is `chunk_meshes_all_srv`, scaffolding until `c.4`. `make probe-mesher` compares
them over one scene, **49 tiles × 11 surfaces**, and every mesh is the same.

⛔ **AND THE FIRST RUN PASSED OVER FIVE SURFACES OF ELEVEN.** The fixture placed a house, rang a
fence and cut an opening — and the per-surface counter reported **six never drawn**: road, field,
tree, soffit, rock and water. *An equality of two empty meshes is a pass that means nothing*, which
is the trap the probe's own header had been written to warn about, sprung on its first run. **The
counter is the instrument that caught it**, and it exists because "63 of them had geometry" cannot
say WHICH.

⚠ **AND THE SOFFIT NEEDED A CELLAR, WHICH THE GROUND REFUSED.** A ceiling's underside is a surface
nothing above ground draws, so the fixture digs one — and the storey gesture said *"floor at 4
leaves no room for a storey of 12"*. The seeded ground is at **30** now rather than 4, which lit
the rock faces too. All eleven are drawn, on 99 tile-surfaces.

⚠ **THE TWO COPIES CANNOT SHARE A NAME, AND THAT IS THE THIRD TIME THE COMPILER HAS DECIDED THE
SHAPE OF THIS MOVE.** `c.1` got *declared by more than one package* (siblings), `c.2` got *Cannot
redefine* (a package and its dependency), and here the same rule forced the server's copy to take
a `_srv` suffix for the duration — which is `W1`'s two-encoders period, made explicit by the
language instead of by discipline.

⚠ **IT ARRIVED WITH ITS LATTICE CALLS PAID.** `moros_render::world_to_hex` is a Moros wrapper round
`hex_grid::px_to_hex` that returns a struct; the two sites in the mesher take the pair directly —
two of the thirty sites plan 19 `L6.3a` otherwise has to pay, and the reason the move is possible
at all. `hex_way` and `hex_part` joined `hex_mesh`'s dependencies; neither widens the cone in a
direction that matters, because `hex_editor` — already there — depends on both.

## ⛔ What `B1b.2c.2` turned up (2026-08-13) — the home was wrong, and a grep is why

**The five primitives are `hex_proj`'s.** Not `hex_mesh`'s, which is where `c.1` put them one
commit earlier — and the reason is a measurement that had a hole in it.

⛔ **`c.1` CONCLUDED THE EDITOR WAS THEIR ONLY CONSUMER, FROM A GREP THAT EXCLUDED THE FILE THEY
LIVE IN.** Looking for who else calls them, the sweep filtered out `moros_render`'s own source — so
it could not see that **all five have internal users there**: `emit_marker`, `emit_to_material`,
`emit_thick_flat_wall`, `emit_thick_curved_wall` and `emit_hex_item`. *A grep's exclusion is an
assumption, and this one assumed the question it was asked to answer.*

✅ **AND THE COMPILER REFUSED BOTH WAYS OUT, WHICH IS HOW THE RIGHT HOME WAS FOUND.** Deleting
them broke `moros_render`; keeping a copy on each side is the duplication this tree exists not to
have — and `moros_render` **depends on** `hex_proj`, so a duplicate declaration is not even
expressible: `error: Cannot redefine 'emit_box' (already defined at …/hex_proj/…)`. ⚠ That is a
*different* diagnostic from `c.1`'s `declared by more than one package`, and the difference is
exactly the dependency arrow: siblings are ambiguous, a package and its dependency are a
redefinition.

✅ **SO THE HOME IS THE LEAF BOTH SIDES ALREADY DEPEND ON.** `hex_proj` is `hex_grid` + `graphics`
and nothing else, which is precisely the cone the five need — `hex_to_world` and
`proj_corner_offset` are its own. `moros_render` declares it, `hex_mesh` declares it, so **nothing
gained a dependency and no arrow moved**.

⚠ **THE EQUALITY IS A CHAIN, AND EACH LINK IS MEASURED.** `c.1` compared `moros_render`'s five
against the copy, mesh checksum by mesh checksum with a control. `c.2`'s second hop is a **verbatim
relocation** — five of five function bodies identical, modulo one `pub` — checked with a diff
against the previous commit rather than asserted. And the **14 tests moved with the subject**:
`moros_render` 167 → **153**, `hex_proj` 8 → **22**, every row accounted for, which is `V3`'s rule
that a deletion's instrument is the test-name arithmetic and not a green suite.

⚠ **THREE TESTS USED THEM AS FIXTURES FOR ANOTHER SUBJECT AND NOW BUILD THEIR OWN.**
`flag_occluders` reads `mesh_aabb`, so what its fixture owes is an EXTENT and not a shape — two
vertices where a box gave twenty-four, **and a `fx_extent_is` that asserts the bounding box**, so a
fixture that stopped spanning what it claims cannot quietly change what the probe measures. The
adversarial chain probe needs one vertex at the origin.

⏭ **AND `EDITOR_PROBE=emitcmp` IS SPENT.** It existed because two copies were visible from the
server; there is one copy now, and the dependency arrow makes a second one a compile error. **What
the probe measured, the compiler enforces** — and what keeps the geometry honest is the fourteen
tests that travelled with it.

## ◐ What sizing `B1b.2c` turned up (2026-08-13) — the blocker was an ARROW, and it is payable

**Measured before any code**: the props mesher — `chunk_mesh_props` plus everything it reaches — is
**32 functions, 1342 lines and 9 constants**, and it calls **nothing else of the server's**. That
is a clean move, and it is an `L` rather than the `M` the row guessed.

⛔ **AND IT COULD NOT MOVE, BECAUSE IT REACHES INTO `moros_render` AT THREE NAMES.** `hex_mesh` is
a lavition package and `moros_render` is Moros's, so a mesher that reached for them would point the
split's arrow backwards — [LAVITION_SPLIT](../../doc/claude/LAVITION_SPLIT.md)'s bar is *build,
test and gate with the Moros tree absent*. ✅ **Payable rather than blocking**: the three are
`emit_hex_surface`, `emit_item_placeholder` and `world_to_hex`, and with their two helpers they are
**141 lines whose every dependency is already inside `hex_mesh`'s cone**. `world_to_hex` is a Moros
name for `hex_grid::px_to_hex` — plan 19 `L6.3a`'s own bill, arriving through a different door.

✅ **`B1b.2c.1` IS BUILT: the five are `hex_mesh`'s.** `make probe-emitters` — and the pair is
compared where both are visible, which is exactly one place: **the SERVER**, because it imports
both packages, a library test cannot (that is what the arrow means), and a probe program would have
to import Moros to ask the question.

```
emit_hex_surface   : moros_render 2688447849 · hex_mesh 2688447849 — same (7/7 vertices, 6/6 triangles)
emit_box           : moros_render 1180467051 · hex_mesh 1180467051 — same
emit_cylinder_post : moros_render  187754942 · hex_mesh  187754942 — same
placeholder TREE   : moros_render 1085967138 · hex_mesh 1085967138 — same
placeholder PROP   : moros_render  459251911 · hex_mesh  459251911 — same
CONTROL a box 0.1 deeper: different, as it must be
```

⚠ **THE CONTROL IS NOT DECORATION.** Five equalities prove nothing if `mesh_crc` answers the same
number for everything, so one deliberately different box must differ — and each primitive is asked
**separately**, because a total cannot say which of five moved wrong and a mechanical copy fails one
function at a time.

✅ **AND THE COMPILER FOUND EVERY CALL SITE, WHICH IS THE OPPOSITE OF THIS TREE'S USUAL PROBLEM.**
Declaring the five in a second package made every bare call **ambiguous**, and loft refused the
build naming each one — *"`emit_box` is declared by more than one package here — write
hex_mesh::emit_box or moros_render::emit_box to say which"*. Ten sites, none of which could have
been forgotten. ⚠ That is the mechanism CLAUDE.md records as *measured 2026-08-11*, doing exactly
what it says on a real move.

⏭ **WHAT `c.2` HAS TO SOLVE, AND IT IS NOT THE DELETION.** 14 of `moros_render`'s tests are ABOUT
the five and move with them; **three more use them as fixtures for another subject** —
`flag_occluders` and an adversarial vector test — and those cannot simply call `hex_mesh::`,
because **`moros_render` must not depend on `hex_mesh`**: `moros_sim` depends on `moros_render`,
so it would inherit `hex_editor`'s whole cone, which is the experiment `hex_mesh`'s own `loft.toml`
records as *tried and reverted*. They build their own fixture geometry instead.

## ✅ What `B1b.2` turned up (2026-08-13) — three instruments were blind before the page was

**The page draws now.** A camera of its own, `LOCAL_TILES` of ground meshed out of its own cache
at the moment the authority moves, and a re-mesh on every write. `make probe-auth` is **33
checks**, five of them about the picture.

⛔ **NOTHING HAD BEEN ON SCREEN AT ALL, AND `draw_world` SAYS WHY IN ONE LINE** —
`if !st.has_cam { return; }`. The camera is the SERVER's solve, arriving as `C:`, so the page
`B1b.1b` shipped drew the sky, drew the panel over it, and stopped: **a second authority writing a
world nobody could see**, with every number in the transcript correct. The panel is what made it
look alive.

⚠ **THE LOCAL CAMERA IS A STAND-IN AND IT IS WRITTEN AS ONE.** `CAMERA_INDOORS`'s five modes are a
real solve over `shelter_at` and they are `C1`–`C4`'s job to move into `hex_cam`; re-implementing
any of that here would be `W4` on the camera — two answers to *where is the eye*. This does the one
thing a page needs to be an editor, a fixed boom behind the author, and `C3` replaces it whole.

**Twelve sabotages, each red somewhere different:**

| sabotage | red where | and nowhere else |
|---|---|---|
| `nocam` — local mode writes and never sets a camera | `D1` sky alone · `D3` | the page `B1b.1b` shipped: every number right, nothing on screen |
| `nomesh` — a camera, and no ground meshed at boot | `D1` sky alone · `D4` | ⛔ its FIRST form was a NO-OP and passed all 33 — see below. `D4` moves because the first raise installs the whole neighbourhood, so the far ground arrives late |
| `stale` — it writes and does not redraw | `D3` **alone** | the picture is a photograph of the world before the gesture |
| `elsewhere` — the same six verbs, one world-unit over | `B10` **alone** | every count, every sentence AND the whole session unchanged |
| `scratchsession` — pressed into a session nobody keeps | `B11` **alone** | the world **byte-identical** |
| `sendlocal` — local is announced and it sends anyway | `B8`×5 · `B10` `B11` · `D3` | ⚠ **the panel is GREEN** — a status line alone would call this a pass |
| `nolocaldirty` — it goes local and the panel is not told | `B7` **alone** | `nodirty`'s mirror, one authority over |
| `nolocal` — it never gives up dialling | `B1` `B7` `B8`×5 `B9` `B10` `B11` `D3` | |
| `eager` — one unanswered dial is enough to give up | `A2` `A3` **`A4`** · `B6` · `C2` `C3` `C4` **`C5`** | the starred pair is the hazard: a live server given up on, and silence read as absence |
| `literal` — the status line as it was | `A1` · `B4` · `B7` | |
| `nodirty` — the CONNECT fact moves and the panel is not told | `C4` **alone** | green in A and B, which is why C exists |
| `assume` — authority off the send, not off its succeeding | `B3`–`B11` and every `D` | invisible to A: with a server there, assuming is right |

⛔ **AND ONE SABOTAGE WAS A NO-OP WEARING A PASS'S CLOTHES.** `nomesh` was written as a `return;`
appended after the LAST statement of `local_camera` — it changed the file, so the `cmp` guard that
exists to catch a drifted pattern was satisfied, and the run came back **33 green**. *The guard
proves a change was made, never that the change matters.* A sabotage that is red nowhere is either
a blind instrument or a no-op, and only reading tells you which. ⏭ It could not be written as a
line-delete because the call was inside a `println`'s format string — which is why both re-mesh
calls are hoisted out of their strings now: **a side effect inside a format string is a step no
reader expects and no patch can reach.**

### Three instruments were wrong before the subject was

⛔ **THE CANVAS PHOTOGRAPHED WHITE WHILE THE CLIENT RAN FLAWLESSLY.** 49 meshes uploaded, 300
frames, not one exception — and `Page.captureScreenshot` returned a blank page with scrollbars.
The driver was copied from `probe/b1a`, which passes `--use-gl=swiftshader` and never photographs
anything; the tool in this tree that does (`html_render_check.mjs`) passes
`--use-gl=angle --use-angle=swiftshader`. **What a driver inherits is whatever its parent needed** —
the third time that sentence has been earned in this probe directory.

⛔ **AND THE FIRST REGION REPORTED A BLANK WORLD WHILE THE PAGE DREW PERFECTLY.** One rectangle in
the middle of the world half counted **1 colour** — and an unwritten world is a FLAT PLANE at one
height under a constant ambient, so it genuinely is one colour. *A count cannot see a horizon
unless the horizon is inside the frame you hand it.* The full-frame capture is what said so, and
the region that answers *is anything drawn* spans the skyline now.

⛔ **AND THE FIXED VERSION STILL PASSED WITH NO CAMERA AT ALL — the sabotage found it.**
`AUTH_SABOTAGE=nocam` should be red on *is anything drawn*; it was green, because the region
started at canvas y 20 and `lavition_ui`'s SUBJECT BAR is full-width and 24 px high. **An
instrument that includes the UI cannot report on the world.**

⚠ **AND THE CLICK THAT FOCUSES THE CANVAS HAD TO BE COMPUTED.** The canvas is 1200×660 in an
1100×760 window, so the shell centres it and its own origin is at NEGATIVE viewport coordinates. A
click typed as `1150,640` lands outside the viewport, the canvas never takes focus, and every key
afterwards goes nowhere — six presses, not one gesture, and a transcript that reads exactly like a
local mode that does not work.

### A store, a lattice rule, and what the page still cannot show

⛔ **A STRUCT STORED INTO A VECTOR-TYPED FIELD IS SILENTLY DROPPED —
[loft#893](https://github.com/loft-lang/loft/issues/893).** `graphics::mat4_look_at` returns a
`Mat4`, which wraps one `vector<float>`; `st.view` is that vector. `st.view = mat4_look_at(…)`
**compiles clean, runs, and stores nothing** — measured on a ten-line repro, where the identical
store to a LOCAL is a compile error. Writing `.m` is the fix and it is only reachable by noticing
the return type: `--check` is quiet too.

⚠ **AND `hex_mesh::mesh_tile_of` IS A LIBRARY RULE NOW, because `/` is the wrong division.** A hex
at `-1` is in the tile covering `-8..-1`, and `-1 / 8` is `0` — so every tile west or north of the
origin would be meshed one tile over, and **the origin is the one place the two spellings agree**,
which is where every fixture in this tree stands. Four tests, two seen red on the naive form.
⏭ `editor_server.loft` still spells it `q >> CHUNK_SHIFT` with its own `CHUNK_SHIFT = 3`.

⏭ **WHAT IT DRAWS IS THE GROUND, AND THAT IS THE WHOLE OF IT.** A fence laid in local mode is
written, keyed and **invisible**: walls, roofs, vegetation, frames and soffits are five more
surfaces, and the recipe that composes all nine is `chunk_meshes_all` — a program-local function in
`editor_server.loft` whose own comment says *"ONE PLACE, because it was spelled out TWICE and is
about to be wanted a third time … a third copy is how a surface comes to be drawn in the world and
missing from the catalogue"*. **The page is that third caller**, and that is `B1b.2c`.

⛔ **AND THE RE-MESH IS THE WHOLE NEIGHBOURHOOD, WHICH IS A MEASURED COST RATHER THAN A DESIGN.**
A gesture reports what it DID (`ak_n`) and not WHERE — a fence ring of radius 3 spans several
tiles and `Ack` carries one anchor — so the page has no dirty set to consult. 49 tiles and 338,688
floats per press, which a keystroke can afford and a frame could not. ⏭ The cheap version needs the
neighbourhood to be a THING rather than a loop, which is `B1c`'s question.

⚠ **AND `after-all` EQUALS `after-first`, FOR A GOOD REASON.** Two raises and a lower net to one
raise, so the GROUND is back where the first press left it while the world key has moved on — the
picture is a function of the heights, and the fence and wall that moved the key write EDGES, which
this step does not draw.

## ✅ What `B1b.1b` turned up (2026-08-13) — the digest was made of the format it was digesting

**The page is an editor now.** With nothing behind the wire it stops dialling after a bounded
number of attempts, says `moros editor — edits stay in this page`, and a key press runs
`hex_editor::press_verb` against the `VoxelWorld` the client has held since plan 16 `S3`.
`make probe-auth` — **28 checks**, and the claim is the last two: the page and `editor_run` at
`GROUND=0`, driven through the same six verbs at the same author, agree on the **world**
(`32952:1545220309`) and on the **session**.

⛔ **AND THE INSTRUMENT THE CLAIM RESTS ON WAS BLIND ON ITS FIRST BUILD, BY CONSTRUCTION.**
`hex_voxel::world_key` began as a CRC32 over `world_to_bytes`. **This format writes every layer's
cells and then `layer_crc` OF THOSE CELLS** — and a CRC32 whose message contains its own CRC32
lands on one residue whatever the message was. Two worlds one edge byte apart came back as the
single string `8277:3255039172`, with a plain byte sum of **1143 against 1033** proving the
vectors really differed. Only a HEIGHT moved the number, and only because a height moves
`ck_base` in the *directory*, which no layer checksum covers.

> ⚠ **AN INSTRUMENT MADE OF THE SAME MATERIAL AS ITS SUBJECT CAN CANCEL AGAINST IT**, and
> reaching for the checksum the format already trusts is exactly how you walk into that. It is
> `*31 + b` now — `world_sections_key`'s own mix, invertible mod 2^32, so one differing byte can
> never cancel itself.

⚠ **AND IT WAS CAUGHT BY THE TESTS, NOT BY THE STEP.** `lib/hex_voxel/tests/key.loft` was written
before the function was believed, with every case shaped as *a pair a weaker instrument calls
equal* — and three of its five were red on the first run. A test that only said "different
worlds, different keys" would have passed a function that hashed the write count.

⚠ **THE OTHER HALF OF THE COMPARISON IS THE SESSION, AND IT IS NOT OPTIONAL.** A ring writes its
edges into the store and its **trunk** into the session, so `AUTH_SABOTAGE=scratchsession` —
press into a session nobody keeps — leaves a **byte-identical world** and a different scene. That
is `V1`'s pair one driver out, and it is why `hex_editor::session_digest` MOVED out of
`editor_run` rather than being copied into the client: two programs each composing their own
sentence would be comparing their agreement about a format.

⚠ **AND THE MIRROR SABOTAGE IS BLIND THE OTHER WAY.** `elsewhere` presses the same six verbs at an
author one world-unit over: every count is unchanged — **a ring of the same radius writes 42
edges wherever it is laid** — every sentence is unchanged, and only the world key moves.
**Neither instrument alone covers this step.**

**Nine sabotages, each red somewhere different** (re-run as twelve at `B1b.2`, in the section above):

| sabotage | red where | and nowhere else |
|---|---|---|
| `literal` — the status line as it was, a constant claiming the server | `A1` the panel's first word · `B4` · `B7` | |
| `nodirty` — the CONNECT fact moves and the panel is not told | `C4` **alone** | green in A and B, which is why C exists |
| `assume` — authority off the send, not off its succeeding | `B3`–`B11`, nine of them | invisible to A: with a server there, assuming is right |
| `nolocal` — it never gives up dialling | `B7` `B8`×5 `B9` `B10` `B11` | |
| `nolocaldirty` — it goes local and the panel is not told | `B7` **alone** | `nodirty`'s mirror, one authority over |
| `sendlocal` — local is announced and it sends anyway | `B8`×5 · `B10` · `B11` | ⚠ **the panel is GREEN** — a status line alone would call this a pass |
| `elsewhere` — the same six verbs, one world-unit over | `B10` **alone** | every count, every sentence AND the whole session unchanged |
| `scratchsession` — pressed into a session nobody keeps | `B11` **alone** | the world **byte-identical** |
| `eager` — one unanswered dial is enough to give up | `A2` `A3` **`A4`** · `B1` `B6` · `C2` `C4` **`C5`** | the two starred are the hazard: a live server given up on, and silence read as absence |

### The bound, and why it is a decision rather than an observation

⚠ **`ws_handler` GIVES NO `onopen` AND loft's SURFACE HAS NO CALLBACK**, so *the socket did not
open* is only ever observable as *it has not opened yet*. Something has to say when yet becomes
never, and that is `LOCAL_AFTER = 180` unanswered dials. **Measured, not chosen**: with a real
server there the send lands on **dial 4**, so the bound is 45× the observed cost of a working
connection and still under three seconds at 60 Hz.

- **A page that gives up too early takes an author's edits somewhere nobody will ever see them.**
  `AUTH_SABOTAGE=eager` is one dial, and runs A and C are where it shows.
- **Run C is the negative control the bound needed and already had**: a socket that opens and then
  says nothing must not be read as no socket at all. A page that inferred its authority from
  *silence* rather than from *a refused dial* swaps there, with a server on the other end.
- **The decision is one-way**, and the loop stops dialling the moment it fires. A page that kept
  dialling would attach to a server that came up later while its own world already held gestures
  nobody else has seen — two authorities over one world, which this plan refuses everywhere else.

### Two facts about the world local mode starts in

⚠ **THE RUNNER SEEDS GROUND AND THE SERVER DOES NOT**, and until this step nothing had to care.
`editor_run` lays a 61×61 patch of `SURFACE_MAT` so a scripted scene has something to photograph;
`new_world()` in the server lays nothing, because an unwritten cell reads as absent and **absence
IS the floor** ([`E1γ`](../../doc/claude/WORLD_MODEL.md)). Measured, the same six verbs leave
**τ 4079** seeded and **τ 358** not. So the runner grew `GROUND=<half>` — and it is *start where
the editor starts*, not a test hook: a comparison run against the default would report a
divergence that is entirely that one line.

⏭ **AND `place` IS REFUSED AT THE ORIGIN, IN BOTH DRIVERS** — *"a footprint at this facing has no
mitred corners; turn one step"*. `B1a` found it through the server; it is the same in an empty
world and in a seeded one. The fixture KEEPS the refusal rather than posing around it: a refusal
that reproduces in two drivers is evidence, and choosing the fixture to suit the answer is how a
green run stops meaning anything. ⚠ It also means the walk — `B1c` — is what stands between this
page and a house.

⚠ **THE TWELVE KEYS LOCAL MODE CANNOT ANSWER SAY SO, ONCE PER MESSAGE.** Walking, the stair, the
storey, the wall run and the opening pair are wire messages with no local gesture yet, and a
`send` into a socket that is not there returns false and drops it. *Reason, offer, residual, never
a blank no*, applied to a keystroke — and once per message ID rather than per press, because the
look drag sends one message per pump and a notice nobody can read is the silence it replaced.

## ✅ What `B1b.1a` turned up (2026-08-13) — the sabotage passed, and that is the finding

**`src/editor_client.loft`'s status line is derived now**: `authority_line(st)` over `st.hello` —
the client's one piece of evidence, a `send` that SUCCEEDED — and the panel is told when it moves.
`make probe-auth`: **15 checks, three runs over the same page bytes**, three sabotages each red
somewhere different. `make probe-b1a` unmoved — the same 7 sentences, world `82d622b37d1d`.

⚠ **THE SABOTAGE THAT MATTERED PASSED, AND ITS PASSING IS WHY THERE IS A THIRD RUN.** Deleting the
one write this step adds — `st.panel_dirty = true` where the send lands — left the run against the
real server **entirely green**. The server answers `1:` with `N:` and `H:` a frame or two later,
and each of those marks the panel for its own reasons, so the status reached the screen for a
reason that had nothing to do with the authority changing. **A rebuild that happens anyway reads
exactly like a rebuild that was asked for**, and the obvious instrument — a server, a browser, a
transcript — cannot tell them apart at all.

✅ **SO THE THIRD SITUATION IS A SOCKET THAT OPENS AND SAYS NOTHING**, twenty lines of node that
complete the handshake and then never send a frame. There `panel_dirty` has exactly one possible
writer, and the proof is printed beside the verdict: the client's own message counters still read
`meshes 0, placements 0, drops 0, cameras 0, status 0, parts 0` after 1200 frames. ⏭ **And it is a
real situation, not a contrived one** — a server that accepts while its world is still loading is
this, for as long as that takes.

⚠ **AND THE CONTROL FOR *WAS THERE A SOCKET* WAS CIRCULAR — a second sabotage found it.** Run B
proved *nothing connected* by reading the client's own `connected` line, which is the very claim
under test. `AUTH_SABOTAGE=assume` — the authority read off **having sent** rather than off the
send **succeeding**, the trap the client's own `ws_handler` comment warns about one layer in —
made the control agree with the lie it existed to catch, and its failure message said *"this run
is not the no-server case at all"* about a run that was exactly that. **The evidence is the other
side's log now**: the static server counts dials refused and dials completed, and the client's
claim is checked *against* it rather than trusted as it.

| | red where | and nowhere else |
|---|---|---|
| `literal` — the line as it was, a constant claiming the server | `A1` the panel's first word · `B4` with no server behind it | |
| `nodirty` — the fact moves, the panel is not told | `C4` alone | ⚠ **green in A and B**, which is the whole reason C exists |
| `assume` — authority off the send, not off its success | `B3` client against wire · `B4` | invisible to A: with a server there, assuming is right |

⚠ **THE INSTRUMENT READS THE BUILT PANEL, NEVER `authority_line` A SECOND TIME.** `K1`'s shape: a
println that re-composes the string agrees with itself for as long as it is copied correctly and
says nothing about what the panel holds. It prints `ui_panel.p_status.ss_text`, which is
post-`fit_text` — so a status too long for its strip arrives carrying its own `..`, and the check
is **exact equality against the two whole strings**, because a substring test would call a
truncation a pass.

⚠ **AND `metrics_drift` HELD A SECOND COPY OF THE LITERAL**, under its own comment saying it
*"compares the strings the panel actually shows, not a synthetic sample"*. It takes the two
constants now, so the day one grows it measures the longer one without anybody remembering to.

⏭ **THIS IS THE DAY PLAN 18 `B2`'s NOTE COMES DUE**, and it said so itself: *"the panel is built
once … when the contents start moving, rebuild on CHANGE — not on tick."* An authority that can
change is contents that move. One write on the one frame the fact moves; `hud_dirty` is
`panel_dirty`, because it now has a writer that is not a message at all.

✅ **AND WHAT `B1b.1b` NEEDED FROM HERE WAS ONE STRING AND A DECISION**, which is exactly what it
took: `AUTH_LOCAL` beside the other two, and `LOCAL_AFTER` unanswered dials. The visible half
being built and sabotage-checked first is what earned the right to let the authority vary.

## ⛔ What starting `B1b.1` turned up (2026-08-13) — the boot switch cannot be asked for

**`B1b.1`'s first item was a boot switch, and this plan named the mechanism with confidence**:
*"the mechanism is `P2`'s — `host_output` a question, `host_input` the answer, which was run and
holds in both shells. And the default falls out for free: `P2` measured an unanswered request
returning empty, so the server-served page gets `""` and stays attached without anyone deciding."*

⛔ **THAT IS FALSE, AND ONE FIVE-LINE PROGRAM SAYS SO.** `probe/b1b/ask.loft` — `host_output`
then `host_input` — prints `asking` and **hangs**; `timeout 20` returns **124**. Filed as
[loft#891](https://github.com/loft-lang/loft/issues/891).

⚠ **THE MISREADING IS THE INSTRUCTIVE PART, AND IT IS A CLASS.** `P2` really did measure an
unanswered request coming back **empty** — with JS *present* and declining that one message.
**Absent-host and declining-host are different situations and only one of them terminates**, and
the design generalised from the one it had tested to the one it had not. *An instrument gets
checked against something it should find before it is trusted to report an absence* — here the
absence being reported was **the host itself**, which is precisely the case `P2` never ran.

⚠ **AND `host_name` IS NOT A WAY ROUND IT**: the symbol is in the binary, the function is not —
`error: Unknown function host_name`. There is no target query either.

✅ **ROUTE 3 IS CHOSEN — the user's call, 2026-08-13.** Connect-or-local, **with the subject line
saying which authority is live**. So the visible half comes FIRST: an authority that can vary
silently is the hazard, and the instrument that makes it visible is what earns the right to let it
vary. Two steps:

| | | |
|---|---|---|
| **`B1b.1a`** | **the client says which authority it has** — one authority exists so far, so this is not a no-op and not a stub: it can be *wrong today* | ✅ **DONE 2026-08-13** |
| **`B1b.1b`** | the authority becomes two: no socket → local, and `B1b.1a`'s line is what stops that being silent | ✅ **DONE 2026-08-13** |

⛔ **AND `B1b.1a` HAD A LIVE DEFECT TO FIX, NOT A FEATURE TO ADD.**
`src/editor_client.loft:1680` reads `ps_status: "moros editor — connected"` — **a literal, set at
panel construction, before any socket exists**, and `grep` finds no other write to it. **The panel
claims a connection it has never checked**, and it will go on claiming it with the server down. It
is the `W4` shape one more time: a fact asserted in a place that cannot know it.

⏭ **THE THREE SITES, LOCATED:**

1. **What is true** — `src/editor_client.loft:1856` takes `web::ws_handler(WS_URL)`, which *"returns
   a usable handle immediately — it does not wait for the socket to open"*. The open is discovered
   by **a `send` SUCCEEDING**, which the retry loop below it already does and already knows. That
   boolean is the authority; nothing new has to be measured.
2. **Where it shows** — `ps_status`, above.
3. ⚠ **THE COST, AND IT IS THE ONLY REAL ONE: THE PANEL IS BUILT ONCE.** Its own comment says so —
   *"deliberate for now: its contents do not change until `H:` exists (plan 18 `B2`), and
   rebuilding an unchanged panel every frame is the churn `C5` warns about. When the contents start
   moving, rebuild on CHANGE — not on tick."* **An authority that can change IS contents that
   move**, so `B1b.1a` is the step that makes plan 18 `B2`'s rebuild-on-change due. Build it that
   way, not on a tick.

⚠ **AND THE SUBJECT LINE IS NOT THE PLACE FOR IT.** `subject_line` is the SERVER's sentence,
composed there on purpose — *"the client never composes one: a second list would be a second
authority on what you are working on"* (`C1`). The authority is the client's own fact about its
socket, so it belongs on the STATUS line beside it, never inside the server's.

⏭ **The three routes as they stood, kept because the choice was between them:**

1. **Wait for [#891](https://github.com/loft-lang/loft/issues/891)** — a `host_try_input`, a
   readiness predicate or a timeout. This tree's rule is to wait for a toolchain rather than build
   around it, and `#851` is the precedent where waiting cost nothing and saved a whole package.
2. **Infer the mode from whether the socket connects.** It needs no toolchain and it is what
   `_site/index.html` will actually experience — there is no server on a `file://` page. ⚠ **But a
   transient network failure would silently move an author into a different authority**, their
   edits landing somewhere else with nothing said. A mode change that nobody can see is the thing
   [EDITING_MODES](../../doc/claude/EDITING_MODES.md) refuses on the *other* axis.
3. **Make it visible instead of invisible** — connect-or-local, but the subject line SAYS which
   authority is live, so route 2's hazard becomes a fact on screen rather than a silent swap. ⏭
   This is the one to build if #891 does not land, and it needs [CATALOGUE](../../doc/claude/CATALOGUE.md)'s
   subject line, which exists.

⚠ **NOTHING WAS HALF-WIRED WHILE THIS WAS DECIDED**, deliberately. A local mode that writes but
cannot be compared is the swap-and-look this plan's own gate exists to refuse, and a boot switch
that hangs the native build would have been found by `make play` rather than by a test.

## What `B1b.0` turned up (2026-08-13) — the tree held TWO answers to *what world is this*

**Starting `B1b` asked one question first: which world does local mode build?** In local mode the
client's cache stops being a copy of somebody else's world and becomes the authored one, so it has
to be the same world the server makes. **The tree had two answers.**

| | `ε` | `θ` |
|---|---|---|
| `src/editor_server.loft` | **10** | **4** |
| `src/editor_client.loft`'s cache | 10 | 4 — as four bare literals under a comment saying *"the same constants the server opens with"* |
| `src/editor_run.loft` | **8** | **3** — under its own comment: *"the same world the server makes — a scene built at a different epsilon is a different world however identical the script"* |

⚠ **`ε` IS THE FOLD RULE `F1` ENFORCES**, not a header field: *"layer 2 is 7 above layer 0, needs
8"*. A world at 8 accepts a storey stack a world at 10 refuses. The sentence in `editor_run` states
the rule correctly and the two lines under it break it.

✅ **MEASURED BEFORE ANYTHING MOVED, AND THE PREDICTION WAS PRE-REGISTERED.** The house scene
through the runner at 8/3 and at 10/4 differs in **exactly two bytes, at offsets 21 and 25** —
`w_eps` and `w_theta` in the header. Every cell equal, `τ 3911` both. After the fix
`worlds/headless.hxw` came out at **exactly the md5 the 10/4 experiment had produced**
(`68cda099…`, against `9aae9ba9…` before), which is the difference between a change that was
predicted and one that was observed.

⚠ **SO NO FIXTURE COULD SEE IT — THE `W4` GRADE DIVERGENCE, ONE CONSTANT OVER.** Nothing in
`house.keys` stacks layers between 8 and 10 apart, so `F1` never fired differently and both
drivers were green for months. ⚠ **And it is not harmless in general**: the sabotage below moved a
*sentence* as well as the header, so `ε` changes what a gesture writes, not only what the file
records.

✅ **ONE HOME: `hex_editor::WORLD_EPS` / `WORLD_THETA`**, beside `W_RESERVE`, which was already
there for the same reason — *what world this editor makes is a property of the gestures, not of
the program driving them.*

⚠ **NAMED `WORLD_*` AND NOT `W_*` DELIBERATELY.** `src/part_build.loft` and `src/prop_build.loft`
declare their own `W_EPS = 8` for PART worlds — a different kind of world at a different unit, and
they are right to. A published `W_EPS` would have been **shadowed by theirs invisibly**, which is
exactly what `HOUSE_W`/`HOUSE_D` did to the server for months and what `tools/names.sh` is
structurally unable to see. A distinct name makes a leftover local an unused constant rather than a
silent winner.

⚠ **THE CONTROL COVERS BOTH REMAINING SITES AT ONCE.** Set the library constant to `9`: the
runner's world moves to a third md5 **and** `probe/b1a`'s SERVER-saved world moves
`82d622b3` → `3c1f2073`, with a sentence moving too. Restored, both return. That is *all three
programs read the library now*, measured rather than declared.

⚠ **AND IT CAUGHT A FLAKY FIELD IN `probe/b1a`, ONE DAY OLD.** Restoring the constant left the
world byte-identical while the transcript still read `brush (10,0) — 4 chunks, 12 dirty` against a
baseline of `10 dirty`. **A number that moves while the world does not is not a fact about the
gesture** — it is how much of the dirty set the rebuild had drained, a wall clock wearing a count's
clothes. The brush line is truncated to its CELL now, which is what the gesture decided. ⏭ Not
dropped: dropping it whole is what made the first filter blind to both arrows.

## How `B1` is cut, and what each piece can be surprised by (2026-08-13)

**`B1` was one `M` row and it is three now**, cut against the two bounds in
[plans/README.md](../README.md): *upper* — both paths run at once and are compared exactly;
*lower* — the step can go red on its own, for a real reason.

### `B1a` — the client's key table names a VERB

⚠ **`poll_input` IS `W4`'s FOURTH SITE AND IT IS STILL LIVE.** `src/editor_client.loft:1078–1150`
re-states what a key means as **key → wire message**: `5:1`, `23:3,3`, `30:1`, `36:1`. That is the
table `W4` counted and the one nothing has moved. It becomes `verb_of(key)` plus an `act(h, st,
verb)` that maps **verb → message id** — which is not a fifth site for the same reason
`script.mjs`'s `VERBMAP` is not: *a key's meaning is `W4`'s subject, a message id is a fact about
the wire, and the file drives a socket.*

⚠ **THE OPENING FAMILY IS WHERE THE TWO DISAGREE — `K2a`'s FORK, ONE DRIVER OUT.** The client sends
`36:1` for `o` and `36:2` for `p`, where the verb layer says an opening's profile comes from the
**selection**. Converting them moves the standing selection where it did not move before, so the
step is *not* wire-identical unless the kind is pinned. **Pin it, and let `B1b` do the selection**
— or the step stops being comparable, which is the bound it exists to satisfy.

⚠ **AND ITS INSTRUMENT IS THE SERVER'S OWN `println` STREAM, NOT `script.mjs`.** `S2a` measured why:
the script runner sleeps 250 ms and reads *the last status line*, so which broadcast it catches is a
**race** — the server's print stream was 240 lines over eight scripts, identical. ⚠ **And it needs
`K1`'s session read-back beside it**, because the world is blind to which profile was cut
(`open_ahead` writes `DOOR_MAT` whatever the kind — measured twice, at `V1` and again at `K1`).

### `B1b` — local mode, and it split again when it was started

`act` calls `press_verb(sess, st.cache, a, verb)` instead of sending. ⚠ **The authority is the cache
the client ALREADY has** — plan 16 `S3` put a real `VoxelWorld` in the browser and meshes tiles out
of it, so local mode adds no store and no renderer. `P4` measured that this program builds with an
`EditSession` and a real gesture call in it: `--html` rc=0, 2546 KB.

✅ **`B1b.0` came out of asking which world it builds** — see the finding above; the tree had two
answers and one of them was asserting it was the other. **Done.**

✅ **WHAT `B1b.1` NEEDED, AND WHAT EACH ITEM TURNED INTO:**

1. **A boot switch** — ⛔ **could not be asked for.** `host_input()` blocks with no host
   ([loft#891](https://github.com/loft-lang/loft/issues/891)), and the design had generalised
   `P2`'s *declining* host to an *absent* one. Route 3 replaced it: **connect-or-local**, decided
   by `LOCAL_AFTER` unanswered dials, with the panel saying which. ⚠ There is no event to wait
   for — `ws_handler` gives no `onopen` — so the switch is a BOUND, and `eager` is the sabotage
   that says a too-short one is a live hazard rather than a taste.
2. **A session, an author and a world** — ✅ four lines, exactly as predicted, and the world is
   `st.cache` because `B1b.0` had already made it the right one. ⚠ The author is the origin and
   **does not move**: the walk is the server's tick, so `B1c` is still where a pose comes from.
3. **A digest to compare** — ✅ and it took two, blind in opposite directions.
   `hex_voxel::world_key` for the store and `hex_editor::session_digest` for what the editor
   remembers, both called by the page AND by the runner so neither can spell its own.
   ⛔ **The first world digest was a CRC32 and it could not see a cell change at all** — see the
   finding above. ⚠ And the comparison is at the SAME author over `GROUND=0`, because a pose is
   not a gesture and the runner's seeded ground is not the editor's.

⚠ **THE GATE ROW SAID *"diff `w_tau`"* AND `V1` HAD ALREADY MEASURED THAT BLIND.** A fence ring and
a wall ring write the same edges of the same disc, each write changing something, so the edit clock
reports one number for two different worlds. Corrected in the table above: **whole-world bytes and
the session**, which is `V1`'s own pair and for `V1`'s own reason — one instrument could not answer.

### `B1c` — the walk, and it is deliberately unsized

⚠ **THIS IS THE HONEST PLACE THE INVARIANT MAY BE FALSE, and the design says so itself.** *"The
page is the same editor with different I/O"* — but the server has a **tick and a walker**,
`editor_run` teleports and says so, and `press_verb` never touches the pose. In attached mode the
character's position is the server's; in local mode **something has to own it**, and a second
authority on where the author is standing is a thing this tree has named and refused once.

**It is unsized because the answer is a design question, not an effort estimate**, and pretending
otherwise is how an `M` row becomes a revert. ⚠ **Nothing above it needs the answer**: `B1a` sends
the same wire it always did, and `B1b` can be driven by a key sequence that never walks. Take it
when the first two are green and the question has a shape.

## What `P6` turned up (2026-08-13) — a phase cancelled, two open numbers closed

**`make probe-p6`.** The design measured `--html` binding **0 of 20** `fs_*` names — *a page that
draws cannot store* — raised [loft#851](https://github.com/loft-lang/loft/issues/851) for it, and
wrote `W5`, an interim `host_output`/`loftPush` storage shim, on that premise. #851 is closed and
merged (`28e85b42`, 2026-08-11). **This is the measurement that turns that into a decision.**

| | the design measured | `P6` |
|---|---|---|
| `fs_*` names in an emitted page | **0 of 20** | **21** |
| a world saved and read back in one run | impossible | `pass1 ok`, **8277 bytes** — the interpreter's own count |
| …and after a **reload** | impossible | `pass2 ok`, over **http and `file://` alike** |
| a file the page was **given** (`W2`'s catalogue) | *"a fetched manifest"* | `base file 25 bytes, list_dir 1 entries` — **the line the interpreter prints for a real directory** |

⛔ **`W5` IS CANCELLED, AND ITS OWN ESCAPE CLAUSE IS WHAT CANCELLED IT** — *"if `#851` lands before
this is built, SKIP `W5` entirely; it is the one item here whose best outcome is never existing."*
⚠ **The deferral is the part to carry forward, not the cancellation.** The route decision was
parked on purpose because `W1` and `W4` were the same work either way, so **nothing waited on it**
— and by the time it had to be answered it had answered itself. This tree's rule is to wait for a
toolchain rather than build around it; this is the case where waiting cost nothing and saved a
package.

⚠ **AND *"#851 LANDED"* IS A CHANGELOG, NOT A MEASUREMENT.** *Landed* is a claim about upstream's
`main`; what decides a phase here is what `/usr/local/bin/loft` does. Those are one grep apart and
they were four days apart. `W3` was priced against the same condition and is retired with it.

✅ **`P3` FELL OUT OF THE SAME RUN** — the other number the design left open. The house scene is
**65,788 bytes** on disk, and a `LayeredFS` delta measures **1.34×** the file (11,092 characters
for an 8,277-byte world), so ~88 KB against a ~5 MB budget: **under 2 %**. **No sharding, no
IndexedDB fallback.** And it is small for a normative reason rather than a lucky one —
[WORLD_MODEL § `E1γ`](../../doc/claude/WORLD_MODEL.md), *storage holds only what differs from the
ground*.

⚠ **`file://` NEEDED NO BROWSER FLAG, AND THAT WAS WORTH A SEPARATE RUN.** The quick start's whole
premise is a directory you open rather than serve. The first pass carried
`--allow-file-access-from-files`; taking it away changed nothing, so it is out of the driver. A
page opened off a person's own disk gets the same storage the served one does.

⚠ **THE INSTRUMENTS WERE CHECKED BEFORE THEY WERE BELIEVED — every one of them.**

- **The `fs_*` grep** runs beside a name it **must** find (`host_output`, bound before #851) and
  one it must **not** (`fs_chmod`). A grep's default answer is *absent*, and this tree has shipped
  three whose zero read as a clean result.
- **The reload** is `P6_SABOTAGE=persist` — the host keeping its delta in memory — and it is
  **seen red**: `pass1 ok` twice, with the second instrument reporting `delta bytes -1` for the
  same reason. Two instruments, blind in opposite directions, red together.
- **The base tree** is `P6_SABOTAGE=nobase`: withhold it and the page says `base file MISSING`.
- **The oracle is the interpreter**, and its expected line is taken from its own output rather than
  typed a second time — loft#851's stated contract is *the page answers what `--interpret`
  answers*, so a hand-written copy would be a table checked against itself.

⚠ **AND A SABOTAGE MEASURED THE VALUE OF A GUARD I HAD ARGUED FOR, AND HALF-REFUTED IT.** The
driver waits for the second load to be a genuinely NEW document (a stamp set before navigating that
must be gone after). `P6_SABOTAGE=nostamp` **passes three times out of three** — `Page.navigate`
returns after the commit, so the race it guards did not reproduce. What it *does* buy was measured
too: `noreload,nostamp` reports *"the reloaded page found NO file: the delta did not survive"* —
a **driver** bug wearing a product failure's clothes, with `delta bytes 11092` printed directly
above contradicting it. With the stamp the same run says *"the second load never printed a RESULT
line"*. **The guard is worth one `Runtime.evaluate` for the diagnosis, not for the verdict**, and
saying which is the honest version.

⚠ **TWO ENVIRONMENT FACTS FELL OUT AND BOTH COST TIME.** loft resolves a relative path against the
program's **source directory**, not the process's cwd — a `cd` into a scratch dir wrote the world
beside `store.loft` anyway. And the chromium here is a **snap**, so it has its own private `/tmp`:
a `--user-data-dir` under the real one leaves the browser with **no devtools port at all** and the
driver hanging on a socket that will never open. The profile is repo-local for that reason.

## What `W1` turned up (2026-08-11)

**Built as a SECOND encoder and diffed byte for byte before the old one was deleted** — the
capture-and-diff instrument rather than a round trip. A round trip proves the decoder undoes the
encoder, which two *consistently wrong* halves also do, and this format has an entry for exactly
that (the 8-byte voxel written as 28, round-tripping perfectly for as long as both halves agreed).

⚠ **THE PREDICTION WAS WRONG IN THE GOOD DIRECTION.** The design warned the byte path might be
slower; measured, `world_load` is **1.6× faster** — 1763 ms against 2821 ms over 40 loads of
`house/cottage.hxw`. One bulk byte read beats thousands of individual typed file reads.

⚠ **AND ONE OF THE NEW TESTS CLAIMED SOMETHING IT DID NOT TEST.** It asserted the sign of a
negative chunk coordinate *through* `world_cell`, and deleting the sign extension from `br_i32`
left all four tests green: an unsigned `-1` becomes 4294967295, lands in `ck_cx`, and nothing
downstream looks at it again. **A claim tested only through a consumer is a claim about the
consumer.**

## What `V1` turned up (2026-08-12)

**`verb_of(key)` and `press_verb(sess, w, a, verb)` beside an unchanged `press(key)`**, with
`lib/hex_editor/tests/verb.loft` driving all eleven keys through both layers. Six verbs —
`raise` `lower` `place` `opening` `fence` `wall`. Six sabotages seen red: two swapped rows in the
definition, a walk key given a verb, a verb left unbound, the opening wired to a constant, and
`wall` bound to the fence's material.

⚠ **THE PHASE ROW'S OWN INSTRUMENT WAS TOO WEAK AND IT WAS MEASURED, NOT ARGUED.** The row said
*equal `w_tau`* — and a fence ring and a wall ring write **the same edges of the same disc**, each
write changing something, so the edit clock reports one number for two different worlds. `verb_of`
mapping `G` to the fence verb would have passed every equality in this step. The comparison is
the **whole world as bytes** (`world_to_bytes` — `W1`'s encoder, second consumer); the swap shows
at **byte 7590**. ⚠ **And the blindness is a test rather than a comment**, so the day `w_tau` stops
being blind, the row justifying a whole-world encode says so itself.

⚠ **AND THE BYTES ARE BLIND TO THE PROFILE.** `press_verb`'s opening wired to a constant leaves the
six worlds **byte-identical** — `open_ahead` writes `DOOR_MAT` whatever the kind, and the outline
lives in the session's `Opening`. Caught by the session comparison, not the store one: **a
stronger world instrument did not remove the need for the session half.** When one instrument
cannot answer, the answer is a second instrument.

⚠ **AND THE STEP CANNOT OVERREACH, BECAUSE THE TEST WILL NOT LET IT.** `fence`/`wall` are one
`ring` verb waiting for a material selection — the shape `S2b` gave the opening family — and
collapsing them today goes red on one of the two. `raise`/`lower` stay two verbs permanently: a
direction is part of the action, not a selection. The decomposition is enforced rather than
remembered.

⏭ **AND IT REORDERED THE PHASE THAT FOLLOWS IT.** `V2` was to move `editor_run` first; measured, the
runner **cannot see the regression that move would cause**. `house.keys` presses `O` and `P` and —
since `eye` moved its poses onto the perimeter — **both now cut** (`O: 1`, `P: 1`, τ 3911), so
resolving them through `verb_of` turns the pointed head round. The world is **byte-identical**
(`open_ahead` writes `DOOR_MAT` whatever the kind), the session holds the outline, and **the session
is not in the world format** — `S1`'s finding, spent. `ak_n` is `1` for all six, so the transcript is
blind too. **`K1`+`K2` come first**, or `V2` lands a silent profile regression under a green
`headless-same`. The server's `MSG_HOUSE` is the exception — a literal `"H"` carries no profile — and
can move now. [EDITING_MODES § phase 3](../../doc/claude/EDITING_MODES.md#-and-that-reorders-v2-the-runner-cannot-see-the-regression-it-would-cause).

## What `K1` turned up (2026-08-12) — the row's own control could not see the step

**`verb <name>` and `select <kind>` in both readers** — `src/editor_run.loft`, which calls the
gestures, and `tools/script.mjs`, which drives the socket. `probe/k1/run.sh` (`make
probe-verbs`) drives a twin pair of scripts through both and compares them exactly: six checks,
three of them controls.

⚠ **THE PHASE ROW SAID *"run one converted script and its original and diff the world"* AND
THAT IS BLIND TO THE ONLY MISTAKE THIS CONVERSION MAKES.** `key P` becomes `select 2` + `verb
opening`; write `select 1` and the world is equal **byte for byte**, because `open_ahead` writes
`DOOR_MAT` whatever the profile and the head lives in the session's `Opening` — which `S1`
measured is not in the world format at all. It is `V1`'s blindness one layer out, carried
forward in a table nobody had run.

✅ **So the runner grew the session read-back** [EDITING_MODES § phase
3](../../doc/claude/EDITING_MODES.md) already named as the alternative to converting the
scripts. It turns out to be needed *for* converting them — it is what makes `K2` an assertion
rather than a hope, and what `V2b` will read. It prints the nine registries and every opening's
**geometry**, not only `op_kind`: a digest of the label alone agrees with itself for as long as
the label is copied correctly.

⚠ **AND THE READ-BACK IS CHECKED BEFORE IT IS BELIEVED.** `wrong.keys` is `verbed.keys` with one
character changed, and control `C` requires **both** halves at once: the same world (so the
store's blindness is measured rather than assumed) and a **different** scene (so the reader is
not blind too). The first half flipping would mean the store had learned to carry a profile,
which would be good news and would need this argument rewritten.

⚠ **THE TWO SPELLINGS MUST END ON DIFFERENT SELECTIONS.** A key does not re-choose — `S3`'s
fork — so `key O` `key P` finishes on the selection it started with while its verb twin
finishes on `2`. The digest prints the standing choice on its own line and the probe asserts
the two differ; agreement there would mean a key had silently re-chosen.

⚠ **`script.mjs`'s NEW SIX-ROW TABLE IS NOT A FIFTH SITE.** `KEYMAP` decides what a KEY means,
which is `W4`'s subject; `VERBMAP` decides which message id implements a VERB, which is a fact
about the wire and is that file's own business — it drives a socket. What it does not hold is a
**profile**: `36:1 2 3 4 11 21` collapses to one `36:`, so which head a door gets stopped being
something a JS table knows. ⏭ It is deleted, not converted, on the day the wire carries a verb.

⚠ **AND THE WIRE HALF WANTS TWO INSTRUMENTS FOR THE SAME REASON, BLIND IN OPPOSITE DIRECTIONS.**
Measured by sabotage, not argued: pointing `VERBMAP.wall` at the fence message leaves **all six
server sentences identical** — `do_fence` reports `fenced 42 edges … radius 3` for a fence ring
and a wall ring alike — and the saved world differs at byte 54068. Pointing `VERBMAP.opening` at
a fixed `36:1` is the mirror: the saved world is byte-identical and the sentence says `opened
profile 1` where the original said `2`. **So the wire half compares the sentences AND the world
the server saves**, and neither would have been reached by reading the source: nobody notices
what a `println` leaves out.

⚠ **THREE INSTRUMENT BUGS WERE FOUND IN THE PROBE ITSELF, EACH READING AS A PASS.** The first
capture was **25 sentences** of which 21 were part-library thumbnails printed before the server
opened — a count that is mostly boilerplate reads as coverage. The same capture **lost the last
gesture of every run**, because `script.mjs` returns 250 ms after its last send and the server
was killed still writing; two runs truncated at the same place agree perfectly. And the
unknown-verb control printed a heading and **no verdict**: its helper ended in a `grep` that
exits 1 when it matches nothing, which is precisely what that control wants to see, so the whole
`if` body was skipped. The gesture lines are now named one at a time rather than counted.

⚠ **AND A FRESH SERVER PER SCRIPT.** Two runs against one process differ in every
`hex (q,r) — +N −M chunks` line, because the streaming set carries over — a fact about a viewer,
not a gesture, and filtering it would have meant choosing what counts as noise.

## What `V3` turned up (2026-08-12) — a green suite is the wrong instrument for a deletion

**`hex_editor::press(key)` and its private `open_press` are gone.** What a key means is two
levels and nothing else: `verb_of(key)` names a verb, `press_verb(…, verb)` runs it.

⚠ **A DELETION MAKES TESTS PASS BY REMOVING THEIR SUBJECT**, so `make fast` going green proves
nothing about it. The instrument is the **test-name diff** — 40 test functions before, 36 after,
`hex_editor` 428 → 424 — with every change accounted for: **four spent** (they compared two
bodies and one is gone), **one moved** (`…_the_six_keys_cut_six_different_things` →
`opening.loft`'s `…_the_five_outlines_the_family_can_select_cut_five_different_things`, over
kinds instead of keys), **two retired into rows that already held their claim**, and **two
renamed** where the subject changed from a key to a verb.

⚠ **AND *"the claim is held next door"* IS MEASURED HERE, NOT ASSERTED.** Three sabotages, each
red on the row that inherited a retirement: `session_opening` wired to a constant kind →
`…_the_five_outlines…` reports `1 2 3 4 cut outlines 1 1 1 1`, which is **the moved control
catching exactly what it was written to catch**; `verb_of("W") = VB_PLACE` →
`…_a_key_that_is_not_a_gesture_names_no_verb`; `verb_of("G")` unbound →
`…_every_verb_the_definition_produces_is_bound`. Without those the retirements are a sentence,
and this tree has shipped a gate header describing coverage that had already moved.

⚠ **THE NAME `press` IS DELIBERATELY NOT REUSED**, against the design's own note that *"this
takes the name `press` once nothing is left to collide with"*. Both forms are
`(sess, w, a, text)`, so a stale `press(…, "H")` after a rename would **compile, run, and answer
*not a gesture* at runtime** rather than fail to build — the longer name is the only thing that
distinguishes the two layers to a reader or to a compiler. The note was about collision; free is
not the same as valuable. One `sed` reverses this if the user disagrees.

⚠ **ONE SURVIVING ROW CANNOT BE SURPRISED, AND ITS LIMIT IS WRITTEN AT THE SITE.**
`…_the_definition_names_the_verb_each_direct_key_is_written_to_name` is a declaration checked
against a hand-written second declaration. It is kept because nothing else states the key→verb
table in words, and it is honest **only beside** the two rows that can fail.

## What `V2b` turned up (2026-08-12) — no equality could see the step it took

**`src/editor_run.loft`'s `key` branch is `press_verb(sess, w, a, verb_of(rest))`**, and it was
the **last production caller of `press(key)`**: the server moved at `V2a`, `editor_client` never
called it, and what keeps it alive now is two test files.

⚠ **THE STEP'S CLAIM IS INVISIBLE TO EVERY EQUALITY BUILT FOR IT.** `probe/k1`'s A, B and C
compare a key spelling against a verb spelling that **chose what the key already meant** — so
they pass whether or not the runner resolves through `verb_of`. The check that can fail is new:
`carried.keys` chooses **pointed**, presses `O` — the key that used to mean *round* and nothing
else — and reads the kind out of the session. **Seen red first** (`cut kind 1`), green after.

⚠ **AND THE FIXTURE ENCODED THE OLD MEANING, SO A CORRECT STEP TURNED THE SUITE RED.**
`keyed.keys` pressed `key P` with no `select`; the day the runner moved, check B failed on a
**script** rather than on a defect. It selects before it presses now, which makes the same file
valid on **both** sides of the change — before it the key already meant what was chosen, after
it the key means whatever is chosen. Worth remembering the next time a chokepoint moves: a
fixture written in the old vocabulary is not evidence about the new one.

⚠ **AND ONE CHECK WAS READING THE FIXTURE RATHER THAN THE SYSTEM.** `D` required the two
spellings to end on **different** standing selections — which held only because `keyed.keys`
never said `select`. Once it had to, the difference evaporated and `D` went red on nothing. The
claim underneath is `S3`'s and is unchanged, so it moved to where it can be stated directly:
select 2, press `O`, and the selection must still be 2. **A check that passes because of how a
fixture happens to be written is not a check about the system.**

⏭ **`tools/script.mjs` HAS NOT MOVED**, deliberately — `V2` takes one caller at a time, and its
`key O` still sends `36:1`. The runner and the wire disagree about what `key O` means until `V3`
deletes the key form, and the divergence is **bounded by `K2a`**: no script presses an opening
key any more, so nothing exercises it.

## What `K2b` turned up (2026-08-15) — the mechanical half, and three instruments before one script

**91 lines over 32 files**, `key ArrowUp` → `verb raise` ×79, `key H` → `verb place` ×10,
`key G` → `verb wall` ×1, and not one of them loses or gains anything. `make probe-k2b` runs
every converted script beside its own pre-conversion self — `git show 0e2d48a:<path>`, a
baseline that cannot drift and cannot be converted by accident — and compares the world key,
the session digest, the saved bytes and the transcript. **31 scripts, all four equal.**

⚠ **AND *MECHANICAL* IS THE WHOLE ARGUMENT FOR MEASURING IT.** A conversion that is obviously
right is one nobody looks at twice; the failure it can still have is one mistyped verb on one
line of ninety, in a script no gate runs, found later as a scene that quietly builds something
else.

### ⛔ The 32nd file was a script that is not a file

`probe/a83/leaf_visible/switch.sh` writes its script into a **heredoc** and drives it from
there. It pressed `key ArrowUp`, and it was invisible to the probe's `*.keys` glob, to
`grep -rn '^key ' --include=*.keys`, and therefore to this plan's own row, which said *zero
`key` lines left outside the deliberate baselines* while one sat in the tree.

> **A glob is an instrument and its default answer is *absent*.** It was found by dropping the
> `--include` and greping everything, which is the check any coverage claim is worth.

Converted and verified inert rather than assumed: `tools/script.mjs` sends `5:1` for `key
ArrowUp` and `5:1` for `verb raise`, so the two spellings are the same bytes on the wire.

### ⛔ The probe was red on all 31 scripts, and neither reason was a conversion

Both were the instrument describing itself:

- **the runner labels a bare acknowledgement with the word the script used.** `said_ack`
  prints `"{what}: {n}"` when a gesture has nothing of its own to say — so the base transcript
  reads `  ArrowUp: 1` and the converted one `  raise: 1`. **Comparing the raw transcripts
  asserts the step did not happen.** The base side is rewritten by the same map the conversion
  used, one-sided, with the count and every other sentence left alone.
- **the world FILENAME was in the runner's summary line** (`… τ 3813 -> k2b-a.hxw`), because
  the two runs wrote to `k2b-a` and `k2b-b`. Fixed by removing the difference rather than
  teaching the diff to ignore it: one PID-scoped world name, and the md5 taken *between* the
  runs.

✅ **And the rewrite turned out to be narrower than it looks, measured over a green run:**
`  ArrowUp: ` is **79 lines across all 31 scripts**, `  G: ` is **1**, and `  H: ` is **none at
all**. A gesture wears the bare label only when it has nothing of its own to say, and `place`
always does — `house placed 27 cells, 84 wall edges, ridge at 21, seated at 0 …`. **So the ten
presses with the most to get wrong are the ten compared word for word**, and the dead `H` row
is kept for `window.loft`'s reason: it is dead because of how `place` answers *today*, which is
a fact about a gesture rather than about this comparison.

### ⛔ And two copies of the probe ran at once, which could have produced a false PASS

One was started by hand, one had been queued behind the `B4` sweep by an earlier session. They
shared `probe/k2b/out` **and** `worlds/k2b-a.hxw`.

> The loud half was harmless: `rm -rf "$OUT"` under the second deleted the first's baselines
> mid-flight, so a script was compared against a file that no longer existed and said so.
> **The silent half is the one that matters — both runs took an md5 of the same path, so a
> byte comparison could have passed on a world the OTHER process built.** A false PASS on the
> step's central claim, produced by nothing either run did wrong.

Closed in two ways on purpose, because they are two failures: a **lock** stops a second run
(the only fix for a directory named so a person can read it afterwards), and the world name
carries the **PID** anyway — ⚠ *a guard that can be bypassed must not be the only thing
standing between an md5 and the wrong file.*

### The two controls, and why one of them had to exist

| | what it does | red on |
|---|---|---|
| `K2B_SABOTAGE=lower` | one `verb raise` in `house.keys` becomes `verb lower` | **3** — the world key, the saved bytes, the transcript |
| `K2B_SABOTAGE=refuse` | `house.keys` gains a `verb hole` with no slab under it | **1** — **the transcript alone** |
| control | neither | **PASS, 31 scripts** |

⛔ **THE SECOND ONE EXISTS BECAUSE THE FIRST CANNOT VALIDATE THE TRANSCRIPT.** `lower` moves
the world, the bytes *and* the sentences, so it goes red even on a transcript comparison that
has silently stopped working — **which is exactly the state this probe was in when it was first
run.** A refused gesture writes nothing: same world, same bytes, same session, one extra
sentence (`refused: hole refused — no slab to cut — lay a slab first`). If that row were green,
the transcript check would be decoration.

## What `K2a` turned up (2026-08-12) — and it split the step

**The 18 opening presses across 8 scripts are `select <kind>` + `verb opening` now**, and
**every other key was left alone**. That is the step's shape rather than laziness: `verb_of` is
one-to-one everywhere except the opening family, so those 18 are the only presses `V2b` could
silently regress. And the rest cannot be finished anyway — `press` has no verb for `R`, `E`,
`Q`, `B`, `C`, `J`, `K`, `V`, `Y`, `T`, `X` or `Z`. **`K3` is blocked on those twelve, not on
`K2`.**

⚠ **THE EIGHT SCRIPTS HAVE NO GATE BETWEEN THEM.** The suite drives `cache`, `indoors`,
`cellar`, `clientmesh` and `deck`; these eight are run by hand. `make gate` staying green says
nothing about the conversion, so `probe/k2/` is their only check — each script beside a
committed baseline of itself, both through a server of its own.

⚠ **AND BOTH WIRE INSTRUMENTS ARE BLIND TO A NICHE'S DEPTH.** The server prints `om_kind`,
whose own field comment says *"the profile, after the tens and twenties are read off"*, so a
doorway, a niche and an embrasure all report `opened profile 1`; the store gets `DOOR_MAT`
whatever the depth, so the saved worlds are byte-identical. **Sabotaged to prove it**:
`niche.keys` converted as `select 1` three times where it means `1 11 11` leaves all six
sentences identical **and the world at the same md5**. Only the third check — the kind sequence,
read out of `script.mjs`'s own `KEYMAP` and walked with the selection carried forward — goes
red.

> ⏭ **A live wording defect, recorded not fixed.** An author who cuts a niche is told exactly
> what an author who cut a doorway is told. `S2a` froze that sentence deliberately while the
> choosing moved; naming the depth is a change to make on purpose.

⚠ **AND `K1`'s SESSION READ-BACK COULD NOT STAND IN, WHICH WAS THE FIRST IDEA.** It is exactly
the instrument that sees a depth — and `press` has no `R`, so **seven of these eight scripts
build no wall at all** in `editor_run` and every opening in them is refused with *"no wall here
to open"*. The strongest instrument in the tree had nothing to look at.

⚠ **ONE SCRIPT CARRIES THE SELECTION FORWARD ON PURPOSE.** `niche.keys` chooses `11` once and
cuts twice — a selection stands until something moves it, which is what makes `select` a tool
rather than an argument. The check walks the selection instead of expecting one `select` per
opening, or it would have called the idiomatic script wrong.

## What `P2` turned up (2026-08-11)

**It holds: `host_output` → our JS → `loftPush` round-trips inside a `--html` page**, with a
script *we* appended. So `W5` needs no loft change and
[#851](https://github.com/loft-lang/loft/issues/851) is an improvement rather than a blocker.

⚠ **THE TWO SHELLS ARE NOT THE SAME, AND THE DIFFERENCE IS EXACTLY WHERE A CONSUMER TRIPS.**
`editor_client.loft` emits the **full engine shell**, where `loftPush` is created **lazily** inside
`loft_host_input_len` on the first `host_input()` — so JS cannot push before loft has asked, unless
it pre-creates `globalThis.__loftInQ`. A plain program emits the **minimal shell**, where
`loftPush` is defined **eagerly** over a module-local `inQ` and `__loftInQ` does not exist at all.
**The probe's shim works on both**, and the page the client actually ships is the *lazy* one — so a
`W5` written against the minimal shell alone would have failed on the only page that matters.

⚠ **THE CONTROL IS A REQUEST JS REFUSES TO ANSWER.** `SKIP:` comes back **empty**, so the channel
carries what was asked rather than echoing — and `REQ:world` after it proves `SKIP:` did not wedge
the queue. One exchange proves a wire; three prove it carries what was asked for.

⚠ **AND THE SECOND INSTRUMENT WAS WRONG FIRST.** It counted `answered += 1` beside the push;
sabotaging the push alone left it reporting **2 answers where none were delivered** — a second
instrument agreeing with a broken first. It records the pushed *values* now, which is why the two
failure modes are distinguishable: no-push reports `pushed: []` (our JS ran, delivered nothing),
no-injection reports `null` (our JS never ran).

## What `R1b` turned up (2026-08-11)

**The row's own instrument was blind, and so was the gesture's.** It specified *equal `w_tau`
and equal trunk state*; `w_tau` **cannot see this defect at all** — two rings of the same radius
write the same number of edges whichever layer they land on, and each write changes something.
Nor can `ak_n`: it comes from `fence_count`, which reads the world back **at the same reference
it wrote at**, so a ring laid entirely in the yard below counts a perfect 42 and agrees with
itself. `wall_of`'s own comment records that trap; it arrived one caller up.

> The instrument is `edge_layer` asked at the **other** reference: the fence bytes on the ground
> while the author stands upstairs. 42 there is the bug, 0 is correct.

⚠ **AND A FLAT FIXTURE PASSES WITH THE DEFECT INTACT** — one layer, and `0.0` and the author's
height name the same one. The test asserts the two references land on **different layers** before
it presses anything. Same trap one scale down: the pose stands **off the cell's centre**, because
an author sitting exactly on `hex_to_px(6,6)` cannot tell *the cell's centre* from *the author's
own position*, and the sabotage that takes the pose's coordinates passes.

⚠ **"YAW FORCED TO 0.0" IS A DIFFERENCE THAT IS NOT ONE.** The server builds
`author_at(px, pz, 0.0, py)`; `press` passes the real pose. A ring provably reads no yaw —
`fence_ring` takes `px_to_hex(au_x, au_z)` and hands a **cell** to `fence_disc`, and `trunk_of`
does the same — so it is pinned by a test that rings twice at two yaws, rather than by copying a
zero whose meaning nobody could check.

⚠ **THE TRUNK WAS TWO SERVER BUGS, NOT ONE MISSING FIELD.** `editor_server` rang the disc in
`do_fence` and remembered the cylinder **eleven hundred lines away** in its message loop — from
the PAYLOAD rather than from what was written, and **after `do_fence` had already returned on a
refusal**. So `23:9,2` left a phantom trunk of radius 2 where no edge was laid, and `23:3` with
no radius recorded nothing for a ring it did lay. One call rings and records now, and the four
locals became the session's **ninth registry** — which also puts the ring under part mode's *a
part has no ring of its own*, where it never was.

⚠ **AND BOTH WERE MEASURED AGAINST THE OLD SERVER RATHER THAN REASONED.** No gate drives `K`
at all — the trunk's only consumer is `MSG_ANNEX` and its only script is `annex.keys`, which
takes photographs — so the old branch was put back verbatim beside the new one and the same
three-case script driven through both:

| the script does | the OLD server | the NEW one |
|---|---|---|
| `G`, then `K` beside it | `annex kind 1 at (6,4)` | **identical** — the working path did not move |
| `23:1` (a ring, no radius), then `K` | *"nothing to attach to"* — for a ring it had just laid | `annex kind 1 at (-4,-8)` |
| `23:9,2` (refused), then `K` | **`annex kind 1 at (13,13)`** — a balcony hung on a phantom | refused, correctly |

⚠ **THE FIRST ROW IS THE ONE THAT MATTERED MOST**, and not for the reason the table suggests: it
is the only check that `sess` is genuinely written through **two** parameter hops (loop →
`do_fence` → `ring_set`). A struct that copied instead of aliasing anywhere along there would
have left the trunk in a dead session — loft#774's exact shape — and every test above would
still pass, because the library tests only cross one hop.

⚠ **AND IT PAYS ONE `world_to_hex` SITE.** `editor_server.loft` is 29 → **28**, because the
deleted branch re-derived the ring's centre through `moros_render` that `fence_ring` already had.
Plan 19 `L6.3a`'s bill, one line smaller for free.

## What `S3` turned up (2026-08-12) — the collapse, and the fork it turned on

**Six keys reach one gesture now**, and `R3`'s deliberate regression is retired. The equality is
the row's own and it holds for all six: pressing the key and selecting-then-cutting leave the
same world **and the same session**.

⚠ **THE FORK IS THE FINDING.** The obvious reading of *collapse* is that a key means **choose
this and cut it**, the way picking a brush works. Refused — because `36:<kind>` does not move the
selection either, so a key that re-chose in one driver and not the other would leave **different
sessions from one keystroke while leaving identical worlds**, and the equality test that proves
the collapse looks at worlds. A divergence hiding under a green test is what `W4` exists to
prevent. There is a test for the decision, not just for the behaviour.

⚠ **THE TABLE IS WRITTEN OUT ON BOTH SIDES.** The test names the wire's own `1 2 3 4 11 21`
beside the six keys rather than deriving both from one list — a table checked against itself
cannot be surprised, and `W4`'s whole finding is that **four** tables disagreed.

⚠ **AND A SABOTAGE AIMED ELSEWHERE FOUND A DEFECT IN THE NEW CODE**: `M` with no niche refused
with an **empty reason**. The library left `om_why` blank because the server composes that
sentence — right for the wire, useless to a runner or a page, and *never a blank no* is a rule
about every driver.

## What `S2b` turned up (2026-08-12)

**It is `S1` and `S2` in one, and that was forced rather than chosen**: a selected profile's only
possible consumer is the gesture that cuts one, so the field alone could not go red. It only
became buildable at `S2a`, when that gesture stopped being eighty lines inside a socket handler.

⚠ **THE ADMISSIBLE SET IS NOT A RANGE**, which is why it is a predicate and not a bound. The units
are the outline (`0..4`) and the tens the depth, so `5`, `15`, `25` and `30` are nothing at all: a
`0..24` check waves through **nine** kinds no branch of `opening_make` answers, and the author
gets a flat door wearing a number they chose on purpose. Five outlines × three depths = **15**.

⚠ **THE SELECTION IS NOT A REGISTRY**, and `session_scene_clear` leaves it alone on purpose — it
is what THIS AUTHOR chose, `es_author`'s category, so it survives a load and a part open. That is
`S0`'s finding used rather than restated.

⚠ **AND `36:<kind>` DOES NOT MOVE IT.** A bare `36:` cuts what is chosen; `36:2` cuts a pointed one
and leaves the choice standing. A key that silently re-chose would make *what am I working on*
depend on what you last pressed — the question the subject line exists to answer, and it carries
`· opening <kind>` now.

⚠ **THE CLAIM IS THE `Opening`, NEVER THE LINE.** Three selections, three worlds, three openings
that differ in outline and depth and agree everywhere else. Measured on the wire too, end to end:
bare `36:` → `opened profile 1`, then `49:2` → `opened profile 2`, then `49:5` refused and the
next bare `36:` **still** `profile 2` — a refused selection changed nothing.

## What `S2a` turned up (2026-08-11) — the choosing had no way to be tested

**Eighty lines of `36:`'s handler moved into `hex_editor::opening_make`** — the tens-and-twenties
reading, the projection onto the wall, the four profile branches and the niche host. This is the
sixth gesture the headless thread has taken out of the socket, and the reason is the one that made
`S1` unbuildable: **the only consumer an opening profile can have is the opening gesture, and it
was not callable from a test.**

⚠ **THE FIRST INSTRUMENT MEASURED THE MACHINE.** Diffing what `tools/script.mjs` printed for
eight scripts showed differences — and every one was a `rebuilt N chunks` line moving, because
`key` sleeps 250 ms and then reads *the last status line*, so which broadcast it catches is a
race. The server's own `println` stream is the deterministic instrument: **240 lines over eight
scripts, identical**, with only the per-run `run-<n>.rec` id differing. It covers profiles 1, 2, 3
and 4 and the embrasure.

⚠ **AND ONE PREDICTION WAS WRONG, WHICH IS WHY THE TEST IS BETTER THAN INTENDED.** *"Halving the
world's unit doubles the arch's height"* measured **9 then 12**: the SPRINGING is a fixed count of
height units and only the RISE above it scales — and even the rise does not double, because it
truncates (half-span 0.625 rises 2 units at 0.25 and 5 at 0.125). What is exact is the rise in
WORLD units: never above the true semicircle, and within one of the world's own units below it.
The sabotage that hard-codes 0.25 is red on exactly that clause.

⚠ **AND A DEFECT WAS FOUND AND DELIBERATELY NOT FIXED**: the `36:` handler's closing
`opened a profile K hole` runs **after the embrasure branch too**, so a `2x` press sends two
sentences and a REFUSED embrasure says *"no niche to cut into"* and then *"opened a profile 1
hole"* over the top of it. A move is proved by the wire being byte-identical, so the wire cannot
change in the same breath.

## What checking `S1`'s premise turned up (2026-08-11) — and it was a live defect

**`S1`'s row says the session is *saved and replayed*, naming `world_to_bytes`/`world_from_bytes`.
None of the session is in those bytes** — the format holds the header, the palette, the chunk
directory, the voxels and the sections that live in `w_sections`, and the nine registries are the
editor's own.

⚠ **AND THE LOAD PATH DID NOT CLEAR THEM EITHER.** Measured through the socket: build a house,
`8:` save, `9:` load a world with no house in it — and `37:` still built `annex kind 1 at (-2,1)`,
a balcony on the wall of a cottage the store no longer held. `36:` refused in the same breath,
**because it reads the store**. Two authorities, and *which one asks the world* is the
discriminator between them.

✅ **Fixed as `S0`.** `hex_editor::session_scene_clear` is *everything the session records about
one store*, and it is the one list both `9:` and part-open take — the part-open block already
listed nine registries and `R1b` had to add a tenth to it, while the load path wanted the same
list and did not have it. It also clears the DRAFT, which part-open did not: a two-press run whose
first press is in the world you just closed lays a wall between two worlds. The probe now answers
*"nothing to attach to"*, and the sabotage that leaves the trunk behind is seen red.

> **So the selection is not world state.** It is what *this author* has chosen — `es_author`'s
> category, *a driver's pose, never the editor's* — and under multi-player two clients editing one
> world hold two selections. ⚠ **Which removes `S1`'s only test**: a field nobody reads, whose
> round-trip claim has evaporated, is the *built and never called* defect with a planning hat on.
> `S1` merges into `S2` — the field, the verb that sets it, and a consumer that reads it.

⚠ **AND THE REGISTRIES' ABSENCE FROM THE FORMAT IS AN OPEN QUESTION, not a bug fixed.** Saving a
world and reloading it loses every wall run, roof plan, leaf, opening, annex, prop, slab and hole;
the drawing degrades to per-edge panels and a roof from cells. A load can only give back the
cells, so what it owes is to **say** it lost the records rather than to hand over another world's.
Putting them in the bytes is a format plan, beside plan 17's two ◐ rows.

## What `R3` turned up (2026-08-11)

**The regression it was priced for does not exist.** `house.keys` is the only script `editor_run`
is driven over, and its `O` and `P` were **already refused** — *"no wall here to open"* — so the
world the runner writes is **byte-identical** before and after, τ 3909 both. Only the sentence
changed.

⚠ **AND THE THIRD ANSWER IS NOT `PR_NONE`, which is a deliberate deviation from the row above.**
`PR_NONE` means *this key is not a gesture*, and saying that about `O` tells a reader the editor
cannot cut an opening — false, the wire cuts one on every `36:`. `PR_SELECT` is a refusal with a
reason, and `O`/`P` stay on the *is a gesture* list. *Reason, offer, residual, never a blank no*,
applied to a keystroke.

⚠ **THE CLAIM WORTH TESTING IS A BYTE, NOT A REFUSAL.** *"`press` answers `PR_SELECT` for `O`"* is
a table checked against itself. Underneath it: **`WINDOW_MAT` had exactly one writer in the whole
tree** and it was `press`'s `P` — the wire always cuts with `DOOR_MAT` — so a window material on an
edge was a world the server cannot produce. ⚠ **That test passed first time for the wrong reason**:
seven keys pressed into ONE world left no `WINDOW_MAT` the counter could see, because `ArrowUp` and
`H` move the ground and `open_ahead` takes its reference from the ground it finds. One fresh world
per key, control sharing the fixture exactly — the `R1b` trap, one step later.

⚠ **AND A LIVE DEFECT FELL OUT: `house.keys` CUTS NO DOOR AND NO WINDOW, IN EITHER DRIVER.** Its
own comment says *"stand ON the wall's own cells"*; measured, both poses answer *"no wall here to
open"* on the server too, so `shots/s6-house.png` has never had either. **It is the pose** — the
same house opens from `-3 2` and from `-6 -1`. Not fixed here: choosing the pose composes a
picture whose acceptance is *does a person call it a door*, and the working poses found so far are
on a face that script's camera does not see.

## What `W4` turned up so far

**What a key means was re-asserted in FOUR places** — `editor_client`'s ASCII constants,
`editor_server`'s wire ids, `script.mjs`'s 23-entry `KEYMAP`, and `editor_run`'s direct map — and
omitting one was silent. ⚠ **Two of them said so in their own source**, and `script.mjs`'s
authority comment points at `html/editor.html`, **deleted on 2026-08-02**.

⚠ **THE DIVERGENCE WAS ALREADY REAL.** `H` built the house at two different heights: the server
took the grade under the author's feet, `editor_run` took it at the **origin**. Both are
`world_ground_cell(…).h_height` underneath, so they agreed on flat ground at (0,0) and nowhere
else — and every fixture stood there.

⚠ **`HOUSE_W`/`HOUSE_D` HAD THREE COPIES**, and the server's **shadowed the library's invisibly**.
`tools/names.sh` was silent and correctly so: it scans programs for bare *uses* of a library name,
never for a program *declaring* one a library also publishes. **That gap is recorded at the site
and is not yet fixed.**

⚠ **`terrain_h` AND `ground_h` ARE THE SAME FUNCTION UNDER TWO PUBLIC NAMES**, both in
`hex_editor`, byte-identical bodies. Found while proving the grade swap exact. Noted, not fixed.

⚠ **AND A DRAFT HELPER WAS DELETED RATHER THAN SHIPPED.** `is_gesture(key)` derived its answer by
running `press` against a scratch world so the key list could not be stated twice — which meant
*asking whether a key is a gesture built a house*. A predicate with a side effect and a cost is
worse than the duplication it avoids.
