# What NPCs Are For

Design goals for every named NPC in the setting. A well-rounded NPC fills **as many of these goals as possible** — aim for all of them when writing a new character, and only accept fewer when the role genuinely cannot support more. The more of these an NPC carries, the more sessions they can usefully appear in, and the less likely they are to feel like a one-use prop.

A character does not need to deliver all of these at once in play, but every NPC should be capable of at least two or three of them on the page, and every NPC should carry the last one.

## Two layers — the file vs. the campaign document

NPC and place files in this repo are written for **two readers** at two layers.

**The full file** (this kind of file) is **deep reference** — the DM's prep material, and the place a DM looks when a specific question comes up. It carries everything needed to run the character or location across many sessions: stories, reaction triggers, mannerisms, cross-NPC takes, DM notes, background. Length is not the enemy here; *misleading brevity* is. A DM with a question should be able to find an answer.

**The campaign document** (the actual PDF the DM uses at the table) is **brief** — just what is needed to grasp the NPC or place and play their role. It is compiled from one small dedicated section of each file. It does not duplicate the rest of the file; it does not try to summarise the whole. It gives the DM enough to play at speed and lets them open the file when they want more. **Help the DM; do not hinder them with detail at the table.**

### The marker convention

Each NPC or place file carries a **`## Campaign brief`** section near the top — placed after the header lines (Role, Species, Lives, First met) and before the file's first scene-section ("What the party meets" or equivalent).

For an **NPC**, the Campaign brief contains:

- **Role** — one line, restated from the header for context.
- **Two or three standout descriptions** — the most distinctive sensory/behavioural cues, deliverable from memory.
- **Speech tag** — one line on how they speak, or one trigger-keyed phrase a DM can deliver verbatim.
- **What they ask the party for** — early-game and late-game quests in *one line each*, with a cross-reference to §"Personal goals — early and later" for specifics.
- **One friction line** — the disagreement, the limit, the pressure that makes the NPC interesting.
- **Pointer to the full file** — *"Full character: `doc/npcs/X.md`."*

For a **place**, the Campaign brief contains:

- **What kind of place it is** (one line).
- **Two or three standouts on entry** — sensory, immediate.
- **Named residents** with one-line roles.
- **The thing that shapes scenes here** — the air, the rhythm, the pressure (one line).
- **Pointer to the full place file** — *"Full place: `doc/places/X.md`."*

The brief is **at most one page in the PDF** — typically ten to fifteen lines for a major NPC, fewer for minor ones. A brief that runs longer is the wrong document; the rest belongs in the file.

### What does *not* go in the brief

Full stories, full reaction-trigger tables, full cross-NPC takes, DM-strategic notes, background, open questions, sources, lore cross-references. The file holds these; the brief points to them.

### No duplication

The brief is *distinct, narrower content*, not a recap of the file. Anything in the brief should appear *only* in the brief, not also in the deeper sections. (The Role line, restated as both header and brief opener, is the only tolerated exception — and only because the brief gets compiled out, where the header does not travel.)

### Leave room for the DM

The brief gives the DM the spine; the DM provides the angles. A brief that hands the DM a sentence for every situation is overspecifying; a brief that gives them the shape of the character and lets them improvise from it is doing the work the PDF is for. *Help, don't hinder.*

The full file is for the prep night and the question that comes up mid-session; the brief is for the table.

## 1. A unique view on the world

Each NPC sees Moros from an angle the group does not. A forge-master in World Edge understands the politics of labour and expulsion differently from a mage in a castle, and differently again from a scavenger of the blasted lands. When the group talks to them, they should come away with a perspective they could not have reached on their own — even if they disagree with it.

## 2. Possible friction with the group

NPCs are not there to validate the party. They can and should clash — on opinions, on methods, on priorities, on where the story should go next. Disagreement is a feature: it forces the group to articulate what they actually believe, and it opens plot directions the party would not have chosen on their own. A helpful NPC who happens to want a different outcome is more interesting than either a pure ally or a pure antagonist.

## 3. Aid when the group needs it

When the group is stuck, an NPC should be able to help — with **information** they could not easily find, a **skill** the party does not have, or a **unique item** that changes what is possible. This aid should be earned: it flows from the relationship, not from the NPC's job description. An NPC who hands over their best asset on first meeting is a vending machine; an NPC who gives it after the party has shown they understand the stakes is a story.

## 4. Teaching

NPCs can teach — skills, knowledge, or ways of seeing. Teaching is slow and partial; it is rarely a single scene. It is also a way to bind the group to the setting: the techniques, names, and habits a character teaches them become part of how they solve later problems.

## 5. A secret they will not willingly share

Every NPC carries at least one thing in their history they do not want to talk about. It may be a failure, a shame, a crime, a betrayal, a loss, a debt, or simply something whose meaning they cannot yet face. The secret is not a puzzle for the party to solve; it is the pressure that gives the character shape. It answers questions the NPC themselves cannot: why they settled here, why they avoid that topic, why their generosity stops at a specific line. The party may uncover it, or may never. Either way, it should govern the NPC's choices before it governs the plot.

## 6. Personal goals — early and later (the NPC's quests)

Every substantial NPC has things they want done that they cannot, or will not, do themselves. These are the **quests** the NPC asks the party to undertake — by direct ask or by leaving a door open. A sustained relationship with an NPC produces a sequence of them: early-game quests land first, when trust is being earned; late-game quests land later, when standing is real.

The framework distinguishes **goals** from **quests**:

- A **goal** is what the NPC is *trying to accomplish* (close the Bean bargain honourably; bring her family home; hold the kingdom's quiet shields steady).
- A **quest** is a *specific task* the party can take on toward that goal (read the orders book at Clear Water Mine; carry Elliot's corrected proclamation to Hannes; broker the meeting between Wilder and Gerhald).

One goal often produces multiple quests. An NPC can carry several goals running in parallel.

### Each quest, specific enough to play at the table

A DM scanning the section should see, for every quest:

- **A name** for the quest — short, concrete, scannable.
- **What the NPC says** — in their voice, italicised, the line a DM can deliver close to verbatim. This is the hook: how the ask reaches the party, in which scene, after what trust has been earned. Include the *trigger* if it matters (*"around the second campfire after recovery"*, *"when the topic of her father comes up at length"*).
- **Where** — the specific location the quest takes the party. A place file if one exists; otherwise a named region with cross-references. *"The mine"* is not a location; *"the locked drawer above the assay table at Clear Water"* is.
- **What** — the concrete task. Operational. *"Find the locked drawer; access it; copy or take the orders book; bring it back"* — not *"investigate the mine."* A DM should be able to run the next session from this line alone.
- **Reward** — what advances on success. Standing with the NPC, a piece of intelligence, an opened relationship with another NPC, a teaching, a capability, a thread closed. Concrete. Quests that pay only in mood-points are not quests.
- **Complications** — what makes it hard. The shape of the problem. One or two lines is enough.

### Multiple quests per goal

The split into early-and-later is not a quota; it is an organisation. Examples in shorthand (each line is a quest, grouped by goal):

- *Goal: find out what went wrong with her family.* Quests: read the orders book at Clear Water Mine; walk the old mill with Felix; meet Steven on her terms.
- *Goal: be the king who did not start the second war.* Quests: surface the Corven–Penelope conspiracy safely; back Felicia's spirit-corridor with the abbot's voice; open the Leatherman channel through Queen Fienna.
- *Goal: close the orphanage-coin chain.* Quests: carry Hank's letter to Ingram (trip 1, no bag); return with the name; carry the bag to Darrel (trip 2); accept the redirection to the alms-chest.

A quest is *one specific thing* the party can decide to do this session, not next month.

### Pacing across the campaign

- **Early-game quests** land in the first sustained encounter with the NPC. Local in scale, modest in stakes, produce a tangible advance in the relationship. They do not require campaign-spanning standing to attempt.
- **Late-game quests** require standing the party has earned. They are usually larger in scale (cross-kingdom travel, court audiences, dungeon-level engagements) and produce campaign-scale shifts. They often require an early-game quest to have completed first; flag the prerequisite.
- A party can decline or defer. The NPC's goals continue without them; quests can wait. **Time pressure is internal to the NPC's situation, not arbitrary** — the family wondering, the working bleeding, the war approaching. Make it specific or do not invoke it.

### Quest hooks vs. open doors

Some quests are **explicit asks** — the NPC tells the party what they need done, plainly, after standing has been earned. Others are **open doors** — the NPC has not asked, but a party reading the situation can act without being told. Both are legitimate. The file should make the distinction visible where it matters (*"She does not ask. The door is open if the party walks through."*).

### What this section is *not*

- Not a chore list. *"Help her sort her shop"* is not a quest unless something specific is at stake.
- Not a railroad. The party can refuse, defer, or take quests in any order; the file describes what is available, not what is required.
- Not all quests need to fire. Some only activate if a particular campaign arc opens (the Brumal spiritual path, the last flight, the shamans' long plan); flag those as *conditional*.
- Not a duplicate of the *aid* section (§3). Aid is what the NPC offers the party; quests are what the NPC asks of the party. They are reciprocal sides of the same relationship.

### Worked examples

Worked examples of the new specific-quest format are being rolled out across the NPC files. Existing files with prose-form goals describe the shape of each NPC's threads at a higher level; conversion to specific quests is a separate pass per file.

## Playable at the table

Beyond what an NPC *carries* (above), every NPC file must also support the DM running the character at the table. The full conventions are in `doc/claude/SCENE_FIRST.md`; the requirements that matter for NPC writing specifically are:

### A defined place where they live (or a circuit they move through)

Every NPC must have a **specific, named home** — a treehouse, a cottage, a workshop, a back room of an inn, a tower, a farm. *"Lives in the village"* is not a place; it is a fact. The home should be where the party can reliably find them when nothing else is happening, and it should be specific enough to be a scene location.

That home is a **place**, and per the place-side goals (see `doc/claude/SCENE_FIRST.md` §"For places: the 2–3 things that stand out on entry") it must come with **2–3 things that stand out on entry** — sensory, immediate, distinctive. The party stepping into Diederik's treehouse should see something they would not see at any other owl elder's home; the party walking into Bridget's Inn should feel that the rooms are *inside* a living tree.

**Itinerant NPCs** (scouts, traders, hermits-on-the-move) substitute *a circuit* for a fixed home: the named pattern of where they go, with rough seasonality where it matters, and the same 2–3 standouts treatment of *what marks an encounter with them on that circuit*. A party should still be able to find them — reliably, if not on demand. An off-circuit fallback (where they go when the circuit doesn't suit) should be noted, even if the NPC themselves won't disclose it. See `doc/npcs/felix.md` §"Where to find him — the fair circuit" for the worked example.

**Companion NPCs** (those who travel with the party for substantial stretches) substitute *with the party* as their home: where the party is, they are. The standouts then attach to *what travelling with them is like* — a recurring physical motif (a dog, a tool habit, a daily ritual), the rhythm of their participation in camp and on the road. Pre-companion phases (e.g. while still a patient or a captive) need their own brief scene-location handling. See `doc/npcs/irna_bean.md` §"On the road with her — Phase 2" for the worked example.

**When three or more NPCs live in the same location, that location needs its own place file** in `doc/places/`. The NPC files cover the people; the place file covers the building/region/grounds, the standouts on entry, the visible patterns, the reaction triggers that belong to the place rather than to any one resident. Each NPC file then *points* to the place file rather than restating it. Worked examples: `doc/places/luchebert_monastery.md` (Elliot, Willow, Brother Darrel, the lay community); `doc/places/elmsfield.md` (Diederik, Bridget, Wilfred, Joseph, Hank, Egbert, Corné, Ralph); `doc/places/hanks_farm.md` (Hank, Egbert, the orphans); `doc/places/scarlet_vale.md` (Hannes, Fienna, Corven, Steven, Rhianna).

### 2+ standout descriptions of the NPC themselves

When the party first encounters the NPC, **at least 2 things should stand out about them visually or behaviourally** — sensory and immediate, not biographical. Not *"a respected elder"* but *"an old owl in plain wool with feathers grey for a long time, walks with a staff he does not lean on hard."* Not *"a stern abbot"* but *"hands stained with the same wax he uses on the shrine candles, eyes that close fully before he gives a long answer."*

Two is the minimum; three is better. They should be *what hits the eye and ear in the first moment of meeting*, not what the party learns about the NPC over time.

### Stories the NPC tells

Every NPC's history should be **converted into short, trigger-keyed stories** the NPC tells when the relevant topic comes up — 3–7 sentences each, in the NPC's voice, italicised in quotes so the DM can deliver them close to verbatim. Each story has a trigger (what topic cues it) and the story itself. Six stories is a good target for a character with substantial history; fewer for a smaller role. See `doc/npcs/elder_diederik.md` §"Stories he tells" for the worked example.

**Non-verbal NPCs** (mute beings, puppets without voice, spirits that don't speak in words) still need this section, but the *medium* changes. The structure is the same — trigger-keyed, sequential, in the NPC's own register — but the content is **described drawings, breath patterns, gesture sequences, or whatever the NPC's actual channel of expression is.** The DM should narrate the channel as it happens (*"He draws the door, then the dust line lengthening across the floor, then a small pot at the centre of the dust, sweeping"*) rather than summarise. See `doc/npcs/pot_person.md` §"Drawings he makes (his version of stories)" for the worked example.

### Reaction triggers — "if the party does X, they react Y"

The topic table covers questions the party might *ask*. It does not cover actions the party might *take*. Every NPC file should include a short table of **specific actions the party might do, paired with the NPC's specific reaction** — boundary violations, surprising gifts, threats, alliances offered, betrayals, revelations.

Reactions must be **specific physical actions with consequences**, not adjectives. Not *"he is upset"* but *"he stops speaking to them; the town notices the silence within a week; standing in Elmsfield begins to slip."* The DM should be able to deliver the reaction without inventing it.

Six to ten reaction triggers is a good target — cover the actions most likely at the table, not every possibility.

### Cross-NPC quick takes

A one-line **opinion** per significant other NPC the party may ask about. Not a description of the relationship (that goes in the Relationships block); the NPC's *stance*. Players ask *"what do you think of X?"* constantly, and the file should answer in one line per significant figure.

**Keep the list short — about 10 entries.** Longer lists overwhelm a DM scanning at the table. Pick the figures this character has the most *generative* opinions about and that the party is most likely to ask after. Italicised quotes the DM can deliver verbatim work best.

The "about 10" is a **cap, not a floor**. NPCs who have genuinely met few people (recluses, non-verbal beings, beings who lived alone for centuries) can have *four* takes and be done. If the file feels short here, check whether the NPC has actually met anyone else; sometimes brevity is correct.

### Mannerisms for emotional states

Every NPC file should record **specific physical mannerisms** for at least three emotional states:

- **When pressed** — questioned hard, accused, asked for something they don't want to give.
- **When distraught** — grief, fear, betrayal, ecological loss.
- **When happy** — rare or steady, what's the visible tell.

Mannerisms must be **specific and physical**, not adjectival. *"Turns away to look at the tree, hands flat against the bark, will not face the speaker until the topic changes"* — not *"becomes withdrawn."*

### Speech traits

Every NPC should have a **distinctive way of speaking** — idiosyncratic phrases, sentence rhythms, recurring images, verbal habits — that emerges naturally as the stories accumulate. (The deliberate-design space here is being explored on its own track; see `doc/claude/SCENE_FIRST.md`.)

### Scene-first file structure

The NPC file should be **organised by scene location**, not by chronology — *what does the party see, hear, and do at this place with this NPC?* — with backstory relocated to a small DM-reference section near the end. Full conventions in `doc/claude/SCENE_FIRST.md`.

### Character sheet

Every NPC must carry a **full character sheet built through the in-game progression system**. The sheet sits at the bottom of the file under `## Character sheet`, generated by `tools/character.js`. It is the single source of truth for what the NPC can do mechanically; the JSON spec lives in `data/roster.json`, the rendered sheet lives in the NPC file beside it.

**The progression *is* the life path.** Background, power, and specialization choices made in order tell the story of where the NPC grew up, who trained them, what they leaned into, what they came back to. Bridget's *Trader → Politics → Navigation → Hearing → Trader → …* is a Finch who left her counting house, learned to read a room and a road, and came back to trade with both. The order matters; *do not* compose the sheet by picking the strongest options and sorting later. Build it as a biography.

**Cadence and limits** (canonical: `doc/claude/RULES.md` §"Progression"; enforced in `html/logic.js`):

- The first 6 progressions cost 0 XP. From #7 onward each costs `level²` XP (1 / 4 / 9 / 16 / 25 for levels 1 / 2 / 3 / 4 / 5). Most NPCs sit at 6–8 progressions; older masters and royalty go further (and carry the XP).
- **No two backgrounds in a row**, and **no two specializations in a row** — a power must separate them. Powers themselves may repeat (deepening mastery).
- A specialization can only be learned once a background that unlocks it has been taken; spec level can never exceed the **combined** level of all supporting backgrounds.
- No single statistic may be raised more than **3 times in the first 6 progressions**. Stats above 4 belong to post-creation XP work — i.e. *life since the path crystallised*.
- Powers must come from the character's race list (`RULES.md` §"Races and Powers"). The 16-race table covers everyone in the setting; if an NPC's species isn't on it, that's a setting issue to flag, not a sheet to fudge.
- Items must be earned by chosen backgrounds (and basic supplies once each). The tool warns about items the backgrounds wouldn't allow.

**Mentor evaluation — one line per specialization.** For every specialization on the sheet, name the mentor and the place in a short italicised line beneath the bullets. *Nadine's Navigation: the Raft City navigator-schools, four years as a fledgling, taught in rotation by half a dozen senior navigators of her group rather than by a single master.* *Diederik's Druid: the order he is now exiled from, fifty years ago, names redacted.* The mentor justifies the specialization being on the sheet at all (RULES.md: specializations are "trained skill"), and locates the NPC in the world's web of teachers without inventing a new face. **Do not promote the mentor to an NPC file** unless the party can plausibly reach them as a scene; if they can, the mentor earns their own `doc/npcs/` page through the normal NPC pass, not as a side-effect of the sheet. Mentor lines live in the JSON spec under a `mentors` map (`{"Navigation": "...the schools at..."}`) so that `sheet --inject` regenerates them on every run; do not hand-write them into the markdown — re-inject will clobber them.

**Stat sanity check — read the result back.** After applying the progression, read the resulting eight statistics with the file's voice in mind. Does the stat block *read like this character*? A trader with low Charisma is suspicious; a forge-master with low Hand is wrong; an old druid with high Speed is a young druid in the wrong file. Adjust the cadence — re-order entries, swap a power, exchange a specialization, raise a level — until the numbers and the prose agree. The sheet is wrong until they do.

**Workflow.**

```
node tools/character.js apply <spec.json>                      # add or update
node tools/character.js sheet <name> --inject doc/npcs/<file>.md
node tools/character.js validate <name>                        # rules check
```

The roster JSON is the source of truth; the markdown sheet is a rendered view. Re-run `--inject` after every spec change. Custom places (NPCs from settlements not yet in `DATA.places`) are accepted — `Logic.state.place` takes any string.

**Pacing.** Sheets are added per NPC in steps, like every other NPC pass. A character sheet without the surrounding story is empty; a story without a sheet cannot be played at the table. Convert files one at a time, validate the result both mechanically (via `validate`) and editorially (does the stat block match the prose?), then move on.

**Exemptions — when a sheet does not apply.** A handful of NPCs are not characters in the progression sense and must not be force-fitted onto a sheet:

- **Bound spirits in puppet bodies** — the Pot-Person and other iron puppets. The body is a vessel; the spirit inside it does not progress through backgrounds and specializations. Stat them as creatures (or leave them narrative-only) rather than as PCs.
- **Chaos spirits wearing a body** — Tod. The fox body is a worn skin; the inhabitant is not learning trades.
- **Groups acting as a single NPC** — the Skull Gatherers as an order. Stat individual members (Andras already has his own file); the group itself does not get a sheet.

Each exempt file should carry a short `## Character sheet` block stating *"No sheet — <reason>."* so a DM scanning for the section finds the answer rather than a missing heading.

**Historical figures still get a sheet.** Felicia, Narissa, Thorgal, Idra Vintala, the Lethran Pair, and Laurent were people once, even if they are spirits or undead now. Their sheet captures the path they walked **in life** — the progression that made them who they were when they died, transformed, or ascended. The bound-or-undead present is a status sitting on top of the lived sheet, not a replacement for it. Note their living-era place of origin (a custom string is fine if the place no longer exists or is pre-rift). Mentor lines for these figures are often guesses by historians — say so plainly.

## How to use these goals

When introducing a new NPC, write down at minimum:

**Content** — what they carry:

- The **perspective** they carry that the party does not share.
- One concrete point of **friction** they might have with the party.
- What they could **offer** in aid — information, skill, or item — and at what cost.
- What, if anything, they could **teach**.
- The **secret** they will not voluntarily discuss, and what tips might hint at it.

**Presentation** — how they reach the table:

- The **place where they live** — specific, named, with 2–3 standouts on entry.
- **2+ standout descriptions** of the NPC themselves — sensory, immediate.
- At least 2–3 **stories** they tell when relevant topics come up (more for substantial roles).
- **Mannerisms** for pressed, distraught, and happy.
- **Reaction triggers** — specific actions the party might take and what the NPC does in response (6–10 entries).
- **Cross-NPC quick takes** — one-line opinion per significant other NPC the party may ask about.

**Mechanics** — what they can do at the table:

- A **character sheet** built through the progression system, injected into the file via `tools/character.js sheet --inject`. The progression order is the NPC's life path; the resulting statistics must match the prose; each specialization must name its mentor in one italicised line.

An NPC file that cannot answer those questions is not yet finished.
