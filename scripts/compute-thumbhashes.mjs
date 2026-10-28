// Run from repo root: node scripts/compute-thumbhashes.mjs [--force]
// Fetches each dish image, computes its thumbhash, writes back to mobile/src/data/foods.json.
// Requires network access. Slow on first run (~1-2s per image); results are persisted.
//
// Skips dishes whose existing thumbhash looks like a real thumbhash (valid base64
// decoding to a small byte buffer). Pass --force to recompute all, even valid ones.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rgbaToThumbHash, thumbHashToRGBA } from 'thumbhash';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOODS_PATH = path.join(__dirname, '..', 'mobile', 'src', 'data', 'foods.json');
const FORCE = process.argv.includes('--force');

const bytesToBase64 = (bytes) => Buffer.from(bytes).toString('base64');

// A real thumbhash is base64 of 5-25 bytes and decodes cleanly via thumbHashToRGBA.
// Old blurhash strings will fail this check (wrong length, non-base64 chars, or decode fails).
const isValidThumbhash = (s) => {
  if (typeof s !== 'string' || s.length === 0) return false;
  try {
    const bytes = Buffer.from(s, 'base64');
    if (bytes.length < 5 || bytes.length > 30) return false;
    // Round-trip: decoding should not throw
    thumbHashToRGBA(new Uint8Array(bytes));
    return true;
  } catch {
    return false;
  }
};

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
  let updated = 0, skipped = 0, failed = 0;
  for (const dish of dishes) {
    if (!FORCE && isValidThumbhash(dish.image_thumbhash)) {
      skipped++;
      continue;
    }
    try {
      dish.image_thumbhash = await computeOne(dish);
      console.log(`✓ ${dish.id}`);
      updated++;
    } catch (err) {
      console.warn(`✗ ${dish.id}: ${err.message}`);
      failed++;
    }
  }
  await fs.writeFile(FOODS_PATH, JSON.stringify(dishes, null, 2) + '\n', 'utf-8');
  console.log(`\nUpdated: ${updated}. Skipped (already valid): ${skipped}. Failed: ${failed}.`);
  if (FORCE) console.log('(--force was set; recomputed even valid thumbhashes.)');
};

main().catch(err => { console.error(err); process.exit(1); });
