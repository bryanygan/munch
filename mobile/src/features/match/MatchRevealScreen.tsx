import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/shared/components/Button';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import { useSessionStore } from '@/domain/session/store';
import type { MatchEntry } from '@/domain/session/types';

export const MatchRevealScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const session = useSessionStore(s => s.session);
  const continueSwiping = useSessionStore(s => s.continueSwiping);
  const resetSession = useSessionStore(s => s.resetSession);
  const match = session?.completedMatch;

  if (!match || match.top3.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: spacing.xl }}>No match available.</Text>
      </SafeAreaView>
    );
  }

  const [first, ...rest] = match.top3;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>It's a match!</Text>
        <Text style={styles.title}>Your top dish</Text>

        {first ? <HeroCard entry={first} /> : null}

        <Text style={styles.sectionLabel}>Also tasty</Text>
        <View style={styles.secondaryRow}>
          {rest.map(e => <SecondaryCard key={e.dish.id} entry={e} />)}
        </View>

        <View style={styles.actions}>
          <Button label="Order now (coming soon)" size="lg" disabled />
          <Button label="Find restaurants (coming soon)" size="lg" disabled />
          <Button label="Keep swiping" variant="secondary" size="lg" onPress={async () => {
            await continueSwiping();
            nav.goBack();
          }} />
          <Button label="Start over" variant="ghost" size="sm" onPress={async () => {
            await resetSession();
            nav.goBack();
          }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HeroCard: React.FC<{ entry: MatchEntry }> = ({ entry }) => (
  <View style={styles.hero}>
    <DishImage uri={entry.dish.image_url} blurhash={entry.dish.image_blurhash} style={styles.heroImage} />
    <View style={styles.heroBody}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.heroName}>{entry.dish.name}</Text>
        <Text style={styles.heroPercent}>{entry.matchPercent}%</Text>
      </View>
      <Text style={styles.heroDesc}>{entry.dish.description}</Text>
    </View>
  </View>
);

const SecondaryCard: React.FC<{ entry: MatchEntry }> = ({ entry }) => (
  <View style={styles.secondary}>
    <DishImage uri={entry.dish.image_url} blurhash={entry.dish.image_blurhash} style={styles.secondaryImage} />
    <View style={{ padding: spacing.md }}>
      <Text style={styles.secondaryName} numberOfLines={1}>{entry.dish.name}</Text>
      <Text style={styles.secondaryPercent}>{entry.matchPercent}% match</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  eyebrow: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center' },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['3xl'], color: colors.textPrimary, textAlign: 'center' },
  hero: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceLight, ...shadow.soft },
  heroImage: { height: 240 },
  heroBody: { padding: spacing.lg, gap: spacing.sm },
  heroName: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, flex: 1 },
  heroPercent: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, color: colors.primary },
  heroDesc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.5 },
  sectionLabel: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.md },
  secondaryRow: { flexDirection: 'row', gap: spacing.md },
  secondary: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceLight, ...shadow.soft },
  secondaryImage: { height: 120 },
  secondaryName: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  secondaryPercent: { fontFamily: typography.fontFamily.regular, color: colors.primary, fontSize: typography.sizes.xs },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
