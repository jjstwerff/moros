# STATE.md — where the editor work stands (2026-08-20)

**A handoff, and short on purpose.** Where the work stands, what was decided, what is open —
read it first after a break.

| | |
|---|---|
| the durable *architecture* | [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) |
| the *changes* | the tracker — `gh issue list -R jjstwerff/moros --label plan --state all` |
| the *order of work* | [EDITOR_LADDER.md § The order of work](EDITOR_LADDER.md#the-order-of-work) |
| **how it got here** | **[JOURNAL.md](JOURNAL.md)** — eighteen sessions, newest first |

✅ **AND THE SESSIONS BELOW ARE IN THE JOURNAL NOW — backfilled 2026-08-21.** 2026-08-12 …
08-19 existed only here, which is why sections describing a *moment* are still in the file a
reader is told to open first. They are [JOURNAL.md](JOURNAL.md) Sessions 20–26 now, so
**cutting them from here loses nothing** — the next reader who finds this file too long
should start there. ⚠ Those journal entries are reconstructions *from this file*, so anything
this file had already thinned is gone rather than recoverable; what is here is the fuller
copy until someone cuts it.

⚠ **This file was 2,446 lines**, which made the one document a reader is told to open the
longest in the tree, with the current state buried in session logs. The record moved to
JOURNAL.md unthinned; what stays here is what is true **now**. ⚠ **The per-STEP record belongs
to the plan** — `plans/<n>-<name>/README.md` carries a *What `Ax.y` turned up* section written
when the step landed, and this file duplicating it is how it grows back.

> **We are building the universal hex-world editor.** Moros is one consumer of it, not the
> product. loft's `GOALS.md` names the editor as one of four layers; crawler, bumper
> airplanes and loft's Workbench are the other consumers. See
> [EDITOR_SUBSTRATE.md § Why this exists](EDITOR_SUBSTRATE.md).


## ⚠ WHERE IT LANDED — 2026-08-20

**`lavition_ui` 0.1.0 is PUBLISHED**, which closes @PLN145 `D0` — the only phase of that
plan that was ever ours. Tag `lavition_ui-v0.1.0` → `2692bfd` on `jjstwerff/moros`, a
GitHub release carrying the tarball, and [loft-lang/registry#24](https://github.com/loft-lang/registry/pull/24)
open (+19/−0) awaiting a maintainer. sha `ea646e67…`, 38 236 bytes, no deps.

⚠ **A FOREIGN-PACKAGE ENTRY — the source stays here.** The loft side argued against
their own repo: moving it into `loft-libs-graphics` beside `stage`/`text2d`/`tween`
would hand a library to a repo whose CI cannot exercise it, which is this tree's
promotion rule running backwards. `repository = "jjstwerff/moros"` in the manifest is
what makes `loft package` emit the right tag and URL.

⚠ **THE NAME IS NOW PERMANENT.** `lavition_ui` is a brand prefix against the
no-brand-prefix rule for lavition packages, and the user confirmed it on 2026-08-20
knowing a published name cannot be renamed.

⛔ **PR #24's CI WILL BE RED AND IT IS NOT OURS.** `tools/validate.py` fails gate 1 on
untouched `main` — `zttext` and `fixstep` both carry `"categories": []`, confirmed
independently by the loft side over the live index. Our entry raises no validator error.

### The panel had no click, and that was a live defect rather than a gap

`panel_hit_test` had been tested green since plan 18 with **no caller**, so every press
fell through to the look-drag: clicking a catalogue row turned the camera under a person
whose eyes were on the panel — the exact thing the rebind path already refuses. It is
wired now, and a click on a part row chooses it through the *same* commit path the `h`
key uses (`commit_part_pick`).

⚠ **THE RULE MOVED TO `hex_editor::pointer_step`.** *A press that begins on a UI surface
stays that surface's until it is released* is a state machine over four booleans and
needs no browser — it was costing a 7 MB wasm rebuild per question. Sixteen states swept
headless; the client is the caller. ⚠ `on_ui` is a **boolean, not a `UiHit`**, so
`hex_editor` does not gain a `lavition_ui` dependency to learn nothing.

⚠ **AND THE GATE I WROTE FOR IT COULD NOT FAIL.** It compared line numbers across the
driver's stdout and the page's console — two streams that are never interleaved — so it
reported `ok` against the shipped defect restored. Rewritten as counts inside one stream:
**1 look-drag sabotaged, 0 fixed.**

### Seven of `probe/b2`'s blocks are answered headless now

`H F Q G R B L` run as scripts in `make fast` (`probe/headless/`), seconds instead of a
browser. **Every one of those blocks stays** — move before you remove: the browser keeps
the claim no script can make, that pressing a KEY reaches a verb, because `editor_run`
speaks verbs and held-key bits and skips the keymap layer.

⛔ **NEVER ASSERT THE VALUE OF A PER-TICK COUNTER.** `landed` counts ticks in a state, so
it measures the driver's sampling: at an identical walked distance the browser says
**34** and a held-key script says **28** — and replaying the distance as moving-then-idle
pulses says 34 exactly. `> 0`, never `-eq`. A world KEY is what was emitted.

### The loop is cheaper, and one guard is deliberate

| | before | now |
|---|---|---|
| one gate block | 16 browser boots | `DEMO_ONLY=P` — that block plus the core |
| `make client`, nothing changed | ~5 min wasm compile | `Nothing to be done` |
| try a gesture | no path but the full probe | `make press K='#part'` |

⛔ **`DEMO_ONLY` CANNOT PRINT `demo PASS`** — it prints `demo PARTIAL PASS` and names
what did not run, on the failure path too. A selector that prints the same verdict as a
whole run is how somebody checks one block and believes they checked the tier.
⚠ **`page-check` still FORCES the client rebuild** (`client-force`): the staleness it
guards is a TOOLCHAIN swap, which changes no source file and is invisible to `make`.

### `use self::` on all 129 of them

Every package's own modules, tree-wide — 129 lines, 39 files, 7 packages;
`tools/basenames.sh` drops from 71 module claims to 23. Nothing was red and that is the
point: no stranger can make the second claim later, and `lavition_ui` now lives in graphs
where strangers do, holding `panel`, `font`, `widgets` and `render`.

⚠ **`use self::x;` AND `x::fn()` ARE MUTUALLY EXCLUSIVE** — neither the bare qualifier nor
`self::x::fn()` parses, so *always write `use self::`* is unachievable for any file that
qualifies. Two sites dropped the qualifier instead;
[loft#1043](https://github.com/loft-lang/loft/issues/1043), and it is in loft's own
`LIBRARY_AUTHORING.md` §2a2 now.

### Filed, and two already fixed

| | | |
|---|---|---|
| [#1042](https://github.com/loft-lang/loft/issues/1042) | admission printed `allowed libraries: []` for a profile that was never defined | ✅ fixed |
| [#1043](https://github.com/loft-lang/loft/issues/1043) | no qualified spelling for a `self::`-bound module | ✅ fixed |
| [#1045](https://github.com/loft-lang/loft/issues/1045) | the registry index and its `.sig` are not swapped atomically | ⛔ fix unmerged — **re-run is the workaround**, see [LOFT_HANDOFF.md](LOFT_HANDOFF.md) |

## ✅ loft#950 IS FIXED UPSTREAM — and it is NOT live here until the binary is installed

**Confirmed end to end from this side, 2026-08-18.** The `--html` client built with loft's
`tuxedo-work-957` binary of 09:36 renders: `local thumbnails — 49 meshes for 20 parts`,
20 thumbnails, 300 frames, and **zero trap lines** — no `unreachable`, no `RuntimeError`,
no store guard. ⚠ **And it is not merely *did not crash*:** the page produces
`world 16502:374721773`, which is the world the `B2`/`B3` row recorded on 2026-08-13
when the demo last worked. Same world, to the key.

**The cause was theirs to find and they found it in one row.** `LOFT_VAR_TABLE` showed the
loop binding `wc` marked `def OWNS` where it should carry `deps=[_vector_1(11)]`; scope
exit then freed it, and its `DbRef` carried `st`'s `store_nr`, which is how the `Client`
store died. ✅ **Isolated to the binary here by a controlled pair** — one tree, same
function, same `ref(3029)`, only the compiler changed: the 16 Aug build says `OWNS`, their
09:36 build says `deps=[…]`. Nothing on our side was altered to fix it.

⛔ **AND THERE ARE TWO LOFT BINARIES ON THIS BOX, THEY REPORT THE SAME VERSION, AND
`make` DOES NOT USE THE ONE THIS TREE'S DOCS NAME.**

| | built | `--version` | used by `make`? |
|---|---|---|---|
| `~/.local/bin/loft` | **2026-08-18 11:45** | `loft 2026.8.0` | ✅ **yes** — first on `PATH` |
| `/usr/local/bin/loft` | 2026-08-16 23:08 | `loft 2026.8.0` | ❌ no |

The Makefile says `LOFT ?= loft`, so every target resolves through **`PATH`**, and `PATH`
answers `~/.local/bin/loft`. ⚠ **`--version` cannot tell them apart** — both say
`loft 2026.8.0`, which is the same trap that let a toolchain swap go unnoticed on
2026-08-16. **`ls -la $(which loft)` is the instrument; the version string is not.**

⚠ **AND THIS FILE SAID THE WRONG THING AN HOUR AGO.** It read *"`/usr/local/bin/loft` is
the 16 Aug binary, so `make client` produces the trapping page"*. The conclusion happened
to be true — the rebuild did produce the broken page — but the REASON was wrong, and a
reason that is wrong for a true conclusion is the kind that survives. `make` never
consulted `/usr/local/bin/loft` at all. ⚠ [CLAUDE.md](../../CLAUDE.md) still says to
verify against *"the installed `/usr/local/bin/loft`, which is moros's own toolchain"* —
**that is no longer what the build uses**, and the two now differ by loft#950's fix.

✅ **THE USER INSTALL CARRIES THE FIX — measured, not assumed.** `LOFT_VAR_TABLE` on one
tree: `~/.local/bin/loft` gives `wc … deps=[_vector_1(11)]` where the 16 Aug build gives
`def OWNS`. Same function, same `ref(3029)`, only the compiler changed. ⏭ What that is
worth to the five browser gates, to `make probe-demo`/`probe-auth` and to the PICTURE
that `D2a.2`, `D2c` and `E1` each recorded as unverified is **being measured now** and is
not yet claimed here.

⚠ **A size change nobody has explained**: the same source is **7910 KB** on the old binary
and **7434 KB** on the new one — 476 KB smaller. Raised on the issue; do not assume it is
only the lifetime fix.

## ⚠ THE TOOLCHAIN MOVED AGAIN — 2026-08-19, and it is a TIGHTENING rather than a regression

`~/.local/bin/loft` was rebuilt **19 Aug 20:29** (the 18 Aug build this file recorded is
gone). ⚠ **`--version` still cannot tell any of them apart** — all say `loft 2026.8.0`;
the hashes do: `cebf52d0…` user-level against `3c7a117f…` system.

⚠ **AND IT MOVED AGAIN MID-SESSION — 21:15, `98262fdb…`.** Three builds in one day, one
version string, no announcement: the checks run before ~21:15 measured `cebf52d0…` and
everything after measured `98262fdb…`, both green. **Record the hash, never the date and
never the version** — a date is stale by the next build and the version was never a
handle at all. ⚠ A benign consequence spotted in passing: `loft test` stopped counting
`main` in its totals, so a suite that read 13 reads 11 with every row present. **A test
count that drops is a toolchain question before it is a coverage question.**

⚠ **AND TWICE MORE ON 2026-08-20 — five builds in two days, one version string.**
`f253821f…` at 14:49, then `0332a1bc…` at 22:44, the second announced by the loft side
before it landed. **Everything current is measured on `0332a1bc…`**: `make fast`, the
full browser tier, and `lavition_ui`'s gate.

⚠ **VERIFY A SWAP BEHAVIOURALLY, NEVER BY THE VERSION STRING.** All five answer
`loft 2026.8.0`. The 22:44 build is identified by two things it can do and its
predecessor cannot: `"héllo".char_slice(0, 4)` → `héll`, and `std::Format.NotExists`
resolving in value position ([loft#1039](https://github.com/loft-lang/loft/issues/1039)).

⛔ **AND THE FIRST `make fast` AFTER A SWAP CAN BE RED FOR NOTHING.** It died on
`registry index signature INVALID — refusing to install`, un-bypassable even with
`--allow-unsigned`; the identical re-run passed with nothing changed. The index and its
signature had been rewritten mid-run. **Re-run before diagnosing** —
[loft#1045](https://github.com/loft-lang/loft/issues/1045), fix unmerged, and *doesn't
verify against any known key* is the sentence a tampered index produces, so the wrong
next move is trust roots.

⏭ **`text.char_slice` IS THE CURE FOR `font.loft`'s TWO UNITS AND IS DELIBERATELY NOT
TAKEN.** It needs this toolchain, and raising `lavition_ui`'s `loft = ">="` floor on a
first release would cost every consumer an upgrade to fix nothing they can observe. The
hand-rolled `byte_after_chars` ships with 0.1.0; the swap is recorded in that package's
manifest for the next time the floor moves for an independent reason.

⛔ **AND `loft verify-self` CANNOT VERIFY EITHER OF THEM, AND EXITS 0 SAYING SO.** Both
installs answer *"not a release bundle — nothing to check against"* with **rc 0**. For a
command whose stated job is *detects corruption and partial upgrades*, `verified intact`
and `could not verify anything` are the same answer —
[loft#1012](https://github.com/loft-lang/loft/issues/1012), filed with `audit`'s graded
exit codes as the precedent. **Use `ls -la` and `sha256sum`; the version string and the
exit code both lie by omission.**

✅ **FIXED — measured 2026-08-20 on the build installed 14:49.** `verify-self` on a
non-bundle install now exits **2**; the same sentence on the older binary exits 0. The
controlled pair is one command over two binaries. **The `sha256sum` half of the advice
stands regardless** — the version string still cannot tell two builds apart.

### Two source constructs stopped compiling, and both are deliberate

| what broke | what it is |
|---|---|
| `is Type { field }` in EXPRESSION position | ⚠ `{ field }` is the **field-capture list** and wants a block after it. Baseline `55_is_capture_needs_a_body_block.expect` |
| an interpolation hole spanning LINES | ⚠ documented in loft's `DIAGNOSTICS.md`: *a hole holds code, and code stops at the end of its line*. Baseline `54_format_unclosed_open_brace.expect` |

**Consecutive baseline numbers, same diagnostics work — these are intended tightenings
with committed expected output, not regressions.** The multi-line hole was **never legal**
by loft's own documented rule; the older lexer simply did not catch it.

⚠ **AND THE `format-unclosed-hole` FIX SUGGESTION IS WRONG FOR OUR CASE** — it says
*write it `{{`*, which is right for a literal brace and would have put a literal `{` on
the wire where the camera matrix goes. Both sites are **hoisted into a local** instead:
`src/editor_server.loft`'s `say_view` and its `MSG_PROP` sentence.

⚠ **`use self::skin;` RAISED THIS TREE'S MINIMUM TOOLCHAIN.** `/usr/local/bin/loft`
(16 Aug) now answers *Library 'self' not found* three times and cannot build the tree at
all, so it is no longer available as a control for anything.

### ⛔ And the browser tier found a check of ours whose premise had expired

`make fast` is green on the new binary (1m38). `make page-check` is **not**: `probe-auth`
fails **1 of 37** —

```
FAIL D4 the far ground changed too (2667548928 → 1806428659): the camera moved, not the world
```

⚠ **IT IS NOT THE BINARY — IT IS `C3`.** Controlled: the same binary, the same lexer
fix, a worktree at `8f30f57` (the commit before *the page takes the camera*) → **auth
PASS, 37 checks**.

⛔ **AND MY FIRST DIAGNOSIS OF IT WAS WRONG, WHICH IS WORTH MORE THAN THE FIX.** I wrote
that `hex_cam` lifts the eye with the terrain, so the far ground legitimately moves.
**`local_camera` is called at boot and on a YAW change only** — two call sites, and the
key sequence presses no turn before that shot — so the camera provably *could not* have
moved during the raise. What `C3` changed is where the camera SITS at boot (`cam_boom`, a
leading pivot, a clearance lift), so a fixed screen rectangle began framing terrain the
gesture reaches. ⚠ **The old check's own failure message said *"the camera moved, not the
world"*, and that sentence was false** — a check that names the wrong cause is worse than
one that fails, because the next reader believes it. I did.

⚠ **AND THE PROBE CONTRADICTED ITSELF ABOUT THAT RECTANGLE.** `press.mjs` calls the
`ground` rect *"what a gesture has to move"*; D4 required that it did **not** move. Two
comments, one rectangle, opposite claims — which is how the stale one survived.

✅ **RE-AIMED ONTO A SECOND INSTRUMENT — 2026-08-19.** The page prints
`client: local cam — eye … aim …` where the matrix is solved, and D4 is now a COUNT:
solved **once**, at boot, and not again across the raise, so D3's change is the world's by
elimination. ⚠ **`-eq 1`, not `-le 1`** — a lost report would make *it did not move again*
true by absence. Two sabotages, both declared in the probe: `camdrift` (the yaw guard
opened) reds it at **309 re-solves**, `camquiet` (the report deleted) reds it at **0**.
The `ground` rect is printed and judged by nothing.

## ⛔ THE PAGE'S CAMERA DID NOT FOLLOW A WALK — found by that instrument, fixed 2026-08-19

**`local_tick` re-solved the camera when the YAW changed and at no other time.** A walk
moves the pose and not the yaw, so the view stayed where it was. Measured on the demo
page: six `w` presses walked the author to **(2.347, 0)** while the camera still aimed at
**x = 0**, solved once at boot. **The author walks out of their own frame.**

⚠ **THE COMMENT ABOVE THE GUARD SAID THE RIGHT THING AND THE CONDITION UNDER IT DID NOT** —
*"the camera is DERIVED from the pose, so it is re-solved on any tick that moved one"*,
implemented as `if turned.au_yaw != a.au_yaw`. Nobody compared the two, because **a turn is
the only case the author pictured**: the comment's second clause is entirely about turning.

⚠ **AND IT WAS A TWO-DRIVER DIVERGENCE.** The server has always re-solved every tick from
`wk_*`. This is the plan whose one invariant is *the page is the same editor with the
authority local instead of remote*.

✅ **Fixed** — the guard is the pose now (x, z, y or yaw). ✅ **And the report moved with
it**: a println inside `local_camera` was affordable when the camera solved twice a run and
is one line per tick now, so the eye and aim ride the walker's own 300-frame line —
**author and camera on ONE line at ONE moment**, which is what makes *the camera follows*
a subtraction rather than an inference across two reports.

### ⚠ Three checks of mine were wrong before the subject was

| | |
|---|---|
| D4 v1 | a second screen RECT holding still — a pixel answering a question about a camera |
| D4 v2 | *solved once* — true only because the camera was **broken**; the fix makes a count of one the bug asserting itself |
| G1b v1 | `aim x == author x` — holds only at yaw 0, and **my own comment one line above said the claim was a difference, not a position** |

✅ **What survives all three is the invariant: `|aim − author|` is CONSTANT.** Measured
**0.6870** at yaw 0 after a 0.32 walk and 0.6870 at yaw 0.58 after a 2.35 walk — one
number, two poses, no convention to get wrong. Both probes assert it now. ⚠ The pivot sits
**lateral** to the facing (the server calls it over-the-shoulder), so the aim is never the
author's own x/z — `hex_cam::PIVOT_AHEAD`'s name and two comments call it a forward *lead*,
and it is not one.

⛔ **Sabotages, both red**: `camstuck` (the shipped defect restored) → *the camera fell
0.6870 → 0.7579 behind*; `camquiet` (the report removed) → *the instrument is absent*.

### ✅ And `PIVOT_AHEAD` is `PIVOT_LATERAL` now — it was never ahead of anything

The facing in this family is `(cos yaw, sin yaw)` — both drivers boom along it — and the
pivot offset is `(-sin yaw, cos yaw)`, that facing turned **a quarter turn**. The name
said forward; the arithmetic has always been sideways.

⚠ **Three of the four sites describing it were wrong, and the arithmetic never was.**
`editor_client` said the pivot *"leads it by `PIVOT_AHEAD` figures"*; `hex_cam`'s own test
was `test_the_pivot_leads_the_character_it_follows`, with a comment reading *"facing +x
(yaw 0): the pivot must sit AHEAD in z"* — a sentence that contradicts itself. Only
`editor_server` had it: *"offset LATERAL to the facing … over-the-SHOULDER rather than
straight down the spine."* A reader reasoning from the name would put the eye behind the
character's head.

⚠ **AND THE OLD TEST READ ONLY z, so a pivot that ALSO led forward would have passed it**
— the very camera its comment described. The rows now assert **no x component at yaw 0**
and, over eight yaws, that the offset's **dot product with the facing is zero** while its
length stays `fig · PIVOT_LATERAL`: one pose cannot tell a quarter turn from a lucky axis.
Sabotaged by making the pivot genuinely lead — **3 rows red**.

✅ **A pure rename, and the evidence is a number that did not move**: `|aim − author|` is
**0.6870** in `probe/b1b` D4 and `probe/b2` G1b, before and after. hex_cam 8 → 9 tests on
both backends; only moros consumes the package, checked before touching a public name.

⚠ **AND A SABOTAGE RUN LEAVES ITS BUILD IN `src/.loft`.** `AUTH_SABOTAGE=camquiet make
probe-auth` then `make probe-demo` packaged the sabotaged client into `_site/index.html`,
and the demo read a page with the instrument deliberately removed — a red belonging to the
previous command. Noted in the probe.

## ⛔ `hex_way` HAS A ONE-SIDED ANGLE WRAP, AND WE BUILD AGAINST A `hex_way` THE SIBLING HAS ALREADY FIXED — 2026-08-18

**Two findings from one inspection**, and the second is about this tree rather than the
library. [probe/way](../../probe/way/README.md).

### A. `seg_distance` normalises in ONE direction (both copies, unreported)

```
  while aa < lo { aa = aa + 2pi; }      // …and never `while aa > hi { aa -= 2pi }`
```

An angle is a direction, not a quantity, so the same curve authored a turn lower is the
same curve — and it is not, to this function. A point taken **from** the arc reads:

| the arc | reads |
|---|---|
| `a0=0 a1=+pi/2`, `+3pi/4..+5pi/4`, `+7.0..+8.0` | ✅ 0 away |
| `a0=-2pi a1=-2pi+pi/2` | ⛔ **1.531 away** |
| `a0=-7.0 a1=-6.0` | ⛔ **0.990 away** |

⚠ **The same file has the correct two-sided wrap twelve lines further down** —
`seg_param` wraps up *and* down. One file, two normalisations, one of them one-sided,
which is this tree's *a guard that works in ONE DIRECTION reads exactly like a guard*.

**What it costs**: `seg_distance` is not a leaf — `track_distance`, `nearest_seg`,
`way_mark`, `way_stamp`, `cut_arb` and `way_param`'s segment choice all route through it.
**The same quarter arc marks 5 cells authored at `[0, pi/2]` and 1 at
`[-2pi, -2pi+pi/2]`.** One curve, two footprints.

✅ **The fix is measured, not proposed** — `probe/way/hex_way-fix.patch`, a shared
`ang_wrap` used by both functions. Applied to the sibling checkout: every row holds, the
footprints agree, `hex_way`'s own 12 tests stay green. ⚠ **The checkout was then restored
byte-for-byte** — another agent is working that tree right now — so landing it there, or
republishing, is the owner's call.

⚠ **Not reachable from moros**: nothing in `lib/`, `src/`, the sibling or the registry
calls `track_arc` at all. Every track this tree builds is `track_straight`, and the arc
path has no caller outside `hex_way`'s own tests. That is why six worked examples and two
suites never saw it.

### B. ⛔ *"byte-identical to the checkout (diffed, not assumed)"* is false for all fourteen

Three manifests here carried that claim. Measured: **all fourteen `hex_*` differ**, eleven
in comments only and **three in CODE**:

| | | |
|---|---|---|
| `hex_field` | +73 lines | purely **additive** (`stencil_unstamp*`) |
| `hex_form` | +13 lines | added **refusals** — the published copy accepts malformed stencil headers the checkout rejects |
| `hex_way` | **1 line** | `track_offset` is `+ d * dir` published, `- d * dir` in the checkout |

That last is the sibling's own fix and **the published 0.1.0 does not carry it**: measured
against what we build, an offset way comes apart at its joints with a **gap of 1.0** on a
0.5 offset. ⚠ It cannot reach moros either — `track_offset` is used here on straights
only, and the straight branch never reads `dir`.

✅ **`sh probe/way/drift.sh` is in `make fast`**, and it is a **baseline rather than a
threshold**: the drift is real today and closing it is a republish this tree does not own,
so it fires when the sibling moves further *or* when a republish lands. A guard that is
red on purpose is one people learn to ignore — `probe/k1` and `probe/k2` rotted exactly
that way.

⚠ **AND MY OWN EQUIDISTANCE ROW PASSED AGAINST THE BROKEN COPY.** *Is the offset exactly
|d| from the centreline* is green on the published `+ d * dir`: equidistance does not pick
a side. `track_offset`'s own comment says so — *"the number that sees it is the gap at a
joint, not the distance to the line"* — and I had rebuilt that blind gate by hand before
reading the sentence warning about it.

## ⛔ TWO SIBLING PACKAGES CLAIMED ONE MODULE FILE NAME — fixed 2026-08-18, [loft#976](https://github.com/loft-lang/loft/issues/976)

**Spotted as an `Advice[module-name-shadowed]` in the editor server's build log while
doing `T1c`, and it turned out to be fatal rather than cosmetic.** `moros_sim` and
`hex_part` each held a `src/skin.loft`, with **no name in common**, each saying a bare
`use skin;`. Both suites green forever — a package's own graph holds only itself.

| a consumer that pulls both | what breaks |
|---|---|
| `use moros_sim; use hex_part;` | ⛔ `unknown type 'PartBox'`, `Unknown function skin_covers` |
| `use hex_part; use moros_sim;` | ⛔ `Unknown function skin_overlap` |

⛔ **THE CONSUMER'S `use` LINE ORDER DECIDES WHICH LIBRARY LOSES ITS MODULE**, and
neither author can see it from their own tests. ⚠ **A qualified name does not help** —
`hex_part::skin_covers` fails exactly as the bare name does, because the module never
loads and there is no second name to choose between. That is what separates this from
the struct-name collision CLAUDE.md records as fixed on 2026-08-11.

⚠ **IT HAD NOT BITTEN ONLY BY LUCK.** Both `skin` modules are **test-only** —
`moros_sim`'s `skin_fit`/`skin_pocket` and `hex_part`'s `skin_covers`/`part_box` have no
production caller between them — so nothing ever crossed the boundary, and the server
has had both packages in its graph for months. **The first production caller in either
would have been the failure**, reported against a file its author had not touched.

✅ **The fix is one line per package and it is the compiler's own suggestion**:
`use self::skin;`, measured in both orders with every answer matching what each
package's tests assert. **Write `use self::<x>;` for a module your package owns, always.**

✅ **AND `make fast` RUNS `tools/basenames.sh` NOW** — it fails when two packages each
hold `src/<x>.loft` and each claim it with a bare `use`. ⚠ It does not flag `render.loft`
(`lavition_ui` + `graphics`) or `wall.loft` (`hex_part` + `hex_world`): only one package
claims each of those, so the rule is *two bare claims*, not *two files*. ⚠ **Its first
draft reported fourteen collisions and every one was a package with itself** — the
working-tree `../loft-libs-world/hex_place` against the registry's `hex_place-0.1.0` —
so it normalises the version suffix now.

⚠ **AND MY OWN CONTROL FAILED FIRST, ON MY MISTAKE.** `SkinCheck.kc_worst` does not
exist; it is `kc_dx`. A probe that reds for its own reason and one that reds for the
subject's look identical in a log, which is why the control is a separate file that has
to go green before the subject's red means anything. [probe/skin](../../probe/skin/README.md).

## ⛔ A HOUSE TYPE COULD BE READ AND NOT WRITTEN — plan 22 `T1b`/`T1c`, 2026-08-18

**Read this before adding anything else to the palette.** `T1b` set out to give a house
type the OPENING an author gets by default and finished by finding that **no driver
could declare a type at all**:

| | |
|---|---|
| `hex_voxel::world_set_palette` | **zero production callers** — every one in the tree was a loft test |
| a `load` command | neither `editor_run` nor `tools/script.mjs` had one |
| a wire message for a palette | none existed |

So **plan 21's region mappings and plan 22's house types were both readable by a gesture
and writable only by a test.** `T1a.1`, `T1a.2` and `T1b` each shipped consulting a table
nothing outside `lib/*/tests/` could fill — three steps, every suite green, the feature
unreachable from any driver. ⚠ `T1a.2` is the step that **deleted `verbs_here()` for
having no consumer**, and the same audit walked straight past the missing writer for the
whole axis. *Check that what you built is called* has a bigger sibling: **check that what
reads a table has something that can fill it.**

✅ **`T1c` builds the way in.** `hex_voxel::world_palette_put` writes one slot and leaves
its neighbours and every other region alone; `hex_editor::world_declare` is the one
parser and both drivers hand it the whole line — `editor_run`'s `declare`, the server's
new `54:`. ⚠ **The payload is the LINE and not fields**: a body carries spaces
(`wid=5 dep=4`) *and* commas (`verbs=portcullis:opening,sally:hole`), so a separator
would need a split-on-the-first-two rule in every reader and `tools/script.mjs` would
have to know the shape to build one.

✅ **`tools/scripts/htype.keys` is the invariant's own script** — *adding a type touches
no code*. Nothing under `lib/` names 7, 5 or `OP_POINTED`:

| | cells | opening | world |
|---|---|---|---|
| with the `declare` line | **37** | **kind 2** | `6a7e1e65…` |
| the same script without it | 27 | kind 1 | `ab6d327b…` |

⛔ **And the sabotage is what makes it evidence**: with the server's `54:` branch removed
the served world is `ab6d327b…` — the *undeclared control's own md5* — because the server
built the compiled-in 5×4 house. `make probe-s2c` prints both hashes side by side.

### What `T1b` itself settled

⚠ **One opening default, because this editor has ONE opening selection.** *Which door*
and *which window* are the same field since `S3` collapsed six keys onto one verb.
⛔ **And *which floor* is not reachable at all** — the tree's materials are structural
kinds (`FLOOR_MAT` is *a built floor*, not a finish), so a `floor=` field would parse
perfectly and change nothing. Written into the source rather than built.

⚠ **`es_open_set` is a second field and it has to be**: an author who chose `OP_ROUND`
and an author who chose nothing hold the same number, so the override row chooses
**exactly the kind the type would have given anyway**.

⚠ **THE SUBJECT LINE MOVED WITH IT, AND THAT IS THE FEATURE.** `editor_server` read
`sess.es_open_kind` at **eleven** `hud_wire` sites; with a type in play the panel would
say *round* while the next press cut *pointed*. `open_kind_here` is one derivation with
two readers, and the bare `36:` handler reads it too — the raw field there would have
been `S2c` rebuilt one field over, in the same handler, three days later.

✅ **AND `T1a.2` HAS A LIVE PATH AT LAST, WHICH IS THE OTHER THING `T1c` BOUGHT.** A
script saying `declare house 1 castle wid=5 dep=4 verbs=portcullis:opening` and then
`verb portcullis` answers **`portcullis: 1`** and cuts the opening — a verb no compiler
ever saw, dispatched from a declaration, with no code touched. Until `declare` existed
that step's whole subject was unreachable outside a loft test.

⏭ **What is still open:** the same verb **over the wire**. `script.mjs`'s `VERBMAP` is a
constant table with no row for `portcullis`, and the socket has no *perform this verb by
name* message — so an aliased verb is headless-only. That is the same shape as the verb
bar's missing query (*which verbs does this editor have* has to be asked, not known), and
it is where `T1` continues.

## ⛔ THE SERVER CUT A DIFFERENT DOOR THAN THE RUNNER — plan 22 `S2c`, fixed 2026-08-18

**`src/editor_server.loft`'s `36:` handler was a second body of
`hex_editor::session_open_kind`.** `S2a` moved the opening's CHOOSING into the library
and left the ASSEMBLY at the socket: `open_ahead(wld, a, DOOR_MAT, 1)` and only then
`opening_make` — the order `D1a.2` reversed on the other side, with the one-edge width
it replaced and a store write that happened before the refusal was known.

⛔ **So the same `.keys` file built a different world depending on whether a socket was
involved, on SIX of the eight live scripts that cut an opening.** `niche` 6 edges
headless against 3 served, `profiles` 6 against 4, `door` and `opening` 3 against 2, and
`embrasure` 2 against **3** — the server opening one MORE, because a refused embrasure
had already turned a wall edge into a door.

⛔ **AND `house.keys` IS THE ROW TO READ, BECAUSE A COUNT IS BLIND TO IT.** Two edges in
both drivers, and the two worlds are not the same file:

```
runner doors at  -2,1/0nw  -1,2/0e
served doors at  -3,1/0e   -1,2/0e
```

The window landed on the same edge and **the front door did not**. The old body took the
first `WALL`/`FENCE` edge in DIRECTION ORDER from the author's own cell; `open_span`
takes the edges nearest the opening's projection onto the run. `house.keys` is the script
every check in this tree runs and the one that renders `s6-house.png`.

⚠ **THE HYPOTHESIS CAME FROM READING AND THE FIRST MEASUREMENT REFUTED IT.** `house`
alone printed *"REFUTED — both drivers marked 2 door bytes"* — the sentence a real defect
produces when the one fixture everybody runs is the one that agrees. What rescued it was
running **every** script that opens something, and then replacing the count with the
**bytes**. ⚠ **And my own control was wrong while looking exactly like a control**:
`WALL_MAT` alone, on the argument that both drivers place the same house. An opening
CONVERTS a boundary byte rather than adding one, so a driver that opens more edges has
fewer walls by exactly that many, and the control fired on the three rows it existed to
exclude. The invariant is the **boundary total**.

✅ **The fix is the call** — `session_open_kind`, the entry point `press_verb` already
uses. `OpeningMade` carries `om_q`/`om_r` now, the cell `open_span` actually marked,
because a socket re-deriving it from the pose is `D0`'s finding again. One sentence per
outcome falls out of the restructure: the old body sent *"no niche to cut into"* and then
*"opened a profile 1 hole"* over the top of it, a defect its own comment had deferred.

⛔ **NOTHING IN THE TREE COULD SEE IT, AND THAT IS THE PART TO CARRY FORWARD.**
`make headless-same` compares ONE SENTENCE and that sentence is `verb place`'s; **no gate
cuts an opening over the wire at all**; and `probe/k3d` records the headless side only.
✅ `make probe-s2c` compares the two drivers' saved worlds **byte for byte** at
`GROUND=0` (the runner started where the server starts), with the counts as the diagnosis
on a difference and a vacuity guard under it. Control at the pre-fix commit: **6 of 8
DIFFER**. ✅ **And `make fast` now runs `headless-same`** — the only thing in that tier
that compiles either program under `src/`, which is the gap the Makefile has recorded
since a name collision presented as a thirty-minute hang.

## ⛔ THE HOUSE HAD TWO OF ITS FOUR WALLS MISSING — plan 22 `D2c`, fixed 2026-08-18

**Read this one first if you read nothing else.** `place_house` printed `84 wall edges`
and the store held **23**: the near wall complete at 12, the left at 9, the right 4 of ~9,
and **the far wall reduced to its two corner posts**. An author standing inside their own
house, facing that wall, was refused *no wall here to open — stand against one*. It was
**pre-existing** — controlled against a worktree at `3e3ac22`, identical there — and had
survived every suite.

⛔ **THE STAMPING WAS INNOCENT.** All four sides stamp completely and every write
survives — 22 + 20 + 22 + 20, which is exactly the 84 the sentence prints. `roof_over`
then merged a band from **the floor** to the ridge over every footprint cell, and
`band_column` replaces everything between `lo` and `hi`. A wall is not a cell of its own:
it lives in `sv_wall_nw`/`_ne`/`_e` on the cell at the floor, which was exactly `lo`.
Stage by stage — floor 0 → walls 84 → roof 46, far run 24 → 4 with the near run 24 → 24
**one line apart in the same measurement**.

⚠ **THE ASYMMETRY IS ONE ROW OF OWNERSHIP.** An edge is stored once, on one of its two
cells, and read back from both. The footprint contains the far wall's owning cells and
not the near wall's — so one wall died and the opposite one did not, from a single
symmetric loop. **A total would have read as healthy**, which is why
`tests/house_walls.loft` asserts the four walls separately.

✅ **The fix is three lines and a subtraction**: the band is `[eave, hu]` carrying only
the roof, because `place_house` had already laid the floor — the band's floor cell was a
SECOND assertion of a fact that already had a home. ⚠ Where to fix it was decided by a
probe: the tree's other two `world_merge_band_as` callers put the wall fields INTO their
band, so the API was not at fault and this caller was.

⚠ **AND IT WAS INVISIBLE BECAUSE THE MESHER DRAWS WALLS FROM THE RUNS**, which were all
four and correctly filed. **The picture was right and the store was wrong** — no gate
asserts a wall-edge count, and the browser gates that render a house are down on
loft#950 anyway.

## ✅ WHAT ELSE LANDED — 2026-08-18

| | |
|---|---|
| **`D2a`** | confirmed by re-measurement, not inference: the mode's line moved from **0.25 inside** the wall's run to **0.43 outside** it — `wall_band()/2`, the masonry's own face. ⛔ The disagreement did **not** close, and that is the result: the mode is a continuous rectangle and the verb a hex-shaped cell sweep reaching four units, so **no placement of the rectangle could ever have made them agree** |
| **`D2b`** | half built, half **refuted by its own verify**. `place` refuses a house whose footprint overlaps a filed plan, and writes nothing doing it. ⛔ The storey half is dropped: all three live storeys (`deck`, `cellar`, `threshold`) run over bare ground with `verb place` count **zero**, so *the meadow must refuse* and *the corpus's storeys must still build* are the same case. **A storey is a terrain gesture here, not a building one** |
| **`E1`** | the camera's ease is `fixstep::approach` — moros consumes an external library for it now. ⛔ **Not a live bug fix, and the plan row says so**: `dt` is a constant here and no angle is eased, so both forms were deterministic. What it buys is frame-rate independence as a property of the EASE rather than an accident of the DRIVER |
| **`T1a`** | the storey height had **three names in three packages** (`WALL_UP`, `ROOF_EAVE_UP`, `STOREY_H`, all 12, 81 call sites, nothing coupling them) and has **one** now. ⚠ Demonstrated by sabotage, since a merge of two 12s is byte-identical by construction: before, moving the constant left the ridge at 23 **unmoved**; after, it moves to 24 |
| **`T1a.1`/`T1a.2`** | **a house type is DATA** — plan 21's palette, not a new format, on the owner's call. `hex_voxel` gained a fourth axis and does not know what a house is; `hex_editor` owns the meaning. A type's own verbs are **aliases onto existing gestures**, because a verb running new behaviour would be new code and the invariant is *adding a type touches no code* |

⚠ **AND `verbs_here()` WAS DELETED BEFORE IT SHIPPED.** It was the query
[EDITING_MODES](EDITING_MODES.md) demands, it parsed correctly, it had a passing test —
and **no consumer**, which the sabotage exposed by leaving it green while the dispatch
row went red. Its consumer is the verb bar, and wiring it needs the **world threaded** to
`client_verb_specs` and a **key** for a type verb. ⏭ That is where `T1` continues.

## ⚠ AN INSTRUMENT TRAP THAT COST FOUR FALSE GREENS — 2026-08-18

`make X 2>&1 | tail -N; echo "rc=$?"` reports **`tail`'s** exit code, which is always 0.
Four `rc=0` lines were meaningless before a **stale `.test-logs`** exposed it — 587 tests
where 589 were expected, from a log an hour old. ⚠ **The same bug reappeared twice more
the same day**, in a helper's exit code read through `| head -1` and in a "scoped" test
run that was actually the full sweep because the Makefile edit had silently not applied.
**Capture the status before the pipe, and verify an edit applied before timing it.**

✅ **AND SCOPING EXISTS NOW**: `make lib-test L=<pkg>` runs that library and everything
that depends on it, computed by `tools/rdeps.sh` from the manifests — never a map in the
Makefile, which is how `tools/layering.sh`'s skip list went stale. An unknown name exits
**2**; an empty set would test nothing and report success. **Measured: `L=hex_editor` is
264 s against ~540 s for the full sweep** — about half, on the change where the saving is
*smallest*, because `hex_editor` is the expensive package and is in the set either way. ⚠ It sorts topologically
because `LIB_PACKAGES` is **not** in dependency order, whatever its comment said — four
edges contradict it.

## ⚠ THE TOOLCHAIN CHANGED UNDER TODAY'S WORK — inspected 2026-08-17

`/usr/local/bin/loft` was replaced at **2026-08-16 23:08**, and the version string did not
move — still `loft 2026.8.0`. Every measurement behind the `T1` and `T2` commits ran on the
**previous** binary: both worlds byte-identical, 49 gates, `make lib-test` on both backends.
Re-checked on the new one, `make fast` is **157 test files, exit 0**, layering, `walk-exact`,
`probe-k3c` and `probe-k3e` all green — so the two steps stand.

⛔ **AND THAT RE-CHECK WAS BLIND TO HALF THE PRODUCT — found 2026-08-17 by probe 5.** The
`--html` client built with the new binary **traps with `RuntimeError: unreachable`** the
moment it has a part thumbnail to build: attached to a server (which sends 20 of them), or
local off `_site/index.html` (which bakes 20 into its base tree). The same source built by
the previous binary attaches, runs 300 frames and answers 8 digests.
[loft#950](https://github.com/loft-lang/loft/issues/950), `sev:high` `wa:none`, with the
control pair and five ruled-out measurements in [probe/t5/README.md](../../probe/t5/README.md).

⛔ **AND IT IS MEMORY CORRUPTION — `unreachable` IS THE SECOND SYMPTOM.** Narrowed to one
statement of `add_thumb_mesh`, in a traced copy of the client driven off `file://`:
`st.prog` is a plain `integer` field that reads **0** immediately before
`yverts = parse_singles(body[y3 + 1..body.size()])` and **the f64 bits of -31.4965**
immediately after. The trap arrives one statement later, when a *vector* field is followed
through the now-bogus reference — so **a scalar read returns the wrong number silently**,
and only a vector read dies. Eleven things are ruled out with controls, and **four
source-level workarounds were tried and all four stay red**, which is what `wa:none` is
recording.

⚠ **THE REDUCTION DID NOT CONVERGE, AND THAT IS THE FINDING.** A 3.1 MB module doing the
same parse, holding a struct with the same **90 fields**, linking the same libraries and
running both handlers over the same 20 parts is **green**. The client's 5.8 MB module is
not. Padding a small page with 2,000 lines of *called* code moved it **36 KB** — an
`--html` module's size is its libraries, not its source — so a probe cannot cheaply be
grown to the client's scale.

✅ **AND THE TRAP HAS A NAME NOW — `Store offset overflow: rec=… fld=…`, 2026-08-17.**
It is loft's **own store guard** firing, so the runtime knew the record and the field
all along; `freed at pc=` in the same format string puts it in the store-lifetime family
(loft#760, loft#810) rather than in graphics or meshing, and that fits the symptom
exactly. Re-validated the same day against a from-scratch `make client` on the same
binary — still red attached and off `file://`, dying **after the first thumbnail is
meshed**. Three steps, in [probe/t5/README](../../probe/t5/README.md) § *The panic had a
sentence*: the frames resolve by **byte offset** with no name section
(`probe/t5/wasmframes.py`), the message is a static in the data section, and it is
confirmed at RUNTIME by rewriting one function body to call the `loft_host_print` the
page **already imports** (`probe/t5/wasmpanic.py`). ⚠ **A byte-pattern scan for the
message pointer returned 5805 hits and was useless** — the decode had to be real.
✅ **And printing it improves the BACKTRACE as a side effect**: with the panic returning
instead of aborting, Chrome prints five loft frames where it printed eight of
`core::panicking` and two of program. Both on the tracker, with the ordering stated —
**route the message before shipping a name section.**

⚠ **AND THE DRIVER THAT PROVED THE SILENCE WAS BLIND ON ITS FIRST RUN.** `press.mjs`
reads the page's `<pre>` and `Runtime.exceptionThrown` and never subscribes to
`console.*`, so *the panic printed nothing* was not a conclusion it could support;
`probe/t5/console.mjs` does, and **it scored its own control as silent** because
headless chrome answers `net::ERR_ACCESS_DENIED` for a `file://` URL under the session
scratch directory. A driver that cannot see a line it was told to find reports the same
silence for a page that never spoke and a page it never loaded.

⚠ **AND THE BLAST RADIUS IS MEASURED NOW: 3 OF 49 GATES, NOT ALL OF THEM.** Five gates
drive a browser; `cache`, `client_mesh` and `camera_indoors` fail, each by the page never
producing a frame, while `cart` and `subject` pass because they read numbers and status
lines rather than a rendered world. `camera_indoors` is the independent instrument — the
page attached and alive on the wire (536 messages), rendering **pure sky over 33,600
samples** at `cam false`, `parts -1`. ⚠ So a partial green over `make gate` says nothing
about the product, for the same reason `make fast` did not.

⚠ **AND THE BISECT SHOULD NEVER HAVE BEEN NEEDED.** Chrome hands the trap ten
`wasm-function[N]` frames and `press.mjs` has been recording them verbatim the whole time;
they name the failing function and its call chain. They cannot be read: an `--html` build
carries **no name section** — 58 named imports, **0** named module functions, measured with
[`probe/t5/wasmname.py`](../../probe/t5/wasmname.py), which will resolve them the day a
build ships one. [loft#954](https://github.com/loft-lang/loft/issues/954). ⚠ **The evidence
was in the transcript from the first run and nobody read it** — a stack trace that is
printed but unreadable reads exactly like no stack trace at all.

⚠ **THE LESSON IS THE SCHEDULING, NOT THE DEFECT.** Every check in the list above is
green **and none of them builds or drives the page** — `make probe-demo` and
`make probe-auth` are the two that do, and both sit outside `make fast`. So a
toolchain swap was signed off by a re-check that could not see the browser editor at
all, and *"the two steps stand"* was true while the product was broken. When a green
run is used to clear a change, ask what it does not run.

**The tracker, snapshotted** (labels move on someone else's schedule; the measurements are in
[LOFT_HANDOFF](LOFT_HANDOFF.md), which is where they belong):

| | | |
|---|---|---|
| [#891](https://github.com/loft-lang/loft/issues/891) | `host_input()` blocks with no host | CLOSED — ✅ **verified fixed**, `got [] len 0` at rc 0 on both backends, was rc 124 |
| [#913](https://github.com/loft-lang/loft/issues/913) | `loft test` refuses the path it prints | CLOSED — ✅ **verified fixed**, with the bare-name form as the control |
| [#912](https://github.com/loft-lang/loft/issues/912) | a module basename is global | CLOSED — ⚠ **half of it is left**, see below |
| [#948](https://github.com/loft-lang/loft/issues/948) · [#949](https://github.com/loft-lang/loft/issues/949) | its two residues | **filed 2026-08-17** |
| [#950](https://github.com/loft-lang/loft/issues/950) | `--html` clobbers a struct parameter | **filed 2026-08-17**, narrowed to one statement the same day |
| [#954](https://github.com/loft-lang/loft/issues/954) | `--html` ships no wasm name section | **filed 2026-08-17** — why #950 cost a bisect |
| [#976](https://github.com/loft-lang/loft/issues/976) | two SIBLING packages claim one module basename, and the **consumer's** `use` order decides which loses its public surface | **filed 2026-08-18** — `enhancement` `needs-design` `wa:clean`, the ask being that a bare `use <x>;` prefer the package's OWN file. Fixed here with `use self::skin;` in both, and guarded by `tools/basenames.sh` |
| [#1012](https://github.com/loft-lang/loft/issues/1012) | `verify-self` exits **0** having verified nothing | **filed 2026-08-19** — both installs on this box answer *"not a release bundle"* at rc 0, so a corruption detector cannot tell *intact* from *unexaminable* |
| [#1027](https://github.com/loft-lang/loft/issues/1027) | `registry_validate.sh` validated the version it was REPLACING and printed `OK` | **filed 2026-08-20** — no index refresh, then the highest version present LOCALLY. Hit the minute `hex_way 0.1.1` was published. ⚠ Same distinction as #1012: *checked the thing you meant* against *checked something* |

⛔ **AND #912 IS THE ONE TO READ, BECAUSE THE FIX IS REAL AND LANDS ON THE WRONG SIDE.** loft
gained an `Advice[module-name-shadowed]` that names both files, the `use` site and which one
binds. Measured on a two-package repro kept at `probe/loft/basename/`:

- the shadowing file declares something that **resolves** → the advice fires, **and the
  dependency's own answer silently changes** (`dep_answer` 100 where its own module says 42);
- the shadowing file declares **anything else** → `Unknown function part_list` against
  *the dependency's* source, a spurious `missing argument … of OpAddInt` beside it, and **no
  advice at all**.

So the diagnostic exists and is absent exactly where the build goes red — which is the case
that cost this tree a diagnosis by elimination. **CLAUDE.md's *grep the basename too* rule does
not relax**, and the reason is now that the warning you would lean on is the one that does not
appear.

## ⛔ THE MODE IS NOT THE AUTHORITY, AND THE ROOF DID NOT REACH ITS WALLS — plan 22 `D2p`/`D2a`, 2026-08-17

**`D2` was going to bind verbs to the derived mode; its own premise refutes the table.**
[`probe/d2` § 7](../../probe/d2/README.md), `probe/d2/gate.loft`. The mode and the opening
verb disagree **in both directions**: over 25 stations the design's table would refuse **8**
where the gesture works and grant **4** where there is no wall, while the verb cuts at the
same `(0, −2.25)` from every working station because it projects onto the run. ⛔ **And no
drawing of the line reaches the corpus** — a roof plan is filed by `verb place` alone, and
**16 of the 18 openings are cut into free-standing `verb run` walls** in scripts with no
`place` anywhere: *a wall does not need a roof.*

✅ **THE CONTROL IS WHAT MAKES THAT EVIDENCE RATHER THAN ARGUMENT**, and it fires: `storey`
over a bare meadow builds a floor on **19 cells of open grass** and `place` from inside a
room stamps **a second whole house — 84 writes, roofs 1 → 2** — with nothing in the tree
refusing either. Those two verbs are genuinely ungated. ⚠ **But what they want is *is there
a building here*, and the mode answers *am I under a roof***, which is the same word
`outside` for a meadow and for the wall the corpus performs both its storeys from. So the
row split: `D2a` (the line), `D2b` (the building gate), and the doorstep sentence goes to
whichever refuses.

⛔ **AND CHASING THE MODE'S LINE FOUND SOMETHING THAT IS NOT ABOUT MODES AT ALL: the drawn
roof did not reach its own walls.** `place_house` files the runs and the plan in one gesture
and the two described different rectangles — the gable's eave corners at x −3.46…5.20 ·
z −1.96…4.96 against wall runs at −3.85…5.58 · −2.25…5.25. ⚠ **Two hypotheses fit *outside
at the wall* and they want opposite fixes**, so `mode_at`'s own inputs were printed beside
its answer: `feet` reads **40 at every station**, which refutes *the author is on top of the
wall*, leaving `plan_over` **false at the wall's own line**.

⛔ **AND THE CORRECTION COULD NOT BE READ OFF ONE HOUSE.** Over twenty (wid, dep) pairs the
nominal rectangle **overhangs** the walls at dep 3 (−0.348) and 5 (−0.580) and **falls
short** at 4 (+0.286) and 6 (+0.054), alternating along u by the parity of `wid` too — **the
error changes sign**, so no constant outset could have fixed it. `D1a.1`'s lesson again: a
rule read off one case is a guess with a number attached.

✅ **BUILT IN TWO PHASES, AND THE FIRST IS BYTE-IDENTICAL ON PURPOSE.** `D2a.1` removes the
divergence path — `roof_over` writes each cell from `roof_plan_y` of the plan it files,
instead of from `hex_draw::draw_roof`. ⚠ `S6b`'s own comment called the old arrangement
agreement (*"both take the ridge height from the same `eave + pitch · hd`"*); that is one
FORMULA in two bodies and holds only while both read the same rectangle, which is exactly
what the next phase moves. `D2a.2` then takes the rectangle from `footprint_walls`' mitred
outline plus `wall_band()/2`: **exactly −0.433 at all twenty pairs, on both axes** — the eave
lands on the wall's outer face at every size.

⛔ **AND THE FIRST TEST WRITTEN FOR IT WAS FALSE, MEASURED BEFORE IT WAS DROPPED.** *Every
stamped wall edge MIDPOINT is under the roof* reds at 2 of 34 on a 4×3, and the excess is
**only ever over u and at most 0.197**: the stamped boundary is a zigzag and the roof is a
straight rectangle, which is the whole of `S6b`. **A straight roof cannot cover a jagged wall
edge for edge**, and outsetting until it did would be an approximation in an exact-geometry
domain. What is asserted instead is the exact claim the mesher's suppression rests on — every
roofed column is under its own plan, over nine sizes, **with the nominal rectangle as the
control that must miss**.

✅ **RE-BASELINED, AND THE ATTRIBUTION IS EXACT.** `probe/k3d` moved **9 records: exactly the
scripts that place a house, and every script that places one.** Every changed line is the
ridge `21 → 23` (`31 → 33` for `seat.keys`' seated house) = `pitch 0.7 × 0.719 / 0.25`, with
no cell count, wall-edge count, τ, chunk count or other sentence moving. ⚠ **And one line
that is not a height**: `house.keys`' two openings — the two `D1` found reading DIFFERENT
modes at stations its own comment describes identically — are **both `inside`** now. That
closes as a consequence of the geometry rather than as a rule about modes, which is what says
the rectangle was the defect and the mode was only reporting it.

⚠ **THE MESH TOTALS DID NOT MOVE — 5340/3892 either way — AND THAT IS AN INSTRUMENT NOTE.**
The gable is six points however big the rectangle is, so a vertex count cannot see coverage;
what moved is `27 roof cells: 2 beyond the drawn gable → 0`. `fence.mjs` reading counts
against a store was this shape one registry over at `D1a.1`.

⚠ **AND FOUR OF MY OWN INSTRUMENTS WERE WRONG BEFORE THE SUBJECT WAS.** A `w_tau` control
written downstream of its own subject (2 writes on a refusal that should have had none,
because the second house had put a wall in the room); its station at `(0, 1.0)`, still inside
`opening`'s reach, so *the middle of the room* cut a door; a `raise` row reading one cell
ahead and printing `40 → 40`, which reads as *nothing moved*; and a mesh scan passing hex
coordinates where `chunk_meshes_all` takes CHUNK INDICES — all 25 chunks answered **448/384**,
`ringmesh`'s *bare ground* row, because since `GROUND_DEFAULT` an empty chunk still meshes a
defaulted ground, so it concluded *the plan saves 0*.

⛔ **AND THE GATE SUITE CANNOT SEE THIS CHANGE — `44 PASS` IS 44 GATES THAT COULD NOT.**
`GATE_JOBS=1 make gate`, all 49 serially: **44 PASS, 5 FAIL**, every failure loft#950 —
`cache`, `camera_indoors`, `cellar_ceiling`, `client_mesh` and **`deck_soffit`, a fifth this
file's own list did not have**. ⚠ It was **controlled rather than assumed**: a worktree at the
pre-`D2a` commit fails it too, on the same row, with `mesh soffit = 342 vertices PASS`
identical on both sides. ⛔ **Every gate that renders a house is among the five that are
down**; `part_mode`, the one gate comparing the roof-plan registry, does it as a
**save-and-restore round trip** and is blind by construction to a roof that changed size on
both sides; and **no gate asserts the ridge** — `level.mjs` and `stencil.mjs` are the only
files that say the word and both mean a hill. **So the geometry is measured by
`roof_plan.loft` and the PICTURE is measured by nothing**, and cannot be today: the `--html`
client traps before it draws, so neither a gate nor `make probe-demo` can photograph a house.
That is *when a green run is used to clear a change, ask what it does not run*, applied to
this one.

⚠ **AND `make lib-test` FAILED ONCE, TRANSIENTLY, IN A WAY THAT READS AS A BROKEN PACKAGE.**
`hex_mesh` came back **10 files, all parse errors** — *"Library `hex_edge` not found"* against
`hex_way`'s **own source**, plus *"Undefined type Plan"* against `hex_draw`'s — which reads as
a dependency graph that has come apart. It had not: two worktrees, at the pre-`D2a` commit and
at HEAD, both answer **73 passed**, and the main tree passes on a retry with nothing else
running. **Two `loft` builds at once**, and what `probe/d2`'s *one `loft` at a time* note did
not say is that the failure mode is a RESOLUTION error pointing at a registry package rather
than a slow build.

⏭ **WHAT IS OPEN:** `D2b` — the *is there a building here* gate `place` and `storey` lack —
and a defect this session found and did not fix: **`place_house` answers `ak_ok: false` after
57 writes and 4 filed runs** (*"the walls stand but the roof was refused"*), which is the shape
`storey_here`'s own comment names as the thing a refusal must never mean.

## ✅ THE ROOF PLAN IS THE GESTURE'S — plan 22 `D0`, 2026-08-17

**`es_roofs` had exactly one writer and it sat at the SOCKET**, five lines after
`press_verb` returned — so `editor_run` and the page placed houses that entered no
registry at all, and the registry is what `hex_mesh` draws a gable from. It is
`place_house`'s now, filed from the footprint it stamped the walls on and the seat
`footprint_seat` chose, and the server's copy is gone.

⛔ **THE PAGE HAD BEEN DRAWING THE SAWTOOTH `S6b` EXISTS TO SUPPRESS.** A roof cell draws
itself only where no plan covers it, so one house meshed both ways is **189 vertices and
162 triangles** of per-cell hex staircase against **18 and 6** of gable — with the ridge
0.5 wu low and the eave 0.25 high. ⚠ Not *no roof*: a **wrong** roof, which photographs as
a roof.

⛔ **AND THE SOCKET RE-DERIVED ALL THREE ARGUMENTS, WHICH IS HOW THE TWO COULD DRIFT.**
The footprint by calling `pose_footprint` a second time on the pose, the eave off a
read-back of the seat, and the scale off `hex_proj::HEIGHT_SCALE` — a global that is 0.25
on the landscape and **0.125 on a part world**, where the same house's plan sits at 13.0
and its cells at 6.5. Measured; latent, because no live script places a house in part mode
(`K3c`). **The fourth time a global has stood in for the world here**, and the first where
the two answers describe the *same object*. `roof_eave_y` is the one derivation now and the
cells and the plan are its two readers.

⚠ **`roofs` IS A REQUIRED PARAMETER OF `place_house`**, for `author_at`'s reason: a
defaulted one is how the next driver forgets, and forgetting is the whole defect.

✅ **AND THE INSTRUMENT IS THE COUNT, NOT A GREEN SUITE** — every headless world was
already green without a single plan in it. `probe/k3d`: **9 scripts moved, every one on the
`roofs` field alone**, with no world md5, τ, chunk count, exit code or sentence moving with
them, and the count tracking the houses (`runs 8` → `roofs 2`). `make headless-same` rc 0,
`make parts` byte-identical, `press.loft`'s key-vs-call test now compares the two **sessions**
as well as the two worlds — the half `w_tau` is blind to by construction.

⛔ **AND THE SABOTAGE SWEEP'S FIRST RUN SCORED ALL FIVE ROWS AS *NOTHING WENT RED*.**
`loft test` takes **one target per run** and was handed three, so every row ran nothing and
exited — and *nothing went red* is the same sentence a feature nothing tests produces. The
guard counts `test result:` lines now, one per file. ⚠ **And a row was mislabelled**:
`early` adds an append rather than moving one, so what it reds is the COUNT and not the
ordering it named — renamed `twice`, and the ordering claim is now a **declared blind spot
required to stay green**, because no fixture in the tree makes a roof refuse.

✅ **AND THE GATES AGREE, MEASURED SERIALLY** — `part_mode` (**30 checks, 0 bad**, and it is
the gate whose verdict compares the RESTORED roof-plan registry), `stencil` (the roof cells
that must still draw themselves where no plan covers them), `storey`, `opening`, `straight`,
`subject`, `surface`: **7 PASS, rc 0**.

⛔ **AND THE PARALLEL RUN BEFORE IT WAS WORTHLESS, FOR A REASON WORTH WRITING DOWN: TWO
`make gate` SUITES WERE ALIVE AT ONCE.** The first was launched into a background pipeline,
was interrupted without dying, and left **10 servers**; the second announced *"reclaimed 10
server(s) left by an interrupted run"* and then ran beside it. Both use port base **18200**,
so they fought over the same ports: `straight`, `subject` and `surface` failed at 3.5 s with
`unsettled top-level await` or `SERVER NEVER LISTENED`, and `terrain`, `part_place` and
`part_sock` failed on 20-second wire timeouts at 125–191 s. **Every one of them passes
serially.** ⚠ This is `probe/k2b`'s *two copies ran at once* one layer out, and the two
failure modes are opposite: there it could have produced a **false pass**, here it produced
six **false reds** — which is the cheaper accident and still cost an hour. ⚠ **And the box
is shared**: `rustc` and another agent's loft suite were at the top of the CPU list
throughout, so a 10-job browser suite is not an instrument here at all.

⚠ **AND THE `#950` BLAST-RADIUS COUNT IN THE SECTION ABOVE IS AN UNDER-COUNT.** It says five
gates drive a browser, from a grep for `puppeteer|chrome|launch|press.mjs|browser` —
`cellar_ceiling` is a sixth and the grep missed it, which the run found by failing it with the
exact page signature (every mesh row PASS — soffit 648, floor 390, wall 162, rock 384 — and
only the three PICTURE rows red at `parts -1`, `cam false`, `sky 1`). **A grep over source is
an instrument and its default answer is *absent*,** for the third time in this file.

⏭ **WHAT IT DOES NOT FIX, SAID RATHER THAN LEFT QUIET.** `session_scene_clear` empties every
registry on a load, deliberately and with its own argument in `session.loft` — so a world
saved and reopened still draws its houses from cells, staircase and all. That is the
documented degradation, it applies to all nine registries rather than to roofs, and putting
them in the world's bytes is a FORMAT question with a plan of its own. ⚠ It does mean
`B4`'s *close the tab and come back* returns to a sawtooth roof.

## ✅ GROUND_DEFAULT IS CLOSED — [#23](https://github.com/jjstwerff/moros/issues/23), 2026-08-13

All eight steps built. **The rule is normative now** — [WORLD_MODEL § `E1γ`](WORLD_MODEL.md),
*a world is an infinite plane of its ground `γ`, and storage holds only what differs from it* —
and GROUND_DEFAULT.md is a closure record pointing at it.

⚠ **CLOSING IT IS WHAT FOUND THE LIVE INCONSISTENCY, AND THAT IS THE ARGUMENT FOR CLOSING PLANS
AT ALL.** `E1` clause 3 of the contract still read *"reading an absent chunk yields exactly what
reading a stored all-zero one would"* — false since `G5` shipped, with every suite green the
whole time. **A plan is not closed while its rule lives only in the plan**, and the document
that is right *by definition* is exactly the one nothing re-derives, so nothing catches it
drifting.

`world_fill` is in `hex_voxel`, wired to five `hex_part` fixtures and 27 `hex_editor` loops, 15
equivalence tests in `lib/hex_voxel/tests/fill.loft`, `make lib-test` **3398 green on both
backends**, `make parts` byte-identical. Three more things belong out here, because none is
about a fill:

- ⛔ **A 14× ON THE OPERATION, NOTHING IN ONE SUITE AND −12.9 % IN THE NEXT.** `hex_part`:
  310 tests, 44.8 s → 45.3 s, noise. `hex_editor`, through its own `ground_fill`: **2,472,585 →
  2,208,143** samples for the flat fixtures and **→ 2,152,279** for the nine ramped ones, with
  −28.6 % on its fixture-heaviest file. **A win on a call is worth what that call was worth to
  the caller** — `hex_part`'s fixtures are a tenth the size and its tests write documents to
  disk; `hex_editor` re-lays a 2401-cell landscape per test in memory. The ramps say it twice:
  the **best** ratio on the fixture (3×) and the **smallest** effect on the suite. ⚠ **And the
  ratio was the wrong column throughout**: a fixture pays ~1200 us per CHUNK that neither write
  path avoids, and the plan's *"about 2×"* priced that as the subject.
- ⏭ **A SLOPED FIXTURE IS A STACK OF STRIPS** — every ramp in this tree is affine in one axis, so
  the height is constant along the other and no ramp primitive was needed. Worth knowing before
  anyone designs one.
- ⛔ **AND A BULK PRIMITIVE HAS A FLOOR: THREE CELLS.** loop ÷ fill is **73 %** at width 1, 80 %
  at 2, 107 % at 3, 231 % at 13 — so below three cells `world_fill` is a *pessimisation*, its own
  setup being the whole call. The last two fixtures lay roads exactly three wide and moved
  nothing. **The useful question about a bulk call is never *is it faster* but *how wide*.** One
  kept the fill because its loop discarded the write's return code; the other went back, because
  a fill there needed a manufactured constant — ⛔ **a rewrite that needs a new premise to be
  legal has to be paid for by the measurement.**
- ⚠ **AND THE WALL CLOCK SAID THE OPPOSITE — 2m04 before, 4m03 after.** Wrong *sign*, on a box
  shared with other agents' work. The sampler on the same tree, same file, same 28 runs, settled
  it. **A number that disagrees with the mechanism is a cue to change instrument** — not to
  believe it, and not to wave it away.
- ⚠ **A GUARD ON A RULE IS ONLY VISIBLE WHERE THE RULE'S ANSWER VARIES.** Sabotaging the `F1`
  hand-back left the obvious fold test green — its storey cleared the fill in *every* column, so
  the skipped check would have said *legal* each time. The test that sees it drops **one** of 64
  columns. Same shape as `faced_between` and `stroke_over_limit`, and now written down a third
  time.

## ⏭ LOFT'S SAMPLER, POINTED AT WHAT A TEST DOES — 2026-08-12

**`probe/perf/fixture.loft`**, and two instrument findings before any number is worth reading.

⚠ **THE PROFILER CANNOT BE POINTED AT THE TESTS.** `LOFT_PROFILE=1` arms on a program and on
nothing else — `loft test`, `loft test <name>` and `loft --tests <file>` all report **no
profile**, because `state.arm_profiler()` has one call site in `main.rs`'s program branch.
[loft#860](https://github.com/loft-lang/loft/issues/860). ⚠ **The variable is accepted and
ignored**, so an armed instrument reporting nothing reads as *there is nothing to see*.

✅ **FIXED ON BOTH HALVES — measured 2026-08-15 against the installed toolchain**, and the second
half is the one worth reading. `LOFT_PROFILE=1 loft test` now **arms**: it prints
`════ loft CPU profile — 0 samples over 60 µs ════` on a package too small to sample, which is a
report rather than a silence. And on a *program* the same variable now answers *"LOFT_PROFILE set,
but the loft-level profiler is interpreter-only — this program runs native, so nothing will be
sampled. Add `--interpret` …"* ⚠ **That is the exact complaint this entry was filed about**: an
accepted-and-ignored variable is indistinguishable from a clean measurement, and the fix was to
make the instrument say which it is. The `LOFT_NO_NATIVE_LIBS=1` note below is unaffected and
still applies.

⚠ **AND A `use`d LIBRARY IS A NATIVE CDYLIB THE SAMPLER CANNOT SEE INTO.** The first profile was
**172 samples naming three program functions**; the same run under `LOFT_NO_NATIVE_LIBS=1` was
**33,245 samples naming the library**. Not wrong — blind. **Set it, or you photograph your own
`main`.**

### ✅ AND THE ELISION SCAN IS GONE — `hex_editor`'s suite is 25 % smaller, 2026-08-12

**One change in `world_set_column_as` step 6**, a pure optimisation: the OR it computes is
unchanged, only how much of it is evaluated. `probe/perf/README.md` has the full record.

| | before | after |
|---|---|---|
| `hex_editor`'s suite | 5,210,109 samples | **3,896,879** — **−25.2 %**, same 424 runs |
| `write_cost.loft` | 516,072 | **287,924** — **−44.2 %** |
| step 6's scan line | 8.6 % of the suite | **absent from the table** |

**The invariant: a column write changes exactly ONE cell, `ix`.** A layer with content there is
live in O(1); the sweep is only needed to prove ABSENCE, the rare answer — and it stops at the
first present cell now instead of running to 1024 after the answer is known.

⚠ **THE SHORT-CIRCUIT HAD BEEN MEASURED IN AUGUST AND NEVER APPLIED** (*"116 → 98 ms"*, written
down and left). The `ix`-first half is what was missing: a `break` only helps if a present cell
comes early, and the touched cell can sit at index 1023.

⚠ **AND NOTHING TESTED ELISION AT ALL** — the only test counting layers was `storey.loft`'s,
counting them going *up*. It is invisible from outside: **a dropped layer and an undropped empty
one both read back as absence**, so only the bytes differ. `lib/hex_voxel/tests/elision.loft` is
the rule now — 5 tests, 2 sabotages red, one of them reporting silent data loss.

✅ **AND STEP 4 WENT TOO — the suite is HALF what it was.** `5,210,109 → 3,896,879 → 2,462,718`
samples, **−52.7 %** over the two steps, same 424 runs. `stored_present` 20.8 % → **5.9 %**; step
4's loop gone from the by-line table.

**Its invariant is STRUCTURAL rather than maintained**: `sv_height` is a **u16**, so every stored
cell is at `base + [0, 65535]` against a `WINDOW` of 65536 — no stored cell can be outside the
window **whatever wrote it**. That is what made the three other `ly_cells` writers need no audit:
the type will not hold a value that would break it. Only the incoming column can move the floor,
and its span is already computed.

⚠ **AND THE SABOTAGE PASSED — which is the finding.** Skipping the sweep *unconditionally* leaves
all five `window.loft` tests green, because **the sweep cannot change a decision**: it only lowers
`lo`, and it is entered only when `lo < base` while every stored cell is `>= base` — so `lo` is
always the column's own minimum, and when a rebase fires the column *is* the new floor. Its other
output, `hi`, feeds two comparisons that are **unreachable** (`Hex.h_height` is a u16 too, so no
tile can span 65536). ⚠ **The sweep is dead code today and is kept on purpose**: it is the guard
that becomes load-bearing the day a height field widens, and deleting it would be a subtraction
justified by a type. `lib/hex_voxel/tests/window.loft` pins the reachability fact so `CW_WINDOW`
stops being a branch nobody can explain.

✅ **AND `world_chunk_of` — A FLOOR DIVIDE BY A POWER OF TWO.** `v >> CHUNK_W_SHIFT` and
`v & CHUNK_W_MASK` replace a branch, a fallible division and a multiply.
**5,210,109 → 2,222,770 samples over the three steps: −57.3 %.** Both language properties it
rests on (`>>` sign-extends, `&` is the non-negative remainder) were measured on **both
backends** first, and `lib/hex_voxel/tests/lattice.loft` keeps the old bodies to compare against.

⚠ **AND IT BROKE THE EDITOR WHILE EVERY TEST STAYED GREEN.** The first spelling was
`CHUNK_SHIFT` — and **`src/editor_server.loft:174` already declares `const CHUNK_SHIFT = 3`**, an
8-wide MESH chunk. `hex_voxel` 151 green, `make lib-test` **3300 on both backends**, `make fast`
144 files, `make parts` byte-identical — and the editor program **would not build**, with **all
53 gates** reporting `SERVER NEVER LISTENED`. That is this file's own *"a package suite cannot
see this"* reproduced on the day it was read: **the grep the rule demands takes ten seconds and
was done after the gates went red, not before.** ⏭ The gates were the only instrument that saw
it.

## ✅ GROUND_DEFAULT `G4` — THE DEFAULT EXISTS, AND NOTHING READS IT YET — 2026-08-12

**[GROUND_DEFAULT](GROUND_DEFAULT.md) is the plan the profiling arrived at**, and `G4` is its
fourth step: `w_ground` on `VoxelWorld`, `world_set_ground` with `R1` checked, and a `GRND`
section in the codec. `G1` and `G3` were already built; `G2` and `G5`–`G7` remain.

| | |
|---|---|
| **absent means today, byte for byte** | `make parts` **byte-identical** · `make lib-test` 3300 → **3316** (8 new tests × two backends) · `make fast` 145 files · `make gate` 53/53 |
| the value is a **FIELD**, the section is only the **FORMAT** | `w_sections` says of itself that the library never reads it, so a `GRND` living there would be a second home *and* a tag no consumer wrote. The codec steers it into `w_ground` on the way in |
| `R1` is checked in `world_set_ground` | failure path 5 of the design: unrefused where the ground is **stated**, a value under the reserve surfaces in an unrelated chunk much later, when some layer inherits it |
| clearing is never refused | a cell with no material is not ground, so `Hex {}` is always legal — without that there would be no way back to *today* on a world whose reserve is above zero |

⚠ **A STEP NOTHING READS STILL HAS TO GO RED, AND THIS ONE DOES THREE WAYS.** Sabotaged: the
`R1` check removed (1 red), the codec not reading `GRND` back (3 red), the codec not writing it
(3 red). ⚠ **And the first sabotage run reported 0 for all three** — the harness `cd`'d to the
repo root, where `loft test` has no package, and a broken harness reports the same zero a vacuous
test does. The control row (unsabotaged → 0 failures) is what separated them.

⏭ **`G5` IS NEXT AND IT IS THE MODEL CHANGE**: the accessors synthesise the ground where a chunk
is absent, a write equal to the default does not allocate, and a layer equal to it everywhere is
dropped. ⚠ **`G5` before `G6`, never together** — the store answering for absent chunks and the
picture showing it are two causes for one wrong frame.

⛔ **`world_set_column_as` — TWO TRANSFORMATIONS, NO GAIN, NOTHING SHIPPED.** 7.0 % of the suite
and **no by-line row in the top fifteen** — the cost is spread, which is the shape with no single
edit. (1) Building the `StoredHex` only when the write is needed rather than before the
comparison: **−0.01 %**, 201 samples of 2.2 M. ⚠ The model was wrong — `empty_cells` is 6.8 %
because it allocates **1024 at once**, not because one record is dear. (2) Iterate instead of
index, the transformation that won in `world_ground_cell`: **broke six tests** (*"the clock did
not move for a CELL write"*) and ⚠ **I could not explain why** — three probes refuted the obvious
stories (element assignment through a binding propagates; nested field writes propagate; three
same-named `for` bindings in one function do not interfere). Reverted. ⏭ **The reason it resists a
local edit is the reason it is 7 %**: straight-line work over six steps, and the two steps with a
shape to exploit were already taken.

⛔ **`find_chunk` — A SOUND DESIGN, MEASURED WORSE, NOTHING SHIPPED.** A one-entry memo *checked
rather than trusted*: confirm the last chunk with `ck_cx`/`ck_cz` instead of re-deriving the key
and probing the hash. A stale index falls through, so **nothing has to invalidate it** — `N = 1`,
no silent failure. Written down with its failure paths and a falsifier first. ⚠ **It cost 2.9 %
instead of saving 1.5–3 %**: `find_chunk` went **3.8 % → 8.8 %**, the guard line alone 7.8 %.
Reverted; the op clock confirms it exactly.

Two reasons — **the guard is four conditions** over three field reads and a `len()`, where the
probe that priced it measured **two** compares with a literal index (⚠ *a probe of a simplified
version of the thing is a probe of a different thing*) — **and it mostly misses**, which was the
written falsifier. ⚠ Inlining `chunk_key` was measured too: **−0.74 %, not taken**, because it
would put the store's key encoding in two places, one reader against six writers.

✅ **And the probe found an ICE**: the wrong arity for loft's hash type panics the compiler
([loft#874](https://github.com/loft-lang/loft/issues/874), three lines).

✅ **AND `world_ground_cell` — ITERATE, DO NOT INDEX.** `w.w_chunks[ci].ck_layers[i].ly_id` walks
three levels for one field and the condition reads two, so an indexed scan pays **six**
navigations per layer where a loop binding pays two. Measured first: 200k scans, **369 ms indexed
against 229 ms iterated**. Three scans of that shape rewritten; **2,222,770 → 2,201,138, −1.0 %**.
⚠ The binding is a **reference, not a copy** — established from the rebase mutating through the
same form, not assumed, because a `Layer` carries 1024 cells. ⚠ **Predicted 1.5–2.5 %, delivered
1.0 %**: a by-line total is a budget for the *work at that line*, not for the improvement.

⏭ **AND WHAT IS LEFT IN IT IS NOT LOCAL** — `find_chunk` plus a four-level cell navigation, on a
function whose callers sample **neighbouring hexes of one chunk** in a loop. A one-entry memo of
*last chunk → (index, ground layer)* is the fix, and ⚠ **the chunk vector is REORDERED when an
emptied chunk is dropped**, so a stale memo is a silent wrong-cell read. A design with an
invalidation invariant, not an edit.

⛔ **THE FLAT BYTE BLOB WAS PROBED AND IT FOUND TWO LOFT DEFECTS INSTEAD OF A DESIGN.** The
load-bearing claim — *cells are cheaper as flat bytes than as 7-field structs* — could not be
measured, because the probe for it would not run:

- ⚠ **a comprehension yielding a RANGED integer stops terminating above SIXTEEN elements.**
  `[for i in 0..17 { 0 as u8? ?? 0 }]` does not finish; 16 takes 40 ms; 4096 plain integers take
  50 ms; the same bytes by **append loop** take 40 ms.
  [loft#871](https://github.com/loft-lang/loft/issues/871). **That is exactly how a flat-byte
  layer is built**, so route B reads as unworkable until you bisect the harness instead of the
  idea.
- ⚠ **and the append form is not a safe substitute for a comprehension.** It is **2.1×** faster
  for structs, so `empty_cells` did have a local win — worth **0.6 %** in the suite — and it
  **broke two dressing tests**. Four hypotheses for why were each refuted by their own probe
  (shared storage, intra-vector aliasing, scale, and the struct-field shape the store uses):
  identical values in every probe, different behaviour in the consumer.
  [loft#872](https://github.com/loft-lang/loft/issues/872). **Reverted** — 0.6 % does not buy a
  change to the store's core whose mechanism nobody can state.

⏭ **ROUTE B IS NOT REFUTED AND IS NOT READY.** Its arithmetic holds (one allocation instead of
1024, an encoder that becomes a copy, ≈ 33 % of the suite), but it cannot be built on the
comprehension and the append form is not safe here. **Both are upstream and filed; either landing
changes the price, and until then the design has no honest cost.**

⛔ **AND THE SURVEY BELOW WAS WRONG WHEN IT WAS WRITTEN.** The two
steps before it were exact identities (a missing early exit; a floor divide that *is* a shift);
this one builds 1024 records because **the structure says a layer has 1024 cells**. Checked
first: loft has **no** bulk/repeat/sized vector constructor (`OpPreAllocVector` is internal), all
four call sites create a layer that is then used, and nothing materialises before a refusal. ⚠
And the cost is **interpreter iterations rather than allocations** — `O(1024)` on every backend,
so unlike the two wins before it only the constant moves.

⏭ **IT IS A REPRESENTATION CHANGE, AND THERE ARE TWO, BOTH PLAN-SHAPED.** **A** — don't
materialise an absent chunk: that is [GROUND_DEFAULT](GROUND_DEFAULT.md), already designed, whose
ceiling here is 6.8 %. **B** — a layer's cells as a **flat byte blob**: one allocation instead of
1024, and **the byte layout already exists** (`world_to_bytes` writes exactly these seven fields,
so the encoder becomes a copy). B's reach is everything that walks cells one struct at a time —
`world_ground_cell` 8.4 % + `empty_cells` 6.8 % + `hex_of` 6.6 % + `stored_present` 6.4 % +
`crc32_of` 4.6 % ≈ **33 % of the suite**. ⚠ **Routed, not proposed**: it changes `ly_cells` for
every reader, the CRC and the serialiser.

⏭ **THE PROFILE IS FLAT NOW** — nothing above 8.4 %, and the top ten are all store functions
doing real per-cell work. **The next step is a design, not another local fix.**

⚠ **AND THAT GREP FOUND A LIVE INCONSISTENCY, MEASURED: `world_set_cell` DOES NOT ELIDE.** Clear
a cell through the fast path and the layer *and* the chunk stay in the directory, where the
column path drops both. `E1`'s *"elision is maintained on write"* is true of `world_set_column_as`
and false of the fast path — invisible in the drawing, **visible in the bytes**. Recorded, not
fixed: the cure is cheap now, but whether an empty layer on disk is a defect or a tolerated state
is a format decision. ⚠ **`G2`'s `world_fill` inherits it rather than adding a second answer** —
its hoisted loop is the fast path's write, so a fill that CLEARS a region leaves the layer
standing exactly as 1024 `world_set_cell` calls would. One behaviour, two callers, still open.

### ✅ AND IT IS USABLE NOW — loft `61057fa0…` installed 13:21, and the suite is NOT flat

**All three gaps are closed on the installed binary** (stamped at both ends; `make fast` 141
files, `make parts` byte-identical, programs run — a toolchain swap has broken this tree
silently before). `loft test` gets **one merged report**; the default backend **announces** that
it cannot be sampled ([loft#865](https://github.com/loft-lang/loft/issues/865), filed here
today); and a report that went past a `use`d library **leads with the blind spot** instead of
inverting silently. ⚠ **The report goes to STDERR** — `loft test > out.txt` keeps the results and
loses the profile, which reads as *no profile was produced*.

⚠ **AND THE FIRST THING IT SAID CORRECTS TWO ENTRIES IN THIS FILE.** `hex_editor`'s suite,
**5,210,109 samples over 72 s across 424 runs** (identical with and without
`LOFT_NO_NATIVE_LIBS=1`, so these are the real figures):

| | |
|---|---|
| `world_set_column_as` **22.3 %** · `stored_present` **20.8 %** | **43 % in two functions** |
| + `world_chunk_of` 7.9 % · `world_ground_cell` 4.7 % · `empty_cells` 4.4 % | **60 % in five**, all `hex_voxel` |
| hottest path | `ground_set → … → world_set_cell → **set_cell_slow** → world_set_column → world_set_column_as` |

⚠ ***"`hex_editor` 56 s, 235 tests, FLAT — no fixture dominating"* (below) IS TRUE PER FILE AND
FALSE PER FUNCTION.** The per-file clocks said *spread evenly, real work*; the sampler says **one
write path**.

⚠ **AND THE FIXTURE BUILT THAT MORNING TO STAND IN FOR THE SUITE GOT THE WEIGHTS WRONG BOTH
WAYS**: `empty_cells` **24.6 % → 4.4 %** (over by 5.6×) and `stored_present` **10.0 % → 20.8 %**
(under by 2×). **A test-shaped program is not the test suite.** GROUND_DEFAULT's premise stands,
but the row to aim at is the **elision scan**, not chunk materialisation. ⚠ `crc32_of` is 2.9 %
here and **45.6 %** of `hex_voxel`'s own suite.

### ⏭ THE EARLIER ANSWER, KEPT — it was half useful, and the fix was upstream not installed

**`probe/perf/README.md` § *Is the sampler useful yet* has the table.** Short version, all on
the installed `1dec17a0…` (aug 12 **09:38**):

- ✅ **a program under `--interpret` profiles well** — percent and ms **by function, by loft
  `file:line`, and by call path**.
- ❌ **`loft test` still reports nothing.** The fix — loft `5db374d4`, *"A suite was the one loft
  workload the profiler could not see"* — landed **11:57 today, two hours after our binary was
  installed**. It resolves samples per test *before* merging (each test has its own `Data`, so a
  raw sum would add up positions that mean nothing in common) and refuses where it cannot
  answer. **Nothing changes here until `/usr/local/bin/loft` is replaced.**
- ⚠ **the same silence has a second home**: `LOFT_PROFILE=1` on the **default** backend — the
  command a person actually types — exits 0 with an empty terminal, because `arm_profiler()` is
  in the *interpret* arm. [loft#865](https://github.com/loft-lang/loft/issues/865), filed today.
- ⚠ **`LOFT_NO_NATIVE_LIBS=1` is a VISIBILITY switch and costs nothing**: `editor_run` over
  `house.keys` is **175 samples / 0.668 s** without it and **33,248 / 0.635 s** with — 190× the
  visible work at the same wall clock. **The sample count is the tell.**
- ⚠ **it accounts for 355 ms of a 635 ms run** — parse, compile and cache load are outside the
  picture by construction, so it answers *where did my program go*, never *why is this command
  slow*.

| where a test-shaped workload's time goes | 103,396 samples over 9.32 s |
|---|---|
| **`empty_cells` 24.6 %** | `[for i in 0..CHUNK_CELLS { StoredHex {} }]` — materialising a whole chunk |
| `world_set_cell` 13.4 % · `world_chunk_of` 10.4 % · **`stored_present` 10.0 %** | the last is step 6's elision scan: every cell of every layer, on every column write |
| `world_set_column_as` 9.5 % · `ground_set` 5.5 % | |

⚠ **THE HOT PATH CONTRADICTS A SENTENCE BELOW.** This file records *"`hex_editor`'s fixtures were
already on the fast path"*; the sampler's hottest path is `ground_set → … → world_set_cell →
**set_cell_slow** → world_set_column → world_set_column_as → empty_cells`. The fast path is real
and **the first write to any chunk cannot take it** — 320 materialisations across 80 worlds, ~7 ms
each.

✅ **WHICH IS [GROUND_DEFAULT](GROUND_DEFAULT.md)'s PREMISE WITH A NUMBER ON IT**: *a chunk nobody
wrote returns the default without existing* removes the 24.6 % + 9.5 % this puts on materialising
and rewriting columns. And the fixture costs **2.2×** the subject beside it.

## ⏭ THE CAMERA IS NO LONGER THE CHARACTER — `eye`, 2026-08-12

**A script can stand the camera in the world and look back at whoever is building.** All five
camera modes are DERIVED from the character's pose, so until now the only way to change a view
was to move the character — and moving the character moves **where the next gesture lands**.
Every picture in this tree was taken from behind the person building it.

```
eye <x> <z> [height]     the camera stands there, looking at the character
eye off                  release; the mode takes over again
```

`48:<x>,<z>[,<h>]` on the wire, `48:` to release. `h` is above the **ground** at `(x, z)`.
[WIRE_PROTOCOL](WIRE_PROTOCOL.md) has the row; [SCRIPTED_EDITOR §1](SCRIPTED_EDITOR.md) has why
it is not a sixth mode. Gated by `tools/gates/world/eye.mjs` — 13 rows, all read off the `C:`
matrices, including the character projected through `proj · view` into the clip volume.

⚠ **THE COMPOSITION RULE IS A MEASUREMENT.** Aiming from a point on the **character→house
axis** puts a 1.8-unit figure against a 9-unit building at the same bearing and it reads as
part of the wall — *in frame and invisible*, which the projection arithmetic cannot tell from
visible. Put the eye **across** that line.

✅ **AND IT CLOSED THE `house.keys` DEFECT REPORTED THE DAY BEFORE.** Its `O`/`P` had cut
nothing since the script was written, because both poses stood INSIDE the footprint; they are
on the perimeter now and the wire says `opened profile 1 at (-2,1)` / `profile 2 at (-1,2)`.
⏭ **`shots/s6-house.png` and `s6-door.png` want your eyes** — the acceptance is *does a person
call it a house with a door in it*.

## ⏭ PICK UP HERE — plan 22, THE PAGES CLIENT, and it is the priority

**[#22](https://github.com/jjstwerff/moros/issues/22) · [plan](../../plans/22-pages-client/README.md)
· design [PAGES_EDITOR.md](PAGES_EDITOR.md).** A page you can open from `file://`, build a house
in, close, and reopen with the house still there — produced from **the same client the server
serves**, differing only in where a key press goes.

| | |
|---|---|
| the invariant | **the page is the editor with the AUTHORITY LOCAL instead of REMOTE** — not the editor minus a server. A server is coming back for scripts, multi-player and debugging, so this is a MODE, never a second renderer |
| ✅ `W1` | a world is BYTES — `world_to_bytes`/`world_from_bytes`, save and load are wrappers. `make parts` byte-identical, and `world_load` is **1.6× faster** |
| ✅ `P2` | `host_output` → our JS → `loftPush` round-trips inside a `--html` page. ⚠ **SPENT** — it existed to make `W5` buildable, and `P6` cancelled `W5` |
| ✅ `P6` | **a page has a FILESYSTEM, and a world saved in it survives a RELOAD** — http and `file://` alike, `make probe-p6`. 21 `fs_*` names against the design's **0 of 20**; the base tree reads as the interpreter's directory; `P6_SABOTAGE=persist` seen red. ⛔ **`W5` cancelled, `W3` retired, `P3` closed at under 2 % of localStorage** |
| ◐ `W4` | `hex_editor::press` — what a key means, in one place instead of **four**. `editor_run` and the server's `MSG_HOUSE` wired; `editor_client` and `script.mjs` still carry theirs |
| ✅ `R1a`/`R1b` | **the ring is reconciled.** The pose carries the ground under the feet (`au_y`), `press` rings at it instead of at `0.0`, and the ring's TRUNK is `sess.es_trunk` — the ninth registry — instead of four locals beside the socket |
| ✅ `R3` | `O`/`P` answer **`PR_SELECT`** — *an opening needs a profile, and nothing selects one yet* — instead of cutting the runner's material where the wire means a profile |
| ✅ `S0` | **the scene records go with the store they describe.** `9:` used to leave the previous world's cottage in the session, and `37:` hung a balcony on it |
| ✅ `S2a` | **the opening's CHOOSING is `hex_editor::opening_make`** — the sixth gesture the headless thread has taken out of the socket, and the one `S1` needed: an opening profile's only possible consumer is the opening gesture, which was not callable from a test |
| ✅ `S2b` | **the selection** — `es_open_kind`, `49:<kind>` to choose, and a bare `36:` cuts what is chosen. The admissible set is a PREDICATE, not a range: `5`, `15`, `25` and `30` are nothing at all |
| ✅ `S3` | **the six opening keys are one gesture** — `O P I U N M` reach `session_open_kind`, and pressing a key equals selecting-then-cutting in world AND session. ⚠ A key does **not** re-choose: `36:<kind>` does not either, and a key that did in one driver only would diverge under a green test |
| ✅ `V1` | **a key names a VERB.** `verb_of(key)` and `press_verb(…, verb)` beside an unchanged `press(key)`; six verbs — `raise` `lower` `place` `opening` `fence` `wall` — and all eleven keys driven through both layers, compared as **whole-world bytes** |
| ✅ `V2a` | **the server's `MSG_HOUSE` takes the verb** — the one caller with no profile to lose, so `press_verb` has a production consumer rather than only tests |
| ✅ `K1` | **a script says a VERB** — `verb <name>` and `select <kind>` in both readers, and the runner grew a **session read-back** because the world cannot see what a conversion loses. `make probe-verbs` |
| ✅ `K2a` | **the 18 opening presses are converted** — `select <kind>` + `verb opening` in 8 scripts, every other key untouched. `make probe-convert` |
| ✅ `V2b` | **`editor_run` resolves through `verb_of`** — the **last production caller of `press(key)`**. No equality could see the step; `probe/k1` check `G` can |
| ✅ `V3` | **`press(key)` is deleted.** What a key means is `verb_of` + `press_verb` and nothing else. ⚠ a green suite is the wrong instrument for a deletion — the **test-name diff** is |
| ✅ `B1a` | **the client's five one-to-one keys name VERBS** — `W4`'s fourth site, and `make probe-b1a` is the first check here that ever pressed a key in the client. 7 sentences and the saved world identical to a committed baseline; two sabotages red, each on a different instrument |
| ✅ `B1b.0` | **ONE world model** — `ε`/`θ` were declared in the server (10/4) AND the runner (8/3), under the runner's own comment saying they were the same. `hex_editor::WORLD_EPS`/`WORLD_THETA` now; `worlds/headless.hxw` moved to **exactly the md5 the pre-change experiment predicted** |
| ✅ `B1b.1a` | **the panel says which authority it has** — `ps_status` was a literal reading `connected`, set at panel construction before any socket existed, and it went on saying so with the server down. `authority_line(st)` over the client's one piece of evidence now, and the panel is told when it moves. `make probe-auth`: 15 checks over **three** situations, three sabotages each red somewhere different |
| ✅ `B1b.2c` | **THE PAGE DRAWS ALL ELEVEN SURFACES** — the mesher is `hex_mesh`'s, the server holds no copy (41 declarations and 1,744 lines gone), and `make probe-auth` says `grass` at boot and **`grass,wall`** after the rings. Four steps, because a dependency arrow stood in front of it: `c.1`/`c.2` the five primitives into `hex_proj`, `c.3` the 1342-line props mesher, `c.4a`–`c.4c` the deletion, the ramp and the page |
| ✅ `B1b.2` | **THE PAGE DRAWS.** A camera of its own, its own ground, and a re-mesh on write — 5 picture checks over 3 canvas regions. ⛔ Three instruments were blind before the page was, and one of them was found by a sabotage |
| ✅ `B1b.1b` | **THE AUTHORITY IS TWO.** No socket → the page edits its own world, and the status line says so. `make probe-auth` is 28 checks: the page and `editor_run` at `GROUND=0` agree on the **world** AND the **session**, and nine sabotages say which check sees what. ⛔ Its digest was a CRC32 first, and this format cancels one |
| ✅ `B2`=`B3` | **THE DEMO EXISTS** — `make pages` writes `_site/index.html` (the engine build, verbatim) and `make probe-demo` opens it from `file://` with no listener at either end. ⛔ Most of the step was cancelled by its first measurement: the engine already ran from a disk |
| ✅ `B2b` | **CONNECTIONS TO POTENTIAL SERVERS** — the socket URL is a LIST, and the extra candidates are DATA the build writes (`--servers`), never a compiled-in host. A demo opened from a DISK attached to an editor; two controls say the connection is real and the candidate is given |
| ✅ `B4` | **THE GOAL SENTENCE IS TRUE** — build something, close the tab, come back and it is there. `world_save` on the edit clock, `world_load` on the frame the authority moves. ⛔ Three finished parts (`W1`, `P6`, `M5b`'s pattern) and **no wire between them**; ⛔ and a safeguard of mine that `fall_step` already owned, which only its sabotage could say. Section above |
| ✅ `K2b` | **EVERY SCRIPT IN THE TREE SAYS A VERB** — 91 lines over 32 files, `make probe-k2b` comparing 31 scripts against their own pre-conversion selves on the world, the session, the bytes and the transcript. ⛔ The 32nd file was a script that is not a file (a **heredoc**), and the probe was red on all 31 before it was right, for two reasons that were both about the instrument |
| ✅ `K3d` | **EVERY LIVE SCRIPT HAS A RECORD OF WHAT IT BUILDS** — `make probe-k3d`, in `make fast`: rc, the world's md5, τ, chunks, the session digest, the selection, every sentence a gesture printed and every line the runner refused, per script at `GROUND=0`, against a committed baseline. ⛔ The debt's list of ten was stale **both ways** — what is RUN by nothing is **fourteen of thirty**, and eight of those are *named* in a doc, a plan or a test comment, which reads exactly like coverage. ⛔ And the world-key baseline the row asked for would have been blind: **`slab.keys` keys the world a bare `verb raise` keys**, because a slab is a session record — so the record is a PAIR plus the sentences. 8 sabotages red, 0 missed |
| ⛔ `K3f` | **THE FIVE CAMERA SCRIPTS ARE CHECKED BY NOTHING** — found by `K3d`, and measured rather than suspected: `ceiling` `cutaway` `eyes` `floorprobe` `indoors` `lamp` leave the **same world and the same session, to the byte**, because everything after the house is `send 40:`, `send 3:`, `snap` and `frame`. ⚠ Only `indoors` has a check that can see a camera (`camera_indoors.mjs`); `cutaway`/`eyes`/`floorprobe` are run by `probe/k3c` row B, which asserts **rc=0 and nothing else** — they are that row's control — and `ceiling`/`lamp` were run by nothing at all. No headless baseline can be their check — `probe/k3d`'s `blindcam` row turns CUTAWAY into FOLLOW and requires the probe to stay green |
| ⛔ but | **`B1b.1`'s BOOT SWITCH could not be asked for** — `host_input()` BLOCKS with no host (measured, `probe/b1b/ask.loft`, `timeout 20` → rc 124), so *the page asks which authority it is* cannot be written. [loft#891](https://github.com/loft-lang/loft/issues/891) is **fixed and verified**; route 3 was taken instead — connect-or-local with the panel saying which — and it is built. ⚠ **The two ⏭ this row used to carry are both spent**: `B1b.2` landed on 2026-08-13 and `K3`'s *twelve keys with no verb* were all bound by 2026-08-15. What is next is **`T1`**/**`D1`** |

## ✅ `K2b` — EVERY SCRIPT SAYS A VERB, and three instruments before one script, 2026-08-15

**91 lines over 32 files** — `key ArrowUp` → `verb raise` ×79, `key H` → `verb place` ×10,
`key G` → `verb wall` ×1 — and `make probe-k2b` runs each converted script beside its own
pre-conversion self out of git, equal on the **world key, the session digest, the saved bytes
and the transcript**. 31 scripts, all four. ⚠ **The baseline is a COMMIT rather than a copy**:
`git show 0e2d48a:<path>` cannot drift and cannot be converted by accident, at the price that
the probe stops being runnable the day that commit leaves the history — which is what its
vacuity guard is really watching.

⛔ **THE 32ND FILE WAS A SCRIPT THAT IS NOT A FILE.** `probe/a83/leaf_visible/switch.sh` builds
its script in a **heredoc** and drives it from there, so its `key ArrowUp` was invisible to the
probe's `*.keys` glob, to `grep -rn '^key ' --include=*.keys`, and to the plan row that used
that grep to claim **zero remained**. ⚠ **A glob is an instrument and its default answer is
*absent*** — the same sentence this file already records about greps, one layer out. Found by
dropping the `--include`; converted, and verified inert rather than assumed (`tools/script.mjs`
sends `5:1` for both spellings).

⛔ **AND THE PROBE WAS RED ON ALL 31 SCRIPTS BEFORE IT WAS RIGHT ON ANY, FOR TWO REASONS THAT
WERE BOTH THE INSTRUMENT DESCRIBING ITSELF.** `said_ack` acknowledges a gesture with nothing of
its own to say as `"{what}: {n}"` — **the word the script used** — so the base reads
`  ArrowUp: 1` and the conversion `  raise: 1`, and comparing raw transcripts asserts the step
did not happen. And the runner prints the world's FILENAME in its summary line, which differed
because the two runs wrote to `k2b-a` and `k2b-b`. ⚠ **The two got opposite fixes on purpose**:
the filename is a difference to *remove* (one PID-scoped name, md5 taken between the runs), the
label is one to *normalise* — one-sided, by the same map the conversion used, with the count
and every other sentence untouched.

✅ **AND THE NORMALISATION IS NARROWER THAN IT LOOKS — 80 OF 90, MEASURED.** `  ArrowUp: ` is 79
lines across all 31 scripts, `  G: ` is 1, and `  H: ` is **none at all**: `place` always has
something of its own to say (*house placed 27 cells, 84 wall edges, ridge at 21, seated at 0…*),
so **the ten presses with the most to get wrong are the ten compared word for word.** The dead
`H` row is kept for `window.loft`'s reason — it is dead because of how `place` answers *today*,
which is a fact about a gesture, not about this comparison.

⛔ **AND TWO COPIES OF THE PROBE RAN AT ONCE, WHICH COULD HAVE PRODUCED A FALSE PASS.** One
started by hand, one queued behind the `B4` sweep by an earlier session, sharing
`probe/k2b/out` **and** `worlds/k2b-a.hxw`. The loud half was harmless — `rm -rf "$OUT"` deleted
the other's baselines mid-flight, and a comparison against a missing file says so. **The silent
half is the finding: both runs took an md5 of the same path, so a byte comparison could have
passed on a world the OTHER process built** — a false pass on the step's central claim,
produced by nothing either run did wrong. A lock now stops the second run, **and** the world
name carries the PID regardless: ⚠ *a guard that can be bypassed must not be the only thing
between an md5 and the wrong file.*

✅ **AND THE SECOND CONTROL EXISTS BECAUSE THE FIRST CANNOT VALIDATE THE TRANSCRIPT.**
`K2B_SABOTAGE=lower` (one `raise` becomes a `lower`) is red on **3** — world, bytes, transcript
— so it would go red even on a transcript check that had silently stopped working, *which is
the state this probe was in when it was first run*. `K2B_SABOTAGE=refuse` adds a `verb hole`
with no slab under it: a refusal writes nothing, so it is red on **the transcript alone**, and
the clean control is **PASS over 31 scripts**. ⚠ **A sabotage that trips every instrument
cannot tell you which instrument works.**

⏭ **`K3` IS WHAT IS LEFT, AND IT HAS A PRICE TO STATE RATHER THAN DISCOVER**: dropping the `key`
spelling from `editor_run` and `tools/script.mjs` retires `probe/k1`'s `keyed.keys`/`carried.keys`
and `probe/k2/orig/`'s twelve baselines, because a reader that no longer exists cannot run them.
That is `V3`'s shape — a transitional instrument spent.

## ✅ `B4` — THE GOAL SENTENCE IS TRUE: BUILD, CLOSE THE TAB, COME BACK, 2026-08-15

**`world_save` on the edit clock, `world_load` on the frame the authority moves.** `local_persist`
compares `w_tau` against the last value saved, once a frame — **in the frame loop, not in
`local_act`**, because a hook on the gesture path persists what that path writes and silently stops
covering whatever later writes another way. `w_tau` moves iff the store changed, whoever changed it.

⛔ **THE STEP WAS THREE FINISHED PARTS AND NO WIRE BETWEEN THEM.** `W1`'s codec (gated byte for
byte), `P6`'s page filesystem (*a world saved in it survives a reload*, measured over `http` **and**
`file://`) and `M5b`'s load-at-boot/write-on-change pattern **in this very client** — all green for
two days, and **nothing called them**. `world_save` had eleven callers and not one was a page.

> That is `CLAUDE.md`'s *commonest defect in this tree* sitting on the milestone it was named for,
> and it shows where the defect hides best: **between steps that are each honestly tested**, where
> no suite looks.

⛔ **AND I WROTE A SAFEGUARD THE LIBRARY ALREADY OWNED — THE SABOTAGE IS THE ONLY THING THAT COULD
SAY SO.** Restoring a world whose origin was raised leaves the author at the *boot* world's height,
so I fixed it where that story pointed: `local_fall` writes the pose from `st.py` every tick
(`B1c.3` put the authority there), so `local_restore` seeded `st.py`. **The sabotage removing that
seed was green on every check in the file** — `fall_step`'s first branch is
`if y <= gnd { stand on it }` and its own comment names the case, *"the ground rose past the
feet"*, with `test_the_ground_rising_past_the_feet_is_the_climb` already in
`lib/hex_editor/tests/fall.loft`. **A consumer re-asserting a library invariant is code no check
here can ever red**, which is the lower bound of a safe step, failed. Deleted.

⚠ **AND THE REAL CONSEQUENCE WAS ONE LAYER OVER, WHERE I HAD NOT LOOKED.** `local_camera` reads
`au_y` for the eye **and** the aim, and is re-solved **only when the yaw changes** — so a page that
restored a raised world without rebuilding the pose looks out from 1.25 units inside its own hill
and stays there until the author happens to turn. The pose rebuild is load-bearing; the feet seed
never was, and **the instrument moved with the code**: `O3` reads the pose the camera was solved
from, and the feet comparison is kept as `O4` with its blind spot written into the check.

⛔ **AND `0 - 1` AS *NOTHING SAVED YET* WAS WRONG THREE WAYS, WHICH ONE RUN SAID AND NO READING
HAD.** A fresh world is at **tau 1**, not 0 — `world_new` seeds the clock in its own literal, and
⚠ **this file said *the ground fill is a write* for an hour, which is a mechanism that does not
exist**: `world_set_ground` never moves `w_tau`, and a runner on an empty script at `GROUND=0`
reports `0 chunks, τ 1`. **The number was measured and the reason was invented** — so an untouched page
encoded and wrote a whole world on its first frame; and on the failure route it **overwrites the
file it could not read**, a frame later, destroying the thing a person came back to recover. The
seed is the world this page is about to edit, on all three routes out of the loader.

⚠ **THE FIXTURE WALKS BACKWARDS, AND THE GESTURE IS WHY.** `raise_ahead` lands `PEAK_AHEAD` = **10
hexes ahead** with radius 7 and refuses rather than falling back underfoot (its own comment records
*"the hill ended up underfoot"* once). A reopened page stands the author at the **origin**, the only
place `O3` can measure — so the run walks 40 steps back, the dome centres ~2.1 hexes past the origin
and the ground there is **1.25**. ⚠ **And the oracle is this run's own first boot, not the number**:
the same code at the same position reports 0 on fresh ground and non-zero on the restored world,
with the fresh reading as the row's vacuity guard.

⚠ **AND `O3` FIRST READ THE WALKER'S FEET, WHICH IS A NUMBER THE FALL REPAIRS.** The consequence
being guarded is a CAMERA, and a camera's consequence is not something the walker reports — this
tree's own rule, *give a claim the instrument that can SEE it*, arriving as a check that could not
fail rather than as a picture that could not tell.

⚠ **WHAT IT DOES NOT CARRY IS IN THE TRANSCRIPT RATHER THAN LEFT QUIET.** A world's bytes are cells
and sections; the **nine scene registries** live in the `EditSession`, so a restored cottage has no
runs, roofs, openings or props and its picture degrades to `chunk_mesh_props`'s per-edge fallback —
`session.loft` had already priced that (*"EMPTY IS NOT A LOSS OF THE HOUSE — it is a loss of the
RECORDS"*). Putting them in the bytes is a FORMAT question and a plan of its own. ⏭ The **pose** is
not saved either, and two tabs on one origin both write `world.hxw` with the last one winning.

## ✅ `M5b` — THE KEYBOARD SURVIVES A RELOAD, and a claim of mine that was too strong, 2026-08-15

**`keymap_delta` writes the rows that DIFFER from the default**, `keymap_apply` puts them back
onto a map built from *today's* default, and `keymap_save`/`keymap_load` are thin wrappers over
loft's `f += text` / `f.lines()`. The client loads at boot and writes on every bind — there is no
save gesture, because a keyboard is a setting rather than a document a person commits.

⛔ **THE INVARIANT I WROTE FIRST WAS TOO STRONG, AND ITS TEST PASSED FOR THE WRONG REASON.** I
claimed the delta is what stops a saved file freezing the vocabulary — *a verb the editor GAINED
arrives with its own key*. **That is true of a whole-table file too**: `keymap_apply` assigns per
named verb and leaves an unmentioned one alone, so the row could not see the delta at all.

> **What a delta actually earns is the editor's freedom to MOVE a default.** Change `raise` off
> `ArrowUp` in a release, and everyone holding a whole-table file stays on the old key forever,
> having asked for nothing.

Both rows are kept — *the file is a table* and *applying replaces instead of assigning* are
different mistakes with the same symptom, and the second has its own sabotage.

⛔ **THE ABSENCES ARE RECORDED, AND THE SWEEP FOUND THE RULE IS ENFORCED TWICE.** Worked on paper:
default `A=1 B=2 C=3`, bind `B` to `1`, then `B` to `3` — the map is `A="" B=3 C=""` and the only
keyed non-default row is `B=3`, which replayed onto a default leaves `A` on a key its owner lost
two gestures ago. ⚠ **And the sabotage removing those absences goes red through the COLLISION
guard**, not its own claim — *that file puts 2 verbs on 'ArrowDown' — nothing was loaded*. The
one-key-per-verb check written for hand-edited files catches a malformed delta as well, which the
paper argument did not predict.

⛔ **AND `N3` COULD NOT FAIL — THE SABOTAGE IS WHAT SAID SO, AND IT IS `M6`'s FINDING AGAIN.**
`nopersist` scored `N3` **green** while its own `N2` read *the reloaded page found NO key map*.
With one `5` and one `ArrowUp` after the reload, *survived* and *did not survive* both produce
exactly one raise, and no line in the transcript names the key. **A total cannot say WHICH** — a
sentence already in this plan, written at `M6` about a count of the identical shape, and it turned
up in an instrument built *after* it was recorded. The presses are asymmetric now (`5,5,ArrowUp`):
**2 is the restored key, 1 is the old one, 3 is both, 0 is neither.** ⚠ Fourth instrument of mine
this session that could not answer its own question, and all four were found by RUNNING rather
than reading — `M5a`'s mis-click row, `M5b`'s delta claim, a grep whose `^ *M[0-9]` could not see
`   ✗ M7`, and this.

⚠ **`!reload` — THE DRIVER RE-OPENS THE PAGE MID-GESTURE.** *Bind it, close the tab, come back* is
one sentence, so it is one run. ⚠ **The first half's transcript is dumped before the navigate**,
because the page's `<pre id=out>` is part of the document — without that the evidence anything was
*saved* is gone, and the check would assert persistence with nothing to persist. ⚠ And the page is
clicked again afterwards: the shell binds keydown to the CANVAS, so a freshly navigated page is
deaf, which reads exactly like a binding that did not survive.

⚠ **AND THE STALENESS GUARD IN `build-pages` EARNED ITS KEEP TWICE IN ONE HOUR** — both times on a
comment I edited in `lib/hex_editor/src/keymap.loft` while a probe was mid-run. *The client engine
is OLDER than 1 of its sources* names the file; a demo assembled from a stale engine would have
passed its own gate on last week's editor.

✅ keymap **36 → 45 tests** · `sh probe/k2/sabotage-m5b.sh` **8 rows, 6 sabotages red on their own
claim, 2 clean controls** · `make probe-demo` `N1`–`N3` over a page reloaded mid-run.

## ✅ `M5a` — A KEY HELD FROM BEFORE THE PICK NAMES NOTHING, and a check of mine that could not fail, 2026-08-15

**`hex_editor::rebind_scan` is the rising edge the hardware does not have.** `graphics` offers
`gl_key_pressed(code)` and no event queue, so *did they just press it* is built out of two looks
at the whole keyboard. Walk forward on `w`, press `Escape` with the other hand, click a slot —
and the old editor bound `w` before the person had chosen anything. `RB_SETTLE` is the same
missing edge at the far end of the gesture, and `M3` shipped that half alone.

> **THE INVARIANT: only a key that has been observed UP since the pick, and is down now, can name
> a verb.**

⚠ **AN EDGE DETECTOR WHOSE FIRST LOOK SEEDS RATHER THAN FIRES.** `st.was_arm` in the client does
this for one key with a `false` seed, and is right to — the client starts before any key can be
down. The rebinder arrives in the MIDDLE of a keyboard it has never seen, so *unknown* has to read
as *was already down*. ⚠ And it takes the whole observation rather than one code at a time: *was
this key down last time* cannot be answered by a caller reporting only what is down NOW, and the
release it would miss is exactly what makes the next press fresh.

⛔ **A ROW I WROTE COULD NOT FAIL, AND RUNNING THE SWEEP IS WHAT SAID SO.** The mis-click row asked
*the key held across a re-pick must not name the second verb* and was **green under all five**
sabotages written for this step — because a reseed makes the held key stale too, so the claim is
true either way. What a reseed actually costs is a key struck in the same frame as the second
click, and that is the direction the row asks now, with a sixth sabotage that bites it. ⚠ **A row
can be unfalsifiable without being wrong**, and only running the sweep says which.

⛔ **AND THE OBVIOUS SYMMETRY WAS REFUSED BEFORE IT WAS WRITTEN.** *Every pick starts a fresh
observation* reads like the rule and is wrong: `rb_down` has watched continuously since the FIRST
pick, so a key held across a corrected mis-click is **already** stale — reseeding re-establishes
nothing and swallows a genuine press. **Arming is the one gap nothing observes**, so arming is
where the memory is dropped. ⚠ The row that sees it must scan with **nothing down** during the
first gesture, or the stale memory happens to hold the right answer — the `faced_between` shape
again: a guard is only visible where its answer varies.

⚠ **THE DRIVER COULD NOT SAY THIS SENTENCE.** Every press `probe/b1b/press.mjs` makes is
down-then-up inside one step, so *already down when the slot was clicked* was unreachable. `+key` /
`-key` is the hold, and the run is one gesture: **`+w,Escape,@raise,-w,5,5`**. One `keyDown` is
enough — the page's shell keeps a SET — and auto-repeats would model a different physical event.

⚠ **AND THE STEP INTRODUCES A SILENCE, SO IT SPEAKS.** Before it a held key bound itself: wrong,
and visible. After it that key does nothing, which is the *blank no* this tree refuses everywhere
else — so the seed names what it found (*"press a key for raise — W already down, so press it again
or use another"*), with its own test row and its own sabotage.

✅ hex_editor keymap **28 → 36 tests**, suite 522 → **530** · `sh probe/k2/sabotage-m5.sh` **8 rows,
6 sabotages red on their own claim, 2 clean controls** · `make probe-demo` PASS with `M7`+`M8`.

⏭ **`M5b` FOLLOWED IT** — the section above.

## ✅ `M4` — `verb_of` IS DELETED, and a row that claimed to catch the tree's commonest defect never could, 2026-08-15

**What a key means is `keymap_default()` and nothing else.** The `if` chain stood beside the
table from `M1` for exactly as long as it took to prove it — `lib/hex_editor/tests/keymap.loft`
drove the whole key universe through both across three slices — and that is what a transitional
instrument is for. ⚠ **The suite reads 522 → 522, which is the wrong instrument**: a deletion
makes tests pass by removing their subject, so the **test-name diff** is the check, and it is
6 lines with every one accounted for (1 deleted, 1 added, 4 renamed because the claim changed
shape).

⛔ **AND THE ROW THAT SAID IT CAUGHT *BUILT AND NEVER CALLED* COULD NOT SEE IT.** `keymap.loft`'s
second loop walked the key universe under a comment claiming it *"catches a verb added to
`press_verb` with no way to reach it"* — this tree's commonest defect, named in `CLAUDE.md`,
claimed covered:

> **Measured on the pre-`M4` tree before it was believed**: an arm added to `press_verb` for a
> verb bound in neither the chain nor the table left the suite at **522 passed**. The loop only
> ever saw verbs *the chain named*, so the case its own comment describes was invisible to it.
> What it actually caught was a verb in the CHAIN missing from the TABLE — the retired equality's
> job, which went with it.

`the_vocabulary()` in `verb.loft` replaces it: every verb the editor has, listed once, checked
against the definition in **both** directions and against `press_verb`. It is in the TEST rather
than the library on purpose — a `verb_all()` beside `keymap_default()` would be a public function
with one caller. ⚠ **And the residual blind spot is written into the test** rather than covered by
a comment: a verb in `press_verb` and in neither list is still invisible, because loft has no
reflection to enumerate what a dispatch answers to. That sentence is the whole difference between
the new row and the one it replaces.

⛔ **AND THE DELETION SILENTLY DISARMED FOUR SABOTAGE SWEEPS, IN TWO DIFFERENT WAYS.** Every `K3`
sweep sabotages the definition by `sed`ing `verb_of`'s chain, so all four became **no-ops** the
moment it went — measured by running each sed against the post-`M4` source and comparing files.
`sabotage-x` and `sabotage-bc` exited loudly (*the subject is absent*) because their subject guard
named the **binding**; `sabotage-e` and `sabotage-z` did not, because theirs name `stair_ahead`
and `session_hole_kind`, both still present — so those rows ran, changed nothing, and printed
**NOTHING went red**. ⚠ **A subject guard only sees what it names**, which is `K3` · `B`'s finding
one step earlier: a sabotage that does not *apply* reads exactly like a sabotage that does not
*build*, and both read like a test that cannot fail. All four are retargeted at `bind_of` rows and
re-measured; `sabotage-e`'s `s1` is **2 red** where it had been silent.

⛔ **AND RUNNING THE SIBLINGS FOUND A THIRD STALE INSTRUMENT, ONE SLICE OLD.** `sabotage-z`'s `s6`
reported *a half-done conversion went unnoticed* about a check that noticed loudly: `K3` · `X`
merged two checks into one message — ``still presses `key X`/`key Z` `` — updated `sabotage-x.sh`
to match, and left `sabotage-z.sh` greping `still presses .key Z.`. ⚠ It fails SAFE, and a day
passed only because nothing had run that sweep since `X` landed.

⛔ **AND A SWEEP PIPED THROUGH `head` LEFT ITS SABOTAGE IN THE WORKING TREE.** The trap was
`EXIT INT TERM`; SIGPIPE kills the shell without firing it, so the next `make lib-test` came back
`hex_editor` **11 failed** with `bind_of("5", "tunnel")` still in the source — a real-looking
regression in a step that was green minutes earlier. All five sweeps trap `PIPE` now. ⚠ **And my
own check reported that run as fine**, because `make …; echo rc=$?; grep …` hands back the *last*
command's status: a failed suite arrived labelled *exited with code 0*, with the failure on line
6450 of a log I had summarised past. **A summary is an instrument, and its default answer was
*fine*.**

✅ hex_editor **522 both backends** (unmoved, by construction) · `make lib-test` **3624** ·
`make fast` 156 files · `make gate` **49** · `make parts` byte-identical ·
`sh probe/k2/sabotage-m4.sh` 5 sabotages red on their own claim with a clean control at both ends ·
`sabotage-e` 7/7 with the retargeted row biting again.

⏭ **`M5` IS NEXT** — persist a rebind (`LayeredFS`) together with a fresh-press requirement for the
scan, because both are *the map outliving the frame it was made in*.

## ✅ `M3` — REBINDING FROM THE EDITOR, and a polling client fires the key it just bound, 2026-08-15

**Arm with `Escape`, click a slot, press a key.** `hex_editor::Rebind` is the machine —
`rebind_arm`/`rebind_pick`/`rebind_press`/`rebind_release` beside `keymap_bind` — and the client's
whole share is **two fences**, `act` for verbs and `wire` for everything with no verb, rather than
a condition on each of ten edge detectors. `make probe-demo` grew an `M` block: six checks over two
runs, `M1`–`M6`.

⛔ **THE DESIGN NAMED THE WRONG FAILURE, AND THE RIGHT ONE IS INVISIBLE TO EVERY OTHER INSTRUMENT.**
The step table predicted *a collision reported as a refusal*; that half was settled at `M1` and
green before this started. What nobody had written down is that the client **polls**:

> `poll_input` asks `gl_key_pressed(code_for(map, verb))` once a frame and acts on the RISING EDGE.
> Bind `raise` to `5` and the physical `5` is **still down** on the very next frame — false → true,
> an edge, and the ground rises. **The rebind performs the verb it was defining.**

⚠ **And that raise is correct in every particular** — right verb, right author, right world, right
`w_tau` — so nothing in this tree could tell it from one a person asked for. `RB_SETTLE` holds the
keyboard until the finger comes up, and it is why the machine has four states.

⛔ **AND THE MAP IS NOT THE WHOLE KEYBOARD.** Eight keys are bound in `editor_client.loft` and in no
`KeyMap` — `w a s d` walk, `l` levels, `Tab` cycles, `o`/`p` go straight on the wire — so binding
`raise` onto `w` is reported as a **clean rebind with nothing displaced**, because the collision is
with a table `keymap_bind` is not in. `client_reserved` SAYS it rather than refusing: every letter
is taken, and refusing is the useless-feature failure one layer down. ⏭ The real fix puts them in
the map, which needs `press_verb` to have a shape for a HELD state — `D1`'s neighbourhood.

⛔ **AND THE NEW FENCE WOULD HAVE CAUSED THE BUG ITS NEIGHBOUR FIXES.** Arming must zero `st.held`
or a walking author keeps walking through the whole rebinding — and the `4:0` that stops the server
is the **withdrawal** of input, which is exactly what `wire`'s fence withholds. It goes straight to
`web::send` now, with the reason written beside it.

⛔ **AND TWO INSTRUMENTS WERE WRONG, ONE OF THEM NOT MINE:**

> **`probe/b1b/auth.sh` B9 had been RED since `B1c.1`.** It asserted local mode says *"'4:' is a
> server message and this page has no gesture for it yet"* exactly once; `B1c.1` gave local mode a
> walk **and** guarded the send with `if !st.local`, making the apology unreachable and untrue in
> one commit — with the client's own comment beside it saying so. ⚠ **Measured before it was blamed
> on history**: `HEAD~1`'s client was built and run and fails B9 identically. Inverted now, with
> the original *once, not per frame* claim **moved rather than removed** to a new `B9b` that asks
> it of a message which really has no local gesture. `auth PASS — 37`.

> **And my own `M6` blamed the wrong half — found by running the `nosettle` sweep.** Its run holds
> one `5` and two `ArrowUp`, and it read any non-zero raise as *the old binding is live*. With the
> fence gone the bind press raises once and `ArrowUp` is correctly dead: a true count under a false
> headline. **1 is the bind firing, 2 is the old key, 3 is both**, and it is branched now — *a
> total cannot say WHICH*, this plan's own finding arriving in an instrument written after it.

⛔ **AND THE DRIVER HAD BEEN TURNING `5` INTO CODE 85 SINCE IT WAS WRITTEN.** `press.mjs`'s fallback
is a LETTER heuristic: `'Key' + '5'` is `Key5`, which no keyboard sends, and the page's `mapKey`
takes the `Key` branch anyway and computes `'Key5'.charCodeAt(3) + 32`. The press was delivered,
the client saw nothing, and the transcript read exactly like rebinding not working. ⚠ **Digits are
the only genuinely free keys**, which is why no probe had ever pressed one and why they are what a
person rebinds ONTO.

✅ **AND THREE THINGS BUILT-AND-NEVER-CALLED HAVE CONSUMERS NOW** — `verbbar_hit`, `verbbar_verb`
(no widget in this tree had ever been hit-tested) and `spec_verb_on`, which lights the picked slot.
⏭ **`panel_hit_test` is the last one still uncalled.**

⏭ **AND WHAT IT OPENED — the scan cannot tell HELD from PRESSED.** `graphics` has no event queue,
so *which key did they press* is 43 asks of `gl_key_pressed`, which answers *is it down*.
`RB_SETTLE` solves that at one end only: **a key held from before the arm binds itself the instant
a slot is picked.** It is `M5` together with persistence, because both are *the map outliving the
frame it was made in*, and it wants a driver that can hold a key across a click.

✅ hex_editor keymap **15 → 28 tests** · `make lib-test` **3624 both backends** · `make fast` 156
files · `make gate` 49 green · `make parts` byte-identical · 4 library sabotages red on their own
row with a clean control at both ends · `make probe-demo` PASS with `M1`–`M6`, three sabotages
(`nosettle` → M4+M6, `noarm` → all, `nobarsay` → M3 alone) · `make probe-auth` **37 PASS**.

⚠ **AND `make gate` IS SILENT WHEN IT PASSES, WHICH READS AS A VACUOUS RUN AND IS NOT.**
`run-gates.sh` prints nothing for a green gate on purpose — loft's Goal F, *a tool that reports its
good health teaches the reader to skip the line where it eventually reports the opposite* — so 49
passing gates produce **zero output and rc=0**. That is the same shape as the broken harness this
file records at `G4`, read the other way round, and the way to tell them apart is to check the
instrument against something it should find: `GATE_VERBOSE=1` makes a PASS speak, and a gate given
a dead port says `SERVER NEVER LISTENED` loudly. Both were run.

## ✅ `M1`+`M2` — THE KEYBOARD IS THE PERSON'S, and three instruments that could not fail, 2026-08-15

**The binding is DATA and the verbs are on screen.** `hex_editor::KeyMap` is the definition
layer — `keymap_default()`, `verb_in`, `key_for`, `code_for`, `keymap_bind` — and both drivers
read it: `editor_run` resolves a script's `key` line through the map, and every input site in
`editor_client` names a **verb** while `st.keys` says which finger reaches it. The verb bar
(`lavition_ui::verbbar`) draws one slot per verb with the key over a short label, one row along
the bottom, overflow reported rather than wrapped. The design is
[EDITING_MODES § Phase 6](EDITING_MODES.md).

⛔ **THE MEASUREMENT THAT STARTED IT: FOUR SITES, AND ONE WAS WRONG ON SCREEN.** `verb_of`'s `if`
chain; the client's `KEY_*` codes; the poll block beside them spelling the same key again as a
string (`gl_key_pressed(KEY_STOREY_UP)` then `verb_of("B")` — the file's own comment called that
*"the last place this step could hide one"*); and the side panel's toolbar, which drew a hotkey
glyph per button as a **literal**. ⛔ **Three of its six were wrong for months** — `e` beside
*Stencil* where `e` is `stair_up`, `c` beside *Cart* where `c` is `cellar`, `f` beside *Field*
where `f` is `fence`. A literal glyph is connected to nothing that could disagree with it.

⚠ **ONE ROW PER VERB, WHICH FREES EIGHT KEYS.** `verb_of` bound **23 keys to 15 verbs** —
`O P I U N M` all `opening`, `Y T` both `seat`, `J K V` all `annex`. Those are `S3`'s collapse
leaving the old keys in place, and a definition with six `opening` rows draws six identical slots
in a bar and six identical rows in a rebinding list. Measured safe rather than assumed: no live
script presses one (`probe/k2` check 14 keeps the grep) and the client's `o`/`p` send `36:1`/`36:2`
straight to the wire and have never reached `verb_of`.

⛔ **AND THREE OF THIS WORK'S OWN INSTRUMENTS COULD NOT FAIL — ALL THREE FOUND BY LOOKING AT THE
PICTURE.** This is the session's repeated lesson arriving a third time in one day:

> **1. The layout fixture was easier than the thing it stood for.** Every slot in the suite
> carried a one-character key, so *the glyph fits its box* passed with nothing to fit — and the
> first real run drew `ArrowUp`, seven characters at a 10px advance, in a 34px slot.
>
> **2. Containment is satisfied by truncation.** With the fixture fixed, `fit_text` cut every
> label to `f…` and the row stayed green, because truncated text is still inside its box. The
> claim that matters is that the slot holds what it was **designed** to hold, at the metrics the
> consumer actually has — `advance 10, mono`, which the client's own panel line reports.
>
> **3. Ordering is not separation.** `key.dt_y < label.dt_y` says the key is above the label and
> nothing about whether they touch. At `UI_SIZE` 16.0 they were drawn **through each other** —
> `Up` over `rise`, legibly, in the same pixels — with the suite green.

Each has a row now, and each was seen red on the value that shipped. ⚠ **The general shape: a
layout claim that only bounds a thing cannot see a thing that has been squeezed to fit.**

⛔ **AND DRAWING IT COST TWO PICTURE GATES, WHICH `tools/script.mjs` HAD ALREADY PREDICTED.** Its
own comment records what happened when the side panel arrived — *"counting it moved every share in
every gate at once"* — and the bar did it again: a **constant `soffit 0.0787`** in every shot,
which is the bar's 52 of 660 rows, taking `cellar_ceiling` and `camera_indoors` red on a change
that touched no world code. ⚠ **The constancy is the tell, and it is worth keeping**: an overlay
misread as a surface reports the *same* fraction in every frame of every gate, because its pixels
do not depend on the world. A world defect moves; furniture does not. The strip is excluded now,
beside the panel and the status bar.

⚠ **AND ONE THRESHOLD MOVED, WITH THE MEASUREMENT RATHER THAN A SHRUG.** `indoors.keys`' SNUG row
wanted a whole-frame `sd ≥ 0.125` and read **0.1193** — because the excluded rows carried
contrast, so the view this row measures is genuinely smaller. Checked the honest way: the client
was **rebuilt with the bar removed and the identical scene passed**, which is what separates *the
sample changed* from *the picture got worse*. It is `0.11` now, and the script's own note is why
that is allowed — *"`sd:masonry` … 0.0031 without the lamp, 0.0762 with it — a factor of 25,
against a whole-frame `sd` that moved by 0.0003"*. The coarse bound still catches a black or flat
frame; **the row that actually sees the lamp is untouched**.

⏭ `M3` is rebinding from the editor — arm, pick a slot, press a key. ⏭ `M4` deletes `verb_of`,
which now has only test callers and is kept as `V1`'s independent control until the comparison is
spent. ⏭ And the bar shortens for free the day `mode_at` (`D1`) lands: `keymap_verbs` is a query,
so *the verbs available where you are standing* needs no change here.

## ✅ `K3` · `B`+`C` — THE LAST TWO KEYS, and two sweeps that could not fail, 2026-08-15

**`B` names `storey` and `C` names `cellar`.** Every key the scripts press is a verb now.

⚠ **THE FIFTH SLICE, AND THE FIRST WHERE BOTH RULES POINT THE SAME WAY.** They are two
verbs by the DIRECTION rule (`raise`/`lower`, `stair_up`/`stair_down`) *and* by the TWO ACTIONS
rule (`slab`/`hole`), because they are **not mirror images**: a cellar comes with its stair, since
a room nothing can enter is not a room. ⚠ **And the naming rule earns a sentence here, because
this is where it could have gone wrong**: the obvious symmetry would make them
`storey_up`/`storey_down`. **A verb takes the word the domain already has, and a direction suffix
is the fallback where there is none.** English has no word for a downward tread, so the stair pair
is named by its sign; it does have *cellar*, and `verb cellar` is what an author means where
`verb storey_down` is a coordinate.

⛔ **AND THE CLIENT'S `b`/`c` WERE THE LAST RAW `wire` SENDS IN THE INPUT BLOCK, WHICH MADE THEM
THE DEAD ONES.** Every neighbour — the arrows, `f`, `g`, `e`, `q`, `r`, `h` — went through
`act(… verb_of(key))` at its own slice; these kept putting `12:1`/`12:-1` straight on the socket.
Local, there is no socket: the page answered *"'12:' is a server message and this page has no
gesture for it yet"*, so **the demo could not build a storey or dig a cellar at all**. `R`'s
finding and `E`'s, still live on the one pair nobody had converted. `make probe-demo` has a `B`
block now: **`local storey — 19 · storey +1 on 19 cells`**, with `DEMO_SABOTAGE=nostorey` red on
all three checks.

⛔ **THE STRIDE WAS A GLOBAL AGAIN — THE THIRD GESTURE.** `cellar_stair` took `cliff_step()`,
which is `walker_step(W_UNIT)`: 0.25 on the landscape and **wrong on a part world**, so a cellar
there got treads of half the height a walker can climb. The handler's own comment defended it —
*"`cliff_step` is `moros_sim`'s rule"* — and that stopped being true at `B1c.2b`. Two more
literals went with it: the disc radius was a bare `2` and the stale-region pads were `6` and `3`
written at the socket.

⛔ **AND TWO OF THIS SESSION'S OWN INSTRUMENTS COULD NOT FAIL.** Both were found by the sweep
reporting rows that should have gone red:

> **A sabotage that does not BUILD read exactly like a sabotage nothing noticed.** `loft test`
> writes `FAIL  tests/verb.loft  (parse errors)` with **no `::`**, and every `row()` in
> `probe/k2/sabotage-*.sh` counted `FAIL  tests/.*::` — so a broken edit scored 0 red and printed
> *NOTHING went red*, the same sentence a suite with a hole in it produces. Found because a stride
> row substituted `W_UNIT`, which is the SERVER's constant and invisible inside the library. **All
> four sweeps had it**; all four have the guard now.

> **And the disc assertion was a table checked against the table.** `cells == 1 + 3r(r+1)` moves
> with `STOREY_R`, so the row aimed at a changed radius went **green** at 37 cells. The closed
> form is kept — it says the gesture walks a hex disc rather than a square — and `== 19` is pinned
> beside it, because 19 is the bare literal five browser gates read off the wire.

⚠ **AND A CHECK'S ARMS HAVE AN ORDER.** `verb storey -1` matches neither `^verb storey$` nor
`^verb cellar$`, so the counts fired first and reported *a floor changed direction* — true,
useless, and pointing at the wrong file. The specific diagnosis has to be asked before the
generic one or it is unreachable.

⛔ **AND THE FIRST DEMO BLOCK MEASURED A REFUSAL WHILE BELIEVING IT MEASURED THE VERB.** It
pressed `b` at boot; the page boots on the defaulted ground plane where nothing is stored, so a
storey is honestly *"no cells here"*. ⚠ Nor does raising fix it on the spot — `raise_ahead` lands
the brush **10 hexes ahead with a radius of 7**, so the author's own radius-2 disc is entirely
outside what was raised. The walk is what puts the author on it.

⏭ **A live wording defect, recorded not fixed**: a refused cellar says *"storey refused"*, because
`say_refused_code` is given the verb `storey` for both directions. `tools/gates/world/ground.mjs`
matches that string on purpose, so renaming it is a change to make with a gate in hand.

⏭ **AND `part_place` IS LOAD-FLAKY ON `drawn`, FOUND BY RUNNING THE SUITE TWICE BACK TO BACK.**
It came back `"drawn": false` with `sameCentre`, `sameEave`, `sameWalls` and `hasDoor` all true —
so the placement was right and only the PICTURE was missing. Alone it is **5 of 5 green** in
`make gate-rep` at 5.6 s a run, and the failing run was the second full suite in one pipeline.
Nothing to do with `12:`; recorded because *a check that is sometimes false under load* is the
`H2` finding again, and the next person to see this row should not go looking in the part code.

## ✅ `K3` · `X` — THE NAME THE PAIR WAS WAITING ON, and an instrument removed the hour it was built, 2026-08-15

**`X` names `slab`.** `Z` bound `hole` a slice earlier and deliberately did not declare the
other half — a verb `press_verb` answers `PR_NONE` to is what
`test_every_verb_the_definition_produces_is_bound` exists to refuse — so `slab` was a name
waiting for the step that binds it rather than one this step invented. `hole`'s refusal has said
*lay a slab first* since `Z`, and this is the verb it was naming. `session_slab` is the
assembly; `probe/k2` check 11 now counts both halves and asserts they stayed **two verbs**.

⛔ **AND THE INSTRUMENT I ADDED TO COVER THE MOVED SENTENCE WAS REMOVED THE SAME HOUR.** Every
`K3` slice moves an `S:` reply into `hex_editor` — `say_slab` is this one's — and `probe/k2`
check 1 **cannot see any of them**: it greps `^editor: `, which is the `println` BESIDE the
reply, and on the slab the two say different things (*slab at (0,6) 10..12* against *a slab 2
units thick at 0,6 — ceiling 10, floor above 12, clear 10*). So a twelfth check compared the
wire. It went red on four scripts — and every red was the instrument, not the subject:

> **`tools/script.mjs`'s capture LAGS and TRUNCATES.** It prints, after each line it sends,
> whatever message arrives NEXT — routinely a push left over from the line before — and returns
> 250 ms after its last send with replies still in flight. Two scripts of **different lengths**
> (a converted one sends an extra `select` per press) therefore lag by different amounts and
> lose different tails. Measured over all ten pairs: four matched, four were missing an
> `opened a profile …` reply **whose world and server sentences were identical**, and
> `determinism` had three EXTRA lines.

⚠ **THE REMOVAL IS NOT A COVERAGE CUT, AND THE CHECK IS WHAT SAYS SO.** `say_slab` is a library
function, and `lib/hex_editor/tests/verb.loft` asserts all three of its numbers — the ceiling,
the floor above, and the clear height between them, which is exactly the claim a model of sheets
cannot state. That is `CLAUDE.md`'s division working: **a sentence that becomes a library
function gets a library test.** ⏭ Draining the socket to quiescence before `script.mjs` exits
would make the wire diffable, and it is a change to the driver every gate in the tree runs.

⛔ **AND `HOLE_PAD` WAS ONE NUMBER UNDER TWO NAMES.** The socket marked
`HOUSE_W + HOUSE_D + 4` by hand for the slab and asked `hm_pad` for the hole — the same
footprint, for the same reason, with nothing between them that could notice a drift. It is
`SLAB_PAD` for both, and the test asserts **both gestures reach for it**, because a constant
only one caller consults is the *built and never called* defect in its smallest form.

⚠ **A `pub const` USED ABOVE ITS OWN DECLARATION IS REPORTED AS A LOCAL WITH THE WRONG CASING** —
*"Variable 'SLAB_PAD' is UPPER_CASE — that style is reserved for constants"*, against a
`pub const`. It **resolves correctly** (measured: `sb_pad = 13`), so the cost is diagnosis time:
the one diagnostic pointing at a real constant is the one saying it is not one, which sends you
hunting a shadowing binding that does not exist.
[loft#921](https://github.com/loft-lang/loft/issues/921), with a control in the same file — the
identical constant declared *before* its use is not advised. The fix here is the declaration
order the shared constant wanted anyway.

✅ **FIXED — measured 2026-08-15 against the installed toolchain.** A `pub const` used above its
own declaration draws **no diagnostic**, as a bare program and as a package under `loft test`, and
still resolves. ⚠ **The absence was checked against something the build SHOULD find first**: a
9-parameter function in the same file, which reports `Advice[too-many-parameters]` — and note it
prints indented as `  Advice[…]`, the shape a `^advice:` grep misses. `SLAB_PAD`'s declaration
order stays where it is; it is what the shared constant wanted anyway, so nothing here reverts.

⏭ **TWO KEYS LEFT: `B` AND `C`** — a storey above and a cellar below. ⚠ They are the first pair
whose scripts have a **real gate**: `deck.keys` and `cellar.keys` are driven by
`deck_soffit.mjs` and `cellar_ceiling.mjs`, where the other eight `probe/k2` scripts are run by
hand.

## ✅ `K3` · `Z` — A THIRD REASON FOR TWO VERBS, and a library that named a keystroke, 2026-08-14

**`Z` names `hole`; `X` is untouched and has no verb yet.** They are two keys on one message —
the shape that has now produced three different answers in four slices — and this one is neither
of the first two. Not a THING (which collapses: `seat`, `annex`), not a DIRECTION (which does not:
`stair_up`/`stair_down`), but **two actions**, where one cannot run until the other has. `39:0`
lays a floor into `es_slabs`; `39:1`…`39:3` cut a void into `es_holes`. That is
`place`/`opening`'s relationship exactly — `H` builds a house, `O` cuts into its wall — and those
have been two verbs since `V1`.

⚠ **AND WITHIN `hole` THERE IS NO FAMILY TO COLLAPSE YET.** Three kinds exist (a stairwell, a
coffer, a sunken panel) and **only kind 1 has a key**, so `Z` is one-to-one: `R`'s situation,
taking `R`'s answer. The wire keeps carrying the resolved kind (`hole: '39:1'`), and `39:2`/`39:3`
reach the same gesture with no key of their own.

⛔ **AND A BARE `39:` IS A SLAB, WHICH MAKES ONE CONTRACT UNAVAILABLE ON THIS ID.** `36:`, `37:`
and `38:` all read an empty payload as *the one I chose*; here `payload as integer ?? 0` is the
**slab**, so a bare `hole` would lay a floor where an author asked for a void. Written into
`script.mjs`, the library and the new `39` row, because the next person to add a selection will
reach for it.

⛔ **AND THE LIBRARY'S REFUSAL NAMED A KEYSTROKE — WITH A TEST ENFORCING IT.** `slab_hole` said
*"no slab to cut — **press X first**"*, and `test_cutting_with_no_slab_is_refused_by_name`
asserted that exact substring. So the coupling `EDITING_MODES` exists to break was not merely
present, it was **pinned**: `X` is remappable, a script says `verb slab` and never presses it, and
a headless driver has no keyboard at all. It says *lay a slab first* now, and the test asserts the
obligation (it names what is missing) plus its negation (it names no key) — the positive half
matters, because *absent* would pass on an empty string.

⚠ **AND THE APPEND IS THE HALF THAT WAS NEVER IN THE LIBRARY.** `slab_hole` — the host choice, the
kind table, the fit — was already `hex_editor`'s; the `es_holes` append, the sentence and the
extents were at the socket. **The append is the one that matters**: a hole reaches no store at
all, so `es_holes` is the mesher's only source and a driver that cut without filing would draw an
unbroken floor and report success. The seats' finding, one gesture over.

⚠ **WHICH MAKES `probe/k2` CHECK 2 BLIND HERE BY CONSTRUCTION** — two byte-identical worlds
whatever was cut. The sabotage that deletes the append goes red on **one** assertion, the session
count, and on nothing else. ⚠ And `2.0, 2.0` was a literal at that one call site; it is
`HOLE_HALF` now, for `WORLD_EPS`'s reason.

⚠ **AND A CONSTANT THE LIBRARY CANNOT NAME IS PINNED BY A TEST RATHER THAN A COMMENT.** `HOLE_PAD`
is `HOUSE_W + HOUSE_D + 4`, and `session.loft` cannot say so — those live in the root module,
which `use`s it, and a `use` goes one way. The test file sees both, so the equality is asserted
there instead of claimed in prose.

⛔ **AND MY FIXTURE BUILT A SLAB OF NEGATIVE THICKNESS THAT READ PERFECTLY.** `slab_new(…, 12,
SLAB_THICK)` — the arguments are `lo, hi`, not `lo, thick` — refused with *a slab with no
thickness cannot carry a hole*. Rebuilt through `slab_over`, the gesture that assembles the real
one: **a fixture assembled by the production path cannot be wrong about the production shape.**
⚠ And the author has to stand ON the slab, because a footprint is placed *ahead* — `slab.keys`
records that refusal and a test at the origin would have measured it while believing it measured
the verb.

✅ 489 green both backends · 49/49 gates · `make parts` byte-identical · `probe/k2` **10 scripts**,
`slab` joined: `key Z` and `verb hole` give identical sentences (`slab hole kind 1 at (0,4)`) and
byte-identical worlds · `make probe-demo` PASS · seven sabotages red on their own test, two
controls clean.

⏭ **Three keys left**: `X C B` — and `X` is `slab`, the name this pair is already waiting on.

## ✅ `K3` · `E` — THE SLICE THAT STOPS THE PATTERN, and a second global standing in for the world, 2026-08-14

**`E` and `Q` are TWO verbs — `stair_up` and `stair_down` — and `30:` keeps its sign.** From the
outside they have the exact shape of the three families that collapsed before them: two keys, one
message, a payload that differs (`30:1`, `30:-1`). They do not collapse, and this tree's own rule
is what decides it: **a DIRECTION is part of the action** (*every editor has zoom in and zoom
out*), **a THING is not**. There is no `SELECT_STAIR` id and there will not be one.

⚠ **THE THIRD SLICE IN A ROW WOULD HAVE ARGUED FOR ONE.** `R` was hardcodable, `Y`+`T` collapsed,
`J`+`K`+`V` collapsed — and the pull by the fourth is to read *two keys on one message* as the
signal. It is not: the signal is what the payload MEANS. `raise`/`lower` have been two verbs since
`V1` for this reason, and `press_verb` now has the stair pair on the two lines below them so the
shape is visible rather than remembered.

⛔ **AND TWO GLOBALS WERE STANDING IN FOR THE WORLD IN ONE HANDLER — `J`'s FINDING, TWICE OVER.**
The walk reference was `py / HEIGHT_SCALE` and the stride was `cliff_step()` = `walker_step(W_UNIT)`,
a program constant. Both are 0.25 on the landscape, so **nothing could have gone red**; both are
wrong on a **part world**, where a tread came out at half the height a walker can climb — which is
the one promise this gesture makes. `stair_ahead` asks `w.w_unit`. ⚠ **The test asserts the RATIO**
(`door/slat`'s rule): the same tread rises the same distance in a world at 0.25 and one at 0.125,
where a number would need rewriting by anyone who touched `FIGURE_M`.

⚠ **AND THE COMMENT DEFENDING THE STRIDE HAD EXPIRED.** It said the step height is the caller's
because *"`cliff_step` is `moros_sim`'s rule … and `hex_editor` must not depend on a moros
package"* — but `cliff_step()` **is** `hex_editor::walker_step` and has been for a while. The
argument was true when written, the code beside it still worked, and nothing was red. Same shape
as the thumbnail mesher's expired reason two days ago. ⏭ **`12:`'s cellar stair still passes
`cliff_step()`** and carries the same latent part-world bug — it belongs to `B`/`C`'s slice, which
moves that handler the same way. **Recorded, not fixed here.**

⛔ **AND `E` HAD NO BOTH-SPELLINGS COMPARISON UNTIL ONE WAS BUILT.** `probe/k2` drove eight
scripts; `R` was in seven of them, the seats and annexes in two, and **`E` in none** —
`determinism.keys` is the only script in the tree that presses it. It is the ninth script now,
with its baseline taken from before `R` was converted. ⚠ **Adding it turned checks 3, 4 and 5
conditional**: they were unconditional and `continue`d, so the first script with no opening in it
would have had its whole run skipped. ⚠ **And it exposed a vacuous row** — *"and they name every
profile:"* printed with nothing after the colon, `0 == 0` reporting a clean result for having been
asked nothing.

✅ **AND LOCAL MODE CUTS A STAIR NOW** — the client's `E`/`Q` went from `wire()` to `act()`, so the
page answers with the gesture instead of *"'30:1' is a server message and this page has no gesture
for it yet"*. `R`'s capability gain, one key over.

⛔ **AND THE SABOTAGE SWEEP DESTROYED ITS OWN SUBJECT THE FIRST TIME IT RAN.** Its
`restore()` was `git checkout -- <src> <keys>` — correct only for a committed subject, and the
subject of a sweep is *by definition* the step just built. It deleted the whole gesture, and the
sweep then reported **five clean catches as five misses**: *NOTHING went red*, four times, which
reads as *these tests are useless* rather than *the feature is gone*. ⚠ **The control row was
blind too** — with the tests reverted alongside the code the suite still compiled and still
printed a result. The fix is three things, and the third is the one worth keeping: restore from a
**copy**, **commit before sweeping**, and assert the **subject is present** before row 0. Now in
CLAUDE.md.

⚠ **AND THE SCORER'S PATTERN WAS MATCHED AGAINST A KNOWN-RED RUN BEFORE IT WAS TRUSTED.** loft
prints `FAIL  tests/verb.loft::<name>  —  assertion failed: …` per test **and** `FAIL
tests/verb.loft  (1 failed, 14 passed)` per file, so the `::` is what separates them; a count
written from memory would have double-counted every failure.

⚠ **AND `make probe-demo` FAILED ONCE, UNDER LOAD, THEN PASSED FOUR TIMES.** The failing run was
concurrent with `make gate`'s eight parallel jobs. Its walk checks are clock-driven — `G1` measured
**2.56** wu on that run and **2.35** on a quiet box — so it is `H2`'s shape again: a threshold over
a number the machine moves. **Not investigated further and not silently forgotten** — recorded
here because *ran it again and it passed* is the sentence that hides a flake.

✅ 486 green both backends (14 packages, identical counts on each) · 49/49 gates, and the `deck`
gate is the positive control — it cuts through `30:` and still says `stair +1 at 1,0 height 4 from
0` · `make parts` byte-identical · `probe/k2` **9 scripts**, determinism `key E` against `verb
stair_up`: 14 identical sentences, world `23d3f79779eb` 24727 bytes both ways · `make probe-demo`
PASS · seven sabotages red on their own test, with two controls.

⏭ **Four keys left**: `Z X C B` (`Q` is bound and pressed by no script).

## ✅ `K3` · `J` — THE THIRD FAMILY, and a global that was wrong on a part world, 2026-08-14

**`J`, `K` and `V` are one `annex` verb, and `53:<kind>` holds the choice.** Three keys on ONE
message (`37:0` a bedstee, `37:1` a balcony, `37:2` a cupboard). Same shape as the seats, so `J`
could no more be taken alone than `Y` could.

⚠ **THE THIRD KIND IS NOT A STORED KIND, WHICH IS WHY IT HAS ITS OWN NAME.** `AN_BOX` and
`AN_DECK` are what an `Annex` *is* and pass straight through; `ANX_CUPBOARD` selects a different
CONSTRUCTION — hosted on the last box rather than on a wall — whose result is itself an `AN_BOX`.
Calling it `AN_CUPBOARD` would invite somebody to store it.

⛔ **AND THE HANDLER PASSED `hex_proj::HEIGHT_SCALE` WHERE THE WORLD'S OWN UNIT BELONGS.** The
library's note at `author_on` had said so for months: *"the same number (0.25) kept as a global …
and **wrong on a part world** — a world's own unit is the only answer that survives leaving the
landscape."* Identical on the landscape, so nothing could have gone red. Fixed in passing;
`hex_mesh` had the same substitution.

⚠ **THREE REGISTRIES MOVE AND THE MIDDLE ONE IS A REBUILD.** `es_awalls` is emptied and
re-derived, not appended to, because adding an annex can change a NEIGHBOUR's handedness — a
driver that appended would draw the wrong walls and report success.

⛔ **AND MY OWN TEST OF THE UNIT FIX WENT RED ON CORRECT CODE.** It asserted `op_hi` — and a mouth
is crowned at a fixed head in BOTH worlds, because `annex_mouth`'s recorded rule is *"an arch's
CROWN is what has to clear … the springing is derived from the crown down."* `op_spring` is where
the unit lands. I quoted that rule in the test's own comment and still reached for the field that
cannot see it.

✅ 482 green both backends · `probe/k2` 8/8 with two more checks (`annex.keys` walks kinds `0 2 1`)
· 49 gates · `probe-demo` PASS · seven sabotages red on their own test. ✅ **And `furnish.keys` now
runs headless END TO END** — its bed was refused an hour ago because `J` had no verb.

⏭ **Five keys left**: `E Z X C B` (`Q` used by none).

## ✅ `K3` · `Y` — THE SECOND FAMILY COLLAPSES, and one instrument was blind by construction, 2026-08-14

**`Y` and `T` are one `seat` verb, and `52:<kind>` holds the choice.** They were two keys on ONE
message (`38:0` a bed, `38:1` a figure) differing by the *thing seated* — which is `O`…`M`'s
situation and takes `O`…`M`'s answer. This file's own rule decides it: a DIRECTION is part of the
action (`raise`/`lower` stay two verbs forever), a THING is not.

⚠ **SO `Y` COULD NOT BE DONE WITHOUT `T`.** `run` was hardcodable because `R` was the only key on
`25:`; here both keys are on one message, and giving each its own verb would ship the flattening
`EDITING_MODES` calls a shipped mistake and then undo it.

⛔ **THE SEATING WAS ALREADY THE LIBRARY'S AND THE ASSEMBLY WAS NOT.** `seat_bed`/`seat_statue`
were called from `editor_server.loft` **directly** — so five green tests measured them while
*which of the two*, the **`es_props` append** and the two sentences existed at exactly one driver.
The append is the one that matters: nothing about a seat reaches the store.

⚠ **WHICH MAKES `w_tau` AND THE SAVED WORLD BLIND BY CONSTRUCTION.** `probe/k2` check 2 compares
`.hxw` files and **stayed green** under a deliberate mis-transcription of a statue as a bed —
measured, not assumed. The sentences (check 1) and the kinds (new check 8) are what can see it.
That is the `Surface` lesson in miniature: when the usual instrument cannot answer, the answer is
a second instrument.

⚠ **AND `probe/k2` WENT RED FOR SUCCEEDING FIRST.** A converted script SAYS what the key implied,
so it prints one extra `seat N selected`; `K2a` had already excluded `opening N selected` for the
same reason. The exclusion is a coverage MOVE — checks 5 and 8 hold what it drops.

✅ 476 green both backends · 8/8 scripts in `probe/k2` (identical sentences, byte-identical worlds)
· 49 gates · six sabotages red on their own test. ⏭ **Nine keys left**: `J E Z X V K C B` and `T`
is done with `Y`.

⛔ **AND `loft test a.loft b.loft` SILENTLY RAN ONLY `a.loft`** — reported `ok. 1 file`, exit 0,
with a failing test in `b.loft`. Caught mid-sabotage-sweep: four sabotages were confirmed against
`session.loft` and the `verb.loft` half never ran. [loft#916](https://github.com/loft-lang/loft/issues/916).

## ✅ `K3`'s FIRST SLICE — `R` IS A VERB, and the wrapper that was there hid the gesture, 2026-08-14

**`verb_of("R")` names `run`, and `hex_editor::session_run` is the whole gesture.** All 22 `key R`
lines across `tools/scripts/*.keys` now say `verb run`; `probe/k2` drives both spellings through a
server and gets **identical sentences and byte-identical worlds on all eight scripts**.

⛔ **AND `session_wall` WAS THE DEFECT WEARING A WRAPPER'S CLOTHES.** The library already had the
two-press *machine* — and only the machine. The stamping (which material lays which shape, at what
grade, into which registry) stayed in `editor_server.loft`, so `session_wall` had **four callers and
every one of them was a test**. It read as coverage because those tests were green: they measured a
draft, and *a run writes something* had no headless test at all.

✅ **THREE THINGS BECAME POSSIBLE AT ONCE, AND NONE NEEDED NEW CODE.** `editor_run` lays walls
headless (*"wall laid 20 edges, heading 0 of 24 (snapped, residual 0°), length 8"*, the server's own
sentence because it is the server's own function); the demo's **most-pressed key stopped being its
deadest** — `R` was 22 of 40 presses and local mode answered *"'25:' is a server message and this
page has no gesture for it yet"*; and `probe/k2`'s header sentence about the runner being unable to
stand in became false, which is how it was noticed.

⚠ **`run` IS NOT `wall`** — `G` rings the author (a cylinder, stored as edges, no ends) and `R`
walks a line between two presses. They share a material and nothing else. ⚠ **And it is the only
verb whose first press writes nothing**, which is why `local_act` now prints the gesture's SENTENCE
beside its count: `local run — 0` is a success that reads exactly like a broken key.

⚠ **A TEST'S OWN COMMENT CLAIMED A SABOTAGE IT DID NOT CATCH.** `…_is_not_the_ring_verb` pressed `R`
twice against `G` once and stayed **green** with `run` wired to `ring_set` — two rings differ from
one ring for a reason that has nothing to do with the verb. Same poses on both sides is the fix.
⚠ **And a LENGTH is not a content comparison**: the material test first compared
`len(world_to_bytes(…))` and went red on a correct gesture — both worlds encode to **32952 bytes**.

⏭ **Ten keys left**: `Y T J E Z X V K C B`.

## ⛔ `K3` IS SIZED, NOT DONE — and a key meant two things, 2026-08-14

**`K3` is *drop the `key` spelling from scripts*, blocked on keys with no verb — and the scripts use
ELEVEN** (`R Y T J E Z X V K C B`; `Q` by none). Each is a `do_*` handler of ~35 lines of logic plus
~14 of plumbing, and ⚠ **every underlying gesture is already in `hex_editor`** — the work is the
ASSEMBLY, eleven times. ⏭ **`R` first: 22 of the 40 non-arrow presses**, and its state
(`sess.es_draft`) already lives in the session.

⛔ **AND STARTING IT FOUND A COLLISION `B2e` HAD SHIPPED.** The client's part-cycling was bound to
`k`, which is **BALCONY** in `script.mjs`'s KEYMAP — a script saying `key K` and a person pressing
`k` would have done different things: **the four-sites defect rebuilt by hand.**

⚠ **THERE IS NO FREE LETTER**: 21 in the script's table, 5 in the client's movement and mode keys,
**all 26 taken**. The strongest argument yet for EDITING_MODES's rule that bindings are DATA.

⛔ **AND `.` IS UNREPRESENTABLE TO THE PAGE.** `mapKey` handles `Key*`, `Digit*` and eight named
keys and **returns 0 for everything else** — punctuation is unreachable, and a press cannot be told
from no press. It showed up as the demo **placing a house**, which is what *nothing was chosen*
looks like. It is `Tab` now. ⚠ `probe/b1b/press.mjs` needed a row too: its CDP spelling is a LETTER
heuristic (`'Key' + upper`), so there is no `KeyTAB`.

## ✅ ATTACHED MODE PLACES A PART — and the client was sending the wrong message, 2026-08-14

**`51:<name>` chooses, `32:` places what was chosen.** Against a live server: `part 'door/doorway'
chosen`, then `placed 'door/doorway' — 9 cells at (0,0)`. `B2e`'s recorded asymmetry is closed.

⛔ **THE CLIENT WAS SENDING `44:`, WHICH IS PART *MODE*.** `B2e` wired the choosing key's attached
branch to it on the assumption that it placed a part — it OPENS A PART FOR EDITING, so the key would
have swapped the author's whole world for a door. ⚠ **Nothing could have gone red**: there was no
attached path to exercise, and both ids are honestly *a message about a part*. Found by reading the
server's id table.

⚠ **AND `MSG_HOUSE` NEEDED ONE ARGUMENT, NOT A HANDLER**: it already went through `press_verb`
(`V2a`), so attached placing was `parts_root()` passed at one call. Without it the gesture refuses
with *"this driver has no part library"* — the defaulted root doing exactly what it was built for.

⚠ **`51:` AND `14:<roof>,<part>` ARE BOTH KEPT.** `14:` names the part IN the placement, which is
what a SCRIPT wants (one replayable line, and why `*.keys` can be diffed); `51:` is choose-once,
which is what a PERSON wants. Both end in the same `part_place`.

⚠ **AND CYCLING READS ONE LIST**: `part_names_of(st.mats)` takes the part rows out of the catalogue
string, which local mode composes and the server sends — so the panel's rows and the cycling order
are the same list by construction. The page's own `part_names` vector is gone.

## ✅ THE DEMO PLACES A PART — and no SELECTION existed anywhere, 2026-08-14

**`k` steps the catalogue, `h` places the chosen part instead of the procedural house.**
`local part 'door/doorway' chosen`, then `local place — 9 · world 8277:3726603134` — where the
house at that same pose is **27 cells and `41145:1306471549`**. `make probe-demo` is 25 checks.

⚠ **THE GAP WAS NOT "LOCAL MODE CANNOT PLACE" — NOTHING COULD CHOOSE.** No selection existed in the
client, the server or the session; the catalogue was a list you could look at and not pick from. So
this is `S2a`/`S2b` one family over, and ✅ **`place` now produces what is chosen** — `S3`'s collapse
again: nothing chosen builds the procedural house exactly as before, so every driver, every script
and `B1a`'s committed world are untouched.

⚠ **THE LIBRARY ROOT IS A DEFAULTED PARAMETER ON `press_verb`, NOT SESSION STATE.** A session is a
driver's STATE; a library root is its CONFIGURATION, and the two drivers read from different places
— a disk and a baked base tree. Defaulted to `""` for the reason `cliff_edges` defaults its step:
**all 28 call sites untouched**, and a driver with no library gets a refusal NAMING the missing
library rather than silently building something else. ⚠ And **cycling is the driver's, the name is
the session's** — stepping the catalogue needs the LIST, the gesture needs only the name.

⛔ **THE SAME INSTRUMENT MISTAKE, A THIRD TIME.** `Q2` shipped saying *"place built F4's own house
world — the selection changed nothing"* about a run where **nothing was placed**. `G2` and `P2` each
needed that same correction already. **Three outcomes, not two**: *nothing built* is "this run
cannot say". It is now written as the default shape in that file rather than as a correction applied
after the fact.

⛔ **AND `H2` WAS A FLAKY CHECK ALREADY SHIPPED.** It asserted *a fall completed* on three
consecutive passes (1, 2 and 3 landings) — a coin coming up heads three times. At 44 presses the
walker reaches the CREST about half the time: feet up, `landed` 0, nothing to fall off. ✅ Sixty
presses clear it — **28 and 20** landings over two runs. ⚠ **A number that is sometimes 0 and
sometimes 3 was never a threshold**; it was the fixture ending mid-climb, and the check could not
tell that from a fall that did not happen.

⏭ **ATTACHED MODE STILL CANNOT PLACE A PART**: `44:` has no client binding (recorded for months) and
the server holds no selection to send one to. **Pre-existing, not introduced here** — closing it
means giving the server `es_part` and a message to set it.

## ✅ THE DEMO'S CATALOGUE HAS PICTURES — and an argument that had expired, 2026-08-14

**20 part thumbnails and 11 material swatches**, composed by the page from its own baked library:
`local thumbnails — 49 meshes for 20 parts`, and `20 thumbnails rendered … 0 thumbnail meshes
arrived, 49 held, 20 cameras`.

⛔ **THE SERVER'S REASON FOR OWNING THIS HAD EXPIRED AND NOTHING NOTICED.** It argued that a client
could not mesh a part because *"four of a chunk's nine surfaces come out of `chunk_mesh_props`,
which lives in THIS file … a thumbnail that looked like a lawn."* **That stopped being true at
`B1b.2c.3`** when the props mesher moved to `hex_mesh` — and the comment sat beside code that still
worked, so nothing was red. ⚠ The other half is still load-bearing (*one projection path, not two*),
which is why the camera fit moved WITH the meshing rather than being re-derived.

⚠ **AND `THUMB_W`/`THUMB_H` WERE IN THREE PLACES** — server, client, and nothing making them equal.
The server builds the PROJECTION from its pair and the client allocates the TEXTURE from its own, so
a drift is **a picture stretched by the ratio of two constants nobody compared**. ⚠ `THUMB_AMB` stays
in the client: the canonical LIGHT is the drawer's.

⚠ **THE PAGE COMPOSES THE SAME WIRE RATHER THAN A SHORTCUT.** Encoding to text and parsing back in
one process is waste and is the deliberate choice: `add_thumb_cam`/`add_thumb_mesh` are the client's
ONE path into its thumbnail store. ✅ **And `arrived` is what says where they came from** — that
counter belongs to the `Y:` handler, so a local page leaves it at **0** while `held` and `cameras`
rise. `P3` asserts both; `DEMO_SABOTAGE=noparts` is red on `P1`/`P3` and green on `P2`.

⛔ **TWO MECHANICAL LESSONS.** **Deleting by line offset is unsafe once earlier deletions have
shifted the file** — the first attempt ate **`skin_check`**, unrelated to thumbnails; restored from
git and redone BY NAME, touching only declarations and never adjacent comments. And **the compiler
settled where the code lives**: a `thumb.loft` module cannot call `chunk_meshes_all`, because *"a
`use` imports the used file's names into the file that used it, never the other way round"* — so it
sits in `hex_mesh.loft` itself.

⏭ **STILL MISSING: PLACING a part in local mode.** The catalogue can be seen and selected; the
gesture that puts one in the world is next.

## ✅ THE DEMO CARRIES ITS PART LIBRARY — and a MODULE name is a namespace, 2026-08-14

**`build-pages.mjs` bakes `data/parts/` to `/data/parts`** as a `globalThis.loftBaseFS` prelude — 23
files, 326 KB raw, 437 KB encoded on a 5.8 MB page — and the page **reads 20 parts back out**,
matching the interpreter's own answer for the real directory. `make probe-demo` is 22 checks.

✅ **PLAN 22's OPEN QUESTION 2 IS ANSWERED WITH A NUMBER**: ship the WHOLE library — 326 KB against a
5.4 MB engine is 6 %, and a starter set would be a second list to keep in step for nothing.

⚠ **THE MEASUREMENT CAME FIRST: CAN A PAGE LIST A DIRECTORY IT WAS GIVEN?** `P6` proved `list_dir`;
**`part_list` also needs `is_dir`**, which nothing had asked — and it returns nothing at all without
it, so a demo whose library is present but unreadable looks exactly like one with no library.
`probe/b1c/parts.mjs`: **20 and 20** against the interpreter.

⛔ **A MODULE FILE NAME IS A NAMESPACE TOO, AND THE DIAGNOSTIC NEVER SAYS SO.** The new module was
`catalogue.loft` and **`hex_part` already has one** — the result was `part_list` unresolvable *from
inside my own file*, with an error naming the FUNCTION and never the collision. It is
`choices.loft`. **CLAUDE.md records this for STRUCT names; it is true of modules, and this is the
first time the tree has hit it.**

⚠ **THE CATALOGUE IS SHARED RATHER THAN COMPOSED TWICE.** The client keeps the catalogue *as the
server sent it* because *"a list the client composed would be a list of what it believes the
renderer can draw"* — and local mode has no server. The answer is that **neither program composes
anything**: `KIND_MATERIAL`, `KIND_PART`, `surface_block`, `part_availability` and `catalogue_wire`
are `hex_mesh::choices`'s. ⚠ The two KIND constants had been declared in BOTH programs, one
composing the string and one parsing it. ⚠ It landed in `hex_mesh` because of an arrow, like
`ground_under`: `hex_mesh` depends on `hex_editor` so a catalogue there is a cycle, and
`lavition_ui` declares an **empty dependency list as its claim**.

⛔ **AND THE SABOTAGE CAUGHT MY OWN CHECK OVERCLAIMING.** `DEMO_SABOTAGE=noparts` left `P1` red and
**`P2` GREEN** — its 11 swatches are the MATERIAL rows, which exist whether or not a part was baked.
It now says *"the panel took it: 11 material swatches (⚠ blind to the parts)"*.

⏭ **THE PAGE LISTS PARTS IT CANNOT DRAW A PICTURE OF** — thumbnails are next. ⚠ And the server's
stated reason for meshing them (*"four of a chunk's nine surfaces come out of `chunk_mesh_props`,
which lives in THIS file"*) **expired at `B1b.2c.3`** when that mesher moved to `hex_mesh`.

⚠ **AND `D0`'s CLAIM WAS RESTATED RATHER THAN LOOSENED**: the demo cannot be `cmp`-equal to the
served page now, so the check asserts **every engine byte present, in order, with one contiguous
prelude in front**.

## ✅ THE MESHER MEASURES IN THE WORLD'S OWN UNIT NOW — 2026-08-14

**Every height in `hex_mesh` is `w_unit`**; all 72 sites multiplied by the global `HEIGHT_SCALE`
(0.25) before, so a world authored at any other unit was drawn at the wrong size.

⚠ **ONE PART IS AFFECTED AND IT IS REAL.** Read from the files rather than the comment that claimed
it: **`door/slat` is 0.125, all nine others are 0.25.** ⚠ And the bug is narrower than it sounds —
`hex_part` already REFUSES a cross-unit composition (`BK_UNIT`/`EX_UNIT`: *a part at a different
unit is a LIMB, posed at the ratio, or it is nothing*), so the global bit only where a part world is
**meshed directly**: thumbnails and part mode. Measured before any edit, `door/slat` spanned
**0.1667** of world height where its own unit says 0.0833.

✅ **THE PREDICTION WAS WRITTEN FIRST AND MATCHED EXACTLY**: slat halves to 0.0833–0.1667, `door/leaf`
at 0.25 does not move. `probe/b1c/slat.loft`.

⛔ **IT HAD TO BE ALL-OR-NOTHING, AND THE FIRST ATTEMPT PROVED IT.** `ground_under` alone on `w_unit`
was strictly WORSE than the global — its terrain branch defers to `terrain_y`, so converting one and
not the other put a floor and the ground beside it on two scales. **A half-converted mesher is worse
than an unconverted one.**

⚠ **WHAT MADE 72 SITES SAFE**: every function with a world binds it `wld` (measured — 15 functions,
50 sites, one spelling), and the seven helpers without one are **private to the file** (0 callers
outside), so a `unit: float` parameter changed no public API. **The compiler named every remaining
site** — including two parameters my insertion dropped into a function BODY instead of its
signature. A sweep over a 3,000-line file is a substring match, and that is the third time in two
days it bit.

⚠ **THE TEST ASSERTS A RATIO, NOT A HEIGHT** — *the same cells at half the unit are drawn at half the
height* — because a number would need rewriting by anyone who touched the geometry. Seen red against
the saved pre-change mesher (**3.6667 at both units**), green after.

⚠ **AND NOTHING ELSE COULD HAVE SEEN IT**: `make parts` byte-identical, 48/48 gates, both suites
green either way. **A constant right for every fixture anyone has built is a constant no fixture can
test.**

## ✅ `B1c.3` — THE PAGE FALLS: TWO GRAVITIES BECAME HONEST BY BECOMING TWO PACKAGES, 2026-08-14

**`hex_mesh::ground_under`** answers what is under the feet for both drivers, and
**`hex_editor::fall_step`** evolves them. `B1c` is closed.

✅ **VERIFIED**: `make lib-test` 22 suites on both backends, `make probe-demo` 20 checks, and
`DEMO_SABOTAGE=noraise` red on **`H1`/`H2` alone** (17.28 units on flat ground, `feet 0 landed 0`).
Test-name diff: **moros_sim 303/25 → 295/24**, **hex_editor 452/43 → 461/44** — the extra one is the
gravity PIN. ✅ **hex_mesh is 72/10**: `ground_under` arrived with no tests of its own and now has seven.

⛔ **AND WRITING THEM FOUND THE MOVE'S OWN MISTAKE.** `ground_under`'s height scale was rewritten to
`wld.w_unit` when it moved — the walk's argument, sound where the walk applied it. **Wrong here**:
this function has two branches, and the terrain one defers to `terrain_y`, which like every vertex
this mesher emits is on the **global**. `w_unit` put the branches on two scales, so on a part world a
floor would read **half** what the ground beside it read — a 2× discontinuity inside one world. ⚠
**Nothing where it shipped could see it**: every editor world is 0.25 and so is the global, so both
suites, the gates and the demo agree either way. The test that sees it asks on **two worlds of
different units**, and asserts *the terrain branch equals `terrain_y`* — the invariant that survives
whichever scale is eventually right. ⏭ The real finding is package-wide and not this step's:
**`hex_mesh` measures every height with a global constant, so a part world authored at 0.125 is
meshed as if it were a landscape.**

⚠ **AND A STOREY GOES UNDERNEATH, WHICH THE FIRST FIXTURE GOT BACKWARDS.** Measured
(`probe/b1c/gu.loft`): after `storey_add` the column's ground-layer index moves **0 → 1** — the
terrain stays the ground and the new layer is a floor **below** it. Two tests asserted the opposite
and went red saying *"a storey's surface is reported as the GROUND layer"*, which was the fixture,
not the predicate. **A test that fails is not yet a defect; the probe is what says which side
moved.**

⛔ **THE CYCLE THE WALK DID NOT HAVE, THE FALL DOES.** `walk_to` never asks for the ground; the fall
asks every tick — and `ground_under` needs `terrain_y`, which is `hex_mesh`'s, while **`hex_mesh`
depends on `hex_editor`**. ✅ **So it went the other way**: into `hex_mesh`, beside the `terrain_y`
it defers to. Both drivers already depend on it, no arrow moved, and neither re-derives what a foot
stands on.

⚠ **THE GRAVITY WAS THE REAL QUESTION, AND THE OLD NOTE WAS RIGHT.** `fall.loft` imported
`player::GRAVITY` under *"a package with two gravities is a package where a jump and a fall
disagree"* — caught once with an invented 11.0 beside a shipped 12.0. **What changed is that they
are now two packages for two world models**: `player_step` falls in a `Map` (still live), this one
in a `VoxelWorld`, and the old note named its own end — *when the two world models converge, one of
these goes*. A second declaration for a second world model is honest; for the same one it never was.

⚠ **AND THE PIN IS A TEST, NOT AN IMPORT.** Nothing makes them equal — the arrow forbids either
importing the other — so each side types out its number with a test that reddens on drift and names
the other. **Loud rather than prevented**, which is the honest description.

⛔ **THE NAME CHECK MISSED THEM: ITS THIRD BLIND SPOT IN TWO DAYS.** The grep matched
`(pub )?(fn|const|struct) NAME` and `player.loft` writes **`pub GRAVITY = 12.0`, with no `const`** —
so it reported FREE. *A declaration form the pattern does not know is a declaration the pattern
says is absent.* After `lib/*/tests/` (`B1c.2b`) and the excluded file (`B1b.2c.2`). ✅ The names are
`FALL_GRAVITY`/`FALL_TERMINAL` anyway — `WALK_SKIN`'s lesson applied *before* it bit.

⚠ **AND A TEST FILE COLLIDED AGAIN, FROM THE OTHER DIRECTION**: `tests/fall.loft`'s own `fabs`
against **`hex_form::fabs`**, a name a *dependency* publishes. `WALK_SKIN` was a library name hitting
a test's; this is a test's hitting a dependency's.

⛔ **AND THE FIRST TWO FIXTURES MEASURED THE WRONG THING.** Walking 3.3 units after a raise found
flat ground, because **the brush lands ten hexes ahead**. Then *three* raises made a step of ~11
height units against a cliff threshold of **4**, and the walker climbed on and **stopped dead** —
fenced on the plateau by its own cliffs, `cliff.loft`'s recorded cost reproduced. **One** raise is a
walkable slope: the feet rise 0.10 → 0.54 → 1.13 → 1.40 and land three times. ⚠ `landed` is the
claim, not the height — a height that tracks the terrain is the CLIMB, which a plain lookup would
also produce.

## ✅ `B1c.2c` — THE PAGE WALKS, AND THE VERDICT IS A WORLD, 2026-08-13

**`make probe-demo`'s G block**: six `w` presses put the author at **(2.454, 0)**, and the house it
then places is **`32920:1885399240`** where the same house standing still is `41145:1306471549`.

⚠ **THE DISTANCE IS NOT THE CLAIM.** A page whose walker updated a pose nothing consulted would
report a distance and a position exactly like this one, with every picture right — the
built-and-never-called defect wearing a walker's clothes. `G2` reads a **world**, against a
baseline the same run measures at `F4`; `DEMO_SABOTAGE=nowalk` lands on `41145:1306471549` exactly.

⛔ **AND THE G RUN ITSELF WENT RED ONCE, ON JITTER `B1c.1` HAD ALREADY MEASURED.** Its single `d`
press was **3** fixed steps rather than 4, so the facing stayed at rot 9, the place was refused and
there was no world to compare. `F` already retried; `G` does now. ✅ **`G2`'s third outcome is what
made it legible** — it said *"no house was placed … the turn may have landed short"* rather than
blaming the walk. **The instrument diagnosed its own harness.** ⚠ And my own reading filter nearly
hid it: the grep matched `^   [DFGE][0-9]` while a failure prints as `   ✗ G2 …`, so **the one line
that mattered was the one the filter dropped** — the exit code said so anyway. *A summary filter
shaped around the passing case cannot report the failing one.*

⛔ **AND THE FIRST `nowalk` WENT RED FOR THE WRONG REASON** — one `d` press left the turn short of an
admissible facing, so **no house was placed** and `G2` said *"the same world"* about a run with no
world in it. It retries now, and `G2` has **three outcomes**: no house is *"this run cannot say"*.
**An instrument must not describe a failure it did not measure.**

✅ **AND THE WALK QUANTISES AS THE TURN DOES, over three runs**: the distance is browser-dependent
(**2.2406, 2.3473, 2.4540** units for the same six presses) and the world is `32920:1885399240`
every time. A footprint takes the cell.

⚠ **A SEEMINGLY IDENTICAL WORLD WAS THE FIRST RESULT AND IT WAS CORRECT**: two `w` presses is ~0.75
units and the author had not left the hex, so the footprint landed on the same cells. **A footprint
is placed on the LATTICE** — the same quantisation `B1c.1` found in the turn.

⚠ **THE PAGE OWNS THE CACHE, NOT THE WALK.** `walk_to` and `edges_walk` are `hex_editor`'s; what the
page keeps is the proxy cache, keyed on the server's own three terms (cell, edit clock, walker
LEVEL — the third because stepping off a deck changes the level without changing the cell), and
`LOCAL_COLL_R` is the server's 8 because **a walker seeing a smaller window could cross an edge the
server blocks**.

⚠ **AND THE SPEED HAD TO MOVE, ALL THREE.** `WALK_MS`, `WU_PER_M` and `FIGURE_M` were the server's;
the third is the one that would have been missed, because the collision set needs *how tall a step
this walker can climb* and a page reaching for `CLIFF_STEP_DEFAULT` (6) instead of this walker's own
(**4**) would climb ledges the server refuses — **which no world digest could see**, since nothing
is written differently until somebody walks. `tests/pose.loft` asserts the 4 and asserts it is not
the default.

⏭ **WHAT IS LEFT: `B1c.3`, THE FALL.** The page's feet take the cell's stored height (`author_on`)
where the server integrates a fall. Coherent rather than crippled — cliff edges block, so a page
walker cannot leave a plateau — and where gravity lives is the open design question.

## ✅ `B1c.2b` — THE WALK IS THE LIBRARY'S, AND THE BLOCKER DID NOT EXIST, 2026-08-13

**`hex_editor::walk`**: `wall_stops_walk`, `wall_stops_view`, `walk_h`, `edges_walk`,
`edges_around`, `SKIN`, `stand_clear` and `walk_to` left `src/editor_server.loft` —
**7,743 → 7,400 lines**.

⛔ **THE BLOCKER THIS STEP WAS SIZED AROUND DOES NOT APPLY.** Both this file and the plan recorded
*"`ground_under` → `hex_mesh::terrain_y` is a cycle, so the driver supplies a height sampler"*.
**`walk_to` never calls `ground_under`** — only the FALL does. The walk's own surface question is
`walk_h`, which asks `world_surface` and falls back to `hex_editor::terrain_h`, already this
package's; `edge_layer`, `WALL_MAT` and `FENCE_MAT` were already here too.

> ⚠ **A cone measured from the wrong seeds sizes the wrong step.** `ground_under` was in the sizing
> because it sits in the TICK beside the walk, not because the walk calls it. **Seed a cone from
> the function you are moving, never from the block it sits in.**

✅ **THE MOVE IS VERBATIM AND THE DIFF SAYS HOW VERBATIM.** Code lines only, body by body against
the previous commit: `walk_to` (45 lines), `stand_clear`, `walk_h`, `SKIN` and both `wall_stops_*`
**IDENTICAL**. Seventeen lines changed, in two functions, for three reasons: `edges_walk` takes
`step_max` (the library's own seam — *how tall a step a creature can take is a property of the
CREATURE*), `HEIGHT_SCALE` → `wld.w_unit` (the global is wrong on a part world; both are 0.25 in
every landscape the editor makes), and `hex_to_world(q,r,0)` → `hex_to_px` (it *is* that, wrapped
in a `Vec3` — taking the wrapper would make **`graphics` a dependency of the walk**).

⚠ **AND THE GATES ARE THE OTHER HALF, because a diff cannot see a threading mistake.**
`make gate-character` 8/8, numbers unmoved to three decimals: `climbed 0.492`, `peakReached 0.497`,
`steepestWalkedDegrees 30`, `fenceAt 6.062`.

⛔ **AND A PUBLISHED `SKIN` BROKE THE PACKAGE — the name check excluded the directory the collision
was in.** `walk.loft` published `SKIN` (0.01, a walker's clearance off a wall) and
`tests/boom.loft` already declares its own (0.20, the camera boom's). The grep searched
`lib/*/src/`, `src/` and the registry — **not `lib/*/tests/`** — which is `B1b.2c.2`'s *a grep's
exclusion is an assumption* repeated one directory over, in the same session that wrote it down at
`B1c.2a`. ⚠ **A test file declares into the package's namespace.** ⚠ **And the count lied in the
informative direction**: the suite reported **436**, not 446, because a parse error takes the whole
file out — **a test count that DROPS is a file that did not run**, and it reads as a smaller suite
rather than a broken one. Renamed `WALK_SKIN`; all 22 published names re-checked against `lib/`
including tests, `src/`, `../loft-libs-world/` and the registry.

⛔ **A `sed` TOOK OUT THINGS THAT MERELY CONTAINED THE NAME.** Qualifying every `SKIN` also rewrote
`CAM_SKIN`, `CAM_SHOULDER` and six comments (*`A-hex_editor::SKIN` at the hip*). The compiler
refused the code, which is the lucky half — **the comments would have shipped**. A bulk rename over
a whole file is a substring match, and a constant whose name is a prefix of another is where it
bites.

## ✅ `B1c.2a` — A DEBT WRITTEN DOWN TWICE, AND THE WALKER IS WHAT PAID IT, 2026-08-13

**`cliff.loft` is `hex_editor`'s** — 130 lines, 3 public functions, its 10 test fns with it. The
walk is arriving in that package, and a walk that consults cliffs cannot reach a Moros one.

⚠ **BOTH SIDES HAD ALREADY WRITTEN THE NOTE.** `cliff.loft`'s header named `hex_edge`'s shared
layer as its target home and said it sat in `moros_sim` only because *"the shared tree is another
agent's and moving it is an ask rather than a task"*; `gesture.loft`'s `stair_cut` said the mirror
— *"it came from `moros_sim::stair_height` — a MOROS package — and this is a lavition one, so
taking the dependency would point the arrow backwards"* — and worked around it by taking the step
height as a parameter. **Neither could pay it alone.** ⚠ `hex_editor` is a WAYPOINT: the stated
target home is unchanged.

⚠ **AND THE GREP WAS THE RIGHT ONE, WHICH IS `B1b.2c.2` APPLIED RATHER THAN RE-LEARNED.** That step
concluded five primitives had one consumer *from a grep that excluded the file they lived in*. This
one searched the whole tree including `moros_sim` for all five public names: `cliff_edges` and
`fall_step` are called by that package's **own tests** and by the server, and by nothing in its
`src/` at all. ⚠ **`hex_edge` left the manifest with it** — `cliff.loft` was the package's only
user, so a real dependency became a stale one in the same commit.

⚠ **THE TEST-NAME DIFF WAS OFF BY ONE, AND THE ONE IS THE FINDING.** Predicted `-9`, measured
`-10`: the file has 9 `test_*` functions and a zero-argument helper `flat()`, **which the runner
counts and runs as a test**. hex_editor **436/42 → 446/43**, moros_sim **313/26 → 303/25**. *A
count of what you meant is not a count of what the tool sees.*

⏭ **AND ONE OF ITS DEFERRALS HAS TRIGGERED, RESOLVED SOMEWHERE ELSE.** Its symmetric block was
survivable *"only because … the asymmetry becomes observable the day a walker can descend faster
than it climbs, which needs a FALL. There is none yet."* There is now — and `walk_to` resolved the
direction at the CALLER, comparing both surfaces at the walker's own reference. Corrected in place.

⏭ **WHAT IS LEFT OF THE WALK: `B1c.2b`, 262 lines and ONE blocker.** `ground_under` needs
`hex_mesh::terrain_y` and `hex_mesh` depends on `hex_editor` — a cycle — so the driver supplies a
height sampler, which is the shape `edges_walk` already takes its terrain by. ⏭ **`B1c.3` is the
FALL and it is deliberately last**: `fall_step` imports `player::GRAVITY` under *"a package with
two gravities is a package where a jump and a fall disagree"*, so where gravity lives is its own
design question — and **without a fall the page's walker is coherent rather than crippled**, because
cliff edges block, so it cannot leave a plateau in the first place.

## ✅ `B1c.1` — THE DEMO BUILDS A HOUSE: A CONTINUOUS TURN, A QUANTISED GESTURE, 2026-08-13

**`make probe-demo`'s F block presses `h` before anything has turned, gets the refusal that has
stood in front of this page since `B1b.1b`** — *"a footprint at this facing has no mitred corners;
turn one step" (rot 9 of 12, offer 8)* — **then turns, then places 27 cells.** One run holds both
halves: the negative control is the first key of the same sequence.

⚠ **THE TURN IS THE HALF A HOUSE WAS WAITING ON, AND THE HALF WITH NO BLOCKERS.** `B1c` was left
unsized because *the walk* is a design question; the turn is not part of that question — it touches
no world, no terrain, no collision and no `moros_sim`. `hex_editor::pose` owns the held-key table
(`HELD_*`, `turn_dir`), the rate and the step; 9 tests, 3 sabotages red in different places.

- ⚠ **A FRAME TIME IS THE OBVIOUS `dt` AND IT IS THE WRONG ONE.** The page runs the server's fixed
  step (`hex_editor::TICK_US`, a backlog worked off one step at a time) because the server's own
  comment records paying for the alternative — *a loaded box took ONE tick that moved the walker as
  far as five*. A page on its frame time would turn differently on every machine **with every test
  green**.
- ⛔ **AND THE CLOCK CAN BE BLIND, MEASURED BEFORE IT WAS USED.** The page binds
  `loft_host_time_ticks_us()` to `performance.now() * 1000` — and carries a shim filling any
  *unbound* name with a constant, that one's being **`0`**. A missing bridge would leave the page
  drawing perfectly and standing still. The walker says so once, when keys are held and no step is
  consumed.
- ⛔ **AND THE DEAD-CLOCK GUARD WAS BROKEN IN EXACTLY THE SITUATION IT WAS WRITTEN FOR.** Keyed on
  `tick_at == 0` as its *first pass* test, it returned early on every frame of a page whose clock is
  stuck at zero — the one page it exists to catch. It is a `tick_begun` flag now: **the first pass
  is a fact about passes, not a value the clock happens to have.** Found by reading, with nothing
  red, so `DEMO_SABOTAGE=deadclock` builds a client whose `ticks()` never advances and the guard is
  seen firing. ⚠ Its first run was composed with `noturn` and reported the guard silent —
  correctly, since the message needs keys HELD: **a sabotage composed with another sabotage is a
  third experiment.**
- ⚠ **THE DECLARATION HAD TO MOVE, NOT JUST THE USES.** `TURN_RATE`/`TICK_US` were the server's;
  leaving the `const`s standing would have left it reading its own whatever the library said —
  `HOUSE_W` measured, `CHUNK_SHIFT` breaking the editor with every suite green.
- ⚠ **AND `4:<keybits>` GOT A DECLARATION FOR THE FIRST TIME**: a sender ORing literals and a
  receiver testing its own, with nothing between them.
- ⚠ **ONE APOLOGY BECAME A LIE.** `wire()`'s *"'4:' is a server message and this page has no
  gesture for it yet"* was true until this step. Held input forks on the authority now, as `act`
  does. **A stale apology is worse than none** — the `ps_status` literal, one message down.
- ⚠ **TWO INSTRUMENTS, AND A SABOTAGE PROVED WHY.** `DEMO_SABOTAGE=noturn` left the page consuming
  **213 fixed steps** with nothing held: a step count says the CLOCK advanced and nothing about the
  keys. `ticked` and `turned_by`, red in different places.
- ⚠ **AND ONE SABOTAGE WAS SEEN BY ONE TEST ONLY.** `yaw_turn` ignoring `dt` tripped the
  accumulation test alone — *"one step turns a known angle"* could not see it, because the fixed
  amount substituted was the same 0.033.

✅ **THE WORLD KEY IS IDENTICAL ACROSS RUNS (`41145:1306471549`) AND THE YAW IS NOT.** One key press
is 3 **or** 4 steps depending on when the browser delivers it (0.7986 one run, 0.9438 the next), but
the footprint takes a **lattice rotation**, not the raw yaw. **A wall-clock-driven browser demo can
be asserted byte for byte, because the gesture quantises what the walker leaves continuous.**

⏭ **AND IT NAMES A PRODUCT QUESTION LEFT UNANSWERED ON PURPOSE**: the gesture knows the admissible
facing (`offer 8`) and does not take it, so an author presses, is refused, turns, is refused again.
Whether `place` should snap to its own offer is an [EDITING_MODES](EDITING_MODES.md) question about
what a verb means, and changing it here would have moved `probe-b1a`'s baseline under a step about
turning.

⏭ **THE WALK IS SIZED — 18 server functions, and TWO blockers.** `ground_under` → `hex_mesh::terrain_y`
is a **cycle** (`hex_mesh` depends on `hex_editor`, recorded on `Author` since `R1a`), and
`moros_sim::cliff_edges`/`fall_step` are the Moros arrow. Everything else it calls (`hex_edge`,
`hex_grid`, `hex_way`, `hex_voxel`) is already a dependency. **Both have the same answer this tree
has taken twice**: the driver supplies what it alone can know — `edges_walk` already takes its
terrain as a `fn(integer, integer) -> integer`, and `C1` names the same shape for the camera.

## ✅ `B2`/`B3`/`B2b` — THE DEMO EXISTS, AND MOST OF IT WAS ALREADY TRUE, 2026-08-13

**`make pages` writes `_site/index.html`; `make probe-demo` opens it from `file://` with no
listener at either end.** It boots, goes local in 180 dials, draws its own world, and `ArrowUp`
writes into it — 7 checks, plus 3 more about servers.

⛔ **THE FIRST MEASUREMENT CANCELLED MOST OF THE STEP.** Before a line of `build-pages.mjs`
existed, the engine build was opened from a disk and **already worked**. So `B2` is not *make the
page work without a server* — that was true and untested. It is **packaging plus a check**, and
the page is a `cp`: [PAGES_EDITOR](PAGES_EDITOR.md)'s rule is that the demo and the page the
server serves are ONE artifact.

⚠ **WHICH IS WHY `B2` AND `B3` ARE ONE COMMIT.** A copy decides nothing, so it cannot go red on
its own — the lower bound of a safe step. The one thing the build *does* decide is **staleness**,
and it REFUSES rather than skips: an engine older than its sources is named and rejected. ⚠ That
is the opposite of `run-gates.sh`'s *never skip on a guess*, and the difference is what the answer
is used for — a timestamp that SKIPS runs old code silently, one that REFUSES costs one
`make client`.

✅ **AND `B2b` — A DEMO OPENED FROM A DISK ATTACHES TO AN EDITOR IT IS TOLD ABOUT.** The socket URL
is a LIST: `/ws` first, then whatever `servers.txt` in the page's base tree names, written by
`build-pages.mjs --servers`. ⚠ **`P6`'s base tree has its first live consumer** — nothing in
`editor_client.loft` read a file until now.

- ⚠ **THE HOST IS NOT COMPILED IN, AND THAT IS THE SAFETY.** A client carrying
  `ws://127.0.0.1:18090/ws` would have every page on this box silently adopt whatever is on that
  port — somebody's live session, and `probe/b1b/auth.sh`'s **run B, whose whole subject is a page
  that finds NO server**. `E3` checks it: a page nobody told never dials the port *with a server
  sitting on it*.
- ⚠ **THE ORDER IS THE ONE NON-GUESS**: `/ws` is the only candidate the page has evidence for. A
  stale `servers.txt` must not outrank the server actually serving the page.
- ⚠ **`LOCAL_AFTER` IS PER CANDIDATE** — the bound is measured against what one working connection
  costs (dial 4), so a shared budget would hand the last candidate the leftovers.
- ⚠ **A `file://` PAGE MAY REACH A SERVER — MEASURED FIRST.** `probe/b1c/origin.mjs`: `live OPEN`,
  `dead ERROR`, with the listener's own `UPGRADE COMPLETED` as the non-circular half. ⚠ The first
  run had **both** dials erroring, because the listener never started — a probe whose live case
  fails like its dead case has measured the harness.
- ⛔ **AND THE WRITE PATH MANGLED ITS OWN PRELUDE.** Splicing a string into a 4.7 MB binary needs
  one encoding for both, and `latin1` truncates every code point above `0xFF`: an em dash became
  two spaces. **The byte-count assertion caught it; `grep loftBaseFS` said 4 and would have
  shipped.** `Buffer.concat` now, so the engine's bytes are never decoded.

⚠ **AND IT MOVED A SENTENCE TWO INSTRUMENTS READ AS A LITERAL.** `client: connected — asked for
the world` says which candidate landed now, and `probe-auth`'s `A2` and `C2` both grep that line —
**2 of 36 red**, on a client that was working perfectly. Both patterns are stricter than before (a
line naming no candidate no longer matches). ⏭ **That is the argument for a probe reading a
sentence rather than a count**: the wording changed and something said so the same afternoon.

⚠ **`wait` ON THE PROBE'S OWN LISTENER HUNG IT FOR 800 SECONDS WITH `E1` ALREADY GREEN.** The
browser still holds the socket the listener accepted, so the shell sat on a signalled job that had
not finished dying. It waits for the **port** now, bounded. **A probe that hangs after its subject
succeeded reads as a broken subject.**

⏭ **AND A `--html` PAGE HAS A CLOCK**, which is `B1c`'s enabler:
`loft_host_time_ticks_us() { return performance.now() * 1000; }`. ⛔ **But the emitted page shims
unbound names to a constant and only `console.warn`s** — that name's fallback is **`0`**, so a
missing bridge makes every `ticks()` return one instant and an integrator never move. *The name in
the page is not the measurement; the clock advancing is.*

## ✅ `B1b.2c.4c` — A TOTAL CANNOT SAY WHICH, AND THAT IS THE PHASE, 2026-08-13

**The page draws all eleven surfaces, and `B1b.2c` is closed.** `local_ground` is
`local_surfaces`: one `hex_mesh::chunk_meshes_all` per tile, the ground through the installer it
always used and the other ten through `install_surface`, whose colour and ramp are `hex_mesh`'s —
the same two calls `send_surfaces` makes before putting them on the wire.
`shots/b1b-2c4c-eleven-surfaces.png`: a flat green plane before, a raised bowl inside a grey
palisade after.

⛔ **EVERY CHECK THAT ALREADY EXISTED WAS GREEN THROUGH ALL OF IT.** `AUTH_SABOTAGE=groundonly` —
the page one commit back — leaves **B8** (sentences), **B10** (world key), **B11** (session), **D3**
and **D4** green. A fence rung in local mode was **written, keyed, byte-identical to the runner's,
and invisible**, and not one instrument in a 33-check file was about whether a WALL reached the
picture.

⚠ **SO THE CLIENT NAMES THE SURFACES: `client: local drew grass` at boot, `grass,wall` after the
rings.** A float total could not carry the claim — a raise moves the GROUND, so *floats redrawn*
rises on every gesture whether or not anything else is drawn. That is `probe-mesher`'s finding
(*"63 of them had geometry" cannot say WHICH*) arriving in the consumer it was found for. ⚠ The
list is read off the **`>= 6` floats that decide whether a buffer is installed**, so a surface that
meshed to nothing cannot appear. ⚠ And `E1` is the negative control on the same run: an unwritten
world draws `grass` and nothing else, without which a page filing a wall mesh unconditionally would
pass.

⚠ **THE `add_mesh` DEFECT WAS WAITING IN `install_ground`.** Its `len < 6` guard returns **before**
`drop_part` — the exact shape `add_mesh` documents at length, where an empty vertex list is a CLEAR
and skipping it leaves the old buffer bound. Harmless for the ground, which is never empty; not
harmless for ten surfaces that are empty most of the time. `install_surface` drops first. **A defect
that is harmless in its only caller is a defect waiting for its second.**

## ⛔ `B1b.2c.4b` — ONE WORLD, TWO PICTURES, DECIDED BY DELIVERY, 2026-08-13

**Getting the page a ramp to draw with found a shipped bug in the server.** A chunk's surfaces
reach a client two ways — the dirty **FLUSH** after an edit and the chunk **STREAM** when a tile
comes into view — and they were two copies of one loop. The flush asked `hex_mesh::surface_ramp`;
the stream wrote a literal `0`, **under a comment claiming *"the same loop as the flush, over the
same list, in the same order"***. The ramp slot is a MODE (0 flat, 1 by height, 2 by DEPTH), so
**water drew flat when a tile came into view and depth-ramped the moment anything near it was
edited.**

⚠ **`chunk_meshes_all` UNIFIED THE MESHES AND LEFT THE SEND SPELLED TWICE.** The lesson is not
*check the copies* — it is that **a helper which removes one duplication puts a comment over the
one it did not remove**, and that comment is what a reader trusts.

⚠ **AND NOTHING COULD SEE IT: THERE WAS NO WATER GATE.** Water is the eleventh surface (plan 20
`A10`) and the **only one besides the ground whose ramp is not flat**, so it is the one surface on
which the two paths could disagree — and the only surface nothing drove.
`tools/gates/world/water.mjs` is that gate, and it is red on the bug it was written for:
`rampFromTheFlush [2]` against `rampFromTheStream [0]`.

✅ **THE FIX IS STRUCTURAL.** `send_surfaces` is one function with two callers, so the second
spelling is not expressible; `ground_ramp()` asks `surface_ramp` by the surface's own name at both
ground sites instead of writing `1`. `hex_mesh::surface_ramp` and `chunk_mesh_slot` are published,
with four library tests — ⚠ and the one that sees a **rename** is the COUNT (*exactly one surface
ramps by height, exactly one by depth*), because `surface_ramp` keys on a name and a renamed
surface silently falls through to the flat default. Both sabotages measured.

⚠ **THE FIXTURE TOOK THE WORK AND WAS MEASURED TWICE.** Water refuses on the world the server
starts with — *"water at -2 leaves no room for a bed 12 deep above the reserve"* — so the gate
raises a band first; and the first raise probe read a height that never moved, because **the brush
is ten hexes AHEAD of the character**, which the editor's own help line says and no gate had needed
to know. ⚠ Its wait was a 20 s silent timeout on `S:rebuilt` (the race `road.mjs` warns about);
waiting for the water surface to **arrive** took it from 44.7 s to **26.6 s**.

## ✅ `B1b.2c.4a` — A GREEN SUITE THAT PRINTED NOTHING, 2026-08-13

**The mesher has one body.** 41 declarations — 33 functions, 8 constants — and **1,744 lines** out
of `src/editor_server.loft` (9,508 → 7,764); the five callers take `hex_mesh::chunk_meshes_all`, and
`EDITOR_PROBE=meshcmp` goes with them. **What the probe measured, the compiler now enforces**: a
second declaration in a program that imports the package is `Cannot redefine`.

⛔ **AND THE INSTRUMENT ANSWERED WITH SILENCE — THE ONE ANSWER A DELETION MUST NOT TRUST.**
`make gate` exited 0 with an **empty log**, because `run-gates.sh` is silent on PASS on purpose
(loft's Goal F: a tool that reports its good health teaches you to skip the line where it reports
the opposite). So *rc=0, no output* is exactly what a suite that never ran looks like — on the one
change whose whole claim is *nothing moved*. `GATE_VERBOSE=1`: **48 PASS, 0 FAIL, 48 gate files on
disk.** ⚠ This file's rule *match a line you know is there before believing a count of zero* has a
mirror: **count the lines you know should be there before believing a silence.**

⚠ **THE FOUR SURVIVORS ARE THE DECISION, AND `hex_mesh` HAD ALREADY WRITTEN IT DOWN.** `WALL_UP`,
`SPECIES_BUSH`, `opening_kind_index` and `terrain_y` are the mesher's *and* the server's own. The
library's comment said they were **deliberately not published** — *"a program declaring a name a
library publishes SHADOWS it invisibly (`HOUSE_W`, measured)"* — and that condition ended with this
step, not before: publishing at `c.3` would have left the server reading its own `12` whatever the
library said. ⚠ **`terrain_y` is the one worth the trouble**: 26 lines of triangle interpolation in
two files, differing only in `moros_render::world_to_hex` versus `px_to_hex` — a wrapper round the
same call — so the camera march, the cart's wheels and the feet now read one function, and **three
more `world_to_hex` sites** are retired (plan 19 `L6.3a`, through a side door again).

⚠ **`probe-verbs` WENT RED ONCE AND THE OBSERVER WAS THE CAUSE** — launched while 48 gate servers
were in flight, the verbed transcript arrived with one line of eight. Alone: green, 17 checks. **A
probe that starts its own server is not parallel-safe with a suite that starts 48.**

## ✅ `B1b.2c.3` — THE PASS WAS OVER FIVE SURFACES OF ELEVEN, 2026-08-13

**The props mesher is `hex_mesh`'s** — 1342 lines, 32 functions, 9 constants. Both bodies are live
(the server's is `chunk_meshes_all_srv` until `c.4`), and `make probe-mesher` compares them over
**49 tiles × 11 surfaces**: every mesh the same.

⛔ **THE FIRST RUN PASSED OVER FIVE OF ELEVEN.** House, fence and opening left **six surfaces never
drawn** — road, field, tree, soffit, rock, water — and *an equality of two empty meshes is a pass
that means nothing*. The per-surface counter is what caught it; a total ("63 had geometry") cannot
say which.

⚠ **THE SOFFIT NEEDED A CELLAR AND THE GROUND REFUSED IT** — *"floor at 4 leaves no room for a
storey of 12"*. Seeded at 30 now, which lit the rock faces too: 99 tile-surfaces drawn.

⚠ **THE COMPILER HAS NOW DECIDED THE SHAPE OF THIS MOVE THREE TIMES**: `declared by more than one
package` (siblings, `c.1`), `Cannot redefine` (a package and its dependency, `c.2`), and here the
same rule forcing the server's copy to take a `_srv` suffix — `W1`'s two-encoders period, made
explicit by the language rather than by discipline.

## ⛔ `B1b.2c.2` — THE HOME WAS WRONG, AND A GREP'S EXCLUSION IS WHY, 2026-08-13

**The five drawing primitives are `hex_proj`'s**, not `hex_mesh`'s where `c.1` put them one commit
earlier.

⛔ **`c.1` CONCLUDED THE EDITOR WAS THEIR ONLY CONSUMER FROM A GREP THAT EXCLUDED THE FILE THEY
LIVE IN** — so it could not see that all five have internal `moros_render` users (`emit_marker`,
`emit_to_material`, `emit_thick_flat_wall`, `emit_thick_curved_wall`, `emit_hex_item`). **A grep's
exclusion is an assumption**, and this one assumed the question it was asked.

✅ **THE COMPILER REFUSED BOTH WAYS OUT.** Deleting broke `moros_render`; a copy on each side is
not expressible, because `moros_render` DEPENDS on `hex_proj` — `error: Cannot redefine 'emit_box'`
rather than `c.1`'s `declared by more than one package`. ⚠ Two different diagnostics, and the
difference is the dependency arrow: siblings are ambiguous, a package and its dependency are a
redefinition.

✅ **SO THE HOME IS THE LEAF BOTH SIDES ALREADY DEPEND ON** — `hex_proj`, which is `hex_grid` +
`graphics` and nothing else. Nothing gained a dependency and no arrow moved.

⚠ **THE EQUALITY IS A CHAIN**: `c.1` measured `moros_render` == the copy by mesh checksum with a
control; `c.2`'s hop is a **verbatim relocation**, five of five bodies identical modulo one `pub`,
diffed against the previous commit. And the 14 tests moved with the subject — `moros_render`
167 → **153**, `hex_proj` 8 → **22**, every row accounted for (`V3`'s rule).

⏭ **`EDITOR_PROBE=emitcmp` IS SPENT** — one copy left, and the arrow makes a second a compile
error. **What the probe measured, the compiler enforces.**

## ◐ `B1b.2c` — THE PROPS MESHER IS 1342 LINES, AND ITS BLOCKER WAS AN ARROW, 2026-08-13

**Sized before any code**: `chunk_mesh_props` plus everything it reaches is **32 functions, 1342
lines, 9 constants, and nothing else of the server's**. ⛔ **And it could not move**: it calls
`moros_render` at three names, and `hex_mesh` is a lavition package — a mesher reaching for those
would point [LAVITION_SPLIT](LAVITION_SPLIT.md)'s arrow backwards.

✅ **PAYABLE, NOT BLOCKING — and `B1b.2c.1` paid it.** The three (`emit_hex_surface`,
`emit_item_placeholder`, `world_to_hex`) plus two helpers are **141 lines whose every dependency is
already in `hex_mesh`'s cone**, and `world_to_hex` is a Moros name for `hex_grid::px_to_hex` — plan
19 `L6.3a`'s bill through a different door. `make probe-emitters`: five `mesh_crc` pairs identical,
with a control that must differ.

⚠ **THE PAIR IS COMPARED IN THE ONE PLACE BOTH ARE VISIBLE — THE SERVER.** A library test cannot
see both (that is what the arrow means) and a probe program would have to import Moros to ask.

✅ **AND THE COMPILER NAMED ALL TEN CALL SITES.** A second declaration made every bare call
ambiguous and loft refused the build, one message per site — the mechanism CLAUDE.md records,
doing its job on a real move.

⏭ **`c.2` IS NOT JUST A DELETION**: 14 of `moros_render`'s tests are about the five and move with
them, but **three use them as fixtures for another subject** and cannot call `hex_mesh::` —
`moros_sim` depends on `moros_render`, so that arrow would hand it `hex_editor`'s whole cone, the
experiment `hex_mesh`'s `loft.toml` records as tried and reverted.

## ✅ `B1b.2` — THE PAGE DRAWS WHAT IT WROTE, AND THREE INSTRUMENTS WERE BLIND FIRST, 2026-08-13

**A camera of its own, its own ground meshed out of its own cache, and a re-mesh on every write.**
`make probe-auth` is **33 checks** now, five about the picture.

⛔ **NOTHING HAD BEEN ON SCREEN AT ALL, AND `draw_world` SAYS WHY IN ONE LINE** —
`if !st.has_cam { return; }`. The camera is the SERVER's solve, so the page `B1b.1b` shipped had
every number right and a blank world half, with the panel over it making it look alive. ⚠ The
local camera is a **stand-in written as one**: `C1`–`C4` move the five-mode solve into `hex_cam`,
and re-implementing it here would be `W4` on the camera.

⛔ **THE CANVAS PHOTOGRAPHED WHITE WHILE THE CLIENT RAN FLAWLESSLY** — 49 meshes, 300 frames, no
exception. `probe/b1a`'s driver passes `--use-gl=swiftshader` and never photographs anything; the
tool that does passes `--use-gl=angle --use-angle=swiftshader`. **What a driver inherits is
whatever its parent needed.**

⛔ **AND THE FIRST REGION REPORTED A BLANK WORLD WHILE THE PAGE DREW PERFECTLY** — an unwritten
world is a flat plane at one height under a constant ambient, so it really is ONE COLOUR. *A count
cannot see a horizon unless the horizon is inside the frame you hand it.* ⛔ **And the fixed
version still passed with no camera at all**, which `AUTH_SABOTAGE=nocam` found: the region caught
four rows of `lavition_ui`'s full-width SUBJECT BAR. **An instrument that includes the UI cannot
report on the world.**

⛔ **A STRUCT STORED INTO A VECTOR-TYPED FIELD IS SILENTLY DROPPED —
[loft#893](https://github.com/loft-lang/loft/issues/893).** `st.view = mat4_look_at(…)` compiles
clean, runs, and stores nothing (`Mat4` wraps one `vector<float>`); the identical store to a LOCAL
is a compile error. `--check` is quiet too. Writing `.m` is the fix, reachable only by noticing the
return type.

⚠ **`hex_mesh::mesh_tile_of` IS A LIBRARY RULE NOW**, because `/` truncates: hex `-1` is in the
tile covering `-8..-1` and `-1 / 8` is `0`, so every tile west of the origin would be meshed one
over — **and the origin is the one place the two agree**, which is where every fixture stands.

⏭ **IT DRAWS THE GROUND AND NOTHING ELSE.** A fence in local mode is written, keyed and invisible:
the nine-surface recipe is `chunk_meshes_all`, a program-local function in `editor_server.loft`
whose own comment says a third copy is how a surface comes to be drawn in the world and missing
from the catalogue. **The page is that third caller** — `B1b.2c`.
✅ **CLOSED THE SAME DAY** — the recipe is `hex_mesh::chunk_meshes_all` and the page calls it; see
`B1b.2c.4c` above. This paragraph is kept as the record of what the gap was.

## ✅ `B1b.1b` — THE PAGE IS AN EDITOR, AND THE DIGEST WAS MADE OF THE FORMAT, 2026-08-13

**With nothing behind the wire the page stops dialling, says so, and WRITES what it is pressed.**
`hex_editor::press_verb` against the `VoxelWorld` the client has held since plan 16 `S3`;
`make probe-auth` is **28 checks**, and the claim is the last two — the page and `editor_run` at
`GROUND=0`, over the same six verbs at the same author, agree on the **world**
(`32952:1545220309`) and on the **session**.

⛔ **THE INSTRUMENT THE WHOLE CLAIM RESTS ON WAS BLIND ON ITS FIRST BUILD, BY CONSTRUCTION.**
`hex_voxel::world_key` began as a CRC32 over `world_to_bytes` — and **this format writes each
layer's cells followed by `layer_crc` OF THOSE CELLS**, so a CRC32 whose message carries its own
CRC32 lands on one residue whatever the message held. Two worlds one edge byte apart keyed to the
same string `8277:3255039172`, with byte sums **1143 against 1033** proving the vectors differed.
Only a HEIGHT moved it, and only because a height moves `ck_base` in the *directory*, which no
layer checksum covers. ⚠ **An instrument made of the same material as its subject can cancel
against it** — and reaching for the checksum the format already trusts is exactly how you get
there. It is `world_sections_key`'s `*31 + b` now.

⚠ **AND THE TESTS CAUGHT IT, NOT THE STEP.** `lib/hex_voxel/tests/key.loft` was written before
the function was believed, every case shaped as *a pair a weaker instrument calls equal* — three
of five red on the first run. A test that only said *different worlds, different keys* would have
passed a function that hashed the write count.

⚠ **TWO INSTRUMENTS, BLIND IN OPPOSITE DIRECTIONS, MEASURED BY SABOTAGE.** `elsewhere` presses
the same six verbs one world-unit over: every count, every sentence and the whole session are
unchanged — **a ring of the same radius writes 42 edges wherever it is laid** — and it is red on
**B10 alone**. `scratchsession` presses into a session nobody keeps: the world is
**byte-identical** and it is red on **B11 alone**. That is why `hex_editor::session_digest` MOVED
out of `editor_run` instead of being copied into the client.

⚠ **THE SWITCH IS A BOUND, BECAUSE THERE IS NO EVENT.** `ws_handler` gives no `onopen` and loft's
surface has no callback, so *the socket did not open* is only observable as *not yet*.
`LOCAL_AFTER = 180` dials, measured against the real thing: **a live server lands on dial 4**. The
decision is **one-way** and the loop stops dialling when it fires — a page that kept dialling
would attach to a server that came up later while holding gestures nobody else has seen. ⏭ **Run
C is the control it needed and already had**: a socket that OPENS and then says nothing must not
be read as no socket at all.

⚠ **AND THE RUNNER SEEDS GROUND WHERE THE SERVER LAYS NONE** — 61×61 of `SURFACE_MAT`, so a
scripted scene has something to photograph. Same six verbs: **τ 4079** seeded, **τ 358** not. So
`editor_run` grew `GROUND=<half>`, and it is *start where the editor starts* rather than a test
hook — `E1γ`, absence IS the floor.

⏭ **AND `place` IS REFUSED AT THE ORIGIN IN BOTH DRIVERS** (*"a footprint at this facing has no
mitred corners"*, `B1a`'s live fact). The fixture KEEPS the refusal rather than posing around it.
It also names what stands between this page and a house: **the walk, `B1c`.**

## ✅ `B1b.1a` — THE SABOTAGE PASSED, AND ITS PASSING IS THE FINDING, 2026-08-13

**The client's status line is derived instead of asserted.** It read
`ps_status: "moros editor — connected"` — a literal, set at panel construction, before any socket
existed, with **no other writer in the file** — so the panel claimed a connection it had never
checked and went on claiming it with the server down. It is the `W4` shape one more time: a fact
asserted in a place that cannot know it. `authority_line(st)` reads `st.hello`, the client's one
piece of evidence, which is a `send` that SUCCEEDED. `make probe-auth`, and `make probe-b1a`
unmoved — the same 7 sentences, world `82d622b37d1d`.

⚠ **THE ONE SABOTAGE THAT MATTERED PASSED.** Delete the single write this step adds —
`panel_dirty = true` where the send lands — and the run against the real server stays **entirely
green**: the server answers `1:` with `N:` and `H:` a frame or two later, and each of those marks
the panel for its own reasons. **A rebuild that happens anyway reads exactly like a rebuild that
was asked for**, and a server, a browser and a transcript cannot tell them apart at all.

✅ **SO THE INSTRUMENT IS A THIRD SITUATION: A SOCKET THAT OPENS AND SAYS NOTHING** — twenty lines
of node that complete the handshake and never send a frame. There `panel_dirty` has exactly one
possible writer, and the proof prints beside the verdict: the client's own counters still read
`meshes 0, placements 0, drops 0, cameras 0, status 0, parts 0` after 1200 frames. ⏭ **A real
situation, not a contrived one** — a server accepting while its world loads is this.

⚠ **AND THE CONTROL FOR *WAS THERE A SOCKET* WAS CIRCULAR, WHICH A SECOND SABOTAGE FOUND.** It
proved *nothing connected* by reading the client's own `connected` line — the claim under test —
so `assume` (the authority read off **having sent** rather than off the send **succeeding**, the
trap the client's own `ws_handler` comment warns about) made the control agree with the lie it
existed to catch, and its message said *"this run is not the no-server case at all"* about a run
that was exactly that. **The evidence is the other side's log now:** dials refused against dials
completed.

| | red where | and nowhere else |
|---|---|---|
| `literal` — the line as it was | `A1` the panel's first word · `B4` with no server behind it | |
| `nodirty` — the fact moves, the panel is not told | `C4` **alone** | green in A and B — the reason C exists |
| `assume` — authority off the send, not off its success | `B3` client against wire · `B4` | invisible to A: with a server there, assuming is right |

⚠ **THE INSTRUMENT READS THE BUILT PANEL** (`p_status.ss_text`), never `authority_line` a second
time — `K1`'s shape. It is post-`fit_text`, so a status too long for its strip arrives carrying its
own `..`, and the check is **exact equality against the two whole strings**: a substring test would
call a truncation a pass. ⚠ **And `metrics_drift` held a second copy of the literal** under a
comment saying it *"compares the strings the panel actually shows"*. It takes the constants now.

⏭ **THIS IS THE DAY PLAN 18 `B2`'s NOTE COMES DUE**, and the note said so itself: *"the panel is
built once … when the contents start moving, rebuild on CHANGE — not on tick."* An authority that
can change is contents that move. `hud_dirty` is `panel_dirty`, because it now has a writer that is
not a message at all.

## ⛔ `B1b.1` IS BLOCKED, AND THE PLAN NAMED THE MECHANISM WITH CONFIDENCE, 2026-08-13

**Its first item was a boot switch**, and this tree wrote: *"the mechanism is `P2`'s — `host_output`
a question, `host_input` the answer, run and holding in both shells. And the default falls out for
free: an unanswered request returns empty, so the server-served page stays attached without anyone
deciding."*

⛔ **`probe/b1b/ask.loft` — five lines — prints `asking` and HANGS.** `timeout 20` → **rc 124**.
[loft#891](https://github.com/loft-lang/loft/issues/891) (`enhancement` · `needs-design` ·
`wa:partial` · `area:wasm` · `hit-by:moros`).

⚠ **THE MISREADING IS A CLASS, NOT A SLIP.** `P2` really did measure an unanswered request coming
back empty — **with JS present, declining one message**. *Absent-host and declining-host are
different situations and only one of them terminates.* The design generalised from the case it had
run to the case it had not, and the absence being reported was **the host itself** — exactly what
`P2` never tested. *Check an instrument against something it should find before trusting it to
report an absence.*

⚠ `host_name` is no way round it: the symbol is in the binary, the function is not.

⏭ **Three routes, in the plan.** Wait for #891; or infer the mode from whether the socket connects
— which needs no toolchain and is what `_site/index.html` will really experience, but lets a
transient network failure move an author into a different authority silently; or **do that and make
the subject line SAY which authority is live**, which is the one to build if #891 does not land.

⚠ **NOTHING WAS HALF-WIRED WHILE THIS WAS DECIDED.** A local mode that writes but cannot be
compared is the swap-and-look the plan's gate refuses, and a boot switch that hangs the native
build would have been found by `make play` rather than by a test.

## ✅ `B1b.0` — THE TREE HELD TWO ANSWERS TO *WHAT WORLD IS THIS*, 2026-08-13

**Starting `B1b` asked one question first: which world does local mode build?** `ε` and `θ` are
`world_new`'s last two arguments, and `ε` is the **fold rule `F1` enforces** — a world at 8 accepts
a storey stack a world at 10 refuses. `src/editor_server.loft` said **10/4**; `src/editor_run.loft`
said **8/3**, directly under its own sentence *"the same world the server makes — a scene built at
a different epsilon is a different world however identical the script."*

✅ **`hex_editor::WORLD_EPS` / `WORLD_THETA`** now, beside `W_RESERVE`, which was already there for
the same reason. The client's cache stops spelling the triple as four bare literals.

⚠ **MEASURED FIRST AND THE PREDICTION PRE-REGISTERED.** The house scene at each differs in
**exactly two bytes, offsets 21 and 25** — every cell equal, `τ 3911` both. After the fix
`worlds/headless.hxw` came out at **exactly the md5 the 10/4 experiment produced**. `make parts`
byte-identical, `make headless-same` rc=0, `make lib-test` 1600 on both backends.

⚠ **NO FIXTURE COULD SEE IT — the `W4` grade divergence one constant over.** Nothing in
`house.keys` stacks layers between 8 and 10 apart. ⚠ **And it is not harmless in general**: the
sabotage moved a *sentence* too, so `ε` changes what a gesture writes.

⚠ **NAMED `WORLD_*` NOT `W_*`.** `part_build`/`prop_build` declare their own `W_EPS = 8` for PART
worlds and are right to; a published `W_EPS` would be **shadowed by theirs invisibly** — the
`HOUSE_W` trap, which `tools/names.sh` cannot see.

⚠ **AND IT CAUGHT A ONE-DAY-OLD FLAKY FIELD IN `probe/b1a`.** Restoring the constant left the world
byte-identical while the transcript still read `12 dirty` against a baseline of `10 dirty`. **A
number that moves while the world does not is not a fact about the gesture** — it is the dirty set's
drain state. The brush line is truncated to its CELL now; dropping it whole is what made the first
filter blind to both arrows.

## ✅ `B1a` — AND NO GATE HAD EVER PRESSED A KEY IN THE CLIENT, 2026-08-13

**`src/editor_client.loft`'s five one-to-one keys resolve through `hex_editor::verb_of`**, with a
local `act(h, verb)` holding which message implements a verb. `make probe-b1a`: **7 sentences and
the saved world identical** to a committed baseline of the client from before the change.

⚠ **THE CLIENT'S KEY TABLE COULD HAVE SAID ANYTHING AND ALL 48 GATES WOULD HAVE STAYED GREEN.**
`make gate` drives the **server** through `tools/script.mjs`; `make client-check` counts colours in
a picture. Neither presses a key in the client. That is how it survived as `W4`'s fourth site
through `V1`, `V2a`, `V2b` and `V3` — four steps whose whole subject it was.

⚠ **THE FIRST FILTER WAS BLIND TO HALF THE STEP, BY INHERITANCE.** Copied from `probe/k1`, which
drops `brush ` — and `brush (10,0) — 2 chunks, 10 dirty` is the **only** thing a raise says. Both
arrows vanished and the capture read `3 sentences` as if they had never been pressed. **A filter
inherited from a probe with a different subject is an instrument nobody aimed.** The check is a
**presence test per gesture** now, not a count: a count of seven cannot say *which* key lost its
trace.

⚠ **`K1`'s FINDING, REPRODUCED ONE DRIVER OUT.** Sabotage `act`'s `fence` to the wall's message and
**all seven sentences stay identical** — `do_fence` says the same line for both — while the world
goes `82d622b3` → `cdabc1dc`. Sabotage `place` to a raise and transcript, presence check and world
all go red. **Neither instrument alone covers the five keys.**

⏭ **AND A LIVE FACT FELL OUT: `h` AT THE SPAWN POINT IS REFUSED** — *"a footprint at this facing
has no mitred corners; turn one step"*. A person opening the editor and pressing the house key is
told no. Not `B1a`'s to fix.

## ⛔ `P6` — A PAGE HAS A FILESYSTEM, AND A PHASE IS CANCELLED, 2026-08-13

**`make probe-p6`.** [PAGES_EDITOR](PAGES_EDITOR.md) measured `--html` binding **0 of 20** `fs_*`
names — *a page that draws cannot store* — raised
[loft#851](https://github.com/loft-lang/loft/issues/851), and wrote **`W5`**, an interim
`host_output`/`loftPush` storage shim, on that premise. #851 is closed and merged (`28e85b42`).

| | the design measured | `P6` |
|---|---|---|
| `fs_*` names in an emitted page | **0 of 20** | **21** |
| save a world and read it back in one run | impossible | `pass1 ok`, **8277 bytes** — the interpreter's own count |
| …and after a **RELOAD** | impossible | `pass2 ok`, over **http and `file://` alike** |
| a file the page was **given** (`W2`'s catalogue) | *"a fetched manifest"* | `base file 25 bytes, list_dir 1 entries` — **the line the interpreter prints for a real directory** |

⛔ **`W5` IS CANCELLED AND `W3` RETIRED WITH IT**, both by their own escape clauses. ✅ **`P3` is
closed too** — the house scene is 65,788 bytes, a `LayeredFS` delta measures **1.34×** that, so
~88 KB against a ~5 MB budget: **under 2 %**. No sharding, no IndexedDB.

⚠ **THE DEFERRAL IS THE PART TO CARRY FORWARD, NOT THE CANCELLATION.** The route decision was
parked because `W1` and `W4` were the same work either way, so **nothing waited on it** — and by
the time it had to be answered it had answered itself. Wait for a toolchain rather than build
around it.

⚠ **AND *"#851 LANDED"* IS A CHANGELOG, NOT A MEASUREMENT.** *Landed* is a claim about upstream's
`main`; what decides a phase here is what `/usr/local/bin/loft` does. One grep apart, four days
apart.

⚠ **`file://` NEEDS NO BROWSER FLAG** — the quick start's whole premise, and it was worth its own
run. The first pass carried `--allow-file-access-from-files`; taking it away changed nothing.

⚠ **A SABOTAGE HALF-REFUTED A GUARD I HAD ARGUED FOR, WHICH IS WHY IT IS WORTH KEEPING HONESTLY.**
The driver refuses to read the second load until the document is genuinely new (a stamp set before
navigating that must be gone after). `P6_SABOTAGE=nostamp` **passes three of three** — the race
did not reproduce. What it *does* buy: `noreload,nostamp` reports *"the reloaded page found NO
file"*, a **driver** bug wearing a product failure's clothes with `delta bytes 11092` printed
above contradicting it. **The guard is worth one evaluate for the DIAGNOSIS, not for the verdict.**

⚠ **TWO ENVIRONMENT FACTS, BOTH COST TIME.** loft resolves a relative path against the program's
**source directory**, not the process's cwd. And the chromium here is a **snap** with its own
private `/tmp`, so a `--user-data-dir` under the real one leaves the browser with **no devtools
port** and a driver hanging on a socket that never opens — the profile is repo-local for that
reason.

## ⏭ `V3` — A GREEN SUITE IS THE WRONG INSTRUMENT FOR A DELETION, 2026-08-12

**`hex_editor::press(key)` and its private `open_press` are gone.** Two levels remain:
`verb_of(key)` names a verb, `press_verb(…, verb)` runs it.

⚠ **A DELETION MAKES TESTS PASS BY REMOVING THEIR SUBJECT**, so `make fast` going green proves
nothing about it. The instrument is the **test-name diff** — 40 test functions before, 36 after
(`hex_editor` **428 → 424**) — with every change accounted for: four **spent** (they compared two
bodies and one is gone), one **moved** (`…_the_six_keys_cut_six_different_things` →
`opening.loft`'s `…_the_five_outlines_the_family_can_select_cut_five_different_things`, over
kinds instead of keys), two **retired into rows that already held their claim**, two **renamed**.

⚠ **AND *"the claim is held next door"* IS MEASURED, NOT ASSERTED.** Three sabotages, each red on
the row that inherited a retirement: `session_opening` wired to a constant → `…_the_five_outlines…`
reports `1 2 3 4 cut outlines 1 1 1 1` (the moved control catching exactly what it was written to
catch); `verb_of("W") = VB_PLACE` → `…_a_key_that_is_not_a_gesture_names_no_verb`; `verb_of("G")`
unbound → `…_every_verb_the_definition_produces_is_bound`.

⚠ **THE NAME `press` IS DELIBERATELY NOT REUSED**, against the design's own *"this takes the name
`press` once nothing is left to collide with"*. Both forms are `(sess, w, a, text)`, so a stale
`press(…, "H")` after a rename would **compile, run, and answer *not a gesture* at runtime**. The
note was about collision; free is not the same as valuable. One `sed` reverses it.

⚠ **AND A PROBE'S OWN 120-SECOND WINDOW WAS A FLAKE GENERATOR.** `probe/k1`'s second server gave
up mid-compile — these servers are interpreted from source, so the first after any library edit
rebuilds — and the failure printed 4 lines of compile *advice*, which reads as an error whichever
happened. 240 s now, and the message says **still building** or **died** rather than showing a
tail that cannot tell them apart. ⚠ A second bug in the same failure path: `` `save` `` inside a
double-quoted message **ran `save` as a command**, so a real failure reported
`save: not found`. Both only ever execute when something else is already wrong, which is how
they survived four green runs.

## ⏭ `V2b` — NO EQUALITY COULD SEE THE STEP IT TOOK, 2026-08-12

**`src/editor_run.loft`'s `key` branch is `press_verb(sess, w, a, verb_of(rest))`**, and that was
the **last production caller of `press(key)`** in the tree — the server moved at `V2a`,
`editor_client` never called it.

⚠ **THE STEP'S CLAIM IS INVISIBLE TO EVERY EQUALITY BUILT FOR IT.** `probe/k1`'s A, B and C
compare a key spelling against a verb spelling that **chose what the key already meant**, so they
pass whether or not the runner resolves through `verb_of`. The check that can fail is new —
`carried.keys` chooses **pointed**, presses `O` (the key that used to mean *round* and nothing
else) and reads the kind out of the session. **Seen red on the old line** (`cut kind 1`).

⚠ **AND THE FIXTURE ENCODED THE OLD MEANING, SO A CORRECT STEP TURNED THE SUITE RED.**
`keyed.keys` pressed `key P` with no `select`; the day the runner moved, check B failed on a
**script** rather than on a defect. It selects before it presses now, which makes the same file
valid on **both** sides of the change. ⏭ Worth carrying forward: **a fixture written in the old
vocabulary is not evidence about the new one.**

⚠ **AND ONE CHECK WAS READING THE FIXTURE, NOT THE SYSTEM.** `D` required the two spellings to
end on **different** selections — true only because `keyed.keys` never said `select`. Once it
had to, the difference evaporated. `S3`'s claim underneath is unchanged, so it moved to where it
can be stated directly: *select 2, press `O`, and the selection must still be 2.*

⏭ **`tools/script.mjs` HAS NOT MOVED** — its `key O` still sends `36:1`. `V2` takes one caller at
a time, so the runner and the wire disagree about what `key O` means until `V3`; the divergence
is **bounded by `K2a`**, because no script presses an opening key any more.

## ⏭ `K2a` — THE SCRIPTS SAY IT NOW, AND THE STEP SPLIT, 2026-08-12

**18 opening presses across 8 scripts**, and **every other key left alone**. That is the shape
of the step: `verb_of` is one-to-one everywhere except the opening family, so those 18 are the
only presses `V2b` could silently regress — and the rest cannot be finished anyway, because
`press` has no verb for `R E Q B C J K V Y T X Z`. **`K3` is blocked on those twelve.**

⚠ **THE EIGHT SCRIPTS HAVE NO GATE BETWEEN THEM** — the suite drives `cache`, `indoors`,
`cellar`, `clientmesh` and `deck`. So `make gate` staying green says nothing about this, and
`probe/k2/` is their only check: each script beside a **committed baseline of itself**, both
through a server of its own.

⚠ **AND BOTH WIRE INSTRUMENTS ARE BLIND TO A NICHE'S DEPTH.** The server prints `om_kind` —
*"the profile, after the tens and twenties are read off"*, its own field comment — so a doorway,
a **niche** and an **embrasure** all report `opened profile 1`; and `DOOR_MAT` goes into the
store whatever the depth, so the saved worlds are byte-identical. **Sabotaged**: `niche.keys`
converted as `select 1` three times where it means `1 11 11` leaves **all six sentences
identical and the world at the same md5**. Only the kind sequence — read out of `script.mjs`'s
own `KEYMAP`, walked with the selection carried forward — goes red.

⏭ **THAT IS ALSO A LIVE WORDING DEFECT, RECORDED AND NOT FIXED.** An author cutting a niche is
told what an author cutting a doorway is told. `S2a` froze the sentence on purpose while the
choosing moved; naming the depth is a deliberate change.

⚠ **AND `K1`'s SESSION READ-BACK COULD NOT STAND IN.** It is exactly the instrument that sees a
depth — and `press` has no `R`, so **seven of the eight scripts build no wall at all** in
`editor_run` and every opening in them is refused. The strongest instrument in the tree had
nothing to look at.

## ⏭ `K1` — AND THE ROW'S OWN NEGATIVE CONTROL WAS BLIND, 2026-08-12

**Both script readers take `verb` and `select` now** — `src/editor_run.loft` (which calls the
gestures) and `tools/script.mjs` (which drives the socket) — and
[`probe/k1/run.sh`](../../probe/k1/run.sh) drives a twin pair of scripts through both.

⚠ **THE PHASE ROW SPECIFIED *"run one converted script and its original and diff the world"*,
AND THAT CANNOT SEE THE ONE MISTAKE THE CONVERSION MAKES.** `key P` becomes `select 2` + `verb
opening`; write `select 1` and the two worlds are equal **byte for byte** — `open_ahead` writes
`DOOR_MAT` whatever the profile, the head is in the session's `Opening`, and `S1` measured that
none of the session is in the world format. **It is `V1`'s blindness one layer out**, sitting
in a table nobody had run yet.

✅ **So the runner grew the session read-back** EDITING_MODES named as the *alternative* to
converting the scripts — and it turns out to be what makes converting them an assertion rather
than a hope. It prints the nine registries and each opening's **geometry**, never only
`op_kind`: a digest of the label agrees with itself for as long as the label is copied
correctly.

⚠ **CONTROL `C` REQUIRES BOTH HALVES AT ONCE** — a deliberately mis-converted script must leave
the **same world** (so the store's blindness is measured, not assumed) and a **different
scene** (so the new reader is not blind too). The first half flipping would be good news and
would need the argument rewritten.

⚠ **AND THE TWO SPELLINGS MUST END ON DIFFERENT SELECTIONS.** A key does not re-choose —
`S3`'s fork — so the key twin finishes on the selection it started with and the verb twin on
`2`. The probe asserts they differ; agreement would mean a key had silently re-chosen.

⚠ **`script.mjs`'s NEW `VERBMAP` IS NOT A FIFTH SITE.** `KEYMAP` decides what a KEY means —
`W4`'s subject; this decides which message id implements a VERB, which is a fact about the wire
and is that file's own business. What it does not hold is a **profile**: six rows collapse to
one `36:`. ⏭ Deleted, not converted, when the wire carries a verb.

⚠ **AND THE WIRE HALF WANTS TWO INSTRUMENTS TOO, BLIND IN OPPOSITE DIRECTIONS — MEASURED BY
SABOTAGE.** `VERBMAP.wall` pointed at the fence message leaves **all six server sentences
identical** (`do_fence` says `fenced 42 edges … radius 3` for either ring) and the saved world
differs at byte 54068; `VERBMAP.opening` pinned to `36:1` is the mirror — byte-identical world,
and the sentence says `opened profile 1` where the original said `2`. So the wire half compares
the sentences **and** the world the server saves. Neither gap was reachable by reading the
source: nobody notices what a `println` leaves out.

⚠ **THREE INSTRUMENT BUGS WERE IN THE PROBE ITSELF AND EACH READ AS A PASS.** The first capture
was **25 sentences**, 21 of them part thumbnails printed before the server opened; it **lost the
last gesture of every run** to the shutdown, and two runs truncated at the same place agree
perfectly; and the unknown-verb control printed a heading and **no verdict**, because its helper
ended in a `grep` that exits 1 when it matches nothing — which is exactly what that control
wants to see. Gesture lines are named one at a time now, never counted.

⚠ **A FRESH SERVER PER SCRIPT.** Two runs against one process differ in every
`hex (q,r) — +N −M chunks` line, because the streaming set carries over — a fact about a viewer,
not a gesture.

⚠ **`V1`'s OWN PHASE ROW NAMED A BLIND INSTRUMENT, AND SO WOULD THE OBVIOUS ALTERNATIVE.** The row
said *equal `w_tau`*; a fence ring and a wall ring write **the same edges of the same disc**, so
the edit clock reports one number for two different worlds and `verb_of("G") = fence` would have
passed. The comparison is the **whole world as bytes** — `world_to_bytes`, `W1`'s encoder getting
its second consumer — and the swap shows at byte 7590. ⚠ **And the bytes are blind the other way**:
the opening wired to a constant leaves the six worlds **byte-identical**, because the store gets
`DOOR_MAT` whatever the kind and the outline lives in the session's `Opening`. **Neither
instrument alone can see this step**; both are asserted, and the `w_tau` blindness is itself a
test so it cannot rot into a comment.

⏭ **AND `V1` REORDERED THE PHASE AFTER IT.** `V2` was to move `editor_run` first; measured, **the
runner cannot see the regression that move would cause.** `house.keys` presses `O` and `P` and both
now cut (`O: 1`, `P: 1`, τ 3911 — the *"cuts no door"* defect is closed), so resolving them through
`verb_of` turns the pointed head round. The world is **byte-identical** (`open_ahead` writes
`DOOR_MAT` whatever the kind), the outline is in the session, and **the session is not in the world
format**. `ak_n` is `1` for all six, so the transcript is blind too. **`K1`+`K2` first**, or `V2`
lands a silent profile regression under a green `headless-same`. The server's `MSG_HOUSE` is the
exception — a literal `"H"` carries no profile.

⚠ **`S1`'s PREMISE WAS MEASURED AND IT IS FALSE.** The row said *"the session is saved and
replayed"*, naming `world_to_bytes`. **None of the session is in those bytes** — and the load path
did not clear it either, so `9:` left the previous world's registries in place: build a house,
save, load a world with no house in it, and `37:` still built `annex kind 1 at (-2,1)` on a
cottage the store no longer held. `36:` refused correctly in the same breath, **because it reads
the store** — *which one asks the world* is the discriminator. ✅ Fixed: `session_scene_clear`,
the one list both `9:` and part-open take.

> **So a selection is DRIVER state, not world state** — `es_author`'s category, and under
> multi-player two clients on one world hold two. That removes `S1`'s only test, so it merges
> into `S2`. ⏭ **And the registries' own absence from the format is now an open question**: a
> saved world reloads with no wall runs, roofs, leaves, openings, annexes, props, slabs or holes,
> falling back to per-edge panels and a roof from cells.

⚠ **`R1b` FOUND ITS OWN ROW'S INSTRUMENT BLIND, TWICE.** The plan said *equal `w_tau` and equal
trunk state*, and **`w_tau` cannot see a fence on the wrong layer**: the same edges, the same
number of writes, each changing something. Nor can the gesture's own `ak_n` — `fence_count` reads
the world back **at the reference it wrote at**, so a ring laid entirely in the yard below counts
a perfect 42 and agrees with itself. The instrument is `edge_layer` asked at the *other*
reference. ⚠ **And a flat fixture passes with the defect intact**, so the test asserts the two
references name different layers before it presses anything.

⚠ **THE SERVER'S TRUNK WAS TWO BUGS AND THEY BOTH CAME FROM THE DISTANCE.** The ring was laid in
`do_fence` and remembered **eleven hundred lines away** in the message loop, from the PAYLOAD and
*after* the refusal path had returned — so `23:9,2` left a phantom cylinder where no edge was
written, and `23:3` with no radius recorded nothing for a ring it did lay. One call does both now.
⚠ **NO GATE DRIVES `K`**, so the old branch was put back beside the new one and one script driven
through both: the working path (`G` then `K`) is **identical**, and each bug shows on its own row.
That control is also the only thing that proves `sess` survives **two** parameter hops — a struct
that copied anywhere along there is loft#774's shape, and the library tests cross only one.

⚠ **AND `R3`'s "DELIBERATE REGRESSION" COST NOTHING, MEASURED.** `house.keys` is the only script
`editor_run` is driven over, and its `O`/`P` were **already refused** — so the runner's world is
byte-identical before and after, τ 3909 both, and only the sentence changed. ⚠ **Which uncovered a
live defect nobody had measured: `house.keys` cuts NO door and NO window, in EITHER driver.** Its
own comment says *"stand ON the wall's own cells"* and both poses answer *"no wall here to open"*
on the server too, so `shots/s6-house.png` has never had one. **It is the pose** — the same house
opens from `-3 2` and from `-6 -1`.
✅ **CLOSED by the `eye` step the same day** — the poses are on the perimeter and both cut. Re-measured
2026-08-12 while planning `V2`: `O: 1`, `P: 1`, τ 3911. ⚠ **Left here rather than deleted because the
sentence had already been read forward once**: `V2`'s decomposition was drafted on it, and the script
it named as unable to exercise the opening keys is now the one that can.

⚠ **THE CAMERA LIBRARY IS DESIGNED AND DELIBERATELY WAITING.** `hex_cam` has three consumers
(this client, the server, and **crawler**) and a finished design in
[CAMERA_INDOORS](CAMERA_INDOORS.md) — and it is plan 22 `C1`–`C4`, which **do not start until the
client can be opened and driven**. The user's ordering, 2026-08-11: *"this is not the highest
priority, getting our client is that."*

⚠ **AND ITS API IS ALREADY DECIDED BY A MEASUREMENT, so do not re-derive it**: crawler declares no
`hex_voxel`, so `hex_cam` takes a **height sampler**, never a world. The obvious extraction — a
pure move keeping `wld: VoxelWorld` — would be unusable by the consumer who asked for it.

## ⏭ EARLIER — plan 20 is COMPLETE, every row built or measured and stated

**`A9` and `A10` landed 2026-08-10; the road thread closed 2026-08-11.** Both sessions are
in **[JOURNAL §§ 17 and 18](JOURNAL.md)**, unthinned; the per-row record is
[plan 20](../../plans/20-verticality-last/README.md). What is true now:

| | |
|---|---|
| a stroke lays a **plane**, not a plate | each disc cell at `h + round((w − p) · g)`, so the overwrite is a no-op by construction and a walked road sits on the ground it was walked over. Falling: **845 / 338 / 0** at 6 / 3 / 1 per hex — the optimum |
| the spoil balance | ONE rule, `road_balance`, against ONE datum — `Grades`, the grade the author asked for. `spoil_place` is deleted |
| a caved run | holds its limit; the balance shifts only as far as every cell can come up, capped at `CAVE_HEAD` |
| a rising walk | does **not** return its spoil, and that is **a decision taken on the picture** — see below |
| `A2c` across | a projection onto the run's axis; one half is the floor, and "zero cross-fall" was never reachable |
| `A3` | needed no rule at all; the proof is the edit clock |
| `A2b` | a corridor follows the ground, and a hollow it refuses now says so |

⚠ **THE ONE DECISION A READER MUST NOT UNDO: KEEP THE GALLERY.** A rising walk ends owing
363 over 43 cells. Letting the lid come off returns it exactly — **845, the mirror of the
same walk downhill** — and costs `gates/world/cave` half its shelves. **The numbers favour
the other arm and it was still not chosen**, with both renders side by side. `road_balance`
says so at the site; do not re-open it on the numbers alone.

⚠ **AND *RAISE THE SHELF'S LID WITH THE ROAD* IS REFUTED** (`probe/house/lid.loft`) — there
is no roof to raise. `road_cave` writes the road and the ground layer keeping `nat`, and the
drawn soffit is that layer's underside: **the lid IS the hillside**, and raising it measured
a 12-unit step of mountain that was never there.

### ⏭ WHAT IS OPEN

- **`plan/20-run-debt`** — pushed, deliberately unmerged, and now with a *measured* reason:
  merged on top of everything above it **ratchets**, because `spoil_place`'s datum moves when
  the balance moves. Superseded by `Grades`; kept for its measurement.
- ⏭ **plan 19 `L6.3a` is the next piece of code, and it is ready** — see the section below.
  `L6.2` is done; `A8` stopped blocking anything on 2026-08-08.
- the two ◐ format questions on plan 17, which want a plan rather than a step.

## ⏭ THE SPLIT'S ONE INVARIANT IS FALSE, AND IT IS ONE FILE — measured 2026-08-11

**`make probe-split`.** LAVITION_SPLIT.md says in bold that `src/editor_server.loft` has zero
Moros dependencies and that the program, its client, its gates and its content can all travel
together. **Compiled against a lavition-only `lib/`, it does not build.**

| | |
|---|---|
| ✅ already travel | the 7 lavition packages · `editor_client` · `editor_run` · `part_build` · `prop_build` · **all 53 gates** (21 name Moros, every one inside a comment) |
| ❌ **`src/editor_server.loft`** | `use moros_render;` — 6 names, **42** sites · `use moros_sim as msim;` — 10 names, 11 sites |

⚠ **`world_to_hex` IS 29 OF THE 42 AND IS NOT MOROS CODE.** Its body is `hex_grid::px_to_hex`; its
only Moros content is the **return type**, `moros_map::HexAddress`. `L3′` moved `hex_to_world`
into `hex_proj` and left its inverse behind, so `L6.3a` is mostly `L3′` finished.

⚠ **FOUR INSTRUMENTS WERE POINTED AT THIS AND ALL FOUR MISSED.** `tools/layering.sh` looped over
`lib/*/loft.toml` and **never opened `src/`** — the exemption shape by *directory* this time, which
is why the `moros_ui` / `moros_terrain` lesson did not transfer. An **alias** hid `moros_sim`
entirely from a survey that counted bare names, which is `L6.1`'s own finding unspent. The survey
refuted itself in one sentence (*"nothing else … **plus**"*) and the *"nothing else"* is what got
quoted forward. And `L3′` cured `world_to_hex` in the packages, where the check looks, while the
program kept 29 calls to it.

✅ **THE GUARD IS AT THE ARRIVAL NOW**: `PROGRAM_DEBT` in `tools/layering.sh` records the imports
**exactly** and fails in both directions — a new one is a regression, a removed one has to be
recorded as progress or the number rots. Four controls run. And the import is the right instrument
rather than the call site: `use moros_render;` is unaliased, so its 42 sites are **bare names** and
no `moros_render::` grep sees one of them.

⚠ **THE PLAN'S OWN INVARIANT TABLE HELD THIS PROBE ALL ALONG, ON THE WRONG STEP.** `L5`'s row
specifies it exactly — *"the 39 gates green with `lib/moros_*` deleted"*, negative control *"keep
one `moros_*` reference in the server and confirm the build fails"* — while the **phase** called
`L5` was *fix the gate flake*. The phase was done and the row went with the tick. **A control that
has passed trivially since the day it was written is the tell.**

⚠ **AND THE GATE HALF IS UNREACHABLE, NOT MERELY UNRUN.** Every one of those gates drives the
program that does not build, so the invariant's hardest clause is blocked on its easiest.

## ⏭ THE STORE IS `hex_voxel` — plan 19 `L6.2`, landed 2026-08-11

**`hex_world` named two unrelated packages; ours moved.** Package **`hex_voxel`**, structs
**`VoxelWorld`** and **`VoxelChunk`**. Theirs keeps the name — not on merit but on possibility:
they have published three versions and loft's own suite consumes them, so theirs is the rename
that cannot be done. Every count unchanged: `make fast` 138 files · `make lib-test` **1600 tests**
over 11 packages on both backends, every per-package number identical to the baseline · `make
parts` byte-identical · `make gate` **47 PASS / 0 FAIL** · `names.sh` and `layering.sh` silent ·
`probe/l4/run.sh` **8 of 8**.

⚠ **THE ONE-LINE PROOF IS CONTROL `D`**: `loft --lib lib/ probe/l4/theirs_api.loft` used to fail
with `Unknown function world_empty`, because `hex_world` resolved to OURS out of `lib/`. It builds
*their* world now. One name, one package, whatever the flags say.

⚠ **THE PLAN CALLED THE STRUCT HALF OPTIONAL AND IT WAS NOT.** Both packages declare
`world_save`: ours a free function, **theirs a method** — and the method shadows ours, selected by
the receiver struct's *name*, reporting `Too many parameters for t_5World_world_save` or, at the
matching arity, `expected World, got World`. That is `L1`'s sentence a third time.
[loft#850](https://github.com/loft-lang/loft/issues/850) filed, with a two-package repro whose
control is *rename one struct and the right function is chosen*. It never miscompiles; it costs
diagnosis time.

⚠ **AND "a qualified name does not disambiguate" IS NO LONGER TRUE** — that working rule in
CLAUDE.md was measured false on 2026-08-11 and is corrected there. `pkg_b::Thing { b_only: 7 }`
resolves correctly with both packages present, and a bare ambiguous name is now refused outright
naming both candidates.

⚠ **A CONTROL CAN KEEP PASSING WHILE CEASING TO TEST ITS SUBJECT.** `probe/l4`'s `F` handed OUR
world to THEIR `cell_count`; after the rename that call is not a candidate at all and answers
`Unknown function cell_count` — true, and silent about whether the types merged. It had to be
**reversed** (theirs into our free function) to keep both types in one diagnostic. Worth
remembering the next time a probe goes green through a change it was aimed at.

⚠ **AND ONE MECHANICAL TRAP:** `find … -name '*.loft'` **matches loft's `.loft` cache directory**,
and `sed -i` stops on the first non-regular file — so a tree-wide rename silently skips every file
after it, reporting nothing. `-type f`.

### ⏭ AND THE `h_wall` RENAME WENT WITH IT — `h_wall_nw` / `h_wall_ne` / `h_wall_e`

`h_wall_n`/`h_wall_se` were a **flat-top** reading on a **pointy-top** lattice, which has no north
edge at all. **287 occurrences across 39 files**, four structs in three packages; counts identical,
`make parts` byte-identical, 47 gates green. `h_wall_ne` was right and did not move. The byte
layout and field order are untouched, so no world file, part file or wire message changed.

⚠ **IT HAD BEEN DEFERRED FOR MONTHS ON A FACT NOBODY RE-READ** — *"public fields of a published
library (hex_world 0.2.0)"*, which is the **registry's** `hex_world`, a different lineage with
**zero** `h_wall` fields. Ours has never been published. The estimate had rotted too: *"~80 sites
in ten files"* was 287 in 39.

⚠ **TWO PACKAGES DECLARE `pub struct Hex` WITH BYTE-IDENTICAL FIELD LISTS** — `moros_map::Hex` and
`hex_voxel::Hex` — and this is how it was found: `moros_render::emit_hex_walls` is the obvious
instrument for *what edge is this byte*, and it draws **`moros_map`'s**, not the store's. The
reading was right by luck. The chain that actually answers for the store is `SLOT_*` →
`slot_dir = [4,5,0]` → `hex_grid::hex_edge_corners`, and all three agreed.
⚠ **`names.sh` is silent about the pair, correctly** — it checks the graph, and the two never meet
in one since `L6.1` removed `editor_server`'s dead `moros_map` import. **Re-import `moros_map`
into the editor's graph and a bare `Hex { … }` becomes ambiguous.** Recorded, not fixed.

⚠ **`shots/a9-*.png` ARE THE SHIPPING RENDER.** Photographing the alternative overwrote them
under the same names; the directory is gitignored so nothing wrong was committed, but the
wrong frames on disk read as a missing gallery. Restored and verified pixel-identical.

## ⏭ EARLIER — plan 17 `A8` is COMPLETE, and the tree's one live defect is closed

✅ **THE TOOLCHAIN BREAK OF 17:25 IS FIXED — [loft#815](https://github.com/loft-lang/loft/issues/815),
filed and landed the same evening.** `/usr/local/bin/loft` went `9f416d7c…` → `0fba02c1…` (broken,
17:25) → `0d4fa4af…` (20:56, fixed), with `loft --version` saying `2026.8.0` for **all three**.
Green on the new one: `make fast` 121 files · `make lib-test` 22 of 22 · `make gate` 44 rc=0.

⚠ **THE CAUSE IS WORTH KNOWING BECAUSE IT WILL RECUR IN A NEW SHAPE.** Three reachability walkers
in loft's `generation/mod.rs` each re-derived the IR's tree shape as a whitelist ending in
`_ => {}`, and none listed `Tuple` — so a callee reached ONLY from a tuple element was pruned while
its call site was still emitted, and rustc failed E0425. `hex_way` hit it on
`(0.0 - sin(a) * dir, cos(a) * dir)`. `Parallel`, `BreakWith`, `TuplePut` and `ParFor` were missing
from all three too; the program path escaped only by luck. The fix is an exhaustive
`for_each_child` twin so a new variant forces a decision. **Both of the small things the report
asked for landed as well**: the refusal used to advise `--interpret`, which was the command that
had just failed (it now names `LOFT_NO_NATIVE_LIBS=1`), and the whole-function advices pointed
their caret at the following `fn`.

⚠ **AND THE BLAST RADIUS IS THE DURABLE LESSON: `loft test` WAS UNAFFECTED.** `make fast` was 121
files green while **every program in the tree exited 1**. A green suite says nothing about whether
anything can RUN — worth remembering the next time a suite is used as evidence that a toolchain is
healthy.


**Sessions 14 and 15 are in [JOURNAL.md](JOURNAL.md)**, newest first — what each found, in full.
What is true *now*:

| | |
|---|---|
| **plan 17** | `A1`–`A7.3` and **all of `A8`** are built. Two rows are ◐ and both need something other than code — see below |
| **the headless thread** | `prop`, `annex`, `slab`, `seat` and the wall run moved into `hex_editor`; the server's scene state IS an `EditSession`; `tests/session.loft` is 31 tests over nine gates'/scripts' claims with no port |
| **defects** | **none open.** The road-layer suspicion turned out to be a refused write and is fixed; session 15's four are still closed |
| **the user's standing redirect** | *"where possible I want tests outside the server"* — still the thread, and its floor is now the picture gates, which need a server by construction |

⚠ **THE NEXT PIECE OF WORK IS A CHOICE, NOT A QUEUE.** Nothing is blocked on a bug any more.
The open threads are `A8.3` and `A8.6` (both waiting on the user, below), plan 19's `L6.3`
onward (**not** blocked), and the two ◐ format questions that want a plan rather than a step.

⚠ **TWO THINGS ARE WAITING ON THE USER, NOT ON WORK.**
1. **`A8.3`'s acceptance is a cold-recognition test** — *does a person call it a door*
   (`shots/a83-door-{w,sw,s}.png`, regenerate with `tools/scripts/doorway.keys`). My own read is
   that it does **not** yet: a cell leaf is the same height and the same grey as the wall it hangs
   in, because the per-edge fallback has one wall height and one wall colour. That wants an
   `Opening` profile in the part format or a per-part wall height — a format question.
   ✅ **AND IT IS MEASURED NOW, NOT READ** (2026-08-08, `probe/a83/leaf_visible/run.sh`, exit 0).
   The leaf **is** drawn: `door/hung` puts two meshes in the limb block, and id 9 — the leaf's
   panel — is broadcast in colour **`0.55,0.52,0.46`**, `hex_mesh`'s `wall` entry byte for byte,
   spanning **y 0.00..3.25**, one `WALL_UP` (12 × `HEIGHT_SCALE`) on the 0.25 paving. Same colour
   as the wall, same height as the wall, in a hole in that wall. ⚠ **And no cell material can fix
   it**: `h_material` colours a horizontal PLATE, a leaf's body is a vertical PANEL, and
   `part_body_meshes` sends every per-edge panel to the one `wall` slot — the edge material only
   picks a height through `wall_up`. The format question is the whole question.
   ⚠ **Two instruments were blind before this one answered**, and both read as findings: a picture
   cannot see a leaf painted in the wall's own colour, and `script.mjs`'s `mesh <surface>` counts
   the CHUNK id space while a limb goes to `PART_MESH_BASE`..`+MAX` — so it reports `0` for every
   limb whatever was sent, and reported `field 18` for a part holding no field at all, one subject
   behind. The probe's `door/leaf`-as-subject control is what caught it.
   ✅ **AND `A8.8` FIXED IT (2026-08-08).** A part now says how tall its walls are and what they
   are made of — a `WALL` section, [PARTS.md §P9.13](PARTS.md#p913--a-part-says-how-tall-its-walls-are-and-what-they-are-made-of).
   `door/leaf` states `surface=floor` and the doorway reads as timber in stone.
   ✅ **AND `A8.9` GAVE IT A HEAD (2026-08-08)** — an `OPEN` section, and the per-edge path now asks
   `hex_editor::opening_cuts`, the same call `emit_run_wall` has always asked
   ([§P9.14](PARTS.md#p914--the-opening-is-a-wall-with-a-hole-in-it-and-the-hole-has-a-head)).
   A `DOOR_MAT` edge used to draw NOTHING — an absence cannot carry a lintel — and now draws the
   wall above the head and below the sill. `door/frame`/`door/hung` cut a flat head at 10,
   `door/gateway`/`door/gated` a round one sprung at 7, and `A8.8`'s `up` finally has its consumer.
   `probe/a83/leaf_visible/run.sh` is nine controls. ⚠ **What `A8.3` still wants is the user's eyes
   on the picture** — `shots/a83-door-{w,sw,s}.png` and `shots/a89-arch-{s,sw}.png`, regenerated.
   ⚠ **AND THE PROFILE BELONGS TO THE WORLD BEING DRAWN, NOT THE PART THAT OWNS THE EDGE** — a
   stamped cell has no owner left to ask, so a composed part takes the ROOT's profile. A `round`
   frame inside a `flat` house is drawn flat and says nothing; `bake` refuses that pair (`BK_OPEN`),
   the display path deliberately does not. ⚠ **A world has no gesture for a profile yet**, so a
   doorway stamped into the actual landscape still cuts full height.
   ✅ **AND `A8.9a` MADE THE ARCH AN ARCH.** It was `7 7 8 8 … 8 7 7` over one edge — two levels, a
   flat head with a notch at each jamb — from two causes: **an opening per EDGE** (a rise IS its
   half-width, so halving the span quarters it; `hex_editor::open_run_for` now groups doorway edges
   that share a corner and takes the CHORD across the run) and **`1.9999999999999998 as integer`
   = 1** (`round` at all five sites in `opening_cuts`, which cost `emit_run_wall`'s arches the same
   unit). ⚠ **It is still a STEPPED arch** — whole height units at 0.25 — and that is the world's
   own quantum rather than a defect.
   ⚠ **AND THE TEST FOR THE ROUNDING PASSED WITH THE FIX REVERTED**: written in `hex_editor` it used
   `profile_opening`, which adds `OPENING_CLEAR` and makes truncation and rounding agree. It lives
   in `lib/hex_mesh/tests/arch.loft` now and asserts its own precondition so it cannot go vacuous.
2. **`A8.6`'s return half is blocked on a gesture nobody wrote**: nothing authors a `MESH` section,
   the same gap as *no gesture can author a `FITS`*. Both want a plan rather than a step.

✅ **THE STALE-CHUNK DEFECT IS FIXED, AND SO IS EVERYTHING IT WAS HIDING.** An absent cell
decoded as `ck_base + 0` and one base serves a whole 32×32 tile, so a brush of radius 7 **wrote
91 cells and moved 4096**. One decode (`hex_of`) now asks the predicate the write path already
asks. ⚠ **It had also made every terrain number in the tree one height unit high** — three
presses of `PEAK_STEP = 6` stood 19 units, not 18 — because `brush` adds its delta to `ground_h`
and read the leaked base back as existing ground. Four fixtures were resting on it, the cart's
rest solve and the towed trailer's were both rebuilt on brackets, and `tools/script.mjs` grew
`meshr`. **All of it is [JOURNAL.md](JOURNAL.md) § session 15** — including the two obvious
fixes that a probe refuted, which is most of the value.

⚠ **THE ONE SENTENCE TO CARRY OUT OF IT**: the entry survived four days on *"they all check the
store and the store is right"*, and the store was never right — the gates agreed with the picture
because they asked **the same broken reader**. **When a count and a picture agree, they may share
an instrument.**

## ⏭ THE HEADLESS THREAD — where it stands, in five lines

`EditSession` (`lib/hex_editor/src/session.loft`) holds the eight registries the renderer needs
beside the store, the two-press draft, and a driver's pose. **The server holds one too** — the
same type, so the wire and a headless test cannot disagree about what a scene is. Five gestures'
CHOOSING moved with it (`prop`, `annex`, `slab`, `seat`, the wall run); each kept its sentence on
the wire and each verdict is byte-identical across the move.

**The pattern, for the next one:** move the choosing and the proportions, keep the sentence, prove
the wire unchanged, sabotage every new claim. **What is left in the server is transport** — the
dirty set, the client list, part mode's flags, and the pose (deliberately: a server has a walker,
a test teleports). The floor of the thread is the picture gates, which need a server by
construction.

⚠ **`es_author` IS A DRIVER'S POSE, NEVER THE EDITOR'S.** A test has no tick, so it teleports; the
server writes `px`/`pz`/`yaw` from its walker. Keeping a session author in step there would be a
second authority on where the author is.

## ⏭ AND THE GATES — 1838 s → 741 s, with the hot path taken off them entirely

⚠ **THE USER'S SECOND REDIRECT, 2026-08-06**: *"go at the gates instead"*, then *"they can
run on CI that's fine but not on the hot path we use for after each step we build"*, then
*"photographs should never be automatically taken, but requested in the testing script as
specific ticks"*, and the standing one — ***"where possible I want tests outside the
server"***. The last is the open thread; everything else below is landed.

✅ **TWO WAITS THAT COULD NEVER SUCCEED WERE 71 % OF THE SLOWEST GATE.** Profiled per
command (`camera_indoors`, 247 s, 99 % accounted): `frame` 12× at 8.5 s = 41 %, `snap` 8×
at 8.3 s = 36 %, `step` 12× at 2.7 s = 13 %, and 15.2 s before the first command. Only the
`step` rows were work.

- **`nextT()` waited for a `T:0;` body frame**, which the server broadcasts only `if
  moved`. Nothing has been asked to move at that point, so it ran its full 15 s and
  returned `false` into a discarded return value. **15,185 ms on an EMPTY script.** It is
  correct at its other four call sites, inside `hold`.
- **`browserLag()` interrogated a page that does not exist.** It branched on `--client`:
  without it, it read `parts.size` and `view` — globals of `html/editor.html`, ⚠ **deleted
  on 2026-08-02** when `/` became the wasm client. So `settle()` never fired and every
  `snap` and `frame` burned its full 8 s. Its own comment — *"a sleep here would be the
  same mistake as the `sleep(4000)` this replaced"* — was describing itself.

⚠ **THE CONTROL IS THAT THE HISTOGRAM DID NOT MOVE**: `subject 0.0188, grass 0.5873, sky
0.3615` before and after. Only the *probe* changed — `WIN` and `CANVAS` still follow
`--client`, because they decide the window size and the clip, and this tree already
measured what that costs (`grass 0.5336` against `sky 0.7734` for one scene).

✅ **AND A PHOTOGRAPH IS NOW TAKEN WHERE THE SCRIPT ASKS FOR ONE.** `frame` took its own
screenshot, so a `snap` and the `frame` beside it photographed one instant **twice** and
the PNG on disk was never the frame that was judged. `snap` is the only camera now;
`frame` judges what it took and fails loudly if anything moved the world since. Checked
both ways: judged row identical, orphan row `rc=1`.

| | before | after |
|---|---|---|
| `camera_indoors` | 240 s | **74 s** |
| `cache` · `client_mesh` · `cellar_ceiling` · `deck_soffit` | 201 · 206 · 159 · 114 s | **49 · 37 · 50 · 27 s** |
| **44 gates, sum of work** | **1838 s** | **741 s** (188 s wall at 4 jobs) |

⚠ **AND RUNNING THE GATE SERVER NATIVELY DOES NOT HELP — measured, and it was the first
hypothesis.** `camera_indoors` is 240 s interpreted against **248 s native**, identical
rows; a light gate is 5.4 s against 5.7 s. Startup alone is 6 s against 3.5 s, so a
pre-built native runner is worth ~110 s across the suite and nothing more. `GATE_LOFT`
already exists if that is ever wanted. **The server was never the bottleneck.**

✅ **AND THE STRUCTURAL AUDIT IS DONE — all 44 gates are classified, and the answer was
not the expected one.** Seventeen carried no declaration; auditing them by *what the
verdict asserts* rather than by what the header says found that **most were already
thinned** and only the declaration was missing. Nothing needed moving out; what was
missing was the sentence saying it had been. The classification and its discriminator
now live at the top of [`tools/run-gates.sh`](../../tools/run-gates.sh), where a reader
of the gates starts.

| the verdict reads | what that makes it | examples |
|---|---|---|
| acknowledgement strings only | a **wire** gate — the rule is a loft test, this is the gesture reaching it | `fence`, `field`, `storey` |
| the store, via `26:`/`15:` | a claim that **could** move — three are kept, each for a stated reason | `doorstep`, `part_inst`, `part_mode` |
| a file's bytes | disk **routing** after a gesture, and null-edits | `part_save`, `part_check`, `part_new` |
| the emitted mesh or a picture | needs a server **by construction** | the five browser gates, `part_mode` |

⚠ **TWO GATES CLAIMED MORE THAN THEY CHECKED, and that is the hazard this audit is
for.** `vegetation` argues four properties and judges three — two moved to
`hex_editor/tests/field.loft`. `cart` argues the wheel law while its verdict is
`grounded && banked && bankSigned`; the law is eleven tests in
`moros_sim/tests/cart_as_data.loft`, several bit-identical. **A header describing
coverage that has already moved is worse than none**: the next person to thin the file
would be thinning something already gone. Both headers now say what is true.

⚠ **AND A FIXED WAIT IS RIGHT WHEN THE CLAIM IS AN ABSENCE.** Everything else polls for
evidence, because a gate that sleeps reports the machine — but *an unchanged library
sends nothing in 4 s* and *a refused toggle sends no `H:` at all* have no event to wait
for. There the window **is** the instrument.

✅ **AND THE SERVER COUNT WAS THE LAST THIRD — TAKEN, BUT NOT THE WAY IT LOOKED.** The
idea was to *share* a server across gates. Probed first, and the probe killed it by
removing its reason: startup was 5–6 s because the server was **interpreted**, not
because starting one costs that. Exec'ing the already-compiled binary reaches *listening*
in **217–273 ms**, and **nothing is shared** — each gate keeps its own process, port and
`EDITOR_PARTS`, which is exactly what sharing would have cost. (Sharing cannot work as
posed anyway: `EDITOR_PARTS` is read at server start, so one server is one part library,
and `part_save`, `part_new` and `library` all mutate it.)

| 44 gates | work | wall at `GATE_JOBS=4` |
|---|---|---|
| start of the thread | **1838 s** | ~6 min |
| after the dead waits, photographs and sleeps | 655 s | 168 s |
| **now** | **483 s** | **126 s** |

⚠ **THE FIRST FULL SUITE THIS WAY WAS 7 GATES RED, AND EVERY VERDICT LIED ABOUT WHY.**
`cache` and `client_mesh` reported nothing; `camera_indoors` and `deck_soffit` came back
`subject 0.0001` — a near-empty frame; `persist` failed both its acks. They read as
rendering and streaming defects and were **one thing**: a compiled loft program roots its
relative file I/O at **its own directory's parent**, baked in at compile time. From
`src/.loft/cache/` that root is `src/.loft/`, so shots, recordings and saved worlds went
nowhere — the server log said `cannot create …/src/.loft/cache/../shots/shot-1.txt —
write skipped` while the gate reported a blank picture. ⚠ **Neither `--project` nor an
environment variable overrides it**; both measured, both ignored. The cure is a copy at
`.gatebin/server`, one level under the repository — ⚠ **and the client page has to travel
with it**, because `read_client()` reads `{source_dir()}/.loft/editor_client.html` and
`source_dir()` follows the binary: the server served its own 404, 178 bytes instead of
2.3 MB, and the browser drew nothing. **A missing FILE wearing a renderer's clothes,
twice.**

⚠ **THE STALE BINARY IS THE FATAL CASE, AND IT IS CONTROLLED RATHER THAN ASSUMED.**
Measured first: with the source edited to answer `placed 0,0 STALEPROBE`, exec'ing the
cached path still answered `placed 0,0` — a green suite against yesterday's server.
loft's cache is content-addressed **and self-cleaning**, so the build runs once in
`run-gates.sh` before anything fans out and is **never skipped on a timestamp guess** — a
heuristic standing in for a content hash admits exactly that silent failure. Re-checked
end to end after the copy step existed: source changed → `fence` FAILS carrying the new
string and `.gatebin/server`'s md5 moves; reverted → PASS again.

⚠ **The gates now exercise the NATIVE server** where they used to exercise the
interpreted one. That is closer to what ships — `make play` is native — and
`camera_indoors` measures identical rows on both. `GATE_LOFT=--interpret` puts the old
path back in one variable.

⚠ **AND `G1`(b) REFUTED A SENTENCE OF ITS OWN DESIGN.** *"If synthesising a column is not far
cheaper than reading a stored one, there is nothing here"* — measured over 102,400 reads each
way, an absent-chunk read is only 1.1–2.1× cheaper (`world_surface` 1103 ns stored against 947
absent). **The sentence is wrong, not the design**: GROUND_DEFAULT removes the *write*, not the
read, and the read only has to be **not dearer**. ⚠ Which moves the design's real cost to `G6`,
where it was not priced — an infinite ground plane means the mesher builds chunks it skips today.

⚠ **THE SUBSTITUTION IS EXHAUSTED — SWEPT, SO DO NOT SWEEP IT AGAIN.** A scanner over every
`.loft` for a `world_set_column` inside a loop: the four that mattered are done, and what is
left is worth **under half a second**. ⚠ **`hex_editor`'s fixtures were already on the fast
path** — `ground_set` → `layer_write` is `world_set_cell` — so there is no second `G3` there.
⚠ **And `gesture.loft`'s remaining column writes must not be touched**: they pass `co_ids` to
insert a *named* layer, which is the one thing `world_set_cell` cannot do.

| where the suite time is now, per package, interpreted | |
|---|---|
| **`hex_editor` 56 s** | 235 tests, **flat** — 23 files from 1.4 to 5.4 s, no fixture dominating. It is real work, not another `place.loft` |
| **`hex_part` 35 s** · `moros_sim` 24 s · `hex_voxel` 7.6 s · `moros_render` 7.3 s | the other six packages are under 3 s each |

⚠ **A per-file loop is a fair instrument** — `loft test` over `hex_part` and the sum of its 16
files run one at a time agree at 35–39 s. A first reading suggested a 5× package-mode penalty;
it was drift.

| still true, measured 2026-08-06 | |
|---|---|
| nothing about the harness is slow | 2.2 ms marginal per test; `lavition_ui` runs 65 tests in **447 ms** |
| compile tracks the **dependency cone** | `lavition_ui` 20 ms · `hex_voxel` 119 ms · `hex_part` 492 ms · `hex_editor` 1.28 s · `hex_mesh` 1.46 s |
| gates — ✅ **taken, see below** | 44 gates were **1838 s** of work and are now **741 s**, 188 s wall at `GATE_JOBS=4`, 44 PASS / 0 FAIL / 0 never-listened |

⚠ **THREE HYPOTHESES ABOUT THE WRITE PATH WERE EACH REFUTED BY THEIR OWN PROBE**, so do not
re-derive them: the step-4 window scan is worth 3 %, step-6 elision 6 %, **both together 12 %**,
against a **0.09 ms floor** for a call whose body does nothing. A calibration says those scans
should cost more than the whole write, and that disagreement is **unresolved** —
`probe/perf/README.md` has it. ⚠ **`G1` did not resolve it and did not need to**: the in-place
write skips both scans *and* the column machinery around them, which is why it wins 17× where
removing the two scans alone won 12 %. ⚠ And the first version of that measurement printed `0 ms`
for everything because `now()` returns **milliseconds** and was divided by 1,000,000 — the same
unit trap that made `G1`'s first read column print `0 us`.

✅ **THE EDITOR CAN NOW SAY WHERE A MESSAGE'S TIME GOES** — `27:2` arms a per-message profile,
`27:3` reports `id count us tau`. [WIRE_PROTOCOL § `27:`](WIRE_PROTOCOL.md). It carries `w_tau`
beside the microseconds because the edit clock is exact and a millisecond figure measures the box.
Checked in both directions before being believed (`probe/perf/profile_*.mjs`).

## Plan 17 — **`A8` is complete**; two rows are ◐ and both wait on the user

**Green as of 2026-08-08** on loft `9f416d7c`, hash stamped at both ends of every stage:
`make gate` **45, rc=0** · `make lib-test` **22 of 22** (11 packages × both backends) ·
`make fast` 117 files · `make parts` green, `data/parts/` byte-identical · layering and
`names.sh` silent.

| `hex_editor` **266** | `hex_voxel` **120** | `lavition_ui` **65** | `hex_part` **277** |
|---|---|---|---|
| `moros_sim` **310** | `moros_render` **167** | `moros_map` **92** | `moros_editor` **56** |

⚠ **THE TOOLCHAIN WAS REPLACED THREE TIMES IN ONE SESSION and only the stamp said so** —
`4c93f40e` → `6ef016ba` → `9f416d7c` on 2026-08-07/08. `loft --version` says `2026.8.0` for every
build, so the version string cannot tell two installs apart. **Stamp `sha256sum
/usr/local/bin/loft` at both ends of every suite, and warm a new binary** (`make client`, then one
server up and down) before believing anything. ⚠ **And capture the exit code on the line AFTER the
command** — a stamp between `make gate` and `echo "rc=$?"` reports the STAMP's status.

### What to do next

**The per-step record is [plan 17](../../plans/17-parts/README.md)** — every `Ax.y` carries a
*What it turned up*, and `A8.2b`–`A8.7`'s are the newest. **The session narrative is
[JOURNAL.md](JOURNAL.md) § session 14.** What is not in either, because it is a decision rather
than a record, is at the top of this file: `A8.3` needs the user's eyes and `A8.6` needs a gesture
nobody has written.

### Plan 19 — `L1`–`L6.2` done or raised; `L6.3` is blocked on the PROGRAM, not on `A8`

[#19](https://github.com/jjstwerff/moros/issues/19) · design
[LAVITION_SPLIT.md](LAVITION_SPLIT.md) · steps
[plans/19-lavition-split](../../plans/19-lavition-split/README.md).

⚠ **THIS BLOCK SAID *"the MOVE is blocked on `A8` landing, for hexbody's reason: `MeshAt` is
changing shape right now"* — `A8` landed 2026-08-08 and the clause was three days stale.** Running
the invariant the moment it cleared is what found the real blocker underneath: **the editor program
imports two Moros packages and does not compile without them.** See the section at the top of this
file. The corrections below were never blocked, which is why six of them landed while the premise
under them was false.

✅ **`L1` AND `L2` ARE DONE (2026-08-06).** `hex_voxel::Surface` → **`SurfaceAt`** (the tree's own
`MeshAt`/`SocketAt` convention for a derived positional record), so the silent merge with
`moros_terrain::Surface` is gone — the negative control produced its five *"Unknown field
`Surface.sf_r`"* errors first. And `moros_terrain` → **`hex_mesh`**, with `layering.sh`'s default
flipped from *exempt by pattern* to **checked, with a named `CONSUMERS` list** — because the skip
was the other half of the mechanism, not the name alone.

⚠ **`L3` WAS WRONG AND ITS OWN PROBE SAID SO.** *"Swap the three lattice calls to `hex_grid`"* —
except `hex_to_world` **already calls `hex_grid::hex_to_px`**, and `mr_corner_offset`'s six corners
already come from `hex_grid` with a `(6-i)%6` map every call site compensates for again. They are
the **3-D projection**, not the lattice, and `HEIGHT_SCALE` alone has **83 uses in
`editor_server`**. A naive swap would have rotated every corner and dropped every height **with
every count agreeing**. Replaced by `L3′` — a small `hex_proj`, because the obvious fix is already
a reverted experiment (`moros_sim` inherits `hex_editor`'s cone and dies on `Cannot redefine
'fabs'`). Until then the debt is `KNOWN="hex_mesh:moros_render"` in `layering.sh`, **printed every
run** with its reason.

✅ **AND `L3′` LANDED THE SAME DAY.** `lib/hex_proj` holds the projection — `HEIGHT_SCALE`,
`hex_to_world`, `hex_corner_world`, the corner map — on `hex_grid` + `graphics` and nothing else,
because **both obvious homes were already-failed experiments** (either direction pulls
`hex_editor`'s cone into `moros_sim`). `layering.sh` is now silent with `KNOWN=""`: **the lavition
stack has no Moros dependency at all**, for the first time.

⚠ **ADDING A PACKAGE INVALIDATES THE BUILD CACHE LIKE A LOFT INSTALL DOES** — the first suite after
`hex_proj` gave 3 `SERVER NEVER LISTENED` plus the `walk`/`hipskin` pair; **one warm server took it
to zero.** The warm-up rule above is written for an install; it applies to a new package too.

✅ **AND `L4` IS RAISED — [`loft-libs-world#13`](https://github.com/loft-lang/loft-libs-world/issues/13),
with an 8-control probe behind it** (`probe/l4/run.sh`). **Theirs keeps `hex_world`; ours becomes
`hex_voxel`** — not on merit (ours is 2,041 lines to their 400) but on possibility: they have
published three versions since 2026-06-14 and loft's **own test suite** consumes them, so theirs
is the rename that cannot be done. ⚠ **And the package rename says nothing about the types.**
Four public names are declared by both. The two `World` structs do **not** merge — but a **bare**
`Chunk { … }` binds to whichever package was `use`d **first**, and `G`'s error is
`Unknown field Chunk.ck_cells`: the `Surface` diagnostic of `L1`, verbatim, one rename later. So
`L6` renames `World` and `Chunk` too, before publishing, because after is never.
Two loft defects fell out — [#788](https://github.com/loft-lang/loft/issues/788) (the order-
dependent name) and [#789](https://github.com/loft-lang/loft/issues/789) (the suggester reading
the registry index, advising `use hex_world;` on a file that has it).

✅ **AND `L6.1` IS BUILT — [`tools/names.sh`](../../tools/names.sh), the public-name check the
design has listed since it was written.** A public name is global, and a bare one binds to the
first `use` (loft#788), so the check runs over the *graph* — which is the thing no package suite
can see. ⚠ **Its first run found a live defect with nothing to do with the split**:
`editor_server.loft` imported `moros_map` and used **none of its 81 names**, the import's only
effect being to shadow `hex_distance` with the AXIAL copy whose sheared discs the file's own
comment already records — 34 boundary edges where a hex disc has 30, wrong for the road, the
scatter, the storey and the house footprint. It is gone; the qualifiers stay because they say
which lattice is meant. ⚠ **`gridmesh` and `hex_voxel` both declare `chunk_of`, and `gridmesh`
won in the server while `hex_voxel` won in the client** — same two packages, opposite answers,
decided by the `use` order alone. Both aliased now. Also `hex_part`'s duplicate `hex_dist`
deleted, and `fit_text`→`fit_why`, `Rect`→`UiRect`, `chunk_of`→`world_chunk_of`.

⚠ **THE INSTRUMENT WAS WRONG THREE TIMES FIRST, AND THAT IS WHY THE LIST IS SHORT.** An aliased
import exposes **no** bare name (measured); a method resolves by **receiver** (`server` declares
`close` twice by itself); and the replacement name I first picked, `fit_reason`, was refused by
the tool because the registry's `hex_fit` publishes one. ⚠ **That last one is a finding**:
`hex_fit` *is* a doorstep, field for field with `hex_editor::Fit`, and whether they converge is
now an open question on the plan rather than a spelling.

**What is left**: ✅ `L6.2` is **done** (2026-08-11, top of this file), and what remains is
`L6.3a` (wean the program off `moros_render` — 42 sites, mostly `L3′` finished), `L6.3b`
(`moros_sim`, 11 sites, which needs open question 5 answered first) and then `L6.3c`–`L8`.
⚠ **The line here that read *"the gates have not been run since `L6.1`"* was already false when
written** — `L6.2` ran them the same day, **47 PASS / 0 FAIL / 0 never-listened**. The durable
half of it is still true and is why it was written: **a new dependency edge invalidates the build
cache exactly as a new package does**, so warm one server up and down before believing a suite.

✅ **AND `L5` — THE GATE FLAKE — IS FIXED, so a required PR check is now possible.** Three gates,
two bugs, neither a timeout that wanted raising:

- **`cache` read the FIRST value of a running verdict.** The client re-answers on every `D:`
  digest and its first answer is `agree 0 bad 24 layers 0` — nothing cached yet. ⚠ The `last`
  verb's own comment already described this class and `clientmesh.keys` had already learned it.
  New `until <prefix> <field> <op> <value>` verb waits for the evidence and **fails saying what it
  did see**; the gate now reads the LAST match, not the first (`String.match` without `/g`).
- **`walk` and `hipskin` slept on the WALL CLOCK, which measures the machine.** Under four
  interpreted servers 1700 ms delivered one frame instead of 44. They advance on **frames
  received** now — the very quantity the verdict is computed from.

⚠ **AND A TRANSFORM ONLY ARRIVES WHILE THE BODY IS MOVING**, which the first fix did not know: a
count taken *after* releasing `W` can never be reached. Hold until the evidence exists, then
release and judge together.

**Evidence: 4 consecutive clean full suites** (44, rc=0, zero failures, zero never-listened) plus
3 contended `gate-rep` runs. ⚠ **And gathering it that way was itself waste** — see the fast path
under *How to run things*: three contended repeats answer in **2m54s** what four full suites took
~80 minutes to say.

### What plan 17 is still short of, and it is one thing

✅ **A BOUND LEAF WHOSE BODY IS CELLS IS DRAWN, as of `A8.2`** — the display path meshes the part's
own chunks with `part_body_meshes` (shared with the thumbnail) and poses each surface; `A8.2b` adds
the scale, so one authored at a finer unit is shrunk to fit its opening. ⚠ **Still true: no gesture
can author a `FITS`**, so a cell-bodied leaf that fits a socket cannot yet be made from the editor
at all — every one in `data/parts/` was written by `src/prop_build.loft`.

⚠ **`A5.2`'s ACCEPTANCE IS A COLD-RECOGNITION TEST AND NEEDS THE USER'S EYES**: *does a person call
it a door.* Render it and hand over the picture; do not claim it from a green suite.

### ⚠ The per-step record is in the PLAN, not here

[plans/17-parts/README.md](../../plans/17-parts/README.md) carries a **What `Ax.y` turned up**
section for every step — the findings, the controls, and what each sabotage cost. This file
carries only what is true *now* and what bites regardless of which step you pick up. The arc's
narrative is [JOURNAL.md](JOURNAL.md); **session 13 is its newest entry.**

⚠ **THIS FILE GROWS BACK, AND IT HAS FIVE TIMES.** 2,446 lines → split to a handoff; 785 across
sessions 10–12 → ~400; 907 at the end of session 13 → ~300; 1,011 at the end of session 15 →
~960; **1,684 at the end of session 18 → 1,153 here** — 451 lines of session-18 narrative, 113
of session 17's `A9`/`A10`, and the last 53 of session 16's, all moved to the journal rather
than cut. ⚠ **Three sessions' logs had accumulated here at once**, which is how it grows: each
one looked like the current state while it was the newest. Every regrowth is the same shape: per-step findings the plan already carried, and a
session narrative that belongs in the journal. **When a session ends, its entry moves out.**
Moving is not thinning — nothing is ever deleted on the way, which is why the journal is 3,800
lines and this is not.

⚠ **AND THE LAST MOVE WAS ONLY HALF DONE, WHICH IS WHY THE NUMBER BARELY FELL.** Session 15's
narrative moved out; **§ *AND THE GATES — 1838 s → 741 s* below did not, and it is session 14's,
not the present.** It is ~160 lines describing work that is finished — `nextT`, `browserLag`,
the structural audit, the `.gatebin` copy, the stale-binary control. Some of it is durable
(*a fixed wait is right when the claim is an absence*; the `.gatebin` trap; **the gates exercise
the NATIVE server now**), and most of it is a record of getting there. **Whoever next thins this
file: that block is the work, and the durable sentences go to § *What bites*, not to the bin.**

### ⚠ What bites regardless of which step you pick up

⚠ **`.gatebin/server` IS BUILT BY THE GATE RUNNER, NOT BY AN EDIT.** Editing a library and
then running `./.gatebin/server` measures **yesterday's binary**, and it reads as a working
instrument reporting a null result — the worst possible shape. It cost three changes reverted
on false evidence in one session. `make gate-one G=<any>` is what rebuilds it and
`md5sum .gatebin/server` is how you check. ⚠ **And reaching for a photograph first is what
cost the detour**: two changes were judged by eye (*"the picture is unchanged"*) when the
cheap question was *did it emit anything at all*.

⚠ **WHAT ADDING A TERRAIN COSTS, AND TWO GUARDS ARE WHY IT IS KNOWN.**
`hex_mesh/tests/terrain_link.loft` — *every terrain is drawn by exactly one surface* — goes
red the moment a many-to-one join appears, which forces it to be **stated** rather than
quietly loosened. `hex_mesh/tests/surfaces.loft` pins the stride with *if a surface is added
this fails, and it SHOULD*: **fourteen** files carry `SURFACES` and every one reads the id
space by modulo, so a new surface must be APPENDED or everything already numbered moves.

⚠ **A TEST CALIBRATED TO A CONSTANT IS A SNAPSHOT OF ONE SETTING.** A bound of `< 4.0`
measured at `WATER_TRICKLE` 0.34 went red at 0.6 while reporting a river that was perfectly
correct. Predict the bound from the constant — `3.0 + 2 × WATER_TRICKLE` — so the dial moves
either way and a build that stopped working still fails.

⚠ **A WAIT THAT SETTLES ON NOTHING REPORTS SUCCESS.** `quiet` returns as soon as a count
stops changing, so under four contended servers — where the rebuild has not started yet — it
settles at **zero and returns true**: no `!!`, no timeout, a clean settle on an empty block.
That is `part_limb`'s three-time flake, and `L5` fixed the same class once already. **Wait
for the evidence, then settle.** ⚠ And the evidence must be per-attempt: `g.meshes` is every
`M:` id for the whole session and is never reset, so `meshes.length > 0` is true forever
after the first one — a guard that reads exactly like a guard. `g.picture` is cleared per
open and is what to ask.

⚠ **A GATE'S FAILING ROW IS NOT IN THE SUITE OUTPUT.** `verdict()` prints its rows to stdout
and `run-gates.sh` keeps only the last line, cut to 100 characters — so *which* conjunct
failed can only be seen by running the gate by hand against a server. Three flakes were
diagnosed as "some other field" before anyone did.

⚠ **A ONE-SIDED GUARD READS EXACTLY LIKE A GUARD, AND THIS TREE HAS NOW WRITTEN ONE THREE
TIMES** — `faced_between`, `stroke_over_limit`, and a balance arm reading `if owed > 0` that
fired on a descent and did **nothing** on the mirror. Ask it from both ends before believing
a zero.

⚠ **A TEST THAT ASSERTS A NOT-BUILT STATE IS WORTH WRITING.** `A2b`'s corridor row asserted
the cover grew by *exactly* what the ground gained — a measurement of the gap — and it went
red one commit later at *"if that is now intended, this row is the one to change on
purpose."* A gap nobody pinned is a gap that gets closed silently.

⚠ **PHOTOGRAPHING AN ALTERNATIVE OVERWRITES `shots/` UNDER THE SAME NAMES.** The directory is
gitignored so nothing wrong is committed, but the wrong frames on disk read as a missing
feature to the next person who looks. Copy the shipping render back and verify it.

✅ **AND THE CART NO LONGER STANDS IN AN OPEN PART (2026-08-08).** Part open already empties eight
registries because *a part has no runs, roofs, leaves or dressing of its own*; a cart is dressing,
and it was the ninth thing that argument covers. It is `X:`-ed on open and re-sent on close, and a
client that joins **while** a part is open is not given one either. ⚠ **It had occluded the subject
in every part picture in this tree, and was read as part geometry twice in one session** before
anyone zoomed in far enough to count its wheels. Gated by id, not by colour — the cart's brown sits
next to the figure's in chromaticity, which is why no pixel test could have told them apart.

✅ **PART MODE LEFT THE PREVIOUS PART'S CHUNKS ON SCREEN — FIXED 2026-08-08, AND IT WAS THE
CLIENT.** Every guess about the server was wrong: both `44:` forms already mark every loaded chunk
dirty, and `probe/a83/leaf_visible/held.mjs` proved the **wire is correct** — under `door/leaf` the
client is told to hold 30 floor vertices and no wall. The fault was one line in
`src/editor_client.loft`: `add_mesh` returned on `len(mverts) < 6` **before** `drop_part`, so the
server's clearing message (a colour and no vertices) was discarded and the old buffer kept drawing.
⚠ **The limb block's own comment — *"a leaf that was unbound leaves its mesh on the client for ever
otherwise"* — described a mechanism that had never once fired**, for the same reason.
⚠ **NO WIRE PROBE COULD HAVE FOUND IT, and the two instruments disagreeing is what located it.**
`held.mjs` said the id was gone; the screenshot said 300 vertices of wall were standing. Both were
right. **When the wire and the picture disagree, the client is between them.** Gated by
`probe/a83/leaf_visible/switch.sh` — 13014 wall pixels broken, 394 fixed, measured both ways.

⚠ **A `Mesh` COPIES THROUGH A LOCAL *AND* THROUGH A VECTOR READ — only a PARAMETER aliases.**
Measured 2026-08-08, `probe/a83/leaf_visible/meshalias.loft`: `la = a; emit(la)` leaves `a` empty,
and so does `v[0]`. ⚠ **That is NOT what loft#774 records for a plain struct** (*copies on `b = a`,
**aliases** on `c = v[0]`*), so the note below must not be relied on for one. It matters because
selecting a destination mesh is the natural way to route geometry — `m = all[i];
emit_wall_panel(m, …)` — and it **drops every triangle** with no diagnostic, every count agreeing,
and a blank wall in the picture. Pass every candidate as a parameter and branch (`emit_panel_into`).

⚠ **READING A STRUCT FIELD ALIASES; READING A PLAIN LOCAL COPIES** — loft#774/#775, and it bit
again on 2026-08-08. `held = sess.es_roofs` shares its vector with the live one, so clearing the
live registry emptied the held copy and part mode restored nothing: *6 of 440 surfaces differ*.
`held = sess` (a whole local) copies. **When you hold something aside, hold the OWNER, not a
field of it.**

⚠ **A TYPE MUST BE DECLARED BEFORE THE STRUCT THAT DEFAULTS TO IT.** A `DraftStep` holding
`RunDraft = RunDraft {}` inserted above `RunDraft` gives *Undefined type RunDraft* — and then
twenty-four test files failing on types that were fine, because a parse error in `gesture.loft`
takes every consumer's types with it. No forward references.

⚠ **A RAISE LANDS TEN HEXES AHEAD OF THE AUTHOR** (`peak_cell`), and a stencil's footprint is
placed ahead of them too. A test that raises and then reads the author's own cell measures a cell
nothing happened to; take the cell from the `Ack`'s `ak_q`/`ak_r`, which exists for that reason.

⚠ **`Fit.ft_offer` IS AN INTEGER *"meaningless unless ft_ordinal"*.** Asserting on it for a NOMINAL
refusal asserts nothing — `ft_ordinal` is the field that carries the claim.

⚠ **PASS THE CONSTANT THE HANDLER PASSES.** A niche test that invented its own band was refused
*"too shallow to stand in"*; the editor cuts with `hex_draw::BAND_SIDES` (√3/2). A test with its
own number measures a thing the editor never makes.

⚠ **THE PLAN TABLE IS NOT THE DESIGN.** `A8.7`'s row quoted §P9.5 after §P9.11 had replaced it, and
building the row as written would have shipped a check that refuses a cape. Read the § a row cites
before implementing it.

⚠ **THE INSTALLED LOFT LEADS `main`, AND THAT IS DELIBERATE.** `/usr/local/bin/loft` is put here
ahead of `main` on purpose, so that a language defect is fixed **in the language** rather than
worked around in **our** libraries. When a library suddenly fails on a shape that has been fine
for months, the move is to measure it, file it, and wait for a toolchain — **not** to start
editing `lib/*` around it. Mutating the libraries to dodge a compiler bug is the failure this
setup exists to prevent, and it looks exactly like ordinary work while you are doing it.

✅ **The instance that earned that note is CLOSED, and it is the reason the note exists.** The
redundancy lint asked for the `&` off any parameter whose binding is never reassigned; doing that
at all 50 sites it flags took `hex_voxel` from **114 green to 96 failed** with `Delete on locked
store`, and `src/editor_run.loft` from exit 0 to SIGABRT — while `--native` passed all 114 on the
same source, so a per-backend green said nothing. It was *right* at some sites and wrong at others
**in identical words**. Measured, filed as
[loft#760](https://github.com/loft-lang/loft/issues/760), fixed within hours, and the 50 `&`s are
now dropped. ⚠ **The lint is back at 4 sites, all `wld: &World`** — the exact class; not touched.
**The compiler's advice is a hypothesis. Run the suite against it; the check costs one run.**

✅ **THE 22-OF-48 STALE CHUNKS ARE FIXED (2026-08-08), AND THE ENTRY HERE NAMED THE WRONG ORGAN
FOR FOUR DAYS.** Not a marking radius, and not a ray: `mark_dirty` covers `PEAK_R + 2` around a
brush of `PEAK_R` and contains the write exactly. **An unwritten cell read back its chunk's window
base** — one base per 32×32 tile — so one brush moved 4096 cells' apparent ground. ⚠ **The line
that kept it alive was *"they all check the store and the store is right"*: the store was NOT
right, and the gates agreed with the picture because they asked the same broken reader.** When a
count and a picture agree, ask whether they share an instrument.
[OPEN_ISSUES](OPEN_ISSUES.md) has the numbers. ⚠ Settling a photographed world is still right on
its own merits, and `part_mode.mjs` still does it.

**A struct name is GLOBAL across a consumer's dependency graph, and a package suite cannot see
it.** `hex_part` was 131 green while `hex_editor` would not build, because both declared `Fit`.
Grep `lib/`, `src/`, `../loft-libs-world/` and the registry before adding a public name — and when
one is taken, **read the collision**: `hex_editor`'s `Fit` had already settled the ordinal/nominal
question `hex_part` was re-deriving. Now a working rule in [CLAUDE.md](../../CLAUDE.md).

**Only 6 of the 24 headings can turn a BODY ON THE LATTICE**, and the other 18 tear 12–22 of a
test body's 90 adjacencies — no cells lost, every count agreeing, holes in the walls.
`moros_map/tests/headings.loft` prints the table every run. ⚠ The 24 came from `hex_shape`'s
`d24`, which is a space of LINE directions; a run may staircase and a body may not.

⚠ **`A6.2` NARROWED THE REFUSAL AND THE NARROWING IS THE INTERESTING PART.** The measurement is
about something *on* the lattice, so `expand` now asks `part_lattice_free` — *is anything
displaced by a rotation*: its own cells, a nested part at an offset, a socket at an offset. A
body with none of the three takes all 24 exactly. ⚠ **The question is never *does it have a
mesh***: §P5 lets a part be both, and a pillar that is a `.glb` for the eye and a column for the
walker still has a cell to tear. `bake` keeps the blanket rule — it produces cells, and a
lattice-free body produces none.

⚠ **AN AIM AND A TURN ARE DIFFERENT QUANTITIES.** An `INST` facing and a `SOCK` heading say which
way a thing should LOOK; `ANCH`'s facing says which way the part looks in its OWN frame; the turn
applied is the difference, wrapped. Without it, re-modelling a statue turned by 6 stands it
turned by 6 in every socket in the library with every number unchanged.

**A field's freedom depends on whether anything ever REFERS to it**, and that is not knowable
when the field is designed. `A4.1` gave a socket name the tail and a comma; `A4.3` had to take
the comma away, because a `BIND` names a socket between two commas and the part handle must be
the tail.

**`.gitignore:47` ignores every `.glb` EXCEPT the part library's own.** The rule exists for the
`moros_render` CLI examples, which write theirs cwd-relative; `A6.2` added
`!data/parts/**/*.glb`, because `data/parts/` is content and a committed part that names a mesh
no clone has is a part that cannot draw. ⚠ **A committed binary is invisible to `git status`,
passes locally and is missing on every other clone — run `git check-ignore -v` before adding
one**, and check the negation's control too (a `.glb` anywhere else must still be ignored).

**`loft test` runs any zero-argument function that returns nothing as a TEST.** A bare `wipe()`
helper is listed among the test functions and executed in the runner's order. A parameter is what
keeps a helper a helper.

**[loft#772](https://github.com/loft-lang/loft/issues/772) is filed and open** — a `&` parameter
**reassigned** from a local or a call is a hard error, *"has & but is never modified; remove the
&"*; from a LITERAL it compiles and propagates fine. ⚠ **The fix it names is the silently wrong
one**: measured, `with &: caller sees 3` and `without &: caller sees 0`. Same shape as #760 — a
redundancy lint right at some sites and wrong at others in identical words. Workaround: split
detection from mutation and let the caller do the assignment.

**Every gate now gets its own copy of `data/parts/`** (`tools/run-gates.sh` sets `EDITOR_PARTS` to
a temp copy), so a gate may add and remove parts to prove the catalogue follows the library. ⚠ **A
gate must never write to the committed library** — this tree is worked by more than one agent, and
a gate that fails leaving the repository dirty is worse than no gate.

⚠ **[loft#775](https://github.com/loft-lang/loft/issues/775) is filed and open, and it is the
one that cost real time** — a struct-field alias that OUTLIVES its owner is silently overwritten
by the next allocation. `wld = pt_ld.wl_world` made the editor's session-long world a second name
for a field of a handler-local; measured with a `println` either side of one call, `tau 20 chunks
4` → **`tau 0 chunks 0`** across `stencil_part`, which never assigns to its argument. **The edit
clock going DOWN is the tell** — it is monotonic, so it cannot be a write. ⚠ **The cure is to
assign through a local**, which #774 measured to be a copy. ⚠ **And the shape is everywhere**,
because it is what reading a result looks like: `x = <call>().field`. Ours survived by luck at
every site but one, and one allocation is the whole margin.

⚠ **LOFT HAS NO BLOCK-LOCAL DECLARATION — an assignment in a nested block writes the OUTER
variable.** Measured. `14:`'s handler parsed its payload into `part_name`, which is also what
`A7.3a` called the part being edited, so every stencil in part mode blanked the subject line and
the close acknowledgement. There is no warning and nothing at either site looks wrong; **grep the
enclosing function before naming a handler local**, the same way a public name is grepped.

**[loft#774](https://github.com/loft-lang/loft/issues/774) is filed and open** — a plain struct
**copies** on `b = a` and **aliases** on `c = v[0]`: the same assignment, opposite semantics, both
backends agreeing, and nothing in the source separating them. Measured while designing `A7.3`'s
store swap. ⚠ It means a second name for a `World` is a full deep copy of every chunk, and the edit
clock is blind to it — `w_tau` counts writes that changed something, and a copy changes nothing.
Workaround: mutate through a function parameter (those alias), or park the record in a one-element
vector and take `[0]`.

**[loft#767](https://github.com/loft-lang/loft/issues/767) is filed and open** — a string literal
nested inside an interpolation keeps its own `{…}` as **literal text**, so
`"{("{x}" as float?) ?? 0.0}"` reads `{x}` back as unparseable and reports the default. A silent
wrong value with no diagnostic; it made a scratch probe report a confident, wrong absence.
Workaround: put the inner string in a variable first.

### Where the two plans stand

**[#18 catalogue](https://github.com/jjstwerff/moros/issues/18)** — **every step done.** `B1`,
`B1.2b`, `B2`, `B3`, `B4`, `B5`, `B6`. The editor says what you are working on, things can be
named, and one list holds parts and materials alike, each row with a name, an image and its
availability.

**[#17 parts](https://github.com/jjstwerff/moros/issues/17)** — **`A1` through `A7.3` complete,
and `A3.4` and `A5.2` are closed too.** In order: `A1.1` region copy · `A1.2` round-trip and
`part_diff` · `A1.3` store sections · `A1.4` `PART`/`ANCH` · `A2.1` the cottage on disk · `A2.2`
the stamp and the wire · `A2.3` one placement path · `A3.1` `INST` and the cycle check · `A3.2`
expand · `A3.3` `expand == bake` · `A3.4` telling §P8's two rules apart · `A4.1` `SOCK`/`FITS` ·
`A4.2` `socket_fit` · `A4.3` `BIND` and the derived position · `A4.4` the heading measurement ·
`A5.1` the hinge · `A5.2` the swing, record half then drawing half · `A6.1` the `MESH` section ·
`A6.2` the statue on the plinth · `A6.3` the swap · `A7.1` the catalogue IS the library, and can
change · `A7.2` the picker, which is #18's `B5` · `A7.3a`–`f3` part mode, from the store swap to
the `BIND` gesture · `A8.1` a bound leaf is a placement · `A8.2` the editor meshes and poses its
cells · `A8.2b` the derived scale and the unit refusal. **`A7.4` (keyed reads) stays deferred until
a number says it hurts** — `src/part_build.loft` prints the cost every run. **What is left of the
plan is `A8.3`–`A8.7`.**

⚠ **`data/parts/` NOW HOLDS THREE FAMILIES**: `house/cottage.hxw` (built by `src/part_build.loft`),
`prop/{statue,seated,plinth,shrine}.hxw` + two `.glb`, and `door/{oak,frame,doorway,plank,planked,slat,slatted}`
(all by `src/prop_build.loft`). ⚠ **`door/slat` is the ONLY part at another unit** — 0.125 against
everything else's 0.25 — and it exists so the scale path has a consumer; it is a limb or it is
refused. `make parts` runs both builders, and every committed file rebuilds byte-identically — which is what makes committing a generated
`.glb` sane. ⚠ **`expand == bake` is now a claim about CELL nests only**: `bake` refuses a nest
holding a mesh (`BK_MESH`) rather than dropping it, because a baked part holds one `MESH` section
and no position for it.

⚠ **`A6.3` NEEDED NO NEW CODE, AND ITS FIXTURES ARE THE DELIVERABLE.** Swapping a bound part is a
one-field edit, which is what §P3 promised — so the step is controls, and two of them proved
nothing until sharpened: both statues anchored at `(0,0,0)` cannot tell *the position is the
socket's* from *the position is the leaf's*. ⚠ **A test about an ABSENCE starts out unable to
fail**, and `bind.loft`'s one invariant is exactly such an absence.

The editor now has a panel: a subject line the **server** authors, six labelled buttons, a
material catalogue with swatches drawn by the world's own shader, and greyed entries that say
why. `probe/b1/client_live.png` is what it looks like; `make probe-text` regenerates it.

### The environment overrides, added for gates and useful on their own

`EDITOR_PORT` (a driving gate and a human session on one box), `EDITOR_PARTS` (a part library
somewhere other than `data/parts/` — `B5.3`'s gate has to CHANGE a part while the editor
watches, and doing that to a committed file corrupts a tree two agents share), and
`PART_ROOF` / `PART_RADIUS` / `PART_OUT` on `src/part_build.loft` for building a variant
cottage. Defaulted, `make parts` writes the committed file byte-identically.

### Built and not yet called

⚠ **`44:` PART HAS NO CLIENT BINDING — only the gate drives it.** `A7.3a` says *no new gesture*
on purpose, so nothing in either renderer can open a part yet; a person needs `wscat` or a script.
That is named here rather than left to be discovered, because it is this tree's own trap wearing a
plan step's clothes. It gets its consumer when the catalogue row a picker already draws can be
opened — and the honest test of the whole mode is `A7.3e`, where a part authored in the editor
appears in that list.

⚠ **`hex_editor::names` has no consumer** — the name table, tested at `B4`, is invoked by
nothing. That is the trap `moros_ui` fell into and it is live again. It gets one when
catalogue entries carry author-given names. ⚠ **`hex_part::meta` now persists a name and the
server READS it** — `14:<roof>,<part>` acknowledges with `PART.name` — so the two want
reconciling rather than both existing: `PART.name` is the saved one.

✅ **`part_anchor` HAS A CONSUMER, as of `A6.2`** — and it is the FACING half only. `expand`
subtracts the part's own facing from the aim it is given, so which way a statue looks in the
world depends on the socket rather than on how the author modelled the `.glb`. ⚠ **Its position
half (`pa_q/pa_r/pa_h`) is still uncalled, on purpose**: a part's origin is what lands where it
is placed (`part_stamp`'s rule), and reading the position for a mesh but not for cells would make
`ANCH` mean two things depending on what the part is made of.

✅ **`part_expand_of` HAS A CONSUMER, as of `A5.2`'s drawing half** — the editor's display rebuild
calls it once per edit (`editor_server.loft:7864`). ⚠ **`part_expand` itself, the by-NAME entry,
still has none outside tests and `src/prop_build.loft`**, and the two are not interchangeable: the
library's entry takes a name and a gesture holds a world, which is the same split `part_cycle_of`
needed. A thumbnail that drew what a part *holds* would be `part_expand`'s first real consumer.
⚠ **AND THAT ABSENCE COST `A8.2b` A REFUSAL NOBODY WOULD HAVE MET.** Placing a part in a WORLD
(`14:<roof>,<part>`) goes `hex_editor::part_place` → `hex_part::part_stamp` and never enters the
expansion — so a check written only in `expand` is green, gated and unreachable by hand. Read this
entry as a live hazard for any rule added to `expand`, not as bookkeeping. **A world-mode `14:`
also composes nothing**: only the named part's own cells are stamped, and its `INST` children are
not derived at all.

✅ **`part_mesh_loads` HAS ONE TOO, as of `A7.3d`** — the save check calls it
(`editor_server.loft:5505`) as well as `make parts`. ⚠ **`part_expand` still deliberately does not
open the `.glb` it names**: it runs per edit, and a glb parse per placement per edit is a cost the
record cannot pay. So a dangling mesh reference is caught **on save and at build**, and still not
at load.

✅ **`glb_read` HAS A CONSUMER THAT IS NOT A TEST, as of `A6.2`** — the catalogue thumbnail draws a
part's `.glb` body. It cost almost nothing because `chunk_mesh_slot` and `glb_read` both hand back
`mesh3d::Mesh`, so `mesh_wire` takes the glb unchanged and both are `+Y` up. ⚠ **A thumbnail still
draws a part's OWN body and not what it holds**, so `prop/shrine` pictures as its paving with
neither the plinth nor the statue on it; `part_expand` in the thumbnail path is `A7`'s.

⚠ **A CELL'S MATERIAL IS A SMALL NAMED SET, AND A LITERAL IS HOW YOU GET A GREEN PLINTH.** `3` is
`FIELD_MAT`. A cell has no *stone* at all — `wall` is an EDGE material — so the five a cell may
take are `SURFACE_MAT`, `ROAD_MAT`, `FIELD_MAT`, `FLOOR_MAT` and `ROOF_MAT`, all `hex_editor`'s.

⚠ **A THUMBNAIL CANNOT SAY HOW BIG A PART IS.** `part_thumb_view` solves the camera to fill the
frame **per part**, which is right — a cottage and a doorknob are both legible — and it means two
props that differ only in SIZE are one picture. Only proportion survives the fit, and `A6.3`'s two
statues are gated on it (their aspects must differ by 1.5×). ⚠ An ink-pixel count over a row does
NOT see this: it saturates on the row window and barely moved across a reshape that took the two
silhouettes from indistinguishable to obviously different.

⚠ **A reason has nowhere roomy to live.** A list row is **212 px** — twenty-one characters —
so `B6`'s reasons are one word (`derived`, `scattered`) and the full sentence stays on the
entry unread. A status line or a tooltip is where it belongs; neither exists.

### ⚠ The browser CAN draw text and load an image — this reversed on 2026-08-03

The entry here used to say the opposite in capitals. loft fixed both
([#737](https://github.com/loft-lang/loft/issues/737),
[#738](https://github.com/loft-lang/loft/issues/738)) and `loft 2026.8.0` carries it —
measured in the emitted page: `measureText`/`fillText` real, a real coverage upload, a real
bundled-asset loader, **zero** `TODO` markers.

⚠ **Both issues are still OPEN on the tracker while the code is fixed.** Trust the
measurement, not the label — including this paragraph.

### ⚠ All four loft defects are FIXED — measured 2026-08-03, and all four still read OPEN

`/usr/local/bin/loft` is byte-identical to a release build of loft `5aa59023`, which carries
`Fix #744`, `Fix #745` and `Fix #749`. **The tracker labels lag the code**; this happened
before with #737/#738. `make lib-test` is green on both backends under it, so nothing here was
pinned to a value the bugs produced.

| | what it was | what it is now |
|---|---|---|
| [#744](https://github.com/loft-lang/loft/issues/744) | `const X = some_fn()` aborted | **works.** ⚠ And it now carries the better argument: **a file-scope constant is an inlined expression, re-evaluated at EVERY reference** — so a derived tag re-runs its function at each use. Literals + an equality test stay, for the new reason |
| [#745](https://github.com/loft-lang/loft/issues/745) | a struct field into a `&`-parameter | **works on both backends.** ⚠ Read the fix: the interpreter was **never** passing — it produced a *silent wrong value* where a later argument's temporary took the reference's slot. Our `Delete on locked store` was the third face of one bug |
| [#749](https://github.com/loft-lang/loft/issues/749) | `split_text` and `s[i..s.len()]` panicked on multibyte | **no panics.** ⚠ The **units stay mixed by design** — `len()` counts characters, a slice bound and `find` are bytes — and a lint now fires at the confusing spelling. `s.size()` or `s[i..]`, always |
| [#748](https://github.com/loft-lang/loft/issues/748) | *"no way to build a text from bytes"* | ⚠ **THE REPORT WAS WRONG.** `text_from_bytes` and `byte_at` had shipped **two releases earlier**; they were missing from the generated reference because they sit after the `--- Environment ---` marker in `default/03_text.loft` |

⚠ **#748 IS THE ONE TO LEARN FROM, AND IT IS OURS.** The instrument was the *generated*
stdlib page; a keyword sweep of it came back empty and was trusted to report an absence. One
`grep` over `default/*.loft` would have found both functions. That is this tree's own rule —
*check an instrument against something it SHOULD find before trusting it to report an
absence* — broken on a language question rather than on a picture. **Grep the source, never
the generated reference, before calling a capability missing.**

✅ **AND THE MECHANISM IT BOUGHT IS GONE.** The text view, its `sc_is_text` write flag and
`world_set_section_text` are removed; `hex_part` decodes its own sections in two lines each
way, the store reads each span ONCE, and the `MESH` always-decode caveat went with it.
⚠ **The proof it was a refactor and not a format change: `make parts` rewrote
`data/parts/house/cottage.hxw` BYTE-IDENTICALLY.** The committed file the old text-writer
produced is exactly what the new byte-writer produces — and the wire gate loads that file and
reads `cottage` back out of it.

⚠ **Taking it out found two more loft defects, both silent.**
[#751](https://github.com/loft-lang/loft/issues/751) — a `vector<integer>` is accepted where
`vector<u8>` is declared and its 8-byte elements are read AS bytes, so `[72, 105]` decodes to
`H` and a space; the same mismatch in a literal is a hard error.
[#754](https://github.com/loft-lang/loft/issues/754) — a function ending in `vec[i].field`
returns an **empty** vector on `--native` and the right one interpreted; an explicit `return`
of the identical expression is correct. Both were invisible until something read the bytes.

## Decisions taken — do not re-litigate

1. **One model.** Moros's dense 8-byte cell and `hex_field`'s parallel arrays do not
   conflict; the cell is *storage and serialisation* over the field model. Probed, not
   argued (#1) — material and height round-trip with zero differences.
2. **The hex convention is pointy-top, odd-r, `L = √3`**, and `hex_grid` owns all lattice
   math. Four implementations already agreed; `SCENE_MAP.md` was the outlier and is
   reconciled.
3. **The format uses tagged sections, not a flags word** — an unknown section is skipped by
   its length, so a newer writer does not break an older reader. Chosen because it can
   *demonstrate* the property; a flags word cannot be tested for it at all.
4. **Heights are `f64`, labels are `i32`** in the format. Our documented `u8`/`u16` widths
   are enforced nowhere — `70000`, `-3` and `300` all round-trip in the live model — so a
   byte-packer built to the spec would silently truncate.
5. **There is ONE edge layer, and the split is over the write POLICY** — not over the
   storage, and not over "who owns `Surfaces`", which was the wrong axis. `hex_field::EdgeSet`
   owns the storage *and* the surface slot; a consumer owns the rule deciding what goes in it.
   `edge_set_surf` writes what it is told, and first-writer-wins is
   `if edge_mat(…) == 0 { edge_set_mat(…) }` at the call site, where a reader can see which
   rule is in force. Crawler's `EdgeCollider` was a temporary rename to break a name collision
   and **no longer exists** — they deleted their edge storage entirely (crawler `2a72763`,
   2026-07-22) and their `collide`/`sweep_path`/`sight_clear` now take an `EdgeSet`.
   *Consequence for us:* the layout is a two-consumer contract now, so it cannot be changed
   unilaterally — and their `edgetest`/`sweeptest` are a second gate on our EdgeSet work.
6. **`eg_index` stays private** and the write *policy* lives at the call site. Both were
   crawler's calls; I proposed the opposite and withdrew — publishing the index would freeze
   the storage layout into the contract for both consumers.
7. **A stencil loses nothing, and there are twelve orientations** — six rotations and six
   more by reflection, all exact integer maps. No destructive approximation anywhere.
8. **The twelve are twelve *placements*, and the reflected six land between the rotated six**
   — so the editor offers a twelve-position dial named as hours on a clock, turns and flips
   alternating (`SCENE_EDITOR.md` § stencils). **Never re-derive this from a radial feature.**
   A door in the middle of a wall sits on a mirror axis, collapsing the twelve to six, which
   reads exactly like proof that only six exist. Measured off-axis: twelve distinct cells on
   one ring, zero collisions. Both the claim and the collapse are pinned in
   `moros_map/tests/clock.loft`, the collapse as the negative control.
10. **A stamp is LAST-WRITER-WINS, and overlap is order-free only in its occupancy.** Two
   stencils overlapping at the same level union their cells whichever way round they go on;
   the payload belongs to whoever went second. Measured, not argued (#5) — six labels and
   six heights differed. The design promised full order-freedom and was wrong to: painter's
   order is what makes "place this on top of that" possible. Both halves are gated,
   including the refuted one, so a future arbitration rule cannot land silently.
11. **A universal package must not be named for one consumer.** `tools/layering.sh` skips
   `moros_*` by design — a consumer may depend on anything — so `moros_ui` was exempt from the
   check that existed to catch it, for months. The name is what decides whether the arrow is
   enforced, which makes renaming a mechanism rather than a tidy-up. lavition's packages are
   `hex_*` for a hex data axis and `lavition_*` for the suite; a Moros prefix is a claim that
   the thing belongs to the game.
12. **A surface's colour is a measurement, not a taste.** The picture gates classify on
   CHROMATICITY, so two surfaces that differ only in brightness are one surface to every gate
   — `road` and `wall` sat 0.00009 apart inside a 0.0009 tolerance. Separate them in the
   RENDERER, never in the classifier: a classifier fix leaves the picture just as ambiguous to
   a person. And a neutral can never separate from another neutral.
9. **A symmetric test subject cannot detect a symmetric bug.** Earned twice on 2026-07-22:
   a signature that read walls only from occupied cells reported the wrong orientation count,
   and the *same* blindness in `map_to_stencil` / `stencil_into_map` silently dropped 9 of a
   house's 17 walls. Both hid because every palette stencil was rotationally symmetric and the
   loss was symmetric with them, so every count agreed with every other count. Asymmetric
   content is what makes this class visible — which is the real argument for `house_door`.


## How to run things

### ⚠ THE HOT PATH IS `make fast`, AND IT STARTS NO SERVERS

```sh
make fast                        # layering + ALL 113 test files in parallel — 16 s
make fast P=hex_part             # one package (or several, quoted) — under a second
make check P=hex_part            # layering + one package the old way, interpreter only
make check P=hex_part G=part_bind   # …and the gates that cover it
make gate-one G="cache walk"     # just those gates, by bare name, either directory
make gate-rep  G="cache walk hipskin" N=5   # the SAME set, N times — the FLAKE HUNT
```

⚠ **`make fast` IS WHAT YOU RUN AFTER EVERY STEP.** 113 test files, one job per file:
**16.5 s** at 16 jobs (22.9 s at 8, 15.9 s at 24) against ~140 s for the same tests
serially. The parallelism costs nothing to buy — `loft test` over `hex_part` and the sum
of its sixteen files run one at a time agree at 35–39 s, so there is no per-file penalty.

⚠ **IT DELIBERATELY RUNS NO GATES AND ONE BACKEND.** A gate starts a server, waits for a
port and drives a world; a check you run after each step must not, and a check that takes
minutes is one you stop running. `make lib-test` stays the pre-commit proof across both
backends — loft#760 took `hex_voxel` from 114 green to 96 failed while `--native` passed
all 114 on the same source, so a one-backend green is a fast loop and not a proof.

⚠ **THE RUNNER WAS CHECKED AGAINST TWO THINGS IT MUST FIND**, because its default answer
is silence: a seeded failing assert, and a seeded compile error — which prints no
`test result:` line at all, so a missing line is a FAILURE here rather than a pass. That
is how a package that will not build otherwise reports as healthy.

⚠ **THE FULL SUITE IS 10–20 MINUTES AND IS A PRE-COMMIT CHECK, ONCE.** Using it to
iterate is how a session spends an hour proving what a one-minute run already showed —
`make check P=hex_proj` is **0.3 s**, and three contended repeats of three gates is
**2m54s** against ~60 minutes for three full suites.

⚠ **A FLAKE IS HUNTED WITH `gate-rep`, AND THE SET MATTERS.** Running the suspect gate
**alone** does not reproduce a contention flake — that is the *discriminator*, not the
test. `gate-rep` runs the named set together at `GATE_JOBS`, which is the condition the
flake lives in.

### ⚠ WHEN SOMETHING IS SLOW, GET THE NUMBER FIRST — there are three instruments now

```sh
loft --interpret --lib lib/ probe/perf/place_phases.loft   # a test's phases: fixture vs subject
cd lib/<pkg> && loft --lib ../ --tests tests/<file>.loft::<test_name>   # ONE test
GATE_VERBOSE=1 make gate                                    # per-gate seconds
# and in a running editor: 27:2 arms, 27:3 reports `id count us tau` per message
```

⚠ **`w_tau` BEFORE MILLISECONDS.** The edit clock is an exact integer, the same on any box
and on a world of any size; a millisecond figure measures the machine. The `27:` profile
carries both, and the pair is what separates *doing too much work* from *the work being
expensive*. ⚠ **And a COUNT before either** — a total cannot be read without one.

⚠ **DO NOT RE-DERIVE THE WRITE PATH.** Three hypotheses about why `world_set_column` costs
0.45 ms were each refuted by their own probe (12 % for both O(1024) scans together; a 0.09 ms
floor). `probe/perf/README.md` has the numbers and the one disagreement still unresolved.

```sh
GATE_JOBS=4 make gate  # ⚠ 40 gates, SILENT when green. THE DEFAULT IS 10 AND THAT FLAKES:
                       #   each gate starts a server that interprets a 5,900-line file, the
                       #   wait for `listening on port` is 60 s, and one gate alone takes
                       #   2 m 33 s. Measured: 10 of 35 failed at 10 jobs and the SAME suite
                       #   went green at 4 jobs on a HIGHER load. GATE_VERBOSE=1 for timings
make lib-test          # all 18 packages, BOTH backends; goes red properly
make parts             # build data/parts/*.hxw from the gestures, and VERIFY them
make guards            # the S3 probe suite, and it DRAWS the guard's decisions
make camera-frame      # the camera's stations by hand, with the pictures
make client            # ⚠ the wasm client is a FILE the server serves — every editor
                       #   target now depends on this, but a hand-run server does not
make stop-editor       # ⚠ after anything that started a server
cd lib/<pkg> && loft test

# a scratch program. ⚠ NO `--path ../loft/` — the installed loft bundles its own
# stdlib, and pointing at the sibling's `default/` builds against a tree that is
# being edited live. That is how `chr` turned this tree red for an hour.
loft --interpret --lib lib/ --lib ../loft-libs-world/ prog.loft
```

`loft test` resolves relative paths from the **test file's** directory, not the package root
— `tests/fixtures/x` doubles the `tests/`.

### ⚠ `make gate` FLAKES, and every face of it says *nothing happened* rather than *the wrong thing happened*

**`GATE_JOBS=4` is the knob, and it is not the load average.** Measured: **10 of 35 failed at
`GATE_JOBS=10`**, and the *same suite* went green at **4 on a HIGHER load** (26 → 40). It also
failed at load ~4 and passed at load 33 earlier the same day, so *check the load first* was never
the rule. ⚠ **And 4 is not immune** — the discriminator is to **run the one that failed alone**,
at `GATE_JOBS=1`.

| the face | what it looks like | what it is |
|---|---|---|
| **the wait** | `SERVER NEVER LISTENED` | a 60-second wait for `listening on port` while `GATE_JOBS` servers each interpret a 5,900-line `editor_server.loft`. One gate alone takes 2 m 33 s, nearly all of it startup |
| **the empty compare** | `FAIL cache … {"agree":0,"bad":24,"layers":0}` | **no layers ever arrived**, so nothing was compared. Reads as a measured disagreement; is a startup miss. ⚠ A `cache` failure whose `layers` is **0** is always this, whatever the job count |
| **the still simulation** | `walk`/`hipskin` at `{"frames":1,"bodyMoved":false}`, or `{"frames":0}` | one frame, or none, in the whole run — the simulation never ticked while four interpreted servers shared the box. Both passed alone in 12 s and 8 s |
| **the cold cdylib** | ⚠ **only after a loft install** | each gate rebuilds a **Rust** cdylib inside its own 60-second wait: `cdylib loft_web rebuilt: cached artifact rejected (stamped loft-ffi fp=none != current fp=…)`. First run on a new toolchain was 25 pass / 2 fail / **14 never listened**; the second, nothing changed, was 40 of 41 |

⚠ **WARM THE TOOLCHAIN ONCE AFTER ANY LOFT INSTALL** — start one server, let it build, stop it —
then run the suite. A first run on a fresh toolchain measures the compiler's cache, not the tree.
This is the **last** cold-cache trap standing; the `native-auto` half of it went with loft#777.

⚠ **AND ONE FACE OF IT WAS OURS, NOT THE RUNNER'S.** `part_fence` and `part_check` passed alone
and failed at `GATE_JOBS=4` because they waited a **fixed** 1.8–2.5 s for an acknowledgement
rather than polling for it — a gate that sleeps reports the machine. Ack-driven, they are also
*faster* when the box is idle: 58 s → 21 s and 34 s → 11 s. **Write a new gate that way.**

⚠ **STAMP `sha256sum /usr/local/bin/loft` AT BOTH ENDS OF A SUITE RUN.** `loft --version` says
`2026.8.0` for every build — six landed in eleven hours once — so the version string cannot tell
two installs apart and a run that finished on a different binary than it started on is not a
result. ⚠ **And capture the exit code on the line AFTER the command**: adding the stamp between
`make gate` and `echo "GATE rc=$?"` made `$?` report the *stamp's* status, printing `rc=0` over a
run whose log ends `Error 123`.


## Working with the siblings

- **Never edit `../crawler`.** Another agent works there; an edit it did not make breaks its
  picture of its own tree. Read freely, raise findings in the shared package's README or in
  `LOFT_HANDOFF.md`, and let them make the change. It works — they acted on both findings
  raised this way.
- **`loft-libs-world` `dev` is shared and consumed from the WORKING TREE.** A new public name
  can turn the sibling red with no local edit on their side: adding `EdgeSet` cost crawler a
  rename across ~38 files. **Grep the sibling before adding a public name**, and when a build
  breaks with nothing changed locally, read the sibling's `git log` before debugging.
- Both agents have edited the same file at once. **Check `git diff` for someone else's work
  before committing**, and stage-and-commit in one command.


## Lessons worth carrying forward

Craft findings that outlived the session that produced them. The *working rules* — how this
tree is worked — live in [CLAUDE.md](../../CLAUDE.md); these are what the code and the gates
kept teaching.

**A. A mechanism that looks like overhead may be load-bearing for a case you did not
measure.** Twice a "simplification" was recommended and withdrawn — the per-chunk window, and
`base_height` before it. Both times the tell was identical: the mechanism had been measured
against **one** use case. The window survives because it decouples resolution from extent,
which is the only reason one model can serve a dungeon at centimetres and a planet at metres.

**B. Two claims about seams were about nothing of the sort.** Layer kind, then layer identity,
were each argued to need world-global scope "or the fold check is incoherent across a seam".
The fold check reads one column, a column lies inside one chunk, and so it never crosses a
seam at all. A sentence that mentions a seam is not a seam argument — ask instead whether the
operation ever reads two chunks.

**C. A sibling had already solved it, better.** `crawler/PROPS.md` refuted the dressing-layer
design on three axes at once: a level is a *sheet, not a slot*; terrain is dense while
dressing is sparse; and placement is mostly *derived* rather than authored. The uniform-cell
version felt like one mechanism serving two cases — and that feeling was the tell that it was
serving one and disfiguring the other.


**D. The negative control is what finds the hole, not the passing suite.** Four times today a
control failed to fail, and each time it exposed a gate that could not have caught its own
bug: a vacuous rotation-identity test (`n % 6` made "rotate by 6" a no-op), a missing `EDGE`
length gate, an unverified halo (74 of 75 slots), and a control whose own perturbation parsed
as a no-op. Green says the tests pass; it does not say they would notice.

**E. Parity is where this codebase breaks.** Five separate bugs now, all the same shape: right
for non-negative coordinates, wrong below zero or on odd rows — `(r % 2)` where `(r & 1)` was
meant, a direction table that could not be parity-aware, an axial neighbour list applied to
offset coordinates, negative indices that wrap rather than fail, and (2026-08-03)
`html/hex-lattice.js` shifting no odd row below zero because `-1 % 2` is `-1` in JavaScript.
When touching the lattice, test **both parities and both signs**.

⚠ **The fifth one is the argument for the instrument, not for more care.** It sat in a file
whose header already says "one home for the lattice" and whose test suite already re-derived
its direction tables from the geometry — and it still shipped, because every test used
non-negative rows. What found it was the **cross-language fixture** (#3): one file both
implementations read, covering both signs. Care does not scale; a fixture that spans the
seam does.

**G. A COUNT IS NOT A PICTURE, AND A PICTURE IS NOT A COUNT** — five times in one session,
in both directions. Nine swatches "rendered" and none drew (a count of draw calls is not a
count of pixels). Nineteen columns copied and two read back empty. A part cell holding a
neighbour's height while every total agreed. And the other way: a status strip 2.7× too small,
and two labels overlapping, neither visible to any count and both obvious in the frame.

⚠ **The instrument follows from which one the claim is about.** *"It drew"* is a picture;
*"it drew the RIGHT thing"* is usually a number; *"nothing was lost"* is a number the picture
cannot supply. When the two disagree, suspect both — and when only one exists, that is the
finding.

**H. A gate instrument is blind until something it should reject is fed to it.** Three were,
this session, and each looked reasonable: a luminance BAND counted 824 "dim" pixels where
nothing was greyed, because anti-aliased edges land in any band you pick; a single sample
COLUMN read six buttons as thirteen fragments once labels were drawn on it; and
`[].every(…)` is `true`, so a row reported `ok` on a picture with no panel at all. ⚠ **The
fix is a discriminator taken from the SHAPE** — a per-row peak, a bar's height, a count
alongside the predicate — because a threshold tuned to today's colours dies at the next
restyle.

**F. Content exercising a mechanism finds what probes miss.** The built-in house was a port,
and authoring it uncovered both a wrong ring in our content *and* the rotation losing rim
edges — neither of which the mechanism's own eight gates had caught.

---

## The record

Thirteen sessions of how this got here, newest first, is **[JOURNAL.md](JOURNAL.md)** — the
per-session entries, the numbered item log, and the superseded planning sections. Nothing
was thinned on the way out; ⚠ read a dated claim in it as dated. **Sessions 10–12** are the
arc from *a part is a world* to *a part with joints, a hinge and a mesh*; **session 13** is the
door on screen, §P9 argued out, and six loft installs in eleven hours.

⚠ **This file grows back, and the answer is always the same move.** It was 2,446 lines once,
split to a handoff, and had returned to 632 by the end of session 8. Session 8's full record
moved to the journal on 2026-08-03 and this came back to ~210. It reached **785** across
sessions 10–12 and came back to ~400 on 2026-08-04. It reached **907** in session 13 and came
back to ~500 on 2026-08-06. **When a session ends, its entry moves out** — the handoff describes
the present, and the record keeps the past. Moving is not thinning: a finding that cost a day is
worth more than the lines it takes, which is why nothing is ever deleted on the way.

⚠ **AND EVERY TIME, MOST OF WHAT GREW BACK WAS ALREADY WRITTEN DOWN TWICE.** The 447 lines moved
out on 2026-08-04 were per-step findings that `plans/17-parts/README.md` already carried, section
for section; the ~400 moved out on 2026-08-06 were the same thing plus a 110-line restatement of
[PARTS.md §P9.0](PARTS.md#p90--the-design-in-one-place). A handoff that repeats the plan is a
handoff nobody can skim — so when a step lands, its finding goes in the PLAN, and this file gets
only what a reader needs whichever step they pick up next.

⚠ **AND OPERATIONAL KNOWLEDGE WAS THE THING THAT NEARLY WENT WITH IT.** The gate flake's four
faces and *warm the toolchain after a loft install* were written inside a dated session narrative,
so moving the narrative would have taken them too. They are not a record of a session; they are
how you run the suite. **Before moving a block out, ask of each ⚠ in it: is this what happened, or
is this how the tree works?** The second kind goes to *How to run things* or *What bites*, never
to the journal.
