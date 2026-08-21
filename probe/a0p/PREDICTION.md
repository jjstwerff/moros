# `A0p` — is a straight wall recoverable from its own edge stamp?

**Written before the probe was run.** Plan [24](../../plans/24-one-authority/README.md) `A0p`.
The whole plan rests on one claim, and this is the cheapest thing that could refute it:

> A wall's line can be recovered from the hex edges that line stamped, well enough that the
> `WallRun` record is redundant.

If it cannot, plan 24 does not ship as designed — the store would have to carry the heading, and
a `StoredHex` edge byte is a full `u8` material index with **no spare bits**. That is a record
change, not a tweak, so it is worth an afternoon to find out first.

## What the stamp does, which is why this is plausible at all

`hex_editor::wall_stamp` marks every hex edge that **crosses** the run's line and whose midpoint
projects **within** the segment. Its own comment states the property the recovery depends on:

> ⚠ *"Measured per edge rather than assumed: for most headings the wall **ZIGZAGS** about its
> run and there is no single offset."*

Zigzagging **about** the line is exactly the condition under which a fit through the edge
midpoints returns the line. If the edges sat consistently to one side, the fit would return a
parallel line at an offset, and the recovery would need to know the offset — which is nowhere.

## Predictions, in the order they would hurt

| # | prediction | confidence | if it is wrong |
|---|---|---|---|
| **P1** | a straight run is recoverable at **all 24** headings — the fit returns a direction, never a degenerate one | high | fatal to the design as written |
| **P2** | the recovered heading, put through `snap_heading`, equals the stamped `wr_step` **mod 12** | high | fatal |
| **P3** | …but **not mod 24.** A fit through points gives an **axis, not a direction** — the store cannot say which end the author started from | **high, and this is a prediction of a LIMIT, not of success** | if it *is* recoverable mod 24, something in the stamp is asymmetric and worth knowing |
| **P4** | the endpoint error is **inward** and bounded by about half a cell — the extreme edge midpoint sits inside the true end | medium | if it is unbounded or outward, `A2`'s tolerance cannot be set and question 1 reopens |
| **P5** | the worst heading is one **near a hex-edge normal**, where the zigzag amplitude is largest relative to the run | low — this is a guess about *which*, not *whether* | nothing; it is a hint for `A1`'s fixtures |

⚠ **P3 IS THE ONE TO READ.** It is a prediction that the design has a limit, and it is written
down *before* measuring so that finding it cannot be reported as a discovery. A wall's geometry
does not care which way it was drawn — but anything that reads `wr_step` for a *direction*
rather than an *axis* would break, and this probe is where that gets noticed rather than in
`A7`, after the record is gone.

## The negative control — without it a clean run means nothing

⚠ **The probe must be shown to FIND something before its silence is believed.** Two controls,
both run every time and both printed:

1. **A bent chain.** An L of two runs at different headings, stamped into one world, recovered
   as if it were one wall. A fit **must not** return a confident straight line through it —
   and if it does, that is a finding for `A1`: the recovery needs a straightness test, not just
   a fit. ⚠ This is the case that decides whether `A1` is *fit a line* or *segment, then fit*.
2. **A rotated fit.** The recovered direction deliberately turned by one of the 24 steps. Every
   heading comparison must go **red**. If the comparison stays green under a step of rotation,
   it is not measuring what it claims and no number below it is worth reading.

## What the probe prints, and what plan 24 takes from it

- the **worst endpoint error**, over every heading — this is the number
  [question 1](../../plans/24-one-authority/README.md#open-questions) is answered with, and the
  tolerance `A2` grades against;
- whether every heading recovered, and to what residual in degrees;
- the two controls' verdicts.

⚠ **WHAT IT DOES NOT COVER, said here so the green is not over-read:** every fixture is a
**single chunk**. A run that crosses a chunk boundary presents a *truncated* chain to a
per-chunk recovery, which may fit a different line at the seam — plan 24's open question 3. This
probe cannot see it, and `A1`'s ring fixture has to straddle a boundary.
