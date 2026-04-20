import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius } from '@/shared/theme';

type Props = {
  intensity?: number;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
  children?: React.ReactNode;
  radius?: number;
};

export const GlassPanel: React.FC<Props> = ({
  intensity = 40, tint = 'dark', style, children, radius: r = radius.xl,
}) => {
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)' }]} />
      )}
      {children}
    </View>
  );
};
