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

### P4 — An instance is a reference, and its cells are a LABELLED LAYER

The world stores, per placement: **part id · cell · heading · socket bindings**. That record
is the authority. The cells are **derived** from it into a layer that carries the instance's
own label.

This is the [HEX_STACK](HEX_STACK.md) invariant applied literally — *the store is the only
authority, everything else is derived, writes go in place* — and it buys the thing the user
asked for last: **edit the part, and every house containing it changes.**

The mechanism exists already, built this session for cellars: `world_fresh_label` mints an
identity, `world_set_column_as` / `world_merge_band_as` write a band under it. One instance,
one label, so `I1` holds by construction rather than by care.

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
| one instance owns one label (`I1`) | measured in the store, not on screen |
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

- **Heading granularity: 24, not 12.** `hex_form` canonicalises a footprint over 12
  orientations, and the editor's own wall runs use 24. A part placed at a heading with no
  lattice family is *approximated*, and that is the honest word for it — the alternative is
  refusing half the headings an author can already point at. `A1` records the requested
  heading; the approximation is measured at `A4` and written down.
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
