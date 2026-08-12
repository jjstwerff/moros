# A layer is born with a default cell — the ground's, per scenario

**Status: COMPLETE except `G2`.** `G1`, `G3` (2026-08-06), `G4`, `G5a`, `G5a.1`, `G5b`, `G6` and
`G7` (2026-08-12) are built. ⚠ **`G2` (`world_fill`) is deliberately not built** — `G1` measured
its speed argument away (`G3` took the 14× with `world_set_cell`, leaving `world_fill` about 2×),
and `G5` removed its remaining consumer: a scenario states its ground instead of filling it. Written before the code on purpose: the failure paths below are what turned the first
shape of this design into the third, and each turn was cheaper on the page than in the store.

⚠ **`G4` IS THE DEFAULT ITSELF AND NOTHING READS IT YET** — `w_ground` on `VoxelWorld`,
`world_set_ground` with `R1` checked where the ground is STATED, and a `GRND` section in the
codec. **Absent means today, byte for byte**: `make parts` is byte-identical and every suite is
at its previous count. `lib/hex_voxel/tests/ground_default.loft` is eight tests, and a step
nothing reads still went red three ways — the `R1` check removed (1 red), the codec not reading
the tag back (3), the codec not writing it (3).

## ⏭ What `G1` turned up, and it reordered the plan

**The design survives its own falsification probe, and the mechanism it credited does not.**
`G1` is built in [`probe/perf/place_phases.loft`](../../probe/perf/place_phases.loft); every
number below is from it, with the controls in
[`probe/perf/README.md`](../../probe/perf/README.md).

| | per call | per cell |
|---|---|---|
| 256 × `world_set_column` — today's fixture | **105–110 ms** | 410–432 us |
| 256 × `world_set_cell` — the in-place write, which already exists | **6 ms** | 25–26 us |
| 1 × `world_set_column` — the fixed cost a bulk fill pays once | 390–400 us | — |

✅ **The cost IS per-call, as claimed** — a 256-cell `world_fill` is bounded at ~7.0 ms
against 105 ms, at least **14×**. `G2` is not refuted.

⚠ **BUT `G3` NEVER NEEDED `G2`, AND THAT IS THE FINDING.** `world_set_cell` is 17× cheaper
than a one-cell `world_set_column` **today, with no library change**, because a height inside
the chunk's window cannot move the window — so it skips step 4's per-layer 1024-cell window
scan and step 6's 1024-cell elision scan entirely. Of the 7,051 us the bound allows, only 395
is the once-only fixed cost: **94 % of what a `world_fill` would still pay is per-cell**, so
`G2`'s headroom over just calling `world_set_cell` is about **2×**, not 14×. The plan had
`G2` as the mechanism that recovers the 109 ms; measured, it recovers the last 6 % of it.

✅ **SO `G3` LANDED FIRST, AND WITHOUT `G2`.** Four fixtures, four test files, one substitution
— measured end to end, interpreted, this box:

| | before | after |
|---|---|---|
| `hex_part/tests/place.loft` | 20.4 s | **6.8 s** |
| `hex_part/tests/bind.loft` (484 columns) | 12.7 s | **5.2 s** |
| `hex_part/tests/bake.loft` (324) | 6.4 s | **4.5 s** |
| `hex_part/tests/expand.loft` | 5.3 s | **2.5 s** |
| **`hex_part`, all 254 tests** | **77 s** | **35 s** |

⚠ **AND AN ISOLATED PROBE OF A STORE CALL UNDERSTATES WHAT A TEST PAYS FOR IT BY 3.5×.**
`place.loft` calls `target()` **46 times** — counted with a `println` in the body, not
inferred from the source — and timed *in place* each call cost **372 ms** against the
probe's 105 ms, which is **84 % of that file's whole runtime**. The obvious explanation was
allocation pressure and it is **refuted**: re-timing both paths while holding a hundred live
worlds leaves both unchanged. The gap belongs to the test harness, not to the store. The
refuted control stays in the probe.

⚠ **THE CONTROLS ARE WHAT MAKE THE SUBSTITUTION SAFE, AND ONE OF THEM SEES WHAT THE OTHERS
CANNOT.** The two paths build the same world — all 256 cells equal, all four chunk layer CRCs
equal — **and the same `w_tau`, 257 either way**. A fixture that swapped write paths and moved
the edit clock would break every `hex_editor` cost test with every cell agreeing.

### ⚠ The substitution is EXHAUSTED — swept, so nobody sweeps it again

A scanner over every `.loft` in `lib/`, `src/` and `probe/` for a `world_set_column` inside a
loop, by loop depth. It has a positive control by construction: it still finds the sites left
behind, and it stopped finding the four this step changed.

- **The four that mattered are done.** Nothing else in any test suite fills a region big enough
  to pay for. What is left — `hex_part`'s `region`/`roundtrip`/`save_edit` — is ~100 cells across
  ~10 calls, worth **under half a second** between them, against churn in three files.
- ⚠ **The shipped editor was already right, and it is worth knowing why.** `hex_editor`'s
  `ground_set` → `ground_write` → `layer_write` is `world_set_cell` already; its own comment
  records the measurement that put it there (*a 91-cell brush stroke was 45 ms, a 10,000-cell
  fill 16 s*). So `field.loft`'s 1089-cell fixture and `storey.loft`'s 441 are on the fast path
  and there is no second `G3` hiding in `hex_editor`.
- **The remaining `world_set_column` calls in `gesture.loft` are not substitutable and must not
  be touched**: they pass `co_ids` to insert a *named layer* at a position, which is the one
  thing `world_set_cell` cannot do — it writes an existing layer index. `world_set_cell`'s own
  fallback exists for exactly that case.

**Where the suite time is now** (interpreted, this box, per package): `hex_editor` **56 s** ·
`hex_part` **35 s** · `moros_sim` 24 s · `hex_voxel` 7.6 s · `moros_render` 7.3 s · the other
six under 3 s each. ⚠ **`hex_editor` is flat** — 23 files between 1.4 s and 5.4 s, no fixture
dominating, so it is 235 tests of real work and not another `place.loft`. ⚠ **And package mode
costs nothing extra**: `loft test` over `hex_part` and the sum of its 16 files run separately
agree at 35–39 s, so a per-file loop is a fair instrument. The first reading suggested a 5×
package-mode penalty and that was drift.

⚠ **AND THE BOX DRIFTS, SO A SINGLE READING IS NOT A MEASUREMENT.** Two runs of unchanged code
reported **107 ms and 271 ms** for the same loop while `PHASE target` in the same process said
108 ms both times, and `place.loft` came back at 18.9 s once and 6.8 s four times running.
The probe now times each path twice, on either side of the other, and prints both.

**What `G1`(b) says, and it refutes a sentence of this document.** See *The probe that could
falsify the whole thing* below — the read half asked the wrong question.

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

> **A world is an infinite plane of its ground default, and storage holds only what differs
> from it. A chunk that was never written returns the default; a layer that comes to equal the
> default everywhere stops existing. A defaulted cell and a written one of the same value are
> indistinguishable, because they are the same cell.**

⚠ **THAT IS A STRONGER CLAIM THAN THIS DOCUMENT'S FIRST TWO DRAFTS, AND IT IS THE RIGHT ONE.**
Draft 2 materialised the default when a *layer* was created, which makes flat ground cheap to
*author* and still charges for every chunk the author never touched. The requirement is
*"a chunk that has no written values should return the defaults even without internal data"* —
so the default is a property of the **world**, consulted where a chunk is **absent**, and the
sparsity that follows is the point rather than a side effect: **you pay for what you differ
from the ground, and nothing else.**

The last clause is the safety argument. It is what lets the 108 presence sites below stay
untouched: they ask *is there a cell here*, and under this invariant the honest answer over
untouched ground is **yes** — which is the behaviour change intended, not a rule they each
have to re-state.

## The format does not move — checked, not assumed

The reason this can be built safely is that **the default needs no new bytes anywhere the
format already fixes.**

- **An absent chunk is already absent from the file.** The format is sparse over chunks
  (`SZ_HEADER + Σ chunks`), so an infinite default plane writes exactly the chunks that differ
  from it — which is what a sparse format is for. Nothing about `SZ_CHUNK`, `SZ_LAYER` or
  `SZ_LAYER_DIR` changes.
- **The default itself rides in a SECTION**, and sections are forward- and backward-compatible
  by construction: they are tagged, the library "carries whatever it was handed" rather than
  having an opinion about content it cannot read, and *present-and-empty* is already a
  distinguishable state. So **a new file loads in an old build** (which ignores the tag and sees
  today's world) and **an old file loads in a new build** (no section → default absent → today).
  ⚠ **No `WORLD_VERSION` bump, in either direction** — checked against
  `world_set_section` / `world_section_at`, not assumed.
- **`probe/sparsity.loft`'s exact figures** are about chunks that exist. They move only for a
  world that *sets* a ground, and that world is a new test.

⚠ **AND THAT IS WHY THE STEPS BELOW CAN STOP ANYWHERE.** Every one of them is a build that
reads and writes the same files as the one before it.

## What it does change, and where the risk actually is

Not presence — the 108 sites are fine. **Extent.**

⚠ **TODAY, *WHAT EXISTS* AND *WHICH CHUNKS EXIST* ARE THE SAME QUESTION, AND THIS SEPARATES
THEM.** Everything that answers *what is there* by walking `w_chunks` — the mesher, the
streamer, `world_file_size`, the save — sees **nothing** over defaulted ground and would draw
nothing where the reader is standing on grass. That is the real work of this design, and it is
one class rather than 108 scattered sites:

| walker | what it must learn |
|---|---|
| the mesher (`hex_mesh`) | mesh a defaulted chunk from the default, when asked for one |
| the streamer (`editor_server`) | its bound is already **distance from the character**, not chunk existence — so it asks for chunks that do not exist, which is exactly the new path. ⚠ **Check this rather than believe it**: a streamer that enumerates existing chunks instead would stream nothing and the world would look empty |
| save / `world_file_size` | unchanged — they should write only what differs, which is what they already do |
| `world_column` / `world_cell` / `world_surface` | synthesise the ground column when the chunk is absent. **One place each**, and they are the accessors every one of the 108 sites already goes through |

⚠ **AND A WRITE EQUAL TO THE DEFAULT MUST NOT ALLOCATE**, or authoring flat ground over a
default region reintroduces exactly the cost this removes — and the world file grows with
chunks that say nothing. Its counterpart is elision: **a layer that comes to equal the default
everywhere is dropped**, the same rule `E1` already applies to an emptied one.

## ⚠ What `G6` turned up: the plane was already there

**A world with no ground default draws 384 triangles over an absent chunk — the full tile.**
The first version of `G6`'s test asserted it drew *nothing*, and the expectation was wrong, not
the mesher: the **unbounded** pass has always meshed an absent cell as ground at height 0, which
is what `editor: world: INFINITE` on the server's banner has been saying all along. Only the
**bounded** pass — the one a part thumbnail uses, where a world is a small object whose edge
should be an edge — marks a material-0 cell `FACE_ABSENT`.

⚠ **SO THE GROUND DEFAULT DOES NOT CREATE THE PLANE THE READER STANDS ON. IT DECIDES WHAT THAT
PLANE IS** — its height and its material, where today it is silently height 0 of the surface
material. That is a smaller change to the picture than this document implied, and a bigger one to
the *store*: `G5b`'s sixteen writes of the ground leaving zero chunks is where the value is.

✅ **AND THE STREAMER'S CHECK IS A MEASUREMENT NOW — `G7` PAID IT.** `tools/scripts/plane.keys`
sets a ground and walks somewhere nothing was ever written:

```
editor: ground 60 material 2, 48 chunks to redraw
editor: rebuilt 48 chunks in 971 ms
editor: hex (139,-120) — +46 −48 chunks, 46 live
```

**46 chunks ADDED at a hex nobody authored.** A streamer that enumerated existing chunks would
have added zero and the world would have looked empty — which is exactly what the design said to
check rather than believe.

## ⚠ The failure path this design did NOT enumerate — `G5a.1`, found by probe

**The step said *synthesise the ground where the CHUNK is absent*. The invariant says
*infinite plane*. They disagree, and following the step literally leaves a seam:**

```
default 200/4, one cell written at (0,0)
  written cell             h 300 mat 7
  untouched, chunk EXISTS  h 0   mat 0     <- a hole in the grass
  untouched, chunk ABSENT  h 200 mat 4
```

Two untouched cells cannot differ by whether a **neighbour** was written — that is the
invariant's own last clause. At `G6` this would have arrived as *the terrain has holes
around every building*, with its cause four steps away and a picture to diagnose it from.

⚠ **AND THE EQUIVALENCE TEST COULD NOT SEE IT**, which is the sharper lesson: the oracle
wrote **every** cell, so no untouched cell of an existing chunk was ever compared. A second
fixture pair — one cell written into an otherwise untouched world, against the same dent over
fully-authored ground — is what catches it.

⚠ **AND IT IS THE GROUND LAYER ONLY.** Answering the default for any absent cell fills every
cellar and storey with earth; the control for that over-reach is its own test.

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

## The probe that could falsify the whole thing — ✅ built, and it fired

**Before any of it: does one bulk write actually recover the 109 ms?** The claim is that the
cost is per-call overhead paid 256 times. If a single call that lays the same 256 cells still
costs ~100 ms, then the cost is per-*cell* and this design is aimed at the wrong thing —
every step below would deliver a fraction of what it promises.

**Answered: it is per-call, and the design stands.** The numbers are at the top of this
document. What it moved is *which step* recovers the cost — `world_set_cell` already does,
so `G3` went first and `G2` is now worth ~2× rather than 14×.

⚠ **AND THE READ HALF OF THIS SECTION ASKED THE WRONG QUESTION.** It said: *"(b) is the floor
the whole design is reaching for: if synthesising a column is not far cheaper than reading a
stored one, there is nothing here."* Measured over 102,400 reads each way — `world_column`
2167 ns stored against 1035 ns absent, `world_surface` 1103 against 947, `world_cell` 1376
against 1250 — **synthesising is not far cheaper, and for the two accessors that get hammered
it is within 20 %.** By the sentence's own test there is nothing here.

**The sentence is wrong, not the design.** GROUND_DEFAULT does not remove the read; it removes
the **write**. A fixture or a scenario that declares its ground pays for no columns at all,
which is the 105 ms, and the reads afterwards cost what they cost today. What the read has to
be is **not dearer** — and a stored read is the ceiling for that, because a miss does strictly
less work than a hit, and a synthesised read is a miss plus one `Hex` where a stored read is a
hit plus one `Hex` per layer.

⚠ **WHICH MOVES THE REAL COST OF THIS DESIGN TO `G6`, WHERE IT WAS NOT PRICED.** An infinite
plane of ground means the mesher builds chunks it skips today — that is *new* work, not saved
work, bounded by view distance rather than by what was authored. It is also the product
behaviour being asked for (you want to see the ground you are standing on), so it is a cost to
measure at `G6`, not an objection. `G6` is already last for a different reason.

⚠ **The first version of the read measurement printed `0 us` for every absent path**, because
`now()` is milliseconds and 25,600 reads is under one. `0` is what a floor and a free
operation look like alike — the same unit trap that made the first `place_phases` run report
`0 ms` for everything.

## The steps — each one green, each one revertible

Ordered so that **the thing that could refute the design runs first** and **the thing that
changes what the editor draws runs last**. Every step ships a tree whose files the previous
step can still read.

| | | why it is safe alone |
|---|---|---|
| ✅ **`G1`** | **The probe, and it could kill the design.** Two columns added to `place_phases`: *(a)* lay the same 256 cells without the per-call overhead, *(b)* read 256 columns from a world where the chunk does **not exist**. **No library change.** | (a) says whether the 109 ms is per-call overhead — if one call still costs ~100 ms the cost is per-*cell* and `G2` is pointless. (b) is the floor the design was thought to be reaching for. **Built. (a) confirmed the design and reordered the plan; (b) refuted its own question.** ⚠ There is no `world_fill` at this step, so (a) bounds a bulk write from ABOVE with `world_set_cell` — an upper bound is enough to answer a *"is it at least"* question |
| ⏭ **`G2`** | `world_fill(w, q0, r0, q1, r1, cell)` — a rectangle in one call: one `check_column`, one `find_chunk`, one window pass, one elision pass. | a **pure addition**. No existing caller changes and no existing behaviour moves. It is the mechanism `G5` needs, which is the only reason it survives `G1` — ⚠ **its speed argument is spent.** `G3` took the 14× without it, and what is left for `world_fill` to win is the ~2× between 25 us a cell and whatever a hoisted inner loop costs. Build it for `G5`, and measure it before claiming a number |
| ✅ **`G3`** | The fixtures use it — `target()` stops paying the column write. | tests only. The suite time moves and nothing shipped changed. **Built with `world_set_cell`, not with `G2`'s `world_fill`** — `hex_part` 77 s → 35 s, 254 tests green, with cells, layer CRCs and `w_tau` all equal either way |
| ✅ **`G4`** | `World` gains a ground default, **absent by default**, in a section so it round-trips. `world_new` checks it against `ρ` (`R1`) at the one place it can be stated. Nothing reads it yet. | **DONE 2026-08-12.** absent = today, byte for byte — `make parts` byte-identical, `make lib-test` 3300 → 3316 (the 8 new tests × two backends), `make fast` 145 files, `make gate` 53/53. ⚠ **The value is a FIELD and the section is only the FORMAT** — `w_sections` says of itself that the library never reads it, so a `GRND` there would be both a second home and a tag a consumer never wrote; the codec steers it to `w_ground` on the way in. ⚠ **And `R1` is checked in `world_set_ground`**, which is failure path 5: unrefused there, a ground under the reserve surfaces in an unrelated chunk much later |
| ✅ **`G5a`** | **The READERS consult it**: `world_column`, `world_cell`, `world_surface`, `world_ground_cell` and `world_ground_layer` answer the ground for an untouched cell — ⚠ **whether or not its chunk exists**, which is `G5a.1` and a correction to the row this table used to carry. | **DONE 2026-08-12.** ⚠ **`G5` SPLIT, AND THE ORDER IS FORCED**: a write that skips allocation before the readers answer for an absent chunk is data loss, so readers first. `G5a` alone is *correct but not yet economical* — a world authored flat still costs what it costs today, and every read agrees with it. Tested as an **EQUIVALENCE** against a world whose ground was written cell by cell, which is the invariant's own last clause; four sabotages red |
| ✅ **`G5b`** | **The WRITERS**: a write equal to the default does not allocate; a layer equal to it everywhere is dropped. | **DONE 2026-08-12.** One rule: **a cell is elidable iff it reads the same as an UNWRITTEN one** — `E1` generalised, not replaced. With no default an unwritten cell reads `Hex {}`, no present cell can read as that, and the rule collapses to today's *no present cells*. ⚠ **AND `b1` FELL OUT OF `b2` RATHER THAN NEEDING A GUARD**: writing the ground onto ground materialises a layer, finds every cell elidable and drops the layer *and the chunk* — 16 writes of the default leave **zero chunks**. ⚠ **AND IT RE-OPENED `G5a.1`'s SEAM IN A THIRD PLACE**: a ground layer equal to the default is dropped, so a chunk kept alive by a storey has no `LABEL_GROUND` layer to find — `world_ground_cell` answers the default there too. Two sabotages red |
| ✅ **`G6`** | **The walkers**: the mesher meshes a defaulted chunk, and the streamer is *checked* to bound by distance rather than by which chunks exist. | **DONE 2026-08-12, and it needed NO CODE.** `face_grid_for` asks `world_ground_cell` per cell and never walks `w_chunks`, so it inherited `G5a`'s synthesis — which is a claim that had to be **measured**, and `lib/hex_mesh/tests/ground_mesh.loft` is that: a defaulted chunk meshes to the **same `mesh_crc`** as an authored one, near and far, dented and clean. The streamer's loop sweeps a box around the CHARACTER and filters by hex distance, never asking whether a chunk exists — read, not believed. ⚠ **AND IT FOUND THAT THE EDITOR ALREADY DREW AN INFINITE FLOOR** — see below |
| ✅ **`G7`** | The scenario sets it — `world_new` takes it, and the editor exposes it. | **DONE 2026-08-12.** `world_new(…, ground: Hex = Hex {})`, defaulted so every call site keeps its meaning; ⚠ **`R1` is checked THROUGH `world_set_ground`, not copied** — one home, and a refusal comes back as `WC_RESERVE`, a world that cannot be made rather than one made wrong. On the wire: **`50:<height>,<material>`**, `50:` to clear, and `ground 60 2` in a script. ⚠ **It marks EVERY loaded chunk dirty**, because the plane it changes is what every chunk holding nothing was drawing — there is no smaller honest answer |

⚠ **`G1` IS NOT A FORMALITY.** Three hypotheses about this write path were each refuted by their
own probe today, and the floor measurement says only ~78 % of a `world_set_column` call is body
at all. **Expect `G1` to move at least one number in this document.**

⚠ **`G5` BEFORE `G6`, AND NOT TOGETHER.** `G5` makes the *store* answer for absent chunks; `G6`
makes the *picture* show it. Landing them in one step means a wrong picture has two candidate
causes and the gates cannot tell them apart — which is this tree's most expensive failure shape
and the reason `L3` was withdrawn.

⚠ **AND THE ORDER OF `G4`/`G5` IS THE WHOLE SAFETY PROPERTY.** Until a scenario sets a ground,
the default is absent and every path behaves exactly as it does today. That is what makes six of
these seven steps revertible by a one-line change and what lets the work stop after any of them.

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
