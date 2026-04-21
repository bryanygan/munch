import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { PriceTier } from '@/domain/dish/types';
import { analytics } from '@/shared/analytics';

const TIERS: PriceTier[] = [1, 2, 3, 4];
const LABELS: Record<PriceTier, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

export const PriceRangeScreen: React.FC = () => {
  const existing = usePreferencesStore(s => s.preferences.priceRange);
  const setPriceRange = usePreferencesStore(s => s.setPriceRange);
  const completeOnboarding = usePreferencesStore(s => s.completeOnboarding);
  const [min, setMin] = useState<PriceTier>(existing[0]);
  const [max, setMax] = useState<PriceTier>(existing[1]);

  const onFinish = async () => {
    const range: [PriceTier, PriceTier] = [Math.min(min, max) as PriceTier, Math.max(min, max) as PriceTier];
    await setPriceRange(range);
    await completeOnboarding();
    const prefs = usePreferencesStore.getState().preferences;
    analytics.track({
      name: 'onboarding_completed',
      allergen_count: prefs.allergens.length,
      diet: prefs.diet,
      price_min: range[0],
      price_max: range[1],
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Step 3 of 3</Text>
        <Text style={styles.title}>What's your price range?</Text>
        <Text style={styles.body}>Tap a tier to set the minimum and maximum.</Text>

        <View style={styles.row}>
          <PriceColumn label="From" value={min} onChange={setMin} />
          <PriceColumn label="To" value={max} onChange={setMax} />
        </View>
      </View>
      <View style={styles.footer}>
        <Button label="Start discovering" onPress={onFinish} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const PriceColumn: React.FC<{ label: string; value: PriceTier; onChange: (v: PriceTier) => void }> = ({ label, value, onChange }) => (
  <View style={styles.col}>
    <Text style={styles.colLabel}>{label}</Text>
    {TIERS.map(t => {
      const active = value === t;
      return (
        <Pressable key={t} onPress={() => onChange(t)} style={[styles.tier, active && styles.tierActive]}>
          <Text style={[styles.tierLabel, active && styles.tierLabelActive]}>{LABELS[t]}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md },
  row: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl },
  col: { flex: 1, gap: spacing.sm },
  colLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  tier: {
    backgroundColor: colors.surfaceLight, borderWidth: 2, borderColor: colors.divider,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
  },
  tierActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  tierLabel: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textMuted },
  tierLabelActive: { color: colors.primary },
  footer: { padding: spacing.xl },
});
