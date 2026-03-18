const {assert} = require('chai');
const Logic = require('../html/logic.js');

describe('Check a character progression', () => {
    it('should calculate correctly', () => {
        Logic.initState();
        Logic.state.name = 'Nadine';
        Logic.state.gender = 'Female';
        Logic.state.desc = 'Even while young, Nadine was never able to sit still for long. ' +
            'She was always looking outside, wanting to travel the world. Now as a fully grown Finch she is finally ' +
            'able to go along with a trader company and actually experience freedom.';
        Logic.state.race = 'Finches';
        Logic.state.place = 'Raft city';
        Logic.state.learn('background', 'trader');
        Logic.state.learn('power', 'musical');
        Logic.state.learn('specialization', 'Navigation');
        Logic.state.learn('power', 'hearing');
        Logic.state.learn('background', 'trader');
        Logic.state.learn('power', 'flight');
        assert.strictEqual(Logic.stat("Char"), 3, "Charisma");
        assert.strictEqual(Logic.stat("Speed"), 2, "Speed");
        assert.strictEqual(Logic.stat("Perc"), 3, "Perception");
        assert.strictEqual(Logic.stat("Trader"), 2, "trader");
        assert.strictEqual(Logic.state.xp, 0, "Xp");
        Logic.state.addItem('donkey');
        Logic.state.addItem('cart');
        Logic.state.addItem('knife');
        Logic.state.addItem('clothes');
        Logic.state.addItem('tent');
        Logic.state.addItem('bedroll');
        Logic.state.dropProgression();
        assert.equal(Array.from(Logic.state.items).join(','), "donkey,cart,knife,clothes,tent,bedroll");
        assert.strictEqual(Logic.stat("Speed"), 1, "Speed");
        assert.throws(
            () => Logic.state.learn('specialization', 'Parry'),
            Error, "Background levels are too low to learn.");
        Logic.state.learn('power', 'flight');
        assert.strictEqual(Logic.state.weight, -25, "Weight");
        const txt = JSON.stringify(Logic.state);
        Logic.loadDump(JSON.parse(txt));
        assert.strictEqual(Logic.stat("Trader"), 2, "trader");
        assert.strictEqual(Logic.stat("Flight"), 1, "flight");
        assert.equal(Array.from(Logic.state.items).join(','), "donkey,cart,knife,clothes,tent,bedroll");
    });
    it('should add and remove items', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        Logic.state.learn('background', 'farmer');
        Logic.state.learn('power', 'hearing');
        Logic.state.learn('background', 'trader');
        Logic.state.addItem('donkey');
        Logic.state.addItem('cart');
        Logic.state.addItem('dog');
        Logic.state.addItem('flail');
        Logic.state.addItem('knife');
        Logic.state.removeItem('bandana')
        assert.throws(
            () => Logic.state.addItem('sling'),
            Error, "Item sling not allowed by the characters background.");
        assert.equal(Array.from(Logic.state.items).join(','), "donkey,cart,dog,flail,knife");
        Logic.state.dropProgression();
        assert.equal(Array.from(Logic.state.items).join(','), "donkey,dog,knife");
    });
    it('should enforce the creation stat cap of 3', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        // Raise Char three times within the initial 6 progressions — all valid
        Logic.state.learn('background', 'trader');  // Char raise 1
        Logic.state.learn('power', 'musical');      // Char raise 2
        Logic.state.learn('background', 'farmer'); // Endu raise (alternation: bg after power)
        Logic.state.learn('power', 'clan');         // Char raise 3
        assert.strictEqual(Logic.stat("Char"), 4, "Char should be 4 after 3 raises from base 1");
        // Fill slot 5 with a non-Char background so the next slot is a valid power attempt
        Logic.state.learn('background', 'scholar'); // Will raise
        // A fourth Char raise within the initial 6 progressions must fail
        assert.throws(
            () => Logic.state.learn('power', 'politics'),
            Error, "Char has already been raised 3 times in the initial progressions.");
        // Other stats remain raiseable in the 6th free slot
        Logic.state.learn('power', 'hearing');      // Perc raise 1 — 6th and last free progression
        assert.strictEqual(Logic.stat("Perc"), 2, "Perc should be 2 after one raise from base 1");
        // After the 6 free progressions the cap no longer applies
        Logic.state.learn('background', 'farmer'); // Hand raise (farmer level 2) — costs XP
        Logic.state.learn('power', 'politics');     // Char raise 4 — costs XP, cap lifted
        assert.strictEqual(Logic.stat("Char"), 5, "Char should reach 5 after post-creation raise");
    });
    it('allow specializations from multiple backgrounds', () => {
        Logic.initState();
        Logic.state.race = 'Owls';
        Logic.state.learn('background', 'Farmer');
        assert.throws(() => Logic.state.learn('background', 'Miner'),
            Error, "Cannot repeat same type, chose another type first.");
        Logic.state.learn('power', 'claw');
        Logic.state.learn('specialization', 'Druid');
        Logic.state.learn('background', 'Ascetic');
        Logic.state.learn('specialization', 'Druid');
        Logic.state.addItem('staff');
        assert.equal(`${Logic.state.cards}`,
            '{"source":"Claw","stats":["Might","Dex"],"special":"sneak"},' +
            '{"source":"Druid","stats":["Will","Might"],"special":"nature"},' +
            '{"source":"staff","stats":["Dex","Speed"],"special":"block"}');
        assert.equal(Logic.state.unlockedSpecs().toString(), "Sling,Religion,Druid");
    })
});

describe('Logic utility functions', () => {
    it('statName returns the full statistic name', () => {
        assert.strictEqual(Logic.statName('Char'), 'Charisma');
        assert.strictEqual(Logic.statName('Charisma'), 'Charisma');
        assert.strictEqual(Logic.statName('Perc'), 'Perception');
        assert.strictEqual(Logic.statName('Speed'), 'Speed');
        assert.strictEqual(Logic.statName('unknown'), 'unknown');
    });

    it('projectedStat returns the stat that would be raised', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        // First learn of Trader raises statistics[0]
        const firstStat = Logic.projectedStat('background', 'trader');
        assert.ok(firstStat, 'has a stat at level 1');
        Logic.state.learn('background', 'trader');
        // Second learn of Trader raises statistics[1]
        const secondStat = Logic.projectedStat('background', 'trader');
        assert.notStrictEqual(firstStat, secondStat, 'alternates between the two stats');
        // Power alternates the same way
        Logic.state.learn('power', 'musical');
        const musicalFirst = Logic.projectedStat('power', 'musical');
        Logic.state.learn('background', 'farmer');
        Logic.state.learn('power', 'musical');
        const musicalSecond = Logic.projectedStat('power', 'musical');
        assert.notStrictEqual(musicalFirst, musicalSecond, 'power alternates too');
        // Specialization always returns its fixed stat
        const specStat = Logic.projectedStat('specialization', 'Navigation');
        assert.ok(specStat, 'Navigation has a fixed stat');
        assert.strictEqual(Logic.projectedStat('specialization', 'Navigation'), specStat, 'fixed regardless of level');
        // Unknown names return null
        assert.strictEqual(Logic.projectedStat('background', 'nonexistent'), null);
        assert.strictEqual(Logic.projectedStat('power', 'nonexistent'), null);
        assert.strictEqual(Logic.projectedStat('unknown_type', 'anything'), null);
    });

    it('carryCapacity equals Endu times 5', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        assert.strictEqual(Logic.carryCapacity(), 5); // base Endu = 1
        Logic.state.learn('background', 'farmer');    // farmer level 1 → raises Endu to 2
        assert.strictEqual(Logic.carryCapacity(), 10);
        Logic.state.learn('power', 'musical');        // alternation
        Logic.state.learn('background', 'monastery'); // monastery level 1 → raises Endu to 3
        assert.strictEqual(Logic.carryCapacity(), 15);
    });

    it('getContacts returns contacts for a background at a place', () => {
        // known pair with contacts
        const cs = Logic.getContacts('Trader', 'Raft city');
        assert.ok(Array.isArray(cs), 'returns an array');
        assert.ok(cs.length > 0, 'has at least one contact');
        // case-insensitive background lookup
        const cs2 = Logic.getContacts('trader', 'Raft city');
        assert.deepStrictEqual(cs2, cs, 'case-insensitive background name');
        // place with no contacts for this background returns empty array
        assert.deepStrictEqual(Logic.getContacts('Trader', 'Rosepond'), [], 'no contacts at this place');
        // unknown background returns empty array
        assert.deepStrictEqual(Logic.getContacts('nonexistent', 'Raft city'), [], 'unknown background');
        // unknown place returns empty array
        assert.deepStrictEqual(Logic.getContacts('Trader', 'nonexistent place'), [], 'unknown place');
    });

    it('validProgress returns a reason string for every blocked choice', () => {
        // type-repeat block
        Logic.initState();
        Logic.state.race = 'Finches';
        Logic.state.learn('background', 'trader');
        assert.ok(Logic.state.validProgress('background', 'farmer'), 'same type returns reason');
        // no race → power blocked
        Logic.initState();
        assert.ok(Logic.state.validProgress('power', 'musical'), 'no race returns reason');
        // specialization with insufficient bg level (level 2 needs bgLevel 2, but bgLevel is 1)
        Logic.initState();
        Logic.state.race = 'Finches';
        Logic.state.learn('background', 'trader');
        Logic.state.learn('power', 'musical');
        Logic.state.learn('specialization', 'Navigation'); // level 1 with bgLevel 1 — valid
        Logic.state.learn('background', 'farmer');         // non-spec to unblock spec slot
        assert.ok(Logic.state.validProgress('specialization', 'Navigation'), 'spec level too low returns reason');
        // unknown type
        assert.ok(Logic.state.validProgress('unknown', 'foo'), 'unknown type returns reason');
        // stat cap breach
        Logic.initState();
        Logic.state.race = 'Finches';
        Logic.state.learn('background', 'trader');
        Logic.state.learn('power', 'musical');
        Logic.state.learn('background', 'farmer');
        Logic.state.learn('power', 'clan');
        Logic.state.learn('background', 'scholar');
        assert.ok(Logic.state.validProgress('power', 'politics'), 'stat cap breach returns reason');
        // valid path returns undefined
        Logic.initState();
        Logic.state.race = 'Finches';
        assert.strictEqual(Logic.state.validProgress('background', 'trader'), undefined);
        assert.strictEqual(Logic.state.validProgress('power', 'musical'), undefined);
    });

    it('isOverwhelmed returns false for learned powers with base stats', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        Logic.state.learn('background', 'trader');
        Logic.state.learn('power', 'musical');
        // musical links Char and Speed, both at base 1 — not overwhelmed
        assert.strictEqual(Logic.isOverwhelmed('musical'), false);
        // unknown power name returns false, not an error
        assert.strictEqual(Logic.isOverwhelmed('nonexistent'), false);
        // a power not yet learned still has base stats of 1 — not overwhelmed
        assert.strictEqual(Logic.isOverwhelmed('flight'), false);
    });

    it('freeProgressionsRemaining counts down from 6 to 0', () => {
        Logic.initState();
        Logic.state.race = 'Finches';
        assert.strictEqual(Logic.freeProgressionsRemaining(), 6);
        Logic.state.learn('background', 'trader');
        assert.strictEqual(Logic.freeProgressionsRemaining(), 5);
        Logic.state.learn('power', 'musical');
        assert.strictEqual(Logic.freeProgressionsRemaining(), 4);
        Logic.state.learn('background', 'farmer');
        Logic.state.learn('power', 'clan');
        Logic.state.learn('background', 'scholar');
        Logic.state.learn('power', 'hearing');
        assert.strictEqual(Logic.freeProgressionsRemaining(), 0);
        // stays at 0 beyond the free window
        Logic.state.learn('background', 'farmer');
        assert.strictEqual(Logic.freeProgressionsRemaining(), 0);
    });
});
