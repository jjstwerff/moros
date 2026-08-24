# `B0p` — at what size is an octagon uniquely deducible from its cells?

**Written before the probe ran.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §2.5 rests on one
claim of the reporter's: *"we allow octagon towers too, **they are large enough for a unique
deduction of the octagon shape**."* That is [FORMAL_CORE](../../doc/claude/FORMAL_CORE.md) §6's
R1/R2 boundary, and a threshold is a number — so it can be measured or refuted.

## What is already known, and narrows the question

- **45° is not a lattice direction** (`tan 45° = 1` ⇒ `m/k = √3`, irrational), so an octagon's
  true faces are never `D` headings.
- **A regular octagon is not a `Form`** — law J closes a turtle cycle at `sum(turn) = 12`
  twelfths, and eight 45° turns need 1.5 twelfths each.
- ⚠ **But `rebuild_construct` does not read the true faces — it walks the CONVEX HULL of the
  rasterised cells** and asks `side_heading` per hull side. Hull vertices are lattice points, so
  the hull's sides *are* lattice directions. **Whether an octagon is deducible therefore depends
  on its rasterisation, not on its geometry**, and that is why this needs measuring rather than
  arguing.

## Predictions

| # | prediction | confidence | if wrong |
|---|---|---|---|
| **P1** | at radius 1–2 the octagon's cell set is **identical** to a disc's or a hexagon's — nothing to deduce | high | the threshold is lower than anyone feared and §2.5 is free |
| **P2** | there is a radius above which the octagon is distinct from **both** | medium | if it never separates, an octagon tower cannot be stored as cells at all and needs a description — which is the second authority §1 forbids |
| **P3** | `arc_is_disk` claims small octagons **are** discs | medium | it is stricter than expected, and a cheap discriminator exists |
| **P4** | `rebuild_construct` returns **R2 at every radius** — an octagon has eight hull sides and the admitted set is built from turtle forms | medium-low | if it returns R1, the hull rounds to a `Form` and the "octagon" recovered is a *different shape* that happens to rasterise the same — which is worse than R2, because it is confident |

⚠ **`P4` IS THE ONE THAT MATTERS AND ITS TWO FAILURE MODES ARE NOT SYMMETRIC.** R2 means *no
grammar form draws this* — honest, and it means an octagon needs a recogniser that does not exist.
R1 with a wrong form is a **plausible wrong answer**, which is what
[probe/l1](../l1/README.md) already caught `wall_read_run` doing for walls drawn off `D`.

## The controls — without them "unique" means nothing

1. **A disc must read as a disc.** `arc_is_disk` on an `arc_fill` of the same size must be true,
   or a false on the octagon says nothing about the octagon.
2. **A hexagon must be distinct from a disc.** If the library cannot already tell those two apart
   at radius `r`, it cannot be expected to place an octagon between them.
3. **The comparison is the library's own** — `field_digest` / `digest_eq`, which normalise over
   the 12 orientations. A hand-rolled cell-by-cell compare would call two rotations of one shape
   different.

## ⚠ What this probe has to build, and its absence is a finding

**There is no cell fill by arbitrary surfaces in the family.** `arc_fill` fills a disc, `box_fill`
a box, `form_fill` a turtle form, `line_hexes` a line — and `cut_arb` cuts **edges** against a
`Surfaces` set, never cells. So an octagon footprint has no library fill today, and this probe
filters a disc by eight half-planes using `hex_edge::surf_distance` — the library's own predicate,
the same one `cut_arb` uses internally.

⚠ **That filter is the probe's and must not become the editor's.** If `B0p` says an octagon tower
is viable, *the fill belongs upstream* beside `arc_fill`, not in `lib/hex_editor`.
