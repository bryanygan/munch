/**
 * Supplementary tests to raise coverage on preferences/store.ts above 80%.
 * Covers: setDiet, setPriceRange, and the migrate error branch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferencesStore } from '@/domain/preferences/store';

describe('usePreferencesStore – coverage gaps', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
  });

  it('setDiet updates and persists', async () => {
    await usePreferencesStore.getState().setDiet('vegan');
    expect(usePreferencesStore.getState().preferences.diet).toBe('vegan');
    const stored = JSON.parse((await AsyncStorage.getItem('munch:preferences'))!);
    expect(stored.diet).toBe('vegan');
  });

  it('setDiet can be set to null', async () => {
    await usePreferencesStore.getState().setDiet('vegetarian');
    await usePreferencesStore.getState().setDiet(null);
    expect(usePreferencesStore.getState().preferences.diet).toBeNull();
  });

  it('setPriceRange updates and persists', async () => {
    await usePreferencesStore.getState().setPriceRange([2, 3]);
    expect(usePreferencesStore.getState().preferences.priceRange).toEqual([2, 3]);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:preferences'))!);
    expect(stored.priceRange).toEqual([2, 3]);
  });

  it('hydrate falls back to default when storage is corrupt', async () => {
    // Write a malformed value that doesn't have schemaVersion
    await AsyncStorage.setItem('munch:preferences', JSON.stringify({ invalid: true }));
    // The Storage wrapper catches the migrate error and returns the default value
    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().preferences.allergens).toEqual([]);
  });
});
