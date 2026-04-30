# Card Art — Flux Prompts

Prompts for generating NPC portraits and location illustrations as card art via
**Flux** (Flux.1 Pro for hero cards, Flux Dev for batch fills). Pair with the
batch pipeline pattern in [DEVELOPER_ART.md](DEVELOPER_ART.md) §"Races and
Creatures — AI Tool Generation"; Flux replaces Meshy for 2-D card art.

This is **developer art**: placeholder card images so the deck reads while final
art is being made. Same swap-rule as the rest of `DEVELOPER_ART.md` — when real
art lands, replace the file by index; the prompts are not the deliverable.

---

## House style — the consistency anchor

Prepend the **style anchor** to *every* prompt. It is what makes the deck look
like one set instead of thirty unrelated images.

```
STYLE_NPC = "painterly digital illustration, hand-drawn ink line work under
soft gouache and watercolour wash, muted earthy palette of ochre, moss, slate
and rust, warm low-key lighting, low-fantasy medieval setting in the style of
a tabletop RPG character card, head-and-shoulders portrait, three-quarter
angle, neutral parchment-toned background with subtle paper grain, no text,
no border, no logo"

STYLE_LOC = "painterly digital illustration, hand-drawn ink line work under
soft gouache and watercolour wash, muted earthy palette of ochre, moss, slate
and rust, atmospheric low-fantasy medieval setting in the style of a tabletop
RPG location card, wide establishing three-quarter view, soft natural light,
no figures unless noted, no text, no border, no logo"
```

For every prompt below, the final string sent to Flux is:

```
<STYLE_NPC or STYLE_LOC>, <prompt body>
```

### Negative prompt (use on every call)

```
photorealistic, photograph, 3d render, octane, unreal engine, anime, manga,
chibi, modern clothing, neon, cyberpunk, watermark, signature, text, letters,
border, frame, deformed hands, extra fingers, blurry, low contrast, cluttered
background
```

### Aspect ratio and seeding

| Card type | Ratio | Notes |
|---|---|---|
| NPC portrait | 3:4 (768×1024) | Bust composition, character centred |
| Location card | 4:3 (1024×768) | Establishing shot |
| Tower card | 3:4 (768×1024) | The tower is vertical; favour portrait |

Use a **fixed seed per character/place** (`hash(name)`) so re-runs after a
prompt edit produce comparable variants instead of new strangers.

### Anthro vs. natural-animal note

Moros uses **anthropomorphic animal-folk** as PC and NPC races (16 of them; see
`doc/claude/RULES.md`). Every animal-named NPC below is a *bipedal humanoid*
with that animal's head/fur/features, wearing humanoid clothing, holding tools
in hands — never a quadruped. Flux will obey this if the prompt is explicit;
"badger innkeeper" alone tends to produce a real badger, so always say
"anthropomorphic" or "humanoid X-folk" and name the clothing.

---

## NPC prompts

### Ancient powers still active

**Laurent** *(demi-lich; floating skull in his crashed flying castle)*
```
a floating bare human skull with twin small flames burning in its eye
sockets, suspended above a tall stone chair, an illusory shadow shaped like
a robed seated mage filling the chair below it, the shadow's hands raised
in a gesture mid-incantation, dim ember-orange light, dust in shafts of
light from above, ruined alcoves with motionless wooden puppets in the
background
```

**Felicia** *(great spirit; patron of the hill country)*
```
the spectral image of a kindly middle-aged human woman in plain woollen robes,
translucent and made of soft golden hill-light, her form blurring at the edges
into mist and barley-stalks, a faint corona around her head, hands open at
her sides as if listening
```

### Historical / accessed via records

**Narissa** *(the First Mage; long dead — depict as a diary illustration)*
```
a stylised hand-painted manuscript illumination of a young human woman
mage in early-medieval scholar's robes, holding a quill above an open book,
faint geometric arcs around her head, the page edges yellowed and worn,
shown as a leaf from an old diary rather than a portrait
```

**Thorgal** *(overseas mage, killed by John Bean; haunts a scrying mirror)*
```
the partial reflected face of a stern bearded human mage trapped within an
ornate dark-wood scrying mirror, his expression frozen mid-shock, broken
glass cracks radiating from one eye, dim sea-green light bleeding from
within the mirror, the mirror frame carved with foreign-coast motifs
```

### Overseas

**Raul** *(ox-tauren war-band leader; survived the war)*
```
an anthropomorphic minotaur-like ox-headed warrior with broad horns, dark
hide, a heavy braided beard of coarse hair under his jaw, weather-darkened
leather harness and a single overseas military pauldron, his expression
weary rather than angry, a long campaign-scar across one cheek
```

### Royal house of Allondo

**King Hannes** *(captured in the last war; carries unspoken debt)*
```
a tired middle-aged human king of low-fantasy Allondo, short greying beard,
modest gold circlet rather than a heavy crown, plain dark green doublet
trimmed with iron rather than gold, his hands resting on a council table,
the bearing of a man who survived captivity and never quite recovered the
performance of kingship
```

**Queen Fienna** *(queen consort; non-royal Leatherman forge-daughter)*
```
a strong-handed human woman in her thirties, queen consort of Allondo, her
hair pinned back simply, wearing a deep-red gown of practical cut with
visible faint forge-burn scars on her forearms, a small iron ring on a
chain at her throat, her gaze steady and assessing
```

**Prince Corven** *(crown prince; martial heir; secretly in love)*
```
a tall human crown prince in his late twenties, dark hair, deliberately set
jaw, training-yard leathers under a half-buckled royal tabard of Allondo
(forest green and iron-grey), one hand resting on a sword hilt, his
expression carrying a private grief he is hiding from the room
```

**Didrich** *(second prince; quiet would-be druid)*
```
a slim bookish human prince in his early twenties, second son of Allondo,
dressed in plain travel clothes rather than court dress, dirt under his
fingernails, a small leather satchel of dried herbs at his hip, looking off
to one side, the air of a young scholar uncomfortable in a uniform
```

### Royal house of Brumal

**Princess Penelope** *(trained in jewelry at Fata morgana; secret love)*
```
a young Brumal princess in her early twenties, warm-toned skin, dark hair
braided with fine wire, dressed in pale Brumal court silks softened by a
desert-dyed wrap, fine intricate Fata-morgana jewelry at her ears and
throat, holding a half-finished filigree pendant in careful fingers, soft
focused light on her hands
```

### The Bean family and their circle

**John Bean** *(Tusk Clan boar folk; ironwood arm; retired farmer)*
```
an anthropomorphic boar-folk man with greying tusks, broad shoulders, wearing
a worn farmer's leather apron over homespun, his right arm replaced from the
shoulder with a dark grained ironwood prosthetic carved with old mage-
sigils, the wooden hand articulate and posed mid-gesture, the air of a man
who has chosen the field over the front line
```

**Irna Bean** *(Tusk Clan boar folk; John's daughter; ex-convict)*
```
a humanoid bipedal woman warrior in her early twenties, of the Tusk Clan
boar folk — a humanoid race with a fundamentally human face and human body
proportions, distinguished by two small ivory upturned tusks at the corners
of her mouth, a slightly broader and shorter nose, faintly bristly dark
side-burns, and small tufted ears; she stands upright on two legs with
ordinary human hands; she is NOT a real pig and NOT a quadruped; her
build is the athletic frame of a miner-turned-traveller; dust-stained
miner's leathers under a heavy charcoal traveller's coat, fingerless
leather gloves on broad calloused hands, a hand-axe at her belt; on her
left wrist a plain iron shackle-band engraved with the Allondan crown's
crest, the metal kept on deliberately as a sign of defiance; a large
grey-muzzled hound pressed protectively against her thigh, the dog's ear
just below her hip; her gaze level and unflinching, a faint healing
redness still on her cheekbones from a recent illness, dawn light on her
face
```

**Ron Bean** *(unhappy conscript)*
```
a young anthropomorphic boar-folk man in plain Allondan green-and-iron
soldier's livery, helmet under his arm, his tusks still small for his age,
the standard kit fitting him poorly, his expression more homesick than
martial, the calluses on his hands more farmer than fighter
```

**Lady Rhianna Linthrope** *(white-mouse-folk priestess/crafter, war medic)*
```
an anthropomorphic small-statured white-mouse-folk woman, fine pale fur,
upright bearing, court priestess robes of muted blue with surgical leather
practical-bracers under the sleeves, an iron-and-wood medical kit at her
belt, her posture composed and a little forbidding, intelligent dark eyes
```

**Felix** *(raccoon-folk scout; opening-finder)*
```
a wiry anthropomorphic raccoon-folk man, dark mask-fur around bright eyes,
ringed tail visible, dressed in dark scout's leathers and a soft cap, mid-
motion as if half-turning to slip away, a rolled set of lockpicks tucked at
his hip, unkempt and grinning
```

**Father Elliot** *(Abbot of Luchebert; former crown prince)*
```
an older human monk in his sixties, abbot of a small hill-country monastery,
short cropped grey hair, plain undyed wool habit with a knotted leather belt,
the faintest old royal carriage in the way he holds his shoulders, his
hands those of a man who has walked far for many years
```

**Willow** *(old rabbit-folk granny; shrine tender)*
```
a very old anthropomorphic rabbit-folk woman, soft greying fur, long ears
slightly drooping, in a faded green woollen shawl over a workworn smock,
holding a small lit tallow candle in cupped hands, the warm light catching
her whiskers, her expression patient and entirely unimpressed by strangers
```

### Elmsfield locals

**Elder Diederik** *(owl-folk elder; excommunicated druid)*
```
an anthropomorphic owl-folk elder, tawny-and-cream feather plumage around a
sharp face, a circle of dark druid-green feathers at his throat, dressed in
a simple bark-brown robe with a worn travelling staff, perched at the edge
of a high tree-house balcony with carved ironwood railings, dawn light
behind him
```

**Innkeeper Bridget** *(badger-folk; runs the Inn inside the great ironwood)*
```
a stout anthropomorphic badger-folk woman in her late forties, distinctive
black-and-white facial striping, a leather apron over a russet wool dress,
her sleeves rolled up, holding a small piece of chalk near a slate ledger
covered in tallies and unusual marks, lantern light on her face, the curved
inside of a hollow ironwood tree visible behind her
```

**Wilfred** *(badger-folk; Bridget's husband; almost-blacksmith)*
```
an anthropomorphic badger-folk man in his fifties, kind eyes, a heavy
leather smithing apron stained with soot, hammer in one hand, a horseshoe
cooling on the anvil beside him, the modest smithy of a rural town behind
him rather than a large forge, his shoulders thicker than a farmer's
```

**Farmer Joseph** *(raccoon-folk; post-war refugee; Session 1's reluctant
antagonist)*
```
a tense anthropomorphic raccoon-folk man, dark mask-fur, dressed in worn
homespun and a patched cloak, holding a sling and a stone in white-knuckled
hands, his eyes wide with memory rather than malice, autumn dusk light, the
pickets of a frontier farm fence behind him
```

**Hank (Hanny)** *(rabbit-folk farmer presenting male; orphanage; druid)*
```
a wiry anthropomorphic rabbit-folk farmer in their forties presenting
masculine, soft brown fur, a worn green druid-cloak over patched farmwear, a
string of dried herbs and a small rough notebook tucked at the belt, two
small mixed-folk orphan children peeking from behind their leg, the open
gate of a refugee farm in the background
```

**Egbert** *(wolf-folk concealed as something lesser; Hank's partner)*
```
an anthropomorphic figure who reads at first glance as a slim, jittery
mouse-folk farmhand with pale fur and faintly trembling hands, but whose
eyes catch the firelight a beat too long with a wolf's reflective shine, and
whose long fingers and quiet posture do not match the projected frame, dusk
behind her at a fence-line
```

**Corné Dunham** *(badger-folk; valley guide)*
```
a weather-worn anthropomorphic badger-folk man in his fifties, the standard
black-and-white face stripes, dressed in oiled-canvas hill-walker gear with
a coiled length of rope over one shoulder, a tall walker's staff topped with
an iron ferrule, leaning into a steep grass slope, hill country behind him
```

**Ralph Overhill** *(young badger-folk; animal handler)*
```
a young anthropomorphic badger-folk man, perhaps eighteen, stable apron over
homespun, a halter rope in one hand and a curry comb in the other, a calm
working horse's nose visible at his shoulder, his expression that of someone
more comfortable with mounts than with people
```

### The Lake of Tears and the towers

**The Pot-Boy** *(small experimental pot-person construct)*
```
a small knee-height humanoid construct of dark-fired clay and iron bands,
the body an actual rounded cooking pot-shape on stubby legs with hinged
clay arms, no mouth and round riveted eyes, posed motionless mid-room as if
trying to pretend it is just a pot, a small chisel and a worn straw broom
forgotten in its grip beside it, dust motes in low workshop light
```

**The Furnace** *(the larger pot-person at the buried tower's heart)*
```
a vast iron-banded ceramic furnace-being squatting in the centre of an
underground stone chamber, its body an enormous closed pot a person could
fit inside, four short stubby clay legs splayed beneath it, the central
opening glowing with banked orange coals, thin smoke leaking from a vent at
the top, the form unmistakably a being and not a machine
```

**The Hermit Shaman / Gerhald** *(otter shaman of the hill blood-tower)*
```
an anthropomorphic otter-folk shaman, sleek dark fur with grey at the
muzzle, draped in layered hide and beaded shaman's regalia, a small bound
spirit visible as a translucent animal-shape coiled around his shoulders,
seated cross-legged on the stone floor of a tall wizard's tower with one
narrow blood-red painted slit-window behind him
```

**The Storm Mage** *(broken-minded old storm-mage of the Lightning Tower)*
```
a hollow-eyed elderly human mage with wild white hair standing in tufts,
soot-stained sky-blue robes hanging on a thin frame, half-burnt copper-wire
amulets tangled at his throat, his fingers twitching through old casting
gestures with no working behind them, distant low storm-clouds and a
hovering metal-spiked tower visible far behind him
```

### The wilds

**Tod** *(chaos spirit wearing a dead fox-folk boy's body)*
```
a small anthropomorphic fox-folk boy of perhaps ten, russet fur and white
muzzle, wearing a plain forest tunic that fits oddly, his posture and
expression off in a way that is hard to name — a slight wrongness in how
he holds his hands, an almost-correct smile, his eyes catching too much
light, twisted bark-warped trees of the forbidden woods behind him
```

### Wanderers and drifters

**Brother Darrel** *(beaver-folk former-sergeant; staff-fighter monk)*
```
a broad-shouldered anthropomorphic beaver-folk man in plain undyed monk's
robes belted with rope, the flat tail visible behind him, holding a long
hardwood walking-staff at rest, his hands marked by old soldier's calluses
the robes do not hide, his face calm with the deliberate calm of someone
who has unmade himself once already
```

**Eric Randell** *(fox-folk farmer with a flock of birds; secret druid)*
```
an anthropomorphic fox-folk man in his thirties, russet fur with a pale
chest, dressed as an unassuming small-holder in patched homespun and a
straw-ish wide-brim hat, a tall flightless dromo-bird at his side and two
smaller fowl pecking near his boots, a faint druid-green ribbon almost
hidden at his wrist
```

**Nadine** *(finch-folk trader from Raft city; aerial messenger)*
```
a slight, bright-eyed anthropomorphic finch-folk trader, vivid yellow-and-
black plumage, neat dark traveller's vest hung with small message-tubes
and trader's tags, a folded map in one hand, leaning forward with the
half-folded wings of an aerial messenger, the warm glow of a town-square
lantern catching her feathers
```

### World Edge

**Master Darius** *(badger-folk forge-master; volcanic mining city)*
```
an anthropomorphic badger-folk forge-master in his sixties, the iconic
striped face soot-darkened, a heavy leather forge-apron scarred by years of
sparks, a hammer in one calloused hand, his other hand resting on a
half-finished iron piece on the anvil, behind him the orange-lit interior of
a serious volcanic-region forge with multiple apprentices' bellows
```

**Remi** *(rat-folk factory worker; expelled from World Edge)*
```
a thin anthropomorphic rat-folk man in his late twenties, dark fur, weary
eyes, dressed in road-worn factory-issue work clothes patched at the
shoulders, a folded letter clutched carefully in one hand, a small roadside
pack at his feet, the air of someone walking out of a city he was told to
leave
```

---

## Location prompts

### Allondo

**Scarlet Vale** *(capital)*
```
the capital city of Allondo seen from a green hill above, low-fantasy
medieval, walled inner keep with a slate-roofed great hall and a tall
training-yard tower, terracotta-roofed merchant streets spiralling down to
a riverside market, banners of forest green and iron grey, autumn light,
the hills of central Allondo behind it
```

**Blackwood Freehold** *(Bean farm; agricultural)*
```
a quiet agricultural valley in Allondo, a modest stone-and-thatch farmhouse
beside a thicket of dark-wooded trees giving the freehold its name, neat
fields of barley and turnips bordered by dry-stone walls, a pair of working
oxen at the field edge, late-afternoon golden light, no figures
```

**Clear Water** *(crown mining town)*
```
an Allondan mining town set into a treeless ridge under a grey sky, raw
slate-roofed barracks beside a fenced mine-mouth, ore-cart tracks running
out from the shaft, a watch-tower flying the Allondan green-and-iron, the
ground around the town hammered bare by boots and carts, a hard
institutional feeling
```

**Chatter Creek** *(northern border town)*
```
a small wooden-palisade border town beside a fast shallow creek under
northern pines, a single watch-outpost on a low rise, log buildings with
mossy roofs, a few horses tied at a hitching rail, dawn fog rising off the
water, a road leading out into the tree-line
```

**Rakeville** *(roadside village)*
```
a quiet southern-Allondan village along a packed-earth trade road, a
handful of plaster-and-timber houses with red-clay roofs, a small
roadside chapel, a single inn with a faded painted sign, late-summer dust
in the air, low rolling fields beyond
```

### Brumal

**Cliffside Hold** *(capital of Brumal)*
```
the Brumal capital built up against a tall sheer pale-stone cliff, white-
washed walls and slate roofs stepping up the cliff face to a high keep,
narrow stone stairs zig-zagging between layers of the city, banners in
Brumal blue and bone-white, the dust haze of an advancing southern desert
visible far on the horizon, late afternoon
```

**Bockthicket** *(Brumal mining town)*
```
a Brumal mining town wedged in a thicketed valley, dense hawthorn-and-
blackthorn hedgerows around the outskirts, smoke-blackened mine buildings
of dark timber, a long ore-tip glittering with low-grade slag, a low overcast
sky, the air of a working town that is hanging on
```

**Steadington** *(village swallowed by desert)*
```
the half-buried ruins of a Brumal village being eaten by southern desert,
roof-peaks and a chimney sticking out of dunes, the broken stone arch of
a village gate half-submerged in pale sand, dry wind, a single ragged
banner-pole still standing, the sky a hot dust-colour, no figures
```

### The shared border

**Elmsfield** *(independent wilderness town around the great ironwood)*
```
a small wilderness town built in a rough ring around an enormous ancient
ironwood tree whose dark trunk dwarfs every building, the trunk itself
hollowed out at the base and fitted with a heavy plank door (the inn), low
log-and-thatch houses clustered around it, a ring of split-rail fence at
the town edge, the great swamp visible in the distance to the south, dawn
mist
```

### The Lake of Tears region

**The Great Swamp and the Lake of Tears** *(wetlands ringed by six towers)*
```
a vast misty wetland ringed at its centre by a still grey lake, six
narrow stone wizard's towers of foreign architecture standing at uneven
intervals around the water, one tower half-buried in pale dune-sand, the
air shimmering faintly above the lake's centre, crystalline pale-blue
fungal growths spreading outward from the shore through the reeds, low
overcast light
```

**The Buried Tower** *(furnace tower; mostly under sand)*
```
a narrow stone wizard's tower three-quarters buried in pale drifting
sand, only its upper third and chimney visible, the chimney venting a
lazy plume of dark smoke and hot air that has scoured a clear ring around
the tower in the spreading crystalline fungus, the rest of the tower's
walls crusted with the same fungus, marsh-light, no figures
```

**The Volcano Tower**
```
a stone wizard's tower built in the rough conical shape of a small volcano,
heat-shimmer rising from its open rim, embers and bright-orange firelight
visible inside the cone, scorch-marks fanning down the outer walls, a thin
crescent of marsh-water at its base, ash drifting on the wind, no figures
```

**The Darkness Tower**
```
a squat dark-stone wizard's tower with a pitch-black archway entrance that
seems to swallow the surrounding light, the grass and reeds within several
paces of the door yellowed and dying, the stone of the walls inlaid with
a faint mosaic of light-and-dark tiles only suggested in the dim, a
deepening twilight overhead
```

**The Sinking Tower**
```
a slender wizard's tower of pale stone floating upright on the still
surface of a wide grey lake, its base just touching the water, a faint
ripple where it meets the surface, mist rising off the lake, the tower's
single high window dark, no figures, an eerie quiet
```

**The Lightning Tower**
```
a metal-spiked stone wizard's tower hovering perhaps six metres above
the marsh, casting a long shadow on the reeds below, jagged metal spurs
jutting from its sides with arcs of pale blue lightning crackling between
them, low storm-clouds above it, the air smelling of ozone, no figures
```

**Gerhald's Hill Tower** *(the original blood tower; the anchor of the ring)*
```
an old wizard's tower of weathered red-brown stone standing on a grassy
hill above the marsh, deeper red staining around the base of the walls
where the original blood-rite was performed, narrow slit windows, a
single low door, the tower untouched by the fungus that creeps up to its
hill, late evening light
```

**Laurent's Crashed Flying City**
```
the colossal ruined wreck of a flying castle crashed sideways into hills
of dark conifer, broken pale-stone walls and tower-spires jutting from the
hillside at an unnatural angle, vines and centuries of moss reclaiming
the lower ramparts, the suggestion of holds and decks visible through
torn outer walls, low golden hour light, no figures
```

**Luchebert Monastery**
```
a small isolated stone monastery tucked at the head of a hidden green
vale between high hills, a cloister and a low chapel with a single bell-
tower, terraced herb-gardens stepping down to a clear stream, the entrance
to the vale almost completely hidden by trees, soft morning light, no
figures
```

### Independents

**Linar Harbour** *(east coast trade port)*
```
a small independent harbour town on a rocky east coast, a stone breakwater
and a wooden pier, fishing boats with overseas-style triangular sails
moored along the dock, salt-bleached timber warehouses, gulls overhead,
the start of a long inland trade road climbing away from the docks toward
distant hills
```

**Salmonswell** *(independent river city; salmon trade)*
```
an independent river city built on terraces above a wide clear river, a
strong freshwater spring boiling up at the river's edge inside a stone
basin, fish-smoking-houses with thin grey smoke rising along the bank,
arched stone bridges crossing side-channels, late summer light
```

**Fata Morgana** *(big city inside the southern desert)*
```
a large fortified desert city walled in pale carved sandstone, narrow
shaded jewel-bright streets visible inside the gates, hammered-bronze
domes and slender towers, a faint protective shimmer in the air around
the outer walls, golden dunes pressing in on every side, late afternoon
heat haze, no figures
```

**Gap City** *(last settlement before the shifting lands)*
```
a town built into a steep narrow mountain pass, stone houses stacked
against the cliffs on both sides of a single road, a heavy iron-bound
gate at the far end facing out toward strange shifting hazy lands beyond,
hardy alpine grass on the rocks, no figures
```

**Raft City** *(major river port through the great forest)*
```
a sprawling river port city of timber buildings, many of them literally
built on lashed log rafts and floating platforms along the riverbank, a
bustling network of jetties and gangplanks, dark forest pressing close on
the far bank, smoke from cookfires hanging over the water, no figures in
the centre of frame
```

**World Edge** *(mining city near the northern volcanoes)*
```
a hard-built mining city at the base of a chain of dark active volcanoes,
multiple forge-chimneys venting orange-edged smoke, terraced industrial
districts with massive bellows-houses and ore-cart rails, the mountains
behind glowing faintly red at dusk, soot in the air, no figures in centre
```

**Rosepond** *(mining village near World Edge)*
```
a small mining village built around a still dark pond reflecting the red
light of distant volcanoes, modest stone houses with thick slate roofs,
a single mine-shaft head-frame at the village edge, rose-thorn hedges
along the lanes giving the village its name, evening light
```

**Haven** *(iron-puppet settlement; hidden)*
```
a quiet hidden settlement at the edge of strange hazy shifting lands,
mossy paths winding between modest huts, slow-moving humanoid wooden-and-
metal puppet figures going about quiet daily tasks (kept indistinct in
the middle distance), no other living folk, soft diffused fog limiting
the view, an off-world calm
```

**Lastwater** *(southern caravan stop)*
```
a small caravan stop beside the last reliable spring on a southern road,
a stone well-head and a few low mudbrick travellers' shelters, a hitching
post for camels and mules, the dry expanse of the blasted lands and
beyond it the desert just visible past the road's end, harsh midday light
```

### Hazards and features

**The Forbidden Woods**
```
a forest of strangely warped trees just north of the marshlands, trunks
bent into impossible curves, leaves the wrong colours for any season at
once, a faint sourceless light between the trunks, the ground patchy with
unnatural moss, an unsettling hush, no figures
```

**The Blasted Lands**
```
a vast hazardous southern region of cracked salt-flats and broken mage-era
ruins, half-collapsed pale stone arches and toppled towers strewn across
the landscape, a faint shimmering glow on the horizon at the centre where
the portal stands, dust devils in the middle distance, harsh white sky
```

**The Desert (Shifting Lands)**
```
a continental band of pale shifting dunes under a hot bleached sky,
distant fata-morgana mirages of cities along the horizon line, occasional
ribbons of strange darker sand winding through the lighter sand, the
suggestion of unseen chaos-spirit movement in the dust devils, no figures
```

**The Coastal Mountain Range**
```
a long jagged eastern mountain range running from green hills in the
south to dark volcanic peaks in the north, a single thin trade-road pass
visible at the southern end where lower foothills allow passage, low
clouds caught against the western flank, the eastern coast just glimpsed
beyond the highest ridges
```

**The Volcanoes of World's End**
```
the most active northern volcanoes of the coastal range, multiple cones
glowing red at their crests against a dark sky, lava-glow visible on
upper flanks, ash plumes catching cold high-altitude wind, the rocky
horizon line of a far country
```

**The Portal** *(inside the blasted lands; first-human structure)*
```
a tall standing rectangular stone gateway built by the first humans of
this world, glyphs carved on its inner surfaces, the air within the frame
shimmering with a soft prismatic glow that suggests dimensions beyond the
landscape, the cracked salt-flats of the blasted lands stretching away
around it, no figures
```

**The White City (ruined)**
```
the broken pale-stone ruins of a great old mage civilisation's capital,
toppled fluted columns and the shells of vast halls half-buried in the
salt-flat, the suggestion of immense scale even in collapse, the bones of
the city catching the colourless light of the blasted lands, no figures
```

**Thorgal's Mirror** *(haunted artefact; in a forest)*
```
a tall heavy ornate dark-wood-framed standing scrying mirror leaned
against the mossy trunk of an old forest tree, the glass crazed with fine
cracks, a faint sickly green light deep within the reflection that does
not match the sunlit forest around it, fallen leaves scattered at its
base, an unattended wrongness
```

---

## Batch script — minimal sketch

Pair with the Meshy-style pipeline pattern in
[DEVELOPER_ART.md](DEVELOPER_ART.md). The Flux equivalent via fal.ai:

```python
import httpx, hashlib, pathlib, time

API_KEY = "your_fal_key"
HEADERS = {"Authorization": f"Key {API_KEY}"}

STYLE_NPC = ("painterly digital illustration, hand-drawn ink line work under "
             "soft gouache and watercolour wash, muted earthy palette of "
             "ochre, moss, slate and rust, warm low-key lighting, low-fantasy "
             "medieval setting in the style of a tabletop RPG character card, "
             "head-and-shoulders portrait, three-quarter angle, neutral "
             "parchment-toned background, no text, no border, no logo")

NEGATIVE = ("photorealistic, photograph, 3d render, anime, modern clothing, "
            "neon, watermark, text, border, deformed hands, blurry")

def generate(prompt: str, name: str, out: pathlib.Path, ratio="3:4"):
    seed = int(hashlib.md5(name.encode()).hexdigest()[:8], 16)
    r = httpx.post(
        "https://fal.run/fal-ai/flux-pro/v1.1",
        json={
            "prompt": f"{STYLE_NPC}, {prompt}",
            "negative_prompt": NEGATIVE,
            "image_size": ratio,
            "num_inference_steps": 28,
            "seed": seed,
        },
        headers=HEADERS, timeout=120,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(httpx.get(r.json()["images"][0]["url"]).content)

# Output paths:
# html/icons/npcs/{slug}.png
# html/icons/places/{slug}.png
```

---

## Open issues

- **Style anchor is provisional.** Run a 5-card pilot (Diederik, Bridget,
  Irna, Laurent, Tod — these span the visual range) before generating the
  full deck. Tweak the style anchor based on which feel wrong, not the
  individual prompts.
- **Race-name ambiguity.** Flux occasionally produces a real animal instead
  of an animal-folk humanoid even with "anthropomorphic" — if a generated
  card comes back as a quadruped, retry with the prompt prefix
  `"a humanoid bipedal anthropomorphic ___-folk character standing upright,
  fully clothed, holding tools in hands, NOT a real animal"`.
- **Tower set should be regenerated together** with the same seed-offset
  scheme so the six read as siblings.
- **Card border + UI** is laid down separately in the renderer; do not bake
  borders, frames, or text into generated images. See
  [CARDS.md](CARDS.md) §"Differentiating card types".
