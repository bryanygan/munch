import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/shared/components/Button';
import { Toggle } from '@/shared/components/Toggle';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { AllergenKey } from '@/domain/dish/types';
import type { OnboardingParamList } from '@/app/OnboardingStack';

const ALLERGENS: Array<{ key: AllergenKey; label: string }> = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'seafood', label: 'Seafood' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'pork', label: 'Pork' },
  { key: 'beef', label: 'Beef' },
  { key: 'alcohol', label: 'Alcohol' },
];

export const AllergenPickerScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  const existing = usePreferencesStore(s => s.preferences.allergens);
  const setAllergens = usePreferencesStore(s => s.setAllergens);
  const [selected, setSelected] = useState<AllergenKey[]>(existing);
  const [noneSelected, setNoneSelected] = useState(existing.length === 0);

  const toggle = (k: AllergenKey) => {
    setNoneSelected(false);
    setSelected(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  const onNoneToggle = (v: boolean) => {
    setNoneSelected(v);
    if (v) setSelected([]);
  };

  const canContinue = noneSelected || selected.length > 0;

  const onNext = async () => {
    await setAllergens(noneSelected ? [] : selected);
    nav.navigate('DietPicker');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Step 1 of 3</Text>
        <Text style={styles.title}>Anything we should leave off the plate?</Text>
        <Text style={styles.body}>Dishes containing these will never appear.</Text>

        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No allergies or restrictions</Text>
            <Toggle
              value={noneSelected}
              onValueChange={onNoneToggle}
              accessibilityLabel={`No allergies or restrictions — ${noneSelected ? 'selected' : 'not selected'}`}
            />
          </View>
          {ALLERGENS.map(({ key, label }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Toggle
                value={!noneSelected && selected.includes(key)}
                onValueChange={() => toggle(key)}
                accessibilityLabel={`${label} — ${selected.includes(key) ? 'excluded from matches' : 'allowed in matches'}`}
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} disabled={!canContinue} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider,
  },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  footer: { padding: spacing.xl },
});
