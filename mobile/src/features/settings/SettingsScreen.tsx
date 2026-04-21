import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '@/shared/theme';

const UNLOCK_TAPS = 5;
const UNLOCK_WINDOW_MS = 3000;

export const SettingsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const [devUnlocked, setDevUnlocked] = useState(false);
  const tapCount = useRef(0);
  const firstTapAt = useRef(0);

  const handleTitleTap = () => {
    const now = Date.now();
    if (now - firstTapAt.current > UNLOCK_WINDOW_MS) {
      tapCount.current = 1;
      firstTapAt.current = now;
      return;
    }
    tapCount.current += 1;
    if (tapCount.current >= UNLOCK_TAPS && !devUnlocked) {
      setDevUnlocked(true);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={handleTitleTap} hitSlop={8}>
          <Text style={styles.title}>Settings</Text>
        </Pressable>
        <SettingRow label="Dietary filters" onPress={() => nav.navigate('Filters')} />
        <SettingRow label="Manage data" onPress={() => nav.navigate('Data')} />
        {devUnlocked ? (
          <SettingRow label="Dev menu" onPress={() => nav.navigate('DevMenu')} rightAdornment="🔧" />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow: React.FC<{ label: string; onPress: () => void; rightAdornment?: string }> = ({ label, onPress, rightAdornment }) => (
  <Pressable onPress={onPress} style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.chevron}>{rightAdornment ? `${rightAdornment}  ›` : '›'}</Text>
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
