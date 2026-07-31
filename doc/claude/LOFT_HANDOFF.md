> ## ✅ H7, H8, H9 and H10 are FIXED upstream (verified 2026-07-27)
>
> loft `a1a07dcf` ("Fix three defects moros reported: H7, H9 and H10's diagnostic") and
> `b4f0cfa7` ("loops: give each `for _` its own counter") — on branch
> `tuxedo-h7-localization`, so check they have reached the branch you build from.
>
> All four verified against the installed binary with a four-line probe: nested `for _`
> counts 6, `acc = f(acc, x)` in a loop keeps 5, an implicit tail `mk().inn` returns its
> value, and `s[2..5]` slices. Entries below are kept as the record of what was found and
> how; the ⚠ notes say what each cost us.
>
> **Two workarounds in this tree are now unnecessary** and are noted where they live rather
> than ripped out: `hex_world`'s explicit `return` in `sp_world` (H9) and `editor_server`'s
> struct-wrapped `DirtySet` (H7). The latter STAYS regardless — it mutates in place, which
> is O(1) per append, where the temp-routing workaround loft's own commit calls out is
> O(len) and quadratic.

> **Scope: loft the LANGUAGE and its TOOLING — never a library gap.** A compiler bug, a
> debugger that cannot reach a server, a missing `seek`: those belong here. A library that
> lacks a capability we need does **not**. We create and update libraries ourselves,
> because upstream cannot verify one against our use — verification is only possible where
> the consumer lives. Build it under `lib/<name>/`, gate it, and promote it once it is
> battle-tested.

> ## Status at 2026-07-29
>
> | | |
> |---|---|
> | ✅ fixed and verified | `H5`(=`H8`), `H6`, `H7`, `H8`, `H9`, `H10`, `H11`, `H12`, `H13`, `H14`, `H15` |
> | **open** | `H16` [#667](https://github.com/loft-lang/loft/issues/667) · `H17` [#668](https://github.com/loft-lang/loft/issues/668) · `H18` [#669](https://github.com/loft-lang/loft/issues/669) · `H19` [#670](https://github.com/loft-lang/loft/issues/670) — all filed 2026-07-29 |
> | unverified | `H4` — the silent-null class; was plausibly `H12`'s family, so likely closed with it |
>
> Everything filed before 2026-07-29 is fixed, every row re-run against the installed
> binary rather than taken from a commit message. `H11` and `H12` closed by loft
> `58b66993`; the workarounds they forced in `hex_world` are removed and the suite is green
> without them.
>
> **`H16`–`H19` are the wasm client's four**, and three of them are one shape: **a sentinel
> or a contract that differs between native and browser, with nothing at the boundary to say
> so.** `--html` is not a build flag, it is a second implementation. Every one of the four
> presented as the same symptom — a canvas holding one flat colour — which is why the
> session needed a second instrument (`tools/page_console.mjs`) before it could tell them
> apart at all.

# LOFT_HANDOFF.md — findings for the loft side, ready to file

> Moros is a **consumer** of loft. This document holds defects Moros surfaced that belong
> upstream, written so they can be filed cold — by a human or an agent — without re-deriving
> anything. **Nothing here is a Moros bug**; each entry says what was ruled out.
>
> Move an entry to "Filed" (with its issue number) once it is opened; delete it once the fix
> ships *and* is re-verified here.

## Context

**Re-tested 2026-07-22 on a newer `loft 2026.7.2` build (binary dated 15:05): H1, H2 and H3
are all FIXED.** They are kept below, struck through, until the fix is released and the
entries can be deleted — the reproducers are the re-verification.

**H4 is open and re-confirmed on the 16:34 build** — the one carrying `@PLN116`'s `x?`
postfix default-fallback operator and `@PLN105`'s scratch-freeing series. Neither touches it:
still **3 of 32** accessors, with `native-auto/`, `.loft/` and `~/.loft/build-cache` cleared.
Our suite is green on that build (435 tests, five packages) and Moros HEAD exports 0/32
nulls, so the `5e677b7` reproducer remains the only way to see it.

Originally found **2026-07-22** on the earlier 2026.7.2 build, while recovering the
`moros_*` packages ([moros#2](https://github.com/jjstwerff/moros/issues/2)). The package test
suites are unaffected — **435 tests green across five packages, zero warnings**. Everything
below fails only when a program actually *runs*: the same code compiles clean and its unit
tests pass.

That split was the useful signal for H1–H3: `loft test` exercised these libraries thoroughly
and stayed green, while the moment a `fn main()` built a scene and wrote a file, the store
layer fell over. **H4 is the same split without the crash** — green suite, clean analysis,
and a null in the output file — which is why it outlived the fixes.

---

## ~~H1~~ — `graphics::sphere()` panics at runtime — **FIXED**

**Status:** FIXED on the 15:05 build — the reproducer below now prints `ok verts=16`,
deterministically, three runs in a row. Nothing to file.
**Was:** not filed · **Repo:** `loft-lang/loft` (or `loft-libs-graphics`)
**Severity:** high — the published `graphics` 0.5.0 package, one call, no consumer code
**Suggested title:** `runtime: graphics::sphere() panics in database/allocation.rs with a non-deterministic out-of-bounds index`

### Minimal reproducer

Four lines, no Moros sources, no `--lib` flags. Only the registry package:

```loft
#cwd
use graphics;

fn main() { m = sphere("s", 1.0, 3, 3); println("ok verts={len(m.vertices)}"); }
```

```sh
loft --interpret --path <loft-checkout>/ c.loft
```

### What happens

```
  at …/c.loft:3:27

thread 'main' panicked at src/database/allocation.rs:919:29:
index out of bounds: the len is 4 but the index is 53216
```

### The two facts worth acting on

1. **The index is different every run** — 42784, 32176, 20768, 47360, 53216 across five
   invocations of the *same* binary on the *same* file. A deterministic off-by-one would not
   move. This reads as a garbage/uninitialised value being used as an index, not an
   arithmetic mistake.
2. **`--check` passes cleanly** (`loft --interpret --check … c.loft` → `ok`), so this is a
   runtime store fault, not codegen or lifetime analysis.

### Controls already run

- `mesh("x")` alone — **no panic**. Only the `sphere` builder trips it.
- `canvas(4, 4)` alone — **no panic**.
- Smaller sphere (`3, 3` segments instead of `8, 8`) — **still panics**, so it is not a size
  or capacity threshold.

---

## ~~H2~~ — three consumer-level crashes — **ALL FIXED**

**Status:** FIXED on the 15:05 build:
- `demo_village` — runs clean, writes a 333468-byte GLB;
- `moros_glb` — now reports `error: input file not found: /definitely/missing.json`, which is
  exactly the wanted behaviour;
- `isolated_stair` — runs to completion (exit 0). **Correction:** the "core dump" and the
  later "NO FILE" were partly our harness — this example takes no output argument and writes
  `isolated_stair.glb` cwd-relative. The core dump on the old build was real; the missing
  file was us looking in the wrong place.

**Was:** not filed · **Repo:** `loft-lang/loft`
**Severity:** high — blocks the GLB export path entirely
**Suggested title:** `runtime: store-lifetime faults on program exit / const init (3 reproducers, one consumer)`

All three are `moros_render` examples. All three fail **identically at every commit in the
recovery series, including `c173629`, the verbatim restore of code written a year earlier** —
so no edit of ours introduced them. Caches cleared (`native-auto/`, `.loft/`) and the native
artifact regenerated between runs; no change.

Run from a Moros checkout:

```sh
loft --interpret --path <loft-checkout>/ --lib lib/ \
     lib/moros_render/examples/<example>.loft <out.glb>
```

| example | symptom |
|---|---|
| `demo_village` | `loft: BUG (#306): refused to free the stack store (#0) (rec=0, pos=0, var='') — a stack-record ref was treated as an owned heap store`, then `2 stores not freed at program exit`. **No output file written.** The scene builds — it prints `total vertices: 7796 / total triangles: 6448` — and dies on the way out |
| `isolated_stair` | **core dump**, reported at `moros_render.loft:1365:39`, which is a `mesh_aabb(…)` call |
| `moros_glb` | `thread 'main' panicked at src/store.rs:1774:9: Write to read-only store at rec=1 fld=0 (locked by: compile.rs::compile (CONST_STORE init))` — and this one fires **before the input file is read**: it panics identically with `/definitely/missing.json` as the input, where the expected behaviour is a "no such file" error |

### Why one root cause is suspected

Every symptom lands in the store layer — a stack record treated as a heap store, an
out-of-bounds store index, a write to a const-initialised store. H1 is the same
neighbourhood (`database/allocation.rs`) reached from a four-line program, so it is plausibly
the smallest expression of whatever these three hit. **That is a hypothesis, not a claim** —
we have not read the runtime.

### What this costs the consumer

The GLB exporter is the only route Moros has to *look* at generated geometry, so a change to
the renderer currently cannot be verified visually — only through unit tests. This is why the
corner-order reconciliation ([moros#3](https://github.com/jjstwerff/moros/issues/3)) was
pinned with a numeric test rather than a rendered comparison.

---

## ~~H3~~ — misattributed crash location — **MOOT**

**Status:** moot with H1 fixed; recorded because the failure mode is worth knowing.
**Was:** not filed · **Severity:** low — a diagnostics-quality issue, but it cost time
**Suggested title:** `diagnostics: runtime fault location points at an unrelated function`

An earlier form of the H1 reproducer (sphere + scene + `save_scene_glb`) reported:

```
loft: BUG (#306): … at /home/…/registry/graphics-0.5.0/src/graphics.loft:1398:26
```

Line 1398 of `graphics.loft` is inside an **`sfx_*` audio helper** — a noise-buffer
comprehension that the program never calls. The reduced reproducer points at the real call
site, so the location is wrong specifically in the failing case. A misattributed location
sends a reader to the wrong subsystem, which is the expensive kind of wrong.

---

## H4 — a null reaches exported glTF while the analysis reports clean

**Status:** not filed · **Repo:** `loft-lang/loft`
**Severity:** high — the silent class: no error, no warning, no failing test, corrupt output
**Suggested title:** `runtime: a value arrives null at a non-null store in one consumer only, with no diagnostic`

### Summary

A loft program writes `"min": [null, null, null]` into 3 of 32 glTF accessors. `min`/`max`
must be numbers, so the file is malformed — and nothing anywhere reports a problem: the
producing package passes its suite (161 tests) with **zero** warnings, and `loft --check`
over the *consuming* library is clean too. The same fold computing `max` over the same
vertices in the same run is always correct.

### Reproducer

```sh
git clone https://github.com/jjstwerff/moros && cd moros && git checkout 5e677b7
loft --interpret --path <loft-checkout>/ --lib lib/ \
     lib/moros_render/examples/demo_village.loft out.glb
# then read the GLB's JSON chunk: accessors[0].min == [null, null, null]
```

Confirmed on the 15:05, 15:13 and **16:34** builds of `loft 2026.7.2`, with `native-auto/`,
`.loft/` and `~/.loft/build-cache` deleted. Neither `@PLN105` (scratch freeing) nor
`@PLN116` (`x?` postfix default) changes it. Moros `bdbce1b` exports 0/32, so the two commits
bracket it.

### Verdict — this is loft's, not `glb`'s

`glb` carries a latent defect: `glb_pos_min` (`glb-0.1.2`, `src/glb.loft:51`) seeds
`mx = verts[0].pos.x` — a fallible index, hence `float?` — and returns `vec3(mx, my, mz)`
through non-null parameters. The emptiness guard one line above shows the risk was expressed
structurally rather than in the type. Worth discharging, but **that would mask this, not
answer it**, for three reasons:

1. **`glb` is identical in the failing and passing runs** — same registry package, same
   binary. The only difference is which corner table the consumer calls. A component that
   does not change cannot cause a difference; it can only be where the damage shows.
2. **The same source shape behaves both ways.** `glb_pos_max` is `glb_pos_min` with `>` for
   `<`, over the same vertices in the same run, and never fails. Six independent
   reproductions of that shape (below) are clean. Deterministic semantics cannot yield
   "identical code, one nulls and one does not".
3. **The analysis is silent.** `loft --interpret --check` over `glb-0.1.2/src/glb.loft`
   emits **zero** null-related diagnostics — nothing on the seed, nothing on the `vec3`
   store. The consumer received **67** warnings of exactly that class for exactly that kind
   of code. A textbook nullable-into-non-null in a registry package drawing nothing is a
   finding on its own.

If the runtime is exonerated, the fallback is that null-flow analysis missed `glb_pos_min` —
still loft's — and `glb` should discharge the seed as defence in depth.

### The null is created by the fold, not carried by the data

- **No vertex is null.** A scan of all 7796 vertices across the 8 meshes reports zero null
  components. The compiler agrees: `v.pos.x` is typed *not null*, and coalescing it warns
  "Redundant null coalescing — 'x' is 'not null'".
- **The same fold, written in the consumer, is correct** on the same meshes — in both the
  chained (`verts[0].pos.x`) and bound (`e = verts[0]; e.pos.x`) forms.

So the value is real everywhere it can be observed, and becomes null inside `glb_pos_min`.

### Which meshes, and the correlation — with its limit

| mesh | verts | component-wise min | nulled |
|---|---|---|---|
| `'1'` | 84 | `(-0.8660254, 0, -1)` | **yes** |
| `'0'` | 6993 | `(-0.8660254, 0, -1)` | **yes** |
| `'2'` | 63 | `(0.8660254, 1, 0.5)` | **yes** |
| `'3'` | 128 | `(0, 0, -0.2598…)` | no |
| `walls` | 240 | `(1.5820508…, 1, 1.87…)` | no |
| `items`, both marker meshes | 24–216 | literals | no |

Not by size — `'2'` nulls at 63 while `'3'` is clean at 128. Every nulled mesh's minimum x is
±0.8660254, a value the consumer computed as `HEX_WIDTH / 2.0`; every clean one's minimum is
a literal or a sum. **That correlation is real here but is not sufficient** — reduction rows
3 and 5 below reproduce the value, the provenance and the counts, and stay clean.

### Ruled out — every one verified to have actually applied

Changes to the consumer that do **not** clear it (only the last row does):

| change | result |
|---|---|
| division `HEX_WIDTH / 2.0` replaced by a literal of the same value | still nulls |
| `HEX_WIDTH` switched from a local literal to `hex_grid::HEX_LEN` | still nulls |
| the corner function's early-`return` chain rewritten as one tail expression | still nulls |
| **delegating the corner table to `hex_grid::hex_corner_offset`**, constant left as the local literal so no number changes | **0/32 — clears it** |

Standalone reductions, all against registry `graphics` 0.5.0 / `glb` 0.1.2, all with minimum
x = `-1.7320508 / 2.0`, **all clean**:

| # | shape | result |
|---|---|---|
| 1 | 3-vertex mesh, minimum from a local division, single program | clean |
| 2 | same, split across two packages (library builds, program exports) | clean |
| 3 | vertex counts 3, 63, 84, 300, 1000, **6993** (the real nulled mesh's count) | clean at every size |
| 4 | minimum routed through a struct field (`Vec2` read as `.x`), all six sizes | clean at every size |
| 5 | eight meshes in one scene, real names, counts and mix of division/literal minima | 0/32 |
| 6 | meshes built by mutating a **by-value** `Mesh` parameter in an `emit_*` helper, accumulated into `vector<Mesh>` | 0/12 |

So the trigger is **not** vertex count, the value, how it was computed, a package boundary,
scene size, or by-value mesh mutation.

### Untested differences, for whoever picks this up

What the real path has that none of the six reductions do:

- coordinates derived from the consumer's `Map` / `Hex` structures rather than a loop counter;
- a **path dependency** (`{ path = "../moros_map" }`) in the graph beside registry packages,
  resolved via `--lib`;
- meshes looked up **by name** while being built (`emit_to_material` scans the accumulating
  `vector<Mesh>` for a matching `name` before appending a new one).

### Companion signal

Every reproduction ends with

```
Warning: 2 stores not freed at program exit: kt=66 Hex×10, kt=97 Vec3×2
```

`Vec3` is `glb_pos_min`'s return type. Whether the unfreed store and the nulled minimum are
one fact is not visible from outside, but they have never appeared apart, and the leak
survives the 16:34 build.

---

## H5 ✅ FIXED — a nested `for _ in …` loop runs its OUTER body once

> Fixed by loft `b4f0cfa7`. ⚠ **This and `H8` are the same defect** — H8 was filed later
> without noticing H5 already described it. Verified 2026-07-27: nested `for _` counts 6.

**Status:** not filed · **Repo:** `loft-lang/loft`
**Severity:** high — silent wrong answer, no error, no warning
**Suggested title:** `loops: two \`for _ in …\` loops in one function make the outer run a single iteration`

### Minimal reproducer

```loft
fn main() {
  a = 0;
  for _ in 0..3 { b = 0; for _ in 0..4 { b = b + 1; } a = a + b; }
  println("{a}");     // prints 4 — should be 12
}
```

The outer loop executes **once**. No diagnostic of any kind.

### It is specifically two `_` in the SAME function

Measured, all other combinations correct (each expecting 12):

| shape | result |
|---|---|
| `_` outer, `_` inner, same function | **4** |
| named outer, `_` inner | 12 |
| `_` outer, named inner | 12 |
| named outer, named inner | 12 |
| `_` outer, `_` inner **in a called function** | 12 |

So it is the two anonymous binders colliding within one body — the inner appears
to clobber the outer's counter. Moving either loop into a function, or naming
either variable, hides it.

### Why it matters more than it looks

`for _ in` is the idiomatic way to repeat something a fixed number of times, and
loft's own libraries use it (`hex_field` had three). A loop that silently runs once
produces a plausible-looking wrong answer rather than a crash.

---

## H6 ✅ appears FIXED — chaining a struct-returning call loses its contents

> Verified 2026-07-27 on the reported shape: `s = rot(s, 1)` four times over a struct
> holding a vector gives `len=3 n=4 first=5`, all correct. Most likely carried by `H7`'s
> fix (the return-buffer alias), whose commit says a struct target was already safe once
> the vector case was handled. ⚠ It was **never minimised**, so this verifies the shape
> described, not necessarily the original `hex_field` case — reopen if it recurs there.

**Status:** not filed, **not minimised** · **Severity:** unknown
**Suggested title:** `stores: repeatedly reassigning a struct from its own transform empties it, shape-dependently`

`hex_field`'s `stencil_rotate(st, n) -> Stencil` returns a new stencil holding
freshly allocated `HexSet` / `Heights` / `Labels`. Composing it —

```loft
rot = st;
for i in 0..6 { rot = stencil_rotate(rot, 1); }
```

— gives a correct result on the **first** call and an **empty** one on the second
and every call after, with the extent frozen at the first rotation's value.
Instrumented inside the failing test:

```
ri=0 count=5 q0=-2      <- correct
ri=1 count=0 q0=-2      <- empty from here on
ri=2 count=0 q0=-2
```

**It resisted five reduction attempts.** The same chain is *correct* when written
standalone: built inline in `main`, built via a helper, with and without an alias
binding, with and without height/label payloads, and with the loop inside a called
function — each run repeatedly for determinism. Only inside the package's test file
does it fail, consistently.

`cell_rot` itself is provably exact (169 cells checked against a Python model:
zero non-integer halvings, six steps the identity), so the arithmetic is not the
fault.

**Worked around, not fixed:** rotate from the source by `n` steps in one call.
Composition buys nothing, since `cell_rot` accepts any `n`. Recorded here rather
than left as folklore, because the workaround hides a real fault and the next
person to compose a struct transform in a loop will meet it again.

---


## H7 — a vector accumulated through a helper INSIDE A LOOP keeps one element

**Status:** not filed · **Repo:** `loft-lang/loft`
**Severity:** high — silent wrong answer, no error, no warning
**Suggested title:** `vectors: \`acc = grow(acc, x)\` inside a \`for\` loop discards all but one append`

### Minimal reproducer

```loft
fn add_i(v: vector<integer>, x: integer) -> vector<integer> {
  out = v;
  out += [x];
  out
}

fn main() {
  a: vector<integer> = [];
  for k in [10, 20, 30] { a = add_i(a, k); }
  println("{len(a)}");        // prints 1 — should be 3
}
```

No diagnostic of any kind.

### It is specifically the LOOP

Measured, all other shapes correct (each expecting 3):

| shape | result |
|---|---|
| `for k in […] { a = add_i(a, k); }` | **1** |
| three explicit `b = add_i(b, …)` statements | 3 |
| inline `c += [k]` inside the loop, no helper | 3 |
| a fresh variable per step (`d2 = add_i(d, 1); d3 = add_i(d2, 2); …`) | 3 |

So it is **reassigning the same variable from a returning helper, inside a loop
body**. Outside a loop the identical calls accumulate correctly.

Element type does not matter — reproduced with `vector<integer>` and with a
`vector<Struct>`. And appending to the **parameter** instead of a bound copy
(`fn add(v: …) { v += […]; v }`) is worse: that shape returns **0**.

### Why it matters

`acc = step(acc, x)` in a loop is the ordinary way to fold a collection when the
step needs a name, and the failure is a plausible-looking short answer rather
than a crash. It cost a real defect here: a dirty-chunk set built this way marked
**1 of 48** chunks, so a world reload rebuilt one chunk and left the rest stale —
correct-looking terrain that was simply out of date.

### Workaround in use

Put the accumulator in a struct and mutate the field, which writes through
(`OWNERSHIP_MODEL` — heap in-place mutate); or inline the append at the call site.


## Cross-reference

| Topic | Where |
|---|---|
| The packages these were found in | `lib/moros_*`, recovered by [moros#2](https://github.com/jjstwerff/moros/issues/2) |
| Our gate (unaffected by all of the above) | `make lib-test` |
| The library contract these packages consume | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| loft's own filing conventions | `../loft/doc/claude/` · crawler's `LOFT-HANDOFF.md` is the pattern this file follows |

---

## H8 ✅ FIXED — nested `for _ in …` loops silently share one counter

**Surfaced by:** `hex_world`'s file reader, 2026-07-26. A world with two layers saved
correctly (byte-for-byte the right size) and loaded back with **one**, reporting success.

**Shape.** Three nested loops, each written with `_` as the loop variable:

```loft
for _ in 0..nc {          // chunks
  …
  for _ in 0..nl {        // layers
    …
    for _ in 0..1024 { … } // cells
  }
}
```

The inner loops clobber the outer counter, so an outer loop with `nc = 2` runs its body
once. Renaming each level (`_ci`, `_li`, `_xi`) fixes it completely.

**Why it is worth reporting rather than just avoiding.** `_` reads as *"a counter I am
deliberately not using"* — it is the idiomatic way to say "repeat n times", and nesting two
such loops is entirely natural. The failure is **silent and data-dependent**: the code runs,
returns success, and produces a plausible short answer. Nothing distinguishes it from a file
that genuinely held one layer.

**Suggested fixes**, either would do:
- treat `_` as a fresh binding per loop (each `_` its own slot), which is what a reader
  expects; or
- reject a nested `for` that reuses an enclosing loop's variable name, as a compile error —
  the same class as a shadowing warning, and cheap.

**Minimal reproducer:**

```loft
fn main() {
  hits = 0;
  for _ in 0..2 { for _ in 0..3 { hits = hits + 1; } }
  println("{hits}");     // expected 6
}
```

---

## H9 ✅ FIXED — `loft test` SIGSEGVs on a test file that saves and measures files repeatedly

**Surfaced by:** `hex_world`'s sparsity gates, 2026-07-26. Reproducer preserved at
`lib/hex_world/tests_wip/segv-repro.loft.wip` — move it to `tests/` to reproduce.

```
=== loft crash (loft) SIGSEGV caught ===
  last op:  (opcode dispatch) (op=197)
  pc:       1091
  fn:       (?) (d_nr=311)
  at:       /usr/local/share/loft/default/01_code.loft:979:22
```

⚠ **ROOT CAUSE, from loft's fix:** `fn f() -> T { mk().inn }` — an *implicit tail*
returning a projected field of an inline call — returned a reference into a store the call
had already freed. The interpreter read the stale bytes, so a `World` returned that way
reached the vector code with a garbage handle. **Our `sp_world()` was exactly that shape**,
which is why every version of the file containing it crashed and every version without it
passed. Seven hypotheses were tested and all were wrong because none of them was about the
helper's *return form*.

**Shape.** Eight test functions in one file, each building a small world, calling a library
function that writes a binary file (~8 KB via a loop of `f += (x as u16 / u8)`), reading it
back with `read_bytes`, and `delete`ing it. The crash is immediate — about 1.7 s — not a
hang, and produces **no test result line at all**, which is what made it read as a hang for
several rounds.

**What was ruled out**, each tested directly:

- not the number of test *files* — reproduces within a single file;
- not two file-writing tests — a minimal two-test file passes;
- not the append volume — 7168 appends in one test runs in 0.07 s;
- not a shared temp path — each test given a distinct filename still crashes;
- not a parameterised helper doing file I/O — that alone passes;
- not a nested call returning a struct — splitting it changes nothing;
- not the undischarged `read_bytes(…)` nullable — the warnings it emits are real and worth
  fixing separately, but discharging them leaves the crash.

**Two tests of the same shape pass; eight crash.** The bisection was not carried further.

**Why it matters beyond this project.** The failure mode is the worst available: a crash with
no result line reads as a hang, and a developer's first response is to add a timeout and
assume their own code loops. It cost several rounds here before the raw output was read
instead of grepped.

**Also worth a look while in there:** `read_bytes` returns a nullable vector, so
`len(read_bytes(p))` warns. That is correct behaviour, but it is the overwhelmingly common
use, and `read_bytes(p) ?? []` at every call site is noise — a non-null `read_bytes_or_empty`,
or making the empty vector the failure value, would remove a warning nobody wants.

---

## H10 ✅ FIXED (diagnostic) — text range slicing works; the message did not say so

⚠ **The feature was never missing.** `s[i..]` and `s[i..j]` work in every shape probed; the
message *"Invalid index on string"* named neither the offending type nor the supported
forms, so it read as "text cannot be sliced". loft now names the type and shows the forms.
The original report follows.

`man[di..]` on a `text` gave *"Invalid index on string"*. Slicing a `text` by a range —
`s[i..]`, `s[i..j]` — appeared unsupported, so extracting a section of a file read as text
means iterating `lines()` and tracking state by hand. Vectors slice; text does not, and the
asymmetry is surprising rather than principled.

---

## H11 ✅ FIXED (2026-07-27) — `seek` is documented but not present

**Surfaced by:** `hex_world`'s version scan, 2026-07-27.

**Fixed** (loft `58b66993`) — verified: `seek(g, 4)` then a read returns the second i32.
The original report follows; the file layout it forced (directory before payload) is kept,
because a version scan that stops after the index is better than one that seeks past cells.

`STDLIB.md` lists `seek(self: File, pos: integer)` — *"Moves the read/write position to `pos`
bytes from the start."* It is not available in the installed build, in any calling form:

```
f#seek(n)   → Expect token ;
f.seek(n)   → Unknown field File.seek
seek(f, n)  → Unknown function seek
```

The `File` methods actually defined in `default/*.loft` are `content`, `files`, `lines`,
`ok`, `set_file_size`, `sync`, `write`. There is also **no position getter**, so an offset
cannot be tracked by asking — only by arithmetic over a fixed layout.

**Impact.** A random-access binary format cannot skip a region it does not need. The
workaround was to restructure the file so the index comes first and is contiguous, which is
a better format anyway — but it was forced rather than chosen, and a format that genuinely
needs to jump (an update-in-place, a free-list walk) has no way to.

**Either fix would do:** implement `seek` (and a position getter), or remove it from
`STDLIB.md`. The present state is the worst of the two — a documented capability that
consumers design around before discovering it is absent.

---

## H12 ✅ FIXED (2026-07-27) — returning a vector ELEMENT of a local hands back a dead value, silently

**Surfaced by:** `hex_world.world_cell`, 2026-07-27. It aborted the editor
(`SIGABRT`, op=242) on the first terrain sample; reduced, it returned nulls instead.
**Fixed the same day** (loft `58b66993`) — verified: the reproducer now yields `h=42 m=2`,
and `world_cell` returns the element directly again with the suite green.

**Sibling of H9, not covered by its fix.** H9 was `fn f() -> T { mk().inn }` — a *field*
projected off an inline call — and that is fixed and verified. This is the *vector element*
form, and an explicit `return` does **not** help; only copying into a fresh record does.

**Minimal reproducer** (library + program, crossing a package boundary):

```loft
// library
pub struct Cell { c_h: u16, c_m: u8 }
pub struct Bag  { b_cells: vector<Cell> }

fn make_bag() -> Bag {
  v: vector<Cell> = [];
  v += [Cell { c_h: 42 as u16? ?? 0, c_m: 2 }];
  Bag { b_cells: v }
}

pub fn get_elem(i: integer) -> Cell { b = make_bag(); return b.b_cells[i]; }
pub fn get_copy(i: integer) -> Cell {
  b = make_bag(); e = b.b_cells[i];
  return Cell { c_h: e.c_h, c_m: e.c_m };
}
```

```
get_elem(0) → c_h=null  c_m=null      ← every field dead
get_copy(0) → c_h=42    c_m=2         ← correct
```

**Why it is worth the entry.** The value is not merely wrong, it is *uniformly* null, so a
consumer reads it as "absent" rather than "broken" — and in a world model where absence is
a legal, meaningful answer (`E1`: an unwritten cell IS empty), a dead cell and an empty cell
are indistinguishable. It presented here as a crash only because the null reached arithmetic;
a codebase that tolerates nulls would have got a plausible, wrong, empty world instead.

**Suggested fix:** treat a returned vector element like a returned struct field — copy into
the caller's return buffer, which is what H9's fix already does for the field case.

---

## H13 ✅ FIXED (2026-07-27) — `loft debug` cannot reach a server: `--lib` ignored, native libs error unnamed

**Surfaced by:** trying to debug the editor server with a live websocket, 2026-07-27.
**Fixed the same day** (loft `216f8664`, `e8cb418e`, `55dd105c`, `887dd176` — the @PLN120
arc, whose own summary names *reach, silence, discoverability*, which is this entry's three
parts). Verified end to end: `--lib` resolves under `--rpc`, a session survives
`server::listen` and a live websocket, and a breakpoint inside the terrain brush was hit by
a browser client pressing a key, with `eval` and `setValue` working at the frame. The
working recipe is in [LOFT_DEBUGGER.md](LOFT_DEBUGGER.md).

**The residual is claimed fixed too** — loft `b6bffc27`, *"a rolled-back parse dropped every
import, so eval could not call a library fn"*. Not re-verified here: the scripted check sent
its `eval` before the breakpoint paused, so it produced no stop to evaluate at.

The original report follows.

**(a) `--lib` is ignored in every position.** All three forms fail with
`Undefined type Mat4`:

```
loft debug src/editor_server.loft:385 --lib lib/
loft --lib lib/ debug src/editor_server.loft:385
loft debug src/editor_server.loft:385
```

**Control:** `loft --interpret --lib lib/ src/editor_server.loft` compiles and runs the same
file with zero errors.

**(b) A CALL that reaches native code kills the session, with no message.** Bisected —
it is neither the package nor the import:

| | under `loft debug` |
|---|---|
| `use web;` with **no call** | ✅ runs |
| `use time;` + `from_ymd(2026, 7, 27)` (pure-loft fn in a registry package) | ✅ runs |
| `use random;` + `rand_seed(7)` | ❌ dies |
| `use web;` + `sleep_ms(5)` | ❌ dies |
| `use server;` + `listen(port)` | ❌ dies |

```loft
use web;
fn main() { sleep_ms(5); x = 1 + 1; println("web ok {x}"); }
```
→ `runtime error in the paused run — debug session abandoned (session preserved)`

Every row above runs correctly under `loft --interpret`. The boundary is **crossing into
native code**, which is worth stating precisely: a fix aimed at "registry packages" would
miss `random` and over-reach on `time`.

No message, no location, and the prompt changes from `(dbg)` to `loft>` where `:continue`
answers *"unknown command"* — which reads as a typo rather than as "the session is over".

**Minor, and cheap:** `loft debug --lib lib/ f.loft:12` reports *"missing `:<line>`"*. The
line is present; the argument order is wrong. Naming the real complaint would save the
guess.

**Why it matters.** The debugger is good — locals per frame, stepping, time-travel `:undo`,
and assignment to a local so a hypothesis can be tested without editing source. None of it
is reachable from the code that most needs it: anything with a server, a socket, or a local
library. The consumer-visible shape is "the debugger does not work on real programs", which
undersells it considerably.


---

## H14 ✅ FIXED — past ~32 KB of body, a `while true` runs its body ONCE and exits 0

> **Fixed by loft `c9f1c0b1`** — *"jumps: carry a 32-bit displacement"*. Verified 2026-07-28
> against the INSTALLED binary, both backends: a loop body of 1485 statements (the old flip
> point), 3000 and 6000 all iterate correctly.
>
> ⚠ **The fix was wider than the report.** The commit says *every loop and branch* jumped
> somewhere arbitrary past the limit; this consumer only ever observed the backward jump,
> because that is the one a server's pump depends on. A reproducer that pins a symptom does
> not measure the class — worth remembering before filing the next one.

**Status:** filed as [loft-lang/loft#654](https://github.com/loft-lang/loft/issues/654)
(`bug` `sev:high` `area:codegen` `area:runtime` `wa:partial` `hit-by:moros`)
**Severity:** high — silent wrong control flow, exit code 0, no diagnostic
**Backend:** `--interpret` only. `--native` is correct on the same source.

### Minimal reproducer

Generated, because the trigger is SIZE rather than shape:

```sh
python3 -c "
n = 1485
lines = '\n'.join(f'    f{i} = {i} + 1;' for i in range(n))
open('loop.loft','w').write('''fn main() {
  i = 0;
  while true {
    i = i + 1;
    println(\"tick {i}\");
    if i > 3 { return; }
''' + lines + '''
  }
}
''')"
loft --interpret loop.loft      # prints ONE tick, exits 0
loft --native    loop.loft      # prints four ticks — correct
```

`n = 1484` prints four ticks and is correct; `n = 1485` prints one and exits. The flip is
that sharp — one statement — which is what says "offset", not "resource".

### What it looks like from outside

The loop does not hang, crash, or warn. The body completes, the backward jump does not
happen, execution falls out of the loop and `main` returns cleanly with status 0. Every
`println` in the body runs exactly once, so a log ends mid-story with nothing wrong in it.

### The number points at the mechanism

1485 statements of that filler is roughly **32 KB of emitted body**, and 32768 is where a
signed 16-bit relative jump stops reaching. The reproducer's `if i > 3 { return; }`
FORWARD jump is fine at the same size; only the loop's backward jump misbehaves — so the
suspicion is a `i16` (or otherwise truncated) branch offset in the interpreter's encoder,
taken without a range check.

### What it cost here

`src/editor_server.loft`'s `main` sits just under the threshold, so **adding two `println`
lines anywhere in it stopped the editor's connection pump after one pass** — the server
printed its full startup banner, streamed the world, and exited 0 before any client could
connect. It reads exactly like "the server dies on startup", and the two lines that
"caused" it had nothing to do with the loop: removing two *unrelated* lines elsewhere in
the same function fixed it, which is what identified size as the trigger.

**A range check that refuses to emit is worth more than the fix**, if the fix is hard: a
compile error naming the limit is recoverable, and this is not.

### Workaround

Lift code out of the function holding the loop. Moros extracted its message handlers into
functions to get back under the limit — better code, but taken under duress rather than
chosen.


---

## H15 ✅ FIXED — a mutated `&boolean` parameter panicked codegen

> **Fixed by loft `5565278f`** — *"codegen: `&boolean` reads and writes on both backends —
> four sites, not the one filed"*. Verified 2026-07-28 against the installed binary: the
> reproducer prints `true` under `--interpret` and `--native`.
>
> ⚠ Wider than the report again — four sites where this consumer hit one.

**Status:** filed as [loft-lang/loft#655](https://github.com/loft-lang/loft/issues/655)
(`bug` `sev:medium` `area:codegen` `both-backends` `wa:clean` `hit-by:moros`)

### Minimal reproducer

```loft
fn flip(b: &boolean) { b = !b; }

fn main() {
  x = false;
  flip(x);
  println("{x}");     // printed nothing: codegen panicked
}
```

```
thread 'main' panicked at src/state/codegen.rs:3648:22:
Unknown referenced variable type: boolean
```

`&integer`, `&float` and `&text` all worked with the same shape, which is what made it
boolean-specific rather than a limit on reference parameters.

**What it cost:** a two-press authoring tool wanted `open: &boolean` beside `ax: &float`,
and the float compiled while the boolean did not. The workaround — a struct holding the
draft — is the better shape and stays.

---

## H16 — `loft install <dir>` drops a package's `wasm/`, and the copy SHADOWS a good one

**Status:** filed as [loft-lang/loft#667](https://github.com/loft-lang/loft/issues/667)
(`bug` `sev:medium` `area:packages` `area:wasm` `wa:partial` `hit-by:moros`)
**Severity:** medium — silent, and the error points at the library rather than the install
**Backend:** `--html` (any target that links a `[wasm.bridge]`)

`install_package` copies `loft.toml`, `src/*.loft`, `tests/` and `native/`. A package's
`wasm/` directory is not on that list, so a library with a `[wasm.bridge]` loses its bridge
on a local install — and `~/.loft/lib/<name>` is searched *before* the registry cache, so
the incomplete copy shadows a complete published one.

```
loft: --html: [wasm.bridge] declared `crate = "web-wasm"` but
      ~/.loft/lib/web/wasm/src/lib.rs is missing — skipping bridge link
error[E0433]: cannot find module or crate `web_wasm` in this scope
```

It is the **second instance of a class that function's own comment says it closed once**,
for `native/`: *"a LOCAL `loft install <dir>` of a native lib silently dropped its FFI …
while the registry path (from the tarball) carried it — an asymmetry this closes."*

⚠ **What it cost is the lesson, not the bug.** Two diagnoses died first, and both were
reached by *reading* rather than measuring: "the published tarball omits `wasm/`" (its
sha256 matches the registry byte for byte, and `tar tzf` lists all three files) and "0.3.3
was never published" (it was, the day before — our registry checkout was stale). Both were
claims about *what someone else had shipped*, and neither needed this box. One `mv` of the
shadowing directory settled it, and that probe was available from the first minute.

---

## H17 — a `--html` program that calls a missing `gl_*` is a LinkError at page load

**Status:** filed as [loft-lang/loft#668](https://github.com/loft-lang/loft/issues/668)
(`bug` `sev:medium` `area:wasm` `area:packages` `wa:partial` `hit-by:moros`)
**Severity:** medium — the whole page dies, and the error names an import index
**Backend:** `--html` only

`doc/loft-gl-wasm.js` provides a SUBSET of `lib/graphics`'s native surface — no
`gl_window_width`/`gl_window_height`, no `gl_mouse_wheel`, no `gl_set_uniform_vec2`/`vec4`,
no event queue, no fullscreen, no screenshot. Calling one compiles cleanly and then fails
at instantiate:

```
LinkError: WebAssembly.instantiate(): Import #7 "loft_gl" "loft_gl_window_width":
           function import requires a callable
```

A subset is reasonable; the browser genuinely cannot do all of it. The defect is that the
boundary is invisible until runtime and crossing it kills the page rather than the call —
decidable at build time, since the reached `#native` symbols and the shim's import list are
both known then.

**What it cost:** the client asked the canvas for its size to send the server an aspect
ratio — the one thing the JavaScript it replaces did with `canvas.clientWidth`.
`WEB_APPS.md` §3 calls the browser surface *"the full WebGL2 canvas surface
(`lib/graphics`)"*, which is the sentence a consumer plans against.

---

## H18 — browser GL handles start at 0, where the doc says 0 means failure

**Status:** filed as [loft-lang/loft#669](https://github.com/loft-lang/loft/issues/669)
(`bug` `sev:medium` `area:wasm` `wa:clean` `hit-by:moros`)
**Severity:** medium — two silent failures, in opposite directions
**Backend:** `--html` only; native returns real GL names and does not have the ambiguity

`gl_create_shader` and `gl_upload_vertices` are documented as returning 0 on failure. In
the browser shim they return an **index into a JS array that starts at zero** — and 0 on
failure too, so the two are indistinguishable. Both readings then bite:

- `if prog == 0 { fail }` — the documented check — rejects the first successful shader on
  every page.
- a `vao == 0` "this slot is free" marker loses the first mesh AND hands its slot to the
  next one: 296 meshes into one slot, and a canvas showing nothing.

**What it cost:** roughly half a session across both, and the two are *opposite* mistakes
made from the same sentence — which is what makes it worth fixing rather than documenting.

---

## H19 — writes through a local captured from a `vector<Struct>` FIELD are discarded

**Status:** filed as [loft-lang/loft#670](https://github.com/loft-lang/loft/issues/670)
(`bug` `sev:high` `area:store-lifetime` `both-backends` `wa:clean` `hit-by:moros`)
**Severity:** high — silent, and the losing idiom is the RECOMMENDED one
**Backend:** identical under `--interpret` and `--native`, so semantics rather than codegen

Assigning a `vector<Struct>` field to a local gives a copy. Writes through it evaporate:

| write | result |
|---|---|
| `rows = bag.rows; r = rows[i]; r.f = x` | **LOST** |
| `rows = bag.rows; rows[i] = Row { … }` | **LOST** |
| `bag.rows[i].f = x` | sticks |
| `bag.rows[i] = Row { … }` | sticks |
| `for r in bag.rows { r.f = x }` | sticks |

`bag` itself aliases fine — it is the field-to-local assignment that copies. The matrix is
`plans/16-client-split/probe/vector_field_write.loft`, and it prints a MATRIX rather than a
verdict on purpose: what is useful is where the boundary runs.

⚠ **The loft-write reference recommends the losing form**, as the warning-clean way to
index a field: *"capture into a local, then bound-guard … the local aliases the same
underlying vector, so indexed writes propagate."* For `vector<text>` that may hold; for
`vector<Struct>` it does not, and nothing in the sentence suggests a difference.

**What it cost:** the wasm client held its meshes in a `vector<Part>` on a struct and had
all three of its writes on the losing side at once — so nothing was ever placed and no slot
was ever freed, and the world drew entirely at the origin. Nothing is wrong at the point of
failure: the reads are right, `len` is right, `#index` is right, and the write statement is
ordinary. Found only by writing the matrix, not by reading the code.

## Open, filed 2026-07-31

- **[loft#709](https://github.com/loft-lang/loft/issues/709) — one source for native GL and
  wasm.** `gl_screenshot` is native-only and `--html` refuses the build, so running the same
  renderer on both targets means forking it into two entry points over a shared library —
  a split introduced purely to dodge a missing host import, which costs the very property
  two renderers exist to give (each is the other's control). Asked for parity of the
  graphics surface; noted that `path` has no obvious browser meaning and that the virtual FS
  or returning bytes would both do. `wa:partial` — the fork works, it just defeats the point.
- **[loft#708](https://github.com/loft-lang/loft/issues/708) — `File.size` reads 0 for a file
  the same program wrote**, so the documented append idiom (`f#next = f.size`) seeks to 0 and
  **silently overwrites**. Measured: a 4-byte file reporting size 0, and `write("one")`
  followed by an append leaving only `"two"`. Cost a recorder its log. ⚠ A longer-running
  program panicked instead — `index out of bounds: the len is 300 but the index is 65535`,
  a u16 sentinel reaching an offset — which did not reduce; the silent-overwrite case is the
  reliable half and is what was filed.
