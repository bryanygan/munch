import { addVectors, dishToVector, scaleVector } from '@/shared/utils/vector';
import type { Dish } from '@/domain/dish/types';
import type { SwipeSession, CategoricalCounts } from './types';

export type SwipeDirection = 'like' | 'dislike';

const DISLIKE_WEIGHT = 0.3;

const updateCategoricalCounts = (
  counts: CategoricalCounts,
  dish: Dish,
  liked: boolean,
): CategoricalCounts => {
  const bump = (prev: { liked: number; seen: number }) => ({
    liked: prev.liked + (liked ? 1 : 0),
    seen: prev.seen + 1,
  });
  return {
    cuisine_region: {
      ...counts.cuisine_region,
      [dish.cuisine_region]: bump(counts.cuisine_region[dish.cuisine_region]),
    },
    meal_types: dish.meal_types.reduce(
      (acc, m) => ({ ...acc, [m]: bump(acc[m]) }),
      { ...counts.meal_types },
    ),
    textures: dish.textures.reduce(
      (acc, t) => ({ ...acc, [t]: bump(acc[t]) }),
      { ...counts.textures },
    ),
  };
};

export const applySwipe = (
  session: SwipeSession,
  dish: Dish,
  direction: SwipeDirection,
): SwipeSession => {
  const event = { dishId: dish.id, timestamp: Date.now() };
  const dishVec = dishToVector(dish);
  const delta = direction === 'like' ? dishVec : scaleVector(dishVec, -DISLIKE_WEIGHT);
  return {
    ...session,
    likes: direction === 'like' ? [...session.likes, event] : session.likes,
    dislikes: direction === 'dislike' ? [...session.dislikes, event] : session.dislikes,
    seenDishIds: [...session.seenDishIds, dish.id],
    tasteVector: addVectors(session.tasteVector, delta),
    categoricalCounts: updateCategoricalCounts(
      session.categoricalCounts,
      dish,
      direction === 'like',
    ),
  };
};
