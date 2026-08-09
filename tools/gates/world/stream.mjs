// ⚠ CHECKED AND LEFT WHOLE. Chunks arriving and being dropped with the live count
// bounded is the server's streaming loop — there is no store claim in it at all.
// Infinite-world gate: walk in a straight line and require chunks to arrive
// AND to be dropped, with the live count staying bounded.
//
// The three failures this separates:
//   nothing arrives   → the world is not infinite, it is one fixed patch
//   nothing is dropped→ it is infinite but leaks; the client grows for ever
//   count unbounded   → the draw distance is not bounding anything

import { connect, send, until, report } from '../lib.mjs';

// ⚠ ADDED AND DROPPED ARE COUNTED FROM THE STREAMS THEMSELVES. `M:` above id 1000 is a
// chunk surface arriving and `X:` is one being retired; the peak is the high-water mark
// of what was live at once, so it has to be sampled as they arrive rather than derived
// at the end from a set that has already shrunk.
//
// ⚠ AND IT WATCHES FROM THE FIRST BYTE. Registered after `connect`, it misses the
// opening burst: measured, 306 arrivals against a true 738 and a peak of 306 against
// 468. A maximum over time cannot be recovered from a snapshot at the end.
let added = 0, dropped = 0, peak = 0;
const live = new Set();
const watch = (t) => {
  if (t.startsWith('M:')) {
    const b = t.slice(2);
    const id = Number(b.slice(0, b.indexOf(';')));
    if (id >= 1000) { live.add(id); added++; }
  } else if (t.startsWith('X:')) { live.delete(Number(t.slice(2))); dropped++; }
  if (live.size > peak) peak = live.size;
};

const g = await connect({ camera: true, watch });
// A camera arriving is the server having processed everything before it.
const freshView = async (limitMs = 8000) => {
  const before = g.views.length;
  return until(() => g.views.length !== before, 'no fresh camera', limitMs);
};

// Placed in steps rather than walked: the chunk stream is a property of WHERE the
// character is, so stating the positions measures it directly. One step at a time, each
// acknowledged — the server then processes them in order instead of racing a timer.
for (let d = 6; d <= 60; d += 6) await send(g, `7:${d},0,0`, ['placed']);
const settled = await freshView();

// ⚠ COUNT CHUNKS, NOT MESHES. Each chunk emits one mesh per surface, and that number is
// not a constant of the world — it went 3 -> 4 the day vegetation arrived, and every
// count here moved by exactly 4/3 (peak 156 -> 208) while the streaming behaviour was
// unchanged. A bound expressed in meshes silently re-tunes itself whenever a surface is
// added; a bound expressed in chunks does not.
const SURFACES = 10;   // ground, road, field, vegetation, roof, wall, floor, frame, soffit, rock — keep
                      // equal to `SURFACES` in `src/editor_server.loft`
const liveChunks = new Set([...live].map((id) => Math.floor((id - 16) / SURFACES)));
const ok = added > 0 && dropped > 0 && live.size <= peak
           && liveChunks.size < 60       // the draw radius holds ~50 chunks
           && settled;
report(g, { added, dropped, live: live.size, peak,
            liveChunks: liveChunks.size, settled, ok }, ok);
