import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  amount_ttc: number;
  status: string;
  created_at: string;
  due_date?: string;
}

export default function InvoicesScreen({ navigation }: any) {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        throw new Error('Erreur lors du chargement des factures');
      }
    } catch (error: any) {
      console.error('Invoices fetch error:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#34C759';
      case 'sent': return '#007AFF';
      case 'overdue': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'sent': return 'Envoyée';
      case 'overdue': return 'En retard';
      default: return 'Brouillon';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchInvoices(); // Refresh the list
      } else {
        throw new Error('Erreur lors de la mise à jour du statut');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const downloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // For mobile, show success message instead of browser download
        Alert.alert(
          'PDF généré ! ✅',
          `Le PDF de la facture ${invoiceNumber} a été généré avec succès.\n\nDans une vraie app mobile, le PDF serait téléchargé dans le dossier Téléchargements.`,
          [{ text: 'OK' }]
        );
        
        // Clean up the blob URL
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Erreur lors de la génération du PDF');
      }
    } catch (error: any) {
      console.error('PDF download error:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const handleInvoiceAction = (invoice: Invoice) => {
    const actions = [];

    // Always add PDF download option
    actions.push({
      text: '📄 Télécharger PDF',
      onPress: () => downloadInvoicePDF(invoice.id, invoice.invoice_number)
    });

    if (invoice.status === 'draft') {
      actions.push(
        { text: 'Envoyer', onPress: () => updateInvoiceStatus(invoice.id, 'sent') },
        { text: 'Modifier', onPress: () => {} }
      );
    } else if (invoice.status === 'sent') {
      actions.push(
        { text: 'Marquer comme payée', onPress: () => updateInvoiceStatus(invoice.id, 'paid') }
      );
    }

    actions.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert('Actions', `Que souhaitez-vous faire avec la facture ${invoice.invoice_number} ?`, actions);
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => handleInvoiceAction(item)}
    >
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.clientName}>{item.client_name}</Text>
      
      <View style={styles.invoiceFooter}>
        <Text style={styles.amount}>{item.amount_ttc.toLocaleString('fr-FR')} €</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucune facture</Text>
      <Text style={styles.emptySubtitle}>
        Créez votre première facture pour commencer
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => navigation.navigate('CreateInvoice')}
      >
        <Text style={styles.createFirstButtonText}>Créer une facture</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Factures</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {invoices.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {invoices.filter(i => i.status === 'paid').length}
            </Text>
            <Text style={styles.statLabel}>Payées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {invoices.filter(i => i.status === 'sent').length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {invoices.filter(i => i.status === 'draft').length}
            </Text>
            <Text style={styles.statLabel}>Brouillons</Text>
          </View>
        </View>
      )}

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});