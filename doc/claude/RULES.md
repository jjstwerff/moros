<!--
STYLE GUIDE — read before editing this file
═══════════════════════════════════════════

Structure
  ## for major sections, ### for entries within a section. Never go deeper than ###.
  Separate ## sections with a --- rule. Do NOT place --- between ### entries
  (exception: the Statistics section uses --- between stat blocks because each is long).

References
  Powers and specializations: *italics* when mentioned inline — e.g. use *Scolding* to taunt
  Stat actions: **bold** — e.g. **rallying cry**
  Stat abbreviations: always the defined short forms —
    Char, Dex, Endu, Hand, Might, Perc, Speed, Will

Formatting rules
  Scenario names: always lowercase (combat, stealth, negotiation, …)
  Action requirements: *(Stat ≥ N)* or *(Condition)*
  Action entries: **name** *(condition)* — description
  Power headers: ### Name *(Stat + Stat — special)*
  Scenario table cells: one use per row, one line, no trailing punctuation
  Stat defocus/refocus notes: append *(defocus)* or *(refocus)* in italics

Tone
  Direct, present tense. Second person ("you") for player-facing rules.
  No trailing whitespace. No blank lines inside table rows.
  Maximum line length: 100 characters. Wrap prose at word boundaries before reaching the limit.
  Table rows are exempt — markdown cells cannot be wrapped.
-->

# Moros — Rules Reference

*An adventure game of cards, tension, and growing mastery.*

A small group of players builds heroes from eight core statistics, shaping each through racial
powers, backgrounds, and skills taught by Masters. Together they face scenarios resolved not by
dice but by a shared deck of cards drawn fresh each round.

---

## Contents

1. [Goals](#goals)
2. [Gameplay](#gameplay)
3. [Scenarios](#scenarios)
4. [Statistics](STATISTICS.md) ↗
5. [Powers in Scenarios](POWERS.md) ↗
6. [Core Mechanics](#core-mechanics)
7. [Challenge Difficulty](#challenge-difficulty)
8. [Damage and Mitigation](#damage-and-mitigation)
9. [Fear and Flight](#fear-and-flight)
10. [Character Creation](#character-creation)
11. [Progression](#progression)
12. [Races and Powers](#races-and-powers)
13. [Backgrounds](#backgrounds)
14. [Contacts](#contacts)
15. [Inventory and Carrying](#inventory-and-carrying)
16. [Crafting](#crafting)
17. [Weather](#weather)
18. [World: Places of Origin](#world-places-of-origin)

---

## Goals

**Have fun together with a group (4–7) of friends, reenact an adventure.**

**Allow everyone to have a part to play in every scenario.**

**Give players the room to improvise and interpret the card specials and their powers in an
interesting way.**

---

## Gameplay

**Face scenarios together.** Each scenario presents scenes with challenges to overcome. Players
commit cards, aid allies, and use their characters' mastery to push through encounters, social
confrontations, and dangerous situations.

**Manage Tension.** Every act of aid raises Tension. When Tension breaks past five the scene
becomes hostile, weaving complications into every hand dealt. Players must weigh the benefit of
helping each other against the rising pressure it places on the group.

**Grow between scenarios.** Characters spend earned experience on new specializations, deepen
mastery of powers, and forge contacts who can teach them further.

**Build toward mastery.** There is no single win condition — the game is an ongoing campaign.
Breadth of mastery is rewarded; no two backgrounds or specializations may be chosen in succession,
ensuring heroes grow in multiple directions rather than becoming narrow specialists.

---

## Scenarios

→ See [SCENARIOS.md](SCENARIOS.md) for all 8 scenarios with tension rules and challenges.

---

## Statistics

→ See [STATISTICS.md](STATISTICS.md) for all 8 statistics with scenario uses, actions,
and specializations.

---

## Powers in Scenarios

→ See [POWERS.md](POWERS.md) for all 37 powers with scenario applications.

---

## Core Mechanics

### The Card Deck

Twelve default cards form the permanent foundation of every deck. The first eight correspond to
the eight elements; the remaining four represent forces that cut across all scenarios:

| Card | Statistics | Special |
|---|---|---|
| Flame | Might + Dex | fire |
| Water | Dex + Speed | water |
| Wind | Char + Speed | air |
| Plants | Hand + Char | wood |
| Iron | Might + Will | iron |
| Earth | Endu + Hand | stone |
| Light | Perc + Will | light |
| Dark | Perc + Endu | dark |
| Blood | Might + Will | life |
| Storm | Speed + Endu | surge |
| Shadow | Dex + Char | veil |
| Ruin | Perc + Hand | decay |

The four new specials follow the same challenge-texture rule as the original eight: **life** =
desperation and last-resort intensity; **surge** = sudden overwhelming force that does not last;
**veil** = ambiguity, mistaken identity, misdirection; **decay** = erosion over time, things
quietly falling apart.

### Character Cards

Each character contributes cards to the shared deck from their personal card pool. A character
gains one card per power, background, or item that states it generates a card. At the start of
each scenario — when stakes are revealed — each character selects a number of their cards to
place in the shared deck based on how far they have progressed:

| Progressions taken | Cards contributed |
|---|---|
| 1–3 | 2 |
| 4–6 | 3 |
| 7–9 | 4 |
| 10–12 | 5 |
| 13+ | 6 |

Cards not selected stay on the character's sheet and are not drawn this scenario, but the stat
boosts from learning those powers still apply. The selection is the **stakes decision** — which
aspects of the character are most relevant to the challenge ahead.

### Scenario Cards

Three scenario cards are shuffled into the deck at the start of each scenario. They are removed
when the scenario ends and do not enter the discard pile. They bias the deck toward the
statistics that matter most in the current context.

| Scenario | Card 1 | Card 2 | Card 3 |
|---|---|---|---|
| Combat | Might + Speed — *surge* | Might + Endu — *iron* | Dex + Will — *veil* |
| Stealth | Dex + Speed — *veil* | Perc + Will — *dark* | Char + Dex — *air* |
| Negotiation | Char + Will — *life* | Perc + Char — *light* | Will + Hand — *veil* |
| Exploration | Perc + Hand — *stone* | Endu + Will — *decay* | Dex + Perc — *dark* |
| Travel | Speed + Endu — *surge* | Perc + Speed — *air* | Char + Endu — *life* |
| Camp | Endu + Will — *stone* | Char + Endu — *life* | Will + Perc — *dark* |
| Market | Char + Hand — *wood* | Perc + Char — *veil* | Will + Char — *light* |
| Forage | Perc + Endu — *wood* | Hand + Will — *decay* | Dex + Perc — *dark* |

### Discovery Cards

A character who uncovers a significant secret earns a **discovery card** — a unique card that
permanently joins their personal card pool. Discovery cards are awarded by the DM and cannot be
replicated or transferred. Each has custom statistics and a special reflecting the nature of
what was found.

| Example card | Statistics | Special | What it represents |
|---|---|---|---|
| The Scar | Might + Will | wound | Surviving something that leaves a permanent mark |
| The Name | Char + Perc | truth | Learning who someone truly is |
| The Pact | Will + Hand | binding | Witnessing or entering a secret agreement |
| The Depth | Endu + Perc | void | Enduring something that should have destroyed the character |

Discovery card specials use the same challenge-texture rule. **wound** = a challenge pressing
against something already damaged; **truth** = exposure of what was hidden; **binding** = a
challenge where commitments constrain options; **void** = a challenge at the limit of what can
be endured.

A character may contribute at most one discovery card to the shared deck per scenario, selected
as part of their stakes decision. Discovery cards count toward the character's contribution
limit.

### Weather and Environment

→ See [Weather](#weather) for the full daily weather system. Weather is drawn once per day and
applies to all scenarios that day.

### Playing Cards

Each round a player draws 2 cards and commits 1 as their action. If the card shows a statistic
the character possesses, that stat's value is added to the total. Multiple matching statistics
each contribute.

### Resolution

When a player acts against a creature or challenge, the DM draws a card to represent it. The
card's **special** defines the texture of the opposition — how the creature fights, how the
obstacle presents itself, what quality the challenge expresses in this moment. The creature's
relevant statistics are added to that card's total in the same way a player's stats add to
theirs. The player's total is compared against the creature's total; the higher result succeeds.

The special does not impose a mechanical bonus — it tells the DM and players *what kind of thing
is happening*. A wolf whose challenge card is **fire** fights with savage reckless aggression; a
locked door whose challenge card is **dark** has a hidden mechanism no one has found yet; a
merchant whose challenge card is **water** is evasive, adaptive, and hard to pin down. The DM
interprets the special to make the encounter feel alive.

When the creature's or challenge's total exceeds the player's, the player fails and the
consequence lands immediately. In combat this means the creature's relevant attack deals its
damage — 1 stat reduction of the appropriate type, as listed in the creature's entry. Against a
non-combat challenge, failure means the obstacle holds: the door stays shut, the guard notices,
the contact refuses. The DM describes what changes and the player must try again or find another
approach.

### Reading Challenge Specials

| Special | Quality it brings to the challenge |
|---|---|
| fire | Aggression, heat, urgency — the challenge presses hard and punishes hesitation |
| water | Adaptability, flow, evasion — the challenge shifts and finds gaps to exploit |
| air | Speed, unpredictability, distraction — the challenge moves before you can react |
| wood | Patience, entanglement, weight — the challenge holds on and grows harder to remove |
| iron | Determination, sharpness, inflexibility — the challenge does not bend or stop |
| stone | Endurance, solidity, obstruction — the challenge absorbs and blocks without relenting |
| light | Revelation, precision, exposure — the challenge sees clearly and leaves nowhere to hide |
| dark | Concealment, hidden motive, deception — the challenge is not what it appears to be |

These apply across all scenario types. A negotiation opponent drawn with **iron** does not
budge from their position regardless of pressure. A stealth patrol drawn with **light** is
alert, thorough, and catches every shadow that moves. A forage drawn with **stone** means the
land is barren and unyielding. The same card means something different in every scene — that
is the point.

### Passing Cards (Aid)

Each round a player draws 2 cards. They may:

- **Play one, discard the other** — the discarded card goes to the discard pile unused
- **Pass one to an ally, play the other** — the ally must play the passed card on their next
  turn; it is a gift and a commitment; **every act of aid raises Tension by 1**
- **Spend one defensively** — hold the second card face down; before the end of the round it
  reduces the next incoming damage against you by 1, then goes to the discard pile

The defensive spend creates a real choice: aid an ally and raise Tension, protect yourself, or
commit fully to your own action and discard.

The ally **must** play the passed card on their next turn — it is a gift and a commitment.

A player may only accept **one passed card per turn**, regardless of how many allies offer one.
If multiple players attempt to pass to the same ally, only the first offer may be accepted; the
others must be used or discarded by the passing players.

### Card Hand and Discard

A player's hand at any moment consists of the cards drawn this round plus any card passed to
them last round. Unplayed cards do not carry over — at the end of each round, every unplayed
card in hand goes to the discard pile.

The discard pile is face-up and visible to all players. Effects that recall cards (such as Endu
**second wind** or Char **rallying cry**) draw from the discard pile, not the main deck. When
the main deck runs out, shuffle the discard pile to form a new deck.

### Turn Order

Players take turns in the order they sit around the table. The order is fixed for the session
and applies in every scenario. After all players have taken their turn, the DM resolves any
creature or challenge actions that were not already triggered reactively during the players'
turns.

**Multiple creatures acting:** Individual named creatures each draw their own card and act
separately on the DM's turn. A group of three or more identical creatures (a wolf pack, a bandit
squad, a swarm of sprites) acts as a single unit — the DM draws one card, adds the group's
dominant stat once, and delivers one hit. Two creatures of the same type each draw and act
separately.

**Creatures with multiple attacks:** Some creatures (Wolverine, Werewolf in beast form, Troll)
can make two attacks in one round without spending extra actions. The DM draws one card per
attack — two draws on that creature's turn. Each attack resolves separately against its target;
the two attacks may be directed at the same target or split between two.

### Heroic Action

A player may lay their **entire hand** on the table and claim every statistic shown across all
cards. The first card's special fuels the feat.

Each remaining card is then revealed one by one. For every card revealed after the first:

- Tension rises by 1
- The DM draws one additional card for the opposing force and keeps the highest total drawn

After all cards are revealed the feat resolves using the player's combined total against the DM's
highest card. The player's entire hand then goes to the discard pile; they draw no cards next
round.

A Heroic Action can only be attempted once per scene. It cannot be aided — no ally may pass a
card to a player who has laid their hand.

### Tension

Tension starts at 0 at the beginning of each scenario and climbs as players cooperate. When
Tension exceeds **5**, the scene itself becomes hostile — cards drawn for narrative purposes add
complications. Each Scenario section describes what specifically changes when tension rises, and
how to bring it back down. Tension does not carry over between scenarios; it resets to 0 when
a new scenario begins.

### Easing Tension at Camp

Outside of combat and crisis, the group can actively lower Tension by gathering around a fire
and spending time together — trading stories, playing music, sharing a meal. This is the primary
way tension built across a hard day is released. It requires effort and the right conditions; a
cold wet camp after a punishing march does not naturally produce ease.

**The fire** is the prerequisite. One character spends a camp action to establish it. In calm
conditions (Light, Life, Wood, Stone weather) no check is required. In Rain, Decay, or Iron
weather a Hand ≥ 2 check is needed to get it going and keep it going. In Surge it is
impossible. A sheltered position — a rock face, dense canopy, a hollow dug by *Digging*, a
structure built by *Ingenuity* — counts as calm conditions for fire purposes regardless of
weather.

**The activity** is led by one character spending their camp action. Three forms count:

- **Stories** — tell a tale, recount the day's events, share news from home; Char leads
- **Music** — performance for the group; Char leads; *Musical* power adds its linked stats
- **Shared meal** — eating together rather than alone; requires food; Char or Cooking
  specialization leads; the Cooking specialization adds its governing stat (Hand) to the total

Draw a card and add the leading character's Char plus any applicable bonuses. If the total
reaches **4**, Tension drops by 1 at the end of the round. Only one social activity can lower
Tension per round regardless of how many are attempted.

**Modifiers:** rough weather (Surge, Water, Air) imposes −1 to the total. *Relaxed* power present
and active means the activity always succeeds without a draw.

### Time-Based Scenarios

In travel, camp, market, and forage each round represents **one hour** of in-world time. The
group shares a pace — how much ground is covered, how much of the town is visited, how much of
the forest is searched — set by the character with the lowest relevant Speed.

In **travel**, each round the group moves one map tile. All tile movement is collective — the
group arrives at the next tile together at the end of the hour. Individual characters cannot
move ahead to a different tile while the group is still crossing.

A character whose Speed exceeds the group's pace by 2 or more completes their primary action
with time to spare. They may use that spare time for one secondary action, chosen freely:

| Secondary action | Stat or power | Effect |
|---|---|---|
| Scout | Perc or *Travels* | Look one scene ahead; the group cannot be surprised next round |
| Gather | Hand or *Druid* | Collect herbs, edible plants, or useful materials found nearby |
| Navigate | Perc or *Labyrinth* | Map the current area; +1 to the next route or direction action |
| Observe | Perc or *Lookout* | Read the local situation — contacts, threats, faction tensions — before acting |

Secondary actions are taken alone and do not raise Tension. They represent the faster character
doing something useful while others are still occupied with the hour's primary demands.

The minimum group pace is Speed 2, regardless of the slowest member. A character below Speed 2
does not slow the group further but is themselves impaired — they take −1 to their primary
actions each round until they rest. This protects both the character and the group dynamic.

### Power Strain

Using the same power on consecutive turns risks losing control of it. The cards are the signal:
if the card you draw and commit shows at least one of that power's linked statistics, the power
is fed and works normally. If neither linked stat appears on the committed card, the power
Overwhelms — see below.

---

## Challenge Difficulty

### Reading Stat Thresholds

Actions in this game are gated by stat thresholds. These tell you directly what level of
investment a character needs to use an action reliably.

| Threshold | Investment level | When characters reach it |
|---|---|---|
| ≥ 2 | Light | One progression above the starting stat of 1 |
| ≥ 3 | Meaningful | A character who has built toward this area |
| ≥ 4 | Serious | A character with dedicated progression in this stat |
| ≥ 5 | Peak | A character with specialization-depth investment |

Not every character needs every stat. A group of 4–7 covers the full range between them — the
threshold marks which character in the group handles a given action, not which ones cannot.

### Creature Difficulty

A creature's **dominant stat** — the highest value in its stat block relevant to the encounter —
sets the floor for what the group needs to compete. Compare the group's best relevant stat
against the creature's dominant to gauge the gap.

| Creature dominant stat | Tier | What this means in play |
|---|---|---|
| 1–3 | Minor threat | A starting group handles this with basic tactics |
| 4–5 | Moderate threat | At least one character needs a relevant stat ≥ 3 to contribute meaningfully |
| 6–7 | Major threat | Requires coordinated powers and items; a stat ≥ 4 in the key area |
| 8+ | Formidable | A well-progressed group relying on powers, items, and tight coordination |

A creature's stat block often shows peaks in some areas and weaknesses in others. The dominant
stat matters most for its primary attacks; lower stats mark openings the group can exploit.

### Closing the Gap

The game is designed for groups of 4–7. When multiple characters contribute cards and aid, their
stats compound — a fight that would break one character is often within reach of a coordinated
group. Three things close the gap between the group's stats and a creature's dominant:

- **Powers** — most powers add an effective +1 to +2 in specific situations; a well-matched
  power lets a moderate-stat character punch above their raw numbers
- **Items** — item boosts grant advantages under defined conditions, letting a character exceed
  their stat level when the conditions align
- **Coordination** — passing cards raises Tension but combines multiple characters' stats into
  one action; a group that manages Tension well compounds totals a single creature cannot match

### Scenario Challenge Thresholds

The challenge entries in [SCENARIOS.md](SCENARIOS.md) list specific resolution paths with stat
requirements. These follow the same thresholds above: *(Char ≥ 3)* requires meaningful Char
investment; *(Endu ≥ 4)* requires dedicated investment.

Each challenge offers multiple resolution paths deliberately. If the group's strongest character
in a listed stat falls short, a different approach using a different power or stat is available.
The DM should treat the list of resolution options as the full menu of viable approaches — the
group needs only one path, not all of them.

---

## Damage and Mitigation

### How Damage Works

Each successful attack reduces one of the target's statistics by 1. The damage type determines
which statistic is reduced. Hits accumulate across a scene — a character who reaches 0 in any
statistic cannot perform actions relying on it until the stat is restored through rest or
treatment. A character reduced to 0 in every combat-relevant stat (Might, Dex, Speed all at 0)
is effectively incapacitated even before Endu reaches 0; treat them as Broken for the scene.

The attacker's dominant relevant stat determines how difficult the hit is to avoid. The damage
type determines what it costs the defender if it lands.

Some attacks list two damage types — a **compound attack**. Each type applies its stat reduction
separately on the same hit. Powers and exceptional creatures may deal compound damage; standard
weapons deal only one type.

### Broken and Death

When a character's **Endu reaches 0** they are **Broken** — body and spirit have given out.
A Broken character collapses and cannot act. All other statistics drop to 0 as well; the
character is entirely at the mercy of whatever is around them.

While Broken, every hit that would reduce Endu further instead inflicts a **mortal wound**.
Each mortal wound leaves a permanent mark: the character's maximum Endu is reduced by 1
(recovered only through extended rest between sessions, at DM discretion). A character who
accumulates **three mortal wounds** dies.

A Broken character can be stabilised by an ally spending one action and succeeding on a
Hand check (threshold 3); stabilised means no further mortal wounds accrue this scene, but
the character remains unconscious until they receive a full rest. A successful full rest
clears the Broken state and restores all stats to their current maximums.

### Damage Types

| Type | Stat reduced | What it represents |
|---|---|---|
| Cutting | Dex | Slashes impair precision and fine movement |
| Impaling | Endu | Punctures drain stamina |
| Blunt | Might | Impacts sap raw strength |
| Grab | Speed | Locks and holds restrict movement |
| Draining | Will | Life force or resolve drawn away |
| Pummel | Endu | Overwhelming force; bypasses armor |
| Fire | Endu | Burns consume stamina |
| Cold | Speed | Cold stiffens limbs and slows reactions |
| Electric | Perc | Shock scrambles senses and awareness |
| Radiant | Will | Divine or spiritual force tests resolve |

### Weapons

| Weapon | Damage type | Combat notes |
|---|---|---|
| Sword | Cutting | Parry special deflects one incoming hit per round |
| Glave | Impaling | Stop special triggers on the same action as the hit |
| Flail | Blunt | Stun special: target loses their next action |
| Spear | Impaling | Intercept: lands before a charging target closes distance |
| Staff | Blunt | Block special can deflect incoming hits |
| Bow | Impaling | Cripple: Speed reduced by 1 on a successful called shot |
| Crossbow | Impaling | Wound: damage persists into the next scene if untreated |
| Sling | Blunt | Stun special applies silently from range |
| Dagger | Cutting | Sneaking special: +1 Dex to total when striking unaware targets |
| Darts | Draining | Poison accumulates; second hit imposes −1 Will for the scene |
| Whip | Grab | Steer special: can strip a held item instead of dealing damage |
| Pickaxe | Blunt | Bypasses the armor special of stone-skinned or heavily armored targets |
| Knife | Cutting | Too small to add Might; Dex and Hand only |

### Combat Powers

| Power | Damage type | Combat notes |
|---|---|---|
| Blood | Draining | Targets Will; can redirect the drain to restore an ally instead |
| Claw | Cutting | Undetected strike adds +1 Dex to total |
| Charge | Blunt | Knocks prone; bypasses Speed-based defenses on targets with Speed < 4 |
| Jaws | Cutting + Grab | Bite deals cutting (Dex −1); grip applies grab (Speed −1 while held) |
| Magic | Varies by element | Flame → Fire/Endu; Water → Cold/Speed; Wind → Electric/Perc; |
| | | Earth → Blunt/Might; Iron → Impaling/Endu; Light → Radiant/Will; |
| | | Dark → Draining/Will; Plants → Grab/Speed |
| Druid | Varies | Damage type matches the summoned creature's primary attack |
| Scolding | — | No direct damage; redirects incoming attacks onto the taunting character |
| Shamanic | — | No direct damage; bound spirits impose −1 Will on a target for one round |

### Mitigation

Each defensive item or power reduces incoming damage of specific types by 1. A reduction that
brings damage to 0 means the blow lands but deals no stat loss. Some specials **negate** a hit
entirely — the blow does not land at all.

| Defense | Mitigates | How |
|---|---|---|
| Armor | Cutting, Blunt | −1 to each; imposing special absorbs one damage source per scene entirely |
| Breastplate | Cutting, Impaling | −1 to each; defend special negates one hit entirely |
| Leather | Cutting | −1 to cutting only; blunt from attackers with Might ≥ 4 bypasses it |
| Shield | Any (block) | Block special negates one hit entirely; passive −1 to Grab damage |
| Ring (ward) | Draining, Fire, Cold, Electric, Radiant | Ward absorbs one magical or elemental hit per scene |
| Hide power | Cutting, Impaling | −1 to each |
| Fur power | Blunt, Cold, Fire | −1 to each; also absorbs environmental damage from weather and terrain |
| Balance power | Cutting, Impaling, Blunt | Attacker needs Might or Dex 1 higher than their stat to land the hit |
| Religion power | Radiant, Draining | −1 to each while the bless special is active |
| Bandages | — | Removes one accumulated stat reduction after it has been applied |

### Recovery

Stat reductions heal through rest, treatment, and specific powers. A stat cannot go below 0;
a character at 0 in any stat cannot perform actions relying on it until at least 1 point is
restored.

| Rest type | Stat points restored | Condition |
|---|---|---|
| Bandages | 1, any stat | Applied immediately after a hit |
| Potion | 1 (2 if master alchemist quality) | Consumed as an action |
| Short rest (1 hour, in camp scenario) | 1, most-reduced stat | Uninterrupted; no active threats |
| Full rest (6 camp rounds, no interruption) | All stat reductions cleared | Tent or shelter improves by +1 stat |
| Interrupted rest (threat arrives mid-camp) | 1, most-reduced stat only | Rest ends when the threat appears |
| *Blood* power | 1, any stat, on one ally | Draining damage dealt to a nearby source |
| *Religion* bless | 1, Will or most-reduced | Applied before or during rest |
| *Sleeper* power | Full rest in any condition | Ignores weather, noise, and poor shelter |

Stat reductions persist across scenes within the same scenario — they are not reset between
scenes. Only items, powers, and rest clear them.

Potions are most effective mid-scenario. A potion consumed during a full camp rest provides no
benefit — full rest clears all stat reductions regardless.

A stat reduced by an ongoing effect (serpent venom, constriction, drowning grip) continues
dropping each round until treated or the source is removed. Bandages and *Blood* stop ongoing
effects; time alone does not.

---

## Fear and Flight

When enemies are hurt or outmatched, their **Will** determines whether they hold or break. Will
is already the stat that resists draining and radiant attacks — it is also the measure of a
creature's nerve. A creature that has taken Will damage is correspondingly easier to rout.

**Automatic check:** When any of the following first applies to a creature on its turn, the DM
draws one card for it and adds its current **Will** only — other stats on the card do not apply,
but the card's special shapes how the fear manifests (a *fire* draw: blind panic; *dark*: silent
withdrawal; *iron*: a cold, deliberate break). If the total is less than **4**, the creature
flees that turn.
- Its Endu has dropped below half its starting value
- A visible ally was downed this round

Creatures whose Will is 4 or higher do not break from these triggers alone — only a player
action can move them.

**Player-triggered fear:** A player can actively break a creature's nerve. They play a card with
**Might** (physical dominance) or **Char** (eroding confidence); the DM draws one card for the
creature and adds its current **Will**. Normal resolution applies: higher total wins. If the
player wins, the creature flees on its next turn. Powers that make this check possible:
*Scolding*, Might **power through** *(Might ≥ 3)*, *Shamanic* binding.

**Fleeing:** A fleeing creature moves toward the nearest available exit at full Speed and does
not attack on the turn it flees. Once a creature has decided to flee it will not re-engage
unless cornered or under a leader's direct command.

**Alerting:** A fleeing creature that passes near enemies not yet in combat immediately triggers
an automatic check for each of them. A creature that flees noisily — calling out, crashing
through cover, visibly panicking — also alerts any enemy within earshot; those enemies join the
combat next round rather than fleeing.

**Stopping a fleeing creature:** The group has one round before the creature escapes and
potentially alerts others.
- Speed **chase** *(Speed ≥ creature's Speed)* — physically block the escape route before it
  clears
- *Scolding* — the active taunt holds the creature in place; it cannot flee while it is the
  current target
- Will **steel the mind** *(Will ≥ 3)* — project enough presence to freeze a fleeing creature
  for one round
- Dex **called shot** *(Dex ≥ 4)* — targeted strike; if it reduces the creature's Speed to 0,
  escape is impossible
- *Night* or *Adaptation* — slip ahead and seal the exit before the creature reaches it

---

## Character Creation

Each character requires:
- **Name, gender, description**
- **Race** — determines which powers are available
- **Place of origin** — chosen from 16 fixed world locations
- **6 free advancement slots** to spend on progression at creation

---

## Progression

### Types

| Type | Effect |
|---|---|
| **Power** | Race-specific ability; raises 1 of its 2 linked statistics |
| **Background** | Life history; raises 1 of 2 linked statistics; unlocks item slots and specializations |
| **Specialization** | Trained skill; raises its governing statistic; unlocks special actions |

### Rules

1. **The first 6 progressions cost 0 XP.** From progression 7 onward, cost = 1 + current level
   of that item.
2. **No two backgrounds or specializations may be chosen in succession.** A power must
   separate them.
3. A specialization can only be learned if a background that unlocks it has already been taken.
4. The level of a specialization is limited by the combined level in its supporting backgrounds.
5. **No single statistic may be raised more than 3 times across the initial 6 free progressions.**
   Stats of 4 and above belong to XP-paid advancement after creation.

### Earning XP

XP is gained by discovering secrets — things hidden from the world and waiting to be found.
Secrets live in two places:

- **Ruins and forgotten places** — a buried chamber, a collapsed vault, a mechanism no one has
  touched in a century. Finding what was lost earns XP.
- **The hearts of people** — a contact's grief, a merchant's double life, a guard captain's
  private loyalties. Drawing out what someone keeps hidden earns XP.

The DM awards XP when a secret is genuinely uncovered, not merely stumbled upon. Players must
seek, interpret, and understand — the reward is for the discovery, not the luck of the path.

### XP Costs

| Level reached | XP cost |
|---|---|
| 1 (within first 6 progressions) | 0 |
| 2 | 2 |
| 3 | 3 |

---

## Races and Powers

Each of the 16 races has 7 available powers. A character may only learn powers from their own
race. Each power links to 2 statistics, has a special element or ability, generates a card for
play, and can be learned multiple times to increase mastery. **Mastery level** equals the number
of times the power has been learned — mastery 1 after the first learning, mastery 2 after the
second, and so on. Effects in POWERS.md that say "at mastery 2" require two learnings of that
power.

### Overwhelmed

Each power has an **Overwhelmed** state described in POWERS.md. When a power Overwhelms, the
player does not control what it does. The DM draws one card and uses its special to interpret
the Overwhelmed entry — the direction, target, and shape of the effect are the DM's to
determine. The player's committed card is spent. The Overwhelmed state persists until the
player spends one full turn without using that power, at which point it clears. A full rest
always clears all Overwhelmed states.

Three things trigger Overwhelm:

1. **Consecutive strain** — using the same power as the previous turn while the committed card
   shows neither of the power's linked statistics. The power has no card energy supporting it
   and slips from control.

2. **Broken foundation** — using a power while either of its linked statistics is currently 0.
   A power draws on both its linked statistics; committing it with one collapsed is overreach.

3. **Environmental impossibility** — the DM may rule that conditions directly make a power
   impossible (a *Swimmer* in a desert, *Flight* in a cavern too low to spread wings). These
   override rather than Overwhelm: the power simply cannot function here.

| Race | Available Powers |
|---|---|
| Badgers | Digging, Ingenuity, Portage, Claw, Camp, Fur, Scrounger |
| Bats | Flight, Scrounger, Blood, Claw, Night, Scolding, Hearing |
| Beavers | Ingenuity, Hunter, Jaws, Swimmer, Camp, Fur, Nimble |
| Cats | Hunter, Nimble, Relaxed, Climber, Blood, Claw, Night |
| Crows | Lookout, Ingenuity, Adaptation, Balance, Scolding, Flight, Night |
| Finches | Musical, Clan, Balance, Hearing, Politics, Flight, Scolding |
| Foxes | Adaptation, Climber, Musical, Labyrinth, Sly, Nimble, Travels |
| Humans | Adaptation, Ingenuity, Balance, Portage, Politics, Sly, Lookout |
| Otters | Hunter, Swimmer, Fur, Nimble, Scurry, Sly, Lookout |
| Owls | Claw, Clan, Hunter, Lookout, Charge, Flight, Scolding |
| Boar folk | Digging, Hide, Camp, Smell, Sleeper, Charge, Scolding |
| Rabbits | Camp, Labyrinth, Scrounger, Hearing, Sleeper, Fur, Digging |
| Raccoons | Scurry, Camp, Relaxed, Sly, Scrounger, Clan, Control |
| Rat folk | Clan, Scurry, Climber, Sleeper, Smell, Scrounger, Control |
| Bull folk | Portage, Swimmer, Charge, Labyrinth, Relaxed, Hide, Travels |
| Wolf folk | Jaws, Travels, Control, Hide, Clan, Smell, Hearing |

---

## Backgrounds

Each background links to 2 statistics, raises one of them by 1 when learned, grants **2 item
slots** at first level (+1 per additional level), and unlocks specific specializations.

| Background | Stats | Starting Items | Unlocks |
|---|---|---|---|
| Noble | Char + Might | horse, armor, sword | Parry, Swords |
| Farmer | Endu + Hand | flail, donkey, sling, dog | Sling, Druid |
| Scholar | Will + Perc | staff, backpack | Healer, Jeweler, Navigation, Magic |
| Watch | Perc + Might | glave, breastplate, crossbow | Blocking, Pole weapon, Crossbow |
| Crafter | Hand + Will | tools, backpack | Woodworking, Cloth, Leather, Smithing, Machinist, Cooking, Axes, Religion |
| Monastery | Endu + Will | staff | Blocking, Blunt, Religion, Monk |
| Ascetic | Will + Char | staff | Druid, Shamanic, Religion, Magic |
| Trader | Char + Hand | cart, donkey | Jeweler, Navigation |
| Fisher | Endu + Perc | fishing net | Woodworking, Cloth, Brawl, Religion |
| Circus troupe | Speed + Dex | whip | Climbing, Juggle |
| Back alley | Hand + Dex | dagger, darts | Climbing, Sneak, Darts, Scouting |
| Hunter | Might + Dex | bow, falcon, dog | Climbing, Axes, Cooking, Bows, Scouting, Tracking, Druid |
| Miner | Endu + Might | pickaxe, leather | Axes, Brawl |
| Army | Might + Endu | spear, shield, leather | Shield, Brawl, Spear |

---

## Contacts

Contacts are individuals the group has built a relationship with through play — encounters in
market or negotiation scenarios, introductions through other contacts, and faction ties. The DM
tracks each contact's level; it rises as the relationship deepens through repeated meaningful
interaction.

Each contact offers all benefits at lower levels plus the benefit listed at their current level.

| Level | Benefit |
|---|---|
| 1 | **Lodging** — provides a quick place to sleep for the group without cost or questions |
| 2 | **Local knowledge** — answers one question per visit about people, places, or events in their area without a Char check |
| 3 | **Introductions** — arranges a meeting with one significant NPC or faction per scenario, bypassing the normal Char threshold to initiate contact |
| 4 | **Correspondence** — the group may send a written question from any location; the answer arrives within one travel scenario without a visit |
| 5 | **Workshop access** — grants use of their workspace for crafting; the workshop tier depends on the contact's trade |
| 6 | **Teaching** — teaches one specialization they know; learning it follows normal progression rules |
| 7 | **Special materials** — sources or trades one special material per scenario; the material's rarity depends on the contact's specialty and reach |

The contact's trade determines which specializations they can teach (level 6) and which materials
they can provide (level 7). A Smith contact teaches smithing specializations and sources metal
materials; a Scholar teaches academic specializations and sources rare reagents; and so on.

### Starting Contacts

Each background a character holds grants one contact at the character's **place of origin**,
starting at level 2. The contact type reflects the background — a Crafter background gives a
craftsperson contact, a Hunter background a hunter or ranger, a Noble background a member of
the local nobility, and so on.

These contacts are only accessible when the character is physically present at their place of
origin. Returning there may take weeks of travel. Every contact built elsewhere — through play,
through introductions, through faction ties — is immediately useful without that journey, which
makes cultivating contacts along the way as valuable as deepening the ones left behind.

---

## Inventory and Carrying

Carrying capacity is determined by **Endurance**. Each item has a bulk value that reduces
available capacity. Negative bulk items increase capacity.

Items do not degrade from normal use. A specific flaw (Volatile material, Degraded flaw), a
targeted disarm, or an explicit effect in a creature's attack can destroy or disable an item as
described in its entry. Otherwise equipment is durable and requires no maintenance tracking.

| Item | Bulk |
|---|---|
| Cart | −20 |
| Donkey | −9 |
| Horse | −6 |
| Backpack | −3 |
| Glave | 5 |
| Flail | 4 |
| Staff | 3 |
| Breastplate | 2 |
| Dagger | 0 |
| Darts | 0 |
| Sling | 0 |

Each background grants 2 item slots at first level, +1 per subsequent level. Basic supplies
available to all: knife, food, clothes, leather repair, tent, bedroll.

---

## Crafting

Creating an item from scratch is a multi-day project requiring a proper workspace and materials.
A character may craft if they have the **Crafter** background or one of the following
specializations: Smithing, Woodworking, Leather, Cloth, Jeweler, Machinist.

### Workshop

Crafting requires access to a workshop suited to the item and material. The workshop must be
available for the full duration; moving between workshops or leaving for travel restarts the work.

| Workshop | Crafting total | Maximum tier |
|---|---|---|
| Improvised (*Ingenuity* power only) | −2 | Common |
| Basic (village smithy, traveling kit) | −1 | Common |
| Proper (town forge, atelier, leatherworker's shop) | +0 | Rare |
| Master (guild hall, specialist's studio) | +1 | Legendary |

### Duration

Each crafting day is a full day at the workshop. The crafter may still rest, eat, and stand watch
normally but cannot travel or leave the premises.

| Item tier | Base days | With rare material | With legendary material |
|---|---|---|---|
| Common | 3 | — | — |
| Rare | 5 | +2 | — |
| Legendary | 10 | +2 | +5 |

A dash (—) means the material tier exceeds the item tier and cannot be combined.

### The Crafting Process

**Declare** the item, material, and workshop at the start. The DM confirms the tier and total
days required.

**Midpoint** — when half the crafting days are complete, draw one card. The element reveals an
**opportunity** (see Opportunity table below). The crafter may choose to pursue it, which extends
the project by 1 day and adds the listed quality to the finished item. Passing on the opportunity
has no effect.

**Completion** — on the final day, draw one card. Add Hand, any stats shown on the card, the
workshop modifier, and any qualifying specialization's governing stat. If the total meets the
tier threshold the item is finished. The element of this same card also reveals the item's
**flaw** — every completed item carries one.

| Total | Tier |
|---|---|
| 4–6 | Common |
| 7–9 | Rare |
| 10+ | Legendary |

If the total falls short of the tier threshold the materials are spent without result.

**Flaw mitigation** — after completion the crafter may spend 1 additional day to address the
flaw. Draw another card and repeat the check. If the total meets the tier threshold + 2 the flaw
is eliminated. Otherwise it remains.

### Opportunity Table

| Element | Quality | Effect |
|---|---|---|
| Light | Polished | +1 to Char actions when the item is displayed or presented |
| Life | Balanced | the wielder's Speed penalty from carrying this item is reduced by 1 |
| Wood | Flexible | once per scenario the item absorbs one hit that would break or consume it |
| Stone | Reinforced | armor: damage reduction +1; other items: withstand one additional use before degrading |
| Flame | Tempered | weapon: +1 to damage totals; armor: fire and cold damage reduced by 1 additional |
| Air | Lightweight | bulk reduced by 1 (minimum 0) |
| Iron | Hardened | weapon: cutting damage bypasses cutting mitigation on armored targets; armor: impaling −1 additional |
| Water | Refined | the item's primary special activates one additional time per scene |
| Dark | Unassuming | Perc checks to identify the item as valuable gain −1; stealth +1 when item is concealed |
| Surge | Volatile | weapon: first attack each combat deals +1 damage; armor: absorbs one additional hit before any stat reduction, resetting each scene |
| Veil | Resonant | Will-based checks made while wielding this item gain +1 |
| Decay | Seasoned | the item's primary stat contributes +1 to its total on the first action of each scene |

### Flaw Table

| Element | Flaw | Effect |
|---|---|---|
| Light | Glaring | Perc checks to spot the wielder gain +1 in bright conditions |
| Life | Uneven | Speed or Dex checks while using this item gain −1 |
| Wood | Warped | the item's primary stat contributes −1 to its total on the first action of each scene |
| Stone | Heavy | bulk increased by 1 |
| Flame | Brittle | the item degrades one use earlier than normal |
| Air | Loose | the item can be disarmed or removed one action faster than normal |
| Iron | Rough | weapon: −1 to action total against armored targets; armor: the wearer's Dex actions gain −1 |
| Water | Porous | armor and weather protection reduced by 1; the item deteriorates faster in wet conditions |
| Dark | Tarnished | Char actions when displaying this item gain −1 |
| Surge | Unstable | once per scene at DM discretion the item's special does not activate |
| Veil | Faint | the item's special requires one additional action or use to trigger |
| Decay | Degraded | the item's damage or protection value is reduced by 1 |

### Enhancement Crafting

Weapons may be enhanced with **gems**, **runes**, or **special weaves** during the crafting
process. Each type requires a second character to collaborate for the full duration. The
collaboration doubles the total crafting days (including any material additions).

The same midpoint and completion draws apply. Outcomes are modified:

- **Midpoint** — the drawn quality applies at normal strength and is permanent on the item
- **Completion** — the drawn flaw is **lesser**: it triggers only once per scenario rather than
  applying constantly

Each enhancement type also adds a fixed substantial property to the weapon:

**Gems** *(collaborator requires Jeweler specialization)*
The gem's element is chosen at the start of crafting from the 12 available elements and is fixed
permanently. Once per scene the wielder may declare a gem strike before committing — the attack
deals +2 damage of the gem's element in addition to its normal damage type.

**Runes** *(collaborator requires Magic power or specialization)*
The Magic user chooses the runic element at the start of crafting. Once per scene the wielder may
activate the rune before committing a card — Will adds to the action total regardless of what
the card shows.

**Special weaves** *(collaborator requires Shamanic power or specialization)*
A spirit is woven into the weapon at crafting and remains until the weapon is destroyed. Once per
scene the wielder may call on the spirit — draw one additional card and commit the better of the
two; the unchosen card is discarded.

A weapon may carry only one enhancement. Crafting a second enhancement onto the same weapon
overwrites the first.

### Finding Materials

Special materials cannot be purchased at market. They are found in the world:

- **Common** — Gather secondary action in appropriate terrain; a Druid, Smith, or Miner contact
  may trade them; some forage scenes yield them directly
- **Rare** — ruins during exploration; specialist contacts (Healer, Hunter, Fisher); not grown
  or improvised in the field
- **Legendary** — the blasted lands and the deepest ruins only, or through a contact who has
  spent a lifetime seeking them; unique and irreplaceable

→ See [ITEMS.md — Special Materials](ITEMS.md#special-materials) for all 12 materials, their
elements, crafting effects, and discovery sources.

### Temporary Enhancement

Any crafter with the Crafter background or a qualifying specialization can enhance an existing
item in one hour (one camp action). Tools must be available; no workshop is required.

The same two-draw process applies:

**Midpoint** (30 minutes in) — draw one card. The element reveals an opportunity (Opportunity
table). The quality is applied automatically — the crafter takes it without choice.

**Completion** (end of the hour) — draw one card. The element reveals a flaw (Flaw table). The
flaw is applied automatically alongside the quality.

Both the quality and flaw are temporary. They expire at the end of the next scenario in which
the item is used.

**Cooking** follows exactly these rules. Food prepared this way carries the drawn quality and
flaw; both apply when the food is consumed. The Cooking specialization extends the quality's
duration to two scenarios instead of one.

---

## Weather

At the start of each day the DM draws one card from the top of the shared deck. The element on
that card sets the weather for the day. Effects listed below apply to any scenario taking place
during it.

**Shelter** negates cold, wind, and rain penalties where noted. A tent, any permanent building,
and any structure built by the *Ingenuity* or *Digging* power count as shelter.

If the drawn element has no entry below (Wood or Stone), the day passes without weather
penalties.

### Light — Clear sky

Bright sun and excellent visibility.

- **forage** — Perc +1
- **stealth** — detection checks against targets in open ground gain +1 (no shadows to hide in)
- **camp** — full rest restores 1 additional stat point

### Life — Warm and calm

Mild, pleasant conditions with a light breeze.

- **travel** — group pace counts as Speed +1 for this day
- **forage** — Perc +1; yield covers 1 additional character

### Flame — Hot and dry

Scorching heat, no shade, air shimmers.

- **travel** — each character takes Endu −1 at the end of the day; *Fur* and *Hide* negate this
- **combat** — fire-based *Magic* attacks deal Endu −2 instead of −1
- **camp** — unsheltered rest restores 1 fewer stat point
- **forage** — Perc −1 for locating water; water sources may be dry at DM discretion

### Air — Windy

Strong gusts, blown debris, constant noise.

- **combat** — ranged attacks gain −1 to the action total
- **travel** — *Flight* covers twice the normal distance this day; *Nimble* and *Scurry* gain +1
- **stealth** — detection checks relying on sound gain −1 (wind masks movement)
- **camp** — unsheltered rest restores 1 fewer stat point

### Water — Rain

Steady downpour, wet ground, reduced visibility.

- **travel** — Speed −1 for group pace; *Swimmer* crosses any water obstacle without penalty
- **combat** — ranged attacks gain −1
- **stealth** — detection checks gain −1 (rain masks sound and sight)
- **exploration** — Dex checks for climbing or traversing slippery surfaces gain −1
- **forage** — Perc −1

### Iron — Cold, frost

Biting cold, icy ground, frozen water sources.

- **travel** — each character takes Endu −1 at the end of the day; shelter or *Fur* negates this
- **camp** — unsheltered rest restores 1 fewer stat point
- **forage** — Perc −1

### Dark — Deep clouds

Near-darkness during the day, deep shadow throughout.

- **stealth** — all stealth actions gain +1
- **travel** — Perc checks to detect route hazards gain −1
- **exploration** — Perc checks gain −1

### Surge — Thunderstorm

Lightning, driving rain, violent gusts.

- **travel** — Speed −2 for group pace; each character takes Endu −1 at the end of the day
- **combat** — ranged attacks gain −2
- **stealth** — detection checks gain −2
- **forage** — forage actions automatically fail; the group cannot gather food this day
- **camp** — unsheltered rest restores no stat points; sheltered rest restores 1 fewer than normal

### Veil — Fog

Thick mist; visibility drops to a few paces.

- **travel** — Perc checks for navigation gain −1; *Lookout* and *Travels* cannot identify
  hazards in advance this day
- **combat** — ranged attacks gain −2
- **stealth** — detection checks gain −1
- **exploration** — Perc checks gain −1
- **market** — contacts in outdoor or open-air locations require an extra Perc check to locate

### Decay — Cold drizzle

Persistent grey chill, everything damp.

- **travel** — each character takes Endu −1 at the end of the day; shelter or *Fur* negates this
- **camp** — unsheltered rest restores 1 fewer stat point
- **forage** — Perc −1
- **negotiation** / **market** — Tension cannot drop below its current value this day

---

## World: Places of Origin

| Place | Notes |
|---|---|
| Scarlet vale | Capital of Allondo |
| Blackwood freehold | Agricultural town in Allondo |
| Chatter Creek | Northern border town of Allondo |
| Clear water | Mining town of Allondo |
| Cliffside hold | Capital of Brumal |
| Bockthicket | Mining town of Brumal |
| Elmsfield | Border town around a huge tree |
| Fata morgana | Oasis city in the southern desert |
| Gap city | Last settlement before the shifting lands; built into a steep mountain gap |
| Lastwater | Travel stop to the south |
| Linar harbour | Small independent harbour town |
| Raft city | On the river through the great forest |
| Rakeville | Village towards Allondo |
| Rosepond | Mining village near the world edge |
| Salmonswell | Independent small city well up-river; famous for salmon runs at the Upwelling |
| Steadington | Village in Brumal overtaken by desert |
| World edge | Mining city near the ocean |
