# lavition_ui

Panel layout, hit-testing and text metrics for an in-engine editor UI. You hand it a
`PanelSpec` of labels and indices; it hands back rectangles and hits.

```loft
use lavition_ui;

p   = panel_build(spec, window_w, window_h, metrics_measured(wide, narrow, 10, line_h));
hit = panel_hit_test(p, mouse_x, mouse_y);
if hit is UhListItem { li_idx } { choose(li_idx); }
r   = list_row_rect(p, li_idx);      // where that row sits, for drawing or driving
```

## What it will not do

**It holds no world, no lattice, no tool and no window**, and the empty
`[dependencies]` list is the claim rather than an accident. An earlier version of this
package depended on a player-physics and collision stack because `panel_build` took a
`ToolState` — and the one program that wanted a panel used none of those, so the panel
was unusable by the only thing that needed it. A rect is a rect and a text advance is a
text advance.

**It does not decide what a click MEANS.** `panel_hit_test` answers *what is under this
pixel* and stops. A `route_click` used to sit beside it that also mutated the caller's
tool state; only a consumer knows what a click on row 3 is for, and for a client with a
server behind it the answer is usually *send a message and wait to be told* rather than
*set a local field*. With the mutation gone it was the hit-test under a second name.

**It does not draw.** `panel_draw_list` / `panel_text_list` / `verbbar_draw_list` answer
rectangles and placed strings; putting pixels anywhere is the consumer's.

## Admissible loft

No `#native`, no I/O, no GL, and `src/` contains no `while` at all — every loop is a
`for` over a bound written down at the loop. That is declared in `loft.toml` as a
`[sandbox]` policy rather than asserted here, so it is checked at load rather than
believed: an unbounded loop or a reach outside the package fails to admit.

⚠ `allow_libs = ["code"]` is granted because building a `vector<T>` lowers to
`OpPreAllocVector`, which admission counts as reaching a library named `code`. Any
package calling itself admissible meets this.

## Two units that do not meet

`len` counts characters, a slice bound is a byte offset, and loft's stdlib has nothing
between them. `fit_text` shipped a cut computed in characters and applied as bytes, so a
non-ASCII label came back **shorter than the box it was measured against** — not corrupt
(loft snaps a byte cut outward), just quietly narrower, and invisible to a suite whose
every fixture was ASCII. `byte_after_chars` walks the count into an offset now. If you
slice text by a measured count, do the same.

## The surface, and which parts have been used in anger

`panel_build` · `panel_hit_test` · `panel_draw_list` · `panel_text_list` ·
`list_row_rect` · `verbbar_build` · `verbbar_hit` · `verbbar_verb` ·
`verbbar_draw_list` · `verbbar_text_list` · `spec_button` · `spec_verb_on` ·
`entry` / `entry_of` / `entry_blocked_of` · `metrics_measured` · `metrics_advance` ·
`text_width` · `fit_text` · `theme_default` · `rect` / `rect_contains`

⚠ **Thirteen of the thirty-three public functions have no production caller yet**, in
this or any other tree: `entry_blocked`, `fits`, `hotkey_room`, `list_rect`,
`panel_rect`, `spec_verb`, `status_rect`, `subject_rect`, `text_height`,
`toolbar_button_rect`, `verbbar_height`, and the un-kinded twins of two constructors.
They are tested, several of them by relations rather than by restatement — but *tested*
and *agreed* are different words, and a surface proven only by its own tests is one
nobody has committed to. Treat those thirteen as a proposal.

## Licence

LGPL-3.0-or-later.
