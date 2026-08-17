# Probe 5 — a page in REMOTE mode must not tick

Plan 22, [WALK_TICK.md § probe 5](../../doc/claude/WALK_TICK.md). The last unmeasured
claim of the walk-tick design, and the prediction written before the first run is
[PREDICTION.md](PREDICTION.md) — unedited, including the four ways it said the probe
could come back blind.

> ⛔ **STATUS: BUILT, RUN, AND BLOCKED — not by the claim, by the toolchain.** The
> harness works and the instruments are in. The **page itself cannot attach**: the
> `--html` build made by the loft installed 2026-08-16 23:08 traps with
> `RuntimeError: unreachable` the moment it has a part thumbnail to build.
> [loft#950](https://github.com/loft-lang/loft/issues/950). Probe 5 answers nothing
> until that is fixed, and **it must not be answered from the run it did produce** —
> the transcript says *the page never attached*, which is a fact about the page.
>
> ⛔ **AND THE TRAP IS MEMORY CORRUPTION, not a clean abort** — narrowed to one
> statement, where a `Client` field reads `0` before and the f64 bits of `-31.4965`
> after. Eleven things are ruled out with controls, **no source-level workaround
> survived four attempts**, and the reduction below the whole client **did not
> converge**: the same parse, the same 90-field struct and the same libraries in a
> 3.1 MB module are green. See *The trap is memory corruption* below.

## What is here

| | |
|---|---|
| `run.sh` | the probe: two pages, two live servers, control against sabotage |
| `attach.sh` | the smallest thing that can answer *does this page attach* — one page, one real server, one transcript |
| `PREDICTION.md` | written before the first run |
| `t5_thumb.loft` | the suspect call on the interpreter, `--native` and `--native-wasm` |
| `t5_pagethumb.loft` | the same call inside an `--html` page with a baked filesystem |
| `t5_upload.loft` | `gl_upload_vertices` in an `--html` page, at seven sizes |
| `t5_handlers.loft` | the client's two thumbnail handlers, lifted out under a 3-field struct |
| `t5_bigstruct.loft` | the same, under a **90-field** struct — the client's shape |
| `wasmname.py` | resolves a trap's `wasm-function[N]` frames against the module's name section |

Each `--html` page is driven the same way, because `tools/build-pages.mjs` bakes
`data/parts` into whatever engine sits at `src/.loft/editor_client.html`:

```
loft --html probe/t5/out/big.html --lib lib/ probe/t5/t5_bigstruct.loft
cp probe/t5/out/big.html src/.loft/editor_client.html && make pages
node probe/b1b/press.mjs "file://$PWD/_site/index.html" ArrowUp --wait-ms 90000
make client && make pages      # ⚠ PUT THE REAL CLIENT BACK
```

## The instrument, and why it is not a world key

The page cannot be asked for an md5: it holds a **cache**, which legitimately differs
from the world by whatever has not streamed to it yet, so an inequality would mean
nothing and an equality would mean less.

It is already asked the right question once a second. The server broadcasts
`D:<cx>,<cz>,<li>,<crc>;…` over the visible set, the page answers `41:agree N bad M
layers L`, and the server writes it down as **`editor: client cache agree N bad M
layers L`**. A per-layer CRC of the page's cache against the server's world, computed
by the page, carried on the wire, recorded on **the other side** of it — the
non-circularity `probe/b1b` had to learn when its first version read the client's own
claim about the client.

## Two instruments had to be built, because the claim had none

⚠ **Both existed as sentences in the source arguing that they were unnecessary.**

1. **The walker report was gated `if st.local`**, with the comment *"attached they
   would be zero and meaningless"* — which is the claim under test offered as the
   reason not to look at it. It now prints an attached line asserting idleness:
   `client: attached walker — idle: 0 steps, walked 0, stamped 0, asked 1`.
2. **`wk_held` cannot see a key press.** That line prints once every 300 frames and
   `press.mjs` holds a key for 120 ms, so the *keys were held* half would have been
   invisible — and *nobody asked it to move* is the same sentence as *it refused to
   move* with none of the meaning. `held_seen` is a high-water mark, accumulated on
   the one edge where the bits are written.

## ⛔ What the run actually found, which is not probe 5

The first run came back with every row red and the page reporting `status ←
connecting`. That is not the claim failing — the page had **booted, connected and
died**:

```
client: connected to '/ws' — asked for the world (dial 4)
[exception] RuntimeError: unreachable
```

### The control pair that settles it

Same page content, same 20 baked parts, same driver, same URL — only the binary that
built the engine differs. The client prints a count before it builds its thumbnails
and a count after:

| engine built by | |
|---|---|
| the **previous** loft (page of 2026-08-16 22:03) | `local library — 20 parts` → `local thumbnails — 49 meshes for 20 parts` → 300 frames, attached, **8 digests** |
| the **current** loft (installed 2026-08-16 23:08) | `local library — 20 parts` → ⛔ trap; the second line never arrives |

⚠ **And the version string did not move** — both say `loft 2026.8.0`.

### What was ruled out, each by measurement

| | |
|---|---|
| **my own edit** — the unmodified client source, current toolchain | ⛔ traps identically. The instruments above are not the cause |
| the wire — the same engine in **local** mode with **no parts** | ✅ boots, raises, writes, saves a world |
| `hex_mesh::part_thumb_wire` on the **interpreter** / **`--native`** / **`--native-wasm`** | ✅ 69 messages over 20 parts, all three — the same number the interpreted server reports |
| …the same call inside an **`--html` page** with the identical baked filesystem | ✅ 69 messages. So neither `world_load` over the virtual FS nor the meshing is at fault |
| `gl_upload_vertices` in an **`--html` page** at 1…4096 vertices | ✅ every one |

## ⛔ The trap is memory corruption, and `unreachable` is its SECOND symptom

Narrowed statement by statement **inside the client**, by building a traced copy at
`out/step_client.loft` and driving it off `file://`. `st.prog` is a plain `integer`
field of the `Client`, and it is the instrument: on entry to `add_thumb_mesh` it reads
**0**, and one statement later it reads **-4593813329683836086** — which is the f64 bit
pattern of **-31.4965**. The `RuntimeError: unreachable` arrives one statement after
*that*, when a vector field is followed through the now-bogus reference.

```
T5  atm: E0 — on entry, tstale 1 prog 0
T5  atm: Q3 — prog 0                      ← immediately before the parse
    yverts = parse_singles(body[y3 + 1..body.size()]);
T5  atm: Q4 — prog -4593813329683836086   ← immediately after it
T5  atm: C0 — a scalar field, prog -4593813329683836086
    len(st.tstale)                        ⛔ RuntimeError: unreachable
```

⚠ **SO THE STACK IN THE TRANSCRIPT WAS NEVER THE QUESTION.** Chrome hands the trap ten
`wasm-function[…]` frames and `press.mjs` records them verbatim; `wasmname.py` resolves
them against the module's name section, and the answer is that **an `--html` build
carries no name section** — 58 named imports, 0 named module functions. The frames are
unreadable by construction, which is why this was bisected in the source instead.

The subject is one `Y:` body: **8,934 characters, 972 singles, part 0 `door/doorway`**.
`add_thumb_cam` has already run and `st.tstale` holds one row.

### What was ruled out, each by measurement, with a control

| | |
|---|---|
| the two handlers alone, lifted out under a 3-field struct (`t5_handlers.loft`) | ✅ **49 meshes, 20 cameras** — the same counts the working client printed |
| allocation VOLUME — 8,448 singles appended in place inside the same function | ✅ `prog` 0 at every one of nine sizes |
| `.split(',')` over the same 8,913-char slice, counting only | ✅ `prog` 0 — measured twice |
| `parse_floats` over that slice — 972 floats, result dead after | ✅ `prog` 0 |
| `parse_singles` over that slice — 972 singles, result dead after | ✅ `prog` 0 |
| binding the slice to a local instead of passing it inline | ⛔ still red |
| the parse AND the upload moved into a helper with no `Client` in scope | ⛔ still red |
| the parse written inline as a loop, result kept live | ⛔ red — `prog` garbage |
| the result passed straight to `gl_upload_vertices` as a temporary | ⛔ red — traps inside the call |
| a **90-field** struct in a small page, both handlers, the stale/drop path | ✅ green |
| …**plus the client's whole library set** and library-typed fields (`t5_libs`) | ✅ **49 meshes, 20 cameras** |

⚠ **THE ONE PATTERN THAT FITS EVERY ROW IS LIVENESS, AND IT IS NOT ENOUGH.** Every
measurement that left `st` intact had its big vector **dead** immediately after; every
one that clobbered `st` kept it **live** across later code. That is a coherent story
about a slot being reused — and the same shape in a small page is **green**, so it is
not the shape alone.

### ⛔ So the reduction below the whole client did NOT converge, and that is the finding

A 3.1 MB module doing the same parse, holding the same 90 fields, linking the same
libraries and running both handlers over the same 20 parts is **green**. The client's
5.8 MB module is not. Padding the small page with 2,000 lines of called code moved it
**36 KB** — a `--html` module's size is its libraries, not its source — so growing one
to the client's scale is not something a probe can do cheaply.

**No source-level workaround survived**: four were tried and each is a row above. The
browser editor stays broken until loft#950 is fixed, which is what `wa:none` says.

## ⛔ And the finding that outlives the defect: nothing in `make fast` builds the page

STATE.md records the toolchain swap being re-checked — `make fast` over 157 test files,
`layering.sh`, `walk-exact.sh`, `probe-k3c`, `probe-t3`, `probe-t4`, all green — and
concludes *"so the two steps stand."* They do. **But not one of those builds or drives
the `--html` client**, and the browser editor had been broken the whole time.

The two checks that would have caught it, `make probe-demo` and `make probe-auth`, are
both **outside** `make fast`. A green re-check after a toolchain change said nothing
about half the product, and said it confidently.

✅ **AND THE CHECK IS NOT BLIND — IT WAS NEVER RUN, WHICH IS THE BETTER OUTCOME OF THE
TWO.** Pointed at the broken page, `make probe-demo` fails exactly where the trap is:
its transcript ends at `client: local library — 20 parts under '/data/parts'` and its
driver refuses to press (*"the page never said 'no server answered'; nothing was
pressed"*). ⚠ **That distinction is worth stating** — a gate that goes green over a
dead page is a defect in the gate and a much longer job; a gate that goes red and is
not on any list is a scheduling fix. This one is the second.

**What was done about it:** `make page-check` — `client`, `pages`, `probe-demo`,
`probe-auth` — with the reason written into the Makefile beside it, and `make fast` now
ends by naming what it did **not** run. A green run that says what it did not cover is
the cheap half of this; the tier is the other half.

## What probe 5 will read when the page runs again

Nothing about the design has been measured yet. The rows are in `run.sh` and the
predictions in `PREDICTION.md`; the shape is:

- **C0–C5** the page as built: booted, attached, the digest compared something
  (`agree > 0`, the vacuity guard on the whole probe), `bad 0`, and the walker idle
  with `asked > 0`;
- **S0–S3** the same page with `if st.local` deleted — the *elegant* version, *"now
  every driver has a walker"* — which must boot, attach, tick, stamp, and be **seen**
  by the digest.

⚠ **S3 is the row that can still say the fixture is blind**, and `PREDICTION.md` lists
the four ways. The first is probe 4's scar exactly: `level_on` is never called on the
page in remote mode, so `wk_level_h` keeps `walker_new`'s 0, and levelling ground that
is already at 0 correctly writes **nothing**. The fixture raises ground first for that
reason and for no other.
