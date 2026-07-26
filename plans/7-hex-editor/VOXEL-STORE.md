# The voxel store — one durable home for the landscape

*(user, 2026-07-26: "create a design to make the compact voxels the only thing that we
store (mmap) and use for the whole landscape, we can use other structures for parts of
it and for efficiency for collisions etc")*

Written before the code, per `design-protocol`: the failure paths are where the
invariant surfaces, and this is the cheapest place to find out the first answer was
wrong. It was — see §2.

---

## 1. The invariant

> **Delete every file but the world file and the landscape comes back bit-exact.
> Delete the world file and no amount of derivation brings it back.**

Both halves are load-bearing and the second is the one that gets forgotten. The first
says *derived structures are disposable*; the second says *nothing else is secretly
authoritative*. A design that satisfies only the first drifts into a second home for
some fact — a peak list, a cached edge table, a "just this one flag" — and then two
things are the truth and they disagree the first time one is rebuilt.

This is `L3` (stored vs derived-on-demand) and `L13` (the voxel is the ceiling on
permanent world state) applied to persistence rather than to memory. It **extends**
`DESIGN.md`'s existing invariant — *"every mutation of geometry passes through one
apply, and that apply re-derives every anchor in the region it touched"* — rather than
competing with it: that one governs the write path, this one governs what survives a
restart.

---

## 2. ⚠ The first answer was wrong: mmap is the wrong home for this data

The obvious build is `store_persist_bind(chunks, "world.store")` — loft ships it, it is
mmap, and the docs call it *"the hash IS the file."* Probing it before building it
killed it, on two independent counts.

**It is documented as unsafe for exactly our data.** `loft/doc/claude/STDLIB.md:564`:

> If the program crashes between the last write and the seal … next start's
> `store_durable_check` returns `false` → caller rebuilds. This is **by design** — Tier 1
> trades durability for cheap writes … **Do not use** for data that cannot be
> re-derived; Tiers 2 (snapshots) and 3 (WAL) are planned for that case but not yet
> shipped.

An authored landscape is the definitive un-re-derivable artifact. There is nothing to
rebuild *from*. Tier 1 is for caches, and the tiers that are not for caches do not exist
yet.

**Its file is an allocator arena, not our bytes.** `STDLIB.md:625`:

> the snapshot copies the arena's current capacity verbatim — no repack; a Store arena
> only ever grows … one consumer saw a 264 MB file for 3.5 MB of live data (~90×).

The stated goal is *"we want to build huge but still efficient worlds."* A format whose
size is the high-water mark of an allocator — free lists, slack, no compaction — is the
direct negation of that. And it makes the headline claim false on its own terms: under
`store_persist_bind` the compact voxel is emphatically **not** the only thing we store.
We store an arena that contains some voxels.

**What was missed the first time.** `seek(self: File, pos: integer)`
(`STDLIB.md:421`) plus `write_bin` / `read` for raw struct binary. A file whose bytes
*are* the voxels, written in place at a computed offset, is available and needs no
allocator. For our access pattern — fixed-size chunks, read one, write one — `seek` +
an 8 KB read is what an mmap would have done anyway, with the OS page cache still doing
the caching, minus the arena and minus the durability disclaimer.

**So: the world file is ours, laid out as voxels.** This *serves* the request more
literally than mmap does, and it is worth saying plainly that it is a departure from the
word in the brief. If profiling later shows the syscall path is the bottleneck, a loft
Store can be adopted as an in-memory working layer over this file — but never as the
durable record, until Tier 2/3 ship.

---

## 3. What is stored, exhaustively

The invariant is only checkable if the durable set is *closed*. It is these three things
and nothing else:

| # | what | why it cannot be derived |
|---|---|---|
| 1 | **voxel chunks** — the landscape | the authored thing itself |
| 2 | **the palette** — material / wall / item definitions | `u8`s are indexes; without the tables they name nothing. Authored, not derived |
| 3 | **world header** — name, version, chunk geometry | says how to read 1 and 2 |

Everything else is derived and must be deletable mid-session without loss: chunk meshes,
normals, the collision structures below, the LOD height texture, the dirty set, the
loaded-chunk table.

⚠ **Spawn points and NPC routines are NOT in this list and that is a decision, not an
oversight.** `Map` carries `m_spawn_points` / `m_npc_routines` today. `L15` separates
game state from world state, and `EDITOR_SUBSTRATE` puts NPCs out of scope entirely —
they belong to crawler's model. They are authored, so they need *a* home, but it is a
side table beside the world file, not inside it, and not this design's business. Naming
them here stops them being quietly absorbed into "the landscape" later.

---

## 3b. The vertical model — settled

*(user, 2026-07-26: "The lowest layer is always the lowest you can get (bottom of the
sea, lowest cave/dungeon floor)")*

Two things follow, and both make the format **smaller**.

**A storey is a heightfield, and the door to volumes is now deliberately shut.** One
surface per hex per `cy`; "under" always means *a storey below*, never an overhang inside
one. A cave is a storey with the one above it absent; a bridge you walk beneath is an
item with its own collider, not terrain. So the cell stays seven integers and the 8-byte
claim holds — a column of spans would have ended it.

**`cy` is ABSOLUTE, measured from the bottom of the world, not relative to the surface.**
`cy = 0` is the deepest anything goes — seabed, lowest dungeon floor — so there is no
storey below it and no negative coordinate anywhere in the format. The deepest dungeon
and the sky share one coordinate system.

⚠ **This deletes `base_height` from the header, and that is the point.** The previous
draft carried it as insurance for "a world whose base plane is not 0". Under this rule
that world cannot exist: the floor is canonical. Keeping the knob would mean every read
and write of a height re-asserts the offset — `N > 1` sites, silent when forgotten, every
one of them off by exactly the same amount and therefore invisible. Removing it is the
protocol's `N × silence` cure applied by *subtraction*: a domain fact made a mechanism
unnecessary, so the mechanism goes.

⚠ **The consequence for the editor, flagged rather than assumed away.** The plane it
builds today sits at `cy = 0`. If `cy = 0` is the absolute bottom, nothing can ever be
dug beneath that plane. So the surface has to start at some `cy > 0`, and how much room
to leave below is a worldbuilding call, not a format one. **Assumption until told
otherwise: the surface starts at `cy = 8`**, leaving eight storeys of dungeon beneath a
default world. Cheap to change while no file exists; it is only a starting offset, and
the format itself is indifferent to it.

## 4. Layout

A storage chunk is **32 × 32 hexes at one storey** — matching `moros_map`'s existing
`Chunk` — which at 8 bytes a voxel is exactly **8 KB, two pages**.

```
[header      ] magic, version, chunk_w, palette_off, dir_off, dir_len
[palette     ] the three definition tables, length-prefixed
[chunk dir   ] sorted (cx, cy, cz) → slot, one entry per EXISTING chunk
[chunk slots ] 8 KB each: 1024 × Hex, row-major hx*32+hz, CRC32 trailer
```

**Sparsity is the efficiency claim, and it falls straight out of §slot-0.** An
unauthored region is all-zero voxels, and an all-zero chunk is *not written at all* — a
missing chunk and a zeroed chunk read back identically. So a fresh infinite world costs a
header, and a 1000×1000-chunk authored world costs 8 GB only if all 10⁶ chunks were
actually touched. This is the same "slot 0 is absence" rule from the palette commit
paying rent a second time: absence has one representation, and it is free.

**The elision has no escape hatch and does not need one.** It works because the default
is all-zero, and §3b makes that canonical: heights are absolute from a world floor that
is by definition the lowest anything gets. There is no "raised base plane" case to defend
against, so there is no offset to carry — see §3b for why removing that knob was the
correction and not a simplification.

**Two chunk sizes coexist and must not be confused.** Storage chunks are 32×32; the
editor's *mesh* chunks are 8×8 (`CHUNK=8`). One storage chunk is 16 mesh chunks. They are
different jobs — page alignment vs draw-call size — and both are right. Writing them
down is the point: a silent 32-vs-8 mismatch is exactly the class that produced the
"dirty region used DRAW_HEXES not PEAK_R" 920 ms stall.

---

## 5. Durability: what a crash costs

An 8 KB write is not atomic; a kill mid-write tears a chunk. Whole-file
temp-and-rename is correct and unaffordable at 8 GB. So:

- **Per-chunk CRC32.** A torn chunk is *detected* on read and refused by name — one
  chunk reported, not a world silently corrupted. This is the house rule (`K-FIT`:
  refuse with a named reason) applied to bytes, and the same shape as
  `ML_LABEL_TOO_WIDE`.
- **Chunk writes are idempotent and independent.** No chunk's validity depends on
  another's, so a torn chunk is a hole, never a cascade.
- **`store_durable_seal` on clean exit, `store_durable_check` on open** — loft's
  sidecar works on any file, not just Stores, and gives whole-file integrity for free.
- **A failed check does not mean rebuild** (we have no source) — it means *report which
  chunks failed CRC and open the rest*. That inversion is the whole reason we are not on
  Tier 1.

---

## 6. The derived side — collisions and the rest

The user explicitly allows other structures "for parts of it and for efficiency for
collisions etc". The invariant does not forbid them; it constrains how they are *built*.

**One rule makes them safe, and it is a compile-time rule, not a discipline:**

> A derived structure exposes **no setter**. Its only entry point is
> `rebuild(store, region)`. You cannot write into it, so you cannot forget to.

That is the `N × silence` cure from the protocol. The dirty-marking side is already
collapsed to N = 1 by `DESIGN.md`'s one-apply rule; this collapses the consuming side by
making the wrong operation *unavailable* rather than merely discouraged.

Candidates, all rebuildable from a region of voxels:

| structure | job | keyed by |
|---|---|---|
| chunk mesh + normals | drawing | mesh chunk (8×8) |
| **terrain height sampler** | feet, camera | read straight from voxels — no structure |
| **wall/edge collider** | blocking motion | `EdgeSet` per storage chunk, halo included |
| item/props broadphase | interaction | `spatial<T[x,y,z]>` — Morton, ships in loft |
| LOD height texture | the far band | one texel per hex, whole regions |

`spatial<T[x,y,z]>` (`LOFT.md:1457`) is a Morton/Z-order radix tree with proximity
range-slices — the right shape for the broadphase, and worth noting its bounding-box
query returns *"the raw Morton-code interval, a superset of the geometric box"*, so
results need filtering. That superset is a correctness trap for anyone who assumes the
box is exact.

The terrain sampler row is the interesting one: **there is no acceleration structure for
ground collision, deliberately.** A voxel read at (q,r) is already O(1) into a mapped
page. Building an index over it would be a second home for a fact — the thing the
invariant forbids — for no gain.

---

## 7. Probes — the cheapest tests that could prove this wrong

Each is written to *fail* if the claim is false, and each names its control, because six
gates in this editor were green for the wrong reason and every one was caught by running
the control, never by reading the code.

| # | claim | probe | control |
|---|---|---|---|
| P1 | voxels round-trip | author a region, close, reopen, compare all | mutate one voxel first → must fail |
| P2 | **nothing else is authoritative** | delete the world file, keep all else → landscape must be **gone** | keep the file → comes back whole |
| P3 | derived is disposable | drop every derived structure mid-session, rebuild, compare frames | — |
| P4 | sparsity | 10⁶-chunk empty world < 64 KB | author one hex → exactly one chunk appears |
| P5 | elision is symmetric | zero a chunk's last voxel → file shrinks; reads unchanged | — |
| P6 | no arena bloat | file size ≈ chunks × 8 KB + header, within 5% | build-then-prune must not 90× it |
| P7 | a torn chunk is named | corrupt 8 KB by hand → that chunk refused, others open | uncorrupted → silent |
| P8 | palette travels with the world | copy the file alone to a fresh dir → materials resolve | — |

**P2 is the one that matters most and is easiest to skip.** It is the only probe that can
catch a second home, and it is the half of the invariant that decays silently.

---

## 8. Steps

Thick rungs, each ending green, per the standing rule.

- **V1** — the file: header, palette, directory, one chunk in and out. P1, P8.
- **V2** — sparsity and elision: all-zero chunks never written. P4, P5, P6.
- **V3** — CRC and refusal: torn chunk named, rest opens. P7.
- **V4** — **the editor moves onto it.** The brush writes voxels instead of appending a
  `Peak`; `terrain_h` reads cells instead of summing peaks; `chunk_mesh` reads voxels.
  `Peak`, `world_save`, `world_load` are **deleted**, not promoted — `LIBRARY-CANDIDATES`
  row 11 already withdrew them and this is where that lands. P2, P3.
- **V5** — the derived side formalised: no-setter rebuild contract, edge collider,
  broadphase.

**Migration.** Existing peak-format worlds are baked to voxels once by a throwaway
reader, then the format is gone. Cheap (~20 lines) and it means no test world is lost.

---

## 9. What this does not do

- **No mmap, for now.** §2. Revisit when loft ships Tier 2/3, or if profiling says the
  syscalls matter — as a working layer, never as the record.
- **No compaction.** Freed chunk slots are reused via the directory; the file does not
  shrink on delete. Named so it is a known frontier, not a surprise. (P6 constrains
  bloat during a session, not across a delete-heavy lifetime.)
- **No multi-writer.** One process owns a world file. Multi-client already means many
  viewers of one server-side model, so this costs nothing today.
- **No spawn/NPC data.** §3.
- **No volumetric terrain — overhangs, caves and arches inside a single storey.**
  Closed deliberately in §3b, not deferred: it is the one decision here that a file
  format cannot be talked into later.
