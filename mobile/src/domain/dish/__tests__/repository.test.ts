import { DishRepository } from '@/domain/dish/repository';
import type { Dish } from '@/domain/dish/types';
import type { Preferences } from '@/domain/preferences/types';

const makeDish = (overrides: Partial<Dish> = {}): Dish => ({
  id: overrides.id ?? 'd1', name: 'Test', description: '',
  country: 'US', cuisine_region: 'north_american',
  flavor: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: [], meal_types: [], temperature: 'room', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: [], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_blurhash: '', tags: [],
  ...overrides,
});

const prefs = (p: Partial<Preferences> = {}): Preferences => ({
  allergens: [], diet: null, priceRange: [1, 4],
  onboardingCompleted: true, schemaVersion: 1,
  ...p,
});

describe('DishRepository', () => {
  it('loads all dishes', () => {
    const dishes = [makeDish({ id: 'a' }), makeDish({ id: 'b' })];
    const repo = new DishRepository(dishes);
    expect(repo.getAll()).toHaveLength(2);
  });

  it('filters out dishes containing declared allergens', () => {
    const dishes = [
      makeDish({ id: 'has-gluten', contains: { gluten: true, dairy: false, seafood: false, nuts: false, eggs: false, pork: false, beef: false, alcohol: false } }),
      makeDish({ id: 'no-gluten' }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ allergens: ['gluten'] }));
    expect(result.map(d => d.id)).toEqual(['no-gluten']);
  });

  it('filters out dishes incompatible with diet', () => {
    const dishes = [
      makeDish({ id: 'non-vegan', diet_compatible: [] }),
      makeDish({ id: 'vegan', diet_compatible: ['vegan', 'vegetarian'] }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ diet: 'vegan' }));
    expect(result.map(d => d.id)).toEqual(['vegan']);
  });

  it('filters by price range inclusive', () => {
    const dishes = [
      makeDish({ id: 'cheap', price_tier: 1 }),
      makeDish({ id: 'mid', price_tier: 2 }),
      makeDish({ id: 'pricey', price_tier: 4 }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({ priceRange: [1, 2] }));
    expect(result.map(d => d.id).sort()).toEqual(['cheap', 'mid']);
  });

  it('applies multiple filters together', () => {
    const dishes = [
      makeDish({ id: 'keep', price_tier: 2, diet_compatible: ['vegetarian'] }),
      makeDish({ id: 'wrong-price', price_tier: 4, diet_compatible: ['vegetarian'] }),
      makeDish({ id: 'wrong-diet', price_tier: 2, diet_compatible: [] }),
    ];
    const repo = new DishRepository(dishes);
    const result = repo.filterByPreferences(prefs({
      diet: 'vegetarian',
      priceRange: [1, 3],
    }));
    expect(result.map(d => d.id)).toEqual(['keep']);
  });

  it('findById returns the dish or undefined', () => {
    const dishes = [makeDish({ id: 'a' })];
    const repo = new DishRepository(dishes);
    expect(repo.findById('a')?.id).toBe('a');
    expect(repo.findById('missing')).toBeUndefined();
  });
});
