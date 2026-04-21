import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/shared/components/Button';
import { Toggle } from '@/shared/components/Toggle';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { AllergenKey, Diet, PriceTier } from '@/domain/dish/types';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { analytics } from '@/shared/analytics';

const ALLERGENS: Array<{ key: AllergenKey; label: string }> = [
  { key: 'gluten', label: 'Gluten' }, { key: 'dairy', label: 'Dairy' },
  { key: 'seafood', label: 'Seafood' }, { key: 'nuts', label: 'Nuts' },
  { key: 'eggs', label: 'Eggs' }, { key: 'pork', label: 'Pork' },
  { key: 'beef', label: 'Beef' }, { key: 'alcohol', label: 'Alcohol' },
];
const DIETS: Array<Diet | 'none'> = ['none', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'];

export const FiltersScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const prefs = usePreferencesStore(s => s.preferences);
  const setAllergens = usePreferencesStore(s => s.setAllergens);
  const setDiet = usePreferencesStore(s => s.setDiet);
  const setPriceRange = usePreferencesStore(s => s.setPriceRange);
  const [selected, setSelected] = useState<AllergenKey[]>(prefs.allergens);
  const [diet, setDietLocal] = useState<Diet | 'none'>(prefs.diet ?? 'none');
  const [priceMax, setPriceMax] = useState<PriceTier>(prefs.priceRange[1]);

  const save = async () => {
    const prevAllergens = new Set(prefs.allergens);
    const nextAllergens = new Set(selected);
    const added = selected.filter(a => !prevAllergens.has(a));
    const removed = [...prevAllergens].filter(a => !nextAllergens.has(a));
    analytics.track({
      name: 'filters_changed',
      allergens_added: added,
      allergens_removed: removed,
      diet: diet === 'none' ? null : diet,
    });
    await setAllergens(selected);
    await setDiet(diet === 'none' ? null : diet);
    await setPriceRange([prefs.priceRange[0], priceMax]);
    nav.goBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Allergens</Text>
        {ALLERGENS.map(({ key, label }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Toggle
              value={selected.includes(key)}
              onValueChange={() =>
                setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
              }
            />
          </View>
        ))}

        <Text style={styles.section}>Dietary style</Text>
        <View style={styles.chipRow}>
          {DIETS.map(d => (
            <Text
              key={d}
              onPress={() => setDietLocal(d)}
              style={[styles.chip, diet === d && styles.chipActive]}
            >
              {d}
            </Text>
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl }}>
        <Button label="Apply" onPress={save} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.sm },
  section: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceLight, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.divider },
  rowLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm, color: colors.textSecondary, backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.divider, textTransform: 'capitalize' },
  chipActive: { backgroundColor: colors.primary, color: '#fff', borderColor: colors.primary },
});
