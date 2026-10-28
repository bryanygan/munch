import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Providers } from '@/app/Providers';
import { RootNavigator } from '@/app/RootNavigator';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { colors } from '@/shared/theme';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const prefsHydrated = usePreferencesStore(s => s.hydrated);
  const sessionHydrated = useSessionStore(s => s.hydrated);
  const historyHydrated = useLikedHistoryStore(s => s.hydrated);

  useEffect(() => {
    usePreferencesStore.getState().hydrate();
    useSessionStore.getState().hydrate();
    useLikedHistoryStore.getState().hydrate();
  }, []);

  const ready = fontsLoaded && prefsHydrated && sessionHydrated && historyHydrated;

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundLight }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <ErrorBoundary>
      <Providers>
        <RootNavigator />
      </Providers>
    </ErrorBoundary>
  );
}
