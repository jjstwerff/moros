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
| ◐ `A3.4` | Depth bound (8) and the cycle check on save. | **BOUND DONE** (taken early, in `A3.2`), and now **a cycle reports as a CYCLE rather than a depth overflow** — measured wrong first. 9 refused / 8 accepted on both paths, plus the control that keeps the two rules apart. ⚠ **The *on save* half is blocked on `A7.3`**: there is still no save gesture, so the server's startup sweep remains the caller. | S |
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
