/**
 * Pure logic for the DM tool — no DOM, no localStorage, importable in Node for testing.
 */

/**
 * Search entries by name fragment (case-insensitive).
 * An empty query returns all entries unchanged.
 * @param {string} query
 * @param {Array<{type: string, name: string}>} entries
 * @returns {Array<{type: string, name: string}>}
 */
export function search(query, entries) {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(e => e.name.toLowerCase().includes(q));
}

/**
 * Create a history snapshot for a scenario at the time it is marked as played.
 * @param {{id: string, name: string}} scenario
 * @param {{monsters?: Array, items?: Array, contacts?: Array}} assignments
 * @param {Date} date
 * @returns {{scenarioName: string, date: string, entries: Array<{type: string, name: string}>}}
 */
export function createSnapshot(scenario, assignments, date) {
    const entries = [
        ...(assignments.monsters || []).map(e => ({ ...e, type: 'monster' })),
        ...(assignments.items    || []).map(e => ({ ...e, type: 'item'    })),
        ...(assignments.contacts || []).map(e => ({ ...e, type: 'contact' })),
    ];
    return {
        scenarioName: scenario.name,
        date: date.toISOString().slice(0, 10),
        entries,
    };
}

/**
 * Return a display string for the most recent scenario an entry appeared in,
 * or null if the entry has no history.
 * @param {string} name
 * @param {Array<{scenarioName: string, date: string, entries: Array<{name: string}>}>} logs
 * @returns {string|null}
 */
export function lastSeen(name, logs) {
    const matching = logs.filter(log => log.entries.some(e => e.name === name));
    if (matching.length === 0) return null;
    const latest = matching.sort((a, b) => b.date.localeCompare(a.date))[0];
    return `${latest.scenarioName} · ${latest.date}`;
}

/**
 * Return all entries from a named scenario's history log.
 * Returns an empty array if no log exists for that scenario name.
 * @param {string} scenarioName
 * @param {Array<{scenarioName: string, entries: Array}>} logs
 * @returns {Array}
 */
export function filterByScenario(scenarioName, logs) {
    const log = logs.find(l => l.scenarioName === scenarioName);
    return log ? log.entries : [];
}

/**
 * Derive the origin label for a campaign entry.
 * @param {{scenarioId?: string, owner?: string}} entry
 * @returns {'scenario'|'player'|'campaign'}
 */
export function originOf(entry) {
    if (entry.owner)      return 'player';
    if (entry.scenarioId) return 'scenario';
    return 'campaign';
}
