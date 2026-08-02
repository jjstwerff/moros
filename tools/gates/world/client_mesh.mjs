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

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/clientmesh.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const m = out.match(/ground (\d+) bad (\d+) wait (\d+)/g);
const last = m ? m[m.length - 1].match(/ground (\d+) bad (\d+) wait (\d+)/) : null;
const agree = last ? +last[1] : -1, bad = last ? +last[2] : -1, wait = last ? +last[3] : -1;
// ⚠ `agree > 0` IS THE HALF THAT CANNOT BE DROPPED. A guard that held every tile
// would report `bad 0` and prove nothing whatever — the same shape as a gate passing
// on an empty set, which this suite has been fooled by before.
const ok = last !== null && bad === 0 && agree > 0;
console.log(JSON.stringify({ verdict: last ? last[0] : '(no ground report)',
                             agree, bad, held: wait, ok }));
if (!ok) process.stderr.write(out.split('\n').slice(-25).join('\n'));
process.exit(ok ? 0 : 1);
