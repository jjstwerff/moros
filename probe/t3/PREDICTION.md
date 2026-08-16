# `T3` — written BEFORE the code, so the measurement could contradict it

Plan 22 `T3`. The claim: `editor_run`'s `step <n>` becomes exactly n `walk_tick`s, and
the walk moves the datum every gesture reads.

**Two of the four predictions below are refuted, and the two that held both needed a
second instrument before they meant anything.** The scoreboard is the point of the file:
a design note that only records what turned out right is a design note nobody can
calibrate against.

## ⛔ The design's own acceptance cannot run at `T3`, and that is the first finding

WALK_TICK.md's step table gives `T3` the surprise *"`deck.keys` headless == the server's
md5"*. **It cannot**: `deck.keys` says `send 6:1`, and making `6:` a performed message
is `T4`. Read the other way, every walking fixture in `probe/t1/` levels — and probe 4
already recorded why: **a walk that does not level writes nothing**, so the world cannot
see it. There is no world-visible walk without a stamp.

So `T3` needs an acceptance of its own, and the honest one is the OTHER half of what a
walk does: it POSITIONS. A `verb` after a walk lands 9.6 wu from where an unwalked one
would, which is world-visible with no levelling anywhere.

*(Held. It is why `probe/t3/walk_place.keys` exists.)*

## The prediction, in order of what I expected to be wrong

### 1 ⛔ REFUTED — "the author's height will move every existing script"

`at` built its author with `author_on` (the CELL's stored height) where the server builds
one from its walker (`ground_under`, interpolated). I expected a runner-vs-server
comparison that had never been run to have been failing on this alone.

**Nothing moved.** `determinism`, `fall` and `cellar` are byte-identical across the step,
and so is a slope fixture built on purpose to catch it. `probe/t3/height.loft` says why
that is not luck: the two functions *do* differ — 726 of 14641 samples over a raised
cone, worst **0.166 wu** — and `fence`, `wall` and `stair_up`, the only verbs that read
`au_y`, key the same world either way, **and the same world a whole STOREY apart**.
`au_y` chooses which SURFACE you stand on, and there is one.

⏭ So it is the runner ceasing to be the coarse driver, not a defect closed. The world
that could tell them apart is a deck over the ground, and nothing here builds one.

### 2 ✅ HELD — "`hold` and `turn` must be refused, not faked"

Measured from `tools/script.mjs`: both are feedback loops that await a tick, and
`nextT()` returns false on timeout — so **at `rate 0` they produce no ticks and are
no-ops on the server**. A runner performing them as exact loops would walk where the
driver it is compared against stood still, and `T0` has just pinned every walking script
to `rate 0`. And it costs nothing: **zero** callers in the corpus, `keys` 32 times.

### 3 ✅ HELD — "the proxy reach cannot reach the world; 8 and 2 agree"

⚠ **And the first instrument was blind, which is the part worth keeping.** Asked of the
saved world, reach 8, 4, 2 and 1 all key `16486:2825259848` — on a fixture with nothing
in the way, which is `probe/t1`'s probe 4 exactly. Adding a fence ring did not fix it: a
ring changes the world whether or not it stops anybody, because its own 42 cells are in
there.

**The answer needed `feet`**, which this runner skipped. Performed, it says the fence
stops the walk at `4.32,2.5` against `8.32,4.8` free — *and stops it there at reach 8, 4,
2 and 1 alike*. So the prediction holds, and it took the third instrument to say so.

### 4 ⛔ REFUTED — "the first runner-vs-server comparison will not match"

`639586c2c98f95c1908a9a0e1de62481` both ways, on the first run, with the gesture's
sentence matching word for word. ⚠ The one thing that did surprise: the server reports
`stepped to 92` for a 90-tick walk — two ticks land before `rate 0` arrives, during the
connection burst. They are inert (nobody is holding a key, so only the fall runs and it
writes nothing), which is *why* the equality holds rather than an accident beside it.
⏭ A script that wrote something before its `rate 0` landed would not have that
protection, and nothing checks for one.
