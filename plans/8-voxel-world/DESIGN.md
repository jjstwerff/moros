# The voxel world — design

> **The formal contract is [doc/claude/WORLD_MODEL.md Part II](../../doc/claude/WORLD_MODEL.md#part-ii--the-contract-normative)
> and it is normative.** Layers, chunks, fold-freedom (`F1`), border alignment (`B1`) and
> the constant constraint `ε > 2θ` are stated and proved there. It lives outside this plan
> because it endures: the plan builds *against* it and will be closed, the contract will
> not. Where this document and the contract disagree, the contract is right.

The landscape model: what is stored, the routine that reads and writes it, and where every
piece lives. Written before implementation so the **edges** can be checked first — §5 is
the validation surface and is the point of this document.

Supersedes the accreted draft; git history holds the working-out, including two approaches
tried and rejected (§4 keeps the conclusion worth carrying).

---

## 1. The invariant

> **Delete every file but the world file and the landscape comes back bit-exact.
> Delete the world file and no amount of derivation brings it back.**

Both halves carry weight and the second is the one that decays quietly. The first says
derived structures are disposable; the second says nothing else is secretly authoritative.
A design satisfying only the first drifts into a second home for some fact — a peak list, a
cached edge table, one flag — and then two things are true and they disagree the first time
one is rebuilt.

`L3` (stored vs derived) and `L13` (the voxel is the ceiling on permanent world state),
applied to persistence. It extends the write-path rule already in `DESIGN.md` — *every
mutation passes through one apply, and that apply re-derives every anchor in the region it
touched* — rather than competing with it.

---

## 2. The model

### The voxel — eight bytes, seven integers

```loft
struct Hex {                    // in memory: height is ABSOLUTE
  h_height:        u16,         // 2   above the world floor
  h_material:      u8,          // 1 ┐
  h_item:          u8,          // 1 │
  h_item_rotation: u8,          // 1 ├ palette indexes, never values
  h_wall_n:        u8,          // 1 │
  h_wall_ne:       u8,          // 1 │
  h_wall_se:       u8,          // 1 ┘
}
struct StoredHex { … }          // on disk: same shape, height RELATIVE to its chunk
```

Every `u8` indexes a definition table. Names, categories and floats live once per
definition, never once per cell — `wd_thickness: float` alone would add eight bytes to
every walled hex. **Index 0 is absence in every table**, because a defaulted cell is all
zeroes and that is what an unwritten cell *is*.

### The column — the unit of access

Every constraint in this design is a property of a column, not a cell. Layers must not fold
(compares a cell to the one above). The window is per chunk (a column lies wholly inside
one, so it has exactly one base). Headroom is between layers. **A routine handing out cells
cannot check any of them**, so the routine hands out columns.

```loft
struct Column { co_q: integer, co_r: integer,
                co_present: integer,        // 64-bit: which layers exist here
                co_cells: vector<Hex> }     // ABSOLUTE heights, indexed by layer
```

`Column` carries **no base**. It is the absolute form; the window does not exist at this
level and therefore cannot leak past it.

### The chunk — a tile with a stack of layers

```loft
struct Layer { ly_id:    integer,                    // u32 LABEL — a name, 0 = unlabelled
               ly_kind:  integer,                    // 0 terrain, 1 dressing
               ly_cells: vector<StoredHex> }         // exactly 1024, terrain only

struct Chunk { ck_cx: integer, ck_cz: integer,
               ck_base:   integer,                   // absolute floor of the window
               ck_layers: vector<Layer> }            // ORDERED, ≤ 64, this tile's own
```

A **layer** is 32 × 32 hexes = 1024 cells = **8 KB, two pages**. A **chunk** is a `(cx, cz)`
tile holding a base height and its own ordered list of layers, at most 64.

**There is no presence mask.** An earlier draft carried a `u64 ck_mask` because layer
*indices* were world-global and a chunk held a subset of them. Once layers became chunk-local
the mask had nothing to index: the list *is* the layers, and a layer's slot is its position
in it. Presence is membership.

`ly_id` is the optional cross-chunk **label** (`I1`–`I3` of the contract): a `u32` name drawn
from the world's `ν` counter, never an ordinal, never inserted between others. `0` is
unlabelled.

### Vertical structure

- A **terrain** layer is a **heightfield**: one surface per hex. No overhangs, caves or
  arches *within* a layer — a cave is a layer with the one above absent, and a bridge you
  walk beneath is an item with a collider. (A **dressing** layer is not a heightfield at
  all; see *Layer kinds* below.)
- Layer indexes are **absolute from the bottom**. Layer 0 is the deepest anything gets —
  seabed, lowest dungeon floor. No negative coordinate exists anywhere in the format.
- Layers must not **fold**: for consecutive *occupied* layers of a column,
  `height(lo) + headroom ≤ height(hi)`. An absent layer is a gap, not a constraint.
- Heights are **windowed**: `u16` measured from the chunk's `ck_base`, decoupling the
  cell's height width from how tall the world is.

### Layer kinds — the hook, not the payload

Not every layer is a heightfield. A layer has a **kind**, and the world model owns exactly
three things about it:

```
kind 0  TERRAIN   a dense heightfield; collides; participates in non-folding
kind 1  DRESSING  placed things; never collides; transparent to non-folding
```

1. **The kind table is world-global**, in the header, one entry per layer index. This is
   forced rather than chosen: a per-chunk kind would let the same index be terrain in one
   tile and dressing in the next, making the non-folding check incoherent across a seam —
   the failure class §5.4 exists to prevent.
2. **The fold check walks terrain layers only.** Non-folding is a statement about surfaces
   and a dressing layer has none, so it is transparent: terrain at layer 3 and terrain at
   layer 9 constrain each other whether or not dressing sits between them.
3. **Dressing never reaches the collider.** `hex_edge` reads terrain layers only.

**What a dressing layer CONTAINS is not this plan's business** — that is
[#14](https://github.com/jjstwerff/moros/issues/14)
([plan](../14-props-dressing/DESIGN.md)), which owns the record shape, sub-cell offsets,
`glb` import, kit-bashing and the derived-versus-authored question. The line is the anchor's
own: **this plan owns how a thing attaches to geometry, never the payload.** A terrain layer
is dense voxels because every hex has a height; a dressing layer is sparse records because
almost none has a lamp, and the world model needs to know only that the two differ.

### Layers are chunk-local, and continuity is a height, not a name

*(user, 2026-07-26: "Each chunk should be able to have its own unique set of layers or both
types")*

⚠ **This retracts an argument made one revision earlier, and the retraction is the useful
part.** That revision claimed layer identity could not be dropped *because the fold check
needs it*. That is wrong. **A fold is a property of a column, and a column lies wholly
inside one chunk** — so the ordering the fold check needs is the chunk's own, never a
world-wide one. The same mistake had been made once before, in claiming layer *kind* had to
be world-global or "the fold check would be incoherent across a seam." The fold check never
crosses a seam. Both claims came from one conflation: **continuity across chunks and
ordering within a column are different problems**, and only the first is about seams.

So:

```
chunk:  an ORDERED list of its OWN layers — { kind, … }, ≤ 64, no world-wide id
        order is stack order WITHIN THIS TILE; slot = position
        terrain and dressing layers may be mixed freely in one tile
header: no layer list at all
```

Each tile defines exactly the layers it has. A forty-storey tower's layers exist in the
tile it stands on and nowhere else; the neighbouring field defines one.

**Continuity across a seam is matched by HEIGHT.** Stepping from one tile to the next, the
surface you continue onto is the one nearest your current absolute height — which is what
walking physically *is*, and is more robust than a label: when a floor genuinely stops at a
wall, no layer matches and the answer is correctly "there is nothing there", rather than a
shared name pointing at a surface that does not exist.

**And headroom makes the match unambiguous — one constant, two jobs.** Matching by height
is only well-defined if at most one layer can be near a given height. That is exactly what
non-folding already guarantees: consecutive occupied layers of a column are separated by at
least `headroom`. So with a match tolerance below `headroom / 2`, **at most one layer can
ever answer**, and ambiguity is impossible by construction rather than resolved by a
tie-break. The invariant that stops layers folding is the same one that makes seams
resolvable.

**What this buys over the previous draft:** no world-wide layer list to keep in step, no
global budget of any size, no obligation that a shared id be spatially continuous (there
are no shared ids — P20 is withdrawn), and editing stays local: adding a cellar to one tile
touches that tile.

**What it costs:** a layer has no world-wide name, so "select dungeon level 2 everywhere"
is a query over a *height band* rather than a lookup by label. Since layers sit at absolute
heights, that query is well-formed — but it is a genuinely different editor gesture and
worth knowing before the tool is built.

### Why terrain layers stay dense — sparsity lives on the chunk axis

*(user, 2026-07-26: "We will have many layers not on ground level, those will be sparse but
our 32x32 chunk model saves us here (buildings/towers have them too)")*

The dense/sparse split that reshaped dressing (#14) raises the obvious follow-up: a ground
layer is genuinely dense — every hex has a height — but a dungeon corridor or a tower storey
touches a fraction of its 1024 cells, and still costs 8 KB. Does terrain need a sparse form
too?

**No, because presence is already per-chunk.** A layer is not a world-wide sheet that must
be paid for everywhere; it exists only in the tiles whose layer list holds it. A tower's
twentieth storey lives in the one tile the tower stands on and costs one bit in every other.
The 32 × 32 granularity is what makes this work: structures with many layers — buildings,
towers, mine shafts — are **compact in XY**, so the tiles they touch are few.

The bound holds even where it is weakest, a long thin thing crossing many tiles:

| structure | tiles touched | cost |
|---|---|---|
| 10-storey tower, 3 hexes across | 1 | 10 layers × 8 KB = **80 KB** |
| winding corridor, ~500 hexes, one layer | ~30 | **240 KB** |
| cave system 100 × 100 hexes, 3 layers | ~48 | **384 KB** |

Hundreds of kilobytes for a whole dungeon level, against a format meant for worlds measured
in gigabytes. **A second terrain representation would buy a rounding error and cost the
uniformity that keeps the routine, the CRC and the window simple.** Dense stays.

This is the same question that refuted the uniform dressing cell, asked in the other
direction and answered the other way — which is the point: *dense or sparse* is not a
property of a design's taste, it is a measurement, and the two cases measure differently.

### Addressing — axial throughout

```
cx = q >> 5      hx = q & 31        cell = hx * 32 + hz
cz = r >> 5      hz = r & 31

slot of layer i  =  i          it is simply its position in ck_layers
```

A chunk holding three layers stores three `Layer`s at slots 0, 1, 2, in stack order. Their
labels may be `0`, `4711` and `4712` — the labels say what corresponds to a neighbour's
layers, the slots say what sits above what *here*, and the two are unrelated by design
(contract, *A label is a NAME, not an ordinal*).

Axial `(q, r)` per `CONVERGENCE.md`: axial is the storage and interchange convention, odd-r
is authoring and presentation, and `hex_grid` owns the bridge.

---

## 3. The routine

### Read

```loft
pub fn world_column(w: World, q: integer, r: integer) -> Column
pub fn world_cell(w: World, q: integer, r: integer, l: integer) -> Hex   // convenience
```

Find the chunk; for each terrain layer in `ck_layers`, take its cell at `hx*32+hz`; a cell
whose material is 0 is **absent**, not present-and-empty. Every height gets `ck_base`
added — **the only addition in the design.**

A missing chunk yields an empty `Column`, never a refusal: unauthored ground is a legal
answer. `world_cell` is read-only and deliberately has no writing twin.

### Write — the whole routine

```loft
pub const CW_OK = 0;
pub const CW_FOLD = 1;        // a layer breached the one above
pub const CW_WINDOW = 2;      // span exceeds any window this chunk could hold
pub const CW_LAYER_CAP = 3;   // layer index past the 64 the mask addresses

struct ColumnWrite { cw_code: integer, cw_layer: integer, cw_detail: text }

pub fn world_set_column(w: World, col: Column) -> ColumnWrite
```

Five steps, and the order is the design:

1. **Check the fold** in absolute space, having written nothing. On failure return
   `CW_FOLD` naming the layer, world unchanged.
2. **Fit the window** across the *whole chunk* once this column is applied — one base
   serves every column in the tile.
   - span > 65535 → `CW_WINDOW`; refuse rather than truncate.
   - outside the current window → **rebase**: `ck_base = lo`, re-encode every present layer.
   - otherwise the window stands.
3. **Materialise absent layers** — insert a fresh zeroed `Layer` at its position in
   `ck_layers`. This is the only place a layer is ever created, which is what stops unneeded
   ones existing. If the caller supplied a label, it is used; if it asked for a new one, it
   is drawn as `id := ν; ν := ν + 1` (`I3`) — never chosen by looking at what neighbours
   already use.
4. **Encode and stamp** — subtract `ck_base`, **the only subtraction in the design**, store,
   then `τ := τ + 1` and set `ver` on each layer actually changed (`T1`), and only those
   (`T2`).
5. **Drop what emptied** — an all-zero layer is removed from `ck_layers`; a chunk with an
   empty list leaves the directory. Elision is maintained on write, not swept later. A
   dropped layer's label is *not* returned to `ν`: `ν` only increases (`I3`), and a `u32`
   is not a budget anyone spends.

A single-cell edit is not primitive: read the column, change one layer, write it back.

---

## 4. The file

```
[header     ] magic, version, chunk_w,
              u (height unit), rho (floor reserve), eps, theta,
              nu (next label u32), tau (edit clock u64), owner (writer marker),
              palette_off, dir_off, dir_len
[palette    ] OPAQUE to the library — the consumer's bytes (§6)
[chunk dir  ] sorted (cx, cz) → { base_height, data_off,
                                 layers[≤64] of { id:u32, kind:u8, ver:u64 } }
[chunk data ] per chunk, its terrain layers in list order:
              8 KB each: 1024 × StoredHex, row-major, CRC32 trailer
```

The header carries every world constant the contract names, so a file is self-describing:
`u` says what a height step is worth, `rho`/`eps`/`theta` are the authoring floor, the
minimum layer separation and the match tolerance, and `nu` is the label counter. **`eps > 2·theta`
is checked when the file is opened, not assumed** — a world violating it fails `B1` silently
(contract, `C1`).

**Not mmap.** loft ships `store_persist_bind` ("the hash IS the file"), and it is wrong here
on two counts from its own documentation: it is Tier-1 and says *"Do not use for data that
cannot be re-derived"* — an authored landscape is the definitive un-re-derivable artifact,
and the tiers that would carry it are unshipped; and its file is an allocator arena frozen
at high-water mark, never compacted, with **264 MB recorded for 3.5 MB live**. Against
"huge but efficient" that is the negation, and it makes the headline claim false: we would
store an arena containing some voxels. `seek()` + `write_bin` give a file whose bytes *are*
the voxels — what mmap would have done for fixed-size chunks, with the page cache still
caching.

**Chunk slots are copy-on-write** (`M2`): a write fills a new slot and republishes the
directory entry, so readers never see a half-written chunk and a crash cannot damage the
previous one. Freed slots return to a free list when no reader holds them.

**Durability.** An 8 KB write is not atomic and whole-file rename is unaffordable at scale,
so: per-chunk CRC32, a torn chunk **refused by name** while the rest opens; chunk writes
independent, so a tear is a hole and never a cascade; `store_durable_seal` on clean exit,
`store_durable_check` on open. A failed check does **not** mean rebuild — there is no
source — it means report which chunks failed and open the rest.

**Sparsity** is the efficiency claim and falls out of absence having one representation: a
missing chunk, a missing layer and a zeroed one all read identically. A fresh infinite world
costs a header; a world with one ground surface costs one layer per tile, not 64.

---

## 5. The edges — the validation surface

**This section is the deliverable.** Each row is a claim checkable independently, before
anything is built.

### 5.1 Ownership edges

| edge | rule | how to tell you crossed it |
|---|---|---|
| `hex_world` / `hex_field` | **residence vs document.** Unbounded, mutable, multi-layer, narrow types, random access → world. Bounded, portable, one layer, wider types so consumers keep their own units, stencils → field | you are writing a second document format, or a mutable unbounded field |
| `hex_world` / `hex_terrain` | **stores vs generates** | `hex_world` gained a noise function |
| `hex_world` / `hex_edge` | **holds the wall index vs decides what blocks** | `hex_world` gained a "can I walk here" |
| `hex_world` / `gridmesh` | **cells vs triangles** | `hex_world` emitted a vertex or tracked a mesh |
| `hex_world` / `hex_grid` | geometry and conventions live below, with no deps | `chunk_idx_32` re-implemented instead of imported |
| library / consumer | the library owns **how a thing attaches to geometry**, never the payload | `hex_world` learned what a stair is |

### 5.2 Representation edges

| edge | limit | at the limit |
|---|---|---|
| palette table | 256 entries | `add` returns −1; no index could name a 257th |
| layers per chunk | 64 | `CW_LAYER_CAP` — and there is no world-wide layer count at all |
| distinct labels | 2³² over a world's whole life | `ν` only increases; dropped labels are never reused |
| edit clock | `u64` | not a bound anyone reaches; `u32` was rejected because a wrapped clock reports a stale cache VALID — a silent wrong answer (`G0`) |
| world extent | `cx, cz` signed 32-bit | `CW_EXTENT`; ±68 billion hexes per axis, checked anyway |
| window span | 65535 height units per **chunk** | `CW_WINDOW` — refuse, never truncate |
| height | `u16` above the world floor, unsigned | there is no below; layer 0 is the bottom |
| chunk extent | 32 × 32 = 8 KB | fixed; two pages |
| cell | 8 bytes, 7 integers, **no floats** | gated externally by hexbody's `palette.loft` |

### 5.3 Absence edges — the ones that must be indistinguishable

| absence | representation | must equal |
|---|---|---|
| unwritten cell | all-zero `Hex` | material 0 → the absence definition |
| unused layer | absent from `ck_layers` | a stored all-zero layer |
| untouched tile | no directory entry | a chunk whose layers are all zero |
| no wall / no item | index 0 | the absence entry of that table |

If any pair stops being indistinguishable, elision is unsound and the file grows without
bound. **Round-tripping cannot catch this** — it needs the size checks (P4–P6).

### 5.4 Seam edges

| seam | rule |
|---|---|
| chunk ↔ chunk | comparisons happen in **absolute** space; neither side has a window by then |
| layer ↔ layer above | non-folding with headroom, consecutive occupied **terrain** layers only; dressing is transparent |
| layer ↔ layer across a seam | matched by **height**, never by name; `headroom` guarantees at most one match |
| layer kind | per chunk, per layer — a tile may mix terrain and dressing freely |
| dressing ↔ collision | dressing layers never reach `hex_edge`. A prop that blocks is not dressing |
| memory ↔ disk | one addition (read), one subtraction (write); `Column` has no base field to leak |
| world ↔ field | conversion is explicit, at the consumer, and lossy in known ways |
| library ↔ palette | position, count and slot-0 owned by the library; bytes owned by the consumer |

### 5.5 Refusal edges — every way this says no

| refusal | when | instead of |
|---|---|---|
| `CW_FOLD` | a layer breaches the one above | silently stacking two surfaces in one space |
| `CW_WINDOW` | a tile's span exceeds any window | truncating a cliff |
| `CW_LAYER_CAP` | layer ≥ 64 | wrapping into another layer |
| palette `add` → −1 | table full | an unnameable definition |
| `map_palette_gap` | a cell names a missing definition | drawing it as empty and losing content |
| torn chunk (CRC) | bytes damaged | a plausible wrong landscape |
| `ML_LABEL_TOO_WIDE` | an interchange value exceeds the voxel | clamping to a different material |

Every refusal **names what it refused and changes nothing.**

### 5.6 Consumer edges

| edge | rule |
|---|---|
| the crystal's `c_age` | **stays out of the cell.** `L13`/`L15`: the voxel is permanent world state; age is the opposite. Decay becomes a side table (`L14`) |
| the crystal's `c_color` | becomes a material index; colour moves into the definition |
| moros's `md_swimmable`, `wd_body` | game semantics; opaque to the library |
| spawn points, NPC routines | not landscape, not in the world file (`L15`) |

---

## 6. Where it lives

`hex_world`, reshaped. `CONVERGENCE.md` already defines it as *"chunked cell STORAGE:
get/set, save/load, decay"* — storage is the purpose already on the page. We remove `decay`
(never storage) and add the depth storage needs. The crystal demo becomes the model's
**second consumer**, which is what makes it general: it is unlike moros on every axis that
matters, and a model serving both without special-casing either is evidence, where one
serving moros alone is a moros file format with ambitions.

`hex_world` owns cells, columns, chunks, the window, the routine, the guards and the file.
It owns nothing that draws, collides or generates.

**The palette is opaque.** It must travel with the world — indexes without tables name
nothing — but the library cannot serialise a definition it is forbidden to understand. So
the library owns the section's position, count and slot-0 rule; the consumer owns the bytes.

**Extraction is a daily property, not an event:** the model's gates must pass with the moros
tree absent. Dependency ceiling is loft's stdlib plus `hex_grid` / `hex_field`.

---

## 7. The guards

A guard makes the mistake a compile error or a named refusal, not a rule to remember.

**Guard 1 — detached heights.** `StoredHex` and `Hex` are **different types**, bridged only
by the chunk codec. In loft `u16` is an alias of `integer`, so the compiler cannot otherwise
tell a windowed height from an absolute one; nominal separation is what turns a wrong number
at a seam into a message at compile time.

**Guard 2 — folded layers.** A refusal at the write, plus a load-time audit shaped exactly
like `map_palette_gap` — a proven pattern reused. Cheap, because a column's layers share one
base and the check never crosses a window.

**Guard 3 — the chokepoint.** One write path taking the **column**. Prerequisite for Guard 2,
and the real work: today `h_height` is written at **seven sites** across two packages, all
shaped `map_get_hex` → mutate → `map_set_hex`. Whether that is a chokepoint at all is
unresolved (P13): `map_get_hex` returns a vector element, and loft's `#338` says `tmp = v[j]`
is a *view*, not a copy — if so the trailing `map_set_hex` is decorative and any caller can
write a cell through no function at all. Both readings need the guard.

**Validation standard.** Every guard ships with three things: a **gate**, a **control** (the
same assertion against a case that must fail), and a **mutation** (the guard broken
deliberately, which must turn the gate red). The third is usually skipped and is the only one
that validates the gate rather than the code. Six gates in this editor were green for the
wrong reason; every one was caught by a control, none by reading.

---

## 8. Probes

| # | claim | probe | control |
|---|---|---|---|
| P1 | voxels round-trip | author, close, reopen, compare all | mutate one voxel first → must fail |
| P2 | **nothing else is authoritative** | delete the world file → landscape **gone** | keep it → comes back whole |
| P3 | derived is disposable | drop every derived structure, rebuild, compare frames | — |
| P4 | sparsity | 10⁶-tile empty world < 64 KB | author one hex → exactly one chunk |
| P5 | elision symmetric | zero a layer's last cell → file shrinks, reads unchanged | — |
| P6 | no arena bloat | size ≈ layers × 8 KB + header, within 5% | build-then-prune must not 90× it |
| P7 | torn chunk named | corrupt 8 KB → that chunk refused, others open | uncorrupted → silent |
| P8 | palette travels | copy the file alone → materials resolve | — |
| P9 | layers never fold | raise a cave floor into the ground → refused, named, unchanged | raise to just under → accepted |
| P10 | **seams stitch** | ridge across a chunk boundary, read from both sides → identical | different windows → still identical |
| P11 | headroom holds | every column satisfies it after any brush | — |
| P12 | unused layers cost a bit | one live layer of 64 → ~8 KB, not ~512 KB | dig a second → one more slot |
| P13 | **does the getter alias?** | mutate `map_get_hex`'s result, never call `map_set_hex`, re-read | decides Guard 3's shape |
| P14 | the ceiling holds | port the crystal; decay runs from a side table, voxel unchanged | a field added to the cell → `L13` is not a rule |
| P15 | **dressing never blocks** | walk through a hex whose dressing layer is full | the same asset in a terrain layer → blocked |
| P16 | dressing is fold-transparent | terrain at 3 and 9 with dressing at 6 → fold checks 3 against 9 | remove the dressing → same verdict |
| P20 | **height-matching is unambiguous** | at any seam hex, at most one layer of the neighbour falls within the match tolerance | shrink `headroom` below twice the tolerance → two candidates appear and the gate fires |
| P21 | a floor that stops, stops | walk a corridor to a wall at a chunk seam → no match, not a phantom continuation | a corridor that does continue → matched |
| P18 | **terrain is bit-identical with and without dressing** | crawler's bridge gate, adopted verbatim: build the terrain field, add props, rebuild | change a prop's asset → terrain still bit-identical |

P2 and P10 are the two most easily skipped and the two that catch what nothing else can: a
second home for landscape, and a window leaking past storage.

---

## 8b. RESOLVED — the window stays, and scale becomes a world constant

*(user, 2026-07-26: "I do not want a very rigid scale here, we need flexibility in the
vertical direction so 25cm might be too much in special cases" · "I want to use this system
for space games too, those have a different use case, and I still do not want to change the
world model for them")*

The previous revision recommended **dropping** the per-chunk window, on the grounds that a
global `u16` at 0.25 m spans 16 km and the window would then have nothing to do. That
recommendation is withdrawn, and the reason it was wrong is instructive: it treated
*16 km at 25 cm* as the requirement, when the requirement was never a number — it was
**range and resolution being independently choosable.**

Without a window, `resolution × 65536` must span the whole world, so the two are welded:
buy precision and you lose extent. A space station wants centimetres over hundreds of
metres; a planet wants metres over hundreds of kilometres. **One model cannot serve both
unless the window separates them**, and "I still do not want to change the world model for
them" makes serving both a requirement rather than an aspiration.

So the window is not overhead to be trimmed. It is the single mechanism that makes the model
scale-independent, and it earns every part of its cost — `b_K`, rebase, `CW_WINDOW`, `W1`,
`S1`, and Guard 1's `StoredHex`/`Hex` split all stay.

**And the unit itself becomes a declared constant `u`.** Not 0.25 m, not any number: the
model stores integer steps and never learns what a step is worth. `ρ`, `ε` and `θ` are
counted in steps, so they follow whatever the world declares. `moros_sim`'s
`8 * HEIGHT_SCALE = 2.0` becomes one world's choice rather than the model's.

**`ε` is generalised with it.** It was "headroom", justified by a person needing to stand
up. The model only needs layers to be *distinguishable* — which is what `B1`'s proof
actually uses. In a walkable world that minimum is headroom; in a station it is deck
separation; in neither case does the model care why.

### What must not change, and how that gets checked

"I still do not want to change the world model for them" is a testable claim, and the same
kind that the crystal provides for the voxel ceiling (P14):

| # | claim | probe | control |
|---|---|---|---|
| P22 | **the model is scale-free** | express a station world — `u = 1 cm`, thin decks, no ground — with **zero** changes to Part II | any structural change needed → the model is not universal, it is moros-shaped |

### The one thing deliberately not built

**Per-chunk scale** — making the window affine (`base` *and* `scale`) rather than an offset —
would let a single world hold a planet at metre steps and a station at centimetre steps.
It is a small change to the encode/decode pair and the invariants survive it untouched,
because every rule in Part II is stated on absolute heights.

It is not built, and the reason is a real cost rather than caution: **two chunks at
different scales cannot represent the same surface exactly**, so a ridge crossing that seam
loses bit-exactness and `P10` weakens from *identical* to *within tolerance*. If it is ever
wanted, restricting scales to power-of-two multiples makes the coarser side's heights a
subset of the finer side's and restores exactness in one direction. Per-world scale covers
the space case without any of that, so the door is described and left shut.

## 9. Assumed, not decided

Inferences, not answers. Each is cheap now and expensive once files exist.

| # | assumption | why | cost if wrong |
|---|---|---|---|
| A1 | **64 layers per chunk**, 65 536 per world | resolved above: the cap is per tile, so regions no longer compete. 64 in one 32×32 tile is a tower and its cellars | widen the table; the id space already has room |
| A2 | **headroom = one storey's clearance** | a cave you cannot stand in is legal and useless | a header constant; re-audit existing worlds |
| ~~A3~~ | ~~the surface starts at layer 8~~ | **DISSOLVED** by global ids: the world defines as many sub-surface layers as it likes and a tile materialises only what it uses | — |
| A4 | **`u` is per world, and moros picks its own** | resolved in §8b: the model stores steps and never learns their worth. Moros's current `0.25 m` becomes a moros choice, not a model constant | a world that needs finer steps declares them; nothing structural moves |
| A10 | **`ρ`, the floor reserve, is unset** | the deepest intended excavation; a world constant | terrain authored where cellars must go |
| A5 | breaking the crystal is acceptable churn | it is a demo, not an end product | coordination with the sibling tree |

---

## 10. Out of scope

- **No volumetric terrain** — overhangs, caves and arches inside one layer. Closed
  deliberately; the one decision a file format cannot be talked into later.
- **No compaction** — freed slots are reused; the file does not shrink on delete.
- **No multi-writer** — one process owns a world file.
- **No spawn or NPC data** — `L15`; they belong beside the world, not in it.
- **No mesh, collider or generator** in `hex_world` — §5.1.
