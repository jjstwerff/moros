# Scene-first writing — campaign documentation goal

## The shift

Campaign documentation in Moros has historically been written as **historical record** — who an NPC is, what they did, what they believe. This is useful for the author and the loremaster, but it is the *wrong frame* for content that lives at a play-table.

Players do not encounter history. They encounter **scenes**. They see an old owl with his hands on a tree. They hear a song late at the inn. They climb a treehouse. They sit at a hilltop. The DM, running the table, needs the document to **hand them the scene** — not require them to translate biography into action in real time.

This document records the goal. **All campaign documentation should move from historical record toward scene-first framing.** New content should be written this way from the start; existing content should be rewritten as the campaign touches it.

## The worked example

`doc/npcs/elder_diederik.md` is the reference rewrite. Read it before doing the next one. Compare its current shape to a still-historical NPC file (e.g. `doc/npcs/john_bean.md`) for the difference at a glance.

## What scene-first looks like

This section describes the **techniques** of scene-first writing — *how* to write content this way. The **requirements** for what an NPC file must specifically contain (a defined home with 2–3 entry standouts; 2+ standouts of the NPC themselves; trigger-keyed stories; mannerisms for pressed / distraught / happy; speech traits) live in `doc/npcs/goals.md` §"Playable at the table". Read the two together: goals.md says what each NPC owes; this doc says how to deliver it.

### Organise by where the party meets the NPC or place

Replace chronological/topical sections (*"Background," "His proposal," "Why Elmsfield"*) with **scene locations**:

- *At his treehouse*
- *At the great ironwood*
- *At Alita's grave*
- *The errand to Rowan*

Each section answers: **what does the party see, hear, and do here?**

### Lead with what is visible

The first sections of an NPC file should be:

1. **What the party meets** — the entry-scene where they first encounter the NPC.
2. **How they read at a glance** — sensory: appearance, voice, manner, body.
3. **Visible patterns** — what the party will notice on repeated visits (rhythms, habits, recurring activities).

Backstory comes later, marked as DM reference.

### For places: the 2–3 things that stand out on entry

A place file should open with the **2–3 specific things the party notices the moment they enter** — sensory, immediate, distinctive. Not what the place *is* (that's history); what the *eye, ear, or nose catches first*. These are the anchors a DM uses to set the scene without having to invent atmosphere on the fly.

The standouts should be:

- **Specific.** Not *"the room is grand"* but *"the ceiling is one continuous piece of grown ironwood, and the rings show where the wartime hoard was hidden inside it."*
- **Sensory.** What is seen, heard, smelled, felt underfoot. Not what is *known about* the place.
- **Distinctive.** What makes *this* place different from any similar one. Answer the question *why is this not just any inn / monastery / tower / city?*

Examples drawn from the setting:

- **Bridget's Inn** — rooms inside a living ironwood tree (impossible interior); old wood layered with hearth-smoke; the unspoken weight of a hoard hidden in the wall.
- **The buried tower** — fungal growth crawling up the exterior walls toward the lake; the chimney's irregular exhaust blasts cutting through the air on a near-pattern; a small pot sitting too still on a workbench with a chisel set down beside it.
- **Salmonswell at the wharf** — the visible swell of the freshwater spring in the river itself; the smell from smokehouse row carrying half a valley away; the mixed crowd (old salmon families, Brumal refugees, the harbourmaster's clerks all at the same dock).

Two is the minimum; three is the comfortable target. More than four dilutes — they stop being standouts and become a list. Pick the few that *most* distinguish the place and lead with them.

After this opening, the rest of the place file follows the same scene-first principles as NPC files: organise by what visitors do here, lead with what's visible, present tense, document the patterns and rituals of the place, save the chronological history for the DM Background section.

### Use present tense

History is past tense. Scenes are present tense. *"He turns when he hears them, hands still on the trunk, and listens"* belongs in a scene-first file. *"He turned when he heard them"* does not.

### Give the NPC a voice

Embed **short sample lines** in scene sections where the NPC's voice helps the DM run the moment — one or two, in italics and quotes, e.g. *"Listening."* These complement the longer trigger-keyed stories (see below); both serve the DM's need to deliver the NPC in voice rather than summary.

### Use a topic table for *"what they will tell — and when"*

Players ask questions. The DM needs to answer on the fly: *will this NPC talk about X?* A topic table gives the answer at a glance:

| Topic | When they will speak about it |
|---|---|
| ... | Immediately. |
| ... | Freely, once asked. |
| ... | Only with trust earned. |
| ... | Only when invited closer. |

This converts unstructured trust mechanics (which a DM cannot run cold) into trust-gated topic openings (which they can).

### Add a *"What they will not say"* section

Secrets only stay secrets if the DM remembers what they are under pressure. A short bullet list of explicit reticences — and *why* — keeps the canon enforceable at the table.

### Convert history into short stories the NPC tells

The strongest version of *give the NPC a voice* is to take the file's **historical content** — backstory, past events, the order's politics, the trip — and convert each beat into a short story the NPC tells when the topic comes up. Not exposition the DM summarises, but a few-sentence piece the DM can deliver close to verbatim.

The technique:

- **A trigger** — what topic in conversation cues the story.
- **The story itself** — 3–7 sentences, in the NPC's voice, italicised in quotes so the DM can read it directly.

When historical content appears as told-story rather than Background bullet, three things happen:

1. **The DM delivers it as performance**, not paraphrase.
2. **The history stops needing a Background section.** The stories *are* the history, played not summarised. What's left is a handful of connecting bullets and lore cross-references.
3. **The NPC's voice accumulates** across multiple samples — which is what makes deliberate **speech-trait design** possible (a separate exploration; see goals.md).

(Goals.md owns the *requirement* — how many stories an NPC must have; this doc owns the *technique*.)

Worked example: §"Stories he tells" in `doc/npcs/elder_diederik.md`.

### Reaction triggers — "if X, then Y"

The technique: structure the section as an **action-keyed table** of two columns — *if the party does X, the NPC reacts Y.* Each reaction should be physical and consequential — what the NPC actually *does*, observable to the party (and to the wider region where relevant). Avoid adjectives; favour outcomes. *"He stops speaking to them; the town notices within a week; standing in Elmsfield begins to slip"* beats *"he is angry."*

(Goals.md owns the *requirement* — the action coverage; this doc owns the *technique*.)

### Cross-NPC quick takes

The technique: a single-line **opinion** per significant other NPC. Italicised quotes the DM can deliver verbatim work best. Keep each line short; longer than two sentences and it becomes a relationship-block entry instead of a take. **Cap the list at about 10 entries** — longer overwhelms a DM scanning under table pressure. Pick the figures this character has the most generative opinions about and that the party is most likely to ask after.

(Goals.md owns the *requirement*; this doc owns the *technique*.)

### Document mannerisms for emotional states

Beyond what an NPC says, what they *do* with their body in different emotional states gives the DM another layer of in-character performance ready to deliver.

The technique: mannerisms must be **specific and physical**, not adjectival. Not *"becomes withdrawn"* but *"turns away to look at the tree, hands flat against the bark, will not face the speaker until the topic changes."* Not *"smiles"* but *"a single dry laugh, two short notes, then back to the staff."* Written this way, the DM can deliver the moment without inventing it. The NPC's body becomes part of the conversation.

(Goals.md owns the *requirement* — which emotional states every NPC must cover; this doc owns the *technique*.)

### Move what doesn't fit into a *"Background — for the DM"* section near the end

After story-conversion, what's left is a small residual: connective tissue, lore cross-references, the structural notes a DM needs but the NPC would never say. That residual goes in a clearly-marked DM-reference section near the bottom of the file, condensed into bullets:

> *Reference, not script. None of this is for the players to be told directly; it surfaces only through the scenes above.*

The Background section is now the *fallback* — anything that *should* have become a story but couldn't. If the section is large, more conversion work remains.

### Keep mechanics, relationships, and sources at the bottom

Spirit-shield roles, relationship lines, source citations — these stay where they are. They are reference material the DM consults when the scene calls for them.

## What this applies to

The goal applies to **all campaign documentation that gets used at the table**:

- **NPC files** (`doc/npcs/*.md`) — primary targets. Most are historical-format today.
- **Place files** (`doc/places/*.md`) — secondary targets. Each must open with **the 2–3 things that stand out on entry** (see §"For places" above); the rest follows scene-first principles applicable to NPCs (visible patterns, present tense, history relocated).
- **Campaign book sections** (`doc/claude/CAMPAIGN.md`) — already partially scene-first in its session breakdowns; the threads and DM-notes sections can move further in this direction.
- **Scenario content** (`doc/claude/SCENARIOS.md`) — the *content* of scenarios benefits from the same framing where it describes situations.

The goal does **not** apply to:

- Lore documents (`doc/claude/LORE.md`) — deliberately encyclopedic; the players never read them and the framing does not affect play.
- Rules/system documents (`doc/claude/RULES.md`, `doc/claude/POWERS.md`, etc.) — reference material, not scene material.
- Tooling documents (generator, scene editor, statistics) — engineering docs, not table docs.

## How to do a rewrite

When rewriting an existing file:

1. **Read the file end-to-end.** Note every distinct *fact* the file conveys (not every paragraph).
2. **List the scene locations** where the party plausibly meets this NPC or visits this place. (For Diederik: gate-of-Elmsfield, treehouse, great tree, Alita's grave, the errand-asking moment.)
3. **Reorganise content under scene locations.** Each fact lands under the scene where the party would learn it.
4. **Convert past tense to present** where the content is now sitting under a scene heading.
5. **Identify the historical beats** that don't naturally belong to a single scene — backstory, past events, the order's politics, the trip. **Convert each beat into a short trigger-keyed story the NPC tells**, in their voice, in §"Stories he tells". This is the move that does the most work in a rewrite.
6. **Add the standard scene-first sections** if missing — for an NPC: *What the party meets / How they read at a glance / Visible patterns / What they will tell — and when / What they will not say.* For a place: open with *the 2–3 things that stand out on entry*, then *visible patterns* and *what visitors do here*.
7. **Add 1–2 sample voice lines** in scene sections where the NPC's voice helps the DM run the moment, on top of the longer stories.
8. **Document mannerisms** for the emotional states the campaign puts this NPC in — at minimum *pressed, distraught, happy* — as specific, physical, deliverable detail (not adjectives).
9. **Move what's left** — the connecting bullets and lore cross-references that don't surface in stories — into a small *Background — for the DM* section near the end. If that section is large, more conversion work remains.
10. **Mirror any relationship changes** in linked NPC files.

## Tests for whether a rewrite has worked

1. **Cold-read test.** A DM who has never run this NPC reads the file for two minutes. Can they then run a scene with the NPC competently? In the historical format, usually no. In the scene-first format, usually yes.
2. **Five-question test.** Pick five plausible player questions for this NPC. Can the file answer all five from a single section (the topic table, the relevant scene location, or §"Stories he tells")? If the DM has to skim three sections and synthesise on the fly, the file is not yet scene-first enough.
3. **Voice test.** Can the DM, after reading the file, *imitate* the NPC across at least 4–6 distinct topics — not just one line, but a recognisable voice that holds across multiple stories? If not, the file needs more trigger-keyed stories in §"Stories he tells".
4. **Background-shrinkage test.** After story-conversion, the *Background — for the DM* section should be small — a handful of bullets, mostly cross-references and connecting tissue. If it is still substantial, more historical content can probably become stories.

## Status of the rewrite

- `doc/npcs/elder_diederik.md` — **rewritten** (the original worked example, solitary elder). Six stories, mannerisms, reaction triggers, cross-NPC takes. Speech-traits track still pending.
- `doc/npcs/bridget.md` — **rewritten** (social hub, settled). Six stories, mannerisms, ten reaction triggers, ten cross-NPC takes.
- `doc/npcs/felix.md` — **rewritten** (itinerant NPC — drove the *home → circuit* extension to goals.md). Six stories, mannerisms with a generative physical motif (rings on his tail), ten reaction triggers, ten cross-NPC takes.
- `doc/npcs/father_elliot.md` — **rewritten** (withdrawn monk, royal-blood, single location). Six stories, mannerisms anchored on the navigator's compass, ten reaction triggers, ten cross-NPC takes.
- `doc/npcs/pot_person.md` — **rewritten** (non-verbal pair — drove the *drawings replace verbal stories* extension to goals.md, and confirmed the *cross-NPC takes is a cap, not a floor* clarification). Six described drawings instead of spoken stories, mannerisms for both pot-people, eleven reaction triggers, six short cross-NPC entries.
- All other NPC files — historical-format, queued for rewrite as the campaign needs them.
- All place files — historical-format, queued. Each will need the *2–3 standout entry details* added at the top, then the same scene-first treatment as NPCs.
- CAMPAIGN.md DM-notes sections — partially scene-first, can move further.

The rewrite is **demand-driven**. Do not rewrite a file just to rewrite it. Rewrite when:

- the party is about to encounter this NPC or place at the table,
- the file is being edited substantially anyway,
- a player question revealed the file does not support the DM running the scene.

## Relation to other guidance

- `doc/npcs/goals.md` — the **requirements** every NPC file must satisfy: the five content goals (perspective, friction, aid, teaching, secret) and the playable-at-the-table goals (defined home, 2+ NPC standouts, stories, mannerisms, speech traits). This document is its companion: goals.md says *what* every NPC owes; SCENE_FIRST.md says *how* to deliver each goal in scene-first form. Read together.
- `doc/claude/DM.md` — the DM's running guide. Scene-first writing exists to make DM.md easier to apply.
