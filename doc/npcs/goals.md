# What NPCs Are For

Design goals for every named NPC in the setting. A well-rounded NPC fills **as many of these goals as possible** — aim for all of them when writing a new character, and only accept fewer when the role genuinely cannot support more. The more of these an NPC carries, the more sessions they can usefully appear in, and the less likely they are to feel like a one-use prop.

A character does not need to deliver all of these at once in play, but every NPC should be capable of at least two or three of them on the page, and every NPC should carry the last one.

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

An NPC file that cannot answer those questions is not yet finished.
