// Auto-picks the best photo per dish from scripts/image-candidates.js using CLIP
// zero-shot matching (runs locally via @huggingface/transformers, no API keys).
//
// For every candidate photo, CLIP scores it against a text prompt for EVERY dish in
// foods.json plus a set of non-food prompts (street scenes, storefronts, ...). A photo
// is a good match for a dish when that dish is its top-1 class, so look-alikes and
// off-target results lose to the right dish instead of passing a bare similarity cutoff.
//
// Output (all gitignored):
//   scripts/auto-selections.json   dish id -> image url, in the format apply-image-selections reads
//   scripts/auto-pick-report.json  per-dish tier, score, and top-ranked candidates
//   scripts/review-sheets/*.jpg    contact sheets for dishes that need a human look
//
// Tiers:  auto    top-1 class and p >= --threshold          (written to selections)
//         likely  own dish in top 3 and p >= 0.1            (selections only with --include-likely)
//         review  everything else                           (contact sheet, you pick)
//
// Usage:
//   node scripts/auto-pick-images.mjs [--only=id1,id2] [--limit=N] [--threshold=0.6]
//                                     [--include-likely] [--no-sheets] [--model=Xenova/clip-vit-base-patch16]
//   node scripts/apply-image-selections.mjs scripts/auto-selections.json
//
// Embeddings are cached in scripts/.cache, so reruns are fast. First run downloads the
// model (~150MB) and embeds every candidate thumbnail (a few minutes on CPU).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  AutoTokenizer, CLIPTextModelWithProjection,
  AutoProcessor, CLIPVisionModelWithProjection, RawImage,
} from '@huggingface/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FOODS_PATH = path.join(ROOT, 'mobile', 'src', 'data', 'foods.json');
const CANDIDATES_PATH = path.join(__dirname, 'image-candidates.js');
const CACHE_DIR = path.join(__dirname, '.cache');
const OUT_SELECTIONS = path.join(__dirname, 'auto-selections.json');
const OUT_REPORT = path.join(__dirname, 'auto-pick-report.json');
const SHEETS_DIR = path.join(__dirname, 'review-sheets');

// --- Flags ---
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const a = argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : fallback;
};
const MODEL = opt('model', 'Xenova/clip-vit-base-patch16');
const THRESHOLD = parseFloat(opt('threshold', '0.6'));
const LIKELY_THRESHOLD = 0.1;
const ONLY = opt('only', '') ? new Set(opt('only').split(',')) : null;
const LIMIT = parseInt(opt('limit', '0'), 10) || Infinity;
const INCLUDE_LIKELY = flag('include-likely');
const MAKE_SHEETS = !flag('no-sheets');
const LOGIT_SCALE = 100; // CLIP's learned temperature

// Photos that are not of a plate of food. Probability mass on these counts against a candidate.
const NEGATIVE_PROMPTS = [
  'a photo of a street at night',
  'a photo of a restaurant storefront',
  'a photo of a crowded market',
  'a photo of a restaurant interior',
  'a photo of a person',
  'a photo of a drink in a glass',
  'a photo of raw ingredients on a table',
  'a photo of an empty plate',
  'a photo of a kitchen or cooking equipment',
  'a photo of a bowl of fruit',
  'a photo of fresh strawberries',
  'a photo of whole fresh fruit',
  'a photo of fresh raw vegetables',
  'a photo of raw meat',
  'a photo of a landscape',
];

// --- Load data ---
if (!fs.existsSync(CANDIDATES_PATH)) {
  console.error('Missing scripts/image-candidates.js. Run `npm run fetch-image-candidates` first.');
  process.exit(1);
}
const candidates = JSON.parse(
  fs.readFileSync(CANDIDATES_PATH, 'utf-8').match(/window\.CANDIDATES\s*=\s*(\{[\s\S]*\})\s*;?\s*$/)[1],
);
const dishes = JSON.parse(fs.readFileSync(FOODS_PATH, 'utf-8'));
const isPlaceholder = d => /picsum\.photos/.test(d.image_url);
const targets = dishes
  .filter(d => candidates[d.id]?.candidates?.length && (ONLY ? ONLY.has(d.id) : isPlaceholder(d)))
  .slice(0, LIMIT);
console.log(`${targets.length} dishes to process (of ${dishes.length}); model ${MODEL}`);
if (targets.length === 0) process.exit(0);

// --- Model ---
const [tokenizer, textModel, processor, visionModel] = await Promise.all([
  AutoTokenizer.from_pretrained(MODEL),
  CLIPTextModelWithProjection.from_pretrained(MODEL),
  AutoProcessor.from_pretrained(MODEL),
  CLIPVisionModelWithProjection.from_pretrained(MODEL),
]);

const normalize = vec => {
  let n = 0;
  for (const x of vec) n += x * x;
  n = Math.sqrt(n) || 1;
  return Float32Array.from(vec, x => x / n);
};

const embedTexts = async texts => {
  const out = [];
  for (let i = 0; i < texts.length; i += 64) {
    const { text_embeds } = await textModel(tokenizer(texts.slice(i, i + 64), { padding: true, truncation: true }));
    const dim = text_embeds.dims[1];
    for (let r = 0; r < text_embeds.dims[0]; r++) {
      out.push(normalize(text_embeds.data.slice(r * dim, (r + 1) * dim)));
    }
  }
  return out;
};

// Class prompts: every dish in the catalog, then the non-food prompts.
const cuisineLabel = d => d.cuisine_region.replace(/_/g, ' ');
const dishPrompts = dishes.map(d => `a photo of ${d.name}, a ${cuisineLabel(d)} dish`);
const classEmbeds = await embedTexts([...dishPrompts, ...NEGATIVE_PROMPTS]);
const dishIndex = new Map(dishes.map((d, i) => [d.id, i]));
const NEG_START = dishes.length;
console.log(`Embedded ${dishes.length} dish prompts + ${NEGATIVE_PROMPTS.length} non-food prompts`);

// --- Image embeddings (disk-cached) ---
fs.mkdirSync(CACHE_DIR, { recursive: true });
const CACHE_PATH = path.join(CACHE_DIR, `clip-${MODEL.replace(/\W+/g, '_')}.json`);
const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) : {};
const saveCache = () => fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
const encode = f32 => Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength).toString('base64');
const decode = b64 => {
  const b = Buffer.from(b64, 'base64');
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
};

const embedImage = async cand => {
  const key = `${cand.provider}:${cand.id}`;
  if (cache[key]) return decode(cache[key]);
  const { image_embeds } = await visionModel(await processor(await RawImage.read(cand.thumb)));
  const v = normalize(image_embeds.data);
  cache[key] = encode(v);
  return v;
};

const jobs = targets.flatMap(d => candidates[d.id].candidates.map(c => c));
const unique = [...new Map(jobs.map(c => [`${c.provider}:${c.id}`, c])).values()];
const todo = unique.filter(c => !cache[`${c.provider}:${c.id}`]);
console.log(`${unique.length} candidate photos (${todo.length} to embed, ${unique.length - todo.length} cached)`);

const failed = new Set();
let done = 0;
const POOL = 4;
const queue = [...todo];
await Promise.all(Array.from({ length: POOL }, async () => {
  while (queue.length) {
    const cand = queue.shift();
    try { await embedImage(cand); } catch (e) { failed.add(`${cand.provider}:${cand.id}`); console.warn(`  skip ${cand.id}: ${e.message}`); }
    if (++done % 100 === 0) { saveCache(); console.log(`  embedded ${done}/${todo.length}`); }
  }
}));
saveCache();

// --- Score ---
const score = (vec, ownIdx) => {
  const logits = classEmbeds.map(c => {
    let s = 0;
    for (let k = 0; k < vec.length; k++) s += vec[k] * c[k];
    return s * LOGIT_SCALE;
  });
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const own = exps[ownIdx] / sum;
  const negative = exps.slice(NEG_START).reduce((a, b) => a + b, 0) / sum;
  let rank = 1;
  for (let i = 0; i < NEG_START; i++) if (i !== ownIdx && logits[i] > logits[ownIdx]) rank++;
  let top = 0;
  for (let i = 1; i < NEG_START; i++) if (logits[i] > logits[top]) top = i;
  return { own, negative, rank, top: dishes[top].name };
};

const used = new Set(); // never give two dishes the same photo
const report = [];
const selections = {};

for (const d of targets) {
  const own = dishIndex.get(d.id);
  const scored = candidates[d.id].candidates
    .map((c, i) => ({ c, n: i + 1, v: cache[`${c.provider}:${c.id}`] }))
    .filter(x => x.v)
    .map(x => ({ n: x.n, cand: x.c, ...score(decode(x.v), own) }))
    .sort((a, b) => b.own - a.own);

  const usable = scored.filter(s => s.negative < 0.5 && !used.has(`${s.cand.provider}:${s.cand.id}`));
  const best = usable[0];
  let tier = 'review';
  if (best) {
    if (best.rank === 1 && best.own >= THRESHOLD) tier = 'auto';
    else if (best.rank <= 3 && best.own >= LIKELY_THRESHOLD) tier = 'likely';
  }
  if (best && (tier === 'auto' || (tier === 'likely' && INCLUDE_LIKELY))) {
    selections[d.id] = best.cand.full;
    used.add(`${best.cand.provider}:${best.cand.id}`);
  }
  report.push({
    id: d.id,
    name: d.name,
    tier,
    pick: best ? { candidate: best.n, p: +best.own.toFixed(3), rank: best.rank, topClass: best.top, alt: best.cand.alt } : null,
    ranked: scored.slice(0, 5).map(s => ({ candidate: s.n, p: +s.own.toFixed(3), rank: s.rank, nonFood: +s.negative.toFixed(2), thumb: s.cand.thumb })),
  });
}

fs.writeFileSync(OUT_SELECTIONS, JSON.stringify(selections, null, 2) + '\n');
fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2) + '\n');

const counts = { auto: 0, likely: 0, review: 0 };
for (const r of report) counts[r.tier]++;
console.log(`\nauto: ${counts.auto}   likely: ${counts.likely}   review: ${counts.review}`);
console.log(`Wrote ${Object.keys(selections).length} selections -> ${path.relative(ROOT, OUT_SELECTIONS)}`);
console.log(`Report -> ${path.relative(ROOT, OUT_REPORT)}`);

// --- Contact sheets for dishes that need a human ---
if (MAKE_SHEETS) {
  const needReview = report.filter(r => r.tier === 'review' || (r.tier === 'likely' && !INCLUDE_LIKELY));
  fs.rmSync(SHEETS_DIR, { recursive: true, force: true });
  if (needReview.length) {
    fs.mkdirSync(SHEETS_DIR, { recursive: true });
    const W = 200, H = 150, LABEL_W = 220, PER_SHEET = 6, COLS = 5;
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    for (let s = 0; s * PER_SHEET < needReview.length; s++) {
      const rows = needReview.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
      const comps = [];
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        comps.push({
          input: Buffer.from(`<svg width="${LABEL_W}" height="${H}"><text x="8" y="30" font-size="17" font-family="Arial" font-weight="bold">${esc(row.name)}</text><text x="8" y="52" font-size="13" font-family="Arial" fill="#666">${row.tier} (${row.pick ? row.pick.p : '-'})</text></svg>`),
          left: 0, top: r * H,
        });
        for (let i = 0; i < Math.min(COLS, row.ranked.length); i++) {
          const rk = row.ranked[i];
          try {
            const buf = Buffer.from(await (await fetch(rk.thumb)).arrayBuffer());
            const img = await sharp(buf).resize(W, H, { fit: 'cover' }).toBuffer();
            // Label = candidate number as shown in image-picker.html (and its 1-9 hotkeys)
            const tag = Buffer.from(`<svg width="${W}" height="${H}"><rect width="64" height="22" fill="black"/><text x="5" y="16" font-size="14" fill="white" font-family="Arial">#${rk.candidate} ${rk.p.toFixed(2)}</text></svg>`);
            comps.push({ input: await sharp(img).composite([{ input: tag }]).toBuffer(), left: LABEL_W + i * W, top: r * H });
          } catch { /* leave the cell blank */ }
        }
      }
      await sharp({ create: { width: LABEL_W + COLS * W, height: rows.length * H, channels: 3, background: '#fff' } })
        .composite(comps).jpeg({ quality: 80 }).toFile(path.join(SHEETS_DIR, `review-${String(s + 1).padStart(2, '0')}.jpg`));
    }
    console.log(`${needReview.length} dishes need a look -> ${path.relative(ROOT, SHEETS_DIR)}/ (cell label = candidate # in the picker)`);
  }
}

console.log('\nNext: spot-check the report, then `node scripts/apply-image-selections.mjs scripts/auto-selections.json`,');
console.log('      then `node scripts/compute-thumbhashes.mjs` and `npm run validate-foods`.');
