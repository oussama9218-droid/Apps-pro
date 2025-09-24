import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface DashboardData {
  current_revenue: number;
  micro_threshold: number;
  vat_threshold: number;
  micro_threshold_percent: number;
  vat_threshold_percent: number;
  next_obligations: Obligation[];
  recent_transactions: BankTransaction[];
  activity_type: string;
  vat_regime: string;
  urssaf_periodicity: string;
}

interface Obligation {
  id: string;
  type: string;
  title: string;
  due_date: string;
  status: string;
  estimated_amount: number;
}

interface BankTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  counterparty: string;
}

export default function DashboardScreen() {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error('Erreur lors du chargement du tableau de bord');
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getThresholdColor = (percentage: number) => {
    if (percentage >= 90) return '#FF3B30';
    if (percentage >= 70) return '#FF9500';
    return '#34C759';
  };

  if (loading || !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour {user?.first_name} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Revenue Summary */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>💰 Chiffre d'affaires 2025</Text>
          <Text style={styles.revenueAmount}>
            {dashboardData.current_revenue.toLocaleString('fr-FR')} €
          </Text>
          <Text style={styles.revenueSubtitle}>
            Activité {dashboardData.activity_type} • TVA {dashboardData.vat_regime}
          </Text>
        </View>

        {/* Threshold Progress */}
        <View style={styles.thresholdsCard}>
          <Text style={styles.cardTitle}>📊 Suivi des seuils</Text>
          
          <View style={styles.thresholdItem}>
            <View style={styles.thresholdHeader}>
              <Text style={styles.thresholdLabel}>Seuil micro-entrepreneur</Text>
              <Text style={[
                styles.thresholdPercentage,
                { color: getThresholdColor(dashboardData.micro_threshold_percent) }
              ]}>
                {dashboardData.micro_threshold_percent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(dashboardData.micro_threshold_percent, 100)}%`,
                    backgroundColor: getThresholdColor(dashboardData.micro_threshold_percent)
                  }
                ]}
              />
            </View>
            <Text style={styles.thresholdAmount}>
              {dashboardData.current_revenue.toLocaleString('fr-FR')} € / {dashboardData.micro_threshold.toLocaleString('fr-FR')} €
            </Text>
          </View>

          <View style={styles.thresholdItem}>
            <View style={styles.thresholdHeader}>
              <Text style={styles.thresholdLabel}>Seuil franchise TVA</Text>
              <Text style={[
                styles.thresholdPercentage,
                { color: getThresholdColor(dashboardData.vat_threshold_percent) }
              ]}>
                {dashboardData.vat_threshold_percent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(dashboardData.vat_threshold_percent, 100)}%`,
                    backgroundColor: getThresholdColor(dashboardData.vat_threshold_percent)
                  }
                ]}
              />
            </View>
            <Text style={styles.thresholdAmount}>
              {dashboardData.current_revenue.toLocaleString('fr-FR')} € / {dashboardData.vat_threshold.toLocaleString('fr-FR')} €
            </Text>
          </View>
        </View>

        {/* Next Obligations */}
        <View style={styles.obligationsCard}>
          <Text style={styles.cardTitle}>📅 Prochaines obligations</Text>
          {dashboardData.next_obligations.length > 0 ? (
            dashboardData.next_obligations.map((obligation) => (
              <View key={obligation.id} style={styles.obligationItem}>
                <View style={styles.obligationIcon}>
                  <Ionicons name="calendar" size={24} color="#007AFF" />
                </View>
                <View style={styles.obligationInfo}>
                  <Text style={styles.obligationTitle}>{obligation.title}</Text>
                  <Text style={styles.obligationDate}>
                    Échéance : {formatDate(obligation.due_date)}
                  </Text>
                  {obligation.estimated_amount && (
                    <Text style={styles.obligationAmount}>
                      Estimation : {obligation.estimated_amount.toLocaleString('fr-FR')} €
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.obligationAction}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#34C759" />
              <Text style={styles.emptyStateText}>
                Aucune obligation en attente ! 🎉
              </Text>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <Text style={styles.cardTitle}>🏦 Dernières transactions (simulation)</Text>
          {dashboardData.recent_transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date)} • {transaction.counterparty}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>
                +{transaction.amount.toLocaleString('fr-FR')} €
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.connectBankButton}>
            <Ionicons name="link" size={20} color="#007AFF" />
            <Text style={styles.connectBankText}>
              Connecter votre banque (bientôt disponible)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>⚡ Actions rapides</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>Créer une facture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="analytics" size={24} color="#FF9500" />
              <Text style={styles.actionButtonText}>Voir les rapports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  revenueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  revenueSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  thresholdsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  thresholdItem: {
    marginBottom: 20,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  thresholdPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdAmount: {
    fontSize: 12,
    color: '#666',
  },
  obligationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  obligationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  obligationIcon: {
    marginRight: 12,
  },
  obligationInfo: {
    flex: 1,
  },
  obligationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  obligationDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  obligationAmount: {
    fontSize: 14,
    color: '#007AFF',
  },
  obligationAction: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#34C759',
    marginTop: 12,
    textAlign: 'center',
  },
  transactionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  connectBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  connectBankText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
  },
});