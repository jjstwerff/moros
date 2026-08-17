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

## What is here

| | |
|---|---|
| `run.sh` | the probe: two pages, two live servers, control against sabotage |
| `attach.sh` | the smallest thing that can answer *does this page attach* — one page, one real server, one transcript |
| `PREDICTION.md` | written before the first run |
| `t5_thumb.loft` | the suspect call on the interpreter, `--native` and `--native-wasm` |
| `t5_pagethumb.loft` | the same call inside an `--html` page with a baked filesystem |
| `t5_upload.loft` | `gl_upload_vertices` in an `--html` page, at seven sizes |

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

What is left is the client's own two handlers — `add_thumb_cam` / `add_thumb_mesh` —
inside an 8 MB page rather than a 4 MB one. Reducing below the whole client is the
next step and is not done.

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
