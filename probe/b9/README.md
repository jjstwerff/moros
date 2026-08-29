# `B9` — is our `∂` the library's?

**Plan 26. `make probe-b9`.** [WALL_PUSH](../../doc/claude/WALL_PUSH.md) states the rule:
*the definition stays `hex_draw::draw_walls`' and is **compared against, never copied***.
[LIBRARY_AUDIT](../../doc/claude/LIBRARY_AUDIT.md) then measured that **nothing in this tree
calls it** — and three sites in `gesture.loft` walk the cells taking every edge whose
membership changes, which is that definition, written out again.

## ✅ The sets are identical, so the substitution is safe

| the region | cells | ours | `draw_walls` | only ours / only theirs |
|---|---|---|---|---|
| a placed house's floor | 27 | 38 | 38 | 0 / 0 |
| a disc, shell 3 | 37 | 42 | 42 | 0 / 0 |
| a disc, shell 5 | 91 | 66 | 66 | 0 / 0 |
| **a ring — a hole in it** | 89 | 76 | 76 | 0 / 0 |
| a single cell | 1 | 6 | 6 | 0 / 0 |
| nothing at all | 0 | 0 | 0 | 0 / 0 |

⚠ **THE RING IS THE ROW THAT EARNS THE TABLE.** Its `∂` is **two** loops, so a definition that
quietly assumed a simply-connected region would agree on every other row and differ there.
⚠ And the house's **38** is the same number `@HB-X61` and `@HB-X69` quote for a cottage's stored
edges — a cross-check that arrived for free.

## What was wired

- **`claim_region`** — what a region description accounts for. It computed `∂` itself; it asks
  `draw_walls` now.
- **`region_recover_claimed`'s residual** — what a description OWES is `∂` of its region, and
  there is one definition of that.

⛔ **AND ONE SITE IS LEFT, WITH ITS REASON.** `house_recover_claimed` compares
`box_holds(b, q, r) != box_holds(b, nq, nr)` — the same definition over a **`Box`**, which is
not a `HexSet`. Reusing `draw_walls` there means filling the box into one first, on a reader
that runs per component per round. That is a cost to measure before paying, not a substitution
to make blind — and naming it is what stops it being forgotten.

⚠ **TWO OF THE THREE COPIES WERE WRITTEN TODAY**, in `claim_region` and the region reader —
by me, hours after reading the rule that forbids them. The audit is what found them, which is
the argument for keeping it current rather than for having written it once.
