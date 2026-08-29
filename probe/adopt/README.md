# `probe/adopt` — the first hour, measured

```sh
make probe-adopt        # exit 0 = a stranger's first program still works
```

**What a person writes before they read anything.** Twelve lines against the public API —
no editor, no server, no browser, no gate — and the standing answer to the one clause of
[EDITOR_SUBSTRATE](../../doc/claude/EDITOR_SUBSTRATE.md)'s Definition of Done that has never
had a gate: *"a thing is done when picking it up is **fun**."*

⚠ **IT EXISTS BECAUSE WRITING IT BY HAND ON 2026-08-28 FOUND TWO LIVE DEFECTS THAT 775
LIBRARY TESTS AND 58 GATES HAD NEVER ASKED ABOUT.** Not obscure ones — a refused house that
half-built itself, and a refusal whose advice could not be followed. Both were invisible from
inside for the same reason: **our own fixtures always face a placeable way and always place on
open ground.** A suite written by the authors cannot ask the questions the authors do not have.

## The four rows

| | the question a stranger asks | what a red row means |
|---|---|---|
| `A` | can I make a world and put a house in it, from the public names alone? | the shortest honest path from nothing to a house has broken |
| `B` | when I am refused, am I told something I can DO? | a refusal went back to being a blank no |
| `C` | and if I do it, **does it work**? | ⛔ see below |
| `D` | does a refusal leave my world alone? | a refusal is half-building again |

⚠ **`B` AND `C` ARE TWO QUESTIONS AND SPLITTING THEM IS THE WHOLE VALUE OF THIS FILE.** Until
2026-08-28 every refused facing named a facing that was **itself refused** — hour 0 offered 8,
hour 8 offered 4, hour 4 offered 0, a three-cycle — so `B` passed and `C` did not. Every
number in that message was individually correct; the offer was a Box **rotation** handed to a
person who turns in **facings**. A gate asserting *the offer is an even rotation* would have
passed on the defect, because it always was one. **A refusal that names an action is not a
doorstep until somebody performs the action.**

## The two guards, and why each is here

⚠ **`A` must be non-zero and `B` must be non-zero.** Six of the twelve facings place and six
are refused — that is the lattice's own 6-fold symmetry, not a policy — so a run reporting
`0 of 12` either way is measuring nothing and says so rather than passing quietly.

⚠ **`D`'s fixture is checked before it is believed.** The house is placed under a ceiling so
the fold rule refuses the roof *after* the walls are stamped; if that ever stops refusing, the
row prints `FAIL the fixture placed a house` instead of going green over an absent subject.

## ⚠ The bug this probe had first, kept because it is the same shape

The first version shared one `EditSession` across the twelve attempts and reported **`A  2 of
12`**. The world was fresh each time and the *session* was not — `es_roofs` is the registry
`D2b` reads to ask *does this footprint overlap a filed plan*, so every attempt after the
first success was refused for standing inside the house the previous iteration had built.

**A fresh world without a fresh session is a world the session still believes has a house in
it**, and the probe was measuring itself. Two of twelve is a plausible-looking number, which
is what makes it worth writing down.

## The sabotage sweep — six rows, and the two controls are half of it

Run 2026-08-28 against the committed subject, restoring from copies (never `git
checkout`, which would delete the subject and report every row as a miss), with the
subject asserted present before row 0 and **every sabotaged tree asserted to build**
before its row was read.

| row | what was broken | what went red, and on which words |
|---|---|---|
| 0 | ✅ **CONTROL** — nothing | green |
| 1 | the offer goes back to being a rotation | `…offers facing 8, and turning there must place: 5 is on the odd orbit` |
| 2 | the unwind removed from `place_house` | `a refused house leaves no floor, no wall and no roof: **111** left behind` |
| 3 | `roof_over` writes as it checks — the true "before" | `…: **4** left behind` |
| 4 | the label spent before the roof is known to fit | `and no layer label spent: 6 -> 7` |
| 5 | ✅ **CONTROL** — a comment inserted beside the subject | green |

⚠ **ROW 5 IS WHY THE OTHERS MEAN ANYTHING.** Four red rows say the tests detect
*something*; a harmless edit in the same function staying green is what says they
detect *these things*. Without it the table is compatible with a suite that fails on
any change at all.

## ⛔ Row 3 is the row that found a hole in the test, and it took two tries

The first attempt at "break the atomicity" deleted the band pre-check — and the test
caught it only **incidentally**, on the label counter, while the cell count said
**0**. The reason is worth keeping: a roof is not a ground cell, it is **its own
layer**, and `place_house`'s unwind puts ground cells back with `ground_write`, which
cannot remove a layer added above them. So a partial roof was invisible to a count
that read the ground.

⚠ **AND THE FIXTURE COULD NOT SEE IT EITHER.** The bands are asked cell by cell, so a
ceiling that refuses the *first* one never leaves a partial roof at all. Measured over
six ceilings — 28 accepts **0** bands before refusing, 32 accepts 0, 36 accepts 1,
**40 accepts 4 then refuses 5**, and 44+ accept all 27 and never refuse. The fixture
is 40 for that reason, and row 3 now reports `4 left behind` — the exact number the
measurement predicted.

⛔ **SO THE TWO HALVES OF THE FIX ARE LOAD-BEARING TOGETHER**: the unwind is
sufficient *because* `roof_over` is atomic. Anyone folding that two-pass loop back
into one reintroduces a quieter half-house, and row 3 is what stands in the way.

## ⛔ In `make fast` since 2026-08-29 — and wiring it in found a defect in its own target

The target existed from the day the probe did and **the fast loop did not call it**, so the
standing answer only stood when somebody remembered to ask. That is this tree's own *a check
nobody runs drifts red in silence*, now found four times (`probe/k1`, four `k3d` baselines
blessing a crash, `K3f`'s five camera scripts, and this one).

⛔ **AND THE FIRST RUN INSIDE THE LOOP DESTROYED THE LOG.** The recipe ended
`| tee /dev/stderr | grep -q …`, and when the build's output is redirected to a file
(`make fast > log 2>&1`) **`/dev/stderr` IS that file** — `tee` opens it with `O_TRUNC`, so
every earlier result vanishes. Measured: an 18-line log where the tests, `k3c`, `t3`, `t4`,
`k1`, `k3d`, `headless` and `plan` had all reported, leaving a **green tail over an empty
history**.

⚠ **IT IS THE `| tail -N; echo rc=$?` FAMILY** — an instrument that quietly answers about
something other than what was asked. The verdict itself was never wrong (`rc=0` was real);
what was lost was every line that would have let anybody check it. Capture, print, then grep
the capture, and the failure path is checked against a run that must fail.
