# 14 — Props and dressing: placed things that do not collide

**Issue:** [jjstwerff/moros#14](https://github.com/jjstwerff/moros/issues/14)

Set dressing and kit-bashed elements — authored with the house machinery or imported as
`glb` — placed in the world without collision. Also the multi-rig connector problem: how
parts of trains, robots and vehicles combine given their bone structures.

The world model ([#8](../8-voxel-world/DESIGN.md)) owns only the *hook*: layers have a
kind, the kind table is global, and non-terrain layers are skipped by the fold check and
the collider. **Everything below is the payload, which is this plan's.**

---

### Layer kinds — terrain and dressing

Not every layer is a heightfield. A **dressing layer** places things — set dressing and
kit-bashed elements, authored with the house machinery or imported as `glb` — and those
things **never collide**. They are seen, not stood on.

```
kind 0  TERRAIN   a heightfield; collides; participates in non-folding
kind 1  DRESSING  placed instances; never collides; transparent to non-folding
```

⚠ **The first version of this section was wrong, and `../crawler` had already solved it.**
It made a dressing layer *the same 8 KB of cells as terrain, reinterpreted* — elegant,
left chunks and elision untouched, and broken for two independent reasons that crawler's
shipped props design (`crawler/PROPS.md`, plan 10, all nine phases gated) states outright:

> *"A level is a **sheet**, not a slot, so it does not limit one prop per cell. Within the
> prop level the records are a **bucketed list** — cell → first prop, then a next-pointer
> chain … A lamp and a trough on one hex is one cell, one level, two records."*

1. **A cell array is a slot, and one prop per hex is a limit nobody asked for.** Stacking
   more dressing layers to get a second lamp does not work either, because layer kind is
   world-global — a hex wanting five props would burn five layer indexes for every tile in
   the world.
2. **Terrain is dense; dressing is sparse.** Every hex has a height, so a 1024-cell array
   is exactly right for terrain. Almost no hex has a lamp, so the same array spends 8 KB to
   place three of them. Using the dense representation for sparse data is precisely the
   inefficiency "huge but efficient worlds" forbids.

The uniform-cell version absorbed dressing into terrain's shape because it *looked* like
one mechanism serving two cases. It was one mechanism serving one case and disfiguring the
other.

**So the two layer kinds have two representations, and the layer-kind table says which.**

```
TERRAIN   dense    1024 × StoredHex, 8 KB           — every hex has a height
DRESSING  sparse   bucketed records, cell → chain   — almost no hex has a prop
```

A dressing record carries what a placement needs and terrain has no room for: asset id,
orientation, **sub-cell offset** (crawler's Part 1 — what keeps two props on one hex
visually distinct), scale, and the next-pointer. It is not a voxel and does not pretend to
be one.

**Dressing may be DERIVED, and then it costs nothing at all.** crawler's sharpest result is
that placement is mostly not authored data: `L_FIXED` — doors in openings, chimneys on
ridges, fences on boundaries — is *"a pure function of the architecture level plus a
seed"*, so **a village furnishes itself** and stores zero bytes. Only `L_MOVABLE` is
authored, *"because where a cart is, is a fact about the world rather than a consequence of
the buildings."*

That axis was missing here entirely, and it is the same `L3` split the rest of this design
runs on — applied one level up. A dressing layer is therefore marked **authored** or
**derived** in the header; a derived one stores a seed and nothing else, and rebuilds
exactly when the layers it derives from change.

**Layer kind is world-global, and that is forced rather than chosen.** If a layer's kind
varied per chunk, the same index could be terrain in one tile and dressing in the next, and
the non-folding check would be incoherent across the seam — exactly the class of failure
§5.4 exists to prevent. So the kinds live in the header: 64 entries, one per layer index,
for the whole world.

**⚠ The door is the hard case, and it is open in crawler too.** This design says flatly
that a prop which blocks is not dressing — it is a wall or an item in a terrain layer. That
relocates the problem rather than solving it: a door is *drawn* like a prop (parts, hinge,
one stored angle) and *blocks* like a wall, and crawler lists exactly this under **Still
open** — *"either doors move to a third level, or state is separated from placement — the
second is probably right, since the door has not moved, only turned."* Their instinct is
almost certainly right and this design should follow it rather than invent a third answer.
Until it does, a door in moros loses its parts tree.

**Two consequences carry weight:**

- **The fold check skips dressing layers entirely.** Non-folding is a statement about
  surfaces, and a dressing layer has none. It is transparent: terrain at layer 3 and
  terrain at layer 9 constrain each other whether or not dressing sits between them.
- **Dressing never reaches the collider.** `hex_edge` reads terrain layers only. A prop
  that blocks motion is not dressing — it is a wall or an item, and it belongs in a terrain
  layer where the model already carries it.


---

## Validated against `../crawler`, which had already built it

crawler's [plan 10](../../../crawler/plans/10-props/README.md) is shipped — nine phases,
all gated — and `crawler/PROPS.md` settles most of this. The findings above are theirs,
not derived here. What remains genuinely open for moros:

- **`glb` import**, which crawler does not do — its props are generated. Kit-bashing from
  imported assets is our case, and the asset table is where it lands.
- **The multi-rig connector** (rungs W6/W7's other half), which `hex_body` does not have.
- **The door**, open in crawler too: separate state from placement, since the door has not
  moved, only turned.
