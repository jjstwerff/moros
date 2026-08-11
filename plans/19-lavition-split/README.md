# 19 — Extract lavition: the editor as its own project, with the Moros name out of it

**Issue:** [`jjstwerff/moros#19`](https://github.com/jjstwerff/moros/issues/19) ·
`status:future` · **Value:** `F` · **Effort:** `H`

## Status

✅ **`L1`, `L2`, `L3′`, `L5`, `L6.1` and `L6.2` are BUILT and `L4` is RAISED; `L3` as designed was
refuted by its own probe.**
`layering.sh` is silent with `KNOWN=""`, which means **the lavition stack has no Moros dependency
at all** — the first time that has been true, and the thing that made the rest of this plan a move
rather than an argument.

✅ **AND THE NAME IS SETTLED IN THE TREE, NOT ONLY ON PAPER (2026-08-11).** The store is
**`hex_voxel`**, its `World` and `Chunk` are **`VoxelWorld`** and **`VoxelChunk`**, and `lib/`
carries no `hex_world` at all — so `use hex_world;` means the registry's package and nothing else,
whatever flags are passed. That is control `D` of `probe/l4/run.sh`, and it is the one line of the
probe that changed. ⚠ **The struct half was written down as optional and it is not**: theirs
declares `world_save` as a **method**, which shadows our free function of the same name by the
receiver struct's *name* — see *What `L6.2` turned up*, and
[loft#850](https://github.com/loft-lang/loft/issues/850).

⚠ **`L6` SPLIT IN THREE ONCE THE NAMES WERE MEASURED.** `L6.1` built the public-name check and
fixed what it found — including **a dead import that had been shadowing the odd-r lattice**, which
is a defect today and had nothing to do with the split. `L6.2` did the rename, before anything is
published, which is the only time it can be done. `L6.3` is the repo itself.

⚠ **AND `L6.3`'s BLOCKER CHANGED ON 2026-08-11 — IT IS NO LONGER `A8`.** This section read *"the
MOVE is still blocked on plan #17 `A8` landing"*, on hexbody's reason: `MeshAt` was changing shape.
**`A8` landed on 2026-08-08**, so that clause has been stale for three days — and running the
invariant the moment it cleared is what found the real blocker underneath it.

**The MOVE is blocked because the editor program does not compile without Moros.**
`src/editor_server.loft` imports `moros_render` (42 call sites) and `moros_sim` (11, behind an
alias). Measured with `make probe-split`; see *What `L6`'s probe turned up*. `L6.3a` and `L6.3b`
are what pay it, and **open question 5 is now on the critical path** rather than parked.

⚠ **The corrections were never blocked** — they are right whether or not the split happens, which
is why six of them landed while the premise underneath them was false.

Today: **seven** lavition packages with zero `moros_*` dependencies, 53 gates that name Moros
**only in comments**, four of five programs that compile with the Moros tree absent — and
`data/parts/` behind them.

⚠ **THE FIFTH PROGRAM DOES NOT, AND THIS LINE SAID IT DID.** It read *"one 8,283-line editor
program with **none left either**"*. Measured 2026-08-11 (`make probe-split`):
`src/editor_server.loft` imports `moros_render` (6 names, **42** call sites) and `moros_sim`
(10 names, 11 sites, behind `as msim`) and does not build without them. **The split is one file
away** — see *What `L6`'s probe turned up* below, and `PROGRAM_DEBT` in `tools/layering.sh`.

## Goal

lavition builds, tests **and gates** with the Moros tree absent, publishes its packages under
descriptive `hex_*` / `lavition_*` names with no Moros name anywhere inside it, and Moros becomes
an ordinary consumer of the published packages plus a small configuration file.

## Anchors

- **The design:** [`doc/claude/LAVITION_SPLIT.md`](../../doc/claude/LAVITION_SPLIT.md) — the one
  invariant, the four blockers, the target shape, and the four mechanisms that keep it clean.
  ⚠ It is written to be **moved**; on the day the split lands it becomes the new project's
  `doc/HISTORY.md` and the Moros copy is deleted rather than kept in two places.
- [`EDITOR_SUBSTRATE.md`](../../doc/claude/EDITOR_SUBSTRATE.md) — the extraction bar's four
  clauses, the five target groups, *build beside do not migrate*, the per-package DoD.
- [`HEX_STACK.md`](../../doc/claude/HEX_STACK.md) — the single authority for the stack's design;
  already written to travel.
- Touches: `lib/hex_mesh/` (was `moros_terrain`), `lib/hex_voxel/src/hex_voxel.loft` (was
  `lib/hex_world/src/hex_world.loft`), `src/editor_server.loft`,
  `src/editor_client.loft`, `tools/layering.sh`, `tools/gates/`, every `loft.toml`.

## Invariant gate

**This plan's exact-invariant surface is the RENAMES, and a rename is exact.** The concrete
expected result for `L1`–`L3` is *byte-identical behaviour*: every suite and every gate green,
with the same counts, before and after.

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| `L1` | `make lib-test` 20 of 20 and `make gate` 44, unchanged, after `Surface` is renamed on one side | **a rename changes no behaviour** | write the `Surface` literal in `editor_server.loft` **before** the rename — it must still fail with *"Unknown field `Surface.sf_r`"*, or the collision was already gone and `L1` is testing nothing |
| `L2` | same counts after `moros_terrain` → `hex_mesh`, and `make parts` still byte-identical | a package's **name** is not part of its behaviour | run `layering.sh` with the `moros_*` skip removed **before** the rename — it must report `hex_editor`→`moros_terrain`, or the check cannot see the class it exists for |
| ~~`L3`~~ → `L3′` | same counts after the projection moves to `hex_proj` | `hex_to_world`'s plane **is** `hex_grid::hex_to_px`, on **both parities and both signs** — lesson `E` | ⚠ two: negative odd rows must shift the same way as positive ones, **and the `(6 - i) % 6` corner map must not be the identity** — without the second, a package that merely forwarded the call would pass every corner test |
| ~~`L5`~~ → `L6.2p` | the 39 gates green **with `lib/moros_*` deleted from the tree** | clause 1 of the extraction bar, for the *gates* | keep one `moros_*` reference in the server and confirm the build **fails** — a boundary check that cannot fail is not one |
| `L6.2p` | `probe/l6/run.sh` exits 0 on 9 — and `C`/`D` are **expected failures**, because the claim they measure is false today | **the program travels**, which is the plan's whole premise | ⚠ two, both run: pay one import and `D` must go red *saying it is progress*; plant a Moros name in a gate's **code** and `E` must go red — a filter that only ever sees comments cannot report their absence |
| `L6.2g` | `tools/layering.sh` silent bar its debt line | **the coupling cannot grow unseen** | ⚠ four: a new import in a clean program FAILS; a removed import with the budget unchanged FAILS; and both restore to green |

⚠ **`L5`'s ROW WAS THIS PROBE ALL ALONG, ATTACHED TO THE WRONG STEP — and that is the finding
this table was built to prevent.** The row above specifies the measurement exactly, down to a
negative control that is *precisely* today's tree (*"keep one `moros_*` reference in the server and
confirm the build fails"*). But the **phase** called `L5` is *fix the gate flake*, which is other
work entirely; it was done, ticked, and the invariant row went with the tick. ⚠ **A control that
passes trivially is the tell**: ours has held from the day it was written, because the reference it
asks for was never removed. **When a step and its invariant row describe different work, the row is
the one that is right** — and nobody re-read it for five days.

⚠ **`L6.3`–`L8` have no exact-invariant surface** — a file move and documentation. Said in a line
so the silence does not read as *gate done*. ⚠ **That sentence is now only true of `L6.3c`–`L8`:**
`L6.3a` and `L6.3b` are code, and their surface is `probe/l6`'s `C` and `D` flipping to *PAID*.

⚠ **`L4` WAS PUT HERE TOO, AND THAT WAS WRONG.** *"A naming decision with another repo"* is what
it looks like from outside; what it actually rests on is a claim that **is** exactly checkable —
*what does `use hex_world;` resolve to, and what happens when both lineages meet.* Its row is
now in the table above, with the control that would have caught the answer everyone assumed.

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| `L4` | `probe/l4/run.sh` exits 0 on all 8 | a package name resolves to **one** package, and the rename makes the two co-installable | ⚠ two: `F` — the two `World` structs must **fail** to substitute (`expected World, got World`), or they merged and this is `L1` at library scale; and `G`/`H` — the same literal at both import orders must give **opposite** results, or bare-name binding is not order-dependent and loft#788 is wrong |
| `L6.1` | `tools/names.sh` silent, and every suite at the same count as before | **one public name, one thing** — across the graph, not the package | ⚠ **the instrument was checked in both directions, and needed it three times.** It must FIND a known pair (`Hex`/`Chunk` between `hex_world` and `moros_map`) and must NOT report `seg_len` (an aliased import exposes no bare name — measured: `use hex_world as hw;` + `world_new(…)` fails) or `close`/`send`/`send_binary`/`last_opcode` (a method resolves by receiver — `server` declares `close` **twice by itself**) |
| `L6.2` | `names.sh` silent, `probe/l4/run.sh` 8 of 8, every count unchanged | **a rename changes no behaviour** — as `L1` and `L2` | the `L4` probe is the control and already exists: with `hex_voxel` real rather than staged, `E`–`H` must give the same eight answers |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| ✅ **`L1`** — rename one of the two `Surface` structs | S | **DONE.** `hex_world::SurfaceAt`; the negative control produced its five errors first | ✅ Done |
| ✅ **`L2`** — `moros_terrain` → `hex_mesh`, and flip `layering.sh`'s default | M | **DONE.** Explicit `CONSUMERS` list; `make parts` byte-identical; both controls run | ✅ Done |
| ~~**`L3`** — the 64 lattice call sites → `hex_grid`~~ | ~~S~~ | ⚠ **REFUTED BY THE PROBE — see below.** Replaced by `L3′` | Withdrawn 2026-08-06 |
| ✅ **`L3′`** — a small `hex_proj` package: `HEIGHT_SCALE`, `hex_to_world`, `hex_corner_world`, the corner map | M | **DONE.** `layering.sh` is silent with `KNOWN=""` — **zero Moros dependencies left in the lavition stack**. 8 new tests; the control (put the dep back) fails the build | ✅ Done |
| **`L3p`** — ⚠ **the probe** | XS | ✅ **RUN 2026-08-06, and it fired.** `L3` as designed was wrong | ✅ Done |
| ✅ **`L4`** — settle the `hex_world` lineage with `loft-libs-world` | S | **RAISED 2026-08-06** with an 8-control probe: [`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13). Recommendation: **ours renames to `hex_voxel`** | ✅ Raised — awaiting their word |
| ✅ **`L5`** — fix the gate flake: wait for the evidence, never for a duration | M | **DONE.** 4 consecutive clean full suites (44, rc=0, zero failures), plus 3 contended `gate-rep` runs of the three fixed gates | ✅ Done |
| ✅ **`L6.1`** — `tools/names.sh`, and every collision it found | M | **DONE.** The check is silent; 686 lavition + 625 Moros tests green on both backends, counts unchanged | ✅ Done |
| ✅ **`L6.2`** — `hex_world` → `hex_voxel`, and its `World` / `Chunk` | M | **DONE 2026-08-11.** `names.sh` and `layering.sh` silent, `probe/l4/run.sh` 8 of 8 with three controls re-measured, every per-package count identical (1600 tests, both backends), `make parts` byte-identical, `make gate` 47 PASS | ✅ Done |
| **`L6.2p`** — ⚠ **the probe: does the program travel?** | XS | ✅ **RUN 2026-08-11, and it fired.** `probe/l6/run.sh` · `make probe-split` · 9 checks, 2 sabotages seen red | ✅ Done |
| **`L6.2g`** — the guard: `PROGRAM_DEBT` in `tools/layering.sh` | XS | ✅ **DONE.** Exact budget, fails in both directions; 4 controls run | ✅ Done |
| **`L6.3a`** — wean the program off `moros_render`: 6 names, 42 sites | M | `probe/l6` control `C` flips to *PAID*; `world_to_hex` joins its own inverse in `hex_proj` | ⏭ **Ready** — #17 `A8` has landed |
| **`L6.3b`** — settle open question 5, then `moros_sim`: 10 names, 11 sites | M | control `D` flips to *PAID* | Blocked on **open question 5**, which can no longer be parked |
| **`L6.3`** — the new repo: packages, program, gates, content, `CLAUDE.md` | MH | 678 tests **and 49 gates** green with no Moros tree present | Blocked on `L6.3a`+`L6.3b` — ⚠ **not on `A8` any more**, which landed 2026-08-08 |
| **`L7`** — Moros becomes a consumer: published deps + one configuration file | M | Moros green against published packages, no path dependency into lavition | Blocked on `L6` |
| **`L8`** — the documentation, and what is deliberately left behind | S | the eight travelling docs present; the four superseded ones **absent** | Blocked on `L6` |

⚠ **`L8` is where a clean project is won or lost.** `SCENE_MAP`, `SCENE_MAP_RENDER`,
`SCENE_EDITOR` and `SCENE_EDITOR_PLAN` describe architectures that were not taken; each was
banner-marked on 2026-08-06 and **none of them travels.** Copying them over is how the new tree
starts with the rot the old one just cleaned out.

✅ **`L5` IS DONE, so a required PR check is now possible.** Measured 2026-08-06 before the fix: `cache` failed **2 of 3** suite runs
and passed alone both times, and the *server's own log* read `agree 24 bad 0 layers 42` while the
gate reported `agree 0 bad 24 layers 0` — so the world was right and the gate never read it. A
required check that goes red two runs in three teaches everyone to hit re-run, which is worse than
no check at all.

## What `L1`–`L2` turned up, and the probe that refuted `L3` (2026-08-06)

**`L1` is done.** `hex_world::Surface` → **`SurfaceAt`**, which follows this tree's own convention
for a derived positional record (`MeshAt`, `SocketAt`) and reads as what it is — *the surface at
this hex, under these feet*. `Surface` is left to the palette entry, whose own header already says
*"the surfaces the mesher can emit"*.

⚠ **The negative control ran first and reproduced the bug exactly**: a five-line scratch program
importing both packages and constructing `Surface { sf_name:…, sf_r:… }` failed with **five
`Unknown field Surface.sf_*` errors and no mention of a collision**. After the rename the same
program compiles and prints. Without that control the rename would have been a claim about a bug
nobody had seen.

**`L2` is done.** `moros_terrain` → **`hex_mesh`** across 14 files, `data/parts/` byte-identical.
⚠ **And the rename is only half the mechanism — `layering.sh`'s DEFAULT was the other half.** It
skipped every `moros_*` package, so **the name decided whether the check applied**, which is
exactly how `moros_ui` stayed exempt for months from the one check written to catch it. The skip
is now an explicit `CONSUMERS` list: a new package is **checked unless somebody names it on
purpose**. Both controls run — a fresh fake dependency on `hex_part` still fails the build, and
emptying `KNOWN` makes the tracked debt reappear, so the entry clears something real.

### ⚠ `L3` WAS WRONG, AND THE PROBE IS WHAT SAID SO

The design read: *"swap the three lattice calls to `hex_grid`'s `px_to_hex` / `hex_to_px` /
`hex_corner_px`"*, on the strength of `layering.sh`'s header recording that exact substitution
twice before. **Measured, they are not lattice calls at all:**

- `moros_render::hex_to_world` **already calls `hex_grid::hex_to_px`** (line 44). What it adds is
  `HEIGHT_SCALE` and a Y-up `Vec3`.
- `mr_corner_offset`'s own comment: *"hex_grid holds the same six corners but walks the ring the
  other way… **the values now COME FROM hex_grid** with that map applied"* — and every call site
  then compensates *again* with `(6 - i) % 6`.

⚠ **So a naive swap would rotate every corner and drop the height, with every count still
agreeing** — this tree's most expensive failure shape, and the design was one afternoon from
walking into it. What these three really are is the **3-D PROJECTION**, and it is `HEIGHT_SCALE`
that carries the weight: **83 uses in `editor_server` alone**, not the handful the design assumed.

⚠ **AND THE OBVIOUS FIX IS ALREADY A REVERTED EXPERIMENT.** Moving the projection into `hex_mesh`
cannot work, because `lib/hex_mesh`'s own manifest records that putting this code under
`moros_render` was tried and reverted: `moros_sim` depends on `moros_render`, so it inherited
`hex_editor`'s whole cone and went red on `Cannot redefine 'fabs'`. The reverse arrow has the same
shape. **It wants a package of its own** — `hex_proj`, depending on `hex_grid` and `graphics` and
nothing else, which both `moros_render` and `hex_mesh` can take without inheriting a cone. That is
`L3′`.

**Until `L3′` lands the debt is TRACKED, not hidden**: `KNOWN="hex_mesh:moros_render"` in
`layering.sh`, printed on every run with its reason and its plan step, so the list cannot quietly
become permanent. ⚠ That is the whole difference from the pattern skip it replaced — **a debt with
a name on it beats a debt nobody can see.**

### What `L3′` turned up

**Built:** `lib/hex_proj` — `HEIGHT_SCALE`, `hex_to_world`, `hex_corner_world` and
`proj_corner_offset`, depending on `hex_grid` and `graphics` and **nothing else**. 8 tests.
`moros_render` and `hex_mesh` both take it; `KNOWN` in `layering.sh` is now `""`, which means
**the lavition stack has no Moros dependency at all** — the first time that has been true.

⚠ **THE PACKAGE EXISTS BECAUSE BOTH OBVIOUS HOMES WERE ALREADY-FAILED EXPERIMENTS.** Putting the
projection in `moros_render` is what `hex_mesh`'s manifest records being reverted (`moros_sim`
inherits `hex_editor`'s cone, `Cannot redefine 'fabs'`); moving it into `hex_mesh` points the same
arrow the other way for the same result. A third, tiny package is not architecture astronomy here
— it is the only shape the cones allow, and its manifest says so in place.

⚠ **`proj_corner_offset` HAD TO BECOME `pub`, AND THAT IS THE SPLIT SHOWING.** It was private in
`moros_render` because both its callers were in the same file; `emit_hex_surface` stayed behind and
is now external. **A re-derived copy on the other side would be the second corner table** the
comment has warned about since `hex_grid` took ownership — so it is exported rather than copied.

⚠ **THE TESTS TRAVELLED WITH THE CODE.** `moros_render/tests/geometry.loft`'s negative-row parity
test is the one that pins `hex_to_world` to `hex_grid` — lesson `E`, five bugs of that shape — and
a function that moves house without its tests arrives unverified. `hex_proj`'s suite adds the
control the old one lacked: **the `(6 - i) % 6` map must not be the identity**, or every corner
assertion is vacuous and a package that merely forwarded the call would pass. That control is
exactly the mistake the original `L3` would have made.

⚠ **AND ADDING A PACKAGE INVALIDATES THE BUILD CACHE EXACTLY LIKE A LOFT INSTALL DOES.** The first
gate suite after `hex_proj` appeared gave **3 `SERVER NEVER LISTENED` and the `walk`/`hipskin`
pair** (`{"frames":1,"bodyMoved":false}` — STATE's third face, verbatim), with every log ending
mid-diagnostics inside the 60-second wait. **Warming once — one server up and down — took it to
zero never-listened.** The warm-up rule in STATE is written for a loft install; it applies to a
new package too, and that is new.

⚠ **AND AN INSTRUMENT READ ITSELF.** `pgrep -f "run-gates.sh tools/gates"` matched the *shell
command containing that string* — my own — so a finished suite reported as still running for two
polls. A pattern that appears in the query is a pattern the query will find.

### What `L5` turned up

**Three gates, two distinct bugs, and neither was a timeout that wanted raising.**

⚠ **`cache` READ THE FIRST VERDICT OF A RUNNING ONE.** The client re-answers on every `D:`
digest, and its first answer is `agree 0 bad 24 layers 0` — nothing cached yet, so all 24 chunks
disagree. `wait` returns the **first** status matching a prefix, so whether the gate passed
depended on which digest happened to land first, and a failure reported *a measured
disagreement*. ⚠ **The `last` verb's own comment already described this exact class** — *"`wait`
answers has this happened, `last` answers where did it end up"* — and `clientmesh.keys` had
already learned it. `cache.keys` never did.

⚠ **AND THE GATE HAD THE SAME BUG A SECOND TIME, IN JAVASCRIPT.** `out.match(/…/)` without `/g`
returns the **first** occurrence, so even a script that printed the settled verdict last would
have been read at its first. Now `matchAll` and take the last.

**New verb `until <prefix> <field> <op> <value>`** — polls the newest matching status until a
numbered field satisfies a comparison, and ⚠ **fails the run on timeout while saying what it DID
see**, because an instrument that reports only *nothing* cannot be told from a blind one.
`cache.keys` is now `until cache layers > 0` then `last cache`. Control: an unsatisfiable
condition fails with `(never saw 'cache' with layers > 99999 in 60000ms; newest was …)`.

⚠ **`walk` AND `hipskin` SLEPT ON THE WALL CLOCK, WHICH MEASURES THE MACHINE.** They held `W` for
1200/1500 ms and judged at 1700/2000 ms; under four interpreted servers the same wall time
delivered **one** frame instead of 44, reporting `{"frames":1,"bodyMoved":false}` — *the walk is
broken* when it means *nothing happened yet*. They advance on **frames received** now, which is
the very quantity the verdict is computed from, so a busy box makes them slower and never wrong.

⚠ **AND THE FIRST FIX WAS WRONG IN A WAY ONLY RUNNING IT SHOWED.** Splitting into *hold for N,
judge at M* hung at N — **the server sends a transform only while the body is moving**, so a count
taken after the release can never be reached. One count: hold until the evidence exists, release
and judge in the same breath. Both backstops now report how far they got, because `TIMEOUT` alone
cannot separate the two failures.

⚠ **AND THE WAY I GATHERED THE EVIDENCE WAS ITSELF THE WASTE THE USER CALLED OUT.** Four full
44-gate suites were run to prove three gates — ~80 minutes for what three contended repeats of
those three gates answer in **2m54s**. Hence `make gate-one`, `make gate-rep` and `make check`
(0.3 s for one package). ⚠ **The set matters**: running the suspect gate ALONE is the
*discriminator*, not the test — a contention flake needs contention to reproduce.

### What `L4` turned up

**Raised, not resolved** — [`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13),
with the recommendation the measurements point at: **theirs keeps `hex_world`, ours becomes
`hex_voxel`.** Three published versions (0.1.1, 0.1.2, 0.2.0, since 2026-06-14) and consumers
inside **loft's own test suite** — `tests/multilib/p379_lib_namespace.loft`, a multiplayer
integration test, `tests/issues.rs`, a vendored fixture — against one unpublished package with a
path dependency in one tree. Renaming after publication is the thing that cannot be done, and
only one side has crossed that line.

⚠ **THE OPEN QUESTION ASKED WHICH LINEAGE *DESERVES* THE NAME, AND THAT IS NOT THE QUESTION.**
Ours is 2,041 lines and 102 public names to their 400 and 17; it is what `WORLD_MODEL` Part II
specifies and what the tests cite by rule id. None of that is a claim on a name. What decides it
is which rename is still **possible**.

⚠ **AND A PACKAGE RENAME IS NECESSARY BUT SAYS NOTHING ABOUT THE TYPES.** Four public names are
declared by both — `Chunk`, `World`, `world_save`, `world_load` — and the two save/load pairs
have different signatures over incompatible formats (`'WTTH'` vs `'WRLD'`). Measured
(`probe/l4/run.sh`, control `F`): the two `World` structs do **not** merge, `expected World, got
World`. Measured (`G`/`H`): a **bare** `Chunk { … }` literal binds to whichever package was
`use`d **first** — the same file with its two imports swapped compiles something different, with
no ambiguity error either way. `G`'s message is `error: Unknown field Chunk.ck_cells`, which is
`L1`'s `Surface` diagnostic verbatim, one rename later.

**So `L6` renames our `World` and `Chunk` as well as the package** — 274 and 21 sites, mechanical
— on the ground that *not required* and *safe to leave* are different claims and only the first
was measured. Doing it before publication costs a suite run; after, it is the one thing that
cannot be done.

⚠ **AND THE PROBE'S FIRST VERSION WAS WRONG IN THE WAY IT EXISTS TO CATCH.** It passed
`--lib lib/` next to the staged `hex_voxel`, so `hex_world` resolved to **ours** and control `F`
never had both lineages in the graph: it errored on `Unknown function cell_count` — a different
bug — and reported PASS. Every control now checks the **words** as well as the exit code. An
expected error is still an instrument reading.

**Two loft defects fell out**, both filed with reproducers: the order-dependent bare name is
[loft#788](https://github.com/loft-lang/loft/issues/788), and
[loft#789](https://github.com/loft-lang/loft/issues/789) is the suggester reading the *registry
index* rather than the resolved graph — *"the `hex_world` package provides it; … add
`use hex_world;`"* on a file whose second line is `use hex_world;`. ⚠ **The advice was wrong
about the one thing the file could not be wrong about**, which is the third time this tree has
had to treat a compiler suggestion as a hypothesis.

**One thing to correct on their side, whichever way the name goes**: `hex_world/README.md` lists
*"The lavition editor — authors hex maps using this as the canonical in-memory model"* under
**why this package exists**. The lavition editor uses the other lineage and never depended on
this one.

### What `L6.1` turned up

**Built: [`tools/names.sh`](../../tools/names.sh)** — the public-name check
[LAVITION_SPLIT § mechanism 3](../../doc/claude/LAVITION_SPLIT.md) has listed since the design
was written, and the tree never had. It separates two debts that look alike and are not:
**LIVE** (a program already imports both packages, so one name is unreachable and which one is
decided by the `use` block) from **LATENT** (a name lavition will publish is already taken in the
registry — nothing is broken today, and it becomes unfixable on the day it is published).

⚠ **THE WORST ONE WAS AN IMPORT OF NOTHING.** `editor_server.loft` carried `use moros_map;` and
used **none of its 81 names**. Its only effect was to put `Hex`, `Chunk` and `hex_distance` in
scope ahead of the ones the program means — and the file's own comment records what that already
cost: an **axial** `hex_distance` shadowing the odd-r one drew *"a sheared blob whose true
boundary is 34 edges rather than the 30 a hex disc has"*, wrong for the road width, the scatter
disc, the storey disc and the house footprint. It was answered by qualifying every call site.
**The import is gone, so the hazard is removed where it arrived** rather than at each place it is
spent — this tree's own rule about where a guard belongs, applied to an import list.

⚠ **AND THE SAME TWO PACKAGES DISAGREED IN TWO FILES.** `gridmesh` and `hex_world` both declare
`chunk_of` — different arity, different meaning — and **`gridmesh` won in the server while
`hex_world` won in the client**, decided by nothing but the order of the `use` block. Both are
`use gridmesh as gm;` now. ⚠ The answer was already in the tree: `use moros_sim as msim;` carries
a comment working the same thing out for `edgeset_new`, *"a qualifier adds no bare name at all"*.
Nobody had generalised it, because nothing could see the next instance.

**Latent, and fixed while a rename is still possible.** `hex_part` carried its own `hex_dist` —
the same twelve lines as `hex_field`'s, in the same graph the whole time, and a bare call already
bound to `hex_field`'s because `use hex_field;` sits three lines above `use hex_part;`. The copy
that was never being called is the one that went. Then `hex_editor::fit_text` → **`fit_why`**,
`lavition_ui::Rect` → **`UiRect`**, `hex_world::chunk_of` → **`world_chunk_of`**.

⚠ **THREE INSTRUMENT CORRECTIONS, EACH CAUGHT BEFORE IT WAS ACTED ON**, which is the only reason
the list above is short. An **aliased import exposes no bare name** — measured, `use hex_world as
hw;` then `world_new(…)` fails with `Unknown function` — so `seg_len` was a false positive. A
**method resolves by receiver, not import order**: `server` declares `close` **twice by itself**,
on `Server` and on `WebSocket`, which it could not if the name alone decided — four more.
⚠ And the third was mine: **`fit_reason`, the replacement name I picked, was refused by the tool**
because the registry's `hex_fit` already publishes one.

⚠ **AND THAT REFUSAL IS A FINDING, NOT A NEAR MISS.** `hex_fit` **is** a doorstep — its README:
*"refuse at authoring time … with a named reason, an offer of the nearest fitting alternative,
and the residual"* — which is `hex_editor::Fit` field for field (`ft_ok`, `ft_reason`, `ft_offer`,
`ft_residual`). Whether the two converge is a **design question for the split**, and it is written
down rather than settled by picking a third spelling. See the open questions.

⚠ **ADDING THE DEPENDENCY BROKE A TEST FILE, AND LOUDLY**, which is the shape worth contrasting:
`hex_field::layer_count` collided with a private helper in `hex_part/tests/expand.loft` and gave
`Cannot redefine 'layer_count'` — the `Cannot redefine 'fabs'` shape from `L3`. **A redefinition
inside one compilation unit is an error; the same name across two packages is a silent bind.**
That asymmetry is the whole reason this check has to exist, and it is why `names.sh` scans `src/`
rather than `tests/`: the test case reports itself.

### What `L6.2` turned up (2026-08-11)

**The store is `hex_voxel`**, and its `World` and `Chunk` are **`VoxelWorld`** and
**`VoxelChunk`**. A rename changes no behaviour and this one is measured that way: `make fast`
138 files, `make lib-test` **1600 tests over 11 packages on both backends with every per-package
number identical to the baseline**, `make parts` byte-identical, `make gate` **47 PASS / 0 FAIL /
0 never-listened**, `names.sh` and `layering.sh` silent.

⚠ **THE ROW CALLED THE STRUCT HALF OPTIONAL AND IT IS NOT — that is this step's finding.** The
design left it at *"`not required` and `safe to leave` are different claims, and only the first
was measured"*, on the strength of control `F`: the two `World` structs never merge, so the
package rename alone is enough for correctness. **The second claim is measured now, and it goes
the other way.** Both packages declare `world_save` — ours a free function
`world_save(w, path, palette)`, **theirs a METHOD** `world_save(self: World, path)`. In a graph
holding both, a bare call to ours is shadowed by theirs, *selected by the receiver struct's name*,
and the diagnostic is `Too many parameters for t_5World_world_save` — an internal mangled symbol —
or, at the matching arity, `expected World, got World`: the `Surface` sentence of `L1` verbatim.
Renaming the struct is what stops that.

⚠ **AND IT IS A HOLE IN loft#788's FIX, FILED AS
[loft#850](https://github.com/loft-lang/loft/issues/850).** loft refuses an ambiguous bare name
properly for struct-vs-struct *and* function-vs-function — ``error: `same` is declared by more
than one package here`` — and misses exactly the free-function-vs-method pair. The repro is two
five-line packages, and its control is decisive: **rename one struct, change nothing else, and
the right function is chosen.** It never miscompiles — the two types never merge, so the class is
always a compile error and never a silent wrong result. What it costs is diagnosis time.

⚠ **`probe/l4/run.sh` STOPPED STAGING AND STARTED MEASURING.** It used to `cp` our package into a
`mktemp -d` under the new name to rehearse the rename; `lib/` now carries `hex_voxel` and **no
`hex_world` at all**, so `--lib lib/` *is* the two-lineage graph the staging was faking. Three
controls moved, and each move is the deliverable:

| | before `L6.2` | after | what the move says |
|---|---|---|---|
| `D` | `error: Unknown function world_empty` | `PROBE built THEIR world` | **the proof.** `--lib lib/` used to mean OURS; one name means one package now, whatever the flags say |
| `G`/`H` | refused at both orders (loft#788's fix) | both `ok`, same meaning | only one package declares `Chunk`, so there is nothing left for the import order to decide |
| `F` | `expected World, got World` | `expected VoxelWorld, got World` | two names a reader can tell apart |

⚠ **`F` HAD TO CHANGE DIRECTION TO KEEP MEASURING ANYTHING, and that is the trap worth carrying
forward.** It handed OUR world to THEIR `cell_count`. That reading is simply gone: `cell_count` is
a method on their `World`, ours is `VoxelWorld`, so it is not a candidate at all and the compiler
answers `Unknown function cell_count` — true, and silent about whether the types merged. Reversed
to hand **theirs** to **our** free function, it keeps both types in one diagnostic. **A control
can keep passing while quietly ceasing to test its subject**, which is the same class as `G`'s
expected-words being blind to the change beside them (`probe/l4/README.md`).

⚠ **A STALE MANIFEST COMMENT FELL OUT OF THE RENAME.** `hex_editor/loft.toml` said `hex_world` was
*"deliberately NOT here"* while declaring it as a path dependency **twenty-five lines below**. True
when the package was world-free, and it outlived that by every release since. Both manifests now
say what is actually true: the path is because `hex_voxel` is unpublished and in this tree, not to
dodge a name.

⚠ **AND ONE MECHANICAL TRAP, BECAUSE IT WILL RECUR.** `find probe -name '*.loft'` **matches loft's
`.loft` cache directory** — `*` matches the empty string — and `sed -i` stops on the first
non-regular file. A rename over that file list silently skips every file after the first cache
dir, and reports nothing. `-type f`.

### What `L6`'s probe turned up (2026-08-11) — the invariant is false

**Built:** [`probe/l6/run.sh`](../../probe/l6/run.sh) (`make probe-split`), and `PROGRAM_DEBT` in
[`tools/layering.sh`](../../tools/layering.sh). **Found: the program does not travel.**

`loft --check` is the instrument — parse-and-compile, no server, no port, no picture, five files in
about thirty seconds. Against a lavition-only `lib/`:

| | |
|---|---|
| `editor_client` · `editor_run` · `part_build` · `prop_build` | ✅ compile clean |
| the seven lavition packages | ✅ no `use moros` anywhere in `src/` |
| 53 gate files | ✅ 21 say *moros*, **every one inside a comment** |
| **`editor_server.loft`** | ❌ `use moros_render;` (6 names, **42** sites) and `use moros_sim as msim;` (10 names, 11 sites) |

⚠ **`world_to_hex` IS 29 OF THE 42, AND IT IS NOT MOROS CODE.** Its body is
`hex_grid::px_to_hex`; the only Moros thing about it is its **return type**,
`moros_map::HexAddress`. `L3′` moved `hex_to_world` into `hex_proj` and left **its inverse
behind** — so `L6.3a` is mostly `L3′` finished, not new design.

#### ⚠ Four instruments were pointed at this and all four missed, each for its own reason

1. **`layering.sh` looped over `lib/*/loft.toml` and never opened `src/`.** The exemption shape
   again — but by **directory** this time, not by name, which is why the `moros_ui` /
   `moros_terrain` lesson did not transfer. *A consumer program may call anything* is true right
   up until the program is the thing being extracted.
2. **An alias hid a whole package.** `use moros_sim as msim;` exposes no bare name, so the
   2026-08-06 coupling survey — which counted names — never mentions `moros_sim` **at all**.
   ⚠ `L6.1` measured that exact property and wrote it down; it was never spent against the
   measurement that needed it. **A grep's default answer is *absent*.**
3. **The survey refuted itself in one sentence** — *"`moros_terrain`, and nothing else … **plus** 3
   unqualified calls from `moros_render`"* — and the *"nothing else"* is what got quoted forward
   into the design's bold claim.
4. **`L3′` fixed `world_to_hex` where the check looks and nowhere else.** `layering.sh`'s header
   names that fix in the packages while the program kept 29 calls to the same function.

#### ⚠ And the two live consequences, neither of which is a tidy-up

- **Open question 5 cannot stay parked.** *Does `moros_sim` split too?* is marked *not this plan* —
  but the program imports `msim`, so `L6.3` cannot complete while the answer is open. It is
  promoted to a blocker of `L6.3b`.
- **This is decision 11's THIRD instance.** Neither package holds a game concept in any public
  name: `camera_*`, `emit_*`, `aabb_*`, `pick_hex` on one side; `asm_cart`, `body_axle`,
  `ground_gap`, `fall_step`, `cliff_edges` on the other. `moros_ui`→`lavition_ui`,
  `moros_terrain`→`hex_mesh`, and now two more. **The pattern is not that names drift; it is that
  a Moros prefix removes a package from the check that would have said so.**

⚠ **WHAT THE PROBE DELIBERATELY DOES NOT CLAIM.** The invariant's other half — *the 39 gates green
with `lib/moros_*` deleted* — is **unreachable**, not merely unrun: every one of those gates drives
the program that does not build. The hardest clause is blocked on the easiest. `E` measures the
nearest decidable thing instead (no gate names Moros in code) and says so at the site.

## Cross-repo coordination

| repo | owns | what "done" means |
|---|---|---|
| **`loft-lang/loft-libs-world`** | the published `hex_*` family, **and a `hex_world` on a different lineage from ours** — 0.1.1, 0.1.2 and 0.2.0, all in the registry | ✅ `L4` **raised** at [#13](https://github.com/loft-lang/loft-libs-world/issues/13) with the probe: theirs keeps the name, ours becomes `hex_voxel`. ⚠ It was raised, not resolved — and grep the sibling before adding any public name, because a new one can turn crawler red with no local edit |
| **`crawler`** | the other consumer of that family | read-only from here. Their `edgetest`/`sweeptest` are a second gate on `EdgeSet` work; raise findings, never edit |
| **`loft-lang/loft`** | the toolchain and the registry | read plus **tickets only**. A published package and a registry entry each need a word with the user first |

## Open questions

1. ~~**Which `hex_world` keeps the name?**~~ *Answered by `L4`* — **theirs**, and the reason is
   not merit but possibility: they have published three times and are consumed by loft's own
   suite, so their rename is the impossible one. Ours becomes **`hex_voxel`**, and its `World`
   and `Chunk` are renamed with it. Raised at
   [`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13); the split
   proceeds on that basis unless they say otherwise. **Executed at `L6`.**
2. **Does `hex_mesh` want `graphics` as a dependency, or should it emit into a buffer the caller
   owns?** `moros_terrain` depends on `graphics` today. A data package that pulls a GL binding is
   a seam question, not a rename. *Resolved by `L2`.*
3. **Where does `data/parts/` live?** It is lavition's test content *and* Moros's authored
   content, and the gates drive it. *Resolved by `L6`; the likely answer is a small fixture
   library in lavition and Moros's own under Moros, which `EDITOR_PARTS` already supports.*
4. **Is `hex_editor::Fit` a re-derivation of the published `hex_fit`?** ⚠ **New, from `L6.1`, and
   found by a name check refusing a rename.** `hex_fit` 0.1.0 is in the registry and describes
   itself as the doorstep — *"refuse at authoring time what would not round-trip … a named
   reason, an offer of the nearest fitting alternative, and the residual"* — which is
   `hex_editor::Fit`'s four fields exactly. Against that: `hex_fit`'s reasons are a **code table**
   over geometry (`FIT_BAD_T`, `FIT_BAD_SHELL`, `FIT_BAD_HEIGHT`), where the editor's are free
   text about **gesture parameters**. So it may be one concept at two altitudes, or two things
   that read alike. **Not decided here** — the collision was routed around by naming ours
   `fit_why`, which is honest but is not an answer. *Wants measuring before `L7` publishes
   `hex_editor`*, because after that neither side can move.
5. **Does `moros_sim` split too?** `assembly`'s `LinkKind` is the joint vocabulary §P9 builds on,
   and the walker is the only thing that exercises a part-tree pose. ~~*Not this plan*~~ —
   ⚠ **PROMOTED TO A BLOCKER 2026-08-11, and it is `L6.3b`.** It cannot be parked: the probe
   measured that `src/editor_server.loft` imports `moros_sim as msim` at 11 sites, so **the
   program cannot travel until this is answered.** The ten names it actually needs are `Frame`,
   `Assembly`, `asm_frames`, `asm_cart`, `frame_apply`, `body_axle`, `ground_axle`, `ground_gap`,
   `fall_step` and `cliff_edges` — five of `moros_sim`'s fourteen modules, and not a game concept
   among them, which is decision 11's shape a third time. ⚠ **The question was filed as design and
   is really arithmetic**: 11 sites is small enough that *move the five modules*, *rename the
   package* and *give the editor its own rig vocabulary* are all affordable, and the choice should
   be made on which one leaves `moros_sim` coherent — not on which is least work.
6. **Does `moros_render` split, or does the editor stop needing it?** ⚠ **New, from `L6`'s probe.**
   42 sites over 6 names, and they are two different problems wearing one import: `world_to_hex`
   (29) is a **projection** whose home already exists (`hex_proj` holds its inverse) and whose only
   Moros content is the `HexAddress` return type, while `emit_box` / `emit_cylinder_post` /
   `emit_hex_surface` / `emit_item_placeholder` / `mesh_aabb` (13) are **mesh emission**, which is
   `hex_mesh`'s subject. *Likely answer: neither package moves whole* — the projection half goes to
   `hex_proj` and the emission half to `hex_mesh`, leaving `moros_render` as the genuinely
   Moros-shaped remainder (`avatar_*`, `map_build_scene`, `dev_art_color`). **Wants measuring at
   `L6.3a`**, and `emit_hex_surface` is the one to look at first: `L3′` already had to make
   `proj_corner_offset` public *for it*, which is the seam announcing itself.
