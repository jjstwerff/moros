---
render_with_liquid: false
---
# Editor defects — five found by USING it, 2026-08-21

⚠ **This is lavition's, not Moros's.** [OPEN_ISSUES.md](OPEN_ISSUES.md) says in its own
banner that it covers the Moros toolkit only; these are editor defects and they live here.
Where the editor stands is [STATE.md](STATE.md); the order of work is
[EDITOR_LADDER.md](EDITOR_LADDER.md).

**All five were reported by driving the editor, not by a gate.** That is the finding that
outlives the individual entries: the tree has 49 gates, 1,426 library tests and two browser
tiers, and **not one of them went red on any of these five.** Each entry below therefore ends
with *what would have caught it*, because a defect a suite cannot see will come back.

⚠ **AND THE REPORTER CALLS MOST OF THEM REGRESSIONS.** Where a bisect has been run, this file
says so. Where it has not, the entry says *not bisected* rather than guessing — three of the
five have a mechanism that would look identical whether it broke yesterday or was never
finished, and saying which requires the commit, not the code.

---

## ⚠ The constraint that reshapes two of these — **the editor is IN-GAME**

Stated by the reporter on 2026-08-21, and it is not a detail: *"the editor should be in-game,
so eventually the full game with all assets should be visible in it, and the character model
should be one of possibly **hundreds** of other models — characters, robots, insects, persons,
animals, vehicles."*

That is a **scale and an asset model**, and it changes what counts as a fix:

- **Entry 2's obvious fix is the wrong one.** *Move the five hardcoded boxes into a library* is
  a fix for a world with exactly one body in it. With hundreds, geometry is an **asset**, and
  what belongs in code is the **rig** — which limb hangs off which joint, and how it moves.
  The entry below is rewritten accordingly; the five boxes become a *default*, not a design.
- **Entries 1 and 4 stop being annoyances and become blockers.** Re-meshing everything on every
  write (1) and drawing every wall twice (4) are survivable with one figure and a few chunks in
  view. Multiply by hundreds of animated models and both are the thing that decides whether the
  editor runs at all. ⚠ **Fix them before the asset count grows, not after** — a cost that is
  invisible at n=1 is not a cost anybody can bisect at n=300.

⚠ **AND THE MACHINERY IS MOSTLY HERE ALREADY**, which is why this is a shaping constraint
rather than a new project: `glb_read` is a package, `MSG_IMPORT` already *"imports a `.glb` as
a prop"*, `data/parts/` is a catalogue whose rows render their own thumbnails, `hex_part` holds
parts as small worlds, and `hex_rig` already rigs a **multi-part jointed body** — the cart, with
its axles and rolling wheels. A character is that, with different joints.

---

## Summary

| # | what you see | status | mechanism |
|---|---|---|---|
| 1 | the whole world re-meshes on every write | ⚠ **verified**, and the source already marks it `⏭` | `local_surfaces` takes a neighbourhood, not a disc |
| 2 | no character in the page editor | ⚠ **verified** | the figure is built and posed **server-side only**, and hardcoded |
| 3 | a house floor is not flat by default | ◐ **not localised** | seating is wired; the floor write is not ruled in or out |
| 4 | every wall is drawn **twice** — hex-edge and straight | ⚠ **verified** | two emitters, and the gesture writes **both** records |
| 5 | after a reload the straight walls are gone | ⚠ **verified** | the save carries the **cells**; the run record is not saved |

⚠ **4 and 5 are ONE defect seen from two sides.** A wall exists twice over — as edge bytes in
the store and as a `WallRun` in the session — and both are drawn. Only the store is persisted,
so a reload deletes exactly one of the two copies. Fixing 4 by dropping an emitter decides 5;
fixing 5 by saving the runs makes 4 permanent. **They must be answered together, and the
answer is which representation is the authority.**

---

## 1. The whole neighbourhood re-meshes on every write

**Verified, with the client's own numbers.** One key press:

```
client: local — 338688 ground floats in 49 drawables · world 52:3830163900
client: local raise — 1 · world 16502:374721773 · 338688 floats redrawn
```

The count after a single raise is **the same count as the whole boot**. A raise moves one disc
of cells; the mesher rebuilds everything.

`src/editor_client.loft:1316` — `local_surfaces` loops `LOCAL_TILES = 3` in both axes, so
**49 tiles × 11 surfaces = 539 chunk meshes** per call, and it is called from three places:
boot, every gesture (`:1826`), and **every tick that wrote** (`:1976`). That last one is what
makes the reporter's word *frame* right rather than loose: hold a gesture key while walking and
a write happens per tick, so the rebuild happens per tick too.

⚠ **THE SOURCE ALREADY KNOWS.** Both call sites carry a `⏭`:

> *"It redraws the whole neighbourhood because `local_surfaces` takes one — `TickOut` carries
> the disc (`tk_dq`, `tk_dr`, `tk_drad`) and nothing here can yet ask for less, which is probe
> 6's answer: the report is sufficient and the MESHER is not."*

So the **information needed to mesh less is already on the wire** — the tick reports the disc
it touched — and the mesher has no entry point that accepts one. This is not a missing
measurement; it is a missing parameter.

⚠ **AND IT IS NOT A CACHE PROBLEM, which is the obvious wrong fix.** Caching what was meshed
would still re-mesh 539 chunks and then discard 538 results. The disc is the fix.

**What would have caught it:** nothing measures mesh cost in the page at all. `w_tau` is the
tree's cost instrument (CLAUDE.md: *"Cost is measured in `w_tau`, not seconds"`) and it counts
**writes**, not re-derivations — so a mesher that rebuilds the world on every write is exactly
the thing `w_tau` cannot see. A `floats redrawn` assertion in `probe/b2` — *one raise must
redraw less than the boot* — would be one line and would have been red from the first day.

---

## 2. The character is not visible in the page editor

**Verified.** The figure is five meshes — body, two legs, two arms — and every one of them is
built, coloured and posed in `src/editor_server.loft`:

| what | where |
|---|---|
| the geometry | `limb_mesh` `:1000`, `body_mesh` `:1007` |
| its dimensions | `figure_wu` / `head_wu` / `hip_wu` / `shoulder_wu` / `leg_w` / `hip_overlap`, all server-local |
| built once | `:3333`–`:3341`, sent as `M:0`…`M:4` |
| posed per tick | `:7084`–`:7088`, sent as `T:0`…`T:4` via `limb_at` `:2070` |

**The client only ever RECEIVES those.** It has no code that builds a figure, and in local mode
there is no wire to receive them on. The live page says so in its own console:

```
client: 300 frames — meshes 0, placements 0, drops 0, cameras 0, status 0, parts 49
client: local — 338688 ground floats in 49 drawables
```

`meshes 0` — nothing arrived. All 49 drawables are ground. The walker's *state* is fine
(`local walker — 116 steps … feet 0`); there is simply no body attached to it.

⚠ **THIS IS [WALK_TICK.md](WALK_TICK.md)'S DEFECT ONE LAYER UP.** That document records the
walk *tick* having been written twice and unified into `lib/hex_editor/src/tick.loft`. The
figure's **geometry** never made the same trip — it is not duplicated, it simply does not exist
outside the server. So the page walks an invisible person.

⚠ **AND IT IS WHY "IT WAS THERE PREVIOUSLY" IS TRUE AND NOT A BISECT.** Against `make editor`
the figure is sent and drawn; on the page it never was. The regression is **the mode**, not a
commit — which is a distinction worth keeping, because a bisect here would find nothing and
read as *the report was wrong*.

**The fix — and the first version of this entry got it wrong, which is worth keeping.** It read:
*move `limb_mesh`, `body_mesh` and `limb_at` into `hex_rig`* — ~30 lines of arithmetic over
`hex_proj::emit_box`, out of the server and into a shared package. That is correct for the
symptom and **wrong for the system**: it puts one hardcoded humanoid in a library, and the
editor has to show hundreds of models that are not humanoid.

**The shape that survives the constraint is a THREE-WAY SPLIT:**

| layer | holds | where |
|---|---|---|
| the **asset** | the geometry of one model, and its joints | `data/` beside the parts, read by `glb_read` / `hex_part` |
| the **rig** | which limb hangs off which joint, and how a joint moves | `hex_rig` — it already does this for the cart's axles |
| the **gait** | phase from distance travelled, per model | `hex_rig`, parameterised — never per-caller |

The five boxes then become **the default model**, shipped as an asset like `door/doorway` is,
and the server stops being the only thing that can draw a person. ⚠ **The gait is the part not
to lose in the move**: `editor_server.loft:7078` derives the swing from `wk_walked`, not from
elapsed time, *"so the feet cannot skate"* — the same discipline as `hex_body::wheel_value`.
That rule is model-independent and belongs in the rig; the numbers `LEG_SWING` and `ARM_SWING`
belong to the model.

⚠ **Take the figure's height as a PARAMETER either way** rather than reading
`hex_editor::FIGURE_M`: `hex_rig` sits below `hex_editor`, and a dependency the other way is
the layering violation `tools/layering.sh` exists to refuse.

⚠ **AND `MESH_FIGURE_MAX` IS A CEILING OF SIXTEEN.** `editor_server.loft:773` reserves ids
0–15 for *"the figure and anything fixed"* — 0–4 the figure, 5–7 the cart, 8–15 part limbs —
and a chunk's ids start above it. **Hundreds of models do not fit in that band**, and the
comment above it records what happened the last time two things shared it: *"the limb block and
the cart were writing to one another's slots … opening a part deleted the cart"*, invisible to
every gate because *"the wire carries both, the counts were right"*. The id allocation is a
piece of this work, not a follow-up.

**What would have caught it:** `probe/b2` reads the *world* half of the picture and the *panel*
half. Nothing reads the middle, where the person stands. A colour count cannot see an absent
body against ground it matches — this is CLAUDE.md's *"a colour cannot see a COUNT"* again — so
the instrument is the client's own drawable census, not a screenshot: **local mode must install
five drawables it did not receive.**

---

## 3. A house floor is not flat by default

◐ **Reported, not localised — the one entry here without a mechanism.** Written down at this
confidence deliberately: guessing a cause and prescribing a fix for it is what
[OPEN_ISSUES.md](OPEN_ISSUES.md)'s own banner warns about (*"the road-linking entry diagnosed a
cause that turned out to be wrong and prescribed a fix that was already in the code"*).

What is **ruled out**: the seating is wired. CLAUDE.md records `footprint_seat` as *"built for
seating a pad and called by nobody, so every house on a slope was buried by up to 22 units"* —
**that is now stale.** `lib/hex_editor/src/hex_editor.loft:413` calls it, under `SEAT_MEAN`, and
the surrounding comment is the record of it being wired. So *the terrain under the house gets a
datum* is no longer the open question.

What is **not ruled out**, and separates the two:

- `SEAT_MEAN` picks a datum that **balances cut against fill** — by construction it does not
  flatten, it chooses a height and returns the residual. Whether anything then writes the
  footprint's cells **to** that height, or only records the cost, is the question.
- `freeze_grade` and the `seat_res` residual are read back at `:418`; a residual that is
  carried but never spent would leave the floor stepped by exactly the terrain it sat on.

**The instrument, and it does not exist:** a gate that places a house on a **deliberate slope**
and asserts the floor cells are one height. Every existing house gate places on flat ground,
where a floor that merely inherits the terrain is indistinguishable from one that was levelled.
⚠ **That is the same shape as CLAUDE.md's one-directional-guard finding** — the fixture cannot
tell the two apart, so it passes either way. Build the sloped fixture first; it may well answer
this entry without any code change.

---

## 4. Every wall is drawn twice — once round the hex edges, once straight

**Verified, and the source says why in its own words.** There are two wall emitters in
`lib/hex_mesh/src/hex_mesh.loft`, and they write into the **same mesh**:

| emitter | line | shape it makes |
|---|---|---|
| `emit_wall_panel` / `emit_wall_panel_cut` | `:1151` / `:1200`, called at `:1875`–`:1876` | one panel **per cell edge** — hugs the hex lattice |
| `emit_run_wall` | `:1261`, called at `:1934`–`:1935` | one **straight band** from `wr_x0,wr_z0` to `wr_x1,wr_z1` |

Both run for every chunk: `for run in runs.items { emit_run_wall(wm, …) }` sits in the same
function that walks the cells. So a wall that exists in **both** representations is emitted
twice, in two different shapes — precisely *once around the hex edges, once straight*.

⚠ **AND THE GESTURE WRITES BOTH, ON PURPOSE.** `lib/hex_editor/src/gesture.loft:637`:

> ⚠ **WHAT IT STAMPS IS UNCHANGED, DELIBERATELY.** The edges below are written exactly as
> before; the six runs are a RECORD laid beside them. That split is what makes the step
> checkable: the world stays byte-identical and only the session gains something.

**That is a correct increment with a missing second half.** Laying the run *beside* the edges
is what let the step be verified — the store stayed byte-identical, so the run could be added
without disturbing anything. But the step that **stops drawing the edges** was never taken, and
until it is, every wall is two walls.

⚠ **SO THIS IS A REGRESSION IN THE PICTURE INTRODUCED BY A CHANGE THAT WAS GREEN BY DESIGN.**
The gate for that step asked *is the world byte-identical* and the answer was yes — which is
exactly what a change that only adds a second drawing of the same thing would answer. This
tree's rule is *measure what was actually emitted, never a number the producer re-derives*;
here the world key was measured and **the mesh was not**.

**What would have caught it:** a triangle count. One wall, one gesture, and an assertion that
the wall surface holds **one** band's worth of geometry. `probe/b2`'s `E2` already reads *which
surfaces were drawn* (`grass,wall`) — it knows the wall is there, and cannot see that it is
there twice. Names, not counts, is the blindness.

---

## 5. After a reload the straight walls are gone

**Verified, and the client prints the reason itself.** On restore
(`src/editor_client.loft:1188`):

```
client: local world — restored 32952:302033958 from 'world.hxw' at tau 92 · ground 1.25
  ⚠ its scene records (runs, roofs, openings, props) are not in a world file
```

The page saves `st.cache` — the `VoxelWorld`, and nothing else. **The `EditSession` is not
saved**: `es_runs`, `es_roofs`, `es_leaves`, `es_open`, `es_annex`, `es_awalls`, `es_props`,
`es_slabs`, `es_holes` all start empty on the next boot.

Put beside entry 4, that is the whole of it:

| representation | drawn by | survives a reload |
|---|---|---|
| cell edge bytes | `emit_wall_panel` — hugs the hex edges | ✅ it is in the store |
| `WallRun` record | `emit_run_wall` — the straight band | ⛔ the session is not saved |

So a reload does not *break* the wall — it **deletes one of the two copies**, and the one it
deletes is the straight one the author was looking at. Roofs, door leaves, openings, annexes,
props, slabs and holes are in the same list and lose the same way; walls are simply the one
that also has a cell-derived twin, so they half-survive instead of vanishing.

⚠ **AND THE GATE PASSES THIS.** `probe/b2`'s `O1`–`O4` check that a reload restores the world,
and it does — `32952:302033958` before and after, byte for byte. **The world key is a key over
the store, and the runs were never in the store**, so the strongest reload assertion this tree
has is structurally incapable of noticing that the scene records are gone. That is CLAUDE.md's
*"a sabotage that leaves the world identical can mean the fixture cannot see it"*, arrived at
from the other direction.

**What would have caught it:** an assertion over the SESSION across a reload, not over the
world. Count the runs before and after.

---

## What to do, in the order the facts force

1. **Decide 4/5 together — which representation is the authority.** Everything else is
   downstream of that one answer, and either fix alone makes the other permanent. The design
   note in [WORLD_MODEL.md](WORLD_MODEL.md) (*the store is the only authority, everything else
   is derived*) and the roof comment in `editor_server.loft` (*the drawn shape is the PLAN's,
   so the renderer needs the plan rather than the cells*) **point opposite ways** for walls —
   that contradiction is the actual open question, not the drawing.
2. **Make the figure an ASSET plus a RIG** (entry 2) and call it from both drivers. Independent
   of 1, and it is the one the reporter sees first — but do not shortcut it into a hardcoded
   body in a library, because the constraint above says there are hundreds of them.
3. **Build the sloped-house fixture** (entry 3) — it may answer its own entry.
4. **Give `local_surfaces` a disc** (entry 1). The disc is already carried in `TickOut`. ⚠ And
   this one moves UP the list the moment the asset count does.

⚠ **AND ADD THE FOUR MISSING INSTRUMENTS BEFORE THE FIXES, not after.** Every one of them is a
line or two, every one of them would be red right now, and a fix landed against a suite that
could not see the defect is a fix nobody can prove.
