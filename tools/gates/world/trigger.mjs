// Trigger gate (rung W8, moros#15) — invariant II: no anchor ever silently
// dangles.
//
// > When geometry changes under an attached thing, its anchor MOVES WITH IT or
// > is REPORTED BROKEN. Never dropped, never silently relocated. A FOREIGN name
// > the editor cannot resolve is neither: it is shown as foreign, and left alone.
//
// Three outcomes and exactly three, each gated:
//   · raise the ground under a trigger  → it follows, and says so;
//   · pave over it                      → BROKEN, and says so. NOT quietly
//     re-pointed at the road, which would leave a trigger attached to a surface
//     nobody chose;
//   · a foreign binding                 → untouched and shown as foreign.
//
// The middle one is the whole invariant. Silently relocating is the comfortable
// bug: everything keeps working and the trigger now means something else.
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const status = [];
let st = 0;
const ack = async (needle, limitMs = 40000) => {
  const from = status.length;
  for (let t = 0; t < limitMs; t += 2) {
    await wait(2);
    const m = status.slice(from).find(x => x.includes(needle));
    if (m) return m;
  }
  console.error(`GATE-TIMEOUT ${needle} ${limitMs}ms`); return `(no "${needle}" in ${limitMs}ms)`;
};
const placeAck = async (x, z, yaw) => { ws.send(`7:${x},${z},${yaw}`); return ack('placed'); };
// ⚠ `ack` only sees what arrives AFTER it is called, which is right for a reply
// and wrong for a report the world volunteers. The BROKEN notice is broadcast
// the moment the road lands — several steps before this gate thinks to look —
// so searching only new messages missed a message that had already arrived.
// "has this happened, or will it" — as opposed to `ack`'s "does the NEXT one match".
// A wait that cannot see what already arrived is a timeout waiting to happen.
const until = async (needle, limitMs = 8000) => {
  if (status.some((x) => x.includes(needle))) return needle;
  return ack(needle, limitMs);
};
const seen = (needle) => [...status].reverse().find(x => x.includes(needle)) || `(never saw "${needle}")`;
const num_after = (m, key) => Number((m.split(key)[1] || '').trim().split(/\s+/)[0]);

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // ⚠ THE TRIGGER MUST SIT WHERE THE GROUND WILL MOVE. A raise lands
    // PEAK_AHEAD (10) hexes along the facing with a radius-7 falloff, so the
    // character's OWN cell is outside its own stroke — an earlier version
    // anchored at the origin, raised twice, and watched nothing happen. Build
    // the hill first, then stand on it and anchor there.
    await placeAck(0, 0, 0);
    ws.send('5:1');
    ws.send('5:1');   // ordered; the `18:` ack below is the barrier
    await placeAck(17.3, 0, 0);                 // onto the hill: hex (10,0)
    ws.send('18:door_opens');
    const placed = await ack('trigger 0');

    // ── raise the SAME hill again from the same spot; the anchor must follow
    await placeAck(0, 0, 0);
    ws.send('5:1');
    ws.send('5:1');
    const followed = await ack('trigger 0 followed');

    // ── now pave over it. The ground it named is gone — not moved, GONE.
    await placeAck(17.3, 0, 0);
    ws.send('10:1'); await ack('road true');
    await placeAck(18.0, 0, 0);
    await placeAck(17.3, 0, 0);
    ws.send('10:0'); await ack('road false');
    // ⚠ THE TRIGGER IS RE-RESOLVED BY THE DIRTY FLUSH, not by the road toggle —
    // `triggers_resolve` runs where geometry has just changed, so the BROKEN
    // broadcast is the thing to wait for. Sleeping "to let the last rebuild settle"
    // was waiting for a message it could simply have awaited.
    //
    // ⚠ AND IT MUST BE `until`, NOT `ack`. `ack` scans only messages that arrive
    // AFTER it is called, so when the broadcast had already landed — which is the
    // normal case, the flush runs on the road toggle — it waited out the full
    // 40-second limit for a SECOND one, and then `seen` found the first in the
    // history anyway. The verdict was right and forty seconds of the suite were
    // spent proving it twice.
    await until('trigger 0 BROKEN');
    const broken = seen('trigger 0 BROKEN');

    // ── a foreign binding is neither resolved nor dropped
    await placeAck(6, 6, 0);
    ws.send('18:story::act2_begins');
    const foreign = await ack('trigger 1');

    const anchored = placed.includes('bound to door_opens')
                     && num_after(placed, 'height ') > 0;
    const moved    = followed.includes('followed to height')
                     && num_after(followed, 'to height ') > num_after(placed, 'height ');
    const reported = broken.includes('BROKEN') && broken.includes('is now material');
    const notRelocated = !broken.includes('followed');
    const foreignKept = foreign.includes('is foreign') && foreign.includes('left alone');
    const ok = anchored && moved && reported && notRelocated && foreignKept;
    console.log(JSON.stringify({ placed, followed, broken, foreign,
                                 anchored, moved, reported, notRelocated,
                                 foreignKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
