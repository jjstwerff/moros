---
render_with_liquid: false
---
# Open Issues — Design Solutions

Solutions for every item in `doc/Todo.txt` and the gaps between design and
implementation identified in the project assessment.

---

## Contents

- [Character editor](#character-editor)
- [Power and focus system](#power-and-focus-system)
- [Contact system](#contact-system)
- [World map editor](#world-map-editor)
- [Scene editor implementation plan](#scene-editor-implementation-plan)

---

## Character editor

### 1. Power validation and display

**Issue:** Powers like Magic, Druid, Shamanic, Religion need validation — do
they produce cards?  Descriptions and actions aren't shown.

**Design:**

Add a `power_detail` section to `character.js` that renders when a power row
is expanded (click/tap to toggle):

```
┌─────────────────────────────────────────────┐
│ ▼ Druid (Level 2)                    [+][-] │
│   Allows communion with natural spirits.     │
│   Produces cards: Nature's Grasp, Wild Shape │
│                                              │
│   Actions:                                   │
│   • Sense nearby animals (Perception)        │
│   • Calm a wild creature (Empathy)           │
│   • Ask spirits for guidance (Wisdom)        │
│                                              │
│   Related statistic: Wisdom                  │
│   Specializations: Herbalism, Beast Speech   │
└─────────────────────────────────────────────┘
```

**Data source:** `data.js` already has power definitions.  Add `actions`,
`produces_cards`, and `related_stat` fields to each power entry.  Cards are
produced when the power level reaches the card's `min_level`.

**Implementation:** ~60 lines in `character.js`:
- `renderPowerDetail(power, level)` — builds the expanded section
- Filter `DATA.cards` by `card.power === power.id && level >= card.min_level`
- Show `power.actions` (new field in data.js, array of `{text, stat}`)

### 2. Town and race selection reopening

**Issue:** Once a character's town and race are selected, the editor locks
them.  Should allow reopening for editing.

**Design:**

Change the lock behavior:
- On load of an existing character, show town/race as collapsed sections with
  an [Edit] button
- Clicking [Edit] expands the section and allows changing the selection
- Changing town/race resets dependent fields (contacts from old town, racial
  powers) with a confirmation dialog

```javascript
// In character.js
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.toggle('collapsed');
}

function onRaceChange(newRace) {
  if (character.race && character.race !== newRace) {
    if (!confirm('Changing race resets racial powers. Continue?')) return;
    character.racial_powers = [];
  }
  character.race = newRace;
  recalculate();
}
```

### 3. Easier progression

**Issue:** Adding/removing progression steps requires too many clicks.

**Design:**

Add inline buttons to the progression list:

```
┌──────────────────────────────────────────────┐
│ Progression                        [XP: 45]  │
│                                              │
│  1. Strength +1    (stat: 8→9)        [ × ] │
│  2. Druid +1       (power: 1→2)       [ × ] │
│  3. Perception +1  (stat: 5→6)        [ × ] │
│                                              │
│  Quick add:                                  │
│  [Str] [Dex] [Con] [Wis] [Emp] [Per] ...   │
│  [Druid +] [Magic +] [Shamanic +]           │
│                                              │
│  Available XP: [___45___]  Spent: 32         │
└──────────────────────────────────────────────┘
```

- **[×] button** on each step: removes that step and all after it (progression
  is sequential — can't remove from the middle)
- **Quick add buttons**: one click to add the next level of a stat or power
- **XP field**: editable total XP, progression validates against it
- **Effect preview**: each row shows the stat change (`8→9`)

**Implementation:**
- Add `renderProgressionRow(step, index)` with remove button
- Add `addProgressionStep(type, name)` — appends to progression, recalculates
- Add XP input field bound to `character.total_xp`
- Show XP cost per step (skip first 6 as per rules)

### 4. Rules section placement

**Issue:** Rules about character generation clutter the editor.

**Design:**

Move the rules `<details>` element after the generator/roster section.
Default state: closed.  CSS: slightly muted text color to distinguish from
active editor sections.

```html
<details class="rules-section">
  <summary>Character Creation Rules</summary>
  <!-- existing rules content -->
</details>
```

---

## Power and focus system

**Issue:** Rules about focus mechanics are not written.  Powers interact with
focus in complex ways that affect gameplay balance.

### Design: Focus mechanics

**Core rules:**

1. **Using a power increases focus on it.**
   Each time a power is activated in a scene, the character gains +1 focus
   on that power's statistic.

2. **Focus is distributed, not free.**
   Total focus across all statistics cannot exceed the character's level.
   Gaining focus on one stat reduces available focus for others.

3. **High focus has tradeoffs.**
   With 2+ focus on a statistic, all actions using OTHER statistics take a
   -1 penalty per excess focus point.

4. **Defocusing.**
   A character can spend a full turn to reduce focus on one statistic by 1.
   This frees a focus point for other uses.

5. **Maximum focus = power level.**
   Focus on a statistic cannot exceed the highest power level associated
   with that statistic.

6. **Growth bonus.**
   If a character had focus on a statistic during the session, that statistic
   gains double XP growth for the session's progression step.

### Data model additions

```javascript
// In logic.js — per-session tracking
character.session = {
  focus: {
    // stat_name → current focus points
    wisdom: 0,
    perception: 0,
    // ...
  },
  power_uses: {
    // power_id → times used this scene
    druid: 0,
    magic: 0,
  }
};

function usePower(character, powerId) {
  const power = DATA.powers[powerId];
  character.session.power_uses[powerId]++;
  character.session.focus[power.stat] =
    Math.min(character.session.focus[power.stat] + 1,
             character.powers[powerId]); // capped at power level
  recalcFocusPenalties(character);
}

function focusPenalty(character, stat) {
  const totalFocus = Object.values(character.session.focus).reduce((a,b) => a+b, 0);
  const thisFocus = character.session.focus[stat] || 0;
  const excessOnOthers = totalFocus - thisFocus;
  return excessOnOthers >= 2 ? -(excessOnOthers - 1) : 0;
}
```

### UI addition to DM tool

Add a "Focus" panel to the DM turn tracker:

```
┌─────────────────────────────────────────────┐
│ Aryn (Level 3)              Turn 4          │
│                                              │
│ Focus:  Wisdom ●●○  Perception ○○○          │
│         Empathy ○○  Strength ○○○            │
│                                              │
│ Penalties: Strength -1, Perception -1        │
│                                              │
│ [Defocus Wisdom] [Use Druid Power]          │
└─────────────────────────────────────────────┘
```

---

## Contact system

**Issue:** Contacts can be added but editing is incomplete.  Needs organization
links, specializations, complex contacts, and sharing.

### Design

**Contact data model** (add to `data.js` / `logic.js`):

```javascript
const contact = {
  id: 'contact_1',
  name: 'Aldric the Smith',
  description: 'Town blacksmith, suspicious of outsiders.',
  town: 'Millhaven',
  organization: 'Craftsmen Guild',   // references organizations list
  specializations: ['Weaponsmithing', 'Armor repair'],
  shared: true,                       // visible to whole group
  owner: 'player_1',                  // who added this contact
  complex: false,                     // if true, has a full character sheet
  character_id: null,                 // link to full character if complex
  // Relationship tracking
  disposition: 'neutral',             // friendly / neutral / hostile / unknown
  notes: '',                          // player notes
};
```

**Contact editor UI** (in `character-creator.html`):

```
┌─────────────────────────────────────────────┐
│ Contacts                           [+ Add]  │
│                                              │
│ ┌─ Aldric the Smith ───────── Millhaven ──┐ │
│ │  Craftsmen Guild · Weaponsmithing       │ │
│ │  Disposition: Neutral   [Shared ✓]      │ │
│ │  [Edit] [Full Sheet] [Remove]           │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─ Sister Maren ──────────── Millhaven ──┐ │
│ │  Temple of Light · Healing              │ │
│ │  Disposition: Friendly  [Personal]      │ │
│ │  [Edit] [Remove]                        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**[Full Sheet]** opens a modal with a complete character editor for the
contact — same UI as the player character editor but marked as an NPC.

**Sharing:** Contacts marked `shared: true` appear in all players' contact
lists.  Personal contacts are only visible to the owning player.  The DM
tool shows all contacts regardless of sharing.

---

## World map editor

### Road linking bug

**Issue:** Roads break when clicking non-adjacent tiles.

**Root cause:** The road tool assumes each click is on a tile adjacent to the
previous road endpoint.  When the user clicks a distant tile, the road tries
to connect directly, creating an invalid edge.

**Fix design:**

```javascript
// In map.js — road tool click handler
function onRoadClick(hex) {
  if (!roadStart) {
    roadStart = hex;
    return;
  }
  // Find shortest path between roadStart and hex
  const path = findHexPath(roadStart, hex);
  if (path.length === 0) {
    // No valid path — reset
    roadStart = null;
    return;
  }
  // Add road segments along the entire path
  for (let i = 0; i < path.length - 1; i++) {
    addRoadSegment(path[i], path[i+1]);
  }
  roadStart = hex; // continue from endpoint
}

// A* or BFS pathfinding on the hex grid
function findHexPath(from, to) {
  // Standard hex-grid A* with max distance limit (e.g. 20 hexes)
  // Returns array of hex coordinates from → to (inclusive)
  // Returns empty array if no path within limit
}
```

The fix adds pathfinding between clicks so the road follows the shortest
hex path instead of trying to make a direct connection.  A distance limit
(20 hexes) prevents accidental cross-map roads.

---

## Scene editor implementation plan

The scene editor has a 6-phase design in `SCENE_EDITOR_PLAN.md`.  Phases 1-3
have no external blockers and can start immediately.

### Recommended build order

**Sprint A: Data model + canvas (2-3 days)**
- Phase 1: Create `lib/moros_map/` with types, palette, serialization
- Phase 2: Create `html/scene-canvas.js` — hex grid rendering, pan/zoom

**Sprint B: Editor tools (3-4 days)**
- Phase 3: Create `html/scene-editor.js` — tool modes, undo, palettes
- Wire up `scene-editor.html` shell page

**Sprint C: Loft backend (when loft WASM ready)**
- Phase 4: Create `lib/moros_editor/` — loft implementations of edit ops
- Build WASM modules, connect to editor JS

**Sprint D: Advanced tools (2-3 days)**
- Phase 5: Slope, stencil, spawn, waypoint UIs

**Sprint E: 3D preview (when loft WebGL ready)**
- Phase 6a: GLB export (can start earlier)
- Phase 6b: Live WebGL preview in editor

### What's needed from loft before Phase 4

| Loft feature | Roadmap ID | Status |
|---|---|---|
| WASM compile (`--native-wasm`) | existing | ✓ working |
| Package dependencies in WASM | PKG.5 | ✓ working |
| WebGL bindings | GL6.1-6.4 | not started |
| Renderer | R1-R3 | not started |

Phase 4 can use the interpreter (`--native`) for desktop testing before WASM
is needed.  Phase 6b is the only hard blocker on loft's WebGL support.

---

## Priority order

1. **Scene editor Sprint A** — data model + canvas (medium effort, unlocks
   everything else, primary project focus)
2. **Scene editor Sprints B-E** — sequential, depends on Sprint A
3. **Character editor UX** — progression buttons, power details, rules
   placement (low effort, high user impact, no blockers)
4. **Focus rules** — write the rules, add to data.js, add DM UI
   (medium effort, enables gameplay depth)
5. **Contact system** — editor UI, sharing, complex contacts (medium effort)
6. **World map editor** — road bug and other fixes (deferred, not current focus)
