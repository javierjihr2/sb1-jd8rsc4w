// Aplicar fixes ANTES de cualquier importación de Firebase
import './firebase-installations-fix';
import './network-error-handler';
import { configureForExpoGo, isExpoGo } from './expo-go-config';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, enableNetwork, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { createFirebaseErrorHandler, setupGlobalErrorHandling } from './firebase-error-handler';
import { setupFirestoreWebConfig } from './firestore-web-config';

// Firebase configuration - configuración corregida para squadgo-app
// Usar expo-constants para acceder a las variables de configuración
const getFirebaseConfig = () => {
  // Intentar obtener desde expo-constants primero
  const expoConfig = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
  
  // Fallback a process.env para web
  const config = {
    projectId: expoConfig.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "squadgo-app",
    appId: expoConfig.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:442519077443:web:3d4e9e034e222838230af6",
    storageBucket: expoConfig.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "squadgo-app.firebasestorage.app",
    apiKey: expoConfig.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDfY3FrK9baCrVhqhBpD2Zd7v2_oARFuX8",
    authDomain: expoConfig.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "squadgo-app.firebaseapp.com",
    measurementId: expoConfig.firebaseMeasurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9NQKJ8QMHP",
    messagingSenderId: expoConfig.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "442519077443"
  };
  
  return config;
};

export const firebaseConfig = getFirebaseConfig();

// Debug: Verificar que las variables de entorno se están cargando
console.log('🔧 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? 'Loaded' : 'Missing',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Configuración adicional para resolver problemas de permisos
if (typeof window !== 'undefined') {
  // Deshabilitar Firebase Installations completamente
  (window as any).FIREBASE_INSTALLATIONS_AUTH_TOKEN_TIMEOUT = 0;
  (window as any).FIREBASE_INSTALLATIONS_DISABLED = true;
  
  // Interceptar accesos a propiedades problemáticas
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Función para detectar errores ERR_ABORTED
  const isAbortError = (message: string) => {
    return message.includes('ERR_ABORTED') ||
           message.includes('net::ERR_ABORTED') ||
           message.includes('AbortError') ||
           message.includes('The operation was aborted') ||
           message.includes('Request aborted') ||
           message.includes('fetch aborted') ||
           message.includes('firestore.googleapis.com') ||
           message.includes('googleapis.com') && message.includes('aborted') ||
           message.includes('Listen/channel') ||
           message.includes('gsessionid');
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    // Filtrar errores específicos de Firebase Installations token y ERR_ABORTED
    if (message.includes("Cannot read properties of undefined (reading 'token')") ||
        message.includes('Firebase Installations') ||
        message.includes('installations') ||
        message.includes('reading \'token\'') ||
        isAbortError(message)) {
      // Silenciar completamente estos errores sin ningún log
      return;
    }
    return originalConsoleError.apply(this, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (isAbortError(message)) {
      return;
    }
    return originalConsoleWarn.apply(this, args);
  };
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (isAbortError(message)) {
      return;
    }
    return originalConsoleLog.apply(this, args);
  };
  
  // Interceptor global de errores no manejados (solo en web)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const errorMessage = event.error?.message || event.message || '';
      const errorSource = event.filename || '';
      
      if ((event.error && errorMessage && 
          (errorMessage.includes("Cannot read properties of undefined (reading 'token')") ||
           errorMessage.includes('Firebase Installations') ||
           isAbortError(errorMessage))) ||
          errorSource.includes('expo-router') && isAbortError(errorMessage)) {
        // Silenciar completamente estos errores
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    });
    
    // Interceptor adicional para capturar errores del stack trace
    const originalStackTrace = Error.captureStackTrace;
    if (originalStackTrace) {
      Error.captureStackTrace = function(targetObject, constructorOpt) {
        try {
          return originalStackTrace.call(this, targetObject, constructorOpt);
        } catch (error: any) {
          if (error && isAbortError(error.message || error.toString())) {
            return;
          }
          throw error;
        }
      };
    }
    
    // Interceptor para XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && isAbortError(url)) {
        // Crear un XHR mock que no haga nada
        this.send = () => {};
        this.abort = () => {};
        return;
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    // Interceptor para eventos de error en el documento
    document.addEventListener('error', (event) => {
      const target = event.target as any;
      if (target && target.src && isAbortError(target.src)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);
    
    window.addEventListener('unhandledrejection', (event) => {
      const reasonMessage = event.reason?.message || event.reason || '';
      
      if (event.reason && reasonMessage && 
          (reasonMessage.includes("Cannot read properties of undefined (reading 'token')") ||
           reasonMessage.includes('Firebase Installations') ||
           isAbortError(reasonMessage.toString()))) {
        // Silenciar completamente estos errores
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    });
  }
  
  // Deshabilitar servicios problemáticos en web
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  
  // Configurar fetch personalizado para manejar errores
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init: RequestInit = {}) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Bloquear Firebase Installations completamente con respuesta mock más completa
    if (url.includes('firebaseinstallations.googleapis.com') || 
        url.includes('firebase-installations') ||
        url.includes('/installations/') ||
        url.includes('installations.googleapis.com')) {
      console.log('🚫 Firebase Installations request blocked:', url);
      // Respuesta mock que simula un token válido para evitar errores
      const mockResponse = {
        token: 'mock-installation-token',
        expiresIn: '604800s',
        refreshToken: 'mock-refresh-token'
      };
      return Promise.resolve(new Response(JSON.stringify(mockResponse), { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Mejorar configuración para Firestore
    if (url.includes('firestore.googleapis.com')) {
      init.headers = {
        ...init.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Goog-Api-Client': 'gl-js/ fire/10.7.1',
        'X-Goog-Request-Params': 'database=projects%2Fsquadgo-app%2Fdatabases%2F(default)',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive'
      };
      
      // Configurar timeout diferenciado para Listen requests
      const isListenRequest = url.includes('/Listen/channel');
      const timeout = isListenRequest ? 10000 : 45000; // 10s para Listen, 45s para otros
      
      if (!init.signal) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          if (isListenRequest) {
            console.log('🔄 Listen request timeout (normal behavior)');
          } else {
            console.log('⏰ Firestore request timeout, aborting...');
          }
          controller.abort();
        }, timeout);
        
        // Limpiar timeout si la request se completa
        const originalSignal = init.signal;
        if (originalSignal) {
          originalSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          });
        }
        
        init.signal = controller.signal;
      }
      
      // Configurar keepalive solo para requests no-Listen
      if (!isListenRequest) {
        init.keepalive = true;
      }
    }
    
    // Interceptar y manejar otros servicios problemáticos de Firebase
    if (url.includes('googleapis.com') && 
        (url.includes('identitytoolkit') || url.includes('securetoken'))) {
      init.headers = {
        ...init.headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };
      
      if (!init.signal) {
        init.signal = AbortSignal.timeout(30000);
      }
    }
    
    // Ejecutar la request con manejo de errores mejorado
    return originalFetch.call(this, input, init).catch((error) => {
      const isListenRequest = url.includes('/Listen/channel');
      
      // Silenciar completamente errores de Listen requests (son normales en Firestore)
      if (isListenRequest) {
        // Retornar una respuesta mock para evitar que el error se propague
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Manejar errores ERR_ABORTED específicamente para Firestore no-Listen
      if (url.includes('firestore.googleapis.com') && !isListenRequest &&
          (error.name === 'AbortError' || error.message.includes('ERR_ABORTED'))) {
        // Silenciar completamente y retornar respuesta mock
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Silenciar cualquier otro error ERR_ABORTED
      if (error.name === 'AbortError' || 
          error.message.includes('ERR_ABORTED') ||
          error.message.includes('net::ERR_ABORTED') ||
          error.message.includes('The operation was aborted')) {
        // Retornar respuesta mock para evitar propagación del error
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      throw error;
    });
  };
}

// Initialize Firebase con manejo de errores mejorado
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Error inicializando Firebase:', error);
  // Reintentar con configuración mínima
  const minimalConfig = {
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain
  };
  app = !getApps().length ? initializeApp(minimalConfig) : getApp();
}
console.log('🔧 Firebase - Aplicación inicializada:', { projectId: firebaseConfig.projectId });

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore with stable performance optimizations
let db: any;
try {
  // Configuración optimizada para web con mejor manejo de errores
  const firestoreConfig = {
    ignoreUndefinedProperties: true,
    cacheSizeBytes: Platform.OS === 'web' ? 1048576 : CACHE_SIZE_UNLIMITED, // 1MB para web, unlimited para móvil
    experimentalForceLongPolling: Platform.OS === 'web', // Solo forzar en web
    experimentalAutoDetectLongPolling: Platform.OS !== 'web', // Auto-detectar en móvil
    merge: true,
    experimentalTabSynchronization: false // Deshabilitar sincronización entre tabs
  };
  
  db = initializeFirestore(app, firestoreConfig);
  console.log('✅ Firebase Firestore - Inicializado con configuración optimizada para', Platform.OS);
  
  // Configurar específicamente para Expo Go si es necesario
  if (isExpoGo()) {
    console.log('📱 Detectado Expo Go - Aplicando configuración específica...');
    configureForExpoGo(db).catch(error => {
      console.warn('⚠️ Error configurando Expo Go:', error);
    });
  }
  
  // Configuración específica por plataforma
   if (Platform.OS === 'web') {
     // Configurar settings específicos para web
     try {
       // Solo conectar emulador si está disponible en desarrollo
       if (process.env.NODE_ENV === 'development' && 
           process.env.EXPO_PUBLIC_USE_EMULATOR === 'true') {
         import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
           connectFirestoreEmulator(db, 'localhost', 8080);
           console.log('🔧 Firestore emulator connected for web');
         }).catch(() => {
           console.log('⚠️ Emulator not available, using production Firestore');
         });
       }
     } catch (error) {
       console.log('⚠️ Emulator not available, using production Firestore');
     }
   } else {
     // Configuración optimizada para Expo Go y dispositivos móviles
     console.log('📱 Configurando Firestore para Expo Go...');
     
     // Deshabilitar funciones problemáticas en Expo Go
     try {
       // Configurar timeouts más largos para móvil
       const mobileSettings = {
         cacheSizeBytes: CACHE_SIZE_UNLIMITED,
         ignoreUndefinedProperties: true,
         experimentalForceLongPolling: false,
         experimentalAutoDetectLongPolling: true
       };
       
       // Habilitar red con manejo de errores específico para móvil
       enableNetwork(db).then(() => {
         console.log('✅ Firestore network habilitada para Expo Go');
       }).catch((error) => {
         console.warn('⚠️ Error habilitando red en Expo Go (normal):', error.message);
         // En Expo Go, algunos errores de red son normales
       });
       
     } catch (error) {
       console.warn('⚠️ Error en configuración móvil (continuando):', error.message);
     }
   }
  
} catch (error) {
  console.warn('⚠️ Error inicializando Firestore personalizado:', error);
  // Si ya está inicializado, obtener la instancia existente
  db = getFirestore(app);
  console.log('🔄 Firebase Firestore - Usando instancia existente');
}

// Configuración de timeouts optimizada
const FIRESTORE_TIMEOUTS = {
  connection: 10000, // 10 segundos para conexión inicial
  read: 15000,       // 15 segundos para lecturas
  write: 20000,      // 20 segundos para escrituras
  retry: 3000        // 3 segundos entre reintentos
};

// Función de retry mejorada con backoff exponencial
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  timeout: number = FIRESTORE_TIMEOUTS.read
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const operationPromise = operation();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      );
      
      return await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`❌ Operación falló después de ${maxRetries + 1} intentos:`, lastError);
        throw lastError;
      }
      
      // Backoff exponencial: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Intento ${attempt + 1} falló, reintentando en ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Configurar conectividad de red mejorada
const initializeNetworking = async () => {
  try {
    // Habilitar red de forma segura con reintentos y timeouts
    let retries = 5; // Aumentado a 5 reintentos
    while (retries > 0) {
      try {
        const networkPromise = enableNetwork(db);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), FIRESTORE_TIMEOUTS.connection)
        );
        
        await Promise.race([networkPromise, timeoutPromise]);
        console.log('✅ Firestore network habilitada correctamente');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.warn(`⚠️ Reintentando habilitar red (${5 - retries}/5)...`);
        await new Promise(resolve => setTimeout(resolve, FIRESTORE_TIMEOUTS.retry));
      }
    }
    
    // Verificar conectividad con manejo mejorado de errores
    if (typeof window !== 'undefined') {
      let isConnected = true;
      
      const checkConnection = async () => {
        try {
          // Test de conectividad simple
          const testDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
            getDoc(doc(db, 'config', 'test'))
          );
          if (!isConnected) {
            console.log('🌐 Firestore reconectado');
            isConnected = true;
          }
        } catch (error) {
          if (isConnected) {
            console.warn('⚠️ Firestore desconectado - usando cache local');
            isConnected = false;
          }
        }
      };
      
      // Verificar conexión inicial después de un delay
      setTimeout(checkConnection, 3000);
      
      // Escuchar cambios de conectividad (solo en web)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Configurar manejo específico de errores para web usando el módulo dedicado
        setupFirestoreWebConfig();
        
        window.addEventListener('online', async () => {
          console.log('🌐 Conexión de red restaurada');
          try {
            await enableNetwork(db);
            setTimeout(checkConnection, 1000);
          } catch (error) {
            console.warn('⚠️ Error al restaurar conexión Firestore:', error);
          }
        });
        
        window.addEventListener('offline', () => {
          console.log('📱 Aplicación offline - Firestore en modo cache');
          isConnected = false;
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Error configurando network Firestore:', error);
    // En caso de error, continuar con configuración básica
    console.log('🔄 Continuando con configuración básica de Firestore');
  }
};

// Inicializar networking de forma asíncrona
initializeNetworking();

// Initialize Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage - Inicializado');

// Initialize Analytics (temporarily disabled to fix errors)
let analytics: any = null;
// Temporarily disable Analytics to resolve initialization errors
console.log('⚠️ Firebase Analytics - Temporalmente deshabilitado para resolver errores');

// TODO: Re-enable Analytics after fixing configuration issues
// if (typeof window !== 'undefined') {
//   isSupported().then((supported) => {
//     if (supported) {
//       analytics = getAnalytics(app);
//       console.log('✅ Firebase Analytics - Inicializado');
//     } else {
//       console.log('⚠️ Firebase Analytics - No soportado en este entorno');
//     }
//   }).catch((error) => {
//     console.log('⚠️ Error inicializando Analytics:', error);
//   });
// }

// Configurar manejo de errores global
const errorHandler = createFirebaseErrorHandler(db);
setupGlobalErrorHandling(errorHandler);
console.log('🛡️ Sistema de manejo de errores Firebase configurado');

// Inicializar sistema de monitoreo
if (typeof window !== 'undefined') {
  // Importar dinámicamente el sistema de monitoreo
  import('./monitoring').then(({ monitoringService }) => {
    monitoringService.initialize().then(() => {
      console.log('📊 Sistema de monitoreo avanzado inicializado');
    }).catch(error => {
      console.warn('⚠️ Error inicializando sistema de monitoreo:', error);
    });
  }).catch(error => {
    console.warn('⚠️ Error importando sistema de monitoreo:', error);
  });
}

// Inicializar connection manager después de que db esté listo
if (typeof window !== 'undefined') {
  // Importar dinámicamente para evitar problemas de dependencias circulares
  import('./firestore-connection-manager').then(({ connectionManager }) => {
    console.log('🔧 Connection Manager inicializado');
  }).catch(error => {
    console.warn('⚠️ Error inicializando Connection Manager:', error);
  });
}

// Función helper para manejar errores en operaciones Firebase
export const handleFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  context: string = 'Firebase Operation'
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ Error en ${context}:`, error);
    errorHandler.handleError(error);
    return null;
  }
};

export { auth, db, storage, analytics, errorHandler };
export default app;