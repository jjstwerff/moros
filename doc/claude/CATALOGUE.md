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

## C0 — The constraint that shapes every answer below

Measured in the emitted page, not read from the API docs:

| capability | in `loft --html` |
|---|---|
| draw text (`gl_load_font` / `measure_text` / `rasterize_text_into` / `gl_text_texture`) | **stubbed** — returns the null sentinel, `0.0`, `0`, `0` |
| load an image (`gl_load_texture`) | **`return 0; /* TODO: async asset loading */`** |
| upload a CPU pixel buffer (`gl_upload_alpha_texture`) | **stubbed** |
| `println` as a fallback | **not visible** — `gl_create_window` sets `output.style.display = "none"` |
| render to an offscreen texture (`create_color_texture` + `framebuffer_texture`) | **real** |
| draw geometry, bind textures, `draw_rect_at` | **real** |

Filed as [loft#737](https://github.com/loft-lang/loft/issues/737) (text) and
[loft#738](https://github.com/loft-lang/loft/issues/738) (pixels). Both doors being shut is
what makes this a design constraint rather than a missing call:

> **The only way to put pixels on the browser canvas is to render them with GL.**

Two consequences, and the second is a gift:

- **Glyphs are geometry**, not a font texture (§C5).
- **Every image in the catalogue is RENDERED, never loaded** (§C4) — so it cannot go stale,
  and a material swatch is the material rather than a claim about it.

⚠ `moros_ui` has had the panel layout, hit-test and click routing **with tests** for some
time. What it lacks is `panel_render` — never written — and `font.loft`, a placeholder whose
own comment says the glyphs "will land alongside the loft_gl text bridge in Step 9". That
bridge is stubbed, so the thing it was waiting for was never coming. **This plan is largely
*finish `moros_ui`*, not *design a UI*.**

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

## C5 — Glyphs are geometry, and the cost is measured before it is believed

`moros_ui::font` gets real data: ASCII 32..126 on a 5×7 cell, each glyph a small set of
filled rectangles emitted through `draw_rect_at` / the 2D painter, batched into **one mesh
per text block** and rebuilt only when that text changes.

A 40-character line is a few hundred triangles. That is nothing next to a chunk, *and I do not
get to assert that*: the number to take is **vertices per HUD frame** and the `27:` tracer's
milliseconds, because this editor has already had one instrument say the camera was 993 ms of
every second and no amount of reading would have found it.

If [loft#738](https://github.com/loft-lang/loft/issues/738) lands, `upload_alpha_texture` makes
the same font a 200-byte texture and the geometry path is deleted. The design does not depend
on that; it just gets cheaper.

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

| | step | done when |
|---|---|---|
| `B1` | glyphs as geometry + `panel_render` + the subject line | a PNG shows the words, and `moros_sim` still builds |
| `B2` | toggle state on the subject line, sourced from the server (`H:`) | the line changes when the server changes, not when the key is pressed |
| `B3` | **material catalogue**, swatches rendered by the world's own shader | pick a wall material from the list and build with it |
| `B4` | naming + rename, with the clash refusal | rename a material set, placements keep their labels |
| `B5` | **part catalogue** with rendered thumbnails | needs plan #17 `A1`/`A2` |
| `B6` | availability and its reasons — greyed entries that say why | a leaf too wide for the frame you stand in says so |

⚠ **`B3` before `B5`.** Materials exist *now*; parts do not. Building the catalogue against
the family that already has entries makes it something you can look at and argue with in one
sitting — and if the widget is wrong, it is wrong before plan #17 has been built on top of it.
That is this tree's *build to learn* rule, and the reason `B1` is a HUD rather than a
framework.

## See also

- [PARTS](PARTS.md) — the parts family this catalogues, plan #17
- [SCRIPTED_EDITOR](SCRIPTED_EDITOR.md) — how any of this is verified: a script, a tick, a PNG
- [WIRE_PROTOCOL](WIRE_PROTOCOL.md) — the tags in use, and why `H:` is free
