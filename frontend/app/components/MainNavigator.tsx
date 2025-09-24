import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import InvoicesScreen from '../screens/main/InvoicesScreen';
import CreateInvoiceScreen from '../screens/main/CreateInvoiceScreen';
import ClientsScreen from '../screens/main/ClientsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

type TabName = 'dashboard' | 'invoices' | 'clients' | 'notifications' | 'profile';
type InvoiceScreen = 'list' | 'create';

export default function MainNavigator() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [invoiceScreen, setInvoiceScreen] = useState<InvoiceScreen>('list');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'invoices':
        if (invoiceScreen === 'create') {
          return (
            <CreateInvoiceScreen 
              navigation={{
                goBack: () => setInvoiceScreen('list'),
                navigate: (screen: string) => {
                  if (screen === 'InvoicesList') setInvoiceScreen('list');
                }
              }}
            />
          );
        }
        return (
          <InvoicesScreen 
            navigation={{
              navigate: (screen: string, params?: any) => {
                if (screen === 'CreateInvoice') setInvoiceScreen('create');
              },
              addListener: () => () => {}, // Mock for useEffect listener
            }}
          />
        );
      case 'clients':
        return (
          <ClientsScreen
            navigation={{
              navigate: (screen: string, params?: any) => {
                if (screen === 'CreateInvoice') {
                  setActiveTab('invoices');
                  setInvoiceScreen('create');
                }
              }
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            navigation={{
              goBack: () => setActiveTab('dashboard')
            }}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getTabIcon = (tabName: TabName, focused: boolean) => {
    const iconMap = {
      dashboard: focused ? 'analytics' : 'analytics-outline',
      invoices: focused ? 'document-text' : 'document-text-outline', 
      clients: focused ? 'people' : 'people-outline',
      notifications: focused ? 'notifications' : 'notifications-outline',
      profile: focused ? 'person' : 'person-outline',
    };
    return iconMap[tabName] as keyof typeof Ionicons.glyphMap;
  };

  const getTabLabel = (tabName: TabName) => {
    const labelMap = {
      dashboard: 'Tableau de bord',
      invoices: 'Factures',
      clients: 'Clients',
      notifications: 'Notifications',
      profile: 'Profil',
    };
    return labelMap[tabName];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        {(['dashboard', 'invoices', 'clients', 'notifications', 'profile'] as TabName[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === 'invoices') setInvoiceScreen('list'); // Reset to list when switching to invoices
              }}
            >
              <Ionicons
                name={getTabIcon(tab, isActive)}
                size={22}
                color={isActive ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel
              ]}>
                {getTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active tab styling can be added here if needed
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});