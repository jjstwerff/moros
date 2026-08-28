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
