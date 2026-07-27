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
let added = 0, dropped = 0, peak = 0, stage = 0;
ws.onopen = () => ws.send('1:');
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'M') { const id = Number(b.slice(0, b.indexOf(';')));
                   if (id >= 1000) { live.add(id); added++; } }
  if (t === 'X') { live.delete(Number(b)); dropped++; }
  if (live.size > peak) peak = live.size;
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && stage === 0) {
    stage = 1;
    // Placed in steps rather than walked: the chunk stream is a property of
    // WHERE the character is, so stating the positions measures it directly.
    let d = 0;
    const march = setInterval(() => { d += 6; place(d, 0, 0);
                                      if (d >= 60) clearInterval(march); }, 260);
    setTimeout(() => {
      // ⚠ COUNT CHUNKS, NOT MESHES. Each chunk emits one mesh per surface, and
      // that number is not a constant of the world — it went 3 → 4 the day
      // vegetation arrived, and every count here moved by exactly 4/3 (peak
      // 156 → 208) while the streaming behaviour was unchanged. A bound
      // expressed in meshes silently re-tunes itself whenever a surface is
      // added; a bound expressed in chunks does not.
      const SURFACES = 4;                      // ground, road, field, vegetation
      const liveChunks = new Set([...live].map(id => Math.floor((id - 16) / SURFACES)));
      const ok = added > 0 && dropped > 0 && live.size <= peak
                 && liveChunks.size < 60;      // the draw radius holds ~50 chunks
      console.log(JSON.stringify({ added, dropped, live: live.size, peak,
                                   liveChunks: liveChunks.size, ok }));
      ws.close(); process.exit(ok ? 0 : 1);
    }, 4200);
  }
};
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
