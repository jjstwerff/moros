# `probe/stick` — the sticks on the page, and a keyboard shaped like them

[CONTROLS](../../doc/claude/CONTROLS.md) §6, steps `C1` (a stick walks the page) and `C2`
(strafe). `make probe-stick`; `make probe-stick-sweep` for the controls.

**The requirement, 2026-09-08:** *"keyboard inputs for now but those have to mimic the
controller (wasd & mouse view)"*, and *"full controller support in the browser for the same
controls"*. So `W S A D` are the LEFT stick — a vector, `A`/`D` strafe — and the mouse is the
RIGHT stick, which turns the character; and a real pad drives the same three quantities.

**The mechanism**, and the library half is one body for all three drivers:

| | |
|---|---|
| `hex_editor::pose` | `HELD_STRAFE_L/R` (16, 32) beside the turn pair; `move_of(bits, stick_f, stick_s)` composes keys and stick into one vector clamped to the unit disc; `turn_of` the same for the turn rate; `move_world` turns it into the world by the facing, right = `(−sin, cos)`; `LOOK_PER_PX` shared |
| `hex_editor::tick` | the walker carries `wk_stick_f/s/t`; `walk_tick` steps along the composed vector, so `W` lands exactly where it did and `D` is a step to the right without turning |
| the wire | `4:` grows bits 16/32; **`61:<f>,<s>,<t>`** is the stick, WRITTEN not integrated; `editor_run` has `move <f>,<s>,<t>` |
| the page | `tools/build-pages.mjs` reads `navigator.getGamepads()` per frame, deadzone 0.15, rounded to 0.01, pushed as `pad:<lx>,<ly>,<rx>,<ry>` ON CHANGE through the queue the plan's pick uses; the client's `host_poll` puts the three walk quantities on the walker (local) or on `61:` (attached) |
| the mouse | a drag turns the character locally now (it was DEAD on the page — `wire` swallowed `3:`); attached it is `3:` as before |

## The rows

| row | claim |
|---|---|
| A | the page booted from `file://` and went local |
| B0 | the client said a controller is speaking |
| B1 | left stick forward: `walked` grows, `x` grows (yaw 0), `z` and `turned` unmoved |
| C1 | left stick right: `z` moves, `x` and `turned` unmoved — **a vector, not a turn** |
| D1 | right stick: `turned` grows, position unmoved |
| E1 | a centred stick for 1.5 s: nothing moves — the control |
| F1 | `d` held: the step is along the facing's RIGHT (cosine > 0.99) and `turned` is unmoved |
| G1 | a 44 px drag: `turned` grows by `44 × LOOK_PER_PX` and nothing moves |

## The sabotage sweep — predictions first

| `STICK_SABOTAGE` | what is removed | predicted red |
|---|---|---|
| `nopad` | the page's reader pushes nothing (JS) | B0 B1 C1 D1; E F G green |
| `noturn` | `d` sends the TURN bit again — the old keyboard | F1 |
| `nolook` | the local drag no longer turns | G1 |

## The sabotage sweep — measured, 2026-09-08

| `STICK_SABOTAGE` | predicted red | **measured red** |
|---|---|---|
| control | none | **none**, 8 green |
| `nopad` | B0 B1 C1 D1 | **B0 B1 C1 D1** — E F G green: the keyboard and the mouse are not the pad's |
| `noturn` | F1 | **F1** — `held d: moved 0.00 … turned 2.18 → 3.92`: the old keyboard, seen as itself |
| `nolook` | G1 | **G1** — `turned 2.2506 → 2.2506`: the drag dead on the page again, as it was before this step |

## ⛔ What G1 found the first two times — a counter sampling at half the rate

The control read **22 px of 44** on G1, three runs in a row, with every other row green. The
first diagnosis blamed the release frame and built `PaDrop` (a world drag's release carries
its last delta) — right, tested, and not the cause: the rebuilt page read 22 again. The
experiment that settled it dragged the same 44 px as one move, four and eight, and read
**44 / 22 / 24**: a one-move drag was exact, so the events reached the page and the number
was the *instrument's*. `turned_by` and the camera re-solve lived inside `if steps > 0`; a
drag writes the yaw on its own frame; at 60 fps against a 33 ms tick every other frame
ticks. Half. ⚠ The camera lagged the mouse for the same reason, invisible until this probe
because nothing had dragged on the page before — the drag was dead there.
