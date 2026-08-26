# `B4k` — is a BAY a feature of its wall? Predictions, pre-registered

Written before the probe was run, and **not edited since**.
[BLUEPRINT](../../doc/claude/BLUEPRINT.md) §2.4 proposes:

> | | opening (`@HB-X70`) | bay (proposed) |
> | carried as | a span on the parent wall's surface | a span on the parent wall's surface |
> | what it does | **perforates** | **projects** — the wall detours around it |
> | recovered from | the parent's feature list | the parent's feature list |
>
> *"Its faces are DERIVED from the parent's direction, its span and its projection
> depth — three numbers, not three headings. Nothing has to deduce 45° from the
> field, because 45° was never stored."*

⚠ **§2 is marked PROPOSED, NOT SETTLED** — a proposal to hexbody, which owns the
formal core. This asks whether the mechanism it names can carry it.

## What I expect, and why

**P1 — the mechanism works for PERFORATION.** `apply_features` with `FEAT_WINDOW`
over a span of a straight wall's surface marks the edges whose contact point falls
inside that span, and leaves the rest. *This is the control: if it fails, nothing
below is a fact about bays.*

**P2 — `Features` has no way to say PROJECT.** Structural, and readable off the
struct: `fe_surf/fe_s0/fe_s1/fe_z0/fe_z1/fe_kind/fe_mat` carry a surface, an
interval, a vertical extent, a kind and a material — **and no depth**. The three
kinds are `FEAT_DOOR`, `FEAT_WINDOW`, `FEAT_LOOPHOLE`, all perforations. So §2.4's
*"three numbers"* has nowhere to put the third.

**P3 — and the deeper reason is `apply_features` itself.** Its comment says *"the
SURFACE is untouched — which is why the body never fragments and the matcher still
sees one wall"*. A feature RE-MATERIALISES edges already assigned to the parent
surface; a bay's faces stand **off** that surface, so no span of it can reach them.
I expect edges at a bay's projected position to be untouched at any `s0..s1`.

**P4 — so the answer is that a bay is not a feature in this vocabulary**, and
§2.4's row *"recovered from: the parent's feature list"* cannot be true today. The
smallest honest extension is upstream's: a fourth kind plus a depth, which is
`@HB-X12`'s *"a new value in this enumeration"* one axis over — hexbody's to make,
not ours.

⚠ **What would refute P4:** `apply_features` marking an edge that is NOT on the
parent surface, or a `Features` field that carries depth under another name. Either
would mean the mechanism is richer than its comment claims and §2.4 stands.
