// S2 — THE CLIENT'S VOXEL CACHE AGREES WITH THE SERVER'S.
//
// ⚠ CHECKED AND LEFT WHOLE, and the reason is sharper than usual: the CLIENT is the
// only thing that can compare its cache against the digest, and it is a wasm page.
// `hex_world/tests/layer_wire.loft` proves the encoding round-trips and that one
// changed cell moves the checksum — everything that can be settled against the store
// is settled there. What is left needs a running server, a browser, and the wire
// between them, which is exactly what this drives.
//
// The verdict comes back over the socket (`41:`) and out as `S:cache agree N bad M`,
// so it is a status line rather than a screenshot. A page that knew and could not say
// would leave the claim to a picture.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/cache.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
const m = out.match(/cache agree (\d+) bad (\d+) layers (\d+)/);
const agree = m ? +m[1] : -1, bad = m ? +m[2] : -1, layers = m ? +m[3] : -1;
// Every layer the client was sent is a layer it agrees on, and it was sent some.
const ok = m !== null && bad === 0 && agree > 0 && agree === layers;
console.log(JSON.stringify({ verdict: m ? m[0] : '(no cache report)',
                             agree, bad, layers, ok }));
if (!ok) process.stderr.write(out.split('\n').slice(-20).join('\n'));
process.exit(ok ? 0 : 1);
