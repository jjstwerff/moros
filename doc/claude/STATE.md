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


## ⏭ PICK UP HERE (2026-08-03, session 9) — the client meshes the ground itself, and two designs are open

`make gate` **33 green** · `make lib-test` **18 packages, both backends** ·
`make guards` **5 probes green** · `lib/hex_editor` **217 tests** · `lib/hex_world` **102**.

**Two plans are designed and not started**, and they are the next work:
[#17 parts](https://github.com/jjstwerff/moros/issues/17) — [PARTS.md](PARTS.md), a house
drawn away from the world and composed by socket — and
[#18 catalogue](https://github.com/jjstwerff/moros/issues/18) —
[CATALOGUE.md](CATALOGUE.md), the subject line, names, and one list with images.
⚠ #18 is largely *finish `moros_ui`*: its panel layout, hit-test and click routing are
built and tested; `panel_render` was never written.

⚠ **THE BROWSER CANNOT DRAW TEXT OR LOAD AN IMAGE.** Measured in the emitted page, not read
from the API: `loft --html` stubs the whole text bridge, `gl_load_texture` is a TODO
returning 0, `gl_upload_alpha_texture` is stubbed, and `println` is invisible because
`gl_create_window` hides the `<pre>`. **Render-to-texture is real**, so the only way to put
pixels on the canvas is to render them with GL — glyphs become geometry, every catalogue
image is rendered rather than loaded. [loft#737](https://github.com/loft-lang/loft/issues/737)
and [#738](https://github.com/loft-lang/loft/issues/738).

⚠ **Nothing in the editor tells you what you are working on.** Fourteen keys are bound —
`w s a d`, `↑ ↓`, `l f g e q b c r` — and none is documented anywhere in the browser; no
mode, no name, no toggle state. The page that came before carried a static HUD string and
that went with it. This is plan #18's `B1`.

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

**Next:** S3 has earned the deletion it was measuring for — the server's ground `M:`
frames can go, and the client draws its own. Nothing has been deleted yet.

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

**E. Parity is where this codebase breaks.** Four separate bugs, all the same shape: right for
non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, and negative indices that wrap rather than fail. When touching the
lattice, test **both parities and both signs**.

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
