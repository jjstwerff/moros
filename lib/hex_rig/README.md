# hex_rig

An **assembly of bodies**, the frames a pose resolves to, and how its axles sit on ground.

```loft
use hex_rig;

asm  = asm_cart(half_width, radius);          // a rig of bodies, linked
rest = ground_axle(sample, x, z, yaw, half, radius);   // where its axles settle
fr   = asm_frames(asm, [0.0, val, val], base);         // the pose, as frames
y    = frame_apply(fr[0] ?? base, vec3(0.0, 0.0, 0.0)).y;
```

## ⚠ What this is NOT

**`Rig` and `Joint` are `hex_body`'s, and they stay there.** That package answers *what a
body IS* — bones, and the limits in the joints between them, never a pose. This one is the
layer above: it **assembles** those bodies into a vehicle or a linkage, resolves a pose into
frames, and answers where the result rests on ground.

⚠ **The name is a claim and this sentence is what defends it.** `hex_rig` beside `hex_body`
could be read as a second answer to *what a rig is*; it is not one, and a name defends itself
badly. The dependency is the checkable half: **`hex_rig` → `hex_body`, never the reverse** —
see `[dependencies]`, and note that `hex_body` declares nothing of ours.

## Where it came from

It was three modules of moros's `moros_sim` until plan 19 `L6.3b`. It moved because it was
measured to be movable: `assembly`, `frames` and `ground` use **nothing** from `moros_map`,
`moros_editor` or `moros_render` — checked name by name, all three answer nothing — while the
rest of that package needs 36 names across those three. That asymmetry is the whole reason
this is a split rather than a rename.

⚠ **The remainder is a CONSUMER of what left.** `bend`, `shape`, `tether` and `skin` all use
`Assembly`/`Frame`, so `moros_sim` depends on this package now. That is layering, not a clean
halving, and it is worth knowing before assuming the two are independent.

## Status

⏭ **Unpublished.** The name is still free to change and is the thing to settle before it goes
to the registry — after that it cannot move. `categories = ["geometry"]` is declared because a
package the index has never seen is refused without one.

⚠ **The `hex_body` floor is `>=0.1` and that is measured, not assumed**: all nine names this
package uses (`Rig`, `rig_new`, `rig_bone`, `rig_admissible`, `rig_write`, `rig_read`,
`rig_eq`, `rig_world_seg`, `bone_obb`) are present in the published 0.1.0 as well as in 0.3.1.
⚠ Floors are checked against what is IN THE REGISTRY, never against a sibling's `main` — five
`hex_*` packages were refused publication on 2026-08-21 for declaring a floor that measurably
does not hold.

## Licence

LGPL-3.0-or-later.
