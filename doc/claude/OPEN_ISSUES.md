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

### ✅ FIXED 2026-08-08 — a raise moved 4096 cells and marked 4, and the marking was never wrong

⚠ **THE TITLE THIS ENTRY CARRIED FOR FOUR DAYS NAMED THE WRONG ORGAN.** It read *"a raise
marks fewer chunks than it writes"*. The marking was right all along — `mark_dirty` covers
`PEAK_R + 2` around a brush of `PEAK_R` and **contains** the write exactly. What escaped it was
a height **no gesture had produced**.

**A height is stored relative to its chunk's window base** (`S1`), and **one base serves the
whole 32×32 tile**. Four readers — `world_ground_cell`, `world_cell`, `world_column`,
`world_dressing` — decoded `ck_base + sv_height` unconditionally, so every cell nobody had
written answered `ck_base`. Writing one cell lifted the apparent ground of the other 1023 in
its chunk. `world_surface` was the **one** reader that guarded (on `stored_occupied`), which is
exactly why the class stayed invisible: the question was already being asked, in one place, and
nobody noticed the other four did not ask it.

Measured, one brush of radius 7 at the origin (`probe/stale/extent.loft`):

| | before | after |
|---|---|---|
| cells **written** (material set) | 91, over q −5..5 r −5..5 | 91, same extent |
| cells whose **height moved** | **4096**, over q −32..31 r −32..31 | **91**, same extent |
| `terrain_h(20,20)`, never written | **6** | 0 |
| chunk meshes CHANGED vs MARKED (`EDITOR_PROBE=fit`) | **81 of 81** vs 4 | 4 vs 4, **0 stale** |

The two stale-mesh magnitudes the mesh probe reported, `1.500` and `0.250` wu, are exactly the
two chunk bases — 6 and 1 — times the 0.25 wu height unit. That is the whole of the 22-of-48.

⚠ **AND IT CORRUPTED THE RAISE ITSELF, WHICH NOTHING HAD NOTICED.** `brush` reads `ground_h`
before adding its delta, so once a chunk had rebased, every later stroke read the base back as
existing ground and built on top of it. Measured (`probe/stale/raise3.loft`): one press of
`PEAK_STEP = 6` stood **7** units high, three presses **19** instead of 18, and a cell twelve
hexes out — never written — stood at **1**. Every terrain number in the tree was one height
unit high.

**The fix is one decode**, `hex_of`, asking the predicate the write path already asks
(`stored_present`), with `E1`(3) as its rule — *reading an absent cell yields exactly what
reading a stored all-zero one would*. Three tests in `lib/hex_world/tests/ground.loft`, all
seen red against the old reader.

⚠ **FOUR THINGS WERE RESTING ON IT**, and each is worth more than the fix:
- **`storey.loft`'s stair test** read `terrain_h` at a cell the stairwell had just cleared, and
  called the leftover `sv_height` "the tread's own ground". It reads the hillside *before* the
  cut now, and takes the top of the column — `world_surface` cannot make that claim at all,
  because asked for the surface under the ground it falls back to the **lowest** layer, so a
  tread floating over the hillside came back as the cellar floor and read as a pass.
- **`part_mode.mjs`** checked *"the raise is visible"* by reading cell **(0,0)** — the author's
  own cell, which a raise never touches (it lands ten hexes ahead, at (7,5) for that pose). It
  answered only because the base leaked. ⚠ The gate's own comment already records this exact
  trap being sprung once before.
- **`cart.mjs`** banked its cart on the **step between two artificial plateaus**. With the
  plateaus gone its fixture met no slope at all — `maxBank 0, banked false`, the gate's own
  void-guard firing correctly. See the new entry below.
- **`cellar.keys`'s `meshy` split** separated two vertex populations by a fixed world-y, which
  worked because a large part of the ground under the disc was flat at exactly one height. See
  the new entry below.

### ✅ FIXED 2026-08-08 — the cart's wheels left the ground on a real slope, and above 45° it refused one

⚠ **Found only because the window-base fix took away the fake slope it had been tested on.**
`cart.mjs` asserts `grounded` — every wheel within a millimetre of the drawn ground — and that
clause had **never been asked about a genuine gradient**. Its hill landed ~14 wu off the cart's
line and never reached it; what banked the cart was the step between two chunk-wide plateaus,
and on flat ground the solve is exact.

⚠ **AND "NOT ENOUGH ROUNDS" WAS THE WRONG READING, WHICH IS WHY THE PROBE CAME FIRST.** The
editor took `ground_axle`'s default of 3 while the library's own tests pass 30–40, so the
obvious fix was to pass more. Swept over planes, where the answer is closed form
(`probe/cart/converge.loft`), there were **three** regimes and more rounds only reaches the
first two:

| terrain slope `s` | before, at any round count |
|---|---|
| ≤ 0.2 | fine — 3 rounds reach `3.6e−6` |
| 0.6 – 0.9 | converges as `s²`: **40 rounds still leave `7.3e−5`** |
| **≥ 1.0** | **`ok false` on round ONE** — refused, bank 0, wheels 0.6–1.9 wu off the ground |

A plane of slope 2.0 rests perfectly well at `β = −1.107` and was refused. **The `A-FIT`
doorstep was asked at the wrong place**: *does the ground drop further than the axle is long
across the span* is a real rule, but it was evaluated at the CURRENT iterate, and the seed
`β = 0` is the widest span the axle ever has. The span shrinks as the axle tilts; the question
was asked before any tilting had happened. The raise brush's own documented flanks are 74–83°.

**The fix changes the variable.** Solve for the horizontal half-span `t`, not the bank:

    H(t) = (2t)² + d(t)² − (2w)² = 0     the chord between the contacts IS the axle
    H(0) = −(2w)² < 0                     H(w) = d(w)² ≥ 0

so a root exists on `[0, w]` for any continuous terrain at any slope and a bracketed method
cannot fail. Iterating on `u = t²` makes a plane **exact in one step** — `H = 4(1+s²)·u − 4w²`
is linear in `u`, and a heightfield is a plane between its samples. Illinois keeps it
superlinear on curved ground without losing the bracket. The doorstep is kept and asked at the
converged span, which is the only span at which it means anything.

| bank (rad) | worst gap before | worst gap now |
|---|---|---|
| 0.083 | 1.5e−8 | *(the artifact's step)* |
| 0.245 | 3.5e−5 | **5.6e−17** |
| 0.395 | 1.3e−3 — failed | **1.1e−16** |
| 0.695 | 9.8e−2 — failed | **4.4e−16** |

`cart.mjs` now drives a real **0.695 rad (40°)** flank — four times the bank the artifact ever
produced — and `lib/moros_sim/tests/ground.loft` owns the rule, four of its clauses seen red
against the old solve.

⚠ **THREE OF ITS OLD CLAUSES DESCRIBED THE DEFECT AS A FEATURE** and were replaced, not
loosened: they asserted the `s²` convergence RATE, which was true of an algorithm that no
longer exists. One of them —
`test_the_step_shrinks_by_s_squared_each_round` — guarded its ratio with `if prev > 0.0`, so
against a solve that settles in one round it compares nothing and **reports green**.

### ✅ FIXED 2026-08-08 — the towed trailer had all of the above, and kept it a while longer

⚠ **Measured with the same probe shape, after fixing the cart's.** `msim::hitched_rest` refused
a plane from slope **0.9** upward — *"ground drops 0.946 across an axle of 0.903"* — and left
`3e−4` at 0.6. Same causes: two doorsteps asked at the CURRENT iterate, and an alternation of
two closed forms (pitch from the contacts' sum, roll from their difference) that is block
Gauss–Seidel and diverges exactly as `A6`'s did.

⚠ **AND IT IS GENUINELY NOT THE SAME PROBLEM**, which is why the chord trick could not simply be
copied: a hitched body has **two** coupled unknowns, and they are coupled *through the sampling* —
the wheels move along the travel direction by `∓k·sin θ` as the body rolls. That term vanishes
at `θ = 0`, so a single-axis fixture cannot see it. (The file already records this once: dropping
a `cos θ` gave a solve that worked on terrain sloping along one axis and failed on two.)

**Two nested brackets**, each with endpoints that are known rather than guessed:

- **pitch**, on `sin θ ∈ [−1, +1]`, where `F = (P_y − L·sin θ − R) − m` is decreasing — at `−1`
  the axle is a full drawbar above the pin, at `+1` a full drawbar below. A sign change **is**
  the drawbar's reach, so the second doorstep is asked once on the interval instead of every
  round on a guess.
- **roll**, on `k = w·sin φ ∈ [−w, +w]`, which is `ground_axle`'s chord question one pitch down.

| slope | before | now (20 rounds) |
|---|---|---|
| 0.2 | 1.2e−8 | machine ε |
| 0.6 | 3.0e−4 | machine ε |
| **0.9** | **refused** | machine ε |
| 1.1 / 2.0 / 3.5 | **refused** | machine ε |

⚠ **AND THE CLIFF EXPOSED A TRAP THE CART DOES NOT HAVE.** A discontinuity makes `Q`
discontinuous, so the bracket collapses **onto the jump** — and the jump sits at `|k| = w`, where
the axle is vertical and the solve's own two contacts coincide. It read `d = 0` there and
reported a rest: roll `−π/2`, both sampled contacts at `z = 0`, `ok true`, while the FRAME put
the wheels at `z = ∓3.4e−17`, either side of the edge, with a 3.0 drop and gaps of −0.55 and
−2.45. The doorstep reads the **frame's** wheels now, which is `A-GROUND`'s own rule — *a wrong
pose cannot report a right gap* — load-bearing rather than tidy. `ground_axle` needs none of
this and is left alone: its bracket runs on `[0, w²]`, so its step stays strictly positive and
its contacts can never coincide.

Two clauses in `lib/moros_sim/tests/hitch.loft`, both seen red against the old solve.

### Note: `part_limb` fails under full-suite contention and passes 4/4 alone

Seen twice on 2026-08-08 in `make gate` at `GATE_JOBS=16`, including in a run **before** any of
this session's changes, and green 4/4 under `make gate-rep G=part_limb`. Recorded so the next
person does not attribute it to whatever they just changed. Not diagnosed.

### ✅ CLOSED 2026-08-08 — `cellar.keys`'s soffit split keeps its knife edge, on purpose

⚠ **The repair this entry proposed was *level the ground under the disc*. It was built,
measured, and BACKED OUT** — the fixture is the bumpy one and the boundary is deliberately
where it is. Everything below is why, kept so nobody re-proposes it.

**What levelling bought.** The fixture levels its plateau by walking a CROSS, and a cross levels
its arms and nothing else — `brush` scales the gap by `f²` and truncates, so only the cell the
walker steps on closes. Measured across the 19 cells the dig uses, that left them spread over
**six height units**, 14 to 19. Sweeping the disc cell by cell (a teleport each, three passes)
brings all nineteen to exactly 17 — 1 pass leaves 17/18/19, 2 leaves 16/17, 3 leaves them flat,
and a 4th confirms it is a fixed point. The boundary went from a knife edge to a real gap:

| | 310 holds over |
|---|---|
| bumpy | `1.375..1.5` — one step wide |
| levelled | **`1.0..1.75`** — six times the margin |

**What it did not buy: the count is still 310, not 306.** ⚠ **Because of the treads, which no
levelling reaches.** A tread is a STEP — its own fan has corners at different heights by
construction — so four of its vertices hang below the boundary whatever the ground under it
does. The exact 306/342 was never a property of flat ground; it needed the treads' fans to sit
wholly above the split, which was true of the buggy geometry **by luck**.

⚠ **AND FLATTENING WIDER IS REFUTED, not merely unattempted.** The ceilings stay spread because
a ground fan's corner heights average **three** cells, so the disc's outer ring is pulled by
terrain outside it. Levelling a ring further out (radius 3, 37 cells) was measured: it changes
what the gesture **digs** — `mesh soffit` 648 → 666, 37 fans instead of 36 — and the plateau
disappears entirely (36, 148, 220, 310, 328, 332 …). **A fixture cannot flatten past the dig
without changing the dig.**

⚠ **AND THAT IS WHY IT WAS BACKED OUT.** Levelling moved four other rows, two of them to numbers
nobody could derive: `mesh floor` 564 → **438** (the same 342 of top fan, with 96 of rim and
riser instead of 222 — most of that 222 was risers the bumpy disc owed, since `solid_at` draws
one wherever the neighbour is not solid at this height) and `mesh wall` 174 → **162** (27 quads
of 6 against 29; the arithmetic holds, *which* two edges stopped being walled does not). Two
`feet` stations moved with the plateau.

**Trading two underived constants for margin on a boundary that is not a fan count either way is
a bad trade**, so the fixture stays bumpy and the boundary stays at 1.5 with one step of margin.
The knife edge is a decision, not an oversight — and `mesh soffit 648` is what still pins the
36 fans exactly, whatever the split reads.

⚠ **What would actually restore an exact reading is not a fixture change at all**: it is a
`meshy`-like verb that bands on a height RELATIVE to each cell's own ground, so the two
populations separate by construction instead of by a shared world-y. Nobody needs that today.

### Was: a raise marks fewer chunks than it writes, and the client keeps the stale ground

⚠ **Found 2026-08-04 by plan 17 `A7.3a`, and only because a new instrument compared
two pictures of the same world.** On a **fresh** server: `7:0,0,0` · three `5:1`
raises · wait. **22 of the 48 loaded chunks then hold a ground mesh that does not
match the store**, and no amount of waiting corrects them — they stay stale until
*something* forces a full rebuild, at which point their ground jumps from flat to
the raise's falloff (`0,0,-48,0,1,0` → `0,0.1388889,-48,-0.0719,…`).

**Attributed away from part mode**, which is how it was found: forcing the rebuild
with `8:`/`9:` instead of with the part swap produces the **same 22**. So it is the
raise, not the swap — the swap is merely the first thing that ever re-meshed
everything at once and made the disagreement visible.

⚠ **The shape is the one the handler's own comment already warned about, one size
up.** `MSG_RAISE` marks `PEAK_R + 2` — a comment there records the ring just outside
`PEAK_R` holding a stale mesh and the gap you see through it. The measurement says
the write still reaches further than the mark: the stale chunks are ~48 world units
out, far past any plausible brush radius.

⚠ **BUT THE MECHANISM NAMED BELOW IS CONTRADICTED BY THE CODE — read on 2026-08-08.**
This entry said *"`raise_ahead` walks a **ray** while `mark_dirty` marks a **disc**
around where that ray lands; everything the ray crossed on the way is written and not
marked."* Read again:

    raise_ahead   peak_cell(a) → ONE cell, ten hexes ahead; then
                  brush(w, tq, tr, dir * PEAK_STEP, PEAK_R, …)
    brush         a DISC: `for dq in -rad..rad`, `if hex_distance(q,r,tq,tr) < rad`
    MSG_RAISE     mark_dirty(dirty, rack.ak_q, rack.ak_r, PEAK_R + 2)

**The write is a disc of radius 7 at the peak and the mark is a disc of radius 9 at
the same centre**, so the mark CONTAINS the write and nothing is written along the
way. There is no ray. ⚠ **The 22-of-48 SYMPTOM is not withdrawn** — it was measured
with a real instrument and stands until re-measured — but its stated CAUSE is a
hypothesis the code refutes, and anyone starting from it will be looking for
something that is not there.

⚠ **So the next step is the instrument, not a fix.** *(Written 2026-08-08, and it was the
right call — but the instrument to reach for was already in the tree.* `EDITOR_PROBE=fit`
in `src/editor_server.loft` compares CHANGED against MARKED with a negative control, and
answered in one run: **81 of 81 chunk meshes changed against 4 marked.** The guess recorded
here — a chunk STREAMED and never re-sent — was wrong too, and it is the third wrong cause
this entry carried. What the probe could not say was **why** 81 changed, and that took one
more instrument: read the STORE, not the mesh, and the 4096-cell plateau is immediate.
⚠ **Both guesses blamed transport. The defect was in the READ, and the store was never
right — every gate that "checked the store and found it correct" was asking the same
lying reader.)*

⚠ **It is invisible to every existing gate**, because each one checks the store and
the store is right. `G` again: *a count is not a picture* — and here the count is
correct and the picture is not. *(⚠ **This sentence was false and it is the reason the
entry survived four days.** The store was NOT right: `terrain_h(20,20)` answered 6 where
nothing had ever been written. The gates agreed with the picture's producer because they
asked it the same question through the same broken decode — not because the store held
one truth and the screen another. `G`'s real lesson here is the opposite of the one
recorded: **when a count and a picture agree, they may share an instrument.**)*

### Open: `stencil_place`'s roof fence admits roofs the walls cannot reach

⚠ **Found 2026-08-03 by `B5.3`, and by looking at a picture nobody had drawn
before.** `14:<roof_up>` fences the roof at `WINDOW_MAX_ROOF = 400`, and the
stencil's walls are `WALL_UP = 12` whatever it is asked for. Measured in the part
files, by reading the cells rather than the code:

| `roof_up` | roof cells | wall head | eave gap |
|---|---|---|---|
| `12` (the built-in cottage) | 12..20 | 12 | **0** — the roof sits on the walls |
| `28` | 28..36 | 12 | **16** — the roof floats clear of the house |

So every admissible value above 12 builds a house whose roof is not on it, and the
author is told nothing: `14:28` is accepted and acknowledged like any other. It has
been that way for as long as the gesture has existed, because **nothing ever looked
at a house built with a non-default roof** — `stencil.mjs` drives `14:12`, and the
built-in cottage is 12 by construction.

⚠ **What surfaced it was the catalogue thumbnail.** `B5.3` needed a part that
differed from the cottage, reached for the obvious knob, and the picture that came
back had a red band floating over a grey box. The instrument that found it is a
22×16 image — which is worth saying, because the argument against small thumbnails
is that nothing can be seen in them.

Not fixed here: whether the walls should follow the roof, whether the fence should
be `WALL_UP`, or whether a taller roof means a taller *storey* is a design question
for the stencil (plan 17's `A7.3` is where one definition of a house is argued out).
What is recorded is that the gesture accepts a number it cannot honour. `B5.3`'s own
fixture varies the RADIUS instead, so no gate encodes the broken shape.

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
