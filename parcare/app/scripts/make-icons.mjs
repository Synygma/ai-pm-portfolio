// Builds every app icon from the ParCare source icon.
// Run with:  npm run icons
//
// Source: assets/source/APP_Icon.jpg (1254 x 1254 JPEG: a light-blue circle with the family,
// hands, house and heart, on a WHITE background).
//
// Steps:
// 1. Make the white background transparent. A flood fill from the image border removes
//    near-white pixels that touch the outside. Pixels inside the circle are protected so the
//    white house, hair and collars are never touched. Edge pixels get partial transparency
//    so the outline stays smooth.
// 2. Write the sizes below. Files in src/app/ are picked up by Next.js automatically
//    (favicon.ico, icon.png, apple-icon.png); files in public/icons/ are used by the manifest
//    and the UI.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "assets", "source", "APP_Icon.jpg");
const APP_DIR = path.join(root, "src", "app");
const ICON_DIR = path.join(root, "public", "icons");

// Soft light blue that matches the inside of the circle (used behind the maskable and Apple icons).
export const ICON_BACKGROUND = "#DCEFFD";

// Circle fitted to the source: centre and a safe inner radius (measured; the drawn edge is ~598px
// from the centre at its widest). Inside this radius nothing is ever made transparent.
const PROTECT = { cx: 626, cy: 615, r: 555 };
const WHITE_MIN = 240; // a pixel whose darkest channel is >= this counts as background white

async function transparentSource() {
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rgba = Buffer.alloc(W * H * 4);
  const minChannel = (p) => Math.min(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]);
  const protectedPx = (p) => {
    const x = p % W, y = Math.floor(p / W);
    return (x - PROTECT.cx) ** 2 + (y - PROTECT.cy) ** 2 <= PROTECT.r ** 2;
  };

  // Flood fill from every border pixel.
  const bg = new Uint8Array(W * H);
  const stack = [];
  const push = (p) => {
    if (!bg[p] && !protectedPx(p) && minChannel(p) >= WHITE_MIN) { bg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < W * (H - 1)) push(p + W);
  }

  for (let p = 0; p < W * H; p++) {
    rgba[p * 4] = data[p * 3];
    rgba[p * 4 + 1] = data[p * 3 + 1];
    rgba[p * 4 + 2] = data[p * 3 + 2];
    let alpha = 255;
    if (bg[p]) {
      alpha = 0;
    } else {
      // Pixels next to the removed background fade out in proportion to how white they are.
      const x = p % W;
      const touchesBg = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (p >= W && bg[p - W]) || (p < W * (H - 1) && bg[p + W]);
      if (touchesBg) {
        const m = minChannel(p);
        alpha = Math.max(0, Math.min(255, Math.round(((255 - m) / (255 - 200)) * 255)));
      }
    }
    rgba[p * 4 + 3] = alpha;
  }
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

// Square PNG of the icon on a transparent background.
const transparentPng = (src, size) => sharp(src).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();

// Square PNG with the icon scaled to `scale` of the side, centred on the light-blue background.
async function paddedPng(src, size, scale) {
  const inner = Math.round(size * scale);
  const icon = await sharp(src).resize(inner, inner, { kernel: "lanczos3" }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: ICON_BACKGROUND } })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toBuffer();
}

// .ico container holding PNG images (supported by all current browsers and Windows Vista+).
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  await mkdir(ICON_DIR, { recursive: true });
  const src = await transparentSource();

  const outputs = [
    // Next.js file conventions (auto-added to <head>).
    [path.join(APP_DIR, "icon.png"), await transparentPng(src, 32)],
    [path.join(APP_DIR, "apple-icon.png"), await paddedPng(src, 180, 0.9)],
    // Manifest + UI.
    [path.join(ICON_DIR, "favicon-32.png"), await transparentPng(src, 32)],
    [path.join(ICON_DIR, "icon-192.png"), await transparentPng(src, 192)],
    [path.join(ICON_DIR, "icon-512.png"), await transparentPng(src, 512)],
    // Maskable: the OS may crop to a circle of 80% diameter, so the art fits inside that.
    [path.join(ICON_DIR, "maskable-512.png"), await paddedPng(src, 512, 0.78)],
  ];
  for (const [file, data] of outputs) {
    await writeFile(file, data);
    console.log(`  ${path.relative(root, file)}`);
  }

  const ico = buildIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await transparentPng(src, size) }))));
  await writeFile(path.join(APP_DIR, "favicon.ico"), ico);
  console.log(`  ${path.relative(root, path.join(APP_DIR, "favicon.ico"))} (16, 32, 48)`);
  console.log("Icons done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
