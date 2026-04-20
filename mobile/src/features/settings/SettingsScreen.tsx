import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/shared/theme';

export const SettingsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <SettingRow label="Dietary filters" onPress={() => nav.navigate('Filters')} />
        <SettingRow label="Manage data" onPress={() => nav.navigate('Data')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <Pressable onPress={onPress} style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider,
  },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  chevron: { fontSize: 20, color: colors.textMuted },
});
