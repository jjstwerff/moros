# A layer is born with a default cell — the ground's, per scenario

**Status: designed, not built.** Written before the code on purpose: the failure paths below
are what turned the first shape of this design into the third, and each turn was cheaper on
the page than in the store.

## Why — measured, not assumed

`hex_part` runs 254 tests in **77 s**; `lavition_ui` runs 65 in **447 ms**. Nothing about the
harness makes a test slow (2.2 ms marginal per test, 62 ms for a whole trivial package). What
makes one slow is what it *builds*. Broken down on the slowest file in the slowest package —
[`probe/perf/place_phases.loft`](../../probe/perf/place_phases.loft):

| phase of one `place.loft` test | per test | share |
|---|---|---|
| `stage()` — three part documents written to disk | 6 ms | 5 % |
| **`target()` — a 16×16 terrain fixture, 256 `world_set_column` calls** | **109 ms** | **85 %** |
| `part_expand()` — what the test actually asserts | 11 ms | 8 % |

⚠ **The fixture costs ten times the subject.** And it is not a test-only concern: the user's
requirement is that **different scenarios need different ground**, so a world that starts as
*flat grass at height 5* or *bare rock at 20* is a product feature, and today the only way to
say it is to write every cell.

⚠ **AND THE WRITE PATH IS NOT WHERE THE FIX IS.** Three separate hypotheses about *why* a
`world_set_column` costs 0.45 ms were each refuted by a probe: the step-4 window scan is worth
3 %, the step-6 elision scan 6 %, both together **12 %**, against a floor of 0.09 ms for a call
whose body does nothing. The cost is spread through the body, so **the win is in making 256
calls into one**, not in making each call cheaper.

## The invariant

> **A layer is created with every cell set to its kind's default — the world's ground cell for a
> chunk's first terrain layer, absent for every other — and nothing downstream can tell a
> defaulted cell from a written one, because there is no difference.**

That last clause is the whole safety argument, and it is what the second draft of this design
did not have.

## What that buys, and what it deliberately does not do

**Not** a sparse encoding. A default that is *materialised at layer creation* and a default
that is *stored once and applied at read* sound like the same feature and are not:

| | materialise on create (this design) | store-and-apply-on-read (rejected for now) |
|---|---|---|
| what a reader sees | today's bytes, exactly | a value that is not in the array |
| presence semantics | unchanged | redefined |
| file format | **unchanged** — `SZ_LAYER` is a fixed 8196, all 1024 cells always written | changed; version bump, no going back |
| "the author dug this cell out" | an ordinary all-zero write | **ambiguous** with never-written — needs a per-cell bit |
| sites that must re-state it | **0 outside the store** | see below |

⚠ **THE COUNT IS THE ARGUMENT.** *Is a cell there* is decided at **108 sites**, **78 of them
outside `hex_world`**, and getting one wrong is silent — a wrong picture, not a compile error.
A design that redefines presence has to be right at all 108. Materialising at creation
redefines nothing, so it is right at all 108 for free.

⚠ **AND THE THIRD ROW IS THE ONE THAT CANNOT BE UNDONE.** `SZ_LAYER = 8196` is fixed: a layer
with 256 present cells and a layer with 1024 both write 8196 bytes. So filling a layer costs
**nothing on disk**, `world_file_size` is unchanged, and `probe/sparsity.loft`'s exact figures
— which are exact on purpose — do not move. The sparse encoding is the step that changes the
format, and it is the one step here that can never be shipped back.

## Failure paths — enumerated before the code

1. **A default that is ON by default changes every existing world.** A chunk's ground layer
   would suddenly fill its whole 32×32 rather than what was authored. → **`w_ground` starts
   absent, and absent means today, exactly.** Nothing changes until a scenario asks.
2. **The ground layer is minted implicitly**, inside `world_set_column`'s step 3, when a chunk's
   first terrain layer takes `LABEL_GROUND`. The default has to reach *there*, not the caller.
   → it is a field on `World`, read at the one place a layer is created.
3. **A layer born full is never empty**, so step 6's elision never drops it. That is correct —
   it is full — but a scenario that clears every cell must still see the chunk leave the
   directory. → the existing rule already says *no present cells*; nothing to change, and the
   test for it is the negative control.
4. **The window.** A layer born at height `h` has `lo = hi = h`, and `W1` must still hold across
   a chunk whose other layers were authored far above. → the default participates in step 4's
   span exactly as an authored cell does, because it *is* one.
5. **`ε`/`θ` and `F1`.** A ground layer at the default under an authored layer must respect the
   fold rule. → `check_column` already compares absolute heights; a defaulted cell is absolute.
   ⚠ **But `R1` — nothing below the reserve — must be checked against the default when the
   world is made, not when a layer is born**, or a scenario sets a ground under `ρ` and the
   failure surfaces in an unrelated chunk much later.
6. **The wire and the client's cache.** Layer bytes go to the client and are digested. A layer
   born full has different bytes than one born empty — which is right, and it means the digest
   moves, which is what a digest is for. → nothing to do, but the `cache` gate is the check.

## The probe that could falsify the whole thing

**Before any of it: does one bulk write actually recover the 109 ms?** The claim is that the
cost is per-call overhead paid 256 times. If a single call that lays the same 256 cells still
costs ~100 ms, then the cost is per-*cell* and this design is aimed at the wrong thing —
every step below would deliver a fraction of what it promises.

`probe/perf/place_phases.loft` already measures the baseline; the probe adds one column to it.
An afternoon, and it is step `G1`.

⚠ **Expect it to fire.** Three hypotheses about this write path have already been refuted by
their own probes today, and the floor measurement (0.09 ms of a 0.41 ms call) says only ~78 %
of a call is body at all.

## The steps — each one green, each one revertible

| | | why it is safe alone |
|---|---|---|
| **`G1`** | **The probe.** Add a bulk-fill column to `place_phases`: lay the same 256 cells in one call and time it. **No library change.** | measures the premise before anything rests on it |
| **`G2`** | `world_fill(w, q0, r0, q1, r1, cell) -> ColumnWrite` — a rectangle in one call: one `check_column`, one `find_chunk`, one window pass, one elision pass. | a **pure addition**; no existing caller changes, no existing behaviour moves. If `G1` refuted the premise, `G2` is where it stops |
| **`G3`** | The fixtures use it. `target()` becomes one call. | tests only; the win becomes visible in the suite time and nothing shipped changed |
| **`G4`** | `World` gains `w_ground: Hex`, **absent by default**, checked against `ρ` at `world_new`. A chunk's first terrain layer is minted filled with it. | absent = today, byte for byte. The negative control is a world with no ground set: every count in every suite unchanged |
| **`G5`** | The scenario sets it — `world_new` takes it, and the editor exposes it. | the feature the user asked for; by now the store half is already green |
| **`G6`** | ⚠ **Only if measured to matter:** the sparse encoding — store the default once, apply on read. **Format change, version bump, a per-cell "explicitly cleared" bit.** | deliberately last and deliberately separate. `G1`–`G5` do not need it, and it is the only step that cannot be shipped back |

⚠ **`G2` BEFORE `G4`, AND THAT ORDER IS NOT COSMETIC.** `world_fill` is the mechanism a layer's
birth-fill uses; building the default first would mean writing that loop twice, and the second
copy is the one that drifts.

⚠ **`G6` IS THE ELEGANT ONE AND IT IS LAST ON PURPOSE.** *"A default stored once, so an infinite
flat world costs nothing"* is the version of this design that reads best, and it is the one that
redefines presence at 108 sites, needs a bit that does not exist, and bumps a format that four
of this tree's exact-size proofs are written against. `G1`–`G5` deliver the whole measured win —
85 % of the slowest test file — and change no format at all.

## What this does not touch

The **gates**. 44 gates cost ~1838 s of work, of which 984 s is five browser gates and ~238 s
is 44 servers reaching *listening*. That is a larger number than anything here and it is a
different problem — a test that needs a server is a test that pays for one. This design makes
the *in-process* tests fast; moving claims out of the gates is
[plan 19](../../plans/19-lavition-split/README.md)'s and the gates' own business.

## See also

- [WORLD_MODEL](WORLD_MODEL.md) — Part II is the normative contract these rules (`E1`, `F1`,
  `R1`, `W1`, `T1`, `T2`) are cited from
- [`probe/perf/README.md`](../../probe/perf/README.md) — every number above, and the three
  refuted hypotheses behind them
