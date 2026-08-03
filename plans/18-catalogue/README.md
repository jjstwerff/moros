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
| ✅ `B1.6` | The metrics gate: bridge-measured width vs `text_width`, over the strings the panel actually shows. | **DONE.** ⚠ **It found a 31px error before asserting anything** — see below. Now `drift 1px`, with a 10% wrong advance reading `48px` as the built-in control. | XS |

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

⚠ **`B1.6` FOUND A 31px ERROR BEFORE IT ASSERTED ANYTHING.** `Metrics` kept the advance as
a whole integer. DejaVu Sans Mono at 16px advances **9.6px**, which truncates to 9 — and the
error is per CHARACTER, so it accumulates: the editor's own subject line measured **31px
narrower** than the bridge rasterises it.

**And under-estimating is the dangerous direction.** `fit_text` then believes more fits than
does, so text overflows a box it was *just proved to fit* — the exact `C0a` failure, reached
by a different route than the proportional-font one `B1.1` found. Two independent causes for
one symptom is the argument for measuring the seam rather than reasoning about it.

The advance is kept in **1/64 px** now (the unit fonts are hinted in) and `text_width` rounds
**up**: an over-estimate reserves a pixel too many and the text fits; an under-estimate
overflows. Drift went 31px → 1px, and the 1px is that deliberate rounding.

⚠ **The gate carries its own control, and that is what makes a 0 mean anything.** A drift of
zero reads identically whether the two agree or the comparison is broken, so the client
measures the same strings a second time against an advance bent by a tenth and reports both:
`drift 1px, control 48px`. Seen red for real — reverting to the whole-pixel advance gives
`!! drift 31px - the library and the bridge disagree` — and the failure was confirmed to
propagate through `make probe-text` rather than being printed and ignored.

### B2 — the line tells the truth

| | step | proves it | size |
|---|---|---|---|
| ✅ `B2.1` | `H:` on the wire — the **whole line**, composed by the server, sent on every accepted change. | **DONE.** `tools/gates/world/subject.mjs`, a plain socket: `H:world (unsaved) · AUTO · level off · road off · trace off`. ⚠ Nothing kept the world's NAME before this — see below. | S |
| ✅ `B2.2` | Re-send placed **where the client joins the list**, not in the `1:` handler after it. | **DONE.** A second socket joining after two accepted toggles is told the CURRENT line, not the opening one. | S |
| ✅ `B2.3` | The client keeps `H:` **verbatim** and has no code path that composes a line of its own. | **DONE.** ⚠ The control passes: `40:7` is refused by name and **0 `H:` are sent**. And the picture is checked against a live server — a page served from anywhere else never connects. | S |

⚠ **`B2`: NOTHING KEPT THE WORLD'S NAME.** `8:` and `9:` took one, used it as a path, and
forgot it — so the editor could not answer *"what am I working on"*, the first question §C1
asks, about the one thing it is definitely working on. `world_name` exists now, set **only on
a successful** save or load: a subject line renamed by a load that did not happen is the same
lie the mode control is aimed at, one message over.

⚠ **THE SERVER SENDS THE WHOLE LINE, not fields for the client to phrase.** That is the
strongest form of §C1 — the client cannot re-word it, re-order it, or fill a gap with a
default. It displays what it was told or it displays nothing. **FPS is deliberately absent**:
it is a client fact the server does not know, and one mixed field would make "the server
authored this line" untrue of the whole. It belongs in the client's own status bar.

⚠ **The gate is a SOCKET, not a picture, and that is not a shortcut.** A screenshot cannot
tell a line the server sent from one the client wrote for itself — they are the same pixels.
Only the wire can see whether anything was sent at all, which is exactly what the refusal
control asks.

⚠ **And the client half needs the page served BY the editor server.** The client opens
`ws://127.0.0.1:18090/ws` as a compile-time constant, since a `--html` program cannot read
`location`. Served from anywhere else it loads, draws its panel perfectly, and never connects
— 300 frames, 0 meshes, and a subject line still reading *"awaiting the server"*. It looks
exactly like a broken client and is a page served by the wrong host.

### B3 — the material catalogue

| | step | proves it | size |
|---|---|---|---|
| ✅ `B3.1` | `moros_terrain::surfaces()` — one list, with the names, the colours and the count all derived from it. | **DONE.** 5 loft tests. ⚠ **It found `road` and `wall` 0.00009 apart in chromaticity** — inside the classifier's own tolerance. See below. | S |
| ✅ `B3.2` | `N:` on the wire, derived from the same list; the client puts it in `ps_items`. (⚠ `palette_items_for_tool` is gone — `B1.2b` deleted it as client-authoritative state.) | **DONE.** Nine names in the client's list well, in its own PNG; the wire gate pins the count against the mesher. | S |
| ✅ `B3.3` | Swatch rendering — one hex tile through the **world's own shader**, with the world's current `uAmb`/`uLamp`, into an offscreen texture, cached per material. | **DONE.** Nine swatches in the client's PNG, **9 of 9 lit and 9 distinct colours**. ⚠ The count said nine before any of them drew — see below. | M |

⚠ **`B3.1` FOUND `road` AND `wall` 0.00009 APART IN CHROMATICITY** — an order of magnitude
*inside* the 0.0009 the picture gates classify with. Both were neutral greys differing only
in brightness, and chromaticity divides brightness out, so **nothing could tell a road from a
wall**. No gate had both in frame with a threshold that mattered, so nothing said so.

This is the same failure the floor had (0.0003 from the wall, which made an interior gate's
second row unmeasurable) and it was fixed the same way: **in the renderer, not the
classifier** — separating them in a classifier leaves the picture just as ambiguous to a
person looking at it.

⚠ **The new colour is a measurement, not a taste.** A neutral can never separate from another
neutral; cool collides with the **sky**; plain brown lands 0.00014 from the **figure**'s skin.
What is left is a red earth — which is what these roads are anyway, since `freeze_grade` cuts
one *into* a hill rather than painting a stripe on it. Nearest neighbour is now the floor at
0.0032, 3.5× the tolerance.

⚠ **The test sweeps what the CLASSIFIER sees, not what the mesher emits.** The figure and the
sky are in every histogram and are not meshes, so `classified()` is `surfaces()` plus those
two — and "brown" is exactly where the road wanted to go and the figure already was.

⚠ **`SURFACES` could not actually be derived, and that is a loft defect.**
`const X = some_fn()` aborts the interpreter with a **non-unwinding panic and no source
location** — [loft#744](https://github.com/loft-lang/loft/issues/744). So the stride and the
colours stay literals in `editor_server.loft`, held equal to the list by a loft test rather
than by the compiler. ⚠ And `tools/script.mjs`'s palette is a **third** copy, cross-language:
the same shape moros#3 closed for the hex lattice with a shared fixture, and the same fix is
available when it next bites.

⚠ **`B3.3`: THE CLIENT REPORTED NINE SWATCHES AND THE PICTURE HAD NONE.** Nine textures
created, nine draws issued, nothing on screen — the same *"it drew something"* split read the
other way round, and a count of **draw calls is not a count of pixels**.

Two causes, both mine, and both invisible to the count:

1. **The hexagon was built in the world's XZ plane, and clip space is XY.** With identity
   matrices the tile collapsed to the line `y = 0`. Reaching for the ground plane is the
   natural mistake when the thing being drawn *is* a ground tile.
2. **The framebuffer has a colour attachment and no depth one**, while the world draw leaves
   the depth test enabled — so every fragment was tested against a buffer that is not there.

⚠ **No matrix library, and none needed.** The tile is built directly in clip space, so
`uModel`/`uView`/`uProj` are all identity. Writing an ortho and a look-at to aim a camera at a
flat hexagon would be a second projection path to keep honest, for a picture 22 px tall. The
normal still points up the Y axis so the shader lights it exactly as it lights ground — the
swatch is meant to look like the material underfoot.

⚠ **The gate asks for two things, and one alone proves little.** *Drawn* (above the list
background) and *different* — nine identical blobs would pass the first perfectly and mean the
shader drew one colour for every material. Controls seen red on both the pre-swatch picture
and, more usefully, on the one where the client claimed nine and drew zero.

⚠ **And the swatch check is asked for, not assumed** (`--swatches`). A client with no server
has an empty catalogue and therefore no swatches, correctly — demanding them of every picture
would fail the one stage that deliberately runs without a server.

### B4 — names

| | step | proves it | size |
|---|---|---|---|
| ✅ `B4.1` | `hex_editor::names` — a **side table** from `(kind, name)` to a label, unique per kind, with generated names for the unnamed. | **DONE.** 11 loft tests, both backends. Two kinds may share a name; a generated one says its kind (`house-3`). | S |
| ✅ `B4.2` | Rename with the clash refusal. ⚠ **`Fit` could not carry it** — see below. | **DONE.** The sentence is asserted literally: `"oak-2x3" is taken · offer "oak-2x3-2"`. And the offer is checked to be **actually free**. | S |
| ✅ `B4.3` | Renaming does not touch labels. | **DONE.** Measured *through the table*: the label is asked for again under the NEW name and must be the same number. Control seen red — a rename that renumbers fails it by name. | S |

⚠ **`B4`: `Fit` COULD NOT CARRY A NAME CLASH, and the reason is worth keeping.** `Fit.ft_offer`
is an **integer** — it was built for *ordinal* parameters, where the offer is the nearest
admissible value. Its own comment says *nominal* ones (a material, a species) are refused
**without** an offer, because 255 is not "nearly" 256.

A name is a third case neither arm covers: nominal, so there is no nearest value — and yet it
**has** a constructible alternative, by appending a suffix until one is free. §C2 asks for
exactly that. So `NameFit` carries a **text** offer and `Fit` is left alone, rather than
growing a second offer field that would be meaningless in most of its uses.

⚠ **An offer that is itself taken is not an offer.** `name_free` walks until it finds a name
nobody holds, and the test takes the offer up to prove it. Handing back a name that fails the
moment the author accepts it is worse than no offer: it looks like the editor agreed. The
control is red without the walk — with `oak`, `oak-2` and `oak-3` all held, a naive
`want + "-2"` offers `oak-2` again.

⚠ **And the search is bounded.** An unbounded scan of a full namespace is a hang, and a hang
in an editor reads as a crash.

### B5 — the part catalogue *(needs #17 `A1`–`A2`)*

| | step | proves it | size |
|---|---|---|---|
| `B5.1` | Entries from `data/parts/`, names only. | the list shows what is on disk | S |
| `B5.2` | Thumbnails — the part rendered from a canonical three-quarter view, cached by `(part, version)`. | a PNG shows non-blank thumbnails, same blank-control as `B3.3` | M |
| `B5.3` | Cache invalidation on the part's version. | edit a part, and its thumbnail changes — ⚠ the control is that it changes, not merely that it is non-blank | S |

### B6 — availability

| | step | proves it | size |
|---|---|---|---|
| ✅ `B6.1` | `lavition_ui::Entry` — label, available, reason. `ps_items` is a list of entries, not of strings. | **DONE.** A blocked entry with no reason gets a **visible placeholder** rather than an empty string nobody notices. | XS |
| ✅ `B6.2` | Greyed rendering with the reason on the row — **not hidden**. Three of the nine surfaces really are unpaintable, so this is a live rule and not a demonstration. | **DONE.** In the client's PNG: `tree — scattered`, `frame — derived`, `soffit — derived`, greyed, still listed and still clickable. | S |

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
