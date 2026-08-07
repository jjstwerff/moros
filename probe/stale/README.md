# The stale-chunk defect — the instruments that found it, and the one that named it wrong

`OPEN_ISSUES` carried *"a raise marks fewer chunks than it writes"* for four days, over three
different guessed causes: a **ray** the code does not walk, then a chunk **streamed and never
re-sent**. Both blamed transport. The defect was in the **read**.

Run them all with `loft --interpret --lib lib/ probe/stale/<name>.loft`.

| probe | the question it answers |
|---|---|
| `extent.loft` | how far does ONE brush reach — in the **store**, not the mesh |
| `raise3.loft` | what do three raises actually BUILD, against what was asked for |
| `stair.loft` | what `storey.loft`'s stair test was reading when it read "the tread's own ground" |

## The order they had to be run in, which is the whole lesson

`src/editor_server.loft`'s `EDITOR_PROBE=fit` was already in the tree and answered in one run:
**81 of 81 chunk meshes CHANGED against 4 MARKED**, with a clean negative control. That killed
the marking hypothesis immediately — but it could not say *why* 81 changed, because it measures
**meshes**, and a mesh disagreeing with a mark is equally consistent with a bad mark and a bad
mesh.

`extent.loft` is the instrument that separates them: it asks the **store** the same question.
The answer is not subtle once asked.

    cells WRITTEN (material set):    91   over q -5..5   r -5..5
    cells whose HEIGHT MOVED:      4096   over q -32..31 r -32..31
    terrain_h(20,20) = 6   (written? false)      chunk (0,0) base 6

A height is stored relative to its chunk's window base and **one base serves the whole 32×32
tile**, so an unwritten cell decoding as `ck_base + 0` stands at the base. Four readers did
that; `world_surface` was the one that guarded, which is why nothing ever caught it.

⚠ **And then `raise3.loft`, which nobody thought to run for months.** The leak did not only
invent a plateau — `brush` adds its delta to `ground_h`, so a stroke read the leaked base back
as existing ground:

| | before | after |
|---|---|---|
| one press of `PEAK_STEP = 6` | **7** | 6 |
| three presses | **19** | 18 |
| a cell 12 hexes out, never written | **1** | 0 |

Every terrain number in this tree was one height unit high, and four separate gates had been
tuned against it.

## What to take from it

**When a count and a picture agree, they may share an instrument.** The entry survived on the
sentence *"they all check the store and the store is right"* — and the store was never right.
Every gate that "verified the store" was asking the same lying decode as the renderer, so the
agreement meant nothing at all.

**And a fixture built by a gesture inherits that gesture's bugs.** `cart.mjs` banked its cart on
the step between two of these artificial plateaus, so its `grounded` clause had never once been
asked about a real gradient — see OPEN_ISSUES, where it is now a live defect of its own.
