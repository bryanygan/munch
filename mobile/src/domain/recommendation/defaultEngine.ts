import { RecommendationEngine } from './engine';
import { FlavorSimilarityScorer } from './scorers/flavorSimilarity';
import { CategoricalAffinityScorer } from './scorers/categoricalAffinity';
import { PopularityTieBreakerScorer } from './scorers/popularityTieBreaker';

export const createDefaultEngine = (): RecommendationEngine =>
  new RecommendationEngine([
    new FlavorSimilarityScorer(),
    new CategoricalAffinityScorer(),
    new PopularityTieBreakerScorer(),
  ]);
