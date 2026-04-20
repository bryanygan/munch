import { applySwipe } from '@/domain/session/mutations';
import { createSwipeSession } from '@/domain/session/factory';
import type { Dish } from '@/domain/dish/types';

const d = (overrides: Partial<Dish> = {}): Dish => ({
  id: overrides.id ?? 'd1', name: 'D', description: '',
  country: 'TH', cuisine_region: 'southeast_asian',
  flavor: { sweet: 4, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 2 },
  textures: ['creamy'], meal_types: ['dessert'],
  temperature: 'cold', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegetarian'], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

describe('applySwipe', () => {
  it('appends to likes on right swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'like');
    expect(next.likes).toHaveLength(1);
    expect(next.dislikes).toHaveLength(0);
    expect(next.likes[0].dishId).toBe('d1');
  });

  it('appends to dislikes on left swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'dislike');
    expect(next.dislikes).toHaveLength(1);
    expect(next.likes).toHaveLength(0);
  });

  it('adds dish vector fully on like', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ flavor: { sweet: 4, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 2 } }), 'like');
    expect(next.tasteVector).toEqual([4, 1, 1, 0, 0, 0, 2]);
  });

  it('subtracts dish vector at 30% weight on dislike', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ flavor: { sweet: 10, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 } }), 'dislike');
    expect(next.tasteVector[0]).toBeCloseTo(-3, 10);
  });

  it('adds dish id to seenDishIds', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d({ id: 'abc' }), 'like');
    expect(next.seenDishIds).toEqual(['abc']);
  });

  it('increments categorical seen counter on any swipe', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'dislike');
    expect(next.categoricalCounts.cuisine_region.southeast_asian.seen).toBe(1);
    expect(next.categoricalCounts.cuisine_region.southeast_asian.liked).toBe(0);
    expect(next.categoricalCounts.meal_types.dessert.seen).toBe(1);
    expect(next.categoricalCounts.textures.creamy.seen).toBe(1);
  });

  it('increments categorical liked counter on like', () => {
    const s = createSwipeSession();
    const next = applySwipe(s, d(), 'like');
    expect(next.categoricalCounts.cuisine_region.southeast_asian.liked).toBe(1);
    expect(next.categoricalCounts.meal_types.dessert.liked).toBe(1);
  });

  it('does not mutate the input session', () => {
    const s = createSwipeSession();
    const originalLikes = s.likes;
    applySwipe(s, d(), 'like');
    expect(s.likes).toBe(originalLikes);
    expect(s.likes).toHaveLength(0);
  });
});
