import { PopularityTieBreakerScorer } from '@/domain/recommendation/scorers/popularityTieBreaker';
import { createSwipeSession } from '@/domain/session/factory';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (pop: 1|2|3|4|5): Dish => ({
  id: 'd', name: '', description: '', country: 'US', cuisine_region: 'north_american',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: pop, image_url: '', image_blurhash: '', tags: [],
});

describe('PopularityTieBreakerScorer', () => {
  it('has id and small weight 0.05', () => {
    const s = new PopularityTieBreakerScorer();
    expect(s.id).toBe('popularity_tie_breaker');
    expect(s.weight).toBe(0.05);
  });

  it('returns popularity / 5', () => {
    const s = new PopularityTieBreakerScorer();
    const session = createSwipeSession();
    const ctx = (d: Dish): ScoringContext => ({
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    });
    expect(s.score(ctx(dish(1)))).toBe(0.2);
    expect(s.score(ctx(dish(5)))).toBe(1);
  });
});
