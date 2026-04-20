import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius } from '@/shared/theme';

type Props = {
  value: number; // 0..1
  variant?: 'primary' | 'subtle';
  height?: number;
  style?: ViewStyle;
};

export const ProgressBar: React.FC<Props> = ({ value, variant = 'primary', height = 8, style }) => {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[{ height, borderRadius: radius.full, backgroundColor: variant === 'primary' ? colors.primaryDim : '#e5e7eb' }, style]}>
      <View style={{
        height: '100%', width: `${clamped * 100}%`, borderRadius: radius.full,
        backgroundColor: variant === 'primary' ? colors.primary : colors.textSecondary,
      }} />
    </View>
  );
};
