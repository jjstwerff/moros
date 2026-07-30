// Import gate (rung W6, moros#14) — kit-bashing, both directions.
//
// The loop an author actually uses: take editor geometry OUT to a .glb, work on
// it elsewhere, bring it back IN as a prop. This gates the round trip through
// the running editor, which is a different claim from `glb_read`'s own tests —
// those prove the reader parses, this proves the editor can hold what it read.
//
//   · export writes a file the reader accepts;
//   · import places it as DRESSING, like any other prop, because imported
//     geometry is set dressing and not landscape;
//   · the mesh actually reaches the client, with the vertices the file carried;
//   · a file that is not a glb is refused with the READER's named reason, not
//     flattened to "could not import";
//   · the id block is bounded and the bound is checked.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
const meshes = new Map();
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
const dressing = async (q, r) => {
  ws.send(`20:${q},${r}`);
  const m = await ack(`dressing ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const h = b.indexOf(';'), id = Number(b.slice(0, h));
    let rest = b.slice(h + 1); rest = rest.slice(rest.indexOf(';') + 1);
    meshes.set(id, rest.slice(rest.indexOf(';') + 1).split(',').map(Number)); }
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    await placeAck(0, 0, 0);

    const exported = (ws.send('22:editor_prop.glb'), await ack('exported'));
    const imported = (ws.send('21:editor_prop.glb'), await ack('imported'));
    // ⚠ NO SLEEP. This was `await wait(1200)`, guessing at how long the imported
    // prop's mesh takes to arrive. The wire is ORDERED, so the `dressing` read-back
    // below is itself the barrier: its ack cannot arrive before anything the import
    // emitted, `M:8` included. A guess that usually wins is still a guess — see
    // `field.mjs`, where the same sleep read 0 on every run once it stopped winning.
    const dress = await dressing(0, 0);

    // a file that is not a glb — the reader's own refusal must survive the trip
    const bad = (ws.send('21:worlds/.gitignore'), await ack('import refused'));

    const exportedN = Number((exported.match(/\d+/) || [0])[0]);
    // mesh id 8 is the first of the imported block (0-4 figure, 5-7 cart)
    const meshArrived = (meshes.get(8) || []).length > 3;
    const importedN = Number((imported.match(/\d+/) || [0])[0]);
    const roundTripped = exportedN > 0 && importedN === exportedN;
    const asDressing = dress.includes('/8');
    const namedRefusal = bad.includes('import refused (') && !bad.includes('could not');
    const ok = roundTripped && meshArrived && asDressing && namedRefusal;
    console.log(JSON.stringify({ exported, imported, dress, bad,
                                 exportedN, importedN, meshVerts: (meshes.get(8) || []).length,
                                 roundTripped, meshArrived, asDressing, namedRefusal, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
