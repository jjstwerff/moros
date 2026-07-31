---
render_with_liquid: false
---
# Open Issues — Design Solutions

Solutions for every item in `doc/Todo.txt` and the gaps between design and
implementation identified in the project assessment.

⚠ **This file covers the Moros RPG TOOLKIT only.** The scene editor is lavition and
keeps its own documentation — [STATE.md](STATE.md) for where it stands,
[EDITOR_LADDER.md](EDITOR_LADDER.md) for the order of work. A build order for it
used to live here and had gone badly stale; see the last section for what happened.

⚠ **And a design here is a PROPOSAL, not a record.** The road-linking entry below
diagnosed a cause that turned out to be wrong and prescribed a fix that was already
in the code. When one of these is built, correct the entry with what was actually
found — an unrevised design reads like a finding.

---

## Contents

- [Character editor](#character-editor)
- [Power and focus system](#power-and-focus-system)
- [Contact system](#contact-system)
- [World map editor](#world-map-editor)
- [Scene editor — this file is NOT where its plan lives](#scene-editor--this-file-is-not-where-its-plan-lives)

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

### ✅ Road linking bug — FIXED 2026-07-31

**Issue:** Roads break; clicking a non-adjacent tile makes it worse.

**⚠ The root cause guessed here was wrong, and the fix it proposed was already
in the code.** This section used to say the tool "assumes each click is on a
tile adjacent to the previous endpoint" and to propose pathfinding. `map.js`
has had a Dijkstra with a live preview all along, and its click handler guards
a null path. Pathfinding was never missing.

**What was actually wrong:** a road is stored as **two half-edges** — each tile
carries a flag per direction, and the renderer draws *centre → edge-midpoint* —
so laying one road means setting a flag on both tiles, and the second has to be
the direction that points **back**. The mirror table was

```js
const ROAD_OPPOSITE = [3, 4, 5, 0, 1, 2];   // …and a second hand-written copy
```

which is the mirror of the **compass names** the file documented
(`['NE','E','SE','SW','W','NW']`, NE↔SW, E↔W, SE↔NW) — *not* of the offsets
those indices actually stand for. So every road put its second half on an edge
aimed at a **third tile**, and drew a stub going nowhere. A one-hex road already
showed it; a long path just multiplied it, which is why it read as "breaks when
a non-adjacent tile is clicked".

**Measured** from the renderer's own `hexCenter`: the true mirror is
`[1, 0, 3, 2, 5, 4]`, and it is parity-**in**dependent. With the shipped table
the two halves of a road land 15.6 px apart.

**And the names were the source of the error.** A direction index here is not a
compass direction — odd rows are shifted, so index 2 is NE on an even row and NW
on an odd one. No single list of six names can be right, and the one in the file
matched neither parity; the tile panel reported a water-flow direction wrongly on
every row of the map.

**The fix:** the lattice moved into one pure module, `html/hex-lattice.js`
(offsets, `MIRROR_DIR`, `dirName`, `hexCenter`) — the same "one home for the
lattice" rule the loft side of this project states as *"hex_grid owns the
lattice; a parity-blind copy is where this codebase breaks"*. `map.js` imports
it and both hand-written tables are gone.

**Gated** by `test/lattice.test.js` (10 tests): it re-derives the mirror from the
offsets over every cell on both parities rather than comparing one table with
another, checks that both halves of a road land on the same edge midpoint, and
carries the shipped table as an explicit control that must fail. A wrong constant
cannot survive being computed from the thing it describes.

`tools/map_road_shot.mjs` drives the real page — pick the road tool, click four
tiles across both parities, screenshot — because a pure test cannot say whether
the page still *wires* the geometry after the extraction.

---

## Scene editor — this file is NOT where its plan lives

⚠ **A five-sprint build order used to sit here, and every sprint of it had
already shipped in a different shape.** It called for *creating* `lib/moros_map/`
and `lib/moros_editor/` (both exist, with test suites), for `html/scene-canvas.js`
and `html/scene-editor.js` (never built — the editor became a loft **server** with
two renderers instead), and it listed loft's WebGL bindings as "not started" while
the wasm client has been drawing through them for weeks. Anyone reading it would
have concluded the scene editor had not begun.

It is deleted rather than corrected, because a second roadmap is a second thing to
keep in step and this one lost. **The scene editor is lavition** — its own product,
with its own documentation:

| Looking for | Go to |
|---|---|
| Where the work stands, right now | [STATE.md](STATE.md) — read first after a break |
| The rungs, their order, and the checkpoints | [EDITOR_LADDER.md](EDITOR_LADDER.md) |
| The design and its invariants | [HEX_STACK.md](HEX_STACK.md), [WORLD_MODEL.md](WORLD_MODEL.md) |
| The socket, message by message | [WIRE_PROTOCOL.md](WIRE_PROTOCOL.md) |
| The plans themselves | `gh issue list -R jjstwerff/moros --label plan --state all` |

---

## Priority order

⚠ This is the **Moros RPG toolkit's** order. The scene editor runs on its own
ladder (above) and is not ranked here.

1. **Character editor UX** — progression buttons, power details, rules placement
   (low effort, high user impact, no blockers)
2. **Focus rules** — write the rules, add to data.js, add DM UI
   (medium effort, enables gameplay depth)
3. **Contact system** — editor UI, sharing, complex contacts (medium effort)
4. ✅ ~~**World map editor** — the road bug~~ **fixed 2026-07-31**, and it was one
   defect behind all three of `Todo.txt`'s map-editor lines. Nothing else on the
   map editor is reported.
