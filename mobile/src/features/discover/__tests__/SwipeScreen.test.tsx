import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SwipeScreen } from '@/features/discover/SwipeScreen';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';

// ─── mock dishRepository so we can control the pool ───────────────────────────
const mockFilterByPreferences = jest.fn();
jest.mock('@/domain/dish/repositoryInstance', () => ({
  dishRepository: {
    filterByPreferences: (...args: unknown[]) => mockFilterByPreferences(...args),
  },
}));

// ─── minimal dish fixture for pool entries ────────────────────────────────────
import type { Dish } from '@/domain/dish/types';

const makeDish = (id: string): Dish => ({
  id,
  name: `Dish ${id}`,
  description: 'A test dish.',
  country: 'JP',
  cuisine_region: 'east_asian',
  flavor: { sweet: 1, sour: 1, salty: 1, bitter: 0, umami: 2, heat: 0, richness: 1 },
  textures: ['soft'],
  meal_types: ['lunch'],
  temperature: 'hot',
  typical_time: 'any',
  contains: {
    gluten: false, dairy: false, seafood: false, nuts: false,
    eggs: false, pork: false, beef: false, alcohol: false,
  },
  diet_compatible: ['vegan', 'vegetarian'],
  price_tier: 1,
  prep_complexity: 'low',
  popularity: 3,
  image_url: 'https://example.com/dish.jpg',
  image_thumbhash: '',
  tags: [],
});

// A pool with enough dishes to satisfy engine.nextDish
const FULL_POOL: Dish[] = Array.from({ length: 15 }, (_, i) => makeDish(`dish_${i}`));

// ─── navigation wrapper ───────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const NullScreen = () => null;

const renderWithNav = () =>
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Swipe" component={SwipeScreen} />
        <Stack.Screen name="MatchReveal" component={NullScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

// ─── test suite ───────────────────────────────────────────────────────────────
describe('SwipeScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    usePreferencesStore.setState(usePreferencesStore.getInitialState());
    useSessionStore.setState(useSessionStore.getInitialState());
    useLikedHistoryStore.setState(useLikedHistoryStore.getInitialState());
    // Default: return a full pool
    mockFilterByPreferences.mockReturnValue(FULL_POOL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('auto-starts a session on mount when none exists', async () => {
    renderWithNav();
    await waitFor(() => {
      expect(useSessionStore.getState().session).not.toBeNull();
    });
    expect(useSessionStore.getState().session?.status).toBe('active');
  });

  it('shows the match-potential bar with session stats', async () => {
    const { findByText } = renderWithNav();
    await waitFor(() => expect(useSessionStore.getState().session).not.toBeNull());
    // Match potential bar shows 0% until at least one like
    const percent = await findByText(/0% match potential/);
    expect(percent).toBeTruthy();
  });

  it('shows empty state when pool has zero dishes and zero likes', async () => {
    // Override mock to return empty pool
    mockFilterByPreferences.mockReturnValue([]);
    const { findByText } = renderWithNav();
    const emptyMsg = await findByText(/Nothing matches your filters/);
    expect(emptyMsg).toBeTruthy();
  });
});
