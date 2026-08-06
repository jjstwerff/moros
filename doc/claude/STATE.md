# STATE.md — where the editor work stands (2026-08-06)

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


## ⏭ PICK UP HERE (2026-08-06, session 13) — plan 18 COMPLETE, plan 17 through `A7.3f` — **A7.3 COMPLETE**

`make gate` **44 green** · `make lib-test` **2632, both backends** · `make parts` green
(`data/parts/` byte-identical, all six files) · `npm test` **53** · layering silent. All measured
**2026-08-06 12:34 on the loft installed at 10:40** (`bd911fa1`), with the binary's hash stamped at
every stage and unchanged throughout. `cache` was a startup miss in the suite and passed **alone**
with `agree 24 bad 0 layers 42` — `bd41374b`, branch `tuxedo-catalogue`,
`c73eb1c3` — in **one pass, no reruns**, which is itself the loft#777 fix showing: no cache clear,
and the single warm start before the suite was the only preparation. ⚠ **SIX BUILDS LANDED IN ELEVEN HOURS** — `b619b909` 00:26, `9dfd0280` 00:33,
`bd41374b` 08:57, `cf6ccd53` 10:04, `bd911fa1` 10:40, and the sibling's head moved again at
10:44 — and `loft --version` says `2026.8.0` for every one of them, so **the version string
cannot tell two installs apart; `sha256sum /usr/local/bin/loft` can.** What that build changed for us is
measured below.

⚠ **AND THERE IS A FOURTH FACE OF THE GATE FLAKE, WHICH ONLY APPEARS AFTER A LOFT INSTALL.**
The first suite run on a new toolchain was **25 pass, 2 fail, 14 `SERVER NEVER LISTENED`**; the
second, with nothing changed, was **40 of 41**. The cause is in each gate's own log and is not a
timeout in disguise: `cdylib loft_web rebuilt: cached artifact rejected (stamped loft-ffi
fp=none != current fp=…)`. Every gate server rebuilds a **Rust** cdylib inside its 60-second wait
for `listening on port`, four at a time, on a box already at load 13. **Warm it once after any
loft install** — start one server, let it build, stop it — then run the suite. A first run on a
fresh toolchain measures the compiler's cache, not the tree. ⚠ **This is the LAST cold-cache trap
standing**: the `native-auto` half of it went with loft#777.

⚠ **`walk` failed the warm run with `{"frames":0}` and passed ALONE with 38 frames**, which is
STATE's own third face and is why running the failure alone is not optional: `0` says *nothing
happened*, not *the wrong thing happened*.

**What the 08:57 build changed for us, measured rather than read.** ✅ **loft#781 is FIXED and
verified here** — the copy notice landed 29 of its 67 rows on a comment, a blank line or a `const`
in the WRONG FILE, and it is now **67 rows, 0 misattributed**, each naming the library the copy is
actually in. ⚠ **Their fix went further than the report**: the same `fallback_file` mistake sat in
`warn_dead_stores`, which is a **warning** rather than advice — and a warning gates a library's CI
under `LOFT_DENY_WARNINGS`, so a dependency's dead store could fail a consumer's build at a line
holding a `const`. ⚠ **AND THE MEASUREMENT NEARLY WENT THE OTHER WAY**: diagnostics now carry a
CODE, so the prefix is `advice[avoidable-copy]:` and a grep for `^advice: copy of` returns **zero**
— which reads as *the notice is gone* rather than *my pattern is stale*. This tree's own rule, on
its own ticket: **match a line you know is there before believing a count of zero.**

⚠ **A SUITE TAKEN ACROSS AN INSTALL SWAP IS NOT A RESULT, AND ONLY A HASH AT BOTH ENDS SAYS SO.**
A run started on `cf6ccd53` finished on `bd911fa1` — a build landed while the gates were going,
invalidating the `loft_web` cdylib underneath them — and reported **12 `SERVER NEVER LISTENED`**,
which reads as twelve broken gates. Three of the twelve logs name the rebuild. **Stamp
`sha256sum /usr/local/bin/loft` at every stage**; when the toolchain is being rebuilt every few
minutes, that is the difference between a failure and a moving target.

⚠ **AND INSTRUMENTING THE PIPELINE BROKE WHAT THE PIPELINE MEASURED.** Adding the stamp put a
command between `make gate` and `echo "GATE rc=$?"`, so `$?` reported the STAMP's exit code: the
summary said `rc=0` for a run whose own log ends `make: *** [gate] Error 123`. A green line over a
red run, introduced by the fix for the previous instrument problem. Capture the code on the line
after the command, before anything else runs.

⚠ **THE DIAGNOSTIC OUTPUT SHAPE HAS CHANGED IN TWO CONSECUTIVE BUILDS, AND TWO OF OUR TOOLS GREP
IT.** `08:57` added the `[code]` bracket; `10:04` (`@PLN131`) trimmed every message's *what to
write instead* into an opt-in `--explain` fix line and added one `note: N diagnostics above
suggest…` per run. **Checked rather than assumed, because a miss here is silent**:
`tools/run-gates.sh:75` filters `^advice`, which still matches the coded form, and
`Makefile:420` greps `^error:` to report a `make parts` failure — errors are still UNCODED, so it
still fires. The Makefile's own comment says a silent failure there is *"a gate you cannot act
on"*, which is exactly what a coded `error[…]:` would have made it. **Re-check both after any
install that touches diagnostics.**

The census on `src/editor_server.loft` today, as a baseline: **39 warnings · 167 advice** (67
`avoidable-copy`, 100 uncoded) **· 1 note**. Nothing here sets `LOFT_DENY_WARNINGS`, but loft's
unified library CI does, so 39 is the debt if a package of ours ever goes through it.

**What the 00:33 build changed, still true**: `b = a` still COPIES and
`c = v[0]` still ALIASES (loft#774's asymmetry stands, now as a decided rule — `@PLN130` F7,
*"`&` is the aliasing spelling"*); **loft#772 is FIXED** (a `&` parameter reassigned from a local
compiles and the caller sees the value) while the tracker still reads OPEN; the new
`B-Ref-Reshape` refusal cannot reach us — there are **zero** `.remove(` calls in `lib/`; and the
copy notice is **default-on**, 67 rows over `src/editor_server.loft`, of which **29 point at a
comment, a blank line or a `const` in the wrong file**
([loft#781](https://github.com/loft-lang/loft/issues/781), filed). ⚠ **The "drop the `&`" lint is
back at 4 sites, all `wld: &World`** — the exact class loft#760 burned; not touched.

✅ **loft#777 IS FIXED — MEASURED 2026-08-06 ON THE 08:57 BUILD, AND THE `rm -rf lib/*/native-auto`
DANCE IS OVER.** A body-only edit under `lib/` used to be invisible to `src/editor_server.loft`
while an 8-line consumer saw it, because `lib/*/native-auto/*.so` served the stale build and did
not self-clear. Re-measured with the same decisive experiment — warm the cache on the new binary,
sabotage `hex_part`'s fence, run WITHOUT clearing — and the sabotage bit immediately; restoring it
bit too, which is the control a one-way fix would fail. ⚠ **This also ends the collision it caused**:
clearing the cache and going straight to `make gate` gave 4 `SERVER NEVER LISTENED`, because each
gate then rebuilt the packages inside its 60-second wait for `listening on port`. Neither the clear
nor the warm-up is needed any more. ⚠ **A LOFT INSTALL STILL NEEDS THE WARM-UP**, for the different
reason below — the `loft_web` cdylib.

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
job count. ⚠ **AND ONE FACE OF IT WAS OURS, NOT THE RUNNER'S.** `part_fence` and `part_check` passed alone
and failed at `GATE_JOBS=4` because they waited a fixed 1.8–2.5 s for an acknowledgement rather
than polling for it — a gate that sleeps reports the machine. Ack-driven, they are also **faster
when the box is idle**: 58 s → 21 s and 34 s → 11 s. ⚠ **Write a new gate that way**; a fixed
sleep is a flake waiting for a busy afternoon.

⚠ **AND THERE IS A THIRD FACE, in the CHARACTER gates**: `walk` and `hipskin` failed
together at `GATE_JOBS=4` with `{"frames":1,"bodyMoved":false}` — one frame in the whole run, so
the simulation never ticked while four interpreted servers shared the box. Both passed **alone**
on the same build, in 12 s and 8 s. The tell is the same as the other two: a number that says
*nothing happened*, not a number that says *the wrong thing happened*.

| | | | |
|---|---|---|---|
| `hex_editor` **235** | `hex_world` **120** | `lavition_ui` **65** | `hex_part` **253** |
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

### The next thing to do is #17 `A5.2`'s renderer half, or `A7.4`

**`A7.3` IS COMPLETE — a–f, and a part can now be opened, edited, referenced, jointed, saved
under a name that did not exist, and placed, without touching loft.** `f3` added `46:` — bind,
swap, unbind — and `A4.2`'s `socket_fit` reaches an author for the first time, naming what a
socket **takes** rather than what was wrong with the offer.

⚠ **§P8's CYCLE CHECK WAS BLIND TO BINDINGS, AND IT IS THE FINDING OF THE STEP.** `walk`
descended instances only, while `expand` and `bake` both derive a bound leaf's cells — so a part
reachable through a socket was not *contained* as far as the check was concerned. Measured: a
part bound into its own socket answered **`CY_OK`**, and the renderer met it as *"nested 9 deep;
the bound is 8"*, which is exactly the depth-overflow-standing-in-for-a-cycle that `A3.4` spent a
step removing. It held for one edge kind and not the other because nothing could author a
binding until now. ⚠ **The check could not be fixed in place** — `bind.loft` already calls
`part_instances`, so `inst.loft` reading `part_bindings` makes them mutually dependent and loft
resolves a package's files in declaration order. It lives in `cycle.loft` now, after both, which
is where the whole graph is visible. ⚠ **`part_cycle_of` gained a REQUIRED fourth argument**, so
the compiler makes all seven call sites face the half that was blind.

⚠ **A BOUND LEAF IS NOT DRAWN, AND THAT IS MEASURED RATHER THAN OVERLOOKED.** Both parts in the
library that fit the plinth's socket are mesh-only — `prop/statue` and `prop/seated` have **0
columns** — so an expansion delivers them as `ex_meshes` and `f1`'s display world is a `World`,
which has nowhere to put a mesh. The gap predates `f3` (`A5.2`'s renderer half, `A6.2`'s *a mesh
is not on the lattice*), and no gesture can author a `FITS`, so a cell-bodied leaf that fits
cannot be made from the editor either. **This is the strongest argument for `A5.2`'s renderer
half being next.**

### `A7.3f` is three steps, and `f1`/`f2` are done

**`A7.3f1` is built: a part inside a part is a REFERENCE, and you can see it.** In part mode
`14:<roof>,<part>` writes an `INST` instead of being refused — the same message, with the MODE
deciding what it means, which is `A7.3c`'s rule and not a new one. §P8 is checked on the
gesture, so a part given an instance of itself is refused with the chain while the author's
hand is still on it. `part_inst.mjs` 21 checks, four sabotages seen red.

⚠ **WHAT SAVES AND WHAT DRAWS ARE NOW TWO STORES**, and that is forced by §P4 rather than
chosen: the authored part holds an `INST` and no cells for it, so the client is shown a DISPLAY
world — the authored one copied, with every instance expanded into it. Expanding into `wld`
itself is the corruption `A7.3b`'s fence existed for. ⚠ **The cache and the mesh come from the
same store**, or `S3`'s checksum reports it as a *cache* disagreement naming nothing about
instances.

⚠ **THE EDIT CLOCK IS BLIND TO A SECTION WRITE — MEASURED, AND IT HAD ALREADY BROKEN
SOMETHING.** A part loads at `tau 20`; an `INST` write leaves it at **20**, a `PART` write at
**20**, one cell write takes it to 21. `w_tau` counts writes to the store's CELLS, which is
what makes it exact as a cost measure and useless as *did anything change*. It cost this step
an hour (the display trigger watched the clock, so the picture never moved while every
acknowledgement said it had) and it had ALREADY been wrong in the close: an author who placed
an instance and nothing else was told **`0 edits discarded`** and then had it discarded.
`hex_world::world_sections_key` is the other half and has both consumers. ⚠ **Anything that
asks *has this changed* about a part must ask BOTH.**

`f1` the gesture that makes a reference ✅ · `f2` the joints read back ✅ · `f3` the `BIND`
gesture, where `A4.2`'s `socket_fit` finally reaches an author and `A5.2`'s leaf gets somewhere
to hang. The per-step record is
[plan 17 § *What `A7.3f2` turned up*](../../plans/17-parts/README.md).

**`A7.3a`–`A7.3e` are built: a part can be opened, edited, saved under a name that did not exist,
the save is checked, and the library follows while the editor watches.** `A7.3e` is the acceptance
test for the whole plan — *a house authored end-to-end without touching loft* — and it found
**three live defects, two of them silent data loss**, none of which any existing gate could see:

- ⚠ **a save into a family that does not exist reported success over a file that was never
  created.** `8:newfam/thing` answered *"saved — 1 chunks, 2 sections"*, renamed the subject line
  and re-anchored the edit clock; `file()` on a path whose directory is missing hands back a
  usable handle, the writes go to **stderr**, and `world_save` returned `WS_OK`. Now
  `hex_world::WS_IO` — the file's length compared against the format's own `SZ_*`, which also
  catches a truncated write that `exists` reads as a good save — and the editor makes the family
  directory, because *did the bytes land* is the library's question and *which directories exist*
  is the consumer's.
- ⚠ **a name the catalogue can never show was accepted.** `8:a/b/c` landed on disk and
  `part_list` walks **one level** — in the library, in no catalogue, placeable by nothing.
  `hex_part::part_name_ok` is the inverse of the lister, and it subsumes the `..` fence three
  handlers each spelled out.
- ⚠ **a save-as carried the ancestor's `PART.name`**, so `house/annexe` announced itself as
  *'cottage'* at every placement and two catalogue rows claimed one name.

`part_new.mjs` 33 checks, four sabotages seen red · `world_file_size` 3 tests · `part_name_ok`
5 tests. The per-step record is [plan 17 § *What `A7.3e` turned up*](../../plans/17-parts/README.md).

**How the mode works, in one paragraph.**
`44:<name>` opens a part as the store the gestures reach and `44:` closes back, with the world, the
renderer's nine registries and the feet held aside by assignment. The fence refuses
`14:<roof>,<part>` (a part inside a part is a reference, not a stamp), `18:` and `21:` (state the
mode does not hold aside) and `9:`; everything else still edits. `8:` routes by mode and writes
`parts_root()/<name>.hxw`, sections and all, with an empty payload meaning *the part that is open* —
after §P8's check, **before** the write. `part_mode.mjs` 31 · `part_fence.mjs` 17 ·
`part_save.mjs` 19 · `part_check.mjs` 18 · `save_edit.loft` 6 · `part_cycle_of` 6, seventeen
sabotages seen red across them. `8:<newname>` writes a part that did not exist, makes its family
directory if it has to, and gives it the leaf of that name as its own — and a name the catalogue
could not list is refused before anything is written (`A7.3e`).

✅ **`A3.4` IS CLOSED.** §P8's *"checked on save"* has its save, and it needed a function `A3.4`
could not have written: `part_cycle` walks a part that is on DISK, which is the version a save
replaces, so the check a save needs is about the content in memory **under the name it is about to
take**. `part_cycle_of` seeds the path with that name. ⚠ And the cycle is reachable with no
instance gesture at all — `prop/shrine` saved AS `prop/plinth` is a part that contains itself.

**`A7.3` is six steps** — [plan 17 § `A7.3` broken down](../../plans/17-parts/README.md#a73-broken-down-and-the-probe-that-shaped-it):
✅ the store swap and the subject (`a`), ✅ the fence (`b`), ✅ the save (`c`), ✅ the save check
(`d`), ✅ a part that did not exist before (`e`), the joints (`f`). `A7.4` (keyed reads) stays deferred
until a number says it hurts; `src/part_build.loft` prints the cost every run.

⚠ **THE OWNER GUARD IS NOT IN, AND THAT WAS MEASURED RATHER THAN ASSUMED.** `world_save_as(…, port)`
stamps an owner field INTO the file, so saving a part nobody edited rewrites its bytes and leaves a
diff `make parts` then reverts. `X2` is the right idea for a shared library and the wrong trade at
this size; what it wants is a save that knows whether anything was authored.

⚠ **`A7.3f2`/`f3` ARE WHERE THE JOINTS GO ON THE WIRE.** `parts_for_socket` has been built and
tested since `A4.2` with no consumer, and `A7.1` deliberately did **not** send `FITS`/`SOCK` — a
message no client reads is this tree's own trap. The first gesture that BINDS something is what
earns them. ✅ **`A7.3b`'s fence is already gone**: `14:<roof>,<part>` in part mode writes an
`INST` (`f1`), so the reference exists and what is missing is the joint it hangs on.

**One step is ◐ rather than done, and what is left of it is now ONE thing:**

- **`A5.2`** — its state half was done, and **the record half landed 2026-08-06**. It was never
  blocked on a number but on a FIELD: `ma_facing` is a turn about the part's origin about the
  vertical, while a hinge carries its own POINT and its own AXIS — a trapdoor turns about a
  horizontal one — so folding `bd_open` into `ma_facing` would swing every door about its centre.
  `MeshAt` carries the hinge and `ma_swing` now. ⚠ **The hinge is the PART's and the angle is the
  BINDING's**, which is what made it free: the expansion that opened the leaf stamps the hinge
  while the world is in hand, and the angle comes from `sa_offer` — the value
  `socket_for_binding` has already fenced, so the number checked and the number drawn are one
  number. ⚠ **A zero axis is *not hinged***, which is `hinge.loft`'s own `HG_AXIS` rule rather
  than a new sentinel.

✅ **AND THE DRAWING LANDED TOO (2026-08-06).** `hex_part::mesh_swing` turns a leaf on its own
hinge, `posed_mesh` adds the socket's aim and the lattice position, and the display rebuild
broadcasts the result into the reserved low mesh block (eleven slots, and the cap says what it
drops). ⚠ **THE OPEN PART WAS LOSING ITS OWN BINDINGS**, which is the bug the picture found and
no test would have: the rebuild walked `part_instances(wld)` and expanded each one, so every cell
derived correctly and **every bound leaf vanished** — a binding belongs to the FRAME, not to the
instance it hangs on, and nothing refused because nothing was asked. `part_expand_of` is the
in-memory entry, the same shape `part_cycle_of` needed for the same reason: the library's entry
takes a NAME and a gesture holds a WORLD.

⚠ **THE LIBRARY HAD NO HINGED PART AT ALL**, which is why this half could not be SEEN however
finished it was — `swing_fit` had been fencing an angle since the state half with nothing in
`data/parts/` declaring a hinge for it to fence. `door/oak` (hinged down one edge, not through its
centre — which is the wrong composition's own picture), `door/frame`, `door/doorway` at 0.125 of a
turn.

⚠ **AND ADDING THAT FAMILY TURNED A GATE RED, WHICH IS THE GATE WORKING.** `part_new` asserts the
part it authors **sorts first** — that is what makes *every row was re-addressed* mean anything —
and `door/` sorts before `house/`. The name moved to `aaa_annexe/wing`, and the two checks that
spelled a leaf name out now derive it from the constant, because a second spelling of one fact in
a gate about *a part carrying its own name* is the joke telling itself.

### ⚠ THE NEXT ARC IS `A8` — §P9, and it overturns §P5's second column

**Decided with the user 2026-08-06.** ⚠ **The rule is *nothing NEEDS a custom mesh*, not *nothing
may be one*** (§P9.3, corrected the same day). A `.glb` stays a first-class body — `21:` IMPORT,
kit-bashing and finished art are all legitimate. What the design requires is that a part be
authorable **end to end inside the editor**, with the gestures that build a house and nothing
else: a mesh is an UPGRADE to a part, never a prerequisite for one. ⚠ **The driver is RAPID
PROTOTYPING** — a gesture round-trip is seconds inside one tool, a modelling round-trip is minutes
and needs a second one — so the test is not *can a mesh be used* but **can the whole thing be
built without ever opening one**. §P5's table is RE-RANKED, not overturned. ⚠ And §P9's useful
half still holds: *how a part is attached decides how it is drawn*, so a cell leaf and a `.glb`
leaf hang in the same socket and swing on the same joint — **which is what makes the upgrade path
free**: author in cells, replace with art later, and the binding does not move.

Cells are the default — so a door leaf, a shutter and a gate are authored with the gestures that
build a house, because they ARE houses at another size. [PARTS.md §P9](PARTS.md) is the argument;
[plan 17 `A8`](../../plans/17-parts/README.md) is the five steps.

⚠ **THE LATTICE OBJECTION DOES NOT APPLY, AND THAT IS THE WHOLE DESIGN.** `A4.4` measured that a
body of cells has only six exact rotations, so a cell limb has two positions in a door's swing —
true, and it binds **only where cells must be written back to a lattice.** A limb never writes
into the world it hangs in; it hangs in space at an arbitrary angle. So a limb is **meshed, not
stamped** — its own chunks meshed the way `part_thumb_wire` already meshes a part for a thumbnail
— and posed on the joint continuously. Cells are the AUTHORING form, a mesh is the DRAWN one, and
which a part gets is decided by **how it is attached**, not by what it is made of.

⚠ **AND THE SAME DECISION BUYS THE RESOLUTION, WHICH IS WHY A DOOR CAN HAVE DETAIL AT ALL** (§P9.1).
A leaf is authored on a FINER lattice — many small hexes — and shrunk to fit the opening. That
works only because a limb is meshed: a stamped child is written into the parent's world and a fine
lattice cannot be written into a coarse one, while a limb is never written back, so the parent's
hex size is not a fact about it. ⚠ **The scale is DERIVED, never authored** — a part is a world and
a world has `w_unit`, so the ratio between child and parent IS the scale, and a `scale` field
would be a second authority on a fact both files already state. ⚠ **A unit mismatch on the STAMPED
path must be a loud refusal**: it is the one shape that silently places cells at the wrong size,
every count agreeing and the geometry a quarter of what was meant.

⚠ **AND A FRAME IS TWO THINGS** (§P9.2): the OPENING is structure — the building's own coarse
cells, in the store, walked through — and the JOINERY (jambs, lintel, moulding) is a fine meshed
part that never needed to be in the store, because the wall beside the opening already does the
collision. Three different answers to *how detailed may this be*, each following from whether
anything must walk on it.

⚠ **AND THE ROUND TRIP IS THE POINT OF ALL OF IT** (§P9.4). Block out a leaf in cells, export its
mesh (`22:`, and a limb is already meshed to be drawn), hand it to a 3D artist, and point the
part's `MESH` at what comes back. **The `.hxw` is the CONTRACT and the `.glb` is the SKIN** —
`PART`, `FITS`, `HING` and `SOCK` all stay as authored, so the artist is handed geometry and
returns geometry and never touches a contract they could get wrong. `A6.3` already measured the
swap as a one-field edit; this is that finding arriving at a workflow. ⚠ **And the blockout's
cells are not thrown away — they become the COLLISION body**, which is §P5's *"a `.glb` for the
eye and a one-cell column for the walker"* finally having a use.

⚠ **AND THE EXPORT MUST BE AT FINAL GAME SIZE** (§P9.5). §P9.1 shrinks a fine-lattice limb at the
placement, so exporting its own frame would hand an artist geometry several times too big plus a
ratio to apply by hand — *"two units for one quantity is how a conversion goes missing"*. The
scale is applied BEFORE the file is written, and the hinge goes out in the same units or the pivot
does not survive. ⚠ **This is why the size cannot ride in the contract**: `A4.2` made the class
NOMINAL on purpose, so it says *which hole* and can never say *how big*. The class and the export
are complementary and both are needed. ⚠ **And a returned mesh is checked against the exported
extents** — refused with the difference, never quietly rescaled — with `mesh_aabb`, because a
thumbnail fits its camera per part and is structurally blind to size.

⚠ **AND THE DESIGN AIMS AT THE GATE.** A door narrow enough to be a door is **narrower than one
hex**, which is why cells had nothing to say about it and why today's leaf is a `.glb`. A two- or
three-hex gate has real width, so planks, rails and ironwork are expressible in what cells already
carry. The one-hex door is the degenerate case, not the shape everything is bent around.

⚠ **LIMBS ARE HITBOXES, WHICH IS THE SHARPEST ARGUMENT FOR ANY OF THIS — §P9.10.** A spectacle
fighter needs to know *which limb hit which limb*, so it needs per-limb volumes that follow the
pose. **A finished `.glb` is one skinned mesh and cannot give you that** — the hitboxes have to be
recovered afterwards, by hand, and usually badly — while a creature built as parts is ALREADY
decomposed. It is gameplay, not art, so it stays ours however much visual work goes out. ⚠ **And
§P9.4 was undersold**: for a door *the blockout becomes the collision body* means walk through it;
for a creature it means **each limb's blockout is that limb's hitbox, posed by the joint**, derived
rather than authored twice. ⚠ **The pieces exist in three packages** — the part-tree
(decomposition), `moros_sim::assembly`'s `ShapeKind`/`bd_girth` (proxy, already *"derived, not
inherited"*), and the joint plus a renderer that already poses a part-tree. ⚠ **AND THE SKIN EXCEEDS THE HITBOX, WHICH §P9.11 CORRECTS ME ON.** I wrote *"the skin must fit
the hitboxes"*; that is backwards. Every Bloodborne boss has cloth, hair, fire and flailing
appendages reaching well past what can be struck, and **the player learns which part is hittable**
— that is how a boss reads as enormous while the fight stays fair. The relationship is SUBSET, not
equality. So the check is not *extents match* but: **the hitbox stays INSIDE the skin** (a hitbox
in thin air is the real fault), **the pivot does not move**, and **the scale does not change**. ⚠
And what is hittable is a DESIGN decision per limb — a cape is a limb with no hitbox at all, which
`moros_sim` already spells as *"a girth of 0 means no shape declared, which is a real case"*. ⚠
That makes readability ours too: consistent hittability across a cast is what makes it learnable
rather than arbitrary.

⚠ **AND IT IS ONE PIPELINE, NOT TWO — §P9.9.** Almost everything falls into the same categories
either way: size, proportion, joint range, socket class, the part-tree, the blockout-as-collision,
the export at final size, a material per part. **The destinations differ in ONE field — where
`MESH` points** — so the choice is made per part, late, and reversibly (`A6.3`'s one-field swap at
project scale). A project can be MIXED — an artist on the five assets a player looks at, the
engine's own output for the other two hundred — and can SHIP FIRST and upgrade later without
touching a socket, a size or a binding. ⚠ **Which is why building for both is not double work**:
the export is simultaneously the shipped mesh and the artist's brief, written once.

⚠ **THERE ARE TWO DESTINATIONS AND THE INDIE ONE IS *SHIP AS-IS* — §P9.8, which amends §P9.4 and
§P9.7.** An indie game has real pressure to diminish the 3D artist's role, often to nothing, so the
engine's own output must be shippable as it stands. The hand-over stays available; it stops being
the assumed ending. ⚠ **What makes it work is CONSISTENCY, not detail** — a flat-shaded hex world
already has a coherent look, and a door built the same way matches by construction, which is what
makes a stylised game read as intentional rather than unfinished. ⚠ **And it explains a misreading
from `A5.2`**: the hand-written `box()` leaf looked wrong in the render and I blamed missing
detail. It lacked nothing — it was a *different kind of object*, a smooth slab among faceted
hexes. A cell-built leaf matches with no extra geometry. ⚠ **The smallest real gap is a MATERIAL
PER PART**: `prop_surface()` reuses `frame` for every mesh body, and `A6.2` already recorded that
*"a statue and a window surround are ONE bucket … separate them in the RENDERER when something
draws a statue in the world"*. Something does now, and a library whose every asset is one colour
is not shippable.

⚠ **THE DURABLE ARTEFACT IS THE SCALE — §P9.7, and it reorders the rest.** The designer's goal is
framing and relative scale, and they can work with **red blobs** throughout; the SIZE they set is
what everyone downstream builds against, and it is the one output here that cannot be regenerated.
So a blockout's job is to be dimensionally honest, not pretty. ⚠ **This corrects a day's work,
recorded rather than absorbed**: `A5.2`'s renderer half ended *"it reads as a panel at an angle,
not yet as a door"* with a note that the fix was a better `leaf_mesh()` — wrong worry. The leaf's
proportions and its swing were the deliverable and they were right; *looking like a door* is the
artist's hour. ⚠ **A size change arriving with new art is the worst bug this pipeline can have**,
so §P9.5's extent check is not a nicety but the guard on the only artefact that cannot be
regenerated. ⚠ **And relative scale cannot be judged from the catalogue**: `part_thumb_view` fits
its camera per part and is structurally blind to size (measured at `A6.3`), so it takes things seen
TOGETHER, at one scale, beside something known — which is why the walker figure belongs in a shot.

⚠ **AND THE GOAL IS THE ARTIST'S WORK SURFACE — §P9.6, which is what the rest of §P9 was
serving.** Self-contained was never about avoiding the 3D artist; it is about handing them a
surface they can start on immediately, so their expensive hours go on craft rather than on
reconstructing decisions somebody already made. What they get: **a `.glb` at final size with a
pivot in it**, plus limits in turns, a `FITS` class and a name — and a part file they never open.
⚠ **A MONSTER IS A GATEWAY**: a frame with limbs, same sockets, same joints, same export, same
blockout-then-skin. Doors are just the smallest case that has all the parts. ⚠ **And the
child's-frame hinge is what makes a LIMB LIBRARY possible** — an arm is swappable between
creatures exactly as a leaf is between frames (`arm/humanoid-2`, `head/beast-3`), with `A6.3`'s
one-field swap as the kit-bash, and a left arm and a right arm two ordinary parts with mirrored
axes rather than a handedness flag.

⚠ **THE JOINT ALREADY EXISTS TWICE.** `moros_sim::assembly::Link` is `hex_part::Hinge` with a kind
on it — offset, revolute axis, limits in TURNS — and `A5.1` says the hinge was modelled on it. The
walker is already five independently posed meshes beside a comment naming `hex_entity` as *"a
part-tree whose every part carries its own transform"*. A door leaf and an arm are one object. ⚠
Keep the document record where it is and DERIVE an assembly; a part file must not grow a
simulation record it cannot validate.

⚠ **`A5.2`'s gate is a COLD-RECOGNITION test and needs the user's eyes**, not a gate: *does a
person call it a door.* It cannot be reached until a leaf can be drawn ajar. Render it and hand
over the picture; do not claim it from a green suite.

### ⚠ The per-step record is in the PLAN, not here

[plans/17-parts/README.md](../../plans/17-parts/README.md) carries a **What `Ax.y` turned up**
section for every step — the findings, the controls, and what each sabotage cost. This file
carries only what is true *now* and what bites regardless of which step you pick up. The arc's
narrative is [JOURNAL.md](JOURNAL.md) § *Sessions 10–12*.

### ⚠ What bites regardless of which step you pick up

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
