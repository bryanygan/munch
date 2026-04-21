import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, spacing, typography } from '@/shared/theme';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { usePreferencesStore } from '@/domain/preferences/store';
import { analytics } from '@/shared/analytics';

export const DataScreen: React.FC = () => {
  const confirmReset = (title: string, body: string, fn: () => Promise<void>) => {
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void fn() },
    ]);
  };
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Manage data</Text>
        <Text style={styles.body}>All data is stored on this device only.</Text>
        <Button
          label="Reset current session"
          variant="secondary"
          onPress={() => confirmReset(
            'Reset session?',
            'Your current swipe session will be cleared. Liked history is preserved.',
            async () => {
              analytics.track({ name: 'data_reset', scope: 'session' });
              await useSessionStore.getState().resetSession();
            },
          )}
        />
        <Button
          label="Clear liked history"
          variant="secondary"
          onPress={() => confirmReset(
            'Clear liked history?',
            'All your liked dishes will be removed from the Matches gallery.',
            async () => {
              analytics.track({ name: 'data_reset', scope: 'history' });
              await useLikedHistoryStore.getState().reset();
            },
          )}
        />
        <Button
          label="Reset everything"
          variant="ghost"
          onPress={() => confirmReset(
            'Reset everything?',
            'Preferences, session, and liked history will all be cleared. You will go through onboarding again.',
            async () => {
              analytics.track({ name: 'data_reset', scope: 'all' });
              await useSessionStore.getState().resetSession();
              await useLikedHistoryStore.getState().reset();
              await usePreferencesStore.getState().reset();
            },
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.sm, marginBottom: spacing.md },
});
