# `20` — Verticality last: terrain that carries what is built on it

**Issue:** [`jjstwerff/moros#20`](https://github.com/jjstwerff/moros/issues/20) ·
**Value:** `G` · **Effort:** `H`

## Status

`A1`, `A1b`, `A2`, `A2c`'s **along** half and `A7` are **shipped**. `A2b`, `A2c`'s **across**
half, `A3`, `A4`, `A5` and `A8` are designed and not built.

⚠ **THE SHIPPED RULES LIVE IN [TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md), NOT HERE.**
Everything a reader needs about how the ground moves — the rigid-body rule, what counts as
fabric, the enclosure, the slope table, the settle, the measured costs and the order-divergence
table — moved there as each phase landed. This file keeps only what is still *a change we
intend to make*. A plan must not be the last home of a durable fact.

⚠ **This is an ORDERING claim, not a feature list.** It is finished when terrain is the *last*
authoring step rather than the first, and that is only true when every earlier step survives it.

## Goal

Raising, lowering and levelling terrain carry everything already built on it, obey a slope
limit that belongs to the surface rather than to the gesture, and turn into rock where that
limit cannot be met.

⚠ **PLAN 21 OWNS WHAT A BYTE MEANS.** [#21](https://github.com/jjstwerff/moros/issues/21)'s
`R1`/`R2` shipped, so these rules already hang off a NAME resolved through the world's palette
rather than off a constant. What remains is that a world declaring no palette still falls back
to the built-in numbering.

## Anchors

| | |
|---|---|
| **the rules, as built** | [TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md) |
| the model they write into | [WORLD_MODEL.md](../../doc/claude/WORLD_MODEL.md) |
| what a byte means | [plan 21](../21-region-mappings/README.md) |
| the gesture | `lib/hex_editor/src/gesture.loft` |
| the measurements | `probe/house/` |
| cut-and-fill that already exists | `hex_editor::footprint_seat` / `seat_residual` — a house footprint already balances one |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A1`** — a building rides the terrain rigidly | M | `tests/raise_structure.loft`, `raise_keeps.loft` | ✅ `cab574d` |
| **`A1b`** — ground a structure encloses is part of it | S | a fenced yard comes up level with its fence | ✅ `bfc4784` |
| **`A2`** — a slope limit per surface | M | `tests/slope_limit.loft` + `hex_mesh/tests/terrain_link.loft` | ✅ `db871b6` |
| **`A2c`** — a linear run bends ALONG itself | MH | `tests/run_slope.loft` | ◐ along shipped `4f43a79`; **across not built** |
| **`A7`** — the limit is the world's, not one gesture's | MH | `tests/slope_limit.loft`'s four settle claims | ✅ `0743c1a` |
| **`A8`** — a road balances its cut against a fill, and may carry a wall below | MH | volume: the spoil cut equals the fill placed, within a stated tolerance. ⚠ **Acceptance is a PICTURE** — *does a road read as natural* | Open |
| **`A2b`** — sub-surface runs take a slope, not a lift | M | a corridor keeps its cover within a band and its gradient within its limit | Open |
| **`A3`** — the same limits on plain hill creation | S | today's hill gated **byte-identical** on grass; other rows differ | Open |
| **`A4`** — recursion: a pad constrains the ground below it | MH | two buildings on one slope, monotonic ground between them | Open |
| **`A5`** — rock faces where the limit breaks | MH | a face appears exactly where the limit cannot be met, and nowhere else | Blocked on `A4` |

## Invariant gate — for the phases still open

Terrain height is an **exact integer** field (one unit is 0.25 wu), so none of this may be
argued from a picture.

| Phase | Concrete expected result | Invariant it pins | Negative control |
|---|---|---|---|
| `A8` | over one settled road, the volume removed above the grade equals the volume added below it, within a stated tolerance | *spoil is conserved: a cutting makes its own embankment* | a road on **flat** ground must cut nothing and fill nothing — a balance that moves earth where none was needed is not a balance |
| `A2b` | a raise of 6 over a corridor leaves its cover between a floor and a ceiling, and no segment steeper than its limit | *a corridor's cover is bounded and its gradient limited* | a corridor under a BUILDING must still move **rigidly** — it is that house's cellar, not a run |
| `A2c` across | a two-cell-wide road crossed by a stroke comes out with **zero** cross-fall | *a run has an AXIS; its limit is not a scalar* | a road cell with no road neighbour has no axis — it falls back to the scalar limit, not to flat |
| `A3` | the plain raise over open grass is **byte-identical** to today's | *the grass row IS the current behaviour* | any other surface must differ, or the table is decorative |
| `A4` | two buildings on one slope each end level, and the ground between them is monotonic | *relaxation terminates and never re-steepens a settled edge* | the iteration cap being hit is a **refusal**, not a silent stop |
| `A5` | where the limit cannot be met the column carries a face rather than a slope | *a face is a surface, not an absence* | a slope that fits its limit must **never** become a face |

⚠ **`A8`'s ACCEPTANCE IS NOT ITS INVARIANT.** *"This will make the roads look more natural to
human eyes"* — so the volume balance is what makes it **correct**, and whether it **works** is a
cold-recognition test: render a road across a slope and hand over the picture. This tree has the
scar: `A8.3`'s door passed every count and read as a hole for four days, and the verdict was
delivered twice against the wrong object before anyone zoomed in. Shoot the road ALONE, and
zoom to the cutting before saying it reads.

## Open questions

1. **How much of the spoil goes back?** *"The builders had a lot of materials over after
   cutting into the hill, using it to heighten the lower side a bit"* — and *"most of it will
   still be cutting into the hill"*. So the fill is real but secondary, and `A8` needs a number
   or a rule: all of it until the grade is met, a fixed fraction, or whatever the cut yields
   capped by the road's own limit on the low side. ⚠ `footprint_seat`/`seat_residual` already
   balance a cut against a fill for a house footprint — the arithmetic exists and the policy
   does not.
2. **Is the retaining wall geometry or dressing?** *"Often using stones to create a wall below
   the road."* A wall below a road is an EDGE material on the downhill cells, which the model
   already has — so the question is whether `A8` stamps one, and on which side, rather than
   whether it can.
3. **What does a corridor hold constant — its cover, or its gradient?** They fight: a fixed
   cover under a new hill means climbing at the hill's slope, which may break the corridor's
   limit. Provisional reading of *"the same treatment as a road"*: the **gradient wins** and
   the cover floats between a floor and a ceiling. Decided by `A2b`.
4. **What happens when the cover runs out?** A corridor that would surface is the underground
   case of `A5`. ⚠ The only place in this plan where a broken limit has a *gameplay* meaning
   rather than a visual one — a corridor open to the sky is a way in.
5. **How is a run's AXIS derived, given it is not stored?** A cell knows it is a road, or that
   it carries a wall edge; it does not know which way the run goes. ⚠ That makes the limit a
   property of an **edge** rather than of a cell — a different shape from what `A2` shipped.
   See TERRAIN_EDITS §T3 for why the naive version collapses runs.
6. **Does `A4` need a real relaxation, or is one pass enough?** Decided by building the
   one-pass version and measuring where it disagrees with itself.
7. **Should the pad extend past the building?** A real terrace has an apron; today the pad is
   exactly the fabric, so the ground steps at the wall. The limits may answer it — a step is an
   edge, and an edge has a limit.

## Closure record

**Nothing was dropped.** Every shipped phase's findings, numbers and traps moved to
[TERRAIN_EDITS.md](../../doc/claude/TERRAIN_EDITS.md) — §T1 the repaint, §T2 the rigid body and
the enclosure, §T3 the run, §T4 the slope table, §T5 the settle, plus the order-divergence
table, the measured costs and the traps that cost real time. This file went **352 lines → ~120**,
and the doc is where a reader who has never heard of a phase number will look.
