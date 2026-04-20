import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {children}
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
