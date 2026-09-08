<!-- Copyright (c) 2026 Jurjen Stellingwerff -->
<!-- SPDX-License-Identifier: LGPL-3.0-or-later -->

# The controls — measured against a pure controller, with the character as the base

> **The requirement, 2026-09-08:** *"I want to allow eventually a pure controller with the
> character as the base."*

**Written from an inventory of every input the editor takes today**, not from the designs that
describe it. [AUTHORING_MAP](AUTHORING_MAP.md) already states the laws such a scheme must obey
and [EDITING_MODES](EDITING_MODES.md) the mechanism (a key names a verb; the wire carries the
verb); [BLUEPRINT](BLUEPRINT.md) §3.2 names the one library gap. What none of them holds is the
distance between those and the editor as it stands, which is what a person deciding where to
start needs.

## 0. The one-paragraph verdict

**The editor is closer to a controller than its key table suggests, and the distance is not
where the designs put it.** Everything a gesture does is already relative to the character —
`raise` lands `PEAK_AHEAD` hexes along the facing, `fence` rings the feet, `place` seats a
footprint ahead, `aim` walks the facing out to a chosen reach — and the mouse's only world
gesture turns the character's own facing rather than a free camera. The walk is tank-shaped
(forward, back, turn, turn), which is a stick already. **What stands between that and a
controller is three counts:** no gamepad exists anywhere in the stack, every mode offers all 19
verbs against a budget of about 12, and 5 of the 7 selections have no input on the page at all.
The first is a channel that already exists on the page; the second is a rule already written and
never wired; the third is the wheel the designs already name.

## 1. The invariant, said once

> **Every input is one of three things: a change to the character's POSE (position, facing,
> level), a VERB applied at that pose, or a SELECTION of what the verb makes. Nothing is a
> pointer.**

That is `X107` (`Φ = G[where][chosen](geometry)`) read as a rule about inputs rather than shapes:
the sticks move `geometry`, the buttons name a verb, the wheel sets `chosen`, and `where` is
derived from the pose and touched by nothing. ⚠ **The plan's pick (plan 26 `B6`) is the one
gesture in the editor that is a pointer** — and it does not need to be: its character-based
spelling is *walk there* (BLUEPRINT §3.1, the plan does not restrict the walker) or *aim there*
(the `aim` idiom with a reach), both of which exist. A pick is a convenience for a mouse, not a
capability a controller lacks.

## 2. The inventory — every input, measured 2026-09-08

| input | what it does today | on the page (local) | a controller's spelling |
|---|---|---|---|
| `W` `S` held | walk along the facing, one fixed step per tick (`walk_dir` → ±1) | ✅ | left stick **y** — the magnitude is discarded today (`HELD_FWD`/`HELD_BACK` are bits) |
| `A` `D` held | turn at `TURN_RATE` 2.20 rad/s (`turn_dir` → ±1) | ✅ | left stick **x**, or right stick x — same bits |
| mouse drag in the world | `3:<dx>,<dy>` — **turns the character's facing** by `0.006` rad/px and pitches the camera | ⛔ **dead**: `wire` swallows `3:` in local mode, said once | right stick — it is a facing input already, not a free look |
| 19 verb keys (`ArrowUp` `ArrowDown` `F` `1` `G` `R` `T` `H` `O` `Y` `J` `E` `Q` `X` `Z` `B` `C` `2` `3`) | one verb each, at the pose; rebindable from inside the editor; the wire carries the verb | ✅ | buttons — **19 into ~12** does not fit, see §3.2 |
| `Tab` | cycle the part catalogue | ✅ | d-pad — a list walk |
| `L` | toggle levelling (a held mode on the walk) | ✅ | a shoulder toggle |
| `o` / `p` | cut a door / a window profile straight on the wire (`36:1` / `36:2`) | `o` fires the `opening` verb too (it is bound to it); ⛔ **`p` is dead** — `36:` is swallowed | folded into `opening` + the selection — the six-key family's last two keys |
| `Escape` + a slot click + a key | rebind a verb | ✅ | a settings screen; not a play-time input |
| `m` | the plan over the canvas | ✅ | a button — a view toggle like `L` |
| click on the plan | a pick: the next verb lands there | ✅ | *walk there* or *aim there* — see §1 |
| click on a catalogue row | choose a part (`session_select_part`) | ✅ | the wheel |
| click on a material row | says out loud there is no selection for it | ✅ | — |
| **no input at all** | wall type (`58:`), tower shell, aim reach (`57:`), seat kind (`52:`), annex kind (`53:`), opening kind beyond door/window (`49:`), camera mode (`40:`), eye (`48:`), part mode (`44:`) | ⛔ scripts and `wscat` only | the wheel, and a camera button |

**The scripts are already controller-neutral**: 46 `tools/scripts/*.keys`, 45 of them spelling
`verb <name>`, **none** spelling a key. A controller that names verbs replays every gate as it is.

## 3. The three gaps, with the number on each

### 3.1 ⛔ No gamepad exists anywhere in the stack — 0 matches

`graphics.api` has `gl_key_pressed`, `gl_mouse_x/y/button/wheel` and nothing else;
`input` 0.2.0 (registry and the sibling tree alike) binds an axis as a **pair of key codes**
returning −1/0/+1, and its state-fed seam `input_tick_from_state(keys, mx, my, mbtn, wheel)`
carries no float axis; the `--html` shell binds keydown and the mouse to the canvas and has no
`getGamepads`. This is BLUEPRINT §3.2's finding, re-measured and unchanged.

✅ **But the page does not need any of that to start.** Plan 26 `B6` measured the channel: JS
can push a message with `loftPush` and the client reads it with `host_input(0)`, a poll on
every target, end to end and gated. A `requestAnimationFrame` loop reading
`navigator.getGamepads()` and pushing `pad:<axes>,<buttons>` **on change** is the same door the
pick came through. ⚠ **The desktop client still needs the host imports upstream** — the page
path is the prototype that measures what the mapping should be before the library work is
asked for, which is this tree's promotion rule.

### 3.2 ⛔ Every mode offers all 19 verbs, against a budget of ~12 — `X110` is written and unwired

`mode_at` exists (outside / inside / underground, derived from `shelter_at`) and has **one
consumer: `editor_run`'s subject line.** `verbs_here` only ADDS a house type's verbs; nothing
removes a base verb anywhere. So a controller with four faces and four shoulders is seven
buttons short in every mode, and no wheel makes that up on its own — `X110` says the wheel
lets the *total* exceed the budget and `where` keeps each *mode* under it, and today `where`
keeps nothing under anything.

⚠ **`D2p` already measured which verbs a mode may honestly remove**: not the geometric ones
(`raise` from inside a house moves 0 cells of its floor by its own gate; 16 of 18 corpus openings
are cut into free-standing walls, so *outside* must keep `opening`), but the ones with **no gate
of their own** — `place`, `storey`, `cellar` inside a house; the fittings outside one. The cut
is a data table over `(mode, verb)`, and the test is the count.

### 3.3 ⛔ Five of seven selections cannot be made on the page

`session_select_open/part/annex/wall/shell/reach/seat` are seven selectors; the page reaches
`part` (Tab, or a row click) and two opening kinds (`o`/`p`, one of them dead locally). Wall
type, tower shell, aim reach, seat kind and annex kind are **wire and script only** — a person
building a round tower on the page cannot choose its size, and cannot pick a declared wall type
at all. A controller makes this visible because it has no `wscat`; it is not a controller gap.

## 4. What already fits, so it is not rebuilt

- **Gestures are pose-relative.** `raise_ahead` (`PEAK_AHEAD` = 10 hexes), `fence` around the
  feet, `place` ahead with a mitre doorstep, `aim` with `reach`, `push` along the facing, `tower`
  at the feet. No gesture reads the mouse.
- **The facing is the character's**, on both drivers: the server integrates `4:` held bits and
  `3:` drag into `wk_yaw`; the page integrates the bits. There is no separate camera yaw to map.
- **A key names a verb and the wire carries the verb** — the layer a controller binds to is the
  same `KeyMap` (`bind_of("ArrowUp", VB_RAISE)`), keyed by *name*; a button is a name.
- **The mode is derived, never set** — no button can put the editor in the wrong mode.
- **Scripts name verbs**, so every gate is a controller gate already.

## 5. The one design change "the character as the base" implies — strafe

The walk is `forward · back · turn · turn`. A left stick is a **2-D vector**, and reading it as
those four bits throws away the sideways half. That half is not cosmetic: [WALL_PUSH](WALL_PUSH.md)
§7 records that `push` *"still does not pay L11 and the reason is the CONTROLS — you can only push
where you walk"*, because sweeping a face needs walking ALONG it while facing it, **and there is
no strafe**. So the stick's second axis is the input a shipped gesture is already waiting for.
It is a change to `pose.loft`'s held bits (`HELD_*` → a move vector plus a turn), shared by all
three drivers through `walk_tick`, and it obeys `X103` as long as the vector is read per tick
and never integrated from history.

## 6. The path, in steps that can each go red

| # | step | what it proves | cost |
|---|---|---|---|
| **C1** | the page reads a gamepad through the `B6` channel: JS pushes `pad:` on change, the client maps left-stick y/x onto `HELD_FWD/BACK/LEFT/RIGHT` | a stick walks the character on the page; gate by pushing synthetic `pad:` lines from CDP and reading `walked`/`turned` off the walker's own line, plus a control that a centred stick moves nothing | half a day; one wasm build per iteration; no library change |
| **C2** | strafe: `HELD_*` bits become a move vector + turn in `pose.loft`, keyboard `Q`/`E`-style keys and the stick both feed it | `deck.keys` stays byte-identical (the vector is the old bits for the old keys), and `push` can sweep a face — `WALL_PUSH` L11's own row | a day; the runner, the server and the page move together because `walk_tick` is one body |
| **C3** | the per-mode cut: a `(mode, verb)` table consumed by `verbs_here`, with `D2p`'s list as its first content | every mode's count ≤ 12, asserted; a script pressing a removed verb in the wrong mode gets *reason, offer* — `X110` |
| **C4** | buttons → verbs: a second `KeyMap` keyed by button names, resolved where the controller is, the verb travelling as now; one shoulder as the wheel's modifier | a face button places a house on the page with the walker as the base; the same script replays | a day |
| **C5** | the wheel: the seven selections on one selector, `X107`'s *within what `where` offered* | wall type, shell, reach, seat, annex reachable on the page for the first time — which is §3.3, and a keyboard gain too | the UI is the cost, `lavition_ui` has the list |
| **upstream, in parallel** | `graphics` gamepad host-imports and a float axis in `input` (BLUEPRINT §3.2) — file now, needed for the DESKTOP client only | | a ticket, with `C1`'s measured mapping as its content |

⚠ **`C1` before `C3`, deliberately.** The rule this tree keeps paying for is *build to learn*:
which axis a person wants for turning, whether the stick's magnitude should be speed, and how a
wheel feels are things a prototype on the page answers in an hour and a design argues about for
a day. `C3` and `C5` are the two with content decisions in them, and they are cheaper to make
with a stick in hand.
