# lavition_ui changelog

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
