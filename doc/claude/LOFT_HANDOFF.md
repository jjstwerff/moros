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

## H5 — a nested `for _ in …` loop runs its OUTER body once

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

## H6 — chaining a struct-returning call loses its contents (NOT REDUCED)

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

## Cross-reference

| Topic | Where |
|---|---|
| The packages these were found in | `lib/moros_*`, recovered by [moros#2](https://github.com/jjstwerff/moros/issues/2) |
| Our gate (unaffected by all of the above) | `make lib-test` |
| The library contract these packages consume | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| loft's own filing conventions | `../loft/doc/claude/` · crawler's `LOFT-HANDOFF.md` is the pattern this file follows |
