# Generator Implementation Plan

A reference for what the character generator currently does, what it is missing, and what should be implemented so a player has everything they need to build a character.

---

## What works today

| Area | Status |
|---|---|
| Identity fields (name, gender, desc, category) | Done |
| Place selection with description | Done |
| Race selection with change warning | Done |
| Race powers preview (stats, special, description) | Done |
| Progression slots: type label, name, level, XP, stat | Done |
| Add buttons disabled when type-repeat rule blocks | Done |
| Drop last progression | Done |
| Free-vs-XP progression hint text | Done |
| Stat block updated live | Done |
| Background modal: all backgrounds, both stats, specializations | Done |
| Power modal: race powers, both stats, special | Done |
| Specialization modal: unlocked specs, disabled when bg level too low | Done |
| Equipment section: per-background allowance, basic supplies | Done |
| Character sheet: stats, backgrounds, specializations, powers, equipment, cards | Done |
| Roster: save, load, edit, delete, download, upload | Done |
| Stat info modal (click ? on stat) | Done |

---

## Gap 1 — Which stat a progression raises

**Problem**: The background and power modals list both linked statistics but don't say which one would be raised by picking that option *right now*.

The stat alternates by level: `statistics[(level+1) % 2]`. Level 1 raises index 0; level 2 raises index 1; level 3 raises index 0 again. Without this the player cannot plan builds.

**What to implement**:

In `openAddBackground()` (`character.js` line 324), compute the prospective level for each background (current stat + 1, defaulting to 1 if unlearned) and highlight the stat that would be raised.

```
Trader  ·  Char / Hand  →  raises Char at level 1
```

Do the same in `openAddPower()` (line 304).

The `Logic.stat(name)` function returns 0 for unlearned names; `(0 + 1 + 1) % 2 = 0` means index 0 is raised first — matches `learn()`.

**Implementation note**: `#projectedStat` is private on State. Either expose a wrapper on Logic (`Logic.projectedStat(type, name)`) or replicate the `(level+1)%2` formula directly in the render function using `Logic.stat(name)` and `Logic.getPower`/`Logic.getBg`.

---

## Gap 2 — Stat-cap warning (Progression Rule 5)

**Problem**: No stat may be raised more than 3 times in the initial 6 free progressions. The logic already enforces this and throws when violated, but the generator gives no forewarning. The player only discovers the block when clicking.

**What to implement**:

1. **In the modals**: when a choice would breach the cap, mark it as disabled and show the reason inline (same pattern as the specialization bg-level check at line 347).

   Approach: call `Logic.state.validProgress(type, name)` for each choice before rendering. If it returns a string, render the item disabled with the error as meta-text.

2. **In `pickChoice()`**: the call to `Logic.state.learn()` already throws — wrap it in try/catch and surface the error in the UI instead of letting it crash silently.

   ```js
   try {
       Logic.state.learn(type, name);
   } catch (e) {
       alert(e.message);
       return;
   }
   ```

3. **On the add-button row**: when an add button is disabled, add a `title` attribute with the reason from `validProgress`. Currently the reason is silently dropped.

---

## Gap 3 — Overwhelmed state on the character sheet

**Problem**: Powers that go Overwhelmed (triggered either by Power Focus or by a linked stat being 0) are not shown to the player after creation.

**What to implement**:

On the character sheet in `renderCharSheet()` (line 603), for each learned power check whether either of its linked stats is currently 0. If so, append an "Overwhelmed" badge next to the power name.

```js
const overwhelmed = pw.statistics.some(s => Logic.stat(s) === 0);
```

This is purely display — no logic change needed.

---

## Gap 4 — Scenario coverage in the power modal

**Problem**: A player choosing between powers during creation cannot tell which scenarios the power is useful in. Powers are described with `special` (a one-word effect) but not their narrative scope.

**What to implement**:

Add a `description` line to each power entry in the "Choose Power" modal. The DATA object already has `pw.description` for each power. It is shown in the race preview (line 256) but not in the choice modal (line 314).

Change the modal item to include:
```html
<div class="choice-item-desc">${pw.description}</div>
```

Same change applies to the background modal: `bg.description` if present.

---

## Gap 5 — Contact information

**Problem**: Backgrounds grant contacts when learned at a specific place of origin (the rules describe contacts as the social network of the character). These are not surfaced anywhere in the generator.

**Investigation needed**: Confirm whether `DATA.backgrounds` contains contact data or if it is in another structure. If contacts are recorded in data, add them to:
- The background modal (when choosing, show what contacts this background grants at the current place)
- The character sheet (list contacts under Backgrounds)

If contact data is not yet in `data.js`, this gap cannot be closed without a data addition first.

---

## Gap 6 — Disabled add-button explanation

**Problem**: When the last progression was a power and the player clicks "+ Add power", the button is visually greyed out but nothing explains why. The player has to infer the alternation rule.

**What to implement**:

Add a `title` tooltip to each disabled button containing the `validProgress` reason:

```js
const powerReason = Logic.state.validProgress('power', null) || '';
// ...
`<button ... title="${powerReason}">+ Add power</button>`
```

This requires one character to hover on desktop. For mobile, add a static notice below the add-button row that reads the same string when non-null. The `#progression-notice` div (line 62 of the HTML) already exists for this purpose.

---

## Gap 7 — Free progression counter

**Problem**: The hint text says "The first six progression steps do not cost any XP" but doesn't show how many free slots remain. A player can't tell at a glance whether they're in the free window or paying XP.

**What to implement**:

In `renderProgression()` (line 261), compute `freeRemaining = Math.max(0, 6 - Logic.state.progressions)` and update the hint text:

```
The first six progression steps do not cost any XP.  [3 free slots remaining]
```

Or replace the static hint with a dynamic one that reads "All 6 free progressions used. Further steps cost XP." once the count reaches 6.

---

## Gap 8 — Background stat preview at current level

**Problem**: The background modal shows both stats (e.g. "Char / Hand") but the player picking Trader for the second time needs to know they'll get Hand this time, not Char again.

This is a specialised instance of Gap 1. The fix is the same: compute `level = Logic.stat(bg.name) + 1` for each background in the modal and show the stat that `statistics[(level+1) % 2]` selects.

For backgrounds already learned, the alternation should be obvious from the slot list — but the modal is where choices are made and must show the right stat.

---

## Gap 9 — Stat name display bug

**Problem**: `Logic.statName()` (logic.js line 459) returns the abbreviation, not the full name, because it reads `s.abbreviation` in both branches:

```js
export function statName(name) {
    const s = DATA.statistics.find(s => s.name === name || s.abbreviation === name);
    return s ? s.abbreviation : name;  // ← should be s.name for the full name
}
```

The progression slot at line 277 calls `Logic.statName(p.stat)` to display "Statistic : Char" when it should display "Statistic : Charisma". Fix `statName` to return `s.name`.

---

## Gap 10 — Specialization actions disclaimer

**Problem**: The character sheet section header reads "Specialization Actions !! A work in progress, mostly for inspiration !!" (line 663). This is draft text left in production.

**What to implement**:

Either remove the disclaimer once the section is considered stable, or hide the section entirely for now. If the actions data in `DATA.actions` is complete, remove the disclaimer. If it is still incomplete, hide the section entirely rather than displaying an apology.

---

## Development steps

The pattern for each step: (a) add or fix logic in `logic.js`, (b) write a unit test in `test/progression.test.js` that passes, (c) wire the new export into `character.js`. Only (a)+(b) are unit-testable; (c) is verified in the browser. Never move to (c) before (b) is green.

Each step must pass three quality gates before it is considered done:

| Gate | Command | What it checks |
|---|---|---|
| **Tests + coverage** | `c8 mocha` | All tests green; new code is covered by the step's unit test |
| **Lint** | `eslint html/logic.js html/character.js test/` | No new errors or warnings introduced |
| **Type check** | `tsc --checkJs --noEmit` | JSDoc types on new exports are consistent with their callers |

These tools must be installed once before starting Step 1:
```sh
npm install --save-dev eslint c8
# TypeScript is used only as a checker, not a compiler
npm install --save-dev typescript
```

Add to `Makefile`:
```makefile
lint:
	npx eslint html/logic.js html/character.js test/

types:
	npx tsc --checkJs --noEmit --allowJs --moduleResolution node \
	    --target es2020 --module es2020 html/logic.js

coverage:
	npx c8 --reporter=text mocha

check: tests lint types
```

---

### Step 1 — Fix `statName` (Gap 9) · **Low**

**logic.js**: Change `statName()` to return `s.name` instead of `s.abbreviation`.

**Unit test** (`describe('Logic utility functions')`):
```js
it('statName returns the full statistic name', () => {
    assert.strictEqual(Logic.statName('Char'), 'Charisma');
    assert.strictEqual(Logic.statName('Charisma'), 'Charisma');
    assert.strictEqual(Logic.statName('Speed'), 'Speed');      // full name equals abbr for Speed
    assert.strictEqual(Logic.statName('unknown'), 'unknown');  // passthrough for unknown keys
});
```

**character.js**: No change needed — `statName` is already called at line 277 and will now render correctly.

---

### Step 2 — Export `projectedStat` (Gaps 1, 8) · **Med**

**logic.js**: Promote `#projectedStat` from a private State method to a module-level export. The function does not depend on State internals beyond `stat()`, `getBg()`, and `getPower()`, all of which are already module-level.

```js
export function projectedStat(type, name) {
    if (type === 'background') {
        const bg = getBg(name);
        if (!bg) return null;
        const level = stat(name) + 1;
        return bg.statistics[(level + 1) % 2];
    } else if (type === 'power') {
        const power = getPower(name);
        if (!power) return null;
        const level = stat(name) + 1;
        return power.statistics[(level + 1) % 2];
    } else if (type === 'specialization') {
        return DATA.specToStat[name] || null;
    }
    return null;
}
```

Replace the private method body with a call to this export: `return projectedStat(type, name);`

**Unit test**:
```js
it('projectedStat returns the stat that would be raised', () => {
    Logic.initState();
    Logic.state.race = 'Finches';
    // Trader background: statistics[0] raised at level 1, statistics[1] at level 2
    const firstStat  = Logic.projectedStat('background', 'trader');
    Logic.state.learn('background', 'trader');
    const secondStat = Logic.projectedStat('background', 'trader');
    assert.notStrictEqual(firstStat, secondStat, 'alternates between the two stats');
    // Power: same alternation applies
    Logic.state.learn('power', 'musical');
    const musicalNext = Logic.projectedStat('power', 'musical');
    Logic.state.learn('background', 'farmer');
    Logic.state.learn('power', 'musical');
    assert.strictEqual(Logic.projectedStat('power', 'musical'), firstStat === Logic.projectedStat('power', 'musical') ? firstStat : musicalNext);
    // Specialization: always its fixed stat
    const specStat = Logic.projectedStat('specialization', 'Navigation');
    assert.ok(specStat, 'Navigation has a fixed stat');
    // Unknown names return null
    assert.strictEqual(Logic.projectedStat('background', 'nonexistent'), null);
    assert.strictEqual(Logic.projectedStat('power', 'nonexistent'), null);
    assert.strictEqual(Logic.projectedStat('unknown_type', 'anything'), null);
});
```

**character.js**: Import `projectedStat` and use it in `openAddBackground()` and `openAddPower()` to annotate each choice with "→ raises X".

---

### Step 3 — Export `freeProgressionsRemaining` (Gap 7) · **Low**

**logic.js**:
```js
export function freeProgressionsRemaining() {
    return Math.max(0, 6 - state.progressions);
}
```

**Unit test**:
```js
it('freeProgressionsRemaining counts down from 6', () => {
    Logic.initState();
    Logic.state.race = 'Finches';
    assert.strictEqual(Logic.freeProgressionsRemaining(), 6);
    Logic.state.learn('background', 'trader');
    assert.strictEqual(Logic.freeProgressionsRemaining(), 5);
    Logic.state.learn('power', 'musical');
    Logic.state.learn('background', 'farmer');
    Logic.state.learn('power', 'clan');
    Logic.state.learn('background', 'scholar');
    Logic.state.learn('power', 'hearing');
    assert.strictEqual(Logic.freeProgressionsRemaining(), 0);
    // Stays at 0 after 6
    Logic.state.learn('background', 'farmer');
    assert.strictEqual(Logic.freeProgressionsRemaining(), 0);
});
```

**character.js**: Replace the static hint text in `renderProgression()` with a dynamic string that uses this export.

---

### Step 4 — Export `isOverwhelmed` (Gap 3) · **Low**

**logic.js**:
```js
export function isOverwhelmed(powerName) {
    const pw = getPower(powerName);
    if (!pw) return false;
    return pw.statistics.some(s => stat(s) === 0);
}
```

**Unit test**: Base statistics are initialised to 1 and never decrease below 1 through normal progression, so `isOverwhelmed` returns false for every power in a fresh State. The test confirms this and verifies correct handling of an unknown power name.

```js
it('isOverwhelmed returns false for all powers in a normal state', () => {
    Logic.initState();
    Logic.state.race = 'Finches';
    Logic.state.learn('background', 'trader');
    Logic.state.learn('power', 'musical');
    assert.strictEqual(Logic.isOverwhelmed('musical'), false);
    assert.strictEqual(Logic.isOverwhelmed('nonexistent'), false);
});
```

**character.js**: In `renderCharSheet()`, append an "Overwhelmed" badge to each power list item where `isOverwhelmed(p.name)` is true.

---

### Step 5 — Verify `validProgress` covers all modal paths (Gap 2) · **Med**

`validProgress` already returns the reason string for every blocked case, including the new Rule 5 cap. The existing test (`should enforce the creation stat cap of 3`) covers the throw path. Add a test that checks the *return value* for each blocking condition so the modal render code can rely on it without calling `learn()`.

**Unit test**:
```js
it('validProgress returns a reason string for every blocked choice', () => {
    Logic.initState();
    Logic.state.race = 'Finches';
    Logic.state.learn('background', 'trader');
    // Type-repeat block
    assert.ok(Logic.state.validProgress('background', 'farmer'), 'same type blocked');
    // No race selected → power blocked (reset to test this)
    Logic.initState();
    assert.ok(Logic.state.validProgress('power', 'musical'), 'no race = power blocked');
    // Specialization with insufficient bg level
    Logic.initState();
    Logic.state.race = 'Finches';
    Logic.state.learn('background', 'trader');
    Logic.state.learn('power', 'musical');
    assert.ok(Logic.state.validProgress('specialization', 'Navigation'), 'spec level too low');
    // Unknown type
    assert.ok(Logic.state.validProgress('unknown', 'foo'), 'unknown type');
    // Valid path returns undefined
    assert.strictEqual(Logic.state.validProgress('background', 'farmer'), undefined);
});
```

**character.js**:
- In `openAddPower()` and `openAddBackground()`, call `validProgress(type, name)` per choice and mark the item disabled with the reason as meta-text when a string is returned.
- Wrap `Logic.state.learn()` in `pickChoice()` with try/catch and show `e.message` in an alert.
- Pass the `validProgress(type, null)` reason as a `title` attribute on disabled add-buttons and write the same string to `#progression-notice`.

---

### Step 6 — Rendering-only changes (Gaps 4, 6, 10) · **Med**

These require no new logic exports and therefore have no unit tests. They are browser-verified only.

- **Gap 4**: Add `pw.description` to the power choice modal and `bg.description` to the background choice modal.
- **Gap 6**: The `#progression-notice` div and button `title` attributes are populated from `validProgress` returns handled in Step 5.
- **Gap 10**: Remove or hide the "!! A work in progress !!" disclaimer from the character sheet. Decision: hide the Specialization Actions section completely until the content is finalised; remove the heading and its content from `renderCharSheet()`.

---

### Step 7a — Design the contact schema · **Low** ✓

`DATA.backgrounds` has no contact field and `DATA.places` has no contact field. Contacts are mentioned in the game description text only.

**Confirmed schema** — add a `contacts` field to each background entry in `data.js`, keyed by place name, value an array of contact strings. The field is optional (omit it when a background has no contacts at a place):

```js
{ name:"Trader", statistics:[...], items:[...], specializations:[...],
  contacts: {
    "Raft city":   ["harbour master", "spice merchant"],
    "Bockthicket": ["pit boss", "mule trader"],
  }
}
```

**Data dimensions**: 14 backgrounds × 16 places = up to 224 pairs. The map is sparse — only meaningful combinations need entries. `getContacts` returns `[]` for any missing key.

Backgrounds: Noble, Farmer, Scholar, Watch, Crafter, Monastery, Ascetic, Trader, Fisher, Circus troupe, Back alley, Hunter, Miner, Army.

Places: Blackwood freehold, Bockthicket, Chatter Creek, Clear water, Cliffside hold, Elmsfield, Fata morgana, Gap city, Lastwater, Linar harbour, Raft city, Rakeville, Rosepond, Scarlet vale, Steadington, World edge.

---

### Step 7b — Populate contact data in `data.js` · **High**

Write the actual contact entries for every background × place combination that has a meaningful contact. This is pure content authoring — the only high-effort step in the contacts track. The code in steps 7c–7e cannot begin until this data exists.

No unit test. Correctness is verified by reading the output.

---

### Step 7c — Export `getContacts(backgroundName, placeName)` · **Low**

**logic.js**:
```js
export function getContacts(backgroundName, placeName) {
    const bg = getBg(backgroundName);
    if (!bg || !bg.contacts) return [];
    return bg.contacts[placeName] || [];
}
```

**Unit test**:
```js
it('getContacts returns contacts for a background at a place', () => {
    // Use a background+place pair known to have contacts from 7b
    const cs = Logic.getContacts('Trader', 'Raft city');
    assert.ok(Array.isArray(cs), 'returns an array');
    assert.ok(cs.length > 0, 'has at least one contact');
    // No place match returns empty array
    assert.deepStrictEqual(Logic.getContacts('Trader', 'nonexistent place'), []);
    // No contacts field returns empty array
    assert.deepStrictEqual(Logic.getContacts('nonexistent', 'Raft city'), []);
});
```

---

### Step 7d — Show contacts in the background modal · **Low**

**character.js**: In `openAddBackground()`, call `Logic.getContacts(bg.name, Logic.state.place)` for each background and, if the array is non-empty, append a contacts line to the modal item.

No unit test. Verified in the browser.

---

### Step 7e — List contacts on the character sheet · **Low**

**character.js**: In `renderCharSheet()`, under each learned background, call `Logic.getContacts(bgName, Logic.state.place)` and append the contact names inline.

No unit test. Verified in the browser.

---

### Step 8 — Wire `projectedStat` into modals · **Low**

`projectedStat` has been exported since Step 2 but the modal items still show both linked stats without indicating which one is next. A player choosing Trader for the second time cannot tell they will get Hand instead of Char again.

**character.js**: In `openAddPower()` and `openAddBackground()`, call `Logic.projectedStat(type, name)` for each item and append "→ raises X" to the stats meta line, for both enabled and disabled items.

No unit test. Verified in the browser.

---

### Step 9 — Wire `freeProgressionsRemaining` into hint text · **Low**

`freeProgressionsRemaining` has been exported since Step 3 but the hint text beneath the Progression heading is still the static string written at project start.

**character.js**: In `renderProgression()`, replace the static hint with a dynamic string:
- While free slots remain: `"The first six progression steps do not cost any XP. [N free remaining]"`
- Once the free window closes: `"All 6 free progressions used. Further steps cost XP."`

No unit test. Verified in the browser.

---

### Step 10 — Wire `isOverwhelmed` badge into the character sheet · **Low**

`isOverwhelmed` has been exported since Step 4 but the character sheet powers list shows no indicator when a power's linked stat is 0.

**character.js**: In `renderCharSheet()`, for each learned power call `Logic.isOverwhelmed(p.name)` and append an "Overwhelmed" badge when true.

No unit test. Verified in the browser.

---

### Step 11a — Decide carry capacity formula · **Low** ✓

`state.weight` is computed (sum of item bulk values; negative bulk items increase capacity). RULES.md states "carrying capacity is determined by Endurance" but gives no multiplier or threshold.

**Confirmed formula**: capacity = `Endu × 5`. A character is encumbered when `state.weight > carryCapacity()`.

Validation against item data:
- Endu 1 (base, capacity 5): covers light loads — knife (0), clothes (1), food (1), bedroll (1) = 3
- Endu 2 (capacity 10): fits a typical soldier — spear (3) + leather (2) + shield (2) + food (1) + bedroll (1) = 9
- Endu 3 (capacity 15): fits a heavy kit — glave (5) + breastplate (2) + crossbow (4) + supplies = 13
- Pack animals reduce net bulk: donkey (−9), cart (−20), horse (−6), backpack (−3) extend effective capacity

This step produces a written decision only — no code.

---

### Step 11b — Export `carryCapacity()` · **Low**

**logic.js**:
```js
export function carryCapacity() {
    return Logic.stat('Endu') * 5;
}
```

**Unit test**:
```js
it('carryCapacity equals Endu times 5', () => {
    Logic.initState();
    Logic.state.race = 'Finches';
    assert.strictEqual(Logic.carryCapacity(), 5); // base Endu = 1
    Logic.state.learn('background', 'farmer');
    assert.strictEqual(Logic.carryCapacity(), 10); // Endu raised to 2
});
```

Blocked by 11a.

---

### Step 11c — Wire bulk and capacity into the character sheet · **Low**

**character.js**: In `renderCharSheet()`, add a line to the Equipment section showing current bulk total and carry capacity:

```
Bulk: 3 / 10  (Endu 2 × 5)
```

Use `Logic.state.weight` for the current total and `Logic.carryCapacity()` for the limit. Add a visual warning class when weight exceeds capacity.

No unit test. Verified in the browser. Blocked by 11b.

---

### Step 12 — XP total on the character sheet · **Low**

XP is visible during creation but absent from the finished roster sheet. Once the DM awards XP between sessions the player has no reference without opening the edit view.

**character.js**: In `renderCharSheet()`, add `XP: ${Logic.state.xp}` to the stats grid or the sheet header alongside race and place.

No unit test. Verified in the browser.

---

## Steps summary

| Step | Description | Gaps | Effort | Unit test | Coverage | Lint | Types | Blocked by | Done |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Fix `statName` | 9 | Low | yes | yes | yes | yes | — | ✓ |
| 2 | Export `projectedStat` | 1, 8 | Med | yes | yes | yes | yes | — | ✓ |
| 3 | Export `freeProgressionsRemaining` | 7 | Low | yes | yes | yes | yes | — | ✓ |
| 4 | Export `isOverwhelmed` | 3 | Low | yes | yes | yes | yes | — | ✓ |
| 5 | Wire `validProgress` into modals | 2 | Med | yes | yes | yes | yes | — | ✓ |
| 6 | Rendering-only changes | 4, 6, 10 | Med | no | — | yes | — | 2, 5 | ✓ |
| 7a | Design contact schema | 5 | Low | no | — | — | — | — | ✓ |
| 7b | Populate contact data | 5 | High | no | — | — | — | 7a | ✓ |
| 7c | Export `getContacts` | 5 | Low | yes | yes | yes | yes | 7b | ✓ |
| 7d | Background modal contacts | 5 | Low | no | — | yes | — | 7c | ✓ |
| 7e | Character sheet contacts | 5 | Low | no | — | yes | — | 7c | ✓ |
| 8 | Wire `projectedStat` into modals | 1, 8 | Low | no | — | yes | — | 2 | ✓ |
| 9 | Wire `freeProgressionsRemaining` into hint | 7 | Low | no | — | yes | — | 3 | ✓ |
| 10 | Wire `isOverwhelmed` badge | 3 | Low | no | — | yes | — | 4 | ✓ |
| 11a | Decide carry capacity formula | — | Low | no | — | — | — | — | ✓ |
| 11b | Export `carryCapacity` | — | Low | yes | yes | yes | yes | 11a | ✓ |
| 11c | Wire bulk/capacity into sheet | — | Low | no | — | yes | — | 11b | ✓ |
| 12 | XP total on character sheet | — | Low | no | — | yes | — | — | ✓ |
