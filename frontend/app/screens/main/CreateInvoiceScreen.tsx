import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function CreateInvoiceScreen({ navigation }: any) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    description: '',
    amountHT: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    console.log('📝 Validation du formulaire:', formData);
    
    const { clientName, clientEmail, clientAddress, description, amountHT } = formData;
    
    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Le nom du client est requis');
      console.log('❌ Validation failed: clientName empty');
      return false;
    }
    
    if (!clientEmail.trim()) {
      Alert.alert('Erreur', 'L\'email du client est requis');
      console.log('❌ Validation failed: clientEmail empty');
      return false;
    }
    
    if (!clientAddress.trim()) {
      Alert.alert('Erreur', 'L\'adresse du client est requise');
      console.log('❌ Validation failed: clientAddress empty');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description de la prestation est requise');
      console.log('❌ Validation failed: description empty');
      return false;
    }
    
    const amount = parseFloat(amountHT);
    if (!amountHT.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Le montant HT doit être un nombre positif');
      console.log('❌ Validation failed: amountHT invalid:', amountHT);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      Alert.alert('Erreur', 'L\'adresse email n\'est pas valide');
      console.log('❌ Validation failed: clientEmail invalid format');
      return false;
    }
    
    console.log('✅ Validation passed');
    return true;
  };

  const handleCreateInvoice = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const invoiceData = {
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_address: formData.clientAddress,
        description: formData.description,
        amount_ht: parseFloat(formData.amountHT),
      };

      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la création de la facture');
      }

      const newInvoice = await response.json();
      
      Alert.alert(
        'Facture créée ! ✅',
        `Facture ${newInvoice.invoice_number} créée avec succès pour ${formData.clientName}`,
        [
          { 
            text: 'Créer une autre', 
            onPress: () => setFormData({
              clientName: '',
              clientEmail: '',
              clientAddress: '',
              description: '',
              amountHT: '',
            })
          },
          { 
            text: 'Voir les factures', 
            onPress: () => navigation.goBack() 
          }
        ]
      );

    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTTC = () => {
    const amountHT = parseFloat(formData.amountHT);
    if (isNaN(amountHT)) return 0;
    // Pour simplifier, on assume 20% de TVA si applicable
    // En réalité, cela dépend du régime de TVA de l'utilisateur
    return amountHT; // Pas de TVA en franchise
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Nouvelle facture</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏢 Informations client</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom du client *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom de l'entreprise ou de la personne"
                    value={formData.clientName}
                    onChangeText={(value) => updateFormData('clientName', value)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="contact@client.com"
                    value={formData.clientEmail}
                    onChangeText={(value) => updateFormData('clientEmail', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse de facturation *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="123 rue de la République&#10;75001 Paris"
                    value={formData.clientAddress}
                    onChangeText={(value) => updateFormData('clientAddress', value)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💼 Prestation</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Décrivez votre prestation&#10;Ex: Développement site web, consultation, formation..."
                    value={formData.description}
                    onChangeText={(value) => updateFormData('description', value)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant HT *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={formData.amountHT}
                    onChangeText={(value) => updateFormData('amountHT', value)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputSuffix}>€ HT</Text>
                </View>
              </View>
            </View>

            {formData.amountHT && !isNaN(parseFloat(formData.amountHT)) && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>💰 Récapitulatif</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Montant HT :</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(formData.amountHT).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TVA (franchise) :</Text>
                  <Text style={styles.summaryValue}>0,00 €</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total TTC :</Text>
                  <Text style={styles.summaryTotalValue}>
                    {calculateTTC().toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </Text>
                </View>
                <Text style={styles.vatNotice}>
                  TVA non applicable, art. 293 B du CGI
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Votre facture sera automatiquement numérotée et contiendra toutes les mentions légales requises
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateInvoice}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Création...' : 'Créer la facture'}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginTop: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#666',
    alignSelf: 'center',
    marginLeft: 8,
  },
  summary: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#007AFF',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vatNotice: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    padding: 16,
  },
  createButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});