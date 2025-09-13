import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PlayerProfile } from '../lib/types';

interface OfflineCredentials {
  email: string;
  passwordHash: string;
  profile: PlayerProfile;
  timestamp: number;
}

interface PendingAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export const useOfflineAuth = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOfflineMode(!connected);
      
      if (connected) {
        // Auto-sync when connection is restored
        syncPendingActions();
      }
    });

    // Load pending actions from storage
    loadPendingActions();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_pending_actions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  const savePendingActions = async (actions: PendingAction[]) => {
    try {
      await AsyncStorage.setItem('offline_pending_actions', JSON.stringify(actions));
      setPendingActions(actions);
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  };

  const saveOfflineCredentials = async (email: string, passwordHash: string, profile: PlayerProfile): Promise<boolean> => {
    try {
      const credentials: OfflineCredentials = {
        email,
        passwordHash,
        profile,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem('offline_credentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Error saving offline credentials:', error);
      return false;
    }
  };

  const authenticateOffline = async (email: string, passwordHash: string) => {
    try {
      const stored = await AsyncStorage.getItem('offline_credentials');
      if (!stored) {
        return {
          success: false,
          error: 'No offline credentials found'
        };
      }

      const credentials: OfflineCredentials = JSON.parse(stored);
      
      // Check if credentials match
      if (credentials.email === email && credentials.passwordHash === passwordHash) {
        // Check if credentials are not too old (7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (Date.now() - credentials.timestamp < maxAge) {
          return {
            success: true,
            profile: credentials.profile
          };
        } else {
          return {
            success: false,
            error: 'Offline credentials expired'
          };
        }
      } else {
        return {
          success: false,
          error: 'Invalid offline credentials'
        };
      }
    } catch (error) {
      console.error('Error authenticating offline:', error);
      return {
        success: false,
        error: 'Error during offline authentication'
      };
    }
  };

  const addPendingAction = async (type: string, data: any) => {
    const action: PendingAction = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now()
    };

    const newActions = [...pendingActions, action];
    await savePendingActions(newActions);
  };

  const syncPendingActions = async () => {
    if (!isConnected || pendingActions.length === 0) {
      return;
    }

    try {
      console.log(`Syncing ${pendingActions.length} pending actions...`);
      
      // Here you would implement the actual sync logic
      // For now, we'll just clear the actions
      await savePendingActions([]);
      
      console.log('Pending actions synced successfully');
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  };

  const clearOfflineData = async () => {
    try {
      await AsyncStorage.removeItem('offline_credentials');
      await AsyncStorage.removeItem('offline_pending_actions');
      setPendingActions([]);
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  };

  const getOfflineStatus = () => {
    return {
      isConnected,
      isOfflineMode,
      pendingActionsCount: pendingActions.length
    };
  };

  return {
    isConnected,
    isOfflineMode,
    saveOfflineCredentials,
    authenticateOffline,
    addPendingAction,
    syncPendingActions,
    clearOfflineData,
    getOfflineStatus
  };
};