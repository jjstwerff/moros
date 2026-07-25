# #7 — the universal editor: the library layers, and the platform they become

**Value:** `F` · **Effort:** `VH` · Blocks [#6](https://github.com/jjstwerff/moros/issues/6).
**In-flight design: [`DESIGN.md`](DESIGN.md)** (the invariant, the chokepoint, the probes, the
steps) · **the moros cherry-pick: [`SALVAGE.md`](SALVAGE.md)**.
Architecture: [EDITOR_SUBSTRATE.md](../../doc/claude/EDITOR_SUBSTRATE.md) · UI:
[SCENE_EDITOR.md](../../doc/claude/SCENE_EDITOR.md) · State:
[STATE.md](../../doc/claude/STATE.md).

## 0. The framing *(user, 2026-07-25)*

> 1. *"This editor needs to become a universal editor, thus the library layers, so many games can
>    be made with it at their core. It will eventually merge with the `../loft` IDE to create a
>    platform for game creation and testing."*
> 2. *"the world will get a new layer on top of script triggers (placed by a game developer or via
>    a level building algorithm, possibly a mix of the two) … combined with NPC-actors with their
>    own scripts/goals that possibly also interact with the world triggers, but most triggers will
>    be (multi-)player related."*
> 3. *"Crew punk is a bit different in the sense that their world is built by a story trigger
>    system, so it feeds the algorithms."* … *"But their case falls outside your editor, your
>    results will be folded into their system."*
> 4. **_"Your problem space is where are things connecting to geometry."_**

The fourth statement is the boundary, and it is a **narrowing**. Triggers, actors, eligibility,
goals and story engines are not subsystems this plan builds — they are things that **attach to
geometry**, and the attachment is ours. §1 states what that means; every decision below follows
from it.

The first three still bind: **library layers** (§4), the **IDE merge as a line-one constraint**
(D4), **many games via a kit rather than a fork** (D5), and **an external system driving our world
production** (D6) — which is precisely an attachment question wearing a bigger hat.

---

## 1. The problem space: the anchor

> **We own how a thing is attached to geometry, and never what the thing is.**

Everything in framings 2 and 3 arrives as a *payload* with an *anchor*. The payload's meaning,
lifecycle and logic belong to the game; the anchor — how it is addressed, whether that address is
admissible, and what happens to it when the geometry moves — belongs here and to nobody else.

| a thing that attaches | its **anchor** *(ours)* | its **payload** *(not ours)* |
|---|---|---|
| door · window · loophole | an interval `[s0,s1]` on the analytic surface, × `[sill,head]` | open/closed state, what forcing it costs |
| prop · set dressing | `(side, t)` on a wall surface, parented to the wall part | what it means, whether it can be used |
| **script trigger** | a **region** — cells, an edge run, a volume, a level, a body part | the condition, the script, eligibility, dispatch |
| spawn point | cell + facing | which creature, how many, on what condition |
| waypoint | cell + facing | the routine, the schedule, the activity |
| item | cell + rotation (`h_item` rides a named `LAYR`) | what the item is and does |
| **body / vehicle part** | **a bone in the rig** — its parent, offset, length and joint limits | what it will do next |
| **connector / coupling** | **the coincident point pair between two parts, plus the joint limits that govern it** | when it breaks, under what force, what follows what |
| way / road | an exact centreline plus offsets | traffic, ownership, naming |
| **routine** | its region/waypoint anchor **and its declared binding list** — the anchors it names | the script, and every reference that is not an anchor |

**NPC-actors are not in that table, and the NPC model has a home: `../crawler`** *(user,
2026-07-25: "even NPCs themselves are out of scope, they can act on the triggers themselves — but
they are a special case so I mentioned them" · "our NPC model will live in ../crawler, it already
has quite a bit of it designed and tested")*. An NPC is not a thing we model; it is a **subject**,
exactly like a player, and the only thing we owe a subject is **geometric answers**.

crawler's `VISION.md` already drew this seam, in our favour and before we asked:

> *"**Movement over the field** — flow-field pathing, steering, line of sight, hearing — is a
> hex-world concern, not a genre one. It operates on cells, blocked edges and heights, and **an
> editor previewing reachability wants it as much as a game does.** It belongs with the `hex_*`
> family."* … *"**Deciding what to do** — scheduling, needs, utility scoring, the economy driving
> behaviour — is genre-shaped. That is `roguelike-kit`."*

So the NPC model — the decision half — is crawler's, by their design and the user's call.
Measured against what actually exists today, our half is **mostly already shipped**:

| subject query | where it is | status |
|---|---|---|
| can it move here · is this edge passable | `hex_edge::passable`, `collide` | ✅ shipped, gated by crawler's `edgetest` |
| does a fast move tunnel | `hex_edge::sweep_path` | ✅ shipped, gated by `sweeptest` |
| can it see that | `hex_edge::sight_clear` + `Materials` opacity | ✅ shipped, gated by `sighttest` |
| what is this made of · how loud · how solid | `hex_edge::Materials` (`solid`/`height`/`opacity`/`sound`/`perm`/`bounce`) | ✅ shipped |
| **can it reach there** | crawler's `compute_flow` / `flow_step`, inside `Sim` | ⛔ **`EXTRACTION.md` Tier 3 — "do NOT extract yet"**, earned by a second roguelike existing |
| can it hear that | nowhere — `mat_sound` exists, no query does | **gap** |

**We build almost none of this — we consume it.** The one thing the editor genuinely wants and
cannot have is **reachability preview** (an authoring feature: *a room you cannot walk into is a
bug the editor should show, not the game discover*), and its blocker is named, deliberate and *not
ours to lift*: crawler's rule-of-three gate. Raise it there with the editor as evidence; do not
plan around it and do not re-implement a second flow field (that is `L11`'s failure, exactly).

> **And the NPC model is linked by the GAME, never by the editor** *(user, 2026-07-25: "link to
> that but keep it out of scope for the editor; moros the video game part will eventually link to
> their NPC model")*. So there are **two Moroses** in every table below: **Moros-the-editor**, a
> host and a kit over these layers, and **Moros-the-game**, a separate consumer that will link
> `../crawler`'s NPC model directly. They meet only at the shared geometry queries above, which
> each consumes from `hex_edge` on its own. **No editor layer ever reaches an NPC model**, and no
> rung in §7 depends on one existing.

The consequence that shapes the layer: **a subject is opaque, and every subject resolves through
the same calls.** A player, an NPC and a level-building generator all ask "what is here" and fire a
region's trigger through **one** chokepoint. If NPCs get their own path, two derivations of *what
is here* will eventually disagree — silently, and under multiplayer first.

### The moving subject — the single-player character IS ours

*(user, 2026-07-25: "we own the single player part, because the character can walk/run/jump in the
world with full collision")*

**A walking character is an anchor re-resolved sixty times a second** — position, footing and
collision response against real geometry. That is squarely inside framing 4, it sits **above**
hexbody's `L15` line (a controller holds a velocity, which no hexbody structure may), and
**nothing in the `hex_*` family provides it**. It is the one substantial thing in this stack that
is genuinely ours to build rather than to consume, and it makes the walkable editor and the game
the same program.

**It is built on hexbody's validated primitives — not on moros's current routines**
*(user, 2026-07-25: "the rich and validated model is from hexbody, we do not use the current moros
routines, largely untested")*. hexbody's own `PLAN.md` says the same thing from its side:

> *"moros already has a walkable in-world editor, direct-against-Map collision (`collide.loft`),
> player physics, picking, tools and a renderer … **It is mostly untested**, so it is a
> **cherry-pick source, not a foundation**: lift a layer where applicable, then gate it here with
> a control that must fire."*

So `moros_sim/player.loft` and `collide.loft` are **replaced**, not repaired. What the controller
is actually made of, all of it gated upstream:

| the controller needs | validated source | gate behind it |
|---|---|---|
| swept motion vs walls | `hex_edge::sweep_path` | crawler's `sweeptest` |
| edge blocking · passability | `hex_edge::collide`, `passable` | crawler's `edgetest` |
| its own collision volume | `hex_body::bone_obb` — a proxy **⊇** its shape with a *stated* bound | `joint.loft` §5, 564/564 points |
| footing | `hex_field::Heights` | `hex_field`'s suite |
| exactness while moving | `I-FSEAM` — the pose transform is the sole float step, `ε ≈ 7.1e-15`, exact inside a frame | `seam.loft` (`X53`) |

⚠ **One piece is genuinely missing upstream**: hexbody's **`G3`/`I5`** — *two bodies interact iff
their swept volumes cross, `dt`-independent, through one function* — is **not built**; it is
hexbody's next milestone. `sweep_path` is the narrower already-gated primitive, so the controller
builds on that and inherits `G3` when it lands. Do not invent a third path in the meantime.

**Why the moros routines cannot be the base — measured, so the replacement is a finding and not a
preference** (§10 items 7–10):

- **they tunnel.** `move_blocked` compares only the step's start hex and end hex; cross two hex
  boundaries in one frame and `edge_direction` returns `-1`, so `wall_value_on_edge` returns
  `0` = *open*. The source comment states the workaround — *"the caller should pass a clamped dt
  (≤ 1/30 s) to avoid tunnelling"* — which is `I5`'s control documented instead of fixed.
- **they are parity-blind.** `edge_direction`'s S/SW/NW deltas `(q, r+1)`, `(q−1, r+1)`, `(q−1, r)`
  applied to **offset** coordinates — the class `STATE.md` already flags in `map_set_wall_dir`
  dirs 3/4/5, with four prior instances under *"parity is where this codebase breaks"*.
- **they are single-storey.** `cy` hard-coded `0` in both `floor_y_at` and `blocked_by_wall`,
  while seam rule 4 says multi-layer is *first-class, not opt-in*.
- **and their gates cannot see it**: both `player_physics.loft` probes run on `make_flat_map()` —
  **a map with no walls** — so `test_frame_rate_independence` cannot detect tunnelling *by
  construction*. `STATE.md`'s own lesson in a new dress: a symmetric test subject cannot detect a
  symmetric bug → **a wall-free test subject cannot detect a wall bug.** The 11 green tests are
  not evidence the controller works; they are evidence the gate was aimed elsewhere.

The salvage is the **shape**, not the code: walk/strafe/normalised-diagonal, hold-to-rise jump,
gravity, terminal velocity, landing — a feature list worth keeping and re-deriving on primitives
that have controls behind them. That is **W2**, where the fence tool first needs a walkable subject.

**Five operations, and they are the whole job:**

1. **resolve** — an arbitrary point (a mouse, a generator's coordinate) becomes a legal anchor;
2. **refuse** — an anchor that cannot be recovered is refused with a **named reason, an offer and
   a residual** (never a silent snap);
3. **round-trip** — an anchor saves and reloads byte-identically;
4. **survive `Ops`** — hexbody's `I-CLOSED-OPS` set `{flip, place, combine, damage, seat}`: an
   anchor that survives admission must survive everything later done to the geometry;
5. **re-derive or report** — when the geometry under an anchor changes, the anchor moves with it,
   or it is **reported broken**. It never silently dangles.

**Operation 5 is the hard part and it is unowned anywhere in the stack.** Demolish the wall a door
is anchored to; rotate a house a prop is dressed onto; collapse the floor an actor stands on; void
the cell a trigger region covers. Nobody else can answer those — they are geometric questions —
and every one of them is a silent-data-loss bug if we get it wrong.

**This is the fifth instance of a pattern hexbody already earned four times:** *the round trip
survives exactly when the feature lands in a slot the recovery does not read* — a door is a
**material** (`X51`), a level is a **filter before the cut** (`X58`), terrain is a **height**
(`X59`), an embedded run is a **material on interior edges** (`X60`). Every time, the tempting
design changed the cells and the control was to do exactly that and watch recovery break. Reach
for it **first** on every anchor kind below.

And hexbody's `SPEC` **L15** already describes this from its own side — *a container keyed by
world location and blind to its payload* — with `tests/scope.loft` refusing an `npc_*` name in its
`src/`. What framing 4 changes is that this is not a limit we inherit; it is the **job**.

### The connector — an anchor whose frame is another part

*(user, 2026-07-25: "there are some specific ones we do have, and that is how parts of
trains/robots/vehicles combine in the world (we know their bone structure & connectors)")*

This is a **carve-out from "dynamic objects are not ours"**, and it is exactly on framing 4's line.
We do not own what a vehicle *does*. We own **how its parts combine**, because that is structure,
and structure is geometry:

> **Composition is geometry; motion is not.** A connector is a *coincidence constraint* — this
> part's point is that part's point — plus the joint limits that govern it. Whether it breaks,
> and what force breaks it, is the consumer's.

**And it is not a new subsystem: a connector is an anchor whose frame is another part rather than
the world.** The same five operations apply unchanged (§1) — resolve a connection point, refuse an
inadmissible one, round-trip it, survive `Ops`, and re-derive-or-report when the geometry beneath
it changes. That keeps the layer count flat, which is where every narrowing today has pointed.

The doorstep is already built and already the right shape: **a joint value is ordinal**, so a
refusal **owes an offer** — `joint_fits` · `joint_offer` · `joint_residual` in `hex_body`, gated by
`joint.loft` §3. Unlike a material id, clamping to a limit is a real correction the editor can
show (`X68`).

**The three-way split, stated so nobody builds the wrong third:**

| who | what |
|---|---|
| **hexbody** | makes a coupling **expressible** — the rig, the joint, the limits, the derived proxy. `SPEC` is explicit that `I10`/`I11` are *"the **consumer's** to satisfy — hexbody must make them expressible, not implement them"* |
| **the editor** *(us)* | **authors and validates the assembly** — which parts, joined at which points, with which limits — and guarantees it round-trips, survives, and reports a broken connection |
| **the game** | what the assembly **does** — follow, drive, steer, break under force, decouple |

⚠ **Measured, and it is a real gap:** `hex_body` today is a **single** rig — `rig_bone(parent, …)`
is one parent-index tree, with one canonical text. There is **no `Rig`-to-`Rig` connector type
anywhere in the family** (checked across every `hex_*` source). A train is N bodies joined by
couplings; a robot with a detachable limb is the same shape. So W7 needs either a **multi-rig
assembly primitive upstream** or an assembly document of our own — and per `SPEC`'s own wording,
*expressible* is hexbody's word, which makes the primitive theirs and the **assembly document
ours**. Raise it there before W7 designs around it (§13).

### The routine's references — a symbol table with two halves

*(user, 2026-07-25: "the content of the routines will link to libraries behind the loft sandbox.
Part of it will be from our editor (positions, possibly items in world) but a lot of it will
reference dynamic objects, NPCs, abstractions unknown to moros-editor")*

A routine's script names things. **Some of those names are ours and most are not**, and the split
is exactly framing 4's line:

| the script names | who resolves it | what the editor does |
|---|---|---|
| a position · a region · an item in the world · a waypoint | **us** — they are anchors | resolve it, check it, and **report it broken** when the geometry under it dies |
| an NPC · a dynamic object · a game abstraction · anything behind the sandboxed libraries | **not us** | carry the name **unresolved and legal**, and never invent a meaning for it |

**The load-bearing move: the editor never parses the script.** A routine declares a **binding
list** — the anchors it uses, as data beside the source — and the editor validates *that*. Extract
references by parsing loft instead, and the editor needs both the language and the game's
namespace, which is the seam gone in one step. Declared bindings keep the editor's knowledge to
exactly the half it owns.

Three consequences, and the first is a real strengthening of an invariant:

1. **Invariant II now covers references, not just anchors.** A routine holding a binding to a wall
   that is demolished is a *second* thing that dangles — and the editor is the **only** component
   that can see it, because it owns that half of the symbol table and nothing downstream does.
   *An anchor never silently dangles* therefore extends to *a binding to an anchor never silently
   dangles either*. Same gate, one more subject.
2. **An unresolved name is not an error.** The editor shows it as *foreign*, not as broken —
   otherwise every routine referencing an NPC reads as a defect in a tool that was never entitled
   to an opinion. The distinction the UI must draw is **unresolved (fine, someone else's) vs
   broken (ours, and we lost it)**, and conflating them is the failure mode.
3. **Our half of the script API is the message set** (D4). A routine asking *where is anchor X* is
   asking the same question a client asks; answering it twice is the re-derivation this stack
   engineers away. The sandbox itself is **loft's** — `65-scriptable-scenes` SC.4 enforces the
   capability limit at parse time (`use server`, `use file_io` rejected for a `script` target) —
   so what we owe is the *shape* of our half, not its enforcement.

⚠ **The versioning hazard is at its worst here.** loft silently defaults missing struct fields, so
an unversioned change to the binding surface breaks routines **quietly** — crawler's `SCRIPTING.md`
names this exactly (*"pair with a bundle schema/version … unversioned changes break mods
quietly"*). The document format already solved the analogous problem with tagged sections skipped
by length; the binding surface needs the same, decided once and before W8, not after the first
routine ships.

---

## 2. What is on the table (measured 2026-07-25)

**hexbody ships.** Ten libraries on `loft-lang/registry` — `hex_field` plus `hex_form`
`hex_shape` `hex_draw` `hex_recover` `hex_fit` `hex_place` `hex_edge` `hex_way` `hex_roof`, and
`hex_body` — beside `hex_grid`, `hex_world`, `hex_terrain` from crawler's lineage. `make test` is
**24/24 green**, each gate with a control that fires. `SPEC` **L6** puts the editor on our side of
the seam by design; `ASSESSMENT.md` §2 lists what it hands us: refuse-with-a-reason-and-an-offer,
arbitrary point → legal geometry, byte-identical save/load/undo/diff, author-once-get-twelve,
seat-on-terrain, order-free combine, one mitered quad per wall.

**Two of the five anchor operations are already gated upstream** — `resolve` (`nearest_vertex`,
`snap_run_d24/p`) and `refuse` (`draft_fits`, `arc_fits`, `fit_reason`, with 0 false accepts
against the trip itself). `round-trip` is gated for the model. **`survive Ops` is gated for
geometry but never for an attached payload, and `re-derive or report` does not exist anywhere.**
That is the gap this plan is actually for.

**Moros has the model of an editor and no editor.** Five packages, ~489 tests — and **no `fn main`
anywhere outside three `moros_render` examples.** `editor_tick`, `tool_apply`, `panel_build`,
`route_click`, `pick_hex_under_cursor` have never drawn a frame or taken a real click.

**Moros consumes two of the ten** (`hex_field`, `hex_grid`) and duplicates three (§9).

**`make lib-test` is RED** — `moros_ui` has no `loft.lock`, so transitive `glb` does not resolve
and all four test files fail to parse. Verified: with a lock it is 46/46 green.

---

## 3. Three package maps, one family — the reconciliation

The universal editor has been designed **three times** and the maps disagree.

| loft `lib_plans/73-universal-editor` (2026-05-27, FUTURE) | reality 2026-07-25 | verdict |
|---|---|---|
| `hex_grid` — *"axial flat-top"* | **shipped**, and **pointy-top odd-r** | **alive, spec wrong** (moros #3) |
| `hex_map` — multi-layer data + paint verbs | `hex_field` + the consumer's own cell; **L13** makes moros's `Hex` the storage of record | **superseded** — a consumer's cell is not a library type |
| `hex_stencil` — format + stamp + save/load | `hex_field::Stencil` + `stencil_stamp_all` + `hex_place` | **superseded, shipped** |
| `hex_render` — mesh emitters + 3D camera | `hex_draw` + `hex_roof`; the realtime half unbuilt | **renamed `hex_scene`**, must consume `hex_draw` not re-derive walls |
| `hex_editor` — tools + undo + UI + `GameHooks` | unbuilt | **alive — this plan** |
| `hex_entity` — baked mesh, pivots, mounts, runtime | `hex_body` covers rigs/joints/poses/proxies; baking and mounting unbuilt | **alive**, and its future-tense parts sit **above** hexbody's `L15` line |

Two claims in other trees this plan settles rather than inherits:

- **loft's Workbench §9 says the scene editor is emerging from *crawler*.** It is not — crawler
  has no authoring UI and **no stencil call sites at all**. The emergence is here, which is what
  the Workbench's stated job (*reserve the seam, adopt the emergent design*) is waiting for.
- **`dryopea` is a named second consumer** whose `plans/future/06-editor-stencil-pipeline/`
  depends on this extraction, and it is **not checked out here**.

---

## 4. The layer stack

```
  HOST         native window · browser page · Workbench panel · APK · agent/CI     per consumer
  ═══════════════════════════════════════════════════════════════════════════════════════════
  hex_proto    the editor's complete serialisation — one message per capability      D4
  hex_kit      a game's configuration: palette, tool table, anchor payloads, hooks   D5
  ───────────────────────────────────────────────────────────────────────────────────────────
  hex_anchor   THE PROBLEM SPACE (§1): anchor kinds · resolve · refuse · round-trip  D6
               · survive Ops · re-derive-or-report.  BLIND to every payload
  hex_walk     the moving subject: walk · run · jump · full collision, SWEPT.
               Built on hex_edge + hex_body, never on moros's untested routines
  hex_editor   document · regime · selection · tools · undo/journal · the doorstep shown
  hex_scene    field → mesh · the realtime view · picking                       (was hex_render)
  hex_entity   bake · pivots · mounts · the entity runtime                      (loft L6, alive)
  ═══════════════════════════════════════════════════════════════════════════════════════════
  hex_* geometry — hex_field/form/shape/draw/recover/fit/place/edge/way/roof + hex_body   SHIPPED
  loft — the store, schema-as-data + live migration, graphics, the registry              SHIPPED
```

⚠ **These are `lib/` packages in *this* repo until milestone `X` (D2).** The names, the boundaries
and the dependency direction are the library's from the first commit; only the *address* is local.

Dependencies flow strictly down. **Only `hex_scene` knows a renderer** and it draws through
`Renderer`/`Scene`, never raw `gl_*` — free today, and it buys macOS/iOS as a backend swap
(loft's `GFX.PORTABLE` precondition is exactly that sentence). **Only the host knows I/O.**

> **There is no `hex_trigger` and no `hex_actor`.** An earlier draft of this plan had both, with
> dispatch, an eligibility envelope and subscriber gating inside them. Framing 4 deletes them: a
> trigger is a **region anchor** with a payload we never read, and an NPC is not a type at all —
> it is an opaque **subject** that asks geometric questions (§1). One layer, many anchor kinds;
> the eligibility engine, the dispatch and the goal logic are the game's.

### How each known consumer uses the stack

*Requested by the user, and it is the generality evidence the DoD's second-consumer clause asks
for: a layer that only one column needs is Moros content wearing a library's name, and a layer
every column needs is one to get right first.*

| layer | **Moros-editor** encounter maps | **Moros-the-game** | **crawler** roguelike | **bumper airplanes** | **loft Workbench** | **crew_punk** *(integrator)* | **dryopea** |
|---|---|---|---|---|---|---|---|
| `hex_proto` | page + desktop window are clients | — | — *(no authoring UI)* | phones are clients | **the whole seam** | **the door its story engine drives** | editor client |
| `hex_kit` | materials, walls, items, spawns, waypoints | reads the same kit | its own vocabulary | a palette→extrusion map, nothing else | what the scene declares | its own | its own |
| `hex_anchor` | doors, props, spawns, waypoints, triggers | **fires** them; never places them | **queries only** — footing, LOS | none | scene-script hook targets | anchors arrive **inside our output** | stencil anchors |
| `hex_walk` | walk the map you are editing | **the player character** — walk/run/jump, full collision | own `Sim` movement | phones drive avatars | — | — | its own units |
| `hex_editor` | all nine tools, undo, layers | — | — | paint + height only | tools over the protocol | — | its plan-06 pipeline |
| `hex_scene` | the 3-D view and GLB export | the same view, live | own renderer today; converges later | **the map *is* the physics geometry** | renders state, never computes | — | its own view |
| `hex_entity` | items, stairs, avatars | the same, posed | vaults, roofs, props | extruded pillars and ramps | — | — | baked-mesh units |
| `hex_*` geometry | the field, stencils, walls | the same field | **the originator** | the extrusion source | — | — | forms + stencils |
| **NPC model** *(not ours)* | **never** | **links `../crawler`'s** | **owns it** | — | — | its own story engine | — |

Four things the matrix says that prose would not:

- **The bottom row is the point of the last two framings.** Moros-the-editor's cell is *never*,
  and it must stay *never* — the day an editor layer reaches an NPC model, the seam is gone.
  Moros-the-game links crawler's directly, which is a dependency between two **consumers**, not
  between two layers of this stack.
- **`hex_anchor` is used by every authoring column, and by crawler in a different mode entirely**
  (queries, no anchors) — the orthogonal-axis evidence that makes a seam trustworthy. Design
  against both or it fits neither.
- **bumper airplanes takes the fewest layers**, so it is the cheapest honesty check on D5: if a
  two-tool editor cannot be built from these packages without dragging items and NPCs along, the
  kit boundary is wrong.
- **crew_punk consumes none of the layers** — it consumes our **output**, through `hex_proto`'s
  door. That is the shape of every future integrator, and why D4 is worth more than its cost.

---

## 5. The decisions this plan settles before any code

### D1 — what the editor edits *(the load-bearing one)*

Moros's `Map` is **field-first** (paint a cell, freehand, no grammar); hexbody's `𝕄*` is
**model-first** (author a form, the field is drawn, `rebuild` recovers it exactly, the doorstep
refuses what would not round-trip). Neither alone is the editor.

> **The document is the canonical model text, the field, and the anchor set — and every object
> carries its regime.** `R1` — authored through the doorstep, recovered exactly, `ρ = 0`. `R2` —
> freehand cells no grammar form draws, recovered as a fit with `ρ > 0`. `promote(selection)` is
> `rebuild` offered as a command.

Keeps every Moros tool (they produce R2) and every hexbody guarantee (R1 is exact), and makes the
difference **visible**. `hex_recover`'s constructive path already reaches strictly further than
enumeration (`tests/trip.loft` §7), so promotion is not speculative. **Probe it first** (§11).

### D2 — where it lives: **here, until it is almost finished**

*(user, 2026-07-25: "it is because of the moros ancestry that it is designed here, but it needs to
be its own project eventually — but hexbody was extruded from crawler too early (many times I had
to back reference for data), so we only extrude when the editor is in an almost finished state")*

**The editor is developed in this repo, as `lib/` packages, and extracted late.** Its eventual home
is its own project shipping into `loft-libs-world`; the *timing* is the decision, and it is a
**late** one.

**The cost of extracting early is not a hypothesis — hexbody wrote the receipt.** Its own `README`
says the quiet part: *"Most of this project's substance originated in `../crawler`, and far more of
it is still there than has been moved… **Read crawler before building anything here** — the odds
are good that the problem has already been characterised, and often already prototyped."* It then
lists **eight design documents still in crawler that are directly on hexbody's remit** (~2 400
lines in `plans/11-3d-world/` alone). And the dependency is not only historical: `make test` reads
**two unpinned sibling trees**, and `tests/palette.loft` parses moros's source on every run — it
prints *"Expected a sibling checkout at `../moros`. Without it this gate cannot check…"* and fails.
Three kinds of back-reference — design, data, and a live gate — from one early split.

> **So the extraction bar is a measurement, not a feeling: *the editor's gates pass with the parent
> tree absent.*** That is the instrument that would have told hexbody it was early.

**And it is a standing gate, not an exit exam** *(user, 2026-07-25: "we can define our own set of
tests to be able to run those without moros overhead — though that is much less than crawler
had")*. The editor gets **its own suite from the first package**, runnable without the Moros tree:
its own fixtures, its own corpus, its own probes. Two returns, and the second is the one that
matters — the daily loop stops paying for a campaign it does not use, **and the back-reference
count can never silently grow**, because a dependency added on Tuesday turns the suite red on
Tuesday instead of surfacing at extraction.

**The distinction that names what actually hurt hexbody:** a *declared package dependency* is
normal and fine — hexbody depends on `hex_field` and nobody calls that a back-reference. What cost
it was **undeclared** dependence:

| kind | example from hexbody | verdict |
|---|---|---|
| a declared dependency | `hex_draw` → `hex_field` | **fine** — that is what libraries are |
| reading the parent's **source text** | `palette.loft` parses `moros_map/src/types.loft` and fails without it | **the thing to forbid** |
| needing the parent's **design docs** | eight documents still in crawler, ~2 400 lines, *"read crawler before building anything here"* | **the expensive one** — invisible to any build |
| an **unpinned sibling working tree** | `make test` reads two, and cannot see whether either is dirty | **the silent one** |

So the standing gate is: **no editor test reads a path outside its own package, and no editor
design cites a document that exists only in Moros.** The editor may *depend on* `moros_map` for the
cell schema — `L13` makes it the storage of record, and that is a declared dep like any other.

**What does not wait is the discipline.** Library *location* is late; library *boundaries* are
enforced from the first step, or extraction becomes a rewrite:

- no package imports a consumer — no Moros content, no campaign constants;
- every derived threshold is dimensionless (the metre never travels — seam rule 2);
- materials, items and walls cross as **opaque integers**;
- a `tests/scope.loft`-shaped **vocabulary gate runs in-tree from W2**, so a Moros-only concept
  landing in an editor package is caught the day it lands, not the day we try to move it.

**The extraction milestone — `X` — and its entry conditions**, so "almost finished" is checkable:

1. the ladder has reached **W4** (houses) — the rung the library family exists for;
2. a **second consumer** drives the packages in a different configuration (bumper airplanes is the
   cheap one; dryopea the true one);
3. **the back-reference count is zero** — trivially true if the standing gate above has been green
   all along, which is the point of arming it at S3 rather than checking it here;
4. the vocabulary gate has been **green for a whole rung** without an exemption.

⚠ Until `X`, `loft-libs-world` gets **nothing** from this plan. That is a change from an earlier
draft of D2, which had the packages landing there from the start.

### D3 — loft or JavaScript

**loft. The page is a shell that owns I/O and nothing else.** Settled on evidence in hand: one
source reaches interpreter, native window, `--html` and a signed APK; the Workbench needs the
model **server-side**; seam rule 5 forbids the second copy. `SCENE_EDITOR_PLAN.md` phases **2 and
3** (JS canvas, JS editor logic, ~38 rows) are **declined**, not deferred.

### D4 — the protocol is the editor's complete serialisation

Adopt loft's own debug-protocol invariant, one layer up:

> **Every editor capability is exactly one protocol message. No capability is UI-only. The
> protocol layer adds no editor semantics** — each request is a thin call into an existing method,
> each event a thin render of state.

From the one rule: the **Workbench panel**, the **browser page**, the **native window**, an
**agent or CI gate**, and **a level-building algorithm** are all clients. That last one is what
framings 2 and 3 need — *"placed by a developer or via a level building algorithm, possibly a mix
of the two"* stops being a coordination problem, because hand-placed and generated anchors come
through the same door and the same doorstep and are indistinguishable downstream. And **undo,
save, replay and multiplayer sync become one journal**, because a message log is all four.

### D5 — the kit is a layer, not a parameter

A game supplies a **kit**: palette (opaque integers the substrate never decodes), tool table,
**anchor payloads** and hooks. Making it a *package* is the difference between configuring the
editor and forking it. The boundary test is not hypothetical: **would bumper airplanes carry
this?** No items, no NPCs, no layers — it paints a palette and extrudes it. Moros's nine tools are
*a kit*, not *the editor*.

### D6 — the anchor layer owns attachment, and the payload is never read

Everything framings 2 and 3 describe enters as an anchor kind (§1). Three consequences:

1. **Anchors are a document overlay** (D1's third component), never a field slot — `L13` caps
   permanent world state at seven integers per hex per storey, so there is no eighth slot, and
   `L14` makes any side table area- *and* time-limited. As an overlay they save, undo and replay
   through the one journal for free.
2. **One resolution chokepoint, blind to its subject.** A player, an NPC-actor and a generator all
   address geometry through the **same** resolve/refuse calls. A second path for any of them is
   the re-derivation pattern loft's `GOALS.md` says to engineer away — two derivations of "what is
   here" will disagree, silently, and under multiplayer first.
3. **Reproducible production.** Framing 3's hand-off needs our generator to build **the same world
   from the same seed and message log** — an external story system drives it and must trust the
   result. Adopt crawler's fences wholesale: **seeded RNG only, no wall-clock, an MP-safe clock.**

**What we adopt and never relitigate** (crawler `SCRIPTING.md`, crew_punk `BLOCKS.md`): *nothing
is scheduled, everything is eligible; the world stores what happened, content carries conditions;
the engine joins them at play time and discards the join.* We build **no** part of that engine.
It reaches us as one obligation only — invariant **III**.

⚠ **A specific versioning hazard:** loft silently defaults missing struct fields, so an unversioned
change to the anchor or kit surface breaks content **quietly**. The document format already solved
the analogous problem with tagged sections skipped by length; both surfaces need the same
treatment, decided once.

---

## 6. The invariants

> **I. No edit is ever silently corrected.** Every author action ends in exactly one of three
> states — applied exactly (R1, byte-identical round trip), refused with a named reason, an offer
> and a residual, or applied as an explicit approximation (R2) with its residual on screen.

> **II. No anchor, and no binding to one, ever silently dangles.** When geometry changes under an
> attached thing, its anchor moves with it or is **reported broken** — and so is every routine
> binding that names it. Never dropped, never silently relocated. A *foreign* name the editor
> cannot resolve is neither: it is shown as foreign, and left alone.

> **III. The editor is the only place the join exists, and it never leaves.** An author sees
> *condition → content*; the player never can. No shipped artefact, runtime overlay, log or save
> may contain a rendering of the pair.

> **IV. The protocol is complete.** Every capability is one message; no capability is UI-only.

**I** is `K-FIT` + `I-QUANT` + hexbody's coarse-quantum presentation obligation as one thing.
**II** is **I** applied to attachment rather than to edits, and it is the invariant this plan
exists to establish — nothing upstream owns it. **III** is crew_punk's one absolute rule, landing
here because the editor is the **only** surface where both halves are necessarily present at once:
everywhere else the design keeps them apart by construction. **IV** is what makes the editor a
platform rather than an application.

**The leak sites, each a gate with a control that must be *seen* to fire:**

| # | inv | leak | control |
|---|---|---|---|
| 1 | I | a tool writes a cell without consulting `fits?` | bypass the doorstep → an off-grid value snaps silently |
| 2 | I | a **nominal** parameter offered as if ordinal | offer material `255` for `256` → reads as a small correction, changes what the wall is made of (`X68`) |
| 3 | I | the in-between quantum (`√39` wu = 5.408 m) applied without showing admissible lengths | author a length between multiples → must refuse, not snap |
| 4 | I | a stamp drops content | asymmetric stencil only — a symmetric subject cannot detect a symmetric loss (17 walls stamped as 8) |
| 5 | I | undo restores the field but not the model | undo an R1 edit → both halves return byte-identically |
| 6 | I | autosave writes twice to one path | `doc_write` **appends**; the reader returns the *first* doc with `HXF_OK` (**L12**) |
| 7 | **II** | an anchor survives admission but not `Ops` | flip a house with a doored wall → the door's `(side,t)` must be the morphed preimage, not a re-snapped guess |
| 8 | **II** | an anchor whose geometry is destroyed | demolish the wall a trigger region covers → it must be **reported**, not vanish and not silently reattach to the nearest surviving wall |
| 8b | **II** | a *binding* to a destroyed anchor | demolish the wall a routine's binding list names → the routine must be reported broken. **Control:** a routine naming an NPC must **not** be reported — unresolved is not broken |
| 9 | III | a join reachable outside the editor | load a trigger-carrying document as a *player* client → no condition readable beside the content it gates; plant a debug overlay drawing both and the gate goes red |
| 10 | IV | a capability with no message | **census**: the public verb set must equal the message set — a leak *and* an invented message both turn it red |

Leak **8** is the one nothing in the stack currently defends, and it is the reason `re-derive or
report` is a milestone rather than a helper.

---

## 7. The ladder — content rungs, each one a complete editor

*(Rungs are **W0–W4**; hexbody's recovery **regimes R1/R2** are a different thing and keep their
upstream names.)*

*(user, 2026-07-25: "this work has to be validated from the start, we create a very simple editor
first and keep up with the 3d routines and performance during all the way. We start with just a
flat plane where we can edit hills. Then we allow to draw roads on that terrain, then fences, then
fields, only then houses.")*

**This replaces a feature-layer build order with a content ladder, and it is the better spine.**
An earlier draft of this plan sequenced by capability — host, then document, then doorstep, then
renderer — which defers the 3-D view and the performance question to the middle and leaves every
claim untested until then. That is precisely the failure §2 measures in the tree today: **~489
green tests and zero frames.** The ladder makes that impossible, because *rung 0 already renders*.

> **Every rung is a whole editor for a smaller world.** Author it, see it in 3-D, save it, reload
> it, undo it, and hit the frame budget — at every rung, from the first. Nothing is deferred to
> the end, so nothing arrives unvalidated.

**And "whole" means THICK, not a vertical slice** *(user, 2026-07-25: "we do thick all the way, I
want to have it functional before we do anything next — yes there is up-front cost, but it pays
off in heaps later")*. A rung is not done when the content type renders and saves; it is done when
**someone could use it**: a comfortable camera, hover and pick, brush sizes, drag-paint, undo at a
sane granularity, the palette panel, the status readout. That is loft's own bar — *"a thing is
done when picking it up is **fun**"* — and a thin rung never clears it, because *"it renders and
saves"* is still a claim about a thing nobody used. Thin would reproduce, at smaller scale, exactly
the failure this ladder exists to prevent.

**Why the up-front cost is smaller than it looks: the shell is built once.** W0 pays for the whole
editor *shell* — host, camera, picking, panel, status, undo batching, save/load, tool dispatch —
because a functional hills editor needs all of it. Every rung after W0 adds only **a `ToolDef`, a
content kind, an anchor kind and a render path**; none of them re-buys the shell. So the ladder's
cost curve is front-loaded by design: W0 is the expensive rung and W1–W8 are each a fraction of
it. That is the *"pays off in heaps later"*, stated as a shape rather than a hope — and it is
checkable: **if W1 is not markedly cheaper than W0, the shell leaked into the content and the
`ToolDef` boundary (D5) is wrong.**

It is also hexbody's own method, applied to content instead of to forms — the stencil census grew
*"the smallest closed form, then longer sides, more sides, unequal sides, reflex corners, features,
arcs — and finally combination"*, with the rule that **each rung is a green increment, and where a
rung fails, that failure is a restriction recorded and carried forward, not patched away.**

### Why this order — each rung adds exactly one representational kind

The sequence is not arbitrary; it is the field model's own layering, and the libraries fall out of
it in order.

| rung | new content | the new representational kind | exercises | the honest risk |
|---|---|---|---|---|
| **W0** | **a flat plane, and hills** | `Heights` alone — **no anchor at all** | `hex_field::Heights`, `hex_scene`, the host | none representational. The whole risk is the **host and the frame budget**, which is exactly what has never been tested |
| **W1** | **roads on that terrain** | **linework** — an exact centreline plus offsets, the 24 directions, and the first content that must *sit on* non-flat ground | `hex_way`, `hex_place::seat`, `hex_fit`'s in-between 12 | ⚠ **`hex_way::Track` is a float world-space curve with no lattice anchoring** — treat *"stencils carry roads"* as unverified. W1 is where that gets measured, and it may become a restriction |
| **W2** | **fences** | **edges** — a line primitive with a width, marking the edges *along* the line, and the first content stored in `EdgeSet` | `hex_edge`, `I-ALONG`, `I-WIDTH` | the parity class. A fence is the cheapest possible subject for the four parity bugs this codebase has already had |
| **W3** | **fields** | **regions** — a filled area whose boundary is *taken*, not painted; the first content with an **inside** | `hex_field::trace`, `validate`, `I3` | disconnected sets: `validate = 5` rejects two blocks, and painting two separate fields is ordinary editing. The one-outer-loop contract is the restriction to find here |
| **W4** | **houses** | **closed forms with features** — everything at once: walls as the boundary of a fill, openings as intervals on the analytic surface, a roof, twelve orientations, the exact round trip | `hex_form`, `hex_draw`, `hex_recover`, `hex_roof`, `hex_place` | this is the rung the whole library family was built for, so it should be the *cheapest*, not the hardest — and if it is not, the ladder found something |
| **W5** | **trees and bushes** | **a derived volume that overflows its anchor** — a canopy overhangs the cell it is rooted in, and is *never stored*; and the first **procedurally instanced** content (seed → this tree) | crawler's `hexcanopy.loft` + its ten canopy gates (partition · crown · skeleton · pipe model · volume · opacity · lean · light · relax · card), `hex_grow` in the package map | `L13`/`L3`: a tree may not become an eighth slot — it is an `h_item` + rotation on a named `LAYR` with the canopy **derived on demand**. The risk is that the canopy *wants* to be stored for lighting and occlusion, and the day it is, the common case starts paying for the exotic one. Plus determinism: same seed → the same tree, or replay breaks |
| **W6** | **decorative elements** | **sub-cell placement** — `(side, t)` on a surface, below lattice resolution; the parametric anchor kind finally exercised | crawler's `PROPS.md` + `plans/10-props`, the dressing layer of `FEATURES`' stack | `OD-7`'s resolution bites here: **sub-cell resolution has no slot in the schema.** A prop's *anchor* is storable (a ratio survives any morph); its *geometry* is not, and must stay derived. `PROPS.md` part 2's awkward cases — a non-vertical axis, a prop meeting a surface at an angle, an assembly — are exactly the anchor-orientation problem, and *"a wheel is the general one"* |
| **W7** | **vehicles** | **a posed body** — a continuous pose **never stamped into the world lattice**, authored as a **rig** (bones + joint limits), never as a pose | `hex_body`'s first real consumer, `I-POSE`, `I-FSEAM` (ε ≈ 7.1e-15), `K-JOINT`, `hex_entity`'s mounts and pivots | ⚠ **the one rung with a live upstream dependency**: hexbody's `G3`/`I5` — *interaction iff swept volumes cross, `dt`-independent, through one function* — is **not built**. It is also the first rung where the editor authors a **second document kind** — a rig text *and an assembly of them* — with its own doorstep, where a refusal **does** owe an offer because a joint value is ordinal. ⚠ **`hex_body` is single-rig today; the connector between two parts does not exist in the family** (§1) |
| **W8** | **routines** *(the tail)* | **anchored payloads with behaviour** — waypoints, spawn points, trigger regions: the anchor layer's payload-bearing kinds | `hex_anchor`'s region/waypoint/spawn kinds, invariant **III**, crawler's `SCRIPTING.md` bus (adopted, never built here) | **why it is last is a dependency, not a preference:** a routine *references* everything below it — a waypoint on a road, a region over a field, a schedule that visits a house, an actor that uses a vehicle. It cannot be authored before its referents exist. And **III becomes violable for the first time**: the editor is the only place the join exists, and it must not leave. Plus the symbol table's foreign half (§1) — the editor must distinguish *unresolved* from *broken*, and version the binding surface before the first routine ships |

**Read the risk column as the point of the ladder.** W0's risk is not geometry, it is that no frame
has ever been drawn. W1's is a library nobody has examined. W2's is the defect class this codebase
demonstrably repeats. Each rung front-loads a different unknown, and none of them waits for W4.

### What every rung must satisfy — the standing obligations

These are not milestones to be reached once; they are the conditions for a rung being **done**, and
each one becomes violable at a specific rung, which is when its gate is first armed.

| obligation | first violable | the gate, and its control |
|---|---|---|
| **it renders in 3-D** | W0 | loft's headless browser check (WebGL2, zero console errors, canvas colour count) + a native smoke run. **Control:** unwire `upload_scene` → the colour count must go red. *A blank canvas that compiles clean is the failure this exists for* |
| **it performs, and the budget is stated in ms** | W0 | a frame-time budget at a stated map size, measured every rung and **recorded as a number**, never "feels fine". **Control:** rebuild the whole scene on a one-cell edit → the budget breaks at the stated size (`L3`'s named violation) |
| **it round-trips** | W0 | `save → load → save` byte-identical; undo of depth N restores byte-identically. **Control:** hand-perturb one byte and the digest must move |
| **no edit is silently corrected** (inv **I**) | W1 | the doorstep shows reason + offer + residual; the editor's offer equals `snap_run_d24`/`snap_run_p` and its residual equals `run_end_dist`. **Control:** author a length between admissible multiples — it must refuse, not snap |
| **no anchor silently dangles** (inv **II**) | W1 | every anchor survives `{flip, place, combine, damage, seat}` or is **reported**. **Control:** demolish the geometry under an anchor and watch it silently reattach |
| **one renderer, no second derivation** | W2 | a wall/fence stored as N edges renders as **1** fitted quad, `eave_spread` 0, miter gap 0. **Control:** read the top at the strip instead of the fitted line → ±0.43 m (`I8`) |
| **tools are data, not an enum** | W2 | the bumper-airplanes kit: a two-tool editor from the same packages, zero reference to items, NPCs or layers |
| **the protocol is complete** (inv **IV**) | W1 | the census: public verb set **=** message set. **Control:** add a UI-only capability → red |
| **the join never leaves** (inv **III**) | W8 | load a trigger-carrying document as a *player* client — no condition readable beside the content it gates |

**The rung is done when every armed obligation is green *and* its own gate's control has been seen
to fire.** A rung that ships with an obligation deferred has moved the debt, not paid it.

### The rungs, as milestones

- **W0 — the flat plane and the hills.** Produce: the host (`fn main`, window, `--html`), the
  height tool, `hex_scene`'s terrain path, the journal, the frame-budget harness. Fix the
  `moros_ui` lock (§10.1). ⚠ **Orbit camera, not the player controller** — walking is W2+, on
  validated primitives; wiring the untested `player_step` here would bless a code path §1 deletes.
  **Done when** you can raise a hill, see it, save it, reload it, undo it, in a window and a
  browser tab, with a recorded frame time.
- **W1 — roads.** Produce: the linework tool, seating on the hills, the doorstep surfaced. **Done
  when** a road sits on a slope, its refusals name their reason and offer an alternative, and
  `hex_way`'s lattice anchoring is *measured* — recorded as a restriction if it does not hold.
- **W2 — fences.** Produce: the edge tool, `hex_edge` consumed for storage *and* for the walk
  queries, `hex_walk` re-derived (§1). **Done when** a fence marks the edges along its line at both
  parities, and no speed and no `dt` walks through one.
- **W3 — fields.** Produce: the region tool, fill-then-boundary, connected components. **Done
  when** two disjoint fields are authorable and the one-outer-loop restriction is stated rather
  than discovered.
- **W4 — houses.** Produce: forms, walls, openings, roofs, the twelve placements, `promote` (regime R1 vs R2), the side-by-side contact sheet. **Done when** a house authored once appears correctly
  in every orientation it will ship in, and `write(rebuild(draw(read(T)))) = T` holds through the
  editor's own path.

- **W5 — trees and bushes.** Produce: the planting tool, the canopy derived as layer 2, seeded
  instancing. **Done when** a forest renders inside the frame budget with **nothing about the
  canopy persisted**, and the same seed rebuilds the same tree after a reload.
- **W6 — decorative elements.** Produce: the kitbash tool — a prop placed at `(side, t)` on a
  surface, parented to the part it hangs off. **Done when** a prop survives all twelve placements
  and the save round trip, and `PROPS.md`'s three awkward classes are each either handled or
  recorded as a restriction.
- **W7 — vehicles.** Produce: the rig document (bones + joint limits, canonical text, its own
  doorstep with an offer), **the assembly document — parts plus connectors**, placement, and the
  derived proxy. **Done when** a multi-part vehicle is authored once, its connectors stay
  **coincident** through every pose the limits admit, the assembly round-trips as text, a joint
  refusal names its limit *and offers the nearest admissible value*, and each part's proxy still
  contains its shape — with `G3`'s absence and the missing multi-rig primitive recorded as stated
  limits rather than worked around.
- **W8 — routines.** Produce: the waypoint, spawn and trigger-region tools — the **anchor and the
  binding list**, never the behaviour and never the script's parse. The binding surface gets a
  **version** from its first byte. **Done when** a routine's anchors *and bindings* survive every
  operation on the geometry beneath them or are reported; a routine naming an NPC shows as
  **foreign, not broken**; and the **join scan** is green — no condition readable beside the
  content it gates, in any artefact the editor emits.

### The one-time milestones, after the ladder

**Three** things are genuinely not per-rung. *(The dressing was a third; it is now **W6**, which is
where it belongs — it is content, and content belongs on the ladder.)*

- **P1 — the scripted client.** The NDJSON/WebSocket driver, the completeness census, byte-identical
  replay, and **reproducible generation** (same seed + message log → the same world, twice). This is
  the *testing* half of the platform and the hand-off an outside system folds into (framing 3).
- **X — the extraction.** The editor becomes its own project and ships into `loft-libs-world`,
  once D2's four entry conditions are met — the ladder at W4, a second consumer green, the
  **back-reference count at zero**, and the vocabulary gate green for a whole rung. Gate: the
  editor's whole suite passes with `../moros` absent from disk. **Control:** put a Moros path back
  in one gate → it must fail. *This is the step hexbody could not run before it left crawler.*
- **P2 — the Workbench merge.** The editor as an IDE panel over the one-message-one-method protocol;
  the game in its own window via `launchGame`; edit → hot-swap → see it live → breakpoint it. Gate:
  no new editor semantics in the adapter, **and a struct change in the running game does not lose
  the world** (loft's live migration through a real document). Coordinate with loft
  `65-scriptable-scenes`.

The **anchor mechanism** is armed from W1 and every rung must satisfy it; the **payload-bearing
anchor kinds** (trigger region, waypoint, spawn) are *authored* at W8, because that is when the
things they point at exist. A door's interval is not one of those — it lands at W4 with the
surfaces it annotates.

---

## 8. Critical path

```
  ├──────────── the field itself ─────────────┤├─── things in the field ───┤├ what they do ┤

  W0 hills ─▶ W1 roads ─▶ W2 fences ─▶ W3 fields ─▶ W4 houses ─▶ W5 trees ─▶ W6 props ─▶ W7 vehicles ─▶ W8 routines
      │                                                                                                     │
      └── every rung: 3-D · frame budget · round-trip · doorstep · anchors survive ·                        │
          one renderer · protocol complete — each armed at the rung it first becomes violable                │
                                                                                                            ▼
                                                                                          P1 scripted client ─▶ P2 Workbench merge
```

**The ladder has two halves.** W0–W4 build *the field itself* — heights, linework, edges, regions,
closed forms — and each adds one representational kind to the storage model. W5–W8 build *things in
the field*: a derived volume, a sub-cell attachment, a posed body, and finally a behaviour binding.
The turn happens at W5, and it is the point where the editor stops being about the world's fabric
and starts being about what stands on it.

**W0 first and alone.** Not because it is small, but because it is where the two genuinely untested
things live — *does a frame draw at all*, and *what does it cost*. Everything above §2's "~489
green tests and zero frames" is a claim until W0 answers it.

The obligations bar underneath is the plan's real structure: it is what stops the ladder from
becoming five prototypes.

---

## 9. The duplication ledger — what moves, what dies, what stays

| Moros today | `hex_*` equivalent | disposition |
|---|---|---|
| `moros_map` `Hex`/`Chunk`/`Map` | none — **L13** makes it the **storage of record** | **stays**, no eighth slot |
| `map_write_field` / `map_read_field` | `hex_field::doc_write_all` / `doc_read` | **fix** — never builds an `EdgeSet`, so walls are gone before the format sees them |
| `map_to_stencil` / `stencil_into_map` | `hex_field::stencil_*`, `stencil_stamp_all` | half-migrated (#5) — the undo bracket is the remainder |
| `moros_editor::StencilDef` + JSON pair | `hex_field::Stencil` | **delete** once the library stamp has an undo bracket |
| `moros_editor` undo | `hex_editor`'s journal | **moves**, and becomes save + replay + sync (D4) |
| `moros_render` wall emit | `hex_draw::surface_quad` | **replace** — a second derivation of a shared table (`L11`) |
| `moros_sim/collide.loft` | `hex_edge::collide` / `passable` / `sweep_path` | **delete** — tunnels, parity-blind, single-storey (§1, §10.7–10) |
| `moros_sim/player.loft` | `hex_walk`, on `hex_edge` + `hex_body` | **delete and re-derive** — keep the feature shape, not the code |
| `player_physics.loft`'s `make_flat_map()` | a fixture *with walls*, both parities, 2 storeys | **replace the fixture** — a wall-free subject cannot detect a wall bug |
| `moros_sim` `tools.loft` / `editor.loft` | `hex_editor` tools + `moros_kit` | **splits** along D5's line |
| `moros_ui` panel / widgets / hit-test | `hex_editor`'s UI model | **moves** — the Workbench needs the panels, not our page |
| `moros_map` `SpawnPoint` / `NpcRoutine` / `NpcWaypoint` | `hex_anchor` (the **anchor**) + `moros_kit` (the **payload**) | **splits** — the cell+facing is ours, the creature table is content |
| `moros_render` picking | `hex_field::hex_at` (gated inverse) | keep **one**; they already agree |

---

## 10. Defects to clear on the way *(found while evaluating, 2026-07-25)*

1. **`make lib-test` is red** — `moros_ui` has no `loft.lock`; `glb` does not resolve
   transitively. One file. **W0.**
2. **`map_write_field` drops walls**, and `test_items_and_walls_do_not_survive_yet` is green for
   the wrong reason — it watches our round trip, not the format's capability, so it cannot fail
   while our own writer is what drops the data. **W0** (the round-trip obligation).
3. **Moros stores a door as material 0.** hexbody measured that this *breaks the wall run*
   (38 edges / 0 ends → 36 / 2); `X70` makes *an opening is never absence* a decision. Needs an
   opening material and an opening `wd_body` — **ours**, since `L13` makes us the palette's owner.
   **W4** — a door needs surfaces; until then it is a fixture defect.
4. **`wall_n` / `wall_se` are named for edges they do not hold** (NW / E) — #3.
5. **`map_set_wall_dir` directions 3/4/5 use parity-blind neighbour arithmetic** — #3, live code.
6. **loft's `73-universal-editor` states `hex_grid` is flat-top**; the shipped one is pointy-top
   odd-r. Raise it there — the doc, not the code, is wrong.
7. **No stale-construction defects found** — `C86` H-Copy, `H5`, `H6` and cross-package duplicate
   names are all **measured absent** (`SALVAGE.md` §2b). The cleanup work is duplication against
   the shipped libraries, not repair. Keeping it absent is `toolchain.loft`'s job, armed at S3b.
8. **`collide.loft` tunnels** — `move_blocked` tests start-hex vs end-hex only; a step crossing two
   boundaries yields `edge_direction = -1` → *open*. The fix is `hex_edge::sweep_path`, not a
   patch. **W2.**
9. **`edge_direction`'s S/SW/NW deltas are parity-blind** on offset coordinates — same class as #5,
   and it is on the live collision path. **W2.**
10. **Collision is hard-coded to `cy = 0`** in `floor_y_at` and `blocked_by_wall`, against seam
   rule 4 (*multi-layer is first-class, not opt-in*). **W2.**
11. **`player_physics.loft` cannot detect any of 8–10**: both probes use `make_flat_map()`, a map
    with **no walls**, so `test_frame_rate_independence` is structurally blind to tunnelling. The
    fixture is the defect. **W2.**

---

## 11. Probes to run before the design freezes

| probe | what it could falsify | cost |
|---|---|---|
| **The regime probe.** Paint one cell into `builtin_house_door`'s footprint, run `rebuild`. Does it fall to W2 with `ρ > 0`, or silently stay W1? | **D1** — if the regimes cannot be told apart on real content, the document design changes | minutes |
| **The dangling-anchor probe.** Put a door on the house, delete the wall it is on, and see what the model reports today | **II** and **W1** — establishes whether anything currently notices, which sets the milestone's size | minutes |
| **The `Ops` probe.** Flip the doored house and compare the door's `(side,t)` before and after | **II**'s leak 7 — hexbody gates the geometry's equivariance but nothing gates an attachment's | minutes |
| **The journal probe.** One edit touching model and field; undo; compare both digests; replay from empty | **W0**'s one-journal claim — undo/save/replay may not be one thing | minutes |
| **The message probe.** Write messages for five existing verbs (`tool_apply`, `undo_pop`, `stencil_placed`, `pick_hex_under_cursor`, `editor_save`). Does any need logic that is not already a method? | **D4** — a message needing new semantics means the capability is in the wrong layer | short |
| **The dirty-set probe.** Instrument one cell edit and count what re-derives today | **W0**'s frame budget, and whether `L3` is already violated | short |
| **The tunnel probe.** Build a map *with a wall*, run `player_step` at 5× walk speed and `dt = 1/10`, and see whether the player ends up on the far side | **§10.7** — confirms the replacement is needed rather than assumed, and becomes W2's control once it fires | minutes |

Run the first three before W1 is designed and all six before W0 freezes. Each is cheap enough that
guessing is the expensive choice.

---

## 12. Out of scope, said plainly

**The NPC model entirely — it lives in [`../crawler`](../../../crawler/VISION.md)**, which already
has much of it designed and tested (the *deciding what to do* half: scheduling, status timers,
needs, utility scoring, the driving economy — crawler's `roguelike-kit`, `EXTRACTION.md` Tier 3).
Not their goals, not their schedules, and **not the actors themselves**: an NPC acts on triggers as
an opaque subject, we answer geometric queries and model nothing (§1). **Moros-the-game will link
crawler's model; Moros-the-editor never will**, and no milestone in §7 depends on it existing.

**The payload side of every anchor** — the eligibility engine, trigger dispatch, condition
vocabulary, and **crew_punk's story trigger system entirely** (framing 3: their case falls outside this editor; our results fold into theirs).

**The sandbox, and the foreign half of a routine's symbol table** — the capability limit is loft's
(`65-scriptable-scenes` SC.4, enforced at parse time for a `script` target), and the names behind it
— NPCs, dynamic objects, game abstractions — are resolved by the host, never by us. **The editor
never parses a routine's source**; it validates a declared binding list and shows the rest as
foreign (§1).

Also: terrain **generation** (`hex_terrain`
exists; a producer, not an editor question) · dynamics and destruction (hexbody `G3`/`G6`,
unbuilt) · the orientation **morph** (`OD-1`, probably unnecessary) · crew_punk's session and
network layers · mesh export beyond the existing GLB path · roads — **`hex_way`'s `Track` is a
float world-space curve with no lattice anchoring**, so *"stencils carry roads"* is unverified and
roads are W1's whole subject and its measured risk.

## 13. The honest frontier, and the coordination facts

- **The host is unproven.** ~489 green tests, zero frames. W0 is where the real surprises are.
- **D1 is a hypothesis** until §11's first probe runs. **`re-derive-or-report` (II) is not a
  hypothesis but an unowned obligation** — nothing upstream defends it, which is why the anchor obligation is armed from W1.
- **Three trees hold three versions of this design** (§3). Until they agree, any of them can be
  cited to justify the wrong package. Reconciling loft's `73-universal-editor` and Workbench §9 is
  a **hand-off to loft**, not an edit we make there.
- **`EDITOR_SUBSTRATE.md`'s consumer table over-claims crew_punk**, listing it as an editor
  consumer needing *"a trigger engine that must be complete."* That is a requirement on **their**
  engine; what they need from **us** is a format and a callable door. Fix the table.
- **The multi-rig connector does not exist, and it is the second thing to raise upstream.**
  `hex_body` is a single parent-index tree; a train, a robot with a detachable limb, and a coupled
  wagon are all *two rigs joined at a point*, and no `Rig`-to-`Rig` type exists anywhere in the
  family. `SPEC` says hexbody must make `I10` **expressible** — so the primitive is theirs and the
  assembly document is ours, but W7 cannot be designed until that line is agreed. Raise it with the
  editor as the consumer asking, the same way reachability is raised with crawler.
- **Reachability preview is blocked by a gate that is not ours.** crawler's flow-field pathing is
  `EXTRACTION.md` **Tier 3 — "do NOT extract yet"**, earned by a second roguelike existing. The
  editor is a *different* kind of evidence than a second roguelike, so it is worth raising there
  (their `VISION.md` already names *"an editor previewing reachability wants it as much as a game
  does"*) — but it is **their call**, and the rule stands: never edit `../crawler`, raise and let
  them act. Meanwhile: do not build a second flow field.
- **`dryopea` is a real second consumer we have never built against** and is not checked out here.
  Bumper airplanes is the cheaper honesty check (the tools-as-data obligation, first violable at W2); dryopea is the truer one.
- **hexbody's palette gate reads our source every run** — `tests/palette.loft` parses
  `moros_map/src/types.loft`, `palette.loft` and `moros_render.loft` against `L13`'s claims, so a
  change to our cell shape turns *their* suite red.
- **Two agents share `loft-libs-world`** (now `main`). Every public name needs a crawler grep
  first; a build that breaks with nothing changed locally is a sibling commit until proven so.
- **The DoD clause none of the gates reach:** loft's `GOALS.md` — *"a thing is done when picking it
  up is fun."* A package can satisfy every check above and still be a fight to use, and by that
  standard it is not done.
