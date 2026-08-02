<!-- Copyright (c) 2026 Jurjen Stellingwerff  SPDX-License-Identifier: LGPL-3.0-or-later -->
# S3 probes — the client's own ground mesh

**Run them: `make guards`.** Each probe prints its own `PROBE PASS`/`PROBE FAIL`, so the
runner needs to know nothing about what any of them means.

## Why this directory exists

S3 read `ground 41 bad 7` and I spent a long stretch reading the mesher's arithmetic for a
defect that was never there. Two diagnoses were confidently wrong before a probe settled it,
and one of those probes was **itself** the bug — it copied into a local rather than through a
`&World`, reported `agree 3 bad 78`, and I believed it (loft-lang/loft#735).

So the routine is written down as files that run, rather than as a conclusion:

1. **a probe per claim**, liberally — a redundant one costs nothing, a missing one costs a session;
2. **an oracle in the code**, not in the probe — the probe asks `moros_terrain::tile_ready`
   rather than carrying its own copy of the rule, because a probe that re-derives what it
   tests agrees with itself and proves nothing;
3. **a map, not a tally** — see below, this is the step that actually paid;
4. **switch when it is green**, and keep the negative control that made it red.

## The probes

| file | what it establishes | why it is kept |
|---|---|---|
| `s3_copy_mesh.loft` | a world copied chunk-by-chunk meshes identically to its source — `agree 81 bad 0` | the baseline. It read `agree 3 bad 78` until the probe's own bug was found; that is the whole reason this table exists |
| `s3_copy_narrow.loft` | the same claim on one tile, with the differing vertex printed | the narrowing instrument — it is what refuted "the copy corrupts heights" |
| `s3_field_mutation.loft` | three mutation shapes each move the mesh checksum | the **control**: without it every row above passes on a constant |
| `s3_stream_order.loft` | the oracle predicts the mesh exactly — READY → 81 match, 0 wrong; NOT-READY → 32 of 40 differ | the finding itself. It is what turned S3 from an arithmetic hunt into an ordering fix |
| `s3_oracle_boundary.loft` | nine cache shapes × 361 tiles, **drawn as a map** | the boundary. A tally said "0 false positives"; the map said *where*, and that is different |

## ⚠ The map is the half that mattered

*(user: "half of your problem is solved if you 'see' what is incorrect vs what is correct")*

The first sweep reported `0 false positives, 877 false negatives` and I would have shipped a
guard called "conservative but safe". Drawing it instead — one glyph per tile — showed the
877 immediately for what they were: tiles where **both** meshes were empty, agreeing about
nothing. With heights bounded so every tile emits, `held-but-fine` went to **zero** and the
result changed category: the oracle is not a safe over-approximation, it is **exact**.

    ring w/ HOLE     # ready+correct   X READY BUT WRONG   o held (would have been fine)   . held+differs
      . . . . . . . . . . . . . . . . . . .
      . . . . . . # # # # # # # # # # . . .
      . . . . . . # # . . . . . . # # . . .      the hole in the cache, plus exactly one
      . . . . . . # # . . . . . . # # . . .      tile of margin around it, is held —
      . . . . . . # # . . . . . . # # . . .      and every tile outside that is answered
      . . . . . . # # # # # # # # # # . . .
      . . . . . . . . . . . . . . . . . . .
      -> ready+correct 64   READY-BUT-WRONG 0   held-but-fine 0   vacuous 0

A number cannot show that the withheld ring is *one tile wide*, and one tile wide is the
claim — a guard that misjudged its own reach would draw a ring of the wrong thickness and the
picture would say so without anyone deciding in advance what to measure.

⚠ **`vacuous` is the row that keeps the map honest.** Two empty meshes checksum alike, so a
sweep over terrain that does not emit everywhere is partly measuring nothing. It must read 0.

## Where the oracle lives now

`moros_terrain::tile_ready(world, cx, cz)` — beside the mesher, because it is a fact about
what the mesher *reads*: `MESH_CHUNK` cells plus `MESH_MARGIN` = 2 on every side, which is
the grid `chunk_mesh_mat` really builds. Tested in `lib/moros_terrain/tests/mesh.loft`;
consumed by `src/editor_client.loft`'s `Q:` handler; gated by
`tools/gates/world/client_mesh.mjs`.

Measured effect, same run before and after: **`ground 41 bad 7` → `ground 10 bad 0 wait 38`.**

## Still open

The 38 held tiles are held *forever* in this run — nothing re-asks once their margin lands.
The home for that is the `Z:1`/`Z:0` staging bracket the stream already has: re-compare at
`Z:0`, when the batch is known complete. Until then S3 proves the mesher agrees where it can
be asked, not that the client could yet stop being sent `M:` frames.
