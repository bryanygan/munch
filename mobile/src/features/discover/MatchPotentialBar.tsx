import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { colors, spacing, typography } from '@/shared/theme';

type Props = {
  confidence: number;
  likes: number;
  totalSwipes: number;
};

export const MatchPotentialBar: React.FC<Props> = ({ confidence, likes, totalSwipes }) => (
  <View style={styles.root}>
    <View style={styles.row}>
      <Text style={styles.percent}>{Math.round(confidence * 100)}% match potential</Text>
      <Text style={styles.meta}>{likes} ♥ · {totalSwipes} swipes</Text>
    </View>
    <ProgressBar value={confidence} />
  </View>
);

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percent: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.sm },
  meta: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs },
});
