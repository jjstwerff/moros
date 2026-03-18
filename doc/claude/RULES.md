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
9. [Character Creation](#character-creation)
10. [Progression](#progression)
11. [Races and Powers](#races-and-powers)
12. [Backgrounds](#backgrounds)
13. [Inventory and Carrying](#inventory-and-carrying)
14. [World: Places of Origin](#world-places-of-origin)

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

→ See [POWERS.md](POWERS.md) for all 36 powers with scenario applications.

---

## Core Mechanics

### The Card Deck

Eight default cards form the shared stockpile at the start of each scenario:

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

Each character adds 2 cards from their character sheet as stakes are revealed at the start of play.

### Playing Cards

Each round a player draws 2 cards and commits 1 as their action. If the card shows a statistic
the character possesses, that stat's value is added to the total. Multiple matching statistics
each contribute.

### Passing Cards (Aid)

A player may pass a card to an ally instead of using it themselves. The passing player must still
commit their own card this turn. The ally **must** play the passed card on their next turn — it
is a gift and a commitment. **Every act of aid raises Tension by 1.**

A player may only accept **one passed card per turn**, regardless of how many allies offer one.
If multiple players attempt to pass to the same ally, only the first offer may be accepted; the
others must be used or discarded by the passing players.

### Heroic Action

A player may lay their **entire hand** on the table and claim every statistic shown across all
cards. The first card's special fuels the feat. Each remaining card is then revealed one by one
— every reveal turns the scene further against the player.

### Tension

Tension starts low and climbs as players cooperate. When Tension exceeds **5**, the scene itself
becomes hostile — cards drawn for narrative purposes add complications. Each Scenario section
describes what specifically changes when tension rises, and how to bring it back down.

### Power Focus

Using the **same power on consecutive turns** sharpens focus by 1. Focus cannot exceed the
power's mastery level. Prior Refocus actions of the power's related statistic count double
toward growth.

Focusing on one power dulls focus on all others (unless the power states otherwise). Each point
of focus beyond the first imposes a **−1 penalty to unrelated actions**. Defocus actions of the
related statistic lower this penalty by 1.

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
treatment.

The attacker's dominant relevant stat determines how difficult the hit is to avoid. The damage
type determines what it costs the defender if it lands.

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
| Jaws | Cutting + Grab | Bite deals cutting; locked grip reduces target's Speed each round held |
| Magic | Varies by element | Flame → Fire/Endu; Water → Cold/Speed; Wind → Electric/Perc; |
| | | Earth → Blunt/Might; Iron → Impaling/Might; Light → Radiant/Will; |
| | | Dark → Draining/Will; Plants → Grab/Endu |
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
play, and can be learned multiple times to increase mastery.

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
| Pig men | Digging, Hide, Camp, Smell, Sleeper, Charge, Scolding |
| Rabbits | Camp, Labyrinth, Scrounger, Hearing, Sleeper, Fur, Digging |
| Raccoons | Scurry, Camp, Relaxed, Sly, Scrounger, Clan, Control |
| Rat folk | Clan, Scurry, Climber, Sleeper, Smell, Scrounger, Control |
| Taurus | Portage, Swimmer, Charge, Labyrinth, Relaxed, Hide, Travels |
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

## Inventory and Carrying

Carrying capacity is determined by **Endurance**. Each item has a bulk value that reduces
available capacity. Negative bulk items increase capacity.

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
| Gap city | Hanging city near the shifting lands |
| Lastwater | Travel stop to the south |
| Linar harbour | Small independent harbour town |
| Raft city | On the river through the great forest |
| Rakeville | Village towards Allondo |
| Rosepond | Mining village near the world edge |
| Steadington | Village in Brumal overtaken by desert |
| World edge | Mining city near the ocean |
