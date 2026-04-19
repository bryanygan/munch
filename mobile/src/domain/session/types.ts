import type {
  CuisineRegion, MealType, Texture, FlavorVector, Dish,
} from '@/domain/dish/types';

export type LikeEvent = {
  dishId: string;
  timestamp: number;
};

export type CategoricalCounts = {
  cuisine_region: Record<CuisineRegion, { liked: number; seen: number }>;
  meal_types: Record<MealType, { liked: number; seen: number }>;
  textures: Record<Texture, { liked: number; seen: number }>;
};

export type MatchEntry = {
  dish: Dish;
  matchPercent: number;
};

export type MatchResult = {
  top3: MatchEntry[];
  spread: number;
};

export type SwipeSession = {
  id: string;
  startedAt: number;
  likes: LikeEvent[];
  dislikes: LikeEvent[];
  seenDishIds: string[];
  tasteVector: FlavorVector;
  categoricalCounts: CategoricalCounts;
  status: 'active' | 'completed';
  completedMatch?: MatchResult;
  likesTargetForNextMatch: number;
  swipeCapForNextMatch: number;
  matchRevealsShown: number;
  schemaVersion: 1;
};

export type LikedHistory = {
  events: Array<{ dishId: string; sessionId: string; likedAt: number }>;
  schemaVersion: 1;
};
