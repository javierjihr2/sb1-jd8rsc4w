import { enableNetwork, disableNetwork, connectFirestoreEmulator } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';

// Configuración de conexión optimizada
const CONNECTION_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  healthCheckInterval: 30000, // 30 segundos
  connectionTimeout: 15000, // 15 segundos
};

// Estado de la conexión
interface ConnectionState {
  isConnected: boolean;
  isRetrying: boolean;
  lastError: Error | null;
  retryCount: number;
  lastHealthCheck: number;
}

class FirestoreConnectionManager {
  private state: ConnectionState = {
    isConnected: false,
    isRetrying: false,
    lastError: null,
    retryCount: 0,
    lastHealthCheck: 0
  };

  private healthCheckTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('🔧 Inicializando Firestore Connection Manager...');
    
    // Configurar listeners de red (solo en web)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }

    // Iniciar verificación de salud
    this.startHealthCheck();
    
    // Verificación inicial
    await this.checkConnection();
  }

  private handleNetworkChange(isOnline: boolean) {
    console.log(`🌐 Cambio de red detectado: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      this.retryConnection();
    } else {
      this.updateConnectionState(false, new Error('Network offline'));
    }
  }

  private startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.checkConnection();
    }, CONNECTION_CONFIG.healthCheckInterval);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Test simple de conectividad
      const testRef = doc(db, 'connectivity_test', 'ping');
      const startTime = Date.now();
      
      // Timeout personalizado
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_CONFIG.connectionTimeout);
      });
      
      await Promise.race([
        getDoc(testRef),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Firestore conectado (${duration}ms)`);
      
      this.updateConnectionState(true, null);
      this.state.lastHealthCheck = Date.now();
      return true;
      
    } catch (error: any) {
      console.warn('⚠️ Firestore desconectado:', error.message);
      this.updateConnectionState(false, error);
      return false;
    }
  }

  private updateConnectionState(connected: boolean, error: Error | null) {
    const wasConnected = this.state.isConnected;
    this.state.isConnected = connected;
    this.state.lastError = error;
    
    if (connected) {
      this.state.retryCount = 0;
      this.state.isRetrying = false;
    }
    
    // Notificar cambios de estado
    if (wasConnected !== connected) {
      this.notifyListeners(connected);
    }
  }

  private notifyListeners(connected: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error en listener de conexión:', error);
      }
    });
  }

  public async retryConnection(): Promise<boolean> {
    if (this.state.isRetrying) {
      console.log('🔄 Reintento ya en progreso...');
      return this.state.isConnected;
    }

    if (this.state.retryCount >= CONNECTION_CONFIG.maxRetries) {
      console.warn(`⚠️ Máximo de reintentos alcanzado (${CONNECTION_CONFIG.maxRetries})`);
      return false;
    }

    this.state.isRetrying = true;
    this.state.retryCount++;

    const delay = Math.min(
      CONNECTION_CONFIG.baseDelay * Math.pow(2, this.state.retryCount - 1),
      CONNECTION_CONFIG.maxDelay
    );

    console.log(`🔄 Reintentando conexión (${this.state.retryCount}/${CONNECTION_CONFIG.maxRetries}) en ${delay}ms`);

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Reiniciar conexión de red
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(db);
      
      // Verificar conexión
      const connected = await this.checkConnection();
      
      if (connected) {
        console.log('✅ Reconexión exitosa');
      } else {
        console.warn('❌ Reconexión fallida');
      }
      
      return connected;
      
    } catch (error: any) {
      console.error('❌ Error en reintento de conexión:', error);
      this.updateConnectionState(false, error);
      return false;
    } finally {
      this.state.isRetrying = false;
    }
  }

  public onConnectionChange(listener: (connected: boolean) => void) {
    this.listeners.push(listener);
    
    // Llamar inmediatamente con el estado actual
    listener(this.state.isConnected);
    
    // Retornar función para remover el listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getConnectionState(): Readonly<ConnectionState> {
    return { ...this.state };
  }

  public async forceReconnect(): Promise<boolean> {
    console.log('🔄 Forzando reconexión...');
    this.state.retryCount = 0;
    return this.retryConnection();
  }

  public destroy() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.listeners = [];
    console.log('🔧 Firestore Connection Manager destruido');
  }
}

// Instancia singleton
export const connectionManager = new FirestoreConnectionManager();

// Función helper para verificar si Firestore está conectado
export const isFirestoreConnected = (): boolean => {
  return connectionManager.getConnectionState().isConnected;
};

// Función helper para esperar a que Firestore se conecte
export const waitForFirestoreConnection = (timeout: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    const state = connectionManager.getConnectionState();
    
    if (state.isConnected) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      removeListener();
      resolve(false);
    }, timeout);

    const removeListener = connectionManager.onConnectionChange((connected) => {
      if (connected) {
        clearTimeout(timeoutId);
        removeListener();
        resolve(true);
      }
    });
  });
};

export default connectionManager;