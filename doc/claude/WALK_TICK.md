# The walk tick — one step of the person, wherever the person is

**A design, and three of its probes are already run.** Two of the three held; the third
changed the design, which is why it was run first.

> **The question that produced it.** `tools/scripts/deck.keys` cannot run through
> `editor_run`. Its subject is *level the ground while you walk* — the flat pad is
> drawn by **footfalls**, there is no *flatten this area* message anywhere in the
> protocol — and the headless runner has no clock and no walker. Plan 22 `K3e` made
> that refusal loud; this is what it would take to make it unnecessary.

| | |
|---|---|
| the drivers and their split | [PAGES_EDITOR.md](PAGES_EDITOR.md) — *one client, two authorities* |
| what a key means, and where | [EDITING_MODES.md](EDITING_MODES.md) |
| how the ground moves | [TERRAIN_EDITS.md](TERRAIN_EDITS.md) |
| the runner and its script | [SCRIPTED_EDITOR.md](SCRIPTED_EDITOR.md) |

---

## The invariant

> **One tick is a pure function of `(world, walker, held keys)` at a constant `dt`. A
> driver decides only WHEN it fires — never what it does.**

That is the whole claim. Everything below is either a consequence of it or a probe
against it.

⚠ **The constant `dt` is already law and already paid for.** `hex_editor::tick_dt()` is
`TICK_US / 1e6` with `TICK_US = 33000`, and the server's own comment records what it
cost to get there: integrating `steps * TICK_US` in one pass made *"a loaded box take
ONE tick that moved the walker as far as five, and the trajectory depended on the
machine."* `B1c.1` then gave the page **the server's fixed tick rather than its frame
time**, for the same reason. So the design is not introducing a fixed step — it is
noticing that two drivers already agreed on one and never shared the body.

## Where the invariant is re-asserted today, and that is the whole problem

**N = 2 when this was written, and omission is silent. `T1` and `T2` made it 1.**

| site | what it holds | lines |
|---|---|---|
| ✅ `lib/hex_editor/src/tick.loft` | **all of it, since `T1`** — turn → walk → level stamp → fall, and the proxy's key | — |
| ✅ `src/editor_server.loft` | one `Walker` and one `walk_tick` call. It kept its clock, its camera, its dirty set and its sentences | — |
| ✅ `src/editor_client.loft` | one `Walker` and one `walk_tick` call, since `T2`. It kept its accumulator and its redraw — **and it can level now**, which it never could | — |
| ✅ `src/editor_run.loft` | one `Walker` and one `walk_tick` call, since `T3`. It kept **no clock at all**: `step <n>` is the only thing in the program that can produce a tick | — |

Both existing sites call the *same* `hex_editor` primitives — `walk_dir`, `turn_dir`,
`yaw_turn`, `walk_step_len`, `walk_to`, `fall_step`, `edges_walk`. **What is written
twice is the sequencing and the cache policy**, which is exactly the half that decides
the world. And the divergence is already there and already shipped: **the page has no
levelling at all.** `editor_client.loft:2160` toggles `st.levelling` and sends `6:1`
over a wire; there is no `brush_level` anywhere in the file, so pressing `l` in local
mode levels nothing and reports success.

⛔ **So porting the tick into `editor_run` by copying would make N = 3**, and a third
copy of a sequencing rule whose second copy is *already* missing a clause is the
`Surface`-collision shape one layer up. **The design is `N = 1` or it is not worth
doing.**

## The shape

One new module, `lib/hex_editor/src/tick.loft`:

```loft
// Everything one tick reads and writes about the person. A driver OWNS one of
// these and hands it over; it does not reach inside between ticks.
pub struct Walker {
  wk_x: float, wk_z: float, wk_y: float, wk_vy: float, wk_yaw: float,
  wk_held: integer,                    // W=1 S=2 A=4 D=8 — the wire's own bits
  wk_levelling: boolean, wk_level_h: integer,
  wk_hq: integer, wk_hr: integer,      // last hex ENTERED — the level stamp's trigger
  wk_walked: float, wk_fell: integer,  // the gait and the landings, for reporting
  // the collision proxy, and it is a CACHE — see the probe below
  wk_coll: EdgeSet, wk_sf: Surfaces, wk_rt: Track,
  wk_cq: integer, wk_cr: integer, wk_ctau: integer, wk_csurf: integer, wk_chave: boolean,
}

// What a driver may need to REPORT. Never what it needs to decide.
pub struct TickOut {
  tk_moved: boolean,
  tk_dirty: boolean, tk_dq: integer, tk_dr: integer, tk_drad: integer,
}

pub fn walk_tick(wk: &Walker, w: VoxelWorld, sess: EditSession) -> TickOut
pub fn level_on(wk: &Walker, w: VoxelWorld)      // freeze the grade from the FEET
pub fn level_off(wk: &Walker)
```

⚠ **AND THE BUILT SIGNATURES DIFFER FROM THAT SKETCH IN THREE PLACES, EACH FOR A REASON
THE SKETCH DID NOT KNOW:**

```loft
pub fn walk_proxy(wk: Walker, w: VoxelWorld, runs: WallRuns,
                  reach: integer, step_max: integer) -> boolean
pub fn walk_tick(wk: Walker, w: VoxelWorld, runs: WallRuns,
                 reach: integer, step_max: integer, level_r: integer,
                 gnd: fn(float, float, float) -> float) -> TickOut
pub fn level_on(wk: Walker, w: VoxelWorld, residual: &float)
pub fn level_off(wk: Walker, gnd: fn(float, float, float) -> float)
```

1. ⚠ **The ground arrives as a FUNCTION.** The fall asks `hex_mesh::ground_under`, and
   **`hex_mesh` depends on `hex_editor`** — the cycle `walk.loft` recorded when the walk
   moved and left the fall behind for it. The driver hands in the sampler, the same seam
   `cliff_edges` takes its terrain by, and the library's tests then need no mesher at all.
2. ⚠ **`walk_proxy` is public and answers whether it REBUILT.** The server's camera keeps
   its own `edges_around` set over the *same* key, and the camera solves before the walk —
   so it calls `walk_proxy` at the top of the tick and refreshes its set on the answer.
   `walk_tick` calls it again and finds the key unchanged: **idempotent by construction**,
   because nothing between the two calls moves the walker or writes the world. That is what
   keeps the key in one place instead of beside every set derived from it.
3. ⚠ **`runs: WallRuns`, not `sess: EditSession`.** A tick needs the wall runs and nothing
   else a session carries, and `edges_walk` already takes them that way.

And each driver keeps only the thing that is genuinely its own — **when a tick fires**:

| driver | what makes a tick fire | what it does with `TickOut` |
|---|---|---|
| `editor_server` | the wall clock at `sim_rate`, or `sim_pending` when `rate 0` | `mark_dirty`, broadcast, camera |
| the page, **local only** | its own accumulator, in fixed steps | re-mesh the dirty disc |
| `editor_run` | **`step <n>` and nothing else — no wall clock, ever** (`T3`, built) | nothing |

⚠ **THE RUNNER GETS NO WALL CLOCK, AND THAT IS THE SHARPEST LINE IN THIS DESIGN.**
`editor_run`'s entire value is that its answer is a function of the script and of
nothing else. A real-time clock would buy it a walk and cost it the one property the
server does not have. `step n` means **exactly n ticks**; `rate` stays skipped.

---

## The probes — three run, three to run

### ✅ Probe 1 — does the server's own `deck.keys` reproduce? **It does.**

Two full server runs, fresh world each, world saved at the end:

    cea971a07899e420b344c0054567f4e1   run A
    cea971a07899e420b344c0054567f4e1   run B

### ✅ Probe 2 — is that instrument blind? **No.** A shorter walk moves it.

`step 45` → `5775ad1d…`, against `step 90` → `cea971a0…`. The save can see the walk,
so probe 1's match means something. *(An equal md5 is the same sentence a blind
instrument produces, which is why this row exists.)*

### ⛔ Probe 3 — is the world stable under tick jitter? **NO, and it changed the design.**

The one that mattered. `step n` under the default rate is *paced by the wall clock*, so
the number of walking ticks is `90` plus whatever `keys 1`'s `sleep(60)` and the `4:0`
round-trip add. If the world varied over that jitter, **byte-equality with the server
would be an unachievable acceptance test** and this design would need a different one.

Measured, exact stepping at `rate 0`, one run per tick count:

| walking ticks | world |
|---|---|
| 86 | `3e7ef3b5f47649025b54ccac77244af4` |
| 88 | `3e7ef3b5f47649025b54ccac77244af4` |
| **90** | `cea971a07899e420b344c0054567f4e1` |
| 92 | `cea971a07899e420b344c0054567f4e1` |
| 94 | `cea971a07899e420b344c0054567f4e1` |
| 98 | `cea971a07899e420b344c0054567f4e1` |

**The world is a STEP FUNCTION of the tick count**, and `deck.keys` sits **one to two
ticks above a cliff**: the boundary is in `88 < n ≤ 90`, and the plateau above it is at
least nine ticks wide. It is reproducible today only because the jitter is
**one-directional** — every source of it *adds* ticks, so the run drifts up into the
wide plateau and never down over the edge.

⚠ **That is a live fragility in a gate, found by designing something else.**
`tools/gates/world/deck_soffit.mjs` is a thin wrapper on `tools/script.mjs
tools/scripts/deck.keys`, so it was resting on ~1 tick of margin on the side that has
none. (`tools/gates/character/deck.mjs` shares the name and not the script — it builds
its own scene and only mentions `cellar.keys` in a comment.)

✅ **And the same probe supplies the cure and the acceptance test.** At `rate 0` the walk
is exactly 90 ticks **by construction** — `may_tick = sim_pending > 0`, so the `sleep(60)`
produces no ticks at all — and two `rate 0` runs land on `cea971a0…`, the same plateau
the default rate happens to reach. So:

> **Acceptance: `deck.keys` at `rate 0`, through `editor_run` at `GROUND=0`, saves a
> world byte-identical to the same script at `rate 0` through the server.**
> Today that is `cea971a07899e420b344c0054567f4e1`.

Exact, reproducible on any box, and **the target side already exists** — which is the
whole reason to prefer it to any claim about the design reading correctly.

### ✅ Probe 4 — is the collision proxy really a cache? **It is — and the obvious instrument said so while blind.**

`walk_to` is given an `EdgeSet` rebuilt on `(hex, τ, surface)`. The claim was that
rebuilding it more often cannot change the answer. Run as designed — rebuild every tick,
compare the `deck` world — it came back `cea971a0…`, unmoved.

⛔ **AND THE CONTROL SAID THE SAME THING, WHICH IS WHAT MADE THE GREEN WORTHLESS.**
Building the proxy **once and never refreshing it** — a sabotage that should ruin a walk
— also returned `cea971a0…`. Nothing in `deck.keys` blocks: no wall, no fence, and its
cliffs are never met, so *the proxy cannot reach the world in that script at all*. A pair
of identical md5s meant **this fixture cannot tell**, and reading the first one as an
answer would have put a measured claim in the design that was never measured.

✅ **The instrument that can see it is `probe/t1/coll_pad.keys`**, and it took two goes:

| | feet | world |
|---|---|---|
| the cache as designed | 6.05 | `b8d2ef6f…` |
| rebuilt **every** tick | 6.05 | `b8d2ef6f…` — the proxy is a cache |
| built once, **never** refreshed | **9.60** | `6a66ef59…` — walked straight through the fence |

⚠ **The first version of that fixture was blind too, for a different reason.** A fence on
flat ground stops the walk — `feet 6.05` against `9.60` — and the world still cannot see
it: levelling writes nothing where the ground already matches the frozen height, so the
run saved **0 chunks**. It needs a fence AND ground that differs, which is why the file
raises a hill first. *Two blind instruments before one that answers* is the cost of asking
a question of a script that was written for something else.

### ⏭ Probe 5 — the cleanest claim, and the one to attack

*"One `walk_tick` serves all three drivers."* The honest place it is false is the
**page in REMOTE mode**. `st.cache` is a *cache of the server's world* there, not the
world; a page ticking its own walker would level its own copy and diverge silently from
the authority that owns it. So the rule is not *the page ticks* but **the page ticks
where it is the authority**, which is `B1b.1a`'s distinction doing work it was not
built for. Falsification: drive a walk through a page attached to a real server and
compare its world against the server's.

⚠ **This is the case the elegant version absorbs and should not.** *"Now every driver
has a walker"* is one sentence too wide: `editor_run` must not get a clock, and a remote
page must not get a tick.

⛔ **BUILT, RUN, AND BLOCKED BY THE TOOLCHAIN — 2026-08-17.** The harness is
[probe/t5/](../../probe/t5/README.md): two pages, two live servers, control against
sabotage, with the prediction written first. **It answers nothing yet**, because the
page cannot attach — the `--html` build made by the loft installed 2026-08-16 23:08
traps with `RuntimeError: unreachable` the moment it has a part thumbnail to build
([loft#950](https://github.com/loft-lang/loft/issues/950)). ⚠ **And the run it did
produce must not be read as an answer**: every row is red and the transcript says *the
page never attached*, which is a fact about the page and not about the guard.

⚠ **THE INSTRUMENT IS THE DIGEST, NOT A WORLD KEY**, and that is the design decision
worth keeping. A page holds a *cache*, which legitimately differs from the world by
whatever has not streamed to it — so an md5 comparison would be meaningless either
way. The server already asks the right question once a second (`D:`), the page already
answers it (`41:agree N bad M layers L`), and **the server writes the answer down**,
which puts the evidence on the far side of the wire from the thing under test.

⚠ **AND TWO INSTRUMENTS HAD TO BE BUILT, BOTH OF WHICH EXISTED AS SENTENCES ARGUING
THEY WERE UNNECESSARY.** The walker report was gated `if st.local` because *"attached
they would be zero and meaningless"* — the claim under test as the reason not to look
at it; it now prints an attached line asserting idleness. And `wk_held` prints once
every 300 frames while a driven key is held for 120 ms, so *the keys were asked* was
invisible — `held_seen` is a high-water mark, because **a walker nobody asked to move
proves nothing about a walker that refused to.**

⛔ **THE BLOCKER IS ALSO THE MORE USEFUL FINDING: nothing in `make fast` builds the
page.** The toolchain swap was cleared by a green re-check — 157 test files, layering,
`walk-exact`, three probes — and **not one of them drives a browser**. `make probe-demo`
and `make probe-auth` are the two that do, and both sit outside the fast loop. See
[STATE.md](STATE.md).

### ⏭ Probe 6 — is `mark_dirty` reporting, or effect?

The level stamp dirties a disc of `LEVEL_R = 5`. If `TickOut` cannot carry enough for
the page to re-mesh exactly that disc, the page draws stale ground and the split is
wrong. Falsification: level in local mode and read the page's own surface line.

---

## The steps, each able to go red on its own

| step | what it does | what would surprise it |
|---|---|---|
| ✅ **`T0`** | the scripts that walk say `rate 0`, and `tools/walk-exact.sh` keeps it true | **DONE 2026-08-16.** `deck.keys` and `cellar.keys` converted, worlds unchanged (`cea971a0…`, `c96b2ce7…`), `deck_soffit` / `cellar_ceiling` / `deck` all PASS. ⛔ **`determinism.keys` was NOT converted and that is the finding** — see below. ⛔ **And the speedup I predicted is refuted**: 19.9 s without, 22.5 s with, 26.6 s in a parallel run — `rate 0` buys exactness, not time |
| ✅ **`T1`** | `Walker` + `walk_tick` in `hex_editor`; **the server is its only caller** | **DONE 2026-08-16.** Both worlds byte-identical — `cea971a0…` and `c96b2ce7…` — `make fast` 157 files green, `make gate` unmoved, `lib/hex_editor/tests/tick.loft` 15 tests with 7 of 8 sabotages red. The server is **89 lines smaller** and the level stamp left the streaming block. ⛔ **Probe 4 is answered and `deck.keys` could not have answered it** — see below |
| ✅ **`T2`** | the page calls `walk_tick`; `local_walk`/`local_fall` **deleted** | **DONE 2026-08-16.** `make probe-demo` G/H unmoved — `walked 2.4539695841635853`, world `32920:1885399240`, 23 landings — and **levelling works in local mode**, checked by a new `L` block with a `nolevel` control. ⛔ `LEVEL_R` moved into the library on the way: the page was about to declare its own |
| ✅ **`T3`** | `editor_run`'s `step <n>` becomes n ticks; `keys` is **performed**, `hold`/`turn` are **refused** | **DONE 2026-08-17.** One script through both drivers, byte-identical on the first comparison ever run between them — `639586c2c98f95c1908a9a0e1de62481` — `make fast` green over 157 files, `probe/k3e` retired into `probe/t3` with its rows moved. ⛔ **Its acceptance as written here could not run, and that is the finding** — see below |
| ✅ **`T4`** | `send 6:` becomes a performed message, like `ground` | **DONE 2026-08-17.** ⛔ **`deck.keys` headless is `cea971a07899e420b344c0054567f4e1`** — the server's own world, to the byte, with no server, no socket, no browser and no clock — and `cellar.keys` is `c96b2ce7a569fa2dd88577a71a507f48`. ⚠ And `step 45` lands on `5775ad1d45a35ef966bb22c60e016795`, which is the number `probe/t1` recorded for the SERVER at that count: **the two drivers agree at a second tick count, not just at one** |

⚠ **`T1` before `T2` before `T3` is not taste.** Each step's comparison exists only
because the step before it left a proven artifact to compare against — `T1` against the
server's own world, `T2` against the demo's recorded numbers, `T3` against `T1`'s
output. Reordered, the middle two have nothing exact to be measured by, which is the
failure `W4` was reverted for.

## ✅ What `T4` turned up (2026-08-17) — the acceptance, hit exactly, and what it cost

`send 6:` LEVEL is two library calls and two sentences in `run_send`: `level_on` freezes
the grade from the FEET and answers the residual it quantised away, `level_off` puts them
back on the ground, and **the stamp itself is inside `walk_tick` where a footfall reaches
it**. That split is `T1`'s, and it is why this step is small enough to be a step at all.

> `deck.keys` through `editor_run` at `GROUND=0`:
> **`cea971a07899e420b344c0054567f4e1`** — the server's own world, byte for byte.
> `cellar.keys`: **`c96b2ce7a569fa2dd88577a71a507f48`**, with its five `feet` stations.

⚠ **AND `step 45` LANDS ON `5775ad1d45a35ef966bb22c60e016795`, WHICH IS THE NUMBER
`probe/t1` RECORDED FOR THE SERVER.** That row was written as a blindness control — *does
a shorter walk move the world at all* — and it answers a second question nobody asked:
the two drivers agree at **two** tick counts, so the equality is about the walk rather
than about one lucky plateau.

### What the controls are for, and why two constants alone would not do

`probe/t4` rows A and B compare against md5s a **native server** produced, recorded in
[probe/t1/README.md](../../probe/t1/README.md). A constant compared against a program
that writes nothing is satisfied the day the world stops being written, so:

- **row C** shortens the walk — `5775ad1d…`, so the fixture can see the walk;
- **row D** removes both `send 6:` lines — `89cf1a3b…`, so the pad really is the
  levelling's and not the raise's or the storey's. ⛔ **This is the control probe 4
  earned**: `deck.keys` answers `cea971a0…` to three different collision-proxy policies
  because nothing in it blocks, and the one thing it CAN see is the stamp.

### What it cost elsewhere, which is the part to check before believing it

`deck.keys` and `cellar.keys` had exited **101** since `K3c` refused their `send 6:`, and
both run clean now. Two probes encoded that refusal as a claim:

- `probe/k3c`'s `AUTHORS` list loses its two `:6` entries — what remains is `47` WATER,
  `10` ROAD and four `44` PART, every one still genuinely beyond this driver;
- `probe/t3` row D flips from *2 complaints each* to *0*, and keeps asserting the COUNT
  rather than the exit code, because a runner that stopped counting bad lines would exit
  0 for every script in the tree.

⚠ **Neither row evaporated.** They moved to `probe/t4` A, B and E, where the claim is
strictly stronger than a refusal: not *this driver declines* but *this driver builds the
server's world*.

### ⛔ And the sweep found three green rows sitting over an untested clause

`level_off` does two things — it clears the mode **and** puts the feet back on the
ground — and dropping the second left **both acceptance worlds byte-identical, and all
five of `cellar.keys`'s `feet` stations unmoved.** Two reasons, both about what levelling
*is*: levelling brings the ground **to** the feet, so where a walk has just levelled the
release is a no-op; and every `feet` in `cellar.keys` follows a **teleport**, which
re-reads the ground itself.

So `probe/t4` has a row F and a fixture of its own — freeze on the flat, teleport onto a
hill, release — where the two heights differ and nothing has re-read them: `feet 0.084`
against `feet 0`, *standing inside the hill and saying so calmly*. **The defect that
clause exists for is written down at `tick.loft` and nothing tested it until a sabotage
asked.** Four red, zero missed, after that.

### ⚠ `feet` agrees with the server by VALUE, and the comment claiming otherwise is fixed

`script.mjs` pads — `toFixed(3)`, `toFixed(2)` — so `cellar.keys` reads `feet 4.250 at
17.00,0.00` there and `feet 4.25 at 17,0` here. Measured against a native server, all
five stations agree to every digit either side prints. The runner's comment said *the
sentence is `script.mjs`'s, to the decimal*, which was written before anyone compared
the two; it now says what is true, which is that a transcript is comparable by value and
not by `diff`.

## ✅ What `T3` turned up (2026-08-17) — a step whose acceptance could not run at it

`src/editor_run.loft` holds one `hex_editor::Walker`. `step <n>` is exactly n
`walk_tick` calls and is the only thing in the program that can produce one; `keys
<bits>` holds the wire's own bits; `at` and the wire's `7:` PLACE move the walker; and
the author every gesture is applied at is `author_at` off that walker. The `walked`
fence is deleted, `probe/k3e` is retired into `probe/t3`, and `make fast` is green over
157 files. Everything is in [probe/t3/README.md](../../probe/t3/README.md).

### ⛔ The acceptance in the table above cannot be run at `T3`, and nothing said so

*"`deck.keys` headless == the server's md5"* — and `deck.keys` says `send 6:1`, which is
`T4`'s message. It is not a slip in one row: **every walking fixture in `probe/t1/`
levels**, because probe 4 had already established that *a walk which does not level
writes nothing*. There is no world-visible walk without a stamp, so no acceptance built
on a saved world could have belonged to this step.

What `T3` gets instead is the OTHER half of what a walk does — **it positions**. A
`verb` after 90 ticks lands 9.6 wu from where an unwalked run puts it, which needs no
stamp anywhere. That is `K3e`'s own predicate asked as a measurement rather than as a
refusal, and it is exact:

> **`probe/t3/walk_place.keys` through a native server and through `editor_run` at
> `GROUND=0`: `639586c2c98f95c1908a9a0e1de62481` both ways**, with the gesture's
> sentence matching word for word.

⚠ **Byte-identical on the FIRST comparison ever run between these two drivers**, which
was not the prediction — `probe/t3/PREDICTION.md` expected it to fail and named four
candidate residues. Two of its four calls are refuted.

### ⚠ The server ticked 92 times for a script that asks for 120

`stepped to 92` after `step 90`, at `rate 0`: two ticks land during the connection burst
before `rate 0` arrives. They are **inert** — nobody is holding a key, so only the fall
runs and it writes nothing — and that is *why* the equality holds rather than a detail
beside it. ⏭ A script that wrote something before its `rate 0` landed would have no such
protection, and nothing checks for one.

### ⛔ `hold` and `turn` are refused, and the reason is a measurement rather than a taste

The step table said *performed*. They cannot be: both are **feedback loops on a live
pose** — `script.mjs` sends `4:<bit>`, then awaits ticks one at a time and reads the
character's model matrix off the wire after each — and **at `rate 0` they are no-ops on
the server**, because `nextT()` returns false when no tick arrives and at `rate 0` none
arrives unasked. `T0` has just pinned every walking script to `rate 0`. So a runner
performing them as exact loops would walk where the driver it is compared against stood
still: *faking them manufactures the divergence this whole design exists to close.*

⚠ **And it costs nothing, which is also measured**: `hold` and `turn` have **zero**
callers across `tools/scripts/*.keys` and `probe/*/*.keys`, which say `keys` 32 times
between them. `script.mjs`'s own comment already recorded that it keeps them with no
callers.

### ⛔ `feet` was on the skip list, and the reach question could not be asked without it

Asked whether the collision proxy's window matters — the runner copies the server's
`COLL_R = 8`, a number the server sizes for a **camera this program does not have** —
the saved world answers *no* at reach 8, 4, 2 and 1. ⚠ **And it answers exactly the same
to a walk that never met anything**, which is probe 4 arriving one step later. Adding a
fence ring did not rescue it either: a ring changes the world whether or not it stops
anybody, because its own 42 cells are in there.

Where the walk ENDED is the only instrument that can tell those apart, and `feet` was
skipped as *it only reads where the walker is* — harmless until the walker moved.
Performed, it settles it in one line: the fence stops the walk at `4.32,2.5` against
`8.32,4.8` free, **at every reach from 8 down to 1**.

### ⚠ The author's height changed, three verbs read it, and none of them can see it

`at` built its author with `author_on` — the CELL's stored height — where the server
builds one from the walker's feet (`ground_under`, interpolated). `probe/t3/height.loft`
priced it: the two differ at **726 of 14641** samples over a raised cone, worst **0.166
wu** — and `fence`, `wall` and `stair_up`, the only verbs that read `au_y`, key the same
world either way. ⚠ **The control is what makes that mean something: a whole STOREY
apart does not move them either**, because `au_y` chooses which SURFACE you stand on and
the fixture has one. So this is the runner ceasing to be the coarse driver — which
`gesture.loft` already named as the difference's purpose — and not a defect closed. ⏭
The world that could tell them apart is a deck over the ground.

### And the sabotage sweep missed two, for two different reasons

Seven sabotages, five red on the first pass. **One miss was the delimiter trap
`probe/k3e`'s own sweep had already written down** — a pattern containing `||` ends an
`s|…|` expression mid-word — repeated verbatim here, and caught only by the row's
did-it-apply guard rather than by having read the warning. **The other was the sweep's
aim and not the probe's blindness**: `deadfeet` replaced the first of `feet`'s two lines
and left `at {x},{z}` live, so the two walks still read differently and row F was right
to stay green. *A miss is a question about the edit before it is a question about the
test.*

## ✅ What `T2` turned up (2026-08-16) — the key that did nothing and said it had

`src/editor_client.loft` holds one `hex_editor::Walker` and calls `walk_tick`;
`local_walk` and `local_fall` are deleted, and the turn is inside the tick with them.
`make probe-demo` is green with its recorded numbers unmoved — the house at
`32920:1885399240`, the fall completing **23** and **24** times over two runs against a
flat-ground control of 0.

⚠ **AND `walked` IS A THREE-VALUED NUMBER, WHICH IS WHY "UNMOVED" HAD TO BE READ
CAREFULLY.** Two runs of the same six presses gave `2.4539695841635853` and
`2.2405809246710997` — both members of the set STATE.md already records for this
fixture (*2.2406, 2.3473, 2.4540*), because a key press covers 3 OR 4 fixed steps
depending on where the frame boundary falls. A reader who took the design table's
`walked 2.454` for a pin would have called the second run a regression. The stable
numbers here are the WORLD KEY and the landing count, and those are what the rows read.

### ⛔ `l` in local mode flipped a flag, sent nothing, wrote nothing, and reported success

The page had no `brush_level` anywhere in it. The key toggled `st.levelling` and called
`wire`, which in local mode **sends nothing by design** — so an author levelling on
their own page walked over ground that never moved, and got a sentence for it. That is
the divergence this design was written about, found by reading rather than by any check,
and it survived because *the mode being on* and *the mode working* print the same thing.

✅ **It works now, and it is checked by two instruments with a control.**
`probe/b2/run.sh`'s new `L` block:

    L1 the page took the key and froze a grade: local level on at height 0 …
    L2 the stamp FIRED 1 time(s) while walking — the clause this page never had
    L3 …and the STORE moved: 16502:2452530279 against 16502:374721773 unlevelled

⚠ **The COUNT and the WORLD KEY are two claims, not one.** A page that levelled flat
ground would print a count and an unchanged key — and *that* is the state a first
version of this row was in, because on ground already at the frozen height
`cur_h != level_h` is false at every cell and levelling correctly writes **nothing**.
The `L` walk raises ground first for the same reason `H` does. `DEMO_SABOTAGE=nolevel`
reds all three rows; its subject is the WIRING, and the stamp's own falsification is
`lib/hex_editor/tests/tick.loft`.

### ⛔ `LEVEL_R` was a driver's constant, and the second driver was about to declare one

The stamp's radius was `const LEVEL_R = 5` in `src/editor_server.loft`. The page needed
it the moment it started levelling — and **two drivers with two radii write two
different pads from one walk**, which is the exact class this whole design closes. It is
`hex_editor::LEVEL_R` now: *the disc is what levelling MEANS; when it fires is the
driver's*. Found by writing `LOCAL_LEVEL_R` and stopping.

### ✅ Probe 6 — is `mark_dirty` reporting, or effect? **Reporting, and it is sufficient**

`TickOut` carries `tk_dq`, `tk_dr`, `tk_drad`, which is exactly the disc. The page
redraws its whole neighbourhood anyway — 338,688 floats — **because `local_surfaces`
takes a neighbourhood and not a disc**, which is a limit of the page's mesher rather
than of the report. Worth stating precisely: the split is right, and the cheap version
is a mesher change.

### ⏭ Probe 5 is NOT run, and the guard it is about was not weakened

*A page in REMOTE mode must not tick.* The guard is one line — `if st.local { author =
local_tick(…) }` — and `T2` left it alone. What `T2` adds is that the walker is **seeded
only on the frame the authority moves**, beside `local_restore`, so an attached page's
walker never holds a pose at all.

⚠ **That is an argument, not a measurement.** The falsification the design asks for —
drive a walk through a page attached to a REAL server and compare its world against the
server's — needs a harness that `probe/b2` deliberately does not have (its listener is
`static.mjs --ws-silent`, a socket that never answers). It stays open, and it is the
first thing `T3` should not assume.

## ✅ What `T1` turned up (2026-08-16) — three instruments were blind before one answered

`lib/hex_editor/src/tick.loft` holds `Walker`, `TickOut`, `walk_proxy`, `walk_tick`,
`level_on` and `level_off`. The server declares one `hex_editor::Walker` and its 266
references to `px`/`pz`/`py`/`vy`/`yaw`/`keys`/`walked`/`levelling`/`level_h` are that
walker's fields; the turn, the walk, the level stamp and the fall are **one library
call**. Both acceptance worlds are byte-identical, `make fast` is green over 157 files,
`make gate` is unmoved, and `src/editor_server.loft` is **89 lines shorter**.

### ⛔ A sabotage that leaves the world identical is not a green — it can be a blind fixture

Probe 4 above is the long version. In one line: **`deck.keys` answers `cea971a0…` to the
cache policy, to rebuilding every tick, and to never rebuilding at all.** The question
needed a walk something can block AND ground the level stamp actually writes; neither of
the first two fixtures had both.

### ⛔ And the SABOTAGE SWEEP said the same thing about four of the new tests

Eight sabotages of `tick.loft`, each with the control green. The first pass came back
**four red, four green**, and the four green ones are what the sweep is for:

| sabotage | first pass | why it could not be seen |
|---|---|---|
| the proxy key loses `τ` | green | the test WALKED, so the **cell** term rebuilt anyway. A fence blocks a hex EDGE, so meeting one always changes cell — `τ` can only be seen by a walker standing still while the world changes elsewhere |
| the stamp fires every tick | green | **and it stays green, on purpose.** The stamp SETS its disc, so a second firing finds the ground already there. Once-per-hex is a COST property; the load-bearing clause is `cur_h != level_h`, which is what the test asks now |
| the fall runs while levelling | green | ⚠ **the test repaired its own subject** — its first tick ENTERS the hex, the level stamp fires, and the stamp puts back exactly the ground the walker was about to fall into. Entering the hex before cutting the ground is the whole fixture |
| levelling does not hold the feet in the walk | green | the walker held no keys, so the walk branch never ran |

Rewritten, seven of eight go red. The second row is left green **with its reason written
down**, because a sabotage that is genuinely equivalent is a finding and not a gap.

### ⚠ A golden world cannot see a sentence

The 266-site rename was applied to the code half of every line — and it reached inside
string literals. The editor printed `editor: wk.wk_levelling off — feet back on the
ground at 0` while the `deck` world came back **byte-identical**, because the md5 is of
the store and a sentence is not in it. Four sentences were corrupted; the exact
comparison that this whole step rests on was blind to all four. *What the instrument
measures is what it can see, and a rename touches more than the world.*

### The level stamp left the streaming block, and one behaviour moved with it

It sat in the chunk-streaming pass for one reason: `last_hq`/`last_hr` lived there. It is
the walker's now, which changes exactly one case — **an `at` teleport into a new cell
while levelling stamped a pad on arrival with no tick at all; the tick after it does.**
`cellar.keys` is the measurement rather than the argument: four teleports with levelling
ON, five `feet` stations, and `c96b2ce7a569fa2dd88577a71a507f48` either way.

### ⚠ One substitution was made on purpose, and it was checked rather than assumed

The server converted feet to height units with `hex_proj::HEIGHT_SCALE`; `tick.loft` uses
**`w.w_unit`**, the world's own. That is `walk.loft`'s stated rule — *the global is wrong
on a part world* — and it is a change of expression, so it had to be shown to be no
change of behaviour. Measured: every world the walker can walk in here is authored at
0.25, including the parts (`src/part_build.loft` and `src/prop_build.loft` both declare
`W_UNIT = 0.25`), so the two agree everywhere today and the library's version is the one
that survives a world that does not.

### What `T1` deliberately did NOT do

- ⏭ **The page is untouched.** `local_turn`/`local_walk`/`local_fall` are still there and
  still have no levelling. That is `T2`, and it is a step precisely because the page's
  comparison is `make probe-demo`'s recorded numbers rather than a world file.
- ⏭ **The runner still teleports.** `T3`.
- ⏭ **`tk_clamped` / `tk_residual` / `tk_owed` are reported and untested.** The stamp
  reports them, the server says them, and no test yet builds a world where levelling
  cannot deliver what it was asked. It is a fixture, not a design question.

## ✅ What `T0` turned up (2026-08-16) — the clock-independence check that could not see the clock-dependence

`deck.keys` and `cellar.keys` say `rate 0` now, both worlds byte-unchanged, and
`tools/walk-exact.sh` is in `make fast` so a new walking script cannot quietly leave the
tick count to the box.

### ⛔ `determinism.keys` claims exactly this property, has never been asked, and could not have answered

Its header: *"Run this at rate 1 and at rate 0 and the two world files must be
byte-identical — that is what 'reproducible even with clocks that change speed' means,
and it is the property every golden image rests on."* It ends in a `save` written for
that comparison.

**Nothing performs it.** Its gate list is empty; `probe/k2` retired with `K3b`. Performed
by hand for the first time on 2026-08-16 — `23d3f79779eb8177a6353e169d07f9ab` both ways,
so the claim holds.

⛔ **And it holds for a reason that makes the script blind to its own subject.** Its only
walk is `keys 1 / step 90 / keys 0` — the same 90 ticks `deck.keys` walks — followed by
`at -3 -3 0`. A teleport overwrites the walker outright, so **the walk contributes
nothing its saved world can see.** The one case where a clock *does* reach the world is
the case the clock-independence script does not contain. *A guard that works in one
direction reads exactly like a guard* — the third time this tree has written that
sentence, after `faced_between` and `stroke_over_limit`.

✅ **So it is deliberately left at no rate**, because it is the control: a script pinned
to `rate 0` can no longer be run at both. What replaces the missing coverage is the
rule, not a second copy of the file.

### The rule, and why it is not a list of filenames

`tools/layering.sh` skipped every `moros_*` package for months — the one check written to
catch a mis-homed package exempted the packages that were mis-homed. So `walk-exact` asks
a question of each script instead: **can the world see where this walk ended?** Two ways,
either one demanding `rate 0`:

1. the walk **writes** — a movement while `6:` LEVEL, `10:` ROAD or `47:` WATER is on
2. the walk **positions** — a `verb` after a movement with no `at` between, which is
   `K3e`'s predicate asked of the file rather than of the run

✅ **The exemption then falls out of the rule.** `determinism.keys` is not flagged because
it says `at` afterwards — no name is written down anywhere, so nothing is exempt by
accident.

### The cliff is the walk's LENGTH, not levelling

| script | arm | plateau, exact stepping | margin |
|---|---|---|---|
| `cellar.keys` | `step 25` = 2.67 wu, **inside** `LEVEL_R`'s radius-5 disc | 23 = 25 = 27 (5 ≠, 60 ≠ — the control) | ≥2 ticks each side |
| `deck.keys` | `step 90` = 9.60 wu, well beyond it | 86 = 88 ≠ **90** = 92 = 94 = 98 | ≤2 ticks on the low side |

Two more ticks inside the brush disc reach no new hex; two more at 9.6 wu cross a cell
boundary. **A long walk is where the clock gets into the world.**

### ⛔ And the speedup was predicted, measured and refuted

`deck.keys` spends 300 ticks = 9.9 s of wall clock at rate 1, so `rate 0` looked like it
should pay for itself. Measured on `deck_soffit`, same tree, same gate: **19.9 s without,
22.5 s with**, against 26.6 s for the same gate inside a three-gate run. The run-to-run
spread is larger than the effect. ⚠ `CLAUDE.md`'s own rule, on a box shared with other
agents' work: *a wall clock measures the machine.* The claim is dropped rather than
softened.

### ⏭ What `T0` does NOT cover

- ⏭ **Pictures.** The rule asks what the *world* can see. A camera script's frame
  thresholds also move with the tick count — `fall.keys` already says `rate 0` for
  exactly that reason — and nothing here checks it.
- ⏭ **`determinism.keys` is still run by nobody.** Performing its comparison standingly
  is `K3d`'s shape, not this step's, and it is now one of the named gaps rather than an
  assumption.

## What this design does NOT claim

- ⏭ **It does not make `editor_run` a server.** No camera, no proxy timing, no HUD, no
  broadcast, no clock. One function and a step count.
- ⛔ **It does not decide whether `hold <dir> <wu>` is worth performing** — and `T3`
  decided, the other way from the sentence that used to stand here. *"The runner could
  do the same exactly"* is false at `rate 0`, which is where every walking script now
  lives: `script.mjs`'s loop awaits a tick that never comes and the command becomes a
  no-op on the server. Refused, with zero callers to pay for it.
- ⏭ **It says nothing about the ROAD.** `10:` ROAD is refused by `K3c` for the same
  reason `6:` LEVEL is, and it is the same shape — but it is a second stamp with its own
  settle rule (`slope_settle`), and folding it in before the level one is measured is
  the over-reach this document exists to avoid.
- ✅ **EVERY STEP IS BUILT — `T0` through `T4`** — and probes 4 and 6 are run. The
  acceptance holds: `deck.keys` headless is the server's world to the byte. **Probe 5 is
  not run** — *a page in REMOTE mode must not tick* — and it is now the only unmeasured
  claim in the design: the guard is one line that `T2` did not weaken, which is an
  argument and not a measurement.
