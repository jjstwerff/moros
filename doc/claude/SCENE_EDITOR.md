# Scene Editor — UI Design

A browser-based map editor for Moros scene maps. Runs as `html/scene-editor.html` alongside
the existing DM tool and character creator. All edits modify the in-memory `Map` object
(see SCENE_MAP.md) and are saved to `localStorage` or exported as JSON.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR                                                                  │
│ [Select][Paint][Wall][Item][Height][Slope][Stencil][Spawn][Waypoint]    │
│ [Undo][Redo]  ──  Layer: cy [ 0 ▲▼]  ──  [Grid ☑] [Overlay ☑] [3D]   │
├──────────────────┬───────────────────────────────────┬───────────────────┤
│ PALETTE PANEL    │ CANVAS                            │ CONTEXT PANEL     │
│ (context-       │                                   │ (selected hex /   │
│  sensitive)     │   hex grid — 2-D top-down view    │  edge properties) │
│                 │                                   │                   │
│ 240 px wide     │   fills remaining width           │ 260 px wide       │
│                 │                                   │                   │
├──────────────────┴───────────────────────────────────┴───────────────────┤
│ STATUS BAR  q: 12  r: −4  cy: 0  h: 18  |  Material: stone_tiles        │
│             Tool: Paint Material         |  Item: table_wood  rot: 180°  │
└──────────────────────────────────────────────────────────────────────────┘
```

The three-column layout is fixed; the canvas scrolls and zooms independently.

---

## Toolbar

### Tool buttons

Each button activates a tool mode. Only one tool is active at a time.
Keyboard shortcut in parentheses.

| Button | Key | Mode |
|---|---|---|
| Select | S | Inspect and multi-select hexes |
| Paint | M | Paint material onto hexes |
| Wall | W | Set wall types on hex edges |
| Item | I | Place or remove items |
| Height | H | Raise / lower hex heights |
| Slope | L | Draw a linear height gradient between two hexes |
| Stencil | T | Stamp a saved building part onto the map |
| Spawn | P | Place or edit creature / NPC spawn points |
| Waypoint | Y | Place or edit NPC routine waypoints |

### Layer controls

```
Layer: cy [ 0 ▲▼]
```

- `▲` / `▼` buttons (or `Page Up` / `Page Down`) move to the next/previous `cy` layer.
- The canvas shows the **active layer** in full colour.
- Layers directly above and below are shown as translucent overlays (30 % opacity) so walls
  and structures above/below the editing plane remain visible.
- The label shows the current `cy` index.

### Other toolbar controls

| Control | Action |
|---|---|
| Undo (Ctrl+Z) | Revert last edit operation |
| Redo (Ctrl+Y) | Re-apply reverted edit |
| Grid ☑ | Toggle hex grid lines on the canvas |
| Overlay ☑ | Toggle spawn / waypoint icon overlays |
| 3D | Open the 3D preview window (read-only render of the current map) |

---

## Canvas

The canvas renders the hex grid as a **pointy-top** 2-D projection — a vertex at north and
south, flat edges east and west, odd rows offset half a hex east. Each hex is a regular
hexagon. (An earlier draft said flat-top; the implemented grid is pointy-top odd-r — see
[SCENE_MAP.md](SCENE_MAP.md) § Hex Geometry.)

### View controls

| Action | Input |
|---|---|
| Pan | Middle-click drag, or Space + left-drag |
| Zoom in / out | Scroll wheel |
| Zoom to fit | Home key |
| Zoom 1:1 | Numpad 1 |

### Hex rendering in editor view

Each hex is filled with a colour derived from its `material` (see Material Palette below).
Hex edges with `wall_type != OPEN` are drawn as thick coloured lines.
Item icons are drawn at the hex centre at a fixed size regardless of zoom.

**Overlay icons** (shown when Overlay is checked):
- Skull (🕱) — `spawn_flag` set
- Person (⚉) — `waypoint_flag` set
- These are always rendered on top of other content, at a small fixed size.

**Height shading**: hexes at higher absolute heights receive a lighter shade; hexes at depth
receive a darker shade. The range is normalised to the min/max heights visible in the current view.

**Selected hex**: highlighted with a bright outline and the context panel fills in on the right.

**Multi-select**: Shift+click adds to selection; drag-box selects all hexes inside the rectangle.

---

## Tool Modes

### Select (S)

Left-click a hex to select it; its properties appear in the context panel.
Shift+click adds or removes from the current selection.
Left-drag draws a selection rectangle.

Selected hexes can be:
- Deleted (Delete key — sets material to `open`, clears item and walls)
- Copied (Ctrl+C) and pasted as a new stencil (the paste operation enters Stencil mode)
- Height-equalised (right-click menu → "Set all to same height")

### Paint Material (M)

Left-click or drag to apply the selected material from the palette to hexes.
Right-click sets the hovered hex's material to `open` (void).

**Brush size** selector in the palette panel: 1, 7 (1 + ring), 19 (1 + 2 rings).

The painted hexes keep their existing height, walls, and items.

### Wall (W)

Hex edges are drawn as clickable strips slightly inside each boundary.

**Left-click an edge**: applies the selected wall type from the wall palette.
**Right-click an edge**: sets that edge to `open` (removes wall).
**Scroll wheel on an edge**: cycles through wall types in the palette.

The wall palette shows all wall types with a small material swatch and name. The selected
wall type is highlighted. Clicking a stall type in the palette also selects it as the
active type.

When the cursor is near a hex edge, the edge is highlighted before click.

Edge ownership follows SCENE_MAP rules: each hex stores three of its six edges — **NW, NE
and E** — and the editor resolves which hex owns a clicked edge, writing to the correct
field even when the user clicks from the neighbour's side. The stored fields are still
*named* `wall_n` / `wall_ne` / `wall_se`, and two of those names are wrong for the edges
they hold; the editor must follow the ownership table in
[SCENE_MAP.md](SCENE_MAP.md) § Hex Structure, not the identifiers.

### Item (I)

**Left-click an empty hex**: places the selected item at the default rotation.
**Left-click a hex with an item**: replaces the existing item.
**Right-click**: removes the item from that hex.
**R key** (before or after placing): rotates the item clockwise by one 15° step.
**Shift+R**: rotates counter-clockwise.
**Numpad 0–9**: jump to a specific rotation class (0 = N, 1 = NE, 2 = SE, etc.).

While hovering over a hex, a ghost of the selected item is shown at the current rotation.

The item palette (see below) is shown in the palette panel. Symmetric items show no rotation
indicator.

### Height (H)

The palette panel shows a **height value display** and increment controls.

**Left-click a hex**: sets it to the current height value.
**Left-drag**: paints the current height value across all hexes under the cursor.
**Scroll wheel**: increments or decrements the current height value by 1 (≈ 16 cm).
**Shift+scroll**: increments by 6 (≈ 1 m).
**Right-click drag**: lowers hexes by 1 unit per drag step.

**Relative mode** (toggle in palette panel): instead of setting an absolute height, adds or
subtracts from the existing height of each hex. Useful for raising a plateau without knowing
its exact height.

Hex surfaces are re-rendered immediately so slopes appear as you paint.

### Slope (L)

Draws a **linear height gradient** between two endpoint hexes along a chosen path.

1. Left-click the **start hex** — it is highlighted; a height input shows its current height.
2. Move the cursor toward the **end hex** — a preview line shows which hexes will be affected
   and their interpolated heights.
3. Left-click the **end hex** to commit. All hexes on the shortest hex-grid path between the
   two points receive interpolated heights.

**Shift+click end hex**: uses the full set of hexes in the bounding band (not just the path
centre-line) — paints a sloped plane across the band.

Height values at the endpoints can be adjusted in the palette panel before clicking the end.

The slope does not change materials or walls — it only sets heights. Use Paint after Slope to
material the surface.

### Stencil (T)

A stencil is a saved group of hexes carrying materials, heights, walls and items, stamped
onto the map in any of the 12 orientations.

**The mechanism is a shared library, not editor code.** A stencil is a *small field*;
stamping is *merging two fields*, arbitrated nearest-wins and order-free; and the 12
orientations are exact integer maps on the lattice, so a stamp at 300° is the same content
as at 0°, cell for cell. The editor drives that mechanism and owns none of it — see
[moros#5](https://github.com/jjstwerff/moros/issues/5). Which stencils exist stays Moros
content.

**While in Stencil mode**:
- Hover shows a **ghost preview** of the stencil at the cursor position.
- Left-click **stamps** the stencil (commits all hex data it contains).
- R / Shift+R rotates the stencil (6 steps × 2 mirrors = 12 orientations).
- Right-click **opens a radial menu**: rotate, mirror, cancel.

**Stencil palette** is shown in the palette panel (see below).

**Saving a new stencil**:
1. Use Select to choose the hexes to save.
2. Press Ctrl+Shift+S or use right-click menu → "Save as stencil…".
3. A dialog prompts for a name and optional category tag.
4. The stencil appears in the palette and is persisted in `localStorage`.

**Stencil merge options** (per stamp):
- **Replace** — overwrites all hex data in the target area (default).
- **Overlay** — only writes non-open materials and non-zero items; leaves existing data
  untouched where the stencil has void/empty.
- **Heights only** — copies heights only; leaves materials, walls, and items.
- **Structure only** — copies walls and items only; leaves heights and materials.

These options are toggled in the palette panel header when Stencil mode is active.

### Spawn (P)

Left-click a hex to **open the spawn editor panel** in the context panel:
- SpawnKind: `CREATURE` or `NPC` radio buttons.
- Creature dropdown (searches CreaturePalette from CREATURES.md).
- NPC dropdown (searches `map.npc_routines`).
- Count spinner (1–8, visible only for CREATURE).
- Facing dial (24-step ring, matches item_rotation encoding).
- SpawnCondition selector: `ALWAYS | NIGHT_ONLY | DAY_ONLY | TRIGGER | RANDOM`.
- "Add spawn" button — creates a new `SpawnPoint`; sets `spawn_flag` on the hex.
- "Remove" button — deletes the selected spawn entry and clears the flag if none remain.

Multiple spawn entries on the same hex are shown as a list; selecting one populates the
form.

Right-click a hex with a spawn → removes all spawn entries and clears the flag.

### Waypoint (Y)

Left-click a hex to **open the waypoint editor panel** in the context panel:
- NPC selector (dropdown from `map.npc_routines`; "+ New NPC" creates a routine).
- Activity selector (all `WaypointActivity` values listed with icons).
- Time range: `from [HH] to [HH]` (0–23, 24-hour).
- Facing dial.
- Note text field.
- "Add waypoint" button — appends the entry to the chosen NpcRoutine; sets `waypoint_flag`.
- "Remove" button — removes the selected waypoint entry.

Hovering over a waypoint-flagged hex shows a tooltip listing all NPC names and their
scheduled times at that hex.

---

## Palette Panel

The palette panel is context-sensitive. Its content switches automatically when the active
tool changes. Each section has a search/filter field at the top.

### Material Palette (shown for Paint tool)

A scrollable grid of material swatches. Each swatch shows:
- A coloured tile (the material's `tint` colour, category-coded border)
- The material name below it

**Category colour borders:**
| Category | Border colour |
|---|---|
| terrain | brown |
| floor | tan |
| stair / spiral_stair / grand_arc_stair | gold |
| roof | dark red |
| water | blue |
| void/open | grey |

Swatches are grouped under collapsible category headers. Clicking a swatch selects it as
the active material.

**Brush size row** below the grid: `● ⬡ ⬡⬡` buttons for radius 0 / 1 / 2.

**Recent materials** — the 6 most recently used materials appear as a pinned row at the top.

### Wall Palette (shown for Wall tool)

A scrollable list of wall definitions. Each row shows:
- A short horizontal wall preview strip rendered with the wall's material texture/tint
- The wall name
- Body type badge: `SOLID | HALF | FENCE | BATTLEMENT | THICK_FLAT | THICK_CURVED | ROAD`
- Thickness badge (only for thick walls): `1m | 2m | 3m | 4m`

Clicking a row selects it. Rows are grouped by body type under collapsible headers.

**Quick-clear button**: a prominent "Open (no wall)" entry always pinned at the top.

### Item Palette (shown for Item tool)

A scrollable grid of item icons, grouped by `ItemKind` under collapsible headers.

Each icon cell shows:
- A simple icon representing the item (generic silhouette by kind if no icon is available)
- The item name on hover (tooltip)

Groups:
- Structural (PILLAR, TREE, LADDER, NEWEL, ARC_PIVOT)
- Furniture
- Containers
- Lights
- Statues and Decorative
- Mechanisms
- Market and Inn
- Moros-specific

**Rotation display**: when a non-symmetric item is selected, a 24-point compass dial appears
below the grid showing the current rotation. Clicking the dial sets the rotation directly.

**Recent items** — 6 pinned at the top.

### Height Palette (shown for Height tool)

```
  Current height
  ┌───────────────────────────┐
  │   [ 18 ]  height units   │
  │   ≈  3.0 m above ground  │
  └───────────────────────────┘
  [−6] [−1]  [+1]  [+6]     ← step buttons (1m / 16cm)

  Mode:  ○ Absolute  ● Relative

  Gradient preview
  ┌───────────────────────────┐
  │  min  0 ──────────── 30  │  height scale of visible hexes
  │  [■■■■□□□□□□□□□□□□□□]   │  current value marker
  └───────────────────────────┘
```

The gradient preview shows where the current height sits within the map's height range,
helping the DM set heights consistently without remembering absolute values.

### Slope Palette (shown for Slope tool)

```
  Start height  [ 0  ]   (auto-filled when start hex is clicked)
  End height    [ 18 ]   (editable; also auto-filled from end hex)

  Spread: ○ Path only  ● Band  width [ 3 ] hexes

  Preview colours:
    ■ raised  □ lowered  ░ unchanged
```

### Stencil Palette (shown for Stencil tool)

A scrollable grid of stencil thumbnails. Each card shows:
- A miniature top-down rendering of the stencil hexes
- The stencil name below
- A category tag (e.g., "Inn", "Market", "House", "Terrain", "Custom")

Built-in stencils are grouped under "Standard" and cannot be deleted. Custom stencils appear
under "Custom" and have a delete (✕) button.

**Stamp options bar** (shown above the grid when a stencil is selected):
```
  [Replace ▼]   [R] Rotate   [M] Mirror   Current: orientation 3/12
```

**Standard stencils provided:**

| Name | Category | Size | Contents |
|---|---|---|---|
| `inn_ground` | Inn | 6×4 hexes | Kitchen, storage, counter, common room, hearth |
| `inn_upper` | Inn | 6×3 hexes | 4 sleeping rooms with corridor |
| `inn_stable` | Inn | 4×3 hexes | Stable stalls, troughs, aisle |
| `market_row_4` | Market | 4×2 hexes | 4 stalls facing south + customer strip |
| `market_row_6` | Market | 6×2 hexes | 6 stalls facing south + customer strip |
| `food_market_sq` | Market | 7×7 hexes | Plaza with stalls on all four sides, fountain centre |
| `house_small` | House | 4×3 hexes | 2-room cottage, wood, pitched roof |
| `house_medium` | House | 6×4 hexes | 3-room house with yard wall |
| `tower_round` | Fortification | 3×3 hexes | THICK_CURVED round tower, cy 0 |
| `city_wall_8` | Fortification | 8×1 hexes | Straight city_wall run, 8 hexes |
| `gate_arch` | Fortification | 3×2 hexes | City gate with arch_opening, THICK_FLAT |
| `spiral_stair` | Interior | 3×3 hexes | 7-hex spiral stair cluster |
| `palace_steps` | Interior | 9×4 hexes | Grand arc staircase, 5 steps wide |
| `flat_terrain_32` | Terrain | 32×32 hexes | Blank flat ground at height 0 |
| `hill_dome` | Terrain | 7×7 hexes | Smooth dome hill, 12 units high at centre |
| `river_bend` | Terrain | 11×11 hexes | 90° river bend with banks |

---

## Context Panel

Shows properties of the **most recently clicked hex** and allows direct editing.
Updates live as the cursor moves in Select mode.

```
  ┌────────────────────────────────────────┐
  │ Hex  q: 12   r: −4   cy: 0            │
  ├────────────────────────────────────────┤
  │ Height    [ 18 ] units  ≈ 3.0 m       │
  │                                        │
  │ Material  [stone_tiles         ▼]      │
  │           floor · loud                 │
  │                                        │
  │ Item      [table_wood          ▼]      │
  │ Rotation  [  180°  ◄  ►]              │
  │           (symmetric — rotation hidden │
  │            for symmetric items)        │
  │                                        │
  │ Walls          (stored: NW NE E)       │
  │    NW*[stone   ▼]   NE*[open    ▼]    │
  │    W  [open    ▼]   E *[open    ▼]    │
  │    SW [open    ▼]   SE [open    ▼]    │
  │                                        │
  │ ☑ Spawn flag    [Edit spawn…]          │
  │ ☑ Waypoint flag [Edit waypoints…]      │
  └────────────────────────────────────────┘
```

Each field in the context panel is **directly editable**:
- Clicking the height number opens a small number input.
- Material and item dropdowns search the palette.
- Wall dropdowns for all six directions; owns-edge rules are enforced (SE, SW, W write to
  the neighbour's field transparently).
- Rotation `◄ ►` buttons step ±15°; clicking the angle opens a dial.
- "Edit spawn…" / "Edit waypoints…" scrolls the panel to show the spawn / waypoint
  sub-forms (same UI as Spawn and Waypoint tool modes, but triggered from the panel).

The context panel is always visible regardless of the active tool. This lets the DM hold the
Paint tool but still inspect a specific hex without mode-switching.

---

## Keyboard Reference

### Global

| Key | Action |
|---|---|
| S M W I H L T P Y | Switch tool mode |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+S | Save map to localStorage |
| Ctrl+E | Export map as JSON download |
| Ctrl+O | Open / import JSON map file |
| Home | Zoom to fit all hexes |
| Page Up / Page Down | Move cy layer up / down |
| Escape | Cancel current operation; deselect |

### Canvas navigation

| Key | Action |
|---|---|
| Scroll | Zoom in/out |
| Space + drag | Pan |
| Arrow keys | Pan by 1 hex |
| Shift + Arrow | Pan by 8 hexes |

### Tool-specific

| Key | Active tools | Action |
|---|---|---|
| R | Item, Stencil | Rotate clockwise 15° (item) or next orientation (stencil) |
| Shift+R | Item, Stencil | Rotate counter-clockwise / previous orientation |
| M | Stencil | Toggle mirror |
| 1 2 3 | Stencil | Switch merge mode (1=Replace, 2=Overlay, 3=Heights/Structure only) |
| Scroll | Height | Increment/decrement current height by 1 |
| Shift+Scroll | Height | Increment/decrement by 6 (≈ 1 m) |
| [ ] | Paint | Decrease / increase brush size |
| Delete | Select | Clear selected hexes (material → open) |
| Ctrl+C | Select | Copy selection as stencil |
| Ctrl+Shift+S | Select | Save selection as named stencil |

---

## Data Flow

Every edit produces one or more `HexEdit` records describing old and new hex state.
These are pushed onto the undo stack and applied to the in-memory map.

```
HexEdit {
  address:  HexAddress,
  field:    'height' | 'material' | 'item' | 'item_rotation' | 'wall_n' | 'wall_ne' | 'wall_se',
  old_value: u8 | u16,
  new_value: u8 | u16,
}
```

Wall edits on S/SW/NW edges are transparently re-written to the owning neighbour's N/NE/SE
field respectively, producing a `HexEdit` on the neighbour address.

`spawn_flag` and `waypoint_flag` edits write to `item_rotation` bits 5 and 6, preserving the
low 5 rotation bits: `new_rotation = (old & 0x1F) | (spawn << 5) | (waypoint << 6)`.

`SpawnPoint` and `NpcWaypoint` additions / removals produce `SpawnEdit` and `WaypointEdit`
records (not `HexEdit`) which are stored as a second undo list that is merged with the hex
undo list into a single shared undo stack — so Ctrl+Z always reverses the full logical operation.

---

## File Structure

> **This all-JavaScript layout is under review** —
> [moros#6](https://github.com/jjstwerff/moros/issues/6). One loft source already reaches
> the interpreter, a desktop window, the browser (`loft --html`) and a native Android APK,
> so a JavaScript editor *model* would serve exactly one host of four — and could not serve
> loft's Workbench at all, which needs the model server-side. The data model, tools, undo
> and stencil engine below are library concerns
> ([moros#7](https://github.com/jjstwerff/moros/issues/7)); what stays ours is the page.

| File | Role |
|---|---|
| `html/scene-editor.html` | Editor shell — layout, toolbar, panel scaffolding |
| `html/scene-editor.js` | Page glue: wiring the shell to the editor model |
| `html/style.css` | Shared styles (extended with editor-specific classes) |

The map model, the tool set, undo and the stencil engine are **not** in this table any
more: they are `hex_field` / `hex_editor`, shared with crawler, bumper airplanes and the
Workbench. Defining the data model in one place was always the goal — it just turned out
that place is a package, not a page.
