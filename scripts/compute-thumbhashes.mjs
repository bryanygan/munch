// Run from repo root: node scripts/compute-thumbhashes.mjs
// Fetches each dish image, computes its thumbhash, writes back to mobile/src/data/foods.json.
// Requires network access. Slow on first run (~1-2s per image); results are persisted.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rgbaToThumbHash } from 'thumbhash';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOODS_PATH = path.join(__dirname, '..', 'mobile', 'src', 'data', 'foods.json');

const bytesToBase64 = (bytes) => Buffer.from(bytes).toString('base64');

const computeOne = async (dish) => {
  const res = await fetch(dish.image_url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${dish.image_url}`);
  const input = Buffer.from(await res.arrayBuffer());
  // thumbhash requires images <= 100px on longest side
  const { data, info } = await sharp(input)
    .resize({ width: 100, height: 100, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const hash = rgbaToThumbHash(info.width, info.height, rgba);
  return bytesToBase64(hash);
};

const main = async () => {
  const raw = await fs.readFile(FOODS_PATH, 'utf-8');
  const dishes = JSON.parse(raw);
  let updated = 0;
  for (const dish of dishes) {
    if (dish.image_thumbhash && dish.image_thumbhash.length > 4 && !dish.image_thumbhash.startsWith('PLACEHOLDER_')) {
      // already looks valid, skip; delete to force recomputation
      continue;
    }
    try {
      dish.image_thumbhash = await computeOne(dish);
      console.log(`✓ ${dish.id}`);
      updated++;
    } catch (err) {
      console.warn(`✗ ${dish.id}: ${err.message}`);
    }
  }
  await fs.writeFile(FOODS_PATH, JSON.stringify(dishes, null, 2) + '\n', 'utf-8');
  console.log(`\nUpdated ${updated} dishes.`);
};

main().catch(err => { console.error(err); process.exit(1); });
