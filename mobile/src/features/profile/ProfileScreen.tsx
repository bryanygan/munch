import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { useLikedHistoryStore } from '@/domain/session/history';
import { useSessionStore } from '@/domain/session/store';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import type { CuisineRegion } from '@/domain/dish/types';

export const ProfileScreen: React.FC = () => {
  const events = useLikedHistoryStore(s => s.history.events);
  const session = useSessionStore(s => s.session);

  const stats = useMemo(() => {
    const uniqueIds = new Set(events.map(e => e.dishId));
    const totalLikes = uniqueIds.size;
    const regionTally: Record<string, number> = {};
    for (const id of uniqueIds) {
      const d = dishRepository.findById(id);
      if (!d) continue;
      regionTally[d.cuisine_region] = (regionTally[d.cuisine_region] ?? 0) + 1;
    }
    const topRegion = Object.entries(regionTally)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as CuisineRegion | undefined;
    const totalSwipes = (session?.likes.length ?? 0) + (session?.dislikes.length ?? 0);
    return { totalLikes, topRegion, totalSwipes };
  }, [events, session]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your flavor journey</Text>

        <View style={styles.statRow}>
          <Stat label="Total likes" value={String(stats.totalLikes)} />
          <Stat label="Swipes this session" value={String(stats.totalSwipes)} />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardLabel}>Top cuisine</Text>
          <Text style={styles.statCardValue}>
            {stats.topRegion ? stats.topRegion.replace('_', ' ') : '—'}
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Your lifetime flavor radar chart will appear here in a future version.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1, backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: colors.divider,
  },
  statValue: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.primary },
  statLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  statCard: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider, gap: 4,
  },
  statCardLabel: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 1 },
  statCardValue: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary, textTransform: 'capitalize' },
  placeholder: {
    backgroundColor: colors.primaryDim, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  placeholderText: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center', fontSize: typography.sizes.sm },
});
