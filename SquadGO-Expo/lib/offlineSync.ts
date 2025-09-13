import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingActions: number;
  syncInProgress: boolean;
}

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncQueue: OfflineAction[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeNetworkListener();
    this.loadOfflineQueue();
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  private async initializeNetworkListener() {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        console.log('📶 Conexión restaurada, iniciando sincronización...');
        this.syncPendingActions();
      } else if (!this.isOnline) {
        console.log('📵 Conexión perdida, modo offline activado');
      }
      
      this.notifyListeners();
    });

    // Verificar estado inicial
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  private async loadOfflineQueue() {
    try {
      const queueData = await AsyncStorage.getItem('offline_sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        console.log(`📦 Cargadas ${this.syncQueue.length} acciones offline pendientes`);
      }
    } catch (error) {
      console.error('Error cargando cola offline:', error);
    }
  }

  private async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem('offline_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error guardando cola offline:', error);
    }
  }

  // Agregar acción a la cola offline
  async addOfflineAction(
    type: 'create' | 'update' | 'delete',
    collectionName: string,
    data: any,
    docId?: string
  ): Promise<string> {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      collection: collectionName,
      docId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.syncQueue.push(action);
    await this.saveOfflineQueue();
    
    console.log(`📝 Acción ${type} agregada a cola offline para ${collectionName}`);
    
    // Si estamos online, intentar sincronizar inmediatamente
    if (this.isOnline) {
      this.syncPendingActions();
    }
    
    this.notifyListeners();
    return action.id;
  }

  // Sincronizar acciones pendientes
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    console.log(`🔄 Iniciando sincronización de ${this.syncQueue.length} acciones...`);

    const actionsToProcess = [...this.syncQueue];
    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action);
        successfulActions.push(action.id);
        console.log(`✅ Acción ${action.type} sincronizada exitosamente`);
      } catch (error) {
        console.error(`❌ Error sincronizando acción ${action.type}:`, error);
        
        action.retryCount++;
        if (action.retryCount < action.maxRetries) {
          // Programar reintento con backoff exponencial
          const retryDelay = Math.pow(2, action.retryCount) * 1000; // 2s, 4s, 8s
          this.scheduleRetry(action, retryDelay);
        } else {
          console.error(`🚫 Acción ${action.id} falló después de ${action.maxRetries} intentos`);
          // Opcionalmente, mover a una cola de errores permanentes
        }
        
        failedActions.push(action);
      }
    }

    // Remover acciones exitosas de la cola
    this.syncQueue = this.syncQueue.filter(action => !successfulActions.includes(action.id));
    await this.saveOfflineQueue();

    // Actualizar timestamp de última sincronización
    await AsyncStorage.setItem('last_sync_time', Date.now().toString());

    this.syncInProgress = false;
    this.notifyListeners();

    console.log(`🎯 Sincronización completada: ${successfulActions.length} exitosas, ${failedActions.length} fallidas`);
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const collectionRef = collection(db, action.collection);

    switch (action.type) {
      case 'create':
        await addDoc(collectionRef, {
          ...action.data,
          createdAt: new Date(action.timestamp),
          syncedAt: new Date()
        });
        break;

      case 'update':
        if (!action.docId) throw new Error('DocId requerido para update');
        const updateRef = doc(db, action.collection, action.docId);
        await updateDoc(updateRef, {
          ...action.data,
          updatedAt: new Date(),
          syncedAt: new Date()
        });
        break;

      case 'delete':
        if (!action.docId) throw new Error('DocId requerido para delete');
        const deleteRef = doc(db, action.collection, action.docId);
        await deleteDoc(deleteRef);
        break;

      default:
        throw new Error(`Tipo de acción no soportado: ${action.type}`);
    }
  }

  private scheduleRetry(action: OfflineAction, delay: number) {
    const timeoutId: any = setTimeout(() => {
      if (this.isOnline) {
        this.syncPendingActions();
      }
      this.retryTimeouts.delete(action.id);
    }, delay);

    this.retryTimeouts.set(action.id, timeoutId);
  }

  // Obtener estado de sincronización
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncTime = await AsyncStorage.getItem('last_sync_time');
    
    return {
      isOnline: this.isOnline,
      lastSyncTime: lastSyncTime ? parseInt(lastSyncTime) : 0,
      pendingActions: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Suscribirse a cambios de estado
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar estado inicial
    this.getSyncStatus().then(listener);
    
    // Retornar función de desuscripción
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.getSyncStatus().then(status => {
      this.listeners.forEach(listener => listener(status));
    });
  }

  // Limpiar cola de sincronización (usar con cuidado)
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveOfflineQueue();
    this.notifyListeners();
    console.log('🗑️ Cola de sincronización limpiada');
  }

  // Forzar sincronización manual
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingActions();
    } else {
      throw new Error('No hay conexión a internet');
    }
  }
}

// Hook para usar el servicio de sincronización
export const useOfflineSync = () => {
  const syncService = OfflineSyncService.getInstance();
  
  return {
    addOfflineAction: syncService.addOfflineAction.bind(syncService),
    syncPendingActions: syncService.syncPendingActions.bind(syncService),
    getSyncStatus: syncService.getSyncStatus.bind(syncService),
    subscribe: syncService.subscribe.bind(syncService),
    clearSyncQueue: syncService.clearSyncQueue.bind(syncService),
    forceSync: syncService.forcSync.bind(syncService)
  };
};

export default OfflineSyncService;