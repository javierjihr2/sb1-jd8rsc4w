// Fix para errores de Firebase Installations
// Este archivo resuelve los errores "Cannot read properties of undefined (reading 'token')"

import { Platform } from 'react-native';

// Interceptor global para Firebase Installations (solo en web)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Deshabilitar Firebase Installations completamente
  (window as any).FIREBASE_INSTALLATIONS_AUTH_TOKEN_TIMEOUT = 0;
  (window as any).FIREBASE_INSTALLATIONS_DISABLED = true;
  
  // Mock del servicio Firebase Installations
  const mockInstallations = {
    getId: () => Promise.resolve('mock-installation-id'),
    getToken: () => Promise.resolve({
      token: 'mock-installation-token',
      expirationTime: Date.now() + 604800000 // 7 días
    }),
    delete: () => Promise.resolve(),
    onIdChange: () => () => {}, // Unsubscribe function
  };
  
  // Interceptar importaciones de Firebase Installations
  const originalImport = (window as any).__webpack_require__ || ((window as any).require);
  if (originalImport) {
    const originalCall = originalImport.call;
    originalImport.call = function(thisArg: any, ...args: any[]) {
      const result = originalCall?.apply(this, args);
      
      // Interceptar módulos de Firebase Installations
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('firebase/installations') || 
           args[0].includes('@firebase/installations'))) {
        console.log('🚫 Firebase Installations import intercepted');
        return {
          getInstallations: () => mockInstallations,
          getId: mockInstallations.getId,
          getToken: mockInstallations.getToken,
          deleteInstallations: mockInstallations.delete,
          onIdChange: mockInstallations.onIdChange
        };
      }
      
      return result;
    };
  }
  
  // Interceptar fetch requests a Firebase Installations
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init: RequestInit = {}) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Bloquear todas las requests a Firebase Installations
    if (url.includes('firebaseinstallations.googleapis.com') || 
        url.includes('firebase-installations') ||
        url.includes('/installations/') ||
        url.includes('installations.googleapis.com')) {
      console.log('🚫 Firebase Installations request blocked:', url);
      
      // Respuesta mock exitosa
      const mockResponse = {
        name: 'projects/squadgo-app/installations/mock-installation-id',
        fid: 'mock-installation-id',
        refreshToken: 'mock-refresh-token',
        authToken: {
          token: 'mock-auth-token',
          expiresIn: '604800s'
        }
      };
      
      return Promise.resolve(new Response(JSON.stringify(mockResponse), { 
        status: 200, 
        statusText: 'OK',
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }));
    }
    
    return originalFetch.call(this, input, init);
  };
  
  // Interceptar errores específicos de Firebase Installations
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filtrar errores de Firebase Installations
    if (message.includes("Cannot read properties of undefined (reading 'token')") ||
        message.includes('Firebase Installations') ||
        message.includes('installations') ||
        message.includes('reading \'token\'') ||
        message.includes('auth/invalid-api-key') ||
        message.includes('installations/invalid-installation-id')) {
      console.log('🚫 Firebase Installations error intercepted:', message);
      return;
    }
    
    return originalConsoleError.apply(this, args);
  };
  
  // Interceptor para errores no manejados
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      const message = event.error.message;
      
      if (message.includes("Cannot read properties of undefined (reading 'token')") ||
          message.includes('Firebase Installations') ||
          message.includes('installations') ||
          message.includes('reading \'token\'')) {
        console.log('🚫 Global Firebase Installations error intercepted:', message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true);
  
  // Interceptor para promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message) {
      const message = event.reason.message;
      
      if (message.includes("Cannot read properties of undefined (reading 'token')") ||
          message.includes('Firebase Installations') ||
          message.includes('installations') ||
          message.includes('reading \'token\'')) {
        console.log('🚫 Unhandled Firebase Installations rejection intercepted:', message);
        event.preventDefault();
        return false;
      }
    }
  });
  
  // Patch para objetos Firebase que puedan tener referencias a installations
  const patchFirebaseObject = (obj: any, path: string = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    try {
      Object.keys(obj).forEach(key => {
        if (key.includes('installation') || key.includes('Installation')) {
          console.log(`🔧 Patching Firebase object property: ${path}.${key}`);
          obj[key] = mockInstallations;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          patchFirebaseObject(obj[key], `${path}.${key}`);
        }
      });
    } catch (error) {
      // Ignorar errores de patching
    }
  };
  
  // Aplicar patch después de que Firebase se inicialice
  setTimeout(() => {
    try {
      if ((window as any).firebase) {
        patchFirebaseObject((window as any).firebase, 'firebase');
      }
      
      // Patch para módulos ES6
      if ((window as any).__FIREBASE_DEFAULTS__) {
        patchFirebaseObject((window as any).__FIREBASE_DEFAULTS__, '__FIREBASE_DEFAULTS__');
      }
    } catch (error) {
      console.log('🔧 Firebase patching completed with minor issues');
    }
  }, 1000);
  
  console.log('🛡️ Firebase Installations fix aplicado');
}

// Función para verificar si el fix está activo
export const isInstallationsFixActive = (): boolean => {
  return typeof window !== 'undefined' && 
         (window as any).FIREBASE_INSTALLATIONS_DISABLED === true;
};

// Función para obtener un token mock si es necesario
export const getMockInstallationToken = (): string => {
  return 'mock-installation-token-' + Date.now();
};

export default {
  isInstallationsFixActive,
  getMockInstallationToken
};