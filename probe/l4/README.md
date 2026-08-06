# `L4` — what `hex_world` means, measured

Plan [19](../../plans/19-lavition-split/README.md) `L4`. Two packages are called `hex_world`:
ours (`lib/hex_world`, a voxel column store) and the registry's (a sparse one-cell-per-hex
grid, published three times since 2026-06-14). The plan's job was to settle which keeps the
name; these eight controls are what it was settled on.

```sh
probe/l4/run.sh          # exit 0 = all eight behaved as on 2026-08-06
```

It stages a renamed copy of `lib/hex_world` as `hex_voxel` in a `mktemp -d` — the split's
rename, done for the price of a `cp` — so both lineages can sit in one graph. It writes
nothing inside the repo and nothing inside `../loft-libs-world`.

| | what it shows |
|---|---|
| `A`–`D` | one line, `use hex_world;`, means **either package** depending on whether `--lib lib/` is passed. Both directions compile and run; neither error mentions that two packages share a name |
| `E` | after the package rename the two are **co-installable** — both in one graph, exit 0, no diagnostic |
| `F` | the two `World` structs do **not** merge: `expected World, got World`. So the package rename is enough for correctness |
| `G`/`H` | …except a **bare** `Chunk { … }` literal binds to whichever package was `use`d **first**. Same file, imports swapped, opposite meaning, no ambiguity error — [loft#788](https://github.com/loft-lang/loft/issues/788) |

⚠ **`G` is `L1`'s diagnostic verbatim, one rename later.** `error: Unknown field Chunk.ck_cells`
is what two `Surface` structs looked like for months — a missing field on the struct nobody
meant. That is why the recommendation renames our `World` and `Chunk` too, which `F` says is not
required: *not required* and *safe to leave* are different claims, and only the first was
measured.

⚠ **THE RUNNER OWNS THE EXPECTATIONS, and its first version was wrong in the way it exists to
catch.** It passed `--lib lib/` alongside the stage dir, so `hex_world` resolved to **ours** and
`F` never had both lineages present — it failed on `Unknown function cell_count`, a different
bug, and reported PASS. Every control now checks the **words** as well as the exit code, because
an expected error is still an instrument reading, and a reading nobody looks at is how a probe
reports on a case it never ran.
