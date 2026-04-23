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
- **Place files** (`doc/places/*.md`) — secondary targets. Each must open with **the 2–3 things that stand out on entry** (see §"For places" above); the rest follows scene-first principles applicable to NPCs (visible patterns, present tense, history relocated). **Any location where three or more NPCs live requires its own place file** — see `doc/npcs/goals.md` §"A defined place where they live (or a circuit they move through)" for the rule.
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
- `doc/npcs/irna_bean.md` — **rewritten** (companion NPC across two phases: silent patient → travelling companion). The *defined-home* goal adapts here to "wherever the party is" once recovered. Six stories, mannerisms, ten reaction triggers, ten cross-NPC takes, the dog as a recurring physical motif.
- `doc/npcs/willow.md` — **rewritten** (gatekeeper, one scene location, with a mechanical hook — the draining curse). Five stories, mannerisms, eleven reaction triggers, eight cross-NPC takes (appropriately short), plus a dedicated §"The draining curse" block for the shrine-thief consequence. Signature phrases (*"Do not defile my life's work"*) treated as reusable speech-traits.
- `doc/npcs/hank.md` — **rewritten** (gentle farmer, orphanage hub, with three independent layers of concealment — gender presentation, hidden farming book, hidden druidic training). Six trigger-keyed stories, mannerisms, twelve reaction triggers covering each concealment layer and several relational triggers, ten cross-NPC takes. Points to `doc/places/hanks_farm.md` for the place scope rather than restating it.
- `doc/npcs/john_bean.md` — **rewritten** (blunt war-survivor farmer, accidental hero, the man behind the Scarlet Vale myth). Six trigger-keyed stories anchored on long pauses, mannerisms tied to the ironwood arm and the long pause as part of speech, thirteen reaction triggers, ten cross-NPC takes. Echoes Irna's hot-blooded-restrained pattern from his side.
- `doc/npcs/rhianna_linthrope.md` — **rewritten** (Mouse-clan priestess, political fixer, stern teacher, Scarlet Vale's thinning spirit-shield). Six trigger-keyed stories, mannerisms built around the hour-glass on her table as a generative motif, twelve reaction triggers keyed to informed vs. vague questioning, ten cross-NPC takes. Connective NPC for the Bean arc — her file now ties John, Irna, Ron, Felix, and Elliot together in scene-first form.
- `doc/npcs/storm_mage.md` — **rewritten** (broken-mind unreliable narrator, comic-tragic). The *stories the NPC tells* goal adapts here to **fragments he mutters** (trigger-keyed but not coherent) plus one scene where his voice returns (the clarity bout at the Lightning Tower). Six fragment-triggers and the clarity-bout scene substitute for conventional stories; six short cross-NPC fragments; ten reaction triggers; DM notes flag the ethical weight of bringing him to his tower.
- `doc/npcs/tod.md` — **rewritten** (alien intelligence in a dead boy's body — chaos spirit approximating humanity). Stories are **approximation-speech** (grammar mostly right, meaning slightly askew), with a secondary voice — **the larger spirit speaking through him** — reserved for genuine threat moments. Six things-he-says + the larger-voice; five cross-NPC takes (appropriately short); twelve reaction triggers built around the cost-of-extended-stay mechanic; an inverse teaching section covering what the party can teach *him*.
- `doc/npcs/laurent.md` — **rewritten** (demi-lich in the wreck of his own crashed flying city — dangerous undead conversationalist). The file adapts the three-state mannerism convention to **stimulus-reactions** rather than felt states, because the human part that would have reflected is gone: Laurent does not defend his choices, does not process his losses, and knows he was right. What the party reads as warmth or fury is pattern in the construct, not emotion working through him. **The body is gone too** — he is a floating skull above his preserved chair, with a shadow beneath that sometimes holds the shape of the seated man he was and rarely sharpens into a glimpse of his living face. The party sees expressions only in those rare alignments; the necklace, or extended Felicia-themed exchange, holds the shadow longer. Seven trigger-keyed stories (including the castle's demi-human-trafficking origin and his unfinished retrofit), each trimmed of justifying/reflective tails; reaction triggers covering the necklace path vs. no-necklace, looting vs. listening, shadow-touching, skull-touching, and shackle-break news; cross-NPC takes; the *last-flight* conversation as the load-bearing climax option; his passive spirit-shield role as a campaign-scale consideration. Worked example for undead-NPC interiority-stripping *and* for physical-form-as-illusion.
- `doc/npcs/wilder.md` — **rewritten** (beaver shaman, hill-post watcher, gatekeeper of the shamans' long plan). Six trigger-keyed stories, mannerisms anchored on his staff and the walk to the edge of the hill, twelve reaction triggers centred on *question-quality* as the long-plan gate (vague questions → vague answers; specific informed questions → real answers), ten cross-NPC takes reciprocating the recent chaos-spirit-thread rewrites (Tod, Storm Mage, Laurent). A **notebook** flagged as a generative prop across visits.
- `doc/npcs/king_hannes.md` — **rewritten** (king-by-accident of Allondo; captured in the Overseas War; quietly preparing for a second war he cannot afford to be seen preparing for). Scene locations: audience chamber (court register), palace garden at evening (candour with earned trust), chapel at dusk (private hour, rarely accessible). Seven trigger-keyed stories; mannerisms anchored on the **signet ring** (touch / turn / flat against the chair as decision) and the **eyes-to-doorway** capture-habit. Reaction triggers include the *correction-Elliot-must-write* lever for Ron's release, the mirror-location absolute refusal, and the warmth-unlocked-by-respect-for-Fienna. **Brumal as campaign-clock** — his visible preparations louder across sessions. Private ledger of debts framed as campaign-scale reveal currency.
- `doc/npcs/prince_corven.md` — **rewritten** (Crown Prince of Allondo, in love with Brumal's Princess Penelope, visibly coming apart to anyone who looks). Two-scenes-same-prince spine: court-register polished heir vs. private honest young man. Night rides formalised as a visible court pattern (*plain travel gear, fast horse, no story on return*). Seven trigger-keyed stories including the first-Penelope-meeting (trust-gated), the one-conversation-with-Elliot in the maze garden, and the what-I-cannot-say-at-court. Mannerism anchor: **hand on hilt trained-not-hungry**; smoother-not-rougher when pressed at court. Reaction triggers gate the Penelope reveal across the sequence *notice → speculate → follow → confront → confidence → reveal*, with the four campaign-arc options preserved (public reveal, Elliot-echo renunciation, collaborator arc, breakdown). Mira-the-attendant as quiet minor access point. DM note: *do not play him as a doomed figure* — he is a young man *deciding* under bad conditions.
- `doc/npcs/brother_darrel.md` — **rewritten** (beaver-folk former sergeant who walked away from the last war; expert staff-and-monk fighter who rationalises his staff as *not a weapon*). Home at Luchebert Monastery (front yard at dawn, side buildings with the sheltered in the afternoon, side paths with Elliot in the evening). Seven trigger-keyed stories including the granary-incident origin beat, the orphanage coin (Hank/Egbert), and the one active disagreement with Elliot (withdrawal vs. continuing action). Mannerisms anchored on *the staff coming into his hand without him looking*. Reaction triggers cover the no-coin / no-weapons vow, the orphanage-truth-is-his-to-disclose rule, and the Nadine-pirates disagreement. Cross-NPC takes including the Elliot moral-parallel at opposite ends of the chain of command.
- `doc/npcs/ron_bean.md` — **rewritten** (younger son of John Bean, reluctant Scarlet Vale recruit, mistakenly-enlisted subject of the *valiant spirit* proclamation that was really about Irna). Home at Scarlet Vale's training barracks; *real* home at Blackwood freehold. Six trigger-keyed stories, terse on purpose — **Irna is the door**, the only channel he has not closed. Mannerisms anchored on the *small tusks clicking once* when family is touched (a tell he does not know he has). Reaction triggers centred on the Irna-story gate, the correction-Elliot-must-write arc, and the farm-vs-yards register split. Defensive-soldier teaching available only post-discharge. DM note: *do not rescue him too easily* — the correction is Elliot's to make, and forcing the kingdom's hand costs Ron something. Cross-NPC takes including the unsettled Steven question and the two-register relationship with his father.
- `doc/npcs/nadine.md` — **rewritten** (itinerant Finch trader, face of a Raft-city merchant group; the campaign's DM-infrastructure world-news channel). Uses the Felix itinerant-home adaptation. Circuit covers Elmsfield (main Inn scene), Raft city (base), Linar (Linnet thread), Fata morgana (the song, not a visit). Six trigger-keyed stories including both songs (the *shimmering city* breadcrumb pointing at Fata morgana, the *lament for Linnet* gating the pirate-nest intelligence). Mannerisms anchored on beak-angle and fingers-tapping-Finch-mourning-rhythms. Reaction triggers cover the pattern-test for releasing the pirate-nest intelligence (the party's treatment of captives in other stories across visits). Cross-NPC takes include the Brother-Darrel disagreement and the Felix old-comrade-names overlap. Worked example of an NPC whose *DM-infrastructure function* is made legible in the file itself.
- `doc/npcs/felicia.md` — **rewritten** as a **great-spirit adaptation** — the most diffuse NPC adaptation yet, building on the Tod (approximation-speech), Pot-people (drawings), Storm Mage (fragments + clarity bout), and Laurent (no-interiority) precedents. Felicia has no body, no casual speech, and cannot be negotiated with; the file adapts accordingly. **"What the party meets" is replaced by channels** — shrine, Moth Hollow, necklace-near-Laurent, condensation ritual — each with its own presence-tells (water clarifying, candles steadying, moths gathering, condensed stiff body with voice-echo). **Stories she tells adapted to short urgent voice-lines when condensed** (about people, never abstract), with the drive — fear-for-her-people — as the spine. **Mannerisms adapted to environmental signs** at each channel. **Cross-NPC takes adapted to directions-her-drive-bends-toward** rather than opinions. Explicit DM note: play her as *direction, not character*. Load-bearing connection made explicit: she is the primary reason the hill country is safe (spirit-shield ecology).
- `doc/npcs/hermit_shaman.md` — **rewritten** (Gerhald, otter shaman at the hill tower — consent-gate on the last shackle of the Lake-of-Tears ring). Six trigger-keyed stories, mannerisms anchored on the stone-on-a-string that turns steady/slow/stopped as state-indicator, thirteen reaction triggers built around the *three-specifics* requirement for his consent (destination, rain-buffer, who-else-is-on-board), ten cross-NPC takes including the pair-with-Wilder acknowledgement. File flags the consent-gate as the load-bearing last-flight mechanic and the blood-tower working as a permanent question without a clean solution.
- All other NPC files — historical-format, queued for rewrite as the campaign needs them.
- `doc/places/luchebert_monastery.md` — **first place-rewrite worked example**. Three entry standouts (the maze garden, the shuttered side buildings, the cliff edge), six scene locations within (maze, central building, cave chapel, side buildings, cliff path), visible patterns, what-you-learn-here-and-when table, reaction triggers, DM notes. Built around the canon clarification that **Felicia's shrine is a cave chapel below the gate**, not a back-cloister room.
- `doc/places/felicia_shrine.md` — dedicated place file for the cave chapel, smaller-scope worked example. Three entry standouts, scene-location subsections (entrance/work-table, shrine, spring), patterns, what-you-learn table, reaction triggers gated through Willow.
- `doc/places/elmsfield.md` — the campaign hub. Three entry standouts (the great ironwood at the centre, the wilderness at the edges, the war-era gate), scene-location subsections with cross-references to the NPC files, residents index.
- `doc/places/hanks_farm.md` — the orphanage-farm. Three entry standouts (the scale, the children and their shared clothing, the crop rotation), scene locations for farmhouse, dormitories, workshop, fields.
- `doc/places/scarlet_vale.md` — Allondo's capital. Three entry standouts (the training yards in rotation, the quartermasters' quiet buying, the court's discomfort with its own royal family), scene locations for palace, Rhianna's residence, training yards, trade districts, gate.
- **NPC-tied dungeons — a new pattern of small bounded sites** each triggered by an NPC's goal and closing by returning to that NPC. Four initial files:
  - `doc/places/ironwood_mill.md` — tied to John Bean (via Irna as the usual pointer). The sealed mill where John lost his arm, still holding the cutting machine with its bound iron elemental; operator's pre-Rift notes as mage-student reward; John's arm-remnant as emotional fulcrum. 1-session. Compassion-first compatible (the cutter-reflex is the one trap, resolvable by *address*).
  - `doc/places/clear_water_mine.md` — tied to Rhianna Linthrope. The mine that held Irna; the convict-labour camp. Twin deliverables: **the document** (clean grounds for Elliot to correct the Bean proclamation) and **Osric Vey** (a scholar Rhianna could not take when she took Irna). Cover-and-vault social dungeon; grim-not-gothic register; routines-of-force not sadism. Returns to tea at Rhianna's hour-glass.
  - `doc/places/mirror_camp.md` — multi-tied (Thorgal residue / Raul's contract / Felix's pointer / Rhianna drawn out / Hannes's absolute refusal / mage-aspirant's pull). The Overseas War's pivot site in the hills, with the haunted mirror still upright behind its crack. **Thorgal's bond as campaign-scale character change** for a serious mage-aspirant. Four NPC doors in; several distinct destinations for the mirror (Raul / Rhianna / Luchebert / Haven / destroy) each with real campaign cost.
  - `doc/places/scattered_kin.md` — tied to Haven. **Not a single site — a pattern.** Seven ruins across the blasted lands where iron-puppet parts are surfacing and migrating; the party retrieves over many sessions; the climax is a **gathering site near the white city** where the puppet is being reassembled (three canonical DM options for by-whom). Campaign-scale quiet-good arc. Paced across sessions, emotionally restrained, with the return-to-Haven set-piece as the emotional payoff. **Trust-gated** — Haven asks only after earned standing.
- `doc/places/blasted_lands.md` — **new file** (not a rewrite). Companion to the southern desert — the continent's pre-rift agricultural heart, now chaos-ruined. Three entry standouts (cultivation still readable under ruin; communal halls not individual houses; something still performing its old role — bell ringing, figure walking the harvest-line, smoke from a cold chimney). Scene locations include the trade-road skirt, the crossing (workings that *complete but return warped*, distinct from the desert's stuttering), **three worked combat/treasure locations**: Silvertrace (warped stream-spirit + swallowing ground + wooden man's arm + moved-body mystery + optional un-warping across a campaign); Great Thresh (iron elemental walking its circuit + grain-stores below + community-memory roster via shamanic engagement + relational-befriending path parallel to the volcano tower); Commons House (cerberus still on duty at a hall that has been *emptied by someone* + missing wall-panels as campaign-scale mystery + hippogriff / jackalopes / dreams as flavour). Wandering creatures: hippogriff (help-in-shape-without-substance), jackalopes (warped livestock), grain-voices on the wind. White city and portal as off-file centre. Governing register: **reciprocity betrayed** — every creature is still performing a role whose reason has been gone for a thousand years.
- `doc/places/southern_desert.md` — **new file** (not a rewrite). Regional place file covering the chaos-pressed desert south of the blasted lands. Three entry standouts (sand-at-every-lintel revealing recent-not-ancient loss; fata-morganas that compound fatigue; chaos-pressure thickening with distance from Lastwater). Scene locations include the Lastwater edge, the crossing itself (travel under chaos-pressure), **two worked combat/treasure locations** (the Half-Tower fallen-castle with chimera lineage + air elementals + lord's journal and preserved family quarters; Three Walls sanded settler village with serpent matriarch + clutches + pair of witnessing sphinxes + well-cache), and mage-dwellings as DM-fill. Creatures framed as **tenants of former homes, not monsters**. Named heirloom returns to Fata morgana / Gap city descendants as an explicit arc hook. Tower and village each offer respectful-pass, negotiate, or combat paths — each with different emotional weight. Worked example of combat-with-emotional-investment location design.
- `doc/places/fata_morgana.md` — oasis city deep in the chaos-spirit desert; survives by generational **deployment of mighty-spirit-readers** (priests at wells, shamans at gates, druids in gardens, mages at walls). Three entry standouts (the shimmer visible hours before the city resolves, readers posted at every civic point, the jewelry shop-fronts whose ward-work repeats in door-frames and well-copings). Scene locations: desert approach (mirages of the city itself), gates (shaman reads the party), jewelry market (outer craft and inner ward-work), wells (priests' continuous tending), gardens/walls (druids and spirit-sighting mages), inner circles (rotating multi-visit knowledge-negotiation), the edge (where protection ends — refugees refused at the walls as quiet tragedy). Framings: *porous and limited in equal measure*; Penelope's apprenticeship as softest foreign channel; craft-and-wards-as-one-practice; chaos-reducing work as the highest honour (kin-practice to teaching Tod). No named NPCs — DM-fill.
- `doc/places/moth_hollow.md` — burial ground for Laurent's crash dead; **one of Felicia's own places**. Three entry standouts (the hand-sized white moths that cling within minutes, the stillness with no birds/wind, half-hidden markers in the grass). Scene locations: entrance (air changes, chaos-residue bleeds off), graves (names readable with care, ancestor-findings for rooted PCs), centre (where Felicia stays — condensation ritual is easier here), edges (birch stands, boundary where moths release). **The one place in the campaign where players can make Felicia actively angry**: angering consequences formalised as her channels turning (wells turn, necklace fails to condense near Laurent, Willow senses it) — reversible but multi-session restitution. Designed as revelation layer, not combat. Emotional counterpoint to Laurent's downfall narration.
- `doc/places/volcano_tower.md` — shackle-lever tower, two paths (relational vs. violent). Three entry standouts (cone shape + heat visible half a valley away, flames in the open top that *turn* toward the party, no door and no way in but the rim). Scene locations: base (cold foundation with old offering-stones from prior attempts), rim (where fire is thrown), interior (scorched smooth; elemental communicates in heat-patterns). **Two levers formalised**: relational (feed the being, earn its name, it lifts the tower and becomes a companion) vs. violent (provoke until containment ruptures; enraged elemental leaves east; tower ruined; shield-contribution gone). Gerhald weighs this on the last shackle. Companion-elemental arc post-relational.
- `doc/places/sinking_tower.md` — shackle-lever tower, cling-to-descend entry. Three entry standouts (stone tower floating impossibly mid-lake, nightly sink with visible glow — Gerhald's *reaches its counterpart* hint — and sink-response to any touch from above). Scene locations: shoreline (observation), upper half antechamber (the descent scene, ~30 seconds with water rising outside windows), lower half living quarters (preserved air-sealed home, owner-spirit forms as translucent figure). **Owner-spirit fetch-quest as lever**: bring him what he wants, he floats the tower down-river to the sea (unique water-exit direction). Name-as-trust-gate. First-hand ring-construction testimony available.
- `doc/places/darkness_tower.md` — shackle-lever tower, two-step puzzle. Three entry standouts (unremarkable exterior + pitch-black doorway where light does not cross, life-drain inside, tactile-patterned walls unreadable in the dark). Scene locations: threshold, ground floor (blind navigation, multiple stairs, mosaic felt under the hand), upper floor (asymmetric to ground — design clue), the basket (suppresses both light elemental and life; heavy but liftable). **Two-step lever formalised**: Step 1 — lift the basket (elemental emerges, light returns, life-drain ends, tower becomes visible as old mage-work). Step 2 — read the restored mosaic (tells the tower how to walk out of the ring). Puzzle-not-combat; freed light elemental as minor ally; mosaic-mechanic DM-fill.
- `doc/places/linar_harbour.md` — independent east-coast harbour at the hinge where the coastal mountain meets the sea. Three entry standouts (mountain-meets-sea geography; overseas rigging and accents at the dock; *what nobody says* — the war-era descent pattern learnable by observation and never named for strangers). Scene locations: the pass descent, the docks, the fisher-quarters (overseas-descended community — songs, letters from far away, net-patterns), chandleries/warehouses (where Bridget's old road ends), the taverns (mixed rooms, pirate-nest ambient stories, Nadine's lament-for-Linnet landing point, Corven/Penelope back-room option), the southern coast road (pirate pointer). **"Silence as texture" DM framing**: the town's stability is what isn't said; hard-line "overseas are enemies" stances break the room. Pirate-nest intelligence is Nadine-gated; deep-sea overseas passage is multi-session-earned; no named NPCs assigned (DM-fill at the table). Worked example for a *neutral-hub* place whose role is gating and channelling rather than hosting set-pieces of its own.
- `doc/places/salmonswell.md` — independent salmon-and-salt city well upriver, the jumping-off for Diederik's errand to Rowan. Three entry standouts (the Upwelling's visible swell, the smell of Smokehouse Row carrying half a valley, the mixed crowd at the dock — old salmon families + Brumal refugees + harbourmaster's clerks). Scene locations: approach over the valley rim, the wharf (clerks' tables, arrival-gift labour-trade custom), Smokehouse Row, the Upwelling (fishing-rights politics, weighted-meeting venue), the Harbourmaster's Office (rotating merchant-house council), the north gate (where the rapids begin — day's walk to the third fall, then Rowan past it), the refugee quarters (Hank's-farm scale parallel for the Brumal-collapse thread). Neutral-inland-venue framing for inter-kingdom scenes. File leans into its role as *point-onward* for the Rowan errand rather than destination in its own right.
- `doc/places/haven.md` — the iron-puppets' hidden settlement beside the shifting lands. Three entry standouts (low buildings emerging from the landscape with no road to them, figures that pass for statues until they move, the western edge where the ground stops holding). Scene locations: approach (landmarks that persist because they are not built), outer buildings (greeter's filter, glacial-pace conversation), workshop yards (centuries-slow maintenance), council stones (where multi-visit decisions happen), western edge (shifting-lands boundary and where guides train). **Trust gated multi-visit**: greeter → workshop → stones → spirit-binding lore. Existential-secrecy framing (buyers of spirit-bound artefacts are the clock). Reaction triggers cover the Haven–Laurent arc (their view on remote-puppeted never-bound bodies), the pot-boy set-piece scene (if the party brings him), labour-trade currency, and the betrayal-of-location consequence (Haven moves; never found again). No named NPCs — file treats the settlement collectively, with DM note for letting names emerge at the table.
- `doc/places/forbidden_woods.md` — the chaos-spirit forest pairing with Tod's NPC file. Three entry standouts (warped tree line, the wrong-silence, light bending). Scene locations follow visit-depth: the tree line fringe (Tod's clearing, safe), deeper in (cost begins to compound — workings stutter, minds fray, maps fail, time passes wrong), the Lightning Tower wreck at the fringes (post Storm Mage episode), the river route through to Raft city (warps less along running water), and the heart (rarely reached, climactic, where the larger spirit's mass is densest). Reader-ring framed as the load-bearing structural containment — druids, Luchebert, Felicia, possibly the ironwood tree — with explicit DM-note that thinning it spreads the pressure. Three layers of visit (fringe / shallow / deep) as the pacing spine.
- `doc/places/laurents_city.md` — the wreck of Laurent's flying city. Three entry standouts (the slight tilt, the hole in the side, the green taking the lower decks). Scene locations follow a forced ascent: the approach, the hole, the lower decks (green-covered cages; the refugee-shelter layer readable only with real skill — cot-frames and food-storage traces), the middle decks (Laurent's unfinished retrofit), the upper deck (alcoves and the first puppet-waking), the kept corridors, Felicia's preserved room, the audience hall, and the broken edges. **The file explicitly accepts the first-reading misread** (unskilled parties see *slaver's lair*) as a legitimate state correctable by skill, Felicia's room, Laurent's narration, or a return visit. Two boundaries of Laurent's reach formalised: the plant-line (passive) and the dust-line (kept). Verticality formalised as the load-bearing combat mechanic.
- All other place files — historical-format, queued.
- CAMPAIGN.md DM-notes sections — partially scene-first, can move further.

The rewrite is **demand-driven**. Do not rewrite a file just to rewrite it. Rewrite when:

- the party is about to encounter this NPC or place at the table,
- the file is being edited substantially anyway,
- a player question revealed the file does not support the DM running the scene.

## Relation to other guidance

- `doc/npcs/goals.md` — the **requirements** every NPC file must satisfy: the five content goals (perspective, friction, aid, teaching, secret) and the playable-at-the-table goals (defined home, 2+ NPC standouts, stories, mannerisms, speech traits). This document is its companion: goals.md says *what* every NPC owes; SCENE_FIRST.md says *how* to deliver each goal in scene-first form. Read together.
- `doc/claude/DM.md` — the DM's running guide. Scene-first writing exists to make DM.md easier to apply.
