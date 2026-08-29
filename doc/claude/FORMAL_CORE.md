---
render_with_liquid: false
---
# The formal core — copied in, and NOT the authority

⛔ **THE AUTHORITY IS `hexbody/ROUNDTRIP.md` AND `hexbody/SPEC.md`**, at
`../hexbody/` — *"the settled formal core"*, and the workshop that gates the `hex_*` family
against an exact round trip. **This file is a snapshot of the clauses that bind lavition**,
taken **2026-08-22**, kept here so the editor's work can be anchored without reading 818 lines
of someone else's tree.

⚠ **A SECOND COPY DRIFTS. Treat every clause below as a POINTER, not as a fact you may edit.**
When one of these looks wrong, the answer is upstream — re-read `ROUNDTRIP.md` and update this
file; never correct a clause here and carry on.

⚠ **AND IT IS WHY THE GROUND RULE EXISTS.** Plan 24 spent two probes deriving §6.1 from scratch,
badly, while §6.1 sat here saying it — *"a wall surface is the exact AVERAGE of its edges, not a
fit"* — with a gate (`@HB-X47`) behind it. **Read this before writing geometry.**

---

## §1 — the lattice

`Λ = ℤ²`, **pointy-top, odd-r offset** `(q,r)` — *not axial*. Position map

```
π(q,r) = ( κ(q,r)·√3/2 , μ(q,r)/2 )     κ(q,r) = 2q + (r & 1)     μ(q,r) = 3r
```

`κ`/`μ` are `hex_field::lattice_k` / `lattice_m`. The `(r & 1)` is what makes it **offset**
rather than axial, and it **matches moros's convention** — crawler migrated to it deliberately.

```
60° rotation:  k' = (k − m)/2,  m' = (3k + m)/2        reflection:  k → −k
```

Both integral for every cell where `k ≡ m (mod 2)` — **which is where the 12 orientations come
from**, and why stencils rotate and reflect with no resampling and no drift.

## §2 — the three direction sets, and they are NOT interchangeable

| symbol | set | what it indexes |
|---|---|---|
| `O` | `{0..5} × {id, flip}`, `|O| = 12` | **orientations** — the lattice-exact poses a stencil is *placed* at |
| `H₁₂` | `≅ ℤ/12` | **headings** — the 12 directions a **stencil side** may run in, 30° apart |
| `D` | `⊂ Λ/±`, `|D| = 24` | **linework directions** — road, town wall, cliff |

⚠ **`|O| = |H₁₂| = 12` is a COINCIDENCE, not an identification.**

### §2.1 — `H₁₂` has two classes, with different step lengths

| class | `h` | lattice step | `‖step‖` | strip |
|---|---|---|---|---|
| **edge** | even | neighbour vector | `s` | zigzag, 2 axes |
| **vertex** | odd | corner vector | `s√3` | staircase, 3 axes |

The 6 rotations act by `h ↦ h + 2`, so **the two classes never mix.**

### §2.2 — two domains

| | **A · stencil** | **B · world linework** |
|---|---|---|
| what | house, tower, castle | road, town wall, cliff |
| authored | once, in a **local frame** | **directly in world coordinates** |
| direction from | its own shape; placement picks `o ∈ O` | the run itself, quantised to `d ∈ D` |

> **A stencil is placed at one of the 12 `o ∈ O`, never at one of the 24.** A road is never a
> stencil: it is drawn where it runs.

⚠ **AND THE EDITOR'S OWN SPLIT IS THIS ONE.** *"24 headings for walls, fences, rock-faces and
roads in the world — just not for houses, which should allow shorter walls"* is domain B against
domain A, stated from the consumer's side. `hex_form`/`hex_draw` are the **domain A** libraries,
which is why `hex_form::HEAD_N = 12` is correct there and is **not** a limitation to lift.

⚠ **`D` is CONTESTED upstream** (`OD-13`): the standing requirement is that the in-between 12
become first class, *"because a city/castle needs more directions to be believable"*. Read
§2.2's own note before depending on either side of it.

## §2.4.3 — the dirty unit is the chunk, and layer 2 is never persisted

> **32×32 chunks are not net-new.** The world is already held in memory as chunks, layer 2 is
> derived per chunk, and rendering draws everything in a chunk at once as separate meshes.
>
> **An edit dirties the chunks it touches, and their layer-2 meshes rebuild.** What still needs
> care is an edit on a **chunk boundary**, which dirties the neighbour too — a wall slot is owned
> by one cell but bounds two.
>
> **Layer 2 is `SPEC` L3's rule, generalised** — *derived on demand, **never persisted**, never a
> branch in a hot-path op*.
>
> **Consequence for `𝕋`.** The canonical text is **not** a second editor representation, and must
> not become one — **that is exactly the second layer the editor is not allowed to have.**

⚠ **THAT LAST CLAUSE IS PLAN 24'S DECISION, ALREADY NORMATIVE.** *"There should not be a session
record at all — just a cache of the meshes, one per chunk"* is `§2.4.3` restated. The plan is not
proposing an architecture; it is **paying a debt against one that is already written down.**

⚠ **Chunk seams are EXACTLY ZERO** (crawler's `I-SEAM`), by construction, not by tolerance. The
**frame** seam — a posed body against the world, law `K₁`/`I-FSEAM` — is the *only* place `ε > 0`
is permitted. Reading one for the other licenses cracks between chunks.

## §6 — two recovery regimes, and the trap

| regime | input | prior | recovery | residual |
|---|---|---|---|---|
| **R1 · grammar-guided** | a stencil **we authored** | the grammar constrains it to a finite set | **exact match**, integer | `ρ = 0` |
| **R2 · trace** | arbitrary cell-authored content | none | **fit**, with a pinned tolerance | `ρ > 0`, reported |

> **The trap:** using R2's machinery where R1 applies — **fitting a line to a stencil whose
> description we hold throws away an exact answer and reintroduces a tolerance nothing needs.**

⚠ **PLAN 24 `A0p` WALKED INTO THAT TRAP TWICE**, and it is named here in one sentence.

**R2's tolerance is a lattice constant, not a knob** — a boundary vertex is a hex corner, so it
sits at most one circumradius (**exactly 1.0 world unit**) from the true surface. Worst measured
residual on a straight wall: **0.81**.

### §6.1 — a wall surface is the exact AVERAGE of its edges, never a fit

| | |
|---|---|
| **direction** | `Σ` edge vectors — an **exact integer** vector in doubled coordinates |
| **position** | the mean of the edge midpoints — corners are integers in `(k,m)`, so a midpoint is a half-integer and the mean is an **exact rational** |
| **band** | the exact perpendicular extent of the strip — **not an error term** |

> **Nothing is fitted, so nothing has a tolerance.** Least-squares would introduce a residual to
> threshold, while an average of exact rationals **is** the answer.

Gated as **`@HB-X47`** (`hexbody/tests/surface.loft`): the summed edge vector is **exactly parallel**
to a heading (zero cross product) over all 24 side-runs across 6 rotations. ⚠ **Its control is
the number to remember** — the scatter a least-squares fit would threshold is `0` east and
`0.9167` north, *"so averaging vs fitting is measured, not rhetorical."*

### §6.2 — the band constants, exact in `ℚ(√3)`

| family | band `(u)` | band `(m)` |
|---|---|---|
| **tops** — 1 axis | `1/2` | `√3/4 ≈ 0.4330` |
| **sides** — 2 axes | `√3/2` | `3/4 = 0.7500` |
| ratio | `√3` exactly | |

Widening, applied so both walls present equally thick at the larger band:
`total = (√3−1)/2 u`, `per face = (√3−1)/4 u`. **The only adjustment in the model, and it is a
closed form** — nothing measured, fitted or tuned. These are `hex_draw::BAND_TOPS` /
`BAND_SIDES` / `WIDEN_TOTAL` / `WIDEN_FACE`.

## The gated results that bind the editor directly

| id | what it settles | why lavition cares |
|---|---|---|
| **`@HB-X31`** | **no odd multiple of 15° is reachable at all** | `hex_editor::WALL_SNAP = 2π/24` asks for directions that do not exist |
| **`@HB-X29`** | the in-between 12 of `D` are inexact by a **uniform bias**, `1.1021°` — spread `0.0000°`; the even 12 are exact | so **`D` is 12 exact + 12 uniformly biased**, not 24 exact. ⚠ **This is why a house is never drawn at an in-between angle** |
| **`@HB-X56`** | the in-between vector is `N = 39` `(7,−2)`, period `√39 u`; chosen for `δ = 0` so linework **links to house angles unconditionally** | the 24 are a *designed* set, not "every direction a short chain can reach" |
| **`@HB-X27`** | **the marks evaluate back to the SAWTOOTH, not the line** — the straight line is `rebuild`'s job | the store holds a zigzag by construction; recovery is a named map, not an afterthought |
| **`@HB-X47`** | the wall surface is the exact average of its edges | §6.1's gate |
| **`@HB-X24`** | **there is no square sublattice of a hexagonal lattice** — a lattice polygon cannot be a rectangle | `Plan` is continuous-then-rasterised; a rectangle's corner is quantised away |
| **`@HB-X36`** | **the side runs PARTITION the boundary — a corner edge is claimed exactly once.** `housedraw::side_edges` assigns every boundary edge to one side and the four runs sum to the boundary exactly: `5×4 → 38 = 9+10+9+10`, `4×4 → 38 = 11+8+11+8`, `6×4 → 46 = 11+12+11+12` | ⛔ **this is *recover the four walls of a room*, already solved and gated.** A session was spent re-deriving it as a chain walk and a minimum partition. **Read this row before writing a cut rule** |
| **`@HB-X45`** | **constructive recovery is exact for convex forms** — every admitted form is convex, every polygon vertex is a hex centre, so the **convex hull of the filled cells IS the polygon** and its vertices are the corners; no float enters, and it proposes then VERIFIES by re-drawing. **119/119 corpus entries, 0 diffs** — R1 with `ρ = 0`. **Limit: convex only** | a room's description comes from its **cells**, not from its marks — which is why `house_recover` reads the FLOOR and why a room built as four linework runs has no floor to read |
| **`@HB-X62`** | **the corner MITERS EXACTLY** — adjacent fitted surfaces differ by heading `3` or `9`, exactly 90°, in integer heading indices over all 12 orientations × 4 corners; intersecting the two mean lines closes the outline with a gap of **exactly 0** at all 48 corners | the corner is a solved object upstream. ⚠ **And `place_house` already enforces it at the doorstep** — *"a footprint at this facing has no mitred corners; turn one step"* — while the `wall` verb has no such refusal |
| **`@HB-X70`** | ⛔ **an opening is never "no wall"** — a door, a window and a real gap are all **materials on a wall that continues** | ⚠ **and it names a live moros defect**: `builtin_house_door` leaves the doorway edge at material `0`, its own comment calling that *"crawler's convention: a door is a gap"*. Measured: material 0 gives **36 edges / 2 dangling ends** where every real opening gives **38 / 0** — the wall is *broken* |
| **`@HB-X67`** | the height slot is an integer at `HEIGHT_SCALE = 0.25` wu, and the doorstep enforces it | ⚠ **prices [EDITOR_DEFECTS](EDITOR_DEFECTS.md) entry 3**: `SEAT_MEAN` lands **exactly half a unit off** (`1.125` = 4.5 units), so it must be **refused with an offer**, not truncated |

## ⛔ §7 — the two domains decide which of these applies, and getting it wrong is the whole trap

⚠ **`@HB-X29` NAMES IT IN A SUBORDINATE CLAUSE, AND IT IS THE MOST LOAD-BEARING SENTENCE IN THIS
FILE.** The in-between 12 of `D` carry a uniform bias, *"which is why a house is never drawn with
an in-between angle — they are **world linework** (`D`), **where nothing has to close or meet a
corner**."*

| | domain A — a **stencil** | domain B — **linework** |
|---|---|---|
| directions | `H₁₂` | `D`, `\|D\| = 24` |
| what it is | a house, a room, a tower — a **form** | a road, a fence, a wall run |
| must it close at a corner? | **yes** — `@HB-X36` partitions the boundary, `@HB-X62` miters it exactly | ⛔ **no, and the model says so** |
| how it is recovered | **R1, constructive and exact** from the CELLS — `@HB-X45`, 119/119, `ρ = 0` | R2, a trace over marks, with a residual |

⛔ **SO A ROOM BUILT AS FOUR `wall` RUNS IS A DOMAIN ERROR, NOT A BUG TO PATCH.** Measured
2026-08-29 over 25 rectangles: only 7 present as one closed chain, 17 carry a junction, and
**7 have a hole a flood escapes through** — every break at a corner, one hex edge wide.
⚠ **The stencil path refuses instead of leaking**: `place_house` answers *"a footprint at this
facing has no mitred corners; turn one step"* with a facing to use. **The wall verb has no such
doorstep**, which is the asymmetry to fix — not the reader that has to make sense of the result.

✅ **AND THE MEASUREMENT UNDER THAT SENTENCE WAS TAKEN — plan 26 `B4y`,
[`probe/b4y`](../../probe/b4y/README.md).** A rectangle **leaks exactly when a corner is a
GAP** (7 of 7, and 0 of the other 18) and is **described as more than four walls exactly when
a corner is a FORK** (17 of 17), with `drawn` equal to `marks` on all 25 — so the reader is
faithful in every case and the failure is in the field.

⛔ **`@HB-X36` IS BROKEN IN BOTH DIRECTIONS HERE, AND THE TWO ARE ONE FACT.** Two runs meeting
at a corner each decide their marks by projecting onto their **own** segment, so the corner
edge is claimed **twice** at 30 of 100 corners and **never** at 10 — and `twice-claimed`
equals `spurs` in every row, because the doubly-claimed edge **is** the spur.

✅ **The ADD half is built** — `hex_editor::wall_corner_close`, from `wall_stamp`: **7 of 25
leak → 0**, and 7 markings that are one closed chain → **23**. ⛔ **The DROP half is refuted
and must not be built**: removing the edge two runs both claim closes the topology and makes
the walls unrecoverable, because `run_edges` generates a run's whole field and no run
generates one with an edge taken out. ⚠ **None of this changes the domain** — a closed loop of
linework is still domain B, and `@HB-X36`, `@HB-X45` and `@HB-X62` remain rules about a
**form**. It makes a room that closes, not a room that is a stencil.

## How to re-sync this file

```sh
less ../hexbody/ROUNDTRIP.md      # §1, §2, §2.4.3, §6 are the binding ones
less ../hexbody/SPEC.md           # I-DOMAIN, I-FLIP, L13
```

⚠ **`../hexbody` is READ-ONLY from here.** It is the workshop that proves the family; findings
go to it as tickets, never as edits from this tree.
