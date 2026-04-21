import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SwipeScreen } from '@/features/discover/SwipeScreen';
import { MatchRevealScreen } from '@/features/match/MatchRevealScreen';
import { LikedGalleryScreen } from '@/features/matches/LikedGalleryScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { FiltersScreen } from '@/features/settings/FiltersScreen';
import { DataScreen } from '@/features/settings/DataScreen';
import { DevMenuScreen } from '@/features/settings/DevMenuScreen';
import { colors } from '@/shared/theme';

const Tab = createBottomTabNavigator();
const DiscoverStack = createNativeStackNavigator();
const MatchesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const DiscoverNav = () => (
  <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStack.Screen name="Swipe" component={SwipeScreen} />
    <DiscoverStack.Screen
      name="MatchReveal"
      component={MatchRevealScreen}
      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
    />
  </DiscoverStack.Navigator>
);
const MatchesNav = () => (
  <MatchesStack.Navigator>
    <MatchesStack.Screen name="Liked" component={LikedGalleryScreen} options={{ title: 'Liked Foods' }} />
  </MatchesStack.Navigator>
);
const ProfileNav = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);
const SettingsNav = () => (
  <SettingsStack.Navigator>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    <SettingsStack.Screen name="Filters" component={FiltersScreen} options={{ title: 'Filters' }} />
    <SettingsStack.Screen name="Data" component={DataScreen} options={{ title: 'Data' }} />
    <SettingsStack.Screen name="DevMenu" component={DevMenuScreen} options={{ title: 'Dev menu' }} />
  </SettingsStack.Navigator>
);

export const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    }}
  >
    <Tab.Screen
      name="Discover"
      component={DiscoverNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🔥</Text> }}
    />
    <Tab.Screen
      name="Matches"
      component={MatchesNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>♥</Text> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text> }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsNav}
      options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙</Text> }}
    />
  </Tab.Navigator>
);
