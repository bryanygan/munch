// Applies image-selections.json (downloaded from scripts/image-picker.html)
// into mobile/src/data/foods.json.
//
// Usage:
//   node scripts/apply-image-selections.mjs [path-to-selections.json]
//
// Default path: ./image-selections.json (repo root) or ./scripts/image-selections.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FOODS_PATH = path.join(ROOT, 'mobile', 'src', 'data', 'foods.json');

const candidates = [
  process.argv[2],
  path.join(ROOT, 'image-selections.json'),
  path.join(ROOT, 'scripts', 'image-selections.json'),
].filter(Boolean);

const selPath = candidates.find(p => fs.existsSync(p));
if (!selPath) {
  console.error(`Could not find image-selections.json. Looked in: ${candidates.join(', ')}`);
  process.exit(1);
}

const selections = JSON.parse(fs.readFileSync(selPath, 'utf-8'));
const dishes = JSON.parse(fs.readFileSync(FOODS_PATH, 'utf-8'));

let applied = 0, missing = 0, unchanged = 0;
const unknown = [];

const byId = new Map(dishes.map(d => [d.id, d]));
for (const [id, url] of Object.entries(selections)) {
  const d = byId.get(id);
  if (!d) { unknown.push(id); continue; }
  if (!url || typeof url !== 'string') continue;
  if (d.image_url === url) { unchanged++; continue; }
  d.image_url = url;
  applied++;
}

for (const d of dishes) {
  if (/picsum\.photos/.test(d.image_url) && !selections[d.id]) missing++;
}

fs.writeFileSync(FOODS_PATH, JSON.stringify(dishes, null, 2) + '\n');

console.log(`From: ${path.relative(ROOT, selPath)}`);
console.log(`  Applied: ${applied}`);
console.log(`  Unchanged (already matched): ${unchanged}`);
console.log(`  Still placeholders (no selection yet): ${missing}`);
if (unknown.length) console.log(`  Unknown dish IDs in selections: ${unknown.join(', ')}`);
console.log(`\nNext: run \`node scripts/compute-thumbhashes.mjs\` to regenerate thumbhashes.`);
console.log(`Then: \`node scripts/validate-foods.mjs\` to confirm.`);
