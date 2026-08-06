<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# CATALOGUE — what you are working on, what it is called, and what is available

*(user, 2026-08-02: "design that it is clear what you are working on at all time, you can give
things a name and there is a list of things that are known with name and image. The same goes
for possible walls, floors, etc")*

Plan [#18](https://github.com/jjstwerff/moros/issues/18), a sub-arc of
[#7](https://github.com/jjstwerff/moros/issues/7). This doc holds the decisions; **the order of
work is in [the plan](../../plans/18-catalogue/README.md)**, step by step with its gates.

> ✅ **BUILT — every step of #18 is done** (`B1`, `B1.2b`, `B2`–`B6`), and this line said *"design
> only"* until 2026-08-06. The editor has a subject line the **server** authors, six labelled
> buttons, one list holding parts and materials alike with a name, a rendered image and its
> availability, and greyed rows that say why. `probe/b1/client_live.png` is what it looks like;
> `make probe-text` regenerates it. ⚠ **The paragraph below opens *"start from what is true
> today: the editor tells you nothing"* — that is the BEFORE picture, kept because it is what the
> design was answering.**

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

⚠ The panel layout, hit-test and click routing had tests for some time; what was missing was
the rendering and a real `font.loft`, whose own comment said the glyphs "will land alongside
the loft_gl text bridge in Step 9". **That bridge has now landed.** The package has since
been re-homed as `lavition_ui` ([EDITOR_UI.md](EDITOR_UI.md), `B1.2b`) — **this arc was
largely *finish the panel*, not *design a UI*.**

### C0a — The metrics seam, which is where this goes wrong if it goes wrong

`font.loft` says `text_width(s) = len(s) * 8`. With a real proportional font **that is a
lie**, and this doc's own verification table already names the consequence: *"a font whose
metrics lie mis-lays every panel"*.

But the panel package is **pure, with no GL context**, and it must stay that way — its layout
tests run under `loft test` with no window. So the seam:

```
struct Metrics { m_adv64: integer, m_line_h: integer, m_mono: boolean }
```

⚠ `m_adv64` is the advance in **1/64 px**, not whole pixels — see the last note in this
section for the 31px that bought it.

- **The library takes `Metrics` as a parameter** and does pure layout arithmetic with it.
  Every existing layout test keeps working, and gains a second run at a different advance —
  which is what stops `8` being baked in by accident.
- **The consumer fills it once at startup** from `gl_measure_text` / `gl_text_height`.
- **A gate asserts the two agree**: measure a known string through the bridge and compare
  with `text_width` under the `Metrics` the consumer handed over. ⚠ With the control seen
  red — hand it a deliberately wrong advance and the gate must fail, or it is comparing a
  number with itself.
- **The HUD asks for a monospace family**, so `len × advance` is *exact* rather than
  approximately right (to within the rounding below). A proportional font needs per-string measurement, which drags the GL
  context into the library. Monospace is the smaller, safer commitment; a proportional HUD
  can come later behind the same `Metrics` seam.

⚠ **AND ASKING FOR MONOSPACE DOES NOT MEAN GETTING IT — measured in `B1.1`, before a line of
`panel_render` existed.** [probe/b1](../../probe/b1/README.md) loaded the *same* font argument
on both targets and got two different fonts:

| `gl_load_font("…/DejaVuSansMono.ttf")` | advance @32px | `MMMMMMMMMM` vs `iiiiiiiiii` |
|---|---|---|
| desktop (fontdue, loads the file) | 19.27 | 192.66 = 192.66 — **fixed pitch** |
| browser (base name → CSS family) | 26.66 | 266.56 ≠ 71.09 — **proportional fallback** |

The browser cannot load font bytes synchronously, so it resolves the path's **base name** to
a family; `DejaVuSansMono` is not one Chrome knows, so it falls back to a generic
proportional face. The text still draws — it is simply laid out on an advance that is not the
advance. Three consequences, all now `B1.2`'s:

1. **The font argument is per-target**, not one string: a path for the desktop, a CSS generic
   or an `@font-face` family the page declares for the browser.
2. **Startup VERIFIES fixed pitch** rather than assuming it —
   `measure("MMMMMMMMMM") == measure("iiiiiiiiii")`. Two same-length, opposite-width strings
   is the entire instrument, and a width on its own cannot answer it: ten M's are ten M's in
   any font.
3. `font.loft`'s `len(s) * 8` is wrong on **both** targets, not just approximately.

⚠ Asking the browser for the generic `monospace` gives **192.66 — exactly the desktop's
DejaVu**. So the two *can* agree to the last digit, but only because Chrome's default
monospace happens to be the same face on this box. **That is a coincidence, not a contract**,
and it is the reason `Metrics` is measured at runtime instead of shared as a constant.

⚠ **AND THE ADVANCE IS KEPT IN 1/64 PIXEL, which `B1.6` earned.** A whole-pixel advance
truncates 9.6 to 9, and the error is per *character*: the editor's own subject line measured
**31px narrower** than the bridge rasterises it. Under-estimating is the dangerous direction
— `fit_text` then believes more fits than does, and text overflows a box it was just proved
to fit. So the advance is fine-grained and `text_width` rounds **up**: an over-estimate
reserves a pixel too many and the text fits.

That is the second independent cause of the same symptom, after the proportional fallback
above. One symptom with two unrelated causes is the whole argument for gating this seam with
a number rather than reasoning about it.

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
(`H:` — tag free; `C D E F G K L M P Q S T V X Z` are taken, and `W Y` since `B5.2`) and is sent **on change** plus
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

⚠ **The seam moved, and it moved the right way.** This said
`moros_ui::palette_items_for_tool(tools)` was already it — a function that read the consumer's
tool state and returned the list for it. `B1.2b` deleted it: a client-authoritative palette is
precisely what §C1 forbids, and it was what dragged `moros_sim` into a layout library.

The seam is now `PanelSpec.ps_items` — the consumer hands over the list it wants shown, from
wherever it legitimately knows it (for the browser client, from the server). It grows an image
and a kind; it does not grow a second widget.

✅ **BUILT, `B5.1`, 2026-08-03.** `Entry` carries `en_kind` — text, not an enum, because a
layout library that enumerated `material | part` would have to be edited before a consumer
could invent a third family. The wire is `N:<kind>|<name>|<0|1>|<reason>;…`, the materials come
from `moros_terrain::surfaces()` and the parts from `hex_part::part_list(data/parts/)`, and
neither is a list the server keeps. One `ps_items`, both families, no second widget.

⚠ **The list shows FILE names.** A part's author-given name is in its `PART` section, so
displaying it means opening every file to build a list — 65 KB an entry, for a string, which is
the whole-file read §P2 defers to `A7.4`. `house/cottage` is a handle and §C2 says that is what
a name is.

⚠ **Availability is part of the entry, not a separate dialog.** A door leaf that does not fit
the frame you are standing in is *shown greyed with its reason*, not hidden. Hiding it makes
the author think the part is missing; showing it with `too wide for frame/2x3` tells them what
to change. This is the refusal rule from §C2 applied to a list.

---

## C4 — The image is rendered, and that is why it can be trusted

- **A part thumbnail** — render the part into an offscreen colour texture from a canonical
  three-quarter view under canonical light. Cached by `(part, version)`; the version already
  exists in the layer.

✅ **BUILT, `B5.2`, 2026-08-03**, and three of its sentences needed correcting by measurement:

- ⚠ **A PART IS A WORLD TO THE STORE AND IS NOT ONE TO THE MESHER.** `chunk_mesh_mat` treats an
  unwritten cell as GROUND — what makes an unauthored world a plane rather than a hole — and a
  part is bounded, so its unwritten cells are *outside it*. Meshed as a world, a 38-cell cottage
  came out **28.6 × 24.5 world units**: four chunks of grass with a house in the middle, while
  every count agreed with itself. `chunk_mesh_mat_bounded` is the one-flag fix, and only the
  ground pass can differ — an unwritten cell is substituted to `SURFACE_MAT`, so it can never
  join another.
- ⚠ **THE SERVER MESHES AND THE CLIENT DRAWS.** A part is a world and the client already meshes
  worlds from its own cache, so "send the layers" looks right and is not: four of a chunk's nine
  surfaces come from `chunk_mesh_props`, which reads wall EDGES and the server's registries. A
  client meshing a part draws its ground and its floor and no walls.
- ⚠ **CANONICAL LIGHT IS NOT THE SWATCH'S RULE, AND THE CACHE IS WHY.** A swatch re-renders with
  the world's `uAmb`/`uLamp` so it dims when the world does. A thumbnail is cached by
  `(part, version)`, and a cache keyed on the part cannot hold an image that depends on the
  light — it would be stale the moment the author walked indoors, with nothing to say so.

✅ **AND IT INVALIDATES, `B5.3`.** The thumbnail follows the file: the server keys
each part's cached messages by `(mtime, size)`, re-stats once a second, and
broadcasts a rebuilt set to everyone rather than to the next client to connect —
the author who changed the part is the one person guaranteed to be watching.

- ⚠ **§C4'S OWN SENTENCE DOES NOT SURVIVE A PART ON DISK.** *"The version already
  exists in the layer"* is true of a world in memory and useless here: a layer
  version can only be read by LOADING the file, which is the entire cost the cache
  exists to avoid. **A key you must pay full price to compute is not a key.**
  `(mtime, size)` costs two stats. Its hole is stated rather than papered over —
  `mtime` has one-second granularity, so a same-second, same-length rewrite is
  missed until the next change; the honest fix is the editor SAVING a part and
  saying so, and there is no such gesture yet.
- ⚠ **`W:` IS THE INVALIDATION, and no message means *forget this row*.** The camera
  can only be composed once every mesh is built, so the server already sends it
  first; the client reads that ordering as "a fresh set is coming". A rule taken
  from the ordering cannot fall out of step with a rule written beside it.
- ⚠ **AND THE OLD MESHES ARE DROPPED WHEN THE NEW ONES ARRIVE, not when `W:` does.**
  Dropping on `W:` blinks the row to black on every rebuild.

⚠ **THE PICTURE CANNOT SEE THE LEAK, AND THAT WAS MEASURED, NOT ASSUMED.** With the
drop deliberately disabled, the row-diff reported **`ok — 18% of pixels moved`**:
two houses drawn on top of each other is certainly a changed picture. Only
`24 arrived, 12 held` says the old set went away. Two claims, two instruments —
and the one that would have shipped a vertex-buffer leak per surface per rebuild
is the one no screenshot can answer.

⚠ **AND THE FRAMING TOOK FOUR ATTEMPTS, THREE OF WHICH LOOKED RIGHT ON PAPER.** As a fraction of
the thumbnail the cottage fills: bounding **sphere** ~35% (most of a sphere over a squat roof is
air); bounding **box** ~35% — *further away than the sphere*, no visible change; the box **in
camera axes** 63%, arithmetic checked and picture unchanged; every **vertex solved** — the frame.
The third is the one to learn from. Its rule is *put the object far enough that its topmost corner
fits when that corner is also the nearest one* — exactly right for a box with all eight corners
populated, and a house is not one: its tall points are its roof and its near points are its front
wall. 63% is what that formula asks for; the error was believing the box stood for the house.
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

> ⚠ **THE PACKAGE IS `lavition_ui`, AND EVERY `moros_ui` BELOW IS ITS OLD NAME.** Renaming it was
> step `B1.2b` of this very plan and the rename was a **mechanism, not a tidy-up**:
> `tools/layering.sh` skips `moros_*` by design, so the package sat exempt for months from the
> exact check that existed to catch its dependency arrow. [EDITOR_UI.md](EDITOR_UI.md) is the
> record. `panel_render` is built; the panel is on screen.

`lib/lavition_ui` already has, tested: a 240 px left strip, a six-button toolbar, a scrollable
list, a status line, `panel_hit_test`, `route_click`, `editor_click`. What was missing was
`panel_render`.

⚠ **THE DEPENDENCY ARROW HERE POINTED THE WRONG WAY, and `B1.2` measured it.** This said
*"its consumer today is `moros_sim`'s walkable editor"*. It is the reverse:
`moros_ui/loft.toml` **depends on** `moros_sim`, and nothing in the tree depends on
`moros_ui`. `moros_sim/src/editor.loft` only mentions it in a comment.

So `moros_ui` has **no consumer at all** — and the program it was written for, a desktop
walkable editor, is not in `src/` either. *"`moros_sim` still builds"* was this section's
gate for `B1`, and it is worth nothing: `moros_sim` cannot break, because it does not know
`moros_ui` exists.

⚠ **The whole package is therefore being re-homed**, and the panel becomes lavition's:
[EDITOR_UI.md](EDITOR_UI.md), plan step `B1.2b`. The short version — its dependencies point
at the **headless** half (`editor_server`) while its purpose belongs to the **drawing** half
(`editor_client`), and `tools/layering.sh` never said so because it skips any package named
`moros_*`. A universal UI package wearing a consumer's name is exempt from the check that
exists to catch exactly this. **The rename is what puts it back under the check**, which is
why it is the mechanism rather than a tidy-up.

What survives is the layout arithmetic and the metrics seam; what goes is the `ToolState`
coupling — and §C1 above already ruled that out independently, since a client-authoritative
palette is precisely what *"what the SERVER says, never what the client believes"* forbids.

---

## What this is verified by

**Library (`lib/lavition_ui/tests/`), pure:**

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

**It lives in the plan** — [plans/18-catalogue/README.md](../../plans/18-catalogue/README.md),
broken into one-sitting steps, each with its own gate and size.

⚠ **On purpose.** A reference doc says how the thing *works*; a plan says what we intend to
*change*, and is temporary. Ordering and per-step verification belong to the plan, and a copy
here would drift the first time a step moved. What stays is what outlives the plan: `C0`–`C6`
and the library-versus-gate split above.

---

## See also

- [PARTS](PARTS.md) — the parts family this catalogues, plan #17
- [SCRIPTED_EDITOR](SCRIPTED_EDITOR.md) — how any of this is verified: a script, a tick, a PNG
- [WIRE_PROTOCOL](WIRE_PROTOCOL.md) — the tags in use, and why `H:` is free
