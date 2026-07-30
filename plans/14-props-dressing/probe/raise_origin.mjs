// Does a raise sent straight after a teleport rise from where the character NOW
// IS, or from where they WERE?
//
// `MSG_RAISE` takes its origin from `last_hq`/`last_hr`, and those are written
// only by the per-tick streaming block — not by the `7:` place handler, which
// acks `S:placed` synchronously. So `place` then `5:1` with no pause in between
// should raise around the OLD hex. That is the same staleness the road already
// carries a ⚠ about ("it used `last_hq`/`last_hr`, which only the WALK TICK
// updates"), which was fixed there by deriving the cell from `px`/`pz`.
//
// Measured, not argued: teleport to hex (10,0) facing +x, raise at once, and ask
// where the ground went. A raise lands PEAK_AHEAD = 10 hexes along the facing, so
// from (10,0) the hill belongs at (20,0) and from a stale (0,0) at (10,0).
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (p, limitMs = 8000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 100) {
    await wait(100);
    const m = status.slice(from).find(x => x.startsWith(p));
    if (m) return m;
  }
  return `(no "${p}" in ${limitMs}ms)`;
};
// The top of a column, which is what a raise moves.
const top = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  const h = m.slice(m.indexOf('=') + 1).trim().split(',').map(Number);
  return h[h.length - 1];
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    const before10 = await top(10, 0), before20 = await top(20, 0);

    // A: NO PAUSE AT ALL — both commands go out in the same breath, so the
    //    server processes them back to back with no tick in between. Waiting on
    //    `placed` would hide this: `ack` polls at 100 ms and a tick is ~16, so
    //    the acknowledgement's own granularity covers the gap by accident. That
    //    accident is exactly what is being removed.
    ws.send('7:17.3,0,0');
    ws.send('5:1');
    await wait(1500);                       // a probe may sleep; a gate may not
    const a10 = await top(10, 0), a20 = await top(20, 0);

    // B: the same two commands with the old gate's pause between them, from the
    //    same standing position, so only the pause differs.
    ws.send('5:1');
    await wait(1500);
    const b10 = await top(10, 0), b20 = await top(20, 0);

    console.log(JSON.stringify({
      before: { at10: before10, at20: before20 },
      noPause: { at10: a10 - before10, at20: a20 - before20 },
      settled: { at10: b10 - a10,      at20: b20 - a20 },
      // If the origin were current, BOTH raises would land at (20,0).
      staleOriginConfirmed: (a10 - before10) > 0 && (a20 - before20) === 0
                            && (b20 - a20) > 0,
    }));
    ws.close(); process.exit(0); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 60000);
