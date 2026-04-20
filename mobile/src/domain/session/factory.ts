import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { zeroVector } from '@/shared/utils/vector';
import type { CuisineRegion, MealType, Texture } from '@/domain/dish/types';
import type { CategoricalCounts, SwipeSession } from './types';

const CUISINE_REGIONS: CuisineRegion[] = [
  'east_asian', 'southeast_asian', 'south_asian', 'middle_eastern',
  'african', 'mediterranean', 'western_european', 'eastern_european',
  'nordic', 'north_american', 'latin_american', 'oceanic',
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const TEXTURES: Texture[] = ['crunchy', 'crispy', 'creamy', 'chewy', 'soft', 'juicy', 'flaky'];

export const emptyCategoricalCounts = (): CategoricalCounts => ({
  cuisine_region: Object.fromEntries(
    CUISINE_REGIONS.map(r => [r, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['cuisine_region'],
  meal_types: Object.fromEntries(
    MEAL_TYPES.map(m => [m, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['meal_types'],
  textures: Object.fromEntries(
    TEXTURES.map(t => [t, { liked: 0, seen: 0 }]),
  ) as CategoricalCounts['textures'],
});

export const createSwipeSession = (): SwipeSession => ({
  id: uuid(),
  startedAt: Date.now(),
  likes: [],
  dislikes: [],
  seenDishIds: [],
  tasteVector: zeroVector(),
  categoricalCounts: emptyCategoricalCounts(),
  status: 'active',
  likesTargetForNextMatch: 10,
  swipeCapForNextMatch: 40,
  matchRevealsShown: 0,
  schemaVersion: 1,
});
