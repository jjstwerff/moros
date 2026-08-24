# `M2p` — result: ⛔ **`X108` refuted. Aiming and tracing are different maps, and that is by design**

**Run 2026-08-24.** [AUTHORING_MAP](../../doc/claude/AUTHORING_MAP.md) §4 — the agreement law.

```sh
make probe-m2p
```

✅ **IT MEASURES THE PUBLISHED LIBRARY.** `snap_run_from_heading` shipped in **`hex_shape` 0.1.1**
on 2026-08-24 and `lib/hex_editor/loft.toml` requires it, so this resolves the same registry copy
the editor builds against.

⚠ **IT DID NOT AT FIRST, AND THE RE-RUN IS WHY THAT IS WORTH SAYING.** Before the publish it
carried an explicit `--lib` into the `loft-libs-world` checkout, because the function lived only
there — so the numbers described a tree moros does not build against. `lib/hex_editor/loft.toml`
records that all fourteen `hex_*` packages differ from the registry and **three differ in code**,
so that is not a technicality: a measurement of the wrong copy is not weaker evidence, it is
evidence about something else. Re-run against the published library it reproduces exactly —
**1026 of 1320**, the same figure — which is a fact worth having rather than assuming.

## The question, and why it was not a tautology

`X108` said tracing a run and aiming the same run must give **the same integers**. The two entry
points minimise different quantities, so the law could fail:

- **trace** — `snap_run_d24` picks the direction whose best legal **endpoint** lands nearest the
  target. One 2-D distance, in which a direction error and a length error trade freely.
- **aim** — `snap_run_from_heading` quantises the two axes **separately**: the angle against `D`,
  the length against the legal runs in the chosen direction.

`snap_run_from_heading` was built as a **peer** of the endpoint snap rather than a wrapper on it,
precisely so this question has an answer. A law that held because one function called the other
would be worth nothing.

## What was measured

1440 aims from one vertex — 120 headings × 12 distances — with the trace target placed at exactly
the aimed angle and distance.

| | |
|---|---|
| scored | 1320 (120 refused by one side or both) |
| **agree** | **1026 — 77.7%** |
| disagree: direction only | **0** |
| disagree: length only | 60 |
| disagree: both | 234 |

✅ **Control passes**: the same comparison, with the aim turned one `D` step off, matches on
**11.6%**. So the instrument can see a one-step error, and the 77.7% means something.

⚠ **Zero direction-only disagreements** is the shape of the answer: when the two pick different
directions they always differ in length too, because the direction they disagree about is one
whose *lengths* are unreachable.

## The cause — and it is `X111`, not a bug

The first disagreement, now `@HXS-010` in the library — **aim 9°, push 3.93 wu**:

| | direction | length | what it honoured |
|---|---|---|---|
| **aim** | `d24 1` (13.898°) | **6.245 wu** | the angle, to 4.9° — overshooting the push by **59%** |
| **trace** | `d24 0` (0°) | 3.464 wu | the point, to 0.74 wu — losing the whole 9° |

Far ends **3.0 wu apart**. The cause is the **period**: `d24 1`'s smallest run is 6.245 wu against
`d24 0`'s 1.732, so **a short run in an in-between direction does not exist**. The trace notices
and leaves the heading; the aim cannot, and rounds the length up.

## What this changes

⛔ **`X108` is rewritten** from *the two agree* to **the two are different maps and one gesture
must use exactly one**. Neither is wrong — they honour different halves of what an author said.

✅ **And it promotes `X104` (the live preview) from a nicety to the load-bearing requirement.**
While the maps were assumed to coincide, a preview was a convenience. Now it is the only thing
that tells an author which map they are in: the same push and the same facing give two different
walls, and nothing else on screen distinguishes them.

## What this does NOT cover

- **One anchor.** Every aim starts at the vertex nearest the origin. The legal-run pattern depends
  on the anchor's class (`@HXS-003`), so the rate could move on another.
- **No houses.** These are `D` runs — world linework. A house wall is `H₁₂` and `FORMAL_CORE` §2 is
  explicit the sets are not interchangeable, so this rate must not be quoted for one.
- **Agreement is measured, not its authoring cost.** 77.7% is a rate over a uniform sweep; it says
  nothing about which cases an author actually visits.
