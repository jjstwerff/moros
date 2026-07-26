// ⚠ NOT YET A GATE — parked in wip/ so `make gate-world` does not glob it.
//
// The camera assist itself IS verified, by direct measurement on a fresh world
// (24 raises, hill at ~17 wu, character placed past its far base):
//
//     flat  x=-40   boom 5.548   m6 0.2340      ← at rest, full boom
//     occl  x=28    boom 1.131                  ← boom gives way
//     occl  x=30    boom 1.354   tilt 0.0589
//     occl  x=32    boom 3.281   tilt 0.2602    ← both mechanisms visible
//
// and a mutation (CAM_MIN_FRAC=1.0, CAM_PITCH_GIVE=0.0) held the boom at 5.548,
// which is the assist doing the work rather than the geometry.
//
// What is unreliable is THIS FILE: run from a clean start it reports no response
// where the same sequence by hand reports a large one, and the cause is not yet
// isolated. Two harness bugs were already found and fixed here and a third is
// likely — `step(fn, ms)` WAITS then ACTS, and an earlier version passed only
// because the server had accumulated hills from previous runs. It stays out of
// the suite until it fails for the right reason and passes for the right one.
//
// Camera-occlusion gate.
//
// The claim: a hill BETWEEN the eye and the character must not swallow the eye.
// Two mechanisms answer it (editor_server.loft § Camera occlusion) — the pitch
// lifts within a bounded give, and the boom shortens for the rest — so this
// measures the OUTCOME rather than either mechanism: the eye must rise, or the
// boom shorten, or both.
//
// A WORLD gate: it PLACES the character (7:) and never walks, so it cannot break
// when locomotion changes. See tools/gates/README.md.
const ws = new WebSocket('ws://127.0.0.1:18090/ws');
const place = (x, z, yaw) => ws.send(`7:${x},${z},${yaw}`);
// ⚠ `step` WAITS then ACTS — it does not act then wait. So a measurement taken
// straight after `await step(place, …)` reads the state BEFORE that placement,
// and the numbers come out nonsensical (a "boom" of 40 wu across a 5.5 wu arm).
// `settle` is the missing half, and every read below is preceded by one.
const step = (fn, ms) => new Promise(r => setTimeout(() => { fn(); r(); }, ms));
const settle = (ms) => new Promise(r => setTimeout(r, ms));

// eye = -Rᵀ·t from a look-at view matrix, column-major as mat_wire sends it.
const eyeOf = (m) => [ -(m[0]*m[12] + m[1]*m[13] + m[2]*m[14]),
                       -(m[4]*m[12] + m[5]*m[13] + m[6]*m[14]),
                       -(m[8]*m[12] + m[9]*m[13] + m[10]*m[14]) ];

// The server registers a client only on the ready message, and it is `1:` with
// the colon — the same thing html/editor.html sends. Without it nothing arrives.
ws.onopen = () => ws.send('1:');

let view = null, stage = 0;
ws.onmessage = (e) => {
  const s = e.data, i = s.indexOf(':'), t = s.slice(0, i), b = s.slice(i + 1);
  if (t === 'E') ws.send('2:1.5,');
  if (t === 'C') {
    const nums = b.split(';')[0].split(',').map(Number);
    if (nums.length >= 16) view = nums;
    if (stage === 0) { stage = 1; run(); }
  }
};

async function run() {
  // GEOMETRY, which is easy to get wrong and silently proves nothing:
  //  · the raise tool builds 10 hexes AHEAD (~17 wu) while the boom is ~5.5 wu,
  //    so building "behind the character" puts the hill far BEYOND the camera;
  //  · standing ON the crest lifts the eye above the summit, which is clear by
  //    luck rather than by the assist.
  // What actually occludes: stand PAST the summit facing onward, so the camera
  // sits back at the summit and below it.
  //
  // Both measures are HEIGHT-INDEPENDENT on purpose. The character stands on a
  // hill in the test case and on flat ground in the control, so raw eye height
  // is confounded — a higher eye would "pass" for the wrong reason.
  //   boom  = horizontal eye→character distance   (catches the boom shortening)
  //   m[6]  = a component of the view basis        (catches the pitch lifting)
  await step(() => place(0, 0, 0), 500);
  // 24 raises, not 10. ⚠ Measured: ten does not build a hill tall enough to
  // occlude anything from a FRESH world, and an earlier version of this gate
  // "passed" only because the server it ran against had accumulated hills from
  // previous runs. `make gate-world` restarts the server per gate, so a gate that
  // depends on leftover state fails there and nowhere else.
  for (let i = 0; i < 24; i++) await step(() => ws.send('5:1'), 110);   // hill at ~17 wu

  await step(() => place(-40, 0, 0), 300); await settle(1800);   // control: flat
  const cE = eyeOf(view), cM6 = view[6];
  const boomFlat = Math.hypot(cE[0] - (-40), cE[2] - 0);

  // x = 32 is past the hill's far base with the camera back inside its flank, and
  // is chosen because BOTH mechanisms are visible there (boom 5.55 → 3.28 and a
  // tilt of 0.26). Standing ON the crest — x ≈ 26 — does NOT occlude: the eye
  // rides above the summit, and a gate placed there passes for the wrong reason.
  await step(() => place(32, 0, 0), 300); await settle(1800);
  const bE = eyeOf(view), bM6 = view[6];
  const boomBlk = Math.hypot(bE[0] - 32, bE[2] - 0);

  const shrink = boomFlat - boomBlk, tilt = Math.abs(bM6 - cM6);
  console.log(`flat     boom=${boomFlat.toFixed(3)}  m6=${cM6.toFixed(4)}`);
  console.log(`occluded boom=${boomBlk.toFixed(3)}  m6=${bM6.toFixed(4)}`);
  console.log(`shrink=${shrink.toFixed(3)}  tilt=${tilt.toFixed(4)}`);

  // CONTROL: on flat ground the camera must be AT REST — full boom. Without this
  // the assertion below could pass on a camera permanently pulled in.
  if (boomFlat < 4.0) {
    console.log(`FAIL(control): boom already short (${boomFlat.toFixed(3)}) on flat ground `
              + '— the comparison proves nothing');
    process.exit(1);
  }
  if (shrink > 0.05 || tilt > 0.005) {
    console.log('ok  camera yields to an obstruction and rests full on clear ground');
    process.exit(0);
  }
  console.log('FAIL: a hill between eye and character moved the camera not at all');
  process.exit(1);
}
setTimeout(() => { console.log('FAIL: timeout'); process.exit(1); }, 25000);
