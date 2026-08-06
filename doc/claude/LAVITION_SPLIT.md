<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# LAVITION_SPLIT — extracting the editor into its own project, and keeping the name out

**Status: designed 2026-08-06. `L1` and `L2` are BUILT; `L3` was refuted by its own probe and
replaced by `L3′`.** Plan [#19](https://github.com/jjstwerff/moros/issues/19) holds the steps and
the per-step record.

> **This file is written to be MOVED.** It carries its own definitions and depends on no Moros
> context, the same way [HEX_STACK.md](HEX_STACK.md) was written to travel. On the day the split
> lands it becomes the new project's `doc/HISTORY.md` — the record of why the boundary is where it
> is — and this copy is deleted rather than kept in two places.

---

## The one invariant

> **lavition must build, test AND GATE with the Moros tree absent.**

The extraction bar in [EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md) already says *"it builds and its
gates pass with the Moros tree absent"*. The word doing the work is **gates**, and it is the whole
difference between a real extraction and moving the easy half — see *The trap* below.

Four sites have to assert it, and the plan is ordered by them: the **packages** (already clean),
the **program**, the **gates**, and the **content** they drive.

---

## What was measured, 2026-08-06

Every row below was checked against the tree on that date, not recalled.

| | measured |
|---|---|
| lavition packages | `hex_world` 120 · `hex_editor` 235 · `hex_part` 254 · `lavition_ui` 65 · `glb_read` 4 = **678 tests**, green on both backends |
| their `moros_*` dependencies | **zero.** `hex_world`→nothing · `hex_editor`→registry `hex_*` + path `hex_world`/`hex_part` · `hex_part`→`hex_world`,`glb_read` · `lavition_ui`→nothing · `glb_read`→`mesh` |
| the `moros` name inside them | **41 mentions in 22 files, none of them code.** Prose, plus `boundary.loft`'s own guard text |
| where the `hex_*` family comes from | the **registry** at 0.1.0, diffed byte-identical to `../loft-libs-world`. The sibling working tree is **not** in the build |
| the editor program | `src/editor_server.loft` **8,283 lines**, `editor_client.loft` 1,823, `editor_run.loft` 162 |
| its Moros coupling | **`moros_terrain`, and nothing else** — 10 distinct symbols, 99 call sites — plus 3 unqualified calls from `moros_render`. ✅ `moros_terrain` is **`hex_mesh`** now (`L2`); the other three are the projection, not the lattice (`L3`) |
| the gates | **49 files, 39 of which dial `EDITOR_PORT`** and therefore need that program |
| the content | `data/parts/` 11 files, `tools/scripts/*.keys` 23 |

---

## The trap this design exists to avoid

**Moving the five packages alone would export the wrong half.** They are the fast, already-green,
dependency-clean part — 678 tests that pass in seconds. The 39 gates that drive a real server,
take real pictures, and catch what no unit test can would all stay behind in Moros, with a
cross-repo version bump newly in the middle of every change.

⚠ **The half that is hard to verify is the half worth having in its own CI.** A lavition whose CI
runs 678 green unit tests and zero pictures would look healthier than the tree it left and be
worth less.

So the program travels too, and the four blockers below are what stand in its way.

---

## The four blockers, in the order the facts force

### L1 — `Surface` is declared twice and the two have already merged

`hex_world::Surface` (line 400) and `moros_terrain::Surface` (`surfaces.loft` line 16). A loft
struct name is **global across a consumer's dependency graph**, so in `editor_server.loft` these
are already one struct: writing the literal fails with five *"Unknown field `Surface.sf_r`"*
errors that never mention a collision, and ⚠ **spelling it `moros_terrain::Surface` still resolves
to the other one** — the return type is accepted and the constructor is not.

It went unnoticed for months because every caller reads `surface_at(i).sf_r` and never names the
type.

⚠ **This is a hard blocker on publishing, not a tidy-up.** Two packages that both declare
`Surface` cannot both be dependencies of anything. **The only cure is a rename**, and it has to
happen before anything is published, because a published name cannot be taken back.

### L2 — `moros_terrain` is misnamed, by exactly the mechanism that hid `moros_ui`

Its entire public surface is universal hex meshing:

```
emit_tri · chunk_mesh_mat · chunk_mesh_mat_bounded · corner_heights · corner_heights_from
cell_normal_from · nrm · mesh_crc · grid_h · gh_at · tile_ready · tile_why · chunk_present
surface_at · surfaces · surface_count · surface_chroma · chroma_gap · classified
emit_hex_sloped · emit_ground_reveal · struct Surface · struct Chroma
```

Not one game concept in any name. It already depends on `hex_world`, `hex_editor` and `hex_grid`
— it is sitting on the lavition stack and wearing a Moros prefix.

⚠ **And the prefix is why nobody noticed: `tools/layering.sh` skips `moros_*` by design**, because
a consumer may depend on anything. That is the identical mechanism that kept `moros_ui` exempt for
months from the check that existed to catch it. **The name is what decides whether the arrow is
enforced**, which makes renaming a mechanism rather than a cosmetic.

**It becomes `hex_mesh`** — free in `lib/`, free in `../loft-libs-world/`, and **zero hits in the
registry** (checked, not assumed). ⚠ Not `hex_terrain`: that name is taken by
`loft-libs-world/hex_terrain`, which is *procedural generation* (noise, fbm, hydrology) and a
different job.

### L3 — ⚠ REFUTED BY ITS OWN PROBE: they are not lattice calls, they are the PROJECTION

> ⚠ **This section said *"swap the three lattice calls to `hex_grid`"*. The probe below was run on
> 2026-08-06 and it fired.** The paragraph is kept because the mistake is the instructive part:
> `tools/layering.sh`'s header records making that exact substitution twice before, which is
> precisely what made it look safe.

**Measured, they are not lattice calls:**

- `moros_render::hex_to_world` **already calls `hex_grid::hex_to_px`** (line 44). What it adds is
  `HEIGHT_SCALE` and a Y-up `Vec3`.
- `mr_corner_offset`'s own comment says *"hex_grid holds the same six corners but walks the ring
  the other way… **the values now COME FROM hex_grid** with that map applied"* — and every call
  site compensates *again* with `(6 - i) % 6`.

⚠ **A naive swap would rotate every corner and drop the height, and every count would agree.**
What these are is the **3-D projection**, and `HEIGHT_SCALE` carries the weight: **83 uses in
`editor_server` alone**, not the handful assumed here.

⚠ **And the obvious fix is already a reverted experiment.** The projection cannot move into
`hex_mesh`: `lib/hex_mesh`'s manifest records that putting this code under `moros_render` was
tried and reverted, because `moros_sim` depends on `moros_render` and inherited `hex_editor`'s
whole cone (`Cannot redefine 'fabs'`). The reverse arrow has the same shape.

**`L3′`: a small `hex_proj`** — `HEIGHT_SCALE`, `hex_to_world`, `hex_corner_world` and the corner
map — depending on `hex_grid` and `graphics` and nothing else, so both `moros_render` and
`hex_mesh` can take it without inheriting a cone. **With `L2` and `L3′` done,
`src/editor_server.loft` has zero Moros dependencies** and the program, its client, its gates and
its content can all travel together.

### L4 — `hex_world` is an ambiguous global name today

| | |
|---|---|
| `moros/lib/hex_world` | **0.1.0** — the column store: columns, layers, windowed heights, palette, edit clock |
| registry / `loft-libs-world/hex_world` | **0.2.0** — a different lineage entirely (the audience-crystal demo grid) |

`hex_editor/loft.toml` already carries the workaround and says why: *"`hex_world` is deliberately
NOT here. Ours is `lib/hex_world` and the registry carries a 0.2.0 on a different lineage;
declaring it would let the resolver pick the wrong one out from under the editor."*

A path dependency names exactly one package and is fine **inside one tree**. A standalone lavition
that *publishes* cannot use a path, so the lineage question has to be settled first.

⚠ **This one is not ours alone to decide** — the 0.2.0 lineage is `loft-libs-world`'s, which is
`loft-lang`'s repo and shared with crawler. **Raise it, do not resolve it unilaterally**, and
expect the answer to be a rename on one side.

---

## The target shape

```
lavition/
  lib/          hex_world · hex_editor · hex_part · hex_mesh · lavition_ui · glb_read
  src/          lavition_server.loft · lavition_client.loft · lavition_run.loft
  tools/gates/  the 49, all of them
  tools/scripts/ the 23 .keys scripts
  data/parts/   the part library the gates drive
  doc/          the eight documents below
  plans/
  CLAUDE.md     the working rules, minus everything Moros-specific
```

**Moros keeps** its game documentation, `html/`, the card tooling, `lib/moros_{map,editor,render,sim}`
— and becomes an ordinary **consumer**: published lavition packages plus a small configuration
file (its surface palette, its part-library path). That is
[EDITOR_SUBSTRATE § per-game hooks, not per-game subclasses](EDITOR_SUBSTRATE.md), and it is what
[moros#6](https://github.com/jjstwerff/moros/issues/6) has always been.

### The documents that travel

| document | why it is lavition's |
|---|---|
| [HEX_STACK](HEX_STACK.md) | the single authority for the stack's design; already written to be moved |
| [WORLD_MODEL](WORLD_MODEL.md) | Part II is the normative contract, and `hex_world`'s tests cite its rule ids by name |
| [PARTS](PARTS.md) | §P9.0 is the part-tree design |
| [WIRE_PROTOCOL](WIRE_PROTOCOL.md) | the server's socket |
| [EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md) | the seam rules, the DoD, the extraction bar itself |
| [EDITOR_LADDER](EDITOR_LADDER.md) | the rungs and their order |
| [CAMERA_INDOORS](CAMERA_INDOORS.md) · [CATALOGUE](CATALOGUE.md) · [EDITOR_UI](EDITOR_UI.md) · [SCRIPTED_EDITOR](SCRIPTED_EDITOR.md) | built features, each with its measurements |

⚠ **Four documents do NOT travel and must not be copied**: `SCENE_MAP`, `SCENE_MAP_RENDER`,
`SCENE_EDITOR`, `SCENE_EDITOR_PLAN`. Each describes an architecture that was not taken, each is
superseded by one of the above, and each now carries a banner saying so (2026-08-06). **A clean
project is the one chance to leave them behind** — copying them across is how the new tree starts
with the rot the old one just cleaned out.

---

## The plan structure that keeps it clean

Four mechanisms, each of which already exists here and each of which is **checkable** rather than
a habit. That is the whole rule: *a guard makes the leak impossible where a name only discourages
it.*

1. **`tools/layering.sh`, inverted.** Here it fails when a `hex_*` package names a `moros_*` one.
   There it fails when **any** package names a consumer's — and with no `moros_*` skip, because
   there is no consumer in the tree to exempt. Silent when it passes.
2. **A `boundary.loft` per package**, which `hex_world` already has: the package must build with
   the consumer absent, and its source must import nothing of one. Clause 1 of the extraction bar,
   checkable on every commit instead of at extraction time.
3. **A public-name registry check.** The collision class this session met three times —
   `Fit`, `Surface`, `hex_world` — is a *global* namespace problem, so the guard is a grep of
   `lib/`, the siblings and the registry **before** a public name is added. ⚠ A package suite
   cannot see it: `hex_part` was 131 green while `hex_editor` would not build at all.
4. **Plans keep their identity as tracker issues**, and every step keeps its *What `Ax.y` turned
   up* section. The rule this tree learned the expensive way: **the per-step record belongs to the
   plan, the handoff describes only the present, and the journal keeps the past.** STATE.md grew
   back to 2,446 lines once, and to 907 as recently as this session, every time by duplicating
   what the plan already carried.

⚠ **And one rule that is about documents rather than code, earned 2026-08-06:** before moving a
block out of a handoff, ask of every ⚠ in it — *is this what happened, or is this how the tree
works?* Operational knowledge buried inside a dated narrative walks out with the narrative. The
gate flake's four faces and *warm the toolchain after a loft install* were one edit away from
being lost that way.

---

## Sequencing, and what has to be true first

**Do not start until `A8` lands.** Plan 17's `A8` is changing `MeshAt`'s shape right now — `A8.1`
did on 2026-08-06 and `A8.2`–`A8.7` will again. hexbody's lesson, in this tree's own words: *the
cost of extracting late is a rename; the cost of extracting early is a seam that has to be
renegotiated while both sides are moving.*

**The precondition that used to block it is now met, and that is new.** `EDITOR_SUBSTRATE` said
the split waits because *"the design was spread across five documents that disagreed with each
other, four representations of the same data"* — *consolidate, then split*. HEX_STACK is the
single authority, the four representations collapsed to one under I1, and the last unmarked
contradictions were closed on 2026-08-06. **The blocker is no longer design incoherence.**

⚠ **Two clauses of the extraction bar are still genuinely unmet, and neither is paperwork:**

- **A second consumer.** `hex_editor`, `hex_part` and `lavition_ui` have exactly one caller each —
  the editor server. The DoD's own clause: *a package validated against exactly one caller has not
  been shown to be general.* ✅ The split itself supplies it — Moros becomes that second consumer,
  through a published package rather than a path — **which is an argument for the split, not
  against it.**
- **A CI worth making a gate.** Measured 2026-08-06: `cache` failed **2 of 3** suite runs and
  passed alone both times. ⚠ **And the attribution is now sharper than the docs carried**: the
  *server's own log* reads `agree 24 bad 0 layers 42` repeatedly while the gate reported
  `agree 0 bad 24 layers 0`. The world was right; the gate never read it. That is gate-side and
  fixable — the same change `part_fence` and `part_check` already got, which also made them
  58 s → 21 s and 34 s → 11 s: **poll for the acknowledgement instead of sleeping a fixed time.**

  ⚠ **A required PR check that goes red two runs in three is worse than no check**, because the
  first thing it teaches everyone is to hit re-run. Fix the flake before the gate becomes a gate.

---

## ✅ The probe was run on 2026-08-06, and it falsified `L3`

The claim is *the editor program has no irreducible Moros content*. It rests on one measurement —
that `moros_terrain` and three lattice calls are the whole coupling — and the cheapest way to
prove it wrong is also the first step of the work:

> Rename `moros_terrain` to `hex_mesh` in place, and run `tools/layering.sh` **with the `moros_*`
> skip removed**.

**It was not silent.** It named `hex_mesh → moros_render` at 26 call sites, and reading them is
what showed the three functions are the *projection* rather than the lattice — see `L3` above.
`L1` and `L2` landed on the strength of it; `L3` was withdrawn and replaced by `L3′`.

⚠ **The design was one afternoon from a change that would have rotated every corner and dropped
every height with every count agreeing.** That is what the probe cost, and what it was for.
