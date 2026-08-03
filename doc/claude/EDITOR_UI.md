<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# EDITOR_UI — the panel, and why it is not Moros's

*(user, 2026-08-03: "I want a universal editor, not a Moros specific one, so if we get all
the value out of the Moros parts that is fine for me")*

Plan [#18](https://github.com/jjstwerff/moros/issues/18), step `B1.2b` — a prerequisite for
`B1.3`, which cannot produce a caller until this lands. **Design only.**

The panel exists, is tested, and is unusable by the one program that needs it. This is the
design for making it lavition's rather than Moros's.

---

## U0 — What is true today, measured

| | |
|---|---|
| `moros_ui` | 502 lines of source, 59 tests, **no consumer anywhere in the tree** |
| its dependencies | `moros_sim` + `moros_editor` + `moros_map` |
| the program that draws pixels | `editor_client.loft` — `graphics, web, hex_world, gridmesh, moros_terrain, hex_editor`. **None of those three.** |
| the program that has those three | `editor_server.loft` — and it is **headless**; it streams the wire |
| the program it was written for | a desktop walkable editor. **Not in `src/`.** Nor is `WALKABLE_EDITOR_STEPS.md`, which `panel.loft` cites for its own layout diagram |

So its dependencies point at the headless half while its purpose belongs to the drawing half.
`hex_editor` does not pull `moros_sim` either, so the client would not acquire it
transitively: adopting `moros_ui` today means the browser client takes on 3069 lines of
player physics, collision, assembly, skin, bend, cliff and fall it has no use for.

⚠ **AND THE NAME IS WHAT HID IT.** `tools/layering.sh` enforces exactly this arrow — *a
lavition package may never name a Moros one* — and its second line is `case "$pkg" in
moros_*) continue ;;`, because **a consumer may depend on anything**. `moros_ui` is a
universal UI package wearing a consumer's name, so the check that exists to catch this waved
it through every run for months. It is not that nobody looked; it is that the instrument was
told not to.

---

## U1 — The package is `editor_ui`, and the rename IS the mechanism

Not a tidy-up. Renaming out of the `moros_*` namespace **puts the package under
`tools/layering.sh`**, which then fails the build on every `moros_sim`, `moros_map` and
`moros_editor` reference in it. The decoupling stops depending on care and starts being
something a script refuses to let regress.

> **Why not `hex_ui`.** `hex_*` in this family means *one data axis of the hex world* —
> `hex_grid` is the lattice, `hex_world` the store, `hex_way` the centreline. A rect is a
> rect and a text advance is a text advance; there is no hex in this package, and claiming
> the prefix would make the family's own naming rule mean less. lavition's own naming table
> (`loft/doc/claude/LAVITION.md`, outside this repo) gives `terrain` as an unprefixed
> example, so a plain descriptive name is already the convention for a non-axis package.

> **Why not inside `hex_editor`.** It would cost the client nothing — it already depends on
> it — and that is the trap. `hex_editor` is also consumed **headless** by
> `editor_run.loft`, which drives gestures from a script with no window at all. Folding a UI
> into it drags widgets into a program that will never draw one, which is the same mistake
> this document exists to undo, pointing the other way.

---

## U2 — What crosses the seam is DATA, not state

`panel_build` takes `ToolState` today, which is what drags `moros_sim` in. It takes a
**spec** instead — plain labels and indices the consumer already has:

```
PanelSpec = buttons(label, hotkey) · selected_button
          · items(label)           · selected_item
          · status_text
```

The consumer maps its own state to that. Moros maps `ToolState`; crawler maps whatever
crawler has; the browser client maps **what the server told it**.

⚠ **And that last one is `C1` arriving from a second direction.**
[CATALOGUE § C1](CATALOGUE.md) already says every field of the subject line is *what the
server says, never what the client believes it sent*. `palette_items_for_tool` /
`current_palette_selection` / `set_palette_selection` are client-side authoritative tool
state — precisely what `C1` rules out. Two independent arguments reaching the same
conclusion is usually the sign it is the real one.

⚠ **A spec is also what makes the package testable without a world.** The existing tests
build a `ToolState` to assert a rectangle; that is a physics package linked into a layout
test. With a spec they assert layout against layout.

---

## U3 — A click returns a HIT; it does not mutate

`route_click` mutates `ToolState` in place today. It returns the `UiHit` and stops there.
The consumer decides what a click on item 3 *means*, because only the consumer knows —
and for the browser client the answer is usually **send a message and wait for the server
to say so**, not "set a local field".

`panel_hit_test` is already pure and unchanged.

---

## U4 — The metrics seam stays exactly as `B1.2` built it

`Metrics` + `metrics_measured` + `text_width` + `fit_text` move across untouched. They have
no Moros reference already (`font.loft`: **0** coupled references), and they carry the
finding that motivated them: `probe/b1` measured `len × 8` wrong on both targets, and the
browser resolving a `.ttf` path to a **proportional** fallback is the control in
`metrics.loft`.

---

## U5 — What is dropped, and why that is not a loss

| dropped | why |
|---|---|
| `editor_panel.loft` — the `EditorState` convenience | it serves a program that does not exist, and `EditorState` is `moros_sim`'s |
| `editor_click.loft` — click → world edit | it is the *walkable editor's* dispatch, not a panel's. A consumer that wants it writes four lines against `UiHit` |
| `palette_items_for_tool` / `current_palette_selection` / `set_palette_selection` | client-authoritative tool state, which `C1` rules out — see §U2 |
| `tool_of_id` / `id_of_tool` | a `ToolKind` mapping; the spec carries an index |

⚠ **`moros_ui` is then empty and is deleted.** Nothing consumes it, so there is no
deprecation to stage. If Moros later wants its own `ToolState → PanelSpec` mapping, that is
~30 lines in a Moros package where it belongs — and writing it there is what keeps the
arrow pointing the right way.

⚠ **What is NOT dropped is the layout arithmetic**, which is the part that took the work:
the 240 px strip, the six-button toolbar geometry, the scrollable list, `panel_hit_test`'s
every arm, and the fit-to-box logic. ~190 lines and 40-odd tests survive intact.

---

## What this is verified by

**Library (`lib/editor_ui/tests/`), pure, no world and no window:**

| claim | why it cannot be a gate |
|---|---|
| every layout rect, at several window sizes | a picture cannot see a rect that is right by luck |
| `panel_hit_test` — every arm, and the gaps between buttons | a hit is a number |
| the fit-to-box sweep at **three different advances** | `B1.2`'s perturbation; a single advance passes with the number baked in |
| the fixed-pitch check, with the browser's real proportional numbers as the control | measured in `probe/b1`, not invented |
| a `PanelSpec` with more items than the list can show still hit-tests correctly | the scroll case, which has no picture |

**The layering script**, which now applies to this package for the first time — and ⚠ with
the control seen red: put a `moros_map::` reference back and `make lib-test` must fail
before the suites even run.

**The real gate, and the one that has been missing all along:** `editor_client.loft`
compiles against it. Not *"`moros_sim` still builds"* — `moros_sim` cannot break, because it
does not know this package exists. That check was in the plan and was worth nothing.

---

## The order of work

**In the plan** — [plans/18-catalogue/README.md](../../plans/18-catalogue/README.md) `B1.2b`,
broken into one-sitting steps. It is four steps and none of them is risky, because nothing
consumes the package being changed.

---

## See also

- [CATALOGUE](CATALOGUE.md) — plan #18's design; `C0a` is the metrics seam, `C1` the
  server-authoritative rule this design meets from the other side, `C6` the panel-wiring step
- [probe/b1](../../probe/b1/README.md) — what the text bridge actually does, measured
- [EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md) — the package map and the seam rules
- `tools/layering.sh` — the arrow, and why a `moros_*` name is exempt from it
