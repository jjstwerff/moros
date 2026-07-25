// Infinite-world gate: walk in a straight line and require chunks to arrive
// AND to be dropped, with the live count staying bounded.
//
// The three failures this separates:
//   nothing arrives   → the world is not infinite, it is one fixed patch
//   nothing is dropped→ it is infinite but leaks; the client grows for ever
//   count unbounded   → the draw distance is not bounding anything
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
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
    setTimeout(() => ws.send('4:1'), 300);        // walk straight, a long way
    setTimeout(() => ws.send('4:0'), 9000);
    setTimeout(() => {
      const ok = added > 0 && dropped > 0 && live.size <= peak && peak < 200;
      console.log(JSON.stringify({ added, dropped, live: live.size, peak, ok }));
      ws.close(); process.exit(ok ? 0 : 1);
    }, 9600);
  }
};
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
