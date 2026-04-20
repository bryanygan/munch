import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/Button';
import { colors, spacing, typography } from '@/shared/theme';
import type { OnboardingParamList } from '@/app/OnboardingStack';

export const WelcomeScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingParamList>>();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
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
