import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface UserProfile {
  activity_type: string;
  urssaf_periodicity: string;
  vat_regime: string;
  micro_threshold: number;
  vat_threshold: number;
  previous_year_turnover?: number;
}

const APP_VERSION = '1.0.0-beta';
const FEEDBACK_URL = 'https://forms.gle/PilotageM1croFeedback'; // À remplacer par vraie URL

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        console.error('Error fetching profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      'Feedback Testeur 📝',
      'Votre avis est précieux ! Aidez-nous à améliorer Pilotage Micro.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { 
          text: 'Donner mon avis', 
          onPress: () => {
            Linking.openURL(FEEDBACK_URL).catch(() => {
              Alert.alert('Erreur', 'Impossible d\'ouvrir le formulaire de feedback');
            });
          }
        }
      ]
    );
  };

  const getActivityTypeText = (type: string) => {
    return type === 'BIC' ? 'BIC - Bénéfices Industriels et Commerciaux' : 'BNC - Bénéfices Non Commerciaux';
  };

  const getPeriodicityText = (periodicity: string) => {
    return periodicity === 'monthly' ? 'Mensuelle' : 'Trimestrielle';
  };

  const getVATRegimeText = (regime: string) => {
    switch (regime) {
      case 'franchise': return 'Franchise en base de TVA';
      case 'simplified': return 'Régime simplifié de TVA';
      case 'real': return 'Régime réel de TVA';
      default: return regime;
    }
  };

  if (loading) {
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* User Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={48} color="#007AFF" />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>BÊTA</Text>
            </View>
          </View>
        </View>

        {/* Beta Feedback Banner */}
        <View style={styles.feedbackBanner}>
          <Ionicons name="megaphone" size={24} color="#FF9500" />
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackTitle}>Version bêta - Votre avis compte !</Text>
            <Text style={styles.feedbackText}>
              Aidez-nous à améliorer l'app en partageant vos retours
            </Text>
          </View>
          <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback}>
            <Text style={styles.feedbackButtonText}>Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Fiscal Profile */}
        {profile && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💼 Profil fiscal</Text>
            
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Type d'activité</Text>
              <Text style={styles.profileValue}>{getActivityTypeText(profile.activity_type)}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Périodicité URSSAF</Text>
              <Text style={styles.profileValue}>{getPeriodicityText(profile.urssaf_periodicity)}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Régime de TVA</Text>
              <Text style={styles.profileValue}>{getVATRegimeText(profile.vat_regime)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Seuil micro-entrepreneur</Text>
              <Text style={styles.profileValue}>
                {profile.micro_threshold.toLocaleString('fr-FR')} €
              </Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Seuil franchise TVA</Text>
              <Text style={styles.profileValue}>
                {profile.vat_threshold.toLocaleString('fr-FR')} €
              </Text>
            </View>

            {profile.previous_year_turnover && (
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>CA année précédente</Text>
                <Text style={styles.profileValue}>
                  {profile.previous_year_turnover.toLocaleString('fr-FR')} €
                </Text>
              </View>
            )}
          </View>
        )}

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ À propos</Text>
          
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Version de l'application</Text>
            <Text style={styles.profileValue}>{APP_VERSION}</Text>
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Statut</Text>
            <Text style={[styles.profileValue, styles.betaStatus]}>Version bêta - Tests</Text>
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Dernière mise à jour</Text>
            <Text style={styles.profileValue}>Janvier 2025</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleFeedback}>
            <Ionicons name="chat-bubble-ellipses-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Donner son feedback (testeur)</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Modifier le profil fiscal</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pilotage Micro - Simplifiez vos obligations fiscales
          </Text>
          <Text style={styles.footerSubtext}>
            Version bêta - Développé avec ❤️ pour les micro-entrepreneurs français
          </Text>
          <Text style={styles.footerVersion}>v{APP_VERSION}</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  betaBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  feedbackBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  feedbackContent: {
    flex: 1,
    marginLeft: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  feedbackButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  profileItem: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  betaStatus: {
    color: '#FF9500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  footerVersion: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 4,
  },
});