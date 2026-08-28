# Where to focus — the blueprint, and the projects that need it

**Written 2026-08-28, from measurement rather than from the plans' own summaries.** The
question that produced it: *if someone wants an editor for their own game on our hex grid,
can they pick this up and build with confidence?* The answer split cleanly in two, and the
project owner's reply is what joined them again:

> *"The blueprint is so important because it lets us define the blocks for the other part.
> Without those every project will feel lost."*

⚠ **THAT SENTENCE IS THE WHOLE DOCUMENT.** The blueprint editor and the integration story
read like two features and are **one problem seen from two ends**. A project adopting
lavition needs a vocabulary of its own — its walls, its house types, its parts, its
materials. The blueprint is **where that vocabulary is authored**; the palette is **where it
is stored**. Today the authoring surface is a read-only SVG dump and the storage is a set of
compile-time constants in our source, so a project has neither end of it and inherits
Moros's village instead. *That* is what "feels lost" means, stated as a mechanism.

---

## 0. The one-paragraph state

**The hard part is done and it is not the part that shows.** The lavition stack has no Moros
dependency at all — `make probe-split` exits 0 on all nine rows, all five programs and 53
gates build with `lib/moros_*` absent, and one non-comment occurrence of the string "moros"
survives in the whole `hex_*` family. Under it sit **1,552 library tests, 58 gates and 48
probes**. The architecture is right, the separation is real, and neither is the blocker.

**What is missing is the two ends a stranger touches**: a surface to author blocks in, and a
package they can depend on. Both are half-built, and each is the other's answer.

---

## 1. ⛔ PRIORITY ONE — the blueprint editor

### What it is today, measured

`hex_mesh::plan_svg` has exactly **two callers**: `src/plan_view.loft` (an offline driver
taking its window from environment variables) and its own tests. **Neither renderer can open
a plan** — not the browser client, not the server. Authoring in a plan is `pick <x>,<y>
<verb>`, which exists only in `src/editor_run.loft`, the headless script runner.

So the blueprint today is a **review instrument**, and a good one — [plan
26](../../plans/26-blueprint/README.md) `B0`–`B4w` earned its keep four times over, finding
walls that bound nothing, a wall drawn twice, and a wall whose field depends on which way it
was walked. It is not yet a place a person authors.

### ⛔ And the object a blueprint is MADE OF does not round-trip

This is the finding that decides the order. `B4x` measured what the reader does with shapes
no fixture had asked it about:

| the shape | what the plan view describes | marks left unexplained |
|---|---|---|
| one wall, a plus, an L, a Y | correct | 0 |
| ⛔ **a zigzag** — three walls, two bends | two runs | **12 of 18** |
| ⛔ **a closed room** — four walls | *nothing at all* | **50 of 50** |

**A closed room is the most basic blueprint object there is, and it is invisible to the
reader.** The mechanism is exact and already isolated: `corner_pool` admits a vertex at
degree 1 (a chain end) or degree ≥ 3 (a junction), and a room fuses at every corner — `deg1
= 0`, `deg3+ = 0`, an **empty pool**, so `run_within` is handed nothing to offer.

⛔ **THE PARAGRAPH ABOVE WAS TRUE FOR FOUR HOURS.** `hex_editor::run_chain_within` shipped in
`13db614` at 20:39 on 2026-08-28 — the day this document was written — wired into the peel
and into the plan view. **That commit touched three code files and no document**, so this
section, the plan, `STATE` and `CLAUDE.md` all went on saying *a closed room draws NOTHING*
and a session was planned against it. ✅ **Measured through `hex_mesh::plan_svg` on
2026-08-29, the same room is four runs with nothing missing.**

⛔ **THE REAL NUMBER IS 8 OF 25.** A rectangle authored as four walls comes back as exactly
four descriptions in **8 of 25** — the 7 whose marks form one closed chain, plus `8 × 3`
whose four walls never meet — and as **5 or 6** in the other 17, which are exactly the ones
whose chain carries a **junction**. No marks are left undrawn on any of them.

⛔ **AND THE SAME ROOM MOVED IS DESCRIBED DIFFERENTLY**: a 5×5 at six positions half a cell
apart gives **4 4 4 4 6 6**, and every position whose chain is a loop gives 4. **So the loss
is the corner, not the cut.**

✅ **THE CYCLE IS ANSWERED AND IT WAS NOT THE BILL.** A cycle has no start, so do not choose
one: feasibility is a property of a vertex PAIR, so the table is rotation-invariant — build
it once and take the minimum over every start, and the room comes back as its four walls
uniquely, for one table's worth of `run_edges`. ⚠ It **beats the shipped peel on no fixture
measured**, because the peel re-seeds after each claim; it buys a guarantee, not a fix.

✅ **AND THE CORNER IS MEASURED IN THE SAME RUN: THE BREAK IS ONE HEX EDGE WIDE.** All 80
breaks across the 25 rectangles sit **at a corner** — none mid-wall — and **76 of 80** have
another break exactly one hex edge away (two edges for the other four). The steps are
`(0,3) (3,0) (3,-3) (0,-3) (-3,0) (-3,3)` and nothing else, which is `hex_edge_corners`'
own `d = 0…5`, so *one edge* is an integer fact and a join rule needs no threshold.

⛔ **So `B1` is now a decision, not a search**: join chain ends across a one-edge break in
the reader, or make `wall_stamp` leave the corner closed. ✅ **And the control for the join is
built and green** — fourteen fixtures of two walls at gaps 0.2 … 2.6, collinear and parallel:
**no unrelated pair has ends one hex edge apart** (nearest √3), while `8 × 3`'s four broken
corners report four. ⚠ The instrument was checked against a fixture that has the thing, after
the first version of the control passed for the wrong reason.

### ⛔ What the decision costs, measured — and the two goals are ONE requirement

**Efficient meshes and accurate blueprints are not two asks.** The fitted render needs a wall's
**surface**; the surface is the **recovered description**. So recovery accuracy is upstream of
both.

| measured here, 2026-08-29 | |
|---|---|
| what a wall costs in the mesh today | **exactly 4 triangles per stored edge** — 14 marks → 56, 13 → 52, 50 → 200, 70 → 280, linear on four fixtures |
| the control | a bare world emits **0** triangles in the wall slot |
| ⚠ the first instrument was blind | `chunk_mesh_mat(…, WALL_MAT)` answers the identical mesh with or without walls — walls live on **edges**, not cells. Slot 5 of `chunk_meshes_all` is the one that sees them |
| what `@HB-X61` gates upstream | one **fitted quad per side**, *"38 stored edges → 38 strip quads, or 4 fitted quads"* |
| so a four-wall room | **200 triangles today, 8 fitted — 25×**, and the ratio GROWS with wall length: more edges, still one quad |

⛔ **AND THE SAME ROOMS FAIL BOTH WAYS.** A rectangle authored as four `wall` runs is described
as its four walls in **8 of 25** positions, and **7 of 25 have a hole a flood escapes through**.
A room that recovers as six runs is six quads instead of four; one whose chain is broken has no
fitted surface at all. **The rooms that draw wrong are the rooms that cost most.**

### ⚠ So the decision, with what each option buys

| | enclosure | recovery | mesh |
|---|---|---|---|
| **leave it** | ⛔ 7 of 25 leak | ⛔ 8 of 25 exact | ⛔ 200 tri/room |
| **a doorstep on `wall`** — refuse a run that misses the previous corner | ✅ closed | ⚠ still domain B, so `@HB-X36`/`@HB-X45`/`@HB-X62` do **not** apply | ⛔ unchanged |
| **rooms are stencils** — `place` only, `wall` stays linework | ✅ `place_house` already refuses an unmitred facing | ✅ R1, exact from the CELLS | ✅ 4 quads, mitred |
| ✅ **promote on close** — a closed wall loop acquires a FLOOR | ✅ | ✅ recovery reads the floor | ✅ |

✅ **AND THE DOORSTEP FOR THE LAST ONE ALREADY EXISTS.** `hex_editor::field_fill` floods an
enclosure and **refuses an unbounded one by name** — *"the boundary is open, or the enclosure is
larger than this tool will claim"*. That refusal is exactly the leak detector these 25 rectangles
were measured with. A closed loop gets a floor and becomes recoverable; an open one gets told
where it leaks.

⚠ **WHAT THAT DOES NOT BUY**: `@HB-X62`'s exact mitre is a property of adjacent **fitted
surfaces of a form** differing by heading `3` or `9`. Four linework walls at arbitrary `D`
headings do not satisfy it, so a promoted room mitres when its corners are square and not
otherwise. ⛔ **And a rectangle is not a `Form`** (`@HB-X24`: no square sublattice), so the floor
is a `Plan`/`Box` rasterisation — which is what `place_house` already builds and
`house_recover` already reads.

### The order of work

| # | what | why it is here | state |
|---|---|---|---|
| **B1** | **the closed chain** — a wall that turns | until a room round-trips there is nothing to edit | ✅ the CYCLE is measured and answered (`B4x` third measurement); ⛔ the CORNER that breaks the chain in 18 of 25 rooms is not |
| B2 | the plan view **inside a renderer** | an instrument nobody can open while editing is an instrument nobody reads | not started |
| B3 | **authoring in the plan** — `pick` from a pointer, not from a script | this is the editor half of "blueprint editor" | `pick` exists headless (`B4b`) |
| B4 | **the block vocabulary authored here** — wall types, house types, parts, saved to the world's palette | the project owner's actual requirement; see §2 | the storage exists (`PAL_HTYPE`), the authoring does not |
| B5 | multiple floors side by side; furniture; thickness | [BLUEPRINT.md](BLUEPRINT.md)'s own remaining §2 | designed |

### ⚠ `B1` does not need a new idea — it needs one number

⚠ **UPDATED 2026-08-29 — the number below was taken, and it moved the question.** The
prescription in this section is spent: the cut is settled (see above), and what `B1` now
wants is the corner measurement, not another partition rule. Kept for the record of what
each refutation cost.

Plan 26's own record has done the expensive part. **Three designs were refuted, each by its
own probe**, and the third refutation is the one to build from:

- a heading pre-filter **barely cuts** — 63 of 105 pairs on a straight wall are d24-parallel;
- admitting **every** corner closes the zigzag with both controls unmoved, and **blows
  `loft test`'s 300-second deadline** on the room;
- the ordered chain walk is right, and the prototype that ordered the chain correctly still
  returned 14 pieces because **its acceptance test was stricter than the shipped one** — it
  asked for exact set equality, and a wall's extreme *vertices* are not the gesture's
  *endpoints*.

✅ **So the next step is a rebuild of prototype 3 with `run_span`'s within-ness as the cut
test** — the acceptance the code already uses — and a re-measure of four piece counts
(1 / 2 / 3 / 4). ⚠ Plus one clause somebody has to write on purpose: **a loop has no
canonical start**, so a walk seeded anywhere cuts one of the four walls in two and returns
five pieces; the first and last must be merged when they are one run.

---

## 2. ⛔ PRIORITY TWO — an editor a project can integrate

### What a stranger actually hits, in order

**1 · There is nothing to depend on.** The registry has `hex_grid`, `hex_field`, `hex_form`,
`hex_draw`, `hex_shape`, `hex_place`, `hex_way`, `hex_edge`, `hex_recover`, `hex_roof`,
`hex_fit`, `hex_body`, `hex_terrain`, `hex_world` and `lavition_ui`. It does **not** have
`hex_voxel`, `hex_editor`, `hex_mesh`, `hex_part`, `hex_proj`, `hex_cam` or `hex_rig` — the
store, the gestures, the mesher and the parts. Integration today means cloning a tabletop-RPG
repo and lifting `lib/` by hand. Five of those manifests carry no `description` and no
`categories`, so the registry would refuse them as they stand.

**2 · The Definition of Done this tree already wrote is unmet for every one of them.**
[EDITOR_SUBSTRATE § Definition of Done](EDITOR_SUBSTRATE.md) clause 4 is *a second consumer
exists, even a trivial one — a ten-line example scene is enough, and it doubles as the docs*.
Zero of seven packages have an `examples/`, a README, or a committed `.api` stub. **Clause 4
is literally the adoption question, written down as a gate and never run.**

**3 · The blocks are constants, which is where §1 rejoins.** A cell's material is a
compile-time integer in `gesture.loft` (`SURFACE_MAT` … `PROP_MAT`), and what the mesher can
draw is a hardcoded table in `hex_mesh/src/surfaces.loft` **whose order is the wire's mesh-id
space** ("Add at the END"). [Plan 21](../../plans/21-region-mappings/README.md) counted it
exactly — **329 hardcoded uses, 22 of them identity comparisons** — and shipped the mechanism
that fixes it: per-region palettes in the world file (`PAL_MATERIAL`, `PAL_EDGE`, `PAL_ITEM`,
`PAL_HTYPE`), with slot 0 as absence. `R1`/`R2` are built. **`R3`–`R5` are designed and not
built, and `R5` is the one that moves the 22.**

⚠ **`PAL_HTYPE` is the shape the whole thing should take, and it already works.** A world
*declares* a house type and `press_verb` performs it, with `htype.loft` stating the limit
out loud: a type may **alias** a gesture the editor has and may not add one. That is a
project defining a block without touching our code — which is exactly what §1's blueprint
should be authoring, and exactly what `R4` (a level's own mapping) generalises.

**4 · ⛔ An adopter cannot run the suite of the package they are adopting.** `loft test`
applies a **300-second deadline to the whole `run-interpret` phase**, and `hex_editor` is 775
tests: the package run stops partway with a `[timeout]` line — measured inside
`tests/opening.loft`, which passes 21 of 21 in **4.3 seconds** on its own. `make lib-test` is
sound and reports it correctly (a planted failure and a planted timeout both come back exit
2, because `.SHELLFLAGS` carries `-o pipefail`), but **that package's gate can only ever be
red**, and a gate nobody can get green is a gate nobody runs.

✅ **Fixed 2026-08-28 — `make suite` / `tools/suite.sh`**, one file per process, so the
deadline bounds the slowest file instead of the sum: **62 files, 777 tests** in `hex_editor`.
⚠ Its two instrument checks are the part to keep — a planted failing assertion and a planted
overrun must both come back RED, and **a file that produces no `test result:` line at all is
RED rather than absent**, which is the whole failure mode. And the deadline is **loft's own**
(`--timeout`), never an outer `timeout`: loft names the phase, the function, the file and the
entry point, where a signal leaves a corpse with nothing to say.

**5 · Adding a verb is still a library change.** Seventeen verbs, dispatched by an `if` chain
in `press_verb`. [EDITING_MODES](EDITING_MODES.md) already says the verb table must be
**data** — *"adding a type must touch no code, or the system cannot grow"* — and it is not.

### The order of work

| # | what | why it is here | state |
|---|---|---|---|
| **I1** | **`R5`** — the 22 identity comparisons through the mapping, with the grep gate that keeps them there | this is what makes "my game's materials" configuration instead of a fork | ⛔ designed |
| I2 | **`R4`** — a level's own total mapping | a project ships a level, not a patch to our palette | ⛔ designed |
| I3 | **publish `hex_voxel` + `hex_editor`** with `description`, `categories`, a README and one `examples/` scene each | the example **is** DoD clause 4 | not started |
| I4 | the verb table as **data** | so a project's own verbs are a declaration | designed ([EDITING_MODES](EDITING_MODES.md)) |
| I5 | `R3` — the blend band between two regions | open-world seams; not on the critical path for a first adopter | ⛔ designed |

---

## 3. ⚠ What NOT to focus on, and why it looks urgent

- **The repo split (`L6.3`).** It reads like the blocker and it is not: the coupling is
  already paid, measured green. Moving the files buys a stranger nothing they do not get from
  §2 I3. ⚠ [STATE.md](STATE.md) said otherwise for a week — its *what it does NOT do* row
  claimed two live Moros imports that `L6.3a`/`L6.3b` had removed. Corrected 2026-08-28.
- **Chasing the remaining `EDITOR_DEFECTS`.** 1, 4 and 5 are one change ([plan
  24](../../plans/24-one-authority/README.md)) and it is worth doing, but a project's first
  hour never reaches a reload. Do it after `I1`.
- **More verbs.** The vocabulary is not what a stranger finds short; the inability to name
  their own is.

---

## 4. The instrument that found all of this — keep it

Every finding in §2 came from **writing the adopter's first program**: twelve lines against
the public API, no editor, no browser, no gate.

✅ It compiled and ran first try, which is real credit to the surface. Then it took **four
rounds of parameter guessing** to place one house, and it surfaced two live defects, both
fixed 2026-08-28 (see [EDITOR_DEFECTS](EDITOR_DEFECTS.md) 8 and 9):

- a **refused** house left 27 floor cells, 84 wall bytes and 4 filed wall runs in the world,
  under a source comment saying in bold that it does not;
- every refused facing offered a facing that is **itself refused** — three of them in a
  cycle, so the doorstep's *reason, offer, residual* promise never terminated.

⚠ **Neither was reachable from inside.** Our own fixtures always face a placeable way and
always place on open ground, so 775 tests and 58 gates never asked either question. **The
first-hour experience is a measurement we do not take**, and it is the one that decides
whether a project stays.

**So the recommendation is a probe**: `probe/adopt/` — the shortest honest program a stranger
writes, in `make fast`, asserting that it places a house and that every refusal it meets
names something the author can do next. It is the cheapest possible standing answer to *is
picking this up still fun*, which is DoD clause 8 and the only one with no gate.
