# `21` — Regions own the mapping: one byte is not one identity

**Issue:** [`jjstwerff/moros#21`](https://github.com/jjstwerff/moros/issues/21) ·
**Value:** `F` · **Effort:** `VH`

## Status

**`R1`, `R2`, `R5a`, `R5b` and `R5b.2` are shipped; `R3`, `R4`, `R5b.3` and `R5c` are designed, not built.**
⚠ `R1` was **reshaped before any code**
by finding that the palette already exists in the predecessor model (see below). What stopped
the build is worth more than the build would have been: a fresh palette in `hex_editor` would
have been the third implementation of one idea, and the third list in three days. It is filed now because every day it waits,
the thing it has to undo gets bigger — and two of the sites it has to undo are three days old.

## Goal

A cell's material, an edge's material and a cell's item are **indices into a mapping owned by
a region**, and the only identity fixed in code is `0 = nothing`.

## Why

> *"We have 256 terrains and walls and that will be plenty for many games, however open world
> games give their own problems. So we need to be able to define regions with their own
> mapping of walls and terrains … Each defined gameplay level can have a totally unique
> mapping of its own (it doesn't have the region border problem). Items placed in the world
> get their own mapping similar to the other mappings. So there cannot be hard-coded mappings
> left outside 0 = nothing for terrain/wall/items."*

256 is plenty for one game and nowhere near enough for an open world that wants a desert, a
mountain range and an ocean to each have their own palette of ground, walls and dressing.

## What is hard-coded today — counted, not estimated

| | uses |
|---|---|
| `SURFACE_MAT` · `ROAD_MAT` · `FIELD_MAT` · `FLOOR_MAT` · `ROOF_MAT` | 75 · 39 · 14 · 41 · 15 |
| `WALL_MAT` · `DOOR_MAT` · `FENCE_MAT` | 60 · 39 · 38 |
| `SPECIES_TREE` · `SPECIES_BUSH` | 3 · 5 |

**329 uses**, of which **22** compare a stored byte to a compile-time identity
(`== ROAD_MAT` and friends). ⚠ **The 22 are the real work; the other 307 are mostly a cell
being WRITTEN with an identity**, which under this design becomes *written with whatever this
region calls a road* — a lookup, not a constant, and mechanical once the lookup exists.

⚠ **AND TWO OF THE SITES ARE THREE DAYS OLD.** `hex_editor::ground_kinds()` and
`edge_kinds()` ([plan 20](../20-verticality-last/README.md) `A2`/`A2c`) are exactly the shape
this forbids: a table mapping byte 2 to *road* and byte 1 to *wall*, with the slope limit
hanging off it. They were the right answer to *"do not hard-code terrains, make this an
attribute"* and the wrong answer to this one — **the attribute belongs to the identity and the
identity belongs to the region**. Plan 20 is not wrong; it is one level short.

## ⚠ The design already exists — in the PREDECESSOR model, unconsumed by the editor

**Found before `R1` was built, and it reshapes it.** `lib/moros_map/src/palette.loft` already
holds exactly the object this plan describes:

> *"The voxel is seven integers and NOTHING ELSE: a `u16` height and six `u8`s. Those `u8`s
> are not values, they are INDEXES — every name, every category, every float lives here
> instead, stored ONCE per definition rather than once per cell."*
> *"SLOT 0 IS ABSENCE, IN ALL THREE TABLES … Getting this wrong would not crash — it would
> make empty space render as whatever material happened to be defined first, which is
> precisely the kind of failure that looks like a texture bug for a week."*

Three tables — `MaterialDef`, `WallDef`, `ItemDef` — one palette per `Map`, `PALETTE_MAX` 256
because that is what a `u8` can name, and a refusal rather than an append past it. The user's
constraint, already written down, already gated (`moros_map/tests/palette.loft`).

⚠ **AND THE LIVE EDITOR DOES NOT USE ANY OF IT.** Measured — this tree carries **two world
models**, split cleanly by consumer:

| model | palette? | consumed by |
|---|---|---|
| `moros_map`'s `Map` | **yes**, three index tables | `moros_editor`, `moros_render`, `moros_sim` |
| `hex_voxel`'s voxel | **no**, compile-time constants | `editor_server`, `hex_editor`, `hex_mesh`, `hex_part` |

`hex_voxel`'s own header says why: *"THIS IS NOT A REFACTOR OF `moros_map` … `moros_map` sits
at a PREDECESSOR of the contract … Being in one tree buys DESIGN reuse, not code reuse."* The
successor deliberately did not carry the palette across, and used constants instead.

⚠ **SO `R1` IS NOT *DESIGN A MAPPING* — IT IS *CARRY ONE ACROSS*.** Building a fresh palette in
`hex_editor` would be the **third** implementation of one idea in a tree already spending plan
19 on removing exactly that kind of duplicate. It would also have been the third list in three
days, after `ground_kinds()` and `edge_kinds()`.

⚠ **AND IT CANNOT SIMPLY BE ADOPTED WHERE IT SITS.** `moros_map` is a Moros package and the
editor is lavition; a universal editor depending on the game's package is the arrow
`tools/layering.sh` exists to refuse, and the one `moros_ui`/`moros_terrain` already cost this
tree a rename each. The palette has to land in a `hex_*` package, which entangles `R1` with
[plan 19](../19-lavition-split/README.md).

⚠ **WHAT DOES *NOT* CARRY ACROSS IS THE PAYLOAD.** `md_texture` and `md_tint_r/g/b` are the
predecessor's rendering answer; this tree's colour now comes from `hex_mesh::surfaces()`, and
`sf_mat` joins it to the material axis. So the STRUCTURE carries (three tables, index-not-value,
slot 0 absence, a 256 refusal) and the FIELDS are a fresh decision — which is `R1`'s real
design work, and is smaller than it looked.

## What `R1` turned up

**Built:** the palette lives in `hex_voxel`, beside the voxel whose bytes are its indices —
the user's call, *"hex_voxel, keep them together"*. Three axes on three section tags
(`PALM`/`PALW`/`PALI`), `PAL_MAX` 256 because that is what a `u8` can name, slot 0 absence on
all three, and `world_palette_check` refusing a byte no entry names.

⚠ **THE STORE OWNS IDENTITY AND THE CONSUMER OWNS POLICY**, which is what lets plan 20 and
plan 21 both be right. `hex_voxel` says byte 2 is called *road*; `hex_editor` says what a road
may do. A palette carrying slope limits would be a store with an opinion about its consumers —
the thing the section mechanism exists to avoid — and the split means two worlds may number
their ground differently and still agree about slopes.

⚠ **AND A WORLD WITH NO PALETTE KEEPS THE BUILT-IN NUMBERING.** That is not a default to tidy
away: every world written before this is one, and the fallback is what lets the change arrive
with no migration. When a world *does* carry a palette, the byte constants stop meaning
anything — gated by a test that names byte **5** `road` and gets a road's limit on it, and by
its control, which names byte **2** (`ROAD_MAT` in code) `grass` and must get grass's freedom.
Sabotaged: ignoring the palette fails both.

⚠ **A SIBLING FILE COULD NOT CALL THE ENTRY'S FUNCTIONS — and my first reading of that was
wrong.** The palette started as `src/palette.loft` and was folded into `hex_voxel.loft`; I
recorded the reason as *a sibling cannot see its own package's entry*, then built the repro
and found that is **not** what happens. Measured
([loft#826](https://github.com/loft-lang/loft/issues/826)):

| a sibling uses | result |
|---|---|
| a **type** from the entry | **ok** — `World` was always visible |
| a **function** from the entry | **refused** — `Unknown function` |

So the palette had to be folded in because it calls `world_set_section`,
`world_section_bytes`, `world_section_at` and `world_column` — entry *functions* — not because
types were invisible. ⚠ The distinction matters for the next split: a sibling that only names
types is fine, and one that calls a single entry function is not.

⚠ **And a second, plainer defect fell out of the repro**: with two siblings present, a type
declared **once in the entry** is reported as *"declared by more than one package — write
`helper::Thing` or `second::Thing`"*, naming two packages that do not declare it.

⚠ **AND THE NAMES ARE PROVISIONAL BECAUSE `moros_map` IS BOUND FOR DELETION.** `PALETTE_MAX`
and `ABSENT_NAME` are its, and `editor_server`'s graph reaches both packages today, so this
took `PAL_MAX` and `PAL_ABSENT`. When the predecessor goes, they can take the natural names.

**What `R1` does not do**: nothing writes a palette yet — no gesture, no editor command, and
`data/` carries none. It is reachable and gated, and its first real author is `R2`.

## What `R2` turned up

**Built:** a palette line is `region:slot=name`, and a chunk carries its region in an `RGNS`
section (`cx,cz=region`). A gesture asks `world_region_at(w, q, r)` and resolves the byte
through that region's table.

⚠ **OPEN QUESTION 1 IS ANSWERED, AND COST DECIDED IT: A REGION IS A PROPERTY OF THE CHUNK.**
There is no room in the cell — a `u16` and six `u8`s, all spoken for — and a per-cell answer
has to be cheap: `A2c` measured what a six-lookup question per cell costs a stroke (262 ms).
The mesher, the streamer and the dirty set already iterate chunk by chunk, so the label is
resolved once where they already stand. **The price is 32-hex granularity at a seam**, which
is exactly what `R3`'s blend band is for — so the coarse answer is not a compromise, it is the
input the next phase needs.

⚠ **REGION 0 IS THE DEFAULT, SO `R2`'s NEGATIVE CONTROL HOLDS BY CONSTRUCTION.** An unassigned
chunk is region 0 and region 0 is where `R1` wrote everything, so a world with no regions
resolves byte-for-byte as before — not because anything was careful, but because there was
nowhere else for it to go.

⚠ **AND A REGION WITH NO PALETTE FALLS BACK TO THE BUILT-IN NUMBERING** — `R1`'s rule applied
per region rather than per world. That is what lets a world name one biome without naming them
all. ⚠ My first test asserted the opposite (*an unnamed region clamps nothing*) and was wrong
about the code rather than the other way round; the claim it became is sharper — the same byte
gives a **road's** limit where the region names it one and the **built-in field's** where no
region does, and the two must differ.

⚠ **ONE SECTION PER AXIS MEANS A WRITE MUST PRESERVE ITS NEIGHBOURS.** Setting region 1's
palette rewrites the whole `PALM` section, so a careless writer drops every other biome —
gated, and sabotaged by making the write start from empty.

**Cost after `R2`**: 4 ms a stroke on open ground, 46 ms with a fenced yard in the disc —
unchanged from `A2c`, because the region lookup rides the paths already memoised.

## Anchors

| | |
|---|---|
| what a cell holds | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — the voxel, its material byte, its item byte |
| how a world is stored | [HEX_STACK.md](../../doc/claude/HEX_STACK.md) — the store is the only authority; a mapping is a section, not a second store |
| the tagged-section rule this rides on | [PARTS.md §P2](../../doc/claude/PARTS.md) — an unknown section is skipped by its length, so a mapping can arrive without breaking an older reader |
| what currently owns the attributes | `hex_editor::ground_kinds()`, `edge_kinds()`; `hex_mesh::surfaces()` and its `sf_mat` join |
| **the palette that already exists** | `lib/moros_map/src/palette.loft` + `moros_map/tests/palette.loft` — the predecessor's version, gated, unconsumed by the editor |
| why it cannot be adopted in place | [LAVITION_SPLIT.md](../../doc/claude/LAVITION_SPLIT.md) — a universal package may not depend on a Moros one |

## Invariant gate

⚠ **A mapping is an exact round trip, not an approximation**, so every phase has a concrete
target and a negative control.

| Phase | Concrete expected result | Invariant it pins | Negative control |
|---|---|---|---|
| `R1` | a world saved with a mapping and reloaded resolves every stored byte to the same identity, byte for byte | *a stored byte means what its region says it means* | a byte with **no** entry must be REFUSED at load, not silently drawn as ground — that is how a wrong palette would look correct |
| `R2` | with two regions, the same byte `3` resolves to different identities either side of the seam | *identity is per region, not per world* | a world with ONE region must resolve exactly as today, byte for byte |
| `R3` | a cell in the blend band resolves to one region's identity or the other's, never to a third | *a blend chooses; it does not invent* | a band with no overlap in its two palettes must refuse rather than produce a hole |
| `R4` | a level's mapping is total and self-contained: nothing in it refers to a world palette | *a level has no border problem because it has no border* | a level that references a region identity must be refused |
| `R5` | every one of the 22 identity comparisons goes through the mapping | *no identity is decided in code* | ⚠ a grep-based gate: any new `== *_MAT` outside the mapping fails the check — the same shape as `tools/names.sh` |
| `R5a` | a house whose floor is byte 20, named `floor` by its region, recovers **identically** to the same house on byte 4 — anchor, extent, rotation, cell count and both residuals | *a reader sees the floor its WORLD names, not the one this package numbers* | ⛔ **two, and the second is the one that matters.** Byte 20 named by nothing must recover NO house (or the fixture is not moving the thing under test), **and** byte 4 named `grass` must stop being a house — a fallback can fake the first and not the second |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`R1`** — the palette lands in `hex_voxel`; identity resolved through it | MH | `hex_voxel/tests/palette.loft` (12) + `hex_editor/tests/slope_limit.loft`'s three palette claims | ✅ shipped |
| **`R2`** — many regions, and a cell knows which it is in | MH | `hex_voxel/tests/palette.loft`'s six region claims + a gesture reading its own region | ✅ shipped |
| **`R3`** — the in-between band: two palettes blending, then switching | H | a structure carrying across a seam; the no-overlap refusal | Blocked on `R2` |
| **`R4`** — a gameplay level's own mapping | M | a level loads with a palette that shares nothing with the world's | Blocked on `R1` |
| **`R5a`** — the FLOOR role, and the docket that counts the rest | M | `hex_editor/tests/role_mat.loft` (4) — a renumbered house recovers identically, an un-named byte recovers nothing, and byte 4 called `grass` stops being a house; `tools/roles.sh` checked against a seeded bypass AND against two on one line | ✅ **SHIPPED** |
| **`R5b`** — the EDGE roles: `wall`, `door`, `fence` through a region-aware `edge_kind_at` | M | `hex_editor/tests/role_mat.loft` — a world that numbers its own door has it cut and walked through; `edge_kind_of` has no `_at` sibling today, so `PAL_EDGE` reaches nothing. ⚠ **And one of its four sites argues the opposite in its own comment**: `session_select_wall` refuses `DOOR_MAT`/`FENCE_MAT`/`WINDOW_MAT` *"deliberately"* — *"whether a slot is a legal wall type is a fact about the NUMBER … a selection is the author's and outlives the world they load next."* That is a real tension, not an oversight: a SELECTION has no cell and therefore no region, so there is nothing to resolve it against. `R5b` has to settle whether the reserved edge bytes are vocabulary (world-independent, and the row becomes a `definition`) or palette (and the refusal needs a world). It is docketed `debt` until then, because the answer is not yet taken | ✅ **SHIPPED** — and the tension was answered by MOVING the question rather than settling it: `open_ahead`/`open_span` **do** hold a world and a cell, so the check that needs one went to the GESTURE and `session_select_wall` is untouched |
| **`R5b.2`** — the eight `edge_is_wall` READERS, and it is a COST step | M | `peel.loft` and `planview.loft` re-timed A-B-B-A either side, plus a house whose wall is a DECLARED type recovering identically to the same house on byte 1. ⛔ **The eight sit inside `for r … for q … for d in [4, 5, 0]` window scans**, which is the surface `R5a` already blew a 300-second deadline on — so the wiring is mechanical and the measurement is the step. ⚠ Until it lands, a world that declares its own door is **walked through and still drawn as masonry** (`hex_mesh::wall_up`, `planview`'s colour), which is a visible inconsistency rather than a gap | ✅ **SHIPPED** — and it found two things the wiring was not looking for: the edge palette has **two namespaces** (a role word, or a wall TYPE's own name — conflating them made a declared type stop being a wall, caught by the three fixtures in the tree that carry an edge palette), and `corner_write` had been **deleting a door** standing in the corner since `B4y`, which is why that site is REMOVED rather than resolved |
| **`R5b.3`** — the MESHER, and it is the visible half | M | `hex_mesh::wall_up`, `wall_up_part`, `chunk_mesh_props` and `emit_run_wall`'s half-width, plus `planview`'s colour — five sites in a package that depends on this one. ⚠ **Until it lands a world's own door is walked through, cut, recovered and described correctly and still DRAWN as masonry**, which is a visible inconsistency rather than a gap. Its verify is a chunk mesh with a declared door emitting the door's triangle count and not the wall's, plus the stream path re-timed — `chunk_mesh_props` scans every cell of every chunk | Blocked on `R5b.2` |
| **`R5c`** — the remaining ground roles (`roof`, `road`, `grass`) and the docket at zero `debt` | M | `tools/roles.sh` in `make fast` as a GATE rather than an advisory, with `roles.tsv` holding definitions only | Blocked on `R5b.3` |

## Open questions

1. **Where does a cell's region come from?** It is not in the cell — there is no room, and a
   region is much larger than a cell. A chunk-level label, a spatial index of region polygons,
   or a section listing region extents? ⚠ Whatever it is, it must answer *per cell* cheaply:
   the mesher asks for every cell of every chunk it builds, and `A2c` already measured what a
   six-lookup question per cell costs a stroke.
2. **Does the blend band live in the data or in the reader?** A band could be stored as its
   own region with a merged palette, or derived at read time from the two it lies between.
   Stored is simpler to reason about and duplicates identities; derived is one authority and
   costs a lookup on every read.
3. **What is a mapping's identity made of?** A name (`"road"`), a handle into a catalogue, or
   a structural description? A name is greppable and stable across regions; a handle is what
   lets two regions genuinely share a definition rather than agreeing by spelling.
4. **Do the attributes travel with the identity or with the region?** A desert road and a
   mountain road are both *road* — do they share a slope limit? ⚠ Plan 20 hangs `tr_slope` off
   the identity, and if the answer is *the region decides*, that field moves too.
5. **What happens to `hex_mesh::surfaces()`?** Its `sf_mat` join points at compile-time
   constants. Under this design a colour belongs to a region's palette entry, and the drawn
   list becomes *what this region's identities look like* — which is a bigger change to the
   wire id space than it first appears, because that list's ORDER is the mesh id space.

## What this does not change

⚠ **`0 = nothing` stays universal**, on all three axes. It is the one identity the store
itself depends on: absence is how an unwritten cell, an unmarked edge and an empty item slot
are all told apart from a written one, and `E1`/`@HB-X70` are built on it.

## What `R5a` turned up

**`make fast` runs `tools/roles.sh` advisory; `sh tools/roles.sh` is the gate.**
`lib/hex_editor/tests/role_mat.loft`, four tests, seen red before the change: **3 failed,
1 passed**, and the one that passed was the control.

### ⛔ The resolver had shipped and twenty-two sites walked past it

`R1` built `ground_kind_at(w, q, r, mat)` — *the identity comes from the world, the policy
from here* — and `R2` made it read the cell's own region. It has **thirteen** production call
sites. **Beside them, twenty-six more asked `mat == FLOOR_MAT` and friends**, which is a
compile-time integer out of `hex_editor` answering a different question: *what does Moros
number a floor.*

⛔ **AND THIS PLAN'S OWN FIGURE WAS 22, WHICH IS THE SMALLER FINDING AND THE MORE DURABLE
ONE.** That number was counted by hand when the plan was written and nothing re-ran it. Taken
with one scanner over both arms — `HEAD` and the working tree — the counts are **31 before and
26 after**, of which **5 are the role DEFINITIONS** and were never the work. *A hand count is a
number that only goes stale*, which is this tree's *a check nobody runs drifts red in silence*
one level down, and it is the argument for the docket rather than for a paragraph.

⚠ **THE FIVE THAT MATTERED MOST WERE THE READERS A BLUEPRINT IS MADE OF.**
`house_recover_claimed`, `region_recover_claimed`, `house_fits_at`, `touched_cells` and the
room's re-fill each scan a window for `FLOOR_MAT`. So a world that numbers its own floor is
read correctly by every slope rule and is **invisible to every structure reader** — the plan
view draws its field and describes nothing on it.

⛔ **AND NO SUITE COULD EVER HAVE CAUGHT IT.** No world in this corpus carries a material
palette, so a bypass and the resolver return the same byte on every fixture we own. The defect
exists only in somebody else's world, which is exactly the class [FOCUS](../../doc/claude/FOCUS.md)
§2 says a stranger hits first and nothing here tests.

### ✅ What the fix is, and what it is not

`ground_is(w, q, r, mat, ROLE_FLOOR)` — `ground_kind_at` asked the one question a rule may
have. **No new mechanism**: the resolver, the region lookup and the fallback are `R1`/`R2`'s,
untouched.

⚠ **IT IS A PREDICATE AND NOT A BYTE LOOKUP, AND THE DIRECTION WAS A DECISION.** *Which byte
does this region call `floor`* reads better at a call site, hoists out of a loop, and is
**wrong**: nothing forbids a region naming two bytes `floor`, and an inverse has to answer
with one. Asking the cell keeps the answer total.

⚠ **AND THE ROLE NAMES ARE CONSTANTS IN THE TABLE THAT DEFINES THEM** — `ROLE_GRASS` …
`ROLE_WATER`, referenced by `GROUND_KINDS`' own rows, so the name a caller compares against
and the name the resolver returns are one string. ⚠ The water rows keep their literals:
`water-e` … `water-ne` are one name per direction and a rule asking about a *flow* would be
reading geometry out of a string.

### ⚠ The control is the half that made the claim mean anything

The fixture places a real house with the gesture and then **moves only the byte** — 4 → 20,
every cell edited rather than replaced. Byte 20 is in no row of `GROUND_KINDS` on purpose, so
an unnamed byte falls back to `grass` and:

| | |
|---|---|
| byte 20, no palette | ⛔ **no house recovered** — so the fixture is moving the thing under test |
| byte 20, region names it `floor` | ✅ recovered, and **every field equal** to the byte-4 house |
| byte 4, region names it `grass` | ⛔ **no house** — the half a fallback cannot fake |
| the region reader, byte 20 named `floor` | ✅ same cells, same sides |

⚠ **`hs_ok` ALONE WOULD HAVE PASSED ON A READER THAT FOUND A DIFFERENT RECTANGLE SOMEWHERE
ELSE**, so the anchor, the extent, the rotation, the cell count and both residuals are all
compared against the byte-4 run.

### ⛔ And the docket's own instrument was blind twice, in one afternoon

`tools/roles.sh` counts what still decides an identity in code — 24 rows, **21 `debt` and 5
`definition`** (`edge_is_wall`, `is_opening` ×2, `is_water`, `ground_kind_default`: sites that
ARE the role rather than a use of it). It was wrong twice before it was believed:

| | |
|---|---|
| ⛔ a greedy `sed` took the LAST constant on a line | `slot == DOOR_MAT \|\| slot == WINDOW_MAT` reported **`WINDOW_MAT` only** — the docket's answer for a real bypass was *nothing here* |
| ⛔ awk has no `\b`, so a pattern ending `_MAT` matched **`PAL_MATERIAL`** as `PAL_MAT` | a palette AXIS constant entered the docket as a material identity |

✅ **Both found by reading the first baseline against the grep it came from**, and the fix is
checked against a case it should find rather than trusted: a seeded bypass is reported, and
**two on one line are reported as two**.

⚠ **NOTHING IS PATTERN-SKIPPED AND EVERY ROW CARRIES A VERDICT** — `tools/dups.tsv`'s shape,
for `tools/layering.sh`'s reason: a guard with a rule-shaped exemption exempts things by
accident, which is how `moros_ui` stayed outside the layering check for months.
⚠ **And the row is keyed on the enclosing FUNCTION**, because a file is not fine enough to
carry a verdict: `gesture.loft` holds four `== SURFACE_MAT` and one of them is
`ground_kind_default` reading the grass row out of the table it is the home of.

### ⛔ And it cost 180×, which `planview` said out loud before any probe did

**`probe/roles/cost.loft` — 40 000 calls an arm, timed A-B-B-A in one process.** The five
moved sites are all window scans inside `O(window² × peel rounds)`, so the per-call constant
is the whole question.

⚠ **THE FIRST SIGN WAS A TEST AT THE 300-SECOND WALL, AND IT WORE THE COSTUME THIS TREE HAS
WRITTEN DOWN.** `make fast` came back with `hex_mesh/planview did not finish inside 300s` while
a sibling's CI held the load average between 24 and 76 and `pgrep -f cargo-nextest` was loud —
which is exactly the known-flaky failure `CLAUDE.md` says a real one hides behind. It was green
before this change and it is the file whose readers this change makes heavier, so it was **not**
attributable to the sibling, whatever the load said.

⛔ **AND A 300-SECOND TEST COULD NOT SETTLE IT ON THAT BOX.** The interleaved old-vs-new run was
started and abandoned: at load 51 this tree has measured the same binary on the same code timing
**8× apart**, so the reading would have been worth nothing. What answers under load is a **tight
loop timed A-B-B-A in one process** — a ramp then shows as `A1 ≠ A2` instead of hiding inside
whichever arm it landed on. `probe/perf/place_phases.loft`'s rule, borrowed.

| 40 000 calls | |
|---|---|
| `mat == FLOOR_MAT` | **2 ms** |
| ⛔ `ground_is` as first written | **365 ms — 180×** |
| the region lookup alone | 19 ms |
| the palette lookup alone | 23 ms |
| **the table walk + row copy** | **75 ms** |
| …and the rest | the SECOND copy: `ground_kind_of` returns a row, `ground_kind_at` returns it again |

✅ **`ground_role_at` returns the NAME, and that is 179 → 77 ms — 2.3×.** It is now cheaper than
the `ground_kind_of(m).tr_name` sub-arm beside it (113 ms), which still copies, so the copies
were the cost and not the lookups.

⛔ **IT IS A SECOND STATEMENT OF ONE RULE AND THAT IS GATED, NOT DENIED.** Folding it into
`ground_kind_at` was tried and does not work: the struct path's last fallback is
`ground_kind_default(mat, nm)` — a row *wearing the caller's byte* — and **a name cannot carry
"and it came from the fallback"**. So `tests/role_mat.loft` pins the two doors equal for **every
byte a `u8` can hold, in both palette states**, with a control that the palette is actually
being read.

### ⚠ What `R5c` inherits, measured rather than left to be rediscovered

**Per-cell resolution has a floor of about 2 µs** — a region lookup, a palette lookup and a
table walk — against **0.025 µs** for an integer compare. Removing the copies got 2.3× of it and
there is no more to get that way: **the only way back to an integer compare is for the CALLER to
hoist**, resolving *which byte does this region call `floor`* once per scan.

⛔ **And that inverse is the design `R5a` deliberately refused**, for a reason that has not
changed: nothing forbids a region naming two bytes `floor`, and an inverse has to answer with
one. `R5c` has to settle it — a lowest-slot rule, a refusal, or a per-region memo the scan
carries — and it now has the number that says whether the trouble is worth it.

⚠ **AND THE MESHER HAS BEEN PAYING THIS SINCE `R1`, UNMEASURED.** `hex_mesh` calls
`ground_kind_at` per cell at **five** sites (`chunk_mesh_*`), each **2.8 µs** with the row copy
this step just measured. Nobody had timed it, and it is the same constant in a hotter loop.

### ⛔ THE CORRECTION — I attributed the timeout to my change, and the baseline refutes it

**Measured 2026-08-30, and it overturns the previous section's headline** (and commit
`dc611bd`'s subject line, which says *"The timeout was mine, not the sibling's"*).

| `hex_mesh/tests/planview.loft`, one run each | | load |
|---|---|---|
| ⛔ **pre-`R5a` — no `ground_is` in the tree at all** | **342 s** | 31 · 40 · 40 |
| ✅ with `ground_role_at` | **266 s** | 30 · 42 · 40 |
| the first `ground_is`, in `make fast` | did not finish inside 300 s | 33 → 76 |

**The code that predates this plan's step ALSO exceeds the 300-second wall at this load.** So
the `make fast` timeout is **not** attributable to `R5a`; the sibling's CI is sufficient on its
own, and the earlier commit (`92ae1cb`) was right to say *not yet attributable* where the later
one claimed it.

⛔ **AND THE TWO NUMBERS ARE IN THE WRONG ORDER, WHICH IS THE POINT.** The load-independent
measurement says the new code does strictly *more* work per cell, and the wall clock says it is
**76 seconds faster**. Both cannot be true, and the clock is the one lying: it is measuring the
sibling's `cargo` as much as ours.

⚠ **THE LESSON IS NOT *CLOCKS ARE NOISY* — IT IS THAT ONE INSTRUMENT ANSWERED A DIFFERENT
QUESTION THAN THE ONE I ASKED OF IT.** `probe/roles/cost.loft` measures a **per-call cost** and
it is sound: 40 000 calls, A-B-B-A, one process, 365 → 77 ms. It never measured **what made one
test file exceed one deadline on one afternoon**, and I read a cost measurement as an
attribution. *An instrument gets checked against something it should find* — this one was, and
then it was pointed at a claim it was not built for.

✅ **WHAT SURVIVES, AND IT IS MOST OF IT.** The 180× per-call regression was real, was found by
the right instrument, and the 2.3× fix stands on its own evidence — a `GroundKind` with three
text fields built twice per cell to read six characters of it. Nothing about that depended on
the timeout.

⛔ **AND THE TIMEOUT IS A REAL STANDING FRAGILITY THAT IS NOBODY'S CHANGE.** `planview.loft`
takes **266–342 s against a 300 s deadline** on a shared box. It is not near the wall, it is *at*
it, either side of this step, and the next agent to touch any reader will meet it wearing
whatever costume the load is wearing that hour. That belongs to `tools/suite.sh`'s per-file
deadline or to splitting the file — not to `R5`.

## What `R5b` turned up

**`lib/hex_editor/tests/role_mat.loft`, thirteen new tests · `sh probe/r5b/sweep.sh` ·
`sh probe/r5b/run.sh` · [`probe/r5b`](../../probe/r5b/README.md).**

### ⛔ `PAL_EDGE` had been in the world file since `R1` and NOTHING read it

`world_palette_check` has refused an unnamed edge byte **at load** since `R1` — so the store
validated a mapping that no gesture, no walk and no reader ever consulted. `edge_kind_of` took
a bare byte and had no `_at` sibling at all. **A validated palette with no resolver is worse
than no palette**: it tells an author their declaration was accepted.

⛔ **AND THE DEFECT THAT ABSENCE PRODUCES IS NOT A MISSING FEATURE — IT IS A WALL THAT IS NOT
THERE.** `edge_is_wall` answers *wall* for every byte past `EDGE_MAT_LAST`, which is the right
default for a wall TYPE nobody named (`B4e`) and the wrong one for a slot the world calls
`door`: the store holds a door, the palette says door, and the walker is refused by masonry
that does not exist. ⚠ Nothing goes red, for `R5a`'s reason exactly — **no world in this
corpus carries an edge palette**, so the bypass and the resolver answer identically on every
fixture we own.

### ✅ What shipped, and where it stops

`edge_role_at(w, q, r, mat)` — `ground_role_at`'s question on the other axis — plus
`edge_is(…, role)` and `edge_kind_at` for the one reader that wants an attribute rather than
an identity. Four consumers were wired, all of them holding a world and a cell:

| the reader | what a world's own door does now |
|---|---|
| `edges_around` → `wall_stops_walk_at` / `wall_stops_view_at` | it is walked through, and seen through |
| `open_ahead` / `open_span` → `is_opening_at` | it can be **cut** with the author's own slot |
| `span_mark` | and it is not cut *again*, because it is already a hole |
| `run_slope` → `edge_kind_at` | a declared **fence** follows the ground at a fence's limit |

⚠ **THE SETS ARE TRANSLATED EXACTLY, INCLUDING THE ONE THAT LOOKS WRONG.** A WINDOW does not
stop a walker today and still does not. A step that also changed which materials block would
be two changes wearing one diff, and the byte pair is what this is compared against.

### ⛔ AND THE STEP STOPS AT EIGHT MORE SITES ON PURPOSE — because of what `R5a` cost

`edge_is_wall` has **12 production call sites**. Two are the byte pair itself; ten are
consumers, and **eight of them sit inside `for r … for q … for d in [4, 5, 0]` window scans**
— `mark_left`, `face_at`'s extent, the house and region acceptance readers, `corner_write` and
`corner_pool`. Those are `peel.loft`'s own cost surface.

⛔ **`R5a` IS THE ARGUMENT, NOT A PREFERENCE.** Moving *five* window scans onto `ground_is`
put `hex_mesh/tests/planview.loft` through `loft test`'s 300-second wall and took two commits
to recover — the plan's own *"the timeout was mine"* section above. Wiring **eight more** in
the same diff as the walk would put two unrelated risks in one change, twelve hours after
`peel.loft` was brought from 70% of its deadline to 26%. **`R5b.2` is a COST step, not a
wiring step**, and it now has an exact list rather than a hand count.

⚠ **THE HALF-FIX IS NAMED RATHER THAN LEFT TO BE FOUND**: until `R5b.2`, a world that declares
its own door at a high slot is *walked through* and still *drawn as masonry* —
`hex_mesh::wall_up` and `planview`'s colour are the other two consumers, in a different
package. That inconsistency is visible and is the reason `R5b.2` is next rather than optional.

### ⛔ Pinning the two doors together found that ABSENCE WAS MASONRY

`ground_role_at` is a second statement of `ground_kind_at`'s resolution and `R5a` pinned them
equal on every byte rather than trusting a comment. The same pinning on the edge axis went red
on its **first byte**:

> `byte 0: the name door says '-' and the row door says 'wall'`

`edge_kind_of(0)` fell through its table and answered `wall`, slope 1 — *no edge here*,
reported as masonry that constrains a run. ⚠ **It was computed by nobody**: every reader skips
byte 0 before asking, and `run_slope` has `if m == 0 { continue; }` on the line above its own
call. So it could only ever surface by asking the function directly, **which is what a
two-derivations equality does and a test of the readers does not**.

### ⚠ The cost, measured — and `B4e`'s objection was right about the shape and wrong about the size

`B4e` refused to resolve an edge byte in its own words: *"every caller holds a byte and no
world — the walk asks this per edge per step."* `edges_around` reads three edge slots of every
cell in a `(2·reach+3)²` window, so that objection is about the **absence** case, which is
nearly all of it.

| `probe/roles/cost.loft`, A-B-B-A **in one process**, 40 000 calls an arm | byte | resolved |
|---|---|---|
| an ABSENT edge, first version | 5 ms | ⛔ **57 ms** |
| an ABSENT edge, with the guard | 2 ms | ✅ **1–3 ms** |
| a real wall or door | 2 ms | 156 ms |

✅ **The guard is one line — `if mat == 0 { return false; }` at the predicate** — and it cannot
change an answer, because `world_palette_name` returns `PAL_ABSENT` for slot 0 before it looks
at anything, so **no world can name slot 0**. ⚠ It is a second statement of a rule
`edge_role_at` already makes, so it is said out loud, pinned by the every-byte equality, and
**swept as its own row: cutting it leaves every test green**, which is what says it is a speed
cut and not a rule.

⛔ **AND THE WALL CLOCK ON THE SCAN ITSELF IS NOT AN INSTRUMENT ON THIS BOX.** The first
version of `probe/r5b/run.sh` read AFTER / BEFORE / AFTER and its two AFTER rows came back
**186 ms and 474 ms — same binary, same program, 2.5× apart.** Re-run as a build-level
A-B-B-A with `/proc/loadavg` beside every row, AFTER is 141–175 ms and BEFORE 138–222 ms:
**the ranges overlap and AFTER is never the slower of a pair**, which is all it can honestly
say. ⚠ **The load-robust number is the one-process arm table above**; this probe only says
whether that per-call cost shows up in the scan at all. It does not.

### ⚠ And `session_select_wall`'s tension is answered by moving the question, not by settling it

The phases table asked whether the reserved edge bytes are *vocabulary* (world-independent) or
*palette* (and the refusal needs a world), because **a selection has no cell and therefore no
region**. Both horns were avoidable: `open_ahead` and `open_span` **do** have a world and a
cell — the author is standing in one — so the check that needs a world was moved to the
**gesture**, where `px_to_hex` is hoisted three lines and answers it. `session_select_wall` is
untouched and its comment stays true: *a selection is the author's and outlives the world they
load next.* ⚠ **The tension was real and the question was in the wrong place.**

### The sabotage sweep

⚠ Restored from copies, never `git checkout`; the subject asserted present before row 0; every
row asserted to have BUILT before its result was read.

| row | what was cut | |
|---|---|---|
| 0 | control | green |
| 1 | `edge_role_at` never reads the palette | ⛔ RED (6) |
| 2 | absence falls through to the wall default | ⛔ RED (2) |
| 3 | a fence blocks the VIEW too — the two sets collapse | ⛔ RED (2) |
| 4 | `edges_around` still asks the BYTE pair | ⛔ RED (4) |
| 5 | `open_ahead` asks `is_opening`, not `is_opening_at` | ⛔ RED (1) |
| 6 | `run_slope` asks `edge_kind_of`, not `edge_kind_at` | ⛔ RED (1) |
| 7 | `edge_kind_of(0)` is masonry again | ⛔ RED (2) |
| 8 | ✅ the wall/door rows in a different ORDER (valid) | ✅ green |
| 9 | ✅ the walk's absence GUARD dropped (a speed cut) | ✅ green |

⚠ **Rows 8 and 9 are why the table means anything.** A sweep of only-red rows cannot tell *the
tests see this* from *the tests fail on anything touched here* — and row 9 is the one that
turns the guard from an optimisation somebody has to trust into one the suite has checked.

### What the docket did

**23 rows → 22; 21 open sites → 18.** `span_mark` and `open_ahead` no longer name `FENCE_MAT`
at all, and `wall_stops_walk`'s row moves `debt` → `definition` on the same grounds
`edge_is_wall` and `is_opening` already carry: **it has no production caller now** — it is the
built-in numbering `edge_role_at` falls back to, and the arm the resolved pair is compared
against on every byte a `u8` can hold.

### The equivalence, which is the upper bound of the step

- `walk-exact` — **77 scripts, every walk the world can see at `rate 0`.**
- `role_mat.loft`'s every-byte comparison: with no palette, `wall_stops_walk_at`,
  `wall_stops_view_at` and `is_opening_at` equal their byte forms on **all 256** bytes.
- `make fast` green.

### ⚠ AND THE DEADLINE WARNING THIS RUN PRINTED IS NOT MINE — checked rather than assumed

`make fast` came back **184 files, all green**, and named one file past half the per-file
deadline: `hex_editor/octagon`, **160.2 s — 53%**, at load 31.05 with 16 jobs. `run_slope` is
the one changed line a tower's cells reach, so the attribution was tested rather than argued —
A-B-B-A on that single line, `octagon.loft` alone:

| | load | |
|---|---|---|
| A1 AFTER `edge_kind_at` | 14.3 | 78.2 s |
| B1 BEFORE `edge_kind_of` | 8.8 | 74.4 s |
| B2 BEFORE again | 5.9 | **88.4 s** |
| A2 AFTER again | 8.5 | 74.8 s |

**The ranges overlap and the slowest row is a BEFORE.** ⚠ And the file is 74–88 s run alone
against 160 s inside `make fast`'s 16-way parallel phase, so **that number is the loop's
contention, not the file's cost** — `04f6d12`'s lesson (*the baseline refutes my attribution*)
one plan section down, and the reason `run_slope`'s memo (`lim_at`) means a tower pays it once
per run cell rather than per pass.

## What `R5b.2` turned up

**`lib/hex_editor/tests/role_mat.loft` (29) and `tests/corner_close.loft` (5) ·
`sh probe/r5b/sweep.sh` (21 rows, two files) · `sh probe/r5b/cost.sh` ·
[`probe/r5b`](../../probe/r5b/README.md).**

Eight `edge_is_wall` consumers rewired: `mark_left`, `oct_fits_at`'s extent scan,
`house_recover_claimed`, `region_recover_claimed`, `wall_corner_close`, `corner_write`,
`room_add`'s union and `session_run`'s own material.

### ⛔ THE EDGE PALETTE HAS TWO NAMESPACES AND `R5b` SHIPPED THEM CONFLATED

A slot's first word is a **role** when it is one of the reserved words, and a wall **TYPE's
own name** otherwise: `wall_type` reads `"octtower body=THICK_OCT"` and `pal_word` takes
`octtower` off the front (`B4d`). `edge_role_at` returned the **raw string** as the role, so a
**declared wall type stopped being a wall** the moment a reader asked.

| `make fast` | |
|---|---|
| ⛔ `hex_editor/house_box` | *the leftover declares '', not 'THICK_OCT'* |
| ⛔ `hex_editor/octagon` | 7 of 24 |
| ⛔ `hex_mesh/planview_shape` | 6 of 19 |

⚠ **THOSE THREE ARE THE ONLY FILES IN THE TREE WHOSE FIXTURES CARRY AN EDGE PALETTE AT ALL** —
so *the fixtures that have the thing* is what caught it, which is this tree's own instrument
rule paying for itself. ⛔ **And `R5b` was green through it**: the walk never meets a declared
type in these fixtures, and `edge_kind_at`'s unknown-name branch answered slope `1`, which is
masonry's anyway. **A latent conflation only shows when a reader asks the question.**

✅ **The fix is one clause and it is `edge_is_wall`'s own doctrine restated.** An undeclared
high byte is *a wall whose type is missing*, so a declared one is **a wall whose type is
known**: the four role words are reserved, everything else names a type, and a type is a wall.
`edge_kind_at` resolves through the same clause so the two doors cannot disagree, and
`wall_type` still reads the declaration untouched (asserted).

### ⛔ AND THE STEP FOUND A DEFECT THAT PREDATES IT — `corner_write` deleted a door

`corner_write`'s header has said *"The **unmarked** edge whose two corners are exactly these
two vertices, written"* since `B4y`. Its test was `edge_is_wall`, **which is false for a
DOOR**, so a doorway standing exactly on the join edge was not skipped:

| [`probe/r5b/door_corner.loft`](../../probe/r5b/door_corner.loft) — `8 × 3`'s own join edge | |
|---|---|
| the join edge, found rather than named | `(4,−2)` dir 0 — the one edge neither run lays |
| a door planted before the second wall | edge holds `2`, **1 door** |
| ⛔ after the second wall | edge holds `1`, **0 doors** |

⛔ **AND THE BYTE PREDICATE HAD BEEN PROTECTING A DECLARED DOOR BY ACCIDENT.**
`edge_is_wall` answers *wall* to every byte past the vocabulary, so a world's own door at slot
7 was skipped — correctly, for the wrong reason. **Resolving that site would have spread the
defect to it.** ⚠ **A consistency fix that spreads a defect is not a fix**, so the site is not
resolved, it is **removed**: `wall_of(…) != 0`, which is what the header always said and what
`@HB-X70` means — an edge carrying anything is already a boundary, so nothing is owed at it.

✅ `corner_close.loft` is 5 of 5, the four `B4y` claims unmoved. ⚠ **The new test's first
version asserted the wrong channel and went red for it** — it asked for 2 free ends where a
door in the corner leaves **4**, because `marks_of` collects masonry and a door is not
masonry: the two runs are two chains in *that* channel while the boundary is continuous
through the doorway.

### ⛔ THE SWEEP'S REAL ANSWER WAS COVERAGE: 2 OF 8

The first extended table rewired eight sites and **six stayed green** — which does not mean
they are right, it means nothing in the tree could tell. ⚠ Guaranteed rather than accidental:
**no world in this corpus carries an edge palette.** Five tests later — `session_run`'s
material, `wall_corner_close`, `marks_unclaimed`, `room_add`, and the octagon reader end to
end — **seven of the eight go red.**

⛔ **AND THE EIGHTH IS PROVABLY UNOBSERVABLE, WHICH IS WORTH MORE THAN A FORCED TEST.**
`oct_fits_at` scans its window for masonry to size a box, then hands that box to
`disc_marks`, **which scans it again for the same thing**. So the extent scan's answer cannot
show through the return: when it is right the marks decide, when it is wrong the marks are
empty and the answer is `false` either way. ⚠ **Which is exactly why it was wired**: the
failure mode of an extent scan disagreeing with the marks it sizes a window for is a window
**narrower** than the field — [`probe/tw`](../../probe/tw/README.md)'s cliff, where clipping a
structure does not draw a smaller picture, it stops answering.

### ⚠ And the sweep's own instrument was blind once, in the way sweeps are

Row 1's cut text went stale the moment `edge_role_at`'s body changed for the two-namespace
fix, so the sabotage **silently did not apply** and the row came back **green** — *the tests
cannot see this* wearing the costume of *nothing was cut*, with a warning line above it that a
reader scanning the table would skip. ✅ Every cut asserts a match count of 1, and an
unapplied one now prints **⛔ THE CUT DID NOT APPLY** as the row's result instead of a verdict.
⚠ **A sweep is an instrument too, and its default answer is *green*.**

### ⚠ The cost — three instruments, because the wall clock could not answer

`R5a` is why this is a step rather than a detail: five window scans onto `ground_is` put
`planview.loft` through the 300-second wall. This moves **eight**, into `peel.loft`, which was
brought from 70% of that deadline to 26% the day before.

**1 · Per call, A-B-B-A in ONE process** (`probe/roles/cost.loft`, 40 000 an arm):

| | byte | resolved |
|---|---|---|
| an unwritten edge | 1–3 ms | ✅ **1–2 ms** — the absence guard, so a scan pays nothing for it |
| ⚠ a MARK | 1–2 ms | **109–124 ms → 2 725 ns each** |

**2 · The arithmetic that follows.** A `peel.loft` fixture's field is 30 … 200 marks in a
window of 1 000 … 1 400 edge slots, so one scan pays **at most ≈ 0.5 ms** against a file of
60 … 85 seconds.

**3 · `LOFT_PROFILE=1` on `peel.loft`** — 5 421 411 samples over 187 s across 31 runs.
`edge_role_at`, `world_region_at` and `world_palette_name` appear in **neither** the
by-function list nor the hottest paths; the file is `lattice_k` 6.2%, `disc_holds` 5.4%,
`box_to_local` 4.7%. ⚠ **The list is capped at 15 rows with a 3.1% floor, so this bounds
rather than zeroes it** — and the instrument was checked: `wall_of` and `mark_left` are absent
too, while `house_recover_claimed`, a wired reader, appears **7 times in the hottest paths and
every one of them is `box_fits` → `box_holds` → `box_to_local`** — the geometry inside it,
never the predicate.

**4 · The wall clock, which is why it is fourth.** A-B-B-A at the build level, `/proc/loadavg`
beside every row:

| | AFTER | BEFORE |
|---|---|---|
| `peel.loft` | 85.0 · 68.7 s | 72.5 · 59.9 s |
| `planview_region.loft` | 28.1 · 36.9 s | 28.8 · 57.1 s |

⚠ The peel's ranges overlap and the slowest single row of the eight is a `planview_region`
**BEFORE** — but the peel's own means differ by ~1.16× and its slowest row is an AFTER **taken
at load 1.36, the quietest of the four**. That is as far as this instrument goes on this box,
and it is why instruments 1–3 are the answer: **0.5 ms a scan cannot be 12 seconds of a
70-second file.**

### What is left

**`R5b.3` — the MESHER**, and it is the visible half: `hex_mesh::wall_up`, `wall_up_part`,
`chunk_mesh_props` and `emit_run_wall`'s half-width, plus `planview`'s colour. Until it lands
a world's own door is **walked through, cut, recovered and described** correctly and still
**drawn as masonry**.
