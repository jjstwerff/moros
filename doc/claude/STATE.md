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


## ⏭ PICK UP HERE — plan 18 CLOSED · plan 17 through `A8.1` · **next is `A8.2`**

**Green as of 2026-08-06** on loft `de2dd9e9`, hash stamped at both ends of every stage:
`make gate` **44, rc=0** · `make lib-test` **20 of 20** (10 packages × both backends) ·
`make parts` green, `data/parts/` byte-identical across all six files · layering silent.

| `hex_editor` **235** | `hex_world` **120** | `lavition_ui` **65** | `hex_part` **254** |
|---|---|---|---|
| `moros_sim` **310** | `moros_render` **167** | `moros_map` **92** | `moros_editor` **56** |

⚠ **THE TOOLCHAIN WAS REPLACED MID-SUITE TWICE IN ONE SESSION and only the stamp said so.** One
run started on `bd911fa1` and finished on `7f6968e8`, reporting 8 `SERVER NEVER LISTENED` and a
`collect2: ld returned 1`; another started on `7f6968e8` and finished on `de2dd9e9` with 9 more.
Neither was a real failure. **Three installs landed while this session was running**, so:
**stamp `sha256sum /usr/local/bin/loft` at both ends of every suite, and warm the new binary**
(`make client`, then one server up and down) before believing anything.

### What to do next

**`A8.2`** — [plan 17 § `A8` broken down](../../plans/17-parts/README.md#a8-broken-down--p9-the-limb-that-is-a-building).
`A8.1` is **done**: a bound leaf comes out of an expansion as a **placement naming a PART**, posed,
with its hinge and swing, and its cells in no world. What is missing is the *drawing* — the editor
counts cell-bodied limbs and says on the wire that it is not drawing them. `part_thumb_wire`
already meshes a part for a thumbnail; `A8.2` is that call in the display path.

⚠ **`A8.1` FLIPPED FIVE TESTS TO THEIR OPPOSITE, AND THAT IS THE MODEL FOR THE REST OF `A8`.** Every
*"a cell part in a turned socket is refused"* is now *"…is placed and turned"*, with the old claim
kept as an **`INST` control in the same test** — one part, one heading, two answers, decided by the
edge it came in on. Read [plan 17 § *What `A8.1` turned up*](../../plans/17-parts/README.md) before
touching `expand.loft` or `bake.loft`.

⚠ **READ [PARTS.md §P9.0](PARTS.md#p90--the-design-in-one-place) FIRST, AND NOT THE TWELVE
SUBSECTIONS.** §P9.0 is the design in one place — the part-tree, three limb kinds, the joint kinds
`moros_sim` already enumerates, seven invariants, and who owns what. §P9.1–.12 are the *record* of
how it was arrived at, including four places it was got wrong and corrected by the user; they are
not a design anyone can act on. The plan's `A8` table is the five steps, and the section under it
says what `A8` deliberately does **not** cover.

⚠ **`A8` IS THE DOOR-SHAPED SLICE ONLY** — one joint kind (`Mount`), one limb kind (solid), and a
leaf. Three limb kinds, `Spring`/`Tether`, per-limb hitboxes and a material per part want their
own plan. **The first two are the ones that change the FORMAT**, so they set the order.

### Plan 19 — the lavition split: `L1`–`L5` DONE or RAISED, the move waits for `A8`

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

⚠ **A BOUND LEAF IS STILL NOT DRAWN IF ITS BODY IS CELLS, and `A8.1` moved the gap rather than
closing it.** The placement now exists and names the part; what has nowhere to go is the geometry —
the display world is a `World`, which cannot hold a mesh. The editor counts these and broadcasts
*"N bound limb(s) are cell-bodied and not drawn yet"*, so the gap is visible instead of silent.
**`A8.2` closes it.** ⚠ Also still true: no gesture can author a `FITS`, so a cell-bodied leaf that
fits a socket cannot yet be made from the editor at all.

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
the `BIND` gesture. **`A7.4` (keyed reads) stays deferred until a number says it hurts** —
`src/part_build.loft` prints the cost every run. **What is left of the plan is `A8`.**

⚠ **`data/parts/` NOW HOLDS TWO FAMILIES**: `house/cottage.hxw` (built by `src/part_build.loft`)
and `prop/{statue,seated,plinth,shrine}.hxw` + two `.glb` (by `src/prop_build.loft`). `make parts`
runs both, and all six files rebuild byte-identically — which is what makes committing a generated
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

### ⚠ The FAST path — use this while iterating; `make gate` is not an iteration tool

```sh
make check P=hex_part            # layering + one package, interpreter only — SECONDS
make check P=hex_part G=part_bind   # …and the gates that cover it
make gate-one G="cache walk"     # just those gates, by bare name, either directory
make gate-rep  G="cache walk hipskin" N=5   # the SAME set, N times — the FLAKE HUNT
```

⚠ **THE FULL SUITE IS 10–20 MINUTES AND IS A PRE-COMMIT CHECK, ONCE.** Using it to
iterate is how a session spends an hour proving what a one-minute run already showed —
`make check P=hex_proj` is **0.3 s**, and three contended repeats of three gates is
**2m54s** against ~60 minutes for three full suites.

⚠ **A FLAKE IS HUNTED WITH `gate-rep`, AND THE SET MATTERS.** Running the suspect gate
**alone** does not reproduce a contention flake — that is the *discriminator*, not the
test. `gate-rep` runs the named set together at `GATE_JOBS`, which is the condition the
flake lives in.

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
