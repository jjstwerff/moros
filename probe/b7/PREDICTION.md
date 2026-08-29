# `B7` — written before the probe ran

**Adopting a doorstep package changes REFUSALS, so it is measured before it is wired.**
`@HB-X66` is the reason in one line: *a doorstep that refuses more than the field
distinguishes is **worse than none** — it makes legal models unauthorable* — and two of
hexbody's own four predicates turned out to have nothing to refuse at all.

| family | ours | `hex_fit`'s |
|---|---|---|
| a tower's shell | `fit_shell` → `shell_below` | `arc_fits` / `arc_fit_n` / `arc_fit_residual` |
| a height | `freeze_grade(units)` | `seat_fits` / `height_units` / `seat_fit_residual` |
| a material id | `fit_nominal(m, …)` | `mat_fits` / `MAT_MAX` |
| a level | — | `level_fits` |

## What I expect

1. ⛔ **The shell VERDICTS agree and the OFFERS do not.** Ours offers the shell **below**,
   with the reason written at the code: *"`fit_shell` offers the shell BELOW because the
   library draws that one silently"*. `@HB-X65` says the offer is the **nearest** shell,
   *"deliberately not the shell an unrefused value would silently have drawn"* — the exact
   opposite, argued from the opposite premise. **They must differ on every value nearer the
   shell above than the one below**, which is a little under half of them.
2. ⛔ **The height doorstep cannot be adopted as published.** `hex_fit::HEIGHT_SCALE` is a
   compile-time `0.25`; this tree's height scale is **per world** (`w.w_unit`), and
   `gesture.loft` says so in bold — *"`w.w_unit` IS THE HEIGHT SCALE AND IT IS THE RIGHT
   ONE"*. Measured: this tree builds worlds at **0.125** (2) and **1.0** (6) as well as 0.25
   (176), so `seat_fits` would give the wrong verdict for eight of them. ⚠ hexbody's own note
   grades that constant **T4** — *"read off untested code"* — so this is a ticket, not a bend.
3. **The material and level predicates agree, trivially.** Both are integer range checks, and
   `@HB-X66` already says `level_fits` accepts everything.

## What each outcome would mean

| if | then |
|---|---|
| the shell verdicts agree | ✅ adopt `arc_fits` as the predicate and settle the OFFER as a separate, argued question |
| the verdicts disagree | ⛔ one of the two admits a shell that does not round-trip — a defect on whichever side |
| the offers agree | my reading of one of the two comments is wrong |
| `seat_fits` agrees everywhere | the unit difference is unreachable in practice and the blocker is theoretical |

⚠ **The instrument must find something on both sides**: a sweep where every value is admitted,
or every value refused, is measuring nothing — so the counts of each are printed.
