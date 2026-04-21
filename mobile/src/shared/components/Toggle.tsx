import React from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '@/shared/theme';

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
};

export const Toggle: React.FC<Props> = ({ value, onValueChange, accessibilityLabel }) => {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value]);
  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 24] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['#cbd5e1', colors.primary] });
  return (
    <Pressable onPress={() => onValueChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: translate }] }]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: { width: 48, height: 26, borderRadius: radius.full, justifyContent: 'center' },
  thumb: {
    width: 22, height: 22, borderRadius: radius.full,
    backgroundColor: '#fff', position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
});
