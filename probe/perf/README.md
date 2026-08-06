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
