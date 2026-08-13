# STATE.md — where the editor work stands (2026-08-09)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — eighteen sessions, newest first |

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**. ⚠ **The per-STEP record belongs
to the plan** — `plans/<n>-<name>/README.md` carries a *What `Ax.y` turned up* section written
when the step landed, and this file duplicating it is how it grows back.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ✅ GROUND_DEFAULT IS CLOSED — [#23](https://github.com/jjstwerff/moros/issues/23), 2026-08-13

All eight steps built. **The rule is normative now** — [WORLD_MODEL § `E1γ`](WORLD_MODEL.md),
*a world is an infinite plane of its ground `γ`, and storage holds only what differs from it* —
and GROUND_DEFAULT.md is a closure record pointing at it.

⚠ **CLOSING IT IS WHAT FOUND THE LIVE INCONSISTENCY, AND THAT IS THE ARGUMENT FOR CLOSING PLANS
AT ALL.** `E1` clause 3 of the contract still read *"reading an absent chunk yields exactly what
reading a stored all-zero one would"* — false since `G5` shipped, with every suite green the
whole time. **A plan is not closed while its rule lives only in the plan**, and the document
that is right *by definition* is exactly the one nothing re-derives, so nothing catches it
drifting.

`world_fill` is in `hex_voxel`, wired to five `hex_part` fixtures and 27 `hex_editor` loops, 15
equivalence tests in `lib/hex_voxel/tests/fill.loft`, `make lib-test` **3398 green on both
backends**, `make parts` byte-identical. Three more things belong out here, because none is
about a fill:

- ⛔ **A 14× ON THE OPERATION, NOTHING IN ONE SUITE AND −12.9 % IN THE NEXT.** `hex_part`:
  310 tests, 44.8 s → 45.3 s, noise. `hex_editor`, through its own `ground_fill`: **2,472,585 →
  2,208,143** samples for the flat fixtures and **→ 2,152,279** for the nine ramped ones, with
  −28.6 % on its fixture-heaviest file. **A win on a call is worth what that call was worth to
  the caller** — `hex_part`'s fixtures are a tenth the size and its tests write documents to
  disk; `hex_editor` re-lays a 2401-cell landscape per test in memory. The ramps say it twice:
  the **best** ratio on the fixture (3×) and the **smallest** effect on the suite. ⚠ **And the
  ratio was the wrong column throughout**: a fixture pays ~1200 us per CHUNK that neither write
  path avoids, and the plan's *"about 2×"* priced that as the subject.
- ⏭ **A SLOPED FIXTURE IS A STACK OF STRIPS** — every ramp in this tree is affine in one axis, so
  the height is constant along the other and no ramp primitive was needed. Worth knowing before
  anyone designs one.
- ⛔ **AND A BULK PRIMITIVE HAS A FLOOR: THREE CELLS.** loop ÷ fill is **73 %** at width 1, 80 %
  at 2, 107 % at 3, 231 % at 13 — so below three cells `world_fill` is a *pessimisation*, its own
  setup being the whole call. The last two fixtures lay roads exactly three wide and moved
  nothing. **The useful question about a bulk call is never *is it faster* but *how wide*.** One
  kept the fill because its loop discarded the write's return code; the other went back, because
  a fill there needed a manufactured constant — ⛔ **a rewrite that needs a new premise to be
  legal has to be paid for by the measurement.**
- ⚠ **AND THE WALL CLOCK SAID THE OPPOSITE — 2m04 before, 4m03 after.** Wrong *sign*, on a box
  shared with other agents' work. The sampler on the same tree, same file, same 28 runs, settled
  it. **A number that disagrees with the mechanism is a cue to change instrument** — not to
  believe it, and not to wave it away.
- ⚠ **A GUARD ON A RULE IS ONLY VISIBLE WHERE THE RULE'S ANSWER VARIES.** Sabotaging the `F1`
  hand-back left the obvious fold test green — its storey cleared the fill in *every* column, so
  the skipped check would have said *legal* each time. The test that sees it drops **one** of 64
  columns. Same shape as `faced_between` and `stroke_over_limit`, and now written down a third
  time.

## ⏭ LOFT'S SAMPLER, POINTED AT WHAT A TEST DOES — 2026-08-12

**`probe/perf/fixture.loft`**, and two instrument findings before any number is worth reading.

⚠ **THE PROFILER CANNOT BE POINTED AT THE TESTS.** `LOFT_PROFILE=1` arms on a program and on
nothing else — `loft test`, `loft test <name>` and `loft --tests <file>` all report **no
profile**, because `state.arm_profiler()` has one call site in `main.rs`'s program branch.
[loft#860](https://github.com/loft-lang/loft/issues/860). ⚠ **The variable is accepted and
ignored**, so an armed instrument reporting nothing reads as *there is nothing to see*.

⚠ **AND A `use`d LIBRARY IS A NATIVE CDYLIB THE SAMPLER CANNOT SEE INTO.** The first profile was
**172 samples naming three program functions**; the same run under `LOFT_NO_NATIVE_LIBS=1` was
**33,245 samples naming the library**. Not wrong — blind. **Set it, or you photograph your own
`main`.**

### ✅ AND THE ELISION SCAN IS GONE — `hex_editor`'s suite is 25 % smaller, 2026-08-12

**One change in `world_set_column_as` step 6**, a pure optimisation: the OR it computes is
unchanged, only how much of it is evaluated. `probe/perf/README.md` has the full record.

| | before | after |
|---|---|---|
| `hex_editor`'s suite | 5,210,109 samples | **3,896,879** — **−25.2 %**, same 424 runs |
| `write_cost.loft` | 516,072 | **287,924** — **−44.2 %** |
| step 6's scan line | 8.6 % of the suite | **absent from the table** |

**The invariant: a column write changes exactly ONE cell, `ix`.** A layer with content there is
live in O(1); the sweep is only needed to prove ABSENCE, the rare answer — and it stops at the
first present cell now instead of running to 1024 after the answer is known.

⚠ **THE SHORT-CIRCUIT HAD BEEN MEASURED IN AUGUST AND NEVER APPLIED** (*"116 → 98 ms"*, written
down and left). The `ix`-first half is what was missing: a `break` only helps if a present cell
comes early, and the touched cell can sit at index 1023.

⚠ **AND NOTHING TESTED ELISION AT ALL** — the only test counting layers was `storey.loft`'s,
counting them going *up*. It is invisible from outside: **a dropped layer and an undropped empty
one both read back as absence**, so only the bytes differ. `lib/hex_voxel/tests/elision.loft` is
the rule now — 5 tests, 2 sabotages red, one of them reporting silent data loss.

✅ **AND STEP 4 WENT TOO — the suite is HALF what it was.** `5,210,109 → 3,896,879 → 2,462,718`
samples, **−52.7 %** over the two steps, same 424 runs. `stored_present` 20.8 % → **5.9 %**; step
4's loop gone from the by-line table.

**Its invariant is STRUCTURAL rather than maintained**: `sv_height` is a **u16**, so every stored
cell is at `base + [0, 65535]` against a `WINDOW` of 65536 — no stored cell can be outside the
window **whatever wrote it**. That is what made the three other `ly_cells` writers need no audit:
the type will not hold a value that would break it. Only the incoming column can move the floor,
and its span is already computed.

⚠ **AND THE SABOTAGE PASSED — which is the finding.** Skipping the sweep *unconditionally* leaves
all five `window.loft` tests green, because **the sweep cannot change a decision**: it only lowers
`lo`, and it is entered only when `lo < base` while every stored cell is `>= base` — so `lo` is
always the column's own minimum, and when a rebase fires the column *is* the new floor. Its other
output, `hi`, feeds two comparisons that are **unreachable** (`Hex.h_height` is a u16 too, so no
tile can span 65536). ⚠ **The sweep is dead code today and is kept on purpose**: it is the guard
that becomes load-bearing the day a height field widens, and deleting it would be a subtraction
justified by a type. `lib/hex_voxel/tests/window.loft` pins the reachability fact so `CW_WINDOW`
stops being a branch nobody can explain.

✅ **AND `world_chunk_of` — A FLOOR DIVIDE BY A POWER OF TWO.** `v >> CHUNK_W_SHIFT` and
`v & CHUNK_W_MASK` replace a branch, a fallible division and a multiply.
**5,210,109 → 2,222,770 samples over the three steps: −57.3 %.** Both language properties it
rests on (`>>` sign-extends, `&` is the non-negative remainder) were measured on **both
backends** first, and `lib/hex_voxel/tests/lattice.loft` keeps the old bodies to compare against.

⚠ **AND IT BROKE THE EDITOR WHILE EVERY TEST STAYED GREEN.** The first spelling was
`CHUNK_SHIFT` — and **`src/editor_server.loft:174` already declares `const CHUNK_SHIFT = 3`**, an
8-wide MESH chunk. `hex_voxel` 151 green, `make lib-test` **3300 on both backends**, `make fast`
144 files, `make parts` byte-identical — and the editor program **would not build**, with **all
53 gates** reporting `SERVER NEVER LISTENED`. That is this file's own *"a package suite cannot
see this"* reproduced on the day it was read: **the grep the rule demands takes ten seconds and
was done after the gates went red, not before.** ⏭ The gates were the only instrument that saw
it.

## ✅ GROUND_DEFAULT `G4` — THE DEFAULT EXISTS, AND NOTHING READS IT YET — 2026-08-12

**[GROUND_DEFAULT](GROUND_DEFAULT.md) is the plan the profiling arrived at**, and `G4` is its
fourth step: `w_ground` on `VoxelWorld`, `world_set_ground` with `R1` checked, and a `GRND`
section in the codec. `G1` and `G3` were already built; `G2` and `G5`–`G7` remain.

| | |
|---|---|
| **absent means today, byte for byte** | `make parts` **byte-identical** · `make lib-test` 3300 → **3316** (8 new tests × two backends) · `make fast` 145 files · `make gate` 53/53 |
| the value is a **FIELD**, the section is only the **FORMAT** | `w_sections` says of itself that the library never reads it, so a `GRND` living there would be a second home *and* a tag no consumer wrote. The codec steers it into `w_ground` on the way in |
| `R1` is checked in `world_set_ground` | failure path 5 of the design: unrefused where the ground is **stated**, a value under the reserve surfaces in an unrelated chunk much later, when some layer inherits it |
| clearing is never refused | a cell with no material is not ground, so `Hex {}` is always legal — without that there would be no way back to *today* on a world whose reserve is above zero |

⚠ **A STEP NOTHING READS STILL HAS TO GO RED, AND THIS ONE DOES THREE WAYS.** Sabotaged: the
`R1` check removed (1 red), the codec not reading `GRND` back (3 red), the codec not writing it
(3 red). ⚠ **And the first sabotage run reported 0 for all three** — the harness `cd`'d to the
repo root, where `loft test` has no package, and a broken harness reports the same zero a vacuous
test does. The control row (unsabotaged → 0 failures) is what separated them.

⏭ **`G5` IS NEXT AND IT IS THE MODEL CHANGE**: the accessors synthesise the ground where a chunk
is absent, a write equal to the default does not allocate, and a layer equal to it everywhere is
dropped. ⚠ **`G5` before `G6`, never together** — the store answering for absent chunks and the
picture showing it are two causes for one wrong frame.

⛔ **`world_set_column_as` — TWO TRANSFORMATIONS, NO GAIN, NOTHING SHIPPED.** 7.0 % of the suite
and **no by-line row in the top fifteen** — the cost is spread, which is the shape with no single
edit. (1) Building the `StoredHex` only when the write is needed rather than before the
comparison: **−0.01 %**, 201 samples of 2.2 M. ⚠ The model was wrong — `empty_cells` is 6.8 %
because it allocates **1024 at once**, not because one record is dear. (2) Iterate instead of
index, the transformation that won in `world_ground_cell`: **broke six tests** (*"the clock did
not move for a CELL write"*) and ⚠ **I could not explain why** — three probes refuted the obvious
stories (element assignment through a binding propagates; nested field writes propagate; three
same-named `for` bindings in one function do not interfere). Reverted. ⏭ **The reason it resists a
local edit is the reason it is 7 %**: straight-line work over six steps, and the two steps with a
shape to exploit were already taken.

⛔ **`find_chunk` — A SOUND DESIGN, MEASURED WORSE, NOTHING SHIPPED.** A one-entry memo *checked
rather than trusted*: confirm the last chunk with `ck_cx`/`ck_cz` instead of re-deriving the key
and probing the hash. A stale index falls through, so **nothing has to invalidate it** — `N = 1`,
no silent failure. Written down with its failure paths and a falsifier first. ⚠ **It cost 2.9 %
instead of saving 1.5–3 %**: `find_chunk` went **3.8 % → 8.8 %**, the guard line alone 7.8 %.
Reverted; the op clock confirms it exactly.

Two reasons — **the guard is four conditions** over three field reads and a `len()`, where the
probe that priced it measured **two** compares with a literal index (⚠ *a probe of a simplified
version of the thing is a probe of a different thing*) — **and it mostly misses**, which was the
written falsifier. ⚠ Inlining `chunk_key` was measured too: **−0.74 %, not taken**, because it
would put the store's key encoding in two places, one reader against six writers.

✅ **And the probe found an ICE**: the wrong arity for loft's hash type panics the compiler
([loft#874](https://github.com/loft-lang/loft/issues/874), three lines).

✅ **AND `world_ground_cell` — ITERATE, DO NOT INDEX.** `w.w_chunks[ci].ck_layers[i].ly_id` walks
three levels for one field and the condition reads two, so an indexed scan pays **six**
navigations per layer where a loop binding pays two. Measured first: 200k scans, **369 ms indexed
against 229 ms iterated**. Three scans of that shape rewritten; **2,222,770 → 2,201,138, −1.0 %**.
⚠ The binding is a **reference, not a copy** — established from the rebase mutating through the
same form, not assumed, because a `Layer` carries 1024 cells. ⚠ **Predicted 1.5–2.5 %, delivered
1.0 %**: a by-line total is a budget for the *work at that line*, not for the improvement.

⏭ **AND WHAT IS LEFT IN IT IS NOT LOCAL** — `find_chunk` plus a four-level cell navigation, on a
function whose callers sample **neighbouring hexes of one chunk** in a loop. A one-entry memo of
*last chunk → (index, ground layer)* is the fix, and ⚠ **the chunk vector is REORDERED when an
emptied chunk is dropped**, so a stale memo is a silent wrong-cell read. A design with an
invalidation invariant, not an edit.

⛔ **THE FLAT BYTE BLOB WAS PROBED AND IT FOUND TWO LOFT DEFECTS INSTEAD OF A DESIGN.** The
load-bearing claim — *cells are cheaper as flat bytes than as 7-field structs* — could not be
measured, because the probe for it would not run:

- ⚠ **a comprehension yielding a RANGED integer stops terminating above SIXTEEN elements.**
  `[for i in 0..17 { 0 as u8? ?? 0 }]` does not finish; 16 takes 40 ms; 4096 plain integers take
  50 ms; the same bytes by **append loop** take 40 ms.
  [loft#871](https://github.com/loft-lang/loft/issues/871). **That is exactly how a flat-byte
  layer is built**, so route B reads as unworkable until you bisect the harness instead of the
  idea.
- ⚠ **and the append form is not a safe substitute for a comprehension.** It is **2.1×** faster
  for structs, so `empty_cells` did have a local win — worth **0.6 %** in the suite — and it
  **broke two dressing tests**. Four hypotheses for why were each refuted by their own probe
  (shared storage, intra-vector aliasing, scale, and the struct-field shape the store uses):
  identical values in every probe, different behaviour in the consumer.
  [loft#872](https://github.com/loft-lang/loft/issues/872). **Reverted** — 0.6 % does not buy a
  change to the store's core whose mechanism nobody can state.

⏭ **ROUTE B IS NOT REFUTED AND IS NOT READY.** Its arithmetic holds (one allocation instead of
1024, an encoder that becomes a copy, ≈ 33 % of the suite), but it cannot be built on the
comprehension and the append form is not safe here. **Both are upstream and filed; either landing
changes the price, and until then the design has no honest cost.**

⛔ **AND THE SURVEY BELOW WAS WRONG WHEN IT WAS WRITTEN.** The two
steps before it were exact identities (a missing early exit; a floor divide that *is* a shift);
this one builds 1024 records because **the structure says a layer has 1024 cells**. Checked
first: loft has **no** bulk/repeat/sized vector constructor (`OpPreAllocVector` is internal), all
four call sites create a layer that is then used, and nothing materialises before a refusal. ⚠
And the cost is **interpreter iterations rather than allocations** — `O(1024)` on every backend,
so unlike the two wins before it only the constant moves.

⏭ **IT IS A REPRESENTATION CHANGE, AND THERE ARE TWO, BOTH PLAN-SHAPED.** **A** — don't
materialise an absent chunk: that is [GROUND_DEFAULT](GROUND_DEFAULT.md), already designed, whose
ceiling here is 6.8 %. **B** — a layer's cells as a **flat byte blob**: one allocation instead of
1024, and **the byte layout already exists** (`world_to_bytes` writes exactly these seven fields,
so the encoder becomes a copy). B's reach is everything that walks cells one struct at a time —
`world_ground_cell` 8.4 % + `empty_cells` 6.8 % + `hex_of` 6.6 % + `stored_present` 6.4 % +
`crc32_of` 4.6 % ≈ **33 % of the suite**. ⚠ **Routed, not proposed**: it changes `ly_cells` for
every reader, the CRC and the serialiser.

⏭ **THE PROFILE IS FLAT NOW** — nothing above 8.4 %, and the top ten are all store functions
doing real per-cell work. **The next step is a design, not another local fix.**

⚠ **AND THAT GREP FOUND A LIVE INCONSISTENCY, MEASURED: `world_set_cell` DOES NOT ELIDE.** Clear
a cell through the fast path and the layer *and* the chunk stay in the directory, where the
column path drops both. `E1`'s *"elision is maintained on write"* is true of `world_set_column_as`
and false of the fast path — invisible in the drawing, **visible in the bytes**. Recorded, not
fixed: the cure is cheap now, but whether an empty layer on disk is a defect or a tolerated state
is a format decision. ⚠ **`G2`'s `world_fill` inherits it rather than adding a second answer** —
its hoisted loop is the fast path's write, so a fill that CLEARS a region leaves the layer
standing exactly as 1024 `world_set_cell` calls would. One behaviour, two callers, still open.

### ✅ AND IT IS USABLE NOW — loft `61057fa0…` installed 13:21, and the suite is NOT flat

**All three gaps are closed on the installed binary** (stamped at both ends; `make fast` 141
files, `make parts` byte-identical, programs run — a toolchain swap has broken this tree
silently before). `loft test` gets **one merged report**; the default backend **announces** that
it cannot be sampled ([loft#865](https://github.com/loft-lang/loft/issues/865), filed here
today); and a report that went past a `use`d library **leads with the blind spot** instead of
inverting silently. ⚠ **The report goes to STDERR** — `loft test > out.txt` keeps the results and
loses the profile, which reads as *no profile was produced*.

⚠ **AND THE FIRST THING IT SAID CORRECTS TWO ENTRIES IN THIS FILE.** `hex_editor`'s suite,
**5,210,109 samples over 72 s across 424 runs** (identical with and without
`LOFT_NO_NATIVE_LIBS=1`, so these are the real figures):

| | |
|---|---|
| `world_set_column_as` **22.3 %** · `stored_present` **20.8 %** | **43 % in two functions** |
| + `world_chunk_of` 7.9 % · `world_ground_cell` 4.7 % · `empty_cells` 4.4 % | **60 % in five**, all `hex_voxel` |
| hottest path | `ground_set → … → world_set_cell → **set_cell_slow** → world_set_column → world_set_column_as` |

⚠ ***"`hex_editor` 56 s, 235 tests, FLAT — no fixture dominating"* (below) IS TRUE PER FILE AND
FALSE PER FUNCTION.** The per-file clocks said *spread evenly, real work*; the sampler says **one
write path**.

⚠ **AND THE FIXTURE BUILT THAT MORNING TO STAND IN FOR THE SUITE GOT THE WEIGHTS WRONG BOTH
WAYS**: `empty_cells` **24.6 % → 4.4 %** (over by 5.6×) and `stored_present` **10.0 % → 20.8 %**
(under by 2×). **A test-shaped program is not the test suite.** GROUND_DEFAULT's premise stands,
but the row to aim at is the **elision scan**, not chunk materialisation. ⚠ `crc32_of` is 2.9 %
here and **45.6 %** of `hex_voxel`'s own suite.

### ⏭ THE EARLIER ANSWER, KEPT — it was half useful, and the fix was upstream not installed

**`probe/perf/README.md` § *Is the sampler useful yet* has the table.** Short version, all on
the installed `1dec17a0…` (aug 12 **09:38**):

- ✅ **a program under `--interpret` profiles well** — percent and ms **by function, by loft
  `file:line`, and by call path**.
- ❌ **`loft test` still reports nothing.** The fix — loft `5db374d4`, *"A suite was the one loft
  workload the profiler could not see"* — landed **11:57 today, two hours after our binary was
  installed**. It resolves samples per test *before* merging (each test has its own `Data`, so a
  raw sum would add up positions that mean nothing in common) and refuses where it cannot
  answer. **Nothing changes here until `/usr/local/bin/loft` is replaced.**
- ⚠ **the same silence has a second home**: `LOFT_PROFILE=1` on the **default** backend — the
  command a person actually types — exits 0 with an empty terminal, because `arm_profiler()` is
  in the *interpret* arm. [loft#865](https://github.com/loft-lang/loft/issues/865), filed today.
- ⚠ **`LOFT_NO_NATIVE_LIBS=1` is a VISIBILITY switch and costs nothing**: `editor_run` over
  `house.keys` is **175 samples / 0.668 s** without it and **33,248 / 0.635 s** with — 190× the
  visible work at the same wall clock. **The sample count is the tell.**
- ⚠ **it accounts for 355 ms of a 635 ms run** — parse, compile and cache load are outside the
  picture by construction, so it answers *where did my program go*, never *why is this command
  slow*.

| where a test-shaped workload's time goes | 103,396 samples over 9.32 s |
|---|---|
| **`empty_cells` 24.6 %** | `[for i in 0..CHUNK_CELLS { StoredHex {} }]` — materialising a whole chunk |
| `world_set_cell` 13.4 % · `world_chunk_of` 10.4 % · **`stored_present` 10.0 %** | the last is step 6's elision scan: every cell of every layer, on every column write |
| `world_set_column_as` 9.5 % · `ground_set` 5.5 % | |

⚠ **THE HOT PATH CONTRADICTS A SENTENCE BELOW.** This file records *"`hex_editor`'s fixtures were
already on the fast path"*; the sampler's hottest path is `ground_set → … → world_set_cell →
**set_cell_slow** → world_set_column → world_set_column_as → empty_cells`. The fast path is real
and **the first write to any chunk cannot take it** — 320 materialisations across 80 worlds, ~7 ms
each.

✅ **WHICH IS [GROUND_DEFAULT](GROUND_DEFAULT.md)'s PREMISE WITH A NUMBER ON IT**: *a chunk nobody
wrote returns the default without existing* removes the 24.6 % + 9.5 % this puts on materialising
and rewriting columns. And the fixture costs **2.2×** the subject beside it.

## ⏭ THE CAMERA IS NO LONGER THE CHARACTER — `eye`, 2026-08-12

**A script can stand the camera in the world and look back at whoever is building.** All five
camera modes are DERIVED from the character's pose, so until now the only way to change a view
was to move the character — and moving the character moves **where the next gesture lands**.
Every picture in this tree was taken from behind the person building it.

```
eye <x> <z> [height]     the camera stands there, looking at the character
eye off                  release; the mode takes over again
```

`48:<x>,<z>[,<h>]` on the wire, `48:` to release. `h` is above the **ground** at `(x, z)`.
[WIRE_PROTOCOL](WIRE_PROTOCOL.md) has the row; [SCRIPTED_EDITOR §1](SCRIPTED_EDITOR.md) has why
it is not a sixth mode. Gated by `tools/gates/world/eye.mjs` — 13 rows, all read off the `C:`
matrices, including the character projected through `proj · view` into the clip volume.

⚠ **THE COMPOSITION RULE IS A MEASUREMENT.** Aiming from a point on the **character→house
axis** puts a 1.8-unit figure against a 9-unit building at the same bearing and it reads as
part of the wall — *in frame and invisible*, which the projection arithmetic cannot tell from
visible. Put the eye **across** that line.

✅ **AND IT CLOSED THE `house.keys` DEFECT REPORTED THE DAY BEFORE.** Its `O`/`P` had cut
nothing since the script was written, because both poses stood INSIDE the footprint; they are
on the perimeter now and the wire says `opened profile 1 at (-2,1)` / `profile 2 at (-1,2)`.
⏭ **`shots/s6-house.png` and `s6-door.png` want your eyes** — the acceptance is *does a person
call it a house with a door in it*.

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
| ⏭ next | **`B1b`** — local mode. `B1` is **cut into three** (`B1a` ✅, `B1b` local mode, `B1c` the walk, unsized on purpose); the plan has the reasoning. It is the ONLY thing between here and the milestone: `P6` did the storage half, so *build a house, close the tab, reopen it* is short a page with the gestures in it. (`D1`, the derived mode, is unblocked too.) ⚠ `K3` is blocked on **twelve keys with no verb** — `R E Q B C J K V Y T X Z` |

## ✅ `B1a` — AND NO GATE HAD EVER PRESSED A KEY IN THE CLIENT, 2026-08-13

**`src/editor_client.loft`'s five one-to-one keys resolve through `hex_editor::verb_of`**, with a
local `act(h, verb)` holding which message implements a verb. `make probe-b1a`: **7 sentences and
the saved world identical** to a committed baseline of the client from before the change.

⚠ **THE CLIENT'S KEY TABLE COULD HAVE SAID ANYTHING AND ALL 48 GATES WOULD HAVE STAYED GREEN.**
`make gate` drives the **server** through `tools/script.mjs`; `make client-check` counts colours in
a picture. Neither presses a key in the client. That is how it survived as `W4`'s fourth site
through `V1`, `V2a`, `V2b` and `V3` — four steps whose whole subject it was.

⚠ **THE FIRST FILTER WAS BLIND TO HALF THE STEP, BY INHERITANCE.** Copied from `probe/k1`, which
drops `brush ` — and `brush (10,0) — 2 chunks, 10 dirty` is the **only** thing a raise says. Both
arrows vanished and the capture read `3 sentences` as if they had never been pressed. **A filter
inherited from a probe with a different subject is an instrument nobody aimed.** The check is a
**presence test per gesture** now, not a count: a count of seven cannot say *which* key lost its
trace.

⚠ **`K1`'s FINDING, REPRODUCED ONE DRIVER OUT.** Sabotage `act`'s `fence` to the wall's message and
**all seven sentences stay identical** — `do_fence` says the same line for both — while the world
goes `82d622b3` → `cdabc1dc`. Sabotage `place` to a raise and transcript, presence check and world
all go red. **Neither instrument alone covers the five keys.**

⏭ **AND A LIVE FACT FELL OUT: `h` AT THE SPAWN POINT IS REFUSED** — *"a footprint at this facing
has no mitred corners; turn one step"*. A person opening the editor and pressing the house key is
told no. Not `B1a`'s to fix.

## ⛔ `P6` — A PAGE HAS A FILESYSTEM, AND A PHASE IS CANCELLED, 2026-08-13

**`make probe-p6`.** [PAGES_EDITOR](PAGES_EDITOR.md) measured `--html` binding **0 of 20** `fs_*`
names — *a page that draws cannot store* — raised
[loft#851](https://github.com/loft-lang/loft/issues/851), and wrote **`W5`**, an interim
`host_output`/`loftPush` storage shim, on that premise. #851 is closed and merged (`28e85b42`).

| | the design measured | `P6` |
|---|---|---|
| `fs_*` names in an emitted page | **0 of 20** | **21** |
| save a world and read it back in one run | impossible | `pass1 ok`, **8277 bytes** — the interpreter's own count |
| …and after a **RELOAD** | impossible | `pass2 ok`, over **http and `file://` alike** |
| a file the page was **given** (`W2`'s catalogue) | *"a fetched manifest"* | `base file 25 bytes, list_dir 1 entries` — **the line the interpreter prints for a real directory** |

⛔ **`W5` IS CANCELLED AND `W3` RETIRED WITH IT**, both by their own escape clauses. ✅ **`P3` is
closed too** — the house scene is 65,788 bytes, a `LayeredFS` delta measures **1.34×** that, so
~88 KB against a ~5 MB budget: **under 2 %**. No sharding, no IndexedDB.

⚠ **THE DEFERRAL IS THE PART TO CARRY FORWARD, NOT THE CANCELLATION.** The route decision was
parked because `W1` and `W4` were the same work either way, so **nothing waited on it** — and by
the time it had to be answered it had answered itself. Wait for a toolchain rather than build
around it.

⚠ **AND *"#851 LANDED"* IS A CHANGELOG, NOT A MEASUREMENT.** *Landed* is a claim about upstream's
`main`; what decides a phase here is what `/usr/local/bin/loft` does. One grep apart, four days
apart.

⚠ **`file://` NEEDS NO BROWSER FLAG** — the quick start's whole premise, and it was worth its own
run. The first pass carried `--allow-file-access-from-files`; taking it away changed nothing.

⚠ **A SABOTAGE HALF-REFUTED A GUARD I HAD ARGUED FOR, WHICH IS WHY IT IS WORTH KEEPING HONESTLY.**
The driver refuses to read the second load until the document is genuinely new (a stamp set before
navigating that must be gone after). `P6_SABOTAGE=nostamp` **passes three of three** — the race
did not reproduce. What it *does* buy: `noreload,nostamp` reports *"the reloaded page found NO
file"*, a **driver** bug wearing a product failure's clothes with `delta bytes 11092` printed
above contradicting it. **The guard is worth one evaluate for the DIAGNOSIS, not for the verdict.**

⚠ **TWO ENVIRONMENT FACTS, BOTH COST TIME.** loft resolves a relative path against the program's
**source directory**, not the process's cwd. And the chromium here is a **snap** with its own
private `/tmp`, so a `--user-data-dir` under the real one leaves the browser with **no devtools
port** and a driver hanging on a socket that never opens — the profile is repo-local for that
reason.

## ⏭ `V3` — A GREEN SUITE IS THE WRONG INSTRUMENT FOR A DELETION, 2026-08-12

**`hex_editor::press(key)` and its private `open_press` are gone.** Two levels remain:
`verb_of(key)` names a verb, `press_verb(…, verb)` runs it.

⚠ **A DELETION MAKES TESTS PASS BY REMOVING THEIR SUBJECT**, so `make fast` going green proves
nothing about it. The instrument is the **test-name diff** — 40 test functions before, 36 after
(`hex_editor` **428 → 424**) — with every change accounted for: four **spent** (they compared two
bodies and one is gone), one **moved** (`…_the_six_keys_cut_six_different_things` →
`opening.loft`'s `…_the_five_outlines_the_family_can_select_cut_five_different_things`, over
kinds instead of keys), two **retired into rows that already held their claim**, two **renamed**.

⚠ **AND *"the claim is held next door"* IS MEASURED, NOT ASSERTED.** Three sabotages, each red on
the row that inherited a retirement: `session_opening` wired to a constant → `…_the_five_outlines…`
reports `1 2 3 4 cut outlines 1 1 1 1` (the moved control catching exactly what it was written to
catch); `verb_of("W") = VB_PLACE` → `…_a_key_that_is_not_a_gesture_names_no_verb`; `verb_of("G")`
unbound → `…_every_verb_the_definition_produces_is_bound`.

⚠ **THE NAME `press` IS DELIBERATELY NOT REUSED**, against the design's own *"this takes the name
`press` once nothing is left to collide with"*. Both forms are `(sess, w, a, text)`, so a stale
`press(…, "H")` after a rename would **compile, run, and answer *not a gesture* at runtime**. The
note was about collision; free is not the same as valuable. One `sed` reverses it.

⚠ **AND A PROBE'S OWN 120-SECOND WINDOW WAS A FLAKE GENERATOR.** `probe/k1`'s second server gave
up mid-compile — these servers are interpreted from source, so the first after any library edit
rebuilds — and the failure printed 4 lines of compile *advice*, which reads as an error whichever
happened. 240 s now, and the message says **still building** or **died** rather than showing a
tail that cannot tell them apart. ⚠ A second bug in the same failure path: `` `save` `` inside a
double-quoted message **ran `save` as a command**, so a real failure reported
`save: not found`. Both only ever execute when something else is already wrong, which is how
they survived four green runs.

## ⏭ `V2b` — NO EQUALITY COULD SEE THE STEP IT TOOK, 2026-08-12

**`src/editor_run.loft`'s `key` branch is `press_verb(sess, w, a, verb_of(rest))`**, and that was
the **last production caller of `press(key)`** in the tree — the server moved at `V2a`,
`editor_client` never called it.

⚠ **THE STEP'S CLAIM IS INVISIBLE TO EVERY EQUALITY BUILT FOR IT.** `probe/k1`'s A, B and C
compare a key spelling against a verb spelling that **chose what the key already meant**, so they
pass whether or not the runner resolves through `verb_of`. The check that can fail is new —
`carried.keys` chooses **pointed**, presses `O` (the key that used to mean *round* and nothing
else) and reads the kind out of the session. **Seen red on the old line** (`cut kind 1`).

⚠ **AND THE FIXTURE ENCODED THE OLD MEANING, SO A CORRECT STEP TURNED THE SUITE RED.**
`keyed.keys` pressed `key P` with no `select`; the day the runner moved, check B failed on a
**script** rather than on a defect. It selects before it presses now, which makes the same file
valid on **both** sides of the change. ⏭ Worth carrying forward: **a fixture written in the old
vocabulary is not evidence about the new one.**

⚠ **AND ONE CHECK WAS READING THE FIXTURE, NOT THE SYSTEM.** `D` required the two spellings to
end on **different** selections — true only because `keyed.keys` never said `select`. Once it
had to, the difference evaporated. `S3`'s claim underneath is unchanged, so it moved to where it
can be stated directly: *select 2, press `O`, and the selection must still be 2.*

⏭ **`tools/script.mjs` HAS NOT MOVED** — its `key O` still sends `36:1`. `V2` takes one caller at
a time, so the runner and the wire disagree about what `key O` means until `V3`; the divergence
is **bounded by `K2a`**, because no script presses an opening key any more.

## ⏭ `K2a` — THE SCRIPTS SAY IT NOW, AND THE STEP SPLIT, 2026-08-12

**18 opening presses across 8 scripts**, and **every other key left alone**. That is the shape
of the step: `verb_of` is one-to-one everywhere except the opening family, so those 18 are the
only presses `V2b` could silently regress — and the rest cannot be finished anyway, because
`press` has no verb for `R E Q B C J K V Y T X Z`. **`K3` is blocked on those twelve.**

⚠ **THE EIGHT SCRIPTS HAVE NO GATE BETWEEN THEM** — the suite drives `cache`, `indoors`,
`cellar`, `clientmesh` and `deck`. So `make gate` staying green says nothing about this, and
`probe/k2/` is their only check: each script beside a **committed baseline of itself**, both
through a server of its own.

⚠ **AND BOTH WIRE INSTRUMENTS ARE BLIND TO A NICHE'S DEPTH.** The server prints `om_kind` —
*"the profile, after the tens and twenties are read off"*, its own field comment — so a doorway,
a **niche** and an **embrasure** all report `opened profile 1`; and `DOOR_MAT` goes into the
store whatever the depth, so the saved worlds are byte-identical. **Sabotaged**: `niche.keys`
converted as `select 1` three times where it means `1 11 11` leaves **all six sentences
identical and the world at the same md5**. Only the kind sequence — read out of `script.mjs`'s
own `KEYMAP`, walked with the selection carried forward — goes red.

⏭ **THAT IS ALSO A LIVE WORDING DEFECT, RECORDED AND NOT FIXED.** An author cutting a niche is
told what an author cutting a doorway is told. `S2a` froze the sentence on purpose while the
choosing moved; naming the depth is a deliberate change.

⚠ **AND `K1`'s SESSION READ-BACK COULD NOT STAND IN.** It is exactly the instrument that sees a
depth — and `press` has no `R`, so **seven of the eight scripts build no wall at all** in
`editor_run` and every opening in them is refused. The strongest instrument in the tree had
nothing to look at.

## ⏭ `K1` — AND THE ROW'S OWN NEGATIVE CONTROL WAS BLIND, 2026-08-12

**Both script readers take `verb` and `select` now** — `src/editor_run.loft` (which calls the
gestures) and `tools/script.mjs` (which drives the socket) — and
[`probe/k1/run.sh`](../../probe/k1/run.sh) drives a twin pair of scripts through both.

⚠ **THE PHASE ROW SPECIFIED *"run one converted script and its original and diff the world"*,
AND THAT CANNOT SEE THE ONE MISTAKE THE CONVERSION MAKES.** `key P` becomes `select 2` + `verb
opening`; write `select 1` and the two worlds are equal **byte for byte** — `open_ahead` writes
`DOOR_MAT` whatever the profile, the head is in the session's `Opening`, and `S1` measured that
none of the session is in the world format. **It is `V1`'s blindness one layer out**, sitting
in a table nobody had run yet.

✅ **So the runner grew the session read-back** EDITING_MODES named as the *alternative* to
converting the scripts — and it turns out to be what makes converting them an assertion rather
than a hope. It prints the nine registries and each opening's **geometry**, never only
`op_kind`: a digest of the label agrees with itself for as long as the label is copied
correctly.

⚠ **CONTROL `C` REQUIRES BOTH HALVES AT ONCE** — a deliberately mis-converted script must leave
the **same world** (so the store's blindness is measured, not assumed) and a **different
scene** (so the new reader is not blind too). The first half flipping would be good news and
would need the argument rewritten.

⚠ **AND THE TWO SPELLINGS MUST END ON DIFFERENT SELECTIONS.** A key does not re-choose —
`S3`'s fork — so the key twin finishes on the selection it started with and the verb twin on
`2`. The probe asserts they differ; agreement would mean a key had silently re-chosen.

⚠ **`script.mjs`'s NEW `VERBMAP` IS NOT A FIFTH SITE.** `KEYMAP` decides what a KEY means —
`W4`'s subject; this decides which message id implements a VERB, which is a fact about the wire
and is that file's own business. What it does not hold is a **profile**: six rows collapse to
one `36:`. ⏭ Deleted, not converted, when the wire carries a verb.

⚠ **AND THE WIRE HALF WANTS TWO INSTRUMENTS TOO, BLIND IN OPPOSITE DIRECTIONS — MEASURED BY
SABOTAGE.** `VERBMAP.wall` pointed at the fence message leaves **all six server sentences
identical** (`do_fence` says `fenced 42 edges … radius 3` for either ring) and the saved world
differs at byte 54068; `VERBMAP.opening` pinned to `36:1` is the mirror — byte-identical world,
and the sentence says `opened profile 1` where the original said `2`. So the wire half compares
the sentences **and** the world the server saves. Neither gap was reachable by reading the
source: nobody notices what a `println` leaves out.

⚠ **THREE INSTRUMENT BUGS WERE IN THE PROBE ITSELF AND EACH READ AS A PASS.** The first capture
was **25 sentences**, 21 of them part thumbnails printed before the server opened; it **lost the
last gesture of every run** to the shutdown, and two runs truncated at the same place agree
perfectly; and the unknown-verb control printed a heading and **no verdict**, because its helper
ended in a `grep` that exits 1 when it matches nothing — which is exactly what that control
wants to see. Gesture lines are named one at a time now, never counted.

⚠ **A FRESH SERVER PER SCRIPT.** Two runs against one process differ in every
`hex (q,r) — +N −M chunks` line, because the streaming set carries over — a fact about a viewer,
not a gesture.

⚠ **`V1`'s OWN PHASE ROW NAMED A BLIND INSTRUMENT, AND SO WOULD THE OBVIOUS ALTERNATIVE.** The row
said *equal `w_tau`*; a fence ring and a wall ring write **the same edges of the same disc**, so
the edit clock reports one number for two different worlds and `verb_of("G") = fence` would have
passed. The comparison is the **whole world as bytes** — `world_to_bytes`, `W1`'s encoder getting
its second consumer — and the swap shows at byte 7590. ⚠ **And the bytes are blind the other way**:
the opening wired to a constant leaves the six worlds **byte-identical**, because the store gets
`DOOR_MAT` whatever the kind and the outline lives in the session's `Opening`. **Neither
instrument alone can see this step**; both are asserted, and the `w_tau` blindness is itself a
test so it cannot rot into a comment.

⏭ **AND `V1` REORDERED THE PHASE AFTER IT.** `V2` was to move `editor_run` first; measured, **the
runner cannot see the regression that move would cause.** `house.keys` presses `O` and `P` and both
now cut (`O: 1`, `P: 1`, τ 3911 — the *"cuts no door"* defect is closed), so resolving them through
`verb_of` turns the pointed head round. The world is **byte-identical** (`open_ahead` writes
`DOOR_MAT` whatever the kind), the outline is in the session, and **the session is not in the world
format**. `ak_n` is `1` for all six, so the transcript is blind too. **`K1`+`K2` first**, or `V2`
lands a silent profile regression under a green `headless-same`. The server's `MSG_HOUSE` is the
exception — a literal `"H"` carries no profile.

⚠ **`S1`'s PREMISE WAS MEASURED AND IT IS FALSE.** The row said *"the session is saved and
replayed"*, naming `world_to_bytes`. **None of the session is in those bytes** — and the load path
did not clear it either, so `9:` left the previous world's registries in place: build a house,
save, load a world with no house in it, and `37:` still built `annex kind 1 at (-2,1)` on a
cottage the store no longer held. `36:` refused correctly in the same breath, **because it reads
the store** — *which one asks the world* is the discriminator. ✅ Fixed: `session_scene_clear`,
the one list both `9:` and part-open take.

> **So a selection is DRIVER state, not world state** — `es_author`'s category, and under
> multi-player two clients on one world hold two. That removes `S1`'s only test, so it merges
> into `S2`. ⏭ **And the registries' own absence from the format is now an open question**: a
> saved world reloads with no wall runs, roofs, leaves, openings, annexes, props, slabs or holes,
> falling back to per-edge panels and a roof from cells.

⚠ **`R1b` FOUND ITS OWN ROW'S INSTRUMENT BLIND, TWICE.** The plan said *equal `w_tau` and equal
trunk state*, and **`w_tau` cannot see a fence on the wrong layer**: the same edges, the same
number of writes, each changing something. Nor can the gesture's own `ak_n` — `fence_count` reads
the world back **at the reference it wrote at**, so a ring laid entirely in the yard below counts
a perfect 42 and agrees with itself. The instrument is `edge_layer` asked at the *other*
reference. ⚠ **And a flat fixture passes with the defect intact**, so the test asserts the two
references name different layers before it presses anything.

⚠ **THE SERVER'S TRUNK WAS TWO BUGS AND THEY BOTH CAME FROM THE DISTANCE.** The ring was laid in
`do_fence` and remembered **eleven hundred lines away** in the message loop, from the PAYLOAD and
*after* the refusal path had returned — so `23:9,2` left a phantom cylinder where no edge was
written, and `23:3` with no radius recorded nothing for a ring it did lay. One call does both now.
⚠ **NO GATE DRIVES `K`**, so the old branch was put back beside the new one and one script driven
through both: the working path (`G` then `K`) is **identical**, and each bug shows on its own row.
That control is also the only thing that proves `sess` survives **two** parameter hops — a struct
that copied anywhere along there is loft#774's shape, and the library tests cross only one.

⚠ **AND `R3`'s "DELIBERATE REGRESSION" COST NOTHING, MEASURED.** `house.keys` is the only script
`editor_run` is driven over, and its `O`/`P` were **already refused** — so the runner's world is
byte-identical before and after, τ 3909 both, and only the sentence changed. ⚠ **Which uncovered a
live defect nobody had measured: `house.keys` cuts NO door and NO window, in EITHER driver.** Its
own comment says *"stand ON the wall's own cells"* and both poses answer *"no wall here to open"*
on the server too, so `shots/s6-house.png` has never had one. **It is the pose** — the same house
opens from `-3 2` and from `-6 -1`.
✅ **CLOSED by the `eye` step the same day** — the poses are on the perimeter and both cut. Re-measured
2026-08-12 while planning `V2`: `O: 1`, `P: 1`, τ 3911. ⚠ **Left here rather than deleted because the
sentence had already been read forward once**: `V2`'s decomposition was drafted on it, and the script
it named as unable to exercise the opening keys is now the one that can.

⚠ **THE CAMERA LIBRARY IS DESIGNED AND DELIBERATELY WAITING.** `hex_cam` has three consumers
(this client, the server, and **crawler**) and a finished design in
[CAMERA_INDOORS](CAMERA_INDOORS.md) — and it is plan 22 `C1`–`C4`, which **do not start until the
client can be opened and driven**. The user's ordering, 2026-08-11: *"this is not the highest
priority, getting our client is that."*

⚠ **AND ITS API IS ALREADY DECIDED BY A MEASUREMENT, so do not re-derive it**: crawler declares no
`hex_voxel`, so `hex_cam` takes a **height sampler**, never a world. The obvious extraction — a
pure move keeping `wld: VoxelWorld` — would be unusable by the consumer who asked for it.

## ⏭ EARLIER — plan 20 is COMPLETE, every row built or measured and stated

**`A9` and `A10` landed 2026-08-10; the road thread closed 2026-08-11.** Both sessions are
in **[JOURNAL §§ 17 and 18](JOURNAL.md)**, unthinned; the per-row record is
[plan 20](../../plans/20-verticality-last/README.md). What is true now:

| | |
|---|---|
| a stroke lays a **plane**, not a plate | each disc cell at `h + round((w − p) · g)`, so the overwrite is a no-op by construction and a walked road sits on the ground it was walked over. Falling: **845 / 338 / 0** at 6 / 3 / 1 per hex — the optimum |
| the spoil balance | ONE rule, `road_balance`, against ONE datum — `Grades`, the grade the author asked for. `spoil_place` is deleted |
| a caved run | holds its limit; the balance shifts only as far as every cell can come up, capped at `CAVE_HEAD` |
| a rising walk | does **not** return its spoil, and that is **a decision taken on the picture** — see below |
| `A2c` across | a projection onto the run's axis; one half is the floor, and "zero cross-fall" was never reachable |
| `A3` | needed no rule at all; the proof is the edit clock |
| `A2b` | a corridor follows the ground, and a hollow it refuses now says so |

⚠ **THE ONE DECISION A READER MUST NOT UNDO: KEEP THE GALLERY.** A rising walk ends owing
363 over 43 cells. Letting the lid come off returns it exactly — **845, the mirror of the
same walk downhill** — and costs `gates/world/cave` half its shelves. **The numbers favour
the other arm and it was still not chosen**, with both renders side by side. `road_balance`
says so at the site; do not re-open it on the numbers alone.

⚠ **AND *RAISE THE SHELF'S LID WITH THE ROAD* IS REFUTED** (`probe/house/lid.loft`) — there
is no roof to raise. `road_cave` writes the road and the ground layer keeping `nat`, and the
drawn soffit is that layer's underside: **the lid IS the hillside**, and raising it measured
a 12-unit step of mountain that was never there.

### ⏭ WHAT IS OPEN

- **`plan/20-run-debt`** — pushed, deliberately unmerged, and now with a *measured* reason:
  merged on top of everything above it **ratchets**, because `spoil_place`'s datum moves when
  the balance moves. Superseded by `Grades`; kept for its measurement.
- ⏭ **plan 19 `L6.3a` is the next piece of code, and it is ready** — see the section below.
  `L6.2` is done; `A8` stopped blocking anything on 2026-08-08.
- the two ◐ format questions on plan 17, which want a plan rather than a step.

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

## ⏭ THE STORE IS `hex_voxel` — plan 19 `L6.2`, landed 2026-08-11

**`hex_world` named two unrelated packages; ours moved.** Package **`hex_voxel`**, structs
**`VoxelWorld`** and **`VoxelChunk`**. Theirs keeps the name — not on merit but on possibility:
they have published three versions and loft's own suite consumes them, so theirs is the rename
that cannot be done. Every count unchanged: `make fast` 138 files · `make lib-test` **1600 tests**
over 11 packages on both backends, every per-package number identical to the baseline · `make
parts` byte-identical · `make gate` **47 PASS / 0 FAIL** · `names.sh` and `layering.sh` silent ·
`probe/l4/run.sh` **8 of 8**.

⚠ **THE ONE-LINE PROOF IS CONTROL `D`**: `loft --lib lib/ probe/l4/theirs_api.loft` used to fail
with `Unknown function world_empty`, because `hex_world` resolved to OURS out of `lib/`. It builds
*their* world now. One name, one package, whatever the flags say.

⚠ **THE PLAN CALLED THE STRUCT HALF OPTIONAL AND IT WAS NOT.** Both packages declare
`world_save`: ours a free function, **theirs a method** — and the method shadows ours, selected by
the receiver struct's *name*, reporting `Too many parameters for t_5World_world_save` or, at the
matching arity, `expected World, got World`. That is `L1`'s sentence a third time.
[loft#850](https://github.com/loft-lang/loft/issues/850) filed, with a two-package repro whose
control is *rename one struct and the right function is chosen*. It never miscompiles; it costs
diagnosis time.

⚠ **AND "a qualified name does not disambiguate" IS NO LONGER TRUE** — that working rule in
CLAUDE.md was measured false on 2026-08-11 and is corrected there. `pkg_b::Thing { b_only: 7 }`
resolves correctly with both packages present, and a bare ambiguous name is now refused outright
naming both candidates.

⚠ **A CONTROL CAN KEEP PASSING WHILE CEASING TO TEST ITS SUBJECT.** `probe/l4`'s `F` handed OUR
world to THEIR `cell_count`; after the rename that call is not a candidate at all and answers
`Unknown function cell_count` — true, and silent about whether the types merged. It had to be
**reversed** (theirs into our free function) to keep both types in one diagnostic. Worth
remembering the next time a probe goes green through a change it was aimed at.

⚠ **AND ONE MECHANICAL TRAP:** `find … -name '*.loft'` **matches loft's `.loft` cache directory**,
and `sed -i` stops on the first non-regular file — so a tree-wide rename silently skips every file
after it, reporting nothing. `-type f`.

### ⏭ AND THE `h_wall` RENAME WENT WITH IT — `h_wall_nw` / `h_wall_ne` / `h_wall_e`

`h_wall_n`/`h_wall_se` were a **flat-top** reading on a **pointy-top** lattice, which has no north
edge at all. **287 occurrences across 39 files**, four structs in three packages; counts identical,
`make parts` byte-identical, 47 gates green. `h_wall_ne` was right and did not move. The byte
layout and field order are untouched, so no world file, part file or wire message changed.

⚠ **IT HAD BEEN DEFERRED FOR MONTHS ON A FACT NOBODY RE-READ** — *"public fields of a published
library (hex_world 0.2.0)"*, which is the **registry's** `hex_world`, a different lineage with
**zero** `h_wall` fields. Ours has never been published. The estimate had rotted too: *"~80 sites
in ten files"* was 287 in 39.

⚠ **TWO PACKAGES DECLARE `pub struct Hex` WITH BYTE-IDENTICAL FIELD LISTS** — `moros_map::Hex` and
`hex_voxel::Hex` — and this is how it was found: `moros_render::emit_hex_walls` is the obvious
instrument for *what edge is this byte*, and it draws **`moros_map`'s**, not the store's. The
reading was right by luck. The chain that actually answers for the store is `SLOT_*` →
`slot_dir = [4,5,0]` → `hex_grid::hex_edge_corners`, and all three agreed.
⚠ **`names.sh` is silent about the pair, correctly** — it checks the graph, and the two never meet
in one since `L6.1` removed `editor_server`'s dead `moros_map` import. **Re-import `moros_map`
into the editor's graph and a bare `Hex { … }` becomes ambiguous.** Recorded, not fixed.

⚠ **`shots/a9-*.png` ARE THE SHIPPING RENDER.** Photographing the alternative overwrote them
under the same names; the directory is gitignored so nothing wrong was committed, but the
wrong frames on disk read as a missing gallery. Restored and verified pixel-identical.

## ⏭ EARLIER — plan 17 `A8` is COMPLETE, and the tree's one live defect is closed

✅ **THE TOOLCHAIN BREAK OF 17:25 IS FIXED — [loft#815](https://github.com/loft-lang/loft/issues/815),
filed and landed the same evening.** `/usr/local/bin/loft` went `9f416d7c…` → `0fba02c1…` (broken,
17:25) → `0d4fa4af…` (20:56, fixed), with `loft --version` saying `2026.8.0` for **all three**.
Green on the new one: `make fast` 121 files · `make lib-test` 22 of 22 · `make gate` 44 rc=0.

⚠ **THE CAUSE IS WORTH KNOWING BECAUSE IT WILL RECUR IN A NEW SHAPE.** Three reachability walkers
in loft's `generation/mod.rs` each re-derived the IR's tree shape as a whitelist ending in
`_ => {}`, and none listed `Tuple` — so a callee reached ONLY from a tuple element was pruned while
its call site was still emitted, and rustc failed E0425. `hex_way` hit it on
`(0.0 - sin(a) * dir, cos(a) * dir)`. `Parallel`, `BreakWith`, `TuplePut` and `ParFor` were missing
from all three too; the program path escaped only by luck. The fix is an exhaustive
`for_each_child` twin so a new variant forces a decision. **Both of the small things the report
asked for landed as well**: the refusal used to advise `--interpret`, which was the command that
had just failed (it now names `LOFT_NO_NATIVE_LIBS=1`), and the whole-function advices pointed
their caret at the following `fn`.

⚠ **AND THE BLAST RADIUS IS THE DURABLE LESSON: `loft test` WAS UNAFFECTED.** `make fast` was 121
files green while **every program in the tree exited 1**. A green suite says nothing about whether
anything can RUN — worth remembering the next time a suite is used as evidence that a toolchain is
healthy.


**Sessions 14 and 15 are in [JOURNAL.md](JOURNAL.md)**, newest first — what each found, in full.
What is true *now*:

| | |
|---|---|
| **plan 17** | `A1`–`A7.3` and **all of `A8`** are built. Two rows are ◐ and both need something other than code — see below |
| **the headless thread** | `prop`, `annex`, `slab`, `seat` and the wall run moved into `hex_editor`; the server's scene state IS an `EditSession`; `tests/session.loft` is 31 tests over nine gates'/scripts' claims with no port |
| **defects** | **none open.** The road-layer suspicion turned out to be a refused write and is fixed; session 15's four are still closed |
| **the user's standing redirect** | *"where possible I want tests outside the server"* — still the thread, and its floor is now the picture gates, which need a server by construction |

⚠ **THE NEXT PIECE OF WORK IS A CHOICE, NOT A QUEUE.** Nothing is blocked on a bug any more.
The open threads are `A8.3` and `A8.6` (both waiting on the user, below), plan 19's `L6.3`
onward (**not** blocked), and the two ◐ format questions that want a plan rather than a step.

⚠ **TWO THINGS ARE WAITING ON THE USER, NOT ON WORK.**
1. **`A8.3`'s acceptance is a cold-recognition test** — *does a person call it a door*
   (`shots/a83-door-{w,sw,s}.png`, regenerate with `tools/scripts/doorway.keys`). My own read is
   that it does **not** yet: a cell leaf is the same height and the same grey as the wall it hangs
   in, because the per-edge fallback has one wall height and one wall colour. That wants an
   `Opening` profile in the part format or a per-part wall height — a format question.
   ✅ **AND IT IS MEASURED NOW, NOT READ** (2026-08-08, `probe/a83/leaf_visible/run.sh`, exit 0).
   The leaf **is** drawn: `door/hung` puts two meshes in the limb block, and id 9 — the leaf's
   panel — is broadcast in colour **`0.55,0.52,0.46`**, `hex_mesh`'s `wall` entry byte for byte,
   spanning **y 0.00..3.25**, one `WALL_UP` (12 × `HEIGHT_SCALE`) on the 0.25 paving. Same colour
   as the wall, same height as the wall, in a hole in that wall. ⚠ **And no cell material can fix
   it**: `h_material` colours a horizontal PLATE, a leaf's body is a vertical PANEL, and
   `part_body_meshes` sends every per-edge panel to the one `wall` slot — the edge material only
   picks a height through `wall_up`. The format question is the whole question.
   ⚠ **Two instruments were blind before this one answered**, and both read as findings: a picture
   cannot see a leaf painted in the wall's own colour, and `script.mjs`'s `mesh <surface>` counts
   the CHUNK id space while a limb goes to `PART_MESH_BASE`..`+MAX` — so it reports `0` for every
   limb whatever was sent, and reported `field 18` for a part holding no field at all, one subject
   behind. The probe's `door/leaf`-as-subject control is what caught it.
   ✅ **AND `A8.8` FIXED IT (2026-08-08).** A part now says how tall its walls are and what they
   are made of — a `WALL` section, [PARTS.md §P9.13](PARTS.md#p913--a-part-says-how-tall-its-walls-are-and-what-they-are-made-of).
   `door/leaf` states `surface=floor` and the doorway reads as timber in stone.
   ✅ **AND `A8.9` GAVE IT A HEAD (2026-08-08)** — an `OPEN` section, and the per-edge path now asks
   `hex_editor::opening_cuts`, the same call `emit_run_wall` has always asked
   ([§P9.14](PARTS.md#p914--the-opening-is-a-wall-with-a-hole-in-it-and-the-hole-has-a-head)).
   A `DOOR_MAT` edge used to draw NOTHING — an absence cannot carry a lintel — and now draws the
   wall above the head and below the sill. `door/frame`/`door/hung` cut a flat head at 10,
   `door/gateway`/`door/gated` a round one sprung at 7, and `A8.8`'s `up` finally has its consumer.
   `probe/a83/leaf_visible/run.sh` is nine controls. ⚠ **What `A8.3` still wants is the user's eyes
   on the picture** — `shots/a83-door-{w,sw,s}.png` and `shots/a89-arch-{s,sw}.png`, regenerated.
   ⚠ **AND THE PROFILE BELONGS TO THE WORLD BEING DRAWN, NOT THE PART THAT OWNS THE EDGE** — a
   stamped cell has no owner left to ask, so a composed part takes the ROOT's profile. A `round`
   frame inside a `flat` house is drawn flat and says nothing; `bake` refuses that pair (`BK_OPEN`),
   the display path deliberately does not. ⚠ **A world has no gesture for a profile yet**, so a
   doorway stamped into the actual landscape still cuts full height.
   ✅ **AND `A8.9a` MADE THE ARCH AN ARCH.** It was `7 7 8 8 … 8 7 7` over one edge — two levels, a
   flat head with a notch at each jamb — from two causes: **an opening per EDGE** (a rise IS its
   half-width, so halving the span quarters it; `hex_editor::open_run_for` now groups doorway edges
   that share a corner and takes the CHORD across the run) and **`1.9999999999999998 as integer`
   = 1** (`round` at all five sites in `opening_cuts`, which cost `emit_run_wall`'s arches the same
   unit). ⚠ **It is still a STEPPED arch** — whole height units at 0.25 — and that is the world's
   own quantum rather than a defect.
   ⚠ **AND THE TEST FOR THE ROUNDING PASSED WITH THE FIX REVERTED**: written in `hex_editor` it used
   `profile_opening`, which adds `OPENING_CLEAR` and makes truncation and rounding agree. It lives
   in `lib/hex_mesh/tests/arch.loft` now and asserts its own precondition so it cannot go vacuous.
2. **`A8.6`'s return half is blocked on a gesture nobody wrote**: nothing authors a `MESH` section,
   the same gap as *no gesture can author a `FITS`*. Both want a plan rather than a step.

✅ **THE STALE-CHUNK DEFECT IS FIXED, AND SO IS EVERYTHING IT WAS HIDING.** An absent cell
decoded as `ck_base + 0` and one base serves a whole 32×32 tile, so a brush of radius 7 **wrote
91 cells and moved 4096**. One decode (`hex_of`) now asks the predicate the write path already
asks. ⚠ **It had also made every terrain number in the tree one height unit high** — three
presses of `PEAK_STEP = 6` stood 19 units, not 18 — because `brush` adds its delta to `ground_h`
and read the leaked base back as existing ground. Four fixtures were resting on it, the cart's
rest solve and the towed trailer's were both rebuilt on brackets, and `tools/script.mjs` grew
`meshr`. **All of it is [JOURNAL.md](JOURNAL.md) § session 15** — including the two obvious
fixes that a probe refuted, which is most of the value.

⚠ **THE ONE SENTENCE TO CARRY OUT OF IT**: the entry survived four days on *"they all check the
store and the store is right"*, and the store was never right — the gates agreed with the picture
because they asked **the same broken reader**. **When a count and a picture agree, they may share
an instrument.**

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
| **`hex_part` 35 s** · `moros_sim` 24 s · `hex_voxel` 7.6 s · `moros_render` 7.3 s | the other six packages are under 3 s each |

⚠ **A per-file loop is a fair instrument** — `loft test` over `hex_part` and the sum of its 16
files run one at a time agree at 35–39 s. A first reading suggested a 5× package-mode penalty;
it was drift.

| still true, measured 2026-08-06 | |
|---|---|
| nothing about the harness is slow | 2.2 ms marginal per test; `lavition_ui` runs 65 tests in **447 ms** |
| compile tracks the **dependency cone** | `lavition_ui` 20 ms · `hex_voxel` 119 ms · `hex_part` 492 ms · `hex_editor` 1.28 s · `hex_mesh` 1.46 s |
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

| `hex_editor` **266** | `hex_voxel` **120** | `lavition_ui` **65** | `hex_part` **277** |
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

### Plan 19 — `L1`–`L6.2` done or raised; `L6.3` is blocked on the PROGRAM, not on `A8`

[#19](https://github.com/jjstwerff/moros/issues/19) · design
[LAVITION_SPLIT.md](LAVITION_SPLIT.md) · steps
[plans/19-lavition-split](../../plans/19-lavition-split/README.md).

⚠ **THIS BLOCK SAID *"the MOVE is blocked on `A8` landing, for hexbody's reason: `MeshAt` is
changing shape right now"* — `A8` landed 2026-08-08 and the clause was three days stale.** Running
the invariant the moment it cleared is what found the real blocker underneath: **the editor program
imports two Moros packages and does not compile without them.** See the section at the top of this
file. The corrections below were never blocked, which is why six of them landed while the premise
under them was false.

✅ **`L1` AND `L2` ARE DONE (2026-08-06).** `hex_voxel::Surface` → **`SurfaceAt`** (the tree's own
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
which lattice is meant. ⚠ **`gridmesh` and `hex_voxel` both declare `chunk_of`, and `gridmesh`
won in the server while `hex_voxel` won in the client** — same two packages, opposite answers,
decided by the `use` order alone. Both aliased now. Also `hex_part`'s duplicate `hex_dist`
deleted, and `fit_text`→`fit_why`, `Rect`→`UiRect`, `chunk_of`→`world_chunk_of`.

⚠ **THE INSTRUMENT WAS WRONG THREE TIMES FIRST, AND THAT IS WHY THE LIST IS SHORT.** An aliased
import exposes **no** bare name (measured); a method resolves by **receiver** (`server` declares
`close` twice by itself); and the replacement name I first picked, `fit_reason`, was refused by
the tool because the registry's `hex_fit` publishes one. ⚠ **That last one is a finding**:
`hex_fit` *is* a doorstep, field for field with `hex_editor::Fit`, and whether they converge is
now an open question on the plan rather than a spelling.

**What is left**: ✅ `L6.2` is **done** (2026-08-11, top of this file), and what remains is
`L6.3a` (wean the program off `moros_render` — 42 sites, mostly `L3′` finished), `L6.3b`
(`moros_sim`, 11 sites, which needs open question 5 answered first) and then `L6.3c`–`L8`.
⚠ **The line here that read *"the gates have not been run since `L6.1`"* was already false when
written** — `L6.2` ran them the same day, **47 PASS / 0 FAIL / 0 never-listened**. The durable
half of it is still true and is why it was written: **a new dependency edge invalidates the build
cache exactly as a new package does**, so warm one server up and down before believing a suite.

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

⚠ **THIS FILE GROWS BACK, AND IT HAS FIVE TIMES.** 2,446 lines → split to a handoff; 785 across
sessions 10–12 → ~400; 907 at the end of session 13 → ~300; 1,011 at the end of session 15 →
~960; **1,684 at the end of session 18 → 1,153 here** — 451 lines of session-18 narrative, 113
of session 17's `A9`/`A10`, and the last 53 of session 16's, all moved to the journal rather
than cut. ⚠ **Three sessions' logs had accumulated here at once**, which is how it grows: each
one looked like the current state while it was the newest. Every regrowth is the same shape: per-step findings the plan already carried, and a
session narrative that belongs in the journal. **When a session ends, its entry moves out.**
Moving is not thinning — nothing is ever deleted on the way, which is why the journal is 3,800
lines and this is not.

⚠ **AND THE LAST MOVE WAS ONLY HALF DONE, WHICH IS WHY THE NUMBER BARELY FELL.** Session 15's
narrative moved out; **§ *AND THE GATES — 1838 s → 741 s* below did not, and it is session 14's,
not the present.** It is ~160 lines describing work that is finished — `nextT`, `browserLag`,
the structural audit, the `.gatebin` copy, the stale-binary control. Some of it is durable
(*a fixed wait is right when the claim is an absence*; the `.gatebin` trap; **the gates exercise
the NATIVE server now**), and most of it is a record of getting there. **Whoever next thins this
file: that block is the work, and the durable sentences go to § *What bites*, not to the bin.**

### ⚠ What bites regardless of which step you pick up

⚠ **`.gatebin/server` IS BUILT BY THE GATE RUNNER, NOT BY AN EDIT.** Editing a library and
then running `./.gatebin/server` measures **yesterday's binary**, and it reads as a working
instrument reporting a null result — the worst possible shape. It cost three changes reverted
on false evidence in one session. `make gate-one G=<any>` is what rebuilds it and
`md5sum .gatebin/server` is how you check. ⚠ **And reaching for a photograph first is what
cost the detour**: two changes were judged by eye (*"the picture is unchanged"*) when the
cheap question was *did it emit anything at all*.

⚠ **WHAT ADDING A TERRAIN COSTS, AND TWO GUARDS ARE WHY IT IS KNOWN.**
`hex_mesh/tests/terrain_link.loft` — *every terrain is drawn by exactly one surface* — goes
red the moment a many-to-one join appears, which forces it to be **stated** rather than
quietly loosened. `hex_mesh/tests/surfaces.loft` pins the stride with *if a surface is added
this fails, and it SHOULD*: **fourteen** files carry `SURFACES` and every one reads the id
space by modulo, so a new surface must be APPENDED or everything already numbered moves.

⚠ **A TEST CALIBRATED TO A CONSTANT IS A SNAPSHOT OF ONE SETTING.** A bound of `< 4.0`
measured at `WATER_TRICKLE` 0.34 went red at 0.6 while reporting a river that was perfectly
correct. Predict the bound from the constant — `3.0 + 2 × WATER_TRICKLE` — so the dial moves
either way and a build that stopped working still fails.

⚠ **A WAIT THAT SETTLES ON NOTHING REPORTS SUCCESS.** `quiet` returns as soon as a count
stops changing, so under four contended servers — where the rebuild has not started yet — it
settles at **zero and returns true**: no `!!`, no timeout, a clean settle on an empty block.
That is `part_limb`'s three-time flake, and `L5` fixed the same class once already. **Wait
for the evidence, then settle.** ⚠ And the evidence must be per-attempt: `g.meshes` is every
`M:` id for the whole session and is never reset, so `meshes.length > 0` is true forever
after the first one — a guard that reads exactly like a guard. `g.picture` is cleared per
open and is what to ask.

⚠ **A GATE'S FAILING ROW IS NOT IN THE SUITE OUTPUT.** `verdict()` prints its rows to stdout
and `run-gates.sh` keeps only the last line, cut to 100 characters — so *which* conjunct
failed can only be seen by running the gate by hand against a server. Three flakes were
diagnosed as "some other field" before anyone did.

⚠ **A ONE-SIDED GUARD READS EXACTLY LIKE A GUARD, AND THIS TREE HAS NOW WRITTEN ONE THREE
TIMES** — `faced_between`, `stroke_over_limit`, and a balance arm reading `if owed > 0` that
fired on a descent and did **nothing** on the mirror. Ask it from both ends before believing
a zero.

⚠ **A TEST THAT ASSERTS A NOT-BUILT STATE IS WORTH WRITING.** `A2b`'s corridor row asserted
the cover grew by *exactly* what the ground gained — a measurement of the gap — and it went
red one commit later at *"if that is now intended, this row is the one to change on
purpose."* A gap nobody pinned is a gap that gets closed silently.

⚠ **PHOTOGRAPHING AN ALTERNATIVE OVERWRITES `shots/` UNDER THE SAME NAMES.** The directory is
gitignored so nothing wrong is committed, but the wrong frames on disk read as a missing
feature to the next person who looks. Copy the shipping render back and verify it.

✅ **AND THE CART NO LONGER STANDS IN AN OPEN PART (2026-08-08).** Part open already empties eight
registries because *a part has no runs, roofs, leaves or dressing of its own*; a cart is dressing,
and it was the ninth thing that argument covers. It is `X:`-ed on open and re-sent on close, and a
client that joins **while** a part is open is not given one either. ⚠ **It had occluded the subject
in every part picture in this tree, and was read as part geometry twice in one session** before
anyone zoomed in far enough to count its wheels. Gated by id, not by colour — the cart's brown sits
next to the figure's in chromaticity, which is why no pixel test could have told them apart.

✅ **PART MODE LEFT THE PREVIOUS PART'S CHUNKS ON SCREEN — FIXED 2026-08-08, AND IT WAS THE
CLIENT.** Every guess about the server was wrong: both `44:` forms already mark every loaded chunk
dirty, and `probe/a83/leaf_visible/held.mjs` proved the **wire is correct** — under `door/leaf` the
client is told to hold 30 floor vertices and no wall. The fault was one line in
`src/editor_client.loft`: `add_mesh` returned on `len(mverts) < 6` **before** `drop_part`, so the
server's clearing message (a colour and no vertices) was discarded and the old buffer kept drawing.
⚠ **The limb block's own comment — *"a leaf that was unbound leaves its mesh on the client for ever
otherwise"* — described a mechanism that had never once fired**, for the same reason.
⚠ **NO WIRE PROBE COULD HAVE FOUND IT, and the two instruments disagreeing is what located it.**
`held.mjs` said the id was gone; the screenshot said 300 vertices of wall were standing. Both were
right. **When the wire and the picture disagree, the client is between them.** Gated by
`probe/a83/leaf_visible/switch.sh` — 13014 wall pixels broken, 394 fixed, measured both ways.

⚠ **A `Mesh` COPIES THROUGH A LOCAL *AND* THROUGH A VECTOR READ — only a PARAMETER aliases.**
Measured 2026-08-08, `probe/a83/leaf_visible/meshalias.loft`: `la = a; emit(la)` leaves `a` empty,
and so does `v[0]`. ⚠ **That is NOT what loft#774 records for a plain struct** (*copies on `b = a`,
**aliases** on `c = v[0]`*), so the note below must not be relied on for one. It matters because
selecting a destination mesh is the natural way to route geometry — `m = all[i];
emit_wall_panel(m, …)` — and it **drops every triangle** with no diagnostic, every count agreeing,
and a blank wall in the picture. Pass every candidate as a parameter and branch (`emit_panel_into`).

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
at all 50 sites it flags took `hex_voxel` from **114 green to 96 failed** with `Delete on locked
store`, and `src/editor_run.loft` from exit 0 to SIGABRT — while `--native` passed all 114 on the
same source, so a per-backend green said nothing. It was *right* at some sites and wrong at others
**in identical words**. Measured, filed as
[loft#760](https://github.com/loft-lang/loft/issues/760), fixed within hours, and the 50 `&`s are
now dropped. ⚠ **The lint is back at 4 sites, all `wld: &World`** — the exact class; not touched.
**The compiler's advice is a hypothesis. Run the suite against it; the check costs one run.**

✅ **THE 22-OF-48 STALE CHUNKS ARE FIXED (2026-08-08), AND THE ENTRY HERE NAMED THE WRONG ORGAN
FOR FOUR DAYS.** Not a marking radius, and not a ray: `mark_dirty` covers `PEAK_R + 2` around a
brush of `PEAK_R` and contains the write exactly. **An unwritten cell read back its chunk's window
base** — one base per 32×32 tile — so one brush moved 4096 cells' apparent ground. ⚠ **The line
that kept it alive was *"they all check the store and the store is right"*: the store was NOT
right, and the gates agreed with the picture because they asked the same broken reader.** When a
count and a picture agree, ask whether they share an instrument.
[OPEN_ISSUES](OPEN_ISSUES.md) has the numbers. ⚠ Settling a photographed world is still right on
its own merits, and `part_mode.mjs` still does it.

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
