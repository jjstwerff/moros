# Probe 5 — written BEFORE the run

Plan 22, [WALK_TICK.md § probe 5](../../doc/claude/WALK_TICK.md). The claim:

> *"One `walk_tick` serves all three drivers"* is one sentence too wide. **The page
> ticks where it is the AUTHORITY.** Attached, `st.cache` is a cache of the server's
> world, not the world; a page ticking its own walker would level its own copy and
> diverge silently from the authority that owns it.

The guard is one line — `src/editor_client.loft:3553`, `if st.local { author =
local_tick(…) }`. `T2` left it alone and wrote an ARGUMENT for it into the source
(`// ⚠ THE WALKER IS SEEDED HERE AND NOWHERE EARLIER … and it is probe 5's answer`).
This probe is the measurement that sentence has never had.

## What the instrument is, and why it is not a world key

The page cannot be asked for an md5 — it holds a *cache*, and a cache legitimately
differs from the world by what has not been streamed to it yet. What it can be asked
is the question it is already asked once a second: **`D:<cx>,<cz>,<li>,<crc>;…`**, the
server's digest of the visible set, answered by the page with **`41:agree N bad M
layers L`** and logged by the server as `editor: client cache agree N bad M layers L`.

That is a per-layer CRC comparison of the page's cache against the server's world,
computed by the page, carried on the wire, and written down on **the other side** —
the same non-circularity `auth.sh` had to learn when its first version read the
client's own claim about the client.

## The predictions

| | prediction | confidence |
|---|---|---|
| **P0** | the page attaches — the panel reaches `lavition editor — edits go to the server` | high |
| **P1** | the digest runs: `agree > 0` and `layers > 0` | high |
| **P2** | **control, as built: every answer says `bad 0`** | high |
| **P3** | attached, the page's own walker is idle — `0` steps, `walked 0` | **medium — see below** |
| **P4** | **sabotage `remotetick` (the `if st.local` dropped): `bad > 0`** | **medium — this is the one that can fail** |

**P3 is medium because nothing can currently print it.** The walker report at
`editor_client.loft:3596` is gated `if st.local`, with the comment *"Attached they
would be zero and meaningless"* — which is the claim under test asserted as the reason
not to look at it. The gate comes off as part of this probe.

## How P4 could come back green, i.e. how this probe could be blind

Written down first, because probe 4's whole lesson is that an equal pair of numbers is
also what a blind fixture produces.

1. ⚠ **Flat ground.** `level_on` is **never called on the page in remote mode** — the
   `l` key's attached branch flips `wk_levelling` and sends `6:1`, so `wk_level_h`
   keeps `walker_new`'s **0**. On ground already at 0 the stamp's `cur_h != level_h`
   is false at every cell and levelling correctly writes **nothing**. *This is probe
   4's blindness exactly*, so the fixture **raises ground first** — `probe/b2`'s `L`
   block had to learn the same thing.
2. **Too short a walk.** The stamp fires once per hex ENTERED. A walk that never
   leaves its starting hex stamps nothing. `probe/b2`'s `L` walk manages exactly one
   stamp over 60 `w` presses, which is thin margin; this fixture walks further.
3. **The server repairs it.** If the server re-sent the layers the page corrupted
   before the next digest, divergence would be transient. It should not: the server
   resends on ITS dirty chunks, and the page's private stamp does not dirty anything
   on the server.
4. **Out of the digest's window.** The digest covers the VISIBLE set. The page's
   unseeded walker sits at the origin, which is where the character starts, so the
   two windows should overlap — but if the raise walks the character away, they may
   not.

If P4 comes back green, **the answer is a second instrument or a different fixture,
never a looser reading of this one.**

## What this probe deliberately does not do

The sabotage is the **minimal** one: drop `if st.local` and nothing else. It does not
seed the page's walker from the server's pose, and it does not call `level_on` on the
page. That is on purpose — the design's warning is about the *elegant* version, *"now
every driver has a walker"*, which is a reader deleting a guard that looks redundant.
A sabotage that also built the missing seeding would be measuring a design nobody
proposed.
