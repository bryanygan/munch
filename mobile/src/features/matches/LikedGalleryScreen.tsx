import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import { useLikedHistoryStore } from '@/domain/session/history';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import type { Dish } from '@/domain/dish/types';

export const LikedGalleryScreen: React.FC = () => {
  const events = useLikedHistoryStore(s => s.history.events);
  const dishes = useMemo(() => {
    const seen = new Set<string>();
    const result: Dish[] = [];
    for (let i = events.length - 1; i >= 0; i--) {
      const id = events[i]!.dishId;
      if (seen.has(id)) continue;
      seen.add(id);
      const d = dishRepository.findById(id);
      if (d) result.push(d);
    }
    return result;
  }, [events]);

  if (dishes.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptyBody}>Swipe right on dishes you'd eat and they'll appear here.</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={dishes}
        keyExtractor={d => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <DishImage uri={item.image_url} thumbhash={item.image_thumbhash} style={styles.img} />
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  grid: { padding: spacing.md, gap: spacing.md },
  card: {
    flex: 1, backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg, overflow: 'hidden', ...shadow.soft,
  },
  img: { height: 140 },
  cardBody: { padding: spacing.md },
  cardName: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary },
  emptyBody: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
