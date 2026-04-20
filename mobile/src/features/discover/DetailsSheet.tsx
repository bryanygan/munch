import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Chip } from '@/shared/components/Chip';
import { DishImage } from '@/shared/components/DishImage';
import { colors, radius, spacing, typography } from '@/shared/theme';
import type { Dish, FlavorProfile } from '@/domain/dish/types';

type Props = {
  dish: Dish | null;
  onClose: () => void;
};

export const DetailsSheet: React.FC<Props> = ({ dish, onClose }) => {
  return (
    <Modal animationType="slide" transparent visible={!!dish} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.grabber} onPress={onClose}>
            <View style={styles.grabberBar} />
          </Pressable>
          {dish ? (
            <ScrollView contentContainerStyle={styles.content}>
              <DishImage uri={dish.image_url} blurhash={dish.image_blurhash} style={styles.image} />
              <Text style={styles.name}>{dish.name}</Text>
              <Text style={styles.country}>{dish.country} · {dish.cuisine_region.replace('_', ' ')}</Text>
              <Text style={styles.desc}>{dish.description}</Text>

              <Text style={styles.sectionLabel}>Flavor</Text>
              <FlavorBars flavor={dish.flavor} />

              <Text style={styles.sectionLabel}>Tags</Text>
              <View style={styles.chipRow}>
                {dish.meal_types.map(m => <Chip key={m} label={m} variant="flavor" />)}
                {dish.textures.map(t => <Chip key={t} label={t} variant="flavor" />)}
              </View>

              <Text style={styles.sectionLabel}>Contains</Text>
              <View style={styles.chipRow}>
                {Object.entries(dish.contains)
                  .filter(([, v]) => v)
                  .map(([k]) => <Chip key={k} label={k} variant="filter" />)}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  sweet: 'Sweet', sour: 'Sour', salty: 'Salty', bitter: 'Bitter',
  umami: 'Umami', heat: 'Heat', richness: 'Richness',
};

const FlavorBars: React.FC<{ flavor: FlavorProfile }> = ({ flavor }) => (
  <View style={{ gap: spacing.sm }}>
    {(Object.keys(FLAVOR_LABELS) as Array<keyof FlavorProfile>).map(k => (
      <View key={k} style={styles.bar}>
        <Text style={styles.barLabel}>{FLAVOR_LABELS[k]}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${(flavor[k] / 5) * 100}%` }]} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '80%', overflow: 'hidden',
  },
  grabber: { alignItems: 'center', paddingVertical: spacing.md },
  grabberBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.divider },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['3xl'] },
  image: { height: 220, borderRadius: radius.xl },
  name: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary, marginTop: spacing.md },
  country: { fontFamily: typography.fontFamily.bold, color: colors.textMuted, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2 },
  desc: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, fontSize: typography.sizes.md, lineHeight: typography.sizes.md * 1.5 },
  sectionLabel: { fontFamily: typography.fontFamily.bold, color: colors.primary, fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bar: { gap: 4 },
  barLabel: { fontFamily: typography.fontFamily.bold, color: colors.textSecondary, fontSize: typography.sizes.sm },
  barTrack: { height: 8, backgroundColor: colors.divider, borderRadius: radius.full },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
});
