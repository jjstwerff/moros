const { assert } = require('chai');
const { search, createSnapshot, lastSeen, filterByScenario, originOf } = require('../html/dm-logic.js');
const { DATA } = require('../html/data.js');

// ── dm-logic functions ───────────────────────────────────────────────────────

describe('search', () => {
    const entries = [
        { type: 'monster', name: 'Diseased Wolf'  },
        { type: 'item',    name: 'Iron Ring'       },
        { type: 'contact', name: 'Mira the Fence'  },
    ];

    it('matches by name fragment (case-insensitive)', () => {
        assert.strictEqual(search('wolf',   entries).length, 1);
        assert.strictEqual(search('WOLF',   entries).length, 1);
        assert.strictEqual(search('ira',    entries).length, 1);
        assert.strictEqual(search('ring',   entries).length, 1);
        assert.strictEqual(search('dragon', entries).length, 0);
    });

    it('returns all entries for an empty query', () => {
        assert.strictEqual(search('', entries).length, 3);
    });

    it('returns empty array when no entries match', () => {
        assert.deepStrictEqual(search('zzz', entries), []);
    });
});

describe('createSnapshot', () => {
    it('captures scenario name, ISO date, and all assigned entries', () => {
        const snap = createSnapshot(
            { id: 's1', name: 'Ruins Run' },
            {
                monsters: [{ name: 'Wolf'     }],
                items:    [{ name: 'Iron Ring' }],
                contacts: [{ name: 'Mira'     }],
            },
            new Date('2025-03-14')
        );
        assert.strictEqual(snap.scenarioName, 'Ruins Run');
        assert.strictEqual(snap.date, '2025-03-14');
        assert.strictEqual(snap.entries.length, 3);
    });

    it('tags each entry with its type', () => {
        const snap = createSnapshot(
            { id: 's2', name: 'Forest Run' },
            { monsters: [{ name: 'Bear' }], items: [{ name: 'Sword' }] },
            new Date('2024-08-10')
        );
        assert.ok(snap.entries.find(e => e.type === 'monster' && e.name === 'Bear'));
        assert.ok(snap.entries.find(e => e.type === 'item'    && e.name === 'Sword'));
    });

    it('handles missing assignment categories gracefully', () => {
        const snap = createSnapshot(
            { id: 's3', name: 'Empty' },
            {},
            new Date('2025-01-01')
        );
        assert.strictEqual(snap.entries.length, 0);
    });
});

describe('lastSeen', () => {
    const logs = [
        { scenarioName: 'Forest Run', date: '2024-08-10', entries: [{ name: 'Wolf' }] },
        { scenarioName: 'Ruins Run',  date: '2025-03-14', entries: [{ name: 'Wolf' }, { name: 'Mira' }] },
    ];

    it('returns the most recent scenario name and date', () => {
        const result = lastSeen('Wolf', logs);
        assert.ok(result.includes('Ruins Run'), 'should reference most recent scenario');
        assert.ok(result.includes('2025-03-14'));
    });

    it('returns the only match when entry appears once', () => {
        const result = lastSeen('Mira', logs);
        assert.ok(result.includes('Ruins Run'));
    });

    it('returns null for an entry with no history', () => {
        assert.strictEqual(lastSeen('Dragon', logs), null);
    });

    it('returns null for empty logs', () => {
        assert.strictEqual(lastSeen('Wolf', []), null);
    });
});

describe('filterByScenario', () => {
    const logs = [
        { scenarioName: 'Forest Run', date: '2024-08-10',
          entries: [{ name: 'Wolf', type: 'monster' }] },
        { scenarioName: 'Ruins Run',  date: '2025-03-14',
          entries: [{ name: 'Iron Ring', type: 'item' }] },
    ];

    it('returns only entries from the named scenario', () => {
        const results = filterByScenario('Ruins Run', logs);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'Iron Ring');
    });

    it('returns empty array for an unknown scenario name', () => {
        assert.deepStrictEqual(filterByScenario('Nonexistent', logs), []);
    });

    it('returns empty array for empty logs', () => {
        assert.deepStrictEqual(filterByScenario('Ruins Run', []), []);
    });
});

describe('originOf', () => {
    it('returns player when owner is set', () => {
        assert.strictEqual(originOf({ owner: 'Elara' }), 'player');
    });

    it('returns scenario when scenarioId is set and no owner', () => {
        assert.strictEqual(originOf({ scenarioId: 's1' }), 'scenario');
    });

    it('owner takes priority over scenarioId', () => {
        assert.strictEqual(originOf({ owner: 'Elara', scenarioId: 's1' }), 'player');
    });

    it('returns campaign when neither is set', () => {
        assert.strictEqual(originOf({}), 'campaign');
    });
});

// ── Data shape validation (D3 / D5 / D7) ────────────────────────────────────

describe('DATA.powers shape (D3)', () => {
    it('every power has a non-empty scenarios array with name and use', () => {
        const missing = DATA.powers.filter(
            p => !Array.isArray(p.scenarios) || p.scenarios.length === 0
        );
        assert.strictEqual(missing.length, 0,
            `Missing scenarios on: ${missing.map(p => p.name).join(', ')}`);
    });

    it('every power has a non-empty overwhelmed string', () => {
        const missing = DATA.powers.filter(
            p => typeof p.overwhelmed !== 'string' || p.overwhelmed.length === 0
        );
        assert.strictEqual(missing.length, 0,
            `Missing overwhelmed on: ${missing.map(p => p.name).join(', ')}`);
    });

    it('every scenarios entry has name and use fields', () => {
        DATA.powers.forEach(p => {
            (p.scenarios || []).forEach(s => {
                assert.ok(s.name && s.use,
                    `${p.name} has a scenario entry missing name or use`);
            });
        });
    });
});

describe('DATA.creatures shape (D5)', () => {
    it('DATA.creatures exists and is an array', () => {
        assert.ok(Array.isArray(DATA.creatures),
            'DATA.creatures not yet populated — run D5');
    });

    it('DATA.creatures is non-empty', () => {
        if (!Array.isArray(DATA.creatures)) return;
        assert.ok(DATA.creatures.length > 0,
            'DATA.creatures is empty — run D5');
    });

    it('every creature has required fields and a full stat block', () => {
        if (!Array.isArray(DATA.creatures)) return; // not yet populated, first test covers it
        const STATS = ['Char', 'Dex', 'Endu', 'Hand', 'Might', 'Perc', 'Speed', 'Will'];
        DATA.creatures.forEach(c => {
            assert.ok(c.name,       `creature entry missing name`);
            assert.ok(c.category,   `${c.name} missing category`);
            assert.ok(c.motivation, `${c.name} missing motivation`);
            assert.ok(c.behaviour,  `${c.name} missing behaviour`);
            STATS.forEach(s =>
                assert.ok(typeof c.stats[s] === 'number', `${c.name} missing stat ${s}`));
            assert.ok(Array.isArray(c.attacks) && c.attacks.length > 0,
                `${c.name} has no attacks`);
        });
    });

    it('every attack has name, type, reach, and statReduced', () => {
        if (!Array.isArray(DATA.creatures)) return;
        DATA.creatures.forEach(c => {
            (c.attacks || []).forEach(a => {
                assert.ok(a.name,        `${c.name} attack missing name`);
                assert.ok(a.type,        `${c.name} attack "${a.name}" missing type`);
                assert.ok(a.reach,       `${c.name} attack "${a.name}" missing reach`);
                assert.ok(a.statReduced, `${c.name} attack "${a.name}" missing statReduced`);
            });
        });
    });
});

describe('DATA.items shape (D7)', () => {
    // Pure utility items (not weapons or armor) don't have damage/protects.
    const UTILITY_ITEMS = new Set(['horse','donkey','dog','falcon','cart','backpack','tools']);

    it('weapons and armor have damage or protects', () => {
        const broken = DATA.items.filter(i => i.statistics && !UTILITY_ITEMS.has(i.name) && !i.damage && !i.protects);
        assert.strictEqual(broken.length, 0,
            `Missing damage/protects on: ${broken.map(i => i.name).join(', ')}`);
    });

    it('boost entries have condition and effect', () => {
        DATA.items.forEach(i => {
            (i.boost || []).forEach(b =>
                assert.ok(b.condition && b.effect,
                    `${i.name} boost entry missing condition or effect`));
        });
    });

    it('hinder entries have condition and effect', () => {
        DATA.items.forEach(i => {
            (i.hinder || []).forEach(h =>
                assert.ok(h.condition && h.effect,
                    `${i.name} hinder entry missing condition or effect`));
        });
    });
});
