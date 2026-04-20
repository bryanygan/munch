import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/shared/theme';

type Props = {
  label: string;
  icon?: React.ReactNode;
  variant?: 'flavor' | 'dietary' | 'filter';
  style?: ViewStyle;
};

export const Chip: React.FC<Props> = ({ label, icon, variant = 'flavor', style }) => (
  <View style={[styles.base, styles[variant], style]}>
    {icon}
    <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.full,
  },
  flavor: { backgroundColor: colors.primaryDim },
  dietary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filter: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.divider },
  label: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xs },
  flavorLabel: { color: colors.primary },
  dietaryLabel: { color: '#fff' },
  filterLabel: { color: colors.textPrimary },
});
