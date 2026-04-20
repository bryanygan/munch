import { create } from 'zustand';
import { Storage } from '@/shared/utils/storage';
import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';
import { DEFAULT_PREFERENCES, type Preferences } from './types';

const storage = new Storage<Preferences>({
  key: 'munch:preferences',
  currentVersion: 1,
  defaultValue: DEFAULT_PREFERENCES,
  migrate: (raw) => {
    // Single version today. When schema changes, handle older shapes here.
    if (raw && typeof raw === 'object' && 'schemaVersion' in raw) {
      return raw as Preferences;
    }
    throw new Error('unrecognized preferences shape');
  },
});

type PreferencesState = {
  preferences: Preferences;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAllergens: (allergens: AllergenKey[]) => Promise<void>;
  setDiet: (diet: Diet | null) => Promise<void>;
  setPriceRange: (range: [PriceTier, PriceTier]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
  hydrate: async () => {
    const preferences = await storage.read();
    set({ preferences, hydrated: true });
  },
  setAllergens: async (allergens) => {
    const next = { ...get().preferences, allergens };
    await storage.write(next);
    set({ preferences: next });
  },
  setDiet: async (diet) => {
    const next = { ...get().preferences, diet };
    await storage.write(next);
    set({ preferences: next });
  },
  setPriceRange: async (priceRange) => {
    const next = { ...get().preferences, priceRange };
    await storage.write(next);
    set({ preferences: next });
  },
  completeOnboarding: async () => {
    const next = { ...get().preferences, onboardingCompleted: true };
    await storage.write(next);
    set({ preferences: next });
  },
  reset: async () => {
    await storage.clear();
    set({ preferences: DEFAULT_PREFERENCES });
  },
}));
