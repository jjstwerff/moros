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

## What this changes about `press` — plan 22 `W4`

`hex_editor::press(sess, w, a, key)` is a **flat table** today, and it is the wrong shape: it can
only answer *what does this key do* if that has one answer. It becomes:

```
press(sess, w, a, key)         // mode derived inside, from `a` and the session
  → mode_at(sess, w, a)        // outside | inside | underground
  → the verb table for that mode
  → the gesture, with the SELECTION's type
```

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
