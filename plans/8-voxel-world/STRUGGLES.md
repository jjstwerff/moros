# 8 — what fought back

The record of dead ends and corrections. Kept because the *reasons* outlive the decisions,
and because a design that only shows its conclusions teaches nobody why the obvious thing
was wrong.

## The mmap that could not be

The brief said mmap, and loft ships exactly that — `store_persist_bind`, *"the hash IS the
file."* The design was built on it and then killed by loft's own documentation, on two
counts: it is Tier-1 and says **"Do not use for data that cannot be re-derived"** (an
authored landscape is the definitive un-re-derivable artifact, and the tiers that would
carry it are unshipped); and its file is an allocator arena frozen at high-water mark,
never compacted, with **264 MB recorded for 3.5 MB live**.

What was missed on the first pass: `seek()` + `write_bin`. A file whose bytes *are* the
voxels — what the mmap would have done for fixed-size chunks anyway.

**The lesson:** the mechanism named in a brief is a proposal, not a requirement. Probing
it before building on it cost one read and saved the format.

## `base_height`: added, deleted, then understood

Added to the header as insurance for "a world whose base plane is not 0". Deleted when the
world floor turned out to be canonical — a *per-world* offset is a global constant that
buys nothing and costs a re-assertion at every height site. Then re-introduced **per
chunk**, where it is not insurance at all but the mechanism that lets a limited axis span a
tall world.

**The lesson:** same-looking field, opposite verdicts, and the difference was granularity.
"Do we need this knob?" was the wrong question; "at what scope?" was the right one.

## The chunk that was keyed wrong

Keyed `(cx, cy, cz)` — one chunk, one layer — for four rounds. It is `(cx, cz)`: a tile
carrying a stack of layers. The tell was in the brief the whole time ("a whole lot of
layers **in a chunk**") and was read as a throwaway rather than a structure.

## A name declared unavailable

`hex_world` was surveyed, found occupied by the audience-crystal model, and written off as
unavailable — a conclusion reached without asking. It was available; the incumbent is a
demo. Worse, `CONVERGENCE.md` already defined `hex_world` as *"chunked cell STORAGE"*,
which is precisely what we are building, so the name was never a collision — it was the
right home all along.

**The lesson:** surveying the sibling caught the collision (good) and then over-concluded
from it (bad). Finding an occupant answers "is this taken", not "may we have it".

## Still unresolved

- **Does `map_get_hex` alias?** It returns a vector element, and loft's `#338` says
  `tmp = v[j]` is a view, not a copy. If so, the `map_set_hex` that follows every mutation
  is decorative and any caller can write a cell through no function at all. This is P13 and
  it gates V0, because it decides whether the guard is "add a check" or "stop handing out
  mutable views".
