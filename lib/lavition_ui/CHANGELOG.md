# lavition_ui changelog

## 0.1.1

The C98 port; no API change, so both compatibility floors stay at 0.1.0.

- The entry file passes every module on with `pub use self::<module>::*;`. Under
  C98 a plain `use` binds for its own file only, so without it a consumer that
  writes `use lavition_ui::*;` would reach none of the package's names.
- The modules import their siblings by name (`use self::widgets::*;`) rather than
  with a bare `use self::widgets;`, which C98 refuses because it binds nothing.
- `loft = ">=2026.10.0"`: `pub use` parses only on a C98 loft.

## 0.1.0

First release. Panel layout, hit-testing, verb bar and text metrics, with no
dependencies.

- `list_row_rect` — where a list row sits, so a consumer need not re-derive
  `lb_rect.r_y + idx * lb_item_height - lb_scroll` at every draw and click site.
  Gated as a round trip against `panel_hit_test` rather than as arithmetic.
- `fit_text` cuts on character boundaries. It previously computed the cut in
  characters and applied it as a byte offset, so a non-ASCII label came back shorter
  than it had room for — silently, and only in text that is not ASCII.
- `[sandbox]` policy declared, so *admissible loft* is checked at load rather than
  claimed in prose.
- `use self::` on every module, so a consumer's dependency graph cannot amputate this
  package's public surface through a basename collision (loft#976).
- `fits` and `hotkey_room` gained their first tests, both stated as relations: `fits`
  must agree with `fit_text` across the boundary, and a hotkey fitted to
  `hotkey_room()` must not reach the label column.
