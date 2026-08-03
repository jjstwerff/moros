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
| ✅ **`B1.2b`** | **the panel became lavition's** — `lavition_ui`, its own section below. | **DONE.** `editor_client.loft` compiles against it and builds a `Panel`. | M |
| ✅ `B1.3` | **`panel_draw_list`, not `panel_render(painter, …)`** — the panel emits RECTANGLES and the client draws them, so `lavition_ui` keeps needing no GL and "the selected button looks different" is a loft test rather than a pixel argument. | **DONE.** A PNG **from the client**, measured not eyeballed: strip **240px exactly**, bars `32,32,32,32,32,32`, 76% of the frame still world. ⚠ **It took three world gates red** — see below. | S |
| ✅ `B1.4` | `panel_text_list` beside the draw list; the client rasterises each string **once, outside the frame loop** (§C5). `Panel` now carries `p_metrics`, so the metrics that FIT a label are the metrics that PLACE it. | **DONE.** Labels legible in the client's PNG — 1180 glyph pixels, 678 of them in the buttons. ⚠ **The picture found a collision the per-string checks could not** — see below. | S |
| ✅ `B1.5` | The subject line — its **own bar across the top**, because §C1's own example is 69 characters and was never going to fit the 240px strip. The panel starts *below* it, so "never hidden" is geometry rather than hope. | **DONE.** In the client's PNG: 844 glyph pixels in the bar, 408 of them past the strip. ⚠ It says what it does **not** know — see below. | S |
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
| ✅ `B1.2b.1` | `lib/lavition_ui` — `widgets.loft` + `font.loft` verbatim, the layout rects, **an empty `[dependencies]`**. | **DONE.** ⚠ `layering.sh` **seen red first**: a planted `moros_map::` is reported by file and line, and stops the build before the suites. Under the old name it was skipped in silence. | S |
| ✅ `B1.2b.2` | `PanelSpec` replaces `ToolState`; `route_click` **deleted** — without its mutation it was `panel_hit_test` under a second name. The button count stops being the constant `6`. | **DONE.** 33 tests, both backends, **nothing linked** — no world, no window, no `moros_sim`. | M |
| ✅ `B1.2b.3` | Delete `moros_ui`; fix the two stale comments in `moros_sim` that pointed at it. | **DONE.** `make lib-test` and `make gate` (33) green. | XS |
| ✅ `B1.2b.4` | `editor_client.loft` declares the dependency, measures its font and builds a `Panel` — no drawing yet. | **DONE.** `make client` succeeds. Desktop and browser both report `6 buttons, advance 9, mono true, list 224x398` — ⚠ by **different routes**, see below. | S |

⚠ **`B1.2b.4` was the point of the whole step.** Everything before it refactors a library
nobody calls; that step is what stopped that being true, and it is why the old gate
(*"`moros_sim` still builds"*) was worth nothing — `moros_sim` cannot break, it does not know
this package exists.

⚠ **THE TWO TARGETS AGREE EXACTLY AND GET THERE BY DIFFERENT ROUTES.** The desktop loads the
`.ttf`; the browser cannot load font bytes, resolves the path's base name to a family Chrome
does not know, lands on a **proportional** face, and the client's retry takes the generic
`monospace` instead — reported as `the UI font fell back to the generic monospace family`.
The client never asks which target it is on. loft has no conditional compilation and this
needed none: **ask, measure, and keep the answer only if it is better.**

⚠ **`B1.3` TOOK THREE GATES RED, AND THE CAUSE WAS NOT THE PANEL.** `deck_soffit`,
`cellar_ceiling` and `camera_indoors` classify **every pixel** of the client's frame into
named surfaces and take shares of the total. `/` has been the wasm client since 2026-08-02,
so an opaque overlay is suddenly part of every world measurement.

The instructive part is which piece did it. Excluding the 240px strip did **not** fix
`deck_soffit`; the failing row was `sky 0.0364` in a gate that expects to be fully under a
deck. **24 of 660 rows is 3.6%** — the STATUS BAR, which `B1.2` had correctly widened to
span the window because its 80-character line never fitted a 240px column. A gate reading
the bottom bar as sky.

So the fix is one place, `tools/script.mjs`: a world gate measures the canvas **minus the UI
chrome** — the strip and the bar. That is not a threshold nudged to fit. A gate asking what
fraction of the view is roof is asking about the VIEW, and the panel is furniture in front
of it. The saved snapshot still shows the whole frame, because a human looking at a shot
wants the UI in it.

⚠ And the note that comment now carries: **no backticks inside it.** The block sits in a JS
template literal, and the first draft of that very warning quoted a variable in backticks
and stopped the file parsing — the trap the older comment forty lines below already named.

⚠ **`B1.4`: EVERY STRING FITTED ITS OWN BOX AND TWO OF THEM LANDED ON TOP OF EACH OTHER.**
The first picture showed `d` and `Look` overlapping in the first button, legible as neither.
`panel_build` measured the *label* against its box and placed the *hotkey* beside it
unmeasured — the same class `B1.2` was about, one column over.

No per-string check can see it, which is why the test is stated over **pairs**: two texts
sharing a line must not share pixels. And the first fix reintroduced it — fitting to
`HOTKEY_COL - 4` while drawing at `+6` left the hotkey 2px longer than the gap — so the room
is now *derived* from where it starts. ⚠ **Two numbers describing one distance is how that
happens.**

⚠ **And a truncation can invent an instruction.** With the column fitting one glyph, the
Look button's `"drag"` became `"d"` — which reads as *press d*, a binding that does not
exist. It is blank now: honest beats plausible.

⚠ **The panel's own gate broke when text arrived**, and the reason is worth keeping. It
counted button bars down **one column**, and that column then ran through the glyphs: six
buttons read as thirteen fragments. A single sample line is hostage to whatever is drawn on
it. A button row is *mostly* button, so it is a majority across the row now — which survives
labels, a highlight, or anything else drawn inside the box.

⚠ **`B1.5`: THE LINE SAYS WHAT IT DOES NOT KNOW.** Every field of the subject line is meant
to be what the **server** says (§C1), and `H:` is `B2` — it does not exist yet. So the client
prints `world — · mode — · toggles — (awaiting the server)` rather than a plausible
`AUTO · level ON` read off its own defaults.

**A plausible placeholder would be worse than an empty one.** `level ON` from a client-side
default looks exactly like `level ON` from the server, so the day `B2` lands there would be
nothing to notice — and until then it is a confident statement about a toggle nobody asked.
`B2`'s control (*"a key the server refuses must leave the line unchanged"*) only means
something if the line was never guessing in the first place.

⚠ **And "never hidden" is a geometric claim, so it gets a geometric test:** nothing else the
panel emits — rect or text — may occupy a pixel of the subject bar. Before `B1.5` the strip
started at `y=0` and would have covered the left end of the line, which is exactly where it
starts reading.

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
