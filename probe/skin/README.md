# `probe/skin` — two packages, one module file name

Measured 2026-08-18. Seen first as an `Advice[module-name-shadowed]` in the **editor
server's** build log, naming `lib/moros_sim/src/skin.loft` and
`lib/hex_part/src/skin.loft`. [loft#912](https://github.com/loft-lang/loft/issues/912).

## What it is

Both packages hold a `src/skin.loft` and both say a bare `use skin;`. A module's
basename is global across the whole dependency graph, so **only one of them gets its
own file** — and which one is decided by the *consumer's* `use` line order:

| the consumer says | what breaks |
|---|---|
| `use moros_sim; use hex_part;` | ⛔ `unknown type 'PartBox'`, `Unknown function skin_covers` |
| `use hex_part; use moros_sim;` | ⛔ `Unknown function skin_overlap` |
| either, with `use self::skin;` in both packages | ✅ every answer, both orders |

⚠ **A QUALIFIED NAME DOES NOT HELP.** `hex_part::skin_covers` fails exactly as the bare
name does, because the module never loads — there is no second `skin_covers` to
disambiguate *between*. That is what separates this from the struct-name collision
CLAUDE.md records as fixed on 2026-08-11.

⚠ **So a published library's public surface can be amputated by an unrelated sibling in
somebody else's graph**, and the library author cannot see it from their own tests.

## Why it had not bitten

Both `skin` modules are **test-only**: `moros_sim`'s `skin_fit`/`skin_pocket` and
`hex_part`'s `skin_covers`/`part_box` have no production caller between them. Each
package's own suite builds a graph with only itself in it, so both were green; the
server has both packages and still built, because nothing in either one calls its own
`skin` at runtime. **The first thing to reach across would have been the failure.**

## The controlled pair

`both.loft` calls one function from each module and checks the answers against the
values each package's own test asserts — a program that merely compiles proves the
names resolved to *something*, not to the right thing.

```
sh -c 'loft --lib lib/ probe/skin/both.loft'    # both packages in one graph
sh -c 'loft --lib lib/ probe/skin/alone.loft'   # hex_part alone — the control
```

⚠ **The control failed first, on my own mistake**: `SkinCheck.kc_worst` does not exist
(it is `kc_dx`). A probe that reds for its own reason and a probe that reds for the
subject's look identical in a log, which is why the control is a separate file that has
to go green before the subject's red means anything.

## The fix, and the guard

`use self::skin;` in both packages — the compiler's own advice, measured to work in both
orders. `tools/basenames.sh` is the standing check and it is in `make fast`:

- it flags **two packages that each hold `src/<x>.loft` AND each say a bare `use <x>;`**,
  which is exactly the competing case;
- it does **not** flag `render.loft` (`lavition_ui` and `graphics`) or `wall.loft`
  (`hex_part` and `hex_world`), because in each of those only one package claims the name
  — those are not defects;
- ⚠ it normalises `hex_place` and `hex_place-0.1.0` to one package. The first draft
  compared directories and reported **fourteen** collisions, every one a working-tree
  copy against its own published version.

⚠ **The guard exists rather than leaning on the advice** because CLAUDE.md records the
half of loft#912 where the advice is *silent exactly when the build goes red*. Checked
against the defect it was written for: with both `use self::` lines reverted it prints
`⛔ skin: hex_part moros_sim` and exits 1.
