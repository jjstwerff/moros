# What the registry holds, what we use, and what we are re-deriving

**Written 2026-08-29, from the catalogue rather than from memory** — after a session spent
refuting three cut rules, building a cyclic minimum and costing it to the millisecond against
a question `hex_recover::rebuild_construct` already answered exactly, for free, published, and
gated upstream at 119/119. `CLAUDE.md`'s working rule now says *search before you design*;
**this file is that search, done once, so the next person does not have to.**

⚠ **RE-RUN IT RATHER THAN TRUST IT.** `.loft/api/_available.api` is the whole installable
catalogue and `loft api <name>` prints any package's surface. Every claim below is a grep away
from being re-checked, and *`OPEN: 0` is a claim to re-measure, not a fact*
([NOTATION](NOTATION.md)).

## The scoreboard

| | |
|---|---|
| packages in the registry | **42** |
| the `hex_*` family | **14** |
| …that we depend on | **9** — `hex_draw` `hex_edge` `hex_field` `hex_form` `hex_grid` `hex_place` `hex_shape` `hex_way` `hex_body` |
| ⛔ …that we do not | **5** — `hex_recover` `hex_fit` `hex_roof` `hex_terrain` `hex_world` |
| upstream rules (`@HB-X<n>`) | **70** |
| ⛔ …that this tree cites | **27** — `python3 tools/citations.py list` |

## ⛔ The five unused `hex_*`, in order of the evidence

### 1 · `hex_recover` — *"Rebuild a model from the field — exactly, or with a reported residual"*

⛔ **PROVEN, NOT PROPOSED.** [`probe/b5`](../../probe/b5/README.md): `rebuild_construct`
describes **25 of 25** rooms with `ρ = 0` and **zero `run_edges`**, where the best rule we
built over the marks is exact on 14 of 25 at 363 … 4834 calls each. It takes the region's
convex hull, reads the side headings, builds the form and **verifies by re-drawing**.

Also holds `hull_keys`, `field_digest`/`field_exact`/`field_norm` (three digests that answer
different questions — `@HB-X40`), `forms_upto`, `index_build`/`rebuild_indexed` (`@HB-X44`).
**Tags: `@HB-X45` (cited), `@HB-X40` `@HB-X41` `@HB-X42` `@HB-X43` `@HB-X44` (not).**

### 2 · `hex_fit` — *"The doorstep — refuse at authoring time what would not round-trip"*

⛔ **THE STRONGEST UNEXAMINED CANDIDATE, AND OUR OWN DOCKET ALREADY ASKED FOR IT.**
`tools/dups.tsv`'s `@HB-X68` row says, in its own words: *"One doorstep contract carried by two
structs — `hex_editor::Fit` and `hex_part::SocketFit` — … **A shared type needs a package below
both**, and the name `Fit` has already collided across this graph. A THIRD carrier makes this
`one`."* **`hex_fit` is that package**, published, with `fit_reason(code)` and the `FIT_*` code
set.

| what it offers | what we do instead |
|---|---|
| `seat_fits` · `seat_fit_z` · `seat_fit_residual` · `HEIGHT_SCALE` · `height_units` | ⛔ **`@HB-X67` prices [EDITOR_DEFECTS 3](EDITOR_DEFECTS.md)**: `SEAT_MEAN` lands exactly half a unit off and must be *refused with an offer*. **`seat_fit_z` IS that offer** |
| `feature_grid` · `feature_fits` · `feature_fit_t` · `feature_fit_residual` | our `opening_fits_in` / `opening_in_back` / `opening_cuts` — an opening's position on a side |
| `arc_fits` · `arc_fit_n` · `arc_fit_residual` | four hand-rolled refusals around `hex_shape::arc_shells_upto` |
| `mat_fits` · `MAT_MAX` | `fit_nominal`'s material range |

**Tags: `@HB-X48` (a feature's position is exact only at the edge centres — *and it never
fragments the run*), `@HB-X65` (the doorstep is COMPLETE — it accepts exactly what recovers),
`@HB-X66` (⚠ *a doorstep that refuses more than the field distinguishes is worse than none*),
`@HB-X5` (refusal, not rounding). None cited here.**

### 3 · `hex_roof` — profiles as a height field, **and the fit that recovers them**

We have twelve `roof_*` functions in `hex_editor.loft` — `roof_plan_of`, `roof_face_normal`,
`roof_soffit_drop`, `roof_point_*` — and **no recovery at all**. `hex_roof` ships
`roof_plane_fit`, `roof_cone_fit`, `roof_dome_fit`, `roof_match`, `roof_eval`, plus
`roof_ponds` and `eave_spread` (does the roof drain, does the eave overhang).
✅ **It is already a transitive dependency** through `hex_draw`, so naming it costs no new
package. **Tags: `@HB-X22` (roof recovery exists and is GATED — `roofmatch`), `@HB-X16` (⚠ *a
graph is not a field and cannot be fitted like one*). Neither cited.**

### 4 · `hex_terrain` — the OVERLAND layer

`terrain_hydrology`, `terrain_fbm`, `terrain_ridge_at`, `terrain_surface_at`,
`terrain_blend_h`, `terrain_relief_pass`. Our overland map is `moros_map` plus
`html/hex-map-editor.html`. **This is the Moros side, not lavition** — lower priority, but it
is a whole generated-landscape layer we do not use. **Tag: `@HB-X15` — *the Map↔`hex_field`
round trip is lossy, and its test is green for the wrong reason*. Not cited, and it is about
our own map.**

### 5 · `hex_world` — ✅ **deliberately not used, leave it**

`hex_voxel` is ours and unpublished; `lib/hex_editor/loft.toml` records why at length, and
plan 19 `L6.2` renamed the store so the two no longer answer to one name.

## Outside the family — where a second look is owed

| package | what it says | the overlap here |
|---|---|---|
| **`input`** | *"action/axis bindings resolved to per-tick input state"* | ⚠ **`keymap.loft` + `verb.loft`** — *a key names a verb, the binding is data, edited in-engine and written to disk*. That is this package's sentence |
| **`gridmesh`** | *"chunk-local mesh-generation primitives"* — `seg_mesh_new`, `emit_segment`, `chunk_of`, `field_new` | `hex_mesh` is our chunk mesher. ⚠ **`@HB-X18` names `gridmesh` by hand** as the batched-mesh pipeline, *one VBO per render-group* |
| **`tween`** | eleven easing curves in exact integer time | the camera's eased solve (`boom_take`) is ours |
| **`fixstep`** | a fixed simulation step in exact integer time — clock, bank, one-shot timer | the tick clock and `w_tau` |
| **`shapes`** | 2D `Rect`/`Circle`/overlap | `lavition_ui` declares **no dependencies** and does rectangles and hit-testing |
| **`text2d`** · **`stage`** · **`zttext`** | a built-in face and metrics · a retained 2-D scene · a text engine | `lavition_ui`'s `font`, `panel`, `widgets`, `render` |

## ⛔ The uncited rules that bear on live problems

**43 of 70 are uncited.** These are the ones that would have changed work already done:

| tag | what it says | where it bites |
|---|---|---|
| **`@HB-X35`** | **a hex region's boundary is ONE CLOSED LOOP and never pinches** — `ends = 0`, `branches = 0`, `loops = 1` | ⛔ this is `B4x`/`B4y` in one line: a **region's** boundary is always a clean loop, which is exactly why the cell path works and the mark path is hard |
| **`@HB-X50`** | **a continuous model parameter must be quantised to what the field distinguishes** — measured three times upstream, landing identically | ⛔ `octagon.loft` **re-derived this by hand**: *27 shells to 1008 give 23 distinct octagons* |
| **`@HB-X48`** | a feature's position is exact only at the edge centres, and it never fragments the run | every opening gesture |
| **`@HB-X32`** | a wall is the boundary between two half-planes — the edges separating a cell on one side from one on the other | `run_edges`' own rule |
| **`@HB-X34`** | **`shoelace(boundary) = 12 × cells` is an IDENTITY**, holes included | a free invariant for any region reader |
| **`@HB-X28`** | a hex has edges on three lines only — 30°, 90°, 150° | the sawtooth every wall reader meets |
| **`@HB-X66`** | a doorstep that refuses more than the field distinguishes is **worse than none** | every refusal we have written |
| **`@HB-X23`** | props are **derived** from the architecture plus a seed — *a village furnishes itself* | our `Props` and the `furnish` script |

## What we actually call, routine by routine — measured 2026-08-29

`tools/callmap.py` — public routines per library against the ones our production sources
(`lib/*/src`, `src/`) call, counting **qualified and bare names alike**.

| library | public | used | call sites | notable unused |
|---|---:|---:|---:|---|
| `hex_field` | 79 | **34** | 330 | `cell_rot` `cell_mirror` `corner_k` `corner_m` |
| `hex_grid` | 19 | **9** | 257 | `cell_canon_edge` `cell_corner_px` `cell_distance` |
| `hex_shape` | 71 | **28** | 97 | `arc_recover_centre` `arc_door_edges` `arc_shell_max` |
| `hex_form` | 53 | **12** | 75 | ⛔ **`boundary_ends` `boundary_branches` `boundary_loops`** |
| `hex_way` | 20 | **12** | 61 | `cut_arb` `track_arc` `seg_curvature` |
| `hex_edge` | 39 | **9** | 25 | `apply_features` `edge_block_arb` `edge_block_full` |
| `hex_body` | 28 | **10** | 20 | `bone_obb` `bone_planar` `frame_point` |
| `hex_draw` | 23 | **3** | 3 | ⛔ **`draw_walls`** `draw_floor` `draw_roof` `feature_find` |
| `hex_place` | 17 | **3** | 3 | ⛔ **`combine_cut`** `combine_cut_level` `arb_owner` |
| `hex_recover` | 33 | **1** | 1 | `rebuild` `hull_keys` `field_digest` `index_build` |
| `hex_fit` | 27 | **3** | 4 | ✅ adopted at `B7` — `arc_fits` `arc_fit_n` for the shell offer, `height_units_at` for the grade |
| `hex_roof` · `hex_terrain` | 35 | **0** | 0 | all of them |

⛔ **AND THE FIRST VERSION OF THIS TABLE WAS BLIND.** It grepped `hex_x::name` and reported
`hex_field` at **9** routines and `hex_place` at **0**. A wildcard `use hex_field;` imports
every public name **bare**, so a qualified grep sees none of them — `hex_field` is really 34
routines over 330 sites, and `hex_place` really is called, three times. ⚠ **This tree already
knew**: `CLAUDE.md` records the identical miss for `moros_render` — *"unaliased, so its 42
sites are bare names and no `moros_render::` grep sees one of them"*. The instrument has to
match a name it knows is there before its zero is believed.

### ⛔ The three rows worth acting on

**`hex_form::boundary_ends` / `boundary_branches` / `boundary_loops`** — this is **`@HB-X35`**
as three callable functions over a `HexSet`: *a hex region's boundary is one closed loop and
never pinches*. `probe/b4x`, `probe/b4y` and `probe/b5` each hand-rolled their own
vertex-degree tally to ask a piece of it. ✅ **Now called** — `region.loft`'s
`test_the_region_is_one_closed_loop`. ⚠ **`loops == 2` is a HOLE**, which the region reader
would otherwise describe without noticing.

**`hex_draw::draw_walls`** — [WALL_PUSH](WALL_PUSH.md) names it as the definition of `∂`:
*"the definition stays `hex_draw::draw_walls`' and is compared against, never copied."* We
cite it and do not call it; `push_cell` and now `claim_region` each write their own boundary
loop.

⛔ **`hex_place::combine_cut` — AND THIS ROW WAS THE WRONG SHAPE.** It sat here beside
`draw_walls` as if both were duplications. They are not:
[`probe/c1`](../../probe/c1/README.md) measured it, and **the primitive has no caller because
the CAPABILITY is missing**, not because we re-derive it. Nothing in this tree adds a
same-level box to a structure — `storey` is a different LEVEL (and `combine_cut_level` exists
so two levels never fuse), an `annex` is a balcony off a wall run — ⚠ **and the guard is NOT the problem**: `D2b` refuses
exactly when two roofs would meet and allows exactly when they would not, measured at nine
separations. An earlier version of this row said it over-refused, from a probe that compared
FOOTPRINT overlap against a guard about ROOFS.

⚠ **AND WIRING IT WOULD ANSWER A QUESTION THAT IS NOT OURS**: `@HB-X52` makes two adjacent
boxes **fuse**, so *hall or room* belongs upstream. For two houses a person means as two
buildings, the seam our stamping leaves is **correct**. The measurement stands either way —
apart, the two agree exactly at 76 edges; touching, `combine_cut` fuses an 18-edge seam.

## ⚠ And a library that needs fixing is EDITED, not ticketed

**"You are as much as anyone the editor of libraries — fix the ones that need fixing even if
you did not create it."** (project owner, 2026-08-29.) `CLAUDE.md` already said the same in
other words — *fixing and republishing a shared library is allowed too* — and the first
instinct here was still to file a ticket against a defect this tree had **measured**.

✅ **First one done, end to end**: `hex_fit`'s height quantum is a parameter — published as
**0.1.1**, [registry#27](https://github.com/loft-lang/registry/pull/27) merged, index
re-signed, and the lock moved. `hex_editor::freeze_grade` delegates to it and `probe/k3d`'s 46
scripts are byte-identical.

⛔ **AND THE MERGE BROKE THE REGISTRY UNTIL IT WAS RE-SIGNED.** The signature covers
`index.json`; changing it without `index.json.sig` makes every `loft install` fail,
un-bypassably. The re-sign is `scripts/registry-sign.sh --expect <pkg>@<ver>` — **the
agent-safe path, which checks the diff rather than accepting a typed yes.** Publishing is four
steps, not three: release, registry PR, merge, **re-sign**.

⚠ **`../loft` remains READ + FILE TICKETS**, and `../hexbody` remains read-only. The editable
ones are the `loft-libs-*` repos.

## The order of work this suggests

0. ✅ **`hex_recover` — DONE.** `region_recover_claimed` in `hex_editor`, asked by
   `plan_describe` after the Box reader gives up, drawn as `<polygon class='region'>` and
   claimed by `claim_region`. `lib/hex_editor/tests/region.loft` (6) +
   `lib/hex_mesh/tests/planview.loft` (3, including *is it called*).
1. ⛔ **`hex_form`'s boundary trio** — `@HB-X35`, one test now; the reader itself should
   refuse a region whose boundary is not one loop.
2. ⛔ **`hex_fit`** — resolves the `@HB-X68` docket row, pays `@HB-X67`/EDITOR_DEFECTS 3, and
   replaces four hand-rolled refusals. It is a *doorstep* package, so adopting it changes
   messages and baselines: expect the corpus to move and read `@HB-X66` first.
3. **`hex_roof`'s recovery half** — already a transitive dep, and the blueprint wants it.
4. Read **`@HB-X35`**, **`@HB-X50`**, **`@HB-X34`** before the next geometry step.
5. `input`, `gridmesh`, `hex_terrain` — real overlaps, none of them blocking.
