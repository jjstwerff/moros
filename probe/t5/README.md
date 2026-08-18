> # ✅ RESOLVED — loft#950 is fixed upstream, 2026-08-18
>
> The `--html` client built with loft's `tuxedo-work-957` binary of 09:36 renders: **49
> thumbnail meshes for 20 parts, 20 thumbnails, 300 frames, zero trap lines**, and it
> produces `world 16502:374721773` — the world `B2`/`B3` recorded on 2026-08-13, before
> the regression. Same world to the key, not merely an absence of a crash.
>
> **The cause was one row of `LOFT_VAR_TABLE`**, found by loft's maintainer: the loop
> binding `wc` marked `def OWNS` where it should carry `deps=[_vector_1(11)]`, so scope
> exit freed it and its `DbRef` carried `st`'s `store_nr`. Isolated to the binary by a
> controlled pair — one tree, same function, same `ref(3029)`, only the compiler changed.
>
> ⚠ **Everything below is the investigation as it stood, and it is kept.** Its value is
> not the conclusion — which was wrong about where the fault lived — but the eleven
> ruled-out measurements, the reduction that did NOT converge, and the three instruments
> that were blind before one answered. ⚠ Read § *The panic had a sentence* and probe 4
> before trusting any absence measured here.
>
> ⏭ **NOT live in this tree until `/usr/local/bin/loft` is replaced** — the 16 Aug binary
> still builds the trapping page.

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
>
> ✅ **AND THE TRAP HAS A NAME NOW — `Store offset overflow: rec=… fld=…`, 2026-08-17.**
> It is loft's **own store guard** firing, not an anonymous fault: the message was in
> the module's data section the whole time and the browser was never shown it. See
> *The panic had a sentence and nobody was told* below. Re-validated the same day
> against a from-scratch `make client` on the same binary — it still reproduces
> attached and off `file://`, and it dies **after the first thumbnail is meshed**.

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
| `wasmname.py` | resolves a trap's `wasm-function[N]` frames against the module's name section — and correctly reports that it **cannot**, because an `--html` build ships none |
| `wasmframes.py` | resolves them anyway, by **byte offset** into the code section. Names optional |
| `wasmpanic.py` | rewrites one function body so the panic **prints** instead of only aborting |
| `console.mjs` | every channel the browser has — `console.*` and `Log.*`, not only the page's `<pre>` |
| `ctl.html` | `console.mjs`'s control: a page that says one line on each channel |

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
| …**and `lavition_ui` too** — the one library `t5_libs` was missing (`t5_libsui`) | ✅ **49 meshes, 20 cameras**, `pr 4242`, on BOTH seats |

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

### ⚠ `t5_libs.loft` WAS NEVER COMMITTED, AND THE ROW ABOVE CITED IT FOR A MONTH

Only its OUTPUT reached the tree (`out/libs.html`, `out/libs.raw`). So the instrument behind
a load-bearing green — *the whole library set is not the trigger* — was unreproducible, and
loft's maintainer reasoned from it to name `lavition_ui` as the cheapest remaining cell.
`t5_libsui.loft` is that row rebuilt from `t5_bigstruct.loft` **plus the missing library**,
and it is committed.

⛔ **THE CELL IS GREEN AND THE SIZE MODEL BEHIND IT IS REFUTED.** Measured 2026-08-17:

| page | libraries linked | size | |
|---|---|---|---|
| `t5_bigstruct` | 2 | 4076 KB | ✅ |
| **`t5_libsui`** | **9, incl. `lavition_ui`** | **4172 KB** | ✅ |
| `src/editor_client.loft` | 10 | **7856 KB** | ⛔ |

**Linking every library costs +96 KB, not 3.7 MB.** So this file's own sentence — *an
`--html` module's size is its libraries, not its source* — does not hold: with the same
libraries linked the client is still 3.7 MB bigger. What separates them is how much of each
library is **reachable**; a probe calling a handful of entry points has the rest stripped.
That is also why padding with 2,000 called lines moved the page 36 KB. **Growing a probe to
the client's scale means growing the reachable surface, not the `use` list.**

✅ **AND THE DESKTOP SEAT REACHES THE SUBJECT NOW — it is clean.** The client attached to a
real server on `--interpret` with loft's new `LOFT_STRICT_STORES=1`: **49 thumbnail meshes
arrived, 49 held, 20 cameras**, still rendering at 600 frames, no trap and no
`Store access out of bounds`. With the store bound real on every target that makes a desktop
green evidence rather than a shrug: **the corruption looks `--html`-specific, not merely
`--html`-detectable.**

⚠ **Three things that seat needs, each of which cost a round trip:**

1. a display — `xvfb-run -a`, else `client: no window`;
2. **a server** — standing alone it ran 12,900 frames at `meshes 0`, because `add_thumb_mesh`
   runs on an arriving `Y:` body and nothing sends one. That run exits clean and reads
   exactly like a green;
3. ⛔ **`file()` resolves a relative path against the PROGRAM's directory, not the cwd.**
   The client is `src/editor_client.loft` and its `SERVERS_FILE` is `"servers.txt"`, so the
   file must be **`src/servers.txt`** — one at the repo root is never read. Measured with a
   control (the same program in `/tmp` finds `/tmp/servers.txt`). Same rule is why
   `part_availability("data/parts")` answered 0.

⚠ **A store-lifetime signal, offered rather than claimed**: that otherwise-clean interpreter
run still exits rc=1 with `NEVER FREED: kt=215 PartOpen×17, kt=29 main_vector<text>×1,
kt=65535 ?×1` — on the part-reading path the thumbnails come from. `pr` is intact and the
page is green, so this is **not** claimed as #950; it may be ours, since `hex_part` is ours.
Raised on the issue with that stated.

## ✅ The panic had a sentence, and nobody was told — 2026-08-17

⚠ **THE WHOLE BISECT ABOVE WAS THE PRICE OF NOT READING A MESSAGE THAT WAS ALREADY IN
THE MODULE.** The trap is not anonymous. It is loft's **own store guard**:

```
Store offset overflow: rec=… fld=…  created at pc=…, last legitimate op at pc=…,
freed at pc=…, … now at pc=…
```

`freed at pc=` puts it in the store-lifetime family — the neighbourhood of loft#760 and
loft#810 — rather than in graphics or meshing, and it fits the symptom exactly: a scalar
field reading a neighbouring value's bits, with the trap arriving only on the next
vector read. **That is a runtime check firing, not undefined behaviour**, which means
loft's own runtime knew the record and the field the whole time.

**Three steps, and the first two are readable rather than run:**

1. **The frames resolve by BYTE OFFSET.** `wasmname.py` cannot answer — there is no name
   section — but Chrome prints `wasm-function[1073]:0x56ba1c`, and that offset is a
   *module* offset, so the code section locates the function and the instruction with no
   names involved. `wasmframes.py` does it, and the index becomes a cross-check rather
   than the only evidence. Its first line was the answer: `wasm-function[1073]` is a body
   of **three bytes** — `00 00 0b`, no locals, `unreachable`, `end` — an abort STUB. So
   eight of the ten frames were `core::panicking` and only two were program.
2. **The message is a static in the data section.** The raising frame
   `wasm-function[903]` (`defined#845`) passes `i32.const 1048714`, which lands exactly
   on the length-prefixed `\x1b"Store offset overflow: rec="`. ⚠ **A byte-pattern scan
   said 5805 hits and was a useless instrument** — the same five bytes occur inside
   unrelated immediates — so the decode had to be real (`wasm-dis`), not a grep.
3. **And it is confirmed at RUNTIME, because reading is not measuring.** The page already
   imports `loft_io.loft_host_print` as `(i32 i32)`, a (ptr, len) print, and nothing on
   the panic path calls it. `wasmpanic.py` rewrites `defined#1113`'s body to
   `local.get 0; local.get 1; call loft_host_print; end`, re-embeds the module, and the
   page prints. ⚠ The second argument is **not** a length, so the print runs on into the
   rest of the string table — the first message is the answer and the runaway is the
   instrument being honest about what it does not know.

✅ **AND PRINTING IT IMPROVES THE BACKTRACE AS A SIDE EFFECT, WHICH WAS NOT THE POINT.**
With the panic returning instead of aborting, the trap is raised at the *raising* frame:

```
wasm-function[903] defined#845 (i32,i32,i32)->i32        813 B   ← the store access
wasm-function[63]  defined#5   (i32,i32,i32,i64,i32,i32) 1034 B
wasm-function[390] defined#332 (i32,i32,i32,i32)        13576 B
wasm-function[435] defined#377 (i32)                   267952 B
wasm-function[441] defined#383 ()                        5659 B
```

Five loft frames where there were eight of panic machinery and two of program. Both
findings are on [loft#950](https://github.com/loft-lang/loft/issues/950) and
[loft#954](https://github.com/loft-lang/loft/issues/954), with the ordering stated:
**route the message to `loft_host_print` before shipping a name section** — it is
smaller and it is worth more.

⚠ **AND THE DRIVER THAT PROVED THE SILENCE WAS BLIND ON ITS FIRST RUN.** *The panic
prints nothing* could not be concluded from `press.mjs`, which reads the page's `<pre>`
and `Runtime.exceptionThrown` and never subscribes to `console.*`. `console.mjs` does —
and its first run scored the CONTROL as silent, because headless chrome answered
`net::ERR_ACCESS_DENIED` for a `file://` URL under the session scratch directory. **A
driver that cannot see a line it was told to look for reports the same silence for a
page that never spoke and a page it never loaded**, so `ctl.html` is run first and the
navigate result is printed every time.

### The blast radius, measured rather than assumed

Of the tree's 49 gates, **five drive a browser and three of them fail** — `cache`
(222 s), `client_mesh` (243 s), `camera_indoors` (261 s) — every one by the page never
producing a frame. `camera_indoors` is the independent instrument: the page is attached
and alive on the wire (536 messages) and renders **pure sky over 33,600 samples**, at
`cam false` and `parts -1`. ⚠ The two that pass — `cart` and `subject` — read numbers
and status lines rather than a rendered world, which is why `make gate` does not simply
collapse and why a partial green here says nothing about the product.

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
