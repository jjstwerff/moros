# Editor Substrate — the universal hex-world editor and the libraries under it

**What we are building is not a Moros feature. It is the universal hex-world editor**, and
Moros is one of its consumers. We build the libraries, and other projects configure them
for their own worlds — a physics demo that extrudes a painted palette into geometry, a
panel inside loft's IDE, a roguelike's world builder. Moros's scene editor is one
configuration among those, not the product.

That is the load-bearing framing, because it decides every boundary below. A routine that
only makes sense for a tabletop RPG belongs in this repo's content layer; a routine any
hex-world author needs belongs in a package, even when Moros is the only caller today.

This document is the **architecture reference** for that shared layer: which packages
exist, who owns each one, who consumes them, what may cross the seam, and what may not.

---

## Why this exists

Not our framing — the stack's, stated one layer down and first. loft's `GOALS.md`:

> *"loft is not the goal. loft is the **foundation**: the lowest layer of plumbing. The real
> goal is the **libraries and tools built on top of it** — lavition (the engine), the
> hex-world library, **the editor**, the games."*
>
> *"Do the hard plumbing yourself, deeply, so someone else can just pick it up and have fun."*

The editor is one of four named layers there — *"the **editor** handles authoring, so you
shape worlds"* — beside the language, the hex-world library and the server. So this is not a
Moros feature that happens to be reusable. **It is the authoring layer of a stack that was
designed expecting it.**

**The audience is the reason.** loft's stated inversion is that today's engines are built
*by programmers, from a programmer's point of view*, and the maker has to learn that
worldview before building anything. crawler's `VISION.md` sharpens what that means for us:
the audience is not merely *fewer people*, it is **people who should not have to think like
programmers to build a world** — which is *"why the editor matters more than its line count
suggests, and why content is a folder rather than a codebase."*

**The economic argument underneath it.** A rich game world currently costs a studio, not
because the techniques are secret but because worlds are *assembled from unique assets* —
every building, tree and quest branch is somebody's week. Two people cannot hand-place a
continent. The thesis is that **variety can be produced instead of stored**, so the content
bill scales with mechanisms rather than headcount. An editor is what lets a small team drive
those mechanisms without writing code.

**And the editor earns its place twice**, because crawler's stack table lists it as *"the
second consumer that proves the libraries are general"*. A package extracted against one
caller has been shown nothing; the editor needs mutation, undo, partial views and
serialisation that the game does not, so a package satisfying both has been tested where it
would otherwise only have been asserted.

### The clause our Definition of Done was missing

> *"The acceptance test: a thing is done when picking it up is **fun**. Not feature-complete —
> fun. A library can ship every feature and still be a fight to use. That library is not
> done."* — loft `GOALS.md`

Every clause in our DoD below is correctness or testing. **A package can satisfy all of them
and still be miserable to pick up**, and by this standard that package is not finished. It is
a higher bar than anything else in this document and the hardest to gate, which is exactly
why it has to be written down rather than assumed.

The mechanism it rests on is **mental load**: every unit of attention the tools demand for
*correctness* is a unit stolen from the creative work. That is the same argument this stack
makes about content volume, made about cognitive volume — and it is the standard the editor's
own surface gets judged by, not just the libraries under it.

### One principle that decides seam arguments

> *"Over-engineer only where others build on it. The test is one question: does this make a
> hard part reusable by someone else? Yes — build it exactly and gate it, because the cost is
> paid once here and never again downstream. No — it is polish for one game, and it waits."*

That is the tie-breaker whenever "should this be exact / gated / extracted?" comes up below.

It replaces, on our side, loft's `doc/claude/lib_plans/73-universal-editor/` (the
"universal hex-world editor" plan, drafted 2026-05-27 with Moros as first partner). Moros
now owns this work; loft keeps its own state.

The **change** plans live in the tracker — see [plans/](../../plans/README.md). This file
is the durable truth, updated in place.

---

## Ground truth (verified 2026-07-22)

Four facts shape every decision below. All four are checkable, and two of them contradict
what our own docs say.

**1. The editor code exists — in loft's git history, not in this repo.** loft commit
`ade530c2` ("extract moros (#379)", 2026-06-14) deleted 66 files: `lib/moros_map`
(364-line source + 8 test files), `lib/moros_editor` (456 + 5), `lib/moros_render`
(1340 + 5 + 3 examples), `lib/moros_sim` (5 sources + 11 tests), `lib/moros_ui` (6 + 4).
Its commit message states the rule it applied — *shared → registry, game-specific → the
game's repo* — and routed "the moros-specific remainder" to **this repo**. That move never
happened; `moros/lib/` does not exist. The code is recoverable at `ade530c2^`.

**2. Four implementations agree on the hex convention; one of our documents does not.**
The deleted `moros_render.loft` computes `x = q·√3 + (r&1)·√3/2`, `z = 1.5·r` — **pointy-top,
odd-r offset, L = √3**. So does the shipped `hex_grid`, whose header calls it "the moros
convention". So does `hex_field`, which states the same centre map in exact integers and
notes it was "verified against the library before porting". So does crawler's `worldmesh`.
[SCENE_MAP.md](SCENE_MAP.md) described **flat-top** hexes until 2026-07-22, and its
N/NE/SE edge-ownership scheme was written against that reading. It has been reconciled, and
doing so turned up something worse than a label problem: reading the renderer's corner
indices, the three stored edges are **NW, NE and E**, so of the three field names
`wall_n` / `wall_ne` / `wall_se`, **only `wall_ne` is correct**. The scheme is sound —
`{NW, NE, E}` is a valid partition — but two fields have been named for edges they do not
hold.

What is **not** yet reconciled: the wall midpoint-rendering rule and the 90°-corner
argument, both derived for flat-top. The shape of each argument survives a 90° rotation,
but the axes and constants do not, and re-deriving them against the exact lattice is
[issue #3](https://github.com/jjstwerff/moros/issues/3) rather than a doc edit.

**3. `hex_grid` already shipped, from crawler.** It is homed in
`loft-lang/loft-libs-world` beside `hex_world` (chunked storage) and `hex_terrain`. Its
whole point is that lattice math is implemented **once**. `gridmesh`'s convergence table
already lists `moros_render` as an expected consumer.

**4. crawler wrote our half of the contract first.** Its `EXTRACTION.md` § *The editor as
the second consumer* (2026-07-22) treats this editor as the second consumer that makes its
own extraction honest, and fixes the terms: new routines land library-side **now**, settled
crawler modules migrate **after** its plan #11 P2, the document format is a shared exact
invariant gated on both sides, and **no two copies, ever**.

---

## The package map

Names are underscored to match the shipped `hex_*` family. Boundaries follow crawler's
split (designed against gated code) rather than the earlier guesses.

| Package | Holds | Owner | Status |
|---|---|---|---|
| `hex_grid` | lattice ↔ world, neighbours, metric, corners, canonical edges, the 12-orientation cell basis, odd-r ↔ axial bridge | loft-libs-world | **shipped** 0.1.0 |
| `hex_world` | chunked cell storage: get/set, save/load, decay | loft-libs-world | shipped 0.1.0 |
| `hex_terrain` | terrain cells: material / height / water | loft-libs-world | shipped |
| `gridmesh` | chunk-local grid → mesh, spatial index, dirty rebuilds | loft-libs-graphics | shipped |
| `graphics` | GL bindings, Canvas rasterizer, `Mesh`/`Scene`/`Material`, GLB writer | loft-libs-graphics | shipped |
| `hex_field` | the field model: cell sets, labels, heights, the tracer, the validator — **and next**, stencils and the document format | crawler | **0.1.0**, branch `feat/hex-field-skeleton` |
| `hex_ways` | tracks, offsets, junctions — roads, rails, paths | crawler | designed, not started |
| `hex_forms` | the matcher, roofs, vaults, the profile × distance table | crawler | designed, not started |
| `hex_grow` | canopy partition, crown profiles, skeleton, pipe model | crawler | designed, not started |
| `hex_props` | primitives with axes, part-lists, seats, state | crawler | designed, not started |
| `hex_scene` | field → triangles → GLB, **and** the realtime view | crawler + us | designed, not started |
| `hex_editor` | tools, undo, selection, the configuration surface — **the universal editor itself** | **us** | not started |

Dependencies flow strictly downward: `hex_grid` is leaf; `hex_editor` sits on
`hex_field` + `hex_scene` + `shapes`; only `hex_scene` knows a renderer.

**One package is missing from this table and belongs in the family.** crawler's `VISION.md`
splits what is usually lumped together as "AI": *movement over the field* — flow-field
pathing, steering, line of sight, hearing — operates on cells, blocked edges and heights, so
it is a **hex-world** concern, not a genre one. *Deciding what to do* — needs, utility
scoring, schedules — is genre-shaped and stays out. The editor wants the first half directly:
**previewing reachability is an authoring feature**, and a room you cannot walk into is a bug
the editor should show rather than the game discover.

**A consumer takes what it needs.** The editor wants `hex_field + hex_scene + hex_editor`.
A farming game wants `hex_field + hex_grow`. Nothing forces the whole stack.

The Moros-specific remainder — palettes, item and creature registries, spawn points, NPC
routines, the campaign's meaning of material 5 — **stays in this repo**. It is content,
not mechanism.

---

## Consumers, and the configurations they need

Four known consumers, and no two of them want the same editor. This is the reason the
seam rules below are rules rather than preferences — a boundary that only serves Moros
fails the second consumer, and we already know who the second, third and fourth are.

| Consumer | What it authors | The configuration it needs |
|---|---|---|
| **Moros** (this repo) | dungeons, inns, encounter maps for a tabletop campaign | a standalone browser page; palettes of materials, walls and items; spawn points and NPC routines; save to `localStorage` and JSON |
| **crawler** | the roguelike's world — the field stack's originator | no authoring UI at all; consumes the same field, format and stencils from a game process, first-person |
| **Bumper airplanes** (loft `@PLN51`) | a hex world for a projector-and-phones audience demo | a painted **palette-to-extrusion** mapping (`wall` → pillar, `wall_high` → cliff, `hill` → ramp) and nothing else — no items, no NPCs, no layers. The map *is* the physics geometry |
| **loft Workbench** (loft `@PLN16 M5e` § 9) | scenes that loft scripts drive, inside the IDE | a **panel**, not a page — driven over the IDE's one-message-one-method protocol, where the browser renders state and never computes. The model runs server-side |
| **crew_punk** (crawler `VISION.md`) | a six-player, six-phone game — the phone held flat is a console, held up is a window | **six concurrent clients**, orientation-aware phone surfaces, and a trigger engine that must be complete because *there is no director*. It will overtake crawler as the demanding consumer |

**Two consumers on orthogonal axes is far stronger evidence of generality than two similar
ones.** crawler proves the world layer; crew_punk will prove the session, network and trigger
layers; the Workbench proves the model survives being driven remotely. None of them finds the
others' gaps, which is the argument for having all of them rather than the nearest one.

The Workbench's design already reserves this seam explicitly: it declines to specify a
scene editor top-down, waits for one to emerge from a real consumer, and states that
`lib_plans/65-scriptable-scenes` is its eventual home. **We are that emergence.** What we
build is what it adopts, so its constraints are ours to satisfy now, not later.

### One program, four targets — there is no platform wall

The configurations above look like they need different builds. They do not, because loft
does not put a wall between platforms. **The same `.loft` source runs on desktop OpenGL
through `graphics`'s native cdylib and on WebGL2 through the browser bridge** —
`HTML_EXPORT.md` states it plainly, and the shader-version difference (desktop `#version
330 core` → GLSL ES 3.00) is rewritten transparently in `gl_create_shader`, because the
GLSL subset our shaders use is shared between the profiles.

| Target | What it is | Where it serves us |
|---|---|---|
| interpreter | `loft --interpret`, loading hand-written native libs | tests and quick checks |
| `--native` | a real binary in its own OpenGL window | the desktop editor, and the Workbench's game plane |
| `--html` | `wasm32-unknown-unknown` cdylib + inline JS bridge, one self-contained file, compiled WASM at native speed | the browser editor |
| `--native-android` | cross-compiled to a **signed APK**, EGL/GLES-3.0 on the native window | a native Android client |
| `--native-wasm` | `wasm32-wasip2`, full WASI | headless and server use — **not** for the browser; ~4× heavier |

So the browser editor is not a port. It is `loft --html` over the same source, with every
`gl_*` call becoming a WebGL2 import.

### Android is native, and it is already shipped

`loft --native-android prog.loft` produces a signed APK. It is not a repackaged web page: a
build target is a **descriptor over one target-agnostic core**, so an **unchanged** loft
program runs. Graphics, input and audio go through a cfg-gated Android backend — raw
EGL/GLES-3.0 on the native window, `gl_mouse_*` fed from touch events, `gl_show_keyboard()`
and `gl_key_pressed` from key events, audio via oboe/AAudio. All of it proven on an
emulator with golden images.

The line that matters most for us: **GLES 3.0 is WebGL2, so GL programs written for the
browser run unchanged.** The editor's renderer therefore reaches desktop, browser and
Android from one source.

Expect the debugging to be in **text input**, not in rendering. The Android IME path covers
key events only; NativeActivity has no text event, so *composing* text would need a
`gl_text_input()` stream API that does not exist yet. An editor asks for typed text —
naming a stencil, entering a height — so this is the seam we will meet first. It is a known
follow-up upstream, not a wall.

Prerequisites are toolchain, not code: `ANDROID_NDK_HOME`, `ANDROID_HOME`, `JAVA_HOME`, and
the program needs a `fn main`.

### macOS native is the one that costs

Apple deprecated OpenGL, so the Mac desktop path is not GL — it runs through a portable
renderer backend (wgpu → Vulkan/Metal/D3D/WebGPU). loft has that scoped as GFX.PORTABLE,
effort **H**, and its stated precondition is exactly one sentence long:

> no script reaches raw `gl_*`

**That is a rule for us today, and it is free today.** If `hex_scene` draws through the
`Renderer`/`Scene` layer rather than calling `gl_*` directly, macOS and iOS arrive as a
backend swap we do not have to work for. If it reaches for raw GL because that is the
shortest path to a triangle, we opt every consumer out of the Mac. The cost of obeying it
now is nothing; the cost of retrofitting it is the whole renderer.

**Why any of this belongs in an editor's design document:** bumper airplanes puts each
audience member's controls on their own phone while the projector shows the shared world.
An editor whose input model assumes a mouse cannot serve that — which is the second reason,
independent of the Workbench, that tools take input events rather than reading a device.
Android already routes touch into `gl_mouse_*`, so pointer input is unified for free; it is
only text that needs care.

**The one honest difference:** `--html` has no filesystem, no args and no env. Loading and
saving in the browser therefore go through the `host_output` / `loftPush` message channel to
a JS shell — loft stays pure compute and JS owns the I/O. That is a named seam of two
functions, not a platform wall, and it is the same seam the Workbench's protocol already
uses.

**A gate comes with it.** loft ships a browser render check (headless Chrome with WebGL2,
zero console errors, then a canvas screenshot that must contain enough distinct colours to
prove something was actually drawn) and states it is reusable for any browser-deployed
page. It catches the failure that matters here — compiles clean, blank canvas.

### What those configurations demand of the design

Three requirements follow directly, and each one rules out a shortcut that would otherwise
look reasonable:

1. **The editor model is host-agnostic.** `hex_editor` may not assume a browser, a DOM, a
   canvas or `localStorage`. Its tools take input events and produce edits; who collected
   the event and where the result is persisted is the host's business. Moros drives it from
   a page, the Workbench drives it over a protocol, a native window drives it directly.
   Given the target table above, this is cheap rather than aspirational: the same program
   already reaches all three, provided it does its I/O through the message channel instead
   of reaching for a filesystem that the browser build does not have.
2. **The palette is configuration, not constant.** Bumper airplanes maps a palette type to
   an extrusion rule; Moros maps a material to walkable / loud / tint. Same integers,
   different meanings, neither in the package — the opaque-ID seam, third instance.
3. **The tool set is composable, not fixed.** A consumer that wants only paint-and-height
   must not carry spawn points, NPC routines and stencil orientation. Nine tools is Moros's
   configuration of the editor, not the editor.

---

## The five seam rules

These are the rules that keep the layer shared rather than merely copied. Each has already
cost someone a mistake.

**1. Mechanism library-side, content consumer-side.** *A library's enumerations are of
mechanisms and are closed; a consumer's enumerations are of things and are open.* In:
`mesh_door(w, h, seed)`, the canopy partition, the stencil format and its rotation. Out:
the *list* of item kinds, species tables, which building gets which prop, and which
stencils exist. crawler settled this once across prop kinds, species parameters and
stencils; we inherit the answer rather than re-deriving it.

**2. The metre never travels.** Every threshold the shared stack derives is dimensionless —
hex steps or pure ratios. crawler reads one hex step as 1.5 m; Moros reads it as ≈ 1 m
N–S ([SCENE_MAP.md](SCENE_MAP.md) § Hex Geometry). Both readings are *consumer* decisions
and both stay out of the packages. A library that ships a metre has shipped somebody else's
decision.

**3. Opaque integer IDs.** Materials, items, walls and creature kinds cross the seam as
`integer`. The substrate serialises `5`; the game decodes `5` through its own palette. A
save written by Moros and loaded by crawler yields nonsense, and that is intentional —
**the substrate owns the shape, the game owns the meaning.**

**4. Multi-layer is first-class, not opt-in.** `cy` is in every cell coordinate from the
field model upward. Retrofitting a vertical axis costs more than passing `cy = 0`.

**The wall layer is split, deliberately.** `hex_field::EdgeSet` is the **authoring** layer —
a material per edge, what a stencil carries. crawler's `EdgeCollider` is the **collision**
layer — the same edge identity and storage trick, plus surface ids, passability and swept
paths. They already agree on the edge key (doubled midpoint), the canonical slot set
`{0,2,3}` and the type widths, because ours was ported from theirs, so an eventual merge is a
lift rather than a redesign. Still open, and scheduled after crawler's P5: **which layer owns
`Surfaces`.**

**Working in a shared tree has a cost, and it landed on crawler.** `loft-libs-world` `dev` is
consumed via `--lib`, which reads the *working tree*: adding `EdgeSet` / `edgeset_new` /
`edge_mat` to `hex_field` turned crawler's build red across ~38 files with no change on their
side. A five-second `grep -rl EdgeSet ../crawler/src/` would have caught it. Two rules follow —
**grep the sibling before adding a public name**, and **when a build breaks with nothing
changed locally, read the sibling's `git log` before debugging.**

**Open with crawler:** `hex_field` re-implements `hex_grid`'s lattice rather than depending
on it (`lattice_k` / `lattice_m`, `nb_q` / `nb_r`, each with a comment saying it was verified
against the library once). The two still agree — 0 disagreements over 100 cells, both
parities, both signs — but this is the same shape that cost us a year of silently displaced
negative odd rows, and the only thing between the implementations is a comment. Raised in
that package's README with the evidence and a proposal; it is their API and crawler's call.

**5. No two copies, ever.** If the editor needs something crawler has, it **moves** to the
package — it is never duplicated. Changes flow through the library repo's own gate and PR
loop, and an API change is done when **both** consumers are green.

---

## Lattice math is implemented once

`hex_grid` owns it. No package, and no part of this repo that runs loft, re-implements a
neighbour table, a corner offset or a world-position formula.

The family speaks two conventions on purpose, with `hex_grid` owning the bridge: **axial**
is the interchange and storage convention (parity-free, no `row & 1` branches in
algorithms); **odd-r offset** is the authoring and presentation convention (matches
row-major files and our documented overworld tooling). Conversion is a pure function at the
boundary.

Two invariants lock this and are test-enforced, not promised:

- **One position formula** — axial and offset forms produce bit-identical world positions.
- **Cross-language parity** — a shared fixture (sampled `(col,row) → (x,y)` pairs) is
  asserted by both `hex_grid`'s loft tests and our Python tooling, so the two
  implementations cannot drift silently.

### The lattice, concretely

`hex_field` states it in exact integers, and this is the form the editor should build
against:

```
   centre(q, r) = (k, m) = (2q + (r & 1),  3r)
   world        = (x, y) = (k · √3/2,  m / 2)
   corners      = (0, ±2), (±1, ±1)         as (Δk, Δm) from the centre
```

Cell centres satisfy `k ≡ m (mod 2)`. There is **no float in the geometry and no epsilon
compare**, which is what makes exact diff, exact undo and exact rotation possible.

Two consequences the editor inherits:

- Corners at `(0, ±2)` put a **vertex at top and bottom** and flat edges east and west —
  pointy-top, confirming fact 2 above.
- **The corner order is canonical and load-bearing.** `hex_field` orders corners so that
  consecutive indices bound one edge, matching `hex_grid::hex_corner_offset` and crawler's
  instanced floor, which is watertight only because of it. Downstream code reads corner `i`
  by index. Do not invent another ordering.

Hit-testing is already solved: `hex_at(px, py)` is the exact inverse of the centre map,
gated both to round-trip every cell of a chunk and to agree cell-for-cell with
`hex_grid::px_to_hex`.

Reconciling [SCENE_MAP.md](SCENE_MAP.md) with all of this is
[issue #3](https://github.com/jjstwerff/moros/issues/3).

---

## What the editor may rely on

The exact-integer lattice is what makes exact undo, exact diff and exact rotation possible
at all. The first four are **live in `hex_field` 0.1.0** and gated there; the fifth is
designed and lands with [issue #5](https://github.com/jjstwerff/moros/issues/5):

- cell centres **and** corners are integer lattice coordinates;
- the integer shoelace sum is a fixed multiple of the cell count — an outline and its cell
  set can never disagree;
- a 60° rotation is an **integer map**; six rotations are exactly the identity; reflection
  is exact, giving **12 orientations** with no resampling and no drift;
- the field validator's full list: loops closed · every segment a real hex edge · no
  zero-length segment · no repeated vertex · integral vertices · one outer loop, holes
  wound opposite;
- **stamping is merging two fields** — same level, nearest-wins arbitration; different
  levels, no contest at all. A stencil needs no new conflict rule.

A house stamped at 300° is the same house as at 0°, cell for cell — not a filtered
approximation of it.

**What `hex_field` 0.1.0 holds today:** `HexSet` (bounded-chunk occupancy), `Heights`,
`Labels`, the lattice and adjacency functions, `hex_at`, corner offsets, the tracer
(cells → exact integer loops), the shoelace, and `validate`. Deliberately *not* yet here:
`EdgeSet`, `Surfaces`, `Materials`, `Features`, the region cache and levels — those stay in
crawler while its kernel migration exercises them, and move once settled.

**The order the package lands in** — and therefore the order our plans run in — is stated
in its own README: **stencils first** (the first new work built *in* the package), **the
document format second** (it does not exist anywhere yet), the migrated modules last.

### The data-model question, settled by probe

`hex_field` keeps heights and labels as **parallel arrays over the same chunk window**, not
as fields on a cell struct — "most of the world is flat and should not pay for a height it
never reads". Our `Hex` packs height, material, item and three walls into one 8-byte cell.
Those look like opposite choices. [Issue #1](https://github.com/jjstwerff/moros/issues/1)
probed whether they conflict; **they do not.**

Authoring an inn ground floor in the dense model, converting to the field model and back:
material and height round-trip with **zero** differences, and the field model's own gate
passes on our authored geometry — `validate` returns 0 and `shoelace_total` is 288 for 24
cells, exactly 12 × count. Item, rotation and walls drop, but only because `EdgeSet` /
`Surfaces` / `Features` are still crawler-side; that is sequencing, not conflict.

**So: one model.** The chunked dense cell is a *storage and serialisation* concern layered
over the field model, not a rival representation of it.

Holes, disconnected sets and layers were probed too:

| case | result |
|---|---|
| **hole** (5×5 less the centre) | 2 loops, 1 outer, area identity holds — `validate = 0` |
| **disconnected** (two blocks) | 2 outer loops — **`validate = 5`**, rejected |
| **multi-layer** | `HexSet` has no `cy`; one field-set per level, each valid independently |

The middle row is a live constraint, because painting two separate rooms is ordinary
editing rather than an edge case. Note what it is *not*: the area identity still holds for
the disconnected set (96 = 12 × 8), so the geometry is sound and only the **one-outer-loop**
contract breaks. Therefore **outline and mesh generation must trace per connected
component** — that is `hex_scene`'s and `hex_editor`'s problem — while **stamping is
unaffected**, since a stencil is a field *merge* and never needs an outline. A stencil may
be disconnected.

Two facts fell out of the reverse direction, and both belong to the document format
([#4](https://github.com/jjstwerff/moros/issues/4)):

- **Fractional heights are the one real representational difference.** `Heights` is `float`;
  ours is integer units, and `12.5` truncates to `12`. Either the seam constrains heights to
  integer units or our unit becomes fractional — a design choice, not a maturity gap.
- **The documented byte widths are not enforced anywhere.** `height: u16`, `material: u8`
  are SCENE_MAP.md's specification, but the implementation stores unbounded integers:
  `70000`, `-3` and `300` all store and read back unchanged. A byte-packing writer would
  silently truncate maps the editor happily produced.

---

## The document format is the sharpest clause

A world or stencil written by the editor must load in crawler **bit-for-bit identically**.
So *round-trip = identity* is not the editor's private test — **it is the interface**. It
lives in the package with a gate that each consumer runs, and neither side may relax it
alone.

The format carries a magic marker, a schema version and explicit dimensions.
`src/realworld/region_io.loft` in crawler is the house pattern to follow. Versioning
policy: include the version; refuse an unreadably old file with an error; accept unknown
forward-compatible fields by ignoring them.

### The format, as built

Home: **`hex_field`** (`loft-libs-world`, `dev`). Magic `'HXF1'`, schema version 1, explicit
extent, then a list of **tagged sections** — `OCCU`, `HGHT`, `LABL` — each with a byte length.

Sections rather than a flags word, because a reader meeting a tag it does not know **skips it
by that length** and keeps going, so a field written by a newer consumer still loads in an
older one. A flags word cannot: an unknown bit means an array of unknown length, which is
unskippable, so the only correct response would be refusing the file. That difference is
testable, and it is tested.

Two decisions the format settles, both from [#1](https://github.com/jjstwerff/moros/issues/1):
**heights are `f64`**, so fractional heights survive and the consumer keeps its own unit;
**labels are `i32`**, because our documented `u8`/`u16` widths are not enforced anywhere and a
byte-packer built to them would silently truncate. Moros truncates a fractional height at its
own boundary, visibly, and a test pins that.

**One committed fixture is read by both consumers** —
`hex_field/tests/fixtures/canonical.hxf`, carrying a negative extent origin, a label past
`u8`, and a height both negative and fractional. Before it existed each side only ever read
files it had written itself, so both could drift together and stay green. Flipping one bit in
it turns both suites red.

Not yet carried: items, item rotation and the three wall bytes, because `EdgeSet` and
`Features` are still crawler-side. A Moros test asserts they are *absent*, so the day a
section appears that test fails and says to carry them.

This is [issue #4](https://github.com/jjstwerff/moros/issues/4), and it is gated on both
sides before either side calls it done.

---

## Per-game hooks, not per-game subclasses

The substrate exposes callbacks the game supplies; it never exposes a base type the game
extends. loft has no classical inheritance, and function-typed parameters are the natural
extensibility surface — the game's hooks stay colocated with the game's state, with no
override-discovery problem.

The hook surface starts minimum-viable and grows only when a second consumer pushes on it.
A too-rich hook struct is a maintenance burden, and every hook added speculatively is one
nobody has yet needed.

The right test for a boundary violation used to be hypothetical — *a third game built
tomorrow must not inherit Moros's choices*. It is not hypothetical any more: ask whether
**bumper airplanes** would carry the thing. It has no items, no NPCs, no layers and no
tabletop anything; it paints a palette and extrudes it. If a routine would be dead weight
there, it is Moros content wearing a library's name.

If the field model grows an `is_water(material)` helper, that is wrong — water is a
game-specific concept.

---

## Definition of Done, per package

Merges crawler's per-package DoD with loft's library checklist. A package is done when:

1. it imports no consumer — no Moros, no crawler, no content constants;
2. its gates ship with it and pass standalone in the package;
3. every derived threshold is dimensionless, with the metre interpretation documented as
   the consumer's job;
4. **a second consumer exists**, even a trivial one. A package extracted against exactly
   one caller has not been shown to be general. A ten-line example scene is enough, and it
   doubles as the docs. We are not short of candidates — crawler, bumper airplanes and the
   Workbench are all real, and each stresses a different axis;
5. the API stub (`.loft/api/<name>.api`) is committed, so the surface is readable in-tree;
6. the package README states its convention and its contract;
7. both consumers' gates are green — an API change is not done at merge, it is done when
   the last consumer is green;
8. **picking it up is fun.** The clause the other seven cannot reach — see § Why this exists.
   Not gateable by a test, which is why it is written here rather than left to taste.

Tests travel with the package. When a second consumer finds a bug, the fix and its
regression test land **in the shared package**, and the first consumer gets them for free.
That accumulation across consumers is the main return on the whole exercise.

---

## What stays out of the shared layer

- **The metre**, per seam rule 2.
- **Content enumerations** — which materials, item kinds, stencils, creatures and NPCs
  exist, per seam rule 1.
- **Moros's palettes, spawn records and NPC routines** — they encode campaign meaning.
- **The host** — our HTML shell, the three-column layout, the keyboard bindings, and where
  a map is persisted. The *page* is ours; the tools, panels and widgets it arranges are
  not. An earlier draft of this document put the whole UI layer on the Moros side of the
  line; the Workbench, which needs the panels but not our page, is what proves that wrong.

---

## See also

| Topic | Document |
|---|---|
| Map data format | [SCENE_MAP.md](SCENE_MAP.md) |
| Rendering pseudocode | [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md) |
| Editor UI design | [SCENE_EDITOR.md](SCENE_EDITOR.md) |
| Editor build plan | [SCENE_EDITOR_PLAN.md](SCENE_EDITOR_PLAN.md) |
| Our loft package designs | [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) |
| Plan conventions and the tracker | [plans/README.md](../../plans/README.md) |
| crawler's extraction contract | `../crawler/EXTRACTION.md` § *The editor as the second consumer* |
| The hex family convergence plan | `../loft-libs-world/CONVERGENCE.md` |
| The field package's own contract | `../loft-libs-world/hex_field/README.md` |
| loft library authoring + checklist | `../loft/doc/claude/LIBRARY_AUTHORING.md`, `LIBRARY_CHECKLIST.md` |
| The IDE that adopts this editor | `../loft/doc/claude/plans/16-debugger/WORKBENCH.md` § 9 |
| Its eventual canonical home in loft | `../loft/doc/claude/lib_plans/65-scriptable-scenes/README.md` |
| The audience-demo consumer | `../loft2/doc/claude/plans/51-bumper-airplanes/README.md` |
