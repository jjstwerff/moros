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

> **X108 — the agreement law.** Tracing a run and aiming the same run must produce **the same
> shape**, exactly. Walking due east from `v` to `v + 7·e` and standing at `v` facing east with
> extent 7 are the same author intent, so they must be the same integers.

⚠ **THIS IS NOT AUTOMATIC AND IT IS CHEAP TO TEST.** `I1` snaps two points and derives a
direction; `I2` snaps a direction and derives a point. Those are different code paths through
different library entry points — `hex_shape::snap_run_d24` takes an endpoint, and there is **no
`snap_run_from_heading`** today. A gap, and §7 names it.

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

> **X109 — the authoring resolution is 6.949°.** Half the narrowest cell. An author aiming at an
> arbitrary heading is given a direction within 6.949° of it, worst case, **and no amount of input
> precision improves that** — it is the lattice's own granularity, not the controller's.

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
| **`M2p`** | **the agreement law `X108`** — trace a run and aim the same run, compare the integers | ⛔ not run. The sharpest test here and the cheapest |
| **`M3p`** | **`X103` under a varying tick** — build one shape at two tick rates, compare | ⛔ not run. `deck.keys`'s byte-identity is the instrument that already exists |
| **library gap** | **`snap_run_from_heading(v, d24, n)`** — `hex_shape` snaps from an *endpoint* only, so `I2` has no lawful entry point and `X108` cannot yet be satisfied | ours to build, in `loft-libs-world` |
| **library gap** | **a continuous axis in `input`** — `AxisBinding` is a pair of key codes returning −1/0/+1, which discards exactly what a stick adds. And `graphics` exposes no gamepad at all | upstream, [BLUEPRINT](BLUEPRINT.md) §3.2 |
| **to hexbody** | **`X109`** — *the authoring resolution of `D` is 6.949°* is a property of the core's own direction set, not of our editor. If `|D| = 24` is ever revisited, this is the number that decides whether it is enough | a ticket, not an edit |
| **to hexbody** | **`X108` as a core law** — that two derivations of one line must agree is a statement about the representation, and §6's *"using R2's machinery where R1 applies"* is the same family | a ticket |

⚠ **AND ONE THING THIS FILE DELIBERATELY DOES NOT DO.** It defines no verbs and no key bindings.
`G` is **data** (`X107`), and a formal file that listed today's verbs would become the fifth site
that decides what a gesture means.
