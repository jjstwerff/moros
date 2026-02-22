const LS_KEY = 'moros-categories';
const DEFAULT_CATS = ['setup', 'active', 'shelved', 'finished'];

export function loadCategories() {
    const custom = [];
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) custom.push(...parsed);
        }
    } catch (_) {}
    const all = [...DEFAULT_CATS];
    custom.forEach(c => { if (!all.includes(c)) all.push(c); });
    return all;
}

export function addCategory(raw) {
    if (!raw) return null;
    const name = raw.trim().toLowerCase();
    if (!name) return null;
    if (DEFAULT_CATS.includes(name)) return name;
    const custom = [];
    try {
        const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        if (Array.isArray(existing)) custom.push(...existing);
    } catch (_) {}
    if (!custom.includes(name)) {
        custom.push(name);
        localStorage.setItem(LS_KEY, JSON.stringify(custom));
    }
    return name;
}
