import type { Dish } from './types';
import type { Preferences } from '@/domain/preferences/types';

export class DishRepository {
  constructor(private readonly dishes: Dish[]) {}

  getAll(): Dish[] {
    return this.dishes;
  }

  findById(id: string): Dish | undefined {
    return this.dishes.find(d => d.id === id);
  }

  filterByPreferences(prefs: Preferences): Dish[] {
    const [minPrice, maxPrice] = prefs.priceRange;
    return this.dishes.filter(dish => {
      if (dish.price_tier < minPrice || dish.price_tier > maxPrice) return false;
      if (prefs.diet && !dish.diet_compatible.includes(prefs.diet)) return false;
      for (const allergen of prefs.allergens) {
        if (dish.contains[allergen]) return false;
      }
      return true;
    });
  }
}
