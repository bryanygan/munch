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

  const triggerMatch = React.useCallback(async (updated: typeof session, poolSnapshot: Dish[]) => {
    if (!updated) return;
    const ctx = {
      user: { tasteVector: updated.tasteVector, categoricalCounts: updated.categoricalCounts },
      session: updated, now: new Date(),
    };
    const unseen = poolSnapshot.filter(d => !updated.seenDishIds.includes(d.id));
    const matchPool = unseen.length > 0 ? unseen : poolSnapshot;
    const match = engine.matchTop3(matchPool, ctx);
    await completeWithMatch(match);
    haptic.success();
    nav.navigate('MatchReveal');
  }, [completeWithMatch, haptic, nav]);

  // Only start a new session when there is no session at all.
  useEffect(() => {
    if (!session) {
      startNewSession();
    }
  }, [session]);

  // If we land here with a completed session, navigate to MatchReveal.
  useEffect(() => {
    if (session?.status === 'completed' && session.completedMatch) {
      nav.navigate('MatchReveal');
    }
  }, [session?.status, session?.completedMatch, nav]);

  const remaining = useMemo(() => {
    if (!session) return [];
    return pool.filter(d => !session.seenDishIds.includes(d.id));
  }, [pool, session]);

  // If the pool exhausts mid-session and there's at least one like, trigger a match.
  useEffect(() => {
    if (session && session.status === 'active' && remaining.length === 0 && session.likes.length > 0) {
      triggerMatch(session, pool);
    }
  }, [session, remaining.length, pool, triggerMatch]);

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
    if (!session) return 0;
    return Math.min(1, session.likes.length / session.likesTargetForNextMatch);
  }, [session?.likes.length, session?.likesTargetForNextMatch]);

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
      await triggerMatch(updated, pool);
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
    if (session.likes.length === 0) {
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing matches your filters.</Text>
            <Text style={styles.emptyBody}>Loosen filters in Settings to see more dishes.</Text>
          </View>
        </SafeAreaView>
      );
    }
    // Pool exhausted with likes — triggerMatch effect is in flight, show brief loading state.
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Finding your match…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSwipes = session.likes.length + session.dislikes.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
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
  cardArea: { flex: 1, marginHorizontal: spacing.lg, marginVertical: spacing.md, position: 'relative' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  empty: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyTitle: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
