# `24` — One authority: no session record, walls straight from the store, one mesh per chunk

**Issue:** [`jjstwerff/moros#24`](https://github.com/jjstwerff/moros/issues/24) ·
**Value:** `S` · **Effort:** `H` *(this plan; no single phase above `MH`)*

## Status

⛔ **THIS PLAN IS NOT PROPOSING AN ARCHITECTURE. IT IS PAYING A DEBT AGAINST ONE THAT IS ALREADY
NORMATIVE** — [FORMAL_CORE.md](../../doc/claude/FORMAL_CORE.md), the binding extract of
`hexbody/ROUNDTRIP.md`. Both of this plan's "decisions" are written there and gated:

| this plan says | the formal core already says | gate |
|---|---|---|
| walls draw straight, recovered from the store | **§6.1** *a wall surface is the exact **AVERAGE** of its edges, never a fit* | `X47` |
| no session record; one mesh per chunk | **§2.4.3** *the canonical text is not a second editor representation, and must not become one — that is exactly the second layer the editor is not allowed to have*; layer 2 is *derived on demand, **never persisted***, and *an edit dirties the chunks it touches, and their layer-2 meshes rebuild* | `SPEC` L3 |

**Nothing built.** The symptoms are in
[EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md); the work is to make the editor obey a
model it has been diverging from.

## Goal

The mesher takes the **store and nothing else**, recovers a wall by §6.1's average, emits no
hex-edge wall geometry, and keeps exactly one derived thing: a mesh per chunk, invalidated by
that chunk's own version. **Every algorithm comes from a library.**

## ⛔ The ground rule, and what ignoring the formal core cost

> **We make a universal editor, but the algorithms are never our own — and never in floats.**

`A0p` tried to recover a wall's line from the edges it stamped, **twice**, while §6.1 sat
upstream saying how:

| attempt | what it did | result |
|---|---|---|
| 1 | fitted a principal axis through edge midpoints, in floats | 19 of 24, five wrong by **10.458°** |
| 2 | copied `surface_of`'s integer body *"with the `Plan` taken out"*, inventing a fold to replace the ordering the `Plan` provided | **8 of 24 — worse**, `surface_heading` = `-1` on 22 of 24 |
| 3 | *"so use `hex_form`'s 12 headings"* | ⛔ **also wrong** — `H₁₂` and `D` are different sets for different **domains**, not coarse and fine versions of one |

⚠ **§6 NAMES THE TRAP IN ONE SENTENCE**: *"using R2's machinery where R1 applies — fitting a line
to a stencil whose description we hold throws away an exact answer and reintroduces a tolerance
nothing needs."* ⚠ **And guessing the replacement is the same error as guessing the algorithm** —
attempt 3 was a measured enumeration that looked like `D` and was not.

## Anchors

- ⛔ [FORMAL_CORE.md](../../doc/claude/FORMAL_CORE.md) — **read first.** §1 the lattice, §2.2 the
  two domains, §2.4.3 the chunk, §6/§6.1/§6.2 recovery and the bands
- [EDITOR_DEFECTS.md](../../doc/claude/EDITOR_DEFECTS.md) — the symptoms
- `hex_draw` `surface_of` / `surface_heading` / `surface_span` / `surface_quad` / `surface_miter`
  / `BAND_*` · `hex_edge` `Surfaces` (straight **and arc**), `Features`, `Junctions` ·
  `hex_form` `Plan`, `SideRun`, `head_step` · `hex_recover` `rebuild` · `hex_field` the lattice
- `lib/hex_voxel/src/hex_voxel.loft:54` — `StoredHex`, three `u8` edge bytes
- `lib/hex_mesh/src/hex_mesh.loft` — `emit_wall_panel` `:1151`, `emit_run_wall` `:1261`, `:1934`

⚠ **`loft-libs-world` is a SHARED WORKING TREE** — grep before adding a public name.
⚠ **`../hexbody` is READ-ONLY** — findings go there as tickets, never as edits from here.

## The two domains decide the headings — §2.2

| | **A · stencil** | **B · world linework** |
|---|---|---|
| what | house, tower, castle | **wall, fence, rock-face, road** |
| directions | `H₁₂`, 12 at 30° | `D`, `|D| = 24` |
| library | `hex_form` / `hex_draw` | `hex_way` / `hex_edge` |

**That is the reporter's rule, from the other side**: *"24 headings for walls, fences,
rock-faces and roads in the world — just not for houses, which should allow shorter walls."*
`hex_form::HEAD_N = 12` is **correct for domain A** and is not a limitation to lift.

⚠ **`D` IS NOT 24 EXACT DIRECTIONS.** `X31`: *no odd multiple of 15° is reachable at all.*
`X29`: the in-between 12 carry a **uniform** `1.1021°` bias, spread `0.0000°`; the even 12 are
exact. `X56`: the in-between vector is `(7,−2)`, `N = 39`, chosen so `δ = 0` — an exhaustive
search over `N ≤ 400` found nothing better. **So `D` is adopted, never derived here.**

⚠ **AND `hex_editor::WALL_SNAP = 2π/24` ASKS FOR DIRECTIONS THAT DO NOT EXIST**, which is why
`H1` sits ahead of the recovery work.

## Invariant gate

Exact-invariant work. **`ρ = 0` is the target, not a tolerance** — §6.1's whole claim is that an
average of exact rationals *is* the answer.

| phase | expected result | invariant | negative control |
|---|---|---|---|
| `A0q` | `surface_of` on a plan side gives `surface_heading >= 0`, every side, every rotation | §6.1 / `X47`, re-measured **in this tree** | a bent side must give `-1` |
| `H1` | every stored wall direction is a `d ∈ D` | §2.2 | a request off `D` is snapped or refused, never stored |
| `L1` | recovery of a stamped run returns the run's own `d`, exactly | §6.1, `ρ = 0` | ⚠ an **unordered** input must be refused, not silently summed — `(-14, 0)` for a due-east wall is the case |
| `A3` | mesh from recovered runs **byte-identical** to mesh from `es_runs` | substitution is invisible | sabotage by one lattice step → red |
| `A5` | wall-surface triangle count **halves** | no hex-edge geometry survives | a scene with no walls emits zero |
| `A6` | cache on == cache off | §2.4.3, layer 2 | ⚠ a **stale** cache keys a correct world — the instrument is the **mesh**. And an edit on a **chunk boundary must dirty the neighbour**: a wall slot is owned by one cell and bounds two |

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`A0p`** — probe: recover a wall from its edge stamp | XS | [result](../../probe/a0p/README.md) | ✅ **Done, and it broke the ground rule twice.** Value: the located gap |
| **`A0q`** — probe: **call `hex_draw`** on input it accepts | XS | `Plan` + `HexSet` → `surface_of` → `surface_heading >= 0`, every side, every rotation. ⚠ **The control nothing has run** — `X47` gates this upstream; this re-measures it **here**, which is where the consumer lives | Open |
| **`H1`** — adopt `D`; delete `WALL_SNAP` | M | every gate green with the snap delegating to the library's `D`. ⚠ Parallel run: keep the 2π/24 answer beside `D`'s and compare what each **stores** | Blocked on `A0q` |
| **`L1`** — the library gap: recovery of **world linework** from the field | M | ⚠ **This is an upstream gap, not just a missing entry point.** §2.2's own note: *"`rebuild` returns the turtle form alone, so embedded linework would be silently dropped and `rt_trip` would not even notice."* `X27` says the straight line is *"`rebuild`'s job"*; `X55` measured one E–W world line recovering exactly (`eave_spread 0`). **Raise it with hexbody before building**, then land it in `loft-libs-world` with tests there | Blocked on `H1` |
| **`A3`** — mesher emits from recovered runs, `es_runs` still present | M | two meshes, byte for byte, both paths live | Blocked on `L1` |
| **`A4`** — the switch | S | every gate green, `A3`'s comparison still running | Blocked on `A3` |
| **`A5`** — delete `emit_wall_panel` | S | ⚠ **first visible change.** Triangle count + a screenshot pair. `probe/b2`'s `E2` reads `grass,wall` either way | Blocked on `A4` |
| **`M1`** — the chunk mesher into a library, on §6.2's exact bands | MH | `hex_mesh`'s chunk→mesh path built from `BAND_TOPS`/`BAND_SIDES`/`WIDEN_*` and `hex_edge`'s surfaces rather than its own emitters. ⚠ Byte-identical meshes across the move | Blocked on `A5` |
| **`A6`** — one mesh per chunk, keyed on the chunk's version | M | §2.4.3. Cache-on == cache-off; stale-cache sabotage red; **a boundary edit dirties both chunks** | Blocked on `M1` |
| **`A7`** — delete `es_runs`, `es_awalls` | S | the suite, nothing feeding the old path. Deletion **is** the step | Blocked on `A6` |
| **`A8`** — `es_open` → `hex_edge::Features` | M | ⚠ **`X70` first**: an opening is never *"no wall"* — a door, a window and a real gap are all **materials on a wall that continues**. moros's `builtin_house_door` leaves the edge at material `0`, measured to **break** the run (36 edges / 2 dangling ends against 38 / 0). Fix that before the format moves | Blocked on `A7` |
| **`A9`–`A10`** — `es_roofs`, then `es_annex`/`es_slabs`/`es_holes`/`es_props` | MH | one comparison each | Blocked on `A8` |

⚠ **`A8`–`A10` ARE NOT COPIES OF `A3`–`A7`.** A wall's edge byte exists in the store; **a roof
plan's does not.** Each needs its own answer to *what does the store hold, and is it enough* —
`A9` may need a store change `A7` did not.

## What is NOT in this plan

- **`es_draft`, `es_trunk`, `es_open_kind`, `es_author` stay** — the **gesture in flight**, not a
  record. Calling them a session record is what makes them look deletable.
- **`es_leaves`** — how far a door stands open. Not derivable from the store, not a cache.
  ⚠ §2.4.3 forbids it becoming a second representation, so it is a **pose**, not a record.
- **The character** ([EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) entry 2).
- **The house floor** (entry 3) — ⚠ **already priced upstream by `X67`**: the height slot is an
  integer at `HEIGHT_SCALE = 0.25` wu, and `SEAT_MEAN` lands **exactly half a unit off**
  (`1.125` = 4.5 units), so it must be **refused with an offer**, not truncated. That is the
  answer; it is a fix, not an investigation, and it does not belong in this plan.

## Open questions

1. **Does §6.1's average give the ENDS, or only the line?** Direction and position are exact
   rationals; where a run *stops* is a separate question the section does not settle. ⚠ **Ask
   upstream rather than measure** — `A0p`'s "0.653 endpoint floor" came from an invented fit and
   is not evidence about anything.
2. **Is world-linework recovery R1 or R2?** §6's regimes: R1 is exact with `ρ = 0`, R2 is a fit
   with a tolerance derived from the lattice (**1.0 wu**, worst measured **0.81**). A run
   authored through `wall_write` had a `d ∈ D`, but the store keeps only the marks — so which
   regime applies to a wall read back from the field decides whether `L1` is exact or tolerant.
3. **`OD-13` is contested upstream** — the standing requirement that the in-between 12 of `D`
   become *first class*, *"because a city/castle needs more directions to be believable."* `H1`
   must not be built in a way that forecloses it.
4. ⚠ **Do walls already stored need migrating?** They were snapped to a uniform 15° grid, which
   `X31` says is unreachable. Every world in `worlds/` and every gate fixture is affected. **A
   store migration is a store change and this plan has been assuming there is none.**
