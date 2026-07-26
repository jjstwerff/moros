# The world contract — normative

The formal statement of the layer/chunk model: the objects, the invariants that must hold
of any world, and the proofs that the border and folding contracts are the *same* contract.

**This is normative.** Where this document and any other disagree, this one is right.
Every rule is numbered so a gate, a refusal and a bug report can name the same thing.
It moves to `doc/claude/WORLD_MODEL.md` when V1 ships.

---

## 1. Notation

| symbol | meaning |
|---|---|
| `ℤ`, `ℕ` | integers, non-negative integers |
| `x = (q, r) ∈ ℤ²` | a hex, axial |
| `κ(x) = (⌊q/32⌋, ⌊r/32⌋)` | the chunk holding `x` — floor division, **not** truncation |
| `ℓ(x) = (q mod 32, r mod 32)` | position within that chunk, `mod` taking sign from the divisor |
| `K` | a chunk |
| `X_K = { x : κ(x) = K }` | its 1024 hexes |
| `b_K ∈ ℕ` | its **window base** — an absolute height |
| `Λ_K = ⟨λ₀ … λ_{n−1}⟩`, `n ≤ 64` | its layers, **an ordered sequence**; the index is a position in *this* chunk and has no meaning outside it |
| `k(λ) ∈ {T, D}` | layer kind: **T**errain or **D**ressing |
| `s_λ(x) ∈ [0, 2¹⁶)` | the **stored** height — relative to `b_K`, meaningless alone |
| `m_λ(x) ∈ [0, 2⁸)` | the material index |
| `H_λ(x) = b_K + s_λ(x)` | the **absolute** height. `κ(x) = K` |
| `ε ∈ ℕ` | **headroom** — a world constant |
| `θ ∈ ℕ` | **match tolerance** — a world constant; the largest step treated as continuous |

Two derived predicates:

```
occ_λ(x)  ⟺  m_λ(x) ≠ 0                      a cell is occupied iff its material is not absence
col_K(x)  =  ⟨ i : k(λᵢ) = T ∧ occ_{λᵢ}(x) ⟩  the column at x, in chunk-index order
```

`col_K(x)` contains **terrain layers only**. Dressing is not in any column and no rule
below quantifies over it.

---

## 2. The objects

**A world** is a partial map from `ℤ²` to chunks, plus `(ε, θ)` and a palette.
A chunk absent from the map is not a special empty chunk; it does not exist (§4, **E1**).

**A chunk** `K = (b_K, Λ_K)`.

**A terrain layer** is a total function on `X_K`: every one of the 1024 hexes has a cell,
`⟨s, m, …⟩`, seven integers, eight bytes.

**A dressing layer** is a finite multiset of placements over `X_K`. It is *not* a function
on hexes: a hex may carry zero, one or many, and that is the sheet-not-slot rule. Its
contents are specified by [#14](../14-props-dressing/DESIGN.md), not here; this document
constrains only that it exists, has a kind, and is excluded from every rule about columns,
folding and collision.

---

## 3. The invariants

Normative. A world satisfying **F1**, **W1**, **E1** and **S1** is *well-formed*; the
routine must never produce one that is not, and must refuse rather than try.

### F1 — Fold-freedom *(the non-folding contract)*

> For every chunk `K`, every hex `x ∈ X_K`, and every pair `i < j` **consecutive** in
> `col_K(x)`:
>
> ```
>     H_{λⱼ}(x) − H_{λᵢ}(x)  ≥  ε
> ```

"Consecutive" means no occupied terrain layer lies between them in `col_K(x)`.

**Lemma F1′ (separation extends to all pairs).** For any `i < j` in `col_K(x)`, not only
consecutive ones, `H_{λⱼ}(x) − H_{λᵢ}(x) ≥ ε`.

*Proof.* The occupied layers between `i` and `j` form a chain `i = c₀ < c₁ < … < c_p = j`
of consecutive pairs, `p ≥ 1`. Each step contributes at least `ε` by **F1**, and all
contributions are positive, so the total is at least `pε ≥ ε`. ∎

**Corollary F1″ (order is height order).** `H` is strictly increasing along `col_K(x)`.
Layer order and vertical order can never disagree — which is what "the layers do not fold
through each other" *means*.

**F1 is checkable inside one chunk.** A column lies wholly within `X_K`, so **F1** never
reads a second chunk. It is not a seam rule and needs no cross-chunk agreement of any kind.

### W1 — Window containment

> ```
>     ∀ K, ∀ terrain λ ∈ Λ_K, ∀ x ∈ X_K :   0 ≤ H_λ(x) − b_K < 2¹⁶
> ```

Equivalently `b_K ≤ min H` and `max H < b_K + 2¹⁶` over the whole chunk. A chunk is
**representable** iff `max H − min H < 2¹⁶`; when it is, `b_K = min H` always satisfies
**W1**, so a rebase can always succeed if any base can.

### E1 — Absence has one representation

> 1. A terrain layer with `occ_λ(x)` false for all `x` is **not stored**.
> 2. A chunk with `Λ_K = ⟨⟩` is **not in the directory**.
> 3. Reading an absent layer or chunk yields exactly what reading a stored all-zero one
>    would.

(3) is what makes (1) and (2) sound rather than lossy, and it is the clause a round-trip
test cannot check — see P4–P6.

### S1 — The window never escapes storage

> Every comparison, difference or ordering of heights is performed on `H`, never on `s`.
> `s` appears only inside chunk encode and decode.

**S1** is why `Column` (DESIGN §2) carries no base field: a value that has lost its chunk
cannot be un-windowed, so the type simply never holds one.

### D1 — Dressing is inert

> Dressing layers are excluded from `col_K`, from **F1**, and from every collision query.
> Adding, removing or altering a dressing layer leaves every terrain layer bit-identical.

---

## 4. The border contract

Let `K ≠ K'` be chunks, `x ∈ X_K` and `x' ∈ X_{K'}` adjacent hexes across their shared
border. For a height `h`, the **match** from `h` into `K'` at `x'` is

```
    M_{K'}(x', h)  =  { j ∈ col_{K'}(x')  :  | H_{λⱼ}(x') − h | ≤ θ }
```

Continuity is *computed*, never stored: there is no shared name, id or index, and layer
indices in `K` and `K'` are unrelated.

### B1 — Match uniqueness *(the alignment contract)*

> ```
>     | M_{K'}(x', h) |  ≤  1        for every x', h
> ```

### The theorem that makes one constant do both jobs

> **Theorem.** If **F1** holds in `K'` and `ε > 2θ`, then **B1** holds.

*Proof.* Suppose `i ≠ j` are both in `M_{K'}(x', h)`; take `i < j`. Then
`|H_{λᵢ}(x') − h| ≤ θ` and `|H_{λⱼ}(x') − h| ≤ θ`, so by the triangle inequality

```
    H_{λⱼ}(x') − H_{λᵢ}(x')  ≤  2θ  <  ε
```

But `i < j` in `col_{K'}(x')`, so Lemma **F1′** gives `H_{λⱼ}(x') − H_{λᵢ}(x') ≥ ε`.
Contradiction. Hence `|M| ≤ 1`. ∎

**This is the load-bearing result of the whole design.** Seam alignment is not a second
mechanism needing its own bookkeeping — it is a *consequence* of the invariant that already
stops layers folding, provided one inequality on two constants holds. Ambiguity at a border
is impossible by construction, not resolved by a tie-break.

### B2 — Reciprocity

> `j ∈ M_{K'}(x', H_{λᵢ}(x))` ⟺ `i ∈ M_K(x, H_{λⱼ}(x'))`.

*Proof.* Both sides are the condition `|H_{λⱼ}(x') − H_{λᵢ}(x)| ≤ θ`, which is symmetric. ∎

### B3 — The match is a partial injection

> Distinct layers at `x` never match one layer at `x'`.

*Proof.* If `i ≠ i'` at `x` both matched `j` at `x'`, then
`|H_{λᵢ}(x) − H_{λᵢ′}(x)| ≤ 2θ < ε`, contradicting **F1′** in `K`. ∎

So across any border the correspondence is a **partial matching**: every surface continues
to at most one surface, is continued by at most one, and *may continue to none* — which is
correct and required, because a floor that meets a wall stops.

### The constant constraint

> ```
>     ε  >  2θ
> ```

**This is the only inequality relating the two world constants, and it must be checked at
world creation, not assumed.** Physically it is comfortable: `ε` is standing headroom and
`θ` is the largest step read as continuous, so `ε > 2θ` says a storey is more than twice a
step — true of any building. A world violating it is refused before it is written, because
**B1** silently fails otherwise and the failure appears as intermittently wrong geometry at
chunk borders.

---

## 5. Refusals, mapped to the invariant each protects

Every refusal names what it refused and leaves the world unchanged.

| refusal | protects | condition |
|---|---|---|
| `CW_FOLD` | **F1** | a write would make some consecutive pair closer than `ε` |
| `CW_WINDOW` | **W1** | `max H − min H ≥ 2¹⁶` for the chunk after the write; no base exists |
| `CW_LAYER_CAP` | §2 | the chunk would hold more than 64 layers |
| world refused at creation | **B1** | `ε ≤ 2θ` |
| torn chunk | — | CRC mismatch; that chunk is refused, the rest opens |

**Rebase is not a refusal.** When a write leaves the window but the span still fits,
`b_K := min H` and every stored layer of `K` is re-encoded. **W1** guarantees this succeeds
whenever any base would.

---

## 6. What this contract does NOT constrain

Stated so the silence is deliberate rather than an oversight:

- **Layer indices across chunks.** `λ₃` in `K` and `λ₃` in `K'` are unrelated. There is no
  world-wide layer list, no id, and no rule that adjacent chunks hold comparable counts.
- **Chunk bases.** `b_K` and `b_{K'}` are independent. **S1** makes them irrelevant to every
  comparison.
- **Layer kinds per chunk.** Any chunk may hold any mix of `T` and `D` layers in any order.
- **Dressing contents.** [#14](../14-props-dressing/DESIGN.md).
- **Whether a surface continues at all.** A partial matching is the intended answer; a floor
  ending at a border is a floor that ends.

---

## 7. Gates — one per rule

A rule with no gate that has been **seen red** is a claim, not a contract.

| rule | gate | control |
|---|---|---|
| **F1** | raise a layer to within `ε` of the one above → `CW_FOLD`, world unchanged | raise to `ε` exactly → accepted |
| **F1′** | non-consecutive pairs also separated, over a random column | — |
| **W1** | every stored `s` in range after any write, including after rebase | force a span ≥ 2¹⁶ → `CW_WINDOW` |
| **E1** | zero a layer's last cell → it leaves the file; reads unchanged | — |
| **S1** | two chunks with different bases, one ridge → equal `H` from both sides | equal `s` from both sides must **differ**, or the test is vacuous |
| **D1** | terrain bit-identical with and without dressing | change a prop → still bit-identical |
| **B1** | at every border hex, `|M| ≤ 1` | set `ε = 2θ` → a second candidate appears and the gate fires |
| **B3** | no two layers at `x` match one at `x'` | — |
| `ε > 2θ` | world creation refuses `ε = 2θ` | `ε = 2θ + 1` accepted |

**The `S1` control is the one to write carefully.** Asserting that two chunks agree on `H`
passes trivially if both bases happen to be equal; the control must force *different* bases
and confirm the stored values differ while the absolute ones agree. Otherwise the gate
proves nothing about windowing at all.
