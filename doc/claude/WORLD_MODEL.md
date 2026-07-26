# The world model

How a Moros landscape is represented, stored and addressed.

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
disposable**. The second half is the one that decays quietly: the moment some fact has a
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
- **Heights are windowed.** A stored height is a `u16` measured from its chunk's base, which
  decouples the cell's height width from how tall the world is. *(Under review — see the
  plan's open decision on whether a global `u16` makes the window unnecessary.)*
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

**Heights are absolute in memory and relative on disk.** The window is a storage encoding
that never leaves the storage layer: one addition on read, one subtraction on write.

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
| `s_λ(x) ∈ [0, 2¹⁶)` | the **stored** height — relative to `b_K`, meaningless alone |
| `m_λ(x) ∈ [0, 2⁸)` | the material index |
| `H_λ(x) = b_K + s_λ(x)` | the **absolute** height, for `κ(x) = K` |
| `ρ ∈ ℕ` | **floor reserve** — a world constant; terrain may not be authored below it |
| `ε ∈ ℕ` | **headroom** — a world constant |
| `θ ∈ ℕ` | **match tolerance** — a world constant; the largest step read as continuous |

```
occ_λ(x)  ⟺  m_λ(x) ≠ 0                       occupied iff the material is not absence
col_K(x)  =  ⟨ i : k(λᵢ) = T ∧ occ_{λᵢ}(x) ⟩   the column at x, in chunk-index order
```

`col_K(x)` contains **terrain layers only**. No rule below quantifies over dressing.

## 2. The objects

**A world** is a partial map `ℤ² ⇀ chunks`, plus `(ε, θ)` and a palette. A chunk absent from
the map does not exist; it is not an empty chunk (**E1**).

**A chunk** `K = (b_K, Λ_K)`.

**A terrain layer** is a *total function* on `X_K`: all 1024 hexes have a cell.

**A dressing layer** is a *finite multiset* of placements over `X_K` — explicitly not a
function on hexes. Its contents are specified by
[#14](https://github.com/jjstwerff/moros/issues/14); this contract constrains only that it
exists, has a kind, and is excluded from every rule about columns, folding and collision.

## 3. Invariants

A world satisfying **F1**, **W1**, **E1** and **S1** is *well-formed*. The routine must
never produce one that is not, and must refuse rather than try.

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

### S1 — The window never escapes storage

> Every comparison, difference or ordering of heights is performed on `H`, never on `s`.
> `s` appears only inside chunk encode and decode.

This is why `Column` carries no base field: a value that has lost its chunk cannot be
un-windowed, so the type never holds one.

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

### D1 — Dressing is inert

> Dressing layers are excluded from `col_K`, from **F1**, and from every collision query.
> Adding, removing or altering one leaves every terrain layer bit-identical.

## 4. The border contract

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

## 5. Refusals, mapped to what they protect

Every refusal names what it refused and leaves the world unchanged.

| refusal | protects | condition |
|---|---|---|
| `CW_FOLD` | **F1** | a write would bring some consecutive pair closer than `ε` |
| `CW_WINDOW` | **W1** | `max H − min H ≥ 2¹⁶` after the write; no base exists |
| `CW_RESERVE` | **R1** | terrain would be authored below `ρ` |
| `CW_LAYER_CAP` | §2 | the chunk would hold more than 64 layers |
| world refused at creation | **C1** | `ε ≤ 2θ` |
| torn chunk | — | CRC mismatch: that chunk is refused, the rest opens |

**Rebase is not a refusal.** When a write leaves the window but the span still fits,
`b_K := min H` and every stored layer of `K` is re-encoded. **W1** guarantees this succeeds
whenever any base would.

## 6. What this contract does not constrain

Stated so the silence is deliberate:

- **Layer indices across chunks.** `λ₃` in `K` and `λ₃` in `K'` are unrelated.
- **Chunk bases.** `b_K` and `b_{K'}` are independent; **S1** makes them irrelevant to every
  comparison.
- **Layer kinds per chunk.** Any chunk may hold any mix of `T` and `D` in any order.
- **Dressing contents.** [#14](https://github.com/jjstwerff/moros/issues/14).
- **Whether a surface continues at all.** A partial matching is the intended answer.

## 7. Gates — one per rule

A rule with no gate that has been **seen red** is a claim, not a contract.

| rule | gate | control |
|---|---|---|
| **F1** | raise a layer to within `ε` of the one above → `CW_FOLD`, world unchanged | raise to exactly `ε` → accepted |
| **F1′** | non-consecutive pairs also separated, over a random column | — |
| **W1** | every stored `s` in range after any write, including after rebase | force a span ≥ 2¹⁶ → `CW_WINDOW` |
| **E1** | zero a layer's last cell → it leaves the file; reads unchanged | — |
| **S1** | two chunks, **different bases**, one ridge → equal `H` from both sides | their stored `s` must **differ**, or the test is vacuous |
| **R1** | author terrain at `ρ − 1` → `CW_RESERVE` | author at `ρ` → accepted; **excavate** below `ρ` → accepted |
| **D1** | terrain bit-identical with and without dressing | change a prop → still bit-identical |
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
