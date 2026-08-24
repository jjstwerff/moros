<!-- Copyright (c) 2026 Jurjen Stellingwerff -->
<!-- SPDX-License-Identifier: LGPL-3.0-or-later -->

# The authoring map — from a controller to an exact shape

> *"we have designed the way to reach the desired form in world, but that is not equal to the
> whole way to reach that. Because we want a way to get each shape from a character perspective
> from a limited input scheme of a controller. So position/facing/move of a character should be
> able to predict the exact shape of each shape … This has to be part of the formal rules because
> it is mostly a mapping of one scheme to another."*

[FORMAL_CORE.md](FORMAL_CORE.md) says what shapes **exist** and how they are represented. It says
nothing about how an author **reaches** one. That half was never written down, and it has been
decided four separate times in code instead — which is
[EDITING_MODES.md](EDITING_MODES.md)'s shipped mistake, stated once more at a lower level.

⚠ **THE ARGUMENT FOR FORMALISING IT IS NOT RIGOUR FOR ITS OWN SAKE.** Both ends are already
formal: the controller is a small finite alphabet with two continuous axes, and the world is an
exact integer lattice. **A map between two formal objects is a formal object.** Leaving it
informal does not make it soft — it makes it *unstated*, and an unstated map gets re-derived by
every gesture that needs one.

**This file is lavition's, not hexbody's.** §7 lists the few parts that push back on the core.

---

## §1 — the two schemes

| | the author's scheme `A` | the world's scheme `B` |
|---|---|---|
| position | `p ∈ ℝ²`, continuous | a lattice vertex, exact integers (`hex_field::lattice_k/m`) |
| direction | facing `θ ∈ [0, 2π)`, continuous | a member of `D` (24), `H₁₂` (12) or `O` (12) — **not interchangeable**, `FORMAL_CORE` §2 |
| extent | how far you walked | an integer count `p` of steps (`hex_shape::snap_run_p`) |
| height | the level you stand on | a discrete sheet index, **never a height** (`@HB-X63`, `FORMAL_CORE` §2.4.3) |
| choice | a wheel, a button | a palette id (`@HB-X12`) |

**The authoring map is `Φ : A → B`.** Everything below is a law about `Φ`.

⚠ **`A` IS SMALLER THAN IT LOOKS, AND THAT IS THE POINT.** A mouse-and-keyboard editor can hide
an unbounded alphabet in modifier chords and drag distances. A controller cannot: two sticks,
a dpad, four faces, four shoulders. **The input alphabet is a hard budget** (§6), and a design
that needs more verbs than buttons is refuted before it is built.

---

## §2 — the four laws

| | law | what it forbids |
|---|---|---|
| **X100** | **TOTAL** — every `(state, verb)` pair yields exactly one shape | an "invalid gesture" that beeps. If a state cannot produce a shape, the verb must not be offered in that state — which makes it §3's problem, not a runtime check |
| **X101** | **EXACT** — no float survives the snap. `Φ` ends in integers, and every downstream consumer reads those | a tolerance that decides geometry. ⚠ This is the ground rule one layer up: *a float fit is the tell that an algorithm was invented rather than found* |
| **X102** | **PREDICTABLE** — the author can see which shape they would get, **before** committing | a gesture whose result is only knowable by doing it. See §2.1 — this is the load-bearing law and the one with real content |
| **X103** | **MEMORYLESS** — the shape is a function of the committed anchors plus the current state, and of **nothing else** | timing, velocity, frame rate, drag history. ⚠ A wall that bends because you turned while walking violates this even though it may look natural |

### §2.1 — what "predictable" actually requires

`Φ` is a quantiser, so it partitions `A` into **preimage cells**, one per reachable shape. `X102`
is three separate requirements on those cells, and only the first is obvious:

| | requirement | why it can fail |
|---|---|---|
| **X104** | the cell containing the current state is **displayable** — the editor renders the shape `Φ` *would* produce, live | this is a hard requirement on the renderer, not a nicety. Without it `X102` is unsatisfiable no matter how good the map is |
| **X105** | every cell has **non-empty interior** | a shape reachable only from a measure-zero set is not reachable by a human at all. A direction that needs `θ` exact to the float is unreachable |
| **X106** | the narrowest cell is **wider than the input's resolution** | a stick has a deadzone and finite precision. If a cell is narrower than the stick can distinguish, that shape is unreachable *on a controller* while reachable with a mouse — and the two authorities then disagree about what exists |

⚠ **`X105` AND `X106` ARE WHY §5 IS MEASURED RATHER THAN ASSERTED.** "24 directions, so 15° each"
is the natural assumption and it is **false** — the cells are 13.898°, 15° and 16.102°, because
`D`'s in-betweens carry `@HB-X29`'s 1.1021° bias. A budget computed from the assumption is 8%
optimistic on the tightest case.

---

## §3 — the factorisation law, and the thing no button may touch

[EDITING_MODES.md](EDITING_MODES.md) already has two axes: **WHERE** decides which verbs exist and
is *derived from the author's position, never set*; **WHAT YOU CHOSE** decides what they produce.
The wheel the request adds is a third input, and the law is about where it is allowed to act.

> **X107 — `Φ` factors, and the factors are independent.**
>
> ```
> Φ(state, button)  =  G[ where(state) ][ chosen(state) ] ( geometry(state) )
> ```
>
> * `where` is a **function of position and level alone**. ⛔ **No button, wheel or chord may
>   reach it.** *"a house in a cave switches to houses again"* is this law's own proof.
> * `chosen` is what the wheel sets, and it may only select **within** what `where` offered.
> * `geometry` is §5's quantiser — position and facing to exact lattice values, and it is the
>   **same function in every mode**.
> * `G` is a **table**, and it is **data**. ⚠ *Adding a house type must touch no code*, or the
>   system cannot grow.

⚠ **THE WHEEL IS A SELECTOR, NEVER A MODE.** Read as *"a wheel picks the mode"*, the request
would flatten `where` and `chosen` into one axis — which is exactly the flattening
[EDITING_MODES.md](EDITING_MODES.md) counts as shipped. Read as *"a wheel picks within the mode
you are in"*, it is the catalogue's own selector and needs no new concept. **The second reading is
the one that is buildable**, and the difference is invisible until a house sits in a cave.

⚠ **AND `X107` IS ALREADY VIOLATED ON THE WIRE.** `O`/`P` mean *round vs pointed* to the server
and *door vs window* to the runner, because the profile is encoded in the **key** — so `G` is
being indexed by a keystroke at one end and by a verb at the other. **The wire must carry the
verb**, never the key; a remapped client against a server that resolves keys itself is the
four-site divergence rebuilt.

---

## §4 — two idioms, and they must agree

A character can specify a line in two ways, and both are wanted:

| | idiom | the input | what it quantises |
|---|---|---|---|
| **I1 — trace** | *walk the shape* | a sequence of committed **anchors**, each a position | position → vertex |
| **I2 — aim** | *stand and face* | one anchor plus **facing** and an extent | facing → direction |

> **X108 — the two idioms are DIFFERENT MAPS, and one gesture must use exactly one of them.**
> Mixing them — begin by aiming, finish by tracing — produces a shape neither idiom would, and
> the author has no way to predict it.

⛔ **THIS LAW SAID THE OPPOSITE UNTIL IT WAS MEASURED, AND THE ORIGINAL IS WORTH KEEPING VISIBLE.**
It read:

> *"Tracing a run and aiming the same run must produce **the same shape**, exactly. Walking due
> east from `v` to `v + 7·e` and standing at `v` facing east with extent 7 are the same author
> intent, so they must be the same integers."*

**[`M2p`](../../probe/m2p/README.md) refutes it: they agree on 1026 of 1320 aims — 77.7%.** The
control (aim one `D` step off) matches on 11.6%, so the comparison discriminates and the figure
means something.

⚠ **AND THEY DISAGREE BY DESIGN, NOT BY DEFECT.** The two snaps minimise different quantities:
`snap_run_d24` picks the direction whose best legal **endpoint** lands nearest the target — one
2-D distance, in which a direction error and a length error trade freely. `snap_run_from_heading`
quantises the two axes **separately**: the angle against `D`, the length against the legal runs.
An author who **aims** is making two statements, *this way* and *this far*, and expects the first
to be honoured as a direction. An author who **traces** is making one, *to here*.

The cleanest case, and it is now `@HXS-010` in the library — aim 9°, push 3.93 wu:

| | direction | length | what it honoured |
|---|---|---|---|
| **aim** | `d24 1` (13.898°) | **6.245 wu** | the angle, to 4.9° — and overshot the push by **59%** |
| **trace** | `d24 0` (0°) | 3.464 wu | the point, to 0.74 wu — and lost the whole 9° |

Their far ends are **3.0 wu apart**. ⚠ **Neither is wrong.** So the law cannot be *make them
equal*; it must be *say which one this gesture is*, and never switch inside one.

✅ **AND THIS PROMOTES `X104` FROM A NICETY TO THE LOAD-BEARING REQUIREMENT.** While the two maps
were assumed to coincide, a live preview was a convenience. Now it is **the only thing that tells
an author which map they are in** — the same push and the same facing give two different walls,
and nothing else on screen distinguishes them.

⚠ **AND `I1` IS WHERE `X103` IS EASIEST TO BREAK.** The tempting implementation reads the walked
*path*; the lawful one reads the committed *anchors*. A path is history, carries frame rate, and
differs between the server's tick and the page's. **`deck.keys` headless matching the server to
the byte is exactly the property that dies** the first time a shape depends on how the path was
sampled.

---

## §5 — the quantisers, measured

### §5.1 — position → vertex

`hex_shape::nearest_vertex(x, z)`. The preimage cells are the Voronoi cells of the vertex lattice
— congruent, equal area, and the same everywhere, so `X105` and `X106` hold trivially and `X104`
is one highlighted vertex. **Nothing here is at risk.**

### §5.2 — facing → direction: [`M1p`](../../probe/m1p/README.md), and the cells are not 15°

`D` is 12 exact headings plus 12 in-betweens carrying a uniform **1.1021°** bias at vector
`(7,−2)` (`@HB-X29`, `@HB-X56`). The cell widths follow with period 4:

| `d24` | cell width | |
|---|---|---|
| even, one class | **13.898°** | the narrowest — `15 − 1.102` |
| odd (every in-between) | **15.000°** | exactly |
| even, the other class | **16.102°** | `15 + 1.102` |

✅ **Monotone and complete** — 24 boundaries in one turn, each `+1`, none backward, none skipped.
So `X104`'s live preview can be a simple "current `d24`" readout, and turning further never hands
back an earlier direction.

> **X109 — the authoring resolution is 8.051°.** An author aiming at an arbitrary heading is given
> a direction within 8.051° of it, worst case, **and no amount of input precision improves that** —
> it is the lattice's own granularity, not the controller's.

⛔ **THIS SAID 6.949° UNTIL A TEST REFUTED IT, AND THE ERROR IS WORTH KEEPING VISIBLE BECAUSE IT IS
A CONFLATION, NOT A TYPO.** `D`'s cells come in three widths, so half-a-cell is not one number, and
the two halves answer different questions:

| | | |
|---|---|---|
| half the **narrowest** cell | **6.949°** | the **input precision** a stick needs to be able to *select* every direction. This is `M1p`'s own line and it was always right |
| half the **widest** cell | **8.051°** | the worst **direction error** an author can be handed. This is what a residual is |

Measured over a full turn at 0.001° steps: **worst 8.051°, at yaw 321.949°** — exactly half of
16.102. ⚠ **The wrong one was quoted here for a week**, and what found it was
`lib/hex_editor/tests/aim.loft` asserting the doc's bound and going red on a real aim. ⚠ **And it
survived one round of scrutiny first**: the reported residual was `7`, which looks like a rounding
artefact of 6.949 — it is not, because loft's `as integer` **truncates** (measured), so 7 meant
the float was over 7 and the ceiling was simply wrong.

### §5.3 — a short run in an in-between direction **does not exist**

> **X111 — `D`'s 24 directions are not uniformly available; below about 6 wu the reachable set is
> effectively the 12 exact ones.** One period is not one size: the twelve exact directions have
> periods of **1.0** or **1.732** world units, while all twelve in-betweens have a period of
> **6.245** — roughly **3.6× coarser**. An author aiming along an in-between can make walls of
> 6.245, 12.49, 18.73 wu and nothing shorter.

⚠ **THIS IS WHAT ACTUALLY CAUSES `X108`'s DISAGREEMENT**, and it was found by a library test going
red rather than by reasoning. The trace notices that a short run is better served by an exact
direction and silently leaves the heading; the aim cannot, and rounds the length up instead.

⚠ **AND THE LENGTH AXIS IS NOT EVEN EVENLY SPACED WITHIN A DIRECTION.** Six of the 24 refuse
**one run in three** — the legal `p` are `{1, 3, 4, 6, 7, 9, …}` — so the gaps alternate 2, 1.
Two wrong models of that died in the library's own tests before the third was measured:
`wall_min_p` (which says where the legal runs *start*, not their spacing), then *the first gap*
(which assumed an arithmetic progression; the set is the **complement** of one).

⛔ **AND THE DELETED UNIFORM QUANTISER WAS NOT HARMLESS.** Nearest-in-`D` and the old
`WALL_SNAP` 15° grid select a **different `d24` on 3.70%** of headings, first disagreeing at
6.95°. So `H1e`'s deletion changed what authors get; it was a correctness fix, not a tidy-up.
⚠ **A probe that only counted "does it snap to 24 things" would have called both correct.**

---

## §6 — the controller budget

> **X110 — the per-mode verb count may not exceed the button count.** The wheel is what lets the
> *total* verb count exceed it; `where` is what keeps any single mode under it.

A gamepad offers roughly **4 axes + 14 buttons**, of which movement and camera claim all 4 axes.
So a mode may offer **at most ~12 verbs** before the wheel is doing the work.

⚠ **THIS IS THE FORMAL JUSTIFICATION FOR A COLLAPSE ALREADY DESIGNED.** `O P I U N M` — six keys
for one opening gesture, because the profile is encoded in the key — is six of a twelve-button
budget spent on **one verb**. Collapsing them to a single `opening` verb plus a catalogue
selection is not tidiness; it is the difference between a scheme that fits a controller and one
that does not. **`X110` is the rule that says so before the buttons run out**, rather than after.

---

## §7 — what is open, and where it goes

| | | |
|---|---|---|
| **`M2p`** | **the agreement law `X108`** — trace a run and aim the same run, compare the integers | ✅ **RUN, and it refuted the law** — [result](../../probe/m2p/README.md). 77.7%, control 11.6%. `X108` is rewritten from *they agree* to *pick one* |
| **`M3p`** | **`X103` under a varying tick** — build one shape at two tick rates, compare | ⛔ not run. `deck.keys`'s byte-identity is the instrument that already exists |
| ✅ **built and PUBLISHED** | **`hex_shape::snap_run_from_heading(a0, b0, deg, dist)`** and **`wall_nearest_d24(deg)`** — the aim idiom's entry point, quantising the two axes separately so it is a **peer** of the endpoint snap and not a wrapper on it. 10 tests, `@HXS-010`, seen red three times | **`hex_shape` 0.1.1**, 2026-08-24. `lib/hex_editor/loft.toml` requires it, so `M2p` measures the registry copy the editor builds against — same numbers, 1026 of 1320 |
| **library gap** | **a continuous axis in `input`** — `AxisBinding` is a pair of key codes returning −1/0/+1, which discards exactly what a stick adds. And `graphics` exposes no gamepad at all | upstream, [BLUEPRINT](BLUEPRINT.md) §3.2 |
| **to hexbody** | **`X109`** — *the authoring resolution of `D` is 6.949°* is a property of the core's own direction set, not of our editor. If `|D| = 24` is ever revisited, this is the number that decides whether it is enough | a ticket, not an edit |
| **to hexbody** | **`X108` as a core law** — that two derivations of one line must agree is a statement about the representation, and §6's *"using R2's machinery where R1 applies"* is the same family | a ticket |

⚠ **AND ONE THING THIS FILE DELIBERATELY DOES NOT DO.** It defines no verbs and no key bindings.
`G` is **data** (`X107`), and a formal file that listed today's verbs would become the fifth site
that decides what a gesture means.
