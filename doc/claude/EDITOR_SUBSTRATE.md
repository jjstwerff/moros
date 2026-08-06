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

> ⚠ **Whose product is this?** **Moros is the tabletop RPG** — `doc/` holds its rules,
> cards, NPCs and campaign. The universal editor is **lavition**, a separate product with
> its own org, specified in `loft/doc/claude/LAVITION.md`. This document describes
> lavition's substrate; Moros is one consumer of it, and the work lives in Moros's tree for
> design reuse rather than ownership.
>
> That governs naming: packages take **descriptive `hex_*` names with no brand prefix**,
> per LAVITION.md's naming principle and its explicit anti-rename.

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

### Nothing is approximated, and nothing is lost

> *"Exact, not approximate. … Not 'within epsilon' — exactly. **Approximation accumulates;
> exactness composes.**"* — crawler's `VISION.md`

This is not a preference about numerical style. Derivation is unforgiving in a way
asset-assembly is not: place a building by hand slightly wrong and you nudge it; get a
*generator* slightly wrong and it is wrong ten thousand times, in ways nobody can see and
nobody can nudge. So there is **no situation in which a destructive approximation is
acceptable** anywhere in this substrate.

Concretely, for the editor:

- **A stencil loses nothing.** It carries cells, labels, heights, edge materials and named
  layers, and an orientation change is a **relabelling of the lattice** — so nothing has
  anywhere to go. Not "the cells survive": *everything* survives, exactly.
- **Twelve orientations, all exact.** Six 60° rotations, and the other six by a reflection
  (`k → −k`). Both are integer maps on the lattice, so a house stamped at 300° or flipped is
  the same house, cell for cell — never a filtered approximation of one. Every other grid
  pays for rotation with 90°-only placement or interpolation.
- **The twelve are twelve *placements*, and the reflected six land between the rotated six.**
  A rotation moves 60°; the flipped set interleaves and never coincides with a turn, so the
  editor can offer a twelve-position dial reading as hours on a clock
  ([SCENE_EDITOR.md](SCENE_EDITOR.md) § stencils). **Do not verify this with a symmetric
  feature.** A door in the middle of a wall is radial, sits exactly on a mirror axis, and
  collapses the twelve to six — which reads as proof that only six exist. Measured off-axis:
  twelve distinct cells on one ring, zero collisions.
- **Measure the whole thing, not the convenient part.** An edge is stored against one of its
  two cells, and for a rim edge that owner sits *outside* the extent. A count that walks only
  in-chunk cells therefore moves when the extent moves and cannot tell "the wall was lost"
  from "the wall is now owned by a halo cell". The loss-free invariant has to be stated over
  the entire layer, halo included.

> **The library kept that promise and our seam broke it** (found and fixed 2026-07-22, and
> the single most expensive mistake in this file's history to *not* have written down).
> `map_to_stencil` and both `stencil_into_map` paths read and wrote edges only for cells that
> were **occupied** — but three of the six directions store the edge against the *neighbour*,
> so the wall ringing a room is owned by the empty cell outside it. Measured on a house with
> a door: the stencil held **17 walls and stamped 8**.
>
> Nothing caught it for as long as it existed, because every stencil in the palette was
> rotationally symmetric and the loss was symmetric with them — every count agreed with every
> other count. It took **asymmetric content** to make it visible. That is the general lesson
> and it is worth more than the fix: *a symmetric test subject cannot detect a symmetric bug.*
> The same blindness produced a wrong orientation count twice on the same day, once in a probe
> and once in production code.

That last point is not hypothetical. An early version of the rotation walked the cell extent
and **dropped 8 of 18 edge slots** while the cell count never moved and every in-chunk count
looked plausible. The gate that catches it asserts the total is unchanged across all twelve
orientations, and it goes red the moment the loop is narrowed again.

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

The wall midpoint-rendering rule and the 90°-corner argument were the last two written for
flat-top; both are now **re-derived on the implemented lattice**
([issue #3](https://github.com/jjstwerff/moros/issues/3), closed). The shape of each
argument survived the 90° rotation and so, it turned out, did the one constant — `3R/4` is
`3R/4` in both readings, because a ratio measured along the rotating edge cannot change.
What changed is which axis every sentence is about: the axis-aligned edge is **E**, not N,
and the zigzag is in **y**. That is exactly why the rule was to re-derive rather than
relabel — a relabelling would have looked almost right.

Still open, and deliberately not part of #3: the three field *names*. `h_wall_n/ne/se` are
public fields of the **published** `hex_world`, mid-migration under
[#8](https://github.com/jjstwerff/moros/issues/8), so renaming them is a breaking change to
a shared contract rather than a documentation fix. `doc/Todo.txt` carries it.

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
| `hex_editor` | tools, undo, selection, the configuration surface — **the universal editor itself** | **us** | **built here**, `lib/hex_editor`, 217 tests — every gesture: walk, fall, shape, wall, opening, storey, cellar, stair, stencil |
| `hex_world` (ours) | `lib/hex_world`, 102 tests — the voxel store this editor actually runs on: chunks, layers, windowed heights, the wire encoding, known-absence | **us** | **built here** — see [WORLD_MODEL.md](WORLD_MODEL.md) |
| `moros_terrain` | `lib/moros_terrain` — the chunk mesher and its oracle (`tile_ready`), extracted as a LEAF so adding `hex_editor` to `moros_render` could not redden `moros_sim` | **us** | **built here** |

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

**The wall layer is one layer, and the split runs along the write policy** (settled
2026-07-22; library `5b4bba1`, crawler `2a72763`). There was briefly a second `EdgeSet` —
crawler's, renamed `EdgeCollider` to break a name collision — and that rename was never the
answer. Two structures with the same edge key (doubled midpoint), the same canonical slot set
`{0,2,3}` and the same type widths are one structure with two consumers, and holding them
apart guaranteed drift. Crawler deleted theirs: 51 call sites across 15 files re-pointed,
−192 lines, `edgetest` and `sweeptest` passing **unchanged**, and they now own no edge storage
at all.

The question was posed as *which layer owns `Surfaces`* and **that was the wrong axis.** The
real one is **where the write policy lives:**

> The library owns the **storage** and the surface slot. A consumer owns the **rule that
> decides what goes in it.**

`edge_set_surf` writes what it is told. First-writer-wins is
`if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site — three words longer and honest
about itself. Baking arbitration into storage would silently settle junctions for every
consumer of the library: a physics decision hidden in a data structure. `Surfaces`,
`Materials` and `Features` did stay crawler-side, but as a *consequence* of that rule rather
than as the answer to it.

**What this costs us: the layout is now a two-consumer contract.** `eg_mat` / `eg_surf` /
`eg_index` cannot change without breaking crawler's physics, so our rule *"grep the sibling
before adding a public name"* now extends to *changing an existing field*. What it buys us:
their `edgetest`/`sweeptest` gate our EdgeSet work as well as theirs, and
`edgeset_equal`/`edgeset_digest`/`edgeset_bytes` let us compare, checksum and gate the
footprint without reading the vectors — which would have made the layout contract by the back
door. `eg_index` stays **private** for that reason.

**Working in a shared tree has a cost, and it landed on crawler.** `loft-libs-world` `dev` is
consumed via `--lib`, which reads the *working tree*: adding `EdgeSet` / `edgeset_new` /
`edge_mat` to `hex_field` turned crawler's build red across ~38 files with no change on their
side. A five-second `grep -rl EdgeSet ../crawler/src/` would have caught it. Two rules follow —
**grep the sibling before adding a public name**, and **when a build breaks with nothing
changed locally, read the sibling's `git log` before debugging.**

**And a third rule, which crawler paid for three times before finding the cause** (their
`LOFT-HANDOFF.md` G4, 2026-07-22). `--lib` reads the *working tree*, but the **cdylib is
built separately** — so any sibling save between the cdylib build and our run leaves us
compiling loft-side against new source while calling an old binary. It presents as a native
crash inside an unrelated shared function, or as a compile failure with no diagnostic text at
all, and it self-heals on re-run, which is exactly what trains a reader to re-run instead of
read. Their third instance was settled by timestamps: `hex_field.loft` at 20:00:30, its
`libloft_auto_hex_field.so` at 19:59:57 — **the source was 33 seconds newer than the native
artifact.**

> A native crash or a diagnostic-free compile failure in a `--lib` sibling is a **staleness
> symptom until proven otherwise.** Compare the two mtimes *before* debugging anything:
> `ls -l --time-style=+%H:%M:%S hex_field/src/hex_field.loft
> hex_field/native-auto/libloft_auto_hex_field.so`

This applies to us directly and not by analogy: `moros_map/loft.toml` depends on `hex_field`
by **path** into that same working tree. The file-level hazard is worse than the git one
because it has no undo — two agents in one 1350-line module left it transiently uncompilable
for both consumers, with one agent's edit silently not applying. `stat -c %Y` on the file,
twice, is the whole detection.

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

[SCENE_MAP.md](SCENE_MAP.md) is reconciled with all of this
([issue #3](https://github.com/jjstwerff/moros/issues/3), closed) — section by section,
including the walls, the corners and the 12 orientations.

⚠ **The cross-language fixture is what keeps it reconciled**, and it is not a formality:
`hex_grid/tests/fixtures/lattice.tsv` is read by `hex_grid`'s loft tests *and* by moros's
`test/lattice.test.js`, and it caught a live half-hex drift the day it was written — the
browser lattice used `row % 2 === 1`, which is false for `-1` in JavaScript, so the odd-row
shift silently stopped below zero while every non-negative row agreed. The fixture holds
**integers**, not sampled `(x, y)` floats: two implementations reach the same centre by
different expression trees and can differ in the last ulp while both being right, so a
float fixture needs a tolerance — and a tolerance is where a real half-hex error hides.

---

## What the editor may rely on

The exact-integer lattice is what makes exact undo, exact diff and exact rotation possible
at all. All five are **live in `hex_field`** and gated there
([issue #5](https://github.com/jjstwerff/moros/issues/5), closed):

- cell centres **and** corners are integer lattice coordinates;
- the integer shoelace sum is a fixed multiple of the cell count — an outline and its cell
  set can never disagree;
- a 60° rotation is an **integer map**; six rotations are exactly the identity; reflection
  is exact, giving **12 orientations** with no resampling and no drift;
- the field validator's full list: loops closed · every segment a real hex edge · no
  zero-length segment · no repeated vertex · integral vertices · one outer loop, holes
  wound opposite;
- **stamping is merging two fields**, and a stencil needs no new conflict rule — but ⚠ the
  merge is **order-free only in occupancy**. Two stencils overlapping at the same level
  union their cells whichever way round they are stamped, and their *payload* is
  last-writer-wins: stamped both ways with different labels and heights on the shared
  cells, six labels and six heights came out different. The design sentence here said
  "nearest-wins arbitration … deterministically and order-freely"; the measurement refuted
  the order-freedom half, and full order-freedom was never the rule anyone wants — it would
  make "place this on top of that" impossible, which is the one thing a stamp is for.
  Both halves are gated in `hex_field/tests/04-stencil.loft`, the refuted half included, so
  a future arbitration rule cannot land silently.

⚠ **And the test that looked like it covered this did not.**
`test_two_stamps_at_different_places_are_order_free` reads like the strong claim; its last
line asserts the two stamps did **not** overlap. A name can describe the claim while the
body tests the weaker case beside it.

**Un-stamp is the inverse, on free ground only.** `stencil_unstamp_all` clears exactly what
`stencil_stamp_all` wrote, back to the values a fresh field holds — cells, heights, labels,
named layers and the walls including the rim. It cannot restore what the stamp *covered*,
because a stamp destroys that and the previous value is never kept: true undo over occupied
ground needs a snapshot, not an un-stamp.

A house stamped at 300° is the same house as at 0°, cell for cell — not a filtered
approximation of it.

**What `hex_field` 0.1.0 holds today:** `HexSet` (bounded-chunk occupancy), `Heights`,
`Labels`, the lattice and adjacency functions, `hex_at`, corner offsets, the tracer
(cells → exact integer loops), the shoelace, and `validate`. **`EdgeSet` has since arrived**
(2026-07-22) and is now the *only* edge storage either consumer has. Still crawler-side, and
deliberately so under the write-policy rule above: `Surfaces`, `Materials`, `Features`, the
region cache and levels.

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
cells, exactly 12 × count. Item, rotation and walls dropped at the time, but only for
sequencing reasons, not conflicting ones. **Walls no longer drop through stencils** —
`EdgeSet` landed in `hex_field`, `map_to_stencil` carries them, and item and rotation ride
named integer layers.

> **They still drop through the document format, and the tripwire that was supposed to catch
> that is green for the wrong reason.** `map_write_field` calls the cells/heights/labels form
> of `doc_write` and never builds an `EdgeSet`, so walls are gone before `hex_field` sees the
> file. `test_items_and_walls_do_not_survive_yet` was written to fail *"the day a section
> appears, and tell us to carry them"* — the section **has** appeared (`hex_field`'s
> `test_walls_survive_the_document_format`, plus a committed wall fixture we already read in
> `test_moros_reads_the_walled_fixture`) and the test stayed green, because it watches our
> round trip rather than the format's capability. It cannot fail while our own writer is the
> thing dropping the data. Open work, and it matters more than it did: a save we write is a
> file crawler could read.

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

> ⚠ **THE ARGUMENT STANDS; ITS ANCHOR IS SUPERSEDED.** `HEX_STACK.md` §6 is the authority on
> persistence and it moved this contract from `HXF1` to the **store** — because a window is
> derived (`I2`), and because **the editor never used `HXF1`**: there is no `.hxf` file
> anywhere in the tree, everything on disk is `.hxw`, and `doc_write`/`doc_read` has one
> caller, `lib/moros_map`, already labelled a predecessor. Read the mechanism below — magic
> marker, schema version, tagged sections skippable by length, one canonical fixture, a gate
> on both sides — as what was kept in full. Read `HXF1` and the `f64` heights as what was not.
> [PARTS.md](PARTS.md) §P2 is what consumes it now.

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

## The ownership audit — every public name, adjudicated (2026-07-26)

A re-verification over the **actual** public surface of `lib/moros_*`, not from memory. The
question for each name: is it *this game*, or is it editor/world logic any game would need?

**The headline is uncomfortable and worth stating first.** Of roughly 150 public names across
five packages, **the great majority are general** — the `moros_*` packages are a universal
editor with a thin moros configuration layered on, and the package names say the opposite.
That gap is the substrate's whole reason for existing, but it is currently a claim in this
document rather than a fact about the tree.

### Genuinely Moros — the short list

| what | why it stays |
|---|---|
| `MaterialDef` / `WallDef` / `ItemDef` **contents** | `md_swimmable`, `md_stair_kind`, `wd_body: "BATTLEMENT"` are this game's semantics. The *table mechanism* is the library's; the *fields* are ours (the contract's opaque-palette rule) |
| `SpawnPoint`, `NpcRoutine`, `NpcWaypoint` and their fns | game state, not world state (`L15`). Already excluded from the world file |
| `builtin_flat` / `house_small` / `spiral_stair` / `house_door` | content, authored in this game's idiom |
| `dev_art_color`, `material_swatch` | Moros's developer-art palette |
| `stencil_palette_*`, the tool set, `palette_items_for_tool` | *configuration* of the editor, which is what a consumer is supposed to supply |
| everything in `doc/` | rules, cards, NPCs, campaign, places |

### General — grouped by the home the design already names

| group | names | home |
|---|---|---|
| world model | `Hex` `Chunk` `Map` `HexAddress`, `map_empty/get_hex/set_hex/paint_material/set_height/place_item/set_wall/set_wall_dir/ensure_chunk/has_chunk`, the palette *mechanism* (`map_add_*`, `map_*_def`, `map_has_*`, `map_palette_gap`, `absent_*`) | **`hex_world`** (#8) |
| lattice | `hex_distance`, `hex_to_world`, `world_to_hex`, `hex_corner_world`, `chunk_idx_32`, `hex_idx_32`, the 12-position facing clock (`dir_hour`, `facing_*`, `hour_*`) | **`hex_grid`** |
| documents | `map_read_field`, `map_write_field`, `map_to_stencil`, `stencil_into_map*`, `stencil_placed` | **`hex_field`** |
| collision | `blocked_by_wall`, `wall_value_on_edge`, `edge_direction`, `resolve_move`, `floor_y_at` | **`hex_edge`** |
| mesh + cull | `build_hex_meshes`, `emit_*` (box, cylinder, walls, all three stair kinds), `Aabb`, `aabb_*`, `view_cone`, `flag_occluders`, `mesh_aabb`, `scene_*_count`, `stair_step_count` | **`gridmesh`** / `mesh3d` |
| terrain shaping | `slope_path`, `slope_band` | **`hex_terrain`** |
| export | `map_export_glb` | **`glb`** |
| **undo** | `UndoStack`, `UndoEntry`, `EditKind`, `undo_push/pop`, `redo`, `batch_*`, every `*_with_undo` | ⚠ **no home yet** — universal to editors, belongs to the editor substrate |
| **camera** | `RenderCamera`, `CameraMode`, `camera_*`, `apply_mouse_look`, `camera_ray_dir`, `pick_hex`, `ray_plane_y_intersect` | ⚠ **no home yet** |
| input | `InputState`, `input_*`, `keys_pressed_since` | **`input`** — ⚠ *ships already* (`loft-libs-game`, registry `input-0.2.0`). A convergence, not a homeless group |
| **tools + editor loop** | `ToolState`, `ToolKind`, `tool_apply`, `EditorState`, `editor_tick`, `edit_at_hex`, `editor_load/save_to_file` | ⚠ **no home yet** — the editor library itself (#7) |
| **UI widgets** | `Rect`, `Button`, `ListBox`, `Panel`, `StatusStrip`, `panel_*`, `rect_*`, `list_rect`, `text_*`, `*_rect`, `route_click`, `editor_click`, `UiHit` | ⚠ **no home yet** |
| character | `Player`, `player_step`, `avatar_mesh`, `emit_player_avatar`, `avatar_add_to_scene` | the single-player part we own; `hex_body` for the rig |

**Four groups have no home**, and they are the substance of the editor rather than of the
world: undo, camera, the tool/editor loop, and UI widgets. Input is not among them —
`loft-libs-game` ships `input`, so it converges rather than moving. `#7` is where they land,
and this audit is the list `#7` should work from.

### ⚠ One finding the audit turned up

**Game state is packed inside the voxel.** `hex_spawn_flag` and `hex_waypoint_flag` read
bits 5 and 6 of `h_item_rotation`:

```loft
pub fn hex_spawn_flag(h: Hex)    -> boolean { (h.h_item_rotation >> 5) & 1 == 1 }
pub fn hex_waypoint_flag(h: Hex) -> boolean { (h.h_item_rotation >> 6) & 1 == 1 }
```

A spawn point is game state, not world state — `L15` says so and `WORLD_MODEL.md` excludes
spawns from the world file explicitly. Yet two bits of the storage of record hold exactly
that, which is the same violation the crystal's `c_age` would have been if it had been let
in. It is the cheaper kind to fix now than after worlds exist, and it belongs to `#8`'s V1.

## The target grouping — five packages, none of them extracted yet

*(user, 2026-07-26: "design groups for the remaining code, we do not push them directly into
libraries that is a step I want to take when the code in these is actually battle tested")*

The audit says what is general. This says what shape it takes **while it stays here**. Groups
are designed now so that extraction is later a *move*, not a redesign — and each is sized to
be exactly one future library, so the question at extraction time is "has this earned it?"
rather than "what is this?".

### Why the current cut is wrong

The existing packages cut **across** the groups rather than along them. `moros_sim` alone
holds character movement, the editor loop, tool dispatch, camera control and input — four
groups in one package. `moros_render` holds camera, culling, mesh emission and Moros's
developer-art palette. A group that is a quarter of one package and a third of another cannot
be extracted, tested in isolation, or given a second consumer, which is why the regrouping
comes before any extraction rather than after.

### The five groups

| group | owns | must not own | depends on |
|---|---|---|---|
| **world** | the voxel, columns, chunks, the window, the routine, the file, the palette *mechanism*, the guards | what a material *means*; anything that draws or collides | lattice |
| **edit** | undo, redo, batches, `EditKind`, tools and their dispatch, the editor loop and its state | which tools exist (that is configuration) | world |
| **view** | camera model and modes, picking, ray casts, frustum/occluder culling (input comes from the shipped `input` library) | what a scene contains, and **what counts as an occluder** | lattice, world |
| **ui** | rectangles, buttons, list boxes, panels, status strips, layout, hit-testing, click routing | what the buttons *do* | nothing |
| **actor** | the player, movement integration, collision resolution against the world, the avatar rig | AI, goals, NPC behaviour (crawler's) | world, lattice |

**`ui` depends on nothing**, which makes it the most obviously extractable and the best first
test of the extraction bar. **`world` depends only on lattice**, which is why it is `#8` and
leads.

### ⚠ The convergences are blocked on coordination, not on work

*(established 2026-07-27)*

Every remaining convergence needs an edit to a tree that is **not ours**, and loft has now
written the symmetric half of the two-agent boundary down: *"edit only this repo"* — their
agents are usually working in those checkouts at the same time, so a staged file or a
`git checkout` lands in someone else's uncommitted work.

So these are **asks, not tasks**, and each names exactly what it needs:

| convergence | the ask | of whom |
|---|---|---|
| `chunk_idx_32` / `hex_idx_32` | add them to `hex_grid` (floor-division, both signs) and delete the copies | `loft-libs-world` |
| dirty tracking | ours is a second `ChunkField`; adopt `gridmesh`'s or agree the shape | `loft-libs-graphics` |
| `input` | adopt the shipped `input 0.2.0` and delete our `InputState` | ours, once `view` exists |
| the crystal's model | migrate `hex_world` onto the voxel; `P14` proves it fits | `loft-libs-world` |

**Three copies of the chunk arithmetic exist right now** — public in the sibling `hex_world`,
private in `moros_map`, and local in ours — and ours is written down as deliberately the
third rather than hidden. That is the honest state: the duplication is visible, its
destination is agreed, and the move waits on the tree that owns the destination.

⚠ **And a hazard worth carrying, which we caused.** `loft test` inside a package is not
read-only: it rebuilds `native-auto/`, writes `.loft/` caches, and a file-writing test
writes into the package's own directory. One of ours deleted a tracked file during loft's
H9 work. Our test scratch is now gitignored and named distinctly, but the rule is the one
loft names: **build a reproducer in a scratchpad package pointing at their libs by path**,
never inside their checkout.

### Convergences — code that gets no local group

Some of the general code already has a shipped home. It does not become a group; it becomes a
**dependency**, once the duplication is resolved:

| code | goes to | status |
|---|---|---|
| `chunk_idx_32`, `hex_idx_32`, `hex_distance`, world↔hex, corners, the facing clock | `hex_grid` | duplicated *today* — two copies, one public in `hex_world` written to prevent the other |
| documents, stencils | `hex_field` | already a dependency; the wall/EdgeSet bridge is the remaining gap |
| mesh emission, dirty rebuilds, LOD | `gridmesh` | `LIBRARY-CANDIDATES` row 7 — ours is a second dirty-tracker and must converge |
| wall/edge collision | `hex_edge` | its stated purpose |
| slope shaping | `hex_terrain` | authored shaping beside generated |
| GLB export | `glb` | already exists |

**Building a local group for any of these would be the competing-library mistake**, in the
small. The rule holds at function granularity, not just at package granularity.

### The camera's occlusion class — decided now, because walls are coming

The camera avoids terrain today. Walls will obstruct just as completely, so the rule
needs stating before `#10` (fences) and `#12` (houses) land, or each will improvise one.

**The discriminator is not "does it block movement".** A fence blocks a character and is
visually almost nothing; avoiding it would make the camera lurch every time you walk beside
a paddock. Nor is it "is it terrain" — a castle wall is not terrain and obstructs totally.

**The discriminator is whether the camera can be INSIDE it**, because that is the failure
worth preventing: a volume you are inside fills the entire screen, while a thing you merely
see past costs a fraction of the frame. Moros already carries the classification —
`WallDef.wd_body`:

| body | camera |
|---|---|
| `SOLID`, `THICK_FLAT`, `THICK_CURVED` | **avoid** — a volume with an interior |
| `FENCE`, `BATTLEMENT`, `ROAD_GUIDE` | **ignore** — see past it |
| every dressing layer | **ignore** — `D1`, they do not even collide |

⚠ **But `view` must not learn what `BATTLEMENT` means.** That is Moros's semantics, and the
audit above puts `WallDef`'s contents firmly on the consumer's side. So the seam is a
**predicate the consumer supplies** — *is this wall index view-blocking?* — with the library
owning the query and the traversal and the consumer owning the answer. The same shape as the
opaque palette in the world contract, and for the same reason.

### The `view` group's camera contract

Formal, because the failure it prevents is an accessibility one rather than a cosmetic one:
a camera inside geometry fills the entire screen, and for players sensitive to that it makes
a game unplayable rather than untidy. Written in the same shape as the world contract, and
resting on its **Q1** — a camera can only promise something about the surface if there is
one surface to promise about.

**Notation.** `p` the pivot; `ψ` requested pitch; `ψ̂` rendered pitch; `b` boom length;
`B` its resting length; `E` the eye; `S(x,z)` the surface (**Q1**); `∇S` its gradient;
`c` the required perpendicular clearance; `L` the lookahead; `ω` the measured yaw rate.

| # | rule | |
|---|---|---|
| **CAM1** | **The eye is never inside.** `E.y ≥ S(E) + c·√(1+‖∇S‖²)` — always, unconditionally | the guarantee |
| **CAM2** | **The angle never snaps.** `\|dψ̂/dt\| ≤ RATE` and `0 ≤ ψ̂ − ψ ≤ GIVE` | |
| **CAM3** | **Rest is the player's intent.** With no obstruction, `ψ̂ → ψ` and `b → B` | |
| **CAM4** | **The constraint is the worst over the arc about to be occupied**, sampled over `[−ARC, ARC] ∪ [0, ω·L]` | prediction |
| **CAM5** | **Only terrain and volumes block.** Thin and non-colliding things are ignored (§ occlusion class) | |

⚠ **CAM1 is unconditional and therefore never smoothed.** Every other rule may lag; this one
may not, because a smoothed guarantee is not a guarantee. It is the backstop, and it is
instant by design.

#### The timeliness theorem — when the smoothing is free

The tension is that **CAM1** wants instant correction and **CAM2/CAM3** want none. The
prediction resolves it, and the condition is checkable rather than a matter of taste.

> **Claim.** Let the boom approach its target by a fraction `k` of the gap per second, let
> `R` be the largest correction the terrain demands (`B − b_min`), and let `ε` be the
> tolerance. If
> ```
>     ln(R/ε) / k  ≤  L
> ```
> then the boom reaches its constraint before the constraint arrives, and **CAM1**'s backstop
> never fires.

*Sketch.* Under exponential approach the residual gap after `t` is `R·e^{−kt}`; it falls
below `ε` at `t = ln(R/ε)/k`. **CAM4** supplies the constraint `L` seconds early, so the
correction is complete on arrival whenever that time fits inside `L`. ∎

Currently `R ≈ 4.4`, `ε = 0.1`, `k = 12`, `L = 0.55`: `ln(44)/12 ≈ 0.31 ≤ 0.55`. It holds
with roughly 1.8× margin, **and that margin is the thing to watch** — raising `B`, steepening
terrain, or lowering `k` for a softer feel all eat it, and the symptom of eating it all is
the backstop firing, which is visible as exactly the snap the smoothing was meant to remove.

**Observed in use (2026-07-26):** dragging the mouse freely around a character beside steep
authored hills no longer reaches the inside-the-world state at all. That is the case the
automated orbit check *cannot* reach — it teleports between yaws, so it exercises **CAM1**'s
backstop and never **CAM4**'s prediction — so hand-dragging is currently the only evidence
the lookahead works at the rates a player actually produces. Evidence, not proof: it says the
margin is adequate for one person on one terrain, which is exactly the claim the theorem
above makes checkable rather than anecdotal.

**Where the theorem does not reach**, stated so it is not mistaken for a proof of safety:
it assumes `ω` predicts the next `L` seconds. An abrupt reversal points the lookahead the
wrong way, and only the fixed `±ARC` term covers that — which is why **CAM4** carries a
constant arc as well as a predicted one, and why **CAM1** exists at all.

#### Gates

| rule | gate | control |
|---|---|---|
| **CAM1** | orbit a full turn beside a steep cone → eye above the surface at every yaw | ⚠ measure against the **nearest** drawn vertex; a max-within-radius estimator reads uphill and reports failures that are its own |
| **CAM2** | drag hard → per-tick `Δψ̂` never exceeds `RATE·dt` | — |
| **CAM3** | walk clear of everything → `ψ̂ = ψ` and `b = B` within a second | — |
| **CAM4** | approach an obstruction at speed → the boom is already short on arrival | disable the lookahead → the backstop fires |
| **CAM5** | put a fence between eye and character → the camera does not move | swap it for a solid wall → it does |

⚠ The **CAM1** control is not incidental. An earlier measurement of exactly this reported
14 of 24 yaws failing; the camera was correct and the estimator was reading the highest
vertex within 0.9 wu, which on a 3:1 slope overstates the ground by metres.

### The extraction bar, per group

A group leaves this tree when **all four** hold. Three of them are cheap to check continuously;
the fourth is the one that actually takes time, and is why extraction waits.

1. **It builds and its gates pass with the Moros tree absent.** Checkable from day one — if a
   gate reaches for a Moros type or fixture, the boundary has already been crossed.
2. **Its dependencies point only outward** — at loft's stdlib, `hex_grid`, or another group
   below it. No group depends on `edit`, `view`, `ui` or Moros content.
3. **It has been battle-tested** — used in anger, through a real rung of the ladder, long
   enough for its shape to stop moving. A package whose API changed last week is a package
   still being designed.
4. **It has a second consumer**, or a concrete one waiting. The DoD clause already says a
   package validated against exactly one caller has not been shown to be general. `world` has
   the crystal (`#8` V8); `ui` and `view` do not yet have one, and naming who they would serve
   is part of earning the move.

### Build beside, do not migrate

A group whose target shape is already specified is **written fresh alongside** the code it
will replace, not refactored out of it. The old package stays green and in service until the
new one supersedes it.

The reason is that the existing packages are at *predecessors* of their target designs, not
merely in the wrong place — `moros_map`'s chunks are keyed one-layer-per-chunk with game
state packed inside the voxel. Reshaping such code means carrying its compromises forward or
clearing them as side-quests; writing beside it means the new package never has them.

**Being in one tree is for design reuse, not code reuse.** A month of settled decisions —
the scene model, stencils, the palette rule, the facing clock, the document format — is why
this work happens here rather than in a fresh repository. hexbody's lesson was that leaving
early costs you the *back-references*; it was never that the code had to travel.

⚠ **Clause 3 is the whole reason for this section.** hexbody was extracted from crawler early
and needed repeated back-references for data it had left behind. The cost of extracting late
is a rename; the cost of extracting early is a seam that has to be renegotiated while both
sides are moving.

### Naming — descriptive, never brand-prefixed

⚠ **An earlier version of this section said the groups "keep a Moros-owned prefix until
they leave". That was wrong, and it contradicted a governing document.**
`loft/doc/claude/LAVITION.md` settles naming for the whole stack:

> **`use X;` in `.loft` scripts — descriptive only, NO brand prefix.**
> *Anti-rename:* don't add brand prefixes to data libraries — `use hex_world;` is cleaner
> and more portable than `use lavition_hex_world;`, which would falsely imply engine
> coupling.

And the brand in question was the wrong one anyway. **Moros is the tabletop RPG**; the
universal editor is **lavition**, its own product with its own org. A general package named
`moros_*` claims a game that is merely one of its consumers.

So the groups take **descriptive names in the `hex_*` family**, matching the inventory
`LAVITION.md` already publishes for `loft-libs-world` — where `hex_world` is the hex-grid
world-data axis, exactly what plan 8 builds. The package is `hex_world` from the first
commit; there is no rename pending and never was.

**Living in Moros's tree is design reuse, not ownership** (see *Build beside*). What keeps
that honest is not the name but `tests/boundary.loft`, which fails if the package gains a
`moros_*` dependency or grows any identifier the ownership audit put on the consumer's
side — clause 1 of the extraction bar, checkable today.

⚠ **THIS FILE CARRIED TWO COPIES OF THE THREE SECTIONS ABOVE, AND THEY DISAGREED.** The
second copy — *the extraction bar*, *build beside*, and a *"Naming, while they are here"*
that said the groups **keep a `moros_*` prefix until they leave** — sat 60 lines below this
one, so a reader scrolling met the correction first and the refuted version second, with
nothing marking which was which. Removed 2026-08-06. What the refuted copy argued is already
recorded in the paragraph above; the duplicate is gone, and the correction is not.

## The editor server has its own world model — and that is the design failure (2026-07-30)

> ⚠ **Superseded in part by [`HEX_STACK.md`](HEX_STACK.md)**, which is now the single authority for
> the stack's *design*. This section's findings stand; its conclusions about the document format,
> `f64` heights, and the store⇄window "adapter with a commit half" do not. `HEX_STACK.md` §2 lists
> every superseded claim. This document keeps the seam rules, the five groups, the per-package
> Definition of Done and the ownership audits.

The ownership audit above adjudicated `lib/moros_*`. It never looked at
**`src/editor_server.loft`**, which is 4,238 lines, 89 functions, and a `main()` of 1,228
lines carrying 30 message handlers inline. Auditing it now turns up something sharper than
"the editor reimplemented some routines".

### The libraries are pure primitives over a TILE BUNDLE. The editor is a COLUMN STORE.

Every writer in the `hex_*` stack targets the same five value types — verified by signature,
not by name:

```
stencil_stamp_all(dst: HexSet, dst_h: Heights, dst_l: Labels, dst_y: Layers, dst_e: EdgeSet,
                  st: Stencil, aq, ar)
way_stamp(t: Track, halfwidth: float, s: HexSet, e: EdgeSet, first_surf, mat)
draw_floor(p: Plan, cells: HexSet, types: Labels, floor_type) -> integer
sweep_path(e: EdgeSet, x0, y0, x1, y1) -> (float, integer, integer, integer)
```

**`HexSet + Heights + Labels + Layers + EdgeSet`** — the bundle. `hex_field` even owns its
document format (`doc_write_all` / `doc_read`, `HXF_MAGIC` / `HXF_SCHEMA`). And a grep for
`World` across every sibling package returns **only `hex_world`'s own accessors**: not one
primitive in `hex_terrain`, `hex_way`, `hex_field`, `hex_draw`, `hex_edge`, `hex_form`,
`hex_shape`, `hex_place`, `hex_roof`, `hex_fit` or `hex_recover` takes a store.

The editor is built on `lib/hex_world`'s **column store** — `World / Chunk / Column / Layer /
StoredHex`, reached through `world_column`, `world_set_column`, `world_set_dressing`,
`world_snapshot`. A different representation of the same subject.

So the editor **cannot call the library stack at all.** `stencil_stamp_all`, `way_stamp`,
`draw_floor`, `sweep_path` do not speak `World`. That is why `stencil_place`, `road_stamp`,
`chunk_mesh_mat` and `walk_to` exist inside the server: not because someone was lazy, but
because **choosing a second representation forfeited every primitive written against the
first.** The duplication is a symptom. The representation split is the defect.

⚠ **`lib/hex_world` is moros-only, and it squats a published name.** Corrected 2026-07-30,
after checking rather than assuming — an earlier draft of this section called the model choice
a blocking phase 0, and that was wrong.

| | types | lines / files | consumers, everywhere |
|---|---|---|---|
| `lib/hex_world` v0.1.0 (the editor's) | `Hex StoredHex Layer Chunk ChunkAt World Column ColumnWrite Snapshot …` | 1,199 / 1 | **`src/editor_server.loft`. That is all.** |
| published `hex_world` 0.1.1 / 0.1.2 / **0.2.0** | `Cell Chunk World` | 1,161 / 3 | its own tests, plus one loft multilib fixture |

Three facts settle it:

1. **The moros copy matches no published version** — not 0.1.1, 0.1.2 or 0.2.0. It is not a
   fork that drifted; it is a *different library wearing the same name*. It was renamed from
   `moros_world` on 2026-07-26 for a good reason (LAVITION.md forbids brand prefixes) — into a
   name a published package already owned with an incompatible model. It can never publish
   under `hex_world`.
2. **No sibling library imports `hex_world` at all**, and **no published package depends on
   it.** The `hex_*` stack is built on the tile bundle, not on a store. So the published
   `hex_world` is not the stack's foundation either — it is an independent store with no users.
3. **It is not declared as a dependency anywhere.** The editor picks it up purely through
   `--lib lib/` path shadowing.

So the model question is **not** blocking, because nothing in the stack consumes a `World` of
either shape: the adapter below has to bridge whichever store the editor keeps, and the
published `hex_world` is simply irrelevant to that path. What remains is a **name** collision,
and it is cheap — one consumer, one `use` line. Phase 0 is a rename, not an architecture
decision.

### The published `hex_world` is a demo grid. The column model is the general one.

Read rather than inferred — the published package's own header:

> *"sparse 32x32-chunk world data model shared by TTT v5 … and the audience-generative-art
> demo … with a slimmer 4-byte Cell (no separate Hex struct, no per-cell layer, no editor
> metadata)"*, `Cell { c_color: u8, c_height: u8, c_age: u16 }`, **single-layer**.

That is not the editor's world and was never meant to be. It has no layers, no material
palette, no dressing, no edit clock, no versioning. The column model has all of them and a
normative contract in `WORLD_MODEL.md`. **They are two different concerns wearing one name** —
which is the same failure as the representation split, one level up, at the package.

**So `lib/hex_world` is in the wrong place, and the reason is the principle rather than the
collision: libraries here are general, and a general library does not live inside one
consumer.** `lib/` should hold only this game's *configuration*; the ownership audit above
already says the great majority of `lib/moros_*` public names are general too, so
`hex_world` is the clearest case of a broader move, not a special one.

Two facts make it cheap: it has **one consumer** and **one `use` line**, and the mechanism
already exists in this tree — `lib/moros_sim/loft.toml` depends on a sibling by path
(`hex_body = { path = "../../../loft-libs-world/hex_body" }`).

⚠ **The name is the one open decision, and it is not mine to take.** The column store needs a
descriptive, brand-free name in `../loft-libs-world/`; `hex_world` is held by the demo grid,
which is *published* (0.1.1 / 0.1.2 / 0.2.0) and lives in another agent's tree. Options, with
the trade-off stated rather than resolved:

| option | cost |
|---|---|
| column store takes a new name (`hex_store` matches this document's own vocabulary — "the store" against "the bundle") | two libraries still both sound like "the world" |
| column store supersedes `hex_world`; the demo grid narrows to what it is | touches a published package in another tree — but it has **zero dependents**, so the cost is coordination, not breakage |

Whichever is chosen, phase 0 is a **move plus a rename**, still one call site.

### What we already have — the primitives, by what they operate on

Nothing below needs writing. This is the list any new code must be checked against first.

| role | package | primitives |
|---|---|---|
| **occupancy / heights / labels / layers / edges** | `hex_field` | `hexset_*`, `heights_*`, `height_set/get`, `labels_*`, `label_set/get`, `layers_*`, `layer_add/set/get/set_at/get_at`, `edgeset_*`, `edge_set_mat/surf/both`, `edge_mat/surf`, `edge_key` |
| **stencils** (place a shape) | `hex_field` | `stencil_from`, `stencil_stamp`, `stencil_stamp_layers`, `stencil_stamp_all`, `stencil_stamp_edges`, `stencil_rotate`, `stencil_mirror`, `stencil_rotate_deg` |
| **discs, circles, rings** | `hex_field`, `hex_shape` | `form_hexdisk`, `hexdisk_into`, `form_circle`, `form_octagon`, `box_fill`, `box_ring_in/out`, `arc_fill`, `line_hexes` |
| **ways** (roads, tracks) | `hex_way` | `track_new/straight/arc`, `track_offset`, `offset_legal`, `way_stamp`, `way_mark`, `way_steps`, `track_distance`, `seg_param`, `way_param`, `cut_arb` |
| **terrain generation** | `hex_terrain` | `terrain_new`, `terrain_fbm`, `terrain_vnoise`, `terrain_ridge_at`, `terrain_detail_at`, `terrain_hydrology`, `terrain_relief_pass`, `terrain_surface_at`, `terrain_lake_field`, `terrain_water_at`, `terrain_rivers`, `terrain_sample`, `terrain_blend_h` |
| **buildings** | `hex_draw`, `hex_roof` | `draw_floor`, `draw_walls`, `place_opening`, `grow_ring`, `draw_roof`, `surface_*`, `roof_cone/ridge/hip/dome`, `vault_*`, `clear_height`, `eave_spread` |
| **shape algebra** | `hex_form` | `form_new/write/canon/read/eq`, `form_closes`, `form_admissible`, `form_fill`, `plan_holds`, `plan_to_world/local`, `side_edges`, `tri_cells`, `hexagon_cells`, `rhombus_cells` |
| **walls, snapping** | `hex_shape` | `wall_new`, `wall_snap_p`, `snap_run_d24`, `snap_run_p`, `wall_run_ok`, `wall_separates`, `wall_offset_signed`, `wall_chain_ends`, `flood_outside`, `leak_count`, `set_connected` |
| **collision, sight** | `hex_edge` | `sweep_path`, `collide`, `passable`, `edge_block`, `edge_blocked`, `edges_cut/solid/halfplane`, **`sight_clear`**, `surfaces_*`, `materials_*`, `junctions_*`, `features_*` |
| **placement / seating** | `hex_place` | `field_union`, `combine_cut`, `combine_cut_level`, `kappa_at_level`, `seat_height/residual/write`, `pose_*`, `disk_hit`, `arb_solid/owner` |
| **refusal with a reason** | `hex_fit` | `fit_reason`, `mat_fits`, `level_fits`, `seat_fits`, `height_units`, `feature_fits`, `arc_fits`, `draft_*` |
| **lattice math** | `hex_grid` | `hex_to_px`, `px_to_hex`, `hex_round`, `hex_neighbor`, `hex_distance`, `hex_corner_px`, `hex_edge_corners`, `hex_canon_edge`, `cell_*` |
| **validation / recovery** | `hex_field`, `hex_recover` | `trace`, `validate`, `shoelace2`, `wall_count`, `edgeset_digest`, `rebuild*`, `field_digest`, `field_exact`, `field_norm` |
| **rigs** | `hex_body` | `rig_*`, `joint_*`, `bone_obb`, `pose_of`, `wheel_value/angle/skid` |
| **the bundle's file format** | `hex_field` | `doc_write`, `doc_write_all`, `doc_read` |
| **the store** (a separate concern) | `hex_world` | `world_new`, `world_column`, `world_set_column`, `world_set_dressing`, `world_cell`, `world_snapshot`, `world_save/load`, `world_chunk_version`, `world_is_stale` |

### What is only in the editor, adjudicated

**Dies — a library primitive over the bundle already does it.** Every one of these is the
editor's private answer to a question the stack already answers:

| editor | replaced by |
|---|---|
| `stencil_place` | `stencil_stamp_all` |
| `road_lay`, `road_stamp` | `track_straight` + `track_offset` + `way_stamp` |
| `snap_heading` | `snap_run_d24` / `snap_run_p` |
| `fence_disc`, `fence_count` | `hexdisk_into` + `edge_set_mat` + `wall_count` / `edgeset_count` |
| `field_fill` | `flood_outside` + `trace` + `validate` |
| `walk_to`, `stand_clear` | `sweep_path`, `sight_clear`, `edge_blocked` |
| `edges_around`, `edge_owner`, `wall_of`, `wall_set` | `edge_key`, `edge_set_mat`, `edge_mat` |
| `corner_heights`, `cell_normal`, `emit_hex_sloped`, `emit_tri`, `chunk_mesh_mat`, `chunk_mesh_props`, `emit_wall_panel`, `emit_run_wall` | `hex_draw` `surface_*` + `draw_floor/walls/roof` |
| `roof_height` | `roof_cone` / `roof_hip` / `clear_height` |
| `fit_ok`, `fit_ordinal`, `fit_nominal`, `fit_text`, `probe_fit` | `hex_fit` — `fit_reason`, `mat_fits`, `level_fits` |
| `storey_add` | `combine_cut_level` + `seat_write` |
| `terrain_h`, `terrain_y`, `terrain_set` | `Heights` + `world_column` |
| `col_top`, `col_low`, `col_top_index` | `hex_world` accessors |
| `cam_free_dist`, `cam_free_arc`, `cam_clear_at` | `sight_clear` (the solve itself is the homeless *camera* group) |

**Genuinely missing — must be ADDED to a library, and validated there.** Four items, and the
first is the whole design:

1. **The `World` ⇄ bundle adapter.** One pair: read a window of the store into
   `(HexSet, Heights, Labels, Layers, EdgeSet)`, and commit a bundle back. Nothing else new
   is needed to make the entire stack reachable. It is missing because the two `hex_world`s
   diverged, so no one owns the seam.
2. **`brush`** — an *authored* relief dome. `hex_terrain` has noise, fbm, ridges, hydrology
   and lakes, but no authoring brush. This is the primitive whose absence produced the
   raise-origin defect fixed on 2026-07-30: as `raise_at(bundle, q, r, amp, rad)` the cell is
   an argument and the bug is unrepresentable.
3. **`scatter`** — density scatter over a disc.
4. **The camera solve** — already recorded above as a group with *"no home yet"*.

**Survives in the editor, because it is genuinely the adapter:** `main`'s parse and dispatch,
the wire encoders (`mesh_wire`, `mat_wire`, `frame_wire`, `fog_wire`, `ramp_wire`),
`read_index` / `read_client` / `hostname` / `build_id`, the dirty set (`mark_dirty*`,
`chunk_within`, `chunk_in_range`), and `world_path` / `new_world`.

### How the editor uses the libraries, once the adapter exists

Every tool becomes the same three lines, and the editor owns none of the middle one:

```
band   = world_window(wld, q0, r0, w, h)     // adapter: store  → bundle
<library primitive(s) on band>               // hex_field / hex_way / hex_draw / …
world_commit(wld, band, dirty)               // adapter: bundle → store, marks chunks
```

A **procedural generator** is the same composition with the first and last lines replaced by
`hexset_new(...)` and `doc_write_all(...)` — no server, no socket, no tick, no clock. That is
the capability being asked for, and it falls out of the adapter rather than needing a
generator framework.

### Five documents disagree about where things go. Reconciling them is the design.

⚠ **An earlier draft of this section invented a six-phase order of its own.** That was the
same error as the code it describes — building a parallel structure beside one that exists.
The placement authorities, and what each says:

| authority | says |
|---|---|
| `LAVITION.md` § Hex-family | `hex_world` = **the addressing primitive** (grid, chunked storage, save/load). Then `hex_walls`, `hex_terrain`, `hex_items` |
| `LAVITION.md` § Next library work | **W.3** split `hex_walls`; **W.5** implement `hex_terrain`; **W.7** implement `hex_items` — all open |
| `lib_plans/73-universal-editor` | L1 `hex_grid`, L2 **`hex_map`**, L3 `hex_render`, L4 `hex_stencil`, L5 `hex_editor`, L6 `hex_entity` |
| `loft-libs-world/CONVERGENCE.md` | layering `hex_grid` → `hex_world` + `gridmesh` → `hex_walls` + `hex_terrain` → consumers; **axial is storage, odd-r is authoring, `hex_grid` owns the bridge** |
| `loft-libs-world/README.md` | `hex_world` ✅ shipped; `hex_walls` / `hex_terrain` / `hex_items` planned |
| **the tree itself** | **14 packages**, ten of which appear in none of the above: `hex_field` `hex_form` `hex_shape` `hex_fit` `hex_recover` `hex_draw` `hex_edge` `hex_place` `hex_roof` `hex_way` `hex_body` |

**Where they conflict, shipped code with tests wins over a plan sketch.** Plan 73's L2
`hex_map` was realised as `hex_field` (windowed `HexSet`/`Heights`/`Labels`/`Layers`/`EdgeSet`),
its L4 `hex_stencil` as `hex_field`'s `Stencil`, and its L3 `hex_render` as `hex_draw`. `W.3`'s
`hex_walls` arrived as `hex_edge` + `hex_shape`, `W.7`'s `hex_items` as `hex_place`. Those
steps are **done under other names**, and the roadmaps have not caught up.

### ⚠ Four representations of the map now exist. That is the blocking decision.

| representation | where | shape |
|---|---|---|
| `Cell {color, height, age}` single-layer | published `hex_world` 0.1–0.2 | demo grid (TTT, art) |
| `HexCell {material, height, item, walls, rotation}` + `cy` layers | plan 73 L2 sketch | never built |
| `HexSet + Heights + Labels + Layers + EdgeSet`, windowed | **`hex_field`, shipped, tested** | the stack's actual basis |
| `Column / Layer / StoredHex`, chunked, absolute heights, palette, edit clock | **moros `lib/hex_world`** | the editor's, with `WORLD_MODEL.md` as its contract |

**Nothing can be *translated* before its target shape is chosen**, so this is the one decision
that gates the rest. The two live candidates are `hex_field`'s bundle and the column store;
the other two have no consumers. This audit does not choose — but it records that
`hex_field` is what every library primitive already writes into, and the column store is what
one consumer uses.

### The translation table — and most rows are ASKS, not tasks

This document's standing rules bind the migration, and the earlier draft broke both:

- **Build beside, do not migrate.** The old package stays green until the new one supersedes
  it. Existing packages are *predecessors* of their target designs, so reshaping carries their
  compromises forward.
- **Cross-tree edits are asks.** `loft-libs-world` is another agent's working tree; a staged
  file lands in someone else's uncommitted work. *"Asks, not tasks"* is already this
  document's phrase, and the convergence table already carries the relevant row: **"migrate
  `hex_world` onto the voxel; `P14` proves it fits — of `loft-libs-world`."**

| what is misplaced | proper place | operation | ours, or an ask? |
|---|---|---|---|
| `lib/hex_world` — the column store | the **`world`** group ([#8](https://github.com/jjstwerff/moros/issues/8)), which this document already says *leads* | **build beside**, under a brand-free name that is not `hex_world` (taken, by the demo grid) | **ours** — one consumer, one `use` line |
| the published `hex_world`'s `Cell` | onto the voxel | translate | **ask** of `loft-libs-world` — already recorded, `P14` is the proof |
| `wall.loft` inside published `hex_world` | `hex_edge` / `hex_shape` (where `W.3` actually landed) | move | **ask** |
| `editor_server.loft`'s duplicate primitives | the packages named in *"What is only in the editor"* above | **delete** once reachable — they are not moved, they are superseded | ours |
| `editor_server.loft`'s `brush`, `scatter` | `hex_terrain` (`W.5`) / `hex_field` | build beside, then ask to adopt | ours to build, ask to land |
| the camera solve | the **`view`** group | build beside | ours |
| three copies of `chunk_idx_32` | `hex_grid` | delete two | **ask** — already in the convergence table |
| `lib/moros_*` general names | `world` / `edit` / `view` / `ui` / `actor` | per the ownership audit above | ours |

### Order — in the numbering that already exists

No new phase numbers. The sequence the existing documents already imply:

1. **Choose the canonical map representation** (the four-way table above). Blocks everything.
2. **`hex_grid` 0.2.0 — the axial↔offset bridge** (CONVERGENCE step 1). Independent, and the
   rule *"lattice math is implemented once"* is what retires our third copy of the chunk
   arithmetic.
3. **The `world` group, built beside** (#8, which leads). This is where `lib/hex_world` goes,
   and it is the first thing that is entirely ours.
4. **The store ⇄ bundle adapter**, in whichever package owns the chosen representation. Until
   it exists the editor cannot call one library primitive, and after it exists a procedural
   generator is the same composition minus the socket.
5. **Supersede the editor's duplicates**, one tool at a time — stencil first, since
   `stencil_stamp_all` is the closest fit. Each deletion is proved by a gate that does not
   change and a library test that is new.
6. **Raise the asks** for the rows above that are not ours.

### Two rules this design exists to enforce

1. **No new routine, package, or phase number without checking what exists.** `lib/*/src`,
   `../loft-libs-world/*/src`, `LAVITION.md`, `CONVERGENCE.md`, plan 73. This document's own
   author broke it three times in one session: `climb.mjs` grew a hand-written arc-length
   interpolation while `hex_way` already had `track_distance` / `seg_param` / `way_param`;
   four gates re-derive `√3` cell centres that `hex_grid::hex_to_px` provides; and the first
   draft of this section invented a six-phase order beside `W.3`–`W.8` and `L1`–`L6`.
2. **A primitive is validated where it lives.** A `.mjs` gate proves the *wire* still exposes
   a feature; it must never be the only place the feature is checked. Structural claims are
   pure loft tests — the only way to test them without a clock.

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

## Why the camera solve is in the server, and why that stops being true

**It is there because the client is JavaScript, not because the server is the right home.**
`html/editor.html` stated the rule at the top — the file is gone (2026-08-02, superseded by
the wasm client) and **the sentence outlived it**, which is why it is quoted here rather than
left in a deleted file: *"The client DRAWS. It does not model … If a computation about the
world ever appears below this line, the seam has been broken."* That
rule is sound and was never about the camera — it is about **not writing a second
implementation of the model in a second language**. The server is simply the only place
loft ran.

A **wasm client** dissolves the premise: the same loft code runs in the browser, so
client-side no longer means JavaScript-side. And once that is true, three things say the
camera belongs there:

1. **It is per-viewer, and nothing else in the tick is.** The code already records the
   consequence — the camera frame *"cannot join the broadcast: it is solved per client from
   that client's aspect"*. Every other frame is shared; this one is N solves for N viewers,
   on one core.
2. **It is latency-bound.** A boom that gives way to a wall should respond at the viewer's
   frame rate, not after a round trip and a 30 Hz tick. Mouse-look through a network hop is
   the oldest bad feel in the book.
3. **It is what the cost measurement said.** One watching client cost ~100% of a core, all
   of it camera: eleven solves a tick × 14 samples × 5 terrain reads. Gating it on its
   inputs took that to 0% — but the shape is unchanged. It is O(clients) on the server and
   O(1) on each client.

**What would have to move with it:** `cam_free_dist` / `cam_free_arc` / `cam_pitch_target` /
`cam_clear_at` all query `terrain_y`, so the client needs the height field. It already
receives the geometry it draws, so the question is whether it queries the meshes it holds or
keeps a light copy of the columns in view — a real design question, and the first one #7
(`hex_editor`) has to answer about its client.

**And the server need not be in the building.** This is the strongest of the four and the
one the others only hint at: the editor is routinely driven over an ssh tunnel from off the
LAN — that is how it is being used today — so a camera solved server-side puts *the whole
internet* inside a mouse-drag. The wire makes it worse than one round trip: `3:<dx>,<dy>`
travels, waits for the server's next 30 Hz tick, and the `C:` matrix travels back, so the
floor is RTT plus up to 33 ms of tick quantisation, every drag, for ever.

That reframes it from an optimisation to a **requirement about feel**, in the same class as
the occlusion rule already recorded here: a camera that lags its input is not a slow camera,
it is a camera you cannot aim. Nobody tunes their way out of a round trip.

⚠ **And it forces one real design point.** A drag is BOTH things at once — it turns the
character (world state, must reach the server) and it moves the camera (a view, must never
leave the machine). So the client applies the look immediately and *reports the facing*;
the server owns where the character ends up, the client owns what you see while getting
there. Any design that sends pixels and waits for a matrix has put the seam in the wrong
place, whatever language the client is written in.

## The seam, stated once: the world stays, the view goes

> **The route is [plan #16](../../plans/16-client-split/DESIGN.md)** — voxels cached and
> meshed in the client, then the camera, in steps that each ship and are each gated on the
> two paths being measured equal before one is deleted.

Most of a game built on this runs in **wasm/loft on the client** — but **the world modelling
routines stay in the server**, and that is not a compromise between the two positions, it is
the line itself:

| server | client (wasm/loft) |
|---|---|
| the voxel store, and every write to it | the camera solve, and the look |
| `K-FIT` refusals, `F1`/`P1`/`E1e` — the rules an author meets | drawing, and what is drawn from |
| persistence, the edit clock, who is allowed to change what | input, and how it feels |
| the walk, integrated on a fixed tick (`L7`) | everything that must answer at frame rate |

The test for which side a routine belongs on is not "is it expensive" or "does it touch the
world". It is **who is allowed to disagree**. Two viewers may hold different cameras and
nothing is wrong; two viewers holding different ground is a corrupted world. So the state of
record has exactly one home, and everything derived from it for one pair of eyes has as many
homes as there are eyes.

**What the client needs is a read-only view, not a second model.** It already receives the
geometry it draws; the occlusion query runs against that. And because both sides are loft,
the client can `use hex_world` and read the same structures the server writes — the thing
the JavaScript seam made impossible, and the reason the camera ended up server-side to begin
with. Sharing the CODE is not sharing the AUTHORITY: the client reads a snapshot, the server
owns the clock.

**What must NOT move:** the walk. Movement integrates on the server's fixed tick because
that is what makes it reproducible from an input log (`L7`), and a client that solves its
own position is a client that can disagree with the world. The seam is *the camera is a
view, the walk is the world* — and stated that way it is obvious which side each belongs on.

⚠ Until that client exists this stays where it is, gated on its inputs. The gating is not a
substitute for the move; it is what makes the current shape affordable while the move is
still #7's to make.
