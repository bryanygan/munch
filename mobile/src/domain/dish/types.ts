export type CountryCode = string; // ISO 3166-1 alpha-2, e.g., "TH", "JP"

export type CuisineRegion =
  | 'east_asian' | 'southeast_asian' | 'south_asian'
  | 'middle_eastern' | 'african' | 'mediterranean'
  | 'western_european' | 'eastern_european' | 'nordic'
  | 'north_american' | 'latin_american' | 'oceanic';

export type Texture =
  | 'crunchy' | 'crispy' | 'creamy' | 'chewy' | 'soft' | 'juicy' | 'flaky';

export type MealType =
  | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type Diet =
  | 'vegan' | 'vegetarian' | 'pescatarian' | 'halal' | 'kosher';

export type AllergenKey =
  | 'gluten' | 'dairy' | 'seafood' | 'nuts'
  | 'eggs' | 'pork' | 'beef' | 'alcohol';

export type PriceTier = 1 | 2 | 3 | 4;

export type FlavorProfile = {
  sweet: number;   // 0-5 continuous
  sour: number;
  salty: number;
  bitter: number;
  umami: number;
  heat: number;
  richness: number;
};

export type Dish = {
  id: string;
  name: string;
  description: string;
  country: CountryCode;
  cuisine_region: CuisineRegion;
  flavor: FlavorProfile;
  textures: Texture[];
  meal_types: MealType[];
  temperature: 'hot' | 'cold' | 'room';
  typical_time: 'morning' | 'afternoon' | 'evening' | 'late_night' | 'any';
  contains: Record<AllergenKey, boolean>;
  diet_compatible: Diet[];
  price_tier: PriceTier;
  prep_complexity: 'low' | 'medium' | 'high';
  popularity: 1 | 2 | 3 | 4 | 5;
  image_url: string;
  image_blurhash: string;
  tags: string[];
};

export const FLAVOR_KEYS = [
  'sweet', 'sour', 'salty', 'bitter', 'umami', 'heat', 'richness',
] as const satisfies readonly (keyof FlavorProfile)[];

export type FlavorVector = number[]; // length 7, in FLAVOR_KEYS order
