import { FLAVOR_KEYS, type FlavorVector, type Dish } from '@/domain/dish/types';

export const zeroVector = (): FlavorVector => [0, 0, 0, 0, 0, 0, 0];

export const addVectors = (a: FlavorVector, b: FlavorVector): FlavorVector =>
  a.map((v, i) => v + (b[i] ?? 0));

export const scaleVector = (v: FlavorVector, s: number): FlavorVector =>
  v.map(x => x * s);

const magnitude = (v: FlavorVector): number =>
  Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

export const normalize = (v: FlavorVector): FlavorVector => {
  const mag = magnitude(v);
  return mag === 0 ? zeroVector() : v.map(x => x / mag);
};

/**
 * Returns cosine similarity mapped to [0, 1] (raw [-1,1] shifted and scaled).
 * Zero vectors return 0.5 (no information).
 */
export const cosineSimilarity = (a: FlavorVector, b: FlavorVector): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0.5;
  const dot = a.reduce((sum, x, i) => sum + x * (b[i] ?? 0), 0);
  const raw = dot / (magA * magB);
  return (raw + 1) / 2;
};

export const dishToVector = (dish: Dish): FlavorVector =>
  FLAVOR_KEYS.map(k => dish.flavor[k]);
