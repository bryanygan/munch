import type { Dish } from '@/domain/dish/types';
import type { MatchResult, Ranking, Scorer, ScoringContext } from './types';

export class RecommendationEngine {
  constructor(private readonly scorers: Scorer[]) {
    if (scorers.length === 0) throw new Error('RecommendationEngine requires at least one scorer');
  }

  private computeScore(ctx: ScoringContext): number {
    let totalWeight = 0;
    let weighted = 0;
    for (const scorer of this.scorers) {
      weighted += scorer.score(ctx) * scorer.weight;
      totalWeight += scorer.weight;
    }
    return totalWeight === 0 ? 0 : weighted / totalWeight;
  }

  rankDishes(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
  ): Ranking[] {
    return candidates
      .map(dish => ({ dish, score: this.computeScore({ ...ctx, dish }) }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Picks from the top 20% with weighted randomness. Pass a custom rng
   * (function returning [0,1)) for testing; defaults to Math.random.
   */
  nextDish(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
    rng: () => number = Math.random,
  ): Dish {
    if (candidates.length === 0) throw new Error('nextDish: no candidates');
    const ranked = this.rankDishes(candidates, ctx);
    const sliceSize = Math.max(3, Math.floor(ranked.length * 0.2));
    const topSlice = ranked.slice(0, Math.min(sliceSize, ranked.length));
    const idx = Math.floor(rng() * topSlice.length);
    return topSlice[idx].dish;
  }

  matchTop3(
    candidates: Dish[],
    ctx: Omit<ScoringContext, 'dish'>,
  ): MatchResult {
    const ranked = this.rankDishes(candidates, ctx);
    const top3 = ranked.slice(0, 3).map(r => ({
      dish: r.dish,
      matchPercent: Math.round(r.score * 100),
    }));
    const spread = ranked.length >= 3 ? ranked[0].score - ranked[2].score : 0;
    return { top3, spread };
  }
}
