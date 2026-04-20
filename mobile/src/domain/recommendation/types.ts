import type { Dish, FlavorVector } from '@/domain/dish/types';
import type { SwipeSession, CategoricalCounts, MatchResult } from '@/domain/session/types';

export type GeoPoint = { latitude: number; longitude: number };

export type ScoringContext = {
  user: {
    tasteVector: FlavorVector;
    categoricalCounts: CategoricalCounts;
  };
  dish: Dish;
  session: SwipeSession;
  now: Date;
  location?: GeoPoint;
};

export interface Scorer {
  readonly id: string;
  readonly weight: number;
  score(ctx: ScoringContext): number; // Must return [0, 1]
}

export type Ranking = {
  dish: Dish;
  score: number;
};

export type { MatchResult };
