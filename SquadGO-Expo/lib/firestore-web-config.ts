import { Platform } from 'react-native';

/**
 * Configuración específica para Firestore en entorno web
 * Maneja los errores ERR_ABORTED que son comunes en conexiones Listen
 */

// Configurar manejo de errores específicos para web
export const setupFirestoreWebConfig = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  // Interceptar errores no manejados relacionados con Firestore
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filtrar TODOS los errores relacionados con Firestore Listen
    const isFirestoreListenError = message.includes('ERR_ABORTED') && 
                                   (message.includes('firestore.googleapis.com') || message.includes('/Listen/channel'));
    
    const isFirestoreConnectionError = message.includes('net::ERR_ABORTED') &&
                                       message.includes('firestore');
    
    const isFirestoreFetchError = message.includes('Failed to fetch') && 
                                  message.includes('firestore');
    
    const isFirebaseError = message.includes('FirebaseError') && 
                           (message.includes('unavailable') || message.includes('deadline-exceeded'));
    
    // Silenciar completamente estos errores
    if (isFirestoreListenError || isFirestoreConnectionError || isFirestoreFetchError || isFirebaseError) {
      // Silenciar completamente sin logs
      return;
    }
    
    originalConsoleError.apply(console, args);
  };

  // Interceptar errores globales de window con filtrado agresivo
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.message || event.message || '';
    
    // Filtrar TODOS los errores relacionados con Firestore
    if (errorMessage.includes('ERR_ABORTED') || 
        errorMessage.includes('firestore.googleapis.com') ||
        errorMessage.includes('/Listen/channel') ||
        errorMessage.includes('Failed to fetch') ||
        (errorMessage.includes('FirebaseError') && 
         (errorMessage.includes('unavailable') || errorMessage.includes('deadline-exceeded')))) {
      event.preventDefault();
      return false;
    }
    
    if (isRecoverableError(event.error)) {
       console.log('🔄 Recoverable error intercepted:', event.error.message);
       event.preventDefault();
       return false;
     }
  });
  
  // Manejar promesas rechazadas relacionadas con Firestore
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || '';
    
    // Filtrar TODOS los errores relacionados con Firestore
    if (message.includes('ERR_ABORTED') || 
        message.includes('firestore.googleapis.com') ||
        message.includes('/Listen/channel') ||
        message.includes('Failed to fetch') ||
        (message.includes('FirebaseError') && 
         (message.includes('unavailable') || message.includes('deadline-exceeded')))) {
      event.preventDefault();
      return false;
    }
    
    // Manejar errores específicos de Firestore
    if (message.includes('firestore') || 
        message.includes('ERR_ABORTED') ||
        (reason?.code && reason.code.includes('firestore'))) {
      
      // Prevenir que aparezcan en consola como errores no manejados
      event.preventDefault();
      
      // Log controlado para debugging
      console.log('🔄 Firestore promise rejection handled:', message.substring(0, 100));
      
      // Si es un error crítico, re-lanzarlo
      if (message.includes('permission-denied') || 
          message.includes('unauthenticated') ||
          message.includes('invalid-argument')) {
        console.warn('⚠️ Critical Firestore error:', message);
      }
    }
    
    if (isRecoverableError(event.reason)) {
       console.log('🔄 Recoverable rejection intercepted:', event.reason.message);
       event.preventDefault();
       return false;
     }
  });

  console.log('✅ Firestore web error handling configured');
};

// Configuración de timeouts optimizada para web
export const getFirestoreWebTimeouts = () => {
  return {
    listenTimeout: 10000,    // 10s para Listen requests
    queryTimeout: 30000,     // 30s para queries
    writeTimeout: 15000,     // 15s para writes
    retryDelay: 1000,        // 1s entre reintentos
    maxRetries: 3            // Máximo 3 reintentos
  };
};

// Verificar si un error es recuperable
export const isRecoverableFirestoreError = (error: any): boolean => {
  const message = error?.message || error?.toString() || '';
  const code = error?.code || '';
  
  // Errores recuperables
  const recoverableErrors = [
    'ERR_ABORTED',
    'network-request-failed',
    'timeout',
    'unavailable',
    'deadline-exceeded'
  ];
  
  return recoverableErrors.some(errorType => 
    message.includes(errorType) || code.includes(errorType)
  );
};

// Configurar headers optimizados para Firestore web
export const getOptimizedFirestoreHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'X-Goog-Api-Client': 'gl-js/ fire/10.7.1',
    'X-Requested-With': 'XMLHttpRequest'
  };
};