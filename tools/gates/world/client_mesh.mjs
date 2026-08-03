// S3 — THE CLIENT'S OWN GROUND MESH IS THE SERVER'S, TRIANGLE FOR TRIANGLE.
//
// ⚠ CHECKED AND LEFT WHOLE, for the same reason as `cache.mjs`: only the wasm client
// can mesh the wasm client's cache. What CAN be settled against the store is settled
// in `moros_terrain/tests/mesh.loft` (the oracle's own boundary) and in
// `probe/s3/s3_oracle_boundary.loft` (nine cache shapes, drawn as a map). What is left
// needs a server, a browser and the stream between them, which is what this drives.
//
// It judges three numbers, and `wait` is not one of them: tiles held back by the
// oracle are reported so a guard that never fires is distinguishable from one that
// always does, but holding is correct behaviour, not a failure.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

// ⚠ REBUILD THE PAGE, OR THIS GATE TESTS A CLIENT THAT NO LONGER EXISTS. The server is
// interpreted from source every run, but the wasm client is a FILE — `src/.loft/
// editor_client.html`, written by `make client` — and the server just serves whatever
// is on disk. So a change to `editor_client.loft` is invisible here until someone
// remembers a separate command, and the gate reports on the previous build with total
// confidence. It cost a full diagnosis: the `Z:0` drain read as "never runs" through
// three instrumented runs, and the code under test was simply not in the page.
const b = spawnSync('loft', ['--html', '--lib', 'lib/', 'src/editor_client.loft'],
                    { encoding: 'utf8', env: process.env });
if (b.status !== 0) {
  console.log(JSON.stringify({ verdict: 'the wasm client did not build', ok: false }));
  process.stderr.write((b.stderr ?? '').split('\n').slice(-15).join('\n'));
  process.exit(1);
}

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/clientmesh.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const m = out.match(/ground (\d+) bad (\d+) wait (\d+)/g);
const last = m ? m[m.length - 1].match(/ground (\d+) bad (\d+) wait (\d+)/) : null;
const agree = last ? +last[1] : -1, bad = last ? +last[2] : -1, wait = last ? +last[3] : -1;
// ⚠ `agree > 0` IS THE HALF THAT CANNOT BE DROPPED. A guard that held every tile
// would report `bad 0` and prove nothing whatever — the same shape as a gate passing
// on an empty set, which this suite has been fooled by before.
// S4 — and the deletion itself. `held > 0` is the claim: ground meshes the server
// BUILT and did not send because the client said it draws its own. ⚠ `sent > 0` too,
// because the opt-in is earned — a run where nothing was ever sent means the client
// never needed convincing, which would mean the streaming path never ran.
const d = out.match(/derive (\d+) of (\d+) ground sent (\d+) held (\d+)/g);
const dl = d ? d[d.length - 1].match(/derive (\d+) of (\d+) ground sent (\d+) held (\d+)/) : null;
const sent = dl ? +dl[3] : -1, held = dl ? +dl[4] : -1, deriving = dl ? +dl[1] : -1;
const ok = last !== null && bad === 0 && agree > 0 && held > 0 && sent > 0 && deriving > 0;
console.log(JSON.stringify({ verdict: last ? last[0] : '(no ground report)',
                             agree, bad, waiting: wait, deriving, groundSent: sent, groundHeld: held,
                             ok }));
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
process.exit(ok ? 0 : 1);
