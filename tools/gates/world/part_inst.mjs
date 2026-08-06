// A PART INSIDE A PART IS A REFERENCE, AND YOU CAN SEE IT.
//
// Plan 17 `A7.3f`, first half. `A7.3b` fenced `14:<roof>,<part>` off in part mode
// with the words *"a part inside a part is a reference, and the gesture that makes
// one does not exist yet"*. This is that gesture, so the fence is gone rather than
// routed around — and the same message keeps one meaning per store, which is
// `A7.3c`'s rule for `8:` SAVE: in a WORLD it stamps cells, in a PART it writes an
// `INST`.
//
//   A7.3f-i    the gesture writes a REFERENCE — the acknowledgement names the
//              instance, and the authored store at that cell does not move
//   A7.3f-ii   ⚠ AND THE PICTURE DOES. §P4's *derived, never stored* needs BOTH
//              instruments or it is half a claim: the client's voxel cache gains
//              the leaf's cell while `26:` still reports the frame's own. A count
//              alone cannot tell *stored* from *drawn*, and a picture alone cannot
//              tell *drawn* from *baked*
//   A7.3f-iii  §P8 is checked ON THE GESTURE, not only at the save — an instance
//              is exactly how a cycle is authored, and the author is owed the
//              refusal while their hand is still on it
//   A7.3f-iv   ⚠ the close SEES it. `w_tau` counts cell writes and does not move
//              for a section at all (measured: 20 → 20 for an `INST`, 20 → 21 for
//              one cell), so before this step an author who placed an instance was
//              told `0 edits discarded` and then had it thrown away
//   A7.3f-v    it survives a save and a reopen, still as a reference
//
// ⚠ THE CONTROL IS THE WORLD PATH, and without it every check here passes on a
// server that stopped stamping parts altogether. Out of part mode the same message
// must still place CELLS — that is `A7.3b`'s over-fence lesson from the other
// direction: the interesting half of removing a fence is what it leaves alone.
import { existsSync } from 'node:fs';

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };

const FRAME = 'house/cottage';       // opened, never overwritten — `make parts` owns it
const LEAF  = 'prop/plinth';         // one column, height 6, at its own origin
const SAVED = 'house/withprop';      // what this gate authors

function open() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const says = [], ls = [];
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    if (s.startsWith('S:')) says.push(s.slice(2));
    if (s.startsWith('L:')) ls.push(s.slice(2));
  });
  return { ws, says, ls, ready: new Promise((r) => ws.addEventListener('open', r)) };
}

const a = open();
await a.ready;
a.ws.send('1:');
await wait(2000);

// Ack-driven, never a fixed sleep — `A7.3d`'s finding, and the only face of the
// `GATE_JOBS` flake that was ours: a gate that sleeps reports the machine.
async function stepFor(msg, prefix, maxMs = 20000) {
  const before = a.says.length;
  a.ws.send(msg);
  for (let waited = 0; waited < maxMs; waited += 50) {
    const hit = a.says.slice(before).find((s) => s.startsWith(prefix));
    if (hit !== undefined) return a.says.slice(before);
    await wait(50);
  }
  return a.says.slice(before);
}
const said = (lines, prefix) => lines.find((s) => s.startsWith(prefix)) ?? '';
const ask = async (msg, prefix) => said(await stepFor(msg, prefix), prefix);

// ⚠ THE LAYER KEY IS THE CHUNK AND THE LAYER, NOT THE WHOLE HEADER. `L:` carries
// `cx,cz,li,id,kind,VERSION,base;<bytes>` — the version moves with the content, so
// keying on the header makes a CHANGED layer look like a brand-new one and the
// comparison finds nothing. That cost a run that read as *the picture never moved*.
const lkey = (s) => s.split(';')[0].split(',').slice(0, 3).join(',');
const lbody = (s) => s.split(';')[1] ?? '';
const lastBy = (arr) => { const m = {}; for (const s of arr) m[lkey(s)] = lbody(s); return m; };

check(existsSync(`${ROOT}/${FRAME}.hxw`) && existsSync(`${ROOT}/${LEAF}.hxw`),
      'the frame and the leaf are both in the library');

a.ws.send('7:0,0,0.5236');
await wait(500);

// ── the CONTROL first: out of part mode the gesture still STAMPS ────────────
// Taken before anything else so it cannot be contaminated, and it is what keeps
// every check below from passing on a server that stopped placing parts at all.
const worldCell0 = await ask('26:0,0', 'cell ');
const stamped = await ask(`14:12,${LEAF}`, 'stencil ');
check(stamped.includes('placed'), `out of part mode it still places cells (${stamped})`);
const worldCell1 = await ask('26:0,0', 'cell ');
check(worldCell1 !== worldCell0,
      `and the WORLD's store moved (${worldCell0} → ${worldCell1}) — a stamp, not a reference`);

// ── A7.3f-i — in part mode it writes a reference ────────────────────────────
let lines = await stepFor(`44:${FRAME}`, `part '${FRAME}'`);
check(said(lines, `part '${FRAME}'`).includes('opened'), 'the frame opens');
await wait(2500);                     // let the first display settle before sampling

const partCell0 = await ask('26:0,0', 'cell ');
const before = lastBy(a.ls);
const nls = a.ls.length;

const inst = await ask(`14:12,${LEAF}`, 'instance ');
check(inst.includes('reference'), `the gesture makes a reference: ${JSON.stringify(inst)}`);
check(inst.includes(LEAF), `and names what it refers to (${inst})`);

const partCell1 = await ask('26:0,0', 'cell ');
check(partCell1 === partCell0,
      `the authored store did NOT move (${partCell0} → ${partCell1}) — §P4, a `
    + `reference stamps nothing`);

// ── A7.3f-ii — and the picture DID ──────────────────────────────────────────
await wait(3500);
const after = lastBy(a.ls.slice(nls));
const shared = Object.keys(after).filter((k) => before[k] !== undefined);
const moved = shared.filter((k) => before[k] !== after[k]);
// ⚠ THE INSTRUMENT, CHECKED AGAINST SOMETHING IT SHOULD FIND. If no layer came
// back at all, *the picture changed* below would be comparing an empty set — and
// an earlier run of this gate did exactly that with a key that included the
// version.
check(shared.length > 0, `the client's cache was re-sent (${shared.length} layers comparable)`);
check(moved.length > 0,
      `and one of them CHANGED — the leaf is drawn without being stored (${moved.join(',')})`);
// The leaf is one column of height 6 at its own origin, so exactly one byte of one
// layer moves. A whole layer differing would mean something else was rebuilt.
if (moved.length > 0) {
  const x = before[moved[0]].split(','), y = after[moved[0]].split(',');
  let n = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) n++;
  check(n <= 4, `and it is the leaf's own cell that moved, not the chunk (${n} bytes)`);
}

// ── A7.3f-iv — the close can see a section-only edit ────────────────────────
const closed = await ask('44:', "part '");
check(closed.includes('plus its sections'),
      `closing says the instance is being discarded (${closed})`);
// ⚠ THE CONTROL FOR IT, and without this the phrase could be unconditional: an
// open and an immediate close touched nothing and must say so.
await stepFor(`44:${FRAME}`, `part '${FRAME}'`);
const quiet = await ask('44:', "part '");
check(!quiet.includes('plus its sections'),
      `and an untouched part does not claim otherwise (${quiet})`);

// ── A7.3f-iii — §P8 on the gesture ──────────────────────────────────────────
lines = await stepFor(`44:${FRAME}`, `part '${FRAME}'`);
check(said(lines, `part '${FRAME}'`).includes('opened'), 'the frame opens again');
const self = await ask(`14:12,${FRAME}`, 'instance refused');
check(self !== '', `a part given an instance of ITSELF is refused: ${JSON.stringify(self)}`);
check(self.includes('→'), `and the refusal carries the chain (${self})`);
// ⚠ AND NOTHING WAS WRITTEN — *it said no* and *the part is unchanged* are
// different claims, which is `A7.3d`'s ordering lesson at a second site.
const stillQuiet = await ask('44:', "part '");
check(!stillQuiet.includes('plus its sections'),
      `and the refused instance left no section behind (${stillQuiet})`);

// ── A7.3f-v — it survives a save and a reopen, still derived ────────────────
lines = await stepFor(`44:${FRAME}`, `part '${FRAME}'`);
check(said(lines, `part '${FRAME}'`).includes('opened'), 'the frame opens once more');
const secs0 = +((await ask('8:', 'part ')).match(/(\d+) sections/)?.[1] ?? -1);
await stepFor(`14:12,${LEAF}`, 'instance ');
const savedMsg = await ask(`8:${SAVED}`, 'part ');
check(savedMsg.includes('saved'), `the framed part saves (${savedMsg})`);
const secs1 = +(savedMsg.match(/(\d+) sections/)?.[1] ?? -1);
check(secs1 === secs0 + 1,
      `and it carries one section more than the frame did (${secs0} → ${secs1})`);
await stepFor('44:', "part '");

lines = await stepFor(`44:${SAVED}`, `part '${SAVED}'`);
check(said(lines, `part '${SAVED}'`).includes('opened'), 'the saved part reopens');
await wait(3500);
const reCell = await ask('26:0,0', 'cell ');
check(reCell === partCell0,
      `and its store STILL does not hold the leaf's cell (${reCell}) — it came back `
    + `as a reference, not as the cells it draws`);
await stepFor('44:', "part '");

a.ws.close();
for (const r of rows) console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => m === ' PASS' ? '' : '  <-- FAIL')}`);
console.log(JSON.stringify({ gate: 'part_inst', checks: rows.length, bad, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
