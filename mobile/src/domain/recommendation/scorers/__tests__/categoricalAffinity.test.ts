import { CategoricalAffinityScorer } from '@/domain/recommendation/scorers/categoricalAffinity';
import { createSwipeSession } from '@/domain/session/factory';
import type { ScoringContext } from '@/domain/recommendation/types';
import type { Dish } from '@/domain/dish/types';

const dish = (overrides: Partial<Dish> = {}): Dish => ({
  id: 'd', name: '', description: '',
  country: 'TH', cuisine_region: 'southeast_asian',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: ['creamy'], meal_types: ['dessert'],
  temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_thumbhash: '', tags: [],
  ...overrides,
});

describe('CategoricalAffinityScorer', () => {
  it('has id "categorical_affinity" and weight 0.3', () => {
    const s = new CategoricalAffinityScorer();
    expect(s.id).toBe('categorical_affinity');
    expect(s.weight).toBe(0.3);
  });

  it('returns 0.5 when nothing has been seen (neutral)', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeCloseTo(0.5, 10);
  });

  it('scores higher when liked region ratio is high', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 4, seen: 5 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeGreaterThan(0.5);
  });

  it('averages region, meal_type, and texture scores', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    // region: 1.0, meal_type dessert: 0.5 (unseen), texture creamy: 0.0 → avg = 0.5
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 2, seen: 2 };
    session.categoricalCounts.textures.creamy = { liked: 0, seen: 5 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    expect(s.score(ctx)).toBeCloseTo(0.5, 10);
  });

  it('stays in [0, 1]', () => {
    const s = new CategoricalAffinityScorer();
    const session = createSwipeSession();
    session.categoricalCounts.cuisine_region.southeast_asian = { liked: 100, seen: 100 };
    const d = dish();
    const ctx: ScoringContext = {
      user: { tasteVector: [0,0,0,0,0,0,0], categoricalCounts: session.categoricalCounts },
      dish: d, session, now: new Date(),
    };
    const result = s.score(ctx);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
