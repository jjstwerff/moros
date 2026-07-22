# Moros — Loft Library Design

> **Partly superseded.** The package boundaries here are Moros-private; the substrate is
> now shared with crawler and split differently — see
> [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § The package map and
> [moros#1](https://github.com/jjstwerff/moros/issues/1). The `StencilDef` sketch below is
> superseded by the field-merge stencil mechanism
> ([moros#5](https://github.com/jjstwerff/moros/issues/5)). The type and API listings remain
> accurate as a description of the recovered `moros_*` packages
> ([moros#2](https://github.com/jjstwerff/moros/issues/2)).

Three loft packages implement the Moros scene system as WASM modules loadable into
HTML pages. They live under `lib/` in this project and reference loft at `../loft`.

```
../loft/                  ← loft interpreter + package toolchain
moros/
  lib/
    moros_map/            ← shared data model (no editor ops, no rendering)
    moros_editor/         ← edit operations, undo/redo, stencils
    moros_render/         ← 3-D WebGL renderer built on loft's graphics library
  html/
    moros_map.wasm        ← built by: make wasm-map
    moros_editor.wasm     ← built by: make wasm-editor
    moros_render.wasm     ← built by: make wasm-render
```

All three compile to WASM with `../loft/target/release/loft --native-wasm`.
The HTML pages load each WASM module independently; they do not share memory but
exchange data as JSON text strings.

---

## Cross-project setup

```
# Makefile additions
LOFT := ../loft/target/release/loft
LIB_PATH := lib

wasm-map:
	$(LOFT) --native-wasm $(LIB_PATH)/moros_map/src/moros_map.loft \
	        -o html/moros_map.wasm

wasm-editor:
	$(LOFT) --native-wasm $(LIB_PATH)/moros_editor/src/moros_editor.loft \
	        -o html/moros_editor.wasm

wasm-render:
	$(LOFT) --native-wasm $(LIB_PATH)/moros_render/src/moros_render.loft \
	        -o html/moros_render.wasm

# Native GLB export tool (writes .glb files for Blender / viewer validation)
glb-tool:
	$(LOFT) --native $(LIB_PATH)/moros_render/src/moros_glb_tool.loft \
	        -o bin/moros_glb

glb: glb-tool
	bin/moros_glb $(MAP) html/scene-preview.glb

wasm: wasm-map wasm-editor wasm-render

editor: wasm
	firefox html/scene-editor.html
```

The loft binary at `../loft` must be built first (`cd ../loft && cargo build --release`).
The loft `graphics` package at `../loft/lib/graphics` is referenced by path from
`moros_render/loft.toml`.

---

## Dependency graph

```
moros_map  ←── moros_editor
           ←── moros_render ←── graphics  (../loft/lib/graphics)
```

`moros_map` has no loft-package dependencies. It is a pure-loft package.
`moros_editor` and `moros_render` each compile to a self-contained WASM module
that includes the `moros_map` types inline (no cross-WASM imports needed).

---

## Package: `moros_map`

The data model. Types mirror the SCENE_MAP.md specification exactly so that JSON
produced by any module is interchangeable.

### Layout

```
lib/moros_map/
  loft.toml
  src/
    moros_map.loft    ← entry; re-exports everything
    types.loft        ← Hex, Chunk, Map, palette types
    palette.loft      ← MaterialDef, WallDef, ItemDef; well-known index constants
    spawn.loft        ← SpawnPoint, NpcRoutine, NpcWaypoint, enums
    serial.loft       ← map_to_json(), map_from_json(); hex address helpers
  tests/
    types.loft
    serial.loft
```

### `loft.toml`

```toml
[package]
name    = "moros_map"
version = "0.1.0"
loft    = ">=0.9"

[library]
entry = "src/moros_map.loft"
```

### Key types (`types.loft`)

```loft
pub struct HexAddress {
  ha_q:  integer not null,
  ha_r:  integer not null,
  ha_cy: integer not null,
}

// 8 bytes — matches SCENE_MAP.md Hex struct exactly.
// item_rotation packs rotation (bits 0-4), spawn_flag (bit 5), waypoint_flag (bit 6).
pub struct Hex {
  h_height:        integer not null,  // u16 height units
  h_material:      integer not null,  // MaterialPalette index
  h_item:          integer not null,  // ItemPalette index
  h_item_rotation: integer not null,  // packed: rotation | spawn<<5 | waypoint<<6
  h_wall_n:        integer not null,  // WallPalette index, N edge
  h_wall_ne:       integer not null,  // WallPalette index, NE edge
  h_wall_se:       integer not null,  // WallPalette index, SE edge
}

pub fn hex_rotation(h: Hex) -> integer { h.h_item_rotation & 31 }
pub fn hex_spawn_flag(h: Hex) -> boolean { (h.h_item_rotation >> 5) & 1 == 1 }
pub fn hex_waypoint_flag(h: Hex) -> boolean { (h.h_item_rotation >> 6) & 1 == 1 }

pub struct Chunk {
  ck_cx: integer not null,
  ck_cy: integer not null,
  ck_cz: integer not null,
  ck_hexes: vector<Hex> not null,  // 32×32 = 1024 entries; index = hx*32+hz
}

pub struct Map {
  m_name:             text not null,
  m_chunks:           vector<Chunk> not null,
  m_material_palette: vector<MaterialDef> not null,
  m_wall_palette:     vector<WallDef> not null,
  m_item_palette:     vector<ItemDef> not null,
  m_door_states:      vector<DoorState> not null,
  m_spawn_points:     vector<SpawnPoint> not null,
  m_npc_routines:     vector<NpcRoutine> not null,
}
```

### Palette types (`palette.loft`)

```loft
pub struct MaterialDef {
  md_name:       text not null,
  md_category:   text not null,   // "terrain" | "floor" | "stair" | "spiral_stair" | "grand_arc_stair" | "roof" | "water" | "void"
  md_stair_kind: text not null,   // "LINEAR" | "SPIRAL" | "GRAND_ARC"
  md_texture:    integer not null,
  md_tint_r:     integer not null,
  md_tint_g:     integer not null,
  md_tint_b:     integer not null,
  md_walkable:   boolean not null,
  md_swimmable:  boolean not null,
  md_climbable:  boolean not null,
  md_slippery:   boolean not null,
  md_loud:       boolean not null,
}

pub struct WallDef {
  wd_name:      text not null,
  wd_body:      text not null,    // "SOLID"|"HALF_HEIGHT"|"FENCE"|"BATTLEMENT"|"THICK_FLAT"|"THICK_CURVED"|"ROAD_GUIDE"
  wd_base:      text not null,    // "WOOD"|"BRICKS"|"STONE" etc.
  wd_thickness: single not null,  // metres; 0.0 = default thin (WALL_HALF*2)
  wd_texture:   integer not null,
  wd_tint_r:    integer not null,
  wd_tint_g:    integer not null,
  wd_tint_b:    integer not null,
}

pub struct ItemDef {
  id_name:       text not null,
  id_kind:       text not null,   // "PILLAR"|"TREE"|"FURNITURE"|"CONTAINER" etc.
  id_model:      integer not null,
  id_symmetric:  boolean not null,
  id_arc_radius: single not null,
}
```

### Spawn and NPC types (`spawn.loft`)

```loft
pub struct SpawnPoint {
  sp_hex:       HexAddress not null,
  sp_kind:      text not null,   // "CREATURE" | "NPC"
  sp_creature:  integer not null,
  sp_npc_id:    integer not null,
  sp_count:     integer not null,
  sp_facing:    integer not null,
  sp_condition: text not null,   // "ALWAYS"|"NIGHT_ONLY"|"DAY_ONLY"|"TRIGGER"|"RANDOM"
}

pub struct NpcWaypoint {
  wp_hex:        HexAddress not null,
  wp_activity:   text not null,   // "STAND"|"SIT"|"SLEEP"|"WORK"|"EAT"|"PATROL"|"WANDER"|"TALK"|"GUARD"|"REQUISITION"
  wp_time_start: integer not null,
  wp_time_end:   integer not null,
  wp_facing:     integer not null,
  wp_note:       text not null,
}

pub struct NpcRoutine {
  nr_npc_id:   integer not null,
  nr_name:     text not null,
  nr_creature: integer not null,
  nr_waypoints: vector<NpcWaypoint> not null,
}
```

### Serialisation (`serial.loft`)

```loft
// Serialise the entire map to a JSON string.
pub fn map_to_json(m: Map) -> text {
  "{m:j}"
}

// Deserialise a JSON string back to a Map.
// Returns a default empty Map on parse failure.
pub fn map_from_json(json: text) -> Map {
  Map.parse(json) ?? map_empty()
}

pub fn map_empty() -> Map {
  Map {
    m_name: "untitled",
    m_chunks: [],
    m_material_palette: well_known_materials(),
    m_wall_palette:     well_known_walls(),
    m_item_palette:     well_known_items(),
    m_door_states: [],
    m_spawn_points: [],
    m_npc_routines: [],
  }
}

// Resolve global (q, r, cy) to the Hex at that address.
// Returns null if the chunk does not exist or the hex is out of bounds.
pub fn map_get_hex(m: Map, q: integer, r: integer, cy: integer) -> Hex? {
  cx = q / 32
  hx = q % 32
  cz = r / 32
  hz = r % 32
  chunk = m.m_chunks |> first(|c| { c.ck_cx == cx && c.ck_cy == cy && c.ck_cz == cz })
  chunk ?? null |> map(|c| { c.ck_hexes[hx * 32 + hz] })
}

pub fn map_set_hex(m: Map, q: integer, r: integer, cy: integer, h: Hex) -> Map {
  // returns a new Map with the hex replaced (functional update)
  ...
}
```

---

## Package: `moros_editor`

Implements all edit operations, the undo/redo stack, slope gradient, stencil stamping,
and spawn/waypoint management. This is the logic backend for `scene-editor.html`.

### Layout

```
lib/moros_editor/
  loft.toml
  src/
    moros_editor.loft   ← entry; exports pub API; holds editor state as module-level Map
    hex_ops.loft        ← material paint, height set, wall set, item place
    undo.loft           ← HexEdit/SpawnEdit records, undo stack, undo()/redo()
    slope.loft          ← slope_paint(): line interpolation across hex path
    stencils.loft       ← StencilDef, built-in stencils, stamp()
    spawn_ops.loft      ← spawn_add(), spawn_remove(), waypoint_add(), waypoint_remove()
  tests/
    hex_ops.loft
    undo.loft
    slope.loft
    stencils.loft
```

### `loft.toml`

```toml
[package]
name    = "moros_editor"
version = "0.1.0"
loft    = ">=0.9"

[library]
entry = "src/moros_editor.loft"

[dependencies]
moros_map = { path = "../moros_map" }
```

### Public API (`moros_editor.loft`)

The editor holds one mutable `Map` as module-level state. All `pub fn` at the top level
of this file are exported as WASM entry points.

```loft
use moros_map

// ── Lifecycle ──────────────────────────────────────────────────────────────

// Initialise editor state from a JSON string (or start empty if json is "").
pub fn editor_init(json: text) {
  state_map = if json == "" { map_empty() } else { map_from_json(json) }
  undo_clear()
}

// Serialise current map state to JSON.
pub fn editor_save() -> text {
  map_to_json(state_map)
}

// ── Hex operations ─────────────────────────────────────────────────────────

pub fn hex_paint_material(q: integer, r: integer, cy: integer, material: integer) { ... }
pub fn hex_set_height(q: integer, r: integer, cy: integer, height: integer) { ... }
pub fn hex_adjust_height(q: integer, r: integer, cy: integer, delta: integer) { ... }
pub fn hex_place_item(q: integer, r: integer, cy: integer, item: integer, rotation: integer) { ... }
pub fn hex_remove_item(q: integer, r: integer, cy: integer) { ... }

// ── Wall operations ────────────────────────────────────────────────────────

// dir: "N"|"NE"|"SE"|"S"|"SW"|"NW"  (S/SW/NW are resolved to the owning neighbour)
pub fn edge_set_wall(q: integer, r: integer, cy: integer, dir: text, wall: integer) { ... }

// ── Slope tool ─────────────────────────────────────────────────────────────

// Interpolate heights linearly along the shortest hex path from (q0,r0) to (q1,r1).
pub fn slope_path(q0: integer, r0: integer, q1: integer, r1: integer, cy: integer,
                  h_start: integer, h_end: integer) { ... }

// As above but spread across a band of `width` hexes centred on the path.
pub fn slope_band(q0: integer, r0: integer, q1: integer, r1: integer, cy: integer,
                  h_start: integer, h_end: integer, width: integer) { ... }

// ── Stencils ───────────────────────────────────────────────────────────────

// orientation: 0-11 (6 rotations × 2 mirrors)
// mode: "replace" | "overlay" | "heights" | "structure"
pub fn stencil_stamp(name: text, q: integer, r: integer, cy: integer,
                     orientation: integer, mode: text) { ... }

// List available stencil names as a JSON array of strings.
pub fn stencil_list() -> text { ... }

// Return a stencil definition as JSON (for editor preview thumbnail).
pub fn stencil_get(name: text) -> text { ... }

// Save the currently selected hexes as a new named stencil.
// selection_json: JSON array of {q,r,cy} objects.
pub fn stencil_save(name: text, category: text, selection_json: text) { ... }

// ── Spawn and waypoints ────────────────────────────────────────────────────

pub fn spawn_add(q: integer, r: integer, cy: integer, spawn_json: text) { ... }
pub fn spawn_remove(q: integer, r: integer, cy: integer, index: integer) { ... }
pub fn spawn_list(q: integer, r: integer, cy: integer) -> text { ... }

pub fn waypoint_add(npc_id: integer, waypoint_json: text) { ... }
pub fn waypoint_remove(npc_id: integer, index: integer) { ... }
pub fn routine_list() -> text { ... }
pub fn routine_get(npc_id: integer) -> text { ... }

// ── Undo / redo ────────────────────────────────────────────────────────────

// Returns true if an edit was reverted; false if the stack was empty.
pub fn undo() -> boolean { ... }
pub fn redo() -> boolean { ... }
pub fn undo_stack_depth() -> integer { ... }
```

### Undo record types (`undo.loft`)

```loft
enum EditKind {
  HexField(HexFieldEdit),
  Spawn(SpawnListEdit),
  Waypoint(WaypointListEdit),
  Batch(vector<EditKind>),   // grouped operation for multi-hex paint
}

struct HexFieldEdit {
  fe_address:   HexAddress not null,
  fe_field:     text not null,     // "height"|"material"|"item"|"item_rotation"|"wall_n"|"wall_ne"|"wall_se"
  fe_old_value: integer not null,
  fe_new_value: integer not null,
}

struct SpawnListEdit {
  sl_address: HexAddress not null,
  sl_old:     vector<SpawnPoint> not null,
  sl_new:     vector<SpawnPoint> not null,
}

struct WaypointListEdit {
  wl_npc_id: integer not null,
  wl_old:    vector<NpcWaypoint> not null,
  wl_new:    vector<NpcWaypoint> not null,
}
```

### Stencil format (`stencils.loft`)

```loft
struct StencilHex {
  sh_dq:       integer not null,   // offset from stamp origin
  sh_dr:       integer not null,
  sh_height:   integer not null,   // 0 = "copy height from current map" (heights-only is additive)
  sh_material: integer not null,   // 0 = leave unchanged (overlay mode)
  sh_item:     integer not null,
  sh_item_rotation: integer not null,
  sh_wall_n:   integer not null,
  sh_wall_ne:  integer not null,
  sh_wall_se:  integer not null,
}

struct StencilDef {
  sd_name:     text not null,
  sd_category: text not null,
  sd_origin_q: integer not null,  // anchor hex within the stencil (default 0,0)
  sd_origin_r: integer not null,
  sd_hexes:    vector<StencilHex> not null,
}
```

The 12 orientations are applied by rotating/mirroring each `(sh_dq, sh_dr)` offset
and then rotating each `sh_wall_n/ne/se` direction index by the same angular step.
Wall palette indices are unchanged; only the edge assignment rotates.

---

## Package: `moros_render`

Generates 3-D geometry from a `Map` JSON string following the `SCENE_MAP_RENDER.md`
pseudocode, and submits it to a WebGL canvas via the loft `graphics` library.

### Layout

```
lib/moros_render/
  loft.toml
  src/
    moros_render.loft   ← entry; holds render state (Scene, Camera, loaded textures)
    geometry.loft       ← hex surfaces, wall slabs, slope faces, thick walls, cylinders
    stairs.loft         ← linear stair steps, spiral newel, grand arc treads
    items.loft          ← per-ItemKind 3-D geometry
    materials.loft      ← material index → Rgba tint; dev-art flat-shade colours
    camera.loft         ← Camera struct, orbit/pan/zoom, view+proj matrix
    picker.loft         ← screen XY ray → hex address (ray–hex intersection)
    glb_export.loft     ← map_export_glb(): build full scene, write GLB bytes
    moros_glb_tool.loft ← native CLI entry point (main); not compiled to WASM
  tests/
    geometry.loft       ← emit counts, vertex correctness for known layouts
    picker.loft
    glb_export.loft     ← round-trip: export small map, check GLB header + chunk sizes
```

### `loft.toml`

```toml
[package]
name    = "moros_render"
version = "0.1.0"
loft    = ">=0.9"

[library]
entry = "src/moros_render.loft"

[dependencies]
moros_map = { path = "../moros_map" }
graphics  = { path = "../../loft/lib/graphics" }
```

### Public API (`moros_render.loft`)

```loft
use moros_map
use graphics   // Scene, Camera, Mesh, Material, webgl_* from ../loft/lib/graphics

// ── Lifecycle ──────────────────────────────────────────────────────────────

// Bind the renderer to a <canvas> element and initialise the WebGL context.
// canvas_id: the HTML id attribute of the target <canvas>.
pub fn render_init(canvas_id: text) { ... }

// ── Per-frame render ───────────────────────────────────────────────────────

// Rebuild scene geometry from the current map JSON and submit a WebGL frame.
// Call once per animation frame (requestAnimationFrame) from JavaScript.
// map_json may be the same string as the previous frame; geometry is only
// rebuilt when the JSON changes (fingerprint comparison).
pub fn render_frame(map_json: text) { ... }

// ── Camera control ────────────────────────────────────────────────────────

// All delta values are in screen pixels.
pub fn camera_orbit(dx: single, dy: single) { ... }
pub fn camera_pan(dx: single, dy: single) { ... }
pub fn camera_zoom(delta: single) { ... }
pub fn camera_reset() { ... }

// Return current camera state as JSON (for editor sync).
pub fn camera_get() -> text { ... }
pub fn camera_set(json: text) { ... }

// ── Render options ────────────────────────────────────────────────────────

// active_cy: the layer shown at full brightness; others dimmed.
pub fn render_set_active_layer(cy: integer) { ... }
pub fn render_set_show_grid(v: boolean) { ... }
pub fn render_set_show_overlays(v: boolean) { ... }  // spawn/waypoint icons

// ── Picking ───────────────────────────────────────────────────────────────

// Cast a ray from screen (x, y) and return the JSON-encoded HexAddress of the
// first hex intersected, or "" if no hex was hit.
pub fn render_pick(screen_x: single, screen_y: single) -> text { ... }

// ── Material swatches ─────────────────────────────────────────────────────

// Return pixel data for a w×h procedural material swatch as a JSON int array.
// JS unpacks into ImageData via putImageData (see DEVELOPER_ART.md § WASM gap).
pub fn material_swatch_pixels(index: integer, w: integer, h: integer) -> text { ... }

// ── GLB export ────────────────────────────────────────────────────────────

// Build the full scene geometry for a Map and return a GLB 2.0 binary as a
// base64-encoded text string (for WASM → JS transfer via wasm_call).
// On the native side (moros_glb_tool) use file_write_bytes() instead.
pub fn map_export_glb(map_json: text) -> text { ... }
```

### Camera type (`camera.loft`)

```loft
struct RenderCamera {
  rc_target_x: single not null,   // world-space look-at point
  rc_target_y: single not null,
  rc_target_z: single not null,
  rc_azimuth:  single not null,   // horizontal orbit angle, radians
  rc_altitude: single not null,   // vertical orbit angle, radians (0 = horizon, π/2 = top)
  rc_distance: single not null,   // distance from target to eye
  rc_fov:      single not null,   // vertical field of view, radians
}
```

### Geometry generation (`geometry.loft`)

```loft
// These are the render-doc functions mapped directly to loft.
// They append to a shared MeshBuilder rather than calling emit_quad/emit_polygon
// directly so that all geometry is batched before upload.

fn draw_building(m: Map, chunks: vector<Chunk>, builder: MeshBuilder) { ... }
fn draw_wall(m: Map, h: Hex, q: integer, r: integer, cy: integer,
             wx: single, wz: single, dir: text, builder: MeshBuilder) { ... }
fn draw_thick_flat_wall(...) { ... }
fn draw_thick_curved_wall(...) { ... }
fn emit_cylinder_post(cx: single, cz: single, r: single,
                      y_base: single, y_top: single,
                      mat: Material, builder: MeshBuilder) { ... }
fn emit_hex_surface(wx: single, wz: single, y: single,
                    mat: Material, builder: MeshBuilder) { ... }
fn emit_slope_face(dir: text, wx: single, wz: single,
                   h_this: integer, h_nbr: integer,
                   mat: Material, builder: MeshBuilder) { ... }
```

The `MeshBuilder` accumulates `Vertex` and `Triangle` values (from `graphics/mesh.loft`)
and produces a `Mesh` that is uploaded to GPU memory once per dirty frame.

### GLB export (`glb_export.loft`)

`map_export_glb` drives the same geometry builders as the live renderer but
collects output into `graphics/glb.loft` instead of submitting to WebGL. One
`Mesh` is built per well-known material index; each gets a flat-shaded PBR
`Material` with the dev-art colour from the colour table in
[DEVELOPER_ART.md](DEVELOPER_ART.md).

```loft
use moros_map
use graphics   // Mesh, Scene, Material, glb_write_scene

// Build a graphics::Scene from a Map using flat-shaded dev-art colours.
fn build_glb_scene(m: Map) -> graphics::Scene {
  builder = mesh_builder_new()
  for chunk in m.m_chunks {
    draw_chunk(m, chunk, builder)
  }
  scene = graphics::scene("moros_export")
  for mat_idx in 0..m.m_material_palette.len() {
    mesh  = builder.finish_mesh(mat_idx)
    color = dev_art_color(m, mat_idx)   // from DEVELOPER_ART colour table
    mat   = graphics::material("{mat_idx}")
    mat.set_color(color.r as single / 255.0,
                  color.g as single / 255.0,
                  color.b as single / 255.0)
    scene.add_mesh(mesh)
    scene.add_material(mat)
    scene.add_node(graphics::node("{mat_idx}", mat_idx, mat_idx))
  }
  scene
}

// Entry point called by the WASM API (returns base64 GLB bytes).
pub fn map_export_glb(map_json: text) -> text {
  m     = map_from_json(map_json)
  scene = build_glb_scene(m)
  bytes = graphics::glb_write_scene(scene)  // from glb.loft
  base64_encode(bytes)
}
```

The native CLI tool (`moros_glb_tool.loft`) calls the same `build_glb_scene`
but writes raw bytes directly to disk instead of base64-encoding them.

### Material resolution and swatches (`materials.loft`)

`materials.loft` has three responsibilities:

1. **`dev_art_color(index)`** — returns the flat-shading RGBA for a well-known
   material index. Used by both the GLB exporter and the live renderer's
   dev-art fallback path.
2. **`material_swatch(index, w, h)`** — draws a procedural `Canvas` swatch for
   the editor palette. Uses `graphics::Canvas` primitives and `sin`/`cos` from
   the stdlib; no image files. See [DEVELOPER_ART.md](DEVELOPER_ART.md) for the
   full loft source.
3. **`resolve_material(m, index)`** — resolves a palette entry to a `graphics
   ::Material` for the live renderer; falls back to `dev_art_color` when no
   texture is assigned.

```loft
// Flat-shading colour for a well-known material index.
pub fn dev_art_color(index: integer) -> integer { ... }

// Flat-shading colour for a WallBase string.
pub fn dev_art_wall_color(base: text) -> integer { ... }

// Draw a w×h procedural swatch. Returns a Canvas with RGBA pixels.
pub fn material_swatch(index: integer, w: integer, h: integer) -> graphics::Canvas { ... }

// Return swatch pixel data as a JSON array (WASM bridge; no OpPngBytes needed).
pub fn material_swatch_pixels(index: integer, w: integer, h: integer) -> text {
    cv = material_swatch(index, w, h)
    "{cv.data:j}"
}

// Resolve a palette entry to a graphics::Material for the live renderer.
fn resolve_material(m: Map, mat_index: integer) -> graphics::Material {
    if mat_index == 0 { return graphics::material("open") }
    def  = m.m_material_palette[mat_index]
    mat  = graphics::material(def.md_name)
    col  = if def.md_tint_r != 0 or def.md_tint_g != 0 or def.md_tint_b != 0 {
               graphics::rgb(def.md_tint_r, def.md_tint_g, def.md_tint_b)
           } else {
               dev_art_color(mat_index)
           }
    mat.set_color(graphics::color_r(col) as single / 255.0,
                  graphics::color_g(col) as single / 255.0,
                  graphics::color_b(col) as single / 255.0)
    mat
}
```

---

## HTML integration pattern

Each WASM module is loaded once and called by the host JavaScript throughout the
page's lifetime. Loft's WASM host bridge (see `../loft/doc/claude/WASM.md`) provides
the `loftHost` namespace; the calling convention for exported `pub fn` follows the
standard loft WASM ABI.

### Editor page (`scene-editor.html`)

```javascript
// Load both WASM modules; share the same map JSON between them.
const editor  = await loft.load('moros_editor.wasm');
const preview = await loft.load('moros_render.wasm');

const saved = localStorage.getItem('moros_map') ?? '';
editor.call('editor_init', saved);
preview.call('render_init', 'preview-canvas');

// Paint a material when the user clicks a hex on the editor canvas.
function onHexClick(q, r, cy, material) {
  editor.call('hex_paint_material', q, r, cy, material);
  syncPreview();
}

// Sync the 3-D preview after each edit.
function syncPreview() {
  const json = editor.call('editor_save');
  localStorage.setItem('moros_map', json);
  preview.call('render_frame', json);   // geometry rebuilds only if json changed
}

// Animation loop for the 3-D preview.
function frame() {
  preview.call('render_frame', lastJson);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

### Game / DM rendering page

The game client loads only `moros_render.wasm`; no editor logic is needed.

```javascript
const render = await loft.load('moros_render.wasm');
render.call('render_init', 'game-canvas');
render.call('render_set_active_layer', 0);

// Receive updated map from the server (WebSocket or localStorage).
function onMapUpdate(mapJson) {
  lastJson = mapJson;
}

function frame() {
  render.call('render_frame', lastJson);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Camera drag.
canvas.addEventListener('mousemove', e => {
  if (e.buttons & 1) render.call('camera_orbit', e.movementX, e.movementY);
  if (e.buttons & 4) render.call('camera_pan',   e.movementX, e.movementY);
});
canvas.addEventListener('wheel', e => render.call('camera_zoom', e.deltaY));

// Hex picking for DM interaction.
canvas.addEventListener('click', e => {
  const addr = render.call('render_pick', e.offsetX, e.offsetY);
  if (addr !== '') onHexPicked(JSON.parse(addr));
});
```

---

## Cross-reference

| Topic | Document |
|---|---|
| Map data format | [SCENE_MAP.md](SCENE_MAP.md) |
| Rendering pseudocode | [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md) |
| Editor UI design | [SCENE_EDITOR.md](SCENE_EDITOR.md) |
| Developer art — icons, swatches, GLB colours | [DEVELOPER_ART.md](DEVELOPER_ART.md) |
| Loft language reference | `../loft/doc/claude/LOFT.md` |
| Loft WASM architecture | `../loft/doc/claude/WASM.md` |
| Loft graphics / WebGL library | `../loft/doc/claude/OPENGL.md` |
| Loft package format | `../loft/doc/claude/PACKAGES.md` |
| Loft standard library | `../loft/doc/claude/STDLIB.md` |
