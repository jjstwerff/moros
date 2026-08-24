# `B0p` — an octagon is never uniquely deducible, and it does not need to be

**Run 2026-08-24.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §2.5.
Predictions pre-registered in [PREDICTION.md](PREDICTION.md) and **not edited since**.

```sh
make probe-b0p
```

## The verdict

⛔ **THERE IS NO THRESHOLD, BECAUSE THERE IS NOTHING TO CROSS.** `rebuild_construct` **never**
returns an eight-sided form for an octagon, at any size. It returns a **six-sided form,
confidently, with `ρ = 0`**, or it refuses outright.

```
rad   octagon                                vs disc   vs hex
0.5    n=1   R2 rho=1  sides=0  disk=true    SAME      differs
  2    n=7   R1 rho=0  sides=6  disk=true    SAME      SAME
  3    n=13  R1 rho=0  sides=6  disk=true    SAME      differs
  4    n=19  R1 rho=0  sides=6  disk=true    SAME      SAME
4.5    n=27  R2 rho=27 sides=0  disk=false   differs   differs
  5    n=31  R1 rho=0  sides=12 disk=true    differs   differs
5.5    n=37  R1 rho=0  sides=6  disk=true    differs   SAME
  6    n=47  R2 rho=47 sides=0  disk=false   differs   differs
```

**Controls pass**, so the rows above are facts about the octagon: a disc reads `disk=true` and a
hexagon `disk=false`, and their digests differ — the comparison discriminates.

## Three findings, and the third dissolves the question

### 1. Up to inradius 4 an octagon IS a disc — byte for byte

`disk=true` and the field digest is **identical** to a disc's of the nearest size, up to the 12
orientations. Nineteen cells in, there is nothing to deduce because there is nothing distinct.

### 2. ⚠ And the confident wrong answer is worse than the refusal

At radii 2, 3, 4, 5 and 5.5 `rebuild_construct` returns **`R1`, `ρ = 0`, `sides = 6`** — *this is
exactly a hexagon, with nothing unexplained* — for a field that was drawn as an octagon. At 4.5
and 6 it returns `R2` with `ρ = n`: every cell unexplained, an honest *no grammar form draws
this*.

**`P4` predicted R2 everywhere and warned that R1-with-a-wrong-form would be worse. It is the
one that happens**, and it is the same shape [probe/l1](../l1/README.md) caught `wall_read_run`
doing for walls drawn off `D`: a plausible wrong answer rather than a failure.

### 3. ⚠ THE THRESHOLD IS NOT MONOTONIC, so "large enough" cannot be a rule

Both columns read `differs` first at **4.5** — and then **5.5 is `SAME` as a hexagon again**.
Distinguishability oscillates with the rasterisation. So there is no size above which an octagon
is safe, and *"large enough for a unique deduction"* cannot be turned into a number.

## ✅ The resolution — and it was in the palette the whole time

**The question was malformed, and my design asked it.** §2.5 asked *"at what size can an octagon
be DEDUCED from its cells"* — an R1/R2 recovery question. But `@HB-X12` puts the wall's shape in
the **palette**: a cell stores a wall **id**, and the `WallDef` behind it carries `wd_body`.
Hexbody says it in the same breath as naming the vocabulary:

> *"an **octagon body is a new value in this enumeration**, exactly the extension shape."*

**So an octagon tower is never deduced. It is stored.** Recovery reads the wall id and the palette
says `OCTAGON`; the cells are the rasterisation, not the description. That is why `rebuild`'s
inability to return eight sides is not a blocker — it was never the mechanism.

⚠ **AND IT MAKES THE CONFIDENT-HEXAGON RESULT A LIVE HAZARD RATHER THAN A CURIOSITY.** Anything
that recovers a tower's shape from **geometry** instead of from the palette will get `sides = 6`
with `ρ = 0` and no warning. `rebuild_construct` must not be pointed at a walled structure and
believed.

## What this changes in BLUEPRINT

- §2.5's *"large enough for a unique deduction"* is **withdrawn**: no such size exists, and the
  premise is replaced by *the body is stored in the palette*.
- The open number §2.5 said the design lacked is **not needed** — there is no threshold to
  measure, which is a better outcome than a large one.
- ⚠ **`B1p` grows in importance**: if the shape lives in the palette and `@HB-X63` leaves the
  palette at **T4**, then the *whole* recovery of an octagon tower rests on the one part of the
  round trip that is not gated.

## ⚠ What this probe had to build, and it stays a finding

**There is no cell fill by arbitrary surfaces in the family** — `arc_fill` (disc), `box_fill`,
`form_fill`, `line_hexes`, and `cut_arb` cuts **edges**, never cells. The octagon footprint here
is a disc filtered by eight half-planes through `hex_edge::surf_distance`'s own plane equation.
**That filter is the probe's and must not become the editor's**: if an octagon body is added to
`wd_body`, its fill belongs upstream beside `arc_fill`.
