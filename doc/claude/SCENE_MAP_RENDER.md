# SCENE_MAP — Wall and Roof Rendering Pseudocode

> **Read the code first; this document is the design narrative behind it.** A real
> implementation exists — `moros_render.loft`, ~1340 lines with five test files, recovered
> by [moros#2](https://github.com/jjstwerff/moros/issues/2) — and where the two differ, the
> code is authoritative.
>
> **The coordinate convention below is wrong in a specific, checkable way.** It uses
> *flat-top axial* (`wx = a·1.5·q`, `wz = HEX_NS·(r + q/2)`, with N and S neighbours). The
> implemented grid is **pointy-top odd-r** (`x = q·√3 + (r&1)·√3/2`, `z = 1.5·r`, neighbours
> E/W/NE/NW/SE/SW). These are different lattices, not different spellings — the neighbour
> sets do not even have the same members. Fixing it is
> [moros#3](https://github.com/jjstwerff/moros/issues/3), and the wall and roof derivations
> that follow inherit the error.
>
> What remains valuable and correct: the *structure* of the generation — one loop across all
> `cy` layers with no special case for roofs, slope faces from height deltas, thick walls as
> offset slabs with corner posts, the stair families. That is the part worth reading.

Geometry generation for walls, slope faces, and roofs from SCENE_MAP hex data.
The same `draw_building()` loop handles all cy layers — ground floors, upper floors,
and roofs share identical rendering logic with no special cases.

Output primitives used: `emit_quad(v[4], material)`, `emit_polygon(v[6], material)`.
All coordinates are world-space metres: x = east, y = up, z = south.

---

## Constants

```
a          = 0.5774   m    // hex edge length = 1 / sqrt(3)
HEX_NS     = 1.0000   m    // N-S diameter (flat to flat) = a * sqrt(3)
HEX_EW     = 1.1547   m    // E-W diameter (vertex to vertex) = 2 * a
H_UNIT     = 0.1667   m    // one height unit = HEX_NS / 6  (≈ 16.7 cm)
WALL_HALF  = 0.0833   m    // half wall thickness = H_UNIT / 2  (≈ 8.3 cm)
DIAG_X     = 0.4330   m    // diagonal wall centre offset from hex centre = 3a/4
DEF_WALL_H = 12             // fallback wall height in height units (≈ 2 m)
N_CYL_SEGS = 8              // quad segments used to approximate a cylinder (THICK_CURVED corners)
```

`thick_half` is derived per wall at render time:
```
thick_half = IF wall_def.thickness > 0.0 THEN wall_def.thickness / 2.0 ELSE WALL_HALF
```

---

## Coordinate Helpers

> **Superseded — do not implement from this block.** Both functions below are flat-top
> axial. The implemented forms are `hex_to_world` in `moros_render.loft` and
> `lattice_k` / `lattice_m` / `nb_q` / `nb_r` in `hex_field`, and the neighbour direction
> set is E/W/NE/NW/SE/SW with no N or S. Call the library rather than re-deriving either:
> lattice math is implemented once, in `hex_grid`.

```
// SUPERSEDED — flat-top axial (q, r) → world XZ.
FUNCTION world_pos(q, r) -> (wx, wz):
  wx = a * 1.5 * q
  wz = HEX_NS * (r + q * 0.5)


// SUPERSEDED — six neighbour offsets in flat-top axial coordinates.
FUNCTION axial_neighbour(q, r, dir) -> (q', r'):
  SWITCH dir:
    N:  RETURN (q,   r-1)
    NE: RETURN (q+1, r-1)
    SE: RETURN (q+1, r  )
    S:  RETURN (q,   r+1)
    SW: RETURN (q-1, r+1)
    NW: RETURN (q-1, r  )


// Resolve global axial (q, r, cy) to a Hex, crossing chunk boundaries as needed.
FUNCTION get_hex(map, q, r, cy) -> Hex or NULL:
  cx    = floor(q / 32);   hx = q mod 32
  cz    = floor(r / 32);   hz = r mod 32
  chunk = map.chunks[(cx, cy, cz)]
  IF chunk == NULL: RETURN NULL
  RETURN chunk.hexes[hx][hz]


// Return the absolute ceiling height (height units) for walls at (q, r, cy).
// Uses the floor of the cy+1 layer if present; otherwise floor + DEF_WALL_H.
FUNCTION get_ceiling(map, q, r, cy) -> height_units:
  upper = get_hex(map, q, r, cy + 1)
  IF upper != NULL AND upper.material != OPEN:
    RETURN upper.height
  this = get_hex(map, q, r, cy)
  RETURN (this.height IF this != NULL ELSE 0) + DEF_WALL_H


// Retrieve a wall value in any of the six directions,
// resolving to the owning neighbour where necessary.
//   Owned by this hex:  N → wall_n,  NE → wall_ne,  SE → wall_se
//   Owned by neighbour: S, SW, NW
FUNCTION get_wall(map, q, r, cy, dir) -> Wall:
  SWITCH dir:
    N:  RETURN get_hex(map,  q,    r,   cy).wall_n
    NE: RETURN get_hex(map,  q,    r,   cy).wall_ne
    SE: RETURN get_hex(map,  q,    r,   cy).wall_se
    S:  RETURN get_hex(map,  q,   r+1,  cy).wall_n     // south neighbour owns S edge
    SW: RETURN get_hex(map, q-1,  r+1,  cy).wall_ne    // SW neighbour owns SW edge
    NW: RETURN get_hex(map, q-1,   r,   cy).wall_se    // NW neighbour owns NW edge
```

---

## Main Draw Loop

```
FUNCTION draw_building(map, chunk_list):
  // chunk_list: all cy layers of one building, same (cx, cz), any number of stories.
  FOR EACH chunk IN chunk_list:
    FOR hx = 0 TO 31:
      FOR hz = 0 TO 31:
        hex = chunk.hexes[hx][hz]
        IF hex.material == OPEN: CONTINUE

        q  = chunk.cx * 32 + hx
        r  = chunk.cz * 32 + hz
        cy = chunk.cy
        (wx, wz) = world_pos(q, r)

        // Flat hexagonal surface polygon (floor, ceiling, or roof tile).
        emit_hex_surface(wx, wz, hex.height * H_UNIT, hex.material)

        // Place any item sitting on this hex.
        IF hex.item != 0:
          item_def = map.item_palette[hex.item]   // resolve u8 index → ItemDef
          draw_item(item_def, hex.item_rotation, wx, wz, hex.height * H_UNIT)

        // Each hex renders only its three owned wall edges.
        draw_wall(map, hex, q, r, cy, wx, wz, N)
        draw_wall(map, hex, q, r, cy, wx, wz, NE)
        draw_wall(map, hex, q, r, cy, wx, wz, SE)
```

---

## Wall Rendering

### draw_wall — Mode A (open) and Mode B (structural)

```
FUNCTION draw_wall(map, hex, q, r, cy, wx, wz, dir):
  wall_type = hex.wall_n  IF dir == N
              hex.wall_ne IF dir == NE
              hex.wall_se                         // SE

  (nq, nr) = axial_neighbour(q, r, dir)
  nbr       = get_hex(map, nq, nr, cy)
  h_nbr     = nbr.height IF nbr != NULL ELSE 0
  h_this    = hex.height

  // ── MODE A: open wall ─────────────────────────────────────────────────────
  // No structural surface. If heights differ, draw a slope face to bridge the gap.

  IF wall_type == OPEN:
    IF h_this != h_nbr:
      mat = IF h_this > h_nbr THEN hex.material ELSE nbr.material
      emit_slope_face(dir, wx, wz, h_this, h_nbr, mat)
    RETURN

  // ── MODE B: structural wall ───────────────────────────────────────────────
  // Renders from the lower of the two floor heights up to the ceiling.
  // Height delta between the hexes sets the plinth depth, not the wall height.

  wall_def   = map.wall_palette[wall_type]   // resolve u8 index → WallDef
  thick_half = IF wall_def.thickness > 0.0 THEN wall_def.thickness / 2.0 ELSE WALL_HALF
  y_base     = MIN(h_this, h_nbr) * H_UNIT
  y_top      = get_ceiling(map, q, r, cy) * H_UNIT

  // ── Dispatch on body type ─────────────────────────────────────────────────

  IF wall_def.body == ROAD_GUIDE:
    RETURN   // no visible geometry; road guide is physics/editor only

  IF wall_def.body == THICK_FLAT:
    draw_thick_flat_wall(map, hex, q, r, cy, wx, wz, dir, wall_def, thick_half, y_base, y_top)
    RETURN

  IF wall_def.body == THICK_CURVED:
    draw_thick_curved_wall(map, hex, q, r, cy, wx, wz, dir, wall_def, thick_half, y_base, y_top)
    RETURN

  // ── Thin wall fallback: SOLID, HALF_HEIGHT, FENCE, BATTLEMENT ────────────

  IF dir == N:
    // Flat E-W slab centred on the north flat edge.
    z_c = wz - HEX_NS / 2
    (x_left, x_right) = n_wall_x_extents(map, hex, q, r, cy, wx, thick_half)
    emit_wall_slab(x_left, x_right, z_c - thick_half, z_c + thick_half,
                   y_base, y_top, wall_def)

  ELSE IF dir == NE:
    // N-S slab at midpoint x = wx + DIAG_X.
    // Covers the upper segment of the right side: z ∈ [wz − HEX_NS/2, wz].
    xc = wx + DIAG_X
    emit_wall_slab(xc - thick_half, xc + thick_half,
                   wz - HEX_NS / 2, wz,
                   y_base, y_top, wall_def)

  ELSE:  // SE
    // N-S slab at midpoint x = wx + DIAG_X.
    // Covers the lower segment of the right side: z ∈ [wz, wz + HEX_NS/2].
    // NE and SE share the same x and meet at z = wz with no gap.
    xc = wx + DIAG_X
    emit_wall_slab(xc - thick_half, xc + thick_half,
                   wz, wz + HEX_NS / 2,
                   y_base, y_top, wall_def)
```

### Corner Extension for N walls

```
// The N flat edge runs from x = wx − a/2 to x = wx + a/2 (the NW and NE vertices).
// The diagonal walls sit at x = wx ± DIAG_X = wx ± 3a/4.
// Because DIAG_X > a/2, a 14.4 cm gap exists at each corner between the end of
// the flat edge and the face of the diagonal wall.
//
// This is closed by extending the N wall's x-range outward to ± (DIAG_X + WALL_HALF)
// whenever a diagonal wall terminates at the same vertex.
//
// Two diagonal walls can terminate at the NE vertex (z = wz − HEX_NS/2, x = wx + DIAG_X):
//   • wall_ne of THIS hex   — the upper-right segment starting downward from here
//   • wall_se of the NORTH neighbour — the lower-right segment ending upward at here
// Either being non-open means a diagonal wall is present and the corner must be filled.
//
// The west corner mirrors this using the NW neighbour's diagonal walls.

// thick_half is derived from wall_def.thickness (or WALL_HALF for thin walls).
// For THICK_FLAT the extension fills the square corner block; for thin walls
// it closes the 14.4 cm cosmetic gap between the flat edge and the diagonal face.
FUNCTION n_wall_x_extents(map, hex, q, r, cy, wx, thick_half) -> (x_left, x_right):
  x_left  = wx - a / 2
  x_right = wx + a / 2

  // East corner: extend if any diagonal wall meets the NE vertex.
  n_nbr = get_hex(map, q, r-1, cy)
  IF hex.wall_ne != OPEN OR (n_nbr != NULL AND n_nbr.wall_se != OPEN):
    x_right = wx + DIAG_X + thick_half

  // West corner: extend if any diagonal wall meets the NW vertex.
  nw_nbr = get_hex(map, q-1, r, cy)
  IF nw_nbr != NULL AND (nw_nbr.wall_ne != OPEN OR nw_nbr.wall_se != OPEN):
    x_left = wx - DIAG_X - thick_half

  RETURN (x_left, x_right)
```

---

## Thick Wall Rendering

### draw_thick_flat_wall — 1 m slabs with square corners

```
FUNCTION draw_thick_flat_wall(map, hex, q, r, cy, wx, wz, dir, wall_def, thick_half, y_base, y_top):
  IF dir == N:
    z_c = wz - HEX_NS / 2
    // x_right extends to the outer face of the NE diagonal wall when present,
    // forming a solid square corner block. x_left mirrors for NW.
    (x_left, x_right) = n_wall_x_extents(map, hex, q, r, cy, wx, thick_half)
    emit_thick_wall_slab(x_left, x_right, z_c - thick_half, z_c + thick_half,
                         y_base, y_top, wall_def)

  ELSE IF dir == NE:
    xc = wx + DIAG_X
    // The slab runs from the N edge of this hex down to the hex midline.
    // The N wall's corner extension already covers the top corner area,
    // so the NE slab does not need trimming — internal overlap is hidden.
    emit_thick_wall_slab(xc - thick_half, xc + thick_half,
                         wz - HEX_NS / 2, wz,
                         y_base, y_top, wall_def)

  ELSE:  // SE
    xc = wx + DIAG_X
    emit_thick_wall_slab(xc - thick_half, xc + thick_half,
                         wz, wz + HEX_NS / 2,
                         y_base, y_top, wall_def)
```

### draw_thick_curved_wall — 1 m slabs with cylindrical corner posts

```
FUNCTION draw_thick_curved_wall(map, hex, q, r, cy, wx, wz, dir, wall_def, thick_half, y_base, y_top):
  // Wall segment slabs are identical to THICK_FLAT — straight between vertices.
  // Corner posts (cylinders) are emitted by the N-direction call at each junction
  // vertex. NE/SE calls emit the slab only, relying on the N wall to own the post.

  IF dir == N:
    z_c = wz - HEX_NS / 2
    // For curved walls the N slab does NOT extend its x past a/2 to form a square
    // corner block. Instead, the slab ends at the hex vertex (x = wx ± a/2) and
    // a cylindrical post is placed at each vertex where a diagonal wall is present.
    x_left  = wx - a / 2
    x_right = wx + a / 2
    emit_thick_wall_slab(x_left, x_right, z_c - thick_half, z_c + thick_half,
                         y_base, y_top, wall_def)

    // East cylinder post at NE vertex (wx + a/2, z_c)
    n_nbr = get_hex(map, q, r-1, cy)
    IF hex.wall_ne != OPEN OR (n_nbr != NULL AND n_nbr.wall_se != OPEN):
      emit_cylinder_post(wx + a / 2, z_c, thick_half, y_base, y_top, wall_def.surface)

    // West cylinder post at NW vertex (wx - a/2, z_c)
    nw_nbr = get_hex(map, q-1, r, cy)
    IF nw_nbr != NULL AND (nw_nbr.wall_ne != OPEN OR nw_nbr.wall_se != OPEN):
      emit_cylinder_post(wx - a / 2, z_c, thick_half, y_base, y_top, wall_def.surface)

  ELSE IF dir == NE:
    xc = wx + DIAG_X
    emit_thick_wall_slab(xc - thick_half, xc + thick_half,
                         wz - HEX_NS / 2, wz,
                         y_base, y_top, wall_def)
    // No post here — the N wall of this hex owns the NE vertex post.
    // The midpoint vertex (wz) is shared with the SE wall and owned by the SE hex's N wall.

  ELSE:  // SE
    xc = wx + DIAG_X
    emit_thick_wall_slab(xc - thick_half, xc + thick_half,
                         wz, wz + HEX_NS / 2,
                         y_base, y_top, wall_def)
    // No post here — owned by the N walls of adjacent hexes.
```

### emit_cylinder_post — cylindrical corner post

```
// Approximate a vertical cylinder of radius r centred at (cx, cz),
// running from y_base to y_top, using N_CYL_SEGS rectangular quads.
// The cap is a regular polygon with N_CYL_SEGS sides.

FUNCTION emit_cylinder_post(cx, cz, r, y_base, y_top, surface):
  FOR i = 0 TO N_CYL_SEGS - 1:
    a0 = 2 * PI * i       / N_CYL_SEGS
    a1 = 2 * PI * (i + 1) / N_CYL_SEGS
    x0 = cx + r * sin(a0);  z0 = cz + r * cos(a0)
    x1 = cx + r * sin(a1);  z1 = cz + r * cos(a1)
    // Side quad — outward-facing (vertices in CCW order viewed from outside)
    emit_quad([
      (x0, y_base, z0),
      (x1, y_base, z1),
      (x1, y_top,  z1),
      (x0, y_top,  z0)
    ], surface)

  // Top cap polygon
  cap_verts = [(cx + r * sin(2*PI*i/N_CYL_SEGS),
                y_top,
                cz + r * cos(2*PI*i/N_CYL_SEGS))
               FOR i = 0 TO N_CYL_SEGS - 1]
  emit_polygon(cap_verts, surface)
```

### emit_thick_wall_slab — slab with end caps

```
// Like emit_wall_slab but also emits end-cap faces on the short sides when
// the wall is thick enough that the end faces are cosmetically significant.
// End caps are suppressed when another wall slab or cylinder post abuts that end.
//
// For THICK_FLAT the caller passes emit_end_caps = true; the n_wall_x_extents
// logic has already extended the slab to cover corner areas, so end caps on
// the diagonal walls are only needed at free (open) ends.

FUNCTION emit_thick_wall_slab(x0, x1, z0, z1, y_base, y_top, wall_def):
  // Identical to emit_wall_slab — determines ew_wall from axis ratio, then:
  mat = wall_def.surface

  IF wall_def.body == HALF_HEIGHT:
    y_top = y_base + (y_top - y_base) * 0.5

  ew_wall = (z1 - z0) <= (x1 - x0)

  IF ew_wall:
    emit_quad([(x0,y_base,z1),(x1,y_base,z1),(x1,y_top,z1),(x0,y_top,z1)], mat)  // south face
    emit_quad([(x1,y_base,z0),(x0,y_base,z0),(x0,y_top,z0),(x1,y_top,z0)], mat)  // north face
    // East end cap
    emit_quad([(x1,y_base,z0),(x1,y_base,z1),(x1,y_top,z1),(x1,y_top,z0)], mat)
    // West end cap
    emit_quad([(x0,y_base,z1),(x0,y_base,z0),(x0,y_top,z0),(x0,y_top,z1)], mat)
  ELSE:
    emit_quad([(x0,y_base,z0),(x0,y_base,z1),(x0,y_top,z1),(x0,y_top,z0)], mat)  // west face
    emit_quad([(x1,y_base,z1),(x1,y_base,z0),(x1,y_top,z0),(x1,y_top,z1)], mat)  // east face
    // North end cap
    emit_quad([(x0,y_base,z0),(x1,y_base,z0),(x1,y_top,z0),(x0,y_top,z0)], mat)
    // South end cap
    emit_quad([(x1,y_base,z1),(x0,y_base,z1),(x0,y_top,z1),(x1,y_top,z1)], mat)

  emit_quad([(x0,y_top,z0),(x1,y_top,z0),(x1,y_top,z1),(x0,y_top,z1)], mat)     // top cap

  IF wall_def.aperture.kind != NONE:
    carve_aperture(x0, x1, z0, z1, y_base, y_top, ew_wall, wall_def)

// NOTE: End caps of adjacent wall slabs overlap at corners for THICK_FLAT.
// The overlapping internal geometry is never visible; no trimming is required.
// For THICK_CURVED the cylinder post replaces the corner area — suppress end
// caps on NE/SE slabs at the vertex end (z = wz − HEX_NS/2 for NE), since
// the cylinder post covers that face.
```

---

## Slope Face (Mode A Geometry)

```
// Emit a slanted quad bridging the 16 cm transition zone between two surfaces
// at different heights. The quad connects the inner edge of the higher surface
// to the inner edge of the lower surface across the wall-thickness gap.
// Textured with the higher hex's material.
//
// Convention: "this" hex is always to the south (for N) or west (for NE/SE).
// y_this and y_nbr are the absolute world y-coordinates of the two surfaces.

FUNCTION emit_slope_face(dir, wx, wz, h_this, h_nbr, material):
  y_this = h_this * H_UNIT
  y_nbr  = h_nbr  * H_UNIT

  IF dir == N:
    // E-W gap at z_c = wz − HEX_NS/2.
    // South surface (this hex) ends at z_c + WALL_HALF.
    // North surface (neighbour)  ends at z_c − WALL_HALF.
    z_c = wz - HEX_NS / 2
    x0  = wx - a / 2
    x1  = wx + a / 2
    emit_quad([
      (x0, y_this, z_c + WALL_HALF),
      (x1, y_this, z_c + WALL_HALF),
      (x1, y_nbr,  z_c - WALL_HALF),
      (x0, y_nbr,  z_c - WALL_HALF)
    ], material)

  ELSE IF dir == NE:
    // N-S gap at x_c = wx + DIAG_X; z ∈ [wz − HEX_NS/2, wz].
    // West surface (this hex) ends at x_c − WALL_HALF.
    // East surface (NE neighbour) ends at x_c + WALL_HALF.
    xc   = wx + DIAG_X
    z_top = wz - HEX_NS / 2
    z_bot = wz
    emit_quad([
      (xc - WALL_HALF, y_this, z_top),
      (xc - WALL_HALF, y_this, z_bot),
      (xc + WALL_HALF, y_nbr,  z_bot),
      (xc + WALL_HALF, y_nbr,  z_top)
    ], material)

  ELSE:  // SE
    // N-S gap at x_c = wx + DIAG_X; z ∈ [wz, wz + HEX_NS/2].
    xc    = wx + DIAG_X
    z_top = wz
    z_bot = wz + HEX_NS / 2
    emit_quad([
      (xc - WALL_HALF, y_this, z_top),
      (xc - WALL_HALF, y_this, z_bot),
      (xc + WALL_HALF, y_nbr,  z_bot),
      (xc + WALL_HALF, y_nbr,  z_top)
    ], material)
```

---

## Wall Slab Emission

```
// Emit a rectangular wall slab from a WallDef palette entry.
// wall_def is the resolved WallDef; palette lookup happens in draw_wall().
// The slab occupies x ∈ [x0,x1], z ∈ [z0,z1], y ∈ [y_base,y_top].
// The thin axis (≈ 16 cm) determines facing direction automatically.

FUNCTION emit_wall_slab(x0, x1, z0, z1, y_base, y_top, wall_def):
  mat     = wall_def.surface
  ew_wall = (z1 - z0) <= (x1 - x0)   // true = E-W slab (wall_n), false = N-S (wall_ne/se)

  // Adjust top for half-height walls before emitting any geometry.
  IF wall_def.body == HALF_HEIGHT:
    y_top = y_base + (y_top - y_base) * 0.5

  IF ew_wall:
    emit_quad([(x0,y_base,z1),(x1,y_base,z1),(x1,y_top,z1),(x0,y_top,z1)], mat)  // south
    emit_quad([(x1,y_base,z0),(x0,y_base,z0),(x0,y_top,z0),(x1,y_top,z0)], mat)  // north
  ELSE:
    emit_quad([(x0,y_base,z0),(x0,y_base,z1),(x0,y_top,z1),(x0,y_top,z0)], mat)  // west
    emit_quad([(x1,y_base,z1),(x1,y_base,z0),(x1,y_top,z0),(x1,y_top,z1)], mat)  // east

  emit_quad([(x0,y_top,z0),(x1,y_top,z0),(x1,y_top,z1),(x0,y_top,z1)], mat)     // top cap

  // Cut aperture into the solid faces if one is defined.
  IF wall_def.aperture.kind != NONE:
    carve_aperture(x0, x1, z0, z1, y_base, y_top, ew_wall, wall_def)
```

### Aperture Carving

```
// Replace part of the wall face with a framed door, window, or arch opening.
// Aperture position and size are u8 fractions (0=0 %, 255=100 %) of the face.

FUNCTION carve_aperture(x0, x1, z0, z1, y_base, y_top, ew_wall, wall_def):
  ap      = wall_def.aperture
  wall_h  = y_top - y_base

  // Face extent along the wall's long axis.
  face_w  = IF ew_wall THEN (x1 - x0) ELSE (z1 - z0)
  face_lo = IF ew_wall THEN x0 ELSE z0

  // Resolve u8 fractions to world units.
  ap_w    = face_w * (ap.width    / 255.0)
  ap_h    = wall_h * (ap.height   / 255.0)
  ap_cx   = face_lo + face_w * (ap.x_center / 255.0)
  ap_sill = y_base  + wall_h * (ap.sill / 255.0)      // sill height (0 for doors)
  ap_lo   = ap_cx - ap_w / 2.0
  ap_hi   = ap_cx + ap_w / 2.0
  ap_ybot = ap_sill
  ap_ytop = ap_sill + ap_h

  // Emit four solid strips around the opening (left, right, lintel, sill).
  // Each strip uses the wall body material.
  emit_wall_strips(x0, x1, z0, z1, y_base, y_top,
                   ap_lo, ap_hi, ap_ybot, ap_ytop, ew_wall, wall_def.surface)

  // Emit the frame border inset into the aperture depth.
  IF ap.frame.thickness > 0:
    frame_inset = WALL_HALF * (ap.frame.thickness / 255.0)
    emit_frame_border(ap_lo, ap_hi, ap_ybot, ap_ytop, frame_inset,
                      ew_wall, x0, x1, z0, z1, ap.frame.surface)

  // Apply curved or pointed head above ap_ytop (arches, round tops, etc.).
  IF ap.shape != RECT:
    emit_aperture_head(ap_lo, ap_hi, ap_ytop, ap_w, ap.shape, ew_wall, wall_def.surface)

  // Fill the opening based on aperture kind.
  SWITCH ap.kind:
    DOOR:    emit_door_leaf   (ap_lo, ap_hi, ap_ybot, ap_ytop, ew_wall, ap.door)
    WINDOW:  emit_window_panes(ap_lo, ap_hi, ap_ybot, ap_ytop, ew_wall, ap.window)
    OPENING: PASS             // permanently open — no fill geometry


FUNCTION emit_door_leaf(lo, hi, y_bot, y_top, ew_wall, door):
  // Emit geometry only when the door is closed (caller checks door_states).
  SWITCH door.style:
    SINGLE:
      emit_leaf_quad(lo, hi, y_bot, y_top, ew_wall, door.surface)
    DOUBLE:
      mid = (lo + hi) / 2.0
      emit_leaf_quad(lo,  mid, y_bot, y_top, ew_wall, door.surface)
      emit_leaf_quad(mid, hi,  y_bot, y_top, ew_wall, door.surface)
    SLIDING:
      emit_leaf_quad(lo, hi, y_bot, y_top, ew_wall, door.surface)
    NONE:
      PASS   // open archway with no leaf


FUNCTION emit_window_panes(lo, hi, y_bot, y_top, ew_wall, win):
  // Divide opening into a panes_x × panes_y grid.
  pane_w = (hi - lo)       / win.panes_x
  pane_h = (y_top - y_bot) / win.panes_y
  FOR px = 0 TO win.panes_x - 1:
    FOR py = 0 TO win.panes_y - 1:
      p_lo  = lo    + px * pane_w
      p_hi  = p_lo  + pane_w
      p_bot = y_bot + py * pane_h
      p_top = p_bot + pane_h
      IF win.glazed:
        emit_glass_quad(p_lo, p_hi, p_bot, p_top, ew_wall)
      // else: open pane — no fill geometry
  IF win.shutter.style != NONE:
    emit_shutters(lo, hi, y_bot, y_top, ew_wall, win.shutter)
```

---

## Hex Surface Polygon

```
// Flat hexagonal surface at world height y.
// Vertices in clockwise order (viewed from above): NE, E, SE, SW, W, NW.
FUNCTION emit_hex_surface(wx, wz, y, material):
  emit_polygon([
    (wx + a/2,  y,  wz - HEX_NS/2),   // NE vertex
    (wx + a,    y,  wz            ),   // E  vertex
    (wx + a/2,  y,  wz + HEX_NS/2),   // SE vertex
    (wx - a/2,  y,  wz + HEX_NS/2),   // SW vertex
    (wx - a,    y,  wz            ),   // W  vertex
    (wx - a/2,  y,  wz - HEX_NS/2)    // NW vertex
  ], material)
```

---

## Item Rendering

Items sit at the centre of their hex, on top of the hex surface, oriented by `item_rotation`.

```
// Called for each hex whose item index != 0, with the resolved ItemDef.
// item_def is looked up via map.item_palette[hex.item] before this call.
FUNCTION draw_item(item_def, item_rotation, wx, wz, floor_y):
  // Convert 24-step rotation to radians clockwise from north.
  // Clockwise-from-north in a right-hand Y-up system = negative rotation around Y.
  angle_rad = -(item_rotation * 15.0 * PI / 180.0)

  // Build a 2D rotation matrix for the XZ plane.
  //   x' =  cos(a) * x + sin(a) * z
  //   z' = -sin(a) * x + cos(a) * z
  // (clockwise when viewed from above)
  FUNCTION rotate_xz(lx, lz) -> (wx_offset, wz_offset):
    RETURN (cos(angle_rad) * lx + sin(angle_rad) * lz,
           -sin(angle_rad) * lx + cos(angle_rad) * lz)

  SWITCH item_def.kind:
    PILLAR:
      // Vertical cylinder or square column at hex centre.
      // Rotationally symmetric; item_rotation has no visual effect.
      draw_pillar_geometry(wx, floor_y, wz)

    TREE:
      // Trunk + canopy billboards at hex centre.
      // Rotationally symmetric; item_rotation has no visual effect.
      draw_tree_geometry(wx, floor_y, wz)

    LADDER:
      // A ladder leans against the wall it faces.
      // item_rotation points toward the wall the ladder is mounted on.
      // The ladder face is offset slightly from centre in that direction.
      LADDER_OFFSET = a / 2 - WALL_HALF   // just inside the wall face
      (dx, dz) = rotate_xz(0, -LADDER_OFFSET)   // local "north" = -z
      draw_ladder_geometry(wx + dx, floor_y, wz + dz, angle_rad)

    NEWEL:
      // Full-height cylinder from floor to ceiling — the axle of a spiral staircase.
      // Radius: a / 2 ≈ 29 cm (stone) or slightly smaller for wood.
      // Height: floor_y to get_ceiling() at this hex.
      NEWEL_RADIUS = a / 2
      y_top = get_ceiling(map, q, r, cy) * H_UNIT
      emit_cylinder_post(wx, wz, NEWEL_RADIUS, floor_y, y_top, item_def.surface)

    ARC_PIVOT:
      // Invisible in play mode. No geometry emitted.
      // The editor renders a crosshair overlay; the renderer skips it entirely.
      RETURN

---

## Stair Rendering

Stair hexes use `emit_hex_surface` for the tread and rely on **slope faces** (Mode A rendering at open wall edges) for the risers — no dedicated riser emitter is needed. The stair kind affects how the tread shape and riser orientation are computed.

### LINEAR stairs

No special rendering beyond `emit_hex_surface` and normal slope faces. The step direction is toward the lowest neighbour; the slope face at that shared edge is the riser.

---

### SPIRAL stairs

```
// Called from draw_building() for each spiral_stair hex in the ring.
// The center newel hex is handled by draw_item() (NEWEL case) — not here.
// Tread = the hex surface itself (emit_hex_surface already called).
// Risers = automatic slope faces at the shared edges between consecutive ring hexes.
// This function only emits the INNER guardrail edge geometry.

FUNCTION draw_spiral_stair_hex(map, hex, q, r, cy, wx, wz):
  // Find the center hex: the non-spiral_stair neighbour shared by all ring hexes.
  // Strategy: find the unique neighbour that appears in the neighbour lists of
  // two adjacent ring hexes and is not itself a spiral_stair hex.
  center = find_spiral_center(map, q, r, cy)
  IF center == NULL: RETURN   // malformed layout — skip

  // Determine angular position of this hex around the center (0–5, clockwise from N).
  dir_to_center = hex_direction_from(q, r, center.q, center.r)
  // dir_to_center is the direction pointing toward center; the ring position is the
  // opposite direction index (0=N,1=NE,2=SE,3=S,4=SW,5=NW).
  ring_pos = (dir_to_center + 3) MOD 6   // opposite direction = facing away from center

  // The inner edge of this hex (the edge facing the center) is always open.
  // The outer edges (the two edges furthest from center) face outward.
  // No special inner-edge geometry: the center hex is solid (newel), so the interior
  // of the ring looks like a stone column — no gap to fill.

  // The two lateral edges (adjacent ring hex edges) have height delta = 1 unit
  // and wall = OPEN, so slope faces (risers) are emitted automatically by draw_wall().
```

```
// Locate the center of a spiral staircase given one of its ring hexes.
// Returns the hex at the centre (bearing a NEWEL item), or NULL if not found.
FUNCTION find_spiral_center(map, q, r, cy) -> Hex or NULL:
  FOR EACH dir IN [N, NE, SE, S, SW, NW]:
    (nq, nr) = axial_neighbour(q, r, dir)
    nbr = get_hex(map, nq, nr, cy)
    IF nbr == NULL: CONTINUE
    IF nbr.material.category != spiral_stair:
      // Check that this candidate is not a spiral_stair — it is the center.
      item = map.item_palette[nbr.item]
      IF item.kind == NEWEL: RETURN nbr
  RETURN NULL
```

**How the geometry emerges:**

1. The center hex surface (`emit_hex_surface`) renders the floor of the newel column base.
2. The `NEWEL` item on the center hex renders the column cylinder from floor to ceiling.
3. Each ring hex surface renders a flat tread at its absolute height.
4. Slope faces between consecutive ring hexes (height delta = 1) form the 16 cm risers.
5. The outer wall of each ring hex carries a `fence_iron` or `fence_wood` wall for the guardrail (set by the DM).

No wedge-shape approximation is needed: the hexagonal tread surface is already trapezoidal (wider at the outer edge, narrower at the inner edge), naturally matching the wedge form of a real spiral stair tread.

---

### GRAND_ARC stairs

```
// Called for each grand_arc_stair hex.
// The ARC_PIVOT item is located, then the hex surface is replaced by a fan-wedge
// tread — a radially-oriented trapezoid that visually fills the arc sector correctly
// rather than using the default hexagonal surface.

FUNCTION draw_grand_arc_stair_hex(map, hex, q, r, cy, wx, wz):
  floor_y = hex.height * H_UNIT

  // Locate the ARC_PIVOT item in this cy layer.
  pivot = find_arc_pivot(map, q, r, cy)
  IF pivot == NULL:
    // Fallback: render as a plain stair hex with emit_hex_surface.
    emit_hex_surface(wx, wz, floor_y, hex.material)
    RETURN

  (px, pz)  = world_pos(pivot.q, pivot.r)    // pivot world position
  inner_r   = IF pivot.item_def.arc_radius > 0.0
              THEN pivot.item_def.arc_radius
              ELSE distance(wx, wz, px, pz)   // auto-radius from this hex's distance

  outer_r   = inner_r + HEX_NS               // one hex deeper

  // Angular sector from item_rotation on THIS hex.
  // item_rotation 0–23 = 0°–345°; sector width = 60° = 4 rotation steps.
  sector_angle     = hex.item_rotation * 15.0 * PI / 180.0   // centre of sector
  sector_half      = PI / 3.0 / 2.0                           // 30° = half of 60° sector
  angle_lo         = sector_angle - sector_half
  angle_hi         = sector_angle + sector_half

  // Emit a radial fan-wedge as two quads (inner half and outer half)
  // approximating the trapezoidal arc sector.
  emit_arc_tread(px, pz, inner_r, outer_r, angle_lo, angle_hi, floor_y, hex.material)
```

```
// Emit a trapezoidal arc-sector tread.
// The sector spans angle_lo to angle_hi (radians, clockwise from N) at the given radii.
// Approximated as two quads sharing the midpoint arc.

FUNCTION emit_arc_tread(px, pz, inner_r, outer_r, angle_lo, angle_hi, y, material):
  mid_r = (inner_r + outer_r) / 2.0

  // Four corners of the inner trapezoid and four of the outer trapezoid.
  //   Angles: clockwise from N, so x = r * sin(a), z = r * cos(a)
  FUNCTION arc_pt(r, angle) -> (x, z):
    RETURN (px + r * sin(angle), pz + r * cos(angle))  // note: z is south=+

  // Wait: in our coordinate system, z is south (positive south).
  // Clockwise from north means angles increase eastward.
  // North is -z direction. So: x = r * sin(a), z = -r * cos(a).
  FUNCTION arc_pt(r, angle) -> (x, z):
    RETURN (px + r * sin(angle), pz - r * cos(angle))

  // Corners
  (xi0, zi0) = arc_pt(inner_r, angle_lo)
  (xi1, zi1) = arc_pt(inner_r, angle_hi)
  (xo0, zo0) = arc_pt(outer_r, angle_lo)
  (xo1, zo1) = arc_pt(outer_r, angle_hi)
  (xm0, zm0) = arc_pt(mid_r,   angle_lo)
  (xm1, zm1) = arc_pt(mid_r,   angle_hi)

  // Inner quad (inner edge to midpoint arc)
  emit_quad([(xi0,y,zi0), (xm0,y,zm0), (xm1,y,zm1), (xi1,y,zi1)], material)
  // Outer quad (midpoint arc to outer edge)
  emit_quad([(xm0,y,zm0), (xo0,y,zo0), (xo1,y,zo1), (xm1,y,zm1)], material)

  // Riser at the downhill edge (angle_lo side) — only if adjacent arc hex is lower.
  // The riser faces outward from the arc (tangential), perpendicular to the radial axis.
  // Height delta is 1 unit = H_UNIT. Emit a vertical quad.
  emit_arc_riser(px, pz, inner_r, outer_r, angle_lo, y, y - H_UNIT, material)
```

```
// Emit the vertical riser face at the leading edge of an arc tread.
FUNCTION emit_arc_riser(px, pz, inner_r, outer_r, angle, y_top, y_bot, material):
  (xi, zi) = (px + inner_r * sin(angle), pz - inner_r * cos(angle))
  (xo, zo) = (px + outer_r * sin(angle), pz - outer_r * cos(angle))
  emit_quad([
    (xi, y_bot, zi),
    (xo, y_bot, zo),
    (xo, y_top, zo),
    (xi, y_top, zi)
  ], material)
```

```
// Locate the nearest ARC_PIVOT item in the same cy layer.
// Search radius: 8 hexes (sufficient for even very large palace staircases).
FUNCTION find_arc_pivot(map, q, r, cy) -> PivotRef or NULL:
  best      = NULL
  best_dist = 999
  FOR dq = -8 TO 8:
    FOR dr = -8 TO 8:
      candidate = get_hex(map, q + dq, r + dr, cy)
      IF candidate == NULL: CONTINUE
      item = map.item_palette[candidate.item]
      IF item.kind != ARC_PIVOT: CONTINUE
      d = sqrt(dq*dq + dr*dr)
      IF d < best_dist:
        best      = PivotRef{ q: q+dq, r: r+dr, item_def: item }
        best_dist = d
  RETURN best
```

**How the geometry emerges:**

1. The `ARC_PIVOT` hex renders no play-mode geometry (pivot item is invisible).
2. Each `grand_arc_stair` hex emits a fan-wedge tread aligned with the arc sector stored in `item_rotation`.
3. Risers at the leading edge of each tread are explicit arc-riser quads (not slope faces), because slope faces assume rectangular tread geometry.
4. The outer perimeter of the staircase (the outermost arc row) typically has a balustrade wall on the outer edge hexes.
5. A double palace staircase is two independent `GRAND_ARC` clusters (each with its own `ARC_PIVOT`) placed symmetrically around the building's axis.

---

## Multi-Story and Roof Behaviour

No special roof rendering function is needed. The main `draw_building()` loop handles
roofs and upper floors identically to ground floors:

**Roof surface** — `emit_hex_surface()` is called for every non-open roof hex.
Its absolute height gives the world-space elevation of the tile surface.

**Roof slope** — Adjacent roof hexes at different heights with `wall = open` trigger
`emit_slope_face()`, creating the slanted geometry of the visible roof face.
The slope angle is determined by the height delta divided by the 16 cm wall zone width.

**Eave edge** — A roof hex adjacent to an exterior (missing or open) hex produces a
slope face between the roof height and the exterior height (typically ground level).
This slope face is the visible eave profile and underside.

**Gable ends** — Ground-layer walls along the gable column have `wall_type != OPEN`.
`get_ceiling()` returns the varying absolute height of the roof hex directly above,
so the wall height tapers to follow the roof slope automatically — no special gable code.

**Multi-story** — Pass all `cy` chunks for the building to `draw_building()`. Each floor
is a ceiling for the room below (the hex surface is visible from beneath as the ceiling)
and a floor for the room above (the same surface is walked on from above).
Walls at each `cy` extend from that floor up to `get_ceiling()`, which reads the
`cy + 1` hex height, giving the correct storey height at every level.

---

## Known Limitations

- **Door and window apertures** (`carve_door`, `carve_window`) are not expanded here.
  They require the wall slab to be split into frame strips around a central opening.
- **Fence** wall type needs custom geometry (posts and rails, not a solid slab).
- **Pillar** item is not rendered in this pseudocode (a column quad at hex center).
- **Oblique lighting** of slope faces benefits from computing the quad normal from
  the cross product of its two edge vectors rather than assuming a cardinal direction.
- **THICK_CURVED end cap suppression** — the note in `emit_thick_wall_slab` describes
  suppressing the vertex-end end cap when a cylinder post is present. The condition
  (check adjacent wall body type at that vertex) is omitted here for brevity; an
  implementation should check whether a THICK_CURVED wall meets the same vertex and
  skip the end cap face that would be hidden inside the cylinder.
- **BATTLEMENT crenellations** on `castle_wall` — the top-cap emitter needs to alternate
  solid merlon and open crenel segments along the wall length. Not expanded here; treat
  the top cap as a solid slab until crenellation geometry is added.
- **ROAD_GUIDE editor overlay** — the translucent editor visualisation for guide walls
  is a UI concern, not described in this rendering pseudocode.
- **SPIRAL stair outer guardrail** — the fence or half-height wall on the outer ring edges
  is placed by the DM as ordinary wall data; no auto-generation is described here.
- **GRAND_ARC riser at outer edge** — `emit_arc_riser` is called only at `angle_lo` (the
  downhill face). At `angle_hi` (the uphill face, shared with the next step) the riser is
  owned by that neighbour hex and must not be double-emitted; ownership convention mirrors
  the N/NE/SE wall ownership rule.
- **GRAND_ARC sector width** — the pseudocode assumes a 60° sector (4 item_rotation steps)
  per hex. Narrower arcs (more hexes per revolution) or wider arcs (fewer hexes) require
  adjusting `sector_half` based on the actual angular span derived from adjacent arc hexes.
- **Arc tread z-direction sign** — the `arc_pt` helper uses `z = -r * cos(angle)` because
  north is the −z axis in world space. Verify sign conventions match the engine's coordinate
  system before implementing.
