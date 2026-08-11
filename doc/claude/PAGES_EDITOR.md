<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# PAGES_EDITOR — the editor as a page, with no server at all

**Status: designed 2026-08-11, not built. One probe (`P4`) already run and it holds.** Every
measurement below was taken on that date against this tree and the *emitted* browser page, not
recalled.

⚠ **NO PLAN NUMBER YET, DELIBERATELY.** `plans/README.md`'s rule is *claim the issue before you
name the directory — the number is the identity, and scanning the tree for a free one mints
collisions.* 21 is the highest today; **the issue is claimed first, then `plans/<n>-pages-editor/`
takes its number.**

> **This file is lavition's and is written to be MOVED**, like
> [HEX_STACK](HEX_STACK.md) and [LAVITION_SPLIT](LAVITION_SPLIT.md). It carries its own
> definitions and names no Moros concept.

**The ask, in the user's words:** *a stand-alone pages version of the editor without a server. It
loads the possible assets from the project like `../routing` does with its data files. It should
store the current build in the web local storage so nothing is lost on closing the page. The focus
right now should be building houses.*

---

## The one invariant

> **The page is the same editor with different I/O.**
>
> Every difference between the standalone page and the server-backed editor is a difference in
> *where bytes come from and where they go*. Never in what a gesture does, never in what a scene
> is, and never in what a key means.

That is the whole design, and it is what makes a case nobody tested behave correctly: a gesture
added next month works in the page for the same reason it works in the server — **because both
call the same function in `hex_editor`**, not because someone remembered to add it twice.

⚠ **The invariant is a claim about a CHOKEPOINT, and this tree has learned to distrust that
word.** LAVITION_SPLIT's own plan once said *"one chokepoint that 18 sites route through"* and
shipped as 18 bypasses. So the count is taken **before** any code, below, and it is not 1 today.

---

## What was measured, 2026-08-11

| | measured | how |
|---|---|---|
| the browser page has **no filesystem at all** | `loft_file_read` · `loft_file_write` · `read_file` · `write_file` · `__loftFS` — **0 occurrences each** | grep of the emitted `src/.loft/editor_client.html` (2.5 MB, WASM 1.8 MB) |
| …so every load/save in the stack is unreachable there | `world_save(w, path, …)` · `world_load(path)` · `load_glb(path)` are **path-only**; there is no bytes variant | `grep '^pub fn' lib/hex_voxel/src lib/glb_read/src` |
| …and the gap is in **one package** | `hex_part` makes **zero** filesystem calls — it works on a `VoxelWorld` and `part_file()` only builds a path *string* | grep of `lib/hex_part/src/` |
| **HTTP works in the page** | full `fetch` bridge with method/url/body/headers and a fetch registry; `entry.body = new Uint8Array(await resp.arrayBuffer())` — **binary is preserved**, not decoded | read out of the emitted page |
| a **store** can be loaded from a URL synchronously | `@PLN97 store_load_url_trusted: async fetch() bridged to a SYNCHRONOUS loft call via asyncify` | ditto |
| **no storage binding of any kind** | `localStorage` · `sessionStorage` · `indexedDB` — **0 occurrences**; and loft's Rust source has **0** hits for `localStorage` | emitted page + `~/workspace/loft` |
| …but a **bidirectional JS↔loft channel is first-class** | *"the request/response pattern is `host_output` a request, act on it in JS, `loftPush` the completion"* — `host_input() -> text` and `host_output(msg: text)` are loft **stdlib** (`default/02_files.loft:946,956`) | emitted page + loft stdlib |
| the gestures **already run without a server** | `src/editor_run.loft` — *"S7 — THE SCRIPT DRIVES THE GESTURES, WITH NO SERVER AT ALL"*, 162 lines | the file |
| the client **already meshes its own voxels** | it holds `cache: VoxelWorld` and calls `hex_mesh::chunk_mesh_mat`; plan 16 `S3`/`S4` landed | `src/editor_client.loft` |
| the client holds **no session and calls no gesture** | one `hex_editor::` reference in 1,823 lines, and it is a material constant | ditto |
| the part library is **small** | `data/parts/` — 20 `.hxw` + 3 `.glb`, 23 files | `find data/parts -type f` |

⚠ **THE RENDERING IS NOT WORK, AND THAT IS THE FINDING THAT MAKES THIS CHEAP.** Plan 16's client
split already put the voxel cache and the mesher in the browser and stopped the server sending
ground meshes at all (`ground sent 174 held 20`). **The page is not a new renderer**; it is the
existing renderer with its socket replaced by a function call.

---

## The re-assertion count, taken before any code

**How many independent sites must re-state *what a key means* for the editor to be correct?**

| # | site | form | keys |
|---|---|---|---|
| 1 | `src/editor_client.loft` | ASCII constants → wire message (`KEY_FENCE = 102`) | the walk + the tools |
| 2 | `src/editor_server.loft` | wire message id → `hex_editor` gesture | all of them |
| 3 | `tools/script.mjs` | `KEYMAP` — key → wire message id | **23** |
| 4 | `src/editor_run.loft` | key → gesture **directly** | 6 |

**N = 4, and omitting a site is silent** — a key that builds a house in the browser and does
nothing headless produces a *different scene* with every count agreeing. A standalone page written
the obvious way makes it **5**.

⚠ **BOTH DUPLICATED SITES ALREADY SAY SO IN THEIR OWN SOURCE, WHICH IS THE PART TO SIT WITH.**

- `src/editor_run.loft`'s fallback is `"no gesture for key {k} — add it here **and to the page**"`.
- `tools/script.mjs` says *"One table below maps each … **that is the one duplication here**"*, and
  its authority comment reads **"⚠ KEEP IN STEP WITH `html/editor.html`'s keydown handler"** —
  ⚠ **a file deleted on 2026-08-02.** The instruction naming where the truth lives has pointed at
  nothing for nine days, and the table is 23 entries long.

**So the brittleness is known now, before any code: `N × silence` = 4 × silent.** The cure is
`W4` below — **collapse N toward 1** by moving the map into `hex_editor`, where every consumer
already looks. The page is not the reason to do it; the page is the consumer that makes refusing
it untenable.

---

## The target shape

```
lavition/
  src/editor_page.loft      ← NEW. the whole editor in one --html program:
                              EditSession + gestures + mesher + renderer + panel
  tools/build-pages.mjs     ← NEW. assembles _site/ (routing's build-site.mjs pattern)
  _site/                    ← the deliverable: a directory you can serve statically
    index.html                the --html page, with the host bridge appended
    parts/index.json          the asset manifest — what parts exist
    parts/**/*.hxw|.glb       the assets, fetched on demand
```

**Three programs, one editor.** `editor_server` (socket → gesture), `editor_run` (script →
gesture), `editor_page` (key → gesture). ⚠ **The page is the third consumer, and that is a
`hex_editor` argument rather than a page argument** — a library validated against one caller has
not been shown to be general, which is the extraction bar's own clause.

⚠ **AND IT DISCHARGES A CLAUSE PLAN 19 RECORDS AS UNMET.** LAVITION_SPLIT lists *a second
consumer* as one of two genuinely open clauses, answered only by the split itself. `editor_page`
answers it **before** the split, in-tree, and for free: `editor_client.loft` and `editor_run.loft`
both compile against a lavition-only `lib/` today (measured, `make probe-split`), so a program
built from the two of them is **Moros-free by construction** rather than by discipline.

⚠ **THE NEW PROGRAM GOES IN `PROGRAMS` IN `tools/layering.sh` IN THE SAME COMMIT.** That list is
what `PROGRAM_DEBT` checks, and a program missing from it is a program whose Moros coupling nothing
measures — which is the exact defect that guard was written for this morning.

---

## The library work

Five items. **Four are in packages that already exist and one is a new tiny package.**

### `W1` — `hex_voxel`: a world is BYTES, and a path is a wrapper

**The load-bearing one.** `world_save(w, path, palette)` and `world_load(path)` are the only
filesystem in the stack, and the browser has none.

```
pub fn world_to_bytes(w: VoxelWorld, palette: vector<integer>) -> vector<u8>
pub fn world_from_bytes(b: vector<u8>) -> WorldLoad
```

…and `world_save` / `world_load` become **thin wrappers** over them. ⚠ **The wrapper direction is
the invariant**: if the byte form is derived from the file form, two encoders exist and the page
and the server can disagree about what a world is. If the file form is *bytes plus a write*, they
cannot.

⚠ **THE CONTROL IS ALREADY WRITTEN AND COSTS NOTHING**: `make parts` rebuilds every committed
`.hxw` and this tree has repeatedly proved a refactor by *byte-identical output*. `W1` is done when
`data/parts/` rebuilds byte-identically **and** `world_from_bytes(world_to_bytes(w))` round-trips —
the second is what the first cannot see.

### `W2` — `hex_part`: mostly falls out of `W1`

Measured: **`hex_part` touches no files.** It reads and writes sections of a `VoxelWorld`
already in memory, and `part_file(root, name)` only builds a string. So *load a part from bytes*
is `world_from_bytes` plus the existing `part_*` readers. **What is left is the catalogue**: today
the library is a directory walk, and in a page it is a fetched manifest — see `W5`.

### `W3` — `glb_read`: `glb_from_bytes` beside `load_glb(path)`

Three `.glb` in `data/parts/`. Same wrapper rule as `W1`: the path form calls the bytes form.
⚠ **Small, and it is the one place a stub is tempting** — a part whose mesh silently fails to load
draws nothing and reads as a geometry bug, which is a shape this tree has paid for twice.

### `W4` — `hex_editor`: `press` — the chokepoint that collapses N from 4 to 1

```
pub fn press(sess: EditSession, w: VoxelWorld, a: &Author, key: text) -> Ack
```

One place that answers *what does this key do*. `editor_run` calls it, `editor_page` calls it, and
`editor_server` calls it behind its wire ids. ⚠ **`script.mjs`'s 23-entry `KEYMAP` is then a
TRANSPORT table, not a meaning table** — it may keep mapping keys to wire ids, because that is
genuinely the socket's business; what it must stop doing is deciding what the key *means*.

⚠ **THIS IS THE ONE ITEM THAT CAN BE GOT WRONG QUIETLY, AND THE FAILURE IS THE OPPOSITE OF THE
OBVIOUS ONE.** The risk is not that `press` is missed — it is that it lands as a **fifth** site
while the four survive, because each has a local reason to stay. The step is not done when `press`
exists; **it is done when the other three call it and their own tables are deleted.** That is this
tree's commonest defect (*a function written, tested green and never wired*), and it has cost an
entire phase's deliverable before. **Grep for callers before calling `W4` done.**

### `W5` — `lavition_host` (new, tiny): the JS↔loft request/response bridge

```
pub fn host_ask(request: text) -> text     // host_output(request) then host_input()
```

Depends on **nothing** but the stdlib. It is what gives a page localStorage, the asset manifest,
and any future browser capability **without a loft change** — because the channel is already
first-class and documented in the emitted page.

⚠ **A NEW PACKAGE IS PROPOSED HERE ONLY BECAUSE THE ALTERNATIVES ARE WORSE, AND `L3′` IS THE
PRECEDENT.** It cannot go in `hex_editor` (a gesture library must not know what a browser is) or
in `lavition_ui` (that is the panel). ⚠ **Grep `lib/`, `../loft-libs-*/` and the registry for the
name before taking it** — `hex_fit` refused a name at `L6.1` and that refusal was a finding.

⚠ **AND IT IS DELIBERATELY *NOT* A `localStorage` PACKAGE.** The channel is the general thing;
storage is one request on it. A package named for one request is `moros_terrain` again.

### What is explicitly NOT library work

**The renderer, the mesher, the panel and the gestures.** All four already exist and already run
in the browser or already run without a server. ⚠ If this design starts growing rendering work,
the invariant has been lost — say so and stop.

---

## The persistence format, and the one decision inside it

**localStorage holds a whole world as bytes** — `world_to_bytes` (`W1`), base64'd, under one key.

⚠ **THE SIZE IS THE RISK AND IT IS NOT MEASURED YET** — `P3` below. Browsers cap localStorage at
about 5 MB per origin, and a `.hxw` grows with what has been built. **The design does not
pre-emptively shard**, because [GROUND_DEFAULT](GROUND_DEFAULT.md) already establishes that
storage holds only what *differs* from the ground, and a house is small. If `P3` says otherwise
the answer is IndexedDB via the same `W5` channel — a bigger request on the same bridge, not a
different design.

⚠ **AUTOSAVE ON THE EDIT CLOCK, NEVER ON A TIMER.** `w_tau` bumps once per write that changed
something, so *save when tau moved* is exact, costs nothing when idle, and is the same on any box.
A wall-clock autosave measures the machine — this tree's rule, and it has three scars from it.

---

## The probes that could falsify this, cheapest first

⚠ **Every one is a compile or a page load. None needs the design to be built**, and `P1` and `P2`
can each kill an item outright.

| | the claim | the probe | if it fires |
|---|---|---|---|
| **`P1`** | a **binary** `.hxw` survives `web::http_get` intact | fetch one part in a `--html` page and compare its bytes to the file | `W2`/`W3` route through `store_load_url_trusted` (measured present) or base64 the assets at build time. **Not fatal, but it changes the manifest format** |
| **`P2`** | `host_output`/`loftPush` round-trips a string from a `--html` page, and our JS can be appended to the emitted page at all | a ten-line page: `host_ask("PING")` → JS replies → assert | **`W5` is impossible and localStorage needs a loft ticket.** This is the one that decides whether the ask is buildable today |
| **`P3`** | a built world fits in localStorage | `world_to_bytes` on the house scene from `tools/scripts/house.keys`, print the length | shard, or IndexedDB over the same bridge |
| ✅ **`P4`** | one `--html` program can hold **both** the renderer and the gestures | ✅ **RUN 2026-08-11 — it holds.** See below | — |

✅ **`P4` WAS THE ONE I FEARED MOST AND IT PASSED, WHICH IS WHY IT WAS RUN FIRST.** `L3′` records
two *already-reverted* experiments where joining two packages' cones broke a third
(`Cannot redefine 'fabs'`, then `seg_len`), and the page joins `hex_editor` to `graphics` +
`lavition_ui` in one program.

**Measured both ways.** `editor_client.loft` plus an `EditSession`, `author_at`, `WallRuns`,
`ground_h` and a real `place_house` call: `loft --check` **rc=0**, and then the honest instrument
— the actual `loft --html` build — **rc=0, zero errors, 2546 KB with a 1856 KB WASM in 9.6 s**,
byte-for-byte the same size as the existing client.

⚠ **THE CONE QUESTION WAS ALREADY ANSWERED AND NOBODY HAD NOTICED**: `src/editor_client.loft`
**already imports `hex_editor`** and has since plan 16 `S3`, alongside `graphics`, `hex_mesh` and
`lavition_ui`. `make client` has been compiling that composition to a browser page for weeks. The
gesture library was in the browser build the whole time — **what is missing is a session and the
calls, not a way to link them.**

⚠ **AND THE PROBE FAILED THREE TIMES FIRST, ALL THREE MINE** — `RoofPlans.len`, then
`EditSession.es_level`, then the right field. Each was an `error:` and each read at a glance like
a cone collision. **A probe's first red is its own bug until the message has been read**: the
diagnostic named a *field*, never a package, and that is the difference.

⚠ **AND THE CLEANEST CLAIM IS THE ONE TO ATTACK: *"the page is the same editor with different
I/O"*.** The honest place it may be false is the **walk**. The server has a tick and a walker; a
page has a frame loop; `editor_run` teleports and says so (*"a test has no tick, so it teleports"*
— and `es_author` is a driver's pose, never the editor's). **If the page needs its own movement
model, that is a second authority on where the author is**, which is a thing this tree has already
named and refused once. The design's answer is that the page reuses the **client's** existing walk
— it already has one — and `press` never touches the pose. ⚠ **Unverified. It is the first thing
to check after `P4`.**

---

## Sequencing — and what "focus on houses" buys

The user's constraint is the schedule: ***the focus right now should be building houses***, tested
soon. That is a real reduction, not a caveat — it means **`press` needs the house keys and nothing
else** at first, and the whole prop/door/vehicle surface can wait.

| | | why here |
|---|---|---|
| ✅ ~~`P4`~~, `P2` | the two probes that could reshape the work — **`P4` is done and it holds**, so `P2` is the only one left that can | before anything is built |
| `W1` | world ⇄ bytes | everything else needs it, and its control (`make parts` byte-identical) already exists |
| `W4` (house keys only) | `press` for `H`, `O`, `P`, `R`, `B`, `C`, `E`, `Q`, arrows | the smallest set that builds a house with doors, windows, walls and a storey |
| `W5` + autosave | the bridge, then save-on-`w_tau` | **this is the first testable milestone** — build a house, close the tab, reopen it |
| `W2`/`W3` + `build-pages.mjs` | the manifest and the assets | doors and props are parts; the house shell is not |
| the rest of `W4` | every remaining key, and **delete the other three tables** | ⚠ the step is not done until they are gone |

⚠ **THE FIRST MILESTONE IS DELIBERATELY *BUILD A HOUSE AND REOPEN THE TAB*, NOT *THE PAGE
RENDERS*.** A page that draws is not evidence — the renderer already works, so a picture would be
testing the thing that was never in doubt. **Persistence across a close is the claim the user
actually made**, and it is the one no existing gate covers.

---

## What this design deliberately does not do

- **It does not replace the server.** The server keeps the gates, the walk, multi-client and the
  tick. ⚠ **A page that quietly became the only editor would take 39 gates with it**, and that is
  LAVITION_SPLIT's *trap* section almost word for word.
- **It does not put invariants in JavaScript.** `tools/build-pages.mjs` assembles files; it decides
  nothing. Every rule stays a loft test — this tree's standing division, and the reason
  `build-pages.mjs` is allowed to exist at all.
- **It does not author parts.** *No gesture can author a `FITS`* is plan 17's open gap and it is
  not this plan's.
