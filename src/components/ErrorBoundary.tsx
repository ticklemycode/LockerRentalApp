import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ErrorBoundaryProps {
  error?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  onDismiss,
  title = 'Something went wrong',
  message,
  showRetry = true,
}) => {
  if (!error) return null;

  return (
    <View style={styles.container}>
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color="#E74C3C" />
        
        <Text style={styles.title}>{title}</Text>
        
        <Text style={styles.message}>
          {message || error || 'An unexpected error occurred. Please try again.'}
        </Text>

        <View style={styles.buttonContainer}>
          {showRetry && onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Icon name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
          
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dismissText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
