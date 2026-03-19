const LS_KEY = 'moros-dm-categories';
const DEFAULT_CATS = [
    { name: 'setup',    sessionVisible: false },
    { name: 'active',   sessionVisible: true  },
    { name: 'shelved',  sessionVisible: false },
    { name: 'finished', sessionVisible: false },
];

/** Returns [{name, sessionVisible}] — always includes defaults first, then custom. */
export function loadCategories() {
    let custom = [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            let parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // migrate: string[] → object[]
                parsed = parsed.map(c =>
                    typeof c === 'string' ? { name: c, sessionVisible: true } : c
                );
                custom = parsed;
            }
        }
    } catch (_) {}
    const defaultNames = new Set(DEFAULT_CATS.map(c => c.name));
    const all = [...DEFAULT_CATS];
    custom.forEach(c => { if (!defaultNames.has(c.name)) all.push(c); });
    return all;
}

/** Adds a custom category (by name). Returns the {name,sessionVisible} object or null. */
export function addCategory(raw) {
    if (!raw) return null;
    const name = raw.trim().toLowerCase();
    if (!name) return null;
    const existing = loadCategories();
    if (existing.some(c => c.name === name)) return existing.find(c => c.name === name);
    const custom = _loadCustom();
    const entry = { name, sessionVisible: true };
    custom.push(entry);
    _saveCustom(custom);
    return entry;
}

/** Persists the full category list (for reorder/rename/delete/toggle from Config page). */
export function saveCategories(cats) {
    // Only save non-default entries — defaults are always merged in at load time.
    // But we need to persist *all* in order for reordering and per-cat sessionVisible overrides.
    // So save the complete list: defaults included, so order and sessionVisible are preserved.
    localStorage.setItem(LS_KEY, JSON.stringify(cats));
}

function _loadCustom() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        let parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(c => typeof c === 'string' ? { name: c, sessionVisible: true } : c);
    } catch (_) { return []; }
}

function _saveCustom(custom) {
    localStorage.setItem(LS_KEY, JSON.stringify(custom));
}
