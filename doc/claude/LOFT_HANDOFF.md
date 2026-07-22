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

**H4 is open and re-confirmed against the 15:13 build of `../loft` `bf53db82`** (the
`@PLN105` "free the scratch on loop exit / on a return out of an exposed loop" work) — that
series does not touch it: still **3 of 32** accessors, caches cleared. Our suite is green on
that build too (435 tests, five packages), and Moros HEAD exports 0/32 nulls, so only the
`5e677b7` reproducer shows it.

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

## H4 — a null reached an exported file with a clean analysis and a green suite

**Status:** not filed · **Repo:** `loft-lang/loft` (or `loft-libs-graphics`)
**Severity:** high — this is the silent class: no error, no warning, no failing test
**Suggested title:** `null-flow: a null reaches exported glTF output while the analysis reports clean`

### What we saw

At Moros commit `5e677b7`, the exporter writes

```json
"min": [null, null, null]
```

into **3 of 32** accessors — malformed glTF, since `min`/`max` must be numbers. At that same
commit the package reports **161 tests passing and 0 warnings**, including zero null-flow
warnings after a pass that discharged all 67 of them. `bdbce1b` exports 0/32 nulls, so the
two commits bracket it. Reproducible with `native-auto/`, `.loft/` and `~/.loft/build-cache`
all deleted, on the 15:05 build.

### The null is created by the fold, not carried by the data

Measured, not assumed:

- **No vertex is null.** A scan of every vertex in all 8 meshes reports `0 with a null
  component`. The compiler agrees: `v.pos.x` is typed *not null*, and coalescing it warns
  "Redundant null coalescing".
- **A hand-written fold on the same data is correct.** Reproducing `glb_pos_min`'s exact
  shape in Moros — seed from `verts[0]`, then `if v.pos.x < mx { mx = v.pos.x; }`, then
  `vec3(mx, …)` — yields the right answer, in **both** the chained (`verts[0].pos.x`) and
  bound (`e = verts[0]; e.pos.x`) forms.
- So the value is real everywhere Moros can observe it, and becomes null inside
  `glb::glb_pos_min` (glb-0.1.2, `src/glb.loft:51`) — whose seed
  `mx = verts[0].pos.x` is nullable-typed via the fallible index, and which returns
  `vec3(mx, my, mz)` into non-null parameters.

### Which accessors, and the pattern

| mesh | count | component-wise min | null? |
|---|---|---|---|
| `'1'` | 84 | `(-0.8660254, 0, -1)` | **yes** |
| `'0'` | 6993 | `(-0.8660254, 0, -1)` | **yes** |
| `'2'` | 63 | `(0.8660254, 1, 0.5)` | **yes** |
| `'3'` | 128 | `(0, 0, -0.2598…)` | no |
| `walls` | 240 | `(1.5820508…, 1, 1.87…)` | no |
| `items`, both marker meshes | — | literals | no |

Every nulled mesh is one whose minimum x is exactly **±0.8660254**, the value Moros's local
corner table produced as `HEX_WIDTH / 2.0`. Meshes whose minimum comes from a literal or a
sum are unaffected. **`glb_pos_max` on the same meshes is always correct** — only the
minimum nulls.

### What fixes it, and what does not — each verified applied

Only one change clears it:

- **delegating the corner table to `hex_grid::hex_corner_offset`** → **0/32 nulls**, with
  Moros's constant deliberately left as the local literal, so nothing about the *numbers*
  changed.

These do **not** clear it, each confirmed to have actually applied before running:

1. replacing the division `half_w = HEX_WIDTH / 2.0` with a literal of the same value;
2. switching `HEX_WIDTH` from the local literal to `hex_grid::HEX_LEN`;
3. rewriting the corner function's early-`return` chain as a single tail expression.

So the same numbers, computed locally, null the minimum; **sourced from another package,
they do not.** Whether the null appears depends on which module produced the value, not on
the value, its type as the compiler reports it, or the shape of the function that returned
it. That is why this goes upstream rather than being patched here — the remaining
explanation is inside the toolchain.

### One more signal from the same run

Every H4 run ends with

```
Warning: 2 stores not freed at program exit: kt=66 Hex×10, kt=97 Vec3×2
```

`Vec3` is the type `glb_pos_min` returns. Whether the unfreed store and the nulled minimum
are the same fact is not something we can tell from outside, but they arrive together on
every reproduction, and the leak persists on the 15:13 build.

### Suggested starting point

`glb-0.1.2/src/glb.loft:51` `glb_pos_min` seeds from a fallible index (`verts[0].pos.x`,
typed `float?` even though the length is guarded one line above) and returns it through
`vec3`'s non-null parameters. Discharging that seed explicitly would likely mask the symptom;
the asymmetry with `glb_pos_max`, which has the identical shape and never fails, is the part
worth understanding first.

---

## Cross-reference

| Topic | Where |
|---|---|
| The packages these were found in | `lib/moros_*`, recovered by [moros#2](https://github.com/jjstwerff/moros/issues/2) |
| Our gate (unaffected by all of the above) | `make lib-test` |
| The library contract these packages consume | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| loft's own filing conventions | `../loft/doc/claude/` · crawler's `LOFT-HANDOFF.md` is the pattern this file follows |
