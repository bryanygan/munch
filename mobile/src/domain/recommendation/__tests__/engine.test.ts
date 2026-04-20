import { RecommendationEngine } from '@/domain/recommendation/engine';
import { FlavorSimilarityScorer } from '@/domain/recommendation/scorers/flavorSimilarity';
import { CategoricalAffinityScorer } from '@/domain/recommendation/scorers/categoricalAffinity';
import { PopularityTieBreakerScorer } from '@/domain/recommendation/scorers/popularityTieBreaker';
import { createSwipeSession } from '@/domain/session/factory';
import type { Dish, CuisineRegion } from '@/domain/dish/types';
import type { Scorer } from '@/domain/recommendation/types';

const dish = (id: string, popularity: 1|2|3|4|5 = 3, region: CuisineRegion = 'north_american'): Dish => ({
  id, name: id, description: '',
  country: 'US', cuisine_region: region,
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity, image_url: '', image_blurhash: '', tags: [],
});

const session = createSwipeSession();
const baseCtx = { user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts }, session, now: new Date() };

describe('RecommendationEngine', () => {
  it('ranks dishes by combined score (popularity breaks ties at cold start)', () => {
    const engine = new RecommendationEngine([
      new FlavorSimilarityScorer(),
      new CategoricalAffinityScorer(),
      new PopularityTieBreakerScorer(),
    ]);
    const dishes = [dish('low', 1), dish('high', 5), dish('mid', 3)];
    const ranked = engine.rankDishes(dishes, baseCtx);
    expect(ranked[0].dish.id).toBe('high');
    expect(ranked[2].dish.id).toBe('low');
  });

  it('matchTop3 returns top 3 by score with percents', () => {
    const engine = new RecommendationEngine([
      new FlavorSimilarityScorer(),
    ]);
    const dishes = [dish('a', 5), dish('b', 4), dish('c', 3), dish('d', 2)];
    const match = engine.matchTop3(dishes, baseCtx);
    expect(match.top3).toHaveLength(3);
    expect(match.top3[0].dish.id).toBe('a');
    expect(match.top3[0].matchPercent).toBe(100);
    expect(match.top3[2].dish.id).toBe('c');
    expect(match.spread).toBeCloseTo(0.4, 10);
  });

  it('handles empty candidate list in matchTop3 gracefully', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    expect(engine.matchTop3([], baseCtx).top3).toEqual([]);
  });

  it('nextDish picks from top 20% (deterministic with rng injection)', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    const dishes = Array.from({ length: 10 }, (_, i) => dish(`d${i}`, (5 - Math.floor(i / 2)) as any));
    // Inject rng that always picks index 0 of the shuffled top slice
    const next = engine.nextDish(dishes, baseCtx, () => 0);
    expect(dishes.slice(0, 2).map(d => d.id)).toContain(next.id);
  });

  it('nextDish throws when candidate list is empty', () => {
    const engine = new RecommendationEngine([new FlavorSimilarityScorer()]);
    expect(() => engine.nextDish([], baseCtx)).toThrow();
  });

  it('combines scores by weight', () => {
    const s1: Scorer = { id: 'a', weight: 0.5, score: () => 1 };
    const s2: Scorer = { id: 'b', weight: 0.5, score: () => 0 };
    const engine = new RecommendationEngine([s1, s2]);
    const ranked = engine.rankDishes([dish('x')], baseCtx);
    expect(ranked[0].score).toBeCloseTo(0.5, 10);
  });
});
