import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferencesStore } from '@/domain/preferences/store';

describe('usePreferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
  });

  it('starts with default preferences', () => {
    const s = usePreferencesStore.getState();
    expect(s.preferences.onboardingCompleted).toBe(false);
    expect(s.preferences.allergens).toEqual([]);
    expect(s.preferences.priceRange).toEqual([1, 4]);
  });

  it('hydrates from storage', async () => {
    await AsyncStorage.setItem('munch:preferences', JSON.stringify({
      allergens: ['gluten'], diet: 'vegan', priceRange: [1, 2],
      onboardingCompleted: true, schemaVersion: 1,
    }));
    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().preferences.allergens).toEqual(['gluten']);
    expect(usePreferencesStore.getState().preferences.diet).toBe('vegan');
  });

  it('setAllergens updates and persists', async () => {
    await usePreferencesStore.getState().setAllergens(['nuts', 'dairy']);
    expect(usePreferencesStore.getState().preferences.allergens).toEqual(['nuts', 'dairy']);
    const stored = JSON.parse((await AsyncStorage.getItem('munch:preferences'))!);
    expect(stored.allergens).toEqual(['nuts', 'dairy']);
  });

  it('completeOnboarding sets the flag', async () => {
    await usePreferencesStore.getState().completeOnboarding();
    expect(usePreferencesStore.getState().preferences.onboardingCompleted).toBe(true);
  });

  it('reset clears back to defaults', async () => {
    await usePreferencesStore.getState().setAllergens(['nuts']);
    await usePreferencesStore.getState().reset();
    expect(usePreferencesStore.getState().preferences.allergens).toEqual([]);
  });
});
