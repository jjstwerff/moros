// The two servers that are not the editor — `probe/b1b/auth.sh`'s runs B and C.
//
//   node probe/b1b/static.mjs <dir> <port>              run B: no /ws at all
//   node probe/b1b/static.mjs <dir> <port> --ws-silent  run C: /ws opens, says nothing
//
// ⚠ WHY NOT JUST STOP THE EDITOR SERVER. Because the editor server is also what
// serves the PAGE: with it down there is nothing to load, and a client that never
// booted says nothing about what a booted client claims. The page has to arrive
// and the socket has to fail, which is exactly one process short of the real
// thing — and it is also what `_site/index.html` will meet, where there is no
// server at either end of the wire.
//
// ⚠ AND IT KEEPS ITS OWN LOG, WHICH IS THE POINT OF IT BEING A SEPARATE PROCESS.
// The first version of run B proved "there was no socket" by reading the client's
// own `connected` line — the very claim under test, so a client that lied about
// connecting made the control agree with it. What happened on the wire is a fact
// this side holds, and it is the only non-circular evidence available.
//
// `--ws-silent` completes the handshake and then never sends a frame. That is the
// one situation where the panel's authority can change with NO message arriving —
// so it is where "the panel is told by the socket opening" stops being a claim
// that some unrelated `N:` would have satisfied anyway.
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, normalize, join } from 'node:path';

const [dirArg, portArg, ...rest] = process.argv.slice(2);
if (!dirArg || !portArg) {
  console.error('usage: static.mjs <dir> <port> [--ws-silent]');
  process.exit(64);
}
const silent = rest.includes('--ws-silent');
const root = resolve(dirArg);

const TYPES = { '.html': 'text/html', '.wasm': 'application/wasm', '.js': 'text/javascript' };

const server = http.createServer(async (req, res) => {
  const path = normalize(req.url.split('?')[0]).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403).end('no'); return; }
  try {
    const body = await readFile(file);
    const ext = path.slice(path.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': TYPES[ext] ?? 'application/octet-stream' });
    res.end(body);
    console.log(`static: served ${path}`);
  } catch {
    res.writeHead(404).end('not here');
    console.log(`static: 404 ${path}`);
  }
});

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
server.on('upgrade', (req, socket) => {
  if (!silent) {
    // ⚠ REFUSED, NOT IGNORED. Left unhandled, node destroys an upgrade socket with
    // no response — which a browser reports the same way as a connection it is
    // still waiting on. A 404 makes the failure prompt and certain, so "the socket
    // never opened" is a fact about this run rather than about how long it was
    // given.
    socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
    console.log(`static: UPGRADE REFUSED ${req.url}`);
    return;
  }
  const key = req.headers['sec-websocket-key'] ?? '';
  const accept = createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\n'
    + 'Upgrade: websocket\r\nConnection: Upgrade\r\n'
    + `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
  // Whatever the client sends is read and dropped — the frames are never parsed,
  // because nothing here needs to know what they said. What matters is that the
  // socket is OPEN (so `web::send` succeeds and the client's authority changes)
  // and that not one byte ever comes back.
  socket.on('data', () => {});
  socket.on('error', () => {});
  console.log(`static: UPGRADE COMPLETED ${req.url} — and this side will stay silent`);
});

server.listen(Number(portArg), '127.0.0.1', () => {
  console.log(`static: ${root} on 127.0.0.1:${portArg} — ws ${silent ? 'SILENT' : 'ABSENT'}`);
});
