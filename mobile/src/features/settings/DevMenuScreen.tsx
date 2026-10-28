import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing, typography } from '@/shared/theme';
import { useSessionStore } from '@/domain/session/store';
import { usePreferencesStore } from '@/domain/preferences/store';
import { useLikedHistoryStore } from '@/domain/session/history';
import { dishRepository } from '@/domain/dish/repositoryInstance';
import { createDefaultEngine } from '@/domain/recommendation/defaultEngine';
import { applySwipe } from '@/domain/session/mutations';
import { FLAVOR_KEYS } from '@/domain/dish/types';

const engine = createDefaultEngine();

export const DevMenuScreen: React.FC = () => {
  const session = useSessionStore(s => s.session);
  const preferences = usePreferencesStore(s => s.preferences);
  const history = useLikedHistoryStore(s => s.history);

  const pool = useMemo(() => dishRepository.filterByPreferences(preferences), [preferences]);

  const ranked = useMemo(() => {
    if (!session) return [];
    const ctx = {
      user: { tasteVector: session.tasteVector, categoricalCounts: session.categoricalCounts },
      session, now: new Date(),
    };
    return engine.rankDishes(pool, ctx).slice(0, 10);
  }, [session, pool]);

  const simulateLikesToNearMatch = async () => {
    const s = useSessionStore.getState().session;
    if (!s) return;
    const needed = s.likesTargetForNextMatch - s.likes.length - 1;
    if (needed <= 0) return;
    // Pick random unseen dishes and record likes without UI updates
    const unseen = pool.filter(d => !s.seenDishIds.includes(d.id));
    let next = s;
    for (let i = 0; i < Math.min(needed, unseen.length); i++) {
      next = applySwipe(next, unseen[i]!, 'like');
    }
    useSessionStore.setState({ session: next });
  };

  const fillPool = async () => {
    // Mark all pool dishes as seen WITHOUT recording likes/dislikes — forces pool-exhaustion match path
    const s = useSessionStore.getState().session;
    if (!s) return;
    useSessionStore.setState({
      session: {
        ...s,
        seenDishIds: pool.map(d => d.id),
      },
    });
  };

  const resetStorageKeys = async () => {
    await usePreferencesStore.getState().reset();
    await useSessionStore.getState().resetSession();
    await useLikedHistoryStore.getState().reset();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dev menu</Text>
        <Text style={styles.caption}>
          Internal tooling for inspecting engine state and seeding session data.
          Not shipped to production builds.
        </Text>

        <Section label="Session">
          <KV k="id" v={session?.id ?? '—'} />
          <KV k="status" v={session?.status ?? '—'} />
          <KV k="likes" v={String(session?.likes.length ?? 0)} />
          <KV k="dislikes" v={String(session?.dislikes.length ?? 0)} />
          <KV k="seen" v={String(session?.seenDishIds.length ?? 0)} />
          <KV k="like target" v={String(session?.likesTargetForNextMatch ?? 0)} />
          <KV k="swipe cap" v={String(session?.swipeCapForNextMatch ?? 0)} />
          <KV k="matches shown" v={String(session?.matchRevealsShown ?? 0)} />
        </Section>

        <Section label="Taste vector">
          {session ? (
            FLAVOR_KEYS.map((k, i) => (
              <KV key={k} k={k} v={(session.tasteVector[i] ?? 0).toFixed(2)} />
            ))
          ) : (
            <Text style={styles.muted}>no session</Text>
          )}
        </Section>

        <Section label="Preferences">
          <KV k="allergens" v={preferences.allergens.join(', ') || '(none)'} />
          <KV k="diet" v={preferences.diet ?? '(none)'} />
          <KV k="price range" v={`${preferences.priceRange[0]}–${preferences.priceRange[1]}`} />
          <KV k="pool size" v={`${pool.length} of ${dishRepository.getAll().length}`} />
        </Section>

        <Section label="Liked history">
          <KV k="total liked" v={String(history.events.length)} />
        </Section>

        <Section label="Top 10 ranked unseen dishes">
          {ranked.length === 0 ? (
            <Text style={styles.muted}>no session or empty pool</Text>
          ) : (
            ranked.map((r, i) => (
              <View key={r.dish.id} style={styles.rankRow}>
                <Text style={styles.rankNum}>#{i + 1}</Text>
                <Text style={styles.rankName} numberOfLines={1}>{r.dish.name}</Text>
                <Text style={styles.rankScore}>{Math.round(r.score * 100)}%</Text>
              </View>
            ))
          )}
        </Section>

        <Section label="Actions">
          <Button label="Jump to near-match (+likes - 1)" size="md" variant="secondary" onPress={simulateLikesToNearMatch} />
          <View style={{ height: spacing.sm }} />
          <Button label="Exhaust pool (mark all seen)" size="md" variant="secondary" onPress={fillPool} />
          <View style={{ height: spacing.sm }} />
          <Button label="Wipe all data + onboarding" size="md" variant="ghost" onPress={resetStorageKeys} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const KV: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <View style={styles.kv}>
    <Text style={styles.kvKey}>{k}</Text>
    <Text style={styles.kvValue} numberOfLines={1}>{v}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  caption: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.sm },
  muted: { fontFamily: typography.fontFamily.regular, color: colors.textMuted, fontSize: typography.sizes.sm, fontStyle: 'italic' },
  section: { gap: spacing.sm },
  sectionLabel: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2 },
  sectionBody: { backgroundColor: colors.surfaceLight, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.divider },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  kvKey: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm, color: colors.textSecondary, textTransform: 'capitalize' },
  kvValue: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankNum: { fontFamily: typography.fontFamily.extraBold, color: colors.primary, fontSize: typography.sizes.sm, width: 28 },
  rankName: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, color: colors.textPrimary, flex: 1 },
  rankScore: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm, color: colors.primary },
});
