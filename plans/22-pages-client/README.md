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

✅ **AND `B1a` IS BUILT — the client's five one-to-one keys name verbs, 2026-08-13.** `W4` is three
of four sites, and `make probe-b1a` is the first check in this tree that has ever pressed a key in
the client at all.

**Next:** **`B1b`** — local mode in `editor_client.loft`. The full step decomposition is
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
| `B1b` | the local page and the attached client build the **same world** from the same key sequence | the two authority modes are **one editor** | ⚠ **NOT `w_tau` — that row was written before `V1` measured it blind.** A fence ring and a wall ring write the same edges of the same disc, so the clock reports one number for two worlds. The comparison is **`world_to_bytes` AND the session**; if they differ, `press_verb` has become a fifth site |
| `B3` | the demo gate opens `_site/index.html` **with no server** and reads a house out of the picture | the quick start **stays** working | ⚠ the gate must fail on an empty page — `[].every(…)` is `true`, and this tree has shipped a row that reported `ok` on a picture with no panel at all |

⚠ **`B2` (`build-pages.mjs`) has no exact-invariant surface** — it assembles files and decides
nothing. Said in a line so the silence does not read as *gate done*.

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
| **`D1`**–**`D2`** — `mode_at` measured beside everything, then consulted | S | ⚠ the derived mode must never contradict `shelter_at` over a whole scripted scene, house-in-a-cave included | Blocked on `V2` |
| ✅ **`K1`** — scripts accept both spellings: `key H` and `verb place`, plus `select <kind>` | S | **DONE.** Both drivers, twin scripts, compared on the world AND on the session · `make probe-verbs` · ⚠ the row's own control was blind — see below | ✅ Done |
| ✅ **`K2a`** — convert the presses that LOSE information: 18 opening keys in 8 scripts | S | **DONE.** Each script beside a committed baseline of itself, through a server: sentences, saved world **and** kinds · `make probe-convert` · ⚠ the first two are blind to a niche's depth — measured | ✅ Done |
| **`K2b`**–**`K3`** — convert the rest, then drop the key spelling | M | a converted script and its original build the same world **and the same session** | ⏭ **Blocked on twelve keys having no verb** — `R E Q B C J K V Y T X Z` |
| **`T1`** — a type declares defaults and its own verbs, as DATA | M | ⚠ a declared type reproduces today's cottage **byte for byte** in `make parts` | Blocked on `K2` |
| ✅ **`B1a`** — the client's key table names a **VERB** — `W4`'s fourth site | S | **DONE 2026-08-13.** `make probe-b1a`: the real client page driven by a browser against a fresh server, beside a committed baseline of itself. **7 sentences identical, world `82d622b3` identical.** Two sabotages red, each on a different instrument | ✅ Done |
| ✅ **`B1b.0`** — ONE world model: `ε`/`θ` are `hex_editor`'s, not each program's | XS | **DONE 2026-08-13.** `worlds/headless.hxw` moved to **exactly the md5 the pre-change experiment predicted**; `make parts` byte-identical, `make headless-same` rc=0, `make lib-test` 1600 both backends. One sabotage moves the runner AND the server | ✅ Done |
| **`B1b.1`** — local mode holds a session, an author and its own world; a key WRITES into it | M | the page prints an `Ack` and a world digest; `editor_run` driving the same verbs at the same author prints the same | ⛔ **BLOCKED ON ITS BOOT SWITCH** — `host_input()` BLOCKS with no host, measured. [loft#891](https://github.com/loft-lang/loft/issues/891); see below |
| **`B1b.2`** — local mode DRAWS what it wrote (re-mesh on write) | S | a picture, and the world digest unchanged by drawing it | Blocked on `B1b.1` |
| **`B1c`** — the walk in local mode | ? | ⚠ **unsized on purpose** — see below | Blocked on `B1b` |
| ✅ **`P6`** — does a `--html` page have a FILESYSTEM, and does a world saved in it survive a reload? | XS | **RUN 2026-08-13 — it holds**, `make probe-p6`. 21 `fs_*` names against the design's 0 of 20; `pass2 ok` over http AND `file://`; the base tree reads as the interpreter's directory; `P6_SABOTAGE=persist` seen red | ✅ Done |
| ⛔ **`W5`** — `lavition_host`, the interim storage shim | S | — | ⛔ **CANCELLED by `P6`** — its own escape clause fired |
| **`B2`** — `tools/build-pages.mjs`, and `_site/` | S | `_site/index.html` opens from `file://` | Blocked on `B1`. ⚠ **`P5` is no longer a blocker** — the inlined route is measured to work from `file://`, so `P5` decides only whether the page could be SMALLER |
| **`B3`** — the demo gate | S | ⚠ **the first gate here needing NO server** | Blocked on `B2` |
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

⏭ **THREE ROUTES, and none is a coin toss:**

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

⏭ **WHAT `B1b.1` STILL NEEDS, and none of it is guesswork now:**

1. **A boot switch.** *"The mode is a boot decision, not a build decision"* — and a `--html` page
   cannot read its own URL (the client's source says so) or an env var. The mechanism is `P2`'s:
   `host_output` a question, `host_input` the answer, which was **run and holds in both shells**.
   ⚠ And the default falls out for free — `P2` measured an unanswered request returning **empty**,
   so the server-served page gets `""` and stays attached without anyone deciding.
2. **A session, an author and a world.** `hex_editor::EditSession {}`, `author_on(w, 0.0, 0.0,
   0.0)`, and the cache — which `B1b.0` just made the right world. `src/editor_run.loft:240-247`
   is the model, four lines.
3. **A digest to compare.** `editor_run` already prints `session_digest` and saves; the page can
   print the same and `P6` proved it can `world_save` too. ⚠ **The comparison must be against
   `editor_run` at the SAME author**, because a pose is not a gesture: local mode teleports like
   the runner does, and `B1c` is where a walk gets one.

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
