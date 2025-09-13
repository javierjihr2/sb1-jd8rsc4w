import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { monitoringService } from '../lib/monitoring';
import { nativeFirebaseService } from '../lib/firebase-native';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: any, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const { onError, componentName } = this.props;
    
    // Actualizar estado con información del error
    this.setState({
      error,
      errorInfo
    });

    // Registrar error en el sistema de monitoreo
    this.logError(error, errorInfo, componentName);

    // Callback personalizado
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: any, componentName?: string) => {
    try {
      const context = componentName || 'ErrorBoundary';
      
      // Registrar en el sistema de monitoreo
      monitoringService.recordError(error, context);
      
      // Información adicional para Crashlytics nativo
      if (nativeFirebaseService.isAvailable()) {
        nativeFirebaseService.setAttribute('error_boundary_component', context);
        nativeFirebaseService.setAttribute('error_component_stack', errorInfo?.componentStack?.substring(0, 500) || 'unknown');
        nativeFirebaseService.log(`Error Boundary triggered in ${context}: ${error.message}`);
      }

      // Log detallado para desarrollo
      console.error('🚨 Error Boundary capturó un error:', {
        component: context,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack
      });

      // Trackear evento de error
      monitoringService.trackEvent('error_boundary_triggered', {
        component_name: context,
        error_message: error.message,
        error_type: error.name,
        has_component_stack: !!errorInfo?.componentStack,
        timestamp: Date.now()
      });
    } catch (loggingError) {
      console.error('Error al registrar error en ErrorBoundary:', loggingError);
    }
  };

  private handleRetry = () => {
    const { componentName } = this.props;
    
    // Trackear intento de recuperación
    monitoringService.trackEvent('error_boundary_retry', {
      component_name: componentName || 'ErrorBoundary',
      timestamp: Date.now()
    });

    // Resetear estado
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError && error) {
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback(error, errorInfo, this.handleRetry);
      }

      // Fallback por defecto
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>¡Oops! Algo salió mal</Text>
            <Text style={styles.subtitle}>
              Se produjo un error inesperado en {componentName || 'la aplicación'}
            </Text>
            
            <ScrollView style={styles.errorDetails} showsVerticalScrollIndicator={false}>
              <Text style={styles.errorText}>
                <Text style={styles.errorLabel}>Error: </Text>
                {error.message}
              </Text>
              
              {__DEV__ && error.stack && (
                <Text style={styles.stackTrace}>
                  <Text style={styles.errorLabel}>Stack Trace: </Text>
                  {error.stack}
                </Text>
              )}
              
              {__DEV__ && errorInfo?.componentStack && (
                <Text style={styles.stackTrace}>
                  <Text style={styles.errorLabel}>Component Stack: </Text>
                  {errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              Si el problema persiste, por favor contacta al soporte técnico.
            </Text>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorDetails: {
    maxHeight: 200,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#dc3545',
  },
  stackTrace: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 16,
  },
});

// HOC para envolver componentes automáticamente
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundary 
        {...errorBoundaryProps}
        componentName={errorBoundaryProps?.componentName || WrappedComponent.displayName || WrappedComponent.name}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}

// Hook para usar ErrorBoundary programáticamente
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // Simular el comportamiento de componentDidCatch
    monitoringService.recordError(error, 'manual_error_handler');
    
    if (nativeFirebaseService.isAvailable()) {
      nativeFirebaseService.recordError(error, 'manual_error_handler');
      if (errorInfo) {
        nativeFirebaseService.log(`Manual error handler: ${error.message}`);
      }
    }
  }, []);

  return { handleError };
}

export default ErrorBoundary;