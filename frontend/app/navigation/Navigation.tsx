import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Onboarding Screens
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingActivityScreen from '../screens/onboarding/OnboardingActivityScreen';
import OnboardingURSSAFScreen from '../screens/onboarding/OnboardingURSSAFScreen';
import OnboardingVATScreen from '../screens/onboarding/OnboardingVATScreen';
import OnboardingThresholdsScreen from '../screens/onboarding/OnboardingThresholdsScreen';

// Main App Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import InvoicesScreen from '../screens/main/InvoicesScreen';
import CreateInvoiceScreen from '../screens/main/CreateInvoiceScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingActivity" component={OnboardingActivityScreen} />
      <Stack.Screen name="OnboardingURSSAF" component={OnboardingURSSAFScreen} />
      <Stack.Screen name="OnboardingVAT" component={OnboardingVATScreen} />
      <Stack.Screen name="OnboardingThresholds" component={OnboardingThresholdsScreen} />
    </Stack.Navigator>
  );
}

function InvoiceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InvoicesList" 
        component={InvoicesScreen} 
        options={{ title: 'Factures' }}
      />
      <Stack.Screen 
        name="CreateInvoice" 
        component={CreateInvoiceScreen} 
        options={{ title: 'Nouvelle facture' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Invoices') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Tableau de bord' }}
      />
      <Tab.Screen 
        name="Invoices" 
        component={InvoiceStack} 
        options={{ tabBarLabel: 'Factures' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }
  
  if (!user.is_onboarded) {
    return <OnboardingStack />;
  }
  
  return <MainTabs />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});