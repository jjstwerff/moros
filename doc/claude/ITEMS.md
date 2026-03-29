<!--
See RULES.md for the full style guide. Key rules for this file:
  ## for item categories, ### for each item entry. No --- separators within a category.
  Item headers: ### Name *(Stat + Stat — special)* for items with statistics.
                ### Name for basic supplies without statistics.
  Item description: italics on the line after the header.
  Entry types and their labels:
    **Boost** *(condition)* — when and how the item becomes more effective
    **Hinder** *(condition)* — when and how the item is limited or costly
    **Material** *(material name)* — what a special material does to a variant of this item
    **Masterwork** *(craftsperson type)* — what expert crafting adds
    **Bloodline** *(breed)* — animal variant from selective breeding (replaces Material)
    **Trained** *(trainer type)* — animal variant from expert training (replaces Masterwork)
    **Quality** *(description)* — for supplies where material and craft are the same axis
    **Damage** *(type)* — damage type dealt and stat reduced on a hit; secondary effect of the
      item's special
    **Protects** *(type list)* — damage types mitigated and by how much; negation conditions
    **Treats** — what the item removes or repairs after damage has been taken
  Special Materials section uses its own entry format:
    **Effect** — general property of the material when worked into any item
    **Weapon** / **Armor** / **Accessory** — crafting effects per item category
    **Found** *(tier)* — discovery source; tier is common, rare, or legendary
  Conditions use stat abbreviations, action names, or scenario names (lowercase).
  Maximum line length: 100 characters. Table rows are exempt.
-->

# Moros — Items

Items are acquired through backgrounds and unlocked via progression. Each item with statistics
generates a card for play and contributes those stats when drawn. Bulk shapes what a character
can carry — negative bulk increases capacity.

Specials listed here describe conditions that sharpen or limit an item's effectiveness in play.
Masterwork and material variants describe how the DM can introduce better versions as rewards,
contacts, or crafting goals — each grounded in the same statistics and actions.

See [RULES.md — Inventory and Carrying](RULES.md#inventory-and-carrying) for bulk rules and
base item slots.

---

## Weapons

### Sword *(Might + Dex — parry)*
*A balanced blade for close combat and quick defense.*
- **Damage** *(cutting)* — hit reduces target Dex by 1; parry special deflects one incoming
  cutting or impaling hit per round
- **Boost** *(Dex ≥ 3, combat)* — the parry special may be activated on the same turn as feint
  without spending a second action
- **Boost** *(Might ≥ 3, combat)* — a successful parry in the same round as power through forces
  the enemy to lose their next action entirely
- **Hinder** *(stealth)* — the blade catches light; detection checks against you gain +1
- **Hinder** *(negotiation)* — drawing the sword indoors raises Tension by 1 immediately
- **Material** *(folded steel or silver-edged)* — the parry special functions against magical
  attacks; a silver edge bypasses undead damage resistances
- **Masterwork** *(master smith, Swords specialization taught)* — the feint action gains +1 Dex
  when triggered through this sword; the blade never requires maintenance between scenarios

### Glave *(Might + Endu — stop)*
*A long polearm that holds enemies at distance.*
- **Damage** *(impaling)* — hit reduces target Endu by 1; stop special prevents a charging target
  from closing distance
- **Boost** *(Might ≥ 3, combat)* — the stop special and power through activate together on one
  action, halting the target and adding Might to the total simultaneously
- **Boost** *(combat)* — reach allows the glave to intercept a charging enemy before they close
  distance, functioning as the spear's intercept special for that moment
- **Hinder** *(exploration)* — cannot be swung in low ceilings or tight passages; the stop special
  is unavailable in confined indoor spaces
- **Hinder** *(stealth)* — length and weight make concealment impossible; must be declared openly
  or left outside
- **Material** *(ironwood shaft, iron-banded)* — the stop special can be activated twice per
  scene instead of once; the shaft cannot be broken or sundered
- **Masterwork** *(weapon smith with Pole weapon specialization)* — the intercept function
  extends to ranged projectiles as well as charges; users with Pole weapon add +1 to all actions

### Flail *(Might + Endu — stun)*
*A heavy chained weapon with an unpredictable arc.*
- **Damage** *(blunt)* — hit reduces target Might by 1; stun special causes the target to lose
  their next action entirely
- **Boost** *(Might ≥ 3, combat)* — the stun special carries into power through; both effects
  trigger on the same action
- **Boost** *(combat)* — the swing arc ignores shields and the block special on the round it
  lands; the target's blocking action is wasted
- **Hinder** *(stealth)* — the chain rattles; all Stealth actions take a −2 penalty
- **Hinder** *(exploration)* — the swing radius requires open space; tight corridors remove the
  stun special entirely
- **Material** *(weighted tempered links)* — the stun special also reduces the target's Speed
  by 1 for the remainder of the round
- **Masterwork** *(smith with Blunt specialization)* — the swing arc can hit two adjacent
  targets in the same action; both receive the stun if Might ≥ 4

### Spear *(Might + Speed — intercept)*
*A reach weapon that strikes before opponents can close.*
- **Damage** *(impaling)* — hit reduces target Endu by 1; intercept special lands before a
  charging target reaches melee range
- **Boost** *(Speed ≥ 3, combat)* — the intercept special triggers on the same turn as sprint;
  the character moves and stops the enemy's advance in one action
- **Boost** *(combat)* — reach means the spear strikes at two adjacent targets simultaneously;
  cleave applies without the Might ≥ 5 requirement when both are directly ahead
- **Hinder** *(exploration)* — length prevents use in rooms with low clearance; intercept is
  unavailable indoors
- **Hinder** *(market)* — an obvious weapon in a civilian space; Char-based actions take −1 if
  the spear is not left outside or covered
- **Material** *(balanced tip, weighted butt)* — the intercept special works against thrown
  weapons and ranged attacks as well as charges
- **Masterwork** *(smith and Spear specialist)* — intercept triggers without needing sprint;
  the character does not need Speed ≥ 3 to use the special

### Staff *(Dex + Speed — block)*
*A reach weapon that defends as readily as it strikes.*
- **Damage** *(blunt)* — hit reduces target Might by 1; block special deflects one incoming hit
  per round
- **Boost** *(Dex ≥ 3, combat)* — the block special and feint action may both trigger on the
  same incoming attack without spending separate actions
- **Boost** *(exploration)* — doubles as a tool for balancing over gaps, vaulting obstacles, or
  probing ahead for traps; counts as an improvised pole for Hand actions
- **Hinder** *(stealth)* — length makes it awkward in narrow spaces; Speed actions in tight
  quarters take −1
- **Hinder** *(market)* — marks the bearer as scholar or monk; factions hostile to either read
  the character before any words are spoken
- **Material** *(ironwood or bonewood)* — the block special absorbs all damage on the turn it
  activates rather than just reducing it; the staff cannot be broken
- **Masterwork** *(staff master, Monk or Blocking specialization)* — the staff's effective
  reach extends by one position; feint and block may be used together in the same turn

### Bow *(Perc + Endu — cripple)*
*A hunting and combat weapon that reaches where others cannot.*
- **Damage** *(impaling)* — hit reduces target Endu by 1; cripple special additionally reduces
  target Speed by 1
- **Boost** *(Perc ≥ 4, combat)* — called shot with the cripple special permanently reduces the
  target's Speed for the rest of the scene
- **Boost** *(travel)* — doubles as a hunting tool; Perc actions to locate food along the route
  gain +1 when the bow is equipped
- **Hinder** *(stealth)* — drawing and holding the bow is visible and slow; Speed-based Stealth
  actions take −1
- **Hinder** *(combat)* — melee range removes the cripple special; the bow cannot fire at targets
  who have already closed distance
- **Material** *(composite: horn, wood, and sinew laminated)* — the cripple special applies to
  both Speed and Dex simultaneously; effective range doubles
- **Masterwork** *(master bowyer, Bows specialization taught)* — called shot requires Perc ≥ 3
  instead of ≥ 4 when using this bow; no Speed penalty for Stealth while carrying it

### Crossbow *(Perc + Hand — wound)*
*A mechanical ranged weapon with brutal stopping power.*
- **Damage** *(impaling)* — hit reduces target Endu by 1; wound special: the Endu reduction
  persists into the next scene if the wound is not treated
- **Boost** *(Perc ≥ 4, combat)* — called shot combined with the wound special can disable a
  specific limb for the remainder of the scene
- **Boost** *(stealth)* — can be fired from cover without breaking position if used at distance;
  the shot does not trigger a detection check on its own
- **Hinder** *(combat)* — requires one full turn to reload; the bearer cannot act offensively on
  the turn after firing
- **Hinder** *(market)* — a loaded crossbow in public raises Tension by 1 immediately
- **Material** *(precision-machined steel crank and rail)* — reloads in half a turn; the bearer
  may fire every round without skipping an offensive action
- **Masterwork** *(machinist with Crossbow and Machinist specializations)* — the wound special
  also imposes −1 on the target's next action regardless of where the shot lands

### Sling *(Perc + Dex — stun)*
*A silent ranged weapon that requires only stones.*
- **Damage** *(blunt)* — hit reduces target Might by 1; stun special causes the target to lose
  their next action
- **Boost** *(Perc ≥ 3, combat)* — the called shot action applies without the usual Perc ≥ 4
  requirement when activated through the sling
- **Boost** *(stealth)* — the stun special is silent enough to leave the Stealth scenario intact
  if used from concealment and the target does not cry out
- **Hinder** *(combat)* — requires room to spin the sling; the stun special cannot be used in
  tight quarters or when adjacent to an obstacle
- **Hinder** *(travel)* — ammunition is stone and must be gathered; after three scenes without
  market or forage access the sling is effectively exhausted
- **Material** *(braided silk, cast lead shot)* — the stun special also prevents the target from
  using Speed-based actions for one full round; lead shot needs no foraging to resupply
- **Masterwork** *(expert slinger, Sling specialization)* — called shot requires Perc ≥ 2 with
  this sling; the spin radius is halved, removing the tight-quarters restriction

### Dagger *(Perc + Hand — sneaking)*
*A concealable blade for close quarters and ambush.*
- **Damage** *(cutting)* — hit reduces target Dex by 1; sneaking special: cutting mitigation from
  armor does not apply if the strike lands before the target has acted
- **Boost** *(Dex ≥ 3, stealth)* — the sneaking special stacks with the Claw power on the same
  attack; both bonuses apply when striking an unaware target
- **Boost** *(Perc ≥ 3, combat)* — the dagger can be drawn and thrown in the same action without
  spending a turn, using the sneaking special at range
- **Hinder** *(combat)* — short reach; cannot contribute stats to actions against targets who
  have a reach weapon or who have triggered Charge
- **Hinder** *(negotiation)* — a dagger produced openly raises Tension by 1
- **Material** *(shadow-steel or obsidian-edged)* — detection checks do not gain +1 from the
  blade; the sneaking special triggers even when the bearer is partially visible
- **Masterwork** *(blade smith, Sneak specialization taught)* — the sneaking special activates
  on the first strike of any scene, not only from a full ambush position

### Darts *(Will + Perc — poison)*
*Small thrown weapons that accumulate effect over time.*
- **Damage** *(draining)* — hit reduces target Will by 1; poison accumulates — a second hit in
  the same scene reduces Will by 1 more
- **Boost** *(Perc ≥ 3, stealth)* — the poison persists even if the Will reduction is treated
  with bandages; a treated target takes the second hit's −1 Will again at the start of the
  next scene
- **Boost** *(combat)* — the poison can be applied to an ally's weapon once per scene; the next
  hit from that weapon carries the poison effect
- **Hinder** *(combat)* — limited supply; after three uses in a scene the darts are spent and
  cannot be recovered mid-scenario
- **Hinder** *(travel)* — darts cannot be foraged or improvised; resupply requires market access
  or a contact who carries them
- **Material** *(rare plant extract, prepared by Healer contact)* — the poison special reduces
  both Will and Dex by 1 per hit rather than Will alone
- **Masterwork** *(expert poisoner, Healer or Druid background)* — six uses per scene instead
  of three; the poison may be concentrated to take effect after one hit rather than two

### Whip *(Dex + Will — steer)*
*A control tool for animals and opportunistic reach strikes.*
- **Damage** *(grab)* — hit reduces target Speed by 1; steer special can strip a held item
  instead of dealing damage
- **Boost** *(Dex ≥ 3, combat)* — the steer special pulls a weapon or carried object from a
  target's grip at distance without closing to melee
- **Boost** *(travel)* — drives pack animals and livestock at full pace; the donkey's stubborn
  special cannot trigger on turns when the whip is actively used
- **Hinder** *(stealth)* — the crack of a whip carries far; using it in a Stealth scenario ends
  the group's concealment immediately
- **Hinder** *(negotiation)* — producing a whip indoors reads as threatening regardless of
  intent; Tension rises by 1
- **Material** *(braided serpent hide, weighted tip)* — the steer special can be applied to a
  second target in the same round if the first attempt succeeds
- **Masterwork** *(circus master, Juggle specialization)* — the steer special can substitute for
  feint, triggering Dex-based advantages against the target on the following round

### Pickaxe *(Endu + Will — breaching)*
*A heavy digging tool that can breach walls and earth.*
- **Damage** *(blunt)* — hit reduces target Might by 1; in combat, bypasses the armor special of
  stone-skinned or heavily armored targets
- **Boost** *(Endu ≥ 3, exploration)* — the breaching special clears cave-ins and rubble in one
  action; without the item this would require two
- **Boost** *(combat)* — heavy and devastating against solid targets; if Might ≥ 4, the blow
  bypasses armor specials on armored or stone-skinned enemies
- **Hinder** *(combat)* — slow to wind up; Speed-based actions and dodge cost −1 on rounds the
  pickaxe is used offensively
- **Hinder** *(stealth)* — cannot be used quietly; any breaching action ends the Stealth scenario
- **Material** *(volcanic iron, hardened in ore-fire)* — the breaching special clears stone walls
  and reinforced doors in a single action with no Endu check required
- **Masterwork** *(master miner, Axes or Brawl specialization)* — the offensive use no longer
  imposes −1 on Speed-based actions; the head is counterbalanced and feels natural in combat

---

## Armor and Protection

### Armor *(Might + Char — imposing)*
*Full military plate that commands attention in every room.*
- **Protects** *(cutting, blunt)* — reduces each by 1; imposing special absorbs one damage source
  per scene entirely before any stat reduction occurs
- **Boost** *(Might ≥ 3, negotiation)* — the imposing special makes threats physically credible;
  Might contributes to Char-based negotiation actions when the armor is visible
- **Boost** *(combat)* — the imposing special absorbs one source of damage per scene before
  statistics are counted; applies before any defense rolls
- **Hinder** *(stealth)* — metal plate scrapes and rings; all Stealth actions take a −2 penalty
- **Hinder** *(travel, Endu < 3)* — the weight accumulates over long marches; Speed actions
  take −1 after the second scene of sustained travel
- **Material** *(dwarven-forged steel, articulated joints)* — bulk drops by 1; the imposing
  special functions in all scenarios, not only combat
- **Masterwork** *(master armorer, Noble or Army background contact)* — the Stealth penalty
  drops from −2 to −1; the armor can be donned or removed in a single action

### Breastplate *(Might + Will — defend)*
*Solid chest protection that holds the nerve as much as the body.*
- **Protects** *(cutting, impaling)* — reduces each by 1; defend special negates one hit entirely
- **Boost** *(Will ≥ 3, combat)* — the defend special and steel the mind trigger simultaneously
  on one action; fear and physical damage are both negated
- **Boost** *(negotiation, Might ≥ 3)* — worn armor makes the threat of force credible without
  words; Might adds to Char totals in formal confrontations
- **Hinder** *(stealth)* — metal construction makes movement audible; all Stealth actions take
  a −2 penalty
- **Hinder** *(forage, Endu < 3)* — weight in open terrain causes fatigue; Endu actions cost −1
  after the first scene of outdoor exertion
- **Material** *(layered steel over chainmail backing)* — the defend special can be activated on
  behalf of an adjacent ally, not only the wearer
- **Masterwork** *(armorer fitted to the wearer)* — the Endu penalty in outdoor exertion
  disappears; the breastplate moves with the body rather than against it

### Leather *(Speed + Dex — armor)*
*Light and flexible protection that does not slow the wearer.*
- **Protects** *(cutting)* — reduces by 1; blunt damage from attackers with Might ≥ 4 bypasses
  this entirely
- **Boost** *(stealth)* — soft and silent; the armor special carries no Stealth penalty, unlike
  metal alternatives
- **Boost** *(travel)* — Speed on the card reflects the lack of restriction; no penalty to march
  pace or sustained movement actions
- **Hinder** *(combat)* — the armor special does not protect against heavy blunt or flail weapons;
  enemies with Might ≥ 4 bypass leather defense on direct hits
- **Hinder** *(exploration)* — stiff after river crossings or sustained wet conditions; Endu
  actions cost −1 until the leather dries
- **Material** *(dragonhide or sealskin, naturally waterproof)* — protects against blunt and
  flail weapons as well as cutting; never stiffens in wet conditions
- **Masterwork** *(master leather worker, Leather specialization)* — the Endu wet-condition
  penalty disappears entirely; the leather dries without requiring a camp stop

### Shield *(Dex + Endu — block)*
*An off-hand defense that protects the bearer and those beside them.*
- **Protects** *(any — block)* — block special negates one hit entirely regardless of damage
  type; passive −1 to grab damage
- **Boost** *(Dex ≥ 3, combat)* — the block special and feint action both trigger on the same
  incoming blow without requiring separate actions
- **Boost** *(combat)* — covering an adjacent ally with the block special does not raise Tension;
  the one form of aid that costs nothing on the tension track
- **Hinder** *(combat)* — occupies the off-hand; the block special and two-handed weapon specials
  cannot both activate on the same turn
- **Hinder** *(market)* — conspicuous military equipment; in civilian areas the group reads as
  a patrol; Char-based actions take −1 until the shield is stowed
- **Material** *(ironwood banded with iron rim)* — the block special can be activated twice per
  scene without penalty; the shield cannot be sundered
- **Masterwork** *(armorer with Shield and Blocking specializations)* — the off-hand restriction
  eases; two-handed weapon specials and block may both activate once per scene together

---

## Animals and Transport

### Horse *(Speed + Endu — travel)*
*A mount that doubles the range of a day's march.*
- **Boost** *(Speed ≥ 3, travel)* — sprint may be used twice in one round while mounted without
  spending additional actions
- **Boost** *(combat)* — a mounted charge adds Might to the Charge power total even if Might is
  not on the drawn card
- **Hinder** *(stealth)* — hooves on any surface make silence impossible; all Stealth actions
  take −2 while the horse is present and not stabled
- **Hinder** *(exploration)* — cannot enter narrow passages or climb; must be left behind, losing
  the travel special for any scene where the horse is absent
- **Bloodline** *(steppe breed or noble warhorse lineage)* — the horse does not panic at blood,
  fire, or loud noise; sprint while mounted requires no Speed threshold
- **Trained** *(master rider or cavalry contact)* — the mounted charge special activates without
  needing the Charge power; the Stealth penalty drops from −2 to −1

### Donkey *(Endu + Will — stubborn)*
*A pack animal that carries what the group cannot.*
- **Boost** *(travel)* — carries 9 bulk of the group's gear without complaint, freeing the party
  to equip additional items without penalty
- **Boost** *(market, Char ≥ 2)* — a loaded donkey signals a serious trader; Char-based commerce
  actions gain +1 when the donkey is visibly loaded
- **Hinder** *(travel, Will < 3)* — the stubborn special turns against the handler; the donkey
  stops unpredictably, costing the group one action to resume
- **Hinder** *(stealth)* — cannot be silenced; all Stealth actions take −2 while the donkey
  accompanies the group
- **Bloodline** *(mountain-bred stock)* — carries 12 bulk instead of 9; navigates rough terrain
  where a cart cannot go
- **Trained** *(experienced drover contact)* — the stubborn special never triggers against a
  handler with Will ≥ 2; the market Char bonus rises to +2

### Dog *(Perc + Char — tracking)*
*A loyal companion with senses the party lacks.*
- **Boost** *(forage, Perc ≥ 3)* — the tracking special extends to locating food; grants
  Hunter-level foraging efficiency without requiring the power
- **Boost** *(camp, Char ≥ 2)* — the dog detects approaching threats before any watch action;
  Lookout-based watch actions gain +1 when the dog is present
- **Hinder** *(stealth)* — the dog cannot be reliably silenced; all Stealth actions take −1
  while it accompanies the group
- **Hinder** *(negotiation)* — an animal in a formal indoor setting unsettles the other party;
  Char-based actions take −1 until the dog is removed
- **Bloodline** *(hunting or war breed)* — the tracking special identifies creature type and age
  of trail as well as direction; camp detection bonus rises to +2 without a Char threshold
- **Trained** *(master hunter contact, Hunter or Tracking specialization)* — the dog can take
  one action per scene in combat, forcing a target to spend their next action on the dog instead

### Falcon *(Char + Perc — search)*
*A trained hunting bird that extends the party's sight.*
- **Boost** *(travel, Perc ≥ 3)* — the search special scouts a full scene ahead; the group
  cannot be surprised by an encounter on the road when the falcon is aloft
- **Boost** *(forage)* — spots food sources from height; removes one round of searching from any
  Forage scene without requiring a Perc action
- **Hinder** *(stealth)* — a circling bird marks the party's position; all Stealth actions take
  −1 while the falcon is flying overhead
- **Hinder** *(market)* — a falcon in a crowded indoor space is disruptive; Char-based actions
  take −1 until it is hooded and put away
- **Bloodline** *(peregrine or eagle-blooded strain)* — the search special identifies a specific
  individual or item at range; no Stealth penalty when the falcon flies above cloud height
- **Trained** *(master falconer contact)* — in combat, the falcon harries a single target every
  round, imposing −1 to that target's Perc for as long as it attacks

### Cart *(Endu + Hand — steady)*
*A large wheeled transport for serious quantities of goods.*
- **Boost** *(market, Char ≥ 2)* — a loaded cart signals bulk trade; Char-based commerce actions
  gain +1 and contacts are more willing to negotiate
- **Boost** *(travel)* — the steady special allows fragile cargo — documents, glassware, potions —
  to survive rough terrain without spoiling or breaking
- **Hinder** *(travel)* — requires a maintained road; off-road terrain drops effective Speed to 1
  while the cart is being hauled
- **Hinder** *(stealth)* — cannot be hidden or hushed; all Stealth scenarios are impossible while
  the cart accompanies the group
- **Material** *(iron-rimmed wheels, reinforced axle)* — off-road movement no longer drops Speed
  to 1; rough terrain is navigable at half pace rather than a crawl
- **Masterwork** *(expert wheelwright, Woodworking specialization)* — bulk capacity increases to
  −25; the steady special extends to passengers and wounded characters being transported

---

## Gear

### Backpack *(Endu + Speed — carry)*
*A structured pack that makes load-bearing efficient.*
- **Boost** *(travel)* — the carry special reduces total carried bulk by 3; the group can equip
  additional items without hitting their carry limit
- **Boost** *(forage)* — allows substantially more to be brought back in one trip; removes the
  need for a second forage scene to retrieve finds
- **Hinder** *(combat)* — the pack shifts weight and restricts shoulder movement; Dex-based
  dodge and feint actions take −1 while worn
- **Hinder** *(stealth)* — catches on walls and door frames; Speed-based Stealth actions take
  −1 in tight spaces
- **Material** *(frame-and-canvas, fitted bracing)* — bulk reduction rises from 3 to 4; the
  pack does not catch on obstacles, removing the Stealth penalty
- **Masterwork** *(expert leather worker, Leather specialization)* — the Dex penalty disappears;
  the pack is body-fitted and does not shift under combat movement

### Tools *(Hand + Will — craft)*
*A complete set of hand tools for construction and repair.*
- **Boost** *(Hand ≥ 3, exploration)* — improvise tool costs no action slot when the tools are
  equipped; the action does not burn a turn
- **Boost** *(camp)* — fully restores the effectiveness of any damaged equipment between scenes;
  items that lost their specials from wear regain them
- **Hinder** *(combat)* — not a weapon; any offensive use treats Might as 1 regardless of the
  character's actual Might level
- **Hinder** *(stealth)* — metal tools clink and scrape; any Hand action with the toolkit in a
  Stealth scenario requires a Dex check to stay undetected
- **Material** *(master-forged steel, specialist blades)* — the improvise tool action produces
  an item that lasts the full scenario rather than a single scene
- **Masterwork** *(master craftsperson matching the character's specialization)* — improvise
  tool requires Hand ≥ 3 instead of ≥ 4; repairs made with these tools are permanent

### Fishing net *(Perc + Will — restrict)*
*A wide-mesh net for water-based food gathering or entangling prey.*
- **Boost** *(forage, Perc ≥ 2)* — deployed in any waterway, the restrict special traps prey
  passively without requiring an active hunting action
- **Boost** *(combat)* — thrown at a target, the restrict special entangles for one round
  without requiring a dedicated action to throw
- **Hinder** *(travel)* — wet and heavy after use; bulk increases by 1 in non-coastal terrain
  until dried during a camp stop
- **Hinder** *(combat)* — single use per scene; must be retrieved and reset before it can
  restrict again
- **Material** *(fine-woven silk thread, rust-proof rings)* — bulk stays at 2 even when wet;
  never requires a drying stop
- **Masterwork** *(expert fisher contact, Woodworking or Cloth specialization)* — the restrict
  special in combat holds for two rounds instead of one; the net can be retrieved without
  spending an action

---

## Basic Supplies

*Basic supplies are available to all characters without background gating. Items marked with
statistics generate a card for play; items without statistics provide narrative and logistical
benefits only.*

### Knife *(Dex + Hand — cut)*
*A small utility blade used mostly for cooking and fine work.*
- **Damage** *(cutting)* — hit reduces target Dex by 1; too small to add Might to attacks
  regardless of the character's Might level
- **Boost** *(Hand ≥ 2, forage)* — the cut special allows edible plants and caught game to be
  prepared immediately in the field; no camp stop required
- **Boost** *(exploration)* — cuts rope, leather, and light wood; counts as improvised tools for
  those tasks without requiring the Hand ≥ 4 action
- **Hinder** *(combat)* — too small for serious threats; Might cannot be added to knife attacks
  regardless of the character's actual Might level
- **Hinder** *(negotiation)* — even a kitchen knife on the table reads poorly; Char-based actions
  take −1 until it is put away
- **Material** *(quality folded steel, kept edge)* — Might of up to 2 may be added to knife
  attacks; the blade holds an edge and never requires sharpening between scenarios
- **Masterwork** *(blade smith contact, Cooking or Healer specialization)* — the cut special
  applies to hide and light armor as well as food; the negotiation penalty disappears when the
  knife remains sheathed

### Food
*Provisions for three days, shared or rationed as needed.*
- **Boost** *(camp)* — a full meal before rest grants one additional card draw at the start of
  the next scene
- **Boost** *(travel, Char ≥ 2)* — rations shared along the march lift morale; Char-based group
  actions gain +1 on a day when food is openly distributed
- **Hinder** *(forage)* — having food reduces urgency; Perc-based foraging actions lose +1
  because the hunger drive is absent
- **Hinder** *(travel)* — bulk 1 per three-day supply; long campaigns require regular restocking
- **Quality** *(salted, smoked, or preserved by Cooking specialist)* — lasts six days instead
  of three without spoiling; the camp card bonus rises to two draws when the meal is freshly
  prepared by a character with Cooking specialization

### Clothes
*An extra set of presentable clothing.*
- **Boost** *(market)* — presentable dress makes Char-based social actions credible; contacts
  are more willing to open up to someone who looks the part
- **Boost** *(negotiation)* — appropriate clothing signals respect; Tension rises 1 slower in
  formal or political settings when the party is well dressed
- **Hinder** *(exploration)* — fine clothes get ruined quickly in ruins, mud, or water; players
  may avoid certain actions to preserve them at the cost of tactical options
- **Hinder** *(forage)* — unsuitable for sustained outdoor exertion; Endu actions take −1 in
  wet or thorny terrain when wearing formal clothes
- **Quality** *(quality fabric, tailored to the wearer)* — the market and negotiation bonuses
  extend one additional scene after the scenario when meeting the same contacts; the clothes
  survive moderate exploration without being ruined

### Leather repair
*A small kit that restores leather gear. Will be used up.*
- **Boost** *(camp, Hand ≥ 2)* — fully restores leather armor or any leather item's special
  before the next scene; damaged protection regains full effectiveness
- **Boost** *(travel)* — keeping leather gear functional prevents the −1 Endu penalty from worn
  equipment accumulating over a long march
- **Hinder** *(camp)* — consumed on use; once spent, leather armor loses its special until the
  group reaches a market
- **Hinder** *(travel)* — cannot be improvised; the group must plan resupply or face degraded
  armor for the rest of the campaign leg
- **Quality** *(master-tanned leather, waxed thread, specialist awl)* — the kit has two uses
  instead of one; also restores light chainmail, not only leather

### Tent
*Personal shelter for one, providing reliable rest in exposed conditions.*
- **Boost** *(camp)* — provides shelter regardless of weather; Sleeper and Relaxed powers each
  gain +1 to their effectiveness when a tent is pitched
- **Boost** *(camp)* — a dedicated shelter allows the watch rotation to rest fully; Lookout watch
  actions do not impose a fatigue penalty on the sleeping party
- **Hinder** *(stealth)* — a pitched tent is visible from a distance; breaking camp costs one
  full action and cannot be done quietly
- **Hinder** *(travel)* — bulk 2 per tent; a full party's tents consume substantial carry space
- **Quality** *(oiled canvas, sealed seams, quick-stakes)* — Sleeper and Relaxed bonuses rise
  to +2; a character with Camp power at level 2 or higher pitches or breaks the tent without
  spending an action

### Bedroll
*A padded sleeping mat that improves rest quality anywhere.*
- **Boost** *(camp)* — restores one additional point of any reduced stat when the character
  sleeps with a bedroll; the body recovers more completely
- **Boost** *(travel)* — a brief halt with the bedroll unrolled counts as a partial rest; fatigue
  from a forced march accumulates more slowly
- **Hinder** *(travel)* — bulk 1; small alone but adds up across a full party over long marches
- **Hinder** *(stealth)* — rolling out and securing the bedroll takes a full action and cannot
  be done quietly
- **Quality** *(wool-stuffed or down-filled, fitted cover)* — the stat restoration bonus doubles
  to two points; the partial-rest travel benefit applies to two stats instead of one

---

## Consumables and Accessories

### Potion *(Will + Endu — restore)*
*An alchemical draught that stabilises and revives.*
- **Boost** *(combat)* — the restore special removes one active wound penalty immediately; the
  character acts on their next turn at full statistics
- **Boost** *(camp)* — consumed before a full rest, the potion restores 1 point of maximum Endu
  lost to mortal wounds; this is the only effect that repairs mortal wound damage outside of
  DM-granted extended recovery
- **Hinder** — consumed on use; each potion is a single dose and requires market access or a
  Healer contact to resupply
- **Hinder** *(travel)* — glass containers break under hard falls or blunt impacts; Charge or
  heavy blows against the carrier risk losing the dose
- **Quality** *(master alchemist or Healer specialization)* — the restore special removes two
  wound penalties instead of one; does not require a full camp stop to take effect

### Bandages *(Hand + Endu — bind)*
*A roll of clean cloth for wounds that cannot wait.*
- **Treats** — removes one accumulated stat reduction from any damage type; applied after the hit,
  restoring the lost stat point
- **Boost** *(combat, Hand ≥ 2)* — the bind special applied mid-fight prevents a fresh wound
  from reducing a statistic before the scene ends; stabilises without healing
- **Boost** *(camp)* — proper binding during rest accelerates recovery; the character regains one
  additional stat point over a night of rest
- **Hinder** *(combat)* — requires one full action and a free hand; cannot be applied while the
  character is also defending
- **Hinder** — limited supply; three uses before resupply is needed at a market or Healer contact
- **Quality** *(prepared by Healer specialization, clean and pre-cut)* — five uses instead of
  three; the bind special in combat costs no action when applied by a character with Healer

### Ring *(Will + Char — ward)*
*A fitted band worn on the finger; each carries a single focused property.*
- **Protects** *(draining, fire, cold, electric, radiant — ward)* — ward special absorbs one
  magical or elemental hit per scene before stat reduction occurs
- **Boost** *(negotiation)* — the ward special adds quiet presence; Will contributes to Char
  totals in formal settings when the ring is visible
- **Boost** *(combat)* — activated once per scene, the ward absorbs one magical attack or power
  targeting the wearer without requiring a defense roll
- **Hinder** — only one ring per hand contributes stats; a second ring on the same hand cancels
  both until one is removed
- **Hinder** *(market)* — a conspicuous ring signals wealth; merchants open negotiations 1 higher
  in price when the ring is clearly visible
- **Material** *(silver or enchanted metal)* — the ward also functions against non-magical
  attacks; activates twice per scene instead of once
- **Masterwork** *(jeweler with Jeweler specialization)* — Will threshold for ward drops by 1;
  the market price-raise hinder no longer applies

### Bracelet *(Dex + Speed — quicken)*
*A fitted band for the wrist that keeps movement fluid and responsive.*
- **Boost** *(combat)* — the quicken special grants +1 to the first action of the round; the
  wearer always moves before unequipped opponents
- **Boost** *(stealth)* — Dex-based actions in confined spaces gain +1 from the ease of movement
  the bracelet provides
- **Hinder** *(stealth)* — metal bracelets clink against weapons and surfaces; detection checks
  against the wearer gain +1 unless the bracelet is padded or covered
- **Hinder** *(negotiation)* — visible jewellery signals class differences; Char-based actions
  take −1 in settings where wealth reads as threat or arrogance
- **Material** *(bone or woven sinew)* — removes the Stealth detection hinder entirely;
  functionally silent on the wrist
- **Masterwork** *(jeweler or artisan, Dex specialization taught)* — quicken extends to the
  second action in the round; the negotiation hinder no longer applies

### Earring *(Perc + Char — attune)*
*Small jewellery that marks cultural identity and sharpens the wearer's attention.*
- **Boost** *(market)* — the attune special reads subtle emotional cues in conversation; Char
  actions to find information or open a contact gain +1
- **Boost** *(stealth)* — awareness of surrounding sound is sharpened; Perc-based detection of
  approaching threats gains +1 without spending an action
- **Hinder** *(combat)* — a critical blow near the head removes the earring's bonus until it is
  repaired or resettled during a camp stop
- **Hinder** — attuning takes time; the bonus does not apply in the first scene of a new scenario
  until the wearer has had a moment to settle
- **Material** *(carved resonant bone or engraved horn)* — attunement settles immediately,
  removing the first-scene hinder; also provides +1 to Hearing power actions
- **Masterwork** *(jeweler with Char or Perc specialization)* — attune applies in negotiation as
  well as market; emotional cues are readable across any social scenario

### Medallion *(Will + Might — authority)*
*A worn symbol of rank, allegiance, or divine mandate.*
- **Boost** *(negotiation)* — the authority special makes claims of office or standing credible;
  Might contributes to Char totals when the medallion's backing is relevant to the discussion
- **Boost** *(market)* — visible rank shifts the opening dynamic; contacts who recognise the
  symbol open negotiations 1 lower in price and 1 faster in trust
- **Hinder** *(stealth)* — the medallion catches light and marks the wearer; all Stealth actions
  take −1 unless it is concealed under clothing
- **Hinder** *(negotiation)* — if the authority represented is challenged or unknown, the special
  backfires; Tension rises by 1 instead of aiding the action
- **Material** *(gold-cast or bearing a genuine seal)* — the authority special is rarely
  challenged; Tension only rises if the other party specifically pursues the challenge
- **Masterwork** *(master jeweler, commissioned by a noble or religious contact)* — the market
  bonus extends to all contacts in the same faction or region; the Stealth penalty applies only
  when the medallion is uncovered and visible

---

## Special Materials

Special materials are rare components found through exploration, foraging, and contacts. They
cannot be purchased at market. A Crafter with appropriate Tools can work them into a target
item during a camp scenario — see [RULES.md — Crafting](RULES.md#crafting) for the mechanic.
Each material replaces or extends the target item's **Material** line when successfully crafted.

### Volcanic iron *(fire — forge)*
*Heat-hardened ore pulled from the throat of a dormant volcano; no forge can temper it further.*
- **Effect** — items worked in volcanic iron do not rust, corrode, or warp from heat or flame
- **Weapon** — a successful hit also deals fire damage (Endu −1) once per scene
- **Armor** — fire damage against the wearer is reduced by 1 in addition to normal mitigation;
  fire weather does not impose sustained-exertion penalties on the wearer
- **Accessory** — fire-aspected powers used by the bearer gain +1 to their action total
- **Found** *(common)* — Gather in volcanic terrain; mining contacts in Bockthicket or Rosepond

### Greenwood *(wood — grow)*
*A living branch cut from a tree still in growth, dried in open air without ever fully dying.*
- **Effect** — creature abilities that sunder or destroy items fail; the item regains any lost
  special at the end of each scene rather than only at camp
- **Weapon** — the weapon's special cannot be removed by creature abilities; staffs and spears
  crafted from greenwood are unbreakable
- **Armor** — regains its protection special after each scene; wet-condition stiffening does
  not apply
- **Accessory** — in forage and camp the bearer may use one Druid-equivalent action per scene
  without the power, gathering or calming as if holding it at level 1
- **Found** *(common)* — Gather in ancient forests; Druid contacts; ruins near Raft city

### Hearthstone *(stone — anchor)*
*Dense quarried stone smoothed and tempered in a kiln; it absorbs force without fracturing.*
- **Effect** — bulk increases by 1; the item absorbs one blunt hit per scene before that hit
  reaches the bearer's statistics
- **Weapon** — blunt damage dealt bypasses the armor special of targets who are stationary or
  cornered at the moment of the strike
- **Armor** — blunt mitigation increases by 1; the first blunt hit per scene that would deal
  Might −2 is reduced to Might −1
- **Accessory** — Speed-reducing grab effects require 1 additional grab-damage point to apply
  to the bearer
- **Found** *(common)* — Gather in quarries and ruins; Miner contacts in Clear water or World
  edge; rubble in Exploration scenarios

### Windbone *(air — carry)*
*Hollow bone from a creature of the high peaks, dried by sustained wind until nearly weightless.*
- **Effect** — the item's bulk drops by 1 (minimum 0); Speed actions while this is the only
  carried weapon or tool take no encumbrance penalty
- **Weapon** — thrown range doubles and does not cost an extra action; ranged weapons with
  windbone shafts ignore the −1 wind penalty in air/storm weather
- **Armor** — the armor's Stealth penalty drops by 1; the wearer's Speed is not reduced for
  march pace calculations
- **Accessory** — the item can be drawn or stowed without spending an action; it creates no
  noise on its own
- **Found** *(rare)* — Gather at mountain peaks after a storm; Hunter contacts; cliff ruins and
  old aeries in Exploration scenarios

### Coldsteel *(iron — edge)*
*Ore pulled from the permafrost of the northern seams; no forge fully warms it.*
- **Effect** — cold weather conditions do not impose Speed penalties on the bearer; the item
  retains its edge or form in extreme cold without maintenance
- **Weapon** — a successful hit also deals cold damage (Speed −1) once per scene
- **Armor** — cold damage against the wearer is reduced by 1; the armor does not stiffen or
  restrict movement in cold conditions
- **Accessory** — fire-weather heat penalties are reduced by 1 for the bearer while worn or
  carried
- **Found** *(rare)* — mining contacts in Cliffside hold or Bockthicket; northern ruins near
  Chatter Creek; Gather in permafrost terrain

### Deepwater glass *(water — flow)*
*Volcanic glass formed where lava met ocean depth; impossibly clear and never shatters.*
- **Effect** — the item cannot be broken by physical force alone; sundering and destruction
  creature abilities do not affect it
- **Weapon** — wound and cripple specials persist for one additional scene; water-aspected hits
  from this weapon ignore the target's armor special
- **Armor** — wet conditions and flooding impose no penalties; the armor functions fully in
  water without movement restriction
- **Accessory** — containers of deepwater glass never break; potions stored in it remain potent
  for twice as long before requiring resupply
- **Found** *(rare)* — Fisher contacts in Linar harbour; submerged ruins near Lastwater;
  retrieved by characters with the Swimmer power from deep water

### Shadowsilk *(dark — veil)*
*Thread woven in lightless caves from spider silk that absorbs sound and swallows light.*
- **Effect** — detection checks targeting the bearer gain −1 when this is their only visible
  equipment; the item reflects no light and creates no noise
- **Weapon** — sneaking and stealth specials activate even when the bearer is partially visible;
  no light-catching penalty applies
- **Armor** — the armor's Stealth penalty drops to 0; the wearer moves silently unless
  taking Speed actions at full sprint
- **Accessory** — the item is visually absent in moonless-night or heavy-fog conditions; the
  bearer cannot be identified by sight alone while wearing it
- **Found** *(rare)* — cave exploration; Back alley contacts; ruins with undercrofts in
  Blackwood freehold or Rakeville

### Stormweave *(surge — charge)*
*Cloth charged by repeated lightning strikes during a true storm; it crackles with latent force.*
- **Effect** — once per scene the stored charge may be released as a free action, granting +1
  to the bearer's next action total on the same turn
- **Weapon** — a hit also deals electric damage (Perc −1) once per scene; the charge resets at
  the start of each new scene
- **Armor** — electric damage against the wearer is absorbed once per scene; on absorption the
  charge discharges back, imposing −1 on the attacker's next action
- **Accessory** — in surge or iron weather the stored charge resets every round instead of
  once per scene
- **Found** *(rare)* — storm-struck ruins; Shamanic or Druid contacts who work with storm
  spirits; ruins near Gap city where lightning walks the shifting lands

### Suncrystal *(light — reveal)*
*Crystalline stone formed at desert noon, shaped by artisans who work only in direct sunlight.*
- **Effect** — once per scene the item illuminates a hidden mechanism, concealed passage, or
  disguised creature as a free action with no action cost
- **Weapon** — a hit also deals radiant damage (Will −1) once per scene; invisible or disguised
  creatures struck are revealed until the end of the round
- **Armor** — the wearer cannot be rendered invisible or disguised by external effects; light-
  aspected attacks do not penetrate the armor's mitigation
- **Accessory** — in light weather the reveal action costs no scene charge; Lookout gains +1
  when the bearer holds or wears suncrystal
- **Found** *(legendary)* — desert ruins in Fata morgana; Scholar contacts with deep historical
  knowledge; mountain summits in Exploration at noon

### Heartwood *(life — sustain)*
*The core of an ancient tree that died willingly; warm to the touch and still breathing, barely.*
- **Effect** — at the end of each scene the bearer restores 1 point to their most-reduced stat
  without requiring a rest action
- **Weapon** — a hit drains the target (Will −1 as draining); the drained point may instead
  be redirected to restore 1 stat point in any ally within reach
- **Armor** — full rest restores 1 additional stat point; the tent bonus from full rest applies
  even when sleeping without a tent while this armor is worn
- **Accessory** — Bandages and Potions used on the bearer restore 1 additional stat point; the
  Blood power near the bearer may target Endu instead of Will
- **Found** *(legendary)* — deepest old-growth near Raft city; high-level Druid contacts;
  sacred groves in Exploration scenarios linked to Ascetic or Monastery backgrounds

### Veilthread *(veil — misdirect)*
*Woven from morning fog gathered at an old crossroads; it holds misdirection in its fibres.*
- **Effect** — once per scenario the bearer may declare their position uncertain; for one scene
  Perc-based actions targeting them require one additional success to locate them
- **Weapon** — a successful hit leaves a misleading wound impression; the target's nearby
  allies misread the source and redirect their next action away from the true attacker
- **Armor** — the wearer's identity cannot be confirmed by sight; they may pass as a different
  character type once per scenario without a Char check
- **Accessory** — Stealth scenarios treat the bearer as starting with 1 fewer detection point
  against them; the Sly power gains +1 when this is worn or carried
- **Found** *(legendary)* — fog marshes at dawn near Lastwater; Fox or Raccoon contacts with
  Sly specialization; ruins at old crossroads in Exploration scenarios

### Ironwood *(iron — endure)*
*Wood from a tree that grew around a vein of iron ore over centuries; the grain is fused with
metal and resists every tool. The white city's mage craftspeople were the last to work it at
scale. Fragments surface occasionally in the ruins they left behind.*
- **Effect** — the item cannot be broken by physical force and does not degrade from normal use;
  the Brittle and Degraded flaws cannot apply to ironwood items; bulk increases by 1
- **Weapon** — once per scene the weapon's impact carries the iron special (determination,
  inflexibility): the target cannot be moved, repositioned, or disarmed for the rest of the
  round; the weapon does not consume on the first use of any scene-limited special
- **Armor** — armor and shield specials activate twice per scene instead of once; the armor's
  bulk penalty to Speed is halved
- **Accessory** — the item functions as a focus for iron-aspected powers; Will checks made
  while holding it gain +1; the item also functions as an improvised weapon (blunt, Might +1)
  regardless of its primary form
- **Found** *(legendary)* — the blasted lands and ruins of white city construction; fragments
  in the deepest mage castles; Haven — the independent puppets carry knowledge of where old
  ironwood was worked and may share it with those they trust

### Ashbone *(decay — erode)*
*Calcified bones of the old world, pulled from the deepest ruins; they crumble and contaminate.*
- **Effect** — the item inflicts the decay condition on contact; a target struck or touched
  takes −1 to their next action as the effect erodes their focus
- **Weapon** — a hit deals additional draining damage (Will −1) that continues once per scene
  until treated; Bandages or the Blood power stop it, time alone does not
- **Armor** — the armor absorbs the first ongoing effect per scene directed at the wearer;
  the eroding quality dissolves the damage before it settles into the stat
- **Accessory** — once per scene the bearer can apply the decay condition to an object — a
  lock, a rope, a mechanism — causing it to fail on its next use without a Hand check
- **Found** *(legendary)* — deepest ruins in Exploration scenarios; Miner contacts near
  Rosepond or World edge; ruins beneath Steadington where old things have decayed for centuries

---

→ Back to [RULES.md](RULES.md) | See also [STATISTICS.md](STATISTICS.md) and
[POWERS.md](POWERS.md).
