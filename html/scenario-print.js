import * as Logic from './logic.js';
import { DATA } from './data.js';

// ── localStorage keys ───────────────────────────────────────────────────────
const LS = {
    scenarios: 'moros-dm-scenarios',
    contacts:  'moros-dm-contacts',
    monsters:  'moros-dm-monsters',
    places:    'moros-dm-places',
    items:     'moros-dm-items',
    chars:     'moros-characters',
};

function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function esc(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Toggle helpers (global, called from inline onclick) ─────────────────────
window.spToggleCard = function(btn) {
    const card = btn.closest('.sp-card');
    if (!card) return;
    const collapsed = card.classList.toggle('sp-collapsed');
    btn.textContent = collapsed ? '+' : '—';
};

window.spToggleAll = function() {
    const root = document.getElementById('sp-root');
    const cards = root.querySelectorAll('.sp-card');
    const btn = document.getElementById('btn-toggle-all');
    const anyExpanded = [...cards].some(c => !c.classList.contains('sp-collapsed'));
    cards.forEach(card => {
        const toggle = card.querySelector('.sp-toggle');
        if (anyExpanded) {
            card.classList.add('sp-collapsed');
            if (toggle) toggle.textContent = '+';
        } else {
            card.classList.remove('sp-collapsed');
            if (toggle) toggle.textContent = '—';
        }
    });
    btn.textContent = anyExpanded ? '⊕ Expand All' : '⊖ Collapse All';
};

window.spToggleBreak = function(btn) {
    const scene = btn.closest('.sp-scene');
    if (!scene) return;
    const active = scene.classList.toggle('sp-break');
    btn.classList.toggle('active', active);
};

// ── Card builders ───────────────────────────────────────────────────────────
function toggleBtn() {
    return `<button class="sp-toggle no-print" onclick="spToggleCard(this)" title="Collapse/Expand">—</button>`;
}

function charCard(dump) {
    try { Logic.loadDump(dump); } catch { return ''; }

    const name = esc(dump.name);
    const meta = [dump.race, dump.place, dump.category].filter(Boolean).map(esc).join(' · ');

    // Stats — show all stats, highlight those > 1
    const statsHtml = DATA.statistics.map(s => {
        const val = Logic.stat(s.abbreviation);
        return `<div class="sp-stat-cell">
            <span class="sp-stat-abbr">${esc(s.abbreviation)}</span>
            <span class="sp-stat-val">${val}</span>
        </div>`;
    }).join('');

    // Progressions
    const progs = [];
    for (let i = 0; i < Logic.state.progressions; i++) {
        const p = Logic.state.progres(i);
        progs.push({ type: p.type, name: p.name });
    }
    const pillsHtml = progs.map(p => {
        const cls = p.type === 'background' ? 'bg'
                  : p.type === 'power'      ? 'power'
                  : 'spec';
        return `<span class="sp-pill sp-pill--${cls}">${esc(p.name)}</span>`;
    }).join('');

    // Cards
    const cards = Logic.state.cards;
    const cardsHtml = cards.length
        ? `<div class="sp-subsection">
            <div class="sp-subsection-title">Cards</div>
            <div class="sp-pills">${cards.map(c =>
                `<span class="sp-pill sp-pill--power" title="${esc(c.special)}">${esc(c.source)}</span>`
            ).join('')}</div>
           </div>`
        : '';

    // Items
    const items = [...Logic.state.items];
    const itemsHtml = items.length
        ? `<div class="sp-subsection">
            <div class="sp-subsection-title">Items</div>
            <div class="sp-pills">${items.map(i =>
                `<span class="sp-pill sp-pill--item">${esc(i)}</span>`
            ).join('')}</div>
           </div>`
        : '';

    // Description
    const descHtml = dump.desc
        ? `<div class="sp-desc">${esc(dump.desc)}</div>` : '';

    return `
<div class="sp-card" id="char-${esc(dump.name.replace(/\s+/g,'_'))}">
    <div class="sp-card-head">
        ${toggleBtn()}
        <h3>${name}</h3>
        ${meta ? `<span class="sp-card-meta">${meta}</span>` : ''}
    </div>
    <div class="sp-card-body">
        ${descHtml}
        <div class="sp-statgrid">${statsHtml}</div>
        ${pillsHtml ? `<div class="sp-pills" style="margin-top:0.5rem">${pillsHtml}</div>` : ''}
        ${cardsHtml}
        ${itemsHtml}
    </div>
</div>`;
}

function contactCard(c) {
    const meta = [c.gender, c.race, c.faction, c.town].filter(Boolean).map(esc).join(' · ');
    const specs = (c.specializations || []);
    const specsHtml = specs.length
        ? `<div class="sp-subsection">
            <div class="sp-subsection-title">Specializations</div>
            <div class="sp-pills">${specs.map(s =>
                `<span class="sp-pill sp-pill--spec">${esc(s)}</span>`
            ).join('')}</div>
           </div>`
        : '';
    const items = (c.items || []);
    const itemsHtml = items.length
        ? `<div class="sp-subsection">
            <div class="sp-subsection-title">Can Provide</div>
            <div class="sp-pills">${items.map(i =>
                `<span class="sp-pill sp-pill--item">${esc(i)}</span>`
            ).join('')}</div>
           </div>`
        : '';

    return `
<div class="sp-card" id="contact-${esc(c.id)}">
    <div class="sp-card-head">
        ${toggleBtn()}
        <h3>${esc(c.name)}</h3>
        ${meta ? `<span class="sp-card-meta">${meta}</span>` : ''}
    </div>
    <div class="sp-card-body">
        ${c.description ? `<div class="sp-desc">${esc(c.description)}</div>` : ''}
        ${specsHtml}
        ${itemsHtml}
    </div>
</div>`;
}

function monsterCard(m) {
    const meta = [m.category].filter(Boolean).map(esc).join(' · ');

    const statsHtml = DATA.statistics.map(s => {
        const val = (m.stats || {})[s.abbreviation] || 1;
        return `<div class="sp-stat-cell">
            <span class="sp-stat-abbr">${esc(s.abbreviation)}</span>
            <span class="sp-stat-val">${val}</span>
        </div>`;
    }).join('');

    const attacks = (m.attacks || []);
    const attacksHtml = attacks.map(a => {
        const bonusHtml = (a.bonus || []).map(b =>
            `<span class="sp-atk-field"><span class="sp-atk-label">${esc(b.target)}</span> ${b.value >= 0 ? '+' : ''}${b.value}</span>`
        ).join('');
        return `<div class="sp-atk">
            <div class="sp-atk-name">${esc(a.name) || 'Attack'}</div>
            ${a.description ? `<div class="sp-desc" style="font-size:0.88rem;margin-bottom:0.3rem">${esc(a.description)}</div>` : ''}
            <div class="sp-atk-row">
                ${a.damage != null ? `<span class="sp-atk-field"><span class="sp-atk-label">Dmg</span> ${a.damage}</span>` : ''}
                ${a.damageType  ? `<span class="sp-atk-field"><span class="sp-atk-label">Type</span> ${esc(a.damageType)}</span>` : ''}
                ${a.reach       ? `<span class="sp-atk-field"><span class="sp-atk-label">Reach</span> ${esc(a.reach)}</span>` : ''}
                ${bonusHtml}
            </div>
        </div>`;
    }).join('');

    return `
<div class="sp-card">
    <div class="sp-card-head">
        ${toggleBtn()}
        <h3>${esc(m.name)}</h3>
        ${meta ? `<span class="sp-card-meta">${meta}</span>` : ''}
    </div>
    <div class="sp-card-body">
        ${m.description ? `<div class="sp-desc">${esc(m.description)}</div>` : ''}
        <div class="sp-statgrid">${statsHtml}</div>
        ${attacksHtml ? `<div style="margin-top:0.5rem">${attacksHtml}</div>` : ''}
    </div>
</div>`;
}

function placeCard(p) {
    const meta = [p.type, p.category].filter(Boolean).map(esc).join(' · ');

    const factions = (p.factions || []);
    const factionsHtml = factions.length
        ? `<div class="sp-factions">
            <div class="sp-sub-label">Factions</div>
            ${factions.map(f => `<div class="sp-faction-item">${esc(f.name || f)}</div>`).join('')}
           </div>`
        : '';

    const struggles = (p.struggles || []);
    const strugglesHtml = struggles.length
        ? `<div class="sp-struggles">
            <div class="sp-sub-label">Struggles</div>
            ${struggles.map(s =>
                `<div class="sp-struggle-item">${esc(s.description || s)}</div>`
            ).join('')}
           </div>`
        : '';

    return `
<div class="sp-card">
    <div class="sp-card-head">
        ${toggleBtn()}
        <h3>${esc(p.name)}</h3>
        ${meta ? `<span class="sp-card-meta">${meta}</span>` : ''}
    </div>
    <div class="sp-card-body">
        ${p.description ? `<div class="sp-desc">${esc(p.description)}</div>` : ''}
        ${factionsHtml}
        ${strugglesHtml}
    </div>
</div>`;
}

function nameRef(name, href) {
    if (href) return `<a class="sp-name-ref" href="${href}">${esc(name)}</a>`;
    return `<span class="sp-name-ref">${esc(name)}</span>`;
}

// ── Reward pill ─────────────────────────────────────────────────────────────
function rewardPill(reward, dmItems) {
    if (reward.type === 'special') {
        const item = dmItems.find(i => i.id === reward.itemId);
        const label = item ? item.name : reward.itemId;
        return `<span class="sp-pill sp-pill--special">★ ${esc(label)}</span>`;
    }
    return `<span class="sp-pill sp-pill--normal">${esc(reward.itemId || 'reward')}</span>`;
}

// ── Main render ─────────────────────────────────────────────────────────────
function render() {
    const params   = new URLSearchParams(location.search);
    const id       = params.get('id');
    const scenarios = load(LS.scenarios);
    const scenario  = scenarios.find(s => s.id === id);

    if (!scenario) {
        document.getElementById('sp-root').innerHTML =
            '<p style="padding:2rem;color:#c66">Scenario not found.</p>';
        return;
    }

    document.title = `${scenario.name} — Print`;
    const titleEl = document.getElementById('sp-title');
    if (titleEl) titleEl.textContent = scenario.name;

    // Load all data
    const allChars    = load(LS.chars);       // [{name, gender, race, place, desc, category, progression[], items[]}]
    const allContacts = load(LS.contacts);
    const allMonsters = load(LS.monsters);
    const allPlaces   = load(LS.places);
    const dmItems     = load(LS.items);

    // Build lookup maps
    const contactById = Object.fromEntries(allContacts.map(c => [c.id, c]));
    const monsterById = Object.fromEntries(allMonsters.map(m => [m.id, m]));
    const placeById   = Object.fromEntries(allPlaces.map(p => [p.id, p]));
    const charByName  = Object.fromEntries(allChars.map(c => [c.name, c]));

    // ── Deduplication tracking ──────────────────────────────────────────────
    // Characters: scenario-level chars → full card in Characters section
    // If char appears in scene → name-ref only
    const scenarioCharNames = new Set(scenario.characters || []);

    // Contacts: scenario-level → full card in Contacts section
    // Scene-level: first occurrence → full card, rest → name-ref
    const scenarioContactIds = new Set(scenario.contacts || []);
    const renderedContactIds = new Set(scenario.contacts || []); // pre-fill with scenario-level

    // ── Scenario head ───────────────────────────────────────────────────────
    const meta = [scenario.category].filter(Boolean).map(esc).join(' · ');
    let html = `
<div class="sp-scenario-head">
    <div class="sp-scenario-title">${esc(scenario.name)}</div>
    ${meta ? `<div class="sp-scenario-meta">${meta}</div>` : ''}
    ${scenario.description ? `<div class="sp-scenario-desc">${esc(scenario.description)}</div>` : ''}
</div>`;

    // ── Characters section ──────────────────────────────────────────────────
    const charNames = [...scenarioCharNames].filter(n => charByName[n]);
    if (charNames.length) {
        html += `<div class="sp-section"><div class="sp-section-title">Characters</div>`;
        charNames.forEach(name => {
            html += charCard(charByName[name]);
        });
        html += `</div>`;
    }

    // ── Contacts section (scenario-level) ───────────────────────────────────
    const scenContacts = [...scenarioContactIds].map(cid => contactById[cid]).filter(Boolean);
    if (scenContacts.length) {
        html += `<div class="sp-section"><div class="sp-section-title">Contacts</div>`;
        scenContacts.forEach(c => { html += contactCard(c); });
        html += `</div>`;
    }

    // ── Scenes ──────────────────────────────────────────────────────────────
    const scenes = scenario.scenes || [];
    scenes.forEach((scene, si) => {
        html += `<div class="sp-scene" id="scene-${si}">`;

        // Scene head
        html += `<div class="sp-scene-head">
            <h2>${esc(scene.name) || `Scene ${si + 1}`}</h2>
            <button class="sp-break-btn no-print" onclick="spToggleBreak(this)" title="Toggle page break before this scene">✂ Page Break</button>
        </div>`;

        html += `<div class="sp-scene-body">`;

        // Scene description
        if (scene.description) {
            html += `<div class="sp-scene-desc">${esc(scene.description)}</div>`;
        }

        // Place
        const place = scene.place ? placeById[scene.place] : null;
        if (place) {
            html += `<div class="sp-subsection">
                <div class="sp-subsection-title">Place</div>
                ${placeCard(place)}
            </div>`;
        }

        // Scene characters — name-refs for scenario-level chars, full cards for scene-only
        const sceneCharNames = (scene.characters || []).filter(n => charByName[n]);
        if (sceneCharNames.length) {
            html += `<div class="sp-subsection"><div class="sp-subsection-title">Characters</div>`;
            sceneCharNames.forEach(n => {
                if (scenarioCharNames.has(n)) {
                    // Already shown at scenario level — name-ref
                    const anchor = `#char-${n.replace(/\s+/g,'_')}`;
                    html += nameRef(n, anchor);
                } else {
                    // First time we see this character
                    html += charCard(charByName[n]);
                }
            });
            html += `</div>`;
        }

        // Scene contacts
        const sceneContactIds = (scene.contacts || []).filter(cid => contactById[cid]);
        if (sceneContactIds.length) {
            html += `<div class="sp-subsection"><div class="sp-subsection-title">Contacts</div>`;
            sceneContactIds.forEach(cid => {
                const c = contactById[cid];
                if (!c) return;
                if (renderedContactIds.has(cid)) {
                    html += nameRef(c.name, `#contact-${cid}`);
                } else {
                    renderedContactIds.add(cid);
                    html += contactCard(c);
                }
            });
            html += `</div>`;
        }

        // Scene monsters — always full cards
        const sceneMonsterIds = (scene.monsters || []).filter(mid => monsterById[mid]);
        if (sceneMonsterIds.length) {
            html += `<div class="sp-subsection"><div class="sp-subsection-title">Monsters</div>`;
            sceneMonsterIds.forEach(mid => {
                html += monsterCard(monsterById[mid]);
            });
            html += `</div>`;
        }

        // Challenges
        const challenges = (scene.challenges || []).filter(ch => ch.description);
        if (challenges.length) {
            html += `<div class="sp-subsection"><div class="sp-subsection-title">Challenges</div>`;
            challenges.forEach(ch => {
                const rewards = (ch.rewards || []);
                const rewardsHtml = rewards.length
                    ? `<div class="sp-rewards-label">Rewards</div>
                       <div class="sp-pills">${rewards.map(r => rewardPill(r, dmItems)).join('')}</div>`
                    : '';
                html += `<div class="sp-challenge">
                    <div class="sp-challenge-desc">${esc(ch.description)}</div>
                    ${rewardsHtml}
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div></div>`; // sp-scene-body, sp-scene
    });

    document.getElementById('sp-root').innerHTML = html;
}

render();
