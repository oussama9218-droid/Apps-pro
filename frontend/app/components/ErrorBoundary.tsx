import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  error?: string;
  onRetry?: () => void;
  isOnline?: boolean;
}

export default function ErrorBoundary({ 
  error = 'Une erreur est survenue', 
  onRetry, 
  isOnline = true 
}: ErrorBoundaryProps) {
  const getErrorIcon = () => {
    if (!isOnline) return 'wifi-outline';
    return 'alert-circle-outline';
  };

  const getErrorMessage = () => {
    if (!isOnline) return 'Pas de connexion internet';
    return error;
  };

  const getErrorSuggestion = () => {
    if (!isOnline) return 'Vérifiez votre connexion et réessayez';
    return 'Veuillez réessayer dans quelques instants';
  };

  return (
    <View style={styles.container}>
      <Ionicons 
        name={getErrorIcon()} 
        size={64} 
        color={isOnline ? '#FF3B30' : '#FF9500'} 
      />
      <Text style={styles.errorTitle}>{getErrorMessage()}</Text>
      <Text style={styles.errorMessage}>{getErrorSuggestion()}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});