// A PIXEL BUFFER AND A PNG, WITH NO GPU AND NO DEPENDENCY.
//
// Extracted from `plan.mjs`, which had it inline, so the elevation views can draw
// with the same primitives instead of a second copy that drifts. That drift is not
// hypothetical here: a second copy of the hex lattice is what four parity bugs and
// one road-shaped wall came from.
//
// The PNG is written by hand — IHDR, one zlib-deflated IDAT of filter-0 scanlines,
// IEND — because node ships zlib and a dependency for forty lines is a dependency
// to keep current.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

export const writePNG = (path, w, h, rgb) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGB
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;                                            // filter: none
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
};

// A view of a world-space rectangle, in pixels.
//
// ⚠ THE VERTICAL AXIS IS FLIPPED FOR ELEVATIONS AND NOT FOR PLANS, and it is the
// caller's business which. In plan, +z runs down the image the way a map reads; in
// elevation, +y is UP and an unflipped drawing puts the roof underground — which
// looks like a modelling error and is a plotting one. Pass `flipV` and the axis is
// named at the call rather than remembered.
export class Canvas {
  constructor(x0, y0, x1, y1, { px = 14, bg = 0x14, flipV = false } = {}) {
    this.x0 = x0; this.y0 = y0; this.y1 = y1;
    this.px = px; this.flipV = flipV;
    this.w = Math.max(1, Math.ceil((x1 - x0) * px));
    this.h = Math.max(1, Math.ceil((y1 - y0) * px));
    this.buf = Buffer.alloc(this.w * this.h * 3, bg);
  }
  at(x, y) {
    const cx = Math.round((x - this.x0) * this.px);
    const cy = this.flipV ? Math.round((this.y1 - y) * this.px)
                          : Math.round((y - this.y0) * this.px);
    return [cx, cy];
  }
  dot(x, y, [r, g, b], rad = 1) {
    const [cx, cy] = this.at(x, y);
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const X = cx + dx, Y = cy + dy;
      if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) continue;
      const i = (Y * this.w + X) * 3;
      this.buf[i] = r; this.buf[i + 1] = g; this.buf[i + 2] = b;
    }
  }
  line(x0, y0, x1, y1, col, rad = 0) {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * this.px));
    for (let i = 0; i <= n; i++) {
      this.dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col, rad);
    }
  }
}

// A 5x7 bitmap font, so a panel can say which view it is. Without a label the
// three views are three grey rectangles and the reader has to remember the order.
const GLYPHS = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  C: ['01110','10001','10000','10000','10000','10001','01110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','11011','10001'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
};
export const label = (cv, text, atX, atY, [r, g, b] = [0xff, 0xff, 0xff], scale = 2) => {
  let cx = atX;
  for (const ch of text.toUpperCase()) {
    const g5 = GLYPHS[ch] ?? GLYPHS[' '];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
      if (g5[row][col] !== '1') continue;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const X = cx + col * scale + sx, Y = atY + row * scale + sy;
        if (X < 0 || Y < 0 || X >= cv.w || Y >= cv.h) continue;
        const i = (Y * cv.w + X) * 3;
        cv.buf[i] = r; cv.buf[i + 1] = g; cv.buf[i + 2] = b;
      }
    }
    cx += 6 * scale;
  }
};

// Lay panels out side by side into one image, so a single PNG carries every view
// of the same moment — three files of the same scene are three chances to compare
// two different moments by mistake.
export const compose = (path, panels, gap = 8) => {
  const h = Math.max(...panels.map((p) => p.h));
  const w = panels.reduce((a, p) => a + p.w, 0) + gap * (panels.length - 1);
  const out = Buffer.alloc(w * h * 3, 0x08);
  let ox = 0;
  for (const p of panels) {
    for (let y = 0; y < p.h; y++) {
      p.buf.copy(out, ((y * w) + ox) * 3, y * p.w * 3, (y + 1) * p.w * 3);
    }
    ox += p.w + gap;
  }
  writePNG(path, w, h, out);
  return { w, h };
};
