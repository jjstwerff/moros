# STATE.md — where the editor work stands (2026-08-06)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — thirteen sessions, newest first |

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**. ⚠ **The per-STEP record belongs
to the plan** — `plans/<n>-<name>/README.md` carries a *What `Ax.y` turned up* section written
when the step landed, and this file duplicating it is how it grows back.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⏭ PICK UP HERE — plan 17 `A8` is COMPLETE; the headless thread has five gestures off the socket

**Session 14 (2026-08-07/08) is in [JOURNAL.md](JOURNAL.md)** — what it found, in full. What is
true *now*:

| | |
|---|---|
| **plan 17** | `A1`–`A7.3` and **all of `A8`** are built. Two rows are ◐ and both need something other than code — see below |
| **the headless thread** | `prop`, `annex`, `slab`, `seat` and the wall run moved into `hex_editor`; the server's scene state IS an `EditSession`; `tests/session.loft` is 31 tests over nine gates'/scripts' claims with no port |
| **the user's standing redirect** | *"where possible I want tests outside the server"* — still the thread, and its floor is now the picture gates, which need a server by construction |

⚠ **TWO THINGS ARE WAITING ON THE USER, NOT ON WORK.**
1. **`A8.3`'s acceptance is a cold-recognition test** — *does a person call it a door*
   (`shots/a83-door-{w,sw,s}.png`, regenerate with `tools/scripts/doorway.keys`). My own read is
   that it does **not** yet: a cell leaf is the same height and the same grey as the wall it hangs
   in, because the per-edge fallback has one wall height and one wall colour. That wants an
   `Opening` profile in the part format or a per-part wall height — a format question.
2. **`A8.6`'s return half is blocked on a gesture nobody wrote**: nothing authors a `MESH` section,
   the same gap as *no gesture can author a `FITS`*. Both want a plan rather than a step.

⚠ **AND THE STALE-CHUNK ISSUE'S CAUSE IS WITHDRAWN, ITS SYMPTOM IS NOT.**
[OPEN_ISSUES](OPEN_ISSUES.md) said `raise_ahead` walks a RAY; it brushes a **disc** of radius 7 at
the peak and the handler marks a disc of radius 9 at the same centre, so the mark contains the
write. The 22-of-48 measurement stands. **Next step there is the instrument, not a fix** — re-run
`A7.3a`'s comparison and see whether it still reproduces.

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

## ⏭ AND THE GATES — 1838 s → 741 s, with the hot path taken off them entirely

⚠ **THE USER'S SECOND REDIRECT, 2026-08-06**: *"go at the gates instead"*, then *"they can
run on CI that's fine but not on the hot path we use for after each step we build"*, then
*"photographs should never be automatically taken, but requested in the testing script as
specific ticks"*, and the standing one — ***"where possible I want tests outside the
server"***. The last is the open thread; everything else below is landed.

✅ **TWO WAITS THAT COULD NEVER SUCCEED WERE 71 % OF THE SLOWEST GATE.** Profiled per
command (`camera_indoors`, 247 s, 99 % accounted): `frame` 12× at 8.5 s = 41 %, `snap` 8×
at 8.3 s = 36 %, `step` 12× at 2.7 s = 13 %, and 15.2 s before the first command. Only the
`step` rows were work.

- **`nextT()` waited for a `T:0;` body frame**, which the server broadcasts only `if
  moved`. Nothing has been asked to move at that point, so it ran its full 15 s and
  returned `false` into a discarded return value. **15,185 ms on an EMPTY script.** It is
  correct at its other four call sites, inside `hold`.
- **`browserLag()` interrogated a page that does not exist.** It branched on `--client`:
  without it, it read `parts.size` and `view` — globals of `html/editor.html`, ⚠ **deleted
  on 2026-08-02** when `/` became the wasm client. So `settle()` never fired and every
  `snap` and `frame` burned its full 8 s. Its own comment — *"a sleep here would be the
  same mistake as the `sleep(4000)` this replaced"* — was describing itself.

⚠ **THE CONTROL IS THAT THE HISTOGRAM DID NOT MOVE**: `subject 0.0188, grass 0.5873, sky
0.3615` before and after. Only the *probe* changed — `WIN` and `CANVAS` still follow
`--client`, because they decide the window size and the clip, and this tree already
measured what that costs (`grass 0.5336` against `sky 0.7734` for one scene).

✅ **AND A PHOTOGRAPH IS NOW TAKEN WHERE THE SCRIPT ASKS FOR ONE.** `frame` took its own
screenshot, so a `snap` and the `frame` beside it photographed one instant **twice** and
the PNG on disk was never the frame that was judged. `snap` is the only camera now;
`frame` judges what it took and fails loudly if anything moved the world since. Checked
both ways: judged row identical, orphan row `rc=1`.

| | before | after |
|---|---|---|
| `camera_indoors` | 240 s | **74 s** |
| `cache` · `client_mesh` · `cellar_ceiling` · `deck_soffit` | 201 · 206 · 159 · 114 s | **49 · 37 · 50 · 27 s** |
| **44 gates, sum of work** | **1838 s** | **741 s** (188 s wall at 4 jobs) |

⚠ **AND RUNNING THE GATE SERVER NATIVELY DOES NOT HELP — measured, and it was the first
hypothesis.** `camera_indoors` is 240 s interpreted against **248 s native**, identical
rows; a light gate is 5.4 s against 5.7 s. Startup alone is 6 s against 3.5 s, so a
pre-built native runner is worth ~110 s across the suite and nothing more. `GATE_LOFT`
already exists if that is ever wanted. **The server was never the bottleneck.**

✅ **AND THE STRUCTURAL AUDIT IS DONE — all 44 gates are classified, and the answer was
not the expected one.** Seventeen carried no declaration; auditing them by *what the
verdict asserts* rather than by what the header says found that **most were already
thinned** and only the declaration was missing. Nothing needed moving out; what was
missing was the sentence saying it had been. The classification and its discriminator
now live at the top of [`tools/run-gates.sh`](../../tools/run-gates.sh), where a reader
of the gates starts.

| the verdict reads | what that makes it | examples |
|---|---|---|
| acknowledgement strings only | a **wire** gate — the rule is a loft test, this is the gesture reaching it | `fence`, `field`, `storey` |
| the store, via `26:`/`15:` | a claim that **could** move — three are kept, each for a stated reason | `doorstep`, `part_inst`, `part_mode` |
| a file's bytes | disk **routing** after a gesture, and null-edits | `part_save`, `part_check`, `part_new` |
| the emitted mesh or a picture | needs a server **by construction** | the five browser gates, `part_mode` |

⚠ **TWO GATES CLAIMED MORE THAN THEY CHECKED, and that is the hazard this audit is
for.** `vegetation` argues four properties and judges three — two moved to
`hex_editor/tests/field.loft`. `cart` argues the wheel law while its verdict is
`grounded && banked && bankSigned`; the law is eleven tests in
`moros_sim/tests/cart_as_data.loft`, several bit-identical. **A header describing
coverage that has already moved is worse than none**: the next person to thin the file
would be thinning something already gone. Both headers now say what is true.

⚠ **AND A FIXED WAIT IS RIGHT WHEN THE CLAIM IS AN ABSENCE.** Everything else polls for
evidence, because a gate that sleeps reports the machine — but *an unchanged library
sends nothing in 4 s* and *a refused toggle sends no `H:` at all* have no event to wait
for. There the window **is** the instrument.

✅ **AND THE SERVER COUNT WAS THE LAST THIRD — TAKEN, BUT NOT THE WAY IT LOOKED.** The
idea was to *share* a server across gates. Probed first, and the probe killed it by
removing its reason: startup was 5–6 s because the server was **interpreted**, not
because starting one costs that. Exec'ing the already-compiled binary reaches *listening*
in **217–273 ms**, and **nothing is shared** — each gate keeps its own process, port and
`EDITOR_PARTS`, which is exactly what sharing would have cost. (Sharing cannot work as
posed anyway: `EDITOR_PARTS` is read at server start, so one server is one part library,
and `part_save`, `part_new` and `library` all mutate it.)

| 44 gates | work | wall at `GATE_JOBS=4` |
|---|---|---|
| start of the thread | **1838 s** | ~6 min |
| after the dead waits, photographs and sleeps | 655 s | 168 s |
| **now** | **483 s** | **126 s** |

⚠ **THE FIRST FULL SUITE THIS WAY WAS 7 GATES RED, AND EVERY VERDICT LIED ABOUT WHY.**
`cache` and `client_mesh` reported nothing; `camera_indoors` and `deck_soffit` came back
`subject 0.0001` — a near-empty frame; `persist` failed both its acks. They read as
rendering and streaming defects and were **one thing**: a compiled loft program roots its
relative file I/O at **its own directory's parent**, baked in at compile time. From
`src/.loft/cache/` that root is `src/.loft/`, so shots, recordings and saved worlds went
nowhere — the server log said `cannot create …/src/.loft/cache/../shots/shot-1.txt —
write skipped` while the gate reported a blank picture. ⚠ **Neither `--project` nor an
environment variable overrides it**; both measured, both ignored. The cure is a copy at
`.gatebin/server`, one level under the repository — ⚠ **and the client page has to travel
with it**, because `read_client()` reads `{source_dir()}/.loft/editor_client.html` and
`source_dir()` follows the binary: the server served its own 404, 178 bytes instead of
2.3 MB, and the browser drew nothing. **A missing FILE wearing a renderer's clothes,
twice.**

⚠ **THE STALE BINARY IS THE FATAL CASE, AND IT IS CONTROLLED RATHER THAN ASSUMED.**
Measured first: with the source edited to answer `placed 0,0 STALEPROBE`, exec'ing the
cached path still answered `placed 0,0` — a green suite against yesterday's server.
loft's cache is content-addressed **and self-cleaning**, so the build runs once in
`run-gates.sh` before anything fans out and is **never skipped on a timestamp guess** — a
heuristic standing in for a content hash admits exactly that silent failure. Re-checked
end to end after the copy step existed: source changed → `fence` FAILS carrying the new
string and `.gatebin/server`'s md5 moves; reverted → PASS again.

⚠ **The gates now exercise the NATIVE server** where they used to exercise the
interpreted one. That is closer to what ships — `make play` is native — and
`camera_indoors` measures identical rows on both. `GATE_LOFT=--interpret` puts the old
path back in one variable.

⚠ **AND `G1`(b) REFUTED A SENTENCE OF ITS OWN DESIGN.** *"If synthesising a column is not far
cheaper than reading a stored one, there is nothing here"* — measured over 102,400 reads each
way, an absent-chunk read is only 1.1–2.1× cheaper (`world_surface` 1103 ns stored against 947
absent). **The sentence is wrong, not the design**: GROUND_DEFAULT removes the *write*, not the
read, and the read only has to be **not dearer**. ⚠ Which moves the design's real cost to `G6`,
where it was not priced — an infinite ground plane means the mesher builds chunks it skips today.

⚠ **THE SUBSTITUTION IS EXHAUSTED — SWEPT, SO DO NOT SWEEP IT AGAIN.** A scanner over every
`.loft` for a `world_set_column` inside a loop: the four that mattered are done, and what is
left is worth **under half a second**. ⚠ **`hex_editor`'s fixtures were already on the fast
path** — `ground_set` → `layer_write` is `world_set_cell` — so there is no second `G3` there.
⚠ **And `gesture.loft`'s remaining column writes must not be touched**: they pass `co_ids` to
insert a *named* layer, which is the one thing `world_set_cell` cannot do.

| where the suite time is now, per package, interpreted | |
|---|---|
| **`hex_editor` 56 s** | 235 tests, **flat** — 23 files from 1.4 to 5.4 s, no fixture dominating. It is real work, not another `place.loft` |
| **`hex_part` 35 s** · `moros_sim` 24 s · `hex_world` 7.6 s · `moros_render` 7.3 s | the other six packages are under 3 s each |

⚠ **A per-file loop is a fair instrument** — `loft test` over `hex_part` and the sum of its 16
files run one at a time agree at 35–39 s. A first reading suggested a 5× package-mode penalty;
it was drift.

| still true, measured 2026-08-06 | |
|---|---|
| nothing about the harness is slow | 2.2 ms marginal per test; `lavition_ui` runs 65 tests in **447 ms** |
| compile tracks the **dependency cone** | `lavition_ui` 20 ms · `hex_world` 119 ms · `hex_part` 492 ms · `hex_editor` 1.28 s · `hex_mesh` 1.46 s |
| gates — ✅ **taken, see below** | 44 gates were **1838 s** of work and are now **741 s**, 188 s wall at `GATE_JOBS=4`, 44 PASS / 0 FAIL / 0 never-listened |

⚠ **THREE HYPOTHESES ABOUT THE WRITE PATH WERE EACH REFUTED BY THEIR OWN PROBE**, so do not
re-derive them: the step-4 window scan is worth 3 %, step-6 elision 6 %, **both together 12 %**,
against a **0.09 ms floor** for a call whose body does nothing. A calibration says those scans
should cost more than the whole write, and that disagreement is **unresolved** —
`probe/perf/README.md` has it. ⚠ **`G1` did not resolve it and did not need to**: the in-place
write skips both scans *and* the column machinery around them, which is why it wins 17× where
removing the two scans alone won 12 %. ⚠ And the first version of that measurement printed `0 ms`
for everything because `now()` returns **milliseconds** and was divided by 1,000,000 — the same
unit trap that made `G1`'s first read column print `0 us`.

✅ **THE EDITOR CAN NOW SAY WHERE A MESSAGE'S TIME GOES** — `27:2` arms a per-message profile,
`27:3` reports `id count us tau`. [WIRE_PROTOCOL § `27:`](WIRE_PROTOCOL.md). It carries `w_tau`
beside the microseconds because the edit clock is exact and a millisecond figure measures the box.
Checked in both directions before being believed (`probe/perf/profile_*.mjs`).

## Plan 17 — **`A8` is complete**; two rows are ◐ and both wait on the user

**Green as of 2026-08-08** on loft `9f416d7c`, hash stamped at both ends of every stage:
`make gate` **45, rc=0** · `make lib-test` **22 of 22** (11 packages × both backends) ·
`make fast` 117 files · `make parts` green, `data/parts/` byte-identical · layering and
`names.sh` silent.

| `hex_editor` **266** | `hex_world` **120** | `lavition_ui` **65** | `hex_part` **277** |
|---|---|---|---|
| `moros_sim` **310** | `moros_render` **167** | `moros_map` **92** | `moros_editor` **56** |

⚠ **THE TOOLCHAIN WAS REPLACED THREE TIMES IN ONE SESSION and only the stamp said so** —
`4c93f40e` → `6ef016ba` → `9f416d7c` on 2026-08-07/08. `loft --version` says `2026.8.0` for every
build, so the version string cannot tell two installs apart. **Stamp `sha256sum
/usr/local/bin/loft` at both ends of every suite, and warm a new binary** (`make client`, then one
server up and down) before believing anything. ⚠ **And capture the exit code on the line AFTER the
command** — a stamp between `make gate` and `echo "rc=$?"` reports the STAMP's status.

### What to do next

**The per-step record is [plan 17](../../plans/17-parts/README.md)** — every `Ax.y` carries a
*What it turned up*, and `A8.2b`–`A8.7`'s are the newest. **The session narrative is
[JOURNAL.md](JOURNAL.md) § session 14.** What is not in either, because it is a decision rather
than a record, is at the top of this file: `A8.3` needs the user's eyes and `A8.6` needs a gesture
nobody has written.

### Plan 19 — `L1`–`L5` done or raised, `L6.1` built; only `L6.3` waits for `A8`

[#19](https://github.com/jjstwerff/moros/issues/19) · design
[LAVITION_SPLIT.md](LAVITION_SPLIT.md) · steps
[plans/19-lavition-split](../../plans/19-lavition-split/README.md). The MOVE is **blocked on `A8`
landing**, for hexbody's reason: `MeshAt` is changing shape right now. The corrections are not.

✅ **`L1` AND `L2` ARE DONE (2026-08-06).** `hex_world::Surface` → **`SurfaceAt`** (the tree's own
`MeshAt`/`SocketAt` convention for a derived positional record), so the silent merge with
`moros_terrain::Surface` is gone — the negative control produced its five *"Unknown field
`Surface.sf_r`"* errors first. And `moros_terrain` → **`hex_mesh`**, with `layering.sh`'s default
flipped from *exempt by pattern* to **checked, with a named `CONSUMERS` list** — because the skip
was the other half of the mechanism, not the name alone.

⚠ **`L3` WAS WRONG AND ITS OWN PROBE SAID SO.** *"Swap the three lattice calls to `hex_grid`"* —
except `hex_to_world` **already calls `hex_grid::hex_to_px`**, and `mr_corner_offset`'s six corners
already come from `hex_grid` with a `(6-i)%6` map every call site compensates for again. They are
the **3-D projection**, not the lattice, and `HEIGHT_SCALE` alone has **83 uses in
`editor_server`**. A naive swap would have rotated every corner and dropped every height **with
every count agreeing**. Replaced by `L3′` — a small `hex_proj`, because the obvious fix is already
a reverted experiment (`moros_sim` inherits `hex_editor`'s cone and dies on `Cannot redefine
'fabs'`). Until then the debt is `KNOWN="hex_mesh:moros_render"` in `layering.sh`, **printed every
run** with its reason.

✅ **AND `L3′` LANDED THE SAME DAY.** `lib/hex_proj` holds the projection — `HEIGHT_SCALE`,
`hex_to_world`, `hex_corner_world`, the corner map — on `hex_grid` + `graphics` and nothing else,
because **both obvious homes were already-failed experiments** (either direction pulls
`hex_editor`'s cone into `moros_sim`). `layering.sh` is now silent with `KNOWN=""`: **the lavition
stack has no Moros dependency at all**, for the first time.

⚠ **ADDING A PACKAGE INVALIDATES THE BUILD CACHE LIKE A LOFT INSTALL DOES** — the first suite after
`hex_proj` gave 3 `SERVER NEVER LISTENED` plus the `walk`/`hipskin` pair; **one warm server took it
to zero.** The warm-up rule above is written for an install; it applies to a new package too.

✅ **AND `L4` IS RAISED — [`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13),
with an 8-control probe behind it** (`probe/l4/run.sh`). **Theirs keeps `hex_world`; ours becomes
`hex_voxel`** — not on merit (ours is 2,041 lines to their 400) but on possibility: they have
published three versions since 2026-06-14 and loft's **own test suite** consumes them, so theirs
is the rename that cannot be done. ⚠ **And the package rename says nothing about the types.**
Four public names are declared by both. The two `World` structs do **not** merge — but a **bare**
`Chunk { … }` binds to whichever package was `use`d **first**, and `G`'s error is
`Unknown field Chunk.ck_cells`: the `Surface` diagnostic of `L1`, verbatim, one rename later. So
`L6` renames `World` and `Chunk` too, before publishing, because after is never.
Two loft defects fell out — [#788](https://github.com/loft-lang/loft/issues/788) (the order-
dependent name) and [#789](https://github.com/loft-lang/loft/issues/789) (the suggester reading
the registry index, advising `use hex_world;` on a file that has it).

✅ **AND `L6.1` IS BUILT — [`tools/names.sh`](../../tools/names.sh), the public-name check the
design has listed since it was written.** A public name is global, and a bare one binds to the
first `use` (loft#788), so the check runs over the *graph* — which is the thing no package suite
can see. ⚠ **Its first run found a live defect with nothing to do with the split**:
`editor_server.loft` imported `moros_map` and used **none of its 81 names**, the import's only
effect being to shadow `hex_distance` with the AXIAL copy whose sheared discs the file's own
comment already records — 34 boundary edges where a hex disc has 30, wrong for the road, the
scatter, the storey and the house footprint. It is gone; the qualifiers stay because they say
which lattice is meant. ⚠ **`gridmesh` and `hex_world` both declare `chunk_of`, and `gridmesh`
won in the server while `hex_world` won in the client** — same two packages, opposite answers,
decided by the `use` order alone. Both aliased now. Also `hex_part`'s duplicate `hex_dist`
deleted, and `fit_text`→`fit_why`, `Rect`→`UiRect`, `chunk_of`→`world_chunk_of`.

⚠ **THE INSTRUMENT WAS WRONG THREE TIMES FIRST, AND THAT IS WHY THE LIST IS SHORT.** An aliased
import exposes **no** bare name (measured); a method resolves by **receiver** (`server` declares
`close` twice by itself); and the replacement name I first picked, `fit_reason`, was refused by
the tool because the registry's `hex_fit` publishes one. ⚠ **That last one is a finding**:
`hex_fit` *is* a doorstep, field for field with `hex_editor::Fit`, and whether they converge is
now an open question on the plan rather than a spelling.

**What is left**: `L6.2` (the `hex_voxel` rename — **not blocked**), then `L6.3`–`L8`, which wait
for `A8`. ⚠ **The gates have not been run since `L6.1`** — a new dependency edge invalidates the
build cache exactly as a new package does, so they need a warm-up first.

✅ **AND `L5` — THE GATE FLAKE — IS FIXED, so a required PR check is now possible.** Three gates,
two bugs, neither a timeout that wanted raising:

- **`cache` read the FIRST value of a running verdict.** The client re-answers on every `D:`
  digest and its first answer is `agree 0 bad 24 layers 0` — nothing cached yet. ⚠ The `last`
  verb's own comment already described this class and `clientmesh.keys` had already learned it.
  New `until <prefix> <field> <op> <value>` verb waits for the evidence and **fails saying what it
  did see**; the gate now reads the LAST match, not the first (`String.match` without `/g`).
- **`walk` and `hipskin` slept on the WALL CLOCK, which measures the machine.** Under four
  interpreted servers 1700 ms delivered one frame instead of 44. They advance on **frames
  received** now — the very quantity the verdict is computed from.

⚠ **AND A TRANSFORM ONLY ARRIVES WHILE THE BODY IS MOVING**, which the first fix did not know: a
count taken *after* releasing `W` can never be reached. Hold until the evidence exists, then
release and judge together.

**Evidence: 4 consecutive clean full suites** (44, rc=0, zero failures, zero never-listened) plus
3 contended `gate-rep` runs. ⚠ **And gathering it that way was itself waste** — see the fast path
under *How to run things*: three contended repeats answer in **2m54s** what four full suites took
~80 minutes to say.

### What plan 17 is still short of, and it is one thing

✅ **A BOUND LEAF WHOSE BODY IS CELLS IS DRAWN, as of `A8.2`** — the display path meshes the part's
own chunks with `part_body_meshes` (shared with the thumbnail) and poses each surface; `A8.2b` adds
the scale, so one authored at a finer unit is shrunk to fit its opening. ⚠ **Still true: no gesture
can author a `FITS`**, so a cell-bodied leaf that fits a socket cannot yet be made from the editor
at all — every one in `data/parts/` was written by `src/prop_build.loft`.

⚠ **`A5.2`'s ACCEPTANCE IS A COLD-RECOGNITION TEST AND NEEDS THE USER'S EYES**: *does a person call
it a door.* Render it and hand over the picture; do not claim it from a green suite.

### ⚠ The per-step record is in the PLAN, not here

[plans/17-parts/README.md](../../plans/17-parts/README.md) carries a **What `Ax.y` turned up**
section for every step — the findings, the controls, and what each sabotage cost. This file
carries only what is true *now* and what bites regardless of which step you pick up. The arc's
narrative is [JOURNAL.md](JOURNAL.md); **session 13 is its newest entry.**

⚠ **THIS FILE GROWS BACK, AND IT HAS THREE TIMES.** 2,446 lines → split to a handoff; 785 across
sessions 10–12 → ~400; **907 at the end of session 13 → ~300 here.** Every regrowth was the same
shape: per-step findings the plan already carried, and a session narrative that belongs in the
journal. **When a session ends, its entry moves out.** Moving is not thinning — nothing is ever
deleted on the way, which is why the journal is 3,000 lines and this is not.

### ⚠ What bites regardless of which step you pick up

⚠ **READING A STRUCT FIELD ALIASES; READING A PLAIN LOCAL COPIES** — loft#774/#775, and it bit
again on 2026-08-08. `held = sess.es_roofs` shares its vector with the live one, so clearing the
live registry emptied the held copy and part mode restored nothing: *6 of 440 surfaces differ*.
`held = sess` (a whole local) copies. **When you hold something aside, hold the OWNER, not a
field of it.**

⚠ **A TYPE MUST BE DECLARED BEFORE THE STRUCT THAT DEFAULTS TO IT.** A `DraftStep` holding
`RunDraft = RunDraft {}` inserted above `RunDraft` gives *Undefined type RunDraft* — and then
twenty-four test files failing on types that were fine, because a parse error in `gesture.loft`
takes every consumer's types with it. No forward references.

⚠ **A RAISE LANDS TEN HEXES AHEAD OF THE AUTHOR** (`peak_cell`), and a stencil's footprint is
placed ahead of them too. A test that raises and then reads the author's own cell measures a cell
nothing happened to; take the cell from the `Ack`'s `ak_q`/`ak_r`, which exists for that reason.

⚠ **`Fit.ft_offer` IS AN INTEGER *"meaningless unless ft_ordinal"*.** Asserting on it for a NOMINAL
refusal asserts nothing — `ft_ordinal` is the field that carries the claim.

⚠ **PASS THE CONSTANT THE HANDLER PASSES.** A niche test that invented its own band was refused
*"too shallow to stand in"*; the editor cuts with `hex_draw::BAND_SIDES` (√3/2). A test with its
own number measures a thing the editor never makes.

⚠ **THE PLAN TABLE IS NOT THE DESIGN.** `A8.7`'s row quoted §P9.5 after §P9.11 had replaced it, and
building the row as written would have shipped a check that refuses a cape. Read the § a row cites
before implementing it.

⚠ **THE INSTALLED LOFT LEADS `main`, AND THAT IS DELIBERATE.** `/usr/local/bin/loft` is put here
ahead of `main` on purpose, so that a language defect is fixed **in the language** rather than
worked around in **our** libraries. When a library suddenly fails on a shape that has been fine
for months, the move is to measure it, file it, and wait for a toolchain — **not** to start
editing `lib/*` around it. Mutating the libraries to dodge a compiler bug is the failure this
setup exists to prevent, and it looks exactly like ordinary work while you are doing it.

✅ **The instance that earned that note is CLOSED, and it is the reason the note exists.** The
redundancy lint asked for the `&` off any parameter whose binding is never reassigned; doing that
at all 50 sites it flags took `hex_world` from **114 green to 96 failed** with `Delete on locked
store`, and `src/editor_run.loft` from exit 0 to SIGABRT — while `--native` passed all 114 on the
same source, so a per-backend green said nothing. It was *right* at some sites and wrong at others
**in identical words**. Measured, filed as
[loft#760](https://github.com/loft-lang/loft/issues/760), fixed within hours, and the 50 `&`s are
now dropped. ⚠ **The lint is back at 4 sites, all `wld: &World`** — the exact class; not touched.
**The compiler's advice is a hypothesis. Run the suite against it; the check costs one run.**

⚠ **A RAISE LEAVES 22 OF 48 CHUNK GROUNDS STALE ON THE CLIENT, AND NOTHING EVER CORRECTS THEM.**
Found 2026-08-04 by `A7.3a`, whose picture comparison was the first instrument to re-mesh a whole
world at once. Attributed away from part mode by forcing the same rebuild with `8:`/`9:` — the same
22. `raise_ahead` writes along a **ray**; `mark_dirty` marks a **disc** around where the ray lands.
Invisible to every existing gate, because they all check the store and the store is right — `G`,
with the count correct and the picture wrong.
[OPEN_ISSUES § *A raise marks fewer chunks than it writes*](OPEN_ISSUES.md). ⚠ Any gate that
photographs the world must **settle the picture first**, or it reports 22 differences its own
feature did not cause.

**A struct name is GLOBAL across a consumer's dependency graph, and a package suite cannot see
it.** `hex_part` was 131 green while `hex_editor` would not build, because both declared `Fit`.
Grep `lib/`, `src/`, `../loft-libs-world/` and the registry before adding a public name — and when
one is taken, **read the collision**: `hex_editor`'s `Fit` had already settled the ordinal/nominal
question `hex_part` was re-deriving. Now a working rule in [CLAUDE.md](../../CLAUDE.md).

**Only 6 of the 24 headings can turn a BODY ON THE LATTICE**, and the other 18 tear 12–22 of a
test body's 90 adjacencies — no cells lost, every count agreeing, holes in the walls.
`moros_map/tests/headings.loft` prints the table every run. ⚠ The 24 came from `hex_shape`'s
`d24`, which is a space of LINE directions; a run may staircase and a body may not.

⚠ **`A6.2` NARROWED THE REFUSAL AND THE NARROWING IS THE INTERESTING PART.** The measurement is
about something *on* the lattice, so `expand` now asks `part_lattice_free` — *is anything
displaced by a rotation*: its own cells, a nested part at an offset, a socket at an offset. A
body with none of the three takes all 24 exactly. ⚠ **The question is never *does it have a
mesh***: §P5 lets a part be both, and a pillar that is a `.glb` for the eye and a column for the
walker still has a cell to tear. `bake` keeps the blanket rule — it produces cells, and a
lattice-free body produces none.

⚠ **AN AIM AND A TURN ARE DIFFERENT QUANTITIES.** An `INST` facing and a `SOCK` heading say which
way a thing should LOOK; `ANCH`'s facing says which way the part looks in its OWN frame; the turn
applied is the difference, wrapped. Without it, re-modelling a statue turned by 6 stands it
turned by 6 in every socket in the library with every number unchanged.

**A field's freedom depends on whether anything ever REFERS to it**, and that is not knowable
when the field is designed. `A4.1` gave a socket name the tail and a comma; `A4.3` had to take
the comma away, because a `BIND` names a socket between two commas and the part handle must be
the tail.

**`.gitignore:47` ignores every `.glb` EXCEPT the part library's own.** The rule exists for the
`moros_render` CLI examples, which write theirs cwd-relative; `A6.2` added
`!data/parts/**/*.glb`, because `data/parts/` is content and a committed part that names a mesh
no clone has is a part that cannot draw. ⚠ **A committed binary is invisible to `git status`,
passes locally and is missing on every other clone — run `git check-ignore -v` before adding
one**, and check the negation's control too (a `.glb` anywhere else must still be ignored).

**`loft test` runs any zero-argument function that returns nothing as a TEST.** A bare `wipe()`
helper is listed among the test functions and executed in the runner's order. A parameter is what
keeps a helper a helper.

**[loft#772](https://github.com/loft-lang/loft/issues/772) is filed and open** — a `&` parameter
**reassigned** from a local or a call is a hard error, *"has & but is never modified; remove the
&"*; from a LITERAL it compiles and propagates fine. ⚠ **The fix it names is the silently wrong
one**: measured, `with &: caller sees 3` and `without &: caller sees 0`. Same shape as #760 — a
redundancy lint right at some sites and wrong at others in identical words. Workaround: split
detection from mutation and let the caller do the assignment.

**Every gate now gets its own copy of `data/parts/`** (`tools/run-gates.sh` sets `EDITOR_PARTS` to
a temp copy), so a gate may add and remove parts to prove the catalogue follows the library. ⚠ **A
gate must never write to the committed library** — this tree is worked by more than one agent, and
a gate that fails leaving the repository dirty is worse than no gate.

⚠ **[loft#775](https://github.com/loft-lang/loft/issues/775) is filed and open, and it is the
one that cost real time** — a struct-field alias that OUTLIVES its owner is silently overwritten
by the next allocation. `wld = pt_ld.wl_world` made the editor's session-long world a second name
for a field of a handler-local; measured with a `println` either side of one call, `tau 20 chunks
4` → **`tau 0 chunks 0`** across `stencil_part`, which never assigns to its argument. **The edit
clock going DOWN is the tell** — it is monotonic, so it cannot be a write. ⚠ **The cure is to
assign through a local**, which #774 measured to be a copy. ⚠ **And the shape is everywhere**,
because it is what reading a result looks like: `x = <call>().field`. Ours survived by luck at
every site but one, and one allocation is the whole margin.

⚠ **LOFT HAS NO BLOCK-LOCAL DECLARATION — an assignment in a nested block writes the OUTER
variable.** Measured. `14:`'s handler parsed its payload into `part_name`, which is also what
`A7.3a` called the part being edited, so every stencil in part mode blanked the subject line and
the close acknowledgement. There is no warning and nothing at either site looks wrong; **grep the
enclosing function before naming a handler local**, the same way a public name is grepped.

**[loft#774](https://github.com/loft-lang/loft/issues/774) is filed and open** — a plain struct
**copies** on `b = a` and **aliases** on `c = v[0]`: the same assignment, opposite semantics, both
backends agreeing, and nothing in the source separating them. Measured while designing `A7.3`'s
store swap. ⚠ It means a second name for a `World` is a full deep copy of every chunk, and the edit
clock is blind to it — `w_tau` counts writes that changed something, and a copy changes nothing.
Workaround: mutate through a function parameter (those alias), or park the record in a one-element
vector and take `[0]`.

**[loft#767](https://github.com/loft-lang/loft/issues/767) is filed and open** — a string literal
nested inside an interpolation keeps its own `{…}` as **literal text**, so
`"{("{x}" as float?) ?? 0.0}"` reads `{x}` back as unparseable and reports the default. A silent
wrong value with no diagnostic; it made a scratch probe report a confident, wrong absence.
Workaround: put the inner string in a variable first.

### Where the two plans stand

**[#18 catalogue](https://github.com/jjstwerff/moros/issues/18)** — **every step done.** `B1`,
`B1.2b`, `B2`, `B3`, `B4`, `B5`, `B6`. The editor says what you are working on, things can be
named, and one list holds parts and materials alike, each row with a name, an image and its
availability.

**[#17 parts](https://github.com/jjstwerff/moros/issues/17)** — **`A1` through `A7.3` complete,
and `A3.4` and `A5.2` are closed too.** In order: `A1.1` region copy · `A1.2` round-trip and
`part_diff` · `A1.3` store sections · `A1.4` `PART`/`ANCH` · `A2.1` the cottage on disk · `A2.2`
the stamp and the wire · `A2.3` one placement path · `A3.1` `INST` and the cycle check · `A3.2`
expand · `A3.3` `expand == bake` · `A3.4` telling §P8's two rules apart · `A4.1` `SOCK`/`FITS` ·
`A4.2` `socket_fit` · `A4.3` `BIND` and the derived position · `A4.4` the heading measurement ·
`A5.1` the hinge · `A5.2` the swing, record half then drawing half · `A6.1` the `MESH` section ·
`A6.2` the statue on the plinth · `A6.3` the swap · `A7.1` the catalogue IS the library, and can
change · `A7.2` the picker, which is #18's `B5` · `A7.3a`–`f3` part mode, from the store swap to
the `BIND` gesture · `A8.1` a bound leaf is a placement · `A8.2` the editor meshes and poses its
cells · `A8.2b` the derived scale and the unit refusal. **`A7.4` (keyed reads) stays deferred until
a number says it hurts** — `src/part_build.loft` prints the cost every run. **What is left of the
plan is `A8.3`–`A8.7`.**

⚠ **`data/parts/` NOW HOLDS THREE FAMILIES**: `house/cottage.hxw` (built by `src/part_build.loft`),
`prop/{statue,seated,plinth,shrine}.hxw` + two `.glb`, and `door/{oak,frame,doorway,plank,planked,slat,slatted}`
(all by `src/prop_build.loft`). ⚠ **`door/slat` is the ONLY part at another unit** — 0.125 against
everything else's 0.25 — and it exists so the scale path has a consumer; it is a limb or it is
refused. `make parts` runs both builders, and every committed file rebuilds byte-identically — which is what makes committing a generated
`.glb` sane. ⚠ **`expand == bake` is now a claim about CELL nests only**: `bake` refuses a nest
holding a mesh (`BK_MESH`) rather than dropping it, because a baked part holds one `MESH` section
and no position for it.

⚠ **`A6.3` NEEDED NO NEW CODE, AND ITS FIXTURES ARE THE DELIVERABLE.** Swapping a bound part is a
one-field edit, which is what §P3 promised — so the step is controls, and two of them proved
nothing until sharpened: both statues anchored at `(0,0,0)` cannot tell *the position is the
socket's* from *the position is the leaf's*. ⚠ **A test about an ABSENCE starts out unable to
fail**, and `bind.loft`'s one invariant is exactly such an absence.

The editor now has a panel: a subject line the **server** authors, six labelled buttons, a
material catalogue with swatches drawn by the world's own shader, and greyed entries that say
why. `probe/b1/client_live.png` is what it looks like; `make probe-text` regenerates it.

### The environment overrides, added for gates and useful on their own

`EDITOR_PORT` (a driving gate and a human session on one box), `EDITOR_PARTS` (a part library
somewhere other than `data/parts/` — `B5.3`'s gate has to CHANGE a part while the editor
watches, and doing that to a committed file corrupts a tree two agents share), and
`PART_ROOF` / `PART_RADIUS` / `PART_OUT` on `src/part_build.loft` for building a variant
cottage. Defaulted, `make parts` writes the committed file byte-identically.

### Built and not yet called

⚠ **`44:` PART HAS NO CLIENT BINDING — only the gate drives it.** `A7.3a` says *no new gesture*
on purpose, so nothing in either renderer can open a part yet; a person needs `wscat` or a script.
That is named here rather than left to be discovered, because it is this tree's own trap wearing a
plan step's clothes. It gets its consumer when the catalogue row a picker already draws can be
opened — and the honest test of the whole mode is `A7.3e`, where a part authored in the editor
appears in that list.

⚠ **`hex_editor::names` has no consumer** — the name table, tested at `B4`, is invoked by
nothing. That is the trap `moros_ui` fell into and it is live again. It gets one when
catalogue entries carry author-given names. ⚠ **`hex_part::meta` now persists a name and the
server READS it** — `14:<roof>,<part>` acknowledges with `PART.name` — so the two want
reconciling rather than both existing: `PART.name` is the saved one.

✅ **`part_anchor` HAS A CONSUMER, as of `A6.2`** — and it is the FACING half only. `expand`
subtracts the part's own facing from the aim it is given, so which way a statue looks in the
world depends on the socket rather than on how the author modelled the `.glb`. ⚠ **Its position
half (`pa_q/pa_r/pa_h`) is still uncalled, on purpose**: a part's origin is what lands where it
is placed (`part_stamp`'s rule), and reading the position for a mesh but not for cells would make
`ANCH` mean two things depending on what the part is made of.

✅ **`part_expand_of` HAS A CONSUMER, as of `A5.2`'s drawing half** — the editor's display rebuild
calls it once per edit (`editor_server.loft:7864`). ⚠ **`part_expand` itself, the by-NAME entry,
still has none outside tests and `src/prop_build.loft`**, and the two are not interchangeable: the
library's entry takes a name and a gesture holds a world, which is the same split `part_cycle_of`
needed. A thumbnail that drew what a part *holds* would be `part_expand`'s first real consumer.
⚠ **AND THAT ABSENCE COST `A8.2b` A REFUSAL NOBODY WOULD HAVE MET.** Placing a part in a WORLD
(`14:<roof>,<part>`) goes `hex_editor::part_place` → `hex_part::part_stamp` and never enters the
expansion — so a check written only in `expand` is green, gated and unreachable by hand. Read this
entry as a live hazard for any rule added to `expand`, not as bookkeeping. **A world-mode `14:`
also composes nothing**: only the named part's own cells are stamped, and its `INST` children are
not derived at all.

✅ **`part_mesh_loads` HAS ONE TOO, as of `A7.3d`** — the save check calls it
(`editor_server.loft:5505`) as well as `make parts`. ⚠ **`part_expand` still deliberately does not
open the `.glb` it names**: it runs per edit, and a glb parse per placement per edit is a cost the
record cannot pay. So a dangling mesh reference is caught **on save and at build**, and still not
at load.

✅ **`glb_read` HAS A CONSUMER THAT IS NOT A TEST, as of `A6.2`** — the catalogue thumbnail draws a
part's `.glb` body. It cost almost nothing because `chunk_mesh_slot` and `glb_read` both hand back
`mesh3d::Mesh`, so `mesh_wire` takes the glb unchanged and both are `+Y` up. ⚠ **A thumbnail still
draws a part's OWN body and not what it holds**, so `prop/shrine` pictures as its paving with
neither the plinth nor the statue on it; `part_expand` in the thumbnail path is `A7`'s.

⚠ **A CELL'S MATERIAL IS A SMALL NAMED SET, AND A LITERAL IS HOW YOU GET A GREEN PLINTH.** `3` is
`FIELD_MAT`. A cell has no *stone* at all — `wall` is an EDGE material — so the five a cell may
take are `SURFACE_MAT`, `ROAD_MAT`, `FIELD_MAT`, `FLOOR_MAT` and `ROOF_MAT`, all `hex_editor`'s.

⚠ **A THUMBNAIL CANNOT SAY HOW BIG A PART IS.** `part_thumb_view` solves the camera to fill the
frame **per part**, which is right — a cottage and a doorknob are both legible — and it means two
props that differ only in SIZE are one picture. Only proportion survives the fit, and `A6.3`'s two
statues are gated on it (their aspects must differ by 1.5×). ⚠ An ink-pixel count over a row does
NOT see this: it saturates on the row window and barely moved across a reshape that took the two
silhouettes from indistinguishable to obviously different.

⚠ **A reason has nowhere roomy to live.** A list row is **212 px** — twenty-one characters —
so `B6`'s reasons are one word (`derived`, `scattered`) and the full sentence stays on the
entry unread. A status line or a tooltip is where it belongs; neither exists.

### ⚠ The browser CAN draw text and load an image — this reversed on 2026-08-03

The entry here used to say the opposite in capitals. loft fixed both
([#737](https://github.com/loft-lang/loft/issues/737),
[#738](https://github.com/loft-lang/loft/issues/738)) and `loft 2026.8.0` carries it —
measured in the emitted page: `measureText`/`fillText` real, a real coverage upload, a real
bundled-asset loader, **zero** `TODO` markers.

⚠ **Both issues are still OPEN on the tracker while the code is fixed.** Trust the
measurement, not the label — including this paragraph.

### ⚠ All four loft defects are FIXED — measured 2026-08-03, and all four still read OPEN

`/usr/local/bin/loft` is byte-identical to a release build of loft `5aa59023`, which carries
`Fix #744`, `Fix #745` and `Fix #749`. **The tracker labels lag the code**; this happened
before with #737/#738. `make lib-test` is green on both backends under it, so nothing here was
pinned to a value the bugs produced.

| | what it was | what it is now |
|---|---|---|
| [#744](https://github.com/loft-lang/loft/issues/744) | `const X = some_fn()` aborted | **works.** ⚠ And it now carries the better argument: **a file-scope constant is an inlined expression, re-evaluated at EVERY reference** — so a derived tag re-runs its function at each use. Literals + an equality test stay, for the new reason |
| [#745](https://github.com/loft-lang/loft/issues/745) | a struct field into a `&`-parameter | **works on both backends.** ⚠ Read the fix: the interpreter was **never** passing — it produced a *silent wrong value* where a later argument's temporary took the reference's slot. Our `Delete on locked store` was the third face of one bug |
| [#749](https://github.com/loft-lang/loft/issues/749) | `split_text` and `s[i..s.len()]` panicked on multibyte | **no panics.** ⚠ The **units stay mixed by design** — `len()` counts characters, a slice bound and `find` are bytes — and a lint now fires at the confusing spelling. `s.size()` or `s[i..]`, always |
| [#748](https://github.com/loft-lang/loft/issues/748) | *"no way to build a text from bytes"* | ⚠ **THE REPORT WAS WRONG.** `text_from_bytes` and `byte_at` had shipped **two releases earlier**; they were missing from the generated reference because they sit after the `--- Environment ---` marker in `default/03_text.loft` |

⚠ **#748 IS THE ONE TO LEARN FROM, AND IT IS OURS.** The instrument was the *generated*
stdlib page; a keyword sweep of it came back empty and was trusted to report an absence. One
`grep` over `default/*.loft` would have found both functions. That is this tree's own rule —
*check an instrument against something it SHOULD find before trusting it to report an
absence* — broken on a language question rather than on a picture. **Grep the source, never
the generated reference, before calling a capability missing.**

✅ **AND THE MECHANISM IT BOUGHT IS GONE.** The text view, its `sc_is_text` write flag and
`world_set_section_text` are removed; `hex_part` decodes its own sections in two lines each
way, the store reads each span ONCE, and the `MESH` always-decode caveat went with it.
⚠ **The proof it was a refactor and not a format change: `make parts` rewrote
`data/parts/house/cottage.hxw` BYTE-IDENTICALLY.** The committed file the old text-writer
produced is exactly what the new byte-writer produces — and the wire gate loads that file and
reads `cottage` back out of it.

⚠ **Taking it out found two more loft defects, both silent.**
[#751](https://github.com/loft-lang/loft/issues/751) — a `vector<integer>` is accepted where
`vector<u8>` is declared and its 8-byte elements are read AS bytes, so `[72, 105]` decodes to
`H` and a space; the same mismatch in a literal is a hard error.
[#754](https://github.com/loft-lang/loft/issues/754) — a function ending in `vec[i].field`
returns an **empty** vector on `--native` and the right one interpreted; an explicit `return`
of the identical expression is correct. Both were invisible until something read the bytes.

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
backends — loft#760 took `hex_world` from 114 green to 96 failed while `--native` passed
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

Thirteen sessions of how this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the
per-session entries, the numbered item log, and the superseded planning sections. Nothing
was thinned on the way out; ⚠ read a dated claim in it as dated. **Sessions 10–12** are the
arc from *a part is a world* to *a part with joints, a hinge and a mesh*; **session 13** is the
door on screen, §P9 argued out, and six loft installs in eleven hours.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. It reached **785** across
sessions 10–12 and came back to ~400 on 2026-08-04. It reached **907** in session 13 and came
back to ~500 on 2026-08-06. **When a session ends, its entry moves out** — the handoff describes
the present, and the record keeps the past. Moving is not thinning: a finding that cost a day is
worth more than the lines it takes, which is why nothing is ever deleted on the way.

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
