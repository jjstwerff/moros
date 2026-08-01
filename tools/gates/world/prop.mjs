// Prop gate (rung W6, moros#14) — `D1` in a running editor.
//
// The model can hold dressing; this is the first time the EDITOR puts anything
// there. What it gates is the separation, not the placement:
//
//   · a prop reads back from the DRESSING view;
//   · it is invisible to the TERRAIN view — the same cell, two answers, which
//     is `D1`'s "excluded from col_K";
//   · raising the ground under it does not delete it, and the terrain write
//     that raises it is exactly the one that used to blank a dressing slot;
//   · props ACCUMULATE in a cell rather than replacing each other;
//   · a prop index outside the palette is refused NOMINALLY — no offer (`X68`).
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
const dressing = async (q, r) => {
  ws.send(`20:${q},${r}`);
  const m = await ack(`dressing ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};
const terrain = async (q, r) => {
  ws.send(`15:${q},${r}`);
  const m = await ack(`column ${q},${r} =`);
  return m.slice(m.indexOf('=') + 1).trim();
};

ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'S') status.push(b);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    // build a hill and stand on it, so the ground can later MOVE under the prop
    await placeAck(0, 0, 0);
    ws.send('5:1');
    ws.send('5:1');   // ordered; the `19:` ack below is the barrier
    await placeAck(17.3, 0, 0);                    // hex (10,0)

    ws.send('19:3');
    const placed = await ack('prop 3 placed');
    const dress1 = await dressing(10, 0);
    const terr1 = await terrain(10, 0);

    // a second prop in the same cell must ADD, not replace
    ws.send('19:5'); await ack('prop 5 placed');
    const dress2 = await dressing(10, 0);

    // ── build a STOREY over them, which is the terrain write that actually
    //    reaches a dressing slot.
    //
    // ⚠ A RAISE DOES NOT. The brush writes a ONE-CELL terrain column, so it only
    // ever touches layer 0 and can never reach the dressing appended after it —
    // this clause was green with the protection deleted, which makes it a clause
    // about nothing. A storey's column comes from `world_column`, which carries
    // one entry per chunk layer INCLUDING the absent placeholders for dressing,
    // so it addresses layer 1 and the skip is what stops that placeholder being
    // written back over a prop.
    // the ack on the next line IS the barrier — `12:1` needs no second one, and adding
    // one consumed the message so the real read timed out. `ack` only sees what arrives
    // AFTER it is called.
    ws.send('12:1');
    const storey = await ack('storey');
    const dress3 = await dressing(10, 0);
    const terr3 = await terrain(10, 0);

    // a nominal refusal, with no offer
    ws.send('19:99');
    const bad = await ack('prop');

    const inDressing = dress1.startsWith('13/3') || /\/3(,|$)/.test(dress1);
    const notInTerrain = !terr1.includes('/');       // terrain carries heights only
    const accumulates = dress2.split(',').length === 2 && dress2.includes('/5');
    const survived = dress3.split(',').length === 2 && dress3.includes('/3')
                     && dress3.includes('/5');
    const groundMoved = terr3 !== terr1 && storey.startsWith('storey +1');
    const refusedNominal = bad.includes('refused') && bad.includes('prop 99')
                           && !bad.includes('offer');
    const ok = inDressing && notInTerrain && accumulates && survived
               && groundMoved && refusedNominal;
    console.log(JSON.stringify({ placed, dress1, terr1, dress2, storey, dress3, terr3, bad,
                                 inDressing, notInTerrain, accumulates, survived,
                                 groundMoved, refusedNominal, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
ws.onopen = () => ws.send('1:');
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
