import fc from 'fast-check';
import {
  addVectors, scaleVector, normalize, cosineSimilarity, dishToVector, zeroVector,
} from '@/shared/utils/vector';
import type { Dish } from '@/domain/dish/types';

const makeDish = (flavor: Partial<Dish['flavor']> = {}): Dish => ({
  id: 'test', name: 'Test', description: '',
  country: 'US', cuisine_region: 'north_american',
  flavor: {
    sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0,
    ...flavor,
  },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 1, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
});

describe('zeroVector', () => {
  it('returns 7 zeros', () => {
    expect(zeroVector()).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('addVectors', () => {
  it('adds elementwise', () => {
    expect(addVectors([1, 2, 3, 0, 0, 0, 0], [4, 5, 6, 0, 0, 0, 0]))
      .toEqual([5, 7, 9, 0, 0, 0, 0]);
  });
});

describe('scaleVector', () => {
  it('multiplies each element by scalar', () => {
    expect(scaleVector([1, 2, 3, 0, 0, 0, 0], 2)).toEqual([2, 4, 6, 0, 0, 0, 0]);
  });
});

describe('normalize', () => {
  it('returns unit vector', () => {
    const n = normalize([3, 4, 0, 0, 0, 0, 0]);
    const mag = Math.sqrt(n.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 10);
  });

  it('returns zero vector when input is zero', () => {
    expect(normalize([0, 0, 0, 0, 0, 0, 0])).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('is idempotent for non-zero vectors', () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -10, max: 10, noNaN: true }), { minLength: 7, maxLength: 7 }),
      (v) => {
        const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        if (mag === 0) return;
        const once = normalize(v);
        const twice = normalize(once);
        once.forEach((val, i) => expect(twice[i]).toBeCloseTo(val, 10));
      },
    ));
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3, 0, 0, 0, 0], [1, 2, 3, 0, 0, 0, 0])).toBeCloseTo(1, 10);
  });

  it('returns 0.5 for orthogonal vectors (mapped from 0)', () => {
    // Raw cosine 0 → mapped to 0.5 to keep range [0,1]
    expect(cosineSimilarity([1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0])).toBeCloseTo(0.5, 10);
  });

  it('returns 0 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0, 0, 0, 0, 0, 0], [-1, 0, 0, 0, 0, 0, 0])).toBeCloseTo(0, 10);
  });

  it('returns 0.5 when either vector is zero (no information)', () => {
    expect(cosineSimilarity([0, 0, 0, 0, 0, 0, 0], [1, 2, 3, 0, 0, 0, 0])).toBe(0.5);
  });

  it('stays in [0, 1]', () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -5, max: 5, noNaN: true }), { minLength: 7, maxLength: 7 }),
      fc.array(fc.float({ min: -5, max: 5, noNaN: true }), { minLength: 7, maxLength: 7 }),
      (a, b) => {
        const s = cosineSimilarity(a, b);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      },
    ));
  });
});

describe('dishToVector', () => {
  it('extracts flavor in FLAVOR_KEYS order', () => {
    const d = makeDish({ sweet: 4, sour: 1, salty: 2, bitter: 0, umami: 3, heat: 1, richness: 2 });
    expect(dishToVector(d)).toEqual([4, 1, 2, 0, 3, 1, 2]);
  });
});
