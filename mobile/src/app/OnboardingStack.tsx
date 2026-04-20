import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';
import { AllergenPickerScreen } from '@/features/onboarding/AllergenPickerScreen';
import { DietPickerScreen } from '@/features/onboarding/DietPickerScreen';
import { PriceRangeScreen } from '@/features/onboarding/PriceRangeScreen';

export type OnboardingParamList = {
  Welcome: undefined;
  AllergenPicker: undefined;
  DietPicker: undefined;
  PriceRange: undefined;
};

const Stack = createNativeStackNavigator<OnboardingParamList>();

export const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="AllergenPicker" component={AllergenPickerScreen} />
    <Stack.Screen name="DietPicker" component={DietPickerScreen} />
    <Stack.Screen name="PriceRange" component={PriceRangeScreen} />
  </Stack.Navigator>
);
