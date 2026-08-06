# 19 — Extract lavition: the editor as its own project, with the Moros name out of it

**Issue:** [`jjstwerff/moros#19`](https://github.com/jjstwerff/moros/issues/19) ·
`status:future` · **Value:** `F` · **Effort:** `H`

## Status

Nothing built. **Blocked on plan [#17](https://github.com/jjstwerff/moros/issues/17) `A8`
landing** — `MeshAt` changed shape on 2026-08-06 (`A8.1`) and `A8.2`–`A8.7` will change it again,
and this tree's own rule is that *the cost of extracting late is a rename; the cost of extracting
early is a seam renegotiated while both sides are moving.*

⚠ **`L1`–`L3` are the exception and can start now**, because they are corrections that are right
whether or not the split ever happens: a struct-name collision that already merges silently, a
package whose prefix exempts it from the layering check, and 64 call sites reaching past the
package that owns the lattice. Doing them early also **runs the probe that could falsify the whole
design** (below) for free.

Today: five lavition packages (678 tests) with **zero** functional `moros_*` dependencies, one
8,283-line editor program whose only Moros coupling is `moros_terrain` plus three lattice calls,
49 gates of which 39 need that program, and `data/parts/` behind them.

## Goal

lavition builds, tests **and gates** with the Moros tree absent, publishes its packages under
descriptive `hex_*` / `lavition_*` names with no Moros name anywhere inside it, and Moros becomes
an ordinary consumer of the published packages plus a small configuration file.

## Anchors

- **The design:** [`doc/claude/LAVITION_SPLIT.md`](../../doc/claude/LAVITION_SPLIT.md) — the one
  invariant, the four blockers, the target shape, and the four mechanisms that keep it clean.
  ⚠ It is written to be **moved**; on the day the split lands it becomes the new project's
  `doc/HISTORY.md` and the Moros copy is deleted rather than kept in two places.
- [`EDITOR_SUBSTRATE.md`](../../doc/claude/EDITOR_SUBSTRATE.md) — the extraction bar's four
  clauses, the five target groups, *build beside do not migrate*, the per-package DoD.
- [`HEX_STACK.md`](../../doc/claude/HEX_STACK.md) — the single authority for the stack's design;
  already written to travel.
- Touches: `lib/moros_terrain/`, `lib/hex_world/src/hex_world.loft`, `src/editor_server.loft`,
  `src/editor_client.loft`, `tools/layering.sh`, `tools/gates/`, every `loft.toml`.

## Invariant gate

**This plan's exact-invariant surface is the RENAMES, and a rename is exact.** The concrete
expected result for `L1`–`L3` is *byte-identical behaviour*: every suite and every gate green,
with the same counts, before and after.

| phase | concrete expected result | the invariant it pins | negative control |
|---|---|---|---|
| `L1` | `make lib-test` 20 of 20 and `make gate` 44, unchanged, after `Surface` is renamed on one side | **a rename changes no behaviour** | write the `Surface` literal in `editor_server.loft` **before** the rename — it must still fail with *"Unknown field `Surface.sf_r`"*, or the collision was already gone and `L1` is testing nothing |
| `L2` | same counts after `moros_terrain` → `hex_mesh`, and `make parts` still byte-identical | a package's **name** is not part of its behaviour | run `layering.sh` with the `moros_*` skip removed **before** the rename — it must report `hex_editor`→`moros_terrain`, or the check cannot see the class it exists for |
| `L3` | same counts after 64 lattice call sites move to `hex_grid` | `px_to_hex ≡ world_to_hex` on **both parities and both signs** — lesson `E`, five bugs of this exact shape | a fixture at negative `q`/`r` and an odd row: the two must agree there too, or the substitution is right only where it was tested |
| `L5` | the 39 gates green **with `lib/moros_*` deleted from the tree** | clause 1 of the extraction bar, for the *gates* | keep one `moros_*` reference in the server and confirm the build **fails** — a boundary check that cannot fail is not one |

⚠ **`L4` and `L6`–`L8` have no exact-invariant surface** — they are a naming decision with another
repo, a file move, and documentation. Said in a line so the silence does not read as *gate done*.

## Phases

| Phase | Effort | Verify | Status |
|---|---|---|---|
| **`L1`** — rename one of the two `Surface` structs | S | `make lib-test` + `make gate` unchanged; the negative control above seen red first | Open — **can start now** |
| **`L2`** — `moros_terrain` → `hex_mesh`, and delete the `moros_*` skip from `layering.sh` | M | `layering.sh` silent with the skip gone; `make parts` byte-identical | Open — **can start now** |
| **`L3`** — the 64 lattice call sites → `hex_grid` | S | suites unchanged; the both-parities/both-signs fixture | Open — **can start now** |
| **`L3p`** — ⚠ **the probe**: run `layering.sh` with no skip and see whether anything else is named | XS | silent → the program is lavition's. Not silent → whatever it names is the real boundary and the design is wrong | Open — falls out of `L1`–`L3` |
| **`L4`** — settle the `hex_world` lineage with `loft-libs-world` | S | a decision on the ticket; ours is 0.1.0, theirs 0.2.0 | Blocked on nobody, but **not ours alone** |
| **`L5`** — fix the gate flake: poll for the acknowledgement, never sleep | M | `cache` green in 5 consecutive suite runs; `part_fence`'s 58 s → 21 s is the precedent | Open — **do before any PR gate** |
| **`L6`** — the new repo: packages, program, gates, content, `CLAUDE.md` | MH | 678 tests **and 49 gates** green with no Moros tree present | Blocked on `L1`–`L5` and #17 `A8` |
| **`L7`** — Moros becomes a consumer: published deps + one configuration file | M | Moros green against published packages, no path dependency into lavition | Blocked on `L6` |
| **`L8`** — the documentation, and what is deliberately left behind | S | the eight travelling docs present; the four superseded ones **absent** | Blocked on `L6` |

⚠ **`L8` is where a clean project is won or lost.** `SCENE_MAP`, `SCENE_MAP_RENDER`,
`SCENE_EDITOR` and `SCENE_EDITOR_PLAN` describe architectures that were not taken; each was
banner-marked on 2026-08-06 and **none of them travels.** Copying them over is how the new tree
starts with the rot the old one just cleaned out.

⚠ **`L5` before any required PR check.** Measured 2026-08-06: `cache` failed **2 of 3** suite runs
and passed alone both times, and the *server's own log* read `agree 24 bad 0 layers 42` while the
gate reported `agree 0 bad 24 layers 0` — so the world was right and the gate never read it. A
required check that goes red two runs in three teaches everyone to hit re-run, which is worse than
no check at all.

## Cross-repo coordination

| repo | owns | what "done" means |
|---|---|---|
| **`loft-lang/loft-libs-world`** | the published `hex_*` family, **and a `hex_world` 0.2.0 on a different lineage from ours** | `L4`: one of the two lineages takes another name. ⚠ **Raise it, do not resolve it unilaterally** — and grep the sibling before adding any public name, because a new one can turn crawler red with no local edit |
| **`crawler`** | the other consumer of that family | read-only from here. Their `edgetest`/`sweeptest` are a second gate on `EdgeSet` work; raise findings, never edit |
| **`loft-lang/loft`** | the toolchain and the registry | read plus **tickets only**. A published package and a registry entry each need a word with the user first |

## Open questions

1. **Which `hex_world` keeps the name?** Ours is the column store that `WORLD_MODEL` Part II
   specifies and `hex_world`'s tests cite by rule id; theirs is 0.2.0 and published first.
   *Resolved by `L4`, with `loft-libs-world`.*
2. **Does `hex_mesh` want `graphics` as a dependency, or should it emit into a buffer the caller
   owns?** `moros_terrain` depends on `graphics` today. A data package that pulls a GL binding is
   a seam question, not a rename. *Resolved by `L2`.*
3. **Where does `data/parts/` live?** It is lavition's test content *and* Moros's authored
   content, and the gates drive it. *Resolved by `L6`; the likely answer is a small fixture
   library in lavition and Moros's own under Moros, which `EDITOR_PARTS` already supports.*
4. **Does `moros_sim` split too?** `assembly`'s `LinkKind` is the joint vocabulary §P9 builds on,
   and the walker is the only thing that exercises a part-tree pose. *Not this plan* — flagged
   because §P9's *what `A8` does not cover* will reach it.
