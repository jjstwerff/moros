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
cuts), and `P2` is **run and green** — so `W5` is
buildable today with no loft change. **`V1`** is built — a key names a verb, and the key stops
carrying a profile.
**Next:** **`V2`** — the callers move to verbs one at a time, `editor_run` first. The full step
decomposition is
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
| `B1` | the local page and the attached client build the **same world** from the same key sequence | the two authority modes are **one editor** | drive both with `tools/scripts/house.keys` and diff `w_tau`; if they differ, `press` has become a fifth site |
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
| ◐ **`W4`** — `hex_editor::press`, the key→gesture chokepoint | M | `editor_run` ✅ · server `MSG_HOUSE` ✅ | ◐ **Two of four, and the rest now waits on `M1`** — see below |
| ✅ **`R1a`** — the pose carries the ground under the feet | S | **DONE.** `make lib-test` rc=0 both backends (hex_editor 398→400) · `make parts` byte-identical · the house script still `τ 3909` · two sabotages seen red | ✅ Done |
| ✅ **`R1b`** — reconcile the RING verb with `do_fence` (reference, yaw, the trunk) | S | **DONE.** 5 sabotages seen red · `make lib-test` rc=0 both backends (hex_editor 400→404) · `make parts` byte-identical · `make gate` 47 PASS / 0 FAIL | ✅ Done |
| ✅ **`R3`** — `press` answers **`PR_SELECT`** for `O`/`P` until a selection exists | XS | **DONE.** Both tests seen red first · `house.keys` through the runner is **byte-identical**, τ 3909 · the wire path untouched | ✅ Done |
| ✅ **`S2b`** — the selection, the verb that sets it, and the gesture that reads it | S | **DONE.** Three selections cut three different `Opening`s · 5 sabotages red · `49:` on the wire, `36:` bare cuts what is chosen | ✅ Done |
| ✅ **`S3`** = **`R2`** — `O P I U N M` collapse to ONE `opening` verb | M | **DONE.** Six keys against six selections: equal `w_tau` AND equal `Opening` · 4 sabotages red · `R3`'s regression retired | ✅ Done |
| ✅ **`S0`** — the scene records go with the store they describe | XS | **DONE.** Found while checking `S1`'s premise: `9:` left the previous world's cottage in the session and `37:` hung a balcony on it | ✅ Done |
| ✅ **`S2a`** — the opening's CHOOSING moves into `hex_editor` | S | **DONE.** The server's report is **identical over 8 scripts and 240 lines**; 5 new loft tests, 4 sabotages red | ✅ Done |
| ✅ **`V1`** — the verb vocabulary, `verb_of(key)`, and a `press` that takes a verb | S | **DONE.** Eleven keys through both layers, compared as whole-world BYTES · 6 sabotages red · hex_editor 420 → 428 | ✅ Done |
| ✅ **`V2a`** — the server's `MSG_HOUSE` takes the VERB | XS | **DONE.** `make headless-same` green, sabotage red (`served:` empty against `house placed 27 cells, 84 wall edges, ridge at 21`) · `make gate` 48 PASS | ✅ Done |
| **`V2b`**–**`V3`** — the script-reading callers, then `press(key)` deleted | M | ⚠ **not "the same script builds the same world" — that instrument is blind here**, see below | ⏭ **Blocked on `K2`, not on `V2a`** |
| **`D1`**–**`D2`** — `mode_at` measured beside everything, then consulted | S | ⚠ the derived mode must never contradict `shelter_at` over a whole scripted scene, house-in-a-cave included | Blocked on `V2` |
| **`K1`**–**`K3`** — scripts accept both spellings, convert one at a time, then drop keys | S | a converted script and its original build the same world | Blocked on `V1` |
| **`T1`** — a type declares defaults and its own verbs, as DATA | M | ⚠ a declared type reproduces today's cottage **byte for byte** in `make parts` | Blocked on `K2` |
| **`B1`** — local mode in `editor_client.loft`: hold an `EditSession`, route presses to `press` | M | both modes build the same world from one script | Blocked on `W4` |
| **`B2`** — `tools/build-pages.mjs`, and `_site/` | S | `_site/index.html` opens from `file://` | Blocked on `B1`, `P5` |
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
| **`loft-lang/loft`** | the `--html` shell | [#851](https://github.com/loft-lang/loft/issues/851) — bind the `fs_*` contract the wasm host already defines, `LayeredFS` backing it. ⚠ **Ask before building `W5`**: the installed loft leads `main`, so this can land inside a session, and this tree's rule is to wait for a toolchain rather than build around it |
| **`crawler`** | the third consumer of the camera | **read-only from here.** They declare `hex_field`/`hex_edge` and **no `hex_voxel`** — which is what forces `hex_cam` to take a height sampler rather than a world. ⚠ A shared package means `loft-libs-*` or the registry, and **a published package is one of the three things this tree does not do without asking** |

## Open questions

1. **Where does `hex_cam` live once crawler takes it?** `lib/hex_cam/` is where it is *built and
   verified*; it cannot stay there once a sibling consumes it. `loft-libs-world` is the obvious
   home — and adding a public name there can turn crawler red with no local edit, so grep first.
   *Not decided; `C4` is the step that asks.*
2. **Does the demo ship the whole part library, or a starter set?** `data/parts/` is 23 files and
   inlining it costs page weight the quick start pays on every open. *Wants a number from `B2`,
   not an opinion.*
3. **What does local mode do about the walk?** The server has a tick and a walker; `editor_run`
   teleports and says so. The page reuses the client's existing walk — **unverified**, and the
   design names it as the honest place its invariant may be false.

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
