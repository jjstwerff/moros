# A module's BASENAME is global across the dependency graph

Two packages, one shared filename, and a control. Kept because it is the reproducer for
[loft#912](https://github.com/loft-lang/loft/issues/912) (closed) and for its two
residues, [#948](https://github.com/loft-lang/loft/issues/948) and
[#949](https://github.com/loft-lang/loft/issues/949) — and because CLAUDE.md's *grep the
BASENAME too* rule rests on it.

⚠ **It is under `probe/`, not `lib/`, on purpose.** `tools/run-tests.sh` globs
`lib/*/tests/*.loft` and `tools/layering.sh` globs `lib/*/loft.toml`, so nothing here is
part of this tree's build — which matters more than usual for a fixture whose whole
subject is a filename that breaks a neighbouring package.

## Run it

    cd probe/loft/basename/con && loft test

**As checked in** (`con/src/catalogue.loft` declares a compatible `part_list`) the run is
RED on purpose, and what it prints is the finding:

    Advice[module-name-shadowed]: module 'catalogue' is declared by two files — …dep/src/catalogue.loft
      and …con/src/catalogue.loft — … so this `use` binds the second one
    dep_answer = 100   (42 = the dependency's own, 100 = the consumer's shadowed it)

The dependency is green on its own — `cd ../dep && loft test` — and returns 42 there.

## The three states, and the one that costs a diagnosis

| `con/src/catalogue.loft` | result |
|---|---|
| absent | ✅ `1 passed`. The control |
| declares a compatible `part_list` | ⚠ advice naming both files, and **the dependency's own answer changes to 100** (#949) |
| declares anything else | ⛔ `Unknown function part_list` at **`dep/src/dep.loft`** plus a spurious `missing argument … of OpAddInt`, and **no advice** (#948) |

Measured 2026-08-17 on the toolchain installed 2026-08-16 23:08, interpreter and
`--native`. The third row is what this cost originally: `hex_mesh/src/catalogue.loft`
against `hex_part`'s, an error against a `pub` function in a package that was green,
found by elimination rather than from the output.
