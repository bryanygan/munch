// Run from repo root: node scripts/validate-foods.mjs
// Validates mobile/src/data/foods.json against the Dish schema + consistency rules.
// Exits non-zero on any failure. Used by CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOODS_PATH = path.join(__dirname, '..', 'mobile', 'src', 'data', 'foods.json');
const REGIONS_PATH = path.join(__dirname, '..', 'mobile', 'src', 'data', 'cuisineRegions.ts');

const REQUIRED_FIELDS = [
  'id', 'name', 'description', 'country', 'cuisine_region', 'flavor',
  'textures', 'meal_types', 'temperature', 'typical_time', 'contains',
  'diet_compatible', 'price_tier', 'prep_complexity', 'popularity',
  'image_url', 'image_thumbhash', 'tags',
];

const FLAVOR_KEYS = ['sweet', 'sour', 'salty', 'bitter', 'umami', 'heat', 'richness'];
const TEXTURES = new Set(['crunchy', 'crispy', 'creamy', 'chewy', 'soft', 'juicy', 'flaky']);
const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);
const TEMPERATURES = new Set(['hot', 'cold', 'room']);
const TYPICAL_TIMES = new Set(['morning', 'afternoon', 'evening', 'late_night', 'any']);
const DIETS = new Set(['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher']);
const ALLERGEN_KEYS = ['gluten', 'dairy', 'seafood', 'nuts', 'eggs', 'pork', 'beef', 'alcohol'];
const PREP = new Set(['low', 'medium', 'high']);

// Load country→region map from the TS source
const regionsSrc = fs.readFileSync(REGIONS_PATH, 'utf-8');
const countryToRegion = {};
const mappingMatches = regionsSrc.matchAll(/([A-Z]{2}):\s*'(\w+)'/g);
for (const m of mappingMatches) countryToRegion[m[1]] = m[2];

const errors = [];
const warnings = [];
const err = (dishId, msg) => errors.push(`[${dishId}] ${msg}`);
const warn = (dishId, msg) => warnings.push(`[${dishId}] ${msg}`);

const dishes = JSON.parse(fs.readFileSync(FOODS_PATH, 'utf-8'));

if (!Array.isArray(dishes)) {
  console.error('foods.json must be an array');
  process.exit(1);
}

const seenIds = new Set();
for (const dish of dishes) {
  const id = dish?.id ?? '<no id>';

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in dish)) err(id, `missing field: ${field}`);
  }

  // Unique IDs
  if (seenIds.has(id)) err(id, `duplicate id`);
  seenIds.add(id);

  // id format
  if (typeof id !== 'string' || !/^[a-z0-9_]+$/.test(id)) {
    err(id, `id must be snake_case: "${id}"`);
  }

  // Flavor axes
  if (dish.flavor) {
    for (const k of FLAVOR_KEYS) {
      const v = dish.flavor[k];
      if (typeof v !== 'number') err(id, `flavor.${k} must be a number, got ${typeof v}`);
      else if (v < 0 || v > 5) err(id, `flavor.${k}=${v} out of [0,5]`);
    }
    const extraFlavor = Object.keys(dish.flavor).filter(k => !FLAVOR_KEYS.includes(k));
    if (extraFlavor.length) err(id, `unexpected flavor keys: ${extraFlavor.join(', ')}`);
  }

  // Textures
  if (Array.isArray(dish.textures)) {
    if (dish.textures.length === 0) warn(id, 'has no textures');
    for (const t of dish.textures) {
      if (!TEXTURES.has(t)) err(id, `invalid texture: ${t}`);
    }
  }

  // Meal types
  if (Array.isArray(dish.meal_types)) {
    if (dish.meal_types.length === 0) err(id, 'has no meal_types');
    for (const m of dish.meal_types) {
      if (!MEAL_TYPES.has(m)) err(id, `invalid meal_type: ${m}`);
    }
  }

  // Temperature
  if (dish.temperature && !TEMPERATURES.has(dish.temperature)) {
    err(id, `invalid temperature: ${dish.temperature}`);
  }

  // Typical time
  if (dish.typical_time && !TYPICAL_TIMES.has(dish.typical_time)) {
    err(id, `invalid typical_time: ${dish.typical_time}`);
  }

  // Contains
  if (dish.contains) {
    for (const k of ALLERGEN_KEYS) {
      if (typeof dish.contains[k] !== 'boolean') {
        err(id, `contains.${k} must be boolean, got ${typeof dish.contains[k]}`);
      }
    }
  }

  // Diet compatible
  if (Array.isArray(dish.diet_compatible)) {
    for (const d of dish.diet_compatible) {
      if (!DIETS.has(d)) err(id, `invalid diet: ${d}`);
    }
  }

  // Price tier
  if (![1, 2, 3, 4].includes(dish.price_tier)) {
    err(id, `price_tier must be 1|2|3|4, got ${dish.price_tier}`);
  }

  // Prep complexity
  if (!PREP.has(dish.prep_complexity)) {
    err(id, `invalid prep_complexity: ${dish.prep_complexity}`);
  }

  // Popularity
  if (!Number.isInteger(dish.popularity) || dish.popularity < 1 || dish.popularity > 5) {
    err(id, `popularity must be 1..5, got ${dish.popularity}`);
  }

  // Country + region consistency
  if (typeof dish.country === 'string') {
    const expected = countryToRegion[dish.country.toUpperCase()];
    if (expected && dish.cuisine_region !== expected) {
      err(id, `cuisine_region=${dish.cuisine_region} doesn't match country ${dish.country} (expected ${expected})`);
    }
  }

  // Image URL
  if (typeof dish.image_url === 'string') {
    if (!/^https?:\/\//.test(dish.image_url)) err(id, `image_url must be http(s): ${dish.image_url}`);
  }

  // Sanity: desserts shouldn't have heat
  if (dish.meal_types?.includes('dessert') && dish.flavor?.heat > 1) {
    warn(id, `dessert with heat=${dish.flavor.heat} — unusual`);
  }
}

// Report
console.log(`Validated ${dishes.length} dishes.`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('\nAll checks passed.');
