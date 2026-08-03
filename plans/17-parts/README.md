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
| **carry `PART`/`ANCH`** | `world_set_section(w, section_tag("PART"), bytes)` — added by `A1.3`, the only format work in the whole plan. A section rides on the world and `world_save` carries it. |

### A1 — a part is a world you can save and load

| | step | proves it | size |
|---|---|---|---|
| ✅ `A1.1` | `lib/hex_part` — one dependency (`hex_world`), one function: `part_from_region(w, cq, cr, rad)`. Cells only, no sections. | **DONE.** 11 tests, both backends. ⚠ **Two findings, and the naive version of each looked right** — see below. | S |
| ✅ `A1.2` | Save and load with the **existing** `world_save`/`world_load` — no new format (§P2). | **DONE.** 19 tests, both backends. Four controls, and a **blind comparison** fails all of them while the round-trip tests stay green. ⚠ It also turned up a native divergence — see below. | S |
| ✅ `A1.3` | **Store sections.** A trailing tagged block: `tag(u32) + length(u32) + bytes`, repeated, after the chunk payload. An unknown tag is **skipped by its length**. | **DONE.** `hex_world` 113 tests, both backends. `presection.hxw` is committed pre-section bytes; `ZZZZ` survives a load-and-save byte-identical. ⚠ **Two findings and three mutants** — see below. | M |
| ✅ `A1.4` | `PART` (kind, name, description) and `ANCH` (cell, height, facing) over that mechanism. | **DONE.** `lib/hex_part/src/meta.loft`, 29 tests, both backends. The older-reader gate compares the LANDSCAPE of a dressed part against a bare one through `part_diff`, never calling `part_meta`. ⚠ **Two loft panics and a store lock** — see below. | S |

### What `A1.4` turned up

⚠ **AN ASCII TEST SUBJECT CANNOT SEE ANY OF IT.** The part in the round-trip test is called
`"porte café"` and described as `"a door, 2 = boards wide 中"`, and that one choice found
**three** separate defects that `"door"` agrees with perfectly:

- **loft#749, two panics.** Text byte offsets and character counts are mixed in the language.
  A slice END is a byte offset while `len()` counts characters, so `line[(i+1)..line.len()]` —
  *the rest of the line* — aborts the process on any non-ASCII text. And `split_text("\n")`
  misindexes its **trailing** segment, so `"ab\ncé"` panics where `"é\ncd"` is fine. Both are
  Rust panics with no loft source location. `line.size()` and `split('\n')` are the same
  operations without the fault, and `meta.loft` uses those by construction.
- **A parse that splits on every `=` truncates a description at the first one.** Splitting at
  the FIRST is a one-line difference and no ASCII-without-equals subject can tell them apart.
- **A byte-per-character encoding** would round-trip `中` as a different character. The store's
  text sections write UTF-8 through the file layer, and the gate counts **9 bytes for 6
  characters** rather than trusting the comparison.

⚠ **AND `world_set_column(ld.wl_world, …)` — a struct FIELD into a `&`-parameter — aborts the
INTERPRETER with `Delete on locked store`**, where loft#745 records it failing `--native` at
compile time with a bare `E0308`. Same expression, two unrelated-looking failures, one fix:
bind the field to a local first. Worth knowing that the native-only symptom is not the only
one.

⚠ **`PART` and `ANCH` are `key=value` TEXT, not packed integers**, and the reason is the
language: a section is bytes, loft cannot rebuild a text from bytes (loft#748), so the payload
has to be text to carry a name at all. It also reads in a hex dump — the same argument the
four-character tag is made of — and `"12x" as i32?` is null rather than 12, so a malformed
number refuses instead of guessing. The cost is that a NEWLINE would forge a line
(`name=x\nkind=1` rewrites the kind), so it is refused rather than stripped.

⚠ **ABSENT AND MALFORMED ARE DIFFERENT ANSWERS**, and collapsing them is the trap. A part from
an older editor has no `ANCH` and is fine; one whose `ANCH` says `facing=north` is damaged, and
one code for both makes a part that stands the wrong way round look normal.

⚠ **The remaining piece is still loft#748 and it is not blocking.** Text → bytes is three lines
and there is no way back in memory, so `hex_world` offers each section as **bytes and text
both**, filled from one span at load. The bytes stay authoritative on a re-save, which is what
keeps an unknown section byte-identical; the text view is what `hex_part` reads a name from.
⚠ If a section ever carries a megabyte (`MESH`, `A6.1`), the always-decode is the line to
revisit. What was measured:

| | |
|---|---|
| `for ch in s`, `ch as i32` | walks **characters** and gives the **code point** — `é` is 233, `中` is 20013. ⚠ So a byte-per-character encoding silently truncates anything past `U+00FF`: the `ML_LABEL_TOO_WIDE` class again. |
| `integer as text`, `vector<u8> as text`, `"{u8}"` | **all refused.** There is no `chr`. Text → bytes is three lines; there is no way back. |
| `f += text` | writes **UTF-8** — 9 bytes for the 6 characters of `"Café中!"`. |
| `f#read(n) as text` | reads it back **exactly**, and does not fall over on 3 bytes of non-UTF-8 (`FF FE 00` came back length 3). |

The file API is the only decoder in the language, which is what settled it: `world_load` reads
each section's span **twice**, as bytes and as text, and the library still interprets nothing —
it offers two readings and lets the consumer pick. `world_set_section_text` is the write half,
and a section loaded from a file is **byte-valued whatever it holds**, so a re-save emits the
bytes it was given. Filed upstream as [loft#748](https://github.com/loft-lang/loft/issues/748)
anyway, because a missing `chr` is a language absence and every consumer persisting an
author-given name will hit it. ⚠ `hex_editor::names` (`B4`) is in memory only, so this is the
first place in the tree that had to solve it.

### What `A1.3` turned up

⚠ **THE MAGIC IS `WTTH`, AND THE COMMENT SAID `HXW7` — for as long as the format has
existed.** `WORLD_MAGIC = 1213486167` is `0x48545457`, written LittleEndian, so every `.hxw`
in the tree opens `57 54 54 48`. The value is **not** corrected — every saved world carries
it — but the one line a person reads before dumping four bytes to identify a file was wrong.
⚠ **It was found by a cross-check, not by reading:** `section_tag("HXW7") == WORLD_MAGIC`
disagreed by 262880, which said both that the packing was the wrong way round *and* that the
string was wrong. A tag convention held against itself would have passed either way. This is
the doc's own §G at a new seam — a name is not a measurement.

⚠ **THE TERMINATOR HAS TO BE END-OF-FILE, AND THAT IS WHY THERE IS NO VERSION BUMP.** The
obvious design writes a section *count* — but a count has to live somewhere, and every place
it can live is a byte a pre-section file does not have, so the reader is back to needing the
version to tell it whether to look. End-of-file is the one terminator a pre-section file
already satisfies. `f#size` and `f#next` are what make it expressible; `f#next` is `null`
until the first read, so the question may only be asked after the header.

⚠ **The one silent-corruption path was `world_save_incremental`, and it is not obvious.** It
compares a SHAPE — chunk and layer counts — and a section's length is not part of that, so a
world whose section *shrank* would have been written in place over a longer tail, and the
remnant loads cleanly as something untrue. It rewrites the block whole and cuts the file to
length now. Gated in both directions; only the shrink can leave a readable remnant.

⚠ **Three mutants, because a test that passes before AND after the change proves nothing.**
The pre-section fixture is the load-bearing gate here and it was green before any code was
written — so each instrument was fed something it should reject: a loader that demands a
trailing block (the exact `A1.3` risk) fails the fixture; an incremental writer that forgets
to cut the file fails the shrink; a full writer that drops sections fails six tests
*including* the forward-compatibility control, which is what says that control is not vacuous.

⚠ **`write_bytes` takes a `vector<integer>` EIGHT BYTES TO THE ELEMENT.** Rebuilding a
truncated byte vector to make a torn-tail fixture produced a 200 KB file and a `WL_MAGIC`
refusal — a real refusal of a file the test never meant to build. `f#size = n` truncates in
place and is what the test uses. A fixture that fails to build reports the code's failure
instead of its own, which is `A1.1`'s finding arriving a second time.

### What `A1.2` turned up

⚠ **A ROUND-TRIP TEST ALONE PROVES NOTHING**, and the controls are what say so. With
`part_diff` stubbed to always answer *"same"*, the three round-trip tests still **pass** and
only the controls fail. So there are four: a one-cell change after loading, a cell **gained
outside** the disc (a sweep bounded at the radius cannot see that kind at all), a changed
world **constant** (no per-cell walk can see it), and — the strongest — two parts differing by
one cell **saved, loaded, and compared through the files**, so the format itself has to carry
the difference.

⚠ **AND PASSING A STRUCT FIELD TO A `&`-PARAMETER DIVERGES BETWEEN BACKENDS.**
`world_set_column(lr.wl_world, …)` compiles interpreted and fails `--native` with a bare
`error[E0308]: mismatched types` and no span. Filed as
[loft#745](https://github.com/loft-lang/loft/issues/745); binding the field to a local first
passes on both.

⚠ The runner reports only the error code, so **eight tests failed and the cause was one
expression in one of them** — a test-by-test bisection was the only way in. That is worth
remembering: a native-only failure with no span is a bisection, not a read.

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

⚠ **`A1.3` was the one genuinely risky step**, because it changed a format that already has
worlds saved in it. It is additive by construction — sections go *after* everything an
existing reader reads — and the test that mattered was that a **pre-section file still loads**.
Writing it first is what made the fixture honest: it was captured from the writer as it stood,
before a line of the mechanism existed, so it is bytes the new code cannot have influenced.

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
