import { FlavorSimilarityScorer } from '@/domain/recommendation/scorers/flavorSimilarity';
import { createSwipeSession } from '@/domain/session/factory';
import { zeroVector } from '@/shared/utils/vector';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (flavor: Dish['flavor'], overrides: Partial<Dish> = {}): Dish => ({
  id: 'd', name: '', description: '', country: 'US', cuisine_region: 'north_american',
  flavor,
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_thumbhash: '', tags: [],
  ...overrides,
});

const ctx = (tasteVector: number[], d: Dish): ScoringContext => ({
  user: { tasteVector, categoricalCounts: createSwipeSession().categoricalCounts },
  dish: d,
  session: createSwipeSession(),
  now: new Date(),
});

describe('FlavorSimilarityScorer', () => {
  it('has id "flavor_similarity" and weight 0.7', () => {
    const s = new FlavorSimilarityScorer();
    expect(s.id).toBe('flavor_similarity');
    expect(s.weight).toBe(0.7);
  });

  it('returns popularity-based cold-start score when user has zero taste vector', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: 3, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 0 }, { popularity: 5 });
    const score = s.score(ctx(zeroVector(), d));
    expect(score).toBe(1);
  });

  it('returns cosine similarity when taste vector is non-zero', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: 4, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 });
    const score = s.score(ctx([4, 0, 0, 0, 0, 0, 0], d));
    expect(score).toBeCloseTo(1, 10);
  });

  it('returns within [0, 1]', () => {
    const s = new FlavorSimilarityScorer();
    const d = dish({ sweet: -10, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 } as any);
    const score = s.score(ctx([5, 5, 5, 5, 5, 5, 5], d));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
