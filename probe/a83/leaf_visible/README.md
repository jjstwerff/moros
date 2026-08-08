# `A8.3` — is the leaf drawn, and why can nobody see it

Plan [17](../../../plans/17-parts/README.md) `A8.3`. The acceptance shots
(`shots/a83-door-{w,sw,s}.png`) show a grey wall with a gap in it and nothing in the
opening a person would call a door. This settles **why**, and the answer is not the
one the pictures suggest.

```sh
probe/a83/leaf_visible/run.sh        # exit 0 = all four controls behaved as on 2026-08-08
```

It builds a variant part library in a `mktemp -d` — `door/leaf`'s cell recoloured
`FLOOR_MAT` → `FIELD_MAT` — and drives a server against it with `EDITOR_PARTS`.
**It writes nothing inside `data/parts/`**, which is committed and shared.

## What it measured

| | what it shows |
|---|---|
| the picture | `door/hung` with a bright yellow-green leaf: **0 field-coloured pixels** from all three A8.3 stations. `door/leaf` alone: **841**. So the recolour is visible and the composed doorway does not show it |
| early vs late | the same station shot seconds apart is **0 both times** — not a settle miss, which was the obvious second hypothesis |
| the limb block | `door/hung` broadcasts **two** limb meshes, ids 8 and 9. `door/leaf` opened as a subject broadcasts **none** — the control that proves the probe can tell the two apart |
| the payload | id 9 is colour **`0.55,0.52,0.46`** spanning **y 0.00..3.25** |

## The finding

**The leaf is drawn. It is drawn as the wall.**

`0.55,0.52,0.46` is `hex_mesh::surfaces()`'s `wall` entry, byte for byte — the same
colour the frame's own wall is painted. `y 0.00..3.25` is one `WALL_UP`
(12 × `HEIGHT_SCALE` 0.25 = 3.0) standing on the 0.25 paving — the same height as the
wall it hangs in. A leaf that is the wall's colour and the wall's height, in a hole in
that wall, is not a door to any eye. The striped wedge visible in the west shot is that
panel z-fighting with the frame's.

⚠ **AND THE RECOLOUR COULD NOT HAVE FIXED IT, WHICH IS THE SECOND FINDING.** A cell's
`h_material` colours its horizontal PLATE. A leaf's body is a vertical PANEL, and
`part_body_meshes` sends every per-edge panel to the one `wall` slot — the edge material
only picks a height through `wall_up`. So **no cell material can recolour a leaf**: the
green plate in these runs is the leaf's floor, not its face, and it is buried among the
paving. Changing `WALL_MAT` to `FENCE_MAT` would change the height and not the colour.

That is what makes this a **format** question rather than a content one, exactly as
[STATE](../../../doc/claude/STATE.md) records: it wants an `Opening` profile in the part
format, or a per-part wall height and material. Nothing an author can write today reaches it.

## Why the instruments are here and not in a gate

`mesh <surface>` in `tools/script.mjs` counts the **chunk** id space and a bound limb is
broadcast on its own reserved block (`PART_MESH_BASE`..`+MAX`, ids 8..15) — so that verb
reports `0` for every limb no matter what was sent, and reported `field 18` for a part
whose cells hold no field at all, one subject behind. ⚠ **It was checked against something
it should find before it was believed**, and it failed that check; these two `.mjs` files
are what replaced it. A picture cannot see a colour it is not painted in, and a count of
the wrong id space cannot see a limb.
