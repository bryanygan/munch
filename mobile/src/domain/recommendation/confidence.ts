/**
 * Compute match confidence from the top-N dish scores.
 * Returns 1 - normalized entropy. When scores are spread evenly,
 * entropy is max and confidence is low. When one score dominates,
 * entropy is low and confidence is high.
 */
export const computeMatchConfidence = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return 1;
  const sum = scores.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const probs = scores.map(s => s / sum);
  const entropy = -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log(p) : 0), 0);
  const maxEntropy = Math.log(scores.length);
  return 1 - entropy / maxEntropy;
};
