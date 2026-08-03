<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# CATALOGUE — what you are working on, what it is called, and what is available

*(user, 2026-08-02: "design that it is clear what you are working on at all time, you can give
things a name and there is a list of things that are known with name and image. The same goes
for possible walls, floors, etc")*

Plan [#18](https://github.com/jjstwerff/moros/issues/18), a sub-arc of
[#7](https://github.com/jjstwerff/moros/issues/7). Design only.

**Start from what is true today: the editor tells you nothing.** The browser client binds
fourteen keys — `w s a d`, `↑ ↓`, `l f g e q b c r` — and documents none of them, shows no
mode, no name, no state, and no list of anything. The page that came before it had a single
static HUD string, and that was deleted with it.

---

## C0 — The constraint that shaped this design is GONE (2026-08-03)

⚠ **This section said the opposite, in a table, and it was right when written.** loft fixed
both issues ([#737](https://github.com/loft-lang/loft/issues/737),
[#738](https://github.com/loft-lang/loft/issues/738)) and the installed `loft 2026.8.0`
carries the fix. Re-measured in the emitted page, the same way the original claim was made:

| capability | was | in `loft --html` today |
|---|---|---|
| `gl_load_font` / `gl_measure_text` / `gl_text_height` / `gl_font_ascent` | stubbed | **real** — `measureText` on a 2D canvas, real metrics |
| `rasterize_text_into` / `gl_text_texture` | stubbed | **real** — `fillText`, white-on-transparent, alpha *is* the coverage |
| `gl_upload_canvas` | stubbed | **real** |
| `gl_upload_alpha_texture` | stubbed | **real** — uploads a buffer the program computed |
| `gl_load_texture` | `return 0; /* TODO */` | **real** — serves a bundled asset |
| `TODO` markers in the emitted page | present | **0** |
| render to an offscreen texture, draw geometry, `draw_rect_at` | real | real |

⚠ **Both issues are still OPEN on the tracker while the code is fixed.** Trust the
measurement, not the label, and re-measure before believing either — including this table.

**The route is two calls, and neither is ours to write:**

```
tex = graphics::create_text_texture(font, content, size, colour)   // rasterise + upload
graphics::draw_texture_at(painter, tex, x, y, w, h)               // blit
graphics::gl_delete_texture(tex)                                  // caller owns it
```

### What this changes, and what it does not

- **§C5 is withdrawn. Glyphs are NOT geometry.** That was a workaround for a shut door, and
  the door is open. A geometry font is now strictly worse: more code, worse shapes, and a
  second set of metrics to keep honest. **Do not build it.**
- **§C4 survives, and for its own reason.** Catalogue images stay *rendered* not because
  loading is impossible but because a rendered swatch **is** the material while a stored one
  is a claim about it. `gl_load_texture` working changes nothing about that argument — it
  only removes the excuse that made it unavoidable.

⚠ `moros_ui` has had the panel layout, hit-test and click routing **with tests** for some
time. What it lacks is `panel_render` — never written — and `font.loft`, a placeholder whose
own comment says the glyphs "will land alongside the loft_gl text bridge in Step 9". **That
bridge has now landed**, which is exactly what `font.loft` was waiting for. **This plan is
largely *finish `moros_ui`*, not *design a UI*.**

### C0a — The metrics seam, which is where this goes wrong if it goes wrong

`font.loft` says `text_width(s) = len(s) * 8`. With a real proportional font **that is a
lie**, and this doc's own verification table already names the consequence: *"a font whose
metrics lie mis-lays every panel"*.

But `moros_ui` is a **pure library with no GL context**, and it must stay that way — its
layout tests run under `loft test` with no window. So the seam:

```
struct Metrics { m_advance: integer, m_line_h: integer, m_mono: boolean }
```

- **The library takes `Metrics` as a parameter** and does pure layout arithmetic with it.
  Every existing layout test keeps working, and gains a second run at a different advance —
  which is what stops `8` being baked in by accident.
- **The consumer fills it once at startup** from `gl_measure_text` / `gl_text_height`.
- **A gate asserts the two agree**: measure a known string through the bridge and compare
  with `text_width` under the `Metrics` the consumer handed over. ⚠ With the control seen
  red — hand it a deliberately wrong advance and the gate must fail, or it is comparing a
  number with itself.
- **The HUD asks for a monospace family**, so `len × advance` is *exact* rather than
  approximately right. A proportional font needs per-string measurement, which drags the GL
  context into the library. Monospace is the smaller, safer commitment; a proportional HUD
  can come later behind the same `Metrics` seam.

---

## C1 — The subject line: always visible, and it comes from the authority

One line, top-left, never hidden:

```
world hollow-hill · AUTO · level ON · run armed · roof hidden · 30 Hz
part  frame/oak-2x3 · EYES · level off · 1 socket · stepped
```

It answers *what am I working on* and *what is switched on*, which are the same question
asked twice.

⚠ **Every field is what the SERVER says, never what the client believes it sent.** The client
sends a toggle; the server may clamp it, refuse it, or have had it changed by another author.
A HUD that echoes the keystroke is a picture of the client's intention — this tree has already
paid for the general version of that mistake twice, and the rule it wrote down is *measure
what was emitted, never a number the producer re-derives*. So the state arrives on the wire
(`H:` — tag free; `C D E F G K L M P Q S T V X Z` are taken) and is sent **on change** plus
**to an arriving client**, with the re-send placed where the client joins the list rather than
in the handler that precedes it.

---

## C2 — A name is author-facing, and it is NOT an identity

Anything placeable can be given a name: a part, a material, a placed instance, a saved world.

⚠ **The store's identity stays the label.** `I1` says one object owns one label, and the
cellar work this session is what made that hold in the writer. A name is a *second* handle,
and if renaming renumbered anything then every reference in every document would have to be
rewritten to fix a typo. So:

- the **label** is identity — opaque, stable, never shown as the primary thing;
- the **name** is a mutable attribute, unique **per kind**, and shown everywhere;
- an unnamed thing gets a generated name that is honest about being generated — `house-3`,
  not a blank and not `Untitled`. A blank invites the author to believe the field is broken.

Renaming is a gesture with the editor's own doorstep shape — **ok, reason, offer, residual**.
A clash is refused *with the offer*: `"oak-2x3" is taken · offer "oak-2x3-2"`.

---

## C3 — One list, two families

A catalogue entry is **kind · name · image · availability**, and exactly the same widget
serves both families, because both are *a named thing you pick and then place*:

| family | entries | exists today |
|---|---|---|
| **parts** | houses, door-frames, leaves, window-frames, pillars, statues | plan [#17](https://github.com/jjstwerff/moros/issues/17) — nothing yet |
| **materials** | wall, floor, roof, ground surface, fence, road, field | **yes** — the surfaces the mesher already separates |

`moros_ui::palette_items_for_tool(tools) -> vector<text>` is already the seam: it returns the
list for the current tool. It grows an image and a kind; it does not grow a second widget.

⚠ **Availability is part of the entry, not a separate dialog.** A door leaf that does not fit
the frame you are standing in is *shown greyed with its reason*, not hidden. Hiding it makes
the author think the part is missing; showing it with `too wide for frame/2x3` tells them what
to change. This is the refusal rule from §C2 applied to a list.

---

## C4 — The image is rendered, and that is why it can be trusted

- **A part thumbnail** — render the part into an offscreen colour texture from a canonical
  three-quarter view under canonical light. Cached by `(part, version)`; the version already
  exists in the layer.
- **A material swatch** — render one hex tile of that material **with the world's own shader
  and the world's current light**. Not a hand-picked RGB in a table.

That second one is the rule this tree keeps re-learning, applied to a UI: a swatch someone
typed in is a *claim* about the material and drifts silently the day the shader changes; a
swatch the world drew **is** the material. The same reason `mesh_crc` compares what was
emitted rather than what the producer thinks it emitted.

⚠ **And it is why the image must not be a PNG on disk.** A generated `data/parts/*.png` is a
cache with no invalidation, and the browser cannot load it anyway (§C0).

---

## C5 — WITHDRAWN. Text is a texture, and the cost is a cache

⚠ **This section used to specify a geometry font** — ASCII 32..126 on a 5×7 cell, glyphs as
filled rectangles through `draw_rect_at`. It existed only because the text bridge was
stubbed (§C0), and it is now the wrong build. **Do not write it.**

What replaces it is smaller: `create_text_texture` + `draw_texture_at`, both in `graphics`.

**The cost moves from triangles to texture churn**, and that is the thing to watch.
`create_text_texture` rasterises *and uploads* on every call — a per-frame call for a HUD
line that changes once a second is an upload per frame for nothing, and `gl_delete_texture`
churn besides. So:

> **One texture per text block, rebuilt only when that text changes**, keyed by the string.
> The subject line changes on a toggle, not on a tick.

⚠ **And the number gets measured, not asserted.** The instrument is the `27:` tracer's
milliseconds plus a **count of `create_text_texture` calls per second** — the second one
because a cache that silently misses looks exactly like a cache that works, and this editor
has already had one instrument report the camera as 993 ms of every second. A HUD that
rebuilds every line every frame is the failure mode, and it is invisible in a picture.

---

## C6 — Do not redesign the panel; wire the one that exists

`lib/moros_ui` already has, tested: a 240 px left strip, a six-button toolbar, a scrollable
list, a status line, `panel_hit_test`, `route_click`, `editor_click`. What is missing is
`panel_render` and the glyphs.

⚠ **Its consumer today is `moros_sim`'s walkable editor, not the wasm client.** Adding a
dependency to a shared package in this tree turned a sibling's build red twice this session
(`moros_render` → `fabs`, then `seg_len`). So the wiring is checked against `moros_sim`
before it is called done, and if the dependency direction fights, the render half becomes a
leaf package the way `moros_terrain` did.

---

## What this is verified by

**Library (`lib/moros_ui/tests/`), pure:**

| claim | why not a gate |
|---|---|
| a name clash is refused, with the offer | a refusal has no picture |
| names are unique per kind, and renaming does not change a label | measured in the store |
| the catalogue lists every material the mesher can emit — **derived from the mesher, not a second list** | a hand-kept list drifts; this is the `I1`-style claim |
| an unavailable entry carries a reason | the reason is a sentence |
| layout, hit-test, click routing | already tested, and stays that way |
| `text_width` matches the glyphs actually emitted | a font whose metrics lie mis-lays every panel |

**Gates (running world, a PNG):**

- the subject line **reads correctly** after a mode change — the words are in the picture;
- every toggle's state changes the line when the server changes it, and **not when the client
  merely asks** — the control that separates a HUD from an echo;
- the catalogue shows N entries, each with a **non-blank** image — ⚠ with the control seen
  red: a swatch that fails to render must read blank, or "it drew something" proves nothing;
- a renamed part keeps its placements.

---

## The order of work

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

## See also

- [PARTS](PARTS.md) — the parts family this catalogues, plan #17
- [SCRIPTED_EDITOR](SCRIPTED_EDITOR.md) — how any of this is verified: a script, a tick, a PNG
- [WIRE_PROTOCOL](WIRE_PROTOCOL.md) — the tags in use, and why `H:` is free
