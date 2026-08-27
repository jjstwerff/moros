# STATE.md — where the editor work stands (2026-08-21)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — newest first. ⚠ Its numbers are LABELS, not a count: there are two Session 14s, and 20–26 are reconstructions |

⚠ **THIS FILE HAS BEEN CUT TWICE AND THE SECOND CUT IS WHY THE RULE HOLDS.** It reached
**4,467 lines** — the longest document in the tree, and the one a reader is told to open
first, with the current state buried in session logs. On 2026-08-21 the 08-12 … 08-19
sessions went to [JOURNAL.md](JOURNAL.md) (Sessions 20–26) and then everything else that
described a *moment* rather than the present went to the plan or the journal that already
held it: **4,467 → 554**.

⚠ **THE FIRST CUT WAS BY DATE AND THAT WAS THE WRONG AXIS.** It removed nine days and left
535 lines of plan 17, 162 on a gate optimisation and three landed-plan sections either side
of the hole — the same shape of content, kept only because it carried a different date. The
axis is **what the section IS**: a moment goes, a standing fact stays.

⚠ **THE PER-STEP RECORD BELONGS TO THE PLAN** — `plans/<n>-<name>/README.md` carries a *What
`Ax.y` turned up* section written when the step landed, and this file duplicating it is how it
grows back.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⏭ WHAT THE EDITOR DOES TODAY — the thing itself, before any of the findings

**You walk around inside a hex-voxel world and build in it.** Not a map you edit from above:
there is an author standing in the world, gestures land where they are standing and facing,
and the camera is derived from their pose.

⚠ **THE VERBS ARE WHAT IT CAN DO, AND THE LIST IS THE WHOLE LIST** — all **17** of
`the_vocabulary()`, which is the number `keymap.loft` and `verb.loft` both refuse to let
a verb arrive without.

| | |
|---|---|
| the ground | `raise` · `lower` · `level` (freeze a grade and cut it as you walk) |
| runs | `run` — open, walk, close; a road or a wall along the path taken · `aim` — one press, from the facing |
| enclosure | `fence` · `wall` (both hexagonal) · `tower` — ROUND at a chosen shell, or **OCTAGONAL** when the chosen wall type's body says `THICK_OCT` (plan 26 `B4l`) |
| buildings | `place` (a procedural house, or the chosen PART instead) · `storey` above · `cellar` below · `opening` (door or window, profile from the selection) |
| fittings | `seat` · `annex` · `slab` · `hole` · `stair_up` · `stair_down` |

⚠ **AND WHAT A VERB MAKES IS NOT ALWAYS ITS OWN.** `tower` reads the SHAPE off the chosen
wall type's palette body and the SIZE off `session_shell` — plan 26 `B4l`. That is the only
place a body decides geometry, and it is allowed here for the reason `B4i` refused it for
`wall`: a body says a wall is round and cannot say how big, and this is the one gesture that
already knows.

**A catalogue decides what a verb makes.** Eleven materials (`grass` `road` `field` `tree`
`roof` `wall` `floor` `frame` `soffit` `rock` `water`) and 20 parts under `data/parts`, drawn
in the side panel with a rendered thumbnail each — never a loaded image. Choosing a part makes
`place` build **that** instead of the procedural house.

**Everything is rebindable.** A key names a *verb*; the binding is data, edited from inside the
editor (`Escape`, click a slot, press a key) and written to disk, so it survives a reload. The
wire carries the verb and never the key.

**Five camera modes over one query** — AUTO, FOLLOW, SNUG, CUTAWAY (de-roofed, for editing) and
EYES (first person). The mode decides; `shelter_at` only observes.

**It runs three ways over one library**, and that is the point rather than a convenience:

| | |
|---|---|
| `src/editor_server.loft` | a socket. Multi-client, the authority remote |
| `src/editor_client.loft` | the picture. `--html` in a browser, **or** the same client against a server — the authority is LOCAL or REMOTE, one program |
| `src/editor_run.loft` | a script, headless. `verb`/`keys`/`step`, no clock but the script's |
| `src/plan_view.loft` | a **plan of a saved world**, as SVG. No clock at all — plan 26 `B0`, `make plan-view`. It draws the field and the DESCRIPTION recovered from it: a straight run, a disc, an octagon, or a HOUSE's rectangle — and which of the two round readers is asked is the **palette's** decision, not the field's (`B4m`). ⚠ The house's rectangle comes from its FLOOR, not its marks, and the caption names the marks it does not explain: **4 per house, one per corner** — `B0`'s oldest open question, answered at `B4n`. ⚠ **A window holds more than one description now** (`B4o`): a mark is attributed to a structure before anything is asked what it describes, which is what closed `B1`'s *a house eight hexes away makes an unrelated wall unreadable*. ⚠ **And the leftover gets the WHOLE chain** (`B4p`) — a house and a round or octagonal tower are both drawn, with the LEFTOVER's own palette picking which round reader is asked; a leftover of two structures is counted and not drawn, because the split is one level deep. ⚠ **And a run's description is measured against the field it came from** (`B4q`) — `· N stray · N missing`, the same grammar the house uses — which is how [EDITOR_DEFECTS 7](EDITOR_DEFECTS.md) was found: **the same wall walked the other way is a different field**, because `wall_stamp` takes its halfplane normal from the run's tangent |

⚠ **AND THE FOURTH IS WHY THE COUNT MATTERS.** `plan_view` draws the STORE — one polygon per
cell, one line per stored wall byte, out of the `.hxw` — and the first picture it made found four
wall edges in `house.keys`'s house that bound none of its 27 cells, one of them carrying an opening
the script has cut for as long as it has existed. A fourth driver over one library costs 80 lines;
what it buys is a question the other three cannot be asked. [plan 26](../../plans/26-blueprint/README.md).

⚠ **THE PAGE NEEDS NOTHING.** `_site/index.html` opens from `file://` with no server, no port
and no toolchain, carries its own part library, and the world you build in it survives closing
the tab. It attaches to a server if it is told about one.

✅ **AND THE THREE AGREE, MEASURED RATHER THAN ASSERTED** — `deck.keys` run headless is
`cea971a0…`, the server's own world **to the byte**, with no server, no socket, no browser and
no clock. It holds because the tick body, the gestures and the store are one library
(`hex_editor`, `hex_voxel`, `hex_mesh`) and the drivers are only I/O; `probe/k3d` keeps `deck`
against its baseline in `make fast`.

### ⛔ What it does NOT do, so nobody goes looking

| | |
|---|---|
| a part cannot be opened for editing from either renderer | `44:` has no client binding — a script or `wscat` only |
| a material cannot be CHOSEN | there is no `session_select_*` for materials; the panel lists them and a click says so out loud |
| the toolbar's six buttons do nothing | superseded by the verb bar; a click is consumed and says so |
| the editor program is not lavition-only | `tools/layering.sh`: *still imports Moros — 2 of them*. Plan 19 `L6.3` |
| five camera scripts are checked by nothing | `K3f` — `ceiling` `cutaway` `eyes` `floorprobe` `lamp` leave the same world and session to the byte |

### ⚠ Built and not yet called — re-verified 2026-08-21

**This tree's commonest defect gets a standing list, because it passes CI.** A function
written, tested green and wired to no consumer is a claim about nothing.

⛔ **`hex_editor::names` — all EIGHT public functions have ZERO production callers.**
`names_new` `name_generated` `label_named` `name_taken` `name_of` `name_free` `name_set`
`name_refusal`. Tested at `B4`, invoked by nothing. It gets a consumer when catalogue entries
carry author-given names. ⚠ `hex_part::meta` persists a name and the server reads it
(`14:<roof>,<part>` acknowledges with `PART.name`), so the two want reconciling rather than
both existing — `PART.name` is the saved one.

⛔ **`44:` part mode has no client binding**, so nothing in either renderer can open a part.
Named here rather than left to be discovered.

⚠ **Thirteen of `lavition_ui`'s 33 public functions have no production caller** — listed in
that package's README, and labelled a proposal rather than a surface, since it is published now.

✅ **This session's three additions each have exactly one**: `pointer_step`, `list_row_rect`,
`panel_hit_test`. Checked rather than assumed — that is the whole point of the list.


## ⚠ WHERE IT LANDED — 2026-08-20

**`lavition_ui` 0.1.0 is PUBLISHED**, which closes @PLN145 `D0` — the only phase of that
plan that was ever ours. Tag `lavition_ui-v0.1.0` → `2692bfd` on `jjstwerff/moros`, a
GitHub release carrying the tarball, and [loft-lang/registry#24](https://github.com/loft-lang/registry/pull/24)
open (+19/−0) awaiting a maintainer. sha `ea646e67…`, 38 236 bytes, no deps.

⚠ **A FOREIGN-PACKAGE ENTRY — the source stays here.** The loft side argued against
their own repo: moving it into `loft-libs-graphics` beside `stage`/`text2d`/`tween`
would hand a library to a repo whose CI cannot exercise it, which is this tree's
promotion rule running backwards. `repository = "jjstwerff/moros"` in the manifest is
what makes `loft package` emit the right tag and URL.

⚠ **THE NAME IS NOW PERMANENT.** `lavition_ui` is a brand prefix against the
no-brand-prefix rule for lavition packages, and the user confirmed it on 2026-08-20
knowing a published name cannot be renamed.

⛔ **PR #24's CI WILL BE RED AND IT IS NOT OURS.** `loft-lang/registry`'s own
`tools/validate.py` — not a path in this tree — fails gate 1 on
untouched `main` — `zttext` and `fixstep` both carry `"categories": []`, confirmed
independently by the loft side over the live index. Our entry raises no validator error.

### The panel had no click, and that was a live defect rather than a gap

`panel_hit_test` had been tested green since plan 18 with **no caller**, so every press
fell through to the look-drag: clicking a catalogue row turned the camera under a person
whose eyes were on the panel — the exact thing the rebind path already refuses. It is
wired now, and a click on a part row chooses it through the *same* commit path the `h`
key uses (`commit_part_pick`).

⚠ **THE RULE MOVED TO `hex_editor::pointer_step`.** *A press that begins on a UI surface
stays that surface's until it is released* is a state machine over four booleans and
needs no browser — it was costing a 7 MB wasm rebuild per question. Sixteen states swept
headless; the client is the caller. ⚠ `on_ui` is a **boolean, not a `UiHit`**, so
`hex_editor` does not gain a `lavition_ui` dependency to learn nothing.

⚠ **AND THE GATE I WROTE FOR IT COULD NOT FAIL.** It compared line numbers across the
driver's stdout and the page's console — two streams that are never interleaved — so it
reported `ok` against the shipped defect restored. Rewritten as counts inside one stream:
**1 look-drag sabotaged, 0 fixed.**

### Seven of `probe/b2`'s blocks are answered headless now

`H F Q G R B L` run as scripts in `make fast` (`probe/headless/`), seconds instead of a
browser. **Every one of those blocks stays** — move before you remove: the browser keeps
the claim no script can make, that pressing a KEY reaches a verb, because `editor_run`
speaks verbs and held-key bits and skips the keymap layer.

⛔ **NEVER ASSERT THE VALUE OF A PER-TICK COUNTER.** `landed` counts ticks in a state, so
it measures the driver's sampling: at an identical walked distance the browser says
**34** and a held-key script says **28** — and replaying the distance as moving-then-idle
pulses says 34 exactly. `> 0`, never `-eq`. A world KEY is what was emitted.

### The loop is cheaper, and one guard is deliberate

| | before | now |
|---|---|---|
| one gate block | 16 browser boots | `DEMO_ONLY=P` — that block plus the core |
| `make client`, nothing changed | ~5 min wasm compile | `Nothing to be done` |
| try a gesture | no path but the full probe | `make press K='#part'` |

⛔ **`DEMO_ONLY` CANNOT PRINT `demo PASS`** — it prints `demo PARTIAL PASS` and names
what did not run, on the failure path too. A selector that prints the same verdict as a
whole run is how somebody checks one block and believes they checked the tier.
⚠ **`page-check` still FORCES the client rebuild** (`client-force`): the staleness it
guards is a TOOLCHAIN swap, which changes no source file and is invisible to `make`.

### `use self::` on all 129 of them

Every package's own modules, tree-wide — 129 lines, 39 files, 7 packages;
`tools/basenames.sh` drops from 71 module claims to 23. Nothing was red and that is the
point: no stranger can make the second claim later, and `lavition_ui` now lives in graphs
where strangers do, holding `panel`, `font`, `widgets` and `render`.

⚠ **`use self::x;` AND `x::fn()` ARE MUTUALLY EXCLUSIVE** — neither the bare qualifier nor
`self::x::fn()` parses, so *always write `use self::`* is unachievable for any file that
qualifies. Two sites dropped the qualifier instead;
[loft#1043](https://github.com/loft-lang/loft/issues/1043), and it is in loft's own
`LIBRARY_AUTHORING.md` §2a2 now.

### ⚠ The toolchain, and how to tell one build from another

⛔ **`loft --version` SAYS `2026.8.0` FOR EVERY BUILD ON THIS BOX** — five in two days, three
on the morning of 08-21 alone, two of them eleven minutes apart. **The sha is the handle.**

**Installed now: `eb4581d9…` (2026-08-21 10:38).** Everything current is measured on it —
`make fast`, the browser tier, `lavition_ui`'s gate.

✅ **`make loft-state` ANSWERS *WHICH LOFT AM I ON* IN ONE COMMAND**, stamped with the sha, and
it is the thing to run after any `make install-user`. Two cells, three states:

| | |
|---|---|
| both PASS | widening + deferral, complete — where we are |
| `via_variable` PASS, `callee_direct` FAIL | pre-widening: safe by AGE, not by cure |
| `via_variable` FAIL | ⛔ widening without a complete deferral — a text slice whose bound comes from a lower declaration will not compile |

⛔ **A ONE-CELL PROBE CANNOT TELL *FIXED* FROM *TOO OLD TO BE BROKEN*, and those want opposite
actions.** Mine had one cell and reported the toolchain sound while measuring a binary that
predated the defect. The second cell must **FAIL** on a pre-widening build; that is what makes
three states readable instead of two, and it came from the loft side correcting the first
attempt. ⚠ A state is a property of a BINARY — a reading cached across a swap is silently
wrong.

⛔ **AND THE FIRST `make fast` AFTER A SWAP CAN BE RED FOR NOTHING.** `registry index signature
INVALID — refusing to install`, un-bypassable, with the identical re-run green: the index and
its `.sig` are rewritten non-atomically and a crossing reader catches them torn.
**Re-run before diagnosing** — [#1045](https://github.com/loft-lang/loft/issues/1045), fix
unmerged. Seen twice in two days on this box. ⚠ *doesn't verify against any known key* is what
a tampered index produces, so the wrong next move is trust roots.

⚠ **WARM THE TOOLCHAIN ONCE AFTER ANY LOFT INSTALL** — see § *How to run things*.

### Filed, and two already fixed

| | | |
|---|---|---|
| [#1042](https://github.com/loft-lang/loft/issues/1042) | admission printed `allowed libraries: []` for a profile that was never defined | ✅ fixed |
| [#1043](https://github.com/loft-lang/loft/issues/1043) | no qualified spelling for a `self::`-bound module | ✅ fixed |
| [#1045](https://github.com/loft-lang/loft/issues/1045) | the registry index and its `.sig` are not swapped atomically | ⛔ fix unmerged — **re-run is the workaround**, see [LOFT_HANDOFF.md](LOFT_HANDOFF.md) |

## ⏭ THE SESSIONS THAT WERE HERE ARE IN THE JOURNAL — thinned 2026-08-21

**2026-08-12 … 08-19 lived here as 60 sections and 3,089 lines of session log** —
this file went 4,467 → 1,432 — in the one file a reader
is told to open first, whose own header complains about exactly that. They are
[JOURNAL.md](JOURNAL.md) **Sessions 20–26** now.

⚠ **THE JOURNAL ENTRIES ARE RECONSTRUCTIONS OF WHAT WAS HERE, so this cut is lossy** and the
loss is one-way: they were written *from* these sections, and what they did not carry is gone
rather than filed elsewhere. Accepted deliberately — a handoff nobody finishes reading costs
more than a detail nobody looks up. **Every design finding in them has its own durable home**,
which is what made the cut safe rather than tidy:

| what was here | where it lives |
|---|---|
| the mode refuses where the gesture works, in both directions | [EDITING_MODES.md](EDITING_MODES.md) · [`probe/d2`](../../probe/d2/README.md), 900 lines |
| the ground default, all eight steps | [GROUND_DEFAULT.md](GROUND_DEFAULT.md) · [`probe/perf`](../../probe/perf/README.md) |
| `hex_way`'s one-sided angle wrap, and the drift | [`probe/way`](../../probe/way/README.md) |
| two siblings claiming one module basename | [CLAUDE.md](../../CLAUDE.md) · [`probe/skin`](../../probe/skin/README.md) |
| the toolchain hashes and how to identify a build | § *WHERE IT LANDED* above |

**And the second cut, 2026-08-21** — everything else that described a moment:

| what was here | lines | where it lives |
|---|---|---|
| `Plan 17 — A8 is complete` | 535 | [plan 17](../../plans/17-parts/README.md), 2,236 lines |
| the gates, 1838 s → 741 s | 162 | [JOURNAL.md](JOURNAL.md) · [GROUND_DEFAULT.md](GROUND_DEFAULT.md) |
| plan 17 `A8` + the toolchain break of 17:25 | 101 | [plan 17](../../plans/17-parts/README.md) · [loft#815](https://github.com/loft-lang/loft/issues/815) |
| the store is `hex_voxel`, and the `h_wall` rename | 62 | [plan 19](../../plans/19-lavition-split/README.md) · [LAVITION_SPLIT.md](LAVITION_SPLIT.md) · JOURNAL 19 |
| plan 20 complete, and **KEEP THE GALLERY** | 36 | [plan 20](../../plans/20-verticality-last/README.md) · JOURNAL 17–18 |

⚠ **`THE SPLIT'S ONE INVARIANT IS FALSE` STAYED, and it is the test of the axis.** It is dated
2026-08-11 like three of the rows above, and it is not history: `tools/layering.sh` still
prints *the editor program still imports Moros — 2 of them* today. A cut by date takes it; a
cut by what-it-is keeps it.

### ⚠ Two instrument rules had no other home, so they stay here

⛔ **`make X 2>&1 | tail -N; echo "rc=$?"` REPORTS `tail`'s STATUS, WHICH IS ALWAYS 0.** Four
`rc=0` lines meant nothing before a stale log exposed it — 587 tests where 589 were expected.
⚠ **It came back twice more the same day**, once through `| head -1` and once as a "scoped"
test run that was the full sweep because a Makefile edit had silently not applied. `pipefail`,
or read `${PIPESTATUS[0]}`.

⛔ **THE PROFILER CANNOT BE POINTED AT THE TESTS.** `LOFT_PROFILE=1` arms on a program and on
nothing else — `loft test`, `loft test <name>` and `loft --tests <file>` all report nothing.
`probe/perf/fixture.loft` exists to give the sampler a program that does what a test does.


## ⏭ PICK UP HERE — plan 22, THE PAGES CLIENT, and it is the priority

**[#22](https://github.com/jjstwerff/moros/issues/22) · [plan](../../plans/22-pages-client/README.md)
· design [PAGES_EDITOR.md](PAGES_EDITOR.md).** A page you can open from `file://`, build a house
in, close, and reopen with the house still there — produced from **the same client the server
serves**, differing only in where a key press goes.

| | |
|---|---|
| the invariant | **the page is the editor with the AUTHORITY LOCAL instead of REMOTE** — not the editor minus a server. A server is coming back for scripts, multi-player and debugging, so this is a MODE, never a second renderer |
| ✅ `W1` | a world is BYTES — `world_to_bytes`/`world_from_bytes`, save and load are wrappers. `make parts` byte-identical, and `world_load` is **1.6× faster** |
| ✅ `P2` | `host_output` → our JS → `loftPush` round-trips inside a `--html` page. ⚠ **SPENT** — it existed to make `W5` buildable, and `P6` cancelled `W5` |
| ✅ `P6` | **a page has a FILESYSTEM, and a world saved in it survives a RELOAD** — http and `file://` alike, `make probe-p6`. 21 `fs_*` names against the design's **0 of 20**; the base tree reads as the interpreter's directory; `P6_SABOTAGE=persist` seen red. ⛔ **`W5` cancelled, `W3` retired, `P3` closed at under 2 % of localStorage** |
| ◐ `W4` | `hex_editor::press` — what a key means, in one place instead of **four**. `editor_run` and the server's `MSG_HOUSE` wired; `editor_client` and `script.mjs` still carry theirs |
| ✅ `R1a`/`R1b` | **the ring is reconciled.** The pose carries the ground under the feet (`au_y`), `press` rings at it instead of at `0.0`, and the ring's TRUNK is `sess.es_trunk` — the ninth registry — instead of four locals beside the socket |
| ✅ `R3` | `O`/`P` answer **`PR_SELECT`** — *an opening needs a profile, and nothing selects one yet* — instead of cutting the runner's material where the wire means a profile |
| ✅ `S0` | **the scene records go with the store they describe.** `9:` used to leave the previous world's cottage in the session, and `37:` hung a balcony on it |
| ✅ `S2a` | **the opening's CHOOSING is `hex_editor::opening_make`** — the sixth gesture the headless thread has taken out of the socket, and the one `S1` needed: an opening profile's only possible consumer is the opening gesture, which was not callable from a test |
| ✅ `S2b` | **the selection** — `es_open_kind`, `49:<kind>` to choose, and a bare `36:` cuts what is chosen. The admissible set is a PREDICATE, not a range: `5`, `15`, `25` and `30` are nothing at all |
| ✅ `S3` | **the six opening keys are one gesture** — `O P I U N M` reach `session_open_kind`, and pressing a key equals selecting-then-cutting in world AND session. ⚠ A key does **not** re-choose: `36:<kind>` does not either, and a key that did in one driver only would diverge under a green test |
| ✅ `V1` | **a key names a VERB.** `verb_of(key)` and `press_verb(…, verb)` beside an unchanged `press(key)`; six verbs — `raise` `lower` `place` `opening` `fence` `wall` — and all eleven keys driven through both layers, compared as **whole-world bytes** |
| ✅ `V2a` | **the server's `MSG_HOUSE` takes the verb** — the one caller with no profile to lose, so `press_verb` has a production consumer rather than only tests |
| ✅ `K1` | **a script says a VERB** — `verb <name>` and `select <kind>` in both readers, and the runner grew a **session read-back** because the world cannot see what a conversion loses. `make probe-verbs` |
| ✅ `K2a` | **the 18 opening presses are converted** — `select <kind>` + `verb opening` in 8 scripts, every other key untouched. `make probe-convert` |
| ✅ `V2b` | **`editor_run` resolves through `verb_of`** — the **last production caller of `press(key)`**. No equality could see the step; `probe/k1` check `G` can |
| ✅ `V3` | **`press(key)` is deleted.** What a key means is `verb_of` + `press_verb` and nothing else. ⚠ a green suite is the wrong instrument for a deletion — the **test-name diff** is |
| ✅ `B1a` | **the client's five one-to-one keys name VERBS** — `W4`'s fourth site, and `make probe-b1a` is the first check here that ever pressed a key in the client. 7 sentences and the saved world identical to a committed baseline; two sabotages red, each on a different instrument |
| ✅ `B1b.0` | **ONE world model** — `ε`/`θ` were declared in the server (10/4) AND the runner (8/3), under the runner's own comment saying they were the same. `hex_editor::WORLD_EPS`/`WORLD_THETA` now; `worlds/headless.hxw` moved to **exactly the md5 the pre-change experiment predicted** |
| ✅ `B1b.1a` | **the panel says which authority it has** — `ps_status` was a literal reading `connected`, set at panel construction before any socket existed, and it went on saying so with the server down. `authority_line(st)` over the client's one piece of evidence now, and the panel is told when it moves. `make probe-auth`: 15 checks over **three** situations, three sabotages each red somewhere different |
| ✅ `B1b.2c` | **THE PAGE DRAWS ALL ELEVEN SURFACES** — the mesher is `hex_mesh`'s, the server holds no copy (41 declarations and 1,744 lines gone), and `make probe-auth` says `grass` at boot and **`grass,wall`** after the rings. Four steps, because a dependency arrow stood in front of it: `c.1`/`c.2` the five primitives into `hex_proj`, `c.3` the 1342-line props mesher, `c.4a`–`c.4c` the deletion, the ramp and the page |
| ✅ `B1b.2` | **THE PAGE DRAWS.** A camera of its own, its own ground, and a re-mesh on write — 5 picture checks over 3 canvas regions. ⛔ Three instruments were blind before the page was, and one of them was found by a sabotage |
| ✅ `B1b.1b` | **THE AUTHORITY IS TWO.** No socket → the page edits its own world, and the status line says so. `make probe-auth` is 28 checks: the page and `editor_run` at `GROUND=0` agree on the **world** AND the **session**, and nine sabotages say which check sees what. ⛔ Its digest was a CRC32 first, and this format cancels one |
| ✅ `B2`=`B3` | **THE DEMO EXISTS** — `make pages` writes `_site/index.html` (the engine build, verbatim) and `make probe-demo` opens it from `file://` with no listener at either end. ⛔ Most of the step was cancelled by its first measurement: the engine already ran from a disk |
| ✅ `B2b` | **CONNECTIONS TO POTENTIAL SERVERS** — the socket URL is a LIST, and the extra candidates are DATA the build writes (`--servers`), never a compiled-in host. A demo opened from a DISK attached to an editor; two controls say the connection is real and the candidate is given |
| ✅ `B4` | **THE GOAL SENTENCE IS TRUE** — build something, close the tab, come back and it is there. `world_save` on the edit clock, `world_load` on the frame the authority moves. ⛔ Three finished parts (`W1`, `P6`, `M5b`'s pattern) and **no wire between them**; ⛔ and a safeguard of mine that `fall_step` already owned, which only its sabotage could say. [JOURNAL.md](JOURNAL.md) session 23 |
| ✅ `K2b` | **EVERY SCRIPT IN THE TREE SAYS A VERB** — 91 lines over 32 files, `make probe-k2b` comparing 31 scripts against their own pre-conversion selves on the world, the session, the bytes and the transcript. ⛔ The 32nd file was a script that is not a file (a **heredoc**), and the probe was red on all 31 before it was right, for two reasons that were both about the instrument |
| ✅ `K3d` | **EVERY LIVE SCRIPT HAS A RECORD OF WHAT IT BUILDS** — `make probe-k3d`, in `make fast`: rc, the world's md5, τ, chunks, the session digest, the selection, every sentence a gesture printed and every line the runner refused, per script at `GROUND=0`, against a committed baseline. ⛔ The debt's list of ten was stale **both ways** — what is RUN by nothing is **fourteen of thirty**, and eight of those are *named* in a doc, a plan or a test comment, which reads exactly like coverage. ⛔ And the world-key baseline the row asked for would have been blind: **`slab.keys` keys the world a bare `verb raise` keys**, because a slab is a session record — so the record is a PAIR plus the sentences. 8 sabotages red, 0 missed |
| ⛔ `K3g` | **FOUR SCRIPTS DO NOT RUN, AND `K3d` IS GREEN OVER THEM** — found 2026-08-24. Exactly **4 of 33** baselines record a **non-zero rc**: `bridge` `cave` `doorparts` `doorway` use `send 10:`, `send 44:` and `send 47:`, which `editor_run` does not implement, so each dies on *"N of M lines were not understood"* — and the crash was blessed as the expected state. ⚠ **It took a TOOLCHAIN changing the exit code of the crash to make it visible** (`rc: 101` → `rc: 1` when loft was reinstalled 2026-08-22, worlds byte-identical): the four rows went red for a reason that had nothing to do with the defect they were hiding. **A record that captures `rc` faithfully still reads as coverage when the `rc` it captures is a crash** — the fix is a rule that a baseline may not hold a non-zero `rc` without saying why. ⚠ And the same run found `make fast` had been **red since `H1e`** — plan 24's wall-quantiser change moved 10 baselines and nobody re-recorded them, so a landed step left the fast loop failing |
| ✅ `K3f` | **THE CAMERA SCRIPTS ARE CHECKED NOW — closed 2026-08-24.** The row below is what it said, and every word of it was true. Four scripts gained MEASURED bands and a gate each — `camera_ceiling` `camera_lamp` `camera_cutaway` `camera_eyes`, beside the existing `camera_indoors`. ⚠ **`frame` and `cam` each have a REPORTING form and a JUDGING one, and every row in all four was the reporting form** — an instrument with no verdict attached. ⛔ **And three scripts had a row with no `snap` at all**, judging the previous station's picture; in `lamp` those were the two FOLLOW rows the SNUG rows are read against, so the comparison that file exists to make had never been made once. What they establish: CUTAWAY takes the roof off (soffit 0.1941 → absent, grass visible from INSIDE, boom 2.152 → 6.990); EYES is first person (sky 1.00 up outdoors, soffit 1.00 up indoors, apart 0.959 against FOLLOW's 1.938); the head-lamp adds CONTRAST while taking light away (sd 0.0857 → 0.1255, lum 0.2706 → 0.1654); and ⛔ **`ceiling` REFUTES [CAMERA_INDOORS](CAMERA_INDOORS.md)'s "the roof has no underside"** — from inside there is no sky at all and the soffit is a quarter of the frame, because the client never enables backface culling. ⚠ **The `cam` bands are DISJOINT in pairs** (EYES < 1.3 vs FOLLOW > 1.6; FOLLOW indoors 1.8–2.5 vs CUTAWAY 6.0–8.0), so a mode that silently fell back keeps every picture plausible and still breaks one. Sabotage, each on a fresh server: CUTAWAY→FOLLOW **5 red**, SNUG→FOLLOW **6 red**, inside→outside **2 red**, all rc=1, and the gate surfaces it as `FAIL camera_eyes`. ⚠ **ONE SCRIPT PER GATE, AND THAT IS NOT TIDINESS** — measured: `indoors` re-run against a server that had already run it answers `apart 5.864` where a fresh one answers `6.095`, same commit, same script, a different world underneath |
| ⛔ `K3f` | **THE FIVE CAMERA SCRIPTS ARE CHECKED BY NOTHING** — found by `K3d`, and measured rather than suspected: `ceiling` `cutaway` `eyes` `floorprobe` `indoors` `lamp` leave the **same world and the same session, to the byte**, because everything after the house is `send 40:`, `send 3:`, `snap` and `frame`. ⚠ Only `indoors` has a check that can see a camera (`camera_indoors.mjs`); `cutaway`/`eyes`/`floorprobe` are run by `probe/k3c` row B, which asserts **rc=0 and nothing else** — they are that row's control — and `ceiling`/`lamp` were run by nothing at all. No headless baseline can be their check — `probe/k3d`'s `blindcam` row turns CUTAWAY into FOLLOW and requires the probe to stay green |
| ⛔ but | **`B1b.1`'s BOOT SWITCH could not be asked for** — `host_input()` BLOCKS with no host (measured, `probe/b1b/ask.loft`, `timeout 20` → rc 124), so *the page asks which authority it is* cannot be written. [loft#891](https://github.com/loft-lang/loft/issues/891) is **fixed and verified**; route 3 was taken instead — connect-or-local with the panel saying which — and it is built. ⚠ **The two ⏭ this row used to carry are both spent**: `B1b.2` landed on 2026-08-13 and `K3`'s *twelve keys with no verb* were all bound by 2026-08-15. What is next is **`T1`**/**`D1`** |

## ⏭ THE SPLIT'S ONE INVARIANT IS FALSE, AND IT IS ONE FILE — measured 2026-08-11

**`make probe-split`.** LAVITION_SPLIT.md says in bold that `src/editor_server.loft` has zero
Moros dependencies and that the program, its client, its gates and its content can all travel
together. **Compiled against a lavition-only `lib/`, it does not build.**

| | |
|---|---|
| ✅ already travel | the 7 lavition packages · `editor_client` · `editor_run` · `part_build` · `prop_build` · **all 53 gates** (21 name Moros, every one inside a comment) |
| ❌ **`src/editor_server.loft`** | `use moros_render;` — 6 names, **42** sites · `use moros_sim as msim;` — 10 names, 11 sites |

⚠ **`world_to_hex` IS 29 OF THE 42 AND IS NOT MOROS CODE.** Its body is `hex_grid::px_to_hex`; its
only Moros content is the **return type**, `moros_map::HexAddress`. `L3′` moved `hex_to_world`
into `hex_proj` and left its inverse behind, so `L6.3a` is mostly `L3′` finished.

⚠ **FOUR INSTRUMENTS WERE POINTED AT THIS AND ALL FOUR MISSED.** `tools/layering.sh` looped over
`lib/*/loft.toml` and **never opened `src/`** — the exemption shape by *directory* this time, which
is why the `moros_ui` / `moros_terrain` lesson did not transfer. An **alias** hid `moros_sim`
entirely from a survey that counted bare names, which is `L6.1`'s own finding unspent. The survey
refuted itself in one sentence (*"nothing else … **plus**"*) and the *"nothing else"* is what got
quoted forward. And `L3′` cured `world_to_hex` in the packages, where the check looks, while the
program kept 29 calls to it.

✅ **THE GUARD IS AT THE ARRIVAL NOW**: `PROGRAM_DEBT` in `tools/layering.sh` records the imports
**exactly** and fails in both directions — a new one is a regression, a removed one has to be
recorded as progress or the number rots. Four controls run. And the import is the right instrument
rather than the call site: `use moros_render;` is unaliased, so its 42 sites are **bare names** and
no `moros_render::` grep sees one of them.

⚠ **THE PLAN'S OWN INVARIANT TABLE HELD THIS PROBE ALL ALONG, ON THE WRONG STEP.** `L5`'s row
specifies it exactly — *"the 39 gates green with `lib/moros_*` deleted"*, negative control *"keep
one `moros_*` reference in the server and confirm the build fails"* — while the **phase** called
`L5` was *fix the gate flake*. The phase was done and the row went with the tick. **A control that
has passed trivially since the day it was written is the tell.**

⚠ **AND THE GATE HALF IS UNREACHABLE, NOT MERELY UNRUN.** Every one of those gates drives the
program that does not build, so the invariant's hardest clause is blocked on its easiest.

## ⏭ THE HEADLESS THREAD — where it stands, in five lines

`EditSession` (`lib/hex_editor/src/session.loft`) holds the eight registries the renderer needs
beside the store, the two-press draft, and a driver's pose. **The server holds one too** — the
same type, so the wire and a headless test cannot disagree about what a scene is. Five gestures'
CHOOSING moved with it (`prop`, `annex`, `slab`, `seat`, the wall run); each kept its sentence on
the wire and each verdict is byte-identical across the move.

**The pattern, for the next one:** move the choosing and the proportions, keep the sentence, prove
the wire unchanged, sabotage every new claim. **What is left in the server is transport** — the
dirty set, the client list, part mode's flags, and the pose (deliberately: a server has a walker,
a test teleports). The floor of the thread is the picture gates, which need a server by
construction.

⚠ **`es_author` IS A DRIVER'S POSE, NEVER THE EDITOR'S.** A test has no tick, so it teleports; the
server writes `px`/`pz`/`yaw` from its walker. Keeping a session author in step there would be a
second authority on where the author is.

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
10. **A stamp is LAST-WRITER-WINS, and overlap is order-free only in its occupancy.** Two
   stencils overlapping at the same level union their cells whichever way round they go on;
   the payload belongs to whoever went second. Measured, not argued (#5) — six labels and
   six heights differed. The design promised full order-freedom and was wrong to: painter's
   order is what makes "place this on top of that" possible. Both halves are gated,
   including the refuted one, so a future arbitration rule cannot land silently.
11. **A universal package must not be named for one consumer.** `tools/layering.sh` skips
   `moros_*` by design — a consumer may depend on anything — so `moros_ui` was exempt from the
   check that existed to catch it, for months. The name is what decides whether the arrow is
   enforced, which makes renaming a mechanism rather than a tidy-up. lavition's packages are
   `hex_*` for a hex data axis and `lavition_*` for the suite; a Moros prefix is a claim that
   the thing belongs to the game.
12. **A surface's colour is a measurement, not a taste.** The picture gates classify on
   CHROMATICITY, so two surfaces that differ only in brightness are one surface to every gate
   — `road` and `wall` sat 0.00009 apart inside a 0.0009 tolerance. Separate them in the
   RENDERER, never in the classifier: a classifier fix leaves the picture just as ambiguous to
   a person. And a neutral can never separate from another neutral.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.


## How to run things

### ⚠ THE HOT PATH IS `make fast`, AND IT STARTS NO SERVERS

```sh
make fast                        # layering + ALL 113 test files in parallel — 16 s
make fast P=hex_part             # one package (or several, quoted) — under a second
make check P=hex_part            # layering + one package the old way, interpreter only
make check P=hex_part G=part_bind   # …and the gates that cover it
make gate-one G="cache walk"     # just those gates, by bare name, either directory
make gate-rep  G="cache walk hipskin" N=5   # the SAME set, N times — the FLAKE HUNT
```

⚠ **`make fast` IS WHAT YOU RUN AFTER EVERY STEP.** 113 test files, one job per file:
**16.5 s** at 16 jobs (22.9 s at 8, 15.9 s at 24) against ~140 s for the same tests
serially. The parallelism costs nothing to buy — `loft test` over `hex_part` and the sum
of its sixteen files run one at a time agree at 35–39 s, so there is no per-file penalty.

⚠ **IT DELIBERATELY RUNS NO GATES AND ONE BACKEND.** A gate starts a server, waits for a
port and drives a world; a check you run after each step must not, and a check that takes
minutes is one you stop running. `make lib-test` stays the pre-commit proof across both
backends — loft#760 took `hex_voxel` from 114 green to 96 failed while `--native` passed
all 114 on the same source, so a one-backend green is a fast loop and not a proof.

⚠ **THE RUNNER WAS CHECKED AGAINST TWO THINGS IT MUST FIND**, because its default answer
is silence: a seeded failing assert, and a seeded compile error — which prints no
`test result:` line at all, so a missing line is a FAILURE here rather than a pass. That
is how a package that will not build otherwise reports as healthy.

⚠ **THE FULL SUITE IS 10–20 MINUTES AND IS A PRE-COMMIT CHECK, ONCE.** Using it to
iterate is how a session spends an hour proving what a one-minute run already showed —
`make check P=hex_proj` is **0.3 s**, and three contended repeats of three gates is
**2m54s** against ~60 minutes for three full suites.

⚠ **A FLAKE IS HUNTED WITH `gate-rep`, AND THE SET MATTERS.** Running the suspect gate
**alone** does not reproduce a contention flake — that is the *discriminator*, not the
test. `gate-rep` runs the named set together at `GATE_JOBS`, which is the condition the
flake lives in.

### ⚠ WHEN SOMETHING IS SLOW, GET THE NUMBER FIRST — there are three instruments now

```sh
loft --interpret --lib lib/ probe/perf/place_phases.loft   # a test's phases: fixture vs subject
cd lib/<pkg> && loft --lib ../ --tests tests/<file>.loft::<test_name>   # ONE test
GATE_VERBOSE=1 make gate                                    # per-gate seconds
# and in a running editor: 27:2 arms, 27:3 reports `id count us tau` per message
```

⚠ **`w_tau` BEFORE MILLISECONDS.** The edit clock is an exact integer, the same on any box
and on a world of any size; a millisecond figure measures the machine. The `27:` profile
carries both, and the pair is what separates *doing too much work* from *the work being
expensive*. ⚠ **And a COUNT before either** — a total cannot be read without one.

⚠ **DO NOT RE-DERIVE THE WRITE PATH.** Three hypotheses about why `world_set_column` costs
0.45 ms were each refuted by their own probe (12 % for both O(1024) scans together; a 0.09 ms
floor). `probe/perf/README.md` has the numbers and the one disagreement still unresolved.

```sh
GATE_JOBS=4 make gate  # ⚠ 40 gates, SILENT when green. THE DEFAULT IS 10 AND THAT FLAKES:
                       #   each gate starts a server that interprets a 5,900-line file, the
                       #   wait for `listening on port` is 60 s, and one gate alone takes
                       #   2 m 33 s. Measured: 10 of 35 failed at 10 jobs and the SAME suite
                       #   went green at 4 jobs on a HIGHER load. GATE_VERBOSE=1 for timings
make lib-test          # all 18 packages, BOTH backends; goes red properly
make parts             # build data/parts/*.hxw from the gestures, and VERIFY them
make guards            # the S3 probe suite, and it DRAWS the guard's decisions
make camera-frame      # the camera's stations by hand, with the pictures
make client            # ⚠ the wasm client is a FILE the server serves — every editor
                       #   target now depends on this, but a hand-run server does not
make stop-editor       # ⚠ after anything that started a server
cd lib/<pkg> && loft test

# a scratch program. ⚠ NO `--path ../loft/` — the installed loft bundles its own
# stdlib, and pointing at the sibling's `default/` builds against a tree that is
# being edited live. That is how `chr` turned this tree red for an hour.
loft --interpret --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.

### ⚠ `make gate` FLAKES, and every face of it says *nothing happened* rather than *the wrong thing happened*

**`GATE_JOBS=4` is the knob, and it is not the load average.** Measured: **10 of 35 failed at
`GATE_JOBS=10`**, and the *same suite* went green at **4 on a HIGHER load** (26 → 40). It also
failed at load ~4 and passed at load 33 earlier the same day, so *check the load first* was never
the rule. ⚠ **And 4 is not immune** — the discriminator is to **run the one that failed alone**,
at `GATE_JOBS=1`.

| the face | what it looks like | what it is |
|---|---|---|
| **the wait** | `SERVER NEVER LISTENED` | a 60-second wait for `listening on port` while `GATE_JOBS` servers each interpret a 5,900-line `editor_server.loft`. One gate alone takes 2 m 33 s, nearly all of it startup |
| **the empty compare** | `FAIL cache … {"agree":0,"bad":24,"layers":0}` | **no layers ever arrived**, so nothing was compared. Reads as a measured disagreement; is a startup miss. ⚠ A `cache` failure whose `layers` is **0** is always this, whatever the job count |
| **the still simulation** | `walk`/`hipskin` at `{"frames":1,"bodyMoved":false}`, or `{"frames":0}` | one frame, or none, in the whole run — the simulation never ticked while four interpreted servers shared the box. Both passed alone in 12 s and 8 s |
| **the cold cdylib** | ⚠ **only after a loft install** | each gate rebuilds a **Rust** cdylib inside its own 60-second wait: `cdylib loft_web rebuilt: cached artifact rejected (stamped loft-ffi fp=none != current fp=…)`. First run on a new toolchain was 25 pass / 2 fail / **14 never listened**; the second, nothing changed, was 40 of 41 |

⚠ **WARM THE TOOLCHAIN ONCE AFTER ANY LOFT INSTALL** — start one server, let it build, stop it —
then run the suite. A first run on a fresh toolchain measures the compiler's cache, not the tree.
This is the **last** cold-cache trap standing; the `native-auto` half of it went with loft#777.

⚠ **AND ONE FACE OF IT WAS OURS, NOT THE RUNNER'S.** `part_fence` and `part_check` passed alone
and failed at `GATE_JOBS=4` because they waited a **fixed** 1.8–2.5 s for an acknowledgement
rather than polling for it — a gate that sleeps reports the machine. Ack-driven, they are also
*faster* when the box is idle: 58 s → 21 s and 34 s → 11 s. **Write a new gate that way.**

⚠ **STAMP `sha256sum /usr/local/bin/loft` AT BOTH ENDS OF A SUITE RUN.** `loft --version` says
`2026.8.0` for every build — six landed in eleven hours once — so the version string cannot tell
two installs apart and a run that finished on a different binary than it started on is not a
result. ⚠ **And capture the exit code on the line AFTER the command**: adding the stamp between
`make gate` and `echo "GATE rc=$?"` made `$?` report the *stamp's* status, printing `rc=0` over a
run whose log ends `Error 123`.


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


## Lessons worth carrying forward

Craft findings that outlived the session that produced them. The *working rules* — how this
tree is worked — live in [CLAUDE.md](../../CLAUDE.md); these are what the code and the gates
kept teaching.

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


**D. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**E. Parity is where this codebase breaks.** Five separate bugs now, all the same shape: right
for non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, negative indices that wrap rather than fail, and (2026-08-03)
`html/hex-lattice.js` shifting no odd row below zero because `-1 % 2` is `-1` in JavaScript.
When touching the lattice, test **both parities and both signs**.

⚠ **The fifth one is the argument for the instrument, not for more care.** It sat in a file
whose header already says "one home for the lattice" and whose test suite already re-derived
its direction tables from the geometry — and it still shipped, because every test used
non-negative rows. What found it was the **cross-language fixture** (#3): one file both
implementations read, covering both signs. Care does not scale; a fixture that spans the
seam does.

**G. A COUNT IS NOT A PICTURE, AND A PICTURE IS NOT A COUNT** — five times in one session,
in both directions. Nine swatches "rendered" and none drew (a count of draw calls is not a
count of pixels). Nineteen columns copied and two read back empty. A part cell holding a
neighbour's height while every total agreed. And the other way: a status strip 2.7× too small,
and two labels overlapping, neither visible to any count and both obvious in the frame.

⚠ **The instrument follows from which one the claim is about.** *"It drew"* is a picture;
*"it drew the RIGHT thing"* is usually a number; *"nothing was lost"* is a number the picture
cannot supply. When the two disagree, suspect both — and when only one exists, that is the
finding.

**H. A gate instrument is blind until something it should reject is fed to it.** Three were,
this session, and each looked reasonable: a luminance BAND counted 824 "dim" pixels where
nothing was greyed, because anti-aliased edges land in any band you pick; a single sample
COLUMN read six buttons as thirteen fragments once labels were drawn on it; and
`[].every(…)` is `true`, so a row reported `ok` on a picture with no panel at all. ⚠ **The
fix is a discriminator taken from the SHAPE** — a per-row peak, a bar's height, a count
alongside the predicate — because a threshold tuned to today's colours dies at the next
restyle.

**F. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.

---

## The record

How this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the per-session entries,
the numbered item log, and the superseded planning sections. ⚠ Read a dated claim in it as
dated, and ⚠ **its Sessions 20–26 WERE thinned on the way out** — see the exception below. **Sessions 10–12** are the
arc from *a part is a world* to *a part with joints, a hinge and a mesh*; **session 13** is the
door on screen, §P9 argued out, and six loft installs in eleven hours.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. It reached **785** across
sessions 10–12 and came back to ~400 on 2026-08-04. It reached **907** in session 13 and came
back to ~500 on 2026-08-06. **When a session ends, its entry moves out** — the handoff describes
the present, and the record keeps the past. Moving is not thinning: a finding that cost a day is
worth more than the lines it takes, which is why nothing is ever deleted on the way.

⛔ **AND ON 2026-08-21 THAT RULE WAS BROKEN ON PURPOSE — READ THIS BEFORE THE NEXT CUT.** The
file had reached 4,467 lines. 08-12 … 08-19 was **reconstructed** into JOURNAL Sessions 20–26
rather than moved — the entries were written *from* these sections and are thinner than them —
and plan 17's 535 lines, the gates section and three landed-plan sections were **deleted**
outright against the plan READMEs that already carried them. 4,467 → 630.

⚠ **THE JUSTIFICATION, AND IT IS A TRADE RATHER THAN A FREE MOVE:** a handoff nobody finishes
reading costs more than a detail nobody looks up. Every design finding was checked to have a
durable home before its section went — the table under *THE SESSIONS THAT WERE HERE* names
each one. What is gone is the *reasoning* behind individual steps, and it is gone one-way.

⛔ **WHAT IT COST, MEASURED RATHER THAN ESTIMATED: TWO LIVE GUARDS, AND THE SECTION BELOW
PREDICTED BOTH.** A `B4` row pointing at *the section above* went dangling, and
**`### Built and not yet called` was deleted entire** — a standing list of this tree's
commonest defect, which survives only because a read-back of the thinned file went looking for
what was missing. It is restored and re-verified at the top of this file. ⚠ A sweep of every
other thinning in this repo's history found **no** guard lost anywhere else: the only ones
were mine, in these two cuts.

⚠ **SO THE RULE STANDS AND THE EXCEPTION IS NAMED.** If the file grows again, MOVE. If it is
cut again, read every section before removing it — a cut by date missed 535 lines of the same
thing, and a cut by section still took a guard out of the middle of one.

⚠ **AND EVERY TIME, MOST OF WHAT GREW BACK WAS ALREADY WRITTEN DOWN TWICE.** The 447 lines moved
out on 2026-08-04 were per-step findings that `plans/17-parts/README.md` already carried, section
for section; the ~400 moved out on 2026-08-06 were the same thing plus a 110-line restatement of
[PARTS.md §P9.0](PARTS.md#p90--the-design-in-one-place). A handoff that repeats the plan is a
handoff nobody can skim — so when a step lands, its finding goes in the PLAN, and this file gets
only what a reader needs whichever step they pick up next.

⚠ **AND OPERATIONAL KNOWLEDGE WAS THE THING THAT NEARLY WENT WITH IT.** The gate flake's four
faces and *warm the toolchain after a loft install* were written inside a dated session narrative,
so moving the narrative would have taken them too. They are not a record of a session; they are
how you run the suite. **Before moving a block out, ask of each ⚠ in it: is this what happened, or
is this how the tree works?** The second kind goes to *How to run things* or *What bites*, never
to the journal.
