# `L1` — the recovery is a call; **the GESTURE's geometry is the defect**

**Run 2026-08-22.** Plan [24](../../plans/24-one-authority/README.md) `L1`.
Predictions in [PREDICTION.md](PREDICTION.md), written first.

```sh
make probe-l1
```

## ⛔ CORRECTION — the first version of this file was WRONG, and it was committed

It reported **0 of 24** and concluded *"our stamp is what the library cannot read"*, which moved
the phase to *replace `wall_stamp`*. **That conclusion was false.**

The bridge was wrong. It used `hex_editor::edges_around`, which is the **collision** bridge: it
calls `edge_block_surf` / `edge_block`, filling `EdgeSet`'s **surface** channel. `wall_read_run`
and `wall_chain_ends` read **`edge_mat`** — the **material** channel. So `eg_count` was a correct
`8` while `edge_mat` answered `0` everywhere, and the probe reported that our stamp could not be
read **when it had never been asked**.

⚠ **`ends = 0` IS WHAT MADE IT PLAUSIBLE**, because it reads identically as *a closed loop* and as
*nothing there*. The previous write-up flagged that ambiguity and declined to explain the shape —
and then drew a phase-level conclusion from the same number anyway. **Naming an instrument as
ambiguous is not the same as refusing to build on it.**

## The corrected result

| § | what | result |
|---|---|---|
| **1** | control — `wall_write` → bridge → `wall_read_run` | ✅ **24 of 24** |
| **2** | our `wall_stamp`, gesture-style geometry (any angle, any length, from a non-vertex) | ◐ **12 of 24** |
| **3** | our `wall_stamp`, **admissible** geometry (a real vertex, a legal `p`, a `d ∈ D`) | ✅ **24 of 24** |

**So the stamp is not the defect.** Give it geometry the lattice admits and every run reads back.
What the *gesture* chooses — an anchor wherever the author stands, a length wherever they stop, an
angle off a `2π/24` grid — is what cannot be read.

**`snap_run_d24` + `wall_snap_p` are the two missing calls**, and they are `H1`. The plan's
original ordering was right; the `S1` phase this probe invented is withdrawn.

## Predictions, scored against the corrected run

| # | prediction | verdict |
|---|---|---|
| **P1** | the control passes | ✅ 24 of 24 |
| **P2** | our stamp mostly does not recover | ◐ **half-right**: 12 of 24 with gesture geometry, but **24 of 24** once the geometry is admissible — so the cause is not the stamp |
| **P3** | the recoveries are the even `d24` | ⛔ refuted — nominal 0° and 60° fail, 15° and 30° succeed |
| **P4** | failures are `ok = false`, never a wrong direction | ⛔ **REFUTED, and this is the finding to keep** — see below |

## ⚠ `wall_read_run` can return a WRONG direction rather than refusing

In §2 our 15° wall reads back as **`d = 2`** (30°), and our 30° wall as `d = 2` as well. Both
report `ok = true`.

`wall_read_run` finds the chain's two **ends** and asks which `d24` step is exactly parallel to
the vector between them. **It does not check the path in between.** So a chain that wanders reads
back as whatever straight run its endpoints happen to describe.

⚠ **THAT IS `A0q`'S TELESCOPING FINDING, ONE LIBRARY OVER.** `surface_heading` sums edge vectors
and gets the chord; `wall_read_run` takes the ends and gets the chord. Both are exact about the
ends and blind to the middle, and both will answer confidently about a shape that is not a
straight wall.

**The consequence for the editor:** recovery is only trustworthy for a wall that was laid at a
`d ∈ D` from an admissible vertex. Reading back a wall drawn on our `2π/24` grid does not fail
loudly — **it returns a plausible wrong answer**, which is worse. `H1` is therefore not a tidy-up
ahead of `L1`; it is what makes `L1` sound at all.

⚠ **Worth raising with hexbody**: whether `wall_read_run` should verify the path, or document that
it answers *"what run do these ends describe"* rather than *"is this a run"*. `wall_chain_ends`
and `wall_chain_branches` exist and would catch a comb or a branch, but neither catches a bend.

## The real gap this found: there is no world→`EdgeSet` bridge for the material channel

`hex_voxel` keeps wall bytes in `StoredHex.sv_wall_*`; every `hex_*` linework function takes a
`hex_field::EdgeSet`. The only transcription in this tree is `edges_around`, which fills the
**surface** channel for collision. **Nothing fills the material channel**, so this probe had to
write one.

That is a genuine missing piece and it belongs somewhere shared, not re-written per probe — and
it is the fourth *second-implementation* this plan has turned up, after `HEADINGS` against `D`,
`wall_stamp` against `wall_write`, and our edge bytes against `EdgeSet` itself.

## Solid regardless

**`wall_stamp` writes every edge twice** — 16 writes for 8 distinct edges, confirmed against
`wall_of` scanning the world directly. Every `marked` count this tree prints is double.

## ⚠ Fixture errors: five, and this is the second to reach a commit

`(0,0)` as a run anchor · a direction vector where a target point was wanted · `surface_heading`
expected to see a notch · `ends = 0` read as a loop · **and this one, the wrong `EdgeSet`
channel.**

The first three were caught by a library refusing. The last two were not — both were **numbers
that were true and meant something else**. ⚠ **The lesson is not "read the docs harder": it is
that a control which passes tells you the instrument works *for the control's input*.** §1 passed
throughout, on an `EdgeSet` built by `wall_write` — which fills the material channel — so it could
never have caught a bridge that fills the surface one.
