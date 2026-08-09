# `21` — Regions own the mapping: one byte is not one identity

**Issue:** [`jjstwerff/moros#21`](https://github.com/jjstwerff/moros/issues/21) ·
**Value:** `F` · **Effort:** `VH`

## Status

**`R1` is shipped; `R2`–`R5` are designed, not built.** ⚠ `R1` was **reshaped before any code** — and ⚠ `R1` was **reshaped before any code**
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
| `hex_world`'s voxel | **no**, compile-time constants | `editor_server`, `hex_editor`, `hex_mesh`, `hex_part` |

`hex_world`'s own header says why: *"THIS IS NOT A REFACTOR OF `moros_map` … `moros_map` sits
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

**Built:** the palette lives in `hex_world`, beside the voxel whose bytes are its indices —
the user's call, *"hex_world, keep them together"*. Three axes on three section tags
(`PALM`/`PALW`/`PALI`), `PAL_MAX` 256 because that is what a `u8` can name, slot 0 absence on
all three, and `world_palette_check` refusing a byte no entry names.

⚠ **THE STORE OWNS IDENTITY AND THE CONSUMER OWNS POLICY**, which is what lets plan 20 and
plan 21 both be right. `hex_world` says byte 2 is called *road*; `hex_editor` says what a road
may do. A palette carrying slope limits would be a store with an opinion about its consumers —
the thing the section mechanism exists to avoid — and the split means two worlds may number
their ground differently and still agree about slopes.

⚠ **AND A WORLD WITH NO PALETTE KEEPS THE BUILT-IN NUMBERING.** That is not a default to tidy
away: every world written before this is one, and the fallback is what lets the change arrive
with no migration. When a world *does* carry a palette, the byte constants stop meaning
anything — gated by a test that names byte **5** `road` and gets a road's limit on it, and by
its control, which names byte **2** (`ROAD_MAT` in code) `grass` and must get grass's freedom.
Sabotaged: ignoring the palette fails both.

⚠ **A SIBLING FILE COULD NOT SEE `World`.** The palette started as `src/palette.loft`, and a
sibling cannot import its own package's entry — `use palette;` in the entry makes the sibling's
names visible to it, not the reverse. So it is folded into `hex_world.loft`, which is also
where the user wanted it.

⚠ **AND THE NAMES ARE PROVISIONAL BECAUSE `moros_map` IS BOUND FOR DELETION.** `PALETTE_MAX`
and `ABSENT_NAME` are its, and `editor_server`'s graph reaches both packages today, so this
took `PAL_MAX` and `PAL_ABSENT`. When the predecessor goes, they can take the natural names.

**What `R1` does not do**: nothing writes a palette yet — no gesture, no editor command, and
`data/` carries none. It is reachable and gated, and its first real author is `R2`.

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

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`R1`** — the palette lands in `hex_world`; identity resolved through it | MH | `hex_world/tests/palette.loft` (12) + `hex_editor/tests/slope_limit.loft`'s three palette claims | ✅ shipped |
| **`R2`** — many regions, and a cell knows which it is in | MH | the same byte resolving differently either side of a seam | Blocked on `R1` |
| **`R3`** — the in-between band: two palettes blending, then switching | H | a structure carrying across a seam; the no-overlap refusal | Blocked on `R2` |
| **`R4`** — a gameplay level's own mapping | M | a level loads with a palette that shares nothing with the world's | Blocked on `R1` |
| **`R5`** — the 22 comparisons move to the mapping, and a check keeps them there | MH | `tools/` check, seeded with a violation | Blocked on `R1` |

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
are all told apart from a written one, and `E1`/`X70` are built on it.
