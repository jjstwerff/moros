// Drag-to-look gate: connect, take a camera, drag, take another.
// PASS requires the view matrix AND the figure's model matrix to both move —
// the camera following without the character turning would look identical from
// behind, so checking only the camera cannot see that failure.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const cams = [], models = [];
let stage = 0;
ws.onopen = () => ws.send('1:');
ws.onmessage = (e) => {
  const s = e.data, t = s.slice(0, s.indexOf(':')), b = s.slice(s.indexOf(':') + 1);
  if (t === 'C') cams.push(b);
  if (t === 'T' && b.startsWith('1;')) models.push(b);
  if (t === 'E') { ws.send('2:1.5,'); }
  if (t === 'C' && stage === 0) { stage = 1; setTimeout(() => ws.send('3:240,60'), 120); }
  if (t === 'C' && stage === 1 && cams.length >= 2) {
    stage = 2;
    // The server sends C then T for a turn, so evaluating on the C would read
    // the PREVIOUS model matrix and report figTurned:false against working
    // code. Settle first, then judge — the instrument's own race, caught by
    // disbelieving a surprising result rather than the code under test.
    setTimeout(() => {
      const camMoved = cams[0] !== cams[cams.length - 1];
      const figTurned = models[0] !== models[models.length - 1];
      console.log(JSON.stringify({ cameras: cams.length, models: models.length,
                                   camMoved, figTurned, ok: camMoved && figTurned }));
      ws.close(); process.exit(camMoved && figTurned ? 0 : 1);
    }, 400);
  }
};
ws.onerror = (e) => { console.log('ERR', e.message); process.exit(2); };
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 15000);
