import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, spacing, typography } from '@/shared/theme';
import type { OnboardingParamList } from '@/app/OnboardingStack';
import { analytics } from '@/shared/analytics';

export const WelcomeScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  React.useEffect(() => { analytics.track({ name: 'onboarding_started' }); }, []);
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.heroWrap}>
          <View style={[styles.heroCircle, styles.heroCircleBack]} />
          <View style={[styles.heroCircle, styles.heroCircleMid]} />
          <View style={[styles.heroCircle, styles.heroCircleFront]}>
            <Text style={styles.heroEmoji}>🍽</Text>
          </View>
        </View>
        <Text style={styles.eyebrow}>Munch</Text>
        <Text style={styles.title}>
          Discover your{'\n'}
          <Text style={styles.titleAccent}>perfect dish.</Text>
        </Text>
        <Text style={styles.body}>
          Swipe through dishes from around the world. We'll learn your taste and match you with three dishes you'll love.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Get started" onPress={() => nav.navigate('AllergenPicker')} size="lg" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundLight, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  heroWrap: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    height: 180,
    justifyContent: 'center',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  heroCircleBack: {
    width: 180, height: 180,
    backgroundColor: 'rgba(242, 127, 13, 0.08)',
  },
  heroCircleMid: {
    width: 130, height: 130,
    backgroundColor: 'rgba(242, 127, 13, 0.18)',
  },
  heroCircleFront: {
    width: 90, height: 90,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  heroEmoji: { fontSize: 44 },
  eyebrow: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['3xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['3xl'] * 1.15,
  },
  titleAccent: { color: colors.primary },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    lineHeight: typography.sizes.md * 1.5,
  },
  footer: { paddingBottom: spacing.xl },
});
