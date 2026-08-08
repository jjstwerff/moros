# `A8.3` / `A8.8` — is the leaf drawn, and is it drawn as the wall

Plan [17](../../../plans/17-parts/README.md). It began as a **diagnosis** — `A8.3`'s doorway
photographed as a wall with an empty hole — and it is now the **regression gate** for the fix,
[PARTS.md §P9.13](../../../doc/claude/PARTS.md#p913--a-part-says-how-tall-its-walls-are-and-what-they-are-made-of).

```sh
probe/a83/leaf_visible/run.sh        # exit 0 = all seven behaved as on 2026-08-08
```

⚠ **It writes nothing inside `data/parts/`**, which is committed and shared: the variant library
the last control needs is a `mktemp -d` copy reached through `EDITOR_PARTS`.

## What it found (`A8.3`, the diagnosis)

The acceptance shots showed a grey wall with a gap and nothing nameable in the opening, and the
obvious reading — *the leaf never reaches the picture* — was **wrong**.

| | what it showed |
|---|---|
| the picture | `door/hung` with the leaf's cell recoloured `FIELD_MAT`: **0** field-coloured pixels from all three stations. `door/leaf` **alone**: 841 |
| early vs late | the same station seconds apart is **0 both times** — not a settle miss, which was the obvious second hypothesis |
| the limb block | `door/hung` broadcast **two** limb meshes. `door/leaf` opened as a subject broadcast **none** — the control proving the probe can attribute what it sees |
| the payload | colour **`0.55,0.52,0.46`** spanning **y 0.00..3.25** |

**The leaf was drawn. It was drawn as the wall.** `0.55,0.52,0.46` is `hex_mesh`'s `wall` entry
byte for byte; `y 0.00..3.25` is one `WALL_UP` (12 × `HEIGHT_SCALE` 0.25) on the 0.25 paving. Same
colour, same height, hung in a hole in that wall.

⚠ **And the recolour could not have fixed it, which is the second finding.** A cell's `h_material`
colours a horizontal PLATE; a leaf's body is a vertical PANEL, and `part_body_meshes` sent every
per-edge panel to the one `wall` slot — the edge material only picked a height through `wall_up`.
The green was the leaf's floor, not its face. **No value an author could write reached a panel's
colour**, which is what made it a format question rather than a content one.

## What it now gates (`A8.8`, the fix)

`door/leaf` carries `WALL` with `surface=floor`, and the seven claims are:

| | |
|---|---|
| `door/frame` draws **108** wall vertices | nine panels of twelve, not ten — **the doorway is still a hole** |
| `door/leaf` is **30** vertices of `0.65,0.4,0.25` | an 18-vertex plate and a 12-vertex panel, both timber |
| …and **nothing** in the wall surface | the routing is wholesale, not a blend |
| the limb block carries `0.65,0.4,0.25` | it reaches the composed doorway as timber |
| `door/leaf` as a subject: **NONE** | the attribution control |
| a variant `door/frame` with `up=6 surface=frame`: **108**, moved to `0.78,0.74,0.65` | the count is unchanged, so `up` did **not** override `DOOR_MAT` — a profile that did would draw a panel across the opening (10 × 12 = 120), a part whose whole purpose is a hole drawn solid |

⚠ **The count is the instrument for that last one and a picture cannot be.** *The opening is a
hole* and *the opening is a panel the same colour as the wall* photograph identically — which is
the trap this whole probe exists because of.

## The instruments, and why they are these

- **`panels.mjs`** — every mesh a subject emits, grouped by the colour it is painted in. Six
  floats a vertex, not three: `emit_tri` writes a position *and* a normal, and dividing by 3 gave
  `231.33` — a fractional vertex count is the tell that a stride is wrong.
- **`limbwire.mjs` / `limbwhere.mjs`** — the limb block (ids 8..15) and its payload.
  ⚠ `script.mjs`'s `mesh <surface>` **cannot see a limb at all**: it counts the CHUNK id space
  while a limb goes to `PART_MESH_BASE`..`+MAX`, so it answers `0` for every limb whatever was
  sent — and answered `field 18` for a part whose cells hold no field, one subject behind. It was
  checked against something it should find, and it failed that check; these replaced it.
- **`meshalias.loft`** — ⚠ **a `Mesh` COPIES through a local *and* through a vector read.** Only a
  parameter aliases. The obvious way to route a panel — `pwm = all[i]; emit_wall_panel(pwm, …)` —
  therefore drops every triangle with no diagnostic, every count agreeing, and a blank wall in the
  picture. It is also *not* what [loft#774](https://github.com/loft-lang/loft/issues/774) records
  for a plain struct (*copies on `b = a`, **aliases** on `c = v[0]`*), so that note must not be
  relied on for a Mesh. This probe is why `emit_panel_into` takes all six candidates as parameters.
⚠ **AND ALL THREE SETTLE ON THE EVIDENCE, NEVER ON A CLOCK.** The first version slept 4 s after
each `44:` and produced a **flake in a gate**, which is worse than no gate: under load three claims
came back false and then true on a rerun. They now return when no `M:` has landed for 900 ms —
⚠ *and only once something has arrived since the wait began*, because without that half the second
subject settles instantly on the FIRST subject's silence and reads as an empty part. Both faults
were measured, one after the other, and the second looked exactly like the change under test.

- **`leaf_field.keys` / `early_late.keys`** — the picture half, run by hand with `--shots`.
  `tools/scripts/doorway.keys` is the acceptance shot itself.
