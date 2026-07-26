# The editor ladder

*(**lavition**'s editor — Moros is a consumer, not the product. See
`loft/doc/claude/LAVITION.md`.)*

The editor is built one **rung** at a time, and each rung is a *complete editor* for
everything below it. This is the overall map; each rung is its own plan, because the
editor in its completion is far too big for one.

> The rule that shapes the whole ladder: **a rung does not generalise in advance.** Build
> what the rung needs, thickly, and let the *next* rung decide what the shared shape was.
> Generality is earned by a second real case, never predicted from the first — which is
> also why W1 is the rung that decides the tool shell's shape, not W0.

## The rungs

| rung | adds | plan |
|---|---|---|
| **W0** | a flat plane, hills, a character that walks and climbs | *shipped* — see [plan 7](../../plans/7-hex-editor/README.md) |
| **W0.5** | persistence: the voxel world, one durable home | [#8](https://github.com/jjstwerff/moros/issues/8) · [plan](../../plans/8-voxel-world/README.md) |
| **W1** | roads — ways that follow the ground | [#9](https://github.com/jjstwerff/moros/issues/9) |
| **W2** | fences — edge structures, the wall bytes made real | [#10](https://github.com/jjstwerff/moros/issues/10) |
| **W3** | fields — bounded regions with a fill and a boundary | [#11](https://github.com/jjstwerff/moros/issues/11) |
| **W4** | houses — multi-storey structures, stencils, roofs, openings | [#12](https://github.com/jjstwerff/moros/issues/12) |
| **W5** | trees and bushes — scattered instances at density | [#13](https://github.com/jjstwerff/moros/issues/13) |
| **W6/7** | decorative elements and vehicles — props and multi-rig connectors | [#14](https://github.com/jjstwerff/moros/issues/14) |
| **W8** | routines — triggers, actors, the sandbox seam | [#15](https://github.com/jjstwerff/moros/issues/15) |

The substrate that carries them — the anchor, the layer stack, the seam rules — is
[plan 7](../../plans/7-hex-editor/README.md) and
[EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md). The landscape they all write into is
[WORLD_MODEL.md](WORLD_MODEL.md).

## The order of work

Sequential — each row assumes the ones above it. **✋ marks a checkpoint that needs your
eyes**, not a report: something to open, drive, and judge.

| # | work | plan | size | done when |
|---|---|---|---|---|
| ~~0~~ | ~~decide: one world file or regions~~ — **answered: one file**; stencils and placeable assets live in separate files | #8 | — | ✅ 2026-07-26 |
| 1 | the file — header, opaque palette, directory, chunk I/O, per-chunk CRC, `ε > 2θ` on open | #8 V2 | M | a world round-trips; a hand-corrupted chunk is refused by name and the rest opens |
| 2 | sparsity — elision on both axes, maintained on write | #8 V3 | S | an empty 10⁶-tile world < 64 KB; file size tracks live data, not total writes |
| 3 | change and cache — edit clock, per-layer versions, snapshot reads | #8 V4 | M | compaction invalidates no cache; one edit stales exactly one |
| — | ✋ **worlds persist** | | | save a world, reload it, confirm it is the world you built |
| 4 | the editor moves onto `hex_world`; `Peak` / `world_save` / `world_load` deleted | #8 V5 | L | hills, walking, climbing and the camera behave as they do today |
| — | ✋ **the editor is no worse** | | | build hills, save, reload, walk around. This is the risky one — it replaces what works |
| 5 | roads that follow the ground | #9 | M | a road crosses a hill without fighting it |
| — | ✋ | | | draw one |
| 6 | fences and walls; `hex_edge` collision; the camera's occlusion class | #10 | L | walls block movement; the camera treats solid walls like terrain and fences not at all |
| — | ✋ | | | walk into a wall, orbit beside one |
| 7 | fields — bounded regions | #11 | M | enclose an area, give it a character |
| — | ✋ | | | |
| 8 | **houses** — multi-storey, stencils, roofs, openings, cellars | #12 | XL | a building with a cellar and an upper floor; layers under real pressure |
| — | ✋ **the layer stack is right** | | | build a tower with a dungeon under it. If the model is wrong, it is wrong here |
| 9 | trees and bushes at density | #13 | M | a forest that reads as landscape, not a list |
| 10 | props and vehicles; the multi-rig connector | #14 | L | a cart whose wheels turn from distance travelled |
| — | ✋ | | | |
| 11 | routines — triggers and the sandbox seam | #15 | XL | a trigger that survives the ground beneath it moving |
| — | ✋ | | | |
| ∞ | convergences: chunk helpers → `hex_grid`, dirty set → `gridmesh`, `input` adopted; the crystal ports; groups extract once battle-tested | #8 V6-V9, #7 | — | the family has no duplicate function |

**Two things deliberately not in the order.** *Extraction* has no row: a group leaves when it
has been through a rung and earned it, which is a consequence of the work above rather than
a step in it. And *multi-author* (#8 V6-V7) sits in the ∞ row because nothing above needs
it — it lands when a second person is actually editing.

**Where the risk is.** Row 4 replaces a working editor, and row 8 is where the layer stack,
stencils and the fit doorstep all meet real pressure at once. Those two are worth slowing
down for; the rest are additive and cheap to unwind.

## Why this order

**Each rung adds exactly one representational kind**, and the order runs from the kind
everything else sits on to the kind that references everything else:

- a **height field** (W0) — everything rests on the ground
- a **path** (W1) — a curve across the ground
- an **edge** (W2) — a boundary between cells
- a **region** (W3) — an area with an inside
- a **volume** (W4) — a thing occupying layers
- an **instance** (W5–W7) — a placed object with its own frame
- a **reference** (W8) — a thing pointing at things the editor does not own

W4 is where the layer stack, stencils and the fit doorstep all get their first real test,
which is why it is foundation rather than content: everything after it inherits the
placement machinery.

## What every rung must satisfy

A rung is not done when it draws. It is done when it also:

1. **round-trips** — what it authored survives save and load unchanged;
2. **survives edits underneath it** — a road stays attached when the hill beneath moves,
   or refuses and says why (`K-FIT`: refuse with a named reason, offer, residual);
3. **has a gate with a control** — an assertion that has been *seen red*, not merely
   observed green;
4. **holds performance** — the 3-D routines keep up at each rung, measured, not assumed.

Obligation 2 is the one that distinguishes an editor from a paint program, and it is the
anchor's whole subject: we own **how a thing attaches to geometry**, never the payload.

## Related

- [Editor substrate](EDITOR_SUBSTRATE.md) — the package map, consumers, seam rules
- [World model](WORLD_MODEL.md) — the landscape every rung writes into
- [Scene editor](SCENE_EDITOR.md) — the UI design
- [Scene editor plan](SCENE_EDITOR_PLAN.md) — the older UI/tool checklist
