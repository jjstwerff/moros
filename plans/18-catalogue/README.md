<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# Plan 18 — Catalogue

**Status: DESIGNED, not started.** Issue
[jjstwerff/moros#18](https://github.com/jjstwerff/moros/issues/18); a sub-arc of
[#7](https://github.com/jjstwerff/moros/issues/7) (hex_editor's configuration surface).

**Goal.** The editor always says what you are working on and what is switched on; things can
be named; and there is one browsable list of what is available — parts and materials alike —
each entry carrying a name and an image.

**The design is [doc/claude/CATALOGUE.md](../../doc/claude/CATALOGUE.md).**

⚠ **This is largely *finish `moros_ui`*, not *design a UI*.** The panel layout, hit-test and
click routing are built and tested; `panel_render` was never written and `font.loft` is a
placeholder waiting on a loft text bridge that turns out to be stubbed.

## Phase ordering

| | step | gate |
|---|---|---|
| `B1` | glyphs as geometry, `panel_render`, the subject line | a PNG shows the words, and `moros_sim` still builds |
| `B2` | toggle state on the subject line, from the server (`H:`) | it changes when the SERVER changes, not when a key is pressed |
| `B3` | material catalogue, swatches rendered by the world's own shader | pick a wall material and build with it |
| `B4` | naming + rename, with the clash refusal | rename, and placements keep their labels |
| `B5` | part catalogue with rendered thumbnails | needs #17 `A1`/`A2` |
| `B6` | availability and its reasons | a leaf too wide for your frame says so |

⚠ `B3` before `B5`: materials exist now, parts do not.

## Blocked-by (shape, not schedule)

- [loft#737](https://github.com/loft-lang/loft/issues/737) — `--html` stubs the text bridge
- [loft#738](https://github.com/loft-lang/loft/issues/738) — and image load / CPU pixel upload

Neither blocks the plan: glyphs become geometry and images are rendered rather than loaded.
If #738 lands, the font becomes a small texture and the geometry path is deleted.

## Cross-arc dependencies

- **#17 (parts)** supplies the part family for `B5`; `B1`–`B4` do not wait on it.
- **#16 (client split)** owns the wire; `H:` lands there or is coordinated with it.
- **`lib/moros_ui` is consumed by `moros_sim`** — check it before calling the wiring done.
