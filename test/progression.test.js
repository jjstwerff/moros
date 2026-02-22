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
