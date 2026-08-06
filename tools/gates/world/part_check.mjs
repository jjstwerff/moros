// §P8, CHECKED ON SAVE — AND A REFUSED SAVE LEAVES THE FILE ALONE.
//
// Plan 17 `A7.3d`, which closes `A3.4`. Until `A7.3c` there was no save gesture
// for §P8's *"checked on save"* to hang on, so `library_cycle` had one caller —
// the server's startup sweep — and `part_mesh_loads` was called by `make parts`
// and by nothing else at all. Both now run where an author is still holding the
// thing being refused.
//
//   A7.3d-i    a save that would make a part contain itself is refused, and the
//              refusal carries the CHAIN (§P8) rather than saying so
//   A7.3d-ii   ⚠ and the file on disk is byte for byte what it was. *The
//              acknowledgement said no* and *nothing was written* are different
//              claims, and only the second one is the property
//   A7.3d-iii  a part naming a mesh that will not load is refused the same way
//   A7.3d-iv   a refused save does not re-anchor the edit clock — the close still
//              reports the work as discarded, because it was
//
// ⚠ AND THE CONTROLS ARE WHAT MAKE ANY OF IT MEAN SOMETHING. A server that
// refused every part save passes i–iv perfectly, so a sound save-as must still go
// through; and `MC_NONE` — *this part names no mesh* — must not read as a fault,
// or the check refuses every cell part in the library, which is most of it.
//
// ⚠ THE CYCLE IS REACHABLE WITH THE GESTURES THAT EXIST, which is why this is a
// gate and not a fixture: there is no instance gesture yet (`A7.3f`), but SAVE-AS
// is enough. `prop/shrine` holds an instance of `prop/plinth`; saved AS
// `prop/plinth` it is a part that contains itself. ⚠ Note what that means for the
// check itself: `part_cycle` walks what is on DISK and would see nothing wrong
// here, because the fault is in the name the content is about to take.
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };
const md5 = (p) => (existsSync(p) ? createHash('md5').update(readFileSync(p)).digest('hex') : '<none>');

function open() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const says = [];
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    if (s.startsWith('S:')) says.push(s.slice(2));
  });
  return { ws, says, ready: new Promise((r) => ws.addEventListener('open', r)) };
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

// ⚠ WAIT FOR THE ANSWER, NOT FOR A CLOCK. Written with fixed sleeps this gate
// passed alone and failed at `GATE_JOBS=4`, because four interpreted servers on
// one box answer slower than the sleep — a green that depends on the load is a
// gate that reports the machine. Polling for the acknowledgement is both faster
// when the box is idle and correct when it is not.
async function stepFor(msg, prefix, maxMs = 12000) {
  const before = a.says.length;
  a.ws.send(msg);
  for (let waited = 0; waited < maxMs; waited += 50) {
    const hit = a.says.slice(before).find((s) => s.startsWith(prefix));
    if (hit !== undefined) return a.says.slice(before);
    await wait(50);
  }
  return a.says.slice(before);
}
// For the few gestures that answer nothing of their own.
async function step(msg, ms = 1200) {
  const before = a.says.length;
  a.ws.send(msg);
  await wait(ms);
  return a.says.slice(before);
}
const said = (lines, prefix) => lines.find((s) => s.startsWith(prefix)) ?? '';
const ask = async (msg, prefix) => said(await stepFor(msg, prefix), prefix);

// ⚠ THE FIXTURE IS THE LIBRARY, checked before it is relied on. If `prop/shrine`
// stopped holding an instance of `prop/plinth`, every refusal below would become
// a sound save and this gate would go green having tested nothing.
const shrineFile = `${ROOT}/prop/shrine.hxw`;
const plinthFile = `${ROOT}/prop/plinth.hxw`;
const statueFile = `${ROOT}/prop/statue.hxw`;
const statueMesh = `${ROOT}/prop/statue.glb`;
check(existsSync(shrineFile) && existsSync(plinthFile),
      'the fixture parts are in the library');
check(existsSync(statueMesh), 'and the statue still carries a mesh to break');

// ── A7.3d-i / -ii — the cycle ───────────────────────────────────────────────
const plinth0 = md5(plinthFile);
let lines = await stepFor('44:prop/shrine', "part 'prop/shrine'");
check(said(lines, "part 'prop/shrine'").includes('opened'), 'the frame opens');

const refused = await ask('8:prop/plinth', 'part save refused');
check(refused !== '', `saving it under its own leaf's name is refused: ${JSON.stringify(refused)}`);
// ⚠ THE CHAIN, NOT A VERDICT. §P8's rule: in a library of two hundred, *this part
// contains itself* is unactionable — the author needs to know which reference to
// cut, which is what the arrow carries.
check(refused.includes('→'), `and the refusal carries the chain (${refused})`);
check(refused.includes('prop/plinth'), 'which names the part it would have become');

check(md5(plinthFile) === plinth0,
      'and the file on disk is byte-identical — the check ran BEFORE the write');

// ── A7.3d-iv — a refusal does not look like a save ──────────────────────────
// ⚠ An edit, then a refused save, then a close. The clock is re-anchored by a
// SUCCESSFUL save (`A7.3c`), so a refused one must leave it where it was and the
// close must still report the work as discarded. A server that re-anchored on the
// way in would tell the author their work was safe and then drop it.
await stepFor('24:0,wall', 'edge ');
const refusedAgain = await ask('8:prop/plinth', 'part save refused');
check(refusedAgain !== '', 'the refusal stands with an edit pending');
const closed = await ask('44:', "part 'prop/shrine'");
const discarded = +(closed.match(/(-?\d+) edits discarded/)?.[1] ?? -1);
check(discarded > 0,
      `and closing still reports the work as discarded (${discarded}) — a refused `
    + `save did not re-anchor the clock`);

// ── the control: a sound save-as still goes through ─────────────────────────
// ⚠ WITHOUT THIS EVERY CHECK ABOVE PASSES ON A SERVER THAT REFUSES EVERY SAVE.
lines = await stepFor('44:prop/shrine', "part 'prop/shrine'");
check(said(lines, "part 'prop/shrine'").includes('opened'), 'the frame opens again');
const sound = await ask('8:prop/newshrine', 'part ');
check(sound.includes('saved'), `a sound save under a new name goes through (${sound})`);
check(existsSync(`${ROOT}/prop/newshrine.hxw`), 'and the new part is on disk');
await stepFor('44:', 'part ');

// ── the other control: naming no mesh is not a fault ────────────────────────
// ⚠ `MC_NONE` IS THE COMMON CASE. Most parts are cells and name no mesh at all,
// so a check that treated its absence as a failure would refuse the whole family
// — and would still pass every refusal check above.
lines = await stepFor('44:house/cottage', "part 'house/cottage'");
check(said(lines, "part 'house/cottage'").includes('opened'), 'a mesh-free part opens');
const cellSave = await ask('8:', 'part ');
check(cellSave.includes('saved'),
      `and saves — naming no mesh is not a fault (${cellSave})`);
await stepFor('44:', 'part ');

// ── A7.3d-iii — the mesh that will not load ─────────────────────────────────
// Taken last, because it removes a file the rest of the library draws with.
lines = await stepFor('44:prop/statue', "part 'prop/statue'");
check(said(lines, "part 'prop/statue'").includes('opened'), 'the mesh part opens');
const statue0 = md5(statueFile);
unlinkSync(statueMesh);
const meshRefused = await ask('8:', 'part save refused');
check(meshRefused.includes('will not load'),
      `a part whose mesh went away is refused: ${JSON.stringify(meshRefused)}`);
check(meshRefused.includes('prop/statue'), 'and the refusal names the mesh');
check(md5(statueFile) === statue0,
      'and that file is byte-identical too');

a.ws.close();
for (const r of rows) console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => m === ' PASS' ? '' : '  <-- FAIL')}`);
console.log(JSON.stringify({ gate: 'part_check', checks: rows.length, bad, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
