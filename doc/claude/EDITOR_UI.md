<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# EDITOR_UI — the panel, and why it is not Moros's

*(user, 2026-08-03: "I want a universal editor, not a Moros specific one, so if we get all
the value out of the Moros parts that is fine for me")*

Plan [#18](https://github.com/jjstwerff/moros/issues/18), step `B1.2b`. **Built 2026-08-03.**

The panel existed, was tested, and was unusable by the one program that needed it. This is
what it took to make it lavition's rather than Moros's — the decisions first, and what
building them measured under §U0.

---

## U0 — What was true, measured

| | |
|---|---|
| `moros_ui` | 502 lines of source, 59 tests, **no consumer anywhere in the tree** |
| its dependencies | `moros_sim` + `moros_editor` + `moros_map` |
| the program that draws pixels | `editor_client.loft` — `graphics, web, hex_world, gridmesh, hex_mesh, hex_editor`. **None of those three.** |
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

### What building it measured

| | |
|---|---|
| `lavition_ui` dependencies | **none** — an empty `[dependencies]`, which is the cheapest proof of the claim and cannot drift like a comment |
| tests | **33**, both backends, with no world and no window linked |
| `tools/layering.sh` on it | ⚠ seen **red** first: a planted `moros_map::` reference is caught by file and line. Under the old name it was skipped in silence |
| `make client` | **succeeds** — `editor_client.loft` builds a `Panel`, the caller this arc never had |
| the client, desktop | `panel 6 buttons, advance 9, mono true, list 224x398` |
| the client, browser | `the UI font fell back to the generic monospace family` → then **the same four numbers** |

⚠ **The two targets agree exactly and get there by different routes**, which is the whole
argument for measuring instead of naming: the desktop loads the `.ttf`, the browser cannot
and falls back to the generic family, and *the client never asks which one it is on*.
loft has no conditional compilation and this needs none — ask, measure, and keep the answer
only if it is better.

---

## U1 — The package is `lavition_ui`, and the rename IS the mechanism

Not a tidy-up. Renaming out of the `moros_*` namespace **puts the package under
`tools/layering.sh`**, which then fails the build on every `moros_sim`, `moros_map` and
`moros_editor` reference in it. The decoupling stops depending on care and starts being
something a script refuses to let regress.

> **Why `lavition_` and not `hex_`.** `hex_*` in this family means *one data axis of the hex
> world* — `hex_grid` is the lattice, `hex_world` the store, `hex_way` the centreline. A rect
> is a rect and a text advance is a text advance; there is no hex in this package, and
> claiming the prefix would make the family's own naming rule mean less.
>
> ⚠ **This was `editor_ui` for one commit, and `lavition_ui` is the user's call
> (2026-08-03): "if you need a specific name for something lavition is the better one (the
> whole game suite)".** It is the right one, and it fixes a real worry — `editor_ui` is
> generic enough to collide in a shared registry, while `lavition_ui` says exactly whose it
> is. ⚠ It does sit against `LAVITION.md`'s own table, which says `use X;` names are
> *"descriptive only — NO brand prefix"*; that line is about the `hex_*` data-axis family,
> and a suite-wide UI package is not one of those. Noted rather than silently contradicted.

> **Why not inside `hex_editor`.** It would cost the client nothing — it already depends on
> it — and that is the trap. `hex_editor` is also consumed **headless** by
> `editor_run.loft`, which drives gestures from a script with no window at all. Folding a UI
> into it drags widgets into a program that will never draw one, which is the same mistake
> this document exists to undo, pointing the other way.

---

## U2 — What crosses the seam is DATA, not state

`panel_build` took a `ToolState`, which is what dragged `moros_sim` in. It takes a
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

`route_click` mutated `ToolState` in place. The consumer decides what a click on item 3
*means*, because only the consumer knows — and for the browser client the answer is usually
**send a message and wait for the server to say so**, not "set a local field".

⚠ **So `route_click` is gone rather than ported.** With the mutation removed it was
`panel_hit_test` under a second name, and two names for one function is how a reader learns
to distrust both. `panel_hit_test` is unchanged.

---

## U4 — The metrics seam stays exactly as `B1.2` built it

`Metrics` + `metrics_measured` + `text_width` + `fit_text` moved across untouched. They have
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

**Library (`lib/lavition_ui/tests/`), pure, no world and no window — 33 tests, both backends:**

| claim | why it cannot be a gate |
|---|---|
| every layout rect, at several window sizes | a picture cannot see a rect that is right by luck |
| `panel_hit_test` — every arm, and the gaps between buttons | a hit is a number |
| the fit-to-box sweep at **three different advances** | `B1.2`'s perturbation; a single advance passes with the number baked in |
| the fixed-pitch check, with the browser's real proportional numbers as the control | measured in `probe/b1`, not invented |
| a `PanelSpec` with more items than the list can show still hit-tests correctly | the scroll case, which has no picture |

**The layering script**, which applies to this package for the first time — ⚠ and was
**seen red** before it was trusted: a planted `moros_map::PALETTE_MAX` is reported by file
and line, and `make lib-test` stops before the suites run.

**The real gate, and the one that had been missing all along:** `editor_client.loft`
compiles against it and builds a `Panel`. Not *"`moros_sim` still builds"* — `moros_sim`
cannot break, because it does not know this package exists. That check was in the plan and
was worth nothing.

---

## The order of work

**In the plan** — [plans/18-catalogue/README.md](../../plans/18-catalogue/README.md) `B1.2b`,
four steps, all landed. None was risky, because nothing consumed the package being changed —
which is the one advantage of having found it this late.

---

## See also

- [CATALOGUE](CATALOGUE.md) — plan #18's design; `C0a` is the metrics seam, `C1` the
  server-authoritative rule this design meets from the other side, `C6` the panel-wiring step
- [probe/b1](../../probe/b1/README.md) — what the text bridge actually does, measured
- [EDITOR_SUBSTRATE](EDITOR_SUBSTRATE.md) — the package map and the seam rules
- `tools/layering.sh` — the arrow, and why a `moros_*` name is exempt from it
