import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingWelcomeScreen({ onNext }: { onNext: () => void }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          <Text style={styles.title}>
            Bienvenue {user?.first_name} ! 👋
          </Text>
          <Text style={styles.subtitle}>
            Configurons votre profil fiscal pour personnaliser votre expérience
          </Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <Text style={styles.benefitText}>
              Suivi automatique de vos seuils micro-entrepreneur et TVA
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <Text style={styles.benefitText}>
              Rappels personnalisés pour vos déclarations URSSAF
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.benefitText}>
              Facturation conforme avec mentions légales automatiques
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="analytics" size={24} color="#007AFF" />
            <Text style={styles.benefitText}>
              Dashboard de conformité en temps réel
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('OnboardingActivity')}
          >
            <Text style={styles.startButtonText}>Commencer la configuration</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.timeInfo}>
            ⏱️ 2 minutes pour configurer votre profil
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefits: {
    flex: 1,
    justifyContent: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  timeInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});