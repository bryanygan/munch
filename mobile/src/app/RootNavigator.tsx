import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { usePreferencesStore } from '@/domain/preferences/store';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';

export const RootNavigator = () => {
  const onboardingCompleted = usePreferencesStore(s => s.preferences.onboardingCompleted);
  return (
    <NavigationContainer>
      {onboardingCompleted ? <MainTabs /> : <OnboardingStack />}
    </NavigationContainer>
  );
};
