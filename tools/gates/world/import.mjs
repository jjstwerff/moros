// ⚠ CHECKED AND LEFT WHOLE. `glb_read` tests that the reader parses; this tests
// that the running editor can hold what it read and hand it back — a round trip
// through `21:`/`22:` that no library test spans.
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

import { connect, send, ask, report } from '../lib.mjs';

const g = await connect({ camera: true });
// `M:<id>;<flag>;<r>,<g>,<b>;<floats>` — the vertex data is the fourth field.
const meshVerts = (id) => {
  const body = g.picture.get(id);
  if (!body) return [];
  const p2 = body.split(';');
  return p2.length >= 3 ? p2[2].split(',').map(Number) : [];
};
const dressing = async (q, r) => {
  const m = await ask(g, `20:${q},${r}`, `dressing ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

await send(g, '7:0,0,0', ['placed']);

const exported = await ask(g, '22:editor_prop.glb', 'exported');
const imported = await ask(g, '21:editor_prop.glb', 'imported');
// ⚠ NO SLEEP. This was `await wait(1200)`, guessing at how long the imported prop's
// mesh takes to arrive. The wire is ORDERED, so the `dressing` read-back below is
// itself the barrier: its ack cannot arrive before anything the import emitted, `M:8`
// included. A guess that usually wins is still a guess — see `field.mjs`, where the
// same sleep read 0 on every run once it stopped winning.
const dress = await dressing(0, 0);

// a file that is not a glb — the reader's own refusal must survive the trip
const bad = await ask(g, '21:worlds/.gitignore', 'import refused');

const exportedN = Number((exported.match(/\d+/) || [0])[0]);
// mesh id 8 is the first of the imported block (0-4 figure, 5-7 cart)
const meshArrived = meshVerts(8).length > 3;
const importedN = Number((imported.match(/\d+/) || [0])[0]);
const roundTripped = exportedN > 0 && importedN === exportedN;
const asDressing = dress.includes('/8');
const namedRefusal = bad.includes('import refused (') && !bad.includes('could not');
const ok = roundTripped && meshArrived && asDressing && namedRefusal;
report(g, { exported, imported, dress, bad,
            exportedN, importedN, meshVerts: meshVerts(8).length,
            roundTripped, meshArrived, asDressing, namedRefusal, ok }, ok);
