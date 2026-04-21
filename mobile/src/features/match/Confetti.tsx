import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/shared/theme';

const { width: W, height: H } = Dimensions.get('window');
const COUNT = 30;
const PALETTE = [
  colors.primary,
  '#ffd166',
  '#ef476f',
  '#06d6a0',
  '#118ab2',
  '#f8e7c9',
];

type ParticleSpec = {
  startX: number;
  endX: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  rotStart: number;
  rotEnd: number;
};

const makeSpec = (seed: number): ParticleSpec => {
  // Deterministic-ish pseudo-random so confetti doesn't re-layout on re-render
  const rng = (n: number) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2);
  return {
    startX: rng(1) * W,
    endX: rng(2) * W,
    size: 6 + rng(3) * 8,
    delay: rng(4) * 400,
    duration: 1600 + rng(5) * 1200,
    color: PALETTE[Math.floor(rng(6) * PALETTE.length)] ?? colors.primary,
    rotStart: rng(7) * 360,
    rotEnd: (rng(8) - 0.5) * 720,
  };
};

const Particle: React.FC<{ spec: ParticleSpec }> = ({ spec }) => {
  const y = useSharedValue(-40);
  const x = useSharedValue(spec.startX);
  const rotation = useSharedValue(spec.rotStart);
  const opacity = useSharedValue(1);

  useEffect(() => {
    y.value = withTiming(H + 40, { duration: spec.duration, easing: Easing.in(Easing.quad) });
    x.value = withTiming(spec.endX, { duration: spec.duration, easing: Easing.inOut(Easing.quad) });
    rotation.value = withTiming(spec.rotStart + spec.rotEnd, { duration: spec.duration });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: spec.duration - 400 }),
      withTiming(0, { duration: 300 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: spec.size,
          height: spec.size * 1.6,
          backgroundColor: spec.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
};

export const Confetti: React.FC = () => {
  const specs = React.useMemo(
    () => Array.from({ length: COUNT }, (_, i) => makeSpec(i + Date.now() / 1000)),
    []
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {specs.map((spec, i) => (
        <Particle key={i} spec={spec} />
      ))}
    </View>
  );
};
