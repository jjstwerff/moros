# `24` — One authority: no session record, walls straight from the store, one mesh per chunk

**Issue:** [`jjstwerff/moros#24`](https://github.com/jjstwerff/moros/issues/24) ·
**Value:** `S` · **Effort:** `H` *(this plan; no single phase above `MH`)*

## Status

**`A0p` ran, broke the ground rule twice, and that is what reshaped the plan.** The editor keeps
a **second authority**: `EditSession` holds shapes the store also holds, in a different form.
Both reach the mesher, so **every wall is drawn twice**; only the store is saved, so **a reload
deletes one of the two copies**; and nothing caches per chunk, so **a key press re-meshes 49
tiles × 11 surfaces**. Evidence for each:
[EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md).

## Goal

The mesher takes the **store and nothing else**, interprets a wall as the straight run it is,
emits no hex-edge wall geometry anywhere, and keeps exactly one derived thing: a mesh per chunk,
invalidated by that chunk's own version. **Every algorithm it uses comes from a library.**

## ⛔ The ground rule, and what it already cost this plan

> **We make a universal editor, but the algorithms are never our own — and never in floats.**

`A0p` had to recover a wall's line from the hex edges it stamped. It was attempted twice and
**both attempts invented geometry**:

| attempt | what it did | result |
|---|---|---|
| 1 | fitted a principal axis through edge midpoints, in floats | 19 of 24 headings, five wrong by **10.458°** against a 15° quantiser |
| 2 | copied `hex_draw::surface_of`'s integer body into the probe *"with the `Plan` taken out"*, and invented a fold to replace the ordering the `Plan` had provided | **8 of 24 — worse than the float fit it was correcting**, `surface_heading` = `-1` on 22 of 24 |

⚠ **Neither is evidence about `hex_draw`, because `hex_draw` was never called.** A due-east wall
summed to `(-14, 0)`: the edge vectors **cancelled**, because `surface_of` walks a plan's side
**in reading order** and a scan of the store has no order at all.

✅ **And the misdiagnosis is what located the real gap.** It looked like *we need a line-fitting
algorithm*. We do not — the arithmetic exists and is exact. What is missing is **an entry point
that accepts what the store holds** (an unordered set of marked edges) and **the ordered
chain-walk** that turns it into the `SideRun` `surface_of` already consumes. Both are library
work. [probe/a0p](../../probe/a0p/README.md) keeps the record.

## Anchors — the libraries this plan CONSUMES

⚠ **Read this before writing a line of geometry.** Most of what this plan needs already exists,
exactly and in integers.

| library | what it already does |
|---|---|
| **`hex_draw`** `hexsurf.loft` | `surface_of` → `WallSurface` (summed edge vectors + mean midpoint, **exact integers**); `surface_heading` (which of 12, by zero cross product, `-1` if none); `surface_span` (the ends); `surface_quad` (the drawn band); `surface_miter` (two sides meeting); `BAND_SIDES`/`BAND_TOPS`/`WIDEN_*` — exact band constants in `Q(sqrt3)` |
| **`hex_edge`** | `Surfaces` — straight **and arc** (`surf_straight`, `surf_arc`), `surf_distance`/`surf_normal`/`surf_param`/`surf_point`; `Features` — spans along a surface (**an opening is one**); `Junctions` with `junction_g0` continuity; `EdgeSet`, `edge_point`, `edge_block_surf` |
| **`hex_form`** | `Plan`, `SideRun`, `side_edges`; **`HEAD_N = 12`** and integer `head_step` in doubled coordinates; `head_is_edge` |
| **`hex_field`** | `lattice_k/m`, `corner_k/m` — the exact doubled-coordinate lattice |
| **`hex_way`** | `Track` (straight **and arc**), `track_offset`, `way_surfaces`, `way_stamp`, `seg_curvature` |
| **`hex_recover`** | `rebuild` / `rebuild_construct` — a closed **Form** from filled cells. ⚠ Areas, not open chains: the house-footprint recovery, not the wall-run one |

- [EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md) — the symptoms and the decision
- [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — *the store is the only authority*
- `lib/hex_voxel/src/hex_voxel.loft:54` — `StoredHex` and its three `u8` edge bytes
- `lib/hex_mesh/src/hex_mesh.loft` — `emit_wall_panel` `:1151`, `emit_run_wall` `:1261`, chunk loop `:1934`
- `lib/hex_editor/src/gesture.loft:637` — the comment explaining how the double-draw got here

⚠ **`loft-libs-world` is a SHARED WORKING TREE.** A new public name there can turn a sibling's
build red with no local edit — **grep it before adding one**, and land library work as its own
change gated by loft's `library-ci-reusable.yml`.

## ⚠ 24 headings are not representable, and that is ours

`hex_editor::HEADINGS = 24` with `WALL_SNAP = 2π/24` and an `atan2` is **an invented float
algorithm already in the tree**. `hex_form::HEAD_N = 12` with integer `head_step` is the
library's, exact, at 30° — even headings the edge neighbours, odd the vertex directions.

**15° is not representable on this lattice.** `tan 15° = 2 − √3`, and a lattice direction has
`tan θ = m/(k√3)`, so `m/k = 2√3 − 3` — irrational. **No integer `(dk, dm)` gives it.**

⚠ **So the editor can snap a wall to a direction the lattice cannot express, and no exact
recovery of such a wall can exist.** That is a root cause, not a detail, and `H1` sits ahead of
the recovery work because of it.

## The safety spine — the record we delete is the ORACLE for what replaces it

`es_runs` holds the author's exact line, so **the thing being deleted grades its own
replacement**, and it stays in the tree until the grading is green over every scene the gates
already build. That keeps every step a parallel run. The first step whose result cannot be
compared to the old one is `A5`, where the hex geometry leaves the picture — placed **after**
the replacement is proved equal everywhere.

## Invariant gate

Exact-invariant work, and **exact means integers**: a tolerance in a verify cell below is a sign
the wrong thing is being measured.

| phase | concrete expected result | invariant | negative control |
|---|---|---|---|
| `A0q` | `surface_of` on a plan side returns `surface_heading >= 0` for every side of every rotation | the library is exact **on input it accepts** | a deliberately bent side must return `-1` |
| `H1` | a wall laid at any admitted heading has `surface_heading >= 0` | every drawable wall is representable | a 15° request must be **refused or snapped**, never stored |
| `L1` | chain-walk + `surface_of` recovers the stamped heading **exactly**, all 12 | stamp → recover = identity, in integers | an unordered input must not silently produce a cancelled sum — `(-14, 0)` for a due-east wall is the case to refuse |
| `A3` | mesh from recovered runs **byte-identical** to mesh from `es_runs` | substitution is invisible | sabotage the recovery by one lattice step — the byte comparison goes red |
| `A5` | the wall surface's triangle count **halves** | no hex-edge geometry survives | a scene with no walls emits zero, not a negative delta |
| `A6` | cache on and cache off produce identical meshes | the cache is a cache | ⚠ a **stale** cache keys a correct world — the instrument is the **mesh**, never the world key |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A0p`** — probe: is a wall recoverable from its edge stamp? | XS | [result](../../probe/a0p/README.md) | ✅ **Done — and it broke the ground rule twice.** Its value is the located gap, not its numbers |
| **`A0q`** — probe: **call `hex_draw`**, on input it accepts | XS | build a `Plan` + `HexSet`, call `surface_of`, assert `surface_heading >= 0` on every side of every rotation. ⚠ **The control `A0p` never ran** — nothing yet has asked the library to do this on its own terms | Open |
| **`H1`** — the headings: `hex_form`'s 12 exact, instead of our 24 | M | every gate green with the snap delegating to `head_step`; a wall's stored direction is an exact lattice vector. ⚠ Parallel run: keep the 24-way answer beside the 12-way one and compare what each STORES | Blocked on `A0q` |
| **`L1`** — the library gap, in `loft-libs-world` | M | the ordered chain-walk over an `EdgeSet`, and a `surface_of` entry taking the chain. Tests **there**, on fixtures exact by construction. ⚠ Grep the sibling before adding a public name | Blocked on `H1` |
| **`A3`** — mesher emits from recovered runs, `es_runs` path still present | M | the two meshes compared **byte for byte**, both paths live | Blocked on `L1` |
| **`A4`** — the switch | S | every gate green, `A3`'s comparison still running beside it | Blocked on `A3` |
| **`A5`** — delete `emit_wall_panel` | S | ⚠ **the first visible change.** Triangle count on the wall surface, plus a screenshot pair. A named-surface check cannot see this — `probe/b2`'s `E2` reads `grass,wall` either way | Blocked on `A4` |
| **`M1`** — the chunk mesher moves INTO a library, on the exact geometry | MH | `hex_mesh`'s chunk→mesh path built from `hex_draw`'s bands and `hex_edge`'s surfaces rather than its own emitters. ⚠ Byte-identical meshes across the move, which is what makes it a refactor and not a rewrite | Blocked on `A5` |
| **`A6`** — one mesh per chunk, keyed on the chunk's version | M | cache-on vs cache-off identical; a **stale-cache sabotage** goes red | Blocked on `M1` |
| **`A7`** — delete `es_runs` and `es_awalls` | S | the suite, with nothing feeding the old path. Deletion **is** the step: if it compiles green, the record was redundant | Blocked on `A6` |
| **`A8`–`A10`** — the same arc for `es_open`, then `es_roofs`, then `es_annex`/`es_slabs`/`es_holes`/`es_props` | MH | one comparison each | Blocked on `A7` |

⚠ **`A8`–`A10` ARE NOT COPIES OF `A3`–`A7`.** A wall's edge byte already exists in the store; **a
roof plan's does not.** Each needs its own answer to *what does the store hold, and is it enough
to recover the shape* — `A9` may need a store change `A7` did not. And `hex_edge::Features` —
spans along a surface — is very likely what `es_open` becomes, which is a library that already
exists rather than a format to invent.

## What is NOT in this plan

- **`es_draft`, `es_trunk`, `es_open_kind`, `es_author` stay.** They are the **gesture in
  flight**, not a record — meaningless once the stroke ends. Calling them a session record is
  what makes them look deletable.
- **`es_leaves` — how far a door stands open — is out of scope and unanswered.** Not derivable
  from the store, not a cache. See open question 2.
- **The character and the house floor** ([EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md)
  entries 2 and 3). Independent; do not fold them in.

## Open questions

1. ◐ **What endpoint error is acceptable?** `A0p` measured a floor of `0.653` world units — but
   that came from an invented algorithm and **must be re-measured at `L1`** with the library's
   exact recovery. ⚠ The *shape* of the question survives: the store does not record where
   between two cells the author stopped, so some inward error is missing information rather than
   lost precision. It wants a picture before `A5` deletes the alternative.
2. **Where does a door's angle live?** Not the store, not a mesh cache. Decided by whichever
   phase first needs an open door drawn. `hex_edge::Features` is the candidate.
3. **Does the recovery run per chunk or per world?** A run crosses chunk boundaries, so a
   per-chunk recovery sees a truncated chain and may fit a different line at the seam. `L1`'s
   fixtures must straddle a boundary.
4. ⚠ **What does `H1` do to walls already stored at a non-representable heading?** There are
   worlds in `worlds/` and gate fixtures built with the 24-way snap. **A migration is a store
   change and this plan has been assuming there is none** — `H1` must answer it before `L1`
   depends on it.
