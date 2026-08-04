// `44:` — A PART OPENS AS THE STORE THE GESTURES REACH, AND THE WORLD COMES BACK.
//
// Plan 17 `A7.3a`. A part IS a world (§P1), so part mode is a SWAP rather than a
// second editor: the same gestures, the same renderer, the same camera. Four
// claims, and only the first is about the feature working at all:
//
//   A7.3a-i    `44:<name>` puts the part in the store and `44:` puts the world back
//   A7.3a-ii   the subject line says WHICH — and a REFUSED open does not rename it
//   A7.3a-iii  the world survives the round trip exactly, and the part on disk is
//              untouched even after being edited (there is no save until `A7.3c`)
//   A7.3a-iv   nothing of the world is left drawn over the part
//
// ⚠ THE CONTROL FOR (iii) IS (i), AND WITHOUT IT THE GATE CANNOT FAIL. *The world
// reads the same before and after* is satisfied perfectly by a server that never
// swapped anything — so the same read is taken WHILE the part is open and has to
// come back different. Two reads that agree prove the swap did not happen; two
// that disagree and a third that matches the first prove it happened and came back.
//
// ⚠ AND (iv) NEEDS THE MESH IDS, NOT A PICTURE. Opening a four-chunk part after
// walking a forty-chunk world must not leave thirty-six chunks of world standing
// around it. The streamer only sends a chunk it does not think the client has, so
// the ids already held keep their old geometry unless the swap marks them dirty —
// which is invisible to any count of what ARRIVED and obvious in the set of what
// was RE-ADDRESSED.
//
// ⚠ IT WRITES NOTHING. `tools/run-gates.sh` hands every gate its own copy of the
// library, and this one only reads it — but it hashes the part FILE, because the
// claim *an edit in part mode reaches no disk* is about bytes and not about acks.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PORT = +(process.env.EDITOR_PORT ?? 18090);
const ROOT = process.env.EDITOR_PARTS ?? 'data/parts';
const PART = 'house/cottage';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
let bad = 0;
const check = (ok, msg) => { rows.push(`${msg} ${ok ? 'PASS' : 'FAIL'}`); if (!ok) bad++; };

// The figure, the cart and anything fixed live below this id; everything above is
// a chunk surface. Without the split the figure's five meshes — sent once, at
// `1:` — would count as world geometry that never came back.
const MESH_FIGURE_MAX = 15;

const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

function open() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const huds = [];
  const says = [];
  const meshes = [];
  // The last body sent for each mesh id — the client's picture, as the server
  // last stated it. Two of these compared is how the restore gets checked on
  // things no read-back reaches: the wall runs, the roof plans and the feet.
  const picture = new Map();
  ws.addEventListener('message', (ev) => {
    const s = String(ev.data);
    if (s.startsWith('H:')) huds.push(s);
    if (s.startsWith('S:')) says.push(s.slice(2));
    if (s.startsWith('M:')) {
      const body = s.slice(2);
      const semi = body.indexOf(';');
      const id = +body.slice(0, semi);
      meshes.push(id);
      picture.set(id, body.slice(semi + 1));
    }
  });
  return { ws, huds, says, meshes, picture,
           ready: new Promise((r) => ws.addEventListener('open', r)) };
}

const a = open();
await a.ready;
a.ws.send('1:');
await wait(2000);

// A read-back, taken by asking rather than by believing — a mesh is a picture and
// a chunk count is not a cell.
//
// ⚠ `26:` CELL AND NOT `15:` COLUMN, AND THAT COST A FAILING RUN. `15:` answers a
// column's LAYER tops, and a raise on the base plane creates no layer at all — so
// `column 0,0 = ` came back empty from the world both before and after, and *the
// world came back exactly* passed comparing nothing with nothing. `26:` answers
// the cell's material and height, which is what a raise actually moves. Both are
// asked below: the claim is about the store, and one read that cannot see the
// edit is not evidence the store was restored.
async function ask(msg, prefix) {
  const before = a.says.length;
  a.ws.send(msg);
  for (let i = 0; i < 40 && !a.says.slice(before).some((s) => s.startsWith(prefix)); i++) {
    await wait(50);
  }
  return a.says.slice(before).find((s) => s.startsWith(prefix)) ?? '<none>';
}
const readStore = async () => ({
  cell: await ask('26:0,0', 'cell '),
  column: await ask('15:0,0', 'column '),
});

const partFile = `${ROOT}/${PART}.hxw`;
const hash0 = md5(partFile);

// ── the world, with something in it ─────────────────────────────────────────
// An empty world is a flat plane, and a flat plane reads the same as any other
// flat plane — so the world gets a hill first. Otherwise (iii) compares nothing
// against nothing, which is exactly what the first run of this gate did: three
// raises landed under the walker, who does not start at the origin, and *the
// world came back exactly* passed on `column 0,0 = ` against `column 0,0 = `.
// ⚠ `5:` RAISES WHERE THE WALKER IS STANDING, so the walker is put somewhere
// known first. A gesture with an implicit subject needs the subject pinned before
// the read-back can be aimed at it.
// ⚠ THE FACING IS NOT FREE. Only six of the twelve placements have mitred corners,
// so a house at yaw 0 is refused — `32:` answers *turn one step*. 30° is one of the
// six, and a gate that took the refusal for an answer would go on to compare two
// empty registries. See the acceptance check below.
a.ws.send('7:0,0,0.5236');
await wait(400);
for (let i = 0; i < 3; i++) { a.ws.send('5:1'); await wait(150); }
await wait(1200);

// ⚠ AND A HOUSE, BECAUSE THE STORE IS NOT ALL OF THE WORLD. Wall runs, roof plans,
// leaves, openings, annexes, props, slabs and holes are the SERVER's records for
// the world being edited — not the store's — so part mode has to hold them aside
// too or the world's walls stand inside the part, and closing without restoring
// them leaves the author's house drawn as bare edge panels with no roof. `32:`
// fills two of those registries in one gesture, and no read-back on this wire
// reaches any of them: the only instrument that can see them is the PICTURE.
a.ws.send('32:');
await wait(2500);
// ⚠ ACCEPTED, NOT MERELY ANSWERED. The first version of this check matched
// /house|placed/, which the REFUSAL *"house refused — a footprint at this facing
// has no mitred corners"* satisfies perfectly — an instrument that reports success
// on the sentence saying it failed.
check(a.says.some((s) => s.startsWith('house placed')),
      `the world has a house in it, so the registries are not empty (${
        a.says.filter((s) => /house/.test(s)).slice(-1)[0] ?? 'none'})`);

// ── settle the picture before photographing it ──────────────────────────────
//
// ⚠ A RAISE LEAVES CHUNK GROUNDS STALE ON THE CLIENT, AND THAT IS NOT THIS
// FEATURE'S DOING. Measured on a fresh server: after `5:1` and any amount of
// waiting, 22 of 48 loaded chunks hold a ground mesh that does not match the
// store, and they stay that way for ever — until *anything* forces a full
// rebuild. Attributed away from part mode by forcing one with `8:`/`9:` instead,
// which produces the SAME 22. See OPEN_ISSUES § *A raise marks fewer chunks than
// it writes*.
//
// So the swap gets photographed against a settled picture rather than a stale one.
// Without this the comparison below reports 22 differences that part mode did not
// cause — a true measurement of the wrong thing, which is worse than no check.
a.ws.send('8:part_mode_probe');
await wait(1500);
a.ws.send('9:part_mode_probe');
await wait(5000);

const worldBefore = await readStore();
check(worldBefore.cell.startsWith('cell '), `the world answers a cell read (${worldBefore.cell})`);
// ⚠ THE INSTRUMENT, CHECKED AGAINST SOMETHING IT SHOULD FIND. The raise just
// happened, so the cell under the walker must have moved off the floor — and if
// it has not, every comparison below is between two identical empty answers.
check(worldBefore.cell !== 'cell 0,0 = 0,0',
      `and the raise is visible in it (${worldBefore.cell})`);

const hudsBefore = a.huds.length;
check(hudsBefore >= 1, `the subject line arrived (${hudsBefore} H:)`);
check((a.huds[hudsBefore - 1] ?? '').includes('world '),
      `and it names the world: ${JSON.stringify(a.huds[hudsBefore - 1])}`);

// ── A7.3a-ii, the control FIRST — a refused open renames nothing ────────────
// ⚠ Taken before the real open on purpose: run afterwards it could pass on a
// server that simply never sends `H:` twice.
const saysBeforeBad = a.says.length;
a.ws.send('44:nosuch/part');
await wait(1200);
const badSay = a.says.slice(saysBeforeBad).find((s) => s.startsWith('part refused')) ?? '';
check(badSay !== '', `a part that is not there is refused: ${JSON.stringify(badSay)}`);
check(a.huds.length === hudsBefore,
      `and the subject line does not move (${a.huds.length - hudsBefore} extra H:)`);

// ⚠ THE OTHER REFUSAL WITH TEETH: a name that climbs out of the library.
a.ws.send('44:../../etc/passwd');
await wait(800);
check(a.says.some((s) => s.includes('leaves data/parts/')),
      'a name containing .. is refused rather than normalised');
check(a.huds.length === hudsBefore, 'and that one does not move the line either');

// ── A7.3a-i — the part opens ────────────────────────────────────────────────
const meshesBeforeOpen = new Set(a.meshes.filter((m) => m > MESH_FIGURE_MAX));
const meshCountAtOpen = a.meshes.length;
const pictureBeforeOpen = new Map(a.picture);
const saysBeforeOpen = a.says.length;
a.ws.send(`44:${PART}`);
await wait(3000);

const openSay = a.says.slice(saysBeforeOpen).find((s) => s.startsWith(`part '${PART}'`)) ?? '';
check(openSay.includes('opened'), `the part opens: ${JSON.stringify(openSay)}`);
check(openSay.includes('world held aside'), 'and says the world was held, not closed');

check(a.huds.length > hudsBefore, `an accepted open moves the subject line (${a.huds.length} H:)`);
const hudPart = a.huds[a.huds.length - 1] ?? '';
check(hudPart.includes(`part ${PART}`), `and it now names the part: ${JSON.stringify(hudPart)}`);
check(!hudPart.includes('world '), 'and no longer the world');

// The control that makes the round-trip check able to fail at all.
const partStore = await readStore();
check(partStore.cell !== worldBefore.cell,
      `the same cell answers differently in part mode (${partStore.cell} vs ${worldBefore.cell})`);
check(partStore.column !== worldBefore.column,
      `and so does the same column (${partStore.column} vs ${worldBefore.column})`);

// ── A7.3a-iv — nothing of the world is left drawn ───────────────────────────
// ⚠ FROM THE OPEN ONWARDS, AND THE FIRST VERSION OF THIS LINE READ THE WHOLE
// STREAM. `a.meshes` is cumulative, so a set built from all of it always contains
// every id seen before the swap and the check below could not fail — sabotaging
// the invalidation away left the gate green. Slicing at the open is the whole
// difference between *these ids were re-addressed* and *these ids exist*.
const meshesAfterOpen = new Set(a.meshes.slice(meshCountAtOpen).filter((m) => m > MESH_FIGURE_MAX));
const stale = [...meshesBeforeOpen].filter((m) => !meshesAfterOpen.has(m));
// Every id the client held before the swap was re-addressed after it. An id that
// was not is a surface still carrying the world's triangles.
check(meshesBeforeOpen.size > 0,
      `the gate can see world geometry at all (${meshesBeforeOpen.size} mesh ids)`);
check(stale.length === 0,
      `every mesh id held before the swap was re-sent after it `
    + `(${stale.length} stale of ${meshesBeforeOpen.size})`);

// ── the two guards that come with the mode ──────────────────────────────────
const saysBeforeGuards = a.says.length;
a.ws.send('8:probe_world');
await wait(600);
check(a.says.slice(saysBeforeGuards).some((s) => s.startsWith('save refused')),
      'a save in part mode is refused — it would write the part over a world file');
a.ws.send('9:probe_world');
await wait(600);
check(a.says.slice(saysBeforeGuards).some((s) => s.startsWith('load refused')),
      'a load in part mode is refused — it would make the subject line lie');
a.ws.send(`44:${PART}`);
await wait(600);
check(a.says.slice(saysBeforeGuards).some((s) => s.includes('already editing')),
      'and a second part is refused while one is open');

// ── A7.3a-iii — edit the part, then close ───────────────────────────────────
for (let i = 0; i < 3; i++) { a.ws.send('5:1'); await wait(150); }
await wait(1200);

const saysBeforeClose = a.says.length;
a.ws.send('44:');
await wait(3000);

const closeSay = a.says.slice(saysBeforeClose).find((s) => s.startsWith(`part '${PART}'`)) ?? '';
check(closeSay.includes('closed'), `the part closes: ${JSON.stringify(closeSay)}`);
// ⚠ THE NUMBER IS THE POINT. `A7.3a` has no save, so a close discards — and a
// close that discarded silently would be the editor eating an author's work. The
// count is the store's own edit clock, not a tally the writer kept about itself.
const discarded = +(closeSay.match(/(\d+) edits discarded/)?.[1] ?? -1);
check(discarded > 0, `and says how many edits it threw away (${discarded})`);

const hudBack = a.huds[a.huds.length - 1] ?? '';
check(hudBack.includes('world '), `the subject names the world again: ${JSON.stringify(hudBack)}`);

const worldAfter = await readStore();
check(worldAfter.cell === worldBefore.cell,
      `the world's cell came back exactly (${worldAfter.cell} vs ${worldBefore.cell})`);
check(worldAfter.column === worldBefore.column,
      `and its column with it (${worldAfter.column} vs ${worldBefore.column})`);

check(md5(partFile) === hash0,
      'and the part on disk is byte-identical — nothing in part mode reached it');

// ⚠ THE PICTURE IS THE ONLY INSTRUMENT THAT REACHES THE REGISTRIES. `26:` and
// `15:` read the STORE, which the snapshot restores on its own; the wall runs and
// the roof plan live beside it and no message reads them back. Every surface the
// client held before the swap must therefore re-mesh to exactly what it was — one
// comparison covering the store, the registries and the feet at once, and the only
// check here that a world restored *except for its roof* would fail.
const changed = [...pictureBeforeOpen.keys()]
  .filter((id) => id > MESH_FIGURE_MAX && a.picture.has(id))
  .filter((id) => a.picture.get(id) !== pictureBeforeOpen.get(id));
check(pictureBeforeOpen.size > MESH_FIGURE_MAX,
      `the gate holds a picture to compare (${pictureBeforeOpen.size} meshes)`);
// ⚠ NAMED BY SURFACE WHEN IT FAILS. A mesh id is `chunk * 9 + 16 + surface`, so
// *which* surface differs is the diagnosis — all of one kind is a registry that did
// not come back, a scatter across kinds is the store itself.
const surfaceOf = (id) => (id - MESH_FIGURE_MAX - 1) % 9;
const kinds = [...new Set(changed.map(surfaceOf))].sort((x, y) => x - y);
check(changed.length === 0,
      `and every surface re-meshed to exactly what it was `
    + `(${changed.length} of ${pictureBeforeOpen.size} differ`
    + `${changed.length ? `, surfaces ${kinds.join(',')}, ids ${changed.slice(0, 4).join(',')}` : ''})`);

// A close with nothing open is refused rather than silently doing nothing.
const saysBeforeSecond = a.says.length;
a.ws.send('44:');
await wait(800);
check(a.says.slice(saysBeforeSecond).some((s) => s.startsWith('part close refused')),
      'closing when nothing is open is refused');

// And the world is editable again, which is what "restored" has to mean.
const saysBeforeSave = a.says.length;
a.ws.send('8:probe_world');
await wait(1000);
check(a.says.slice(saysBeforeSave).some((s) => s.startsWith('saved ')),
      'the world takes a save again once the part is closed');

a.ws.close();
for (const r of rows) console.log(`  ${r.replace(/ (PASS|FAIL)$/, (m) => m === ' PASS' ? '' : '  <-- FAIL')}`);
console.log(JSON.stringify({ gate: 'part_mode', checks: rows.length, bad, ok: bad === 0 }));
process.exit(bad === 0 ? 0 : 1);
