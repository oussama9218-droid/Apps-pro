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

interface ActivityOption {
  value: string;
  title: string;
  description: string;
  icon: string;
}

const activityOptions: ActivityOption[] = [
  {
    value: 'BIC',
    title: 'BIC - Bénéfices Industriels et Commerciaux',
    description: 'Vente de marchandises, prestations de service commerciales, hébergement...',
    icon: 'storefront'
  },
  {
    value: 'BNC',
    title: 'BNC - Bénéfices Non Commerciaux',
    description: 'Prestations intellectuelles, consultations, formations, professions libérales...',
    icon: 'school'
  }
];

export default function OnboardingActivityScreen({ navigation }: any) {
  const [selectedActivity, setSelectedActivity] = useState<string>('');

  const handleContinue = () => {
    if (selectedActivity) {
      navigation.navigate('OnboardingURSSAF', { activityType: selectedActivity });
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
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Type d'activité</Text>
          <Text style={styles.subtitle}>
            Quel régime fiscal correspond à votre activité ?
          </Text>

          <View style={styles.options}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selectedActivity === option.value && styles.optionSelected
                ]}
                onPress={() => setSelectedActivity(option.value)}
              >
                <View style={styles.optionHeader}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={selectedActivity === option.value ? '#007AFF' : '#666'}
                  />
                  <Text style={[
                    styles.optionTitle,
                    selectedActivity === option.value && styles.optionTitleSelected
                  ]}>
                    {option.title}
                  </Text>
                  {selectedActivity === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Cette information détermine vos seuils de chiffre d'affaires et vos obligations déclaratives
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedActivity && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!selectedActivity}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedActivity && styles.disabledButtonText
            ]}>
              Continuer
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={selectedActivity ? '#fff' : '#ccc'}
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
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
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