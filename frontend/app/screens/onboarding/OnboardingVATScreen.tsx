import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VATOption {
  value: string;
  title: string;
  description: string;
  threshold?: string;
  recommended?: boolean;
}

const vatOptions: VATOption[] = [
  {
    value: 'franchise',
    title: 'Franchise en base de TVA',
    description: 'Pas de TVA à facturer ni à déclarer',
    threshold: 'CA < 36 800€ (BNC) ou 91 900€ (BIC)',
    recommended: true
  },
  {
    value: 'simplified',
    title: 'Régime simplifié de TVA',
    description: 'Déclaration annuelle avec acomptes trimestriels',
    threshold: 'CA entre les seuils de franchise et 818 000€'
  },
  {
    value: 'real',
    title: 'Régime réel de TVA',
    description: 'Déclarations mensuelles ou trimestrielles',
    threshold: 'CA > 818 000€ ou option volontaire'
  }
];

interface Props {
  onNext: (data: { vatRegime: string }) => void;
  onBack: () => void;
  activityType: string;
  urssafPeriodicity: string;
}

export default function OnboardingVATScreen({ onNext, onBack, activityType, urssafPeriodicity }: Props) {
  const [selectedVAT, setSelectedVAT] = useState<string>('franchise');

  const handleContinue = () => {
    onNext({ vatRegime: selectedVAT });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressLine, styles.progressLineCompleted]} />
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={[styles.progressLine, styles.progressLineCompleted]} />
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Régime de TVA</Text>
          <Text style={styles.subtitle}>
            Quel est votre régime de TVA actuel ou souhaité ?
          </Text>

          <View style={styles.options}>
            {vatOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selectedVAT === option.value && styles.optionSelected
                ]}
                onPress={() => setSelectedVAT(option.value)}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionIcon}>
                    {option.recommended && (
                      <View style={styles.recommendedIcon}>
                        <Ionicons name="star" size={12} color="#FF9500" />
                      </View>
                    )}
                    <Ionicons
                      name="receipt"
                      size={24}
                      color={selectedVAT === option.value ? '#007AFF' : '#666'}
                    />
                  </View>
                  <Text style={[
                    styles.optionTitle,
                    selectedVAT === option.value && styles.optionTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  {selectedVAT === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
                {option.threshold && (
                  <Text style={styles.optionThreshold}>
                    {option.threshold}
                  </Text>
                )}
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommandé pour débuter</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              L'app surveillera automatiquement vos seuils et vous alertera en cas de dépassement
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  options: {
    marginBottom: 24,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    position: 'relative',
    marginRight: 12,
  },
  recommendedIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 36,
    marginBottom: 4,
  },
  optionThreshold: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 36,
    marginBottom: 8,
  },
  recommendedBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 36,
  },
  recommendedText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
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
    padding: 24,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});