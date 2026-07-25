// Levelling gate: climb a hill, freeze the level, walk out over the plain, and
// require a RIDGE to be left behind.
//
// Two things make this gate real, and it was FAKE without the second.
//
// 1. Turn levelling OFF at the end. While it is on the character's height is
//    frozen by definition, so "y stayed high" proves nothing; released, the feet
//    read the ground again.
// 2. WALK BACK THE WAY YOU CAME, onto virgin plain. The first version walked
//    FORWARD after climbing — but the hill's radius is 7 hexes and the walk
//    covered ~5, so the character never left it. "Still high" meant "still on
//    the hill", and the control (levelling writes no terrain at all) PASSED with
//    identical numbers. Only ground that would otherwise be flat can show that a
//    ridge was built.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
let st = 0; const ys = [];
const y = () => ys[ys.length - 1];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
ws.onopen = () => ws.send('1:');
ws.onmessage = async (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'T' && b.startsWith('0;')) ys.push(+b.slice(2).split(',')[13]);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C' && !st) { st = 1;
    for (let k = 0; k < 5; k++) { ws.send('5:1'); await wait(150); }   // a hill ahead
    ws.send('4:1'); await wait(5200); ws.send('4:0'); await wait(300); // climb it
    const onHill = y();
    ws.send('6:1'); await wait(300);                                    // freeze the level
    ws.send('3:524,0'); await wait(300);         // about-face: 524 px ≈ π rad
    ws.send('4:1'); await wait(5200); ws.send('4:0'); await wait(400);  // back onto the plain
    const whileLevel = y();
    ws.send('6:0'); await wait(600);                                    // let go
    const afterLevel = y();
    const climbed  = onHill > 0.5;
    const frozen   = Math.abs(whileLevel - onHill) < 0.3;
    const ridgeKept = afterLevel > onHill - 0.5;      // did NOT fall to the plain
    const ok = climbed && frozen && ridgeKept;
    console.log(JSON.stringify({ onHill: +onHill.toFixed(2),
                                 whileLevel: +whileLevel.toFixed(2),
                                 afterLevel: +afterLevel.toFixed(2),
                                 climbed, frozen, ridgeKept, ok }));
    ws.close(); process.exit(ok ? 0 : 1); }
};
setTimeout(() => { console.log('TIMEOUT'); process.exit(3); }, 30000);
