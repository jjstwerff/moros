# 19 — Extract lavition: the editor as its own project, with the Moros name out of it

**Issue:** [`jjstwerff/moros#19`](https://github.com/jjstwerff/moros/issues/19) ·
`status:future` · **Value:** `F` · **Effort:** `H`

## Status

✅ **`L1`, `L2`, `L3′` and `L5` are BUILT and `L4` is RAISED (2026-08-06); `L3` as designed was
refuted by its own probe.**
`layering.sh` is silent with `KNOWN=""`, which means **the lavition stack has no Moros dependency
at all** — the first time that has been true, and the thing that made the rest of this plan a move
rather than an argument.

**The last blocker that was not ours to clear is now a ticket with a probe behind it**:
[`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13) — theirs keeps
`hex_world`, ours becomes **`hex_voxel`**, and `L6` renames its `World` and `Chunk` too. Every
`L1`–`L5` blocker is either done or answered.

**The MOVE is still blocked on plan [#17](https://github.com/jjstwerff/moros/issues/17) `A8`
landing** — `MeshAt` changed shape on 2026-08-06 (`A8.1`) and `A8.2`–`A8.7` will change it again,
and this tree's own rule is that *the cost of extracting late is a rename; the cost of extracting
early is a seam renegotiated while both sides are moving.* The corrections were not blocked,
because they are right whether or not the split ever happens.

Today: **six** lavition packages (686 tests) with zero `moros_*` dependencies, one 8,283-line
editor program with **none left either**, 49 gates of which 39 need that program, and
`data/parts/` behind them.

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
- Touches: `lib/moros_terrain/`, `lib/hex_world/src/hex_world.loft`, `src/editor_server.loft`,
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
| `L5` | the 39 gates green **with `lib/moros_*` deleted from the tree** | clause 1 of the extraction bar, for the *gates* | keep one `moros_*` reference in the server and confirm the build **fails** — a boundary check that cannot fail is not one |

⚠ **`L6`–`L8` have no exact-invariant surface** — a file move and documentation. Said in a line
so the silence does not read as *gate done*.

⚠ **`L4` WAS PUT HERE TOO, AND THAT WAS WRONG.** *"A naming decision with another repo"* is what
it looks like from outside; what it actually rests on is a claim that **is** exactly checkable —
*what does `use hex_world;` resolve to, and what happens when both lineages meet.* Its row is
now in the table above, with the control that would have caught the answer everyone assumed.

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| `L4` | `probe/l4/run.sh` exits 0 on all 8 | a package name resolves to **one** package, and the rename makes the two co-installable | ⚠ two: `F` — the two `World` structs must **fail** to substitute (`expected World, got World`), or they merged and this is `L1` at library scale; and `G`/`H` — the same literal at both import orders must give **opposite** results, or bare-name binding is not order-dependent and loft#788 is wrong |

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
| **`L6`** — the new repo: packages, program, gates, content, `CLAUDE.md`, **and `hex_world` → `hex_voxel` with its `World`/`Chunk`** | MH | 678 tests **and 49 gates** green with no Moros tree present; `probe/l4/run.sh` still 8 of 8 | Blocked on `L1`–`L5` and #17 `A8` |
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
4. **Does `moros_sim` split too?** `assembly`'s `LinkKind` is the joint vocabulary §P9 builds on,
   and the walker is the only thing that exercises a part-tree pose. *Not this plan* — flagged
   because §P9's *what `A8` does not cover* will reach it.
