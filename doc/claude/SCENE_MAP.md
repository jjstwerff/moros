# SCENE_MAP — Map Format Design

A hex-based scene format for Moros, supporting multi-layer terrain, multi-story structures, and multi-chunk maps.

---

## Overview

Maps are composed of **chunks** arranged in a 3D grid. Each chunk is a 32×32 grid of **hexes**. Hexes define terrain height, surface material, walls, and items. Multiple vertical layers (`cy`) at the same `(cx, cz)` position stack to form multi-story buildings. Blueprints define reusable house templates that can be stamped in 12 orientations with automatic terrain conforming.

---

## Coordinate System

### Chunk coordinates

Each chunk is identified by integer indices `(cx, cy, cz)` where:
- `cx` — east–west chunk column
- `cz` — north–south chunk row
- `cy` — vertical layer index (0 = ground level; positive = above ground; negative = below ground)

World-space origin of a chunk: `( cx × 32 × hex_ew, cy × layer_height, cz × 32 × hex_ns )`

Multiple chunks may share the same `(cx, cz)` but differ in `cy` — this is the multi-story mechanism. There is no limit on the number of stacked layers.

### Hex coordinates

Each hex within a chunk is addressed by `(hx, hz)` ∈ [0, 31] × [0, 31].

Global hex address: `( cx·32 + hx,  cy,  cz·32 + hz )`

Chunks are stored sparsely; a missing chunk is treated as all-`open` hexes at height 0.

---

## Hex Geometry

Hexes use **pointy-top orientation** — a vertex at north and south, and the flat edges
facing east and west. The addressing is **odd-r offset**: odd rows are shifted half a hex
east.

This section previously described flat-top hexes. That was never what the code did — the
renderer's own corner table puts vertices at top and bottom, and the shipped `hex_grid` and
`hex_field` packages agree. The hex is the same size either way; only the orientation and
the direction names change.

| Property | Value |
|---|---|
| E–W diameter (flat to flat) | ≈ 1.000 m |
| N–S diameter (vertex to vertex) | ≈ 1.155 m |
| Edge length | ≈ 0.577 m |

### The lattice is exact integers

Positions are integer lattice points, not floats. For a hex at `(q, r)`:

```
   centre(q, r) = (k, m) = (2q + (r & 1),  3r)
   world        = (x, y) = (k · s,  m · s / √3)        s = half the E–W diameter
   corners      = (0, ±2), (±1, ±1)                    as (Δk, Δm) from the centre
```

Cell centres satisfy `k ≡ m (mod 2)`. Every centre **and every corner** lands on the
lattice, so there is no epsilon compare and no drift anywhere in the geometry — which is
what makes exact undo, exact diff and drift-free rotation possible.

The six neighbours are **E, W, NE, NW, SE, SW**. There is no north or south neighbour: a
pointy-top hex meets its northern neighbours at the NE and NW edges.

**Corner order is canonical and load-bearing.** `hex_field` numbers corners so that
consecutive indices bound one edge, and downstream code reads corner `i` by index. Do not
introduce a second ordering — see [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § The lattice,
concretely.

### Sub-triangle subdivision

Each hex is divided into **54 equal equilateral sub-triangles**:
1. 6 main triangles radiating from the hex center (one per edge).
2. Each main triangle 3-subdivided into 9 smaller triangles (3 rows: 1 + 3 + 5).

Sub-triangle dimensions:

| Property | Value |
|---|---|
| Sub-triangle side | ≈ 19.2 cm (= edge / 3) |
| Sub-triangle height (top to bottom) | ≈ 16.6 cm (= flat-to-flat diameter / 6) |

The **16 cm height unit** is the resolution step used for wall placement and height transitions.

### Height unit

`height: u16` stores the **absolute world height** of the surface at that hex, measured in sub-triangle height units (≈ 16.6 cm each). All cy layers share the same height reference — a roof hex at height 30 and a ground hex at height 30 are at the same elevation in world space.

- Height 0 = world ground level.
- Height 6 ≈ 1 m.
- Maximum ≈ 10 922 m (u16 max, far beyond practical use).

---

## Chunk Structure

```
Chunk {
  cx:    i32,
  cy:    i32,
  cz:    i32,
  kind:  ChunkKind,
  hexes: [32][32] Hex,       // when kind == FULL
  //  or
  items: [32][32] OverlayHex, // when kind == ITEM_OVERLAY
}

ChunkKind: FULL | ITEM_OVERLAY
```

- **FULL** — default. All hex fields are active: height, material, walls, and item.
- **ITEM_OVERLAY** — item-only layer. Uses `OverlayHex` layout (see below).

Chunk footprint in world units: ≈ 37.0 m (E–W) × 32.0 m (N–S).

### Item overlay layers

An `ITEM_OVERLAY` chunk places extra items on hexes that already have a primary
item in a `FULL` chunk. It carries no terrain, walls, or floor — only positioned
items. This allows layered props such as a fallen beam resting on rubble, a
skeleton beside a broken chest, or vines draped over a gravestone.

#### OverlayHex structure

The overlay reuses the same 8-byte slot as `Hex` but repurposes the terrain and
wall bytes as sub-hex positioning. `item` and `item_rotation` stay at the same
byte offsets.

```
OverlayHex {
  offset_x:      i8,    // E–W displacement from hex centre in cm (±127 cm)
  offset_z:      i8,    // N–S displacement from hex centre in cm (±127 cm)
  offset_y:      u8,    // vertical offset above ground surface in cm (0–255 cm)
  item:          u8,    // ItemPalette index (0 = empty, skip)
  item_rotation: u8,    // bits 0–4: rotation 0–23; bit 5: spawn_flag; bit 6: waypoint_flag
  flags:         u8,    // bit 0: tint_aged (weathered colour shift)
                        // bits 1–7: reserved (0)
  _reserved_0:   u8,    // must be 0
  _reserved_1:   u8,    // must be 0
}
```

**Byte-level correspondence with Hex:**

| Byte | Hex field | OverlayHex field | Purpose |
|---|---|---|---|
| 0 | `height` low | `offset_x` | E–W position within hex |
| 1 | `height` high | `offset_z` | N–S position within hex |
| 2 | `material` | `offset_y` | Height above ground surface |
| 3 | `item` | `item` | Same — item palette index |
| 4 | `item_rotation` | `item_rotation` | Same — rotation + flags |
| 5 | `wall_n` | `flags` | Appearance modifiers |
| 6 | `wall_ne` | `_reserved_0` | — |
| 7 | `wall_se` | `_reserved_1` | — |

**Offset coordinates:**

All three offsets use **centimetres** as the unit. The hex centre is (0, 0, 0).

- `offset_x`: i8, range ±127 cm. The hex E–W half-width is ≈ 57 cm, so values
  beyond ±57 push the item visually into a neighbouring hex. This is intentional
  — a fallen beam can span across a hex boundary.
- `offset_z`: i8, range ±127 cm. The hex N–S half-width is ≈ 50 cm.
- `offset_y`: u8, range 0–255 cm. Height above the ground surface of the
  corresponding `FULL` hex below. 0 = resting on ground. A skeleton on a 50 cm
  rubble pile uses `offset_y = 50`.

**Rules:**

1. An `ITEM_OVERLAY` chunk must share the same `(cx, cz)` as an existing `FULL`
   chunk. Multiple overlays on the same full chunk are ordered by position in the
   chunk list — each adds another item layer.
2. Items inherit the **ground height** from the `FULL` chunk at the same
   `(hx, hz)`. The rendered world-space height is `full_hex.height + offset_y`.
3. Overlay hexes with `item == 0` are skipped — no storage or render cost.
4. `spawn_flag` and `waypoint_flag` work normally. A spawn point or NPC waypoint
   may reference an overlay hex.
5. Pathfinding, collision, and line-of-sight use only `FULL` chunks. Overlay items
   are visual and interactive props; they do not block movement or alter terrain.
6. The `tint_aged` flag in `flags` tells the renderer to shift the item's colour
   toward grey-brown and reduce saturation, giving a weathered or decayed look
   without needing separate palette entries.
7. The editor shows overlay items with a dashed selection outline to distinguish
   them from the primary item layer.

**Example — ruin hex with layered debris:**

| Layer | item | offset_x | offset_z | offset_y | Effect |
|---|---|---|---|---|---|
| FULL (cy=0) | `rubble_pile` | — | — | — | Ground terrain + primary debris at hex centre |
| ITEM_OVERLAY | `fallen_beam` | −30 | 10 | 40 | Beam shifted 30 cm west, 10 cm north, resting 40 cm up on rubble |
| ITEM_OVERLAY | `skeleton` | 25 | −20 | 0 | Bones 25 cm east, 20 cm south, on ground beside the pile |

---

## Hex Structure

```
Hex {
  height:        u16,   // absolute world height in height units (≈ 16 cm each)
  material:      u8,    // MaterialPalette index  (0 = open/void)
  item:          u8,    // ItemPalette index       (0 = none)
  item_rotation: u8,    // bits 0–4: rotation 0–23 (15° per step CW from north)
                        // bit  5:   spawn_flag    — hex has a SpawnPoint entry
                        // bit  6:   waypoint_flag — hex has one or more NpcWaypoint entries
                        // bit  7:   reserved (always 0)
  wall_n:        u8,    // WallPalette index for N edge   (0 = open)
  wall_ne:       u8,    // WallPalette index for NE edge  (0 = open)
  wall_se:       u8,    // WallPalette index for SE edge  (0 = open)
}
```

Total hex size: 8 bytes. The `item_rotation` byte uses only 5 bits for direction (values 0–23 fit in 5 bits; bit pattern max = 0b10111 = 23). The three high bits are permanently available for non-rotation data without any size increase.

Helper accessors hide the packing:
```
rotation(hex)  = hex.item_rotation & 0x1F       // bits 0–4
spawn_flag(hex)    = (hex.item_rotation >> 5) & 1   // bit 5
waypoint_flag(hex) = (hex.item_rotation >> 6) & 1   // bit 6
```

Each hex owns **three of its six edges**; the other three are read from neighbours, so every
edge is stored exactly once.

**The three field names are misleading, and two of them are simply wrong.** Read from the
renderer's corner indices, the stored edges are **NW, NE and E** — the upper-and-eastern
half of the hex:

| Field | Corners it spans | Edge it actually is |
|---|---|---|
| `wall_n` | top-left → top | **NW** |
| `wall_ne` | top → top-right | NE ✓ |
| `wall_se` | top-right → bottom-right | **E** |

The *scheme* is sound — `{NW, NE, E}` is a valid partition, since each hex's SE, SW and W
edges are exactly its neighbours' NW, NE and E — but the names are left over from the
flat-top reading. The remaining three edges are read as:

| Edge | Source |
|---|---|
| SE | SE neighbour's stored NW edge (`wall_n`) |
| SW | SW neighbour's stored NE edge (`wall_ne`) |
| W | W neighbour's stored E edge (`wall_se`) |

Renaming the fields is [moros#3](https://github.com/jjstwerff/moros/issues/3); until then,
trust this table over the identifiers.

---

## Palette System

Rather than fixed enumerations, materials, walls, and items are defined in **map-level palettes**. The hex stores a `u8` index into each palette (0–255), keeping the hex struct compact while allowing up to 256 distinct definitions with arbitrary parameters. Palette index 0 is always reserved as the null/open value for each palette.

Well-known indices 1–15 are standardised across all maps for common types (listed in the tables below). Indices 16–255 are map-specific and defined in the map's palette arrays.

---

### Material palette

```
MaterialDef {
  name:       string,
  category:   MaterialCategory,   // how the renderer and game logic treat this surface
  stair_kind: StairKind,          // only meaningful when category == stair
  texture:    u16,                // texture atlas slot
  tint:       RGB,                // colour multiplied over the texture
  flags:      MaterialFlags,
}

MaterialCategory: void | terrain | floor | stair | roof | water

// Determines how stair treads are shaped and oriented.
// Ignored unless category == stair.
StairKind: LINEAR | SPIRAL | GRAND_ARC

MaterialFlags {
  walkable:   bool,   // characters can stand here
  swimmable:  bool,   // characters can swim here (implies water)
  climbable:  bool,   // stair surfaces; slope angle from height delta
  slippery:   bool,   // movement penalty
  loud:       bool,   // footsteps are audible (stone, wood)
}
```

**Well-known material indices:**

| Index | Name | Category | Notes |
|---|---|---|---|
| 0 | `open` | void | No surface — reserved null value |
| 1 | `grass` | terrain | |
| 2 | `mud` | terrain | slippery |
| 3 | `road` | terrain | loud |
| 4 | `water` | water | swimmable |
| 5 | `wood_floor` | floor | loud |
| 6 | `stone_tiles` | floor | loud |
| 7 | `stone_stair` | stair | climbable |
| 8 | `wood_stair` | stair | climbable, loud |
| 9 | `roof_tiles` | roof | |
| 10 | `gravel` | terrain | loud |
| 11 | `sand` | terrain | slippery |
| 12 | `marble` | floor | loud, slippery |
| 13 | `dirt_floor` | floor | |
| 14 | `ice` | terrain | slippery |
| 15 | `thatch_roof` | roof | |
| 16 | `spiral_stair` | stair (SPIRAL) | loud |
| 17 | `grand_arc_stair` | stair (GRAND_ARC) | loud |
| 18 | `cracked_stone` | floor | loud |
| 19 | `mossy_stone` | floor | slippery |
| 20 | `scorched_wood` | floor | loud |
| 21 | `rubble_floor` | terrain | loud |

Well-known material indices now run 0–21. Indices 22–255 are map-specific.

---

### Wall palette

A `WallDef` combines the structural body of a wall with an optional aperture (door, window, or arch). Index 0 always means no wall (open/terrain transition).

```
WallDef {
  name:      string,
  body:      WallBody,
  surface:   WallSurface,
  aperture:  ApertureDef,   // kind = NONE if no cut-out
  thickness: f32,           // full wall depth in metres; 0.0 = default thin wall (≈ 16.6 cm)
}

// Shape of the wall structure itself
WallBody: SOLID | HALF_HEIGHT | FENCE | BATTLEMENT | THICK_FLAT | THICK_CURVED | ROAD_GUIDE

// Surface appearance of the wall mass
WallSurface {
  base:    WallBase,   // what the wall is built from
  texture: u16,        // texture atlas slot
  tint:    RGB,
}

WallBase: WOOD | HALF_TIMBER | BRICKS | STONE | PLASTER | IRON | WATTLE | GLASS_BLOCK
```

#### ApertureDef — door and window cut-outs

All size and position values are stored as `u8` fractions of the wall face (0 = 0 %, 255 = 100 %). This scales correctly across both E-W flat walls (full edge width ≈ 57 cm) and N-S diagonal walls (half-edge segment ≈ 50 cm).

```
ApertureDef {
  kind:      ApertureKind,    // what kind of cut-out
  shape:     ApertureShape,   // outline of the opening
  x_center:  u8,  // horizontal centre of opening (128 = centred on wall face)
  width:     u8,  // opening width  as fraction of wall face width
  height:    u8,  // opening height as fraction of wall height
  sill:      u8,  // sill height from floor as fraction of wall height (0 for doors)
  frame:     FrameDef,
  door:      DoorLeafDef,     // used only when kind == DOOR
  window:    WindowPaneDef,   // used only when kind == WINDOW
}

ApertureKind:  NONE | DOOR | WINDOW | OPENING

// Profile of the top of the opening
ApertureShape: RECT | ARCH | ROUND_TOP | POINTED_ARCH | CIRCULAR
```

Note: **diagonal (NE/SE) wall segments are 50 cm wide**. A door requires at least 50 % of the face width (width ≥ 128) to be passable. Doors on diagonal walls are only usable in the face-on orientation; they are permissible but tight.

#### FrameDef

```
FrameDef {
  thickness: u8,         // border width as fraction of opening size (0 = no frame)
  surface:   WallSurface,
}
```

#### DoorLeafDef

```
DoorLeafDef {
  style:    DoorStyle,     // how the door moves
  hinge:    HingeSide,     // which side the hinge is on (from interior)
  surface:  WallSurface,   // material of the door leaf
  step:     bool,          // raised threshold step on the exterior
}

DoorStyle: SINGLE | DOUBLE | SLIDING | NONE   // NONE = open archway, no leaf
HingeSide: LEFT | RIGHT                        // relative to the interior face
```

Door open/closed state is runtime data, not map data. It lives in a sparse map keyed on the edge address:

```
door_states: Map<(global_q, global_r, cy, dir), bool>
```

#### WindowPaneDef

```
WindowPaneDef {
  panes_x: u8,          // horizontal pane divisions (1–4)
  panes_y: u8,          // vertical pane divisions (1–4)
  glazed:  bool,        // true = glass fill, false = open aperture
  shutter: ShutterDef,
}

ShutterDef {
  style: ShutterStyle,  // NONE | WOOD | IRON
  side:  ShutterSide,   // INTERIOR | EXTERIOR | BOTH
}
```

**Well-known wall indices:**

| Index | Name | Body | Base | Thickness | Aperture |
|---|---|---|---|---|---|
| 0 | `open` | — | — | — | — (reserved null) |
| 1 | `wood` | SOLID | WOOD | 0.0 | NONE |
| 2 | `half_timber` | SOLID | HALF_TIMBER | 0.0 | NONE |
| 3 | `bricks` | SOLID | BRICKS | 0.0 | NONE |
| 4 | `stone` | SOLID | STONE | 0.0 | NONE |
| 5 | `plaster` | SOLID | PLASTER | 0.0 | NONE |
| 6 | `iron` | SOLID | IRON | 0.0 | NONE |
| 7 | `fence_wood` | FENCE | WOOD | 0.0 | NONE |
| 8 | `fence_iron` | FENCE | IRON | 0.0 | NONE |
| 9 | `half_height_stone` | HALF_HEIGHT | STONE | 0.0 | NONE |
| 10 | `wood_door` | SOLID | WOOD | 0.0 | DOOR, RECT, centred, SINGLE |
| 11 | `stone_door` | SOLID | STONE | 0.0 | DOOR, RECT, centred, SINGLE |
| 12 | `arch_opening` | SOLID | STONE | 0.0 | OPENING, ARCH, centred |
| 13 | `wood_window` | SOLID | WOOD | 0.0 | WINDOW, RECT, 2×2 panes, glazed |
| 14 | `stone_window` | SOLID | STONE | 0.0 | WINDOW, ARCH, 1×1, glazed |
| 15 | `pointed_arch` | SOLID | STONE | 0.0 | OPENING, POINTED_ARCH, centred |
| 16 | `city_wall` | THICK_FLAT | STONE | 1.0 m | NONE |
| 17 | `castle_wall` | THICK_FLAT | STONE | 1.0 m | NONE — use BATTLEMENT crenellations via top material |
| 18 | `round_tower` | THICK_CURVED | STONE | 1.0 m | NONE |
| 19 | `curved_city_wall` | THICK_CURVED | STONE | 1.0 m | NONE |
| 20 | `path_guide` | ROAD_GUIDE | — | 1.0 m | NONE — 1 m narrow path |
| 21 | `road_guide` | ROAD_GUIDE | — | 2.0 m | NONE — 2 m cobblestone road |
| 22 | `wide_road_guide` | ROAD_GUIDE | — | 3.0 m | NONE — 3 m avenue / carriage road |
| 23 | `track_guide` | ROAD_GUIDE | — | 4.0 m | NONE — 4 m rail or canal |

Well-known indices now run 0–23. Indices 24–255 are map-specific.

---

### Item palette

`item` in the hex is a `u8` palette index. Index 0 = no item.

```
ItemDef {
  name:       string,
  kind:       ItemKind,
  model:      u16,         // 3D model reference
  surface:    WallSurface, // primary material
  symmetric:  bool,        // true = item_rotation has no visual effect
  arc_radius: f32,         // inner radius in metres; only used when kind == ARC_PIVOT (0 = auto)
}

ItemKind: PILLAR | TREE | LADDER | FURNITURE | CONTAINER | LIGHT | STATUE | MECHANISM
        | NEWEL | ARC_PIVOT
```

- **NEWEL** — the central column of a spiral staircase. Renders as a full-height cylinder (floor to ceiling) using `emit_cylinder_post`. Rotationally symmetric. The radius is inferred from the well-known size (`a / 2` ≈ 29 cm for stone, slightly smaller for wood).
- **ARC_PIVOT** — invisible marker placed at the mathematical centre of curvature of a `grand_arc_stair` cluster. No visible geometry in play mode; shown as a crosshair in the editor. `arc_radius` stores the inner radius of the staircase arc (distance from this hex to the innermost stair tread, in metres). When `arc_radius == 0` the renderer auto-computes it as the distance to the nearest `grand_arc_stair` hex in the same `cy` layer.

**Well-known item indices:**

*Symmetric = yes means `item_rotation` has no visual effect.*
*Symmetric = no means the item faces the direction encoded in `item_rotation` (facing = the direction a seated/standing person would look, or the direction of access/opening).*

| Index | Name | Kind | Sym | Notes |
|---|---|---|---|---|
| 0 | `none` | — | — | |
| **— Structural —** | | | | |
| 1 | `pillar_stone` | PILLAR | yes | Round stone column |
| 2 | `pillar_wood` | PILLAR | yes | Hewn wood post |
| 3 | `tree` | TREE | yes | Generic tree; trunk + canopy billboards |
| 4 | `ladder_wood` | LADDER | no | Leans against the wall it faces |
| 5 | `ladder_iron` | LADDER | no | As above, iron rungs |
| 6 | `newel_stone` | NEWEL | yes | Spiral stair centre column, stone |
| 7 | `newel_wood` | NEWEL | yes | Spiral stair centre column, wood |
| 8 | `arc_pivot` | ARC_PIVOT | yes | Grand arc stair pivot marker — invisible in play |
| **— Furniture —** | | | | |
| 9 | `table_wood` | FURNITURE | yes | Small square or round table; seats 2–4 |
| 10 | `table_stone` | FURNITURE | yes | Heavy stone slab table; tavern courtyard, dungeon |
| 11 | `table_long` | FURNITURE | no | Long banquet table; facing sets N–S or E–W axis |
| 12 | `chair_wood` | FURNITURE | no | Plain wooden chair |
| 13 | `chair_highback` | FURNITURE | no | Padded highback chair; study, lord's hall |
| 14 | `throne` | FURNITURE | no | Carved stone or wood throne; royalty, rulers |
| 15 | `bench_wood` | FURNITURE | no | Long wooden bench; tavern, garden, courtroom |
| 16 | `bench_stone` | FURNITURE | no | Stone bench; plaza, crypt, dungeon |
| 17 | `stool_wood` | FURNITURE | yes | Low round stool; symmetric |
| 18 | `bed_single` | FURNITURE | no | Single-width bed with frame and linen |
| 19 | `bed_double` | FURNITURE | no | Double-width bed; fills most of a hex |
| 20 | `wardrobe` | FURNITURE | no | Tall wooden wardrobe; faces outward from wall |
| 21 | `bookshelf` | FURNITURE | no | Tall bookshelf; faces outward from wall |
| 22 | `desk` | FURNITURE | no | Writing desk with surface and small drawer |
| 23 | `workbench` | FURNITURE | no | Heavy craftsman's workbench with vice |
| 24 | `weapon_rack` | FURNITURE | no | Wall rack for swords, spears, and shields |
| 25 | `armor_stand` | FURNITURE | no | T-frame stand for displaying armour |
| **— Containers —** | | | | |
| 26 | `chest_wood` | CONTAINER | no | Plain wooden chest; lid opens toward facing direction |
| 27 | `chest_iron` | CONTAINER | no | Iron-bound chest; heavier, lockable |
| 28 | `barrel` | CONTAINER | yes | Upright wooden barrel; ale, oil, or salted goods |
| 29 | `barrel_rack` | CONTAINER | no | Two barrels on a horizontal trestle; cellar, tavern |
| 30 | `crate` | CONTAINER | yes | Nailed wooden crate; cargo, storage |
| 31 | `sack` | CONTAINER | yes | Cloth or leather sack; grain, coal, herbs |
| 32 | `amphora` | CONTAINER | yes | Tall clay jar; wine, olive oil, fish sauce |
| 33 | `cauldron` | CONTAINER | yes | Large iron cauldron; cooking, brewing, or crafting |
| 34 | `spirit_vessel` | CONTAINER | yes | Sealed stone vessel for a captured elemental spirit; ritual use |
| **— Lights —** | | | | |
| 35 | `torch_wall` | LIGHT | no | Wall-mounted iron bracket and torch; faces the wall it is on |
| 36 | `torch_stand` | LIGHT | yes | Iron floor stand with torch; outdoor or hall use |
| 37 | `candle` | LIGHT | yes | Single candle in a holder; table or shelf |
| 38 | `candelabra` | LIGHT | yes | Multi-arm floor candelabra; noble interior |
| 39 | `lantern_hanging` | LIGHT | yes | Lantern on a chain from the ceiling |
| 40 | `lantern_floor` | LIGHT | yes | Hooded floor lantern; guard post, corridor |
| 41 | `campfire` | LIGHT | yes | Open campfire with stones; outdoor scenes |
| 42 | `brazier` | LIGHT | yes | Iron fire-bowl on a tripod; hall, courtyard, dungeon |
| 43 | `hearth` | LIGHT | no | Fireplace alcove with mantle; built against a wall |
| **— Statues and Decorative —** | | | | |
| 44 | `statue_person` | STATUE | no | Human-scale carved figure; civic, funerary, or religious |
| 45 | `statue_animal` | STATUE | no | Animal-people or beast figure; spirit shrine, guild hall |
| 46 | `altar` | STATUE | no | Stone altar slab; shaman shrine, spirit offering site |
| 47 | `gravestone` | STATUE | no | Carved headstone; cemetery or memorial |
| 48 | `monument` | STATUE | yes | Tall obelisk or column; plaza, memorial, white city ruin |
| 49 | `fountain` | MECHANISM | yes | Stone fountain basin with central jet; courtyard, plaza |
| **— Mechanisms —** | | | | |
| 50 | `well` | MECHANISM | yes | Stone well with rope and bucket |
| 51 | `anvil` | MECHANISM | no | Iron anvil on a wood block; smithy |
| 52 | `forge` | MECHANISM | no | Stone forge with bellows; set against a wall |
| 53 | `grindstone` | MECHANISM | yes | Circular grindstone in a wooden frame |
| 54 | `loom` | MECHANISM | no | Upright weaving loom; craftsperson's home or workshop |
| 55 | `market_stall` | MECHANISM | no | Wooden stall with folding canopy; market square |
| 56 | `cage_iron` | MECHANISM | yes | Circular iron cage; prisoner, captured animal, or spirit |
| 57 | `notice_board` | MECHANISM | no | Wooden board with nailed postings; tavern, town square |
| 58 | `signpost` | MECHANISM | no | Road signpost with carved arms; crossroads, trail |
| 59 | `cart` | MECHANISM | no | Two-wheeled hand cart; road, barn, market |
| **— Moros-specific —** | | | | |
| 60 | `ritual_circle` | MECHANISM | yes | Carved stone circle for elemental spirit-binding rituals |
| 61 | `tanning_rack` | MECHANISM | no | Wooden frame for stretching hides; tanner's yard |
| 62 | `fishing_net` | MECHANISM | no | Laid-out or hanging net; dockside, riverside |
| 63 | `beehive` | CONTAINER | yes | Straw skep beehive; apiary, garden |
| 64 | `spirit_shrine` | STATUE | no | Small carved niche with offerings; roadside or forest |
| **— Market and Inn —** | | | | |
| 65 | `food_stall` | MECHANISM | no | Open stall counter with produce, bread, or cooked food displayed; facing = customer side |
| 66 | `inn_counter` | FURNITURE | no | Long service bar behind which the innkeeper or barkeep stands; facing = customer side |
| 67 | `stable_stall` | MECHANISM | no | Single animal stall with hay and ring; facing = aisle |
| 68 | `trough` | CONTAINER | yes | Stone or wood feed/water trough; stable, farm, roadside |
| 69 | `cooking_spit` | MECHANISM | no | Iron spit over an open fire for roasting; inn kitchen, outdoor feast |
| 70 | `bread_oven` | MECHANISM | no | Domed stone oven for baking; bakery, inn kitchen |
| 71 | `butcher_block` | FURNITURE | no | Heavy chopping block with iron hooks overhead; butcher's shop, kitchen |
| **— Ruins and Decay —** | | | | |
| 72 | `rubble_pile` | STATUE | yes | Heap of collapsed masonry; symmetric mound |
| 73 | `fallen_beam` | FURNITURE | no | Collapsed timber; diagonal obstruction on the ground |
| 74 | `broken_pillar` | PILLAR | yes | Shattered column stump; half-height or less |
| 75 | `collapsed_arch` | STATUE | no | Partial stone arch; implies blocked passage |
| 76 | `debris_scatter` | STATUE | yes | Low-profile scattered stone chips and dust |
| 77 | `dead_tree` | TREE | yes | Leafless trunk and bare branches |
| 78 | `root_growth` | STATUE | yes | Roots bursting through floor or foundation |
| 79 | `vine_column` | STATUE | yes | Vegetation climbing a vertical surface |
| 80 | `moss_patch` | STATUE | yes | Ground-level moss and lichen on stone |
| 81 | `skeleton` | STATUE | no | Humanoid remains; facing = direction body fell |
| 82 | `overturned_table` | FURNITURE | no | Toppled table; implies sudden departure or violence |
| 83 | `broken_crate` | CONTAINER | yes | Splintered wooden crate; contents long gone |
| 84 | `rusted_chain` | STATUE | no | Wall-mounted chains or restraints; facing = wall |
| 85 | `old_campfire` | STATUE | yes | Cold ash ring with charred stones |
| 86 | `pit` | MECHANISM | yes | Floor opening; collapsed cellar or trap hole |
| 87 | `collapsed_floor` | MECHANISM | yes | Irregular hole spanning the hex; edges ragged |

Well-known item indices now run 0–87. Indices 88–255 are map-specific.

**ItemKind notes:**

| Kind | Used for |
|---|---|
| PILLAR | Structural columns; emit geometry at hex centre |
| TREE | Trunk + canopy billboards; symmetric |
| LADDER | Leans against the wall it faces; `item_rotation` = wall direction |
| FURNITURE | Seats, surfaces, storage furniture; rotation = facing direction |
| CONTAINER | Vessels and storage items that can be opened; rotation = lid/access direction |
| LIGHT | Light sources; placed at hex centre or against a wall |
| STATUE | Decorative and ceremonial objects |
| MECHANISM | Functional interactive objects (wells, forges, stalls, ritual tools) |
| NEWEL | Spiral stair centre column; full-height cylinder |
| ARC_PIVOT | Grand arc stair pivot marker; invisible in play |

### Item rotation and hex flags

The `item_rotation` byte has two distinct regions:

```
bit 7   bit 6        bit 5        bits 4–0
  0   waypoint_flag  spawn_flag   rotation (0–23)
```

#### Rotation (bits 0–4)

Compass heading in **24 steps of 15°** clockwise from north. Read as `hex.item_rotation & 0x1F`.

| Value | Angle | Notable alignments |
|---|---|---|
| 0 | 0° | North — aligns with hex N flat edge |
| 4 | 60° | NE — aligns with hex NE diagonal |
| 8 | 120° | SE — aligns with hex SE diagonal |
| 12 | 180° | South |
| 16 | 240° | SW |
| 20 | 300° | NW |

Multiples of 4 align the item with a hex wall axis. Other values place items at off-axis angles, useful for furniture, barrels, crates, and tilted objects. Items with `symmetric = true` ignore the rotation at render time but the byte is still stored intact (preserving the flags).

#### spawn_flag (bit 5)

When set, this hex has a `SpawnPoint` entry in `map.spawn_points`. The spawn point describes what creature or NPC appears here, in what numbers, and under what conditions. The editor shows a skull overlay on the hex.

#### waypoint_flag (bit 6)

When set, one or more `NpcWaypoint` entries in `map.npc_routines` reference this hex. Waypoints form the daily schedule of named NPCs — the specific positions they move to during different parts of the day and what they do there. The editor shows a person-outline overlay on the hex.

Both flags may be set on the same hex (e.g., a guard captain who spawns at his post and also has it as a waypoint in his patrol schedule).

---

### Storage layout for palettes

```
Map {
  name:             string,
  chunks:           Chunk[],               // ordered: FULL chunks first, then ITEM_OVERLAYs
  structures:       Structure[],
  blueprints:       Blueprint[],
  placements:       Placement[],
  material_palette: MaterialDef[],   // index 0 reserved; 1–17 well-known; 18–255 map-specific
  wall_palette:     WallDef[],       // index 0 reserved; 1–23 well-known; 24–255 map-specific
  item_palette:     ItemDef[],       // index 0 reserved; 1–64 well-known; 65–255 map-specific
  door_states:      Map<EdgeAddress, bool>,   // runtime open/closed state
  spawn_points:     SpawnPoint[],    // all creature/NPC spawn hexes; keyed by HexAddress
  npc_routines:     NpcRoutine[],    // all named NPC daily schedules
}

EdgeAddress {
  global_q: i32,
  global_r: i32,
  cy:       i32,
  dir:      Direction,   // N | NE | SE only (owned directions)
}

HexAddress {
  global_q: i32,
  global_r: i32,
  cy:       i32,
}
```

Palettes are loaded once at map load time. Missing entries (index > palette length) fall back to index 1 (the first well-known type in each palette).

---

## Spawn Points

A `SpawnPoint` marks a hex as the origin for one or more creatures or a named NPC. The matching hex has `spawn_flag` (bit 5 of `item_rotation`) set.

```
SpawnPoint {
  hex:       HexAddress,
  kind:      SpawnKind,
  creature:  u8,           // CreaturePalette index — used when kind == CREATURE
  npc_id:    u8,           // NpcRoutine index — used when kind == NPC
  count:     u8,           // number of creature instances to place (1–8); ignored for NPC
  facing:    u8,           // initial facing direction (0–23, same encoding as item_rotation)
  condition: SpawnCondition,
}

SpawnKind: CREATURE | NPC

SpawnCondition: ALWAYS        // present whenever the scene is loaded
              | NIGHT_ONLY    // only present between dusk and dawn
              | DAY_ONLY      // only present between dawn and dusk
              | TRIGGER       // spawned by a game event; not present on scene load
              | RANDOM        // present with 50 % probability each scene load
```

Multiple `SpawnPoint` entries may reference the same hex (e.g., a guard post that has one NPC spawn by day and a different creature by night).

The `creature` field indexes a `CreaturePalette` defined separately in the DM tool (see CREATURES.md). The `npc_id` field indexes into `map.npc_routines`.

---

## NPC Routines

An `NpcRoutine` describes a named NPC's 24-hour schedule as an ordered list of waypoints. The matching hex cells have `waypoint_flag` (bit 6 of `item_rotation`) set.

```
NpcRoutine {
  npc_id:    u8,           // index within map.npc_routines (0-based)
  name:      string,       // display name shown in the editor
  creature:  u8,           // CreaturePalette index — body, stats, and appearance
  waypoints: NpcWaypoint[], // ordered by time_start; wraps at midnight
}

NpcWaypoint {
  hex:        HexAddress,
  activity:   WaypointActivity,
  time_start: u8,          // hour of day the NPC arrives here (0–23)
  time_end:   u8,          // hour of day the NPC leaves (0–23; wraps through midnight if < time_start)
  facing:     u8,          // direction the NPC faces while at this waypoint (0–23)
  note:       string,      // optional DM annotation ("kneading dough", "watching the gate")
}

WaypointActivity: STAND        // idle, standing in place
                | SIT          // seated at a nearby furniture item
                | SLEEP        // lying down; moves to the nearest bed item if one is in the hex
                | WORK         // performing a craft animation at a nearby mechanism item
                | EAT          // eating at a nearby table item
                | PATROL       // pacing between this waypoint and the next on the route
                | WANDER       // roams freely within a 3-hex radius of this waypoint
                | TALK         // engages players or other NPCs who approach
                | GUARD        // alert stance; reacts immediately to intruders
                | REQUISITION  // visiting a stall or shop to buy or collect goods
```

### Routine rules

- Waypoints are traversed in `time_start` order. The NPC moves to each hex as its scheduled time arrives.
- A gap between consecutive waypoints (no waypoint covers that hour) leaves the NPC at the last waypoint until the next one begins.
- If two waypoints overlap in time, the later one in the array takes priority.
- Movement between waypoints uses the map's pathfinding graph; the NPC travels at walking speed and may arrive slightly late if the path is long.
- NPCs with `PATROL` activity treat consecutive PATROL waypoints as a route; the NPC walks the sequence in order and loops.

### Activity — item affinities

Each activity has a preferred item kind it will seek within **2 hexes** of the waypoint hex. If no suitable item is found, the NPC defaults to `STAND`.

| Activity | Seeks item kind | Preferred items |
|---|---|---|
| SIT | FURNITURE | `chair_wood`, `chair_highback`, `bench_wood`, `bench_stone`, `stool_wood`, `throne` |
| SLEEP | FURNITURE | `bed_single`, `bed_double` |
| WORK | MECHANISM | `forge`, `loom`, `grindstone`, `bread_oven`, `cooking_spit`, `butcher_block`, `tanning_rack`, `fishing_net`, any MECHANISM |
| EAT | FURNITURE | `table_wood`, `table_stone`, `table_long`, `inn_counter` |
| GUARD | MECHANISM | `well`, `market_stall`, `food_stall`, `inn_counter`, `notice_board` — faces item; otherwise faces `facing` direction |
| REQUISITION | MECHANISM | `food_stall`, `market_stall`, `inn_counter` — NPC stands at the customer side, faces the stall operator |

`REQUISITION` specifically represents a customer transaction — the NPC approaches a stall or counter, pauses briefly (buying, collecting, or inspecting), then continues. Stall-operator NPCs run a `WORK` waypoint at the same hex; `REQUISITION` customers cluster at the same stall without conflict because they occupy the hex on the customer side.

### Multiple NPCs at one hex

Any number of `NpcWaypoint` entries from different routines may reference the same hex (e.g., two guards sharing a post, or all villagers converging on the market at noon). The `waypoint_flag` on the hex is set as long as at least one active waypoint references it; the editor tooltip lists all NPCs scheduled there.

---

## Marketplace and Inn Layouts

Standard layout patterns for recurring scene types. Hex counts are approximate; scale up or down by adding columns or rows. Per-hex spacing on the pointy-top grid: **E–W ≈ 1 m** (flat to flat), **N–S ≈ 1.15 m** (vertex to vertex), rows offset half a hex.

Notation used in diagrams:
- `[ ]` — one hex; label is the primary item placed there
- `···` — open hex (no item, floor material only)
- Wall lines between hexes use `|` (N/S wall) or `/` (diagonal)

---

### Market stall row

A single-sided row of stalls facing a pedestrian strip. The stall operator stands behind the counter; customers approach from the open side.

```
  N wall (building back or fence)
  ┌──────────────────────────────────────────┐
  │[stall][stall][stall][stall][stall][stall]│  ← stall hexes (market_stall or food_stall)
  │ ···   ···   ···   ···   ···   ···        │  ← customer strip (road or stone_tiles)
  └──────────────────────────────────────────┘
```

**Items:** `market_stall` or `food_stall` facing south (rotation 12); `barrel` and `crate` behind the counter hex.
**Walls:** the back wall (N edge of stall hexes) is a solid wall; the customer side is open.
**NPC routines:**
- Stall operator: `WORK` at stall hex, 07:00–19:00
- Customers: `REQUISITION` at stall hex, staggered 08:00–18:00

**Double-sided market** — place two rows back-to-back sharing the wall, with a wide pedestrian strip on each side:

```
  [stall row facing south]
  [stall row facing north]   ← back-to-back, shared N wall
```

---

### Food market (open square)

A plaza with food stalls arranged around a central open space. A `fountain` or `monument` at the centre gives customers a landmark.

```
       [food][food][food]         N stall row, facing south
  ···  ···   ···   ···   ···
  [fd] ···  [fountain]  ··· [fd]  flanking stalls, facing inward (E or W)
  ···  ···   ···   ···   ···
       [food][food][food]         S stall row, facing north
```

**Floor material:** `stone_tiles` for the plaza, `road` for surrounding streets.
**Additional items:** `cart` near stall rows (restocking); `notice_board` at one corner.
**NPC routines — typical food market day:**
- Bakers (2–3): `WORK` at `bread_oven` hex (bakehouse behind north stalls) 05:00–07:00, then `WORK` at food stall 07:00–12:00
- Butcher: `WORK` at `butcher_block` 06:00–11:00, then `WORK` at food stall 11:00–18:00
- Customers (4–8): `REQUISITION` at various food stalls 07:00–11:00, then `EAT` at `table_wood` in tavern or home

---

### Inn — ground floor

Typical footprint: **6 hexes E–W × 4 hexes N–S** (≈ 7 m × 4 m).

```
  ┌──────────────────────────────────────┐
  │[kitch][kitch][stor] ··· ···  [hearth]│  ← row 0 (N)
  │[kitch][kitch][stor] ··· ···  ···     │  ← row 1
  │[kitch][kitch]  ···  ··· ···  [notbrd]│  ← row 2
  │  ···    ···  [cntr][cntr]···  ···    │  ← row 3 (S, street level)
  └────────────────────────────────────┘
        ↑ kitchen wall              ↑ entrance (no N wall on door hexes)
```

Key:
- `[kitch]` — kitchen hexes: `bread_oven`, `cooking_spit`, `cauldron`, `workbench` items; `dirt_floor` material
- `[stor]` — storage: `barrel`, `barrel_rack`, `crate`, `sack`; `stone_tiles` or `dirt_floor`
- `[cntr]` — `inn_counter` items (2 hexes wide), barkeep stands behind, customers in front; `stone_tiles`
- `[hearth]` — `hearth` item against east wall
- `[notbrd]` — `notice_board` item near entrance
- Remaining hexes: `table_wood` and `chair_wood` / `bench_wood` filling the common room; `wood_floor`

**Walls:**
- Kitchen is walled off from common room (stone or plaster wall along the N–S boundary)
- Entrance: 1–2 hex gap in the south wall with a `stone_door` or `arch_opening`
- Street-facing wall: `stone` or `bricks` body with a `wood_window` on each side of the door

**NPC routines — innkeeper:**

| Waypoint hex | Activity | Time | Note |
|---|---|---|---|
| Kitchen | WORK | 05:00–07:00 | Preparing breakfast |
| Inn counter | WORK | 07:00–12:00 | Morning service |
| Kitchen | WORK | 12:00–14:00 | Midday meal prep |
| Inn counter | WORK | 14:00–22:00 | Afternoon and evening service |
| Bedroom (upper) | SLEEP | 22:00–05:00 | |

**NPC routines — barkeep (if separate):**

| Waypoint hex | Activity | Time | Note |
|---|---|---|---|
| Inn counter | WORK | 11:00–23:00 | |
| Common room table | EAT | 15:00–16:00 | Staff meal break |
| Bedroom (upper) | SLEEP | 23:00–11:00 | |

**NPC routines — guest:**

| Waypoint hex | Activity | Time | Note |
|---|---|---|---|
| Bedroom | SLEEP | 22:00–07:00 | |
| Common room | EAT | 07:00–08:00 | Breakfast at table |
| (leaves map) | — | 08:00–20:00 | Out in town; WANDER or off-map |
| Common room | SIT | 20:00–22:00 | Evening drink |

---

### Inn — upper floor

Directly above the ground floor (`cy + 1`, same `cx, cz`). Typical: **3–4 sleeping rooms** along a central corridor.

```
  ┌─────────────────────────────────────┐
  │[bed1][bed1] ·  [bed3][bed3]         │
  │             ·                       │  ← · = corridor (stone_tiles or wood_floor)
  │[bed2][bed2] ·  [bed4][bed4]         │
  └─────────────────────────────────────┘
```

Each room (1–2 hexes): `bed_single` or `bed_double`, `wardrobe` or `chest_wood`, `candle`.
Room doors: `wood_door` on the corridor-facing N wall of each room hex.
Corridor: 1 hex wide, no items; `lantern_hanging` item overhead (rendered at ceiling height of the upper floor).

**Stairs** connect ground floor to upper floor: a `stone_stair` or `wood_stair` hex pair at the east end of the ground floor corridor, rising to the upper floor landing.

---

### Inn — stable outbuilding

A separate single-storey building (`cy = 0`) adjacent to the inn, connected by a walled yard.

```
  ┌────────────────────────────┐
  │[stall][stall][stall][stall]│  ← animal stalls (stable_stall items)
  │[trgh] [trgh] ···   ···    │  ← troughs and aisle
  │ ···   ···   ···   ···     │  ← aisle / grooming area
  └────────────────────────────┘
```

**Items:** `stable_stall` (facing aisle, rotation 0 or 12); `trough` beside each pair of stalls; `ladder_wood` for loft access; `sack` (feed), `cart` (outside).
**Material:** `dirt_floor` throughout; `gravel` in the yard.
**NPC routines — stable hand:**

| Waypoint hex | Activity | Time | Note |
|---|---|---|---|
| Stable aisle | WORK | 06:00–08:00 | Morning feed and muck-out |
| Yard | WANDER | 08:00–17:00 | Odd jobs |
| Stable aisle | WORK | 17:00–19:00 | Evening feed |
| Hayloft / bed above stables | SLEEP | 19:00–06:00 | |

---

### Market stall — NPC operator example

Full daily schedule for a produce vendor who also visits the food market themselves:

| Waypoint hex | Activity | Time | Note |
|---|---|---|---|
| Home / bed | SLEEP | 21:00–04:00 | |
| Kitchen (home) | WORK | 04:00–06:00 | Preparing stock |
| Market square | WORK | 06:00–07:00 | Setting up stall |
| Food stall (own) | WORK | 07:00–13:00 | Selling |
| Rival food stall | REQUISITION | 13:00–14:00 | Checking competitor prices |
| Food stall (own) | WORK | 14:00–19:00 | Afternoon selling |
| Market square | WORK | 19:00–20:00 | Packing down |
| Tavern common room | SIT | 20:00–21:00 | Evening drink |

The wall type (`open` vs. any other) drives two completely different rendering outcomes.

#### Mode A — `open` wall

No wall is drawn. Instead, the height difference between the two adjacent hexes determines what fills the transition:

- **Delta = 0**: nothing is rendered — the two surfaces are seamlessly level.
- **Delta > 0**: a **slope face** is rendered in the 16 cm gap between the two edges, connecting the upper edge of the lower hex to the lower edge of the higher hex. The slope face is textured with the higher hex's material. This handles all terrain transitions — gentle embankments, steep cliffs, riverbanks — without needing explicit wall types.

For very large deltas (≥ 4 units, ≈ 67 cm) the slope face is near-vertical and visually reads as a cliff. For small deltas (1–3 units) it reads as an embankment.

#### Mode B — non-`open` wall

The wall renders as a full structural surface from floor to ceiling, regardless of the height delta between the two adjacent hexes:

- **Base** = the lower of the two adjacent hex heights (the hex foundation level).
- **Top** = the height of the ceiling hex directly above (at `cy + 1`, same `hx, hz`), if one exists and its material ≠ `open`. Otherwise: `lower_height + default_wall_height`.
- **Default wall height** = 12 units (≈ 2 m). This is enough for a standard door (≈ 10 units) with headroom.

The portion of the wall between the lower hex height and the higher hex height is the **plinth** — the foundation section visible from the lower side (exterior ground level). Above that is the main wall face, visible from both interior and exterior.

This means interior room dividers at equal floor height render correctly: the wall rises from the shared floor to the ceiling regardless of zero height delta.

### Wall physical position

The wall is **centered on the shared edge** — it occupies 8 cm on each side of the hex boundary. This defines a consistent inside/outside boundary for collision and rendering.

> **The two subsections below are the flat-top derivation and have not been re-derived for
> the implemented pointy-top grid** —
> [moros#3](https://github.com/jjstwerff/moros/issues/3). The *shapes* of the arguments
> survive a 90° rotation (one edge is axis-aligned; the staggered pair zigzags and is drawn
> at a midpoint), but every axis, letter and constant below is stated for the wrong
> orientation. Re-derive against the exact lattice rather than relabelling — the invariant
> to hold is that a wall's drawn line stays perpendicular to the edge it stands on.

### N wall — flat edge (E–W)

The N wall is one sub-triangle row thick (≈ 16 cm measured N–S), centered on the N edge of the hex.

### NE / SE walls — midpoint rendering

NE and SE walls are **not** rendered by following the actual hex edge. In a flat-top hex column the right-side edge boundary zigzags between two x-positions:

- **Inner x** = cx + a/2 — the shared vertex where adjacent NE and SE edges meet (the NE/SE vertices of the hex), recurring every hex.
- **Outer x** = cx + a — the E vertex of each hex, interleaved between them.

Rather than following this zigzag, the wall is drawn as a **straight line at the midpoint** between the two extremes:

```
wall x = cx + 3a/4   (≈ cx + 43 cm)
```

The wall is 16 cm thick, centered on this line (8 cm each side). This is narrower than a full sub-triangle side (≈ 19 cm) but considerably wider than the single-vertex touching points where adjacent sub-triangle chains share only a corner.

By positioning the wall at the midpoint and rendering it straight, the NE/SE wall face is exactly **perpendicular to the flat N edge**, making it truly parallel to the N–S axis. This means a NE/SE wall and a N wall meet at a geometrically exact **90° corner** — not an approximation.

The same principle applies to the NW/SW walls on the west side of a hex (owned as wall_ne and wall_se of the western neighbor), mirrored to x = cx − 3a/4.

For other orientations (60°, 120° rotations) the equivalent midpoint positions rotate with the building axis, giving straight walls at 60° and 120° from N–S and enabling true 90° corners in all 12 orientations.

### Wall height cap and ceiling

Walls extend from base to `min(ceiling_hex_height, lower_height + default_wall_height)`.

The ceiling hex is read from the `cy + 1` chunk at the same `(hx, hz)`. If the ceiling hex material is `open` or absent, the default 12-unit cap applies. If the ceiling is present, the wall terminates at the ceiling hex's absolute height.

### Doors and windows

A `door` or `window` value inherits the **material thickness and texture** of the dominant wall type on that edge — determined by the other hex's wall type on the same edge. If both sides carry `door` or `window`, the heavier material (stone > bricks > half_timber > wood) wins. The aperture is centered on the edge midpoint at standard height.

---

### Thick Walls — City and Castle Fortifications

`THICK_FLAT` and `THICK_CURVED` are 1-metre-wide masonry walls used for city defences and castle fortifications. The `thickness` field on `WallDef` specifies the full wall depth in metres perpendicular to the wall face. Standard value is **1.0 m** for all fortification types.

`thick_half = thickness / 2.0` is the half-depth used in rendering.

#### THICK_FLAT — straight walls with square corners

Each wall segment is a rectangular slab `thickness` metres deep and `height` metres tall. The slab occupies the same centre-line positions as thin walls (N wall centred on the hex's N edge; NE/SE walls centred on `x = wx + DIAG_X`).

At junctions where two thick-flat walls meet at a vertex, the N wall's x-range is extended outward by `thick_half` past the diagonal wall centre-line, forming a **square corner block** at the junction. The diagonal wall slab butts into this block without trimming. Internal geometry overlap at the corner is occluded by adjacent faces and is never visible.

This produces the characteristic **sharp right-angle external corners** of rectangular keeps and city bastions.

The `castle_wall` variant (index 17) is identical in cross-section to `city_wall` but uses a BATTLEMENT crenellation pattern on the top cap (alternating solid merlons and open crenels rendered by the top-cap emitter).

#### THICK_CURVED — curved walls and round towers

Wall segment slabs are identical to `THICK_FLAT` in cross-section. The difference is at **corner junctions**:

Instead of a square corner block, a **cylindrical post** of radius `thick_half` is placed at each junction vertex where two `THICK_CURVED` walls meet. The cylinder covers the full height from `y_base` to `y_top` and is approximated by 8 quads.

This gives:
- **Round towers** — a free-standing cylindrical column forms where walls converge at a single vertex from multiple directions.
- **Curved wall runs** — laying `THICK_CURVED` segments in an arc (over several hexes) produces walls that look as if they bow outward, because every junction vertex carries a small cylindrical chamfer rather than a sharp corner.

The cylinder radius `thick_half = 0.5 m` matches the wall half-depth so that the curved face of the cylinder is flush with the outer face of the straight wall segments it joins.

#### Apertures in thick walls

Thick walls (`THICK_FLAT`, `THICK_CURVED`) support the full aperture system (doors, windows, arches). Aperture dimensions scale with `face_w = thickness` for the depth axis and the wall face width for the horizontal axis. Doors in thick walls are visible from both sides of the slab and include a recessed tunnel pass-through.

---

### Road Guide Walls

`ROAD_GUIDE` walls are **invisible boundary markers** used to define the width and curvature of roads, paths, and other linear features on the terrain surface. They carry no visible geometry in play mode but appear as translucent overlays in the map editor.

`thickness` sets the guide width in metres:

| Thickness | Typical use |
|---|---|
| 1.0 m | Narrow path, alley |
| 2.0 m | Cobblestone road (single cart width) |
| 3.0 m | Avenue, carriage road |
| 4.0 m | Rail track bed, canal |

Road guides placed along a sequence of hex edges define the centreline and width of a road. The road surface itself is just the hex material (`road`, `stone_tiles`, etc.) — the guide provides the constraint information for the map editor's road-painting tools and for pathfinding systems that need to distinguish road types by width.

Because `ROAD_GUIDE` uses the same `THICK_CURVED` corner geometry as curved city walls (cylindrical junction posts), guides naturally describe smooth curves when laid in arcs, making them suitable for curved avenues, river bends, and railway switchbacks. Using `THICK_FLAT` guide geometry instead produces straight-edged road boundaries with sharp turns.

---

## Stair Geometry

Three stair kinds are available, selected by `MaterialDef.stair_kind`:

---

### LINEAR stairs (`stair_kind = LINEAR`)

The default for `stone_stair` and `wood_stair`. Step geometry follows the height delta to the downhill neighbor.

| Height delta to downhill neighbor | Tread depth | Rise | Angle |
|---|---|---|---|
| 1 unit (≈ 16 cm) | 16 cm | 16 cm | 45° |
| 2 units (≈ 33 cm) | 32 cm | 33 cm | 46° |

Both depths produce approximately 45° slopes. The 32 cm tread provides a wider step for the same rise, matching standard stair ergonomics better. There is no shallower angle available within a single hex; a gentler ramp requires stair material across two adjacent hexes with a 1-unit rise each (16 cm rise over 32 cm total tread = 27°).

**Stair direction**: the downhill neighbor is the one with the lowest height among all 6 neighbors. If two neighbors tie for lowest, priority order is N > NE > SE > S > SW > NW. If all neighbors are at equal height, no step geometry is produced (flat surface despite stair material).

Diagonal stairs (NE/SE axis) use the same delta rule with step width ≈ 16 cm per tread.

---

### SPIRAL stairs (`stair_kind = SPIRAL`)

A compact winding stair using **7 hexes** — 1 central newel hex and 6 ring hexes that rise one step each revolution.

#### Layout

```
        [5]
     [4]   [0]
  [3]  [C]  [1]
     [2]
```

`[C]` = center (newel) hex. `[0]`–`[5]` = ring hexes in the six directions N, NE, SE, S, SW, NW.

**Center hex:**
- Any floor material (e.g., `stone_tiles`)
- Must carry a `NEWEL` item (`newel_stone` or `newel_wood`)
- Height is any constant value `h` — the newel renders as a full-height cylinder regardless

**Ring hexes (the 6 surrounding hexes):**
- Material: `spiral_stair` (index 16)
- All walls between ring hexes: `OPEN` — slope faces form the risers automatically
- Heights rise **1 unit per step** going clockwise around the center:

| Ring hex | Hex direction | Height |
|---|---|---|
| [0] | N | h + 0 |
| [1] | NE | h + 1 |
| [2] | SE | h + 2 |
| [3] | S | h + 3 |
| [4] | SW | h + 4 |
| [5] | NW | h + 5 |

After one full revolution (6 steps, 6 height units ≈ 1 m), the stair connects upward. For a counter-clockwise spiral reverse the height order (NW at h+1, SW at h+2, …, NE at h+5).

**Step geometry**: each ring hex surface is a flat tread at its absolute height. The riser between consecutive ring hexes is the 16 cm slope face rendered at their shared edge (height delta = 1 unit). Outer walls of the ring hexes carry walls or a fence for the guardrail; inner edges face the newel and are always open.

**Multi-revolution spirals**: extend the staircase by stacking additional 7-hex clusters, each shifted 6 height units higher. The newel item at each `cy` layer renders the full-height column from floor to ceiling; consecutive cy layers share the same center `(hx, hz)`, so the column is continuous across floors.

**Step rise/tread dimensions:**
- Tread width (inner edge, touching the newel): ≈ 29 cm (half the hex N-S diameter on the inner arc)
- Tread width (outer edge): ≈ 1 m (full hex N-S diameter on the outer arc)
- Rise: 1 height unit ≈ 16.7 cm
- Walkable arc radius: ≈ 0.5–1.0 m — comfortable for a single-person spiral in a tower

---

### GRAND_ARC stairs (`stair_kind = GRAND_ARC`)

A wide curved staircase of the kind seen at palace entrances and civic buildings. Steps fan outward in a smooth arc; treads are wider at the outside and narrower at the inside. The arc is defined by an `ARC_PIVOT` item placed at the mathematical centre of curvature.

#### Layout

The DM places:
1. **One `arc_pivot` item** (index 8) at the arc centre hex. This hex has any floor material; the pivot item is invisible in play mode.
2. **A fan of `grand_arc_stair` hexes** arranged in a curved row at each step height, radiating outward from the pivot.

Each `grand_arc_stair` hex uses `item_rotation` to record its **angular sector** in the arc (0–23 steps × 15°, measured clockwise from north). The renderer uses this angle together with the pivot position to compute the wedge-shaped tread geometry.

Heights rise by 1 height unit per step row (one angular sector). All hexes in the same radial row (same angle, different radius) share the same height.

#### Example — a 90° sweep, 3-step, 2-hex-deep staircase

```
  Arc pivot at hex P.
  Step 0 (height h+0): hexes at 270°–300°, radii r and r+1 from P
  Step 1 (height h+1): hexes at 300°–330°, radii r and r+1 from P
  Step 2 (height h+2): hexes at 330°–360°, radii r and r+1 from P
```

Each hex in the fan uses `item_rotation` for its angular centre (270° → rotation value 18, 300° → 20, 330° → 22).

#### Double palace staircase

A symmetrical pair of arcs sharing a top landing. Place a left-hand and right-hand arc, both meeting at the same height at the top. Each arc is defined by its own `ARC_PIVOT` item. The two arcs mirror each other across the building's axis of symmetry.

#### Step rise/tread dimensions (example, r = 3 hexes ≈ 3 m)

| Property | Inner row | Outer row |
|---|---|---|
| Tread width (along arc) | ≈ 3.1 m × sin(60°) ≈ 1.8 m | ≈ 4.2 m × sin(60°) ≈ 2.5 m |
| Tread depth (radial) | ≈ 1 m (one hex) | ≈ 1 m (one hex) |
| Rise | 1 height unit ≈ 16.7 cm | same |
| Angle | 45° | 45° |

Outer rows are wider, creating the characteristic splayed appearance of a grand staircase.

---

## Layer System and Multi-Story Buildings

Multiple chunks at the same `(cx, cz)` but different `cy` values stack to form multi-story structures. Each cy layer represents one horizontal slice of the world. There is no limit on the number of layers.

### Layer semantics

A hex at `(cx, cy, cz, hx, hz)` defines a surface at its absolute height. Walls at that hex connect that surface upward to the surface at `cy + 1` (directly above, same `hx, hz`).

| cy | Typical use |
|---|---|
| −1 | Cellar / underground |
| 0 | Ground floor and open terrain |
| 1 | First upper floor (ceiling of ground floor) |
| 2 | Second upper floor (ceiling of first floor) |
| … | Additional stories |

A layer acts as **both** the ceiling of the room below and the floor of the room above. A hex at `cy = 1` with `material = wood` is the wooden floor of the second story and the wooden ceiling of the first story room directly beneath.

### Roof layer

There is no special "roof layer" type. The roof is simply the topmost `cy` layer with `material = roof_tiles` (or similar). The roof hexes' heights define the roof surface in world space. Roof slope is formed by height transitions across adjacent roof hexes, identical to how terrain slope works.

### Restricting layers to the same x,z

All layers of a building must share the same chunk `(cx, cz)` position. A 3-story building occupies chunks `(cx, 0, cz)`, `(cx, 1, cz)`, and `(cx, 2, cz)`. This constraint makes it straightforward to look up the ceiling hex for any wall: read the same `(hx, hz)` in the chunk one `cy` higher.

---

## House Construction

### Building angles on a hex grid

A hex grid exposes three wall axes spaced 60° apart. Because the staggered walls are drawn
at a midpoint rather than following the zigzag boundary (see Wall Geometry), they render
perpendicular to the axis-aligned edge — which is what makes **true 90° corners
achievable** on a 60° lattice. That result is the reason the format is built this way, and
it does not depend on the orientation.

> **The pairing table was removed rather than relabelled.** It named specific axes
> (`wall_n` as the E–W edge, and so on) that belong to the flat-top reading; on the
> implemented pointy-top grid the axis-aligned edge is **E**, not N. Restoring it means
> re-deriving the perpendicularity argument on the exact lattice —
> [moros#3](https://github.com/jjstwerff/moros/issues/3) — not renaming three rows. A table
> that looks authoritative and is wrong costs more than a missing one.

### 12 building orientations

12 orientations = 6 rotations (60° increments) × 2 (normal + E–W mirror). The three flat-edge axes give three distinct rectangle orientations (axis-aligned at 0°, 60°, 120°), each available in a normal and mirrored version, and each pairing two perpendicular wall directions.

Mirror produces a layout reflected across the N–S axis — useful for placing a mirrored building on the opposite side of a street while keeping the door facing the road.

### Typical house footprint (orientation 0)

```
  N wall: wall_n  — northernmost hex row  (flat E–W edge, 16 cm thick N–S)
  S wall: wall_n  — on the hex row just south of the building
  E wall: wall_ne + wall_se — easternmost hex column (rendered as straight N–S line at cx + 3a/4)
  W wall: wall_ne + wall_se — westernmost column of the neighbor to the west (at cx − 3a/4)
```

All four corners are 90°. The building footprint is a true rectangle.

---

## Roof Construction

Roof hexes use absolute heights (same coordinate reference as all other hexes). A roof surface at absolute height 30 sits at the same elevation as a ground hex at height 30.

Roof slopes are formed by height transitions between adjacent roof hexes — a ridge line is a row of high hexes, eaves are the low perimeter.

### Gable ends

A gable end is the triangular vertical face at the end of a pitched roof (where the ridge meets the eave wall). It is rendered as a ground-layer wall on the gable hex whose height reaches up to the ridge height. The wall type on the gable side sets the material. The triangular shape is implied by the wall height varying across the hex row (high at center ridge, low at eave corners) — the renderer fills the triangular gap between the wall top and the sloping roof surface above it.

---

## Multi-Chunk Structures

A structure may span up to **4 adjacent chunks** in a 2×2 footprint at the same `cy`.

- Walls and heights at chunk seams are resolved by reading the edge row/column of the adjacent chunk.
- Chunk boundary = every 32 hexes ≈ 37 m (E–W) or 32 m (N–S).
- A 2×2 chunk structure covers up to ≈ 74 m × 64 m.

Named structures are indexed separately:

```
Structure {
  name:  string,
  cx0:   i32,    // W chunk index of footprint
  cz0:   i32,    // N chunk index of footprint
  cy:    i32,    // ground layer cy
  width: u8,     // chunk columns (1–2)
  depth: u8,     // chunk rows    (1–2)
}
```

---

## Blueprints

> **Superseded in mechanism, kept for the requirements.** A blueprint is a stencil, and
> stencils are now a shared library mechanism: a stencil is a **small field**, stamping is
> **merging two fields**, and the 12 orientations come from the lattice as exact integer
> maps rather than from transforming offsets and wall indices separately. See
> [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § What the editor may rely on and
> [moros#5](https://github.com/jjstwerff/moros/issues/5).
>
> What stays true and useful here: **which** blueprints Moros wants, the terrain-conforming
> behaviour on placement, and the orientation vocabulary. What is superseded: the record
> layout below, and the separate rotation of hex offsets, wall directions and item rotation
> — three transformations that can disagree, where a field merge has one.

A **Blueprint** is a named hex template drawn in a canonical orientation. It can be stamped onto any map position in 12 orientations. When placed, the surrounding terrain is reshaped to meet the building foundation.

### Blueprint structure

```
Blueprint {
  name:         string,
  anchor:       (bq, br),           // origin hex in axial coords — typically entry hex or SW corner
  hexes:        Map<(bq, br), Hex>,  // all hex data; heights are absolute (relative to baseline 0)
  footprint:    Set<(bq, br)>,       // interior hexes used to compute the terrain conforming boundary
  grade_radius: u8,                  // hex rings outside footprint boundary to smooth (default: 3)
}
```

Blueprint hex heights use baseline 0 as the ground floor. A `height_offset` (signed integer) in the placement shifts every hex height when stamped. Heights resulting from `blueprint_height + height_offset` are clamped to `[0, 65535]`.

All hexes present in `hexes` — whether inside or outside `footprint` — are written to the map on placement, overwriting existing terrain. The footprint set only controls which hexes drive the terrain conforming boundary, not which hexes are written.

A blueprint may span multiple chunks if its hex extents exceed 32 in either axis; the placement logic resolves cross-chunk writes automatically.

### Placement record

```
Placement {
  blueprint:     string,   // blueprint name
  cx, cz:        i32,      // chunk containing the anchor
  cy:            i32,      // base vertical layer for the ground floor
  anchor_hx:     i32,      // hex column of anchor within the map (may cross chunk boundary)
  anchor_hz:     i32,      // hex row of anchor within the map
  orientation:   u8,       // 0–11 (see below)
  height_offset: i32,      // added to all blueprint hex heights; result clamped to u16
}
```

### Orientations

12 orientations = 6 rotations (60° increments) × 2 (normal + E–W mirror):

| ID | Rotation | Mirrored |
|----|----------|----------|
| 0  | 0°       | no  |
| 1  | 60°      | no  |
| 2  | 120°     | no  |
| 3  | 180°     | no  |
| 4  | 240°     | no  |
| 5  | 300°     | no  |
| 6  | 0°       | yes |
| 7  | 60°      | yes |
| 8  | 120°     | yes |
| 9  | 180°     | yes |
| 10 | 240°     | yes |
| 11 | 300°     | yes |

### Hex coordinate transformation

Blueprint hex positions `(bq, br)` are transformed using cube coordinates `(x, y, z)` where `x = bq`, `z = br`, `y = −bq−br`.

**Rotation** (each step = 60° clockwise, formula: `(x, y, z) → (−z, −x, −y)`):

| Steps | Cube transform |
|-------|---------------|
| 0 | `(x, y, z)` |
| 1 | `(−z, −x, −y)` |
| 2 | `(y, z, x)` |
| 3 | `(−x, −y, −z)` |
| 4 | `(z, x, y)` |
| 5 | `(−y, −z, −x)` |

**Mirror** (flip across the N–S axis, applied after rotation): `(x, y, z) → (−x, −z, −y)`

After transformation, convert back to axial: `bq = x`, `br = z`, then add the anchor's map position.

### Wall direction transformation

Wall directions rotate with the building. Per 60° clockwise step the full cycle is:

```
N → NE → SE → S → SW → NW → N
```

Lookup table for the three owned wall fields:

| Original | +1 (60°) | +2 (120°) | +3 (180°) | +4 (240°) | +5 (300°) |
|----------|----------|----------|----------|----------|----------|
| wall_n   | wall_ne  | wall_se  | wall_s   | wall_sw  | wall_nw  |
| wall_ne  | wall_se  | wall_s   | wall_sw  | wall_nw  | wall_n   |
| wall_se  | wall_s   | wall_sw  | wall_nw  | wall_n   | wall_ne  |

After rotation, each original wall value is moved into the appropriate transformed field. If the transformed direction is not among the owned three (N, NE, SE), the wall value is written into the matching neighbor hex's owned field instead.

**Mirror** swaps `wall_ne ↔ wall_nw` and `wall_se ↔ wall_sw`. Since `wall_nw` and `wall_sw` are owned by neighbors, mirror placement writes those values to the SE and NE neighbor hexes respectively.

### Item rotation transformation

`item_rotation` must also be transformed when a blueprint is placed.

Each 60° clockwise rotation step = **+4** rotation units (since 60° / 15° = 4):

```
rotated = (blueprint_item_rotation + rotation_steps * 4) mod 24
```

Mirror reverses the heading:

```
mirrored = (24 - rotated) mod 24
```

Apply mirror after rotation. For orientations 6–11 (mirrored), the full transform is:

```
final_rotation = (24 - (blueprint_item_rotation + rotation_steps * 4)) mod 24
```

---

## Terrain Conforming on Placement

When a blueprint is stamped, the terrain outside the footprint is reshaped over `grade_radius + 1` hex rings to rejoin natural terrain.

### Foundation height

The absolute floor height at each footprint perimeter hex = `blueprint_floor_height + placement.height_offset`.

### Conforming algorithm

For each terrain hex at hex-ring distance `d` from the nearest footprint boundary hex, where `d` runs from 1 to `grade_radius + 1`:

```
h(d) = foundation_h + (original_h − foundation_h) × (d − 1) / grade_radius
```

| d | Result |
|---|---|
| 1 | `foundation_h` — the flat foundation ring directly against the walls |
| 2 … grade_radius | Linearly interpolated toward original terrain |
| grade_radius + 1 | `original_h` — natural terrain, untouched |

The foundation ring (d = 1) is always set to foundation height — terrain is raised or lowered as needed to create a flat band against the building walls.

Rings d ≥ 2 interpolate in both directions: terrain above foundation height is lowered toward it; terrain below foundation height is raised toward it. This means a building placed on a hillside will cut into the high side and raise the low side within the grade zone, with the natural slope re-emerging at `d = grade_radius + 1`.

### Slope and material

After height adjustment:
- Natural materials (`grass`, `mud`, `road`) are preserved across the grade zone.
- A hex with a height delta ≥ 1 to any neighbor produces a visible slope face via the `open` wall rendering rule.
- A delta ≥ 4 units per hex (≈ 67 cm, near-vertical) in the grade zone is a cliff face and should be resolved by the map designer (retaining wall, stair strip, or explicit wall type on that edge).

---

## Storage Layout

```
Map {
  name:       string,
  chunks:     Map<(cx, cy, cz), Chunk>,   // sparse — only populated chunks stored
  structures: Structure[],                // optional named multi-chunk regions
  blueprints: Blueprint[],               // reusable house/structure templates
  placements: Placement[],              // stamped blueprint instances; terrain conforming is baked in
}
```

Missing chunks are treated as flat void (`open`, height 0). Terrain conforming is baked into chunk data at placement time and is not recalculated at render.

---

## Design Gaps and Resolutions

This section documents known design problems and the decisions made to resolve them.

### G1 — Open terrain between hexes at different heights

**Problem**: When `wall = open` and adjacent hexes have different heights, the spec was silent on what to render.

**Resolution**: Defined two explicit rendering modes for walls. `open` + height delta always renders a slope face (textured with the higher hex's material) in the 16 cm transition zone. This handles all terrain height variation consistently without requiring explicit wall types on terrain.

---

### G2 — Interior walls at equal floor height produce zero-height walls

**Problem**: The original design derived wall visual height from the height delta between adjacent hexes. Two hexes at the same height produced a delta of 0, making any wall type invisible. Interior building walls — the most common case — cannot be drawn this way.

**Resolution**: Wall height is now completely independent of the floor height delta. Any non-`open` wall always renders from the floor to the ceiling (default 12 units above floor, or the absolute height of the `cy + 1` ceiling hex if present). The height delta only determines the wall's **base** position (which may expose a plinth on the exterior side). Interior walls at equal floor height render at full ceiling height.

---

### G3 — Wall height cap confusion (cap vs. floor, and cap too low)

**Problem**: The original cap of 10 units (≈ 1.67 m) was below a standard door height (≈ 2 m = 12 units) and was framed as a ceiling rather than a default. It was also redundant given that the cap only applied when delta ≠ 0, which contradicted G2.

**Resolution**: Default wall height raised to 12 units (≈ 2 m). This is the fallback when no ceiling chunk is present. The cap is a default, not a hard limit — a ceiling chunk at any height overrides it.

---

### G4 — Wall direction rotation table had arithmetic errors

**Problem**: The table listed `N → SE` for a single 60° clockwise step. The correct result using the cube-coordinate formula `(x, y, z) → (−z, −x, −y)` is `N → NE`. The listed cycle was `N → SE → SW → S → NW → NE`, which represents 120° steps (every other direction), not 60° steps.

**Resolution**: Corrected. The 60° CW cycle is `N → NE → SE → S → SW → NW → N`. The table in the Blueprints section has been rewritten with verified values.

---

### G5 — Roof height absolute vs. relative ambiguity

**Problem**: The original spec said roof height was "above the ground layer's floor," making it relative to each ground hex below. A uniform roof-layer height would then follow ground contour, producing a sloped ceiling above a level floor — unintended for most buildings.

**Resolution**: All heights (ground, upper floors, roofs) use the same absolute coordinate reference. A flat ceiling is expressed by setting all ceiling hexes to the same `height` value. A sloped roof is expressed by varying the `height` values across the roof hex row.

---

### G6 — No mechanism for multi-story buildings

**Problem**: The original design declared `cy + 1` to be the roof layer, with no way to add a second floor.

**Resolution**: There is no special "roof layer" type. Any number of `cy` layers may stack at the same `(cx, cz)`. A layer at `cy = n` serves as the floor of its room and the ceiling of the room below (`cy = n − 1`). A roof is simply the topmost layer with roofing material. All layers of one building share the same `(cx, cz)` to simplify ceiling lookups.

---

### G7 — Stair direction with multiple lower neighbors

**Problem**: "The stair direction is the axis from the lower neighbor toward the current hex" did not specify what to do when multiple neighbors are equally lower.

**Resolution**: The downhill neighbor is the one with the lowest height. On a tie, priority order N > NE > SE > S > SW > NW applies. A stair hex where all neighbors are at equal height renders as a flat surface despite the stair material.

---

### G8 — Stair "gentle" misdescription

**Problem**: The wide step (2-unit delta, 32 cm run, 33 cm rise) was described as "gentle" but the angle is 46° — almost identical to the 45° narrow step. The wider tread is not a shallower slope.

**Resolution**: Corrected. Both step types have approximately the same angle. A genuinely gentle ramp (≈ 27°) requires stair material on two adjacent hexes with a 1-unit rise each (16 cm rise over 32 cm total run), which is now noted in the Stair Geometry section.

---

### G9 — Grade zone formula did not return to original height

**Problem**: The formula `foundation_h + (original_h − foundation_h) × (d−1) / grade_radius` at `d = grade_radius` falls short of `original_h` by `1/grade_radius` of the total difference.

**Resolution**: The formula now applies for `d = 1` through `d = grade_radius + 1`, where `d = grade_radius + 1` is the first untouched ring. At `d = grade_radius + 1` the formula evaluates to exactly `original_h`. The table has been updated to reflect this.

---

### G10 — "Heights only lowered" contradicted foundation ring behaviour

**Problem**: The foundation ring (d = 1) was supposed to be set to foundation height unconditionally (including raising low terrain), but the text also said "heights are only lowered."

**Resolution**: The conforming algorithm now explicitly states that the foundation ring is raised or lowered as needed. Grade rings d ≥ 2 interpolate in both directions — terrain above the foundation is lowered toward it and terrain below is raised toward it — so the grade zone always rejoins natural terrain at `d = grade_radius + 1`.

---

### G11 — "30° increments" label was wrong

**Problem**: The house construction section said "12 valid rectangular orientations, one per 30° increment." The actual system uses 60° rotation increments (6 steps) plus a mirror — giving 12 orientations but not at 30° steps.

**Resolution**: Language corrected to "6 rotations at 60° increments × 2 (mirror)." Mirror is not a 30° rotation; it is a reflection.

---

### G12 — True 90° angles claimed but the mechanism was not specified

**Problem**: The spec claimed buildings could have true 90° interior corners, but the three hex wall axes (0°, 60°, 120°) are all 60° apart. No two hex edges are 90° apart, and the original phrase "skipping a diagonal" was never demonstrated or explained.

**Resolution**: True 90° corners are achievable through the **midpoint rendering rule for staggered walls**. The staggered edge boundary zigzags between an inner and an outer position; drawing the wall as a straight line at the midpoint between those extremes makes it exactly perpendicular to the axis-aligned edge, so the two meet at a true 90° corner. The same principle applies in every 60° rotation, giving full 90° rectangular buildings in 12 orientations (6 rotations × 2 mirrors).

*The original resolution stated this for flat-top hexes, with the zigzag in x and the axis-aligned edge as N. On the implemented pointy-top grid the same argument holds rotated 90° — the axis-aligned edge is E — but the constants have not been re-derived; that is [moros#3](https://github.com/jjstwerff/moros/issues/3).*

---

### G13 — Wall physical position unspecified

**Problem**: A 16 cm wall sits at a hex boundary. The spec did not say whether it was centered or biased toward one side.

**Resolution**: Walls are centered on the shared edge — 8 cm on each side of the boundary. This defines a consistent inside/outside boundary for both rendering and collision.

---

### G14 — Corner vertex geometry unspecified

**Problem**: Where two walls meet at a hex vertex (e.g., N wall and NE wall at the NE corner), the rendering of the corner gap was undefined.

**Resolution**: At a vertex where two or more walls meet, the corner is filled by a solid block occupying the convex hull of the meeting wall ends. For single-wall terminations (a wall ending at a vertex with no continuation), the wall cap is a flat face perpendicular to the wall direction. This is a renderer responsibility given the wall geometry at each vertex; no additional data is needed.

---

### G15 — Blueprint hexes outside the footprint — overwrite or skip

**Problem**: Hexes present in a blueprint's `hexes` map but absent from `footprint` (e.g., a garden path, exterior step, or well) had undefined write behaviour.

**Resolution**: All hexes in `hexes` are written to the map unconditionally on placement, overwriting whatever terrain existed there. `footprint` exclusively controls the terrain conforming boundary — it does not filter which hexes are written.

---

### G16 — Gable end geometry unspecified

**Problem**: The triangular vertical face at the end of a pitched roof (gable end) was not described.

**Resolution**: Gable ends are formed by ground-layer walls on the gable hex column whose height reaches the ridge height. The wall height varies across the row (high at the ridge hex, low at the eave corners), and the renderer fills the triangular gap between the variable wall top and the sloping roof surface above. No additional data type is needed.

---

### G17 — height_offset underflow undefined

**Problem**: Blueprint heights are `u16`; `height_offset` is `i32`. A large negative offset could underflow to a negative height.

**Resolution**: The result of `blueprint_height + height_offset` is clamped to `[0, 65535]` before writing to the map. A placement that would push the entire structure below zero should be rejected by the authoring tool with a validation error.

---

## Summary — Key Constants

| Constant | Value |
|---|---|
| Chunk size | 32 × 32 hexes |
| Hex N–S diameter | ≈ 1.000 m |
| Hex E–W diameter | ≈ 1.155 m |
| Sub-triangles per hex | 54 |
| Height unit | ≈ 16.6 cm (sub-triangle height) |
| N wall thickness | ≈ 16.6 cm (1 height unit) |
| Diagonal wall thickness | ≈ 16.6 cm (= N wall thickness) |
| Diagonal wall centre offset from hex centre | ≈ 43.3 cm (= 3a/4) |
| Default wall height | 12 units (≈ 2 m) |
| Narrow stair step | 16 cm rise / 16 cm run (45°) |
| Wide stair step | 33 cm rise / 32 cm run (46°) |
| Gentle ramp (2 hexes) | 16 cm rise / 32 cm run (27°) |
| Max structure span | 4 chunks (2 × 2) |
| Max stories | Unlimited (stacked cy layers) |
