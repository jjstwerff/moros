import { DATA } from './data.js';
import { loadCategories, addCategory } from './categories.js';

const DAMAGE_TYPES = [
    'fire', 'cold', 'electric', 'cutting', 'impaling',
    'blunt', 'grab', 'radiant', 'draining', 'pummel',
];

const LS = {
    contacts:  'moros-dm-contacts',
    items:     'moros-dm-items',
    monsters:  'moros-dm-monsters',
    places:    'moros-dm-places',
    scenarios: 'moros-dm-scenarios',
    chars:     'moros-characters',
};

// ── State ──────────────────────────────────────────────────────────────────
const st = { contacts: [], items: [], monsters: [], places: [], scenarios: [] };
const _catFilter = { items: '', monsters: '', places: '', scenarios: '' };

function loadAll() {
    ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
        try {
            const raw = localStorage.getItem(LS[k]);
            if (raw) st[k] = JSON.parse(raw);
        } catch (_) { st[k] = []; }
    });
}

function persist(k) {
    localStorage.setItem(LS[k], JSON.stringify(st[k]));
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Tab switching ──────────────────────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    const btn = document.querySelector(`.nav-tab[data-tab="${name}"]`);
    if (btn) btn.classList.add('active');
}

// ── Shared form helpers ────────────────────────────────────────────────────
function buildCheckboxGrid(name, options, checked = new Set()) {
    return `<div class="dm-checkbox-grid">${
        options.map(opt => `
        <label class="dm-checkbox-item">
            <input type="checkbox" name="${name}" value="${opt}" ${checked.has(opt) ? 'checked' : ''}>
            <span>${opt}</span>
        </label>`).join('')
    }</div>`;
}

function statBonusOptions() {
    const stats = DATA.statistics.map(s =>
        `<option value="${s.abbreviation}">${s.name} (${s.abbreviation})</option>`).join('');
    const actions = DATA.statistics.map(s =>
        `<option value="${s.action}">${s.action}</option>`).join('');
    return `<optgroup label="Statistics">${stats}</optgroup>
            <optgroup label="Actions">${actions}</optgroup>`;
}

// Bonus context registry: bonusId -> { get, set }
const _bonusCtx = {};

function renderBonuses(bonusId) {
    const el = document.getElementById(bonusId);
    if (!el) return;
    const bonuses = _bonusCtx[bonusId]?.get() || [];
    el.innerHTML = bonuses.map((b, i) => `
        <div class="dm-bonus-row">
            <select class="dm-input dm-bonus-target"
                    onchange="DM._setBonusField('${bonusId}',${i},'target',this.value)">
                ${statBonusOptions()}
            </select>
            <input type="number" class="dm-input dm-bonus-value" value="${b.value}"
                   min="-10" max="10"
                   onchange="DM._setBonusField('${bonusId}',${i},'value',+this.value)">
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeBonus('${bonusId}',${i})">✕</button>
        </div>`).join('');
    el.querySelectorAll('.dm-bonus-row').forEach((row, i) => {
        row.querySelector('.dm-bonus-target').value = bonuses[i].target;
    });
}

// ── Editing scratch state ──────────────────────────────────────────────────
let _itemBonuses = [];
let _attacks = [];
let _factions = [];
let _struggles = [];

function _regItemBonuses() {
    _bonusCtx['item-bonuses'] = { get: () => _itemBonuses, set: a => { _itemBonuses = a; } };
}

function _regAttackBonus(i) {
    const id = `atk-bonuses-${i}`;
    _bonusCtx[id] = {
        get: () => _attacks[i]?.bonus || [],
        set: a => { if (_attacks[i]) _attacks[i].bonus = a; },
    };
    return id;
}

// ── Category helpers ────────────────────────────────────────────────────────
function buildCatSelect(selected) {
    const cats = loadCategories();
    const opts = '<option value="">— none —</option>' +
        cats.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('') +
        '<option value="__add__">Add category…</option>';
    return `<select class="dm-input" name="category" onchange="DM._catChanged(this)">${opts}</select>`;
}

function buildListFilter(type) {
    const cats = loadCategories();
    const cur = _catFilter[type] || '';
    return `<div class="dm-list-filter">
        <span class="dm-filter-label">Filter:</span>
        <select class="dm-filter-select dm-input" onchange="DM._setCatFilter('${type}', this.value)">
            <option value="" ${cur === '' ? 'selected' : ''}>All</option>
            ${cats.map(c => `<option value="${c}" ${cur === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
    </div>`;
}

function _catChanged(sel) {
    if (sel.value !== '__add__') return;
    const raw = prompt('New category name:');
    const name = addCategory(raw);
    if (name) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.insertBefore(opt, sel.querySelector('[value="__add__"]'));
        sel.value = name;
    } else {
        sel.value = '';
    }
}

function _setCatFilter(type, val) {
    _catFilter[type] = val;
    if (type === 'items') renderItems();
    else if (type === 'monsters') renderMonsters();
    else if (type === 'places') renderPlaces();
    else if (type === 'scenarios') renderScenarios();
}

// ═════════════════════════════ CONTACTS ═══════════════════════════════════

function buildContactForm(contact = null) {
    const bgNames   = DATA.backgrounds.map(b => b.name);
    const itemNames = DATA.items.map(i => i.name);
    const places    = DATA.places.map(p =>
        `<option value="${p.name}">${p.name}</option>`).join('');
    const chk = arr => new Set(arr || []);

    return `
    <div class="dm-form-title">${contact ? 'Edit Contact' : 'New Contact'}</div>
    <div class="dm-form-body">
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Name</label>
                <input class="dm-input" name="name" type="text"
                       value="${esc(contact?.name)}" required>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Gender</label>
                <input class="dm-input" name="gender" type="text"
                       value="${esc(contact?.gender)}">
            </div>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Faction</label>
                <input class="dm-input" name="faction" type="text"
                       value="${esc(contact?.faction)}">
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Town</label>
                <select class="dm-input" name="town">
                    <option value="">— select town —</option>
                    ${places}
                </select>
            </div>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Race</label>
                <select class="dm-input" name="race">
                    <option value="">— select race —</option>
                    ${DATA.races.map(r => `<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="description" rows="3">${esc(contact?.description)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Specializations they can teach</label>
            <div class="dm-spec-groups">
            ${DATA.statistics.map(stat => {
                const specs = Object.entries(DATA.specToStat)
                    .filter(([, abbr]) => abbr === stat.abbreviation)
                    .map(([spec]) => spec);
                if (!specs.length) return '';
                return `<div class="dm-spec-group">
                    <div class="dm-spec-group-label">${esc(stat.name)}</div>
                    ${buildCheckboxGrid('specializations', specs, chk(contact?.specializations))}
                </div>`;
            }).join('')}
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Items they can provide</label>
            ${buildCheckboxGrid('items', itemNames, chk(contact?.items))}
        </div>
    </div>
    <div class="dm-form-actions">
        <button type="submit" class="btn-primary">Save Contact</button>
        <button type="button" class="btn-secondary"
                onclick="DM._closeForm('contact-form')">Cancel</button>
    </div>`;
}

function renderContacts() {
    const list = document.getElementById('contacts-list');
    if (!st.contacts.length) {
        list.innerHTML = '<div class="dm-empty">No contacts yet. Create the first one.</div>';
        return;
    }
    list.innerHTML = st.contacts.map(c => `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">${esc(c.name)}</div>
                <div class="dm-entry-sub">
                    ${[c.gender, c.race, c.faction, c.town].filter(Boolean).map(esc).join(' · ')}
                </div>
                ${c.description ? `<div class="dm-entry-desc">${snippet(c.description, 100)}</div>` : ''}
                ${c.backgrounds?.length ? `
                <div class="dm-entry-tags">
                    ${c.backgrounds.map(b => `<span class="dm-tag">${esc(b)}</span>`).join('')}
                </div>` : ''}
                ${c.specializations?.length ? `
                <div class="dm-entry-sub" style="margin-top:0.3rem">
                    Teaches: ${c.specializations.slice(0, 4).join(', ')}${c.specializations.length > 4 ? ` +${c.specializations.length - 4}` : ''}
                </div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editContact('${c.id}')">✎</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM.deleteContact('${c.id}')">✕</button>
            </div>
        </div>`).join('');
}

function newContact() {
    const form = document.getElementById('contact-form');
    form.dataset.id = '';
    form.innerHTML = buildContactForm();
    form.classList.add('active');
}

function editContact(id) {
    const contact = st.contacts.find(c => c.id === id);
    if (!contact) return;
    const form = document.getElementById('contact-form');
    form.dataset.id = id;
    form.innerHTML = buildContactForm(contact);
    form.classList.add('active');
    form.querySelector('[name=town]').value = contact.town || '';
    form.querySelector('[name=race]').value = contact.race || '';
}

function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;
    st.contacts = st.contacts.filter(c => c.id !== id);
    persist('contacts');
    renderContacts();
}

function saveContact(e) {
    e.preventDefault();
    const form = document.getElementById('contact-form');
    const id = form.dataset.id || uid();
    const contact = {
        id,
        name:            form.querySelector('[name=name]').value.trim(),
        gender:          form.querySelector('[name=gender]').value.trim(),
        faction:         form.querySelector('[name=faction]').value.trim(),
        town:            form.querySelector('[name=town]').value,
        race:            form.querySelector('[name=race]').value,
        description:     form.querySelector('[name=description]').value.trim(),
        specializations: [...form.querySelectorAll('[name=specializations]:checked')].map(cb => cb.value),
        items:           [...form.querySelectorAll('[name=items]:checked')].map(cb => cb.value),
    };
    if (!contact.name) return;
    const idx = st.contacts.findIndex(c => c.id === id);
    if (idx === -1) st.contacts.push(contact);
    else st.contacts[idx] = contact;
    persist('contacts');
    renderContacts();
    form.classList.remove('active');
}

// ═════════════════════════════ SPECIAL ITEMS ══════════════════════════════

function buildItemForm(item = null) {
    _itemBonuses = item?.bonuses ? item.bonuses.map(b => ({ ...b })) : [];
    const typeOptions = DATA.items.map(i =>
        `<option value="${i.name}">${i.name}</option>`).join('');

    return `
    <div class="dm-form-title">${item ? 'Edit Special Item' : 'New Special Item'}</div>
    <div class="dm-form-body">
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Name</label>
                <input class="dm-input" name="name" type="text"
                       value="${esc(item?.name)}" required>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Category</label>
                ${buildCatSelect(item?.category)}
            </div>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">General Type</label>
                <select class="dm-input" name="type">
                    <option value="">— none —</option>
                    ${typeOptions}
                </select>
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="description" rows="5">${esc(item?.description)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Bonuses to statistics or actions</label>
            <div id="item-bonuses" class="dm-bonus-list"></div>
            <button type="button" class="dm-btn-sm"
                    onclick="DM._addBonus('item-bonuses')">+ Add Bonus</button>
        </div>
    </div>
    <div class="dm-form-actions">
        <button type="submit" class="btn-primary">Save Item</button>
        <button type="button" class="btn-secondary"
                onclick="DM._closeForm('item-form')">Cancel</button>
    </div>`;
}

function renderItems() {
    const list = document.getElementById('items-list');
    const filtered = _catFilter.items
        ? st.items.filter(x => (x.category || '') === _catFilter.items)
        : st.items;
    let html = buildListFilter('items');
    if (!st.items.length) {
        html += '<div class="dm-empty">No special items yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No items match this filter.</div>';
    } else {
        html += filtered.map(item => `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(item.name)}
                    ${item.type ? `<span class="dm-entry-type">(${esc(item.type)})</span>` : ''}
                    ${item.category ? `<span class="dm-cat-badge">${esc(item.category)}</span>` : ''}
                </div>
                ${item.bonuses?.length ? `
                <div class="dm-entry-tags">
                    ${item.bonuses.map(b =>
                        `<span class="dm-tag">${esc(b.target)} ${b.value >= 0 ? '+' : ''}${b.value}</span>`
                    ).join('')}
                </div>` : ''}
                <div class="dm-entry-desc">${snippet(item.description, 120)}</div>
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editItem('${item.id}')">✎</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM.deleteItem('${item.id}')">✕</button>
            </div>
        </div>`).join('');
    }
    list.innerHTML = html;
}

function newItem() {
    const form = document.getElementById('item-form');
    form.dataset.id = '';
    form.innerHTML = buildItemForm();
    form.classList.add('active');
    _regItemBonuses();
    renderBonuses('item-bonuses');
}

function editItem(id) {
    const item = st.items.find(x => x.id === id);
    if (!item) return;
    const form = document.getElementById('item-form');
    form.dataset.id = id;
    form.innerHTML = buildItemForm(item);
    form.classList.add('active');
    _regItemBonuses();
    renderBonuses('item-bonuses');
    form.querySelector('[name=type]').value = item.type || '';
}

function deleteItem(id) {
    if (!confirm('Delete this special item?')) return;
    st.items = st.items.filter(x => x.id !== id);
    persist('items');
    renderItems();
}

function saveItem(e) {
    e.preventDefault();
    const form = document.getElementById('item-form');
    const id = form.dataset.id || uid();
    const catEl = form.querySelector('[name=category]');
    const item = {
        id,
        name:        form.querySelector('[name=name]').value.trim(),
        type:        form.querySelector('[name=type]').value,
        category:    (catEl && catEl.value !== '__add__') ? catEl.value : '',
        description: form.querySelector('[name=description]').value.trim(),
        bonuses:     _itemBonuses.map(b => ({ ...b })),
    };
    if (!item.name) return;
    const idx = st.items.findIndex(x => x.id === id);
    if (idx === -1) st.items.push(item);
    else st.items[idx] = item;
    persist('items');
    renderItems();
    form.classList.remove('active');
}

// ═════════════════════════════ MONSTERS ═══════════════════════════════════

function buildStatInputsHTML(stats = {}) {
    return `<div class="dm-stat-grid">${
        DATA.statistics.map(s => `
        <div class="dm-stat-cell">
            <label class="dm-stat-label">${s.abbreviation}</label>
            <input class="dm-input dm-stat-input" type="number"
                   name="stat-${s.abbreviation}"
                   value="${stats[s.abbreviation] || 1}" min="1" max="20">
        </div>`).join('')
    }</div>`;
}

function buildAttackBlock(i, atk = {}) {
    _regAttackBonus(i);
    const typeOpts = DAMAGE_TYPES.map(t =>
        `<option value="${t}" ${atk.damageType === t ? 'selected' : ''}>${t}</option>`).join('');

    return `
    <div class="dm-attack-block" data-atk="${i}">
        <div class="dm-attack-header">
            <span class="dm-attack-num">Attack ${i + 1}</span>
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeAttack(${i})">✕</button>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group" style="grid-column:1/-1">
                <label class="dm-label">Name</label>
                <input class="dm-input" type="text" value="${esc(atk.name)}"
                       oninput="DM._setAtkField(${i},'name',this.value)">
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" rows="2"
                      oninput="DM._setAtkField(${i},'description',this.value)">${esc(atk.description)}</textarea>
        </div>
        <div class="dm-form-row dm-attack-meta">
            <div class="dm-form-group">
                <label class="dm-label">Damage</label>
                <input class="dm-input" type="number" value="${atk.damage ?? 1}"
                       min="0" max="99"
                       oninput="DM._setAtkField(${i},'damage',+this.value)">
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Damage Type</label>
                <select class="dm-input"
                        onchange="DM._setAtkField(${i},'damageType',this.value)">
                    ${typeOpts}
                </select>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Reach</label>
                <input class="dm-input" type="text" value="${esc(atk.reach)}"
                       placeholder="e.g. melee, 10 ft"
                       oninput="DM._setAtkField(${i},'reach',this.value)">
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Stat / Action Bonuses</label>
            <div id="atk-bonuses-${i}" class="dm-bonus-list"></div>
            <button type="button" class="dm-btn-sm"
                    onclick="DM._addBonus('atk-bonuses-${i}')">+ Add Bonus</button>
        </div>
    </div>`;
}

function buildMonsterForm(monster = null) {
    _attacks = monster?.attacks
        ? monster.attacks.map(a => ({ ...a, bonus: (a.bonus || []).map(b => ({ ...b })) }))
        : [];

    return `
    <div class="dm-form-title">${monster ? 'Edit Monster' : 'New Monster'}</div>
    <div class="dm-form-body">
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Name</label>
                <input class="dm-input" name="name" type="text"
                       value="${esc(monster?.name)}" required>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Category</label>
                ${buildCatSelect(monster?.category)}
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="description" rows="4">${esc(monster?.description)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Statistics</label>
            ${buildStatInputsHTML(monster?.stats)}
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Attacks</label>
            <div id="monster-attacks" class="dm-attacks-list"></div>
            <button type="button" class="dm-btn-sm"
                    onclick="DM._addAttack()">+ Add Attack</button>
        </div>
    </div>
    <div class="dm-form-actions">
        <button type="submit" class="btn-primary">Save Monster</button>
        <button type="button" class="btn-secondary"
                onclick="DM._closeForm('monster-form')">Cancel</button>
    </div>`;
}

function renderAttacks() {
    const container = document.getElementById('monster-attacks');
    if (!container) return;
    container.innerHTML = _attacks.map((a, i) => buildAttackBlock(i, a)).join('');
    _attacks.forEach((_, i) => renderBonuses(`atk-bonuses-${i}`));
}

function renderMonsters() {
    const list = document.getElementById('monsters-list');
    const filtered = _catFilter.monsters
        ? st.monsters.filter(x => (x.category || '') === _catFilter.monsters)
        : st.monsters;
    let html = buildListFilter('monsters');
    if (!st.monsters.length) {
        html += '<div class="dm-empty">No monsters yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No monsters match this filter.</div>';
    } else {
        html += filtered.map(m => `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(m.name)}
                    ${m.category ? `<span class="dm-cat-badge">${esc(m.category)}</span>` : ''}
                </div>
                <div class="dm-entry-desc">${snippet(m.description, 80)}</div>
                <div class="dm-entry-tags dm-stat-tags">
                    ${DATA.statistics.map(s =>
                        `<span class="dm-tag dm-stat-tag">${s.abbreviation}&nbsp;${m.stats?.[s.abbreviation] ?? 1}</span>`
                    ).join('')}
                </div>
                ${m.attacks?.length ? `
                <div class="dm-entry-sub" style="margin-top:0.35rem">
                    ${m.attacks.length} attack${m.attacks.length !== 1 ? 's' : ''}:
                    ${m.attacks.map(a => esc(a.name)).filter(Boolean).join(', ')}
                </div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editMonster('${m.id}')">✎</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM.deleteMonster('${m.id}')">✕</button>
            </div>
        </div>`).join('');
    }
    list.innerHTML = html;
}

function newMonster() {
    const form = document.getElementById('monster-form');
    form.dataset.id = '';
    form.innerHTML = buildMonsterForm();
    form.classList.add('active');
    renderAttacks();
}

function editMonster(id) {
    const monster = st.monsters.find(m => m.id === id);
    if (!monster) return;
    const form = document.getElementById('monster-form');
    form.dataset.id = id;
    form.innerHTML = buildMonsterForm(monster);
    form.classList.add('active');
    renderAttacks();
}

function deleteMonster(id) {
    if (!confirm('Delete this monster?')) return;
    st.monsters = st.monsters.filter(m => m.id !== id);
    persist('monsters');
    renderMonsters();
}

function saveMonster(e) {
    e.preventDefault();
    const form = document.getElementById('monster-form');
    const id = form.dataset.id || uid();
    const stats = {};
    DATA.statistics.forEach(s => {
        const el = form.querySelector(`[name=stat-${s.abbreviation}]`);
        stats[s.abbreviation] = Math.max(1, parseInt(el?.value || 1, 10) || 1);
    });
    const mCatEl = form.querySelector('[name=category]');
    const monster = {
        id,
        name:        form.querySelector('[name=name]').value.trim(),
        category:    (mCatEl && mCatEl.value !== '__add__') ? mCatEl.value : '',
        description: form.querySelector('[name=description]').value.trim(),
        stats,
        attacks:     _attacks.map(a => ({ ...a, bonus: [...(a.bonus || [])] })),
    };
    if (!monster.name) return;
    const idx = st.monsters.findIndex(m => m.id === id);
    if (idx === -1) st.monsters.push(monster);
    else st.monsters[idx] = monster;
    persist('monsters');
    renderMonsters();
    form.classList.remove('active');
}

// ═════════════════════════════ PLACES ═════════════════════════════════════

const PLACE_TYPES = ['town', 'city', 'ruins', 'castle', 'monastery'];

function buildFactionBlock(fi, faction) {
    const contactOpts = st.contacts.map(c => ({
        value: c.id,
        label: c.name + (c.faction ? ` · ${c.faction}` : ''),
    }));
    const chkContacts = new Set(faction.contacts || []);
    return `
    <div class="dm-faction-block" data-fi="${fi}">
        <div class="dm-attack-header">
            <input class="dm-input" type="text" value="${esc(faction.name)}"
                   placeholder="Faction name"
                   oninput="DM._setFactionName(${fi}, this.value)">
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeFaction(${fi})">✕</button>
        </div>
        ${contactOpts.length ? `
        <div class="dm-form-group" style="margin-top:0.5rem">
            <label class="dm-label">Contacts at this place</label>
            ${buildCheckboxGridVL(`faction-${fi}-contacts`, contactOpts, chkContacts)}
        </div>` : '<div class="dm-empty" style="padding:0.4rem 0;font-size:0.8rem">No contacts defined yet.</div>'}
    </div>`;
}

function renderFactions() {
    const el = document.getElementById('place-factions-container');
    if (!el) return;
    el.innerHTML = _factions.length
        ? _factions.map((f, i) => buildFactionBlock(i, f)).join('')
        : '<div class="dm-empty" style="padding:0.4rem 0;font-size:0.8rem">No factions yet.</div>';
}

function buildStruggleBlock(stri, struggle) {
    return `
    <div class="dm-struggle-block" data-stri="${stri}">
        <div class="dm-attack-header">
            <span class="dm-attack-num">Struggle ${stri + 1}</span>
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeStruggle(${stri})">✕</button>
        </div>
        <div class="dm-form-group">
            <textarea class="dm-input" rows="2"
                      oninput="DM._setStruggleDesc(${stri}, this.value)">${esc(struggle.description)}</textarea>
        </div>
    </div>`;
}

function renderStruggles() {
    const el = document.getElementById('place-struggles-container');
    if (!el) return;
    el.innerHTML = _struggles.length
        ? _struggles.map((s, i) => buildStruggleBlock(i, s)).join('')
        : '<div class="dm-empty" style="padding:0.4rem 0;font-size:0.8rem">No struggles yet.</div>';
}

function buildPlaceForm(place = null) {
    const typeOpts = PLACE_TYPES.map(t =>
        `<option value="${t}" ${place?.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
    ).join('');
    const monsterOpts  = st.monsters.map(m => ({ value: m.id, label: m.name }));
    const stdItemNames = DATA.items.map(i => i.name);
    const specItemOpts = st.items.map(i => ({ value: i.id, label: i.name }));
    const chkMonsters  = new Set(place?.monsters     || []);
    const chkItems     = new Set(place?.items        || []);
    const chkSpecItems = new Set(place?.specialItems || []);
    return `
    <div class="dm-form-title">${place ? 'Edit Place' : 'New Place'}</div>
    <div class="dm-form-body">
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Name</label>
                <input class="dm-input" name="place-name" type="text"
                       value="${esc(place?.name)}" required>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Category</label>
                ${buildCatSelect(place?.category)}
            </div>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Type</label>
                <select class="dm-input" name="place-type">
                    ${typeOpts}
                </select>
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="place-desc" rows="4">${esc(place?.description)}</textarea>
        </div>
        ${monsterOpts.length ? `
        <div class="dm-form-group">
            <label class="dm-label">Monsters present</label>
            ${buildCheckboxGridVL('place-monsters', monsterOpts, chkMonsters)}
        </div>` : ''}
        <div class="dm-form-group">
            <label class="dm-label">Items available</label>
            ${buildCheckboxGrid('place-items', stdItemNames, chkItems)}
            ${specItemOpts.length ? `
            <div style="margin-top:0.5rem">
                <div class="dm-label" style="margin-bottom:0.25rem;opacity:0.75">Special Items</div>
                ${buildCheckboxGridVL('place-special-items', specItemOpts, chkSpecItems)}
            </div>` : ''}
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Map Location (col, row)</label>
                <div style="display:flex;gap:0.5rem;align-items:center">
                    <input class="dm-input" name="place-map-col" type="number" min="0"
                           placeholder="col" style="width:5rem"
                           value="${place?.mapTile != null ? place.mapTile.col : ''}">
                    <input class="dm-input" name="place-map-row" type="number" min="0"
                           placeholder="row" style="width:5rem"
                           value="${place?.mapTile != null ? place.mapTile.row : ''}">
                    ${place?.mapTile != null
                        ? `<a href="hex-map-editor.html" target="_blank" style="font-size:12px;color:var(--accent,#c8a050);white-space:nowrap">Open Map →</a>`
                        : ''}
                </div>
            </div>
        </div>
        <div class="dm-form-group">
            <div class="dm-scenario-section-header">
                <span class="dm-scenario-section-title">Factions</span>
                <button type="button" class="dm-btn-sm" onclick="DM._addFaction()">+ Add Faction</button>
            </div>
            <div id="place-factions-container"></div>
        </div>
        <div class="dm-form-group">
            <div class="dm-scenario-section-header">
                <span class="dm-scenario-section-title">Struggles</span>
                <button type="button" class="dm-btn-sm" onclick="DM._addStruggle()">+ Add Struggle</button>
            </div>
            <div id="place-struggles-container"></div>
        </div>
    </div>
    <div class="dm-form-actions">
        <button type="submit" class="btn-primary">Save Place</button>
        <button type="button" class="btn-secondary"
                onclick="DM._closeForm('place-form')">Cancel</button>
    </div>`;
}

function renderPlaces() {
    const list = document.getElementById('places-list');
    if (!list) return;
    const filtered = _catFilter.places
        ? st.places.filter(x => (x.category || '') === _catFilter.places)
        : st.places;
    let html = buildListFilter('places');
    if (!st.places.length) {
        html += '<div class="dm-empty">No places yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No places match this filter.</div>';
    } else {
        html += filtered.map(p => `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(p.name)}
                    ${p.type ? `<span class="dm-entry-type">(${esc(p.type)})</span>` : ''}
                    ${p.category ? `<span class="dm-cat-badge">${esc(p.category)}</span>` : ''}
                    ${p.mapTile != null ? `<span class="dm-entry-type" title="Map: col ${p.mapTile.col}, row ${p.mapTile.row}">📍 ${p.mapTile.col},${p.mapTile.row}</span>` : ''}
                </div>
                ${p.description ? `<div class="dm-entry-desc">${snippet(p.description, 100)}</div>` : ''}
                ${p.factions?.length ? `
                <div class="dm-entry-sub" style="margin-top:0.3rem">
                    Factions: ${p.factions.map(f => esc(f.name)).filter(Boolean).join(', ')}
                </div>` : ''}
                ${p.struggles?.length ? `
                <div class="dm-entry-sub">
                    ${p.struggles.length} struggle${p.struggles.length !== 1 ? 's' : ''}
                </div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editPlace('${p.id}')">✎</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM.deletePlace('${p.id}')">✕</button>
            </div>
        </div>`).join('');
    }
    list.innerHTML = html;
}

function newPlace() {
    _factions  = [];
    _struggles = [];
    const form = document.getElementById('place-form');
    form.dataset.id = '';
    form.innerHTML = buildPlaceForm();
    form.classList.add('active');
    renderFactions();
    renderStruggles();
}

function editPlace(id) {
    const place = st.places.find(p => p.id === id);
    if (!place) return;
    _factions  = deepCopy(place.factions  || []);
    _struggles = deepCopy(place.struggles || []);
    const form = document.getElementById('place-form');
    form.dataset.id = id;
    form.innerHTML = buildPlaceForm(place);
    form.classList.add('active');
    renderFactions();
    renderStruggles();
}

function deletePlace(id) {
    if (!confirm('Delete this place?')) return;
    st.places = st.places.filter(p => p.id !== id);
    persist('places');
    renderPlaces();
}

function savePlace(e) {
    e.preventDefault();
    const form = document.getElementById('place-form');
    const id   = form.dataset.id || uid();
    _factions.forEach((f, fi) => {
        f.contacts = [...form.querySelectorAll(`[name=faction-${fi}-contacts]:checked`)].map(cb => cb.value);
    });
    const pCatEl = form.querySelector('[name=category]');
    const mapColEl = form.querySelector('[name=place-map-col]');
    const mapRowEl = form.querySelector('[name=place-map-row]');
    const mapCol = mapColEl?.value !== '' ? parseInt(mapColEl.value, 10) : null;
    const mapRow = mapRowEl?.value !== '' ? parseInt(mapRowEl.value, 10) : null;
    const mapTile = (mapCol != null && mapRow != null && !isNaN(mapCol) && !isNaN(mapRow))
        ? { col: mapCol, row: mapRow } : null;

    const place = {
        id,
        name:         form.querySelector('[name=place-name]').value.trim(),
        type:         form.querySelector('[name=place-type]').value,
        category:     (pCatEl && pCatEl.value !== '__add__') ? pCatEl.value : '',
        description:  form.querySelector('[name=place-desc]').value.trim(),
        monsters:     [...form.querySelectorAll('[name=place-monsters]:checked')].map(cb => cb.value),
        items:        [...form.querySelectorAll('[name=place-items]:checked')].map(cb => cb.value),
        specialItems: [...form.querySelectorAll('[name=place-special-items]:checked')].map(cb => cb.value),
        factions:     _factions.map(f => ({ ...f, contacts: [...(f.contacts || [])] })),
        struggles:    _struggles.map(s => ({ ...s })),
        mapTile,
    };
    if (!place.name) return;
    const idx = st.places.findIndex(p => p.id === id);
    if (idx === -1) st.places.push(place);
    else st.places[idx] = place;
    persist('places');
    renderPlaces();
    form.classList.remove('active');
}

// ── Place mutation helpers ─────────────────────────────────────────────────
function _addFaction() {
    _factions.push({ name: '', contacts: [] });
    renderFactions();
}

function _removeFaction(fi) {
    _factions.splice(fi, 1);
    renderFactions();
}

function _setFactionName(fi, value) {
    if (_factions[fi]) _factions[fi].name = value;
}

function _addStruggle() {
    _struggles.push({ description: '' });
    renderStruggles();
}

function _removeStruggle(stri) {
    _struggles.splice(stri, 1);
    renderStruggles();
}

function _setStruggleDesc(stri, value) {
    if (_struggles[stri]) _struggles[stri].description = value;
}

// ═════════════════════════════ SCENARIOS ══════════════════════════════════

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }
function getCharacters() {
    try { return JSON.parse(localStorage.getItem(LS.chars) || '[]'); } catch (_) { return []; }
}
function buildCheckboxGridVL(name, options, checkedSet = new Set()) {
    return `<div class="dm-checkbox-grid">${
        options.map(opt => `
        <label class="dm-checkbox-item">
            <input type="checkbox" name="${name}" value="${esc(opt.value)}"
                   ${checkedSet.has(opt.value) ? 'checked' : ''}>
            <span>${esc(opt.label)}</span>
        </label>`).join('')
    }</div>`;
}

let _editingScenario = null;
let _expandedScenes  = new Set();

function _syncFromDOM() {
    if (!_editingScenario) return;
    const f = document.getElementById('scenario-form');
    if (!f) return;
    const nameEl = f.querySelector('[name=sc-name]');
    if (nameEl) _editingScenario.name = nameEl.value;
    const descEl = f.querySelector('[name=sc-desc]');
    if (descEl) _editingScenario.description = descEl.value;
    const catEl = f.querySelector('[name=category]');
    if (catEl && catEl.value !== '__add__') _editingScenario.category = catEl.value;
    _editingScenario.characters = [...f.querySelectorAll('[name=sc-characters]:checked')].map(cb => cb.value);
    _editingScenario.contacts   = [...f.querySelectorAll('[name=sc-contacts]:checked')].map(cb => cb.value);
    _editingScenario.scenes.forEach((scene, si) => {
        const block = f.querySelector(`.dm-scene-block[data-si="${si}"]`);
        if (!block) return;
        const snEl = block.querySelector('[name=scene-name]');
        if (snEl) scene.name = snEl.value;
        const sdEl = block.querySelector('[name=scene-desc]');
        if (sdEl) scene.description = sdEl.value;
        const spEl = block.querySelector('[name=scene-place]');
        if (spEl) scene.place = spEl.value;
        scene.characters = [...block.querySelectorAll(`[name=scene-${si}-chars]:checked`)].map(cb => cb.value);
        scene.contacts   = [...block.querySelectorAll(`[name=scene-${si}-contacts]:checked`)].map(cb => cb.value);
        scene.monsters   = [...block.querySelectorAll(`[name=scene-${si}-monsters]:checked`)].map(cb => cb.value);
        scene.challenges.forEach((ch, ci) => {
            const cb = block.querySelector(`.dm-challenge-block[data-ci="${ci}"]`);
            if (!cb) return;
            const cdEl = cb.querySelector('[name=challenge-desc]');
            if (cdEl) ch.description = cdEl.value;
            ch.rewards.forEach((r, ri) => {
                const rrow = cb.querySelector(`.dm-reward-row[data-ri="${ri}"]`);
                if (!rrow) return;
                r.type   = rrow.querySelector('.dm-reward-type').value;
                r.itemId = rrow.querySelector('.dm-reward-item').value;
            });
        });
    });
}

// ── Scenario form builders ─────────────────────────────────────────────────
function buildRewardRow(si, ci, ri, reward) {
    const normalOpts = DATA.items.map(i =>
        `<option value="${esc(i.name)}" ${reward.itemId === i.name && reward.type !== 'special' ? 'selected' : ''}>${esc(i.name)}</option>`
    ).join('');
    const specialOpts = st.items.length
        ? st.items.map(i =>
            `<option value="${esc(i.id)}" ${reward.itemId === i.id ? 'selected' : ''}>${esc(i.name)}</option>`
          ).join('')
        : '<option value="">— no special items defined —</option>';
    return `
    <div class="dm-reward-row" data-ri="${ri}">
        <select class="dm-input dm-reward-type"
                onchange="DM._setRewardType(${si},${ci},${ri},this.value)">
            <option value="normal" ${reward.type !== 'special' ? 'selected' : ''}>Normal Item</option>
            <option value="special" ${reward.type === 'special' ? 'selected' : ''}>Special Item</option>
        </select>
        <select class="dm-input dm-reward-item">
            ${reward.type === 'special' ? specialOpts : normalOpts}
        </select>
        <button type="button" class="dm-btn-icon dm-btn-delete"
                onclick="DM._removeReward(${si},${ci},${ri})">✕</button>
    </div>`;
}

function renderRewards(si, ci) {
    const el = document.getElementById(`challenge-rewards-${si}-${ci}`);
    if (!el) return;
    const rewards = _editingScenario.scenes[si]?.challenges[ci]?.rewards || [];
    el.innerHTML = rewards.map((r, ri) => buildRewardRow(si, ci, ri, r)).join('');
}

function buildChallengeBlock(si, ci, ch) {
    return `
    <div class="dm-challenge-block" data-ci="${ci}">
        <div class="dm-challenge-header">
            <span class="dm-challenge-num">Challenge ${ci + 1}</span>
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeChallenge(${si},${ci})">✕</button>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="challenge-desc"
                      rows="3">${esc(ch.description)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Rewards</label>
            <div id="challenge-rewards-${si}-${ci}" class="dm-reward-list"></div>
            <button type="button" class="dm-btn-sm"
                    onclick="DM._addReward(${si},${ci})">+ Add Reward</button>
        </div>
    </div>`;
}

function renderChallenges(si) {
    const el = document.getElementById(`scene-challenges-${si}`);
    if (!el) return;
    const challenges = _editingScenario.scenes[si]?.challenges || [];
    el.innerHTML = challenges.map((ch, ci) => buildChallengeBlock(si, ci, ch)).join('');
    challenges.forEach((_, ci) => renderRewards(si, ci));
}

function buildSceneBlock(i, scene) {
    const charOpts    = getCharacters().map(c => ({ value: c.name, label: c.name }));
    const contactOpts = st.contacts.map(c => ({ value: c.id, label: c.name + (c.town ? ` · ${c.town}` : '') }));
    const monsterOpts = st.monsters.map(m => ({ value: m.id, label: m.name }));
    const chkChars    = new Set(scene.characters || []);
    const chkContacts = new Set(scene.contacts   || []);
    const chkMonsters = new Set(scene.monsters   || []);
    return `
    <div class="dm-scene-block" data-si="${i}">
        <div class="dm-scene-header" onclick="DM._toggleScene(${i})">
            <input class="dm-input dm-scene-name-input" type="text" name="scene-name"
                   value="${esc(scene.name)}" placeholder="Scene name"
                   onclick="event.stopPropagation()" oninput="event.stopPropagation()">
            <div class="dm-scene-header-right">
                <span class="dm-scene-toggle">▼</span>
                <button type="button" class="dm-btn-icon dm-btn-delete"
                        onclick="event.stopPropagation(); DM._removeScene(${i})">✕</button>
            </div>
        </div>
        <div class="dm-scene-body" id="dm-scene-body-${i}">
            <div class="dm-scene-body-inner">
                <div class="dm-form-row">
                    <div class="dm-form-group">
                        <label class="dm-label">Description</label>
                        <textarea class="dm-input" name="scene-desc"
                                  rows="3">${esc(scene.description)}</textarea>
                    </div>
                    <div class="dm-form-group">
                        <label class="dm-label">Place</label>
                        <select class="dm-input" name="scene-place">
                            <option value="">— no specific place —</option>
                            ${st.places.map(p =>
                                `<option value="${esc(p.id)}" ${scene.place === p.id ? 'selected' : ''}>${esc(p.name)}${p.type ? ` (${esc(p.type)})` : ''}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="dm-form-row">
                    ${charOpts.length ? `
                    <div class="dm-form-group">
                        <label class="dm-label">Linked Characters</label>
                        ${buildCheckboxGridVL(`scene-${i}-chars`, charOpts, chkChars)}
                    </div>` : ''}
                    ${contactOpts.length ? `
                    <div class="dm-form-group">
                        <label class="dm-label">Linked Contacts</label>
                        ${buildCheckboxGridVL(`scene-${i}-contacts`, contactOpts, chkContacts)}
                    </div>` : ''}
                </div>
                ${monsterOpts.length ? `
                <div class="dm-form-group">
                    <label class="dm-label">Linked Monsters</label>
                    ${buildCheckboxGridVL(`scene-${i}-monsters`, monsterOpts, chkMonsters)}
                </div>` : ''}
                <div class="dm-form-group">
                    <div class="dm-scenario-section-header">
                        <span class="dm-scenario-section-title">Challenges</span>
                        <button type="button" class="dm-btn-sm"
                                onclick="DM._addChallenge(${i})">+ Add Challenge</button>
                    </div>
                    <div id="scene-challenges-${i}" class="dm-challenges-list"></div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderScenes() {
    const el = document.getElementById('scenario-scenes-container');
    if (!el) return;
    el.innerHTML = (_editingScenario?.scenes || []).map((s, i) => buildSceneBlock(i, s)).join('');
    _editingScenario.scenes.forEach((_, i) => {
        if (_expandedScenes.has(i)) {
            const body = document.getElementById(`dm-scene-body-${i}`);
            if (body) {
                body.classList.add('open');
                const tog = body.previousElementSibling?.querySelector('.dm-scene-toggle');
                if (tog) tog.textContent = '▲';
            }
        }
        renderChallenges(i);
    });
}

function buildScenarioForm(scenario = null) {
    const charOpts    = getCharacters().map(c => ({ value: c.name, label: c.name }));
    const contactOpts = st.contacts.map(c => ({ value: c.id, label: c.name + (c.town ? ` · ${c.town}` : '') }));
    const chkChars    = new Set(scenario?.characters || []);
    const chkContacts = new Set(scenario?.contacts   || []);
    return `
    <div class="dm-form-title">${scenario ? 'Edit Scenario' : 'New Scenario'}</div>
    <div class="dm-form-body">
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Name</label>
                <input class="dm-input" name="sc-name" type="text"
                       value="${esc(scenario?.name)}" required>
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Category</label>
                ${buildCatSelect(scenario?.category)}
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="sc-desc" rows="4">${esc(scenario?.description)}</textarea>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Linked Characters</label>
                ${charOpts.length
                    ? buildCheckboxGridVL('sc-characters', charOpts, chkChars)
                    : '<div class="dm-empty" style="padding:0.5rem 0;font-size:0.8rem">No characters in roster yet</div>'}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Linked Contacts</label>
                ${contactOpts.length
                    ? buildCheckboxGridVL('sc-contacts', contactOpts, chkContacts)
                    : '<div class="dm-empty" style="padding:0.5rem 0;font-size:0.8rem">No contacts defined yet</div>'}
            </div>
        </div>
        <div class="dm-form-group">
            <div class="dm-scenario-section-header">
                <span class="dm-scenario-section-title">Scenes</span>
                <button type="button" class="dm-btn-sm" onclick="DM._addScene()">+ Add Scene</button>
            </div>
            <div id="scenario-scenes-container" class="dm-scenes-container"></div>
        </div>
    </div>
    <div class="dm-form-actions">
        <button type="submit" class="btn-primary">Save Scenario</button>
        <button type="button" class="btn-secondary"
                onclick="DM._closeForm('scenario-form')">Cancel</button>
    </div>`;
}

// ── Scenario CRUD ──────────────────────────────────────────────────────────
function renderScenarios() {
    const list = document.getElementById('scenarios-list');
    if (!list) return;
    const filtered = _catFilter.scenarios
        ? st.scenarios.filter(x => (x.category || '') === _catFilter.scenarios)
        : st.scenarios;
    let html = buildListFilter('scenarios');
    if (!st.scenarios.length) {
        html += '<div class="dm-empty">No scenarios yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No scenarios match this filter.</div>';
    } else {
        html += filtered.map(s => `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(s.name)}
                    ${s.category ? `<span class="dm-cat-badge">${esc(s.category)}</span>` : ''}
                </div>
                <div class="dm-entry-desc">${snippet(s.description, 80)}</div>
                <div class="dm-entry-sub" style="margin-top:0.3rem">
                    ${s.scenes.length} scene${s.scenes.length !== 1 ? 's' : ''}
                    ${s.characters?.length ? ` · ${s.characters.length} character${s.characters.length !== 1 ? 's' : ''}` : ''}
                    ${s.contacts?.length   ? ` · ${s.contacts.length} contact${s.contacts.length !== 1 ? 's' : ''}` : ''}
                </div>
            </div>
            <div class="dm-entry-actions">
                <a class="dm-btn-icon" href="scenario-print.html?id=${s.id}" target="_blank" title="Open print view">⎙</a>
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editScenario('${s.id}')">✎</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM.deleteScenario('${s.id}')">✕</button>
            </div>
        </div>`).join('');
    }
    list.innerHTML = html;
}

function newScenario() {
    _editingScenario = { id: uid(), name: '', description: '', category: '', characters: [], contacts: [], scenes: [] };
    _expandedScenes.clear();
    const form = document.getElementById('scenario-form');
    form.dataset.id = '';
    form.innerHTML = buildScenarioForm();
    form.classList.add('active');
    renderScenes();
}

function editScenario(id) {
    const scenario = st.scenarios.find(s => s.id === id);
    if (!scenario) return;
    _editingScenario = deepCopy(scenario);
    _expandedScenes.clear();
    const form = document.getElementById('scenario-form');
    form.dataset.id = id;
    form.innerHTML = buildScenarioForm(scenario);
    form.classList.add('active');
    renderScenes();
}

function deleteScenario(id) {
    if (!confirm('Delete this scenario?')) return;
    st.scenarios = st.scenarios.filter(s => s.id !== id);
    persist('scenarios');
    renderScenarios();
}

function saveScenario(e) {
    e.preventDefault();
    _syncFromDOM();
    const form = document.getElementById('scenario-form');
    const id   = form.dataset.id || _editingScenario.id || uid();
    const scenario = { ...deepCopy(_editingScenario), id };
    if (!scenario.name) return;
    const idx = st.scenarios.findIndex(s => s.id === id);
    if (idx === -1) st.scenarios.push(scenario);
    else st.scenarios[idx] = scenario;
    persist('scenarios');
    renderScenarios();
    form.classList.remove('active');
    _editingScenario = null;
    _expandedScenes.clear();
}

// ── Scenario mutation helpers ──────────────────────────────────────────────
function _addScene() {
    _syncFromDOM();
    const si = _editingScenario.scenes.length;
    _editingScenario.scenes.push({
        id: uid(), name: '', description: '', place: '',
        characters: [], contacts: [], monsters: [], challenges: [],
    });
    _expandedScenes.add(si);
    renderScenes();
}

function _removeScene(si) {
    _syncFromDOM();
    _editingScenario.scenes.splice(si, 1);
    const next = new Set();
    _expandedScenes.forEach(idx => { if (idx < si) next.add(idx); else if (idx > si) next.add(idx - 1); });
    _expandedScenes = next;
    renderScenes();
}

function _toggleScene(si) {
    const body = document.getElementById(`dm-scene-body-${si}`);
    if (!body) return;
    const toggle = body.previousElementSibling?.querySelector('.dm-scene-toggle');
    if (_expandedScenes.has(si)) {
        _expandedScenes.delete(si);
        body.classList.remove('open');
        if (toggle) toggle.textContent = '▼';
    } else {
        _expandedScenes.add(si);
        body.classList.add('open');
        if (toggle) toggle.textContent = '▲';
    }
}

function _addChallenge(si) {
    _syncFromDOM();
    _editingScenario.scenes[si].challenges.push({ id: uid(), description: '', rewards: [] });
    renderChallenges(si);
}

function _removeChallenge(si, ci) {
    _syncFromDOM();
    _editingScenario.scenes[si].challenges.splice(ci, 1);
    renderChallenges(si);
}

function _addReward(si, ci) {
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards.push({ type: 'normal', itemId: '' });
    renderRewards(si, ci);
}

function _removeReward(si, ci, ri) {
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards.splice(ri, 1);
    renderRewards(si, ci);
}

function _setRewardType(si, ci, ri, type) {
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards[ri].type   = type;
    _editingScenario.scenes[si].challenges[ci].rewards[ri].itemId = '';
    renderRewards(si, ci);
}

// ── Internal helpers (called from inline HTML) ─────────────────────────────
function _closeForm(formId) {
    document.getElementById(formId)?.classList.remove('active');
}

function _addBonus(bonusId) {
    const ctx = _bonusCtx[bonusId];
    if (!ctx) return;
    ctx.get().push({ target: DATA.statistics[0].abbreviation, value: 1 });
    renderBonuses(bonusId);
}

function _removeBonus(bonusId, idx) {
    const ctx = _bonusCtx[bonusId];
    if (!ctx) return;
    ctx.get().splice(idx, 1);
    renderBonuses(bonusId);
}

function _setBonusField(bonusId, idx, field, value) {
    const b = _bonusCtx[bonusId]?.get()[idx];
    if (b) b[field] = value;
}

function _addAttack() {
    _attacks.push({ name: '', description: '', damage: 1, damageType: 'blunt', reach: '', bonus: [] });
    renderAttacks();
}

function _removeAttack(idx) {
    _attacks.splice(idx, 1);
    renderAttacks();
}

function _setAtkField(atkIdx, field, value) {
    if (_attacks[atkIdx]) _attacks[atkIdx][field] = value;
}

// ── Download / Upload ──────────────────────────────────────────────────────
function download() {
    let characters = [];
    try { characters = JSON.parse(localStorage.getItem(LS.chars) || '[]'); } catch (_) {}

    const bundle = {
        version:   1,
        date:      new Date().toISOString().slice(0, 10),
        contacts:  st.contacts,
        items:     st.items,
        monsters:  st.monsters,
        places:    st.places,
        scenarios: st.scenarios,
        characters,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `moros-campaign-${bundle.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function upload() {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader    = new FileReader();
        reader.onload   = ev => {
            try {
                const bundle  = JSON.parse(ev.target.result);
                const summary = [
                    `${bundle.contacts?.length   || 0} contact(s)`,
                    `${bundle.items?.length      || 0} special item(s)`,
                    `${bundle.monsters?.length   || 0} monster(s)`,
                    `${bundle.places?.length     || 0} place(s)`,
                    `${bundle.scenarios?.length  || 0} scenario(s)`,
                    `${bundle.characters?.length || 0} character(s)`,
                ].join(', ');

                const merge = confirm(
                    `Campaign file contains: ${summary}\n\n` +
                    `Merge into current data? (Cancel to replace everything.)`
                );

                ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
                    if (!bundle[k]) return;
                    if (merge) {
                        const ids = new Set(st[k].map(x => x.id));
                        bundle[k].forEach(x => { if (!ids.has(x.id)) st[k].push(x); });
                    } else {
                        st[k] = bundle[k];
                    }
                    persist(k);
                });

                if (bundle.characters) {
                    if (merge) {
                        let chars = [];
                        try { chars = JSON.parse(localStorage.getItem(LS.chars) || '[]'); } catch (_) {}
                        const names = new Set(chars.map(c => c.name));
                        bundle.characters.forEach(c => { if (!names.has(c.name)) chars.push(c); });
                        localStorage.setItem(LS.chars, JSON.stringify(chars));
                    } else {
                        localStorage.setItem(LS.chars, JSON.stringify(bundle.characters));
                    }
                }

                renderContacts();
                renderItems();
                renderMonsters();
                renderPlaces();
                renderScenarios();
                alert('Campaign data loaded successfully.');
            } catch (err) {
                alert(`Failed to load file: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ── Utility ────────────────────────────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function snippet(str, maxLen) {
    if (!str) return '';
    const s = esc(str);
    return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
    loadAll();
    renderContacts();
    renderItems();
    renderMonsters();
    renderPlaces();
    renderScenarios();
}

window.DM = {
    showTab,
    newContact,  editContact,  deleteContact,  saveContact,
    newItem,     editItem,     deleteItem,     saveItem,
    newMonster,  editMonster,  deleteMonster,  saveMonster,
    newPlace,    editPlace,    deletePlace,    savePlace,
    newScenario, editScenario, deleteScenario, saveScenario,
    download, upload,
    _catChanged, _setCatFilter,
    _closeForm, _addBonus, _removeBonus, _setBonusField,
    _addAttack, _removeAttack, _setAtkField,
    _addFaction, _removeFaction, _setFactionName,
    _addStruggle, _removeStruggle, _setStruggleDesc,
    _addScene, _removeScene, _toggleScene,
    _addChallenge, _removeChallenge,
    _addReward, _removeReward, _setRewardType,
};

init();
