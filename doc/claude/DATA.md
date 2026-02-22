# Moros — Data Structures Reference

This document describes all data structures in the Moros project, their shape, where they live, and how they are displayed, edited, read, and stored. It distinguishes between the **Character Editor** (`character-creator.html`) and the **Dungeon Master** (`dm.html`) contexts.

---

## 1. Static Game Data (`html/data.js`)

All static game data is exported as the frozen object `DATA`. It is read-only and never written at runtime. Both the Character Editor and DM read from it.

### 1.1 `DATA.game`

```js
{
  title: string,
  tagline: string,
  description: string[]   // paragraphs
}
```

**Used in:** Character Editor — rendered in the Rules tab by `renderRules()`.

---

### 1.2 `DATA.statistics` — Array of statistic definitions

```js
{
  name: string,           // e.g. "Charisma"
  abbreviation: string,   // e.g. "Char"
  action: string,         // e.g. "Inspire"
  description: string,
  scenarios: [
    { name: string, description: string }  // 6 entries: Combat, Hourly, Social, Travel, Defocus, Refocus
  ]
}
```

There are 8 statistics: Charisma, Dexterity, Endurance, Handiness, Might, Perception, Speed, Willpower.

**Character Editor:** Displayed on the character sheet (stats grid), in the Rules tab, and in the stat-info modal. Used to compute derived values (e.g. `Logic.stat(abbreviation)`) when rendering the character sheet.

**DM:** Used as options when building stat input grids for monsters and when selecting bonus targets for special items and attacks.

---

### 1.3 `DATA.cards` — Default deck cards

```js
{
  name: string,           // e.g. "Flame"
  statistics: string[],   // two statistic full names, e.g. ["Might", "Dex"]
  special: string         // e.g. "fire"
}
```

8 cards: Flame, Water, Wind, Plants, Iron, Earth, Light, Dark.

**Character Editor:** Displayed in the Rules tab.

---

### 1.4 `DATA.powers` — Racial powers

```js
{
  name: string,
  statistics: string[],   // two statistic full names
  special: string,
  description: string
}
```

36 powers (e.g. Adaptation, Balance, Blood, …).

**Character Editor:** Powers available to a character are filtered by race. Displayed in the race-preview panel and in the progression modal. Active powers (level > 0) appear on the character sheet and contribute cards to the character's deck.

---

### 1.5 `DATA.races` — Playable races

```js
{
  name: string,
  description: string,
  powers: string[]        // power names (lowercase) available to this race
}
```

16 races (e.g. Badgers, Bats, …, Wolf folk).

**Character Editor:** Displayed in the race-selection grid. Selecting a race gates which powers appear in the progression modal and in the power preview list.

---

### 1.6 `DATA.backgrounds` — Background definitions

```js
{
  name: string,
  statistics: string[],   // two statistic full names that benefit
  items: string[],        // item names available from this background
  specializations: string[]
}
```

14 backgrounds (Noble, Farmer, Scholar, …).

**Character Editor:** Listed in the background-choice modal. Each background learned (via progression) unlocks specializations and grants item slots. Displayed on the character sheet under "Backgrounds".

---

### 1.7 `DATA.specializations` — Specialization lists keyed by statistic

```js
{
  Dexterity: string[],
  Handiness: string[],
  Might: string[],
  Perception: string[],
  Willpower: string[]
}
```

**Character Editor:** Determines which specializations exist per stat. Filtered by `DATA.specToStat` and background for the specialization-choice modal.

---

### 1.8 `DATA.specToStat` — Specialization → statistic abbreviation map

```js
{ [specializationName: string]: string }  // e.g. { Shield: "Dex", Healer: "Hand" }
```

**Character Editor:** Used to determine which statistic a specialization raises when learned, and to look up the governing statistic when rendering the specialization modal and character sheet.

**DM (contacts):** Used to group specializations by statistic in the contact form.

---

### 1.9 `DATA.items` — Base item definitions

```js
{
  name: string,
  statistics: string[],      // two statistic names (optional for some)
  special: string,
  bulk: number,              // negative means it increases carry capacity
  description?: string,
  restricted?: false,        // if false, item is freely available (not background-gated)
  duplicates?: string[]      // backgrounds that share this item
}
```

30 items total. Items without `restricted` (or with `restricted: false`) are "basic supplies" available to all characters once.

**Character Editor:** Items available from learned backgrounds are displayed in the Equipment section with checkboxes. Basic supplies (unrestricted items) appear in a separate section. Selected items contribute cards to the deck. Bulk is shown on the character sheet.

**DM:** Full list of item names is used as options in contact forms (items they can provide), place forms (items available), and scenario reward forms (normal item rewards).

---

### 1.10 `DATA.rules` — Game rules

```js
{ about: string, text: string[] }
```

**Character Editor:** Rendered as rule cards in the Rules tab.

---

### 1.11 `DATA.actions` — Stat and specialization actions

```js
{
  power: string,       // action name (matches statistic action or specialization name)
  name: string,        // action name, e.g. "rallying cry"
  needs: string,       // prerequisite expression, e.g. "Char >= 5"
  description: string
}
```

**Character Editor:** Shown in the Rules tab under each statistic block. On the character sheet, actions for learned specializations are listed under "Specialization Actions".

---

### 1.12 `DATA.places` — World place definitions (static)

```js
{ name: string, description: string }
```

16 fixed world places (e.g. "Scarlet vale", "Cliffside hold").

**Character Editor:** Displayed in the place-of-origin grid on the Create tab. The selected place is stored in the character's `place` field and shown in the character sheet header.

**DM (contacts, places):** Used as `<option>` lists for the contact's "Town" field and the scene's place selector (though DM places are a separate user-created structure — see section 3.4).

---

## 2. Character Editor Data

### 2.1 `Progres` — A single progression step

Defined in `html/logic.js`.

```js
{
  type: "power" | "background" | "specialization",
  name: string,     // name of the power, background, or specialization
  xp: number,       // XP cost (0 for first 6 steps)
  level: number,    // reached level
  stat: string      // abbreviation of the statistic that was raised
}
```

Not stored directly in localStorage. On save, only `type` and `name` are persisted; `xp`, `level`, and `stat` are fully recalculated on load via `state.learn()`.

**Displayed:** In the progression slot list on the Create tab, showing type, name, level, XP, and affected statistic. Each slot has a "+ Learn" button and the last slot has a "Remove" button.

**Edited:** Via the modals (Add Power / Add Specialization / Add Background), which call `state.learn()`. The last progression can be removed with `dropProgression()`.

---

### 2.2 `Card` — A character's playable card (derived, not stored)

```js
{
  source: string,    // power name or item name that produced this card
  stats: string[],   // statistic names shown on the card
  special: string
}
```

Computed at render time by `state.cards` getter from learned powers (level > 0) and equipped items that have `statistics`.

**Displayed:** In the "Cards" section at the bottom of the character sheet.

---

### 2.3 `State` — Full character state

Defined in `html/logic.js`.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Character name |
| `gender` | `string` | Gender |
| `desc` | `string` | Free-text description |
| `category` | `string` | Roster category (see 2.5) |
| `#place` | `string \| null` | Place of origin name (must exist in `DATA.places`) |
| `#race` | `string \| null` | Race name (must exist in `DATA.races`) |
| `#progression` | `Progres[]` | Ordered list of progression steps |
| `#stats` | `Object<string, number>` | All computed levels: statistic abbreviations, power names, background names, specialization names → number |
| `#xp` | `number` | Total XP cost of the progression |
| `#items` | `Set<string>` | Item names currently equipped |

All private fields are accessed via getters/setters that enforce business rules (e.g., changing race clears progression and items).

**Displayed:** On the character sheet in the Roster tab — name, gender, race, place, stats grid, backgrounds, specializations, powers, equipment, cards, and specialization actions.

**Edited:** On the Create tab — identity fields, race grid, place grid, progression slots, and equipment checkboxes.

---

### 2.4 Serialized character (persisted format)

When saved, only the minimal data needed to reconstruct the state is persisted:

```json
{
  "name": "string",
  "gender": "string",
  "desc": "string",
  "category": "string",
  "place": "string | null",
  "race": "string | null",
  "progression": [
    { "type": "power|background|specialization", "name": "string" }
  ],
  "items": ["string"]
}
```

All statistics, XP, and levels are recomputed by replaying `state.learn()` for each progression entry on load. The `#stats` object therefore always starts with all 8 statistics at level 1.

**Stored in:** `localStorage['moros-characters']` as a JSON array of these objects.

**Also in:** The character roster download file (`moros-roster-YYYY-MM-DD.json`), which is the same array serialized to disk.

---

### 2.5 Categories

```js
// localStorage['moros-categories']
string[]   // custom category names
```

Default categories are hard-coded: `['setup', 'active', 'shelved', 'finished']`. Custom categories added via the UI are persisted separately.

**Character Editor:** Category field shown on the Create tab. Used to filter the Roster tab character tabs.

**DM:** Same category list (from `categories.js`) is used across contacts, items, monsters, places, and scenarios as filter and label.

---

### 2.6 Active character index

```js
// localStorage['moros-active-char']
string   // integer as string
```

Tracks which character is currently selected in the Roster tab.

---

## 3. Dungeon Master Data

All DM data lives in `html/dm.js`. Each collection is stored independently in localStorage and can be exported/imported as a combined campaign bundle.

### 3.1 Contact

```json
{
  "id": "string (uid)",
  "name": "string",
  "gender": "string",
  "faction": "string",
  "town": "string (place name from DATA.places)",
  "race": "string (race name from DATA.races)",
  "description": "string",
  "specializations": ["string"],
  "items": ["string (item name from DATA.items)"]
}
```

**Displayed:** Contact list panel (name, gender, race, faction, town, description snippet, taught specializations). Detail is shown in the edit form.

**Edited:** Via the contact form on the Contacts tab. Specializations are picked via grouped checkboxes (grouped by statistic). Items are picked via a checkbox grid of all `DATA.items`.

**Stored in:** `localStorage['moros-dm-contacts']`

**Referenced by:** DM Places (factions.contacts array), DM Scenarios (scenario.contacts, scene.contacts).

---

### 3.2 Special Item (DM)

```json
{
  "id": "string (uid)",
  "name": "string",
  "type": "string (base item name from DATA.items, or empty)",
  "category": "string",
  "description": "string",
  "bonuses": [
    { "target": "string (stat abbreviation or action name)", "value": number }
  ]
}
```

**Displayed:** Special Items list panel (name, type, category, bonuses as tags, description snippet).

**Edited:** Via the special item form. Bonuses are added/removed dynamically with stat/action selectors and numeric inputs.

**Stored in:** `localStorage['moros-dm-items']`

**Referenced by:** DM Places (specialItems array), Scenario rewards (reward.type === "special", reward.itemId === id).

---

### 3.3 Monster

```json
{
  "id": "string (uid)",
  "name": "string",
  "category": "string",
  "description": "string",
  "stats": {
    "Char": number,
    "Dex": number,
    "Endu": number,
    "Hand": number,
    "Might": number,
    "Perc": number,
    "Speed": number,
    "Will": number
  },
  "attacks": [
    {
      "name": "string",
      "description": "string",
      "damage": number,
      "damageType": "fire|cold|electric|cutting|impaling|blunt|grab|radiant|draining|pummel",
      "reach": "string",
      "bonus": [
        { "target": "string (stat abbreviation or action name)", "value": number }
      ]
    }
  ]
}
```

**Displayed:** Monsters list panel (name, category, description snippet, all stats as tags, attack count and names).

**Edited:** Via the monster form. Statistics use a grid of number inputs (min 1, max 20). Attacks are added/removed dynamically; each attack has its own bonus list.

**Stored in:** `localStorage['moros-dm-monsters']`

**Referenced by:** DM Places (monsters array of monster ids), Scenario scenes (scene.monsters array of monster ids).

---

### 3.4 DM Place

This is distinct from the static `DATA.places`. DM Places are user-created detailed location records.

```json
{
  "id": "string (uid)",
  "name": "string",
  "type": "town|city|ruins|castle|monastery",
  "category": "string",
  "description": "string",
  "monsters": ["monster id"],
  "items": ["string (item name from DATA.items)"],
  "specialItems": ["special item id"],
  "factions": [
    {
      "name": "string",
      "contacts": ["contact id"]
    }
  ],
  "struggles": [
    { "description": "string" }
  ],
  "mapTile": { "col": number, "row": number } | null
}
```

**Displayed:** Places list panel (name, type, category, map pin if set, description snippet, faction names, struggle count).

**Edited:** Via the place form. Monsters, items, and special items are picked via checkbox grids. Factions are added/removed dynamically; each faction lists contacts via checkboxes. Struggles are free-text blocks. Map tile column and row link to the hex-map editor.

**Stored in:** `localStorage['moros-dm-places']`

**Referenced by:** Scenario scenes (scene.place = place id).

---

### 3.5 Scenario

```json
{
  "id": "string (uid)",
  "name": "string",
  "description": "string",
  "category": "string",
  "characters": ["character name"],
  "contacts": ["contact id"],
  "scenes": [
    {
      "id": "string (uid)",
      "name": "string",
      "description": "string",
      "place": "dm-place id (or empty string)",
      "characters": ["character name"],
      "contacts": ["contact id"],
      "monsters": ["monster id"],
      "challenges": [
        {
          "id": "string (uid)",
          "description": "string",
          "rewards": [
            {
              "type": "normal|special",
              "itemId": "string (item name if normal, special item id if special)"
            }
          ]
        }
      ]
    }
  ]
}
```

**Displayed:** Scenarios list panel (name, category, description snippet, scene count, character count, contact count). Each scenario has a print-view link that opens `scenario-print.html?id=<id>`.

**Edited:** Via the scenario form. Scenes are added/removed and collapsed/expanded independently. Each scene links DM Places, Characters (from the character roster), Contacts, and Monsters via checkbox grids. Each scene contains challenges with free-text descriptions and item rewards.

**Stored in:** `localStorage['moros-dm-scenarios']`

---

### 3.6 Campaign download bundle

When the DM clicks "Download Campaign", all DM data and the character roster are combined into one file:

```json
{
  "version": 1,
  "date": "YYYY-MM-DD",
  "contacts": [...],
  "items": [...],
  "monsters": [...],
  "places": [...],
  "scenarios": [...],
  "characters": [...]
}
```

**Stored as:** `moros-campaign-YYYY-MM-DD.json` (browser download)

**Upload:** Merges by id (DM entities) or by name (characters), or replaces entirely, depending on user choice.

---

## 4. localStorage Key Summary

| Key | Owner | Content |
|---|---|---|
| `moros-characters` | Character Editor + DM (read) | JSON array of serialized characters |
| `moros-active-char` | Character Editor | Active character index (string) |
| `moros-categories` | Shared | JSON array of custom category names |
| `moros-dm-contacts` | DM | JSON array of Contact objects |
| `moros-dm-items` | DM | JSON array of Special Item objects |
| `moros-dm-monsters` | DM | JSON array of Monster objects |
| `moros-dm-places` | DM | JSON array of DM Place objects |
| `moros-dm-scenarios` | DM | JSON array of Scenario objects |

---

## 5. Cross-reference Summary

| Data | References |
|---|---|
| Contact | `DATA.races` (race), `DATA.places` (town), `DATA.items` (items), `DATA.specToStat` (specializations) |
| Special Item | `DATA.items` (type), `DATA.statistics` (bonus targets) |
| Monster | `DATA.statistics` (stats), `DAMAGE_TYPES` constant (attack type) |
| DM Place | Monster ids, Contact ids, Special Item ids, `DATA.items` (items) |
| Scenario | Character names (from character roster), Contact ids, DM Place ids, Monster ids, `DATA.items` + Special Item ids (rewards) |
| Character | `DATA.races`, `DATA.places`, `DATA.backgrounds`, `DATA.powers`, `DATA.specToStat`, `DATA.items` |
