'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  url: string;
  data: any;
  method?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  isOnline: boolean;
  pendingActions: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
}

const STORAGE_KEY = 'squadup_offline_actions';
const SYNC_STATUS_KEY = 'squadup_sync_status';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingActions: 0,
    lastSyncTime: null,
    syncInProgress: false
  });
  
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const { toast } = useToast();
  const serviceWorkerRef = useRef<ServiceWorker | null>(null);

  // Load pending actions from localStorage
  const loadPendingActions = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const actions = stored ? JSON.parse(stored) : [];
      setPendingActions(actions);
      
      const statusStored = localStorage.getItem(SYNC_STATUS_KEY);
      const status = statusStored ? JSON.parse(statusStored) : {};
      
      setSyncStatus(prev => ({
        ...prev,
        pendingActions: actions.length,
        lastSyncTime: status.lastSyncTime || null
      }));
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }, []);

  // Save pending actions to localStorage
  const savePendingActions = useCallback((actions: OfflineAction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
      setPendingActions(actions);
      setSyncStatus(prev => ({ ...prev, pendingActions: actions.length }));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }, []);

  // Add offline action
  const addOfflineAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    url: string,
    data: any,
    method: string = 'POST'
  ): Promise<string> => {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      url,
      data,
      method,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    const updatedActions = [...pendingActions, action];
    savePendingActions(updatedActions);
    
    console.log(`📝 Acción ${type} agregada a cola offline para ${url}`);
    
    // Show offline notification
    toast({
      title: "Acción guardada offline",
      description: `Se sincronizará cuando haya conexión disponible`,
      duration: 3000
    });
    
    // Try to sync immediately if online
    if (syncStatus.isOnline) {
      await syncPendingActions();
    }
    
    return action.id;
  }, [pendingActions, savePendingActions, syncStatus.isOnline, toast]);

  // Execute a single action
  const executeAction = useCallback(async (action: OfflineAction): Promise<void> => {
    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  // Sync all pending actions
  const syncPendingActions = useCallback(async (): Promise<void> => {
    if (!syncStatus.isOnline || syncStatus.syncInProgress || pendingActions.length === 0) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    
    console.log(`🔄 Iniciando sincronización de ${pendingActions.length} acciones...`);
    
    const actionsToProcess = [...pendingActions];
    const successfulActionIds: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        await executeAction(action);
        successfulActionIds.push(action.id);
        console.log(`✅ Acción ${action.type} sincronizada exitosamente`);
      } catch (error) {
        console.error(`❌ Error sincronizando acción ${action.type}:`, error);
        
        action.retryCount++;
        if (action.retryCount < action.maxRetries) {
          failedActions.push(action);
        } else {
          console.error(`🚫 Acción ${action.id} falló después de ${action.maxRetries} intentos`);
          // Remove permanently failed actions
        }
      }
    }

    // Update pending actions (remove successful, keep failed for retry)
    const remainingActions = failedActions;
    savePendingActions(remainingActions);

    // Update sync status
    const newSyncStatus = {
      lastSyncTime: Date.now(),
      pendingActions: remainingActions.length
    };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(newSyncStatus));
    
    setSyncStatus(prev => ({
      ...prev,
      syncInProgress: false,
      lastSyncTime: newSyncStatus.lastSyncTime,
      pendingActions: newSyncStatus.pendingActions
    }));

    // Show success notification
    if (successfulActionIds.length > 0) {
      toast({
        title: "Sincronización completada",
        description: `${successfulActionIds.length} acciones sincronizadas exitosamente`,
        duration: 3000
      });
    }

    console.log(`🎯 Sincronización completada: ${successfulActionIds.length} exitosas, ${failedActions.length} fallidas`);
  }, [syncStatus, pendingActions, executeAction, savePendingActions, toast]);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    savePendingActions([]);
    localStorage.removeItem(SYNC_STATUS_KEY);
    setSyncStatus(prev => ({
      ...prev,
      pendingActions: 0,
      lastSyncTime: null
    }));
  }, [savePendingActions]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (pendingActions.length === 0) {
      toast({
        title: "No hay acciones pendientes",
        description: "Todas las acciones están sincronizadas",
        duration: 2000
      });
      return;
    }
    
    await syncPendingActions();
  }, [pendingActions.length, syncPendingActions, toast]);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    const { data } = event;
    
    switch (data.type) {
      case 'GET_PENDING_ACTIONS':
        // Send pending actions to service worker
        event.ports[0].postMessage({ actions: pendingActions });
        break;
        
      case 'REMOVE_PENDING_ACTION':
        // Remove action after successful sync
        const updatedActions = pendingActions.filter(action => action.id !== data.actionId);
        savePendingActions(updatedActions);
        break;
        
      case 'SYNC_COMPLETE':
        // Handle sync completion from service worker
        toast({
          title: "Sincronización en segundo plano completada",
          description: `${data.syncedCount} acciones sincronizadas`,
          duration: 3000
        });
        break;
    }
  }, [pendingActions, savePendingActions, toast]);

  // Setup effects
  useEffect(() => {
    loadPendingActions();
    
    // Network status listeners
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      console.log('📶 Conexión restaurada, iniciando sincronización...');
      syncPendingActions();
      
      // Register background sync if service worker is available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('offline-sync');
        }).catch(error => {
          console.error('Background sync registration failed:', error);
        });
      }
    };
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      console.log('📵 Conexión perdida, modo offline activado');
      
      toast({
        title: "Modo offline activado",
        description: "Las acciones se guardarán para sincronizar más tarde",
        duration: 4000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Get service worker reference
      navigator.serviceWorker.ready.then(registration => {
        serviceWorkerRef.current = registration.active;
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [loadPendingActions, syncPendingActions, handleServiceWorkerMessage, toast]);

  return {
    syncStatus,
    pendingActions,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    forceSync
  };
}

export default useOfflineSync;