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

interface PeriodicityOption {
  value: string;
  title: string;
  description: string;
  recommended?: string;
}

const periodicityOptions: PeriodicityOption[] = [
  {
    value: 'monthly',
    title: 'Déclaration mensuelle',
    description: 'Déclaration et paiement chaque mois',
    recommended: 'Recommandé pour un CA régulier'
  },
  {
    value: 'quarterly',
    title: 'Déclaration trimestrielle',
    description: 'Déclaration et paiement tous les 3 mois',
    recommended: 'Recommandé pour un CA irrégulier'
  }
];

interface Props {
  onNext: (data: { urssafPeriodicity: string }) => void;
  onBack: () => void;
  activityType: string;
}

export default function OnboardingURSSAFScreen({ onNext, onBack, activityType }: Props) {
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<string>('');

  const handleContinue = () => {
    if (selectedPeriodicity) {
      onNext({ urssafPeriodicity: selectedPeriodicity });
    }
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
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Périodicité URSSAF</Text>
          <Text style={styles.subtitle}>
            À quelle fréquence souhaitez-vous déclarer vos cotisations sociales ?
          </Text>

          <View style={styles.currentSelection}>
            <Text style={styles.currentSelectionLabel}>Activité sélectionnée :</Text>
            <Text style={styles.currentSelectionValue}>
              {activityType} - {activityType === 'BIC' ? 'Bénéfices Industriels et Commerciaux' : 'Bénéfices Non Commerciaux'}
            </Text>
          </View>

          <View style={styles.options}>
            {periodicityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selectedPeriodicity === option.value && styles.optionSelected
                ]}
                onPress={() => setSelectedPeriodicity(option.value)}
              >
                <View style={styles.optionHeader}>
                  <Ionicons
                    name="calendar"
                    size={24}
                    color={selectedPeriodicity === option.value ? '#007AFF' : '#666'}
                  />
                  <Text style={[
                    styles.optionTitle,
                    selectedPeriodicity === option.value && styles.optionTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  {selectedPeriodicity === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>{option.recommended}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#FF9500" />
            <Text style={styles.infoText}>
              Vous pourrez modifier cette option ultérieurement sur le site de l'URSSAF si nécessaire
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedPeriodicity && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!selectedPeriodicity}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedPeriodicity && styles.disabledButtonText
            ]}>
              Continuer
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={selectedPeriodicity ? '#fff' : '#ccc'}
            />
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
    marginBottom: 24,
  },
  currentSelection: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  currentSelectionLabel: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentSelectionValue: {
    fontSize: 16,
    color: '#1a1a1a',
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
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9500',
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#999',
  },
});