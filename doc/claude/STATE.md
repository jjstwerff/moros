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


## ⏭ PICK UP HERE (2026-08-04, session 12) — plan 18 COMPLETE, plan 17 through `A5.2` ◐

`make gate` **35 green** · `make lib-test` **2474, both backends** · `make parts` green
(`data/parts/` byte-identical) · `npm test` **53** · layering silent. All measured 2026-08-04 on
the installed loft.

⚠ **`make gate` FLAKES, AND THE LOAD AVERAGE IS A BAD PREDICTOR OF IT.** The recorded symptom
was three gates reporting `SERVER NEVER LISTENED` at load **19.75** — a 60-second wait for
`listening on port` while `GATE_JOBS` servers interpret a 5,900-line `editor_server.loft` at
once. ⚠ **There is a SECOND face**: `FAIL cache … {"agree":0,"bad":24,"layers":0}` — no layers
ever arrived, so nothing was compared, which reads as a measured disagreement and is a startup
miss. ⚠ **And it failed at load ~4 and passed at load 33 in the same session**, so *check the
load first* is not the rule it looked like. Re-run before believing a gate failure; the gate
alone at `GATE_JOBS=1` is the cheap discriminator.

| | | | |
|---|---|---|---|
| `hex_editor` **235** | `hex_world` **114** | `lavition_ui` **65** | `hex_part` **180** |
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

### The next thing to do is #17 `A6.1` — the `MESH` section. **`A5.2` and `A3.4` are ◐.**

**`A5.2`'s STATE half is done and its RENDERER half is blocked, with a number rather than a
shrug.** `bd_open` rides on the binding, `swing_fit` fences it against the leaf's own hinge, and
`F-STATE`'s falsifiable claim is measured: **save with a door 0.125 turns open, reload, it is
still 0.125** — with a door saved shut as the control, so the value travelled rather than being
a default.

⚠ **A CELL LEAF HAS EXACTLY TWO DRAWABLE POSITIONS IN A DOOR'S SWING, AND THAT IS WHY THE PICTURE
IS NOT BUILT.** `A4.4` measured that only the six multiples of 60° move a body without tearing it,
and 60° is a **sixth of a turn** — so a leaf made of CELLS can be drawn only at multiples of 1/6,
and a door's `0 .. 0.25` range holds **0 (shut) and 1/6 (60°)** and nothing between. `swing_steps`
computes it; the test pins **2**, with controls at 1, 7 and 0. `F-READ` wants *"a leaf ajar, not
flush — at 15° it is a door"*, and 15° is a twenty-fourth of a turn. **So the picture needs either
the cell rotation `A4.4` left unbuilt, or a leaf that is a MESH** — which is `A6.1`, and is what
FITTINGS §1 already calls a leaf: *"asset + world state"*, not cells.

⚠ **AN ANGLE IS ORDINAL, WHICH IS THE OTHER ARM OF `A4.2`'s FINDING.** A size class turned out
NOMINAL (`hex_editor`'s *"255 is not 'nearly' 256"*), so its refusal reports only what the frame
REQUIRES. 0.3 turns really is *nearly* 0.25, so `F-SWING`'s offer-and-residual is meaningful and
is carried. Both arms of one distinction now sit in one package.

⚠ **AN INFINITE SWING IS NOT *TOO FAR OPEN***, which is what the test first asserted. It IS past
the limit — until you write down what it offers: the residual is `inf - hi`, which is `inf`, and
an infinite overshoot is not a correction. A large FINITE swing is the control: 1000 turns is
`WF_HIGH` with a usable overshoot.

⚠ **THE GUARD AND THE FENCE ARE IN DIFFERENT PLACES ON PURPOSE.** Finiteness is checked where the
value ARRIVES (the record); the RANGE where it is USED, because the leaf's hinge lives in another
FILE and `part_set_bindings` has a world and no library root.

⚠ **A LEAF WITH NO HINGE MAY BE BOUND AND MAY NOT BE OPENED** — a pane, a fixed light, a
bricked-up panel are all legitimate in a frame and all shut for ever.

⚠ **`BIND` CHANGED SHAPE**, which is a thing to do while a format is in flight and not after: no
`.hxw` on disk carries one, so it cost nothing — and an older reader of a KNOWN tag *misparses*
rather than skipping, since `A1.3`'s skip-by-length only saves an unknown tag.


**`A5.1` is done, and it is the first section in this format to carry a FLOAT.**
`lib/hex_part/src/hinge.loft` holds `HING` — a leaf's hinge point, its axis and its swing
limits. ⚠ **The fields are `moros_sim::Link`'s, in its order and its unit (TURNS)**, because
FITTINGS §1 says a leaf is a `Body` on a `Mount` link and `assembly.loft` warns *"Two units for
one quantity is how a conversion goes missing"*. Matching a vocabulary is not importing it —
`hex_part` still depends only on the store.

⚠ **`A1.4` ARGUED THIS FORMAT FROM *"an integer written as text round-trips exactly"*, and every
section since held integers.** A swing limit is a fraction of a turn, so the argument had to be
re-earned. It holds — `0.1`, `1/3`, `π`, `√2`, `1e-300`, `1e300` all come back bit-equal — with
the control that makes it mean something: `0.1 + 0.2 != 0.3`, so the comparison can see one bit.

⚠ **INFINITY ROUND-TRIPS PERFECTLY AND IS REFUSED ANYWAY**, and the gap between those two facts
is the finding. The format is fine with `inf`; geometry is not — a hinge point at infinity is not
a position, and `hi - lo` on infinite limits is NaN. `moros_sim` spells *free* as a finite ±1000
turns. `x * 0.0 == 0.0` catches NaN and ±inf in one expression.

⚠ **AND THE FIRST VERSION CLAIMED THE OPPOSITE, ON A PROBE THAT LIED.** It reported that `inf`
wrote fine and read back malformed. The probe was wrong, and the way it was wrong is
**[loft#767](https://github.com/loft-lang/loft/issues/767)**, filed: *a string literal nested
inside an interpolation keeps its own `{…}` as LITERAL text*, so `"{("{x}" as float?) ?? 0.0}"`
reads `{x}` back as unparseable and reports the default — **a silent wrong value with no
diagnostic**. A confident absence from an instrument nobody had checked against something it
should find, which is this tree's own rule broken on a language question. ⚠ The workaround is
clean and is what the real code does: put the inner string in a variable first.

⚠ **THE AXIS IS STORED AS GIVEN, NOT NORMALISED** — normalising hands the author back a different
number than they wrote (`meta.loft`'s rule about a name). `moros_sim::has_axis` asks only that one
component be non-zero and this asks the same, so a leaf writable here is not inadmissible there.


**`A4.4` is done, and it refuted the design sentence it was sent to measure.**
`moros_map/tests/headings.loft` rotates a 37-cell disk (90 interior adjacencies) by each of the
24 headings and **prints the table every run**: lost cells, torn adjacencies, boundary ties,
worst residual.

| headings | what happens |
|---|---|
| `0 4 8 12 16 20` (60° multiples) | **exact** — nothing lost, nothing torn, residual zero to the last bit |
| the 15° and 45° families (12) | **well-defined and wrong** — 12 of 90 adjacencies tear, worst residual **0.522** hex steps against a covering radius of 0.577 |
| the 30° family (6) | **arbitrary** — six of 37 points land *exactly* on a cell boundary; 18 of 90 tear; at **90°** the tie-break puts two cells on one |

⚠ **PARTS §Open JUSTIFIED 24 WITH A CATEGORY ERROR, and it is corrected in place.** It cited
*"the editor's own wall runs use 24"* — that 24 is `hex_shape::hexwall`'s `d24`, whose own header
reads **"THE 24 DIRECTIONS, AND WHY ONLY 12 ARE FOR HOUSES"** and **"HOUSES ARE NEVER DRAWN WITH
AN IN-BETWEEN ANGLE"**. A wall run is a one-dimensional path and may STAIRCASE; a part is a body,
and rotating a body is a map from the lattice onto itself. Lesson §B's shape exactly.

⚠ **THE NUMBER THAT MATTERS IS THE ONE NOBODY WOULD HAVE LOOKED FOR — torn adjacencies.** No
cells are lost, every count agrees with itself, and the house has holes in its walls. A residual
alone reads as *half a cell, close enough*; 12-of-90 broken neighbours is not close to anything.

⚠ **AND THE ONE ODD ROW IS EXPLAINED RATHER THAN LEFT TO BE MISREAD.** 90° loses two cells and
270° loses none, which reads as a defect in one of them. Both have the same **six boundary ties**;
at 90° the deterministic round sends two of them the same way. **The two rows differ by a rounding
convention, not by an angle** — measured with a second instrument added for exactly that question.

⚠ **THE FLOAT INSTRUMENT IS HELD AGAINST AN INTEGER ONE BEFORE IT IS BELIEVED** — at the six exact
headings the rotate-and-snap must land every cell exactly where `hex_field::cell_rot` puts it, and
the turn DIRECTION is measured rather than assumed (`lattice_rot60`'s comment says
counter-clockwise, `moros_map`'s says `cell_rot` turns clockwise).

**What changed and what did not.** `FACINGS` stays **24** — the record is the heading an author
*asked* for, and one heading space shared with the runs is worth having. `expand`/`bake` now name
the measurement in their refusal instead of promising `A4.4` will implement it. ⚠ **Applying the
SIX is not done**, and it needs a lattice rotation `hex_part` has no dependency for (its
`loft.toml` forbids one, on a premise that has since moved — the package now contains the placer).
⚠ **Open, and NOT a lattice question:** `moros_map` has twelve exact *placements*, six turns plus
six **flips**; a flip is a mirror, so a house at a 30° hour has its door on the other side.
Whether a part may be mirrored to reach those six is an authoring call.

**`A4.1`, `A4.2` and `A4.3` are done.** `lib/hex_part/src/sock.loft` carries `SOCK` (the joints a
part offers) and `FITS` (the one it goes into); `src/fit.loft` answers `socket_fit(frame, leaf)`
and `parts_for_socket(root, frame)`; `src/bind.loft` carries `BIND` and resolves a joint. Both
`expand` and `bake` derive a bound part's position. `hex_part` 101 → **157**.

⚠ **§P3 IS MEASURED NOW, AND ITS MECHANISM IS AN ABSENCE.** Move a door-frame instance from
`(3,0)` to `(4,2)` with the binding **untouched**, and the door goes with it — because a binding
stores no coordinate, so there is no second position to forget. That is asserted *as* an absence:
the `BIND` bytes are byte-identical across the move, with the `INST` bytes differing as the
control. ⚠ **A `bd_q` added later "for convenience" would end the design without failing any
test that only looks at where cells landed**, which is why that test exists.

⚠ **`A4.1` HAD TO BE AMENDED, AND THE GENERAL FORM IS WORTH MORE THAN THE FIX.** It gave the
socket name the tail of the line and a test asserting a **comma in it survives**. A `BIND` record
is `<instance>,<socket name>,<part handle>`; the handle is a FILE PATH so it must take the tail,
which puts the socket name between two commas. **A field's freedom depends on whether anything
ever REFERS to it, and that is not knowable when the field is designed.** `A4.1`'s own rule
already covered the case — *a token spelled identically on both sides of a joint is one we mint
and may restrict* — the field simply had no referrer yet. The multibyte half of that test stays;
only the comma went. ⚠ **Second half: no two sockets on one part may share a name**, or
`socket_index` answers with the first, silently, for ever.

⚠ **`bake` HONOURS BINDINGS TOO, AND SKIPPING IT WOULD HAVE BEEN SILENT.** `A3.3`'s
`expand == bake` is the strongest test in the design and **its fixtures have no bindings**, so
teaching only `expand` would have left every test green while the two paths disagreed about every
bound leaf. Measured: `bake` with its binding loop disabled costs four tests. The socket LOOKUP
is shared (`socket_for_binding` — where `A4.2` finally gets its consumer); the COMPOSITION stays
separate, world coordinates against part-local, which is the line `A3.3` actually draws.

⚠ **`socket_index` ANSWERS `-1`, NOT NULL** — a nullable index invites `?? 0`, which is a *valid*
index and would bind to the first socket whenever the named one is missing. Sabotaged to `0`: a
misspelled socket resolves and a socketless part reports the wrong refusal.

⚠ **A SOCKET HANDING OUT A NON-ZERO HEADING IS REFUSED, NOT EXPANDED FLAT** — `pi_facing`'s rule,
and `A4.4` is where the heading gets applied. `socket_heading` maps an edge to `sk_at * (FACINGS
/ EDGES)`; the division is exact and tested, but **which** heading an edge points at is untested
because only `edge 0 → 0` is ever exercised.

⚠ **A STRUCT NAME IS GLOBAL ACROSS A CONSUMER'S WHOLE DEPENDENCY GRAPH, AND A PACKAGE SUITE
CANNOT SEE IT.** `A4.2`'s answer was called `Fit`, which is what the plan sketches — and
`hex_editor::gesture` already has a `Fit`. The two merged and `make parts` stopped with *cannot
assign text to field `Fit.sf_code` of type integer*, while **`hex_part` alone was 131 green**.
Only a consumer build finds this. `hex_editor::names` hit the identical wall and answered with
`NameFit`; the answer here is `SocketFit`. ⚠ CLAUDE.md's *grep the sibling before adding a public
name* is the same rule and it is **not only about siblings** — it holds inside this tree.

⚠ **AND THE COLLISION WAS THE FINDING, NOT AN OBSTACLE.** `hex_editor`'s `Fit` splits parameters
into ORDINAL and NOMINAL — *"255 is not 'nearly' 256 … offering it reads as a small correction
while changing what the wall is made of"* (`X68`). **A size class is nominal by exactly that
argument**, which `A4.2` had already concluded from §P3's own examples before the build broke.
Two independent routes to one answer, and the name clash is what joined them up.

⚠ **SO §P3's *"a leaf too wide is refused with … the NEAREST leaf that fits"* COULD NOT BE BUILT
AS WRITTEN.** Its three examples are `door/2x3`, `pillar/round-3`, `statue/plinth-2` — one reads
as a width by a height and two do not, so *wider* is undefined over two thirds of the design's
own vocabulary. Built instead: the refusal carries **the frame's actual class**
(`sf_offer`, spelled `door/2x3`), and `parts_for_socket` names **every** part in the library that
fits. ⚠ **The opacity is what enforces §P3's own *"not silently scaled"*** — given `2x3` and
`2x4` as numbers, some later caller finds *close enough* irresistible. `02x3` does not fit `2x3`,
pinned, so the coercion cannot land quietly.

⚠ **THE "EDGE-OR-HEADING" SLOT IS TWO FIELDS AND §P3 SPELLS IT AS ONE.** Six edges and 24
headings overlap, so `edge 3` and `heading 3` are different joints that would be the same bytes.
Measured: with the mount dropped they encode identically and five tests go red. ⚠ **And the range
check follows the mount** — a flat `0..24` accepts `edge 6`, which is not a side of a hexagon; the
control is the pair, refused under one mount and accepted under the other.

⚠ **THREE TEXT FIELDS AND ONLY ONE TAIL, so `A3.1`'s name-comes-last rule does not reach.** What
separates them is who mints the name: `pi_part` is a FILE PATH and the filesystem decides what may
be in one, so a comma had to be made harmless. A `kind` and a `size` are tokens **we** mint,
spelled identically on both sides of a joint or there is no joint, so they bear an alphabet and
refuse outside it. ⚠ **`FITS` refuses a comma it has no separator for**, because a token it
accepts and a `SOCK` refuses is a class that can be CLAIMED and never OFFERED — the leaf saves,
the frame will not, and nothing connects the two refusals. (⚠ The socket NAME kept the tail here
and lost its comma at `A4.3` — see above.)

⚠ **THREE REJECTIONS, ONE BEHAVIOUR — measured.** Deleting **both** of `parts_for_socket`'s
guards leaves all 131 tests green: a failed load and a malformed section both arrive as
`PartFits {}`, and `socket_fit` answers `SF_NOTHING` on an empty claim. They stay for a case no
fixture can pose (a store that recovered PART of a damaged file), and the code and the test both
say the coverage is not what it looks like.

⚠ **`part_file` MOVED TO `catalogue.loft`, AND IT WAS ONE FACT IN TWO SPELLINGS** — a literal
`.hxw` in `inst.loft` against `PART_EXT` three files away, so a change to either alone gives a
catalogue listing parts nothing can open. Breaking the tie again now costs **34 tests across five
files**.

✅ **`SOCK`/`FITS`/`socket_fit` ALL HAVE CONSUMERS NOW** — `A4.3`'s `socket_for_binding` reads
every one of them, and `expand`/`bake` call it. The *built and not called* trap is closed for
this arc. ⚠ **`part_anchor` is still tests-only**, and `A4.4` or `A5` is where a leaf's own anchor
starts deciding how it sits in a joint.

**`A3.4` is half done, and the half that is left is BLOCKED rather than skipped.** The depth
bound landed early in `A3.2`; what `A3.4` added is telling §P8's two rules apart. ⚠ **A CYCLE
REPORTED AS A DEPTH OVERFLOW** — `h/a → h/b → h/a` came back from both `expand` and `bake` as
*"nested 9 deep; the bound is 8"*, which is true and sends the author hunting for depth in a
library whose deepest nest is **two**, while `part_cycle` already knew the chain. Both now run
the cycle walk **on the error path only** and return `EX_CYCLE`/`BK_CYCLE` with the chain. ⚠ The
control that keeps the rules apart: a nine-deep nest with NO cycle must still report depth.

⚠ **THE CONSTANT WAS SHARED AND THE COVERAGE WAS NOT** — `A3.2` bounded and tested `expand`;
`bake` used the same `EX_MAX_DEPTH` with **no depth test at all** until here. A constant
reaching two callers is not two gates.

⚠ **AND §P8's *"checked on save"* STILL HAS NO CALLER**, exactly as in `A3.1`: no save gesture
exists until `A7.3`, so the server's startup sweep remains the only thing invoking
`library_cycle`. Writing the hook now would be a function with no caller, so `A3.4` stays ◐.

**`A3.3` is done, and its finding is about FIXTURES.** `lib/hex_part/src/bake.loft` flattens a
part and its nest into one `INST`-free part; `expand == bake` holds cell for cell over paths
that share only the part files and `un_origin`. ⚠ **THE FIRST FIXTURE COULD NOT FAIL.** `bake`
passed on its first run, so `un_origin` was replaced with the naive `cq + dq` **deliberately** —
and all 95 tests stayed green. A part placed at `(0,0)` makes the frame composition an IDENTITY,
so a one-level nest never exercises it. Three levels is the smallest fixture that bites: the
grandchild composes from `(2,1)`, where `un_origin` gives `(6,2)` and the naive sum `(5,2)`, and
the sabotage then fails at `cell 5,2: 1 cells vs 2`. The test was **seen red before it was
trusted**. ⚠ `A4.3` composes frames the same way and needs the same depth in its fixture.

⚠ **AND THE TWO PATHS ARE KEPT APART DELIBERATELY** — `expand` stamps per part at composed WORLD
coordinates merging into terrain, `bake` accumulates columns in a keyed table at PART-LOCAL
coordinates and writes each once into an empty part. A `bake` that called `expand` into a
scratch world would have made the equivalence two calls to one function agreeing with itself.
The table is there because `world_set_column` REPLACES and two parts may share a column — a door
in a wall — so cells accumulate in height order instead of last-writer-wins.


**`A3.2` is done, and it retired `I1`.** `lib/hex_part/src/expand.loft` derives an instance's
cells and everything nested under it; `hex_part` is 84 tests. ⚠ **A DERIVED CELL CARRIES NO
LABEL.** The `INST` records are the authority (§P4), so re-deriving is REGENERATION — discard
a region's derived cells and rebuild from the list — and never lookup. Nothing asks which
cells belong to which instance, so nothing needs to name them. An instance's identity is its
position in the list, which is what `A3.1` said when it refused an identity field.

⚠ **MEASUREMENT IS WHAT RETIRED IT, and the first draft had it backwards.** That draft minted
one label per nested part, on §P4's old sentence *"a layer that carries the instance's own
label"*. Measured on one chunk of ground: **30 placements → +1 layer, 2 distinct labels,
`w_tau` 30**, and staggering the heights by 10 changed nothing — a layer is a per-chunk
**sheet with one cell per column**. So twenty-nine placements had no label, which reads as a
defect only if the cells need addressing. What DOES cost a layer is vertical overlap in one
column: **8 stacked → +8 layers, 64 KB**. Storage tracks stacking, `w_tau` tracks placements,
independently. **No incremental re-derivation is intended** — that decision is what §P4 now
rests on, and if a scene ever needs the patching kind, the identity question reopens.

⚠ **AND `part_stamp` WAS REPORTING A LABEL THE STORE HAD NOT KEPT** — `ps_label: 2` while the
only layer carried `1`, because a chunk's first terrain layer is the outdoors and takes
`LABEL_GROUND`. It now reads the label back and reports `0` with `ps_ground` set. That still
matters to `bake`, which destroys the record and has nothing else to hold on to. `A3.1`'s seam
test missed it because its fixture builds two layers per chunk — a fixture that cannot pose
the question is not evidence.

⚠ **THE DEPTH BOUND WAS TAKEN IN `A3.2`, NOT `A3.4`.** Nine refused, eight accepted, both
green. `expand` IS the renderer §P8's second rule is about, and the failure it prevents is a
hang. `A3.4` keeps the on-save check and the cycle sweep.

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

**[#17 parts](https://github.com/jjstwerff/moros/issues/17)** — **`A1`, `A2`, `A3`, all of `A4`,
`A5.1` and `A5.2`'s state half complete** (`A3.4` ◐, blocked on there being no save gesture until `A7.3`). `A1.1` region
copy, `A1.2` round-trip and `part_diff`, `A1.3` store sections, `A1.4` `PART`/`ANCH`, `A2.1` the
cottage on disk, `A2.2` the stamp and the wire, `A2.3` one placement path, `A3.1` `INST` and the
cycle check, `A3.2` expand, `A3.3` `expand == bake`, `A3.4` telling §P8's two rules apart, `A4.1`
`SOCK`/`FITS`, `A4.2` `socket_fit`, `A4.3` `BIND` and the derived position, `A4.4` the heading
measurement, `A5.1` the hinge, `A5.2`'s state half. **`A6.1` is next** — a `MESH` section over the
existing `21:`/`22:`, and it is also what unblocks `A5.2`'s picture. ⚠ Still true: no part in this
tree has ever been placed TURNED, and no leaf has ever been DRAWN ajar — `expand`/`bake` apply
facing 0 only, six of the 24 headings ever can be, and a cell leaf has two positions in a door's
whole swing.

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
