'use strict';
/**
 * Manual mock for react-native-reanimated (v4.x).
 *
 * Reanimated 4 depends on react-native-worklets which attempts to initialise a
 * native worklet runtime at import time — this crashes Jest. We supply a
 * lightweight stand-in that satisfies the API surface used by SwipeCard
 * (and the rest of the app) without touching any native modules.
 */
const React = require('react');
const { View, Text, Image, ScrollView, FlatList } = require('react-native');

// ─── shared-value stub ───────────────────────────────────────────────────────
const makeSharedValue = (init) => {
  const box = { value: init };
  return new Proxy(box, {
    get(t, p) { return p === 'value' ? t.value : undefined; },
    set(t, p, v) { if (p === 'value') t.value = v; return true; },
  });
};

// ─── animation stubs ─────────────────────────────────────────────────────────
const NOOP = () => {};
const ID = (v) => v;
const withTiming = (toValue, _config, callback) => { if (callback) callback(true); return toValue; };
const withSpring = (toValue, _config, callback) => { if (callback) callback(true); return toValue; };
const withDecay = (config) => config.velocity ?? 0;
const withDelay = (_delay, anim) => anim;
const withSequence = (...anims) => anims[anims.length - 1] ?? 0;
const withRepeat = (anim) => anim;
const cancelAnimation = NOOP;
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

// ─── interpolation ───────────────────────────────────────────────────────────
const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
const interpolate = (value, inputRange, outputRange) => {
  const [inMin, inMax] = [inputRange[0], inputRange[inputRange.length - 1]];
  const [outMin, outMax] = [outputRange[0], outputRange[outputRange.length - 1]];
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
};
const interpolateColor = (_v, _i, _o) => 'rgba(0,0,0,1)';

// ─── hooks ────────────────────────────────────────────────────────────────────
const useSharedValue = makeSharedValue;
const useAnimatedStyle = (fn) => {
  try { return fn(); } catch { return {}; }
};
const useDerivedValue = (fn) => makeSharedValue(fn());
const useAnimatedProps = (fn) => { try { return fn(); } catch { return {}; } };
const useAnimatedScrollHandler = () => NOOP;
const useAnimatedRef = () => ({ current: null });
const useAnimatedReaction = NOOP;
const useAnimatedSensor = () => ({ sensor: makeSharedValue(0), unregister: NOOP });
const useFrameCallback = NOOP;
const useScrollViewOffset = () => makeSharedValue(0);
const useReducedMotion = () => false;
// Used internally by react-native-gesture-handler's GestureDetector
const useEvent = (_handler, _eventNames, _rebuild) => NOOP;

// ─── gesture-handler-facing shim (accessed as default.useEvent, default.useSharedValue) ─
// react-native-gesture-handler imports the default export and calls methods on it
const reanimatedDefaultMethods = {
  useSharedValue,
  useAnimatedStyle,
  useEvent,
};

// ─── animated components ─────────────────────────────────────────────────────
const createAnimatedComponent = (Component) => {
  const Wrapped = React.forwardRef(({ style, animatedProps, ...rest }, ref) => {
    // Merge static + animated styles (both may be plain objects in test env)
    const merged = [style, animatedProps?.style].filter(Boolean);
    return React.createElement(Component, { ...rest, style: merged, ref });
  });
  Wrapped.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  Image: createAnimatedComponent(Image),
  ScrollView: createAnimatedComponent(ScrollView),
  FlatList: createAnimatedComponent(FlatList),
  createAnimatedComponent,
  // gesture handler accesses these from the default export
  ...reanimatedDefaultMethods,
};

// ─── misc exports ─────────────────────────────────────────────────────────────
const ReduceMotion = { Never: 'never', Always: 'always', System: 'system' };
const SensorType = {};
const IOSReferenceFrame = {};
const InterfaceOrientation = {};
const KeyboardState = {};
const ColorSpace = {};
const reanimatedVersion = '4.x-mock';
const getAnimatedStyle = (ref) => ref?.current?.style ?? {};
const advanceAnimationByFrame = NOOP;
const advanceAnimationByTime = NOOP;
const withReanimatedTimer = (fn) => fn();
const setUpTests = NOOP;

module.exports = {
  default: Animated,
  ...Animated,
  // hooks
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedProps,
  useEvent,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedSensor,
  useFrameCallback,
  useScrollViewOffset,
  useReducedMotion,
  // animations
  withTiming,
  withSpring,
  withDecay,
  withDelay,
  withSequence,
  withRepeat,
  cancelAnimation,
  runOnJS,
  runOnUI,
  // interpolation
  interpolate,
  interpolateColor,
  Extrapolation,
  // animated component factory
  createAnimatedComponent,
  // misc
  ReduceMotion,
  SensorType,
  IOSReferenceFrame,
  InterfaceOrientation,
  KeyboardState,
  ColorSpace,
  reanimatedVersion,
  getAnimatedStyle,
  advanceAnimationByFrame,
  advanceAnimationByTime,
  withReanimatedTimer,
  setUpTests,
  // layout animations (no-ops)
  FadeIn: {},
  FadeOut: {},
  FadeInUp: {},
  FadeOutDown: {},
  SlideInLeft: {},
  SlideOutRight: {},
  ZoomIn: {},
  ZoomOut: {},
  Layout: {},
  LinearTransition: {},
  BaseAnimationBuilder: {},
  ComplexAnimationBuilder: {},
};
