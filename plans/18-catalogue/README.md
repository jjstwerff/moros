<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# Plan 18 — Catalogue

**Issue:** [`jjstwerff/moros#18`](https://github.com/jjstwerff/moros/issues/18) ·
**Value:** `U` · **Effort:** `MH` · a sub-arc of
[#7](https://github.com/jjstwerff/moros/issues/7) (hex_editor's configuration surface).

## Status

**DESIGNED, not started.** Nothing below is built.

**Goal.** The editor always says what you are working on and what is switched on; things can
be named; and there is one browsable list of what is available — parts and materials alike —
each entry carrying a name and an image.

**The design is [doc/claude/CATALOGUE.md](../../doc/claude/CATALOGUE.md)** — `C0`–`C6` and
what verifies them. That doc holds the *durable* truth; **this file holds the order of work**,
and each step's gate travels with the step.

⚠ **This is largely *finish `moros_ui`*, not *design a UI*.** The panel layout, hit-test and
click routing are built and tested; `panel_render` was never written, and `font.loft` is a
placeholder whose own comment says it is waiting for the loft text bridge.

⚠ **That bridge landed on 2026-08-03, and it changes this plan's premise.** `B1` was "glyphs
as geometry" because `--html` stubbed the whole text path. loft fixed it
([#737](https://github.com/loft-lang/loft/issues/737),
[#738](https://github.com/loft-lang/loft/issues/738)) and the installed `loft 2026.8.0`
carries it — measured in the emitted page, not read from the API. **`B1` is now "draw text
through the bridge", and the geometry font must not be built.** See
[CATALOGUE.md § C0](../../doc/claude/CATALOGUE.md).
⚠ Both issues are still **open on the tracker** while the code is fixed; re-measure the
emitted page rather than trusting either label.

## Phase ordering

Each step below is **one sitting and one commit**, ends green, and leaves the editor
working. The six letters are the arcs; the numbered rows are the steps.

⚠ **`B3` before `B5`.** Materials exist *now*; parts do not. Building the catalogue against
the family that already has entries makes it something you can look at and argue with in one
sitting — and if the widget is wrong, it is wrong before plan #17 has been built on it.

### B1 — text on the screen

| | step | proves it | size |
|---|---|---|---|
| `B1.1` | **A probe, before anything else.** A standalone loft program: window, `gl_load_font("monospace")`, `create_text_texture("MOROS", 24)`, `draw_texture_at`, screenshot. Run it on `--html` **and** desktop. | a PNG with **non-black pixels where the word is**, ⚠ and the control: the same probe with an empty string must produce a blank frame — otherwise "it drew something" is unproven | XS |
| `B1.2` | `Metrics` struct in `moros_ui`, threaded through `panel_build` (§C0a). No rendering yet. | existing layout tests pass, **plus a second run at a different advance** — the perturbation that stops `8` being baked in | S |
| `B1.3` | `panel_render(p: Panel, painter, font, metrics)` — the rects and the toolbar, **no text**. | a PNG shows the 240 px strip and six buttons | S |
| `B1.4` | Text in `panel_render`, one cached texture per block (§C5). | the button labels are legible in the PNG | S |
| `B1.5` | The subject line itself — `world <name> · <mode> · …`, top-left, from `panel_build`. | the words are in the picture, and `moros_sim` still builds (§C6) | S |
| `B1.6` | The metrics gate: bridge-measured width vs `text_width`. | ⚠ control seen red — a deliberately wrong advance must fail it | XS |

⚠ **`B1.1` is not ceremony.** Everything after it assumes the bridge works in the *browser*,
and that was false three days ago. One probe, thirty lines, before four steps are built on
the assumption.

### B2 — the line tells the truth

| | step | proves it | size |
|---|---|---|---|
| `B2.1` | `H:` on the wire — server → client, the toggle set as one string. Sent **on change**. | `WIRE_PROTOCOL.md` row added; a plain socket sees `H:` after a toggle |  S |
| `B2.2` | Re-send to an arriving client — ⚠ placed **where the client joins the list**, not in the handler before it. | a second client connects mid-session and its line is correct | S |
| `B2.3` | The client renders `H:` rather than its own key state. | ⚠ **the control that makes this real**: a key the server *refuses* must leave the line unchanged. A HUD that echoes the keystroke passes every other test. | S |

### B3 — the material catalogue

| | step | proves it | size |
|---|---|---|---|
| `B3.1` | `catalogue_materials()` **derived from the mesher's own surface set**, not a second list. | the count matches what the mesher can emit — an `I1`-style claim, in a loft test | S |
| `B3.2` | Entries in the existing `ListBox` via `palette_items_for_tool`, names only, no images. | picking one and building uses it | S |
| `B3.3` | Swatch rendering — one hex tile, **the world's own shader and current light**, into an offscreen texture, cached per material. | a PNG shows N non-blank swatches, ⚠ with the control: a swatch that fails to render must read **blank**, or "it drew something" proves nothing | M |

### B4 — names

| | step | proves it | size |
|---|---|---|---|
| `B4.1` | The name table: `kind + name -> label`, unique per kind, generated names (`house-3`) for the unnamed. | loft test: uniqueness per kind, and a generated name is never blank | S |
| `B4.2` | Rename, with the clash refusal — **ok, reason, offer, residual**. | `"oak-2x3" is taken · offer "oak-2x3-2"`, in words | S |
| `B4.3` | Renaming does not touch labels. | ⚠ measured **in the store**: placements keep their labels across a rename | S |

### B5 — the part catalogue *(needs #17 `A1`–`A2`)*

| | step | proves it | size |
|---|---|---|---|
| `B5.1` | Entries from `data/parts/`, names only. | the list shows what is on disk | S |
| `B5.2` | Thumbnails — the part rendered from a canonical three-quarter view, cached by `(part, version)`. | a PNG shows non-blank thumbnails, same blank-control as `B3.3` | M |
| `B5.3` | Cache invalidation on the part's version. | edit a part, and its thumbnail changes — ⚠ the control is that it changes, not merely that it is non-blank | S |

### B6 — availability

| | step | proves it | size |
|---|---|---|---|
| `B6.1` | An entry carries `available: boolean + reason: text`. | loft test: an unavailable entry has a non-empty reason | XS |
| `B6.2` | Greyed rendering, reason shown — **not hidden** (§C3). | a leaf too wide for the frame you stand in reads `too wide for frame/2x3` | S |

---

## Cross-arc dependencies

- **#17 (parts)** supplies the family `B5` lists, and `B5` needs its `A1`–`A2`. `B1`–`B4` do
  not wait. ⚠ #17's `A7.2` (its picker) **is** `B5` — one catalogue, not a second widget.
- **#16 (client split)** owns the wire; `H:` (`B2.1`) lands there or is coordinated with it.
- **`lib/moros_ui` is consumed by `moros_sim`**, not by the wasm client. Adding a dependency
  to a shared package in this tree turned a sibling red twice in one session, so the wiring is
  checked against `moros_sim` before `B1` is called done — and if the dependency direction
  fights, the render half becomes a leaf package the way `moros_terrain` did
  ([CATALOGUE.md § C6](../../doc/claude/CATALOGUE.md)).
