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
| ✅ `A1.4` | `PART` (kind, name, description) and `ANCH` (cell, height, facing) over that mechanism. | **DONE.** `lib/hex_part/src/meta.loft` + `codec.loft`, 43 tests, both backends. The older-reader gate compares the LANDSCAPE of a dressed part against a bare one through `part_diff`, never calling `part_meta`. ⚠ **Two loft panics, a store lock, and a text view that should never have existed** — see below. | S |

### What `A2.2` turned up

⚠ **"PIXEL-FOR-PIXEL" WAS THE WEAKER CLAIM, AND THE STRONGER ONE WAS AVAILABLE.** The step was
written expecting a picture comparison. Measured, the two paths produce **the same world**:
same cells, same three owned edges, same layer LABELS, the same `w_next_id`, and the same
`w_tau` — on flat ground, on a slope the band has to cut into, and under a ceiling that
refuses both. That is checkable in a loft test with no browser at all, and it says things no
picture can: a label is invisible to every renderer, and `τ` catches a path that wrote every
column twice and photographed identically. ⚠ **The instrument follows from the claim** —
`STATE.md` §G — and here the claim was never really about pixels.

⚠ **`τ` AGREEING IS THE PART THAT COULD HAVE GONE EITHER WAY.** Both paths tick the clock to
exactly 20 for a 19-column house. Nothing was tuned to make that true; it falls out of both
merging the same bands onto the same ground. It is now asserted, because a stamped house
costing four times a procedural one is a real regression that no comparison of the RESULT can
see.

⚠ **THE EXTENT IS THE PART'S, NOT A RADIUS THE CALLER PASSES.** The obvious signature is
`part_stamp(w, p, cq, cr, rad)` mirroring `part_from_region`. A radius is a knob that can be
wrong quietly: too small stamps half a house and every count still agrees with itself.
`part_columns` walks the part's own chunks instead, so a part is whatever it is — and the
server's dirty halo is taken from that same extent rather than from `STENCIL_R`, or anything
larger than the built-in house would have its rim left undrawn.

⚠ **A ONE-CELL COLUMN NEVER TAKES THE STAMP'S LABEL, and the first seam test called that a
bug.** `world_merge_band_as` names *the layer this call creates, singular* — so over virgin
ground a one-cell column creates one layer, which takes `LABEL_GROUND`. A test part of
one-cell columns therefore reported one labelled layer across three chunks and read exactly
like a broken stamp. Measured against the procedure: **both paths put label 2 on every chunk**
of a real house, because every column of a house has two cells. The subject was wrong, not the
code. ⚠ The same shape as `A2.1`'s refused mutant: *check what the control actually
constructed* before believing what it reports.

⚠ **AND THE BLOCKER THAT PROVES ATOMICITY HAS TO BE DERIVED FROM THE COLUMN IT BLOCKS.** A
flat `143` sat ABOVE the last column's roof and was legitimately KEPT — no fold, no refusal,
and the test read as *the stamp ignores blockers* when nothing had blocked anything. It is
`top + 4` now, inside `eps`. Third instance of a control that did not perturb.

Four mutants against the equivalence, each caught by a different assertion: the naive offset
translation (cell counts), dropped wall edges (the edge comparison), no pre-flight (the
refusal test's *neither wrote anything*), and a fresh label per column (the label comparison
and the counter). A fifth, over the wire: a stamp that never marks its chunks dirty times out
waiting for the rebuild.

### What `A2.1` turned up

⚠ **A PART ALWAYS CROSSES FOUR CHUNKS, WHATEVER ITS SIZE — AND THAT IS `A7.4`'s NUMBER.**
`part_from_region` re-origins the cut so the centre lands on `(0,0)`, so a part's cells run
from `−rad` to `+rad`, and `chunk_of(-1)` is `−1`. Four chunks, each holding dense 1024-cell
layers. Measured: **the 19-column cottage is 65,928 bytes and uses 38 of 8,192 cell slots**
— 0.46%. Cutting it from `(16,16)` instead of `(0,0)` changes nothing, because it is the
*part's* origin that decides, not the source's.

Nothing is done about it: it is the store's density (`P6` — a layer is exactly 8 KB) meeting a
consumer it was not shaped for, and the fix is a design change — a chunk-aligned storage bias,
or sparse layers. `A7.4` owns it. ⚠ **The tool PRINTS the number every run**, so the deferral
cannot go stale while the parts grow.

⚠ **A MUTANT THAT GETS LEGITIMATELY REFUSED PROVES NOTHING, AND IT READS EXACTLY LIKE A BLIND
GATE.** The first perturbation of the built part was `ground_set(part, 0, 0, 900, …)` — and the
gate stayed green. That looked like `part_diff` failing to see a change for as long as it took
to check the return value: `1` is `CW_FOLD`, the write was refused because 900 would breach the
roof, and **nothing had been perturbed**. The instrument was fine; the control was the no-op.
This is STATE's lesson `D` from the other side — *check that the control actually changed
something* before concluding the gate is blind.

⚠ **`2>/dev/null` ATE THE ONLY THING THE GATE HAD TO SAY.** The first `make parts` discarded
stderr to hide loft's advice, and a mutant then failed the build with no message at all. It
greps for `^error:` now, so the assertion and its cell coordinate are what a failure prints.

⚠ **`part_diff` says nothing about EDGES**, so the tool counts them in the reloaded file: 35
walls and 1 door, read out of what was written rather than re-derived from the rule that wrote
it. A cut that dropped every wall would have passed the round-trip otherwise — which is not
hypothetical, because the same blindness in `map_to_stencil` lost 9 of a house's 17 walls and
hid because every count agreed with every other count.

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

⚠ **THE PIECE THAT LOOKED MISSING WAS NEVER MISSING, AND THE MECHANISM IT BOUGHT IS GONE.**
`A1.4` was built believing text → bytes was three lines with no way back, so `hex_world`
offered every section as **bytes and text both**, filled from one span at load. On the evening
of 2026-08-03 that premise was measured false (loft#748) and the view was removed: a section is
`sc_tag` + `sc_bytes: vector<u8>`, the store decodes nothing, and `lib/hex_part/src/codec.loft`
is **two lines each way**. What was measured on the way in:

| | |
|---|---|
| `for ch in s`, `ch as i32` | walks **characters** and gives the **code point** — `é` is 233, `中` is 20013. ⚠ So a byte-per-character encoding silently truncates anything past `U+00FF`: the `ML_LABEL_TOO_WIDE` class again. |
| ~~`integer as text`, `vector<u8> as text`, `"{u8}"`~~ | ~~**all refused.** There is no `chr`.~~ ⚠ **THIS ROW WAS WRONG.** The casts are indeed refused, but **`text_from_bytes(vector<u8>)` and `byte_at(i)` existed all along** — two releases before the report — and round-trip `"Café中!"` exactly, returning `""` on invalid UTF-8. They were absent from the *generated* reference (they sit after `--- Environment ---` in `default/03_text.loft`), and that page was the instrument. See [#748](https://github.com/loft-lang/loft/issues/748). |
| `f += text` | writes **UTF-8** — 9 bytes for the 6 characters of `"Café中!"`. |
| `f#read(n) as text` | reads it back **exactly**, and does not fall over on 3 bytes of non-UTF-8 (`FF FE 00` came back length 3). |

*"The file API is the only decoder in the language"* is what settled it: `world_load` reads
each section's span **twice**, as bytes and as text, and the library still interprets nothing —
it offers two readings and lets the consumer pick. `world_set_section_text` is the write half,
and a section loaded from a file is **byte-valued whatever it holds**, so a re-save emits the
bytes it was given.

⚠ **AND THE PREMISE WAS FALSE, MEASURED 2026-08-03.** `text_from_bytes` and `byte_at` had
shipped two releases before the report; they were missing from the *generated* stdlib
reference, which is the page that was swept for them
([#748](https://github.com/loft-lang/loft/issues/748) — a documentation defect, not a language
one). One `grep` over `default/*.loft` would have found them. **Grep the source, never the
generated reference, before calling a capability missing** — this tree's own instrument rule,
broken on a language question instead of on a picture.

The mechanism works and is gated, so it stays for now; what changes is that keeping it is a
CHOICE. Removing it — `hex_part` decoding its own sections with `byte_at`/`text_from_bytes` —
would take the second read, the `sc_is_text` flag and its stale-write trap, and the `MESH`
size caveat with it, and would put `hex_world` back to framing only.

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
| ✅ `A2.1` | A one-off tool: run `stencil_place` into an empty world, `part_from_region`, save to `data/parts/house/cottage.hxw`. | **DONE.** `src/part_build.loft`, `make parts`. The file is **committed** — a part is content, and a catalogue that is empty until somebody runs a make target is an empty catalogue. ⚠ **Three findings** — see below. | XS |
| ✅ `A2.2` | `14:` accepts a **part name** alongside its `roof_up`, loading and stamping the part. | **DONE.** `hex_part::part_stamp` + `hex_editor::part_place`; `14:<roof>,<part>`. ⚠ **The equivalence turned out to be stateable EXACTLY**, which is stronger than any picture — see below. `hex_editor` 233 tests, `hex_part` 37, `tools/gates/world/part_place.mjs` for the wire half. | M |
| ✅ `A2.3` | Retire the procedural path behind the authored one. | **DONE, and not as written** — the step assumed the wire's house had no PARAMETER. `stencil_place` no longer PLACES: it builds into a scratch world, `part_from_region` cuts it, `part_place` stamps it. All four `14:` gates pass **unchanged**. ⚠ See below. | S |

⚠ **`A2.3` AS WRITTEN COULD NOT BE DONE, AND THE GATES ARE WHY.** *"`stencil_place` no longer
reachable from `14:`"* reads as a small cleanup until you look at what `14:` carries: a
**`roof_up` parameter**, and three gates depend on it.
[`doorstep.mjs`](../../tools/gates/world/doorstep.mjs)'s entire ordinal-refusal control **IS**
the roof fence — *asked for 5, refused below the minimum 8, offered 8, residual 3, and nothing
written* — and `stencil.mjs` needs a roof that does **not** fit to test `F1`'s atomic refusal.
A saved part has one fixed roof, so making `14:` place a part would have deleted those claims
to make a sentence true. **A coverage cut wearing a tidy-up's clothes**, which is the trap
[CLAUDE.md](../../CLAUDE.md) names by that phrase.

⚠ **SO THE THING RETIRED IS THE PLACEMENT, NOT THE PROCEDURE.** `stencil_place` still says what
a house IS — footprint, pitch, walls, the one door — and no longer says where one goes. It
builds into a **scratch world** at anchor 0, `part_from_region` cuts it, and `part_place`
stamps it. Every house that reaches a real world, generated or loaded from `data/parts/`, now
arrives through the same code. That is the win `A2.3` was for; *one definition of a house* is
`A7.3`'s fight, and it wants an editable part in hand.

⚠ **THE SCRATCH TAKES THE TARGET WORLD'S CONSTANTS.** `u`, `ρ`, `ε`, `θ` are the rules a house
is built under, so fixed numbers would let a world with a wider ε accept a house that could not
have been built in it — `F1` passing in the scratch and refusing at the stamp, which reads as a
broken placement rather than a house wrong for this world.

⚠ **AND THE REFUSAL NUMBER HAD TO BE CARRIED OUT.** The first version reported `PS_FIT`, and
`stencil.mjs` went red on two lines. That looked like a gate to update — it was the message
getting **quieter**: `-10 - cw_code` encodes *which* rule refused (`-11` a fold, `-14` the
reserve) and `PS_FIT` says only *it did not fit*. `part_stamp` carries the store's own `CW_*`
out as `ps_fit`, so the same fact reaches the wire and the gate needs no edit. ⚠ A gate going
red is a question, not a chore.

⚠ **`ps_below` / `ps_above` had to come too.** What a band left ALONE is the whole difference
between a band and a replace — `stencil.mjs` reads them to prove a cave under the house and a
deck over it survived — and a stamp that placed the right cells and reported nothing kept would
pass every world comparison and still break that gate. Counted from the column **as it stands
after the write**, never kept by the writer: a writer's own tally only ever agrees with the
writer.

### A3 — instances

| | step | proves it | size |
|---|---|---|---|
| ✅ `A3.1` | `INST` section: part id · cell · heading · (bindings later). Written and round-tripped. | **DONE.** `lib/hex_part/src/inst.loft`, 73 tests in the package, both backends. The reference is by catalogue handle and the NAME COMES LAST, so a comma in it needs no escaping. ⚠ **The cycle check needs no depth bound, and a diamond is not a cycle** — see below. | S |
| ✅ `A3.2` | `expand(instance)` — derive an instance's cells, and everything nested under it. | **DONE.** `lib/hex_part/src/expand.loft`, 84 tests in the package. ⚠ **`I1` IS RETIRED, and measurement is what retired it** — derived cells carry no label, because the records are the authority and re-deriving REGENERATES. ⚠ The depth bound was taken here rather than in `A3.4`. | M |
| ✅ `A3.3` | `bake(instance)` — flatten to plain cells. | **DONE.** `lib/hex_part/src/bake.loft`, 95 tests in the package. `expand == bake` cell for cell, over paths that share only the part files and `un_origin`. ⚠ **THE FIRST FIXTURE COULD NOT FAIL** — see below. | S |
| ✅ `A3.4` | Depth bound (8) and the cycle check on save. | **BOUND DONE** (taken early, in `A3.2`), and now **a cycle reports as a CYCLE rather than a depth overflow** — measured wrong first. 9 refused / 8 accepted on both paths, plus the control that keeps the two rules apart. ✅ **The *on save* half landed in `A7.3d`** — and it needed a function `A3.4` could not have written: `part_cycle` walks a part that is on DISK, which is the version a save is about to replace, so the check a save needs is about the content in memory under the name it is about to take. `part_cycle_of` seeds the path with that name; without the seed the same content reads clean. | S |
| `A3.5` | Re-derive on part change. | **edit the part, the placed house changes** — one PNG before, one after, the diff is the claim | S |

### What `A3.1` turned up

⚠ **THE NAME COMES LAST, AND THAT IS THE WHOLE ENCODING DECISION.** An instance is one line —
`inst=<q>,<r>,<h>,<facing>,<part>` — and a part is addressed by its catalogue handle, which is a
FILE PATH, and a file name may contain a comma. With the name in front or in the middle,
`a,b/door` parses as two fields and the part is silently renamed; every escaping scheme that
fixes that is a second thing to get right in both directions. Putting it last means four splits
and then *the rest of the line*. It is `meta.loft`'s *split at the FIRST `=`* discipline applied
four times, and the test subject is `"house/porte café, 2 boards 中"` — because `A1.4` earned
the rule that an ASCII subject with no separator in it agrees with every encoding bug there is.

⚠ **THE TWO §P8 RULES ARE NOT ONE RULE.** *A part may not contain itself* and *depth is bounded
at 8* read as one sentence and are two programs. The cycle check needs **no bound at all**: each
step either finds a name already on the chain being walked, or descends to one that is not, and
the chain only grows — so it is bounded by the number of parts on disk. The depth bound is about
a RENDERER, where unbounded recursion is a hang. `A3.4` still has its work; what it does not have
is a bound this step already put in. Writing them together would have made this function look
like it had one.

⚠ **THE PATH, NOT A VISITED SET, AND THE DIAMOND IS THE DISCRIMINATOR.** A house with two
door-frames that both use the same leaf visits that leaf twice and is legal; a global `seen` set
calls the second visit a cycle and rejects exactly the sharing parts exist for. ⚠ **That test has
never been red and says so in its own comment** — the implementation never had a `seen` set. It is
a pin against the obvious "make it cheaper on a wide library" refactor, and it is not evidence
the walk works. What supplies that is the pair beside it: a fault **two links down**, and a fault
under the **second** sibling. Both were seen red — walking one level deep takes four tests with
it, and stopping after the first child takes one.

⚠ **THREE ANSWERS, NOT TWO.** `CY_CYCLE`, `CY_MISSING`, `CY_BROKEN`. A mistyped name and a part
that contains itself want completely different fixes, and one code for both makes a typo read as
a recursion the author cannot find — `A1.4`'s `MR_ABSENT` versus `MR_MALFORMED`, one arc over.

⚠ **AND §P8's *"checked on save"* HAS NOTHING TO HANG ON YET.** There is no save gesture (`A7.3`),
so the check would have been a function with no caller — this tree's own trap, and it has been
live twice this month. The server sweeps the library at startup instead and lists a faulty part
**greyed with its chain**, which is plan 18 `B6`'s mechanism doing exactly what it was built for:
`part|house/loop_a|0|contains itself: house/loop_a → house/loop_b → house/loop_a` on the wire.

⚠ **AND `INST` CARRIES NO IDENTITY FIELD, WHICH WAS TEMPTING.** §P4 says an instance's cells
become a layer under the instance's own label, so minting that label here would make the record
look complete. `A3.2` is what derives the layer; a label written by nobody is a field a reader
would trust and a writer would forget — permanent, because this is a file format.

### What `A3.3` turned up

⚠ **A `(0,0)` PLACEMENT MAKES THE FRAME COMPOSITION AN IDENTITY, so a one-level nest cannot
test it.** `bake` passed on its first run, all 95 green — and then `un_origin(cq, cr, dq, dr)`
was replaced with the naive `cq + dq` **deliberately**, and all 95 stayed green. At the origin
the two agree exactly, so the equivalence was comparing two paths that could not disagree.
Three levels is the smallest fixture that bites: the grandchild composes from `(2,1)`, where
`un_origin` gives `(6,2)` and the naive sum gives `(5,2)`, and the same sabotage then fails at
`cell 5,2: 1 cells vs 2`. **The test was seen red before it was trusted**, which is the only
reason it is evidence. ⚠ `A4.3` composes frames the same way when it binds an instance to a
socket, so its fixture needs the same depth.

⚠ **THE TWO PATHS ARE KEPT APART ON PURPOSE, and that is where the value is.** `expand` stamps
each part of the nest at composed WORLD coordinates, merging bands into terrain that is already
there. `bake` accumulates columns in a keyed table at PART-LOCAL coordinates and writes each one
once into an empty part. If `bake` had simply called `expand` into a scratch world the test
would have been two calls to one function agreeing with themselves.

⚠ **A TABLE, BECAUSE `world_set_column` REPLACES.** Two parts may land in one column — a door in
a wall is exactly that — so the flattening accumulates and inserts in height order, then writes
each column once. Last-writer-wins would lose a cell and every count would still agree.

### What `A3.4` turned up

⚠ **A CYCLE REPORTED AS A DEPTH OVERFLOW, FROM BOTH PATHS.** §P8's two rules meet at `expand`
and `bake`: a loop simply recurses until the bound stops it, so `h/a → h/b → h/a` came back as
*"'h/a' is nested 9 deep; the bound is 8"*. True, and useless — that library's deepest nest is
**two**, so the author is sent hunting for depth that does not exist while `part_cycle` already
knew the chain. Both paths now run the cycle walk **on the error path only** and return
`EX_CYCLE` / `BK_CYCLE` with the chain, so a healthy expansion pays nothing. ⚠ And the control
that keeps the rules apart: a genuinely nine-deep nest with **no** cycle must still report
depth, or the upgrade would have swallowed the other answer.

⚠ **THE CONSTANT WAS SHARED AND THE COVERAGE WAS NOT.** `A3.2` bounded `expand` and tested it
9-refused / 8-accepted; `bake` used the same `EX_MAX_DEPTH` and had **no depth test at all**
until here. A constant reaching two callers is not two gates.

⚠ **AND *"CHECKED ON SAVE"* STILL HAS NOTHING TO HANG ON**, exactly as in `A3.1`. There is no
save gesture until `A7.3`, so the server's startup sweep is still the only caller of
`library_cycle`. Writing the save hook now would be a function with no caller — this tree's own
trap — so `A3.4` is deliberately left at ◐ rather than claimed complete.

### A4 — sockets

| | step | proves it | size |
|---|---|---|---|
| ✅ `A4.1` | `SOCK` / `FITS` sections: name · cell · edge-or-heading · kind · size-class. Round-trip. | **DONE.** `src/sock.loft`, `hex_part` 101 → 119, both backends. ⚠ **The "edge-or-heading" slot is TWO fields**, and three text fields leave only one tail — see below. | S |
| ✅ `A4.2` | `socket_fit(frame, leaf) -> Fit{ok, reason, offer}` — pure, no world. | **DONE**, and **not as written**. `src/fit.loft`, 131 tests. ⚠ The struct could not be called `Fit`, a size class is **nominal**, and *"the nearest leaf that fits"* presumes an ordering the class design does not have — see below. | S |
| ✅ `A4.3` | Binding an instance to a socket instead of a coordinate. | **DONE.** `src/bind.loft`, 157 tests. Moving the frame from `(3,0)` to `(4,2)` with the binding UNTOUCHED moves the leaf — and the mechanism is an **absence**, see below. | M |
| ✅ `A4.4` | The 24-heading approximation, **measured and written down** (§ Open). | **DONE**, and it refuted the sentence it was sent to measure. `moros_map/tests/headings.loft` prints the whole table every run; `moros_map` 86 → 92. ⚠ *"Approximated"* was the wrong word for two thirds of them — see below. | S |

### What `A4.1` turned up

⚠ **§P3 SPELLS THE THIRD ELEMENT AS ONE SLOT AND IT IS TWO FIELDS.** A door hangs in one of a
cell's **six** edges; a statue faces one of the **twenty-four** headings. The ranges overlap, so
`edge 3` and `heading 3` are different joints that a single number stores as the same bytes, and
a reader that guessed would point half the sockets the wrong way with nothing in the file to say
so. Measured: with the mount dropped from the line the two records encode identically and **five
tests go red**, one at exactly that assertion. ⚠ **And the range check follows the mount** — a
flat `0 <= at < 24` accepts `edge 6`, which is not a side of a hexagon. The control is the pair:
the same index refused under one mount and accepted under the other.

⚠ **THREE TEXT FIELDS AND ONLY ONE TAIL, so `A3.1`'s *name comes last* does not reach.** What
separates them is who mints the name. `pi_part` is a catalogue handle, which is a FILE PATH — the
filesystem decides what may be in one, not us — so a comma had to be made *harmless*. A `kind`
and a `size` are tokens **we** mint, spelled identically on both sides of a joint or there is no
joint, so they can bear an alphabet and refuse outside it with a message naming the character.
The author-facing NAME keeps the tail, which is where the freedom is wanted; the test subject
carries a comma, an `=` and a `中`.

⚠ **`FITS` REFUSES A COMMA IT HAS NO SEPARATOR FOR, and that hole is silent.** Its payload is
`key=value` lines, so a comma survives it perfectly — but the token has to be spelled identically
by a `SOCK`, which refuses one. Accepting it mints a class that can be **claimed** and never
**offered**: the leaf saves, the frame will not, and nothing connects the two refusals. The check
is shared rather than restated, and a `FITS` given its own drifted copy goes red.

⚠ **ONE VALIDATOR, BOTH DIRECTIONS** — the reader runs the writer's check on what it parsed, so a
future writer's `mount=7` is malformed rather than a socket pointing nowhere. Skipping it costs
two tests.

⚠ **`FITS` IS ONE, NOT A LIST, ON `ANCH`'s ARGUMENT.** A part has one anchor because it is one
thing standing in one place, and one class for the same reason.

### What `A4.2` turned up

⚠ **THE STRUCT COULD NOT BE CALLED `Fit`, AND THAT IS THE BEST THING IN THE STEP.** The sketch
above says `Fit{ok, reason, offer}`; `hex_editor::gesture` **already has** a `Fit`, and a loft
struct name is global across a consumer's whole dependency graph — so the two merged and `make
parts` stopped with *cannot assign text to field `Fit.sf_code` of type integer*. ⚠ **`hex_part`
alone was 131 green while the editor would not build**, so a package suite says nothing about
this class of mistake; only a consumer does. `hex_editor::names` hit the identical wall and
answered `NameFit`; this answers `SocketFit`.

⚠ **AND THE COLLISION WAS NOT A COINCIDENCE — THE EDITOR HAD ALREADY SETTLED THE HARD PART.** Its
`Fit` splits parameters into ORDINAL and NOMINAL: *"255 is not 'nearly' 256, it is a different
thing entirely, and offering it reads as a small correction while changing what the wall is made
of"* (`X68`). **A size class is nominal by exactly that argument** — which this step had already
concluded from §P3's own examples, independently, before the build broke.

⚠ **SO *"a leaf too wide is refused with … the NEAREST leaf that fits"* PRESUMES AN ORDERING THE
CLASS DESIGN DOES NOT HAVE.** §P3's three examples are `door/2x3`, `pillar/round-3` and
`statue/plinth-2`: one reads as a width by a height and two do not, so *wider* is undefined over
two thirds of the design's own vocabulary, and an edit distance over `2x3` and `3x3` would be a
guess wearing a number's clothes. Built instead, and it is what an author can act on: the refusal
carries **the frame's actual class** (`sf_offer`, spelled `door/2x3`), and `parts_for_socket`
names **every** part in the library that fits. Exact and complete beats near and ranked.

⚠ **AND THE OPACITY IS WHAT ENFORCES §P3's OWN *"not silently scaled"***. Given `2x3` and `2x4` as
numbers, some later caller finds *close enough* irresistible and the refusal becomes a coercion.
`02x3` does not fit `2x3`, pinned as a test, so that cannot land quietly.

⚠ **NO `ok` BESIDE THE CODE**, parting from `NameFit` on purpose: `nf_reason` is a sentence so
`nf_ok` carries something it does not, while `sf_code` is a code and an `ok` beside it is the same
fact twice.

⚠ **THREE REJECTIONS, ONE BEHAVIOUR — measured, not assumed.** Deleting **both** of
`parts_for_socket`'s guards leaves all 131 tests green, because a failed load and a malformed
section both arrive as `PartFits {}` and `socket_fit` answers `SF_NOTHING` on an empty claim. The
guards stay for the case no fixture can pose — a store that recovered PART of a damaged file would
hand back a stale but well-formed `FITS` — and both the code and the test now say the coverage is
not what it looks like.

⚠ **`part_file` MOVED TO `catalogue.loft`, AND IT WAS ONE FACT IN TWO SPELLINGS.** It sat in
`inst.loft` with a literal `.hxw` while `is_part_file` matched on `PART_EXT` three files away, so
a change to either alone gives a catalogue listing parts nothing can open, or a loader hunting for
files nothing lists. They share the constant now; breaking the tie again costs **34 tests across
five files**.

### What `A4.3` turned up

⚠ **THE INVARIANT IS AN ABSENCE, SO IT IS ASSERTED AS ONE.** A binding stores no coordinate, and
that *is* the mechanism — there is no second position to forget to update.
`test_a_binding_stores_no_position` reads the `BIND` bytes before and after the frame moves and
requires them **identical**, with the `INST` bytes differing as the control. A `bd_q` added later
"for convenience" would end the design without failing any test that only looks at where cells
landed; this is the one that would go red.

⚠ **`A4.1` HAD TO BE AMENDED, AND THE GENERAL FORM OUTLIVES THE FIX.** It gave the socket name the
tail of the line and a test asserting **a comma in it survives**, on the argument that of three
text fields the author-facing one should keep the freedom. A `BIND` record is `<instance>,<socket
name>,<part handle>`; the handle is a FILE PATH so it must take the tail, which puts the socket
name between two commas. So: **a field's freedom depends on whether anything ever REFERS to it,
and that is not knowable when the field is designed.** `A4.1`'s own rule already covered it — *a
token spelled identically on both sides of a joint is one we mint and may restrict* — the field
just had no referrer yet. The multibyte half of that test stays; only the comma went.

⚠ **AND THE NAME BECOMING A KEY HAS A SECOND HALF: no two sockets on one part may share a name.**
`socket_index` would answer with the first, silently, for ever. §P3 writes a porch's columns as
`column-1..4` for exactly this reason; the refusal makes that a rule rather than a habit. It is a
per-LIST check, so unlike every other rule here it cannot ride on the per-line parse.

⚠ **A BINDING NAMES AN INSTANCE, NOT A PART.** A house with two door-frames binds `0,leaf,oak` and
`1,leaf,ash` — the same socket name on two instances of one part. Binding by part would make the
two frames indistinguishable, which is the coordinate problem wearing a different hat.

⚠ **`socket_index` ANSWERS `-1` AND NOT NULL**, because a nullable index invites `?? 0` — a
**valid** index, which binds to the first socket whenever the named one is missing. Sabotaged to
`0`: a misspelled socket resolves, and a part with no sockets at all reports the wrong refusal.

⚠ **`bake` HONOURS BINDINGS TOO, AND SKIPPING THAT WOULD HAVE BEEN SILENT.** `A3.3`'s
`expand == bake` is the strongest test in this design and **its fixtures have no bindings**, so
teaching only `expand` would have left every test green while the two paths disagreed about every
bound leaf. Measured: `bake` with its binding loop disabled costs four tests. What is shared is
the socket LOOKUP — `socket_for_binding`, which is also where `A4.2` finally gets a consumer — and
what stays separate is the COMPOSITION, world coordinates against part-local. That is the line
`A3.3` actually draws, and sharing the contract check does not cross it.

⚠ **FOUR REFUSALS, NOT ONE**: the part is absent, it is damaged, the socket is misspelled, or the
thing does not go in that hole. The misspelling **lists what is offered**, because *no socket
called 'leef'* is unactionable on a part with four of them. And a socket handing out a non-zero
heading is refused rather than expanded flat — `pi_facing`'s rule, with `A4.4` the place it gets
applied.

### What `A4.4` turned up

Measured on a 37-cell disk with 90 interior adjacencies, printed every run:

| headings | what happens |
|---|---|
| `0 4 8 12 16 20` (the 60° multiples) | **exact** — nothing lost, nothing torn, residual zero to the last bit |
| the 15° and 45° families (12 of them) | **well-defined and wrong** — 12 of 90 adjacencies tear, worst residual **0.522** hex steps against a covering radius of 0.577 |
| the 30° family (6 of them) | **arbitrary** — six of the 37 points land *exactly* on a cell boundary; 18 of 90 tear; at **90°** the tie-break puts two cells on one |

⚠ **§Open's JUSTIFICATION FOR 24 WAS A CATEGORY ERROR.** It read *"the editor's own wall runs use
24"* — that 24 is `hex_shape::hexwall`'s `d24`, whose own header says **"THE 24 DIRECTIONS, AND
WHY ONLY 12 ARE FOR HOUSES"** and **"HOUSES ARE NEVER DRAWN WITH AN IN-BETWEEN ANGLE"**. A wall
run is a one-dimensional path and may STAIRCASE; a part is a body, and rotating a body is a map
from the lattice onto itself. `STATE` §B's shape: *a sentence that mentions a seam is not a seam
argument.* PARTS §Open is corrected in place, with the old wording kept in view.

⚠ **THE NUMBER THAT MATTERS IS THE ONE NOBODY WOULD HAVE LOOKED FOR — torn adjacencies.** No
cells are lost, every count agrees with itself, and the house has holes in its walls. A residual
on its own reads as *half a cell, close enough*; 12-of-90 broken neighbours is not close to
anything, and it is the reason *approximated* was the wrong word.

⚠ **THE ONE ODD ROW IS EXPLAINED RATHER THAN LEFT TO BE MISREAD.** 90° loses two cells and 270°
loses none, which reads as a defect in one of them. Both have the same **six boundary ties**; at
90° the deterministic round sends two of them the same way. **The two rows differ by a rounding
convention, not by an angle** — measured with a second instrument added for exactly that question,
because an unexplained number in a table gets read as whatever the next reader expects.

⚠ **THE FLOAT INSTRUMENT IS HELD AGAINST AN INTEGER ONE BEFORE IT IS BELIEVED.** A rotate-and-snap
over floats reporting an absence is the instrument this tree distrusts most, so at the six exact
headings it must land every cell exactly where `hex_field::cell_rot` puts it — and the turn
DIRECTION is measured rather than assumed (`lattice_rot60`'s comment says counter-clockwise,
`moros_map`'s says `cell_rot` turns clockwise). Three controls stop `agrees` saying yes to
everything.

**What changed:** `FACINGS` stays 24 — the record is the heading an author *asked* for, and one
heading space shared with the runs is worth having — and `expand`/`bake` now name the measurement
in their refusal instead of promising `A4.4` will implement it.

**What is left, and it is not part of `A4.4`:** applying the six needs a lattice rotation
`hex_part` has no dependency for. Its `loft.toml` forbids one — *"no lattice math: those belong to
whoever places the part"* — on a premise that has since moved, because the package now **contains**
the placer (`stamp`, `expand`, `bake`). ⚠ And one open question that is **not** a lattice question:
`moros_map` has twelve exact *placements*, six turns plus six **flips**, and a flip is a mirror —
a house at a 30° hour has its door on the other side. Whether a part may be mirrored to reach
those six is an authoring call.

### A5 — fittings

| | step | proves it | size |
|---|---|---|---|
| ✅ `A5.1` | Hinge in `PART`: axis, range. Round-trip. | **DONE.** `src/hinge.loft`, `hex_part` 157 → 170, both backends. ⚠ The first section in this format to carry a **float**, so `A1.4`'s *"an integer written as text round-trips exactly"* had to be re-earned — see below. | S |
| ◐ `A5.2` | State on the instance, and the renderer honours it. | **STATE HALF DONE**; the RECORD half done 2026-08-06 — the swing and the hinge now reach `MeshAt` (4 tests, three sabotages red, one of which was a control that could not fail). What is left is the DRAWING: the editor still discards `ex_meshes`. `bd_open` on the binding, `swing_fit` fencing it, and `F-STATE` measured: a door saved 0.125 open reloads 0.125. ⚠ A cell leaf has **two** drawable positions in a door's whole swing — see below. `hex_part` 170 → 180 → 246. | M |

### What `A5.1` turned up

⚠ **THE FIELDS ARE `moros_sim::Link`'s, IN ITS ORDER AND ITS UNIT.** FITTINGS §1 says a leaf is a
`Body` on a `Mount` link whose axis is the hinge and whose limits are in TURNS, and
`assembly.loft`'s own warning is the reason to match rather than invent: *"Two units for one
quantity is how a conversion goes missing."* A degrees-here / turns-there hinge reads perfectly in
both files. ⚠ Matching a vocabulary is not importing it — `hex_part` still depends only on the
store.

⚠ **`A1.4` ARGUED THIS FORMAT FROM *"an integer written as text round-trips exactly"*, and every
section since held integers.** A swing limit is a fraction of a turn, so the argument had to be
re-earned rather than inherited. It holds — `0.1`, `1/3`, `π`, `√2`, `1e-300` and `1e300` all come
back bit-equal through a save and a load — with the control that makes that mean anything:
`0.1 + 0.2 != 0.3`, so the comparison can see one bit. A writer rounding to six decimals hands
back `0.3` and two tests go red.

⚠ **INFINITY ROUND-TRIPS PERFECTLY AND IS REFUSED ANYWAY**, and the gap between those two facts is
the finding. The format has no trouble with `inf`; geometry does — a hinge POINT at infinity is
not a position, a swing LIMIT at infinity is not an angle, and `hi - lo` on infinite limits is
NaN. `moros_sim` spells *free* as a finite ±1000 turns. `x * 0.0 == 0.0` catches NaN and ±inf in
one expression; `x == x` alone lets an infinity through.

⚠ **AND THE FIRST VERSION OF THIS CLAIMED THE OPPOSITE, ON A PROBE THAT LIED.** It reported that
`inf` wrote fine and read back malformed. The probe was wrong, and the way it was wrong is
**[loft#767](https://github.com/loft-lang/loft/issues/767)**, filed: *a string literal nested
inside an interpolation keeps its own `{…}` as LITERAL text*, so `"{("{x}" as float?) ?? 0.0}"`
reads `{x}` back as unparseable and reports the default — **a silent wrong value with no
diagnostic**. A confident absence from an instrument nobody had checked against something it
should find, which is this tree's own rule broken on a language question rather than on a picture.

⚠ **THE AXIS IS STORED AS GIVEN, NOT NORMALISED.** Normalising hands the author back a different
number than they wrote — `meta.loft`'s rule about a name and the store's `WS_PALETTE` rule before
it. `moros_sim::has_axis` asks only that one component be non-zero and this asks the same, so a
leaf writable here is not inadmissible there; a check that only looked at `z` passes every door
and fails every trapdoor, and the control catches it.

⚠ **BACKWARDS IS REFUSED AND EQUAL IS NOT** — `assembly.loft` draws the line in the same place. A
leaf pinned shut is a thing an author may want; a range no swing can satisfy is not, and swapping
the two would invent a range nobody wrote (`F-SWING`: *never clamped silently*).

⚠ **NO COUPLING TO `PART.kind`**, on purpose: refusing a hinge on a `PK_HOUSE` would make the two
sections' WRITE ORDER load-bearing — set the hinge first and a legitimate leaf is refused.

⚠ **And one fixture could not have failed as first written**: the float round-trip used
`lo: 0.0, hi: x`, which makes `-0.375` a legitimately backwards range, so the range check refused
it and the round-trip never ran for that value. `lo == hi == x` is admissible for every `x`.

### What `A5.2` turned up

⚠ **THE SECOND CLAUSE IS NOT BUILT, AND THE REASON IS A NUMBER RATHER THAN A SHRUG.** `A4.4`
measured that only the six multiples of 60° move a body without tearing it, and 60° is a **sixth
of a turn**. So of the continuum a door swings through, a leaf made of CELLS could be drawn at
exactly the multiples of 1/6 — and a door's `0 .. 0.25` range contains **two** of them: `0` (shut)
and `1/6` (60°). Nothing between, so a cell leaf cannot be *ajar by a little* and cannot be
animated through the gap at all. `swing_steps` computes it and the test pins **2**, with controls
at 1 (pinned shut), 7 (a full turn) and 0 (a range clearing no exact rotation).

`F-READ` wants *"a leaf ajar, not flush — a door at 0° is a rectangle on a wall; at 15° it is a
door"*, and 15° is a twenty-fourth of a turn. So the picture needs either the cell rotation `A4.4`
left unbuilt, **or a leaf that is a MESH** — which is `A6.1`, and is what FITTINGS §1 already
calls a leaf: *"asset + world state"*, not cells. Left at ◐ rather than claimed, as `A3.4` is.

⚠ **AN ANGLE IS ORDINAL, WHICH IS THE OTHER ARM OF `A4.2`'s FINDING.** There a size class turned
out NOMINAL — `hex_editor::gesture`'s *"255 is not 'nearly' 256"* — so a refusal could only report
what the frame REQUIRES. Here 0.3 turns really is *nearly* 0.25, so `F-SWING`'s offer-and-residual
is meaningful and is carried. Both arms of one distinction now sit in one package.

⚠ **AN INFINITE SWING IS NOT *TOO FAR OPEN***, which is what the test first asserted. An infinity
IS past the limit, so `WF_HIGH` looks right — until you write down what it offers: the residual is
`inf - hi`, which is `inf`, and **an infinite overshoot is not a correction an author can act
on**. A large FINITE swing is the control: 1000 turns is `WF_HIGH` with a usable overshoot.

⚠ **THE GUARD AND THE FENCE ARE IN DIFFERENT PLACES ON PURPOSE** — CLAUDE.md's *a guard belongs
where the thing arrives, and a fence where the value is USED*. Finiteness is checked in the
record; the RANGE is checked at the resolve, because the leaf's hinge lives in another FILE and
`part_set_bindings` has a world and no library root to find it with.

⚠ **A LEAF WITH NO HINGE MAY BE BOUND AND MAY NOT BE OPENED.** A pane, a fixed light, a
bricked-up panel are all legitimate things to put in a frame and all shut for ever; refusing the
binding would forbid them, and ignoring a non-zero swing on one would draw a state nothing holds.

⚠ **`BIND` CHANGED SHAPE**, which is a thing to do while a format is in flight and not after. No
`.hxw` on disk carries a `BIND`, so it cost nothing — and an older reader of a KNOWN tag
*misparses* rather than skipping, since `A1.3`'s skip-by-length only saves an UNKNOWN tag.

### A6 — prop parts

| | step | proves it | size |
|---|---|---|---|
| ✅ `A6.1` | `MESH` section: a `.glb` reference, over the existing `21:`/`22:`. | **DONE.** `src/prop.loft`, `hex_part` 180 → 191, both backends. Round-trip, and `part_mesh_loads` reads a FOREIGN glb out of the library. ⚠ The package took `glb_read`, and the fixture nearly went missing — see below. | S |
| ✅ `A6.2` | A prop part in the same library, in the same sockets. | **DONE.** `expand` grew a second output; `data/parts/prop/` grew a statue, a plinth and a shrine, built and gated by `src/prop_build.loft`. `hex_part` 191 → 212, both backends. ⚠ The heading refusal narrowed, `ANCH` got its first consumer, `bake` grew a refusal it needed, and the content found a hole no probe had — see below. | M |
| ✅ `A6.3` | Swap. | **DONE.** `data/parts/prop/seated` beside `statue`, and the shrine expanded bound to each. `hex_part` 212 → 217, both backends. ⚠ **It needed no new code**, which is the result rather than a shortcut — and two of its five tests would have passed on a design that stores a coordinate, until the fixtures were sharpened. See below. | S |

### What `A6.1` turned up

⚠ **THE PACKAGE TOOK A SECOND DEPENDENCY, AND ITS `loft.toml` RECORDS WHY THE PREMISE MOVED.**
*"A part IS a world … so this package needs the store and nothing else"* is true of a CELL part
and is half of §P5, which gives a part two possible bodies. `part_cycle` already tells a dangling
PART reference from a damaged one — *a mistyped name and a part that contains itself want
completely different fixes* — so saying only *missing* for a `.glb` that is present and corrupt
would be the `MR_ABSENT`/`MR_MALFORMED` collapse this package fights everywhere else, applied to
the one reference type it declined to open. The READER only; nothing here writes a `.glb`.

⚠ **NO `.glb` IS TRACKED IN THIS REPO, AND THAT NEARLY COST THE FIXTURE.** It began as a
committed `.glb` copied from `glb_read`'s foreign control, and **`git status` never showed it** —
`.gitignore:47` ignores `*.glb`, for the `moros_render` CLI examples that write them cwd-relative.
It would have passed here, been invisible to review, and been missing on every other clone.
`glb_read`'s own foreign test writes its bytes instead, and so does this one. ⚠ **Run
`git check-ignore` before adding any binary fixture to this tree.**

⚠ **AND IT IS FOREIGN ON PURPOSE.** A `.glb` written by `glb::save_glb` and read by `glb_read`
proves only that our writer and our reader agree with each other — `A3.3`'s complaint about a
`bake` that called `expand`. The bytes emit a JSON shape our writer never does: members
reordered, indented where ours is compact, members this reader ignores, u16 indices where ours
writes u32.

⚠ **`..` IS REFUSED RATHER THAN NORMALISED** — the wire's existing rule for a part name, and here
it guards a file OPEN two functions down: a document that can name `../../../etc/passwd` reads a
file its author never chose. The reader runs the writer's check, so a hand-edited escape never
reaches the loader. ⚠ With the control that keeps it from being theatre: `a.b/c.d` and
`statue/v1.2` still pass, so it refuses `..` and not every dot.

⚠ **A COMMA IS ALLOWED, AND THAT IS A DECISION.** A mesh name is a FILE PATH fragment like
`pi_part`, so the filesystem decides what may be in one. `A4.3` learned that a field's freedom
depends on whether anything REFERS to it — the response is not to restrict every field
pre-emptively, it is to know the rule: a later record naming a mesh among other fields gives the
name the TAIL.

⚠ **`mc_verts` IS A READ-BACK AND NOT A TALLY.** A check that reported `GR_OK` and stopped could
not tell a statue from an empty glb.

⚠ **AND `loft test` RUNS ANY ZERO-ARGUMENT FUNCTION THAT RETURNS NOTHING AS A TEST.**
`build_lib()` and `wipe()` were listed among the test functions and executed in the runner's
order, with `wipe` deleting the library between other tests — harmless only because every test
rebuilt first. **A parameter is what keeps a helper a helper**, which is why `catalogue.loft`'s
`wipe` takes one.

### What `A6.2` turned up

⚠ **`A4.4`'s REFUSAL IS ABOUT THE LATTICE, NOT ABOUT THE PART — and that is the step.**
Eighteen of the twenty-four headings tear a body's adjacencies, which is a fact about
something *on* the lattice. A part with nothing off its own origin has nothing a rotation
could displace, so all 24 are exact for it. `part_lattice_free` asks *what is displaced* and
names three answers: its own cells, a nested part at an offset, a socket it offers at an
offset. That is why a statue can face out and a house cannot.

⚠ **AND THE QUESTION IS NEVER *DOES IT HAVE A MESH*, WHICH IS THE WHOLE CONTROL.** §P5 lets a
part be BOTH — the pillar that is a `.glb` for the eye and a column for the walker — so the
rule *"a mesh part may face anywhere"* would turn that pillar to 18, tear the walker's column,
and agree with every count in the document. Sabotaged: writing that rule instead turns three
tests red, and only that spelling of the rule keeps them green.

⚠ **AN AIM AND A TURN ARE TWO QUANTITIES, AND SEPARATING THEM IS WHAT FINALLY GAVE
`part_anchor` A CONSUMER** — the thing `A4.3` predicted and did not deliver. An `INST`'s facing
and a `SOCK`'s heading say which way a thing should LOOK in the world; `ANCH`'s facing says
which way the part looks in **its own frame**; the turn applied is the difference. The
invariant is *which way a statue looks in the world depends on the socket, not on how the
author happened to model it* — without it, re-modelling the same statue turned by 6 stands it
turned by 6 in every socket in the library, with every number in every document unchanged and
nothing anywhere able to check the convention. Pinned as a sweep over seven authorings rather
than one value, because `own` is 0 in every part in this library today and a single case
passes on a formula that ignores the field.

⚠ **AND THE WRAP IS THE TRAP.** `(6 - 18) % 24` is `-12` here, and `-12` is not a heading —
STATE.md's lesson E is five bugs of exactly this shape, all below zero. The control aims a
statue *below* its own facing.

⚠ **A STATUE COULD NOT BE EXPANDED AT ALL BEFORE THIS STEP.** `part_stamp` answers `PS_EMPTY`
for a world with no columns and `expand_at` mapped every stamp failure to `EX_FIT` — so §P5's
second kind of part was unreachable through the one function that derives anything. Two lines,
and they were invisible because no fixture had ever been a part without cells.

⚠ **AND THE CONTENT FOUND A SECOND ONE THAT HAS NOTHING TO DO WITH MESHES.** A part whose only
body is the parts it HOLDS — §P4's ordinary composition — hit the same `PS_EMPTY`. Every
fixture in the suite had given its containers a cell of their own, so the shape was never
posed; authoring the shrine (*a plinth with a statue on it and nothing else*) posed it in one
run. ⚠ `bake` never had the hole — it walks columns directly and appends none — so
`expand == bake` had an asymmetry its whole suite could not see, for the same reason. Lesson F
again: **content exercising a mechanism finds what probes miss.**

⚠ **`bake` WAS SILENTLY DROPPING PROPS, AND NOW REFUSES.** `bake_at` reads columns and nothing
else, so a nest holding a statue flattened to `BK_OK` with every cell matching `expand`
exactly and the statue simply gone. It cannot be fixed rather than refused: a baked part holds
ONE `MESH` section and no position for it, so two statues at two places are not expressible in
the result. `BK_MESH` says so and names what would have been lost. **`expand == bake` is now a
claim about cell nests, stated rather than quietly narrowed.**

⚠ **`expand` DOES NOT OPEN THE `.glb`, AND THAT IS MEASURED RATHER THAN OMITTED.** Not one test
in `tests/place.loft` writes a mesh file and every placement still comes back;
`test_the_placement_is_derived_without_ever_opening_the_glb` expands a statue whose mesh is
absent from the library and then shows `part_mesh_loads` reporting `MC_MISSING` on the same
part. `part_expand` runs per edit and a glb parse per placement per edit is a cost the record
cannot pay; the answer would not change until the library does. ⚠ The seam is real and is
stated, not hidden: **nothing calls `part_mesh_loads` outside tests and `prop_build`**, so a
library shipping a dangling mesh reference is caught at build time and nowhere else yet.

⚠ **`MeshAt` CARRIES NO IDENTITY AND NO PART HANDLE**, which is `A3.2`'s rule for cells applied
to the other body: the records are the authority and everything downstream re-derives, so
there is nothing to keep in step. `ma_mesh` is the whole difference between one statue and
another, which is exactly what `A6.3` swaps.

⚠ **`ANCH`'s POSITION HALF IS STILL UNCALLED, ON PURPOSE.** Only its facing is read. A part's
origin is what lands where it is placed — `part_stamp`'s rule — and using the position half
for a mesh but not for cells would make `ANCH` mean two things depending on what the part is
made of, which is the one thing §P5 exists to avoid.

⚠ **`.gitignore:47` WOULD HAVE SWALLOWED THE LIBRARY'S MESH**, which is `A6.1`'s warning
arriving for real. `data/parts/` is content, not a scratch directory, so the rule now carries
`!data/parts/**/*.glb` — with the control that a `.glb` anywhere else is *still* ignored, and
the byte-identity that makes committing a generated file sane: two runs of `src/prop_build.loft`
produce the same md5 for all four files.

⚠ **THE SOCKET AIMS AT 18 BECAUSE 18 IS NOT ONE OF THE SIX.** A library whose demonstration
socket pointed at a multiple of 60° would work identically under the old blanket refusal, so
the gate asserts `ma_facing % 4 != 0` — the content has to be a thing a cell part could not do,
or it demonstrates nothing.

⚠ **PUTTING A STATUE IN THE LIBRARY BROKE THE CATALOGUE, WHICH IS THE PART A LIBRARY-ONLY STEP
WOULD HAVE MISSED ENTIRELY.** `part_thumb_wire` meshes a part's own chunks, and a part with no
cells has none — so the editor listed `prop/statue` as a **blank row** with *"meshed to
nothing"* in the log, and `probe/b1`'s *every catalogue row carries an image* went red. Measured,
not predicted: the gate named row 11 and row 12. **Fixed by drawing the mesh**, which is
`glb_read`'s first consumer that is not a test — `A6.1` built the reader and only the suite and
`make parts` had ever called it, this tree's *built and not called* trap, live. ⚠ It cost almost
nothing because **the two mesh types are one type**: `chunk_mesh_slot` and `glb_read` both hand
back `mesh3d::Mesh`, so `mesh_wire` takes the `.glb` unchanged, and both are `+Y` up.

⚠ **AND `Surface` HAD ALREADY SILENTLY MERGED IN THAT PROGRAM.** `hex_world::Surface` and
`moros_terrain::Surface` both exist; the literal `Surface { sf_r: … }` fails with five *"Unknown
field"* errors and no mention of a collision, and ⚠ **`moros_terrain::Surface` does not fix it** —
the return type is accepted and the constructor still resolves to the other struct. It had been
invisible for months because every caller reads `surface_at(i).sf_r` and never names the type.
Now a clause in [CLAUDE.md](../../CLAUDE.md): there is no routing around a taken name.

⚠ **A PART'S THUMBNAIL DRAWS ITS OWN BODY, NOT WHAT IT HOLDS**, so `prop/shrine` pictures as its
paving and neither the plinth nor the statue on it appears. Stated rather than left to be
discovered: the fix is `part_expand` in the thumbnail path, which is `A7`'s. ⚠ It is also why
the shrine has paving at all — a part whose only body is its children lists as a blank row, and
`hex_part`'s `test_a_part_whose_only_body_is_what_it_holds_expands` is where that shape belongs.

⚠ **TWO LITERALS IN THE CONTENT WERE WRONG AND BOTH LOOKED FINE.** `h_material: 3` for a stone
plinth is `FIELD_MAT`, so the catalogue listed a **bright green** plinth with every number in
every gate agreeing; and a cell has no *stone* at all, because `wall` is an EDGE material — the
five a cell may take are grass, road, field, floor and roof. The names are `hex_editor`'s and
the file now uses them. Separately, placing the shrine at height 0 on ground at 2 is refused by
the store — *"layer 1 is 2 above layer 0, needs 8"* — which is the world's `eps` doing its job:
a building is put ON a landscape, and the anchor is how.

⚠ **A HINGE SWING STILL CANNOT RIDE IN THIS RECORD, AND NOW THERE IS A PRECISE REASON.**
`A5.2` was left ◐ waiting for *"a MESH leaf"*, and one now exists and can be turned to any of
the 24 — including heading 1, which is the 15° `F-READ` asks for. But `ma_facing` is a turn
about the part's **origin** about the **vertical**, and a `Hinge` carries its own point
(`hg_ox/oy/oz`) and its own axis (`hg_ax/ay/az`) — a trapdoor hinges about a horizontal one.
Composing `bd_open` into `ma_facing` would swing every door about its centre and every trapdoor
the wrong way round. So `A5.2`'s renderer half needs the hinge and the swing **in the placement
record**, or a second record beside it; it is no longer blocked on *a number* but on *a field*.

⚠ **AND TWO FIXTURES PROVED NOTHING UNTIL THEY WERE MOVED.** `un_origin(0,0,2,1)` **is**
`(2,1)` — the shear vanishes on an even row — so the composition check passed on arithmetic
that is wrong everywhere else until the yard was put at (5,5). The same trap is why
`prop_build`'s shrine expands at (5,5) and asserts the naive sum disagrees.

### What `A6.3` turned up

⚠ **THE STEP NEEDED NO NEW CODE IN `hex_part`, AND THAT IS THE RESULT.** §P3's claim is that
composition by SOCKET makes *swap this for that* a one-field edit; if it were true only in prose,
these tests are what would have failed. So the whole step is fixtures and controls — five in
`tests/place.loft` and one in `src/prop_build.loft` — each written to name a field that a design
storing a coordinate, resolving a fit at write time, or caching a placement would have moved.

⚠ **AND TWO OF THEM PROVED NOTHING UNTIL A FIXTURE WAS SHARPENED.** Both statues were anchored at
`(0,0,0)`, so *the position is the SOCKET's* and *the position is the LEAF's* give the same answer
and the test cannot tell them apart. Sabotaged — `ma_q: cq + pa_q` — and it stayed green. The
swapped-in statue is now anchored at `(3,-2,7)` and the same sabotage moves it from `(8,6)` to
`(11,4)`. ⚠ **A control that cannot fail is the default state of a test about an ABSENCE**, which
is what `bind.loft`'s one invariant is.

⚠ **NO OTHER CHANGE IS MEASURED IN TWO PLACES, BECAUSE NEITHER CAN SEE THE OTHER.** `part_diff`
over the two expanded worlds says no CELL moved; the placement's four other fields say the STATUE
did not move. A design that dropped the plinth on a swap passes the second and fails the first; one
that shifted the statue does the reverse. ⚠ With the control that keeps `part_diff` honest —
swapping a mesh body for a CELL one asserts `!pd_same`, because an always-equal comparison
satisfies the first test forever.

⚠ **AND THE PLINTH IS NOT TOUCHED, MEASURED BY ITS mtime AND NOT ONLY ITS SIZE.** A file rewritten
with identical content keeps its size and moves its mtime; the pair is what separates *not written*
from *written back the same*. ⚠ With the control that the SHRINE's mtime did move — otherwise a
clock too coarse for a millisecond test would pass the assertion for a file the test rewrote itself.

⚠ **A SWAP CAN FAIL, AND `A4.2`'s TWO ANSWERS FINALLY MEET AN AUTHOR.** A wrong KIND names both
kinds (*takes a statue and this is a lamp*); a wrong SIZE names both full classes
(*takes statue/plinth-2 and this is statue/plinth-4*), because when the kinds agree the class is
the only thing that tells two statues apart. The first draft of the test demanded the full class
from the kind refusal — which would have buried the one word that matters in two that do not.

⚠ **A FILE SIZE CANNOT TELL TWO MESHES APART.** The control *the two statues are different assets*
was written as `size != size` and **failed immediately**: both figures are three boxes — 72
vertices, 36 triangles — so both `.glb` files are **3616 bytes** and differ only in float values.
Lesson G on a file rather than on a picture. The check reads the geometry back instead.

⚠ **AND THE THUMBNAIL MAKES *SIZE* INVISIBLE, WHICH TOOK THE PICTURE TO SEE.** The first seated
figure was simply a shorter standing one, and the two catalogue rows read as one statue drawn
twice — because `part_thumb_view` solves the camera to fill the frame **per part**, so *how big is
it* is exactly what a thumbnail cannot say. Only PROPORTION survives that fit. ⚠ The ink-pixel
count barely moved across the reshape (218/221 → 196/213) because a count over a fixed row window
saturates on the window; the silhouettes went from indistinguishable to obviously different. The
durable gate is on the MESH — the two aspects must differ by 1.5× — because a proportion is a fact
about the content rather than about how something framed it. Sabotaged with a shrunk statue: 0.618
against 0.622, refused, both numbers named.

⚠ **THE COMMITTED STATE IS WRITTEN LAST, BEFORE ANY COMPARISON IS ASSERTED.** `data/parts/` is
committed and this tree is worked by more than one agent, so the gate expands the variant first and
writes the shrine back to `prop/statue` before it checks anything — an assertion that fires cannot
leave the library holding the variant. Measured: `shrine.hxw`'s md5 is unchanged from `A6.2`.

### A7 — the picker

| | step | proves it | size |
|---|---|---|---|
| ✅ `A7.1` | The server lists `data/parts/` and sends it. | **DONE**, and the step was not where it looked. The list already arrived (#18 `B5.1`) — what was missing is that **nothing checked it was the whole library**, and that the list could not CHANGE. `tools/gates/world/library.mjs`, 13 checks; `library_moved` in the server; every gate now gets its own copy of `data/parts/`. | S |
| `A7.2` | The picker in the editor — ⚠ **this is #18 `B5`**, not a second widget. | one catalogue, both families | S |
| `A7.3` | A part-editing mode: open a part as a world, edit, save back. | **a house authored end-to-end without touching loft** — the acceptance test for the whole plan | M |
| `A8` | **§P9 — a limb is a building, and nothing is a custom mesh.** Broken down below. | a one-hex door and a three-hex gate with two leaves, all cells, all swinging | L |
| `A7.4` | Keyed reads, if two hundred parts make whole-file loading hurt (§P2). | measured in `w_tau` and milliseconds **before** it is built — the deferral from `A1` closed with a number, or closed as unnecessary | M |

### `A7.3` broken down, and the probe that shaped it

⚠ **THE MEASUREMENT FIRST: `held = wld` IS A DEEP COPY, NOT A SECOND NAME.** The whole shape of a
part-editing mode is *hold the world aside, point the gestures at the part, swap back* — so what
got measured before anything was designed is whether two `World` stores can be alive at once.
**They can**: two parts loaded together, a cell written into one, and the other's `w_tau`, its
columns and its sections all unchanged; the edited one saves and reloads with its sections and its
`PART.name` intact. ⚠ **But the swap is a COPY** — write through the second name and the first
never sees it, in either direction — while `c = v[0]` on the same struct type **aliases**. The same
assignment, opposite semantics, and nothing in the source separates the two:
[loft#774](https://github.com/loft-lang/loft/issues/774), filed, both backends agreeing.

⚠ **So the copy is the design rather than an accident to route around.** Holding the world aside by
assignment yields an independent snapshot, which is exactly what the mode wants. It costs a deep
copy of every chunk per switch — and **`w_tau` cannot see that cost**: the edit clock counts writes
that changed something, and a copy changes nothing. `A7.3a` measures it in bytes and milliseconds
or it goes unmeasured. The escape hatch, if it ever hurts, is the alias the same probe found: park
both stores in a vector and take `[i]`.

| | step | proves it | size |
|---|---|---|---|
| ✅ `A7.3a` | `44:<name>` opens a part as the edited store, `44:` alone closes back. The world is held aside, the subject line says `part <name>`. **No save and no new gesture.** | **DONE.** `tools/gates/world/part_mode.mjs`, 31 checks, five sabotages seen red — and the first of them exposed a check that could not fail. ⚠ **Four findings**, see below | S |
| ✅ `A7.3b` | The fence: which messages part mode REFUSES, before anything can write. | **DONE.** `tools/gates/world/part_fence.mjs`, 17 checks, four sabotages seen red including the **over-fence**. `14:<roof>,<part>`, `18:` and `21:` refused; everything else still edits. ⚠ **Two live defects found**, one of them silent data loss — see below | XS |
| ✅ `A7.3c` | `8:` SAVE routes by mode: in part mode it writes `parts_root()/<name>.hxw`. | **DONE.** `lib/hex_part/tests/save_edit.loft` (6 tests, 3 of them controls) for the format half; `tools/gates/world/part_save.mjs`, 19 checks, four sabotages seen red, for the routing half. ⚠ **The owner guard was tried and MEASURED OUT** — see below | S |
| ✅ `A7.3d` | The save check — `part_cycle` + `part_mesh_loads` where the save happens. **Closes `A3.4`.** | **DONE.** New library function `part_cycle_of` (6 tests) because `part_cycle` answers about the version on DISK; `tools/gates/world/part_check.mjs`, 18 checks, four sabotages seen red. ⚠ **`A3.4` IS NOW CLOSED** | XS |
| ✅ `A7.3e` | Save under a name that did not exist: the library grows while the editor watches. | **DONE.** `tools/gates/world/part_new.mjs`, 33 checks, four sabotages seen red. ⚠ **Three live defects found, two of them silent data loss** — a save into a family that does not exist reported success over a file that was never created; a name the catalogue can never list was accepted; and a save-as carried the ancestor's `PART.name`. New: `hex_world::WS_IO` + `world_file_size` (3 tests), `hex_part::part_name_ok` + `part_dir` (5 tests) | S |
| ✅ `A7.3f` | The joints on the wire — `SOCK`/`FITS` out, `parts_for_socket` answering, a `BIND` gesture. | `A4.2`'s function gets its first consumer and `A5.2`'s leaf gets somewhere to hang | M |
| ✅ `A7.3f1` | The gesture that makes a REFERENCE: in part mode `14:<roof>,<part>` writes an `INST`, and the picture comes from a DISPLAY world. **Lifts `A7.3b`'s fence.** | **DONE.** `tools/gates/world/part_inst.mjs`, 21 checks, four sabotages seen red. New: `hex_world::world_sections_key` (3 tests). ⚠ **Two live defects found, and the edit clock is blind to both** — see below | M |
| ✅ `A7.3f2` | `SOCK`/`FITS` on the wire for the open part, and `parts_for_socket` answering for a named socket. | **DONE.** `45:` with three forms; `tools/gates/world/part_sock.mjs`, 19 checks, four sabotages seen red. New library function `hex_part::socket_named` (4 tests) because the binding check asks two questions at once. ⚠ **`A4.2`'s `parts_for_socket` has its first consumer** | S |
| ✅ `A7.3f3` | The `BIND` gesture — instance, socket, part — with `socket_for_binding`'s four refusals. | **DONE.** `46:` binds, swaps and unbinds; `tools/gates/world/part_bind.mjs`, 18 checks, three sabotages seen red. ⚠ **§P8 WAS BLIND TO BINDINGS** — a whole class of cycle the check could not see; `cycle.loft` is its own file now (4 tests) | S |

⚠ **`44` IS THE NEXT FREE ID — 1 through 43 are all taken**, and it is one message with two forms
rather than an open and a close, which is `14:`'s own precedent. ⚠ **The subject line is part of
`A7.3a` and not a later polish**: a gesture landing in the store you did not mean is this mode's
one unrecoverable failure, so *which store am I in* has to be on screen before any gesture can
reach the part at all. The control is `B2.3`'s, one message over — **a refused open must not rename
the subject**, exactly as a refused load does not.

⚠ **AND THE CLIENT'S OLD GEOMETRY IS `A7.3a`'s REAL RISK.** Opening a four-chunk part after
walking a forty-chunk world must not leave thirty-six chunks of world drawn around it. `9:` LOAD
already has the precedent — `for ldc in loaded { mark_dirty_id(dirty, ldc) }` — but a *count* of
meshes the client holds cannot see a chunk drawn in the wrong place, and a *picture* cannot count
what is still cached. Both instruments, per `G`.

⚠ **`A7.3b` LANDS BEFORE THE SAVE, DELIBERATELY.** A mode you can enter whose dangerous doors are
still open is worse than no mode. `9:` LOAD would replace the part store with a world and leave the
mode lying about what you are editing; `14:<roof>,<part>` **stamps cells**, and a part inside a part
is an `INST` reference whose cells are derived (§P4) — so baking one in silently is the corruption
that cannot be undone from the editor. A refusal naming the gesture that does not exist yet is
safe; a world-shaped action in a part is not. Sabotage: let `14:` through and the part's cell count
grows by the leaf's, which is precisely the damage.

⚠ **`A7.3c`'s SHARP CONTROL IS THE NULL EDIT.** Open, save, change nothing — the file must be
byte-identical (`md5`) to what it was. A writer that reorders sections or re-derives a count passes
every *it round-trips* test and still churns a committed file on every open. ⚠ And the
**round-trip invariant is a loft test in `lib/hex_part/tests/`**, not a browser gate — only the
mode, the refusals and the stale geometry need a running world. ⚠ **The owner guard finally has its
case too**: the world's save passes `OWNER_ANY`, and a part library shared by two agents, the gates
and a human editor is exactly what `WS_CONCURRENT` was built for.

### What `A7.3a` turned up

⚠ **THE STORE IS NOT ALL OF THE WORLD, AND THE REGISTRIES HAD TO BE HELD ASIDE TOO.**
Wall runs, roof plans, door leaves, openings, annexes, annex walls, props, slabs and
holes are the **server's** records for the world being edited, not the store's — so a
part drawn while they are live has the world's walls standing inside it, and a close
that did not put them back leaves the author's house drawn as bare edge panels with no
roof. `part_thumb_wire` had already settled the same question in the same words
(*"a part has no wall runs, no roof plans, no leaves and no dressing of its own"*), so
the argument was not re-derived — it was read. ⚠ **And no message on this wire reads any
of them back**: `26:` and `15:` see the store, which the snapshot restores on its own.
The only instrument that reaches the registries is the PICTURE, which is why the gate
compares the client's whole mesh set before the open with the one after the close.

⚠ **TWO GUARDS SHIPPED WITH THE MODE RATHER THAN WITH `A7.3b`'s FENCE, AND ONE OF THEM
IS DATA LOSS ON DISK.** In part mode `wld` IS the part, so `8:<world name>` writes four
chunks of cottage over the world file of that name — from a message that looks exactly
like the save you meant. `9:` is the other: it would put a world into the store the
subject line calls a part and the mode would go on saying `part <name>` over it. ⚠ The
step's own claim is that **nothing in part mode can persist** (there is no save until
`A7.3c`), and `8:` was the one hole in it. Everything else the mode can reach is in
memory and goes when the mode closes — which is what makes `A7.3a` safe by construction
rather than by care.

⚠ **THE FIRST STALE-GEOMETRY CHECK COULD NOT FAIL, AND THE SABOTAGE IS WHAT SAID SO.**
*Every mesh id held before the swap was re-addressed after it* was built from `a.meshes`
— the **cumulative** arrival list — so the "after" set always contained the "before" set
and the check was vacuous. Removing the invalidation from the open left the gate green.
Slicing the list at the open is the whole difference between *these ids were
re-addressed* and *these ids exist*. `D` again, and it was the first thing tried.

⚠ **AND TWO MORE INSTRUMENTS WERE BLIND BEFORE THEY WERE AIMED.** `15:` COLUMN answers a
column's LAYER tops and a raise on the base plane creates no layer — so `column 0,0 = `
came back from the world both before and after, and *the world came back exactly* passed
comparing nothing with nothing; `26:` CELL is what sees a raise. And the check that the
world had a house in it matched `/house|placed/`, which the **refusal** *"house refused —
a footprint at this facing has no mitred corners"* satisfies perfectly — an instrument
reporting success on the sentence that says it failed. (Only six of the twelve placements
have mitred corners; the gate now faces 30° and requires `house placed`.)

⚠ **A RAISE LEAVES 22 OF 48 CHUNK GROUNDS STALE ON THE CLIENT — AND IT IS NOT THIS
FEATURE'S DOING.** The picture comparison reported 22 differences on its first honest
run, all of surface 0. Attributed by forcing the same full rebuild with `8:`/`9:`
instead of with the swap: the **same 22**. The swap is merely the first thing that ever
re-meshed everything at once, and what it exposed is that `raise_ahead` writes along a
ray while `mark_dirty` marks a disc around where that ray lands. Filed in
[OPEN_ISSUES](../../doc/claude/OPEN_ISSUES.md); the gate settles the picture with a
save/load before photographing it, and says why. ⚠ **A true measurement of the wrong
thing is worse than no check** — reporting those 22 as part mode's would have been a
gate that lies in the direction of looking rigorous.

⚠ **TEN PLAIN LOCALS RATHER THAN ONE `Held` STRUCT, AND THAT IS MEASURED, NOT TASTE.**
[loft#774](https://github.com/loft-lang/loft/issues/774): `b = a` from a local **copies**
and `out = hold.h` from a struct field **aliases**, both spellings identical. A struct
would have made the restore a second name for the held field under a word that says
snapshot, and the next open would then have held the part aside as the world.

**The five sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the open does not invalidate | 1 — *and 0 before the vacuous check was fixed* |
| the roof plans are not restored | 1 |
| the world store is not restored | 3 |
| the subject never names the part | 2 |
| the save guard is gone | 1 |
| a refused open renames the subject | 2 |

### What `A7.3b` turned up

⚠ **THE FENCE IS ON THE REFERENCE, NOT ON THE MESSAGE — AND THAT IS THE WHOLE STEP.**
`14:<roof_up>` and `14:<roof_up>,<part>` are the same message, and only the form carrying a
library part is refused: §P4 says a part inside a part is an instance whose cells are
DERIVED, so stamping one bakes it in and editing the leaf afterwards changes nothing. The
procedural form has no reference to preserve, so it is ordinary authoring and goes through.
⚠ **The gate's sharpest check is the OVER-fence**: refusing both forms fails
*"the procedural form is answered on its own merits"*, because a mode that cannot edit is
not a fence but a wall. A server refusing every message in part mode passes every refusal
check there is.

⚠ **THE OTHER RULE IS OWNERSHIP: a gesture whose state part mode does not hold aside leaks
out of the mode.** `18:` TRIGGER appends to `trigs` and `21:` IMPORT bumps `n_imported` and
mints world mesh ids — neither is held, so both would still be there, at the part's
coordinates, after the world came back. ⚠ **Holding them aside would be the wrong fix rather
than a smaller one**: the part format has no section for either, so one authored here could
never be saved, and a gesture that quietly cannot persist is the silent loss this step exists
to prevent.

⚠ **THE FIRST IMPORT GUARD WAS UNREACHABLE, AND IT READ AS PRESENT.** Written as its own
`else if ev.msg_id == MSG_IMPORT && in_part` arm placed *after* the real handler, the chain
never reached it — `21:` went on importing into parts while the code said otherwise. The
probe caught it because it asserted the **reason**: `21:` on a missing file is refused by the
glb loader anyway, so a fence that did nothing still showed *a* refusal. **A guard belongs
where the thing arrives**, which is this tree's own rule, broken in the same session it is
quoted in — and the check that survives is *refused by the FENCE and not by the loader*.

⚠ **`14:` BLANKED THE PART BEING EDITED, THROUGH A NAME COLLISION LOFT CANNOT WARN ABOUT.**
The stencil handler parses its payload into `part_name` — the same name `A7.3a` gave the part
being edited, in the same function scope, and **loft has no block-local declaration**:
measured, an assignment inside a nested block writes the outer variable. So every stencil in
part mode emptied the subject line and the close acknowledgement. Renamed to `stamp_part`;
the gate keeps a check on both, because the collision is invisible at each site on its own.

⚠ **AND THE ONE THAT WAS SILENT DATA LOSS: `wld` WAS ALIASING A DEAD RECORD.**
`wld = pt_ld.wl_world` reads a struct FIELD, which **aliases** (loft#774) — so the editor's
session-long world was a second name for a field of a handler-local that dies at the end of
the event. Measured with a `println` on either side of one call: `tau 20 chunks 4` →
**`tau 0 chunks 0`** across `stencil_part`, a function that never assigns to its argument. The
edit clock going **down** is the tell, since it is monotonic. The next `world_new` anywhere
landed on top of the store and a four-chunk part read as an empty world with no diagnostic.
Filed as [loft#775](https://github.com/loft-lang/loft/issues/775); the fix is to assign
through a local, which #774 measured to be a copy. ⚠ **The same shape sits in `9:` LOAD and
has not bitten** — it survives by one allocation, which is not a distinction worth keeping, so
it was fixed too.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the part form is let through | 3 |
| **the procedural form is fenced too** (over-fence) | 1 |
| the stencil's local goes back to `part_name` | 5 |
| the trigger guard removed | 3 |

⚠ The import guard needed no sabotage: it was **seen red in the wild**, answering
`import refused (1) /nonexistent.glb` — the loader's refusal — while the fence was unreachable.

### What `A7.3c` turned up

⚠ **THE OWNER GUARD WAS BUILT, MEASURED AND TAKEN OUT AGAIN — and the measurement is the
finding.** `X2` looked like exactly this case: a box running a human session, a gate suite and
more than one agent, where two processes writing one part file corrupts rather than errors. So
the save went out as `world_save_as(…, port)`, the port being the identity this server actually
has. **The null-edit check caught it on its first run**: the owner is a field IN the file, so
stamping it rewrites the bytes of a part nobody edited — open `house/cottage`, save, and the
committed file now differs from what `make parts` produces, which reads as a build break rather
than as a lock. Attributed by putting `world_save` back and watching the null edit become
byte-identical again. **A guard that dirties a committed file to protect it is the wrong trade at
this size**; what it wants is a save that knows whether anything was authored.

⚠ **AND THE NULL-EDIT CHECK IS WHY THE STEP HAD ONE.** It was written as *the sharp control* for
a writer that reorders sections — and what it actually caught was a deliberate feature of the
save. A control aimed at one failure found a different one, which is the argument for writing it
before there is anything to catch.

⚠ **THE FORMAT HALF IS A LOFT TEST AND THE ROUTING HALF IS A GATE, and the split is CLAUDE.md's.**
*A cell edit leaves every section untouched* is a claim about the store: `save_edit.loft` dresses a
part with all five sections, writes a cell, saves, reloads and compares the sections as text — with
a **dropped section** and a **changed byte** as controls, plus a third control that the byte digest
notices an edit at all. Only *the server routes `8:` by mode* needs a running world.

⚠ **THE WIRE CAN SEE THE SECTIONS SURVIVED WITHOUT READING THEM.** `44:` acknowledges
`opened as '<PART.name>'` and falls back to the handle when there is no `PART` section — so
*reopen and it still says `cottage`* is a one-line check on the whole record. Sabotaged by dropping
`PART` before the save: three checks fail.

⚠ **AN AIMED READ-BACK NEEDS AN AIMED GESTURE.** The first version raised three times and read
`26:0,0` on both sides — `cell 0,0 = 4,0` each time, because `5:` raises AHEAD of the walker and
not under them. `24:` writes an edge of the cell the walker is standing IN, which `16:` reads back
at exactly that cell: one gesture, one coordinate, one instrument. This is `A7.3a`'s `15:`-versus-
`26:` lesson in its third form, and it keeps arriving as *the check passed and measured nothing*.

⚠ **THE EDIT CLOCK IS RE-ANCHORED BY THE SAVE**, so a close straight after one reports **0 edits
discarded** — anything else and the message announces throwing away work that is on disk. Sabotaged
by leaving the anchor at the open: one check fails.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the clock is not re-anchored by the save | 1 |
| the `PART` section is dropped on the way out | 3 |
| a part save is written to the worlds root | 2 |
| the name fence is gone | 1 |

### What `A7.3d` turned up

⚠ **`part_cycle` COULD NOT ANSWER THE QUESTION A SAVE ASKS, AND THAT IS THE STEP.** It walks a
part that is **on disk** — which is precisely the version the save is about to replace — so it can
only ever report on the old content. What must be refused is the content in memory, under the name
it is about to take. `part_cycle_of(root, name, insts)` walks the candidate's instances with the
path **seeded by that name**, and the seed is the whole function: without it the question becomes
*are the parts it refers to sound*, which is much weaker and which the live case passes. There is a
test spelling exactly that out, so the difference is measured rather than commented.

⚠ **AND THE CYCLE IS REACHABLE WITH THE GESTURES THAT EXIST.** There is no instance gesture until
`A7.3f`, so it looked as though nothing could author one — but **save-as is enough**:
`prop/shrine` holds an instance of `prop/plinth`, and saved AS `prop/plinth` it is a part that
contains itself. The refusal carries the chain, `prop/plinth → prop/plinth`, which is §P8's own
rule: in a library of two hundred, *this part contains itself* is unactionable and the author needs
to know which reference to cut.

⚠ **THE FIRST PROBE OF THAT CASE WAS WRONG, AND THE LIBRARY CORRECTED IT.** Saving `prop/shrine`
as `prop/statue` was the obvious cycle and it is not one — the shrine's `INST` names only
`prop/plinth`; the statue arrives through a **binding**, not a direct reference. The check was
right and the premise was not. ⚠ **The gate now asserts its own fixture** — that `prop/shrine`
still holds an instance of `prop/plinth` — because if the library changed, every refusal below it
would quietly become a sound save.

⚠ **THE ORDERING IS THE PROPERTY, AND IT HAS ITS OWN SABOTAGE.** *The acknowledgement said no* and
*nothing was written* are different claims. Moving the checks to after the write leaves every
refusal string intact and fails exactly the two `md5` checks — which is the whole of what
`A7.3d` is for. A refusal that rolled back would already have replaced a good file, and any
failure in the middle would leave the library holding what the check refused.

⚠ **A REFUSED SAVE MUST NOT RE-ANCHOR THE EDIT CLOCK.** `A7.3c` re-anchors on success so a close
straight after a save reports `0 edits discarded`; if a refusal did the same, the author would be
told their work was safe and then watch it be dropped. Edit, refuse, close — the close still
reports the work as discarded, because it was.

⚠ **`MC_NONE` IS NOT A FAULT, and that control is load-bearing.** Most parts are cells and name no
mesh at all, so a check that treated the absence as a failure would refuse the whole family — and
would still pass every refusal check in the gate. Same shape as the over-fence control in `A7.3b`:
the interesting half of a check is what it lets through.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the check runs AFTER the write | 2 — *and every refusal string still appeared* |
| `part_cycle` on disk instead of `part_cycle_of` on the candidate | 7 |
| `MC_NONE` treated as a fault | 3 |
| the clock is re-anchored even when the save is refused | 1 |

⚠ **AND A FOURTH INSTRUMENT LESSON, FROM THE SUITE RATHER THAN FROM A SABOTAGE: A GATE THAT
SLEEPS REPORTS THE MACHINE.** `part_fence` and `part_check` passed alone and failed at
`GATE_JOBS=4`, because their `step()` waited a fixed 1.8–2.5 s for an acknowledgement that four
interpreted servers on one box take longer to produce. Polling for the answer instead is both
correct under load and **faster when idle** — `part_fence` went 58 s → 21 s and `part_check`
34 s → 11 s. ⚠ This is the third face of the `GATE_JOBS` flake and the only one that was OURS:
the other two are startup misses, this one is a gate measuring a clock instead of a claim.

⚠ **`A7.3e`'s ACCEPTANCE HOUSE MUST NOT BE `house/cottage`.** The cottage is *generated* by
`src/part_build.loft` and `make parts` verifies it byte-identically — so a cottage authored in the
editor is reverted by the next `make parts`, and the gate that checks the edit survived reads as
flaky rather than as the collision it is. The end-to-end house is a **new name with no generator**;
`data/parts/` holding both authored and generated content is fine, and which is which has to stay
legible.

### `A8` broken down — §P9, the limb that is a building

**Decided with the user 2026-08-06.** A part has ONE body: cells. A limb is meshed rather than
stamped, so the lattice's six-rotation limit never binds it, and the design aims at the GATE
because a wide door is where cells have something to say. The full argument is
[PARTS.md §P9](../../doc/claude/PARTS.md).

| | step | proves it | size |
|---|---|---|---|
| `A8.1` | `expand` hands back a bound leaf as a PLACEMENT rather than stamping its cells — a record naming a PART, not a `.glb`. | a cell leaf comes out of an expansion posed, with its hinge and swing, and its cells are in no world | M |
| `A8.2` | The editor meshes that part's own chunks and poses it. `part_thumb_wire` already meshes a part; this is the same call in the display path. | a cell-built leaf is DRAWN, ajar, with no `.glb` anywhere | M |
| `A8.3` | The one-hex doorway: `door/frame` (opening, socket `door/1x2` at the hinge cell) and `door/leaf`, both cells. | the picture `A5.2` was always for, without a custom mesh | S |
| `A8.4` | The three-hex gateway: `door/gateway` with `leaf-l`/`leaf-r` at class `door/3x3`, and two mirrored cell leaves. | a wide opening, two limbs, one joint each — and the class refusing a narrow leaf by spelling | M |
| `A8.5` | `prop/statue` and `prop/seated` become cell parts; `MESH` reverts to the import path it was before parts existed. | §P9 holds for the whole library, not just for doors | M |

⚠ **`A8.1` IS WHERE THE LAYERING BITES, AND IT IS WHY THE STEP EXISTS.** `hex_part` is a document
package and the mesher is `moros_terrain`'s, so `expand` **cannot** mesh a limb — it must hand
back a record and let the consumer do it. That is the same split `MeshAt` already has (`A6.2`:
*"the store holds columns; a mesh is a transform and a file name, so the only place it can be
delivered is back to the caller"*), with the file name replaced by a part handle.

⚠ **AND `MeshAt` LOSES `ma_mesh` IN THE END, WHICH IS THE SIMPLIFICATION §P9 BUYS.** While both
forms coexist the record carries a part handle *or* a mesh name; when `A8.5` lands there is only
the handle, and the `.glb` reader goes back to being `21:` IMPORT's.

⚠ **THE SOCKET SITS AT THE HINGE CELL.** For a three-hex opening that is a decision, not an
accident: the socket's position and the limb's pivot become one fact rather than two that can
disagree. A wide opening still has one socket per LEAF.

⚠ **A MESHED LIMB IS NOT IN THE STORE** — nothing walks on it, `sight_clear` cannot see it, and
collision does not know it is there. Stated in §P9 as a consequence rather than left to be found.

### What `A5.2`'s record half turned up

⚠ **IT WAS BLOCKED ON A FIELD, AND THE FIELD COST ALMOST NOTHING ONCE THE OWNERSHIP WAS RIGHT.**
`ma_facing` is a turn about the part's origin about the vertical; a hinge carries its own POINT
and its own AXIS, and a trapdoor turns about a horizontal one — so folding `bd_open` into
`ma_facing` would swing every door about its centre. `MeshAt` now carries the hinge (point, axis)
and `ma_swing` in TURNS, and the assertion that says why is the one on `ma_facing`: **the aim must
still be the socket's 18 after the swing lands**.

⚠ **THE HINGE IS THE PART'S AND THE ANGLE IS THE BINDING'S, WHICH IS WHAT MADE IT FREE.** A
hinge belongs to the leaf, so the expansion that just opened that leaf stamps it — the world is
already in hand. Reading it at the binding instead would open the same file a second time, per
placement, per edit, which is exactly the cost `part_expand` refuses to pay for the `.glb`. The
angle is written where the binding is resolved, from `sa_offer` — **the value `socket_for_binding`
has already fenced**, so the number checked and the number drawn are the same number.

⚠ **A ZERO AXIS IS *NOT HINGED*, AND THAT IS THE LIBRARY'S OWN RULE RATHER THAN A NEW SENTINEL.**
`hinge.loft` refuses an axis of zero length as `HG_AXIS` — *a revolute joint with nothing to turn
about* — so it can never be a real hinge, and the float default says *no hinge* for free.

⚠ **AND A CONTROL THAT COULD NOT FAIL, CAUGHT BY ITS OWN SABOTAGE.** *The swing lands on that leaf
and on nothing else* was written with the bound plinth as instance 0 and a loose statue as
instance 1 — and the sabotage that stamps the whole accumulated list went **green**, because at
the moment the binding resolves the statue has not been appended yet. There was nothing beside it
to damage. Swapping the two instances makes the same sabotage fail with *2 of the two placements
are swung*. **The order of a fixture is part of the test**, which is `D`'s lesson at a new site.

⚠ **`use hinge;` IS DECLARED RATHER THAN LEFT TRANSITIVE.** It compiled without, through `bind`,
and a reorder of the package's file list would have broken it silently — which is the same
declaration-order rule that forced the cycle check into its own file one step earlier.

**What is left of `A5.2` is the DRAWING**, and it is now the only thing left: the editor discards
`ex_meshes` entirely, so no expanded mesh is drawn at all — bound, swung or otherwise. The
precedent exists and is small: the catalogue thumbnail already draws a part's `.glb` through
`glb_read` + `mesh_wire`, and `chunk_mesh_slot` and `glb_read` hand back the same `mesh3d::Mesh`.
⚠ **Its acceptance is a COLD-RECOGNITION test and needs the user's eyes** — *does a person call it
a door* — so it ends in a picture handed over, not in a green suite.

### What `A7.3f3` turned up

⚠ **§P8's CYCLE CHECK WAS BLIND TO BINDINGS, AND THE RENDERER MET THE RESULT AS A DEPTH
OVERFLOW.** `walk` read `part_instances` and descended `pi_part`; nothing in it read
`part_bindings`. But `expand` and `bake` both derive a bound leaf's cells (`A4.3`), so a part
reachable only through a socket is as much *contained* as one reachable through an instance.
Measured before it was fixed, on a built fixture: a part bound into its own socket answered
**`CY_OK`**, and `part_expand` came back with *"'f/frame' is nested 9 deep; the bound is 8
(P8)"*. ⚠ **That is exactly the confusion `A3.4` spent a step removing** — *a cycle reports as a
CYCLE rather than a depth overflow* — and the separation held for one edge kind and not the
other, because until this gesture nothing could author a binding. ⚠ **`part_expand` converts a
depth overflow into a cycle report by asking `part_cycle`**, so one blindness made two answers
wrong.

⚠ **AND IT COULD NOT BE FIXED IN PLACE.** `bind.loft` already calls `part_instances`, so
teaching `inst.loft` to read `part_bindings` makes the two files mutually dependent, and loft
resolves a package's files in declaration order — `Unknown function part_bindings`. So the
check moved to `cycle.loft`, declared after both, which is the honest home for it anyway: the
question is about the whole graph, and it now lives where the whole graph is visible. A
package's files are one namespace, so nothing about its surface changed.

⚠ **`part_cycle_of` GAINED A REQUIRED FOURTH ARGUMENT RATHER THAN A DEFAULTED ONE.** A
candidate is its instances *and* its bindings; a signature letting a caller pass one and forget
the other is precisely the hole `walk` had. Required means the compiler makes every call site
face it — seven of them, and that is the only structural guard available here.

⚠ **A SECOND BIND SWAPS RATHER THAN REFUSING, AND THAT IS §P3 RATHER THAN A CONVENIENCE.**
*Composition by socket makes "swap this for that" a one-field edit* is the design's own claim,
and `A6.3` proved it needs no new code while having no gesture to reach it. `part_set_bindings`
refuses a duplicate (`BD_DUP`), so a gesture that could only ADD would leave an author stuck
with their first choice for ever — the unbind and the swap are what make the joint editable at
all, not extras.

⚠ **`socket_for_binding` IS THE RIGHT FUNCTION *HERE*, WHICH IS `A7.3f2`'s FINDING FROM THE
OTHER SIDE.** The query had no candidate and needed `socket_named`; the gesture has one, so the
question really is *may this go in that* — and `A4.2`'s `socket_fit` answers it. Its refusal
reaches an author for the first time, naming what the socket **takes** (`'top' takes
statue/plinth-2`) rather than what was wrong with the offer.

⚠ **WHAT THIS STEP DOES NOT CLAIM: THAT A BOUND LEAF IS DRAWN.** Both parts in the library that
fit the plinth's socket are mesh-only — `prop/statue` and `prop/seated` have **0 columns** — so
an expansion delivers them as `ex_meshes`, and `f1`'s display world is a `World`, which has
nowhere to put a mesh. Measured rather than assumed. The gap predates this step (`A5.2`'s
renderer half, `A6.2`'s *a mesh is not on the lattice*) and no gesture can author a `FITS`, so a
cell-bodied leaf that fits cannot be made from the editor either. Said in the gate's own header
rather than papered over with a check that would pass on a server drawing nothing.

**The three sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the walk stops following bindings | 3 — the cycle, its chain, and the name |
| no fit check on the bind | 3 |
| a second bind appends instead of replacing | 4 |

### What `A7.3f2` turned up

⚠ **A READ-BACK AND NOT A BROADCAST, WHICH IS THE WHOLE REASON IT CAN EXIST YET.** `A7.1`
deliberately did not push `SOCK`/`FITS` on connect, because a message no client reads is this
tree's own trap — and `socket_fit`/`parts_for_socket` had been built and tested since `A4.2`
with no consumer at all. A query has a consumer by construction: whoever asked. So `45:` joins
the `15:`/`16:`/`26:` read-back family rather than the `N:`/`W:` push family, and it needs no
client change to be honest. **`parts_for_socket` is called by something now.**

⚠ **THE FRAME IS THE INSTANCE'S PART, NOT THE OPEN ONE**, and getting it backwards produces a
message that answers confidently about the wrong part with every count agreeing. A cottage does
not offer the door-frame's `leaf`; the door-frame does. Sabotaged to ask about the open part:
four checks fail, and one of them reads `'prop/shrine' offers no socket called 'leef'; it
offers none` — a sentence that is true, about the wrong subject.

⚠ **ONE RECORD PER LINE, AND NEVER A SEPARATOR THE PAYLOAD MAY CARRY.** A part is addressed by
its catalogue handle, which is a FILE PATH and may hold a comma — `inst.loft` puts the handle
last in its own record for exactly that reason — and a socket name is free text. So a list
joined by anything mis-splits the day somebody names a part `oak,2/leaf`. A line each cannot,
and the lead line carries the count so a reader knows when the burst is complete.

⚠ **`socket_for_binding` ANSWERS TWO QUESTIONS AT ONCE, AND THE WIRE ASKS THEM APART.** *Does
this part offer a socket of that name* and *may this other part go in it* are one pass in the
library, because a binding always has both. A client listing what fits a joint has no candidate
yet — and asking with an empty one returns `'' is not in <root>`, which **reads as *the framing
part is missing*** and is really *the candidate is nothing*. An hour went into that, through
three wrong hypotheses (a later argument's temporary, a first-call effect, an aliased instance
record), each of which the measurement refuted: the caller's handle printed correctly at the
call site every time. ⚠ **The tell was in the data all along** — `45:0,top` failed and
`45:0,leef` succeeded, so it was never the arguments; it was how far into the function the two
got. **The library was right and the premise was wrong**, which is `A7.3d`'s finding at a
second site.

⚠ **SO THE SPLIT IS THE FIX, NOT A SECOND SPELLING.** `hex_part::socket_named` is the lookup
half; `socket_for_binding` is now that plus the fit check. The alternative was for the server to
call `socket_index` and compose the *lists what is offered* refusal itself — a second copy of a
sentence `A4.3` had already got right once, which is precisely how the two ends of a joint
drift apart. ⚠ **The old function's 157 tests are the control** and they stayed green through
the extraction, which is what says it was a refactor.

⚠ **AND THE FIXTURE WAS ALREADY IN THE COMMITTED LIBRARY**, which is what makes the answer
non-vacuous: `prop/plinth` offers `top @ statue/plinth-2` on heading 18, and `prop/statue` and
`prop/seated` both declare they fit it — `A6.3`'s swap. The answer is **2 of 5 parts**, and
that count is the discriminator: a lookup returning the whole library says 5, one finding
nothing says 0, and both pass a gate that only asks whether the list is non-empty. Sabotaged to
return `part_list(root)`: three checks fail.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the query asks about the OPEN part instead of the instance's | 4 |
| `parts_for_socket` returns the whole library | 3 |
| the refusal stops listing what is offered (`A4.3` undone) | 1 |
| a missing `FITS` reported as silence rather than said | 1 |

### What `A7.3f1` turned up

⚠ **THE FENCE BECAME THE GESTURE, WHICH IS THE WHOLE STEP.** `A7.3b` refused
`14:<roof>,<part>` in part mode with the words *"the gesture that makes one does not exist
yet"*. It does now, and the SAME message carries it — which is `A7.3c`'s rule for `8:` SAVE
rather than a new one: *put that part here* is one intent, and the MODE decides whether it
stamps cells or writes an `INST`. Two ids for one intent would make the author's hand learn
the store's internals. ⚠ **`part_fence.mjs` MOVED its claim rather than dropping it** — *a
part inside a part does not become cells* is now asserted against the STORE in
`part_inst.mjs`, which is a sharper instrument than a refusal string; what the fence gate
keeps is that the gesture is answered at all.

⚠ **WHAT SAVES AND WHAT DRAWS HAD TO BECOME TWO STORES.** §P4 says an instance's cells are
derived, so the authored part holds an `INST` line and no cells for it — and then nothing is
on screen. Expanding into `wld` itself is the one option that looks easy and is the corruption
the fence existed for: the leaf's cells become indistinguishable from authored ones, and
editing the leaf stops changing the frame. So the client is shown a DISPLAY world, the
authored one copied with every instance expanded into it. ⚠ **Probed before it was designed**:
the copy is 0 ms and the expansion 4 ms over the cottage's four chunks, and the control that
matters is that the authored store is untouched — 19 columns before and after, 20 in the
display. That control holds only because a whole-value bind COPIES
([loft#774](https://github.com/loft-lang/loft/issues/774), now `@PLN130` F7's decided rule);
if it ever aliases, this design silently becomes the baking it prevents.

⚠ **AND THE CACHE MUST COME FROM THE SAME STORE AS THE MESH.** `send_layers` and
`chunk_meshes_all` are one pair: layers from the authored part and a mesh from the expansion
would put the client's own derived ground an instance away from the server's, which `S3`'s
checksum reports as a *cache* disagreement naming nothing about instances.

⚠ **THE EDIT CLOCK CANNOT SEE A SECTION WRITE, AND THAT COST AN HOUR AND FOUND A SECOND
BUG.** Measured: a part loads at `tau 20`, an `INST` write leaves it at **20**, a `PART` write
leaves it at **20**, one cell write takes it to 21. `w_tau` counts writes to the store's CELLS
— which is exactly what makes it an exact cost instrument — so *has anything changed* is only
half answered by it.

- The half it broke here: the display trigger watched the clock, so the instance landed, the
  condition stayed false, and **the picture never moved while every acknowledgement said it
  had**. ⚠ The trace line is what found it, and only because it prints a count that can be
  zero — *0 derived columns* beside a successful gesture. A picture alone reads as *the
  expansion has no effect*.
- The half it had already broken, unnoticed: `44:`'s close reports `wld.w_tau - part_tau0`, so
  an author who placed an instance and nothing else was told **`0 edits discarded`** and then
  had it discarded. That is the exact failure the message was written for (`A7.3a`) and that
  `A7.3d` extended to a refused save; it became reachable the moment a gesture could write a
  section, which is this step.

`hex_world::world_sections_key` is the other half — every tag, its length, and a checksum of
its bytes — and it has both consumers. ⚠ **Its same-length control is the one that matters**:
a length-only key passes every test above and misses an instance whose facing was edited in
place. ⚠ **And its own control failed first, which is the control working**: the cell write
that proves the clock is not simply frozen was refused for a height under the world's reserve,
so the test would have passed on a clock that never moves at all. The code is asserted now.

⚠ **`for x in <call>().field` IS loft#775's SHAPE IN A `for` HEADER.** The first rebuild wrote
`for i in part_instances(part_disp).ir_items` and iterated a vector field of a call's temporary
while `part_expand` allocated into the very world it came from. It was not the cause of the
zero above — the clock was — but it is the same trap the editor has already been bitten by
once, and the list is read into a local now.

⚠ **§P8 IS CHECKED ON THE GESTURE, NOT ONLY AT THE SAVE.** An instance is precisely how a
cycle is authored, and `part_cycle_of` — built at `A7.3d` for the save — answers about
candidate content under the name it will take, which is the question here too. The author is
told while their hand is still on the gesture rather than at a save an hour later, and the
refusal carries the chain.

⚠ **FACING 0, AND THAT IS A MEASUREMENT RATHER THAN A DEFAULT.** Only the six multiples of 60°
turn a body on the lattice (`A4.4`) and `part_expand` refuses the other eighteen, so deriving a
facing from the walker's yaw would refuse most placements for a reason about the lattice the
gesture never mentions. A turn is its own gesture and does not exist yet.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the gesture stamps cells instead of referencing | 2 |
| §P8 not checked on the gesture | 3 — including *the refused instance left no section behind* |
| the display trigger watches only the clock | 1 — the picture, and nothing else |
| the close counts the clock only | 1 |

⚠ **AND TWO INSTRUMENTS WERE BLIND BEFORE THE THING THEY WERE AIMED AT.** `Q:` is the checksum
of the GROUND mesh and the plinth is a FLOOR cell, so the picture check read *nothing changed*
about a surface it does not cover. Then the layer comparison keyed on the whole `L:` header —
which carries the layer's VERSION, and the version moves with the content, so a CHANGED layer
looked like a brand-new one and the diff was empty. Both read exactly like *the feature does
not work*.

### What `A7.3e` turned up

⚠ **A SAVE INTO A FAMILY THAT DOES NOT EXIST REPORTED SUCCESS OVER A FILE THAT WAS NEVER
CREATED.** `8:newfam/thing` answered *"part 'newfam/thing' saved — 1 chunks, 2 sections"*,
renamed the subject line to the new part and re-anchored the edit clock — and nothing was on
disk. `file(path)` on a path whose directory is missing hands back a usable handle; every
write prints `file open error … (os error 2)` on **stderr**, which a server writing a log
nobody reads swallows entirely; and `world_save` returned `WS_OK`. Silent loss, from the one
gesture that exists to prevent it, and reachable by the most ordinary authoring act there is
— starting a new family.

⚠ **AND THE CURE IS TWO HALVES AT TWO SEAMS, WHICH IS THE INTERESTING PART.** *Did the bytes
land* is the **library's** question and it is now answered exactly: `world_file_size` computes
the file's length in closed form from the published `SZ_*` constants, `world_save_as` compares
it and returns the new `WS_IO`. *Which directories exist* is the **consumer's** question, so
the editor calls `mkdir_all` — because the acceptance test for this whole plan is *a house
authored end-to-end without touching loft*, and sending the author to a shell to make `house/`
is exactly the seam that fails. ⚠ **The length and not `exists`**: a missing directory is only
the cheapest way to lose the bytes, and a full disk truncates instead — which an existence
test reads as a good save.

⚠ **AND A SECOND, QUIETER LOSS: A NAME THE CATALOGUE CAN NEVER SHOW.** `8:a/b/c` wrote
`<root>/a/b/c.hxw`, reported success, and `part_list` walks **one level** — so the part was in
the library and in no catalogue, placeable by nothing. `8:house/` is the same failure a
shorter way: `.hxw` is not a part file. `hex_part::part_name_ok` is the **inverse of
`part_list`**, in the package that owns what a part name is, and its tests write the file and
then ask the lister rather than restating the rule — a fence that agreed with itself would
pass with `part_list` walking any number of levels. ⚠ It also **subsumes the `..` check three
handlers each spelled out**; one rule, and the wording moved with it (three gates updated,
because *"leaves data/parts/"* was already a lie whenever `EDITOR_PARTS` is set).

⚠ **A SAVE-AS CARRIED THE ANCESTOR'S NAME, AND THE ACKNOWLEDGEMENT IS THE ONLY INSTRUMENT AN
AUTHOR HAS.** `house/cottage` saved as `house/annexe` announced itself as *'cottage'* at every
placement, and two rows of the catalogue claimed one name — against §C2's *unique per kind*.
The new part takes the leaf of the handle the author just typed, which is §C2's own *a name
honest about being generated*. ⚠ **Only when the handle moved**, which is what keeps `A7.3c`'s
null edit byte-identical; ⚠ **and only when there is a `PART` section**, because a part without
one has no kind either and inventing one to carry a name is the server composing content.

⚠ **THE ACCEPTANCE HOUSE IS NOT `house/cottage`, AND THE REASON IS `make parts`.** The cottage
is generated and verified byte-identically, so a cottage authored in the editor is reverted by
the next build and the gate reads as flaky rather than as the collision it is. The cottage is
what is *opened*; `house/annexe` is what is authored, and it sorts FIRST — which is `A7.1`'s
row argument reused, because a catalogue row index is positional and an insert at the end
would pass a server that re-addressed only the new row.

**The four sabotages, each seen red:**

| what was broken | checks that failed |
|---|---|
| the `mkdir` and `WS_IO` both removed — the original silent-loss behaviour | 4 — ⚠ **and the acknowledgement still said `saved`**, which is the whole point |
| the `mkdir` removed, `WS_IO` kept | 5 — the same failure wearing a refusal |
| a save-as keeps the ancestor's `PART.name` | 1 |
| the depth fence lets `a/b/c` through | 3 |

⚠ **AND THE SESSION'S REAL LESSON IS AN INSTRUMENT ONE, FILED AS
[loft#777](https://github.com/loft-lang/loft/issues/777).** A **body-only** edit to
`lib/hex_part` was invisible to `src/editor_server.loft` while the *same source* was picked up
correctly by an 8-line consumer — `lib/*/native-auto/*.so` serves the stale build and does
**not** self-clear. It inverted the suite in both directions within one hour: the fence
sabotage looked like a **blind gate** (green because the server still ran the un-sabotaged
library), and then the restored fence looked like a **broken feature** (three checks red
against correct source). ⚠ The compile is fresh while the execution is stale — appending
garbage to the library file fails startup with a parse error naming that exact file, so it is
read, parsed, and then not used. **`rm -rf lib/*/native-auto` before any run that must reflect
a library edit**, and never trust a gate result taken across one without it.

⚠ **AND THE GREP THAT HID IT FOR HALF AN HOUR WAS THIS TREE'S OWN NAMED MISTAKE.**
`grep -l "editor_server" ~/.cache/loft/*.manifest 2>/dev/null` returned nothing and was read as
*"the build is not cached"*; the glob had blown the argument limit and the `2>/dev/null` ate
the error. A grep's default answer is **absent** — match a line you know is there first.

### What `A7.1` turned up

⚠ **THE LIST ALREADY ARRIVED, AND NOTHING CHECKED IT WAS THE WHOLE LIBRARY.** `subject.mjs` asked
for `parts.length >= 1` and that `house/cottage` was among them — which a server listing **one part
of five** passes happily. `A6.2` and `A6.3` had just added four parts that no gate could see. The
completeness check reads `data/parts/` itself and compares both ways: none missing, none invented.
⚠ With the instrument checked against something it should find, because a disk reader that returned
nothing makes *every part on disk is listed* vacuously true.

⚠ **AND THE LIST COULD NOT CHANGE, UNDER A COMMENT SAYING IT DOES NOT NEED TO.** `catalogue_wire`
went out once per connection beside *"the catalogue does not change during a session"* — while the
loop three hundred lines below already polled the same library twice a second for CONTENT
(`thumbs_refresh`, plan 18 `B5.3`). So the LIST was assumed frozen and the BYTES were not, in one
file, for months. A part appearing while the editor ran got no row and no picture ever; a part
removed stayed listed with a frozen thumbnail. ⚠ **That is a wall in front of `A7.3`** — *open a
part, edit, save back* is the acceptance test for this whole plan, and saving into a list that
cannot grow is a gesture with no visible effect.

⚠ **A CATALOGUE ROW INDEX IS POSITIONAL, SO AN INSERT RENAMES EVERY ROW AFTER IT.**
`pt_row = surface_count() + i` over a sorted list, and `W:`/`Y:` address a row — so the whole
thumbnail set has to go out again, not just the new part's. Re-sending one would leave every later
picture addressed to its neighbour: five parts drawn, four wrong, every count agreeing. **The gate
inserts a part that sorts FIRST for exactly this reason**; inserting at the end would pass the
broken server. Sabotaged: re-sending only the new row fails exactly that one check of thirteen.

⚠ **AND NOTHING IS SENT WHEN THE LIBRARY HOLDS STILL**, which is the control the rest of the gate
needs: a server that broadcast the catalogue every tick passes all twelve other checks. Sabotaging
the whole feature back to its pre-`A7.1` state fails six of thirteen.

⚠ **EVERY GATE NOW GETS ITS OWN COPY OF `data/parts/`.** A gate cannot test *a part appears* without
adding one, and adding one to a committed directory corrupts a tree two agents share and leaves the
repository dirty when it fails. `probe/b1`'s `B5.3` had already hand-rolled a scratch root for that
reason; `run-gates.sh` now makes it the rule, which costs a 90 KB copy per gate.

⚠ **AND THE HELPER COULD NOT BE WRITTEN THE OBVIOUS WAY** —
**[loft#772](https://github.com/loft-lang/loft/issues/772)**, filed. A `&` parameter reassigned
from a local or a call is a hard error reading *"has & but is never modified; remove the &"*; from
a LITERAL it compiles and propagates. And the fix it names is the silently wrong one: measured,
`with &: caller sees 3` and `without &: caller sees 0`. Same shape as #760 — a redundancy lint that
is right at some sites and wrong at others in identical words. The workaround here is to split
detection from mutation and let the caller assign, which is why `library_moved` returns a boolean
and the rebuild sits in the main loop.

⚠ **WHAT `A7.1` DELIBERATELY DID NOT ADD: the joints.** A picker needs *what fits this socket*, and
`parts_for_socket` has been built and tested since `A4.2` with no consumer. Putting `FITS` and
`SOCK` on the wire now would be a message no client reads — this tree's own *built and not called*
trap — so it belongs with `A7.3`, which is the first gesture that binds anything.

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
