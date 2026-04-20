/**
 * Supplementary tests to raise coverage on session/history.ts above 80%.
 * Covers: migrate error branch (corrupt storage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikedHistoryStore } from '@/domain/session/history';

describe('useLikedHistoryStore – coverage gaps', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
  });

  it('hydrate falls back to default when storage is corrupt', async () => {
    await AsyncStorage.setItem('munch:likedHistory', JSON.stringify({ invalid: true }));
    await useLikedHistoryStore.getState().hydrate();
    // corrupt data → Storage returns default → empty events
    expect(useLikedHistoryStore.getState().history.events).toEqual([]);
    expect(useLikedHistoryStore.getState().hydrated).toBe(true);
  });
});
