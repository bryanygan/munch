import { createSwipeSession, emptyCategoricalCounts } from '@/domain/session/factory';
import { zeroVector } from '@/shared/utils/vector';

describe('createSwipeSession', () => {
  it('returns a fresh session with zero taste vector', () => {
    const s = createSwipeSession();
    expect(s.status).toBe('active');
    expect(s.likes).toEqual([]);
    expect(s.dislikes).toEqual([]);
    expect(s.seenDishIds).toEqual([]);
    expect(s.tasteVector).toEqual(zeroVector());
    expect(s.likesTargetForNextMatch).toBe(10);
    expect(s.swipeCapForNextMatch).toBe(40);
    expect(s.matchRevealsShown).toBe(0);
  });

  it('assigns a unique id per session', () => {
    const a = createSwipeSession();
    const b = createSwipeSession();
    expect(a.id).not.toBe(b.id);
  });
});

describe('emptyCategoricalCounts', () => {
  it('has all regions zeroed', () => {
    const c = emptyCategoricalCounts();
    expect(c.cuisine_region.east_asian).toEqual({ liked: 0, seen: 0 });
    expect(c.cuisine_region.southeast_asian).toEqual({ liked: 0, seen: 0 });
  });

  it('has all meal_types zeroed', () => {
    const c = emptyCategoricalCounts();
    expect(c.meal_types.breakfast).toEqual({ liked: 0, seen: 0 });
    expect(c.meal_types.dessert).toEqual({ liked: 0, seen: 0 });
  });
});
