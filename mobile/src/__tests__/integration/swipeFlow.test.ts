import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { usePreferencesStore } from '@/domain/preferences/store';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import { createDefaultEngine } from '@/domain/recommendation/defaultEngine';

describe('swipe flow integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSessionStore.setState(useSessionStore.getInitialState());
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
  });

  it('simulating 10 likes produces a non-empty Top-3 match', async () => {
    const engine = createDefaultEngine();
    const pool = dishRepository.filterByPreferences(usePreferencesStore.getState().preferences);
    expect(pool.length).toBeGreaterThanOrEqual(10);

    await useSessionStore.getState().startNewSession();
    for (let i = 0; i < 10; i++) {
      const session = useSessionStore.getState().session!;
      const remaining = pool.filter(d => !session.seenDishIds.includes(d.id));
      if (remaining.length === 0) break;
      const next = remaining[0]!;
      await useSessionStore.getState().recordSwipe(next, 'like');
      await useLikedHistoryStore.getState().recordLike(next.id, session.id);
    }

    const session = useSessionStore.getState().session!;
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    const match = engine.matchTop3(pool, ctx);
    expect(match.top3.length).toBeGreaterThanOrEqual(1);
    expect(match.top3[0]!.matchPercent).toBeGreaterThan(0);
  });

  it('preferences hard filters remove gluten-containing dishes', async () => {
    await usePreferencesStore.getState().setAllergens(['gluten']);
    const pool = dishRepository.filterByPreferences(usePreferencesStore.getState().preferences);
    for (const d of pool) {
      expect(d.contains.gluten).toBe(false);
    }
  });
});
