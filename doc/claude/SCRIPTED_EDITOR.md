<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# A SCRIPTED EDITOR — driven from outside, verified by pictures

*(user, 2026-07-31: "you should be able to easily script this editor from the outside, and
eventually also a full game with timing details" · "everything should result in PNG's that
you can inspect for your drawing skill")*

Two requirements, and they decide the architecture between them:

1. **Everything is driven by a script from outside** — the editor, and later the game.
2. **Every step ends in a PNG**, because the acceptance test is *does it read as a house*,
   which no store read can answer.

---

## 1. The format is the wire, stamped with the tick

Nothing is invented. The protocol is already event-shaped — `4:` is a *change* of the held
key bitmask and never a position, `7:` is a placement, `30:1` is a keystroke — and the walk
integrates on a **fixed tick** precisely so a run is reproducible from an input log rather
than from whatever frame rate a tab happened to run at (`L7`, built in from line one).

So a recording is that log, and **a hand-written script is the same file**:

```
1 1:                 the opening handshake
3 7:0,0,0            place the character
4 5:1                raise the ground ahead
7 25:1               start a wall run
15 7:3,-3,0          walk / teleport to the far end
15 25:1              close it
1241 31:             snapshot
```

**One format for authoring, replay and bug reports.** A player's session, a regression test
and a hand-written scene are the same kind of file — which is what makes "record every run"
cost nothing to support: it is the thing we already need for scripting.

⚠ **Recorded at `poll_event`, before any handler.** A log taken after the handlers would
replay their opinions rather than the input. `31:` is logged without its payload — a
snapshot carries a whole PNG, and a session would otherwise be a recording made of pictures.

**Status: BUILT.** On by default; `recordings/run-<t>.rec`.

---

## 2. What is scriptable is what is a FUNCTION

The reason the editor cannot be scripted today is not the socket — it is that **every
gesture lives inside the message loop**. There is no `lay_a_wall(...)` to call, only a
message that reaches one, so nothing can be driven, tested or replayed except through a
server.

    lib/hex_editor/      gesture(world, author, args) -> Ack     ← every gesture, testable
    src/editor_server    socket  → gesture(...)                  ← multi-author, later
    src/editor_run       script  → gesture(...)                  ← the bare application

`Author` is where the character is (x, z, feet, yaw) — the gestures already need exactly
that and nothing more. `Ack` is the doorstep shape this editor already uses everywhere:
**ok, reason, offer, residual**.

⚠ **The mesh wire is not carried forward; the control wire is.** Today every mesh crosses
the socket as comma-separated ASCII floats — about 1 MB of text per chunk rebuild — and it
exists only because the model is on a server and the renderer is in a browser.
`WIRE_PROTOCOL.md` already marks most messages **D — *disappears; the receiver derives it
from the store***. The control half is the opposite: it is the scripting interface, and it
stays.

---

## 3. Every step ends in a picture — two channels, and they answer different questions

| channel | what it answers | cost |
|---|---|---|
| **plan + elevation raster**, drawn from the emitted geometry | *is the shape right* — is the wall straight, is the footprint square, does the roof pitch | headless, deterministic, no GPU. `tools/plan.mjs` already does plan view |
| **a 3D render** | *does it READ as a house* — the cold-recognition test | needs a renderer |

The first is a measurement that happens to be an image, and it is exact: a zigzag wall is
visibly a zigzag in plan. The second is the acceptance test and cannot be automated away.

⚠ **A green board is not a passing step.** Every claim about a shape can hold while the
picture is wrong — `25:` WALL passed its gate for months while drawing a road with a fence
down each side. So a step is done when the PICTURE is right, and the checks exist to explain
*why* it is wrong when it is.

---

## 4. The steps — small, safe, each ending in a PNG

Each one is independently revertible, and the current server keeps running untouched
throughout so there is always something to look at.

| | step | the PNG that closes it |
|---|---|---|
| `S1` | **`lib/hex_editor`** with `hex_draw`/`hex_shape`/`hex_form`/`hex_roof`/`hex_place` as registry deps, and one test: `Plan` → `box_fill` → `draw_walls` → `surface_quad` is one exact flat surface | *(no PNG — a pure test; the seam either compiles and passes or it does not)* |
| `S2` | **elevation raster** beside `plan.mjs`: geometry in, PNG out, no GPU | the current hut, in plan and elevation — the zigzag made visible |
| `S3` | **one wall from `surface_quad`** replaces `emit_run_wall` | one straight mitred wall, from the side |
| `S4` | **a footprint** — `box_fill` + `seat_write` from the character's pose | four walls that meet at mitred corners |
| `S5` | **`place_opening`** — a door and a window where the character stands | a wall with a hole you can see through |
| `S6` | **`draw_roof`** | it reads as a house |
| `S7` | **`src/editor_run`** — the script drives those functions with no server at all | the same house, built headless |
| `S8` | **the leaf** — a door that swings, on a hinge (`Assembly`, `A1`–`A10`) | the door **ajar**, which is what makes it read as a door |

⚠ **`S1` before `S3`.** The temptation is to fix the visible wall first. The test comes
first because it is what proves I am calling the library rather than reimplementing it
again — which is the mistake this whole design exists to undo.

---

## 5. Later — the game

The same three pieces serve it, which is why the editor is worth building this way:

- **timing** — the tick is already the unit; a recording already carries it;
- **replay determinism** is a testable invariant: replay a recording and the world must come
  back **identical**, checked by the world file's own CRC. That is the regression test for
  the whole engine, and it is free once the format exists;
- **bug reports** — a player sends a `.rec`; it replays here exactly.

Off for a public build by a flag, on for every development run.
