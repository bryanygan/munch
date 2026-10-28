import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/domain/session/store';
import type { Dish } from '@/domain/dish/types';

const testDish: Dish = {
  id: 'd1', name: 'Test', description: '', country: 'TH',
  cuisine_region: 'southeast_asian',
  flavor: { sweet: 3, sour: 1, salty: 1, bitter: 0, umami: 0, heat: 0, richness: 0 },
  textures: ['chewy'], meal_types: ['dessert'],
  temperature: 'cold', typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegetarian'], price_tier: 2, prep_complexity: 'low',
  popularity: 3, image_url: '', image_thumbhash: '', tags: [],
};

describe('useSessionStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSessionStore.setState(useSessionStore.getInitialState());
  });

  it('starts with no session', () => {
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('startNewSession creates one', async () => {
    await useSessionStore.getState().startNewSession();
    expect(useSessionStore.getState().session?.status).toBe('active');
  });

  it('recordSwipe updates likes and persists', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().recordSwipe(testDish, 'like');
    expect(useSessionStore.getState().session?.likes).toHaveLength(1);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:session'))!);
    expect(stored.likes).toHaveLength(1);
  });

  it('completeWithMatch marks session completed', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().completeWithMatch({
      top3: [], spread: 0,
    });
    expect(useSessionStore.getState().session?.status).toBe('completed');
    expect(useSessionStore.getState().session?.matchRevealsShown).toBe(1);
  });

  it('continueSwiping resets session for a fresh round', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().recordSwipe(testDish, 'like');
    await useSessionStore.getState().completeWithMatch({ top3: [], spread: 0 });
    await useSessionStore.getState().continueSwiping();
    const s = useSessionStore.getState().session!;
    expect(s.status).toBe('active');
    expect(s.likesTargetForNextMatch).toBe(10);
    expect(s.swipeCapForNextMatch).toBe(40);
    expect(s.seenDishIds).toEqual([]);
    expect(s.likes).toEqual([]);
    expect(s.dislikes).toEqual([]);
    // Taste vector preserved from the swipe above (non-zero in at least one axis)
    expect(s.tasteVector.some(v => v !== 0)).toBe(true);
  });

  it('resetSession clears it', async () => {
    await useSessionStore.getState().startNewSession();
    await useSessionStore.getState().resetSession();
    expect(useSessionStore.getState().session).toBeNull();
  });
});
