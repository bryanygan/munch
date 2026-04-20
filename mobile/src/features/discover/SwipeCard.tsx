import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DishImage } from '@/shared/components/DishImage';
import { GlassPanel } from '@/shared/components/GlassPanel';
import { Chip } from '@/shared/components/Chip';
import { colors, radius, spacing, typography, shadow } from '@/shared/theme';
import type { Dish } from '@/domain/dish/types';

const { width: W } = Dimensions.get('window');
const THRESHOLD = W * 0.3;

type Props = {
  dish: Dish;
  onSwipe: (direction: 'like' | 'dislike') => void;
  onPressDetails: () => void;
  interactive: boolean;
};

export const SwipeCard: React.FC<Props> = ({ dish, onSwipe, onPressDetails, interactive }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const fling = (dir: 'like' | 'dislike') => {
    onSwipe(dir);
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotation.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > THRESHOLD) {
        const dir = e.translationX > 0 ? 'like' : 'dislike';
        translateX.value = withTiming(e.translationX > 0 ? W * 1.5 : -W * 1.5, { duration: 220 }, () => {
          runOnJS(fling)(dir);
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const yumStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const flagEmoji = dish.country
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

  const dietaryTags: string[] = [];
  if (dish.flavor.heat >= 3) dietaryTags.push('SPICY');
  if (dish.contains.dairy) dietaryTags.push('DAIRY');
  if (dish.contains.gluten) dietaryTags.push('GLUTEN');

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <DishImage uri={dish.image_url} blurhash={dish.image_blurhash} style={StyleSheet.absoluteFillObject} />
        <View style={styles.darkGradient} pointerEvents="none" />

        <Animated.View style={[styles.badge, styles.badgeNope, nopeStyle]} pointerEvents="none">
          <Text style={styles.badgeText}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.badgeYum, yumStyle]} pointerEvents="none">
          <Text style={styles.badgeText}>YUM</Text>
        </Animated.View>

        <View style={styles.tagsTop}>
          {dietaryTags.map(t => <Chip key={t} label={t} variant="dietary" />)}
        </View>

        <GlassPanel intensity={40} tint="dark" style={styles.info} radius={radius.xl}>
          <View style={{ padding: spacing.lg }}>
            <View style={styles.countryRow}>
              <Text style={styles.flag}>{flagEmoji}</Text>
              <Text style={styles.country}>{dish.country}</Text>
            </View>
            <Text style={styles.name}>{dish.name}</Text>
            <View style={styles.bottomRow}>
              <Text style={styles.price}>{'$'.repeat(dish.price_tier)}</Text>
              <Pressable onPress={onPressDetails} hitSlop={12}>
                <Text style={styles.detailsLink}>View details ›</Text>
              </Pressable>
            </View>
          </View>
        </GlassPanel>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.xl * 1.5, overflow: 'hidden',
    backgroundColor: '#222', ...shadow.soft,
  },
  darkGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tagsTop: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    gap: spacing.xs, alignItems: 'flex-end',
  },
  info: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  flag: { fontSize: 22 },
  country: { color: 'rgba(255,255,255,0.85)', fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xs, letterSpacing: 2, textTransform: 'uppercase' },
  name: { color: '#fff', fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.xl, lineHeight: typography.sizes.xl * 1.2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  price: { color: colors.primary, fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes.lg },
  detailsLink: { color: '#fff', fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.sm },
  badge: {
    position: 'absolute', top: 48,
    borderWidth: 4, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  badgeNope: { left: spacing.lg, borderColor: colors.danger, transform: [{ rotate: '-12deg' }] },
  badgeYum: { right: spacing.lg, borderColor: colors.success, transform: [{ rotate: '12deg' }] },
  badgeText: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], letterSpacing: 2 },
});
