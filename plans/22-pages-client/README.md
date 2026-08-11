# 22 — The pages client: the editor as a page, with the authority local instead of remote

**Issue:** [`jjstwerff/moros#22`](https://github.com/jjstwerff/moros/issues/22) ·
`status:active` · **Value:** `G` · **Effort:** `MH`

## Status

⏭ **THE CLIENT IS THE PRIORITY, AND `hex_cam` IS NOT.** The user's ordering, 2026-08-11:
*"this is not the highest priority, getting our client is that."* The camera library has three
consumers and a finished design and it still waits — **phases `C1`–`C4` do not start until `B3`
can be opened and driven.**

**Built:** `W1` (a world is bytes), half of `W4` (`press`, two of four sites wired), and `P2` is
**run and green** — so `W5` is buildable today with no loft change.
**Next:** `M1` — editing modes — then `W4`'s remaining sites, then `B1`.

⚠ **`W4` STOPPED HALFWAY ON PURPOSE, 2026-08-11.** Wiring `editor_client` and `script.mjs` to
`press` was attempted and **backed out**: measuring the two sides first showed `press` holds the
RUNNER's meanings and the server disagrees on three keys. And the user's mode requirement says
why a flat table could never have been right — see [EDITING_MODES](../../doc/claude/EDITING_MODES.md).
**The chokepoint is right and its contents are provisional.**

Today: `world_to_bytes`/`world_from_bytes` ship and `world_load` is 1.6× faster than the
field-by-field reader it replaced; `hex_editor::press` answers what a key means for
`editor_run` and for the server's `MSG_HOUSE`. `src/editor_client.loft` still holds no
`EditSession` and calls no gesture, so there is no local mode yet.

## Goal

A directory you can open from `file://` — build a house, close the tab, reopen it and the house
is there — produced from **the same client program the server serves**, differing only in where a
key press goes.

## Anchors

- **The design:** [`doc/claude/PAGES_EDITOR.md`](../../doc/claude/PAGES_EDITOR.md) — the one
  invariant, the four-site count, the filesystem correction, the probes.
- [`CAMERA_INDOORS.md`](../../doc/claude/CAMERA_INDOORS.md) — the modes, and § *The camera becomes
  a library* for `C1`–`C4`.
- [`LAVITION_SPLIT.md`](../../doc/claude/LAVITION_SPLIT.md) — this plan supplies the **second
  consumer** its extraction bar records as unmet, and `W4`/`C2` retire `world_to_hex` sites that
  plan [19](../19-lavition-split/README.md) `L6.3a` otherwise has to pay.
- Touches: `lib/hex_voxel/`, `lib/hex_editor/`, `lib/glb_read/`, `lib/hex_cam/` (new),
  `src/editor_client.loft`, `src/editor_server.loft`, `tools/script.mjs`, `tools/build-pages.mjs`
  (new), `tools/layering.sh`.

## Invariant gate

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| ✅ `W1` | `data/parts/` rebuilds **byte-identically**, and `world_to_bytes` equals the file the old writer produced **byte for byte** | **the bytes are the format; a file is a destination** — one encoder, not two | ⚠ **three, all run**: `bw_u16` big-endian must fail at a named byte (it did — byte 8349); a truncated buffer must be refused rather than decoded as zeroes; and a negative chunk coordinate must come back **negative** |
| ◐ `W4` | pressing a key and calling the gesture by hand leave worlds with the **same `w_tau`** | **one key, one meaning, wherever it is pressed** | `grade_under` returning the origin's height — `editor_run`'s actual old behaviour — must fail (it does) |
| `W2`/`W3` | a part loaded from bytes equals the same part loaded from a path | **a path is a wrapper, on every loader** | a `.glb` that fails to load must **say so**, not draw nothing — an absent mesh reads as a geometry bug |
| `B1` | the local page and the attached client build the **same world** from the same key sequence | the two authority modes are **one editor** | drive both with `tools/scripts/house.keys` and diff `w_tau`; if they differ, `press` has become a fifth site |
| `B3` | the demo gate opens `_site/index.html` **with no server** and reads a house out of the picture | the quick start **stays** working | ⚠ the gate must fail on an empty page — `[].every(…)` is `true`, and this tree has shipped a row that reported `ok` on a picture with no panel at all |

⚠ **`B2` (`build-pages.mjs`) has no exact-invariant surface** — it assembles files and decides
nothing. Said in a line so the silence does not read as *gate done*.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| ✅ **`P4`** — can one `--html` program hold the renderer **and** the gestures? | XS | **RUN.** `--check` rc=0 and the real `--html` build rc=0, 2546 KB / 1856 KB WASM in 9.6 s | ✅ Done |
| ✅ **`W1`** — `world_to_bytes` / `world_from_bytes`; save and load become wrappers | M | `make parts` byte-identical · `make lib-test` rc=0 both backends · hex_voxel 141 → 146 | ✅ Done |
| ◐ **`W4`** — `hex_editor::press`, the key→gesture chokepoint | M | `editor_run` ✅ · server `MSG_HOUSE` ✅ | ◐ **Two of four, and the rest now waits on `M1`** — see below |
| **`M1`** — editing modes: the verb set is DERIVED from where the author stands | M | a key with no verb here says *why*, not nothing | ⏭ **New, and it blocks `W4`** — [EDITING_MODES](../../doc/claude/EDITING_MODES.md) |
| ✅ **`P2`** — does `host_output` → JS → `loftPush` round-trip in a `--html` page? | XS | **RUN 2026-08-11 — it holds.** `probe/p2/run.sh` · `make probe-p2` · three exchanges, two sabotages seen red | ✅ Done |
| **`P5`** — is `fetch()` of a sibling file blocked under `file://`? | XS | a two-file page from `file://` in headless Chrome | Open — it decides whether assets are inlined |
| **`W2`/`W3`** — parts and `.glb` from bytes | S | a part loaded both ways is equal | ⚠ **Skip if [loft#851](https://github.com/loft-lang/loft/issues/851) lands** — then a path just works |
| **`W5`** — the JS↔loft bridge for storage | S | build a house, reload the page, it is there | ⚠ **Interim only.** Its best outcome is never existing — see `#851` |
| **`B1`** — local mode in `editor_client.loft`: hold an `EditSession`, route presses to `press` | M | both modes build the same world from one script | Blocked on `W4` |
| **`B2`** — `tools/build-pages.mjs`, and `_site/` | S | `_site/index.html` opens from `file://` | Blocked on `B1`, `P5` |
| **`B3`** — the demo gate | S | ⚠ **the first gate here needing NO server** | Blocked on `B2` |
| — | | ⏭ **THE CLIENT IS TESTABLE HERE. Nothing below starts before this line.** | |
| **`C1`** — the sampler probe: `surface_h_at` as a `fn(…)` parameter, camera pixel-identical | XS | `camera_indoors` still `subject 0.0188` | Deferred |
| **`C2`** — `lib/hex_cam/`: the avoidance routines, their constants and their tests | M | server calls it; `camera_indoors` does not move a pixel | Deferred |
| **`C3`** — the page client takes the camera | S | indoors works in local mode | Deferred |
| **`C4`** — hand `hex_cam` to crawler | S | ⚠ **needs a word first** — see below | Deferred |

## Cross-repo coordination

| repo | owns | what "done" means |
|---|---|---|
| **`loft-lang/loft`** | the `--html` shell | [#851](https://github.com/loft-lang/loft/issues/851) — bind the `fs_*` contract the wasm host already defines, `LayeredFS` backing it. ⚠ **Ask before building `W5`**: the installed loft leads `main`, so this can land inside a session, and this tree's rule is to wait for a toolchain rather than build around it |
| **`crawler`** | the third consumer of the camera | **read-only from here.** They declare `hex_field`/`hex_edge` and **no `hex_voxel`** — which is what forces `hex_cam` to take a height sampler rather than a world. ⚠ A shared package means `loft-libs-*` or the registry, and **a published package is one of the three things this tree does not do without asking** |

## Open questions

1. **Where does `hex_cam` live once crawler takes it?** `lib/hex_cam/` is where it is *built and
   verified*; it cannot stay there once a sibling consumes it. `loft-libs-world` is the obvious
   home — and adding a public name there can turn crawler red with no local edit, so grep first.
   *Not decided; `C4` is the step that asks.*
2. **Does the demo ship the whole part library, or a starter set?** `data/parts/` is 23 files and
   inlining it costs page weight the quick start pays on every open. *Wants a number from `B2`,
   not an opinion.*
3. **What does local mode do about the walk?** The server has a tick and a walker; `editor_run`
   teleports and says so. The page reuses the client's existing walk — **unverified**, and the
   design names it as the honest place its invariant may be false.

## What `W1` turned up (2026-08-11)

**Built as a SECOND encoder and diffed byte for byte before the old one was deleted** — the
capture-and-diff instrument rather than a round trip. A round trip proves the decoder undoes the
encoder, which two *consistently wrong* halves also do, and this format has an entry for exactly
that (the 8-byte voxel written as 28, round-tripping perfectly for as long as both halves agreed).

⚠ **THE PREDICTION WAS WRONG IN THE GOOD DIRECTION.** The design warned the byte path might be
slower; measured, `world_load` is **1.6× faster** — 1763 ms against 2821 ms over 40 loads of
`house/cottage.hxw`. One bulk byte read beats thousands of individual typed file reads.

⚠ **AND ONE OF THE NEW TESTS CLAIMED SOMETHING IT DID NOT TEST.** It asserted the sign of a
negative chunk coordinate *through* `world_cell`, and deleting the sign extension from `br_i32`
left all four tests green: an unsigned `-1` becomes 4294967295, lands in `ck_cx`, and nothing
downstream looks at it again. **A claim tested only through a consumer is a claim about the
consumer.**

## What `P2` turned up (2026-08-11)

**It holds: `host_output` → our JS → `loftPush` round-trips inside a `--html` page**, with a
script *we* appended. So `W5` needs no loft change and
[#851](https://github.com/loft-lang/loft/issues/851) is an improvement rather than a blocker.

⚠ **THE TWO SHELLS ARE NOT THE SAME, AND THE DIFFERENCE IS EXACTLY WHERE A CONSUMER TRIPS.**
`editor_client.loft` emits the **full engine shell**, where `loftPush` is created **lazily** inside
`loft_host_input_len` on the first `host_input()` — so JS cannot push before loft has asked, unless
it pre-creates `globalThis.__loftInQ`. A plain program emits the **minimal shell**, where
`loftPush` is defined **eagerly** over a module-local `inQ` and `__loftInQ` does not exist at all.
**The probe's shim works on both**, and the page the client actually ships is the *lazy* one — so a
`W5` written against the minimal shell alone would have failed on the only page that matters.

⚠ **THE CONTROL IS A REQUEST JS REFUSES TO ANSWER.** `SKIP:` comes back **empty**, so the channel
carries what was asked rather than echoing — and `REQ:world` after it proves `SKIP:` did not wedge
the queue. One exchange proves a wire; three prove it carries what was asked for.

⚠ **AND THE SECOND INSTRUMENT WAS WRONG FIRST.** It counted `answered += 1` beside the push;
sabotaging the push alone left it reporting **2 answers where none were delivered** — a second
instrument agreeing with a broken first. It records the pushed *values* now, which is why the two
failure modes are distinguishable: no-push reports `pushed: []` (our JS ran, delivered nothing),
no-injection reports `null` (our JS never ran).

## What `W4` turned up so far

**What a key means was re-asserted in FOUR places** — `editor_client`'s ASCII constants,
`editor_server`'s wire ids, `script.mjs`'s 23-entry `KEYMAP`, and `editor_run`'s direct map — and
omitting one was silent. ⚠ **Two of them said so in their own source**, and `script.mjs`'s
authority comment points at `html/editor.html`, **deleted on 2026-08-02**.

⚠ **THE DIVERGENCE WAS ALREADY REAL.** `H` built the house at two different heights: the server
took the grade under the author's feet, `editor_run` took it at the **origin**. Both are
`world_ground_cell(…).h_height` underneath, so they agreed on flat ground at (0,0) and nowhere
else — and every fixture stood there.

⚠ **`HOUSE_W`/`HOUSE_D` HAD THREE COPIES**, and the server's **shadowed the library's invisibly**.
`tools/names.sh` was silent and correctly so: it scans programs for bare *uses* of a library name,
never for a program *declaring* one a library also publishes. **That gap is recorded at the site
and is not yet fixed.**

⚠ **`terrain_h` AND `ground_h` ARE THE SAME FUNCTION UNDER TWO PUBLIC NAMES**, both in
`hex_editor`, byte-identical bodies. Found while proving the grade swap exact. Noted, not fixed.

⚠ **AND A DRAFT HELPER WAS DELETED RATHER THAN SHIPPED.** `is_gesture(key)` derived its answer by
running `press` against a scratch world so the key list could not be stated twice — which meant
*asking whether a key is a gesture built a house*. A predicate with a side effect and a cost is
worse than the duplication it avoids.
