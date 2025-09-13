// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, type Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
// Firebase products for complete functionality

// Your web app's Firebase configuration
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log('🔧 Firebase - Aplicación inicializada:', { projectId: firebaseConfig.projectId });

const auth = getAuth(app);

// Configurar persistencia de autenticación ANTES de cualquier operación
if (typeof window !== 'undefined') {
  // Importar y configurar persistencia de forma síncrona
  import('firebase/auth').then(({ setPersistence, browserLocalPersistence, onAuthStateChanged }) => {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Firebase Auth - Persistencia configurada correctamente');
        
        // Verificar si hay una sesión existente después de configurar persistencia
        onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log('🔄 Firebase Auth - Sesión restaurada:', user.uid);
            // Guardar datos de usuario en localStorage como respaldo
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              lastLogin: Date.now()
            };
            localStorage.setItem('squadgo_user_backup', JSON.stringify(userData));
          }
        });
      })
      .catch((error) => {
        console.error('❌ Error configurando persistencia:', error);
        // Intentar recuperar desde localStorage si falla la persistencia
        const backupUser = localStorage.getItem('squadgo_user_backup');
        if (backupUser) {
          console.log('🔄 Intentando recuperar sesión desde backup...');
        }
      });
  });
}

console.log('🔧 Firebase Auth - Inicializado:', { authDomain: firebaseConfig.authDomain });

// Configurar Firestore con configuración optimizada para evitar errores de conexión
let db: Firestore;
try {
  // Configuración optimizada para reducir errores de red
  const firestoreSettings = {
    ignoreUndefinedProperties: true,
    experimentalAutoDetectLongPolling: false,
    cacheSizeBytes: 40000000, // 40MB cache
    experimentalForceLongPolling: false
  };
  
  db = initializeFirestore(app, firestoreSettings);
  console.log('🔧 Firestore - Inicializado con cache local y configuración optimizada');
    
} catch (error) {
  console.warn('⚠️ Firestore ya inicializado, usando instancia existente');
  db = getFirestore(app);
}

// Configurar manejo de errores de red para Firestore
if (typeof window !== 'undefined') {
  // Manejar errores de conexión de forma silenciosa
  window.addEventListener('online', () => {
    enableNetwork(db).catch(() => {});
  });
  
  window.addEventListener('offline', () => {
    disableNetwork(db).catch(() => {});
  });
}

const storage = getStorage(app);

// Messaging initialization
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, auth, db, storage, messaging };
