# K3d — what does every live script build, and would anything say if it stopped?

```
sh probe/k3d/run.sh               every script in tools/scripts/, against its baseline
K3D_BLESS=1 sh probe/k3d/run.sh   re-record the baselines, on purpose, diff shown first
sh probe/k3d/sabotage.sh          seven sabotages, a declared blind spot, and a control
make probe-k3d                    the same thing, and it is in `make fast`
```

Plan 22 [`K3d`](../../plans/22-pages-client/README.md). `K3b` deleted the `key <K>`
spelling from both readers and `probe/k2` went with it, because its instrument was a
diff against the other spelling — and `probe/k2`'s whole reason for existing was that
ten of these scripts are driven by **nobody** automatically.

**Measured before anything was built.** `make gate` names `cache`, `indoors`, `cellar`,
`clientmesh` and `deck`; `tools/walk-exact.sh` reads two more as *files* rather than
running them; `probe/k3c`, `probe/t3` and `probe/t4` name a handful for their own
reasons. Grepping every check in the tree for each of the 30 script names:

> **fourteen of the thirty are RUN by nothing** — `annex`, `ceiling`, `door`,
> `embrasure`, `face`, `fall`, `furnish`, `hut`, `lamp`, `niche`, `opening`, `profiles`,
> `seat`, `wall`.

⚠ **Named and run are different, and the difference is the whole finding.** Eight of
those fourteen *are* named somewhere — in a doc, in a plan, in the journal, in a comment
inside a loft test (`lib/hex_editor/tests/session.loft` opens its annex section with
*"`annex.keys` — what an annex hangs on"*), or in another script's prose. Nothing
executes them. A grep for the name finds a paper trail and reads exactly like coverage.

The row that created this debt listed ten. It was stale in both directions: `house`,
`determinism` and `slab` had picked up checks since, and five scripts nobody had listed
were in the same position.

## ⛔ The obvious baseline is the saved world, and it would have been blind

Every live script through `editor_run` at `GROUND=0`, keyed by the md5 of the world it
saves:

```
a7da870fc0b92932dd190d41d54e94a2   cache, slab, doorparts, doorway
e397cea36adab92b47998129e64522d5   ceiling, cutaway, eyes, floorprobe, indoors, lamp
3d1381a74509bf4caf7ba144041a140b   clientmesh, fall
d527c6f7a6633da785bddf6c3df46705   door, opening
```

**`slab.keys`, whose entire subject is a floor with a thickness, keys the world a bare
`verb raise` keys.** It is not broken — it prints
`a slab 2 units thick at 0,6 — ceiling 10, floor above 12, clear 10` and its session
says `slabs 1 holes 1`. A slab is a **session record**, like a prop or a seat, and not a
store write. So:

| deleted from a live script | the saved world | the session digest |
|---|---|---|
| one `verb run` from `wall.keys` | `59abe82b…` → `712bceee…` | `runs 5` → `runs 4` |
| `verb hole` from `slab.keys` | **`a7da870f…` — identical** | `holes 1` → `holes 0` |

That second row is why the record is a **pair**, and why the sweep sabotages each half
separately.

**How far the blindness goes was measured too, and it is narrower than the guess.** One
gesture deleted from each of four more scripts whose worlds are all distinct:

| script | gesture deleted | the saved world | the session digest |
|---|---|---|---|
| `annex` | its last `verb seat` | **identical** | `props 2` → `props 1` |
| `furnish` | its last `verb seat` | **identical** | `props 2` → `props 1` |
| `niche` | its third `verb opening` | `8a5286ca…` → `c4d56adc…` | `openings 3` → `openings 2` |
| `seat` | `verb place` | `ee319fa0…` → `f898e202…` | `runs 8` → `runs 4` |

So the world is blind in exactly the places a **session registry** carries the result —
`slabs`, `holes`, `props` — and sees an opening or a house perfectly well, because those
write cells. ⚠ **Two of the four were guessed wrong before they were run:** `niche` and
`seat` were expected to be blind and are not, and `seat.keys` does not press `verb seat`
at all — its subject is a house being *seated* on a slope. A name is not a claim.

## ⚠ And the session digest is counts, not geometry

`slabs 1 holes 1` says nothing about the height the slab landed at, and `openings 2`
nothing about a window's spring or depth. The **gestures' own printed sentences** are
the only place those numbers appear, so the record keeps them:

```
  wall laid 20 edges, heading 0 of 24 (snapped, residual 0°), length 8
  house placed 27 cells, 84 wall edges, ridge at 21, seated at 0 (0 from your feet, …)
  opening kind 2 at 3,0 half 0.65 band 0..11 spring 7 depth 0..1
```

This is a live regression class, not a hypothetical: three handlers were found passing a
global height scale where the world's own unit belongs (plan 22 `K3`'s `J`, `E` and `B`
rows) and every one was a **wrong number inside a correct-looking sentence**.

⚠ **The record drops the `--- ` echoes** — a script's own comment played back is the
script's *input*, and an instrument that reads its input can be surprised by nothing.

⚠ **And it drops the script's line count**, which `editor_run` prints beside τ. These
scripts are documentation as much as fixtures; a baseline that goes red when somebody
adds a comment gets blessed reflexively, and a check that is blessed without being read
is not a check. τ, the chunk count, the save code, rc, the world, the session, the
sentences and the refusals are all behaviour. The line count is prose.

## Row D — `K3c`'s collision finding, made permanent

`K3c` found six scripts keying one world and wrote *the drop had been visible as a
collision the whole time and nobody had looked*. Row D computes the groups **from the
run**, every run, and asserts them against a committed list:

| group | what it means |
|---|---|
| `ceiling cutaway eyes floorprobe indoors lamp` | a house on flat ground, and then nothing the store or the session can see |
| `cache doorparts doorway` | `doorparts` and `doorway` are refused at their first `send 44:` — part mode is beyond this driver ([`probe/k3c`](../k3c/run.sh) row A) — so what they build is `cache`'s prefix, at `rc 101` where `cache` is at 0 |
| `clientmesh fall` | `fall` walks and falls with no authoring mode on, so the world cannot see the walk ([`walk-exact.sh`](../../tools/walk-exact.sh) explains which walks it can) |
| `door opening` | the same wall and the same two openings, photographed from two stations |

So *thirty scripts have a baseline* can never be read as *thirty subjects are covered*.

## ⛔ The hole this probe does NOT fill, and it is measured rather than promised

The first group is the one to read. Those six scripts spend every line after the house
on `send 40:` modes, `send 3:` looks, `snap` and `frame` — so all six leave the same
world **and** the same session, to the byte. Row A still separates them, but only by the
stations the author stood at.

**Only one of the six has a check that can see a camera**, and the other five split two
ways — the distinction matters, so it is spelled out rather than rounded off:

| script | what runs it, before this probe | what that check asserts |
|---|---|---|
| `indoors` | [`camera_indoors.mjs`](../../tools/gates/world/camera_indoors.mjs) | the pictures — `cam` bands and `frame` thresholds. A real check of the subject |
| `cutaway`, `eyes`, `floorprobe` | [`probe/k3c`](../k3c/run.sh) row B | **`rc = 0`, and nothing else.** They are that row's *control* — a script of only quiet ids must still run — so its verdict is that they did not fail, never what they drew |
| `ceiling`, `lamp` | nothing at all | — |

**No headless baseline can be their check**: their subject needs a server and a browser.

⚠ **The sweep's `blindcam` row is that sentence made falsifiable.** It changes CUTAWAY
to FOLLOW in `cutaway.keys` — the whole subject of the script — and requires this probe
to stay **green**. A coverage claim that is only argued gets believed; one that is
scored is a measurement.

## The sweep

`sh probe/k3d/sabotage.sh` — seven aimed at a row, one that must stay green, one control.

**8 red, 0 missed, the blind spot green, the control green.**

| row | what it does | what went red |
|---|---|---|
| `nopress` | `verb place` deleted from `house.keys` | **A** — 17 lines of `house`'s record. `K3d`'s own acceptance, on a live file rather than a derived fixture |
| `noselect` | `select 2` → `select 1` in `door.keys` | **A** (6 lines) **and D** — the `K1` claim, and the world is blind to it: `open_ahead` writes `DOOR_MAT` whatever the profile |
| `saysentence` | the slab's reported thickness becomes a literal | **A on `slab` alone**, 2 lines, with the world and the session unmoved — the third instrument working on its own |
| `newscript` | a script added with no baseline | **B**, and A names it too |
| `basedamaged` | a baseline's `md5:` line cut out | **A** — see below |
| `basegone` | the baseline file deleted outright | **B** |
| `twinscript` | `embrasure.keys` becomes a copy of `door.keys` | **D**, and A on `embrasure` (35 lines) — a new group, arriving quietly |
| `deadctl` | row C1's fixture stops deleting anything | **C1** — aimed at the probe, because a fixture comparing a file with itself is green forever |
| `blindcam` | CUTAWAY → FOLLOW in `cutaway.keys` | nothing — **green is the pass**, the declared blind spot |
| control | nothing | nothing |

⚠ **`noselect` reds row D as well, and that is D working in the direction nobody
designs for.** `door` and `opening` are a known identical pair; changing one of them
makes the pair *stop existing*, and a coverage report that only noticed new collisions
would have let the group list rot into a description of a corpus that had moved on.

⚠ **Two rows were mislabelled until the sweep ran, and the sweep's output is the record
of what was checked.** `basedamaged` and `basegone` were written as one `B` row for *a
baseline file removed* — but a **mutilated** baseline is a diff, so it reds **A**, and
only a **missing** file reaches B's set comparison. They are two rows with two names now.
`deadctl`'s message had the same shape of fault in the probe itself: the branch fires
either when `wall.keys` loses its `verb run` line or when the fixture's `awk` stops
matching, and it blamed only the script — which would have sent the next reader to the
wrong file.

⚠ **The sweep costs about fifteen minutes, and one row is nearly all of it.**
`saysentence` edits `lib/hex_editor/src/say.loft`, so each of that row's thirty runs
recompiles the library. The other eight rows are ~20 s each.

⚠ **Row 0 caught itself.** The subject-present guard was written with anchors and
`grep -qF`, so six of its seven patterns read as absent — `-F` takes `^verb place$`
literally — and the sweep **refused to run** over a tree where every anchor was there.
It failed safe, which is the direction to fail in, and it is `CLAUDE.md`'s *a grep is an
instrument whose default answer is absent*, one layer inside a guard written for that
rule. The anchors are fixed strings now; each row's own did-it-apply guard holds the
precise line.

## What this probe does not claim

- **It runs no server and opens no socket**, so it says nothing about what the SERVER
  builds from the same script. [`probe/t4`](../t4/README.md) is where that comparison
  lives, for the two scripts whose worlds have been measured through both drivers.
- **It cannot see a camera, a light or a picture** — see the hole above.
- **It baselines at `GROUND=0`**: *start where the editor starts*, `editor_run`'s own
  words, and the setting under which `deck` and `cellar` equal the server byte for byte.
  The default seeds a photographable patch and would key a different world for every
  script in the corpus.
- **A green row is not a claim that the script is right**, only that it builds what it
  built when the baseline was blessed. The baselines were recorded on 2026-08-17 from a
  tree whose gates were green; they are a ratchet, not a verdict.
