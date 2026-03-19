import { DATA } from './data.js';
import { loadCategories, addCategory, saveCategories } from './categories.js';
import { search, createSnapshot, lastSeen, filterByScenario } from './dm-logic.js';

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

// ── Rules overrides ────────────────────────────────────────────────────────
const LS_RULES = 'moros-dm-rules-overrides';

function loadRulesOverrides() {
    try { return JSON.parse(localStorage.getItem(LS_RULES)) || { creatures: {}, powers: {}, items: {} }; }
    catch (_) { return { creatures: {}, powers: {}, items: {} }; }
}

function saveRulesOverrides(ov) { localStorage.setItem(LS_RULES, JSON.stringify(ov)); }

function saveRuleOverride(type, name, data) {
    const ov = loadRulesOverrides();
    (ov[type] = ov[type] || {})[name] = data;
    saveRulesOverrides(ov);
}

function resetRuleOverride(type, name) {
    const ov = loadRulesOverrides();
    if (ov[type]) delete ov[type][name];
    saveRulesOverrides(ov);
}

function resolveCreatures() {
    const ov = loadRulesOverrides().creatures || {};
    return (DATA.creatures || []).map(c => ov[c.name] ? { ...c, ...ov[c.name] } : c);
}

function resolvePowers() {
    const ov = loadRulesOverrides().powers || {};
    return DATA.powers.map(p => {
        const o = ov[p.name];
        if (!o) return p;
        const merged = { ...p, ...o };
        if (o.scenarioUses && p.scenarios) {
            merged.scenarios = p.scenarios.map(s => ({
                ...s, use: o.scenarioUses[s.name] !== undefined ? o.scenarioUses[s.name] : s.use,
            }));
        }
        return merged;
    });
}

function resolveRuleItems() {
    const ov = loadRulesOverrides().items || {};
    return DATA.items.map(i => ov[i.name] ? { ...i, ...ov[i.name] } : i);
}

// ── State ──────────────────────────────────────────────────────────────────
const st = { contacts: [], items: [], monsters: [], places: [], scenarios: [] };
const _catFilter = { items: '', monsters: '', places: '', scenarios: '' };
const _powerFilter = { stat: '', scenarioType: '', race: '' };
let _dirty = false;
let _sessionMode = false;
const _expandedHistory = new Set();

function _sessionVisible(entry) {
    if (!_sessionMode) return true;
    if (!entry.category) return true; // uncategorised always shown
    const cats = loadCategories();
    const cat = cats.find(c => c.name === entry.category);
    return cat ? cat.sessionVisible : true; // unknown category shown
}

function loadAll() {
    ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
        try {
            const raw = localStorage.getItem(LS[k]);
            if (raw) st[k] = JSON.parse(raw);
        } catch (_) { st[k] = []; }
    });
    _sessionMode = localStorage.getItem('moros-dm-session-mode') === 'true';
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

function statBonusOptionsList() {
    const stats = DATA.statistics.map(s => ({ value: s.abbreviation, label: `${s.name} (${s.abbreviation})` }));
    const actions = DATA.statistics.map(s => ({ value: s.action, label: s.action }));
    return stats.concat(actions);
}

// Bonus context registry: bonusId -> { get, set }
const _bonusCtx = {};

function renderBonuses(bonusId) {
    const el = document.getElementById(bonusId);
    if (!el) return;
    const bonuses = _bonusCtx[bonusId]?.get() || [];
    el.innerHTML = bonuses.map((b, i) => `
        <div class="dm-bonus-row">
            ${buildCustomSelect('', statBonusOptionsList(), b.target || '', `DM._setBonusField('${bonusId}',${i},'target',this.value)`)}
            <input type="number" class="dm-input dm-bonus-value" value="${b.value}"
                   min="-10" max="10"
                   onchange="DM._setBonusField('${bonusId}',${i},'value',+this.value)"
                   onclick="DM._numPickerOpen(this,-10,10)">
            <button type="button" class="dm-btn-icon dm-btn-delete"
                    onclick="DM._removeBonus('${bonusId}',${i})">✕</button>
        </div>`).join('');
}

// ── Dirty flag helpers ─────────────────────────────────────────────────────
function _setDirty() { _dirty = true; }
function _clearDirty() { _dirty = false; }

// ── Editing scratch state ──────────────────────────────────────────────────
let _itemBonuses = [];
let _attacks = [];
let _factions = [];
let _struggles = [];

function _regItemBonuses() {
    _bonusCtx['item-bonuses'] = { get: () => _itemBonuses, set: a => { _itemBonuses = a; } };
}


// ── Category helpers ────────────────────────────────────────────────────────
function buildCatSelect(selected) {
    const cats = loadCategories();
    const options = [{ value: '', label: '— none —' }]
        .concat(cats.map(c => ({ value: c.name, label: c.name })))
        .concat([{ value: '__add__', label: 'Add category…' }]);
    return buildCustomSelect('category', options, selected || '', 'DM._catChanged(this)');
}


function _catChanged(sel) {
    if (sel.value !== '__add__') return;
    sel.value = '';
    const wrap = sel.closest('.dm-form-group');
    if (!wrap || wrap.querySelector('.dm-cat-add-row')) return;
    const row = document.createElement('div');
    row.className = 'dm-cat-add-row';
    row.innerHTML = `
        <input class="dm-input dm-cat-add-input" type="text" placeholder="Category name…" autocomplete="off">
        <button type="button" class="dm-btn-sm" onclick="DM._catAddConfirm(this)">Add</button>
        <button type="button" class="dm-btn-sm" onclick="DM._catAddCancel(this)">Cancel</button>`;
    wrap.appendChild(row);
    row.querySelector('.dm-cat-add-input').focus();
}

function _catAddConfirm(btn) {
    const row = btn.closest('.dm-cat-add-row');
    const input = row.querySelector('.dm-cat-add-input');
    const entry = addCategory(input.value.trim());
    if (entry) {
        document.querySelectorAll('.dm-form-pane select[name=category]').forEach(sel => {
            const opt = document.createElement('option');
            opt.value = entry.name; opt.textContent = entry.name;
            sel.insertBefore(opt, sel.querySelector('[value="__add__"]'));
            sel.value = entry.name;
            _csRefreshBtn(sel);
        });
        _setDirty();
    }
    row.remove();
}

function _catAddCancel(btn) {
    btn.closest('.dm-cat-add-row').remove();
}

function _setCatFilter(type, val) {
    _catFilter[type] = val;
    if (type === 'items') renderItems();
    else if (type === 'monsters') renderMonsters();
    else if (type === 'places') renderPlaces();
    else if (type === 'scenarios') renderScenarios();
}

// ── Origin helpers ─────────────────────────────────────────────────────────

/**
 * @param {'player'|'scenario'|'campaign'|'rules'} origin
 * @param {string} [label]
 */
function originBadge(origin, label = '') {
    if (origin === 'rules')    return `<span class="dm-origin-badge dm-origin-rules">RULES</span>`;
    if (origin === 'modified') return `<span class="dm-origin-badge dm-origin-modified">MODIFIED</span>`;
    if (origin === 'player')   return `<span class="dm-origin-badge dm-origin-player">PLAYER${label ? ' · ' + esc(label) : ''}</span>`;
    if (origin === 'scenario') return `<span class="dm-origin-badge dm-origin-scenario">SCENARIO</span>`;
    return `<span class="dm-origin-badge dm-origin-campaign">CAMPAIGN</span>`;
}

function _monsterOriginChanged(sel, field) {
    const form = document.getElementById('monster-form');
    if (!form) return;
    if (sel.value) {
        // Clear the other field
        const other = field === 'scenarioId' ? 'owner' : 'scenarioId';
        const otherEl = form.querySelector(`[name=${other}]`);
        if (otherEl) otherEl.value = '';
    }
}

function _itemOriginChanged(sel, field) {
    const form = document.getElementById('item-form');
    if (!form) return;
    if (sel.value) {
        const other = field === 'scenarioId' ? 'owner' : 'scenarioId';
        const otherEl = form.querySelector(`[name=${other}]`);
        if (otherEl) otherEl.value = '';
    }
}

// ═════════════════════════════ CONTACTS ═══════════════════════════════════

function buildContactForm(contact = null) {
    const bgNames   = DATA.backgrounds.map(b => b.name);
    const chk = arr => new Set(arr || []);

    return `
    <div class="dm-form-title">${contact ? 'Edit Contact' : 'New Contact'}</div>
    <div class="dm-form-actions dm-form-actions--top">
        <button type="submit" class="btn-primary">Save Contact</button>
        <button type="button" class="btn-secondary" onclick="DM._closeForm('contact-form')">Cancel</button>
    </div>
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
                ${buildCustomSelect('town', [{value:'',label:'— none —'}].concat(DATA.places.map(p=>({value:p.name,label:p.name}))), contact?.town||'', '')}
            </div>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Race</label>
                ${buildCustomSelect('race', [{value:'',label:'— any —'}].concat(DATA.races.map(r=>({value:r.name,label:r.name}))), contact?.race||'', '')}
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
            ${buildEntityPicker('items', DATA.items.map(i => ({ value: i.name, label: i.name })), chk(contact?.items))}
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
                        onclick="DM.editContact('${c.id}')">Edit</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM._requestDelete('contact','${c.id}',this)">✕</button>
            </div>
        </div>`).join('');
}

function newContact() {
    const form = document.getElementById('contact-form');
    form.dataset.id = '';
    form.innerHTML = buildContactForm();
    _openEditor(form.id);
}

function editContact(id) {
    const contact = st.contacts.find(c => c.id === id);
    if (!contact) return;
    const form = document.getElementById('contact-form');
    form.dataset.id = id;
    form.innerHTML = buildContactForm(contact);
    _openEditor(form.id);
    form.querySelector('[name=town]').value = contact.town || '';
    _csRefreshBtn(form.querySelector('[name=town]'));
    form.querySelector('[name=race]').value = contact.race || '';
    _csRefreshBtn(form.querySelector('[name=race]'));
}

function deleteContact(id) {
    st.contacts = st.contacts.filter(c => c.id !== id);
    persist('contacts');
    renderContacts();
}

function saveContact(e) {
    e.preventDefault();
    _clearDirty();
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
    _closeForm(form.id);
}

// ═════════════════════════════ SPECIAL ITEMS ══════════════════════════════

function buildItemForm(item = null) {
    _itemBonuses = item?.bonuses ? item.bonuses.map(b => ({ ...b })) : [];
    const chars = getCharacters();

    return `
    <div class="dm-form-title">${item ? 'Edit Special Item' : 'New Special Item'}</div>
    <div class="dm-form-actions dm-form-actions--top">
        <button type="submit" class="btn-primary">Save Item</button>
        <button type="button" class="btn-secondary" onclick="DM._closeForm('item-form')">Cancel</button>
    </div>
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
                ${buildCustomSelect('type', [{value:'',label:'— none —'}].concat(DATA.items.map(i=>({value:i.name,label:i.name}))), item?.type||'', '')}
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
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Assign to Scenario <span class="dm-label-hint">(sets Scenario origin)</span></label>
                ${buildCustomSelect('scenarioId', [{value:'',label:'— none —'}].concat(st.scenarios.map(s=>({value:s.id,label:s.name}))), item?.scenarioId||'', "DM._itemOriginChanged(this,'scenarioId')")}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Owned by Player <span class="dm-label-hint">(sets Player origin)</span></label>
                ${buildCustomSelect('owner', [{value:'',label:'— none —'}].concat(chars.map(c=>({value:c.name,label:c.name}))), item?.owner||'', "DM._itemOriginChanged(this,'owner')")}
            </div>
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
    const sessionFiltered = st.items.filter(_sessionVisible);
    const filtered = _catFilter.items
        ? sessionFiltered.filter(x => (x.category || '') === _catFilter.items)
        : sessionFiltered;
    let html = '';
    if (!st.items.length) {
        html += '<div class="dm-empty">No special items yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No items match this filter.</div>';
    } else {
        const itemLogs = _allHistoryLogs();
        html += filtered.map(item => {
            const origin = item.owner ? 'player' : (item.scenarioId ? 'scenario' : 'campaign');
            const seen = lastSeen(item.name, itemLogs);
            return `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(item.name)}
                    ${item.type ? `<span class="dm-entry-type">(${esc(item.type)})</span>` : ''}
                    ${item.category ? `<span class="dm-cat-badge">${esc(item.category)}</span>` : ''}
                    ${originBadge(origin, item.owner)}
                </div>
                ${item.bonuses?.length ? `
                <div class="dm-entry-tags">
                    ${item.bonuses.map(b =>
                        `<span class="dm-tag">${esc(b.target)} ${b.value >= 0 ? '+' : ''}${b.value}</span>`
                    ).join('')}
                </div>` : ''}
                <div class="dm-entry-desc">${snippet(item.description, 120)}</div>
                ${seen ? `<div class="dm-last-seen">Last seen: ${esc(seen)}</div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editItem('${item.id}')">Edit</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM._requestDelete('item','${item.id}',this)">✕</button>
            </div>
        </div>`;
        }).join('');
    }
    list.innerHTML = html;
}

function newItem() {
    const form = document.getElementById('item-form');
    form.dataset.id = '';
    form.innerHTML = buildItemForm();
    _openEditor(form.id);
    _regItemBonuses();
    renderBonuses('item-bonuses');
}

function editItem(id) {
    const item = st.items.find(x => x.id === id);
    if (!item) return;
    const form = document.getElementById('item-form');
    form.dataset.id = id;
    form.innerHTML = buildItemForm(item);
    _openEditor(form.id);
    _regItemBonuses();
    renderBonuses('item-bonuses');
    form.querySelector('[name=type]').value = item.type || '';
    _csRefreshBtn(form.querySelector('[name=type]'));
}

function deleteItem(id) {
    st.items = st.items.filter(x => x.id !== id);
    persist('items');
    renderItems();
}

function saveItem(e) {
    e.preventDefault();
    _clearDirty();
    const form = document.getElementById('item-form');
    const id = form.dataset.id || uid();
    const catEl = form.querySelector('[name=category]');
    const iScenarioId = form.querySelector('[name=scenarioId]')?.value || '';
    const iOwner      = form.querySelector('[name=owner]')?.value.trim() || '';
    const item = {
        id,
        name:        form.querySelector('[name=name]').value.trim(),
        type:        form.querySelector('[name=type]').value,
        category:    (catEl && catEl.value !== '__add__') ? catEl.value : '',
        description: form.querySelector('[name=description]').value.trim(),
        bonuses:     _itemBonuses.map(b => ({ ...b })),
        scenarioId:  iOwner ? '' : iScenarioId,
        owner:       iOwner,
    };
    if (!item.name) return;
    const idx = st.items.findIndex(x => x.id === id);
    if (idx === -1) st.items.push(item);
    else st.items[idx] = item;
    persist('items');
    renderItems();
    _closeForm(form.id);
}

// ═════════════════════════════ MONSTERS ═══════════════════════════════════

function buildStatInputsHTML(stats = {}) {
    return `<div class="dm-stat-grid">${
        DATA.statistics.map(s => `
        <div class="dm-stat-cell">
            <label class="dm-stat-label">${s.abbreviation}</label>
            <div class="dm-stat-stepper">
                <button type="button" class="dm-stat-step" onclick="DM._statStep('${s.abbreviation}',-1)">−</button>
                <input class="dm-input dm-stat-input" type="number"
                       name="stat-${s.abbreviation}"
                       value="${stats[s.abbreviation] || 1}" min="1" max="20"
                       onclick="DM._statPickerOpen('${s.abbreviation}', this)">
                <button type="button" class="dm-stat-step" onclick="DM._statStep('${s.abbreviation}',1)">+</button>
            </div>
        </div>`).join('')
    }</div>`;
}

function buildAttackBlock(i, atk = {}) {
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
                <input class="dm-input dm-attack-damage" type="number" value="${atk.damage ?? 1}"
                       min="0" max="99"
                       oninput="DM._setAtkField(${i},'damage',+this.value)"
                       onclick="DM._numPickerOpen(this,0,20)">
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Damage Type</label>
                ${buildCustomSelect('', DAMAGE_TYPES.map(t => ({value: t, label: t})), atk.damageType || DAMAGE_TYPES[0], `DM._setAtkField(${i},'damageType',this.value)`)}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Reach</label>
                ${buildCustomSelect('', ['close','reach','ranged','area'], atk.reach || 'close', `DM._setAtkField(${i},'reach',this.value)`)}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Stat Reduced</label>
                ${buildCustomSelect('', [{value:'',label:'— none —'}].concat(DATA.statistics.map(s=>({value:s.abbreviation,label:s.abbreviation}))), atk.statReduced||'', `DM._setAtkField(${i},'statReduced',this.value)`)}
            </div>
        </div>
    </div>`;
}

function buildMonsterForm(monster = null) {
    _attacks = monster?.attacks
        ? monster.attacks.map(a => ({ ...a }))
        : [];

    const chars = getCharacters();

    return `
    <div class="dm-form-title">${monster ? 'Edit Monster' : 'New Monster'}</div>
    <div class="dm-form-actions dm-form-actions--top">
        <button type="submit" class="btn-primary">Save Monster</button>
        <button type="button" class="btn-secondary" onclick="DM._closeForm('monster-form')">Cancel</button>
    </div>
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
            <textarea class="dm-input" name="description" rows="3">${esc(monster?.description)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Motivation</label>
            <textarea class="dm-input" name="motivation" rows="2"
                      placeholder="Why does this creature attack, flee, or ignore the group?">${esc(monster?.motivation)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Statistics</label>
            ${buildStatInputsHTML(monster?.stats)}
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Behaviour</label>
            <textarea class="dm-input" name="behaviour" rows="2"
                      placeholder="Tactical patterns, retreat conditions, special notes.">${esc(monster?.behaviour)}</textarea>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Druid Bond <span class="dm-label-hint">(optional — animals only)</span></label>
            <textarea class="dm-input" name="druidBond" rows="2"
                      placeholder="What a character with the Druid power can ask of this creature.">${esc(monster?.druidBond)}</textarea>
        </div>
        <div class="dm-form-row">
            <div class="dm-form-group">
                <label class="dm-label">Assign to Scenario <span class="dm-label-hint">(sets Scenario origin)</span></label>
                ${buildCustomSelect('scenarioId', [{value:'',label:'— none —'}].concat(st.scenarios.map(s=>({value:s.id,label:s.name}))), monster?.scenarioId||'', "DM._monsterOriginChanged(this,'scenarioId')")}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Owned by Player <span class="dm-label-hint">(sets Player origin)</span></label>
                ${buildCustomSelect('owner', [{value:'',label:'— none —'}].concat(chars.map(c=>({value:c.name,label:c.name}))), monster?.owner||'', "DM._monsterOriginChanged(this,'owner')")}
            </div>
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
}

function renderMonsters() {
    const list = document.getElementById('monsters-list');
    const sessionFiltered = st.monsters.filter(_sessionVisible);
    const filtered = _catFilter.monsters
        ? sessionFiltered.filter(x => (x.category || '') === _catFilter.monsters)
        : sessionFiltered;
    let html = '';
    if (!st.monsters.length) {
        html += '<div class="dm-empty">No monsters yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No monsters match this filter.</div>';
    } else {
        const logs = _allHistoryLogs();
        html += filtered.map(m => {
            const origin = m.owner ? 'player' : (m.scenarioId ? 'scenario' : 'campaign');
            const seen = lastSeen(m.name, logs);
            return `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(m.name)}
                    ${m.category ? `<span class="dm-cat-badge">${esc(m.category)}</span>` : ''}
                    ${originBadge(origin, m.owner)}
                </div>
                <div class="dm-entry-tags dm-stat-tags">
                    ${DATA.statistics.map(s =>
                        `<span class="dm-tag dm-stat-tag">${s.abbreviation}&nbsp;${m.stats?.[s.abbreviation] ?? 1}</span>`
                    ).join('')}
                </div>
                ${m.attacks?.length ? `
                <div class="dm-entry-sub" style="margin-top:0.35rem">
                    ${m.attacks.map(a => `${esc(a.name)}${a.damageType ? ` (${esc(a.damageType)}${a.statReduced ? ' · ' + esc(a.statReduced) : ''})` : ''}`).filter(Boolean).join(', ')}
                </div>` : ''}
                ${m.motivation ? `<div class="dm-entry-desc">${snippet(m.motivation, 100)}</div>` : ''}
                ${seen ? `<div class="dm-last-seen">Last seen: ${esc(seen)}</div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Copy"
                        onclick="DM._duplicateMonster('${m.id}')">Copy</button>
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editMonster('${m.id}')">Edit</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM._requestDelete('monster','${m.id}',this)">✕</button>
            </div>
        </div>`;
        }).join('');
    }

    // ── Bestiary creatures ──────────────────────────────────────────────────
    const creaturesOv = loadRulesOverrides().creatures || {};
    const creatures = resolveCreatures().filter(c =>
        !_catFilter.monsters || c.category === _catFilter.monsters
    );
    if (creatures.length) {
        html += `<div class="dm-section-divider">Bestiary</div>`;
        html += creatures.map(c => {
            const modified = !!creaturesOv[c.name];
            const statRow = DATA.statistics.map(s =>
                `<span class="dm-tag dm-stat-tag">${s.abbreviation}&nbsp;${c.stats?.[s.abbreviation] ?? 1}</span>`
            ).join('');
            const atkRow = (c.attacks || []).map(a =>
                `${esc(a.name)}${a.type ? ` (${esc(a.type)}${a.statReduced ? ' · ' + esc(a.statReduced) : ''})` : ''}`
            ).filter(Boolean).join(', ');
            return `
        <div class="dm-entry dm-entry-rules">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(c.name)}
                    ${c.category ? `<span class="dm-cat-badge">${esc(c.category)}</span>` : ''}
                    ${modified ? originBadge('modified') : originBadge('rules')}
                </div>
                <div class="dm-entry-tags dm-stat-tags">${statRow}</div>
                ${atkRow ? `<div class="dm-entry-sub" style="margin-top:0.35rem">${atkRow}</div>` : ''}
                ${c.motivation ? `<div class="dm-entry-desc">${snippet(c.motivation, 100)}</div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-icon" title="Edit creature"
                        onclick="DM._editRulesEntry('creatures','${esc(c.name)}',this)">Edit</button>
                <button class="dm-btn-icon" title="Copy to Monsters"
                        onclick="DM._copyToMonsters('${esc(c.name)}')">Copy</button>
            </div>
        </div>`;
        }).join('');
    }

    list.innerHTML = html;
}

function newMonster() {
    const form = document.getElementById('monster-form');
    form.dataset.id = '';
    form.innerHTML = buildMonsterForm();
    _openEditor(form.id);
    renderAttacks();
}

function editMonster(id) {
    const monster = st.monsters.find(m => m.id === id);
    if (!monster) return;
    const form = document.getElementById('monster-form');
    form.dataset.id = id;
    form.innerHTML = buildMonsterForm(monster);
    _openEditor(form.id);
    renderAttacks();
}

function deleteMonster(id) {
    st.monsters = st.monsters.filter(m => m.id !== id);
    persist('monsters');
    renderMonsters();
}

function saveMonster(e) {
    e.preventDefault();
    const form = document.getElementById('monster-form');
    if (form.dataset.rulesCreature) return; // rules edit — handled by _saveRulesEntry
    _clearDirty();
    const id = form.dataset.id || uid();
    const stats = {};
    DATA.statistics.forEach(s => {
        const el = form.querySelector(`[name=stat-${s.abbreviation}]`);
        stats[s.abbreviation] = Math.max(1, parseInt(el?.value || 1, 10) || 1);
    });
    const mCatEl = form.querySelector('[name=category]');
    const scenarioId = form.querySelector('[name=scenarioId]')?.value || '';
    const owner      = form.querySelector('[name=owner]')?.value.trim() || '';
    const monster = {
        id,
        name:        form.querySelector('[name=name]').value.trim(),
        category:    (mCatEl && mCatEl.value !== '__add__') ? mCatEl.value : '',
        description: form.querySelector('[name=description]').value.trim(),
        motivation:  form.querySelector('[name=motivation]').value.trim(),
        behaviour:   form.querySelector('[name=behaviour]').value.trim(),
        druidBond:   form.querySelector('[name=druidBond]').value.trim(),
        scenarioId:  owner ? '' : scenarioId,
        owner:       owner,
        stats,
        attacks:     _attacks.map(a => ({ ...a })),
    };
    if (!monster.name) return;
    const idx = st.monsters.findIndex(m => m.id === id);
    if (idx === -1) st.monsters.push(monster);
    else st.monsters[idx] = monster;
    persist('monsters');
    renderMonsters();
    _closeForm(form.id);
}

// ═════════════════════════════ PLACES ═════════════════════════════════════

const PLACE_TYPES = ['town', 'city', 'ruins', 'castle', 'monastery'];

function buildFactionBlock(fi, faction) {
    const contactOpts = st.contacts.map(c => ({
        value: c.id,
        label: c.name + (c.faction ? ` · ${c.faction}` : ''),
    }));
    const chkContacts    = new Set(faction.contacts || []);
    const contactPlaceMap = Object.fromEntries(st.contacts.map(c => [c.id, c.town || '']));
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
            ${buildEntityPicker(`faction-${fi}-contacts`, contactOpts, chkContacts, contactPlaceMap)}
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
    const monsterOpts  = st.monsters.map(m => ({ value: m.id, label: m.name }));
    const stdItemNames = DATA.items.map(i => i.name);
    const specItemOpts = st.items.map(i => ({ value: i.id, label: i.name }));
    const chkMonsters  = new Set(place?.monsters     || []);
    const chkItems     = new Set(place?.items        || []);
    const chkSpecItems = new Set(place?.specialItems || []);
    const monsterPlaceMap = {};
    st.places.forEach(p => { if (p.id !== place?.id) (p.monsters || []).forEach(mid => { monsterPlaceMap[mid] = p.name; }); });
    return `
    <div class="dm-form-title">${place ? 'Edit Place' : 'New Place'}</div>
    <div class="dm-form-actions dm-form-actions--top">
        <button type="submit" class="btn-primary">Save Place</button>
        <button type="button" class="btn-secondary" onclick="DM._closeForm('place-form')">Cancel</button>
    </div>
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
                ${buildCustomSelect('place-type', PLACE_TYPES.map(t => ({value: t, label: t.charAt(0).toUpperCase() + t.slice(1)})), place?.type || PLACE_TYPES[0], '')}
            </div>
        </div>
        <div class="dm-form-group">
            <label class="dm-label">Description</label>
            <textarea class="dm-input" name="place-desc" rows="4">${esc(place?.description)}</textarea>
        </div>
        ${monsterOpts.length ? `
        <div class="dm-form-group">
            <label class="dm-label">Monsters present</label>
            ${buildEntityPicker('place-monsters', monsterOpts, chkMonsters, monsterPlaceMap)}
        </div>` : ''}
        <div class="dm-form-group">
            <label class="dm-label">Items available</label>
            ${buildCheckboxGrid('place-items', stdItemNames, chkItems)}
            ${specItemOpts.length ? `
            <div style="margin-top:0.5rem">
                <div class="dm-label" style="margin-bottom:0.25rem;opacity:0.75">Special Items</div>
                ${buildEntityPicker('place-special-items', specItemOpts, chkSpecItems)}
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
    const sessionFiltered = st.places.filter(_sessionVisible);
    const filtered = _catFilter.places
        ? sessionFiltered.filter(x => (x.category || '') === _catFilter.places)
        : sessionFiltered;
    let html = '';
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
                        onclick="DM.editPlace('${p.id}')">Edit</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM._requestDelete('place','${p.id}',this)">✕</button>
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
    _openEditor(form.id);
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
    _openEditor(form.id);
    renderFactions();
    renderStruggles();
}

function deletePlace(id) {
    st.places = st.places.filter(p => p.id !== id);
    persist('places');
    renderPlaces();
}

function savePlace(e) {
    e.preventDefault();
    _clearDirty();
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
    _closeForm(form.id);
}

// ── Place mutation helpers ─────────────────────────────────────────────────
function _addFaction() {
    _setDirty();
    _factions.push({ name: '', contacts: [] });
    renderFactions();
}

function _removeFaction(fi) {
    _setDirty();
    _factions.splice(fi, 1);
    renderFactions();
}

function _setFactionName(fi, value) {
    _setDirty();
    if (_factions[fi]) _factions[fi].name = value;
}

function _addStruggle() {
    _setDirty();
    _struggles.push({ description: '' });
    renderStruggles();
}

function _removeStruggle(stri) {
    _setDirty();
    _struggles.splice(stri, 1);
    renderStruggles();
}

function _setStruggleDesc(stri, value) {
    _setDirty();
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

// ── Entity picker (replaces checkbox grids for large, growing lists) ────────
// placeMap: { value → placeName string } — used for the place filter dropdown.
function buildEntityPicker(name, options, checkedSet, placeMap = {}) {
    const places = [...new Set(Object.values(placeMap).filter(Boolean))].sort();

    const selectedOpts   = options.filter(o => checkedSet.has(o.value));
    const unselectedOpts = options.filter(o => !checkedSet.has(o.value));

    const placeFilterHtml = places.length > 0
        ? buildCustomSelect('', [{value:'',label:'All places'}].concat(places.map(p=>({value:p,label:p}))), '', 'DM._pickerFilter(this.closest(\'.dm-picker\'))', 'dm-picker-place')
        : '';

    const tokensHtml = selectedOpts.length > 0
        ? selectedOpts.map(o => `
            <span class="dm-picker-token" data-place="${esc(placeMap[o.value] || '')}">
                <input type="checkbox" name="${esc(name)}" value="${esc(o.value)}" checked hidden>
                <span class="dm-picker-token-label">${esc(o.label)}</span>
                <button type="button" class="dm-picker-token-remove"
                        onclick="DM._pickerRemove(this)"
                        data-value="${esc(o.value)}"
                        data-label="${esc(o.label)}"
                        data-place="${esc(placeMap[o.value] || '')}">×</button>
            </span>`).join('')
        : '<span class="dm-picker-empty">None selected</span>';

    const listHtml = unselectedOpts.length > 0
        ? unselectedOpts.map(o => `
            <div class="dm-picker-option"
                 data-value="${esc(o.value)}"
                 data-label="${esc(o.label)}"
                 data-place="${esc(placeMap[o.value] || '')}"
                 onclick="DM._pickerAdd(this)">
                <span class="dm-picker-option-name">${esc(o.label)}</span>
                ${placeMap[o.value] ? `<span class="dm-picker-option-place">${esc(placeMap[o.value])}</span>` : ''}
            </div>`).join('')
        : '<div class="dm-picker-list-empty">All options selected.</div>';

    return `<div class="dm-picker" data-name="${esc(name)}">
        <div class="dm-picker-tokens">${tokensHtml}</div>
        <div class="dm-picker-controls">
            <input type="text" class="dm-input dm-picker-search" placeholder="Search by name…"
                   oninput="DM._pickerFilter(this.closest('.dm-picker'))">
            ${placeFilterHtml}
        </div>
        <div class="dm-picker-list">${listHtml}</div>
    </div>`;
}

function _pickerFilter(picker) {
    const search = (picker.querySelector('.dm-picker-search')?.value || '').toLowerCase();
    const place  = picker.querySelector('.dm-picker-place')?.value || '';
    picker.querySelectorAll('.dm-picker-option').forEach(opt => {
        const nameOk  = !search || opt.dataset.label.toLowerCase().includes(search);
        const placeOk = !place  || opt.dataset.place === place;
        opt.style.display = nameOk && placeOk ? '' : 'none';
    });
}

function _pickerAdd(optEl) {
    const picker  = optEl.closest('.dm-picker');
    const name    = picker.dataset.name;
    const value   = optEl.dataset.value;
    const label   = optEl.dataset.label;
    const place   = optEl.dataset.place || '';

    optEl.remove();

    const tokensEl = picker.querySelector('.dm-picker-tokens');
    tokensEl.querySelector('.dm-picker-empty')?.remove();

    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.name = name; cb.value = value; cb.checked = true; cb.hidden = true;

    const lbl = document.createElement('span');
    lbl.className = 'dm-picker-token-label';
    lbl.textContent = label;

    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dm-picker-token-remove'; btn.textContent = '×';
    btn.dataset.value = value; btn.dataset.label = label; btn.dataset.place = place;
    btn.onclick = function() { DM._pickerRemove(this); };

    const token = document.createElement('span');
    token.className = 'dm-picker-token'; token.dataset.place = place;
    token.append(cb, lbl, btn);
    tokensEl.appendChild(token);

    picker.querySelector('.dm-picker-list-empty')?.remove();
    _pickerFilter(picker);
}

function _pickerRemove(btn) {
    const picker  = btn.closest('.dm-picker');
    const value   = btn.dataset.value;
    const label   = btn.dataset.label;
    const place   = btn.dataset.place || '';

    btn.closest('.dm-picker-token').remove();

    const tokensEl = picker.querySelector('.dm-picker-tokens');
    if (!tokensEl.querySelector('.dm-picker-token')) {
        const hint = document.createElement('span');
        hint.className = 'dm-picker-empty'; hint.textContent = 'None selected';
        tokensEl.appendChild(hint);
    }

    const listEl = picker.querySelector('.dm-picker-list');
    listEl.querySelector('.dm-picker-list-empty')?.remove();

    const nameSp = document.createElement('span');
    nameSp.className = 'dm-picker-option-name'; nameSp.textContent = label;

    const opt = document.createElement('div');
    opt.className = 'dm-picker-option';
    opt.dataset.value = value; opt.dataset.label = label; opt.dataset.place = place;
    opt.onclick = function() { DM._pickerAdd(this); };
    opt.appendChild(nameSp);
    if (place) {
        const placeSp = document.createElement('span');
        placeSp.className = 'dm-picker-option-place'; placeSp.textContent = place;
        opt.appendChild(placeSp);
    }

    const existing = [...listEl.querySelectorAll('.dm-picker-option')];
    const before = existing.find(o => o.dataset.label.localeCompare(label) > 0);
    if (before) listEl.insertBefore(opt, before); else listEl.appendChild(opt);

    _pickerFilter(picker);
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
    const normalItemList = DATA.items.map(i => ({value: i.name, label: i.name}));
    const specialItemList = st.items.length
        ? st.items.map(i => ({value: i.id, label: i.name}))
        : [{value: '', label: '— no special items defined —'}];
    const typeList = [{value:'normal',label:'Normal Item'},{value:'special',label:'Special Item'}];
    const selectedType = reward.type === 'special' ? 'special' : 'normal';
    const itemList = selectedType === 'special' ? specialItemList : normalItemList;
    const selectedItem = reward.itemId || '';
    return `
    <div class="dm-reward-row" data-ri="${ri}">
        ${buildCustomSelect('', typeList, selectedType, `DM._setRewardType(${si},${ci},${ri},this.value)`, 'dm-reward-type')}
        ${buildCustomSelect('', itemList, selectedItem, '', 'dm-reward-item')}
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
    const chars       = getCharacters();
    const charOpts    = chars.map(c => ({ value: c.name, label: c.name }));
    const contactOpts = st.contacts.map(c => ({ value: c.id, label: c.name + (c.town ? ` · ${c.town}` : '') }));
    const monsterOpts = st.monsters.map(m => ({ value: m.id, label: m.name }));
    const chkChars    = new Set(scene.characters || []);
    const chkContacts = new Set(scene.contacts   || []);
    const chkMonsters = new Set(scene.monsters   || []);
    const charPlaceMap    = Object.fromEntries(chars.map(c => [c.name, c.place || '']));
    const contactPlaceMap = Object.fromEntries(st.contacts.map(c => [c.id, c.town || '']));
    const monsterPlaceMap = {};
    st.places.forEach(p => (p.monsters || []).forEach(mid => { monsterPlaceMap[mid] = p.name; }));
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
                        ${buildCustomSelect('scene-place', [{value:'',label:'— no specific place —'}].concat(st.places.map(p=>({value:p.id,label:p.name+(p.type?` (${p.type})`:'')}))) , scene.place||'', '')}
                    </div>
                </div>
                <div class="dm-form-row">
                    ${charOpts.length ? `
                    <div class="dm-form-group">
                        <label class="dm-label">Linked Characters</label>
                        ${buildEntityPicker(`scene-${i}-chars`, charOpts, chkChars, charPlaceMap)}
                    </div>` : ''}
                    ${contactOpts.length ? `
                    <div class="dm-form-group">
                        <label class="dm-label">Linked Contacts</label>
                        ${buildEntityPicker(`scene-${i}-contacts`, contactOpts, chkContacts, contactPlaceMap)}
                    </div>` : ''}
                </div>
                ${monsterOpts.length ? `
                <div class="dm-form-group">
                    <label class="dm-label">Linked Monsters</label>
                    ${buildEntityPicker(`scene-${i}-monsters`, monsterOpts, chkMonsters, monsterPlaceMap)}
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
    const chars       = getCharacters();
    const charOpts    = chars.map(c => ({ value: c.name, label: c.name }));
    const contactOpts = st.contacts.map(c => ({ value: c.id, label: c.name + (c.town ? ` · ${c.town}` : '') }));
    const chkChars    = new Set(scenario?.characters || []);
    const chkContacts = new Set(scenario?.contacts   || []);
    const charPlaceMap    = Object.fromEntries(chars.map(c => [c.name, c.place || '']));
    const contactPlaceMap = Object.fromEntries(st.contacts.map(c => [c.id, c.town || '']));
    return `
    <div class="dm-form-title">${scenario ? 'Edit Scenario' : 'New Scenario'}</div>
    <div class="dm-form-actions dm-form-actions--top">
        <button type="submit" class="btn-primary">Save Scenario</button>
        <button type="button" class="btn-secondary" onclick="DM._closeForm('scenario-form')">Cancel</button>
    </div>
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
                    ? buildEntityPicker('sc-characters', charOpts, chkChars, charPlaceMap)
                    : '<div class="dm-empty" style="padding:0.5rem 0;font-size:0.8rem">No characters in roster yet</div>'}
            </div>
            <div class="dm-form-group">
                <label class="dm-label">Linked Contacts</label>
                ${contactOpts.length
                    ? buildEntityPicker('sc-contacts', contactOpts, chkContacts, contactPlaceMap)
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

// ── Scenario history helpers ───────────────────────────────────────────────

function _toggleHistory(id) {
    if (_expandedHistory.has(id)) _expandedHistory.delete(id);
    else _expandedHistory.add(id);
    renderScenarios();
}

function _allHistoryLogs() {
    return st.scenarios.flatMap(s => s.history || []);
}

function _markPlayed(id) {
    const scenario = st.scenarios.find(s => s.id === id);
    if (!scenario) return;
    const assignments = {
        monsters: st.monsters.filter(m => m.scenarioId === id),
        items:    st.items.filter(i => i.scenarioId === id),
        contacts: (scenario.contacts || []).map(cid => st.contacts.find(c => c.id === cid)).filter(Boolean),
    };
    const snap = createSnapshot(scenario, assignments, new Date());
    if (!scenario.history) scenario.history = [];
    scenario.history.push(snap);
    persist('scenarios');
    renderScenarios();
    _refreshSearchScenarios();
}

// ── Scenario CRUD ──────────────────────────────────────────────────────────
function renderScenarios() {
    const list = document.getElementById('scenarios-list');
    if (!list) return;
    const sessionFiltered = st.scenarios.filter(_sessionVisible);
    const filtered = _catFilter.scenarios
        ? sessionFiltered.filter(x => (x.category || '') === _catFilter.scenarios)
        : sessionFiltered;
    let html = '';
    if (!st.scenarios.length) {
        html += '<div class="dm-empty">No scenarios yet. Create the first one.</div>';
    } else if (!filtered.length) {
        html += '<div class="dm-empty">No scenarios match this filter.</div>';
    } else {
        html += filtered.map(s => {
            const history = s.history || [];
            const latestSnap = history.length ? history[history.length - 1] : null;
            const historySection = history.length ? `
                <div class="dm-scenario-history">
                    ${[...(_expandedHistory.has(s.id) ? history.slice().reverse() : [history[history.length - 1]])].map(snap => {
                        const monsters  = snap.entries.filter(e => e.type === 'monster').map(e => esc(e.name)).join(', ');
                        const items     = snap.entries.filter(e => e.type === 'item').map(e => esc(e.name)).join(', ');
                        const contacts  = snap.entries.filter(e => e.type === 'contact').map(e => esc(e.name)).join(', ');
                        return `<div class="dm-history-snap">
                            <span class="dm-power-label">Played</span>${esc(snap.date)}
                            ${monsters ? `<div class="dm-history-row"><span class="dm-power-label">Monsters</span>${monsters}</div>` : ''}
                            ${items    ? `<div class="dm-history-row"><span class="dm-power-label">Items</span>${items}</div>`    : ''}
                            ${contacts ? `<div class="dm-history-row"><span class="dm-power-label">Contacts</span>${contacts}</div>` : ''}
                        </div>`;
                    }).join('')}
                    ${history.length > 1 ? `
                    <button type="button" class="dm-btn-sm dm-history-toggle"
                            onclick="DM._toggleHistory('${s.id}')">
                        ${_expandedHistory.has(s.id) ? 'Show less' : `+${history.length - 1} more`}
                    </button>` : ''}
                </div>` : '';
            return `
        <div class="dm-entry">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(s.name)}
                    ${s.category ? `<span class="dm-cat-badge">${esc(s.category)}</span>` : ''}
                    ${latestSnap ? `<span class="dm-last-seen">Played ${esc(latestSnap.date)}</span>` : ''}
                </div>
                <div class="dm-entry-desc">${snippet(s.description, 80)}</div>
                <div class="dm-entry-sub" style="margin-top:0.3rem">
                    ${s.scenes.length} scene${s.scenes.length !== 1 ? 's' : ''}
                    ${s.characters?.length ? ` · ${s.characters.length} character${s.characters.length !== 1 ? 's' : ''}` : ''}
                    ${s.contacts?.length   ? ` · ${s.contacts.length} contact${s.contacts.length !== 1 ? 's' : ''}` : ''}
                </div>
                ${historySection}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-sm" title="Mark as played"
                        onclick="DM._markPlayed('${s.id}')">Mark Played</button>
                <a class="dm-btn-icon" href="scenario-print.html?id=${s.id}" target="_blank" title="Open print view">⎙</a>
                <span class="dm-scenario-actions-sep"></span>
                <button class="dm-btn-icon" title="Edit"
                        onclick="DM.editScenario('${s.id}')">Edit</button>
                <button class="dm-btn-icon dm-btn-delete" title="Delete"
                        onclick="DM._requestDelete('scenario','${s.id}',this)">✕</button>
            </div>
        </div>`;
        }).join('');
    }
    list.innerHTML = html;
}

function newScenario() {
    _editingScenario = { id: uid(), name: '', description: '', category: '', characters: [], contacts: [], scenes: [] };
    _expandedScenes.clear();
    const form = document.getElementById('scenario-form');
    form.dataset.id = '';
    form.innerHTML = buildScenarioForm();
    _openEditor(form.id);
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
    _openEditor(form.id);
    renderScenes();
}

function deleteScenario(id) {
    st.scenarios = st.scenarios.filter(s => s.id !== id);
    persist('scenarios');
    renderScenarios();
}

function saveScenario(e) {
    e.preventDefault();
    _clearDirty();
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
    _closeForm(form.id);
    _editingScenario = null;
    _expandedScenes.clear();
}

// ── Scenario mutation helpers ──────────────────────────────────────────────
function _addScene() {
    _setDirty();
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
    _setDirty();
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
    _setDirty();
    _syncFromDOM();
    _editingScenario.scenes[si].challenges.push({ id: uid(), description: '', rewards: [] });
    renderChallenges(si);
}

function _removeChallenge(si, ci) {
    _setDirty();
    _syncFromDOM();
    _editingScenario.scenes[si].challenges.splice(ci, 1);
    renderChallenges(si);
}

function _addReward(si, ci) {
    _setDirty();
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards.push({ type: 'normal', itemId: '' });
    renderRewards(si, ci);
}

function _removeReward(si, ci, ri) {
    _setDirty();
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards.splice(ri, 1);
    renderRewards(si, ci);
}

function _setRewardType(si, ci, ri, type) {
    _setDirty();
    _syncFromDOM();
    _editingScenario.scenes[si].challenges[ci].rewards[ri].type   = type;
    _editingScenario.scenes[si].challenges[ci].rewards[ri].itemId = '';
    renderRewards(si, ci);
}

// ── Internal helpers (called from inline HTML) ─────────────────────────────
function _formListId(formId) {
    return formId.replace('-form', 's-list');
}

function _openEditor(formId) {
    _clearDirty();
    document.getElementById(formId)?.classList.add('active');
    document.getElementById(_formListId(formId))?.classList.add('dm-hidden');
}

function _closeForm(formId) {
    if (_dirty && !confirm('Discard unsaved changes?')) return;
    _clearDirty();
    document.getElementById(formId)?.classList.remove('active');
    document.getElementById(_formListId(formId))?.classList.remove('dm-hidden');
}

function _addBonus(bonusId) {
    _setDirty();
    const ctx = _bonusCtx[bonusId];
    if (!ctx) return;
    ctx.get().push({ target: DATA.statistics[0].abbreviation, value: 1 });
    renderBonuses(bonusId);
}

function _removeBonus(bonusId, idx) {
    _setDirty();
    const ctx = _bonusCtx[bonusId];
    if (!ctx) return;
    ctx.get().splice(idx, 1);
    renderBonuses(bonusId);
}

function _setBonusField(bonusId, idx, field, value) {
    _setDirty();
    const b = _bonusCtx[bonusId]?.get()[idx];
    if (b) b[field] = value;
}

function _addAttack() {
    _setDirty();
    _attacks.push({ name: '', description: '', damage: 1, damageType: 'blunt', reach: '' });
    renderAttacks();
}

function _removeAttack(idx) {
    _setDirty();
    _attacks.splice(idx, 1);
    renderAttacks();
}

function _setAtkField(atkIdx, field, value) {
    _setDirty();
    if (_attacks[atkIdx]) _attacks[atkIdx][field] = value;
}

// ── Number picker popup ────────────────────────────────────────────────────
let _pickerTarget = null;

function _numPickerOpen(inputEl, min, max) {
    _numPickerClose();
    _pickerTarget = inputEl;
    const cur = parseInt(inputEl.value, 10);
    const count = max - min + 1;
    const cols = count <= 7 ? count : (count % 7 === 0 ? 7 : 5);

    const popup = document.createElement('div');
    popup.id = 'dm-num-picker';
    popup.className = 'dm-stat-picker';
    popup.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    popup.innerHTML = Array.from({ length: count }, (_, i) => min + i).map(n =>
        `<button type="button" class="dm-stat-pick-btn${n === cur ? ' dm-stat-pick-cur' : ''}"
                 onclick="DM._numPickerSet(${n})">${n}</button>`
    ).join('');

    const rect = inputEl.getBoundingClientRect();
    popup.style.top  = (rect.bottom + 4) + 'px';
    popup.style.left = rect.left + 'px';
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.left = Math.max(4, rect.left + rect.width / 2 - popup.offsetWidth / 2) + 'px';
    });

    setTimeout(() => {
        document.addEventListener('click', _numPickerClickOutside, { once: true });
    }, 0);
}

function _numPickerSet(value) {
    if (_pickerTarget) {
        _pickerTarget.value = value;
        _pickerTarget.dispatchEvent(new Event('input',  { bubbles: true }));
        _pickerTarget.dispatchEvent(new Event('change', { bubbles: true }));
        _setDirty();
    }
    _numPickerClose();
}

function _numPickerClose() {
    document.getElementById('dm-num-picker')?.remove();
    _pickerTarget = null;
}

function _numPickerClickOutside(e) {
    if (!e.target.closest('#dm-num-picker')) {
        _numPickerClose();
    } else {
        document.addEventListener('click', _numPickerClickOutside, { once: true });
    }
}

// kept for stat inputs — delegates to generic picker
function _statPickerOpen(abbr, inputEl) { _numPickerOpen(inputEl, 1, 20); }
function _statPickerClose() { _numPickerClose(); }

// ── Custom select popup ────────────────────────────────────────────────────
let _csTarget = null;
let _csBtn = null;

/**
 * Build a custom-styled select widget.
 * @param {string} name       - The `name` attribute for the hidden <select>
 * @param {Array}  options    - [{value, label}] or [string] (value === label)
 * @param {string} selected   - Currently selected value
 * @param {string} onChange   - Inline onchange handler string, e.g. "DM._catChanged(this)"
 * @param {string} [extra]    - Extra attributes for the hidden <select>
 */
function buildCustomSelect(name, options, selected, onChange, extraClass = '') {
    const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
    const selOpt = opts.find(o => o.value === selected);
    const label = selOpt ? selOpt.label : (opts[0]?.label ?? '— select —');
    const optsHtml = opts.map(o =>
        `<option value="${esc(o.value)}"${o.value === selected ? ' selected' : ''}>${esc(o.label)}</option>`
    ).join('');
    const onchg = onChange ? ` onchange="${onChange}"` : '';
    const hiddenClass = extraClass ? `dm-cs-hidden ${extraClass}` : 'dm-cs-hidden';
    return `<div class="dm-cs-wrap"><button type="button" class="dm-input dm-cs-btn" onclick="DM._csOpen(this)">${esc(label)}</button><select name="${name}" class="${hiddenClass}"${onchg}>${optsHtml}</select></div>`;
}

function _csOpen(btnEl) {
    if (_csBtn === btnEl) { _csClose(); return; }
    _csClose();
    const wrap = btnEl.closest('.dm-cs-wrap');
    if (!wrap) return;
    const hidden = wrap.querySelector('select');
    if (!hidden) return;
    _csTarget = hidden;
    _csBtn = btnEl;

    const popup = document.createElement('div');
    popup.id = 'dm-cs-popup';
    popup.className = 'dm-cs-popup';
    popup.innerHTML = [...hidden.options].map(o => {
        const isAdd = o.value === '__add__';
        const cur = hidden.value === o.value ? ' dm-cs-opt-cur' : '';
        const addCls = isAdd ? ' dm-cs-opt-add' : '';
        const sep = isAdd ? '<div class="dm-cs-sep"></div>' : '';
        return `${sep}<button type="button" class="dm-cs-opt${cur}${addCls}" data-value="${esc(o.value)}" onclick="DM._csPick(this.dataset.value)">${esc(o.text)}</button>`;
    }).join('');

    const rect = btnEl.getBoundingClientRect();
    popup.style.top = (rect.bottom + 2) + 'px';
    popup.style.left = rect.left + 'px';
    popup.style.minWidth = rect.width + 'px';
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        const pr = popup.getBoundingClientRect();
        if (pr.right > window.innerWidth - 4) {
            popup.style.left = Math.max(4, window.innerWidth - pr.width - 4) + 'px';
        }
    });

    setTimeout(() => {
        document.addEventListener('click', _csClickOutside, { once: true });
    }, 0);
}

function _csPick(value) {
    if (!_csTarget) return;
    _csTarget.value = value;
    _csTarget.dispatchEvent(new Event('change', { bubbles: true }));
    _csRefreshBtn(_csTarget);
    _csClose();
}

function _csRefreshBtn(sel) {
    const btn = sel.closest?.('.dm-cs-wrap')?.querySelector('.dm-cs-btn');
    if (!btn) return;
    const opt = [...sel.options].find(o => o.value === sel.value);
    if (opt) btn.textContent = opt.text;
}

function _csClose() {
    document.getElementById('dm-cs-popup')?.remove();
    _csTarget = null;
    _csBtn = null;
}

function _csClickOutside(e) {
    if (!e.target.closest('#dm-cs-popup') && !e.target.closest('.dm-cs-btn')) {
        _csClose();
    } else {
        document.addEventListener('click', _csClickOutside, { once: true });
    }
}

function _statStep(abbr, delta) {
    const input = document.querySelector(`[name=stat-${abbr}]`);
    if (!input) return;
    const val = Math.min(20, Math.max(1, (parseInt(input.value, 10) || 1) + delta));
    input.value = val;
    _setDirty();
}

// ── Inline delete confirm ──────────────────────────────────────────────────
function _requestDelete(type, id, btnEl) {
    // Reset any other open confirmation first
    document.querySelectorAll('.dm-entry-actions[data-orig-html]').forEach(a => {
        if (a !== btnEl.closest('.dm-entry-actions')) {
            a.innerHTML = a.dataset.origHtml;
            delete a.dataset.origHtml;
        }
    });
    const actions = btnEl.closest('.dm-entry-actions');
    if (!actions) return;
    actions.dataset.origHtml = actions.innerHTML;
    actions.innerHTML = `
        <span class="dm-delete-label">Delete?</span>
        <button class="btn-primary dm-btn-confirm-delete"
                onclick="DM._doDelete('${type}','${id}')">Delete</button>
        <button class="dm-btn-sm"
                onclick="DM._cancelDelete(this)">Cancel</button>`;
}

function _cancelDelete(btn) {
    const actions = btn.closest('.dm-entry-actions');
    if (actions?.dataset.origHtml) actions.innerHTML = actions.dataset.origHtml;
}

function _doDelete(type, id) {
    const handlers = {
        contact:  () => { st.contacts  = st.contacts.filter(c => c.id !== id);  persist('contacts');  renderContacts();  },
        item:     () => { st.items     = st.items.filter(x => x.id !== id);      persist('items');     renderItems();     },
        monster:  () => { st.monsters  = st.monsters.filter(m => m.id !== id);  persist('monsters');  renderMonsters();  },
        place:    () => { st.places    = st.places.filter(p => p.id !== id);     persist('places');    renderPlaces();    },
        scenario: () => { st.scenarios = st.scenarios.filter(s => s.id !== id); persist('scenarios'); renderScenarios(); },
    };
    handlers[type]?.();
}

// ── Download / Upload ──────────────────────────────────────────────────────
function download() {
    let characters = [];
    try { characters = JSON.parse(localStorage.getItem(LS.chars) || '[]'); } catch (_) {}

    const bundle = {
        version:       1,
        date:          new Date().toISOString().slice(0, 10),
        contacts:      st.contacts,
        items:         st.items,
        monsters:      st.monsters,
        places:        st.places,
        scenarios:     st.scenarios,
        characters,
        rulesOverrides: loadRulesOverrides(),
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

                if (bundle.rulesOverrides) {
                    if (merge) {
                        const cur = loadRulesOverrides();
                        ['creatures', 'powers', 'items'].forEach(k => {
                            if (bundle.rulesOverrides[k]) {
                                cur[k] = { ...cur[k], ...bundle.rulesOverrides[k] };
                            }
                        });
                        saveRulesOverrides(cur);
                    } else {
                        saveRulesOverrides(bundle.rulesOverrides);
                    }
                }
                renderContacts();
                renderItems();
                renderMonsters();
                renderPlaces();
                renderScenarios();
                renderBestiary();
                renderPowers();
                renderItemRules();
                renderConfig();
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

// ── Global search ──────────────────────────────────────────────────────────

function _refreshSearchScenarios() {
    const sel = document.getElementById('dm-search-scenario');
    if (!sel) return;
    const cur = sel.value;
    const logs = _allHistoryLogs();
    const names = [...new Set(logs.map(l => l.scenarioName))].sort();
    sel.innerHTML = '<option value="">All sessions</option>' +
        names.map(n => `<option value="${esc(n)}" ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('');
}

function _searchInput(query) {
    const panel = document.getElementById('dm-search-results');
    if (!panel) return;
    const q = query.trim();
    const scenarioSel = document.getElementById('dm-search-scenario')?.value || '';
    if (!q && !scenarioSel) { panel.classList.add('dm-hidden'); panel.innerHTML = ''; return; }

    let groups;
    const refGroups = [];

    if (scenarioSel) {
        // Temporal filter: search within a specific session's history log
        const logs = _allHistoryLogs();
        const entries = filterByScenario(scenarioSel, logs);
        const hits = search(q, entries);
        if (hits.length) {
            groups = [{ label: `${scenarioSel} (history)`, hits, tab: null, editFn: null }];
        } else {
            panel.innerHTML = `<div class="dm-search-empty">No results in "${esc(scenarioSel)}"${q ? ` for "${esc(q)}"` : ''}.</div>`;
            panel.classList.remove('dm-hidden');
            return;
        }
    } else {
        // Search campaign content
        const contactHits  = search(q, st.contacts.map(c => ({ ...c, type: 'contact' })));
        const itemHits     = search(q, st.items.map(i => ({ ...i, type: 'item' })));
        const monsterHits  = search(q, st.monsters.map(m => ({ ...m, type: 'monster' })));
        const placeHits    = search(q, st.places.map(p => ({ ...p, type: 'place' })));
        const scenarioHits = search(q, st.scenarios.map(s => ({ ...s, type: 'scenario' })));

        groups = [
            { label: 'Contacts',      hits: contactHits,  tab: 'contacts',   editFn: 'editContact' },
            { label: 'Special Items', hits: itemHits,      tab: 'items',      editFn: 'editItem' },
            { label: 'Monsters',      hits: monsterHits,   tab: 'monsters',   editFn: 'editMonster' },
            { label: 'Places',        hits: placeHits,     tab: 'places',     editFn: 'editPlace' },
            { label: 'Scenarios',     hits: scenarioHits,  tab: 'scenarios',  editFn: 'editScenario' },
        ].filter(g => g.hits.length > 0);

        // Always search reference content
        if (q) {
            const creatureHits = search(q, (DATA.creatures || []).map(c => ({ ...c, type: 'creature' })));
            const powerHits    = search(q, DATA.powers.map(p => ({ ...p, type: 'power' })));
            const ruleItemHits = search(q, DATA.items.map(i => ({ ...i, type: 'rule-item' })));
            if (creatureHits.length) refGroups.push({ label: 'Bestiary',    hits: creatureHits, tab: 'bestiary' });
            if (powerHits.length)    refGroups.push({ label: 'Powers',       hits: powerHits,    tab: 'powers' });
            if (ruleItemHits.length) refGroups.push({ label: 'Item Rules',   hits: ruleItemHits, tab: 'item-rules' });
        }
    }

    if (groups.length === 0 && refGroups.length === 0) {
        panel.innerHTML = `<div class="dm-search-empty">No results for "${esc(q)}".</div>`;
        panel.classList.remove('dm-hidden');
        return;
    }

    const renderGroup = (g, isRef) => {
        const rows = g.hits.slice(0, 5).map(h => {
            const nameLabel = esc(h.name);
            if (isRef || !g.editFn) {
                const clickFn = g.tab ? `DM._searchGoTab('${g.tab}');DM._searchClose()` : `DM._searchClose()`;
                return `<button class="dm-search-result-row" onclick="${clickFn}">
                    <span class="dm-search-result-name">${nameLabel}</span>
                    ${h.type ? `<span class="dm-search-result-meta">${esc(h.type)}</span>` : ''}
                    ${h.category ? `<span class="dm-search-result-meta">${esc(h.category)}</span>` : ''}
                </button>`;
            }
            return `<button class="dm-search-result-row" onclick="DM.${g.editFn}('${h.id}');DM._searchClose()">
                <span class="dm-search-result-name">${nameLabel}</span>
                ${h.category ? `<span class="dm-search-result-meta">${esc(h.category)}</span>` : ''}
                <span class="dm-search-result-go">Go</span>
            </button>`;
        }).join('');
        const moreClick = g.tab
            ? `DM._searchGoTab('${g.tab}');DM._searchClose()`
            : `DM._searchClose()`;
        const more = g.hits.length > 5
            ? `<button class="dm-search-more" onclick="${moreClick}">+${g.hits.length - 5} more in ${esc(g.label)}</button>`
            : '';
        return `<div class="dm-search-group">
            <div class="dm-search-group-label">${esc(g.label)}</div>
            ${rows}${more}
        </div>`;
    };

    panel.innerHTML = [
        ...groups.map(g => renderGroup(g, false)),
        ...refGroups.map(g => renderGroup(g, true)),
    ].join('');
    panel.classList.remove('dm-hidden');
}

function _searchGoTab(tab) {
    showTab(tab);
}

function _searchClose() {
    const panel = document.getElementById('dm-search-results');
    if (panel) { panel.classList.add('dm-hidden'); panel.innerHTML = ''; }
    const input = document.getElementById('dm-search-input');
    if (input) input.value = '';
}

// ── Item Rules reference tab ───────────────────────────────────────────────

const ITEM_RULES_ANIMALS = new Set(['horse','donkey','dog','falcon','cart']);
const ITEM_RULES_CATEGORIES = ['Weapons','Armor and Protection','Animals and Transport','Gear','Basic Supplies'];

function _itemRulesCategory(item) {
    if (ITEM_RULES_ANIMALS.has(item.name)) return 'Animals and Transport';
    if (item.protects)    return 'Armor and Protection';
    if (item.damage)      return 'Weapons';
    if (!item.statistics) return 'Basic Supplies';
    return 'Gear';
}

const _itemRulesFilter = { category: '' };

function _setItemRulesFilter(val) {
    _itemRulesFilter.category = val;
    renderItemRules();
}

function _copyToSpecialItems(itemName) {
    const base = DATA.items.find(i => i.name === itemName);
    if (!base) return;
    // Build description from rule details
    const lines = [];
    if (base.damage) lines.push(`Damage: ${base.damage.type}${base.damage.statReduced ? ' · ' + base.damage.statReduced + ' reduced' : ''}.`);
    if (base.protects) lines.push(`Protects: ${base.protects}.`);
    (base.boost  || []).forEach(b => lines.push(`Boost (${b.condition}): ${b.effect}`));
    (base.hinder || []).forEach(h => lines.push(`Hinder (${h.condition}): ${h.effect}`));
    if (base.material)   lines.push(`Material: ${base.material}`);
    if (base.masterwork) lines.push(`Masterwork: ${base.masterwork}`);
    _itemBonuses = [];
    const form = document.getElementById('item-form');
    form.dataset.id = '';
    form.innerHTML = buildItemForm({ name: base.name, type: base.name, description: lines.join('\n'), bonuses: [] });
    showTab('items');
    _openEditor(form.id);
    _regItemBonuses();
    renderBonuses('item-bonuses');
    // Set type selector after render
    const typeEl = form.querySelector('[name=type]');
    if (typeEl) typeEl.value = base.name;
}

function renderItemRules() {
    const list = document.getElementById('item-rules-list');
    if (!list) return;

    const itemsOv = loadRulesOverrides().items || {};
    const cur = _itemRulesFilter.category;
    const allItems = resolveRuleItems();
    const items = cur
        ? allItems.filter(i => _itemRulesCategory(i) === cur)
        : allItems;

    let html = `<div class="dm-list-filter">
        <span class="dm-filter-label">Filter:</span>
        ${buildCustomSelect('', [{value:'',label:'All categories'}].concat(ITEM_RULES_CATEGORIES.map(c=>({value:c,label:c}))), cur, 'DM._setItemRulesFilter(this.value)')}
    </div>`;

    html += items.map(item => {
        const modified = !!itemsOv[item.name];
        const stats = (item.statistics || []).join(' + ');
        const meta = [stats, item.special ? item.special : '', item.bulk != null ? `bulk ${item.bulk}` : ''].filter(Boolean).join(' — ');
        const boostRows = (item.boost || []).map(b =>
            `<div class="dm-item-rule-row"><span class="dm-item-rule-label">Boost</span><span class="dm-item-rule-cond">(${esc(b.condition)})</span> ${esc(b.effect)}</div>`).join('');
        const hinderRows = (item.hinder || []).map(h =>
            `<div class="dm-item-rule-row"><span class="dm-item-rule-label dm-item-rule-hinder">Hinder</span><span class="dm-item-rule-cond">(${esc(h.condition)})</span> ${esc(h.effect)}</div>`).join('');
        const dmgRow = item.damage
            ? `<div class="dm-item-rule-row"><span class="dm-item-rule-label">Damage</span>${esc(item.damage.type)}${item.damage.statReduced ? ` · ${esc(item.damage.statReduced)} reduced` : ''}</div>`
            : '';
        const protRow = item.protects
            ? `<div class="dm-item-rule-row"><span class="dm-item-rule-label">Protects</span>${esc(item.protects)}</div>`
            : '';
        const matRow = item.material
            ? `<div class="dm-item-rule-row"><span class="dm-item-rule-label">Material</span>${esc(item.material)}</div>`
            : '';
        const mwRow = item.masterwork
            ? `<div class="dm-item-rule-row"><span class="dm-item-rule-label">Masterwork</span>${esc(item.masterwork)}</div>`
            : '';
        return `
        <div class="dm-entry dm-entry-rules">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(item.name)}
                    ${modified ? originBadge('modified') : originBadge('rules')}
                    ${meta ? `<span class="dm-power-header-right">${esc(meta)}</span>` : ''}
                </div>
                ${item.description ? `<div class="dm-entry-desc">${esc(item.description)}</div>` : ''}
                <div class="dm-item-rules">${dmgRow}${protRow}${boostRows}${hinderRows}${matRow}${mwRow}</div>
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-sm" title="Edit item rule"
                        onclick="DM._editRulesEntry('items','${esc(item.name)}',this)">Edit</button>
                <button class="dm-btn-sm" title="Copy to Special Items"
                        onclick="DM._copyToSpecialItems('${esc(item.name)}')">Copy to Items</button>
            </div>
        </div>`;
    }).join('');

    list.innerHTML = html;
}

// ── Bestiary reference tab ─────────────────────────────────────────────────

const _bestiaryFilter = { category: '' };

function _setBestiaryFilter(val) {
    _bestiaryFilter.category = val;
    renderBestiary();
}

function _duplicateMonster(id) {
    const monster = st.monsters.find(m => m.id === id);
    if (!monster) return;
    _attacks = (monster.attacks || []).map(a => ({ ...a }));
    const form = document.getElementById('monster-form');
    form.dataset.id = '';
    form.innerHTML = buildMonsterForm({ ...monster });
    _openEditor(form.id);
    renderAttacks();
}

function _copyToMonsters(creatureName) {
    const creature = (DATA.creatures || []).find(c => c.name === creatureName);
    if (!creature) return;
    // Map creature attacks to monster attack format
    _attacks = (creature.attacks || []).map(a => ({
        name:        a.name        || '',
        description: a.description || '',
        damage:      1,
        damageType:  a.type        || 'blunt',
        reach:       a.reach       || 'close',
        statReduced: a.statReduced || '',
    }));
    const form = document.getElementById('monster-form');
    form.dataset.id = '';
    form.innerHTML = buildMonsterForm({
        name:        creature.name,
        category:    creature.category || '',
        description: '',
        motivation:  creature.motivation  || '',
        behaviour:   creature.behaviour   || '',
        druidBond:   creature.druidBond   || '',
        stats:       { ...creature.stats },
        attacks:     _attacks,
    });
    showTab('monsters');
    _openEditor(form.id);
    renderAttacks();
}

function renderBestiary() {
    const list = document.getElementById('bestiary-list');
    if (!list) return;

    const allCats = [...new Set((DATA.creatures || []).map(c => c.category))];
    const cur = _bestiaryFilter.category;
    const creaturesOv = loadRulesOverrides().creatures || {};

    const creatures = (cur
        ? resolveCreatures().filter(c => c.category === cur)
        : resolveCreatures());

    let html = `<div class="dm-list-filter">
        <span class="dm-filter-label">Filter:</span>
        ${buildCustomSelect('', [{value:'',label:'All categories'}].concat(allCats.map(c=>({value:c,label:c}))), cur, 'DM._setBestiaryFilter(this.value)')}
    </div>`;

    if (!creatures.length) {
        html += '<div class="dm-empty">No creatures match this filter.</div>';
        list.innerHTML = html;
        return;
    }

    const STATS = ['Char','Dex','Endu','Hand','Might','Perc','Speed','Will'];
    html += creatures.map(c => {
        const modified = !!creaturesOv[c.name];
        const statRow = STATS.map(s => `<span class="dm-tag dm-stat-tag">${s}&nbsp;${c.stats?.[s] ?? '?'}</span>`).join('');
        const attackRows = (c.attacks || []).map(a =>
            `<div class="dm-bestiary-attack">
                <span class="dm-bestiary-atk-name">${esc(a.name)}</span>
                <span class="dm-bestiary-atk-meta">${[a.type, a.reach, a.statReduced ? a.statReduced + ' reduced' : ''].filter(Boolean).join(' · ')}</span>
            </div>`
        ).join('');
        return `
        <div class="dm-entry dm-entry-rules">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(c.name)}
                    ${modified ? originBadge('modified') : originBadge('rules')}
                    ${c.category ? `<span class="dm-cat-badge">${esc(c.category)}</span>` : ''}
                </div>
                <div class="dm-entry-tags dm-stat-tags">${statRow}</div>
                ${attackRows ? `<div class="dm-bestiary-attacks">${attackRows}</div>` : ''}
                ${c.motivation ? `<div class="dm-bestiary-field"><span class="dm-power-label">Motivation</span>${esc(c.motivation)}</div>` : ''}
                ${c.behaviour  ? `<div class="dm-bestiary-field"><span class="dm-power-label">Behaviour</span>${esc(c.behaviour)}</div>`  : ''}
                ${c.druidBond  ? `<div class="dm-bestiary-field"><span class="dm-power-label">Druid bond</span>${esc(c.druidBond)}</div>`  : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-sm" title="Edit creature"
                        onclick="DM._editRulesEntry('creatures','${esc(c.name)}',this)">Edit</button>
                <button class="dm-btn-sm" title="Copy to Monsters"
                        onclick="DM._copyToMonsters('${esc(c.name)}')">Copy to Monsters</button>
            </div>
        </div>`;
    }).join('');

    list.innerHTML = html;
}

// ── Powers reference tab ────────────────────────────────────────────────────

function _setPowerFilter(key, val) {
    _powerFilter[key] = val;
    renderPowers();
}

function _clearPowerFilter() {
    _powerFilter.stat = '';
    _powerFilter.scenarioType = '';
    _powerFilter.race = '';
    renderPowers();
}

function renderPowers() {
    const list = document.getElementById('powers-list');
    if (!list) return;

    // Collect unique scenario type names and stats for filter dropdowns
    const allScenarioTypes = [...new Set(
        DATA.powers.flatMap(p => (p.scenarios || []).map(s => s.name))
    )].sort();
    const allStats = [...new Set(
        DATA.powers.flatMap(p => p.statistics || [])
    )].sort();

    // Build race-to-power-name lookup once
    const raceNames = (DATA.races || []).map(r => r.name);

    const powersOv = loadRulesOverrides().powers || {};
    // Filter powers
    let powers = resolvePowers();
    if (_powerFilter.stat) {
        powers = powers.filter(p => (p.statistics || []).includes(_powerFilter.stat));
    }
    if (_powerFilter.scenarioType) {
        powers = powers.filter(p =>
            (p.scenarios || []).some(s => s.name === _powerFilter.scenarioType));
    }
    if (_powerFilter.race) {
        const race = (DATA.races || []).find(r => r.name === _powerFilter.race);
        if (race) {
            const racePs = new Set((race.powers || []).map(n => n.toLowerCase()));
            powers = powers.filter(p => racePs.has(p.name.toLowerCase()));
        }
    }

    const statSel = _powerFilter.stat;
    const typeSel = _powerFilter.scenarioType;
    const raceSel = _powerFilter.race;

    let html = `<div class="dm-list-filter dm-power-filter">
        <span class="dm-filter-label">Filter:</span>
        ${buildCustomSelect('', [{value:'',label:'All stats'}].concat(allStats.map(s=>({value:s,label:s}))), statSel, "DM._setPowerFilter('stat', this.value)")}
        ${buildCustomSelect('', [{value:'',label:'All scenarios'}].concat(allScenarioTypes.map(t=>({value:t,label:t}))), typeSel, "DM._setPowerFilter('scenarioType', this.value)")}
        ${buildCustomSelect('', [{value:'',label:'All races'}].concat(raceNames.map(r=>({value:r,label:r}))), raceSel, "DM._setPowerFilter('race', this.value)")}
        ${(_powerFilter.stat || _powerFilter.scenarioType || _powerFilter.race)
            ? `<button type="button" class="dm-btn-sm dm-filter-clear"
                       onclick="DM._clearPowerFilter()">Clear</button>`
            : ''}
    </div>`;

    if (!powers.length) {
        html += '<div class="dm-empty">No powers match the current filter.</div>';
        list.innerHTML = html;
        return;
    }

    html += powers.map(p => {
        const modified = !!powersOv[p.name];
        const stats = (p.statistics || []).join(' + ');
        const headerRight = [stats, p.special].filter(Boolean).join(' — ');
        const scenarioRows = (p.scenarios || []).map(s => `
            <div class="dm-power-scenario">
                <span class="dm-power-scenario-name">${esc(s.name)}</span>
                <span class="dm-power-scenario-use">${esc(s.use)}</span>
            </div>`).join('');
        return `
        <div class="dm-entry dm-entry-rules">
            <div class="dm-entry-main">
                <div class="dm-entry-title">
                    ${esc(p.name)}
                    ${modified ? originBadge('modified') : originBadge('rules')}
                    ${headerRight ? `<span class="dm-power-header-right">${esc(headerRight)}</span>` : ''}
                </div>
                ${p.description ? `<div class="dm-entry-desc">${esc(p.description)}</div>` : ''}
                ${scenarioRows ? `<div class="dm-power-scenarios">${scenarioRows}</div>` : ''}
                ${p.overwhelmed ? `<div class="dm-power-overwhelmed"><span class="dm-power-label">Overwhelmed</span> ${esc(p.overwhelmed)}</div>` : ''}
            </div>
            <div class="dm-entry-actions">
                <button class="dm-btn-sm" title="Edit power"
                        onclick="DM._editRulesEntry('powers','${esc(p.name)}',this)">Edit</button>
            </div>
        </div>`;
    }).join('');

    list.innerHTML = html;
}

// ── Rules edit forms ───────────────────────────────────────────────────────

function _rulesEditFormCreature(c) {
    return `
        <div class="dm-rules-edit-form" data-type="creatures" data-name="${esc(c.name)}">
            <div class="dm-form-title">${esc(c.name)} — Edit Creature</div>
            <div class="dm-rules-edit-actions">
                <button type="button" class="btn-primary" onclick="DM._saveRulesEntry(this)">Save</button>
                <button type="button" class="btn-secondary" onclick="DM._cancelRulesEntry(this)">Cancel</button>
                <button type="button" class="dm-btn-danger" onclick="DM._resetRulesEntry('creatures','${esc(c.name)}')">Reset to default</button>
            </div>
            <div class="dm-form-body">
                <div class="dm-form-group">
                    <label class="dm-label">Description</label>
                    <textarea class="dm-input" name="description" rows="3"
                              placeholder="General description of this creature.">${esc(c.description || '')}</textarea>
                </div>
                <div class="dm-form-group">
                    <label class="dm-label">Motivation</label>
                    <textarea class="dm-input" name="motivation" rows="2"
                              placeholder="Why does this creature attack, flee, or ignore the group?">${esc(c.motivation || '')}</textarea>
                </div>
                <div class="dm-form-group">
                    <label class="dm-label">Statistics</label>
                    ${buildStatInputsHTML(c.stats)}
                </div>
                <div class="dm-form-group">
                    <label class="dm-label">Behaviour</label>
                    <textarea class="dm-input" name="behaviour" rows="2"
                              placeholder="Tactical patterns, retreat conditions, special notes.">${esc(c.behaviour || '')}</textarea>
                </div>
                <div class="dm-form-group">
                    <label class="dm-label">Druid Bond <span class="dm-label-hint">(optional — animals only)</span></label>
                    <textarea class="dm-input" name="druidBond" rows="2"
                              placeholder="What a character with the Druid power can ask of this creature.">${esc(c.druidBond || '')}</textarea>
                </div>
                <div class="dm-form-group">
                    <label class="dm-label">Attacks</label>
                    <div id="monster-attacks" class="dm-attacks-list"></div>
                    <button type="button" class="dm-btn-sm" onclick="DM._addAttack()">+ Add Attack</button>
                </div>
            </div>
            <div class="dm-rules-edit-actions">
                <button type="button" class="btn-primary" onclick="DM._saveRulesEntry(this)">Save</button>
                <button type="button" class="btn-secondary" onclick="DM._cancelRulesEntry(this)">Cancel</button>
                <button type="button" class="dm-btn-danger" onclick="DM._resetRulesEntry('creatures','${esc(c.name)}')">Reset to default</button>
            </div>
        </div>`;
}

function _rulesEditFormPower(p) {
    const scenariosHtml = (p.scenarios || []).map((s, i) =>
        `<div class="dm-rules-atk-row">
            <span class="dm-rules-atk-name">${esc(s.name)}</span>
            <textarea class="dm-input dm-rules-atk-desc" rows="2" name="sc_${i}"
                      placeholder="Scenario use…">${esc(s.use || '')}</textarea>
        </div>`).join('');
    return `
        <div class="dm-rules-edit-form" data-type="powers" data-name="${esc(p.name)}">
            <div class="dm-entry-title">${esc(p.name)} <span class="dm-rules-edit-label">— editing</span></div>
            <div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Description</label>
                <textarea class="dm-input" name="description" rows="2"
                          placeholder="Brief description of the power…">${esc(p.description || '')}</textarea>
            </div>
            <div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Overwhelmed</label>
                <textarea class="dm-input" name="overwhelmed" rows="2"
                          placeholder="What happens when overwhelmed…">${esc(p.overwhelmed || '')}</textarea>
            </div>
            ${scenariosHtml ? `<div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Scenario uses</label>
                ${scenariosHtml}
            </div>` : ''}
            <div class="dm-rules-edit-actions">
                <button type="button" class="btn-primary" onclick="DM._saveRulesEntry(this)">Save</button>
                <button type="button" class="btn-secondary" onclick="DM._cancelRulesEntry(this)">Cancel</button>
                <button type="button" class="dm-btn-danger" onclick="DM._resetRulesEntry('powers','${esc(p.name)}')">Reset to default</button>
            </div>
        </div>`;
}

function _rulesEditFormItem(item) {
    const boostHtml = (item.boost || []).map((b, i) =>
        `<div class="dm-rules-atk-row">
            <span class="dm-rules-atk-name">Boost — ${esc(b.condition)}</span>
            <textarea class="dm-input dm-rules-atk-desc" rows="2" name="boost_${i}">${esc(b.effect || '')}</textarea>
        </div>`).join('');
    const hinderHtml = (item.hinder || []).map((h, i) =>
        `<div class="dm-rules-atk-row">
            <span class="dm-rules-atk-name">Hinder — ${esc(h.condition)}</span>
            <textarea class="dm-input dm-rules-atk-desc" rows="2" name="hinder_${i}">${esc(h.effect || '')}</textarea>
        </div>`).join('');
    return `
        <div class="dm-rules-edit-form" data-type="items" data-name="${esc(item.name)}">
            <div class="dm-entry-title">${esc(item.name)} <span class="dm-rules-edit-label">— editing</span></div>
            <div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Description</label>
                <textarea class="dm-input" name="description" rows="2"
                          placeholder="Add a description for this item…">${esc(item.description || '')}</textarea>
            </div>
            ${boostHtml ? `<div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Boost effects</label>
                ${boostHtml}
            </div>` : ''}
            ${hinderHtml ? `<div class="dm-rules-edit-row">
                <label class="dm-rules-field-label">Hinder effects</label>
                ${hinderHtml}
            </div>` : ''}
            <div class="dm-rules-edit-actions">
                <button type="button" class="btn-primary" onclick="DM._saveRulesEntry(this)">Save</button>
                <button type="button" class="btn-secondary" onclick="DM._cancelRulesEntry(this)">Cancel</button>
                <button type="button" class="dm-btn-danger" onclick="DM._resetRulesEntry('items','${esc(item.name)}')">Reset to default</button>
            </div>
        </div>`;
}

function _editRulesEntry(type, name, btnEl) {
    const entry = btnEl.closest('.dm-entry');
    if (!entry || entry.classList.contains('dm-editing')) return;
    entry.classList.add('dm-editing');
    let formHtml;
    if (type === 'creatures') {
        const c = resolveCreatures().find(x => x.name === name);
        if (!c) return;
        _attacks = (c.attacks || []).map(a => ({
            name:        a.name        || '',
            description: a.description || '',
            damage:      1,
            damageType:  a.type || a.damageType || 'blunt',
            reach:       a.reach       || 'close',
            statReduced: a.statReduced || '',
        }));
        const monsterForm = document.getElementById('monster-form');
        monsterForm.dataset.rulesCreature = name;
        monsterForm.innerHTML = _rulesEditFormCreature(c);
        showTab('monsters');
        _openEditor('monster-form');
        renderAttacks();
        return;
    } else if (type === 'powers') {
        const p = resolvePowers().find(x => x.name === name);
        formHtml = p ? _rulesEditFormPower(p) : '';
    } else {
        const item = resolveRuleItems().find(x => x.name === name);
        formHtml = item ? _rulesEditFormItem(item) : '';
    }
    entry.innerHTML = formHtml;
}

function _saveRulesEntry(btnEl) {
    const form = btnEl.closest('.dm-rules-edit-form');
    if (!form) return;
    const type = form.dataset.type;
    const name = form.dataset.name;

    if (type === 'creatures') {
        const STATS = ['Char','Dex','Endu','Hand','Might','Perc','Speed','Will'];
        const stats = {};
        STATS.forEach(s => {
            const el = form.querySelector(`[name=stat-${s}]`);
            stats[s] = el ? (parseInt(el.value, 10) || 1) : 1;
        });
        const attacks = _attacks.map(a => ({
            name:        a.name        || '',
            description: a.description || '',
            type:        a.damageType  || a.type || 'blunt',
            reach:       a.reach       || 'close',
            statReduced: a.statReduced || '',
        }));
        saveRuleOverride('creatures', name, {
            description: form.querySelector('[name=description]')?.value.trim() || '',
            motivation:  form.querySelector('[name=motivation]')?.value.trim()  || '',
            behaviour:   form.querySelector('[name=behaviour]')?.value.trim()   || '',
            druidBond:   form.querySelector('[name=druidBond]')?.value.trim()   || '',
            stats, attacks,
        });
        delete document.getElementById('monster-form')?.dataset.rulesCreature;
        _clearDirty();
        _closeForm('monster-form');
        renderBestiary();
        renderMonsters();
    } else if (type === 'powers') {
        const base = DATA.powers.find(p => p.name === name);
        if (!base) return;
        const scenarioUses = {};
        (base.scenarios || []).forEach((s, i) => {
            const el = form.querySelector(`[name=sc_${i}]`);
            if (el) scenarioUses[s.name] = el.value.trim();
        });
        saveRuleOverride('powers', name, {
            description: form.querySelector('[name=description]')?.value.trim() || '',
            overwhelmed: form.querySelector('[name=overwhelmed]')?.value.trim() || '',
            scenarioUses,
        });
        renderPowers();
    } else {
        const base = DATA.items.find(i => i.name === name);
        if (!base) return;
        const boost = (base.boost || []).map((b, i) => {
            const el = form.querySelector(`[name=boost_${i}]`);
            return { ...b, effect: el ? el.value.trim() : b.effect };
        });
        const hinder = (base.hinder || []).map((h, i) => {
            const el = form.querySelector(`[name=hinder_${i}]`);
            return { ...h, effect: el ? el.value.trim() : h.effect };
        });
        const ov = { description: form.querySelector('[name=description]')?.value.trim() || '' };
        if (boost.length) ov.boost = boost;
        if (hinder.length) ov.hinder = hinder;
        saveRuleOverride('items', name, ov);
        renderItemRules();
    }
    renderConfig();
}

function _cancelRulesEntry(btnEl) {
    const form = btnEl.closest('.dm-rules-edit-form');
    if (!form) return;
    const type = form.dataset.type;
    if (type === 'creatures') {
        delete document.getElementById('monster-form')?.dataset.rulesCreature;
        _clearDirty();
        _closeForm('monster-form');
        renderBestiary();
        renderMonsters();
    } else if (type === 'powers') renderPowers();
    else renderItemRules();
}

function _resetRulesEntry(type, name) {
    resetRuleOverride(type, name);
    if (type === 'creatures') {
        const mf = document.getElementById('monster-form');
        if (mf?.classList.contains('active')) {
            delete mf.dataset.rulesCreature;
            _clearDirty();
            _closeForm('monster-form');
        }
        renderBestiary();
        renderMonsters();
    } else if (type === 'powers') renderPowers();
    else renderItemRules();
    renderConfig();
}

function _resetAllRules() {
    saveRulesOverrides({ creatures: {}, powers: {}, items: {} });
    renderBestiary();
    renderPowers();
    renderItemRules();
    renderMonsters();
    renderConfig();
}

// ── Config page ────────────────────────────────────────────────────────────

function _renderConfigRulesSection() {
    const ov = loadRulesOverrides();
    const creatureNames = Object.keys(ov.creatures || {});
    const powerNames    = Object.keys(ov.powers    || {});
    const itemNames     = Object.keys(ov.items     || {});
    const total = creatureNames.length + powerNames.length + itemNames.length;

    const makeList = (names, type, tab) => names.map(name =>
        `<div class="dm-config-rules-row">
            <span class="dm-config-rules-name">${esc(name)}</span>
            <button type="button" class="dm-btn-sm" onclick="DM.showTab('${tab}')">Go to ${tab}</button>
            <button type="button" class="dm-btn-sm dm-btn-confirm-delete"
                    onclick="DM._resetRulesEntry('${type}','${esc(name)}')">Reset</button>
        </div>`).join('');

    const body = total === 0
        ? `<div class="dm-empty">No overrides yet — use the Edit button in the Bestiary, Powers, or Item Rules tabs.</div>`
        : `${creatureNames.length ? `<div class="dm-config-rules-group">
                <div class="dm-config-rules-group-title">Creatures (${creatureNames.length})</div>
                ${makeList(creatureNames, 'creatures', 'bestiary')}
            </div>` : ''}
            ${powerNames.length ? `<div class="dm-config-rules-group">
                <div class="dm-config-rules-group-title">Powers (${powerNames.length})</div>
                ${makeList(powerNames, 'powers', 'powers')}
            </div>` : ''}
            ${itemNames.length ? `<div class="dm-config-rules-group">
                <div class="dm-config-rules-group-title">Item Rules (${itemNames.length})</div>
                ${makeList(itemNames, 'items', 'item-rules')}
            </div>` : ''}
            <button type="button" class="dm-btn-danger" onclick="DM._resetAllRules()"
                    style="margin-top:0.75rem">Reset all overrides</button>`;

    return `<section class="dm-config-section">
        <h2 class="dm-section-title">Rules Overrides</h2>
        <p class="dm-config-campaign-desc">Customise creatures, powers, and items for your campaign world. Overrides are saved with your campaign data.</p>
        ${body}
    </section>`;
}

function renderConfig() {
    const el = document.getElementById('config-content');
    if (!el) return;
    const cats = loadCategories();

    // Count entries per category name across all five arrays
    const counts = {};
    ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
        st[k].forEach(e => {
            if (e.category) counts[e.category] = (counts[e.category] || 0) + 1;
        });
    });

    const catRows = cats.map((cat, i) => {
        const count = counts[cat.name] || 0;
        const countTxt = count > 0 ? `<span class="dm-config-cat-count">· ${count} entr${count === 1 ? 'y' : 'ies'}</span>` : '';
        const pill = cat.sessionVisible
            ? `<button type="button" class="dm-config-pill dm-config-pill--session" onclick="DM._configToggleSession(${i})">● Session</button>`
            : `<button type="button" class="dm-config-pill dm-config-pill--prep" onclick="DM._configToggleSession(${i})">○ Prep only</button>`;
        return `<div class="dm-config-cat-row" draggable="true" data-cat-index="${i}">
            <span class="dm-config-drag">≡</span>
            <span class="dm-config-cat-name" id="dm-cat-name-${i}">${esc(cat.name)}</span>
            ${countTxt}
            ${pill}
            <button type="button" class="dm-btn-sm" onclick="DM._configRename(${i})">Rename</button>
            <button type="button" class="dm-btn-icon" onclick="DM._configDeleteCat(${i}, this)" title="Delete">✕</button>
        </div>`;
    }).join('');

    const today = new Date().toISOString().slice(0, 10);

    el.innerHTML = `
        <section class="dm-config-section">
            <h2 class="dm-section-title">Categories</h2>
            <div id="dm-config-cat-list" class="dm-config-cat-list">
                ${catRows}
            </div>
            <div class="dm-config-cat-add">
                <button type="button" class="btn-primary" onclick="DM._configAddCat()">+ Add Category</button>
            </div>
        </section>
        <section class="dm-config-section">
            <h2 class="dm-section-title">Tab Filters</h2>
            <div class="dm-config-tab-filters">
                ${['items', 'monsters', 'places', 'scenarios'].map(type => {
                    const cats = loadCategories();
                    const visible = _sessionMode ? cats.filter(c => c.sessionVisible) : cats;
                    const cur = _catFilter[type] || '';
                    const label = type.charAt(0).toUpperCase() + type.slice(1);
                    return `<div class="dm-config-filter-row">
                        <span class="dm-config-filter-label">${label}</span>
                        ${buildCustomSelect('', [{value:'',label:'All'}].concat(visible.map(c=>({value:c.name,label:c.name}))), cur, `DM._setCatFilter('${type}', this.value)`)}
                    </div>`;
                }).join('')}
            </div>
        </section>
        ${_renderConfigRulesSection()}
        <section class="dm-config-section">
            <h2 class="dm-section-title">Campaign</h2>
            <div class="dm-config-campaign">
                <div class="dm-config-campaign-item">
                    <div>
                        <div class="dm-config-campaign-label">Download campaign</div>
                        <div class="dm-config-campaign-desc">Save all campaign data and characters to a JSON file.<br>Filename: moros-campaign-${today}.json</div>
                    </div>
                    <button type="button" class="btn-primary" onclick="DM.download()">↓ Download</button>
                </div>
                <div class="dm-config-campaign-item">
                    <div>
                        <div class="dm-config-campaign-label">Upload campaign</div>
                        <div class="dm-config-campaign-desc">Load a campaign file. You can merge new entries into the current data or replace everything.</div>
                    </div>
                    <button type="button" class="btn-secondary" onclick="DM.upload()">↑ Upload</button>
                </div>
                <div class="dm-config-campaign-item dm-config-danger">
                    <div>
                        <div class="dm-config-campaign-label">Danger zone</div>
                        <div class="dm-config-campaign-desc">Wipe all campaign data from this browser. This cannot be undone. Download first.</div>
                    </div>
                    <div id="dm-wipe-zone">
                        <button type="button" class="dm-btn-danger" onclick="DM._wipeRequest(this)">Wipe campaign…</button>
                    </div>
                </div>
            </div>
        </section>`;
    _initCatDrag();
}

let _dragSrcIndex = null;

function _initCatDrag() {
    const list = document.getElementById('dm-config-cat-list');
    if (!list) return;
    list.querySelectorAll('.dm-config-cat-row[draggable]').forEach(row => {
        row.addEventListener('dragstart', e => {
            _dragSrcIndex = parseInt(row.dataset.catIndex, 10);
            e.dataTransfer.effectAllowed = 'move';
            row.classList.add('dm-config-dragging');
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dm-config-dragging');
            list.querySelectorAll('.dm-config-cat-row').forEach(r => r.classList.remove('dm-config-drag-over'));
        });
        row.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            list.querySelectorAll('.dm-config-cat-row').forEach(r => r.classList.remove('dm-config-drag-over'));
            row.classList.add('dm-config-drag-over');
        });
        row.addEventListener('drop', e => {
            e.preventDefault();
            const destIndex = parseInt(row.dataset.catIndex, 10);
            if (_dragSrcIndex === null || _dragSrcIndex === destIndex) return;
            const cats = loadCategories();
            const [moved] = cats.splice(_dragSrcIndex, 1);
            cats.splice(destIndex, 0, moved);
            saveCategories(cats);
            _dragSrcIndex = null;
            renderConfig();
            _rerenderAll();
        });
    });
}

function _configToggleSession(i) {
    const cats = loadCategories();
    if (!cats[i]) return;
    cats[i] = { ...cats[i], sessionVisible: !cats[i].sessionVisible };
    saveCategories(cats);
    renderConfig();
    _rerenderAll();
}

function _configRename(i) {
    const span = document.getElementById(`dm-cat-name-${i}`);
    if (!span || span.querySelector('input')) return;
    const cur = span.textContent.trim();
    span.innerHTML = `<input class="dm-input dm-config-rename-input" type="text" value="${esc(cur)}" autocomplete="off">
        <button type="button" class="dm-btn-sm" onclick="DM._configRenameConfirm(${i}, this)">Save</button>
        <button type="button" class="dm-btn-sm" onclick="DM._configRenameCancel(${i}, this)">Cancel</button>`;
    span.querySelector('input').focus();
}

function _configRenameConfirm(i, btn) {
    const span = btn.closest(`#dm-cat-name-${i}`);
    const input = span.querySelector('input');
    const newName = input ? input.value.trim().toLowerCase() : '';
    if (!newName) return;
    const cats = loadCategories();
    if (!cats[i]) return;
    const oldName = cats[i].name;
    // Update all entries that use the old name
    ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
        st[k].forEach(e => { if (e.category === oldName) e.category = newName; });
        persist(k);
    });
    cats[i] = { ...cats[i], name: newName };
    saveCategories(cats);
    renderConfig();
    _rerenderAll();
}

function _configRenameCancel() {
    renderConfig();
}

function _configDeleteCat(i, btnEl) {
    const cats = loadCategories();
    if (!cats[i]) return;
    const cat = cats[i];
    const count = ['contacts', 'items', 'monsters', 'places', 'scenarios']
        .reduce((n, k) => n + st[k].filter(e => e.category === cat.name).length, 0);
    const row = btnEl.closest('.dm-config-cat-row');
    if (row.querySelector('.dm-delete-label')) return; // already confirming
    let msg = count > 0 ? `${count} entr${count === 1 ? 'y' : 'ies'} use "${esc(cat.name)}"` : `Delete "${esc(cat.name)}"?`;
    if (cat.sessionVisible && count > 0) msg += ` — will be hidden in session mode`;
    row.innerHTML = `<span class="dm-delete-label">${msg}. Delete?</span>
        <button type="button" class="dm-btn-sm dm-btn-confirm-delete" onclick="DM._configDeleteCatConfirm(${i})">Delete</button>
        <button type="button" class="dm-btn-sm" onclick="DM._configDeleteCatCancel()">Cancel</button>`;
}

function _configDeleteCatConfirm(i) {
    const cats = loadCategories();
    if (!cats[i]) return;
    cats.splice(i, 1);
    saveCategories(cats);
    renderConfig();
    _rerenderAll();
}

function _configDeleteCatCancel() {
    renderConfig();
}

function _configAddCat() {
    const list = document.getElementById('dm-config-cat-list');
    if (!list || list.querySelector('.dm-config-add-row')) return;
    const row = document.createElement('div');
    row.className = 'dm-config-cat-row dm-config-add-row';
    row.innerHTML = `<span class="dm-config-drag">≡</span>
        <input class="dm-input dm-config-rename-input" type="text" placeholder="Category name…" autocomplete="off">
        <button type="button" class="dm-btn-sm" onclick="DM._configAddCatConfirm(this)">Add</button>
        <button type="button" class="dm-btn-sm" onclick="DM._configAddCatCancel(this)">Cancel</button>`;
    list.appendChild(row);
    row.querySelector('input').focus();
}

function _configAddCatConfirm(btn) {
    const row = btn.closest('.dm-config-add-row');
    const input = row.querySelector('input');
    const name = input ? input.value.trim().toLowerCase() : '';
    if (!name) { row.remove(); return; }
    addCategory(name);
    renderConfig();
    _rerenderAll();
}

function _configAddCatCancel(btn) {
    btn.closest('.dm-config-add-row').remove();
}

function _wipeRequest(btn) {
    const zone = document.getElementById('dm-wipe-zone');
    if (!zone) return;
    zone.innerHTML = `<span class="dm-delete-label">This will delete everything. Are you sure?</span>
        <button type="button" class="dm-btn-sm dm-btn-confirm-delete" onclick="DM._wipeConfirm()">Confirm wipe</button>
        <button type="button" class="dm-btn-sm" onclick="DM._wipeCancel()">Cancel</button>`;
}

function _wipeCancel() {
    const zone = document.getElementById('dm-wipe-zone');
    if (zone) zone.innerHTML = `<button type="button" class="dm-btn-danger" onclick="DM._wipeRequest(this)">Wipe campaign…</button>`;
}

function _wipeConfirm() {
    ['contacts', 'items', 'monsters', 'places', 'scenarios'].forEach(k => {
        st[k] = [];
        persist(k);
    });
    localStorage.removeItem(LS.chars);
    renderContacts();
    renderItems();
    renderMonsters();
    renderPlaces();
    renderScenarios();
    renderConfig();
}

function _rerenderAll() {
    renderItems();
    renderMonsters();
    renderPlaces();
    renderScenarios();
    renderContacts();
}

function _toggleSessionMode() {
    _sessionMode = !_sessionMode;
    localStorage.setItem('moros-dm-session-mode', _sessionMode);
    const btn = document.getElementById('dm-session-toggle');
    if (btn) {
        btn.textContent = _sessionMode ? 'Session' : 'Prep';
        btn.className = _sessionMode ? 'btn-primary' : 'btn-secondary';
    }
    document.getElementById('app')?.classList.toggle('dm-session-mode', _sessionMode);
    _rerenderAll();
}

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
    window.addEventListener('beforeunload', e => {
        if (_dirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    document.addEventListener('input',  e => { if (e.target.closest('.dm-form-pane')) _setDirty(); });
    document.addEventListener('change', e => { if (e.target.closest('.dm-form-pane')) _setDirty(); });
    loadAll();
    const btn = document.getElementById('dm-session-toggle');
    if (btn) {
        btn.textContent = _sessionMode ? 'Session' : 'Prep';
        btn.className = _sessionMode ? 'btn-primary' : 'btn-secondary';
    }
    if (_sessionMode) document.getElementById('app')?.classList.add('dm-session-mode');
    renderContacts();
    renderItems();
    renderMonsters();
    renderPlaces();
    renderScenarios();
    _refreshSearchScenarios();
    renderItemRules();
    renderBestiary();
    renderPowers();
    renderConfig();
}

window.DM = {
    showTab,
    newContact,  editContact,  deleteContact,  saveContact,
    newItem,     editItem,     deleteItem,     saveItem,
    newMonster,  editMonster,  deleteMonster,  saveMonster,
    newPlace,    editPlace,    deletePlace,    savePlace,
    newScenario, editScenario, deleteScenario, saveScenario, _markPlayed,
    download, upload,
    _catChanged, _catAddConfirm, _catAddCancel, _setCatFilter,
    _setPowerFilter, _clearPowerFilter,
    _setBestiaryFilter, _copyToMonsters, _duplicateMonster,
    _setItemRulesFilter, _copyToSpecialItems,
    _editRulesEntry, _saveRulesEntry, _cancelRulesEntry,
    _resetRulesEntry, _resetAllRules,
    _searchInput, _searchGoTab, _searchClose, _refreshSearchScenarios,
    _pickerFilter, _pickerAdd, _pickerRemove,
    _openEditor, _closeForm, _monsterOriginChanged, _itemOriginChanged,
    _addBonus, _removeBonus, _setBonusField,
    _addAttack, _removeAttack, _setAtkField,
    _addFaction, _removeFaction, _setFactionName,
    _addStruggle, _removeStruggle, _setStruggleDesc,
    _addScene, _removeScene, _toggleScene,
    _addChallenge, _removeChallenge,
    _addReward, _removeReward, _setRewardType,
    _numPickerOpen, _numPickerSet, _numPickerClose,
    _statPickerOpen, _statPickerClose,
    _csOpen, _csPick, _csClose, _csRefreshBtn,
    _statStep, _toggleHistory,
    _requestDelete, _cancelDelete, _doDelete,
    _setDirty,
    renderConfig,
    _configToggleSession,
    _configRename,
    _configRenameConfirm,
    _configRenameCancel,
    _configDeleteCat,
    _configDeleteCatConfirm,
    _configDeleteCatCancel,
    _configAddCat,
    _configAddCatConfirm,
    _configAddCatCancel,
    _wipeRequest,
    _wipeCancel,
    _wipeConfirm,
    _toggleSessionMode,
};

init();
