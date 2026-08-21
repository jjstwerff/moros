# `24` — One authority: no session record, walls straight from the store, one mesh per chunk

**Issue:** [`jjstwerff/moros#24`](https://github.com/jjstwerff/moros/issues/24) ·
**Value:** `S` · **Effort:** `H` *(this plan; no single phase above `M`)*

## Status

**Designed, nothing built.** The editor keeps a **second authority**: `EditSession` holds
shapes the store also holds, in a different form. Both reach the mesher, so **every wall is
drawn twice** — once hugging the hex lattice, once straight; only the store is saved, so **a
reload deletes one of the two copies**; and nothing caches per chunk, so **a single key press
re-meshes 49 tiles × 11 surfaces**. Those are not three defects. They are one fact, seen three
times — [EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md) has the evidence for each.

## Goal

The mesher takes the **store and nothing else**, interprets a wall as the straight run it is,
emits no hex-edge wall geometry anywhere, and keeps exactly one derived thing: a mesh per chunk,
invalidated by that chunk's own version.

## Anchors

- [EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md) — the five symptoms and the decision
- [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) — *the store is the only authority,
  everything else is derived, writes go in place*. This plan is that sentence enforced
- `lib/hex_voxel/src/hex_voxel.loft:54` — `StoredHex`, and its three `u8` edge bytes
- `lib/hex_mesh/src/hex_mesh.loft` — `emit_wall_panel` `:1151`, `emit_run_wall` `:1261`, and
  the chunk loop at `:1934` that runs both
- `lib/hex_editor/src/gesture.loft:637` — the comment that explains how the pair got here
- `lib/hex_editor/src/hex_editor.loft` — `run_wall`, whose **inverse** `A1` builds

## The safety spine — the record we are deleting is the ORACLE for what replaces it

⚠ **Read this before the phase table; it is what makes the steps small.** `es_runs` holds the
author's exact line. The recovery pass has to produce that line from the edges the line stamped.
**So the thing being deleted is the exact answer the new code is graded against** — and it stays
in the tree until the grading is green over every scene the gates already build.

That is [plans/README](../README.md)'s *parallel run*, and it is available at every phase up to
`A6`. **Nothing here is a swap-and-look.** The order below is chosen so that the first step
whose result cannot be compared to the old one (`A5`, where the hex geometry disappears from the
picture) happens **after** the replacement has been proved equal on every scene in the suite.

## Invariant gate

Exact-invariant work — this is geometry and a round trip, not an open space.

| phase | concrete expected result | invariant it pins | negative control |
|---|---|---|---|
| `A0p` | a run at heading `k` (k = 0…23), stamped to edges and recovered, returns heading `k` | **stamp → recover = identity on heading** | a chain that is NOT straight must be refused, not fitted to a line |
| `A1` | a 6-cell straight run recovers one segment, with both ends within one lattice step | one chain → **one** segment | an L-bend returns **two** segments, never one averaged through the corner |
| `A2` | for every gate scene, recovered runs == `es_runs` up to the endpoint tolerance `A0p` measured | the record is redundant | a scene where they differ is a **finding**, not a tolerance to widen |
| `A3` | the mesh from recovered runs is byte-identical to the mesh from `es_runs` | the substitution is invisible | sabotage the recovery by one lattice step — the byte comparison must go red |
| `A5` | the wall surface's triangle count **halves** | no hex-edge geometry survives | a scene with no walls must still emit zero, not a negative delta |
| `A6` | cache on and cache off produce identical meshes | the cache is a cache | ⚠ a **stale** cache must be caught — and it keys a correct world, so the instrument is the **mesh**, never the world key |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A0p`** — probe: is a straight run recoverable from its own edge stamp, at all 24 headings? | XS | `probe/a0p` — stamp a run at each heading, recover, compare heading and endpoints. **Prints the worst endpoint error**, which is the number `A2`'s tolerance is set from | Open |
| **`A1`** — the recovery pass as pure functions, with tests | M | `lib/hex_editor/tests/recover.loft` — straight runs at 24 headings, an L-bend, a ring, a one-edge stub, a gap. Fixtures whose answer is known by construction, never by calling the recovery twice | Blocked on `A0p` |
| **`A2`** — grade the recovery against every wall the gates already build | S | a harness that, for each gate scene, compares recovered runs to `es_runs`. ⚠ **It must FIND something first** — run it with the recovery deliberately off by one step and see the divergences it reports, before trusting a clean run | Blocked on `A1` |
| **`A3`** — mesher emits from recovered runs, `es_runs` path still present | M | the two meshes compared **byte for byte**, both paths live, switchable | Blocked on `A2` |
| **`A4`** — the switch: recovered runs become the mesher's input | S | every gate green, and `A3`'s comparison still runs beside it | Blocked on `A3` |
| **`A5`** — delete `emit_wall_panel`; no hex-edge wall geometry anywhere | S | ⚠ **the first visible change.** Triangle count on the wall surface, plus a screenshot pair. A named-surface check cannot see this — `probe/b2`'s `E2` already reads `grass,wall` and would read it either way | Blocked on `A4` |
| **`A6`** — one mesh per chunk, keyed on the chunk's version | M | cache-on vs cache-off meshes identical; a **stale-cache sabotage** must go red | Blocked on `A5` |
| **`A7`** — delete `es_runs` and `es_awalls` | S | the suite, with nothing left feeding the old path. ⚠ Deletion is the step: if it compiles and the gates are green, the record was redundant, which is `A2`'s claim cashed | Blocked on `A6` |
| **`A8`** — the same arc for `es_open` (openings) | M | as `A1`–`A7`, one field | Blocked on `A7` |
| **`A9`** — …for `es_roofs` | M | ⚠ and correct the comment in `editor_server.loft` that argues the opposite — *"the drawn shape is the PLAN's, so the renderer needs the plan rather than the cells"* — where it sits | Blocked on `A8` |
| **`A10`** — …for `es_annex`, `es_slabs`, `es_holes`, `es_props`, one at a time | MH | one comparison each, the shape `A2` established | Blocked on `A9` |

⚠ **`A8`–`A10` ARE NOT COPIES OF `A1`–`A7`, and pretending they are is how this plan goes
wrong.** A wall's edge byte already exists in the store; **a roof plan's does not.** Each of
those fields needs its own answer to *what does the store hold, and is it enough to recover the
shape* — which is why they are separate phases and why `A9` may turn out to need a store change
that `A7` did not.

## What is NOT in this plan

- **`es_draft`, `es_trunk`, `es_open_kind`, `es_author` stay.** They are the **gesture in
  flight**, not a record — what the editor is doing right now, meaningless once the stroke ends.
  ⚠ Calling them a session record is what makes them look deletable; they are not.
- **`es_leaves` — how far a door stands open — is out of scope and unanswered.**
  `editor_server.loft` states the problem: *"a door's ANGLE is not in the world — the store says
  an edge is a door, which is the boundary's business, and how far it stands open is the
  fitting's."* It is not derivable from the store and it is not a cache. See open question 2.
- **The character (`EDITOR_DEFECTS` entry 2) and the house floor (entry 3).** Independent of
  this plan; do not fold them in.

## Open questions

1. **What endpoint error is acceptable?** The author's stroke is continuous; the store quantised
   it. A recovered wall's ends land at the chain's ends, up to a lattice step from where they
   were drawn — so *what you drew* and *what comes back* differ. **`A0p` measures the worst
   case; the number decides whether this design ships as-is.** ⚠ If it is unacceptable, the
   alternative is that the store carries the heading — and an edge byte is a full `u8` material
   index with no spare bits, so that is a record change, not a tweak.
2. **Where does a door's angle live?** Not the store, not a mesh cache. Decided by whichever
   phase first needs an open door drawn — not by this plan, which says only that it must not go
   back into a session record.
3. **Does the recovery run per chunk or per world?** A run crosses chunk boundaries, so a
   per-chunk recovery sees a truncated chain and may fit a different line at the seam. ⚠ **This
   is the one design risk `A0p` does not cover** — its fixtures are single-chunk. `A1`'s ring
   fixture must straddle a boundary, or `A3`'s byte comparison will be the thing that finds it.
