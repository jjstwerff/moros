# Moros — Loft Library Design

> **Partly superseded.** The package boundaries here are Moros-private; the substrate is
> now shared with crawler and split differently — see
> [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § The package map and
> [moros#1](https://github.com/jjstwerff/moros/issues/1). The `StencilDef` sketch below is
> superseded by the field-merge stencil mechanism
> ([moros#5](https://github.com/jjstwerff/moros/issues/5)). The type and API listings remain
> accurate as a description of the recovered `moros_*` packages
> ([moros#2](https://github.com/jjstwerff/moros/issues/2)).

Five loft packages implement the Moros scene system. **They exist and are tested** — in
loft's git history at `ade530c2^`, awaiting recovery into `lib/` by
[moros#2](https://github.com/jjstwerff/moros/issues/2).

```
moros/
  lib/
    moros_map/       ← data model AND its verbs: paint, height, item, wall, spawn,
                       routines, waypoints, slope  (364-line entry + types/palette/spawn)
    moros_editor/    ← undo/redo stack and stencils only  (456 lines)
    moros_render/    ← 3-D geometry generation  (1340 lines, 5 test files, 3 examples)
    moros_sim/       ← collision, player, tools, editor state  (5 sources, 11 tests)
    moros_ui/        ← panel, widgets, font, editor panel + click  (6 sources, 4 tests)
```

**There is no WASM-module-per-package story.** That was this document's original design and
it does not match how loft ships a program: `loft --html prog.loft` compiles the *whole
program* to one self-contained HTML file, and the same source also builds native and
Android. Packages are compile-time dependencies, not separately loaded modules — so nothing
here "exchanges JSON between WASM modules".

`--native-wasm` (used throughout this document's original build recipes) is the
**headless/server** target, roughly 4× heavier, and is not the browser build.
See [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § One program, four targets.

---

## Cross-project setup

One program, several targets — the editor is built, not assembled from modules:

```
# Makefile sketch — one entry program, one target flag per output
LOFT := loft
EDITOR := src/scene_editor.loft

editor-browser:                 # self-contained HTML, gl_* → WebGL2
	$(LOFT) --html $(EDITOR) -o html/scene-editor.html

editor-native:                  # desktop window, native GL
	$(LOFT) --native $(EDITOR) -o bin/scene-editor

editor-android:                 # signed APK; needs ANDROID_NDK_HOME/ANDROID_HOME/JAVA_HOME
	$(LOFT) --native-android $(EDITOR) -o build/scene-editor.apk

glb: ; $(LOFT) --native lib/moros_render/examples/moros_glb.loft -o bin/moros_glb

test: ; cd lib/moros_map && loft test    # and each sibling package
```

`graphics` comes from the **registry** (`graphics = ">=0.1"` in the recovered
`moros_render/loft.toml`), not by path from a loft checkout — it is a published package at
0.5.0 with GL, PNG, fonts and audio. The GLB tool stays a native build because the browser
target has no filesystem.

---

## Dependency graph

```
moros_map  ←── moros_editor
           ←── moros_render ←── graphics (registry, 0.5.0)
           ←── moros_sim
                moros_ui
```

`moros_map` has no loft-package dependencies. **This split is not final**: the data model,
stencils and renderer are moving to the shared substrate (`hex_field`, `hex_scene`,
`hex_editor`), which is [moros#1](https://github.com/jjstwerff/moros/issues/1). Read the
package boundaries here as *what the recovered code does today*, not as the target.

---

## Package: `moros_map`

The data model. Types mirror the SCENE_MAP.md specification exactly so that JSON
produced by any module is interchangeable.

### Layout

```
lib/moros_map/
  loft.toml
  src/
    moros_map.loft    ← entry: Map, serialisation, addressing, verbs, spawns, slope
    types.loft        ← HexAddress, Hex, Chunk
    palette.loft      ← MaterialDef, WallDef, ItemDef
    spawn.loft        ← SpawnPoint, NpcWaypoint, NpcRoutine
  tests/
    address.loft  edit.loft  negative_coords.loft  serial.loft
    slope.loft    smoke.loft spawn.loft            types.loft
```

There is no `serial.loft` — serialisation is in the entry module.

### `loft.toml`

```toml
[package]
name    = "moros_map"
version = "0.1.0"
loft    = ">=0.8"        # as recovered; expect a bump to current loft

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
  m_name:             text,
  m_chunks:           vector<Chunk>,
  m_material_palette: vector<MaterialDef>,
  m_wall_palette:     vector<WallDef>,
  m_item_palette:     vector<ItemDef>,
  m_spawn_points:     vector<SpawnPoint>,
  m_npc_routines:     vector<NpcRoutine>,
}
```

Two differences from the sketch this document used to carry, both checked against the
recovered source: there is **no `m_door_states`** field, and booleans in the palette types
are stored as `integer` (`md_walkable`, `id_symmetric`, …) rather than `boolean`.

The recovered sources also mark fields `not null`, a modifier **current loft has retired** —
`loft-libs-world` already migrated its own packages off it. Expect that cleanup as part of
[moros#2](https://github.com/jjstwerff/moros/issues/2).

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

### The real `moros_map` surface

Verified against the recovered source. Note that **`moros_map` holds the paint verbs**, the
spawn/routine/waypoint CRUD and the slope tools — this document originally placed those in
`moros_editor`, which is not what was built.

```loft
// Lifecycle + serialisation (serialisation lives in the entry module, not a serial.loft)
pub fn map_empty() -> Map
pub fn map_to_json(m: Map) -> text
pub fn map_from_json(json: text) -> Map          // empty Map on parse failure

// Addressing.  map_get_hex returns a Hex (a default one when absent), not an optional.
pub fn map_has_chunk(m: Map, q, r, cy) -> boolean
pub fn map_ensure_chunk(m: &Map, q, r, cy)
pub fn map_get_hex(m: Map, q, r, cy) -> Hex
pub fn map_set_hex(m: &Map, q, r, cy, h: Hex)

// Paint verbs — mutating, via &Map
pub fn map_paint_material(m: &Map, q, r, cy, material: integer)
pub fn map_set_height(m: &Map, q, r, cy, height: integer)
pub fn map_place_item(m: &Map, q, r, cy, item: integer, rotation: integer)
pub fn map_set_wall(m: &Map, q, r, cy, edge: integer, wall: integer)
pub fn map_set_wall_dir(m: &Map, q, r, cy, dir: integer, wall: integer)

// Spawns, routines, waypoints
pub fn spawn_add(m: &Map, sp: SpawnPoint)
pub fn spawn_count(m: Map) -> integer
pub fn spawn_at(m: Map, q, r, cy) -> vector<SpawnPoint>
pub fn spawn_remove(m: &Map, q, r, cy, npc_id: integer) -> boolean
pub fn routine_add(m: &Map, npc_id: integer, name: text, creature: integer)
pub fn routine_count(m: Map) -> integer
pub fn routine_index(m: Map, npc_id: integer) -> integer
pub fn routine_remove(m: &Map, npc_id: integer) -> boolean
pub fn waypoint_add(m: &Map, npc_id: integer, wp: NpcWaypoint) -> boolean
pub fn waypoint_count(m: Map, npc_id: integer) -> integer

// Geometry + shaping
pub fn hex_distance(q1, r1, q2, r2) -> integer
pub fn lerp_int(a, b, i, n) -> integer
pub fn slope_path(m: &Map, q1, r1, q2, r2, cy, h_start, h_end)
pub fn slope_band(m: &Map, q1, r1, q2, r2, cy, h_start, h_end, width)
```

**Two walls entry points exist** (`map_set_wall` by edge index, `map_set_wall_dir` by
direction) — which of them survives depends on the edge-naming fix in
[moros#3](https://github.com/jjstwerff/moros/issues/3).

`hex_distance` is lattice math and should not live here at all: that belongs to `hex_grid`,
which owns it once for every consumer.

The addressing helpers carry a hard-won detail worth keeping — euclidean division for
negative coordinates. C-style `%` maps `(-1, 1)` to the wrong cell *silently*, and
`tests/negative_coords.loft` exists because of it.

## Package: `moros_editor`

Implements all edit operations, the undo/redo stack, slope gradient, stencil stamping,
and spawn/waypoint management. This is the logic backend for `scene-editor.html`.

### Layout

```
lib/moros_editor/
  loft.toml
  src/
    moros_editor.loft   ← the whole package: UndoStack, verbs-with-undo, stencils
  tests/
    editkind.loft  lifecycle.loft  slope.loft  stencil.loft  undo.loft
```

One source file, not six — and no editor state module. The paint, slope and spawn
operations the old layout listed here live in `moros_map`.

### `loft.toml`

```toml
[package]
name    = "moros_editor"
version = "0.1.0"
loft    = ">=0.8"

[library]
entry = "src/moros_editor.loft"

[dependencies]
moros_map = { path = "../moros_map" }
```

### The real `moros_editor` surface

`moros_editor` is **undo and stencils only** — the paint verbs live in `moros_map`. And the
undo stack is an **explicit value threaded through each call**, not module-level state as
this document originally described. That matters: module state cannot serve two editor
views, an undo-per-document model, or the Workbench's server-side hosting.

```loft
// Undo / redo — the stack is passed in
pub fn undo_empty() -> UndoStack
pub fn undo_depth(s: UndoStack) -> integer
pub fn redo_depth(s: UndoStack) -> integer
pub fn batch_begin(s: &UndoStack)
pub fn batch_end(s: &UndoStack)
pub fn in_batch(s: UndoStack) -> boolean
pub fn undo_push(s: &UndoStack, m: Map, q, r, cy)
pub fn undo_pop(s: &UndoStack, m: &Map) -> boolean
pub fn redo(s: &UndoStack, m: &Map) -> boolean

// Every verb has an undo-recording twin
pub fn paint_material_with_undo(s: &UndoStack, m: &Map, q, r, cy, mat: integer)
pub fn set_height_with_undo(...)      pub fn adjust_height_with_undo(...)
pub fn place_item_with_undo(...)      pub fn remove_item_with_undo(...)
pub fn set_wall_with_undo(...)        pub fn set_wall_dir_with_undo(...)
pub fn slope_path_with_undo(...)      pub fn stencil_stamp_with_undo(...)

// Stencils
pub fn stencil_stamp(m: &Map, stencil: StencilDef, q, r, cy, mode: integer)
pub fn stencil_save(m: Map, name, category, q1, r1, q2, r2, cy) -> StencilDef
pub fn stencil_to_json(st: StencilDef) -> text
pub fn stencil_from_json(json: text) -> StencilDef
pub fn stencil_house_small() -> StencilDef
pub fn stencil_flat() -> StencilDef
pub fn stencil_spiral_stair() -> StencilDef

// Lifecycle
pub fn editor_init(json: text) -> Map
pub fn editor_save(m: Map) -> text
```

`mode` is an **integer**, not one of `"replace" | "overlay" | …`.

**The stencil half is superseded.** A stencil is a small field and stamping is a field
merge, with the 12 orientations as exact integer maps — the recovered implementation
transforms offsets and wall indices separately, which is two transformations that can
disagree. See [moros#5](https://github.com/jjstwerff/moros/issues/5). The three built-in
stencils are content and stay Moros-side wherever the mechanism ends up.

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
    moros_render.loft   ← the whole renderer: constants, hex→world, corners, surfaces,
                          walls (thin/thick/curved), slopes, stairs, camera, GLB  (~1340 lines)
  tests/
    adversarial.loft  avatar.loft  camera_modes.loft  geometry.loft  occlusion.loft
  examples/
    demo_village.loft  isolated_stair.loft  moros_glb.loft
```

One source file, not eight. **The API listings that follow are the original design sketch,
not a description of this code** — read `moros_render.loft` for what exists. Two facts from
it that the sketch gets wrong: `HEX_SIZE`/`HEX_WIDTH`/`HEX_ROW_HEIGHT` are unit-scale
constants (not metres), and `hex_to_world` implements the pointy-top odd-r lattice while its
own comments say "flat-top".

### `loft.toml`

```toml
[package]
name    = "moros_render"
version = "0.1.0"
loft    = ">=0.8"

[library]
entry = "src/moros_render.loft"

[dependencies]
moros_map = { path = "../moros_map" }
graphics  = ">=0.1"        # the registry package, now at 0.5.0 — not a path into a checkout
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

## Browser integration — how it actually works

The pattern this document used to describe — load `moros_editor.wasm` and
`moros_render.wasm` as separate modules, `call()` exported functions from JavaScript, pass
JSON between them — is not how loft ships to a browser, and would be the wrong architecture
even if it were possible.

**`loft --html prog.loft` compiles one program to one self-contained HTML file.** The
packages are compile-time dependencies linked into it. There is no per-package module, no
`loft.load()`, and no JSON marshalling between packages — inside the program they are just
function calls on shared values.

What the browser build does need is a **host seam**, because `--html` has no filesystem, no
args and no env:

| Direction | Mechanism |
|---|---|
| loft → page | `host_output(msg)` → `globalThis.loftOutput(msg)` |
| page → loft | `globalThis.loftPush(msg)`, popped by `host_input()` |

So saving a map is: the program `host_output`s a save request with the serialised document;
the JS shell writes it to `localStorage` or offers a download; a completion comes back
through `loftPush`. **loft stays pure compute and JavaScript owns the I/O** — which is the
same shape the Workbench's protocol uses, so satisfying one satisfies the other.

Rendering needs no bridge of ours at all: every `gl_*` call becomes a WebGL2 import
automatically, and the desktop-vs-ES shader header is rewritten inside `gl_create_shader`.

**Verify with the gate loft already ships**: headless Chrome with WebGL2, assert zero
console errors, then screenshot the canvas and require enough distinct colours to prove
something drew. It catches "compiles clean, blank canvas", which is the failure this work
will actually hit.

For the same source as a desktop window use `--native`; for a signed Android APK use
`--native-android`. See [EDITOR_SUBSTRATE.md](EDITOR_SUBSTRATE.md) § One program, four
targets.

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
