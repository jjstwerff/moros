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
placeholder.

⚠ **The premise changed on 2026-08-03: the text bridge is REAL now.** This plan was written
against a `--html` backend that stubbed the whole text bridge, so `B1` said "glyphs become
geometry" and every catalogue image had to be rendered rather than loaded. loft fixed both
([#737](https://github.com/loft-lang/loft/issues/737),
[#738](https://github.com/loft-lang/loft/issues/738)) and the installed `loft 2026.8.0`
carries the fix — measured in the emitted page: `measureText`/`fillText` present,
`gl_upload_alpha_texture` uploading a real coverage buffer, `gl_load_texture` serving a
bundled asset, zero `TODO` markers. So **`B1` is now "draw text through the bridge", not
"build a geometry font"**, and the geometry path should not be built at all.
⚠ Both issues are still **open on the tracker** while the code is fixed — re-measure the
emitted page rather than trusting either label.

## Phase ordering

The arcs; **[CATALOGUE.md § The order of work](../../doc/claude/CATALOGUE.md#the-order-of-work)
breaks each into one-sitting steps** with its own gate and size.

| | step | gate |
|---|---|---|
| `B1` | text through the loft bridge, `panel_render`, the subject line | a PNG shows the words, and `moros_sim` still builds |
| `B2` | toggle state on the subject line, from the server (`H:`) | it changes when the SERVER changes, not when a key is pressed |
| `B3` | material catalogue, swatches rendered by the world's own shader | pick a wall material and build with it |
| `B4` | naming + rename, with the clash refusal | rename, and placements keep their labels |
| `B5` | part catalogue with rendered thumbnails | needs #17 `A1`/`A2` |
| `B6` | availability and its reasons | a leaf too wide for your frame says so |

⚠ `B3` before `B5`: materials exist now, parts do not.

⚠ **Start with `B1.1`, a thirty-line probe**, before anything is built on the bridge: a
window, `create_text_texture`, `draw_texture_at`, a screenshot — on `--html` *and* desktop.
The bridge was stubbed three days ago and four steps assume it works in the browser.

⚠ **The metrics seam is where this goes wrong if it goes wrong.** `font.loft` says
`text_width(s) = len(s) * 8`, which a real proportional font makes a lie, and this plan's own
verification list says a font whose metrics lie mis-lays every panel. `moros_ui` stays pure
(no GL context in its tests), so layout takes a `Metrics` struct the consumer fills from
`gl_measure_text`, the HUD asks for a **monospace** family so `len × advance` is exact, and a
gate compares the two — with a wrong advance seen red.

## Blocked-by — RESOLVED 2026-08-03

- ~~[loft#737](https://github.com/loft-lang/loft/issues/737) — `--html` stubs the text bridge~~
- ~~[loft#738](https://github.com/loft-lang/loft/issues/738) — and image load / CPU pixel upload~~

Both are fixed in the installed `loft 2026.8.0`, verified against the emitted page rather
than the API. Neither ever blocked the plan — the fallback was glyphs-as-geometry — but the
fallback is now the wrong build, so **do not write it**.

## Cross-arc dependencies

- **#17 (parts)** supplies the part family for `B5`; `B1`–`B4` do not wait on it.
- **#16 (client split)** owns the wire; `H:` lands there or is coordinated with it.
- **`lib/moros_ui` is consumed by `moros_sim`** — check it before calling the wiring done.
