// Infinite-world gate: walk in a straight line and require chunks to arrive
// AND to be dropped, with the live count staying bounded.
//
// The three failures this separates:
//   nothing arrives   → the world is not infinite, it is one fixed patch
//   nothing is dropped→ it is infinite but leaks; the client grows for ever
//   count unbounded   → the draw distance is not bounding anything
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
// Drives the character by PLACING it (7:<x>,<z>,<yaw>), never by walking.
// This is a WORLD gate: it measures terrain, streaming or levelling, and must
// not depend on locomotion — walking speed, stride or step timing. See
// tools/gates/README.md for why (a fixed-millisecond walk made this fail
// against working code the day the speed changed).
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);

const live = new Set();
const status = [];
let added = 0, dropped = 0, peak = 0, stage = 0, cViews = 0;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const ack = async (p, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
// ⚠ THE STREAMER ANNOUNCES NOTHING. It brackets its work in `Z:1` … `Z:0` but emits no
// status, and a step of 6 wu need not cross a chunk boundary — so there is no per-step
// signal to wait for and `Z:0` cannot be relied on. What IS ordered: a `2:` request is
// answered with a `C:` built from current state, so a `C:` obtained after the last
// placement proves every mesh the streamer emitted for it has already arrived. That is
// the barrier, and it replaces a 4200 ms guess.
const freshView = async (limitMs = 8000) => {
  const before = cViews;
  ws.send('2:1.5,');
  for (let t = 0; t < limitMs; t += 10) {
    if (cViews !== before) return true;
    await wait(10);
  }
  return false;
};
const placeAck = async (x, z, yaw) => { place(x, z, yaw); return ack('placed'); };
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const id = Number(b.slice(0, b.indexOf(';')));
                   if (id >= 1000) { live.add(id); added++; } }
  if (t === 'X') { live.delete(Number(b)); dropped++; }
  if (live.size > peak) peak = live.size;
  if (t === 'S') status.push(b);
  if (t === 'C') cViews++;
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && stage === 0) {
    stage = 1;
    // Placed in steps rather than walked: the chunk stream is a property of
    // WHERE the character is, so stating the positions measures it directly.
    // One step at a time, each acknowledged — the server then processes them in
    // order instead of racing a 260 ms timer.
    for (let d = 6; d <= 60; d += 6) await placeAck(d, 0, 0);
    const settled = await freshView();
    {
      // ⚠ COUNT CHUNKS, NOT MESHES. Each chunk emits one mesh per surface, and
      // that number is not a constant of the world — it went 3 → 4 the day
      // vegetation arrived, and every count here moved by exactly 4/3 (peak
      // 156 → 208) while the streaming behaviour was unchanged. A bound
      // expressed in meshes silently re-tunes itself whenever a surface is
      // added; a bound expressed in chunks does not.
      const SURFACES = 6;   // ground, road, field, vegetation, roof, wall — keep
                            // equal to `SURFACES` in `src/editor_server.loft`
      const liveChunks = new Set([...live].map(id => Math.floor((id - 16) / SURFACES)));
      const ok = added > 0 && dropped > 0 && live.size <= peak
                 && liveChunks.size < 60       // the draw radius holds ~50 chunks
                 && settled;
      console.log(JSON.stringify({ added, dropped, live: live.size, peak,
                                   liveChunks: liveChunks.size, settled, ok }));
      ws.close(); process.exit(ok ? 0 : 1);
    }
  }
};
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
