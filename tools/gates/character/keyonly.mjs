// "The mouse is optional" — as a gate rather than a claim.
//
// This client NEVER sends a look message (3:). It steers with keys alone and
// requires both halves of navigation to work: the facing must change (A/D turn)
// and the position must change (W/S walk). If either needed the mouse, one of
// them stays frozen and this fails.
//
// Control: make A/D strafe again and turnedWithoutMouse goes false — the
// position still moves, so a position-only check could not tell the difference.
// ⚠ PART IDS ARE A CONTRACT WITH THE SERVER, and they moved once already.
// When the world went infinite the static ground mesh went away and PART_BODY
// slid from 1 to 0 — so this probe silently began reading the LEFT LEG as "the
// body" and kept PASSING, because a leg does move. Named constants and this
// note, because the failure was invisible: green, for the wrong reason.
// ⚠ AND IT WAS A 1.9-SECOND WINDOW, which failed TWO RUNS IN THREE — measured on
// unmodified code, so it was never about what it was testing. `facings: 0,
// positions: 0` is not a marginal count: it is the whole window elapsing with no
// transform in it, because a freshly started server can still be streaming its
// first chunks when the camera message arrives. The claim never needed a clock —
// it is "the facing changes and the position changes" — so it waits for the
// TRANSFORMS now, with a bound that is a failure timeout rather than a
// measurement. This is the last clock-paced gate; `hipskin` and `walk` count
// what arrived in a fixed window by design and are a different class.
const BODY = '0;', LEG_L = '1;';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Distinct values of `arr` reaching `n`, or the bound elapsing. The expiry is the
// gate's red path — a strafing A/D never turns, and must not hang.
const until = async (arr, n, limitMs = 15000) => {
  for (let t = 0; t < limitMs; t += 2) {
    if (new Set(arr).size >= n) return true;
    await wait(2);
  }
  return false;
};
const ws = new WebSocket(`ws://127.0.0.1:${process.env.EDITOR_PORT ?? 18090}/ws`);
const rot = [], pos = [];
let stage = 0, sentLook = false;
const send = (m) => { if (m.startsWith('3:')) sentLook = true; ws.send(m); };
const rot9 = (b) => {
  const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
  return [0,1,2, 4,5,6, 8,9,10].map(i => m[i].toFixed(4)).join(',');
};
const xz = (b) => {
  const m = b.slice(b.indexOf(';') + 1).split(',').map(Number);
  return m[12].toFixed(4) + ',' + m[14].toFixed(4);
};
ws.onopen = () => send('1:');
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T' && b.startsWith(BODY)) { rot.push(rot9(b)); pos.push(xz(b)); }
  if (t === 'E') send('2:1.5,');
  if (t === 'C' && stage === 0) {
    stage = 1;
    (async () => {
      send('4:8');                                 // hold D — turn
      await until(rot, 3);
      send('4:0');
      const facings = new Set(rot).size;
      send('4:1');                                 // hold W — walk
      await until(pos, 3);
      send('4:0');
      const turned = facings >= 3;
      const walked = new Set(pos).size >= 3;
      const ok = turned && walked && !sentLook;
      console.log(JSON.stringify({ facings,
                                   positions: new Set(pos).size,
                                   turnedWithoutMouse: turned,
                                   walkedWithoutMouse: walked,
                                   everSentLook: sentLook, ok }));
      ws.close(); process.exit(ok ? 0 : 1);
    })();
  }
};
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
