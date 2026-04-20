import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikedHistoryStore } from '@/domain/session/history';

describe('useLikedHistoryStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
  });

  it('starts empty', () => {
    expect(useLikedHistoryStore.getState().history.events).toEqual([]);
  });

  it('recordLike appends event and persists', async () => {
    await useLikedHistoryStore.getState().recordLike('dish1', 'session1');
    expect(useLikedHistoryStore.getState().history.events).toHaveLength(1);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:likedHistory'))!);
    expect(stored.events).toHaveLength(1);
    expect(stored.events[0].dishId).toBe('dish1');
  });

  it('reset clears history', async () => {
    await useLikedHistoryStore.getState().recordLike('dish1', 's1');
    await useLikedHistoryStore.getState().reset();
    expect(useLikedHistoryStore.getState().history.events).toEqual([]);
  });

  it('hydrate restores from storage', async () => {
    await AsyncStorage.setItem('munch:likedHistory', JSON.stringify({
      events: [{ dishId: 'x', sessionId: 's', likedAt: 1 }],
      schemaVersion: 1,
    }));
    await useLikedHistoryStore.getState().hydrate();
    expect(useLikedHistoryStore.getState().history.events).toHaveLength(1);
  });
});
