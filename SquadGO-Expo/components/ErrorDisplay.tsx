// Componente para mostrar errores de manera elegante
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { errorLogger, ErrorSeverity } from '../lib/error-logger';
import { globalErrorHandler } from '../lib/global-error-handler';

// Tipos de props
interface ErrorDisplayProps {
  error?: Error | string | null;
  severity?: ErrorSeverity;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  showRetryButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  customMessage?: string;
  style?: any;
}

// Componente principal
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  severity = ErrorSeverity.MEDIUM,
  onRetry,
  onDismiss,
  showRetryButton = true,
  autoHide = false,
  autoHideDelay = 5000,
  customMessage,
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (error) {
      showError();
      
      if (autoHide) {
        const timer = setTimeout(() => {
          hideError();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      hideError();
    }
  }, [error, autoHide, autoHideDelay]);

  const showError = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();
  };

  const hideError = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      hideError();
    } catch (retryError) {
      // El error será manejado por el global error handler
      console.error('Error en retry:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    hideError();
    onDismiss?.();
  };

  const getErrorMessage = (): string => {
    if (customMessage) return customMessage;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Ocurrió un error inesperado';
  };

  const getErrorIcon = (): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'alert-circle';
      case ErrorSeverity.HIGH:
        return 'warning';
      case ErrorSeverity.MEDIUM:
        return 'information-circle';
      case ErrorSeverity.LOW:
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  const getErrorColor = (): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '#DC2626'; // Red-600
      case ErrorSeverity.HIGH:
        return '#EA580C'; // Orange-600
      case ErrorSeverity.MEDIUM:
        return '#2563EB'; // Blue-600
      case ErrorSeverity.LOW:
        return '#059669'; // Green-600
      default:
        return '#6B7280'; // Gray-500
    }
  };

  if (!isVisible || !error) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: getErrorColor()
        },
        style
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getErrorIcon() as any}
            size={24}
            color={getErrorColor()}
          />
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: getErrorColor() }]}>
            {getErrorMessage()}
          </Text>
          
          {severity === ErrorSeverity.CRITICAL && (
            <Text style={styles.criticalNote}>
              Este es un error crítico que requiere atención inmediata.
            </Text>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {showRetryButton && onRetry && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.retryButton,
                { backgroundColor: getErrorColor() },
                isRetrying && styles.buttonDisabled
              ]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              <Ionicons
                name={isRetrying ? 'hourglass' : 'refresh'}
                size={16}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isRetrying ? 'Reintentando...' : 'Reintentar'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={16} color="#6B7280" />
            <Text style={[styles.buttonText, { color: '#6B7280' }]}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Hook para usar el ErrorDisplay
export const useErrorDisplay = () => {
  const [error, setError] = useState<Error | string | null>(null);
  const [severity, setSeverity] = useState<ErrorSeverity>(ErrorSeverity.MEDIUM);
  const [retryCallback, setRetryCallback] = useState<(() => Promise<void>) | null>(null);

  const showError = (
    errorToShow: Error | string,
    errorSeverity: ErrorSeverity = ErrorSeverity.MEDIUM,
    onRetry?: () => Promise<void>
  ) => {
    setError(errorToShow);
    setSeverity(errorSeverity);
    setRetryCallback(() => onRetry || null);
  };

  const hideError = () => {
    setError(null);
    setRetryCallback(null);
  };

  const handleError = async (
    errorToHandle: Error | string,
    options: {
      severity?: ErrorSeverity;
      showDisplay?: boolean;
      onRetry?: () => Promise<void>;
      customMessage?: string;
    } = {}
  ) => {
    const {
      severity: errorSeverity = ErrorSeverity.MEDIUM,
      showDisplay = true,
      onRetry,
      customMessage
    } = options;

    // Registrar error en el sistema global
    await globalErrorHandler.handleError(errorToHandle, {
      severity: errorSeverity,
      showAlert: false, // No mostrar alert nativo
      customMessage
    });

    // Mostrar en el componente si está habilitado
    if (showDisplay) {
      showError(customMessage || errorToHandle, errorSeverity, onRetry);
    }
  };

  return {
    error,
    severity,
    retryCallback,
    showError,
    hideError,
    handleError
  };
};

// Componente de error boundary mejorado
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Registrar error
    const errorId = await errorLogger.logError(
      error,
      'runtime' as any,
      ErrorSeverity.CRITICAL,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    );

    this.setState({ errorId });
    this.props.onError?.(error, errorInfo);

    console.error('🚨 ErrorBoundary capturó un error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          severity={ErrorSeverity.CRITICAL}
          onRetry={this.retry}
          showRetryButton={true}
          customMessage="La aplicación encontró un error inesperado"
          style={styles.errorBoundaryContainer}
        />
      );
    }

    return this.props.children;
  }
}

// Estilos
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  criticalNote: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'column',
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
    // backgroundColor se establece dinámicamente
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  errorBoundaryContainer: {
    position: 'relative',
    top: 0,
    margin: 16,
  },
});

export default ErrorDisplay;