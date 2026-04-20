import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SwipeCard } from './SwipeCard';
import { MatchPotentialBar } from './MatchPotentialBar';
import { DetailsSheet } from './DetailsSheet';
import { Button } from '@/shared/components/Button';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { colors, spacing, typography } from '@/shared/theme';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useSessionStore } from '@/domain/session/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import { createDefaultEngine } from '@/domain/recommendation/defaultEngine';
import { computeMatchConfidence } from '@/domain/recommendation/confidence';
import type { Dish } from '@/domain/dish/types';

const engine = createDefaultEngine();

export const SwipeScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const haptic = useHaptic();
  const preferences = usePreferencesStore(s => s.preferences);
  const session = useSessionStore(s => s.session);
  const startNewSession = useSessionStore(s => s.startNewSession);
  const recordSwipe = useSessionStore(s => s.recordSwipe);
  const completeWithMatch = useSessionStore(s => s.completeWithMatch);
  const recordLike = useLikedHistoryStore(s => s.recordLike);

  const [detailsDish, setDetailsDish] = useState<Dish | null>(null);
  const [currentDish, setCurrentDish] = useState<Dish | null>(null);

  const pool = useMemo(
    () => dishRepository.filterByPreferences(preferences),
    [preferences],
  );

  useEffect(() => {
    if (!session || session.status === 'completed') {
      startNewSession();
    }
  }, [session?.id, session?.status]);

  const remaining = useMemo(() => {
    if (!session) return [];
    return pool.filter(d => !session.seenDishIds.includes(d.id));
  }, [pool, session]);

  useEffect(() => {
    if (!session || remaining.length === 0) {
      setCurrentDish(null);
      return;
    }
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    setCurrentDish(engine.nextDish(remaining, ctx));
  }, [session?.seenDishIds.length, remaining.length]);

  const confidence = useMemo(() => {
    if (!session || remaining.length === 0) return 0;
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    const ranked = engine.rankDishes(remaining, ctx);
    return computeMatchConfidence(ranked.slice(0, 10).map(r => r.score));
  }, [session?.seenDishIds.length, remaining.length]);

  const onSwipe = async (direction: 'like' | 'dislike') => {
    if (!currentDish || !session) return;
    haptic.tap();
    await recordSwipe(currentDish, direction);
    if (direction === 'like') {
      await recordLike(currentDish.id, session.id);
    }

    const updated = useSessionStore.getState().session;
    if (!updated) return;
    const totalSwipes = updated.likes.length + updated.dislikes.length;
    const hitLikes = updated.likes.length >= updated.likesTargetForNextMatch;
    const hitCap = totalSwipes >= updated.swipeCapForNextMatch;
    if (hitLikes || hitCap) {
      const ctx = {
        user: { tasteVector: updated.tasteVector, categoricalCounts: updated.categoricalCounts },
        session: updated, now: new Date(),
      };
      const matchPool = pool.filter(d => !updated.seenDishIds.includes(d.id)).length > 0
        ? pool.filter(d => !updated.seenDishIds.includes(d.id))
        : pool;
      const match = engine.matchTop3(matchPool, ctx);
      await completeWithMatch(match);
      haptic.success();
      nav.navigate('MatchReveal');
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: spacing.xl }}>Starting session…</Text>
      </SafeAreaView>
    );
  }

  if (remaining.length === 0 || !currentDish) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You've seen everything matching your filters.</Text>
          <Text style={styles.emptyBody}>Loosen filters in Settings or start a new session.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSwipes = session.likes.length + session.dislikes.length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <MatchPotentialBar
        confidence={confidence}
        likes={session.likes.length}
        totalSwipes={totalSwipes}
      />
      <View style={styles.cardArea}>
        <SwipeCard
          key={currentDish.id}
          dish={currentDish}
          onSwipe={onSwipe}
          onPressDetails={() => setDetailsDish(currentDish)}
          interactive
        />
      </View>
      <View style={styles.buttonsRow}>
        <Button label="Nope" variant="secondary" size="lg" onPress={() => onSwipe('dislike')} />
        <Button label="Yum" variant="primary" size="lg" onPress={() => onSwipe('like')} />
      </View>
      <DetailsSheet dish={detailsDish} onClose={() => setDetailsDish(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  cardArea: { flex: 1, margin: spacing.lg, aspectRatio: 0.75, position: 'relative' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  empty: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyTitle: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
