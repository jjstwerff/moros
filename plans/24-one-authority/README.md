# `24` — One authority: no session record, walls straight from the store, one mesh per chunk

**Issue:** [`jjstwerff/moros#24`](https://github.com/jjstwerff/moros/issues/24) ·
**Value:** `S` · **Effort:** `H` *(this plan; no single phase above `M`)*

## Status

**`A0p` run and it refuted its own prediction; nothing else built.** The editor keeps a **second authority**: `EditSession` holds
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
| **`A0p`** — probe: is a straight run recoverable from its own edge stamp, at all 24 headings? | XS | `make probe-a0p` · [result](../../probe/a0p/README.md) | ✅ **Done 2026-08-21 — and it REFUTED its own prediction.** 19 of 24, five wrong by 10.46° against a 15° quantiser. The design survives; the obvious `A1` does not |
| **`A1`** — the recovery pass as pure functions, with tests | M | `lib/hex_editor/tests/recover.loft` — straight runs at 24 headings, an L-bend, a ring, a one-edge stub, a gap. Fixtures whose answer is known by construction, never by calling the recovery twice. ⚠ **And a LENGTH sweep**, because `A0p` found end effects dominate | **Ready** — `A0p` says what it must be, see below |
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

## ⚠ What `A0p` changed — `A1` is an INTERSECTION, not a fit

**[probe/a0p](../../probe/a0p/README.md) ran and refuted `P1`.** A principal-axis fit through
edge midpoints recovers 19 of 24 headings; the five that fail are the 60° family, wrong by
**10.458°** against a **15°** quantiser.

⚠ **AND ITS CONTROL IS WHAT MAKES THAT READ CORRECTLY.** A deliberate one-step rotation of the
fitted axis left **4 of 24 still matching** — so the fit's error is the same size as the step it
is resolving, and `19 of 24` is *a method at the wrong resolution*, not five edge cases to
polish. Without that control, `A1` would have been built on a fit and tuned until the count
reached 24, which is curve-fitting to a fixture.

**The information was never missing; the method discarded it.** A marked edge does not mean *the
line passed near this midpoint* — it means **the line CROSSES this edge**, which is exactly what
`wall_stamp`'s halfplane test decided. So `A1` is:

- each marked edge → a **constraint** on the line's two parameters;
- the satisfying set is a **convex region** in `(angle, offset)`;
- the recovery is that region's centre, and **its extent is the error bar** — which a fit cannot
  produce at all;
- an **empty** region means *not one straight line*, so the bend test comes free and **exact**,
  where `A0p`'s straightness ratio (0.452 bent against 0.000 straight — cleanly separable, but a
  threshold) is only good enough for a probe.

⚠ **AND THE END ERROR DOES NOT GO TO ZERO, HOWEVER GOOD THE RECOVERY IS.** `A0p` measured
**0.653 even on headings whose angle is perfect**. That is a quantisation floor: the store does
not record where between two cells the author stopped. It is [open question 1](#open-questions)'s
answer, and `A2`'s tolerance is set from it rather than tuned until it passes.

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

1. ◐ **What endpoint error is acceptable? — `A0p` measured it: a floor of `0.653` world units,
   worst `1.220`.** The author's stroke is continuous and the store quantised it, so the ends
   come back inside where they were drawn and **no recovery can fix that** — it is missing
   information, not lost precision. ⚠ **Still open, because it is now a JUDGEMENT and not a
   measurement**: is a wall whose ends move by ~0.65 acceptable? At `w_unit 0.25` that is under
   three height units, and a wall is drawn between cell boundaries anyway — but it must be
   looked at in a picture before `A5` deletes the alternative. If it is not acceptable, the
   store must carry the heading, and an edge byte is a full `u8` with no spare bits.
2. **Where does a door's angle live?** Not the store, not a mesh cache. Decided by whichever
   phase first needs an open door drawn — not by this plan, which says only that it must not go
   back into a session record.
3. **Does the recovery run per chunk or per world?** A run crosses chunk boundaries, so a
   per-chunk recovery sees a truncated chain and may fit a different line at the seam. ⚠ **This
   is the one design risk `A0p` does not cover** — its fixtures are single-chunk. `A1`'s ring
   fixture must straddle a boundary, or `A3`'s byte comparison will be the thing that finds it.
