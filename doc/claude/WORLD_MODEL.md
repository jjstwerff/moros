# The world model

How a hex-grid landscape is represented, stored and addressed — the `hex_world` data axis of
the `hex_*` family, built for **lavition** (the universal editor) with Moros as one consumer
among several. `loft/doc/claude/LAVITION.md` publishes the family inventory this fills.

**Part II is normative.** Where any other document disagrees with it, this one is right.
Rules are numbered so a gate, a refusal and a bug report can name the same thing.

> **Status:** the model is specified; the code is not written. [Plan
> 8](../../plans/8-voxel-world/README.md) builds it and holds the steps, the struggles and
> the probe tables. This document endures — it is what the plan is built *against*, not a
> part of the building.

---

# Part I — the model

## The one rule

> Delete every file but the world file and the landscape comes back bit-exact. Delete the
> world file and no amount of derivation brings it back.

Everything else — meshes, normals, colliders, LOD textures, dirty sets — is **derived and
disposable**, and may be cached for as long or as briefly as it stays valid: the world
stamps every write with an edit clock (**T1**), so a cache asks an exact question rather
than guessing. The second half is the one that decays quietly: the moment some fact has a
second home, two things are true and they disagree the first time one is rebuilt.

## The voxel — eight bytes

A cell is seven integers: a `u16` height and six `u8`s. **The `u8`s are indexes, never
values** — every name, category and float lives once in a palette table rather than once per
cell. That is the whole reason a cell fits in eight bytes; `wd_thickness: float` alone would
add eight more to every walled hex.

**Index 0 is absence in every table.** A defaulted cell is all zeroes, and that is what an
unwritten cell *is*, so slot 0 cannot be a real definition. Getting this wrong does not
crash — it makes empty space render as whatever material was defined first.

`L13` makes the voxel the **ceiling on permanent world state**. Anything that changes every
tick — age, wear, occupancy — is not a cell field; it belongs in a side table (`L14`).

## Layers, chunks and columns

- A **chunk** is a 32 × 32 tile of hexes, `(cx, cz)`, holding a base height and **its own
  ordered list of layers** — at most 64, terrain and dressing mixed freely.
- A **terrain layer** is a heightfield over that tile: one surface per hex, 1024 cells,
  8 KB. No overhangs or caves *within* a layer; a cave is a layer with the one above absent.
- A **dressing layer** places things that never collide, and is not a function on hexes at
  all — a hex may carry none, one or many.
- **Layer order is local.** A layer's index is a position in *its own chunk* and means
  nothing outside it. There is no world-wide layer list and no global budget: a forty-storey
  tower's layers exist in the tile it stands on and nowhere else.
- **A layer may carry a label**, so corresponding layers in neighbouring chunks share an id
  and a deck or storey can be named once and recognised everywhere. The label is optional,
  and it is a claim about the geometric match rather than a replacement for it (**I1**).
- **Heights are windowed.** A stored height is a `u16` measured from its chunk's base, which
  decouples the cell's height width from how tall the world is — and therefore decouples
  **resolution from extent**. That decoupling is what lets one model serve a dungeon at
  centimetre precision and a planet at metre precision without either giving something up.
- **Scale is a world constant, not a fixed number.** The model stores integer steps and
  never learns what a step is worth. A space-station world declaring `u = 1 cm` and a
  landscape declaring `u = 25 cm` are the *same model*, differently interpreted.
- **The world floor is 0 and unsigned**, so nothing is below it. A floor reserve `ρ` keeps
  authored terrain above the depth reserved for cellars, mines and dungeons (**R1**).

**The unit of access is a column, not a cell.** Every rule in Part II is a property of a
column, and a routine handing out cells could not check any of them.

**Sparsity lives on the chunk axis.** A layer exists only in the tiles that have it, so
structures with many layers — towers, shafts, dungeon levels — cost what they *occupy*, not
what they span. That is why terrain layers can afford to be dense.

## Continuity across a seam

Matched by **height**, never by name. Stepping into the next tile, the surface you continue
onto is the one nearest your current absolute height — which is what walking physically is,
and which correctly answers *"nothing there"* when a floor stops at a wall.

This needs no shared identity because of a result proved in Part II: the same constant that
keeps layers from folding also guarantees at most one layer can match. **Seam alignment is
not a second mechanism** — it falls out of the first.

Labels are permitted on top of this and are useful — a deck or storey recognised across a
whole station — but they never *define* the match, only assert it. **I1** makes the
assertion checkable, so a label can be trusted as a fast path precisely because it can be
caught lying.

**Heights are absolute in memory and relative on disk.** The window is a storage encoding
that never leaves the storage layer: one addition on read, one subtraction on write.

## Change, and what may be cached

Every write stamps a monotonic **edit clock**, and every layer remembers the clock value at
which it was last written. A cache — an LOD texture, a baked collider, a mesh — records the
clock it was built at, and validity is an exact comparison rather than a guess about time.

Versions are **per layer**, so a prop change never invalidates a cache over terrain, and a
cellar collapsing never invalidates the hillside above it.

**Nothing may assume world data is slow.** An LOD texture may stand for a year and a castle
may be destroyed in one frame; authoring and runtime destruction share the same write path,
the same refusals and the same clock.

## Many authors, one writer

Concurrent **authors** are the normal case — people editing a world and playing in it
together. A concurrent **writer to one store** is a bug, and is detected rather than assumed
away.

Edit streams merge into one serialised writer, and merging is cheap because writes touching
different columns **commute**: only edits to the same column need their relative order kept.
Readers take consistent snapshots, so derivation and validation run *alongside* editing
rather than between edits.

## Long-running stores

Terrain layer slots are a fixed 8 KB, so the bulk of a file **cannot fragment** — free space
is never the wrong shape. What can fragment is small and size-classed: the directory and
dressing records.

Compaction reuses the ordinary copy-on-write path and can run online, be interrupted, and
survive a crash. Crucially it **does not touch the clock**: moving bytes is not changing the
world, so a maintenance pass leaves every cache valid.

A chunk leaves the *file* only when it holds nothing. It leaves *memory* whenever the
consumer likes — residency is streaming, not storage.

## What is NOT in the world file

*(user, 2026-07-26: "the world lives in a single file, however, the stencils we use during
the editor and the things we place into the world both as set dressing and as
vehicles/part-of vehicles live in different files")*

**One file per world.** Terrain, the palette and dressing *placements* live in it. Three
kinds of thing deliberately do not, and they differ in whether the world depends on them:

| | lives in | the world depends on it |
|---|---|---|
| terrain, palette, placements | **the world file** | — it *is* the world |
| **stencils** — authoring templates | their own files | **no.** Stamping bakes the result into the world; afterwards nothing references the stencil |
| **assets** — dressing models, vehicle parts | their own files | **yes.** A placement is a reference, resolved at load |

**The dividing line is RATE OF CHANGE**, not ownership or duplication.

*(user, 2026-07-26: "To place them in a different file makes that file much more stable than
combining the actual world in them that can mutate by game mechanics.")*

A world file mutates constantly and by design — authoring, and then game mechanics: an
explosion, a fire, a collapse (`T3` forbids assuming otherwise). An asset file is
near-static: a tree model, a cart's parts, a stencil, authored once and changed rarely.
Storing them together would drag stable data through every volatile write, and four things
fall out of keeping them apart:

- **caching** — a static file is hashed once, shared between worlds and held read-only;
- **shipping** — assets go to a client once and stay, where the world streams continuously.
  Combined, every world update would re-send data that did not change;
- **churn** — copy-on-write and compaction move a world's bytes around constantly (`X3`–`X5`),
  and static assets living inside would be copied for nothing;
- **versioning** — the world carries an edit clock because it changes (`T1`). Assets need at
  most a version per library.

**This is `T2` at a second scale.** Within the world file, per-layer versions stop a prop
change from invalidating a terrain cache — things that change at different rates must not
invalidate each other. The asset/world split is the same rule at file granularity, and it
makes the boundary predictive rather than a matter of taste: **anything near-static and
shared belongs outside; anything the game mutates belongs inside.**

**Stencils are the clean case.** A stencil is an editor tool, not world content: stamping a
house writes cells, and the saved world neither knows nor cares which stencil produced them.
So a stencil library can change, move or vanish without touching any world.

⚠ **Assets are not, and it is worth being exact about what that costs.** A dressing placement
stores a *reference*, so a world plus a missing asset library is a world with holes in it.
That is the right trade — a tree model copied into every world that plants one is the
opposite of "huge but efficient" — but it means **the one rule holds for the landscape and
not for dressing**: delete everything but the world file and the terrain comes back
bit-exact, while the props come back as unresolved references. `L13`'s *landscape* is
self-contained; the scenery is not, by design.

The mapping from a placement's index to an asset identity is **consumer-owned**, and it goes
in the palette section the library already treats as opaque bytes — the same seam, reused
rather than a new one.

## Addressing

Axial `(q, r)` throughout, per the family's `CONVERGENCE.md`: **axial is the storage and
interchange convention, odd-r is authoring and presentation**, and `hex_grid` owns the bridge.

## Where it lives

| concern | package |
|---|---|
| cells, columns, chunks, the window, the routine, the file | `hex_world` |
| lattice geometry, conventions, the odd-r ↔ axial bridge | `hex_grid` |
| bounded portable documents and stencils | `hex_field` |
| collision as an edge set | `hex_edge` |
| grid → mesh, dirty rebuilds, LOD | `gridmesh` |
| overland generation | `hex_terrain` |
| what a material *means* | the consumer — moros |

**`hex_world` owns nothing that draws, collides or generates.** The line that decides every
case: the library owns *how a thing attaches to geometry*, never the payload. The day it
knows what a stair is, it has stopped being a substrate.

The pair most easily confused is `hex_world` and `hex_field`. **A field is a document; a
world is a residence** — bounded, portable, one layer, wider types so each consumer keeps its
own units, versus unbounded, mutable, multi-layer, random access.

---

# Part II — the contract *(normative)*

## 1. Notation

| symbol | meaning |
|---|---|
| `x = (q, r) ∈ ℤ²` | a hex, axial |
| `κ(x) = (⌊q/32⌋, ⌊r/32⌋)` | the chunk holding `x` — floor division, **not** truncation |
| `ℓ(x) = (q mod 32, r mod 32)` | position within it, `mod` taking sign from the divisor |
| `X_K` | the 1024 hexes of chunk `K` |
| `b_K ∈ ℕ` | its **window base**, an absolute height |
| `Λ_K = ⟨λ₀ … λ_{n−1}⟩`, `n ≤ 64` | its layers, **an ordered sequence**, local to `K` |
| `k(λ) ∈ {T, D}` | layer kind: **T**errain or **D**ressing |
| `id(λ) ∈ [0, 2³²)` | an optional **label** — a name, not an ordinal. `0` means unlabelled |
| `ν ∈ [0, 2³²)` | the world's **next free label**, in the header |
| `τ ∈ [0, 2⁶⁴)` | the world's **edit clock**, in the header — monotonic |
| `ver(λ) ∈ [0, 2⁶⁴)` | the clock value at which `λ` was last written |
| `s_λ(x) ∈ [0, 2¹⁶)` | the **stored** height — relative to `b_K`, meaningless alone |
| `m_λ(x) ∈ [0, 2⁸)` | the material index |
| `H_λ(x) = b_K + s_λ(x)` | the **absolute** height, for `κ(x) = K` |
| `u ∈ ℚ⁺` | the **height unit** — a world constant; what one height step means outside the model |
| `ρ ∈ ℕ` | **floor reserve** — a world constant; terrain may not be authored below it |
| `ε ∈ ℕ` | **minimum layer separation** — a world constant. In a walkable world this is headroom; the model only requires that layers be distinguishable |
| `θ ∈ ℕ` | **match tolerance** — a world constant; the largest step read as continuous |

```
occ_λ(x)  ⟺  m_λ(x) ≠ 0                       occupied iff the material is not absence
col_K(x)  =  ⟨ i : k(λᵢ) = T ∧ occ_{λᵢ}(x) ⟩   the column at x, in chunk-index order
```

`col_K(x)` contains **terrain layers only**. No rule below quantifies over dressing.

## 2. The objects

**A world** is a partial map `ℤ² ⇀ chunks`, plus the constants `(u, ρ, ε, θ)`, the label
counter `ν`, the edit clock `τ`, and a palette.

**`u` is declared per world and the model never reads it.** Heights are integers; `u` says
what one step means to a renderer, a collider or a player, and every other constant here is
counted in steps rather than in metres. This is the whole of the model's scale-independence:
a dungeon world may declare `u = 1 cm` and a planetary one `u = 1 m`, and nothing in Part II
changes — the same invariants, the same proofs, the same file. A chunk absent from
the map does not exist; it is not an empty chunk (**E1**).

**A chunk** `K = (b_K, Λ_K)`.

**A terrain layer** is a *total function* on `X_K`: all 1024 hexes have a cell.

**A dressing layer** is a *finite multiset* of placements over `X_K` — explicitly not a
function on hexes. Its contents are specified by
[#14](https://github.com/jjstwerff/moros/issues/14); this contract constrains only that it
exists, has a kind, and is excluded from every rule about columns, folding and collision.

## 3. The governing rule

*(this section is `G0` alone; every rule it audits is stated in §4)*

*(user, 2026-07-26: "This should be a universal editor and world model. We do our best for
efficiency but we can never assume something will not happen at all")*

> **G0 — every bound is checked, named and reachable.** For each limit in this model there
> must be (a) a check, (b) a named refusal or a defined degradation, and (c) a gate that
> actually reaches it. **"This will not happen in practice" is not a design; it is the
> absence of one.**

The failure this prevents is the one that arrives years later in someone else's world. A
sizing argument — *a 32 m tile will never span 16 km of relief*, *nobody makes four billion
edits* — is a statement about the worlds we imagined, and a universal model is used by
people who imagined different ones. Efficiency arguments decide **what is cheap**, never
**what is possible**.

Every bound in §4 is audited against `G0`:

| bound | check | at the limit | gate |
|---|---|---|---|
| stored height, `2¹⁶` per chunk window | **W1** | `CW_WINDOW`, refuse not truncate | ✓ |
| layers per chunk, `64` | §2 | `CW_LAYER_CAP` | ✓ |
| palette entries, `256` | `add` | returns `−1` | ✓ |
| authored depth | **R1** | `CW_RESERVE` | ✓ |
| `ε > 2θ` | **C1** | refused at open | ✓ |
| labels, `2³²` | **I4** | **degrades**: new layers unlabelled, reported | ✓ |
| edit clock | **T1** | `u64` — see below | ✓ |
| world extent | **X1** | `CW_EXTENT` | ✓ |
| one writer *per store* | **X2** | `CW_CONCURRENT`, detected not assumed. Many *authors* are normal (**M1**, **M2**) | ✓ |
| free space over a long life | **X3** | fixed-size slots cannot fragment; variable regions size-classed | ✓ |

## 4. Invariants

A world satisfying **F1**, **W1**, **E1**, **S1**, **R1**, **I1**, **I3**, **T1**, **T2**,
**M1**, **M2**, **X4** and **Q1** is *well-formed*. The routine must
never produce one that is not, and must refuse rather than try.

### Group 1 — geometry

### F1 — Fold-freedom

> For every chunk `K`, every `x ∈ X_K`, and every pair `i < j` **consecutive** in `col_K(x)`:
>
> ```
>     H_{λⱼ}(x) − H_{λᵢ}(x)  ≥  ε
> ```

"Consecutive" means no occupied terrain layer lies between them in `col_K(x)`.

**Lemma F1′ — separation extends to all pairs.** For any `i < j` in `col_K(x)`,
`H_{λⱼ}(x) − H_{λᵢ}(x) ≥ ε`.

*Proof.* The occupied layers between them form a chain `i = c₀ < … < c_p = j` of consecutive
pairs with `p ≥ 1`. Each step contributes at least `ε` and all contributions are positive,
so the total is at least `pε ≥ ε`. ∎

**Corollary F1″ — order is height order.** `H` is strictly increasing along `col_K(x)`.
Layer order and vertical order can never disagree, which is what non-folding *means*.

**F1 is checkable inside one chunk.** A column lies wholly within `X_K`, so **F1** never
reads a second chunk. It is not a seam rule.

### Group 2 — storage

### W1 — Window containment

> ```
>     ∀ K, ∀ terrain λ ∈ Λ_K, ∀ x ∈ X_K :   0 ≤ H_λ(x) − b_K < 2¹⁶
> ```

A chunk is **representable** iff `max H − min H < 2¹⁶`. When it is, `b_K = min H` satisfies
**W1**, so a rebase succeeds whenever any base would.

### E1 — Absence has one representation

> 1. A terrain layer with no occupied cell is **not stored**.
> 2. A chunk with `Λ_K = ⟨⟩` is **not in the directory**.
> 3. Reading an absent layer or chunk yields exactly what reading a stored all-zero one
>    would.

(3) makes (1) and (2) sound rather than lossy, and it is the clause a round-trip test cannot
check — it needs the size probes.

**E1 binds READERS as well as writers.** Because a column read returns one cell per layer
*of the chunk*, a layer a column does not use comes back absent — and an absent cell's
height is `0`, which is also a legal ground height. So a consumer may never infer occupancy
from POSITION:

> **E1r.** The topmost and lowest cells of a column are its topmost and lowest **occupied**
> cells. `cells[0]` and `cells[n-1]` are positions, not the floor and the roof; the only
> question that distinguishes absence from ground at zero is `occupied(c)`.

Measured (rung W4): reading `cells[n-1]` as the roof put a building's first floor 12 above
an absent layer rather than above the ground, landing it 7 above the real surface, where
`F1` refused it. The contract held; the reader did not.

**E1 binds the STORE by a wider question than occupancy.** A hex stores three of its six
edges, so half of any region's boundary is stored in the cells *outside* it — and such a
cell need hold no ground at all. "Is there ground here" and "does this record carry
anything" are therefore different questions, and elision must ask the second:

> **E1e.** A cell is **present** iff any of its fields is non-zero — material, item, or one
> of its three edges. Elision drops what is not present; the window spans what is present.
> **Occupancy** (material alone) remains the floor-and-roof question `E1r` asks, and the one
> `F1` stacks: a cell holding only edges is present, and is not ground.

Measured (rung W2, `probe/edgehold.loft`): with elision keyed on material, a boundary edge
beside occupied cells survived save and load while a layer whose only content was edges was
dropped whole — so a fence survived or vanished according to which **side** of it the ground
happened to be, an anisotropy with no physical meaning. The loss was silent, because a
dropped layer reads back exactly as absence.

### P1 — A stencil writes a band, not a column

> A placement declares the closed height interval `[lo, hi]` it **owns**. The write
> 1. replaces every occupied cell whose height lies in `[lo, hi]`;
> 2. keeps every occupied cell outside it, unchanged;
> 3. is **refused** — never clipped, never partially applied — if the result would
>    breach `F1` against the nearest kept cell below `lo` or above `hi`, or if any
>    cell offered sits outside the declared band.

One rule serves the three cases a builder actually meets. Under a bridge: the deck is
above `hi`, so it is kept. Over a cave: the floor is below `lo`, so it is kept. On the
surface: the surface cell is inside the band, so the stencil's floor **replaces** it —
the terrain layer takes the stencil's content rather than acquiring a second surface
beside it or being buried under one. *That* is what "a stencil interacts with the
surface" means operationally: **the ground layer reforms to the stencil.**

Clause 3's second half is `G0` applied to a caller's promise: the interval is what
guarantees preservation, so an offered cell outside it is refused rather than trusted.

**Index is not identity.** A column is height-ascending because `F1` compares
consecutive occupied cells in vector order, so when a band's cell count differs from
what it replaced, every cell **above** it shifts slot; cells below keep theirs.
Anything needing a stable handle across a merge holds the layer's `ly_id`, not its
index — the same shape of error as reading `cells[n-1]` for the roof (`E1r`).

### P2 — Terrain and dressing do not mix

> No occupied terrain cell may be written into a layer of kind `DRESSING`, and a
> terrain column write leaves dressing layers **entirely untouched** — it does not
> write to them, not even to blank them.

A column write addresses layers **by index**, so a miscount does not produce a shifted
picture — it produces terrain inside a dressing layer, and nothing downstream can see
it: `world_column` reads a dressing layer as absent, so the cell vanishes and the
terrain it displaced goes with it. The guard therefore sits in `check_column`, the one
place a cell reaches a layer; in the callers it would be N places that must each
remember.

The second half is not decoration. A band merge hands back the absent placeholder a
read produces for a dressing slot, and writing that placeholder **clears** the dressing
content — after which the emptied layer is dropped by `E1`. Measured: the layer ceased
to exist, and the only symptom was its absence.

### S1 — The window never escapes storage

> Every comparison, difference or ordering of heights is performed on `H`, never on `s`.
> `s` appears only inside chunk encode and decode.

This is why `Column` carries no base field: a value that has lost its chunk cannot be
un-windowed, so the type never holds one.

### Group 3 — authoring and time

### R1 — Floor reserve

> ```
>     ∀ K, ∀ terrain λ ∈ Λ_K, ∀ x ∈ X_K :   occ_λ(x)  ⟹  H_λ(x) ≥ ρ
> ```

**Heights are unsigned: there is no digging below 0.** A structure authored with its ground
floor at or near the world floor has nowhere to put a cellar, and the failure appears late —
at the moment someone tries to excavate under a castle that is already built.

`ρ` reserves that space structurally rather than by convention. It is the deepest intended
excavation, expressed once: everything below `ρ` belongs to whatever gets dug later, and the
brush refuses to author terrain into it. A world whose ground sits at `ρ` can always fit its
dungeons, because the room was never available to spend.

The reserve is a *floor on authoring*, not on the format: excavation writes below `ρ`
deliberately, and reading is unrestricted. It exists to stop terrain being placed where a
cellar will need to go.

### I1 — Labels do not lie

Layers may carry a label so that corresponding layers in neighbouring chunks share an id —
a deck, a storey, a dungeon level named once and recognised everywhere. **The label is not
a second definition of continuity.** §5 defines continuity by height and proves it unique;
a label is a claim *about* that match, and **I1** is the requirement that the claim is true:

> For adjacent `x ∈ X_K`, `x' ∈ X_{K'}`, and `i ∈ col_K(x)` with `id(λᵢ) ≠ 0`:
>
> ```
>     j ∈ M_{K'}(x', H_{λᵢ}(x))   ⟹   id(λ'ⱼ) = id(λᵢ)
> ```

In words: **the geometric match never crosses labels.** A labelled floor may end — no match
is a legal answer, because a floor that meets a wall stops — but it may never continue into
a layer bearing a different label.

`id = 0` is unlabelled and unconstrained, following the same convention as palette slot 0:
zero is absence, and absence is never a claim.

### A label is a NAME, not an ordinal

This is the part that decides how labels are allocated, so it is stated rather than left
implicit: **nothing in this model reads label order.** `I1` uses only equality. Stack order
comes from the chunk's own layer sequence, and within a column `F1″` already makes it
identical to height order.

**Global label order would be a claim the world cannot honour.** "Below" is a *per-column*
relation, not a world-wide one: a floor that is beneath another here may sit higher than it
half a world away, because the ground between them rose. Two distinct decks of a station may
cross in absolute height across its length while remaining perfectly ordered everywhere
locally. Any scheme in which `id(a) < id(b)` meant "a is below b" would therefore be making
a promise the geometry breaks, and breaking it silently.

**So labels are never inserted *between* labels, and the exhaustion problem does not arise.**
A world keeps `ν`, the next free label, in its header; allocation is `id := ν; ν := ν + 1`.
Uniqueness is exact rather than probabilistic, needs no search of what neighbours already
use, and 2³² is not a budget anyone spends — it is four billion *distinct layers ever
created* across a world's entire authoring life.

A world may still allocate with gaps or in blocks as a **convention**, so that a station's
decks read 1000, 1001, 1002 and a mine's levels read 2000, 2001. That is a convenience for
whoever reads the file, and the model neither enforces nor relies on it. **The moment
anything depends on that ordering, the per-column argument above says it is wrong.**

> ```
>     I2 (uniqueness):   id(λ) ≠ 0  ∧  id(λ′) = id(λ)  ⟹  λ and λ′ are the same layer,
>                        or corresponding layers of different chunks
>     I3 (allocation):   every non-zero label was drawn from ν, and ν only increases
> ```

**What the label is for.** Given **I1**, an implementation may find the neighbour by label in
`O(1)` instead of searching by height, and the result is *provably the same layer* — so this
is an accelerator, not an alternative. It also restores a gesture that chunk-local layers had
cost: selecting "dungeon level 2" across a whole region becomes a lookup rather than a query
over a height band.

**What it is not.** There is no world-wide registry of labels, no definition attached to one,
and no requirement that a label be used at all. A chunk remains free to hold a layer set
shared with nobody.

### T1 — The edit clock

> Every write that changes a layer's contents performs
>
> ```
>     τ := τ + 1  ;  ver(λ) := τ
> ```
>
> and therefore `ver(λ) ≤ τ` for every layer at all times.

**A cache built at clock `c` over a set of layers `L` is valid iff `max{ ver(λ) : λ ∈ L } ≤ c`.**
That is the whole protocol. It is an exact comparison, not a heuristic and not a timestamp:
a clock value is a fact about what has happened, where a time is a guess about whether it
has.

**Versions live in the chunk DIRECTORY, never in the chunk payload.** Validating a cache
must cost a directory lookup and not an 8 KB load, or the check becomes more expensive than
the rebuild it was meant to avoid. This is a structural requirement, not an optimisation.

### T2 — Versions are independent

> A write to `λ` changes `ver` of no other layer.

So a dressing change never invalidates a cache over terrain, a cellar's collapse never
invalidates the LOD texture of the hillside above, and two derived products over one chunk
are only coupled if they genuinely read the same layers. Without **T2** every cache in a
chunk shares one fate and the separation of layers buys nothing.

### T3 — No assumption about the rate of change

> The model places no upper bound on how often a layer changes, and no writer is privileged.

An LOD texture may stand for a year and a castle may be destroyed in one frame; **both are
ordinary**. Authoring and runtime destruction use the same write path, take the same
refusals, and stamp the same clock. Nothing may be built on the premise that world data is
slow — an explosion, a crash or a fire is a first-class writer.

⚠ **One consequence is not yet expressible and is called out rather than hidden.** A
collapse that drops a floor onto the one beneath it would bring two layers closer than `ε`,
which **F1** forbids. Refusing a physical event is the wrong answer. The right one is that
**a collapse removes a layer rather than moving it**: the floor ceases to exist and its
rubble becomes the surface below. Whether every destructive case can be expressed that way
is open, and is the first thing to test when a destruction path is built.

### Q1 — One surface, queried once

> The height of the ground at a world position is given by **one** derivation. Whatever
> reads it — the mesh that is drawn, the feet that stand on it, a camera avoiding it, a
> collider — reads that same function, never a reimplementation of it.

This looks like tidiness and is not. A consumer that avoids the ground using its *own*
notion of where the ground is has a guarantee about a surface **that is not the one on
screen**: its logic can be perfectly correct and the result still wrong, and the failure
appears as the consumer's bug rather than as the disagreement it is.

The world therefore exposes the query, and the two derived quantities that go with it — the
gradient (for anything needing a perpendicular distance rather than a vertical one) and the
blocking predicate (`§7`, supplied by the consumer, since what *counts* as blocking is
payload).

**Q1 is what makes a camera contract possible at all**: without it, no consumer can promise
anything about its relationship to the surface.

### D1 — Dressing is inert

> Dressing layers are excluded from `col_K`, from **F1**, and from every collision query.
> Adding, removing or altering one leaves every terrain layer bit-identical.

Dressing is written by `world_set_dressing` and read by `world_dressing`, and it needs its
own pair because a terrain write cannot create it: `world_set_column` materialises every
layer as terrain. Until that pair existed **P2 guarded a case that could not arise** —
enforced, never exercised, which is a rule nobody has tested.

The two views differ in a way worth stating. A **terrain** column is index-aligned to the
chunk's layers, because **F1** reads consecutive occupied cells in vector order. A
**dressing** column is simply *the dressing layers, in order* — it has no **F1**, so it
needs no alignment, and that independence is the point: moving a prop must not renumber a
terrain slot. New dressing layers are therefore **appended**, never inserted, since D1's
"bit-identical" is a claim about the bytes and renumbering would break it even if every
value survived.

`R1` still applies — dressing shares the window, so it cannot sit below the floor. `F1`
does not: two props may overlap, and a lantern may hang inside the arch it lights.

### Group 4 — labels, operation and concurrency

### I4 — Label exhaustion degrades, it does not fail

> When `ν` reaches `2³²`, a request for a new label yields `0` (unlabelled) and reports it.
> The layer is still created.

Labels are optional by construction (`id = 0` is legal everywhere), so exhaustion costs the
*convenience* and never the world. Renumbering is offline maintenance, not a crash.

### The clock is `u64`, and that is a correctness choice

`τ` and `ver` are **64-bit**, where `ν` is 32. The asymmetry is deliberate: a wrapped label
collides and **I1** catches it at the first seam, but a wrapped clock makes a stale cache
report *valid* — a silent wrong answer, the worst class this model has. Eight bytes per
layer in the directory buys the elimination of that class outright, and `2⁶⁴` writes is not
a bound anyone reaches by any means.

### X1 — World extent

> Chunk coordinates are signed 32-bit: `cx, cz ∈ [−2³¹, 2³¹)`. A write beyond that is
> `CW_EXTENT`.

That is ±68 billion hexes on each axis. It is stated and checked anyway, because `G0`.

### X2 — Many sources, one writer

*(user, 2026-07-26: "I want to make everything multi-player enabled … multiple people
editing a world and playing in it should be there from the start. This doesn't automatically
mean that we need to have multiple threads write to the same store, but we need a way to
make it as efficient as possible to mix data streams towards it with parallel routines to
validate the other data structures")*

**Concurrent *authors* are the normal case; a concurrent *writer to one store* is a bug.**
These are different claims and the distinction is the whole design. Many players and editors
produce many streams of edits; those streams **merge** into one serialised writer, and the
owner marker below exists to catch two processes fighting over a file, never to limit how
many people are in the world.

> A world opened for writing records an owner marker. A write whose marker does not match
> the file's is `CW_CONCURRENT`.

What makes merging cheap is that the model's write unit is already the right one:

### M1 — Column-disjoint writes commute

> Two writes touching disjoint sets of columns produce the same **world** in either order.
> Writes to a shared column are ordered by `τ`.

So a merger may reorder and batch freely, needing only to preserve the relative order of
edits that touch the same column. That is the parallelism budget, and it is large: two
players building in different rooms never interact.

⚠ **Commutativity is on the world, not on the bytes.** A rebase triggered by one column
re-encodes every layer of its chunk, so two orders can yield the same `H` everywhere and
different `s`. Semantically identical, bit-wise not. This matters the moment two servers
applying one edit set are compared by file hash — **compare worlds, not files.**

### M2 — A reader sees a consistent snapshot

> A read observes the world as of some single clock value. It never observes a partially
> applied write.

This is what lets validation and derivation run **in parallel with editing** rather than
between edits: a derived structure takes a snapshot at clock `c`, rebuilds off the critical
path, and `T1` tells it exactly whether its result is still current when it lands. Combined
with `T2`'s independence, two derivations over disjoint layers never contend with each other
*or* with the writer.

**Mechanism: chunk slots are copy-on-write.** A write allocates a new slot, fills it, and
then republishes the directory entry; readers holding the old offset keep reading valid
bytes until they are done. Freed slots return to the free list once no reader holds them.

⚠ **This improves crash behaviour but does not solve it, and the difference is worth
stating.** Never overwriting a live chunk means a crash mid-write cannot damage the previous
one — the old bytes are still there and still valid. But the **directory republish** is then
the atomicity risk, moved from 8 KB to one entry rather than removed. A per-entry CRC detects
a torn entry; recovering it needs a journal, which loft's Tier 3 would provide and does not
yet. Until then the honest position is: the window is small, torn entries are *detected*, and
the chunk they point at is refused by name rather than silently misread.

### X3 — Reclamation, and why the bulk cannot fragment

*(user, 2026-07-26: "we need a system that can eventually remove chunks we not need anymore
and we need a system that can clean-up long running stores, because of their nature
fragmentation is not quick, but it is not impossible either")*

> A layer slot freed by **E1** returns to a free list. Terrain layer slots are **fixed size**
> (8 KB), so any free slot serves any layer.

**Fixed-size slots mean the bulk of the file cannot fragment at all.** This is not a
mitigation, it is the absence of the problem: fragmentation is the inability to use free
space because the pieces are the wrong shape, and identical pieces are never the wrong shape.
Since terrain layers dominate a world's bytes by orders of magnitude, the file's steady state
is the high-water mark of *live* data rather than of total writes.

**Fragmentation is therefore confined to the variable-size regions** — the chunk directory
(entries vary with layer count) and dressing records (`#14`, inherently variable). Both are
small beside layer data, and both are handled by size-classed free lists rather than by
hoping. `G0`: the bound is small, and it is still checked.

### X4 — Relocation preserves the world

> Moving a chunk's bytes changes its `data_off` and nothing else. **`τ` does not advance and
> no `ver` changes.**

⚠ **This is the trap, and it is easy to fall into.** The obvious way to implement compaction
is to route relocations through the ordinary write path — which stamps the clock (`T1`) and
would therefore **invalidate every cache in the world on every maintenance pass**. LOD
textures that took minutes to build would be discarded by an operation that changed nothing
anyone can see.

A relocation changes *where the bytes live*, not *what the world is*. The two must not share
a stamp.

### X5 — Compaction is the write path, minus the stamp

> Relocating a chunk is: allocate a lower free slot, copy, republish the directory entry,
> free the old — the same copy-on-write step as a normal write.

So compaction needs **no new mechanism**: `M2` holds throughout, readers keep valid bytes
until they release them, and a crash mid-compaction leaves the original chunk intact and
reachable. It can run online, incrementally, and be interrupted.

The file itself shrinks only by truncating trailing free space, so compaction is a policy
for choosing which live chunks to move *down* — a policy question, deliberately not fixed
here, because how aggressively a long-running store defragments depends on whether it is a
server, an editor session, or a shipped world.

**Removal and eviction are different things.** A chunk leaves the *file* only when it holds
nothing (**E1**). A chunk leaves *memory* whenever the consumer likes — it is reloadable, so
residency is a streaming decision and no concern of this model.

## 5. The border contract

For adjacent hexes `x ∈ X_K`, `x' ∈ X_{K'}` with `K ≠ K'`, the **match** from a height `h`
into `K'` is

```
    M_{K'}(x', h)  =  { j ∈ col_{K'}(x')  :  | H_{λⱼ}(x') − h | ≤ θ }
```

Continuity is *computed*, never stored: there is no shared name, id or index, and layer
indices in `K` and `K'` are unrelated.

### B1 — Match uniqueness

> `| M_{K'}(x', h) | ≤ 1` for every `x'`, `h`.

> **Theorem.** If **F1** holds in `K'` and `ε > 2θ`, then **B1** holds.

*Proof.* Suppose `i < j` are both in `M_{K'}(x', h)`. Then `|H_{λᵢ}(x') − h| ≤ θ` and
`|H_{λⱼ}(x') − h| ≤ θ`, so by the triangle inequality

```
    H_{λⱼ}(x') − H_{λᵢ}(x')  ≤  2θ  <  ε
```

But `i < j` in `col_{K'}(x')`, so **F1′** gives `H_{λⱼ}(x') − H_{λᵢ}(x') ≥ ε`.
Contradiction. ∎

**This is the load-bearing result.** Seam alignment is not a second mechanism with its own
bookkeeping — it is a *consequence* of the invariant that already stops layers folding,
given one inequality on two constants. Ambiguity at a border is impossible by construction,
not resolved by a tie-break.

### B2 — Reciprocity

> `j ∈ M_{K'}(x', H_{λᵢ}(x))` ⟺ `i ∈ M_K(x, H_{λⱼ}(x'))`.

*Proof.* Both sides are `|H_{λⱼ}(x') − H_{λᵢ}(x)| ≤ θ`, which is symmetric. ∎

### B3 — The match is a partial injection

> Distinct layers at `x` never match one layer at `x'`.

*Proof.* If `i ≠ i'` both matched `j`, then `|H_{λᵢ}(x) − H_{λᵢ′}(x)| ≤ 2θ < ε`,
contradicting **F1′** in `K`. ∎

So a border correspondence is a **partial matching**: every surface continues to at most
one, is continued by at most one, and **may continue to none** — which is required, because
a floor that meets a wall stops.

### C1 — The constant constraint

> ```
>     ε  >  2θ
> ```

**The only inequality relating the two world constants, and it is checked at world creation,
never assumed.** Physically it is comfortable — `ε` is standing headroom, `θ` the largest
step read as continuous, so it says a storey is more than twice a step. A world violating it
fails **B1** *silently*, and the symptom is intermittently wrong geometry at chunk borders.

## 6. Refusals, mapped to what they protect

Every refusal names what it refused and leaves the world unchanged.

| refusal | protects | condition |
|---|---|---|
| `CW_FOLD` | **F1** | a write would bring some consecutive pair closer than `ε` |
| `CW_WINDOW` | **W1** | `max H − min H ≥ 2¹⁶` after the write; no base exists |
| `CW_RESERVE` | **R1** | terrain would be authored below `ρ` |
| `CW_LAYER_CAP` | §2 | the chunk would hold more than 64 layers |
| `CW_EXTENT` | **X1** | a chunk coordinate leaves the signed 32-bit range |
| `CW_CONCURRENT` | **X2** | the writer's marker does not match the file's |
| world refused at creation | **C1** | `ε ≤ 2θ` |
| torn chunk | — | CRC mismatch: that chunk is refused, the rest opens |

**Rebase is not a refusal.** When a write leaves the window but the span still fits,
`b_K := min H` and every stored layer of `K` is re-encoded. **W1** guarantees this succeeds
whenever any base would.

## 7. What this contract does not constrain

Stated so the silence is deliberate:

- **Layer indices across chunks.** `λ₃` in `K` and `λ₃` in `K'` are unrelated.
- **Chunk bases.** `b_K` and `b_{K'}` are independent; **S1** makes them irrelevant to every
  comparison.
- **Layer kinds per chunk.** Any chunk may hold any mix of `T` and `D` in any order.
- **Dressing contents.** [#14](https://github.com/jjstwerff/moros/issues/14).
- **Whether a surface continues at all.** A partial matching is the intended answer.

## 8. Gates — one per rule

A rule with no gate that has been **seen red** is a claim, not a contract.

| rule | gate | control |
|---|---|---|
| **F1** | raise a layer to within `ε` of the one above → `CW_FOLD`, world unchanged | raise to exactly `ε` → accepted |
| **F1′** | non-consecutive pairs also separated, over a random column | — |
| **W1** | every stored `s` in range after any write, including after rebase | force a span ≥ 2¹⁶ → `CW_WINDOW` |
| **E1** | zero a layer's last cell → it leaves the file; reads unchanged | — |
| **E1r** | read `cells[n-1]` as the roof → the storey lands on an absent layer | `world/storey.mjs` |
| **E1e** | key elision on material → a layer of edges alone is dropped whole | clear the edges too → the chunk still leaves the file (`tests/sparsity.loft`, `probe/edgehold.loft`) |
| **P1** | replace the column instead of the band → the cave under the house is deleted | `tests/stencil.loft` |
| **P1** | trust the declared band → a cell outside it overwrites what was promised kept | `tests/stencil.loft` |
| **P2** | drop the guard → terrain lands in a dressing layer and reads back absent | `tests/stencil.loft` |
| **P2** | compact the merge → survivors slide into the dressing slot | `tests/stencil.loft` |
| **S1** | two chunks, **different bases**, one ridge → equal `H` from both sides | their stored `s` must **differ**, or the test is vacuous |
| **R1** | author terrain at `ρ − 1` → `CW_RESERVE` | author at `ρ` → accepted; **excavate** below `ρ` → accepted |
| **I1** | relabel one layer of a neighbouring chunk → the gate fires on the crossing match | leave labels agreeing → silent; set both to `0` → silent, since unlabelled is unconstrained |
| **I3** | allocate a thousand labels across many chunks → all distinct, `ν` monotonic | reuse a label for an unrelated layer → **I1** fires at the first seam where it matters |
| **T1** | write a layer → `τ` advances and `ver(λ)` equals it; a cache at the old clock reports stale | write nothing → `τ` unchanged and the cache stays valid |
| **T2** | write a dressing layer → a terrain cache over the same chunk stays valid | write the terrain layer → it goes stale |
| **I4** | force `ν` to its limit → the next layer is created unlabelled and says so | below the limit → labelled normally |
| **X1** | write at `cx = 2³¹` → `CW_EXTENT` | `cx = 2³¹ − 1` → accepted |
| **X2** | open twice for writing, write from the first → `CW_CONCURRENT` | one writer → silent |
| **M1** | apply two disjoint-column edit sets in both orders → **worlds** identical | make them share a column → order matters, and the gate says so |
| **M2** | read a chunk while a write to it is in flight → the value is wholly old or wholly new | never a mix of both |
| **X3** | churn a world for many edit cycles → file size tracks LIVE data, not total writes | free slots are actually reused, not appended past |
| **X4** | **compact a world → every cache stays valid** | make one real edit → that cache, and only that one, goes stale |
| **X5** | kill the process mid-compaction → the world opens unchanged and complete | — |
| **D1** | terrain bit-identical with and without dressing | change a prop → still bit-identical |
| **D1** | create a dressing layer as terrain → `P2` fires on real content | `tests/dressing.loft` |
| **D1** | apply `F1` to dressing → two props one unit apart are refused | `tests/dressing.loft` |
| **D1** | a prop survives save and load, layer KIND included | `tests/dressing.loft` |
| **B1** | at every border hex, `|M| ≤ 1` | set `ε = 2θ` → a second candidate appears and the gate fires |
| **B3** | no two layers at `x` match one at `x'` | — |
| **C1** | world creation refuses `ε = 2θ` | `ε = 2θ + 1` accepted |

**The S1 control is the one to write carefully.** Asserting that two chunks agree on `H`
passes trivially when both bases happen to be equal; the control must force *different*
bases and confirm the stored values differ while the absolute ones agree. Otherwise the gate
proves nothing about windowing at all.

---

## Related

- [Editor ladder](EDITOR_LADDER.md) — the rungs built on this model
- [Editor substrate](EDITOR_SUBSTRATE.md) — the package family and its seams
- [Scene map](SCENE_MAP.md) — the scene model built on these cells
- [Data](DATA.md) — every data structure and where it lives
