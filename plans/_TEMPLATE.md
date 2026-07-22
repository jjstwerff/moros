# Plan template

Copy this file to `plans/<N>-<slug>/README.md`, where **`<N>` is the `jjstwerff/moros`
issue number** — claimed *before* the directory exists, never derived from the local tree.
Delete the guidance blocks (marked *(delete)*) as you fill it in. Conventions and the
lightest-workflow table: [`README.md`](README.md).

**Before you copy — is this actually a plan?** If it fits in one row of `doc/Todo.txt` or
one `## Open work` row in a reference doc, it isn't. Add the row instead. If the plan
needs no document space beyond its issue body, leave it in the issue and skip the
directory.

---

# `<N>` — `<Plan title>`

**Issue:** [`jjstwerff/moros#<N>`](https://github.com/jjstwerff/moros/issues/<N>) ·
**Value:** `<S|R|G|F|U|C|Q|N>` · **Effort:** `<XS|S|M|MH|H|VH>`

## Status (REQUIRED)

*(delete)* The **single source of truth** for what is shipped / open / deferred / blocked.
The issue carries the lifecycle label; the per-phase truth lives here, so there is no
second copy to drift. One paragraph: the state of the world today and what this plan
changes.

## Goal (REQUIRED)

*(delete)* One sentence — what ships when this plan is complete. No strategy or
advertising language.

## Anchors (REQUIRED)

*(delete)* The reference docs this plan implements or extends, and the source files it
touches. A plan never restates its anchors' content — it links.

## Invariant gate (REQUIRED for exact-invariant work)

*(delete)* Geometry, serialisation, rotation, round-trips and file formats are **exact
invariants, not open spaces**. State per phase: the **concrete expected result** (the exact
target output for one specific input), the **invariant** it pins (serialisation →
*round-trip = identity*; rotation → *six 60° steps are the identity*), and the **negative
control** — the input that must be *refused*, not silently accepted.

Say so in one line if a phase has no exact-invariant surface. Silence reads as "gate done",
not "gate N/A".

## Phases (REQUIRED if multi-phase)

*(delete)* One row per phase. **Verify** is how you see it works — name the gate: a test
file, a round-trip check, a rendered image, a visual check in the browser.

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **A** — short title | S | `make tests` / `test/<x>.js` | Open |
| **B** — short title | M | round-trip fixture | Blocked on A |

## Cross-repo coordination (if any)

*(delete)* Which sibling repo owns what, and what "done" means on both sides. A package
API change is done when **every** consumer is green — name them.

## Open questions

*(delete)* Numbered, each with a resolution path (which phase decides it). Delete the
section if there are none.
