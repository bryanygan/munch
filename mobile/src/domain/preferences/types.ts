import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';

export type Preferences = {
  allergens: AllergenKey[];
  diet: Diet | null;
  priceRange: [PriceTier, PriceTier];
  onboardingCompleted: boolean;
  schemaVersion: 1;
};

export const DEFAULT_PREFERENCES: Preferences = {
  allergens: [],
  diet: null,
  priceRange: [1, 4],
  onboardingCompleted: false,
  schemaVersion: 1,
};
