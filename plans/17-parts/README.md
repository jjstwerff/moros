<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# Plan 17 — Parts

**Status: DESIGNED, not started.** Issue
[jjstwerff/moros#17](https://github.com/jjstwerff/moros/issues/17).

**Goal.** A house is drawn away from the world and stencilled into it, and it is composed of
parts — door-frames, doors, window-frames, windows, pillars, statues — each of which is
itself editable on its own and reusable in other houses.

**The design is [doc/claude/PARTS.md](../../doc/claude/PARTS.md)**, and it is the whole of
this plan's content; this file exists to carry the status and the sub-arc order.

## Phase ordering

| | step | gate |
|---|---|---|
| `A1` | `lib/hex_part`, `HXF1` sections `PART` + `ANCH`; save a world region as a part and load it back | round-trip identity, with the perturbation control **seen red** |
| `A2` | `14:` takes a part name; the procedural house becomes an authored part | the stencil gate's picture is unchanged |
| `A3` | instances — `INST`, a labelled derived layer, `expand == bake` | edit the part, the placed house changes |
| `A4` | sockets — offer, fit, refusal with reason and offer | a frame refuses an oversized leaf, in words |
| `A5` | fittings — the hinge and its state | the door reads as a door because it is **ajar** |
| `A6` | prop parts — statues and pillars in the same library and sockets | a statue swapped on the same plinth |
| `A7` | the picker and a part-editing mode | a house authored without touching loft |

## Cross-arc dependencies

- **Plan 16 (client split)** owns the wire; `14:`'s payload change lands there or is
  coordinated with it.
- **`hex_field`** owns `HXF1` and lives in `loft-libs-world`, which crawler also consumes —
  new section tags are additive and skippable by length, so they do not break it, but the
  **fixture is shared** and a change to it turns both suites red by design.

## Open questions

None blocking; the calls taken instead of asked are in
[PARTS.md § Open, and decided rather than asked](../../doc/claude/PARTS.md#open-and-decided-rather-than-asked).
