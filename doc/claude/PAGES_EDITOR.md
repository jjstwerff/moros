<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# PAGES_EDITOR — the editor as a page: the quick start, and one client with two authorities

**Status: designed 2026-08-11. `P4` run and it holds; `W1` BUILT, `W4` built and one of four
sites wired.** Every measurement below was taken on that date against this tree and the *emitted*
browser page, not recalled.

⚠ **THE TITLE SAID *"with no server at all"* AND THAT WAS THE WRONG FRAME.** The page is not the
editor minus a server — it is the editor with the **authority local instead of remote**, and it is
a **permanent quick-start demo** rather than a phase. A server is coming back for script
compilation, multi-player and debugging. See § *The server is not legacy*, which is the section
that decides the architecture.

**Plan [#22](https://github.com/jjstwerff/moros/issues/22)** holds the steps and the per-phase
record: [`plans/22-pages-client/`](../../plans/22-pages-client/README.md). ⏭ **It is the
priority** — the camera library designed in [CAMERA_INDOORS](CAMERA_INDOORS.md) is phases
`C1`–`C4` of that plan and **deliberately waits until the client can be opened and driven.**

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
| ⚠ **the `--html` SHELL binds no filesystem** — *and the first draft of this line said "the browser" and was wrong* | 0 of the 20 `fs_*` names, on a program that really calls `world_save` / `world_load` / `file()` and **builds rc=0** | grep of an emitted page — see *The filesystem correction* below |
| …so every load/save in the stack is unreachable **there** | `world_save(w, path, …)` · `world_load(path)` · `load_glb(path)` are **path-only**; there is no bytes variant | `grep '^pub fn' lib/hex_voxel/src lib/glb_read/src` |
| …and the gap is in **one package** | `hex_part` makes **zero** filesystem calls — it works on a `VoxelWorld` and `part_file()` only builds a path *string* | grep of `lib/hex_part/src/` |
| **HTTP works in the page** | full `fetch` bridge with method/url/body/headers and a fetch registry; `entry.body = new Uint8Array(await resp.arrayBuffer())` — **binary is preserved**, not decoded | read out of the emitted page |
| a **store** can be loaded from a URL synchronously | `@PLN97 store_load_url_trusted: async fetch() bridged to a SYNCHRONOUS loft call via asyncify` | ditto |
| **no storage binding of any kind** | `localStorage` · `sessionStorage` · `indexedDB` — **0 occurrences**; and loft's Rust source has **0** hits for `localStorage` | emitted page + `~/workspace/loft` |
| …but a **bidirectional JS↔loft channel is first-class** | *"the request/response pattern is `host_output` a request, act on it in JS, `loftPush` the completion"* — `host_input() -> text` and `host_output(msg: text)` are loft **stdlib** (`default/02_files.loft:946,956`) | emitted page + loft stdlib |
| the gestures **already run without a server** | `src/editor_run.loft` — *"S7 — THE SCRIPT DRIVES THE GESTURES, WITH NO SERVER AT ALL"*, 162 lines | the file |
| the client **already meshes its own voxels** | it holds `cache: VoxelWorld` and calls `hex_mesh::chunk_mesh_mat`; plan 16 `S3`/`S4` landed | `src/editor_client.loft` |
| the client holds **no session and calls no gesture** | one `hex_editor::` reference in 1,823 lines, and it is a material constant | ditto |
| the part library is **small** | `data/parts/` — 20 `.hxw` + 3 `.glb`, 23 files | `find data/parts -type f` |

---

## ⚠ The filesystem correction — the mechanism EXISTS, and it is better than what this file first designed

**The first draft of this design said *"the browser page has no filesystem"* and built a
hand-rolled persistence layer on that premise. That was wrong, and the user said so.**

loft ships **`VirtFS`**, and loft's own file paths already honour it under wasm —
`src/database/io.rs:781`, `src/state/io.rs:223`, `src/parser/mod.rs:9564`,
`src/parser/control.rs:11753`. On top of it sits **`LayeredFS`**
([loft `doc/claude/WASM.md` § *Layered Filesystem*](https://github.com/loft-lang/loft)), which is
**exactly the shape this ask describes**:

| `LayeredFS` | the ask |
|---|---|
| an immutable **base tree**, bundled at build time from a directory into `base-fs.json` | *"loads the possible assets from the project like `../routing` does with its data files"* |
| a **delta** — only what changed — persisted to **localStorage**, IndexedDB named as the fallback | *"store the current build in the web local storage so nothing is lost on closing the page"* |

**`data/parts/` is the base tree and the edited world is the delta.** That is one mechanism for
both halves of the request, it is loft's own, and it means `world_save(path)` — the call every
other target already makes — is the whole persistence design.

### But the two browser shells bind opposite halves, and that is the real gap

| shell | binds | missing |
|---|---|---|
| **`--html`** | `gl_*` (52 fns), `audio_*`, `host_http_*`, `host_input`/`host_output`, `time` | **`fs_*` — 0 of 20** |
| **the wasm host** (`tests/wasm/host.mjs`, the Web IDE) | `env`, **`fs_*` (20)**, `log`, `random`, **`storage`**, `time` | **graphics — 0** |

**A rendering editor needs both and today it can have either.** Measured: a program calling
`world_save`, `world_load` and `file()` compiles to `--html` **rc=0** and the emitted module has
**no `fs_*` import at all** — so a host cannot even supply one from JS, because there is nothing
to bind to. Nothing warns; a page silently has no filesystem.

✅ **Raised as [loft#851](https://github.com/loft-lang/loft/issues/851)**
(`enhancement` · `needs-design` · `wa:partial` · `area:wasm` · `hit-by:moros`): *`--html` binds the
same `fs_*` contract the wasm host already defines, with `LayeredFS` as the backing.* It asks for
a **binding, not a feature** — every piece already exists on their side.

⚠ **MY MEASUREMENT WAS RIGHT AND MY SENTENCE WAS WRONG, WHICH IS THE INSTRUCTIVE PART.** The grep
found nothing because it asked *the `--html` shell*, and I wrote the answer up as a property of
*the browser*. The tree's own rule is to check an instrument against something it should find
before trusting it to report an absence — and there **was** something to find, one shell over.
**An absence is always an absence *in the place you looked*.**

---

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

## ⚠ The server is not legacy — it is coming back, and that changes the shape

> **The user, 2026-08-11:** *"beware that eventually lavition will need a server for compiling
> scripts, multi-player and debugging."*

**This is the constraint that decides the architecture, and the first draft of this file got it
wrong.** It proposed a **new program**, `src/editor_page.loft`, beside `editor_client.loft` — *"three
programs, one editor"*. That is correct only if the page is a destination. It is not: it is one
**mode** of a client that will also, later, be attached to a server.

⚠ **TWO RENDERER PROGRAMS IS A FORK, AND IT IS THE FORK THIS TREE ALREADY PAID FOR ONCE.**
`html/editor.html` and the wasm client were two renderers for one editor; they were reconciled by
**deleting one** (2026-08-02, after a 49,500-sample luminance comparison), and `tools/script.mjs`
*still* carries a comment ordering the reader to keep in step with the deleted one. Building a
second renderer now, while knowing a server is due back, is scheduling that reconciliation again.

### The correction: one client, two authorities

> **The page is not *the editor without a server*. It is the editor with the AUTHORITY LOCAL
> instead of REMOTE.**

That is a sharper form of this file's invariant and it is the one that survives the server's
return. `src/editor_client.loft` already renders, already caches voxels in a `VoxelWorld`, and
already meshes them. What changes per mode is **where a key press goes**:

| mode | a press goes to | the authoritative world is |
|---|---|---|
| **local** (the page) | `hex_editor::press` in the client | the client's own |
| **attached** (today's editor) | a wire message | the server's |
| **multi-player** (later) | a wire message; other authors' edits arrive the same way | the server's |

⚠ **`W4` IS WHAT MAKES THE SWITCH SAFE, AND THIS IS THE ARGUMENT FOR IT.** If a key means one
thing locally and another over the wire, the two modes are two editors and the mode switch is a
behaviour change. `press` is the reason they cannot drift — which promotes it from *tidy-up* to
**precondition**.

### What a page can never do, and it is exactly the user's list

| needs a server | why the page cannot |
|---|---|
| **compiling scripts** | a routine is loft, and compiling loft needs a toolchain. The `--html` page *is* the compiler's output; it does not contain one. Plan [#15](https://github.com/jjstwerff/moros/issues/15) lands server-side |
| **multi-player** | two authors need one authority, and a page is per-tab. `#8`'s `M1`/`X2` (many authors, one store) are the server's rows |
| **debugging** | [`loft debug`](LOFT_DEBUGGER.md) attaches to a process. ⚠ Its own note says it *cannot reach a running server yet* — so this one is not "the server has it", it is **nobody has it**, and the page must not be read as the reason |

**So the page's job is the authoring loop — build a house, see it, keep it** — and it is honest
about stopping there. ⚠ **A page that grew its own script runner or its own second author would be
re-implementing the server in the one environment that cannot host it.**

### And local mode is PERMANENT — the quick start, not a phase

> **The user, 2026-08-11:** *"but I still want to keep a quick start demo version around for people
> not interested in the server features."*

**That settles the one-client question rather than complicating it.** A demo kept *forever* is
exactly the thing that must not be a second program: a separate `editor_page.loft` would be
maintained by whoever remembered it, and this tree's most-repeated defect is *a thing built,
green, and never checked again*. **A mode of the shipping client cannot rot on its own** — it
breaks the moment the client does, loudly, in the client's own tests.

Three consequences, and none of them is optional:

1. **It is a supported configuration, so it gets a gate.** ⚠ **And it is the first gate in this
   tree that needs NO server** — every one of the 39 dials `EDITOR_PORT`. It needs a browser, not a
   port: open `_site/index.html` from `file://`, press the house keys, read the picture. **If that
   gate does not exist, the demo is broken the first week nobody opens it.**
2. **It must be complete for authoring, not crippled.** *"People not interested in the server
   features"* are not a lesser audience to be nagged toward a server — the local mode's job is to
   be the whole editor for someone who only wants to build. It says what it cannot do
   (scripts, other authors, debugging) **once, where they would look for it**, and nowhere else.
3. **Quick start means NO INSTALL.** A directory you can open, or serve with any static host —
   no loft, no toolchain, no port. ⚠ **That is a real constraint on `build-pages.mjs`**: whatever
   it emits has to work from `file://` as well as from a web server, and `fetch()` of a sibling
   file is **blocked under `file://` by CORS**. So the base tree is *inlined into the page*, not
   fetched beside it — which is exactly what routing's `build-site.mjs` already does and says why
   (*"no external .mjs → no Pages MIME surprises"*).

⚠ **POINT 3 IS A DESIGN CONSTRAINT THAT ARRIVED FROM ONE WORD.** *"Quick start"* rules out the
fetch-a-manifest shape this file proposed two sections ago, and it does so on a mechanism —
`file://` — that no amount of care would have surfaced later than the first person double-clicking
the HTML. **The assets are baked in; `http_get` stays for the attached mode.**

## The target shape

```
lavition/
  src/editor_client.loft    ← EXTENDED, not forked: one renderer, two authority modes.
                              Local mode holds an EditSession and calls `press`;
                              attached mode sends the wire message it always did.
  tools/build-pages.mjs     ← NEW. assembles _site/ — routing's build-site.mjs pattern, and
                              loft's own ide/scripts/build-base-fs.js for the base tree
  _site/                    ← the deliverable: a directory you can serve statically,
    index.html                  OR open from file:// — the quick start. ONE self-contained
                                file: the --html page, the host shim (until #851), and
                                data/parts/ INLINED as LayeredFS's base tree (see P5)
```

⚠ **`_site/index.html` IS THE SAME ARTIFACT THE SERVER SERVES.** `read_client()` already hands
`{source_dir()}/.loft/editor_client.html` to a browser at `/`. If the standalone page is a
different file, there are two pages to keep in step; if it is the same file booted differently,
there is one. **The mode is a boot decision, not a build decision.**

⚠ **`build-pages.mjs` IS A COPY OF A SCRIPT THAT EXISTS, NOT A NEW IDEA.** loft's
`ide/scripts/build-base-fs.js` already bakes a directory into `base-fs.json`, and routing's
`browser/build-site.mjs` already inlines a page and stages its data beside it. **Read both before
writing a line of it** — and if the base tree can be produced by loft's script unchanged, use it.

**Three drivers, one editor.** `editor_server` (socket → gesture), `editor_run` (script →
gesture), and the client in **local mode** (key → gesture). ⚠ **The client is the third consumer
of `hex_editor`, and that is a library argument rather than a page argument** — a library
validated against one caller has not been shown to be general, which is the extraction bar's own
clause.

⚠ **AND IT DISCHARGES A CLAUSE PLAN 19 RECORDS AS UNMET.** LAVITION_SPLIT lists *a second
consumer* as one of two genuinely open clauses, answered only by the split itself. Local mode
answers it **before** the split, in-tree, and for free: `editor_client.loft` and `editor_run.loft`
both compile against a lavition-only `lib/` today (measured, `make probe-split`), so the composed
program is **Moros-free by construction** rather than by discipline.

⚠ **IF A NEW PROGRAM IS ADDED AFTER ALL, IT GOES IN `PROGRAMS` IN `tools/layering.sh` IN THE SAME
COMMIT.** That list is what `PROGRAM_DEBT` checks, and a program missing from it is a program whose
Moros coupling nothing measures — the exact defect that guard was written for. Extending
`editor_client.loft` instead means the check already covers it, which is one more reason to.

---

## The library work

Five items. **Four are in packages that already exist and one is a new tiny package.**

### ✅ `W1` — `hex_voxel`: a world is BYTES, and a path is a wrapper — **BUILT 2026-08-11**

`world_to_bytes(w, palette, owner = 0)` / `world_from_bytes(b)`, with `world_save` and
`world_load` as thin wrappers. `make parts` byte-identical · `make lib-test` rc=0 both backends ·
`hex_voxel` 141 → 146.

⚠ **BUILT AS A SECOND ENCODER AND DIFFED BYTE FOR BYTE BEFORE THE OLD ONE WAS DELETED** — the
capture-and-diff instrument, not a round trip. And **`world_load` came out 1.6× FASTER**
(1763 ms against 2821 ms over 40 loads): one bulk byte read beats thousands of individual typed
file reads. The prediction in this file said it might be slower.

⚠ **AND ONE OF THE NEW TESTS CLAIMED SOMETHING IT DID NOT TEST.** It asserted the sign of a
negative chunk coordinate *through* `world_cell`, and deleting the sign extension left it green —
an unsigned `-1` becomes 4294967295, lands in `ck_cx`, and nothing downstream looks at it again.
**A claim tested only through a consumer is a claim about the consumer.**



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

⚠ **AND IT IS THE ITEM MOST LIKELY TO BE UNNECESSARY.** If [loft#851](https://github.com/loft-lang/loft/issues/851)
lands, a `.glb` is just a file in the base tree and `load_glb(path)` already works. **Do `W3` only
when a page actually needs a mesh and the binding has not arrived** — the house shell needs none.

### ◐ `W4` — `hex_editor::press` — the chokepoint — **BUILT, ONE OF FOUR SITES WIRED**

`press(sess, w, a, key) -> Ack` exists and owns `ArrowUp`/`ArrowDown`/`H`/`O`/`P`/`F`/`G`, plus
`grade_under` and `HOUSE_W`/`HOUSE_D`. **`editor_run`'s six-key table is deleted.** The server,
`editor_client` and `script.mjs` still carry theirs — **so this row is `◐`, not `✅`**, exactly as
the warning below says.

⚠ **THE DIVERGENCE WAS ALREADY REAL.** `H` built the house at two different heights: the server
takes the grade under the author's feet, `editor_run` took it at the **origin**. Flat ground at the
origin hid it in every fixture anyone had looked at. ⚠ **And `HOUSE_W`/`HOUSE_D` had a *third*
copy** — in `hex_editor`'s own `tests/footprint.loft`, surfaced by the name collision when the
constants moved into the library.



```
pub fn press(sess: EditSession, w: VoxelWorld, a: &Author, key: text) -> Ack
```

One place that answers *what does this key do*. `editor_run` calls it, the client in **local
mode** calls it, and `editor_server` calls it behind its wire ids — so a key cannot mean one thing
in the page and another over the wire, which is what makes the two authority modes one editor. ⚠ **`script.mjs`'s 23-entry `KEYMAP` is then a
TRANSPORT table, not a meaning table** — it may keep mapping keys to wire ids, because that is
genuinely the socket's business; what it must stop doing is deciding what the key *means*.

⚠ **THIS IS THE ONE ITEM THAT CAN BE GOT WRONG QUIETLY, AND THE FAILURE IS THE OPPOSITE OF THE
OBVIOUS ONE.** The risk is not that `press` is missed — it is that it lands as a **fifth** site
while the four survive, because each has a local reason to stay. The step is not done when `press`
exists; **it is done when the other three call it and their own tables are deleted.** That is this
tree's commonest defect (*a function written, tested green and never wired*), and it has cost an
entire phase's deliverable before. **Grep for callers before calling `W4` done.**

### `W5` — `lavition_host`: an **interim shim**, and it is scaffolding by construction

⚠ **THIS ITEM CHANGED MEANING AFTER THE FILESYSTEM CORRECTION.** It was designed as *the*
persistence layer. It is now **a stand-in for [loft#851](https://github.com/loft-lang/loft/issues/851)**
— the `fs_*` binding `--html` does not have — and its whole job is to be deleted.

```
pub fn host_ask(request: text) -> text     // host_output(request) then host_input()
```

The channel **is** bound in `--html` (measured), so this works today with no loft change: the page
asks JS to read or write a localStorage key, and JS answers. It depends on nothing but the stdlib.

⚠ **THE SEAM IS PLACED SO THE SWAP IS ONE FILE.** Everything above it calls `W1`'s bytes API;
`lavition_host` only decides *where the bytes live*. When `#851` lands, the page calls
`world_save(path)` against `LayeredFS` and this package is **deleted, not deprecated** — and
`W1` stays, because a bytes API under the path API is right on every target.

⚠ **NAME IT LAST AND GREP FIRST** — `lib/`, `../loft-libs-*/` and the registry. `hex_fit` refused
a rename at `L6.1` and that refusal was a finding. ⚠ And it is deliberately **not** a
`localStorage` package: the channel is the general thing, storage is one request on it. A package
named for one request is `moros_terrain` again.

⚠ **IF `#851` LANDS BEFORE THIS IS BUILT, SKIP `W5` ENTIRELY.** It is the one item here whose best
outcome is never existing.

### What is explicitly NOT library work

**The renderer, the mesher, the panel and the gestures.** All four already exist and already run
in the browser or already run without a server. ⚠ If this design starts growing rendering work,
the invariant has been lost — say so and stop.

---

## The persistence format, and the one decision inside it

**The target state is `LayeredFS`**: `data/parts/` is the immutable base tree, the edited world is
the delta, localStorage holds the delta, and the page just calls `world_save(path)`. That needs
[loft#851](https://github.com/loft-lang/loft/issues/851).

**The interim is the same bytes under one localStorage key**, written through `W5`. ⚠ **The two
agree on the bytes and differ only on the route**, which is the whole reason `W1` is item one:
`world_to_bytes` is what the shim carries *and* what `world_save` writes, so the switch changes
no format and no test.

⚠ **THE SIZE IS THE RISK AND IT IS NOT MEASURED YET** — `P3` below. Browsers cap localStorage at
about 5 MB per origin, and a `.hxw` grows with what has been built. **The design does not
pre-emptively shard**, because [WORLD_MODEL § `E1γ`](WORLD_MODEL.md) already makes it normative
that storage holds only what *differs* from the ground, and a house is small. ⚠ **And loft has already
priced this**: `WASM.md` puts a delta at *"typically < 50 KB"* against a 5–10 MB limit and names
IndexedDB as the fallback for binary or large trees — so if `P3` fires, the answer is the fallback
`LayeredFS` already documents, not a different design.

⚠ **AUTOSAVE ON THE EDIT CLOCK, NEVER ON A TIMER.** `w_tau` bumps once per write that changed
something, so *save when tau moved* is exact, costs nothing when idle, and is the same on any box.
A wall-clock autosave measures the machine — this tree's rule, and it has three scars from it.

---

## The probes that could falsify this, cheapest first

⚠ **Every one is a compile or a page load. None needs the design to be built**, and `P1` and `P2`
can each kill an item outright.

| | the claim | the probe | if it fires |
|---|---|---|---|
| **`P5`** | **`fetch()` of a sibling file is blocked under `file://`** — the claim that forces the assets to be INLINED rather than staged beside the page | open a two-file page from `file://` in headless Chrome and read the error | if it is NOT blocked, the assets may be staged beside `index.html` and the page gets smaller. ⚠ **Asserted from general browser behaviour and NOT yet measured here** — it is a design constraint resting on an unmeasured mechanism, which is what this table exists to stop |
| **`P1`** | a **binary** `.hxw` survives `web::http_get` intact | fetch one part in a `--html` page and compare its bytes to the file | ⚠ **Only affects the ATTACHED mode now.** Local mode inlines its assets (`P5`), so a fetch failure no longer touches the quick start |
| ✅ **`P2`** | `host_output`/`loftPush` round-trips a string from a `--html` page, and our JS can be appended to the emitted page at all | ✅ **RUN 2026-08-11 — it holds**, `make probe-p2`. Three exchanges incl. a request JS refuses; two sabotages seen red | — |
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
| ✅ ~~`P4`~~, ✅ ~~`P2`~~ | **both run, both hold.** Nothing left that can reshape the work; `P5` only decides where the assets sit | done |
| ✅ `W1` | world ⇄ bytes | **BUILT** — and 1.6× faster, not slower |
| ◐ `W4` (house keys) | `press` for the arrows, `H`, `O`, `P`, `F`, `G` | **BUILT, and `editor_run` wired.** ⏭ **Next: the server, `editor_client`, `script.mjs` — and delete their tables.** `R`/`B`/`C`/`E` (wall run, storey, cellar, step) need adapting: they do not return an `Ack` |
| `W5` **or** `#851` + autosave | whichever route is available, then save-on-`w_tau` | **this is the first testable milestone** — build a house, close the tab, reopen it |
| `W2`/`W3` + the base tree | the assets | doors and props are parts; the house shell is not |
| the rest of `W4` | every remaining key, and **delete the other three tables** | ⚠ the step is not done until they are gone |
| **the demo gate** | open `_site/index.html`, build a house, read the picture | ⚠ **NOT OPTIONAL, and it is the first gate here needing NO server.** A permanent demo with no gate is broken the first week nobody opens it |

⚠ **THE ROUTE DECISION IS DEFERRED ON PURPOSE, AND IT IS CHEAP TO DEFER** because `W1` and `W4` —
the two real pieces of work — are the same either way. **Ask [#851](https://github.com/loft-lang/loft/issues/851)
before starting `W5`**; the installed loft leads `main` here, so a binding can land inside a
session, and this tree's rule is to wait for a toolchain rather than build around it.

⚠ **THE FIRST MILESTONE IS DELIBERATELY *BUILD A HOUSE AND REOPEN THE TAB*, NOT *THE PAGE
RENDERS*.** A page that draws is not evidence — the renderer already works, so a picture would be
testing the thing that was never in doubt. **Persistence across a close is the claim the user
actually made**, and it is the one no existing gate covers.

---

## What this design deliberately does not do

- **It does not replace the server, and the server is not legacy.** It keeps the gates, the walk
  and the tick today, and it is where **script compilation, multi-player and debugging** land —
  see § *The server is not legacy*. ⚠ **A page that quietly became the only editor would take 39
  gates with it**, which is LAVITION_SPLIT's *trap* section almost word for word — and would then
  have to grow back the three things it structurally cannot host.
- **It does not put invariants in JavaScript.** `tools/build-pages.mjs` assembles files; it decides
  nothing. Every rule stays a loft test — this tree's standing division, and the reason
  `build-pages.mjs` is allowed to exist at all.
- **It does not author parts.** *No gesture can author a `FITS`* is plan 17's open gap and it is
  not this plan's.
