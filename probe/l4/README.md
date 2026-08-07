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
| `G`/`H` | a **bare** `Chunk { … }` literal is **refused at both import orders**, naming the two packages: *"`Chunk` is declared by more than one package here — write hex_voxel::Chunk or hex_world::Chunk to say which"*. Re-measured 2026-08-07 |

⚠ **`G`/`H` FLIPPED ON 2026-08-07, AND THE FLIP IS A FIX.** As measured on 2026-08-06 a bare
literal bound silently to whichever package was `use`d **first** — same file, imports swapped,
opposite meaning, no ambiguity error, filed as
[loft#788](https://github.com/loft-lang/loft/issues/788). `H` compiled and took theirs; only `G`
failed, and it failed on a missing field rather than on the collision. loft 2026.8.0 refuses
both and says why. **The controls now hold the fix**: if either one ever compiles again, the
order decides again and #788 is back — which is what their meaning-if-flipped lines say.

⚠ **`G` USED TO BE `L1`'s diagnostic verbatim, one rename later.** `error: Unknown field
Chunk.ck_cells` is what two `Surface` structs looked like for months — a missing field on the
struct nobody meant. That error is *still* emitted after the ambiguity one, which is why `G`
passed unchanged when the compiler's behaviour changed underneath it: its expected words were
the field error, and the field error survived. **A substring can be blind to the very change
it sits next to** — the wording is checked against the collision now. It is also why the
recommendation renames our `World` and `Chunk` too, which `F` says is not required: *not
required* and *safe to leave* are different claims, and only the first was measured.

⚠ **THE RUNNER OWNS THE EXPECTATIONS, and its first version was wrong in the way it exists to
catch.** It passed `--lib lib/` alongside the stage dir, so `hex_world` resolved to **ours** and
`F` never had both lineages present — it failed on `Unknown function cell_count`, a different
bug, and reported PASS. Every control now checks the **words** as well as the exit code, because
an expected error is still an instrument reading, and a reading nobody looks at is how a probe
reports on a case it never ran.
