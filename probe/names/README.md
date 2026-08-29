# names — is a colliding bare name still a silence?

`sh probe/names/run.sh` · in `make fast` (2 s) · `make probe-names`

## The claim this replaces

`tools/names.sh` was written on 2026-08-06 over one sentence about the toolchain:

> a bare `Chunk { … }` binds to whichever was `use`d FIRST — the same file with its two
> imports swapped compiles something different, at either order, with no ambiguity error
> ([loft#788](https://github.com/loft-lang/loft/issues/788)). So a collision is not a
> build failure that finds itself; it is a silence.

**Measured 2026-08-29 and it is no longer true.** The pair is real and lives in this tree —
`hex_rig::frames::seg_len` and `hex_way::seg_len`, both imported plainly by
`src/editor_server.loft` — and a bare call is refused:

```
error: `seg_len` is declared by more than one module here — hex_rig::frames::seg_len and
hex_way::seg_len. A package's own module is scoped to it and has no bare qualifier, so
nothing here picks between them: alias yours (`use self::frames as m;` then `m::seg_len`),
or import the other one by name so only one `seg_len` is in scope
```

## What it costs to know

A LIVE row in `tools/names.sh` is now **a name you cannot write bare in that program** —
loud, at compile time, with the fix in the message — rather than a silently wrong binding.
That is a smaller defect than the script was built for, and saying so is the point: a
reader who takes the old sentence at face value over-rates every live row and under-rates
the LATENT ones, which did **not** change and are the greater share of the value. A name a
package will PUBLISH, already taken in the registry, is unfixable the day it ships, and no
compiler sees it because the two packages are not in one graph yet.

## Why it is a command and not a paragraph

CLAUDE.md's rule about a named binary — *do not read a capability claim as a standing
fact, run it* — holds for a named defect too. This tree carried loft#788's behaviour in a
tool's head comment for three weeks after it was fixed, and would have gone on carrying
it. The probe is in `make fast` so the reverse cannot happen quietly either: if the
silence ever comes back, row A goes red the same day.

## The rows

| | |
|---|---|
| **A** | both packages imported, `seg_len()` bare → refused, **and both declarations named** |
| **B** | the control: `hex_way` alone, the same bare call → fails for another reason (`missing argument for parameter 't'`) |

⚠ **ROW B IS WHY THIS SAYS ANYTHING.** Row A asserts an error message, and an error is
also what a misspelled function name gives — so with one import removed the same call must
fail *differently*. Without the control a probe with a typo in it would pass row A on any
compiler, including one where loft#788 was still open.
