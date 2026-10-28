import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '@/shared/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityHint?: string;
  accessibilityLabel?: string;
};

export const Button: React.FC<Props> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, leftIcon, rightIcon, style,
  accessibilityHint, accessibilityLabel,
}) => {
  const containerStyle = [
    styles.base,
    styles[`${size}Size`],
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
    style,
  ];
  const textStyle: TextStyle[] = [
    styles.labelBase,
    styles[`${size}Label`],
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
  ].filter(Boolean) as TextStyle[];
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
        : <>
            {leftIcon}
            <Text style={textStyle}>{label}</Text>
            {rightIcon}
          </>
      }
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.lg,
  },
  smSize: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  mdSize: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  lgSize: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.divider },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  labelBase: { fontFamily: typography.fontFamily.bold },
  smLabel: { fontSize: typography.sizes.sm },
  mdLabel: { fontSize: typography.sizes.md },
  lgLabel: { fontSize: typography.sizes.lg },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: colors.textPrimary },
  ghostLabel: { color: colors.primary },
});
