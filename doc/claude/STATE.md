# STATE.md — where the editor work stands (2026-07-22)

A handoff. What exists, what was decided, what is open. The durable *architecture* lives in
[EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md); the *changes* live in the tracker
(`gh issue list -R jjstwerff/moros --label plan --state all`). This file is the bridge
between them: read it first after a break.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).

## What exists

**Five loft packages, recovered and green.** `lib/moros_{map,editor,render,sim,ui}` —
recovered from loft's history at `ade530c2^`, where they had sat unmoved since June.

| package | tests |
|---|---|
| `moros_map` | 66 |
| `moros_editor` | 50 |
| `moros_render` | 163 |
| `moros_sim` | 137 |
| `moros_ui` | 41 |

**457 green, and zero warnings from Moros sources.** `make lib-test` runs them all and was
proven to go red (a gate nobody has seen fail is not a gate).

**Contributions to the shared library** (`loft-libs-world` `dev`, package `hex_field`, 47
tests): the interchange document format, the stencil mechanism, the authoring `EdgeSet`,
named integer layers, and two committed fixtures both consumers read.

## Decisions taken — do not re-litigate

1. **One model.** Moros's dense 8-byte cell and `hex_field`'s parallel arrays do not
   conflict; the cell is *storage and serialisation* over the field model. Probed, not
   argued (#1) — material and height round-trip with zero differences.
2. **The hex convention is pointy-top, odd-r, `L = √3`**, and `hex_grid` owns all lattice
   math. Four implementations already agreed; `SCENE_MAP.md` was the outlier and is
   reconciled.
3. **The format uses tagged sections, not a flags word** — an unknown section is skipped by
   its length, so a newer writer does not break an older reader. Chosen because it can
   *demonstrate* the property; a flags word cannot be tested for it at all.
4. **Heights are `f64`, labels are `i32`** in the format. Our documented `u8`/`u16` widths
   are enforced nowhere — `70000`, `-3` and `300` all round-trip in the live model — so a
   byte-packer built to the spec would silently truncate.
5. **The edge layer is split:** `hex_field::EdgeSet` is *authoring* (a material per edge);
   crawler's `EdgeCollider` is *collision* (surfaces, passability, swept paths).
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.

## Open work

**#2 — recovery.** `loft.lock` in `moros_render` / `moros_sim` still pins June resolutions.
`SCENE_EDITOR_PLAN.md` still needs rebasing against what demonstrably exists.

**#3 — one hex convention** (`status:active`). Three things left:
- **Edge field naming.** `wall_n` / `wall_ne` / `wall_se` actually hold **NW / NE / E**; only
  `wall_ne` is right. The ownership table in `SCENE_MAP.md` is correct — trust it over the
  identifiers.
- **`map_set_wall_dir`'s directions 3/4/5** use parity-blind neighbour arithmetic
  (`(q, r+1)`, `(q-1, r+1)`) — the same class as the three parity bugs already fixed. Live
  code, not on the stencil path.
- The **wall midpoint rule** and the **90°-corner argument** in `SCENE_MAP.md` are still the
  flat-top derivation, marked in place. Re-derive on the lattice; do not relabel.
- The **cross-language parity fixture** (`hex_grid`'s tests and our Python tooling asserting
  one file) is not built.

**#5 — stencils** (`status:active`). The mechanism is done. What remains is the **caller
switch**: `moros_stencil_stamp`, `StencilDef`, the JSON pair and the three `StencilDef`
built-ins are superseded by `builtin_flat` / `builtin_house_small` / `builtin_spiral_stair`
and the library stamp, but callers in `moros_editor` and `moros_sim` (including the undo
path, `stencil_stamp_with_undo`) have not moved. Also outstanding: a second consumer stamps
at least one stencil.

**#6, #7** — not started. #7 (`hex_editor`, the universal editor library) is the one that
carries the framing; #6 is Moros's configuration of it.

**Upstream** — `doc/claude/LOFT_HANDOFF.md` holds H4 (a null reaching exported glTF with a
clean analysis, not minimised after ten hypotheses), H5 (nested `for _ in` runs its outer
body once — four-line reproducer), and H6 (chaining a struct-returning transform empties it).
H1–H3 are fixed upstream.

## How to run things

```sh
make lib-test          # all five packages; goes red properly
cd lib/<pkg> && loft test

# a scratch program against both trees
loft --interpret --path ../loft/ --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.

## Working with the siblings

- **Never edit `../crawler`.** Another agent works there; an edit it did not make breaks its
  picture of its own tree. Read freely, raise findings in the shared package's README or in
  `LOFT_HANDOFF.md`, and let them make the change. It works — they acted on both findings
  raised this way.
- **`loft-libs-world` `dev` is shared and consumed from the WORKING TREE.** A new public name
  can turn the sibling red with no local edit on their side: adding `EdgeSet` cost crawler a
  rename across ~38 files. **Grep the sibling before adding a public name**, and when a build
  breaks with nothing changed locally, read the sibling's `git log` before debugging.
- Both agents have edited the same file at once. **Check `git diff` for someone else's work
  before committing**, and stage-and-commit in one command.

## Three things worth carrying forward

**1. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**2. Parity is where this codebase breaks.** Four separate bugs, all the same shape: right for
non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, and negative indices that wrap rather than fail. When touching the
lattice, test **both parities and both signs**.

**3. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.
