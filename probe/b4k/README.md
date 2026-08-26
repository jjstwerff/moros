# `B4k` — a bay is a SURFACE, not a feature of its wall

**Run 2026-08-26.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §2.4.
Predictions pre-registered in [PREDICTION.md](PREDICTION.md) and **not edited since**.

```sh
make probe-b4k
```

## The verdict

⛔ **§2.4's MECHANISM CANNOT CARRY §2.4's PROPOSAL.** It puts a bay in *"the same
category as an opening — carried as a span on the parent wall's surface … recovered
from the parent's feature list"*. Measured, a parent's feature **cannot reach a
projecting face at all**:

```
P1 the wall: 99 edges carry surface 1
P1 a WINDOW spanning -2..2: 8 edges re-materialised          <- the control holds
P3 parent surface 1: 99 edges; projected face 2: 99 edges
P3 an UNBOUNDED span on the parent re-materialised 99 edges,
   of which 0 lie on the projected face
P2 kinds: DOOR=1 WINDOW=2 LOOPHOLE=3 — and a row carries no depth
```

**The control passes**, so P3 is a fact about projection rather than about a
mechanism that does nothing.

## Why, in the library's own words

`apply_features`: *"an edge whose contact point falls inside a feature's interval
takes that feature's material. **The SURFACE is untouched** — which is why the body
never fragments and the matcher still sees one wall."*

⚠ **A feature RE-MATERIALISES; it does not place geometry.** Its body only visits
edges where `sid > 0` and `sid` equals the feature's own surface — so an edge that
is not on the parent surface is unreachable at any `s0..s1`, which is what the
unbounded span above measures. **Perforating is a material change on the same
surface; projecting is new surface.** They are not the same category, and §2.4's
table put them in one.

⚠ **AND THE THIRD NUMBER HAS NOWHERE TO GO.** §2.4 says a bay's faces are *"derived
from the parent's direction, its span and its projection DEPTH — three numbers"*. A
`Features` row is `surf, s0..s1, z0..z1, kind, mat`: a surface, an interval, a
vertical extent, a kind and a material. There is no depth, and all three kinds are
perforations.

## ✅ What IS true, and it is the useful half

**The geometry is expressible — as a SURFACE.** The projected face in P3 took its
own id and carried 99 edges, exactly as the parent did. `surf_straight` takes an
arbitrary float normal (*"every one of the 24 headings, and for anything between
them"*), so a bay's three faces at 45° / 90° / 45° are three surfaces, and
`cut_arb` gives every boundary edge to its nearest one. ⚠ **This is BLUEPRINT §2.3's
own argument for the octagon, and it applies here unchanged**: the lattice
constrains what a wall's DIRECTION may be, not what a SURFACE may be.

⚠ **So what a bay lacks is not geometry but ASSOCIATION** — the thing that says
*these three faces belong to that wall*, which is what makes §2.4's *"recovered from
the parent's feature list"* attractive in the first place. A bay recovered as three
unrelated surfaces cannot be moved with its wall, cannot be refused where there is
no wall, and cannot be told from three walls that happen to meet.

## What this asks of hexbody, precisely

⚠ **§2 is marked PROPOSED, NOT SETTLED, and this is what a settled version needs.**
The smallest honest extension is upstream's own shape — `@HB-X12`'s *"a new value in
this enumeration"* — one axis over:

| what | why |
|---|---|
| a **projecting** kind beside `DOOR`/`WINDOW`/`LOOPHOLE` | the kinds today all perforate, and `apply_features` treats every row as a re-materialise |
| a **depth** on the row | §2.4's third number, which the struct cannot hold |
| and `apply_features` must then PLACE rather than re-materialise | its own comment's *"the SURFACE is untouched"* is what makes the current one safe, so this is a second entry point rather than a widening |

⚠ **It is upstream's to make**: `../hexbody` owns the formal core and is read-only
from here, and this is its vocabulary. Filed as a finding rather than built.

## What it does NOT say

⚠ **This is not "§2.4 is wrong".** Its own table marks the bay row *(proposed)*, and
a proposal that turns out to need an upstream extension is a proposal doing its job.
What was worth measuring is *which* extension, and the answer is sharper than the
design guessed: not a new heading, not a deduction from cells, but a **kind, a
depth, and a placement path**.

⚠ **And it says nothing about whether a bay should be built at all.** `B0p` withdrew
its own premise this way and the design was better for it.
