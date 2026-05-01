#!/usr/bin/env node
// Moros character roster CLI — reuses html/logic.js for all rules.
//
// Storage: a JSON array of character dumps (the same shape the browser
// downloads via "Save roster"). Default file: data/roster.json.
//
// Subcommands:
//   list [--category X]                   table of characters
//   show <name>                           full text character sheet
//   sheet <name> [--inject path.md]       markdown sheet for embedding in an NPC page;
//                                         with --inject, replaces the "## Character sheet"
//                                         block in the file (or appends if absent).
//   apply <file|->                        create/update from a spec (one or many)
//   delete <name>                         remove a character
//   validate <name>                       print validation errors/warnings
//   template                              print a blank spec
//   data <races|places|backgrounds|powers|specializations|items>
//   export [name]                         print roster JSON (one or all)
//
// A spec matches the loadDump format:
//   { name, gender, desc, category, race, place,
//     progression: [{type, name}, ...], items: [...], elements: [...] }
// `apply` accepts either a single spec object or an array of specs.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Logic from '../html/logic.js';
import { DATA } from '../html/data.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DEFAULT_ROSTER = resolve(ROOT, 'data', 'roster.json');

// ─────────────────────────────── ARG PARSING ─────────────────────────────
function parseArgs(argv) {
    // Accepts global flags (--file, --category, --force, --help, --inject) before or
    // after the subcommand. Subcommand is the first non-flag positional.
    const args = { _: [], file: null, category: null, force: false, help: false, cmd: null, inject: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--file' || a === '-f') args.file = argv[++i];
        else if (a === '--category' || a === '-c') args.category = argv[++i];
        else if (a === '--inject') args.inject = argv[++i];
        else if (a === '--force') args.force = true;
        else if (a === '--help' || a === '-h') args.help = true;
        else if (args.cmd === null) args.cmd = a;
        else args._.push(a);
    }
    return args;
}

// ─────────────────────────────── STORAGE ─────────────────────────────────
function rosterPath(args) {
    return args.file ? resolve(args.file) : (process.env.MOROS_ROSTER ? resolve(process.env.MOROS_ROSTER) : DEFAULT_ROSTER);
}

function loadRoster(path) {
    if (!existsSync(path)) return [];
    const text = readFileSync(path, 'utf8').trim();
    if (!text) return [];
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error(`${path} is not a roster array`);
    return parsed;
}

function saveRoster(path, roster) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(roster, null, 2) + '\n', 'utf8');
}

// ─────────────────────────────── HELPERS ─────────────────────────────────
function findChar(roster, name) {
    const lower = name.toLowerCase();
    return roster.findIndex(c => (c.name || '').toLowerCase() === lower);
}

function loadStateFor(dump) {
    Logic.initState();
    Logic.loadDump(dump);
}

function pad(s, n) { s = String(s ?? ''); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

// ─────────────────────────────── LIST ────────────────────────────────────
function cmdList(args) {
    const roster = loadRoster(rosterPath(args));
    if (roster.length === 0) { console.log('(empty roster)'); return; }
    const rows = roster
        .filter(c => !args.category || (c.category || '') === args.category)
        .map(c => {
            try {
                loadStateFor(c);
                const v = Logic.validate();
                const status = v.errors.length ? `${v.errors.length} err` : (v.warnings.length ? `${v.warnings.length} warn` : 'ok');
                return [c.name, c.race || '-', c.place || '-', c.category || '-', String(Logic.state.xp), status];
            } catch (e) {
                return [c.name, c.race || '-', c.place || '-', c.category || '-', '?', `load: ${e.message}`];
            }
        });
    const headers = ['Name', 'Race', 'Place', 'Category', 'XP', 'Status'];
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
    const fmt = r => r.map((v, i) => pad(v, widths[i])).join('  ');
    console.log(fmt(headers));
    console.log(widths.map(w => '─'.repeat(w)).join('  '));
    rows.forEach(r => console.log(fmt(r)));
}

// ─────────────────────────────── SHOW ────────────────────────────────────
function renderSheet() {
    const s = Logic.state;
    const lines = [];
    lines.push(`━━ ${s.name || '(unnamed)'} ━━`);
    const meta = [s.gender, s.race, s.place, s.category && `category: ${s.category}`].filter(Boolean).join(' · ');
    if (meta) lines.push(meta);
    if (s.desc) lines.push('', s.desc);

    lines.push('', 'Statistics');
    DATA.statistics.forEach(st => lines.push(`  ${pad(st.abbreviation, 6)} ${pad(st.name, 12)} ${Logic.stat(st.abbreviation) || 1}   (${st.action})`));
    lines.push(`  XP: ${s.xp}`);

    const bgs = DATA.backgrounds.filter(b => Logic.stat(b.name) > 0);
    if (bgs.length) {
        lines.push('', 'Backgrounds');
        bgs.forEach(b => {
            const contacts = Logic.getContacts(b.name, s.place);
            lines.push(`  ${pad(b.name, 14)} ${Logic.stat(b.name)}${contacts.length ? `  contacts: ${contacts.join(', ')}` : ''}`);
        });
    }

    const specs = Object.keys(DATA.specToStat).filter(sp => Logic.stat(sp) > 0);
    if (specs.length) {
        lines.push('', 'Specializations');
        specs.forEach(sp => lines.push(`  ${pad(sp, 14)} ${Logic.stat(sp)}  (raises ${DATA.specToStat[sp]})`));
    }

    const powers = DATA.powers.filter(p => Logic.stat(p.name) > 0);
    if (powers.length) {
        lines.push('', 'Powers');
        powers.forEach(p => {
            const ow = Logic.isOverwhelmed(p.name) ? ' [Overwhelmed]' : '';
            const elems = (p.special === 'elemental' && s.elements.length) ? `  [${s.elements.join(' › ')}]` : '';
            lines.push(`  ${pad(p.name, 14)} ${Logic.stat(p.name)}  ${p.special}  ${p.description}${elems}${ow}`);
        });
    }

    if (s.progression > 0 || Logic.state.progressions > 0) {
        lines.push('', 'Progression');
        for (let i = 0; i < Logic.state.progressions; i++) {
            const p = Logic.state.progres(i);
            lines.push(`  ${pad(String(i + 1), 2)} ${pad(p.type, 14)} ${pad(p.name, 14)} lvl ${p.level}  +1 ${p.stat}  xp ${p.xp}`);
        }
    }

    if (s.items.size) {
        lines.push('', 'Equipment');
        DATA.items.forEach(it => {
            if (s.items.has(it.name))
                lines.push(`  ${pad(it.name, 18)}${it.bulk !== undefined ? ` bulk ${pad(it.bulk, 3)}` : ''} ${it.description || ''}`);
        });
        const cap = Logic.carryCapacity();
        const w = s.weight;
        lines.push(`  Bulk: ${w} / ${cap}${w > cap ? ' — encumbered' : ''}`);
    }

    if (s.elements.length) {
        lines.push('', `Elements: ${s.elements.join(' › ')}`);
    }

    const v = Logic.validate();
    if (v.errors.length || v.warnings.length) {
        lines.push('', 'Validation');
        v.errors.forEach(e => lines.push(`  ✗ ${e}`));
        v.warnings.forEach(w => lines.push(`  ! ${w}`));
    }

    return lines.join('\n');
}

function cmdShow(args) {
    const name = args._[0];
    if (!name) throw new Error('show requires a character name');
    const roster = loadRoster(rosterPath(args));
    const idx = findChar(roster, name);
    if (idx === -1) throw new Error(`character "${name}" not found`);
    loadStateFor(roster[idx]);
    console.log(renderSheet());
}

// ─────────────────────────────── SHEET (markdown) ────────────────────────
const SHEET_HEADING = '## Character sheet';

function renderMarkdownSheet(extra = {}) {
    const s = Logic.state;
    const lines = [];
    lines.push(SHEET_HEADING, '');

    const tagline = [s.gender, s.race, s.place].filter(Boolean).join(' · ');
    if (tagline) lines.push(`**${tagline}**`, '');

    const stats = DATA.statistics;
    lines.push('| ' + stats.map(st => st.abbreviation).join(' | ') + ' | XP |');
    lines.push('|' + stats.map(() => '---').join('|') + '|---|');
    lines.push('| ' + stats.map(st => Logic.stat(st.abbreviation) || 1).join(' | ') + ` | ${s.xp} |`);
    lines.push('');

    const bgRows = DATA.backgrounds
        .filter(b => Logic.stat(b.name) > 0)
        .map(b => {
            const contacts = Logic.getContacts(b.name, s.place);
            const c = contacts.length ? ` *(${contacts.join(', ')})*` : '';
            return `${b.name} ${Logic.stat(b.name)}${c}`;
        });
    if (bgRows.length) lines.push(`- **Backgrounds** — ${bgRows.join(' · ')}`);

    const specRows = Object.keys(DATA.specToStat)
        .filter(sp => Logic.stat(sp) > 0)
        .map(sp => `${sp} ${Logic.stat(sp)}`);
    if (specRows.length) lines.push(`- **Specializations** — ${specRows.join(' · ')}`);

    const powerRows = DATA.powers
        .filter(p => Logic.stat(p.name) > 0)
        .map(p => {
            const ow = Logic.isOverwhelmed(p.name) ? ' *(Overwhelmed)*' : '';
            const elems = (p.special === 'elemental' && s.elements.length) ? ` [${s.elements.join(' › ')}]` : '';
            return `${p.name} ${Logic.stat(p.name)} (${p.special})${elems}${ow}`;
        });
    if (powerRows.length) lines.push(`- **Powers** — ${powerRows.join(' · ')}`);

    if (Logic.state.progressions > 0) {
        const prog = [];
        for (let i = 0; i < Logic.state.progressions; i++) {
            const p = Logic.state.progres(i);
            prog.push(p.name);
        }
        lines.push(`- **Progression** — ${prog.join(' → ')}`);
    }

    if (s.items.size) {
        const itemList = DATA.items.filter(i => s.items.has(i.name)).map(i => i.name);
        const cap = Logic.carryCapacity();
        const w = s.weight;
        const enc = w > cap ? ' — encumbered' : '';
        lines.push(`- **Equipment** — ${itemList.join(', ')} *(bulk ${w} / ${cap}${enc})*`);
    }

    if (s.elements.length) lines.push(`- **Elements** — ${s.elements.join(' › ')}`);

    const mentors = extra.mentors || {};
    const mentorEntries = Object.entries(mentors);
    if (mentorEntries.length) {
        lines.push('');
        mentorEntries.forEach(([sp, text]) => {
            lines.push(`*Mentor — ${sp}: ${text}*`);
            lines.push('');
        });
    }

    if (s.desc) {
        lines.push('');
        lines.push(`> ${s.desc.replace(/\n+/g, ' ')}`);
    }

    lines.push('');
    return lines.join('\n');
}

function injectSheet(filePath, sheet) {
    const abs = resolve(filePath);
    if (!existsSync(abs)) throw new Error(`file not found: ${abs}`);
    const text = readFileSync(abs, 'utf8');
    const headingRe = new RegExp(`^${SHEET_HEADING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
    const m = text.match(headingRe);
    let result;
    let action;
    if (m) {
        const start = m.index;
        // Find the next "## " heading after our heading.
        const after = text.slice(start + m[0].length);
        const nextRe = /^##\s+/m;
        const nm = after.match(nextRe);
        const end = nm ? start + m[0].length + nm.index : text.length;
        const before = text.slice(0, start);
        const tail = text.slice(end);
        const sep = before.endsWith('\n\n') || before === '' ? '' : (before.endsWith('\n') ? '\n' : '\n\n');
        result = before + sep + sheet.trimEnd() + '\n\n' + tail.replace(/^\n+/, '');
        action = 'replaced';
    } else {
        const sep = text.endsWith('\n\n') ? '' : (text.endsWith('\n') ? '\n' : '\n\n');
        result = text + sep + sheet.trimEnd() + '\n';
        action = 'appended';
    }
    writeFileSync(abs, result, 'utf8');
    return { abs, action };
}

function cmdSheet(args) {
    const name = args._[0];
    if (!name) throw new Error('sheet requires a character name');
    const roster = loadRoster(rosterPath(args));
    const idx = findChar(roster, name);
    if (idx === -1) throw new Error(`character "${name}" not found`);
    loadStateFor(roster[idx]);
    const md = renderMarkdownSheet({ mentors: roster[idx].mentors });
    if (args.inject) {
        const { abs, action } = injectSheet(args.inject, md);
        console.log(`✎ ${action} sheet for ${name} in ${abs}`);
    } else {
        process.stdout.write(md);
    }
}

// ─────────────────────────────── APPLY ───────────────────────────────────
function normalizeSpec(spec) {
    const mentors = {};
    if (spec.mentors && typeof spec.mentors === 'object') {
        Object.entries(spec.mentors).forEach(([k, v]) => {
            if (typeof v === 'string' && v.trim()) mentors[k] = v.trim();
        });
    }
    return {
        name: spec.name ?? '',
        gender: spec.gender ?? '',
        desc: spec.desc ?? spec.description ?? '',
        category: spec.category ?? '',
        race: spec.race ?? null,
        place: spec.place ?? null,
        progression: Array.isArray(spec.progression) ? spec.progression.map(p => ({ type: p.type, name: p.name })) : [],
        items: Array.isArray(spec.items) ? spec.items : [],
        elements: Array.isArray(spec.elements) ? spec.elements : [],
        mentors,
    };
}

function applyOne(roster, spec, force) {
    const norm = normalizeSpec(spec);
    if (!norm.name) throw new Error('spec is missing "name"');

    Logic.initState();
    try {
        Logic.loadDump(norm);
    } catch (e) {
        throw new Error(`load failed for "${norm.name}": ${e.message}`);
    }

    // Surface items that loadDump silently dropped (unknown or background-disallowed).
    const accepted = Logic.state.items;
    const dropped = norm.items.filter(i => !accepted.has(i));

    const v = Logic.validate();
    if (v.errors.length && !force) {
        const msg = v.errors.map(e => `  ✗ ${e}`).join('\n');
        throw new Error(`validation failed for "${norm.name}":\n${msg}\n(use --force to save anyway)`);
    }

    const warnings = [...v.warnings];
    if (dropped.length) warnings.push(`Items dropped (unknown or not allowed by backgrounds): ${dropped.join(', ')}`);

    const dump = JSON.parse(JSON.stringify(Logic.state));
    if (Object.keys(norm.mentors).length) dump.mentors = norm.mentors;
    const idx = findChar(roster, norm.name);
    if (idx === -1) {
        roster.push(dump);
        return { name: norm.name, action: 'created', warnings, errors: v.errors };
    }
    roster[idx] = dump;
    return { name: norm.name, action: 'updated', warnings, errors: v.errors };
}

function cmdApply(args) {
    const src = args._[0];
    if (!src) throw new Error('apply requires a file path or "-" for stdin');
    const text = (src === '-') ? readFileSync(0, 'utf8') : readFileSync(resolve(src), 'utf8');
    const data = JSON.parse(text);
    const specs = Array.isArray(data) ? data : [data];

    const path = rosterPath(args);
    const roster = loadRoster(path);
    const results = [];
    for (const spec of specs) {
        results.push(applyOne(roster, spec, args.force));
    }
    saveRoster(path, roster);
    results.forEach(r => {
        const tag = r.action === 'created' ? '✚' : '↻';
        console.log(`${tag} ${r.action} ${r.name}`);
        r.warnings.forEach(w => console.log(`    ! ${w}`));
        if (r.errors.length) r.errors.forEach(e => console.log(`    ✗ ${e}  (saved with --force)`));
    });
    console.log(`Roster: ${path}  (${roster.length} character${roster.length === 1 ? '' : 's'})`);
}

// ─────────────────────────────── DELETE ──────────────────────────────────
function cmdDelete(args) {
    const name = args._[0];
    if (!name) throw new Error('delete requires a character name');
    const path = rosterPath(args);
    const roster = loadRoster(path);
    const idx = findChar(roster, name);
    if (idx === -1) throw new Error(`character "${name}" not found`);
    const removed = roster.splice(idx, 1)[0];
    saveRoster(path, roster);
    console.log(`✕ removed ${removed.name}`);
}

// ─────────────────────────────── VALIDATE ────────────────────────────────
function cmdValidate(args) {
    const name = args._[0];
    if (!name) throw new Error('validate requires a character name');
    const roster = loadRoster(rosterPath(args));
    const idx = findChar(roster, name);
    if (idx === -1) throw new Error(`character "${name}" not found`);
    loadStateFor(roster[idx]);
    const v = Logic.validate();
    if (!v.errors.length && !v.warnings.length) { console.log('✓ ok'); return; }
    v.errors.forEach(e => console.log(`✗ ${e}`));
    v.warnings.forEach(w => console.log(`! ${w}`));
    if (v.errors.length) process.exitCode = 1;
}

// ─────────────────────────────── TEMPLATE ────────────────────────────────
function cmdTemplate() {
    const sample = {
        name: '',
        gender: '',
        desc: '',
        category: '',
        race: '',
        place: '',
        progression: [
            { type: 'background', name: '' },
            { type: 'power',      name: '' },
            { type: 'specialization', name: '' },
            { type: 'power',      name: '' },
            { type: 'background', name: '' },
            { type: 'power',      name: '' },
        ],
        items: [],
        elements: [],
        mentors: {
            // "<Specialization>": "who taught it and where, in one short italicised line"
        },
    };
    console.log(JSON.stringify(sample, null, 2));
}

// ─────────────────────────────── DATA ────────────────────────────────────
function cmdData(args) {
    const kind = (args._[0] || '').toLowerCase();
    const out = [];
    switch (kind) {
        case 'races':
            DATA.races.forEach(r => out.push(`${pad(r.name, 14)} powers: ${r.powers.join(', ')}`));
            break;
        case 'places':
            DATA.places.forEach(p => out.push(`${pad(p.name, 18)} ${p.description}`));
            break;
        case 'backgrounds':
            DATA.backgrounds.forEach(b => out.push(`${pad(b.name, 14)} stats: ${b.statistics.join(', ')}  specs: ${b.specializations.join(', ')}`));
            break;
        case 'powers':
            DATA.powers.forEach(p => out.push(`${pad(p.name, 14)} stats: ${p.statistics.join(', ')}  ${p.special}  — ${p.description}`));
            break;
        case 'specializations':
        case 'specs':
            Object.entries(DATA.specToStat).forEach(([s, st]) => out.push(`${pad(s, 14)} raises ${st}`));
            break;
        case 'items':
            DATA.items.forEach(i => {
                const flags = [];
                if (i.restricted === false) flags.push('basic');
                if (i.restricted === true) flags.push('restricted');
                if (i.duplicates) flags.push(`dup:${i.duplicates.join('/')}`);
                out.push(`${pad(i.name, 18)} bulk ${pad(i.bulk ?? 0, 3)} ${flags.join(' ')}  ${i.description || ''}`);
            });
            break;
        case 'elements':
            DATA.cards.forEach(c => out.push(`${pad(c.name, 10)} ${c.special}  stats: ${c.statistics.join(', ')}`));
            break;
        default:
            console.error('data <races|places|backgrounds|powers|specializations|items|elements>');
            process.exitCode = 1;
            return;
    }
    out.forEach(l => console.log(l));
}

// ─────────────────────────────── EXPORT ──────────────────────────────────
function cmdExport(args) {
    const roster = loadRoster(rosterPath(args));
    if (args._[0]) {
        const idx = findChar(roster, args._[0]);
        if (idx === -1) throw new Error(`character "${args._[0]}" not found`);
        console.log(JSON.stringify(roster[idx], null, 2));
    } else {
        console.log(JSON.stringify(roster, null, 2));
    }
}

// ─────────────────────────────── MAIN ────────────────────────────────────
const HELP = `Moros character CLI

Usage: tools/character.js <command> [args] [--file path]

Commands:
  list [--category X]            roster table
  show <name>                    full character sheet (text)
  sheet <name> [--inject f.md]   markdown sheet for embedding in an NPC page;
                                 with --inject, replaces an existing
                                 "## Character sheet" block (or appends if absent)
  apply <file|->                 create/update from a JSON spec (single or array)
                                 use --force to save despite validation errors
  delete <name>                  remove a character
  validate <name>                check rules; non-zero exit on errors
  template                       print a blank spec
  data <kind>                    list races, places, backgrounds, powers,
                                 specializations, items, or elements
  export [name]                  print roster JSON (or one character)

Default roster file: data/roster.json (override with --file or MOROS_ROSTER)

Spec format (matches the browser's Save roster output, single character):
  { "name": "...", "gender": "...", "desc": "...", "category": "...",
    "race": "...", "place": "...",
    "progression": [{"type":"background","name":"trader"}, ...],
    "items": ["..."], "elements": ["Flame", ...] }
`;

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || !args.cmd) { console.log(HELP); return; }
    try {
        switch (args.cmd) {
            case 'list':     cmdList(args); break;
            case 'show':     cmdShow(args); break;
            case 'sheet':    cmdSheet(args); break;
            case 'apply':    cmdApply(args); break;
            case 'delete':   cmdDelete(args); break;
            case 'validate': cmdValidate(args); break;
            case 'template': cmdTemplate(args); break;
            case 'data':     cmdData(args); break;
            case 'export':   cmdExport(args); break;
            default:
                console.error(`Unknown command: ${args.cmd}`);
                console.error(HELP);
                process.exitCode = 1;
        }
    } catch (e) {
        console.error(`error: ${e.message}`);
        process.exitCode = 1;
    }
}

main();
