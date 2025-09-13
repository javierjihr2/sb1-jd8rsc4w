import { FirebaseError } from 'firebase/app';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { Platform } from 'react-native';

// Tipos de errores comunes de Firebase
export interface FirebaseErrorHandler {
  handleError: (error: any) => void;
  retryConnection: () => Promise<void>;
  isNetworkError: (error: any) => boolean;
}

// Códigos de error comunes de Firebase
const FIREBASE_ERROR_CODES = {
  NETWORK_ERROR: 'unavailable',
  PERMISSION_DENIED: 'permission-denied',
  UNAUTHENTICATED: 'unauthenticated',
  INVALID_API_KEY: 'invalid-api-key',
  QUOTA_EXCEEDED: 'resource-exhausted',
  OFFLINE: 'failed-precondition'
};

// Contador de reintentos
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export class FirebaseErrorManager implements FirebaseErrorHandler {
  private db: any;
  private isRetrying = false;

  constructor(database: any) {
    this.db = database;
  }

  handleError(error: any): void {
    console.group('🔥 Firebase Error Handler');
    console.error('Error details:', error);
    
    if (error instanceof FirebaseError) {
      this.handleFirebaseError(error);
    } else if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
    } else {
      this.handleGenericError(error);
    }
    
    console.groupEnd();
  }

  private handleFirebaseError(error: FirebaseError): void {
    switch (error.code) {
      case FIREBASE_ERROR_CODES.NETWORK_ERROR:
      case FIREBASE_ERROR_CODES.OFFLINE:
        console.warn('🌐 Error de conectividad detectado');
        this.scheduleRetry();
        break;
        
      case FIREBASE_ERROR_CODES.PERMISSION_DENIED:
        console.error('🚫 Error de permisos - verificar reglas de Firestore');
        break;
        
      case FIREBASE_ERROR_CODES.UNAUTHENTICATED:
        console.warn('🔐 Usuario no autenticado');
        break;
        
      case FIREBASE_ERROR_CODES.INVALID_API_KEY:
        console.error('🔑 API Key inválida - verificar configuración');
        break;
        
      case FIREBASE_ERROR_CODES.QUOTA_EXCEEDED:
        console.warn('📊 Cuota excedida - reducir frecuencia de requests');
        break;
        
      default:
        console.error('❌ Error Firebase no manejado:', error.code, error.message);
    }
  }

  private handleNetworkError(error: any): void {
    console.warn('🌐 Error de red detectado:', error.message);
    
    if (typeof window !== 'undefined') {
      if (!navigator.onLine) {
        console.log('📱 Dispositivo offline - esperando reconexión');
        this.waitForOnline();
      } else {
        this.scheduleRetry();
      }
    } else {
      this.scheduleRetry();
    }
  }

  private handleGenericError(error: any): void {
    console.error('❌ Error genérico:', error);
    
    // Verificar si es un error relacionado con Firebase Installations
    if (error.message && (
      error.message.includes('Firebase Installations') ||
      error.message.includes('installations') ||
      error.message.includes('auth/invalid-api-key') ||
      error.message.includes("Cannot read properties of undefined (reading 'token')") ||
      error.message.includes('reading \'token\'')
    )) {
      console.log('🚫 Error de Firebase Installations/token ignorado (servicio deshabilitado)');
      return;
    }
    
    // Verificar si es un error ERR_ABORTED
    if (error.message && (
      error.message.includes('ERR_ABORTED') ||
      error.message.includes('aborted') ||
      error.name === 'AbortError'
    )) {
      console.log('🚫 Error ERR_ABORTED ignorado (request cancelado)');
      return;
    }
    
    // Verificar si es un error de cliente offline
    if (error.message && (
      error.message.includes('client is offline') ||
      error.message.includes('Failed to get document because the client is offline')
    )) {
      console.log('📱 Cliente offline - usando datos en cache');
      return;
    }
    
    // Para otros errores, intentar reconectar
    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (this.isRetrying || retryCount >= MAX_RETRIES) {
      if (retryCount >= MAX_RETRIES) {
        console.warn(`⚠️ Máximo de reintentos alcanzado (${MAX_RETRIES})`);
        retryCount = 0; // Reset para futuros errores
      }
      return;
    }

    this.isRetrying = true;
    retryCount++;
    
    console.log(`🔄 Programando reintento ${retryCount}/${MAX_RETRIES} en ${RETRY_DELAY}ms`);
    
    setTimeout(() => {
      this.retryConnection();
    }, RETRY_DELAY * retryCount); // Backoff exponencial
  }

  private waitForOnline(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('🌐 Conexión restaurada - reintentando');
        window.removeEventListener('online', handleOnline);
        this.retryConnection();
      };
      
      window.addEventListener('online', handleOnline);
    }
  }

  async retryConnection(): Promise<void> {
    try {
      console.log('🔄 Reintentando conexión a Firestore...');
      
      // Deshabilitar y rehabilitar la red para forzar reconexión
      await disableNetwork(this.db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(this.db);
      
      console.log('✅ Reconexión exitosa');
      retryCount = 0; // Reset contador en caso de éxito
      this.isRetrying = false;
      
    } catch (error) {
      console.error('❌ Error en reintento de conexión:', error);
      this.isRetrying = false;
      
      // Si el reintento falla, programar otro
      if (retryCount < MAX_RETRIES) {
        this.scheduleRetry();
      }
    }
  }

  isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('err_aborted') ||
      errorCode.includes('unavailable') ||
      errorCode.includes('failed-precondition')
    );
  }
}

// Función helper para crear el manejador de errores
export const createFirebaseErrorHandler = (database: any): FirebaseErrorHandler => {
  return new FirebaseErrorManager(database);
};

// Función para configurar el manejo global de errores
export const setupGlobalErrorHandling = (errorHandler: FirebaseErrorHandler) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Capturar errores no manejados
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && (event.reason.code || event.reason.message)) {
        errorHandler.handleError(event.reason);
      }
    });
    
    // Capturar errores de JavaScript
    window.addEventListener('error', (event) => {
      if (event.error) {
        errorHandler.handleError(event.error);
      }
    });
  }
};