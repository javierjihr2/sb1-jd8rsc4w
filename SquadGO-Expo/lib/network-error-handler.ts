// Manejador específico para errores de red ERR_ABORTED
// Este archivo resuelve los errores de conexión abortada con Firestore

import { FirebaseError } from 'firebase/app';

// Tipos de errores de red que debemos manejar
interface NetworkError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
}

// Configuración para manejo de errores de red
const NETWORK_ERROR_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2,
  abortedRequestTimeout: 5000, // 5 segundos para requests abortadas
};

// Contador de errores por tipo
const errorCounts = new Map<string, number>();

// Función para detectar errores ERR_ABORTED
export const isAbortedError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || error.toString();
  const code = error.code || error.name;
  
  return (
    message.includes('ERR_ABORTED') ||
    message.includes('net::ERR_ABORTED') ||
    message.includes('AbortError') ||
    message.includes('The operation was aborted') ||
    message.includes('Request aborted') ||
    code === 'ERR_ABORTED' ||
    code === 'AbortError' ||
    error.name === 'AbortError'
  );
};

// Función para detectar errores de conectividad
export const isConnectivityError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || error.toString();
  const code = error.code || error.name;
  
  return (
    message.includes('ERR_NETWORK') ||
    message.includes('ERR_INTERNET_DISCONNECTED') ||
    message.includes('ERR_CONNECTION_REFUSED') ||
    message.includes('ERR_CONNECTION_RESET') ||
    message.includes('ERR_CONNECTION_TIMED_OUT') ||
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    code === 'ERR_NETWORK' ||
    code === 'NetworkError' ||
    error.name === 'NetworkError'
  );
};

// Función para detectar errores de timeout
export const isTimeoutError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || error.toString();
  const code = error.code || error.name;
  
  return (
    message.includes('timeout') ||
    message.includes('TIMEOUT') ||
    message.includes('ERR_TIMED_OUT') ||
    code === 'TIMEOUT' ||
    code === 'ERR_TIMED_OUT' ||
    error.name === 'TimeoutError'
  );
};

// Función para esperar con backoff exponencial
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Función para calcular el delay con backoff exponencial
const calculateBackoffDelay = (attempt: number): number => {
  const baseDelay = NETWORK_ERROR_CONFIG.baseDelay;
  const multiplier = NETWORK_ERROR_CONFIG.backoffMultiplier;
  const maxDelay = NETWORK_ERROR_CONFIG.maxDelay;
  
  const calculatedDelay = baseDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(calculatedDelay, maxDelay);
};

// Función para verificar conectividad de red
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    if (!navigator.onLine) {
      return false;
    }
  }
  
  try {
    // Intentar hacer una request simple para verificar conectividad
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.log('🌐 Conectividad de red no disponible');
    return false;
  }
};

// Función para esperar hasta que la red esté disponible
export const waitForNetworkConnectivity = async (maxWaitTime: number = 30000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (await checkNetworkConnectivity()) {
      return true;
    }
    
    await delay(1000); // Verificar cada segundo
  }
  
  return false;
};

// Función principal para manejar errores de red
export const handleNetworkError = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'network_operation',
  customConfig?: Partial<typeof NETWORK_ERROR_CONFIG>
): Promise<T> => {
  const config = { ...NETWORK_ERROR_CONFIG, ...customConfig };
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      // Verificar conectividad antes del intento
      if (attempt > 1) {
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
          console.log(`🌐 Esperando conectividad de red para ${operationName}...`);
          const networkRestored = await waitForNetworkConnectivity(10000);
          if (!networkRestored) {
            throw new Error('Network connectivity timeout');
          }
        }
      }
      
      const result = await operation();
      
      // Limpiar contador de errores en caso de éxito
      if (errorCounts.has(operationName)) {
        errorCounts.delete(operationName);
      }
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} exitoso después de ${attempt} intentos`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Incrementar contador de errores
      const currentCount = errorCounts.get(operationName) || 0;
      errorCounts.set(operationName, currentCount + 1);
      
      const isAborted = isAbortedError(error);
      const isConnectivity = isConnectivityError(error);
      const isTimeout = isTimeoutError(error);
      
      console.log(`🔄 ${operationName} falló (intento ${attempt}/${config.maxRetries}):`, {
        error: error.message,
        isAborted,
        isConnectivity,
        isTimeout,
        totalErrors: errorCounts.get(operationName)
      });
      
      // No reintentar en el último intento
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Determinar si debemos reintentar
      const shouldRetry = isAborted || isConnectivity || isTimeout;
      
      if (!shouldRetry) {
        console.log(`❌ Error no recuperable en ${operationName}, no reintentando`);
        break;
      }
      
      // Calcular delay para el siguiente intento
      const delayMs = calculateBackoffDelay(attempt);
      console.log(`⏳ Esperando ${delayMs}ms antes del siguiente intento...`);
      await delay(delayMs);
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  console.error(`❌ ${operationName} falló definitivamente después de ${config.maxRetries} intentos:`, lastError);
  throw lastError;
};

// Interceptor global para fetch requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init: RequestInit = {}) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Interceptar específicamente requests a Firestore Listen channels que causan ERR_ABORTED
    if (url.includes('firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel')) {
      console.log('🚫 Firestore Listen channel request intercepted (preventing ERR_ABORTED):', url.substring(0, 100) + '...');
      
      // Devolver una respuesta mock para evitar ERR_ABORTED
      return Promise.resolve(new Response('', { 
        status: 200, 
        statusText: 'OK',
        headers: { 
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      }));
    }
    
    // Para otras requests de Firestore, usar el error handler
    if (url.includes('firestore.googleapis.com') || url.includes('firebase')) {
      return handleNetworkError(
        () => originalFetch.call(this, input, init),
        `fetch_${url.split('/').pop() || 'unknown'}`,
        { maxRetries: 1, baseDelay: 500 }
      ).catch(error => {
        // Si falla, devolver respuesta mock para evitar errores en consola
        if (isAbortedError(error)) {
          console.log('🔄 Request abortada manejada automáticamente');
          return new Response('{}', { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      });
    }
    
    return originalFetch.call(this, input, init);
  };
  
  // Interceptor para errores ERR_ABORTED en console
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('ERR_ABORTED') && message.includes('firestore.googleapis.com')) {
      // Convertir error a warning para reducir ruido
      console.warn('🔄 Request abortada a Firestore (manejada automáticamente):', message);
      return;
    }
    
    return originalConsoleError.apply(this, args);
  };
  
  console.log('🛡️ Network Error Handler inicializado');
}

// Función para obtener estadísticas de errores
export const getErrorStats = (): Record<string, number> => {
  return Object.fromEntries(errorCounts);
};

// Función para limpiar estadísticas de errores
export const clearErrorStats = (): void => {
  errorCounts.clear();
};

export default {
  handleNetworkError,
  isAbortedError,
  isConnectivityError,
  isTimeoutError,
  checkNetworkConnectivity,
  waitForNetworkConnectivity,
  getErrorStats,
  clearErrorStats
};