// Generates Boostk PWA icons from the brand logo (public/bk logo.png).
// Requires `sharp`. Run: `bun scripts/generate-pwa-icons.mjs`
//
// Output (../public):
//   icon-192.png, icon-512.png        — purpose "any", transparent (logo trimmed + padded)
//   icon-maskable-512.png             — purpose "maskable", logo on opaque brand blue + safe zone
//   apple-touch-icon.png              — iOS, opaque brand blue (iOS ignores transparency)
//   favicon-32.png, favicon-16.png    — small PNG favicons (replace the old 270 KB favicon.ico)
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(SCRIPT_DIR, "..", "public");
// Brand source lives in scripts/ (not public/) so the 4.6 MB original isn't shipped.
const SRC = join(SCRIPT_DIR, "brand-logo.png");

const BRAND_BLUE = { r: 0x14, g: 0x47, b: 0xe6, alpha: 1 }; // --primary #1447e6
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Trim the transparent margin off the source once so every icon is tightly framed.
const logo = await sharp(SRC).trim().toBuffer();

// Logo scaled to `inner` px, centred on a `size` px canvas.
// When `opaque`, the whole canvas is flattened onto `bg` (no transparency — required
// for maskable + apple-touch). Otherwise the canvas stays transparent.
async function make(size, inner, bg, opaque) {
  const resized = await sharp(logo)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .toBuffer();
  let img = sharp({
    create: { width: size, height: size, channels: 4, background: opaque ? bg : TRANSPARENT },
  }).composite([{ input: resized, gravity: "center" }]);
  if (opaque) img = img.flatten({ background: bg });
  return img.png({ compressionLevel: 9 }).toBuffer();
}

const targets = [
  // purpose "any": transparent, ~90% of the frame
  { file: "icon-192.png", size: 192, inner: 172, bg: TRANSPARENT, opaque: false },
  { file: "icon-512.png", size: 512, inner: 460, bg: TRANSPARENT, opaque: false },
  // maskable/apple: opaque brand blue, logo in the ~80% safe zone
  { file: "icon-maskable-512.png", size: 512, inner: 410, bg: BRAND_BLUE, opaque: true },
  { file: "apple-touch-icon.png", size: 180, inner: 144, bg: BRAND_BLUE, opaque: true },
  // favicons: transparent, edge-to-edge
  { file: "favicon-32.png", size: 32, inner: 32, bg: TRANSPARENT, opaque: false },
  { file: "favicon-16.png", size: 16, inner: 16, bg: TRANSPARENT, opaque: false },
];

for (const t of targets) {
  const png = await make(t.size, t.inner, t.bg, t.opaque);
  await sharp(png).toFile(join(OUT, t.file));
  console.log(`wrote public/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
