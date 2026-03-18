export const DATA = {
    game: {
        title: "Moros",
        tagline: "An adventure game of cards, tension, and growing mastery",
        description: [
            "In Moros, a small group of players builds heroes from eight core statistics — strength, speed, wit, and will among them — shaping each through a history of racial powers, backgrounds, and skills taught by Masters. Together they face scenarios: encounters and challenges resolved not by dice, but by a shared deck of cards drawn fresh each round. Each player draws two and commits one as their action; the statistics a card shows determine what powers it, and a character's mastery determines how hard those powers land.",
            "As players work together — passing cards, aiding one another, pushing the Tension higher — the world responds in kind. When Tension breaks past five, the scene itself becomes hostile, weaving complications into every hand dealt. Between scenarios, characters grow: experience spent on new specializations, forged contacts, and deeper mastery of hard-won powers shapes who a hero will become on the next venture into a world that does not give ground easily."
        ]
    },
    statistics: [
        { name: "Charisma", abbreviation: "Char", action: "Inspire",
            description: "The force of personality that moves people. A high-Charisma character leads, persuades, and holds a group together under pressure — not merely through charm, but through the conviction that makes others listen and believe.",
            scenarios: [
                {name: "Combat", description: "A well-timed word can redirect allies, break enemy morale, or turn the tide without raising a weapon."},
                {name: "Hourly", description: "Build trust and lasting bonds; friendships forged here open doors later."},
                {name: "Social", description: "Command a room with performance, fast-talk past suspicion, or play a convincing role."},
                {name: "Travel", description: "Keep spirits high over long miles; morale is a resource, and Charisma spends it wisely."},
                {name: "Defocus", description: "Lose yourself in mindless, meticulous work — cleaning thoroughly empties the mind."},
                {name: "Refocus", description: "Trade stories and small talk; connection sharpens the will to charm."}
            ]
        },
        { name:"Dexterity", abbreviation:"Dex", action:"Action",
            description:"Precision of body — the discipline that places force exactly where it needs to go. Throwing, catching, climbing, sneaking, riding: Dexterity governs every action that demands fine control over raw strength.",
            scenarios: [
                { name: "Combat", description: "Block incoming blows, deflect thrown objects, and land strikes where accuracy matters more than power." },
                { name: "Hourly", description: "Tackle climbs, tight squeezes, and physical challenges that demand balance and coordination." },
                { name: "Social", description: "Move unseen through a crowd, juggle to impress, or vanish from sight when things go wrong." },
                { name: "Travel", description: "Stay in the saddle when the terrain fights back and keep pace without straining." },
                { name: "Defocus", description: "A quiet nap — the body goes still and the reflexes reset." },
                { name: "Refocus", description: "Free climbing without a rope demands total presence; the wall sharpens the mind." }
            ]
        },
        { name:"Endurance", abbreviation:"Endu", action:"Resist",
            description:"The body's willingness to keep going. Every blow taken, every sleepless night, every league beyond exhaustion — Endurance is the wall between a character and collapse. It sets how much they can carry and how much punishment they can absorb before they stop.",
            scenarios: [
                { name: "Combat", description: "Absorb damage that would drop a lesser character; Endurance measures how long you remain standing." },
                { name: "Hourly", description: "Brave the cold, the heat, hunger, and other punishing conditions without faltering." },
                { name: "Social", description: "Hold the room's attention through sheer physical presence and gravity." },
                { name: "Travel", description: "Cover ground without complaint; a high-Endurance character sets the group's pace." },
                { name: "Defocus", description: "Sleep deeply and completely — full rest clears the strain." },
                { name: "Refocus", description: "Long hours in the saddle; the body grows accustomed to sustained effort." }
            ]
        },
        { name:"Handiness", abbreviation:"Hand", action:"Trick",
            description:"The practical intelligence of the hands. Crafting, repairing, disarming, sleight of hand — Handiness turns materials into solutions. A handy character is never truly without tools, because they can make something useful out of almost anything.",
            scenarios: [
                { name: "Combat", description: "Strip a weapon from an opponent's grip with technique rather than brute force." },
                { name: "Hourly", description: "Craft, repair, and improvise — given time and materials, a handy character can build nearly anything." },
                { name: "Social", description: "Palm objects, swap items unseen, or produce something unexpected at exactly the right moment." },
                { name: "Travel", description: "Keep equipment functional; a well-maintained kit prevents disasters on the road." },
                { name: "Defocus", description: "Let the hands move without the mind — sketching empties the head." },
                { name: "Refocus", description: "Cooking a meal or running through maintenance rituals reconnects focus to purpose." }
            ]
        },
        { name:"Might", abbreviation:"Might", action:"Battle",
            description:"The raw authority of physical force. Close combat, breaking things down, hauling heavy loads, and radiating a presence that makes threats credible — Might is not simply strength, it is the body's capacity to impose its will on the world.",
            scenarios: [
                { name: "Combat", description: "Strike hard in close quarters; every swing carries the full weight of the character behind it." },
                { name: "Hourly", description: "Force open doors, move obstacles, break through barriers — when the direct path is blocked, Might clears it." },
                { name: "Social", description: "Loom, threaten, and let the body's power speak before the mouth does." },
                { name: "Travel", description: "Shoulder heavy loads and keep moving; Might determines how much the group can haul." },
                { name: "Defocus", description: "A calm, unhurried walk — let the muscles unwind and the tension drain." },
                { name: "Refocus", description: "Haul something genuinely heavy; the body and mind re-align under real resistance." }
            ]
        },
        { name:"Perception", abbreviation:"Perc", action:"Spot",
            description:"The gift of noticing — and the discipline of using what you notice. Ranged attacks, detecting deception, reading a scene before it turns hostile, tracking quarry across hard ground: Perception turns raw information into decisive advantage before others realize something is there.",
            scenarios: [
                { name: "Combat", description: "Land ranged attacks with precision and read the field to find weaknesses before striking." },
                { name: "Hourly", description: "Search thoroughly — hidden passages, concealed items, and overlooked details fall to a careful eye." },
                { name: "Social", description: "Detect lies, read intent, and notice the things people are trying very hard not to show." },
                { name: "Travel", description: "Scout ahead, read the terrain, and warn the group before trouble arrives." },
                { name: "Defocus", description: "Deliberately look at nothing; the senses need rest as much as the body." },
                { name: "Refocus", description: "Stand lookout or follow a trail; active, purposeful attention resets the mind." }
            ]
        },
        { name:"Speed", abbreviation:"Speed", action:"Move",
            description:"The freedom to be somewhere else. Dodging, sprinting, closing distance or opening it: Speed determines who acts first, who escapes, and who arrives when it still matters. In a fight, a fast character controls the space; on the road, they define how far the group travels.",
            scenarios: [
                { name: "Combat", description: "Stay ahead of incoming attacks; a fast character is where the blow was, not where it lands." },
                { name: "Hourly", description: "Cover ground quickly when time is against you — running beats every other option." },
                { name: "Social", description: "Slip through a crowd, cross a room, or leave before a conversation turns dangerous." },
                { name: "Travel", description: "Set a fast pace and reach the destination before circumstances can change." },
                { name: "Defocus", description: "Hang around without purpose — the body recovers from all that motion." },
                { name: "Refocus", description: "A steady jog clears the head and primes the legs for what comes next." }
            ]
        },
        { name:"Willpower", abbreviation:"Will", action:"Focus",
            description:"The architecture of intent — the stat that keeps a character themselves when everything tries to unmake them. Resisting fear, sustaining a power's focus, aiming under chaos, holding the mind intact against the supernatural: Willpower is the foundation the other statistics rest on when circumstances turn hostile.",
            scenarios: [
                { name: "Combat", description: "Resist fear effects, hold your nerve, and aim with precision when the situation demands mental composure." },
                { name: "Hourly", description: "Maintain concentration on a task despite distraction, pain, or the pressure to give up." },
                { name: "Social", description: "See through influence and manipulation; a strong will is the hardest wall to climb." },
                { name: "Travel", description: "Keep a clear head over long journeys; mental clarity prevents costly mistakes in unfamiliar territory." },
                { name: "Defocus", description: "Lose yourself in a book — the mind quiets when it follows someone else's thoughts." },
                { name: "Refocus", description: "Work through a complex puzzle; the mind sharpens itself against a real challenge." }
            ]
        }
    ],
    cards: [
        { name: "Flame", statistics: [ "Might", "Dex" ], special: "fire" },
        { name: "Water", statistics: [ "Dex", "Speed" ], special: "water" },
        { name: "Wind", statistics: [ "Char", "Speed" ], special: "air" },
        { name: "Plants", statistics: [ "Hand", "Char" ], special: "wood" },
        { name: "Iron", statistics: [ "Might", "Will" ], special: "iron" },
        { name: "Earth", statistics: [ "Endu", "Hand" ], special: "stone" },
        { name: "Light", statistics: [ "Perc", "Will" ], special: "light" },
        { name: "Dark", statistics: [ "Perc", "Endu" ], special: "dark" }
    ],
    specializations: {
        Dexterity: ["Shield","Parry","Blocking","Sneak","Juggle","Climbing"],
        Handiness: ["Woodworking","Cloth","Leather","Smithing","Healer","Machinist","Jeweler","Cooking"],
        Might: ["Axes","Blunt","Brawl","Pole weapon","Spear","Swords"],
        Perception: ["Bows","Crossbow","Sling","Darts","Scouting","Tracking","Navigation"],
        Willpower: ["Religion","Shamanic","Magic","Druid","Monk"]
    },
    powers: [
        { name:"Adaptation", statistics:["Will","Char"], special:"shadow step", description:"Move around increasingly undetected." },
        { name:"Balance", statistics:["Dex","Will"], special:"tumble", description:"Moving erratically, eventually impossible to hit." },
        { name:"Blood", statistics:["Will","Might"], special:"regenerate", description:"Borrow the life energy from someone else."},
        { name:"Camp", statistics:["Char","Endu"], special:"shielding", description:"Find a safe place to recuperate." },
        { name:"Charge", statistics:["Speed","Might"], special:"prone", description:"Increasingly impossible to be stopped." },
        { name:"Clan", statistics:["Char","Will"], special:"shelter", description:"Ensures aid when encountering kindred people." },
        { name:"Claw", statistics:["Might","Dex"], special:"sneak", description:"Increased damage when attacking unnoticed." },
        { name:"Climber", statistics:["Dex","Might"], special:"reach", description:"Scale walls and trees." },
        { name:"Control", statistics:["Endu","Perc"], special:"shape", description:"Modify your form, possibly stronger and more enduring." },
        { name:"Digging", statistics:["Endu","Might"], special:"breaching", description:"Dig through the earth at an increasing speed." },
        { name:"Flight", statistics:["Speed","Dex"], special:"flying", description:"At first a glide, but eventually fully free flight." },
        { name:"Fur", statistics:["Endu","Dex"], special:"defense", description:"Increased protection from harm including the elements." },
        { name:"Hearing", statistics:["Perc","Char"], special:"information", description:"Increased sensitivity to sound." },
        { name:"Hide", statistics:["Endu","Will"], special:"armor", description:"Protection from cutting and stabbing."},
        { name:"Hunter", statistics:["Perc","Hand"], special:"catching", description:"Tracking and snaring prey." },
        { name:"Ingenuity", statistics:["Hand","Will"], special:"improvise", description:"The uncanny ability to create anything from scraps." },
        { name:"Jaws", statistics:["Might","Endu"], special:"grab", description:"Increased damage from biting."},
        { name:"Labyrinth", statistics:["Perc","Will"], special:"navigate", description:"Navigate and create mazes." },
        { name:"Lookout", statistics:["Perc","Endu"], special:"guarding", description:"Notice the tiniest details." },
        { name:"Musical", statistics:["Char","Dex"], special:"atmosphere", description:"Influence the mood when people pay attention." },
        { name:"Night", statistics:["Perc","Dex"], special:"stalk", description:"See clearly but also blend with shadows." },
        { name:"Nimble", statistics:["Speed","Dex"], special:"dash", description:"Get a boost from moving on all fours." },
        { name:"Politics", statistics:["Char","Perc"], special:"common cause", description:"Know how to reach common ground." },
        { name:"Portage", statistics:["Endu","Hand"], special:"travel", description:"Haul goods with apparent ease." },
        { name:"Relaxed", statistics:["Endu","Char"], special:"unwind", description:"Radiate calm to the people around." },
        { name:"Scolding", statistics:["Might","Will"], special:"taunt", description:"Grab the attention of enemies." },
        { name:"Scrounger", statistics:["Hand","Perc"], special:"provisions", description:"Find useful supplies in unlikely places." },
        { name:"Scurry", statistics:["Dex","Perc"], special:"sneaking", description:"Burst of speed and being hard to spot." },
        { name:"Sleeper", statistics:["Will","Endu"], special:"recover", description:"Recover in almost any circumstance." },
        { name:"Sly", statistics:["Char","Hand"], special:"trick", description:"Able to trick those around you." },
        { name:"Smell", statistics:["Perc","Endu"], special:"tracking", description:"Follow tracks, recognize people." },
        { name:"Swimmer", statistics:["Dex","Endu"], special:"survival", description:"Open water is nothing to be scared of." },
        { name:"Travels", statistics:["Speed","Perc"], special:"scouting", description:"Instantly be familiar in unknown places." },
        { name:"Magic", statistics:["Will","Hand"], special:"elemental", description:"Bend the existing elements to your will." },
        { name:"Shamanic", statistics:["Will","Endu"], special:"binding", description:"Interact with the spirits around you."},
        { name:"Religion", statistics:["Char","Will"], special:"bless", description:"Grant others physical and mental boosts." },
        { name:"Druid", statistics:["Will","Might"], special:"nature", description:"Let nature come to your aid." }
    ],
    races: [
        { name:"Badgers", description:"Sturdy diggers and craftspeople.", powers:["digging","ingenuity","portage","claw","camp","fur","scrounger"] },
        { name:"Bats", description:"Nocturnal flyers with keen hearing.", powers:["flight","scrounger","blood","claw","night","scolding","hearing"] },
        { name:"Beavers", description:"Industrious builders and swimmers.", powers:["ingenuity","hunter","jaws","swimmer","camp","fur","nimble"] },
        { name:"Cats", description:"Graceful hunters with nine lives.", powers:["hunter","nimble","relaxed","climber","blood","claw","night"] },
        { name:"Crows", description:"Clever and adaptable scavengers.", powers:["lookout","ingenuity","adaptation","balance","scolding","flight","night"] },
        { name:"Finches", description:"Social songbirds with political savvy.", powers:["musical","clan","balance","hearing","politics","flight","scolding"] },
        { name:"Foxes", description:"Cunning travelers and tricksters.", powers:["adaptation","climber","musical","labyrinth","sly","nimble","travels"] },
        { name:"Humans", description:"Versatile and diplomatic survivors.", powers:["adaptation","ingenuity","balance","portage","politics","sly","lookout"] },
        { name:"Otters", description:"Playful swimmers and nimble scouts.", powers:["hunter","swimmer","fur","nimble","scurry","sly","lookout"] },
        { name:"Owls", description:"Silent hunters with commanding presence.", powers:["claw","clan","hunter","lookout","charge","flight","scolding"] },
        { name:"Pig men", description:"Resilient diggers with thick hides.", powers:["digging","hide","camp","smell","sleeper","charge","scolding"] },
        { name:"Rabbits", description:"Alert burrowers quick to find shelter.", powers:["camp","labyrinth","scrounger","hearing","sleeper","fur","digging"] },
        { name:"Raccoons", description:"Resourceful scavengers and shapeshifters.", powers:["scurry","camp","relaxed","sly","scrounger","clan","control"] },
        { name:"Rat folk", description:"Adaptable urban survivors in tight-knit clans.", powers:["clan","scurry","climber","sleeper","smell","scrounger","control"] },
        { name:"Taurus", description:"Strong wanderers with enduring calm.", powers:["portage","swimmer","charge","labyrinth","relaxed","hide","travels"] },
        { name:"Wolf folk", description:"Pack hunters with keen senses.", powers:["jaws","travels","control","hide","clan","smell","hearing"] }
    ],
    backgrounds: [
        { name:"Noble", statistics:["Char","Might"], items:["horse","armor","sword"], specializations:["Parry","Swords"],
          contacts:{ "Blackwood freehold":["local alderman","land surveyor"], "Chatter Creek":["garrison commander","border magistrate"], "Cliffside hold":["Brumal court herald","master of coin"], "Fata morgana":["desert sheikh's envoy","toll collector"], "Scarlet vale":["Allondo chancellor","royal steward"] } },
        { name:"Farmer", statistics:["Endu","Hand"], items:["flail","donkey","sling","dog"], specializations:["Sling","Druid"],
          contacts:{ "Blackwood freehold":["grain merchant","mill keeper"], "Elmsfield":["orchard keeper","druid's apprentice"], "Rakeville":["village elder","seed trader"], "Steadington":["desperate landowner","water diviner"] } },
        { name:"Scholar", statistics:["Will","Perc"], items:["staff","backpack"], specializations:["Healer","Jeweler","Navigation","Magic"],
          contacts:{ "Cliffside hold":["royal archivist","court physician"], "Elmsfield":["nature chronicler","healer"], "Gap city":["cartographer","lore broker"], "Scarlet vale":["university rector","master herbalist"] } },
        { name:"Watch", statistics:["Perc","Might"], items:["glave","breastplate","crossbow"], specializations:["Blocking","Pole weapon","Crossbow"],
          contacts:{ "Chatter Creek":["border sergeant","toll keeper"], "Cliffside hold":["watch captain","armorer"], "Rakeville":["village constable"], "Scarlet vale":["city guard captain","magistrate"] } },
        { name:"Crafter", statistics:["Hand","Will"], items:["tools","backpack"], specializations:["Woodworking","Cloth","Leather","Smithing","Machinist","Cooking","Axes","Religion"],
          contacts:{ "Blackwood freehold":["carpenter","tanner"], "Bockthicket":["smelter foreman","tool merchant"], "Clear water":["ore broker","equipment trader"], "Rosepond":["quarry owner","stone cutter"], "Scarlet vale":["guild master","merchant factor"] } },
        { name:"Monastery", statistics:["Endu","Will"], items:["staff"], specializations:["Blocking","Blunt","Religion","Monk"],
          contacts:{ "Cliffside hold":["abbot","relic keeper"], "Elmsfield":["elder monk","herbalist"], "Scarlet vale":["high priest","monastery cellarer"] } },
        { name:"Ascetic", statistics:["Will","Char"], items:["staff"], specializations:["Druid","Shamanic","Religion","Magic"],
          contacts:{ "Elmsfield":["forest hermit","wandering sage"], "Fata morgana":["desert mystic","oasis guardian"], "Steadington":["dust wanderer","spirit talker"], "World edge":["tide watcher","clifftop hermit"] } },
        { name:"Trader", statistics:["Char","Hand"], items:["cart","donkey"], specializations:["Jeweler","Navigation"],
          contacts:{ "Chatter Creek":["border tax collector","wagon master"], "Fata morgana":["caravan leader","gem dealer"], "Gap city":["goods broker","rope merchant"], "Lastwater":["rest stop keeper","mule trader"], "Linar harbour":["dock master","spice factor"], "Raft city":["river merchant","harbour master"], "Scarlet vale":["trade guild factor","tax assessor"] } },
        { name:"Fisher", statistics:["Endu","Perc"], items:["fishing net"], specializations:["Woodworking","Cloth","Brawl","Religion"],
          contacts:{ "Clear water":["lake warden","ice merchant"], "Linar harbour":["boat builder","fish market trader"], "Raft city":["river guide","net maker"], "Rosepond":["pond keeper","eel trader"], "World edge":["deep sea captain","salter"] } },
        { name:"Circus troupe", statistics:["Speed","Dex"], items:["whip"], specializations:["Climbing","Juggle"],
          contacts:{ "Fata morgana":["exotic animal dealer","silk trader"], "Gap city":["acrobat guild master","rope walker"], "Linar harbour":["ship entertainer","dockside bookie"], "Scarlet vale":["theatre owner","festival organiser"] } },
        { name:"Back alley", statistics:["Hand","Dex"], items:["dagger","darts"], specializations:["Climbing","Sneak","Darts","Scouting"],
          contacts:{ "Bockthicket":["mine foreman's debtor","loan shark"], "Cliffside hold":["fence","bribed sergeant"], "Gap city":["forger","pickpocket ring leader"], "Linar harbour":["black market broker","dockside lookout"], "Raft city":["smuggler","river informant"], "Scarlet vale":["thieves' guild contact","corrupt official"] } },
        { name:"Hunter", statistics:["Might","Dex"], items:["bow","falcon","dog"], specializations:["Climbing","Axes","Cooking","Bows","Scouting","Tracking","Druid"],
          contacts:{ "Blackwood freehold":["gamekeeper","fur trader"], "Chatter Creek":["border scout","trapper"], "Elmsfield":["forest warden","wolf-hunter"], "Lastwater":["guide","wilderness scout"], "World edge":["sea cliff hunter","falconer"] } },
        { name:"Miner", statistics:["Endu","Might"], items:["pickaxe","leather"], specializations:["Axes","Brawl"],
          contacts:{ "Bockthicket":["pit boss","explosives supplier"], "Clear water":["mine surveyor","ore assessor"], "Rosepond":["quarry foreman","rock breaker"], "World edge":["deep shaft captain","gem cutter"] } },
        { name:"Army", statistics:["Might","Endu"], items:["spear","shield","leather"], specializations:["Shield","Brawl","Spear"],
          contacts:{ "Chatter Creek":["border fort commander","supply officer"], "Cliffside hold":["garrison colonel","weapons master"], "Lastwater":["army road engineer","field medic"], "Scarlet vale":["royal army quartermaster","veteran sergeant"] } }
    ],
    // map spec name to stat
    specToStat: {
        Shield:"Dex", Parry:"Dex", Blocking:"Dex", Sneak:"Dex", Juggle:"Dex", Climbing:"Dex",
        Woodworking:"Hand", Cloth:"Hand", Leather:"Hand", Smithing:"Hand", Healer:"Hand",
        Machinist:"Hand", Jeweler:"Hand", Cooking:"Hand",
        Axes:"Might", Blunt:"Might", Brawl:"Might", "Pole weapon":"Might", Spear:"Might", Swords:"Might",
        Bows:"Perc", Crossbow:"Perc", Sling:"Perc", Darts:"Perc", Scouting:"Perc", Tracking:"Perc", Navigation:"Perc",
        Religion:"Will", Shaman:"Will", Mage:"Will", Druid:"Will", Monk:"Will"
    },
    items: [
        { name:"horse", statistics:["Speed","Endu"], special:"travel", bulk:-6 },
        { name:"armor", statistics:["Might","Char"], special:"imposing", bulk:3 },
        { name:"sword", statistics:["Might","Dex"], special:"parry", bulk:2 },
        { name:"flail", statistics:["Might","Endu"], special:"stun", bulk:4 },
        { name:"donkey", statistics:["Endu","Will"], special:"stubborn", bulk:-9, duplicates:['Farmer','Trader'] },
        { name:"sling", statistics:["Perc","Dex"], special:"stun", bulk:0 },
        { name:"dog", statistics:["Perc","Char"], special:"tracking", duplicates:['Farmer','Hunter'] },
        { name:"staff", statistics:["Dex","Speed"], special:"block", bulk:3, duplicates:['Scholar','Monastery','Acetic'] },
        { name:"backpack", statistics:["Endu","Speed"], special:"carry", bulk:-3, duplicates:['Scholar','Crafter'] },
        { name:"glave", statistics:["Might","Endu"], special:"stop", bulk:5 },
        { name:"breastplate", statistics:["Might","Will"], special:"defend", bulk:2 },
        { name:"crossbow", statistics:["Perc","Hand"], special:"wound", bulk:4 },
        { name:"tools", statistics:["Hand","Will"], special:"craft", bulk:1 },
        { name:"cart", statistics:["Endu","Hand"], special:"steady", bulk:-20 },
        { name:"fishing net", statistics:["Perc","Will"], special:"restrict", bulk:2 },
        { name:"whip", statistics:["Dex","Will"], special:"steer", bulk:2 },
        { name:"dagger", statistics:["Perc","Hand"], special:"sneaking", bulk:0 },
        { name:"darts", statistics:["Will","Perc"], special:"poison", bulk:0 },
        { name:"bow", statistics:["Perc","Endu"], special:"cripple", bulk:2 },
        { name:"falcon", statistics:["Char","Perc"], special:"search" },
        { name:"pickaxe", statistics:["Endu","Will"], special:"breaching", bulk:3 },
        { name:"leather", statistics:["Speed","Dex"], special:"armor", bulk:2, duplicates:['Miner','Army'] },
        { name:"spear", statistics:["Might","Speed"], special:"intercept", bulk:3 },
        { name:"shield", statistics:["Dex","Endu"], special:"block", bulk:2 },
        { name:"knife", bulk:0, description:"mostly for cooking", statistics:["Dex","Hand"], special:"cut", restricted:false },
        { name:"food", bulk:1, description:"for 3 days", restricted:false },
        { name:"clothes", bulk:1, description:"an extra set", restricted:false },
        { name:"leather repair", description:"will be used up", bulk:1, restricted:false },
        { name:"tent", bulk:2, description:"per person", restricted:false },
        { name:"bedroll", bulk:1, restricted:false }
    ],
    rules: [
        { about:"growth", text:[
                "Blood, heritage, and hard-won mastery shape a character — statistics grow through racial powers, backgrounds, and specializations taught by a Master.",
                "Each level of a specialization sharpens every action tied to it and pushes the statistic further.",
                "Advancement is never free: every background, power, or specialization costs 2 XP plus 1 more for each level already invested.",
                "Masters and contacts can be found along the road, though the XP price of the learned specialization never relents.",
                "A background unlocks 2 items from its list; carrying more demands spending additional background points.",
                "Treasure waits in every corner of the world, but it must be hauled — bulk limits what a character can carry.",
                "Endurance determines how much weight a character can bear.",
                "Mastery demands breadth: no two backgrounds or specializations may be chosen in succession.",
                "Every hero begins with six advancements to spend."
            ]},
        { about:"cards", text:[
                "Every power and most items arm the player with a card.",
                "Each scenario opens with 8 default cards in the stockpile and a starting Tension ready to climb.",
                "As the stakes reveal themselves, each player adds 2 cards from their character sheet to the pool.",
                "A leader can tip the odds — adding or pulling cards from the stockpile mid-scenario.",
                "Each round, a player draws two cards from the shuffled stack and commits one as their action.",
                "When a card shows a matching statistic, the player may add those points to the total — skill and fortune aligning."
            ]},
        { about:"aid each other", text:[
                "During their turn, a player may pass a card to an ally — and still play one of their own.",
                "The ally must play that card on their next turn — it is a gift, but also a commitment.",
                "Every act of aid tightens the Tension, inviting the world to push back harder.",
                "Once Tension rises above 5, the scene itself begins to fight — cards drawn for the narrative will add complications."
            ]},
        { about:"heroic action", text:[
                "When everything is on the line, a player may lay their entire hand on the table and claim every statistic shown across those cards as a bonus.",
                "The cards are then shuffled and revealed one by one — the first card's special fuels the feat, the next turns the scene against them, and so the balance shifts."
            ]},
        { about:"power focus", text:[
                "Channeling the same power on consecutive turns sharpens focus by one. Focus cannot exceed the mastery in that power.",
                "Prior refocus actions of the power's related statistic count double toward that growth.",
                "As focus sharpens on one power, it dulls by one across all others — unless a power states otherwise.",
                "Each point of focus beyond the first exacts a toll: a penalty of one to every unrelated action.",
                "Defocus actions of the related statistic ease the strain, lowering the penalty by one."
            ]}
    ],
    actions: [
        // ── Charisma / Inspire ────────────────────────────────────────────────────
        { power: "Inspire",     name: "rallying cry",   needs: "Char >= 5",              description: "Every ally recalls one card from their discard into their hand. Tension rises by 1." },
        { power: "Inspire",     name: "strategy",       needs: "Char >= 3",                   description: "All players may put another card on the pile. For every Char > 3, remove a card." },
        { power: "Inspire",     name: "boost",          needs: "Char >= 4",                   description: "Players can play two cards in their next round instead of the normal one." },
        // ── Dexterity / Action ────────────────────────────────────────────────────
        { power: "Action",      name: "feint",           needs: "Dex >= 3",               description: "Swap the played card with another from your hand after the opponent has committed their reaction." },
        { power: "Action",      name: "flourish",        needs: "Dex >= 4",               description: "Expend your card to force the enemy to waste their next action on you instead of another player." },
        // ── Endurance / Resist ────────────────────────────────────────────────────
        { power: "Resist",      name: "dig in",          needs: "Endu >= 3",              description: "Ignore the next source of damage or complication entirely. Cannot be used two rounds in a row." },
        { power: "Resist",      name: "second wind",     needs: "Endu >= 4",              description: "Discard your hand and draw three fresh cards; any Endu shown on them may be added to your next action." },
        // ── Handiness / Trick ─────────────────────────────────────────────────────
        { power: "Trick",       name: "disarm",          needs: "Hand > Dex + Might",          description: "Send the enemy's weapon flying — they can retrieve it in a turn." },
        { power: "Trick",       name: "improvise tool",  needs: "Hand >= 4",              description: "Create a temporary item from nearby scraps; it acts as a matching item for one scene then is used up." },
        // ── Might / Battle ────────────────────────────────────────────────────────
        { power: "Battle",      name: "power through",   needs: "Might >= 3",             description: "Add Might to the total even when the card played has no Might symbol." },
        { power: "Battle",      name: "cleave",          needs: "Might >= 5",             description: "The attack applies to every enemy in reach; each target beyond the first reduces the total by 2." },
        // ── Perception / Spot ─────────────────────────────────────────────────────
        { power: "Spot",        name: "called shot",     needs: "Perc >= 4",              description: "Declare a specific effect before rolling (disarm, trip, blind); success delivers that effect on top of normal damage." },
        { power: "Spot",        name: "weak point",      needs: "Perc > Dex + Might",          description: "Expose a gap in the enemy's defenses; an ally may play a second card on their very next attack against this target." },
        // ── Speed / Move ──────────────────────────────────────────────────────────
        { power: "Move",        name: "dodge",           needs: "Reaction, Speed > Dex",       description: "Step aside from an incoming blow — one step is all it takes." },
        { power: "Move",        name: "sprint",          needs: "Speed >= 3",             description: "Move to any position in the scene without spending an action, once per round." },
        { power: "Move",        name: "blur",            needs: "Speed >= 5",             description: "Attack and immediately retreat before the enemy can react; they may not counter-attack this turn." },
        // ── Willpower / Focus ─────────────────────────────────────────────────────
        { power: "Focus",       name: "steel the mind",  needs: "Will >= 3",              description: "Negate a fear, charm, or confusion effect on yourself or an adjacent ally." },
        { power: "Focus",       name: "lock on",         needs: "Will >= 4",              description: "Choose one target; all your cards count as having that target's weakness for the rest of the scene." },

        // ── Dexterity specializations ─────────────────────────────────────────────
        { power: "Shield",      name: "shield wall",     needs: "",                       description: "Extend your defense to an adjacent ally; both of you resist the next attack together, combining Endu totals." },
        { power: "Parry",       name: "riposte",         needs: "Reaction, Dex > Might",  description: "Turn defense into offense: strike back with the parrying card itself; it always counts as Might 0." },
        { power: "Parry",       name: "bind",            needs: "",   description: "Lock the enemy's weapon in place; they must spend their next action freeing it or fight unarmed." },
        { power: "Blocking",    name: "counter-brace",   needs: "",description: "A successful block sends the attacker off-balance; their next roll is reduced by your Dex." },
        { power: "Sneak",       name: "vanish",          needs: "",   description: "After acting, immediately become undetected again if no enemy is adjacent to you." },
        { power: "Sneak",       name: "ambush",          needs: "",   description: "When attacking from concealment, play two cards and take the higher total." },
        { power: "Juggle",      name: "catch",           needs: "",  description: "Snatch any hurled object from mid-air — weapons, stones, or arrows meant for allies." },
        { power: "Juggle",      name: "toss item",       needs: "",  description: "Loft any item to any visible ally without spending an action." },
        { power: "Climbing",    name: "high ground",     needs: "",description: "While elevated, add Dex to any ranged or dropped attack." },
        { power: "Climbing",    name: "rappel",          needs: "",description: "Descend or swing across a gap instantly, arriving ready to act this same turn." },

        // ── Handiness specializations ─────────────────────────────────────────────
        { power: "Woodworking", name: "splint",          needs: "", description: "Fashion a brace on the spot; the target ignores a limb-based penalty for the rest of the scene." },
        { power: "Woodworking", name: "barricade",       needs: "", description: "Rapidly reinforce a door, gate, or passage; it takes 3 successes to break through." },
        { power: "Cloth",       name: "bind wound",      needs: "",   description: "Halt ongoing bleeding or poison by wrapping it tightly; stops deterioration immediately." },
        { power: "Cloth",       name: "snare",           needs: "",   description: "Throw torn fabric to entangle a target; they lose their next movement action." },
        { power: "Leather",     name: "patch armor",     needs: "", description: "Restore one point of protection to any worn armor in the field mid-scene." },
        { power: "Leather",     name: "padding",         needs: "", description: "Lash together improvised padding; the wearer reduces the next blunt blow by your Hand score." },
        { power: "Smithing",    name: "reforge edge",    needs: "",description: "Spend a turn sharpening a weapon; it gains +1 to all attack totals for the rest of the scene." },
        { power: "Smithing",    name: "weld shut",       needs: "",description: "Permanently fuse a lock, hinge, or mechanism with available metal; requires a forge or fire." },
        { power: "Healer",      name: "field surgery",   needs: "",  description: "Restore an ally's ability to act despite a severe injury; they return next round at half effectiveness." },
        { power: "Healer",      name: "stabilize",       needs: "",  description: "Prevent a dying ally from getting worse; they are stable until the scene ends." },
        { power: "Machinist",   name: "sabotage",        needs: "",description: "Disable a mechanical device, siege engine, or lock in one action without leaving obvious evidence." },
        { power: "Machinist",   name: "rig",             needs: "",description: "Set up a triggered mechanism (tripwire, drop weight, spring trap) that fires automatically later." },
        { power: "Jeweler",     name: "appraise",        needs: "", description: "Instantly know the exact worth and origin of any object, opening new trade or negotiation options." },
        { power: "Jeweler",     name: "conceal",         needs: "", description: "Hide a small item inside jewellery or clothing so thoroughly it escapes all but a dedicated search." },
        { power: "Cooking",     name: "fortifying meal", needs: "", description: "Prepare a quick meal; every player who eats draws one extra card at the start of the next round." },
        { power: "Cooking",     name: "tainted dish",    needs: "", description: "Introduce a mild toxin into food; the target suffers -2 to all rolls next round (no damage)." },

        // ── Might specializations ─────────────────────────────────────────────────
        { power: "Axes",        name: "hew",             needs: "",    description: "Cut through a shield, door, or object as part of an attack without a separate action." },
        { power: "Axes",        name: "overhead smash",  needs: "",    description: "Drive the opponent prone; they must spend their next action standing or fight from the ground (−2 to attacks)." },
        { power: "Blunt",       name: "stagger",         needs: "",   description: "A successful hit also pushes the target one step away; they cannot close the distance this round." },
        { power: "Blunt",       name: "shatter",         needs: "",   description: "Destroy a held shield or item on a hit instead of dealing normal damage." },
        { power: "Brawl",       name: "grapple",         needs: "",   description: "Pin the target; they cannot move or use two-handed weapons until they beat your Might on their turn." },
        { power: "Brawl",       name: "headbutt",        needs: "",   description: "Stun the target for one round; they draw only one card next turn instead of two." },
        { power: "Pole weapon", name: "keep at bay",     needs: "", description: "Prevent any enemy from moving into melee range this round; they must overcome your Might to advance." },
        { power: "Pole weapon", name: "sweep",           needs: "", description: "Trip every enemy in a line; they are all knocked prone." },
        { power: "Spear",       name: "brace",           needs: "",   description: "Set the spear; the next charging enemy takes double damage and is stopped in their tracks." },
        { power: "Spear",       name: "hurl",            needs: "",   description: "Throw the spear at range with full Might instead of reducing to Perc; retrieve it next turn as a free action." },
        { power: "Swords",      name: "disarming slash", needs: "",  description: "A precise cut sends the enemy's weapon skidding away; acts as disarm but can be performed even if Hand < Dex + Might." },
        { power: "Swords",      name: "lunge",           needs: "",  description: "Strike a target one step beyond normal melee range; Dex is added to the attack total." },

        // ── Perception specializations ────────────────────────────────────────────
        { power: "Bows",        name: "pinning shot",    needs: "",    description: "The arrow pins clothing or gear to a surface; the target is immobilised until they spend an action pulling free." },
        { power: "Bows",        name: "volley",          needs: "",    description: "Loose three arrows at once; split your Perc total across up to three separate targets." },
        { power: "Crossbow",    name: "bolt to the gap", needs: "",description: "Ignore armor on the next attack; only natural Endurance applies to resistance." },
        { power: "Crossbow",    name: "covering fire",   needs: "",description: "Keep an area suppressed; any enemy entering that zone this round loses 2 from their total." },
        { power: "Sling",       name: "stunning stone",  needs: "",   description: "A carefully chosen stone dazes the target; they act last next round regardless of Speed." },
        { power: "Sling",       name: "ricochet",        needs: "",   description: "Bounce a stone off a hard surface to strike a target behind cover as if they were exposed." },
        { power: "Darts",       name: "sleep dart",      needs: "",   description: "A coated dart renders the target unconscious rather than dead if they have fewer Endu points than your Perc." },
        { power: "Darts",       name: "rapid throw",     needs: "",   description: "Throw two darts in one action, each hitting a different target; split your total evenly." },
        { power: "Scouting",    name: "lay of the land", needs: "",description: "Reveal the full layout of the scene to all players; hidden routes or exits become known." },
        { power: "Scouting",    name: "early warning",   needs: "",description: "The party is never surprised; you always act first in the first round of any encounter." },
        { power: "Tracking",    name: "read the trail",  needs: "",description: "Determine exact numbers, direction, and time elapsed from tracks; ask the GM two specific questions." },
        { power: "Tracking",    name: "predict path",    needs: "",description: "Correctly guess where a fleeing target will be; you may intercept them without a chase." },
        { power: "Navigation",  name: "shortcut",        needs: "", description: "Reduce travel time by one segment; arrive before complications tied to that segment can occur." },
        { power: "Navigation",  name: "dead reckoning",  needs: "", description: "Navigate perfectly without landmarks, stars, or maps in any terrain or weather." },

        // ── Willpower specializations ─────────────────────────────────────────────
        { power: "Religion",    name: "sanctuary",       needs: "",description: "Declare a location sacred; no violence may occur within it while you concentrate (costs one card per round)." },
        { power: "Religion",    name: "blessing",        needs: "",description: "Bestow a blessing on one ally; they may reroll any single card result once before the scene ends." },
        { power: "Shamanic",    name: "spirit ward",     needs: "",description: "Raise a ward that blocks one supernatural or magical effect completely; the ward then dissolves." },
        { power: "Shamanic",    name: "commune",         needs: "",description: "Ask a local spirit one question; the answer is always truthful but may be cryptic." },
        { power: "Magic",       name: "counterspell",    needs: "",   description: "Cancel any elemental or magical effect targeting you or an ally; costs your card play for this round." },
        { power: "Magic",       name: "elemental surge", needs: "",   description: "Amplify a card's special element; the effect covers the entire scene instead of a single target." },
        { power: "Druid",       name: "call of the wild",needs: "",   description: "Summon nearby animals to create a distraction; enemies must spend a round dealing with them." },
        { power: "Druid",       name: "entangle",        needs: "",   description: "Cause roots and vines to erupt underfoot; all enemies in the zone are slowed (−2 Speed) for two rounds." },
        { power: "Monk",        name: "iron body",       needs: "",    description: "For one round your body counts as armor; reduce any incoming damage by your Will before Endu applies." },
        { power: "Monk",        name: "pressure point",  needs: "",    description: "Strike a precise nerve cluster; the target loses use of one limb (their choice) until they rest." },
    ],
    places: [
        { name: "Blackwood freehold", description: "Agricultural town in Allondo." },
        { name: "Bockthicket", description: "Mining town of Brumal." },
        { name: "Chatter Creek", description: "Northern border town of Allondo." },
        { name: "Clear water", description: "Mining town of Allondo." },
        { name: "Cliffside hold", description: "Capital of Brumal." },
        { name: "Elmsfield", description: "Border town around a huge tree." },
        { name: "Fata morgana", description: "Oasis city in the southern desert." },
        { name: "Gap city", description: "Hanging city towards the shifting lands." },
        { name: "Lastwater", description: "Travel stop to the south." },
        { name: "Linar harbour", description: "Small but independent harbour town." },
        { name: "Raft city", description: "On the river through the great forest." },
        { name: "Rakeville", description: "The next village towards Allondo." },
        { name: "Rosepond", description: "Mining village near world edge." },
        { name: "Scarlet vale", description: "Capital of Allondo." },
        { name: "Steadington", description: "Village in Brumal overtaken by the desert." },
        { name: "World edge", description: "Mining city near the ocean." }
    ]
};
Object.freeze(DATA);
