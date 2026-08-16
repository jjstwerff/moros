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

**N = 2, and omission is silent.**

| site | what it holds | lines |
|---|---|---|
| `src/editor_server.loft` | turn → walk → level-hold → fall, the per-hex level stamp, the collision-proxy refresh | ~6440–6910 |
| `src/editor_client.loft` | `local_turn`, `local_walk`, `local_fall` — the same library calls, sequenced again | ~1755–1880 |
| `src/editor_run.loft` | **nothing.** It teleports | — |

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

And each driver keeps only the thing that is genuinely its own — **when a tick fires**:

| driver | what makes a tick fire | what it does with `TickOut` |
|---|---|---|
| `editor_server` | the wall clock at `sim_rate`, or `sim_pending` when `rate 0` | `mark_dirty`, broadcast, camera |
| the page, **local only** | its own accumulator, in fixed steps | re-mesh the dirty disc |
| `editor_run` | **`step <n>` and nothing else — no wall clock, ever** | nothing |

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

⚠ **That is a live fragility in a gate, found by designing something else.** `deck` is
`tools/gates/character/deck.mjs` and it is resting on ~1 tick of margin on the side that
has none.

✅ **And the same probe supplies the cure and the acceptance test.** At `rate 0` the walk
is exactly 90 ticks **by construction** — `may_tick = sim_pending > 0`, so the `sleep(60)`
produces no ticks at all — and two `rate 0` runs land on `cea971a0…`, the same plateau
the default rate happens to reach. So:

> **Acceptance: `deck.keys` at `rate 0`, through `editor_run` at `GROUND=0`, saves a
> world byte-identical to the same script at `rate 0` through the server.**
> Today that is `cea971a07899e420b344c0054567f4e1`.

Exact, reproducible on any box, and **the target side already exists** — which is the
whole reason to prefer it to any claim about the design reading correctly.

### ⏭ Probe 4 — is the collision proxy really a cache?

`walk_to` is given an `EdgeSet` rebuilt on `(hex, τ, surface)`. Both drivers already
key it identically, so the design folds it into `Walker`. **The claim is that it cannot
change the answer.** Cheapest falsification: rebuild it *every* tick and compare the
`deck` world. If it moves, it is not a cache and it does not belong in the struct.

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

### ⏭ Probe 6 — is `mark_dirty` reporting, or effect?

The level stamp dirties a disc of `LEVEL_R = 5`. If `TickOut` cannot carry enough for
the page to re-mesh exactly that disc, the page draws stale ground and the split is
wrong. Falsification: level in local mode and read the page's own surface line.

---

## The steps, each able to go red on its own

| step | what it does | what would surprise it |
|---|---|---|
| **`T0`** | the scripts that walk say `rate 0` | ⚠ **independent of everything below, and worth doing whatever happens to this design.** The `deck` gate stops resting on one tick. Verify: the gate's world is `cea971a0…` and `step 88` still differs — the cliff must stay visible, or the check went blind rather than stable |
| **`T1`** | `Walker` + `walk_tick` in `hex_editor`; **the server is its only caller** | the `deck` world at `rate 0` must be **byte-identical**, and `make gate` unmoved. A pure extraction whose comparison is exact — the upper bound satisfied, and it can fail on its own |
| **`T2`** | the page calls `walk_tick`; `local_turn`/`local_walk`/`local_fall` **deleted** | `make probe-demo` G/H unmoved (`walked 2.454`, the fall completing) — **and levelling starts working in local mode**, which is a capability the page never had. ⚠ Remote mode must NOT tick (probe 5) |
| **`T3`** | `editor_run`'s `step <n>` becomes n ticks; `keys`/`hold`/`turn` are **performed** | `deck.keys` headless == the server's md5. ⚠ **This retires `K3e`** — there is no skipped movement left to remember. **Move before you remove**: the `walked` fence and `probe/k3e` come out only once the equality holds, never before |
| **`T4`** | `send 6:` becomes a performed message, like `ground` | `K3c`'s `send_why` loses a row. The runner's floor and the server's must agree, which is `probe/k3c` row D's shape one message over |

⚠ **`T1` before `T2` before `T3` is not taste.** Each step's comparison exists only
because the step before it left a proven artifact to compare against — `T1` against the
server's own world, `T2` against the demo's recorded numbers, `T3` against `T1`'s
output. Reordered, the middle two have nothing exact to be measured by, which is the
failure `W4` was reverted for.

## What this design does NOT claim

- ⏭ **It does not make `editor_run` a server.** No camera, no proxy timing, no HUD, no
  broadcast, no clock. One function and a step count.
- ⏭ **It does not decide whether `hold <dir> <wu>` is worth performing.** `script.mjs`
  implements it as a feedback loop on the pose; the runner could do the same exactly,
  and nothing here needs it.
- ⏭ **It says nothing about the ROAD.** `10:` ROAD is refused by `K3c` for the same
  reason `6:` LEVEL is, and it is the same shape — but it is a second stamp with its own
  settle rule (`slope_settle`), and folding it in before the level one is measured is
  the over-reach this document exists to avoid.
- ⏭ **It has not been built.** Probes 1–3 are run; 4, 5 and 6 are not, and probe 5 is
  the one most likely to move the design again.
