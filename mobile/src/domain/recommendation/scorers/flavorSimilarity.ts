import { cosineSimilarity, dishToVector } from '@/shared/utils/vector';
import type { Scorer, ScoringContext } from '@/domain/recommendation/types';

export class FlavorSimilarityScorer implements Scorer {
  readonly id = 'flavor_similarity';
  readonly weight = 0.7;

  score(ctx: ScoringContext): number {
    const hasTaste = ctx.user.tasteVector.some(v => v !== 0);
    if (!hasTaste) {
      // Cold-start: use popularity as proxy
      return ctx.dish.popularity / 5;
    }
    return cosineSimilarity(ctx.user.tasteVector, dishToVector(ctx.dish));
  }
}
