<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# PARTS — a house drawn away from the world, and the things it is made of

*(user, 2026-08-02: "design that I can draw a house separate from the world to stencil into
it, and that it allows me to design doors, door-frames, windows, window-frames, statues,
pillars, that can be placed in the world or used in other houses")*

Plan [#17](https://github.com/jjstwerff/moros/issues/17). **Design only** — nothing here is
built yet. This doc holds the decisions; **the order of work is in
[the plan](../../plans/17-parts/README.md)**, step by step with its gates.

**What this replaces.** `hex_editor::stencil_place` is a *procedural* house: a radius, a
`roof_height(anchor, roof_up, rad, d)` curve, two materials. The only house that can be
stencilled is the one written in loft, so "design a house" is not a thing the editor can do —
it is a thing you do by editing `gesture.loft`. Everything below exists to make the stencil an
**authored document** instead.

---

## The eight decisions

Stated as calls with their trade-off, because that is cheaper to argue with than a survey.

### P1 — A part IS a world

Not a new document type, not a second editor, not a second renderer: a part is a **small
`hex_world` store** and you edit it with the gestures that already exist. Opening a part
*is* loading a world; the terrain is empty and the camera starts at the anchor.

> **The trade-off, taken deliberately.** A dedicated part editor could offer a cleaner
> abstraction — snapping, symmetry, a parts palette that knows about door widths. It would
> also be a second implementation of walls, roofs, openings, the walker, the camera and the
> save format, and this tree already has one session's worth of evidence about what a second
> copy costs. Everything the part editor would add can be added to *the* editor as a mode.

Consequences that fall out for free: a part renders in the same shader, saves in the same
format, is verified by the same gates, and **a house can be opened as a part** — which is
what makes "start from that cottage and change the roof" possible without a feature.

### P2 — A part is saved the way a world is saved, because it IS one

⚠ **Corrected against [HEX_STACK](HEX_STACK.md), which is the single authority — the first
draft of this section had it wrong.** It said parts extend `hex_field`'s `HXF1`. But **there is
no `.hxf` file anywhere in this tree**: everything on disk is `.hxw`, and the only caller of
`doc_write`/`doc_read` is `lib/moros_map`, the package already labelled a predecessor of its
target design. `HXF1` is crawler's interchange, not ours, and designing on it would have had
`A1` build a reader for a format nothing here writes.

The right answer is the simpler one, and it falls straight out of §P1: **a part is a world, so
it is saved by `world_save` into the store format.** No second writer, no second reader, no
conversion — and the round-trip test a part needs is the one the world already has.

What a part adds is *sections*, and the discipline for those is what `EDITOR_SUBSTRATE` argued
for and `HEX_STACK` §6 re-anchored — kept in full, moved to the store:

| section | carries |
|---|---|
| `PART` | kind (`house` · `frame` · `leaf` · `prop` · `fitting`), name, author-facing description |
| `ANCH` | the anchor cell, the anchor height, and the **facing** — one of the 24 headings the editor already uses |
| `SOCK` | the sockets this part OFFERS (§P3) |
| `FITS` | the sockets this part CAN BE PLACED INTO |
| `INST` | parts placed inside this part (§P4) — this is what makes a house a composition |
| `MESH` | for prop parts: the `.glb` payload, or a reference to one (§P5) |

⚠ **Tagged, each with a byte length, so an unknown tag is SKIPPED rather than fatal.** That is
the property worth carrying across from the `HXF1` argument, and worth restating: a flags word
cannot do it, because an unknown bit means an array of unknown length, which is unskippable —
so the only correct response would be refusing the file. Sections let a part written by a newer
editor still load in an older one, and that difference is testable.

#### The mechanism, as built (`A1.3`, 2026-08-03)

`tag(i32) + length(i32) + bytes`, repeated **to end of file**, after the last layer's CRC.
`hex_world` owns the framing and never the content — the same deal the palette already has.
A section rides on the world (`w_sections`), so `world_save`/`world_load` carry it with no
consumer doing anything, which is what makes an *unknown* section survive at all.

⚠ **THE TERMINATOR IS END-OF-FILE, AND THAT IS THE WHOLE BACKWARD-COMPATIBILITY ARGUMENT.**
A section *count* has to live somewhere, and every place it can live is a byte a pre-section
file does not have. End-of-file is the one terminator such a file already satisfies — so no
version bump, and a reader that predates sections stops at the final CRC and never learns the
trailing bytes are there. `lib/hex_world/tests/sections.loft` pins it with **committed
pre-section bytes** (`presection.hxw`), the one fixture in the suite that cannot be
regenerated into agreement with the code.

⚠ **A tag packs LEAST-significant byte first**, so `PART` appears as `PART` in a hex dump —
the only reason a tag is four characters rather than a number. `section_tag("WTTH") ==
WORLD_MAGIC` is the cross-check, and it is what caught the packing being the wrong way round.
It also caught something older: **every `.hxw` in the tree opens `57 54 54 48` — `WTTH`** —
while the constant's comment claimed `'HXW7'`, a string no file has ever contained. The value
is not corrected; every saved world carries it. `hex_field`'s `HXF1`/`OCCU`/`HGHT` had the
convention right all along.

⚠ **`world_save_incremental` rewrites the section block whole and cuts the file to length.**
A section's size is not fixed by the shape `same_shape` compares, so an in-place update that
skipped it would leave a shorter world's tail in place — bytes that load cleanly and say
something untrue. Gated in **both** directions, because only the *shrink* leaves a readable
remnant.

A malformed tail is refused by name (`WL_SECTION`) rather than read as a plausible section:
fewer than eight bytes left for a header, or a length running past the end of the file.

#### `PART` and `ANCH`, as built (`A1.4`, 2026-08-03)

`lib/hex_part/src/meta.loft`. ⚠ **The split is the point**: `hex_world` owns the framing and
knows nothing about kinds or anchors; `hex_part` owns the content and knows nothing about
where the bytes end up. A store that knew what `PART` meant would be a store with an opinion
about its consumers.

Both payloads are **`key=value` text**, not packed integers. Text reads in a hex dump — the
same argument the four-character tag is made of — and `"12x" as i32?` is null rather than `12`,
so a malformed number refuses instead of guessing.

⚠ **A THIRD REASON WAS GIVEN AND IT WAS FALSE**, which is left standing because it decided the
shape: *"a section is bytes and loft cannot rebuild a text from bytes"*. Measured 2026-08-03,
`text_from_bytes` and `byte_at` had shipped **two releases before** the report
([#748](https://github.com/loft-lang/loft/issues/748)) — they were absent from the *generated*
stdlib reference, which is what was swept. **Grep the source, never the generated reference,
before calling a capability missing.**

✅ **AND THE MECHANISM IT BOUGHT IS GONE (2026-08-03, evening).** `hex_world::Section` briefly
carried a text view read a *second time* off the file, plus an `sc_is_text` write flag and
`world_set_section_text`. All three are removed: a section is `sc_tag` + `sc_bytes` and nothing
else, the store decodes nothing, and `lib/hex_part/src/codec.loft` — **two lines each way** —
is what a consumer uses. That two lines is the measure of how much the store was carrying for
its consumers.

⚠ **`sc_bytes` is `vector<u8>`, and the type is doing real work.** *Each byte is a byte* used
to be a `WS_SECTION` code returned by a save that had already run; the element type now refuses
it at the literal — `world_set_section(w, tag, [1, 300])` is
`error: cannot implicitly narrow integer to u8`. It is also what makes a consumer's
`text_from_bytes(s.sc_bytes)` correct: that builtin accepts a `vector<integer>` **silently**
and reads its 8-byte elements as bytes ([#751](https://github.com/loft-lang/loft/issues/751)),
so `[72, 105]` decodes to `H` and a space.

| | |
|---|---|
| `PART` | `kind=` one of the five · `name=` · `desc=` |
| `ANCH` | `q=` · `r=` · `h=` · `facing=` one of the 24 headings |

⚠ **A newline is refused, not stripped** — `name=x\nkind=1` would forge a line and rewrite the
kind. ⚠ **Absent and malformed are different answers** (`MR_ABSENT` / `MR_MALFORMED`): a part
from an older editor has no `ANCH` and is fine, while one whose `ANCH` says `facing=north` is
damaged, and one code for both makes a part that stands the wrong way round look normal.

⚠ **The test subject is `"porte café"`, described as `"a door, 2 = boards wide 中"`, and that
one choice found three defects an ASCII name agrees with**: two loft panics where byte offsets
meet character counts ([#749](https://github.com/loft-lang/loft/issues/749) — **fixed
2026-08-03**, though the units stay mixed by design and a lint now says so), a parse that
splits on every `=` and truncates the description, and a byte-per-character encoding that
returns `中` as a different character.

#### The first part on disk (`A2.1`, 2026-08-03)

`data/parts/house/cottage.hxw`, built by `make parts` — `src/part_build.loft` runs
`stencil_place` once into an **empty** world (no ground: a part is the house, not the hillside
it stood on), cuts it with `part_from_region`, dresses it with `PART`/`ANCH` and saves. The
file is **committed**, because a part is content rather than a build artifact.

⚠ **The tool VERIFIES what it wrote and asserts rather than printing**, so a broken part stops
the build: it reloads the file, compares through `part_diff`, reads `PART` and `ANCH` back, and
**counts the edges** — 35 walls and 1 door, read out of the file, because `part_diff` compares
heights and materials and would pass a cut that dropped every wall.

⚠ **A PART CROSSES FOUR CHUNKS WHATEVER ITS SIZE**, because it is origin-centred and
`chunk_of(-1)` is `−1`. The cottage is **65,928 bytes and uses 38 of 8,192 cell slots**. That
is `P6`'s dense 8 KB layer meeting a consumer it was not shaped for; §P2's keyed-read deferral
(`A7.4`) is where it is decided, and the tool prints the number every run so it cannot go
stale.

#### Putting it back (`A2.2`, 2026-08-03)

`hex_part::part_stamp` is the inverse of the cut — `un_origin` translates each part column onto
the world in the doubled lattice, `lifted` adds the anchor to every height, and each column
goes down as a band through the same `world_merge_band_as` the procedural stencil uses.
`hex_editor::part_place` is the thin gesture over it, adding only `stencil_floor(anchor)` —
the placement policy, which is a choice about buildings and now has **two** callers, so it is
a function rather than two copies of `anchor − FOUNDATION` clamped to the reserve.

⚠ **THE AUTHORED HOUSE IS THE PROCEDURAL HOUSE, AND THAT IS STATEABLE EXACTLY.** The step
expected a picture comparison; the two paths turn out to produce **the same world** — same
cells, same three owned edges, same layer labels, same `w_next_id`, same `w_tau` — on flat
ground, on a slope the band cuts into, and under a ceiling that refuses both. So the claim
lives in `lib/hex_editor/tests/part_place.loft` rather than in a browser gate: a label is
invisible to every renderer, and `τ` catches a path that wrote every column twice and
photographed identically.

⚠ **The extent is the part's own**, walked from its chunks, never a radius the caller passes —
and the server's dirty halo comes from that same extent, or anything larger than the built-in
house would have its rim left undrawn.

#### One placement path (`A2.3`, 2026-08-03)

`stencil_place` still says what a house IS and no longer says where one goes. `14:<roof_up>`
calls `stencil_part`, which builds into a **scratch world at anchor 0**, cuts with
`part_from_region`, and hands the result to `part_place`. Every house that reaches a real
world — generated from the procedure or loaded from `data/parts/` — arrives through the same
code.

⚠ **The procedure keeps its PARAMETER, and that is why it keeps existing.** A part has one
fixed roof; `14:<roof_up>` has a continuous one, and three gates depend on it —
`doorstep.mjs`'s ordinal-refusal control is literally the roof fence. Retiring the parameter
would have deleted claims to make a plan sentence true. A procedure that *generates* parts and
a library that *stores* them are different capabilities, not two implementations of one; what
they must not have is two ways to put a house in the world.

⚠ **A stamp reports what the band LEFT ALONE** (`ps_below` / `ps_above`) and **which rule
refused** (`ps_fit`, the store's own `CW_*`). Both exist because the wire already said them:
`kept B below and A above` is the difference between a band and a replace, and `-10 - cw_code`
distinguishes a fold from a breached reserve. A gesture that moved and got quieter would have
passed every world comparison there is.

⚠ **And a part library wants KEYED reads — the other half of `HEX_STACK` §6.** A world written
as a persisted collection with a `.dschema` sidecar can be read by key, and a catalogue of two
hundred parts must load *one* part, not the catalogue. Today `.hxw` has no sidecar because it
was never written as a collection, so `A1` either lands after that changes or accepts
whole-file reads and says so. It is the same finding arriving from a second direction, which is
usually the sign it is the real one.

### P3 — Composition is by SOCKET, never by coordinate

This is the decision that answers *"used in other houses"*. A door does not go "at cell
(3,-2) rotated 60°" — it goes **in a door-frame**. So:

```
socket  = name · cell · edge-or-heading · kind · size-class
```

A door-frame **offers** `socket "leaf" @ door/2x3`. A door leaf **fits** `door/2x3`. A porch
offers `socket "column-1..4" @ pillar/round-3`. A niche offers `statue/plinth-2`.

Placement into a socket is a *check*, and its refusal is the shape this editor already uses
everywhere — **ok, reason, offer, residual**. A leaf too wide for the frame is refused with
the frame's actual size and the nearest leaf that fits, not silently scaled.

> **Why not just coordinates.** Coordinates make a door-frame and a door two independent
> objects that happen to be near each other, so moving the frame leaves the door behind and
> nothing notices. They also make "does this door fit that frame" unanswerable before
> placement, which is exactly the question an author asks. A socket is the *joint*, and a
> joint is a thing you can test.

⚠ **A socket is not a hole.** `hex_draw::place_opening(plan, cells, edges, side, t, nedges,
kind)` already cuts the opening in the wall; the socket is the *contract at that opening*.
Conflating them is how `F-HOLE` went wrong in [FITTINGS](FITTINGS.md) — an opening became an
edge material and then nothing could be hung in it.

### P4 — An instance is a reference, and its cells are DERIVED AND ANONYMOUS

The world stores, per placement: **part id · cell · heading · socket bindings**. That record
is the authority. The cells are **derived** from it, and they carry **no identity of their
own**.

This is the [HEX_STACK](HEX_STACK.md) invariant applied literally — *the store is the only
authority, everything else is derived, writes go in place* — and it buys the thing the user
asked for last: **edit the part, and every house containing it changes.**

⚠ **THIS SECTION SAID "A LAYER THAT CARRIES THE INSTANCE'S OWN LABEL" UNTIL `A3.2` MEASURED
IT.** The correction is worth more than the sentence was. If the record is the authority, then
re-deriving is **regeneration** — discard the derived cells for a region and rebuild them from
the `INST` list — and never lookup. Nothing asks *which cells belong to instance 7*, so
nothing needs a name for them. An instance's identity is **its position in the list**, which
is exactly what `A3.1` said when it refused an identity field in the record.

⚠ **AND THE LABEL COULD NOT HAVE CARRIED IT ANYWAY.** A layer is a per-chunk **sheet with one
cell per column**, so placements at distinct columns share one layer whatever their heights.
Measured on one chunk of ground: **30 placements → +1 layer, 2 distinct labels, `w_tau` 30**,
staggering the heights by 10 changed nothing. Twenty-nine of the thirty had no label of their
own, and a label-per-instance design would have called that a defect and gone hunting for a
`hex_world` change to force new layers — at 8 KB each, to name something that needs no name.
What DOES cost a layer is vertical overlap in one column: **8 stacked placements → +8 layers,
64 KB.** So storage tracks stacking and `w_tau` tracks placements, and the two are independent.

**`bake` is the operation that needs a label**, and it still mints one. It flattens an
instance to plain cells and *destroys the record*, so afterwards there is no authority left
and the label is the only handle on what was carved. `expand` keeps the record, which outranks
the cells. ⚠ `part_stamp` reported a label the store had not kept — `ps_label: 2` while the
only layer carried `1`, because a chunk's first terrain layer is the outdoors and takes
`LABEL_GROUND`. It now reads the label back and reports `0` with `ps_ground` set. `A3.1`'s
seam test missed it because its fixture builds two layers per chunk.

**No incremental re-derivation** is intended: a part edit rebuilds the region from its records
rather than patching the cells of one instance. That is the decision this section rests on, and
if a scene ever grows large enough to need the patching kind, the identity question reopens.

⚠ **`bake` stays, and it is not the truth.** Flattening an instance to plain cells is needed
for export, for interop, and for the moment an author wants to *stop* tracking a part and
just carve it. So it is an operation — and the equivalence

```
expand(instance)  ==  bake(instance)
```

is the strongest test in this design, because the two paths share nothing but the part.

### P5 — Two kinds of part, one mechanism

|  | cell part | prop part |
|---|---|---|
| examples | house, wall, door-frame, window-frame, stair, arch | statue, pillar, finial, sign, bracket |
| stored as | cells in the part's `hex_world` | a `.glb` in a DRESSING layer |
| already exists | `stencil_place`, the whole gesture set | `MSG_PROP` (19), `MSG_IMPORT` (21), `MSG_EXPORT` (22) |
| collides / is walked on | yes — it is terrain | no, unless it carries a cell footprint too |

A part may be **both**: a pillar that is a `.glb` for the eye and a one-cell column for the
walker. Sockets do not care which it is, which is the point of putting the socket on the part
rather than on the cells.

> **Why a statue is not just an import.** `21:` already imports a `.glb`. What it cannot do
> is *be placed in a niche*, *be listed in a library*, *be swapped for another statue that
> fits the same plinth*, or *carry a name an author chose*. Those are all `PART` and `SOCK`,
> and they are the difference between an import and a part.

⚠ **ALL FOUR ARE BUILT AND THE THIRD ONE COST NOTHING** — `A6.3`'s swap needed **no new code**,
because a binding names a part and stores no position, so *swap this for that* is one field.
`data/parts/prop/` carries a standing figure and a seated one that declare the same `FITS`; the
shrine expands bound to each, and the placement differs in `ma_mesh` and in nothing else.

⚠ **BUILT AT `A6.1`/`A6.2`, AND THE TABLE'S SECOND COLUMN IS NOW MEASURED RATHER THAN PLANNED.**
*"a `.glb` in a DRESSING layer"* is not how it landed: a prop's placement is **not stored at
all**. `part_expand` hands back a `MeshAt` — mesh name, cell, height, turn — for the same reason
a cell part's cells are derived (§P4), so nothing downstream holds a copy to go stale.

⚠ **AND *"sockets do not care which it is"* TURNED OUT TO BE HALF TRUE, WHICH IS THE BETTER
HALF.** The socket contract genuinely does not care — one `FITS`, one `socket_fit`, one binding.
But a socket that *aims* somewhere does care, because turning a body made of CELLS is only exact
at six of the 24 headings (`A4.4`) and turning a mesh is exact at all of them. So the question
`expand` asks is **what is displaced by a rotation** — cells, a nested part at an offset, a
socket at an offset — never *is this a prop*. ⚠ The pillar above is exactly why: it is both, and
it still may not be turned to 18.

### P6 — A fitting is a part with a moving sub-part

The one thing that distinguishes a door from a pillar, and the only piece of
[FITTINGS](FITTINGS.md) that survived its own inventory: `F-FIT`, `F-SWING`, `F-STATE` — a
leaf on a **hinge**, with an axis, a range and a current state.

So a `leaf` part carries a hinge in its `PART` section, and an instance carries the state.
That is what makes the door read as a door: **ajar**, not shut. A shut door photographs as a
wall, and the acceptance test for this whole design is recognition.

### P7 — The library is a directory, and the picker is the editor

`data/parts/<kind>/<name>.hxw` — ⚠ **`.hxw`, not `.hxf`**; this line said `.hxf` and §P2 is
what corrected it, since a part is a world and there is no `.hxf` in this tree at all. The
server lists the directory; the editor gets a picker; `14:` (stencil)
takes a part name instead of a roof height. Nothing about this needs a database, and a
directory is greppable, diffable and reviewable — which a database is not.

### P8 — Nesting is allowed, and it terminates

A house contains door-frames; a door-frame contains a leaf; a porch contains pillars. So
`INST` is recursive. Two rules keep it finite and are tested rather than assumed:

- **a part may not contain itself, transitively** — checked on save, refused with the cycle;
- **depth is bounded** (start at 8) — not because deeper is wrong, but because an unbounded
  recursion in a renderer is a hang, and a hang in the editor reads as a crash.

✅ **The first is BUILT, `A3.1`** — `part_cycle(root, name)` and `library_cycle(root)` in
`lib/hex_part/src/inst.loft`. Three things it settled:

- ⚠ **THE TWO RULES ARE NOT ONE RULE, AND THE CYCLE CHECK NEEDS NO BOUND.** Each step either
  finds a name already on the chain being walked — refused — or descends to one that is not,
  and the chain only grows, so the walk is bounded by the number of distinct parts on disk.
  The depth bound is about a **renderer**, which is a different program with a different
  failure. Writing them as one rule would make this function look like it already had a bound.
- ⚠ **THE PATH, NOT A VISITED SET, AND A DIAMOND IS WHAT TELLS THEM APART.** A house with two
  door-frames that both use the same leaf visits that leaf twice and is perfectly legal; a
  global `seen` set calls the second visit a cycle and refuses exactly the sharing that makes
  parts worth having. Pinned by a test, so the obvious "make it cheaper" refactor is refused.
- ⚠ **THREE ANSWERS, NOT TWO.** A dangling reference is not a cycle and a damaged nested part
  is neither; a mistyped name and a part that contains itself want completely different fixes,
  and one code for both makes a typo read as a recursion the author cannot find. Same rule as
  `MR_ABSENT` versus `MR_MALFORMED` in `A1.4`.

⚠ **AND THE CHECK HAS A CONSUMER, WHICH THE DESIGN DID NOT NAME.** *"Checked on save"* assumes
a save gesture, and there is none yet (`A7.3`) — so a library with a cycle in it would sit there
being wrong until `A3.2` tried to expand it, which is the hang §P8 exists to prevent. The server
sweeps the library at startup and lists a faulty part **greyed with its chain** (plan 18 §C3):
`contains itself: house/loop_a → house/loop_b → house/loop_a`. The refusal names the cycle
because *"this part contains itself"* is unactionable in a library of two hundred — the author
needs to know which reference to cut.

---

## What this is verified by

Following the rule this tree learned the hard way: **structural invariants are loft tests in
the library; the drawn result and the sentences are gates.**

**Library (`lib/hex_part/tests/`), pure, no server:**

| claim | why it cannot be a gate |
|---|---|
| round-trip identity — a part saved and loaded is the same part | a picture cannot see a dropped section |
| `expand(instance) == bake(instance)` | the whole authority argument rests on it |
| a leaf that does not fit its socket is REFUSED, with the reason and the offer | a refusal has no picture |
| a re-derive reproduces the cells from the records alone | ⚠ `I1` WAS "one instance owns one label" and is retired — §P4 |
| a part placed at each of the 24 headings is congruent to itself | 24 pictures nobody will look at |
| a cyclic `INST` is refused, and depth is bounded | a hang is not a picture either |
| an unknown section survives a load-and-save unchanged | forward compatibility, by the format's own promise |

**Gates (running world, a PNG):**

- the authored house stencils in and **reads as a house** — the cold-recognition test;
- a door in its frame reads as a door, **ajar** (`F-SWING`);
- a statue on its plinth is at the plinth's height and facing out;
- a part edited and re-saved changes every placement in the world — one picture before, one
  after, and the diff is the claim.

⚠ **The negative control, seen red, before any of it is believed:** perturb one cell of a
saved part and the round-trip test must fail. Without that, every row above passes on a
constant — which is how `25:` WALL held its gate for months while drawing a road with a
fence down each side.

---
## The order of work

**It lives in the plan** — [plans/17-parts/README.md](../../plans/17-parts/README.md), broken
into one-sitting steps, each with its own gate and size.

⚠ **On purpose, and it is the convention rather than a preference.** A reference doc says how
the thing *works* and is updated in place; a plan says what we intend to *change* and is
temporary. Ordering and per-step verification are the plan's, and keeping them here would
mean two copies of the schedule that drift the first time a step moves.

What stays here is what outlives the plan: the eight decisions, and the split between library
tests and gates — both above.

---

## Open, and decided rather than asked

- **Heading granularity: the format records 24 and a part can take SIX.** ⚠ **This entry
  said something else until `A4.4` measured it**, and the old wording is worth keeping in
  view because the mistake in it is a common one: *"the editor's own wall runs use 24 … a
  part placed at a heading with no lattice family is approximated, and that is the honest
  word for it — the alternative is refusing half the headings an author can already point
  at."* Two things are wrong with that.

  **First, it borrows a fact about LINES to settle a question about BODIES.** The 24 comes
  from `hex_shape::hexwall`'s `d24`, whose own header reads *"THE 24 DIRECTIONS, AND WHY
  ONLY 12 ARE FOR HOUSES"* — even `d24` are exact lattice steps, odd ones wobble between two
  headings, and *"HOUSES ARE NEVER DRAWN WITH AN IN-BETWEEN ANGLE"*. A wall run is a
  one-dimensional path and a path may staircase; a part is a body, and rotating a body is a
  map from the lattice onto itself. `STATE` §B names this shape: *a sentence that mentions a
  seam is not a seam argument.*

  **Second, *approximated* was the wrong word for two thirds of them.** Measured on a
  37-cell disk with 90 interior adjacencies (`moros_map/tests/headings.loft`, which prints
  the whole table every run):

  | headings | what happens |
  |---|---|
  | `0 4 8 12 16 20` — the 60° multiples | **exact.** No cell lost, no adjacency torn, residual zero to the last bit — cross-checked cell-for-cell against `hex_field::cell_rot`, which is integer-only |
  | the 15° and 45° families (12 of them) | **well-defined and wrong.** 12 of 90 adjacencies tear; worst residual **0.522 hex steps** against a covering radius of 0.577, so near the worst a snap can be |
  | the 30° family (6 of them) | **arbitrary.** Six of the 37 rotated points land *exactly* on a cell boundary, so *the nearest cell* is decided by a tie-break rather than by geometry. 18 of 90 adjacencies tear, and at **90°** the tie-break sends two cells to one — the only cell loss anywhere in the table |

  A torn adjacency is the number that matters and it is the one nobody would have looked
  for: **no cells are lost, every count agrees with itself, and the house has holes in its
  walls.**

  So: the format keeps `FACINGS = 24` — one heading space shared with the runs is worth
  having, and the record is the author's *requested* heading — and `expand`/`bake` apply the
  six and refuse the rest, naming the measurement. ⚠ **Still open, and it is an authoring
  call rather than a lattice one:** `moros_map` has twelve exact *placements*, the six turns
  plus six **flips** that land between them (`clock.loft`, decision #8). A flip is a mirror,
  not a rotation — a house placed at a 30° hour has its door on the other side. Whether a
  part may be mirrored to reach those six is not something the lattice can answer.
- **Size classes are names, not numbers.** `door/2x3` rather than a width in cells, because a
  cell width is a lattice fact and a door size is an authoring intent; two frames that admit
  the same leaves should say so even if their cells differ.
- **A part carries no terrain.** It carries what it *is*; seating it on a hillside is
  `hex_place::seat_height` / `seat_write`, which already exists and already handles the slope.

## See also

- [FITTINGS](FITTINGS.md) — the hinge model, and which of its sections `hex_draw` superseded
- [HEX_STACK § 6](HEX_STACK.md#6-persistence-and-distribution) — **the authority on persistence**: why the interchange discipline moved to the store, and why a world wants to be a keyed collection
- [EDITOR_SUBSTRATE § The document format](EDITOR_SUBSTRATE.md#the-document-format-is-the-sharpest-clause) — where the sections-beat-a-flags-word argument was made. ⚠ Its `HXF1` anchor is superseded; the argument is not
- [HEX_STACK](HEX_STACK.md) — the three invariants this design is an application of
- [WIRE_PROTOCOL](WIRE_PROTOCOL.md) — `14:` as it stands today

---

## P9 — A LIMB IS A BUILDING, AND NOTHING IS A CUSTOM MESH

**Decided 2026-08-06, and it overturns the second column of §P5's table.** A part has ONE body:
cells. A `.glb` is a *drawn* form, never an authored one — so a door leaf, a shutter, a gate and
a windmill sail are all authored with the gestures that build a house, because they **are**
houses at another size.

### What forced it, and what it dissolves

`A5.2` could not make a door look like a door, and the reason was never the swing. It was that a
leaf small enough to be a door is **narrower than one hex** (a hex is √3 ≈ 1.73 world units), so
cells had nothing to say about it and a `.glb` was the only body left. That is the wrong way
round: **the bigger the door, the better cells work.** A gate two or three hexes wide has real
width, and planks, rails, ironwork and a wicket are all expressible in what cells already carry —
column heights and wall-edge materials. So the design aims at the GATE, and the one-hex door is
the degenerate case rather than the shape everything is bent around.

### The lattice objection, and why it does not apply

`A4.4` measured that only the six multiples of 60° move a body of cells without tearing it, so a
cell limb has **two** positions in a door's swing — `0` and `1/6` — and can never be ajar. True,
and irrelevant here:

> ⚠ **That constraint binds only where cells must be WRITTEN BACK to a lattice. A limb never
> writes into the world it hangs in — it hangs in space, at an arbitrary angle.**

So a limb is **meshed, not stamped**: its own chunks are meshed the way `part_thumb_wire` already
meshes a part to draw a catalogue thumbnail, and that mesh is posed on the joint continuously.
No cell is ever written at a non-lattice angle, so `A4.4`'s refusal never fires. **Cells are the
authoring representation; a mesh is the drawn one**, and which of the two a part gets is decided
by HOW IT IS ATTACHED, not by what it is made of.

### The joint is the one this tree already has, twice

`moros_sim::assembly::Link` is `hex_part::Hinge` with a kind on it — offset, revolute axis, and
limits **in turns** — and `A5.1` says outright that the hinge was modelled on *"a `Body` on a
`Mount` link"*. The walker is already drawn as five independently posed meshes, beside a comment
naming `hex_entity` as *"a part-tree whose every part carries its own transform"*. A door leaf and
an arm are the same object.

⚠ **They differ in one place and the difference is deliberate**: `Link`'s offset is in the
PARENT's frame, `Hinge`'s point is in the CHILD's. The child is right for a library — a leaf
carries its own hinge whatever frame it hangs in, which is what makes a left leaf and a right leaf
two ordinary parts with mirrored axes rather than one part with a handedness flag.

⚠ **And the document does not grow a simulation record.** A `Hinge` in the file is a document
fact; an `Assembly` is a runtime one. Derive the second from an expansion — never store it — or a
part file grows a field it cannot validate.

### The two doorways

| | one hex | three hexes |
|---|---|---|
| frame | `door/frame` — an opening, one socket | `door/gateway` — an opening, TWO sockets |
| class | `door/1x2` | `door/3x3` |
| sockets | `leaf` | `leaf-l`, `leaf-r` (§P3's `column-1..4` shape; `A4.3` forbids two sockets sharing a name) |
| leaves | `door/leaf` | `door/gate-l`, `door/gate-r`, mirrored axes |

⚠ **THE SOCKET SITS AT THE HINGE CELL, NOT AT THE CENTRE**, and for a three-hex opening that is a
decision rather than an accident: the socket's position and the limb's pivot are then ONE fact
instead of two that can disagree. A wide opening still has one socket per LEAF — a socket is the
contract at a joint, not a description of the hole.

⚠ **THE CLASS REFUSES THE MIX BY SPELLING**, which is what `A4.2`'s *nominal* decision was for:
`door/1x2` and `door/3x3` are different things, not different amounts, so a narrow leaf offered to
a gate is refused with the frame's actual class handed back. Nothing has to grow to support a
bigger door.

### What it costs, stated

A meshed limb is **not in the store**: nothing walks on it, `sight_clear` cannot see it, and
collision does not know it is there. For a swinging door that is arguably correct — a moving
obstacle is not something a voxel store can express — but it is a consequence, not a discovery.
And `bake` already refuses a nest holding a mesh (`BK_MESH`), so a meshed limb falls under the
same rule and `expand == bake` (`A3.3`) stays coherent.

⚠ **`MESH` AND `.glb` AUTHORING ARE ON THE WAY OUT UNDER THIS RULE.** `prop/statue` and
`prop/seated` are the remaining custom meshes; they become cell parts, and `MESH` survives only
as the *import* path (`21:`) it was before parts existed. Until they are converted the two forms
coexist, and this section is the statement of which one is the design.

### P9.1 — A limb is authored at its OWN scale, and the ratio is already in the file

**Added 2026-08-06 with the user.** A door at the parent's hex size is one column wide and has no
room for detail; the answer is to author the leaf on a **finer lattice** — many small hexes — and
shrink it to fit the opening.

⚠ **THIS WORKS FOR THE SAME REASON THE ROTATION LIMIT DIED, AND ONLY FOR MESHED LIMBS.** A
stamped child is written into the parent's world, and a cell is a cell: a fine lattice cannot be
written into a coarse one at all. A **limb is never written back** — it is meshed in its own frame
and posed — so the parent's hex size is simply not a fact about it. §P9's decision buys the
resolution as well as the angle.

⚠ **AND NOTHING NEW IS AUTHORED, BECAUSE THE FORMAT ALREADY CARRIES IT.** A part is a world and a
world has `w_unit`; the parent has one too. **The scale is the ratio** —
`child.w_unit / parent.w_unit` — derived at the placement the way every other composed quantity in
this design is derived (§P4). A `scale` field on the record would be a second authority on a fact
both files already state, and the first thing to go stale.

⚠ **A UNIT MISMATCH ON THE STAMPED PATH MUST BE REFUSED, LOUDLY.** It is the one shape that
silently places cells at the wrong size — every count agreeing, the geometry a quarter of what the
author meant. `part_diff` already treats a differing unit as a difference (`region.loft`); the
stamping path owes the same answer as a REFUSAL with both units named. A fine part is a limb or it
is nothing.

### P9.2 — A frame is two things, and only one of them is structure

The user asked for the FRAME to be finely detailed too, and that splits it:

| | what it is | body | in the store |
|---|---|---|---|
| the opening | a hole in a wall — what you walk through | the building's own cells, coarse | **yes** — it is the wall |
| the joinery | jambs, lintel, threshold moulding, ironwork | a fine-lattice part, meshed | no |

⚠ **THE WALL BESIDE THE OPENING ALREADY DOES THE COLLISION**, so the joinery never needed to be
in the store — which is why it may be as fine as the author likes. This is §P3's own sentence
arriving with consequences: *"a socket is not a hole … the socket is the contract at that
opening."* The hole is structure, the joinery is dressing, and the leaf is a limb; three different
answers to *how detailed may this be*, each following from whether anything must walk on it.

### P9.3 — ⚠ The rule is *nothing NEEDS a custom mesh*, not *nothing may be one*

**Corrected 2026-08-06, same day, by the user.** §P9's headline says *nothing is a custom mesh*
and that is too strong. It is left standing above rather than quietly rewritten, because the
argument it carries — a limb is a building, cells are the authoring form — is right and is what
decided the shape. What was wrong is the absolutism.

**A custom mesh stays a first-class body.** `21:` IMPORT exists, kit-bashing is a real workflow,
and finished art is a legitimate thing to bring in. §P5's box is still true: what a `.glb` gains by
being a PART is that it can be *placed in a niche*, *listed in a library*, *swapped for another
that fits the same socket*, and *carry a name an author chose*.

⚠ **THE ACTUAL RULE IS ABOUT WHAT THE EDITOR REQUIRES.** A part must be authorable **end to end
inside the editor**, with the gestures that build a house and nothing else. A mesh is an *upgrade*
to a part, never a prerequisite for one. So:

| | |
|---|---|
| cells | the DEFAULT, and the only body the editor ever requires |
| a `.glb` | always allowed, never needed — imported art, or a shape cells genuinely cannot say |

### The driver is RAPID PROTOTYPING, and that is why cells are the default

The editor is meant to be **self-contained**. A gesture round-trip is seconds and stays inside one
tool; a modelling round-trip is minutes and needs a second one. Anything the editor cannot author
is a thing a prototype has to leave the editor to get — so the test of this design is not *can a
mesh be used* but **can the whole thing be built without ever opening one**.

That is the same sentence plan 17 already answers for houses — *a house authored end-to-end
without touching loft* — extended one tool further: **without touching a modelling tool either.**

⚠ **SO §P5's TABLE IS RE-RANKED, NOT OVERTURNED.** Both bodies remain; what changed is which one
is the default and which is the escape hatch. §P9's *how it is attached decides how it is drawn*
still holds and is the useful half: a bound limb is meshed whatever it is made of, so a cell leaf
and a `.glb` leaf hang in the same socket and swing on the same joint. **That is what makes the
upgrade path free** — author in cells, replace with art later, and the binding does not move.

### P9.4 — The round trip: blockout in cells, skin from an artist, contract unchanged

**Added 2026-08-06 with the user.** The editor's cell-built door is a good *prototype*. A game
wanting realistic graphics hands that mesh to a 3D artist and gets a finished asset back. So the
design owes the round trip, and it is shorter than it looks:

1. **Block out** the leaf in cells, inside the editor, with the house gestures.
2. **Export** its mesh as a `.glb` — a limb is already meshed to be drawn (§P9), so the export is
   that same mesh through `save_glb`, and `22:` EXPORT is the gesture that exists for it.
3. The **artist** refines it: same silhouette, same pivot, real material.
4. **Point the part's `MESH` at the returned file.** Nothing else changes.

⚠ **THE `.hxw` IS THE CONTRACT AND THE `.glb` IS THE SKIN**, and that is the whole reason step 4
is one line. `PART`, `FITS`, `HING` and `SOCK` all stay exactly as authored — the class it fits,
the hinge it swings on, the name it carries. The artist is handed geometry and returns geometry;
they are never handed a contract to preserve, so there is nothing for them to get wrong. `A6.3`
already measured that a swap is a **one-field edit**, and this is that finding arriving at a
workflow.

⚠ **AND THE BLOCKOUT'S CELLS ARE NOT THROWN AWAY — THEY BECOME THE COLLISION BODY.** §P5 says a
part may be **both**: *"a pillar that is a `.glb` for the eye and a one-cell column for the
walker."* That sentence was written before any of this and had no use; here it is the payoff. The
cells the author blocked out keep earning their keep as the thing the walker meets, while the
artist's mesh is what the eye meets. A prototype is not a draft that gets deleted — it is the
half of the finished object that nobody would have enjoyed modelling.

⚠ **THE ARTIST NEEDS THE SCALE, AND THE FILE CARRIES IT** (§P9.1). A part is a world and a world
has `w_unit`, so the exported mesh is in real world units and the returned one can be checked
against them. A hinge point in the same units is what makes the pivot survive the trip.

> **What this makes the editor.** Not a modelling tool and not a level editor, but the place a
> thing is *designed* — its size, its joint, its socket, its name — with geometry good enough to
> judge it by. The art is a later, optional, replaceable layer on a decision that is already made.

### P9.5 — The export is the DIMENSIONAL spec, because the contract deliberately is not

**Added 2026-08-06 with the user.** The `.glb` handed to an artist must already carry **the exact
sizes the game needs**, or what comes back is art at the wrong scale and the round trip costs a
second pass.

⚠ **SO THE EXPORT IS IN FINAL WORLD UNITS, NOT THE PART'S OWN.** §P9.1 derives a limb's scale as
`child.w_unit / parent.w_unit` — a leaf authored on a fine lattice is *shrunk* at the placement.
Exporting the leaf's own frame would hand the artist geometry several times too big and a ratio to
apply by hand, which is a conversion waiting to go missing (`A5.1`'s own words: *"two units for
one quantity is how a conversion goes missing"*). **The scale is applied before the file is
written**, and the hinge point goes out in the same units, or the pivot does not survive the trip.

⚠ **AND THIS IS WHY THE SIZE CANNOT RIDE IN THE CONTRACT.** `A4.2` made a size class **nominal** on
purpose — `door/1x2` and `door/3x3` are different *things*, not different *amounts*, and the whole
argument was that `2x3` and `round-3` and `plinth-2` share no dimension a number could compare. So
the class says **which hole**; it cannot say **how big**, and it was never meant to. The two are
complementary and both are needed:

| | says | who reads it |
|---|---|---|
| `FITS` / `SOCK` class | *which hole this goes in* | `socket_fit`, at the binding |
| the exported `.glb` | *how big it is, in metres* | the artist, at the modelling |

⚠ **A RETURNED MESH IS CHECKED AGAINST THE EXPORTED EXTENTS**, and refused with the difference
rather than accepted and quietly rescaled. A skin that came back 8% wide is a door that binds on
its frame, and `mesh_aabb` already exists to measure it. ⚠ This is also why the check cannot be a
picture: `part_thumb_view` fits the camera **per part**, so two props differing only in SIZE are
one image — a thumbnail is structurally blind to exactly the thing this check is about.

> **What travels, in one line.** The artist gets *geometry at final size, with the pivot marked*.
> They never get a contract, a class, a lattice or a unit conversion — and so there is nothing in
> the hand-off they can get wrong that a number will not catch on the way back.

### P9.6 — The editor is the artist's WORK SURFACE, and a monster is a gateway

**Added 2026-08-06 with the user, and it is the goal the rest of §P9 was serving.** Being
self-contained was never about avoiding the 3D artist. It is about handing them a surface they can
start on **immediately** — so that the slow, expensive, irreversible part of their work is spent
on craft rather than on reconstructing decisions somebody else already made.

⚠ **WHAT "READY TO WORK" MEANS, CONCRETELY.** Every one of these is carried by the design above,
and each is a question an artist would otherwise have to ask and wait for an answer to:

| they need | the design's answer |
|---|---|
| how big is it, exactly | the export, in final world units (§P9.5) |
| where does it pivot | the hinge, in the same units, marked in the export (§P9.4) |
| how far does it move | `hg_lo`/`hg_hi`, in turns (`A5.1`) |
| what does it have to fit | the `FITS` class, and a frame that refuses by spelling (`A4.2`) |
| what is it called | `PART.name` (§C2) |
| what happens when I hand it back | the `MESH` is repointed; nothing else moves (`A6.3`) |

**None of that is a document they have to read.** It is a `.glb` at the right size with a pivot in
it, and a part file they never open.

### A creature is the same object, and the tree already models it three times

⚠ **A MONSTER IS A FRAME WITH LIMBS — WHICH IS A GATEWAY WITH LEAVES.** Same sockets, same joints,
same export at final size, same *blockout in cells, skin from an artist*. Nothing about §P9 is
about doors; doors are just the smallest case that has all the parts.

The machinery exists and is currently three descriptions of one thing:

- `hex_body::Rig` — bones, and `rig_admissible`;
- `moros_sim::assembly::Link` — offset, revolute axis, limits **in turns**, plus a kind;
- `hex_part::Hinge` — the same joint, narrowed, in the child's frame.

…and the editor **already draws a part-tree**: the walker is five independently posed meshes, next
to a comment naming `hex_entity` as *"a part-tree whose every part carries its own transform"*.
So the renderer half of a creature is proven; a door was the first thing to reach it through the
part format.

⚠ **AND THE CHILD'S-FRAME HINGE IS WHAT MAKES A LIMB LIBRARY POSSIBLE** (§P9). Because a limb
carries its own pivot, an arm is swappable between creatures exactly as a leaf is between frames —
`arm/humanoid-2`, `head/beast-3`, `wing/bat-4` are socket classes like any other, and `A6.3`'s
one-field swap is how a monster is kit-bashed. A left arm and a right arm are two ordinary parts
with mirrored axes; there is no handedness flag anywhere, and there does not need to be.

> **The one sentence.** The editor is where a thing's *size, joints, sockets and name* are decided,
> fast, by the person who knows what it is for — and the artist is handed a rigged blockout at
> final scale, so their first hour is modelling rather than measuring.

### P9.7 — The durable artefact is the SCALE. A red blob at the right size beats a good mesh at the wrong one

**Added 2026-08-06 with the user, and it reorders everything above.** The game designer's goal is
**framing and relative scale** — how big things are against each other, and what that does to a
shot. They can work with red-blob meshes the whole way through. But **the scale they set is what
every other person then works from**, so it is the one output of this editor that is not
replaceable.

⚠ **SO THE BLOCKOUT'S JOB IS TO BE DIMENSIONALLY HONEST, NOT TO BE PRETTY**, and that frees the
whole design: a cell body does not have to look like a door, it has to be *the size of one*. Every
effort spent making a blockout handsome is effort spent on the layer that gets replaced, taken
from the layer that does not.

⚠ **THIS IS A CORRECTION TO A DAY'S WORK, RECORDED RATHER THAN QUIETLY ABSORBED.** `A5.2`'s
renderer half ended with *"it reads as a panel at an angle, not yet as a door"* and a note that the
fix was a better `leaf_mesh()`. By this rule that was the wrong worry: the leaf's **proportions and
its swing** were the deliverable and they were correct. *Looking like a door* is the artist's hour,
and buying it early with hand-written `box()` calls is buying the cheap half twice.

### What follows for the editor

| | |
|---|---|
| a mesh | replaceable, and expected to be replaced |
| a **size** | permanent — everything downstream is built against it |
| a **proportion** | permanent, and the thing a shot is actually composed of |
| a joint's range | permanent — it decides what an animation may do |

⚠ **A SIZE CHANGE THAT ARRIVES WITH NEW ART IS THEREFORE THE WORST BUG THIS PIPELINE CAN HAVE**,
because it silently invalidates decisions taken in a completely different tool by a different
person weeks earlier. §P9.5's extent check is not a nicety: it is the guard on the only artefact
here that cannot be regenerated.

⚠ **AND THE EDITOR OWES A WAY TO JUDGE RELATIVE SCALE, WHICH THE CATALOGUE CANNOT GIVE.**
`part_thumb_view` solves the camera to fill the frame **per part**, which is right for
recognisability and makes it **structurally blind to size** — two props differing only in how big
they are produce one picture. Measured already, at `A6.3`. So relative scale can only be judged
with things **seen together, at one scale, beside something known**; the walker figure is that
known thing, and is why it belongs in a shot rather than being cropped out of it.

> **The one sentence.** Get the sizes right with blobs, because the blobs are thrown away and the
> sizes are not.

### P9.8 — Two destinations, and the indie one is SHIP AS-IS

**Added 2026-08-06 with the user, and it amends §P9.4 and §P9.7.** An indie game has real pressure
to **diminish the 3D artist's role** — often to nothing. So the engine's own output has to be
**shippable as it stands**, or need as few touch-ups as it can. The hand-over of §P9.4 stays
available; it stops being the assumed ending.

| destination | what the blockout is | who finishes it |
|---|---|---|
| **ship as-is** (indie, stylised) | **the asset** | nobody — the engine's look IS the look |
| **hand over** (realism) | a rigged, correctly-sized blockout | a 3D artist (§P9.4) |

⚠ **AND THE THING THAT MAKES *SHIP AS-IS* WORK IS CONSISTENCY, NOT DETAIL.** A flat-shaded hex
world already has a coherent look. A door built the same way **matches by construction** — which
is exactly what makes a stylised game read as *intentional* rather than *unfinished*. More detail
on one object does not help; it is the thing that breaks the effect.

⚠ **SO §P9.7's *"looking like a door is the artist's hour"* IS TOO STRONG, AND THIS IS THE
CORRECTION.** Sizes first is still right. But appearance is not entirely deferred: **coherence** is
the engine's job, and it is bought with a shared palette and shading rather than with modelled
detail. §P9.7's real claim survives — *do not hand-carve geometry that is going to be replaced* —
and it is now joined by *do make the whole set look like one set*.

⚠ **THIS ALSO EXPLAINS A MISREADING FROM `A5.2`.** The hand-written `box()` leaf looked wrong in
the render and I put it down to lacking detail. It lacked nothing: it was **a different kind of
object** from the cell world around it — a smooth slab among faceted hexes. A cell-built leaf
would have matched without a line of extra geometry, which is §P9's own argument arriving at the
picture.

### What ship-as-is actually owes, and it is small

⚠ **A MATERIAL PER PART, WHICH THE EDITOR DOES NOT YET HAVE.** `prop_surface()` reuses `frame` for
every mesh body, and the consequence is already recorded at `A6.2`: *"a statue and a window
surround are ONE bucket to every chromaticity gate … when something does draw a statue in the
world, separate them in the RENDERER and not in the classifier."* Something draws one now. A
library whose every asset is the same colour is not shippable, and this is the smallest real gap
between where the editor is and where §P9.8 needs it.

⚠ **AND THE SHAPE VOCABULARY IS ALREADY THERE**: a column's heights, a cell's five materials, and
wall-edge materials per side. That is enough for planks, rails, panels and ironwork at gate scale
(§P9) — the resolution question §P9.1 already answered by letting a limb be authored on a finer
lattice.

> **The one sentence.** The engine's look is not a placeholder for a better one; for the indie
> destination it is the product, and the editor's job is to make everything belong to it.

### P9.9 — ONE pipeline, and the destinations differ in a single field

**Added 2026-08-06 with the user, and it corrects §P9.8's own framing.** That section presents two
destinations as a table, which reads as a fork you must choose between. It is not one. **Almost
all of the work falls into the same categories either way**, and the two endings differ in one
field.

| | ship as-is | hand over | shared? |
|---|---|---|---|
| size, proportion, joint range | needed | needed | **yes** — §P9.7's durable artefacts |
| socket class and contract | needed | needed | **yes** |
| the part-tree, limbs, hinges | needed | needed | **yes** |
| the blockout's cells as collision | needed | needed | **yes** — §P9.4 |
| export at final size with pivot | it *is* the asset | it is the brief | **yes**, and for both reasons at once |
| a material per part | the look | the reference for what it should read as | **yes** |
| where `MESH` points | the engine's own file | the artist's file | **the only difference** |

⚠ **SO THE CHOICE IS ONE FIELD, MADE LATE, AND REVERSIBLE.** `A6.3` measured that a swap is a
one-field edit and this is that finding at the scale of a whole project: the destination is
decided **per part**, after the thing exists, and changed again afterwards. A project can be
**mixed** — an artist on the five assets a player looks at, the engine's own output for the other
two hundred — and it can **ship first and upgrade later**, one part at a time, without touching a
socket, a size or a binding.

⚠ **WHICH IS WHY BUILDING FOR BOTH IS NOT DOUBLE WORK.** Nothing above is
destination-specific, so nothing has to be decided up front — and a design that forced the choice
early would be spending its own flexibility to buy nothing. The export is the clearest case: it is
simultaneously *the shipped mesh* and *the artist's brief*, and it is one file written once.

> **The one sentence.** Build the thing once, correctly sized and jointed; whether its skin comes
> from this engine or from a person is a decision you can defer until after you have played it.
