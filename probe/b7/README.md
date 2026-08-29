# `B7` — our doorsteps against `hex_fit`'s, and most of it should NOT be swapped

**Plan 26. `make probe-b7`.** `hex_fit` is *"the doorstep — refuse at authoring time what
would not round-trip"*, and [LIBRARY_AUDIT](../../doc/claude/LIBRARY_AUDIT.md) ranked it the
strongest unused package in the family. Adopting a doorstep changes **refusals**, so it was
measured before anything was replaced — `@HB-X66` in one line: *a doorstep that refuses more
than the field distinguishes is **worse than none**, it makes legal models unauthorable.*

## The result, family by family

| family | verdict |
|---|---|
| **shells** — the predicate | ✅ **agree on 200 of 201**. The one difference is shell `0`: theirs admits it, ours refuses it as this **gesture's** minimum, which is ours and legitimate |
| **shells** — the OFFER | ⛔ **differ on 89 of 192 refusals** — an argued disagreement, now settled upstream's way (below) |
| **heights** | ⛔ **cannot be adopted as published.** `hex_fit::HEIGHT_SCALE` is a compile-time `0.25`; this tree's scale is **per world**. At `0.25` the two agree 81/81; at **0.125** they differ on **40** and at **1.0** on **30** — and this tree builds worlds at all three (176 · 2 · 6) |
| **materials** | ⛔ **a different question wearing one name.** `mat_fits` is the *byte's* range (255); `fit_nominal` is the *edge slot's* (5). Not a duplication at all — the audit called it a candidate and it is not |
| **levels** | ✅ nothing to adopt — `level_fits` accepts everything, which `@HB-X66` states as a measured result |
| **features** | ⛔ `feature_fits` takes a **`Plan`** and its cells; our openings are cut into linework **runs**. The same domain mismatch, one gesture over |

⚠ **NEITHER SWEEP IS VACUOUS**, which is what makes the agreements mean anything: over
`0…200` ours admits 8 shells and theirs 9; the height sweep admits 41 of 81 at unit `0.25`.

## ✅ The one change this justified — and our own contract already asked for it

`fit_shell` offered `shell_below(n24)`, with the reason at the code: *"the library draws that
one silently"*, so the offer was what the author would actually have got. **`@HB-X65` gates
the opposite from the same premise** — *"the offer being the nearest shell and its residual,
deliberately **not** the shell an unrefused value would silently have drawn … the author sees
both candidates' cost instead of being quietly rounded down."*

⚠ **AND `fit_ordinal`'s OWN CONTRACT, IN THIS FILE, ALREADY SAID *NEAREST***: *"an ordinal
parameter: it has a **nearest** admissible value."* The code disagreed with the doorstep rule
it is an instance of, as well as with upstream. Shells to 80 are `0 12 36 48`, so a tower asked
for **30** was offered **12** — 18 away — where the nearest is **36**, 6 away.

✅ `fit_shell` now uses `hex_fit::arc_fits` for the predicate and `arc_fit_n` for the offer,
keeping this gesture's own minimum of 12 and clamping the offer to it — because `@HB-X65`'s
other half is that **every offer is itself admissible**, which
`test_every_offer_is_itself_admissible` sweeps over 188 refusals.

## ✅ THE LIBRARY IS FIXED — it was not a ticket, it was an edit

⛔ **THIS SECTION SAID *ticket* AND THAT WAS THE WRONG POSTURE.** `CLAUDE.md` already says
*fixing and republishing a shared library is allowed*, and the project owner said it plainly:
**"you are as much as anyone the editor of libraries — fix the ones that need fixing even if
you did not create it."** A measured defect in a dependency is work, not correspondence.

✅ **`loft-libs-world` branch `hex-fit-quantum-is-the-callers`** — the height quantum is now a
parameter:

    height_units_at(z, scale)        seat_fits_at(z, scale)        seat_fit_z_at(z, scale)
    height_from_units_at(u, scale)   seat_fit_residual_at(z, scale)

The five existing names are these at `HEIGHT_SCALE`, so **every caller is unaffected** and
`api_compatible_with = 0.1.0` still holds. ⛔ A non-positive quantum is refused by name —
new `FIT_BAD_SCALE`, because loft's `÷0` yields null and keeps running, so an unchecked
`z / scale` would answer *on the grid* for `z = 0` and *off it* for everything else.

⚠ **Both tests were seen RED** (sabotaging `seat_fits_at` to ignore its scale), 14 pass on the
interpreter **and** on `--native`, and coverage is all 42 functions — `seat_is_integral_at` was
written, flagged by coverage as entered by nothing, and **dropped** rather than shipped as
surface with no caller.

⛔ **AND IT IS NOT LIVE HERE YET, WHICH THE LOCK SAYS OUT LOUD.** `lib/hex_editor/loft.lock`
pins `hex_fit 0.1.0` with `source = "registry"`, so this tree compiles against the published
tarball and not the checkout — `probe/way/drift.sh` already reports `hex_fit` differing, which
is exactly the instrument that watches for this. **Using `seat_fits_at` here needs `hex_fit
0.1.1` published and the lock moved**, and a publish is one of the three things `CLAUDE.md`
says to ask about first.

## ⛔ What the ticket would have said

`hex_fit::HEIGHT_SCALE` is a constant where this tree needs a parameter. hexbody's own note
grades it **T4** — *"it is moros's constant, read off untested code; hexbody cannot verify it
is the right quantum, only that it is the one moros uses"* — so the fix is `seat_fits_at(z,
scale)`, or the scale as an argument. Until then the height doorstep stays ours, and
`freeze_grade` remains this tree's quantiser with `w.w_unit` as its scale.

⚠ **The measurement is why that is a ticket and not a bend.** Adopting `seat_fits` blind would
have given the wrong verdict on 70 of 162 sampled heights across the two non-0.25 units, in a
doorstep whose whole job is to be right about them.

## ⚠ And adding the dependency broke a name in a package that does not use it

`hex_fit` declares `HEIGHT_SCALE`, and so does `hex_proj`. Adding `hex_fit` to **`hex_editor`**
put it into **`hex_mesh`**'s graph — `hex_mesh` depends on `hex_editor` — where
`ground_under.loft` used the bare name. `make fast` went red with both declarations named and
the fix in the message.

⛔ **`CLAUDE.md` says to grep before adding a public name, and adding a DEPENDENCY is the same
hazard by another route** — it puts somebody else's whole public surface into every downstream
consumer's graph. I did not check, and the compiler did.

✅ **The failure mode is loud, which is the half that was fixed upstream.** A bare ambiguous
name is now refused outright by name; the era when it silently resolved to whichever
declaration came last is what cost this tree the `Surface` diagnosis. One site, one qualifier.
