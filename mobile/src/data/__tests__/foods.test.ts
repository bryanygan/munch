import foods from '@/data/foods.json';
import type { Dish } from '@/domain/dish/types';
import { countryToRegion } from '@/data/cuisineRegions';

describe('foods.json', () => {
  it('has at least 20 dishes (MVP seed)', () => {
    expect(Array.isArray(foods)).toBe(true);
    expect(foods.length).toBeGreaterThanOrEqual(20);
  });

  it('every dish has a unique id', () => {
    const ids = (foods as Dish[]).map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every dish has all required fields', () => {
    const required = [
      'id', 'name', 'description', 'country', 'cuisine_region', 'flavor',
      'textures', 'meal_types', 'temperature', 'typical_time', 'contains',
      'diet_compatible', 'price_tier', 'prep_complexity', 'popularity',
      'image_url', 'image_thumbhash', 'tags',
    ];
    for (const dish of foods as Dish[]) {
      for (const field of required) {
        expect(dish).toHaveProperty(field);
      }
    }
  });

  it('every dish has flavor axes in range [0, 5]', () => {
    for (const dish of foods as Dish[]) {
      for (const axis of Object.values(dish.flavor)) {
        expect(axis).toBeGreaterThanOrEqual(0);
        expect(axis).toBeLessThanOrEqual(5);
      }
    }
  });

  it('every dish has cuisine_region matching its country', () => {
    for (const dish of foods as Dish[]) {
      const expected = countryToRegion(dish.country);
      if (expected) expect(dish.cuisine_region).toBe(expected);
    }
  });
});
