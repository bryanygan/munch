/**
 * Supplementary tests to raise coverage on session/store.ts above 80%.
 * Covers: hydrate with real stored data, hydrate with corrupt data, and
 * guard branches (recordSwipe / completeWithMatch / continueSwiping with no session).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/domain/session/store';
import { createSwipeSession } from '@/domain/session/factory';

describe('useSessionStore – coverage gaps', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSessionStore.setState(useSessionStore.getInitialState());
  });

  it('hydrate restores a real previous session from storage', async () => {
    const session = createSwipeSession();
    // Simulate having swiped at least once so it counts as "real"
    const stored = { ...session, seenDishIds: ['dish1'], likes: ['dish1'] };
    await AsyncStorage.setItem('munch:session', JSON.stringify(stored));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().session).not.toBeNull();
    expect(useSessionStore.getState().hydrated).toBe(true);
  });

  it('hydrate returns null when stored session is empty (no interactions)', async () => {
    const session = createSwipeSession();
    // seenDishIds=[] likes=[] → treated as blank, reset to null
    await AsyncStorage.setItem('munch:session', JSON.stringify(session));
    await useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().hydrated).toBe(true);
  });

  it('hydrate falls back to null when storage is corrupt', async () => {
    await AsyncStorage.setItem('munch:session', JSON.stringify({ invalid: true }));
    await useSessionStore.getState().hydrate();
    // corrupt data → Storage returns default (empty session) → treated as blank → null
    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().hydrated).toBe(true);
  });

  it('recordSwipe is a no-op when there is no session', async () => {
    // session is null; should not throw
    const dish: any = { id: 'd1', name: 'X', description: '', country: 'TH',
      cuisine_region: 'east_asian', flavor: { sweet:0, sour:0, salty:0, bitter:0, umami:0, heat:0, richness:0 },
      textures: [], meal_types: [], temperature: 'any', typical_time: 'any',
      contains: { gluten:false, dairy:false, seafood:false, nuts:false, eggs:false, pork:false, beef:false, alcohol:false },
      diet_compatible: [], price_tier: 1, prep_complexity: 'low', popularity: 1,
      image_url: '', image_thumbhash: '', tags: [] };
    await expect(useSessionStore.getState().recordSwipe(dish, 'like')).resolves.not.toThrow();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('completeWithMatch is a no-op when there is no session', async () => {
    await expect(useSessionStore.getState().completeWithMatch({ top3: [], spread: 0 })).resolves.not.toThrow();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('continueSwiping is a no-op when there is no session', async () => {
    await expect(useSessionStore.getState().continueSwiping()).resolves.not.toThrow();
    expect(useSessionStore.getState().session).toBeNull();
  });
});
