# STATE.md — where the editor work stands (2026-08-01)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — eight sessions, newest first |

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⏭ PICK UP HERE (2026-08-03, session 9) — the two active plans are closed, and the browser can draw text after all

`make gate` **33 green** · `make lib-test` **green, both backends** ·
`make guards` **5 probes green** · `lib/hex_editor` **217 tests** · `lib/hex_world` **102** ·
`hex_field` **51** · `hex_grid` **14** · `npm test` **53**.

**#3 and #5 are finished and closed** — they were the two `status:active` plans, and both
had real gaps behind a doc that read as if they were done. What each turned up is below.

**Two plans are designed and not started**, and they are the next work:
[#17 parts](https://github.com/jjstwerff/moros/issues/17) — [PARTS.md](PARTS.md), a house
drawn away from the world and composed by socket — and
[#18 catalogue](https://github.com/jjstwerff/moros/issues/18) —
[CATALOGUE.md](CATALOGUE.md), the subject line, names, and one list with images.
⚠ #18 is largely *finish `moros_ui`*: its panel layout, hit-test and click routing are
built and tested; `panel_render` was never written.

### ⚠ THE BROWSER CAN DRAW TEXT AND LOAD AN IMAGE — this reversed on 2026-08-03

The previous entry said the opposite in capitals, and it is now false: **loft fixed both**
([`b7aebffb`](https://github.com/loft-lang/loft), then `2945711a` for the blank canvas), and
the installed `loft 2026.8.0` carries them. Measured in the emitted page, the same way the
original claim was:

| | was | now, in the emitted `--html` page |
|---|---|---|
| text bridge | every builtin stubbed to a no-op | real — `measureText` for metrics, `fillText` for coverage |
| `gl_upload_alpha_texture` | stub | uploads a program-computed coverage buffer from wasm memory |
| `gl_load_texture` | TODO returning 0 | serves a bundled asset (`--html` embeds `.png` siblings) |
| `TODO` markers in the page | present | **0** |

⚠ **This changes plan #18's premise.** Glyphs no longer have to become geometry, and a
catalogue image no longer has to be rendered rather than loaded — so `B1` is now "draw text
with the bridge", not "build a geometry font". [loft#737](https://github.com/loft-lang/loft/issues/737)
and [#738](https://github.com/loft-lang/loft/issues/738) are still **open on the tracker**
though the code is fixed; trust the measurement over the label, and re-measure before
believing either.

⚠ **Nothing in the editor tells you what you are working on.** Fourteen keys are bound —
`w s a d`, `↑ ↓`, `l f g e q b c r` — and none is documented anywhere in the browser; no
mode, no name, no toggle state. The page that came before carried a static HUD string and
that went with it. This is plan #18's `B1`.

### #5 closed — the stencil invariant the design got wrong, and the one it could not state

Three of the five invariants were gated. The other two were not, and **measuring the fourth
refuted it**.

⚠ **Overlap is order-free ONLY IN OCCUPANCY.** The design promised "two stencils overlapping
at the same level arbitrate deterministically **and order-freely** — stamping A then B
equals B then A". Stamped both ways with different payloads on the shared cells: occupancy
agreed everywhere, **six labels and six heights did not**. A stamp is last-writer-wins, so
the payload carries the order — and that is also the *right* rule, because order-freedom
would make "place this on top of that" impossible, which is the one thing a stamp is for.

⚠ **THE TEST THAT LOOKED LIKE IT COVERED THIS DID NOT.**
`test_two_stamps_at_different_places_are_order_free` reads like the strong claim; its last
line asserts the two stamps did **not** overlap. A name can describe the claim while the
body tests the weaker case standing beside it — and no count notices, because the weak case
genuinely passes.

**Un-stamp did not exist**, so invariant 3 could not be stated at all. `stencil_unstamp` /
`_layers` / `_all` are the exact inverses. ⚠ **On free ground only, and that is not a
limitation to fix**: a stamp destroys what it covers and the previous value is never kept,
so true undo over occupied ground needs a snapshot, not an un-stamp.

Three controls seen red, each catching its own class: un-stamp without the halo left **8 rim
walls** standing (the cell count never moved); un-stamp skipping labels left label 1 at
`2,3`; the stamp flipped to first-writer-wins read `11` on the shared cell.

### #3 closed — and the fixture found a live half-hex drift on its first run

The convention was already stated once and `hex_grid` already owned the math. What was
missing was the thing that keeps it that way, and it worked immediately.

⚠ **THE BROWSER LATTICE WAS HALF A HEX OUT BELOW ZERO.** `html/hex-lattice.js` tested row
parity with `row % 2 === 1`. JavaScript's `%` keeps the sign of the dividend, so `-1 % 2` is
`-1` and the odd-row shift **silently stopped on every negative odd row** — rows −1, −3, −5
drawn half a hex left of where `hex_grid` puts them, while every non-negative row agreed
perfectly. **Fourth instance of `%`-where-`&`-was-meant** (lesson E below), so
`neighborOffsets` and `dirName` moved to `& 1` too: they were right for negatives, but by
luck, and luck is the class.

⚠ **THE FIXTURE HOLDS INTEGERS, AND THAT IS THE LOAD-BEARING CHOICE.** The issue asked for
**bit-identical** sampled `(col,row) → (x,y)` pairs. That cannot be had: the two sides reach
the same centre by different expression trees and may differ in the last ulp while both are
right. Such a fixture must carry a tolerance — **and a tolerance is exactly where a real
half-hex error hides**. The doubled lattice `k = 2·col + (row & 1)`, `m = 3·row` is exact in
both languages, and a parity drift is a drift of **1** in `k`. The float step is asserted
separately, where a tolerance is honest because that claim is about *scale*.

One file — `hex_grid/tests/fixtures/lattice.tsv` — read by `hex_grid`'s loft tests and by
`test/lattice.test.js`, generated by neither at test time. Controls seen red on both sides:
a perturbed pair fails by name in both languages, and restoring `% 2 === 1` fails with
"row −1 and row 1 disagree", 62.35 vs 93.53, exactly `w/2` apart.

⚠ **A relabelling would have looked almost right.** SCENE_MAP.md's wall geometry, its
pairing table and the G12 resolution were all flat-top. Re-derived on pointy-top: the
axis-aligned edge is **E**, not N, and the zigzag is in **y**, not x — but the constant
`3R/4` is *unchanged*, because a ratio measured along the rotating edge cannot change. Every
axis moved and the number did not, which is why the banners said re-derive rather than
rename.

**Left out on purpose, and recorded rather than quietly done:** renaming `h_wall_n/ne/se` to
NW/NE/E. They are public fields of the **published** `hex_world` 0.2.0, mid-migration under
[#8](https://github.com/jjstwerff/moros/issues/8), across ~80 sites in ten files — a
breaking change to a shared contract, not part of reconciling a document. It is a row in
[doc/Todo.txt](../Todo.txt).

### S3 is complete: `ground 41 bad 7` → **`ground 48 bad 0 wait 0`**

Every tile the server checksums, the client derives from its own voxels and matches.
Nothing held, nothing wrong.

The client now runs the server's own mesher over its own cache and gets the server's
triangles, checksum for checksum. What made it look broken was never arithmetic:
**the mesher reads two cells PAST the tile it builds**, so a tile whose margin has
not arrived yet is a question asked too early, not a disagreement.

**The oracle is `moros_terrain::tile_ready(world, cx, cz)`** — beside the mesher,
because it is a fact about what the mesher *reads*. Consumed by the client's `Q:`
handler, gated by `tools/gates/world/client_mesh.mjs`, and asked *by the probes*
rather than restated in them.

⚠ **THE MAP IS WHAT PROVED IT, AND A TALLY WOULD NOT HAVE.** The sweep first read
`0 false positives, 877 false negatives` and I was about to ship a guard called
conservative-but-safe. Drawing it — one glyph per tile — showed the 877 instantly:
tiles where **both** meshes were empty, agreeing about nothing. With heights bounded
so every tile emits, held-but-fine went to **zero** and the result changed category:
`tile_ready` is not an over-approximation, it is **exact**. READY ⟺ the mesh matches,
over nine cache shapes and 3249 tiles. A number cannot show that the withheld ring
around a hole in the cache is *one tile wide*, and one tile wide is the claim.

⚠ **`vacuous` is the row that keeps such a sweep honest** — two empty meshes checksum
alike, so a sweep over terrain that does not emit everywhere is partly measuring
nothing. It must read 0. `probe/s3/README.md` is the whole routine; `make guards`
runs it and shows the maps.

⚠ **A RECEIVER'S PRECONDITION IS THE SENDER'S JOB** — the finding, and it outlives
this protocol. Re-asking held tiles at `Z:0` moved two of them; the other 36 were held
forever and *correctly*, because the guard was right and the sender was not. Three
things had to change, each looking like someone else's problem:

- `send_layers` sent the store chunk under a tile's **origin** and nothing else, so
  tiles at `cz = -4` wanted chunk `r = -2` and no tile in range had its origin there;
- an **empty chunk was sent as silence**, which a cache cannot tell from one in
  flight. `K:<cx>,<cz>` is the authority saying so, `world_touch_chunk` stores it, and
  `tile_ready` now asks whether a chunk is **KNOWN**, not whether it holds ground — a
  chunk known to be empty is an *answer*;
- the comparison ran on arrival rather than at `Z:0`, the server's own statement that
  a batch is whole.

A guard alone turns a wrong answer into no answer. Better, and not the claim.

⚠ **THE GATE WAS TESTING A CLIENT THAT NO LONGER EXISTED.** The server is interpreted
from source every run; the wasm client is a **file** the server serves, written by
`make client`. Every edit to `editor_client.loft` was invisible to the gates until
someone remembered that command — the `Z:0` drain read as "never runs" through three
instrumented runs while the code was simply not in the page. Both client gates now
build it themselves. **Check this first** if a client change appears to do nothing.

**S4 is done too, and #16 is finished.** `43:1` is the client saying it draws the
ground itself; the server sends it none. Measured: **`ground sent 174 held 20`** —
twenty ground meshes built and never put on the wire, while a plain socket in the same
session still received every one.

⚠ **Earned, not declared** — four `Q:` agreements with no disagreement, and `43:0` the
moment one fails, so the worst case is a byte cost and never a hole in the world.
⚠ **Per client.** "Suppress when every client derives" reads as the safe choice and makes
the deletion *unreachable*: the gate runner is a client and cannot derive.
⚠ **And a client is tracked where it ARRIVES** — `clients` was filled by `2:<aspect>`,
400 ms late, and the instant the ground became a per-client send the whole opening
stream went to nobody (`terrain` read `n: 0`).

**Two instruments were wrong before the thing they measured, again.** `wait` returns
the *earliest* matching status, so a cumulative tally read `ground 0 bad 0 wait 1` —
the instant before any evidence exists; `last <prefix>` is the missing instrument and
now exists. And **the `snap` is what opens the browser, and the browser IS the client
under test**: dropping it from a gate that judges no picture left nobody to compare
anything, and every verdict line simply never arrived.

---

## Decisions taken — do not re-litigate

1. **One model.** Moros's dense 8-byte cell and `hex_field`'s parallel arrays do not
   conflict; the cell is *storage and serialisation* over the field model. Probed, not
   argued (#1) — material and height round-trip with zero differences.
2. **The hex convention is pointy-top, odd-r, `L = √3`**, and `hex_grid` owns all lattice
   math. Four implementations already agreed; `SCENE_MAP.md` was the outlier and is
   reconciled.
3. **The format uses tagged sections, not a flags word** — an unknown section is skipped by
   its length, so a newer writer does not break an older reader. Chosen because it can
   *demonstrate* the property; a flags word cannot be tested for it at all.
4. **Heights are `f64`, labels are `i32`** in the format. Our documented `u8`/`u16` widths
   are enforced nowhere — `70000`, `-3` and `300` all round-trip in the live model — so a
   byte-packer built to the spec would silently truncate.
5. **There is ONE edge layer, and the split is over the write POLICY** — not over the
   storage, and not over "who owns `Surfaces`", which was the wrong axis. `hex_field::EdgeSet`
   owns the storage *and* the surface slot; a consumer owns the rule deciding what goes in it.
   `edge_set_surf` writes what it is told, and first-writer-wins is
   `if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site, where a reader can see which
   rule is in force. Crawler's `EdgeCollider` was a temporary rename to break a name collision
   and **no longer exists** — they deleted their edge storage entirely (crawler `2a72763`,
   2026-07-22) and their `collide`/`sweep_path`/`sight_clear` now take an `EdgeSet`.
   *Consequence for us:* the layout is a two-consumer contract now, so it cannot be changed
   unilaterally — and their `edgetest`/`sweeptest` are a second gate on our EdgeSet work.
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.
8. **The twelve are twelve *placements*, and the reflected six land between the rotated six**
   — so the editor offers a twelve-position dial named as hours on a clock, turns and flips
   alternating (`SCENE_EDITOR.md` § stencils). **Never re-derive this from a radial feature.**
   A door in the middle of a wall sits on a mirror axis, collapsing the twelve to six, which
   reads exactly like proof that only six exist. Measured off-axis: twelve distinct cells on
   one ring, zero collisions. Both the claim and the collapse are pinned in
   `moros_map/tests/clock.loft`, the collapse as the negative control.
10. **A stamp is LAST-WRITER-WINS, and overlap is order-free only in its occupancy.** Two
   stencils overlapping at the same level union their cells whichever way round they go on;
   the payload belongs to whoever went second. Measured, not argued (#5) — six labels and
   six heights differed. The design promised full order-freedom and was wrong to: painter's
   order is what makes "place this on top of that" possible. Both halves are gated,
   including the refuted one, so a future arbitration rule cannot land silently.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.


## How to run things

```sh
make gate              # 33 gates, SILENT when green; GATE_VERBOSE=1 for timings
make lib-test          # all 18 packages, BOTH backends; goes red properly
make guards            # the S3 probe suite, and it DRAWS the guard's decisions
make camera-frame      # the camera's stations by hand, with the pictures
make client            # ⚠ the wasm client is a FILE the server serves — every editor
                       #   target now depends on this, but a hand-run server does not
make stop-editor       # ⚠ after anything that started a server
cd lib/<pkg> && loft test

# a scratch program against both trees
loft --interpret --path ../loft/ --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.


## Working with the siblings

- **Never edit `../crawler`.** Another agent works there; an edit it did not make breaks its
  picture of its own tree. Read freely, raise findings in the shared package's README or in
  `LOFT_HANDOFF.md`, and let them make the change. It works — they acted on both findings
  raised this way.
- **`loft-libs-world` `dev` is shared and consumed from the WORKING TREE.** A new public name
  can turn the sibling red with no local edit on their side: adding `EdgeSet` cost crawler a
  rename across ~38 files. **Grep the sibling before adding a public name**, and when a build
  breaks with nothing changed locally, read the sibling's `git log` before debugging.
- Both agents have edited the same file at once. **Check `git diff` for someone else's work
  before committing**, and stage-and-commit in one command.


## Lessons worth carrying forward

Craft findings that outlived the session that produced them. The *working rules* — how this
tree is worked — live in [CLAUDE.md](../../CLAUDE.md); these are what the code and the gates
kept teaching.

**A. A mechanism that looks like overhead may be load-bearing for a case you did not
measure.** Twice a "simplification" was recommended and withdrawn — the per-chunk window, and
`base_height` before it. Both times the tell was identical: the mechanism had been measured
against **one** use case. The window survives because it decouples resolution from extent,
which is the only reason one model can serve a dungeon at centimetres and a planet at metres.

**B. Two claims about seams were about nothing of the sort.** Layer kind, then layer identity,
were each argued to need world-global scope "or the fold check is incoherent across a seam".
The fold check reads one column, a column lies inside one chunk, and so it never crosses a
seam at all. A sentence that mentions a seam is not a seam argument — ask instead whether the
operation ever reads two chunks.

**C. A sibling had already solved it, better.** `crawler/PROPS.md` refuted the dressing-layer
design on three axes at once: a level is a *sheet, not a slot*; terrain is dense while
dressing is sparse; and placement is mostly *derived* rather than authored. The uniform-cell
version felt like one mechanism serving two cases — and that feeling was the tell that it was
serving one and disfiguring the other.


**D. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**E. Parity is where this codebase breaks.** Five separate bugs now, all the same shape: right
for non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, negative indices that wrap rather than fail, and (2026-08-03)
`html/hex-lattice.js` shifting no odd row below zero because `-1 % 2` is `-1` in JavaScript.
When touching the lattice, test **both parities and both signs**.

⚠ **The fifth one is the argument for the instrument, not for more care.** It sat in a file
whose header already says "one home for the lattice" and whose test suite already re-derived
its direction tables from the geometry — and it still shipped, because every test used
non-negative rows. What found it was the **cross-language fixture** (#3): one file both
implementations read, covering both signs. Care does not scale; a fixture that spans the
seam does.

**F. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.

---

## The record

Eight sessions of how this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the
per-session entries, the numbered item log, and the superseded planning sections. Nothing
was thinned on the way out; ⚠ read a dated claim in it as dated.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. **When a session ends, its
entry moves out** — the handoff describes the present, and the record keeps the past. Moving
is not thinning: a finding that cost a day is worth more than the lines it takes, which is
why nothing is ever deleted on the way.
