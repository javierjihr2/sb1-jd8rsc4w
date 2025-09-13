// Configuración de Firebase para modo offline/desarrollo
// Este archivo permite que la app funcione sin conexión a Firebase

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración de Firebase
export const firebaseConfig = {
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "squadgo-app",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:442519077443:web:3d4e9e034e222838230af6",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "squadgo-app.firebasestorage.app",
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDfY3FrK9baCrVhqhBpD2Zd7v2_oARFuX8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "squadgo-app.firebaseapp.com",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9NQKJ8QMHP",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "442519077443"
};

// Configuración para modo offline
const OFFLINE_MODE = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
const USE_EMULATORS = false; // Cambiar a true si quieres usar emuladores locales

// Inicializar Firebase
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('✅ Firebase App inicializada (modo:', OFFLINE_MODE ? 'offline' : 'online', ')');
} catch (error) {
  console.error('❌ Error inicializando Firebase App:', error);
  // Crear una configuración mínima para desarrollo
  const minimalConfig = {
    projectId: 'demo-project',
    apiKey: 'demo-key',
    authDomain: 'demo.firebaseapp.com'
  };
  app = !getApps().length ? initializeApp(minimalConfig) : getApp();
  console.log('⚠️ Usando configuración mínima para desarrollo');
}

// Inicializar Auth
const auth = getAuth(app);
if (USE_EMULATORS && Platform.OS === 'web') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔧 Auth Emulator conectado');
  } catch (error) {
    console.log('⚠️ No se pudo conectar al Auth Emulator');
  }
}

// Inicializar Firestore con configuración offline
let db;
try {
  db = getFirestore(app);
  
  if (USE_EMULATORS && Platform.OS === 'web') {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔧 Firestore Emulator conectado');
    } catch (error) {
      console.log('⚠️ No se pudo conectar al Firestore Emulator');
    }
  }
  
  // Configurar modo offline si es necesario
  if (OFFLINE_MODE) {
    disableNetwork(db).then(() => {
      console.log('📴 Firestore configurado en modo offline');
    }).catch(() => {
      console.log('⚠️ Firestore ya estaba offline o no se pudo configurar');
    });
  }
  
  console.log('✅ Firestore inicializado');
} catch (error) {
  console.error('❌ Error inicializando Firestore:', error);
  // Crear un mock de Firestore para desarrollo
  db = null;
}

// Inicializar Storage
let storage;
try {
  storage = getStorage(app);
  
  if (USE_EMULATORS && Platform.OS === 'web') {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔧 Storage Emulator conectado');
    } catch (error) {
      console.log('⚠️ No se pudo conectar al Storage Emulator');
    }
  }
  
  console.log('✅ Storage inicializado');
} catch (error) {
  console.error('❌ Error inicializando Storage:', error);
  storage = null;
}

// Funciones de utilidad para manejo offline
export const offlineUtils = {
  // Verificar si estamos en modo offline
  isOffline: () => OFFLINE_MODE,
  
  // Habilitar red cuando sea necesario
  enableNetwork: async () => {
    if (db) {
      try {
        await enableNetwork(db);
        console.log('🌐 Red habilitada');
        return true;
      } catch (error) {
        console.log('⚠️ Error habilitando red:', error);
        return false;
      }
    }
    return false;
  },
  
  // Deshabilitar red para modo offline
  disableNetwork: async () => {
    if (db) {
      try {
        await disableNetwork(db);
        console.log('📴 Red deshabilitada');
        return true;
      } catch (error) {
        console.log('⚠️ Error deshabilitando red:', error);
        return false;
      }
    }
    return false;
  },
  
  // Guardar datos localmente
  saveLocal: async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando localmente:', error);
      return false;
    }
  },
  
  // Cargar datos locales
  loadLocal: async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error cargando datos locales:', error);
      return null;
    }
  }
};

// Exportar instancias
export { app, auth, db, storage };
export default { app, auth, db, storage, offlineUtils };