<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# Plan 17 — Parts

**Issue:** [`jjstwerff/moros#17`](https://github.com/jjstwerff/moros/issues/17) ·
**Value:** `F` · **Effort:** `H`

## Status

**DESIGNED, not started.** Nothing below is built.

**Goal.** A house is drawn away from the world and stencilled into it, and it is composed of
parts — door-frames, doors, window-frames, windows, pillars, statues — each of which is
itself editable on its own and reusable in other houses.

**The design is [doc/claude/PARTS.md](../../doc/claude/PARTS.md)** — the eight decisions
(`P1`–`P8`) and what verifies them. That doc holds the *durable* truth; **this file holds the
order of work**, and each step's gate travels with the step.

⚠ **`HXF1` is superseded** — a part is a **world**, saved by `world_save` into `.hxw`. There
is no `.hxf` anywhere in this tree. See [PARTS.md § P2](../../doc/claude/PARTS.md).

## Phase ordering

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
| ✅ `A1.1` | `lib/hex_part` — one dependency (`hex_world`), one function: `part_from_region(w, cq, cr, rad)`. Cells only, no sections. | **DONE.** 11 tests, both backends. ⚠ **Two findings, and the naive version of each looked right** — see below. | S |
| `A1.2` | Save and load it with the **existing** `world_save`/`world_load`. Still no sections. | ⚠ **round-trip identity, with the perturbation control seen red** — change one cell of the saved part and the test must fail. Everything after this rests on it. | S |
| `A1.3` | **Store sections.** A trailing tagged block: `tag(u32) + length(u32) + bytes`, repeated, after the chunk payload. An unknown tag is **skipped by its length**. | a loft test writes a section with a made-up tag, loads, saves, and the unknown section **survives byte-identical** — the forward-compatibility promise, tested rather than asserted | M |
| `A1.4` | `PART` (kind, name, description) and `ANCH` (cell, height, facing) over that mechanism. | round-trip carries kind/name/facing; ⚠ an *older* reader (one that does not know `PART`) still loads the cells — simulated by reading with the tag unregistered | S |

### What `A1.1` turned up

⚠ **A COLUMN READ IS CHUNK-SHAPED, NOT CELL-SHAPED.** `world_column` returns one `Hex` per
**layer of the chunk**, so a cell with one storey in a chunk whose neighbours use forty
distinct heights comes back with forty entries, thirty-nine of them absent. Copied verbatim
into a fresh world that creates forty layers in the *source* chunk's order — and the next
column, from a different source chunk with a different forty, lands against them. Measured: a
part cell read back the height of a cell three places away, and **every count still agreed**.
`E1` says absent and all-zero are the same, so "present" is a non-zero material.

⚠ **AND A TRANSLATION IN OFFSET COORDINATES IS NOT A TRANSLATION.** `(q - cq, r - cr)` shears
the lattice whenever the row delta is **odd**, because odd-r shifts alternate rows by half a
hex. Measured: a radius-2 copy wrote all nineteen columns and two of them — both on odd rows —
read back empty. The count was right and the shape was wrong. It is done in the doubled
integer lattice now (`k = 2q + (r & 1)`, `m = 3r`), the same construction
`hex_field::stencil_stamp` uses and moros#3 closed the hex convention on. **Fifth instance of
this class.**

⚠ **THE TEST CANNOT BE WRITTEN AGAINST THE MAPPING.** The obvious form — *"is source
`(cq+dq, cr+dr)` at part `(dq, dr)`"* — **is** the naive translation, so it agrees with a
wrong copy and disagrees with a right one. It asks for properties instead: the centre lands on
the origin, every distance from the centre is preserved, and the same multiset of cells comes
out as went in. The naive version fails the distance property by name.

⚠ **And two fixture bugs wore the code's clothes**, both caught only because the writes are
now asserted: heights that went negative at the far corners (silently refused, three of
nineteen columns never written) and heights packed closer than **ε**, which the store merges
by design. A fixture that fails to build reports the code's failure instead of its own.

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

## Cross-arc dependencies

- **Plan 16 (client split)** owns the wire; `14:`'s payload change (`A2.2`) lands there or is
  coordinated with it.
- **Plan 18 (catalogue)** owns the picker. `A7.2` is #18's `B5`, **not a second widget** —
  and #18's `B5` in turn needs `A1`–`A2` to have produced parts to list.
- **`hex_world`** owns the store and the save format, and lives in **two trees** pending
  [#8](https://github.com/jjstwerff/moros/issues/8). ⚠ `A1.3` adds a section block to that
  format — do it in whichever tree #8 settles on, or it lands twice and the two can disagree.

## Open questions

None blocking; the calls taken instead of asked are in
[PARTS.md § Open, and decided rather than asked](../../doc/claude/PARTS.md#open-and-decided-rather-than-asked).
