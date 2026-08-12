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

### ⚠ The camera was the character, and now it does not have to be — `eye`, 2026-08-12

**All five camera modes are DERIVED from the character's pose**, so for as long as this
editor has existed a script could only change the view by moving the character — and moving
the character moves **where the next gesture lands**. Every picture in this tree was taken
from behind the person building. There was no way to ask for *the house from outside, with
its author standing in front of it*.

```
eye <x> <z> [height]     stand the camera THERE, looking back at the character
eye off                  release it; the camera mode takes over again
```

on the wire as **`48:<x>,<z>[,<h>]`** and `48:` to release. `h` is **above the ground at
`(x, z)`**, defaulting to a person's own eye height, because a script that had to know the
terrain to place a camera breaks the moment anything is raised under it.

| | |
|---|---|
| it is **not** a sixth mode | the five answer *how do I follow*; this answers *where do I stand to see them*. Folding it into `40:` would stop that table being a table of following rules |
| it **suspends** the mode, never replaces it | releasing returns to whatever `40:` last said, at whatever the ease had reached — a tripod is not a decision about following |
| nothing eases into place | two consecutive `snap`s of one scene must be the same picture |
| a distance past what is **streamed** is refused with an offer | chunks are streamed within `DRAW_HEXES` of the CHARACTER and the fog is centred there, so an eye beyond that photographs the inside of the fog and reports a successful picture of nothing |

⚠ **AND THE COMPOSITION RULE IS A MEASUREMENT, NOT A TASTE.** Aiming from a point on the
**character→house axis** puts a 1.8-unit figure against a 9-unit building at the same
bearing, and it reads as part of the wall — the figure was *in frame and invisible*, which
the projection arithmetic cannot tell from visible. Put the eye **across** that line. Three
angles were photographed before one showed a person.

⚠ **`editor_run` SKIPS IT, beside `snap`.** There is no renderer in that program, so a
camera placed where nobody is looking is a verb it has no use for rather than a refusal —
which is what keeps one script serving both drivers.

**Gated by [`tools/gates/world/eye.mjs`](../../tools/gates/world/eye.mjs)**, which reads the
`C:` matrices off the wire and projects the character's own world position through
`proj · view` to test the clip volume — the arithmetic the GPU does, not a resemblance to
it — with a point behind the eye as the control that stops that instrument answering
*inside* for everything.

### ⚠ A script says a VERB now, not a keystroke — plan 22 `K1`, 2026-08-12

**A script is a document, not a keyboard.** It outlives the layout it was written on and it
is read by a person deciding what a scene does, so `verb place` says that where `key H` says
which finger moved. Both spellings are accepted, in **both** readers, and `K3` drops the key
form once every script has been converted.

```
verb <name>      raise · lower · place · opening · fence · wall
select <kind>    what the NEXT opening cuts — `49:<kind>` on the wire
```

⚠ **`select` IS NOT COSMETIC, AND THAT IS THE WHOLE STEP.** `hex_editor::verb_of` is
deliberately not injective: `O P I U N M` all name one `opening` verb, so a converted script
that says `opening` and never says `select` cuts **whatever was chosen last**. `key P` becomes
two lines, not one.

⚠ **AND THE OBVIOUS WAY TO CHECK A CONVERSION CANNOT SEE THAT.** Diff the worlds and a
pointed window converted as a round one is **equal byte for byte** — `open_ahead` writes
`DOOR_MAT` whatever the profile, the head lives in the session's `Opening`, and none of the
session is in the world format ([`S1`](../../plans/22-pages-client/README.md)). So
`editor_run` grew a **session read-back**: its last lines print the nine registries and every
opening's geometry, and [`probe/k1/run.sh`](../../probe/k1/run.sh) (`make probe-verbs`) checks
that instrument against a deliberately mis-converted script before trusting it to report
agreement.

⚠ **A KEY DOES NOT RE-CHOOSE, SO THE TWO SPELLINGS END ON DIFFERENT SELECTIONS.** That is
`S3`'s fork, visible: `key O` `key P` finishes holding the selection it started with, its verb
twin finishes holding `2`. The probe **asserts they differ** — agreement there would mean a
key had silently re-chosen.

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

## 3. Every step ends in a picture — three channels, and they answer different questions

| channel | what it answers | cost |
|---|---|---|
| **plan + elevation raster**, drawn from the emitted geometry | *is the shape right* — is the wall straight, is the footprint square, does the roof pitch | headless, deterministic, no GPU. `tools/plan.mjs` already does plan view |
| **a 3D render** | *does it READ as a house* — the cold-recognition test | needs a renderer |
| **the wire** — `mesh <surf>`, `meshy <surf> <y0> <y1>` | *was it EMITTED at all, and WHERE* | headless, no browser, off the `M:` frames |
| **the walker** — `feet [lo hi]` | *can you GET there* — a stair is a sequence of these | headless, off the body's own matrix |
| **a running tally** — `last <prefix>` | *where did it END UP* — the client's cache and ground verdicts arrive once per chunk and accumulate | free; it reads the status already collected |

The first is a measurement that happens to be an image, and it is exact: a zigzag wall is
visibly a zigzag in plan. The second is the acceptance test and cannot be automated away.

⚠ **The third channel was added because the first two are blind to a whole class**, and it
took two sessions to see the shape of it. A roof's soffit and a floor's soffit are one
surface in one colour, so standing under an upper storey photographs `soffit 0.997` whether
the deck has an underside or you are seeing the roof through it — a **colour cannot see a
count**, and `mesh` was the answer. Then the cellar: digging one puts 342 vertices into
`soffit` whether or not a ceiling is drawn, because the cellar *floor's* own underside lands
in the same surface — a **count cannot see a height**, and `meshy` is the answer to that.
The rule generalises past this file: when one instrument cannot separate two cases, the fix
is a second instrument, never a looser threshold.

⚠ **And a count cannot see whether you can GET there.** The cellar stair was correct in the
store — every tread at the right height, every one of them drawn — while the walker stepped
down once and climbed straight back out onto the floor. `feet` is the row that catches it,
and nothing else in this table can: the picture was right, the counts were right, and the
room was still unreachable.

⚠ **`turn` must not appear in a gate.** It paces itself off ticks, so under a full suite it
stops short and every heading after it is wrong — `cellar.keys` passed alone and failed in
the suite every time, *finishing faster* than it did alone, which is the tell that something
bailed early rather than ran slowly. Use `at <x> <z> <yawdeg>`, which carries the heading
exactly on any load.

⚠ **A script that uses `step` runs on a STEPPED CLOCK, and the runner sets that itself.**
`step n` reads as "advance exactly n ticks" and above rate 0 it does nothing of the sort —
the server ignores the pending count and paces on the wall instead, so the world free-runs
at 30 Hz through every sleep between commands with the walk keys held. That was the whole of
the `deck_soffit` flake. The rule keys on what the script already asks for; the nine scripts
that never `step` keep free-running, because stepping them would hang every one, and a
script that sets its own `rate` still wins.

⚠ **A frame WAITS for the page to be showing the state the script set up**, and says how
long it waited. `parts`/`wire` covers the meshes; `cam` covers the camera matrix, which is
the thing a gate changes *last* — `send 40:4`, `send 3:0,-20000`, shoot — and which the mesh
count cannot see. Both sides are fed the same broadcasts, so this is a comparison rather than
a guess about how long a browser needs; a sleep here would be the mistake the readiness check
already replaced once.

⚠ **And a RED is confirmed before it is reported.** A failing frame is re-settled and re-shot
once, and reported only if it fails again. It cannot hide a real defect — nothing is sent and
no tick is asked for between the two shots, so a genuine failure fails both — and a retry
that fires prints `⟳ re-shot …`, because a gate quietly lowering its own bar is worse than
the flake it was hiding.

⚠ **And the frame carries `parts` / `wire`** — the page's mesh count against the runner's.
The runner is a client too, so it holds the set the page is *supposed* to have, and any
shortfall is stream the browser has not caught up with. It earned its place by **disproving**
the obvious diagnosis: on the failing runs it read 404 of 404, which is what sent the search
to the clock instead.

⚠ **`wait` ANSWERS "HAS THIS HAPPENED", `last` ANSWERS "WHERE DID IT END UP"**, and a
cumulative count needs the second. `wait` returns the EARLIEST matching status, which for the
client's ground verdict is always `ground 0 bad 0 wait 1` — the instant before any evidence
exists. Read as a result it says the guard blocks everything, when it had blocked one tile out
of forty-eight. Any instrument that counts upward wants `last`.

⚠ **THE `snap` IS WHAT OPENS THE BROWSER, and the browser IS the client under test.** It reads
as a screenshot command, so a gate that judges no picture looks like it can drop it — and then
nobody is connected, every verdict line simply never arrives, and the failure reads as "the
feature does not work". A gate that needs a client needs a `snap`, whether or not it looks at
the PNG.

⚠ **THE SERVER IS COMPILED FROM SOURCE EVERY RUN; THE CLIENT IS A FILE.**
`src/.loft/editor_client.html` is written by `make client` and merely *served*, so an edit to
`editor_client.loft` is invisible until that command runs. It cost a full diagnosis: a `Z:0`
re-check read as "never runs" through three instrumented runs while the code was simply not in
the page. Both client gates now build it themselves, and so does every editor make-target —
**check this first when a client change appears to do nothing.**

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
| `S3` | ✅ **a wall run lays a WALL** — the line's own edges, at `hex_draw`'s band | `shots/s3-wall.png` — it reads as a wall; `tools/scripts/wall.keys` builds it |
| `S4` | ✅ **a house from the pose** — `box_fill`, `seat_write`, four mitred sides | `shots/s4-house.png`: the plan closes at every corner |
| `S5` | ✅ **a door and a window where the author stands** — `O` and `P` | `shots/s5-opening.png`: you see through it |
| `S6` | ◐ **`draw_roof`** — the model is done and gabled; the eave is still a hex staircase | not yet: it reads as a red slab. The eave wants the plan's straight side, exactly as the wall did at `S3` |
| `S7` | ✅ **`src/editor_run`** — the same `.keys` file, no socket, no tick | `make headless-same`: both drivers report the same house |
| `S8` | **the leaf** — a door that swings, on a hinge (`Assembly`, `A1`–`A10`) | the door **ajar**, which is what makes it read as a door |

⚠ **`S1` before `S3`.** The temptation is to fix the visible wall first. The test comes
first because it is what proves I am calling the library rather than reimplementing it
again — which is the mistake this whole design exists to undo.

⚠ **`S3` was written as "one wall from `surface_quad`", and that turned out to be the wrong
call — for a reason that matters to `S4`.** `surface_quad` recovers a wall from the CELLS
that store it, mitred against the other sides of a `Plan`; its exactness claim is that the
averaged direction lands on one of the lattice's 12 headings. A run is not a plan side: it
is the author's own line at one of the editor's **24** headings, so half of them have no
lattice family to be exact in, and there is no neighbouring side to mitre against. What the
family owns for a free run is the **offset** (`hex_way::track_offset`, exact for a straight)
and the **band** (`hex_draw::BAND_SIDES`, the width a wall is presented at) — and those are
what `S3` used. `surface_quad` comes into its own at `S4`, where a footprint has four sides
and corners that must actually meet.

---

## 5. Later — the game

The same three pieces serve it, which is why the editor is worth building this way:

- **timing** — the tick is already the unit; a recording already carries it;
- **replay determinism** is a testable invariant: replay a recording and the world must come
  back **identical**, checked by the world file's own CRC. That is the regression test for
  the whole engine, and it is free once the format exists;
- **bug reports** — a player sends a `.rec`; it replays here exactly.

Off for a public build by a flag, on for every development run.
