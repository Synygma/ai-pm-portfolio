// Crops the 12 companion portraits out of the combined avatar sheet.
// Run with:  npm run avatars
//
// Source: assets/source/avataar_sample_icons.png (1448 x 1086, a 3-column x 4-row grid of cards;
// each card has a portrait on the left and text + a small symbol icon on the right).
// Output: public/avatars/<id>.webp, 256 x 256.
//
// Each crop is a square that holds only the portrait: no card text, no symbol icon and nothing
// from a neighbouring card. Coordinates were measured on a grid overlay and checked visually.
// Card bounds (white gutters): columns x 15-484, 493-955, 964-1433; rows y 132-363, 372-590,
// 599-835, 844-1080. If the source image changes, re-measure and update CROPS.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "assets", "source", "avataar_sample_icons.png");
const OUT_DIR = path.join(root, "public", "avatars");
const SIZE = 256;

// left, top = top-left corner of the square; size = side length (all in source pixels).
export const CROPS = {
  krishna: { left: 110, top: 138, size: 176 },
  shiva: { left: 580, top: 140, size: 185 },
  guruji: { left: 1015, top: 134, size: 190 },
  trekker: { left: 70, top: 374, size: 200 },
  champ: { left: 530, top: 380, size: 200 },
  explorer: { left: 1015, top: 378, size: 200 },
  "sangeet-saathi": { left: 55, top: 603, size: 200 },
  kalakaar: { left: 500, top: 603, size: 200 },
  "garden-mitra": { left: 1000, top: 603, size: 200 },
  masterchef: { left: 60, top: 850, size: 200 },
  vidya: { left: 530, top: 848, size: 200 },
  "my-child": { left: 1014, top: 876, size: 126 },
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const meta = await sharp(SOURCE).metadata();
  for (const [id, c] of Object.entries(CROPS)) {
    if (c.left < 0 || c.top < 0 || c.left + c.size > meta.width || c.top + c.size > meta.height) {
      throw new Error(`Crop for "${id}" is outside the source image`);
    }
    const out = path.join(OUT_DIR, `${id}.webp`);
    await sharp(SOURCE)
      .extract({ left: c.left, top: c.top, width: c.size, height: c.size })
      .resize(SIZE, SIZE, { kernel: "lanczos3" })
      .webp({ quality: 90 })
      .toFile(out);
    console.log(`  ${id}.webp`);
  }
  console.log(`Wrote ${Object.keys(CROPS).length} avatars to public/avatars/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
