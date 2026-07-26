# STATE.md — where the editor work stands (2026-07-26)

A handoff. What exists, what was decided, what is open. The durable *architecture* lives in
[EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md); the *changes* live in the tracker
(`gh issue list -R jjstwerff/moros --label plan --state all`). This file is the bridge
between them: read it first after a break.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).

## Since 2026-07-25 — the world model, designed and specified

Two things happened that reshape the rest of this file.

**The compact voxel landed.** `Hex` is now `u16` height + six `u8` palette indexes — **8
bytes against 56**. Narrowing it produced 31 compile errors, which was the defect `STATE`
already recorded ("the documented byte widths are not enforced anywhere") finally surfacing.
Public parameters narrowed at the boundary, checked casts inside, and three sites had to
decide what out-of-range *means*: the brushes clamp, `map_read_field` refuses with
`ML_LABEL_TOO_WIDE`, the stencil record mirrors the voxel. The palette became real at the
same time — `map_empty` seeds slot 0 as absence, and `moros_render`'s `palette[i-1]`
off-by-one (a second, hidden encoding of the same rule) is gone.

**The world model is fully specified and not yet built.** It has its own plan
([#8](https://github.com/jjstwerff/moros/issues/8)) and its own normative contract in
**[WORLD_MODEL.md Part II](WORLD_MODEL.md)** — twelve invariants with proofs, a gate and a
named control apiece. What it settles: chunk-local layer stacks, per-chunk windowed heights,
continuity matched by height rather than name, an edit clock for caching, many authors
merging onto one writer, and online compaction that leaves caches valid.

**The editor split into a plan per rung**, because it was far too big for one:
[#9](https://github.com/jjstwerff/moros/issues/9) roads · [#10](https://github.com/jjstwerff/moros/issues/10) fences ·
[#11](https://github.com/jjstwerff/moros/issues/11) fields · [#12](https://github.com/jjstwerff/moros/issues/12) houses ·
[#13](https://github.com/jjstwerff/moros/issues/13) trees · [#14](https://github.com/jjstwerff/moros/issues/14) props and vehicles ·
[#15](https://github.com/jjstwerff/moros/issues/15) routines. The map is
**[EDITOR_LADDER.md](EDITOR_LADDER.md)**.

⚠ **Nothing of the world model is implemented.** `src/editor_server.loft` still stores peaks
and sums them at query time; V0 (the write chokepoint) has not started. The contract is what
the code will be built *against*, not a description of it.

## What exists

**Five loft packages, recovered and green.** `lib/moros_{map,editor,render,sim,ui}` —
recovered from loft's history at `ade530c2^`, where they had sat unmoved since June.

| package | tests |
|---|---|
| `moros_map` | 76 |
| `moros_editor` | 56 |
| `moros_render` | 163 |
| `moros_sim` | 148 |
| `moros_ui` | 46 — **currently red**: no `loft.lock`, transitive `glb` unresolved |

**489 green, and zero warnings from Moros sources.** `make lib-test` runs them all and was
proven to go red (a gate nobody has seen fail is not a gate) — most recently for real, twice
in one session, catching a wall-drop in the stamp bridge and a double halo in `hex_field`.

**Contributions to the shared library** (`loft-libs-world` `dev`, package `hex_field`, 47
tests): the interchange document format, the stencil mechanism, the authoring `EdgeSet`,
named integer layers, and two committed fixtures both consumers read.

> **One `hex_field` fix is UNCOMMITTED in that tree** (2026-07-22). `stencil_rotate` and
> `stencil_mirror` passed an already-haloed extent into `edgeset_new`, which halos it again —
> so a rotated stencil could never compare `edgeset_equal` to an unrotated one, and carried
> roughly twice the edge storage (a 3×3 room: 375 → 735 bytes over a full turn). Content was
> never lost, only the bookkeeping. `stencil_from` in the same file did it correctly, which is
> what identified it as an oversight rather than a design. 47 library tests and all 485 of
> ours are green on it. **It is crawler's tree too — commit needs a human call.**

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
5. **There is ONE edge layer, and the split is over the write POLICY** — not over the
   storage, and not over "who owns `Surfaces`", which was the wrong axis. `hex_field::EdgeSet`
   owns the storage *and* the surface slot; a consumer owns the rule deciding what goes in it.
   `edge_set_surf` writes what it is told, and first-writer-wins is
   `if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site, where a reader can see which
   rule is in force. Crawler's `EdgeCollider` was a temporary rename to break a name collision
   and **no longer exists** — they deleted their edge storage entirely (crawler `2a72763`,
   2026-07-22) and their `collide`/`sweep_path`/`sight_clear` now take an `EdgeSet`.
   *Consequence for us:* the layout is a two-consumer contract now, so it cannot be changed
   unilaterally — and their `edgetest`/`sweeptest` are a second gate on our EdgeSet work.
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.
8. **The twelve are twelve *placements*, and the reflected six land between the rotated six**
   — so the editor offers a twelve-position dial named as hours on a clock, turns and flips
   alternating (`SCENE_EDITOR.md` § stencils). **Never re-derive this from a radial feature.**
   A door in the middle of a wall sits on a mirror axis, collapsing the twelve to six, which
   reads exactly like proof that only six exist. Measured off-axis: twelve distinct cells on
   one ring, zero collisions. Both the claim and the collapse are pinned in
   `moros_map/tests/clock.loft`, the collapse as the negative control.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.

## Open work

**#8 — the world model** (`status:active`). Specified, unbuilt. V0 is the write chokepoint
and is gated on **P13**: does `map_get_hex` alias? It returns a vector element, and loft's
`#338` says `tmp = v[j]` is a view — if so, the `map_set_hex` following every mutation is
decorative and any caller can write a cell through no function at all. That answer decides
whether the guard is "add a check" or "stop handing out mutable views".

**Numbers the contract needs and does not have:** `ρ` (floor reserve), `ε` (minimum layer
separation) and `θ` (match tolerance) for moros's own world, subject to `ε > 2θ`. They are
per-world declarations, so they can wait for V1 without blocking the format.

**One case the contract cannot express:** a collapse dropping a floor onto the one below
violates `F1`, and refusing a physical event is wrong. The proposed answer — a collapse
*removes* a layer rather than moving it — has not been shown to cover a partial collapse.

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

**#5 — stencils** (`status:active`). The mechanism is done, and **facing landed** — a
stencil's placement is an hour on the clock, **twelve of them**: six turns and six flips,
the flips landing between the turns and never coinciding. Derived from the lattice rather
than declared (`moros_map/tests/clock.loft`, `SCENE_EDITOR.md` § stencils).

> **Do not re-derive this from a door.** A radial feature sits on a mirror axis and collapses
> the twelve to six, which is a fact about that content and not about the dial. Measured with
> an off-axis marker: twelve distinct cells on one ring, zero collisions. The collapse is kept
> as the negative control beside the claim.

**Two real defects fell out of building it**, both invisible while every stencil was
symmetric:
- `stencil_rotate`/`stencil_mirror` in `hex_field` haloed an already-haloed extent, so a
  rotated stencil could never compare equal to an unrotated one and carried ~2× the edge
  storage. Fixed; content was never lost, only the bookkeeping. **Uncommitted in the shared
  tree.**
- **Our stamp bridge dropped walls.** `map_to_stencil` and both `stencil_into_map` paths
  read and wrote edges only for *occupied* cells — but three of the six directions store an
  edge against the neighbour, so a room's wall is owned by the empty cell outside it. The
  door house held 17 walls and stamped 8. Now 17. No count ever caught it because the loss
  was symmetric.

The **caller switch is half done**. `tool_apply` moved to the library path — it was the one
call site that had to, because a facing needs `stencil_rotate` — so `moros_sim` no longer
touches `StencilDef`. Still on the old path: `moros_editor`'s `moros_stencil_stamp`,
`StencilDef` itself, the JSON pair, `stencil_save`, the three `StencilDef` built-ins, and the
undo path `stencil_stamp_with_undo`. That last one is the real work: the library stamp has no
undo bracket yet.

Two more outstanding:
- **An asymmetric stencil.** Every palette entry is rotation-invariant today, so the facing
  is exact and completely invisible. A **house with a door gap** is the obvious first one —
  and it is the same shape as crawler's P5 tail, where *doors are gaps*.
- **A second consumer stamps at least one stencil.** Crawler will not be it soon: they have
  no stencil call sites at all (their world is procedural — `hexplace`, vaults, roofs).

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

## Three things worth carrying forward from the design work

**A. A mechanism that looks like overhead may be load-bearing for a case you did not
measure.** Twice a "simplification" was recommended and withdrawn — the per-chunk window, and
`base_height` before it. Both times the tell was identical: the mechanism had been measured
against **one** use case. The window survives because it decouples resolution from extent,
which is the only reason one model can serve a dungeon at centimetres and a planet at metres.

**B. Two claims about seams were about nothing of the sort.** Layer kind, then layer identity,
were each argued to need world-global scope "or the fold check is incoherent across a seam".
The fold check reads one column, a column lies inside one chunk, and so it never crosses a
seam at all. A sentence that mentions a seam is not a seam argument — ask instead whether the
operation ever reads two chunks.

**C. A sibling had already solved it, better.** `crawler/PROPS.md` refuted the dressing-layer
design on three axes at once: a level is a *sheet, not a slot*; terrain is dense while
dressing is sparse; and placement is mostly *derived* rather than authored. The uniform-cell
version felt like one mechanism serving two cases — and that feeling was the tell that it was
serving one and disfiguring the other.

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
