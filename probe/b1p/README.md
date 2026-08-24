# `B1p` — the cells survive, the palette survives, the session does not

**Run 2026-08-24.** [BLUEPRINT](../../doc/claude/BLUEPRINT.md) §1 and §3.3.

```sh
make probe-b1p
```

## Result

| | |
|---|---|
| cells + edges | ✅ **exact** — 16 edges, material 1, world key `32952:2996804125` before and after |
| **the palette** | ✅ **round-trips** — 7 entries sent, 7 identical back |
| the run record | ⛔ **gone** — a loaded world carries no session, [EDITOR_DEFECTS](../../doc/claude/EDITOR_DEFECTS.md) entry 5 |

## ⚠ The finding was a COMPILE ERROR, not a measurement

The probe would not build:

```
error: missing argument for parameter 'palette' of `world_to_bytes`
```

**`world_to_bytes(w, palette, owner)` takes a palette — `vector<integer>` — and hands it back as
`wl_palette`.** I had written the probe on the belief there was *nowhere in the editor's format to
put a wall type*, and was one commit away from reporting that as a design blocker. The compiler
said otherwise before the first run.

## ✅ And it resolves a contradiction rather than confirming one

Reading alone had produced what looked like a hard conflict:

- `@HB-X12` puts a wall's body and thickness in a **palette** — `WallDef.wd_body`, `wd_thickness`.
- That palette lives in `moros_map`, and **the editor does not depend on it** (`hex_editor`'s
  dependencies are `hex_draw hex_form hex_field hex_way hex_edge hex_shape hex_place hex_grid
  hex_voxel hex_part` — no `moros_*`).
- And `hex_voxel/tests/boundary.loft` **asserts `wd_body` must never appear in the substrate**:
  *"these are the names the ownership audit put firmly on the CONSUMER's side … the day this
  package knows what a stair is, it has stopped being one."*

⚠ **BUT THE TEST FORBIDS THE SUBSTRATE *UNDERSTANDING* `wd_body`, NOT *CARRYING* IT.** A palette
of opaque integers, interpreted by the consumer, is exactly *"the library owns how a thing
attaches to geometry, never the payload"*. The slot exists, it is the right shape, and it
survives a save.

**So a blueprint's wall bodies and thicknesses have a home** — as consumer-defined integers, with
lavition free to define its own table rather than borrowing Moros's map palette. That also keeps
the universal-editor claim intact: `OCTAGON` need not become a Moros word.

## What this measured that nobody had

`@HB-X63` proves the foxel round trip byte-for-byte and says in the same row: *"⚠ `@HB-X12` and
`@HB-X13` are **NOT** covered — the palette … is untouched and stays **T4**."*

**Here it is, covered from the consumer side.** Not a substitute for hexbody's own gate — this
measures moros's encoder, not the model — but the specific fear BLUEPRINT recorded (*every
blueprint reopens as `SOLID`*) is not what happens.

## ⚠ Still open, and it is the one plan 24 already owns

The **run record** does not survive, so a wall's authored line is lost on reload while its stamped
edges remain. That is `EDITOR_DEFECTS` entries 4 and 5 — one defect seen from two sides — and
plan 24 removes it by making the store the only authority. A blueprint inherits that fix; it does
not need one of its own.
