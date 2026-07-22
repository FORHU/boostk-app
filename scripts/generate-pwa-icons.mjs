// Generates Boostk PWA icons (branded lightning-bolt mark on the brand blue).
// Pure Node (zlib only) — no image deps. Run: `node scripts/generate-pwa-icons.mjs`
// Outputs into ../public: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(OUT, { recursive: true });

// Brand palette (from --primary oklch(0.488 0.243 264.376) = #1447e6)
const TOP = [0x14, 0x47, 0xe6];
const BOTTOM = [0x03, 0x27, 0xc3];
const WHITE = [0xff, 0xff, 0xff];

// Lightning-bolt polygon in a normalized 0..1 box (y points down), centered on 0.5/0.5.
const BOLT = [
  [0.58, 0.05], [0.25, 0.52], [0.45, 0.52],
  [0.30, 0.95], [0.75, 0.46], [0.55, 0.46],
];

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

function inRoundRect(px, py, size, r) {
  if (px < 0 || py < 0 || px > size || py > size) return false;
  const x = Math.min(Math.max(px, r), size - r);
  const y = Math.min(Math.max(py, r), size - r);
  // Corner regions: check distance to the nearest rounded corner centre.
  if ((px < r || px > size - r) && (py < r || py > size - r)) {
    return (px - x) ** 2 + (py - y) ** 2 <= r * r;
  }
  return true;
}

function renderIcon(size, { maskable }) {
  const r = maskable ? 0 : Math.round(size * 0.22);
  const boltScale = maskable ? 0.46 : 0.6; // maskable keeps bolt inside the safe zone
  const SS = 4; // supersampling factor for anti-aliasing
  const buf = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (!inRoundRect(px, py, size, r)) continue; // transparent outside
          // Vertical brand gradient for the background.
          const t = py / size;
          let cr = TOP[0] + (BOTTOM[0] - TOP[0]) * t;
          let cg = TOP[1] + (BOTTOM[1] - TOP[1]) * t;
          let cb = TOP[2] + (BOTTOM[2] - TOP[2]) * t;
          // White bolt on top.
          const nx = 0.5 + (px - size / 2) / (boltScale * size);
          const ny = 0.5 + (py - size / 2) / (boltScale * size);
          if (pointInPoly(nx, ny, BOLT)) {
            cr = WHITE[0]; cg = WHITE[1]; cb = WHITE[2];
          }
          rSum += cr; gSum += cg; bSum += cb; aSum += 255;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      const cov = aSum / (255 * n); // fraction of subsamples inside the shape
      // Un-premultiply: colour is the average over covered subsamples only.
      const covered = aSum / 255;
      buf[i] = covered ? Math.round(rSum / covered) : 0;
      buf[i + 1] = covered ? Math.round(gSum / covered) : 0;
      buf[i + 2] = covered ? Math.round(bSum / covered) : 0;
      buf[i + 3] = Math.round(cov * 255);
    }
  }
  return buf;
}

// Minimal PNG encoder (RGBA, 8-bit, filter 0).
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];
for (const t of targets) {
  const png = encodePNG(renderIcon(t.size, { maskable: t.maskable }), t.size);
  writeFileSync(join(OUT, t.file), png);
  console.log(`wrote public/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
