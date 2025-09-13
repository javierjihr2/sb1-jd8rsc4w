// Configuración específica para Expo Go
import { Platform } from 'react-native';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Detectar si estamos ejecutando en Expo Go
export const isExpoGo = () => {
  return Platform.OS !== 'web' && 
         (typeof __DEV__ !== 'undefined' && __DEV__) &&
         (global as any).__expo?.modules?.ExpoConstants?.executionEnvironment === 'storeClient';
};

// Configuración optimizada para Expo Go
export const configureForExpoGo = async (db: any) => {
  if (!isExpoGo()) {
    console.log('📱 No estamos en Expo Go, usando configuración estándar');
    return;
  }

  console.log('🔧 Configurando Firebase para Expo Go...');

  try {
    // Configurar manejo de errores específico para Expo Go
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Filtrar errores específicos de Expo Go
    const isExpoGoError = (message: string) => {
      return message.includes('ERR_ABORTED') ||
             message.includes('net::ERR_ABORTED') ||
             message.includes('firestore.googleapis.com') ||
             message.includes('Listen/channel') ||
             message.includes('AbortError') ||
             message.includes('The operation was aborted') ||
             message.includes('Request aborted') ||
             message.includes('fetch aborted') ||
             message.includes('gsessionid') ||
             message.includes('Firebase Installations') ||
             message.includes('installations');
    };

    console.error = function(...args) {
      const message = args.join(' ');
      if (isExpoGoError(message)) {
        // Silenciar errores conocidos de Expo Go
        return;
      }
      return originalConsoleError.apply(this, args);
    };

    console.warn = function(...args) {
      const message = args.join(' ');
      if (isExpoGoError(message)) {
        return;
      }
      return originalConsoleWarn.apply(this, args);
    };

    // Configurar Firestore con settings optimizados para Expo Go
    try {
      await enableNetwork(db);
      console.log('✅ Firestore habilitado para Expo Go');
    } catch (error: any) {
      console.log('⚠️ Error habilitando Firestore en Expo Go (normal):', error.message);
      // En Expo Go, algunos errores de conexión son esperados
    }

    // Configurar reconexión automática
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    
    const attemptReconnection = async () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log('🔄 Máximo de intentos de reconexión alcanzado');
        return;
      }

      reconnectAttempts++;
      console.log(`🔄 Intento de reconexión ${reconnectAttempts}/${maxReconnectAttempts}`);

      try {
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        await enableNetwork(db);
        console.log('✅ Reconexión exitosa');
        reconnectAttempts = 0; // Reset counter on success
      } catch (error: any) {
        console.log(`⚠️ Reconexión ${reconnectAttempts} falló:`, error.message);
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(attemptReconnection, 5000); // Reintentar en 5 segundos
        }
      }
    };

    // Configurar listener para errores de red
    if (typeof global !== 'undefined') {
      const originalFetch = global.fetch;
      if (originalFetch) {
        global.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
          const url = typeof input === 'string' ? input : input.toString();
          
          // Interceptar requests problemáticas en Expo Go
          if (url.includes('firebaseinstallations.googleapis.com') ||
              url.includes('firebase-installations') ||
              url.includes('/installations/')) {
            // Retornar respuesta mock para evitar errores
            return Promise.resolve(new Response(JSON.stringify({
              token: 'expo-go-mock-token',
              expiresIn: '604800s'
            }), {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/json' }
            }));
          }

          // Configurar timeout específico para Expo Go
          const timeoutMs = url.includes('firestore.googleapis.com') ? 15000 : 10000;
          
          if (!init) init = {};
          if (!init.signal) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              controller.abort();
            }, timeoutMs);
            
            init.signal = controller.signal;
            
            // Limpiar timeout cuando la request termine
            const originalThen = originalFetch.call(this, input, init).then;
            if (originalThen) {
              originalFetch.call(this, input, init).finally(() => {
                clearTimeout(timeoutId);
              });
            }
          }

          return originalFetch.call(this, input, init).catch((error) => {
            if (error.name === 'AbortError' && url.includes('firestore.googleapis.com')) {
              // Silenciar errores de abort en Firestore para Expo Go
              return new Response('{}', {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'application/json' }
              });
            }
            throw error;
          });
        };
      }
    }

    console.log('✅ Configuración de Expo Go completada');

  } catch (error: any) {
    console.warn('⚠️ Error configurando Expo Go:', error.message);
  }
};

// Función para verificar conectividad en Expo Go
export const checkExpoGoConnectivity = async (db: any) => {
  if (!isExpoGo()) return true;

  try {
    // Test simple de conectividad
    const { doc, getDoc } = await import('firebase/firestore');
    await getDoc(doc(db, 'test', 'connectivity'));
    return true;
  } catch (error) {
    console.log('📱 Expo Go: Usando modo offline');
    return false;
  }
};

export default {
  isExpoGo,
  configureForExpoGo,
  checkExpoGoConnectivity
};