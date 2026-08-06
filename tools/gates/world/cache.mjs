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

// ⚠ SAME REASON AS `client_mesh.mjs`: the wasm client is a FILE the server serves, so
// without this the gate silently reports on the previous build.
const b = spawnSync('loft', ['--html', '--lib', 'lib/', 'src/editor_client.loft'],
                    { encoding: 'utf8', env: process.env });
if (b.status !== 0) {
  console.log(JSON.stringify({ verdict: 'the wasm client did not build', ok: false }));
  process.exit(1);
}

const r = spawnSync('node', ['tools/script.mjs', 'tools/scripts/cache.keys', '--shots'],
                    { encoding: 'utf8', env: process.env });
const out = r.stdout ?? '';
// ⚠ THE **LAST** MATCH, NOT THE FIRST — plan 19 `L5`, and this was the second half
// of the same bug. `String.match` without `/g` returns the FIRST occurrence, so even
// once the script started reporting the settled verdict, an earlier premature line
// in the same stdout would have been the one read. The verdict is a running one;
// only its final value is a claim about the cache.
const all = [...out.matchAll(/cache agree (\d+) bad (\d+) layers (\d+)/g)];
const m = all.length ? all[all.length - 1] : null;
const agree = m ? +m[1] : -1, bad = m ? +m[2] : -1, layers = m ? +m[3] : -1;
// ⚠ `agree === layers` WAS RIGHT AND STOPPED BEING RIGHT, which is worth stating
// rather than quietly relaxing. `D:` digests the VISIBLE set; the client now also
// caches a margin ring of chunks around it, because the mesher reads two cells past
// every tile and the server has to satisfy that precondition (S3). So the cache
// legitimately holds more than the digest names, and demanding equality would fail on
// a correct client. What still has to hold: nothing the digest names disagrees, and
// the digest named something.
const ok = m !== null && bad === 0 && agree > 0 && agree <= layers;
console.log(JSON.stringify({ verdict: m ? m[0] : '(no cache report)',
                             agree, bad, layers, ok }));
if (!ok) process.stderr.write(out.split('\n').slice(-20).join('\n'));
process.exit(ok ? 0 : 1);
