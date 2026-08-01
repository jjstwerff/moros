# The camera indoors — four modes, one query

> Status: **design, not built.** `tools/scripts/indoors.keys` reproduces the two
> measurements below.

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

**The fault is that `CAM_MIN_FRAC` is a floor the sweep cannot go below.** 0.22 of a
4.8 m boom is about 1.05 m, and a 5×4 room offers less than that behind the character
in most facings — so the sweep shortens to the clamp and the eye is left outside the
house it was avoiding. The clamp exists so the camera never sits in the character's
head. Indoors that is exactly the trade that has to be made.

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

## ⚠ The roof has no underside — the symptom of the above

`emit_roof_plan` emits one winding — `emit_quad_n` for the slopes, `emit_tri_n` for
the gables. From below there is no face at all, so an interior camera sees **sky
through the roof**.

FOLLOW never noticed, because FOLLOW hides the roof indoors anyway. SNUG cannot work
until this is fixed: a ceiling is the whole of what makes a room feel enclosed, and
"claustrophobic" with the sky showing through is just a bug. It is a handful of
triangles with the winding reversed and a normal that points down — but it must be
its **own surface id**, not the same one, or CUTAWAY cannot hide the roof while SNUG
keeps its underside.

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

`tools/gates/world/camera_modes.mjs` — build a house, stand inside, and assert **per
mode**, because the modes disagree by design and a single expectation would be wrong
for two of them:

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

## What NOT to build

- **A view-dependent mesh.** Chunks are broadcast; hiding is per-client, which means
  per-surface.
- **Camera collision against dressing.** `D1` says dressing never collides. A chair
  must not shove the camera, and this falls out for free while the query stays on the
  surface set.

## Order of work

1. `shelter_at` and its tests — pure, no server, and every mode reads it.
2. The roof's underside, as its own surface id. SNUG is unbuildable without it and
   FOLLOW has been hiding the gap.
3. **FOLLOW's fix**: the boom may go below `CAM_MIN_FRAC` when `sh_back` says so;
   AUTO degrades to SNUG with the two thresholds.
4. **SNUG**: body hidden, ambient down, head-lamp up, near plane in.
5. **CUTAWAY stage 1**: roof off, camera above the eave.
6. The gate, per mode — the only thing that can say any of it worked.
7. **The `Slab`**: horizontal surfaces get a thickness, two faces, and openings with
   reveals. This is the big one and it is a world-model change, not a camera change —
   it belongs on the ladder in its own right, and the camera is merely the consumer
   that proves it is needed.
8. **EYES**, which cannot honestly exist before 7, plus the lifted pitch fence.
9. **CUTAWAY stage 2**: heading buckets, if shallow angles turn out to matter.
