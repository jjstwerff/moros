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

So the message is `48:<verb>` — or in local mode, no message at all and the same resolution
in-process. That is what makes the two authority modes one editor
([PAGES_EDITOR](PAGES_EDITOR.md)) rather than two that agree by discipline.

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
| **`R3`** — delete `press`'s `O`/`P` branches and answer `PR_NONE` for them, until `R2` can land | `editor_run`'s scripts, which use `O`/`P` | ⚠ **A DELIBERATE REGRESSION, and the honest one**: a key that does the *wrong* thing silently is worse than a key that says *"not yet"*. `editor_run` will print `no gesture for key O` and a reader will know why |

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
| **`S1`** — a **selection** in `EditSession`: the current opening profile, door type, window type | nothing changes behaviour yet — but the session is **saved and replayed**, so its round-trip is the test | a selection that does not survive `world_to_bytes`/`world_from_bytes` makes a script unreplayable, and every gate drives a script |
| **`S2`** — a verb that **changes** the selection, and the subject line says what is selected | the existing catalogue line, which the server already authors | ⚠ picking a profile must change what the next `opening` cuts — asserted by cutting two openings with different selections and diffing the cells, never by reading the line |
| **`S3` = `R2`** — `opening` becomes ONE verb taking its profile from the selection; `O P I U N M` all resolve to it | the six old keys, kept and still sending `36:<kind>` | the six old keys and the one verb with six selections must produce **six identical worlds**. ⚠ This is the step that proves the collapse is lossless, and it is why the old keys stay until it is green |

## Phase 3 — the verb layer

| step | what runs beside it | what would surprise the test |
|---|---|---|
| **`V1`** — the verb vocabulary **and** `verb_of(key)` **and** a `press` that takes a verb, in one step | `press(key)`, unchanged and still called | for every key: `press(key)` and `press(verb_of(key))` leave worlds with equal `w_tau`. ⚠ **The declaration alone is NOT a step** — a table checked against itself cannot be surprised |
| **`V2`** — one caller at a time moves to verbs: `editor_run`, then the server, then the client | the key form, until each caller's equality test is green | a caller that resolves a key differently from `verb_of` — which is the four-site divergence trying to come back |
| **`V3`** — delete `press(key)` | — | nothing calls it: a grep, and the suite |

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
| **`K1`** — `tools/scripts/*.keys` accepts **both** spellings, `key H` and `verb place` | every existing script, unchanged — **no gate moves on the day the format changes** | a verb spelling that drives a different gesture from its key spelling: run one converted script and its original and diff the world |
| **`K2`** — convert the 23 scripts, one at a time, each green before the next | the key form, still accepted | as `K1`, per script |
| **`K3`** — drop the key spelling | — | nothing uses it: a grep over `tools/scripts/` |
| **`T1`** — a **type** declares defaults and, optionally, `(key, verb)` pairs | the built-in set, until a declared type reproduces it exactly | ⚠ **the invariant**: a type added as *data* must reproduce today's cottage byte for byte in `make parts`. If that needs a `.loft` edit, the table is not data yet |

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
