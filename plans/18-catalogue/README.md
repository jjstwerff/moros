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
| ✅ `B1.1` | **A probe, before anything else** — `make probe-text`, [probe/b1](../../probe/b1/README.md). | **DONE.** Ink left/right: desktop **1127/0**, browser **1246/0**. The reader is itself checked against a blank frame, an all-white one, and real text. ⚠ **It found a live trap** — see below. | XS |
| ✅ `B1.2` | `Metrics` in `moros_ui`, threaded through `panel_build` and **load-bearing**: labels, list items and the status line are fitted to their boxes at build time. `metrics_measured` is the only constructor, so there is no fabricate-an-advance door. | **DONE.** 59 tests, both backends. Controls seen red: re-baking the advance at 8, a fixed-pitch check that always says yes, and a `fit_text` that stops truncating. ⚠ **It found the status strip 2.7× too small** — see below. | S |
| ⛔ **`B1.2b`** | **the panel becomes lavition's** — its own section below. `B1.3` cannot start until this lands. | `editor_client.loft` compiles against `editor_ui` | M |
| `B1.3` | `panel_render(p: Panel, painter, font, metrics)` — the rects and the toolbar, **no text**. ⚠ Needs `B1.2b`, and is the first **caller** of `metrics_measured`: pick the font per target, measure both runs, refuse/warn when `m_mono` is false. | a PNG from the CLIENT shows the 240 px strip and six buttons | S |
| `B1.4` | Text in `panel_render`, one cached texture per block (§C5). | the button labels are legible in the PNG | S |
| `B1.5` | The subject line itself — `world <name> · <mode> · …`, top-left, from `panel_build`. | the words are in the picture, **in the client** | S |
| `B1.6` | The metrics gate: bridge-measured width vs `text_width`. | ⚠ control seen red — a deliberately wrong advance must fail it | XS |

⚠ **`B1.1` was not ceremony, and it earned its place immediately.** Text does reach the
canvas on both targets — that half of the question came back clean. But the *same* font
argument gives **two different fonts**: `gl_load_font(".../DejaVuSansMono.ttf")` is fixed
pitch on the desktop and a **proportional fallback** in the browser, because the browser
cannot load font bytes and resolves the path's base name to a CSS family it does not know.

A panel laid out on `len × advance` against a proportional face mis-lays every row **and
nothing reports it** — the text still draws, it is just in the wrong place. That is `C0a`'s
hazard, found before `panel_render` existed rather than after four steps were built on it,
which is the entire argument for putting a probe first.

⚠ Asking the browser for the generic `monospace` gives **192.66, exactly the desktop's
DejaVu** — so they *can* agree to the last digit, but only because Chrome's default monospace
is the same face on this box. A coincidence, not a contract; measure at runtime.

⚠ **`B1.2` then found a second thing, by making the metrics load-bearing.** The status strip
was `PANEL_WIDTH` — 240 px — while the text it has always been handed is 81 characters, about
**648 px**. It overflowed its own box by 2.7× from the day it was written, and nothing
reported it because nothing measured: `panel_render` was never built, so the text never met
its rectangle. The content settles which was wrong — `q/r/cy/altitude/FPS` plus a facing hint
is full-width status-bar text — so `status_rect` now spans the window.

⚠ **And `moros_ui` has no consumer.** Its manifest depends on `moros_sim`, not the reverse,
and nothing in the tree depends on it. That is why `B1.2` could change `panel_build`'s
signature freely — and why `B1.3` must produce an actual caller, because until then this arc
is building a library nobody invokes.

### B1.2b — the panel becomes lavition's, not Moros's

⚠ **A prerequisite for `B1.3`, discovered by `B1.2`.** `moros_ui` has no consumer, and the
one program that needs a panel — `editor_client.loft` — cannot take it, because it depends
on `moros_sim` + `moros_editor` + `moros_map` and the client uses none of them. The design is
[EDITOR_UI.md](../../doc/claude/EDITOR_UI.md).

⚠ **The rename is the mechanism, not a tidy-up.** `tools/layering.sh` skips any package named
`moros_*` — *a consumer may depend on anything* — so the check that exists to catch exactly
this arrow waved `moros_ui` through for months. Renaming out of that namespace puts the
package under the check, and the decoupling becomes something a script refuses to let
regress.

| | step | proves it | size |
|---|---|---|---|
| `B1.2b.1` | `lib/editor_ui` with `widgets.loft` + `font.loft` verbatim, and the layout rects. **No `moros_*` dependency in the manifest.** | `make lib-test` green; ⚠ **`layering.sh` seen red first** — add a `moros_map::` reference and confirm the build stops before the suites run | S |
| `B1.2b.2` | `PanelSpec` replaces `ToolState` in `panel_build`; `route_click` returns its `UiHit` instead of mutating. | the layout, hit-test and metrics tests move across and pass **with no world and no `moros_sim` linked** | M |
| `B1.2b.3` | Delete `moros_ui`. | nothing references it; `make lib-test` and `make gate` green | XS |
| `B1.2b.4` | `editor_client.loft` declares the dependency and builds a `Panel` from a `PanelSpec` — no drawing yet. | ⚠ **`make client` succeeds** — the caller this arc has never had | S |

⚠ **`B1.2b.4` is the point of the whole step.** Everything before it is refactoring a
library nobody calls; that step is what stops that being true, and it is why the old gate
(*"`moros_sim` still builds"*) was worth nothing — `moros_sim` cannot break, it does not know
this package exists.

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
