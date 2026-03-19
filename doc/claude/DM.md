# DM Tool — Reference Documentation

The DM tool (`html/dm.html` + `html/dm.js`) is a single-page browser application for
Dungeon Masters running Moros campaigns. All data is persisted in `localStorage`.

---

## Architecture overview

| File | Role |
|---|---|
| `html/dm.html` | Shell — header, nav tabs, 8 panel divs, script import |
| `html/dm.js` | All rendering, form building, CRUD, search, and init |
| `html/dm-logic.js` | Pure logic (no DOM) — imported by `dm.js` and the test suite |
| `html/data.js` | Read-only game data: `DATA.statistics`, `DATA.powers`, `DATA.creatures`, `DATA.items`, `DATA.races`, `DATA.backgrounds`, `DATA.specToStat`, `DATA.places` |
| `html/categories.js` | Shared user-defined category list stored in localStorage |
| `test/dm.test.js` | Unit tests for `dm-logic.js` and `DATA` shape assertions |

`window.DM` is the public API exposed by `dm.js`; inline `onclick` attributes in
generated HTML call `DM.<method>(...)`.

---

## localStorage keys

| Key | Content |
|---|---|
| `moros-dm-contacts` | `Contact[]` |
| `moros-dm-items` | `SpecialItem[]` |
| `moros-dm-monsters` | `Monster[]` |
| `moros-dm-places` | `Place[]` |
| `moros-dm-scenarios` | `Scenario[]` (each includes `history[]` snapshots) |
| `moros-characters` | `Character[]` — written by the character tool, read here |
| `moros-dm-categories` | `{name, sessionVisible}[]` — shared across tabs via `categories.js` |
| `moros-dm-rules-overrides` | `{ creatures: {[name]: override}, powers: {[name]: override}, items: {[name]: override} }` |

---

## Toolbar

Always visible above all tabs.

| Control | Function |
|---|---|
| `← Game Suite` | Links back to `index.html` |
| Search input | `DM._searchInput(query)` — searches all campaign and reference content |
| Session dropdown | Filters search to a single played session's history log |
| `↓ Download Campaign` | `DM.download()` — exports all campaign data + characters as JSON |
| `↑ Upload Campaign` | `DM.upload()` — imports JSON; prompts merge vs replace |

The session dropdown is populated from all history snapshot `scenarioName` values via
`DM._refreshSearchScenarios()`.

---

## Tab overview

Nine tabs, all rendered from `dm.html`. The first five are editable campaign tabs; the
next three are reference tabs drawn from `DATA` (now editable via campaign overrides);
Config is the tool-wide settings tab.

| Tab | ID | Data source | Editable |
|---|---|---|---|
| Contacts | `tab-contacts` | `moros-dm-contacts` | Yes |
| Special Items | `tab-items` | `moros-dm-items` | Yes |
| Monsters | `tab-monsters` | `moros-dm-monsters` | Yes |
| Places | `tab-places` | `moros-dm-places` | Yes |
| Scenarios | `tab-scenarios` | `moros-dm-scenarios` | Yes |
| Powers | `tab-powers` | `DATA.powers` + overrides | Yes (via rules overrides) |
| Bestiary | `tab-bestiary` | `DATA.creatures` + overrides | Yes (via rules overrides) |
| Item Rules | `tab-item-rules` | `DATA.items` + overrides | Yes (via rules overrides) |
| Config | `tab-config` | Categories, overrides summary, campaign I/O | Yes |

All five editable tabs use a split-pane layout (`<div class="dm-split">`): a list pane
on the left and a form pane on the right. The form starts hidden; clicking "+ New" or
"Edit" adds `active` to the form and `dm-hidden` to the list.

---

## Origin system

Every campaign entry (monster, special item, contact, place, scenario) carries an
implicit origin. The `originOf(entry)` function in `dm-logic.js` derives it:

| Origin | Condition | Badge colour |
|---|---|---|
| `campaign` | Default — no `owner` or `scenarioId` | Neutral |
| `scenario` | Entry has `scenarioId` set | Amber |
| `player` | Entry has `owner` set (character name) | Teal |
| `rules` | Reference-tab entry with no campaign override | Stone grey |
| `modified` | Reference-tab entry that has a campaign override | Blue |

`owner` and `scenarioId` are mutually exclusive. The form enforces this: setting one
clears the other via `DM._monsterOriginChanged` / `DM._itemOriginChanged`.

---

## Contacts tab

**Fields**: name, gender, faction, town (from `DATA.places`), race (from `DATA.races`),
description, specializations (checkboxes grouped by stat, sourced from `DATA.specToStat`),
items they provide (checkboxes from `DATA.items`).

**List card** shows: name · race · faction · town, description snippet, specialization
count, teaches list (first 4).

**CRUD**: `newContact / editContact / deleteContact / saveContact`.

---

## Special Items tab

**Fields**: name, category, general type (from `DATA.items`), description, stat/action
bonuses (dynamic list), scenario assignment, owner (character name).

**Bonuses** are an array of `{ target: abbreviation|action, value: number }`. The bonus
editor is shared with the monster attacks form. `_regItemBonuses()` registers the context
and `renderBonuses('item-bonuses')` redraws the list.

**List card** shows: name, type, category, origin badge, bonus tags, description snippet,
last-seen line.

**CRUD**: `newItem / editItem / deleteItem / saveItem`.

---

## Monsters tab

**Fields**: name, category, description, motivation, statistics, behaviour, druid bond
(optional — animals only), scenario assignment, owner, attacks.

### Statistics

Eight stats, each a number input (`min=1, max=20`), named `stat-{abbreviation}`.
Abbreviations come from `DATA.statistics`. Default value 1.

### Attacks

Each attack block (built by `buildAttackBlock(i, atk)`) has:

| Field | Type | Notes |
|---|---|---|
| name | text | |
| description | textarea | |
| damage | number | min 0, max 99 |
| damageType | select | fire, cold, electric, cutting, impaling, blunt, grab, radiant, draining, pummel |
| reach | select | close, reach, ranged, area |
| statReduced | select | from `DATA.statistics` abbreviations |
| bonus | bonus list | stat or action bonuses granted by this attack |

Attacks are stored in the module-level `_attacks` array. `renderAttacks()` rebuilds the
DOM from it. `_addAttack()` / `_removeAttack(i)` / `_setAtkField(i, field, value)` mutate
it during editing.

**List card** shows: name, category, origin badge, all 8 stats as tags, attack summary
(name, damage type, stat reduced), motivation snippet, last-seen line.

**CRUD**: `newMonster / editMonster / deleteMonster / saveMonster`.

### Bestiary section within the Monsters tab

Below the user-monster list, a `dm-section-divider` labelled **Bestiary** is followed
by cards for every creature in `resolveCreatures()` that matches the active category
filter. These cards are read from the resolved data (overrides applied) and show:

- Name, category badge, RULES or MODIFIED badge
- All 8 stat tags
- Attack summary (name · type · stat reduced)
- Motivation snippet

Each bestiary card has two action buttons:

| Button | Function |
|---|---|
| **Edit** | `DM._editRulesEntry('creatures', name, btn)` — opens the inline creature edit form directly inside the Monsters tab list (same form as in the Bestiary tab) |
| **Copy** | `DM._copyToMonsters(name)` — pre-fills the monster editor from the resolved creature and switches to the form |

Saving or cancelling from the inline edit form re-renders both `renderBestiary()` and
`renderMonsters()`, so the change is visible immediately whether the DM is looking at
the Monsters tab or the Bestiary tab. Resetting an override does the same.

The bestiary section is always appended after user monsters regardless of session mode —
the category filter applies, but the session-visibility flag does not (bestiary creatures
are not campaign entries).

---

## Places tab

**Fields**: name, category, type (town/city/ruins/castle/monastery), description,
monsters present (entity picker from `moros-dm-monsters`), items available (checkboxes
from `DATA.items`), special items (entity picker from `moros-dm-items`), map tile
(col/row — links to `hex-map-editor.html`), factions, struggles.

### Factions

Each faction block has: name (text input), contacts at this place (entity picker filtered
by place). Stored as `{ name, contacts: contactId[] }`.

### Struggles

Each struggle is a `{ description }` textarea block.

**List card** shows: name, type, category, map location (📍 col,row), description
snippet, faction list, struggle count.

**CRUD**: `newPlace / editPlace / deletePlace / savePlace`.

---

## Scenarios tab

**Fields**: name, category, description, linked characters (entity picker from
`moros-characters`), linked contacts (entity picker from `moros-dm-contacts`), scenes.

### Scenes

Each scene has: name, description, place (select from `moros-dm-places`), linked
characters (entity picker), linked contacts (entity picker), linked monsters (entity
picker from `moros-dm-monsters`), challenges.

Each **challenge** has: description, rewards. Each **reward** is
`{ type: 'normal'|'special', itemId }`.

Scene collapse/expand state is tracked in `_expandedScenes` (a `Set` of indices).
`_syncFromDOM()` reads all current field values into `_editingScenario` before any
mutation that triggers a re-render.

### History log

`DM._markPlayed(id)` creates a history snapshot via `createSnapshot()` from `dm-logic.js`
and pushes it into `scenario.history[]`. Each snapshot is
`{ scenarioName, date, entries: [{type, name}] }` and is written once, never updated.

**List card** shows: name, category, last-played date, description snippet, scene/
character/contact counts, all history snapshots in reverse order (each showing date and
which monsters/items/contacts appeared).

**Actions on card**: Edit, Delete, **Mark Played** (creates snapshot), **⎙** (opens
`scenario-print.html?id=...` in new tab).

**CRUD**: `newScenario / editScenario / deleteScenario / saveScenario`.

---

## Bestiary tab

Renders `resolveCreatures()` — `DATA.creatures` merged with any campaign overrides.
Each entry:

```js
{
    name:       string,
    category:   string,           // e.g. 'Common Beasts', 'Flame Elementals'
    motivation: string,
    behaviour:  string,
    stats:      { Char, Dex, Endu, Hand, Might, Perc, Speed, Will },
    attacks:    [{ name, type, reach, statReduced, description }],
    druidBond?: string,
}
```

**Filter**: category dropdown (built from unique categories in `DATA.creatures`; unchanged
by overrides so deleted base categories remain filterable).

**Card** shows: name, RULES/MODIFIED badge, category badge, all 8 stat tags, attack rows
(name · type · reach · stat reduced), motivation, behaviour, druid bond.

**Edit** (`DM._editRulesEntry('creatures', name, btn)`): replaces the card with an inline
form (see [Rules overrides](#rules-overrides)). On save, the tab re-renders.

**Copy to Monsters** (`DM._copyToMonsters(name)`): pre-fills the monster form from the
**resolved** creature (so overridden stats/attacks are used). Pre-fills attack
descriptions; switches to the Monsters tab with the form open.

---

## Powers tab

Renders `resolvePowers()` — `DATA.powers` merged with any campaign overrides.
Each entry:

```js
{
    name:        string,
    statistics:  string[],    // e.g. ['Will','Char']
    special:     string,      // e.g. 'shadow step'
    description: string,
    scenarios:   [{ name, use }],
    overwhelmed: string,
}
```

**Filters** (three independent dropdowns):
- By stat — filters powers whose `statistics` array includes the selected stat
- By scenario type — filters powers that have a `scenarios` entry with that name
- By race — filters powers listed in `DATA.races[r].powers`

**Card** shows: name, RULES/MODIFIED badge, stats + special (right-aligned), description,
scenario rows (name + use), overwhelmed state.

**Edit** (`DM._editRulesEntry('powers', name, btn)`): inline edit form for description,
overwhelmed, and each scenario's use text.

---

## Item Rules tab

Renders `resolveRuleItems()` — `DATA.items` merged with any campaign overrides.
Each entry can have:

```js
{
    name:        string,
    statistics:  string[],
    special:     string,
    bulk:        number,
    description: string,
    damage:      { type, statReduced },    // weapons
    protects:    string,                   // armor
    boost:       [{ condition, effect }],
    hinder:      [{ condition, effect }],
    material:    string,
    masterwork:  string,
}
```

**Category assignment** (`_itemRulesCategory(item)`):

| Category | Criterion |
|---|---|
| Animals and Transport | name in `{horse, donkey, dog, falcon, cart}` |
| Armor and Protection | has `protects` field |
| Weapons | has `damage` field |
| Basic Supplies | no `statistics` field |
| Gear | everything else |

**Filter**: category dropdown with the five categories above.

**Card** shows: name, RULES/MODIFIED badge, stats + special + bulk (right-aligned),
description (if set via override or present in base data), damage row, protects row,
boost rows (with condition), hinder rows, material, masterwork.

**Edit** (`DM._editRulesEntry('items', name, btn)`): inline edit form for description
(new field — items have no description in base data), and each boost/hinder effect text.

**Copy to Items** (`DM._copyToSpecialItems(name)`): builds a description text from the
resolved rule fields (so overridden boost/hinder text is used) and pre-fills the Special
Items form. Switches to the Special Items tab with the form open.

---

## Rules overrides

DMs who want to run a different world can customise any creature, power, or item rule.
Overrides are stored in `moros-dm-rules-overrides` and merged with `DATA.*` at render
time — `DATA` itself is never mutated.

### Storage format

```js
// moros-dm-rules-overrides
{
    creatures: {
        "Wolf": {
            motivation: "custom motivation",
            behaviour:  "custom behaviour",
            druidBond:  "custom bond",
            stats:      { Char:1, Dex:5, Endu:4, Hand:1, Might:4, Perc:5, Speed:6, Will:2 },
            attacks:    [{ name:"Bite", type:"cutting", reach:"close", statReduced:"Dex",
                           description:"custom description" }],
        },
    },
    powers: {
        "Adaptation": {
            description: "custom description",
            overwhelmed: "custom overwhelmed text",
            scenarioUses: {
                "Stealth":     "custom use text",
                "Combat":      "custom use text",
                "Exploration": "custom use text",
            },
        },
    },
    items: {
        "sword": {
            description: "A finely balanced blade.",
            boost:  [{ condition:"Dex ≥ 3, combat", effect:"custom effect" },
                     { condition:"Might ≥ 3, combat", effect:"original text" }],
            hinder: [{ condition:"stealth", effect:"custom effect" },
                     { condition:"negotiation", effect:"original text" }],
        },
    },
}
```

### Resolve functions

Three functions merge `DATA.*` with the override map at render time:

| Function | Returns |
|---|---|
| `resolveCreatures()` | `DATA.creatures` array with any overrides spread-merged by name |
| `resolvePowers()` | `DATA.powers` array; `scenarioUses` entries merged into `scenarios[].use` |
| `resolveRuleItems()` | `DATA.items` array with any overrides spread-merged by name |

The spread-merge replaces top-level fields; for creatures, `attacks[]` and `stats` are
fully replaced by the stored override (no per-field delta). For powers, `scenarioUses`
is applied scenario-by-scenario — scenarios not present in `scenarioUses` keep their
base text.

### Editing flow (inline in reference and campaign tabs)

Clicking **Edit** on any creature card in the Bestiary tab or the bestiary section of
the Monsters tab, and on any card in Powers or Item Rules:

1. `DM._editRulesEntry(type, name, btnEl)` adds `.dm-editing` to the `.dm-entry` div and
   replaces its `innerHTML` with a type-specific edit form built from the current resolved
   state (so existing overrides appear pre-filled).
2. The form contains all editable fields (see below) plus **Save**, **Cancel**, and
   **Reset to default** buttons.
3. **Save** (`DM._saveRulesEntry(btnEl)`) reads the form, calls `saveRuleOverride(type,
   name, data)`, and re-renders the relevant tab (plus Monsters, if creatures changed).
4. **Cancel** (`DM._cancelRulesEntry(btnEl)`) re-renders the tab without saving.
5. **Reset to default** (`DM._resetRulesEntry(type, name)`) deletes the override from
   localStorage and re-renders.

### Editable fields per type

**Creatures** — motivation, behaviour, druid bond (text inputs); all 8 stats (number
inputs with click-to-picker); per-attack description (textarea for each attack in the
base `DATA.creatures` entry).

**Powers** — description (textarea); overwhelmed (textarea); scenario use text (one
textarea per scenario, indexed by `scenarios[i].name`).

**Item Rules** — description (textarea; no description field exists in base data for
most items, so this is always empty until the DM fills it); boost effect text (textarea
per boost entry); hinder effect text (textarea per hinder entry). The condition strings
are read-only labels — only the effect text is editable.

Fields that cannot be changed via override (attack name, type, reach, statReduced; item
statistics, damage type, protects, bulk, special) must be changed by copying the entry
to the campaign (Copy to Monsters / Copy to Items) and editing it there.

### Visual indicator

Overridden entries show a blue **MODIFIED** badge instead of the grey **RULES** badge.
The badge is derived at render time from `loadRulesOverrides()`, not stored in the entry.

### Config page summary

The Config tab has a **Rules Overrides** section that lists all currently overridden
entries grouped by type (Creatures, Powers, Item Rules). Each row shows:

- Entry name
- **Go to [tab]** button — switches to the relevant reference tab
- **Reset** button — calls `DM._resetRulesEntry(type, name)` and re-renders

A **Reset all overrides** button (`DM._resetAllRules()`) wipes all three maps and
re-renders all reference tabs and Config.

When no overrides exist the section shows an instruction message directing the DM to
the Edit buttons in the reference tabs.

### Download / Upload

`DM.download()` includes `rulesOverrides: loadRulesOverrides()` in the JSON bundle.

`DM.upload()` restores overrides from the bundle. On **merge** the incoming maps are
spread-merged into the existing maps (incoming entries win on name collision). On
**replace** the override map is replaced wholesale.

---

## Entity picker

Reusable widget (`buildEntityPicker(name, options, checkedSet, placeMap)`) used for
many-to-many relationships: monsters/contacts in places, scenes, and scenarios.

- Selected items appear as removable tokens (hidden checkboxes carry the value to the
  form submit)
- Unselected items appear in a searchable scrollable list below
- Optional place filter dropdown (shown when `placeMap` has entries)
- `DM._pickerAdd(optEl)` / `DM._pickerRemove(btn)` / `DM._pickerFilter(picker)` wire the
  live interaction

---

## Global search

`DM._searchInput(query)` runs on every keystroke in the toolbar search box.

**Campaign search** (when no session is selected): searches all five campaign arrays by
name fragment (case-insensitive, via `search()` from `dm-logic.js`). Results grouped by
type. Each result row has a "Go" button that opens the entry's edit form directly.

**Session filter** (when a session is selected): searches only that session's history
snapshot entries via `filterByScenario()`.

**Reference fallback**: when a campaign query returns zero results, also searches
`DATA.creatures`, `DATA.powers`, and `DATA.items`. Reference results link to the
appropriate read-only tab.

Results panel (`#dm-search-results`) is hidden when empty or closed.

---

## Last-seen annotation

`lastSeen(name, logs)` in `dm-logic.js` scans all history logs for any entry whose name
matches and returns `"<scenarioName> · <date>"` for the most recent match, or `null`.
Shown on monster and special item list cards.

`_allHistoryLogs()` flattens `scenario.history[]` across all scenarios into a single
array for this lookup.

---

## Download / Upload

`DM.download()` serialises `{ version:1, date, contacts, items, monsters, places,
scenarios, characters, rulesOverrides }` as JSON and triggers a browser download named
`moros-campaign-<date>.json`.

`DM.upload()` reads a JSON file via `FileReader`. Prompts: **merge** (add entries not
already present by id/name) or **replace** (overwrite everything). Characters are merged
or replaced in the `moros-characters` key separately. Rules overrides are merged
(spread by type) or replaced. After upload, all reference tabs and Config are re-rendered
to reflect any restored overrides.

---

## dm-logic.js API

Pure functions with no DOM or localStorage dependency.

| Export | Signature | Returns |
|---|---|---|
| `search` | `(query: string, entries: {name}[])` | Matching entries (empty query → all) |
| `createSnapshot` | `(scenario, assignments, date: Date)` | `{scenarioName, date, entries}` |
| `lastSeen` | `(name: string, logs[])` | `"<scenario> · <date>"` or `null` |
| `filterByScenario` | `(scenarioName: string, logs[])` | All entries from that scenario's log |
| `originOf` | `(entry: {owner?, scenarioId?})` | `'player'|'scenario'|'campaign'` |

---

## DATA structure quick reference

| Field | Type | Used by |
|---|---|---|
| `DATA.statistics` | `{name, abbreviation, action}[]` | Stat inputs, bonus selectors, all tabs |
| `DATA.powers` | `{name, statistics, special, description, scenarios, overwhelmed}[]` | Powers tab |
| `DATA.creatures` | `{name, category, motivation, behaviour, stats, attacks, druidBond?}[]` | Bestiary tab |
| `DATA.items` | `{name, statistics?, special?, bulk?, damage?, protects?, boost?, hinder?, material?, masterwork?}[]` | Item Rules tab, Special Items form type selector |
| `DATA.races` | `{name, powers}[]` | Powers filter, Contacts form |
| `DATA.backgrounds` | `{name}[]` | Contacts form |
| `DATA.specToStat` | `{[spec]: abbreviation}` | Contacts form specialization grouping |
| `DATA.places` | `{name}[]` | Contacts form town selector |

---

## Interaction design

### Tab switching

`DM.showTab(name)` removes `active` from every `.panel` and every `.nav-tab`, then adds
it back to the matching panel (`#tab-<name>`) and button (`[data-tab="<name>"]`). No
state is saved or restored between tab visits — lists re-render from `localStorage` on
every `init()` call, and reference tabs render once at startup.

### Opening and closing a form

`_openEditor(formId)` adds `active` to the form pane and `dm-hidden` to the sibling
list pane. `_closeForm(formId)` reverses this. The list is rebuilt from `st[k]` before
closing, so the card reflects any just-saved changes immediately.

There is no unsaved-change warning. Clicking Cancel discards edits silently.

### New vs Edit

Both call the same `build<X>Form(entity?)` function. When `entity` is null the title
reads "New …" and all fields are empty or at defaults. When `entity` is supplied the
title reads "Edit …" and fields are pre-populated. The form's `dataset.id` is set to the
existing id (edit) or `''` (new); `save<X>` uses `form.dataset.id || uid()` to decide
whether to push a new entry or replace the existing one.

### Dynamic list fields (attacks, bonuses, factions, struggles)

These all follow the same pattern:

1. A module-level scratch array holds the in-progress state (`_attacks`, `_itemBonuses`,
   `_factions`, `_struggles`).
2. An `Add` button calls an `_add*()` function that pushes a blank entry and re-renders.
3. Each row has inline `oninput` / `onchange` handlers (`_setAtkField`, `_setBonusField`,
   `_setFactionName`, `_setStruggleDesc`) that write directly into the scratch array —
   no DOM read on save.
4. The `✕` button on each row calls `_remove*()`, which splices the array and re-renders.
5. On form save the scratch array is copied into the saved entry.

Bonus lists additionally go through a registry (`_bonusCtx`) so that the shared
`renderBonuses(bonusId)` / `_addBonus` / `_removeBonus` / `_setBonusField` functions
work identically for both item bonuses and per-attack bonuses.

### Scenario form — scene collapse and DOM sync

The scenario form is the most stateful. `_editingScenario` holds the full working copy.
Because scenes contain nested DOM (entity pickers, challenge lists) that can change
independently, `_syncFromDOM()` must be called before any operation that re-renders the
scene list — add/remove scene, add/remove challenge, add/remove reward, save. It walks
the live DOM and writes all current field values back into `_editingScenario` so nothing
is lost on re-render.

Scene collapse state is tracked in `_expandedScenes` (a `Set` of scene indices).
`_toggleScene(si)` toggles membership and adds/removes the `open` class on the body div.
After a re-render, `renderScenes()` re-opens any scene whose index is in
`_expandedScenes`.

When a scene is removed, `_expandedScenes` is rebuilt with indices shifted down past the
removed position.

### Origin mutual exclusion

Setting `scenarioId` clears `owner`, and vice versa. This is wired to `onchange` on
both selects: `DM._monsterOriginChanged(sel, field)` and `DM._itemOriginChanged(sel, field)`.
The save functions enforce it a second time: if `owner` is non-empty, `scenarioId` is
stored as `''` regardless of what the select holds.

### Category management

The category select is built by `buildCatSelect(selected)` and always includes a
sentinel option `value="__add__"` at the end. `_catChanged(sel)` intercepts that
selection, calls `prompt()` for a name, adds it via `addCategory()` from `categories.js`,
and inserts a new `<option>` before the sentinel. If the user cancels, the select reverts
to `''`. Categories are shared across all editable tabs.

### Entity picker flow

Clicking an option row calls `_pickerAdd(optEl)`:

1. The option `div` is removed from the list.
2. A token `span` is inserted into the tokens area with a hidden checkbox (checked) and a
   `×` remove button.
3. If the list is now empty, a "All options selected." message appears.
4. `_pickerFilter` is called to re-apply any active search/place filter.

Clicking `×` on a token calls `_pickerRemove(btn)`:

1. The token is removed. If none remain, "None selected" appears.
2. A new option `div` is inserted into the list in alphabetical order by label.
3. `_pickerFilter` is called again.

The hidden checkboxes carry values through the normal form submit; no special handling in
`save*` is needed.

### Search flow

Every keystroke in the search input calls `DM._searchInput(value)`. If both query and
session are empty, the results panel is hidden and cleared immediately.

With a session selected, only that session's history log is searched (via
`filterByScenario`). With no session, all five campaign arrays are searched in parallel.
If the campaign search returns nothing, reference content is searched as a fallback.

Results are grouped and capped at 5 per group ("+N more" shown if exceeded). Clicking a
campaign result row calls `DM.<editFn>(id)` and then `DM._searchClose()`, which clears
the input and hides the panel.

### Mark Played

`DM._markPlayed(id)` collects the current scenario's linked monsters (filtered from
`moros-dm-monsters` where `scenarioId === id`), linked items (same from
`moros-dm-items`), and linked contacts (looked up by id from `moros-dm-contacts`).
These three arrays are passed to `createSnapshot(scenario, assignments, new Date())`,
which produces a flat `{scenarioName, date, entries[]}` object. The snapshot is pushed
onto `scenario.history` and persisted. The session dropdown is refreshed to include the
new scenario name.

---

## Configuration page design

### Purpose

Categories currently serve two functions that pull in opposite directions: long-term
campaign organisation (Arc 1, Side Quests, Completed) and session-day focus (Tonight,
Boss, Rumour). A DM who has built up 40 monsters across 8 categories does not want to
scroll past all of them mid-session to find the 6 that matter tonight.

The configuration page gives the DM two things: a proper UI for managing categories
(replacing the current `prompt()` dialogs) and a per-category flag that controls
whether entries in that category are shown in session mode.

---

### Session mode

A toggle button in the toolbar — **Prep / Session** — switches the entire tool between
two viewing contexts.

**Prep mode** (default): all entries are shown regardless of category. The DM adds,
edits, organises, and plans.

**Session mode**: only entries whose category is marked session-visible are shown in the
five editable tabs. Reference tabs (Bestiary, Powers, Item Rules) are always shown in
full regardless of mode.

The toggle state is persisted in `localStorage` (`moros-dm-session-mode: true|false`)
so the DM reopening the tool mid-session stays in session mode.

```
[← Game Suite]   [🔍 Search…] [All sessions ▾]   [Prep | Session]  [↓ Download] [↑ Upload]
```

In session mode the active tab's panel header gains a visible indicator (e.g. a coloured
border or a mode badge) so the DM always knows which context they are in.

---

### Config page

A ninth tab — **Config** — added to the right of Item Rules. It replaces all
`prompt()` dialogs for category management and is the only place session-visibility
is controlled.

```
nav:  Contacts | Special Items | Monsters | Places | Scenarios | Powers | Bestiary | Item Rules | Config
```

The Config tab has four sections: **Categories**, **Tab Filters**, **Rules Overrides**,
and **Campaign**.

#### Category list

A full-width list. Each row:

```
[≡]  Combat              [● Session]  [Rename]  [✕]
[≡]  Story               [○ Prep only] [Rename]  [✕]
[≡]  Background          [○ Prep only] [Rename]  [✕]
[≡]  Tonight             [● Session]  [Rename]  [✕]

                                         [+ Add Category]
```

| Control | Behaviour |
|---|---|
| `≡` drag handle | Reorders categories; the order here is the order they appear in all filter dropdowns and form selects across the tool |
| Session / Prep only pill | Toggles `sessionVisible`. Clicking flips the flag and saves immediately |
| Rename | Turns the name into an inline text input; pressing Enter or clicking away saves |
| `✕` | Deletes the category after inline confirmation ("In use by N entries — delete anyway?") |
| `+ Add Category` | Appends a new row with an empty inline name input, focused immediately |

The count of entries using each category is shown dimly beside the name:

```
[≡]  Combat  · 12 monsters, 3 places    [● Session]  [Rename]  [✕]
```

This count is derived at render time from all five campaign arrays. It removes the
ambiguity of deleting a category that still has entries.

#### Deletion behaviour

Deleting a category does not change the entries that use it. Those entries retain the
category string in their data; it simply stops appearing in filter dropdowns and form
selects. The DM can reassign them later. This matches how removing an option from a
select works elsewhere in the tool — no cascade delete.

If the deleted category was session-visible, entries carrying it become invisible in
session mode until reassigned. The deletion confirmation warns about this:

```
"Combat" is marked Session. 12 entries will be hidden in session mode until reassigned.
Delete anyway?   [Delete]  [Cancel]
```

---

### Data model change

`moros-dm-categories` currently stores `string[]`. It becomes:

```js
[
    { name: "Combat",     sessionVisible: true  },
    { name: "Story",      sessionVisible: false },
    { name: "Background", sessionVisible: false },
    { name: "Tonight",    sessionVisible: true  },
]
```

**Migration**: on load, `loadCategories()` in `categories.js` checks whether the stored
value is an array of strings or an array of objects. If strings, it migrates by wrapping
each as `{ name, sessionVisible: true }` (visible by default) and writes the new format
back immediately. No user action required.

---

### Session mode filtering

When session mode is active, each editable tab's `render*()` function applies a
pre-filter before the existing category filter:

```js
const sessionCats = new Set(
    loadCategories()
        .filter(c => c.sessionVisible)
        .map(c => c.name)
);

// applied before the existing _catFilter
const visible = st.monsters.filter(m =>
    !m.category || sessionCats.has(m.category)
);
```

Entries with no category are always shown in both modes — they are unclassified, not
hidden.

The category filter dropdown in session mode only lists session-visible categories (plus
"All"). Non-session categories are absent from the dropdown, not just greyed out.

The four category filter dropdowns (Items, Monsters, Places, Scenarios) live on the
Config page in a **Tab Filters** section, not on the individual tab pages. The individual
tabs show the filtered result directly; the Config page is the single place to change
what category each tab is scoped to.

---

### Campaign management on the Config page

The Download and Upload buttons currently sit in the toolbar, occupying space that is
needed during both prep and session. They are not frequent actions — a DM downloads
before a session and uploads to restore a backup, not while switching tabs. Moving them
to the Config page clears the toolbar and groups all tool-wide actions in one place.

The Config tab gains a second section: **Campaign**.

```
── Campaign ────────────────────────────────────────────────────

  Download campaign
  Save all campaign data and characters to a JSON file.
  Filename: moros-campaign-2026-03-20.json
                                              [↓ Download]

  Upload campaign
  Load a campaign file. You can merge new entries into the
  current data or replace everything.
                                               [↑ Upload]

  Danger zone
  Wipe all campaign data from this browser. This cannot be
  undone. Download first.
                                          [Wipe campaign…]
```

**Wipe campaign** is a new action that does not exist today. It clears all five campaign
localStorage keys and the character key, then re-renders all lists to empty. The button
label ends in `…` to signal a confirmation step. The confirmation is inline — a small
warning row that replaces the button:

```
  This will delete everything. Are you sure?
  [Confirm wipe]  [Cancel]
```

No `confirm()` dialog. The confirmation lives inside the Config panel where the DM's
attention already is.

#### Toolbar after the move

With Download and Upload removed, the toolbar becomes:

```
[← Game Suite]   [🔍 Search…] [All sessions ▾]   [Prep | Session]
```

Cleaner. The session mode toggle is the only action available at all times, which
accurately reflects its frequency of use.

---

### Config page — Rules Overrides section

See [Rules overrides](#rules-overrides) for the full design. This section is generated
by `_renderConfigRulesSection()` and injected into `renderConfig()` between Tab Filters
and Campaign. It shows no content when no overrides exist.

### Config page — additional sections (future)

The Config tab can absorb any future tool-wide settings without cluttering the toolbar
or adding more nav tabs. Candidates:

| Section | Content |
|---|---|
| Damage types | Reorder or rename the damage type options used in attack blocks |
| Place types | Reorder or rename the place types (town, city, ruins, castle, monastery) |

These are not part of the current design and require no implementation now.

---

### Implementation steps

| Step | Description | Effort | Blocked by | Done |
|---|---|---|---|---|
| C1 | Migrate `categories.js`: string[] → `{name, sessionVisible}[]`; update `loadCategories` / `addCategory`; write migration on load | Low | — | Yes |
| C2 | Add Config tab to `dm.html`; build category list renderer with inline rename/add/delete and session toggle | Med | C1 | Yes |
| C3 | Move Download and Upload out of toolbar into Config Campaign section; add Wipe action with inline confirmation | Low | C2 | Yes |
| C4 | Add session mode toggle to toolbar; persist flag; wire `render*()` functions to pre-filter by session-visible categories | Med | C1 | Yes |
| C5 | Update category filter dropdowns in session mode to show only session-visible options | Low | C4 | Yes |
| C6 | Show entry count per category in the Config list | Low | C2 | Yes |

C1 is the only step with a data-format risk. The migration must be written defensively
(handle both `string` and `object` array members) and should be tested before C2 or C4
touch any UI.

---

## Editor layout — deliberate design decision

The five editable tabs use a card grid for the list and a **full-width editor** for the
form. These two modes are mutually exclusive: the list is hidden while the form is open
and vice versa. This is intentional and should not be changed.

The forms are long. The monster form alone contains eight stat inputs, description,
motivation, behaviour, druid bond, origin fields, and an unbounded number of attack
blocks each with their own bonus lists. The scenario form contains nested scenes,
challenges, and reward rows that can exceed several viewport heights. A narrow or
side-by-side panel cannot accommodate this without truncation or forced scrolling in
two axes.

The `max-width: 860px` on `.dm-form-pane` is a readability cap, not a layout
constraint. On a typical DM laptop the form fills the usable content area comfortably.

Do not introduce a split-pane (list alongside form), an inline card editor, or a modal
overlay for any of these forms. The full-width, full-attention editing context is the
right model for the level of detail these forms require.

---

## Implementation status

| Step | Description | Done |
|---|---|---|
| D1 | Card grid list + full-width editor replacing split pane in all 5 tabs | Yes |
| D2 | Monster form: motivation, behaviour, statReduced per attack, druid bond | Yes |
| D2b | Monster origin fields (scenario/owner) + origin badge + filter | Yes |
| D2c | Special Item origin fields (scenario/owner) + origin badge + filter | Yes |
| D3 | `DATA.powers` with `scenarios[]` and `overwhelmed` (37 entries) | Yes |
| D4 | Powers reference tab | Yes |
| D5 | `DATA.creatures` (all categories, 60+ entries) | Yes |
| D6 | Bestiary reference tab with category filter and "Copy to Monsters" | Yes |
| D7 | `DATA.items` with boost/hinder/damage/protects/material/masterwork | Yes |
| D8 | Item Rules reference tab with category filter and "Copy to Items" | Yes |
| D9 | Global search bar with campaign + reference fallback | Yes |
| D10 | Scenario history: snapshots + last-seen annotation | Yes |
| D11 | Temporal search filter (session dropdown) | Yes |
| U1 | Stat stepper: add − / + buttons flanking each stat input in the monster form | Yes |
| U2 | Sticky save: duplicate Save / Cancel at the top of every form pane | Yes |
| U3 | Unsaved-change guard: set a dirty flag on any field change; warn on Cancel if dirty | Yes |
| U4 | Attack meta layout: fix 4 fields in 3-column grid — use 4 equal columns | Yes |
| U5 | Larger edit/delete targets: increase `.dm-btn-icon` padding; replace ✎ with "Edit" text | Yes |
| U6 | Scenario history collapse: show only the most recent snapshot on the card; expand on demand | Yes |
| U7 | Replace `prompt()` for new category with inline name input; replace `confirm()` for delete with inline confirm row | Yes |
| U8 | Entity picker list height: increase `.dm-picker-list` max-height from 8.5rem to 13rem | Yes |
| U9 | Powers filter reset: add "Clear" link beside the three filter dropdowns | Yes |
| U10 | Mark Played separation: visually separate the Mark Played button from Edit and Delete on the scenario card | Yes |
| U11 | Contacts items-provide: replace checkbox grid with entity picker | Yes |
| U12 | Search "+more" clickable — `<button class="dm-search-more">` calling `_searchGoTab` | Yes |
| U13 | Number picker 21-item layout — col calculation: `count%7===0?7:5` for even 3-row grids | Yes |
| U14 | Custom select hover affordance — `.dm-cs-btn:hover` gold border + background | Yes |
| U15 | Second click on custom select button closes popup (toggle: check `_csBtn === btnEl`) | Yes |
| U16 | Drag handle visibility — `.dm-config-drag` always shown; cursor:grab on draggable rows | Yes |
| U17 | Reference tabs always searched (removed `if (totalCampaign===0)` guard) | Yes |
| U18 | Delete confirmation conflict reset — `_requestDelete` resets any open confirmation before opening new one | Yes |
| U19 | "Add category…" styled as separator in custom select popup | Yes |
| U20 | `beforeunload` dirty guard on `init()` | Yes |
| R1 | Rules overrides: `moros-dm-rules-overrides` localStorage key; `loadRulesOverrides`, `saveRuleOverride`, `resetRuleOverride` | Yes |
| R2 | Resolve functions: `resolveCreatures`, `resolvePowers`, `resolveRuleItems` merge overrides at render time | Yes |
| R3 | Edit buttons in Bestiary, Powers, Item Rules tabs; MODIFIED badge for overridden entries | Yes |
| R4 | Inline edit forms: creature (stats, motivation, behaviour, druidBond, attack descriptions), power (description, overwhelmed, scenario uses), item (description, boost/hinder effects) | Yes |
| R5 | Rules Overrides section in Config page (summary list with Go to tab and Reset buttons, Reset all button) | Yes |
| R6 | Rules overrides included in campaign download/upload bundle | Yes |
| R7 | Edit button on bestiary creatures in Monsters tab; cancel/reset re-render both Bestiary and Monsters | Yes |

---

## Unit test coverage (`test/dm.test.js`)

Tests run with `c8 mocha`. Three quality gates before any step is merged:

| Gate | Command |
|---|---|
| Tests + coverage | `c8 mocha` |
| Lint | `eslint html/dm-logic.js html/dm.js test/dm.test.js` |
| Type check | `tsc --checkJs --noEmit` |

Covered by tests:

- `search` — fragment match, case-insensitivity, empty query, no match
- `createSnapshot` — records name, ISO date, all entry types
- `lastSeen` — most recent scenario, null for unseen
- `filterByScenario` — isolates entries by session, empty on unknown
- `originOf` — player/scenario/campaign derivation
- `DATA.powers` shape — every power has `scenarios[]` and `overwhelmed`
- `DATA.creatures` shape — required fields, stat completeness, attack fields
- `DATA.items` shape — statistics↔damage/protects consistency, boost/hinder field validity
