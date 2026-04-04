# Scene Editor — Implementation Plan

A building-scale hex map editor for dungeons, inns, and encounter maps. Built as
three loft WASM libraries plus a JavaScript front-end. The existing world-level
editor (`html/hex-map-editor.html`) will eventually share canvas and data format
but stays separate for now.

References:
- [SCENE_MAP.md](SCENE_MAP.md) — hex data format, coordinate system, chunk structure
- [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md) — 3-D geometry generation pseudocode
- [SCENE_EDITOR.md](SCENE_EDITOR.md) — full UI design (layout, tools, palettes, keyboard)
- [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) — loft package designs (`moros_map`, `moros_editor`, `moros_render`)
- [DEVELOPER_ART.md](DEVELOPER_ART.md) — flat-shade colours, procedural swatches

---

## Loft feature dependencies

Features the scene editor needs from loft. Items marked BLOCKED cannot be worked
around; items marked WORKAROUND have a pure-JS fallback path.

| Feature | Status | Used by | Impact |
|---|---|---|---|
| Structs, enums, vectors, JSON | Working | moros_map | -- |
| Pure-loft package deps | Working | moros_editor | -- |
| WASM compilation (`--native-wasm`) | Working | all three | -- |
| 2D Canvas rasterizer | Working | material swatches | -- |
| GLB binary writer | Working | GLB export | -- |
| Mat4/Vec3 math | Working | moros_render | -- |
| Mesh/Scene/Material types | Working | moros_render | -- |
| `#native` interpreter dispatch | Not yet | moros_render | BLOCKED for desktop test |
| WebGL API bindings | Not yet | moros_render | BLOCKED for 3-D preview |
| PNG/font native functions | Not yet | moros_render | WORKAROUND: procedural art |

---

## Strategy

Build bottom-up in layers that are each independently testable. The 2-D editor
canvas is pure JavaScript with no loft dependency. Loft libraries go data model
first, then editor ops, then 3-D rendering last (gated on WebGL bindings).

Phases 1 and 2 run in parallel. Phase 3 needs only the JSON format (not WASM).
Phase 6 is blocked on loft work outside this repo.

```
Phase 1 ──────────────────┬──> Phase 4 ──┐
  moros_map (pure loft)   |               |
                          |               v
Phase 2 ──> Phase 3 ─────┼──> Phase 5
  2D canvas   JS editor   |     advanced tools
  (pure JS)   logic       |
                          └──> Phase 6  (BLOCKED on loft WebGL)
                                3-D preview
```

---

## Phase 1 — Data model (`moros_map`)

Pure-loft package. No blockers.

Produces: `lib/moros_map/` package, `html/moros_map.wasm`.

Types spec: [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) section "Package: moros_map".
Coordinate system: [SCENE_MAP.md](SCENE_MAP.md) sections "Coordinate System" and "Hex Geometry".

| # | Step | Effort | Test |
|---|---|---|---|
| 1.1 | Package skeleton: `loft.toml`, `src/moros_map.loft` entry that re-exports | L | `loft check` passes |
| 1.2 | `types.loft` — `HexAddress`, `Hex` (8-byte packed), `Chunk`, `Map` | M | construct structs, read fields |
| 1.3 | `palette.loft` — `MaterialDef`, `WallDef`, `ItemDef` structs | M | construct with well-known values |
| 1.4 | Well-known palette constants (`well_known_materials()`, `well_known_walls()`, `well_known_items()`) | M | verify count and index 0 is "open" |
| 1.5 | `spawn.loft` — `SpawnPoint`, `NpcRoutine`, `NpcWaypoint` | L | construct, check fields |
| 1.6 | `serial.loft` — `map_empty()`, `map_to_json()` | M | empty map serialises to valid JSON |
| 1.7 | `serial.loft` — `map_from_json()` | M | round-trip: `map_from_json(map_to_json(m)) == m` |
| 1.8 | `serial.loft` — `map_get_hex()`, `map_set_hex()` | M | get/set on known chunk, cross-chunk boundary |
| 1.9 | Hex helper functions (`hex_rotation`, `hex_spawn_flag`, `hex_waypoint_flag`) | L | bit-pack/unpack round-trip |
| 1.10 | Makefile target `wasm-map` | L | `make wasm-map` produces `html/moros_map.wasm` |
| 1.11 | Browser smoke test — load WASM, call `map_to_json`/`map_from_json` from console | L | JSON round-trips in browser |

---

## Phase 2 — 2-D hex canvas (pure JavaScript)

No loft dependency. Reads the JSON format defined in Phase 1.

Produces: `html/scene-editor.html`, `html/scene-canvas.js`.

Canvas spec: [SCENE_EDITOR.md](SCENE_EDITOR.md) section "Canvas".
Hex geometry constants: [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md) section "Constants".
Visual style: reuse `html/map.css` variables and fonts from existing editor.

| # | Step | Effort | Test |
|---|---|---|---|
| 2.1 | `scene-canvas.js` — hex coordinate math: `world_pos(q,r)`, `hex_corners()`, axial neighbours | L | unit: known (q,r) produces expected (wx,wz) |
| 2.2 | `scene-canvas.js` — flat-top hex grid drawing on Canvas 2D (single cy layer) | M | render 10x10 grid of hexes, visually correct |
| 2.3 | `scene-canvas.js` — hit-testing: screen (x,y) to axial (q,r) | M | click centre of known hex, get correct coords |
| 2.4 | `scene-canvas.js` — pan (middle-click / space+drag) and zoom (scroll wheel) | M | pan and zoom, grid stays aligned |
| 2.5 | `scene-canvas.js` — material fill by tint colour | L | hexes with different materials show different colours |
| 2.6 | `scene-canvas.js` — height shading (lighter = higher, normalised to view range) | L | visible gradient across hexes of varying height |
| 2.7 | `scene-canvas.js` — wall edge rendering (thick coloured lines on hex edges) | M | walls visible on correct edges with correct colours |
| 2.8 | `scene-canvas.js` — item icon placeholder at hex centre | L | icon visible, fixed size regardless of zoom |
| 2.9 | `scene-canvas.js` — layer dimming (active cy full, +/-1 at 30% opacity) | L | switch layer, see adjacent layers faded |
| 2.10 | `scene-editor.html` — three-column layout (palette 240px, canvas, context 260px) | M | layout matches [SCENE_EDITOR.md](SCENE_EDITOR.md) wireframe |
| 2.11 | `scene-editor.html` — toolbar row (tool buttons, layer control, toggles) | M | buttons render, keyboard shortcuts switch tools |
| 2.12 | `scene-editor.html` — status bar showing `q r cy h material` | L | updates on hover/click |
| 2.13 | Hardcoded test map (JS object matching JSON format) for standalone testing | L | editor loads and renders without WASM |

---

## Phase 3 — JS editor logic

Pure JavaScript. Uses a thin JS map model that mirrors `moros_map` types as plain
objects. Same JSON format so the WASM swap in Phase 4 is seamless.

Produces: `html/scene-editor.js`.

Tool spec: [SCENE_EDITOR.md](SCENE_EDITOR.md) section "Tool Modes".
Palette spec: [SCENE_EDITOR.md](SCENE_EDITOR.md) section "Palette Panel".
Context panel spec: [SCENE_EDITOR.md](SCENE_EDITOR.md) section "Context Panel".
Data flow / undo spec: [SCENE_EDITOR.md](SCENE_EDITOR.md) section "Data Flow".

| # | Step | Effort | Test |
|---|---|---|---|
| 3.1 | JS map model — `createMap()`, `getHex()`, `setHexField()`, chunk auto-create | M | get/set round-trips, new chunk created on first write |
| 3.2 | Undo/redo engine — `HexEdit` records, push/pop stack, Ctrl+Z / Ctrl+Y | M | paint hex, undo reverts, redo restores |
| 3.3 | **Select tool (S)** — click to select, properties in context panel | M | click hex, see coords + fields in context panel |
| 3.4 | Select tool — shift+click multi-select, drag-box select | M | shift+click adds, drag selects rectangle |
| 3.5 | Select tool — Delete key clears selected hexes (material to open) | L | select + delete, hex becomes open |
| 3.6 | **Paint Material tool (M)** — click/drag applies material, right-click = open | M | paint 3 hexes, verify material changed |
| 3.7 | Paint tool — brush size selector (1 / 7 / 19), `[` `]` keys | M | brush 7 paints centre + ring |
| 3.8 | **Material palette panel** — colour swatches grouped by category, collapsible | M | click swatch selects material, categories fold |
| 3.9 | Material palette — recent materials row (6 most recent) | L | use 3 materials, recent row updates |
| 3.10 | **Wall tool (W)** — edge hit-testing (highlight nearest edge on hover) | M | hover near edge, see highlight |
| 3.11 | Wall tool — click edge applies wall type, right-click = open | M | set wall, verify correct edge on correct hex |
| 3.12 | Wall tool — edge ownership resolution (S/SW/NW writes to neighbour's N/NE/SE) | M | set S wall, verify stored on neighbour |
| 3.13 | **Wall palette panel** — rows grouped by body type | L | click row selects wall type |
| 3.14 | **Height tool (H)** — click/drag to set height value | M | paint height, hex shading updates |
| 3.15 | Height tool — scroll to adjust current value (+1 / shift +6) | L | scroll changes value in palette display |
| 3.16 | Height tool — absolute / relative mode toggle | L | relative mode adds delta to existing height |
| 3.17 | **Height palette panel** — value display, step buttons, gradient preview | L | display updates with current value |
| 3.18 | **Item tool (I)** — click to place, right-click to remove | M | place item, see icon on hex |
| 3.19 | Item tool — R / Shift+R rotation, ghost preview on hover | M | rotate before placing, ghost visible |
| 3.20 | **Item palette panel** — icon grid grouped by ItemKind, rotation dial | M | click icon selects item, dial shows rotation |
| 3.21 | **Context panel** — hex property inspector (height, material, item, walls) | M | select hex, all fields shown and editable |
| 3.22 | Context panel — inline editing (change material dropdown, height input) | M | edit field, hex updates, undo works |
| 3.23 | Save to localStorage (Ctrl+S) | L | save, reload page, map restored |
| 3.24 | Export JSON download (Ctrl+E) | L | downloads .json file |
| 3.25 | Import JSON file (Ctrl+O) | L | load file, map replaced |

---

## Phase 4 — Loft editor operations (`moros_editor`)

Depends on Phase 1. Pure loft, no native dependencies.

Produces: `lib/moros_editor/` package, `html/moros_editor.wasm`.

API spec: [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) section "Package: moros_editor".
Undo types: [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) section "Undo record types".
Stencil format: [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) section "Stencil format".

| # | Step | Effort | Test |
|---|---|---|---|
| 4.1 | Package skeleton: `loft.toml` (depends on moros_map), `src/moros_editor.loft` | L | `loft check` passes |
| 4.2 | `hex_ops.loft` — `hex_paint_material`, `hex_set_height`, `hex_adjust_height` | M | paint + read back, height set + read back |
| 4.3 | `hex_ops.loft` — `hex_place_item`, `hex_remove_item` | L | place + verify, remove + verify gone |
| 4.4 | `hex_ops.loft` — `edge_set_wall` with direction resolution (S/SW/NW to neighbour) | M | set all 6 directions, verify storage |
| 4.5 | `undo.loft` — `EditKind` enum (`HexField`, `Spawn`, `Waypoint`, `Batch`) | L | construct each variant |
| 4.6 | `undo.loft` — undo stack, `undo()` / `redo()` / `undo_stack_depth()` | M | paint, undo, redo, verify state at each step |
| 4.7 | `undo.loft` — batch edits (multi-hex paint grouped as single undo step) | M | paint brush-7, single undo reverts all 7 |
| 4.8 | `slope.loft` — `slope_path()` linear interpolation along hex-grid shortest path | M | slope 0-to-18 across 6 hexes, check interpolated heights |
| 4.9 | `slope.loft` — `slope_band()` with configurable width | M | band width 3, verify cross-section is uniform |
| 4.10 | `spawn_ops.loft` — `spawn_add`, `spawn_remove`, `spawn_list` | M | add spawn, list returns it, remove clears it |
| 4.11 | `spawn_ops.loft` — `waypoint_add`, `waypoint_remove`, `routine_list`, `routine_get` | M | add waypoint to routine, list/get confirm |
| 4.12 | `spawn_ops.loft` — spawn/waypoint flag bit-packing in `h_item_rotation` | L | add spawn sets bit 5, remove clears it |
| 4.13 | `stencils.loft` — `StencilDef` struct, `stencil_list()`, `stencil_get()` | L | list returns built-in names |
| 4.14 | `stencils.loft` — `stencil_stamp()` replace mode | M | stamp inn_ground, verify hex data written |
| 4.15 | `stencils.loft` — 12 orientations (6 rotations x 2 mirrors) for offset + wall rotation | M | stamp at orientation 3, verify rotated offsets |
| 4.16 | `stencils.loft` — overlay, heights-only, structure-only merge modes | M | overlay skips open hexes, heights-only ignores materials |
| 4.17 | `stencils.loft` — `stencil_save()` from selection JSON | L | save, list, get round-trips |
| 4.18 | Built-in stencil data (at least `house_small`, `flat_terrain_32`, `spiral_stair`) | M | stamp each, verify dimensions and content |
| 4.19 | `editor_init` / `editor_save` lifecycle (JSON in/out) | L | init from JSON, save returns same structure |
| 4.20 | Makefile target `wasm-editor` | L | `make wasm-editor` produces WASM |
| 4.21 | Wire WASM into `scene-editor.js` — replace JS model calls with `editor.call()` | M | same UX as Phase 3, data in loft module state |

---

## Phase 5 — Advanced tools (JS UI + WASM backend)

Depends on Phase 3 (JS tool framework) and Phase 4 (WASM ops for slope/stencil/spawn).

Produces: all 9 tool modes from [SCENE_EDITOR.md](SCENE_EDITOR.md).

| # | Step | Effort | Test |
|---|---|---|---|
| 5.1 | **Slope tool (L)** — click start hex, preview interpolated heights along path | M | click start, move cursor, see preview heights |
| 5.2 | Slope tool — click end hex to commit, band mode with width control | M | commit slope, heights match interpolation |
| 5.3 | **Slope palette panel** — start/end height inputs, spread toggle, preview colours | L | inputs auto-fill from clicked hexes |
| 5.4 | **Stencil tool (T)** — ghost preview at cursor position | M | hover shows stencil outline on grid |
| 5.5 | Stencil tool — click to stamp, R/Shift+R rotation, M mirror | M | stamp rotated stencil, data correct |
| 5.6 | Stencil tool — merge mode selector (replace/overlay/heights/structure) | L | switch mode, stamp behaviour changes |
| 5.7 | **Stencil palette panel** — thumbnail grid, category grouping, stamp options bar | M | click thumbnail selects, orientation shown |
| 5.8 | Copy selection as stencil (Ctrl+C from Select tool enters Stencil mode) | M | select hexes, Ctrl+C, ghost appears |
| 5.9 | Save custom stencil (Ctrl+Shift+S, name dialog, persists in localStorage) | L | save, appears in palette under "Custom" |
| 5.10 | **Spawn tool (P)** — click hex opens spawn editor in context panel | M | click, form appears with dropdowns |
| 5.11 | Spawn tool — add/remove spawn entries, multiple per hex | M | add 2 spawns, list shows both, remove one |
| 5.12 | Spawn tool — facing dial (24-step), condition selector | L | set facing + condition, persists on save |
| 5.13 | **Waypoint tool (Y)** — click hex opens waypoint editor | M | click, form with NPC selector + activity |
| 5.14 | Waypoint tool — time range, facing, note, add/remove | M | add waypoint, routine_get confirms |
| 5.15 | Waypoint tool — "+ New NPC" creates routine | L | create NPC, appears in dropdown |
| 5.16 | Overlay icons (spawn skull, waypoint person) toggled by toolbar checkbox | L | toggle off hides icons, on shows them |

---

## Phase 6 — 3-D preview (`moros_render`)

BLOCKED on loft WebGL bindings and `#native` interpreter dispatch. Neither feature
exists yet in `../loft/lib/graphics/`. See [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md)
section "Package: moros_render" for the full API.

Geometry pseudocode: [SCENE_MAP_RENDER.md](SCENE_MAP_RENDER.md).
Camera type: [LOFT_LIBRARIES.md](LOFT_LIBRARIES.md) section "Camera type".
Dev-art colours: [DEVELOPER_ART.md](DEVELOPER_ART.md).

### 6a — Geometry and export (no WebGL needed, pure loft)

Can start as soon as loft `graphics` package mesh/scene types work (they do).

| # | Step | Effort | Test |
|---|---|---|---|
| 6a.1 | Package skeleton: `loft.toml` (depends on moros_map + graphics) | L | `loft check` passes |
| 6a.2 | `materials.loft` — `dev_art_color()` colour table from [DEVELOPER_ART.md](DEVELOPER_ART.md) | L | index 1 returns expected RGB |
| 6a.3 | `geometry.loft` — `emit_hex_surface()` flat hex polygon | M | 6 vertices at correct world positions |
| 6a.4 | `geometry.loft` — `emit_slope_face()` per-edge slope triangles | M | slope between height 0 and 12 produces correct quads |
| 6a.5 | `geometry.loft` — `draw_wall()` thin wall slab for SOLID/HALF/FENCE/BATTLEMENT | M | wall quad at correct position, height from floor to ceiling |
| 6a.6 | `geometry.loft` — `draw_thick_flat_wall()` with corner posts | M | thick wall offset correct, cylinder posts at ends |
| 6a.7 | `geometry.loft` — `draw_thick_curved_wall()` arc segments | M | N_CYL_SEGS quads forming arc |
| 6a.8 | `geometry.loft` — `emit_cylinder_post()` | L | cylinder vertex count = N_CYL_SEGS * 2 |
| 6a.9 | `stairs.loft` — linear stair steps | M | step count and geometry from height delta |
| 6a.10 | `stairs.loft` — spiral stair newel + treads | M | treads fan around central cylinder |
| 6a.11 | `stairs.loft` — grand arc stair treads | M | arc radius from ItemDef, treads follow curve |
| 6a.12 | `items.loft` — per-ItemKind placeholder geometry (box/cylinder by kind) | M | each kind produces non-empty mesh |
| 6a.13 | `glb_export.loft` — `build_glb_scene()` assembles full scene from Map | M | scene has meshes grouped by material |
| 6a.14 | `glb_export.loft` — `map_export_glb()` returns base64 GLB bytes | M | decode base64, valid GLB header (magic + version) |
| 6a.15 | `camera.loft` — `RenderCamera` struct, orbit/pan/zoom, view+proj matrices | M | orbit changes azimuth, zoom changes distance |
| 6a.16 | `picker.loft` — screen ray to hex intersection | M | pick centre of known hex, returns correct address |
| 6a.17 | `materials.loft` — `material_swatch()` procedural swatch via graphics Canvas | M | swatch pixel data non-empty, correct dimensions |
| 6a.18 | Native CLI tool `moros_glb_tool.loft` — reads map JSON, writes .glb file | L | `bin/moros_glb test.json out.glb` produces valid file |

### 6b — Live WebGL preview (BLOCKED)

Requires: loft WebGL bindings, `#native` dispatch.

| # | Step | Effort | Test |
|---|---|---|---|
| 6b.1 | `render_init(canvas_id)` — create WebGL context via loft graphics | M | canvas shows blank with clear colour |
| 6b.2 | `render_frame(map_json)` — rebuild geometry + submit draw calls | M | flat-shaded hexes visible |
| 6b.3 | Camera mouse controls wired to `camera_orbit`/`camera_pan`/`camera_zoom` | L | drag orbits, scroll zooms |
| 6b.4 | `render_set_active_layer` — layer dimming in 3-D view | L | non-active layers appear transparent |
| 6b.5 | `render_set_show_grid` / `render_set_show_overlays` | L | toggles work |
| 6b.6 | `render_pick` — click in 3-D view returns hex address | M | click hex surface, correct (q,r,cy) returned |
| 6b.7 | Wire into editor — "3D" toolbar button, animation loop, sync on edit | M | edit in 2-D, 3-D updates |
| 6b.8 | Makefile targets `wasm-render`, `glb-tool`, `glb` | L | all build without errors |

### 6c — JS 3-D stopgap (optional, no loft blocker)

Lightweight JS WebGL that reads the same map JSON. Can be built any time after
Phase 3 to give 3-D feedback before loft WebGL lands. Replaced by 6b when ready.

| # | Step | Effort | Test |
|---|---|---|---|
| 6c.1 | Minimal WebGL hex surface renderer reading map JSON | M | flat-shaded hex grid visible |
| 6c.2 | Thin wall slabs | M | walls visible between hexes |
| 6c.3 | Orbit camera | L | drag to orbit |
| 6c.4 | Wire into editor as "3D" button target | L | toggle between 2-D and 3-D |

---

## Files

| File | Phase | Role |
|---|---|---|
| `lib/moros_map/loft.toml` | 1 | Package manifest |
| `lib/moros_map/src/moros_map.loft` | 1 | Entry, re-exports |
| `lib/moros_map/src/types.loft` | 1 | Hex, Chunk, Map |
| `lib/moros_map/src/palette.loft` | 1 | MaterialDef, WallDef, ItemDef |
| `lib/moros_map/src/spawn.loft` | 1 | SpawnPoint, NpcRoutine |
| `lib/moros_map/src/serial.loft` | 1 | JSON serialisation, hex access |
| `lib/moros_map/tests/types.loft` | 1 | Type construction tests |
| `lib/moros_map/tests/serial.loft` | 1 | Round-trip tests |
| `lib/moros_editor/loft.toml` | 4 | Package manifest |
| `lib/moros_editor/src/moros_editor.loft` | 4 | Entry, pub API |
| `lib/moros_editor/src/hex_ops.loft` | 4 | Paint, height, item, wall ops |
| `lib/moros_editor/src/undo.loft` | 4 | Undo stack |
| `lib/moros_editor/src/slope.loft` | 4 | Slope interpolation |
| `lib/moros_editor/src/spawn_ops.loft` | 4 | Spawn/waypoint CRUD |
| `lib/moros_editor/src/stencils.loft` | 4 | Stencil stamp engine |
| `lib/moros_editor/tests/*.loft` | 4 | 4 test files |
| `lib/moros_render/loft.toml` | 6 | Package manifest |
| `lib/moros_render/src/*.loft` | 6 | 8 source files |
| `lib/moros_render/tests/*.loft` | 6 | 3 test files |
| `html/scene-editor.html` | 2 | Editor shell |
| `html/scene-canvas.js` | 2 | 2-D hex renderer |
| `html/scene-editor.js` | 3 | Editor logic, tools, palettes |
| `html/scene-stencils.js` | 5 | Built-in stencil JS data |
| `html/map.css` | 2 | Extended with editor classes |
| `Makefile` | 1 | WASM build targets |

---

## Verification

| Phase | How to test |
|---|---|
| 1 | `loft test lib/moros_map` + browser console: load WASM, JSON round-trip |
| 2 | `make serve` then open `scene-editor.html` — hex grid, pan/zoom, click shows coords |
| 3 | Paint materials, place walls + items, undo/redo, save/load JSON file |
| 4 | `loft test lib/moros_editor` + editor uses WASM backend transparently |
| 5 | All 9 tools functional; stencil stamp, slope paint, spawn/waypoint persist |
| 6a | `loft test lib/moros_render` + `bin/moros_glb` exports valid .glb (open in Blender) |
| 6b | "3D" button in editor shows live flat-shaded scene, camera orbits, pick works |
