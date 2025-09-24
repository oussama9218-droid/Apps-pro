import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Onboarding Flow
import OnboardingFlow from './OnboardingFlow';

// Main App Navigation
import MainNavigator from './MainNavigator';

export default function AppNavigator() {
  const { user, loading, isAuthenticated, isOnline } = useAuth();

  console.log('🚦 AppNavigator render:', { 
    loading, 
    isAuthenticated, 
    userEmail: user?.email, 
    isOnboarded: user?.is_onboarded,
    isOnline 
  });

  // Show loading splash while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
        {!isOnline && (
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        )}
      </View>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    console.log('🔓 Showing login screen - not authenticated');
    return <LoginScreen />;
  }

  // Show onboarding if authenticated but not onboarded
  if (user && !user.is_onboarded) {
    console.log('📝 Showing onboarding - user not onboarded');
    return <OnboardingFlow />;
  }

  // Show main app - user is authenticated and onboarded
  console.log('🎯 Showing main app - user ready');
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