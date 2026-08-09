# `21` — Regions own the mapping: one byte is not one identity

**Issue:** [`jjstwerff/moros#21`](https://github.com/jjstwerff/moros/issues/21) ·
**Value:** `F` · **Effort:** `VH`

## Status

**Designed, not built.** Nothing here is started. It is filed now because every day it waits,
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

## Anchors

| | |
|---|---|
| what a cell holds | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — the voxel, its material byte, its item byte |
| how a world is stored | [HEX_STACK.md](../../doc/claude/HEX_STACK.md) — the store is the only authority; a mapping is a section, not a second store |
| the tagged-section rule this rides on | [PARTS.md §P2](../../doc/claude/PARTS.md) — an unknown section is skipped by its length, so a mapping can arrive without breaking an older reader |
| what currently owns the attributes | `hex_editor::ground_kinds()`, `edge_kinds()`; `hex_mesh::surfaces()` and its `sf_mat` join |

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
| **`R1`** — a mapping is a section on the world; one region, resolved through it | M | round-trip test + the refusal of an unmapped byte | Open |
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
