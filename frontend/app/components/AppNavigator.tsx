import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Onboarding Flow
import OnboardingFlow from './OnboardingFlow';

// Main App Navigation
import MainNavigator from './MainNavigator';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show login if no user
  if (!user) {
    return <LoginScreen />;
  }

  // Show onboarding if not onboarded
  if (!user.is_onboarded) {
    return <OnboardingFlow />;
  }

  // Show main app with navigation
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});