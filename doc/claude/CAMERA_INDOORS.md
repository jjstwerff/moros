# The camera indoors — four modes, one query

> Status: **ALL FIVE SETTINGS ARE BUILT AND GATED** — FOLLOW, AUTO, SNUG, CUTAWAY
> stage 1 and EYES. CUTAWAY stage 2 is measured as not yet needed.** `tools/gates/world/camera_indoors.mjs` is in
> `make gate` and `tools/scripts/indoors.keys` is the script behind it —
> eleven stations, judged on where the eye IS, what the frame HOLDS, and how it is LIT.
> `40:<mode>` chooses; AUTO is the default and the only one that degrades.

## ⚠ The fault was that the eye was never sent — read this first

Everything below this section is the record of getting there, and it is worth
keeping because four diagnoses were wrong before this one. But the fault was none
of them:

**The camera's ease was solved on every tick and published on none.** The boom
eases toward its target over the ticks *after* the character stops — that is
deliberate, and the reason a doorway is a drift rather than a snap. The per-client
`C:` send sat inside `if moved`, which is the CHARACTER's flag. So the client kept
drawing the matrix from the last tick the character happened to move on, and the
converged camera never left the server.

The instrument that ended it reads the eye **out of the view matrix the renderer
actually used** — `eye = -Rᵀt`, inverted from `C:` — rather than out of the
camera's own trace. The trace's `dist` is a length along a ray whose origin and
direction are decided elsewhere; every valve on it can read correctly while the eye
is somewhere the room does not contain. And it did:

```
                        traced dist      the eye the renderer used
outside, the control       5.86          5.317 behind   ← agree
inside, mid-floor          1.87          5.317 behind   ← outside the house
inside, corner             4.40          2.11  behind   ← mid-ease, frozen
```

The control is the point of that table: outdoors the two agree exactly, because
outdoors the character is walking and every tick publishes. The fault is invisible
in precisely the case the camera is designed for.

⚠ **This is the same class as `boom_take`, one layer out**, and the third instance
in two sessions: something built, tested, and never reaching its consumer. Here the
consumer is the wire. **A solve nobody is told about is a solve that did not
happen** — and it made three earlier fixes, all correct, all invisible.

⚠ And it is the **second instance in this one loop**: `live_clients` was once
counted off a broadcast inside `if moved`, so a client that sat still was never
counted again. `if moved` reads like *"if anything changed"* and means *"if the
CHARACTER changed"*.

### The floor was a hole, and fixing it made the gate REDDER

Found on the way, by the same habit — the interior frames classified 16–21% of
their pixels as **sky**, and the only bluish entry in the palette is the sky. The
store had the answer: `26:0,0` reads `4,1`, material `FLOOR_MAT`. And
`chunk_mesh_mat` draws the cells carrying the material it is asked for — ground,
road, field, vegetation. **Nothing asked for `FLOOR_MAT`.** A house's floor was
written correctly, read back correctly, and drawn by nobody.

Drawing it took `masonry` from 50% to 71%, because `wall`, `floor` and `frame` were
one bucket in the classifier — so the gate had been passing partly on a hole. That
is the finding worth carrying:

⚠ **An instrument that cannot tell two surfaces apart cannot judge a threshold about
one of them.** The rule is *no SINGLE surface over 60%*, and while the floor was
`0.62,0.57,0.48` it sat 0.0003 from the wall's chromaticity against a 0.0009
tolerance. The answer was not to loosen the threshold but to separate the surfaces
**in the renderer** — the floor is timber now, which also gives a room a corner.
A floor and a wall the same colour is most of why the interior read flat.

### The four measurements, in the order they were taken

| | outside (control) | mid-floor | corner |
|---|---|---|---|
| before | 1.54% / grass 53% | 0.09% / masonry 78% | 10.6% / masonry 78% |
| camera on the wire | unchanged | **10.6% / 50%** | 2.7% / 61% |
| floor drawn | unchanged | 10.6% / **71%** | 2.7% / **77%** |
| floor separable | unchanged | 10.6% / **47%** | 2.7% / **48%** |

The corner's subject falls from 10.6% to 2.7% and that is the fix working: the old
number came from a camera frozen mid-ease, 2.4 wu from the character. 2.7% is what
the converged boom gives, and it is five times the threshold.

**Seen red**, which is what makes it a gate: with the publish condition put back to
`if moved`, the control passes and **both** indoor rows fail — `apart 5.900` against
`1.5..3.0` and `2.406` against `3.5..5.2` — and the frame rows go with them.

---

## The record: three diagnoses before that one, and what each cost

## What was measured, before anything was designed

A 5×4 house, and the author standing in it. The boom **already** sweeps walls with
`wall_stops_view` and `sweep_path` — so the question was never "does the camera know
about walls", and guessing would have designed the wrong fix.

| where | what the frame contains |
|---|---|
| middle of the room | the roof seen from **outside**, a slab of exterior wall, and **no character at all** |
| facing a corner | the character in extreme close-up in one corner, the rest flat wall, sky through a gap |

The instrument is the same in both: **how many pixels of the frame are the subject.**
In the first it is *zero*.

### ⚠ Three diagnoses, two of them wrong — and an instrument that ended the guessing

1. *"It does not know about walls."* **False.** The boom sweeps them exactly, with
   `wall_stops_view` and `sweep_path`.
2. *"`CAM_MIN_FRAC` is a floor the sweep cannot pass."* **True, and fixed — and the
   picture did not change.** 0.22 of a 5.86 boom is 1.29, and a 5×4 room offers less
   than that; the clamp is gone and the boom now takes the room.
3. *"The PITCH ASSIST climbs out of the room."* **This is the one.**

Guessing from pictures was 0 for 2, so the camera now traces its own numbers under
`27:1` — and standing inside the house they read:

```
CAM want 5.86  dist 0.84  free 1.66  pitch 0.8  target -0.687  slide 0.55
```

`dist 0.84` is the boom collapsed well below the old floor, and `slide 0.55` a full
shoulder — both fixes doing exactly what they claim. And `pitch 0.8` against a player
target of `-0.687`: the assist is **pinned at its ceiling**, straining to look over a
wall it can never clear, so the camera aims steeply down at the character from just
above it and the near wall fills the frame.

**Fixed.** `shelter_at` answers whether the eye is under a roof or a deck, and the
assist is suppressed when it is — restoring the PLAYER's own pitch, since the assist
was always *"a deviation from their intent, never a replacement for it"* and with
nothing to climb over, intent is what is left. The ease and the rate cap are
untouched, so a doorway is a drift rather than a snap. Measured after:

```
CAM want 5.86  dist 4.18  free 4.60  pitch 0.35  target 0.35  slide 0.21  inside true  head 11
```

⚠ **AND THE PICTURE STILL SHOWS THE HOUSE FROM OUTSIDE.** `free 4.60` while
`inside true`. So the edge set was measured — `EDITOR_PROBE=view`, headless, no
browser:

```
house placed 27 cells, 84 wall edges, anchor (0,1)
wall edges in the store:                    23, over cells q -3..3 r -2..3
author at (0,0) = cell (0,0); under the roof PLAN: true
view-blocking edges in the proxy:           23        ← nothing is lost
boom free by direction: 2.09 2.09 2.09 3.77 3.87 5.02 5.02 5.86
```

**The edge set is not the fault.** Every wall edge in the store reaches the proxy, and
the sweep answers sensibly in every direction — including one where the full 5.86
boom fits, which is correct: the house is 8.7 × 6.9 world units and its long axis is
longer than the boom.

**The cache key and `ref_u` are also correct**, checked next: the key is cell, edit
clock and walker LEVEL — exact rather than timed — and `ref_u` is the walker's own
resolved surface, the same reference the probe used. And the apparent contradiction
between probe and live was my own misreading across ticks: the live trace prints once
a second, and its lines were from *two different yaws*. At the same yaw the two agree
— **live 2.07, probe 2.09**.

### ⚠ The fault was that `boom_take` was never called

`cam_free` is the distance to what the march FOUND. Removing the floor from
`cam_free_dist` was only half the change; the server then eased `cam_dist` straight
to `cam_free`, so **nothing was ever subtracted** and the eye was placed exactly on
the wall it had just avoided — measured, `dist 2.07` against `free 2.07`.

That is the same fault as `op_depth` reaching the library and stopping there, and I
made it two commits after writing that sentence down: **a function written and tested
and then not called is a claim about nothing.** With it wired the same sweep gives
`dist 1.87` — the room less its skin.

### ⚠ And the trace itself lied, in exactly the fields it was built to report

`free -0.687` — a value `boom_take` cannot return, and in fact a PITCH in radians
sitting in a field that holds a distance. `cam_free` and `cam_pt` are assigned only
inside `if cam_moved || !cam_rested { … }` and read by the trace outside it, so the
read saw something else entirely. What identified it was that the fields declared
with the rest of the camera state — `slide`, `sh_inside`, `sh_head` — printed
sensibly throughout: **every field that lied was one first assigned inside the
block.** Declared alongside `cam_dist`, the trace reads:

```
CAM want 5.86  dist 1.87  free 1.87  pitch 0.35  target 0.35  slide 0.48  inside true  head 12
```

Converged (`dist == free`), the assist off (`pitch == target`), the boom at the room
less its skin, a shoulder's worth of slide. Every number is what it should be.

### The frame, measured — `make camera-frame`

Built at last, and it settles what four rounds of looking at pictures could not.
Pixels are classified by **chromaticity**, not RGB: the renderer is flat-shaded, so a
lit surface and a shadowed one are the same colour times a scalar and their ratios
survive. An exact-RGB match finds almost nothing and reports an empty room.

| | subject | largest | |
|---|---|---|---|
| outside — the control | **1.54%** | grass 53% | sky 29%, masonry 11% |
| inside, mid-floor | **0.09%** | **masonry 78%** | roof 17% |
| inside, corner | **10.6%** | **masonry 78%** | roof 5% |

⚠ **The character was never missing — it is 0.09% of the frame.** Every earlier read
of these pictures said "no character at all", which was an eye's answer to a question
only a count can settle. What is actually wrong is the second row: **masonry is 78%
of the frame in both interior views**, against 53% for grass in the working outdoor
one. The interior camera's fault is not that it is outside the house. It is that a
wall takes three quarters of the picture.

That reframes the remaining work. `sh_room` — the clear radius `shelter_at` already
has a field for — is the number that has to drive the boom, and the fix is about how
much wall the frame is allowed to hold, not about where the eye ended up.

⚠ **AND IT MUST NOT JOIN `make gate` WHILE RED.** It is red on purpose and by
measurement — a red gate in the suite is a suite nobody can read, and a gate that has
never been seen red is not a gate. It runs on its own target until the interior
camera is fixed. — **it has joined**, as `tools/gates/world/camera_indoors.mjs`.
It is the suite's slowest gate at ~53 s, because it is the only one that attaches a
browser; the gates run in parallel, so the suite went 24 s → 37 s and not 24 s + 53 s.

Two rows, and the thresholds come from the control rather than from taste: the
subject at least **0.5%** of the frame, no single surface over **60%**.

⚠ **AND THE PROBE'S FIRST ANSWER WAS 0, WHICH WAS THE PROBE'S FAULT.** Blocking lives
in the edge's SURFACE channel — `edge_block` writes it and `edge_blocked` reads it —
so counting through `edge_mat` reports zero however full the set is. That would have
been a third wrong diagnosis *wearing a measurement's clothes*, which is worse than
a guess, because a number is believed. An instrument gets checked against something
it should find before it is trusted to report an absence.

The original fault was F2: the pitch assist is a FOLLOW behaviour with no meaning
indoors. It exists for *"standing below a ridge"*, where
climbing is the answer; a room is a sustained obstruction that climbing cannot solve,
so the valve saturates and stays saturated. It has to be suppressed by the same
`sh_inside` everything else keys off.

⚠ A millisecond total could never have said this, and neither could three pictures.
The rule this tree already had — *find the instrument first* — applies to whether a
thing is USABLE exactly as it does to whether it is fast.

## ⚠ Three modes, because the same facts want opposite answers

The temptation is one automatic behaviour that "handles interiors". It cannot: a
de-roofed editing view and a claustrophobic interior want **opposite** things from
the identical situation. Being inside a small dark room is a *fault* to be corrected
in one and the *entire point* of the other.

So the camera has an explicit mode. The mode is the only thing that decides; the
query below is the only thing that observes. That separation is what keeps them from
constraining each other.

| | **FOLLOW** | **SNUG** | **EYES** | **CUTAWAY** |
|---|---|---|---|---|
| for | outdoors, the default | intimate, claustrophobic | being in the room | editing a building |
| boom | full, wall-swept | collapses **below** `CAM_MIN_FRAC` | **none** — the eye is the head | fixed, outside and above |
| shoulder offset | none — centred | **grows as the boom shrinks** | — | none |
| pitch fence | `PITCH_MAX` 0.75 | as FOLLOW | **lifted — you look UP** | steep, downward |
| roof, inside | hidden — it is in the way | kept, needs an underside | kept | hidden |
| ceiling | — | needed | **required** | hidden |
| near walls | swept around | **kept — they press in** | kept | hidden |
| ambient inside | lifted, so the room reads | **low**, plus a head-lamp | lifted, plus a head-lamp | high and flat |
| own body | drawn | not drawn | not drawn (hands, later) | drawn, small |
| what it fixes | the two shots above | nothing — it *wants* the walls close | there is no other way to be *in* a room | seeing a plan while you build it |

⚠ **The pitch fence is FOLLOW's constraint, not the camera's.** `PITCH_MIN`/`PITCH_MAX`
are clamped because *"past vertical, behind the character stops meaning anything"* —
which is a statement about a **boom**. EYES has no boom, so the reason evaporates and
the fence must lift with the mode. It is the clearest small case of the rule this
whole design rests on: a constraint belongs to the mode that needs it.

And lifting it is exactly what exposes the next section, because the first thing
anyone does in a first-person view indoors is look up.

A fifth setting, **AUTO**, is FOLLOW that degrades into SNUG when `sh_room` says the
room cannot hold a boom. That is today's behaviour plus the clamp fix, and it should
be the default so nobody has to know the modes exist.

### ✅ Built — and `sh_room` alone could not do it

**`40:<mode>` chooses; AUTO is the default and the only one that degrades.** The
hysteresis is `auto_snug` in `lib/hex_editor`, eleven tests, and SNUG's visible half
is a per-client `V:` frame — a hide mask and an ambient.

⚠ **The design's rule is refuted by its own query, and the control is what did it.**
`sh_room` is the inscribed radius, and standing **outdoors** one world unit from a
house it reads **0.59 — smaller than the middle of the room behind that wall, 2.39.**
A threshold on the radius alone degrades the camera every time an author walks up to
a building they are about to edit. `sh_inside` is load-bearing, and this is only
visible because the probe measured a station nobody would have thought to measure.

| station | `sh_inside` | `sh_room` | `sh_back` | boom |
|---|---|---|---|---|
| open ground | false | 5.86 | 5.86 | 5.86 |
| **1 wu from a wall, outdoors** | **false** | **0.59** | 5.86 | 5.86 |
| mid-floor | true | 2.39 | 2.39 | 1.54 |
| a corner | true | 1.78 | **5.86** | 4.37 |
| against the inside of a wall | true | 0.35 | 0.39 | 0 |

⚠ **The corner row is why `sh_back` is in the struct** — tight all round, and the one
direction the boom actually wants is wide open. **No rule reads it yet.** It is
measured, reported on the `27:` trace, and has no consumer; that is stated rather
than hidden, because a field nobody reads is the fault this session found four times.

### ⚠ The mode is keyed on the ROOM, which is the opposite of the obvious choice

`body_shown` switches on the **boom**, and for a body that is right — a body is in
the way exactly when the eye is close to it. A **mode** cannot be keyed that way: the
boom is a function of the **yaw**, so a player turning on the spot in a corner sweeps
it from 4.4 to 1.9 and back, and every discrete thing the mode owns strobes once per
revolution. Hysteresis does not help, because turning crosses the whole band
repeatedly. `sh_room` is a property of the **place**, so turning cannot move it.

Thresholds: enter at `want × CAM_MIN_FRAC`, leave at 1.5× that. Not a taste — the
boom's own comfort floor, so *"the room cannot hold a boom"* means *"the room is
narrower than the shortest boom FOLLOW ever considered acceptable"*.

⚠ **The one test that catches a single threshold is the DITHER**, not the walk. A
straight there-and-back crosses one threshold twice and passes with no hysteresis at
all; sitting in the middle of the band and jittering is what fails. Measured by
collapsing the band: exactly two of the eleven rows go red, and the nine
single-point ones do not.

⚠ **The degradation is CONTINUOUS, and that is what makes SNUG an over-the-shoulder
view rather than a state.** The camera creeps up on the character as the room closes
in — and creeping straight down the boom ends at the back of a head, so the boom must
carry a **lateral shoulder offset that grows as it shortens**. At full length the
offset is nothing and the character is centred; at a metre it is most of a shoulder
width and the character sits to one side with the room ahead. Over-the-shoulder is
then not a fourth mode but *what a short boom looks like when it is done properly*,
and it means AUTO never has to flip anything until the boom truly reaches zero, which
is EYES.

Two consequences worth writing down:

- the offset must swing to the side with **more** clearance (`shelter_at` already
  measures the room all round), or the camera creeps into the wall it was avoiding;
- it is a *lateral* offset, not a yaw. Turning the camera to see past the character
  moves the world; sliding it does not, which is the same rule the pitch fence
  already obeys.

## ⚠ The eye was parked INSIDE the wall, and one constant did it

The thing that made SNUG unusable was not SNUG. Walking from the middle of a 5×4
room to its wall, reading the eye's own z off the view matrix:

| character z | eye z | subject | largest |
|---|---|---|---|
| 0.0 | −1.758 | 10.6% | masonry 43% |
| −0.6 | −1.823 | **15.9%** | masonry 39% ← the best frame in the house |
| −1.0 | −1.866 | 0.0% | masonry **75%** |
| −1.4 | −1.909 | 0.0% | masonry **99.7%** |

A cliff between two adjacent stations, and the eye crosses the wall's inner face
(≈ −1.84) exactly there. **`sweep_path` reports a hit on an EDGE, which is a line on
the lattice; the wall drawn on that edge is a band `BAND_SIDES` = 0.866 wide, centred
on it.** `CAM_SKIN` was 0.20 — under half a band — so every wall-limited boom parked
the eye in the masonry, and with nothing culling backfaces the far face was a
millimetre from the lens.

At half a band plus a margin the same stations read **46%** and **45%**, and the
mid-floor subject rises 10.6% → 13.6%. `boom.loft` pins the RELATION — the skin
clears half of `wall_band()` — so the two cannot move apart again.

⚠ **And raising it exposed a second one in `boom_take`.** The skin is a clearance
*from something*, and `cam_free_dist` returns `want` when the march finds nothing —
so the full unobstructed boom came back one skin short, **always**. Invisible at 0.20
(5.86 read 5.66, for as long as this has existed); at 0.533 it is a ninth of the boom
in an open field, and the gate's outdoor control is what noticed. A test now says
`free >= want` takes the whole boom, at three different skins.

## ⚠ The head-lamp is real; "near plane in" is not

**The lamp had to be paired with a genuinely low ambient before it did anything.**
At ambient 0.22 it was indistinguishable from turning the ambient up: the frame's
mean rose 0.202 → 0.232 and its contrast did **not** move (sd 0.1282 → 0.1290).
The mix is `a + (1−a)·d` and is clamped at 1, so with a high ambient most surfaces
are already near-lit and the lamp has no headroom. At ambient **0.10** with lamp
**0.90** the room is darker *and* higher-contrast than FOLLOW — 0.181/0.145 against
0.268/0.098 — and the floor visibly falls off with distance.

⚠ **A whole-frame `sd` cannot see a lamp, and it took three measurements to accept
that.** Dropping the ambient widens the *same* histogram, so lamp-on and lamp-off at
the same ambient read **0.1415 and 0.1418**. The signature is the spread *within one
surface*: with only an ambient and one directional light, a wall is one plane with
one normal and one colour, so every pixel of it has the identical luminance. A light
that falls off with distance is the only term that can make it vary.

| at the SNUG station | lamp off | lamp on |
|---|---|---|
| whole-frame `sd` | 0.1418 | 0.1415 |
| **`sd:masonry`** | **0.0031** | **0.0762** |
| `black` share | **2.35%** | 0 |

That last row is the design's *"a black frame is not atmosphere"* arriving as a
number: without the lamp a third of the frame falls so dark that a WALL matches the
ROAD's chromaticity, and 2.35% of it is literally black.

⚠ **`sd:masonry` is a claim about that STATION.** The bucket merges wall and frame,
whose base colours differ, so a view with a door surround spreads it for a reason
that is not the lamp — FOLLOW mid-floor reads 0.0507 either way. The 0.0031 baseline
is what says no frame is in this view.

### "Near plane in" — measured, and there is nothing for it to do

The design lists it beside the body and the lamp and gives no reason. The camera
cannot reach it: `CAM_SKIN` is 0.533, so the boom stops more than **ten times** the
near plane (0.05) away from anything the sweep found, and what the sweep does not
find cannot be in front of it either — the ground has its own backstop and `D1` says
dressing never shoves the camera.

Measured rather than argued: anything clipped shows as the clear colour, and `sky`
reads **0.0000** at every interior station — FOLLOW mid-floor, SNUG mid-floor, SNUG
against a wall, SNUG under the ridge looking up — against **29.7%** in the outdoor
control that proves the instrument can see it. Moving the plane in would only cost
depth precision already carrying a 1:8000 ratio. **`sky 0 0.001` is a gate row now**,
so if anything ever does get clipped the suite says so.

⚠ Second row of the mode table that describes a camera which no longer exists;
FOLLOW's *"roof, inside: hidden"* is the other. Both were written when the eye was
outside the house.

## The query every mode reads

Computed **once**, in the library, as a pure function — the structural claims belong
in `lib/`, not in the renderer.

```loft
pub struct Shelter {
  sh_inside: boolean,   // is the eye under a roof or a deck
  sh_head:   integer,   // clear height above the eye, or -1 for open sky
  sh_room:   float,     // clear radius before a view-blocking edge, all round
  sh_back:   float,     // clear distance directly behind the subject
}
pub fn shelter_at(w: World, roofs: RoofPlans, x: float, z: float,
                  eye_units: integer) -> Shelter
```

⚠ **`sh_inside` does not mean "hide the roof".** It means the eye is under one. What
to do about that is the mode's business, and FOLLOW and SNUG answer it in opposite
directions. A field named `sh_hide_roof` would have baked one mode into the query and
made the others unbuildable — which is exactly the mistake four modes exist to avoid.

⚠ `shelter_at` must read `world_surface`, not `terrain_h`. An upper storey's deck is
a ceiling for the room beneath it, and `terrain_h` answers *the outdoors* by
definition — the same fault that once made the upper storey unreachable.

`roof_plan_covers` already exists and is one of the six functions **no test has ever
entered**. It is the `sh_inside` half; it was written for this and never wired up.

## ⚠ The model has no true interior — only zero-thickness sheets

This is the structural one, and the character view is what makes it unavoidable.

**A wall is a band with real thickness.** `BAND_SIDES` is 0.866 world units, so a wall
has two faces, and everything the opening work is built on — the reveal, the soffit,
the jamb, an alcove's back, an embrasure's datum — exists *because there is material
between the two faces*.

**Every horizontal surface is a plane with no thickness at all.** A deck, a floor slab,
a roof, an annex's lid: each is one sheet of triangles at one height. The consequences
only appear once a camera can be underneath one:

- there is **no face from below** — the single-winding bug, which is the symptom;
- even with a face added, **the ceiling of a room and the floor of the storey above
  are the same plane at the same height**, with nothing between them. That is not a
  building, it is a fold in a sheet of paper;
- a hole in a floor — a hatch, a stairwell — has **no reveal**, because there is no
  thickness for one to be cut in. It is exactly the fault the wall openings fixed,
  one axis over;
- there is nowhere for a joist, a beam, a coffer, or a floor that is thicker than a
  roof.

So the fix is not "add an underside". It is **give horizontal surfaces the treatment
walls already have**: a `Slab` with a top and a bottom in height units, two faces, and
openings cut through it with reveals and frames — the horizontal analogue of the wall
band and its `Opening`. A storey's height then decomposes honestly into slab
thickness plus clear height, and `storey_add` writes a band rather than a line.

⚠ The opening family transfers almost whole. An opening in a wall is a profile along a
run; an opening in a slab is a shape in plan — different parameterisation, identical
structure: the index is the cells, the truth is the shape, the datum says which face
it is cut from, and the reveal is what makes it read as a hole in something rather
than a hole in nothing. A stairwell with a proper reveal is the same code that gave a
window its splay.

Until this exists, FOLLOW, SNUG and CUTAWAY are all fine — none of them ever looks up
from inside — and **EYES is a picture of the sky through the ceiling**. That is the
order this imposes, and it is the reason the character view is last in the list below
rather than first.

⚠ **The roof took its first instalment of this and it changed the argument.** Giving
the roof a real thickness — see the section below — was not a nicety: a zero-thickness
sheet **cannot carry two surfaces at all**, because the two copies land at identical
depths. So the case for the `Slab` is stronger than this section makes it: it is not
only that a fold in a sheet of paper has no room for a joist, it is that it has no
room for its own two sides. **Horizontal surfaces are still sheets** — the `Slab`
exists and `storey_add` still writes a line — and the roof is now the worked example
of what the rest of them are owed.

## ✅ The roof has an underside — and neither the symptom nor the fix was the predicted one

`emit_roof_plan` emits one winding — `emit_quad_n` for the slopes, `emit_tri_n` for
the gables. From below there is no face at all, so an interior camera sees **sky
through the roof**.

FOLLOW never noticed, because FOLLOW hides the roof indoors anyway. SNUG cannot work
until this is fixed: a ceiling is the whole of what makes a room feel enclosed, and
"claustrophobic" with the sky showing through is just a bug. It is a handful of
triangles with the winding reversed and a normal that points down — but it must be
its **own surface id**, not the same one, or CUTAWAY cannot hide the roof while SNUG
keeps its underside.

### ⚠ Built, and three things above are wrong. Each one was measured

**1. There was never any sky through the roof.** That prediction assumes backface
culling, and **nothing in this tree enables it** — `gl.enable(gl.DEPTH_TEST)` is the
whole of the client's state. So the interior was looking at the roof's *own*
triangles from behind, lit by `emit_tri_n`'s flipped-up normal: the same shade as the
tiles, from underneath. Measured before anything was built — looking up from inside,
`sky` is **0.0%** and `roof` **18.6%**. A ceiling that shades like a roof is not a
ceiling, which is the real complaint, and it is not the one the design wrote down.

**2. "A handful of triangles with the winding reversed" cannot work here**, for the
same reason. A reversed copy at the *same coordinates* is rasterised at bit-identical
depths, where `gl.LESS` fails the second one at every pixel — so the pair is a roof
with no underside or an underside with no roof, decided by draw order. **Coincident
geometry cannot be two surfaces.** The underside is therefore the roof pushed
`ROOF_SOFFIT` along each face's own inward normal: **the roof has a thickness now**,
the smallest honest instalment of the `Slab` treatment in §"no true interior" below.

**3. Deriving the faces properly found a live defect that had shipped since S6.**
`emit_tri_n` flips any normal with `n.y < 0` upward, which silently corrected both
*slopes* — and a gable end is **vertical**, so `n.y` is exactly 0 and the flip has
nothing to test. Both gables were wound the same way and "outward" is opposite for
them, so **every house has had one gable end lit from inside**. A lighting sign is
not a shape; no gate reads shading; it survived. `roof_face_pt` states the winding
once now and `soffit.loft` asserts the two ends face opposite ways.

### ⚠ The ridge has to be mitred, and a pitch of 1.1 is what said so

A ridge vertex lies on **both** slope planes, so pushing it along one slope's normal
moves it by `−t·(n₀·n₁)` relative to the other. That dot is `(hd² − rise²)/L²` —
positive under 45°, zero at 45°, **negative past it**. On a steep roof the -v slope's
underside pushes its ridge end *up through the +v slope and out of the building*: an
inward offset that ends up outside.

The fix is one number: the two offset planes meet on a line `t·secθ` under the ridge,
and both slopes take that height with no horizontal offset at all. A ridge corner is
then exactly `−t` from **both** planes, which is the geometric content of *"the two
halves of the ceiling meet at the ridge"* — and `t·secθ` for a perpendicular `t` is
the carpenter's own rule, arrived at from the other end.

⚠ **Two of the tests started out as stronger, wrong claims and the first run said so.**
"Every soffit vertex is strictly inside the tent" is false of a *correct* soffit — a
slope's offset has no u component, so its underside keeps the roof's full width and
lands exactly ON the gable plane, which is what leaves no slot between them. And
"displaced by `t` along the normal" is false at a mitred ridge. Both rows carry what
they used to say.

### ⚠ Two invisible defects were hiding each other

With the ceiling in, orange wedges punched up through it in a regular sawtooth. They
were not the soffit. `chunk_mesh_props` read

```loft
if e.h_material == ROOF_MAT && !planned { emit_roof_sloped(…) }
else if <not the ground layer>          { emit_hex_surface(…); emit_floor_slab(…) }
```

so a roof cell **covered by a plan** failed the first branch and fell into the second
— drawn as a **floor deck at its own roof height**. The hex staircase that
`roof_plan_covers` exists to suppress was being emitted the whole time, one surface
over. It survived because the floor was the wall's own pale grey, and a sawtooth of
grey inside a grey roof is nothing to look at.

Giving the floor a timber of its own (the camera work, earlier the same day) and the
roof an underside put it on screen at once. **Separating one surface exposed the
other** — and it was costing the *exterior* 1.6% of every frame too, a sawtooth lying
on the roof, which is why the outdoor control's `roof` share went 1.3% → 4.8% when it
was removed.

### What it reads now — `make gate`, `camera_indoors`

| | outside (control) | mid-floor | corner |
|---|---|---|---|
| `soffit` | **0.01%** | 24.0% | 33.6% |
| `roof` | 4.8% | 1.2% | 0.0% |

⚠ **The outdoor row is the strongest one here, and it is an absence.** A surface that
faces the room is behind the roof at every pixel from the road; if it shows outdoors
it has been built on the wrong side of the tent, which is exactly what a backwards
face normal does. **Seen red**: emit the soffit into the roof's own mesh, as the
design's "reversed copy" would have, and both interior stations fail both rows
(`soffit 0`, `roof 25%`/`34%`) while the control does not move.

That is the first thing this design found that nothing else would have: FOLLOW's fix
and SNUG's requirement pull the roof apart into two surfaces, and only building both
modes reveals it.

## What each mode needs from the client, and why it is per-client

Chunks are **broadcast to every client**, so nothing here may be a view-dependent
mesh. Everything below is a per-client surface toggle over ids that already exist, or
one that has to be created for the purpose.

- **Roof (slot 5)** — hidden by FOLLOW-inside and CUTAWAY, shown by SNUG.
- **Roof underside (new)** — shown by SNUG only.
- **The figure's own meshes** — already their own ids, hidden by SNUG.
- **Walls** — the hard one; see below.
- **Ambient and head-lamp** — two floats on the wire, per client, cross-faded.

The camera *solve* is already server-side and already per-viewport (`2:<aspect>`), so
the boom and the mode live there and only the visibility flags travel.

## ✅ CUTAWAY stage 1 — and a rule the design did not have

**Built: `40:3`.** Roof and soffit hidden, a fixed boom, its own steep pitch, ambient
high and flat, the figure drawn small for scale. From the exact spot where FOLLOW
shows a wall and a ceiling, CUTAWAY shows the room in plan with the field visible
outside it.

| at the same standing position | FOLLOW | CUTAWAY |
|---|---|---|
| `soffit` | 0.240 | **0** |
| `roof` | 0.011 | **0** |
| `grass` | 0 | **0.238** |
| `floor` | 0.192 | 0.321 |
| `figure` | 0.136 | 0.006 — drawn, small |
| `lum` | 0.268 | 0.424 — high and flat |

⚠ **This is the case that made the roof and its soffit two surfaces.** SNUG keeps the
underside; CUTAWAY takes both — from identical geometry, decided per client. It could
not have been expressed at all while they shared one mesh.

### ⚠ What you cannot see must not occlude

**CUTAWAY does not sweep**, and that is a rule rather than a shortcut. Measured with
the sweep left on: standing in the middle of the house, the fixed **14.14** boom
collapsed to **1.57**, with the eye at y 2.08 — barely above the character's chest
and nowhere near the eave. The thing stopping it was **the roof**, whose cells are
occupied terrain layers that `ground_under` reports like any other surface.

The roof is the surface this mode *hides*. A camera avoiding something the viewer
cannot see is avoiding nothing, and it parks the eye under the very object it
removed. The ground backstop still applies, so the eye cannot end up underground —
and above a hidden roof is exactly where a plan view wants to be.

⚠ **`grass` is the gate row that catches this**, and it is the one worth stealing:
*standing indoors, a tenth of the frame is the field outside.* That is only possible
with the roof off **and** the eye above the wall head, so one number tests both
halves. Seen red twice — stop hiding the roof and it fills 80% of the frame; let the
hidden roof block the boom again and `grass` reads 0.

### The settings, measured rather than chosen

Boom `figure_wu() × 3.2`, pitch 1.25 rad. Longer and steeper reads as a map rather
than a room: at ×7.0 / 1.05 the same interior station gave **grass 0.707** — the
building small in a field — against 0.238 at ×3.2. The design's *"largest single
surface < N%"* row is what settles it, and it wants the thing being edited to be most
of the picture.

⚠ **The pitch fence lifted with the mode**, exactly as the design predicted it must:
`PITCH_MAX` is 0.75 because *"past vertical, behind the character stops meaning
anything"* — a statement about a boom orbiting a subject. CUTAWAY orbits nobody.

## CUTAWAY's near walls, in two stages

Front-face culling does **not** work: a wall is a slab with two faces, and culling the
one that faces the camera leaves the inner one — whose normal points into the room,
away from the eye — still occluding it. The unit that has to disappear is the whole
**run**.

1. **Steep and roofless first.** With the roof hidden and the camera well above the
   eave, you can already look down into a house; near walls only occlude at shallow
   angles. This is one flag and it is most of the value.
2. **Then bucket runs by heading.** A run's outward normal is fixed at emit time, so
   walls can be split into four heading quadrants at no view-dependent cost, and
   CUTAWAY hides the two facing the camera. `SURFACES` goes 8 → 11; empty buckets
   broadcast almost nothing, and most chunks have no walls at all.

Doing (2) first would be the expensive half of a feature whose cheap half was never
tried.

## Two rules the existing camera design already sets

Both are in `editor_server.loft`'s occlusion section, and the new work inherits them:

1. **Pitch is rate-limited in both directions and never snaps; the boom is the fast
   valve.** So a *mode* change must ease, and the boom may not — a shorter boom is a
   framing change, an angle that jumps is the world appearing to move.
2. **The camera samples the same surface the feet do**, so it cannot disagree with
   what it is avoiding.

## The hysteresis, precisely

AUTO enters SNUG at `sh_room < A` and leaves at `sh_room > B`, with `B > A`; ambient
and the roof toggles cross-fade over a fixed number of ticks. Without two thresholds,
walking through a doorway strobes the entire frame — and a doorway is the one place
in a house a player is guaranteed to stand still.

An *explicitly chosen* mode never auto-switches. Someone who picked SNUG walking into
a broom cupboard picked it on purpose.

## The measurement that says it worked

⚠ **THE GATE IS `tools/gates/world/camera_indoors.mjs`** — this line named
`camera_modes.mjs`, which has never existed, so anyone following it found nothing and
would reasonably have concluded the measurement was never written. ⚠ **And the *(today: …)*
notes in the table below are the BEFORE state**, from when the section was written; the
banner at the top of this file is the after. Build a house, stand inside, and assert **per
mode**, because the modes disagree by design and a single expectation would be wrong for
two of them:

| | FOLLOW | SNUG | EYES | CUTAWAY |
|---|---|---|---|---|
| subject pixels | **> 0** *(today: zero)* | 0 — body hidden | 0 | > 0 |
| roof triangles drawn | 0 *(today: drawn)* | > 0, **from below** | > 0 | 0 |
| largest single surface | < N% *(today: the wall is most of it)* | unconstrained — pressing in is the point | unconstrained | < N% |
| distinct colours | — | > 1 — a black frame is not atmosphere | > 1 | — |
| **looking straight up, sky pixels** | — | — | **0** *(today: all of them)* | — |

That last row is the one worth stating out loud: the failure mode of a horror camera
is a picture with nothing in it, and "dark" and "empty" are indistinguishable to
anyone but the person who wrote it.

## ✅ EYES — and the row the whole design ordered itself around

**Built: `40:4`.** No boom at all — `cam_want = 0`, and everything else falls out:
the collapse is total so `shoulder_reach` is zero and `body_shown` hides the figure
without being told to, which is two rules agreeing rather than a special case.

⚠ **`cam_want = 0` IS NOT ENOUGH, and it looks like it should be.** With no boom the
eye lands on the pivot — correct — but the target is a fixed point 1.2 figures ahead
at pivot height, so the view direction is horizontal *whatever the pitch is*. A
first-person camera built that way can never look up, which is the one thing this
mode exists for. And the pivot is the wrong point anyway: it carries a lateral
shoulder offset and sits at the chest, because it is what a boom ORBITS. Eyes are at
the top of a head and on the centre line.

### The design's own measurement row, and it is the soffit's payoff

*"Looking straight up, sky pixels: **0** (today: all of them)"* was written when the
roof had no underside — which is precisely why EYES was last on the list.

| EYES, looking straight up | `sky` | largest |
|---|---|---|
| **outdoors — the control** | **0.997** | sky |
| **indoors** | **0.000** | **soffit 0.997** |
| indoors, straight down | 0.000 | floor 0.997 |
| indoors, level | 0.000 | masonry 0.535, soffit 0.336, floor 0.125, figure **0** |

⚠ **The control is the point.** "No sky" is only a result if the instrument can find
sky when there is some; otherwise a camera drawing nothing scores the same.
**Seen red**: stop emitting the soffit and the ceiling row fails — though `sky` still
reads 0, because with no backface culling you see the roof's *topside* from below.
The design's prediction was right about the ORDER and wrong about the symptom, for
the reason recorded above.

### ⚠ A fence applied only at the input is not applied

`PITCH_MIN`/`PITCH_MAX` were clamped in the LOOK handler, and a mode change is not a
look. So leaving EYES while looking straight up carried a pitch of **−1.5** into
FOLLOW — a value FOLLOW's own handler would never accept — and the boom obeyed it.
`pitch_fenced` is one derivation with two callers now, and the second is the one that
matters. **Seen red**: drop the re-fence and the character leaves the frame entirely
(figure 0.0008 against 0.02 required).

⚠ **What was still owed was one floor up — and it is done.** A DECK was a sheet, so
EYES under an upper storey looked through it exactly as it once looked through a
roof. `emit_hex_under` puts its underside in the same **soffit** surface, because
that is what the surface means: the underside of whatever is over you.

⚠ **One instrument could not see it.** A roof's soffit and a floor's soffit are one
colour and one surface, so standing under an upper storey *inside a house*
photographs `soffit 0.997` either way. The COUNT settles it — 18 vertices before the
storey, which is six triangles, which is a gable's tent exactly. On open ground with
nothing above, 0 → **342** = 19 cells × 6 triangles. ⚠ And the pixel row is `floor`,
not `sky`: with no culling a deck without an underside is not a hole, it is its own
top fan seen from below.

⚠ **A CELLAR STILL HAS NO CEILING**, which is the third time for this shape. The
underside is drawn for every non-ground layer, and a cellar's ceiling is the GROUND —
drawn by `chunk_mesh_mat` on a different path entirely.

## What NOT to build

- **A view-dependent mesh.** Chunks are broadcast; hiding is per-client, which means
  per-surface.
- **Camera collision against dressing.** `D1` says dressing never collides. A chair
  must not shove the camera, and this falls out for free while the query stays on the
  surface set.

## Order of work

1. ✅ `shelter_at` and its tests — pure, no server, and every mode reads it.
   ⚠ `sh_room` and `sh_back` are MEASURED, not derived, so `shelter_at` leaves them
   at -1 and the server fills them with `shelter_room` where the sweep lives. A clear
   radius needs a march against the view-blocking edge set, and re-deriving that here
   would be a second answer to a question `cam_free_dist` already answers. **`sh_back`
   still has no consumer** — see the corner row above.
2. ✅ The roof's underside, as its own surface id — `SURFACES` 8 → 9, and nine gate
   files carry the stride. ⚠ It needed a **thickness**, which this list did not
   predict; see the section above for why a reversed copy at the same coordinates
   cannot be a second surface. SNUG's ceiling now exists to be kept.
3. ✅ **FOLLOW's fix** — and it was **not** what this list predicted. The boom going
   below `CAM_MIN_FRAC` was necessary and nowhere near sufficient: `boom_take`
   already collapsed it correctly and the collapse was never published. The eye is
   in the room now and the frame rows are green without `sh_back` being consulted
   once. **AUTO's degradation into SNUG is still to build**, and it is where the two
   thresholds go.
4. ✅ **SNUG**: body hidden, ambient down, head-lamp up — all three, eased and gated.
   ⚠ **"Near plane in" was a claim, not a task, and it is refuted** — see below.
   AUTO reaches SNUG about 1.4 wu from a wall in a 5×4 room.
5. ✅ **CUTAWAY stage 1**: roof off, camera above the eave — and the eave is where
   the sweep had to stop being consulted; see above.
   ⚠ **FOLLOW's own "roof, inside: hidden" row is now obsolete and should not be
   built.** It was written when the eye was outside the house and the roof was
   between them; the eye is in the room now, below the eave, so hiding the roof
   would show sky over the walls. The row was right about a camera that no longer
   exists.
6. ◐ The gate, per mode — FOLLOW's three stations are in `make gate`; the other
   three modes have no rows because they have no behaviour yet.
7. **The `Slab`**: horizontal surfaces get a thickness, two faces, and openings with
   reveals. This is the big one and it is a world-model change, not a camera change —
   it belongs on the ladder in its own right, and the camera is merely the consumer
   that proves it is needed.
8. ✅ **EYES**, with the lifted pitch fence. ⚠ It did NOT need 7 first, because the
   roof's underside was enough for a house with one storey — the `Slab` is what a
   SECOND storey will need, and the gate says which case is covered.
9. **CUTAWAY stage 2**: heading buckets, if shallow angles turn out to matter.
   ⚠ **Stage 1 says they do not, yet.** At pitch 1.25 the near wall is below the
   frame entirely and `masonry` is 0.43 — walls read as plan, not as occluders. The
   case for stage 2 is a shallower CUTAWAY than this one, and nothing asks for that
   until an author does.
