---
render_with_liquid: false
---
# Formal notation, rule tags, feature tags and worked examples

**Read from `../loft2` on 2026-08-24** — a sibling checkout of loft, where this is built and
gated. ⚠ **`../loft*` is READ plus FILE TICKETS from here**, so nothing below was run or changed
there; it is described so this tree can adopt the parts it needs.

⚠ **AND MOROS NEEDS THEM, MEASURED: 102 citation sites across 22 distinct `X` tags, pointing into
`../hexbody`, with NO checker of any kind.** All 22 resolve today. Nothing would say when one
stops — which is the exact failure the loft gate exists for:

> *"A citation rots **silently** — the comment goes on reading correctly — which is exactly why it
> needs a gate rather than a habit."*

## 1. Three tag families, and they are deliberately not one

| family | shape | defined in | cited from | checked by |
|---|---|---|---|---|
| **formal rule** | `@FR-<Rule>` | `doc/claude/formal/*.md` | code comments | `scripts/rule_tags.py check`, wrapped by a test |
| **feature** | `@F<n>` | the feature catalogue | docs, diagnostics tables | `check_doc_drift.sh features-progress` |
| **worked example** | `@AAA-###` (a 3-letter family per area) | a test or example function | doc-comments on the API it demonstrates | `check_doc_drift.sh examples-index` |

### 1.1 Why the rule tag is NAMESPACED — and it is a measurement, not taste

`rule_tags.py`'s own header gives the number:

> *"A bare `@Name` is NOT unambiguous here: `@` already carries the tracker tags (`@P259`,
> `@PLN3`, `@F7`, `@I81`, `@GH247`), the worked-example family (`@AAA-###`), and the corpus
> annotations (`@ARGS`, `@NAME`, `@EXPECT_ERROR`). **Measured: a bare-`@` reading of `src/`
> returned 4142 "citations", not one of them a rule.**"*

⚠ **AND `@FR-` WAS CHOSEN TO SIT IN THE SAME SHAPE AS THE OTHERS** while being distinguishable
from `@F<digits>` — *"whose next character is a digit"*. The families are designed as a set, not
one at a time.

### 1.2 Two constraints the checker enforces, both found by a false positive

- **BOUNDARY-EXACT.** *"23 of the defined rules are a prefix of another (`@B-View` vs
  `@B-View-Base`), because a general rule and its refinements share a stem. `\b` does not help —
  `-` is already a word boundary."* A citation matches `@Name` only when the next character
  cannot continue a tag.
- **ONLY A DEFINED RULE.** `B-Ref`, `D-op`, `D-own` *"read like rules and are family prefixes that
  appear only in prose. Citing one is an error."*

⚠ **AND THE DEFINITION FORM WAS NARROWED TWICE BY FALSE POSITIVES**, which the source says
outright: markdown section headers are not a definition form — reading them as one *"turned
`## Rules`, `## Notation` and `## Deviations` into 'rules defined in 17 docs'"*.

### 1.3 What a rule LOOKS like

A rule is a line inside a **fenced block**, two columns, name in parentheses:

```
  (B-RefType)        `&τ` is a TYPE — a live link to a τ-lvalue.
  (B-Ref-Intro)      a `&`-annotated binding gives the bound variable type `&τ` LINKED
  (B-Ref-AnnotationOnly)  ⚑ VITAL.  `&` occurs ONLY as a reference-type annotation
```

and a **deviation** is a `### Name —` header. Cited from code as a comment:

```rust
/// Decides @FR-B-Copy vs @FR-B-View / @FR-B-View-Base for a whole-value vector bind:
/// Enforces @FR-L-Null for the narrow widths — the read twin of `write_narrow_value`.
/// The heap half is refused under @FR-D-bind-11.
```

### 1.4 The subcommands, and one of them is a design instrument

```
list           every defined rule and the doc that defines it
check          every citation resolves; no rule defined twice   (exit 1 on failure)
sites <tag>    the code sites citing one rule
dups           rules cited from 2+ sites
```

⚠ **`dups` IS THE INTERESTING ONE.** Its own description: *"the duplication question, asked by
**MEANING** rather than by code shape."* Two functions that cite the same rule are two
enforcements of one rule — a second implementation, found by what the code *claims* rather than
by how it *looks*.

**That is directly what plan 24 needed and did by hand.** It turned up four second-implementations
— `HEADINGS = 24` against `D`, `wall_stamp` against `wall_write`, our edge bytes against
`hex_field::EdgeSet`, and a missing material-channel bridge — each found by reading, none by a
tool. A `dups` over cited rules would have named them.

## 2. Rules and deviations — the doctrine, not just the format

`formal/README.md` is explicit, and it is the part worth copying before any tooling:

> **The rules do not change to match the code. The code changes to match the rules.**
> A new edge that the rules can't express is a signal the *rule* is wrong (fix the rule); a place
> the code disobeys a sound rule is a *deviation* (fix the code).

Each doc has exactly two parts: **Rules** (the target) and **Deviations** (`D1`, `D2`, … each with
the rule it violates, where it lives, the user-visible effect, and a status), *"meant to shrink to
zero"*.

⚠ **AND THE TRIGGERS ARE WRITTEN AS MOMENTS, NOT AS A HABIT** — *"before the work, not after"*:

- **an issue calls something "a design call"** — check whether the rule is already written; if it
  is, *the choice is not open*. Their example: loft#1002 was filed as a design call while the rule
  was already written, so *"only one of the two 'ways' was ever admissible"*.
- **you are about to ship a REFUSAL** — a rule may say it must work, making the refusal a
  deviation to record rather than a decision to make.
- **the two backends disagree** — a divergence is usually a deviation with a name already.

### 2.1 ⚠ `OPEN: 0` is a claim to re-measure, not a fact

The strongest paragraph in that README, and the one this tree should steal verbatim:

> *"An `OPEN: 0` line is only as strong as the conformance corpus underneath it."*

Two worked failures are given. `tuples.md` read `OPEN: 0` with two live tuple defects, *"because
the oracle it leans on is all-`(integer, integer)` and carries no `text` at all"*. And
`ownership.md` read `OPEN: 0` for six weeks because its corpus *"moves four axes … and holds the
ARGUMENT SPELLING fixed at a variable in every cell"* — moving that one axis turned up **six more
leaking spellings**.

⚠ **THAT IS THIS TREE'S OWN LESSON IN SOMEONE ELSE'S WORDS**: a green is a fact about the fixture.

## 3. Feature tags and worked examples

**`@F<n>`** names a feature in the catalogue and is cited from prose and from diagnostic tables —
e.g. a lint row carrying `` `@F21` `@F106` `` says which features it belongs to.

**Every feature must have a runnable example or an explicit exemption.** `features-exempt.tsv` is
hand-written, one row per feature, `F<N> <TAB> exempt|deferred <TAB> reason`, and
`check_doc_drift.sh features-progress` *"requires every `@F` to have either"*. The reasons are
real arguments rather than shrugs:

> `F48  exempt  The CLI is observed by INVOKING it … a .loft file cannot run the binary that runs it.`
> `F47  deferred  The module system is demonstrable — it needs a multi-file fixture … which the single-file shape cannot hold.`

**`examples-index.tsv` is GENERATED and says so in its own first line** — *"DO NOT EDIT.
Regenerate: `make examples-index`. Verified in CI"* — one row per worked-example tag:

```
@ACR-001   lib/audience_crystal/tests/01-editor-helpers.loft:12   test_pick_roundtrip   <blob url>
```

⚠ **THE TAG LIVES ON A TEST, AND THE DOC-COMMENT CITES IT.** So an example cannot rot into prose:
it is a function that runs, and the index carries its exact line and a permalink. `loft-libs-world`
already uses this — `// Example: @HXS-002` on `wall_is_exact`, `@HXP-001` on `combine_cut` — which
means **the libraries this tree consumes are already tagged and moros is simply not reading the
tags.**

## 4. The gate discipline — three details worth copying exactly

1. **It shells out to the same command a person runs.** `doc_hygiene::every_rule_citation_resolves`
   invokes `python3 scripts/rule_tags.py check`, *"so gate and tool cannot drift"*. Not a
   reimplementation of the check inside the test.
2. **It was proven to fire** — *"a probe citing a non-rule fails it"* — before it was trusted.
3. ⚠ **It SKIPS rather than fails where `python3` is absent**, *"since this is a consistency check
   and not a capability the build depends on."* That distinction matters here more than there:
   moros's rules live in **another repository**, so the checker must tolerate `../hexbody` being
   absent without turning every clone red.

## 5. What moros should adopt, in order

| # | step | why now |
|---|---|---|
| **1** | **a citation checker for `X…` against `../hexbody`** — resolve every `X<n>` in `doc/`, `plans/`, `probe/` against `ROUNDTRIP.md`/`SPEC.md`; SKIP if the tree is absent | 102 sites, 22 tags, zero checking. All resolve today, so this lands green and stays a tripwire rather than a cleanup |
| **2** | **namespace the tag** — a bare `X47` collides with nothing today but is not searchable; the loft lesson is that families are designed as a set. Whatever prefix, decide it before there are 300 sites | the 4142-false-citation measurement is the argument |
| **3** | **read the library example tags** — `@HXS-…`, `@HXP-…` already exist in `loft-libs-world` and answer *"show me this function used correctly"*, which is what every probe in plan 24 spent a run rediscovering | zero cost: they are already written |
| **4** | **`dups` by meaning** — once citations exist, ask which rule is enforced from two sites | plan 24 found four second-implementations by hand |

⚠ **STEP 1 ONLY, AND NOT THE WHOLE APPARATUS.** loft has 356 rules, a `formal/` tree and a
feature catalogue because it is a language. Moros consumes a formal core it does not own; what it
needs is the **citation** half, not the rule-authoring half. Copying `formal/` here would create
exactly the second authority [FORMAL_CORE](FORMAL_CORE.md) warns against — the rules stay in
hexbody, and this tree proves it still points at them.
