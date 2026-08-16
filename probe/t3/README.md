# `T3` — the runner walks

Plan 22 `T3`, [WALK_TICK.md](../../doc/claude/WALK_TICK.md). `editor_run`'s `step <n>`
is exactly n `hex_editor::walk_tick` calls, `keys <bits>` holds the wire's own bits, and
the author every gesture is applied at is derived from the walker rather than from the
last teleport.

## ⛔ The design's own acceptance could not run at `T3`, and that is the first finding

WALK_TICK.md gives `T3` the surprise *"`deck.keys` headless == the server's md5"*. **It
cannot**: `deck.keys` says `send 6:1`, and performing `6:` LEVEL is `T4`. Read the other
way round, every walking fixture in `probe/t1/` levels — and probe 4 already recorded
why: **a walk that does not level writes nothing**, so no saved world can see one.

So `T3` needed an acceptance of its own, and it is the *other* half of what a walk does:
it POSITIONS. `walk_place.keys` walks 90 ticks and then places a house, which lands 9.6
wu from where an unwalked run would put it — world-visible, with no stamp anywhere.

## The acceptance: one script, two drivers, one world

    sh probe/t3/vs_server.sh probe/t3/walk_place.keys t3walk

| | |
|---|---|
| the server, through `probe/t1/run.sh` | `639586c2c98f95c1908a9a0e1de62481` |
| `editor_run` at `GROUND=0` | `639586c2c98f95c1908a9a0e1de62481` |

**Byte-identical on the first comparison ever run between these two drivers**, and both
say the same sentence word for word — *house placed 27 cells, 84 wall edges, ridge at
25, seated at 4 (2 from your feet, cut and fill 1)*.

⚠ **The instrument is not blind, and that is `run.sh` row A rather than a note here**:
the same script without its walk keys `41145:1729744006` against the walked
`16486:2825259848`, so the world can see where the person was standing.

⚠ **AND THE SERVER TICKED 92 TIMES FOR A SCRIPT THAT ASKS FOR 120.** Its own
acknowledgement reads `stepped to 92` after `step 90` — two ticks happened before `rate
0` arrived, during the connection burst. They are inert here (the walker holds no keys
and stands still, so only the fall runs and it writes nothing), which is *why* the
equality holds rather than an accident beside it. ⏭ A script whose first line wrote
something before `rate 0` landed would not have that protection, and nothing checks for
one.

## What `run.sh` holds, and what replaced what

`probe/k3e` is retired into this file. It held the FENCE — a `verb` after a movement
this runner had skipped was refused, because the author it would be applied at was
stale — and `T3` performs the movement, so there is nothing left to guard. *Move before
you remove*: three of its five rows are here in meaning, one inverted, one retired.

| row | claim | if it flips |
|---|---|---|
| A | a walk moves where a gesture LANDS | `step` produced no tick, or the author is still read off the last `at` |
| B | an `at` after a walk fixes the pose exactly | a teleport no longer overwrites the walker |
| C | `step` is exactly n ticks, and n is **additive** | a clock got in |
| D | the live corpus moves as predicted and no further | a walk that writes nothing has started writing something |
| E | `hold`/`turn` are refused, naming why | a feedback loop on a live pose is being faked |
| F | `feet` says where the person ENDED, and a fence makes that a claim | the instrument went back on the skip list, or the ring stops nobody |

### The sweep — `sh probe/t3/sabotage.sh`

**Seven sabotages, seven red, zero missed, control green.** Three of the seven are
design forks rather than typos: `noauthor` is the runner walking while still reading the
author off the last teleport — `K3e`'s world with the fence removed; `fakehold` is `hold`
as an exact feedback loop, right at `rate 1` and a divergence at `rate 0`; `onestep` is a
`step` that ticks once however many were asked for, which row A cannot tell from a
working walk and only row C's additivity can.

⚠ **The first pass was five red and two missed, and neither miss was the probe's.** One
was **the delimiter trap `probe/k3e`'s own sweep had written down** — a pattern
containing `||` ends an `s|…|` expression mid-word — repeated here anyway, and caught
only by the row's did-it-apply guard. The other was the sabotage's aim: `deadfeet`
replaced the first of `feet`'s two lines and left `at {x},{z}` live, so the two walks
still read differently and **row F was right to stay green**. *A miss is a question
about the edit before it is a question about the test.*

**Row C is the row this runner exists for.** The server cannot make that claim about
itself — its ticks are paced by a wall clock, and `T0` measured the world as a step
function of the count with `deck.keys` sitting one to two ticks above a cliff. Here
`step 45` twice and `step 90` are the same world, `16486:2825259848`, and `step 45`
alone is `24711:3149340082` — which is the control that stops the equality being
satisfied by a `step` that ignores its argument.

### The live corpus, measured across the step

| script | before `T3` | after | why |
|---|---|---|---|
| `determinism.keys` | `24727:4013804812` | **unmoved** | walks, levels nothing, then teleports |
| `fall.keys` | `16502:4136466525` | **unmoved** | the same shape |
| `cellar.keys` | `32920:1202181263` | **unmoved** | four walks, four teleports, still exactly 2 `send 6:` complaints |
| `deck.keys` | 3 complaints | **2** | the walk stopped being one of them; both remaining are `send 6:`, which is `T4` |

⚠ **Three scripts unmoved is a stronger row than it looks.** They are unmoved *because a
walk that does not level writes nothing* — `T0`'s finding about `determinism.keys` read
forwards — and not because anything was skipped. A single moved byte there would mean a
performed walk had started writing something nobody asked it to.

## ⛔ `hold` and `turn` are refused, and the reason is a measurement

Both are **feedback loops on a live pose**: `tools/script.mjs` sends `4:<bit>`, then
awaits ticks one at a time and reads the character's model matrix off the wire after
each, stopping when the distance covered or the angle accumulated passes what was asked.

**At `rate 0` they are no-ops on the server.** `nextT()` returns false when no tick
arrives inside its limit, and at `rate 0` no tick ever arrives unasked — so both loops
break on their first iteration and the whole command is `4:<bit>` followed by `4:0`. A
runner performing them as exact loops would walk where the driver it is compared against
stood still, and `T0` has just pinned every walking script to `rate 0`.

⚠ **And it costs nothing today, which is also measured**: `hold` and `turn` have **zero**
callers in the corpus. `tools/scripts/*.keys` and `probe/*/*.keys` say `keys` 32 times
between them and neither of these words once — `script.mjs`'s own comment already
records that it keeps them with no callers.

## ⛔ `feet` came off the skip list, because the reach question could not be asked

The runner copies the server's `COLL_R = 8` — a window the server sizes for **the
camera's boom**, which this program does not have. So: does a smaller one build a
different world?

| instrument | reach 8 | 4 | 2 | 1 |
|---|---|---|---|---|
| the saved world, walking free | `16486:2825259848` | same | same | same |
| the saved world, walking into a fence ring | `41161:3033020659` | same | same | same |
| **`feet`, into the ring** | **`0 at 4.32,2.5`** | same | same | same |
| `feet`, free | `0.6 at 8.32,4.8` | | | |

⚠ **The first two rows are blind and read exactly like the third.** A walk that meets
nothing cannot be changed by a collision window — probe 4's finding, one step later —
and adding a fence does not rescue the world, because **a ring changes the saved world
whether or not it stops anybody**: its own 42 cells are in there. Only where the walk
ENDED separates *the reach does not matter* from *this fixture cannot tell*.

`feet` was on the skip list, defended as *it only reads where the walker is*. That was
true and harmless until the walker moved. It is performed now, in `script.mjs`'s own
wording to the decimal, so one script's transcript reads the same through either driver
— and row F is what keeps it from being a thing built and never called.

## ⚠ The author's height changed, and no gesture can see it

`at` built its author with `hex_editor::author_on` — the CELL's stored height — and
builds one from the walker now, whose feet are `hex_mesh::ground_under`, interpolated
across the cell. `probe/t3/height.loft` asks how much that is worth:

    726 of 14641 samples over a raised cone differ, worst 0.166 wu at (5.2, 4)
    `fence`, `wall`, `stair_up` — the three verbs that read `au_y` — key the SAME
    world with 0.25 against 0.084 … and the same world a whole STOREY apart

So the two functions really do disagree, and **nothing in the vocabulary turns that
into a different world here**. The control is what says why that is not *the argument is
dead*: `au_y` chooses WHICH SURFACE you are standing on, and this fixture has exactly
one. ⏭ The world that could tell them apart is a deck over the ground, and nothing here
builds one.

`gesture.loft` already said what the difference is for — *a driver with no mesher cannot
do better* — so this was never a defect. It is the runner ceasing to be the coarse
driver, because `T3` gives it a mesher for the fall.

⚠ **Two instruments in that probe were blind before either row meant anything**: the
first compared strings with the height appended, so every row read `SEES it` over
identical worlds; and `stair` is not a verb — `stair_up`/`stair_down` are — so a refusal
that wrote nothing twice was about to be read as an equality. The `ak_ok`/`ak_n` check
in the loop is what caught the second, and it is why it is there.

## The files

| file | what it is |
|---|---|
| `run.sh` | rows A–E, runner-only, in `make fast` as `make probe-t3` |
| `sabotage.sh` | six sabotages and a control — three of them design forks, not typos |
| `vs_server.sh` | the acceptance: the same script through a native server and through the runner |
| `walk_place.keys` | the acceptance fixture — a walk the world can see with no levelling |
| `height.loft` | is the author's height really different, and can anything see it |
| `slope_at.keys` | the hand-built witness that failed to witness — kept as the record of it |
| `PREDICTION.md` | written before the code, so the measurements could contradict it. Two of four did |
