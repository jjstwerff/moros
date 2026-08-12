# `probe/perf` — what the editor's time is actually spent on

Written the day the gate suite was measured at ~6 minutes for 44 gates and the question
*"why is a test slow"* turned out to have no obvious answer. Every file here is either the
instrument or the check on the instrument.

## The measurements this was built from (2026-08-06, this box, interpreted)

| | |
|---|---|
| gate suite, 44 gates at `GATE_JOBS=8` | ~6 min wall. The five browser gates alone are **983 s** of it: `camera_indoors` 303 s, `client_mesh` 206 s, `cache` 201 s, `cellar_ceiling` 159 s, `deck_soffit` 114 s |
| a non-browser gate | 7–53 s each, of which **5.4 s** is its own server reaching *listening* under suite contention |
| `loft test` harness | **2.2 ms** marginal per test; a whole trivial package runs in **62 ms** |
| compiling a package | `lavition_ui` 20 ms · `hex_world` 119 ms · `hex_part` 492 ms · `hex_editor` 1.28 s · `hex_mesh` 1.46 s — it tracks the **dependency cone**, not the package |
| the slow suites | `hex_part` 254 tests / 77 s (**303 ms each**) · `hex_editor` 235 / 48 s · `hex_world` 120 / 8.4 s · `lavition_ui` 65 / **0.45 s** |

⚠ **`lavition_ui` is the existence proof**: 65 tests in 447 ms, 6.6 ms each. Nothing about the
harness makes a test slow. What makes a test slow is what the test builds.

## `fixture.loft` — the same question, answered by loft's own SAMPLER (2026-08-12)

```sh
LOFT_NO_NATIVE_LIBS=1 LOFT_PROFILE=1 loft --interpret --lib lib/ probe/perf/fixture.loft
```

⚠ **THE PROFILER CANNOT BE POINTED AT THE TESTS, WHICH IS WHY THIS PROGRAM EXISTS.** Measured
on loft `1dec17a0…`: a plain interpreted program reports a profile; `loft test`, `loft test
<name>` and `loft --tests <file>` report **none**, because `state.arm_profiler()` has exactly one
call site — `main.rs`'s program branch. Filed as
[loft#860](https://github.com/loft-lang/loft/issues/860). ⚠ **The variable is accepted and
ignored**, so an armed instrument reporting nothing reads as *"there is nothing to see"*.

⚠ **AND THE FIRST PROFILE WAS BLIND, NOT WRONG.** A `use`d library loads as a native cdylib and
the sampler walks the INTERPRETER's stack, so with the default binding the whole of `hex_editor`
and `hex_voxel` is invisible and their time lands on whichever program frame called in. One run
of `editor_run`: **172 samples naming three program functions**, against **33,245 naming
`crc32_of`, `world_set_column_as`, `stored_present`…** once `LOFT_NO_NATIVE_LIBS=1` was set.
**Set it, or the profile is a picture of your own `main`.**

### What it says — 103,396 samples over 9.32 s, 80 test-shaped fixtures

| | self time | |
|---|---|---|
| **`empty_cells`** | **24.6 %** · 2.29 s | `hex_voxel.loft:293` — `[for i in 0..CHUNK_CELLS { StoredHex {} }]`, materialising a whole chunk |
| `world_set_cell` | 13.4 % · 1.25 s | |
| `world_chunk_of` | 10.4 % · 970 ms | `:257`, once per cell |
| **`stored_present`** | **10.0 %** · 934 ms | `:94`, and it is step 6's elision scan — every cell of every layer, on every column write |
| `world_set_column_as` | 9.5 % · 882 ms | |
| `ground_set` | 5.5 % · 515 ms | the fixture's own loop |

> **the hottest path, innermost first:**
> `ground_set → ground_write → layer_write → world_set_cell → set_cell_slow → world_set_column
> → world_set_column_as → empty_cells`

⚠ **AND THAT PATH CONTRADICTS A SENTENCE THIS TREE HAS BEEN CARRYING.** STATE records
*"`hex_editor`'s fixtures were already on the fast path — `ground_set` → `layer_write` is
`world_set_cell`"*. They reach `world_set_cell` and then fall through **`set_cell_slow`** into the
column machinery, because the chunk does not exist yet: 320 chunk materialisations across 80
worlds, ~7 ms each. The fast path is real and the FIRST write to any chunk cannot take it.

✅ **WHICH IS [GROUND_DEFAULT](../../doc/claude/GROUND_DEFAULT.md)'s PREMISE, WITH A NUMBER.**
*A chunk nobody wrote returns the default without existing* removes exactly the 24.6 % + 9.5 %
this profile puts on materialising and rewriting columns. `G1` measured the in-place write
winning 17× against the column path; this says how much of a **test suite** that path is.

⚠ **THE FIXTURE COSTS 2.2× THE SUBJECT**, on this probe's own clock: 3803 ms of ground against
1710 ms of ring, for the same 40 iterations. GROUND_DEFAULT's *"the fixture costs ten times the
subject"* was measured on a heavier file; the ratio moves with the fixture and the direction does
not.

⚠ **AND ONE THING RECORDED, NOT CHASED:** the run ends with `1 stores not freed at program exit:
kt=117 ColumnWrite×320` — one per chunk materialisation. 320 small structs is not a memory
problem, and *a store that outlives its program* is worth someone's attention before it is a
large one.

## ✅ THE SAMPLER IS USABLE — and the suite it could not see was not flat after all

**loft `61057fa0…` (aug 12 13:21) installed, and all three gaps below are closed.** Re-measured
on it, stamped at both ends:

| | |
|---|---|
| `LOFT_PROFILE=1 loft test` | ✅ **one merged report** — `688401 samples over 8.43 s across 146 runs` for `hex_voxel` |
| the **default** backend | ✅ announces: *"the loft-level profiler is interpreter-only — this program runs native"*, naming both cures ([loft#865](https://github.com/loft-lang/loft/issues/865)) |
| a `use`d library | ✅ the report **leads with the blind spot**: *"THIS RUN CALLED INTO `use`d LIBRARIES (280 calls)… the ranking can invert"*, and *"4 samples is too few to rank, and the library calls above are why. Start with `LOFT_NO_NATIVE_LIBS=1` rather than a longer run"* |

⚠ **THE REPORT GOES TO STDERR.** `loft test > out.txt` keeps the test results and loses the
profile; it looks exactly like *no profile was produced*. Cost one confused measurement here.

### ⏭ WHERE `hex_editor`'s SUITE ACTUALLY GOES — 5,210,109 samples, 424 runs, 72 s

**The question this file was written for on 2026-08-06, answered.** `LOFT_NO_NATIVE_LIBS=1`
changes **nothing** for it — same sample count to the digit, same ranking — so the store is
interpreted either way here and these are the real figures.

| | |
|---|---|
| `world_set_column_as` **22.3 %** · `stored_present` **20.8 %** | **43 % in two functions** |
| `world_chunk_of` 7.9 % · `world_ground_cell` 4.7 % · `empty_cells` 4.4 % | **60 % in five**, all `hex_voxel` |
| the hottest path | `ground_set → ground_write → layer_write → world_set_cell → **set_cell_slow** → world_set_column → world_set_column_as` |

⚠ **SO *"`hex_editor` 56 s, 235 tests, FLAT — no fixture dominating"* IS TRUE PER FILE AND FALSE
PER FUNCTION.** The per-file wall clocks said *spread evenly, it is real work*; the sampler says
**one write path**, and the first write to any chunk cannot take the fast one.

⚠ **AND IT CORRECTS THE HAND-WRITTEN STAND-IN BELOW, WHICH IS THE POINT OF BEING ABLE TO PROFILE
THE REAL THING.** `fixture.loft` was built that morning precisely because the suite could not be
profiled, and it got the weights wrong in both directions:

| | `fixture.loft` | the actual suite |
|---|---|---|
| `empty_cells` | **24.6 %** | **4.4 %** — over-weighted 5.6× |
| `stored_present` | **10.0 %** | **20.8 %** — under-weighted 2× |

**A test-shaped program is not the test suite**, and nothing short of the sampler could have said
so. GROUND_DEFAULT's premise survives — the elision scan and the column path are still most of
it — but the row it should be aimed at is `stored_present`, not chunk materialisation.

⚠ **AND `crc32_of` IS 2.9 % HERE AND 45.6 % IN `hex_voxel`'s OWN SUITE** — nearly half that
package's test time is a checksum over saved worlds. Recorded, not chased.

### ✅ AND THE ELISION SCAN IS GONE — the suite is **25 % smaller**, 2026-08-12

**One change in `world_set_column_as` step 6**, and it is a pure optimisation: the OR it
computes is unchanged, only how much of it is evaluated.

| | before | after |
|---|---|---|
| `hex_editor`'s suite | 5,210,109 samples | **3,896,879** — **−25.2 %**, same 424 runs |
| `probe/perf/write_cost.loft` | 516,072 | **287,924** — **−44.2 %** |
| `stored_present`'s share of the suite | 20.8 % | **13.8 %** |
| step 6's scan line | **8.6 %** | **absent from the by-line table** |

**The invariant it rests on: a column write changes exactly ONE cell, index `ix`.** So a layer
holding content there is live in O(1) and there is nothing to scan; the sweep is only needed to
prove ABSENCE, which is the rare answer. (A rebase rewrites `sv_height`, and height is not one of
the five fields `stored_present` reads, so it cannot change any answer here.) The sweep also
**stops at the first present cell** now — it computes an OR and ran to 1024 after the answer was
known.

⚠ **THE SHORT-CIRCUIT WAS MEASURED IN THIS FILE IN AUGUST AND NEVER APPLIED** — *"short-circuiting
step 6: 116 → 98 ms"*, written down, correct, and left on the floor. The `ix`-first half is what
was missing: a `break` only helps when a present cell comes early in the scan order, and the cell
the write touched can sit at index 1023.

⚠ **NOTHING TESTED ELISION AT ALL** — grepped across `hex_voxel` and `hex_editor`, the only test
that counted layers was `storey.loft`'s, counting them going *up*. The rule was carried by a
comment, and it is invisible from outside: **a dropped layer and an undropped empty one both read
back as absence**, so only the bytes differ. `lib/hex_voxel/tests/elision.loft` is that rule now,
five tests, and two sabotages seen red — the fast path without its fallback scan reports
*"clearing one cell dropped a layer that still holds another — 0 layers left"* (silent data
loss), and step 6 dropping nothing reports the empty layer and the empty chunk.

### ✅ AND STEP 4 WENT TOO — the suite is **HALF** what it was, 2026-08-12

| | | |
|---|---|---|
| `hex_editor`'s suite | **5,210,109** samples | → step 6 → **3,896,879** → step 4 → **2,462,718** |
| | | **−52.7 % over the two steps**, same 424 runs |
| `stored_present` | 20.8 % | → 13.8 % → **5.9 %** |
| step 4's loop (`:1066`/`:1067`) | 11.2 % | → **absent from the by-line table** |

**The invariant is STRUCTURAL, not maintained.** `StoredHex.sv_height` is a **u16**, so every
stored cell sits at `base + [0, 65535]` and `WINDOW` is 65536 — no stored cell can be outside the
window and no stored pair can span it, **whatever wrote it**. That is stronger than *"the write
path maintains it"*: the three other functions that write `ly_cells` (`world_set_cell`,
`world_set_dressing`, `world_put_layer`) needed no audit, because the **type** will not hold a
value that would break it. So only the incoming column can move the floor or overflow the span,
and its span is already computed above step 4. The sweep now runs only when the column itself
falls outside the window.

### ⚠ AND THE SABOTAGE PASSED — which is the finding, not a gap in the tests

Skipping the sweep **unconditionally** leaves all five `window.loft` tests green. That is not a
weak test file; it is a proof that **the sweep cannot change a decision**:

- it can only lower `lo` — and it is entered only when `lo < base`, while every stored cell is
  `>= base`. **So `lo` after the sweep always equals the column's own minimum.** When a rebase
  fires, the column *is* the new floor; the sweep contributes nothing to it.
- it can only raise `hi` — and `hi` feeds two comparisons that are **unreachable**:
  `Hex.h_height` is a u16 too, so absolute heights live in `[0, 65535]` and a base is never
  negative. No tile can span 65536, and none can reach `base + WINDOW`.

⚠ **THE SWEEP IS THEREFORE DEAD CODE TODAY, AND IT IS KEPT ON PURPOSE.** It is the guard that
becomes load-bearing the day a height field widens past u16 — deleting it would be a subtraction
justified by a type, and the type is exactly the thing a future change moves. The guard makes it
free instead: O(1) to skip, and the sweep still computes the true tile minimum on the path where
it would matter. `test_the_widest_tile_the_types_allow_is_still_accepted` pins the reachability
fact so the next reader does not have to re-derive it, and `CW_WINDOW` stops being an untested
branch nobody can explain.

### ✅ AND `world_chunk_of` — a floor divide by a power of two, 2026-08-12

`world_chunk_of` **12.4 %** and `local_of` **2.0 %** and `chunk_key` 2.0 % were the addressing
arithmetic on every cell access, and the first two were spelled out the long way:

```
was:  if v >= 0 { v / CHUNK_W ?? 0 } else { 0 - ((CHUNK_W - 1 - v) / CHUNK_W ?? 0) }
      v - world_chunk_of(v) * CHUNK_W
now:  v >> CHUNK_W_SHIFT
      v & CHUNK_W_MASK
```

A chunk axis is a power of two, so a floor divide **is** an arithmetic shift and the
non-negative remainder **is** a mask. `2,462,718 → 2,222,770` samples, **−9.7 %** on top of the
two write-path steps — **5,210,109 → 2,222,770 over the three, −57.3 %**.

⚠ **THE SUBSTITUTION RESTS ON TWO LANGUAGE PROPERTIES NOTHING HERE HAD RECORDED**, so both were
measured on **both backends** before the edit: loft's `>>` **sign-extends** and `&` yields the
**non-negative** remainder. `lib/hex_voxel/tests/lattice.loft` keeps the old bodies verbatim and
compares them over `-200..200`; the sabotage that makes the shift logical reports
`chunk_of(-200) is 288230376151711737` — every negative chunk addressing memory that is not
there.

### ⚠ AND IT BROKE THE EDITOR WHILE EVERY TEST STAYED GREEN — the collision, walked into

The first spelling used `CHUNK_SHIFT` / `CHUNK_MASK`. **`src/editor_server.loft:174` already
declares `const CHUNK_SHIFT = 3`** — *"1 << 3 = 8 cells per axis"*, an **8-wide MESH chunk**,
a different chunk entirely.

| | |
|---|---|
| `hex_voxel`'s own suite | **151 green** |
| `make lib-test` | **3300 passed**, 22 of 22, **both backends** |
| `make fast` | **144 files green** |
| the editor program | `error: constant 'CHUNK_SHIFT' conflicts` — **would not build** |
| `make gate` | **all 53** reporting `SERVER NEVER LISTENED` |

That is CLAUDE.md's *"a package suite cannot see this"* reproduced exactly, on the same day it
was read. **The rule is to grep `lib/`, `src/`, `../loft-libs-world/` and the registry before
adding a public name, and it was not followed** — the grep was done *after* the gates went red,
and took ten seconds. `CHUNK_W_SHIFT` / `CHUNK_W_MASK` have zero hits anywhere, and they say what
they are derived from.

⚠ **THE GATES WERE THE ONLY INSTRUMENT THAT SAW IT**, which is worth remembering the next time
the suite is used as evidence that a change is safe: three green suites and a byte-identical
`make parts` said nothing about whether anything could RUN.

### ⛔ `empty_cells` HAS NO CHEAP WIN — looked for, not found, 2026-08-12

**No code was changed for this one, and that is the result.** The two steps before it were exact
identities — a missing early exit, and a floor divide that *is* a shift. `empty_cells` is not:

```
fn empty_cells() -> vector<StoredHex> { [for i in 0..CHUNK_CELLS { StoredHex {} }] }
```

It builds 1024 records because **the structure says a layer has 1024 cells**. What was checked
before concluding:

| | |
|---|---|
| a bulk / repeat / sized vector constructor in loft | **none.** `OpPreAllocVector` is an internal op, not a loft-level call; `LOFT.md` documents the comprehension and nothing else |
| the four call sites | **all necessary** — the dressing loop, the label insert, the terrain append, and `world_put_layer`. None creates a layer that is not then used |
| a layer materialised and immediately dropped | only when a *clear* lands on a fresh chunk, which no gesture does |
| a layer materialised before a refusal | `CW_WINDOW` is unreachable (see above), so no |

⚠ **AND THE COST IS INTERPRETER ITERATIONS RATHER THAN ALLOCATIONS**, which is why it reads
differently from the two wins before it: those were `O(1024) → O(1)` and help on **every**
backend; this is `O(1024)` either way and only the constant moves. A shipped native run pays it
too, just less.

### ⏭ SO IT IS A REPRESENTATION CHANGE, AND THERE ARE TWO — both plan-shaped

**A — do not materialise an absent chunk at all.** That is
[GROUND_DEFAULT](../../doc/claude/GROUND_DEFAULT.md), already designed with seven steps and `G1`
already measured. Its ceiling here is `empty_cells`' own **6.8 %**.

**B — a layer's cells as a flat BYTE BLOB instead of `vector<StoredHex>`.** One allocation
instead of 1024, and **the byte layout already exists** — `world_to_bytes` writes exactly these
seven fields per cell, so the encoder becomes a copy rather than a walk. Its reach is much wider
than A's, because everything that walks cells one struct at a time is on the same list:

| | share of the suite |
|---|---|
| `world_ground_cell` | 8.4 % |
| `empty_cells` | 6.8 % |
| `hex_of` | 6.6 % |
| `stored_present` | 6.4 % |
| `crc32_of` + `crc_cell` | 4.6 % |
| **together** | **≈ 33 %** |

⚠ **B IS NOT PROPOSED HERE, IT IS ROUTED.** It changes `ly_cells` for every reader in the
package, `hex_present`/`stored_present`, the CRC and the serialiser — a substrate change whose
design has not been earned, and forcing a patch into it would re-introduce exactly the class the
last three steps removed. **What is decided is only that `empty_cells` is not a local fix.**

### ⏭ WHAT IS LEFT — and it is the READ path now, not the write

`world_chunk_of` **12.4 %** (a floor-divide, called on every cell access), `empty_cells` **6.4 %**
(chunk materialisation — [GROUND_DEFAULT](../../doc/claude/GROUND_DEFAULT.md)'s own target),
`stored_present` **5.9 %** (now `hex_of`'s, the read path), `hex_of` 3.9 %. **The write path is no
longer the top of the profile.**

### ⏭ THE EARLIER HANDOVER FOR STEP 4, KEPT — it was a different problem

`stored_present` is still **13.8 %** of the suite and step 4's loop **11.2 %** more
(`hex_voxel.loft:1066`/`1067`). It **cannot** early-exit: it needs a true min/max over the whole
tile.

**The fast path it wants, and the invariant that would make it sound.** Step 4's scan feeds
exactly two decisions — *refuse if the tile spans ≥ `WINDOW`* and *rebase if the column falls
outside `[base, base + WINDOW)`*. Every **stored** cell is inside that window **by construction**:
`sv_height` is a `u16` offset from `ck_base`. So the existing tile can never trigger either
condition on its own — **only the incoming column can**, and its span (`clo`/`chi`) is already
computed before the scan. If the incoming column fits, the scan is unnecessary.

⚠ **AND THE INVARIANT IS NOT LOCALLY GUARANTEED TODAY, WHICH IS WHY THIS IS NOT DONE HERE.**
Three other functions write `ly_cells` without passing through this path — `world_set_cell`'s
fast path, `world_set_dressing` and `world_put_layer`. Before step 4 may trust the window, those
must be shown to preserve it. **That is the next step's first probe, not an assumption to build
on.**

⚠ **AND THE SAME GREP FOUND A LIVE INCONSISTENCY, MEASURED (`/tmp` probe, this session):
`world_set_cell` DOES NOT ELIDE.** Write a cell through the column path and clear it through the
fast path, and the layer *and* the chunk stay in the directory — where the column path drops
both:

```
after write:  layers 1  chunks 1
after clear:  layers 1  chunks 1   ← the column path leaves 0 and 0
```

So `E1`'s *"elision is an invariant maintained on write"* is true of `world_set_column_as` and
**false of the fast path**. It is invisible in the drawn result (an empty layer reads as absence)
and visible in the **bytes** — two semantically identical worlds can encode differently depending
on which path cleared them, which is exactly what `world_to_bytes` comparisons rest on.
**Recorded, not fixed**: the cure is now cheap (the same O(1) `stored_present(nv)` test), but it
changes what the fast path *does* rather than how fast it does it, and whether an empty layer on
disk is a defect or a tolerated state is a format decision.

## ⏭ IS THE SAMPLER USEFUL YET? — the earlier answer, kept: it was *half*

Asked again the same day. Everything below is measured on the **installed** binary,
`1dec17a0aa464303f00f9616b24580bd64a19f48400272ba09f5606c2f1e9333` (`loft 2026.8.0`, aug 12
09:38).

| the workload | can it be profiled today |
|---|---|
| a program under **`--interpret`** | ✅ **yes, and it is good** — percent and ms **by function, by loft `file:line`, and by call path** |
| a program on the **default** backend | ❌ nothing, and **no warning** — `LOFT_PROFILE=1` is accepted and ignored |
| `--native` anything | ❌ same silence |
| **`loft test` / `--tests`** — the workload we most want | ❌ nothing. Re-measured on `lavition_ui` and `hex_voxel`: **0 banners** |

⚠ **THE SUITE FIX EXISTS UPSTREAM AND IS NOT IN OUR TOOLCHAIN.** `loft-lang/loft` `5db374d4`,
*"A suite was the one loft workload the profiler could not see"*, landed **11:57 today** —
**two hours after the binary we run was installed** (09:38). Its design is the one worth
having: samples are resolved to `(function, file:line)` **per test, before merging**, because
each test gets its own `Data` and a `pc` names different code in every one — summing the raw
maps would produce something shaped exactly like a profile. One merged banner, not 39. It also
*refuses* where it cannot answer (`--native` tests, `LOFT_ALLOC_SITES` across a suite) instead
of going quiet. **Nothing here changes until `/usr/local/bin/loft` is replaced.**

⚠ **AND THE SILENCE HAS A SECOND HOME NOBODY HAD LOOKED AT: THE DEFAULT PROGRAM PATH.**
`state.arm_profiler()` sits in the **interpret** arm of `main.rs`'s program branch, so the
command a person actually types — `LOFT_PROFILE=1 loft --lib lib/ prog.loft` — exits 0 with an
empty terminal. That is #860's shape one branch over, on the path reached first. Filed as
[loft#865](https://github.com/loft-lang/loft/issues/865); the fix is the sentence `5db374d4`
already wrote for `--native` tests.

### ⚠ The library flag is a VISIBILITY switch, and it costs nothing — measured both ways

The entry above says *"set it, or the profile is a picture of your own `main`"*. Re-measured on
`editor_run` over `house.keys`, and it is sharper than that:

| | samples | accounted | wall |
|---|---|---|---|
| default | **175** | 75 ms | 0.668 s |
| `LOFT_NO_NATIVE_LIBS=1` | **33,248** | 355 ms | 0.635 s |

**190× the visible work at the same wall clock.** So the flag does not make you measure a
different animal — the run costs the same — it decides whether the library's frames are
credited to the library or to whichever program frame called in. ⚠ **And the sample count is
the tell**: the sampler is an op clock, so *hundreds* of samples for a run that does real work
means you are photographing your own `main`. `fixture.loft` is the confusing case — it profiles
identically with and without the flag, because no cdylib is in play for its cone, which is
invisible state. **Set it always.**

⚠ **NOT EVEN HALF THE WALL CLOCK IS ACCOUNTED FOR, and that is by construction.** 355 ms of a
635 ms run. `arm_profiler()` is called immediately before `execute_argv`, so parse, compile and
cache load are deliberately outside the picture — which is right for *where did my program go*
and wrong for *why is this command slow*. Two different questions; only one has this instrument.

### What it answered here anyway

`crc32_of` is **32.9 %** of the headless runner's visible work — the checksum `world_save`
writes. `editor_run` saves once per run and the script it drove has 56 lines, so a third of the
loft-level work in `make headless-same` is a checksum over 65 KB. Recorded, not chased.

## `write_cost.loft` — the fixture, not the store

```sh
loft --interpret --lib lib/ probe/perf/write_cost.loft
```

`hex_part/tests/place.loft` takes 21.5 s for 33 tests, and its `target()` helper lays a 16×16
terrain for **every one of them**. Measured: **116 ms per call**, ~0.45 ms per
`world_set_column`. Saving a part to disk, by contrast, costs **0 ms** — the filesystem was
never the problem.

⚠ **THREE HYPOTHESES ABOUT *WHY* A WRITE COSTS THAT WERE EACH REFUTED BY A PROBE.** The write
path has two `O(CHUNK_CELLS)` scans — step 4 recomputes the chunk's window over every terrain
layer's 1024 cells, and step 6 asks *did this layer empty* over 1024 more, with no early exit.
Both look like the answer. Removing step 4: 116 → 113 ms. Short-circuiting step 6: → 98 ms.
Removing **both**: → 92 ms, or **12 %**. Neutering the whole function body puts the floor at
**0.09 ms** against a full write's 0.41 ms — so ~0.32 ms is real work in the body and no single
step holds it.

⚠ **AND A CALIBRATION SAID THOSE SCANS SHOULD HAVE COST 0.3 ms EACH**, which is more than the
whole write. Two of the three numbers cannot both be right, and the disagreement is unresolved
— written down here rather than rounded off, because the next person to "find it" should know
that three obvious answers have already been measured and were wrong.

⚠ **The first version of this measurement reported `0 ms` for everything**, because `now()`
returns **milliseconds** and it was divided by 1,000,000 as though it were nanoseconds. It read
as *"the store primitives are free"* and that conclusion was published before the unit was
checked. A wrong number is worse than a guess.

## `place_phases.loft` `G1` — the probe that could have killed GROUND_DEFAULT

```sh
loft --interpret --lib lib/ probe/perf/place_phases.loft
```

[GROUND_DEFAULT.md](../../doc/claude/GROUND_DEFAULT.md)'s `G1`. It adds no library
code, so there is no `world_fill` to time: the bulk cost is **bounded from above** by
`world_set_cell`, the existing in-place write, which a `world_fill` inner loop can only
beat. Three runs, this box, interpreted:

| | per call | per cell |
|---|---|---|
| 256 × `world_set_column` — today's fixture | **105–110 ms** | 410–432 us |
| 256 × `world_set_cell` — in place | **6 ms** | 25–26 us |
| 1 × `world_set_column` — the fixed cost a bulk fill pays once | 390–400 us | — |

**The design survives**: a 256-cell `world_fill` is bounded at ~7.0 ms against 105 ms, so
**at least 14×**, and the cost is per-CALL as claimed. ⚠ **But the mechanism it credited is
not the one that pays.** The bound is 7,051 us of which the once-only fixed cost is 395 —
**94 % of what is left is per-cell**, so `G2`'s own headroom over simply calling
`world_set_cell` is at most ~2×, not the 14×. `G3` never needed `G2`.

⚠ **AND AN ISOLATED PROBE OF A STORE CALL UNDERSTATES WHAT A TEST PAYS FOR IT BY 3.5×.**
`place.loft` calls `target()` 46 times — counted with a `println` in the body, not
inferred — and timed *in place* each call cost **372 ms**, against the 105 ms measured
here. 46 × 372 ms is **84 % of that file's whole runtime**. The obvious explanation was
allocation pressure, and it is **refuted**: the probe re-times both paths holding a
hundred live worlds and both are unchanged (105 ms and 6 ms). The gap belongs to the test
harness. That control is kept in the probe, because a refuted hypothesis with a
measurement beats an open question.

### Its controls, which are what make the comparison mean anything

- **Same world** — all 256 cells compared, plus each of the 4 chunks' layer CRC. Both 0.
- **Same clock** — `w_tau` 257 either way. Neither the cells nor the CRC can see it, and
  it is the quantity every `hex_editor` timing test asserts on.
- **Same in both orders** — each path is timed twice, on either side of the other. ⚠ This
  exists because two runs of unchanged code once reported **107 ms and 271 ms** for the
  same loop while `PHASE target` in the same process said 108 ms both times. The box is
  shared and it drifts; a single reading is not a measurement.

### `G1`(b) — and it refutes a sentence of its own design

Under GROUND_DEFAULT a column over untouched ground is synthesised rather than read from a
chunk. 102,400 reads each way:

| | stored | absent |
|---|---|---|
| `world_column` | 2167 ns | 1035 ns |
| `world_surface` | 1103 ns | 947 ns |
| `world_cell` | 1376 ns | 1250 ns |

⚠ **The design says *"if synthesising a column is not far cheaper than reading a stored
one, there is nothing here"*, and by that test there is nothing here** — for the two
accessors that get hammered it is within 20 %. **The test is the wrong one.** The design
does not remove the read, it removes the WRITE: a fixture that declares its ground pays
for no columns at all. What the read has to be is **not dearer**, and a stored read is the
ceiling for that, because a miss does strictly less work than a hit.

⚠ **The first version of the read measurement printed `0 us` for every absent path**,
because the clock is milliseconds and 25,600 reads is under one. `0` is what a floor and a
free operation look like alike.

## The shared-server probe — ⚠ it killed the design by removing its reason (BUILT 2026-08-07)

Asked 2026-08-07, after the gate suite came down to 655 s of work with ~220 s of that
being 44 servers reaching *listening*. The proposal was to **share a server across
gates**. Probed before building, and it should not be built.

**Startup is 5–6 s because the server is INTERPRETED, not because starting one is
expensive.** The same server, already compiled, exec'd straight from loft's cache:

| how the gate's server is started | to *listening* |
|---|---|
| `loft --interpret` (what `run-gates.sh` does today) | **~6000 ms** |
| `loft --native` | ~3500 ms |
| **exec `src/.loft/cache/editor_server-<hash>` directly** | **217–273 ms** |

Five gates run that way, all PASS with their usual verdicts: `fence` 8.1 → 2.7 s,
`storey` 9.2 → 3.6 s, `doorstep` 7.7 → 2.9 s, `part_sock` 17.2 → 13.5 s, `part_new`
13.4 → 9.4 s. **And no isolation is given up** — every gate keeps its own process, port
and `EDITOR_PARTS` copy, which is exactly what sharing would have cost. (Sharing also
cannot work as posed: `EDITOR_PARTS` is read at server start, so one server means one
part library, and `part_save`, `part_new` and `library` all mutate it.)

⚠ **THE ONE WAY THIS IS FATALLY WRONG, MEASURED RATHER THAN ASSUMED: a stale binary
runs old code SILENTLY.** With `editor_server.loft` edited to answer `placed 0,0
STALEPROBE`, exec'ing the cached path still answered `placed 0,0`. A runner that execs a
fixed path tests whatever was last compiled, and passes.

✅ **But the cache is content-addressed and self-cleaning, which is what makes it safe.**
Editing the source and rebuilding produced `editor_server-879386d85355772e` **and removed
`editor_server-25acec083708faca`**; reverting the source and rebuilding restored
`25acec083708faca` exactly. So the rule is **`loft --native` once (~29 s, cached across
runs) before the fan-out, then glob-and-exec** — a stale binary cannot survive the build,
and the glob cannot find one that does not exist.

⚠ **What it would change about coverage, and it is arguably an improvement**: the gates
would exercise the NATIVE server, while today they exercise the interpreted one. `make
play` — the shipped way to run the editor — is already native, and `camera_indoors`
measures identical rows on both (240 s interpreted, 248 s native). ⚠ **A loft install
invalidates the cache**, so the build step has to be part of the target rather than
assumed.

✅ **BUILT, AND IT COST TWO MORE FINDINGS THE PROBE HAD NOT REACHED.** `run-gates.sh`
builds once and execs; 44 PASS, work **655 s → 483 s**, wall **168 s → 126 s**. But the
first full suite was **7 gates red with every verdict lying about why** — `subject
0.0001`, *(no cache report)*, failed acks — and all of it was ONE cause: a compiled loft
program roots its relative file I/O at **its own directory's parent**, baked in, and
neither `--project` nor an env var overrides it (both measured). The binary is copied to
`.gatebin/server`, one level under the repo, to put that root back — ⚠ **and the client
page has to travel with it**, since `read_client()` reads
`{source_dir()}/.loft/editor_client.html`: the server served its own 404, 178 bytes
against 2.3 MB, and the browser drew nothing. **A missing FILE wearing a renderer's
clothes, twice.**

⚠ **AND THE PROBE ITSELF DROVE ANOTHER AGENT'S EDITOR.** Its first run took ports from
18490, which a sibling's server had held for five hours; the probe's own server died on
`cannot bind`, and the gate connected to theirs and laid a fence ring in their live
world. Nothing reached disk — `fence.mjs` sends no `8:` or `9:` — but **pick a port after
checking it is free, not before**, and keep the pid of what you start.

## `profile_counts.mjs` / `profile_tau.mjs` — the instrument, and its two checks

`27:2` arms a per-message profile; `27:3` reports `id count us tau` per message id. See
[WIRE_PROTOCOL § `27:`](../../doc/claude/WIRE_PROTOCOL.md).

```sh
EDITOR_PORT=18777 node probe/perf/profile_counts.mjs   # the counts it should find
EDITOR_PORT=18777 node probe/perf/profile_tau.mjs      # the column that was all zeroes
```

- **`profile_counts`** sends exactly five `7:` and three `15:` and requires the report to say
  `7 5` and `15 3`. An instrument that cannot be checked against a load it should find is one
  nobody should believe.
- **`profile_tau`** exists because the first check's `tau` column read **0 on every row** — the
  right answer for a place and a column read, and indistinguishable from a broken column. Three
  `5:` raises give `5 3 17326 273`. ⚠ **A column that has only ever printed zero has not been
  demonstrated.**

⚠ **Both need a server, which is what the rest of this directory is about.** They are checks on
the instrument, run once when it changes — not gates.
