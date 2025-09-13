import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuración de Firebase corregida
export const firebaseConfig = {
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "squadgo-app",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:442519077443:web:3d4e9e034e222838230af6",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "squadgo-app.firebasestorage.app",
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDfY3FrK9baCrVhqhBpD2Zd7v2_oARFuX8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "squadgo-app.firebaseapp.com",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9NQKJ8QMHP",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "442519077443"
};

// Función para deshabilitar Firebase Installations problemático
if (typeof window !== 'undefined') {
  // Interceptar y bloquear requests problemáticos
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Bloquear Firebase Installations completamente
    if (url.includes('firebaseinstallations.googleapis.com') || 
        url.includes('firebase-installations') ||
        url.includes('/installations/')) {
      console.log('🚫 Firebase Installations request blocked:', url);
      return Promise.resolve(new Response('{}', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Mejorar requests de Firestore
    if (url.includes('firestore.googleapis.com')) {
      const enhancedInit = {
        ...init,
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
          'X-Goog-Api-Client': 'gl-js/ fire/10.7.1'
        }
      };
      return originalFetch.call(this, input, enhancedInit);
    }
    
    return originalFetch.call(this, input, init);
  };
  
  // Deshabilitar servicios problemáticos
  (window as any).FIREBASE_INSTALLATIONS_AUTH_TOKEN_TIMEOUT = 0;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

// Inicializar Firebase con manejo de errores
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App inicializada correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase App:', error);
  throw error;
}

// Inicializar Auth
const auth = getAuth(app);
console.log('✅ Firebase Auth inicializado');

// Inicializar Firestore con configuración optimizada
let db;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: false,
    experimentalAutoDetectLongPolling: true
  });
  console.log('✅ Firestore inicializado con configuración optimizada');
} catch (error) {
  console.warn('⚠️ Usando instancia existente de Firestore');
  db = getFirestore(app);
}

// Inicializar Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage inicializado');

// Inicializar Analytics solo si está soportado
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics inicializado');
    } else {
      console.log('⚠️ Firebase Analytics no soportado');
    }
  }).catch((error) => {
    console.warn('⚠️ Error inicializando Analytics:', error);
  });
}

// Función helper para operaciones seguras
export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    console.error('❌ Error en operación Firebase:', error);
    return fallback || null;
  }
};

export { auth, db, storage, analytics };
export default app;