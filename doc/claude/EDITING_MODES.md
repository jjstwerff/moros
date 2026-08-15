<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# EDITING_MODES — what a key means depends on where you are and what you have chosen

**Status: designed 2026-08-11, not built.** Written from the user's requirements, and from a
divergence found while trying to build `press` without them.

> *"we have to introduce editing modes, when inside a house the placement of
> doors/windows/stairs (for second & lower floors) is possible. But outside a house there are
> different verbs, as is under ground tunneling/caves creation. A house in a cave will switch to
> houses again."*
>
> *"we will get more modes because we still lack ways to determine wall/door/window types and for
> example a castle will have their own set."*

> **This file is lavition's and is written to be MOVED.** It names no Moros concept.

---

## The two axes, and they are not the same axis

The single most important sentence here, because flattening them is a mistake this tree has
already shipped:

> **WHERE you are decides which VERBS exist. What you have CHOSEN decides what those verbs
> produce.**

| axis | answers | derived from | example |
|---|---|---|---|
| **the mode** | *which keys do anything at all* | **the author's position** — never set by hand | inside a house, `O` cuts a door; underground, there is no `O` and there is a tunnel verb |
| **the selection** | *what kind of thing this verb makes* | the catalogue — **what you are working on** | a door is oak-planked or a castle's iron-bound gate; the verb is the same |

⚠ **THE DIVERGENCE THAT PROVED THEY ARE TWO AXES.** Measured 2026-08-11 while wiring plan 22
`W4`. The wire spells openings `36:<kind>` where the kind is a **profile** — 0 flat, 1 round, 2
pointed, 3 segmental, 4 an oculus, plus tens for depth — and the handler **always** cuts with
`DOOR_MAT`. But `src/editor_run.loft` read the very same `O`/`P` pair as **door versus window**.

**Both are reasonable and they are answers to different questions**, and because there was nowhere
for the second question to live, the type got encoded into the KEY. That is why one verb needs six
keys today — `O` `P` `I` `U` `N` `M` are one gesture with six profiles — and why a seventh
profile would need a seventh key. ⚠ **A key table that grows with the CONTENT is the tell that a
selection is missing**, and it is exactly the shape [CATALOGUE](CATALOGUE.md) was built to fix:
*one list over parts and materials, and an always-visible line saying what you are working on.*

**So the catalogue is the selection axis, and it already exists.** What is missing is the mode.

---

## The mode is DERIVED, never set

> **The author does not choose a mode. The mode is a reading of where the author is standing.**

This is the same rule [CAMERA_INDOORS](CAMERA_INDOORS.md) landed on for the camera and for the
same reason: *the mode decides and `shelter_at` only observes*. A mode the author sets is a mode
that can be **wrong** — you stand in a cave with the house tools armed, and the first keystroke
does something no one asked for. A derived mode cannot disagree with the world.

⚠ **AND THE USER'S LAST CLAUSE IS THE WHOLE PROOF OF IT: *"a house in a cave will switch to houses
again."*** A set mode would need a rule for the nesting. A derived one needs none — it reads the
**innermost** enclosure and answers `house`, because that is what is true where the feet are.

**The instrument already exists.** `hex_editor::shelter_at(w, roofs, x, z, …)` is the query the
camera already uses to tell indoors from out; the mode is a second consumer of the same reading
rather than a second authority on it. ⚠ **Do not add a second enclosure test** — a camera that
thinks it is indoors while the verbs think it is out is the disagreement this rule exists to
prevent.

## The modes named so far

| mode | when | the verbs it adds | the verbs it removes |
|---|---|---|---|
| **outside** | no roof, above ground | terrain, roads, fences, place a house, place a part | doors, windows, interior stairs |
| **inside** | under a roof — a house, or a house built inside a cave | doors, windows, **stairs up and down** (a second floor, a cellar) | terrain gestures that would move the ground under the building |
| **underground** | below the surface, not under a built roof | **tunnelling and cave carving** | house placement, roads |
| **castle** *(and other sets)* | ⚠ **not a location — a SELECTION** | — | — |

⚠ **THE LAST ROW IS IN THIS TABLE TO BE CONTRADICTED.** *"A castle will have their own set"* is
about **types**, not about place: a castle's wall, door and window kinds are a different palette,
and an author may want them in a cottage. Putting it in the mode column would make the two axes
one again, four paragraphs after they were separated. **A castle is a selection.**

---

## The third layer: a house TYPE, and why it makes the table DATA

> *"so we eventually get house types that set defaults for windows/doors/floors and possibly even
> unique keys, so the system can grow."*

A **house type** — cottage, castle, longhouse — is two things at once, and the second is the one
that decides the architecture:

1. **A bundle of defaults.** Which door, which window, which floor, without the author choosing
   each. That is the *selection* axis with a name on it: picking `castle` picks a set.
2. **Possibly its own VERBS.** A castle may have a keystroke a cottage has no use for.

⚠ **AND THAT SECOND CLAUSE IS WHY `press` CANNOT STAY AN `if` CHAIN.** A key table written as
`if key == "H" { … }` grows a branch per type, in a library, forever — and "so the system can
grow" is precisely the requirement that it must not. The composition is:

```
the verbs available here  =  the MODE's base verbs          (where you are)
                          +  the current TYPE's own verbs    (what you chose)
                          ,  each producing the TYPE's defaults unless overridden
```

> **The invariant, and it is testable: ADDING A TYPE TOUCHES NO CODE.**
>
> A new house type is content — a declaration of defaults and, optionally, verbs. If adding one
> means editing a `.loft` under `lib/`, the table is not data yet and the system cannot grow.

⚠ **THIS TREE ALREADY HAS THE SHAPE TWICE, AND SHOULD NOT INVENT A THIRD.**
[PARTS](PARTS.md)' tagged sections are a declaration format an older reader skips by length, and
plan [21](../../plans/21-region-mappings/README.md)'s whole subject is that *a byte's identity
belongs to a REGION, not to the code that reads it*. **A house type is the same claim about
verbs and defaults.** ⚠ Read `21` before designing a new format here; a fourth way to say *what
this thing is called and what it is made of* would be the duplication those two exist to stop.

⚠ **AND ONE ORDERING CONSEQUENCE WORTH SEEING NOW:** a type that contributes verbs means the verb
set is not knowable at compile time, so *"which keys does this editor have"* becomes a **query**
rather than a constant. Anything that lists keys — the subject line, a help overlay, a script
validator, `tools/script.mjs` — has to ask rather than know. **That is cheap to design in and
expensive to retrofit**, which is why it is written down before `M1` is built rather than after.

---

## The mechanism: a KEY names a VERB, and the verb is bound underneath

> *"we need a system were we have a definition of keys but with a flexible layer under it."*

**Two levels, and the split is the whole design:**

```
  the DEFINITION      key  →  verb                 stable · declared · small · a person learns it
  ────────────────────────────────────────────────────────────────────────────────────────────
  the FLEXIBLE layer  verb + mode + selection  →  gesture + its parameters      data · grows
```

A key **never** names a gesture. It names a *verb* — `place`, `opening`, `step`, `ring` — and what
that verb does here is resolved underneath, from the mode (where you are) and the selection (what
you chose).

| | today | with the layer |
|---|---|---|
| `O` `P` `I` `U` `N` `M` | **six keys**, one gesture, the profile encoded in the key | **one verb `opening`**; the profile comes from the selection |
| a castle's gate | a seventh key, or a seventh `if` | the same verb `opening`, a different type bound under it |
| a type's own verb | impossible without editing a library | the type declares `(key, verb)` and the definition grows |
| remapping a key | not possible — the key IS the meaning | free, because a key only names a verb |

⚠ **THE SIX-KEY OPENING FAMILY IS THE PROOF THE LAYER IS MISSING, NOT AN INCONVENIENCE.** Every
one of `O P I U N M` calls the same gesture with a different profile number. They are not six
verbs; they are one verb and a selection that had nowhere to live, spelled as keystrokes because
that was the only surface available.

### ⚠ And it corrects something written above: THE WIRE CARRIES THE VERB, NOT THE KEY

The `W4` attempt built a `48:<key>` message so a keystroke could travel to the server intact.
**With this layer that is wrong**, and the reason is the definition's own purpose: *key → verb* is
the layer that belongs to the **person**, so it is the layer a person may remap. A remapped client
sending `48:O` to a server that resolves `O` itself would mean two different things at the two
ends — **the four-site divergence again, rebuilt on a new message.**

> **The key→verb map is resolved where the KEYBOARD is; the verb travels.**

So the message is `<id>:<verb>` — or in local mode, no message at all and the same resolution
in-process. That is what makes the two authority modes one editor
([PAGES_EDITOR](PAGES_EDITOR.md)) rather than two that agree by discipline.

⚠ **AND THE ID IS NOT `48`, WHICH THIS SECTION SAID TWICE.** `48` became **EYE** and `49`
**SELECT** on 2026-08-12, both while this paragraph sat unread — the next free id is **`50`**.
Left as a marker rather than quietly corrected: *a design naming a wire id it does not own yet*
is a small instance of the same class as a plan naming a file that has been deleted, and this
tree has shipped one of those too.

⚠ **A VERB IS THEREFORE A PUBLISHED NAME AND A KEY IS NOT.** Verbs go on the wire, into scripts and
into a type's declaration, so renaming one breaks recordings — `tools/scripts/*.keys` drives every
gate. A key is a local preference and costs nothing to change. **Name the verbs carefully and the
keys casually**, which is the opposite of how a key table reads today.

⚠ **AND `tools/scripts/*.keys` IS SUDDENLY A FORMAT QUESTION.** It is written in the keys a person
presses — its own header says so — which is the layer that just became remappable. A script naming
keys replays differently for two people; a script naming **verbs** does not. *Not decided here*,
and it is `M1`'s first real cost: every existing `.keys` script is a recording in the wrong layer.

---

## What this changes about `press` — plan 22 `W4`

`hex_editor::press(sess, w, a, key)` is a **flat table** today, and it is the wrong shape: it can
only answer *what does this key do* if that has one answer. It becomes:

```
verb_of(key)                   // the DEFINITION — resolved at the keyboard, remappable
press(sess, w, a, verb)        // the flexible layer, and what travels
  → mode_at(sess, w, a)        // outside | inside | underground — DERIVED
  → the binding for (verb, mode, selection)
  → the gesture, with the type's defaults
```

⚠ **`press` TAKES A VERB, NOT A KEY** — its current signature is the shape that made the wire
carry a key, and both are the same mistake one layer apart.

⚠ **AND `press`'s CURRENT CONTENTS ARE THE RUNNER'S, NOT THE SERVER'S.** Measured while wiring
`W4`: `press` was written from `src/editor_run.loft`'s six-key table, and the runner had diverged
from the server on **three** keys — the house's grade (fixed), `O`/`P`'s axis (this document), and
`F`/`G`'s ring reference plus the trunk it remembers. **The chokepoint is right and its contents
are provisional.** Reconciling them is what is left of `W4`, and it now has to be done *with the
modes in hand* rather than before them — flattening two axes a second time would just re-create
the divergence in one file instead of four.

## Open questions

1. **Does the mode change the SUBJECT LINE?** [CATALOGUE](CATALOGUE.md)'s line already says what
   you are working on and the server authors it. Saying *which verbs you have* is the same kind of
   fact, and an author who cannot tell why a key did nothing has the editor's one unrecoverable
   confusion. *Likely yes; wants the picture, not an argument.*
2. **What is "underground"?** Below the surface is not the same as *inside a carved space* — an
   author standing in a cellar is under a roof AND below grade, and the table above says `inside`
   wins. Whether a tunnel mouth is inside or underground is a real boundary and is **not decided
   here**.
3. **Does a mode ever REFUSE, or only omit?** A key with no verb in this mode can say *"no gesture
   here"* or say *"you would have to be indoors"*. ⚠ The second is strictly better and costs a
   sentence — this tree's own doorstep rule is *reason, offer, residual, never a blank no*.
4. **Where does a selection live?** The catalogue knows what is selected; `EditSession` holds what
   a scene is. A type that is not in the session cannot be replayed from a script, and
   `tools/scripts/*.keys` is how every gate drives the editor. *Wants deciding before `W4` is
   reconciled, because it changes `press`'s signature.*

5. **Do a type's verbs need to be REACHABLE from a script?** `tools/scripts/*.keys` drives every
   gate, and a verb only a browser can press is a verb no gate can test. *The answer is almost
   certainly yes, and it constrains the declaration format rather than the runtime.*

⚠ **NOT DESIGNED HERE, DELIBERATELY:** which types exist, what a castle's set contains, and how a
set is authored. Those are content and they belong with the catalogue and with plan
[21](../../plans/21-region-mappings/README.md), whose whole subject is that *a byte's identity
belongs to a region, not to the code*.

---

# The order of work, in steps that can each go red

Cut against [plans/README § What makes a step SAFE](../../plans/README.md#what-makes-a-step-safe--and-it-is-not-how-few-lines-it-is):
every step below names **what runs beside it** (the upper bound) and **what would surprise its
test** (the lower bound). A step with only one of those is not on this list.

⚠ **THE ORDER IS FORCED BY ONE FACT, NOT BY TASTE:** `press` today holds `editor_run`'s meanings
and the **server is the authority**, so *reconciling* comes before *restructuring*. Building the
verb layer on top of contents known to be wrong would bake three divergences into a new shape and
make them much harder to see.

## Phase 1 — reconcile what `press` already claims (before any new structure)

| step | what runs beside it | what would surprise the test |
|---|---|---|
| **`R1a` the pose carries the feet** — `Author` gains the ground height under it, supplied by the driver; `author_at` grows a parameter at **51 sites** | the current 3-field `Author`, until every site is moved | ⚠ a driver that forgets it passes 0.0 and every ring lands on the wrong layer — so the default must be **refused, not defaulted** |
| ✅ **`R1b` ring** — `press`'s `F`/`G` use the pose's height as the reference and record the **trunk** the server remembers for annexes | the explicit server-equivalent call, in the same test | a ring at a different reference height leaves different cells; a missing trunk means `K` cannot find the cylinder. **Both were silent** — see below |
| **`R2` opening** — ⚠ **BLOCKED, and that is the finding**: `O`/`P` cannot be reconciled until a **selection** exists, because the server's axis is a *profile* and `press`'s is a *material*. There is no correct flat answer | — | — |
| ✅ **`R3`** — delete `press`'s `O`/`P` branches and answer **`PR_SELECT`** for them, until `R2` can land | `editor_run`'s scripts, which use `O`/`P` | ⚠ **A DELIBERATE REGRESSION, and the honest one**: a key that does the *wrong* thing silently is worse than a key that says *"not yet"*. ⚠ **And measured, it cost NOTHING** — see below |

### ⚠ Why `R1` split: `press` CANNOT compute the reference, and a cycle is why

**Measured 2026-08-11, and it reshapes the step.** The server's ring passes `py` — the author's
ground height from `ground_under`, which is layer-aware and interpolates *within* a cell. `ref`
is not decoration: `fence_ring` → `fence_disc` → `wall_set` → **`edge_layer(wld, oq, orr, ref)`**,
so the reference picks **which layer the edge is stored on**. An approximation would put a fence
on the wrong storey.

⚠ **AND `ground_under` CANNOT MOVE INTO `hex_editor`.** It needs `terrain_y`, which needs
`hex_mesh::corner_heights` — and **`hex_mesh` depends on `hex_editor`** (`lib/hex_mesh/loft.toml`).
Moving it would be a **dependency cycle**, not a cone question this time.

> **So the reference is not the gesture's to derive. It is part of the author's POSE.**

Which is the right answer independently: *where the feet are* is a fact about the driver, and this
tree already says `es_author` is **a driver's pose, never the editor's** — a server writes it from
its walker, a test teleports. `Author` carries `x`, `z` and `yaw`; it should carry the ground
height too, and then `press` needs no mesher, no `hex_proj` and no cycle.

⚠ **THE SAME ARGUMENT COVERS THE ROOF PLAN**, which is still in the server's `MSG_HOUSE` for what
looked like a different reason (`HEIGHT_SCALE` living in `hex_proj`). ✅ **And that one has a
cheaper answer that was missed twice: `w.w_unit` IS the height scale, stored per world.**
`world_new(0.25, …)` and `hex_proj::HEIGHT_SCALE = 0.25` are the same number, and `hex_editor`
already depends on `hex_voxel`. ⚠ **The world's own unit is also the CORRECT one** — a part world
may be at another unit entirely (`door/slat` is `0.125`), so anything reaching for the global
constant on a part world is already wrong.

⚠ **`R1` IS THE TEMPLATE FOR THE REST.** Its test builds one ring through the server's helper and
one through `press`, in two worlds, and asserts equal `w_tau` **and** equal trunk state. That
shape — *two worlds, one assertion of equality* — is what every reconciliation step below reuses,
and it is the only thing that makes "make X match Y" checkable rather than plausible.

### ⚠ And `R1b` ran it — the template's own instrument was BLIND, both halves of it

**Built 2026-08-11.** The row said *equal `w_tau` and equal trunk state*, and **`w_tau` cannot
see the defect it was chosen for.** Two rings of the same radius write the same number of edges
whichever LAYER they land on, and each write changes something, so the edit clock is identical
for a fence on the deck and a fence in the yard below it. Neither can `ak_n`: it comes from
`fence_count`, which reads the world back **at the same reference it wrote at** — so a ring laid
entirely on the wrong layer counts a perfect 42 and agrees with itself. That is `wall_of`'s own
recorded warning arriving one caller up.

> **The instrument that can see it is `edge_layer` asked at the OTHER reference** — count the
> fence bytes on the ground while the author stands upstairs. 42 there is the bug; 0 is correct.

⚠ **AND THE FIXTURE HAS TO BE ABLE TO TELL THE TWO APART**, which a flat world cannot: with one
layer, `0.0` and the author's height name the same one and the test passes with the defect intact.
It asserts `edge_layer(w, 6, 6, au_y) != edge_layer(w, 6, 6, 0.0)` **before** it presses anything.
The same trap one scale down: the author stands **off the cell's centre** in the trunk test,
because a pose sitting exactly on `hex_to_px(6,6)` cannot distinguish *the cell's centre* from
*the author's own position*, and the sabotage that takes the pose's coordinates passes.

⚠ **"YAW FORCED TO 0.0" WAS A DIFFERENCE THAT IS NOT ONE.** The server builds
`author_at(px, pz, 0.0, py)` and `press` passes the real pose through — and a ring provably reads
no yaw (`fence_ring` takes `px_to_hex(au_x, au_z)` and hands a **cell** to `fence_disc`;
`trunk_of` does the same). So it is pinned by a test that rings twice at two yaws rather than by
copying a zero whose meaning nobody could check.

⚠ **AND THE TRUNK WAS TWO BUGS, NOT ONE MISSING FIELD.** `editor_server` rang the disc in
`do_fence` and remembered the cylinder **eleven hundred lines away** in its message loop, from the
PAYLOAD rather than from what was written, and **after `do_fence` had already returned on a
refusal** — so `23:9,2` (not a wall material) left a phantom trunk of radius 2 standing where no
edge had been laid, and a payload carrying no radius at all recorded nothing for a ring it did
lay. One call rings and records now (`ring_set`), and the four locals are the session's ninth
registry — which is also what puts it under part mode's *a part has no ring of its own*.

## Phase 2 — the selection, because `R2` cannot move without it

| step | what runs beside it | what would surprise the test |
|---|---|---|
| **`S1`** — a **selection** in `EditSession`: the current opening profile, door type, window type | ⚠ **NOT the byte round-trip — that premise was measured false, see below.** The selection is DRIVER state beside `es_author`, and its replay is the SCRIPT | ⚠ **`S1` alone cannot go red**, so it merges into `S2`: the field, the verb that sets it, and a consumer that reads it |
| ✅ **`S2a`** — the opening's **choosing** moves into `hex_editor::opening_make` | the server's `36:` handler, driven through eight scripts and diffed | ⚠ **the instrument is the server's own `println` stream, not `script.mjs`'s** — see below. 240 lines, identical |
| ✅ **`S2b`** — a verb that **changes** the selection, and the subject line says what is selected | the existing catalogue line, which the server already authors | ⚠ picking a profile must change what the next `opening` cuts — asserted by building two openings with different selections and diffing the **`Opening`**, never by reading the line. ⚠ **NOT the cells**: the store write is `DOOR_MAT` whatever the profile, so cells cannot see it |
| ✅ **`S3` = `R2`** — `opening` becomes ONE verb taking its profile from the selection; `O P I U N M` all resolve to it | the six old keys, kept and still sending `36:<kind>` | the six old keys and the one verb with six selections must produce **six identical worlds**. ⚠ This is the step that proves the collapse is lossless, and it is why the old keys stay until it is green |

### ⚠ `S1`'s premise was measured and it is FALSE — 2026-08-11

The row said *"the session is **saved and replayed**, so its round-trip is the test"*, naming
`world_to_bytes`/`world_from_bytes`. **None of the session is in those bytes.** The format holds
the header, the palette, the chunk directory, the voxels and the tagged sections that live in
`w_sections`; the nine registries are the editor's own and travel nowhere.

⚠ **AND THE LOAD PATH DID NOT CLEAR THEM EITHER, WHICH IS THE LIVE HALF.** Measured through the
socket: build a house, `8:` save, `9:` load a world with no house in it — and `37:` still built a
balcony, `annex kind 1 at (-2,1)`, on the wall of a cottage the store no longer held. `36:`
refused in the same breath, correctly, **because it reads the store**. Two authorities, one of
them describing a world that is gone, and the discriminator between them is *which one asks the
world*. ✅ **Fixed**: `session_scene_clear` is the one list both the load and the part-open take,
and the same probe now answers *"nothing to attach to"*.

> **So the selection is not world state at all.** It is what *this author* has chosen, which is
> `es_author`'s category — *a driver's pose, never the editor's* — and under multi-player two
> clients editing one world hold two selections. Putting it in the world's bytes would make one
> client's choice the other's.

⚠ **WHICH REMOVES `S1`'s ONLY TEST AND MERGES IT INTO `S2`.** A field nobody reads, whose
round-trip claim has evaporated, is the *built and never called* defect with a planning hat on —
[plans/README § the lower bound](../../plans/README.md#what-makes-a-step-safe--and-it-is-not-how-few-lines-it-is).
The field, the verb that sets it and a consumer that reads it are one step.

⚠ **AND THE REGISTRIES' OWN ABSENCE FROM THE FORMAT IS NOW AN OPEN QUESTION, not a bug fixed.**
Saving a world and reloading it loses every wall run, roof plan, leaf, opening, annex, prop, slab
and hole; what is drawn falls back to per-edge panels and a roof from cells. That is a format
plan, and it is where plan [17](../../plans/17-parts/README.md)'s two ◐ rows already sit.

### ✅ `S2a` — and the choosing had no way to be tested, which is what blocked `S1`

**Eighty lines of the `36:` handler are `hex_editor::opening_make` now** — the tens-and-twenties
reading, the projection onto the wall, the four profile branches and the niche host. Sixth gesture
out of the socket, same argument each time; the new one is that **an opening profile's only
possible consumer is the opening gesture**, and it could not be called from a test.

⚠ **THE FIRST INSTRUMENT MEASURED THE MACHINE.** Diffing what `tools/script.mjs` printed showed
differences, and every one was a `rebuilt N chunks` line moving: `key` sleeps 250 ms and then
reads *the last status line*, so which broadcast it catches is a race. The server's own `println`
stream is deterministic — **240 lines over eight scripts, identical**, only the per-run
`run-<n>.rec` id differing, covering profiles 1–4 and the embrasure.

⚠ **A PREDICTION WAS WRONG AND THE TEST IS BETTER FOR IT.** *"Halving the unit doubles the arch"*
measured **9 then 12**: the springing is a fixed count of height units, only the rise scales, and
the rise truncates. What is exact is the rise in WORLD units — never above the true semicircle,
within one of the world's own units below it — and that is the clause the hard-coded-0.25 sabotage
goes red on.

⚠ **AND ONE DEFECT WAS FOUND AND LEFT**: the handler's closing `opened a profile K hole` runs
after the embrasure branch too, so a refused embrasure says *"no niche to cut into"* and then
*"opened a profile 1 hole"* on top of it. A move is proved by the wire not changing, so the wire
cannot change in the same breath.

### ✅ `S2b` — and it is `S1` and `S2` in one, because a selection has ONE possible consumer

**Built 2026-08-12.** `EditSession` carries `es_open_kind`, `session_select_open` changes it,
and `session_opening` cuts with it — the field, the verb and the consumer in one step, because
`S1` on its own could not go red. ⚠ **And it only became buildable at `S2a`**: the gesture a
chosen profile feeds was eighty lines inside a socket handler.

⚠ **THE SELECTION IS NOT A REGISTRY**, and `session_scene_clear` deliberately leaves it alone.
The nine registries are records *about the store*; this is what THIS AUTHOR has chosen —
`es_author`'s category — so it survives a load and a part open. Choosing a round-headed door
and then opening a part must not silently hand you back a flat one.

⚠ **THE ADMISSIBLE SET IS NOT A RANGE**, which is why it is a predicate. The units are the
outline (`0..4`) and the tens the depth, so `5`, `15`, `25` and `30` are nothing at all: a
`0..24` bound waves through **nine** kinds no branch of `opening_make` answers, and the author
gets a flat door wearing a number they chose on purpose. Five outlines × three depths = 15.

⚠ **AND `36:<kind>` DOES NOT MOVE THE SELECTION.** A bare `36:` cuts what is chosen; a `36:2`
cuts a pointed one and leaves the choice where it was. A key that silently re-chose would make
*what am I working on* depend on what you last pressed — which is the question the subject line
exists to answer, and it now carries `· opening <kind>`.

⚠ **THE CLAIM IS THE `Opening`, NOT THE LINE** — three selections cut three openings that differ
in outline and depth and agree everywhere else, in `lib/hex_editor/tests/opening.loft`. The
subject line's own rows are in `subject.mjs`, beside `40:`'s, including that a **refused**
selection sends no `H:` and leaves the standing choice intact.

### ✅ `S3` — the collapse, and the fork it turned on

**Built 2026-08-12.** `O P I U N M` reach ONE gesture — `session_open_kind` — instead of six
branches, and `R3`'s deliberate regression is retired: the opening keys are ordinary gestures
again. The equality is the row's own: for each of the six, **pressing the key and
selecting-then-cutting leave the same world and the same session.**

⚠ **THE FORK, AND IT IS WORTH THE PARAGRAPH.** The obvious reading of *collapse* is that a key
means **choose this and cut it** — the way picking a brush works, and defensible: pressing `N`
arguably IS what you are now working on. It was **refused**, because `36:<kind>` on the wire does
not move the selection either, and a key that re-chose in one driver and not the other would
leave **different sessions from one keystroke while leaving identical worlds**. The equality test
that proves the collapse looks at worlds — so that divergence would have hidden under a green
test, which is the exact shape `W4` exists to prevent. The key stops carrying a profile at `V1`,
by which time `K1`–`K3` have converted the scripts to `select` + `opening`.

⚠ **THE TABLE IS WRITTEN OUT ON BOTH SIDES, NOT DERIVED.** The test names the wire's own values —
`1 2 3 4 11 21`, from `script.mjs`'s KEYMAP — beside the keys. Deriving both sides from one list
is a table checked against itself, and `W4`'s finding is that **four** tables disagreed.

⚠ **AND THE CONTROL IS THAT THE SIX ARE NOT ONE HOLE.** An `open_press` wired to a constant
satisfies every equality above; a second test requires `O P I U` to cut four different outlines
and `N` to cut **the first outline again at another depth** — the family's own claim that `11` is
`1` stopped short.

⚠ **A SABOTAGE AIMED ELSEWHERE FOUND A REAL DEFECT**: pressing `M` with no niche came back as
`refused: ` **with nothing after it**. The library left `om_why` empty because the SERVER composes
that sentence — right for the wire, useless to a runner or a page. *Reason, offer, residual, never
a blank no* applies to every driver, so the reason lives in `opening_make` now and the server's
key-naming wording still branches on `om_code`.

## Phase 3 — the verb layer

| step | what runs beside it | what would surprise the test |
|---|---|---|
| ✅ **`V1`** — the verb vocabulary **and** `verb_of(key)` **and** a `press` that takes a verb, in one step | `press(key)`, unchanged and still called | for every key: `press(key)` and `press(verb_of(key))` leave worlds with equal `w_tau`. ⚠ **The declaration alone is NOT a step** — a table checked against itself cannot be surprised |
| ✅ **`V2a`** — the server's `MSG_HOUSE` | the key form everywhere else | a literal `"H"` carries no profile, so this site could move first |
| ✅ **`V2b`** — `editor_run`, and it was the **last production caller of `press(key)`** | `tools/script.mjs`, which has not moved | ⚠ not an equality — the equalities cannot see this step. `probe/k1` check `G`: choose POINTED, press `O`, and the *selection* decides |
| ✅ **`V3`** — delete `press(key)` | — | ⚠ not "the suite is green" — a deletion makes tests pass by removing their subject. The instrument is the **test-name diff**, and every retirement names where its claim went |

### ✅ `V1` — and the row's own instrument was too weak, measured

**Built 2026-08-12.** `verb_of(key)` and `press_verb(sess, w, a, verb)` sit beside `press(key)`,
which is unchanged and still called; `lib/hex_editor/tests/verb.loft` drives **every one of the
eleven keys through both layers**. Six verbs: `raise` · `lower` · `place` · `opening` · `fence` ·
`wall`. Six sabotages seen red.

⚠ **THE ROW SAID `w_tau` AND `w_tau` CANNOT SEE A MATERIAL.** A fence ring and a wall ring write
**the same edges of the same disc**, each write changing something — so the edit clock reports the
same number for two different worlds, and every equality in this step would have passed with
`verb_of("G")` returning the fence verb. The comparison is **the whole world as bytes**
(`world_to_bytes`, which is `W1`'s encoder getting its second consumer): the swap shows at **byte
7590**. ⚠ **And the blindness is a TEST, not a note** — `test_the_edit_clock_cannot_tell_a_fence_
from_a_wall` asserts the two rings leave equal `w_tau` *and* different bytes, so the day the
counter stops being blind, the row that justifies encoding a whole world says so itself.

⚠ **AND THE BYTES ARE BLIND TO THE PROFILE, WHICH IS THE OTHER HALF.** Wiring `press_verb`'s
opening to a constant instead of the selection leaves the six worlds **byte-identical** — because
`open_ahead` writes `DOOR_MAT` whatever the kind, and the outline lives in the session's `Opening`
where the renderer reads it. The sabotage was caught by the session comparison, not the store one.
**A stronger world instrument did not remove the need for the session half**, which is `S3`'s
finding standing up to a better tool rather than being retired by it.

⚠ **`fence`/`wall` AND `raise`/`lower` ARE EACH TWO VERBS, FOR OPPOSITE REASONS.** A direction is
part of the action — every editor has *zoom in* and *zoom out* — so `raise` and `lower` stay two
verbs however far the layer grows. A **material** is not: `fence` and `wall` are one `ring` verb
waiting for a selection to hold the material, exactly as the opening family waited for
`es_open_kind`. ⏭ **And the step cannot be taken early**: the equality goes red on one of the two
the moment `verb_of` maps both keys to one verb, so the decomposition is enforced by the test
rather than by anybody remembering it.

⚠ **`verb_of` IS DELIBERATELY NOT INJECTIVE, AND THE KEY IS NOT RECOVERABLE FROM THE VERB.** Six
opening keys answer one verb, so a script that says `opening` and never says `select` cuts whatever
was last chosen. That is the collapse finishing — the key stops carrying a profile **here** — and
it is why `K1`–`K3` convert the scripts to say both before `V3` deletes `press(key)`.

### ⏭ And that reorders `V2`: the runner CANNOT see the regression it would cause

**Measured 2026-08-12, before writing a line of `V2`.** The phase table says `V2` moves
`editor_run` first. Run it and the ordering falls over:

- `tools/scripts/house.keys` presses `O` **and** `P`, and since the `eye` step moved its poses onto
  the wall's perimeter **both now cut** — `O: 1`, `P: 1`, τ 3911. (The *"house.keys cuts no door
  and no window"* defect is closed; a plan reading that sentence forward would pick the wrong
  script.)
- Resolving them through `verb_of` makes both say `opening`, so `P` cuts a **round** head where it
  cut a pointed one — a real regression.
- ⚠ **And every instrument the runner has is blind to it.** `open_ahead` writes `DOOR_MAT` whatever
  the kind, so the world is **byte-identical**; the outline lives in the session's `Opening`, and
  `S1` measured that **none of the session is in the world format**. The transcript cannot see it
  either — `ak_n` is `1` for all six.

> **So `V2` on a script-reading caller is blocked on `K1`+`K2`, not the other way round.** Either
> the script says `select 2` before `opening`, or the runner grows a session read-back. Taking
> `V2` first would land a silent profile regression **under a green `headless-same`** — the exact
> shape `W4` exists to prevent, one layer further out.

✅ **The server's `MSG_HOUSE` site is the exception, and it has moved** (`V2a`, same day): it
passed a literal `"H"`, which carries no profile, so `verb_of` throws nothing away there — and
the wire already agreed, since `MSG_HOUSE` carries no keystroke at all. `make headless-same` is
green and its sabotage (`VB_FENCE` at that site) red, printing `served:` empty against the
runner's `house placed 27 cells, 84 wall edges, ridge at 21`. **That also retires the "built and
never called" state `V1` would otherwise have held across a session boundary** — this tree's
commonest defect, and the reason `V2a` was not left for later.

### ✅ `V2b` — the runner resolves through `verb_of`, and no equality could see it

**Built 2026-08-12.** `src/editor_run.loft`'s `key` branch is
`press_verb(sess, w, a, verb_of(rest))`, and it was the **last production caller of
`press(key)` in the tree** — the server moved at `V2a`, and `editor_client` never called it.

⚠ **THE STEP'S OWN CLAIM IS INVISIBLE TO EVERY EQUALITY BUILT FOR IT.** `probe/k1`'s A, B and C
compare a key spelling against a verb spelling that **chose what the key already meant**, so
they agree whether or not the runner resolves through `verb_of`. The check that can fail is
`carried.keys`: choose **pointed**, then press `O` — the key that used to mean *round* and
nothing else — and read the kind back out of the session. **Seen red on the old line** (`cut
kind 1`) before the change, green after.

⚠ **AND THE FIXTURE HAD TO BECOME VALID ON BOTH SIDES OF THE CHANGE.** `keyed.keys` pressed
`key P` with no `select`, which is the *old* meaning written into a file — so the day the runner
moved, check B went red on a **script** rather than on a defect. It selects before it presses
now: before the step the key already meant what was chosen, after it the key means whatever is
chosen, and the same file passes both ways. **A fixture that only encodes the old meaning turns
a correct step into a red suite**, and that is a fact about the fixture, not about the step.

⚠ **ONE CHECK TURNED OUT TO BE READING THE FIXTURE, NOT THE SYSTEM.** `D` required the two
spellings to end on **different** standing selections — true only because `keyed.keys` never
said `select`. Once it had to, the difference evaporated. The claim underneath is `S3`'s and is
unchanged, so it moved to where it can be stated directly: **select 2, press `O`, and the
selection must still be 2.** A key cuts; it does not re-choose.

⏭ **`tools/script.mjs` HAS NOT MOVED, AND ITS `key O` STILL SENDS `36:1`.** `V2` takes one
caller at a time, so the runner and the wire disagree about what `key O` means until `V3`
deletes the key form. That divergence is **bounded by `K2a`**: no script presses an opening key
any more, so nothing exercises it. Stated here rather than discovered later.

### ✅ `V3` — the chokepoint is deleted, and a green suite is the wrong instrument

**Built 2026-08-12.** `hex_editor::press(key)` and its private `open_press` are gone. What a
key means is two levels now and nothing else: **`verb_of(key)` names a verb, `press_verb(…,
verb)` runs it**, and a caller resolves in that order.

⚠ **A DELETION MAKES TESTS PASS BY REMOVING THEIR SUBJECT, so "the suite is green" says
nothing.** The instrument is the **test-name diff** — 40 functions before, 36 after, every
change accounted for:

| retired | where the claim went |
|---|---|
| `…_every_direct_key_resolves_through_the_verb_layer_to_the_same_world` | **spent.** It compared two bodies as BYTES; one body is gone, so it would now be a tautology |
| `…_the_opening_family_is_the_verb_plus_the_selection` | **spent**, same reason |
| `…_the_six_opening_keys_are_one_verb_with_six_selections` | **spent**; what it protected is `opening.loft`'s `…_the_selection_decides_what_the_next_opening_cuts` |
| `…_the_six_keys_cut_six_different_things` | ✅ **MOVED** to `opening.loft` as `…_the_five_outlines_the_family_can_select_cut_five_different_things` — over kinds instead of keys |
| `…_an_unmapped_key_is_named_rather_than_refused` | `verb.loft`'s `…_a_key_that_is_not_a_gesture_names_no_verb` **+** `…_an_unbound_verb_is_named_rather_than_refused`; their composition **is** the row |
| `…_every_mapped_key_is_reachable` | `verb.loft`'s `…_every_verb_the_definition_produces_is_bound`, over the same eleven keys through `verb_of` |

⚠ **AND THE "WHERE THE CLAIM WENT" COLUMN IS MEASURED, NOT ASSERTED.** Three sabotages, each
red on the row that inherited a retirement: `session_opening` wired to a constant kind →
`…_the_five_outlines…` reports `1 2 3 4 cut outlines 1 1 1 1` (**the moved control still catches
exactly what it was written to catch**); `verb_of("W") = VB_PLACE` → `…_names_no_verb`; and
`verb_of("G")` unbound → `…_every_verb_the_definition_produces_is_bound`. Without those, *"the
claim is held next door"* is a sentence, and this tree has shipped a gate whose header described
coverage that had already moved.

⚠ **THE NAME `press` IS DELIBERATELY NOT REUSED.** `press_verb` could take it now that nothing
collides — and both forms are `(sess, w, a, text)`, so a stale `press(…, "H")` would **compile,
run, and answer *not a gesture* at runtime** instead of failing to build. The longer name is the
only thing that distinguishes the two layers to a reader or to a compiler; the design's *"a
rename is free here"* was about collision, and free is not the same as valuable.

⚠ **AND ONE ROW SURVIVES THAT CANNOT BE SURPRISED, WITH ITS LIMIT WRITTEN DOWN.**
`…_the_definition_names_the_verb_each_direct_key_is_written_to_name` is a declaration checked
against a hand-written second declaration: edit both the same way and it stays green. It is kept
because it is the only place the key→verb table is stated in words, and it is honest **only
beside** the two rows that can fail — the five verbs building five different worlds, and every
verb the table can name being bound.

## Phase 4 — the mode, derived

| step | what runs beside it | what would surprise the test |
|---|---|---|
| **`D1`** — `mode_at(sess, w, a)` computed and **consulted by nobody**; a gate logs it every frame of an existing run | every current verb, unchanged | ⚠ **the parallel run for a derived VALUE**: assert the derived mode never contradicts `shelter_at` over a whole scripted scene — including the house-in-a-cave case, which is the one the user named and the one a set mode gets wrong |
| **`D2`** — verbs consult the mode: a verb with no binding here **says why** | `D1`'s log, now an assertion | a verb silently doing nothing. ⚠ *Reason, offer, residual, never a blank no* — the doorstep rule, applied to a keystroke |

⚠ **`D1` IS UNCALLED CODE ON PURPOSE AND STILL PASSES THE LOWER BOUND**, which is worth being
precise about: it can go red for a real reason (the mode disagreeing with `shelter_at` on a real
scene), so it is a measurement rather than a declaration. **If its assertion were "the function
returns one of three values", it would be a self-test and it would have to merge into `D2`.**

## Phase 5 — the scripts, and the types

| step | what runs beside it | what would surprise the test |
|---|---|---|
| ✅ **`K1`** — `tools/scripts/*.keys` accepts **both** spellings, `key H` and `verb place` | every existing script, unchanged — **no gate moves on the day the format changes** | ⚠ **the row said *diff the world* and that instrument is blind here** — see below. Both drivers, compared on the world AND on the session |
| ✅ **`K2a`** — convert the presses that LOSE information: the 18 opening keys in 8 scripts | the key form, still accepted; every other key untouched | ⚠ three instruments, because the first two are blind to a niche's depth — see below |
| **`K2b`** — convert the rest | — | blocked: `press` has no verb for `R`, `E`, `B`, `J`, `X`… — twelve keys, and `K3` cannot start before they exist |
| **`K3`** — drop the key spelling | — | nothing uses it: a grep over `tools/scripts/` |
| **`T1`** — a **type** declares defaults and, optionally, `(key, verb)` pairs | the built-in set, until a declared type reproduces it exactly | ⚠ **the invariant**: a type added as *data* must reproduce today's cottage byte for byte in `make parts`. If that needs a `.loft` edit, the table is not data yet |

### ✅ `K1` — and the row's own negative control was blind, again

**Built 2026-08-12.** Both readers take `verb <name>` and `select <kind>`:
`src/editor_run.loft`, which calls the gestures, and `tools/script.mjs`, which drives the
socket. `probe/k1/run.sh` (`make probe-verbs`) runs a twin pair of scripts —
`keyed.keys` and `verbed.keys`, the same six gestures in both spellings — through **both**
drivers and compares them exactly.

⚠ **THE ROW SAID *"run one converted script and its original and diff the world"*, AND THAT
CANNOT SEE THE ONE MISTAKE A CONVERSION MAKES.** `key P` becomes `select 2` + `verb opening`,
and writing `select 1` there leaves a world equal **byte for byte**: `open_ahead` writes
`DOOR_MAT` whatever the profile, the head is in the session's `Opening`, and `S1` measured
that none of the session is in the world format. The row's instrument was the same one `V1`
had already caught being blind, one layer out — a phase table can carry a blind control
forward for as long as nobody runs it.

> So `editor_run` grew the **session read-back** this section already named as the
> alternative to converting the scripts. It turns out to be needed *for* converting them: it
> is what makes `K2` an assertion rather than a hope, and it is what `V2b` will read.

⚠ **AND THE READ-BACK IS CHECKED AGAINST SOMETHING IT SHOULD FIND BEFORE IT IS BELIEVED.**
`wrong.keys` is `verbed.keys` with one character changed. Control `C` requires **both** halves
at once — the same world (so the store really is blind, and the argument for reading the
session back is a measurement) and a **different** scene (so the reader is not blind too).
Either half flipping is worth saying out loud: the first would mean the store had learned to
carry a profile.

⚠ **THE TWO SPELLINGS MUST END ON DIFFERENT SELECTIONS, AND THE PROBE ASSERTS IT.** `key O`
`key P` finishes holding the selection it started with — a key does not re-choose, which is
the fork `S3` refused — while its verb twin finishes holding `2`. The digest prints the
standing choice on its own line for exactly that reason: it is `es_author`'s category, *this
driver's choice, never the editor's*, and the twins agreeing on it would mean a key had
silently re-chosen.

⚠ **`script.mjs` GAINED A SIX-ROW TABLE AND THIS IS NOT A FIFTH SITE.** `KEYMAP` says what a
KEY means, which is the fact `W4` exists to unify; `VERBMAP` says which message id implements
a VERB, which is a fact about the wire and is that file's own business — it drives a socket,
so something there names a message id. What it does **not** hold is a profile: the six
opening keys are one row now, and which head a door gets stopped being something a JS table
knows. ⏭ It is deleted rather than converted on the day the wire carries a verb.

⚠ **AND `verb` SENDS AND READS EXACTLY AS `key` DOES, DELIBERATELY.** `K1`'s bar is that *no
gate moves on the day the format changes*, so a converted line has to put the same sentence in
the transcript at the same moment.

⚠ **THE WIRE HALF NEEDS TWO INSTRUMENTS FOR THE SAME REASON THE HEADLESS HALF DOES, AND THEY
ARE BLIND IN OPPOSITE DIRECTIONS.** Sabotaged, not argued: `VERBMAP.wall` pointed at the fence
message leaves **all six server sentences identical** — `do_fence` reports `fenced 42 edges …
radius 3` for a fence ring and a wall ring alike — and the world the server saves differs at
byte 54068. `VERBMAP.opening` pinned to `36:1` is the mirror: byte-identical world, and the
sentence reads `opened profile 1` where the original said `2`. **Neither gap was reachable by
reading the source — nobody notices what a `println` leaves out.**

⚠ **`select` WAITS FOR AN ANSWER RATHER THAN SLEEPING, AND `ack` HAD TO LEARN A LIST.**
Choosing can be refused (`5` is not an opening kind), and waiting on the success wording alone
turns a refusal into a timeout — the instrument reporting *nothing arrived* where what arrived
was the answer.

### ✅ `K2a` — and it split, because only one family loses anything

**Built 2026-08-12.** The 18 opening presses across 8 scripts are `select <kind>` + `verb
opening` now. **Every other key was left alone**, and that is the step's own shape rather than
laziness: `verb_of` is one-to-one everywhere except the opening family, so those 18 are the
only presses `V2b` could silently regress. Converting `key ArrowUp` (77 of them) changes a
spelling and nothing else, and it cannot even finish — `press` has no verb for `R`, `E`, `Q`,
`B`, `C`, `J`, `K`, `V`, `Y`, `T`, `X` or `Z`. **`K3` is blocked on those twelve, not on `K2`.**

⚠ **THE EIGHT SCRIPTS HAVE NO GATE BETWEEN THEM.** The suite drives `cache`, `indoors`,
`cellar`, `clientmesh` and `deck`; `annex`, `door`, `embrasure`, `furnish`, `house`, `niche`,
`opening` and `profiles` are run by hand. So `make gate` staying green says nothing about this
conversion, and `probe/k2/` (`make probe-convert`) is their only check: each script beside a
committed baseline of itself, both driven through a server.

⚠ **AND BOTH WIRE INSTRUMENTS ARE BLIND TO A NICHE'S DEPTH — MEASURED, NOT SUSPECTED.** The
server prints `om_kind`, whose own field comment reads *"the profile, after the tens and
twenties are read off"*, so a doorway, a **niche** and an **embrasure** all report `opened
profile 1`; and the store gets `DOOR_MAT` whatever the depth, so the saved worlds are
byte-identical. Sabotaged to prove it: `niche.keys` converted with `select 1` three times where
it meant `1 11 11` leaves **all six sentences identical and the world at the same md5**. Only a
third check — the kind sequence, read out of `script.mjs`'s own `KEYMAP` and walked with the
selection carried forward — goes red.

> ⏭ **That is also a live wording defect, recorded and not fixed here.** An author who cuts a
> niche is told exactly what an author who cut a doorway is told. `S2a` froze this sentence on
> purpose while the choosing moved; naming the depth is a change to make deliberately.

⚠ **AND THE HEADLESS RUNNER COULD NOT STAND IN, WHICH WAS THE FIRST IDEA.** `K1`'s session
read-back is precisely the instrument that sees a depth — and `press` has no `R`, so seven of
these eight scripts build **no wall at all** in `editor_run` and every opening in them is
refused with *"no wall here to open"*. The strongest instrument in the tree had nothing to look
at.

⚠ **ONE SCRIPT CARRIES THE SELECTION FORWARD ON PURPOSE.** `niche.keys` chooses `11` once and
cuts twice, because a selection stands until something moves it — that is what makes `select` a
tool rather than an argument. The check walks the selection rather than expecting one `select`
per opening, or it would have called the idiomatic script wrong.

⚠ **`T1` IS WHERE THE SYSTEM STARTS TO GROW, AND IT IS LAST FOR A REASON.** Every step above
narrows what a type has to be able to say; declaring the format first would be designing a
container for contents nobody has measured. ⚠ **And it must not invent a fourth declaration
format** — [PARTS](PARTS.md)' tagged sections and plan
[21](../../plans/21-region-mappings/README.md)'s region palettes are two ways this tree already
says *what this thing is called and what it is made of*.

---

## ⚠ What this order costs, said plainly

**`R3` ships a regression on purpose** — `O` and `P` stop working in `editor_run` until `S3`. That
is the price of not baking a known-wrong meaning into a new structure, and it is small precisely
because the wire path (`36:<kind>`) is untouched: the server, the gates and the client keep
cutting openings exactly as they do today. **Only the runner's shortcut goes dark, and it says so
out loud.**

⚠ **The alternative — reconcile `O`/`P` to *something* now and fix it at `S3`** — is the one to
refuse. It would make the equality test at `S3` compare against a value invented at `R2`, so the
step that is supposed to prove the collapse lossless would be proving it against a guess.

### ✅ And the price, once it was measured, was a sentence — 2026-08-11

**`R3` is built, and the regression it was priced for does not exist.** `tools/scripts/house.keys`
is the only script `editor_run` is driven over (`make headless-same`), and its `O` and `P` were
**already refused** — *"no wall here to open — stand against one"* — so the world the runner
writes is **byte-identical** before and after, τ 3909 both. Only the wording changed, and it got
better: *"an opening needs a profile, and nothing selects one yet"*.

⚠ **AND THE THIRD ANSWER IS NOT `PR_NONE`.** `PR_NONE` means *this key is not a gesture* — a walk
key, a camera key — and saying that about `O` tells a reader the editor cannot cut an opening,
which is false: the wire cuts one on every `36:`. So `press` grew **`PR_SELECT`**, a refusal with
a reason, and `O`/`P` stay on the *is a gesture* list. That is the doorstep rule (*reason, offer,
residual, never a blank no*) applied to a keystroke, and it is a deliberate deviation from this
row's original wording, which specified `PR_NONE` and the sentence *"no gesture for key O"*.

⚠ **THE TEST THAT CAN SEE IT IS A MATERIAL, NOT A REFUSAL.** *"`press` answers `PR_SELECT` for
`O`"* is a table checked against itself. The claim underneath is a byte: **`WINDOW_MAT` had
exactly one writer in the whole tree**, and it was `press`'s `P`. The wire's `36:<kind>` always
cuts with `DOOR_MAT` — the profile is recorded beside the store, not in it — so a window material
on an edge was a world the server cannot produce. The test presses every key `press` accepts and
requires none of them to leave one, with the same fixture opened by hand as the control.

⚠ **AND IT PASSED FIRST TIME FOR THE WRONG REASON.** All seven keys pressed into ONE world left no
`WINDOW_MAT` the counter could see — because `ArrowUp` and `H` move the ground, `open_ahead` takes
its own reference from the ground it finds, and the reader was then looking at a layer the write
had left. One fresh world per key, and the control sharing that fixture exactly, is what made the
zero mean anything. **That is the `R1b` fixture trap again, one step later.**

### ⚠ A live defect fell out of it: `house.keys` cuts NO door and NO window, in either driver

Measured on both, 2026-08-11. The ladder's own *"does it read as a house"* script says *"a door
and a window in its near wall (stand ON the wall's own cells)"* and stands at `-3 -1` and
`-1 -3` — where **both drivers answer *"no wall here to open"***. So `shots/s6-house.png` has
never had either. **It is the pose, not the gesture**: the same house opens from `-3 2` (profile 1
at cell `(-2,1)`) and from `-6 -1` (at `(-4,-1)`), both measured through the server.

⚠ **NOT FIXED HERE ON PURPOSE.** Choosing the pose is composing a PICTURE — the working poses
found so far cut into the face the script's camera cannot see — and its acceptance is *does a
person call it a door*. That wants the user's eyes, not a coordinate that makes a log line
appear.

---

# Phase 6 — the keyboard is the PERSON's, and the verbs are visible

> *"I want a layer where the user can rebind keys and we can present the possible verbs like
> world-of-warcraft in a way that doesn't take up too much screen space (not that all verbs need
> to be number bound)."*

**This is the phase this whole document was written for**, and it could not start earlier: a
recording written in keystrokes replays differently for two people, so every
`tools/scripts/*.keys` had to say `verb <name>` first. Plan 22 `K3` finished that on 2026-08-15.

> **THE INVARIANT: a key is resolved to a verb exactly ONCE, where the keyboard is, out of a table
> the person owns — and nothing downstream can tell which key was pressed.**

The second clause was already true below the resolution — the wire carries the verb, `press_verb`
never sees a key — which is what makes rebinding cost nothing at the far end.

## ⛔ The measurement that started it: FOUR sites, and one of them is wrong on screen

Counted 2026-08-15. The fourth row is what turns this from tidiness into a defect:

| # | site | what it asserts |
|---|---|---|
| 1 | `hex_editor::verb_of` | an `if` chain — the authority |
| 2 | `editor_client.loft`'s `KEY_*` constants | a physical code per key |
| 3 | …the poll block beside them | the **same key again as a string**: `gl_key_pressed(KEY_STOREY_UP)` then `verb_of("B")`. ⚠ The file's own comment called this *"the last place this step could hide one"* |
| 4 | `client_panel_spec`'s toolbar | a hotkey **glyph** per button, as a literal |

⛔ **Three of row 4's glyphs are WRONG and have been drawn on screen for months**: `e` beside
*Stencil* where `e` is `stair_up`, `c` beside *Cart* where `c` is `cellar`, `f` beside *Field*
where `f` is `fence`. A literal glyph is connected to nothing that could disagree with it, so
nothing did. **That is the argument for the whole phase in one row**: the binding was not data, so
the picture of it was free to lie.

## The two calls, and why each went the way it did

| | |
|---|---|
| **slots are NOT numbered** | The bar shows *whatever key the person bound*, and there is no `1..9` convention. WoW's numbers are a consequence of its bars being pages of a fixed size; here a verb has a letter because a letter is what an author's hand is already on. ⚠ This is the *"not that all verbs need to be number bound"* clause, and it is also what makes the bar a **view of the binding** rather than a second binding surface. |
| **the bar shows the verbs available HERE** | Which is the design's own answer to *doesn't take up too much screen space*: `keymap_verbs` is a **query**, and once `D1` lands the mode narrows it — inside a house you have openings, stairs, annexes and seats, outside you have terrain, roads and placement. ⏭ Until then it lists all bound verbs and the compactness arrives free. |

## ⚠ And one row per verb, which frees eight keys

`verb_of` bound **23 keys to 15 verbs**: `O P I U N M` all answer `opening`, `Y T` both `seat`,
`J K V` all `annex`. Those are not eight bindings — they are `S3`'s collapse leaving the old keys
in place, and each does exactly what its primary does, because the profile they used to carry
comes from the selection now. **A definition with six `opening` rows draws six identical slots in
a bar and six identical rows in a rebinding list**, which is a surface a person cannot use.

⛔ **So the table is one row per verb and those eight are free — a behaviour change, measured
rather than assumed safe.** Nothing in production resolved them: every `.keys` script says
`verb <name>` since `K3` (`probe/k2` check 14 keeps the grep), and the client's `o`/`p` send
`36:1`/`36:2` straight to the wire and have never reached `verb_of`.

## The steps

| step | what runs beside it | what would surprise the test |
|---|---|---|
| ✅ **`M1`** — the definition as DATA: `KeyMap`, `keymap_default()`, rebind, and both drivers read it | ⚠ **`verb_of`'s `if` chain, kept as an independent body** — `verb_of(k) = verb_in(default, k)` would be a tautology, which is `V1`'s lesson one layer down | the two disagreeing on **any key in the universe**, not on a list somebody remembered: 26 letters, 10 digits, 7 named keys and six things that are not keys at all |
| **`M2`** — the verb bar: `lavition_ui` lays out slots from data, the client draws it | the panel, unchanged | ⚠ a bar whose key glyphs come from anywhere but the map — the row-4 defect rebuilt one widget over |
| ✅ **`M3`** — rebinding from the editor: arm, pick a slot, press a key | the default map | a collision reported as a refusal. ⚠ *Every* letter is taken, so **displacing is what rebinding IS**; refusing would make the feature useless. ⛔ **AND THE ROW THAT MATTERED WAS NOT THIS ONE** — see below |
| **`M4`** — delete `verb_of` | — | ⚠ not "the suite is green" — a deletion makes tests pass by removing their subject. `V3`'s instrument: the **test-name diff**, with every retired claim named where it went |
| ✅ **`M5a`** — a fresh-press requirement for the scan | the settle, which is the same edge at the other end | ⛔ **not *the held key stays stale*** — that is true under a reseed as well, and the row asking it was green under all five sabotages. What separates them is a key **struck in the same frame as a corrected mis-click**, which a reseed swallows |

| ✅ **`M5b`** — the map outlives the page: a delta over the default, on a disk | the default, which is the BASE the delta is read against | ⛔ **not *a verb the editor gained keeps its key*** — a whole-table file passes that too, because applying assigns per named verb. What only a delta earns is the EDITOR's freedom to **move a default** under a verb the author never touched |

⚠ **`M1` DID NOT PERSIST A REBIND, DELIBERATELY** — the map was `Client` state and a fresh page
got the default, because *what* to persist was not settled until a person could make one. `M5b`
is that question answered: the document holds only what the author CHANGED, so a verb they never
rebound follows the editor's default, including when that default moves.

## ⛔ What `M3` measured: a POLLING editor fires the key it has just bound

**The row the step turned out to be about was not the collision one.** The design predicted a
refused collision as the failure to watch; the collision half was already right, because
`keymap_bind` had settled it at `M1`. What no one had written down is this:

> **THE INVARIANT: while a rebind is in progress the keyboard belongs to the rebinder, and the
> key that COMPLETES one does not fire the verb it just bound.**

The client does not listen for key events — it **polls**. `poll_input` asks
`gl_key_pressed(code_for(map, verb))` once a frame and acts on the rising edge. So the moment
`raise` is bound to `5`, the physical `5` is **still down**, `verb_down(raise)` flips false → true,
and the ground rises. ⚠ **And that raise is correct in every particular** — right verb, right
author, right world — so no instrument in this tree can tell it from one a person asked for.
`RB_SETTLE` holds the keyboard until the finger comes up; `probe/b2`'s `M4` is the row that would
see it go, and `DEMO_SABOTAGE=nosettle` is it going.

⚠ **THE STATES ARE FOUR AND EACH EARNS ITSELF.** `RB_ARMED` exists so a click on the bar cannot
eat the next keystroke from somebody who only wanted to read a slot; `RB_PICKED` is where the scan
runs; `RB_SETTLE` is the above. `hex_editor::Rebind` is the machine, `keymap.loft` holds it beside
`keymap_bind`, and the client's whole share is **two fences** — `act` for verbs, `wire` for
everything with no verb — rather than a condition on each of ten edge detectors.

## ⛔ And the map is not the whole keyboard, which nothing but a hand-written list can say

**Eight keys are bound in `editor_client.loft` and in no `KeyMap`**: `w a s d` walk, `l` toggles
levelling, `Tab` cycles the catalogue, `o`/`p` put an opening profile straight on the wire. So
binding `raise` onto `w` is reported by `keymap_bind` as a **clean rebind with nothing displaced**
— it cannot see a collision with a table it is not in — and the author gets a key that walks *and*
raises, with no instrument anywhere that would report it.

⚠ **SAID, NOT REFUSED** (`client_reserved`). Every letter is taken, so refusing is the
useless-feature failure one layer down; what an author must not get is silence. ⏭ **The real fix
is to put them in the map**, which is `D1`'s neighbourhood: the walk is a HELD state where every
verb here is an edge, so `press_verb` has no shape for it yet.

## ✅ The edge that was open: the scan could not tell HELD from PRESSED — closed at `M5a`

`graphics` has no event queue, so *which key did they press* is 43 asks of `gl_key_pressed`. That
answers **is it down**, not **did it just go down** — and `RB_SETTLE` was that distinction solved at
one end only. At the other end: **a key held from before the arm bound itself the instant a slot was
picked.** Walk forward, press `Escape` with the other hand, click a slot with the mouse, and `w` was
bound before you had chosen anything.

`hex_editor::rebind_scan` is the missing edge, built out of two looks at the whole keyboard.

> **THE INVARIANT: only a key that has been observed UP since the pick, and is down now, can name a
> verb.**

⚠ **AN EDGE DETECTOR WHOSE FIRST LOOK SEEDS RATHER THAN FIRES**, which is the whole mechanism.
`st.was_arm` in the client does this for one key with a `false` seed and is right to — the client
starts before any key can be down. The rebinder arrives in the MIDDLE of a keyboard it has never
seen, so *unknown* has to read as *was already down*.

⚠ **AND ARMING IS THE ONLY PLACE THE MEMORY IS DROPPED.** The symmetric-looking rule — *every pick
starts a fresh observation* — is refused: the detector has been running continuously since the first
pick, so a key held across a corrected mis-click is already stale, and reseeding would additionally
swallow a key struck in the same frame as the second click. Nothing watches the keyboard between a
cancel and the next pick, and that gap is the whole of what arming has to clear.

⚠ **AND THE STEP INTRODUCED A SILENCE, SO IT SPEAKS.** Before it that key bound itself — wrong, and
visible; after it, nothing happens at all. The seed names what it found: *press a key for `raise` —
`W` already down, so press it again or use another*.

⏭ **The second face of the gap is still unreached**: the same missing edge means a *refused* press
would reprint its refusal every frame. That path stays unreachable today — every code the scan
offers is readable and the verb was checked at the pick — and it becomes reachable the moment either
premise moves.
