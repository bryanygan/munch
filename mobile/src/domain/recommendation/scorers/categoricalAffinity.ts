import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

const DEFAULT_UNSEEN = 0.5;

const ratio = (counts: { liked: number; seen: number }): number =>
  counts.seen === 0 ? DEFAULT_UNSEEN : counts.liked / counts.seen;

const avg = (values: number[]): number =>
  values.length === 0 ? DEFAULT_UNSEEN : values.reduce((a, b) => a + b, 0) / values.length;

export class CategoricalAffinityScorer implements Scorer {
  readonly id = 'categorical_affinity';
  readonly weight = 0.3;

  score(ctx: ScoringContext): number {
    const { dish, user } = ctx;
    const regionScore = ratio(user.categoricalCounts.cuisine_region[dish.cuisine_region]);
    const mealScores = dish.meal_types.map(m => ratio(user.categoricalCounts.meal_types[m]));
    const textureScores = dish.textures.map(t => ratio(user.categoricalCounts.textures[t]));
    return avg([regionScore, avg(mealScores), avg(textureScores)]);
  }
}
