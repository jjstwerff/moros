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
escape route is available.

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
with a camp fire action and Hand ≥ 2 — calms it temporarily and suppresses the sting cloud
for one round. Once defending the hive it does not stop until the threat leaves.

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
replace what it lost.

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
as the spirit panics trying to understand why the body is failing.

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
may redirect it entirely. A killed screamer releases a sound — quieter than the scream and not
entirely unpleasant — as the spirit disperses.

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
or cold magic is faster. Splitting it only produces more flame elementals.

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
pursue inland beyond sight of water.

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
terrain where its weight is a liability — deep water, unstable ground, chasms.

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
and responds to clarity and honesty. Deception in its presence is immediately apparent; words
spoken falsely are visibly lit. Will not engage trivial threats.

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

→ Back to [RULES.md](RULES.md) | See also [STATISTICS.md](STATISTICS.md) for stat actions and
[ITEMS.md](ITEMS.md) for equipment the group may use against these creatures.
