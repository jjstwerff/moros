# plans/ — Moros's plan structure

Moros organises multi-phase work the way **loft** and **crawler** do, so one convention
spans every repo. This file is the **binding** — the conventions and where Moros differs.

- A **reference doc** (`doc/claude/RULES.md`, `SCENE_MAP.md`, `EDITOR_SUBSTRATE.md`, …)
  describes **how the thing works** — the durable truth, updated in place as the code
  changes.
- A **plan** describes **a change we intend to make** — phases, ordering, verification.
  It is temporary: when a phase ships, its reference content **moves out** to the doc that
  owns it, and the plan keeps only the closure record.

If you cannot say what *changes* when the plan is done, it is a doc, not a plan.

## Pick the lightest workflow that fits

| Work shape | Path |
|---|---|
| **Bug fix** (one root cause, one commit) | Fix + a test in `test/` + commit. No plan, no issue. |
| **Upstream (loft / crawler) defect** | File it in that repo. **Never a Moros plan.** |
| **Content work** (an NPC, a place, a card) | Nothing, or one line in the doc that owns it. |
| **Light TODO** *(the default)* | A row in `doc/Todo.txt`, or an `## Open work` section in the reference doc that owns the area. |
| **Plan** | An issue here. Earns it only when the work is genuinely **multi-phase**. Cap active plans at **2–3**. |

Most work is not a plan. A line in `doc/Todo.txt` beats a plan directory that only points
back at a reference doc.

## Identity — the issue number, claimed first

A plan's identity is its **`jjstwerff/moros` issue number**, not a local integer.

**Open the issue first, then name the directory after the number it returns.** Never pick
the number by scanning `plans/` — GitHub numbers are immutable, so a collision is
expensive to unwind.

- Directory: `plans/<N>-<slug>/README.md` — **flat**. No `future/`, `finished/` or
  `deferred/` subdirectories: **lifecycle state is a label on the issue**, not a path.
- **Small plans live in the issue alone.** A directory is for work that needs document
  space (phases, sub-files). A plan with no directory is normal and correct.
- **No hand-maintained index here.** The overview is *derived* from the tracker:

```sh
gh issue list -R jjstwerff/moros --label plan --state all   # every plan
gh issue list -R jjstwerff/moros --label status:active      # what's in flight
```

## Labels

| Dimension | Values | Rule |
|---|---|---|
| kind | `plan` | on every plan issue (Moros's tracker also holds non-plan issues) |
| status | `status:future` · `status:active` · `status:finished` · `status:declined` | **exactly one** |
| value | `val:S` `val:R` `val:G` `val:F` `val:U` `val:C` `val:Q` `val:N` | one, see below |

**A closed issue must carry `status:finished` or `status:declined` — never a live status.**
This drifts silently; when you touch a closed plan, check the label matches.

## Value categories — what KIND of value

Same letters as loft and crawler, so the convention reads the same across repos. Read
top-down and pick from the highest category with open work.

| Tag | Meaning | Moros examples |
|---|---|---|
| **S** | **Silent failure / content corruption** — it "works" but the data is wrong, with no error | a doc and its code disagreeing on the hex convention; a map that round-trips to different bytes |
| **R** | **Regression / gate-blocker** — `make tests` red, or a toolchain bump that breaks the build | a loft release that breaks the packages |
| **G** | **Goal-enabling** — directly advances the playable toolkit | the scene editor, the character creator, the DM tool |
| **F** | **Foundation** — unblocks 2+ downstream plans | the shared substrate packages, the document format |
| **U** | **Player / DM experience** — feel, readability, controls, art coherence | card art, printable layouts, editor ergonomics |
| **C** | **Clean features** — removes special cases; keeps the library↔content seam honest | moving content enumerations out of a library |
| **Q** | **Internal quality** — perf, refactor, cleanup with a clear payoff | warning cleanups, test-suite speed |
| **N** | **Niche / opportunistic** — small, low-priority | one-off tools, conveniences |

**Effort letters, never calendar time** — `XS / S / M / MH / H / VH`. "Two weeks" ships in
two days and "quick" takes weeks; effort buckets stay stable, projections don't.

## Closing a plan

1. Move any reference content out of the plan into the doc that owns it. A plan must not
   be the last home of a durable fact.
2. Rewrite links that pointed at the plan for its reference content.
3. Leave the closure record in the plan README: what shipped, what was dropped and why.
4. Set `status:finished` (or `status:declined`) and close the issue.

## Files here

| File | Purpose |
|---|---|
| `_TEMPLATE.md` | the standard plan skeleton — copy to `<N>-<slug>/README.md` |

**Length budget: 100–300 lines per plan README.** Longer means reference content is
leaking in — extract it to the doc that owns it.
