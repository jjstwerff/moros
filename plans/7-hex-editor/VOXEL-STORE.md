# The voxel store — one durable home for the landscape

*(user, 2026-07-26: "create a design to make the compact voxels the only thing that we
store (mmap) and use for the whole landscape, we can use other structures for parts of
it and for efficiency for collisions etc")*

Written before the code, per `design-protocol`: the failure paths are where the
invariant surfaces, and this is the cheapest place to find out the first answer was
wrong. It was — see §2.

---

## 1. The invariant

> **Delete every file but the world file and the landscape comes back bit-exact.
> Delete the world file and no amount of derivation brings it back.**

Both halves are load-bearing and the second is the one that gets forgotten. The first
says *derived structures are disposable*; the second says *nothing else is secretly
authoritative*. A design that satisfies only the first drifts into a second home for
some fact — a peak list, a cached edge table, a "just this one flag" — and then two
things are the truth and they disagree the first time one is rebuilt.

This is `L3` (stored vs derived-on-demand) and `L13` (the voxel is the ceiling on
permanent world state) applied to persistence rather than to memory. It **extends**
`DESIGN.md`'s existing invariant — *"every mutation of geometry passes through one
apply, and that apply re-derives every anchor in the region it touched"* — rather than
competing with it: that one governs the write path, this one governs what survives a
restart.

---

## 2. ⚠ The first answer was wrong: mmap is the wrong home for this data

The obvious build is `store_persist_bind(chunks, "world.store")` — loft ships it, it is
mmap, and the docs call it *"the hash IS the file."* Probing it before building it
killed it, on two independent counts.

**It is documented as unsafe for exactly our data.** `loft/doc/claude/STDLIB.md:564`:

> If the program crashes between the last write and the seal … next start's
> `store_durable_check` returns `false` → caller rebuilds. This is **by design** — Tier 1
> trades durability for cheap writes … **Do not use** for data that cannot be
> re-derived; Tiers 2 (snapshots) and 3 (WAL) are planned for that case but not yet
> shipped.

An authored landscape is the definitive un-re-derivable artifact. There is nothing to
rebuild *from*. Tier 1 is for caches, and the tiers that are not for caches do not exist
yet.

**Its file is an allocator arena, not our bytes.** `STDLIB.md:625`:

> the snapshot copies the arena's current capacity verbatim — no repack; a Store arena
> only ever grows … one consumer saw a 264 MB file for 3.5 MB of live data (~90×).

The stated goal is *"we want to build huge but still efficient worlds."* A format whose
size is the high-water mark of an allocator — free lists, slack, no compaction — is the
direct negation of that. And it makes the headline claim false on its own terms: under
`store_persist_bind` the compact voxel is emphatically **not** the only thing we store.
We store an arena that contains some voxels.

**What was missed the first time.** `seek(self: File, pos: integer)`
(`STDLIB.md:421`) plus `write_bin` / `read` for raw struct binary. A file whose bytes
*are* the voxels, written in place at a computed offset, is available and needs no
allocator. For our access pattern — fixed-size chunks, read one, write one — `seek` +
an 8 KB read is what an mmap would have done anyway, with the OS page cache still doing
the caching, minus the arena and minus the durability disclaimer.

**So: the world file is ours, laid out as voxels.** This *serves* the request more
literally than mmap does, and it is worth saying plainly that it is a departure from the
word in the brief. If profiling later shows the syscall path is the bottleneck, a loft
Store can be adopted as an in-memory working layer over this file — but never as the
durable record, until Tier 2/3 ship.

---

## 3. What is stored, exhaustively

The invariant is only checkable if the durable set is *closed*. It is these three things
and nothing else:

| # | what | why it cannot be derived |
|---|---|---|
| 1 | **voxel chunks** — the landscape | the authored thing itself |
| 2 | **the palette** — material / wall / item definitions | `u8`s are indexes; without the tables they name nothing. Authored, not derived |
| 3 | **world header** — name, version, chunk geometry, layer cap, headroom | says how to read 1 and 2, and what keeps layers apart (§3c) |

Everything else is derived and must be deletable mid-session without loss: chunk meshes,
normals, the collision structures below, the LOD height texture, the dirty set, the
loaded-chunk table.

⚠ **Spawn points and NPC routines are NOT in this list and that is a decision, not an
oversight.** `Map` carries `m_spawn_points` / `m_npc_routines` today. `L15` separates
game state from world state, and `EDITOR_SUBSTRATE` puts NPCs out of scope entirely —
they belong to crawler's model. They are authored, so they need *a* home, but it is a
side table beside the world file, not inside it, and not this design's business. Naming
them here stops them being quietly absorbed into "the landscape" later.

---

## 3b. The vertical model — settled

*(user, 2026-07-26: "The lowest layer is always the lowest you can get (bottom of the
sea, lowest cave/dungeon floor)")*

Two things follow, and both make the format **smaller**.

**A storey is a heightfield, and the door to volumes is now deliberately shut.** One
surface per hex per `cy`; "under" always means *a storey below*, never an overhang inside
one. A cave is a storey with the one above it absent; a bridge you walk beneath is an
item with its own collider, not terrain. So the cell stays seven integers and the 8-byte
claim holds — a column of spans would have ended it.

**`cy` is ABSOLUTE, measured from the bottom of the world, not relative to the surface.**
`cy = 0` is the deepest anything goes — seabed, lowest dungeon floor — so there is no
storey below it and no negative coordinate anywhere in the format. The deepest dungeon
and the sky share one coordinate system.

⚠ **This deletes `base_height` from the header, and that is the point.** The previous
draft carried it as insurance for "a world whose base plane is not 0". Under this rule
that world cannot exist: the floor is canonical. Keeping the knob would mean every read
and write of a height re-asserts the offset — `N > 1` sites, silent when forgotten, every
one of them off by exactly the same amount and therefore invisible. Removing it is the
protocol's `N × silence` cure applied by *subtraction*: a domain fact made a mechanism
unnecessary, so the mechanism goes.

⚠ **The consequence for the editor, flagged rather than assumed away.** The plane it
builds today sits at `cy = 0`. If `cy = 0` is the absolute bottom, nothing can ever be
dug beneath that plane. So the surface has to start at some `cy > 0`, and how much room
to leave below is a worldbuilding call, not a format one. **Assumption until told
otherwise: the surface starts at `cy = 8`**, leaving eight storeys of dungeon beneath a
default world. Cheap to change while no file exists; it is only a starting offset, and
the format itself is indifferent to it.

## 3c. Layers must not fold, and the height axis is windowed

*(user, 2026-07-26: "we need to keep layers intact so they do NOT fold through each
other, and chunks can have different heights though we stitch layers together
seamlessly across their boundaries (layers have a limited height axis we solve that via
chunks)")*

This adds a kind of rule the design did not have. Everything above treats each
`(q, r, cy)` as independent; this says **layers have a relationship to each other and to
their neighbours that the format must keep true.**

### The non-folding invariant

> For every column `(q, r)`: `surface(cy) + headroom ≤ surface(cy + 1)`.

Layers are stacked and stay stacked. A cave floor that rises through the ground above it
is not a strange world, it is a **corrupt** one — two surfaces claiming the same space,
with no answer to which one you stand on. So this is enforced at **apply**, not at save:
a brush that would breach the layer above refuses, names the column and the layer it hit,
and leaves the world unchanged. `K-FIT`, applied vertically.

The headroom term is why it is `≤` with a margin rather than plain `<`: a cave you cannot
stand up in is geometrically legal and useless. **Assumption until told otherwise:
headroom is one storey's minimum clearance, expressed in height units and stored in the
header** — it belongs to the world, not to the cell.

### ⚠ Windowing has a hazard, and it is already in the code

"Layers have a limited height axis, we solve that via chunks" means the cell's height
field is **narrower than the world is tall**, and the chunk positions the window. That
decouples the world's vertical extent from the cell's width — the property that makes a
tall world cost nothing per cell, and the reason the voxel could later shrink its height
field without changing the world model.

The hazard is that it makes a height **meaningless without its chunk** — and moros
already passes heights around detached from theirs:

```
moros_render.loft:955   sd_nh = map_get_hex(map, sd_nq, sd_nr, cy).h_height;
moros_render.loft:993   sh_dest_h = map_get_hex(map, sh_ndq, sh_ndr, cy).h_height;
```

`map_get_hex` resolves the chunk internally and hands back a bare `Hex`. Both lines take
a **neighbour's** height and compare it against the current cell's — and a neighbour
reached by `hex_neighbor` crosses a chunk boundary roughly every 32 hexes. Under a
windowed height those comparisons are wrong precisely at the seams, which is exactly
where "stitch seamlessly" is the requirement. Nothing would crash; cliffs and stairs
would simply be wrong at chunk edges, intermittently, in a pattern that looks like a
geometry bug.

### The rule that removes it

> **The window is a STORAGE encoding and never leaves the storage layer. In memory a
> height is absolute; on disk it is relative to its chunk. Conversion happens at chunk
> read and chunk write, and nowhere else.**

Then `.h_height` means one thing everywhere above storage, the two lines above stay
correct without knowing they were at risk, and seamless stitching is true **by
construction** rather than by every caller remembering. `N = 1`, at the one boundary that
already exists.

It also explains what I got wrong in §3b. Deleting `base_height` was right for the reason
given — a *per-world* offset is a global constant that buys nothing and costs a re-
assertion at every height site. A *per-chunk* window is a different thing entirely: not
insurance, but the mechanism that makes a limited axis span a tall world. Same-looking
field, opposite verdicts, and the difference is granularity.

### Resolved: the window is per chunk, and a chunk holds a STACK of layers

*(user, 2026-07-26: "We can have a whole lot of layers in a chunk so that gives us wiggle
room though it is inefficient to make ones that are unneeded/unused")*

This settles the open question in favour of the **explicit** window, and corrects a
bigger assumption underneath it. The draft above keyed a chunk `(cx, cy, cz)` — one
chunk, one layer. That is wrong:

> **A chunk is a 32 × 32 tile keyed `(cx, cz)`, carrying its own base height and a sparse
> stack of layers.**

Each phrase of the brief lands somewhere: *"chunks can have different heights"* is the
per-chunk base; *"layers have a limited height axis"* is the `u16` measured from it;
*"a whole lot of layers in a chunk gives us wiggle room"* is many surfaces sharing one
window, so caves and floors stack without needing a new chunk; *"inefficient to make ones
that are unneeded/unused"* is the requirement that follows.

**Elision now runs on two axes, and the second is new.** A chunk absent from the
directory costs nothing — that was already true. What is new is that an **unused layer
inside a present chunk must cost a bit, not 8 KB.** A world of open ground with one
surface must not pay for the dungeon storeys it never dug. Concretely: a used-layer
bitmask plus packed layer slots, so a chunk with three live layers stores three.

**One consequence is worth having on purpose, because it makes a guard cheap.** A column
`(q, r)` lies entirely inside one chunk, so *every layer of that column shares one base*.
The non-folding check therefore never crosses a window: it compares stored values
directly, in relative space, with no conversion at all. The rule that made seams
dangerous makes this one free — and it means the two guards have genuinely different
shapes rather than being one mechanism twice.

⚠ **Where I am inferring.** The brief does not say whether the layer stack is bounded.
A bitmask wants a cap — **assumption: 64 layers per chunk**, one `u64` mask, which is
deep enough for a seabed, a dungeon complex and a tower without being an axis anyone
notices. If worlds want more, the mask becomes a small directory and nothing else moves.

### Probes this adds

| # | claim | probe | control |
|---|---|---|---|
| P9 | layers never fold | raise a cave floor into the ground above → refused, named, world unchanged | raise it to just under → accepted |
| P10 | **seams stitch** | author a ridge crossing a chunk boundary, read heights from both sides → identical | put the chunks at different windows → still identical |
| P11 | headroom holds | every stored column satisfies the invariant after any brush | — |
| P12 | **unused layers cost a bit** | a chunk with one live layer of 64 stores ~8 KB, not ~512 KB | dig a second layer → exactly one more slot appears |
| P13 | **does the getter alias?** | mutate `map_get_hex(…)`'s result, never call `map_set_hex`, re-read the cell | if changed, the chokepoint is illusory (§6b) |

**P10's control is the one that matters** — it is the only version of the test that can
fail if the window ever leaks out of the storage layer.

## 3d. THE ROUTINE

Everything above is constraints. This is the thing they describe: the structures, the
arithmetic, and the two calls that read and write a landscape.

### The unit is a COLUMN, not a cell

Every constraint that has come up is a property of a column, not of a cell. Layers must
not fold — that compares a cell to the one above it. The window is per chunk — a column
lies wholly inside one chunk, so it has exactly one base. Headroom is between layers.
**A routine that hands out cells cannot check any of it**, so the routine hands out
columns.

The single-cell edit does not disappear; it stops being primitive. You read a column,
change one layer of it, and write the column back — and the write is where everything is
checked, once.

### Structures

```loft
// Stored: height is RELATIVE to its chunk's base. Meaningless on its own.
struct StoredHex { sv_height: u16, sv_material: u8, sv_item: u8, sv_item_rotation: u8,
                   sv_wall_n: u8, sv_wall_ne: u8, sv_wall_se: u8 }

// In memory: height is ABSOLUTE. This is the only form above the storage layer.
//   (`Hex`, unchanged — the compact voxel)

struct Layer  { ly_cells: vector<StoredHex> }          // exactly 1024

struct Chunk  { ck_cx: integer, ck_cz: integer,
                ck_base: integer,                       // absolute floor of the window
                ck_mask: integer,                       // 64-bit: which layers exist
                ck_layers: vector<Layer> }              // present ones only, mask order

struct Column { co_q: integer, co_r: integer,
                co_present: integer,                    // 64-bit: which layers are here
                co_cells: vector<Hex> }                 // ABSOLUTE, indexed by layer
```

`Column` deliberately carries **no base**. It is the absolute form; the window does not
exist at this level and cannot leak past it.

### Addressing

```
cx = q >> 5           hx = q & 31          cell = hx * 32 + hz
cz = r >> 5           hz = r & 31

layer l is present in a chunk  ⟺  (ck_mask >> l) & 1 == 1
its slot in ck_layers          =  popcount(ck_mask & ((1 << l) - 1))
```

The slot rule is why no per-layer offset table is stored: presence and position are the
same word. A chunk with layers 0, 3 and 9 live stores three `Layer`s, and layer 9 is at
slot 2.

### Read

```loft
pub fn world_column(w: World, q: integer, r: integer) -> Column
```

Find the chunk for `(q, r)`; for each set bit of `ck_mask`, take that layer's cell at
`hx*32+hz`; a cell whose material is 0 is **absent**, not present-and-empty. Every height
that comes out has `ck_base` added — **this is the only place addition happens.**

A missing chunk yields an empty `Column`, never a refusal: unauthored ground is a legal
answer, and §slot-0 already makes absence indistinguishable from never-written.

```loft
pub fn world_cell(w: World, q: integer, r: integer, l: integer) -> Hex
```
Convenience over `world_column`. Read-only, and deliberately has no writing twin.

### Write — the whole routine

```loft
pub const CW_OK            = 0;
pub const CW_FOLD          = 1;   // a layer breached the one above it
pub const CW_WINDOW        = 2;   // the chunk cannot hold this span, even rebased
pub const CW_LAYER_CAP     = 3;   // layer index past the 64 the mask can address

struct ColumnWrite { cw_code: integer, cw_layer: integer, cw_detail: text }

pub fn world_set_column(w: World, col: Column) -> ColumnWrite
```

In order, and the order is the design:

1. **Check the fold, in absolute space, before touching anything.** Walk the *present*
   layers of `col` in ascending order; for each consecutive pair,
   `height(lo) + headroom ≤ height(hi)`. An absent layer is a gap, not a constraint — a
   dungeon at layer 3 under ground at layer 9 constrains 3 against 9 and nothing else.
   On failure return `CW_FOLD` naming the layer, **having written nothing.**

2. **Fit the window.** Let `lo` / `hi` be the min and max absolute height across *the
   whole chunk* once this column is applied — not just this column, because one base
   serves all of them.
   - `hi - lo > 65535` → `CW_WINDOW`. The tile is asking for a vertical span one window
     cannot express; refuse and say so rather than truncate.
   - `lo < ck_base` or `hi > ck_base + 65535` → **rebase**: set `ck_base = lo` and
     re-encode every present layer of the chunk. Expensive, correct, and rare.
   - otherwise → the window stands.

3. **Materialise absent layers.** Any layer present in `col` but not in `ck_mask` gets a
   fresh zeroed `Layer` inserted at its slot and its mask bit set. This is the only place
   a layer is created, which is what keeps "unneeded layers" from ever existing: a layer
   exists because a column put something in it.

4. **Encode and store.** Subtract `ck_base` from each height — **the only place
   subtraction happens** — and write the cells into their slots.

5. **Drop what emptied.** If a layer's 1024 cells are now all zero, clear its mask bit and
   remove its slot; if `ck_mask` reaches 0, drop the chunk from the directory. Elision is
   maintained on write, not swept later, so the file never carries garbage waiting for a
   compaction pass that does not exist.

### What the shape buys

- **Steps 1 and 2 cannot be skipped**, because there is no other way to write a cell.
  The chokepoint is not a convention; it is the only door.
- **Steps 4 and 1's absolute comparison are the seam guard.** Addition happens in exactly
  one place and subtraction in exactly one, both inside this file, and `Column` has no
  base field to leak. Two chunks with different windows compare correctly because by the
  time anything compares them, neither has a window.
- **Step 5 makes sparsity an invariant instead of an optimisation.** A layer that
  emptied is gone at the moment it emptied.
- **Rebase is the price of the window**, and it is bounded: it touches one chunk's live
  layers, and only when terrain leaves the tile's current vertical range.

### The one thing left loose

The window is `u16` because the voxel is what it is — 65536 steps inside a 32×32 tile is
a very tall cliff, so rebase will be rare and `CW_WINDOW` rarer. **If the height field
ever wants to shrink** — `u8` would take the voxel to seven bytes — the per-chunk base is
exactly what makes that possible, and this routine does not change: only the two
constants do. Worth knowing the door is there; not worth walking through it now.

## 4. Layout

A **layer** is 32 × 32 hexes — matching `moros_map`'s existing `Chunk` width — which at
8 bytes a voxel is exactly **8 KB, two pages**. A **chunk** is a `(cx, cz)` tile holding a
base height and up to 64 such layers, of which only the used ones are stored.

```
[header      ] magic, version, chunk_w, layer_cap, headroom, palette_off, dir_off, dir_len
[palette     ] the three definition tables, length-prefixed
[chunk dir   ] sorted (cx, cz) → { base_height, used_mask: u64, data_off }
[chunk data  ] per chunk, ONLY the used layers, in mask order:
               8 KB each: 1024 × StoredHex, row-major hx*32+hz, CRC32 trailer
```

`used_mask` is the second elision axis: an unused layer costs **one bit**, not 8 KB. Its
population count gives the chunk's stored size, and a layer's slot is the count of set
bits below it — so no per-layer offset table is needed.

**Sparsity is the efficiency claim, and it falls straight out of §slot-0.** An
unauthored region is all-zero voxels, and an all-zero layer is *not written at all* — a
missing layer and a zeroed layer read back identically, and the same holds one level up
for a chunk with no layers left. So a fresh infinite world costs a header, and a
1000×1000-tile world with a single ground surface costs one layer per tile rather than
sixty-four. This is the same "slot 0 is absence" rule from the palette commit
paying rent a second time: absence has one representation, and it is free.

**The elision has no escape hatch and does not need one.** It works because the default
is all-zero, and §3b makes that canonical: heights are absolute from a world floor that
is by definition the lowest anything gets. There is no "raised base plane" case to defend
against, so there is no offset to carry — see §3b for why removing that knob was the
correction and not a simplification.

**Two chunk sizes coexist and must not be confused.** Storage chunks are 32×32; the
editor's *mesh* chunks are 8×8 (`CHUNK=8`). One storage chunk is 16 mesh chunks. They are
different jobs — page alignment vs draw-call size — and both are right. Writing them
down is the point: a silent 32-vs-8 mismatch is exactly the class that produced the
"dirty region used DRAW_HEXES not PEAK_R" 920 ms stall.

---

## 5. Durability: what a crash costs

An 8 KB write is not atomic; a kill mid-write tears a chunk. Whole-file
temp-and-rename is correct and unaffordable at 8 GB. So:

- **Per-chunk CRC32.** A torn chunk is *detected* on read and refused by name — one
  chunk reported, not a world silently corrupted. This is the house rule (`K-FIT`:
  refuse with a named reason) applied to bytes, and the same shape as
  `ML_LABEL_TOO_WIDE`.
- **Chunk writes are idempotent and independent.** No chunk's validity depends on
  another's, so a torn chunk is a hole, never a cascade.
- **`store_durable_seal` on clean exit, `store_durable_check` on open** — loft's
  sidecar works on any file, not just Stores, and gives whole-file integrity for free.
- **A failed check does not mean rebuild** (we have no source) — it means *report which
  chunks failed CRC and open the rest*. That inversion is the whole reason we are not on
  Tier 1.

---

## 6. The derived side — collisions and the rest

The user explicitly allows other structures "for parts of it and for efficiency for
collisions etc". The invariant does not forbid them; it constrains how they are *built*.

**One rule makes them safe, and it is a compile-time rule, not a discipline:**

> A derived structure exposes **no setter**. Its only entry point is
> `rebuild(store, region)`. You cannot write into it, so you cannot forget to.

That is the `N × silence` cure from the protocol. The dirty-marking side is already
collapsed to N = 1 by `DESIGN.md`'s one-apply rule; this collapses the consuming side by
making the wrong operation *unavailable* rather than merely discouraged.

Candidates, all rebuildable from a region of voxels:

| structure | job | keyed by |
|---|---|---|
| chunk mesh + normals | drawing | mesh chunk (8×8) |
| **terrain height sampler** | feet, camera | read straight from voxels — no structure |
| **wall/edge collider** | blocking motion | `EdgeSet` per storage chunk, halo included |
| item/props broadphase | interaction | `spatial<T[x,y,z]>` — Morton, ships in loft |
| LOD height texture | the far band | one texel per hex, whole regions |

`spatial<T[x,y,z]>` (`LOFT.md:1457`) is a Morton/Z-order radix tree with proximity
range-slices — the right shape for the broadphase, and worth noting its bounding-box
query returns *"the raw Morton-code interval, a superset of the geometric box"*, so
results need filtering. That superset is a correctness trap for anyone who assumes the
box is exact.

The terrain sampler row is the interesting one: **there is no acceleration structure for
ground collision, deliberately.** A voxel read at (q,r) is already O(1) into a mapped
page. Building an index over it would be a second home for a fact — the thing the
invariant forbids — for no gain.

---

## 6b. The guards — making the wrong write unwritable

*(user, 2026-07-26: "So we need a guard against that and routines that are validated to
be correct")*

A guard is not a rule people remember. It is a mechanism that makes the mistake a
**compile error or a named refusal**, so that forgetting is impossible rather than
merely discouraged. Three are needed, and reading the current code before designing them
turned up an obstacle that changes what they can be.

### ⚠ There is no write chokepoint today, and the one that looks like it may not be one

`h_height` is written at **seven sites** across two packages — `map_set_height`, three
branches of `stencil_into_map_mode`, and three in `moros_editor`'s superseded stamp. All
follow the same shape: `cur = map_get_hex(…)`, mutate `cur.h_field`, then
`map_set_hex(…)`.

That reads as a value discipline with `map_set_hex` as the chokepoint. It may not be
one. `map_get_hex` returns `gh_c.ck_hexes[idx]` — **a vector element** — and loft's own
rule (`#338`, in the writing guide) says `tmp = v[j]` is *a VIEW of slot j, not a copy*.
If that holds here, the mutation has already landed in the map and the trailing
`map_set_hex` is decorative: **any caller can write a cell without passing through any
function at all.**

Both readings are bad and they are bad in the same direction, which is why the design
does not wait on resolving it:

- **if it aliases** — the chokepoint is illusory and `N` is unbounded;
- **if it copies** — seven sites each independently remember the trailing call, `N = 7`,
  and omission is silent.

It does change *what the guard must be*, so it is P13.

**The irony worth naming:** the stencil stamps are the sites that bypass, and they are
also the operation most likely to fold layers — a prefab house or stair writes a whole
column stack in one go.

### Guard 1 — the detached height, against seams

> `StoredHex` (relative to its chunk base) and `Hex` (absolute) are **different types**,
> and the only bridge is the chunk codec.

Not a comment, a type. In loft `u16` is an **alias** of `integer`, so the compiler cannot
tell a relative height from an absolute one — nominal separation is the only thing that
turns "compared a windowed height against an absolute one" from a wrong number at a seam
into a message at compile time. `N = 1`: one conversion, at chunk I/O, and nothing above
storage can name the relative form.

### Guard 2 — folded layers, against corruption

A refusal at the write, plus an audit at load:

- **at the write** — the column's layers share one base (§3c), so the check is a pure
  relative comparison with no conversion. It refuses, names the column and the layer it
  hit, and leaves the world unchanged.
- **at load** — a whole-world walk shaped exactly like `map_palette_gap`: report the
  first fold, by name, before anything draws. That pattern is already built and already
  gated, so this is a second instance of a proven shape rather than a new mechanism.

Guard 2 is **cheap but not free-standing** — it can only be `N = 1` if Guard 3 exists.

### Guard 3 — the chokepoint, which is the actual work

Every cell write passes through one function, and that function takes **the column**, not
the cell — because non-folding is a property of a column, and a guard that can only see
one cell cannot check it.

If the getter aliases, this also means **the read path must stop handing out a mutable
view**: `map_get_hex` yields an inert value. The voxel is eight bytes, so copying it
costs nothing, and it is the difference between an invariant that can be enforced and one
that can only be hoped for.

### What "validated to be correct" has to mean

Every guard ships with **three** things, not one:

1. a **gate** asserting the guard holds;
2. a **control** — the same assertion against a case that must FAIL, so a vacuously-true
   gate is caught;
3. a **mutation** — the guard deliberately broken, which must turn the gate red.

The third is the one usually skipped and the only one that actually validates the gate
rather than the code. Six gates in this editor were green for the wrong reason and not
one was caught by reading; every one was caught by running the control. The palette work
ran two mutations and both fired. **That is the bar for these routines** — a guard whose
gate has never been seen red is not a validated guard, it is an untested claim with a
test next to it.

## 7. Probes — the cheapest tests that could prove this wrong

Each is written to *fail* if the claim is false, and each names its control, because six
gates in this editor were green for the wrong reason and every one was caught by running
the control, never by reading the code.

| # | claim | probe | control |
|---|---|---|---|
| P1 | voxels round-trip | author a region, close, reopen, compare all | mutate one voxel first → must fail |
| P2 | **nothing else is authoritative** | delete the world file, keep all else → landscape must be **gone** | keep the file → comes back whole |
| P3 | derived is disposable | drop every derived structure mid-session, rebuild, compare frames | — |
| P4 | sparsity | 10⁶-chunk empty world < 64 KB | author one hex → exactly one chunk appears |
| P5 | elision is symmetric | zero a chunk's last voxel → file shrinks; reads unchanged | — |
| P6 | no arena bloat | file size ≈ chunks × 8 KB + header, within 5% | build-then-prune must not 90× it |
| P7 | a torn chunk is named | corrupt 8 KB by hand → that chunk refused, others open | uncorrupted → silent |
| P8 | palette travels with the world | copy the file alone to a fresh dir → materials resolve | — |

**P2 is the one that matters most and is easiest to skip.** It is the only probe that can
catch a second home, and it is the half of the invariant that decays silently.

---

## 8. Steps

Thick rungs, each ending green, per the standing rule.

- **V0** — **the chokepoint** (§6b Guard 3), and P13 first because it decides the shape.
  One column-taking write path; the stencil stamps stop writing cells directly. Nothing
  below can be enforced until this exists, so it leads rather than follows.
- **V1** — the file: header, palette, directory, one chunk in and out. P1, P8.
- **V2** — sparsity and elision: all-zero chunks never written. P4, P5, P6.
- **V3** — CRC and refusal: torn chunk named, rest opens. P7.
- **V4** — **the editor moves onto it.** The brush writes voxels instead of appending a
  `Peak`; `terrain_h` reads cells instead of summing peaks; `chunk_mesh` reads voxels.
  `Peak`, `world_save`, `world_load` are **deleted**, not promoted — `LIBRARY-CANDIDATES`
  row 11 already withdrew them and this is where that lands. P2, P3.
- **V5** — the derived side formalised: no-setter rebuild contract, edge collider,
  broadphase.

**Migration.** Existing peak-format worlds are baked to voxels once by a throwaway
reader, then the format is gone. Cheap (~20 lines) and it means no test world is lost.

---

## 9. What this does not do

- **No mmap, for now.** §2. Revisit when loft ships Tier 2/3, or if profiling says the
  syscalls matter — as a working layer, never as the record.
- **No compaction.** Freed chunk slots are reused via the directory; the file does not
  shrink on delete. Named so it is a known frontier, not a surprise. (P6 constrains
  bloat during a session, not across a delete-heavy lifetime.)
- **No multi-writer.** One process owns a world file. Multi-client already means many
  viewers of one server-side model, so this costs nothing today.
- **No spawn/NPC data.** §3.
- **No volumetric terrain — overhangs, caves and arches inside a single storey.**
  Closed deliberately in §3b, not deferred: it is the one decision here that a file
  format cannot be talked into later.
