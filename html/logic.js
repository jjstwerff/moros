import { DATA } from './data.js';

class Progres {
    /**
     * Progression of a character during their previous life or the game.
     * @param {string} type - Any of "power", "background", or "specialization".
     * @param {string} name - The name of the power, background, or specialization.
     * @param {number} xp - The cost in terms of experience points.
     * @param {number} level - The reached level of the power, background, or specialization.
     * @param {string} stat - The statistic that increased.
     */
    constructor(type, name, xp, level, stat) {
        this.type = type;
        this.name = name;
        this.xp = xp;
        this.level = level;
        this.stat = stat;
    }
}

class Card {
    /**
     * A playing card in the game.
     * @param {string} source - The name of the card.
     * @param {Array.<string>} stats - The statistics that are available.
     * @param {string} special - The special effect of the card.
     */
    constructor(source, stats, special) {
        this.source = source;
        this.stats = stats;
        this.special = special;
    }
    toString() {
        return JSON.stringify(this);
    }
}

// ──────────────────────────────── STATE ────────────────────────────────
class State {
    /**
     * The full state of a character.
     * @param {string} name - The name of the character.
     * @param {string} gender - The gender.
     * @param {string} desc - A description of the character.
     * @param {string} place - The place of origin.
     * @param {string} race - The race, allows for powers to be learned.
     * @param {Array.<Progres>} progression - The progression in terms of powers, backgrounds, and specializations.
     * @param {Object} stats - The stats, all learned levels of statistics, powers, backgrounds, and specializations.
     * @param {number} xp - The total experience points needed for the progression.
     * @param {Set.<string>} items - The items the character has from their background or found during the game.
     */
    #place
    #race
    #progression
    #stats
    #xp
    #items
    #elements
    constructor() {
        this.name = '';
        this.gender = '';
        this.desc = '';
        this.category = '';
        this.#place = null;
        this.#race = null;
        this.#progression = [];
        this.#stats = {};
        this.#xp = 0;
        this.#items = new Set();
        this.#elements = [];
        DATA.statistics.forEach(s => this.#stats[s.abbreviation] = 1);
    }

    toJSON() {
        return {
            name: this.name,
            gender: this.gender,
            desc: this.desc,
            category: this.category,
            place: this.#place,
            race: this.#race,
            progression: this.#progression.map(p => ({
                type: p.type,
                name: p.name,
            })),
            items: Array.from(this.#items),
            elements: this.#elements,
        };
    }

    get elements() { return [...this.#elements]; }
    set elements(arr) { this.#elements = [...arr].slice(0, 3); }

    get stats() {
        return this.#stats;
    }

    get xp() {
        return this.#xp;
    }

    /**
     * Check if the character can learn this specific progression.
     * @param {string} type - Any of "power", "background", or "specialization".
     * @param {string | null} name - The name of the power, background, or specialization.
     * @returns {string | null} - Null if the progression is valid, otherwise an error message.
     */
    validProgress(type, name) {
        if (state.#progression[state.#progression.length-1]?.type === type)
            return "Cannot repeat same type, chose another type first.";
        if (type === 'background') {
            const bg = getBg(name);
            if (name && bg === undefined)
                return `Unknown background ${name}.`;
        } else if (type === 'power') {
            if (!state.#race)
                return "Please choose a race first.";
            const power = getPower(name);
            if (name && power === undefined)
                return `Unknown power ${name}.`;
        } else if (type === 'specialization') {
            if (!name) {
                if (state.#progression.findIndex(p => p.type === 'background') === -1)
                    return "Please choose a background first.";
                return undefined;
            }
            const spec = DATA.specToStat[ name ];
            if (spec === undefined)
                return `Unknown specialization ${name}.`;
            const level = stat(name) !== undefined ? stat(name) + 1 : 1;
            if (level > state.bgLevel(name))
                return `Background levels are too low to learn.`;
        } else {
            return `Unknown progression type ${type}.`;
        }
        // Progression rule 5: no stat may be raised more than 3 times in the initial 6 free progressions.
        if (state.#progression.length < 6 && name) {
            const projStat = state.#projectedStat(type, name);
            if (projStat) {
                const timesRaised = state.#progression.filter(p => p.stat === projStat).length;
                if (timesRaised >= 3) {
                    return `${projStat} has already been raised 3 times in the initial progressions.`;
                }
            }
        }
    }

    /**
     * Return the statistic that would be raised if type/name were learned next.
     * @param {string} type - Any of "power", "background", or "specialization".
     * @param {string} name - The name of the progression.
     * @returns {string | null}
     */
    #projectedStat(type, name) {
        return projectedStat(type, name);
    }

    /**
     * Calculate the combined level of backgrounds that provide for this specialization.
     * @param {string} spec
     * @returns {number}
     */
    bgLevel(spec){
        let level = 0;
        state.#progression.forEach(p => {
            if (p.type === 'background' && getBg(p.name).specializations.includes(spec))
                level++;
        });
        return level;
    }

    /**
     * Find the unlocked specializations for the character.
     * @returns {Array.<string>}
     */
    unlockedSpecs() {
        const unlocked = [];
        Object.keys(DATA.specToStat).forEach(spec => {
            if (state.bgLevel(spec) > 0)
                unlocked.push(spec);
        });
        return unlocked;
    }

    /**
     * Learn a progression to the character and calculate the total experience points needed.
     * @param {string} type - Any of "power", "background", or "specialization".
     * @param {string} name - The name of the power, background, or specialization.
     * @throws {Error} - If the progression is invalid.
     */
    learn(type, name) {
        const test = this.validProgress(type, name);
        if (test) {
            throw new Error(test);
        }
        let statistic;
        let level;
        if (type === 'background') {
            const bg = getBg(name);
            name = bg.name;
            level = stat(name) !== undefined ? stat(name) + 1 : 1;
            statistic = bg.statistics[(level + 1) % 2];
        } else if (type === 'power') {
            const power = getPower(name);
            name = power.name;
            level = stat(name) !== undefined ? stat(name) + 1 : 1;
            statistic = power.statistics[(level + 1) % 2];
        } else if (type === 'specialization') {
            level = stat(name) !== undefined ? stat(name) + 1 : 1;
            statistic = DATA.specToStat[ name ];
        } else {
            throw new Error(`Unknown progression type ${type}.`);
        }
        state.#stats[statistic]++;
        state.#stats[name] = level;
        // First 6 progressions are free; afterwards cost is level² — quadratic so
        // breadth is generous early and peak mastery costs proportionally more.
        const xp = state.#progression.length < 6 ? 0 : level * level;
        state.#xp += xp;
        state.#progression.push(new Progres(type, name, xp, level, statistic));
    }

    /**
     * Drop the last progression from the character and calculate the total experience points regained from it.
     * @throws {Error} - If there is no progression left to drop.
     */
    dropProgression() {
        if (state.#progression.length === 0) {
            throw new Error('No progression left to drop');
        }
        const p = state.#progression.pop();
        state.#xp -= p.xp;
        state.#stats[p.name]--;
        state.#stats[p.stat]--;
        if (p.type === "background") {
            const items = new Set(state.#items);
            state.#items.clear();
            items.forEach(i => {
                try {
                    this.addItem(i);
                } catch { /* item no longer allowed, skip */ }
            });
        }
        if (p.type === 'power') {
            const pw = getPower(p.name);
            if (pw?.special === 'elemental' && (state.#stats[p.name] ?? 0) === 0) {
                state.#elements = [];
            }
        }
    }

    set race(name) {
        if (DATA.races.findIndex(r => r.name === name) === -1) {
            throw new Error(`Race ${name} not found`);
        }
        state.#race = name;
        state.#progression = [];
        state.#items.clear();
    }

    get race() {
        return state.#race;
    }

    set place(name) {
        if (typeof name !== 'string' || !name.trim()) {
            throw new Error('Place must be a non-empty string');
        }
        // Custom place names are allowed for NPCs from places not yet in DATA.places.
        state.#place = name;
    }

    get place() {
        return state.#place;
    }

    /**
     * The current progression of the character.
     * @returns {Progres}
     */
    progres(idx) {
        return this.#progression[idx];
    }

    get progressions() {
        return this.#progression.length;
    }

    /**
     * A list of items allowed per learned background.
     * @returns {Map<string, number>}
     */
    itemAllowance() {
        const allowed = new Map();
        this.#progression.forEach(p => {
            if (p.type === 'background') {
                const s = stat(p.name);
                if (s > 0)
                    allowed.set(p.name, s + 1);
            }
        });
        return allowed;
    }

    /**
     * Add an item for the character.
     * @param {string} name
     */
    addItem(name) {
        const test = new Set(this.#items);
        test.add(name);
        DATA.items.forEach(i => {
            if ("restricted" in i) {
                test.delete(i.name);
            }
        });
        const allowed = this.itemAllowance();
        allowed.forEach((v, k) => {
            if (v > 0)
                getBg(k).items.forEach(i => {
                    const id = getItem(i).duplicates;
                    const d = new Set(id);
                    allowed.forEach((_, al) => { d.delete(al); });
                    if ((id === undefined || d.size > 0) && v > 0 && test.delete(i)) {
                        v--;
                        allowed.set(k, v);
                    }
                });
        });
        allowed.forEach((v, k) => {
            if (v > 0)
                getBg(k).items.forEach(i => {
                    if ("duplicates" in getItem(i) && v > 0 && test.delete(i)) {
                        v--;
                        allowed.set(k, v);
                    }
                });
        });
        if (test.size > 0)
            throw new Error(`Item ${name} not allowed by the characters background.`);
        this.#items.add(name);
    }

    removeItem(name) {
        this.#items.delete(name);
    }

    /**
     * Return the set of items the character has.
     * @returns {Set.<string>}
     */
    get items() {
        return this.#items;
    }

    get weight() {
        let weight = 0;
        this.#items.forEach(i => {
            const item = DATA.items.find(item => item.name === i);
            if (item)
                weight += item.bulk;
        });
        return weight;
    }

    /**
     * Return the possible cards of the character.
     * @returns {Array.<Card>}
     */
    get cards() {
        const cards = [];
        DATA.powers.forEach(p => {
            if (stat(p.name) > 0)
                cards.push(new Card(p.name, p.statistics, p.special));
        });
        state.items.forEach(item_name => {
            const it = getItem(item_name);
            if (it && it.statistics)
                cards.push(new Card(item_name, it.statistics, it.special || ''));
        });
        return cards;
    }
}

export let state = new State();
let characters = [];

export function stat(name) {
    const s = state.stats[name];
    return s ? s : 0;
}

export function initState() {
    state = new State();
}

export function charIndex(name) {
    return characters.findIndex(c => c.name === name);
}

export function removeChar(i) {
    characters.splice(i, 1);
}

export function toJSON() {
    return JSON.stringify(characters);
}

export function fromJSON(json) {
    characters = JSON.parse(json);
}

/**
 * Return the carry capacity of the character based on their Endurance statistic.
 * @returns {number}
 */
export function carryCapacity() {
    return stat('Endu') * 3;
}

/**
 * Return the contacts a character has from a background at a given place.
 * @param {string} backgroundName
 * @param {string} placeName
 * @returns {Array.<string>}
 */
export function getContacts(backgroundName, placeName) {
    const bg = getBg(backgroundName);
    if (!bg || !bg.contacts) return [];
    return bg.contacts[placeName] || [];
}

/**
 * Return true if a power would go Overwhelmed because either of its linked statistics is 0.
 * @param {string} powerName
 * @returns {boolean}
 */
export function isOverwhelmed(powerName) {
    const pw = getPower(powerName);
    if (!pw) return false;
    return pw.statistics.some(s => stat(s) === 0);
}

/**
 * Number of free progressions remaining in character creation.
 * @returns {number}
 */
export function freeProgressionsRemaining() {
    return Math.max(0, 6 - state.progressions);
}

/**
 * Validate the current character state against all creation rules.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validate() {
    const errors = [];
    const warnings = [];

    if (!state.name?.trim()) errors.push('Name is missing.');
    if (!state.race) errors.push('Race not chosen.');
    if (!state.place) errors.push('Place of origin not chosen.');

    const total = state.progressions;
    if (total < 6) warnings.push(`${total} of 6 creation progressions used.`);

    // No consecutive background or specialization — a power must separate them
    for (let i = 1; i < total; i++) {
        const prev = state.progres(i - 1);
        const curr = state.progres(i);
        if (prev.type === curr.type && curr.type !== 'power')
            errors.push(`Steps ${i} and ${i + 1} are both "${curr.type}" — a power must separate them.`);
    }

    // No single stat raised more than 3 times in the first 6 free progressions
    const statCounts = {};
    for (let i = 0; i < Math.min(total, 6); i++) {
        const p = state.progres(i);
        if (p.stat) statCounts[p.stat] = (statCounts[p.stat] || 0) + 1;
    }
    Object.entries(statCounts).forEach(([s, n]) => {
        if (n > 3) errors.push(`${s} raised ${n} times in the first 6 progressions (max 3).`);
    });

    // Powers must belong to the character's race
    if (state.race) {
        const raceData = DATA.races.find(r => r.name === state.race);
        const raceSet = new Set((raceData?.powers || []).map(p => p.toLowerCase()));
        for (let i = 0; i < total; i++) {
            const p = state.progres(i);
            if (p.type === 'power' && !raceSet.has(p.name.toLowerCase()))
                errors.push(`"${p.name}" is not a ${state.race} power.`);
        }
    }

    // Specialization level must not exceed combined background support
    for (let i = 0; i < total; i++) {
        const p = state.progres(i);
        if (p.type === 'specialization') {
            const supported = state.bgLevel(p.name);
            if (supported < p.level)
                errors.push(`Specialization "${p.name}" level ${p.level} exceeds background support (${supported}).`);
        }
    }

    // Encumbrance
    const w = state.weight;
    const cap = carryCapacity();
    if (w > cap) warnings.push(`Encumbered — bulk ${w} exceeds carry capacity ${cap}.`);

    return { errors, warnings };
}

/**
 * Number of characters saved in the game.
 * @returns {number}
 */
export function noCharacters() {
    return characters.length;
}

export function name(idx) {
    return characters[idx].name;
}

export function loadCharacter(idx) {
    const s = characters[idx];
    if (s instanceof State) {
        state = s;
    } else {
        loadDump(s);
    }
}

export function loadDump(s) {
    state = new State();
    state.name = s.name;
    state.gender = s.gender;
    if (s.race)
        state.race = s.race;
    if (s.place)
        state.place = s.place;
    state.desc = s.desc;
    if (s.category) state.category = s.category;
    s.progression.forEach(p => state.learn(p.type, p.name));
    s.items.forEach(i => {
        try {
            state.addItem(i)
        } catch { /* item rejected on load, skip */ }
    });
    if ('unrestricted' in s) {
        s.unrestricted.forEach(i => state.addItem(i));
    }
    if (Array.isArray(s.elements)) state.elements = s.elements;
}

export function statAbbr(name) {
    const s = DATA.statistics.find(s => s.name === name || s.abbreviation === name);
    return s ? s.abbreviation : name;
}

export function statName(name) {
    const s = DATA.statistics.find(s => s.name === name || s.abbreviation === name);
    return s ? s.name : name;
}

export function statAction(name) {
    const s = DATA.statistics.find(s => s.name === name || s.abbreviation === name);
    return s ? s.action : name;
}

/**
 * Return the statistic that would be raised if type/name were learned next.
 * @param {string} type - Any of "power", "background", or "specialization".
 * @param {string} name - The name of the progression.
 * @returns {string | null}
 */
export function projectedStat(type, name) {
    if (type === 'background') {
        const bg = getBg(name);
        if (!bg) return null;
        const level = stat(bg.name) + 1;
        return bg.statistics[(level + 1) % 2];
    } else if (type === 'power') {
        const power = getPower(name);
        if (!power) return null;
        const level = stat(power.name) + 1;
        return power.statistics[(level + 1) % 2];
    } else if (type === 'specialization') {
        return DATA.specToStat[name] || null;
    }
    return null;
}

export function getPower(name) {
    if (name === null)
        return null;
    return DATA.powers.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function getBg(name) {
    if (name === null)
        return null;
    return DATA.backgrounds.find(b => b.name.toLowerCase() === name.toLowerCase());
}

export function getItem(name) {
    return DATA.items.find(i => i.name === name);
}

export function charCategory(idx) {
    return characters[idx]?.category || '';
}

export function saveState(name) {
    const index = characters.findIndex(c => c.name === name);
    if (index === -1) {
        characters.push(state);
        return characters.length - 1;
    } else {
        characters[index] = state;
        return index;
    }
}
