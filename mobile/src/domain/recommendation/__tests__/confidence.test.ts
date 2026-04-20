import { computeMatchConfidence } from '@/domain/recommendation/confidence';

describe('computeMatchConfidence', () => {
  it('returns 0 when all scores are identical (maximum entropy)', () => {
    const scores = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    expect(computeMatchConfidence(scores)).toBeCloseTo(0, 2);
  });

  it('returns close to 1 when one score dominates', () => {
    const scores = [0.99, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    expect(computeMatchConfidence(scores)).toBeGreaterThan(0.7);
  });

  it('stays in [0, 1]', () => {
    expect(computeMatchConfidence([0.3, 0.2, 0.1])).toBeGreaterThanOrEqual(0);
    expect(computeMatchConfidence([0.3, 0.2, 0.1])).toBeLessThanOrEqual(1);
  });

  it('returns 0 for empty input', () => {
    expect(computeMatchConfidence([])).toBe(0);
  });

  it('returns 1 for single-score input', () => {
    expect(computeMatchConfidence([0.8])).toBe(1);
  });
});
