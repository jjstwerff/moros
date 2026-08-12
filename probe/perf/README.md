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

### ⛔ `world_set_column_as` — two transformations, no gain, 2026-08-12

**7.0 % of the suite and its by-line rows are not in the top fifteen** — the cost is spread
across the whole function, which is the shape that has no single edit. Two were tried anyway;
**nothing shipped.**

**1 — build the record only if it is needed.** Step 5 constructed a `StoredHex` and *then*
compared `prev` against its fields, so every write that changed nothing still allocated one — and
`T1` exists precisely because a write that changes nothing is the common case. Comparing against
the source values instead is the same test and cannot be slower.

⚠ **Measured: −0.01 %** (2,201,138 → 2,200,937). Real, in the right direction, and 201 samples
out of 2.2 million. **The model behind it was wrong**: `empty_cells` is 6.8 % because it allocates
**1024 records at once**, not because one record is dear — and this path is not called often
enough for one to show. *A cost that is large in aggregate somewhere else is not evidence about a
single instance here.*

**2 — iterate instead of index**, the transformation that won 1.6× in `world_ground_cell`. Step 5
reaches `w.w_chunks[ci].ck_layers[i]` **four times** per turn, three levels deep.

⚠ **It broke six tests** — *"the clock did not move for a CELL write"* — and **I could not explain
why.** Three hypotheses refuted by their own probe: a whole-element assignment through a loop
binding **does** propagate; so does a nested field write; and three `for ly in …` loops over one
vector in a single function **do not** interfere. Reverted, and the tree is back at its committed
state.

**Not pursued further.** One transformation measured 0.01 % and the other cost six red tests with
an unexplained mechanism, against an upper bound of roughly half a percent. ⏭ **The reason this
function resists a local edit is the reason it is 7 %**: it is straight-line work spread over six
steps, and the two steps that *did* have a shape to exploit were already taken.

### ⛔ `find_chunk` — a sound design, measured WORSE, 2026-08-12

`find_chunk` is 3.8 % and `chunk_key` 2.4 %. Both were probed; **nothing shipped**, and the
reason is the useful part.

**Where the time is** — 500k lookups, net of a 65 ms empty loop:

| | |
|---|---|
| `find_chunk` body (key + hash probe) | **131 ms** |
| the hash probe alone | 81 ms |
| `chunk_key`, including its call | 50 ms — of which **42 % is the call** |

**The design: a one-entry memo, checked rather than trusted.** Remember the last chunk resolved
and confirm it with `ck_cx`/`ck_cz` instead of deriving the key and probing again. A stale index
either names a different chunk or falls out of range, so it **falls through** — meaning *nothing
anywhere has to invalidate it*. `N = 1`, no silent failure, no coordination with the seven sites
that touch `w_index` or with `reindex`. Written down before the code, with the failure paths
enumerated and a falsifier: *a gain near zero means consecutive lookups rarely hit the same chunk*.

⚠ **IT COST 2.9 % INSTEAD OF SAVING 1.5–3 %.** `2,201,138 → 2,264,294`; `find_chunk` went
**3.8 % → 8.8 %**, the guard line alone 7.8 %. Reverted, and the op clock confirms the revert
exactly — back to 2,201,138 to the sample.

Two reasons, and the second is the one to carry:

- **the guard is four conditions**, over three reads of `w_last` and a `len()` call. The probe
  that priced it measured **two** compares with a *literal* index — so it priced a simpler check
  than the design needs. ⚠ **A probe of a simplified version of the thing is a probe of a
  different thing**, and it reads as evidence.
- **and it mostly misses.** That was the written falsifier, and it fired.

⚠ **INLINING `chunk_key` WAS MEASURED TOO: −0.74 %, and not taken.** It would put the store's key
encoding in two places — this reader and the six writers that build `ca_key` — where a divergence
makes every lookup miss. Loud in a suite, and still the class that cost a whole gate run today.
**0.74 % of a test-time profile does not buy a second home for the key.**

✅ **AND THE PROBE FOUND AN ICE ON THE WAY.** `struct W { idx: hash<integer, At> }` — the wrong
arity for loft's hash type, which is `hash<At[ca_key]>` — **panics the compiler** with `index out
of bounds: the len is 6 but the index is 18446744073709551615` at `typedef.rs:1260`, and points
its caret at the closing brace of `main`.
[loft#874](https://github.com/loft-lang/loft/issues/874), three lines.

### ✅ `world_ground_cell` — iterate, do not index, 2026-08-12

The top of the profile at **8.4 %**, and it scans a chunk's layers for the one labelled
`LABEL_GROUND`. The scan was indexed:

```
was:  for i in 0..len(w.w_chunks[ci].ck_layers) {
        if w.w_chunks[ci].ck_layers[i].ly_id == LABEL_GROUND
           && w.w_chunks[ci].ck_layers[i].ly_kind == KIND_TERRAIN { … }
now:  for gcl in w.w_chunks[ci].ck_layers {
        if gcl.ly_id == LABEL_GROUND && gcl.ly_kind == KIND_TERRAIN { … }
```

`w.w_chunks[ci].ck_layers[i].ly_id` walks **three levels for one field**, and the condition
reads **two** — six navigations per layer where a loop binding pays two. Measured on a standalone
probe before the edit: 200k scans over a 4-layer chunk, **369 ms indexed against 229 ms
iterated, 1.6×**.

⚠ **THE BINDING IS A REFERENCE, NOT A COPY**, which is the thing that would have made this a
pessimisation rather than a win — a `Layer` carries 1024 cells. Established from the tree's own
code rather than assumed: `world_set_column_as`'s rebase mutates `ly.ly_cells[j].sv_height`
through exactly this form and the change sticks.

**2,222,770 → 2,201,138 samples, −1.0 %**, `world_ground_cell` 8.4 % → 7.9 %. Three scans of the
same shape were rewritten (`world_ground_cell`, `world_ground_layer`, `world_put_layer`).

⚠ **AND THE PREDICTION WAS 1.5–2.5 %, SO IT UNDER-DELIVERED.** The two hot by-line rows inside
the function were the scan's condition, and they added to 4.1 % — but a 1.6× on them is not 1.6×
on the function, because `find_chunk`, `cell_index` and the four-level cell navigation are the
rest of it and did not move. **Recorded because the gap is the useful part**: a by-line total is
not a budget for the improvement, it is a budget for the *work at that line*.

⏭ **WHAT IS LEFT IN IT IS NOT LOCAL.** The remaining self-time is `find_chunk` + the four-level
`ck_layers[gl].ly_cells[cell_index(q, r)]` navigation, on a function whose callers sample
**neighbouring hexes of the same chunk** in a loop (a mesh rebuild). The fix is a one-entry
memo of *last chunk key → (chunk index, ground layer index)* — and ⚠ **the chunk vector is
REORDERED when an emptied chunk is dropped** (`reindex`), so a stale memo is a silent wrong-cell
read. That is a design with an invalidation invariant, not a local edit.

### ⛔ THE FLAT BYTE BLOB — and the two loft defects found trying to price it, 2026-08-12

**Route B was probed, not built, and the probe found two language defects instead.** The design
protocol's step 3 is *the cheapest test that could prove the load-bearing claim false*; the claim
was **a layer's cells are cheaper as flat bytes than as 7-field structs**, and the probe for it
would not run.

⚠ **THE HARNESS WAS THE FINDING.** Three probe attempts timed out at 600 s on workloads of a few
thousand operations. Bisecting the harness rather than the idea:

| `loft --interpret`, one-line programs | wall |
|---|---|
| `[for i in 0..16 { 0 as u8? ?? 0 }]` | **0.04 s** |
| `[for i in 0..17 { 0 as u8? ?? 0 }]` | **> 25 s**, killed |
| `[for i in 0..512 { 0 as u8? ?? 0 }]` | **> 120 s**, killed |
| `[for i in 0..32 { 0 as u16? ?? 0 }]` | **> 25 s**, killed |
| `[for i in 0..7168 { 0 }]` — plain `integer` | **0.06 s** |
| the same 7168 bytes by **append loop** | **0.04 s** |

**A comprehension yielding a RANGED integer stops terminating above sixteen elements.**
[loft#871](https://github.com/loft-lang/loft/issues/871). Not the size, not the cast — the
element type, with a cliff at exactly 16 → 17. ⚠ **That is what a flat-byte-blob layer is built
with**, so route B reads as unworkable until the harness is bisected; the append form is instant
and is the workaround.

### ⛔ AND THE MICRO-WIN IT UNCOVERED DID NOT SURVIVE THE SUITE

The same bisect showed the append form is **2.1×** faster for structs too — 100 × 1024 elements,
**179 ms** by comprehension against **85 ms** by append. So `empty_cells` did have a local win
after all, and the section below saying it had none **was wrong when it was written**: that survey
asked whether loft had a *bulk constructor* (it does not) and never compared the **two forms it
does have**. ⚠ *Checking for a missing feature is not the same as comparing the ones present.*

**Applied, measured, reverted.** In the suite it was worth **0.6 %** (2,222,770 → 2,208,893), and
it **broke two dressing tests** — a prop vanished when the ground under it was raised.

⚠ **FOUR HYPOTHESES FOR WHY WERE EACH REFUTED BY THEIR OWN PROBE**: two calls do not share
storage; cells within one vector do not alias; neither changes at 1024 rather than 4; and neither
changes when the vector goes into a struct field inside a vector of structs — the shape the store
actually uses. **The two forms produce identical values in every probe and different behaviour in
the consumer.** [loft#872](https://github.com/loft-lang/loft/issues/872) carries it with the four
refutations attached, so nobody repeats them.

**Not shipped.** 0.6 % does not buy a change to the store's core whose mechanism nobody can state
— and the fifth hypothesis forming was the cue to stop, not to fire again.

### ⏭ SO ROUTE B IS NOT REFUTED, AND IT IS NOT READY

Its arithmetic still holds — one allocation instead of 1024, an encoder that becomes a copy, and
a reach of ≈ 33 % of the suite. What the probe established is that it **cannot be built on the
comprehension** (#871) and that **the append form is not a safe substitute in this position**
(#872). Both are upstream, both are filed, and either landing changes the price. **Until then the
design has no honest cost.**

### ⛔ `empty_cells` — the earlier survey, kept because it was WRONG in an instructive way

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

## ✅ `fill_cost.loft` — `world_fill` priced, and the ratio is not the finding

**GROUND_DEFAULT `G2`, built and measured 2026-08-12.** The plan carried an *estimate* —
*"what is left for `world_fill` to win is the ~2× between 25 us a cell and whatever a
hoisted inner loop costs"* — written before three optimisations landed in this very write
path. An estimate against a moving subject is not a number.

```sh
loft --interpret --lib lib/ probe/perf/fill_cost.loft
```

| shape | chunks | `world_set_cell` loop | `world_fill` | ratio |
|---|---|---|---|---|
| 1×1 — **the fixed cost** | 1 | 1200 us | 1200 us | **100 %** |
| 16×16 — `place`/`expand`'s target | 1 | 2300 us | 1300 us | 176 % |
| 22×22 — `bind`/`scale`'s 484 columns | 1 | 3250 us | 1425 us | 228 % |
| 33×33 — `hex_editor/tests/field`'s | 4 | 9950 us | 5150 us | 193 % |

⚠ **THE RATIO IS THE WRONG COLUMN, AND THE 1×1 ROW IS WHY IT IS THERE.** Every reading
includes a **fixed cost of ~1200 us per CHUNK** — a fresh world, a chunk materialised,
`empty_cells`'s 1024 records — which both paths pay identically and neither can avoid. Net
of it, the **marginal** cost of one cell is:

> **4.2–4.7 us through `world_set_cell`, against 0.3–0.5 us hoisted — 10 to 14×**, not 2×.

That also explains the row that looks worst: 33×33 straddles four tiles, so it pays the
fixed cost four times and its *ratio* falls while its *marginal* cost is the lowest of the
three.

### ⛔ NOTHING IN ONE SUITE, −10.7 % IN THE NEXT — and the difference is the finding

The same change was wired into two packages and only one of them felt it.

| | fixtures | result |
|---|---|---|
| `hex_part` — `place`, `expand`, `bind`, `bake`, `scale` | 256–484 cells | **310 tests, 44.8 s → 45.3 s.** Noise |
| `hex_editor` — 27 loops in 22 files, via `ground_fill` | up to **2401** cells (49×49) | **2,472,585 → 2,208,143 samples, −10.7 %** |
| …and its fixture-heaviest file, `slope_limit.loft` | 49×49, 28 tests | **224,744 → 160,464, −28.6 %**, same 28 runs |

⚠ **AND THE SMALLER NUMBER INCLUDES THREE TESTS THE LARGER ONE DOES NOT** — 424 runs before,
427 after, because `ground_fill.loft` is new. The comparison is conservative by exactly that.

**What separates them is how much of a test its fixture IS.** `hex_part` had already taken
`G3`'s win, its rectangles are a tenth the size, and its tests write part documents to disk —
so the write path is a small share of a large test. `hex_editor` re-lays a 2401-cell landscape
per test and does its real work in memory. *A 14× on an operation is worth what that operation
was worth, and that is a property of the caller, not of the change.*

### ⚠ AND THE WALL CLOCK SAID THE OPPOSITE — 2m04 before, 4m03 after

Measured on this box, one run each, and **it is the wrong sign**: the wired suite came back
**twice as slow**. The sampler on the same tree says −10.7 %, and the single file says −28.6 %
across 28 identical runs. This box is shared with other agents' work, so a lone wall-clock
reading is a measurement of the box.

⚠ **A NUMBER THAT DISAGREES WITH THE MECHANISM IS A CUE TO CHANGE INSTRUMENT, NOT TO BELIEVE
IT** — and equally not to dismiss it. What settled it was the *same file, same run count,
counted in samples*: work rather than seconds, and the instrument this directory already
established for exactly this question.

### ⚠ THE INSTRUMENT WAS WRONG FIRST, AND IT SAID SO OUT LOUD

The first run reported a **one-cell fill at 2025 us against a 256-cell fill at 1350** — a
marginal cost per cell that is *negative*. The first timed block absorbs a warm-up. The
probe now runs 40 discarded worlds before it times anything and prints the 1×1 shape
**twice, first and last**: 1200 / 1200 us, agreeing. ⚠ **An impossible number is the good
case** — it announces the artefact. The same artefact one shape smaller would have read as
a plausible result.

⚠ **AND EVERY SHAPE IS TIMED A B B A**, because this box drifts: two runs of unchanged code
have reported 107 ms and 271 ms for one loop. Both readings of each path are printed, so a
pair that disagrees with itself is the instrument talking.

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
