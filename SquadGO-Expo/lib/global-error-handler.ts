// Sistema global de manejo de errores para React Native
import { Alert, Platform } from 'react-native';
import { errorLogger, ErrorType, ErrorSeverity } from './error-logger';
import { analyticsManager } from './analytics';
import { FirebaseError } from 'firebase/app';

// Configuración del manejador global
const ERROR_HANDLER_CONFIG = {
  showUserFriendlyMessages: true,
  enableAutoRetry: true,
  maxAutoRetries: 3,
  retryDelay: 2000,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  throttleWindow: 5000, // 5 segundos para throttling
  maxErrorsPerWindow: 3, // Máximo 3 errores por ventana
  duplicateErrorWindow: 30000 // 30 segundos para detectar duplicados
};

// Mapeo de errores a mensajes amigables
const ERROR_MESSAGES = {
  // Errores de red
  'ERR_NETWORK': 'Problema de conexión. Verifica tu internet e intenta nuevamente.',
  'ERR_ABORTED': 'La operación fue cancelada. Intenta nuevamente.',
  'ERR_TIMEOUT': 'La operación tardó demasiado. Verifica tu conexión.',
  'NETWORK_ERROR': 'Error de red. Verifica tu conexión a internet.',
  
  // Errores de Firebase
  'auth/user-not-found': 'Usuario no encontrado. Verifica tus credenciales.',
  'auth/wrong-password': 'Contraseña incorrecta. Intenta nuevamente.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'firestore/unavailable': 'Servicio temporalmente no disponible. Intenta más tarde.',
  'firestore/permission-denied': 'No tienes permisos para esta operación.',
  
  // Errores generales
  'VALIDATION_ERROR': 'Los datos ingresados no son válidos.',
  'UNKNOWN_ERROR': 'Ocurrió un error inesperado. Intenta nuevamente.',
  'OFFLINE_ERROR': 'Sin conexión a internet. Algunas funciones están limitadas.'
};

// Interfaz para opciones de manejo de errores
interface ErrorHandlingOptions {
  showAlert?: boolean;
  enableRetry?: boolean;
  retryCallback?: () => Promise<void>;
  customMessage?: string;
  severity?: ErrorSeverity;
  context?: any;
  userId?: string;
}

class GlobalErrorHandler {
  private retryAttempts = new Map<string, number>();
  private isInitialized = false;
  private errorThrottle = new Map<string, number[]>();
  private recentErrors = new Map<string, number>();

  async initialize() {
    if (this.isInitialized) return;

    // Configurar manejo global de errores no capturados
    this.setupGlobalErrorHandling();
    
    // Configurar interceptores de red
    this.setupNetworkInterceptors();
    
    this.isInitialized = true;
    console.log('🛡️ GlobalErrorHandler inicializado');
  }

  // Verificar si el error debe ser throttled
  private shouldThrottleError(errorMessage: string): boolean {
    const now = Date.now();
    const errorKey = this.getErrorKey(errorMessage);
    
    // Verificar duplicados recientes
    const lastOccurrence = this.recentErrors.get(errorKey);
    if (lastOccurrence && (now - lastOccurrence) < ERROR_HANDLER_CONFIG.duplicateErrorWindow) {
      return true; // Throttle duplicados
    }
    
    // Verificar throttling por ventana de tiempo
    const errorTimes = this.errorThrottle.get(errorKey) || [];
    const windowStart = now - ERROR_HANDLER_CONFIG.throttleWindow;
    
    // Filtrar errores dentro de la ventana actual
    const recentErrorTimes = errorTimes.filter(time => time > windowStart);
    
    if (recentErrorTimes.length >= ERROR_HANDLER_CONFIG.maxErrorsPerWindow) {
      return true; // Throttle por exceso de errores
    }
    
    // Actualizar registros
    recentErrorTimes.push(now);
    this.errorThrottle.set(errorKey, recentErrorTimes);
    this.recentErrors.set(errorKey, now);
    
    return false;
  }
  
  // Generar clave única para el error
  private getErrorKey(errorMessage: string): string {
    // Normalizar mensaje para agrupar errores similares
    return errorMessage.toLowerCase().replace(/\d+/g, 'X').substring(0, 100);
  }

  // Manejar error principal
  async handleError(
    error: Error | FirebaseError | string,
    options: ErrorHandlingOptions = {}
  ): Promise<void> {
    const {
      showAlert = true,
      enableRetry = false,
      retryCallback,
      customMessage,
      severity = ErrorSeverity.MEDIUM,
      context,
      userId
    } = options;

    // Determinar tipo de error
    const errorType = this.determineErrorType(error);
    const errorMessage = this.getErrorMessage(error);
    const userMessage = customMessage || this.getUserFriendlyMessage(error);
    
    // Verificar throttling
    if (this.shouldThrottleError(errorMessage)) {
      console.log(`⏸️ Error throttled: ${errorMessage.substring(0, 50)}...`);
      return;
    }

    // Registrar error
    const errorId = await errorLogger.logError(
      error,
      errorType,
      severity,
      context,
      userId
    );

    console.log(`🚨 Error manejado [${errorId}]:`, {
      type: errorType,
      message: errorMessage,
      userMessage,
      severity
    });

    // Mostrar alerta al usuario si está habilitado
    if (showAlert && ERROR_HANDLER_CONFIG.showUserFriendlyMessages) {
      await this.showErrorAlert(userMessage, enableRetry, retryCallback, errorId);
    }

    // Intentar recuperación automática para ciertos errores
    if (this.shouldAutoRecover(error)) {
      await this.attemptAutoRecovery(error, errorId);
    }
  }

  // Manejar errores de Firebase específicamente
  async handleFirebaseError(
    error: FirebaseError,
    operation: string,
    options: ErrorHandlingOptions = {}
  ): Promise<void> {
    const enhancedOptions = {
      ...options,
      context: {
        operation,
        firebaseCode: error.code,
        ...options.context
      }
    };

    await this.handleError(error, enhancedOptions);
  }

  // Manejar errores de red
  async handleNetworkError(
    error: Error,
    url?: string,
    method?: string,
    options: ErrorHandlingOptions = {}
  ): Promise<void> {
    const enhancedOptions = {
      ...options,
      enableRetry: true,
      context: {
        url,
        method,
        isOnline: navigator?.onLine ?? true,
        ...options.context
      }
    };

    await this.handleError(error, enhancedOptions);
  }

  // Manejar errores de validación
  async handleValidationError(
    error: Error | string,
    field?: string,
    options: ErrorHandlingOptions = {}
  ): Promise<void> {
    const enhancedOptions = {
      ...options,
      severity: ErrorSeverity.LOW,
      context: {
        field,
        type: 'validation',
        ...options.context
      }
    };

    await this.handleError(error, enhancedOptions);
  }

  // Crear wrapper para funciones async con manejo de errores
  withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorHandlingOptions = {}
  ) {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.handleError(error as Error, options);
        return null;
      }
    };
  }

  // Crear wrapper para operaciones con retry automático
  withRetry<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    maxRetries: number = ERROR_HANDLER_CONFIG.maxAutoRetries,
    options: ErrorHandlingOptions = {}
  ) {
    return async (...args: T): Promise<R> => {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries) {
            await this.handleError(lastError, {
              ...options,
              context: {
                ...options.context,
                totalAttempts: attempt,
                finalAttempt: true
              }
            });
            throw lastError;
          }
          
          // Esperar antes del siguiente intento
          await this.delay(ERROR_HANDLER_CONFIG.retryDelay * attempt);
        }
      }
      
      throw lastError!;
    };
  }

  // Métodos privados
  private determineErrorType(error: any): ErrorType {
    if (typeof error === 'string') {
      if (error.includes('validation') || error.includes('invalid')) {
        return ErrorType.VALIDATION;
      }
      return ErrorType.RUNTIME;
    }

    if (error.code) {
      if (error.code.startsWith('auth/')) return ErrorType.AUTH;
      if (error.code.startsWith('firestore/')) return ErrorType.FIREBASE;
    }

    const message = error.message || error.toString();
    if (message.includes('network') || message.includes('ERR_')) {
      return ErrorType.NETWORK;
    }

    return ErrorType.RUNTIME;
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    return error.message || error.toString() || 'Unknown error';
  }

  private getUserFriendlyMessage(error: any): string {
    const errorCode = error.code || error.name;
    const errorMessage = this.getErrorMessage(error);

    // Buscar mensaje específico por código
    if (errorCode && ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]) {
      return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES];
    }

    // Buscar por patrones en el mensaje
    for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private async showErrorAlert(
    message: string,
    enableRetry: boolean,
    retryCallback?: () => Promise<void>,
    errorId?: string
  ): Promise<void> {
    const buttons = [
      { text: 'Entendido', style: 'cancel' as const }
    ];

    if (enableRetry && retryCallback) {
      buttons.unshift({
        text: 'Reintentar',
        onPress: async () => {
          try {
            await retryCallback();
            if (errorId) {
              await errorLogger.resolveError(errorId);
            }
          } catch (retryError) {
            await this.handleError(retryError as Error, {
              customMessage: 'Error al reintentar la operación'
            });
          }
        }
      });
    }

    Alert.alert('Error', message, buttons);
  }

  private shouldAutoRecover(error: any): boolean {
    const message = this.getErrorMessage(error);
    const recoverablePatterns = [
      'ERR_ABORTED',
      'ERR_NETWORK',
      'network',
      'timeout',
      'unavailable'
    ];

    return recoverablePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private async attemptAutoRecovery(error: any, errorId: string): Promise<void> {
    const errorKey = this.getErrorMessage(error);
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= ERROR_HANDLER_CONFIG.maxAutoRetries) {
      console.log(`⚠️ Máximo de intentos de recuperación alcanzado para: ${errorKey}`);
      return;
    }

    this.retryAttempts.set(errorKey, attempts + 1);
    
    console.log(`🔄 Intentando recuperación automática (${attempts + 1}/${ERROR_HANDLER_CONFIG.maxAutoRetries})`);
    
    await this.delay(ERROR_HANDLER_CONFIG.retryDelay * (attempts + 1));
    
    // Aquí se podría implementar lógica específica de recuperación
    // Por ejemplo, reconectar a Firebase, refrescar tokens, etc.
  }

  private setupGlobalErrorHandling(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Errores no manejados
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason || 'Unhandled Promise Rejection', {
          severity: ErrorSeverity.HIGH,
          context: { type: 'unhandledrejection' }
        });
      });

      // Errores de JavaScript
      window.addEventListener('error', (event) => {
        this.handleError(event.error || event.message, {
          severity: ErrorSeverity.HIGH,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });
    }
  }

  private setupNetworkInterceptors(): void {
    // Interceptar fetch para manejo automático de errores de red
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch;
      
      window.fetch = async (input, init) => {
        try {
          const response = await originalFetch(input, init);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          await this.handleNetworkError(
            error as Error,
            typeof input === 'string' ? input : input.url,
            init?.method || 'GET'
          );
          throw error;
        }
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtener estadísticas de errores
  getErrorStats() {
    return {
      retryAttempts: Object.fromEntries(this.retryAttempts),
      loggerStats: errorLogger.getErrorStats()
    };
  }

  // Limpiar estadísticas
  clearStats() {
    this.retryAttempts.clear();
  }
}

// Instancia singleton
export const globalErrorHandler = new GlobalErrorHandler();

// Funciones de utilidad
export const handleError = (error: Error | string, options?: ErrorHandlingOptions) => {
  return globalErrorHandler.handleError(error, options);
};

export const handleFirebaseError = (error: FirebaseError, operation: string, options?: ErrorHandlingOptions) => {
  return globalErrorHandler.handleFirebaseError(error, operation, options);
};

export const handleNetworkError = (error: Error, url?: string, method?: string, options?: ErrorHandlingOptions) => {
  return globalErrorHandler.handleNetworkError(error, url, method, options);
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: ErrorHandlingOptions
) => {
  return globalErrorHandler.withErrorHandling(fn, options);
};

export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries?: number,
  options?: ErrorHandlingOptions
) => {
  return globalErrorHandler.withRetry(fn, maxRetries, options);
};

// Inicializar automáticamente
globalErrorHandler.initialize();

export default globalErrorHandler;