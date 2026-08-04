# STATE.md — where the editor work stands (2026-08-03)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — twelve sessions, newest first |

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**. ⚠ **The per-STEP record belongs
to the plan** — `plans/<n>-<name>/README.md` carries a *What `Ax.y` turned up* section written
when the step landed, and this file duplicating it is how it grows back.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⏭ PICK UP HERE (2026-08-04, session 13) — plan 18 COMPLETE, plan 17 through `A7.2`

`make gate` **36 green** · `make lib-test` **2517, both backends** · `make parts` green
(`data/parts/` byte-identical, all six files) · `npm test` **53** · layering silent. All measured
2026-08-04 on the installed loft.

⚠ **`make gate` FLAKES, AND `GATE_JOBS` IS THE KNOB — NOT THE LOAD AVERAGE.** The symptom is
`SERVER NEVER LISTENED`: a 60-second wait for `listening on port` while `GATE_JOBS` servers each
interpret a 5,900-line `editor_server.loft`. Measured this session: **10 of 35 failed at
`GATE_JOBS=10`**, and the *same suite* went green at **`GATE_JOBS=4` on a HIGHER load** (26 →
40). One gate alone takes **2 m 33 s**, nearly all of it startup. ⚠ **There is a SECOND face**:
`FAIL cache … {"agree":0,"bad":24,"layers":0}` — no layers ever arrived, so nothing was compared,
which reads as a measured disagreement and is a startup miss. ⚠ It also failed at load ~4 and
passed at load 33 earlier the same day, so *check the load first* was never the rule.
**`GATE_JOBS=4 make gate` is the reliable form**; a single gate at `GATE_JOBS=1` is the cheap
discriminator when one fails. ⚠ **AND 4 IS NOT IMMUNE** — 2026-08-04, `cache` failed with that
exact second face (`agree 0 bad 24 layers 0`) at `GATE_JOBS=4` and passed **alone** on the same
build minutes later. So *"reliable"* means *fails rarely*, and the discriminator is not optional:
a `cache` failure whose `layers` is **0** compared nothing and is a startup miss, whatever the
job count.

| | | | |
|---|---|---|---|
| `hex_editor` **235** | `hex_world` **114** | `lavition_ui` **65** | `hex_part` **217** |
| `hex_field` **51** | `hex_grid` **14** | `moros_terrain` **14** | `moros_map` **92** |

⚠ **THE INSTALLED LOFT LEADS `main`, AND THAT IS DELIBERATE.** `/usr/local/bin/loft` is put
here ahead of `main` on purpose, so that a language defect is fixed in the language rather than
worked around in **our** libraries. When a library suddenly fails on a shape that has been fine
for months, the move is to measure it, file it, and wait for a toolchain — **not** to start
editing `lib/*` around it. Mutating the libraries to dodge a compiler bug is the failure this
setup exists to prevent, and it looks exactly like ordinary work while you are doing it.

✅ **The instance that earned this note is CLOSED (2026-08-04).** The redundancy lint asked for
the `&` off any parameter whose binding is never reassigned; `503723a` did that at all 50 sites
it flags, and every one needed a store fix that was then on a branch only — on a `main`-built
loft this tree read as broken, `hex_world` **114 green → 96 failed** with `Delete on locked
store` and `src/editor_run.loft` exit 0 → SIGABRT. That fix is now on `main`
(`store.rs`: `let frozen = self.read_only;`), so any loft builds this tree.
[loft#760](https://github.com/loft-lang/loft/issues/760), closed — and the measurement that
found it is why the note above exists at all. ⚠ **The installed binary was replaced three times
in one day**, so re-measure rather than trust an earlier run in the same session.

### The next thing to do is #17 `A7.3` — a part-editing mode

**All of `A6` and `A7.1` are done, and `A7.2` is #18's `B5`, already built.** `A7.3` is *open a
part as a world, edit, save back* — **a house authored end-to-end without touching loft**, which
is the acceptance test for the whole plan. `A7.4` (keyed reads) stays deferred until a number says
it hurts; `src/part_build.loft` prints the cost every run.

**`A7.3` is broken into six steps** — [plan 17 § `A7.3` broken down](../../plans/17-parts/README.md#a73-broken-down-and-the-probe-that-shaped-it):
the store swap and the subject (`a`), the fence of refusals (`b`), the save (`c`), the save check
(`d`), a part that did not exist before (`e`), the joints (`f`). ⚠ The probe that shaped it says
**holding the world aside is a deep COPY, not a second name**, and `w_tau` cannot see that cost.

⚠ **`A7.3` IS WHERE THE JOINTS GO ON THE WIRE.** `parts_for_socket` has been built and tested since
`A4.2` with no consumer, and `A7.1` deliberately did **not** send `FITS`/`SOCK` — a message no
client reads is this tree's own trap. The first gesture that BINDS something is what earns them.
⚠ And `A3.4`'s save check finally gets its hook here too: §P8 says *checked on save*, and `A7.3` is
the first save.

**Two steps are ◐ rather than done, each for a reason that is still true:**

- **`A3.4`** — §P8's *"checked on save"* has **no save gesture to hang on** until `A7.3`, so the
  server's startup sweep is still `library_cycle`'s only caller. Writing the hook now would be a
  function with no caller, which is this tree's own trap.
- **`A5.2`** — its state half is done and its **renderer half is blocked on a FIELD, no longer on
  a number.** `A6.2` supplied the mesh leaf `A5.2` was waiting for, and it can be turned to any of
  the 24 including heading 1 (the 15° `F-READ` asks for). But `MeshAt.ma_facing` is a turn about
  the part's **origin** about the **vertical**, and a `Hinge` carries its own point and its own
  axis — a trapdoor hinges about a horizontal one. Composing `bd_open` into `ma_facing` would
  swing every door about its centre. The swing needs to be **in the placement record**, or in a
  second record beside it.

⚠ **`A5.2`'s gate is a COLD-RECOGNITION test and needs the user's eyes**, not a gate: *does a
person call it a door.* It cannot be reached until a leaf can be drawn ajar. Render it and hand
over the picture; do not claim it from a green suite.

### ⚠ The per-step record is in the PLAN, not here

[plans/17-parts/README.md](../../plans/17-parts/README.md) carries a **What `Ax.y` turned up**
section for every step — the findings, the controls, and what each sabotage cost. This file
carries only what is true *now* and what bites regardless of which step you pick up. The arc's
narrative is [JOURNAL.md](JOURNAL.md) § *Sessions 10–12*.

### ⚠ What bites regardless of which step you pick up

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

**[#17 parts](https://github.com/jjstwerff/moros/issues/17)** — **`A1`, `A2`, `A3`, all of
`A4`, `A5.1`, `A5.2`'s state half, all of `A6`, and `A7.1`/`A7.2` complete.** `A3.4` and `A5.2` are ◐; the
reasons are under *the next thing to do* above. In order: `A1.1` region copy · `A1.2` round-trip
and `part_diff` · `A1.3` store sections · `A1.4` `PART`/`ANCH` · `A2.1` the cottage on disk ·
`A2.2` the stamp and the wire · `A2.3` one placement path · `A3.1` `INST` and the cycle check ·
`A3.2` expand · `A3.3` `expand == bake` · `A3.4` telling §P8's two rules apart · `A4.1`
`SOCK`/`FITS` · `A4.2` `socket_fit` · `A4.3` `BIND` and the derived position · `A4.4` the heading
measurement · `A5.1` the hinge · `A5.2`'s state half · `A6.1` the `MESH` section · `A6.2` the
statue on the plinth · `A6.3` the swap · `A7.1` the catalogue IS the library, and can change ·
`A7.2` the picker, which is #18's `B5`.

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

⚠ **`part_expand` ITSELF STILL HAS NO CONSUMER outside tests and `src/prop_build.loft`** — the
editor does not call it. That is `A7`'s, and it is the reason `A6.2`'s work is gated by a build
program rather than by a picture.

⚠ **`part_mesh_loads` IS CALLED AT BUILD TIME AND NOWHERE ELSE.** `part_expand` deliberately does
not open the `.glb` it names — it runs per edit, and a glb parse per placement per edit is a cost
the record cannot pay — so a library shipping a dangling mesh reference is caught by `make parts`
and by nothing at load time yet. `A3.4`'s save check is where it belongs.

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

```sh
GATE_JOBS=4 make gate  # ⚠ 35 gates, SILENT when green. THE DEFAULT IS 10 AND THAT FLAKES:
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

Twelve sessions of how this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the
per-session entries, the numbered item log, and the superseded planning sections. Nothing
was thinned on the way out; ⚠ read a dated claim in it as dated. **Sessions 10–12** are the
arc from *a part is a world* to *a part with joints, a hinge and a mesh*.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. It reached **785** across
sessions 10–12 and came back to ~400 on 2026-08-04. **When a session ends, its entry moves
out** — the handoff describes the present, and the record keeps the past. Moving is not
thinning: a finding that cost a day is worth more than the lines it takes, which is why
nothing is ever deleted on the way.

⚠ **AND MOST OF WHAT GREW BACK WAS ALREADY WRITTEN DOWN TWICE.** The 447 lines moved out on
2026-08-04 were per-step findings that `plans/17-parts/README.md` already carried, section for
section. A handoff that repeats the plan is a handoff nobody can skim — so when a step lands,
its finding goes in the PLAN, and this file gets only what a reader needs whichever step they
pick up next.
