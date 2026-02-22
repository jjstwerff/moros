import * as Logic from './logic.js';
import { DATA } from './data.js';
import { loadCategories, addCategory } from './categories.js';

// ──────────────────────────────── STATE ────────────────────────────────
let activeCharIdx = 0;
let _rosterCatFilter = '';

// ─────────────────────────────── LOCAL STORAGE ─────────────────────────
function saveToLocalStorage() {
    try {
        localStorage.setItem('moros-characters', Logic.toJSON());
        localStorage.setItem('moros-active-char', activeCharIdx.toString());
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

export function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('moros-characters');
        const savedIdx = localStorage.getItem('moros-active-char');
        if (saved) {
            Logic.fromJSON(saved);
            activeCharIdx = savedIdx ? parseInt(savedIdx, 10) : 0;
            if (activeCharIdx >= Logic.noCharacters())
                activeCharIdx = 0;
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        Logic.fromJSON("[]");
        activeCharIdx = 0;
    }
}

// ─────────────────────────────── BACKUP ────────────────────────────────
export function downloadRoster() {
    const json = Logic.toJSON();
    if (json === '[]' || !json) {
        alert('No characters in the roster to download.');
        return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `moros-roster-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function uploadRoster() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            let text = ev.target.result;
            if (text instanceof ArrayBuffer)
                text = String.fromCharCode.apply(null, new Uint16Array(text));
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                alert('Failed to load roster: File does not contain a roster array.');
                return;
            }
            const merge = confirm(
                `Found ${parsed.length} character(s) in the file.\n\n` +
                `Click OK to merge with your current roster, or Cancel to replace it entirely.`
            );
            if (merge) {
                const current = JSON.parse(Logic.toJSON());
                const names = new Set(current.map(c => c.name));
                let added = 0;
                parsed.forEach(c => {
                    if (!names.has(c.name)) {
                        current.push(c);
                        names.add(c.name);
                        added++;
                    }
                });
                Logic.fromJSON(JSON.stringify(current));
                alert(`Merged: ${added} new character(s) added.`);
            } else {
                return;
            }
            activeCharIdx = 0;
            saveToLocalStorage();
            renderRoster();
            showTab('roster');
        };
        reader.readAsText(file);
    };
    input.click();
}

// ─────────────────────────────── RENDER RULES ──────────────────────────
export function renderRules() {
    if (typeof document === "undefined")
        return;
    const c = document.getElementById('rules-container');

    // ── Game header ───────────────────────────────────────────────────────
    const headerPart = `
    <div class="rules-game-header">
        <h1 class="rules-game-title">${DATA.game.title}</h1>
        <div class="rules-game-tagline">${DATA.game.tagline}</div>
        <div class="rules-game-desc">${DATA.game.description.map(p => `<p>${p}</p>`).join('')}</div>
    </div>`;

    // ── Rule cards ────────────────────────────────────────────────────────
    const rulePart = `<div class="rules-grid">${
        DATA.rules.map(r => `
        <div class="rule-card">
          <h3>${r.about}</h3>
          ${r.text.join('<br>')}
        </div>`).join('')
    }</div>`;

    // ── Statistics ────────────────────────────────────────────────────────
    const statsPart = `
    <div class="rules-section-header">Statistics</div>
    <div class="rules-stats-grid">${
        DATA.statistics.map(s => {
            const actions = DATA.actions.filter(a => a.power === s.action);
            return `
            <div class="rules-stat-block">
                <div class="rules-stat-header">
                    <span class="rules-stat-name">${s.name}</span>
                    <span class="rules-stat-action">${s.action}</span>
                </div>
                <div class="rules-stat-desc">${s.description}</div>
                <div class="rules-scenarios">
                    ${s.scenarios.map(sc => `
                    <div class="rules-scenario-row">
                        <span class="rules-scenario-label">${sc.name}</span>
                        <span class="rules-scenario-text">${sc.description}</span>
                    </div>`).join('')}
                </div>
                ${actions.length > 0 ? `
                <div class="rules-actions">
                    <div class="rules-actions-title">Actions</div>
                    ${actions.map(a => `
                    <div class="rules-action-row">
                        <div class="rules-action-header">
                            <span class="rules-action-name">${a.name}</span>
                            ${a.needs ? `<span class="rules-action-needs">${a.needs}</span>` : ''}
                        </div>
                        <div class="rules-action-desc">${a.description}</div>
                    </div>`).join('')}
                </div>` : ''}
            </div>`;
        }).join('')
    }</div>`;

    // ── Default cards ─────────────────────────────────────────────────────
    const cardsPart = `
    <div class="rules-section-header">Default Cards</div>
    <div class="cards-grid">${
        DATA.cards.map(card => `
            <div class="card-item">
                <div class="card-source">${card.name}</div>
                <div class="card-name">${card.statistics.map(s => Logic.statAction(s)).join(' / ')}</div>
                <div class="card-stats">${card.statistics.join(' · ')}</div>
                <div class="card-stats">Special: ${card.special}</div>
            </div>`).join('')
    }</div>`;

    c.innerHTML = headerPart + rulePart + statsPart + cardsPart;
}

// ─────────────────────────────── RENDER PLACES ──────────────────────────
export function renderPlaces(forceGrid = false) {
    if (typeof document === "undefined")
        return;
    const g = document.getElementById('place-grid');
    if (Logic.state.place && !forceGrid) {
        const p = DATA.places.find(pl => pl.name === Logic.state.place);
        g.innerHTML = `
            <div class="selected-place-card">
                <div class="selected-info">
                    <div class="place-name">${p.name}</div>
                    <div class="place-desc">${p.description}</div>
                </div>
                <button class="btn-secondary btn-change-place" onclick="openPlaceGrid()">Change</button>
            </div>`;
    } else {
        g.innerHTML = DATA.places.map(p => `
            <div class="place-card ${Logic.state.place === p.name ? 'selected' : ''}" onclick="selectPlace('${p.name}')">
                <div class="place-name">${p.name}</div>
                <div class="place-desc">${p.description}</div>
            </div>
        `).join('');
    }
}

export function openPlaceGrid() {
    renderPlaces(true);
}

export function selectPlace(name) {
    Logic.state.place = name;
    renderPlaces();
}

// ─────────────────────────────── RENDER RACE ───────────────────────────
export function renderRaceGrid(forceGrid = false) {
    const g = document.getElementById('race-grid');
    if (Logic.state.race && !forceGrid) {
        g.className = '';
        const r = DATA.races.find(r => r.name === Logic.state.race);
        g.innerHTML = `
            <div class="hint-text">Beware, changing a different race will remove the current progression and items.</div>
            <div class="selected-race-card">
                <div class="selected-info">
                    <div class="race-name">${r.name}</div>
                    <div class="race-desc">${r.description}</div>
                </div>
                <button class="btn-secondary btn-change-place" onclick="renderRaceGrid(true)">Change</button>
            </div>`;
    } else {
        g.className = 'race-grid';
        g.innerHTML = DATA.races.map(r => `
        <div class="race-card ${Logic.state.race === r.name ? 'selected' : ''}" onclick="selectRace('${r.name}')">
          <div class="race-name">${r.name}</div>
          <div class="race-desc">${r.description}</div>
        </div>
      `).join('');
    }
}

export function selectRace(name) {
    Logic.state.race = name;
    renderRaceGrid(true);
    renderRacePreview(name);
    renderProgression();
}

function renderRacePreview(name) {
    const race = DATA.races.find(r => r.name === name);
    const preview = document.getElementById('race-preview');
    const list = document.getElementById('powers-preview-list');
    if (!race) { preview.classList.remove('visible'); return; }
    preview.classList.add('visible');
    list.innerHTML = race.powers.map(pname => {
        const pw = Logic.getPower(pname);
        const stats = pw ? pw.statistics.map(Logic.statAbbr).join(' · ') : '';
        const special = pw ? pw.special : '';
        const desc = pw ? pw.description : '';
        return `<div class="power-chip">
            <div><strong>${pname}</strong> <span class="power-stats">(${stats}) ${special}</span></div>
            ${desc ? `<div class="power-desc">${desc}</div>` : ''}
        </div>`;
    }).join('');
}

// ─────────────────────────────── PROGRESSION ───────────────────────────
export function renderProgression() {
    if (typeof document === "undefined")
        return;
    const list = document.getElementById('slot-list');
    let d = '<div class="slot"><div class="slot-content">';
    d += DATA.statistics.map(s => `<div class="progres-stat">${s.abbreviation}: ${Logic.stat(s.abbreviation)}</div>`).join('');
    d += `<div class="progres-stat">XP: ${Logic.state.xp}</div>`;
    d += '</div></div>';
    for (let i = 0; i < Logic.state.progressions; i++) {
        const p = Logic.state.progres(i);
        const possible = Logic.state.validProgress(p.type, p.name) === undefined;
        d += `<div class="slot">
      <div class="slot-content">
        <div class="slot-type-label slot-type-${p.type}">${p.type}</div>
        <div class="slot-name">${p.name} : ${p.level}</div>
        <div class="slot-name">XP : ${p.xp}</div>
        <div class="slot-name">Statistic : ${Logic.statName(p.stat)}</div>
        <div>
            <button class="btn-slot-edit ${possible ? '': 'btn-disabled'}" onclick="pickChoice('${p.type}', '${p.name}')">+ Learn</button>
        </div>
        ${ i + 1 < Logic.state.progressions ? '' : '<div><button class="btn-slot-edit" onclick="dropProgression()">✕ Remove</button></div>' }
      </div>
    </div>`;
    }
    const power = Logic.state.validProgress('power', null);
    const spec = Logic.state.validProgress('specialization', null);
    const bg = Logic.state.validProgress('background', null);
    d += `<div class="slot">
        <div class="slot-content">
            <div><button class="btn-slot-edit ${power === undefined ? '' : 'btn-disabled'}" onclick="openAddPower()">+ Add power</button></div>
            <div><button class="btn-slot-edit ${spec === undefined ? '' : 'btn-disabled'}" onclick="openAddSpecial()">+ Add specialization</button></div>
            <div><button class="btn-slot-edit ${bg === undefined ? '' : 'btn-disabled'}" onclick="openAddBackground()">+ Add background</button></div>
    </div></div>`;
    list.innerHTML = d;
    renderItemsSection();
}

export function dropProgression() {
    Logic.state.dropProgression();
    renderProgression();
}

// ─────────────────────────────── MODAL ─────────────────────────────────
export function openAddPower() {
    document.getElementById('modal-title').textContent = `Choose Power`;
    const list = document.getElementById('choice-list');
    if (!Logic.state.race) {
        list.innerHTML = '<div class="modal-hint">Choose a race first to unlock powers.</div>';
        return;
    }
    const race = DATA.races.find(r => r.name === Logic.state.race);
    list.innerHTML = race.powers.map(pname => {
        const pw = Logic.getPower(pname);
        return `<div class="choice-item" onclick="pickChoice('power','${pname}')">
        <div>
          <div class="choice-item-name">${pname}</div>
          <div class="choice-item-meta">Stats: ${pw.statistics.join(', ')} · Special: ${pw.special}</div>
        </div>
      </div>`;
    }).join('');
    document.getElementById('choice-modal').classList.add('open');
}

export function openAddBackground() {
    document.getElementById('modal-title').textContent = `Choose Background`;
    const list = document.getElementById('choice-list');
    list.innerHTML = DATA.backgrounds.map(bg => `
      <div class="choice-item" onclick="pickChoice('background','${bg.name}')">
        <div>
          <div class="choice-item-name">${bg.name}</div>
          <div class="choice-item-meta">Stats: ${bg.statistics.join(', ')} · Specs: ${bg.specializations.join(', ')}</div>
        </div>
      </div>`).join('');
    document.getElementById('choice-modal').classList.add('open');
}

export function openAddSpecial() {
    document.getElementById('modal-title').textContent = `Choose Specialization`;
    const list = document.getElementById('choice-list');
    const unlocked = Logic.state.unlockedSpecs();
    if (unlocked.length === 0) {
        list.innerHTML = '<div class="modal-hint">Learn a background first to unlock specializations.</div>';
        return;
    }
    list.innerHTML = unlocked.map(spec => {
        const stat = DATA.specToStat[spec];
        const open = Logic.stat(spec) < Logic.state.bgLevel(spec);
        const extra = open ? `class="choice-item" onclick="pickChoice('specialization','${spec}')"` : `class="choice-item disabled"`;
        return `<div ${extra}>
        <div>
          <div class="choice-item-name">${spec}</div>
          <div class="choice-item-meta">Improves: ${stat || '?'}${open ? '' : '   Learn background further to unlock'}</div>
        </div>
      </div>`;
    }).join('');
    document.getElementById('choice-modal').classList.add('open');
}

export function pickChoice(type, name) {
    Logic.state.learn(type, name);
    closeModal();
    renderProgression();
}

export function closeModal() {
    document.getElementById('choice-modal').classList.remove('open');
}

// ─────────────────────────────── ITEMS ─────────────────────────────────
function renderItemsSection() {
    const allowance = Logic.state.itemAllowance();
    const container = document.getElementById('items-container');

    if (allowance.size === 0) {
        container.innerHTML = '<div class="hint-text">Choose a background in your progression to unlock their unique items.</div>';
    } else {
        let r = '';
        allowance.forEach((slots, bgName) => {
            const bg = Logic.getBg(bgName);
            if (bg) {
                r += `<div class="item-group"><div class="section-title-sm">${bgName} <span class="section-title-count">(up to ${slots} items)</span></div>`;
                bg.items.map(item_name => {
                    const selected = Logic.state.items.has(item_name);
                    r += `<div class="item-row"><div class="item-row-name">${item_name}</div>
              <div class="item-row-meta">${getItemMeta(item_name)}</div>
              <input type="checkbox" class="item-check" ${selected ? 'checked' : ''} onchange="toggleItem('${item_name}',this)">
              </div>`;
                });
                r += '</div>';
            }
        });
        container.innerHTML = `<div class="item-sections">${r}</div>`;
    }

    // unrestricted items
    const unrestrictedItems = DATA.items.filter(i => i.restricted === false);
    const uContainer = document.getElementById('unrestricted-container');
    uContainer.innerHTML = `<div class="item-group item-group--basic">
    <div class="section-title-sm">Basic Supplies <span class="section-title-count">(once each)</span></div>
    ${unrestrictedItems.map(item => {
        const sel = Logic.state.items.has(item.name);
        return `<div class="item-row">
        <div class="item-row-name">${item.name}</div>
        <div class="item-row-meta">${getItemMeta(item.name)}</div>
        <input type="checkbox" class="item-check" ${sel?'checked':''} onchange="toggleItem('${item.name}',this)">
      </div>`;
    }).join('')}
  </div>`;
}

function getItemMeta(name) {
    const item = Logic.getItem(name);
    if (!item) return '';
    const parts = [];
    if (item.statistics) parts.push(item.statistics.join(', '));
    if (item.special) parts.push(item.special);
    if (item.bulk) parts.push(`bulk ${item.bulk}`);
    if (item.description) parts.push(item.description);
    return parts.join(' · ');
}

export function toggleItem(itemName, checkbox) {
    if (checkbox.checked) {
        try {
            Logic.state.addItem(itemName);
        } catch (e) {
            checkbox.checked = false;
            alert(e);
        }
    } else {
        Logic.state.removeItem(itemName);
    }
}

// ─────────────────────────────── CATEGORIES ────────────────────────────
function refreshCategorySelect(selected) {
    const sel = document.getElementById('char-category');
    if (!sel) return;
    const cats = loadCategories();
    sel.innerHTML = '<option value="">— none —</option>' +
        cats.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('') +
        '<option value="__add__">Add category…</option>';
    if (selected) sel.value = selected;
}

export function initCategories() {
    refreshCategorySelect('');
}

function charCategoryChanged() {
    const sel = document.getElementById('char-category');
    if (!sel || sel.value !== '__add__') return;
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
window.charCategoryChanged = charCategoryChanged;

export function setRosterFilter(val) {
    _rosterCatFilter = val;
    renderRoster();
}
window.setRosterFilter = setRosterFilter;

// ─────────────────────────────── SAVE ──────────────────────────────────
export function saveCharacter() {
    Logic.state.name = document.getElementById('char-name').value.trim();
    Logic.state.gender = document.getElementById('char-gender').value.trim();
    Logic.state.desc = document.getElementById('char-desc').value.trim();
    const catEl = document.getElementById('char-category');
    Logic.state.category = (catEl && catEl.value !== '__add__') ? catEl.value : '';

    if (!Logic.state.name) { alert('Please enter a character name.'); return; }
    activeCharIdx = Logic.saveState(Logic.state.name);

    saveToLocalStorage();
    document.getElementById('save-notice').textContent = `✦ ${Logic.state.name} saved to roster.`;
    setTimeout(() => document.getElementById('save-notice').textContent = '', 3000);
    renderRoster();
    showTab('roster');
}

export function resetCreate() {
    Logic.initState();
    document.getElementById('char-name').value = '';
    document.getElementById('char-gender').value = '';
    document.getElementById('char-desc').value = '';
    refreshCategorySelect('');
    renderPlaces();
    renderRaceGrid();
    document.getElementById('race-preview').classList.remove('visible');
    renderProgression();
}

// ─────────────────────────────── ROSTER ────────────────────────────────
export function renderRoster() {
    const empty = document.getElementById('roster-empty');
    const tabs = document.getElementById('char-tabs');
    const display = document.getElementById('char-display');
    const filterEl = document.getElementById('roster-filter');

    if (Logic.noCharacters() === 0) {
        empty.style.display = 'block';
        display.innerHTML = '';
        if (filterEl) filterEl.innerHTML = '';
        tabs.innerHTML = '<button class="btn-secondary" onClick="uploadRoster()" title="Load roster from a JSON file">⬆ Upload</button>';
        return;
    }
    empty.style.display = 'none';

    // Build filter bar
    if (filterEl) {
        const cats = loadCategories();
        filterEl.innerHTML = `<div class="roster-filter-bar">
            <span class="roster-filter-label">Filter:</span>
            <select onchange="setRosterFilter(this.value)">
                <option value="" ${_rosterCatFilter === '' ? 'selected' : ''}>All</option>
                ${cats.map(c => `<option value="${c}" ${_rosterCatFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    // Determine visible characters
    const visible = [];
    for (let i = 0; i < Logic.noCharacters(); i++) {
        const cat = Logic.charCategory(i);
        if (!_rosterCatFilter || cat === _rosterCatFilter) visible.push(i);
    }

    // If active char is hidden, show first visible instead
    if (_rosterCatFilter && !visible.includes(activeCharIdx)) {
        if (visible.length > 0) activeCharIdx = visible[0];
    }

    let h = '';
    for (let i = 0; i < Logic.noCharacters(); i++) {
        const cat = Logic.charCategory(i);
        if (_rosterCatFilter && cat !== _rosterCatFilter) continue;
        h += `<button class="char-tab-btn ${i === activeCharIdx ? 'active' : ''}" onclick="selectChar(${i})">${Logic.name(i)}</button>`;
    }
    h += '<button class="char-tab-btn" onclick="editChar(null)">+ Add new</button>';
    h += '<button class="btn-secondary" onClick="downloadRoster()" title="Save roster to a JSON file">⬇ Download</button>';
    h += '<button class="btn-secondary" onClick="uploadRoster()" title="Load roster from a JSON file">⬆ Upload</button>';
    tabs.innerHTML = h;

    if (visible.length > 0) {
        Logic.loadCharacter(activeCharIdx);
        renderCharSheet();
    } else {
        display.innerHTML = '<div class="hint-text">No characters match this filter.</div>';
    }
}

export function selectChar(i) {
    activeCharIdx = i;
    saveToLocalStorage();
    renderRoster();
}

export function editChar(i) {
    if (i !== null) {
        Logic.loadCharacter(i);
        document.getElementById('char-name').value = Logic.state.name;
        document.getElementById('char-gender').value = Logic.state.gender;
        document.getElementById('char-desc').value = Logic.state.desc;
        refreshCategorySelect(Logic.state.category);
    } else {
        resetCreate();
    }
    renderPlaces();
    renderRaceGrid();
    renderRacePreview(Logic.stat.race);
    renderProgression();
    showTab('create');
}

export function removeChar(i) {
    if (confirm(`Are you sure you want to delete ${Logic.name(i)}?`)) {
        Logic.removeChar(i);
        activeCharIdx = i-1;
        renderRoster();
        renderCharSheet()
    }
}

// ─────────────────────────────── TAB NAV ───────────────────────────────
export function showTab(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
    const tabs = ['roster', 'create', 'rules'];
    document.querySelectorAll('.nav-tab')[tabs.indexOf(id)].classList.add('active');
}

export function renderCharSheet() {
    if (Logic.noCharacters() === 0) {
        document.getElementById('char-display').innerHTML = '';
        return;
    }
    document.title = Logic.state.name;
    document.getElementById('char-display').innerHTML = `
    <div class="sheet">
      <div class="sheet-header">
        <div>
          <button class="btn-secondary" onclick="editChar(${Logic.charIndex(Logic.state.name)})">✎ Edit</button>
          <div class="sheet-name">${Logic.state.name}</div>
          <div class="sheet-meta">${Logic.state.gender ? Logic.state.gender + ' · ' : ''}${Logic.state.race || ''}${Logic.state.place ? ' · ' + Logic.state.place : ''}</div>
          ${Logic.state.desc ? `<div class="sheet-desc">${Logic.state.desc}</div>` : ''}
        </div>
      </div>

      <div class="section-title">Statistics</div>
      <div class="stats-grid">
        ${DATA.statistics.map(s => `
          <div class="stat-box">
            <span class="stat-abbr">${s.name}</span>
            <button class="stat-info-btn" onclick="showStatInfo('${s.abbreviation}')" title="More info">?</button>
            <span class="stat-val">${Logic.stat(s.abbreviation) || 1}</span>
            <div class="stat-name">${s.action}</div>
          </div>`).join('')}
      </div>

      <div class="sheet-cols">
        <div>
          <div class="sheet-section">
            <div class="sheet-section-title">Backgrounds</div>
            <ul class="sheet-list">
                ${DATA.backgrounds.map(b => Logic.stat(b.name) > 0 ? `<li>${b.name}: ${Logic.stat(b.name)}</li>` : '').join('')}
            </ul>
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Specializations</div>
            <ul class="sheet-list">
                ${Object.keys(DATA.specToStat).map(s=> Logic.stat(s) > 0 ? `<li>${s}: ${Logic.stat(s)}</li>` : '').join('')}
            </ul>
          </div>
          <div class="sheet-section">
            <div class="sheet-section-title">Powers</div>
            <ul class="sheet-list">
                ${DATA.powers.map(p => Logic.stat(p.name) > 0 ? `<li>${p.name}: ${Logic.stat(p.name)} · ${p.special} · ${p.description}</li>` : '').join('')}
            </ul>
          </div>
        </div>
        <div>
          <div class="sheet-section">
            <div class="sheet-section-title">Equipment</div>
            <ul class="sheet-list">
                ${DATA.items.map(i => Logic.state.items.has(i.name) ? `<li>${i.name}${i.bulk !== undefined ?' · bulk: ' + i.bulk : ''}${i.description ? ' · ' + i.description : ''}</li>` : '').join('') }
            </ul>
          </div>
        </div>
      </div>

      <div class="divider"></div>
      <div class="section-title">Specialization Actions !! A work in progress, mostly for inspiration !! </div>
      ${(() => {
        const learnedSpecs = Object.keys(DATA.specToStat).filter(s => Logic.stat(s) > 0);
        if (learnedSpecs.length === 0) {
            return '<div class="hint-text">Learn a specialization to unlock actions.</div>';
        }
        return learnedSpecs.map(spec => {
            const actions = DATA.actions.filter(a => a.power === spec);
            if (actions.length === 0) return '';
            return `
                <div class="spec-actions-group">
                  <div class="spec-actions-title">${spec} <span class="spec-actions-level">lvl ${Logic.stat(spec)}</span></div>
                  <div class="spec-actions-list">
                    ${actions.map(a => `
                      <div class="spec-action-row">
                        <div class="spec-action-name">${a.name}</div>
                        ${a.needs ? `<div class="spec-action-needs">${a.needs}</div>` : ''}
                        <div class="spec-action-desc">${a.description}</div>
                      </div>`).join('')}
                  </div>
                </div>`;
        }).join('');
    })()}

      <div class="divider"></div>
      <div class="section-title" id="cards-title">Cards</div>
      <div class="cards-grid">
        ${Logic.state.cards.map(c => `
          <div class="card-item">
            <div class="card-source">${c.source}</div>
            <div class="card-name">${c.stats.map(s => Logic.statAction(s)).join(' / ')}</div>
            <div class="card-stats">${c.stats.join(' · ')}</div>
            <div class="card-stats">Special: ${c.special}</div>
          </div>`).join('')}
      </div>

      <div class="btn-row btn-row--sheet">
        <button class="btn-secondary" onclick="editChar(${Logic.charIndex(Logic.state.name)})">✎ Edit</button>
        <button class="btn-secondary" onclick="removeChar(${Logic.charIndex(Logic.state.name)})">✕ Remove</button>
      </div>
    </div>`;
}

// ─────────────────────────────── STAT INFO MODAL ───────────────────────
export function showStatInfo(abbr) {
    const s = DATA.statistics.find(s => s.abbreviation === abbr);
    if (!s) return;

    const actions = DATA.actions.filter(a => a.power === s.action);

    document.getElementById('modal-title').textContent = `${s.name} · ${s.action}`;
    const list = document.getElementById('choice-list');

    const scenarioRows = s.scenarios.map(sc =>
        `<div class="stat-info-row">
            <span class="stat-info-scene">${sc.name}</span>
            <span class="stat-info-desc">${sc.description}</span>
        </div>`
    ).join('');

    const actionRows = actions.length > 0
        ? actions.map(a =>
            `<div class="choice-item" style="cursor:default; pointer-events:none;">
                <div>
                    <div class="choice-item-name">${a.name}${a.needs ? `<span class="stat-info-needs"> — ${a.needs}</span>` : ''}</div>
                    <div class="choice-item-meta">${a.description}</div>
                </div>
            </div>`
        ).join('')
        : '<div class="modal-hint">No special actions for this statistic.</div>';

    list.innerHTML = `
        <div class="stat-info-block">
            <div class="stat-info-desc-main">${s.description}</div>
            <div class="stat-info-subtitle">Use in scenarios</div>
            ${scenarioRows}
        </div>
        <div class="stat-info-subtitle" style="margin-top:1rem;">Actions (${s.action})</div>
        ${actionRows}
    `;
    document.getElementById('choice-modal').classList.add('open');
}

window.showTab = showTab;
window.selectRace = selectRace;
window.openPlaceGrid = openPlaceGrid;
window.renderRaceGrid = renderRaceGrid;
window.openAddBackground = openAddBackground;
window.openAddSpecial = openAddSpecial;
window.openAddPower = openAddPower;
window.pickChoice = pickChoice;
window.toggleItem = toggleItem;
window.selectChar = selectChar;
window.editChar = editChar;
window.saveCharacter = saveCharacter;
window.resetCreate = resetCreate;
window.selectPlace = selectPlace;
window.dropProgression = dropProgression;
window.closeModal = closeModal;
window.removeChar = removeChar;
window.downloadRoster = downloadRoster;
window.uploadRoster = uploadRoster;
window.showStatInfo = showStatInfo;