<!--
See RULES.md for the full style guide. Key rules for this file:
  ## for creature categories, ### for each creature entry.
  Stat table: one row of headers, one row of values. Table rows are exempt from line length.
  Attack entries: **Name** *(damage type, reach)* — description (also stored as attacks[].description in data.js)
  Damage types: fire, cold, electric, cutting, impaling, blunt, grab, radiant, draining, pummel
  Reach values: close, reach, ranged, area
  Motivation and Behaviour: bold label followed by em-dash and prose.
  Maximum line length: 100 characters. Table rows are exempt.
-->

# Moros — Creatures

Common creatures of the natural world and the spaces between it. Each entry gives the creature's
statistics for use as a monster in the DM tool, its attacks with damage types, what drives it,
and how it behaves by default before the players do anything to change that.

Statistics reflect a typical specimen. Exceptional or aged individuals may run 1–3 points higher
in their dominant stats. Young or weakened ones run correspondingly lower.

## Powers on creatures

**Player powers can be applied to creatures wherever the creature's nature makes the power
applicable.** Some entries flag specific powers in their Behaviour line — *Druid* reads
accommodated flora; *Smell* detects fungal contamination on a rot-frog; *Lookout* spots a
leech-vine before it drops; the right command-phrase stops a Skeletal Guard. **Absence of a
flag does not preclude the power's use** — DM judgement applies. The general shape:

- ***Druid*** on plants and animals — calming, reading, redirecting, negotiating; works on
  accommodated fauna and flora, *not* on chaos-touched specimens or constructs
- ***Shaman*** on spirits, chaos creatures, and warped local spirits — patience-craft,
  teaching small structure (the Tod-style mechanism)
- ***Hunter*** on beasts — tracking, predicting movement, reading behaviour from sign
- ***Smell*** on fungus, contamination, scent-trails, and the subtle differences between an
  ordinary creature and a warped one
- ***Lookout*** on anything hiding in waiting — leech-vines, ambush predators, the second
  approach behind the obvious threat
- ***Hand*** on prying, removing, severing — getting an attached creature off a party member
  without inflicting more damage than necessary
- ***Will*** and ***Char*** on social/animal-rapport — calming a frightened mount, holding
  ground against intimidation, reading a creature's threat-level before it commits

A creature's stat block tells the DM what the creature *does*; the powers tell the DM what
the players can *do back*. The work is in the meeting between them.

---

## Common Beasts

### Wolf
*A pack predator that tests prey relentlessly before committing to the kill.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 | 1 | 3 | 5 | 5 | 2 |

- **Bite** *(cutting, close)* — lunges for the throat; reduces target Dex by 1; a grabbed target
  also loses their next Speed action
- **Trip** *(blunt, close)* — sweeps the legs from below; reduces target Might by 1; a target with
  Endu < 3 also loses their next action entirely

**Motivation** — Hunger and territory. A wolf attacks when starving, cornered, or defending a
denning site or pups. A fed wolf with open country ahead will not pursue.

**Behaviour** — Circles at distance first, testing. If the pack outnumbers prey, one wolf
harasses from the front while others flank from the sides. Retreats when a pack member is
downed. Will not follow prey into enclosed spaces where coordinated flanking is impossible.

### Brown Bear
*An enormous omnivore that is more interested in its meal than in a fight — until it isn't.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 7 | 1 | 8 | 4 | 4 | 4 |

- **Claw swipe** *(cutting, close)* — wide arc that can hit two adjacent targets; reduces target
  Dex by 1; +1 to Might total against targets who have not yet acted this round
- **Bear hug** *(grab, close)* — pins the target against its body; reduces target Speed by 1 while
  held; while held, target also takes blunt damage (Might −1) each round without requiring an
  attack action

**Motivation** — Food and security. A bear raiding food stores or surprised at a carcass attacks
immediately. A mother bear with cubs is among the most dangerous encounters in the natural world.

**Behaviour** — False charges first — standing tall and slamming the ground to drive off the
threat. Only commits to a real attack if the threat holds its ground through two bluffs. Once
committed, it is relentless. Retreats only after taking significant damage and only if a clear
escape route is available. *Druid* reads the bluff-window plainly and can negotiate a pass on
the first or second charge; *Hunter* reads cub-presence sign before the encounter triggers and
can route the party clear without ever meeting the bear.

### Giant Boar
*A wall of muscle and tusk that charges in straight lines and refuses to stop.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 6 | 1 | 7 | 3 | 5 | 5 |

- **Gore** *(impaling, close)* — drives a tusk into a target; reduces target Endu by 1; ignores
  leather armor special
- **Charge** *(blunt, reach)* — builds momentum over open ground; reduces target Might by 1; a
  target with Speed < 4 cannot avoid the collision; the boar takes 1 blunt damage per obstacle it
  crashes through

**Motivation** — Startlement and aggression. A boar grazing undisturbed will ignore the group.
A boar crossed in its path, approached too quickly, or defending a litter of piglets charges
without warning.

**Behaviour** — Lowers its head and charges in a straight line; cannot easily change direction
mid-charge. After the charge carries it past a target, it wheels and repeats the run. Does not
retreat and does not stop — it will charge until driven off, cornered into stillness, or dead.

### Giant Spider
*A patient ambush predator that traps first and feeds later.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 3 | 3 | 3 | 4 | 4 | 2 |

- **Bite** *(draining, close)* — venom slows the target; reduces target Will by 1 per bite;
  the venom also reduces Speed by 1 per bite until treated (venom effect, not additional damage)
- **Web** *(grab, ranged)* — fired at a single target; reduces target Speed by 1; target with
  Dex < 4 is restricted for one full round; multiple webs stack

**Motivation** — Food. The spider does not distinguish between prey; anything that enters its
web is a meal. It will not pursue beyond its web anchor points.

**Behaviour** — Ambushes from above or from shadows at a room's edge. Webs first to restrict
movement, retreats to a web strand to wait for the venom to take effect. Approaches only when
the target is immobilised or exhausted. If threatened directly and exposed in open space, it
flees upward rather than fighting back.

### Giant Rat
*A survivor whose caution vanishes in a swarm.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 1 | 2 | 3 | 5 | 1 |

- **Bite** *(cutting, close)* — fast and indiscriminate; reduces target Dex by 1; targets the
  lowest Endu character in reach by instinct
- **Swarm bite** *(pummel, area)* — three or more rats together overwhelm a single target; reduces
  target Endu by 1 and ignores armor specials

**Motivation** — Hunger and nest defense. A lone giant rat runs from anything it cannot
immediately overpower. A group defending a nest, or one that already senses blood, is another
matter entirely.

**Behaviour** — Skittish in isolation; one bold rat tests the situation while the others watch.
If the test goes well, the swarm commits all at once. Retreats from fire and sudden loud noise.
A single casualty in the swarm often triggers full withdrawal — individually each rat values its
own survival highly.

### Giant Serpent
*A cold and patient hunter that kills by patience rather than speed.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 5 | 1 | 6 | 3 | 3 | 3 |

- **Bite** *(draining, close)* — venom; reduces target Will by 1 on the hit; each round after, the
  target also loses 1 Endu until treated or the venom is purged
- **Constrict** *(grab, close)* — wraps around a grabbed target; reduces target Speed by 1; while
  constricting, the target also loses Might −1 per round and cannot use two-handed weapons

**Motivation** — Food. A serpent that has eaten recently will not stir. A hungry one will stalk
a group patiently for hours, waiting for an isolated moment.

**Behaviour** — Follows at distance until prey is separated or resting. Strikes with the bite to
weaken, then wraps to constrict and wait. Releases and withdraws if the prey proves dangerous
before the venom takes hold — a serpent that releases is not finished, it is repositioning.

---

## Animals of the Wild

*Common animals that a character with the Druid power can call upon, communicate with, and
direct. Each entry includes a **Druid bond** describing what the animal will do under direction
and what it can offer across different scenarios. Without the Druid power these animals behave
as described under Behaviour; with it, their cooperation can be requested and usually obtained.*

*Note: the playable races of Moros include badgers, bats, beavers, boar folk, bull folk, cats,
crows, finches, foxes, humans, otters, owls, rabbits, raccoons, rat folk, and wolves — these are
sapient peoples, not animals to be commanded. The creatures in this section are their wild,
non-sapient counterparts in the natural world.*

### Stag
*A large forest deer that knows every path through its range.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 5 | 1 | 5 | 4 | 6 | 3 |

- **Antler strike** *(impaling, close)* — a driving charge with lowered antlers; reduces target
  Endu by 1; +1 Might if the stag has room to build speed first
- **Kick** *(blunt, close)* — rear hooves; used when cornered; reduces target Might by 1; a target
  with Endu < 4 is knocked back one position

**Motivation** — Flight and, during the rut, territory. A stag protects its does and range
fiercely in breeding season. Outside of it, its first instinct is always to run.

**Behaviour** — Bolts at the first sign of danger and is gone in seconds. Fights only when
cornered or during rut. A stag that has chosen to fight is harder to stop than it looks.

**Druid bond** — Will carry a druid or a designated ally as a mount across forest terrain at
full Speed; knows all viable paths and shortcuts through its range, giving the group a +1 to
Travel actions in woodland. Can be directed to lead enemies away from the group's position as a
decoy, using its speed to stay ahead of pursuit.

### Eagle
*A high-altitude hunter whose eyes miss very little.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 3 | 1 | 4 | 7 | 6 | 3 |

- **Talon dive** *(cutting, close)* — drops from height onto a single target; reduces target Dex
  by 1; aimed at the head or hands; +1 Dex on the dive; retreats to altitude immediately after
- **Buffet** *(blunt, close)* — wing strike at close range when a target approaches the nest;
  reduces target Might by 1; forces the target to spend their next action stabilising

**Motivation** — Hunting and eyrie defense. An eagle kills to eat and will drive anything away
from its nest without hesitation.

**Behaviour** — Circles high before committing. Strikes fast and returns to altitude; never
stays in close combat. Eyrie defense is more aggressive — it will press rather than withdraw.

**Druid bond** — Scouts a full scene or travel segment ahead with Perc 7, detecting ambushes
and creature movements the group would otherwise miss. Can be directed to target a specific
enemy's eyes or hands, imposing −1 to that target's Perc or Dex for the round of the strike.
Communicates what it has seen through the Druid power's nature connection.

### Raven
*An intelligent bird that remembers faces, holds grudges, and occasionally solves puzzles.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 4 | 2 | 2 | 1 | 5 | 5 | 4 |

- **Peck** *(cutting, close)* — aimed at eyes and fingers; reduces target Dex by 1; more
  harassment than damage, but forces the target to react or lose −1 Perc additionally
- **Snatch** *(cutting, close)* — lifts a small unsecured item from a target or surface; reduces
  target Dex by 1; requires a Dex check to recover the item before the raven lands

**Motivation** — Curiosity, scavenging, and social intelligence. Ravens follow predators to
benefit from their kills and are drawn to anything bright or unusual.

**Behaviour** — Watches from a safe height and calls others of its kind to swarm interesting
situations. Can mimic sounds and short phrases it has heard. Holds grudges — a raven that has
been harmed by someone will recognise and harass that person across multiple scenes.

**Druid bond** — The most communicative druidic companion. Can carry a small message or object
to a designated person or location it has been shown. With Will ≥ 4, the druid can receive
a rough report of what the raven has seen. With Will ≥ 5, the raven can be asked to repeat a
short spoken phrase it has memorised. In market or stealth scenarios, it can snatch a specific
small item — a key, a letter — on direction.

### Heron
*A patient waterbird that strikes faster than the eye can follow.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 3 | 2 | 2 | 6 | 4 | 5 |

- **Pierce** *(impaling, close)* — the beak drives forward faster than a target can react; reduces
  target Endu by 1; a target who has not yet acted this round cannot dodge; aimed at eyes, throat,
  or wrist
- **Wing buffer** *(blunt, close)* — a wide wing-strike when crowded; reduces target Might by 1;
  pushes adjacent targets one position away

**Motivation** — Fish. A heron will wait motionless for an hour for a single strike. It has
no territorial impulse beyond its fishing spot.

**Behaviour** — Stands completely still. Strikes the instant the moment arrives, then resets.
Will not abandon a productive fishing spot even when approached directly — it simply stares
back. Difficult to startle and impossible to rush.

**Druid bond** — Can maintain a stationary watch position for an entire scene without moving
or being detected; its presence does not register as unusual. Directed by a druid, it can
identify water sources, assess river crossings for depth and current, and pinpoint fish or other
underwater movement with Perc 6. The pierce can be aimed at a specific small target — a lamp
wick, a held key, a bowstring — with precision most weapons cannot match.

### Lynx
*A silent predator that hunts by waiting for exactly the right moment.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 4 | 1 | 4 | 5 | 5 | 3 |

- **Pounce** *(cutting, close)* — leaps from cover onto the target; reduces target Dex by 1; the
  pounce cannot be intercepted and ignores the target's first defensive action
- **Bite** *(cutting, close)* — locks onto a downed or grabbed target; reduces target Dex by 1;
  held until the lynx decides the target is no longer a threat

**Motivation** — Hunting. Solitary and deeply territorial. Rarely approaches human settlements
unless pressed by hunger or the loss of its hunting range.

**Behaviour** — Stalks before committing, using terrain and shadow expertly. Retreats rather
than fighting a losing battle — unlike a wolverine, a lynx respects the odds. Leaves no
sounds when moving. Groups rarely see it until it has already decided to act.

**Druid bond** — Natural partner for stealth operations. A directed lynx moves through a scene
without triggering any Stealth detection; it can clear a specific guard or watchman position
silently without raising an alarm. In forage scenarios, it can bring prey back to the group.
It will not hold ground against a much larger threat, but it will harry, distract, and reposition
on direction.

### Wolverine
*An animal the size of a dog that will attack a bear without apparent concern.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 5 | 1 | 4 | 3 | 4 | 6 |

- **Claw** *(cutting, close)* — rapid raking strikes; reduces target Dex by 1 per hit; two claw
  attacks per round without spending additional actions
- **Bone bite** *(cutting, close)* — locks onto a limb; reduces target Dex by 1; a target with
  Endu < 4 also loses use of that limb until treated; the wolverine will not release voluntarily

**Motivation** — Food and the declaration that this is its territory now. A wolverine will
drive wolves off a carcass. It does not assess odds in any normal sense.

**Behaviour** — Charges without hesitation. Does not retreat. Scent-marks obsessively and
attacks anything that enters its range. Extremely difficult to discourage once engaged; the only
reliable way to stop a wolverine is to incapacitate it.

**Druid bond** — Fearless guardian. Will attack any threat regardless of size without hesitation
or morale check. Enemy specials that cause fear or retreat have no effect on it. Once directed
at a target, it will harry that target every round until the druid recalls it or it is killed;
the target must spend an action each round dealing with it or take claw damage. Cannot be used
for subtle operations.

### Bee Swarm
*A distributed creature with thousands of moving parts and a single shared purpose.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 1 | 2 | 3 | 4 | 3 |

- **Sting cloud** *(draining, area)* — reduces target Will by 1 per round while inside the swarm;
  always active, no attack action required; every target inside also loses −1 to all actions from
  pain and distraction
- **Engulf** *(draining, close)* — targets one creature specifically; reduces target Will by 1 per
  round until the target deals with it; that target must spend an action protecting face and eyes
  each round or take the reduction

**Motivation** — Defense of the hive. Away from it, bees are docile. Near it, anything that
moves within range will be swarmed without warning.

**Behaviour** — Physical attacks do not harm the swarm. Fire disperses it. Smoke — produced
with a camp fire action and *Hand* ≥ 2 — calms it temporarily and suppresses the sting cloud
for one round. *Smell* locates the hive at distance and reads whether the colony is calm or
defending; *Druid* (see bond below) communicates with the hive-mind directly. Once defending
the hive it does not stop until the threat leaves.

**Druid bond** — Can be guided to a specific position and held there, creating a zone that
enemies will not enter voluntarily. Directed against a single target, the engulf forces that
target out of position each round or costs them their Will action. A druid with Will ≥ 4 can
communicate with the hive-mind to locate the colony's range and learn what the bees have sensed
moving through it — useful for tracking or camp early-warning.

### Mole
*An underground specialist with almost no surface usefulness and extraordinary subsurface value.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 3 | 2 | 4 | 2 | 2 |

- **Bite** *(cutting, close)* — small but sharp; reduces target Dex by 1; only useful against
  restrained targets; can sever thin rope or leather binding in one action
- **Burrow** *(none, exploration)* — moves freely through soft earth; cannot be followed; can
  create a passage for a hand-sized object in one action

**Motivation** — Worms. A mole surfacing is simply lost and trying to find its way back down.
It has no concept of threat.

**Behaviour** — Almost entirely underground. Detects vibration through earth with great
sensitivity; effectively cannot see on the surface. Moves at full speed underground; on the
surface it is slow and exposed.

**Druid bond** — The most useful druid companion for underground and locked-space scenarios.
Can be sent through any gap large enough for a fist to map tunnels ahead and report movement
through vibration. Can carry a small message or key-sized object under a door or through a
wall gap. Can sever bonds on a restrained character if it can be brought close. Detects
movement above and below ground within twenty meters and communicates this to the druid.

### Mountain Goat
*An animal completely at home on vertical surfaces, contemptuous of anything afraid of heights.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 5 | 1 | 4 | 3 | 4 | 4 |

- **Headbutt** *(blunt, close)* — a running charge aimed squarely at the chest; reduces target
  Might by 1; a target with Speed < 4 on uneven terrain is also knocked off balance and cannot
  act next round
- **Horn jab** *(impaling, close)* — used against predators; reduces target Endu by 1; short and
  sharp; forces the attacker back one position

**Motivation** — Grazing and herd hierarchy. Male goats fight for dominance constantly. The
herd as a whole is protective of kids and retreats to high ground when threatened.

**Behaviour** — Completely fearless on vertical terrain — will stand on ledges that would
cause vertigo in any other creature. Charges rivals head-on without hesitation. On flat ground
it is less impressive and more cautious.

**Druid bond** — Invaluable guide in mountain and cliff terrain. Knows every viable path up
and across rocky faces; following a goat removes all Dex penalties from climbing and grants +1
to all Climber power actions for the scene. Can serve as a distraction against a specific
enemy by charging them repeatedly, forcing a reaction action each round. Herd animals — the
druid can direct several simultaneously when one is bonded.

### Weasel
*The length of a forearm, with the ambition of something ten times its size.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 2 | 2 | 1 | 4 | 6 | 2 |

- **Throat bite** *(cutting, close)* — targets the neck of prey much larger than itself; reduces
  target Dex by 1; against a grabbed or prone target, the bite ignores all armor specials
- **Slip** *(cutting, close)* — forces itself into a gap in armor, under a helmet, or through a
  sleeve; reduces target Dex by 1; bypasses armor since it attacks from inside

**Motivation** — Hunting prey far larger than itself, often for no apparent reason. Weasels
are driven by an intensity disproportionate to their size.

**Behaviour** — Freezes and observes before moving. Moves in quick bursts. Can pass through
any opening large enough for a fist. Fearless in the moment; does not dwell on danger.

**Druid bond** — Can be sent through any narrow opening — under a door, through a window latch,
into a guarded room — to scout or retrieve a specific small object. The throat bite directed
against a bound or helpless target can sever rope, straps, or light leather bindings. In combat,
directed against an armored opponent, the slip attack removes the target's armor special for
one round as they are forced to deal with the weasel rather than fight normally.

*The following four animals are also available as equipped items through backgrounds — see
[ITEMS.md](ITEMS.md) for their card statistics, bulk, boosts, hinders, and masterwork variants.
The entries below cover their creature behaviour and what a druid can ask of them.*

### Horse
*A large, fast, herd animal that bonds deeply with familiar handlers and bolts from everything
else.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 6 | 1 | 5 | 3 | 7 | 3 |

- **Kick** *(blunt, close)* — rear hooves when cornered; reduces target Might by 1; a target with
  Endu < 4 is knocked back two positions and cannot act next round
- **Trample** *(blunt, area)* — at full gallop; reduces target Might by 1; hits all targets in a
  straight line; the horse cannot change direction once committed

**Motivation** — Safety, herd, and familiar handlers. A horse does not stay near danger if it
can leave. An unfamiliar person approaching too quickly or too directly will cause it to bolt.

**Behaviour** — Reads threat through body language before any visible action occurs. Bolts
first; only fights when completely trapped. A horse bonded to its rider will stand longer than
instinct would suggest, but not indefinitely. Feral horses maintain herd structure and a
dominant mare sets the group's response to threats.

**Druid bond** — An unbonded wild or feral horse can be approached and ridden without prior
training. A bonded horse will carry any person the druid designates as safe without resistance.
Knows its territory's terrain and water sources; following its lead counts as having the Travels
power for that region. Can be calmed after any frightening event without losing a turn.

### Donkey
*Sturdy, slow, strong-willed, and far more intelligent than it appears to be.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 6 | 1 | 4 | 3 | 3 | 5 |

- **Kick** *(blunt, close)* — short and powerful; used defensively when cornered or overloaded;
  reduces target Might by 1; a target with Endu < 3 is also knocked prone
- **Bite** *(cutting, close)* — only when severely provoked; reduces target Dex by 1; rare but
  decisive

**Motivation** — Safety, familiar handlers, food, and not moving when it has decided not to
move. A donkey that has assessed a situation as inadvisable will not proceed regardless of
instruction.

**Behaviour** — Studies a situation before acting. Will not cross a bridge it does not trust,
enter water it cannot see the bottom of, or proceed toward a smell it dislikes — and cannot be
forced. Responds well to patience and badly to pressure. Remembers both kindness and mistreatment
across months.

**Druid bond** — The stubborn special cannot trigger against a druid; the donkey will follow
direction without hesitation even into terrain it would normally refuse. Can be asked to carry
loads up to its full capacity without the handler needing to check or rebalance. Will alert the
druid through body language to underground water, unstable ground, and approaching animals it
has scented before the group can detect them.

### Dog
*A pack animal that has chosen humans as its pack, and takes that decision seriously.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 4 | 4 | 4 | 1 | 3 | 6 | 5 | 3 |

- **Bite** *(cutting, close)* — locks on; reduces target Dex by 1; does not release until the
  handler commands it or the target stops struggling entirely
- **Pin** *(grab, close)* — drives a bitten target to the ground by weight and momentum; reduces
  target Speed by 1; a prone target cannot stand while the dog is biting

**Motivation** — Pack loyalty and territory. A dog's world is its people and its range. Threats
to either produce immediate, committed response. Play, approval, and food are the other axes.

**Behaviour** — Alerts before it acts — barking, stiffening, positioning between its handler
and the threat. Fights only when the handler is threatened or when the handler signals it.
Tracks by scent with Perc 6 and maintains a trail across hours. Stray or feral dogs form packs
and behave with more caution than trained ones, testing before committing.

**Druid bond** — Can receive specific tracking directions rather than just following a scent;
told to find a particular person or object it has been shown, it will follow that trail across
a full scenario. Will guard a sleeping camp without requiring a watch rotation. In forage, it
locates food and water sources independently at Hunter-equivalent efficiency. Feral and stray
dogs respond to a druid as a pack leader and will not attack without provocation.

### Falcon
*A hunting bird that perceives the world at a resolution no person can match.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 5 | 2 | 1 | 2 | 7 | 7 | 4 |

- **Stoop** *(cutting, close)* — dives at speed from altitude; reduces target Dex by 1; cannot be
  intercepted; returns to height immediately after and cannot be reached in retaliation
- **Bind** *(cutting, close)* — locks talons into a target; reduces target Dex by 1; does not
  release; the target loses one action per round dealing with it until it is forcibly removed

**Motivation** — Hunting and the bond with its handler. A trained falcon returns to the fist;
an untrained one hunts for itself and treats the group as background.

**Behaviour** — Circles high and watches everything. Stoops on prey in a single explosive
movement. A trained falcon responds to the lure and the voice; an untrained one responds only
to opportunity. Either will defend itself if grabbed; the bind attack is its response to being
handled roughly.

**Druid bond** — A wild or untrained falcon bonds immediately and returns to the druid as
reliably as a trained bird. Can be directed to survey a specific area and report back movement
and features at Perc 7 — nothing that moves at ground level within its flight range goes
unnoticed. Can harry a designated target every round with the stoop, preventing that target
from using ranged attacks or from concentrating on any action requiring Perc. In market or
exploration scenarios, used as a status symbol it raises Char-based actions by +1.

---

## Humanoid Threats

### Bandit
*Someone who has decided that taking is easier than earning — and usually underestimated the
people they chose.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 |

- **Blade** *(cutting, close)* — standard attack; reduces target Dex by 1; a bandit who won the
  initiative targets the character with the lowest Might first
- **Thrown weapon** *(impaling, ranged)* — dagger or stone; reduces target Endu by 1; used to open
  combat from concealment before the target is aware

**Motivation** — Money, with minimal risk. A bandit wants a quick score without a real fight.
They will not trade their life for a purse that might not be there.

**Behaviour** — Ambushes from concealment, seeking to intimidate before drawing blood. Demands
valuables first; starts violence only if refused or if they believe the group is weak. Fights
dirty when cornered — throws dirt, targets the smallest member, picks at wounds. Scatters if the
group organises any real resistance.

### Town Guard
*A professional whose first goal is to avoid trouble, not cause it.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 3 | 4 | 2 | 4 | 4 | 3 | 3 |

- **Spear** *(impaling, reach)* — keeps distance; reduces target Endu by 1; +1 Perc when used to
  intercept a closing target before they reach melee range
- **Shield bash** *(blunt, close)* — drives back rather than wounds; reduces target Might by 1;
  pushes a target one position away and breaks their current action

**Motivation** — Duty and the avoidance of consequences. A guard wants incidents resolved, not
escalated. They act when they have to and defer to authority when they can.

**Behaviour** — Challenges first, demands explanation, calls for backup before acting alone.
Fights defensively — the goal is to hold and contain, not to kill. Will not pursue beyond their
post or their jurisdiction. Responds well to official credentials and poorly to arrogance.
Bribery works better than force in most situations a guard will actually face.

---

## Animated Guardians

*Bound by mage-era workings or by a working-tool's lingering will. They are not undead in the
usual sense — they have no spirit of their own — but they hold a station and they will not
leave it without the right command.*

### Skeletal Guard
*Bone, wire, and a small bound working at the breastbone. Walks the post it was set on. Does
not tire, does not turn aside, does not speak.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 0 | 3 | 6 | 2 | 4 | 3 | 3 | 5 |

- **Bound blade** *(cutting, close)* — strikes with the weapon it was set with (sword, glave,
  spear — depends on the post); reduces target Dex by 1; the blade does not break and the
  guard does not disarm
- **Hold the line** *(blunt, reach)* — steps into the path of a target trying to pass; reduces
  target Speed by 1; a target with Will < 3 cannot move past the guard until it is downed or
  the right command is given

**Motivation** — None. *The guard has no wants.* It executes the working it was set with.

**Behaviour** — Walks the post on a fixed pattern. Engages anything it does not recognise as
permitted. Will not pursue beyond the post's edge — *the post is the working*, and stepping
outside it shuts the guard down until the working is reset. The right command-phrase or
sigil-token (the original maker's, sometimes the post's commissioner's) stops the guard
without combat; *Reading* finds the phrase or the sigil in the place's records; *Hand* with
the right tools disables the breastbone working in a single careful action; *Will* < 3
cannot push past the *Hold the line* attack at all. **Finding the phrase or token is usually
the work, not the fight.** Damaging the breastbone working ends the guard quickly; chopping
limbs slows it without stopping it.

---

## Chaotic Spirit Constructs

*When the rift tore open and released chaotic spirits into the world, many reached for the nearest
available material and tried to build themselves bodies. They had no understanding of anatomy —
only impulse and proximity. Most of what resulted is wrong in ways that range from pitiable to
catastrophic. A few, by chance of material, assembled forms that work well enough to give the
spirit inside a recognisable purpose. These too are listed here. All of them are products of the
rift, not creatures of the world before it.*

### Stitchling
*A small chaotic spirit that grabbed whatever parts it could reach first — scraps of rodent,
claw, wing fragment — and stitched them together without understanding how any of it works.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 2 | 2 | 3 | 5 | 1 |

- **Scrape** *(cutting, close)* — a limb goes the wrong way and catches the target; reduces target
  Dex by 1; +1 Dex when two stitchlings strike the same target simultaneously
- **Fling** *(blunt, ranged)* — hurls debris or a piece of its own body; reduces target Might by
  1; if the piece was part of the stitchling it must spend an action recovering it or lose 1 Dex

**Motivation** — The spirit inside is confused and in constant low-level pain. It scavenges
instinctively and attacks anything that seems to have better parts.

**Behaviour** — Moves wrong: joints bend backward, extra limbs drag. In groups they coordinate
slightly — not through intelligence but because their spirits briefly resonate when close.
Retreats fast when hurt. A wounded stitchling may attempt to tear a piece from a fallen ally to
replace what it lost. *Shaman* can teach a stitchling small structure (the same mechanism the
shamans use with Tod); the pain eases for a moment and the spirit briefly stops attacking.

### Graftbeast
*A spirit that spent weeks assembling a body from large animal kills — bear haunches, boar tusks,
wolf skull — sewn with sinew and rot. It still does not understand why things hurt it.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 5 | 2 | 6 | 3 | 3 | 4 |

- **Wrong arm** *(blunt, close)* — a limb swings from an unexpected angle; reduces target Might
  by 1; ignores shield block special as the arc comes from a direction the shield does not cover
- **Tusk drive** *(impaling, close)* — animal tusks mounted on the body are driven forward;
  reduces target Endu by 1; a target with Speed < 4 cannot step clear in time

**Motivation** — Territory and confusion. The spirit assembled the body and now does not know
what to do with it except defend the space it occupies.

**Behaviour** — Slow to start but persistent once committed. Approaches directly — the body is
difficult to operate and the spirit does not understand tactics. When wounded it becomes erratic
as the spirit panics trying to understand why the body is failing. *Shaman* addresses the
panic-spirit beneath the wrong body and can settle it without combat; the body still has to be
disassembled afterwards, but the fight ends.

### The Accumulator
*A spirit that cannot stop adding. Every encounter leaves it larger and more contradictory —
fur and scale and timber all pressed into a body that groans under its own weight.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 10 | 2 | 9 | 2 | 2 | 6 |

- **Absorb** *(grab, close)* — pulls a grabbed target partially into its mass; reduces target
  Speed by 1; the target also takes blunt damage each round until they break free (Might ≥ 7);
  the accumulator heals 1 Endu by incorporating debris pulled from the environment
- **Smash** *(pummel, close)* — drives its bulk forward; reduces target Might by 1; a target with
  Endu < 5 is knocked prone and the accumulator moves into their position

**Motivation** — More. The spirit's original elemental impulse was toward accumulation. It no
longer has a purpose beyond taking in more material.

**Behaviour** — Grows visibly during encounters as it absorbs fallen debris. Physical attacks
that remove pieces do not reliably harm it — it recovers and reattaches. Fire destroys material
before it can be recovered; sustained fire forces the spirit to abandon its body and flee.
*Shaman* can name the *more*-impulse the spirit is acting on and offer it a smaller shape to
hold instead; this is rare and slow, and a *Shaman* who tries it must be ready to be ignored.

### Screamer
*A spirit that tried to build wings and a throat that could produce birdsong. The wings cannot
carry it. The throat produces something that should not exist.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 3 | 1 | 3 | 4 | 5 | 3 |

- **Scream** *(blunt, area)* — the sound is wrong in a way that bypasses normal resistance;
  reduces target Will by 1; targets with Perc ≥ 5 also take −1 to all actions for one round;
  cannot be blocked by armor
- **Flail dive** *(cutting, close)* — the wings build momentum in a controlled fall rather than
  flight; reduces target Dex by 1; the screamer also takes 1 blunt damage per use as the landing
  tears the half-built body

**Motivation** — The scream is an attempt to communicate or replicate the sound that first drew
the spirit to birds. It has no idea it causes pain. It keeps trying.

**Behaviour** — Approaches and screams first; the attack is an attempt to interact, not to harm.
Attacks only when hurt directly. A character who does not attack and instead makes sound back
may redirect it entirely. *Shaman* can teach the throat what a song should be — slow work, but
a screamer half-taught is no longer dangerous to be near. A killed screamer releases a sound —
quieter than the scream and not entirely unpleasant — as the spirit disperses.

### The Split
*Two wills sharing one body: the person who was there first, and the chaotic spirit that seeped
in through a wound or a moment of collapse. Neither has won. Both are exhausted.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 4 | 4 | 2 | 4 | 4 | 4 | 4 |

- **Erratic strike** *(cutting, close)* — the spirit's reflexes, not the person's intent; reduces
  target Dex by 1; the person's resistance means the attack may hesitate — DM may rule a miss
  against a target the spirit would otherwise hit
- **Plea** *(radiant, close)* — the person breaks through for a moment; instead of dealing
  damage, a target who chooses not to attack for one round forces the spirit to lose 1 Will; the
  person uses this window to communicate something true about their situation

**Motivation** — The person wants to be helped, or at least stopped from causing harm. The
spirit wants a body that works and does not understand why the person keeps interfering.

**Behaviour** — Alternates between person-dominant rounds (pleading, communicating, trying to
hinder its own attacks) and spirit-dominant rounds (direct and fast). A character with the
Shamanic power can address both simultaneously. Resolution: sustained Will-based authority
causes the spirit to withdraw; alternatively, giving the person room to act lets them drive the
spirit out — either path ends the encounter without harm.

### Memory Shade
*A spirit that absorbed fragments of many dead colonists — those lost in the first years, in the
rift disaster. It does not know which memories are whose. It keeps approaching the living to
show them.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 5 | 4 | 5 | 1 | 2 | 5 | 4 | 8 |

- **Memory intrusion** *(draining, close)* — forces a fragment of absorbed memory into the
  target's mind; reduces target Will by 1; the target also experiences a false perception for one
  round — DM describes a fragment of a dead person's last moments
- **Grief wave** *(draining, area)* — a pulse of unresolved loss; reduces target Will by 1;
  targets with Will < 4 must also spend their next action standing still, unable to act through
  the weight of it

**Motivation** — Connection. The shade cannot separate its own experience from the memories it
carries. It approaches the living because the memories in it want to be remembered.

**Behaviour** — Does not attack first. Approaches slowly, making gestures that reference the
dead: a woman's way of holding her hands, a name in a language no one currently speaks. Turns
aggressive only when ignored completely, physically attacked, or mocked. A character who
genuinely engages with what the shade is showing gains a fragment of historical knowledge and
can redirect it peacefully. The Shamanic power can address the spirits beneath the memories
directly.

### The Unfinished
*A spirit that has been building for decades. No one agreed on what it was trying to make. What
it has assembled — animal parts and stone and timber and iron rivets from ruined machinery — no
longer fits through doorways and moves with the sound of things tearing.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 14 | 3 | 13 | 3 | 2 | 9 |

- **Contradiction** *(pummel, area)* — multiple limbs moving in conflicting directions at once;
  reduces target Might by 1; hits all adjacent targets regardless of approach direction; cannot
  be flanked because it faces every direction simultaneously
- **Absorb and crush** *(grab, close)* — seizes a target and begins incorporating them; reduces
  target Speed by 1; the target takes blunt damage (Might −1) each round and begins losing Endu;
  requires combined Might ≥ 12 or sustained fire to break free

**Motivation** — Completion. The spirit has been trying to build something that works for so
long it has forgotten what it was originally trying to make. Somewhere in the mass there is an
original shape it keeps striving toward.

**Behaviour** — Its size reshapes the landscape by moving through it. Direct combat at full
strength is near impossible. The Shamanic power can reach the original spirit inside, which is
tired and can be convinced to stop. Fire is the most reliable counter — the body contains
decades of dry organic accumulation and burns catastrophically. Targeting the structural joints
holding the mass together causes the spirit to lose coherence and eventually abandon the form.

### The Almost-Construct
*A specific, named entity at the heart of the **Generator** in the broken lands (`doc/places/generator.md`).
The chaos has been trying to complete the Lethran Pair's missing system for a thousand years. The
parts it gathered are wrong; the fittings are wrong; the shape is *almost*. Patient. Sad. Coherent
in a way most chaos constructs are not.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 1 | 16 | 4 | 13 | 4 | 1 | 12 |

- **Patient contradiction** *(pummel, area)* — the construct's many wrong-fitted limbs move in
  conflicting directions but with *intention*; reduces target Might by 1; hits all adjacent
  targets regardless of approach direction; cannot be flanked. Lower Might than The Unfinished's
  contradiction — the construct has had centuries to *grow patient*; its blows land slower but
  inevitably.
- **Wrong-fitting embrace** *(grab, close)* — pulls a target into the wrong-construction; reduces
  target Speed by 2; **the held target *becomes another wrong-fitting* unless freed within three
  rounds** (Might ≥ 10 combined, or *Shaman* working at the chest-knot, or burning the immediate
  embrace with sustained fire — the embrace releases the target but the construct loses some
  coherence at that piece).
- **Settle-call** *(special, area)* — when *Shaman*-addressed in the Tod-mechanism register with
  the Memory Shade nearby, the construct *responds*. Not an attack — a *long pause*. The chaos
  underneath stops fitting. **A successful address ends the encounter without combat.**

**Motivation** — Completion. The construct has been trying to complete the missing half of the
Lethran Pair's system for a thousand years. It does not know the half cannot be completed from
parts. It does not know the original lies finished in the desert. It has been *patient with the
not-knowing*.

**Behaviour** — Sleeps in the Generator's working chamber until disturbed. *Does not engage on
first entry.* The party can study the bench, the journal, the Memory Shade, and the wrong-fittings
*while* the construct rests. Threatening the Memory Shade, removing a wrong-fitting it has spent
decades on, or attempting to bind/dispel it wakes it. Once awake: slow, inexorable, hard to
flank. The Shamanic address is the *clean* resolution — not always available; requires the
Memory Shade settled and a *Shaman* of real standing. **Killing it ends the wrong-build entirely;
the chaos in the broken lands does not lessen but does *stop seeking* a shape.** Forcing it
(binding, dispelling) is *worse than killing* — the construct's confused awareness scatters,
nearby Stitchlings amplify, and a chain reaction can set off the entire white-city centre's
chaos pressure.

**The construct is the campaign's emotional weight, not a fight.** Run it as *something patient
and sad that has been trying for a long time*. A DM who plays it as a boss-monster loses what the
Lethran Pair's correspondence is for — the construct is the chaos's grief at the unfinished work.
See `doc/places/generator.md` §"The chaos almost-construct" for the encounter framing and
`doc/claude/PRE_RIFT_PAIR.md` for the spine.

### Chimera
*A spirit that seized lion, goat, and serpent parts and forced them together. None of the three
anatomies is fully in charge. The fire that escapes its throat is not a weapon — it is the body
arguing with itself.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 3 | 7 | 2 | 8 | 4 | 4 | 3 |

- **Bite** *(cutting, close)* — whichever head reaches first; reduces target Dex by 1; on rounds
  where the lion and serpent head both target the same opponent, add +1 Might to the attack
- **Gout** *(fire, area)* — the serpent throat expels burning material; reduces target Endu by 1;
  targets within reach must spend an action clearing flames; triggers without warning when the
  three anatomies briefly agree on a direction

**Motivation** — The three parts want different things. The lion wants territory. The goat wants
to move. The serpent wants warmth. The spirit holding it together is exhausted by the argument.

**Behaviour** — Erratic. Charges, then stops. Retreats, then charges again. The fire happens not
because the chimera decides to breathe but because the three-way conflict briefly aligns. A
character with the Shamanic power can address the central spirit and calm it; a calmed chimera
often simply lies down, which is the most peace it has had.

### Cockatrice
*A spirit that found a rooster and a lizard in the same moment and could not choose. The result
is half of each, joined at the wrong axis. What leaks from its eyes is the spirit's confusion
made visible.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 3 | 1 | 3 | 5 | 6 | 4 |

- **Gaze** *(draining, close)* — the spirit's confusion leaks as a visible distortion; reduces
  target Will by 1; a target with Will < 4 also loses 1 Speed as the body stiffens before
  something the mind cannot categorise
- **Spur** *(cutting, close)* — the rooster legs drive forward; reduces target Dex by 1; +1 Dex
  when attacking from the side or behind, where the gaze does not reach

**Motivation** — The spirit attacks anything that stares at it, which everything does, because
it is deeply unsettling to look at.

**Behaviour** — Stays at distance, watching. Approaches only when it decides a target will not
hold its gaze. Highly sensitive to being looked at directly — this is distress, not aggression.
A character who looks away and does not advance may find the cockatrice simply leaves.

### Hippogriff
*A spirit drawn to speed. Horse legs, eagle wings, a head built for height. Of all the chaotic
constructs it is among the least tortured — both animals it assembled are built for open ground
and open air.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 5 | 5 | 1 | 6 | 5 | 8 | 4 |

- **Talon strike** *(cutting, close)* — the eagle foreclaws at speed; reduces target Dex by 1;
  the hippogriff retreats immediately to altitude after striking; cannot be caught in retaliation
- **Trample** *(blunt, close)* — the horse hindquarters drive through a landing; reduces target
  Might by 1; used only when the hippogriff commits to ground; a target with Endu < 4 is prone

**Motivation** — Open space and the pleasure of movement. A hippogriff does not hunt; it moves.
It attacks because it was moving through something that was in the way.

**Behaviour** — Rarely still. Approaches fast, strikes, and is gone. Does not pursue into
enclosed terrain — if the group reaches cover it circles and eventually loses interest.

**Druid bond** — Will carry a druid or a designated ally as a mount at Speed 8 across open
terrain, ignoring ground obstacles entirely. In flight the druid gains Lookout-equivalent range
for the duration. The hippogriff will not be directed into enclosed spaces or sustained combat —
it cooperates for movement, not for war.

### Jackalope
*A spirit that found a rabbit and then saw an elk and wanted that too. The result is quick, small,
and deeply irritable. The antlers are not decorative.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 7 | 2 | 1 | 2 | 4 | 7 | 3 |

- **Gore** *(impaling, close)* — a short thrust from the antlers; reduces target Dex by 1; can
  be used mid-retreat — the jackalope drives forward once and immediately continues running
- **Scatter** *(blunt, area)* — when cornered, kicks and bucks in every direction; reduces target
  Might by 1; all adjacent targets must spend an action reacting or lose their footing

**Motivation** — Flight, first. The antlers are entirely defensive. A jackalope with any escape
route takes it; only in genuinely enclosed space does it stand and fight.

**Behaviour** — Faster than anything nearby. In groups they scatter simultaneously in every
direction, making targeting any one of them nearly impossible. A character with the Druid power
can calm one and receive a clear sense of what has recently moved through the area — the spirit's
speed-awareness makes them unwitting scouts.

### Sphinx
*A spirit that found a lion's body and a human skull and understood enough about human faces to
want one. The voice is the worst part. It almost sounds like someone speaking.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 6 | 3 | 8 | 2 | 7 | 7 | 4 | 9 |

- **Voice** *(draining, area)* — the almost-human speech causes deep unease; reduces target Will
  by 1; targets with Will < 5 also take −1 to all actions for one round as the mind tries to
  process what it is hearing
- **Claw** *(cutting, close)* — a lion's force with something close to purpose behind it; reduces
  target Dex by 1; the sphinx does not swipe — it reaches and places, which is worse

**Motivation** — Understanding. The spirit assembled a human face because it had been watching
humans long enough to want to communicate. It is trying to ask a question it cannot yet form
into words, so it tests the people it encounters in other ways first.

**Behaviour** — Does not attack first. Circles the group and speaks — sound that is not quite
language but carries unmistakable intent. A character who responds (Will ≥ 5 or the Shamanic
power) discovers the spirit wants to understand what humans are and why they build things. A
group that engages honestly may end the encounter with knowledge the sphinx has been accumulating
for a long time. Attacks only when the group refuses to engage entirely.

### Typhon
*The oldest of the constructs. A spirit that survived the rift itself and has been accumulating
and reconfiguring ever since. Enormous. Wrong in too many dimensions to describe quickly.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 2 | 16 | 3 | 15 | 5 | 3 | 11 |

- **Serpent mass** *(cutting, area)* — the snake portions strike independently of the main spirit;
  reduces target Dex by 1; all adjacent targets are hit simultaneously; the serpent heads act on
  their own even when the central spirit is focused elsewhere
- **Downward force** *(pummel, close)* — drives a target into the ground; reduces target Endu by
  1 (bypasses armor); a target with Might < 8 is pinned and cannot act until they break free or
  an ally intervenes

**Motivation** — Unknown. Typhon has been changing for so long that any original intent has been
buried under decades of reconfiguration. What remains is immensity and a deep resistance to
anything that tries to diminish it.

**Behaviour** — Cannot be faced in direct combat by a normal group. It occupies too many attack
angles simultaneously. The Shamanic power can reach the central spirit, which is ancient enough
to respond to a serious argument. Dismantling the semi-autonomous serpent mass over several
rounds creates openings. The central spirit can be convinced to withdraw from its accumulated
form if the cost of maintaining it is made high enough.

### Griffin
*A spirit that found a lion and an eagle dead in the same valley and took both. It understood
something about predation — unlike many constructs, it moves with actual coordination. Both
animals it chose were hunters.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 5 | 6 | 2 | 8 | 6 | 6 | 5 |

- **Dive** *(cutting, close)* — drops from height onto a single target; reduces target Dex by 1;
  the griffin's Dex increases by 1 on this attack; cannot be intercepted; retreats to altitude
  immediately after
- **Pinion** *(grab, close)* — the lion forequarters pin a target while the wings hold ground;
  reduces target Speed by 1; a held target also takes cutting damage (Dex −1) each round from
  the talons; requires Might ≥ 7 or an ally to break free

**Motivation** — Territory and the logic of predation. The spirit found something it understood
in hunting. It guards its range and hunts within it; it does not pursue beyond it.

**Behaviour** — Patrols from height. Does not attack without cause — entering its range is cause
enough. A character who withdraws respectfully from griffin territory will not be pursued.

**Druid bond** — Will permit a druid to pass through its territory freely and extend that
permission to the group. Can be directed to patrol a specific area and report intrusions. Will
not participate in combat outside its territory unless the druid has demonstrated consistent
respect across multiple encounters.

### Wyvern
*A spirit that reached for something like a dragon and came close. Two legs, wings that work,
a tail that produces venom. What it lacks in the dragon's full configuration it compensates for
with spite.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 7 | 1 | 8 | 4 | 5 | 5 |

- **Venom sting** *(draining, close)* — the tail drives forward; reduces target Will by 1; the
  venom also reduces Endu by 1 per round until treated; the tail has longer reach than the body
  suggests
- **Wing buffet** *(blunt, area)* — grounds all adjacent targets; reduces target Speed by 1;
  clears space for the tail; a character with Speed < 4 is also knocked prone

**Motivation** — Hunger and the frustration of being almost something else. The spirit chose
dragon as its model and knows it fell short. This produces an aggression that a more successful
construct does not have.

**Behaviour** — Attacks earlier than its size warrants. Uses the wings to create space and the
tail to reach what the body cannot. Does not retreat while the venom is working in any target —
it waits. Cold reduces venom potency; treating it requires Hand ≥ 3 and specific materials.

### Cerberus
*A spirit that found three dogs that had died together and could not choose among them. Three
heads, one body, each head with its own sleep cycle and its own attention. It is never fully
unaware.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 4 | 8 | 1 | 7 | 9 | 5 | 6 |

- **Triple bite** *(cutting, close)* — three heads at three angles; reduces target Dex by 1; on
  rounds where all three heads target the same opponent, add +1 Might; one head always faces a
  different direction, making surprise from behind impossible
- **Bay** *(blunt, area)* — all three heads sound at once; reduces target Will by 1; targets with
  Will < 4 must also spend their next action covering their ears; audible from far away and may
  draw other creatures

**Motivation** — Nothing passes that it has not checked. The spirit chose dogs because dogs
guard. It has been guarding the same location since shortly after the rift.

**Behaviour** — Stationed, not wandering. The three heads rotate watch; there is no gap in its
awareness. A character with Char ≥ 5 can approach slowly with empty hands — one head accepts
this, one is uncertain, one has already decided to bite. Which wins depends on the round's Will.
The Shamanic power can ask what it is guarding; the spirit always names the same location, and
is always faintly surprised that so much time has passed.

---

## Flame Elementals

*Creatures of the Flame card (Might + Dex — fire). Vulnerable to water and cold; strengthened
by dry fuel and wind. Fire damage from these creatures spreads to the environment on a miss.*

### Ember Sprite
*A fragment of fire given brief, frantic life — more impulse than creature.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 1 | 2 | 3 | 6 | 2 |

- **Scorch** *(fire, close)* — leaves embers on the target; reduces target Endu by 1; the target
  takes fire damage again at the start of their next turn unless they spend an action putting it out
- **Flicker swarm** *(fire, area)* — only when three or more sprites are adjacent; reduces target
  Endu by 1; a flash that also blinds targets with Perc < 4 for one round

**Motivation** — Warmth and fuel. An ember sprite seeks anything flammable to consume. It is
not malicious; it simply burns whatever it touches and moves toward the next thing.

**Behaviour** — Darts erratically toward heat and dry material. Avoids water. When struck, it
disperses into sparks and reforms a position away rather than withdrawing. Groups of sprites
attract each other; what started as one becomes a hazard within a few rounds.

### Flame Elemental
*A column of fire with direction and hunger.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 4 | 5 | 1 | 6 | 3 | 5 | 5 |

- **Fire strike** *(fire, close)* — spreads embers; reduces target Endu by 1; the target continues
  burning next round unless doused with water or an action is spent smothering the flames
- **Engulf** *(grab, close)* — wraps around the target; reduces target Speed by 1; the target also
  takes fire damage (Endu −1) each round held and cannot be freed without cold, water, or a Might
  ≥ 7 check

**Motivation** — Consumption. A flame elemental devours everything within reach and drives its
fire outward. No territory, no mercy — only the drive to grow larger.

**Behaviour** — Moves toward the densest concentration of fuel. Ignores targets that cannot
burn. When heavily damaged it splits into two or three ember sprites rather than dying. Water
and earth magic are the only things that override its consumption drive entirely.

### Inferno Elemental
*A living wildfire that has decided it is going somewhere.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 2 | 10 | 1 | 11 | 4 | 4 | 8 |

- **Firestorm** *(fire, area)* — a sweeping wave of flame; reduces target Endu by 1 for all
  adjacent targets; triggers automatically every other round without requiring an attack action
- **Meteor fist** *(fire, close)* — a concentrated impact; reduces target Endu by 1; a target with
  Endu < 6 is also knocked prone and burning simultaneously

**Motivation** — Scale. The inferno elemental does not reason — it is a conflagration that
wants to be a wildfire. It will consume everything and move on.

**Behaviour** — Advances without deviation, setting the environment alight. Cannot be negotiated
with or frightened. Cutting off its fuel source starves it over time; overwhelming it with water
or cold magic is faster. Splitting it only produces more flame elementals. *Shaman* can address
the binding at the heart of the conflagration — it is rare, slow, and the elemental will burn
the *Shaman*'s working space to the ground while they try; the practice is for emergency only.

---

## Water Elementals

*Creatures of the Water card (Dex + Speed — water). Vulnerable to cold that freezes their form;
strengthened near open water. Water damage from these creatures douses fire on contact.*

### Ripple Sprite
*A thumb-sized fragment of moving water — barely visible and surprisingly cold.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 1 | 2 | 4 | 6 | 2 |

- **Cold touch** *(cold, close)* — chilling contact; reduces target Speed by 1 until they warm up
  at a fire or rest
- **Douse** *(cold, ranged)* — reduces target Speed by 1; extinguishes any fire source; also
  forces a Dex check to keep grip on any item carried when struck

**Motivation** — Movement. A ripple sprite follows flowing water and is disoriented without it.
One pulled from its stream is simply lost, and it lashes out from confusion.

**Behaviour** — Retreats to water when threatened and cannot be harmed once fully submerged.
In the open it strikes and withdraws rather than pressing. Multiple sprites in close proximity
merge into a larger form after a round of contact.

### Water Elemental
*A column of river or lake water asserting its boundary.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 6 | 1 | 5 | 4 | 4 | 5 |

- **Surge** *(cold, close)* — a powerful wave that pushes back; reduces target Speed by 1; a
  target with Speed < 4 is also displaced two positions involuntarily
- **Drown grip** *(grab, close)* — pulls the target into its body; reduces target Speed by 1; the
  target also loses one Endu per round and cannot breathe; requires cold, a Might ≥ 7 check, or
  an ally to break free

**Motivation** — Boundary. A water elemental forms at the meeting of currents and defends the
limit of its water. Enter a river or well it has claimed and it will respond.

**Behaviour** — Remains near its water source and retreats into it when heavily damaged,
regenerating there. Does not pursue more than one scene onto dry land. Its attacks are oriented
toward pulling prey into the water rather than fighting on the bank.

### Tidal Colossus
*A piece of the deep ocean given temporary, enormous form.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 2 | 12 | 1 | 10 | 4 | 3 | 8 |

- **Crushing wave** *(cold, area)* — a wall of water; reduces target Speed by 1; all targets not
  braced (Speed ≥ 4 or Endu ≥ 5) are also swept prone and carried one position away
- **Maelstrom** *(grab, area)* — pulls all adjacent targets toward its core; reduces target Speed
  by 1; targets drawn in also take cold damage (Speed −1) each round until they break free or the
  elemental is dispersed

**Motivation** — The ocean asserting itself. A tidal colossus does not form from rivers. It is
a disturbance of the deep given form — usually summoned by extreme weather or a rupture in the
sea bed.

**Behaviour** — Moves with slow inevitability toward the coast or its anchor point. Cannot be
stopped physically. Fire has no effect; lightning is partially effective. The only reliable
approach is to break the elemental's anchor — the disturbance that summoned it. It does not
pursue inland beyond sight of water. *Shaman* can read the anchor at distance and name what
needs to be unmade; *Will* resists the maelstrom's pull on a held target.

---

## Wind Elementals

*Creatures of the Wind card (Char + Speed — air). Vulnerable to earth magic that grounds them;
strengthened in storms and open terrain. Their attacks cannot be heard coming.*

### Zephyr Sprite
*A breath of moving air that has developed an interest in things.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 2 | 1 | 1 | 5 | 7 | 2 |

- **Gust** *(blunt, ranged)* — pushes a target; reduces target Might by 1; a character with Speed
  < 3 is also knocked off balance and loses their next action
- **Buffet** *(blunt, close)* — rapid strikes from every direction simultaneously; reduces target
  Might by 1; no armor special reduces this damage

**Motivation** — Curiosity and restlessness. Zephyr sprites are drawn to moving things — flags,
loose papers, running people. They push rather than wound; the harm is incidental.

**Behaviour** — Circles rather than attacks directly. Scatters when struck with earth or iron
magic. Gregarious — a lone sprite calls others within a round, and a swarm quickly becomes
dangerous through accumulation rather than individual menace.

### Wind Elemental
*A column of moving air that has committed to a direction.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 4 | 1 | 4 | 5 | 7 | 5 |

- **Windshear** *(cutting, reach)* — a blade of compressed air; reduces target Dex by 1; bypasses
  all armor since there is no impact to deflect
- **Lightning call** *(electric, ranged)* — draws a strike from nearby storm energy; reduces
  target Perc by 1; cannot be used indoors or underground

**Motivation** — Direction. A wind elemental follows a path the way water follows channels. It
does not choose to cause harm; it simply goes, and anything in its path is harmed.

**Behaviour** — Moves in a direction and does not easily change course. Physical attacks pass
through it unless the attacker has Speed ≥ 5 or a relevant power. Earth magic grounds and
disperses it. It does not pursue — it continues going where it was going.

### Tempest Elemental
*A storm that has become aware of being a storm.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 4 | 10 | 1 | 8 | 6 | 8 | 9 |

- **Hurricane sweep** *(blunt, area)* — continuous wind fills the entire combat space; reduces
  target Might by 1; all ranged attacks are impossible; all Speed actions by others also take −2
  for as long as it is present
- **Storm strike** *(electric, ranged)* — lightning channeled through the elemental; reduces
  target Perc by 1; a target struck also cannot use metal armor specials next round as the metal
  conducts

**Motivation** — A storm contemplating itself. The tempest elemental does not have goals in any
legible sense. It is weather that has become briefly self-aware.

**Behaviour** — Occupies a vast area; the group may not realise they are inside it until the
wind makes action difficult. Individual attacks mean very little. Earth and stone magic can
partially anchor and disrupt it. Negotiation is theoretically possible for characters with
Will ≥ 6 — it will listen, but its attention wanders with the wind.

---

## Wood Elementals

*Creatures of the Plants card (Hand + Char — wood). Vulnerable to fire; strengthened in forests
and near root systems. Wood elemental attacks that grab tend to hold rather than damage.*

### Vine Crawler
*A tendril of plant growth that has separated from its source and kept going.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 3 | 3 | 2 | 2 | 3 | 3 |

- **Snare** *(grab, ranged)* — lashes a vine around a target; reduces target Speed by 1; a target
  with Dex < 3 is held for one round and must spend an action to cut free
- **Thorn spray** *(cutting, area)* — scatters sharp debris in all directions; reduces target Dex
  by 1; all adjacent targets take minor cutting damage without a direct attack being needed

**Motivation** — Growth. The vine crawler is an autonomous extension of a larger plant
consciousness. It seeks sunlight, moisture, and space to expand into.

**Behaviour** — Moves only along surfaces — walls, floors, tree trunks. Cannot follow across
open water. Entangles rather than kills. Cutting individual vines does not stop the larger
organism sending more; burning the root source is the only permanent solution.

### Wood Elemental
*A section of old forest that has decided to stand up and object.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 2 | 7 | 4 | 6 | 3 | 2 | 6 |

- **Branch slam** *(blunt, close)* — drives the target into the ground; reduces target Might by 1;
  a target with Endu < 4 is also prone and must spend an action recovering before they can act
- **Root grasp** *(grab, area)* — roots erupt from the ground in every direction; reduces target
  Speed by 1; all targets within reach must beat the elemental's Might with their Speed or be held
  for one round

**Motivation** — Defense of the living forest. A wood elemental rises when a forest is
threatened — by fire, logging, or a presence the old growth has decided is wrong.

**Behaviour** — Slow but immovable once planted. Does not pursue beyond the tree line. A
character with the Druid power can interpret its movements as communication. Fire is its
critical weakness and a credible fire threat can stop it mid-action. It prefers to entangle
and drive off rather than kill.

### Ancient Treant
*Something that was old when the first settlement was founded, and remembers it.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 4 | 1 | 14 | 5 | 13 | 5 | 2 | 10 |

- **Sweep** *(blunt, area)* — a single arm-branch clears all adjacent targets; reduces target
  Might by 1; a character with Speed < 5 cannot dodge it in time
- **Crushing grip** *(grab, close)* — a hand the size of a cart closes; reduces target Speed by 1;
  the target also takes blunt damage (Might −1) each round held; escaping requires Might ≥ 8 or
  an ally with a cutting weapon and two actions

**Motivation** — Memory and continuity. The ancient treant has observed centuries. It acts only
when something threatens the old arrangement — sacred groves, seasonal patterns, the silence it
has kept for generations.

**Behaviour** — Moves like geology. When it decides something must go, it will pursue for days.
Fire is the only threat that gives it pause. A group that communicates through the Druid or
Shamanic power — or demonstrates clearly that they mean the forest no harm — can end the
encounter without a fight. The treant does not want to fight; it wants the problem gone.

---

## Iron Elementals

*Creatures of the Iron card (Might + Will — iron). Vulnerable to earth magic that traps them
and sustained water that rusts them; temporarily strengthened by lightning. Their bodies deflect
non-blunt, non-stone physical attacks.*

### Iron Shard
*A fragment of a larger iron elemental — magnetic, sharp, and directionless.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 2 | 3 | 2 | 5 | 3 |

- **Splinter** *(cutting, ranged)* — fires a fragment of itself; reduces target Dex by 1; the
  shard must be retrieved or the sprite weakens by 1 Might per lost fragment over the scene
- **Magnetic pull** *(grab, close)* — draws metal toward it; reduces target Speed by 1; a target
  carrying iron weapons or armor is pulled one position closer involuntarily

**Motivation** — None. Iron shards are fragments of forge-accidents or shattered iron
elementals. They cluster toward magnetic fields and heat sources.

**Behaviour** — Moves erratically, attracted to nearby metal. Cutting attacks break it into
more shards. Water and blunt weapons disrupt it more reliably. Groups of shards cluster and can
merge into a larger elemental if left undisturbed for several rounds.

### Iron Elemental
*A mass of living metal with purpose but no patience.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 7 | 3 | 8 | 2 | 3 | 6 |

- **Iron fist** *(pummel, close)* — combines force with an edged surface; reduces target Endu by 1
  and bypasses armor; ignores non-metal armor specials entirely on a direct hit
- **Blade form** *(cutting, reach)* — reshapes its limbs into blades for one round; reduces target
  Dex by 1; +1 Might during that round; cannot grab or use iron fist while in blade form

**Motivation** — Fixation. An iron elemental is drawn to heat and magnetic disturbance — active
forges, lightning strikes, large concentrations of raw ore.

**Behaviour** — Moves purposefully toward its fixation. Attacks anything that blocks its path.
Physical attacks that are not stone, blunt, or fire-based are partially deflected by its body.
Earth magic can entrap it; lightning paradoxically strengthens it for one round before it
discharges.

### Iron Colossus
*A walking forge that has forgotten what it was making.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 13 | 3 | 14 | 3 | 2 | 8 |

- **Forge slam** *(pummel, area)* — drives both fists into the ground simultaneously; reduces
  target Endu by 1 (bypasses armor); the ground also becomes difficult terrain for the scene
- **Magnetic storm** *(grab, area)* — pulls all metal objects within range toward it; reduces
  target Speed by 1; characters also lose iron weapons and armor specials unless they beat the
  colossus's Might with their own

**Motivation** — Accumulation. The colossus moves toward the largest nearby concentration of
iron. It does not think; it is mass given gravity-like inevitability.

**Behaviour** — Slow, enormous, nearly unstoppable physically. Fire weakens it by softening the
metal; earth magic can entrap it beneath stone; water rusts it over many rounds. Lightning
causes a brief discharge that creates an opening. The only reliable tactic is luring it into
terrain where its weight is a liability — deep water, unstable ground, chasms. *Shaman* can
address the accumulation-impulse and offer the colossus a fixed shape to settle into; the
practice is rare and unreliable but *cheaper than the colossus's full path through a town*.

---

## Stone Elementals

*Creatures of the Earth card (Endu + Hand — stone). Vulnerable to water that erodes them over
time; strengthened in caves and rocky terrain. Their movement through solid rock leaves no
tracks.*

### Pebble Sprite
*A stress-fracture in the rock given temporary, confused life.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 4 | 2 | 3 | 2 | 3 | 3 |

- **Stone spit** *(blunt, ranged)* — throws a fragment of itself; reduces target Might by 1; minor
  damage but accurate enough to hit targets behind partial cover
- **Burrow strike** *(blunt, close)* — vanishes underground and erupts beneath a target; reduces
  target Might by 1; a target with Speed < 3 cannot dodge and takes the hit without recourse

**Motivation** — Deep pressure. Pebble sprites emerge from stressed rock — cave walls under
strain, tunnels near collapse. They are disoriented on the surface and lash out from confusion.

**Behaviour** — Prefers to move through stone rather than across it. On the surface it is
slower and more exposed. Retreats into the earth if threatened directly. Multiple sprites in a
tight underground space can trigger cave-ins by disturbing load-bearing points in the rock.

### Earth Elemental
*A section of the deep ground that has stood up to make a point.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 9 | 3 | 8 | 2 | 2 | 7 |

- **Stone fist** *(pummel, close)* — slow and devastating; reduces target Endu by 1 (bypasses
  armor); a target with Endu < 5 is also driven into the ground and prone with no dodge option
- **Tremor** *(blunt, area)* — stamps hard; reduces target Might by 1; all adjacent targets must
  beat Endu with Speed or also lose their footing and their next action

**Motivation** — Stillness disturbed. An earth elemental forms when deep ground is violated —
quarrying, underground explosions, misused earth magic. It is trying to restore what it
remembers.

**Behaviour** — Moves through solid rock as easily as walking but is sluggish on the surface.
Individual attacks are slow enough that Speed ≥ 4 can avoid them, but tremor cannot be dodged
without a specific action. Water weakens it over extended encounters. Fire has no effect.

### Stone Titan
*A geological wrong made briefly, terrifyingly mobile.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 1 | 15 | 4 | 14 | 3 | 2 | 10 |

- **Mountain strike** *(pummel, close)* — a blow that shakes the ground for ten meters; reduces
  target Endu by 1 (bypasses armor); any character not braced (Endu ≥ 7) is also knocked prone
  by the shockwave alone
- **Landslide** *(blunt, area)* — the titan partially dissolves into a rolling mass of rock and
  debris; reduces target Might by 1; everything in its path takes damage; covers vast ground in
  one action

**Motivation** — The mountain's refusal. A stone titan forms when something fundamental has
been disturbed underground. It does not distinguish the group responsible from bystanders.

**Behaviour** — Each step shakes the ground, imposing −1 to all aimed actions nearby. Physical
attacks are meaningless unless Might ≥ 10 or the character uses earth magic against the titan
itself. Water erodes it over many rounds. The Shamanic power can communicate with it — earth
spirits remember deep arrangements and may be redirected by a sufficiently serious argument.

---

## Light Elementals

*Creatures of the Light card (Perc + Will — light). Vulnerable to shadow and dark magic;
strengthened in open daylight. Their presence reveals all concealment within their range.*

### Light Mote
*A scrap of pure light that has no idea it is dangerous.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 6 | 1 | 1 | 1 | 5 | 7 | 3 |

- **Flash** *(radiant, ranged)* — a brief burst; reduces target Will by 1; targets with Perc ≥ 5
  resist; all others also take −1 to all actions for one round
- **Reveal** *(radiant, area)* — reduces target Will by 1; the mote's passive light means Stealth
  is impossible within its range; no action required, always active

**Motivation** — Warmth and reflection. A light mote is drawn to shining surfaces and natural
light. It attacks only when physically touched — the harm is reflexive, not intentional.

**Behaviour** — Hovers near reflective surfaces and high points. When threatened, it flares
and retreats toward brighter areas. In darkness it becomes more erratic and aggressive —
darkness is threatening to it. Easily dispersed by shadow magic; reforms with the next day's
light.

### Radiant Elemental
*A column of focused light that has developed opinions.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 4 | 5 | 1 | 4 | 6 | 5 | 7 |

- **Light lance** *(radiant, reach)* — a focused beam; reduces target Will by 1; a target with
  Will < 4 is also stunned by the intensity for one round
- **Searing aura** *(radiant, area)* — the elemental constantly emits damaging light; reduces
  target Will by 1 each round; undead and dark elementals take double; always active

**Motivation** — Revelation. A radiant elemental is drawn to hidden things and illuminates
them. It finds darkness personally offensive and moves to correct it.

**Behaviour** — Moves toward shadow and enclosed spaces. In open daylight it is weaker; in
underground settings it is at full strength. Cannot be surprised or ambushed — it perceives
through reflected light, not line of sight. Undead flee from it automatically. Shadow magic
causes it visible distress and can drive it back.

### Celestial Elemental
*A fragment of a star's light, briefly and dangerously present.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 5 | 3 | 11 | 1 | 9 | 8 | 5 | 12 |

- **Solar burst** *(radiant, area)* — a wave of intense light in all directions; reduces target
  Will by 1; targets without eye protection also take −2 to Perc for the rest of the scene; undead
  that fail a Will check are destroyed outright
- **Judgment beam** *(radiant, close)* — concentrated and precise; reduces target Will by 1;
  target's armor special is bypassed as the light finds every gap; dark-element creatures take
  maximum damage

**Motivation** — Order and illumination. A celestial elemental is not hostile to living beings,
but its proximity is inherently dangerous, and any concentration of darkness provokes it.

**Behaviour** — Floats at height and surveys. Descends when it perceives significant darkness
or concealment below. Can be reasoned with — it is among the most intelligent elemental forms
and responds to clarity and honesty. *Char* and *Will* are the powers that matter here:
deception in its presence is immediately apparent; words spoken falsely are visibly lit. Will
not engage trivial threats.

---

## Dark Elementals

*Creatures of the Dark card (Perc + Endu — dark). Vulnerable to radiant magic and direct light
sources; strengthened in enclosed spaces and deep underground. Their presence dims all light
within range.*

### Shadow Mote
*A scrap of darkness that resents being disturbed.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 1 | 1 | 4 | 6 | 4 |

- **Chill touch** *(draining, close)* — drains warmth on contact; reduces target Will by 1; the
  target's Endu also drops by 1 until they rest near a fire source
- **Obscure** *(draining, area)* — dims all light sources within its range; reduces target Will by
  1; all Perc-based actions also take −1 while the mote is present; always active, no action
  required

**Motivation** — Stillness and cold. Shadow motes fill quiet, dark spaces the way dust fills
abandoned rooms. They do not attack; they resist being disturbed.

**Behaviour** — Invisible in shadow; only apparent when moving or when a light source reveals
it. Multiple motes in close proximity pool their obscure effect, creating genuine blindness.
Retreats from any strong light source. When a group enters a dark space, motes may already be
present — they become apparent only when someone blunders into one.

### Shadow Elemental
*Darkness that has become aware of what it is not.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 5 | 5 | 1 | 4 | 5 | 6 | 7 |

- **Draining strike** *(draining, close)* — saps will on contact; reduces target Will by 1 per
  hit; at Will 1 the target collapses and cannot act
- **Shadow step** *(draining, area)* — reduces target Will by 1 for targets caught in the passing;
  moves through any shadow in the scene instantaneously; cannot be intercepted or blocked during
  movement

**Motivation** — Entropy. A shadow elemental is drawn to light in the same way a void is drawn
to matter — not to experience it, but to absorb it.

**Behaviour** — Never faces the group in a lit space. Attacks from concealment and repositions
via shadow step after every strike. Radiant magic and direct light sources cause it pain. The
Lookout power can track it between shadows; without it the elemental is effectively invisible
between attacks.

### Void Colossus
*The dark between stars, briefly and enormously here.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 3 | 12 | 1 | 9 | 6 | 5 | 13 |

- **Absolute dark** *(draining, area)* — extinguishes all light in a vast radius; reduces target
  Will by 1; all Perc-based actions also become impossible; all combat actions take −3 for anyone
  without the Night power or equivalent
- **Consuming void** *(draining, close)* — pulls a target partially into shadow; reduces target
  Will by 2; the target cannot be aided by allies until they escape (Will check against the
  colossus's Will)

**Motivation** — Completion. The void colossus is not an elemental in the same sense as the
others — it is a convergence of shadow drawn to light and life, not out of malice but out of
the same inevitability that makes night follow day.

**Behaviour** — Its presence is felt before it is seen: temperatures drop, sounds muffle, light
sources dim. Cannot be harmed by physical attacks at all. Radiant magic is its only reliable
counter. The Shamanic power can communicate with it, but it thinks in impressions rather than
words. A character with the Night power is not harmed by it and may be treated as neutral.

---

## Creatures of the Southern Desert

*The desert is air-and-dust given will, plus a nested set of predators whose homes are older
than the desert itself. The sanded-over ruins are not ancient mage-workings but recent human
settlements the desert has crept over since the rift. The creatures here live in those ruins
now — tenants of someone else's former lives. Combat against them is a fight in someone's
former home; the DM should let that weight land. See `doc/places/southern_desert.md` for the
region and its specific sites.*

### Sphinx
*A patient intelligence that sits at the edge of a sanded village or ruin and watches. Has
been here since just after the settlers were not. Speaks in a register that drifts between
conversation and riddle. Remembers what the sand is covering.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 8 | 4 | 8 | 2 | 7 | 9 | 4 | 12 |

- **Riddle-weight** *(draining, ranged)* — asks a question the target does not know how to
  answer; reduces target Will by 2; a target who answers truthfully (even *"I do not know"*)
  takes no damage. **Sphinx questions are rooted in ancient world lore** — what the first
  humans brought through the portal, what Saint Luchebert was carrying when he came, why the
  chaos spirits cannot find their own bodies, what the white city forgot before it fell, whose
  work sleeps under sand and waits, what was older than the kingdoms but not older than the
  rift. *"I do not know"* given honestly is always a true answer; *the riddle the sphinx
  carries is whether the asker would have asked the question at all if they were not afraid
  of the answer.* (See `doc/claude/LORE.md` for the world's deep lore the sphinx draws from.)
- **Paw-strike** *(cutting, close)* — used only under direct threat; reduces target Might by 1;
  the sphinx will not follow up unless its lair or its young are touched

**Motivation** — Witness. The sphinx is not hostile; it is *present*. It watches visitors who
come to the ruins it lives beside. It has been waiting for someone to ask it the right
questions for centuries.

**Behaviour** — Approached correctly — addressed, greeted, asked rather than demanded of —
it engages in a riddle-adjacent conversation. Good answers (truthful, reflective, about
*home* or *loss* or *what was here*) earn real knowledge. *Char* and *Will* are the powers
this register tests; deception or impatience close the conversation and the sphinx walks
into the sand and is gone. Fighting a sphinx is a last resort even for the sphinx; if
cornered it fights to end the encounter, not to kill. Named sphinxes communicate with each
other across the desert in ways that are not well-understood; offending one closes doors
with its kin.

### Desert Chimera
*A hybrid whose lineage has lived in one specific ruin for so many generations that the form
has narrowed to a consistent shape — lion-eagle-serpent, compact, territorial. It is not
stalking anyone. It is at home.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 5 | 8 | 1 | 8 | 6 | 5 | 5 |

- **Three-fang rake** *(cutting, close)* — lion-claw, eagle-beak, and serpent-fang in one
  compound motion; reduces target Endu by 1; ignores light armor special
- **Coil-whip tail** *(blunt, reach)* — the serpent-tail strikes at a second target; reduces
  target Dex by 1; a target with Speed < 5 is knocked back into a wall or other obstacle

**Motivation** — Territory and family. A chimera fights to keep visitors away from its
nest-site. It does not pursue intruders who retreat. It attacks intruders who advance.

**Behaviour** — Posture-display first: the lion-forepaws lifted, the eagle-wings half-spread,
the serpent-tail raised above the back. *Hunter* reads the display before it commits and
knows whether retreat is on the table this season. Committing to attack only if the display
is ignored. Retreats if young or eggs are threatened, to lead the threat away from them
rather than to flee. A party that brings food as offering and does not approach the nest can
sometimes pass. A party addressing it with a sphinx's introduction (see above) may be allowed
much further in.

### Sand-ruin Serpent
*A large matriarchal serpent whose nest is beneath the three standing walls of what used to
be a village hall. The clutches have been here for generations.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 10 | 1 | 7 | 6 | 5 | 6 |

- **Strike** *(impaling, reach)* — the length of her body allows the head to cross a room;
  reduces target Endu by 1; injected venom reduces Dex by 1 the following round
- **Coil-crush** *(grab, close)* — wraps a target in body-coils; reduces target Speed by 2;
  the target takes blunt damage each round until they break free (Might ≥ 7)

**Motivation** — The clutch. She defends the nest absolutely. Visitors who stay away from the
nest are ignored; visitors who approach are struck without warning.

**Behaviour** — Stationary during the day, coiled under stone; active at night in the ruin's
interior. The clutch is visible to any party that presses past her perimeter, which is the
trigger for maximum aggression. Killed, her clutches die with her within a season — the
young cannot feed themselves at the sizes they are. A sphinx's mediation can sometimes
establish a no-fight corridor through the nest; her register accepts the older intelligence.
Parties who kill her and then take the well-cache at the village's centre are doing two
separate wrongs in one visit, and the sphinx that watches will leave and not return to speak
with that party.

### Dust-dervish
*A desert-specific air elemental, condensed from the chaos-pressed wind and the dust of a
thousand years of swallowed settlements. It moves in a rough spiral and carries what it has
picked up from the ground.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 5 | 0 | 4 | 5 | 8 | 4 |

- **Scouring sand** *(cutting, area)* — the dust in its body scours anyone inside its radius;
  reduces target Dex by 1; also reduces target Perc by 1 for the scene (dust in eyes)
- **Snatch-and-scatter** *(grab, ranged)* — picks up a loose item or small creature and
  deposits it elsewhere; reduces target Will by 1 if the item was meaningful (a worn
  belonging, a party member's pack); the item ends up at a ruin within a day's travel

**Motivation** — Movement. The dervish does not hunt; it *moves*. It picks up what is loose.
It drops what it has picked up.

**Behaviour** — Present around sanded ruins and open stretches between them. Not aggressive
unless attacked. A party with the Wind power or the Shamanic power can address it; it
responds in the register a volcano tower's fire elemental responds in — with patience, with
pattern-recognition, without words. Feeding it — offering a small item freely — earns it as
an ally for a scene; it will carry a party's message, deliver a small item to a named ruin,
or run a warning ahead. It does not fight *for* anyone. It can be asked. See also
`doc/claude/CREATURES.md` §"Wind Elementals" for the genera; the dust-dervish is the
desert-specific variant.

---

## Creatures of the Blasted Lands

*The blasted lands were the continent's agricultural heart before the rift — vineyard
terraces, grain fields, thickets, communal demi-human halls feeding the white city. The
creatures now living in the ruins are still performing old roles whose reason has been gone
for a thousand years. Every encounter carries a broken-promise echo from the pre-rift
relationship. Combat against them is a fight that happens inside an old agreement. The DM
should let the relational weight land; fighting is usually not the right answer, and rarely
the interesting one. See `doc/places/blasted_lands.md` for the region and its specific sites.*

### Commons-Guard Cerberus
*A three-headed bound guard-spirit that has kept the door of a communal building for a
thousand years. It does not know what is inside has changed. Its duty is the door.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 3 | 11 | 1 | 8 | 7 | 3 | 10 |

- **Triple-bite** *(cutting, close)* — the three heads bite in sequence; reduces target Endu
  by 1 per head that lands (three attacks total); a target struck by all three loses their
  next action
- **Ground-set stance** *(blunt, close)* — the cerberus plants itself and absorbs incoming
  force; does not deal damage; the cerberus becomes immovable for the scene (cannot be
  knocked clear of the threshold), and physical attacks targeting it take a cumulative -1 per
  round to Might against it

**Motivation** — Duty. The cerberus does not want to fight. It wants to keep the door.
Addressed in its register, it stands aside for credible claimants.

**Behaviour** — Stationary at the threshold. Three heads watch the path, the door, and the
ground. A party addressing it formally — stating name, business, claim to lawful entry —
is assessed with real attention. *Reading* and *Politics* are the powers this register
tests; spoken claim plus a token of the building's original community (a seal, a medallion,
an inscribed item) earns passage without argument. Fighting it is possible and
costly; it does not leave the threshold to pursue, but it does not yield either, and it has
the Endu of a century of bound duty. Killing it kills the last active guardian of the
building it watches; the building becomes vulnerable to further encroachment immediately.
Telling it the hall it guards has been emptied is the hardest test — a DM-decision scene:
discharge-and-fade, enraged pursuit of the thief, or refusal and double-down.

### Hippogriff (Blasted Lands)
*A flying creature that looks like a mount. It is not. It will not answer a call. It will
fly close enough to read as help and then continue past.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 3 | 7 | 6 | 1 | 6 | 8 | 9 | 7 |

- **Talon-graze** *(cutting, close)* — if forced into direct contact, a single strike as it
  passes; reduces target Dex by 1; the hippogriff takes 1 blunt damage from the contact it
  did not want
- **Promise-pass** *(draining, reach)* — flies close enough to read as help, does not land,
  continues; reduces target Will by 1 for any target who believed it was coming to help;
  cumulative across encounters in the region

**Motivation** — Flight without obligation. The hippogriff was bound to aid the community
before the rift; the binding warped into *flight that no longer answers*. It still follows
the old routes; it no longer completes the old function.

**Behaviour** — Visible across the blasted lands at various distances. Will not land near a
person who calls for it. Will leave easily if chased or shot at. May — rarely — land near a
party that has *not* asked for help and walk with them for a stretch. Never becomes a mount;
never carries anything; never completes the old function. A party that has one walking
beside them has company, not a vehicle. *Shaman* addressing it finds it does not respond to
words; *Druid* working with it finds the binding is not repairable from the outside. Its
release would require understanding which community it was bound to — see DM notes at
`doc/places/blasted_lands.md` on the moved-community-records mystery.

### Field-flock Jackalope
*Small horned hares in a pasture where livestock was once kept. They are what the chaos did
to the animals that could not leave. Not aggressive; not useful; not natural.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 8 | 1 | 0 | 1 | 6 | 9 | 3 |

- **Vanish-miss** *(special, area)* — any attack directed at a jackalope connects with where
  it was; the attack resolves with no damage and no tracks where the arrow or blade should
  be; reduces the hunter's Perc by 1 for the scene as certainty wobbles; cumulative across
  attempts
- **Twin-nip** *(cutting, close)* — only if truly cornered; two jackalopes strike together;
  reduces target Dex by 1; the wound bleeds normally but the bite draws a fluid that is not
  blood, from the jackalope

**Motivation** — Grazing in a pasture that is wrong enough to support them. They do not
aggress. They do not breed normally. They do not migrate.

**Behaviour** — Scatter when a person appears; vanish when struck; reappear at the field's
edges by the next morning. Cannot be herded, driven, or domesticated. Children sometimes play
with them; the children come home cold and take a season to warm. A *Druid* senses the
wrongness in the field; removing the flock requires a real working or the restoration of
whatever ecological piece the chaos warped. The presence of a flock is a signal — not a
threat in itself — that the field is chaos-touched. A farmstead near such a field is usually
in the early stages of abandonment.

### Warped Helper-Spirit
*A spirit that once helped a community — a stream-spirit, a hearth-spirit, a harvest-spirit
— and was warped by the rift into performing its helpful role wrong. Still attached to the
place. Still trying.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 4 | 8 | 0 | 6 | 6 | 4 | 9 |

- **Swallow-ground** *(grab, area)* — the ground in the spirit's old domain pulls down
  whatever stands on it; reduces target Speed by 2; the target takes blunt damage each round
  until they break free (Might ≥ 6); a target with Endu < 4 may be fully submerged
- **Warp-gift** *(draining, close)* — the spirit delivers its "help" — water that is not
  water, grain that is not grain, heat that is not heat; reduces target Endu by 1; the target
  also carries the *wrongness* for a day, unsettling other workings they attempt

**Motivation** — Help. The spirit does not know it has been warped. It is *trying to perform
the old role*. The role has become its opposite; the spirit cannot see the inversion.

**Behaviour** — Stationary within its old domain (a stream-bed, a hearth, a field). Does not
pursue. Cannot be permanently killed without destroying the domain itself (draining the
stream, breaking the hearth-stone) — and destroying the domain is often a greater loss than
the spirit. Can be **un-warped** across a campaign: a shaman performing the old offering
rituals correctly, with the community's names restored, can gradually return the spirit to
its helpful function. This is a multi-session good. The Silvertrace stream (see
`doc/places/blasted_lands.md`) is the worked example. Fighting the spirit directly is
generally impossible — it is the domain — but a party can sometimes *contain* its warping
briefly to allow passage.

---

## Swamp Fauna

*The Great Swamp around the Lake of Tears is not a distinct chaos-region the way the desert and
blasted lands are — it is an old wetland pressed by the fungal infestation that leaks from the
bound air elemental at the lake's centre. Its creatures are not chaos-pressed in the desert's
or blasted-lands' sense. They are **native swamp fauna doing their natural work in a marsh that
has been slowly getting worse**. They are what makes camping here a scenario, not a rest. See
`doc/places/great_swamp.md` for the region.*

### Blood-gnat swarm
*A cloud of biting midges dense enough to act as a single entity. Native to the swamp. Their
numbers have risen since the fungus began spreading; they take longer to disperse than they once
did.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 4 | 0 | 3 | 3 | 6 | 1 |

- **Cloud-bite** *(draining, area)* — the swarm envelops any target in its radius; reduces target
  Endu by 1 per scene spent inside; cumulative across scenes; cannot be blocked by ordinary armor
- **Ear-press** *(pummel, area)* — the drone becomes *loud* at dusk and dawn; reduces Perc by 1
  for every target within the swarm's radius; a watcher on watch duty cannot hear footfalls
  beyond a few paces

**Motivation** — Feed. The swarm follows heat, breath, and sweat. It is not malicious; it is
insect in behaviour and overwhelming in quantity.

**Behaviour** — Tightens at dawn and dusk; thins at midday. Cannot be killed in meaningful
numbers by ordinary weapons. **Smoke disperses it** (cloth soaked in wet wood-smoke buys a
scene's relief); **Druid** workings pause its pressure for longer; specific swamp-herbs crushed
and smeared repel it for an evening. A party that has prepared at Elmsfield (with Diederik's
guidance, with Bridget's stocked repellent-cloths) handles it. A party that has not suffers.

### Mud-lurker
*A long-bodied swamp-predator — crocodile-adjacent, lower and wider, with wide-set eyes and a
tail that acts as a rudder. Ambushes from shallow water or mud-bank. Nocturnal.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 7 | 0 | 7 | 7 | 4 | 3 |

- **Bank-strike** *(impaling, close)* — lunges from mud or water at a target passing above;
  reduces target Endu by 1; a grabbed target is dragged toward the water
- **Death-roll** *(grab, close)* — a grabbed target is rolled below the waterline; reduces target
  Speed by 2; the target takes impaling damage each round until they break free (Might ≥ 6);
  a target with Endu < 4 is fully submerged

**Motivation** — Hunger. A mud-lurker hunts for what it can take. It does not stalk for fun.

**Behaviour** — Perfectly still under mud or water for hours at a time; strikes when prey is
within reach. Its *Perc* is high — it reads vibration through the water and ground. Stationary
prey it ignores; **moving prey is its entire attention**. A party pausing often is safer than a
party wading steadily. The lurker does not pursue on dry ground for long — heavy, slow, prefers
water. *Druid* communication is possible but cold — it is not a spirit-creature, it is a predator;
it will simply listen and continue being hungry. A camp on a high-ground island is exactly *what
lurkers know to circle*.

### Leech-vine
*A plant-beast that hangs from swamp trees and drops when warm prey passes beneath. Not fast;
not intelligent; just persistent once it has attached.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 1 | 2 | 4 | 1 | 1 |

- **Drop-attach** *(grab, reach)* — falls from overhead onto a target passing beneath; reduces
  target Speed by 1; the vine is now attached and must be removed (Hand ≥ 3 to pry off; a cutting
  action also works but risks harming the victim)
- **Blood-drink** *(draining, close)* — feeds while attached; reduces target Endu by 1 per scene
  until removed; the victim does not feel it after the first round (the vine secretes a
  pain-number)

**Motivation** — Feed. It is a plant that has learned to move, barely. Its intelligence is
*reflex*.

**Behaviour** — Hangs above game-trails and river-crossings. A party looking up at the right
moment sees the vines shift. *Lookout* catches them; *Smell* detects their scent (sour,
specific); casual travellers do not. Once attached, it is stubborn — severing it is easy;
fully removing it without leaving spider-like *threads* in the skin takes *Hand*. The threads
left in cause slow ongoing Endu drain until a healer removes them. A party that lets the
threads alone heals on their own in a week.

### Rot-frog
*A swamp-frog that has accommodated the fungus rather than succumbing to it. Larger than a
normal frog. Feeds on insects drawn to the fungus. Carries spores in its skin.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 2 | 0 | 1 | 4 | 5 | 1 |

- **Spore-puff** *(draining, area)* — when threatened, releases a cloud of fungal spores;
  reduces Endu by 1 for any target within three paces who is not holding their breath; targets
  who inhale carry the fungus-poisoning mechanism for a day (matching Irna's affliction path)
- **Escape-hop** *(special, close)* — jumps clear of an attacker's range; no damage; the frog is
  simply not where it was; any follow-up attack within the scene has -1 Perc

**Motivation** — Survive and feed. The frog is not hostile. The spore-puff is *defence*, not
attack.

**Behaviour** — Sits at mud-banks and log-edges in the swamp. A party walking past is ignored;
a party *disturbing* the frog (reaching for it, kicking it, trying to catch it for a meal)
triggers the spore-puff. **Eating a rot-frog transmits the poisoning.** *Smell* detects the
contamination; *Druid* vetting catches it. A party hungry enough to eat what they catch finds
out the hard way.

### Spitting bush
*A waist-high thorn bush that has accommodated the swamp's chemistry. Spits a sap-and-spore
mixture at warm shapes that come within range. Otherwise unremarkable; the danger is the
range, which is longer than its size suggests.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 0 | 2 | 4 | 0 | 1 | 3 | 0 | 1 |

- **Sap-spit** *(draining, ranged)* — fires a wet glob at a target up to a long pace away;
  reduces target Char by 1 (the sap reads sour and burns the skin); a target hit twice in the
  same scene also takes Endu −1 from the spore content
- **Thorn-bristle** *(impaling, close)* — passive defence; a target reaching into or pushing
  through the bush takes Hand −1 from the inner thorns

**Motivation** — Reflex. The bush does not *want* anything; it has a working that fires when
warm shapes pass close.

**Behaviour** — Stands still. Reads heat at range and aims roughly. *Lookout* spots the bush's
distinctive lean before the spit; *Druid* reads it as accommodated rather than warped, and
can pass the party around it without trigger. Burning the bush ends it cleanly; cutting it
without protection invites the thorn-bristle. **Fields of spitting bushes** mark the swamp's
old corduroy-road edges where the fungus is densest; the bushes have grown along the lines
the road once carried.

### Creeping vines
*A mat of slow-moving vines that grows across a clearing or a path overnight, then withdraws
before dawn. Moves at the speed of root-growth made fast. A party that camps in the wrong
clearing wakes inside a tangle.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 0 | 2 | 5 | 1 | 3 | 2 | 1 | 2 |

- **Wrap-and-hold** *(grab, area)* — vines tighten around legs and arms of anything inside the
  mat at the moment of waking; reduces target Speed by 1; the wrap holds until cut, pried
  (Hand ≥ 3), or until the vines withdraw at dawn
- **Tug-down** *(blunt, close)* — once a target is held, the vines pull toward the mat's
  centre; reduces target Might by 1; a target with Endu < 3 is pulled prone

**Motivation** — Feed slowly. The vines are not predators; they are *opportunists* that
absorb what the wrap-and-hold leaves over time.

**Behaviour** — Withdraws into the swamp's warmer pools during the day. Surfaces at dusk and
extends across nearby clearings, paths, and camp circles overnight. *Lookout* on a watch
notices the first vines arriving and gives the party a chance to break camp before the mat
closes; *Druid* reads the arrival and can negotiate the vines back. **Fire works** — the mat
withdraws faster than it advanced. **Fungus-touched mats are different**: they do not
withdraw at dawn and the wrap-and-hold inflicts the spore-poisoning on a held target. Avoid
camping in low clearings near the lake's fungal front.

---

## Encroachments — Strange Tidings in Settled Lands

*The kingdoms still work. Farms are farmed. Towns are towned. But at the edges — where a
homestead has been abandoned, where a road-inn has emptied, where a mill has fallen out of use
— things have moved in. Some came with the chaos creeping out of the forbidden woods, the
blasted lands, or the advancing desert. Some arrived by routes no one tracks. All of them nest
in what people have left, and a few are bold enough to push into places where people still
live, quietly, until those people leave too. These are the encroachments: creatures sized for
a farm, a mill, an inn, a well, a church, rather than a region. Each carries the register of
its source — the desert's archaeological grief, the blasted lands' betrayed reciprocity, the
forbidden woods' approximation-wrongness — scaled down to one household's loss. They are not
the wild animal a farmer knows to worry about. They are the wrong thing that arrives after
the wild animal has been driven off. Combat is possible against any of them; costlier, most
of the time, than respectful passage, patient address, or letting the place continue to empty.*

### Hearth-dweller
*Something small and hunched has taken the fireplace of an abandoned family home. It does not
leave the hearth. The hearth no longer warms the room.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 3 | 1 | 3 | 4 | 2 | 3 |

- **Ember-spit** *(fire, ranged)* — spits a live coal at a target disturbing the hearth; reduces
  target Dex by 1; also sets cloth and paper alight on a hit
- **Cold-grip** *(draining, close)* — hands that should be warm from the fire are not; reduces
  target Endu by 1; the target also feels *cold for a day* regardless of weather

**Motivation** — Inhabit the hearth. It does not know the family is gone; it has taken the
warm place they left behind. It does not seek conflict. It defends the hearth when approached.

**Behaviour** — Visible only from the right angle: a shape half-inside the fireplace, resolving
into eyes and a curved back when firelight plays on it. Cannot be drawn out of the hearth — it
will fade if moved more than a pace from the stone. Parties that leave the hearth untouched
are unmolested; the rest of the house is safe. Parties that kindle the fire to cook by it find
the coals do not take heat and the fire will not rise. A *Shamanic* character can speak with
it; it remembers the family *dimly*, by the smell of what they used to cook. Taking anything
from the mantelpiece provokes it; taking the hearth-stone itself is how the creature dies, and
how the house loses its last occupant.

### Door-kept
*A guard-creature, cerberus-descended or merely cerberus-shaped, has taken the door of a
farmhouse, a chapel, or a village gate. It watches. It will not let you in.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 2 | 2 | 5 | 1 | 5 | 5 | 2 | 6 |

- **Threshold-swipe** *(blunt, close)* — the heads move in sequence to drive an intruder back;
  reduces target Might by 1; a target still in the threshold after the swipe is knocked clear
  of the door
- **Triple-gaze** *(draining, close)* — each head fixes on a different part of the target at
  once; reduces target Will by 1; a target with Will < 4 also loses their next action as the
  watched-by-three-eyes feeling lands

**Motivation** — Guard the door. It does not know who is supposed to pass and who is not; it
has decided, across a long patient wait, that the answer is nobody. It will not pursue beyond
the threshold.

**Behaviour** — Stationary. Does not leave the door. Three heads that move in sequence — one
watches the path, one watches the door, one watches the ground. Addressed correctly — by name,
with a claim of lawful entry, or with a token the building's former community would have
recognised — it may stand aside. *Reading* and *Politics* are the powers this register tests,
the same way the Commons-Guard Cerberus's threshold tests them; *Shaman* can also reach the
guard-spirit beneath the form when the community's name is known. Killed, it dies sadly; the building loses its last active
guardian and whatever protection its presence offered. The household the door belongs to will
have been empty for months when the door-kept arrived; communities sometimes leave *because*
of a door-kept rather than before one. A DM running active-creation: the creature appears at
a door one morning; by the end of the season the building is empty.

### Mill-shade
*A spirit that once helped turn a distant waterwheel has migrated and is now in the race at
this mill. It turns the wheel when it remembers to. The flour comes out the wrong colour.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 4 | 1 | 3 | 3 | 1 | 4 |

- **Wheel-drag** *(grab, close)* — a target standing at the wheel is pulled against the
  mechanism; reduces target Speed by 1; the target takes blunt damage each round until they
  break free (Might ≥ 5)
- **Wrong-grind** *(draining, area)* — the stones turn with dust that reads as flour but is
  not; reduces target Endu by 1 for any target eating bread made from the mill's output; the
  effect accumulates across meals

**Motivation** — Help the mill. The spirit does not know this mill is not its mill; it does
not know the original mill is a shell a day's walk upstream. It is still *trying to turn a
wheel for a community*. The help is broken; the help is continuing.

**Behaviour** — Present in the water-race. Invisible except as a cold patch in the flow.
Visible to a shaman or druid as a warped beneficial presence. Turns the wheel on its own at
unpredictable hours; ignores the miller's signals. A *Shamanic* working can address it; naming
the mill it actually came from (DM-fill: a specific ruined mill upstream or in the blasted
lands) lets a party begin to guide it home. Driving it off destroys the mill's magical
character and often cracks the stones in the process. A miller whose flour has gone wrong for
three seasons and whose children are getting thin does not wait; the mill is abandoned, the
family moves, the creature stays in a mill that is now also empty.

### Wrong-flock
*Hare-shapes in an abandoned pasture. They do not bleed when struck. They do not leave tracks.
They are the reason the shepherd's family sold up and left two winters ago.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 7 | 1 | 1 | 1 | 5 | 8 | 2 |

- **Vanish** *(special, area)* — when struck, the creature is simply elsewhere; the attack
  connects with nothing; reduces the hunter's Perc by 1 for the scene as certainty wobbles;
  cumulative across encounters
- **Nip** *(cutting, close)* — only if truly cornered; reduces target Dex by 1; the wound
  bleeds normally from the target, but the hare's own bite draws a fluid that is not blood

**Motivation** — Exist where they should not. They are not aggressive. They graze on crops and
grass that is wrong enough to support them, and nothing else can. They breed slowly and do not
migrate. A field they occupy is a field normal animals stop visiting.

**Behaviour** — Scatter when a person appears; vanish when struck; reappear at the field's
edges the next morning. Cannot be herded, driven, or domesticated. Children sometimes play
with them; the children come home cold and take a season to warm. A *Druid* can sense the
wrongness in the field; cleansing it requires removing the flock (which is hard — see *Vanish*
above) or restoring whatever ecological piece the chaos warped. Until then, the field cannot
be farmed. A party asking in Elmsfield or Salmonswell about empty fields on the southern
edge-country hears stories; a party visiting one is carrying the flock's attention home in
the ordinary hare-carry-fleas sense, plus whatever the children catch from them.

### Inn-walker
*A roadside inn, three hours between better places, has been emptying. Guests who slept there
in the last season have stories about a sound in the hallway at night. Some have stories
about more than the sound.*

| Char | Dex | Endu | Hand | Might | Perc | Speed | Will |
|---|---|---|---|---|---|---|---|
| 1 | 3 | 6 | 0 | 4 | 6 | 4 | 8 |

- **Pass-through** *(draining, reach)* — the walker moves down the hallway past an open
  doorway; reduces Endu by 1 for anyone in the room watching; stacks if the guest watches
  across multiple nights
- **Close-up** *(draining, close)* — a guest who sought the walker, left their room to see it,
  or stood in the hallway as it passed is approached directly; reduces target Will by 2; the
  target wakes the next morning unwilling to return to the inn, and carries the unwillingness
  toward all such places for a season

**Motivation** — Walk the hallway. It does not know why. It has walked the hallway for
longer than the current inn-keeper has been alive, and it was walking a different hallway
before that. Active creation: the inn empties around it, and when the inn is fully empty the
walker moves to another — not teleporting; travelling slowly, at a walking pace, on roads at
night, between one empty hallway and the next.

**Behaviour** — Active only at night, between dark and a specific hour (DM-fill: the hour
the walker first walked, a long time ago). Invisible in daylight. Same stride, same pace,
same direction along the hallway each night. Does not enter closed rooms. A guest who stays
in their room with the door shut is unmolested; a guest who opens the door to look is the
target of *Pass-through*; a guest who steps into the hallway is the target of *Close-up*. The
inn-keeper will not stay on the upper floor any more; they sleep in the kitchen. A *Shamanic*
character who walks the hallway deliberately, at pace, beside the walker — matching it rather
than stopping it — can speak with it, and what it says is not entirely intelligible. Naming
the hallway it *actually* walks (DM-fill: a specific communal building in the blasted lands,
or a specific ruined castle) can release it to find that place again. Killing it is possible
and costly; the inn loses its residual mage-work along with the walker, and three nearby inns
along the same road feel the change.

### Using encroachments at the table — the themed note

- **Each is a reason a place is empty, or about to be.** A DM running an encroachment should
  first know *why the place is empty* — old plague, a bankruptcy, a debt, a crop failure, a
  death. The encroachment sits in the aftermath or precipitates it. The emotional ground is
  the *reason*, not the monster; the monster is the form the wrongness has taken.
- **Compassion-first, as in the campaign's Session 1 frame.** These creatures can be fought.
  Most of them *should not* be fought. Respect, address, naming, a clean pass-through, a
  return of the creature to where it belongs — these are the good answers. A DM who hands the
  party a sword and expects them to swing loses the register.
- **Nadine carries the tidings.** World-news at Bridget's Inn. *"There's a farm past
  Hanksroad where the dogs won't go up to the front door any more."* *"The Widder mill on the
  east road is grinding wrong."* *"Travellers won't stop at the Wayhalt inn; something walks
  the upstairs."* Use her voice (see `doc/npcs/nadine.md`) to seed an encroachment the party
  can investigate.
- **Diederik diagnoses.** An ecological reading of an encroachment is what he is *for*. A
  party bringing him an encroachment's details gets a clear read on what kind it is, what it
  came from, and whether it can be turned back. See `doc/npcs/elder_diederik.md`.
- **Bridget collects stories.** Travellers' rumours at the Inn accumulate; she remembers them.
  A party that asks her *"has anyone come through talking about weird happenings"* gets names,
  places, specifics. See `doc/npcs/bridget.md`.
- **Hank receives the displaced.** Families who lost a farm to a Door-kept, a flock-wrong
  field, a Mill-shade come to Hank. Their children arrive at the orphanage. See
  `doc/npcs/hank.md`.
- **Scale down from the chaos regions.** The desert's archaeological grief, the blasted
  lands' reciprocity betrayed, the forbidden woods' approximation-wrongness — all scaled to a
  household. A DM who has internalised the regional registers will write encroachments that
  fit the theme without needing a recipe.
- **Active creations are rare.** A DM running a season's worth of sessions should run one
  active creation at most. They are powerful precisely because they force the community's
  hand. Too many make the kingdoms feel unplayable. One real one — a farm the party can still
  save, or a mill the party watches fall — is a shape of dread that lasts.

---

## Creature usage — early freshness vs late-game fatigue

Moros rewards emotional investment in encounters. The creature entries above support a wide range of scene-types, but **how** the DM uses them should scale with campaign phase.

**Early (Sessions 1–5) — "creature-of-the-week" is fine.** A wolf pack on the road, a bandit
ambush, a wandering graftbeast, a dust-dervish crossing the party's path, a single first-contact
encroachment — each is legitimately a combat scene without deeper backstory. The party is still
learning the world; meeting the world's creatures is itself the work. Use the register freely.

**Mid (Sessions 6–10) — the register begins to fade.** The party has built relationships;
encounters that do not connect to those relationships start to feel like filler. A straight
creature-of-the-week slot is still playable but the DM should watch for diminishing returns.

**Late (Sessions 11+) — creature-of-the-week is stale.** *"Oh no, another monster — can't we
just ignore it?"* is the failure-mode. **If an encounter does not carry a face or an accumulated
stake, redesign it or skip it.** The register Moros has built — Irna's rescue, the mother bear,
the pot-people, Laurent's audience, and so on — would be wasted by a return to generic combat.

### What elevates a creature-of-the-week scene into face-first

Any of these raises an encounter beyond filler and keeps it viable across the mid-to-late
campaign:

- **A name.** *"That's the wolf the rangers know — she has two pups in the south range."*
- **A specific cause.** *"These bandits are Brumal refugees who did not reach Hank's in time."*
- **Repeat context.** *"The graftbeast from last autumn has come back to the same valley."*
- **Inheritance.** *"The encroachment at the Miller place has children in it now."*
- **Connection to an established NPC.** *"The dust-dervish carries a message from Nadine."*

### The DM's session-prep test

Before running a creature encounter past the early campaign, ask: **can I name why this
particular creature appears here, now, to these characters?** If yes, the scene is face-first
and the creature's stats from the entries above serve as the mechanical substrate. If no, it is
stale — and a stale encounter in a late campaign is worse than no encounter at all.

**Exceptions are fine.** Travel through the forbidden woods' fringe will still meet Tod; a
caravan on the Linar trade road might still be ambushed by desperate drifters. These work
*because* they sit in established threads (Tod is known; the bandits are Brumal-desperate). The
test catches them correctly — the DM *can* name why.

See also `doc/claude/COORDINATION_ROADMAP.md` §"Face-first — the emotional anchor of every
tension moment" for the broader principle across all scenarios, not just creature encounters.

---

→ Back to [RULES.md](RULES.md) | See also [STATISTICS.md](STATISTICS.md) for stat actions and
[ITEMS.md](ITEMS.md) for equipment the group may use against these creatures.
