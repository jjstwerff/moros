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
const BODY = '0;', LEG_L = '1;';
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
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
    send('4:8');                                   // hold D — turn
    setTimeout(() => { send('4:0'); rot.turnMark = new Set(rot).size; }, 700);
    setTimeout(() => send('4:1'), 800);            // hold W — walk
    setTimeout(() => send('4:0'), 1500);
    setTimeout(() => {
      const turned = new Set(rot).size >= 3;
      const walked = new Set(pos).size >= 3;
      const ok = turned && walked && !sentLook;
      console.log(JSON.stringify({ facings: new Set(rot).size,
                                   positions: new Set(pos).size,
                                   turnedWithoutMouse: turned,
                                   walkedWithoutMouse: walked,
                                   everSentLook: sentLook, ok }));
      ws.close(); process.exit(ok ? 0 : 1);
    }, 1900);
  }
};
ws.onerror = () => process.exit(2);
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 240000);
