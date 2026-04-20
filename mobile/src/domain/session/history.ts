import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { LikedHistory } from './types';

const DEFAULT_HISTORY: LikedHistory = { events: [], schemaVersion: 1 };

const storage = new Storage<LikedHistory>({
  key: 'munch:likedHistory',
  currentVersion: 1,
  defaultValue: DEFAULT_HISTORY,
  migrate: (raw) => {
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as LikedHistory;
    }
    throw new Error('unrecognized history shape');
  },
});

type HistoryState = {
  history: LikedHistory;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  recordLike: (dishId: string, sessionId: string) => Promise<void>;
  reset: () => Promise<void>;
};

export const useLikedHistoryStore = create<HistoryState>((set, get) => ({
  history: DEFAULT_HISTORY,
  hydrated: false,
  hydrate: async () => {
    const history = await storage.read();
    set({ history, hydrated: true });
  },
  recordLike: async (dishId, sessionId) => {
    const next: LikedHistory = {
      ...get().history,
      events: [...get().history.events, { dishId, sessionId, likedAt: Date.now() }],
    };
    await storage.write(next);
    set({ history: next });
  },
  reset: async () => {
    await storage.clear();
    set({ history: DEFAULT_HISTORY });
  },
}));
