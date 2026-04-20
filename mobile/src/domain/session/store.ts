import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { Dish } from '@/domain/dish/types';
import { createSwipeSession } from './factory';
import { applySwipe, type SwipeDirection } from './mutations';
import type { MatchResult, SwipeSession } from './types';

const storage = new Storage<SwipeSession>({
  key: 'munch:session',
  currentVersion: 1,
  defaultValue: createSwipeSession(),
  migrate: (raw) => {
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as SwipeSession;
    }
    throw new Error('unrecognized session shape');
  },
});

type SessionState = {
  session: SwipeSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startNewSession: () => Promise<void>;
  recordSwipe: (dish: Dish, direction: SwipeDirection) => Promise<void>;
  completeWithMatch: (match: MatchResult) => Promise<void>;
  continueSwiping: () => Promise<void>;
  resetSession: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    const stored = await storage.read();
    // Only keep the stored session if it looks real (has been interacted with)
    const session = stored.seenDishIds.length === 0 && stored.likes.length === 0
      ? null
      : stored;
    set({ session, hydrated: true });
  },
  startNewSession: async () => {
    const session = createSwipeSession();
    await storage.write(session);
    set({ session });
  },
  recordSwipe: async (dish, direction) => {
    const current = get().session;
    if (!current) return;
    const next = applySwipe(current, dish, direction);
    await storage.write(next);
    set({ session: next });
  },
  completeWithMatch: async (match) => {
    const current = get().session;
    if (!current) return;
    const next: SwipeSession = {
      ...current,
      status: 'completed',
      completedMatch: match,
      matchRevealsShown: current.matchRevealsShown + 1,
    };
    await storage.write(next);
    set({ session: next });
  },
  continueSwiping: async () => {
    const current = get().session;
    if (!current) return;
    const next: SwipeSession = {
      ...current,
      status: 'active',
      // Reset seen dishes + per-round counts so the user sees fresh cards.
      // Taste vector and categorical counts are PRESERVED — recommendations stay refined.
      seenDishIds: [],
      likes: [],
      dislikes: [],
      // The targets are additive vs the full-match thresholds (10 likes / 40 swipes).
      likesTargetForNextMatch: 10,
      swipeCapForNextMatch: 40,
      completedMatch: undefined,
      matchRevealsShown: current.matchRevealsShown,
    };
    await storage.write(next);
    set({ session: next });
  },
  resetSession: async () => {
    await storage.clear();
    set({ session: null });
  },
}));
