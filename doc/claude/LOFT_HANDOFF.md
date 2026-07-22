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
entries can be deleted — the reproducers are the re-verification. **H4 is new and open.**

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

At Moros commit `5e677b7`, `moros_render` exports GLB files whose position accessors carry

```json
"min": [null, null, null]
```

That is **malformed glTF** — `min`/`max` are required to be numbers. At the same commit:

- `loft test` in that package: **161 passed, 0 failed**;
- warning count in that package: **0** — including zero null-flow warnings, after a
  deliberate pass that discharged all 67 of them.

So a null flowed all the way into an exported artifact while every diagnostic the toolchain
offers said the code was clean. The accessor `max` is computed correctly in the same file, so
whatever nulls the fold does it selectively.

### Reproducer

```sh
git clone https://github.com/jjstwerff/moros && cd moros && git checkout 5e677b7
loft --interpret --path <loft-checkout>/ --lib lib/ \
     lib/moros_render/examples/demo_village.loft out.glb
python3 -c "…"   # read the JSON chunk; accessors[0].min is [null,null,null]
```

Moros `bdbce1b` (the next commit) exports valid minima — 32 accessors, zero nulls — so the
two commits bracket it.

### What we ruled out, each verified applied

Narrowing which part of `bdbce1b` fixed it. All three were tested individually against
`5e677b7`, and **all three still exported nulls**:

1. the division `half_w = HEX_WIDTH / 2.0` replaced by a literal;
2. `HEX_WIDTH` switched from a local literal to `hex_grid::HEX_LEN`;
3. the corner function's early-`return` chain rewritten as a single tail expression.

Only delegating the corner table to `hex_grid::hex_corner_offset` produces valid minima, and
**we cannot explain why** — the three obvious mechanisms are eliminated. That is why this is
filed rather than fixed locally: the remaining explanation is inside the toolchain.

### A note on measurement

Comparing the two GLBs float-by-float suggested 19% of values differing by up to 31 hex
steps. That is an artefact: the null-vs-number JSON changes the chunk length, which shifts
accessor byte offsets, so the naive elementwise diff compares misaligned arrays. The
trustworthy comparison is the scene summary, and it is **identical** across the two commits —
8 meshes, 7796 vertices, 6448 triangles. No geometry moved.

---

## Cross-reference

| Topic | Where |
|---|---|
| The packages these were found in | `lib/moros_*`, recovered by [moros#2](https://github.com/jjstwerff/moros/issues/2) |
| Our gate (unaffected by all of the above) | `make lib-test` |
| The library contract these packages consume | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| loft's own filing conventions | `../loft/doc/claude/` · crawler's `LOFT-HANDOFF.md` is the pattern this file follows |
