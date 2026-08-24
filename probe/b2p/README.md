# `B2p` — result: ✅ **a 45° face claims its own edges, and `cut_arb` needs no new geometry**

**Run 2026-08-24.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §2.3 — the octagonal wall.

```sh
make probe-b2p          # or: loft --interpret --lib lib/ probe/b2p/b2p.loft
```

## The question

§2.3 says an octagonal bay turns **45°**, and 45° is **not** in `D` — the 24-direction set world
linework is quantised to (`@HB-X29`, `FORMAL_CORE` §3). The design's answer was that the octagon
is not linework at all: it is a **surface**, and `hex_edge::surf_straight` takes an **arbitrary**
normal, with `hex_way::cut_arb` giving each boundary edge to its nearest one.

That is a claim about a mechanism, so the probe asks the mechanism directly: build a room with a
bay bump, declare the parent wall plus the bay's two 45° cants and its front face, `cut_arb`, and
**count which surface each edge went to**.

## What was measured

Four surfaces over a 60-cell footprint, restricted to the bay's own 13 boundary edges:

| | edges | unassigned | worst stray | **by surface** |
|---|---|---|---|---|
| all four surfaces | 13 | 0 | **1.577** | `s2=5 s3=4 s4=4` |
| control — parent alone | 13 | 0 | **4.696** | `s1=13` |

✅ **Not one of the 13 goes to the parent.** They split 5/4/4 across the `+45` cant, the front and
the `−45` cant — which is the octagon's own face structure, recovered by a library that was never
told about octagons. The stray falls 3× as a consequence, but the **histogram is the finding**;
the stray is a summary of it.

⛔ **The control is the `@HB-X55` shape and it behaves**: a fixed "always the parent" rule strands
every edge on a surface up to 4.7 units away. So the cut is genuinely arbitrating, not defaulting.

## ⚠ The first version measured the wrong 66 edges, and reported 8.2

It ran `worst_stray` over **every** boundary edge of the room, and got **8.221** against a control
of **10.026** — a pass on the assertion, and meaningless. The fixture declares surfaces for the
room's **east side only**; its west, north and south edges have no surface at all, so `cut_arb`
gave them to whichever of the four was nearest and that is eight units away.

⚠ **The number was a fact about the three walls the fixture never declared**, and it was inside a
green result. A ratio that improves can improve for a reason that has nothing to do with the
question — which is why the histogram was added afterwards and should have been there first.

## What this does NOT cover

- **No octagon is constructed.** Four surfaces at hand-chosen normals are not `@HB-X70`'s
  eight-face derivation; §2.5's *"can a tower's octagon be deduced from its footprint"* is
  `B0p`'s question and `B0p` **refuted the premise** — the body is stored in the palette.
- **`surf_distance` is to a BOUNDED surface**, so 1.577 mixes perpendicular offset with distance
  past an end. It is a comparison against the control and not an accuracy figure.
- **One bay, one scale, one orientation.** The parent runs due north–south, which is the easy
  case: a bay on a `D` heading that is *not* axis-aligned puts both cants off-lattice at once.
