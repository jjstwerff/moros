# STATE.md — where the editor work stands (2026-08-03)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — nine sessions, newest first |

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⏭ PICK UP HERE (2026-08-03, session 10) — plan 18 is done bar one step, plan 17 has a format

`make gate` **35 green** · `make lib-test` **green, both backends** · `make probe-text` green ·
`make guards` **5 probes green** · `npm test` **53** · layering silent.

| | | | |
|---|---|---|---|
| `hex_editor` **235** | `hex_world` **114** | `lavition_ui` **65** | `hex_part` **73** |
| `hex_field` **51** | `hex_grid` **14** | `moros_terrain` **14** | |

⚠ **THE INSTALLED LOFT LEADS `main`, AND THAT IS DELIBERATE.** `/usr/local/bin/loft` is put
here ahead of `main` on purpose, so that a language defect is fixed in the language rather than
worked around in **our** libraries. When a library suddenly fails on a shape that has been fine
for months, the move is to measure it, file it, and wait for a toolchain — **not** to start
editing `lib/*` around it. Mutating the libraries to dodge a compiler bug is the failure this
setup exists to prevent, and it looks exactly like ordinary work while you are doing it.

The live instance: the redundancy lint asks for the `&` to come off any parameter whose binding
is never reassigned, and `503723a` does that at all 50 sites it flags. Every one needs loft's
`de86aab0` (*"`free_protected` means do not FREE it, not do not TOUCH it"*), which as of
2026-08-04 is on `tuxedo-pln23-db` and not yet on `main`. On a `main`-built loft this tree reads
as broken — `hex_world` **114 green → 96 failed** with `Delete on locked store`, and
`src/editor_run.loft` exit 0 → SIGABRT. That is the toolchain, not moros; do not go hunting in
`lib/`. Measured on the installed binary, which was replaced **three times in one day** —
**re-measure rather than trust an earlier run in the same session**.
[loft#760](https://github.com/loft-lang/loft/issues/760), closed.

### The next thing to do is #17 `A3.2` — expand. **Plan 18 is COMPLETE; #17 `A3.1` is done.**

⚠ **`A3.2` IS THE ONE WITH THE HANG IN IT.** `expand(instance)` derives a part's cells into a
layer under `world_fresh_label`, recursively — and §P8's *depth is bounded at 8* is `A3.4`,
which comes AFTER it. `A3.1` deliberately did not put a bound in (its cycle check does not need
one; see below), so `A3.2` is walking a tree whose only guard today is that the library has no
cycle in it. Either take the bound early or know that is the state.

**`A3.1` is done.** `INST` is one line per instance — `inst=<q>,<r>,<h>,<facing>,<part>` —
carried on the same section mechanism as `PART`/`ANCH`, with `part_cycle` / `library_cycle` for
§P8. The server sweeps the library at startup and lists a faulty part **greyed with its chain**
(`part|house/loop_a|0|contains itself: house/loop_a → house/loop_b → house/loop_a`), which is
what stops the check being a function with no caller — §P8's *"checked on save"* has no save
gesture to hang on until `A7.3`.

⚠ **THE TWO §P8 RULES ARE NOT ONE RULE.** *A part may not contain itself* and *depth is bounded
at 8* read as one sentence and are two programs. The cycle check needs **no bound**: each step
either finds a name already on the chain being walked, or descends to one that is not, and the
chain only grows — so it is bounded by the number of parts on disk. The depth bound is about a
**renderer**, where unbounded recursion is a hang and a hang reads as a crash.

⚠ **A DIAMOND IS NOT A CYCLE**, so the walk carries the PATH and not a visited set — a house
with two door-frames using one leaf visits it twice and is legal. ⚠ That test **has never been
red and says so in its own comment**: it is a pin against the obvious *make it cheaper on a wide
library* refactor, not evidence the walk works. What supplies that is the pair beside it — a
fault two links down, and a fault under the second sibling — and both were seen red.

⚠ **THE NAME COMES LAST IN THE RECORD.** A part is addressed by its catalogue handle, which is a
FILE PATH, and a file name may contain a comma; with the name anywhere but last, `a,b/door`
parses as two fields and the part is silently renamed. Last means four splits and then *the rest
of the line*, so no escaping exists to get wrong in one direction only.

**`A1` and all of `A2` are finished.** A part is a world, it round-trips, the store carries
tagged sections, `PART`/`ANCH` ride on them, `data/parts/house/cottage.hxw` is committed
(`make parts` builds and verifies it), `14:<roof>,<part>` places it — and **`14:<roof>` now
places it too**, by generating a part and stamping it. ⚠ **#18 `B5.1` and `B5.2` are done**:
`house/cottage` is in the same list as the nine materials — one widget, the kind on the row —
its row shows **the part itself**, rendered, and the picture **follows the file**: the server
keys each part by `(mtime, size)`, re-stats once a second, and broadcasts a rebuilt set to
everyone rather than to the next client to connect.

⚠ **A PART IS A WORLD TO THE STORE AND IS NOT ONE TO THE MESHER**, which `B5.2` found by
looking. `chunk_mesh_mat` treats an unwritten cell as GROUND — that is what makes an
unauthored world a plane rather than a hole to fall through — and a part is bounded, so its
unwritten cells are *outside it*. Meshed as a world, the 38-cell cottage came out **28.6 ×
24.5 world units**: four chunks of grass with a house somewhere in it, while every count
agreed with itself. `moros_terrain::chunk_mesh_mat_bounded` is one flag through the one loop,
and only the ground pass can differ — an unwritten cell is substituted to `SURFACE_MAT`, so it
can never join another. The control is that a **fully written** tile meshes identically both ways.

⚠ **THE SERVER MESHES A PART AND THE CLIENT DRAWS IT** — `W:` the canonical camera, `Y:` the
geometry, which is `M:`'s own shape with the mesh id replaced by a catalogue row. That is not
the obvious split: the client already meshes worlds out of its own cache, but four of a
chunk's nine surfaces come from `chunk_mesh_props`, which reads wall EDGES and the server's
registries. A client meshing a part draws its ground and its floor and **no walls**.

⚠ **A CAMERA THAT FRAMES A BOX DOES NOT FRAME THE THING IN IT.** Four fits were built; as a
fraction of the thumbnail the cottage fills: bounding **sphere** ~35%, bounding **box** ~35%
(*further away* than the sphere — no visible change at all), the box **in camera axes** 63%
with the arithmetic checking out, every **vertex solved** — the frame. The third is the one to
carry: *far enough that the topmost corner fits when it is also the nearest one* is exactly
right for a box with all eight corners populated, and a house is not one. Its tall points are
its roof and its near points are its front wall.

⚠ **A PICTURE COULD NOT SEE HALF OF `B5.3`, AND THAT WAS MEASURED.** Invalidation is two
claims — the row is redrawn, and the old geometry is retired — and only the first has a picture.
With the drop deliberately disabled the row-diff reported **`ok — 18% of pixels moved`**: two
houses drawn on top of each other is certainly a changed picture, and the client was leaking a
vertex buffer per surface per rebuild behind it. `24 thumbnail meshes arrived, 12 held` is the
second instrument. ⚠ **When a claim has two halves, count the halves before trusting the
picture** — and `§C4`'s own cache key had to be replaced for a related reason: *the version
already exists in the layer* is true of a world in memory and useless for a file, because reading
a layer version means LOADING the file, which is the whole cost the cache avoids. **A key you
must pay full price to compute is not a key.**

⚠ **AND A 22×16 THUMBNAIL FOUND A GEOMETRY DEFECT NOBODY HAD LOOKED FOR.** `B5.3` needed a
second part, reached for `roof_up`, and the picture came back a red band floating over a grey
box. Measured in the part files: `roof_up` lifts the roof's EAVE while the walls stay at
`WALL_UP = 12`, so `14:28` puts roof cells at 28..36 over a wall head of 12 — **a roof floating
16 units above its own house** — and the fence admits up to 400. Nothing had ever drawn a house
with a non-default roof. [OPEN_ISSUES](OPEN_ISSUES.md) has it; the gate's fixture varies the
RADIUS instead, so no gate encodes the broken shape.

⚠ **AND THE CATALOGUE HAD BEEN DRAWING THE PART A BLACK HEXAGON SINCE `B5.1`.**
`render_swatches` indexed `surface_at(i)` by the LIST row and `surface_at(9)` is the `?`
sentinel with colour `(0,0,0)` — measured at `5,5,6` against a list background of `20,20,24`,
so **not blank, darker than blank**. `panel.mjs` looped `i < 9`, the mesher's nine surfaces, so
the row that had just been added sat outside every claim it made. It reads the row count out of
the picture now, and the control that matters is the BLACK row rather than the blank one: a
blank row is the failure a thumbnail *has*, a black one is the failure that shipped, and it has
as much ink as any swatch (`probe/b1/deface.mjs`).

⚠ **NEVER PASS `--path ../loft/`. THE INSTALLED `loft` IS THE TOOLCHAIN**, and it bundles its
own stdlib — `make` and every gate run plain `loft`. `--path` points the compiler at
`../loft/default/`, a tree another agent edits continuously, so a scratch run built that way
sees work in progress. Doing it mid-session turned this tree red on `chr(cp) -> text` landing
there; the same files pass against the installed binary. **Self-inflicted, and the recipe in
*How to run things* below is what taught it** — that flag is gone from it now. The sibling
updates at stable points and this tree does not need to see it in between.

⚠ **AND THE BUG THAT FOUND IS NOT THE ONE IT LOOKED LIKE.** Chasing it produced a report with a
wrong premise *twice* — first blaming a sibling for a break I caused, then asserting *a local
may not shadow a stdlib name*, which is false: `len = 5` and `trim = 7` both compile. What
actually refuses is **tuple destructuring** —`(a, trim) = pair()` — onto a name plain
assignment accepts, and it says *requires plain variable names* about a plain variable name
([#756](https://github.com/loft-lang/loft/issues/756), reproducible on the installed compiler
with no `chr` at all). ⚠ **State the rule you think you found, then try to break it, before
filing.**

⚠ **`A2.3` COULD NOT BE DONE AS WRITTEN, AND THE GATES ARE WHY.** *"`stencil_place` no longer
reachable from `14:`"* assumed the wire's house had no PARAMETER. It has `roof_up`, and
`doorstep.mjs`'s entire ordinal-refusal control **IS** the roof fence while `stencil.mjs` needs
a roof that does not fit — so making `14:` place a fixed part would have deleted those claims
to make a sentence true. What was retired instead is the **placement**: `stencil_place` builds
into a scratch world, `part_from_region` cuts it, `part_place` stamps it, and every house that
reaches a real world arrives through one code path. All four `14:` gates pass **unchanged**.
*One definition of a house* is `A7.3`'s fight and it wants an editable part in hand.

⚠ **THE AUTHORED HOUSE IS THE PROCEDURAL HOUSE, EXACTLY** — not pixel-for-pixel, which was the
weaker claim the plan expected. Measured: same cells, same three owned edges, same layer
LABELS, same `w_next_id`, same `w_tau`, on flat ground, on a slope and under a ceiling that
refuses both paths. It lives in `lib/hex_editor/tests/part_place.loft` because a label is
invisible to every renderer and `τ` catches a path that wrote twice and photographed the same.
`tools/gates/world/part_place.mjs` is the wire half and is deliberately thin.

⚠ **A part always crosses four chunks and is 65,928 bytes for 38 used cell slots** — 0.46%.
Origin-centring puts cells at negative coordinates and `chunk_of(-1)` is `-1`, so this is true
of a part of any size. Not a bug: it is the store's dense 8 KB layer meeting a consumer it was
not shaped for, `A7.4` owns it, and `make parts` prints the number every run so the deferral
cannot go stale.

**What `A1` left in the store and the part package:**

- sections — `tag(i32) + length(i32) + payload`, repeated to **end of file**, riding on the
  world as `w_sections`, so `world_save`/`world_load` carry a tag nobody knows.
  `world_set_section` / `world_section_bytes` / `world_section_at` / `world_drop_section`.
- ⚠ **the payload is `vector<u8>` and the store decodes NOTHING.** A text view lived on
  `Section` for a day and is gone; `lib/hex_part/src/codec.loft` is the decoder, two lines
  each way over `byte_at` / `text_from_bytes`. The byte TYPE is what refuses a non-byte now,
  at the literal, where `WS_SECTION` used to refuse it after a save had run.
- `PART` / `ANCH` as `key=value` text in `lib/hex_part/src/meta.loft`.

The design, the findings and the incremental-writer hazard are
[PARTS.md § P2](PARTS.md#p2--a-part-is-saved-the-way-a-world-is-saved-because-it-is-one).

⚠ **The magic is `WTTH`, not `HXW7`.** Every `.hxw` in the tree opens `57 54 54 48`; the
constant's comment claimed otherwise for as long as the format has existed. The value is not
corrected — every saved world carries it — and the comment is. It was found by a cross-check
(`section_tag("WTTH") == WORLD_MAGIC`), never by reading, which is the point.

⚠ **AN ASCII TEST SUBJECT CANNOT SEE A TEXT BUG.** The part in `A1.4`'s round-trip is called
`"porte café"` and described as `"a door, 2 = boards wide 中"`, and that one choice found three
defects that `"door"` agrees with perfectly: two loft panics, a parse that truncates at the
first `=`, and a byte-per-character encoding. Pick the subject that can disagree.

⚠ **`lib/hex_world` is the tree that owns the store**, by path, as `hex_editor` and `hex_part`
both declare, and that is where `A1.3` landed. The registry carries a 0.2.0 on a different
lineage. Which tree owns it for good is
[#8](https://github.com/jjstwerff/moros/issues/8), **deferred pending sibling coordination**.

### Where the two plans stand

**[#18 catalogue](https://github.com/jjstwerff/moros/issues/18)** — **every step done.** `B1`,
`B1.2b`, `B2`, `B3`, `B4`, `B5`, `B6`. The editor says what you are working on, things can be
named, and one list holds parts and materials alike, each row with a name, an image and its
availability.

**[#17 parts](https://github.com/jjstwerff/moros/issues/17)** — **`A1`, `A2` and `A3.1`
complete.** `A1.1` region copy, `A1.2` round-trip and `part_diff`, `A1.3` store sections, `A1.4`
`PART`/`ANCH`, `A2.1` the cottage on disk, `A2.2` the stamp and the wire, `A2.3` one placement
path, `A3.1` the `INST` record and §P8's cycle check. **`A3.2` — expand — is next**, and it is
the bigger arc: `A3.3` then asserts `expand == bake` cell for cell, which is the strongest test
in the design because the two paths share nothing but the part.

The editor now has a panel: a subject line the **server** authors, six labelled buttons, a
material catalogue with swatches drawn by the world's own shader, and greyed entries that say
why. `probe/b1/client_live.png` is what it looks like; `make probe-text` regenerates it.

### The environment overrides, added for gates and useful on their own

`EDITOR_PORT` (a driving gate and a human session on one box), `EDITOR_PARTS` (a part library
somewhere other than `data/parts/` — `B5.3`'s gate has to CHANGE a part while the editor
watches, and doing that to a committed file corrupts a tree two agents share), and
`PART_ROOF` / `PART_RADIUS` / `PART_OUT` on `src/part_build.loft` for building a variant
cottage. Defaulted, `make parts` writes the committed file byte-identically.

### Two things built and not yet called

⚠ **`hex_editor::names` has no consumer** — the name table, tested at `B4`, is invoked by
nothing. That is the trap `moros_ui` fell into and it is live again. It gets one when
catalogue entries carry author-given names. ⚠ **`hex_part::meta` now persists a name and the
server READS it** — `14:<roof>,<part>` acknowledges with `PART.name` — so the two want
reconciling rather than both existing: `PART.name` is the saved one.

⚠ **`part_anchor` is still called by tests only.** `A2.2` gave `part_meta` a consumer and left
`ANCH` without one: nothing yet places a part BY its anchor, because the stamp takes the
author's cell. That is `A3`/`A4` — an instance bound to a socket is the first thing that needs
a facing.

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

```sh
make gate              # 35 gates, SILENT when green; GATE_VERBOSE=1 for timings
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

Eight sessions of how this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the
per-session entries, the numbered item log, and the superseded planning sections. Nothing
was thinned on the way out; ⚠ read a dated claim in it as dated.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. **When a session ends, its
entry moves out** — the handoff describes the present, and the record keeps the past. Moving
is not thinning: a finding that cost a day is worth more than the lines it takes, which is
why nothing is ever deleted on the way.
