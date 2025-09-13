import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  setDoc,
  DocumentReference,
  CollectionReference,
  Query,
  DocumentData,
  UpdateData,
  SetOptions
} from 'firebase/firestore';
import { connectionManager, isFirestoreConnected, waitForFirestoreConnection } from './firestore-connection-manager';
import { handleNetworkError, isAbortedError, isConnectivityError } from './network-error-handler';

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
};

// Función para esperar con backoff exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para calcular el delay con backoff exponencial
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Agregar jitter para evitar thundering herd
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
};

// Función para determinar si un error es recuperable
const isRetryableError = (error: any): boolean => {
  const retryableErrors = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'ERR_ABORTED',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'cancelled',
    'unknown',
    'failed-precondition'
  ];
  
  const errorCode = error?.code?.toLowerCase() || '';
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // No reintentar errores de permisos o autenticación
  const nonRetryableErrors = [
    'permission-denied',
    'unauthenticated',
    'not-found',
    'already-exists',
    'invalid-argument'
  ];
  
  const isNonRetryable = nonRetryableErrors.some(nonRetryableError => 
    errorCode.includes(nonRetryableError)
  );
  
  if (isNonRetryable) {
    return false;
  }
  
  // Verificar errores específicos que deben ser ignorados
  if (errorMessage.includes('firebase installations') ||
      errorMessage.includes('reading \'token\'') ||
      errorMessage.includes('client is offline')) {
    return false;
  }
  
  return retryableErrors.some(retryableError => 
    errorCode.includes(retryableError) || errorMessage.includes(retryableError)
  );
};

// Función genérica para ejecutar operaciones con reintentos
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'firestore_operation',
  maxRetries: number = 3
): Promise<T> => {
  // Usar el network error handler para manejar la operación
  return handleNetworkError(async () => {
    // Verificar conectividad antes de intentar la operación
    if (!connectionManager.getConnectionState().isConnected) {
      console.log(`🌐 Sin conectividad para ${operationName}, intentando reconectar...`);
      await connectionManager.forceReconnect();
    }

    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      // Filtrar errores específicos que no deben ser manejados aquí
      if (error?.message) {
        const message = error.message.toLowerCase();
        
        // Ignorar errores de Firebase Installations y ERR_ABORTED
        if (message.includes('firebase installations') ||
            message.includes('reading \'token\'') ||
            isAbortedError(error)) {
          // Para getDoc, devolver null en lugar de fallar
          if (operationName.includes('getDoc') || operationName.includes('get_doc')) {
            console.log(`🔄 ${operationName} - Error filtrado, devolviendo null:`, message);
            return null as T;
          }
        }
      }
      
      // Si es un error de conectividad, intentar reconectar
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || isConnectivityError(error)) {
        console.log(`🌐 Error de conectividad en ${operationName}, reconectando...`);
        await connectionManager.forceReconnect();
      }
      
      throw error;
    }
  }, operationName, { maxRetries, baseDelay: 1000 });
};

// Funciones wrapper para operaciones de Firestore con manejo de errores
export const safeAddDoc = async (
  reference: CollectionReference<DocumentData>,
  data: DocumentData,
  context?: string
) => {
  const collectionPath = reference.path || 'unknown collection';
  const contextInfo = context ? `${context} - ${collectionPath}` : collectionPath;
  
  return executeWithRetry(
    () => addDoc(reference, data),
    `addDoc - ${contextInfo}`,
    RETRY_CONFIG.maxRetries
  );
};

export const safeUpdateDoc = async (
  reference: DocumentReference<DocumentData>,
  data: UpdateData<DocumentData>,
  context?: string
) => {
  const docPath = reference.path || 'unknown path';
  const contextInfo = context ? `${context} - ${docPath}` : docPath;
  
  return executeWithRetry(
    () => updateDoc(reference, data),
    `updateDoc - ${contextInfo}`,
    RETRY_CONFIG.maxRetries
  );
};

export const safeDeleteDoc = async (
  reference: DocumentReference<DocumentData>
) => {
  return executeWithRetry(
    () => deleteDoc(reference),
    'deleteDoc',
    RETRY_CONFIG.maxRetries
  );
};

export const safeGetDoc = async (
  reference: DocumentReference<DocumentData>,
  context?: string
) => {
  const docPath = reference.path || 'unknown path';
  const contextInfo = context ? `${context} - ${docPath}` : docPath;
  
  return executeWithRetry(
    () => getDoc(reference),
    `getDoc - ${contextInfo}`,
    RETRY_CONFIG.maxRetries
  );
};

export const safeGetDocs = async (
  query: Query<DocumentData>,
  context?: string
) => {
  return executeWithRetry(
    () => getDocs(query),
    `getDocs - ${context || 'query operation'}`,
    RETRY_CONFIG.maxRetries
  );
};

export const safeSetDoc = async (
  reference: DocumentReference<DocumentData>,
  data: DocumentData,
  options?: SetOptions,
  context?: string
) => {
  const docPath = reference.path || 'unknown path';
  const contextInfo = context ? `${context} - ${docPath}` : docPath;
  
  return executeWithRetry(
    () => setDoc(reference, data, options),
    `setDoc - ${contextInfo}`,
    RETRY_CONFIG.maxRetries
  );
};

// Función para manejar errores de Firestore de manera consistente
export const handleFirestoreError = (error: any, operation: string) => {
  console.error(`🔥 Error en operación Firestore (${operation}):`, {
    code: error?.code,
    message: error?.message,
    stack: error?.stack
  });
  
  // Mapear códigos de error a mensajes amigables
  const errorMessages: { [key: string]: string } = {
    'permission-denied': 'No tienes permisos para realizar esta acción',
    'not-found': 'El documento solicitado no existe',
    'already-exists': 'El documento ya existe',
    'resource-exhausted': 'Se ha excedido el límite de recursos. Intenta más tarde',
    'failed-precondition': 'La operación no se puede completar en el estado actual',
    'aborted': 'La operación fue cancelada. Intenta nuevamente',
    'out-of-range': 'Los datos están fuera del rango válido',
    'unimplemented': 'Esta operación no está implementada',
    'internal': 'Error interno del servidor. Intenta más tarde',
    'unavailable': 'El servicio no está disponible. Intenta más tarde',
    'data-loss': 'Se perdieron datos de manera irrecuperable',
    'unauthenticated': 'Debes iniciar sesión para realizar esta acción',
    'deadline-exceeded': 'La operación tardó demasiado. Intenta nuevamente'
  };
  
  const userMessage = errorMessages[error?.code] || 'Error desconocido. Intenta nuevamente';
  
  return userMessage;
};

// Función para verificar conectividad con Firestore
export const checkFirestoreConnectivity = async (): Promise<boolean> => {
  try {
    // Intentar una operación simple para verificar conectividad
    const { db } = await import('./firebase');
    const { doc } = await import('firebase/firestore');
    
    await executeWithRetry(
      () => getDoc(doc(db, 'connectivity_test', 'ping')),
      'connectivity check'
    );
    
    console.log('✅ Conectividad con Firestore verificada');
    return true;
  } catch (error) {
    console.warn('⚠️ Problema de conectividad con Firestore:', error);
    return false;
  }
};

// Función para diagnosticar problemas de Firestore
export const diagnoseFirestoreIssues = async (context: string = 'general'): Promise<void> => {
  console.log(`🔍 Diagnosticando problemas de Firestore (${context})...`);
  
  try {
    // Verificar conectividad básica
    const isConnected = await checkFirestoreConnectivity();
    if (!isConnected) {
      console.error('❌ Sin conectividad con Firestore');
      return;
    }
    
    // Verificar autenticación
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('⚠️ Usuario no autenticado');
    } else {
      console.log('✅ Usuario autenticado:', user.uid);
    }
    
    // Verificar permisos básicos
    try {
      const { db } = await import('./firebase');
      const { doc } = await import('firebase/firestore');
      const testRef = doc(db, 'users', user?.uid || 'test');
      await getDoc(testRef);
      console.log('✅ Permisos de lectura verificados');
    } catch (permError: any) {
      console.warn('⚠️ Problema de permisos:', permError.code);
    }
    
  } catch (error: any) {
    console.error('❌ Error durante diagnóstico:', {
      code: error?.code,
      message: error?.message,
      context
    });
  }
};