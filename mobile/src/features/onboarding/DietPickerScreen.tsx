import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import type { Diet } from '@/domain/dish/types';
import type { OnboardingParamList } from '@/app/OnboardingStack';

const OPTIONS: Array<{ key: Diet | 'none'; label: string; desc: string }> = [
  { key: 'none', label: 'No preference', desc: 'Everything is on the table' },
  { key: 'vegetarian', label: 'Vegetarian', desc: 'No meat or seafood' },
  { key: 'vegan', label: 'Vegan', desc: 'No animal products' },
  { key: 'pescatarian', label: 'Pescatarian', desc: 'Vegetarian + seafood' },
  { key: 'halal', label: 'Halal', desc: '' },
  { key: 'kosher', label: 'Kosher', desc: '' },
];

export const DietPickerScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  const existing = usePreferencesStore(s => s.preferences.diet);
  const setDiet = usePreferencesStore(s => s.setDiet);
  const [selected, setSelected] = useState<Diet | 'none'>(existing ?? 'none');

  const onNext = async () => {
    await setDiet(selected === 'none' ? null : selected);
    nav.navigate('PriceRange');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Step 2 of 3</Text>
        <Text style={styles.title}>Any dietary style?</Text>
        <Text style={styles.body}>Optional — skip if it doesn't apply.</Text>

        <View style={styles.list}>
          {OPTIONS.map(opt => {
            const active = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                style={[styles.option, active && styles.optionActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.desc ? `${opt.label}, ${opt.desc}` : opt.label}
              >
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                {opt.desc ? <Text style={styles.optionDesc}>{opt.desc}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} size="lg" />
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
  option: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 2, borderColor: colors.divider,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  optionLabel: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.md, color: colors.textPrimary },
  optionLabelActive: { color: colors.primary },
  optionDesc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 4 },
  footer: { padding: spacing.xl },
});
