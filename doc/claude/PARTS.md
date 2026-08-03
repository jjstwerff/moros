<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# PARTS — a house drawn away from the world, and the things it is made of

*(user, 2026-08-02: "design that I can draw a house separate from the world to stencil into
it, and that it allows me to design doors, door-frames, windows, window-frames, statues,
pillars, that can be placed in the world or used in other houses")*

Plan [#17](https://github.com/jjstwerff/moros/issues/17). Design only — nothing here is built
yet, and the order of work is at the bottom.

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

Each step below is **one sitting and one commit**, ends green, and leaves the editor
working. The seven letters are the arcs; the numbered rows are the steps.

⚠ **`A2` before `A3`.** The temptation is to build instances first, because references are
the interesting part. `A2` is what proves the *format* carries a real house — and if it does
not, every instance built on it is built on a document that has already lost something.

### The three primitives A1 needs, and what already exists

Worth stating before the table, because `A1` reads like one step and is really three, and
because **none of them needs a new file format**:

| | how |
|---|---|
| **copy a region out of a world** | a loop over `world_column(w,q,r)` → translate → `world_set_column(part, col)`. Both exist. No new library primitive. |
| **save it** | `world_save(part, path, palette)` — §P2, a part *is* a world |
| **carry `PART`/`ANCH`** | ⚠ **the store has no section mechanism today.** `world_save` writes a fixed header (`HXW7`, version, chunk width, unit) then chunks. `A1.3` is where that is added, and it is the only format work in the whole plan. |

### A1 — a part is a world you can save and load

| | step | proves it | size |
|---|---|---|---|
| `A1.1` | `lib/hex_part` exists, depends on `hex_world`, one function: `part_from_region(w, cq, cr, rad, anchor) -> World`. Cells only, no sections. | a loft test: the copied world has the same column heights and materials as the source region | S |
| `A1.2` | Save and load it with the **existing** `world_save`/`world_load`. Still no sections. | ⚠ **round-trip identity, with the perturbation control seen red** — change one cell of the saved part and the test must fail. Everything after this rests on it. | S |
| `A1.3` | **Store sections.** A trailing tagged block: `tag(u32) + length(u32) + bytes`, repeated, after the chunk payload. An unknown tag is **skipped by its length**. | a loft test writes a section with a made-up tag, loads, saves, and the unknown section **survives byte-identical** — the forward-compatibility promise, tested rather than asserted | M |
| `A1.4` | `PART` (kind, name, description) and `ANCH` (cell, height, facing) over that mechanism. | round-trip carries kind/name/facing; ⚠ an *older* reader (one that does not know `PART`) still loads the cells — simulated by reading with the tag unregistered | S |

⚠ **`A1.3` is the one genuinely risky step**, because it changes a format that already has
worlds saved in it. It is additive by construction — sections go *after* everything an
existing reader reads — and the test that matters is that a **pre-section file still loads**.
Write that test first.

⚠ **The keyed-read question (§P2) is deferred, deliberately.** `A1` accepts whole-file reads.
A catalogue of two hundred parts wanting to load *one* is real, and it is `A7`'s problem when
there are two hundred parts — not `A1`'s when there is one. Say so in the code.

### A2 — the procedural house becomes an authored one

| | step | proves it | size |
|---|---|---|---|
| `A2.1` | A one-off tool: run `stencil_place` into an empty world, `part_from_region`, save to `data/parts/house/cottage.hxw`. | the file exists and loads | XS |
| `A2.2` | `14:` accepts a **part name** alongside its `roof_up`, loading and stamping the part. | ⚠ **the stencil gate's picture is unchanged** — pixel-for-pixel against the procedural path. That is the proof the format carries everything the procedure did. | M |
| `A2.3` | Retire the procedural path behind the authored one. | the gate still passes with `stencil_place` no longer reachable from `14:` | S |

### A3 — instances

| | step | proves it | size |
|---|---|---|---|
| `A3.1` | `INST` section: part id · cell · heading · (bindings later). Written and round-tripped. | round-trip, and a cycle refused with the cycle named (§P8) | S |
| `A3.2` | `expand(instance)` — derive cells into a layer under `world_fresh_label`. | ⚠ **one instance owns one label (`I1`)**, measured in the store | M |
| `A3.3` | `bake(instance)` — flatten to plain cells. | **`expand == bake`**, cell for cell. The strongest test here: the two paths share nothing but the part. | S |
| `A3.4` | Depth bound (8) and the cycle check on save. | a 9-deep nest is refused, ⚠ and the control: an 8-deep one is accepted — otherwise the bound is untested | S |
| `A3.5` | Re-derive on part change. | **edit the part, the placed house changes** — one PNG before, one after, the diff is the claim | S |

### A4 — sockets

| | step | proves it | size |
|---|---|---|---|
| `A4.1` | `SOCK` / `FITS` sections: name · cell · edge-or-heading · kind · size-class. Round-trip. | round-trip identity | S |
| `A4.2` | `socket_fit(frame, leaf) -> Fit{ok, reason, offer}` — pure, no world. | a leaf too wide is refused **with the frame's actual size and the nearest leaf that fits** | S |
| `A4.3` | Binding an instance to a socket instead of a coordinate. | moving the frame moves the leaf — the whole point of §P3 | M |
| `A4.4` | The 24-heading approximation, **measured and written down** (§ Open). | the residual per heading is in the test output, not asserted to be zero | S |

### A5 — fittings

| | step | proves it | size |
|---|---|---|---|
| `A5.1` | Hinge in `PART`: axis, range. Round-trip. | round-trip | S |
| `A5.2` | State on the instance, and the renderer honours it. | **the door reads as a door because it is ajar** — ⚠ the cold-recognition test, and a shut door photographs as a wall | M |

### A6 — prop parts

| | step | proves it | size |
|---|---|---|---|
| `A6.1` | `MESH` section: a `.glb` reference, over the existing `21:`/`22:`. | round-trip; the mesh loads | S |
| `A6.2` | A prop part in the same library, in the same sockets. | a statue on a plinth at the plinth's height, facing out | M |
| `A6.3` | Swap. | a different statue on the same plinth, no other change | S |

### A7 — the picker

| | step | proves it | size |
|---|---|---|---|
| `A7.1` | The server lists `data/parts/` and sends it. | the list arrives | S |
| `A7.2` | The picker in the editor — ⚠ **this is #18 `B5`**, not a second widget. | one catalogue, both families | S |
| `A7.3` | A part-editing mode: open a part as a world, edit, save back. | **a house authored end-to-end without touching loft** — the acceptance test for the whole plan | M |
| `A7.4` | Keyed reads, if two hundred parts make whole-file loading hurt (§P2). | measured in `w_tau` and milliseconds **before** it is built — the deferral from `A1` closed with a number, or closed as unnecessary | M |

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
