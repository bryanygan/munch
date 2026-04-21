import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '@/shared/theme';
import { errorMonitoring } from '@/shared/errorMonitoring';

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    errorMonitoring.captureException(error, {
      tags: { boundary: 'root' },
      extra: { componentStack: info.componentStack ?? undefined },
    });
  }

  handleReset = () => this.setState({ error: null });

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.body}>The error has been reported. Try again?</Text>
        <Button label="Try again" onPress={this.handleReset} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.backgroundLight },
  title: { fontFamily: typography.fontFamily.extraBold, fontSize: typography.sizes['2xl'], color: colors.textPrimary },
  body: { fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
});
