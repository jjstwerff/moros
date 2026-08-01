# The camera indoors — what breaks, and the design that fixes it

> Status: **design, not built.** Two measurements below; four faults; one query that
> all four key off. `tools/scripts/indoors.keys` reproduces the pictures.

## What was measured, before anything was designed

A 5×4 house, and the author standing in it. The boom **already** sweeps walls with
`wall_stops_view` and `sweep_path` — so the question was never "does the camera know
about walls", and guessing would have designed the wrong fix.

| where | what the frame contains |
|---|---|
| middle of the room | the roof seen from **outside**, a slab of exterior wall, and **no character at all** |
| facing a corner | the character in extreme close-up in one corner, the rest flat wall, sky through a gap |

Those are two different failures, and the instrument is the same in both: **how many
pixels of the frame are the subject.** In the first it is *zero*. That is a number,
not a matter of taste, and it is what the gate at the bottom asserts.

## The four faults

**F1 — the minimum boom is a floor the wall sweep cannot go below.** `CAM_MIN_FRAC`
is 0.22 of a boom of `figure_wu() * 2.90`, about 1.05 m. A 5×4 room offers less
clearance than that behind the character in most facings, so the sweep shortens the
boom to the floor and the eye is left *inside or beyond* the wall — which is the
first picture exactly. The clamp exists so the camera never ends up in the
character's head; indoors that is precisely the trade that has to be made.
→ **below the floor the camera must change MODE, not clamp.**

**F2 — there is no interior mode.** A third-person boom cannot work in a three-metre
room: a correctly collided boom there is shorter than the character is wide. What is
needed is first person — eye at the head, own body not drawn — and it must be
hysteretic, because a doorway is exactly where the condition flips and the character
stands in one for several ticks.

**F3 — the roof is drawn over the room you are in.** The top third of the first
picture is the roof, from above. ⚠ **This is a client-side surface toggle, not a
re-mesh.** Roofs already ride their own surface id (slot 5), and chunks are
*broadcast to every client*, so a view-dependent mesh would be wrong for everyone
else in the world. One boolean on the wire; the client hides one surface.

**F4 — an interior has no light of its own.** The shading is a single directional
term, so a room lit through one window is a flat dark grey. The reveal and frame work
survives — it reads by *normal difference*, which still holds — but with no ambient
floor and no head-lamp term there is nothing to separate a near wall from a far one.
Same boolean: indoors raises ambient.

## The unification: one query, four consumers

All four key off the same predicate, so it is computed **once**, in the library, as a
pure function — the structural claims belong in `lib/`, not in the renderer.

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

- `sh_back` is what **F1** needs: a boom permitted to be shorter than `CAM_MIN_FRAC`.
- `sh_room` decides **F2**'s mode.
- `sh_inside` drives **F3**'s roof toggle and **F4**'s ambient.
- `sh_head` separates a cottage from a hall, so the camera does not go first-person
  in a cathedral merely because it is indoors.

⚠ `shelter_at` must read `world_surface`, not `terrain_h`. An upper storey's deck is
a ceiling for the room beneath it, and `terrain_h` answers *the outdoors* by
definition — the same fault that once made the upper storey unreachable.

`roof_plan_covers` already exists and is one of the six functions **no test has ever
entered**. It is the `sh_inside` half. That is not a coincidence worth ignoring: it
was written for this and never wired up.

## Two rules the existing camera design already sets

Both are in `editor_server.loft`'s occlusion section and the new work inherits them:

1. **Pitch is rate-limited in both directions and never snaps; the boom is the fast
   valve.** So a *mode* change must ease, and the boom may not — a shorter boom is a
   framing change, an angle that jumps is the world appearing to move.
2. **The camera samples the same surface the feet do**, so it cannot disagree with
   what it is avoiding.

## The hysteresis, precisely

Enter the interior mode at `sh_room < A`, leave it at `sh_room > B`, with `B > A`;
cross-fade the ambient and the roof over a fixed number of ticks. Without two
thresholds, walking through a doorway strobes the entire frame — and a doorway is the
one place in a house a player is guaranteed to stand still in.

## The measurement that says it worked

`tools/gates/world/indoors.mjs` — build a house, stand inside, and assert:

1. **the subject is visible at all** — its pixels > 0. *Today: zero.*
2. **no single surface occupies more than N% of the frame.** *Today: the wall is most
   of it.*
3. **the roof surface draws no triangles while inside.** *Today: it draws.*

Three numbers. Two of them already fail, which is what makes this a defect rather
than a preference.

## What NOT to build

- **A view-dependent mesh.** Chunks are broadcast; hiding must be per-client, which
  means per-surface, which the surface ids already give for free.
- **A cutaway / dollhouse mode.** Wanted eventually, and genuinely useful for
  editing — but it is the *opposite* problem (looking INTO a house from outside) and
  needs run-granular backface culling. Building it alongside this one would let two
  different problems constrain each other's design.
- **Camera collision against dressing.** `D1` says dressing never collides. A chair
  must not shove the camera, and this falls out for free if the query stays on the
  surface set.

## Order of work

1. `shelter_at` and its tests — pure, no server, and everything else reads it.
2. **F1**: the boom may go below `CAM_MIN_FRAC` when `sh_back` says so.
3. **F2**: first-person mode, with the two thresholds.
4. **F3 + F4**: one `indoors` field on the wire; the client hides surface 5 and lifts
   ambient.
5. The gate, which is the only thing that can say any of it worked.
