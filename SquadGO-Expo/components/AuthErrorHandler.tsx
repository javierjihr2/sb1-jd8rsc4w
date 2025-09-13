import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContextSimple';
import { Ionicons } from '@expo/vector-icons';

interface AuthErrorHandlerProps {
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  maxRetries?: number;
  style?: any;
  onRetrySuccess?: () => void;
  onMaxRetriesReached?: () => void;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  showRetryButton = true,
  showDismissButton = true,
  maxRetries = 3,
  style,
  onRetrySuccess,
  onMaxRetriesReached
}) => {
  const { error, retryCount, lastError, retry, clearError } = useAuth();

  if (!error) {
    return null;
  }

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      Alert.alert(
        'Máximo de reintentos alcanzado',
        'Se ha alcanzado el número máximo de reintentos. Por favor, verifica tu conexión a internet y vuelve a intentar más tarde.',
        [
          { text: 'Entendido', onPress: () => onMaxRetriesReached?.() }
        ]
      );
      return;
    }

    try {
      await retry();
      onRetrySuccess?.();
    } catch (retryError) {
      console.error('Error en reintento:', retryError);
    }
  };

  const getErrorIcon = () => {
    if (error.includes('red') || error.includes('conexión')) {
      return 'wifi-outline';
    }
    if (error.includes('permisos') || error.includes('autenticación')) {
      return 'lock-closed-outline';
    }
    if (error.includes('servidor') || error.includes('servicio')) {
      return 'server-outline';
    }
    return 'alert-circle-outline';
  };

  const getErrorSeverity = () => {
    if (retryCount >= maxRetries) return 'critical';
    if (retryCount >= 2) return 'warning';
    return 'info';
  };

  const severity = getErrorSeverity();

  return (
    <View style={[styles.container, styles[severity], style]}>
      <View style={styles.header}>
        <Ionicons 
          name={getErrorIcon() as any} 
          size={24} 
          color={styles[severity].borderColor} 
        />
        <Text style={[styles.title, { color: styles[severity].borderColor }]}>
          Error de Autenticación
        </Text>
      </View>
      
      <Text style={styles.message}>{error}</Text>
      
      {lastError && (
        <Text style={styles.timestamp}>
          Último error: {lastError.toLocaleTimeString()}
        </Text>
      )}
      
      {retryCount > 0 && (
        <Text style={styles.retryInfo}>
          Intentos: {retryCount}/{maxRetries}
        </Text>
      )}
      
      <View style={styles.actions}>
        {showRetryButton && retryCount < maxRetries && (
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={handleRetry}
          >
            <Ionicons name="refresh-outline" size={16} color="white" />
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        
        {showDismissButton && (
          <TouchableOpacity 
            style={[styles.button, styles.dismissButton]} 
            onPress={clearError}
          >
            <Ionicons name="close-outline" size={16} color="#666" />
            <Text style={[styles.buttonText, { color: '#666' }]}>Descartar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  info: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  warning: {
    borderColor: '#f39c12',
    backgroundColor: '#fffbf0',
  },
  critical: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  retryInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  retryButton: {
    backgroundColor: '#3498db',
  },
  dismissButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

// Componente simplificado para mostrar solo el estado de error
export const AuthErrorBadge: React.FC<{
  style?: any;
  onPress?: () => void;
}> = ({ style, onPress }) => {
  const { error, retryCount } = useAuth();

  if (!error) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={[badgeStyles.badge, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="alert-circle" size={16} color="#e74c3c" />
      <Text style={badgeStyles.badgeText}>
        Error de autenticación
        {retryCount > 0 && ` (${retryCount})`}
      </Text>
    </TouchableOpacity>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderColor: '#e74c3c',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
});

// Agregar estilos del badge al objeto principal
Object.assign(styles, badgeStyles);

// Hook para usar el manejo de errores de autenticación
export const useAuthErrorHandler = () => {
  const { error, retryCount, lastError, retry, clearError } = useAuth();

  const hasError = !!error;
  const canRetry = hasError && retryCount < 3;
  const isMaxRetriesReached = retryCount >= 3;

  const handleRetryWithFeedback = async () => {
    if (!canRetry) {
      Alert.alert(
        'No se puede reintentar',
        isMaxRetriesReached 
          ? 'Se ha alcanzado el número máximo de reintentos.'
          : 'No hay errores para reintentar.'
      );
      return false;
    }

    try {
      await retry();
      return true;
    } catch (error) {
      Alert.alert(
        'Error en reintento',
        'No se pudo completar el reintento. Por favor, verifica tu conexión.'
      );
      return false;
    }
  };

  const showErrorAlert = () => {
    if (!hasError) return;

    Alert.alert(
      'Error de Autenticación',
      error,
      [
        { text: 'Descartar', onPress: clearError },
        ...(canRetry ? [{ text: 'Reintentar', onPress: handleRetryWithFeedback }] : [])
      ]
    );
  };

  return {
    hasError,
    error,
    retryCount,
    lastError,
    canRetry,
    isMaxRetriesReached,
    retry: handleRetryWithFeedback,
    clearError,
    showErrorAlert
  };
};