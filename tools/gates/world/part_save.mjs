// ⚠ THINNED, AND THIS IS THE ROUTING HALF — the file already says so below, and this
// line is here because the rule is that it says so at the TOP. The format claim — a
// cell edit leaves every section untouched, with a dropped section and a changed byte
// as its controls — is `lib/hex_part/tests/save_edit.loft`.
//
// What needs a server is which FILE a save lands in: the mode decides the root, the
// same rule that already decides where a raise lands. And the null-edit check, which is
// a claim about bytes after a gesture — open, save, change nothing, and the file is what
// it was. A writer that reorders its sections passes every *it round-trips* test and
// still churns a committed file on every open.
// `8:` IN PART MODE SAVES THE PART — AND THE WORLD'S FILE NEVER MOVES.
//
// Plan 17 `A7.3c`. §P2 says a part is saved the way a world is saved, because it
// IS one, so this is not a second message: the MODE decides the root, the same
// rule that already decides where a raise lands. This gate keeps the half of that
// claim which needs a running server — the ROUTING. The half about the format —
// *a cell edit leaves every section untouched*, with a dropped section and a
// changed byte as its controls — is `lib/hex_part/tests/save_edit.loft`, because
// it is a claim about the store and nothing there needs a world.
//
//   A7.3c-i    an edit made in part mode is on disk after a save, and still there
//              when the part is opened again
//   A7.3c-ii   the part keeps its NAME across the save — the one thing on this
//              wire that can see the sections survived, since the open
//              acknowledges `opened as '<PART.name>'` and falls back to the
//              handle when there is no `PART` section to read
//   A7.3c-iii  ⚠ THE NULL EDIT: open, save, change nothing, and the file is byte
//              for byte what it was. A writer that reorders its sections or
//              re-derives a count passes every *it round-trips* check and still
//              churns a committed file on every open
//   A7.3c-iv   the WORLD's file is untouched throughout, which is what `A7.3a`'s
//              refusal was standing in for until there was a right answer
//
// ⚠ THE EDIT CLOCK IS THE SECOND INSTRUMENT, and it is the one that says the save
// happened where it claims: `44:` answers `K edits discarded`, so a close straight
// after a save must report **0** — anything else means the clock was re-anchored
// at the wrong moment and the message is announcing work that is safely on disk.
//
// ⚠ IT WRITES INTO `EDITOR_PARTS`, WHICH IS THE GATE'S OWN COPY. Saving is the
// point here, so this is the one part gate that changes a part on purpose;
// `tools/run-gates.sh` is what makes that safe, and the committed library is never
// what is open.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const PART = 'house/cottage';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };
const md5 = (p) => (existsSync(p) ? createHash('md5').update(readFileSync(p)).digest('hex') : '<none>');

const partFile = `${ROOT}/${PART}.hxw`;
// The world the gate will prove was never written. `world_path` is
// `<source>/../worlds/<name>.hxw`, and this gate runs from the repository root.
const WORLDNAME = 'part_save_probe';
const worldFile = `worlds/${WORLDNAME}.hxw`;

function open() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const huds = [];
  const says = [];
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    if (s.startsWith('H:')) huds.push(s);
    if (s.startsWith('S:')) says.push(s.slice(2));
  });
  return { ws, huds, says, ready: new Promise((r) => ws.addEventListener('open', r)) };
}

const a = open();
await a.ready;
a.ws.send('1:');
// ⚠ WAIT FOR THE SERVER, NOT FOR A CLOCK. This was `await wait(2000)` — a guess at
// how long the opening burst takes, so a loaded box made it a guess that was wrong.
// Every gesture below waits for its own acknowledgement; this only has to see the
// server answer at all, and it SAYS SO if it never does.
const untilSaid = async (fn, what, maxMs = 20000) => {
  for (let t = 0; t < maxMs; t += 25) { if (fn()) return true; await wait(25); }
  console.log(`  !! ${what} — never happened in ${maxMs}ms`);
  return false;
};
await untilSaid(() => a.says.length >= 1, 'the server never answered 1:');

async function step(msg, ms = 1800) {
  const before = a.says.length;
  a.ws.send(msg);
  await wait(ms);
  return a.says.slice(before);
}
const said = (lines, prefix) => lines.find((s) => s.startsWith(prefix)) ?? '';
const ask = async (msg, prefix) => said(await step(msg), prefix);

// ⚠ AND THE PLACEMENT IS ACKNOWLEDGED, so this waits for `placed` rather than
// guessing half a second at it.
a.ws.send('7:0,0,0.5236');
await untilSaid(() => a.says.some((s2) => s2.startsWith('placed ')),
                'the walker was never placed');

const worldBefore = md5(worldFile);

// ── A7.3c-iii — the null edit, taken FIRST ──────────────────────────────────
// ⚠ Before anything has changed the part, so a difference here can only be the
// writer's own doing. Run after the edit tests it would be comparing a file the
// gate had already rewritten.
const hash0 = md5(partFile);
check(hash0 !== '<none>', `the gate can see the part on disk (${partFile})`);

let lines = await step(`44:${PART}`, 2500);
check(said(lines, `part '${PART}'`).includes('opened'), 'the part opens');
const nullSave = await ask('8:', 'part ');
check(nullSave.includes('saved'), `a save with no edit is accepted: ${JSON.stringify(nullSave)}`);
check(md5(partFile) === hash0,
      'and it wrote the same bytes — a null edit does not churn the file');
const nullClose = await ask('44:', `part '${PART}'`);
check(/0 edits discarded/.test(nullClose), `and the clock agrees (${nullClose})`);

// ── A7.3c-i / -ii — an edit, saved, and still there on reopening ────────────
lines = await step(`44:${PART}`, 2500);
const openedAs = said(lines, `part '${PART}'`);
check(openedAs.includes("opened as 'cottage'"),
      `the part opens under its authored name (${openedAs})`);

// ⚠ AN EDGE AND NOT A RAISE, BECAUSE THE READ-BACK HAS TO BE AIMED. `5:` raises
// AHEAD of the walker — `raise_ahead` — so `26:0,0` under their feet answers the
// same thing before and after, and the first run of this gate read
// `cell 0,0 = 4,0` on both sides of three raises and called it "no edit". `24:`
// writes an edge of the cell the walker is standing IN, which `16:` reads back at
// exactly that cell: one gesture, one coordinate, one instrument.
const wallsBefore = await ask('16:0,0', 'walls ');
await step('24:0,wall', 1200);
await wait(1200);
const wallsEdited = await ask('16:0,0', 'walls ');
// The instrument, checked against something it should find: if the gesture did
// not move the edge then *the edit survived* below is comparing nothing.
check(wallsEdited !== wallsBefore,
      `an edge gesture changes the part (${wallsBefore} → ${wallsEdited})`);

const saved = await ask('8:', 'part ');
check(saved.includes('saved'), `the edited part saves: ${JSON.stringify(saved)}`);
check(/(\d+) sections/.test(saved) && +saved.match(/(\d+) sections/)[1] > 0,
      `and says how many sections went with it (${saved})`);
check(md5(partFile) !== hash0, 'and the file on disk changed');

// ⚠ 0 AFTER A SAVE. The close counts from the store's own clock, re-anchored by
// the save — so this is where a save that reported success without writing, or
// one that re-anchored at the wrong moment, shows up.
const closeAfterSave = await ask('44:', `part '${PART}'`);
check(/0 edits discarded/.test(closeAfterSave),
      `and closing straight after a save discards nothing (${closeAfterSave})`);

// Reopen: the edit is in the file, and the NAME came with it.
lines = await step(`44:${PART}`, 2500);
const reopened = said(lines, `part '${PART}'`);
check(reopened.includes("opened as 'cottage'"),
      `reopening still reads the part's own name — the sections survived (${reopened})`);
const wallsReloaded = await ask('16:0,0', 'walls ');
check(wallsReloaded === wallsEdited,
      `and the edit came back from disk (${wallsReloaded} vs ${wallsEdited})`);
await step('44:', 2500);

// ── A7.3c-iv — the world's file was never written ──────────────────────────
check(md5(worldFile) === worldBefore,
      `the world's file is untouched by everything above (${worldFile})`);

// ⚠ AND THE ROUTING BOTH WAYS. Out of part mode the same message must still save
// a WORLD — a mode check that routed everything to the parts root would pass every
// check above and quietly stop the editor saving worlds at all.
const worldSave = await ask(`8:${WORLDNAME}`, 'saved ');
check(worldSave.startsWith('saved '), `out of part mode, 8: still saves a world (${worldSave})`);
check(existsSync(worldFile), `and the world file exists now (${worldFile})`);
check(!existsSync(`${ROOT}/${WORLDNAME}.hxw`),
      'and no part of that name was created in the library');

// ── the name fence, which the world's save does not need ───────────────────
lines = await step(`44:${PART}`, 2500);
const escape = await ask('8:../../escaped', 'part save refused');
// ⚠ THE WORDING MOVED WITH THE RULE, plan 17 `A7.3e`. The three handlers each
// spelled out their own `..` check; the fence is `hex_part::part_name_ok` now —
// one rule, in the package that owns what a part name is — and it says *the part
// library* rather than naming a directory `EDITOR_PARTS` can point away from.
check(escape.includes('leaves the part library'),
      `a save under a name that climbs out is refused (${JSON.stringify(escape)})`);
check(!existsSync('escaped.hxw') && !existsSync('../escaped.hxw'),
      'and nothing was written outside the library');
await step('44:', 2500);

a.ws.close();
for (const r of rows) console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => m === ' PASS' ? '' : '  <-- FAIL')}`);
console.log(JSON.stringify({ gate: 'part_save', checks: rows.length, bad, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
