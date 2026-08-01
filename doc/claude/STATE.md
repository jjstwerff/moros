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


## ⏭ PICK UP HERE (2026-08-01, session 8) — the camera has five settings, and every surface overhead now has an underside

`make gate` **30 green** (74 s) · `make lib-test` **953 on both backends** ·
`lib/hex_editor` **201 tests**. ⚠ On **loft 2026.8.0**, installed 19:59 today
*mid-session* — anything verified before that timestamp was measured on the previous
binary, and the re-run found no difference.

### What exists now that did not

An author can be **in** the room they are building, or **above** it.

| | | |
|---|---|---|
| `40:0` **AUTO** | the default, and the only one that degrades | FOLLOW until `sh_room` says a boom will not fit |
| `40:1` **FOLLOW** | over the shoulder | body drawn, ambient 0.45 |
| `40:2` **SNUG** | intimate, the walls press in | body hidden, ambient 0.10, head-lamp 0.90 |
| `40:3` **CUTAWAY** | a plan while you build it | roof + soffit hidden, fixed boom, steep, ambient 0.75 |
| `40:4` **EYES** | there is no other way to be in a room | no boom, the pitch fence lifted, the eye at the head |
| `V:<mask>,<amb>,<lamp>` | per-client visibility and light | bit 0 the figure, bit *k* surface *k* |
| the roof | a **thickness**, a mitred ridge, and an underside on its own surface | |
| a deck | the same underside, in the same surface | |

⚠ **`SURFACES` is 9** — ground, road, field, veg, roof, wall, floor, frame, **soffit**.
Nine gate files plus `views.mjs` and `editor.html` carry the stride.

### ⚠ The finding that generalises: a claim needs the instrument that can see IT

Nearly everything below was found by an instrument, and three separate times the
obvious instrument was blind to the thing it was pointed at:

- **A picture cannot see the wire.** The camera's ease was solved every tick and
  published on none — `C:` sat inside `if moved`, which is the CHARACTER's flag. The
  trace read `dist 1.87`, correct, while the eye the renderer used was **5.317 wu
  behind the character, outside the walls**. The instrument that ended it inverts the
  eye out of the view matrix (`eye = -Rᵀt` off `C:`). ⚠ Second instance in that one
  loop — `live_clients` was once counted off a broadcast inside `if moved` too.
- **A chromaticity classifier cannot see light.** It matches ratios so a lit surface
  and a shadowed one share a bucket — which is what makes it readable and why it is
  blind to an ambient *by construction*. Hence `lum`. And a whole-frame `lum`/`sd`
  cannot see a **lamp** either: dropping the ambient widens the same histogram, so
  lamp-on and lamp-off read 0.1415 and 0.1418. `sd:masonry` does — 0.0031 against
  0.0762 — because a wall is one plane with one normal and one colour, so only a
  light that falls off with distance can make it vary. ⚠ And with the lamp off,
  **2.35% of that frame is literally `black`** and a third of it falls so dark a WALL
  matches the ROAD's chromaticity — the design's *"a black frame is not atmosphere"*
  arriving as a number.
- **A count cannot see a colour, and a colour cannot see a count.** A roof's soffit
  and a floor's soffit are one surface, so standing under an upper storey *inside a
  house* photographs `soffit 0.997` whether the deck has an underside or you are
  seeing the roof through it. `mesh <surface>` (new, off the `M:` frames, no browser)
  said 18 → 180; on open ground 0 → **342** = 19 cells × 6 triangles. ⚠ And the pixel
  row there is `floor`, not `sky`: with no culling a deck without an underside is not
  a hole, it is its own top fan seen from below — **0.9967** of the frame.

### ⚠ Six things were built, tested, and reaching nobody

This is the session's dominant defect class and it kept recurring:

| | found by |
|---|---|
| the camera's eased solve — never published | the eye off `C:` |
| `FLOOR_MAT` — a house's floor drawn by no pass | 16–21% of interior frames were **sky** |
| `body_shown` — tested, never called | wiring SNUG |
| `storey_split` — the storey gesture did its own arithmetic | wiring the deck |
| a planned roof cell — drawn as a **floor deck** at its roof height | the ceiling went in and orange wedges came through it |
| the deck's underside — the roof's fix did not reach a floor | the mesh count |

⚠ **Two invisible defects hid each other.** The sawtooth of roof cells drawn as floor
was invisible while the floor was the wall's pale grey; giving the floor a timber and
the roof an underside put it on screen at once. It was costing the *exterior* too —
the outdoor control's `roof` share went 1.3% → 4.8% when it stopped lying on the roof.

### ⚠ Where the design was wrong, and the measurement that said so

The design was a good design; these are the sentences a prototype refuted.

1. **"EYES is a picture of the sky through the ceiling."** No — nothing culls
   backfaces here, so the interior was looking at the roof's own triangles from
   behind. `sky` was **0.0%** and `roof` 18.6% before anything was built.
2. **"A handful of triangles with the winding reversed."** Coincident geometry cannot
   be two surfaces: identical depths, and `gl.LESS` fails the second one everywhere.
   **So the roof has a thickness now** — and the argument for the `Slab` is stronger
   than the design made it: a sheet has no room for a joist *and no room for its own
   two sides*.
3. **"AUTO degrades when `sh_room` says the room cannot hold a boom."** `sh_room`
   alone cannot: outdoors one unit from a house it reads **0.59**, smaller than the
   **2.39** in the middle of the room behind that wall. `sh_inside` is load-bearing.
4. **"SNUG: near plane in."** Refuted — `CAM_SKIN` (0.533) is ten times the near
   plane, and `sky` reads **0.0000** at every interior station against 29.7% in the
   outdoor control. `sky 0 0.001` is a gate row now.
5. **"FOLLOW, roof inside: hidden."** Obsolete — written when the eye was outside the
   house. The eye is in the room now, so hiding the roof would show sky over the walls.
6. **"EYES cannot honestly exist before the `Slab`."** It did not need it: the roof's
   underside is enough for a house with ONE storey.

### ⚠ Three constants were wrong, and each was invisible for a different reason

- **`CAM_SKIN` 0.20 against a wall band of 0.866.** The sweep hits an EDGE — a line on
  the lattice — and the wall drawn on it is a band centred there, so every
  wall-limited boom parked the eye **inside the masonry**. A cliff between two
  adjacent stations: `masonry` 39% → 99.7% as the eye crossed the wall's inner face.
  It is half a band plus a margin now, and `boom.loft` pins the **relation**.
- **`boom_take` charged a skin it did not owe.** The march returns `want` when it
  finds nothing, and the skin was subtracted anyway — so the unobstructed boom was
  `want − skin` **always**. Invisible at 0.20 (5.86 read 5.66); a ninth of the boom at
  0.533, which the outdoor control row caught.
- **One gable end wound backwards since S6.** `emit_tri_n` flips any normal with
  `n.y < 0` upward, which silently corrected both *slopes* — and a gable is VERTICAL,
  so `n.y` is exactly 0 and the flip has nothing to test. Every house had one end lit
  from inside. A lighting sign is not a shape, so no gate could see it.

⚠ **And the ridge needed a mitre**, which a pitch of 1.1 found: a ridge vertex lies on
BOTH slope planes, and `n₀·n₁` goes negative past 45°, so an inward offset pushes the
ridge end *out through the other slope*. `t·secθ` — the carpenter's rule, reached from
the other end.

### ⚠ The mode is keyed on the ROOM, which is the opposite of obvious

`body_shown` keys on the boom and that is right for a body. A MODE cannot: the boom is
a function of **yaw**, so turning on the spot in a corner sweeps it 4.4 → 1.9 → 4.4 and
everything discrete strobes once per revolution. Hysteresis cannot help — turning
crosses the whole band repeatedly. `sh_room` is a property of the **place**.

⚠ **The dither row is the only test that catches a single threshold.** A straight
there-and-back crosses one threshold twice and passes with no hysteresis at all.

### ⚠ And a rule CUTAWAY needed that the design did not have

**What you cannot see must not occlude.** With the sweep left on, the fixed 14.14 boom
collapsed to **1.57** inside a house — stopped by the **roof**, the very surface the
mode hides. A camera avoiding something the viewer cannot see parks the eye under the
object it just removed.

`grass` is the gate row that catches it and it is the one worth stealing: *standing
indoors, a tenth of the frame is the field outside* — only possible with the roof off
**and** the eye above the wall head, so one number tests both halves.

### The harness, which took as much fixing as the code

- **The readiness check and the measurement asked different buffers.** `browser()`
  waited on `readPixels`, which *the same file documents as returning black*. Then,
  fixed, it required **twelve distinct colours** — and EYES looking straight up at the
  sky is 99.7% ONE colour, so it reported "the page never drew" about a perfect frame.
  It asks about **loaded** and **composited** now.
- **`frameStats` crashed instead of reporting.** It returns `{ok:false, why}` and
  prints the page's own exception — which named the next bug on its first line.
- ⚠ **A backtick in a comment inside a JS template literal, twice in one day** — once
  in the client's GLSL (three frames of 99.96% sky, which reads as a broken renderer
  and was punctuation) and once in `script.mjs`. `node --check` after every edit.
- **A dead run leaves Chrome on the devtools port** and the next run attaches to the
  corpse. `browser()` frees it first — matching **the window size this file spawns
  with**, because a port number is not an identity and this box runs other agents'
  browsers on nearby ports.
- ⚠ **A fixed devtools port would have made two browser gates fight**, and the guard
  above would have killed the *other* gate's browser. Derived from `EDITOR_PORT` now.
- ⚠ **A guard in the wrong handler is dead code that looks right.** The re-send of
  `V:` for an arriving client fired on `1:` READY — but a client joins `clients` on
  `2:` CAM, so it ran before the client existed. Measured: EYES chosen *before* the
  browser connected drew **the inside of the character's own head, 99.7% of the
  frame**, while the server's trace read `body false`. `vis_mask` is one derivation
  for both senders now, and the send happens where the client arrives.

### Open, in the order that makes sense

1. ⚠ **A CELLAR HAS NO CEILING** — the third time for this shape. The underside is
   drawn for every non-ground layer, and a cellar's ceiling is the **ground**, drawn
   by `chunk_mesh_mat` on a different path entirely.
2. ⚠ **`sh_back` is measured, reported on the `27:` trace, and read by nothing.** It
   exists because a corner is tight all round (1.78) while the one direction the boom
   wants is wide open (5.86) — a real case no rule uses yet.
3. **`Slab` and `Hole` are only reachable through `39:`**, not through `12:` STOREY.
   The storey writes a deck and derives its ceiling; it does not write a `Slab`.
4. ⚠ **One flake, unexplained.** `level` failed once in eight suite runs and never in
   eight alone: 14.3 s against 6.2 s, a stale height after a barrier that never
   completed. The gate was RIGHT to fail (`stalls === 0` is in its verdict) — a false
   red, not a false green. Its budget is a real deadline now, which makes the bound
   mean what it says and **settles nothing else**.
5. **CUTAWAY stage 2** (heading buckets for near walls) — measured as *not needed yet*:
   at pitch 1.25 the near wall is below the frame and `masonry` is 0.43. The case for
   it is a shallower CUTAWAY than this one.
6. ⚠ **`SOFFIT_R/G/B` is a guess that measured well, not a designed colour** — cool and
   dark so the classifier separates it from the wall's crowded warm greys, nearest
   neighbour 4.2× the tolerance. That constraint is the reason, not taste.
7. **`emit_tri` still writes three fresh vertices per triangle** for walls, roofs and
   props.

### The numbers a gate now holds

`tools/scripts/indoors.keys` is eleven stations through `camera_indoors`;
`deck.keys` is `deck_soffit`. Both are in `make gate`.

| station | subject | largest | `lum` |
|---|---|---|---|
| outdoors, FOLLOW | 1.4% | grass 53% | 0.419 |
| mid-floor, FOLLOW | 13.6% | masonry 42% | 0.268 |
| a corner, FOLLOW | 3.1% | masonry 49% | 0.299 |
| SNUG | 0.03% | masonry 44% | **0.160** |
| CUTAWAY | 0.6% | masonry 43% | **0.424** |
| EYES, straight up, indoors | — | **soffit 99.7%**, `sky` **0** | — |
| EYES, straight up, outdoors | — | **sky 99.7%** | — |

Every one of those rows has been **seen red** by a one-line mutation of the thing it
claims, and the mutation is named beside it in the script.


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
make gate              # 30 gates, SILENT when green; GATE_VERBOSE=1 for timings
make lib-test          # all eight packages, BOTH backends; goes red properly
make camera-frame      # the camera's stations by hand, with the pictures
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
