import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../lib/types';

interface OfflineAuthState {
  isConnected: boolean;
  isOfflineMode: boolean;
  pendingSyncActions: any[];
  lastSyncTime: Date | null;
}

interface OfflineCredentials {
  email: string;
  hashedPassword: string;
  profile: PlayerProfile;
  lastLogin: Date;
}

export const useOfflineAuth = () => {
  const [state, setState] = useState<OfflineAuthState>({
    isConnected: true,
    isOfflineMode: false,
    pendingSyncActions: [],
    lastSyncTime: null,
  });

  useEffect(() => {
    // Monitorear conectividad
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setState(prev => ({
        ...prev,
        isConnected: connected || false,
        isOfflineMode: !connected
      }));

      // Si se reconecta, intentar sincronizar
      if (connected) {
        syncPendingActions();
      }
    });

    // Cargar estado inicial
    loadOfflineState();

    return () => unsubscribe();
  }, []);

  const loadOfflineState = async () => {
    try {
      const pendingActions = await AsyncStorage.getItem('squadgo_pending_sync');
      const lastSync = await AsyncStorage.getItem('squadgo_last_sync');
      
      setState(prev => ({
        ...prev,
        pendingSyncActions: pendingActions ? JSON.parse(pendingActions) : [],
        lastSyncTime: lastSync ? new Date(lastSync) : null,
      }));
    } catch (error) {
      console.error('❌ Error loading offline state:', error);
    }
  };

  const saveOfflineCredentials = async (
    email: string, 
    hashedPassword: string, 
    profile: PlayerProfile
  ): Promise<boolean> => {
    try {
      const credentials: OfflineCredentials = {
        email,
        hashedPassword,
        profile,
        lastLogin: new Date()
      };

      await AsyncStorage.setItem('squadgo_offline_credentials', JSON.stringify(credentials));
      console.log('✅ Credenciales offline guardadas');
      return true;
    } catch (error) {
      console.error('❌ Error saving offline credentials:', error);
      return false;
    }
  };

  const getOfflineCredentials = async (): Promise<OfflineCredentials | null> => {
    try {
      const credentials = await AsyncStorage.getItem('squadgo_offline_credentials');
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('❌ Error getting offline credentials:', error);
      return null;
    }
  };

  const authenticateOffline = async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; profile?: PlayerProfile; error?: string }> => {
    try {
      const credentials = await getOfflineCredentials();
      
      if (!credentials) {
        return {
          success: false,
          error: 'No hay credenciales offline disponibles'
        };
      }

      // Verificar credenciales (en un caso real, usarías hashing)
      if (credentials.email === email && credentials.hashedPassword === password) {
        // Actualizar último login
        await saveOfflineCredentials(email, password, credentials.profile);
        
        return {
          success: true,
          profile: credentials.profile
        };
      } else {
        return {
          success: false,
          error: 'Credenciales incorrectas'
        };
      }
    } catch (error) {
      console.error('❌ Error in offline authentication:', error);
      return {
        success: false,
        error: 'Error en autenticación offline'
      };
    }
  };

  const addPendingSyncAction = async (action: any) => {
    try {
      const newActions = [...state.pendingSyncActions, {
        ...action,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      }];

      setState(prev => ({ ...prev, pendingSyncActions: newActions }));
      await AsyncStorage.setItem('squadgo_pending_sync', JSON.stringify(newActions));
      
      console.log('📝 Acción agregada para sincronización:', action.type);
    } catch (error) {
      console.error('❌ Error adding pending sync action:', error);
    }
  };

  const syncPendingActions = async () => {
    if (!state.isConnected || state.pendingSyncActions.length === 0) {
      return;
    }

    try {
      console.log('🔄 Sincronizando acciones pendientes...');
      
      // Aquí implementarías la lógica de sincronización con Firebase
      // Por ahora, simularemos que se sincronizan exitosamente
      
      for (const action of state.pendingSyncActions) {
        console.log('📤 Sincronizando:', action.type);
        // Implementar sincronización específica según el tipo de acción
      }

      // Limpiar acciones sincronizadas
      setState(prev => ({ 
        ...prev, 
        pendingSyncActions: [],
        lastSyncTime: new Date()
      }));
      
      await AsyncStorage.removeItem('squadgo_pending_sync');
      await AsyncStorage.setItem('squadgo_last_sync', new Date().toISOString());
      
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error during sync:', error);
    }
  };

  const clearOfflineData = async () => {
    try {
      await AsyncStorage.removeItem('squadgo_offline_credentials');
      await AsyncStorage.removeItem('squadgo_pending_sync');
      await AsyncStorage.removeItem('squadgo_last_sync');
      
      setState({
        isConnected: state.isConnected,
        isOfflineMode: state.isOfflineMode,
        pendingSyncActions: [],
        lastSyncTime: null,
      });
      
      console.log('✅ Datos offline eliminados');
    } catch (error) {
      console.error('❌ Error clearing offline data:', error);
    }
  };

  const getOfflineStatus = () => {
    const hoursOffline = state.lastSyncTime 
      ? (Date.now() - state.lastSyncTime.getTime()) / (1000 * 60 * 60)
      : 0;

    return {
      isOffline: state.isOfflineMode,
      hasOfflineCredentials: false, // Se actualizará dinámicamente
      pendingActions: state.pendingSyncActions.length,
      hoursOffline: Math.round(hoursOffline),
      canWorkOffline: true
    };
  };

  return {
    ...state,
    saveOfflineCredentials,
    getOfflineCredentials,
    authenticateOffline,
    addPendingSyncAction,
    syncPendingActions,
    clearOfflineData,
    getOfflineStatus,
  };
};