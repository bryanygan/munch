import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

export class PopularityTieBreakerScorer implements Scorer {
  readonly id = 'popularity_tie_breaker';
  readonly weight = 0.05;

  score(ctx: ScoringContext): number {
    return ctx.dish.popularity / 5;
  }
}
