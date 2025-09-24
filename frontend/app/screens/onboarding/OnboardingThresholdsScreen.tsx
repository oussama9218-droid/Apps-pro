import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function OnboardingThresholdsScreen({ navigation, route }: any) {
  const { activityType, urssafPeriodicity, vatRegime } = route.params;
  const { token, checkAuthState } = useAuth();
  
  const [previousYearTurnover, setPreviousYearTurnover] = useState('');
  const [loading, setLoading] = useState(false);

  // Default thresholds based on activity type
  const getDefaultThresholds = () => {
    if (activityType === 'BIC') {
      return {
        micro: 188700, // 2025 threshold for BIC micro-enterprise
        vat: 91900    // 2025 VAT franchise threshold for BIC
      };
    } else {
      return {
        micro: 77700,  // 2025 threshold for BNC micro-enterprise
        vat: 36800     // 2025 VAT franchise threshold for BNC
      };
    }
  };

  const thresholds = getDefaultThresholds();

  const handleFinishOnboarding = async () => {
    setLoading(true);
    
    try {
      const profileData = {
        activity_type: activityType,
        urssaf_periodicity: urssafPeriodicity,
        vat_regime: vatRegime,
        micro_threshold: thresholds.micro,
        vat_threshold: thresholds.vat,
        previous_year_turnover: previousYearTurnover ? parseFloat(previousYearTurnover) : null
      };

      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de la sauvegarde du profil');
      }

      // Initialize mock obligations
      await fetch(`${API_URL}/api/mock/init-obligations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh auth state to update is_onboarded
      await checkAuthState();
      
      Alert.alert(
        'Configuration terminée ! 🎉',
        'Votre profil fiscal a été configuré avec succès. Bienvenue dans Pilotage Micro !',
        [{ text: 'Accéder au tableau de bord', onPress: () => {} }]
      );

    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressLine, styles.progressLineCompleted]} />
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressLine, styles.progressLineCompleted]} />
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressLine, styles.progressLineCompleted]} />
            <View style={[styles.progressDot, styles.progressActive]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Seuils et historique</Text>
          <Text style={styles.subtitle}>
            Dernière étape : configurons vos seuils personnalisés
          </Text>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>📋 Récapitulatif de votre profil</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Activité :</Text>
              <Text style={styles.summaryValue}>{activityType}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>URSSAF :</Text>
              <Text style={styles.summaryValue}>
                {urssafPeriodicity === 'monthly' ? 'Mensuel' : 'Trimestriel'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TVA :</Text>
              <Text style={styles.summaryValue}>
                {vatRegime === 'franchise' ? 'Franchise' : 
                 vatRegime === 'simplified' ? 'Simplifié' : 'Réel'}
              </Text>
            </View>
          </View>

          <View style={styles.thresholds}>
            <Text style={styles.thresholdsTitle}>🎯 Vos seuils automatiques</Text>
            <View style={styles.thresholdCard}>
              <Ionicons name="trending-up" size={24} color="#007AFF" />
              <View style={styles.thresholdInfo}>
                <Text style={styles.thresholdLabel}>Seuil micro-entrepreneur</Text>
                <Text style={styles.thresholdValue}>{thresholds.micro.toLocaleString('fr-FR')} €</Text>
              </View>
            </View>
            <View style={styles.thresholdCard}>
              <Ionicons name="receipt" size={24} color="#FF9500" />
              <View style={styles.thresholdInfo}>
                <Text style={styles.thresholdLabel}>Seuil franchise TVA</Text>
                <Text style={styles.thresholdValue}>{thresholds.vat.toLocaleString('fr-FR')} €</Text>
              </View>
            </View>
          </View>

          <View style={styles.optionalSection}>
            <Text style={styles.optionalTitle}>💡 Chiffre d'affaires N-1 (optionnel)</Text>
            <Text style={styles.optionalSubtitle}>
              Pour un suivi plus précis de vos seuils
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="analytics" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 45000"
                value={previousYearTurnover}
                onChangeText={setPreviousYearTurnover}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>€</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" />
            <Text style={styles.infoText}>
              Toutes ces informations sont modifiables à tout moment dans votre profil
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.finishButton, loading && styles.disabledButton]}
            onPress={handleFinishOnboarding}
            disabled={loading}
          >
            <Text style={styles.finishButtonText}>
              {loading ? 'Configuration...' : 'Terminer la configuration'}
            </Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </TouchableOpacity>
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
    flexGrow: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressActive: {
    backgroundColor: '#007AFF',
  },
  progressCompleted: {
    backgroundColor: '#34C759',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  progressLineCompleted: {
    backgroundColor: '#34C759',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  thresholds: {
    marginBottom: 24,
  },
  thresholdsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  thresholdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thresholdInfo: {
    flex: 1,
    marginLeft: 12,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionalSection: {
    marginBottom: 24,
  },
  optionalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputSuffix: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#34C759',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    padding: 24,
  },
  finishButton: {
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
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});